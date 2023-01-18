import browser from "webextension-polyfill";

browser.action.onClicked.addListener(async (tab) => {
    await browser.tabs.sendMessage(tab.id ?? 0, {text: 'convert_page'});
});
