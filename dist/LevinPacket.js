"use strict";
// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LevinPacket = exports.LevinProtocol = void 0;
const bytestream_1 = require("@turtlecoin/bytestream");
const LevinPayloads_1 = require("./Types/LevinPayloads");
/** @ignore */
var LevinPayload = LevinPayloads_1.LevinPayloads.LevinPayload;
/** @ignore */
var Handshake = LevinPayloads_1.LevinPayloads.Handshake;
/** @ignore */
var TimedSync = LevinPayloads_1.LevinPayloads.TimedSync;
/** @ignore */
var Ping = LevinPayloads_1.LevinPayloads.Ping;
/** @ignore */
var NewBlock = LevinPayloads_1.LevinPayloads.NewBlock;
/** @ignore */
var NewTransactions = LevinPayloads_1.LevinPayloads.NewTransactions;
/** @ignore */
var RequestGetObjects = LevinPayloads_1.LevinPayloads.RequestGetObjects;
/** @ignore */
var ResponseGetObjects = LevinPayloads_1.LevinPayloads.ResponseGetObjects;
/** @ignore */
var RequestChain = LevinPayloads_1.LevinPayloads.RequestChain;
/** @ignore */
var ResponseChain = LevinPayloads_1.LevinPayloads.ResponseChain;
/** @ignore */
var RequestTXPool = LevinPayloads_1.LevinPayloads.RequestTXPool;
/** @ignore */
var LiteBlock = LevinPayloads_1.LevinPayloads.LiteBlock;
/** @ignore */
var MissingTransactions = LevinPayloads_1.LevinPayloads.MissingTransactions;
/** @ignore */
const LevinPacketSignature = '0101010101012101';
var LevinProtocol;
(function (LevinProtocol) {
    /**
     * Describes each of the Levin Packet Command Types
     */
    let CommandType;
    (function (CommandType) {
        CommandType[CommandType["HANDSHAKE"] = 1001] = "HANDSHAKE";
        CommandType[CommandType["TIMEDSYNC"] = 1002] = "TIMEDSYNC";
        CommandType[CommandType["PING"] = 1003] = "PING";
        CommandType[CommandType["NEW_BLOCK"] = 2001] = "NEW_BLOCK";
        CommandType[CommandType["NEW_TRANSACTIONS"] = 2002] = "NEW_TRANSACTIONS";
        CommandType[CommandType["REQUEST_GET_OBJECTS"] = 2003] = "REQUEST_GET_OBJECTS";
        CommandType[CommandType["RESPONSE_GET_OBJECTS"] = 2004] = "RESPONSE_GET_OBJECTS";
        CommandType[CommandType["RESERVED"] = 2005] = "RESERVED";
        CommandType[CommandType["REQUEST_CHAIN"] = 2006] = "REQUEST_CHAIN";
        CommandType[CommandType["RESPONSE_CHAIN_ENTRY"] = 2007] = "RESPONSE_CHAIN_ENTRY";
        CommandType[CommandType["REQUEST_TX_POOL"] = 2008] = "REQUEST_TX_POOL";
        CommandType[CommandType["LITE_BLOCK"] = 2009] = "LITE_BLOCK";
        CommandType[CommandType["MISSING_TRANSACTIONS"] = 2010] = "MISSING_TRANSACTIONS";
    })(CommandType = LevinProtocol.CommandType || (LevinProtocol.CommandType = {}));
})(LevinProtocol = exports.LevinProtocol || (exports.LevinProtocol = {}));
/**
 * Provides a representation of a Levin Packet on a network
 */
class LevinPacket {
    /**
     * Creates a new instance of a Levin packet of the given command type
     * @param [command] the command type that the packet will be for
     */
    constructor(command) {
        this.m_signature = LevinPacketSignature;
        this.m_return_data = false;
        this.m_command = 0;
        this.m_return_code = 0;
        this.m_flags = 0;
        this.m_protocol_version = 1;
        this.m_payload = new LevinPayload();
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
     * The packet signature
     */
    get signature() {
        return this.m_signature;
    }
    set signature(value) {
        const reader = new bytestream_1.Reader(value);
        if (reader.length !== 8) {
            throw new RangeError('Signature is not the correct number of bytes');
        }
        this.m_signature = reader.hex(8);
    }
    /**
     * Whether or not we expect a response to this request
     */
    get return_data() {
        return this.m_return_data;
    }
    set return_data(value) {
        this.m_return_data = value;
    }
    /**
     * The Levin Packet Command type
     */
    get command() {
        return this.m_command;
    }
    set command(command) {
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
    get return_code() {
        return this.m_return_code;
    }
    set return_code(value) {
        this.m_return_code = value;
    }
    /**
     * The response flags
     */
    get flags() {
        return this.m_flags;
    }
    set flags(value) {
        this.m_flags = value;
    }
    /**
     * The packet version
     */
    get version() {
        return this.m_protocol_version;
    }
    set version(value) {
        this.m_protocol_version = value;
    }
    /**
     * The packet payload - See the Levin Payloads list
     */
    get payload() {
        return this.m_payload;
    }
    set payload(payload) {
        this.m_payload = payload;
    }
    /**
     * Creates a new instance of a Levin Packet from the supplied data
     * @param data the raw data that came in over the wire
     * @returns a new instance of the object
     */
    static from(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const reader = new bytestream_1.Reader(data);
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
                    result.payload = yield NewBlock.from(payload);
                    break;
                case LevinProtocol.CommandType.NEW_TRANSACTIONS:
                    result.payload = yield NewTransactions.from(payload);
                    break;
                case LevinProtocol.CommandType.REQUEST_GET_OBJECTS:
                    result.payload = RequestGetObjects.from(payload);
                    break;
                case LevinProtocol.CommandType.RESPONSE_GET_OBJECTS:
                    result.payload = yield ResponseGetObjects.from(payload);
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
                    result.payload = yield LiteBlock.from(payload);
                    break;
                case LevinProtocol.CommandType.MISSING_TRANSACTIONS:
                    result.payload = MissingTransactions.from(payload);
                    break;
                case LevinProtocol.CommandType.RESERVED:
                default:
                    throw new Error('Unknown command type: ' + result.command);
            }
            return result;
        });
    }
    /**
     * Provides the Buffer representation of the Levin Packet
     * @returns the buffer representation of the object
     */
    toBuffer() {
        const writer = new bytestream_1.Writer();
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
    toString() {
        return this.toBuffer().toString('hex');
    }
}
exports.LevinPacket = LevinPacket;
