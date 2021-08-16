import { InputKeypressReader, KeyPressReader } from "./KeyPressReader";
import { Vim } from "./vim";
import { createInitialVimBar, StatusController } from "./vim-bar";
import { VimChessBoard } from "./vim-chess-board";
import { Mode } from "./vimtypes";

export function useVim() {
    // Vim
    const {
        vimbar,
        status,
        message,
        buffer,
    } = createInitialVimBar();
    document.body.appendChild(vimbar);

    var controller = new StatusController(status, message, buffer);
    var io = new KeyPressReader();
    var chess = new VimChessBoard();
    var vim = new Vim(io, chess, controller.onInput)
    vim.start()
}

export function useVim2(elt: HTMLInputElement) {
    var io = new InputKeypressReader(elt);
    var chess = new VimChessBoard();
    var vim = new Vim(io, chess, (e) => {
        elt.value = Mode[e.mode];
    })
    vim.start()
}