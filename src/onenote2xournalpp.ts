import browser from "webextension-polyfill";
const url: RegExp = new RegExp('https?:\/\/onedrive\.live\.com\/.*');

browser.action.onClicked.addListener(async (tab) => {
    await browser.tabs.sendMessage(tab.id ?? 0, {text: 'convert_page'});
});
