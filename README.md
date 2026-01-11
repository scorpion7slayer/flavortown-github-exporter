# Flavortown GitHub Exporter

A browser extension that allows you to import your GitHub projects to Flavortown with just one click!

## Features

- **One-click GitHub import**: Easily import your GitHub repositories into Flavortown projects
- **Repository browser**: View and select from your GitHub repositories with detailed information
- **Token management**: Securely store your GitHub personal access token
- **Automatic form filling**: Automatically fills project details from your GitHub repository
- **Beautiful UI**: Modern, GitHub-inspired interface with smooth animations

## Installation

### From Chrome Web Store (Recommended)

1. Coming soon to the Chrome Web Store!

### Manual Installation (Developer)

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/flavortown-github-export-extension.git
   ```

2. Open Chrome and go to `chrome://extensions/`

3. Enable "Developer mode" (toggle in top right)

4. Click "Load unpacked" and select the cloned repository folder

5. The extension will be installed and ready to use

## Usage

1. Navigate to Flavortown's "Create a new Project" page
2. Click the "Import" button that appears next to the page title
3. Enter your GitHub personal access token (create one if needed)
4. Browse your repositories and select the one you want to import
5. Click "Import Project" and the form will be automatically filled

## GitHub Token Setup

To use this extension, you'll need a GitHub personal access token with the `public_repo` scope:

1. Go to: https://github.com/settings/tokens/new
2. Set description: "Flavortown GitHub Exporter"
3. Select scope: `public_repo`
4. Click "Generate token"
5. Copy the generated token and paste it into the extension

## Technical Details

### Architecture

- **Content Script**: `content/content.js` - Handles communication between the extension and web page
- **Injected Script**: `content/injected.js` - Runs in the page context to create custom elements and UI
- **Custom Element**: `GitHubImportModal` - The main modal component for repository selection

### Key Features

- **Secure Storage**: Uses Chrome's `storage.local` API to securely store GitHub tokens
- **Cross-browser Support**: Works with both Chrome and Firefox (using appropriate APIs)
- **Responsive Design**: Modern, accessible UI with smooth animations
- **Error Handling**: Comprehensive error handling for API requests
- **Usage Tracking**: Tracks extension usage for analytics (can be disabled)

### Supported Languages

The extension recognizes and displays language colors for:
- JavaScript, TypeScript, Python, Java, C++, C#, Go, Rust
- Ruby, PHP, Swift, Kotlin, Dart, HTML, CSS, Shell
- Vue, Svelte, Lua, and more

## Development

### Building

```bash
# No build step required - it's plain JavaScript!
# Just load the extension folder in Chrome
```

### Testing

1. Load the extension in Chrome as described above
2. Navigate to Flavortown's new project page
3. Test the import functionality with various repositories

### Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and commit them
4. Push to your fork: `git push origin feature/your-feature`
5. Create a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

## Screenshots

![Extension in action](screenshots/extension.png)
![Repository selection](screenshots/repositories.png)

## Credits

- Built with ❤️ for the Hack Club and Flavortown community
- Icons and design inspired by GitHub's interface
- Made possible by the Chrome Extensions API

## Version History

- **v1.5.0**: Updated icons, improved error handling, enhanced UI
- **v1.4.0**: Added usage tracking, improved repository filtering
- **v1.3.0**: Better token management, enhanced modal animations
- **v1.2.0**: Added language color support, improved form filling
- **v1.1.0**: Initial release with basic import functionality

## Roadmap

- [ ] Add support for private repositories
- [ ] Implement repository search/filter functionality
- [ ] Add support for GitHub organizations
- [ ] Improve error messages and user guidance
- [ ] Add dark/light theme support

## Privacy

This extension respects your privacy:
- GitHub tokens are stored locally in your browser only
- No personal data is collected or transmitted
- Usage tracking is anonymous and can be disabled

## Contact

For more information about Flavortown, visit: https://flavortown.hackclub.com

---

Made with 🍕 by the Flavortown community!