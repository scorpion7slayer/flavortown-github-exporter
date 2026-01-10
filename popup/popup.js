const searchBtn = document.getElementById('search-btn');
const usernameInput = document.getElementById('username-input');
const repoList = document.getElementById('repo-list-element');
const exportBtn = document.getElementById('export-btn');

const stateEmpty = document.getElementById('state-empty');
const stateLoading = document.getElementById('state-loading');
const stateError = document.getElementById('state-error');
const stateNoPublic = document.getElementById('state-no-public');
const errorTitle = document.getElementById('error-title');
const errorDesc = document.getElementById('error-desc');

let selectedRepo = null;
let repos = [];

const languageColors = {
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
    Markdown: '#083fa1',
    default: '#8b949e'
};

function showState(state) {
    stateEmpty.style.display = 'none';
    stateLoading.style.display = 'none';
    stateError.style.display = 'none';
    stateNoPublic.style.display = 'none';
    repoList.style.display = 'none';

    switch(state) {
        case 'empty':
            stateEmpty.style.display = 'flex';
            break;
        case 'loading':
            stateLoading.style.display = 'flex';
            break;
        case 'error':
            stateError.style.display = 'flex';
            break;
        case 'no-public':
            stateNoPublic.style.display = 'flex';
            break;
        case 'list':
            repoList.style.display = 'block';
            break;
    }
}

function showError(title, desc) {
    errorTitle.textContent = title;
    errorDesc.textContent = desc;
    showState('error');
}

async function fetchRepos(username) {
    showState('loading');
    exportBtn.disabled = true;
    selectedRepo = null;

    try {
        const response = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated&type=public`);

        if (response.status === 404) {
            showError('User not found', `The GitHub user "${username}" doesn't exist.`);
            return;
        }

        if (response.status === 403) {
            showError('Rate limit exceeded', 'Too many requests. Please wait a moment and try again.');
            return;
        }

        if (!response.ok) {
            showError('Error', 'Something went wrong. Please try again.');
            return;
        }

        const data = await response.json();
        repos = data.filter(repo => !repo.fork);

        if (repos.length === 0) {
            showState('no-public');
            return;
        }

        renderRepos(repos);
        showState('list');

        if (typeof browser !== 'undefined') {
            browser.storage.local.set({ lastUsername: username });
        } else if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ lastUsername: username });
        }

    } catch (error) {
        showError('Network error', 'Unable to connect to GitHub. Check your internet connection.');
    }
}

function renderRepos(repos) {
    repoList.innerHTML = '';

    repos.forEach((repo, index) => {
        const li = document.createElement('li');
        li.className = 'repo-item';
        li.dataset.index = index;

        const langColor = languageColors[repo.language] || languageColors.default;
        const description = repo.description || 'No description provided';

        li.innerHTML = `
            <label for="repo-${repo.id}">
                <div class="radio-container">
                    <input type="radio" name="repo-select" id="repo-${repo.id}" value="${index}">
                </div>
                <div class="repo-info">
                    <div class="repo-header">
                        <span class="repo-name">${repo.name}</span>
                        <span class="repo-visibility">Public</span>
                    </div>
                    <div class="repo-desc">${escapeHtml(description)}</div>
                    <div class="repo-meta">
                        ${repo.language ? `
                        <div class="meta-item">
                            <span class="lang-dot" style="background-color: ${langColor}"></span>
                            ${repo.language}
                        </div>
                        ` : ''}
                        <div class="meta-item">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path></svg>
                            ${repo.stargazers_count.toLocaleString()}
                        </div>
                        <div class="meta-item">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"></path></svg>
                            ${repo.forks_count.toLocaleString()}
                        </div>
                    </div>
                </div>
            </label>
        `;

        li.addEventListener('click', (e) => {
            document.querySelectorAll('.repo-item').forEach(item => item.classList.remove('selected'));
            li.classList.add('selected');

            const radio = li.querySelector('input');
            radio.checked = true;
            selectedRepo = repos[index];
            exportBtn.disabled = false;
        });

        repoList.appendChild(li);
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function exportToFlavortown() {
    if (!selectedRepo) return;

    const originalContent = exportBtn.innerHTML;
    exportBtn.disabled = true;
    exportBtn.innerHTML = `
        <svg class="spinner" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M8 2a6 6 0 1 0 6 6" stroke-linecap="round"></path>
        </svg>
        Exporting...
    `;

    const repoData = {
        name: selectedRepo.name,
        description: selectedRepo.description || '',
        html_url: selectedRepo.html_url,
        homepage: selectedRepo.homepage || selectedRepo.html_url,
        default_branch: selectedRepo.default_branch || 'main',
        owner: selectedRepo.owner.login,
        full_name: selectedRepo.full_name
    };

    const rawReadmeUrl = `https://raw.githubusercontent.com/${repoData.full_name}/refs/heads/${repoData.default_branch}/README.md`;

    try {
        const queryOptions = { active: true, currentWindow: true };

        let tabs;
        if (typeof browser !== 'undefined') {
            tabs = await browser.tabs.query(queryOptions);
        } else {
            tabs = await chrome.tabs.query(queryOptions);
        }

        const currentTab = tabs[0];

        if (!currentTab.url.includes('flavortown.hackclub.com/projects/new')) {
            exportBtn.innerHTML = originalContent;
            exportBtn.disabled = false;

            const confirmOpen = confirm('You need to be on the Flavortown new project page. Open it now?');
            if (confirmOpen) {
                if (typeof browser !== 'undefined') {
                    await browser.tabs.create({ url: 'https://flavortown.hackclub.com/projects/new' });
                } else {
                    await chrome.tabs.create({ url: 'https://flavortown.hackclub.com/projects/new' });
                }
            }
            return;
        }

        const message = {
            action: 'fillForm',
            data: {
                title: repoData.name,
                description: repoData.description,
                demoLink: repoData.homepage,
                repoUrl: repoData.html_url,
                readmeUrl: rawReadmeUrl
            }
        };

        if (typeof browser !== 'undefined') {
            await browser.tabs.sendMessage(currentTab.id, message);
        } else {
            await chrome.tabs.sendMessage(currentTab.id, message);
        }

        exportBtn.classList.add('success');
        exportBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"></path>
            </svg>
            Exported!
        `;

        setTimeout(() => {
            exportBtn.classList.remove('success');
            exportBtn.innerHTML = originalContent;
            exportBtn.disabled = false;
        }, 2000);

    } catch (error) {
        exportBtn.innerHTML = originalContent;
        exportBtn.disabled = false;
        alert('Failed to export. Make sure you are on the Flavortown new project page.');
    }
}

searchBtn.addEventListener('click', () => {
    const username = usernameInput.value.trim();
    if (username) {
        fetchRepos(username);
    }
});

usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const username = usernameInput.value.trim();
        if (username) {
            fetchRepos(username);
        }
    }
});

exportBtn.addEventListener('click', exportToFlavortown);

document.addEventListener('DOMContentLoaded', async () => {
    try {
        let result;
        if (typeof browser !== 'undefined') {
            result = await browser.storage.local.get('lastUsername');
        } else if (typeof chrome !== 'undefined' && chrome.storage) {
            result = await chrome.storage.local.get('lastUsername');
        }

        if (result && result.lastUsername) {
            usernameInput.value = result.lastUsername;
        }
    } catch (e) {
    }
});
