import browser from "webextension-polyfill";
import {Status, LogLine, COLORS} from "./log/log";
import {ConvertMessage} from "./messages/convert";


// Texts zone (I hate this)
const fileNameLabel: HTMLLabelElement = document.getElementById("fileNameLabel") as HTMLLabelElement;
const emptyNameInfo: HTMLSpanElement = document.getElementById("emptyNameInfo") as HTMLSpanElement;
const optionsTitle: HTMLHeadingElement = document.getElementById("optionsTitle") as HTMLHeadingElement;
const exportStrokesLabel: HTMLLabelElement = document.getElementById("exportStrokesLabel") as HTMLLabelElement;
const exportImagesLabel: HTMLLabelElement = document.getElementById("exportImagesLabel") as HTMLLabelElement;
const exportTextsLabel: HTMLLabelElement = document.getElementById("exportTextsLabel") as HTMLLabelElement;
const exportSeparateLayersLabel: HTMLLabelElement = document.getElementById("exportSeparateLayersLabel") as HTMLLabelElement;
const exportDarkModeLabel: HTMLLabelElement = document.getElementById("exportDarkModeLabel") as HTMLLabelElement;
const sourceCodeText: HTMLSpanElement = document.getElementById("sourceCodeText") as HTMLSpanElement;
const addonText: HTMLSpanElement = document.getElementById("addonText") as HTMLSpanElement;
const donateText: HTMLSpanElement = document.getElementById("donateText") as HTMLSpanElement;
const reportIssueText: HTMLSpanElement = document.getElementById("reportIssueText") as HTMLSpanElement;

// Input zone
const exportButton: HTMLButtonElement = document.getElementById("exportButton") as HTMLButtonElement;
const fileNameInput: HTMLInputElement = document.getElementById("fileName") as (HTMLInputElement);
const exportImages: HTMLInputElement = document.getElementById("exportImages") as (HTMLInputElement);
const exportTexts: HTMLInputElement = document.getElementById("exportTexts") as (HTMLInputElement);
const exportStrokes: HTMLInputElement = document.getElementById("exportStrokes") as (HTMLInputElement);
const exportSeparateLayers: HTMLInputElement = document.getElementById("exportSeparateLayers") as (HTMLInputElement);
const exportDarkMode: HTMLInputElement = document.getElementById("exportDarkMode") as (HTMLInputElement);
const container: HTMLInputElement = document.getElementById('container') as HTMLInputElement;


// Localization section
fileNameLabel.innerText = browser.i18n.getMessage("fileNameLabel");
emptyNameInfo.innerText = browser.i18n.getMessage("emptyNameInfo");
exportButton.innerText = browser.i18n.getMessage("exportButton");
optionsTitle.innerText = browser.i18n.getMessage("optionsTitle");
exportStrokesLabel.innerText = browser.i18n.getMessage("exportStrokesLabel");
exportImagesLabel.innerText = browser.i18n.getMessage("exportImagesLabel");
exportTextsLabel.innerText = browser.i18n.getMessage("exportTextsLabel");
exportSeparateLayersLabel.innerText = browser.i18n.getMessage("exportSeparateLayersLabel");
exportDarkModeLabel.innerText = browser.i18n.getMessage("exportDarkModeLabel");
sourceCodeText.innerText = browser.i18n.getMessage("sourceCodeText");
addonText.innerText = browser.i18n.getMessage("addonText");
donateText.innerText = browser.i18n.getMessage("donateText");
reportIssueText.innerText = browser.i18n.getMessage("reportIssueText");

/* TODO
const log = document.getElementById('log');
const logContainer = document.getElementById('logContainer');
const openLogButton = document.getElementById('openLogButton');
const enableDebugButton = document.getElementById('enableDebugButton');
*/

type Settings = {
    [K in SettingsKeys]: boolean
}

type SettingsKeys =
    "export_images"
    | "export_texts"
    | "export_strokes"
    | "export_separate_layers"
    | "export_dark_page"
    | "export_strokes_dark_mode"
    | "export_texts_dark_mode";

let settings: Settings = {
    export_images: exportImages?.checked || true,
    export_texts: exportTexts?.checked || true,
    export_strokes: exportStrokes?.checked || true,
    export_separate_layers: exportSeparateLayers?.checked || true,
    export_dark_page: exportDarkMode?.checked || false,
    export_strokes_dark_mode: exportDarkMode?.checked || false,
    export_texts_dark_mode: exportDarkMode?.checked || false
};


document.addEventListener('DOMContentLoaded', async () => {
    console.log(browser.i18n.getUILanguage());
    console.log(await browser.i18n.getAcceptLanguages());
    console.log(browser.i18n.getMessage("restrictedPages"));
    const tab = (await browser.tabs.query({active: true, currentWindow: true}))[0];
    if (!tab.url?.startsWith('https://onedrive.live.com/')
        && !tab.url?.match("https:\\/\\/[a-zA-Z0-9-]+\\.sharepoint\\.com.*$")) {
        if (container) {
            container.innerHTML = '';
            const error = document.createElement("span");
            error.classList.add('border-color');
            error.innerText = browser.i18n.getMessage("restrictedPages");
            container.append(error);
        }
    }
    writeLine(
        {
            status: Status.INFO,
            date: new Date(),
            text: "Addon loaded"
        }
    )

    const items = await browser.storage.local.get(["o2x-settings"]);
    if (items["o2x-settings"]) {
        settings = items["o2x-settings"];
    }

    exportImages.checked = settings.export_images;
    exportStrokes.checked = settings.export_strokes;
    exportTexts.checked = settings.export_texts;
    exportSeparateLayers.checked = settings.export_separate_layers;
    exportDarkMode.checked = settings.export_dark_page;


    /* TODO
    const item = await browser.storage.local.get(['o2x-log-debug', 'o2x-log-show']);
    const debug = item["o2x-log-debug"];
    const show = item["o2x-log-show"];
    if (openLogButton) {
        openLogButton.innerText = (!show) ? 'Show log' : 'Hide log';
        await openLog();
    } else {
        await closeLog()
    }
    if (enableDebugButton) {
        enableDebugButton.innerText = (!debug) ? 'Enable debug' : 'Disable debug';
        await enableDebugLog(debug, show);
    }
     */

});

function setUpdateSettingsListener(input: HTMLInputElement, settings_key: SettingsKeys) {
    input.addEventListener("change", async () => {
        settings[settings_key] = input.checked;
        await browser.storage.local.set({"o2x-settings": settings});
    });
}

setUpdateSettingsListener(exportImages, "export_images");
setUpdateSettingsListener(exportStrokes, "export_strokes");
setUpdateSettingsListener(exportSeparateLayers, "export_separate_layers");
setUpdateSettingsListener(exportTexts, "export_texts");
setUpdateSettingsListener(exportDarkMode, "export_dark_page");
setUpdateSettingsListener(exportDarkMode, "export_strokes_dark_mode");
setUpdateSettingsListener(exportDarkMode, "export_texts_dark_mode");


/* TODO
async function openLog() {
    logContainer?.classList.remove('d-none');
    const tab = (await browser.tabs.query({active: true, currentWindow: true}))[0];
    await browser.tabs.sendMessage(tab?.id ?? 0, {
        text: JSON.stringify({
            message: 'log_enable',
            enable: true
        })
    });
    await browser.tabs.sendMessage(tab?.id ?? 0, {
        text: JSON.stringify({
            message: 'full_log'
        })
    });
}


async function closeLog() {
    logContainer?.classList.add('d-none');
    const tab = (await browser.tabs.query({active: true, currentWindow: true}))[0];
    await browser.tabs.sendMessage(tab?.id ?? 0, {
        text: JSON.stringify({
            message: 'log_enable',
            enable: false
        })
    });
}

async function enableDebugLog(enable: boolean, visible: boolean) {
    const tab = (await browser.tabs.query({active: true, currentWindow: true}))[0];

    await browser.tabs.sendMessage(tab?.id ?? 0, {
        text: JSON.stringify({
            message: 'log_debug',
            enable: enable
        })
    });

    if (enable && visible) {
        await browser.tabs.sendMessage(tab?.id ?? 0, {
            text: JSON.stringify({
                message: 'full_log'
            })
        });
    }
}


openLogButton?.addEventListener('click', async () => {
    const item = await browser.storage.local.get('o2x-log-show');
    const state = item["o2x-log-show"];
    if (!state) {
        await openLog();
    } else {
        await closeLog();
    }
    await browser.storage.local.set({'o2x-log-show': !state});
    if (openLogButton) {
        openLogButton.innerText = (state) ? 'Show log' : 'Hide log';
    }
})


enableDebugButton?.addEventListener('click', async () => {
    const item = await browser.storage.local.get(['o2x-log-debug', 'o2x-log-show']);
    const state = item["o2x-log-debug"];
    const visible = item["o2x-log-show"];
    await enableDebugLog(!state, visible);
    await browser.storage.local.set({'o2x-log-debug': !state});
    if (enableDebugButton) {
        enableDebugButton.innerText = (!state) ? 'Disable debug' : 'Enable debug';
    }
})
 */

exportButton?.addEventListener('click', async () => {
    const granted = await browser.permissions.request({
        origins: ["https://onenote.officeapps.live.com/*", "https://*.officeapps.live.com/*"]
    });
    if (!granted) {
        writeLine({
            status: Status.ERROR,
            date: new Date(),
            text: "Cannot convert the page without required permission"
        });
        return;
    }

    const tab = (await browser.tabs.query({active: true, currentWindow: true}))[0];
    try {
        const message: ConvertMessage = {
            dark_page: exportDarkMode?.checked ?? false,
            strokes_dark_mode: exportDarkMode?.checked ?? false,
            texts_dark_mode: exportDarkMode?.checked ?? false,
            message: 'convert',
            filename: fileNameInput?.value || "",
            images: exportImages?.checked ?? true,
            texts: exportTexts?.checked ?? true,
            strokes: exportStrokes?.checked ?? true,

            separateLayers: exportSeparateLayers?.checked ?? true
        }
        await browser.tabs.sendMessage(tab?.id ?? 0, {
            text: JSON.stringify(message)
        });
    } catch(e) {
        writeLine({
            status: Status.ERROR,
            date: new Date(),
            text: "Extension hasn't load properly. Couldn't export document. Try to refresh the page."
        });
    }
});

function writeLine(line: LogLine) {
    const row = document.createElement("span");
    row.classList.add(`bg-${COLORS[line.status]}`);
    row.innerText = `${line.status.toUpperCase()} - ${line.date.toLocaleString()} - ${line.text}`;
    // TODO
    //log?.prepend(row);
}

/* TODO
browser.runtime.onMessage.addListener((message) => {
    if (message.message === 'log_line') {
        const line: LogLine = message.line;
        writeLine(line);
    } else if (message.message === 'full_log') {
        if (log) {
            log.innerHTML = "";
        }
        const lines: LogLine[] = message.lines;
        for (const line of lines) {
            writeLine(line);
        }
    }
});
 */