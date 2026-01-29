# 🚀 Flavortown GitHub Exporter

<div align="center">

**Import your GitHub projects to Flavortown with one click**

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Available-brightgreen?style=for-the-badge&logo=googlechrome&logoColor=white)](https://chromewebstore.google.com/detail/ohkkaaibkhikfeemhpfpdhbpopjngaia?utm_source=item-share-cb)
[![Firefox Add-ons](https://img.shields.io/badge/Firefox-Available-brightgreen?style=for-the-badge&logo=firefox&logoColor=white)](https://addons.mozilla.org/fr/firefox/addon/flavortown-github-exporter/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

</div>

---

## ✨ Features

**Flavortown GitHub Exporter** is a browser extension that streamlines the process of sharing your GitHub projects on [Flavortown](https://flavortown.hackclub.com/). Instead of manually copying and pasting information from your repositories, this extension does all the heavy lifting for you.

### What it does:

- 🔗 **One-Click Import** - Adds an "Import from GitHub" button directly to the Flavortown new project page
- 📦 **Browse Your Repos** - Displays all your public GitHub repositories in an elegant modal interface
- 🎯 **Auto-Fill Forms** - Automatically fills in project details including:
  - Project name
  - Repository URL
  - Demo/homepage link
  - README link
- 🔒 **Secure** - Your GitHub token is stored locally in your browser and never sent to third parties
- 🎨 **Beautiful UI** - Clean, GitHub-inspired interface with dark mode support
- ⚡ **Fast & Lightweight** - Minimal performance impact, only active on Flavortown pages

---

## 📦 Installation

### Chrome / Edge / Brave

1. Visit the [Chrome Web Store](https://chromewebstore.google.com/detail/ohkkaaibkhikfeemhpfpdhbpopjngaia?utm_source=item-share-cb)
2. Click **"Add to Chrome"** (or "Add to Edge"/"Add to Brave")
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
You'll see a new **"Import"** button next to the "Create a new Project" heading

### 3. **Set Up Your GitHub Token**
On first use, you'll need to provide a GitHub Personal Access Token:
- Click the **"Create a token"** link in the modal
- GitHub will open with the correct settings pre-configured
- Scroll down and click **"Generate token"** (no need to change any settings)
- Copy the token and paste it into the extension

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
- Node.js (optional, for development)
- A Chromium-based browser or Firefox

### Local Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/flavortown-github-exporter.git
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

## 🤝 Contributing

Contributions are welcome! Feel free to:

- 🐛 Report bugs
- 💡 Suggest new features
- 🔧 Submit pull requests
- 📖 Improve documentation

---

## 📸 Screenshots

### Import Button on Flavortown
The extension adds a convenient "Import" button next to the page heading.

### Repository Selection Modal
Browse your GitHub repositories with an elegant, GitHub-inspired interface.

### Auto-Filled Project Form
Project details are automatically populated, saving you time and effort.

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
- [Report an Issue](https://github.com/yourusername/flavortown-github-exporter/issues)

---

<div align="center">

**Enjoying the extension? Give us a ⭐ on GitHub!**

</div>
