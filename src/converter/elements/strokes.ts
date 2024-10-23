import {Stroke, Tool} from "../../xournalpp/stroke";
import {Color, RGBAColor} from "../../xournalpp/utils";
import {COLOR_REGEXP, LOG, PageSize} from "../converter";

const SCALE_X = 0.04;
const SCALE_Y = 0.04;
const STROKE_SCALE = 0.04;

export function convertStrokes(dark_mode: boolean, page_size: PageSize, zoom_level: number): Stroke[] {
    LOG.info("Converting strokes");
    const converted_strokes: Stroke[] = [];
    const strokes = document.getElementsByClassName("InkStrokeOuterElement") as HTMLCollectionOf<SVGElement>;
    LOG.info(`Found ${strokes.length} stroke(s)`);
    const base_color = (dark_mode) ? Color.White : Color.Black;

    for (const stroke of strokes) {
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
            const colors = (pathStroke) ? COLOR_REGEXP.exec(pathStroke) : ["0,0,0", "0", "0", "0"];

            const color = (colors) ? new RGBAColor(Number(colors[1]), Number(colors[2]), Number(colors[3]), Math.round(opacity * 255)) : base_color;

            // OneNote stroke width, rounded to 2 decimal positions, defaults to 1 if not found
            const width = Math.round(Number(path.getAttribute("stroke-width")) * STROKE_SCALE * 100) / 100;


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

                    stroke.coords.push([(x - view_box.x) * SCALE_X + offset_x, (y - view_box.y) * SCALE_Y + offset_y]);
                    i += 2;
                } else if (directive == "l") {
                    let x = parseInt(directives[i + 1]);
                    let y = parseInt(directives[i + 2]);
                    i += 3;

                    // Continue to scan the line value two number at times, if a number is invalid it resets the
                    // index position and continue with normal scan looking for other directives
                    while (!isNaN(x) && !isNaN(y)) {
                        const old_coords = stroke.coords[stroke.coords.length - 1];
                        const next_x = old_coords[0] + (x * SCALE_X);
                        const next_y = old_coords[1] + (y * SCALE_Y);

                        // Inelegant solution to export strokes max_width and max_height by side effect without
                        // scanning multiple times all the strokes
                        page_size.width = Math.max(page_size.width, next_x);
                        page_size.height = Math.max(page_size.height, next_y);

                        stroke.coords.push([next_x, next_y]);
                        x = parseInt(directives[i]);
                        y = parseInt(directives[i + 1]);
                        i += 2;
                    }
                    i -= 3;
                } else if (directive == " " || directive == "") {
                    // Added to avoid false warnings
                } else {
                    // Skips unmanaged directives, warning the user that this value has been unused
                    // so if it was useful it can be reported
                    LOG.debug(`Skipping unrecognised stroke directive: ${directives[i]}`);

                }
            }

        } else {
            LOG.warn(`Invalid stroke detected: missing 'd' in ${path}`);
        }
    }
    return converted_strokes;
}