import {Element} from "./utils";

export class Image extends Element {
    public right: number;
    public bottom: number;

    constructor(document: XMLDocument, data: string, x: number, y: number, width: number, height: number, element_name: "image" | "teximage" = "image") {
        super(document, element_name);
        this.right = x + width;
        this.bottom = y + height;
        this.element.setAttribute("left", x.toFixed(4));
        this.element.setAttribute("right", this.right.toFixed(4));
        this.element.setAttribute("top", y.toFixed(4));
        this.element.setAttribute("bottom", this.bottom.toFixed(4));
        this.element.textContent = data;
    }
}