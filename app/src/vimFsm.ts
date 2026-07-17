import { 
    IVimState,
    KEY, 
    Mode 
} from "./vimtypes";

export interface IVimEvent {
    // on(key: KEY) : IVimEvent;
    on(keys: KEY[], method: (state: IVimState) => void) : IVimEvent;
    dispatch(state: IVimState) : void;
}

export class VimFsm {
    private fsm: { [key in Mode]?: IVimEvent; }
    private masterEvents: { [key in KEY]?: (state: IVimState) => void; }
    private state: IVimState;

    constructor(state: IVimState){
        this.state = state;
        this.fsm = {};
        this.masterEvents = {};
    }

    dispatch(key: KEY) {
        this.state.inputKey = key;

        if (this.masterEvents[key]) {
            this.masterEvents[key]!!(this.state);
        }

        this.fsm[this.state.mode]?.dispatch(this.state);
    }

    mode(mode: Mode): IVimEvent {
        if (!this.fsm[mode]){
            this.fsm[mode] = new VimEvent();
        }
        return this.fsm[mode]!!;
    }

    on(keys: KEY[], method: (state: IVimState) => void) : VimFsm {
        keys.forEach(x => this.masterEvents[x] = method)
        return this
    }
}

class VimEvent implements IVimEvent {
    private events: { [key in KEY]?: (state: IVimState) => void; }
    constructor(){
        this.events = {};
    }

    dispatch(state: IVimState): void {
        var method = this.events[state.inputKey];
        if (!method) { return; }
        method(state);
    }

    on(keys: KEY[], method: (state: IVimState) => void) : IVimEvent{
        keys.forEach((k) => this.onKey(k, method));
        return this;
    }
    onKey(key: KEY, method: (state: IVimState) => void) {
        this.events[key] = method;
    }
}