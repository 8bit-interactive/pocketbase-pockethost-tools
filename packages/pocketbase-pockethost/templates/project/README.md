# __PROJECT_TITLE__

This project uses the `pocketbase-pockethost` CLI.

Most users should only edit:

- `pb_public/index.html`
- `pb_public/assets/site.css`

Quick start:

1. `npm install`
2. `npm run check`
3. `npm run dev`
4. edit `pb_public/index.html`
5. push `staging`
6. push `main`

GitHub Environments:

- `staging`
- `production`

Required GitHub Environment values:

- `POCKETHOST_SFTP_USERNAME` as a secret containing the PocketHost account email
- `POCKETHOST_SFTP_PRIVATE_KEY` as a secret containing an Ed25519 private key
- `POCKETHOST_TENANT_ID` as a variable or secret

Pockethost SFTP uses `ftp.pockethost.io` on port `2222`. The legacy `ftp:deploy` command is kept as a compatibility alias; new deployments should use `sftp:deploy` or `deploy`.
