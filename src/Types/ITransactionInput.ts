// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

/** @ignore */
import { Writer } from '@turtlecoin/bytestream';
import { BigInteger } from '../Types';

export namespace TransactionInputs {

    /**
     * Transaction Input Types
     */
    export enum InputType {
        KEY = 0x02,
        COINBASE = 0xff,
    }

    /**
     * Abstract interface for structured transaction inputs
     */
    export abstract class ITransactionInput {
        /**
         * The input type
         */
        public abstract get type(): InputType;

        /**
         * Returns the input as a buffer
         * @returns the Buffer representation of the object
         */
        public abstract toBuffer(): Buffer;

        /**
         * Returns the input as a hexadecimal string (blob)
         * @returns the hexadecimal (blob) representation of the object
         */
        public abstract toString(): string;
    }

    /**
     * Represents a Coinbase input (block reward)
     */
    export class CoinbaseInput implements ITransactionInput {
        private readonly m_type: InputType = InputType.COINBASE;
        private readonly m_blockIndex: number = 0;

        /**
         * Creates a new Coinbase input for the specified block index (0-based)
         * @param blockIndex
         */
        constructor (blockIndex: number) {
            this.m_blockIndex = blockIndex;
        }

        /**
         * The input type
         */
        public get type (): InputType {
            return this.m_type;
        }

        /**
         * The block index of the input (0-based)
         */
        public get blockIndex (): number {
            return this.m_blockIndex;
        }

        /**
         * Represents the input as a Buffer
         * @returns the Buffer representation of the object
         */
        public toBuffer (): Buffer {
            const writer = new Writer();

            writer.uint8_t(this.type);

            writer.varint(this.blockIndex);

            return writer.buffer;
        }

        /**
         * Represents the input as a hexadecimal string (blob)
         * @returns the hexadecimal (blob) representation of the object
         */
        public toString (): string {
            return this.toBuffer().toString('hex');
        }
    }

    /**
     * Represents an input from a set of keys (wallet)
     */
    export class KeyInput implements ITransactionInput {
        private readonly m_type: InputType = InputType.KEY;
        private readonly m_amount: BigInteger.BigInteger = BigInteger.zero;
        private readonly m_keyOffsets: BigInteger.BigInteger[] = [];
        private readonly m_keyImage: string = '';

        /**
         * Creates a new input from existing keys using the specified values
         * @param amount the amount of the input
         * @param keyOffsets the input offsets used in the transaction signature(s)
         * @param keyImage the key image of the input
         */
        constructor (
            amount: BigInteger.BigInteger | number,
            keyOffsets: BigInteger.BigInteger[] | number[],
            keyImage: string) {
            if (typeof amount === 'number') {
                amount = BigInteger(amount);
            }

            this.m_amount = amount;

            const tmpKeyOffsets: BigInteger.BigInteger[] = [];

            for (const index of keyOffsets) {
                if (typeof index === 'number') {
                    tmpKeyOffsets.push(BigInteger(index));
                } else {
                    tmpKeyOffsets.push(index);
                }
            }

            this.m_keyOffsets = tmpKeyOffsets;

            this.m_keyImage = keyImage;
        }

        /**
         * The input type
         */
        public get type (): InputType {
            return this.m_type;
        }

        /**
         * The input amount
         */
        public get amount (): BigInteger.BigInteger {
            return this.m_amount;
        }

        /**
         * The input offsets used in the transaction signature(s)
         */
        public get keyOffsets (): BigInteger.BigInteger[] {
            return this.m_keyOffsets;
        }

        /**
         * The key image of the input
         */
        public get keyImage (): string {
            return this.m_keyImage;
        }

        /**
         * Represents the input as a Buffer
         * @returns the Buffer representation of the object
         */
        public toBuffer (): Buffer {
            const writer = new Writer();

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
        public toString (): string {
            return this.toBuffer().toString('hex');
        }
    }
}
