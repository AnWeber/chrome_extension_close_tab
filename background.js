
chrome.commands.onCommand.addListener(async (command) => {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    if (command === 'close-origin') {
        const activeTab = getActiveTab(tabs);
        const origin = getOriginOfTab(activeTab);
        await closeTabsWithPredicate(tabs, t => getOriginOfTab(t) === origin);
    }
    if (command === 'close-duplicate') {
        const activeTab = getActiveTab(tabs);
        await closeTabsWithPredicate(tabs, t => t.id !== activeTab.id && t.url === activeTab.url);
    }
    if (command === 'close-all-duplicate') {
        let cache = {};
        await closeTabsWithPredicate(tabs, t => {
            const url = t.url;
            if (cache[url]) {
                return true;
            }
            cache[url] = 1;
            return false;
        });
    }
});

async function closeTabsWithPredicate(tabs, predicate) {
    for (const tab of tabs) {
        if (predicate(tab)) {
            await removeTab(tab);
        }
    }
}

function getOriginOfTab(tab) {
    return new URL(tab.url).origin;
}


function getActiveTab(tabs) {
    return tabs.find((tab) => tab.active)
};

function removeTab(tab) {
    return new Promise((resolve, reject) => {
        chrome.tabs.remove(tab.id, () => {
            if (chrome.runtime.lastError) {
                console.error("removeTab error:", chrome.runtime.lastError.message);
                reject();
            } else {
                resolve();
            }
        });
    });
}