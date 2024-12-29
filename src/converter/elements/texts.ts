import {COLOR_REGEXP, LOG, Offsets, PageSize} from "../converter";
import {Text} from "../../xournalpp/text";
import {Color, RGBAColor} from "../../xournalpp/utils";


function wrapCharToSpan(data: string): HTMLSpanElement[] {
    const elements = [];
    for (const c of data) {
        const element = document.createElement("span") as HTMLSpanElement;
        element.innerText = c;
        elements.push(element);
    }
    return elements;
}


function splitWrappedText(elements: HTMLSpanElement[], text: string): string[] {
    let prev_index = 0;
    let offsetTop = elements[0].offsetTop;
    let substrings = [];

    for (let index = 0; index < elements.length; index++) {
        if (offsetTop !== elements[index].offsetTop) {
            offsetTop = elements[index].offsetTop;
            substrings.push(text.substring(prev_index, index));
            prev_index = index;
        }
    }
    substrings.push(text.substring(prev_index, elements.length));
    return substrings;
}


function processParagraph(paragraph: HTMLParagraphElement,
                          offsets: Offsets, dark_mode: boolean, page_size: PageSize, zoom_level: number): Text[] {
    const texts = paragraph.getElementsByClassName("TextRun") as HTMLCollectionOf<HTMLSpanElement>;
    const converted_texts: Text[] = [];

    for (const text of texts) {
        if (text.children[0]?.innerHTML) {
            let complete_text = "";
            const original_text = [];
            const wrapped_text = [];
            for (let child of text.children) {
                if (child.classList.contains("SpellingError") || child.classList.contains("NormalTextRun")) {
                    const htmlChild = child as HTMLElement;
                    original_text.push(htmlChild.innerHTML);
                    const chunk = decodeURIComponent(htmlChild.innerText);
                    complete_text = complete_text + chunk;
                    htmlChild.innerHTML = "";
                    const wrapped_characters = wrapCharToSpan(chunk);
                    for (const node of wrapped_characters) {
                        htmlChild.append(node);
                        wrapped_text.push(node);
                    }
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

            const fontSize = ((Number(window.getComputedStyle(text).getPropertyValue("font-size").replace("px", "")) ?? 12));

            const textBoundaries = text.getClientRects();
            const lines = splitWrappedText(wrapped_text, complete_text);

            for (let index = 0; index < textBoundaries.length; index++) {
                const rect = textBoundaries[index];
                const line = lines[index];
                if (line) {
                    const converted_text = new Text();
                    converted_text.size = fontSize;

                    converted_text.data = line;
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

            // Restore the original content
            for (let index = 0; index < text.children.length; index++) {
                text.children[index].innerHTML = original_text[index];
                index += 1;
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
        const backupParagraph = paragraph.innerHTML;
        try {
            const exported_texts = processParagraph(paragraph, offsets, dark_mode, page_size, zoom_level);
            converted_texts.push(exported_texts);
        }catch(e){
            LOG.error(`An error occurred while exporting a text paragraph: ${e}`)
            paragraph.innerHTML = "";
            paragraph.innerHTML = backupParagraph;
        }
    }


    return converted_texts.flat(1);
}