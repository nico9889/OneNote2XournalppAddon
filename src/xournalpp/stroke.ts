import {Color, RGBAColor} from "./utils";

export enum Tool {
    Pen = "pen",
    Eraser = "eraser",
    Highlighter = "highlighter"
}

export class Stroke {
    coords: [number, number][] = [];
    color: Color | RGBAColor = Color.Black;
    width: number = 1;
    tool: Tool = Tool.Pen;


    constructor() {
    }

    toXml() {
        let out = `<stroke tool="${this.tool}" color="${this.color.toString()}" width="${this.width}">\n`
        for (const [x, y] of this.coords) {
            out += `${x.toFixed(4)} ${y.toFixed(4)} `;
        }
        out += "\n</stroke>";
        return out;
    }
}
