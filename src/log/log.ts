import browser from "webextension-polyfill";

export enum Status {
    INFO = "info",
    ERROR = "error",
    SUCCESS = "success",
    WARNING = "warning",
    DEBUG = "debug"
}

export const COLORS: { [key in Status]: string } = {
    [Status.INFO]: "auto",
    [Status.ERROR]: "danger",
    [Status.SUCCESS]: "success",
    [Status.WARNING]: "warning",
    [Status.DEBUG]: "debug"
}

export interface LogLine {
    status: Status;
    date: Date;
    text: string;
}

export class Log {
    #lines: LogLine[] = [];
    public enabled = false;
    public debugEnabled = false;

    constructor() {

    }

    write(line: LogLine) {
        this.#lines.push(line);
        if(this.#lines.length > 200){
            this.#lines = this.#lines.slice(1);
        }
        if(this.enabled && (line.status !== Status.DEBUG || this.debugEnabled)) {
            browser.runtime.sendMessage("{2986a98d-8431-4ed3-af49-df7b89bc555e}", {
                message: "log_line",
                line: line
            }).then();
        }
    }

    writeAll(){
        if(this.enabled){
            browser.runtime.sendMessage("{2986a98d-8431-4ed3-af49-df7b89bc555e}", {
                message: "full_log",
                lines: this.#lines.filter((line) => {
                    return line.status !== Status.DEBUG || this.debugEnabled
                })
            }).then();
        }
    }

    info(text: string) {
        this.write({
            status: Status.INFO,
            date: new Date(),
            text: text
        });
    }

    error(text: string) {
        this.write({
            status: Status.ERROR,
            date: new Date(),
            text: text
        });
    }

    warn(text: string) {
        this.write({
            status: Status.WARNING,
            date: new Date(),
            text: text
        });
    }

    success(text: string) {
        this.write({
            status: Status.SUCCESS,
            date: new Date(),
            text: text
        });
    }

    debug(text: string) {
        this.write({
            status: Status.DEBUG,
            date: new Date(),
            text: text
        });
    }
}