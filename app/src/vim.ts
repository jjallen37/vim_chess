import { filter, isEmpty, isEqual, isWeakMap, startCase } from 'lodash';
import { invent, select } from 'svg.js';
import { drawMovesOnBoard } from './chess';
import { getBoard } from './chessboard';
import { IVueChessboardStore } from './chessboard/vue-chessboard/types';
import { boards } from './globals';
import { IKeyPressReader } from './KeyPressReader';
import { TArea } from './types';
import { createInitialVimBar, StatusController } from './vim-bar';
import { IChessThing } from './vim-chess-board';
import { VimFsm } from './vimFsm';
import {
    KEY,
    IVimState,
    PIECE,
    toPieceKey,
    fromCoords,
    coordKeys,
    pieceKeys,
    fromPiece,
    toCoords,
    xPieceKeys,
    pawns,
    pawnToRank as pawnToFile,
    Mode,
    toPiece,
    numPad,
    knightMoves,
    ranks,
    toFile,
    emptyCoords,
    toRank,
    menuOptions,
    arrowMoves,
    ICoords
} from './vimtypes';

export class Vim {
    private _io: IKeyPressReader;
    private _chess: IChessThing;
    private fsm: VimFsm;
    private state: IVimState;
    private onInput: (state: IVimState) => void;

    constructor(
        io: IKeyPressReader,
        chess: IChessThing,
        // _status: IStatusBar
        onInput: (state: IVimState) => void
    ){
        this._io = io;
        this._chess = chess;
        this.onInput = onInput;

        this.state = {
            mode: Mode.N,
            selected: emptyCoords(),
            target: emptyCoords(),
            message: ""
        } as IVimState

        this.fsm = new VimFsm(this.state)
            .on(menuOptions, this.fsmMenu)
            .on([KEY.TOGGLE], this.fsmToggle)
        this.fsm.mode(Mode.N)
            .on([KEY.ESC], this.nEsc)
            .on(coordKeys, this.nCoords)
            .on(pieceKeys, this.nPiece)
            .on(pawns, this.nPawn)
            .on([KEY.h], this.nHighlight)
        this.fsm.mode(Mode.NR)
            .on(coordKeys, this.nrCoords)
            .on([KEY.ESC], this.nrEsc)
        this.fsm.mode(Mode.S)
            .on([KEY.ESC], this.sEsc)
            .on(coordKeys, this.sCoords)
            .on(pieceKeys, this.sPiece)
            .on(xPieceKeys, this.sXPiece)
            .on(pawns, this.sPawn)
            // .on(xpawns, this.sXPawn)
            .on([KEY.h], this.sHighlight)
            .on([KEY.ENTER], this.sEnter)
            .on(numPad, this.sQuickAction)
        this.fsm.mode(Mode.SR)
            .on(coordKeys, this.srCoords)
            .on([KEY.ESC], this.srEsc)
        this.fsm.mode(Mode.CONFIRM)
            .on([KEY.ESC], this.cEsc)
            .on([KEY.ENTER], this.cEnter)
        this.fsm.mode(Mode.HIGHLIGHT)
            .on([KEY.ESC], this.hEsc)
            .on(pieceKeys, this.hPiece)
            .on(pawns, this.hPawn)

        getBoard()?.onOptionsUpdated(() => {
            this.state.mode = Mode.N;
            this.state.selected = emptyCoords();
            this.state.target = emptyCoords();
            this._chess.clearAllMarkings();
        });
    }

    async start() {
        var board = getBoard()
        if (!board) { return; }
        do {
            var isWhite = board!!.getPlayingAs() === 1;

            var input = await this._io.read(isWhite);
            this.state.inputShiftHeld = input.isShiftHeld
            // console.log(`Read. Key: ${KEY[input.key]} Shift: ${input.isShiftHeld}`)
            try {
                this.fsm.dispatch(input.key);
            } catch (e) {
                console.log(`VIM ERR: ${e}`)
            }

            this.state.message = KEY[input.key];
            this.onInput(this.state);
            var board = getBoard();
            if (board) {
                drawMovesOnBoard(board, "")
            }
        }
        while (true)
    }

    // ---------  Universal Keys  -------------

    fsmMenu = (state: IVimState) => {
        switch (state.inputKey) {
            case KEY.ONE: case KEY.TWO: case KEY.THREE: case KEY.FOUR:
                this._chess.pressMenu(state.inputKey)
                break;
            case KEY.NEXT: 
                this._chess.nextMove();
                break;
            case KEY.PREVIOUS:
                this._chess.prevMove();
                break;
        }
    }

    fsmToggle = (state: IVimState) => {
        this._chess.flipBoard();
    }

    // ---------  Normal  -------------

    nCoords = (state: IVimState) => {
        state.mode = Mode.NR;
        state.selected.file = toFile(state.inputKey);
    }

    nHighlight = (state: IVimState) => {
        state.mode = Mode.HIGHLIGHT;
        // this._chess.highlightAllLegalMoves();
    }

    nPawn = (state: IVimState) => {
        var board = getBoard();
        var file = pawnToFile(state.inputKey);
        var pawns = filter(board?.getPiecesSetup(), x => {
            return x.type === fromPiece(PIECE.P) 
               && x.color === board!!.getPlayingAs()
               && x.area[0] === file
        });
        if (pawns.length === 0){
            console.log(`No ${file}-file pawn`)
            return;
        }
        if (pawns.length !== 1){
            console.log(`Ambiguous. Multiple ${file}-file pawns`)
            return;
        }
        var pawn = pawns[0];
        state.selected = toCoords(pawn.area)
        this.dispatchSelect(state)
    }

    nPiece = (state: IVimState) => {
        var board = getBoard();
        var isKingside = [KEY.Rk, KEY.Nk, KEY.Bk].includes(state.inputKey)
        var p = toPieceKey(state.inputKey)
        var piece = this._chess.getPiece(p, board!!.getPlayingAs(), isKingside)
        if (!piece) { return; }
        state.selected = piece.loc;
        this.dispatchSelect(state)
    }

    nEsc = (state: IVimState) => {
        state.mode = Mode.N;
        this._chess.clearAllMarkings();
    }

    // ---------  Normal Rank  -------------

    nrCoords = (state: IVimState) => {
        state.mode = Mode.S;
        state.selected.rank = toRank(state.inputKey);''
        this.dispatchSelect(state)
    }

    nrEsc = (state: IVimState) => {
        state.mode = Mode.N;
        state.selected.file = -1;
        this._chess.clearAllMarkings();
    }

    // ---------  Selected  -------------

    sEsc = (state: IVimState) => {
        this.dispatchNormal(state)
    }

    sCoords = (state: IVimState) => {
        this.unmarkTargetArrows(state);
        state.mode = Mode.SR;
        state.target.file = toFile(state.inputKey);
    }

    sPawn = (state: IVimState) =>
    {
        var board = getBoard();
        var file = pawnToFile(state.inputKey);
        var pawns = filter(board?.getPiecesSetup(), x => {
            return x.type === fromPiece(PIECE.P) 
               && x.color === board!!.getPlayingAs()
               && x.area[0] === file
        });
        if (pawns.length === 0){
            console.log(`No ${file}-file pawn`)
            this.dispatchNormal(state);
            return;
        }
        if (pawns.length !== 1){
            console.log(`Ambiguous. Multiple ${file}-file pawns`)
            this.dispatchNormal(state);
            return;
        }
        var pawn = pawns[0];
        state.selected = toCoords(pawn.area)
        this.dispatchSelect(state)
    }

    sXPawn = (state: IVimState) =>
    {
        var board = getBoard();
        var file = pawnToFile(state.inputKey);
        var isPlayer = board!!.isPlayersTurn()
        var pawns = filter(board?.getPiecesSetup(), x => {
            return x.type === fromPiece(PIECE.P) 
               && x.color === (isPlayer ? 2 : 2)
               && x.area[0] === file
        });
        if (pawns.length === 0){
            console.log(`No ${file}-file pawn`)
            this.dispatchNormal(state);
            return;
        }
        if (pawns.length !== 1){
            console.log(`Ambiguous. Multiple ${file}-file pawns`)
            this.dispatchNormal(state);
            return;
        }
        var pawn = pawns[0];
        state.selected = toCoords(pawn.area)
        this.dispatchSelect(state)
    }

    sHighlight = (state: IVimState) => {
        this._chess.highlightMovesFromSq(state.selected)
        this.dispatchDeselect(state)
    }

    sPiece = (state: IVimState) => {
        //  If no shift, go to piece
        var board = getBoard();
        var isKingside = [KEY.Rk, KEY.Nk, KEY.Bk].includes(state.inputKey)
        var p = toPieceKey(state.inputKey)
        var piece = this._chess.getPiece(p, board!!.getPlayingAs(), isKingside)
        if (!piece) 
        { 
            return; 
        }
        this.unmarkTargetArrows(state)
        state.selected = piece.loc
        this.dispatchSelect(state)
    }

    sXPiece = (state: IVimState) => {
        var board = getBoard();
        var isKingside = [KEY.Rk, KEY.Nk, KEY.Bk].includes(state.inputKey)
        var color = (board!!.getPlayingAs() == 1) ? 2 : 1;
        var target = this._chess.getPiece(toPieceKey(state.inputKey),
            color, isKingside)
        if (!target) { return; }

        var moves = filter(board?.getLegalMoves(), x => {
            return x.from === fromCoords(state.selected) &&
                x.to === fromCoords(target!!.loc)
        });
        if (moves.length === 0) {
            console.log("No move exists")
            state.mode = Mode.S;
            state.target = emptyCoords();
        }
        // Ambiguous
        else if (moves.length != 1) {
            console.log("Ambiguous move")
            state.mode = Mode.S;
            state.target = emptyCoords();
        }
        else {
            state.target = target.loc;
            this.dispatchConfirm(state)
        }
    }

    /**
     * When there is a pawn move to the selected square
     * @param state 
     */
    sEnter = (state: IVimState) => {
        var board = getBoard();

        var moves = filter(board?.getLegalMoves(), x => {
            return (x.to === fromCoords(state!!.selected) 
                && x.piece === fromPiece(PIECE.P))
                || 
                (x.from === fromCoords(state!!.selected) 
                && x.to === fromCoords(state!!.target))
        });
        if (moves.length !== 1) 
        { return; }
        this._chess.makeMove(toCoords(moves[0].from), toCoords(moves[0].to));
        this._chess.clearAllMarkings();
        this.dispatchNormal(state);
    }

    /**
     * Each piece can use alt + uiojlm,. as the number pad
     * @param state 
     */
    sQuickAction = (state: IVimState) => {
        this.unmarkTargetArrows(state)
        switch (state.selectedPiece) {
            case PIECE.N:
                this.sKnight(state);
                break;
            case PIECE.Q:
            case PIECE.K:
                this.sQuickMove(state, numPad);
                break;
            case PIECE.B:
                this.sQuickMove(state, [
                    KEY.NUM7, KEY.NUM9, KEY.NUM1, KEY.NUM3, 
                ]);
                break;
            case PIECE.R:
                this.sQuickMove(state, [
                    KEY.NUM8, KEY.NUM4, KEY.NUM6, KEY.NUM2, 
                ]);
                break;
            case PIECE.P:
                this.sQuickMove(state, [
                    KEY.NUM7, KEY.NUM8, KEY.NUM9 
                ]);
                break;
            default:
                break;
        }
    }

    sKnight = (state: IVimState) => {
        var move = knightMoves[state.inputKey]
        if (!move) { return; }
        var isWhite = getBoard()?.getPlayingAs() === 1
        var dx = move[0] * (isWhite ? 1 : -1);
        var dy = move[1] * (isWhite ? 1 : -1);
        var target = fromCoords({ 
            file: state.selected.file + dx , 
            rank: state.selected.rank + dy 
        });            
        var source = fromCoords(state.selected)
        var selectedMove = filter(getBoard()?.getLegalMoves(), x => {
            return x.from === source && 
                x.to === target
        });
        if (selectedMove?.length !== 1) { return; }
        state.target = toCoords(selectedMove[0].to)

        this.dispatchConfirm(state)
    }

    sQuickMove = (state: IVimState, validKeys: KEY[]) => {
        if (!validKeys.includes(state.inputKey)){ return; } // Invalid direction for piece
        var move = arrowMoves[state.inputKey]
        if (!move) 
        { 
            return; 
        } // Invalid directional move 

        var isPlayerWhite = getBoard()?.getPlayingAs() === 1
        // var isPlayersTurn = getBoard()?.isPlayersTurn()
        // var isWhitesTurn = isPlayerWhite === isPlayersTurn
        // var isBlackFacing = getBoard()?.isFlipped()
        // // As in, is the viewer's side's turn
        // var isObserversTurn = isWhitesTurn === isBlackFacing;
        // var mod = isObserversTurn ? - 1 : 1;
        var mod = isPlayerWhite ? 1 : -1;

        // console.log(`Player: ${isPlayerWhite}. Turn: ${isPlayersTurn}. IsFlipped:${isFlipped}. Mod: ${mod}`);

        var source = fromCoords(state.selected)
        var pieceMoves = filter(getBoard()?.getLegalMoves(), x =>  x.from === source)
        var target: TArea;

        var moves = []
        var rank = KEY.INVALID;
        var file = KEY.INVALID;

        // Max distance selection
        if (state.inputShiftHeld) {
            file = state.selected.file
            rank = state.selected.rank
        } 
        // Same direction
        else if (state.arrowDirection === state.inputKey){
            file = state.target.file
            rank = state.target.rank
        }
        // New direction
        else {
            file = state.selected.file
            rank = state.selected.rank
        }

        // All possible moves this direction
        for (let i = 0; i < 8; i++) {
            file = file + move[0] * mod
            rank = rank + move[1] * mod
            if (file < 0 || file >= 8) { break;}
            if (rank < 0 || rank >= 8) { break;}
            moves.push(fromCoords({ file: file, rank: rank }));
        }
        
        // Find the max length move
        if (state.inputShiftHeld) { 
            for (let index = moves.length - 1; index >= 0; index--) {
                const qMove = moves[index];
                if (pieceMoves.filter(x => x.to === qMove).length === 1) {
                    target = qMove;
                    break;
                }
            }
        }
        // Find next available move in this direction
        else {
            for (let i = 0; i < moves.length; i++) {
                const qMove = moves[i];
                if (pieceMoves.filter(x => x.to === qMove).length === 1) {
                    target = qMove;
                    break;
                }
            }
        }

        // Determine if the target square is a valid move
        var selectedMove = filter(pieceMoves, x => {
            return x.from === source && 
                x.to === target
        });
        if (selectedMove?.length !== 1) { return; }

        // Target that square 
        state.arrowDirection = state.inputKey;
        state.target = toCoords(selectedMove[0].to)
        this.dispatchConfirm(state)
    }

    // ---------  Selected  Rank -------------

    srEsc = (state: IVimState) => {
        state.mode = Mode.S;
        state.selected.file = KEY.INVALID;
    }

    srCoords = (state: IVimState) => {
        state.target.rank = toRank(state.inputKey);

        // highlight 
        if (this._chess.isLegalMove(state.selected, state.target)) {
            this.dispatchConfirm(state)
        } else {
            console.log("illegal move")
            this.dispatchSelect(state)
            // state.mode = Mode.S;
            // state.target = emptyCoords();
        }
    }
    
    // ---------  Confirm -------------

    cEsc = (state: IVimState) => {
        state.mode = Mode.S;
        this._chess.unmarkSquare(state.target);
        state.target = emptyCoords();
    }

    cEnter = (state: IVimState) => {
        state.mode = Mode.S;
        var isLegal = this._chess.isLegalMove(state.selected, state.target);
        // Legal move
        if (isLegal) {
            this._chess.makeMove(state.selected, state.target)
            this._chess.clearAllMarkings();
            this.dispatchNormal(state)
        }
        // Can't 
        else {
            alert("Illegal move")
            this._chess.unmarkSquare(state.target);
            state.mode = Mode.S;
            state.target.file = -1;
        }
    }

    // ---------  Normal  -------------
    
    hEsc = (state: IVimState) => {
        this.dispatchNormal(state);
    }

    hPiece = (state: IVimState) => {
        var board = getBoard();
        var isKingside = [KEY.Rk, KEY.Nk, KEY.Bk].includes(state.inputKey)
        var target = this._chess.getPiece(toPieceKey(state.inputKey),
            board!!.getPlayingAs(), isKingside)
        if (!target) { return; }
        this._chess.highlightMovesFromSq(target.loc)
    }
    
    hPawn = (state: IVimState) =>
    {
        var board = getBoard();
        var file = pawnToFile(state.inputKey);
        var isPlayer = board!!.isPlayersTurn()
        var pawns = filter(board?.getPiecesSetup(), x => {
            return x.type === fromPiece(PIECE.P) 
               && x.color === (isPlayer ? 1 : 2)
               && x.area[0] === file
        });
        if (pawns.length === 0){
            console.log(`No ${file}-file pawn`)
            return;
        }
        if (pawns.length !== 1){
            console.log(`Ambiguous. Multiple ${file}-file pawns`)
            return;
        }
        var pawn = pawns[0];
        this._chess.highlightMovesFromSq(toCoords(pawn.area))
    }

    /**
     * Assumes this.state.selected is valid
     */
    dispatchSelect(state: IVimState) {
        this.unmarkTargetArrows(state)

        state.mode = Mode.S;
        state.arrowDirection = KEY.INVALID;
        this._chess.selectArea(state.selected)

        // Check for pawn moves to selected space
        var board = getBoard();
        var sel = fromCoords(state!!.selected)
        var piece = fromPiece(PIECE.P)
        var moves = filter(board?.getLegalMoves(), x => {
            return x.to === sel && 
                x.piece === piece
        });

        // There is a single pawn move, highlight it
        if (moves.length == 1) {
            var pawnLoc = toCoords(moves[0].from)
            this._chess.drawArrow(pawnLoc, state.selected)
        }

        // Check for piece            
        var piece = filter(board?.getPiecesSetup(), x => { 
            return x.area == sel
        })[0].type;
        state.selectedPiece = toPiece(piece)
    }

    dispatchDeselect(state: IVimState){
        state.mode = Mode.N;
        state.arrowDirection = KEY.INVALID;
        this.unmarkTargetArrows(state)
        this._chess.unselectArea(state.selected)
        state.selected = emptyCoords();
    }

    dispatchNormal(state: IVimState){
        state.mode = Mode.N;
        state.arrowDirection = KEY.INVALID;
        this.unmarkTargetArrows(state)
        this._chess.unselectArea(state.selected)
        state.selected = emptyCoords();
        this._chess.unselectArea(state.target)
        state.target = emptyCoords();
    }

    dispatchConfirm(state: IVimState){
        state.mode = Mode.S;
        getBoard()?.targetArea(
            fromCoords(state.selected), 
            fromCoords(state.target)
        )
    }

    unmarkTargetArrows(state: IVimState) {
        var board = getBoard();
        if (state.target.file !== -1 && state.target.rank !== -1){
            board?.unmarkArrow(
                fromCoords(state.selected), 
                fromCoords(state.target)
            )
        }
    }
}