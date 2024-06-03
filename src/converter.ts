import browser from "webextension-polyfill";
import {Converter} from "./converter/converter";
import {Log} from "./log/log";

const log = new Log();

function convert(filename: string, strokes: boolean, images: boolean, texts: boolean, separateLayers: boolean) {
    const converter: Converter = Converter.build(log);
    converter.convert(strokes, images, texts, separateLayers, filename);
    converter.download();
}

interface Message {
    message: string;
}

interface ConvertMessage extends Message {
    filename: string,
    images: boolean,
    texts: boolean,
    strokes: boolean,
    separateLayers: boolean
}

interface LogEnableMessage extends Message {
    enable: boolean;
}

interface LogDebugMessage extends Message {
    enable: boolean;
}

browser.runtime.onMessage.addListener((msg, sender) => {
    const message = JSON.parse(msg.text) as (Message);
    if (message.message === 'convert') {
        const convert_message = message as ConvertMessage;
        convert(convert_message.filename, convert_message.strokes, convert_message.images, convert_message.texts, convert_message.separateLayers)
    } else if (message.message === 'full_log') {
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
