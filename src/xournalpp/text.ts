import {Color, RGBAColor} from "./utils";

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

    wrap(){
        let out = "";
        let space = 0;
        for(let i=0;i<this.data.length;i++){
            out+= this.data[i];
            space += this.size;
            if(space > this.width * 1.8){
                space = 0;
                out += "\n";
            }
        }
        this.data = out;
    }

    escape(){
        // FIXME: dirty escape
        this.data = this.data.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }



    toXml(){
        this.wrap();
        this.escape();
        return `<text font="${this.font}" size="${this.size.toFixed(0)}" x="${this.x.toFixed(4)}" y="${this.y.toFixed(4)}" color="${this.color.toString()}" ts="${this.ts}" fn="${this.fn}">${this.data}</text> `
    }
}
