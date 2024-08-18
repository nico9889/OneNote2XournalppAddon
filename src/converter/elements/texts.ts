import {COLOR_REGEXP, LOG, Offsets, PageSize} from "../converter";
import {Text} from "../../xournalpp/text";
import {Color, RGBAColor} from "../../xournalpp/utils";



export function convertTexts(offsets: Offsets, dark_mode: boolean, page_size: PageSize){
    LOG.info("Converting texts");
    const texts = document.getElementsByClassName("TextRun") as HTMLCollectionOf<HTMLSpanElement>;
    const converted_texts: Text[] = [];
    LOG.info(`Found ${texts.length} text(s)`);

    for (const text of texts) {
        if (text.children[0]?.innerHTML) {
            const textBoundaries = text.getBoundingClientRect();

            const converted_text = new Text();

            let complete_text = "";
            for(let child of text.children){
                if(child.classList.contains("SpellingError") || child.classList.contains("NormalTextRun")){
                    complete_text = complete_text+decodeURIComponent((child as HTMLElement).innerText);
                }
            }
            converted_text.data = complete_text;
            converted_text.size = Number(text.style.fontSize.replace("pt", "")) ?? 12;
            const textColor = window.getComputedStyle(text).getPropertyValue("color");

            let [_, r,g,b] = ["", "0", "0", "0"];
            try{
                [_, r,g,b] = textColor.match(COLOR_REGEXP)!;
            }catch(e){
                console.debug(`O2X: error while matching color from ${textColor}`, e);
            }

            if (dark_mode && r === "0" && g === "0" && b === "0") {
                converted_text.color = RGBAColor.fromColor(Color.White);
            } else {
                const rgba = textColor.match(/.{1,2}/g);
                if(rgba)
                    converted_text.color = new RGBAColor(Number(r), Number(g), Number(b));
            }

            converted_text.x = textBoundaries.x - offsets.x;
            converted_text.y = textBoundaries.y - offsets.y;
            converted_text.width = textBoundaries.width;


            converted_texts.push(converted_text);

            // Inelegant solution to export texts max_width and max_height by side effect without
            // scanning multiple times all the texts
            if (page_size) {
                page_size.width = Math.max(page_size.width, converted_text.x + textBoundaries.width);
                page_size.height = Math.max(page_size.height, converted_text.y + textBoundaries.height);
            }

        }
    }
    return converted_texts;
}