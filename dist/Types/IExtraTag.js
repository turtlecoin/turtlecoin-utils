"use strict";
// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtraTag = void 0;
const bytestream_1 = require("@turtlecoin/bytestream");
const Types_1 = require("../Types");
const Common_1 = require("../Common");
/** @ignore */
var SIZES;
(function (SIZES) {
    SIZES[SIZES["KEY"] = 32] = "KEY";
})(SIZES || (SIZES = {}));
var ExtraTag;
(function (ExtraTag) {
    /**
     * Extra tag types
     */
    let ExtraTagType;
    (function (ExtraTagType) {
        ExtraTagType[ExtraTagType["PADDING"] = 0] = "PADDING";
        ExtraTagType[ExtraTagType["PUBKEY"] = 1] = "PUBKEY";
        ExtraTagType[ExtraTagType["NONCE"] = 2] = "NONCE";
        ExtraTagType[ExtraTagType["MERGED_MINING"] = 3] = "MERGED_MINING";
        ExtraTagType[ExtraTagType["RECIPIENT_PUBLIC_VIEW_KEY"] = 4] = "RECIPIENT_PUBLIC_VIEW_KEY";
        ExtraTagType[ExtraTagType["RECIPIENT_PUBLIC_SPEND_KEY"] = 5] = "RECIPIENT_PUBLIC_SPEND_KEY";
        ExtraTagType[ExtraTagType["TRANSACTION_PRIVATE_KEY"] = 6] = "TRANSACTION_PRIVATE_KEY";
        ExtraTagType[ExtraTagType["POOL_NONCE"] = 7] = "POOL_NONCE";
    })(ExtraTagType = ExtraTag.ExtraTagType || (ExtraTag.ExtraTagType = {}));
    /**
     * Abstract interface for structured data in the transaction extra field
     */
    class IExtraTag {
    }
    ExtraTag.IExtraTag = IExtraTag;
    /**
     * Represents a structured padding field used in the transaction extra field
     */
    class ExtraPadding {
        /**
         * Constructs a new field of the specified size
         * @param size the size of the padding field
         */
        constructor(size) {
            this.m_size = 0;
            this.m_tag = ExtraTagType.PADDING;
            this.m_size = size;
        }
        /**
         * The tag type of the field
         */
        get tag() {
            return this.m_tag;
        }
        /**
         * The size of the field in bytes including the tag
         */
        get size() {
            return this.toBuffer().length;
        }
        /**
         * Creates a new instance of the field using a Buffer or Blob copy of
         * field created through other means
         * @param data the data that makes up the nonce field
         * @returns the new object
         */
        static from(data) {
            const reader = new bytestream_1.Reader(data);
            if (reader.varint().toJSNumber() !== ExtraTagType.PADDING) {
                throw new Error('Not a padding field');
            }
            return new ExtraPadding(0);
        }
        /**
         * Represents the field as a Buffer
         * @returns the Buffer representation of the object
         */
        toBuffer() {
            const writer = new bytestream_1.Writer();
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
        toString() {
            return this.toBuffer().toString('hex');
        }
    }
    ExtraTag.ExtraPadding = ExtraPadding;
    /**
     * Represents the transaction public key contained in the transaction extra field
     */
    class ExtraPublicKey {
        /**
         * Creates a new instance of the field using the supplied public key
         * @param publicKey the public key to be stored in the field
         */
        constructor(publicKey) {
            this.m_tag = ExtraTagType.PUBKEY;
            this.m_publicKey = '';
            this.m_publicKey = publicKey;
        }
        /**
         * The tag type of the field
         */
        get tag() {
            return this.m_tag;
        }
        /**
         * The public key contained in the field
         */
        get publicKey() {
            return this.m_publicKey;
        }
        /**
         * The size of the field in bytes including the tag
         */
        get size() {
            return this.toBuffer().length;
        }
        /**
         * Creates a new instance of the field using a Buffer or Blob copy of
         * field created through other means
         * @param data the data that makes up the nonce field
         * @returns the new object
         */
        static from(data) {
            const reader = new bytestream_1.Reader(data);
            if (reader.varint().toJSNumber() !== ExtraTagType.PUBKEY) {
                throw new Error('Not a public key field');
            }
            if (reader.unreadBytes !== SIZES.KEY) {
                throw new RangeError('Not enough data available for reading');
            }
            const publicKey = reader.hash();
            return new ExtraPublicKey(publicKey);
        }
        /**
         * Represents the field as a Buffer
         * @returns the Buffer representation of the object
         */
        toBuffer() {
            const writer = new bytestream_1.Writer();
            writer.varint(this.tag);
            writer.hash(this.publicKey);
            return writer.buffer;
        }
        /**
         * Represents the field as a hexadecimal string (blob)
         * @returns the hexadecimal (blob) representation of the object
         */
        toString() {
            return this.toBuffer().toString('hex');
        }
    }
    ExtraTag.ExtraPublicKey = ExtraPublicKey;
    /**
     * Represents merged mining information contained in the transaction extra field
     */
    class ExtraMergedMining {
        /**
         * Creates a new instance of the field using the supplied values
         * @param depth The depth of the block in the merkle root
         * @param merkleRoot The merkle root of the block merge mined
         */
        constructor(depth, merkleRoot) {
            this.m_tag = ExtraTagType.MERGED_MINING;
            this.m_depth = 0;
            this.m_merkleRoot = '';
            this.m_depth = depth;
            if (!Common_1.Common.isHex64(merkleRoot)) {
                throw new Error('merkleRoot must be 64 hexadecimal characters');
            }
            this.m_merkleRoot = merkleRoot;
        }
        /**
         * The tag type of the field
         */
        get tag() {
            return this.m_tag;
        }
        /**
         * The size of the field in bytes including the tag
         */
        get size() {
            return this.toBuffer().length;
        }
        /**
         * The depth of the block in the merkle root
         */
        get depth() {
            return this.m_depth;
        }
        /**
         * The merkle root of the block merge mined
         */
        get merkleRoot() {
            return this.m_merkleRoot;
        }
        /**
         * Creates a new instance of the field using a Buffer or Blob copy of
         * field created through other means
         * @param data the data that makes up the nonce field
         * @returns the new object
         */
        static from(data) {
            const reader = new bytestream_1.Reader(data);
            if (reader.varint().toJSNumber() !== ExtraTagType.MERGED_MINING) {
                throw new Error('Not a merged mining field');
            }
            try {
                reader.varint(true);
            }
            catch (_a) {
                throw new Error('Cannot read required tag data');
            }
            const length = reader.varint().toJSNumber();
            if (reader.unreadBytes !== length) {
                throw new RangeError('Not enough data available for reading');
            }
            try {
                reader.varint(true);
            }
            catch (_b) {
                throw new Error('Cannot read required tag data');
            }
            const depth = reader.varint().toJSNumber();
            if (reader.unreadBytes < SIZES.KEY) {
                throw new RangeError('Cannot read required tag data');
            }
            const merkleRoot = reader.hash();
            return new ExtraMergedMining(depth, merkleRoot);
        }
        /**
         * Represents the field as a Buffer
         * @returns the Buffer representation of the object
         */
        toBuffer() {
            const writer = new bytestream_1.Writer();
            writer.varint(this.tag);
            const subWriter = new bytestream_1.Writer();
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
        toString() {
            return this.toBuffer().toString('hex');
        }
    }
    ExtraTag.ExtraMergedMining = ExtraMergedMining;
    /**
     * Represents nonce information contained in the transaction extra field
     */
    class ExtraNonce {
        /**
         * Creates a new instance of the field using the supplied Extra Nonce fields
         * @param tags The Extra Nonce fields to place into the field
         */
        constructor(tags) {
            this.m_tags = [];
            this.m_tag = ExtraTagType.NONCE;
            this.m_tags = tags;
        }
        /**
         * The tag type of the field
         */
        get tag() {
            return this.m_tag;
        }
        /**
         * The size of the field in bytes including the tag
         */
        get size() {
            return this.toBuffer().length;
        }
        /**
         * The Extra Nonce fields contained in the field
         */
        get tags() {
            return this.m_tags;
        }
        /**
         * Creates a new instance of the field using a Buffer or Blob copy of
         * field created through other means
         * @param data the data that makes up the nonce field
         * @returns the new object
         */
        static from(data) {
            const reader = new bytestream_1.Reader(data);
            const seen = {
                paymentId: false,
                data: false
            };
            if (reader.varint().toJSNumber() !== ExtraTagType.NONCE) {
                throw new Error('Not a nonce field');
            }
            try {
                reader.varint(true);
            }
            catch (_a) {
                throw new Error('Cannot read required field data');
            }
            const length = reader.varint().toJSNumber();
            if (reader.unreadBytes !== length) {
                throw new RangeError('Not enough data available for reading');
            }
            const tags = [];
            while (reader.unreadBytes > 0) {
                let tag = 0;
                try {
                    tag = reader.varint(true).toJSNumber();
                }
                catch (_b) {
                    reader.skip();
                    continue;
                }
                let totalLength = Common_1.Common.varintLength(tag);
                switch (tag) {
                    case Types_1.ExtraNonceTag.NonceTagType.PAYMENT_ID:
                        totalLength += SIZES.KEY;
                        if (!seen.paymentId && reader.unreadBytes >= totalLength) {
                            try {
                                tags.push(Types_1.ExtraNonceTag.ExtraNoncePaymentId.from(reader.bytes(33)));
                                seen.paymentId = true;
                            }
                            catch (e) {
                                reader.skip();
                            }
                        }
                        else {
                            reader.skip();
                        }
                        break;
                    case Types_1.ExtraNonceTag.NonceTagType.EXTRA_DATA:
                        if (!seen.data && reader.unreadBytes >= 1) {
                            let dataLength = 0;
                            try {
                                dataLength = reader.varint(true).toJSNumber();
                                if (dataLength > reader.unreadBytes) {
                                    reader.skip();
                                    continue;
                                }
                            }
                            catch (_c) {
                                reader.skip();
                                continue;
                            }
                            totalLength += Common_1.Common.varintLength(dataLength) + dataLength;
                            if (reader.unreadBytes >= totalLength) {
                                try {
                                    tags.push(Types_1.ExtraNonceTag.ExtraNonceData.from(reader.bytes(totalLength)));
                                    seen.data = true;
                                }
                                catch (e) {
                                    reader.skip();
                                }
                            }
                            else {
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
            return new ExtraNonce(tags);
        }
        /**
         * Remove a specific Extra Nonce field from the field
         * @param removeTag the Extra Nonce tag type to remove
         */
        removeTag(removeTag) {
            const result = [];
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
        addTag(tag) {
            this.removeTag(tag.tag);
            this.tags.push(tag);
            this.m_tags.sort((a, b) => (a.tag > b.tag) ? 1 : -1);
        }
        /**
         * Represents the field as a Buffer
         * @returns the Buffer representation of the object
         */
        toBuffer() {
            const writer = new bytestream_1.Writer();
            writer.varint(this.tag);
            const subWriter = new bytestream_1.Writer();
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
        toString() {
            return this.toBuffer().toString('hex');
        }
    }
    ExtraTag.ExtraNonce = ExtraNonce;
    /**
     * Represents the transaction private key contained in the transaction extra field
     */
    class ExtraTransactionPrivateKey {
        /**
         * Creates a new instance of the field using the supplied public key
         * @param privateKey the public key to be stored in the field
         */
        constructor(privateKey) {
            this.m_tag = ExtraTagType.TRANSACTION_PRIVATE_KEY;
            this.m_privateKey = '';
            this.m_privateKey = privateKey;
        }
        /**
         * The tag type of the field
         */
        get tag() {
            return this.m_tag;
        }
        /**
         * The public key contained in the field
         */
        get privateKey() {
            return this.m_privateKey;
        }
        /**
         * The size of the field in bytes including the tag
         */
        get size() {
            return this.toBuffer().length;
        }
        /**
         * Creates a new instance of the field using a Buffer or Blob copy of
         * field created through other means
         * @param data the data that makes up the nonce field
         * @returns the new object
         */
        static from(data) {
            const reader = new bytestream_1.Reader(data);
            if (reader.varint().toJSNumber() !== ExtraTagType.TRANSACTION_PRIVATE_KEY) {
                throw new Error('Not a public key field');
            }
            if (reader.unreadBytes !== SIZES.KEY) {
                throw new RangeError('Not enough data available for reading');
            }
            const privateKey = reader.hash();
            return new ExtraTransactionPrivateKey(privateKey);
        }
        /**
         * Represents the field as a Buffer
         * @returns the Buffer representation of the object
         */
        toBuffer() {
            const writer = new bytestream_1.Writer();
            writer.varint(this.tag);
            writer.hash(this.privateKey);
            return writer.buffer;
        }
        /**
         * Represents the field as a hexadecimal string (blob)
         * @returns the hexadecimal (blob) representation of the object
         */
        toString() {
            return this.toBuffer().toString('hex');
        }
    }
    ExtraTag.ExtraTransactionPrivateKey = ExtraTransactionPrivateKey;
    /**
     * Represents the recipient public view key contained in the transaction
     * extra field for coinbase transactions
     */
    class ExtraRecipientPublicViewKey {
        /**
         * Creates a new instance of the field using the supplied public key
         * @param publicKey the public key to be stored in the field
         */
        constructor(publicKey) {
            this.m_tag = ExtraTagType.RECIPIENT_PUBLIC_VIEW_KEY;
            this.m_publicKey = '';
            this.m_publicKey = publicKey;
        }
        /**
         * The tag type of the field
         */
        get tag() {
            return this.m_tag;
        }
        /**
         * The public key contained in the field
         */
        get publicKey() {
            return this.m_publicKey;
        }
        /**
         * The size of the field in bytes including the tag
         */
        get size() {
            return this.toBuffer().length;
        }
        /**
         * Creates a new instance of the field using a Buffer or Blob copy of
         * field created through other means
         * @param data the data that makes up the nonce field
         * @returns the new object
         */
        static from(data) {
            const reader = new bytestream_1.Reader(data);
            if (reader.varint().toJSNumber() !== ExtraTagType.RECIPIENT_PUBLIC_VIEW_KEY) {
                throw new Error('Not a public key field');
            }
            if (reader.unreadBytes !== SIZES.KEY) {
                throw new RangeError('Not enough data available for reading');
            }
            const publicKey = reader.hash();
            return new ExtraRecipientPublicViewKey(publicKey);
        }
        /**
         * Represents the field as a Buffer
         * @returns the Buffer representation of the object
         */
        toBuffer() {
            const writer = new bytestream_1.Writer();
            writer.varint(this.tag);
            writer.hash(this.publicKey);
            return writer.buffer;
        }
        /**
         * Represents the field as a hexadecimal string (blob)
         * @returns the hexadecimal (blob) representation of the object
         */
        toString() {
            return this.toBuffer().toString('hex');
        }
    }
    ExtraTag.ExtraRecipientPublicViewKey = ExtraRecipientPublicViewKey;
    /**
     * Represents the recipient public spend key contained in the transaction
     * extra field for coinbase transactions
     */
    class ExtraRecipientPublicSpendKey {
        /**
         * Creates a new instance of the field using the supplied public key
         * @param publicKey the public key to be stored in the field
         */
        constructor(publicKey) {
            this.m_tag = ExtraTagType.RECIPIENT_PUBLIC_SPEND_KEY;
            this.m_publicKey = '';
            this.m_publicKey = publicKey;
        }
        /**
         * The tag type of the field
         */
        get tag() {
            return this.m_tag;
        }
        /**
         * The public key contained in the field
         */
        get publicKey() {
            return this.m_publicKey;
        }
        /**
         * The size of the field in bytes including the tag
         */
        get size() {
            return this.toBuffer().length;
        }
        /**
         * Creates a new instance of the field using a Buffer or Blob copy of
         * field created through other means
         * @param data the data that makes up the nonce field
         * @returns the new object
         */
        static from(data) {
            const reader = new bytestream_1.Reader(data);
            if (reader.varint().toJSNumber() !== ExtraTagType.RECIPIENT_PUBLIC_SPEND_KEY) {
                throw new Error('Not a public key field');
            }
            if (reader.unreadBytes !== SIZES.KEY) {
                throw new RangeError('Not enough data available for reading');
            }
            const publicKey = reader.hash();
            return new ExtraRecipientPublicSpendKey(publicKey);
        }
        /**
         * Represents the field as a Buffer
         * @returns the Buffer representation of the object
         */
        toBuffer() {
            const writer = new bytestream_1.Writer();
            writer.varint(this.tag);
            writer.hash(this.publicKey);
            return writer.buffer;
        }
        /**
         * Represents the field as a hexadecimal string (blob)
         * @returns the hexadecimal (blob) representation of the object
         */
        toString() {
            return this.toBuffer().toString('hex');
        }
    }
    ExtraTag.ExtraRecipientPublicSpendKey = ExtraRecipientPublicSpendKey;
    /**
     * Represents the extra field for the pool nonce used by mining pools
     */
    class ExtraPoolNonce {
        /**
         * Creates a new instance of the field from just the extra data to be included
         * @param data the pool nonce data to be included
         */
        constructor(data) {
            this.m_tag = ExtraTagType.POOL_NONCE;
            this.m_data = Buffer.alloc(0);
            this.m_data = data;
        }
        /**
         * The tag type of the field
         */
        get tag() {
            return this.m_tag;
        }
        /**
         * The size of the field in bytes including the tag
         */
        get size() {
            return this.toBuffer().length;
        }
        /**
         * The arbitrary data included in the field
         */
        get data() {
            return this.m_data;
        }
        /**
         * Creates a new instance of the field using a Buffer or Blob copy of
         * field created through other means
         * @param data the data that makes up the nonce field
         * @returns the new object
         */
        static from(data) {
            const reader = new bytestream_1.Reader(data);
            if (reader.varint().toJSNumber() !== ExtraTagType.POOL_NONCE) {
                throw new Error('Not an extra data field');
            }
            try {
                reader.varint(true);
            }
            catch (_a) {
                throw new Error('Cannot read required field data');
            }
            const length = reader.varint().toJSNumber();
            if (reader.unreadBytes !== length) {
                throw new RangeError('Not enough data available for reading');
            }
            const dataLength = reader.bytes(length);
            return new ExtraPoolNonce(dataLength);
        }
        /**
         * Represents the field as a Buffer
         * @returns the Buffer representation of the object
         */
        toBuffer() {
            const writer = new bytestream_1.Writer();
            writer.varint(this.tag);
            writer.varint(this.data.length);
            writer.write(this.data);
            return writer.buffer;
        }
        /**
         * Represents the field as a hexadecimal string (blob)
         * @returns the hexadecimal (blob) representation of the object
         */
        toString() {
            return this.toBuffer().toString('hex');
        }
    }
    ExtraTag.ExtraPoolNonce = ExtraPoolNonce;
})(ExtraTag = exports.ExtraTag || (exports.ExtraTag = {}));
