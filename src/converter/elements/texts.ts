import {COLOR_REGEXP, LOG, Offsets, PageSize} from "../converter";
import {Text} from "../../xournalpp/text";
import {Color, RGBAColor} from "../../xournalpp/utils";


export function reduceToFillRect(data: string, fontSize: number, width: number): [string, string] {
    fontSize /= 1.7;
    let split = 0;
    let space = 0;
    const chunks = data.split(" ");
    let index = 0;
    let fit = true;
    while (index < chunks.length && fit) {
        const chunk = chunks[index];
        // the last sum keeps in consideration that every word is separated by a space, except the last one
        const length = chunk.length + Number(index != chunks.length - 1);
        fit = ((space + ((length - 1) * fontSize)) < width);
        if (fit) {
            split += length;
            space += length * fontSize;
            index += 1;
        }
    }
    if (split >= data.length) {
        return [data, ""];
    }
    return [data.substring(0, split), data.substring(split, data.length)];
}


function processParagraph(paragraph: HTMLParagraphElement,
                          offsets: Offsets, dark_mode: boolean, page_size: PageSize, zoom_level: number): Text[] {
    const texts = paragraph.getElementsByClassName("TextRun") as HTMLCollectionOf<HTMLSpanElement>;
    const converted_texts: Text[] = [];

    for (const text of texts) {
        if (text.children[0]?.innerHTML) {
            let complete_text = "";
            for (let child of text.children) {
                if (child.classList.contains("SpellingError") || child.classList.contains("NormalTextRun")) {
                    complete_text = complete_text + decodeURIComponent((child as HTMLElement).innerText);
                }
            }

            const textColor = window.getComputedStyle(text).getPropertyValue("color");

            let [_, r, g, b] = ["", "0", "0", "0"];
            try {
                [_, r, g, b] = textColor.match(COLOR_REGEXP) || ["", "0", "0", "0"];
            } catch (e) {
                console.debug(`O2X: error while matching color from ${textColor}`, e);
            }

            let color;

            if (dark_mode && r === "0" && g === "0" && b === "0") {
                color = RGBAColor.fromColor(Color.White);
            } else {
                const rgba = textColor.match(/.{1,2}/g);
                if (rgba)
                    color = new RGBAColor(Number(r), Number(g), Number(b));
            }

            const fontSize = (Number(window.getComputedStyle(text).getPropertyValue("font-size").replace("px", "")) ?? 16) * 0.75;

            let remaining = complete_text;
            const textBoundaries = text.getClientRects();
            for (const rect of textBoundaries) {
                const converted_text = new Text();
                [converted_text.data, remaining] = reduceToFillRect(remaining, fontSize, rect.width);
                converted_text.size = fontSize;
                if (color)
                    converted_text.color = color;

                converted_text.x = (rect.x - offsets.x) / zoom_level;
                converted_text.y = (rect.y - offsets.y) / zoom_level;

                // FIXME: zoom_level * 0.8 resulted out from trial&error, it may be wrong...
                converted_text.width = (rect.width) / (zoom_level * 0.8);

                converted_texts.push(converted_text);

                // Inelegant solution to export texts max_width and max_height by side effect without
                // scanning multiple times all the texts
                page_size.width = Math.max(page_size.width, converted_text.x + converted_text.width);
                page_size.height = Math.max(page_size.height, converted_text.y + (rect.height / zoom_level));
            }
        }
    }
    return converted_texts;
}


export function convertTexts(offsets: Offsets, dark_mode: boolean, page_size: PageSize, zoom_level: number): Text[] {
    LOG.info("Converting texts");
    const converted_texts: Text[][] = [];

    const paragraphs = document.getElementsByClassName("Paragraph") as HTMLCollectionOf<HTMLParagraphElement>;
    for (const paragraph of paragraphs) {
        const exported_texts = processParagraph(paragraph, offsets, dark_mode, page_size, zoom_level);
        converted_texts.push(exported_texts);
    }


    return converted_texts.flat(1);
}