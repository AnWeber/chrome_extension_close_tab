
chrome.commands.onCommand.addListener(async (command) => {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    if (command === 'close-origin') {
        await closeTabsWithOrigin(tabs);
    }
    if (command === 'close-all') {
        await closeAllTabs(tabs);
    }
    if (command === 'close-duplicate') {
        await closeTabsWithHashlessUrl(tabs);
    }
    if (command === 'close-all-duplicate') {
        await closeAllDuplicateTabs(tabs);
    }
});

let dblClickTimer = undefined;
chrome.action.onClicked.addListener(async function () {
    const clearDbClickTimer = () => {
        dblClickTimer && clearTimeout(dblClickTimer);
        dblClickTimer = undefined;
    }
    if (dblClickTimer) {
        clearDbClickTimer();
        const tabs = await chrome.tabs.query({ currentWindow: true });
        await closeTabsWithOrigin(tabs);
    } else {
        dblClickTimer = setTimeout(async () => {
            clearDbClickTimer();
            const tabs = await chrome.tabs.query({ currentWindow: true });
            await closeTabsWithHashlessUrl(tabs);
        }, 400);
    }
});

async function closeTabsWithOrigin(tabs) {
    const activeTab = getActiveTab(tabs);
    const getOrigin = (tab) => new URL(tab.url).origin;
    const origin = getOrigin(activeTab);
    await closeTabsWithPredicate(tabs, t => !t.active && getOrigin(t) === origin);
}

async function closeTabsWithHashlessUrl(tabs) {
    const activeTab = getActiveTab(tabs);
    const getHashlessUrl = (tab) => tab.url.split("#").at(0);
    const url = getHashlessUrl(activeTab);
    await closeTabsWithPredicate(tabs, t => !t.active && getHashlessUrl(t) === url);
}

async function closeAllTabs(tabs) {
    await closeTabsWithPredicate(tabs, t => !t.active);
}

async function closeAllDuplicateTabs(tabs) {
    let cache = {};
    const activeTab = getActiveTab(tabs);
    const getHashlessUrl = (tab) => tab.url.split("#").at(0);
    const activeTabUrl = getHashlessUrl(activeTab);
    await closeTabsWithPredicate(tabs, t => {
        const url = getHashlessUrl(t);
        if (cache[url] || url === activeTabUrl && !t.active) {
            return true;
        }
        cache[url] = 1;
        return false;
    });
}

async function closeTabsWithPredicate(tabs, predicate) {
    for (const tab of tabs) {
        if (predicate(tab)) {
            await removeTab(tab);
        }
    }
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