---
name: pocketbase-pockethost
description: Use when working on PocketBase projects and Pockethost hosting, including JavaScript hooks, migrations, custom routes, SPA routing, local validation, CLI workflows, GitHub Actions, SFTP deployment, and health checks.
---

# PocketBase + Pockethost

## Overview

Use this skill for the complete PocketBase and Pockethost project lifecycle.

Prefer PocketBase and Pockethost conventions over custom framework or deployment layers. The preferred operational surface is the `pocketbase-pockethost` CLI, while the standard PocketBase project layout remains:

- `pb_public/` for the public site and static assets
- `pb_hooks/` for optional server-side JavaScript
- `pb_migrations/` for optional schema migrations

For PocketBase server-side JavaScript, assume the runtime is Goja, not Node.js or a browser.

## Workflow Routing

Read only the reference that matches the current task:

1. For `pb_hooks`, `pb_migrations`, custom routes, auth hooks, or PocketBase JavaScript commands, read [references/pocketbase-javascript-goja.md](references/pocketbase-javascript-goja.md).
2. For a SPA served from `pb_public`, read [references/spa-routing.md](references/spa-routing.md).
3. For local migration validation, read [references/local-pocketbase-migrations.md](references/local-pocketbase-migrations.md) and use [assets/Makefile](assets/Makefile) as the default project template.
4. For GitHub Actions, branch environments, or SFTP deployment, read [references/github-actions-pockethost-deploy.md](references/github-actions-pockethost-deploy.md).

## Project Conventions

- Prefer `npx pocketbase-pockethost init` for new projects.
- Keep `.pb_version` as the source of truth for the PocketBase version.
- Keep `.pb_config.json` as the single explicit project configuration file.
- For small zero-build sites, keep the main editable files in `pb_public/index.html` and `pb_public/assets/site.css`.
- If the frontend uses `/page`, keep compiled assets under `/assets` or `/dist`, not under `pb_public/page`.
- Treat `/page` as a routing namespace, not a real directory under `pb_public`.
- Keep `pb_hooks/` and `pb_migrations/` optional for static-only projects.

## Local PocketBase Workflow

1. Use `npx pocketbase-pockethost install` or the official PocketBase binary workflow to install the version from `.pb_version`.
2. For local, AI-agent, and CI development workflows, ensure a superuser exists before starting PocketBase. Use the idempotent `superuser upsert` command, then run `pocketbase serve --dev`.
3. `superuser upsert` is safe to rerun: it creates the superuser when missing and updates it when it already exists. Never commit credentials; inject the password through a local secret mechanism or a CI secret.
4. Use `npx pocketbase-pockethost test` for migration smoke tests and configured project checks.
5. Test real application behavior in the browser with Playwright by default. When the agent needs to drive the app directly, use `$playwright-cli`.

Example startup sequence:

```bash
./pocketbase superuser upsert admin@example.com 'yourStrongPassword'
./pocketbase serve --dev
```

Use the same data-directory options for both commands when the project does not use PocketBase's default `pb_data` directory.

## Pockethost Deployment Workflow

1. Prefer `npx pocketbase-pockethost workflow:install` over hand-editing workflows.
2. Prefer `npx pocketbase-pockethost doctor`, `health`, `test`, `deploy`, and `sftp:deploy` over long local shell glue.
3. Use GitHub Environments named `production` and `staging`.
4. Store `POCKETHOST_SFTP_USERNAME` as the PocketHost account email in an environment secret.
5. Store the Ed25519 private key in `POCKETHOST_SFTP_PRIVATE_KEY` as an environment secret. Use `POCKETHOST_SFTP_PRIVATE_KEY_PATH` for local deployments when a key file is preferable.
6. Store `POCKETHOST_TENANT_ID` as an environment variable or secret.
7. Use SFTP host `ftp.pockethost.io` on port `2222`; leave the password unset unless the provider explicitly changes this contract.
8. Treat manual SFTP deployment as a first-class path for projects that do not use GitHub.

## Deployment Rules

- Deploy `main` to `production`.
- Deploy `master` to `production`.
- Deploy `staging` to `staging`.
- Resolve `POCKETHOST_TENANT_ID` from environment variables before falling back to environment secrets.
- Upload `pb_public`, `pb_hooks`, and `pb_migrations` below `/<tenant>/` over SFTP.
- For small static sites, deploy `/<tenant>/pb_public` and keep the SPA routing mount separate from asset directories.
- Require a tenant-scoped deployment path for every SFTP deployment; the SFTP root contains one folder per accessible instance.
- Do not recommend legacy FTPS on port 21 for new setups; Pockethost documents it as deprecated.

## Core PocketBase Guidance

- Treat PocketBase JavaScript as a constrained Goja runtime.
- Use `var`, function declarations, classic loops, and explicit conversions.
- Load local modules inside execution blocks when needed by routes or handlers.
- Use `e.auth` for authenticated records.
- Prefer simple collection rules and explicit type conversions over clever abstractions.
- Use the official PocketBase binary for local migration validation.

## References and Assets

- [references/pocketbase-javascript-goja.md](references/pocketbase-javascript-goja.md): Goja-specific compatibility notes for PocketBase JavaScript.
- [references/spa-routing.md](references/spa-routing.md): Recommended `/page`-scoped SPA routing pattern with a complete PocketBase hook example.
- [references/local-pocketbase-migrations.md](references/local-pocketbase-migrations.md): Local workflow for downloading PocketBase and validating migrations.
- [references/github-actions-pockethost-deploy.md](references/github-actions-pockethost-deploy.md): GitHub Actions, environments, and SFTP deployment behavior.
- [assets/Makefile](assets/Makefile): Copyable Makefile template for local PocketBase install, migration, lint, development, and test targets.
- [assets/pockethost.Makefile](assets/pockethost.Makefile): Legacy CLI-oriented Makefile wrapper for Pockethost projects.
- [assets/github-actions-pockethost-deploy.yml](assets/github-actions-pockethost-deploy.yml): Transitional GitHub workflow template material.
- [scripts/download_pocketbase.py](scripts/download_pocketbase.py): Python helper that resolves the current platform, downloads the official archive, verifies the checksum, and extracts the binary.
- [../../packages/pocketbase-pockethost/package.json](../../packages/pocketbase-pockethost/package.json): CLI package entrypoint.
