/**
 * Flavortown GitHub Exporter - Injected Script (Main World)
 * This script runs in the page's main context to properly define custom elements
 */

const FLAVORTOWN_PROJECT_ID = "7195";

function trackExtensionUsage() {
    fetch("https://flavortown.hackclub.com/explore/extensions", {
        method: "GET",
        credentials: "same-origin",
        headers: {
            [`X-Flavortown-Ext-${FLAVORTOWN_PROJECT_ID}`]: "true",
        },
    }).catch(() => {});
}

const LANGUAGE_COLORS = {
    JavaScript: "#f1e05a",
    TypeScript: "#3178c6",
    Python: "#3572A5",
    Java: "#b07219",
    "C++": "#f34b7d",
    C: "#555555",
    "C#": "#178600",
    Go: "#00ADD8",
    Rust: "#dea584",
    Ruby: "#701516",
    PHP: "#4F5D95",
    Swift: "#F05138",
    Kotlin: "#A97BFF",
    Dart: "#00B4AB",
    HTML: "#e34c26",
    CSS: "#563d7c",
    Shell: "#89e051",
    Vue: "#41b883",
    Svelte: "#ff3e00",
    Lua: "#000080",
    default: "#8b949e",
};

class GitHubImportModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.state = {
            view: "setup",
            username: "",
            token: "",
            repositories: [],
            selectedRepo: null,
            isLoading: false,
            error: null,
        };
    }

    async connectedCallback() {
        await this.loadSavedData();
        this.render();
        this.addEventListeners();
    }

    async loadSavedData() {
        return new Promise((resolve) => {
            const handler = (event) => {
                if (event.data.type === "GITHUB_DATA_RESULT") {
                    window.removeEventListener("message", handler);
                    if (event.data.token) {
                        this.state.token = event.data.token;
                        this.state.view = "list";
                        this.fetchRepositories().then(resolve);
                    } else {
                        resolve();
                    }
                }
            };
            window.addEventListener("message", handler);
            window.postMessage({ type: "GET_GITHUB_DATA" }, "*");
            setTimeout(resolve, 1000);
        });
    }

    saveData(username, token) {
        window.postMessage({ type: "SAVE_GITHUB_DATA", username, token }, "*");
    }

    async fetchRepositories() {
        if (!this.state.token) {
            this.state.error = "GitHub token is required";
            this.render();
            return;
        }

        this.state.isLoading = true;
        this.state.error = null;
        this.render();

        try {
            const headers = {
                Authorization: `token ${this.state.token}`,
            };

            // If no username provided, get it from the token
            if (!this.state.username) {
                const userResponse = await fetch(
                    "https://api.github.com/user",
                    { headers },
                );
                if (userResponse.status === 401) {
                    throw new Error(
                        "Invalid token. Please check your GitHub token.",
                    );
                }
                if (!userResponse.ok) {
                    throw new Error("Failed to authenticate with GitHub");
                }
                const userData = await userResponse.json();
                this.state.username = userData.login;
            }

            const response = await fetch(
                `https://api.github.com/users/${this.state.username}/repos?per_page=100&sort=updated&type=owner`,
                { headers },
            );

            if (response.status === 404) {
                throw new Error("User not found");
            }
            if (response.status === 401) {
                throw new Error(
                    "Invalid token. Please check your GitHub token.",
                );
            }
            if (!response.ok) {
                throw new Error("Failed to fetch repositories");
            }

            const data = await response.json();
            this.state.repositories = data
                .filter((repo) => !repo.fork)
                .map((repo) => ({
                    id: repo.id,
                    name: repo.name,
                    full_name: repo.full_name,
                    description: repo.description,
                    html_url: repo.html_url,
                    homepage: repo.homepage,
                    default_branch: repo.default_branch || "main",
                    stars: repo.stargazers_count,
                    language: repo.language,
                    langColor:
                        LANGUAGE_COLORS[repo.language] ||
                        LANGUAGE_COLORS.default,
                }));

            this.state.isLoading = false;
            this.state.view = "list";
        } catch (error) {
            this.state.isLoading = false;
            this.state.error = error.message;
            this.state.view = "setup";
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

            input[type="text"],
            input[type="password"] {
                width: 100%;
                background: var(--color-bg-default);
                border: 1px solid var(--color-border-default);
                border-radius: 6px;
                color: var(--color-fg-default);
                padding: 8px 12px;
                font-size: 14px;
                transition: border-color 0.2s, box-shadow 0.2s;
            }

            input[type="text"]:focus,
            input[type="password"]:focus {
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
        this.shadowRoot.addEventListener("click", async (e) => {
            const target = e.target;

            if (
                target.closest(".close-btn") ||
                target.closest(".cancel-btn") ||
                target.classList.contains("overlay")
            ) {
                this.remove();
            }

            if (target.closest(".save-username-btn")) {
                const tokenInput =
                    this.shadowRoot.querySelector("#gh-token-input");
                const token = tokenInput ? tokenInput.value.trim() : "";
                if (token) {
                    this.state.token = token;
                    this.saveData("", token);
                    await this.fetchRepositories();
                } else {
                    this.state.error = "Please enter your GitHub token";
                    this.render();
                }
            }

            if (target.closest(".change-link")) {
                this.state.view = "setup";
                this.state.error = null;
                this.render();
            }

            const repoItem = target.closest(".repo-item");
            if (repoItem) {
                const repoId = parseInt(repoItem.dataset.id);
                this.state.selectedRepo = this.state.repositories.find(
                    (r) => r.id === repoId,
                );
                this.render();
            }

            if (target.closest(".import-btn") && this.state.selectedRepo) {
                this.fillForm(this.state.selectedRepo);
                this.remove();
            }
        });

        this.shadowRoot.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && e.target.id === "gh-username-input") {
                this.shadowRoot.querySelector(".save-username-btn")?.click();
            }
            if (e.key === "Escape") {
                this.remove();
            }
        });
    }

    fillForm(repo) {
        const titleInput = document.querySelector(
            'input[placeholder="Give your project a name"]',
        );
        if (titleInput) {
            titleInput.value = repo.name;
            titleInput.dispatchEvent(new Event("input", { bubbles: true }));
        }

        const demoLinkInput = document.querySelector(
            'input[placeholder*="flavortown.cooked.selfhosted"]',
        );
        if (demoLinkInput) {
            demoLinkInput.value = repo.homepage || repo.html_url;
            demoLinkInput.dispatchEvent(new Event("input", { bubbles: true }));
        }

        const repoInput = document.querySelector(
            'input[placeholder*="github.com/hackclub"]',
        );
        if (repoInput) {
            repoInput.value = repo.html_url;
            repoInput.dispatchEvent(new Event("input", { bubbles: true }));
        }

        const readmeUrl = `https://raw.githubusercontent.com/${repo.full_name}/refs/heads/${repo.default_branch}/README.md`;
        const readmeInput = document.querySelector(
            'input[placeholder*="raw.githubusercontent"]',
        );
        if (readmeInput) {
            readmeInput.value = readmeUrl;
            readmeInput.dispatchEvent(new Event("input", { bubbles: true }));
        }

        this.showNotification(
            "Project imported! Please fill in the description manually.",
            "success",
        );

        trackExtensionUsage();
    }

    showNotification(message, type) {
        const existing = document.querySelector(".gh-export-notification");
        if (existing) existing.remove();

        const notification = document.createElement("div");
        notification.className = "gh-export-notification";
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background-color: ${type === "success" ? "#238636" : "#f85149"};
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

        const style = document.createElement("style");
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = "slideIn 0.3s ease-out reverse";
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    getGitHubLogo() {
        return `<svg height="20" width="20" viewBox="320 320 440 440" class="icon"><g transform="translate(0,1080) scale(0.1,-0.1)" fill="currentColor" stroke="none"><path d="M5185 7549 c-351 -37 -680 -154 -970 -346 -370 -245 -635 -563 -810 -973 -186 -436 -214 -956 -78 -1435 124 -435 404 -841 770 -1116 216 -163 551 -329 664 -329 31 0 47 7 70 29 l29 29 0 222 0 221 -72 -8 c-115 -13 -286 -8 -355 10 -146 38 -221 103 -300 262 -90 179 -147 250 -259 327 -22 14 -46 38 -54 52 -12 24 -12 29 3 44 29 29 150 23 219 -11 70 -34 153 -115 213 -206 135 -205 312 -263 563 -185 42 14 53 22 58 43 20 102 59 188 106 237 l29 31 -63 7 c-212 24 -415 96 -564 201 -146 104 -252 265 -308 465 -44 156 -59 421 -32 562 26 132 96 285 173 377 l29 34 -18 71 c-12 47 -19 107 -19 177 0 112 8 164 42 267 l21 62 47 0 c108 0 283 -65 466 -174 l80 -48 95 21 c162 36 248 45 445 45 197 0 283 -9 445 -45 l96 -21 64 42 c161 104 359 180 471 180 56 0 57 0 72 -37 8 -21 22 -73 32 -116 22 -97 17 -308 -8 -375 l-16 -42 50 -66 c61 -81 98 -153 135 -264 27 -82 28 -92 28 -285 0 -182 -2 -210 -26 -312 -67 -280 -213 -476 -443 -591 -124 -61 -293 -110 -447 -128 l-58 -7 30 -34 c42 -47 68 -103 91 -190 17 -68 19 -113 19 -435 0 -301 2 -364 15 -388 34 -65 96 -67 245 -5 334 136 624 345 841 603 407 486 582 1092 493 1712 -115 803 -679 1479 -1447 1735 -291 97 -614 134 -902 104z"/><path d="M5208 6210 c-67 -20 -101 -65 -108 -140 l-5 -55 -66 -7 c-108 -10 -177 -57 -218 -148 -19 -40 -21 -65 -21 -248 l0 -202 -54 -24 c-59 -26 -76 -48 -76 -97 0 -42 77 -201 122 -253 l33 -38 50 18 c37 13 78 18 155 18 115 -1 170 -15 253 -65 l47 -29 0 340 0 340 -47 -19 c-27 -10 -95 -38 -153 -61 -58 -23 -111 -44 -117 -47 -10 -4 -13 28 -13 140 0 139 1 147 22 161 19 14 74 16 394 16 349 0 372 -1 388 -19 14 -16 16 -38 14 -159 l-3 -140 -160 64 c-88 35 -161 64 -162 64 -2 0 -3 -152 -3 -339 l0 -338 73 37 c111 59 238 75 347 45 30 -8 64 -17 75 -20 15 -4 29 6 59 47 50 69 108 192 109 235 1 44 -29 83 -80 101 l-41 15 -4 206 c-3 192 -5 209 -26 253 -46 92 -134 148 -236 148 l-46 0 0 38 c0 61 -38 123 -90 150 -41 20 -57 22 -215 21 -93 0 -182 -4 -197 -9z"/><path d="M4912 4864 c-24 -8 -77 -37 -118 -64 -45 -29 -96 -53 -129 -61 -51 -11 -57 -10 -108 15 -70 34 -109 34 -136 0 -12 -15 -21 -35 -21 -45 0 -51 105 -116 205 -126 76 -8 175 25 271 90 74 50 80 52 145 52 63 0 70 -2 136 -48 182 -125 295 -128 473 -12 47 31 95 58 108 62 52 13 112 -4 183 -51 104 -69 160 -89 254 -90 70 -1 87 3 138 29 65 32 87 57 87 95 0 33 -38 70 -73 70 -14 0 -46 -10 -69 -22 -79 -42 -140 -28 -280 62 -78 51 -125 63 -218 58 -80 -5 -119 -20 -220 -87 -125 -83 -169 -81 -303 16 -26 19 -70 44 -97 54 -61 23 -167 24 -228 3z"/></g></svg>`;
    }

    render() {
        const { view, username, repositories, selectedRepo, isLoading, error } =
            this.state;

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
                        ${isLoading ? this.renderLoading() : ""}
                        ${!isLoading && view === "setup" ? this.renderSetup() : ""}
                        ${!isLoading && view === "list" ? this.renderRepoList() : ""}
                    </div>

                    <footer class="footer">
                        <button class="btn btn-secondary cancel-btn">Cancel</button>
                        <button class="btn btn-primary import-btn" ${selectedRepo ? "" : "disabled"}>
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
        const createTokenUrl =
            "https://github.com/settings/tokens/new?description=Flavortown%20GitHub%20Exporter&scopes=public_repo";
        return `
            <div class="setup-view">
                <div class="form-group">
                    <label for="gh-token-input">GitHub Token</label>
                    <input
                        type="password"
                        id="gh-token-input"
                        placeholder="ghp_xxxxxxxxxxxx"
                        value="${this.state.token}"
                        autocomplete="off"
                        autofocus
                    >
                    <p class="helper-text">
                        <a href="${createTokenUrl}" target="_blank" style="color: var(--color-accent-fg);">Create a token</a> — click "Generate token" at the bottom of the page.
                    </p>
                </div>
                ${this.state.error ? `<p class="error-text">${this.state.error}</p>` : ""}
                <button class="btn btn-primary save-username-btn" style="width: 100%; margin-top: 12px;">Load Repositories</button>
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
                ${repositories
                    .map(
                        (repo) => `
                    <div class="repo-item ${selectedRepo?.id === repo.id ? "selected" : ""}" data-id="${repo.id}">
                        <input type="radio" class="repo-radio" name="github-repo" ${selectedRepo?.id === repo.id ? "checked" : ""}>
                        <div class="repo-details">
                            <div class="repo-name">${repo.name}</div>
                            <div class="repo-meta">
                                ${
                                    repo.language
                                        ? `
                                    <span class="lang-badge">
                                        <span class="lang-dot" style="background-color: ${repo.langColor}"></span>
                                        ${repo.language}
                                    </span>
                                `
                                        : ""
                                }
                                <span class="star-count">
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path></svg>
                                    ${repo.stars.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                `,
                    )
                    .join("")}
            </div>
        `;
    }
}

if (!customElements.get("github-import-modal")) {
    customElements.define("github-import-modal", GitHubImportModal);
}

function injectImportButton() {
    if (document.querySelector("#gh-import-btn")) return;

    // Find the exact heading element
    const heading = Array.from(
        document.querySelectorAll('h1, h2, h3, [role="heading"]'),
    ).find((el) => el.textContent.trim() === "Create a new Project");

    if (!heading) return;

    const button = document.createElement("button");
    button.id = "gh-import-btn";
    button.innerHTML = `
        <svg height="14" width="14" viewBox="320 320 440 440" style="fill: currentColor; margin-right: 4px;">
            <g transform="translate(0,1080) scale(0.1,-0.1)" fill="currentColor" stroke="none"><path d="M5185 7549 c-351 -37 -680 -154 -970 -346 -370 -245 -635 -563 -810 -973 -186 -436 -214 -956 -78 -1435 124 -435 404 -841 770 -1116 216 -163 551 -329 664 -329 31 0 47 7 70 29 l29 29 0 222 0 221 -72 -8 c-115 -13 -286 -8 -355 10 -146 38 -221 103 -300 262 -90 179 -147 250 -259 327 -22 14 -46 38 -54 52 -12 24 -12 29 3 44 29 29 150 23 219 -11 70 -34 153 -115 213 -206 135 -205 312 -263 563 -185 42 14 53 22 58 43 20 102 59 188 106 237 l29 31 -63 7 c-212 24 -415 96 -564 201 -146 104 -252 265 -308 465 -44 156 -59 421 -32 562 26 132 96 285 173 377 l29 34 -18 71 c-12 47 -19 107 -19 177 0 112 8 164 42 267 l21 62 47 0 c108 0 283 -65 466 -174 l80 -48 95 21 c162 36 248 45 445 45 197 0 283 -9 445 -45 l96 -21 64 42 c161 104 359 180 471 180 56 0 57 0 72 -37 8 -21 22 -73 32 -116 22 -97 17 -308 -8 -375 l-16 -42 50 -66 c61 -81 98 -153 135 -264 27 -82 28 -92 28 -285 0 -182 -2 -210 -26 -312 -67 -280 -213 -476 -443 -591 -124 -61 -293 -110 -447 -128 l-58 -7 30 -34 c42 -47 68 -103 91 -190 17 -68 19 -113 19 -435 0 -301 2 -364 15 -388 34 -65 96 -67 245 -5 334 136 624 345 841 603 407 486 582 1092 493 1712 -115 803 -679 1479 -1447 1735 -291 97 -614 134 -902 104z"/><path d="M5208 6210 c-67 -20 -101 -65 -108 -140 l-5 -55 -66 -7 c-108 -10 -177 -57 -218 -148 -19 -40 -21 -65 -21 -248 l0 -202 -54 -24 c-59 -26 -76 -48 -76 -97 0 -42 77 -201 122 -253 l33 -38 50 18 c37 13 78 18 155 18 115 -1 170 -15 253 -65 l47 -29 0 340 0 340 -47 -19 c-27 -10 -95 -38 -153 -61 -58 -23 -111 -44 -117 -47 -10 -4 -13 28 -13 140 0 139 1 147 22 161 19 14 74 16 394 16 349 0 372 -1 388 -19 14 -16 16 -38 14 -159 l-3 -140 -160 64 c-88 35 -161 64 -162 64 -2 0 -3 -152 -3 -339 l0 -338 73 37 c111 59 238 75 347 45 30 -8 64 -17 75 -20 15 -4 29 6 59 47 50 69 108 192 109 235 1 44 -29 83 -80 101 l-41 15 -4 206 c-3 192 -5 209 -26 253 -46 92 -134 148 -236 148 l-46 0 0 38 c0 61 -38 123 -90 150 -41 20 -57 22 -215 21 -93 0 -182 -4 -197 -9z"/><path d="M4912 4864 c-24 -8 -77 -37 -118 -64 -45 -29 -96 -53 -129 -61 -51 -11 -57 -10 -108 15 -70 34 -109 34 -136 0 -12 -15 -21 -35 -21 -45 0 -51 105 -116 205 -126 76 -8 175 25 271 90 74 50 80 52 145 52 63 0 70 -2 136 -48 182 -125 295 -128 473 -12 47 31 95 58 108 62 52 13 112 -4 183 -51 104 -69 160 -89 254 -90 70 -1 87 3 138 29 65 32 87 57 87 95 0 33 -38 70 -73 70 -14 0 -46 -10 -69 -22 -79 -42 -140 -28 -280 62 -78 51 -125 63 -218 58 -80 -5 -119 -20 -220 -87 -125 -83 -169 -81 -303 16 -26 19 -70 44 -97 54 -61 23 -167 24 -228 3z"/></g>
        </svg>
        Import
    `;
    button.style.cssText = `
        display: inline-flex;
        align-items: center;
        padding: 6px 10px;
        margin-left: 12px;
        background-color: #24292f;
        color: white;
        border: none;
        border-radius: 6px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.15s;
        vertical-align: middle;
    `;

    button.addEventListener("mouseenter", () => {
        button.style.backgroundColor = "#32383f";
    });
    button.addEventListener("mouseleave", () => {
        button.style.backgroundColor = "#24292f";
    });

    button.addEventListener("click", () => {
        if (!document.querySelector("github-import-modal")) {
            const modal = document.createElement("github-import-modal");
            document.body.appendChild(modal);
        }
    });

    // Insert button inside the heading, at the end
    heading.style.display = "inline-flex";
    heading.style.alignItems = "center";
    heading.appendChild(button);
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectImportButton);
} else {
    injectImportButton();
}

setTimeout(injectImportButton, 500);
setTimeout(injectImportButton, 1500);

trackExtensionUsage();
