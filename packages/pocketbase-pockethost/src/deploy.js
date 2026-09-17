import fs from "node:fs/promises";
import path from "node:path";
import SftpClient from "ssh2-sftp-client";
import { CommandError } from "./errors.js";
import { detectProjectSurface, resolveEnvironmentName, resolveHealthcheckBaseUrl, resolveTenantId } from "./project.js";

async function deployDirectory(client, localDir, remoteDir) {
  await client.uploadDir(localDir, remoteDir, { useFastput: false });
}

async function resolvePrivateKey() {
  const privateKey = process.env.POCKETHOST_SFTP_PRIVATE_KEY || "";
  if (privateKey) {
    return privateKey.replace(/\\n/g, "\n");
  }

  const privateKeyPath = process.env.POCKETHOST_SFTP_PRIVATE_KEY_PATH || "";
  if (!privateKeyPath) {
    return "";
  }

  try {
    return await fs.readFile(privateKeyPath, "utf8");
  } catch (error) {
    throw new CommandError(`Could not read POCKETHOST_SFTP_PRIVATE_KEY_PATH: ${error.message}`);
  }
}

export async function runHealthcheck(project, environmentName) {
  const tenantId = resolveTenantId(project, environmentName);
  const baseUrl = resolveHealthcheckBaseUrl(project, environmentName, tenantId);
  const indexHtml = await fs.readFile(path.join(project.projectRoot, "pb_public", "index.html"), "utf8");
  const expectedHeadingMatch = indexHtml.match(/<h1>(.*?)<\/h1>/is);
  const expectedHeading = expectedHeadingMatch ? expectedHeadingMatch[1].trim() : "";

  if (!baseUrl) {
    throw new CommandError(`Missing healthcheck base URL for environment '${environmentName}'. Set HEALTHCHECK_BASE_URL or POCKETHOST_TENANT_ID.`);
  }

  if (!expectedHeading) {
    throw new CommandError("Could not extract an <h1> marker from pb_public/index.html.");
  }

  const response = await fetch(baseUrl, {
    headers: {
      "User-Agent": "pocketbase-pockethost"
    }
  });

  if (!response.ok) {
    throw new CommandError(`Healthcheck failed for ${baseUrl}: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  if (!html.includes(expectedHeading)) {
    throw new CommandError(`Healthcheck failed for ${baseUrl}: expected page marker '${expectedHeading}' was not found.`);
  }
}

export async function deployProject(project, options = {}) {
  const environmentName = await resolveEnvironmentName(project, options);
  const tenantId = resolveTenantId(project, environmentName);
  const sftpUsername = process.env.POCKETHOST_SFTP_USERNAME || "";
  const sftpHost = process.env.POCKETHOST_SFTP_HOST || "ftp.pockethost.io";
  const sftpPort = Number(process.env.POCKETHOST_SFTP_PORT || "2222");
  const sftpPassphrase = process.env.POCKETHOST_SFTP_PASSPHRASE || "";
  const dryRun = options.dryRun === true;
  const surface = await detectProjectSurface(project.projectRoot);

  if (!sftpUsername) {
    throw new CommandError(`Missing POCKETHOST_SFTP_USERNAME for environment '${environmentName}'.`);
  }

  if (!Number.isInteger(sftpPort) || sftpPort <= 0) {
    throw new CommandError("POCKETHOST_SFTP_PORT must be a positive integer.");
  }

  if (surface.pbPublic || surface.pbHooks || surface.pbMigrations) {
    if (!tenantId) {
      throw new CommandError(`Missing POCKETHOST_TENANT_ID for environment '${environmentName}'. SFTP deployment requires an instance-scoped path.`);
    }
  }

  const publicDir = tenantId ? `/${tenantId}/pb_public` : "";
  const hooksDir = tenantId ? `/${tenantId}/pb_hooks` : "";
  const migrationsDir = tenantId ? `/${tenantId}/pb_migrations` : "";

  if (dryRun) {
    return {
      environmentName,
      sftpHost,
      sftpPort,
      publicDir,
      hooksDir,
      migrationsDir,
      surface
    };
  }

  const privateKey = await resolvePrivateKey();
  if (!privateKey) {
    throw new CommandError("Missing POCKETHOST_SFTP_PRIVATE_KEY or POCKETHOST_SFTP_PRIVATE_KEY_PATH.");
  }

  const client = new SftpClient("pockethost-deploy");

  try {
    await client.connect({
      host: sftpHost,
      port: sftpPort,
      username: sftpUsername,
      privateKey,
      ...(sftpPassphrase ? { passphrase: sftpPassphrase } : {})
    });

    if (surface.pbPublic) {
      console.log(`Uploading pb_public -> ${publicDir}`);
      await deployDirectory(client, path.join(project.projectRoot, "pb_public"), publicDir);
    }

    if (surface.pbHooks) {
      console.log(`Uploading pb_hooks -> ${hooksDir}`);
      await deployDirectory(client, path.join(project.projectRoot, "pb_hooks"), hooksDir);
    }

    if (surface.pbMigrations) {
      console.log(`Uploading pb_migrations -> ${migrationsDir}`);
      await deployDirectory(client, path.join(project.projectRoot, "pb_migrations"), migrationsDir);
    }
  } finally {
    await client.end().catch(() => {});
  }

  if (surface.pbPublic) {
    await runHealthcheck(project, environmentName);
  }

  return {
    environmentName,
    sftpHost,
    sftpPort,
    publicDir,
    hooksDir,
    migrationsDir,
    surface
  };
}
