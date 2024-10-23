import {Text} from "../xournalpp/text";
import {Image} from "../xournalpp/image";
import {Stroke} from "../xournalpp/stroke";
import {Background, BackgroundType, Layer, Page} from "../xournalpp/page";
import {Document} from "../xournalpp/document";
import {Color} from "../xournalpp/utils";
import {Log} from "../log/log";
import {TexImage} from "../xournalpp/teximage";
import {ConvertMessage} from "../messages/convert";
import {convertTexts} from "./elements/texts";
import {convertStrokes} from "./elements/strokes";
import {convertImages} from "./elements/images";
import {convertMathMLBlocks} from "./elements/math";


export const COLOR_REGEXP = new RegExp("rgb\\(([0-9]{1,3}),([0-9]{1,3}),([0-9]{1,3})\\)");

// TODO: replace with something better
export const LOG = new Log();

export interface PageSize {
    width: number,
    height: number
}

export interface Offsets {
    x: number,
    y: number
}

export interface DownloadableDocument {
    title: string,
    pom: HTMLAnchorElement,
}


/* Tries to read the notebook name, otherwise it returns the title of the current browser page */
function getTitle() {
    const pages = document.getElementById("OreoPageColumn") as HTMLDivElement | null;
    if (!pages) {
        return document.title;
    }
    const page = pages?.querySelector("div.active[title]") as HTMLDivElement | null;
    if (!page) {
        return document.title;
    }
    return page.innerText;
}

function getZoomLevel() {
    const origin = document.getElementsByClassName("PageContentOrigin")[0];
    if (!origin) {
        return 1.0;
    }
    const style = origin.getAttribute("style");
    if (!style) {
        return 1.0;
    }
    const matches = style.match("scale\\(([0-9]+\\.?[0-9]*)\\)");
    if (!matches) {
        return 1.0;
    }
    return Number.parseFloat(matches[1] ?? "1.0");
}

export async function convertNote(message: ConvertMessage): Promise<DownloadableDocument> {
    let title = message.filename;
    const strokes = message.strokes;
    const texts = message.texts;
    const images = message.images;
    const maths = message.maths;
    const separateLayers = message.separateLayers;
    const dark_page = message.dark_page;
    const strokes_dark_mode = message.strokes_dark_mode;
    const texts_dark_mode = message.texts_dark_mode;
    const math_dark_mode = message.math_dark_mode;
    const math_quality = message.math_quality;


    LOG.info("Conversion started");
    LOG.info(`Options:\n\tstrokes: ${strokes}\n\timages: ${images}\n\ttexts: ${texts}\n\tmaths: ${maths}`);

    // Page dimensions
    const page_size: PageSize = {
        width: 0,
        height: 0
    }

    if (!title) {
        try {
            title = getTitle();
        } catch (e) {
            console.error(`O2X: ${e}`);
        }
        if (!title) title = document.title;
    }

    /* Tries to retrieve the OneNote document container */
    const panel = document.getElementById("WACViewPanel");
    if (!panel) {
        LOG.error("Conversion failed: cannot find WACViewPanel");
        return new Promise((_, reject) => {
            reject();
        });
    }
    const panel_boundaries = panel.getBoundingClientRect();
    const offsets = {
        x: panel_boundaries.x - panel.scrollLeft,
        y: panel_boundaries.y - panel.scrollTop
    }

    const zoom_level = getZoomLevel();

    const converted_texts: Text[] = (texts) ? convertTexts(offsets, texts_dark_mode, page_size, zoom_level) : [];
    const converted_images: Image[] = (images) ? convertImages(offsets, page_size, zoom_level) : [];
    const converted_strokes: Stroke[] = (strokes) ? convertStrokes(strokes_dark_mode, page_size, zoom_level) : [];
    const converted_math_blocks: TexImage[] = (maths) ? (await convertMathMLBlocks(offsets, math_dark_mode, math_quality, page_size, zoom_level)) : [];

    // Creates a new Xournal++ document
    LOG.info("Creating new XOPP file");
    const exportDoc = new Document(title);


    // Creates a new Xournal++ page
    LOG.info("Creating new page");
    const page_color = (dark_page) ? Color.Black : Color.White;

    // Creates a new Xournal++ page
    const page = new Page(new Background(BackgroundType.Solid, page_color));

    // Sets the page size to the farthest point of the farthest object, plus some offset for margin
    page.width = page_size.width + 5;
    page.height = page_size.height + 5;

    if (separateLayers) {
        // To simplify the editing of the exported document different layers are used for different elements
        LOG.info("Creating images layer");
        page.layers.push(new Layer());
        LOG.info("Adding images");
        page.layers.at(-1)!.images = converted_images;

        LOG.info("Creating maths layer");
        page.layers.push(new Layer());
        LOG.info("Adding maths");
        page.layers.at(-1)!.maths = converted_math_blocks;

        LOG.info("Creating texts layer");
        page.layers.push(new Layer());
        LOG.info("Adding texts");
        page.layers.at(-1)!.texts = converted_texts;

        LOG.info("Creating strokes layer");
        page.layers.push(new Layer());
        LOG.info("Adding strokes")
        page.layers.at(-1)!.strokes = converted_strokes;
    } else {
        LOG.info("Creating new common layer");
        const layer = new Layer();
        LOG.info("Adding elements to the layer");
        layer.images = converted_images;
        layer.maths = converted_math_blocks;
        layer.texts = converted_texts;
        layer.strokes = converted_strokes;

        LOG.info("Adding layer to the page");
        page.layers.push(layer);
    }

    LOG.info("Adding page to the document");
    exportDoc.pages.push(page);

    LOG.info("Generating output file (GZipping)");

    // Xournal++ file format is a GZIP archive with an XML file inside. We need to GZIP the XML before
    // exporting it
    const data = new Blob([exportDoc.toXml()], {type: "application/xml"});

    // Using browser built-in compression API to generate the GZipped file
    const compressedStream = data.stream().pipeThrough(
        new CompressionStream("gzip")
    );

    const response = new Response(compressedStream);

    // The GZIP file is associated to a phantom Anchor element to be exported
    LOG.info("Exporting file");
    const blob = await response.blob();
    const pom = document.createElement("a");
    pom.setAttribute('href', URL.createObjectURL(blob));
    LOG.success("File exported successfully");
    return new Promise((resolve) => resolve({
        title,
        pom
    }));
}

function sanitizeFileName(text: string) {
    return text.replace(/[^a-zA-Z0-9 ]+/, '') || "OneNote";
}

export function downloadDocument(document: DownloadableDocument) {
    if (!document.pom) {
        LOG.error("No file converted. Cannot download.");
        return;
    }
    document.pom.setAttribute('download', `${sanitizeFileName(document.title)}.xopp`);
    document.pom.click();
}
