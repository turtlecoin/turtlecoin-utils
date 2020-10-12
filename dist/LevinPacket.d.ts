/// <reference types="node" />
import { Reader } from '@turtlecoin/bytestream';
import { LevinPayloads } from './Types/LevinPayloads';
/** @ignore */
import ILevinPayload = LevinPayloads.ILevinPayload;
export declare namespace LevinProtocol {
    /**
     * Describes each of the Levin Packet Command Types
     */
    enum CommandType {
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
        MISSING_TRANSACTIONS = 2010
    }
}
/**
 * Provides a representation of a Levin Packet on a network
 */
export declare class LevinPacket {
    /**
     * The packet signature
     */
    get signature(): string;
    set signature(value: string);
    /**
     * Whether or not we expect a response to this request
     */
    get return_data(): boolean;
    set return_data(value: boolean);
    /**
     * The Levin Packet Command type
     */
    get command(): LevinProtocol.CommandType;
    set command(command: LevinProtocol.CommandType);
    /**
     * The response return code
     */
    get return_code(): number;
    set return_code(value: number);
    /**
     * The response flags
     */
    get flags(): number;
    set flags(value: number);
    /**
     * The packet version
     */
    get version(): number;
    set version(value: number);
    /**
     * The packet payload - See the Levin Payloads list
     */
    get payload(): ILevinPayload;
    set payload(payload: ILevinPayload);
    /**
     * Creates a new instance of a Levin Packet from the supplied data
     * @param data the raw data that came in over the wire
     * @returns a new instance of the object
     */
    static from(data: Reader | Buffer | string): Promise<LevinPacket>;
    private m_signature;
    private m_return_data;
    private m_command;
    private m_return_code;
    private m_flags;
    private m_protocol_version;
    private m_payload;
    /**
     * Creates a new instance of a Levin packet of the given command type
     * @param [command] the command type that the packet will be for
     */
    constructor(command?: LevinProtocol.CommandType);
    /**
     * Provides the Buffer representation of the Levin Packet
     * @returns the buffer representation of the object
     */
    toBuffer(): Buffer;
    /**
     * Provides the hexadecimal (blob) representation of the Levin Packet
     * @returns the hexadecimal (blob) representation of the object
     */
    toString(): string;
}
