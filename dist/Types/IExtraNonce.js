"use strict";
// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExtraNonceTag = void 0;
const bytestream_1 = require("@turtlecoin/bytestream");
const Common_1 = require("../Common");
/** @ignore */
var SIZES;
(function (SIZES) {
    SIZES[SIZES["KEY"] = 32] = "KEY";
})(SIZES || (SIZES = {}));
var ExtraNonceTag;
(function (ExtraNonceTag) {
    /**
     * Nonce subtag types
     */
    let NonceTagType;
    (function (NonceTagType) {
        NonceTagType[NonceTagType["PAYMENT_ID"] = 0] = "PAYMENT_ID";
        NonceTagType[NonceTagType["EXTRA_DATA"] = 127] = "EXTRA_DATA";
    })(NonceTagType = ExtraNonceTag.NonceTagType || (ExtraNonceTag.NonceTagType = {}));
    /**
     * Abstract interface for structured Extra Nonce Field Values
     */
    class IExtraNonce {
    }
    ExtraNonceTag.IExtraNonce = IExtraNonce;
    /**
     * Represents arbitrary extra data included in the nonce by the user
     */
    class ExtraNonceData {
        /**
         * Creates a new instance of the field from just the extra data to be included
         * @param data the arbitrary data to be included in the field
         */
        constructor(data) {
            this.m_tag = NonceTagType.EXTRA_DATA;
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
            if (reader.varint().toJSNumber() !== NonceTagType.EXTRA_DATA) {
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
            return new ExtraNonceData(dataLength);
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
    ExtraNonceTag.ExtraNonceData = ExtraNonceData;
    /**
     * Represents a payment ID included in the Extra Nonce field
     */
    class ExtraNoncePaymentId {
        /**
         * Constructs a new instance of the field using the supplied payment ID
         * @param paymentId
         */
        constructor(paymentId) {
            this.m_tag = NonceTagType.PAYMENT_ID;
            this.m_paymentId = '';
            if (!Common_1.Common.isHex64(paymentId)) {
                throw new Error('paymentId must be 64 hexadecimal characters');
            }
            this.m_paymentId = paymentId;
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
         * The payment ID contained in the field
         */
        get paymentId() {
            return this.m_paymentId;
        }
        /**
         * Creates a new instance of the field using a Buffer or Blob copy of
         * field created through other means
         * @param data the data that makes up the nonce field
         * @returns the new object
         */
        static from(data) {
            const reader = new bytestream_1.Reader(data);
            if (reader.varint().toJSNumber() !== NonceTagType.PAYMENT_ID) {
                throw new Error('Not a payment ID field');
            }
            if (reader.unreadBytes !== SIZES.KEY) {
                throw new RangeError('Not enough data available for reading');
            }
            const paymentId = reader.hash();
            return new ExtraNoncePaymentId(paymentId);
        }
        /**
         * Represents the field as a Buffer
         * @returns the Buffer representation of the object
         */
        toBuffer() {
            const writer = new bytestream_1.Writer();
            writer.varint(this.tag);
            writer.hash(this.paymentId);
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
    ExtraNonceTag.ExtraNoncePaymentId = ExtraNoncePaymentId;
})(ExtraNonceTag = exports.ExtraNonceTag || (exports.ExtraNonceTag = {}));
