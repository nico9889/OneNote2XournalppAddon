import browser from "webextension-polyfill";
import {convertNote, downloadDocument} from "./converter/converter";
import {Message} from "./messages";
import {ConvertMessage} from "./messages/convert";
import {progressTracker} from "./converter/progress";

/* TODO
interface LogEnableMessage extends Message {
    enable: boolean;
}

interface LogDebugMessage extends Message {
    enable: boolean;
}
 */

browser.runtime.onMessage.addListener(async (msg) => {
    const message = JSON.parse(msg.text) as (Message);
    if (message.message === 'convert') {
        try {
            const document = await convertNote(message as ConvertMessage);
            downloadDocument(document);
        } catch (e) {
            await progressTracker.error();
        }
    }
    /* TODO
    else if (message.message === 'full_log') {
        log.writeAll();
    } else if (message.message === 'log_enable') {
        const log_enable = message as LogEnableMessage;
        log.enabled = log_enable.enable
    } else if (message.message === 'log_debug') {

        const log_debug = message as LogDebugMessage;
        log.debugEnabled = log_debug.enable;
    }
     */
});
