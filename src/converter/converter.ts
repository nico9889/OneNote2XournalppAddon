import {Text} from "../xournalpp/text";
import {Image} from "../xournalpp/image";
import {Stroke, Tool} from "../xournalpp/stroke";
import {Background, BackgroundType, Layer, Page} from "../xournalpp/page";
import {Document} from "../xournalpp/document";
import {Color, RGBAColor} from "../xournalpp/utils";
import {Log} from "../log/log";
import {TexImage} from "../xournalpp/teximage";
import {MathMLToLaTeX} from 'mathml-to-latex';

import { mathjax } from 'mathjax-full/mjs/mathjax.js'
import { MathML} from 'mathjax-full/mjs/input/mathml.js'
import { SVG } from 'mathjax-full/mjs/output/svg.js'
import { browserAdaptor } from 'mathjax-full/mjs/adaptors/browserAdaptor.js'
import { RegisterHTMLHandler } from 'mathjax-full/mjs/handlers/html.js'


const image_base64_strip = new RegExp("data:image/.*;base64,");
const unsafe_xml_space = new RegExp(String.fromCharCode(160));


export class Converter {
    private log: Log;
    adaptor = browserAdaptor();
    // Stroke need to be scaled to this size
    scaleX: number = 0.04;
    scaleY: number = 0.04;
    strokeScale: number = 0.04;

    // Stroke color need to be parsed
    color_regexp: RegExp = new RegExp("rgb\\(([0-9]{1,3}),([0-9]{1,3}),([0-9]{1,3})\\)");

    // This is not really necessary
    static instance: Converter;

    // Exported file
    title: string | undefined;
    pom: HTMLAnchorElement | undefined;

    private constructor(log: Log) {
        this.log = log;
        RegisterHTMLHandler(this.adaptor);
    }

    static build(log: Log): Converter {
        if (!this.instance) {
            this.instance = new Converter(log);
        }
        return this.instance;
    }

    convertStrokes(dark_mode: boolean, additional?: { max_width: number, max_height: number }): Stroke[] {
        this.log.info("Converting strokes");
        const converted_strokes: Stroke[] = [];
        const strokes = document.getElementsByClassName("InkStrokeOuterElement") as HTMLCollectionOf<SVGElement>;
        this.log.info(`Found ${strokes.length} stroke(s)`);
        const base_color = (dark_mode) ? Color.White : Color.Black;

        for (const stroke of strokes) {
            const strokeBoundaries = stroke.getBoundingClientRect();

            // Inelegant solution to export strokes max_width and max_height by side effect without
            // scanning multiple times all the strokes
            if (additional) {
                additional.max_width = Math.max(additional.max_width, strokeBoundaries.x + strokeBoundaries.width);
                additional.max_height = Math.max(additional.max_height, strokeBoundaries.y + strokeBoundaries.height);
            }

            // SVG ViewBox, shifts the stroke into a specific direction
            const view_box_string = stroke.getAttribute("viewBox");
            const view_box_values = view_box_string?.split(" ");
            const view_box = {
                x: (view_box_values) ? Number(view_box_values[0]) || 0 : 0,
                y: (view_box_values) ? Number(view_box_values[1]) || 0 : 0,
                width: (view_box_values) ? Number(view_box_values[2]) || 0 : 0,
                height: (view_box_values) ? Number(view_box_values[3]) || 0 : 0,
            }

            // Every stroke for some reason is shifted three times: one external, by SVG style and viewbox property,
            // and one internal, by a large movement in the path ("M n n") in the opposite direction
            // We need this offset to normalize the strokes and placing the start point in the exact position
            const offset_x = Number(stroke.style.left.replace("px", "")) || 0;
            const offset_y = Number(stroke.style.top.replace("px", "")) || 0;

            const path: SVGPathElement = stroke.children[0] as SVGPathElement;
            const directives = path.getAttribute("d")?.split(" ");
            if (directives) {
                let stroke = new Stroke();
                const pathStroke = path.getAttribute("stroke");

                // OneNote stroke opacity, defaults to 1 (max) if not found
                const opacity = Number(path.getAttribute("opacity")) || 1;

                // OneNote stroke colors, defaults to black if not found
                const colors = (pathStroke) ? this.color_regexp.exec(pathStroke) : ["0,0,0", "0", "0", "0"];

                const color = (colors) ? new RGBAColor(Number(colors[1]), Number(colors[2]), Number(colors[3]), Math.round(opacity * 255)) : base_color;

                // OneNote stroke width, rounded to 2 decimal positions, defaults to 1 if not found
                const width = Math.round(Number(path.getAttribute("stroke-width")) * this.strokeScale * 100) / 100 ?? 1;


                for (let i = 0; i < directives.length; i++) {
                    const directive = directives[i];
                    // Xournal strokes representation doesn't permit empty spaces/skips, so we need to split the SVG Path into
                    // multiple strokes in case of movements
                    if (directive === "M") {
                        stroke = new Stroke();
                        stroke.width = width;
                        stroke.color = color;

                        // If the opacity is < 1, we suppose that the stroke is made with highlighter since there's seems to be
                        // no other notation to distinguish a highlighter by a pen
                        if (opacity < 1) {
                            stroke.tool = Tool.Highlighter;
                        }
                        converted_strokes.push(stroke);
                        const x = Number(directives[i + 1]);
                        const y = Number(directives[i + 2]);


                        stroke.coords.push([(x - view_box.x) * this.scaleX + offset_x, (y - view_box.y) * this.scaleY + offset_y]);
                        i += 2;
                    } else if (directive == "l") {
                        let x = parseInt(directives[i + 1]);
                        let y = parseInt(directives[i + 2]);
                        i += 3;

                        // Continue to scan the line value two number at times, if a number is invalid it resets the
                        // index position and continue with normal scan looking for other directives
                        while (!isNaN(x) && !isNaN(y)) {
                            const old_coords = stroke.coords[stroke.coords.length - 1];
                            const next_x = old_coords[0] + (x * this.scaleX);
                            const next_y = old_coords[1] + (y * this.scaleY);
                            stroke.coords.push([next_x, next_y]);
                            x = parseInt(directives[i]);
                            y = parseInt(directives[i + 1]);
                            i += 2;
                        }
                        i -= 3;
                    } else {
                        // Skips unmanaged directives, warning the user that this value has been unused
                        // so if it was useful it can be reported
                        this.log.debug(`Skipping unrecognised stroke directive: ${directives[i]}`);
                    }
                }
            } else {
                this.log.warn(`Invalid stroke detected: missing 'd' in ${path}`);
            }
        }
        return converted_strokes;
    }

    #sanitize(text: string): string {
        return text.replace(/[^a-zA-Z0-9 ]+/, '') || "OneNote";
    }

    convertTexts(offset_x: number, offset_y: number, dark_mode: boolean, additional?: {
        max_width: number,
        max_height: number
    }): Text[] {
        this.log.info("Converting texts");
        const texts = document.getElementsByClassName("TextRun") as HTMLCollectionOf<HTMLSpanElement>;
        const converted_texts: Text[] = [];
        this.log.info(`Found ${texts.length} text(s)`);
        for (const text of texts) {
            if (text.children[0]?.innerHTML) {
                const textBoundaries = text.getBoundingClientRect();

                const converted_text = new Text();

                converted_text.data = text.children[0].innerHTML;
                converted_text.size = Number(text.style.fontSize.replace("pt", "")) ?? 12;
                if (dark_mode) {
                    // converted_text.color; TODO: not handled
                } else {
                    // converted_text.color; TODO: not handled
                }

                converted_text.x = textBoundaries.x - offset_x;
                converted_text.y = textBoundaries.y - offset_y;
                converted_text.width = textBoundaries.width;


                converted_texts.push(converted_text);

                // Inelegant solution to export texts max_width and max_height by side effect without
                // scanning multiple times all the texts
                if (additional) {
                    additional.max_width = Math.max(additional.max_width, converted_text.x + textBoundaries.width);
                    additional.max_height = Math.max(additional.max_height, converted_text.y + textBoundaries.height);
                }

            }
        }
        return converted_texts;
    }

    convertImages(offset_x: number, offset_y: number, additional?: { max_width: number, max_height: number }): Image[] {
        this.log.info("Converting images");
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        const converted_images: Image[] = [];
        const image_containers = document.getElementsByClassName("WACImageContainer") as HTMLCollectionOf<HTMLDivElement>;
        this.log.info(`Found ${image_containers.length} image(s)`);
        for (const container of image_containers) {
            // OneNote uses (at least?) two type of positioning method for the images:
            // Absolute: coordinates are inside the WACImageContainer style;
            // Relative: the image is shifted by an offset from the main WACViewPanel.
            // We try first with the absolute position, if it's not found we try to calculate the relative position,
            // converting it to an (hopefully correct) absolute one
            const x: number = Number(container.style.left.replace("px", "")) || 0;
            const y: number = Number(container.style.top.replace("px", "")) || 0;
            const image: HTMLImageElement = (container.getElementsByClassName("WACImage") as HTMLCollectionOf<HTMLImageElement>)[0];
            const image_boundaries = image.getBoundingClientRect();

            /* Converting non-PNG image to PNG using Canvas */
            let src = image.src;
            const isPng = new RegExp("data:image/png;base64,.*");
            if (ctx && !isPng.test(src)) {
                canvas.width = image.width;
                canvas.height = image.height;
                ctx.drawImage(image, 0, 0, image.width, image.height);
                src = canvas.toDataURL("image/png", 0.8);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }

            const data = src.replace(image_base64_strip, "");

            const converted_image = new Image(data, x || (image_boundaries.x - offset_x), y || (image_boundaries.y - offset_y), image.width, image.height);
            converted_images.push(converted_image);

            // Inelegant solution to export images max_width and max_height by side effect without
            // scanning multiple times all the images
            if (additional) {
                additional.max_width = Math.max(additional.max_width, converted_image.right);
                additional.max_height = Math.max(additional.max_height, image_boundaries.bottom);
            }

        }
        return converted_images
    }

    private async convertMathMLBlocks(offset_x: number, offset_y: number, math_dark_mode: boolean, additional?: {
        max_width: number;
        max_height: number
    }) {
        this.log.info("Converting MathML blocks");
        const converted_blocks: TexImage[] = [] // Empty output array

        // Getting math blocks from OneNote page
        const math_containers = document.getElementsByClassName("MathSpan") as HTMLCollectionOf<HTMLSpanElement>;
        this.log.info(`Found ${math_containers.length} MathML block(s)`);

        // Preparing canvas for image conversion
        const canvas = document.createElement("canvas") as HTMLCanvasElement;
        const ctx = canvas.getContext("2d")!;
        for (const container of math_containers) {
            const math_element = container.children[0] as MathMLElement;
            const boundingRect = math_element.getBoundingClientRect();
            const latex = MathMLToLaTeX.convert(math_element.outerHTML);

            try {
                const mathDocument = mathjax.document('', {
                    InputJax: new MathML(),
                    OutputJax: new SVG({
                        mathmlSpacing: true
                    })
                });

                const node = mathDocument.convert(container.innerHTML);

                const blob = new Blob([this.adaptor.innerHTML(node)], {type: "image/svg+xml;charset=utf-8"});

                const url = URL.createObjectURL(blob);

                // Converting to SVG to Base64 to load it as an Image
                const img = new window.Image();
                await new Promise((resolve, reject) => {
                    img.onload = () => {
                        resolve(img)
                    };
                    img.onerror = (e) => {
                        reject(e)
                    }
                    img.src = url;
                });


                // Drawing the image into a Canvas, dimensions are multiplied by 4 to get a crispier text
                ctx.drawImage(img, 0, 0, boundingRect.width * 4, boundingRect.height * 4);

                // Exporting the Canvas as an encoded Base64 PNG string

                const uri = canvas.toDataURL("image/png", 1);

                // Creating a new TexImage with dimensions and data, this object handles
                // the XML conversion
                const tex_image = new TexImage(
                    latex,
                    uri.replace(image_base64_strip, ""),
                    boundingRect.x - offset_x,
                    boundingRect.y - offset_y,
                    boundingRect.width,
                    boundingRect.height,
                )
                // Pushing the TexImage into the output array
                converted_blocks.push(tex_image);
            } catch (e) {
                console.debug("Error converting to SVG", e);
            }

            if (additional) {
                additional.max_width = Math.max(additional.max_width, boundingRect.x + canvas.width);
                additional.max_height = Math.max(additional.max_height, boundingRect.y + canvas.height);
            }
        }

        return converted_blocks;
    }

    private getTitle(): string {
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

    async convert(strokes: boolean, images: boolean, texts: boolean, maths: boolean, separateLayers: boolean, dark_page: boolean, strokes_dark_mode: boolean, texts_dark_mode: boolean, math_dark_mode: boolean, title?: string) {
        this.log.info("Conversion started");
        this.log.info(`Options:\n\tstrokes: ${strokes}\n\timages: ${images}\n\ttexts: ${texts}\n\tmaths: ${maths}`);
        // Page dimensions
        const dimension = {
            max_width: 0,
            max_height: 0
        }

        if (!title) {
            try {
                title = this.getTitle();
            } catch (e) {
                console.error(`O2X: ${e}`);
            }
            if (!title) title = document.title;
        }
        this.title = title;

        const panel = document.getElementById("WACViewPanel");
        if (!panel) {
            this.log.error("Conversion failed: cannot find WACViewPanel");
            return;
        }
        const panel_boundaries = panel.getBoundingClientRect();

        const converted_texts: Text[] = (texts) ? this.convertTexts(panel_boundaries.x, panel_boundaries.y, texts_dark_mode, dimension) : [];
        const converted_images: Image[] = (images) ? this.convertImages(panel_boundaries.x, panel_boundaries.y, dimension) : [];
        const converted_strokes: Stroke[] = (strokes) ? this.convertStrokes(strokes_dark_mode, dimension) : [];
        const converted_math_blocks: TexImage[] = (maths) ? (await this.convertMathMLBlocks(panel_boundaries.x, panel_boundaries.y, math_dark_mode, dimension)) : [];


        this.log.info("Creating new XOPP file");
        const exportDoc = new Document(title);

        this.log.info("Creating new page");
        const page_color = (dark_page) ? Color.Black : Color.White;
        const page = new Page(new Background(BackgroundType.Solid, page_color));
        page.height = dimension.max_height + 5;
        page.width = dimension.max_width + 5;

        if (separateLayers) {
            // To simplify the edit of the exported document different layers are used for different elements
            this.log.info("Creating images layer");
            const images_layer = new Layer();
            this.log.info("Adding images");
            images_layer.images = converted_images;

            this.log.info("Creating maths layer");
            const maths_layer = new Layer();
            this.log.info("Adding maths");
            maths_layer.maths = converted_math_blocks;

            this.log.info("Creating texts layer");
            const texts_layer = new Layer();
            this.log.info("Adding texts");
            texts_layer.texts = converted_texts;

            this.log.info("Creating strokes layer");
            const strokes_layer = new Layer();
            this.log.info("Adding strokes")
            strokes_layer.strokes = converted_strokes;

            this.log.info("Adding layers to the page");
            page.layers.push(images_layer);
            page.layers.push(maths_layer);
            page.layers.push(texts_layer);
            page.layers.push(strokes_layer);

        } else {
            this.log.info("Creating new common layer");
            const layer = new Layer();
            this.log.info("Adding elements to the layer");
            layer.images = converted_images;
            layer.texts = converted_texts;
            layer.strokes = converted_strokes;

            this.log.info("Adding layer to the page");
            page.layers.push(layer);
        }

        this.log.info("Adding page to the document");
        exportDoc.pages.push(page);

        this.log.info("Generating output file (GZipping)");

        // Xournal++ file format is a GZIP archive with an XML file inside. We need to GZIP the XML before
        // exporting it
        const data = new Blob([exportDoc.toXml()], {type: "application/xml"});
        const compressedStream = data.stream().pipeThrough(
            new CompressionStream("gzip")
        );

        const response = new Response(compressedStream);

        // The GZIP file is associated to a phantom Anchor element to be exported
        this.log.info("Exporting file");
        const blob = await response.blob();
        this.pom = document.createElement("a");
        this.pom.setAttribute('href', URL.createObjectURL(blob));
        this.log.success("File exported successfully");
    }

    download() {
        let title = "OneNote";
        if (!this.title) {
            const titles = document.getElementsByClassName("Title GrowUnderline");
            if (titles) {
                const spans = titles[0].getElementsByTagName("span");
                const titleSpan = spans[0];
                title = titleSpan.textContent ?? "OneNote";
            }
        } else {
            title = this.title;
        }

        if (!this.pom) {
            this.log.error("No file converted. Cannot download.");
            return;
        }

        this.pom.setAttribute('download', `${this.#sanitize(title)}.xopp`);
        this.pom?.click();
    }
}
