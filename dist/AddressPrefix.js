"use strict";
// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddressPrefix = exports.SIZES = void 0;
const base58_1 = require("@turtlecoin/base58");
const Config_1 = require("./Config");
const bytestream_1 = require("@turtlecoin/bytestream");
/** @ignore */
var SIZES;
(function (SIZES) {
    SIZES[SIZES["KEY"] = 32] = "KEY";
    SIZES[SIZES["CHECKSUM"] = 4] = "CHECKSUM";
})(SIZES = exports.SIZES || (exports.SIZES = {}));
/**
 * Represents a TurtleCoin address prefix
 */
class AddressPrefix {
    /**
     * Creates a new address prefix object
     * @param [decimal] the decimal representation of the address prefix
     * @param [base58] the Base58 representation of the address prefix
     */
    constructor(decimal, base58) {
        this.m_decimal = Config_1.Config.addressPrefix || 3914525;
        if (decimal) {
            this.m_decimal = decimal;
        }
        if (base58) {
            this.m_base58 = base58;
        }
    }
    /**
     * The Base58 encoded address prefix
     */
    get base58() {
        if (this.m_base58) {
            return this.m_base58;
        }
        return base58_1.Base58.encode(this.hex);
    }
    /**
     * The decimal encoded address prefix
     */
    get decimal() {
        return this.m_decimal || 0;
    }
    /**
     * The hexadecimal encoded address prefix
     */
    get hex() {
        return this.varint.toString('hex');
    }
    /**
     * The varint encoded address prefix
     */
    get varint() {
        const writer = new bytestream_1.Writer();
        writer.varint(this.decimal);
        return writer.buffer;
    }
    /**
     * The size of the address prefix in bytes
     */
    get size() {
        return this.varint.length;
    }
    /**
     * Creates a new address prefix object from a Base58 encoded address
     * @param address the public wallet address to decode to obtain the address prefix
     * @returns the address prefix
     */
    static from(address) {
        let decodedAddress = base58_1.Base58.decode(address);
        /* Chop off the checksum */
        decodedAddress = decodedAddress.slice(0, -(SIZES.CHECKSUM * 2));
        const prefixLength = decodedAddress.length % (SIZES.KEY * 2);
        const prefixDecoded = decodedAddress.slice(0, prefixLength);
        const reader = new bytestream_1.Reader(prefixDecoded);
        const prefixDecimal = reader.varint().toJSNumber();
        /* This starts a bit of hackery to deal with the block encoding
         * used by Base58 and the fact that the prefix may not be exactly
         * one data block long */
        let offset = (prefixDecimal.toString().length % 2 === 0) ? 1 : 0;
        if (prefixDecimal.toString().length > 10) {
            offset += Math.floor((prefixDecimal.toString().length % 10) / 2);
        }
        const prefixEncoded = address.slice(0, Math.ceil(prefixDecimal.toString().length / 2) + offset);
        return new AddressPrefix(prefixDecimal, prefixEncoded);
    }
}
exports.AddressPrefix = AddressPrefix;
