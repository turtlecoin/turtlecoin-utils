"use strict";
// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionInputs = void 0;
/** @ignore */
const bytestream_1 = require("@turtlecoin/bytestream");
const Types_1 = require("../Types");
var TransactionInputs;
(function (TransactionInputs) {
    /**
     * Transaction Input Types
     */
    let InputType;
    (function (InputType) {
        InputType[InputType["KEY"] = 2] = "KEY";
        InputType[InputType["COINBASE"] = 255] = "COINBASE";
    })(InputType = TransactionInputs.InputType || (TransactionInputs.InputType = {}));
    /**
     * Abstract interface for structured transaction inputs
     */
    class ITransactionInput {
    }
    TransactionInputs.ITransactionInput = ITransactionInput;
    /**
     * Represents a Coinbase input (block reward)
     */
    class CoinbaseInput {
        /**
         * Creates a new Coinbase input for the specified block index (0-based)
         * @param blockIndex
         */
        constructor(blockIndex) {
            this.m_type = InputType.COINBASE;
            this.m_blockIndex = 0;
            this.m_blockIndex = blockIndex;
        }
        /**
         * The input type
         */
        get type() {
            return this.m_type;
        }
        /**
         * The block index of the input (0-based)
         */
        get blockIndex() {
            return this.m_blockIndex;
        }
        /**
         * Represents the input as a Buffer
         * @returns the Buffer representation of the object
         */
        toBuffer() {
            const writer = new bytestream_1.Writer();
            writer.uint8_t(this.type);
            writer.varint(this.blockIndex);
            return writer.buffer;
        }
        /**
         * Represents the input as a hexadecimal string (blob)
         * @returns the hexadecimal (blob) representation of the object
         */
        toString() {
            return this.toBuffer().toString('hex');
        }
    }
    TransactionInputs.CoinbaseInput = CoinbaseInput;
    /**
     * Represents an input from a set of keys (wallet)
     */
    class KeyInput {
        /**
         * Creates a new input from existing keys using the specified values
         * @param amount the amount of the input
         * @param keyOffsets the input offsets used in the transaction signature(s)
         * @param keyImage the key image of the input
         */
        constructor(amount, keyOffsets, keyImage) {
            this.m_type = InputType.KEY;
            this.m_amount = Types_1.BigInteger.zero;
            this.m_keyOffsets = [];
            this.m_keyImage = '';
            if (typeof amount === 'number') {
                amount = Types_1.BigInteger(amount);
            }
            this.m_amount = amount;
            const tmpKeyOffsets = [];
            for (const index of keyOffsets) {
                if (typeof index === 'number') {
                    tmpKeyOffsets.push(Types_1.BigInteger(index));
                }
                else {
                    tmpKeyOffsets.push(index);
                }
            }
            this.m_keyOffsets = tmpKeyOffsets;
            this.m_keyImage = keyImage;
        }
        /**
         * The input type
         */
        get type() {
            return this.m_type;
        }
        /**
         * The input amount
         */
        get amount() {
            return this.m_amount;
        }
        /**
         * The input offsets used in the transaction signature(s)
         */
        get keyOffsets() {
            return this.m_keyOffsets;
        }
        /**
         * The key image of the input
         */
        get keyImage() {
            return this.m_keyImage;
        }
        /**
         * Represents the input as a Buffer
         * @returns the Buffer representation of the object
         */
        toBuffer() {
            const writer = new bytestream_1.Writer();
            writer.uint8_t(this.type);
            writer.varint(this.amount);
            writer.varint(this.keyOffsets.length);
            for (const offset of this.keyOffsets) {
                writer.varint(offset);
            }
            writer.hash(this.keyImage);
            return writer.buffer;
        }
        /**
         * Represents the input as a hexadecimal string (blob)
         * @returns the hexadecimal (blob) representation of the object
         */
        toString() {
            return this.toBuffer().toString('hex');
        }
    }
    TransactionInputs.KeyInput = KeyInput;
})(TransactionInputs = exports.TransactionInputs || (exports.TransactionInputs = {}));
