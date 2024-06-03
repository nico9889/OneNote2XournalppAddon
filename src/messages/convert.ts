import {Message} from "./index";


export interface ConvertMessage extends Message {
    filename: string,
    images: boolean,
    texts: boolean,
    strokes: boolean,
    separateLayers: boolean,
    dark_page: boolean,
    strokes_dark_mode: boolean,
    texts_dark_mode: boolean,
}