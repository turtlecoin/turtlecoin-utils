"use strict";
// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.
Object.defineProperty(exports, "__esModule", { value: true });
exports.on = exports.TurtleCoindTypes = exports.LedgerErrorCode = exports.LedgerTransactionState = exports.LedgerError = exports.TransactionOutputs = exports.TransactionInputs = exports.Keys = exports.KeyPair = exports.KeyOutput = exports.KeyInput = exports.ICryptoNote = exports.WalletAPI = exports.TurtleCoind = exports.LegacyTurtleCoind = exports.Transaction = exports.ParentBlock = exports.MultisigMessage = exports.Multisig = exports.LevinPayloads = exports.LevinProtocol = exports.LevinPacket = exports.LedgerNote = exports.LedgerTransport = exports.LedgerDevice = exports.CryptoNote = exports.CryptoType = exports.Crypto = exports.BlockTemplate = exports.Block = exports.AddressPrefix = exports.Address = void 0;
const turtlecoin_crypto_1 = require("turtlecoin-crypto");
/** @ignore */
const Types = require("./Types");
var Address_1 = require("./Address");
Object.defineProperty(exports, "Address", { enumerable: true, get: function () { return Address_1.Address; } });
var AddressPrefix_1 = require("./AddressPrefix");
Object.defineProperty(exports, "AddressPrefix", { enumerable: true, get: function () { return AddressPrefix_1.AddressPrefix; } });
var Block_1 = require("./Block");
Object.defineProperty(exports, "Block", { enumerable: true, get: function () { return Block_1.Block; } });
var BlockTemplate_1 = require("./BlockTemplate");
Object.defineProperty(exports, "BlockTemplate", { enumerable: true, get: function () { return BlockTemplate_1.BlockTemplate; } });
var turtlecoin_crypto_2 = require("turtlecoin-crypto");
Object.defineProperty(exports, "Crypto", { enumerable: true, get: function () { return turtlecoin_crypto_2.Crypto; } });
Object.defineProperty(exports, "CryptoType", { enumerable: true, get: function () { return turtlecoin_crypto_2.CryptoType; } });
var CryptoNote_1 = require("./CryptoNote");
Object.defineProperty(exports, "CryptoNote", { enumerable: true, get: function () { return CryptoNote_1.CryptoNote; } });
var LedgerDevice_1 = require("./LedgerDevice");
Object.defineProperty(exports, "LedgerDevice", { enumerable: true, get: function () { return LedgerDevice_1.LedgerDevice; } });
Object.defineProperty(exports, "LedgerTransport", { enumerable: true, get: function () { return LedgerDevice_1.LedgerTransport; } });
var LedgerNote_1 = require("./LedgerNote");
Object.defineProperty(exports, "LedgerNote", { enumerable: true, get: function () { return LedgerNote_1.LedgerNote; } });
var LevinPacket_1 = require("./LevinPacket");
Object.defineProperty(exports, "LevinPacket", { enumerable: true, get: function () { return LevinPacket_1.LevinPacket; } });
Object.defineProperty(exports, "LevinProtocol", { enumerable: true, get: function () { return LevinPacket_1.LevinProtocol; } });
var LevinPayloads_1 = require("./Types/LevinPayloads");
Object.defineProperty(exports, "LevinPayloads", { enumerable: true, get: function () { return LevinPayloads_1.LevinPayloads; } });
var Multisig_1 = require("./Multisig");
Object.defineProperty(exports, "Multisig", { enumerable: true, get: function () { return Multisig_1.Multisig; } });
var MultisigMessage_1 = require("./MultisigMessage");
Object.defineProperty(exports, "MultisigMessage", { enumerable: true, get: function () { return MultisigMessage_1.MultisigMessage; } });
var ParentBlock_1 = require("./ParentBlock");
Object.defineProperty(exports, "ParentBlock", { enumerable: true, get: function () { return ParentBlock_1.ParentBlock; } });
var Transaction_1 = require("./Transaction");
Object.defineProperty(exports, "Transaction", { enumerable: true, get: function () { return Transaction_1.Transaction; } });
var LegacyTurtleCoind_1 = require("./LegacyTurtleCoind");
Object.defineProperty(exports, "LegacyTurtleCoind", { enumerable: true, get: function () { return LegacyTurtleCoind_1.LegacyTurtleCoind; } });
var TurtleCoind_1 = require("./TurtleCoind");
Object.defineProperty(exports, "TurtleCoind", { enumerable: true, get: function () { return TurtleCoind_1.TurtleCoind; } });
var WalletAPI_1 = require("./WalletAPI");
Object.defineProperty(exports, "WalletAPI", { enumerable: true, get: function () { return WalletAPI_1.WalletAPI; } });
/** @ignore */
var TransactionOutputs = Types.TransactionOutputs;
exports.TransactionOutputs = TransactionOutputs;
/** @ignore */
var TransactionInputs = Types.TransactionInputs;
exports.TransactionInputs = TransactionInputs;
/** @ignore */
var KeyInput = TransactionInputs.KeyInput;
exports.KeyInput = KeyInput;
/** @ignore */
var KeyOutput = TransactionOutputs.KeyOutput;
exports.KeyOutput = KeyOutput;
/** @ignore */
var KeyPair = Types.ED25519.KeyPair;
exports.KeyPair = KeyPair;
/** @ignore */
var Keys = Types.ED25519.Keys;
exports.Keys = Keys;
/** @ignore */
var LedgerError = Types.LedgerTypes.LedgerError;
exports.LedgerError = LedgerError;
/** @ignore */
var LedgerTransactionState = Types.LedgerTypes.TransactionState;
exports.LedgerTransactionState = LedgerTransactionState;
/** @ignore */
var LedgerErrorCode = Types.LedgerTypes.ErrorCode;
exports.LedgerErrorCode = LedgerErrorCode;
var ICryptoNote = Types.CryptoNoteInterfaces.ICryptoNote;
exports.ICryptoNote = ICryptoNote;
var TurtleCoindTypes = Types.TurtleCoindTypes;
exports.TurtleCoindTypes = TurtleCoindTypes;
/**
 * Executes the callback method upon the given event
 * @param event
 * @param callback
 */
function on(event, callback) {
    if (event.toLowerCase() === 'ready') {
        const check = () => setTimeout(() => {
            if (turtlecoin_crypto_1.Crypto.isReady) {
                return callback();
            }
            else {
                check();
            }
        }, 100);
        check();
    }
}
exports.on = on;
