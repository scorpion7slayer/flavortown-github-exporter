/**
 * Flavortown GitHub Exporter - Background Service Worker
 * Handles AI API calls and dynamic model fetching
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "AI_GENERATE_DESCRIPTION") {
        handleAIGeneration(message)
            .then(sendResponse)
            .catch((e) => sendResponse({ description: null, error: e.message }));
        return true;
    }

    if (message.type === "AI_TEST_CONNECTION") {
        testConnection(message.settings, message.githubToken)
            .then(sendResponse)
            .catch((e) => sendResponse({ success: false, error: e.message }));
        return true;
    }

    if (message.type === "AI_FETCH_MODELS") {
        fetchModels(message.settings, message.githubToken)
            .then(sendResponse)
            .catch((e) => sendResponse({ models: [], error: e.message }));
        return true;
    }

    if (message.type === "CREATE_GITHUB_ISSUE") {
        createGitHubIssue(message.githubToken, message.issue)
            .then(sendResponse)
            .catch((e) => sendResponse({ success: false, error: e.message }));
        return true;
    }
});

// ─── Description Generation ─────────────────────────────────────────────────

async function handleAIGeneration({ repo, settings, githubToken }) {
    let readmeContent = "";
    try {
        const readmeUrl = `https://raw.githubusercontent.com/${repo.full_name}/refs/heads/${repo.default_branch}/README.md`;
        const readmeResp = await fetch(readmeUrl);
        if (readmeResp.ok) {
            readmeContent = await readmeResp.text();
            readmeContent = readmeContent.substring(0, 3000);
        }
    } catch (_) {}

    const prompt = buildPrompt(repo, readmeContent, settings.promptPreset, settings.customPrompt);
    const description = await callProvider(settings, prompt, githubToken);
    return { description, error: null };
}

function buildPrompt(repo, readmeContent, preset, customPrompt) {
    const context = `${repo.full_name} | ${repo.language || "Unknown language"} | ${repo.stars || 0} stars
${repo.description || "No description"}
${readmeContent ? `\nREADME excerpt:\n${readmeContent}` : ""}`;

    const rules = {
        detailed: `Write a thorough description of this GitHub project for a developer portfolio.\n\n${context}\n\nRules: 4-6 sentences, ~400-600 chars. Cover what the project does, the problem it solves, key technologies used, and notable features. Stay strictly factual based on the info above — do not invent features. English only. No project name, no markdown. Only output the description.`,

        normal: `Describe this GitHub project for a developer portfolio.\n\n${context}\n\nRules: 2-4 sentences, ~250-450 chars. Explain what THIS project does, the problem it solves, and mention its key technologies. Keep it factual based on the info above. English only. No project name, no markdown. Only output the description.`,

        minimal: `Briefly describe this GitHub project.\n\n${context}\n\nRules: 1-2 sentences, max 150 chars. What does it do in the simplest terms. English only. No project name, no markdown. Only output the description.`,

        custom: `${customPrompt || "Describe this project."}\n\n${context}\n\nEnglish only. No markdown. Only output the description.`,
    };

    return rules[preset] || rules.normal;
}

async function callProvider(settings, prompt, githubToken) {
    const { provider, apiKey, model, ollamaUrl } = settings;

    switch (provider) {
        case "copilot": {
            const resp = await fetch(
                "https://models.github.ai/inference/chat/completions",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${githubToken}`,
                    },
                    body: JSON.stringify({
                        model: model || "openai/gpt-4.1",
                        messages: [{ role: "user", content: prompt }],
                        max_tokens: 500,
                        temperature: 0.7,
                    }),
                },
            );
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(
                    err.error?.message ||
                        `GitHub Copilot: ${resp.status}. Token needs 'models:read' scope.`,
                );
            }
            const data = await resp.json();
            return data.choices[0].message.content.trim();
        }

        case "ollama": {
            // Native Ollama /api/chat endpoint (see docs.ollama.com/api/chat)
            const baseUrl = (ollamaUrl || "http://localhost:11434").replace(/\/+$/, "");
            let resp;
            try {
                resp = await fetch(`${baseUrl}/api/chat`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        model: model || "llama3",
                        messages: [{ role: "user", content: prompt }],
                        stream: false,
                    }),
                });
            } catch (e) {
                throw new Error(
                    `Cannot reach Ollama at ${baseUrl}. Make sure Ollama is running.`,
                );
            }
            if (resp.status === 403 || resp.status === 405) {
                throw new Error(
                    `Ollama CORS error (${resp.status}). Run: OLLAMA_ORIGINS=chrome-extension://* ollama serve`,
                );
            }
            if (!resp.ok) {
                throw new Error(
                    `Ollama: ${resp.status}. Is Ollama running on ${baseUrl}?`,
                );
            }
            const data = await resp.json();
            return (data.message?.content || "").trim();
        }

        case "chatgpt": {
            const resp = await fetch(
                "https://api.openai.com/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model: model || "gpt-5.2",
                        messages: [{ role: "user", content: prompt }],
                        max_tokens: 500,
                        temperature: 0.7,
                    }),
                },
            );
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(
                    err.error?.message || `OpenAI error: ${resp.status}`,
                );
            }
            const data = await resp.json();
            return data.choices[0].message.content.trim();
        }

        case "claude": {
            const resp = await fetch(
                "https://api.anthropic.com/v1/messages",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": apiKey,
                        "anthropic-version": "2023-06-01",
                    },
                    body: JSON.stringify({
                        model: model || "claude-sonnet-4-5-latest",
                        max_tokens: 500,
                        messages: [{ role: "user", content: prompt }],
                    }),
                },
            );
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(
                    err.error?.message || `Anthropic error: ${resp.status}`,
                );
            }
            const data = await resp.json();
            return data.content[0].text.trim();
        }

        case "openrouter": {
            const resp = await fetch(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${apiKey}`,
                        "HTTP-Referer": "https://flavortown.hackclub.com",
                        "X-Title": "Flavortown GitHub Exporter",
                    },
                    body: JSON.stringify({
                        model:
                            model ||
                            "meta-llama/llama-3-8b-instruct:free",
                        messages: [{ role: "user", content: prompt }],
                        max_tokens: 500,
                        temperature: 0.7,
                    }),
                },
            );
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(
                    err.error?.message || `OpenRouter error: ${resp.status}`,
                );
            }
            const data = await resp.json();
            return data.choices[0].message.content.trim();
        }

        default:
            throw new Error(`Unknown AI provider: ${provider}`);
    }
}

// ─── Dynamic Model Fetching ─────────────────────────────────────────────────

async function fetchModels(settings, githubToken) {
    const { provider, apiKey, ollamaUrl } = settings;

    switch (provider) {
        case "copilot": {
            // Known free models (0 premium request multiplier for Pro/Pro+)
            const FREE_COPILOT_MODELS = new Set([
                "openai/gpt-4.1",
                "openai/gpt-4.1-mini",
                "openai/gpt-4.1-nano",
                "openai/gpt-5-mini",
            ]);
            const FALLBACK_MODELS = [
                { id: "openai/gpt-4.1", name: "GPT-4.1 (Free)", free: true },
                { id: "openai/gpt-5-mini", name: "GPT-5 Mini (Free)", free: true },
                { id: "openai/gpt-5.2", name: "GPT-5.2", free: false },
                { id: "openai/gpt-5.2-codex", name: "GPT-5.2 Codex", free: false },
                { id: "openai/gpt-5.1", name: "GPT-5.1", free: false },
                { id: "anthropic/claude-sonnet-4.5", name: "Claude Sonnet 4.5", free: false },
                { id: "anthropic/claude-haiku-4.5", name: "Claude Haiku 4.5", free: false },
                { id: "google/gemini-2.5-pro", name: "Gemini 2.5 Pro", free: false },
                { id: "google/gemini-3-flash", name: "Gemini 3 Flash", free: false },
            ];

            if (!githubToken) {
                return { models: FALLBACK_MODELS, error: null };
            }

            // Try to fetch available models from GitHub Models API
            try {
                const resp = await fetch(
                    "https://models.github.ai/catalog/models",
                    {
                        headers: {
                            Authorization: `Bearer ${githubToken}`,
                            Accept: "application/vnd.github+json",
                            "X-GitHub-Api-Version": "2022-11-28",
                        },
                    },
                );
                if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                const data = await resp.json();
                const rawModels = data.data || data;
                if (!Array.isArray(rawModels) || rawModels.length === 0) {
                    throw new Error("Empty response");
                }
                
                const models = rawModels
                    .filter((m) => m.id)
                    .map((m) => ({
                        id: m.id,
                        name: m.name || m.id,
                        free: FREE_COPILOT_MODELS.has(m.id),
                    }))
                    .sort((a, b) => {
                        if (a.free && !b.free) return -1;
                        if (!a.free && b.free) return 1;
                        return a.name.localeCompare(b.name);
                    });
                return { models, error: null };
            } catch (e) {
                return { models: FALLBACK_MODELS, error: `Could not fetch models: ${e.message}` };
            }
        }

        case "ollama": {
            const baseUrl = (ollamaUrl || "http://localhost:11434").replace(/\/+$/, "");
            let resp;
            try {
                resp = await fetch(`${baseUrl}/api/tags`);
            } catch (e) {
                throw new Error(
                    `Cannot reach Ollama at ${baseUrl}. Make sure Ollama is running.`,
                );
            }
            if (resp.status === 403 || resp.status === 405) {
                throw new Error(
                    `Ollama CORS error (${resp.status}). Run: OLLAMA_ORIGINS=chrome-extension://* ollama serve`,
                );
            }
            if (!resp.ok)
                throw new Error(`Ollama: ${resp.status}. Is Ollama running on ${baseUrl}?`);
            const data = await resp.json();
            const models = (data.models || [])
                .filter(
                    (m) => !m.name.toLowerCase().includes("embed"),
                )
                .map((m) => ({
                    id: m.name,
                    name: m.name,
                    free: true,
                    size: m.size,
                }));
            if (models.length === 0) {
                throw new Error(
                    "No models found. Install one with: ollama pull llama3",
                );
            }
            return { models, error: null };
        }

        case "chatgpt": {
            if (!apiKey) throw new Error("API key required to list models");
            const resp = await fetch("https://api.openai.com/v1/models", {
                headers: { Authorization: `Bearer ${apiKey}` },
            });
            if (!resp.ok)
                throw new Error(`OpenAI error: ${resp.status}`);
            const data = await resp.json();
            const excluded =
                /embed|dall|tts|whisper|realtime|audio|image|babbage|davinci|canary|search/i;
            const models = data.data
                .filter((m) => m.id.startsWith("gpt-"))
                .filter((m) => !excluded.test(m.id))
                .sort((a, b) => b.id.localeCompare(a.id))
                .map((m) => ({ id: m.id, name: m.id, free: false }));
            return { models, error: null };
        }

        case "openrouter": {
            const headers = { "Content-Type": "application/json" };
            if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
            const resp = await fetch(
                "https://openrouter.ai/api/v1/models",
                { headers },
            );
            if (!resp.ok)
                throw new Error(`OpenRouter error: ${resp.status}`);
            const data = await resp.json();
            const models = data.data
                .filter((m) => m.id && m.name)
                .map((m) => ({
                    id: m.id,
                    name: m.name || m.id,
                    free:
                        m.pricing?.prompt === "0" &&
                        m.pricing?.completion === "0",
                    context: m.context_length,
                }))
                .sort((a, b) => {
                    if (a.free && !b.free) return -1;
                    if (!a.free && b.free) return 1;
                    return a.name.localeCompare(b.name);
                });
            return { models, error: null };
        }

        default:
            return { models: [], error: "No model listing for this provider" };
    }
}

// ─── Test Connection ────────────────────────────────────────────────────────

async function testConnection(settings, githubToken) {
    const testPrompt = "Reply with only the word: OK";
    try {
        const result = await callProvider(settings, testPrompt, githubToken);
        return { success: true, message: result.substring(0, 50) };
    } catch (e) {
        return { success: false, error: e.message };
    }
}

// ─── GitHub Issue Creation ──────────────────────────────────────────────────

async function createGitHubIssue(githubToken, issue) {
    if (!githubToken) {
        throw new Error("GitHub token required to create issues. Configure it in the extension settings.");
    }

    const resp = await fetch(
        `https://api.github.com/repos/${issue.repo}/issues`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${githubToken}`,
                Accept: "application/vnd.github+json",
            },
            body: JSON.stringify({
                title: issue.title,
                body: issue.body,
                labels: issue.labels || [],
            }),
        },
    );

    if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(
            err.message || `GitHub API error: ${resp.status}`,
        );
    }

    const data = await resp.json();
    return { success: true, url: data.html_url, number: data.number };
}
