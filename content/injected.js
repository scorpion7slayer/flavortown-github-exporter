/**
 * Flavortown GitHub Exporter - Injected Script (Main World)
 * This script runs in the page's main context to properly define custom elements
 */

const FLAVORTOWN_PROJECT_ID = "7195";

// OAuth App Client ID - User must create their own OAuth App on GitHub
// Instructions: https://github.com/settings/developers → New OAuth App
// Enable "Device Flow" in the app settings
const GITHUB_OAUTH_CLIENT_ID = "Ov23lixxt1BuziBP0cw3";

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

// ─── HTML Escaping Utility ───────────────────────────────────────────────────

function escapeHtml(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// ─── AI Provider Definitions ────────────────────────────────────────────────

const AI_PROVIDERS = {
    copilot: {
        name: "GitHub Copilot",
        description:
            "Uses OAuth authentication. Free: GPT-4.1, GPT-4o, GPT-5 Mini.",
        requiresApiKey: false,
        dynamicModels: true,
        fallbackModels: [
            { id: "gpt-4.1", name: "GPT-4.1", free: true },
            { id: "gpt-4o", name: "GPT-4o", free: true },
            { id: "gpt-5-mini", name: "GPT-5 Mini", free: true },
        ],
    },
    anthropic: {
        name: "Claude (Anthropic)",
        description: "Requires Anthropic API key",
        requiresApiKey: true,
        dynamicModels: false,
        fallbackModels: [
            {
                id: "claude-haiku-4-5-20250219",
                name: "Claude Haiku 4.5",
                free: false,
            },
        ],
    },
    openrouter: {
        name: "OpenRouter",
        description: "Requires API key - free models only",
        requiresApiKey: true,
        dynamicModels: true,
        fallbackModels: [
            {
                id: "meta-llama/llama-3.1-8b-instruct",
                name: "Llama 3.1 8B",
                free: true,
            },
            {
                id: "qwen/qwen2.5-14b-instruct",
                name: "Qwen 2.5 14B",
                free: true,
            },
            {
                id: "microsoft/phi-3-mini-128k-instruct",
                name: "Phi-3 Mini",
                free: true,
            },
            { id: "google/gemma-2-9b-it", name: "Gemma 2 9B", free: true },
        ],
    },
    chatgpt: {
        name: "ChatGPT (OpenAI)",
        description: "Requires OpenAI API key",
        requiresApiKey: true,
        dynamicModels: true,
        fallbackModels: [
            { id: "gpt-5.2", name: "GPT-5.2", free: false },
            { id: "gpt-5.2-mini", name: "GPT-5.2 Mini", free: false },
            { id: "gpt-5.2-large", name: "GPT-5.2 Large", free: false },
        ],
    },
    ollama: {
        name: "Ollama (Local)",
        description: "Run AI locally - no API key needed",
        requiresApiKey: false,
        hasUrlField: true,
        dynamicModels: true,
        fallbackModels: [],
    },
};

// ─── Changelog Data ─────────────────────────────────────────────────────────

const CHANGELOG = [
    {
        version: "2.5.0",
        changes: [
            "Free only models for OpenRouter",
            "Add button Generate with AI for AI Declaration",
            "improvement of the style for certain places which makes the interface prettier and pleasant",
            "free and inexpensive ai models kept only",
            'AI use detector in the project to advise writing in "AI Declaration" or generating with AI',
            "Security vulnerability fixes",
        ],
    },
    {
        version: "2.0.0",
        changes: [
            "AI description generation (Copilot, Ollama, ChatGPT, Claude, OpenRouter)",
            "Dynamic model loading for all AI providers",
            "Free only filter for OpenRouter",
            "Auto-generate descriptions on import",
            "Connection test for AI providers",
            "report an issue directly from the extension",
            "AI prompt customization and settings",
        ],
    },
    {
        version: "1.0.0",
        changes: [
            "Import GitHub repositories to Flavortown",
            "Auto-fill project fields (name, URL, README)",
            "Language detection with color badges",
            "Star count display",
        ],
    },
];

// ─── AI Description Service (messaging bridge to content script) ────────────

const AIDescriptionService = {
    _request(type, data, timeout = 30000) {
        return new Promise((resolve) => {
            const requestId = `${Date.now()}_${Math.random()}`;
            const responseType = {
                GET_AI_SETTINGS: "AI_SETTINGS_RESULT",
                SAVE_AI_SETTINGS: "AI_SETTINGS_SAVED",
                AI_GENERATE_DESCRIPTION: "AI_DESCRIPTION_RESULT",
                AI_GENERATE_DECLARATION: "AI_DECLARATION_RESULT",
                AI_TEST_CONNECTION: "AI_TEST_RESULT",
                AI_FETCH_MODELS: "AI_MODELS_RESULT",
            }[type];

            const handler = (event) => {
                if (
                    event.data.type === responseType &&
                    event.data.requestId === requestId
                ) {
                    window.removeEventListener("message", handler);
                    clearTimeout(timer);
                    resolve(event.data);
                }
            };
            window.addEventListener("message", handler);
            window.postMessage(
                { type, requestId, ...data },
                window.location.origin,
            );
            const timer = setTimeout(() => {
                window.removeEventListener("message", handler);
                resolve({ error: "Request timed out" });
            }, timeout);
        });
    },

    async getSettings() {
        const result = await this._request("GET_AI_SETTINGS", {});
        return result.settings;
    },

    async saveSettings(settings) {
        return this._request("SAVE_AI_SETTINGS", { settings });
    },

    async generate(repo, settings) {
        return this._request(
            "AI_GENERATE_DESCRIPTION",
            { repo, settings },
            60000,
        );
    },

    async generateDeclaration(projectTitle, projectDescription, settings) {
        return this._request(
            "AI_GENERATE_DECLARATION",
            { projectTitle, projectDescription, settings },
            60000,
        );
    },

    async testConnection(settings) {
        return this._request("AI_TEST_CONNECTION", { settings }, 30000);
    },

    async fetchModels(settings) {
        return this._request("AI_FETCH_MODELS", { settings }, 15000);
    },
};

// ─── AI Settings Modal Web Component ────────────────────────────────────────

class AISettingsModal extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.settings = {
            provider: "copilot",
            apiKey: "",
            model: "",
            ollamaUrl: "http://localhost:11434",
            autoGenerate: true,
            promptPreset: "normal",
            customPrompt: "",
            freeOnly: false,
        };
        this.testStatus = null;
        this.dynamicModels = [];
        this.modelsLoading = false;
        this.modelsError = null;
        this._listenerAC = null;
        this._loadGeneration = 0;
        this._modelDropdownOpen = false;
    }

    async connectedCallback() {
        const saved = await AIDescriptionService.getSettings();
        if (saved) {
            this.settings = { ...this.settings, ...saved };
        }
        const providerDef = AI_PROVIDERS[this.settings.provider];
        if (providerDef.dynamicModels) {
            this.modelsLoading = true;
        } else {
            this.dynamicModels = providerDef.fallbackModels;
        }
        this.render();
        this.addEventListeners();
        if (providerDef.dynamicModels) {
            this.loadModels(true);
        }
    }

    async loadModels(skipLoadingRender = false) {
        const generation = ++this._loadGeneration;
        const providerDef = AI_PROVIDERS[this.settings.provider];
        if (!providerDef.dynamicModels) {
            this.dynamicModels = providerDef.fallbackModels;
            this._updateModelSection();
            return;
        }
        this.modelsLoading = true;
        this.modelsError = null;
        if (!skipLoadingRender) {
            this._updateModelSection();
        }

        const result = await AIDescriptionService.fetchModels(this.settings);
        if (generation !== this._loadGeneration) return;
        this.modelsLoading = false;
        if (result.error) {
            this.modelsError = result.error;
            this.dynamicModels = providerDef.fallbackModels;
        } else {
            this.dynamicModels = result.models || providerDef.fallbackModels;
        }
        if (!this.settings.model && this.dynamicModels.length > 0) {
            if (this.settings.provider === "openrouter") {
                const freeRouter = this.dynamicModels.find(
                    (m) => m.id === "openrouter/free",
                );
                this.settings.model = freeRouter
                    ? freeRouter.id
                    : this.dynamicModels[0].id;
            } else {
                this.settings.model = this.dynamicModels[0].id;
            }
        }
        this._modelDropdownOpen = false;
        this._updateModelSection();
    }

    _renderModelSectionContent() {
        const providerDef = AI_PROVIDERS[this.settings.provider];
        let html = "";

        html += `<label for="ai-model-select" style="margin-bottom:8px;display:block;">Model</label>`;
        html += `<div style="display:flex;gap:8px;align-items:stretch;">`;

        if (this.modelsLoading) {
            html += `<div style="flex:1;padding:12px;background:var(--color-bg-subtle);border:1px solid var(--color-border-default);border-radius:6px;color:var(--color-fg-muted);font-size:13px;display:flex;align-items:center;">
                <span style="display:inline-block;width:14px;height:14px;border:2px solid var(--color-fg-muted);border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin-right:8px;flex-shrink:0;"></span>
                Loading models...
            </div>`;
        } else {
            let models =
                this.dynamicModels.length > 0
                    ? this.dynamicModels
                    : providerDef.fallbackModels;
            if (this.settings.freeOnly) models = models.filter((m) => m.free);
            const isOpenRouter = this.settings.provider === "openrouter";

            if (models.length > 0) {
                const selectedModel =
                    models.find((m) => m.id === this.settings.model) ||
                    models[0];
                html += `<div class="model-dropdown">
                    <button type="button" class="model-dropdown-trigger${this._modelDropdownOpen ? " open" : ""}">
                        <span>${escapeHtml(selectedModel.name)}</span>
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M4.427 7.427l3.396 3.396a.25.25 0 0 0 .354 0l3.396-3.396A.25.25 0 0 0 11.396 7H4.604a.25.25 0 0 0-.177.427Z"/></svg>
                    </button>
                    <div class="model-dropdown-list${this._modelDropdownOpen ? " open" : ""}">
                        ${models.map((m) => `<div class="model-dropdown-item${this.settings.model === m.id ? " selected" : ""}" data-value="${escapeHtml(m.id)}">${escapeHtml(m.name)}${m.free && !isOpenRouter ? " (Free)" : ""}</div>`).join("")}
                    </div>
                </div>`;
            } else {
                html += `<div style="flex:1;padding:12px;background:rgba(248,81,73,0.1);border:1px solid rgba(248,81,73,0.4);border-radius:6px;color:var(--color-danger-fg);font-size:13px;">No models available${this.settings.freeOnly ? " (try disabling Free only)" : ""}</div>`;
            }
        }

        html += `<div style="display:flex;gap:6px;">`;
        if (providerDef.hasFreeOnlyToggle) {
            html += `<button class="btn-free-only" style="padding:8px 12px;font-size:12px;border-radius:6px;cursor:pointer;border:1px solid;font-family:inherit;white-space:nowrap;${this.settings.freeOnly ? "background:rgba(46,160,67,0.2);border-color:#2ea043;color:#2ea043;font-weight:500;" : "background:var(--color-bg-subtle);border-color:var(--color-border-default);color:var(--color-fg-muted);"}">Free only</button>`;
        }
        if (providerDef.dynamicModels) {
            html += `<button class="btn-refresh" title="Refresh models" style="padding:8px 12px;font-size:12px;border-radius:6px;cursor:pointer;white-space:nowrap;background:var(--color-bg-subtle);border:1px solid var(--color-border-default);color:var(--color-fg-muted);font-family:inherit;">&#8635; Refresh</button>`;
        }
        html += `</div></div>`;

        if (this.modelsError) {
            html += `<span class="helper-text" style="color:var(--color-danger-fg);margin-top:6px;display:block;">${this.modelsError}</span>`;
        }

        return html;
    }

    _updateModelSection() {
        const container = this.shadowRoot.querySelector(
            "#model-section-container",
        );
        if (!container) {
            this.render();
            this.addEventListeners();
            return;
        }
        // eslint-disable-next-line no-unsanitized/property
        container.innerHTML = this._renderModelSectionContent();
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
                top: 0; left: 0;
                width: 100%; height: 100%;
                background: rgba(1, 4, 9, 0.85);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 100000;
                backdrop-filter: blur(3px);
            }

            .modal {
                width: 460px;
                max-height: 580px;
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
                display: flex;
                flex-direction: column;
                gap: 16px;
            }

            .content::-webkit-scrollbar { width: 8px; }
            .content::-webkit-scrollbar-track { background: transparent; }
            .content::-webkit-scrollbar-thumb {
                background: var(--color-border-default);
                border-radius: 10px;
            }

            .form-group { display: flex; flex-direction: column; gap: 6px; }
            .form-group label { font-weight: 500; font-size: 13px; }

            select, input[type="text"], input[type="password"] {
                width: 100%;
                background: var(--color-bg-default);
                border: 1px solid var(--color-border-default);
                border-radius: 6px;
                color: var(--color-fg-default);
                padding: 8px 12px;
                font-size: 13px;
                font-family: inherit;
                transition: border-color 0.2s, box-shadow 0.2s;
            }

            select:focus, input:focus {
                outline: none;
                border-color: var(--color-accent-fg);
                box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.3);
            }

            select { cursor: pointer; }
            select option { background: var(--color-bg-overlay); color: var(--color-fg-default); }

            .helper-text { font-size: 11px; color: var(--color-fg-muted); }

            .provider-badge {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 500;
                background: rgba(88, 166, 255, 0.15);
                color: var(--color-accent-fg);
            }

            .provider-badge.free {
                background: rgba(46, 160, 67, 0.15);
                color: var(--color-success-emphasis);
            }

            .checkbox-group {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 12px;
                background: var(--color-bg-subtle);
                border: 1px solid var(--color-border-default);
                border-radius: 6px;
                cursor: pointer;
            }

            .checkbox-group input[type="checkbox"] {
                width: 16px; height: 16px;
                accent-color: var(--color-accent-fg);
                cursor: pointer;
            }

            .checkbox-group label { cursor: pointer; flex: 1; }

            .footer {
                padding: 16px;
                background: var(--color-bg-overlay);
                border-top: 1px solid var(--color-border-default);
                display: flex;
                justify-content: space-between;
                align-items: center;
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
                font-family: inherit;
            }

            .btn-primary {
                background-color: var(--color-success-fg);
                border-color: rgba(240, 246, 252, 0.1);
                color: #ffffff;
            }
            .btn-primary:hover:not(:disabled) { background-color: var(--color-success-emphasis); }
            .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

            .btn-secondary {
                background-color: var(--color-btn-bg);
                border-color: var(--color-border-default);
                color: var(--color-fg-default);
            }
            .btn-secondary:hover { background-color: var(--color-btn-hover-bg); border-color: #8b949e; }

            .btn-test {
                background-color: transparent;
                border-color: var(--color-border-default);
                color: var(--color-accent-fg);
                font-size: 12px;
                padding: 6px 12px;
            }
            .btn-test:hover { background-color: var(--color-btn-hover-bg); }

            .test-result {
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 12px;
                animation: modalFadeIn 0.2s ease;
            }
            .test-result.success {
                background: rgba(46, 160, 67, 0.15);
                border: 1px solid rgba(46, 160, 67, 0.4);
                color: var(--color-success-emphasis);
            }
            .test-result.error {
                background: rgba(248, 81, 73, 0.15);
                border: 1px solid rgba(248, 81, 73, 0.4);
                color: var(--color-danger-fg);
            }

            .divider {
                border: none;
                border-top: 1px solid var(--color-border-muted);
                margin: 4px 0;
            }

            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            .model-dropdown { position: relative; flex: 1; min-width: 0; }

            .model-dropdown-trigger {
                width: 100%;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 8px;
                padding: 10px 12px;
                font-size: 13px;
                border-radius: 6px;
                border: 1px solid var(--color-border-default);
                background: var(--color-bg-subtle);
                color: var(--color-fg-default);
                cursor: pointer;
                font-family: inherit;
                text-align: left;
                transition: border-color 0.2s, box-shadow 0.2s;
            }
            .model-dropdown-trigger:hover { border-color: var(--color-accent-fg); }
            .model-dropdown-trigger.open {
                border-color: var(--color-accent-fg);
                box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.2);
            }
            .model-dropdown-trigger span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .model-dropdown-trigger svg { flex-shrink: 0; transition: transform 0.15s; }
            .model-dropdown-trigger.open svg { transform: rotate(180deg); }

            .model-dropdown-list {
                display: none;
                position: fixed;
                background: var(--color-bg-overlay);
                border: 1px solid var(--color-accent-fg);
                border-radius: 6px;
                max-height: 200px;
                overflow-y: auto;
                z-index: 2147483647;
                box-shadow: 0 8px 24px rgba(1, 4, 9, 0.8);
            }
            .model-dropdown-list.open { display: block; }

            .model-dropdown-list::-webkit-scrollbar { width: 6px; }
            .model-dropdown-list::-webkit-scrollbar-track { background: var(--color-bg-overlay); }
            .model-dropdown-list::-webkit-scrollbar-thumb {
                background: var(--color-border-default);
                border-radius: 3px;
            }
            .model-dropdown-list::-webkit-scrollbar-thumb:hover { background: var(--color-fg-muted); }

            .model-dropdown-item {
                padding: 8px 12px;
                cursor: pointer;
                font-size: 13px;
                color: var(--color-fg-default);
                transition: background 0.1s;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .model-dropdown-item:hover { background: var(--color-bg-subtle); }
            .model-dropdown-item.selected {
                background: rgba(88, 166, 255, 0.12);
                color: var(--color-accent-fg);
                font-weight: 500;
            }
        `;
    }

    addEventListeners() {
        if (this._listenerAC) this._listenerAC.abort();
        this._listenerAC = new AbortController();
        const { signal } = this._listenerAC;

        this.shadowRoot.addEventListener(
            "click",
            (e) => {
                if (
                    e.target.closest(".close-btn") ||
                    e.target.classList.contains("overlay")
                ) {
                    this.remove();
                }
                if (e.target.closest(".model-dropdown-trigger")) {
                    this._modelDropdownOpen = !this._modelDropdownOpen;
                    const trigger = this.shadowRoot.querySelector(
                        ".model-dropdown-trigger",
                    );
                    const list = this.shadowRoot.querySelector(
                        ".model-dropdown-list",
                    );
                    if (trigger)
                        trigger.classList.toggle(
                            "open",
                            this._modelDropdownOpen,
                        );
                    if (list) {
                        list.classList.toggle("open", this._modelDropdownOpen);
                        if (this._modelDropdownOpen && trigger) {
                            const rect = trigger.getBoundingClientRect();
                            list.style.top = `${rect.bottom + 2}px`;
                            list.style.left = `${rect.left}px`;
                            list.style.width = `${rect.width}px`;
                            const selected = list.querySelector(
                                ".model-dropdown-item.selected",
                            );
                            if (selected)
                                selected.scrollIntoView({ block: "nearest" });
                        }
                    }
                    return;
                }
                const item = e.target.closest(".model-dropdown-item");
                if (item) {
                    const newModel = item.dataset.value;
                    this._modelDropdownOpen = false;
                    if (newModel !== this.settings.model) {
                        this.settings.model = newModel;
                        this._updateModelSection();
                    } else {
                        const trigger = this.shadowRoot.querySelector(
                            ".model-dropdown-trigger",
                        );
                        const list = this.shadowRoot.querySelector(
                            ".model-dropdown-list",
                        );
                        if (trigger) trigger.classList.remove("open");
                        if (list) list.classList.remove("open");
                    }
                    return;
                }
                // Fermer le dropdown si clic en dehors
                if (
                    this._modelDropdownOpen &&
                    !e.target.closest(".model-dropdown")
                ) {
                    this._modelDropdownOpen = false;
                    const trigger = this.shadowRoot.querySelector(
                        ".model-dropdown-trigger",
                    );
                    const list = this.shadowRoot.querySelector(
                        ".model-dropdown-list",
                    );
                    if (trigger) trigger.classList.remove("open");
                    if (list) list.classList.remove("open");
                }
                if (e.target.closest(".btn-refresh")) {
                    this.loadModels();
                }
                if (e.target.closest(".btn-free-only")) {
                    this.settings.freeOnly = !this.settings.freeOnly;
                    this._updateModelSection();
                }
                if (e.target.closest("#open-prompt-settings")) {
                    showPromptSettingsModal(this.settings, (updated) => {
                        Object.assign(this.settings, updated);
                        this.render();
                        this.addEventListeners();
                    });
                }
            },
            { signal },
        );

        this.shadowRoot.addEventListener(
            "change",
            (e) => {
                if (e.target.id === "ai-provider-select") {
                    this.settings.provider = e.target.value;
                    this.settings.model = "";
                    this.settings.apiKey = "";
                    this.settings.freeOnly = false;
                    this.testStatus = null;
                    this.dynamicModels = [];
                    this._modelDropdownOpen = false;
                    const newProviderDef = AI_PROVIDERS[this.settings.provider];
                    if (newProviderDef.dynamicModels) this.modelsLoading = true;
                    this.render();
                    this.addEventListeners();
                    this.loadModels(true);
                }
                if (e.target.id === "ai-model-select") {
                    this.settings.model = e.target.value;
                }
                if (e.target.id === "ai-auto-generate") {
                    this.settings.autoGenerate = e.target.checked;
                }
                if (e.target.id === "ai-prompt-preset") {
                    this.settings.promptPreset = e.target.value;
                    this.render();
                    this.addEventListeners();
                }
            },
            { signal },
        );

        this.shadowRoot.addEventListener(
            "input",
            (e) => {
                if (e.target.id === "ai-api-key") {
                    this.settings.apiKey = e.target.value.trim();
                }
                if (e.target.id === "ai-ollama-url") {
                    this.settings.ollamaUrl = e.target.value.trim();
                }
                if (e.target.id === "ai-custom-model") {
                    this.settings.model = e.target.value.trim();
                }
                if (e.target.id === "ai-custom-prompt") {
                    this.settings.customPrompt = e.target.value;
                }
            },
            { signal },
        );

        this.shadowRoot.addEventListener(
            "keydown",
            (e) => {
                if (e.key === "Escape") this.remove();
            },
            { signal },
        );

        const testBtn = this.shadowRoot.querySelector(".btn-test");
        if (testBtn) {
            testBtn.addEventListener(
                "click",
                async () => {
                    testBtn.disabled = true;
                    testBtn.textContent = "Testing...";
                    this.testStatus = null;
                    const result = await AIDescriptionService.testConnection(
                        this.settings,
                    );
                    this.testStatus = result;
                    this.render();
                    this.addEventListeners();
                },
                { signal },
            );
        }

        const saveBtn = this.shadowRoot.querySelector(".save-btn");
        if (saveBtn) {
            saveBtn.addEventListener(
                "click",
                async () => {
                    await AIDescriptionService.saveSettings(this.settings);
                    this.remove();
                    showGlobalNotification("AI settings saved!", "success");
                },
                { signal },
            );
        }
    }

    render() {
        const provider = AI_PROVIDERS[this.settings.provider];
        const isFree =
            this.settings.provider === "github" ||
            this.settings.provider === "ollama" ||
            this.settings.provider === "openrouter";

        // eslint-disable-next-line no-unsanitized/property
        this.shadowRoot.innerHTML = `
            <style>${this.getStyles()}</style>
            <div class="overlay">
                <div class="modal">
                    <header class="header">
                        <div class="header-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                            <span>AI Description Settings</span>
                        </div>
                        <button class="close-btn" aria-label="Close">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.749.749 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path></svg>
                        </button>
                    </header>

                    <div class="content">
                        <div class="form-group">
                            <label for="ai-provider-select">AI Provider</label>
                            <select id="ai-provider-select">
                                ${Object.entries(AI_PROVIDERS)
                                    .map(
                                        ([key, p]) =>
                                            `<option value="${key}" ${this.settings.provider === key ? "selected" : ""}>${p.name}</option>`,
                                    )
                                    .join("")}
                            </select>
                            <span class="helper-text">
                                ${provider.description}
                                ${isFree ? ' <span class="provider-badge free">Free</span>' : ""}
                            </span>
                        </div>

                        ${this.renderProviderFields()}

                        <hr class="divider">

                        <button class="btn btn-secondary" id="open-prompt-settings" style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:10px 14px;">
                            <span style="display:flex;align-items:center;gap:8px;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/></svg>
                                Prompt &amp; Auto-description Settings
                            </span>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
                        </button>

                        ${this.renderTestResult()}
                    </div>

                    <footer class="footer">
                        <button class="btn btn-test">Test Connection</button>
                        <div style="display:flex;gap:8px;">
                            <button class="btn btn-secondary close-btn">Cancel</button>
                            <button class="btn btn-primary save-btn">Save Settings</button>
                        </div>
                    </footer>
                </div>
            </div>
        `;
    }

    renderProviderFields() {
        const { provider } = this.settings;
        const providerDef = AI_PROVIDERS[provider];
        let html = "";

        // API Key field
        if (providerDef.requiresApiKey) {
            const placeholder =
                {
                    chatgpt: "sk-...",
                    claude: "sk-ant-...",
                    openrouter: "sk-or-...",
                }[provider] || "Enter API key";

            html += `
                <div class="form-group">
                    <label for="ai-api-key">API Key</label>
                    <input type="password" id="ai-api-key" placeholder="${placeholder}" value="${escapeHtml(this.settings.apiKey)}" autocomplete="off">
                </div>
            `;
        }

        // Ollama URL field
        if (providerDef.hasUrlField) {
            html += `
                <div class="form-group">
                    <label for="ai-ollama-url">Server URL</label>
                    <input type="text" id="ai-ollama-url" placeholder="http://localhost:11434" value="${escapeHtml(this.settings.ollamaUrl || "http://localhost:11434")}">
                    <span class="helper-text">Make sure Ollama is running locally</span>
                </div>
            `;
        }

        // GitHub Copilot info
        if (provider === "copilot") {
            html += `
                <div class="form-group">
                    <span class="helper-text" style="padding:8px 12px;background:var(--color-bg-subtle);border-radius:6px;border:1px solid var(--color-border-default);">
                        Uses OAuth authentication. Free models are available for <strong style="color:var(--color-fg-default)">Copilot Pro</strong> and <strong style="color:var(--color-fg-default)">Pro+</strong> subscribers.
                    </span>
                </div>
            `;
        }

        // Dynamic model selector with loading state
        html += `<div class="form-group" id="model-section-container">${this._renderModelSectionContent()}</div>`;

        // Custom model input for Ollama
        if (provider === "ollama") {
            html += `
                <div class="form-group">
                    <label for="ai-custom-model">Or enter custom model name</label>
                    <input type="text" id="ai-custom-model" placeholder="e.g., qwen3-vl:latest, deepseek-r1:latest" value="${escapeHtml(this.settings.model && !this.dynamicModels.find((m) => m.id === this.settings.model) ? this.settings.model : "")}">
                    <span class="helper-text">Embedding models are automatically excluded. Use <code style="color:var(--color-accent-fg)">ollama list</code> to see installed models.</span>
                </div>
            `;
        }

        return html;
    }

    renderTestResult() {
        if (!this.testStatus) return "";
        if (this.testStatus.success) {
            return `<div class="test-result success">Connection successful!</div>`;
        }
        return `<div class="test-result error">Error: ${escapeHtml(this.testStatus.error || "Connection failed")}</div>`;
    }
}

if (!customElements.get("ai-settings-modal")) {
    customElements.define("ai-settings-modal", AISettingsModal);
}

// ─── Global Notification Helper ─────────────────────────────────────────────

function showGlobalNotification(message, type) {
    const existing = document.querySelector(".gh-export-notification");
    if (existing) existing.remove();

    const notification = document.createElement("div");
    notification.className = "gh-export-notification";
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${type === "success" ? "#238636" : type === "info" ? "#1f6feb" : "#f85149"};
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

// ─── Generating Placeholder Animation ────────────────────────────────────────

let _genAnimInterval = null;

function injectGeneratingStyle() {
    if (document.getElementById("ai-gen-placeholder-style")) return;
    const style = document.createElement("style");
    style.id = "ai-gen-placeholder-style";
    style.textContent = `
        @keyframes ai-pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 1; }
        }
        textarea.ai-generating::placeholder {
            animation: ai-pulse 1.5s ease-in-out infinite;
            color: #6e40c9;
            font-style: italic;
        }
        textarea.ai-generating {
            pointer-events: none;
        }
    `;
    document.head.appendChild(style);
}

function startGeneratingAnimation(textarea) {
    injectGeneratingStyle();
    const saved = { placeholder: textarea.placeholder, value: textarea.value };
    textarea.value = "";
    textarea.classList.add("ai-generating");
    let dots = 0;
    textarea.placeholder = "Generating with AI...";
    _genAnimInterval = setInterval(() => {
        dots = (dots + 1) % 4;
        textarea.placeholder = "Generating with AI" + ".".repeat(dots || 1);
    }, 400);
    return saved;
}

function stopGeneratingAnimation(textarea, saved) {
    if (_genAnimInterval) {
        clearInterval(_genAnimInterval);
        _genAnimInterval = null;
    }
    textarea.classList.remove("ai-generating");
    textarea.placeholder = saved.placeholder;
    if (!textarea.value) textarea.value = saved.value;
}

// ─── Description Field Finder ───────────────────────────────────────────────

function findDescriptionTextarea() {
    const textareas = Array.from(document.querySelectorAll("textarea"));
    if (textareas.length === 0) return null;

    // Exclude IA/declaration-related textareas
    const excludePattern = /declaration|intellectual|ai.?usage|ia.?decl/i;

    function getFieldContext(ta) {
        const name = ta.name || "";
        const id = ta.id || "";
        const placeholder = ta.placeholder || "";
        let labelText = "";
        if (ta.id) {
            const label = document.querySelector(
                `label[for="${CSS.escape(ta.id)}"]`,
            );
            if (label) labelText = label.textContent;
        }
        if (!labelText) {
            const parent =
                ta.closest(
                    "[class*='form'], [class*='field'], [class*='group']",
                ) || ta.parentElement;
            if (parent) {
                const label = parent.querySelector("label");
                if (label) labelText = label.textContent;
            }
        }
        return `${name} ${id} ${placeholder} ${labelText}`;
    }

    // Strategy 1: find by name/id/placeholder explicitly containing "description"
    for (const ta of textareas) {
        const ctx = getFieldContext(ta);
        if (excludePattern.test(ctx)) continue;
        if (/description/i.test(ctx)) return ta;
    }

    // Strategy 2: find by "about" or "tell us" in placeholder
    for (const ta of textareas) {
        const ctx = getFieldContext(ta);
        if (excludePattern.test(ctx)) continue;
        if (/about|tell us/i.test(ta.placeholder || "")) return ta;
    }

    // Strategy 3: first textarea that is NOT ia/declaration
    for (const ta of textareas) {
        const ctx = getFieldContext(ta);
        if (excludePattern.test(ctx)) continue;
        return ta;
    }

    return null;
}

// ─── Prompt Settings Modal ───────────────────────────────────────────────────

const PROMPT_PRESETS = [
    {
        id: "detailed",
        label: "Detailed",
        desc: "4-6 sentences, covers features & tech stack. Factual, no hallucination.",
    },
    {
        id: "normal",
        label: "Normal",
        desc: "2-4 sentences, balanced. Recommended for most projects.",
        recommended: true,
    },
    {
        id: "minimal",
        label: "Minimal",
        desc: "1-2 sentences, ultra-short. Just the essentials.",
    },
    {
        id: "custom",
        label: "Custom",
        desc: "Write your own prompt instructions.",
    },
];

function showPromptSettingsModal(currentSettings, onSave) {
    const existing = document.querySelector(".gh-prompt-overlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.className = "gh-prompt-overlay";
    overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:100000;display:flex;align-items:center;justify-content:center;`;

    const modal = document.createElement("div");
    modal.style.cssText = `
        background:#0d1117;border:1px solid #30363d;border-radius:12px;
        width:480px;max-height:80vh;display:flex;flex-direction:column;
        box-shadow:0 8px 32px rgba(0,0,0,0.4);overflow:hidden;
        font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif;
        color:#c9d1d9;font-size:13px;
    `;

    let preset = currentSettings.promptPreset || "normal";
    let customPrompt = currentSettings.customPrompt || "";
    let autoGen = currentSettings.autoGenerate !== false;

    function render() {
        modal.innerHTML = `
            <div style="padding:16px;background:#161b22;border-bottom:1px solid #30363d;display:flex;align-items:center;justify-content:space-between;">
                <div style="display:flex;align-items:center;gap:10px;font-weight:600;font-size:14px;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z"/></svg>
                    Prompt Settings
                </div>
                <button class="prompt-close-btn" style="background:none;border:none;color:#8b949e;cursor:pointer;padding:4px;border-radius:6px;display:flex;">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.749.749 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path></svg>
                </button>
            </div>
            <div style="padding:20px;flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:16px;">
                <div style="display:flex;flex-direction:column;gap:6px;">
                    <label style="font-size:12px;font-weight:600;color:#8b949e;">Prompt preset</label>
                    <div style="display:flex;flex-direction:column;gap:6px;">
                        ${PROMPT_PRESETS.map(
                            (p) => `
                            <label data-preset="${p.id}" style="
                                display:flex;align-items:flex-start;gap:10px;padding:10px 12px;
                                background:${preset === p.id ? "#1f2937" : "#0d1117"};
                                border:1px solid ${preset === p.id ? "#58a6ff" : "#30363d"};
                                border-radius:8px;cursor:pointer;transition:all 0.15s;
                            ">
                                <input type="radio" name="prompt-preset" value="${p.id}" ${preset === p.id ? "checked" : ""}
                                    style="margin-top:2px;accent-color:#58a6ff;">
                                <div style="flex:1;">
                                    <div style="font-weight:600;font-size:13px;color:${preset === p.id ? "#58a6ff" : "#c9d1d9"};">
                                        ${p.label}${p.recommended ? ' <span style="font-size:10px;padding:1px 6px;background:rgba(46,160,67,0.15);color:#2ea043;border-radius:10px;font-weight:500;">Recommended</span>' : ""}
                                    </div>
                                    <div style="font-size:11px;color:#8b949e;margin-top:2px;">${p.desc}</div>
                                </div>
                            </label>
                        `,
                        ).join("")}
                    </div>
                </div>
                ${
                    preset === "custom"
                        ? `
                    <div style="display:flex;flex-direction:column;gap:6px;">
                        <label style="font-size:12px;font-weight:600;color:#8b949e;">Custom prompt</label>
                        <textarea id="prompt-custom-input" rows="4" placeholder="e.g. Describe this project in a fun, casual tone..." style="
                            background:#161b22;border:1px solid #30363d;border-radius:6px;padding:8px 12px;
                            color:#c9d1d9;font-family:inherit;font-size:13px;outline:none;resize:vertical;
                            width:100%;box-sizing:border-box;
                        ">${escapeHtml(customPrompt)}</textarea>
                        <span style="font-size:10px;color:#8b949e;">Project info (name, language, README) is appended automatically.</span>
                    </div>
                `
                        : ""
                }
                <div style="border-top:1px solid #30363d;padding-top:14px;display:flex;align-items:center;gap:10px;">
                    <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;">
                        <input type="checkbox" id="prompt-auto-gen" ${autoGen ? "checked" : ""} style="accent-color:#58a6ff;">
                        Auto-generate description on import
                    </label>
                </div>
            </div>
            <div style="padding:12px 16px;background:#161b22;border-top:1px solid #30363d;display:flex;justify-content:flex-end;gap:8px;">
                <button class="prompt-close-btn" style="padding:6px 16px;background:transparent;border:1px solid #30363d;border-radius:6px;color:#c9d1d9;font-family:inherit;font-size:12px;cursor:pointer;">Cancel</button>
                <button id="prompt-save-btn" style="padding:6px 16px;background:#238636;border:none;border-radius:6px;color:white;font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;">Save</button>
            </div>
        `;

        // Preset radio change
        modal
            .querySelectorAll("input[name='prompt-preset']")
            .forEach((radio) => {
                radio.addEventListener("change", (e) => {
                    preset = e.target.value;
                    render();
                });
            });
        // Clickable label rows
        modal.querySelectorAll("[data-preset]").forEach((row) => {
            row.addEventListener("click", (e) => {
                if (e.target.tagName === "INPUT") return;
                preset = row.dataset.preset;
                render();
            });
        });

        // Custom prompt text
        const customInput = modal.querySelector("#prompt-custom-input");
        if (customInput) {
            customInput.addEventListener("input", (e) => {
                customPrompt = e.target.value;
            });
        }

        // Auto-generate checkbox
        const autoGenCb = modal.querySelector("#prompt-auto-gen");
        if (autoGenCb) {
            autoGenCb.addEventListener("change", (e) => {
                autoGen = e.target.checked;
            });
        }

        // Save
        modal
            .querySelector("#prompt-save-btn")
            ?.addEventListener("click", () => {
                onSave({
                    promptPreset: preset,
                    customPrompt,
                    autoGenerate: autoGen,
                });
                overlay.remove();
            });

        // Close
        modal.querySelectorAll(".prompt-close-btn").forEach((btn) => {
            btn.addEventListener("click", () => overlay.remove());
        });
    }

    render();
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.remove();
    });
    document.addEventListener("keydown", function esc(e) {
        if (e.key === "Escape") {
            overlay.remove();
            document.removeEventListener("keydown", esc);
        }
    });
}

// ─── Generate Description Button (injected near description field) ──────────

let lastImportedRepo = null;

function injectGenerateButton(repo) {
    if (repo) lastImportedRepo = repo;

    if (document.querySelector("#ai-generate-desc-wrapper")) return;

    const descField = findDescriptionTextarea();

    if (!descField) return;

    // Wrapper for split button
    const wrapper = document.createElement("div");
    wrapper.id = "ai-generate-desc-wrapper";
    wrapper.style.cssText = `display:inline-flex;margin-top:8px;position:relative;`;

    const btn = document.createElement("button");
    btn.id = "ai-generate-desc-btn";
    btn.type = "button";
    btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
        Generate with AI
    `;
    btn.style.cssText = `
        display: inline-flex;
        align-items: center;
        padding: 6px 12px;
        background-color: #24292f;
        color: white;
        border: none;
        border-radius: 6px 0 0 6px;
        font-family: inherit;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.15s;
    `;

    const arrow = document.createElement("button");
    arrow.type = "button";
    arrow.title = "Prompt settings";
    arrow.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"/></svg>`;
    arrow.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 6px 8px;
        background-color: #24292f;
        color: white;
        border: none;
        border-left: 1px solid #484f58;
        border-radius: 0 6px 6px 0;
        cursor: pointer;
        transition: background-color 0.15s;
    `;

    btn.addEventListener("mouseenter", () => {
        btn.style.backgroundColor = "#32383f";
    });
    btn.addEventListener("mouseleave", () => {
        btn.style.backgroundColor = "#24292f";
    });
    arrow.addEventListener("mouseenter", () => {
        arrow.style.backgroundColor = "#32383f";
    });
    arrow.addEventListener("mouseleave", () => {
        arrow.style.backgroundColor = "#24292f";
    });

    arrow.addEventListener("click", async () => {
        const settings = await AIDescriptionService.getSettings();
        const current = settings || {};
        showPromptSettingsModal(current, async (updated) => {
            const merged = Object.assign({}, current, updated);
            await AIDescriptionService.saveSettings(merged);
            showGlobalNotification("Prompt settings saved!", "success");
        });
    });

    wrapper.appendChild(btn);
    wrapper.appendChild(arrow);

    btn.addEventListener("click", async () => {
        if (!lastImportedRepo) {
            showGlobalNotification(
                "Import a project first to generate a description.",
                "error",
            );
            return;
        }

        const settings = await AIDescriptionService.getSettings();
        if (!settings || !settings.provider) {
            const modal = document.createElement("ai-settings-modal");
            document.body.appendChild(modal);
            return;
        }

        btn.disabled = true;
        btn.style.opacity = "0.7";
        const originalHTML = btn.innerHTML;
        btn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.5" style="animation:spin 1s linear infinite;margin-right:4px;">
                <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
                <path d="M8 2a6 6 0 1 0 6 6" stroke-linecap="round"></path>
            </svg>
            Generating...
        `;

        const savedAnim = startGeneratingAnimation(descField);

        const result = await AIDescriptionService.generate(
            lastImportedRepo,
            settings,
        );

        stopGeneratingAnimation(descField, savedAnim);

        if (result.description) {
            descField.value = result.description;
            descField.dispatchEvent(new Event("input", { bubbles: true }));
            descField.dispatchEvent(new Event("change", { bubbles: true }));
            showGlobalNotification("Description generated!", "success");
        } else {
            showGlobalNotification(
                `AI error: ${result.error || "Unknown error"}`,
                "error",
            );
        }

        btn.disabled = false;
        btn.style.opacity = "1";
        btn.innerHTML = originalHTML;
    });

    descField.parentNode.insertBefore(wrapper, descField.nextSibling);
}

// ─── AI Declaration Button (inline with label) ───────────────────────────────

function _triggerDeclarationGeneration(btn, declarationField) {
    btn.addEventListener("click", async () => {
        const settings = await AIDescriptionService.getSettings();
        if (!settings || !settings.provider) {
            const modal = document.createElement("ai-settings-modal");
            document.body.appendChild(modal);
            return;
        }

        const projectTitle =
            (document.querySelector("#project_title") || {}).value || "";
        const projectDescription =
            (document.querySelector("#project_description") || {}).value || "";

        btn.disabled = true;
        btn.style.opacity = "0.7";
        const originalHTML = btn.innerHTML;
        btn.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" style="animation:spin 1s linear infinite;margin-right:4px;">
                <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
                <path d="M8 2a6 6 0 1 0 6 6" stroke-linecap="round"></path>
            </svg>
            Generating...
        `;

        const savedAnim = startGeneratingAnimation(declarationField);

        const result = await AIDescriptionService.generateDeclaration(
            projectTitle,
            projectDescription,
            settings,
        );

        stopGeneratingAnimation(declarationField, savedAnim);

        if (result.declaration) {
            declarationField.value = result.declaration;
            declarationField.dispatchEvent(
                new Event("input", { bubbles: true }),
            );
            declarationField.dispatchEvent(
                new Event("change", { bubbles: true }),
            );
            showGlobalNotification("AI declaration generated!", "success");
        } else {
            showGlobalNotification(
                `AI error: ${result.error || "Unknown error"}`,
                "error",
            );
        }

        btn.disabled = false;
        btn.style.opacity = "1";
        btn.innerHTML = originalHTML;
    });
}

function _makeDeclarationBtn(small = false) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.innerHTML = `
        <svg width="${small ? 11 : 12}" height="${small ? 11 : 12}" viewBox="0 0 24 24" fill="currentColor" style="margin-right:4px;opacity:0.9;">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
        Generate with AI
    `;
    btn.style.cssText = `
        display: inline-flex;
        align-items: center;
        padding: ${small ? "4px 9px" : "5px 10px"};
        background: rgba(88,166,255,0.12);
        color: #58a6ff;
        border: 1px solid rgba(88,166,255,0.3);
        border-radius: 5px;
        font-family: inherit;
        font-size: ${small ? "11px" : "11.5px"};
        font-weight: 500;
        cursor: pointer;
        transition: background 0.15s, border-color 0.15s;
        white-space: nowrap;
        flex-shrink: 0;
    `;
    btn.addEventListener("mouseenter", () => {
        btn.style.background = "rgba(88,166,255,0.22)";
        btn.style.borderColor = "rgba(88,166,255,0.6)";
    });
    btn.addEventListener("mouseleave", () => {
        btn.style.background = "rgba(88,166,255,0.12)";
        btn.style.borderColor = "rgba(88,166,255,0.3)";
    });
    return btn;
}

function injectAIDeclarationButton() {
    if (document.querySelector("#ai-declaration-label-row")) return;

    const declarationField = document.querySelector("#project_ai_declaration");
    if (!declarationField) return;

    const inputContainer =
        declarationField.closest(".input") || declarationField.parentNode;

    // Use position:absolute so the button is unaffected by the container's
    // flex/overflow layout and is guaranteed to be visible.
    inputContainer.style.position = "relative";

    const btn = document.createElement("button");
    btn.id = "ai-declaration-label-row";
    btn.type = "button";
    btn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-right:5px;">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
        Generate with AI
    `;
    btn.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 10;
        display: inline-flex;
        align-items: center;
        padding: 5px 10px;
        background: #24292f;
        color: #ffffff;
        border: 1px solid #484f58;
        border-radius: 6px;
        font-family: inherit;
        font-size: 11.5px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.15s;
        white-space: nowrap;
    `;
    btn.addEventListener("mouseenter", () => {
        btn.style.background = "#32383f";
    });
    btn.addEventListener("mouseleave", () => {
        btn.style.background = "#24292f";
    });

    _triggerDeclarationGeneration(btn, declarationField);
    inputContainer.appendChild(btn);
}

// ─── AI Contribution Detection ───────────────────────────────────────────────

const AI_BOT_LOGINS = [
    "github-copilot[bot]",
    "copilot-swe-agent[bot]",
    "devin-ai-integration[bot]",
    "cursor-nightly[bot]",
    "coderabbitai[bot]",
];

const AI_COMMIT_PATTERNS = [
    { re: /co-authored-by:[^\n]*copilot/i, tool: "GitHub Copilot" },
    { re: /co-authored-by:[^\n]*claude/i, tool: "Claude" },
    { re: /co-authored-by:[^\n]*anthropic/i, tool: "Claude" },
    { re: /co-authored-by:[^\n]*cursor/i, tool: "Cursor" },
    { re: /co-authored-by:[^\n]*devin/i, tool: "Devin AI" },
    { re: /co-authored-by:[^\n]*chatgpt/i, tool: "ChatGPT" },
    { re: /co-authored-by:[^\n]*gpt-/i, tool: "ChatGPT" },
    { re: /generated (with|by|using) claude/i, tool: "Claude" },
    { re: /generated (with|by|using) copilot/i, tool: "GitHub Copilot" },
    { re: /generated (with|by|using) cursor/i, tool: "Cursor" },
    { re: /generated (with|by|using) chatgpt/i, tool: "ChatGPT" },
    { re: /🤖 generated with \[claude/i, tool: "Claude" },
];

// Login substring -> tool mapping for detecting AI bot accounts in contributors/commit authors
const AI_LOGIN_MAP = [
    { substr: "copilot", tool: "GitHub Copilot" },
    { substr: "claude", tool: "Claude" },
    { substr: "cursor", tool: "Cursor" },
    { substr: "devin", tool: "Devin AI" },
    { substr: "coderabbit", tool: "CodeRabbitAI" },
];

// AI config files — presence alone is a strong signal of heavy AI usage
const AI_CONFIG_FILES = [
    { path: "CLAUDE.md", tool: "Claude" },
    { path: ".claude/settings.json", tool: "Claude" },
    { path: ".cursorrules", tool: "Cursor" },
    { path: ".cursor/rules", tool: "Cursor" },
    { path: ".github/copilot-instructions.md", tool: "GitHub Copilot" },
    { path: ".copilot", tool: "GitHub Copilot" },
    { path: ".aider.conf.yml", tool: "Aider" },
    { path: "aider.conf.yml", tool: "Aider" },
    { path: ".continuerc.json", tool: "Continue" },
];

const README_AI_PATTERNS = [
    { re: /github copilot/i, tool: "GitHub Copilot" },
    { re: /claude (code|ai)?/i, tool: "Claude" },
    { re: /\bcursor\b.*(ai|editor|ide)/i, tool: "Cursor" },
    { re: /chatgpt/i, tool: "ChatGPT" },
    { re: /built (with|using) (ai|llm|copilot)/i, tool: "AI" },
    { re: /generated (with|by|using) (an? )?ai/i, tool: "AI" },
    { re: /ai(-|\s)?(assisted|generated|powered)/i, tool: "AI" },
];

async function _getGitHubToken() {
    return new Promise((resolve) => {
        const handler = (event) => {
            if (event.data.type === "GITHUB_DATA_RESULT") {
                window.removeEventListener("message", handler);
                resolve(event.data.token || "");
            }
        };
        window.addEventListener("message", handler);
        window.postMessage({ type: "GET_GITHUB_DATA" }, window.location.origin);
        setTimeout(() => {
            window.removeEventListener("message", handler);
            resolve("");
        }, 5000);
    });
}

async function checkAIContributions(repo) {
    // Accept either: (1) a string "owner/repo", (2) an object with full_name,
    // or (3) an object with html_url — normalize to `fullName`.
    let fullName = null;
    if (typeof repo === "string") {
        fullName = parseRepoFullName(repo) || repo;
    } else if (repo && typeof repo === "object") {
        fullName = repo.full_name || parseRepoFullName(repo.html_url) || null;
    }
    if (!fullName) return null;

    const githubToken = await _getGitHubToken();
    const headers = {
        Accept: "application/vnd.github.v3+json",
        ...(githubToken ? { Authorization: `token ${githubToken}` } : {}),
    };

    const detectedTools = new Set();
    let aiCommits = 0;
    let totalCommits = 0;
    let contributorMatches = 0; // number of contributors that look like AI/bots

    try {
        // 1. Check contributors list for known AI bots
        const contribResp = await fetch(
            `https://api.github.com/repos/${fullName}/contributors?per_page=100`,
            { headers },
        );
        if (contribResp.ok) {
            const contributors = await contribResp.json();
            if (Array.isArray(contributors)) {
                for (const c of contributors) {
                    const login = (c.login || "").toLowerCase();

                    // exact-match bot logins OR substring hints
                    const isKnownBotLogin = AI_BOT_LOGINS.some(
                        (b) => login === b.toLowerCase(),
                    );
                    const mappedTools = AI_LOGIN_MAP.filter((m) =>
                        login.includes(m.substr),
                    ).map((m) => m.tool);
                    if (isKnownBotLogin || mappedTools.length > 0) {
                        contributorMatches++;
                        for (const t of mappedTools) detectedTools.add(t);
                        // if exact match not mapped already, attempt to derive tool from login
                        if (isKnownBotLogin && mappedTools.length === 0) {
                            if (login.includes("copilot"))
                                detectedTools.add("GitHub Copilot");
                            else if (login.includes("devin"))
                                detectedTools.add("Devin AI");
                            else if (login.includes("cursor"))
                                detectedTools.add("Cursor");
                            else if (login.includes("claude"))
                                detectedTools.add("Claude");
                        }
                    }
                }
            }
        }

        // 2. Check recent commits for AI co-authorship patterns (paginated)
        // Fetch up to `maxPages * perPage` commits to improve detection accuracy
        const perPage = 100;
        const maxPages = 5; // scan up to 500 commits
        let page = 1;
        while (page <= maxPages) {
            try {
                const commitsResp = await fetch(
                    `https://api.github.com/repos/${fullName}/commits?per_page=${perPage}&page=${page}`,
                    { headers },
                );

                if (!commitsResp.ok) {
                    // stop paging on error (rate limit, 4xx/5xx)
                    console.debug(
                        `FT: commits fetch failed for ${fullName} (page ${page})`,
                        commitsResp.status,
                    );
                    break;
                }

                const commits = await commitsResp.json();
                if (!Array.isArray(commits) || commits.length === 0) break;

                // accumulate total commits scanned
                totalCommits += commits.length;

                for (const commit of commits) {
                    const message = commit.commit?.message || "";
                    const authorLogin = (
                        commit.author?.login || ""
                    ).toLowerCase();
                    const commitAuthorName = (
                        commit.commit?.author?.name || ""
                    ).toLowerCase();
                    const commitAuthorEmail = (
                        commit.commit?.author?.email || ""
                    ).toLowerCase();
                    let isAI = false;

                    // author login may indicate a bot (linked GitHub account)
                    if (
                        AI_BOT_LOGINS.some(
                            (b) => authorLogin === b.toLowerCase(),
                        )
                    ) {
                        isAI = true;
                        if (authorLogin.includes("copilot"))
                            detectedTools.add("GitHub Copilot");
                        if (authorLogin.includes("devin"))
                            detectedTools.add("Devin AI");
                        if (authorLogin.includes("cursor"))
                            detectedTools.add("Cursor");
                        if (authorLogin.includes("claude"))
                            detectedTools.add("Claude");
                    }

                    // commit author name/email may indicate an AI agent even when commit.author is null
                    for (const m of AI_LOGIN_MAP) {
                        if (
                            commitAuthorName.includes(m.substr) ||
                            commitAuthorEmail.includes(m.substr)
                        ) {
                            isAI = true;
                            detectedTools.add(m.tool);
                        }
                    }

                    // commit message patterns
                    for (const { re, tool } of AI_COMMIT_PATTERNS) {
                        if (re.test(message)) {
                            isAI = true;
                            detectedTools.add(tool);
                        }
                    }

                    if (isAI) aiCommits++;
                }

                // if fewer than perPage returned, we've reached the last page
                if (commits.length < perPage) break;
                page += 1;
            } catch (err) {
                console.warn("FT: error paging commits for", fullName, err);
                break;
            }
        }
    } catch (err) {
        console.warn("FT: checkAIContributions failed for", fullName, err);
        return null;
    }

    // --- Additional signals: README patterns and config files ---
    try {
        // 1) README content (API returns base64 content)
        const readmeResp = await fetch(
            `https://api.github.com/repos/${fullName}/readme`,
            { headers },
        );
        if (readmeResp.ok) {
            const readmeJson = await readmeResp.json();
            const encoded = readmeJson.content || "";
            try {
                const decoded = atob(encoded.replace(/\s+/g, ""));
                for (const { re, tool } of README_AI_PATTERNS) {
                    if (re.test(decoded)) detectedTools.add(tool);
                }
            } catch (_) {
                // ignore decode errors
            }
        }
    } catch (_) {
        // ignore README fetch errors
    }

    try {
        // 2) Specific AI config files (root/.github/etc.) — stop early if we already found tools
        if (detectedTools.size === 0) {
            for (const { path, tool } of AI_CONFIG_FILES) {
                try {
                    const p = encodeURIComponent(path.replace(/^\//, ""));
                    const resp = await fetch(
                        `https://api.github.com/repos/${fullName}/contents/${p}`,
                        { headers },
                    );
                    if (resp.ok) {
                        detectedTools.add(tool);
                        // don't break — collect all detected tools
                    }
                } catch (_) {
                    // ignore per-file errors
                }
            }
        }
    } catch (_) {}

    // If no commits AND no other signals, nothing to report
    if (totalCommits === 0 && detectedTools.size === 0) return null;

    return {
        percentage: totalCommits > 0 ? aiCommits / totalCommits : 0,
        aiCommits,
        totalCommits,
        contributorMatches,
        detectedTools: [...detectedTools],
    };
}

function removeAIDeclarationWarning() {
    document.querySelector("#ai-declaration-warning")?.remove();
}

function showAIDeclarationWarning(result) {
    removeAIDeclarationWarning();
    if (
        !result ||
        (result.detectedTools.length === 0 && result.aiCommits === 0)
    )
        return;

    const declarationField = document.querySelector("#project_ai_declaration");
    if (!declarationField) return;

    const inputContainer =
        declarationField.closest(".input") || declarationField.parentNode;

    // If no explicit commit matches but contributors or other signals matched, show an estimated count
    const displayAiCommits =
        result.aiCommits > 0
            ? result.aiCommits
            : result.contributorMatches > 0
              ? result.contributorMatches
              : 1; // at least 1 when we detected a tool via README/config

    const rawPct =
        result.totalCommits > 0
            ? (displayAiCommits / result.totalCommits) * 100
            : 0;
    // If total commits unknown, show N/A for percentage
    const displayPctText =
        result.totalCommits > 0
            ? rawPct >= 1
                ? `${Math.round(rawPct)}`
                : "<1"
            : "N/A";

    const tools =
        result.detectedTools.length > 0
            ? result.detectedTools.join(", ")
            : "AI tools";

    const detectionSource =
        result.aiCommits > 0
            ? "commit history"
            : result.contributorMatches > 0
              ? "contributors"
              : "README/config";

    const banner = document.createElement("div");
    banner.id = "ai-declaration-warning";
    banner.setAttribute("role", "alert");
    banner.setAttribute("aria-live", "polite");
    banner.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 16px;
        margin-bottom: 16px;
        background: #161b22;
        border: 1px solid #30363d;
        border-left: 4px solid #e3b341;
        border-radius: 6px;
        box-shadow: 0 1px 3px rgba(1,4,9,0.6);
        font-size: 13px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif;
        color: #c9d1d9;
    `;

    const warningBtn = _makeDeclarationBtn(true);
    _triggerDeclarationGeneration(warningBtn, declarationField);
    // style override so the button matches the extension theme (amber for AI warning)
    warningBtn.style.background = "rgba(227,179,65,0.08)";
    warningBtn.style.borderColor = "rgba(227,179,65,0.35)";
    warningBtn.style.color = "#e3b341";
    warningBtn.style.fontWeight = "600";
    warningBtn.style.marginTop = "8px";
    warningBtn.addEventListener("mouseenter", () => {
        warningBtn.style.background = "rgba(227,179,65,0.18)";
        warningBtn.style.borderColor = "rgba(227,179,65,0.6)";
    });
    warningBtn.addEventListener("mouseleave", () => {
        warningBtn.style.background = "rgba(227,179,65,0.08)";
        warningBtn.style.borderColor = "rgba(227,179,65,0.35)";
    });

    const textDiv = document.createElement("div");
    textDiv.style.cssText = "flex:1;min-width:0;";
    textDiv.innerHTML = `
        <div style="display:flex;gap:12px;align-items:center;min-width:0;">
            <div style="width:36px;height:36px;border-radius:6px;background:#21262d;border:1px solid #30363d;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#e3b341" style="display:block;">
                    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
                </svg>
            </div>
            <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <strong style="font-size:13px;color:#e3b341;white-space:nowrap;">AI usage detected</strong>
                    <span style="background:rgba(227,179,65,0.12);color:#e3b341;padding:2px 8px;border-radius:999px;font-weight:700;font-size:12px;border:1px solid rgba(227,179,65,0.16);">${displayPctText}${result.totalCommits > 0 ? "%" : ""}</span>
                </div>
                <div style="margin-top:6px;color:#8b949e;line-height:1.4;overflow:hidden;text-overflow:ellipsis;">
                    ${
                        result.aiCommits > 0
                            ? `${tools} detected in commit history (${result.aiCommits}${result.totalCommits > 0 ? `/${result.totalCommits}` : ""} commits).`
                            : result.contributorMatches > 0
                              ? `${tools} detected among contributors (${result.contributorMatches} match${result.contributorMatches > 1 ? "es" : ""}). Estimated: ${displayAiCommits}${result.totalCommits > 0 ? `/${result.totalCommits}` : ""} commits.`
                              : `${tools} detected in ${detectionSource}. Estimated: ${displayAiCommits}${result.totalCommits > 0 ? `/${result.totalCommits}` : ""} commits.`
                    }
                    Projects that use AI may be <strong style="color:#e3b341;">rejected</strong> without an AI declaration.
                </div>
            </div>
        </div>
    `;
    textDiv.appendChild(warningBtn);

    banner.appendChild(textDiv);
    inputContainer.parentNode.insertBefore(banner, inputContainer);
}

// ─── Auto-Generate Description ──────────────────────────────────────────────

async function autoGenerateDescription(repo) {
    const settings = await AIDescriptionService.getSettings();
    if (!settings || !settings.provider || !settings.autoGenerate) {
        return;
    }

    showGlobalNotification("Generating description with AI...", "info");

    const descField = findDescriptionTextarea();
    let savedAnim = null;
    if (descField) savedAnim = startGeneratingAnimation(descField);

    const result = await AIDescriptionService.generate(repo, settings);

    if (descField && savedAnim) stopGeneratingAnimation(descField, savedAnim);

    if (result.description) {
        if (descField) {
            descField.value = result.description;
            descField.dispatchEvent(new Event("input", { bubbles: true }));
            descField.dispatchEvent(new Event("change", { bubbles: true }));
            showGlobalNotification("Description generated!", "success");
        }
    } else {
        showGlobalNotification(
            `AI error: ${result.error || "Generation failed"}`,
            "error",
        );
    }
}

// ─── Demo Link Resolver ─────────────────────────────────────────────────────

function resolveDemoLink(repo) {
    // 1. Homepage set by the user on the GitHub repo (best signal)
    if (repo.homepage && repo.homepage.trim()) {
        return repo.homepage.trim();
    }

    // 2. GitHub Pages is enabled → build the standard URL
    if (repo.has_pages) {
        const [owner, name] = repo.full_name.split("/");
        if (name === `${owner}.github.io`) {
            return `https://${owner}.github.io`;
        }
        return `https://${owner}.github.io/${name}`;
    }

    // 3. Fallback to the GitHub repo URL
    return repo.html_url;
}

// ─── Robust Form Field Finders ──────────────────────────────────────────────

function _getInputContext(input) {
    const name = input.name || "";
    const id = input.id || "";
    const placeholder = input.placeholder || "";
    let labelText = "";
    if (input.id) {
        const label = document.querySelector(
            `label[for="${CSS.escape(input.id)}"]`,
        );
        if (label) labelText = label.textContent;
    }
    if (!labelText) {
        const parent =
            input.closest(
                "[class*='form'], [class*='field'], [class*='group']",
            ) || input.parentElement;
        if (parent) {
            const label = parent.querySelector("label");
            if (label) labelText = label.textContent;
        }
    }
    return `${name} ${id} ${placeholder} ${labelText}`.toLowerCase();
}

function findFormInput(pattern) {
    const inputs = Array.from(
        document.querySelectorAll(
            "input[type='text'], input[type='url'], input:not([type])",
        ),
    );
    for (const input of inputs) {
        if (pattern.test(_getInputContext(input))) return input;
    }
    return null;
}

function findDemoLinkInput() {
    return findFormInput(
        /demo|live.*link|live.*url|deploy|hosted|website url|project.*url|selfhosted/i,
    );
}

function findRepoInput() {
    return findFormInput(/repo|github\.com|source.*code|repository/i);
}

function findReadmeInput() {
    return findFormInput(/readme|raw\.githubusercontent/i);
}

// Parse a GitHub repo identifier from a URL or input value.
// Returns "owner/repo" or null.
function parseRepoFullName(input) {
    if (!input || typeof input !== "string") return null;
    const v = input
        .trim()
        .replace(/\.git$/i, "")
        .replace(/\/$/, "");
    // Full name like owner/repo
    const simpleMatch = v.match(/^([\w.-]+)\/([\w.-]+)$/);
    if (simpleMatch) return `${simpleMatch[1]}/${simpleMatch[2]}`;
    // HTTPS URL
    const httpsMatch = v.match(
        /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+)(?:\/.*)?$/i,
    );
    if (httpsMatch) return `${httpsMatch[1]}/${httpsMatch[2]}`;
    // SSH URL
    const sshMatch = v.match(/^git@github\.com:([^\/]+)\/([^\/]+)(?:\.git)?$/i);
    if (sshMatch) return `${sshMatch[1]}/${sshMatch[2]}`;
    return null;
}

// Watch the page's repo input (when user pastes or types a GitHub URL)
// and run AI-detection for that repo so the banner appears for manual imports.
function attachRepoInputWatcher() {
    try {
        // Debounced detection helper
        let detectTimer = null;
        const scheduleDetection = (fn, delay = 500) => {
            if (detectTimer) clearTimeout(detectTimer);
            detectTimer = setTimeout(fn, delay);
        };

        const bindTo = (repoInput) => {
            if (!repoInput || repoInput._ftRepoWatcher) return;
            repoInput._ftRepoWatcher = true;

            const runDetection = async () => {
                try {
                    const val = (repoInput.value || "").trim();
                    const full = parseRepoFullName(val);
                    if (!full) return;
                    console.debug("FT: running AI detection for", full);

                    // set lastImportedRepo so other UI (generate button) works
                    if (
                        !lastImportedRepo ||
                        lastImportedRepo.full_name !== full
                    ) {
                        lastImportedRepo = {
                            full_name: full,
                            html_url: `https://github.com/${full}`,
                        };
                    }

                    const result = await checkAIContributions(full);
                    if (!result) {
                        console.debug(
                            "FT: checkAIContributions returned null for",
                            full,
                        );
                        return;
                    }
                    showAIDeclarationWarning(result);
                } catch (err) {
                    console.warn("FT: runDetection error", err);
                }
            };

            repoInput.addEventListener("input", () =>
                scheduleDetection(runDetection, 600),
            );
            repoInput.addEventListener("change", () =>
                scheduleDetection(runDetection, 200),
            );
            repoInput.addEventListener("blur", () =>
                scheduleDetection(runDetection, 100),
            );
            repoInput.addEventListener("paste", () =>
                scheduleDetection(runDetection, 200),
            );
        };

        const repoInput = findRepoInput();
        if (repoInput) {
            bindTo(repoInput);
            return;
        }

        // If input not yet present, observe the DOM and bind when it appears
        if (document.body._ftRepoObserver) return;
        const observer = new MutationObserver(() => {
            const el = findRepoInput();
            if (el) {
                bindTo(el);
                if (document.body._ftRepoObserver) {
                    document.body._ftRepoObserver.disconnect();
                    document.body._ftRepoObserver = null;
                }
            }
        });
        document.body._ftRepoObserver = observer;
        observer.observe(document.body, { childList: true, subtree: true });
    } catch (err) {
        console.warn("FT: attachRepoInputWatcher error", err);
    }
}

// ─── GitHub Import Modal (original + AI integration) ────────────────────────

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
            // OAuth Device Flow state
            oauthFlow: null, // { userCode, verificationUri, expiresIn, polling }
        };
        this._oauthPollInterval = null;
        this._listenersAdded = false;
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
            window.postMessage(
                { type: "GET_GITHUB_DATA" },
                window.location.origin,
            );
            setTimeout(resolve, 1000);
        });
    }

    saveData(username, token) {
        window.postMessage(
            { type: "SAVE_GITHUB_DATA", username, token },
            window.location.origin,
        );
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
                    has_pages: repo.has_pages,
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
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 4px 10px;
                font-size: 12px;
                font-weight: 500;
                font-family: inherit;
                cursor: pointer;
                color: var(--color-fg-muted);
                background: var(--color-bg-subtle);
                border: 1px solid var(--color-border-default);
                border-radius: 6px;
                transition: color 0.15s, border-color 0.15s, background 0.15s;
            }

            .change-link:hover {
                color: var(--color-fg-default);
                border-color: var(--color-fg-muted);
                background: var(--color-btn-hover-bg);
            }

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
        if (this._listenersAdded) return;
        this._listenersAdded = true;
        this.shadowRoot.addEventListener("click", async (e) => {
            const target = e.target;

            if (
                target.closest(".close-btn") ||
                target.closest(".cancel-btn") ||
                target.classList.contains("overlay")
            ) {
                this.cancelOAuthFlow();
                this.remove();
            }

            // OAuth Login Button
            if (target.closest(".oauth-login-btn")) {
                await this.startOAuthFlow();
            }

            // OAuth Cancel Button
            if (target.closest(".oauth-cancel-btn")) {
                this.cancelOAuthFlow();
                this.state.oauthFlow = null;
                this.state.error = null;
                this.render();
                this.addEventListeners();
            }

            // Copy OAuth code on click
            if (target.closest(".oauth-code")) {
                const code = this.state.oauthFlow?.userCode;
                if (code) {
                    navigator.clipboard.writeText(code);
                    showGlobalNotification("Code copied!", "success");
                }
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
                this.cancelOAuthFlow();
                this.remove();
            }
        });
    }

    // OAuth Device Flow Methods
    async startOAuthFlow() {
        if (!GITHUB_OAUTH_CLIENT_ID) {
            this.state.error = "OAuth Client ID not configured";
            this.render();
            return;
        }

        this.state.isLoading = true;
        this.state.error = null;
        this.render();

        const requestId = Date.now().toString();

        return new Promise((resolve) => {
            const handler = (event) => {
                if (
                    event.data.type === "OAUTH_DEVICE_CODE_RESULT" &&
                    event.data.requestId === requestId
                ) {
                    window.removeEventListener("message", handler);
                    this.state.isLoading = false;

                    if (event.data.error) {
                        this.state.error = event.data.error;
                        this.render();
                        this.addEventListeners();
                        resolve();
                        return;
                    }

                    this.state.oauthFlow = {
                        userCode: event.data.userCode,
                        verificationUri: event.data.verificationUri,
                        expiresIn: event.data.expiresIn,
                    };
                    this.render();
                    this.addEventListeners();

                    // Start polling for token
                    this.pollOAuthToken();
                    resolve();
                }
            };
            window.addEventListener("message", handler);
            window.postMessage(
                {
                    type: "OAUTH_START_DEVICE_FLOW",
                    requestId,
                    clientId: GITHUB_OAUTH_CLIENT_ID,
                    scopes: "public_repo read:user",
                },
                window.location.origin,
            );

            setTimeout(() => {
                window.removeEventListener("message", handler);
                if (this.state.isLoading) {
                    this.state.isLoading = false;
                    this.state.error = "Timeout starting OAuth flow";
                    this.render();
                    this.addEventListeners();
                }
                resolve();
            }, 30000);
        });
    }

    pollOAuthToken() {
        if (this._oauthPollInterval) {
            clearInterval(this._oauthPollInterval);
        }

        let pollInterval = 5000; // Start with 5 seconds

        const poll = async () => {
            if (!this.state.oauthFlow) {
                clearInterval(this._oauthPollInterval);
                return;
            }

            const requestId = Date.now().toString();

            const handler = (event) => {
                if (
                    event.data.type === "OAUTH_TOKEN_RESULT" &&
                    event.data.requestId === requestId
                ) {
                    window.removeEventListener("message", handler);

                    if (event.data.error) {
                        this.state.error = event.data.error;
                        this.state.oauthFlow = null;
                        clearInterval(this._oauthPollInterval);
                        this.render();
                        this.addEventListeners();
                        return;
                    }

                    if (event.data.pending) {
                        // Still waiting, update interval if needed
                        if (event.data.interval) {
                            pollInterval = event.data.interval * 1000;
                        }
                        return;
                    }

                    // Success! Got the token
                    if (event.data.accessToken) {
                        clearInterval(this._oauthPollInterval);
                        this.state.oauthFlow = null;
                        this.state.token = event.data.accessToken;
                        this.saveData("", event.data.accessToken);
                        showGlobalNotification(
                            "Connected to GitHub!",
                            "success",
                        );
                        this.fetchRepositories();
                    }
                }
            };
            window.addEventListener("message", handler);
            window.postMessage(
                {
                    type: "OAUTH_POLL_TOKEN",
                    requestId,
                    clientId: GITHUB_OAUTH_CLIENT_ID,
                },
                window.location.origin,
            );

            // Timeout for this poll request
            setTimeout(() => {
                window.removeEventListener("message", handler);
            }, pollInterval);
        };

        // Poll every interval (first poll fires after pollInterval ms)
        this._oauthPollInterval = setInterval(poll, pollInterval);
    }

    cancelOAuthFlow() {
        if (this._oauthPollInterval) {
            clearInterval(this._oauthPollInterval);
            this._oauthPollInterval = null;
        }
        if (this.state.oauthFlow) {
            window.postMessage(
                { type: "OAUTH_CANCEL", requestId: Date.now().toString() },
                window.location.origin,
            );
            this.state.oauthFlow = null;
        }
    }

    fillForm(repo) {
        const titleInput = document.querySelector(
            'input[placeholder="Give your project a name"]',
        );
        if (titleInput) {
            titleInput.value = repo.name;
            titleInput.dispatchEvent(new Event("input", { bubbles: true }));
        }

        const demoLinkInput = findDemoLinkInput();
        if (demoLinkInput) {
            const demoUrl = resolveDemoLink(repo);
            demoLinkInput.value = demoUrl;
            demoLinkInput.dispatchEvent(new Event("input", { bubbles: true }));
        }

        const repoInput = findRepoInput();
        if (repoInput) {
            repoInput.value = repo.html_url;
            repoInput.dispatchEvent(new Event("input", { bubbles: true }));
        }

        const readmeUrl = `https://raw.githubusercontent.com/${repo.full_name}/refs/heads/${repo.default_branch}/README.md`;
        const readmeInput = findReadmeInput();
        if (readmeInput) {
            readmeInput.value = readmeUrl;
            readmeInput.dispatchEvent(new Event("input", { bubbles: true }));
        }

        // Store repo for AI generation
        lastImportedRepo = repo;

        // Inject "Generate with AI" button near description field
        setTimeout(() => injectGenerateButton(repo), 300);

        // Auto-generate description if configured
        autoGenerateDescription(repo);

        // Scan commits/contributors for AI usage and warn if any AI usage is detected
        checkAIContributions(repo)
            .then(showAIDeclarationWarning)
            .catch(() => {});

        showGlobalNotification("Project imported!", "success");

        trackExtensionUsage();
    }

    getGitHubLogo() {
        return `<svg height="20" width="20" viewBox="320 320 440 440" class="icon"><g transform="translate(0,1080) scale(0.1,-0.1)" fill="currentColor" stroke="none"><path d="M5185 7549 c-351 -37 -680 -154 -970 -346 -370 -245 -635 -563 -810 -973 -186 -436 -214 -956 -78 -1435 124 -435 404 -841 770 -1116 216 -163 551 -329 664 -329 31 0 47 7 70 29 l29 29 0 222 0 221 -72 -8 c-115 -13 -286 -8 -355 10 -146 38 -221 103 -300 262 -90 179 -147 250 -259 327 -22 14 -46 38 -54 52 -12 24 -12 29 3 44 29 29 150 23 219 -11 70 -34 153 -115 213 -206 135 -205 312 -263 563 -185 42 14 53 22 58 43 20 102 59 188 106 237 l29 31 -63 7 c-212 24 -415 96 -564 201 -146 104 -252 265 -308 465 -44 156 -59 421 -32 562 26 132 96 285 173 377 l29 34 -18 71 c-12 47 -19 107 -19 177 0 112 8 164 42 267 l21 62 47 0 c108 0 283 -65 466 -174 l80 -48 95 21 c162 36 248 45 445 45 197 0 283 -9 445 -45 l96 -21 64 42 c161 104 359 180 471 180 56 0 57 0 72 -37 8 -21 22 -73 32 -116 22 -97 17 -308 -8 -375 l-16 -42 50 -66 c61 -81 98 -153 135 -264 27 -82 28 -92 28 -285 0 -182 -2 -210 -26 -312 -67 -280 -213 -476 -443 -591 -124 -61 -293 -110 -447 -128 l-58 -7 30 -34 c42 -47 68 -103 91 -190 17 -68 19 -113 19 -435 0 -301 2 -364 15 -388 34 -65 96 -67 245 -5 334 136 624 345 841 603 407 486 582 1092 493 1712 -115 803 -679 1479 -1447 1735 -291 97 -614 134 -902 104z"/><path d="M5208 6210 c-67 -20 -101 -65 -108 -140 l-5 -55 -66 -7 c-108 -10 -177 -57 -218 -148 -19 -40 -21 -65 -21 -248 l0 -202 -54 -24 c-59 -26 -76 -48 -76 -97 0 -42 77 -201 122 -253 l33 -38 50 18 c37 13 78 18 155 18 115 -1 170 -15 253 -65 l47 -29 0 340 0 340 -47 -19 c-27 -10 -95 -38 -153 -61 -58 -23 -111 -44 -117 -47 -10 -4 -13 28 -13 140 0 139 1 147 22 161 19 14 74 16 394 16 349 0 372 -1 388 -19 14 -16 16 -38 14 -159 l-3 -140 -160 64 c-88 35 -161 64 -162 64 -2 0 -3 -152 -3 -339 l0 -338 73 37 c111 59 238 75 347 45 30 -8 64 -17 75 -20 15 -4 29 6 59 47 50 69 108 192 109 235 1 44 -29 83 -80 101 l-41 15 -4 206 c-3 192 -5 209 -26 253 -46 92 -134 148 -236 148 l-46 0 0 38 c0 61 -38 123 -90 150 -41 20 -57 22 -215 21 -93 0 -182 -4 -197 -9z"/><path d="M4912 4864 c-24 -8 -77 -37 -118 -64 -45 -29 -96 -53 -129 -61 -51 -11 -57 -10 -108 15 -70 34 -109 34 -136 0 -12 -15 -21 -35 -21 -45 0 -51 105 -116 205 -126 76 -8 175 25 271 90 74 50 80 52 145 52 63 0 70 -2 136 -48 182 -125 295 -128 473 -12 47 31 95 58 108 62 52 13 112 -4 183 -51 104 -69 160 -89 254 -90 70 -1 87 3 138 29 65 32 87 57 87 95 0 33 -38 70 -73 70 -14 0 -46 -10 -69 -22 -79 -42 -140 -28 -280 62 -78 51 -125 63 -218 58 -80 -5 -119 -20 -220 -87 -125 -83 -169 -81 -303 16 -26 19 -70 44 -97 54 -61 23 -167 24 -228 3z"/></g></svg>`;
    }

    render() {
        const { view, username, repositories, selectedRepo, isLoading, error } =
            this.state;

        // eslint-disable-next-line no-unsanitized/property -- Content is generated internally without user input
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
        // If OAuth Device Flow is active, show the code entry UI
        if (this.state.oauthFlow) {
            return this.renderOAuthDeviceFlow();
        }

        const hasOAuthClientId =
            GITHUB_OAUTH_CLIENT_ID && GITHUB_OAUTH_CLIENT_ID.length > 0;

        return `
            <div class="setup-view">
                ${
                    hasOAuthClientId
                        ? `
                <div style="text-align: center; padding: 24px 16px;">
                    <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: linear-gradient(135deg, #238636 0%, #2ea043 100%); border-radius: 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(35, 134, 54, 0.3);">
                        ${this.getGitHubLogo()}
                    </div>
                    <h3 style="margin: 0 0 8px; font-size: 18px; font-weight: 600; color: var(--color-fg-default);">Connect to GitHub</h3>
                    <p style="color: var(--color-fg-muted); margin: 0 0 20px; font-size: 13px; line-height: 1.5;">
                        Sign in to import your repositories and generate AI descriptions
                    </p>
                    <button class="btn btn-primary oauth-login-btn" style="width: 100%; padding: 12px 20px; font-size: 15px; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 10px; background: linear-gradient(135deg, #238636 0%, #2ea043 100%); border: none; border-radius: 8px; cursor: pointer; transition: transform 0.15s ease, box-shadow 0.15s ease; box-shadow: 0 2px 8px rgba(35, 134, 54, 0.25);" onmouseover="this.style.transform='translateY(-1px)';this.style.boxShadow='0 4px 12px rgba(35, 134, 54, 0.35)';" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 2px 8px rgba(35, 134, 54, 0.25)';">
                        ${this.getGitHubLogo()}
                        Sign in with GitHub
                    </button>
                    <p style="color: var(--color-fg-muted); margin: 16px 0 0; font-size: 12px;">
                        Secure OAuth authentication
                    </p>
                    ${this.state.error ? `<p class="error-text" style="margin-top: 12px;">${this.state.error}</p>` : ""}
                </div>
                `
                        : `
                <div class="form-group">
                    <label for="gh-token-input">GitHub Token (Personal Access Token)</label>
                    <input
                        type="password"
                        id="gh-token-input"
                        placeholder="ghp_xxxxxxxxxxxx"
                        value="${this.state.token}"
                        autocomplete="off"
                        autofocus
                    >
                    <p class="helper-text">
                        <a href="https://github.com/settings/tokens/new?description=Flavortown%20GitHub%20Exporter&scopes=public_repo" target="_blank" style="color: var(--color-accent-fg);">Create a classic token</a>
                    </p>
                </div>
                ${this.state.error ? `<p class="error-text">${this.state.error}</p>` : ""}
                <button class="btn btn-primary save-username-btn" style="width: 100%; margin-top: 12px;">Load Repositories</button>
                `
                }
            </div>
        `;
    }

    renderOAuthDeviceFlow() {
        const { oauthFlow } = this.state;
        return `
            <div class="setup-view oauth-device-flow">
                <div style="text-align: center; padding: 16px 0;">
                    <h3 style="margin: 0 0 8px; font-size: 15px; font-weight: 600; color: var(--color-fg-default);">Connect to GitHub</h3>
                    <p style="color: var(--color-fg-muted); margin: 0 0 20px; font-size: 13px;">
                        Enter this code on GitHub to authorize the extension:
                    </p>
                    <div class="oauth-code" style="
                        font-family: 'SF Mono', ui-monospace, monospace;
                        font-size: 30px;
                        font-weight: 700;
                        letter-spacing: 5px;
                        background: var(--color-bg-subtle);
                        padding: 14px 24px;
                        border-radius: 8px;
                        border: 2px dashed var(--color-border-default);
                        margin-bottom: 10px;
                        user-select: all;
                        cursor: pointer;
                        display: inline-block;
                    " title="Click to copy">${oauthFlow.userCode}</div>
                    <p style="color: var(--color-fg-muted); font-size: 12px; margin: 0 0 18px;">
                        Click the code to copy it
                    </p>
                    <a href="${oauthFlow.verificationUri}" target="_blank" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 16px; text-decoration: none;">
                        ${this.getGitHubLogo()}
                        Open GitHub Device Activation
                    </a>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 8px; color: var(--color-fg-muted); font-size: 12px;">
                        <svg class="spinner" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M8 2a6 6 0 1 0 6 6" stroke-linecap="round"></path>
                        </svg>
                        <span>Waiting for authorization...</span>
                    </div>
                    ${this.state.error ? `<p class="error-text" style="margin-top: 12px;">${this.state.error}</p>` : ""}
                </div>
                <button class="btn btn-secondary oauth-cancel-btn" style="width: 100%; margin-top: 8px;">Cancel</button>
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
                    <div style="display:flex;gap:8px;align-items:center;">
                    <button class="change-link">Change</button>
                </div>
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
                <div style="display:flex;gap:8px;align-items:center;">
                    <button class="change-link">Change</button>
                </div>
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

// ─── Button Injection ───────────────────────────────────────────────────────

function injectImportButton() {
    if (document.querySelector("#gh-import-btn")) return;

    const heading = Array.from(
        document.querySelectorAll('h1, h2, h3, [role="heading"]'),
    ).find((el) => el.textContent.trim() === "Create a new Project");

    if (!heading) return;

    // Import button
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
        font-family: inherit;
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

    // AI Settings button (gear icon)
    const settingsBtn = document.createElement("button");
    settingsBtn.id = "ai-settings-btn";
    settingsBtn.title = "AI Description Settings";
    settingsBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
    `;
    settingsBtn.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 6px;
        margin-left: 6px;
        background-color: #24292f;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        transition: background-color 0.15s;
        vertical-align: middle;
    `;

    settingsBtn.addEventListener("mouseenter", () => {
        settingsBtn.style.backgroundColor = "#32383f";
    });
    settingsBtn.addEventListener("mouseleave", () => {
        settingsBtn.style.backgroundColor = "#24292f";
    });

    settingsBtn.addEventListener("click", () => {
        if (!document.querySelector("ai-settings-modal")) {
            const modal = document.createElement("ai-settings-modal");
            document.body.appendChild(modal);
        }
    });

    // Changelog button
    const changelogBtn = document.createElement("button");
    changelogBtn.id = "changelog-btn";
    changelogBtn.title = "Changelog";
    changelogBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
    `;
    changelogBtn.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 6px;
        margin-left: 6px;
        background-color: #24292f;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        transition: background-color 0.15s;
        vertical-align: middle;
    `;

    changelogBtn.addEventListener("mouseenter", () => {
        changelogBtn.style.backgroundColor = "#32383f";
    });
    changelogBtn.addEventListener("mouseleave", () => {
        changelogBtn.style.backgroundColor = "#24292f";
    });

    changelogBtn.addEventListener("click", () => {
        showChangelogModal();
    });

    // Generate Description button (star icon - same style as settings/changelog)
    const generateBtn = document.createElement("button");
    generateBtn.id = "ai-generate-heading-btn";
    generateBtn.title = "Generate description with AI";
    generateBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
        </svg>
    `;
    generateBtn.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 6px;
        margin-left: 6px;
        background-color: #24292f;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        transition: background-color 0.15s;
        vertical-align: middle;
    `;

    generateBtn.addEventListener("mouseenter", () => {
        generateBtn.style.backgroundColor = "#32383f";
    });
    generateBtn.addEventListener("mouseleave", () => {
        generateBtn.style.backgroundColor = "#24292f";
    });

    generateBtn.addEventListener("click", () => {
        triggerAIGeneration();
    });

    // Report Issue button (bug icon)
    const issueBtn = document.createElement("button");
    issueBtn.id = "report-issue-btn";
    issueBtn.title = "Report an issue";
    issueBtn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
    `;
    issueBtn.style.cssText = `
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 6px;
        margin-left: 6px;
        background-color: #24292f;
        color: white;
        border: none;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        transition: background-color 0.15s;
        vertical-align: middle;
    `;

    issueBtn.addEventListener("mouseenter", () => {
        issueBtn.style.backgroundColor = "#32383f";
    });
    issueBtn.addEventListener("mouseleave", () => {
        issueBtn.style.backgroundColor = "#24292f";
    });

    issueBtn.addEventListener("click", () => {
        showReportIssueModal();
    });

    // Insert buttons inside the heading
    heading.style.display = "inline-flex";
    heading.style.alignItems = "center";
    heading.appendChild(button);
    heading.appendChild(settingsBtn);
    heading.appendChild(generateBtn);
    heading.appendChild(changelogBtn);
    heading.appendChild(issueBtn);
}

async function triggerAIGeneration() {
    if (!lastImportedRepo) {
        showGlobalNotification(
            "Import a project first to generate a description.",
            "error",
        );
        return;
    }

    const settings = await AIDescriptionService.getSettings();
    if (!settings || !settings.provider) {
        const modal = document.createElement("ai-settings-modal");
        document.body.appendChild(modal);
        return;
    }

    const btn = document.querySelector("#ai-generate-heading-btn");
    if (btn) {
        btn.disabled = true;
        btn.style.opacity = "0.7";
        btn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="white" stroke-width="1.5" style="animation:spin 1s linear infinite;">
                <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
                <path d="M8 2a6 6 0 1 0 6 6" stroke-linecap="round"></path>
            </svg>
        `;
    }

    showGlobalNotification("Generating description with AI...", "info");

    const descField = findDescriptionTextarea();
    let savedAnim = null;
    if (descField) savedAnim = startGeneratingAnimation(descField);

    const result = await AIDescriptionService.generate(
        lastImportedRepo,
        settings,
    );

    if (descField && savedAnim) stopGeneratingAnimation(descField, savedAnim);

    if (result.description) {
        if (descField) {
            descField.value = result.description;
            descField.dispatchEvent(new Event("input", { bubbles: true }));
            descField.dispatchEvent(new Event("change", { bubbles: true }));
            showGlobalNotification("Description generated!", "success");
        }
    } else {
        showGlobalNotification(
            `AI error: ${result.error || "Generation failed"}`,
            "error",
        );
    }

    if (btn) {
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
            </svg>
        `;
    }
}

function showChangelogModal() {
    const existing = document.querySelector(".gh-changelog-overlay");
    if (existing) {
        existing.remove();
        return;
    }

    const overlay = document.createElement("div");
    overlay.className = "gh-changelog-overlay";
    overlay.style.cssText = `
        position:fixed;top:0;left:0;width:100%;height:100%;
        background:rgba(1,4,9,0.85);display:flex;align-items:center;justify-content:center;
        z-index:100000;backdrop-filter:blur(3px);
    `;

    const modal = document.createElement("div");
    modal.style.cssText = `
        width:400px;max-height:480px;background:#0d1117;border:1px solid #30363d;
        border-radius:12px;box-shadow:0 16px 48px rgba(1,4,9,0.9);display:flex;
        flex-direction:column;overflow:hidden;
        animation:modalFadeIn 0.2s cubic-bezier(0,0,0.2,1);
        font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif;
        color:#c9d1d9;font-size:13px;
    `;

    let changesHtml = "";
    for (const entry of CHANGELOG) {
        changesHtml += `
            <div style="margin-bottom:16px;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                    <span style="font-weight:600;font-size:14px;color:#c9d1d9;">v${entry.version}</span>
                    ${entry === CHANGELOG[0] ? '<span style="padding:2px 8px;border-radius:12px;font-size:11px;font-weight:500;background:rgba(46,160,67,0.15);color:#2ea043;">Latest</span>' : ""}
                </div>
                <ul style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:4px;">
                    ${entry.changes.map((c) => `<li style="color:#8b949e;font-size:12px;">${c}</li>`).join("")}
                </ul>
            </div>
        `;
    }

    modal.innerHTML = `
        <div style="padding:16px;background:#161b22;border-bottom:1px solid #30363d;display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:10px;font-weight:600;font-size:14px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
                <span>Changelog</span>
            </div>
            <button class="changelog-close-btn" style="background:none;border:none;color:#8b949e;cursor:pointer;padding:4px;border-radius:6px;display:flex;">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.749.749 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path></svg>
            </button>
        </div>
        <div style="padding:20px;flex:1;overflow-y:auto;">
            ${changesHtml}
        </div>
        <div style="padding:12px 16px;background:#161b22;border-top:1px solid #30363d;text-align:center;">
            <span style="font-size:11px;color:#8b949e;">Flavortown GitHub Exporter v${CHANGELOG[0].version}</span>
        </div>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay || e.target.closest(".changelog-close-btn")) {
            overlay.remove();
        }
    });
    document.addEventListener("keydown", function escHandler(e) {
        if (e.key === "Escape") {
            overlay.remove();
            document.removeEventListener("keydown", escHandler);
        }
    });
}

const EXTENSION_REPO = "scorpion7slayer/flavortown-github-exporter";
const ISSUE_BROWSERS = [
    "Chrome",
    "Firefox",
    "Edge",
    "Brave",
    "Safari",
    "Arc",
    "Other",
];
const ISSUE_OS_LIST = ["Windows", "macOS", "Linux", "ChromeOS", "Other"];
const ISSUE_TEMPLATES = [
    {
        label: "Bug Report",
        icon: "🐛",
        ghLabel: "bug",
        desc: "Something isn't working",
        fields: [
            {
                id: "describe",
                label: "Describe the bug",
                placeholder: "A clear description of what the bug is.",
                rows: 3,
            },
            {
                id: "repro",
                label: "To Reproduce",
                placeholder: "1. Go to '...'\n2. Click on '...'\n3. See error",
                rows: 4,
            },
            {
                id: "expected",
                label: "Expected behavior",
                placeholder: "What you expected to happen.",
                rows: 2,
            },
            {
                id: "extra",
                label: "Additional context",
                placeholder: "Any other context, screenshots, etc.",
                rows: 2,
            },
        ],
        buildBody(vals, env) {
            return `**Describe the bug**\n${vals.describe || "N/A"}\n\n**To Reproduce**\n${vals.repro || "N/A"}\n\n**Expected behavior**\n${vals.expected || "N/A"}\n\n**Environment**\n- Extension: v${env.version}\n- Browser: ${env.browser}\n- OS: ${env.os}\n\n**Additional context**\n${vals.extra || "None"}`;
        },
    },
    {
        label: "Feature Request",
        icon: "✨",
        ghLabel: "enhancement",
        desc: "Suggest an improvement",
        fields: [
            {
                id: "problem",
                label: "Related problem?",
                placeholder: "I'm always frustrated when...",
                rows: 3,
            },
            {
                id: "solution",
                label: "Desired solution",
                placeholder: "What you want to happen.",
                rows: 3,
            },
            {
                id: "alternatives",
                label: "Alternatives considered",
                placeholder:
                    "Any other solutions or features you've considered.",
                rows: 2,
            },
            {
                id: "extra",
                label: "Additional context",
                placeholder: "Any other context or screenshots.",
                rows: 2,
            },
        ],
        buildBody(vals, env) {
            return `**Is your feature request related to a problem?**\n${vals.problem || "N/A"}\n\n**Describe the solution you'd like**\n${vals.solution || "N/A"}\n\n**Describe alternatives you've considered**\n${vals.alternatives || "N/A"}\n\n**Additional context**\n${vals.extra || "None"}\n\n---\nExtension v${env.version} · ${env.browser} · ${env.os}`;
        },
    },
    {
        label: "Question",
        icon: "❓",
        ghLabel: "question",
        desc: "Ask a question",
        fields: [
            {
                id: "question",
                label: "Your question",
                placeholder: "Describe your question in detail.",
                rows: 5,
            },
            {
                id: "extra",
                label: "Additional context",
                placeholder: "Any other context or screenshots.",
                rows: 2,
            },
        ],
        buildBody(vals, env) {
            return `**Your Question**\n${vals.question || "N/A"}\n\n**Additional context**\n${vals.extra || "None"}\n\n---\nExtension v${env.version} · ${env.browser} · ${env.os}`;
        },
    },
    {
        label: "Blank",
        icon: "📝",
        ghLabel: "",
        desc: "Free-form issue",
        fields: [
            {
                id: "body",
                label: "Description",
                placeholder: "Describe your issue freely...",
                rows: 8,
            },
        ],
        buildBody(vals, env) {
            return `${vals.body || ""}\n\n---\nExtension v${env.version} · ${env.browser} · ${env.os}`;
        },
    },
];

const _issueSelectStyle = `background:#161b22;border:1px solid #30363d;border-radius:6px;padding:6px 10px;color:#c9d1d9;font-family:inherit;font-size:12px;outline:none;appearance:auto;cursor:pointer;`;

function _detectBrowser() {
    const ua = navigator.userAgent;
    if (ua.includes("Arc")) return "Arc";
    if (ua.includes("Brave")) return "Brave";
    if (ua.includes("Edg/")) return "Edge";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
    return "Chrome";
}

function _detectOS() {
    const p = navigator.platform || "";
    if (p.startsWith("Win")) return "Windows";
    if (p.startsWith("Mac")) return "macOS";
    if (p.includes("Linux")) return "Linux";
    if (p.includes("CrOS")) return "ChromeOS";
    return "Other";
}

function _issueMessageBridge(issue) {
    return new Promise((resolve) => {
        const requestId = "issue-" + Date.now();
        function handler(event) {
            if (event.source !== window) return;
            if (
                event.data.type === "GITHUB_ISSUE_RESULT" &&
                event.data.requestId === requestId
            ) {
                window.removeEventListener("message", handler);
                resolve(event.data);
            }
        }
        window.addEventListener("message", handler);
        window.postMessage(
            { type: "CREATE_GITHUB_ISSUE", requestId, issue },
            window.location.origin,
        );
    });
}

function showReportIssueModal() {
    const existing = document.querySelector(".gh-issue-overlay");
    if (existing) {
        existing.remove();
        return;
    }

    const overlay = document.createElement("div");
    overlay.className = "gh-issue-overlay";
    overlay.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center;`;

    const modal = document.createElement("div");
    modal.style.cssText = `
        background:#0d1117;border:1px solid #30363d;border-radius:12px;
        width:540px;max-height:85vh;display:flex;flex-direction:column;
        box-shadow:0 8px 32px rgba(0,0,0,0.4);overflow:hidden;
        font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans",Helvetica,Arial,sans-serif;
        color:#c9d1d9;font-size:13px;
    `;

    const version = CHANGELOG[0]?.version || "unknown";
    const _iStyle = `background:#161b22;border:1px solid #30363d;border-radius:6px;padding:5px 8px;color:#c9d1d9;font-family:inherit;font-size:11px;outline:none;width:100%;box-sizing:border-box;margin-top:4px;`;

    // Persistent state across re-renders
    const S = {
        type: 0,
        title: "",
        fields: {}, // { fieldId: value }
        browser: _detectBrowser(),
        os: _detectOS(),
        browserCustom: "",
        osCustom: "",
        repoLabels: [], // fetched from GitHub
        selectedLabels: [],
    };

    // Fetch repo labels for Blank template
    fetch(`https://api.github.com/repos/${EXTENSION_REPO}/labels?per_page=50`)
        .then((r) => (r.ok ? r.json() : []))
        .then((labels) => {
            S.repoLabels = labels.map((l) => ({
                name: l.name,
                color: l.color,
                description: l.description || "",
            }));
            renderLabelsSection();
        })
        .catch(() => {});

    function saveState() {
        const t = modal.querySelector("#issue-title-input");
        if (t) S.title = t.value;
        modal.querySelectorAll("[data-field]").forEach((el) => {
            S.fields[el.dataset.field] = el.value;
        });
    }

    function restoreState() {
        const t = modal.querySelector("#issue-title-input");
        if (t) t.value = S.title;
        modal.querySelectorAll("[data-field]").forEach((el) => {
            if (S.fields[el.dataset.field] != null)
                el.value = S.fields[el.dataset.field];
        });
    }

    function renderFields() {
        const t = ISSUE_TEMPLATES[S.type];
        return t.fields
            .map(
                (f) => `
            <div style="display:flex;flex-direction:column;gap:4px;">
                <label style="font-size:12px;font-weight:600;color:#8b949e;">${f.label}</label>
                <textarea data-field="${f.id}" rows="${f.rows}" placeholder="${f.placeholder}" style="
                    background:#161b22;border:1px solid #30363d;border-radius:6px;padding:8px 12px;
                    color:#c9d1d9;font-family:inherit;font-size:13px;outline:none;resize:vertical;
                    width:100%;box-sizing:border-box;
                "></textarea>
            </div>
        `,
            )
            .join("");
    }

    function renderLabelsSection() {
        const container = modal.querySelector("#issue-labels-section");
        if (!container) return;
        if (ISSUE_TEMPLATES[S.type].ghLabel || S.repoLabels.length === 0) {
            container.innerHTML = "";
            return;
        }
        container.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:6px;">
                <label style="font-size:12px;font-weight:600;color:#8b949e;">Labels</label>
                <div style="display:flex;flex-wrap:wrap;gap:6px;">
                    ${S.repoLabels
                        .map((l) => {
                            const sel = S.selectedLabels.includes(l.name);
                            const safeColor = /^[0-9a-fA-F]{6}$/.test(l.color)
                                ? l.color
                                : "8b949e";
                            return `<button data-label="${escapeHtml(l.name)}" class="issue-label-chip" title="${escapeHtml(l.description || "")}" style="
                            padding:3px 10px;border-radius:12px;font-size:11px;font-family:inherit;cursor:pointer;
                            border:1px solid #${safeColor};transition:all 0.15s;
                            background:${sel ? "#" + safeColor + "30" : "transparent"};
                            color:${sel ? "#fff" : "#" + safeColor};
                            font-weight:${sel ? "600" : "400"};
                        ">${escapeHtml(l.name)}</button>`;
                        })
                        .join("")}
                </div>
            </div>
        `;
        container.querySelectorAll(".issue-label-chip").forEach((chip) => {
            chip.addEventListener("click", () => {
                const name = chip.dataset.label;
                if (S.selectedLabels.includes(name)) {
                    S.selectedLabels = S.selectedLabels.filter(
                        (n) => n !== name,
                    );
                } else {
                    S.selectedLabels.push(name);
                }
                renderLabelsSection();
            });
        });
    }

    function renderModal() {
        saveState();
        modal.innerHTML = `
            <div style="padding:16px;background:#161b22;border-bottom:1px solid #30363d;display:flex;align-items:center;justify-content:space-between;">
                <div style="display:flex;align-items:center;gap:10px;font-weight:600;font-size:14px;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span>Report an Issue</span>
                </div>
                <button class="issue-close-btn" style="background:none;border:none;color:#8b949e;cursor:pointer;padding:4px;border-radius:6px;display:flex;">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.749.749 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.749.749 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z"></path></svg>
                </button>
            </div>
            <div style="padding:20px;flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:14px;">
                <div style="display:flex;flex-direction:column;gap:6px;">
                    <label style="font-size:12px;font-weight:600;color:#8b949e;">Issue type</label>
                    <div id="issue-type-select" style="display:flex;gap:8px;flex-wrap:wrap;">
                        ${ISSUE_TEMPLATES.map(
                            (t, i) => `
                            <button data-idx="${i}" class="issue-type-btn" style="
                                flex:1;min-width:100px;padding:10px 8px;background:${i === S.type ? "#1f2937" : "#0d1117"};
                                border:1px solid ${i === S.type ? "#58a6ff" : "#30363d"};border-radius:8px;
                                color:${i === S.type ? "#58a6ff" : "#8b949e"};cursor:pointer;text-align:center;
                                font-family:inherit;font-size:12px;transition:all 0.15s;
                            ">
                                <div style="font-size:16px;margin-bottom:2px;">${t.icon}</div>
                                <div style="font-weight:600;">${t.label}</div>
                                <div style="font-size:10px;opacity:0.7;margin-top:2px;">${t.desc}</div>
                            </button>
                        `,
                        ).join("")}
                    </div>
                </div>
                <div style="display:flex;flex-direction:column;gap:6px;">
                    <label style="font-size:12px;font-weight:600;color:#8b949e;">Title</label>
                    <input id="issue-title-input" type="text" placeholder="Brief summary" style="
                        background:#161b22;border:1px solid #30363d;border-radius:6px;padding:8px 12px;
                        color:#c9d1d9;font-family:inherit;font-size:13px;outline:none;width:100%;box-sizing:border-box;
                    ">
                </div>
                <div id="issue-fields-container" style="display:flex;flex-direction:column;gap:12px;">
                    ${renderFields()}
                </div>
                <div id="issue-labels-section"></div>
                <div style="display:flex;gap:10px;align-items:end;">
                    <div style="flex:1;display:flex;flex-direction:column;gap:4px;">
                        <label style="font-size:11px;font-weight:600;color:#8b949e;">Browser</label>
                        <select id="issue-browser" style="${_issueSelectStyle}">
                            ${ISSUE_BROWSERS.map((b) => `<option value="${b}" ${b === S.browser ? "selected" : ""}>${b}</option>`).join("")}
                        </select>
                        ${S.browser === "Other" ? `<input id="issue-browser-custom" type="text" placeholder="Your browser name" value="${escapeHtml(S.browserCustom)}" style="${_iStyle}">` : ""}
                    </div>
                    <div style="flex:1;display:flex;flex-direction:column;gap:4px;">
                        <label style="font-size:11px;font-weight:600;color:#8b949e;">OS</label>
                        <select id="issue-os" style="${_issueSelectStyle}">
                            ${ISSUE_OS_LIST.map((o) => `<option value="${o}" ${o === S.os ? "selected" : ""}>${o}</option>`).join("")}
                        </select>
                        ${S.os === "Other" ? `<input id="issue-os-custom" type="text" placeholder="Your OS name" value="${escapeHtml(S.osCustom)}" style="${_iStyle}">` : ""}
                    </div>
                    <div style="display:flex;align-items:center;padding:6px 10px;background:#161b22;border:1px solid #30363d;border-radius:6px;font-size:11px;color:#8b949e;white-space:nowrap;">v${version}</div>
                </div>
            </div>
            <div style="padding:12px 16px;background:#161b22;border-top:1px solid #30363d;display:flex;justify-content:flex-end;gap:8px;">
                <button class="issue-close-btn" style="padding:6px 16px;background:transparent;border:1px solid #30363d;border-radius:6px;color:#c9d1d9;font-family:inherit;font-size:12px;cursor:pointer;">Cancel</button>
                <button id="issue-submit-btn" style="padding:6px 16px;background:#238636;border:none;border-radius:6px;color:white;font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;transition:background 0.15s;">Submit Issue</button>
            </div>
        `;

        restoreState();
        renderLabelsSection();

        // ── Type selection ──
        modal
            .querySelector("#issue-type-select")
            .addEventListener("click", (e) => {
                const btn = e.target.closest(".issue-type-btn");
                if (!btn) return;
                saveState();
                S.type = parseInt(btn.dataset.idx);
                renderModal();
            });

        // ── Browser / OS select → only re-render env row, not whole modal ──
        const browserSel = modal.querySelector("#issue-browser");
        const osSel = modal.querySelector("#issue-os");
        if (browserSel)
            browserSel.addEventListener("change", (e) => {
                S.browser = e.target.value;
                if (S.browser !== "Other") S.browserCustom = "";
                renderModal();
            });
        if (osSel)
            osSel.addEventListener("change", (e) => {
                S.os = e.target.value;
                if (S.os !== "Other") S.osCustom = "";
                renderModal();
            });
        const bcInput = modal.querySelector("#issue-browser-custom");
        if (bcInput) {
            bcInput.addEventListener("input", (e) => {
                S.browserCustom = e.target.value;
            });
            bcInput.focus();
        }
        const ocInput = modal.querySelector("#issue-os-custom");
        if (ocInput)
            ocInput.addEventListener("input", (e) => {
                S.osCustom = e.target.value;
            });

        // ── Submit ──
        modal
            .querySelector("#issue-submit-btn")
            .addEventListener("click", async () => {
                saveState();
                const title = S.title.trim();
                if (!title) {
                    const ti = modal.querySelector("#issue-title-input");
                    ti.style.borderColor = "#f85149";
                    ti.focus();
                    return;
                }

                const template = ISSUE_TEMPLATES[S.type];
                const env = {
                    version,
                    browser:
                        S.browser === "Other"
                            ? S.browserCustom.trim() || "Other"
                            : S.browser,
                    os: S.os === "Other" ? S.osCustom.trim() || "Other" : S.os,
                };
                const vals = {};
                modal.querySelectorAll("[data-field]").forEach((el) => {
                    vals[el.dataset.field] = el.value.trim();
                });

                const labels = template.ghLabel
                    ? [template.ghLabel]
                    : [...S.selectedLabels];

                // Générer le body de l'issue
                const body = template.buildBody(vals, env);

                const submitBtn = modal.querySelector("#issue-submit-btn");
                submitBtn.disabled = true;
                submitBtn.style.opacity = "0.7";
                submitBtn.textContent = "Submitting...";

                const result = await _issueMessageBridge({
                    repo: EXTENSION_REPO,
                    title,
                    body,
                    labels,
                });

                if (result.success) {
                    overlay.remove();
                    showGlobalNotification(
                        `Issue #${result.number} created!`,
                        "success",
                    );
                    window.open(result.url, "_blank");
                } else {
                    submitBtn.disabled = false;
                    submitBtn.textContent = "Submit Issue";
                    submitBtn.style.opacity = "1";
                    showGlobalNotification(
                        `Failed: ${result.error || "Unknown error"}. Make sure your GitHub token has public_repo scope.`,
                        "error",
                    );
                }
            });

        // ── Close ──
        modal.querySelectorAll(".issue-close-btn").forEach((btn) => {
            btn.addEventListener("click", () => overlay.remove());
        });
    }

    renderModal();
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.remove();
    });
    document.addEventListener("keydown", function escHandler(e) {
        if (e.key === "Escape") {
            overlay.remove();
            document.removeEventListener("keydown", escHandler);
        }
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectImportButton);
} else {
    injectImportButton();
}

setTimeout(injectImportButton, 500);
setTimeout(injectImportButton, 1500);

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectAIDeclarationButton);
    document.addEventListener("DOMContentLoaded", attachRepoInputWatcher);
} else {
    injectAIDeclarationButton();
    attachRepoInputWatcher();
}

setTimeout(injectAIDeclarationButton, 500);
setTimeout(injectAIDeclarationButton, 1500);
setTimeout(attachRepoInputWatcher, 500);
setTimeout(attachRepoInputWatcher, 1500);

trackExtensionUsage();
