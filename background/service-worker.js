if (typeof browser !== 'undefined') {
    browser.runtime.onInstalled.addListener(() => {
        console.log('Flavortown GitHub Exporter installed');
    });
} else if (typeof chrome !== 'undefined') {
    chrome.runtime.onInstalled.addListener(() => {
        console.log('Flavortown GitHub Exporter installed');
    });
}
