# 🚀 Flavortown GitHub Exporter

## Import your GitHub projects to Flavortown with one click

[![Chrome — Available](https://img.shields.io/badge/Chrome-Available-brightgreen?style=for-the-badge&logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/ohkkaaibkhikfeemhpfpdhbpopjngaia?utm_source=item-share-cb) [![Firefox — Available](https://img.shields.io/badge/Firefox-Available-brightgreen?style=for-the-badge&logo=firefox&logoColor=white)](https://addons.mozilla.org/fr/firefox/addon/flavortown-github-exporter/) [![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE) [![Version](https://img.shields.io/badge/Version-2.5.0-orange?style=for-the-badge)](CHANGELOG)

---

## ✨ Features

**Flavortown GitHub Exporter** is a browser extension that streamlines the process of sharing your GitHub projects on [Flavortown](https://flavortown.hackclub.com/). Instead of manually copying and pasting information from your repositories, this extension does all the heavy lifting for you.

### What it does

- 🔗 **One-Click Import** - Adds an "Import from GitHub" button directly to the Flavortown new project page
- 📦 **Browse Your Repos** - Displays all your public GitHub repositories in an elegant modal interface
- 🎯 **Auto-Fill Forms** - Automatically fills in project details including:
  - Project name
  - Repository URL
  - Demo/homepage link
  - README link
- 🏷️ **Language Detection** - Shows programming languages with color badges
- ⭐ **Star Count Display** - See your repo's stars at a glance
- 🔒 **Secure** - Your GitHub token is stored locally in your browser and never sent to third parties
- 🎨 **Beautiful UI** - Clean, GitHub-inspired interface with dark mode support
- ⚡ **Fast & Lightweight** - Minimal performance impact, only active on Flavortown pages

### 🤖 AI Features (v2.0+)

- ✍️ **AI Description Generation** - Auto-generate project descriptions using AI, directly from the import modal
- 📝 **AI Declaration Generation** - Generate an honest AI usage declaration for your Flavortown submission with one click
- 🔍 **AI Contribution Detector** - Automatically detects AI-generated code in a repository (Copilot commits, co-authored-by markers, etc.) and prompts you to fill in the AI Declaration field
- 🧠 **Multiple AI Providers** - Choose the AI that works best for you:
  - **GitHub Copilot** — uses your existing Copilot subscription, no extra API key needed
  - **Ollama** — run AI fully locally, no API key required
  - **ChatGPT (OpenAI)** — requires an OpenAI API key
  - **Claude (Anthropic)** — requires an Anthropic API key
  - **OpenRouter** — access many models via a single API key, with free-model filter
- ⚡ **Dynamic Model Loading** — model lists are fetched live for each provider
- 🆓 **Free-Only Filter** — toggle to show only free models (OpenRouter)
- 🔌 **Connection Test** — verify your AI settings before generating
- 🔎 **Manual Repo Input** — paste an `owner/repo` string to trigger AI detection without browsing your repos

---

## 📦 Installation

### Chrome / Edge / Brave

1. Visit the [Chrome Web Store](https://chromewebstore.google.com/detail/ohkkaaibkhikfeemhpfpdhbpopjngaia?utm_source=item-share-cb)
2. Click **"Add to Chrome"** (or "Add to Edge" / "Add to Brave")
3. Confirm the installation

### Firefox

1. Visit the [Firefox Add-ons Store](https://addons.mozilla.org/fr/firefox/addon/flavortown-github-exporter/)
2. Click **"Add to Firefox"**
3. Confirm the installation

---

## 🎯 How to Use

### 1. **Navigate to Flavortown**

Go to [https://flavortown.hackclub.com/projects/new](https://flavortown.hackclub.com/projects/new)

### 2. **Click the Import Button**

You'll see a new **"Import"** button next to the "Create a new Project" heading.

### 3. **Sign in with GitHub**

On first use, you'll be asked to authenticate:

- Click **"Sign in with GitHub"** in the modal
- Authorize the extension via OAuth
- You're ready to go — no token to copy or paste!

### 4. **Browse Your Repositories**

The extension will load all your public repositories with:

- Repository names
- Programming languages (with color indicators)
- Star counts
- Descriptions

### 5. **Select and Import**

- Click on any repository to select it
- Press **"Import Project"**
- The Flavortown form will be automatically filled with your project details
- Add a description and submit!

### 6. **Use AI Features (optional)**

- Click the **AI settings icon** in the modal to configure your preferred AI provider
- Use **"Generate with AI"** to auto-generate a project description
- If AI contributions are detected in the repo, a warning banner will appear — click **"Generate Declaration"** to auto-fill the AI Declaration field

---

## 🔐 Privacy & Security

- **Local Storage Only** - Your GitHub token is stored securely in your browser's local storage
- **No Data Collection** - We don't collect, store, or transmit your personal information
- **Minimal Permissions** - The extension only requests permissions for `flavortown.hackclub.com` and `api.github.com`
- **Open Source** - Full source code is available for review in this repository

---

## 🛠️ Development

Want to contribute or run the extension locally?

### Prerequisites

- A Chromium-based browser or Firefox

### Local Installation

1. **Clone the repository**

    ```bash
    git clone https://github.com/scorpion7slayer/flavortown-github-exporter.git
    cd flavortown-github-exporter
    ```

2. **Load in Chrome**
    - Open `chrome://extensions/`
    - Enable "Developer mode" (toggle in top right)
    - Click "Load unpacked"
    - Select the extension directory

3. **Load in Firefox**
    - Open `about:debugging#/runtime/this-firefox`
    - Click "Load Temporary Add-on"
    - Select the `manifest.json` file

---

## 📋 Changelog

### v2.5.0
- 🔍 AI contribution detector — warns when Copilot/AI usage is found in a repo
- ✍️ "Generate with AI" button for AI Declaration field
- 🆓 Free-only model filter for OpenRouter
- 🎨 UI polish and style improvements
- 🔒 Security vulnerability fixes

### v2.0.0
- 🤖 AI description generation (Copilot, Ollama, ChatGPT, Claude, OpenRouter)
- ⚡ Dynamic model loading for all AI providers
- 📝 Auto-generate descriptions on import
- 🔌 Connection test for AI providers
- ⚙️ AI prompt customization and settings
- 🐛 Report an issue directly from the extension

### v1.0.0
- 🚀 Import GitHub repositories to Flavortown
- 🎯 Auto-fill project fields (name, URL, README)
- 🏷️ Language detection with color badges
- ⭐ Star count display

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

- 🐛 Report bugs via [GitHub Issues](https://github.com/scorpion7slayer/flavortown-github-exporter/issues)
- 💡 Suggest new features
- 🔧 Submit pull requests
- 📖 Improve documentation

---

## 📝 License

MIT License - feel free to use this extension however you'd like!

Copyright (c) 2026 scorpion7slayer

---

## 🌟 Credits

Built with ❤️ for the [Hack Club](https://hackclub.com/) community

**Links:**

- [Chrome Web Store](https://chromewebstore.google.com/detail/ohkkaaibkhikfeemhpfpdhbpopjngaia?utm_source=item-share-cb)
- [Firefox Add-ons](https://addons.mozilla.org/fr/firefox/addon/flavortown-github-exporter/)
- [Flavortown](https://flavortown.hackclub.com/)
- [Report an Issue](https://github.com/scorpion7slayer/flavortown-github-exporter/issues)

---

**Enjoying the extension? Give us a ⭐ on GitHub!**
