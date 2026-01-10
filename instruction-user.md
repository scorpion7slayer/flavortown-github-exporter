# Flavortown GitHub Exporter

A browser extension (Chrome & Firefox) to export your GitHub projects to [Flavortown](https://flavortown.hackclub.com) with one click.

## Features

- Search GitHub users and browse their public repositories
- Auto-fill the Flavortown project form with repository data
- GitHub-native dark theme design
- Works on both Chrome and Firefox

## Installation

### Chrome

1. Open `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the extension folder

### Firefox

1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on..."
3. Select the `manifest.json` file

## Usage

1. Navigate to [Flavortown New Project](https://flavortown.hackclub.com/projects/new)
2. Click the extension icon in your browser toolbar
3. Enter a GitHub username and click "Search"
4. Select the repository you want to export
5. Click "Export to Flavortown"

The form will be automatically filled with:
- **Project Title**: Repository name
- **Description**: Repository description
- **Demo Link**: Repository homepage (or GitHub URL)
- **Repository URL**: GitHub repository link
- **Raw README URL**: Direct link to README.md

## Development

```
flavortown-github-export-extension/
├── manifest.json           # Extension manifest (v3)
├── popup/
│   ├── popup.html         # Extension popup UI
│   ├── popup.css          # Styles (GitHub theme)
│   └── popup.js           # Popup logic
├── content/
│   ├── content.js         # Form auto-fill script
│   └── content.css        # Notification styles
├── background/
│   └── service-worker.js  # Background service worker
└── icons/                 # Extension icons
```

## License

MIT

## Credits

Made by Scorpion7Slayer for [Hack Club](https://hackclub.com)
