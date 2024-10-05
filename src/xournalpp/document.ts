import {Page} from "./page";
import {escapeXml} from "./text";

export class Document {
    title: string;
    pages: Page[];

    constructor(title: string = "") {
        this.title = title;
        this.pages = [];
    }

    toXml(): string{
        let out = `<?xml version="1.0" standalone="no"?>\n
        <xournal creator="OneNote2Xournal++ Extension" fileversion="4">\n
        <title>${escapeXml(this.title)}</title>\n
        <preview></preview>`
        for(const page of this.pages){
            out += page.toXml();
        }
        out += "</xournal>"
        return out;
    }
}
