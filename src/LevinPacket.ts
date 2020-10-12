// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import { Reader, Writer } from '@turtlecoin/bytestream';
import { LevinPayloads } from './Types/LevinPayloads';
/** @ignore */
import LevinPayload = LevinPayloads.LevinPayload;
/** @ignore */
import Handshake = LevinPayloads.Handshake;
/** @ignore */
import TimedSync = LevinPayloads.TimedSync;
/** @ignore */
import Ping = LevinPayloads.Ping;
/** @ignore */
import NewBlock = LevinPayloads.NewBlock;
/** @ignore */
import NewTransactions = LevinPayloads.NewTransactions;
/** @ignore */
import RequestGetObjects = LevinPayloads.RequestGetObjects;
/** @ignore */
import ResponseGetObjects = LevinPayloads.ResponseGetObjects;
/** @ignore */
import RequestChain = LevinPayloads.RequestChain;
/** @ignore */
import ResponseChain = LevinPayloads.ResponseChain;
/** @ignore */
import RequestTXPool = LevinPayloads.RequestTXPool;
/** @ignore */
import LiteBlock = LevinPayloads.LiteBlock;
/** @ignore */
import MissingTransactions = LevinPayloads.MissingTransactions;
/** @ignore */
import ILevinPayload = LevinPayloads.ILevinPayload;

/** @ignore */
const LevinPacketSignature = '0101010101012101';

export namespace LevinProtocol {
    /**
     * Describes each of the Levin Packet Command Types
     */
    export enum CommandType {
        HANDSHAKE = 1001,
        TIMEDSYNC = 1002,
        PING = 1003,
        NEW_BLOCK = 2001,
        NEW_TRANSACTIONS = 2002,
        REQUEST_GET_OBJECTS = 2003,
        RESPONSE_GET_OBJECTS = 2004,
        RESERVED = 2005,
        REQUEST_CHAIN = 2006,
        RESPONSE_CHAIN_ENTRY = 2007,
        REQUEST_TX_POOL = 2008,
        LITE_BLOCK = 2009,
        MISSING_TRANSACTIONS = 2010,
    }
}

/**
 * Provides a representation of a Levin Packet on a network
 */
export class LevinPacket {
    /**
     * The packet signature
     */
    public get signature (): string {
        return this.m_signature;
    }

    public set signature (value: string) {
        const reader = new Reader(value);

        if (reader.length !== 8) {
            throw new RangeError('Signature is not the correct number of bytes');
        }

        this.m_signature = reader.hex(8);
    }

    /**
     * Whether or not we expect a response to this request
     */
    public get return_data (): boolean {
        return this.m_return_data;
    }

    public set return_data (value: boolean) {
        this.m_return_data = value;
    }

    /**
     * The Levin Packet Command type
     */
    public get command (): LevinProtocol.CommandType {
        return this.m_command;
    }

    public set command (command: LevinProtocol.CommandType) {
        if (this.m_command !== command) {
            switch (command) {
                case LevinProtocol.CommandType.HANDSHAKE:
                    this.payload = new Handshake();
                    break;
                case LevinProtocol.CommandType.TIMEDSYNC:
                    this.payload = new TimedSync();
                    break;
                case LevinProtocol.CommandType.PING:
                    this.payload = new Ping();
                    break;
                case LevinProtocol.CommandType.NEW_BLOCK:
                    this.payload = new NewBlock();
                    break;
                case LevinProtocol.CommandType.NEW_TRANSACTIONS:
                    this.payload = new NewTransactions();
                    break;
                case LevinProtocol.CommandType.REQUEST_GET_OBJECTS:
                    this.payload = new RequestGetObjects();
                    break;
                case LevinProtocol.CommandType.RESPONSE_GET_OBJECTS:
                    this.payload = new ResponseGetObjects();
                    break;
                case LevinProtocol.CommandType.REQUEST_CHAIN:
                    this.payload = new RequestChain();
                    break;
                case LevinProtocol.CommandType.RESPONSE_CHAIN_ENTRY:
                    this.payload = new ResponseChain();
                    break;
                case LevinProtocol.CommandType.REQUEST_TX_POOL:
                    this.payload = new RequestTXPool();
                    break;
                case LevinProtocol.CommandType.LITE_BLOCK:
                    this.payload = new LiteBlock();
                    break;
                case LevinProtocol.CommandType.MISSING_TRANSACTIONS:
                    this.payload = new MissingTransactions();
                    break;
                case LevinProtocol.CommandType.RESERVED:
                default:
                    throw new Error('Unknown command type: ' + command);
            }

            this.m_command = command;
        }
    }

    /**
     * The response return code
     */
    public get return_code (): number {
        return this.m_return_code;
    }

    public set return_code (value: number) {
        this.m_return_code = value;
    }

    /**
     * The response flags
     */
    public get flags (): number {
        return this.m_flags;
    }

    public set flags (value: number) {
        this.m_flags = value;
    }

    /**
     * The packet version
     */
    public get version (): number {
        return this.m_protocol_version;
    }

    public set version (value: number) {
        this.m_protocol_version = value;
    }

    /**
     * The packet payload - See the Levin Payloads list
     */
    public get payload (): ILevinPayload {
        return this.m_payload;
    }

    public set payload (payload: ILevinPayload) {
        this.m_payload = payload;
    }

    /**
     * Creates a new instance of a Levin Packet from the supplied data
     * @param data the raw data that came in over the wire
     * @returns a new instance of the object
     */
    public static async from (data: Reader | Buffer | string): Promise<LevinPacket> {
        const reader = new Reader(data);

        if (reader.length < 33) {
            throw new RangeError('Invalid input stream supplied');
        }

        const result = new LevinPacket();

        result.signature = reader.bytes(8).swap64().toString('hex');

        if (result.signature !== LevinPacketSignature) {
            throw new Error('Invalid Levin Packet Signature');
        }

        const bodyLength = reader.uint64_t().toJSNumber();

        result.return_data = (reader.uint8_t().toJSNumber() === 1);

        result.command = reader.uint32_t().toJSNumber();

        result.return_code = reader.uint32_t().toJSNumber();

        result.flags = reader.int32_t().toJSNumber();

        result.version = reader.uint32_t().toJSNumber();

        const payload = reader.bytes(bodyLength);

        switch (result.command) {
            case LevinProtocol.CommandType.HANDSHAKE:
                result.payload = Handshake.from(payload);
                break;
            case LevinProtocol.CommandType.TIMEDSYNC:
                result.payload = TimedSync.from(payload);
                break;
            case LevinProtocol.CommandType.PING:
                result.payload = Ping.from(payload);
                break;
            case LevinProtocol.CommandType.NEW_BLOCK:
                result.payload = await NewBlock.from(payload);
                break;
            case LevinProtocol.CommandType.NEW_TRANSACTIONS:
                result.payload = await NewTransactions.from(payload);
                break;
            case LevinProtocol.CommandType.REQUEST_GET_OBJECTS:
                result.payload = RequestGetObjects.from(payload);
                break;
            case LevinProtocol.CommandType.RESPONSE_GET_OBJECTS:
                result.payload = await ResponseGetObjects.from(payload);
                break;
            case LevinProtocol.CommandType.REQUEST_CHAIN:
                result.payload = RequestChain.from(payload);
                break;
            case LevinProtocol.CommandType.RESPONSE_CHAIN_ENTRY:
                result.payload = ResponseChain.from(payload);
                break;
            case LevinProtocol.CommandType.REQUEST_TX_POOL:
                result.payload = RequestTXPool.from(payload);
                break;
            case LevinProtocol.CommandType.LITE_BLOCK:
                result.payload = await LiteBlock.from(payload);
                break;
            case LevinProtocol.CommandType.MISSING_TRANSACTIONS:
                result.payload = MissingTransactions.from(payload);
                break;
            case LevinProtocol.CommandType.RESERVED:
            default:
                throw new Error('Unknown command type: ' + result.command);
        }

        return result;
    }

    private m_signature: string = LevinPacketSignature;
    private m_return_data = false;
    private m_command: LevinProtocol.CommandType = 0;
    private m_return_code = 0;
    private m_flags = 0;
    private m_protocol_version = 1;
    private m_payload: ILevinPayload = new LevinPayload();

    /**
     * Creates a new instance of a Levin packet of the given command type
     * @param [command] the command type that the packet will be for
     */
    constructor (command?: LevinProtocol.CommandType) {
        if (command) {
            switch (command) {
                case LevinProtocol.CommandType.HANDSHAKE:
                    this.payload = new Handshake();
                    break;
                case LevinProtocol.CommandType.TIMEDSYNC:
                    this.payload = new TimedSync();
                    break;
                case LevinProtocol.CommandType.PING:
                    this.payload = new Ping();
                    break;
                case LevinProtocol.CommandType.NEW_BLOCK:
                    this.payload = new NewBlock();
                    break;
                case LevinProtocol.CommandType.NEW_TRANSACTIONS:
                    this.payload = new NewTransactions();
                    break;
                case LevinProtocol.CommandType.REQUEST_GET_OBJECTS:
                    this.payload = new RequestGetObjects();
                    break;
                case LevinProtocol.CommandType.RESPONSE_GET_OBJECTS:
                    this.payload = new ResponseGetObjects();
                    break;
                case LevinProtocol.CommandType.REQUEST_CHAIN:
                    this.payload = new RequestChain();
                    break;
                case LevinProtocol.CommandType.RESPONSE_CHAIN_ENTRY:
                    this.payload = new ResponseChain();
                    break;
                case LevinProtocol.CommandType.REQUEST_TX_POOL:
                    this.payload = new RequestTXPool();
                    break;
                case LevinProtocol.CommandType.LITE_BLOCK:
                    this.payload = new LiteBlock();
                    break;
                case LevinProtocol.CommandType.MISSING_TRANSACTIONS:
                    this.payload = new MissingTransactions();
                    break;
                case LevinProtocol.CommandType.RESERVED:
                default:
                    throw new Error('Unknown command type: ' + command);
            }

            this.command = command;
        }
    }

    /**
     * Provides the Buffer representation of the Levin Packet
     * @returns the buffer representation of the object
     */
    public toBuffer (): Buffer {
        const writer = new Writer();

        writer.write(Buffer.from(this.signature, 'hex').swap64());

        const payload = this.payload.toBuffer();

        writer.uint64_t(payload.length);

        writer.uint8_t((this.return_data) ? 1 : 0);

        writer.uint32_t(this.command);

        writer.int32_t(this.return_code);

        writer.uint32_t(this.flags);

        writer.uint32_t(this.version);

        writer.write(payload);

        return writer.buffer;
    }

    /**
     * Provides the hexadecimal (blob) representation of the Levin Packet
     * @returns the hexadecimal (blob) representation of the object
     */
    public toString (): string {
        return this.toBuffer().toString('hex');
    }
}
