import domify from "domify";
import { fromCoords, IVimState, KEY, Mode } from "./vimtypes";

export function createInitialVimBar() {
  const vimbar = domify(`
    <div class="ccHelper-wrapper-jja">
      <div class="ccHelper-wrapper-right">
        <div id="ccHelper-status-box">NORMAL</div>
        <div id="ccHelper-status-message"></div>
      </div>
      <div id="ccHelper-buffer"></div>
    </div>
  `);

  const status = <HTMLInputElement>vimbar.querySelector('#ccHelper-status-box');
  const message = <HTMLInputElement>vimbar.querySelector('#ccHelper-status-message');
  const buffer = <HTMLElement>vimbar.querySelector('#ccHelper-buffer');

  return {
    vimbar,
    status,
    message,
    buffer
  };
}

export class StatusController {
    private _status: Element;
    private _message: Element;
    private _buffer: Element;

    constructor(
        status: Element,
        message: Element,
        buffer: Element
    ) {
        this._status = status;
        this._message = message;
        this._buffer = buffer;
    }

    get status() : string { return this._status.textContent ?? "" }
    get message() { return this._message.textContent ?? ""; }
    get buffer() { return this._buffer.textContent ?? ""; }

    set status(status: string) { this._status.textContent = status; }
    set message(message: string) { this._message.textContent = message; }
    set buffer(buffer: string) { this._buffer.textContent = buffer; }

    onInput = (state:IVimState) => 
    {
        this.status = Mode[state.mode];
        this.buffer = state.message;

        switch (state.mode) {
            case Mode.N:
                this.status = "NORMAL"
                this.message = ""
                break;
            case Mode.NR:
                this.status = "NORMALR"
                this.message = KEY[state.target.rank]
                break;
            case Mode.S:
                this.status = "SELECTED"
                this.message = fromCoords(state.target)
                break;
            case Mode.S:
                this.status = "SELECTEDR"
                this.message = `${fromCoords(state.target)} ${KEY[state.selected.rank]}`
                break;
        }
    }
}