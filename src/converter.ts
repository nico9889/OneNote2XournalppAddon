import browser from "webextension-polyfill";
import {Converter} from "./converter/converter";

export function convert(){
    if(document.documentURI.startsWith("https://onenote.officeapps.live.com")){
        const converter: Converter = Converter.build()
        converter.convert();
        converter.download();
    }
}

browser.runtime.onMessage.addListener((msg, sender) => {
    if(msg.text == 'convert_page'){
        convert();
    }
});
