/**
 * Flavortown GitHub Exporter - Content Script
 * Injects an "Import from GitHub" button and modal into the Flavortown new project page
 */

// Inject the main script into the page context (main world)
// This is necessary because custom elements must be defined in the main world
const script = document.createElement("script");
script.src = chrome.runtime.getURL("content/injected.js");
script.onload = function () {
    this.remove();
};
(document.head || document.documentElement).appendChild(script);

// Handle storage communication between isolated world and main world
window.addEventListener("message", async (event) => {
    if (event.source !== window) return;

    if (event.data.type === "GET_GITHUB_DATA") {
        try {
            const storage =
                typeof browser !== "undefined"
                    ? browser.storage
                    : chrome.storage;
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
                "*",
            );
        } catch (e) {
            window.postMessage(
                { type: "GITHUB_DATA_RESULT", username: "", token: "" },
                "*",
            );
        }
    }

    if (event.data.type === "SAVE_GITHUB_DATA") {
        try {
            const storage =
                typeof browser !== "undefined"
                    ? browser.storage
                    : chrome.storage;
            await storage.local.set({
                githubUsername: event.data.username,
                githubToken: event.data.token,
            });
        } catch (e) {}
    }
});
