/**
 * Flavortown GitHub Exporter - Background Service Worker
 * Handles AI API calls, dynamic model fetching, and OAuth Device Flow
 */

// OAuth Device Flow state
let deviceFlowState = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "AI_GENERATE_DESCRIPTION") {
        handleAIGeneration(message)
            .then(sendResponse)
            .catch((e) =>
                sendResponse({ description: null, error: e.message }),
            );
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

    // OAuth Device Flow handlers
    if (message.type === "OAUTH_START_DEVICE_FLOW") {
        startDeviceFlow(message.clientId, message.scopes)
            .then(sendResponse)
            .catch((e) => sendResponse({ error: e.message }));
        return true;
    }

    if (message.type === "OAUTH_POLL_TOKEN") {
        pollForToken(message.clientId)
            .then(sendResponse)
            .catch((e) => sendResponse({ error: e.message }));
        return true;
    }

    if (message.type === "OAUTH_CANCEL") {
        deviceFlowState = null;
        sendResponse({ cancelled: true });
        return true;
    }
});

// ─── OAuth Device Flow ──────────────────────────────────────────────────────

async function startDeviceFlow(clientId, scopes = "public_repo read:user") {
    const resp = await fetch("https://github.com/login/device/code", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            client_id: clientId,
            scope: scopes,
        }),
    });

    if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error_description || `GitHub error: ${resp.status}`);
    }

    const data = await resp.json();
    deviceFlowState = {
        deviceCode: data.device_code,
        userCode: data.user_code,
        verificationUri: data.verification_uri,
        expiresIn: data.expires_in,
        interval: data.interval || 5,
        expiresAt: Date.now() + data.expires_in * 1000,
    };

    return {
        userCode: data.user_code,
        verificationUri: data.verification_uri,
        expiresIn: data.expires_in,
    };
}

async function pollForToken(clientId) {
    if (!deviceFlowState) {
        throw new Error("No active device flow. Please start again.");
    }

    if (Date.now() > deviceFlowState.expiresAt) {
        deviceFlowState = null;
        throw new Error("Device code expired. Please start again.");
    }

    const resp = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            client_id: clientId,
            device_code: deviceFlowState.deviceCode,
            grant_type: "urn:ietf:params:oauth:grant-type:device_code",
        }),
    });

    const data = await resp.json();

    if (data.error) {
        if (data.error === "authorization_pending") {
            return { pending: true, interval: deviceFlowState.interval };
        }
        if (data.error === "slow_down") {
            deviceFlowState.interval = (deviceFlowState.interval || 5) + 5;
            return { pending: true, interval: deviceFlowState.interval };
        }
        if (data.error === "expired_token") {
            deviceFlowState = null;
            throw new Error("Device code expired. Please start again.");
        }
        if (data.error === "access_denied") {
            deviceFlowState = null;
            throw new Error("Authorization was denied by the user.");
        }
        throw new Error(data.error_description || data.error);
    }

    // Success! We got the token
    deviceFlowState = null;
    return {
        accessToken: data.access_token,
        tokenType: data.token_type,
        scope: data.scope,
    };
}

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

    const prompt = buildPrompt(
        repo,
        readmeContent,
        settings.promptPreset,
        settings.customPrompt,
    );
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
            // Get Copilot token for API calls
            let copilotToken = githubToken;
            
            try {
                // Try to get a Copilot-specific token
                const tokenResp = await fetch(`${COPILOT_API_BASE}/copilot_internal/v2/token`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${githubToken}`,
                        Accept: "application/json",
                    },
                });
                
                if (tokenResp.ok) {
                    const tokenData = await tokenResp.json();
                    copilotToken = tokenData.token || githubToken;
                }
            } catch (e) {
                // Fall back to using GitHub token directly
                console.warn("Could not get Copilot token:", e);
            }
            
            const resp = await fetch(
                `${COPILOT_API_BASE}/inference/chat/completions`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${copilotToken}`,
                    },
                    body: JSON.stringify({
                        model: model || "gpt-5-mini",
                        messages: [{ role: "user", content: prompt }],
                        max_completion_tokens: 500,
                        temperature: 0.7,
                    }),
                },
            );
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(
                    err.error?.message ||
                        `GitHub Copilot: ${resp.status}. Check your Copilot subscription.`,
                );
            }
            const data = await resp.json();
            return data.choices[0].message.content.trim();
        }

        case "ollama": {
            // Native Ollama /api/chat endpoint (see docs.ollama.com/api/chat)
            const baseUrl = (ollamaUrl || "http://localhost:11434").replace(
                /\/+$/,
                "",
            );
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
                        model: model || "gpt-5-mini",
                        messages: [{ role: "user", content: prompt }],
                        max_completion_tokens: 500,
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
            const resp = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": apiKey,
                    "anthropic-version": "2023-06-01",
                },
                body: JSON.stringify({
                    model: model || "claude-sonnet-4-5-20250929",
                    max_tokens: 500,
                    messages: [{ role: "user", content: prompt }],
                }),
            });
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
                        model: model || "meta-llama/llama-3-8b-instruct:free",
                        messages: [{ role: "user", content: prompt }],
                        max_completion_tokens: 500,
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

// Known Copilot models with their free/paid status
// These are the actual models available in GitHub Copilot (2026)
const COPILOT_MODELS = [
    { id: "gpt-4.1", name: "GPT-4.1", free: true },
    { id: "gpt-5-mini", name: "GPT-5 Mini", free: true },
    { id: "gpt-5.1", name: "GPT-5.1", free: true },
    { id: "gpt-5.2", name: "GPT-5.2", free: false },
    { id: "claude-haiku-4.5", name: "Claude Haiku 4.5", free: true },
    { id: "claude-sonnet-4", name: "Claude Sonnet 4", free: false },
    { id: "claude-sonnet-4.5", name: "Claude Sonnet 4.5", free: false },
    { id: "claude-opus-4.5", name: "Claude Opus 4.5", free: false },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", free: false },
    { id: "gemini-3-flash", name: "Gemini 3 Flash", free: true },
    { id: "gemini-3-pro", name: "Gemini 3 Pro", free: false },
    { id: "grok-code-fast-1", name: "Grok Code Fast 1", free: true },
    { id: "grok-code-2", name: "Grok Code 2", free: false },
    { id: "raptor-mini", name: "Raptor Mini", free: true },
    { id: "raptor-large", name: "Raptor Large", free: false },
];

// Copilot API endpoints
const COPILOT_API_BASE = "https://api.individual.githubcopilot.com";

async function getCopilotSubscription(githubToken) {
    try {
        // Try to get Copilot token first
        const tokenResp = await fetch(`${COPILOT_API_BASE}/copilot_internal/v2/token`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${githubToken}`,
                Accept: "application/json",
            },
        });
        
        if (!tokenResp.ok) {
            // Might be on business/enterprise plan, try alternative endpoint
            const orgTokenResp = await fetch(`${COPILOT_API_BASE}/copilot_internal/v2/token`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${githubToken}`,
                    Accept: "application/json",
                    "Content-Type": "application/json",
                },
            });
            
            if (!orgTokenResp.ok) {
                return { plan: "unknown", hasCopilot: false };
            }
            
            const orgData = await orgTokenResp.json();
            return { 
                plan: orgData.plan_type || "business", 
                hasCopilot: true,
                token: orgData.token 
            };
        }
        
        const data = await tokenResp.json();
        
        // Extract plan from token or make a separate API call
        // The token contains info like: tid=...;exp=...;plan=individual;...
        const tokenInfo = data.token || "";
        let plan = "individual"; // default
        
        if (tokenInfo.includes("plan=business") || tokenInfo.includes("plan=enterprise")) {
            plan = tokenInfo.includes("plan=enterprise") ? "enterprise" : "business";
        }
        
        return { plan, hasCopilot: true, token: data.token };
    } catch (e) {
        console.error("Failed to get Copilot subscription:", e);
        return { plan: "unknown", hasCopilot: false };
    }
}

async function fetchCopilotModels(githubToken) {
    // First get subscription to know the plan
    const { plan, hasCopilot } = await getCopilotSubscription(githubToken);
    
    if (!hasCopilot) {
        // User doesn't have Copilot, return models marked as not free
        return COPILOT_MODELS.map(m => ({ ...m, free: false }));
    }
    
    // Try to fetch available models from Copilot API
    try {
        // Use the Copilot token to fetch available models
        const { token } = await getCopilotSubscription(githubToken);
        
        if (token) {
            // Try the models endpoint with Copilot token
            const resp = await fetch(`${COPILOT_API_BASE}/models`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                },
            });
            
            if (resp.ok) {
                const data = await resp.json();
                const availableModels = data.models || [];
                
                // Mark models as available/unavailable based on Copilot API response
                const availableIds = new Set(availableModels.map(m => m.id));
                
                return COPILOT_MODELS.map(m => ({
                    ...m,
                    available: availableIds.has(m.id),
                    // On free plan, only certain models are truly free
                    free: m.free && (plan === "individual" || plan === "unknown")
                }));
            }
        }
    } catch (e) {
        console.error("Failed to fetch Copilot models:", e);
    }
    
    // Fallback: use static list with plan-based free determination
    return COPILOT_MODELS.map(m => ({
        ...m,
        // Individual/free plan has limited free models
        free: m.free && (plan === "individual" || plan === "unknown")
    }));
}

async function fetchModels(settings, githubToken) {
    const { provider, apiKey, ollamaUrl } = settings;

    switch (provider) {
        case "copilot": {
            if (!githubToken) {
                // No token - all models shown as not free
                return { 
                    models: COPILOT_MODELS.map(m => ({ ...m, free: false })), 
                    error: null 
                };
            }

            try {
                const models = await fetchCopilotModels(githubToken);
                
                // Sort: free first, then by name
                models.sort((a, b) => {
                    if (a.free && !b.free) return -1;
                    if (!a.free && b.free) return 1;
                    return a.name.localeCompare(b.name);
                });
                
                return { models, error: null };
            } catch (e) {
                return { 
                    models: COPILOT_MODELS.map(m => ({ ...m, free: false })), 
                    error: `Could not fetch Copilot models: ${e.message}` 
                };
            }
        }

        case "ollama": {
            const baseUrl = (ollamaUrl || "http://localhost:11434").replace(
                /\/+$/,
                "",
            );
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
                throw new Error(
                    `Ollama: ${resp.status}. Is Ollama running on ${baseUrl}?`,
                );
            const data = await resp.json();
            const models = (data.models || [])
                .filter((m) => !m.name.toLowerCase().includes("embed"))
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
            if (!resp.ok) throw new Error(`OpenAI error: ${resp.status}`);
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
            const resp = await fetch("https://openrouter.ai/api/v1/models", {
                headers,
            });
            if (!resp.ok) throw new Error(`OpenRouter error: ${resp.status}`);
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
        throw new Error(
            "GitHub token required to create issues. Configure it in the extension settings.",
        );
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
        throw new Error(err.message || `GitHub API error: ${resp.status}`);
    }

    const data = await resp.json();
    return { success: true, url: data.html_url, number: data.number };
}
