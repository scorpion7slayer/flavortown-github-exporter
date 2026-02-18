# Security Policy

## Supported Versions

Only the latest published version of the **Flavortown GitHub Exporter** browser extension is actively supported with security fixes. Users are encouraged to always use the most recent version available on the Chrome Web Store or Firefox Add-ons Store.

| Version         | Supported              |
| --------------- | ---------------------- |
| 2.5.x (latest)  | ✅ Yes                 |
| 2.0.x           | ⚠️ Critical fixes only |
| < 2.0.0         | ❌ No                  |

## Reporting a Vulnerability

We take the security of the Flavortown GitHub Exporter seriously. Since this extension handles **GitHub tokens**, **AI API keys**, and communicates with third-party AI services, responsible disclosure is especially important.

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

- Unsafe handling or exposure of **GitHub tokens** (OAuth Device Flow tokens or Personal Access Tokens) stored in `chrome.storage.local` / `browser.storage.local`
- Unsafe handling or exposure of **AI provider API keys** (OpenAI, Anthropic, OpenRouter) stored in `chrome.storage.local` / `browser.storage.local`
- Unintended transmission of tokens or API keys to third-party services beyond those explicitly listed in `host_permissions`
- Content Security Policy (CSP) bypasses in the extension
- Cross-site scripting (XSS) vulnerabilities in the extension's UI (injected script or shadow DOM components)
- Unintended data leakage (repository contents, commit history, user identity) to third-party services
- Malicious API endpoint redirections (e.g., substituting a legitimate AI or GitHub endpoint)
- Permission escalation or abuse of declared browser permissions
- Message injection via `window.postMessage` between the content script and injected script contexts

The following are **out of scope**:

- Vulnerabilities in third-party services (Flavortown, GitHub, OpenAI, Anthropic, OpenRouter, Ollama, browser vendors)
- Social engineering attacks against users
- Issues requiring physical access to the user's device
- Rate limiting or quota abuse on third-party AI APIs

## Security Best Practices for Users

### GitHub Token

- **Never share your GitHub token.** The extension stores it locally in `chrome.storage.local`; it is never sent to any server other than `api.github.com`, `github.com` (OAuth), and `models.github.ai` (GitHub Copilot).
- Use a **fine-grained Personal Access Token** with the minimum required scopes (`public_repo` and `read:user` are sufficient for the core features).
- Prefer the **OAuth Device Flow** (built-in login) over manually pasting a PAT when possible.
- **Revoke and regenerate** your token if you suspect it has been compromised at [github.com/settings/tokens](https://github.com/settings/tokens).

### AI API Keys

- AI provider API keys (OpenAI, Anthropic, OpenRouter) are stored locally in `chrome.storage.local` and are only transmitted directly to the respective provider's official API endpoint.
- Use API keys with the **minimum required permissions** and set usage limits or spending caps where your provider allows it.
- **Revoke and regenerate** your AI API key if you suspect it has been compromised.

### General

- Always install the extension from the official [Chrome Web Store](https://chromewebstore.google.com/detail/ohkkaaibkhikfeemhpfpdhbpopjngaia) or [Firefox Add-ons](https://addons.mozilla.org/fr/firefox/addon/flavortown-github-exporter/) page.
- Keep your browser up to date to benefit from the latest extension sandboxing and security improvements.

## Disclosure Policy

We follow a **coordinated disclosure** model. We ask that you give us a reasonable amount of time to address the issue before any public disclosure. We are committed to working with security researchers in good faith.
