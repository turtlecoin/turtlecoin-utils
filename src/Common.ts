// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import { Writer } from '@turtlecoin/bytestream';
import { BigInteger } from './Types';
import { Config, ICoinConfig, ICoinRunningConfig } from './Config';

/** @ignore */
export class Common {
    public static mergeConfig (config: ICoinConfig): ICoinRunningConfig {
        const merged = Config;

        Object.keys(config)
            .forEach(key => {
                merged[key] = config[key];
            });

        return merged;
    }

    public static absoluteToRelativeOffsets (
        offsets: BigInteger.BigInteger[] | number[] | string []
    ): BigInteger.BigInteger[] {
        const offsetsCopy: BigInteger.BigInteger[] = [];

        for (const offset of offsets) {
            if (typeof offset === 'string') {
                offsetsCopy.push(BigInteger(offset));
            } else if (typeof offset === 'number') {
                offsetsCopy.push(BigInteger(offset));
            } else {
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

    public static relativeToAbsoluteOffsets (
        offsets: BigInteger.BigInteger[] | number[] | string[]
    ): BigInteger.BigInteger[] {
        const offsetsCopy: BigInteger.BigInteger[] = [];

        for (const offset of offsets) {
            if (typeof offset === 'string') {
                offsetsCopy.push(BigInteger(offset));
            } else if (typeof offset === 'number') {
                offsetsCopy.push(BigInteger(offset));
            } else {
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

    public static isHex (value: string): boolean {
        if (value.length % 2 !== 0) {
            return false;
        }

        const regex = new RegExp('^[0-9a-fA-F]{' + value.length + '}$');

        return regex.test(value);
    }

    public static isHex64 (value: string): boolean {
        return (Common.isHex(value) && value.length === 64);
    }

    public static isHex128 (value: string): boolean {
        return (Common.isHex(value) && value.length === 128);
    }

    public static varintLength (value: BigInteger.BigInteger | number): number {
        if (typeof value === 'number') {
            value = BigInteger(value);
        }
        const writer = new Writer();
        writer.varint(value);
        return writer.length;
    }

    public static hexPad (value: number | BigInteger.BigInteger, padLength?: number): string {
        if (typeof value === 'number') {
            value = BigInteger(value);
        }

        const hex = value.toString(16);

        padLength = padLength || Math.round(hex.length / 2) * 2;

        return hex.padStart(padLength, '0');
    }

    public static hexPadToBuffer (value: number | BigInteger.BigInteger, padLength?: number): Buffer {
        return Buffer.from(Common.hexPad(value, padLength), 'hex');
    }
}
