function fillFlavortownForm(data) {
    const titleInput = document.querySelector('input[placeholder="Give your project a name"]');
    if (titleInput) {
        titleInput.value = data.title;
        titleInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    const descriptionInput = document.querySelector('textarea[placeholder*="Share what the project does"]');
    if (descriptionInput) {
        descriptionInput.value = data.description;
        descriptionInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    const demoLinkInput = document.querySelector('input[placeholder*="flavortown.cooked.selfhosted"]');
    if (demoLinkInput) {
        demoLinkInput.value = data.demoLink;
        demoLinkInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    const repoInput = document.querySelector('input[placeholder*="github.com/hackclub"]');
    if (repoInput) {
        repoInput.value = data.repoUrl;
        repoInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    const readmeInput = document.querySelector('input[placeholder*="raw.githubusercontent"]');
    if (readmeInput) {
        readmeInput.value = data.readmeUrl;
        readmeInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    showNotification('Form filled successfully!', 'success');
}

function showNotification(message, type) {
    const existingNotification = document.querySelector('.flavortown-export-notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'flavortown-export-notification';
    notification.textContent = message;

    const bgColor = type === 'success' ? '#238636' : '#f85149';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${bgColor};
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease-out;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

if (typeof browser !== 'undefined') {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'fillForm') {
            fillFlavortownForm(message.data);
            sendResponse({ success: true });
        }
        return true;
    });
} else if (typeof chrome !== 'undefined') {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'fillForm') {
            fillFlavortownForm(message.data);
            sendResponse({ success: true });
        }
        return true;
    });
}
