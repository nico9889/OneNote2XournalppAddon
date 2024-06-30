import {Image} from "./image";
import {Text} from "./text";
import {Stroke} from "./stroke";
import {Color, RGBAColor} from "./utils";
import {TexImage} from "./teximage";

export enum BackgroundType{
    Solid = "solid"
}

export enum BackgroundStyle{
    Lined = "lined",
    Graph = "graph"
}

export class Background{
    color: RGBAColor;
    constructor(public type: BackgroundType = BackgroundType.Solid, color: Color | RGBAColor = Color.White, public style: BackgroundStyle = BackgroundStyle.Graph){
        if(color instanceof RGBAColor){
            this.color = color
        }else{
            this.color = RGBAColor.fromColor(color);
        }
    }

    toXml(): string{
        return `<background type="${this.type}" color="${this.color.toString()}" style="${this.style}"/>`
    }
}


export class Layer{
    texts: Text[] = [];
    images: Image[] = [];
    strokes: Stroke[] = [];
    maths: TexImage[] = [];

    constructor() {
    }

    toXml(): string {
        let out = "<layer>";
        for (const stroke of this.strokes) {
            out += `${stroke.toXml()}\n`;
        }
        for(const text of this.texts){
            out += `${text.toXml()}\n`;
        }
        for(const image of this.images){
            out += `${image.toXml()}\n`;
        }
        for(const image of this.maths){
            out += `${image.toXml()}\n`;
        }
        out += "</layer>";
        return out;
    }
}


export class Page{
    width: number = 0;
    height: number = 0;
    layers: Layer[] = [];
    background: Background;

    constructor(background: Background = new Background()) {
        this.background = background;
    }

    toXml(): string {
        let out = `<page width="${this.width}" height="${this.height}">\n 
            ${this.background.toXml()}\n
            `
        for(const layer of this.layers){
            out += `${layer.toXml()}\n`;
        }
        out += "</page>"
        return out;
    }
}
