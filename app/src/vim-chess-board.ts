import {
    ICoords,
    KEY,
    fromCoords,
    toCoords,
    ISquare,
    emptyCoords,
    PIECE,
    toPiece, fromPiece, closerPiece, menuOptions, 
} from './vimtypes'
import {
  getBoard,
} from './chessboard';
import {
  Vim
} from './vim';
import filter from 'lodash/filter';
import { forEach, isPlainObject, toArray } from 'lodash';
import _ from 'lodash';

export interface IChessThing {
    selectArea(sq: ICoords) : void;
    unselectArea(sq: ICoords) : void;

    markSquare(sq: ICoords) : void;
    unmarkSquare(sq: ICoords) : void;
    drawArrow(from: ICoords, to: ICoords) : void;

    clearAllMarkings() : void;

    getSquare(sq: ICoords) : ISquare;
    getPiece(piece: PIECE, color: number , isKingside: boolean) : ISquare | undefined;

    isLegalMove(to: ICoords, from: ICoords) : boolean;
    makeMove(to: ICoords, from: ICoords) : void;

    highlightMovesFromSq(sq: ICoords) : void; 
    attemptPawnMove(sq: ICoords) : void; 

    highlightAllLegalMoves() : void; 

    // Menu
    pressMenu(key: KEY) : void; 
    nextMove() : void; 
    prevMove() : void; 

    flipBoard() : void; 
}

export class VimChessBoard implements IChessThing {
    constructor() {
    }

    getSquare(sq: ICoords) : ISquare {
        var board = getBoard();
        return filter(board?.getPiecesSetup(), x => x.area == fromCoords(sq)).map(x =>{
            var a: ISquare = {
                type: toPiece(x.type),
                loc: toCoords(x.area)
            }
            return a;
        })[0];
    };

    getPiece(piece: PIECE, color: number = 1, isKingside: boolean = false) : ISquare | undefined {
        var board = getBoard();
        var tempPiece = fromPiece(piece) 
        var p = filter(board?.getPiecesSetup(), x => {
            return x.type === tempPiece
               && x.color === color
        }).map(x =>{
            var a: ISquare = {
                type: toPiece(x.type),
                loc: toCoords(x.area)
            }
            return a;
        });
        if (p.length === 0) { return undefined; }
        if (p.length === 1) { return p[0]; }

        var loc = closerPiece(p[0].loc, p[1].loc, isKingside);
        return p[0].loc === loc ? p[0] : p[1]
    }

    selectArea(square:ICoords) {
        var board = getBoard();
        board?.selectArea(fromCoords(square));
    }

    unselectArea(square:ICoords) {
        var board = getBoard();
        board?.unselectArea(fromCoords(square));
    }

    markSquare(square: ICoords) {
        var board = getBoard();
        var xr = fromCoords(square);
        board?.markArea(xr);
    };

    unmarkSquare(square: ICoords) {
        var board = getBoard();
        var xr = fromCoords(square);
        board?.unmarkArea(xr);
    };        

    drawArrow(from: ICoords, to: ICoords) {
        var board = getBoard();
        board?.markArrow(fromCoords(from), fromCoords(to))
    }

    clearAllMarkings() {
        var board = getBoard();
        board?.clearMarkedAreas();
        board?.clearMarkedArrows();
    };

    //// MOVES
    isLegalMove(from: ICoords, to: ICoords) : boolean {
        var board = getBoard();
        var fromSq = fromCoords(from);
        var toSq = fromCoords(to)
        return board?.isLegalMove(fromSq, toSq) ?? false;
    }

    makeMove(from: ICoords, to: ICoords) {
        var board = getBoard();
        var fromSq = fromCoords(from);
        var toSq = fromCoords(to)
        return board?.makeMove(fromSq, toSq) ?? false;
    }

    attemptPawnMove(sq: ICoords) {
        var board = getBoard();
        var moves = board?.getLegalMoves()
            .filter(x => x.to == fromCoords(sq) && x.piece == "p")
        if (moves?.length !== 0){
            // no move
            return;
        } else if (moves?.length > 1) {
            // ambiguous move
            return;
        } else {
            board?.makeMove(moves[0].from, fromCoords(sq))
        }
    }

    ///// COSMETICS //////
    highlightMovesFromSq(sq: ICoords) {
        var board = getBoard();
        board?.getLegalMoves()
            .filter(x => x.from == fromCoords(sq))
            .forEach(x => board?.markArea(x.to))
    }

    getLegalMoves(sq: ICoords) {
        var board = getBoard();
        board?.getLegalMoves()
            .filter(x => x.from == fromCoords(sq))
            .forEach(x => board?.markArea(x.to))
    }

    highlightAllLegalMoves() : void {
        var board = getBoard();
        board?.getLegalMoves()
            .forEach(x => board?.markArea(x.to))
    }

    pressMenu(key: KEY) : void {
        var buttonSelectors = [
            ".primary-control-buttons-component", // Puzzles 
            ".game-control-buttons-wrapper", // Computer
            ".daily-game-footer-mainButtons", // Dailies
        ]

        var validRows = buttonSelectors
            .map(x => document.querySelectorAll(`${x} button`))
            .filter(x => x.length !== 0);
        if (validRows.length !== 1) {
            console.log(`ERR: Found more than one button row. ${validRows.length}`)
            return;
        }
        var buttons = validRows[0]
        var i = menuOptions.indexOf(key);
        var button = buttons[i] as HTMLElement;
        if (!button) {
            console.log("No button found")
            return;
        }
        button.click();
    };

    prevMove() {
        var button = document.querySelector("button .chevron-left") as HTMLElement
        if (!button) {
            console.log("No next button found")
            return;
        }
        button.click();
    }

    nextMove(){
        var button = document.querySelector("button .chevron-right") as HTMLElement
        if (!button) {
            console.log("No next button found")
            return;
        }
        button.click();
    }

    flipBoard() {
        // Analytics was an id, but others were a class
        var button = document.getElementById("board-controls-flip")
        if (button){
            button.click();
            return;
        }
        var buttons = document.getElementsByClassName("board-controls-flip")
        if (!buttons || buttons.length !== 1){
            return;
        }
        (buttons[0] as HTMLElement).click();
    }
}