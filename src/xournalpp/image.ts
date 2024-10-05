export class Image {
    data: string = "";
    left: number = 0;
    right: number = 0;
    bottom: number = 0;
    top: number = 0;

    constructor(data: string, x: number, y: number, width: number, height: number) {
        this.data = data;
        this.left = x;
        this.top = y;
        this.right = (x + width);
        this.bottom = (y + height);
    }

    toXml() {
        if (!this.data) {
            return ""
        }
        return `<image left="${this.left.toFixed(4)}" right="${this.right.toFixed(4)}" top="${this.top.toFixed(4)}" bottom="${this.bottom.toFixed(4)}">${this.data}</image>`;
    }
}
