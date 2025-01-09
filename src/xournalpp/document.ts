import {BackgroundStyle, BackgroundType, Page} from "./page";
import {Color, RGBAColor} from "./utils";

export class Document {
    readonly title: string;
    readonly document: XMLDocument;

    constructor(title: string = "") {
        this.document = document.implementation.createDocument(null, "xournal");
        const instructions = this.document.createProcessingInstruction("xml", "version=\"1.0\" standalone=\"no\"");
        this.document.insertBefore(instructions, this.document.firstChild);
        this.document.children[0]!.setAttribute("creator", "OneNote2Xournal++ Extension");
        this.document.children[0]!.setAttribute("fileversion", "4");
        this.title = title;
    }

    addPage(backgroundType: BackgroundType | undefined, color: Color | RGBAColor = Color.White, style: BackgroundStyle = BackgroundStyle.Graph) {
        const page = new Page(this.document, backgroundType, color, style);
        this.document.children[0]!.appendChild(page.element);
        return page;
    }
}

