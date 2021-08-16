import {
} from './utils';
import {
  Vim
} from './vim';
import {
  VimChessBoard
} from './vim-chess-board';
import {
  TArea 
} from './types';
import { IKeyPressReader, InputKeypressReader, KeyPressReader } from './KeyPressReader';
import { StatusController } from './vim-bar';

// ------------- Interfaces --------------

export enum KEY {
    // Vim
    ESC,
    INVALID,

    ENTER,

    // Actions
    ONE, TWO, THREE, FOUR,
    NEXT, PREVIOUS, FIRST, LAST,

    // Coordinates
    A1, B2, C3, D4, E5, F6, G7, H8, 

    // Pieces
    P, Q, K,
    Rk, Nk, Bk, 
    Rq, Nq, Bq, 

    // Pieces
    xP, xQ, xK,
    xRk, xNk, xBk, 
    xRq, xNq, xBq, 

    // Pawns
    aP, bP, cP, dP, eP, fP, gP, hP,
    xaP, xbP, xcP, xdP, xeP, xfP, xgP, xhP,

    // Alt -> numpad
    NUM1, NUM2, NUM3, NUM4,
    NUM6, NUM7, NUM8, NUM9,

    SEARCH,
    
    // Commands
    h,
    TOGGLE,
    FLIPBOARD
}

export enum Mode {
    N, // default
    NR, // Rank has been entered
    S, // Position selected, 
    SR, // Position selected, rank entered
    CONFIRM, // Position and target selected
    HIGHLIGHT, // Highlight mode
    S_N, // Selected knight
}  

export enum PIECE {
    // Pieces
    P, Q, K,
    R, N, B, 

    E // Empty
}  

export interface ISquare {
    type: PIECE
    loc: ICoords
}  

export interface ICoords {
    file: number
    rank: number
}  

export interface IVimState {
    inputKey: KEY
    inputShiftHeld: boolean
    mode: Mode
    selected: ICoords
    target: ICoords
    message: string
    selectedPiece: PIECE
    arrowDirection: KEY // Should be numpad 1-9 minus 5.
}  

// ------------- Data --------------
let pieces = [PIECE.P, PIECE.R, PIECE.N, PIECE.B, PIECE.Q, PIECE.K]
let pieceStr = "prnbqk"
let pieceKeyMap: { [key in KEY]?: PIECE} = {
    [KEY.P] : PIECE.P, [KEY.Q] : PIECE.Q,
    [KEY.K] : PIECE.K, [KEY.Rq] : PIECE.R,
    [KEY.Rk] : PIECE.R, [KEY.Nq] : PIECE.N,
    [KEY.Nk] : PIECE.N, [KEY.Bq] : PIECE.B,
    [KEY.Bk] : PIECE.B, [KEY.xQ] : PIECE.Q,
    [KEY.xK] : PIECE.K, [KEY.xRq] : PIECE.R,
    [KEY.xRk] : PIECE.R, [KEY.xNq] : PIECE.N,
    [KEY.xNk] : PIECE.N, [KEY.xBq] : PIECE.B,
    [KEY.xBk] : PIECE.B,
}
export let ranks = [
    KEY.A1, KEY.B2, KEY.C3, KEY.D4, 
    KEY.E5, KEY.F6, KEY.G7, KEY.H8]
let fileStr = "abcdefgh"
let rankStr = "12345678"

export let pawns = [
    KEY.aP, KEY.bP, KEY.cP, KEY.dP, 
    KEY.eP, KEY.fP, KEY.gP, KEY.hP]
export let xpawns = [
    KEY.xaP, KEY.xbP, KEY.xcP, KEY.xdP, 
    KEY.xeP, KEY.xfP, KEY.xgP, KEY.xhP]
export let coordKeys = [
    KEY.A1, KEY.B2, KEY.C3, KEY.D4, 
    KEY.E5, KEY.F6, KEY.G7, KEY.H8];
export let pieceKeys = [
    KEY.Q, KEY.K, KEY.Rq, KEY.Rk, 
    KEY.Nq, KEY.Nk, KEY.Bq, KEY.Bk]
export let xPieceKeys = [
    KEY.xQ, KEY.xK, KEY.xRq, KEY.xRk, 
    KEY.xNq, KEY.xNk, KEY.xBq, KEY.xBk]
export let numPad = [
    KEY.NUM1, KEY.NUM2, KEY.NUM3, KEY.NUM4,
    KEY.NUM6, KEY.NUM7, KEY.NUM8, KEY.NUM9]
let pawnFileStr = "abcdefgh"

export let menuOptions = [
    KEY.ONE, KEY.TWO, KEY.THREE, KEY.FOUR, 
    KEY.FIRST, KEY.NEXT, KEY.PREVIOUS, KEY.LAST, 
]

export let knightMoves: { [key in KEY]?: number[] } = {
    [KEY.NUM7]: [-2, 1],
    [KEY.NUM8]: [-1, 2], 
    [KEY.NUM9]: [1, 2],
    [KEY.NUM4]: [-2, -1],
    [KEY.NUM6]: [2, 1],
    [KEY.NUM1]: [-1, -2],
    [KEY.NUM2]: [1, -2],
    [KEY.NUM3]: [2, -1],
}

export let arrowMoves: { [key in KEY]?: number[] } = {
    [KEY.NUM7]: [-1, 1],
    [KEY.NUM8]: [0, 1], 
    [KEY.NUM9]: [1, 1],
    [KEY.NUM4]: [-1, 0],
    [KEY.NUM6]: [1, 0],
    [KEY.NUM1]: [-1, -1],
    [KEY.NUM2]: [0, -1],
    [KEY.NUM3]: [1, -1],
}


// ------------- Conversion functions --------------
export function pawnToRank(key: KEY) { return pawnFileStr[pawns.indexOf(key)]}

export function toRank(code: KEY) : number { return ranks.indexOf(code); }
export function fromRank(str: string) : KEY { return ranks[rankStr.indexOf(str)] }
export function toFile(code: KEY) : number { return ranks.indexOf(code); }
export function fromFile(str: string) : KEY { return ranks[fileStr.indexOf(str)] }

export function toCoords(str: string) : ICoords {
    var f = fileStr.indexOf(str[0]);
    var r = rankStr.indexOf(str[1]);
    return { file: f, rank: r};
}
export function fromCoords(square: ICoords) : string {
    if (square.file < 0 || square.file > fileStr.length){ return "" }
    if (square.rank < 0 || square.rank > fileStr.length){ return "" }
    var f = fileStr[square.file];
    var r = rankStr[square.rank];
    return f + r;
}
export function toPiece(str: string) : PIECE { return pieces[pieceStr.indexOf(str)]; }
export function toPieceKey(key: KEY) : PIECE { return pieceKeyMap[key] as PIECE; }
export function fromPiece(piece: PIECE) : string { return pieceStr[pieces.indexOf(piece)] }

// -------------   Helper functions --------------
function kingCoord(): ICoords { return { file: toFile(KEY.E5), rank: toRank(KEY.A1) } }
function queenCoord(): ICoords { return { file: toFile(KEY.D4), rank: toRank(KEY.A1) } }
export function emptyCoords() : ICoords {return {file: -1, rank: -1}; }


// -------------   Fancier functions --------------

export function closerPiece(src: ICoords, target: ICoords, isKingside: boolean): ICoords {
    var loc = isKingside ? kingCoord() : queenCoord();
    if (src.file === target.file) 
    { 
        return isKingside 
            ? src.rank > target.rank ? src : target
            : src.rank < target.rank ? src : target
    }
    return isKingside 
        ? src.file > target.file ? src : target
        : src.file < target.file ? src : target
}