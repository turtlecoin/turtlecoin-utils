"use strict";
// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.
Object.defineProperty(exports, "__esModule", { value: true });
exports.Common = void 0;
const bytestream_1 = require("@turtlecoin/bytestream");
const Types_1 = require("./Types");
const Config_1 = require("./Config");
/** @ignore */
class Common {
    static mergeConfig(config) {
        const merged = Config_1.Config;
        Object.keys(config)
            .forEach(key => {
            merged[key] = config[key];
        });
        return merged;
    }
    static absoluteToRelativeOffsets(offsets) {
        const offsetsCopy = [];
        for (const offset of offsets) {
            if (typeof offset === 'string') {
                offsetsCopy.push(Types_1.BigInteger(offset));
            }
            else if (typeof offset === 'number') {
                offsetsCopy.push(Types_1.BigInteger(offset));
            }
            else {
                offsetsCopy.push(offset);
            }
        }
        if (offsetsCopy.length === 1) {
            return offsetsCopy;
        }
        for (let i = offsetsCopy.length - 1; i >= 1; --i) {
            offsetsCopy[i] = offsetsCopy[i].subtract(offsetsCopy[i - 1]);
        }
        return offsetsCopy;
    }
    static relativeToAbsoluteOffsets(offsets) {
        const offsetsCopy = [];
        for (const offset of offsets) {
            if (typeof offset === 'string') {
                offsetsCopy.push(Types_1.BigInteger(offset));
            }
            else if (typeof offset === 'number') {
                offsetsCopy.push(Types_1.BigInteger(offset));
            }
            else {
                offsetsCopy.push(offset);
            }
        }
        if (offsetsCopy.length === 1) {
            return offsetsCopy;
        }
        for (let i = 1; i < offsetsCopy.length; i++) {
            offsetsCopy[i] = offsetsCopy[i - 1].add(offsetsCopy[i]);
        }
        return offsetsCopy;
    }
    static isHex(value) {
        if (value.length % 2 !== 0) {
            return false;
        }
        const regex = new RegExp('^[0-9a-fA-F]{' + value.length + '}$');
        return regex.test(value);
    }
    static isHex64(value) {
        return (Common.isHex(value) && value.length === 64);
    }
    static isHex128(value) {
        return (Common.isHex(value) && value.length === 128);
    }
    static varintLength(value) {
        if (typeof value === 'number') {
            value = Types_1.BigInteger(value);
        }
        const writer = new bytestream_1.Writer();
        writer.varint(value);
        return writer.length;
    }
    static hexPad(value, padLength) {
        if (typeof value === 'number') {
            value = Types_1.BigInteger(value);
        }
        const hex = value.toString(16);
        padLength = padLength || Math.round(hex.length / 2) * 2;
        return hex.padStart(padLength, '0');
    }
    static hexPadToBuffer(value, padLength) {
        return Buffer.from(Common.hexPad(value, padLength), 'hex');
    }
}
exports.Common = Common;
