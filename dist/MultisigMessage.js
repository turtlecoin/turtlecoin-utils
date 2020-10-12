"use strict";
// Copyright (c) 2020, The TurtleCoin Developers
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
exports.MultisigMessage = void 0;
const Address_1 = require("./Address");
const AddressPrefix_1 = require("./AddressPrefix");
const Types_1 = require("./Types");
const aes_js_1 = require("aes-js");
const bytestream_1 = require("@turtlecoin/bytestream");
const base58_1 = require("@turtlecoin/base58");
/** @ignore */
const messagePrefix = 0xde0aec198;
/**
 * Represents a Multisignature inter-wallet Message that is used to exchange data between multisignature participants
 */
class MultisigMessage {
    /**
     * Constructs a new instance of a MultisigMessage object
     * @param [source] The source individual wallet address that the message is being sent FROM
     * @param [destination] The destination individual wallet address the message is being sent TO
     * @param [nonce] A one-time nonce value that should increment/change for every message
     * exchanged between the wallets
     */
    constructor(source, destination, nonce) {
        this.m_source = new Address_1.Address();
        this.m_spendKeys = [];
        this.m_privateViewKey = new Types_1.ED25519.KeyPair();
        this.m_nonce = 1;
        this.m_partialKeyImages = [];
        this.m_partialSigningKeys = [];
        this.m_preparedTransactions = [];
        this.m_destination = new Address_1.Address();
        if (source) {
            this.source = source;
        }
        if (destination) {
            this.destination = destination;
        }
        if (nonce) {
            this.m_nonce = nonce;
        }
    }
    /**
     * The private view key communicated in the message
     */
    get view() {
        return this.m_privateViewKey.privateKey;
    }
    /**
     * The source individual wallet address that the message is being sent FROM
     */
    get source() {
        return this.m_source;
    }
    set source(source) {
        if (source.view.privateKey.length === 0) {
            throw new Error('Source private view key not available');
        }
        this.m_source = source;
        this.m_privateViewKey = source.view;
    }
    /**
     * The destination individual wallet address the message is being sent TO
     */
    get destination() {
        return this.m_destination;
    }
    set destination(destination) {
        this.m_destination = destination;
    }
    /**
     * A one-time nonce value that should increment/change for every message exchanged between the wallets
     */
    get nonce() {
        return this.m_nonce;
    }
    /**
     * The multisig public spend keys transferred in the message
     */
    get spendKeys() {
        return this.m_spendKeys;
    }
    /**
     * The partial key images transferred in the message
     */
    get partialKeyImages() {
        return this.m_partialKeyImages;
    }
    set partialKeyImages(partialKeyImages) {
        this.m_partialKeyImages = partialKeyImages;
    }
    /**
     * The partial signing keys transferred in the message
     */
    get partialSigningKeys() {
        return this.m_partialSigningKeys;
    }
    set partialSigningKeys(partialSigningKeys) {
        this.m_partialSigningKeys = partialSigningKeys;
    }
    /**
     * The prepared transactions transferred in the message
     */
    get preparedTransactions() {
        return this.m_preparedTransactions;
    }
    set preparedTransactions(preparedTransactions) {
        this.m_preparedTransactions = preparedTransactions;
    }
    /**
     * Decodes a Base58 string into a multisig message object.
     *
     * This method validates that all signatures included in the data are valid, the data is properly
     * decrypted, and the signatures of the public keys included in the payload(s) are valid
     *
     * @async
     * @param destination The wallet address that this message was sent
     * @param base58 The Base58 encoded data
     */
    static decode(destination, base58) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!destination.spend.isPaired) {
                throw new Error('Cannot attempt decryption without private spend key');
            }
            const prefix = new AddressPrefix_1.AddressPrefix(messagePrefix);
            const decoded = base58_1.Base58.decode(base58);
            const signature = decoded.slice(-128);
            const rawData = decoded.slice(0, decoded.length - 128);
            const hash = yield Types_1.TurtleCoinCrypto.cn_fast_hash(rawData);
            const reader = new bytestream_1.Reader(rawData);
            const foundPrefix = reader.hex(prefix.varint.length);
            if (foundPrefix !== prefix.hex) {
                throw new Error('Invalid data supplied');
            }
            const nonce = reader.varint().toJSNumber();
            const length = reader.varint().toJSNumber();
            const transfer = JSON.parse(reader.bytes(length).toString());
            const source = yield Address_1.Address.fromAddress(transfer.address);
            if (!(yield Types_1.TurtleCoinCrypto.checkSignature(hash, source.spend.publicKey, signature))) {
                throw new Error('Invalid data signature');
            }
            if (reader.unreadBytes !== 0) {
                throw new RangeError('Data contains unstructured information');
            }
            const result = new MultisigMessage();
            result.m_source = source;
            result.destination = destination;
            result.m_nonce = nonce;
            const payload = yield decrypt(destination, transfer, nonce);
            for (const publicSpendKey of payload.publicSpendKeys) {
                result.m_spendKeys.push(yield Types_1.ED25519.KeyPair.from(publicSpendKey.key));
            }
            if (payload.partialKeyImages) {
                result.partialKeyImages = payload.partialKeyImages;
            }
            if (payload.partialSigningKeys) {
                result.partialSigningKeys = payload.partialSigningKeys;
            }
            if (payload.preparedTransactions) {
                result.preparedTransactions = payload.preparedTransactions;
            }
            result.m_privateViewKey = yield Types_1.ED25519.KeyPair.from(undefined, payload.privateViewKey);
            yield verifySpendKeySignatures(payload.publicSpendKeys);
            return result;
        });
    }
    /**
     * Adds a new set of spend keys to the message
     *
     * Note: The key pair must be complete (both private and public) to complete the necessary
     * signing processes to provide proof that we have the private key for the given public key.
     *
     * @param keypair The spend key pair to include.
     */
    addSpendKeys(keypair) {
        if (!keypair.isPaired) {
            throw new Error('The private key and public key are not cryptographically paired');
        }
        for (const k of this.m_spendKeys) {
            if (k.publicKey === keypair.publicKey) {
                return false;
            }
        }
        this.m_spendKeys.push(keypair);
        return true;
    }
    /**
     * Encodes the multisig message object as a Base58 encoded string that can be easily
     *
     * This method performs all necessary signing of the supplied public keys, encrypts the payload,
     * and signs the message to prevent tampering and protect the confidential information inside.
     *
     * transferred between multisig wallet participants
     * @async
     * @returns The Base58 encoded string for transmission
     */
    encode() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.source.spend.isPaired) {
                throw new Error('Cannot encode as we do not have the full key pair to do so [SPEND]');
            }
            if (!this.source.view.isPaired) {
                throw new Error('Cannot encode as we do not have the full key pair to do so [VIEW]');
            }
            const payload = {
                publicSpendKeys: yield calculateSpendKeySignatures(this.spendKeys),
                privateViewKey: this.source.view.privateKey
            };
            if (this.partialKeyImages.length !== 0) {
                payload.partialKeyImages = this.partialKeyImages;
            }
            if (this.partialSigningKeys.length !== 0) {
                payload.partialSigningKeys = this.partialSigningKeys;
            }
            if (this.preparedTransactions.length !== 0) {
                payload.preparedTransactions = this.preparedTransactions;
            }
            const prefix = new AddressPrefix_1.AddressPrefix(messagePrefix);
            const writer = new bytestream_1.Writer();
            writer.hex(prefix.hex);
            writer.varint(this.nonce);
            const transfer = yield encrypt(this.source, this.destination, payload, this.nonce);
            const subWriter = new bytestream_1.Writer();
            subWriter.write(transfer);
            writer.varint(subWriter.length);
            writer.write(subWriter.buffer);
            const hash = yield Types_1.TurtleCoinCrypto.cn_fast_hash(writer.blob);
            const sig = yield Types_1.TurtleCoinCrypto.generateSignature(hash, this.source.spend.publicKey, this.source.spend.privateKey);
            writer.hex(sig);
            return base58_1.Base58.encode(writer.blob);
        });
    }
}
exports.MultisigMessage = MultisigMessage;
/** @ignore */
function encrypt(source, destination, payload, nonce) {
    return __awaiter(this, void 0, void 0, function* () {
        const transfer = Buffer.from(JSON.stringify(payload));
        const aesKey = Buffer.from(yield Types_1.TurtleCoinCrypto.generateKeyDerivation(destination.spend.publicKey, source.spend.privateKey), 'hex');
        // eslint-disable-next-line new-cap
        const ctx = new aes_js_1.ModeOfOperation.ctr(aesKey, new aes_js_1.Counter(nonce));
        const encryptedBytes = ctx.encrypt(transfer);
        return {
            address: yield source.address(),
            messageId: nonce,
            payload: aes_js_1.utils.hex.fromBytes(encryptedBytes)
        };
    });
}
/** @ignore */
function decrypt(destination, transfer, nonce) {
    return __awaiter(this, void 0, void 0, function* () {
        const sender = yield Address_1.Address.fromAddress(transfer.address);
        const aesKey = Buffer.from(yield Types_1.TurtleCoinCrypto.generateKeyDerivation(sender.spend.publicKey, destination.spend.privateKey), 'hex');
        // eslint-disable-next-line new-cap
        const ctx = new aes_js_1.ModeOfOperation.ctr(aesKey, new aes_js_1.Counter(nonce));
        const decryptedBytes = ctx.decrypt(aes_js_1.utils.hex.toBytes(transfer.payload));
        try {
            return JSON.parse(Buffer.from(decryptedBytes).toString());
        }
        catch (_a) {
            throw new Error('Could not decrypt transfer');
        }
    });
}
/** @ignore */
function calculateSpendKeySignatures(spendKeys) {
    return __awaiter(this, void 0, void 0, function* () {
        const signatures = [];
        for (const keys of spendKeys) {
            if (!keys.isPaired) {
                throw new Error('The supplied spend keys are not paired correctly');
            }
            const sig = yield Types_1.TurtleCoinCrypto.generateSignature(keys.publicKey, keys.publicKey, keys.privateKey);
            signatures.push({ key: keys.publicKey, signature: sig });
        }
        return signatures;
    });
}
/** @ignore */
function verifySpendKeySignatures(spendKeys) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const spendKey of spendKeys) {
            if (!(yield Types_1.TurtleCoinCrypto.checkSignature(spendKey.key, spendKey.key, spendKey.signature))) {
                throw new Error('Invalid public spend key signature for: ' + spendKey.key);
            }
        }
    });
}
