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
exports.Block = void 0;
const Config_1 = require("./Config");
const Transaction_1 = require("./Transaction");
const ParentBlock_1 = require("./ParentBlock");
const Types_1 = require("./Types");
const bytestream_1 = require("@turtlecoin/bytestream");
const Common_1 = require("./Common");
/**
 * Represents a TurtleCoin Block
 */
class Block {
    constructor() {
        this.m_majorVersion = 0;
        this.m_minorVersion = 0;
        this.m_timestamp = new Date();
        this.m_previousBlockHash = ''.padStart(64, '0');
        this.m_parentBlock = new ParentBlock_1.ParentBlock();
        this.m_nonce = 0;
        this.m_minerTransaction = new Transaction_1.Transaction();
        this.m_transactions = [];
        this.m_config = Config_1.Config;
        this.m_cache = {
            blob: '',
            hash: '',
            longBlob: '',
            longHash: ''
        };
    }
    /**
     * The size of the block in bytes
     */
    get size() {
        return this.toBuffer().length;
    }
    /**
     * The height of the block
     */
    get height() {
        if (this.m_minerTransaction.inputs.length !== 0) {
            return this.m_minerTransaction.inputs[0].blockIndex;
        }
        else {
            return 0;
        }
    }
    /**
     * The nonce of the block
     */
    get nonce() {
        const writer = new bytestream_1.Writer();
        writer.uint32_t(this.m_nonce, true);
        const reader = new bytestream_1.Reader(writer.buffer);
        return reader.uint32_t().toJSNumber();
    }
    set nonce(value) {
        if (value > 0xFFFFFFFF) {
            throw new Error('value exceeds uint32_t maximum');
        }
        const writer = new bytestream_1.Writer();
        writer.uint32_t(value);
        const reader = new bytestream_1.Reader(writer.buffer);
        this.m_nonce = reader.uint32_t(true).toJSNumber();
    }
    /**
     * The transactions hashes (non-coinbase) included in the block
     */
    get transactions() {
        return this.m_transactions;
    }
    /**
     * The base transaction branch of the block
     */
    baseTransactionBranch() {
        return __awaiter(this, void 0, void 0, function* () {
            const transactions = [yield this.m_minerTransaction.hash()].concat(this.transactions);
            return Types_1.TurtleCoinCrypto.tree_branch(transactions);
        });
    }
    /**
     * The transaction tree hash of the block
     */
    transactionTreeHash() {
        return __awaiter(this, void 0, void 0, function* () {
            const transactions = [yield this.m_minerTransaction.hash()].concat(this.transactions);
            const treeHash = yield Types_1.TurtleCoinCrypto.tree_hash(transactions);
            return { hash: treeHash, count: transactions.length };
        });
    }
    /**
     * The merkle root of the block
     */
    merkleRoot() {
        return __awaiter(this, void 0, void 0, function* () {
            const writer = new bytestream_1.Writer();
            writer.varint(this.m_majorVersion);
            writer.varint(this.m_minorVersion);
            if (this.m_majorVersion < this.m_config.activateParentBlockVersion) {
                writer.varint(this.m_timestamp.getTime() / 1000);
            }
            writer.hash(this.m_previousBlockHash);
            if (this.m_majorVersion < this.m_config.activateParentBlockVersion) {
                writer.uint32_t(this.m_nonce, true);
            }
            const transactionTreeHash = yield this.transactionTreeHash();
            writer.hash(transactionTreeHash.hash);
            writer.varint(transactionTreeHash.count);
            return getBlockHash(writer.buffer);
        });
    }
    /**
     * The major block version
     */
    get majorVersion() {
        return this.m_majorVersion;
    }
    set majorVersion(majorVersion) {
        this.m_majorVersion = majorVersion;
    }
    /**
     * The minor block version
     */
    get minorVersion() {
        return this.m_minorVersion;
    }
    set minorVersion(minorVersion) {
        this.m_minorVersion = minorVersion;
    }
    /**
     * The block hash (id)
     */
    hash() {
        return __awaiter(this, void 0, void 0, function* () {
            const blob = yield this.toHashingBuffer();
            if (this.m_cache.blob === blob.toString('hex') && this.m_cache.hash) {
                return this.m_cache.hash;
            }
            this.m_cache.blob = blob.toString('hex');
            this.m_cache.hash = yield getBlockHash(blob);
            return this.m_cache.hash;
        });
    }
    /**
     * The block PoW hash
     */
    longHash() {
        return __awaiter(this, void 0, void 0, function* () {
            const blob = yield this.toHashingBuffer(true);
            if (this.m_cache.longBlob === blob.toString('hex') && this.m_cache.longHash) {
                return this.m_cache.longHash;
            }
            this.m_cache.longBlob = blob.toString('hex');
            this.m_cache.longHash = yield getBlockPoWHash(blob, this.m_majorVersion);
            return this.m_cache.longHash;
        });
    }
    /**
     * The timestamp of the block
     */
    get timestamp() {
        return this.m_timestamp;
    }
    set timestamp(timestamp) {
        this.m_timestamp = timestamp;
    }
    /**
     * The previous block hash of the block
     */
    get previousBlockHash() {
        return this.m_previousBlockHash;
    }
    set previousBlockHash(previousBlockHash) {
        this.m_previousBlockHash = previousBlockHash;
    }
    /**
     * The miner (coinbase) transaction of the block
     */
    get minerTransaction() {
        return this.m_minerTransaction;
    }
    set minerTransaction(minerTransaction) {
        this.m_minerTransaction = minerTransaction;
    }
    /**
     * The parent block of the block
     */
    get parentBlock() {
        return this.m_parentBlock;
    }
    set parentBlock(parentBlock) {
        this.m_parentBlock = parentBlock;
    }
    /**
     * Defines what major block version activates the use of parent blocks
     */
    get activateParentBlockVersion() {
        return this.m_config.activateParentBlockVersion;
    }
    set activateParentBlockVersion(activateParentBlockVersion) {
        this.m_config.activateParentBlockVersion = activateParentBlockVersion;
    }
    /**
     * Creates a new instance of a block from the data supplied
     * @param data the raw block data to decode
     * @param [config] the configuration that may define the major block version to activate parent block usage
     * @returns the new block object
     */
    static from(data, config) {
        return __awaiter(this, void 0, void 0, function* () {
            const block = new Block();
            if (config) {
                block.m_config = Common_1.Common.mergeConfig(config);
            }
            const reader = new bytestream_1.Reader(data);
            block.m_majorVersion = reader.varint().toJSNumber();
            block.m_minorVersion = reader.varint().toJSNumber();
            if (block.m_majorVersion >= block.m_config.activateParentBlockVersion) {
                block.m_previousBlockHash = reader.hash();
                block.m_parentBlock.majorVersion = reader.varint().toJSNumber();
                block.m_parentBlock.minorVersion = reader.varint().toJSNumber();
            }
            block.m_timestamp = new Date(reader.varint().toJSNumber() * 1000);
            if (block.m_majorVersion >= block.m_config.activateParentBlockVersion) {
                block.m_parentBlock.previousBlockHash = reader.hash();
            }
            else {
                block.m_previousBlockHash = reader.hash();
            }
            block.m_nonce = reader.uint32_t(true).toJSNumber();
            if (block.m_majorVersion >= block.m_config.activateParentBlockVersion) {
                block.m_parentBlock.transactionCount = reader.varint().toJSNumber();
                const baseTransactionBranchDepth = yield Types_1.TurtleCoinCrypto.tree_depth(block.m_parentBlock.transactionCount);
                for (let i = 0; i < baseTransactionBranchDepth; i++) {
                    block.m_parentBlock.baseTransactionBranch.push(reader.hash());
                }
                block.m_parentBlock.minerTransaction.version = reader.varint().toJSNumber();
                block.m_parentBlock.minerTransaction.unlockTime = reader.varint();
                const p_inputs = reader.varint().toJSNumber();
                for (let i = 0; i < p_inputs; i++) {
                    if (reader.uint8_t().toJSNumber() === Types_1.TransactionInputs.InputType.COINBASE) {
                        block.m_parentBlock.minerTransaction.inputs.push(new Types_1.TransactionInputs.CoinbaseInput(reader.varint().toJSNumber()));
                    }
                    else {
                        throw new Error('Non-coinbase input found in parent block miner transaction');
                    }
                }
                const p_outputs = reader.varint().toJSNumber();
                for (let i = 0; i < p_outputs; i++) {
                    const amount = reader.varint();
                    const type = reader.uint8_t().toJSNumber();
                    if (type === Types_1.TransactionOutputs.OutputType.KEY) {
                        block.m_parentBlock.minerTransaction.outputs.push(new Types_1.TransactionOutputs.KeyOutput(amount, reader.hash()));
                    }
                    else {
                        throw new Error('Unknown output type detected');
                    }
                }
                const p_extraLength = reader.varint().toJSNumber();
                const p_extra = reader.bytes(p_extraLength);
                yield block.m_parentBlock.minerTransaction.parseExtra(p_extra);
                if (block.m_parentBlock.minerTransaction.version >= 2) {
                    block.m_parentBlock.minerTransaction.ignoredField = reader.varint().toJSNumber();
                }
                const blockchainBranchDepth = (block.m_parentBlock.minerTransaction.mergedMining)
                    ? block.m_parentBlock.minerTransaction.mergedMining.depth : 0;
                for (let i = 0; i < blockchainBranchDepth; i++) {
                    block.m_parentBlock.blockchainBranch.push(reader.hash());
                }
            }
            block.m_minerTransaction.version = reader.varint().toJSNumber();
            block.m_minerTransaction.unlockTime = reader.varint();
            const inputs = reader.varint().toJSNumber();
            for (let i = 0; i < inputs; i++) {
                if (reader.uint8_t().toJSNumber() === Types_1.TransactionInputs.InputType.COINBASE) {
                    block.m_minerTransaction.inputs.push(new Types_1.TransactionInputs.CoinbaseInput(reader.varint().toJSNumber()));
                }
                else {
                    throw new Error('Non-coinbase input found in miner transaction');
                }
            }
            const outputs = reader.varint().toJSNumber();
            for (let i = 0; i < outputs; i++) {
                const amount = reader.varint();
                const type = reader.uint8_t().toJSNumber();
                if (type === Types_1.TransactionOutputs.OutputType.KEY) {
                    block.m_minerTransaction.outputs.push(new Types_1.TransactionOutputs.KeyOutput(amount, reader.hash()));
                }
                else {
                    throw new Error('Unknown output type detected');
                }
            }
            const extraLength = reader.varint().toJSNumber();
            const extra = reader.bytes(extraLength);
            yield block.m_minerTransaction.parseExtra(extra);
            const txnCount = reader.varint().toJSNumber();
            for (let i = 0; i < txnCount; i++) {
                block.m_transactions.push(reader.hash());
            }
            if (reader.unreadBytes > 0) {
                throw new RangeError('Unhandled data in block blob detected');
            }
            return block;
        });
    }
    /**
     * Returns a Buffer representation of the block
     * @returns the resulting Buffer
     */
    toBuffer() {
        const writer = new bytestream_1.Writer();
        writer.varint(this.m_majorVersion);
        writer.varint(this.m_minorVersion);
        if (this.m_majorVersion >= this.m_config.activateParentBlockVersion) {
            writer.hash(this.m_previousBlockHash);
            writer.varint(this.m_parentBlock.majorVersion);
            writer.varint(this.m_parentBlock.minorVersion);
        }
        writer.varint(this.m_timestamp.getTime() / 1000);
        if (this.m_majorVersion >= this.m_config.activateParentBlockVersion) {
            writer.hash(this.m_parentBlock.previousBlockHash);
        }
        else {
            writer.hash(this.m_previousBlockHash);
        }
        writer.uint32_t(this.m_nonce, true);
        if (this.m_majorVersion >= this.m_config.activateParentBlockVersion) {
            writer.varint(this.m_parentBlock.transactionCount);
            if (Array.isArray(this.m_parentBlock.baseTransactionBranch)) {
                this.m_parentBlock.baseTransactionBranch.forEach((branch) => {
                    writer.hash(branch);
                });
            }
            else {
                writer.hash(this.m_parentBlock.baseTransactionBranch);
            }
            writer.write(this.m_parentBlock.minerTransaction.toBuffer(true));
            if (this.m_parentBlock.minerTransaction.version >= 2) {
                writer.varint(this.m_parentBlock.minerTransaction.ignoredField);
            }
            this.m_parentBlock.blockchainBranch.forEach((branch) => {
                writer.hash(branch);
            });
        }
        writer.write(this.m_minerTransaction.toBuffer(true));
        writer.varint(this.m_transactions.length);
        this.m_transactions.forEach((hash) => {
            writer.hash(hash);
        });
        return writer.buffer;
    }
    /**
     * Returns a hexadecimal (blob) representation of the block
     * @returns the hexadecimal representation of the block
     */
    toString() {
        return this.toBuffer().toString('hex');
    }
    /**
     * Returns a Buffer representation of the data for hashing (mining) the block
     * @param [headerOnly] whether to return just the header or the full block
     * @returns the hashing buffer
     */
    toHashingBuffer(headerOnly = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const writer = new bytestream_1.Writer();
            writer.varint(this.m_majorVersion);
            writer.varint(this.m_minorVersion);
            if (this.m_majorVersion >= this.m_config.activateParentBlockVersion) {
                writer.hash(this.m_previousBlockHash);
            }
            else {
                writer.varint(this.m_timestamp.getTime() / 1000);
                writer.hash(this.m_previousBlockHash);
                writer.uint32_t(this.m_nonce, true);
            }
            const transactionTreeHash = yield this.transactionTreeHash();
            writer.hash(transactionTreeHash.hash);
            writer.varint(transactionTreeHash.count);
            if (this.m_majorVersion >= this.m_config.activateParentBlockVersion) {
                if (headerOnly) {
                    writer.clear();
                }
                writer.varint(this.m_parentBlock.majorVersion);
                writer.varint(this.m_parentBlock.minorVersion);
                writer.varint(this.m_timestamp.getTime() / 1000);
                writer.hash(this.m_parentBlock.previousBlockHash);
                writer.uint32_t(this.m_nonce, true);
                const treeHash = yield Types_1.TurtleCoinCrypto.tree_hash_from_branch(this.m_parentBlock.baseTransactionBranch, yield this.m_parentBlock.minerTransaction.hash(), 0);
                writer.hash(treeHash);
                writer.varint(this.m_parentBlock.transactionCount);
                if (headerOnly) {
                    return writer.buffer;
                }
                this.m_parentBlock.baseTransactionBranch.forEach((branch) => {
                    writer.hash(branch);
                });
                writer.write(this.m_parentBlock.minerTransaction.toBuffer());
                if (this.m_parentBlock.minerTransaction.version >= 2) {
                    writer.varint(this.m_parentBlock.minerTransaction.ignoredField);
                }
                this.m_parentBlock.blockchainBranch.forEach((branch) => {
                    writer.hash(branch);
                });
            }
            return writer.buffer;
        });
    }
    /**
     * Returns a hexadecimal (blob) representation of the data for hashing (mining) the block
     * @param [headerOnly] whether to return just the header or the full block
     * @returns the hexadecimal (blob) representation of the hashing buffer
     */
    toHashingString(headerOnly = false) {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.toHashingBuffer(headerOnly))
                .toString('hex');
        });
    }
}
exports.Block = Block;
/** @ignore */
function getBlockHash(data) {
    return __awaiter(this, void 0, void 0, function* () {
        const writer = new bytestream_1.Writer();
        writer.varint(data.length);
        writer.write(data);
        return Types_1.TurtleCoinCrypto.cn_fast_hash(writer.blob);
    });
}
/** @ignore */
function getBlockPoWHash(data, majorVersion) {
    return __awaiter(this, void 0, void 0, function* () {
        const blob = data.toString('hex');
        switch (majorVersion) {
            case 1:
            case 2:
            case 3:
                return Types_1.TurtleCoinCrypto.cn_slow_hash_v0(blob);
            case 4:
                return Types_1.TurtleCoinCrypto.cn_lite_slow_hash_v1(blob);
            case 5:
                return Types_1.TurtleCoinCrypto.cn_turtle_lite_slow_hash_v2(blob);
            case 6:
                return Types_1.TurtleCoinCrypto.chukwa_slow_hash_v1(blob);
            case 7:
                return Types_1.TurtleCoinCrypto.chukwa_slow_hash_v2(blob);
            default:
                throw new Error('Unhandled major block version');
        }
    });
}
