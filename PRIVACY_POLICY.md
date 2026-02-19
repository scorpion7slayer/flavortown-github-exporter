# Privacy Policy — Flavortown GitHub Exporter

**Last updated:** February 19, 2026

This Privacy Policy describes how the **Flavortown GitHub Exporter** browser extension ("the Extension", "we", "our") handles your information. Please read it carefully.

---

## 1. Overview

Flavortown GitHub Exporter is a browser extension that helps users import their GitHub projects into [Flavortown](https://flavortown.hackclub.com), a Hack Club project showcase platform. The Extension is designed with privacy in mind: **all data is stored locally on your device and is never collected, transmitted, or sold to any third party by us.**

---

## 2. Data We Access and Why

The Extension accesses certain data solely to provide its functionality. The table below describes each category of data, why it is accessed, and where it is stored.

| Data | Purpose | Storage |
|---|---|---|
| **GitHub username** | Display your identity inside the Extension's UI | Local browser storage |
| **GitHub OAuth token or Personal Access Token** | Authenticate requests to the GitHub API to fetch your public repositories | Local browser storage |
| **Public GitHub repository list** (names, languages, star counts, URLs, descriptions) | Populate the repository browser and auto-fill the Flavortown project form | Local browser storage (temporary session cache) |
| **Repository README content** | Auto-fill the Flavortown project form with a link to the README | Fetched on demand, not persistently stored |
| **Commit history & co-authorship metadata** | Optionally detect AI-generated contributions (Copilot commits, co-authored-by markers) | Not stored; processed in-memory only |
| **AI provider API keys** (OpenAI, Anthropic, OpenRouter) | Authenticate requests to the AI provider selected by the user for description generation | Local browser storage |
| **Ollama connection settings** (localhost URL) | Connect to a locally running Ollama instance for AI generation | Local browser storage |
| **GitHub Copilot credentials** | Authenticate requests to the GitHub Copilot model endpoint | Local browser storage |

> **Important:** The Extension only accesses the data listed above. It does **not** access private repositories, private user profile data, passwords, browsing history, or any other personal information.

---

## 3. How Data Is Stored

All data is stored exclusively in your browser's local storage (`chrome.storage.local` or `browser.storage.local`). This means:

- Data **never leaves your device** via our servers — we operate no servers.
- Data is **not synced** across devices via browser sync.
- OAuth Device Flow state is stored only in **session storage** and is automatically cleared when you close the browser.
- You can delete all stored data at any time by removing the Extension from your browser.

---

## 4. Data Transmitted to Third Parties

The Extension communicates **directly** between your browser and the following third-party services, **solely based on actions you take**:

| Service | Data Sent | When |
|---|---|---|
| **GitHub API** (`api.github.com`, `github.com`, `raw.githubusercontent.com`, `models.github.ai`) | OAuth requests, API queries for public repo data, commit data, README content | When you authenticate or browse repositories |
| **Flavortown** (`flavortown.hackclub.com`) | Form data you have reviewed and chosen to submit | When you import a project |
| **OpenAI API** (`api.openai.com`) | Repository description text for AI generation | Only if you enable the OpenAI AI feature |
| **Anthropic API** (`api.anthropic.com`) | Repository description text for AI generation | Only if you enable the Claude AI feature |
| **OpenRouter API** (`openrouter.ai`) | Repository description text for AI generation | Only if you enable the OpenRouter AI feature |
| **Ollama** (`localhost` / `127.0.0.1`) | Repository description text for AI generation | Only if you configure and enable Ollama; data stays on your machine |

We do **not** control the privacy practices of these third-party services. We encourage you to review their respective privacy policies:

- [GitHub Privacy Statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement)
- [Flavortown / Hack Club Privacy Policy](https://hackclub.com/privacy/)
- [OpenAI Privacy Policy](https://openai.com/policies/privacy-policy)
- [Anthropic Privacy Policy](https://www.anthropic.com/privacy)
- [OpenRouter Privacy Policy](https://openrouter.ai/privacy)

---

## 5. Data We Do NOT Collect

We explicitly do **not** collect, store on external servers, or share:

- Your personal identity, name, or email address
- Private GitHub repository data
- Browsing history or activity outside of `flavortown.hackclub.com/projects/new`
- Analytics, telemetry, or crash reports
- Any data for advertising or profiling purposes

---

## 6. Permissions Justification

The Extension requests the following browser permissions:

| Permission | Justification |
|---|---|
| `storage` | Store authentication tokens and user settings locally |
| `declarativeNetRequest` | Remove `Origin` request headers for local Ollama connections (CORS workaround); no content is read or modified |
| Host permission: `https://api.github.com/*` | Query the GitHub REST API for public repositories |
| Host permission: `https://github.com/*` | Perform the GitHub OAuth Device Flow |
| Host permission: `https://flavortown.hackclub.com/*` | Inject the "Import from GitHub" button and auto-fill the project form |
| Host permission: `https://raw.githubusercontent.com/*` | Fetch raw README file content |
| Host permission: `https://models.github.ai/*` | Query the GitHub Copilot model endpoint for AI generation |
| Host permission: `http://localhost/*`, `http://127.0.0.1/*` | Connect to a locally running Ollama instance |
| Host permission: `https://api.openai.com/*` | Send prompts to OpenAI for AI description generation |
| Host permission: `https://api.anthropic.com/*` | Send prompts to Anthropic for AI description generation |
| Host permission: `https://openrouter.ai/*` | Send prompts to OpenRouter for AI description generation |

---

## 7. Children's Privacy

The Extension is not directed at children under 13 years of age and does not knowingly collect personal information from children.

---

## 8. Changes to This Privacy Policy

We may update this Privacy Policy from time to time. When we do, we will update the **"Last updated"** date at the top of this document and, where appropriate, notify users through the Extension or the GitHub repository. Continued use of the Extension after changes are posted constitutes your acceptance of the updated policy.

---

## 9. Contact

If you have any questions or concerns about this Privacy Policy, please open an issue in the GitHub repository:

[https://github.com/scorpion7slayer/flavortown-github-exporter/issues](https://github.com/scorpion7slayer/flavortown-github-exporter/issues)

---

*This Extension is an open-source project maintained by the community. It is not affiliated with, endorsed by, or sponsored by GitHub, Google, Hack Club, OpenAI, Anthropic, or any other mentioned third party.*
