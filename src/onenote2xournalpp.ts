import browser from "webextension-polyfill";

const url: RegExp = new RegExp('https?:\/\/onedrive\.live\.com\/.*');

browser.browserAction.onClicked.addListener(async (tab) => {
    if(tab.url && url.test(tab.url)){
        await browser.tabs.sendMessage(tab.id ?? 0, {text: 'convert_page'});
    }
});
