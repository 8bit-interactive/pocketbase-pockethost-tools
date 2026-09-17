import path from "node:path";
import { CommandError } from "./errors.js";
import { detectProjectSurface, resolveEnvironmentConfig, resolveEnvironmentName, resolveHealthcheckBaseUrl, resolveTenantId } from "./project.js";
import { resolvePocketBaseBinaryPath } from "./pocketbase.js";
import { fileExists } from "./utils.js";

export async function runDoctor(project, options = {}) {
  const strict = options.strict === true;
  const forDeploy = options.forDeploy === true;
  const environmentName = await resolveEnvironmentName(project, options);
  const environmentConfig = resolveEnvironmentConfig(project, environmentName);
  const tenantId = resolveTenantId(project, environmentName);
  const healthcheckBaseUrl = resolveHealthcheckBaseUrl(project, environmentName, tenantId);
  const surface = await detectProjectSurface(project.projectRoot);
  const pocketbaseBinaryPath = resolvePocketBaseBinaryPath(project.projectRoot, project.version);
  const binaryInstalled = await fileExists(pocketbaseBinaryPath);
  const issues = [];

  if (!surface.pbPublic) {
    issues.push("Missing pb_public/ directory.");
  }

  if (surface.pbHooks && !tenantId) {
    issues.push(`pb_hooks/ contains files but no tenantId is configured for environment '${environmentName}'.`);
  }

  if (surface.pbMigrations && !tenantId) {
    issues.push(`pb_migrations/ contains files but no tenantId is configured for environment '${environmentName}'.`);
  }

  if (forDeploy) {
    if (!process.env.POCKETHOST_SFTP_USERNAME) {
      issues.push(`Missing POCKETHOST_SFTP_USERNAME for environment '${environmentName}'.`);
    }

    if (!process.env.POCKETHOST_SFTP_PRIVATE_KEY && !process.env.POCKETHOST_SFTP_PRIVATE_KEY_PATH) {
      issues.push(`Missing POCKETHOST_SFTP_PRIVATE_KEY or POCKETHOST_SFTP_PRIVATE_KEY_PATH for environment '${environmentName}'.`);
    }

    if (process.env.POCKETHOST_SFTP_PRIVATE_KEY_PATH && !(await fileExists(process.env.POCKETHOST_SFTP_PRIVATE_KEY_PATH))) {
      issues.push(`POCKETHOST_SFTP_PRIVATE_KEY_PATH does not exist: ${process.env.POCKETHOST_SFTP_PRIVATE_KEY_PATH}`);
    }

    if ((surface.pbPublic || surface.pbHooks || surface.pbMigrations) && !tenantId) {
      issues.push(`Missing POCKETHOST_TENANT_ID for environment '${environmentName}'. SFTP deployment requires an instance-scoped path.`);
    }
  }

  if (forDeploy && surface.pbPublic && !healthcheckBaseUrl) {
    issues.push(`Missing healthcheck target for environment '${environmentName}'. Configure tenantId or healthcheckBaseUrl.`);
  }

  console.log(`Project root: ${project.projectRoot}`);
  console.log(`Project name: ${project.config.projectName || path.basename(project.projectRoot)}`);
  console.log(`PocketBase version: ${project.version}`);
  console.log(`PocketBase binary: ${binaryInstalled ? pocketbaseBinaryPath : "not installed yet"}`);
  console.log(`Environment: ${environmentName}`);
  console.log(`Tenant ID: ${tenantId || "(not set)"}`);
  console.log(`Healthcheck base URL: ${healthcheckBaseUrl || "(not set)"}`);
  console.log(`Surface: pb_public=${surface.pbPublic} pb_hooks=${surface.pbHooks} pb_migrations=${surface.pbMigrations}`);
  console.log(`Optional tests: lintJs=${project.config.tests?.lintJs === true} lintCss=${project.config.tests?.lintCss === true} unit=${project.config.tests?.unit === true} e2e=${project.config.tests?.e2e === true}`);

  if (environmentConfig && Object.keys(environmentConfig).length === 0) {
    console.log(`Environment config '${environmentName}' falls back to environment variables.`);
  }

  if (issues.length > 0) {
    console.log("");
    console.log("Issues:");
    for (const issue of issues) {
      console.log(`- ${issue}`);
    }

    if (strict) {
      throw new CommandError("Doctor found blocking issues.");
    }
  } else {
    console.log("");
    console.log("Doctor check passed.");
  }
}
