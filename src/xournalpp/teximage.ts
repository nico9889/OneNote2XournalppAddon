import {Image} from "./image";

// Xournal++ renders math block in a very quirky way:
// it converts the Tex equation into a base64 encoded PDF binary, and then it renders it.
// The original equation is saved inside the `text` tag for later edit.
// Somehow the Xournal++ renderer seems to be able to distinguish PDF binary from PNG binary,
// and it's able to render correctly the TexImage block even if it's content it's replaced with PNG.
export class TexImage extends Image{
    // Equation in Tex format
    text: string;

    constructor(text: string, data: string, x: number, y: number, width: number, height: number) {
        super(data, x, y, width, height);
        this.text = text;
    }

    toXml(){
        return (this.data) ? `<teximage text="${this.text}" left="${this.left.toFixed(4)}" right="${this.right.toFixed(4)}" top="${this.top.toFixed(4)}" bottom="${this.bottom.toFixed(4)}">${this.data}</teximage>`: "";
    }
}