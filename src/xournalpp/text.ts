import {Color, RGBAColor} from "./utils";

export function escapeXml(data: string) {
    return data.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

const fonts = new Map<string, [string, string]>();

// onenote.toLowerCase(): [firefox, chrome]
fonts.set("calibri", ["Noto Sans", "Arial"]);
fonts.set("comic sans ms", ["Comic Sans MS", "Comic Sans MS"]);
fonts.set("segoe ui light", ["Noto Sans", "Noto Sans Symbols2"]);

export function getXournalFont(font: string, isFirefox: boolean): string {
    const trimmedName = font.replace(/"/g,"").trim().toLowerCase();
    const fontClass = fonts.get(trimmedName) ?? ["Noto Sans", "Arial"];
    return fontClass[Number(!isFirefox)];
}


export class Text {
    constructor(
        public data: string = "",
        public font: string = "Noto Sans",
        public size: number = 12,
        public x: number = 0,
        public y: number = 0,
        public color: RGBAColor | Color = new RGBAColor(0, 0, 0),
        public ts: number = 0,
        public fn: string = "",
    ) {
        if (color instanceof RGBAColor) {
            this.color = color;
        } else {
            this.color = RGBAColor.fromColor(color);
        }
        this.data = data;
        this.size = size;
    }


    toXml() {
        const out = escapeXml(this.data);
        return `<text font="${this.font}" size="${this.size.toFixed(3)}" x="${this.x.toFixed(4)}" y="${this.y.toFixed(4)}" color="${this.color.toString()}">${out}</text> `
    }
}
