// Copyright (c) 2019-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import { Reader, Writer } from '@turtlecoin/bytestream';
import { PortableStorageConstants, PortableStoreValue } from '../Types';

/** @ignore */
export enum StorageType {
    NULL = 0x00,
    INT64 = 0x01,
    INT = 0x02,
    INT16 = 0x03,
    SBYTE = 0x04,
    UINT64 = 0x05,
    UINT32 = 0x06,
    UINT16 = 0x07,
    UINT8 = 0x08,
    DOUBLE = 0x09,
    STRING = 0x0a,
    BOOL = 0x0b,
    OBJECT = 0x0c,
    OBJECT_ARRAY_BAD = 0x0d,
    BUFFER = 0x0e,
    STRING_ARRAY = 0x8a,
    OBJECT_ARRAY = 0x8c,
}

/** @ignore */
interface PortableStorageEntry {
    name: string;
    type: StorageType;
    value: any;
}

/** @ignore */
export class PortableStorage {
    public get version (): number {
        return this.m_version;
    }

    public set version (value: number) {
        this.m_version = value;
    }

    public static from (data: Reader | Buffer | string, skipHeader = false): PortableStorage {
        const reader = new Reader(data);

        const result = new PortableStorage();

        if (reader.unreadBytes === 0) {
            return result;
        }

        if (!skipHeader) {
            result.m_signatureA = reader.uint32_t().toJSNumber();
            result.m_signatureB = reader.uint32_t().toJSNumber();

            if (result.m_signatureA !== PortableStorageConstants.SIGNATURE_A ||
                result.m_signatureB !== PortableStorageConstants.SIGNATURE_B) {
                throw new Error('Portable storage signature failure');
            }

            result.m_version = reader.uint8_t().toJSNumber();
        }

        result.m_entries = blobToEntries(reader);

        if (!skipHeader && reader.unreadBytes !== 0) {
            throw new RangeError('Unstructured data found in stream');
        }

        return result;
    }

    protected m_version: number = PortableStorageConstants.VERSION;
    protected m_signatureA: number = PortableStorageConstants.SIGNATURE_A;
    protected m_signatureB: number = PortableStorageConstants.SIGNATURE_B;
    protected m_entries: PortableStorageEntry[] = [];

    public get (name: string): PortableStoreValue {
        for (const entry of this.m_entries) {
            if (entry.name === name) {
                return entry.value;
            }
        }

        throw new Error('Entry not found');
    }

    public set (name: string, value: PortableStoreValue, type: StorageType) {
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < this.m_entries.length; i++) {
            if (this.m_entries[i].name === name && this.m_entries[i].type === type) {
                this.m_entries[i].value = value;
                return;
            }
        }

        this.m_entries.push({ name, type, value });
    }

    public exists (name: string): boolean {
        for (const entry of this.m_entries) {
            if (entry.name === name) {
                return true;
            }
        }

        return false;
    }

    public toBuffer (skipHeader = false): Buffer {
        const writer = new Writer();

        if (!skipHeader) {
            writer.uint32_t(this.m_signatureA);
            writer.uint32_t(this.m_signatureB);
            writer.uint8_t(this.m_version);
        }

        writer.write(entriesToBuffer(this.m_entries));

        return writer.buffer;
    }

    public toString (skipHeader = false): string {
        return this.toBuffer(skipHeader).toString('hex');
    }
}

/** @ignore */
function blobToEntries (reader: Reader): PortableStorageEntry[] {
    const entryCount = reader.varint(false, true).toJSNumber();
    const entries: PortableStorageEntry[] = [];

    for (let i = 0; i < entryCount; i++) {
        const keyLength = reader.uint8_t().toJSNumber();
        const name = reader.bytes(keyLength).toString();
        const type = reader.uint8_t().toJSNumber();

        let arrCount;
        let j;
        let value;
        let valueLength;

        switch (type) {
            case StorageType.NULL:
                entries.push({ name, type, value: null });
                break;

            case StorageType.UINT64:
                entries.push({ name, type, value: reader.uint64_t(true) });
                break;

            case StorageType.UINT32:
                entries.push({ name, type, value: reader.uint32_t() });
                break;

            case StorageType.UINT16:
                entries.push({ name, type, value: reader.uint16_t() });
                break;

            case StorageType.UINT8:
                entries.push({ name, type, value: reader.uint8_t() });
                break;

            case StorageType.STRING:
                valueLength = reader.varint(false, true).toJSNumber();
                entries.push({ name, type, value: reader.bytes(valueLength).toString('hex') });
                break;

            case StorageType.BOOL:
                value = reader.uint8_t().toJSNumber();
                entries.push({ name, type, value: (value === 1) });
                break;

            case StorageType.OBJECT:
                entries.push({ name, type, value: PortableStorage.from(reader, true) });
                break;

            case StorageType.BUFFER:
                valueLength = reader.varint(false, true).toJSNumber();
                entries.push({ name, type, value: reader.bytes(valueLength) });
                break;

            case StorageType.STRING_ARRAY: {
                arrCount = reader.varint(false, true).toJSNumber();
                const sa_arr: string[] = [];

                for (j = 0; j < arrCount; j++) {
                    const stringLength = reader.varint(false, true).toJSNumber();

                    sa_arr.push(reader.bytes(stringLength).toString('hex'));
                }

                entries.push({ name, type, value: sa_arr });
            }
                break;

            case StorageType.OBJECT_ARRAY: {
                arrCount = reader.varint(false, true).toJSNumber();
                const oa_arr: PortableStorage[] = [];

                for (j = 0; j < arrCount; j++) {
                    oa_arr.push(PortableStorage.from(reader, true));
                }

                entries.push({ name, type, value: oa_arr });
            }
                break;
            default:
                throw new Error(type + ' not implemented');
        }
    }

    return entries;
}

/** @ignore */
function entriesToBuffer (entries: PortableStorageEntry[]): Buffer {
    const writer = new Writer();

    writer.varint(entries.length, true);

    for (const entry of entries) {
        const keyName = Buffer.from(entry.name);
        writer.uint8_t(keyName.length);
        writer.write(keyName);
        writer.uint8_t(entry.type);

        switch (entry.type) {
            case StorageType.UINT64:
                writer.uint64_t(entry.value, true);
                break;
            case StorageType.UINT32:
                writer.uint32_t(entry.value);
                break;
            case StorageType.UINT16:
                writer.uint16_t(entry.value);
                break;
            case StorageType.UINT8:
                writer.uint8_t(entry.value);
                break;
            case StorageType.STRING: {
                const s_buf = Buffer.from(entry.value, 'hex');
                writer.varint(s_buf.length, true);
                writer.write(s_buf);
            }
                break;
            case StorageType.BOOL:
                writer.uint8_t((entry.value) ? 1 : 0);
                break;
            case StorageType.OBJECT:
                writer.write(entry.value.toBuffer(true));
                break;
            case StorageType.BUFFER:
                writer.varint(entry.value.length, true);
                writer.write(entry.value);
                break;
            case StorageType.STRING_ARRAY:
                writer.varint(entry.value.length, true);
                entry.value.forEach((v: string) => {
                    const vb = Buffer.from(v, 'hex');
                    writer.varint(vb.length, true);
                    writer.write(vb);
                });
                break;
            case StorageType.OBJECT_ARRAY:
                writer.varint(entry.value.length, true);
                entry.value.forEach((v: PortableStorage) => {
                    writer.write(v.toBuffer(true));
                });
                break;
            default:
                throw new Error('Unknown type: ' + entry.type);
        }
    }

    return writer.buffer;
}
