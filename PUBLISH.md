# Publishing to the Yaak Plugin Registry

This guide walks through publishing `@cibofdevs/payok-siggen` to [yaak.app/plugins](https://yaak.app/plugins).

> **Note:** Yaak plugins are currently experimental and APIs may change without notice.

---

## Prerequisites

- Node.js v18 or higher
- A Yaak account at [yaak.app](https://yaak.app)
- Yaak CLI installed globally:
  ```bash
  npm install -g @yaakapp/cli
  ```

---

## 1. Register a Namespace

Before you can publish, your namespace must be registered in the Yaak registry.

Go to: **[yaak.app/plugins/namespaces/manage](https://yaak.app/plugins/namespaces/manage)**

Register the namespace that matches the scope in your plugin name. For this plugin, the namespace is `cibofdevs` (from `@cibofdevs/payok-siggen`).

You only need to do this once.

---

## 2. Verify `package.json`

The registry reads these fields from `package.json`:

```json
{
  "name": "@cibofdevs/payok-siggen",
  "version": "1.0.0",
  "displayName": "PAYOK Signature Generator",
  "description": "PAYOK Signature Generator plugin for Yaak HTTP Client",
  "main": "build/index.js"
}
```

| Field | Requirement |
|---|---|
| `name` | Must follow `@{namespace}/{plugin-name}` format |
| `version` | Must be unique on each publish (follow [semver](https://semver.org)) |
| `displayName` | Required — shown in the Yaak UI |
| `description` | Shown in the registry listing |
| `main` | Must point to `build/index.js` |

---

## 3. Ensure `README.md` Exists

A `README.md` file in the plugin root is required for publishing. This file is already present in this project.

---

## 4. Build the Plugin

Always build before publishing to ensure `build/index.js` is up to date:

```bash
npm run build
```

Confirm the build succeeds:

```
SUCCESS  Built plugin bundle at /path/to/siggen-yaak/build/index.js
```

---

## 5. Log In to Yaak

```bash
yaak auth login
```

This opens a browser window. Log in with your Yaak account and return to the terminal. Verify the session:

```bash
yaak auth whoami
```

---

## 6. Publish

From inside the plugin directory:

```bash
yaak plugin publish
```

A successful publish prints a confirmation and the registry URL.

---

## Publishing a New Version

Each publish requires a unique version. Before re-publishing:

1. Bump `version` in `package.json`:
   ```json
   "version": "1.1.0"
   ```

2. Rebuild:
   ```bash
   npm run build
   ```

3. Publish:
   ```bash
   yaak plugin publish
   ```

Version bump guide:

| Change type | Bump | Example |
|---|---|---|
| Bug fix | Patch | `1.0.0` → `1.0.1` |
| New feature, backward-compatible | Minor | `1.0.0` → `1.1.0` |
| Breaking change | Major | `1.0.0` → `2.0.0` |

---

## After Publishing

The plugin will be listed at:

```
https://yaak.app/plugins/@cibofdevs/payok-siggen
```

Users can install it in Yaak via **Settings → Plugins** or with the CLI:

```bash
yaak plugin install @cibofdevs/payok-siggen
```

---

## Troubleshooting

**`yaak` command not found**
Install the CLI globally: `npm install -g @yaakapp/cli`

**Publish fails with "namespace not registered"**
Complete namespace registration at [yaak.app/plugins/namespaces/manage](https://yaak.app/plugins/namespaces/manage) first.

**Publish fails with "version already exists"**
Bump the `version` in `package.json` and rebuild before retrying.

**Publish fails with "name not allowed"**
The `name` field must use the registered namespace: `@cibofdevs/...`

**`build/index.js` not found**
Run `npm run build` first. The registry requires the compiled bundle.

---

## Log Out

```bash
yaak auth logout
```
