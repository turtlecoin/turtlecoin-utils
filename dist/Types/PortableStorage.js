"use strict";
// Copyright (c) 2019-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortableStorage = exports.StorageType = void 0;
const bytestream_1 = require("@turtlecoin/bytestream");
const Types_1 = require("../Types");
/** @ignore */
var StorageType;
(function (StorageType) {
    StorageType[StorageType["NULL"] = 0] = "NULL";
    StorageType[StorageType["INT64"] = 1] = "INT64";
    StorageType[StorageType["INT"] = 2] = "INT";
    StorageType[StorageType["INT16"] = 3] = "INT16";
    StorageType[StorageType["SBYTE"] = 4] = "SBYTE";
    StorageType[StorageType["UINT64"] = 5] = "UINT64";
    StorageType[StorageType["UINT32"] = 6] = "UINT32";
    StorageType[StorageType["UINT16"] = 7] = "UINT16";
    StorageType[StorageType["UINT8"] = 8] = "UINT8";
    StorageType[StorageType["DOUBLE"] = 9] = "DOUBLE";
    StorageType[StorageType["STRING"] = 10] = "STRING";
    StorageType[StorageType["BOOL"] = 11] = "BOOL";
    StorageType[StorageType["OBJECT"] = 12] = "OBJECT";
    StorageType[StorageType["OBJECT_ARRAY_BAD"] = 13] = "OBJECT_ARRAY_BAD";
    StorageType[StorageType["BUFFER"] = 14] = "BUFFER";
    StorageType[StorageType["STRING_ARRAY"] = 138] = "STRING_ARRAY";
    StorageType[StorageType["OBJECT_ARRAY"] = 140] = "OBJECT_ARRAY";
})(StorageType = exports.StorageType || (exports.StorageType = {}));
/** @ignore */
class PortableStorage {
    constructor() {
        this.m_version = Types_1.PortableStorageConstants.VERSION;
        this.m_signatureA = Types_1.PortableStorageConstants.SIGNATURE_A;
        this.m_signatureB = Types_1.PortableStorageConstants.SIGNATURE_B;
        this.m_entries = [];
    }
    get version() {
        return this.m_version;
    }
    set version(value) {
        this.m_version = value;
    }
    static from(data, skipHeader = false) {
        const reader = new bytestream_1.Reader(data);
        const result = new PortableStorage();
        if (reader.unreadBytes === 0) {
            return result;
        }
        if (!skipHeader) {
            result.m_signatureA = reader.uint32_t().toJSNumber();
            result.m_signatureB = reader.uint32_t().toJSNumber();
            if (result.m_signatureA !== Types_1.PortableStorageConstants.SIGNATURE_A ||
                result.m_signatureB !== Types_1.PortableStorageConstants.SIGNATURE_B) {
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
    get(name) {
        for (const entry of this.m_entries) {
            if (entry.name === name) {
                return entry.value;
            }
        }
        throw new Error('Entry not found');
    }
    set(name, value, type) {
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < this.m_entries.length; i++) {
            if (this.m_entries[i].name === name && this.m_entries[i].type === type) {
                this.m_entries[i].value = value;
                return;
            }
        }
        this.m_entries.push({ name, type, value });
    }
    exists(name) {
        for (const entry of this.m_entries) {
            if (entry.name === name) {
                return true;
            }
        }
        return false;
    }
    toBuffer(skipHeader = false) {
        const writer = new bytestream_1.Writer();
        if (!skipHeader) {
            writer.uint32_t(this.m_signatureA);
            writer.uint32_t(this.m_signatureB);
            writer.uint8_t(this.m_version);
        }
        writer.write(entriesToBuffer(this.m_entries));
        return writer.buffer;
    }
    toString(skipHeader = false) {
        return this.toBuffer(skipHeader).toString('hex');
    }
}
exports.PortableStorage = PortableStorage;
/** @ignore */
function blobToEntries(reader) {
    const entryCount = reader.varint(false, true).toJSNumber();
    const entries = [];
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
            case StorageType.STRING_ARRAY:
                {
                    arrCount = reader.varint(false, true).toJSNumber();
                    const sa_arr = [];
                    for (j = 0; j < arrCount; j++) {
                        const stringLength = reader.varint(false, true).toJSNumber();
                        sa_arr.push(reader.bytes(stringLength).toString('hex'));
                    }
                    entries.push({ name, type, value: sa_arr });
                }
                break;
            case StorageType.OBJECT_ARRAY:
                {
                    arrCount = reader.varint(false, true).toJSNumber();
                    const oa_arr = [];
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
function entriesToBuffer(entries) {
    const writer = new bytestream_1.Writer();
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
            case StorageType.STRING:
                {
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
                entry.value.forEach((v) => {
                    const vb = Buffer.from(v, 'hex');
                    writer.varint(vb.length, true);
                    writer.write(vb);
                });
                break;
            case StorageType.OBJECT_ARRAY:
                writer.varint(entry.value.length, true);
                entry.value.forEach((v) => {
                    writer.write(v.toBuffer(true));
                });
                break;
            default:
                throw new Error('Unknown type: ' + entry.type);
        }
    }
    return writer.buffer;
}
