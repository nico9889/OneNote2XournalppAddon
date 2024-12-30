import {COLOR_REGEXP, LOG, Offsets, PageSize} from "../converter";
import {Text} from "../../xournalpp/text";
import {Color, RGBAColor} from "../../xournalpp/utils";


// Original idea: https://www.youtube.com/watch?v=kuGA8a_W4s4
function splitWrappedText(text: HTMLElement): string[] {
    const range = document.createRange();
    let lastIndex = 0;
    const lines: string[] = [];
    const textContent = text.textContent || "";
    for (let i = 0; i < textContent.length; i++) {
        range.setStart(text, lastIndex);
        range.setEnd(text, i + 1);
        if (range.getClientRects().length > 1) {
            lines.push(textContent.substring(lastIndex, i));
            lastIndex = i;
        }
    }
    if (lastIndex != textContent.length) {
        lines.push(textContent.substring(lastIndex, textContent.length));
    }
    return lines;
}


function processParagraph(paragraph: HTMLParagraphElement,
                          offsets: Offsets, dark_mode: boolean, page_size: PageSize, zoom_level: number): Text[] {
    const texts = paragraph.getElementsByClassName("TextRun") as HTMLCollectionOf<HTMLSpanElement>;
    const converted_texts: Text[] = [];

    for (const text of texts) {
        if (text.children[0]?.innerHTML) {
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

            const fontFamily = getComputedStyle(text).getPropertyValue("font-family");

            // TODO: add the possibility to override export font
            const font = fontFamily.split(",")[1] ?? "Calibri";

            const fontSize = ((Number(window.getComputedStyle(text).getPropertyValue("font-size").replace("px", "")) ?? 12));

            for (let child of text.children) {
                if (child.classList.contains("SpellingError") || child.classList.contains("NormalTextRun")) {
                    // const htmlChild = child as HTMLElement;
                    const nodeTextChild = child.firstChild as HTMLElement;
                    const lines = splitWrappedText(nodeTextChild);

                    const textBoundaries = child.getClientRects();
                    for (let index = 0; index < lines.length; index++) {
                        const line = lines[index];
                        const rect = textBoundaries[index];

                        const converted_text = new Text();
                        converted_text.size = fontSize;
                        converted_text.data = line;
                        if (color)
                            converted_text.color = color;
                        converted_text.font = font;
                        converted_text.x = (rect.x - offsets.x) / zoom_level;
                        converted_text.y = (rect.y - offsets.y) / zoom_level;

                        converted_texts.push(converted_text);

                        const text_width = rect.width / zoom_level;
                        // Inelegant solution to export texts max_width and max_height by side effect without
                        // scanning multiple times all the texts
                        page_size.width = Math.max(page_size.width, converted_text.x + text_width);
                        page_size.height = Math.max(page_size.height, converted_text.y + (rect.height / zoom_level));
                    }

                }
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
        try {
            const exported_texts = processParagraph(paragraph, offsets, dark_mode, page_size, zoom_level);
            converted_texts.push(exported_texts);
        } catch (e) {
            LOG.error(`An error occurred while exporting a text paragraph: ${e}`)
        }
    }

    return converted_texts.flat(1);
}