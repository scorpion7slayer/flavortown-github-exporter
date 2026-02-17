/**
 * Flavortown GitHub Exporter - Content Script
 * Injects an "Import from GitHub" button and modal into the Flavortown new project page
 * Bridges storage and AI API calls between isolated world and main world
 */

// Inject the main script into the page context (main world)
// This is necessary because custom elements must be defined in the main world
const script = document.createElement("script");
script.src = chrome.runtime.getURL("content/injected.js");
script.onload = function () {
    this.remove();
};
(document.head || document.documentElement).appendChild(script);

// Handle storage and AI communication between isolated world and main world
window.addEventListener("message", async (event) => {
    if (event.source !== window) return;

    const storage =
        typeof browser !== "undefined" ? browser.storage : chrome.storage;
    const runtime =
        typeof browser !== "undefined" ? browser.runtime : chrome.runtime;

    // --- GitHub Data Storage ---

    if (event.data.type === "GET_GITHUB_DATA") {
        try {
            const result = await storage.local.get([
                "githubUsername",
                "githubToken",
            ]);
            window.postMessage(
                {
                    type: "GITHUB_DATA_RESULT",
                    username: result.githubUsername || "",
                    token: result.githubToken || "",
                },
                window.location.origin,
            );
        } catch (e) {
            window.postMessage(
                { type: "GITHUB_DATA_RESULT", username: "", token: "" },
                window.location.origin,
            );
        }
    }

    if (event.data.type === "SAVE_GITHUB_DATA") {
        try {
            await storage.local.set({
                githubUsername: event.data.username,
                githubToken: event.data.token,
            });
        } catch (e) {}
    }

    // --- AI Settings Storage ---

    if (event.data.type === "GET_AI_SETTINGS") {
        try {
            const result = await storage.local.get(["aiSettings"]);
            window.postMessage(
                {
                    type: "AI_SETTINGS_RESULT",
                    requestId: event.data.requestId,
                    settings: result.aiSettings || null,
                },
                window.location.origin,
            );
        } catch (e) {
            window.postMessage(
                {
                    type: "AI_SETTINGS_RESULT",
                    requestId: event.data.requestId,
                    settings: null,
                },
                window.location.origin,
            );
        }
    }

    if (event.data.type === "SAVE_AI_SETTINGS") {
        try {
            await storage.local.set({ aiSettings: event.data.settings });
            window.postMessage(
                {
                    type: "AI_SETTINGS_SAVED",
                    requestId: event.data.requestId,
                    success: true,
                },
                window.location.origin,
            );
        } catch (e) {
            window.postMessage(
                {
                    type: "AI_SETTINGS_SAVED",
                    requestId: event.data.requestId,
                    success: false,
                },
                window.location.origin,
            );
        }
    }

    // --- AI Description Generation (routed through background service worker) ---

    if (event.data.type === "AI_GENERATE_DESCRIPTION") {
        try {
            const stored = await storage.local.get(["githubToken"]);
            const response = await runtime.sendMessage({
                type: "AI_GENERATE_DESCRIPTION",
                repo: event.data.repo,
                settings: event.data.settings,
                githubToken: stored.githubToken || "",
            });
            window.postMessage(
                {
                    type: "AI_DESCRIPTION_RESULT",
                    requestId: event.data.requestId,
                    description: response.description,
                    error: response.error,
                },
                window.location.origin,
            );
        } catch (e) {
            window.postMessage(
                {
                    type: "AI_DESCRIPTION_RESULT",
                    requestId: event.data.requestId,
                    description: null,
                    error: e.message,
                },
                window.location.origin,
            );
        }
    }

    // --- AI Fetch Models (routed through background service worker) ---

    if (event.data.type === "AI_FETCH_MODELS") {
        try {
            const stored = await storage.local.get(["githubToken"]);
            const response = await runtime.sendMessage({
                type: "AI_FETCH_MODELS",
                settings: event.data.settings,
                githubToken: stored.githubToken || "",
            });
            window.postMessage(
                {
                    type: "AI_MODELS_RESULT",
                    requestId: event.data.requestId,
                    models: response.models,
                    error: response.error,
                },
                window.location.origin,
            );
        } catch (e) {
            window.postMessage(
                {
                    type: "AI_MODELS_RESULT",
                    requestId: event.data.requestId,
                    models: [],
                    error: e.message,
                },
                window.location.origin,
            );
        }
    }

    // --- AI Test Connection (routed through background service worker) ---

    if (event.data.type === "AI_TEST_CONNECTION") {
        try {
            const stored = await storage.local.get(["githubToken"]);
            const response = await runtime.sendMessage({
                type: "AI_TEST_CONNECTION",
                settings: event.data.settings,
                githubToken: stored.githubToken || "",
            });
            window.postMessage(
                {
                    type: "AI_TEST_RESULT",
                    requestId: event.data.requestId,
                    success: response.success,
                    error: response.error,
                    message: response.message,
                },
                window.location.origin,
            );
        } catch (e) {
            window.postMessage(
                {
                    type: "AI_TEST_RESULT",
                    requestId: event.data.requestId,
                    success: false,
                    error: e.message,
                },
                window.location.origin,
            );
        }
    }

    // --- Create GitHub Issue (routed through background service worker) ---

    if (event.data.type === "CREATE_GITHUB_ISSUE") {
        try {
            const stored = await storage.local.get(["githubToken"]);
            const response = await runtime.sendMessage({
                type: "CREATE_GITHUB_ISSUE",
                githubToken: stored.githubToken || "",
                issue: event.data.issue,
            });
            window.postMessage(
                {
                    type: "GITHUB_ISSUE_RESULT",
                    requestId: event.data.requestId,
                    success: response.success,
                    url: response.url,
                    number: response.number,
                    error: response.error,
                },
                window.location.origin,
            );
        } catch (e) {
            window.postMessage(
                {
                    type: "GITHUB_ISSUE_RESULT",
                    requestId: event.data.requestId,
                    success: false,
                    error: e.message,
                },
                window.location.origin,
            );
        }
    }

    // --- OAuth Device Flow (routed through background service worker) ---

    if (event.data.type === "OAUTH_START_DEVICE_FLOW") {
        try {
            const response = await runtime.sendMessage({
                type: "OAUTH_START_DEVICE_FLOW",
                clientId: event.data.clientId,
                scopes: event.data.scopes,
            });
            window.postMessage(
                {
                    type: "OAUTH_DEVICE_CODE_RESULT",
                    requestId: event.data.requestId,
                    userCode: response.userCode,
                    verificationUri: response.verificationUri,
                    expiresIn: response.expiresIn,
                    error: response.error,
                },
                window.location.origin,
            );
        } catch (e) {
            window.postMessage(
                {
                    type: "OAUTH_DEVICE_CODE_RESULT",
                    requestId: event.data.requestId,
                    error: e.message,
                },
                window.location.origin,
            );
        }
    }

    if (event.data.type === "OAUTH_POLL_TOKEN") {
        try {
            const response = await runtime.sendMessage({
                type: "OAUTH_POLL_TOKEN",
                clientId: event.data.clientId,
            });
            window.postMessage(
                {
                    type: "OAUTH_TOKEN_RESULT",
                    requestId: event.data.requestId,
                    accessToken: response.accessToken,
                    tokenType: response.tokenType,
                    scope: response.scope,
                    pending: response.pending,
                    interval: response.interval,
                    error: response.error,
                },
                window.location.origin,
            );
        } catch (e) {
            window.postMessage(
                {
                    type: "OAUTH_TOKEN_RESULT",
                    requestId: event.data.requestId,
                    error: e.message,
                },
                window.location.origin,
            );
        }
    }

    if (event.data.type === "OAUTH_CANCEL") {
        try {
            await runtime.sendMessage({ type: "OAUTH_CANCEL" });
            window.postMessage(
                {
                    type: "OAUTH_CANCELLED",
                    requestId: event.data.requestId,
                },
                window.location.origin,
            );
        } catch (e) {}
    }
});
