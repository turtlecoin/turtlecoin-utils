/// <reference types="node" />
import { Reader } from '@turtlecoin/bytestream';
import { BigInteger } from '../Types';
/** @ignore */
declare type PortableStoreValue = BigInteger.BigInteger | Buffer | PortableStorage | PortableStorage[] | string | string[] | boolean;
/** @ignore */
export declare enum StorageType {
    NULL = 0,
    INT64 = 1,
    INT = 2,
    INT16 = 3,
    SBYTE = 4,
    UINT64 = 5,
    UINT32 = 6,
    UINT16 = 7,
    UINT8 = 8,
    DOUBLE = 9,
    STRING = 10,
    BOOL = 11,
    OBJECT = 12,
    OBJECT_ARRAY_BAD = 13,
    BUFFER = 14,
    STRING_ARRAY = 138,
    OBJECT_ARRAY = 140
}
/** @ignore */
interface PortableStorageEntry {
    name: string;
    type: StorageType;
    value: any;
}
/** @ignore */
export declare class PortableStorage {
    get version(): number;
    set version(value: number);
    static from(data: Reader | Buffer | string, skipHeader?: boolean): PortableStorage;
    protected m_version: number;
    protected m_signatureA: number;
    protected m_signatureB: number;
    protected m_entries: PortableStorageEntry[];
    get(name: string): PortableStoreValue;
    set(name: string, value: PortableStoreValue, type: StorageType): void;
    exists(name: string): boolean;
    toBuffer(skipHeader?: boolean): Buffer;
    toString(skipHeader?: boolean): string;
}
export {};
