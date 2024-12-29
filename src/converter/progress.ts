import browser from "webextension-polyfill";
import {ProgressMessage, Status} from "../messages/convert";

class ProgressTracker {
    private currentStep = 0;

    constructor(private steps: number = 1) {
        if (this.steps <= 0) {
            this.steps = 1;
        }
    }

    async reset() {
        this.currentStep = 0;
        const message: ProgressMessage = {
            message: "progress",
            progress: 0,
            status: Status.Ok
        };
        await browser.runtime.sendMessage(0, {
            text: JSON.stringify(message)
        }).then();
    }

    private async updateProgressBar(status: Status) {
        const message: ProgressMessage = {
            message: "progress",
            progress: Math.min(Math.round((this.currentStep / this.steps) * 100), 100),
            status: status
        };
        await browser.runtime.sendMessage(0, {
            text: JSON.stringify(message)
        });
    }

    async bump() {
        this.currentStep += 1;
        await this.updateProgressBar(Status.Ok);
    }

    async error() {
        await this.updateProgressBar(Status.Error);
    }
}

// 1) texts, 2) images, 3) strokes, 4) math, 5) XML, 6) GZip
export const progressTracker = new ProgressTracker(6);