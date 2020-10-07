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
exports.BlockTemplate = exports.SIZES = void 0;
const Block_1 = require("./Block");
const Types_1 = require("./Types");
/** @ignore */
var SIZES;
(function (SIZES) {
    SIZES[SIZES["KEY"] = 32] = "KEY";
    SIZES[SIZES["CHECKSUM"] = 4] = "CHECKSUM";
})(SIZES = exports.SIZES || (exports.SIZES = {}));
/**
 * Represents a BlockTemplate received from a Daemon that can be manipulated to perform mining operations
 */
class BlockTemplate {
    constructor() {
        this.m_blockTemplate = Buffer.alloc(0);
        this.m_difficulty = 1;
        this.m_height = 0;
        this.m_reservedOffset = 0;
        this.m_block = new Block_1.Block();
        this.m_extraNonceOffset = 0;
        this.m_extraNonceSafeLength = 0;
    }
    /**
     * The major block version for which to activate the use of parent blocks
     */
    get activateParentBlockVersion() {
        return this.m_block.activateParentBlockVersion;
    }
    set activateParentBlockVersion(value) {
        this.m_block.activateParentBlockVersion = value;
    }
    /**
     * The original block template as a buffer
     */
    get blockTemplateBuffer() {
        return this.m_blockTemplate;
    }
    /**
     * The original block template in hexadecimal (blob)
     */
    get blockTemplate() {
        return this.blockTemplateBuffer.toString('hex');
    }
    /**
     * The block template difficulty
     */
    get difficulty() {
        return this.m_difficulty;
    }
    /**
     * The block template height
     */
    get height() {
        return this.m_height;
    }
    /**
     * The block template reserved offset position
     */
    get reservedOffset() {
        return this.m_reservedOffset;
    }
    /**
     * The block nonce
     */
    get nonce() {
        return this.m_block.nonce;
    }
    set nonce(value) {
        this.m_block.nonce = value;
    }
    /**
     * The block defined in the block template
     */
    get block() {
        return this.m_block;
    }
    /**
     * The miner transaction defined in the block of the block template
     */
    get minerTransaction() {
        return this.m_block.minerTransaction;
    }
    /**
     * The extra miner nonce typically used for pool based mining
     */
    get minerNonce() {
        if (!this.minerTransaction.poolNonce) {
            return 0;
        }
        else {
            return this.minerTransaction.poolNonce.toJSNumber();
        }
    }
    set minerNonce(nonce) {
        this.minerTransaction.poolNonce = Types_1.BigInteger(nonce);
    }
    /**
     * Whether the given hash meets the difficulty specified
     * @param hash the block POW hash
     * @param difficulty the target difficulty
     */
    static hashMeetsDifficulty(hash, difficulty) {
        var _a;
        const reversedHash = (_a = hash.match(/[0-9a-f]{2}/gi)) === null || _a === void 0 ? void 0 : _a.reverse().join('');
        if (!reversedHash) {
            throw new Error('Cannot read hash');
        }
        const hashDiff = Types_1.BigInteger(reversedHash, 16).multiply(difficulty);
        const maxValue = Types_1.BigInteger('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 16);
        return (hashDiff.compare(maxValue) === -1);
    }
    /**
     * Creates a new block template instance using the supplied daemon response
     * @param response the daemon response to the get_blocktemplate call
     */
    static from(response) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = new BlockTemplate();
            result.m_blockTemplate = Buffer.from(response.blob, 'hex');
            result.m_difficulty = response.difficulty;
            result.m_reservedOffset = response.reservedOffset;
            result.m_height = response.height;
            result.m_block = yield Block_1.Block.from(response.blob);
            return result;
        });
    }
    /**
     * Converts a block into a v1 hashing block typically used by miners during mining operations
     * this method actually creates a merged mining block that merge mines itself
     * @param block the block to convert for miner hashing
     * @returns the mining block
     */
    convert(block) {
        return __awaiter(this, void 0, void 0, function* () {
            const originalBlock = block || this.m_block;
            if (originalBlock.majorVersion >= this.activateParentBlockVersion) {
                /* If we support merged mining, then we can reduce the size of
                       the block blob sent to the miners by crafting a new block
                       with the blocktemplate provided by the daemon into a new
                       block that contains the original block information as a MM
                       tag in the miner transaction */
                const newBlock = new Block_1.Block();
                newBlock.majorVersion = 1;
                newBlock.minorVersion = 0;
                newBlock.timestamp = originalBlock.timestamp;
                newBlock.previousBlockHash = originalBlock.previousBlockHash;
                newBlock.nonce = originalBlock.nonce;
                newBlock.minerTransaction.addMergedMining(0, yield originalBlock.merkleRoot());
                return newBlock;
            }
            else {
                return originalBlock;
            }
        });
    }
    /**
     * Constructs a new "final" block that can be submitted to the network using
     * an original the original block in the block template and the nonce value found
     * @param nonce the nonce value for the block
     * @param [branch] the blockchain branch containing the merged mining information
     * @returns the block that can be submitted to the network
     */
    construct(nonce, branch) {
        return __awaiter(this, void 0, void 0, function* () {
            const block = this.m_block;
            block.nonce = nonce;
            if (block.majorVersion >= this.activateParentBlockVersion) {
                /* First we create the new parent block */
                const newBlock = yield this.convert(block);
                /* Then assign the nonce to it */
                newBlock.nonce = nonce;
                /* Then we merge the two blocks together */
                block.timestamp = newBlock.timestamp;
                block.parentBlock.majorVersion = newBlock.majorVersion;
                block.parentBlock.minorVersion = newBlock.minorVersion;
                block.parentBlock.previousBlockHash = newBlock.previousBlockHash;
                block.parentBlock.minerTransaction = newBlock.minerTransaction;
                block.parentBlock.transactionCount = newBlock.transactions.length + 1; // +1 for the miner transaction
                block.parentBlock.baseTransactionBranch = yield newBlock.baseTransactionBranch();
                /* We only add this if it actually exists */
                if (branch) {
                    block.parentBlock.blockchainBranch = [branch];
                }
            }
            return block;
        });
    }
}
exports.BlockTemplate = BlockTemplate;
