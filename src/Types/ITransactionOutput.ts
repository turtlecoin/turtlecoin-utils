// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import { BigInteger } from '../Types';
import { Writer } from '@turtlecoin/bytestream';

export namespace TransactionOutputs {

    /**
     * Transaction Output Type
     */
    export enum OutputType {
        KEY = 0x02,
    }

    /**
     * Abstract interface for structured transaction outputs
     */
    export abstract class ITransactionOutput {
        /**
         * The output type
         */
        public abstract get type(): OutputType;

        /**
         * Returns the output as a buffer
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
     * Represents an output to a set of keys (wallet)
     */
    export class KeyOutput implements ITransactionOutput {
        private readonly m_type: OutputType = OutputType.KEY;
        private readonly m_amount: BigInteger.BigInteger = BigInteger.zero;
        private readonly m_key: string = '';

        /**
         * Creates a new key output using the specified values
         * @param amount the output amount
         * @param key the one-time output key of the output
         */
        constructor (amount: BigInteger.BigInteger | number, key: string) {
            if (typeof amount === 'number') {
                amount = BigInteger(amount);
            }

            this.m_amount = amount;

            this.m_key = key;
        }

        /**
         * The output type
         */
        public get type (): OutputType {
            return this.m_type;
        }

        /**
         * The output amount
         */
        public get amount (): BigInteger.BigInteger {
            return this.m_amount;
        }

        /**
         * The one-time output key of the output
         */
        public get key (): string {
            return this.m_key;
        }

        /**
         * Represents the output as a Buffer
         * @returns the Buffer representation of the object
         */
        public toBuffer (): Buffer {
            const writer = new Writer();

            writer.varint(this.amount);

            writer.uint8_t(this.type);

            writer.hash(this.key);

            return writer.buffer;
        }

        /**
         * Represents the output as a hexadecimal string (blob)
         * @returns the hexadecimal (blob) representation of the object
         */
        public toString (): string {
            return this.toBuffer().toString('hex');
        }
    }
}
