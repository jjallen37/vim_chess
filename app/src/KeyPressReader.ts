import { map } from "lodash";
import { KEY } from "./vimtypes";

export interface IKeyPressReader {
    read(isWhite: boolean) : Promise<IKeyPress>;
}

export interface IKeyPress {
    key: KEY;
    isShiftHeld: boolean;
}

export class KeyPressReader implements IKeyPressReader {
    constructor(){
    }

    read(isWhite: boolean) : Promise<IKeyPress> {
        return this.readKey().then(x =>{
            const e = x as KeyboardEvent;
            return {
                key: convertKeyDown(e, isWhite),
                isShiftHeld: e.shiftKey
            }
        });
    }

    private readKey() {
        return new Promise(resolve => {
            window.addEventListener('keydown', resolve, {once:true});
        });
    }
}

export class InputKeypressReader implements IKeyPressReader {
    private elt: HTMLInputElement;
    constructor(elt: HTMLInputElement){
        this.elt = elt;
        this.elt.addEventListener("onkeypress", (e) => {
            e.preventDefault();
            return false;
        })
    }

    read(isWhite: boolean) : Promise<IKeyPress> {
        return this.readKey().then(x =>{
            const e = x as KeyboardEvent;

            return {
                key: convertKeyDown(e, isWhite),
                isShiftHeld: e.shiftKey
            }
        });
    }

    private readKey() {
        return new Promise(resolve => {
            this.elt.addEventListener('keydown', resolve, 
            {
                capture: true,
                once:true,
                passive: false,
            });
        });
    }
}

function convertKeyDown(e: KeyboardEvent, isWhite: boolean) : KEY {
    // console.log(`KeyPress: ${e.key}. Alt: ${e.altKey} Shift: ${e.shiftKey} Ctrl: ${e.ctrlKey}`)

    // Master override keys
    switch (e.keyCode) {
        case 32: // Space
        case 27: // ESC
            return KEY.ESC;

        case 13: // ESC
            return KEY.ENTER;
        default: 
            break;
    }

    // Prevent default keys
    // And here
    if (e.key === "r" && e.ctrlKey) {
    } 
    else if (e.keyCode == 123) { // f12 for debugging
    }
    // All other keystrokes destroyed here
    else {
        e.preventDefault();
        e.stopPropagation();
    }

    // Numpad
    if (e.ctrlKey || e.altKey) {
        // Menu items require ctrl to press so no accidental resignation
        switch(e.key) {
            // Menu
            case '1': return KEY.ONE; 
            case '2': return KEY.TWO; 
            case '3': return KEY.THREE; 
            case '4': return KEY.FOUR; 

            case 'b': return KEY.PREVIOUS; 
            case 'n': return KEY.NEXT; 
            case 'B': return KEY.FIRST; 
            case 'N': return KEY.LAST; 
        }

        switch(e.keyCode) {
            case 85: return KEY.NUM7; 
            case 73: return KEY.NUM8; 
            case 79: return KEY.NUM9; 
            case 74: return KEY.NUM4;
            case 76: return KEY.NUM6; 
            case 77: return KEY.NUM1; 
            case 188: return KEY.NUM2; 
            case 190: return KEY.NUM3;
            // case 'u': return KEY.NUM7; 
            // case 'i': return KEY.NUM8; 
            // case 'o': return KEY.NUM9; 
            // case 'j': return KEY.NUM4;
            // case 'l': return KEY.NUM6; 
            // case 'm': return KEY.NUM1; 
            // case ',': return KEY.NUM2; 
            // case '.': return KEY.NUM3;
            default:
                return KEY.INVALID;
                break;
        }
    }

    // Special cases
    switch(e.key) {
        case 'h': return KEY.h; 

        case 't': return KEY.TOGGLE; 
        // case 't': return KEY.TOGGLE; 

        default: 
            break;
    }

    // Color specific mapping
    var mappings = isWhite ? whiteMappings : blackMappings;
    return mappings[e.key]
}

let whiteMappings: { [key in string]: KEY } = {
    // Homerow
    'a': KEY.A1, 's': KEY.B2, 'd': KEY.C3, 'f': KEY.D4,
    'j': KEY.E5, 'k': KEY.F6, 'l': KEY.G7, ';': KEY.H8,

    // Pieces
    'q': KEY.Rq, 'w': KEY.Nq, 'e': KEY.Bq, 'r': KEY.Q,
    'u': KEY.K, 'i': KEY.Bk, 'o': KEY.Nk, 'p': KEY.Rk,

    // Piece Captures
    'Q': KEY.xRq, 'W': KEY.xNq, 'E': KEY.xBq, 'R': KEY.xQ,
    'U': KEY.xK, 'I': KEY.xBk, 'O': KEY.xNk, 'P': KEY.xRk,

    // Pawns
    'z': KEY.aP, 'x': KEY.bP, 'c': KEY.cP, 'v': KEY.dP,
    'n': KEY.eP, 'm': KEY.fP, ',': KEY.gP, '.': KEY.hP,

    // Pawn captures
    'Z': KEY.aP, 'X': KEY.bP, 'C': KEY.cP, 'V': KEY.dP,
    'N': KEY.eP, 'M': KEY.fP, '<': KEY.gP, '>': KEY.hP,
}

let blackMappings: { [key in string]: KEY } = {
    // Homerow
    'a': KEY.H8, 's': KEY.G7, 'd': KEY.F6, 'f': KEY.E5,
    'j': KEY.D4, 'k': KEY.C3, 'l': KEY.B2, ';': KEY.A1,

    // Pieces
    'q': KEY.Rk, 'w': KEY.Nk, 'e': KEY.Bk, 'r': KEY.K,
    'u': KEY.Q, 'i': KEY.Bq, 'o': KEY.Nq, 'p': KEY.Rq,

    // Piece Captures
    'Q': KEY.xRk, 'W': KEY.xNk, 'E': KEY.xBk, 'R': KEY.xK,
    'U': KEY.xQ, 'I': KEY.xBq, 'O': KEY.xNq, 'P': KEY.xRq,

    // Pawns
    'z': KEY.hP, 'x': KEY.gP, 'c': KEY.fP, 'v': KEY.eP,
    'n': KEY.dP, 'm': KEY.cP, ',': KEY.bP, '.': KEY.aP,

    // Pawn captures
    // 'Z': KEY.aP, 'X': KEY.bP, 'C': KEY.cP, 'V': KEY.dP,
    // 'N': KEY.eP, 'M': KEY.fP, '<': KEY.gP, '>': KEY.hP,
}
