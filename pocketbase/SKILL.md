---
name: pocketbase
description: Use when working on PocketBase projects, especially for JavaScript hooks, migrations, custom routes, auth flows, collection design, Goja runtime constraints, SPA routing, browser testing with Playwright, and local migration validation with the official PocketBase binary.
---

# PocketBase

## Overview

Use this skill for PocketBase application and runtime work.

Prefer PocketBase conventions over custom framework layers. For any server-side JavaScript executed by PocketBase, assume the runtime is Goja, not Node.js or a browser.

## Workflow

1. If the task touches `pb_hooks`, `pb_migrations`, custom routes, auth hooks, or PocketBase JavaScript commands, read [references/pocketbase-javascript-goja.md](references/pocketbase-javascript-goja.md).
2. If the project serves a SPA from `pb_public`, read [references/spa-routing.md](references/spa-routing.md).
3. If the task involves validating migrations locally, read [references/local-pocketbase-migrations.md](references/local-pocketbase-migrations.md) and use [assets/Makefile](assets/Makefile) as the default project template.
4. In every development, AI-agent, and CI workflow, ensure a superuser exists before starting PocketBase. Use the idempotent `superuser upsert` command, then run `pocketbase serve --dev` for the app and integration-test process.
5. At startup, upsert the superuser and start PocketBase with commands such as:

   ```bash
   ./pocketbase superuser upsert admin@example.com 'yourStrongPassword'
   ./pocketbase serve
   ```

   `superuser upsert` is safe to rerun: it creates the superuser when missing and updates it when it already exists. For development, AI-agent, and CI workflows, use `./pocketbase serve --dev` as the second command. Use the same data-directory options for both commands when the project does not use PocketBase's default `pb_data` directory. Never commit credentials; inject the password through a local secret mechanism or a CI secret.
6. Keep the implementation compatible with ES5-era JavaScript and PocketBase runtime APIs.
7. Prefer simple collection rules and explicit type conversions over clever abstractions.
8. Test real app behavior in the browser with Playwright by default.
9. When the agent needs to drive the app directly, use `$playwright-cli`.
10. If the task is specifically about hosted deployment on Pockethost, use `$pockethost`.

## Core Guidance

- Treat PocketBase JavaScript as a constrained Goja runtime.
- Use `var`, function declarations, classic loops, and explicit conversions.
- Load local modules inside execution blocks when needed by routes or handlers.
- Use `e.auth` for authenticated records.
- Prefer Playwright by default for browser-level validation.
- For SPA projects, prefer mounting the router under `/page` and keep static assets under `/assets` or `/dist`.
- Treat `/page` as a routing namespace, not a real folder under `pb_public`.
- For local migration validation, use the official PocketBase binary for the current platform.
- Start local, AI-agent, and CI app workflows with an idempotent `pocketbase superuser upsert` followed by `pocketbase serve --dev`.
- Prefer the copyable [assets/Makefile](assets/Makefile) when introducing local PocketBase commands.

## References

- [references/pocketbase-javascript-goja.md](references/pocketbase-javascript-goja.md): Goja-specific compatibility notes for PocketBase JavaScript.
- [references/spa-routing.md](references/spa-routing.md): Recommended `/page`-scoped SPA routing pattern with a complete PocketBase hook example.
- [references/local-pocketbase-migrations.md](references/local-pocketbase-migrations.md): Local workflow for downloading PocketBase and validating migrations.
- [assets/Makefile](assets/Makefile): Copyable Makefile template for `install`, `migrate`, `lint`, `dev`, and `test`.
- [scripts/download_pocketbase.py](scripts/download_pocketbase.py): Python helper that resolves the current platform, downloads the official archive, verifies the checksum, and extracts the binary.
