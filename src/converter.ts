import browser from "webextension-polyfill";
import {Converter} from "./converter/converter";
import {Log} from "./log/log";
import {Message} from "./messages";
import {ConvertMessage} from "./messages/convert";

const log = new Log();

function convert(filename: string, strokes: boolean, images: boolean, texts: boolean, dark_page: boolean, strokes_dark_mode: boolean, texts_dark_mode: boolean, separateLayers: boolean) {
    const converter: Converter = Converter.build(log);
    converter.convert(strokes, images, texts, separateLayers, dark_page, strokes_dark_mode, texts_dark_mode, filename);
}


/* TODO
interface LogEnableMessage extends Message {
    enable: boolean;
}

interface LogDebugMessage extends Message {
    enable: boolean;
}
 */

browser.runtime.onMessage.addListener((msg) => {

    const message = JSON.parse(msg.text) as (Message);
    if (message.message === 'convert') {
        const convert_message = message as ConvertMessage;
        convert(
            convert_message.filename,
            convert_message.strokes,
            convert_message.images,
            convert_message.texts,
            convert_message.dark_page,
            convert_message.strokes_dark_mode,
            convert_message.texts_dark_mode,
            convert_message.separateLayers,
        );
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
