# Flavortown GitHub Exporter

A browser extension (Chrome & Firefox) to import your GitHub projects to [Flavortown](https://flavortown.hackclub.com) with one click.

## Features

- **Integrated button** next to "Create a new Project" title
- **Modal interface** to select your GitHub repositories
- **Auto-fill** project title, demo link, repository URL, and README link
- **Remembers your username** for future imports
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
2. Click the green **"Import from GitHub"** button next to the page title
3. Enter your GitHub username (saved for next time)
4. Select the repository you want to import
5. Click **"Import Project"**

The form will be automatically filled with:
- **Project Title**: Repository name
- **Demo Link**: Repository homepage (or GitHub URL if no homepage)
- **Repository URL**: GitHub repository link
- **Raw README URL**: Direct link to README.md

**Note**: The description field is left empty for you to fill manually with your own project description.

## Project Structure

```
flavortown-github-export-extension/
├── manifest.json           # Extension manifest (v3)
├── content/
│   └── content.js         # Injected button + modal UI
├── icons/
│   ├── GitHub_dark.svg    # White GitHub logo
│   └── GitHub_light.svg   # Dark GitHub logo
└── instruction-user.md    # This file
```

## License

MIT

## Credits

Made by Scorpion7Slayer for [Hack Club](https://hackclub.com)
