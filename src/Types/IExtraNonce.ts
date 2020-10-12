// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import { Reader, Writer } from '@turtlecoin/bytestream';
import { Common } from '../Common';

/** @ignore */
enum SIZES {
    KEY = 32,
}

export namespace ExtraNonceTag {
    /**
     * Nonce subtag types
     */
    export enum NonceTagType {
        PAYMENT_ID = 0,
        EXTRA_DATA = 127,
    }

    /**
     * Abstract interface for structured Extra Nonce Field Values
     */
    export abstract class IExtraNonce {
        /**
         * Returns the size of the nonce field in bytes including it's tag
         */
        abstract get size(): number;

        /**
         * Returns the Extra Nonce Field tag
         */
        abstract get tag(): NonceTagType;

        /**
         * Returns the Extra Nonce as a Buffer
         * @returns the Buffer representation of the object
         */
        public abstract toBuffer(): Buffer;

        /**
         * Returns the Extra Nonce as a hexadecimal string (blob)
         * @returns the hexadecimal (blob) representation of the object
         */
        public abstract toString(): string;
    }

    /**
     * Represents arbitrary extra data included in the nonce by the user
     */
    export class ExtraNonceData implements IExtraNonce {
        /**
         * The tag type of the field
         */
        public get tag (): NonceTagType {
            return this.m_tag;
        }

        /**
         * The size of the field in bytes including the tag
         */
        public get size (): number {
            return this.toBuffer().length;
        }

        /**
         * The arbitrary data included in the field
         */
        public get data (): Buffer {
            return this.m_data;
        }

        /**
         * Creates a new instance of the field using a Buffer or Blob copy of
         * field created through other means
         * @param data the data that makes up the nonce field
         * @returns the new object
         */
        public static from (data: Buffer | string): ExtraNonceData {
            const reader = new Reader(data);

            if (reader.varint().toJSNumber() !== NonceTagType.EXTRA_DATA) {
                throw new Error('Not an extra data field');
            }

            try {
                reader.varint(true);
            } catch {
                throw new Error('Cannot read required field data');
            }

            const length = reader.varint().toJSNumber();

            if (reader.unreadBytes !== length) {
                throw new RangeError('Not enough data available for reading');
            }

            const dataLength = reader.bytes(length);

            return new ExtraNonceData(dataLength);
        }

        private readonly m_tag: NonceTagType = NonceTagType.EXTRA_DATA;
        private readonly m_data: Buffer = Buffer.alloc(0);

        /**
         * Creates a new instance of the field from just the extra data to be included
         * @param data the arbitrary data to be included in the field
         */
        constructor (data: Buffer) {
            this.m_data = data;
        }

        /**
         * Represents the field as a Buffer
         * @returns the Buffer representation of the object
         */
        public toBuffer (): Buffer {
            const writer = new Writer();

            writer.varint(this.tag);

            writer.varint(this.data.length);

            writer.write(this.data);

            return writer.buffer;
        }

        /**
         * Represents the field as a hexadecimal string (blob)
         * @returns the hexadecimal (blob) representation of the object
         */
        public toString (): string {
            return this.toBuffer().toString('hex');
        }
    }

    /**
     * Represents a payment ID included in the Extra Nonce field
     */
    export class ExtraNoncePaymentId implements IExtraNonce {
        /**
         * The tag type of the field
         */
        public get tag (): NonceTagType {
            return this.m_tag;
        }

        /**
         * The size of the field in bytes including the tag
         */
        public get size (): number {
            return this.toBuffer().length;
        }

        /**
         * The payment ID contained in the field
         */
        public get paymentId (): string {
            return this.m_paymentId;
        }

        /**
         * Creates a new instance of the field using a Buffer or Blob copy of
         * field created through other means
         * @param data the data that makes up the nonce field
         * @returns the new object
         */
        public static from (data: Buffer | string): ExtraNoncePaymentId {
            const reader = new Reader(data);

            if (reader.varint().toJSNumber() !== NonceTagType.PAYMENT_ID) {
                throw new Error('Not a payment ID field');
            }

            if (reader.unreadBytes !== SIZES.KEY) {
                throw new RangeError('Not enough data available for reading');
            }

            const paymentId = reader.hash();

            return new ExtraNoncePaymentId(paymentId);
        }

        private readonly m_tag: NonceTagType = NonceTagType.PAYMENT_ID;
        private readonly m_paymentId: string = '';

        /**
         * Constructs a new instance of the field using the supplied payment ID
         * @param paymentId
         */
        constructor (paymentId: string) {
            if (!Common.isHex64(paymentId)) {
                throw new Error('paymentId must be 64 hexadecimal characters');
            }

            this.m_paymentId = paymentId;
        }

        /**
         * Represents the field as a Buffer
         * @returns the Buffer representation of the object
         */
        public toBuffer (): Buffer {
            const writer = new Writer();

            writer.varint(this.tag);

            writer.hash(this.paymentId);

            return writer.buffer;
        }

        /**
         * Represents the field as a hexadecimal string (blob)
         * @returns the hexadecimal (blob) representation of the object
         */
        public toString (): string {
            return this.toBuffer().toString('hex');
        }
    }
}
