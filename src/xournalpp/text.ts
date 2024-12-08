import {Color, RGBAColor} from "./utils";

export function escapeXml(data: string) {
    return data.replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

export function wrapText(data: string, fontSize: number, width: number): string {
    let out = "";
    let space = 0;
    for(let i=0;i<data.length;i++){
        out+= data[i];
        space += fontSize;
        if(space > width * 1.8){
            space = 0;
            out += "\n";
        }
    }
    return out;
}

export class Text {
    constructor(
        readonly data: string = "",
        readonly font: string = "Courier New",
        readonly size: number = 12,
        readonly x: number = 0,
        readonly y: number = 0,
        public color: RGBAColor | Color = new RGBAColor(0, 0, 0),
        readonly ts: number = 0,
        readonly fn: string = "",
        readonly width: number = 0
    ) {
        if (color instanceof RGBAColor) {
            this.color = color;
        } else {
            this.color = RGBAColor.fromColor(color);
        }
        this.data = data;
        this.width = width;
        this.size = size;
    }


    toXml() {
        const out = escapeXml(wrapText(this.data, this.size, this.width));
        return `<text font="${this.font}" size="${this.size.toFixed(0)}" x="${this.x.toFixed(4)}" y="${this.y.toFixed(4)}" color="${this.color.toString()}">${out}</text> `
    }
}
