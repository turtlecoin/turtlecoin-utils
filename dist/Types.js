"use strict";
// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BigInteger = exports.StorageType = exports.PortableStorage = exports.PortableStorageConstants = exports.TurtleCoinCrypto = void 0;
const turtlecoin_crypto_1 = require("turtlecoin-crypto");
const BigInteger = require("big-integer");
exports.BigInteger = BigInteger;
/** @ignore */
const TurtleCoinCrypto = new turtlecoin_crypto_1.Crypto();
exports.TurtleCoinCrypto = TurtleCoinCrypto;
/** @ignore */
var PortableStorageConstants;
(function (PortableStorageConstants) {
    PortableStorageConstants[PortableStorageConstants["SIGNATURE_A"] = 16847105] = "SIGNATURE_A";
    PortableStorageConstants[PortableStorageConstants["SIGNATURE_B"] = 16908545] = "SIGNATURE_B";
    PortableStorageConstants[PortableStorageConstants["VERSION"] = 1] = "VERSION";
})(PortableStorageConstants = exports.PortableStorageConstants || (exports.PortableStorageConstants = {}));
__exportStar(require("./Types/PortableStorageValue"), exports);
__exportStar(require("./Types/IExtraNonce"), exports);
__exportStar(require("./Types/IExtraTag"), exports);
__exportStar(require("./Types/ITransactionInput"), exports);
__exportStar(require("./Types/ITransactionOutput"), exports);
__exportStar(require("./Types/ED25519"), exports);
__exportStar(require("./Types/ITransaction"), exports);
__exportStar(require("./Types/MultisigInterfaces"), exports);
__exportStar(require("./Types/ICryptoNote"), exports);
__exportStar(require("./Types/Ledger"), exports);
__exportStar(require("./Types/WalletAPI"), exports);
__exportStar(require("./Types/LegacyTurtleCoind"), exports);
__exportStar(require("./Types/TurtleCoind"), exports);
var PortableStorage_1 = require("./Types/PortableStorage");
Object.defineProperty(exports, "PortableStorage", { enumerable: true, get: function () { return PortableStorage_1.PortableStorage; } });
Object.defineProperty(exports, "StorageType", { enumerable: true, get: function () { return PortableStorage_1.StorageType; } });
