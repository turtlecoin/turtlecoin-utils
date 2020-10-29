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
exports.Transaction = void 0;
const Common_1 = require("./Common");
const Address_1 = require("./Address");
const Types_1 = require("./Types");
const bytestream_1 = require("@turtlecoin/bytestream");
/** @ignore */
const TransactionVersion2Suffix = 'bc36789e7a1e281436464229828f817d6612f7b477d66591ff96a9e064bcc98a' +
    '0000000000000000000000000000000000000000000000000000000000000000';
/**
 * Represents a TurtleCoin Transaction
 */
class Transaction {
    constructor() {
        this.version = 1;
        this.inputs = [];
        this.outputs = [];
        this.signatures = [];
        this.ignoredField = 0;
        this.transactionKeys = new Types_1.ED25519.KeyPair();
        this.m_unlockTime = Types_1.BigInteger.zero;
        this.m_rawExtra = Buffer.alloc(0);
        this.m_readonly = false;
        this.m_extra = [];
        this.m_cached = { prefix: '', prefixHash: '', blob: '', hash: '' };
    }
    /**
     * Returns the total amount of the inputs
     */
    get inputAmount() {
        let amount = Types_1.BigInteger.zero;
        for (const input of this.inputs) {
            if (input.type === Types_1.TransactionInputs.InputType.KEY) {
                amount = amount.add(input.amount);
            }
        }
        return amount.toJSNumber();
    }
    /**
     * Returns the total amount of the outputs
     */
    get outputAmount() {
        let amount = Types_1.BigInteger.zero;
        for (const output of this.outputs) {
            if (output.type === Types_1.TransactionOutputs.OutputType.KEY) {
                amount = amount.add(output.amount);
            }
        }
        return amount.toJSNumber();
    }
    /**
     * Returns whether this is a coinbase transaction or not
     */
    get isCoinbase() {
        for (const input of this.inputs) {
            if (input.type === Types_1.TransactionInputs.InputType.COINBASE) {
                return true;
            }
        }
        return false;
    }
    /**
     * Calculates the transaction fingerprint if the transaction
     * is a coinbase transaction and it contains the information
     * necessary to do so
     */
    fingerprint() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isCoinbase) {
                return;
            }
            if (!this.recipientPublicViewKey || !this.recipientPublicSpendKey) {
                return;
            }
            const writer = new bytestream_1.Writer();
            writer.hash(this.recipientPublicSpendKey);
            writer.hash(this.recipientPublicViewKey);
            return Types_1.TurtleCoinCrypto.cn_fast_hash(writer.blob);
        });
    }
    /**
     * Returns the recipient address if this is a coinbase
     * transaction and the information is available
     */
    recipient() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isCoinbase) {
                return;
            }
            if (!this.recipientPublicSpendKey || !this.recipientPublicViewKey) {
                return;
            }
            return Address_1.Address.fromPublicKeys(this.recipientPublicSpendKey, this.recipientPublicViewKey);
        });
    }
    /**
     * Returns the total amount transferred in the transaction
     */
    get amount() {
        if (this.isCoinbase) {
            return this.outputAmount;
        }
        return this.inputAmount;
    }
    /**
     * Returns the transaction extra as a buffer
     */
    get extra() {
        if (!this.m_readonly) {
            return writeExtra(this.m_extra);
        }
        return this.m_rawExtra;
    }
    /**
     * Returns the structured arbitrary data found in the transaction extra
     */
    get extraData() {
        let result = Buffer.alloc(0);
        for (const tag of this.m_extra) {
            if (tag.tag === Types_1.ExtraTag.ExtraTagType.NONCE) {
                const innerTag = tag;
                for (const subTag of innerTag.tags) {
                    if (subTag.tag === Types_1.ExtraNonceTag.NonceTagType.EXTRA_DATA) {
                        result = subTag.data;
                    }
                }
            }
        }
        return result;
    }
    /**
     * Returns the fee of the transaction
     */
    get fee() {
        return this.amount - this.outputAmount;
    }
    /**
     * Returns the transaction hash
     */
    hash() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.m_cached.blob && this.m_cached.blob === this.toString() && this.m_cached.hash) {
                return this.m_cached.hash;
            }
            this.m_cached.blob = this.toString();
            const hash = yield Types_1.TurtleCoinCrypto.cn_fast_hash(this.m_cached.blob);
            if (this.version >= 2) {
                const hash2 = yield Types_1.TurtleCoinCrypto.cn_fast_hash(hash + TransactionVersion2Suffix);
                this.m_cached.hash = hash2;
                return hash2;
            }
            this.m_cached.hash = hash;
            return hash;
        });
    }
    /**
     * Returns the merged mining tag found within the transaction
     */
    get mergedMining() {
        let result;
        for (const tag of this.m_extra) {
            if (tag.tag === Types_1.ExtraTag.ExtraTagType.MERGED_MINING) {
                result = tag;
            }
        }
        return result;
    }
    /**
     * Returns the payment ID found within the transaction
     */
    get paymentId() {
        let result;
        for (const tag of this.m_extra) {
            if (tag.tag === Types_1.ExtraTag.ExtraTagType.NONCE) {
                const innerTag = tag;
                for (const subTag of innerTag.tags) {
                    if (subTag.tag === Types_1.ExtraNonceTag.NonceTagType.PAYMENT_ID) {
                        result = subTag.paymentId;
                    }
                }
            }
        }
        return result;
    }
    /**
     * Increments the pool nonce by 1
     */
    incrementPoolNonce() {
        this.poolNonce = this.poolNonce.add(1);
    }
    /**
     * Returns pool nonce field within the transaction as Buffer
     */
    get poolNonce() {
        let result;
        for (const tag of this.m_extra) {
            if (tag.tag === Types_1.ExtraTag.ExtraTagType.POOL_NONCE) {
                result = Types_1.BigInteger(tag.data
                    .toString('hex'));
            }
        }
        if (!result) {
            return Types_1.BigInteger.zero;
        }
        else {
            return result;
        }
    }
    /**
     * Sets the pool nonce field within the transaction from a Buffer
     * @param nonce the nonce data to use
     */
    set poolNonce(nonce) {
        if (!nonce) {
            this.m_extra = removeExtraTag(this.m_extra, Types_1.ExtraTag.ExtraTagType.POOL_NONCE);
            return;
        }
        const buffer = Common_1.Common.hexPadToBuffer(nonce);
        const tag = new Types_1.ExtraTag.ExtraPoolNonce(buffer);
        this.m_extra = removeExtraTag(this.m_extra, tag.tag);
        this.m_extra.push(tag);
        this.m_extra.sort((a, b) => (a.tag > b.tag) ? 1 : -1);
    }
    /**
     * Returns the pool nonce field as hexadecimal text
     */
    get poolNonceHex() {
        for (const tag of this.m_extra) {
            if (tag.tag === Types_1.ExtraTag.ExtraTagType.POOL_NONCE) {
                return tag.data
                    .toString('hex');
            }
        }
        return undefined;
    }
    /**
     * Returns the transaction prefix in hexadecimal (blob) form
     */
    get prefix() {
        return this.toBuffer(true).toString('hex');
    }
    /**
     * Returns the transaction prefix hash
     */
    prefixHash() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.m_cached.prefix && this.m_cached.prefix === this.prefix && this.m_cached.prefixHash) {
                return this.m_cached.prefixHash;
            }
            this.m_cached.prefix = this.prefix;
            const hash = yield Types_1.TurtleCoinCrypto.cn_fast_hash(this.m_cached.prefix);
            if (this.version >= 2) {
                const hash2 = yield Types_1.TurtleCoinCrypto.cn_fast_hash(hash + TransactionVersion2Suffix);
                this.m_cached.prefixHash = hash2;
                return hash2;
            }
            this.m_cached.prefixHash = hash;
            return hash;
        });
    }
    /**
     * Returns the transaction public key (if available)
     */
    get publicKey() {
        let result;
        for (const tag of this.m_extra) {
            if (tag.tag === Types_1.ExtraTag.ExtraTagType.PUBKEY) {
                result = tag.publicKey;
            }
        }
        if (!result && this.transactionKeys.publicKey) {
            result = this.transactionKeys.publicKey;
        }
        return result;
    }
    /**
     * Returns the transaction private key (if available)
     */
    get privateKey() {
        let result;
        for (const tag of this.m_extra) {
            if (tag.tag === Types_1.ExtraTag.ExtraTagType.TRANSACTION_PRIVATE_KEY) {
                result = tag.privateKey;
            }
        }
        if (!result && this.transactionKeys.privateKey) {
            result = this.transactionKeys.privateKey;
        }
        return result;
    }
    /**
     * Returns the transacton recipient public view key (if available)
     */
    get recipientPublicViewKey() {
        let result;
        for (const tag of this.m_extra) {
            if (tag.tag === Types_1.ExtraTag.ExtraTagType.RECIPIENT_PUBLIC_VIEW_KEY) {
                result = tag.publicKey;
            }
        }
        return result;
    }
    /**
     * Returns the transacton recipient public spend key (if available)
     */
    get recipientPublicSpendKey() {
        let result;
        for (const tag of this.m_extra) {
            if (tag.tag === Types_1.ExtraTag.ExtraTagType.RECIPIENT_PUBLIC_SPEND_KEY) {
                result = tag.publicKey;
            }
        }
        return result;
    }
    /**
     * Returns the transaction size in bytes
     */
    get size() {
        return this.toBuffer().length;
    }
    /**
     * The unlock time (or block height) for when the funds in the transaction are made available.
     * Returns a BigInteger only if the value exceeds MAX_SAFE_INTEGER
     */
    get unlockTime() {
        if (this.m_unlockTime.greater(Number.MAX_SAFE_INTEGER)) {
            return this.m_unlockTime;
        }
        else {
            return this.m_unlockTime.toJSNumber();
        }
    }
    set unlockTime(value) {
        if (typeof value === 'number') {
            value = Types_1.BigInteger(value);
        }
        this.m_unlockTime = value;
    }
    /**
     * Whether the transaction data is read only
     * This is only set if the transaction is created from a blob as it is unlikely that
     * we will be changing data after a transaction is created and signed as it would
     * invalidate the transaction signatures
     */
    get readonly() {
        return this.m_readonly;
    }
    set readonly(value) {
        this.m_readonly = value;
    }
    /**
     * Constructs a new transaction from an existing transaction blob
     * @param data the transaction data blob
     * @returns the new transaction object
     */
    static from(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = new Transaction();
            const reader = new bytestream_1.Reader(data);
            result.m_readonly = true;
            result.version = reader.varint().toJSNumber();
            result.unlockTime = reader.varint();
            const inputsCount = reader.varint().toJSNumber();
            for (let i = 0; i < inputsCount; i++) {
                const type = reader.uint8_t().toJSNumber();
                switch (type) {
                    case Types_1.TransactionInputs.InputType.COINBASE:
                        {
                            const blockIndex = reader.varint().toJSNumber();
                            result.inputs.push(new Types_1.TransactionInputs.CoinbaseInput(blockIndex));
                        }
                        break;
                    case Types_1.TransactionInputs.InputType.KEY:
                        {
                            const amount = reader.varint();
                            const keyOffsets = [];
                            const keyOffsetsLength = reader.varint().toJSNumber();
                            for (let j = 0; j < keyOffsetsLength; j++) {
                                keyOffsets.push(reader.varint());
                            }
                            const keyImage = reader.hash();
                            result.inputs.push(new Types_1.TransactionInputs.KeyInput(amount, keyOffsets, keyImage));
                        }
                        break;
                    default:
                        throw new Error('Unknown input type');
                }
            }
            const outputsCount = reader.varint().toJSNumber();
            for (let i = 0; i < outputsCount; i++) {
                const amount = reader.varint();
                const type = reader.uint8_t().toJSNumber();
                if (type === Types_1.TransactionOutputs.OutputType.KEY) {
                    const key = reader.hash();
                    result.outputs.push(new Types_1.TransactionOutputs.KeyOutput(amount, key));
                }
                else {
                    throw new Error('Unknown output type');
                }
            }
            const extraLength = reader.varint().toJSNumber();
            result.m_rawExtra = reader.bytes(extraLength);
            result.m_extra = readExtra(result.m_rawExtra);
            if (result.publicKey) {
                yield result.transactionKeys.setPublicKey(result.publicKey);
            }
            /* If there are bytes remaining and mod 64 then they are signatures */
            if (reader.unreadBytes > 0 && reader.unreadBytes % 64 === 0) {
                for (const input of result.inputs) {
                    if (input.type === Types_1.TransactionInputs.InputType.COINBASE) {
                        continue;
                    }
                    const inputObject = input;
                    const signatures = [];
                    for (let i = 0; i < inputObject.keyOffsets.length; i++) {
                        const sig = reader.hex(64);
                        if (!Common_1.Common.isHex128(sig)) {
                            throw new Error('Invalid signature data detected');
                        }
                        signatures.push(sig);
                    }
                    result.signatures.push(signatures);
                }
            }
            if (reader.unreadBytes > 0) {
                throw new RangeError('Unstructured data found at the end of the transaction');
            }
            return result;
        });
    }
    /** @ignore */
    parseExtra(extra) {
        return __awaiter(this, void 0, void 0, function* () {
            this.m_readonly = true;
            this.m_rawExtra = extra;
            this.m_extra = readExtra(this.m_rawExtra);
            if (this.publicKey && (yield Types_1.TurtleCoinCrypto.checkKey(this.publicKey))) {
                yield this.transactionKeys.setPublicKey(this.publicKey);
            }
        });
    }
    /**
     * Adds the arbitrary data supplied to the transaction extra field
     * @param data arbitrary data to be included
     */
    addData(data) {
        if (this.readonly) {
            throw new Error('Transaction is read-only');
        }
        const subTag = new Types_1.ExtraNonceTag.ExtraNonceData(data);
        let found = false;
        for (let i = 0; i < this.m_extra.length; i++) {
            if (this.m_extra[i].tag === Types_1.ExtraTag.ExtraTagType.NONCE) {
                this.m_extra[i].addTag(subTag);
                found = true;
            }
        }
        if (!found) {
            const tag = new Types_1.ExtraTag.ExtraNonce([subTag]);
            this.m_extra.push(tag);
        }
    }
    /**
     * Adds a merged minging tag with the supplied values to the transaction
     * @param depth the depth of the blockchain branch in the merkle root
     * @param merkleRoot the merkle root value
     */
    addMergedMining(depth, merkleRoot) {
        if (this.readonly) {
            throw new Error('Transaction is read-only');
        }
        const tag = new Types_1.ExtraTag.ExtraMergedMining(depth, merkleRoot);
        this.m_extra = removeExtraTag(this.m_extra, tag.tag);
        this.m_extra.push(tag);
        this.m_extra.sort((a, b) => (a.tag > b.tag) ? 1 : -1);
    }
    /**
     * Adds the supplied payment ID to the transaction extra field
     * @param paymentId the payment Id to include
     */
    addPaymentId(paymentId) {
        if (this.readonly) {
            throw new Error('Transaction is read-only');
        }
        const subTag = new Types_1.ExtraNonceTag.ExtraNoncePaymentId(paymentId);
        let found = false;
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < this.m_extra.length; i++) {
            if (this.m_extra[i].tag === Types_1.ExtraTag.ExtraTagType.NONCE) {
                this.m_extra[i].addTag(subTag);
                found = true;
            }
        }
        if (!found) {
            const tag = new Types_1.ExtraTag.ExtraNonce([subTag]);
            this.m_extra.push(tag);
        }
    }
    /**
     * Adds the public key for the transaction to the transaction extra field
     * @param publicKey the public key of the transaction
     */
    addPublicKey(publicKey) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.readonly) {
                throw new Error('Transaction is read-only');
            }
            const tag = new Types_1.ExtraTag.ExtraPublicKey(publicKey);
            this.m_extra = removeExtraTag(this.m_extra, tag.tag);
            this.m_extra.push(tag);
            this.m_extra.sort((a, b) => (a.tag > b.tag) ? 1 : -1);
            yield this.transactionKeys.setPublicKey(publicKey);
        });
    }
    /**
     * Adds the private key for the transaction to the transaction extra field
     * @param privateKey the private key of the transaction
     */
    addPrivateKey(privateKey) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.readonly) {
                throw new Error('Transaction is read-only');
            }
            const tag = new Types_1.ExtraTag.ExtraTransactionPrivateKey(privateKey);
            this.m_extra = removeExtraTag(this.m_extra, tag.tag);
            this.m_extra.push(tag);
            this.m_extra.sort((a, b) => (a.tag > b.tag) ? 1 : -1);
            yield this.transactionKeys.setPrivateKey(privateKey);
        });
    }
    /**
     * Returns a buffer representation of the transaction object
     * @param [headerOnly] whether we should return just the prefix or not
     * @returns the buffer representation
     */
    toBuffer(headerOnly = false) {
        const writer = new bytestream_1.Writer();
        writer.varint(this.version);
        writer.varint(this.unlockTime);
        writer.varint(this.inputs.length);
        for (const input of this.inputs) {
            writer.write(input.toBuffer());
        }
        writer.varint(this.outputs.length);
        for (const output of this.outputs) {
            writer.write(output.toBuffer());
        }
        if (this.readonly) {
            writer.varint(this.m_rawExtra.length);
            writer.write(this.m_rawExtra);
        }
        else {
            const extra = writeExtra(this.m_extra);
            writer.varint(extra.length);
            writer.write(extra);
        }
        if (!headerOnly && this.signatures.length !== 0) {
            if (this.inputs.length !== this.signatures.length) {
                throw new RangeError('Number of signatures does not match the number of inputs');
            }
            for (let i = 0; i < this.inputs.length; i++) {
                for (const sig of this.signatures[i]) {
                    writer.hex(sig);
                }
            }
        }
        return writer.buffer;
    }
    /**
     * Returns the hexadecimal (blob) representation of the transaction object
     * @param [headerOnly] whether we should return just the prefix or not
     * @returns the hexadecimal (blob)  representation
     */
    toString(headerOnly = false) {
        return this.toBuffer(headerOnly).toString('hex');
    }
}
exports.Transaction = Transaction;
/** @ignore */
function removeExtraTag(tags, removeTag) {
    const result = [];
    for (const tag of tags) {
        if (tag.tag !== removeTag) {
            result.push(tag);
        }
    }
    return result;
}
/** @ignore */
function readExtra(data) {
    const tags = [];
    const seen = {
        padding: false,
        publicKey: false,
        nonce: false,
        mergedMining: false,
        transactionPrivateKey: false,
        recipientPublicViewKey: false,
        recipientPublicSpendKey: false,
        poolNonce: false
    };
    const reader = new bytestream_1.Reader(data);
    while (reader.unreadBytes > 0) {
        let tag = 0;
        try {
            tag = reader.varint(true).toJSNumber();
        }
        catch (_a) {
            reader.skip();
            continue;
        }
        let totalLength = Common_1.Common.varintLength(tag);
        switch (tag) {
            case Types_1.ExtraTag.ExtraTagType.PADDING:
                if (!seen.padding) {
                    try {
                        tags.push(Types_1.ExtraTag.ExtraPadding.from(reader.bytes(totalLength)));
                        seen.padding = true;
                    }
                    catch (e) {
                        reader.skip();
                    }
                }
                else {
                    reader.skip();
                }
                break;
            case Types_1.ExtraTag.ExtraTagType.PUBKEY:
                totalLength += 32;
                if (!seen.publicKey && reader.unreadBytes >= totalLength) {
                    try {
                        tags.push(Types_1.ExtraTag.ExtraPublicKey.from(reader.bytes(totalLength)));
                        seen.publicKey = true;
                    }
                    catch (e) {
                        reader.skip();
                    }
                }
                else {
                    reader.skip();
                }
                break;
            case Types_1.ExtraTag.ExtraTagType.NONCE:
                if (!seen.nonce && reader.unreadBytes >= 1) {
                    const tmpReader = new bytestream_1.Reader(reader.unreadBuffer);
                    tmpReader.skip(totalLength);
                    let nonceLength = 0;
                    try {
                        nonceLength = tmpReader.varint().toJSNumber();
                        if (nonceLength > reader.unreadBytes) {
                            reader.skip();
                            continue;
                        }
                    }
                    catch (_b) {
                        reader.skip();
                        continue;
                    }
                    totalLength += Common_1.Common.varintLength(nonceLength) + nonceLength;
                    try {
                        tags.push(Types_1.ExtraTag.ExtraNonce.from(reader.bytes(totalLength)));
                        seen.nonce = true;
                    }
                    catch (e) {
                        reader.skip();
                    }
                }
                else {
                    reader.skip();
                }
                break;
            case Types_1.ExtraTag.ExtraTagType.MERGED_MINING:
                if (!seen.mergedMining && reader.unreadBytes >= 1) {
                    const tmpReader = new bytestream_1.Reader(reader.unreadBuffer);
                    tmpReader.skip(totalLength);
                    let mmLength = 0;
                    try {
                        mmLength = tmpReader.varint().toJSNumber();
                        if (mmLength > reader.unreadBytes) {
                            reader.skip();
                            continue;
                        }
                    }
                    catch (_c) {
                        reader.skip();
                        continue;
                    }
                    totalLength += Common_1.Common.varintLength(mmLength) + mmLength;
                    try {
                        tags.push(Types_1.ExtraTag.ExtraMergedMining.from(reader.bytes(totalLength)));
                        seen.mergedMining = true;
                    }
                    catch (e) {
                        reader.skip();
                    }
                }
                else {
                    reader.skip();
                }
                break;
            case Types_1.ExtraTag.ExtraTagType.TRANSACTION_PRIVATE_KEY:
                totalLength += 32;
                if (!seen.transactionPrivateKey && reader.unreadBytes >= totalLength) {
                    try {
                        tags.push(Types_1.ExtraTag.ExtraTransactionPrivateKey.from(reader.bytes(totalLength)));
                        seen.transactionPrivateKey = true;
                    }
                    catch (e) {
                        reader.skip();
                    }
                }
                else {
                    reader.skip();
                }
                break;
            case Types_1.ExtraTag.ExtraTagType.RECIPIENT_PUBLIC_VIEW_KEY:
                totalLength += 32;
                if (!seen.recipientPublicViewKey && reader.unreadBytes >= totalLength) {
                    try {
                        tags.push(Types_1.ExtraTag.ExtraRecipientPublicViewKey.from(reader.bytes(totalLength)));
                        seen.recipientPublicViewKey = true;
                    }
                    catch (e) {
                        reader.skip();
                    }
                }
                else {
                    reader.skip();
                }
                break;
            case Types_1.ExtraTag.ExtraTagType.RECIPIENT_PUBLIC_SPEND_KEY:
                totalLength += 32;
                if (!seen.recipientPublicSpendKey && reader.unreadBytes >= totalLength) {
                    try {
                        tags.push(Types_1.ExtraTag.ExtraRecipientPublicSpendKey.from(reader.bytes(totalLength)));
                        seen.recipientPublicSpendKey = true;
                    }
                    catch (e) {
                        reader.skip();
                    }
                }
                else {
                    reader.skip();
                }
                break;
            case Types_1.ExtraTag.ExtraTagType.POOL_NONCE:
                if (!seen.poolNonce) {
                    const tmpReader = new bytestream_1.Reader(reader.unreadBuffer);
                    tmpReader.skip(totalLength);
                    let nonceLength = 0;
                    try {
                        nonceLength = tmpReader.varint().toJSNumber();
                        if (nonceLength > reader.unreadBytes) {
                            reader.skip();
                            continue;
                        }
                    }
                    catch (_d) {
                        reader.skip();
                        continue;
                    }
                    totalLength += Common_1.Common.varintLength(nonceLength) + nonceLength;
                    try {
                        tags.push(Types_1.ExtraTag.ExtraPoolNonce.from(reader.bytes(totalLength)));
                        seen.nonce = true;
                    }
                    catch (e) {
                        reader.skip();
                    }
                }
                else {
                    reader.skip();
                }
                break;
            default:
                reader.skip();
                break;
        }
    }
    return tags;
}
/** @ignore */
function writeExtra(tags) {
    const writer = new bytestream_1.Writer();
    for (const tag of tags) {
        writer.write(tag.toBuffer());
    }
    return writer.buffer;
}
