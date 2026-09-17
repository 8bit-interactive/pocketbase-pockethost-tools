# pocketbase-pockethost

Ultra-simple PocketBase and Pockethost automation CLI.

Main commands:

- `init`
- `install`
- `dev`
- `test`
- `doctor`
- `health`
- `deploy`
- `sftp:deploy`
- `workflow:install`
- `migration:new`
- `hooks:new`

The default project model is zero-build:

- edit `pb_public/index.html`
- edit `pb_public/assets/site.css`
- keep hooks and migrations optional

Deployments use Pockethost SFTP with an Ed25519 SSH key. The `ftp:deploy` command remains as a compatibility alias for `sftp:deploy`.
