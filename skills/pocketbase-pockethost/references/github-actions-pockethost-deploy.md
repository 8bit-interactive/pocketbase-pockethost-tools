# GitHub Actions Deployment for Pockethost

Use this reference when a repository needs a standard GitHub Actions workflow for deploying to Pockethost over SFTP.

## Current Direction

The preferred model is no longer:

- copy a long workflow
- copy a long `Makefile`
- maintain shell logic in every project

The preferred model is now:

1. scaffold or maintain the project with `pocketbase-pockethost`
2. generate a local workflow in the consuming repository
3. let GitHub Actions call the CLI for `doctor`, `test`, and `deploy`

## Project Conventions

Default conventions:

- `main` -> GitHub Environment `production`
- `master` -> GitHub Environment `production`
- `staging` -> GitHub Environment `staging`
- `pb_public/` is the main static site surface
- `pb_hooks/` and `pb_migrations/` are optional
- `.pb_version` pins the PocketBase version
- `.pb_config.json` is the single explicit project config file

## SFTP Connection Contract

Pockethost's recommended file access method is SFTP. It replaces legacy explicit FTPS on port 21 for new setups.

Use these connection values:

| Setting | Value |
| --- | --- |
| Protocol | SFTP (SSH File Transfer Protocol) |
| Host | `ftp.pockethost.io` |
| Port | `2222` |
| Username | PocketHost account email |
| Authentication | Ed25519 SSH private key |
| Password | Not used |

The SFTP root exposes one directory per accessible instance. Use the instance subdomain from `POCKETHOST_TENANT_ID` as the first remote path component:

- `/<tenant>/pb_public/`
- `/<tenant>/pb_hooks/`
- `/<tenant>/pb_migrations/`

Create and scope the public key under [PocketHost Account → Keys](https://pockethost.io/account/keys). Do not commit private keys or place them in repository files.

SFTP provides file transfer only. Do not use `scp`, `rsync`, or remote `ssh` commands; use the CLI, an SFTP client, or [phio](https://pockethost.io/docs/phio) for synchronization.

## Required GitHub Environment Configuration

For both `production` and `staging`, configure:

- `POCKETHOST_SFTP_USERNAME` as an environment secret containing the PocketHost account email
- `POCKETHOST_SFTP_PRIVATE_KEY` as an environment secret containing the Ed25519 private key
- `POCKETHOST_TENANT_ID` as an environment variable or secret

Optional:

- `HEALTHCHECK_BASE_URL` as an environment variable when the public URL should not be derived from the tenant ID
- `POCKETHOST_SFTP_HOST` as an environment variable when the host should not use `ftp.pockethost.io`
- `POCKETHOST_SFTP_PORT` as an environment variable when the port should not use `2222`
- `POCKETHOST_SFTP_PASSPHRASE` as an environment secret for an encrypted private key

## Workflow Behavior

The generated workflow should:

1. check out the repository
2. install Node dependencies
3. run `pocketbase-pockethost doctor --strict --for deploy`
4. run `pocketbase-pockethost test`
5. run `pocketbase-pockethost deploy`

This keeps the workflow very small and pushes the real logic into the CLI.

## Why This Is Better

Compared with the previous shell-heavy approach:

- fewer project files need manual editing
- fewer long workflow branches live in YAML
- local and CI deploys share the same deploy engine
- PocketBase version management moves into `.pb_version`
- GitHub failures become easier to explain because `doctor` fails early with configuration-specific messages

## SFTP Deployment Rules

The CLI deploy behavior should stay convention-based:

- `pb_public` uploads to `/${POCKETHOST_TENANT_ID}/pb_public/`
- `pb_hooks` uploads to `/${POCKETHOST_TENANT_ID}/pb_hooks/`
- `pb_migrations` uploads to `/${POCKETHOST_TENANT_ID}/pb_migrations/`
- every SFTP deployment requires `POCKETHOST_TENANT_ID` because the SFTP root is instance-scoped
- the CLI uses `POCKETHOST_SFTP_PRIVATE_KEY` or `POCKETHOST_SFTP_PRIVATE_KEY_PATH`, never a password

For manual connections, use the provider's [SFTP documentation](https://pockethost.io/docs/ftp). The legacy FTPS connection may still work during the migration period, but it is deprecated and should not be used for new workflows.

For a local key-based deployment, configure the environment and run:

```bash
export POCKETHOST_SFTP_USERNAME='you@example.com'
export POCKETHOST_SFTP_PRIVATE_KEY_PATH="$HOME/.ssh/pockethost_ed25519"
export POCKETHOST_TENANT_ID='your-instance'
npx pocketbase-pockethost deploy
```

## Transitional Assets

These files remain in the repository during the transition:

- [../assets/github-actions-pockethost-deploy.yml](../assets/github-actions-pockethost-deploy.yml)
- [../assets/github-actions-pockethost-deploy-standalone.yml](../assets/github-actions-pockethost-deploy-standalone.yml)
- [../assets/Makefile](../assets/Makefile)

Treat them as compatibility material, not the long-term center of the product.
