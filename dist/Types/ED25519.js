"use strict";
// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ED25519 = void 0;
const Config_1 = require("../Config");
const Types_1 = require("../Types");
const crypto_1 = require("crypto");
var ED25519;
(function (ED25519) {
    /**
     * Represents a ED25519 Key Pair (private & public) and provides a few methods
     * for generating new key pairs including deterministic methods.
     */
    class KeyPair {
        /**
         * Constructs a new KeyPair object
         * @param publicKey
         * @param privateKey
         * @param entropy
         * @param iterations
         * @param createEmpty
         */
        static from(publicKey, privateKey, entropy, iterations, createEmpty = false) {
            return __awaiter(this, void 0, void 0, function* () {
                const pair = new KeyPair();
                if (createEmpty) {
                    return pair;
                }
                /* If no entropy was supplied, we'll go find our own */
                entropy = entropy || rand(256);
                if (publicKey && (yield Types_1.TurtleCoinCrypto.checkKey(publicKey))) {
                    pair.m_publicKey = publicKey;
                }
                if (privateKey && (yield Types_1.TurtleCoinCrypto.checkScalar(privateKey))) {
                    pair.m_privateKey = privateKey;
                }
                if (!publicKey && !privateKey) {
                    const temp = yield simpleKdf(entropy + rand(32), iterations || Config_1.Config.keccakIterations);
                    yield pair.setPrivateKey(temp);
                }
                if (pair.m_privateKey && !pair.m_publicKey) {
                    /* If we supplied a private key but no public key, and we said 1 iteration
                        we are probably looking to generate the deterministic view key for the
                        specified private spend key */
                    if (iterations && iterations === 1) {
                        const temp = yield Types_1.TurtleCoinCrypto.cn_fast_hash(pair.m_privateKey);
                        yield pair.setPrivateKey(temp);
                    }
                    pair.m_publicKey = yield Types_1.TurtleCoinCrypto.secretKeyToPublicKey(pair.m_privateKey);
                }
                return pair;
            });
        }
        /**
         * Returns the private key
         */
        get privateKey() {
            return (this.m_privateKey) ? this.m_privateKey : '';
        }
        /**
         * Sets the private key or reduces the value to a private key
         * @param key
         */
        setPrivateKey(key) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    this.m_privateKey = (yield Types_1.TurtleCoinCrypto.checkScalar(key))
                        ? key
                        : yield Types_1.TurtleCoinCrypto.scReduce32(key);
                }
                catch (e) {
                    this.m_publicKey = key;
                }
            });
        }
        /**
         * Returns the public key
         */
        get publicKey() {
            return (this.m_publicKey) ? this.m_publicKey : '';
        }
        /**
         * Sets the public key
         * @param key
         */
        setPublicKey(key) {
            return __awaiter(this, void 0, void 0, function* () {
                let isPubKey = false;
                // Try to verify that it is a public key via the library
                try {
                    isPubKey = yield Types_1.TurtleCoinCrypto.checkKey(key);
                }
                catch (e) {
                    // If the library could not process this, then set the key anyway
                    this.m_publicKey = key;
                    return;
                }
                if (isPubKey) {
                    this.m_publicKey = key;
                }
                else {
                    throw new Error('Not a public key');
                }
            });
        }
        /**
         * Returns if the public key belongs to the private key
         */
        isPaired() {
            return __awaiter(this, void 0, void 0, function* () {
                if (this.publicKey.length === 0 || this.privateKey.length === 0) {
                    return false;
                }
                return ((yield Types_1.TurtleCoinCrypto.secretKeyToPublicKey(this.privateKey)) === this.publicKey);
            });
        }
    }
    ED25519.KeyPair = KeyPair;
    /**
     * Represents a set of ED25519 key pairs (view and spend) used by TurtleCoin wallets
     */
    class Keys {
        constructor() {
            this.m_spendKeys = new KeyPair();
            this.m_viewKeys = new KeyPair();
        }
        /**
         * Creates a new instance of a set of Keys
         * @param spendKeys the spend key pair
         * @param viewKeys the view key pair
         */
        static from(spendKeys, viewKeys) {
            return __awaiter(this, void 0, void 0, function* () {
                const keys = new Keys();
                if (spendKeys) {
                    keys.m_spendKeys = spendKeys;
                }
                if (viewKeys) {
                    keys.m_viewKeys = viewKeys;
                }
                if (!spendKeys && !viewKeys) {
                    keys.m_spendKeys = yield KeyPair.from();
                    keys.m_viewKeys = yield KeyPair.from(undefined, keys.m_spendKeys.privateKey, undefined, 1);
                }
                return keys;
            });
        }
        /**
         * Returns the spend keys
         */
        get spend() {
            return this.m_spendKeys;
        }
        /**
         * Sets the spend keys
         * @param keys
         */
        set spend(keys) {
            this.m_spendKeys = keys;
        }
        /**
         * Returns the view keys
         */
        get view() {
            return this.m_viewKeys;
        }
        /**
         * Sets the view keys
         * @param keys
         */
        set view(keys) {
            this.m_viewKeys = keys;
        }
    }
    ED25519.Keys = Keys;
})(ED25519 = exports.ED25519 || (exports.ED25519 = {}));
/** @ignore */
function rand(bytes = 32) {
    return crypto_1.randomBytes(bytes)
        .toString('base64');
}
/** @ignore */
function simpleKdf(value, iterations) {
    return __awaiter(this, void 0, void 0, function* () {
        /** This is a very simple implementation of a pseudo PBKDF2 function */
        let hex = Buffer.from(value).toString('hex');
        for (let i = 0; i < iterations; i++) {
            hex = yield Types_1.TurtleCoinCrypto.cn_fast_hash(hex);
        }
        return hex;
    });
}
