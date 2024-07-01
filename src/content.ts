import browser from "webextension-polyfill";
import {Converter} from "./converter/converter";
import {Log} from "./log/log";
import {Message} from "./messages";
import {ConvertMessage} from "./messages/convert";

const log = new Log();

/* TODO
interface LogEnableMessage extends Message {
    enable: boolean;
}

interface LogDebugMessage extends Message {
    enable: boolean;
}
 */

browser.runtime.onMessage.addListener(async(msg) => {
    const message = JSON.parse(msg.text) as (Message);
    if (message.message === 'convert') {
        const converter: Converter = Converter.build(log);
        await converter.convert(message as ConvertMessage);
        converter.download();
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
