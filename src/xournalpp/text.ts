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
    color: RGBAColor;
    data: string = "";
    width: number = 0;
    size: number = 12;

    constructor(data: string = "", public font: string = "Courier New", size: number = 12,
                public x: number = 0, public y: number = 0, color: RGBAColor | Color = new RGBAColor(0, 0, 0),
                public ts: number = 0, public fn: string = "", width: number = 0) {
        if(color instanceof RGBAColor){
            this.color = color;
        }else{
            this.color = RGBAColor.fromColor(color);
        }
        this.data = data;
        this.width = width;
        this.size = size;
    }



    toXml(){
        const out = escapeXml(wrapText(this.data, this.size, this.width));
        return `<text font="${this.font}" size="${this.size.toFixed(0)}" x="${this.x.toFixed(4)}" y="${this.y.toFixed(4)}" color="${this.color.toString()}">${out}</text> `
    }
}
