# Security Policy

## Supported Versions

Only the latest published version of the **Flavortown GitHub Exporter** browser extension is actively supported with security fixes. Users are encouraged to always use the most recent version available on the Chrome Web Store or Firefox Add-ons Store.

| Version | Supported          |
| ------- | ------------------ |
| Latest (1.5.x+) | ✅ Yes        |
| < 1.5.0 | ❌ No              |

## Reporting a Vulnerability

We take the security of the Flavortown GitHub Exporter seriously. Since this extension handles **GitHub Personal Access Tokens** stored in browser local storage, responsible disclosure is especially important.

### How to Report

Please **do not** open a public GitHub issue for security vulnerabilities. Instead, use one of the following methods:

1. **GitHub Private Vulnerability Reporting (preferred):** Use the [Report a vulnerability](https://github.com/scorpion7slayer/flavortown-github-exporter/security/advisories/new) button on this repository's Security tab to submit a private advisory.
2. **Email:** If you prefer email, contact the maintainer directly via the profile linked on this repository.

### What to Include

Please provide as much of the following as possible:

- A description of the vulnerability and its potential impact
- Steps to reproduce the issue
- The browser and extension version you are using
- Any relevant logs, screenshots, or proof-of-concept code

### What to Expect

- **Acknowledgement:** You will receive an acknowledgement within **48 hours**.
- **Assessment:** We will evaluate the report and aim to provide a status update within **7 days**.
- **Resolution:** If the vulnerability is confirmed, we will work on a fix and release a patched version as soon as possible, typically within **14 days** for critical issues.
- **Credit:** With your permission, we will credit you in the release notes.

### Scope

The following areas are in scope for security reports:

- Unsafe handling or exposure of GitHub Personal Access Tokens stored in `chrome.storage.local` / `browser.storage.local`
- Content Security Policy (CSP) bypasses in the extension
- Cross-site scripting (XSS) vulnerabilities in the extension's UI
- Unintended data leakage to third-party services
- Malicious API endpoint redirections (e.g., the GitHub API endpoint `api.github.com`)
- Permission escalation or abuse of declared browser permissions

The following are **out of scope**:

- Vulnerabilities in third-party services (Flavortown, GitHub, browser vendors)
- Social engineering attacks against users
- Issues requiring physical access to the user's device

## Security Best Practices for Users

- **Never share your GitHub Personal Access Token.** The extension stores it locally; it is never transmitted to any server other than `api.github.com`.
- Use a **fine-grained Personal Access Token** with the minimum required scopes (read-only access to public repositories is sufficient).
- **Revoke and regenerate** your token if you suspect it has been compromised at [github.com/settings/tokens](https://github.com/settings/tokens).
- Always install the extension from the official [Chrome Web Store](https://chromewebstore.google.com/detail/ohkkaaibkhikfeemhpfpdhbpopjngaia) or [Firefox Add-ons](https://addons.mozilla.org/fr/firefox/addon/flavortown-github-exporter/) page.

## Disclosure Policy

We follow a **coordinated disclosure** model. We ask that you give us a reasonable amount of time to address the issue before any public disclosure. We are committed to working with security researchers in good faith.
