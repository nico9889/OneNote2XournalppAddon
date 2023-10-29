import browser from "webextension-polyfill";
import {Status, LogLine, COLORS} from "./log/log";


const exportButton = document.getElementById("export");
const fileNameInput = document.getElementById("fileName") as (HTMLInputElement | null);
const exportImages = document.getElementById("exportImages") as (HTMLInputElement | null);
const exportTexts = document.getElementById("exportTexts") as (HTMLInputElement | null);
const exportStrokes = document.getElementById("exportStrokes") as (HTMLInputElement | null);
const exportSeparateLayers = document.getElementById("exportSeparateLayers") as (HTMLInputElement | null);
const container = document.getElementById('container');
const log = document.getElementById('log');
const logContainer = document.getElementById('logContainer');
const openLogButton = document.getElementById('openLogButton');
const enableDebugButton = document.getElementById('enableDebugButton');

document.addEventListener('DOMContentLoaded', async () => {
    const tab = (await browser.tabs.query({active: true, currentWindow: true}))[0];
    if (!tab.url?.startsWith('https://onedrive.live.com/')) {
        if (container) {
            container.innerHTML = '';
            const error = document.createElement("span");
            error.classList.add('border-color');
            error.innerText = "This addon works only on OneNote pages";
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

});

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


exportButton?.addEventListener('click', async () => {
    const granted = await browser.permissions.request({origins: ["https://onenote.officeapps.live.com/*"]});
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
        await browser.tabs.sendMessage(tab?.id ?? 0, {
            text: JSON.stringify({
                message: 'convert',
                filename: fileNameInput?.value,
                images: exportImages?.checked ?? true,
                texts: exportTexts?.checked ?? true,
                strokes: exportStrokes?.checked ?? true,
                separateLayers: exportSeparateLayers?.checked ?? true
            })
        });
    } catch {
        writeLine({
            status: Status.ERROR,
            date: new Date(),
            text: "Extension hasn't load properly. Couldn't export document. Try to refresh the page."
        });
    }
});

function writeLine(line: LogLine) {
    console.debug(line.text);
    const row = document.createElement("span");
    row.classList.add(`bg-${COLORS[line.status]}`);
    row.innerText = `${line.status.toUpperCase()} - ${line.date.toLocaleString()} - ${line.text}`;
    log?.prepend(row);
}

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