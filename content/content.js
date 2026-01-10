/**
 * Flavortown GitHub Exporter - Content Script
 * Injects an "Import from GitHub" button and modal into the Flavortown new project page
 */

const LANGUAGE_COLORS = {
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    Python: '#3572A5',
    Java: '#b07219',
    'C++': '#f34b7d',
    C: '#555555',
    'C#': '#178600',
    Go: '#00ADD8',
    Rust: '#dea584',
    Ruby: '#701516',
    PHP: '#4F5D95',
    Swift: '#F05138',
    Kotlin: '#A97BFF',
    Dart: '#00B4AB',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Shell: '#89e051',
    Vue: '#41b883',
    Svelte: '#ff3e00',
    Lua: '#000080',
    default: '#8b949e'
};

class GitHubImportModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.state = {
            view: 'setup',
            username: '',
            repositories: [],
            selectedRepo: null,
            isLoading: false,
            error: null
        };
    }

    async connectedCallback() {
        await this.loadSavedUsername();
        this.render();
        this.addEventListeners();
    }

    async loadSavedUsername() {
        try {
            const storage = typeof browser !== 'undefined' ? browser.storage : chrome.storage;
            const result = await storage.local.get('githubUsername');
            if (result.githubUsername) {
                this.state.username = result.githubUsername;
                this.state.view = 'list';
                await this.fetchRepositories();
            }
        } catch (e) {}
    }

    async saveUsername(username) {
        try {
            const storage = typeof browser !== 'undefined' ? browser.storage : chrome.storage;
            await storage.local.set({ githubUsername: username });
        } catch (e) {}
    }

    async fetchRepositories() {
        if (!this.state.username) return;

        this.state.isLoading = true;
        this.state.error = null;
        this.render();

        try {
            const response = await fetch(
                `https://api.github.com/users/${this.state.username}/repos?per_page=100&sort=updated&type=owner`
            );

            if (response.status === 404) {
                throw new Error('User not found');
            }
            if (response.status === 403) {
                throw new Error('Rate limit exceeded. Please wait a moment.');
            }
            if (!response.ok) {
                throw new Error('Failed to fetch repositories');
            }

            const data = await response.json();
            this.state.repositories = data
                .filter(repo => !repo.fork)
                .map(repo => ({
                    id: repo.id,
                    name: repo.name,
                    full_name: repo.full_name,
                    description: repo.description,
                    html_url: repo.html_url,
                    homepage: repo.homepage,
                    default_branch: repo.default_branch || 'main',
                    stars: repo.stargazers_count,
                    language: repo.language,
                    langColor: LANGUAGE_COLORS[repo.language] || LANGUAGE_COLORS.default
                }));

            this.state.isLoading = false;
            this.state.view = 'list';
        } catch (error) {
            this.state.isLoading = false;
            this.state.error = error.message;
            this.state.view = 'setup';
        }

        this.render();
    }

    getStyles() {
        return `
            :host {
                --color-bg-default: #0d1117;
                --color-bg-overlay: #161b22;
                --color-bg-subtle: #21262d;
                --color-border-default: #30363d;
                --color-border-muted: #21262d;
                --color-fg-default: #c9d1d9;
                --color-fg-muted: #8b949e;
                --color-accent-fg: #58a6ff;
                --color-success-fg: #238636;
                --color-success-emphasis: #2ea043;
                --color-danger-fg: #f85149;
                --color-btn-bg: #21262d;
                --color-btn-hover-bg: #30363d;

                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
                -webkit-font-smoothing: antialiased;
                color: var(--color-fg-default);
                line-height: 1.5;
                font-size: 13px;
            }

            * { box-sizing: border-box; }

            .overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(1, 4, 9, 0.85);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 99999;
                backdrop-filter: blur(3px);
            }

            .modal {
                width: 420px;
                max-height: 520px;
                background: var(--color-bg-default);
                border: 1px solid var(--color-border-default);
                border-radius: 12px;
                box-shadow: 0 16px 48px rgba(1, 4, 9, 0.9);
                display: flex;
                flex-direction: column;
                overflow: hidden;
                animation: modalFadeIn 0.2s cubic-bezier(0, 0, 0.2, 1);
            }

            @keyframes modalFadeIn {
                from { opacity: 0; transform: scale(0.95) translateY(10px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
            }

            .header {
                padding: 16px;
                background: var(--color-bg-overlay);
                border-bottom: 1px solid var(--color-border-default);
                display: flex;
                align-items: center;
                justify-content: space-between;
            }

            .header-title {
                display: flex;
                align-items: center;
                gap: 10px;
                font-weight: 600;
                font-size: 14px;
            }

            .close-btn {
                background: none;
                border: none;
                color: var(--color-fg-muted);
                cursor: pointer;
                padding: 4px;
                border-radius: 6px;
                display: flex;
                transition: all 0.15s;
            }

            .close-btn:hover {
                background: var(--color-btn-hover-bg);
                color: var(--color-fg-default);
            }

            .content {
                padding: 20px;
                flex: 1;
                overflow-y: auto;
                min-height: 200px;
            }

            .content::-webkit-scrollbar { width: 8px; }
            .content::-webkit-scrollbar-track { background: transparent; }
            .content::-webkit-scrollbar-thumb {
                background: var(--color-border-default);
                border-radius: 10px;
            }

            .setup-view {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .form-group label {
                display: block;
                margin-bottom: 6px;
                font-weight: 500;
            }

            .input-wrapper {
                display: flex;
                gap: 8px;
            }

            input[type="text"] {
                flex: 1;
                background: var(--color-bg-default);
                border: 1px solid var(--color-border-default);
                border-radius: 6px;
                color: var(--color-fg-default);
                padding: 8px 12px;
                font-size: 14px;
                transition: border-color 0.2s, box-shadow 0.2s;
            }

            input[type="text"]:focus {
                outline: none;
                border-color: var(--color-accent-fg);
                box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.3);
            }

            .helper-text {
                font-size: 12px;
                color: var(--color-fg-muted);
                margin-top: 6px;
            }

            .error-text {
                font-size: 12px;
                color: var(--color-danger-fg);
                margin-top: 6px;
            }

            .user-info-bar {
                background: var(--color-bg-subtle);
                border: 1px solid var(--color-border-default);
                border-radius: 6px;
                padding: 10px 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }

            .username-display {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 500;
            }

            .change-link {
                color: var(--color-accent-fg);
                font-size: 12px;
                cursor: pointer;
                background: none;
                border: none;
            }

            .change-link:hover { text-decoration: underline; }

            .repo-list {
                display: flex;
                flex-direction: column;
                border: 1px solid var(--color-border-default);
                border-radius: 6px;
                overflow: hidden;
            }

            .repo-item {
                display: flex;
                align-items: flex-start;
                padding: 12px;
                border-bottom: 1px solid var(--color-border-muted);
                cursor: pointer;
                transition: background 0.1s;
            }

            .repo-item:last-child { border-bottom: none; }
            .repo-item:hover { background: rgba(48, 54, 61, 0.4); }
            .repo-item.selected { background: rgba(56, 139, 253, 0.15); }

            .repo-radio {
                margin-top: 2px;
                margin-right: 12px;
                accent-color: var(--color-accent-fg);
                width: 16px;
                height: 16px;
            }

            .repo-details { flex: 1; min-width: 0; }

            .repo-name {
                font-weight: 600;
                color: var(--color-accent-fg);
                margin-bottom: 4px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .repo-meta {
                display: flex;
                gap: 12px;
                font-size: 11px;
                color: var(--color-fg-muted);
                align-items: center;
            }

            .lang-badge {
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .lang-dot {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                flex-shrink: 0;
            }

            .star-count {
                display: flex;
                align-items: center;
                gap: 3px;
            }

            .footer {
                padding: 16px;
                background: var(--color-bg-overlay);
                border-top: 1px solid var(--color-border-default);
                display: flex;
                justify-content: flex-end;
                gap: 8px;
            }

            .btn {
                padding: 8px 16px;
                font-size: 13px;
                font-weight: 500;
                border-radius: 6px;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
                transition: all 0.15s;
                border: 1px solid;
            }

            .btn-primary {
                background-color: var(--color-success-fg);
                border-color: rgba(240, 246, 252, 0.1);
                color: #ffffff;
            }

            .btn-primary:hover:not(:disabled) {
                background-color: var(--color-success-emphasis);
            }

            .btn-primary:disabled {
                background-color: rgba(35, 134, 54, 0.5);
                color: rgba(255, 255, 255, 0.5);
                cursor: not-allowed;
            }

            .btn-secondary {
                background-color: var(--color-btn-bg);
                border-color: var(--color-border-default);
                color: var(--color-fg-default);
            }

            .btn-secondary:hover {
                background-color: var(--color-btn-hover-bg);
                border-color: #8b949e;
            }

            .icon { fill: currentColor; }

            .loading-state, .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px 20px;
                text-align: center;
            }

            .loading-state p, .empty-state p {
                color: var(--color-fg-muted);
                margin-top: 12px;
            }

            @keyframes spin {
                to { transform: rotate(360deg); }
            }

            .spinner {
                animation: spin 1s linear infinite;
            }
        `;
    }

    addEventListeners() {
        this.shadowRoot.addEventListener('click', async (e) => {
            const target = e.target;

            if (target.closest('.close-btn') || target.closest('.cancel-btn') || target.classList.contains('overlay')) {
                this.remove();
            }

            if (target.closest('.save-username-btn')) {
                const input = this.shadowRoot.querySelector('#gh-username-input');
                const username = input.value.trim();
                if (username) {
                    this.state.username = username;
                    await this.saveUsername(username);
                    await this.fetchRepositories();
                }
            }

            if (target.closest('.change-link')) {
                this.state.view = 'setup';
                this.state.error = null;
                this.render();
            }

            const repoItem = target.closest('.repo-item');
            if (repoItem) {
                const repoId = parseInt(repoItem.dataset.id);
                this.state.selectedRepo = this.state.repositories.find(r => r.id === repoId);
                this.render();
            }

            if (target.closest('.import-btn') && this.state.selectedRepo) {
                this.fillForm(this.state.selectedRepo);
                this.remove();
            }
        });

        this.shadowRoot.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.id === 'gh-username-input') {
                this.shadowRoot.querySelector('.save-username-btn')?.click();
            }
            if (e.key === 'Escape') {
                this.remove();
            }
        });
    }

    fillForm(repo) {
        const titleInput = document.querySelector('input[placeholder="Give your project a name"]');
        if (titleInput) {
            titleInput.value = repo.name;
            titleInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        const demoLinkInput = document.querySelector('input[placeholder*="flavortown.cooked.selfhosted"]');
        if (demoLinkInput) {
            demoLinkInput.value = repo.homepage || repo.html_url;
            demoLinkInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        const repoInput = document.querySelector('input[placeholder*="github.com/hackclub"]');
        if (repoInput) {
            repoInput.value = repo.html_url;
            repoInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        const readmeUrl = `https://raw.githubusercontent.com/${repo.full_name}/refs/heads/${repo.default_branch}/README.md`;
        const readmeInput = document.querySelector('input[placeholder*="raw.githubusercontent"]');
        if (readmeInput) {
            readmeInput.value = readmeUrl;
            readmeInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        this.showNotification('Project imported! Please fill in the description manually.', 'success');
    }

    showNotification(message, type) {
        const existing = document.querySelector('.gh-export-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = 'gh-export-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: ${type === 'success' ? '#238636' : '#f85149'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            font-size: 14px;
            font-weight: 500;
            z-index: 100000;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
            animation: slideIn 0.3s ease-out;
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease-out reverse';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    getGitHubLogo() {
        return `<svg height="20" width="20" viewBox="0 0 16 16" class="icon"><path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path></svg>`;
    }

    render() {
        const { view, username, repositories, selectedRepo, isLoading, error } = this.state;

        this.shadowRoot.innerHTML = `
            <style>${this.getStyles()}</style>
            <div class="overlay">
                <div class="modal">
                    <header class="header">
                        <div class="header-title">
                            ${this.getGitHubLogo()}
                            <span>Import from GitHub</span>
                        </div>
                        <button class="close-btn" aria-label="Close">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.749.749 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path></svg>
                        </button>
                    </header>

                    <div class="content">
                        ${isLoading ? this.renderLoading() : ''}
                        ${!isLoading && view === 'setup' ? this.renderSetup() : ''}
                        ${!isLoading && view === 'list' ? this.renderRepoList() : ''}
                    </div>

                    <footer class="footer">
                        <button class="btn btn-secondary cancel-btn">Cancel</button>
                        <button class="btn btn-primary import-btn" ${selectedRepo ? '' : 'disabled'}>
                            ${this.getGitHubLogo()}
                            Import Project
                        </button>
                    </footer>
                </div>
            </div>
        `;
    }

    renderLoading() {
        return `
            <div class="loading-state">
                <svg class="spinner" width="32" height="32" viewBox="0 0 16 16" fill="none" stroke="#58a6ff" stroke-width="1.5">
                    <path d="M8 2a6 6 0 1 0 6 6" stroke-linecap="round"></path>
                </svg>
                <p>Loading repositories...</p>
            </div>
        `;
    }

    renderSetup() {
        return `
            <div class="setup-view">
                <div class="form-group">
                    <label for="gh-username-input">Your GitHub Username</label>
                    <div class="input-wrapper">
                        <input
                            type="text"
                            id="gh-username-input"
                            placeholder="e.g. octocat"
                            value="${this.state.username}"
                            autocomplete="off"
                            autofocus
                        >
                        <button class="btn btn-secondary save-username-btn">Load Repos</button>
                    </div>
                    ${this.state.error
                        ? `<p class="error-text">${this.state.error}</p>`
                        : `<p class="helper-text">Enter your GitHub username to load your public repositories.</p>`
                    }
                </div>
            </div>
        `;
    }

    renderRepoList() {
        const { username, repositories, selectedRepo } = this.state;

        if (repositories.length === 0) {
            return `
                <div class="user-info-bar">
                    <div class="username-display">
                        ${this.getGitHubLogo()}
                        <span>${username}</span>
                    </div>
                    <button class="change-link">Change</button>
                </div>
                <div class="empty-state">
                    <p>No public repositories found for this user.</p>
                </div>
            `;
        }

        return `
            <div class="user-info-bar">
                <div class="username-display">
                    ${this.getGitHubLogo()}
                    <span>${username}</span>
                </div>
                <button class="change-link">Change</button>
            </div>

            <div class="repo-list">
                ${repositories.map(repo => `
                    <div class="repo-item ${selectedRepo?.id === repo.id ? 'selected' : ''}" data-id="${repo.id}">
                        <input type="radio" class="repo-radio" name="github-repo" ${selectedRepo?.id === repo.id ? 'checked' : ''}>
                        <div class="repo-details">
                            <div class="repo-name">${repo.name}</div>
                            <div class="repo-meta">
                                ${repo.language ? `
                                    <span class="lang-badge">
                                        <span class="lang-dot" style="background-color: ${repo.langColor}"></span>
                                        ${repo.language}
                                    </span>
                                ` : ''}
                                <span class="star-count">
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path></svg>
                                    ${repo.stars.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

if (!customElements.get('github-import-modal')) {
    customElements.define('github-import-modal', GitHubImportModal);
}

function injectImportButton() {
    const titleElement = document.querySelector('h1, h2, [class*="title"]');
    const headingWithText = Array.from(document.querySelectorAll('h1, h2, h3, div, span'))
        .find(el => el.textContent.includes('Create a new Project'));

    const targetElement = headingWithText || titleElement;

    if (!targetElement || document.querySelector('#gh-import-btn')) return;

    const button = document.createElement('button');
    button.id = 'gh-import-btn';
    button.innerHTML = `
        <svg height="16" width="16" viewBox="0 0 16 16" style="fill: currentColor; margin-right: 6px;">
            <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
        </svg>
        Import from GitHub
    `;
    button.style.cssText = `
        display: inline-flex;
        align-items: center;
        padding: 8px 16px;
        margin-left: 12px;
        background-color: #238636;
        color: white;
        border: none;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.15s;
        vertical-align: middle;
    `;

    button.addEventListener('mouseenter', () => {
        button.style.backgroundColor = '#2ea043';
    });
    button.addEventListener('mouseleave', () => {
        button.style.backgroundColor = '#238636';
    });

    button.addEventListener('click', () => {
        if (!document.querySelector('github-import-modal')) {
            const modal = document.createElement('github-import-modal');
            document.body.appendChild(modal);
        }
    });

    targetElement.style.display = 'inline-flex';
    targetElement.style.alignItems = 'center';
    targetElement.insertAdjacentElement('afterend', button);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectImportButton);
} else {
    injectImportButton();
}

setTimeout(injectImportButton, 1000);
setTimeout(injectImportButton, 2000);
