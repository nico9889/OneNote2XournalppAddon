export enum Color{
    Black = "black",
    Blue = "blue",
    Red = "red",
    Green = "green",
    Gray = "gray",
    LightBlue = "lightblue",
    LightGreen = "lightgreen",
    Magenta = "magenta",
    Orange = "orange",
    Yellow = "yellow",
    White = "white"
}

export class RGBAColor {
    constructor(public r: number, public g:number, public b: number, public a: number=255) {

    }

    static fromColor(color: Color): RGBAColor{
        switch(color){
            case Color.Black:
                return new RGBAColor(0, 0, 0);
            case Color.Green:
                return new RGBAColor(0,128,0);
            case Color.LightBlue:
                return new RGBAColor(0,192,255);
            case Color.LightGreen:
                return new RGBAColor(0,255,0);
            case Color.Blue:
                return new RGBAColor(51,51,204);
            case Color.Gray:
                return new RGBAColor(128,128,128);
            case Color.Red:
                return new RGBAColor(255,0,0);
            case Color.Magenta:
                return new RGBAColor(255,0,255);
            case Color.Orange:
                return new RGBAColor(255,128,0);
            case Color.Yellow:
                return new RGBAColor(255,255,0);
            case Color.White:
                return new RGBAColor(255,255,255);
        }
    }

    toString(): string{
        return `#${this.r.toString(16).padStart(2, "0")}${this.g.toString(16).padStart(2, "0")}${this.b.toString(16).padStart(2, "0")}${this.a.toString(16).padStart(2, "0")}`
    }
}
