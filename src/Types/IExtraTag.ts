// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import { Reader, Writer } from '@turtlecoin/bytestream';
import { ExtraNonceTag } from '../Types';
import { Common } from '../Common';

/** @ignore */
enum SIZES {
    KEY = 32,
}

export namespace ExtraTag {
    /** @ignore */
    import IExtraNonce = ExtraNonceTag.IExtraNonce;

    /**
     * Extra tag types
     */
    export enum ExtraTagType {
        PADDING = 0,
        PUBKEY,
        NONCE,
        MERGED_MINING,
        RECIPIENT_PUBLIC_VIEW_KEY,
        RECIPIENT_PUBLIC_SPEND_KEY,
        TRANSACTION_PRIVATE_KEY,
        POOL_NONCE
    }

    /**
     * Abstract interface for structured data in the transaction extra field
     */
    export abstract class IExtraTag {
        /**
         * Returns the size of the nonce field in bytes including it's tag
         */
        abstract get size(): number;

        /**
         * Returns the Extra Nonce Field tag
         */
        abstract get tag(): ExtraTagType;

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
     * Represents a structured padding field used in the transaction extra field
     */
    export class ExtraPadding implements IExtraTag {
        /**
         * The tag type of the field
         */
        public get tag (): ExtraTagType {
            return this.m_tag;
        }

        /**
         * The size of the field in bytes including the tag
         */
        public get size (): number {
            return this.toBuffer().length;
        }

        /**
         * Creates a new instance of the field using a Buffer or Blob copy of
         * field created through other means
         * @param data the data that makes up the nonce field
         * @returns the new object
         */
        public static from (data: Buffer | string): ExtraPadding {
            const reader = new Reader(data);

            if (reader.varint().toJSNumber() !== ExtraTagType.PADDING) {
                throw new Error('Not a padding field');
            }

            return new ExtraPadding(0);
        }

        public m_size = 0;
        private readonly m_tag: ExtraTagType = ExtraTagType.PADDING;

        /**
         * Constructs a new field of the specified size
         * @param size the size of the padding field
         */
        constructor (size: number) {
            this.m_size = size;
        }

        /**
         * Represents the field as a Buffer
         * @returns the Buffer representation of the object
         */
        public toBuffer (): Buffer {
            const writer = new Writer();

            writer.varint(this.tag);

            for (let i = 0; i < this.size; i++) {
                writer.varint(this.tag);
            }

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
     * Represents the transaction public key contained in the transaction extra field
     */
    export class ExtraPublicKey implements IExtraTag {
        /**
         * The tag type of the field
         */
        public get tag (): ExtraTagType {
            return this.m_tag;
        }

        /**
         * The public key contained in the field
         */
        public get publicKey (): string {
            return this.m_publicKey;
        }

        /**
         * The size of the field in bytes including the tag
         */
        public get size (): number {
            return this.toBuffer().length;
        }

        /**
         * Creates a new instance of the field using a Buffer or Blob copy of
         * field created through other means
         * @param data the data that makes up the nonce field
         * @returns the new object
         */
        public static from (data: Buffer | string): ExtraPublicKey {
            const reader = new Reader(data);

            if (reader.varint().toJSNumber() !== ExtraTagType.PUBKEY) {
                throw new Error('Not a public key field');
            }

            if (reader.unreadBytes !== SIZES.KEY) {
                throw new RangeError('Not enough data available for reading');
            }

            const publicKey = reader.hash();

            return new ExtraPublicKey(publicKey);
        }

        private readonly m_tag: ExtraTagType = ExtraTagType.PUBKEY;
        private readonly m_publicKey: string = '';

        /**
         * Creates a new instance of the field using the supplied public key
         * @param publicKey the public key to be stored in the field
         */
        constructor (publicKey: string) {
            this.m_publicKey = publicKey;
        }

        /**
         * Represents the field as a Buffer
         * @returns the Buffer representation of the object
         */
        public toBuffer (): Buffer {
            const writer = new Writer();

            writer.varint(this.tag);

            writer.hash(this.publicKey);

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
     * Represents merged mining information contained in the transaction extra field
     */
    export class ExtraMergedMining implements IExtraTag {
        /**
         * The tag type of the field
         */
        public get tag (): ExtraTagType {
            return this.m_tag;
        }

        /**
         * The size of the field in bytes including the tag
         */
        public get size (): number {
            return this.toBuffer().length;
        }

        /**
         * The depth of the block in the merkle root
         */
        public get depth (): number {
            return this.m_depth;
        }

        /**
         * The merkle root of the block merge mined
         */
        public get merkleRoot (): string {
            return this.m_merkleRoot;
        }

        /**
         * Creates a new instance of the field using a Buffer or Blob copy of
         * field created through other means
         * @param data the data that makes up the nonce field
         * @returns the new object
         */
        public static from (data: Buffer | string): ExtraMergedMining {
            const reader = new Reader(data);

            if (reader.varint().toJSNumber() !== ExtraTagType.MERGED_MINING) {
                throw new Error('Not a merged mining field');
            }

            try {
                reader.varint(true);
            } catch {
                throw new Error('Cannot read required tag data');
            }

            const length = reader.varint().toJSNumber();

            if (reader.unreadBytes !== length) {
                throw new RangeError('Not enough data available for reading');
            }

            try {
                reader.varint(true);
            } catch {
                throw new Error('Cannot read required tag data');
            }

            const depth = reader.varint().toJSNumber();

            if (reader.unreadBytes < SIZES.KEY) {
                throw new RangeError('Cannot read required tag data');
            }

            const merkleRoot = reader.hash();

            return new ExtraMergedMining(depth, merkleRoot);
        }

        private readonly m_tag: ExtraTagType = ExtraTagType.MERGED_MINING;
        private readonly m_depth: number = 0;
        private readonly m_merkleRoot: string = '';

        /**
         * Creates a new instance of the field using the supplied values
         * @param depth The depth of the block in the merkle root
         * @param merkleRoot The merkle root of the block merge mined
         */
        constructor (depth: number, merkleRoot: string) {
            this.m_depth = depth;

            if (!Common.isHex64(merkleRoot)) {
                throw new Error('merkleRoot must be 64 hexadecimal characters');
            }

            this.m_merkleRoot = merkleRoot;
        }

        /**
         * Represents the field as a Buffer
         * @returns the Buffer representation of the object
         */
        public toBuffer (): Buffer {
            const writer = new Writer();

            writer.varint(this.tag);

            const subWriter = new Writer();

            subWriter.varint(this.depth);

            subWriter.hash(this.merkleRoot);

            writer.varint(subWriter.length);

            writer.write(subWriter.buffer);

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
     * Represents nonce information contained in the transaction extra field
     */
    export class ExtraNonce implements IExtraTag {
        /**
         * The tag type of the field
         */
        public get tag (): ExtraTagType {
            return this.m_tag;
        }

        /**
         * The size of the field in bytes including the tag
         */
        public get size (): number {
            return this.toBuffer().length;
        }

        /**
         * The Extra Nonce fields contained in the field
         */
        public get tags (): IExtraNonce[] {
            return this.m_tags;
        }

        /**
         * Creates a new instance of the field using a Buffer or Blob copy of
         * field created through other means
         * @param data the data that makes up the nonce field
         * @returns the new object
         */
        public static from (data: Buffer | string): ExtraNonce {
            const reader = new Reader(data);
            const seen = {
                paymentId: false,
                data: false
            };

            if (reader.varint().toJSNumber() !== ExtraTagType.NONCE) {
                throw new Error('Not a nonce field');
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

            const tags: ExtraNonceTag.IExtraNonce[] = [];

            while (reader.unreadBytes > 0) {
                let tag = 0;

                try {
                    tag = reader.varint(true).toJSNumber();
                } catch {
                    reader.skip();
                    continue;
                }

                let totalLength = Common.varintLength(tag);

                switch (tag) {
                    case ExtraNonceTag.NonceTagType.PAYMENT_ID:
                        totalLength += SIZES.KEY;
                        if (!seen.paymentId && reader.unreadBytes >= totalLength) {
                            try {
                                tags.push(ExtraNonceTag.ExtraNoncePaymentId.from(reader.bytes(33)));
                                seen.paymentId = true;
                            } catch (e) {
                                reader.skip();
                            }
                        } else {
                            reader.skip();
                        }
                        break;
                    case ExtraNonceTag.NonceTagType.EXTRA_DATA:
                        if (!seen.data && reader.unreadBytes >= 1) {
                            let dataLength = 0;

                            try {
                                dataLength = reader.varint(true).toJSNumber();
                                if (dataLength > reader.unreadBytes) {
                                    reader.skip();
                                    continue;
                                }
                            } catch {
                                reader.skip();
                                continue;
                            }

                            totalLength += Common.varintLength(dataLength) + dataLength;

                            if (reader.unreadBytes >= totalLength) {
                                try {
                                    tags.push(ExtraNonceTag.ExtraNonceData.from(reader.bytes(totalLength)));
                                    seen.data = true;
                                } catch (e) {
                                    reader.skip();
                                }
                            } else {
                                reader.skip();
                            }
                        } else {
                            reader.skip();
                        }
                        break;
                    default:
                        reader.skip();
                        break;
                }
            }

            return new ExtraNonce(tags);
        }

        protected m_tags: ExtraNonceTag.IExtraNonce[] = [];
        private readonly m_tag: ExtraTagType = ExtraTagType.NONCE;

        /**
         * Creates a new instance of the field using the supplied Extra Nonce fields
         * @param tags The Extra Nonce fields to place into the field
         */
        constructor (tags: ExtraNonceTag.IExtraNonce[]) {
            this.m_tags = tags;
        }

        /**
         * Remove a specific Extra Nonce field from the field
         * @param removeTag the Extra Nonce tag type to remove
         */
        public removeTag (removeTag: ExtraNonceTag.NonceTagType) {
            const result: ExtraNonceTag.IExtraNonce[] = [];

            for (const tag of this.m_tags) {
                if (tag.tag !== removeTag) {
                    result.push(tag);
                }
            }

            result.sort((a, b) => (a.tag > b.tag) ? 1 : -1);

            this.m_tags = result;
        }

        /**
         * Add/Update a specific Extra Nonce field to the field
         * @param tag the Extra Nonce tag to add/update
         */
        public addTag (tag: ExtraNonceTag.IExtraNonce) {
            this.removeTag(tag.tag);

            this.tags.push(tag);

            this.m_tags.sort((a, b) => (a.tag > b.tag) ? 1 : -1);
        }

        /**
         * Represents the field as a Buffer
         * @returns the Buffer representation of the object
         */
        public toBuffer (): Buffer {
            const writer = new Writer();

            writer.varint(this.tag);

            const subWriter = new Writer();

            for (const tag of this.tags) {
                subWriter.write(tag.toBuffer());
            }

            writer.varint(subWriter.length);

            writer.write(subWriter.blob);

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
     * Represents the transaction private key contained in the transaction extra field
     */
    export class ExtraTransactionPrivateKey implements IExtraTag {
        /**
         * The tag type of the field
         */
        public get tag (): ExtraTagType {
            return this.m_tag;
        }

        /**
         * The public key contained in the field
         */
        public get privateKey (): string {
            return this.m_privateKey;
        }

        /**
         * The size of the field in bytes including the tag
         */
        public get size (): number {
            return this.toBuffer().length;
        }

        /**
         * Creates a new instance of the field using a Buffer or Blob copy of
         * field created through other means
         * @param data the data that makes up the nonce field
         * @returns the new object
         */
        public static from (data: Buffer | string): ExtraTransactionPrivateKey {
            const reader = new Reader(data);

            if (reader.varint().toJSNumber() !== ExtraTagType.TRANSACTION_PRIVATE_KEY) {
                throw new Error('Not a public key field');
            }

            if (reader.unreadBytes !== SIZES.KEY) {
                throw new RangeError('Not enough data available for reading');
            }

            const privateKey = reader.hash();

            return new ExtraTransactionPrivateKey(privateKey);
        }

        private readonly m_tag: ExtraTagType = ExtraTagType.TRANSACTION_PRIVATE_KEY;
        private readonly m_privateKey: string = '';

        /**
         * Creates a new instance of the field using the supplied public key
         * @param privateKey the public key to be stored in the field
         */
        constructor (privateKey: string) {
            this.m_privateKey = privateKey;
        }

        /**
         * Represents the field as a Buffer
         * @returns the Buffer representation of the object
         */
        public toBuffer (): Buffer {
            const writer = new Writer();

            writer.varint(this.tag);

            writer.hash(this.privateKey);

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
     * Represents the recipient public view key contained in the transaction
     * extra field for coinbase transactions
     */
    export class ExtraRecipientPublicViewKey implements IExtraTag {
        /**
         * The tag type of the field
         */
        public get tag (): ExtraTagType {
            return this.m_tag;
        }

        /**
         * The public key contained in the field
         */
        public get publicKey (): string {
            return this.m_publicKey;
        }

        /**
         * The size of the field in bytes including the tag
         */
        public get size (): number {
            return this.toBuffer().length;
        }

        /**
         * Creates a new instance of the field using a Buffer or Blob copy of
         * field created through other means
         * @param data the data that makes up the nonce field
         * @returns the new object
         */
        public static from (data: Buffer | string): ExtraRecipientPublicViewKey {
            const reader = new Reader(data);

            if (reader.varint().toJSNumber() !== ExtraTagType.RECIPIENT_PUBLIC_VIEW_KEY) {
                throw new Error('Not a public key field');
            }

            if (reader.unreadBytes !== SIZES.KEY) {
                throw new RangeError('Not enough data available for reading');
            }

            const publicKey = reader.hash();

            return new ExtraRecipientPublicViewKey(publicKey);
        }

        private readonly m_tag: ExtraTagType = ExtraTagType.RECIPIENT_PUBLIC_VIEW_KEY;
        private readonly m_publicKey: string = '';

        /**
         * Creates a new instance of the field using the supplied public key
         * @param publicKey the public key to be stored in the field
         */
        constructor (publicKey: string) {
            this.m_publicKey = publicKey;
        }

        /**
         * Represents the field as a Buffer
         * @returns the Buffer representation of the object
         */
        public toBuffer (): Buffer {
            const writer = new Writer();

            writer.varint(this.tag);

            writer.hash(this.publicKey);

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
     * Represents the recipient public spend key contained in the transaction
     * extra field for coinbase transactions
     */
    export class ExtraRecipientPublicSpendKey implements IExtraTag {
        /**
         * The tag type of the field
         */
        public get tag (): ExtraTagType {
            return this.m_tag;
        }

        /**
         * The public key contained in the field
         */
        public get publicKey (): string {
            return this.m_publicKey;
        }

        /**
         * The size of the field in bytes including the tag
         */
        public get size (): number {
            return this.toBuffer().length;
        }

        /**
         * Creates a new instance of the field using a Buffer or Blob copy of
         * field created through other means
         * @param data the data that makes up the nonce field
         * @returns the new object
         */
        public static from (data: Buffer | string): ExtraRecipientPublicSpendKey {
            const reader = new Reader(data);

            if (reader.varint().toJSNumber() !== ExtraTagType.RECIPIENT_PUBLIC_SPEND_KEY) {
                throw new Error('Not a public key field');
            }

            if (reader.unreadBytes !== SIZES.KEY) {
                throw new RangeError('Not enough data available for reading');
            }

            const publicKey = reader.hash();

            return new ExtraRecipientPublicSpendKey(publicKey);
        }

        private readonly m_tag: ExtraTagType = ExtraTagType.RECIPIENT_PUBLIC_SPEND_KEY;
        private readonly m_publicKey: string = '';

        /**
         * Creates a new instance of the field using the supplied public key
         * @param publicKey the public key to be stored in the field
         */
        constructor (publicKey: string) {
            this.m_publicKey = publicKey;
        }

        /**
         * Represents the field as a Buffer
         * @returns the Buffer representation of the object
         */
        public toBuffer (): Buffer {
            const writer = new Writer();

            writer.varint(this.tag);

            writer.hash(this.publicKey);

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
     * Represents the extra field for the pool nonce used by mining pools
     */
    export class ExtraPoolNonce implements IExtraTag {
        /**
         * The tag type of the field
         */
        public get tag (): ExtraTagType {
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
        public static from (data: Buffer | string): ExtraPoolNonce {
            const reader = new Reader(data);

            if (reader.varint().toJSNumber() !== ExtraTagType.POOL_NONCE) {
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

            return new ExtraPoolNonce(dataLength);
        }

        private readonly m_tag: ExtraTagType = ExtraTagType.POOL_NONCE;
        private readonly m_data: Buffer = Buffer.alloc(0);

        /**
         * Creates a new instance of the field from just the extra data to be included
         * @param data the pool nonce data to be included
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
}
