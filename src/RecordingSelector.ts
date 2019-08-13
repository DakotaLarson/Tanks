import Component from "./component/Component";
import DomHandler from "./DomHandler";
import EventHandler from "./EventHandler";

export default class RecordingSelector extends Component {

    private static readonly MIN_LENGTH = 5;
    private static readonly MAX_LENGTH = 30;

    private recordings: Blob[];

    private parentElt: HTMLElement;
    private rangeContainerElt: HTMLElement;
    private rangeElt: HTMLInputElement | undefined;

    private errorElt: HTMLElement;

    private cancelBtn: HTMLElement;
    private submitBtn: HTMLElement;

    constructor() {
        super();

        this.recordings = [];

        this.parentElt = DomHandler.getElement(".recording-selector");
        this.rangeContainerElt = DomHandler.getElement(".range-container", this.parentElt);

        this.errorElt = DomHandler.getElement(".error-msg", this.parentElt);

        this.cancelBtn = DomHandler.getElement(".action-cancel", this.parentElt);
        this.submitBtn = DomHandler.getElement(".action-submit", this.parentElt);

    }

    public enable() {
        EventHandler.addListener(this, EventHandler.Event.RECORDING_COMPLETE, this.onRecordingComplete);
        EventHandler.addListener(this, EventHandler.Event.DOM_CLICK_PRIMARY, this.onClick);
    }

    private onRecordingComplete(recordings: Blob[]) {
        this.recordings = recordings;
        this.createRangeElt(recordings.length);
        this.parentElt.style.display = "block";
    }

    private onClick(event: MouseEvent) {
        if (event.target === this.cancelBtn) {
            this.close();
        } else if (event.target === this.submitBtn) {
            if (this.rangeElt) {
                const rawValues = this.rangeElt.value.split(",");
                const lowValue = parseInt(rawValues[0], 10);
                const highValue = parseInt(rawValues[1], 10);

                if (highValue - lowValue < RecordingSelector.MIN_LENGTH) {
                    this.errorElt.textContent = "Recording must be at least " + RecordingSelector.MIN_LENGTH + " seconds long";
                } else  if (highValue - lowValue > RecordingSelector.MAX_LENGTH) {
                    this.errorElt.textContent = "Recording must be at most " + RecordingSelector.MAX_LENGTH + " seconds long";
                } else {
                    this.postRecording(lowValue, highValue);
                }
            }
        }
    }

    private createRangeElt(count: number) {
        while (this.rangeContainerElt.firstChild) {
            this.rangeContainerElt.removeChild(this.rangeContainerElt.firstChild);
        }
// type="range" multiple value="0,10" min="0" max="10" step="1"
        this.rangeElt = document.createElement("input");
        this.rangeElt.setAttribute("type", "range");
        this.rangeElt.setAttribute("multiple", "");
        this.rangeElt.setAttribute("value", "0," + Math.min(count, RecordingSelector.MAX_LENGTH));
        this.rangeElt.setAttribute("min", "0");
        this.rangeElt.setAttribute("max", "" + count);
        this.rangeElt.setAttribute("step", "1");

        this.rangeContainerElt.appendChild(this.rangeElt);
        // @ts-ignore
        multirange(this.rangeElt);
    }

    private postRecording(min: number, max: number) {
        console.log(min, max);
        const rec = this.recordings.slice(min, max);
        rec.splice(1, 1);
        const recording = new Blob(rec, {
            type: "video/webm",
        });
        const url = URL.createObjectURL(recording);
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style.display = "none";
        a.href = url;
        a.download = "test.webm";
        a.click();
        window.URL.revokeObjectURL(url);
    }

    private close() {
        this.errorElt.textContent = "";
        this.recordings = [];
        this.parentElt.style.display = "";
    }
}
