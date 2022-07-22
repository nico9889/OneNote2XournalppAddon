export class Image{
    data: string = "";
    left: number = 0;
    right: number = 0;
    bottom: number = 0;
    top: number = 0;

    constructor(data: string, x: number, y: number, width: number, height: number) {
        this.data = data;
        this.left = x
        this.top = y
        this.right = x + width
        this.bottom = y + height
    }

    toXml(){
        return (this.data) ? `<image left="${this.left}" right="${this.right}" top="${this.top}" bottom="${this.bottom}">${this.data}</image>`: "";
    }
}
