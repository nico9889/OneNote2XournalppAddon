import browser from "webextension-polyfill";
import {Converter} from "./converter/converter";

browser.runtime.onMessage.addListener((msg, sender) => {
    if(msg.text == 'convert_page' && document.documentURI.startsWith("https://onenote.officeapps.live.com")){
        const converter: Converter = Converter.build()
        converter.convert();
        converter.download();
    }
});
