import browser from "webextension-polyfill";
import {Converter} from "./converter/converter";

function convert(filename: string, strokes: boolean, images: boolean, texts: boolean, separateLayers: boolean){
    const converter: Converter = Converter.build()
    converter.convert(strokes, images, texts, separateLayers);
    converter.download(filename);
}

interface ConvertMessage{
    message: string,
    filename: string,
    images: boolean,
    texts: boolean,
    strokes: boolean,
    separateLayers: boolean
}

browser.runtime.onMessage.addListener((msg, sender) => {
    const data = JSON.parse(msg.text) as (ConvertMessage);
    if(data.message == 'convert'){
        convert(data.filename, data.strokes, data.images, data.texts,  data.separateLayers)
    }
});
