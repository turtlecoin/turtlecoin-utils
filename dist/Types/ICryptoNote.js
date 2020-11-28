"use strict";
// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoNoteInterfaces = void 0;
const events_1 = require("events");
var CryptoNoteInterfaces;
(function (CryptoNoteInterfaces) {
    class ICryptoNote extends events_1.EventEmitter {
    }
    CryptoNoteInterfaces.ICryptoNote = ICryptoNote;
})(CryptoNoteInterfaces = exports.CryptoNoteInterfaces || (exports.CryptoNoteInterfaces = {}));
