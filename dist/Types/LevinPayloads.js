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
exports.ip2int = exports.int2ip = exports.LevinPayloads = exports.SIZES = void 0;
const Types_1 = require("../Types");
const bytestream_1 = require("@turtlecoin/bytestream");
const Block_1 = require("../Block");
const Transaction_1 = require("../Transaction");
/** @ignore */
var SIZES;
(function (SIZES) {
    SIZES[SIZES["KEY"] = 32] = "KEY";
    SIZES[SIZES["PEER_ID"] = 8] = "PEER_ID";
    SIZES[SIZES["NETWORK_ID"] = 16] = "NETWORK_ID";
})(SIZES = exports.SIZES || (exports.SIZES = {}));
var LevinPayloads;
(function (LevinPayloads) {
    /**
     * Represents a Raw Block For Levin Based Payloads
     */
    class RawBlock {
        /**
         * Constructs a new raw block given the supplied values
         * @param block
         * @param transactions
         */
        constructor(block, transactions) {
            /**
             * The block
             */
            this.block = new Block_1.Block();
            /**
             * The transactions in the block
             */
            this.transactions = [];
            if (block) {
                this.block = block;
            }
            if (transactions) {
                this.transactions = transactions;
            }
        }
    }
    LevinPayloads.RawBlock = RawBlock;
    /**
     * Represents a peer entry in the peer list
     */
    class PeerEntry {
        /**
         * Constructs a new peer entry using the supplied values
         * @param ip the peer ip address
         * @param port the peer port
         * @param id the peer id
         * @param last_seen the date the peer was last seen
         */
        constructor(ip, port, id, last_seen) {
            this.m_ip = 0;
            this.m_port = 0;
            this.m_id = ''.padStart(16, '0');
            this.m_last_seen = new Date();
            this.m_ip = ip2int(ip);
            this.m_port = port;
            const reader = new bytestream_1.Reader(id);
            if (reader.length !== 8) {
                throw new RangeError('Invalid id supplied');
            }
            this.m_id = reader.hex(SIZES.PEER_ID);
            this.m_last_seen = last_seen;
        }
        /**
         * The peer IP address
         */
        get ip() {
            return int2ip(this.m_ip);
        }
        set ip(value) {
            this.m_ip = ip2int(value);
        }
        /**
         * The peer's port number
         */
        get port() {
            return this.m_port;
        }
        set port(value) {
            this.m_port = value;
        }
        /**
         * The peer ID
         */
        get id() {
            return this.m_id;
        }
        set id(value) {
            const reader = new bytestream_1.Reader(value);
            if (reader.length !== 8) {
                throw new RangeError('Invalid id supplied');
            }
            this.m_id = reader.hex(SIZES.PEER_ID);
        }
        /**
         * The last seen datetime of the peer
         */
        get last_seen() {
            return this.m_last_seen;
        }
        set last_seen(value) {
            this.m_last_seen = value;
        }
        /**
         * Creates a new peer entry instance using the supplied data
         * @param data the raw data of the peer entry
         * @returns a new instance of the object
         */
        static from(data) {
            const reader = new bytestream_1.Reader(data);
            if (reader.length !== 24) {
                throw new RangeError('Invalid data length');
            }
            const ip = int2ip(reader.uint32_t().toJSNumber());
            const port = reader.uint32_t().toJSNumber();
            const id = reader.hex(SIZES.PEER_ID);
            const last_seen = reader.time_t(true);
            return new PeerEntry(ip, port, id, last_seen);
        }
        /**
         * The Buffer representation of the peer entry
         * @returns the buffer representation of the object
         */
        toBuffer() {
            const writer = new bytestream_1.Writer();
            writer.uint32_t(this.m_ip);
            writer.uint32_t(this.m_port);
            writer.hex(this.m_id);
            writer.time_t(this.m_last_seen, true);
            return writer.buffer;
        }
        /**
         * The hexadecimal (blob) representation of the peer entry
         * @returns the hexadecimal (blob) representation of the object
         */
        toString() {
            return this.toBuffer().toString('hex');
        }
    }
    LevinPayloads.PeerEntry = PeerEntry;
    /**
     * Abstract object for all Levin Payloads
     */
    class ILevinPayload {
    }
    LevinPayloads.ILevinPayload = ILevinPayload;
    /** @ignore */
    class LevinPayload {
        toBuffer() {
            return Buffer.alloc(0);
        }
        toString() {
            return this.toBuffer().toString('hex');
        }
    }
    LevinPayloads.LevinPayload = LevinPayload;
    /**
     * Represents a handshake payload
     */
    class Handshake {
        constructor() {
            this.m_network_id = ''.padStart(32, '0');
            this.m_version = 0;
            this.m_local_time = new Date();
            this.m_my_port = 0;
            this.m_peer_id = ''.padStart(16, '0');
            this.m_current_height = 0;
            this.m_top_id = ''.padStart(64, '0');
            this.m_local_peerlist = [];
        }
        /**
         * The network ID
         */
        get network_id() {
            return this.m_network_id;
        }
        set network_id(value) {
            const reader = new bytestream_1.Reader(value);
            if (reader.length !== 16) {
                throw new Error('Invalid network id length');
            }
            this.m_network_id = reader.hex(SIZES.NETWORK_ID);
        }
        /**
         * The protocol version supported
         */
        get version() {
            return this.m_version;
        }
        set version(value) {
            this.m_version = value;
        }
        /**
         * The current date and time
         */
        get local_time() {
            return this.m_local_time;
        }
        set local_time(value) {
            this.m_local_time = value;
        }
        /**
         * Our port number for p2p traffic
         */
        get my_port() {
            return this.m_my_port;
        }
        set my_port(value) {
            this.m_my_port = value;
        }
        /**
         * Our peer ID
         */
        get peer_id() {
            return this.m_peer_id;
        }
        set peer_id(value) {
            const reader = new bytestream_1.Reader(value);
            if (reader.length !== 8) {
                throw new Error('Invalid peer id length');
            }
            this.m_peer_id = reader.hex(SIZES.PEER_ID);
        }
        /**
         * Our current blockchain height
         */
        get current_height() {
            return this.m_current_height;
        }
        set current_height(value) {
            this.m_current_height = value;
        }
        /**
         * The top block hash that we know about
         */
        get top_id() {
            return this.m_top_id;
        }
        set top_id(value) {
            const reader = new bytestream_1.Reader(value);
            if (reader.length !== SIZES.KEY) {
                throw new Error('Invalid top id length');
            }
            this.m_top_id = reader.bytes(SIZES.KEY).toString('hex');
        }
        /**
         * Our list of locally known peers
         */
        get local_peerlist() {
            return this.m_local_peerlist;
        }
        set local_peerlist(value) {
            this.m_local_peerlist = value;
        }
        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        static from(data) {
            const payload = Types_1.PortableStorage.from(data);
            const result = new Handshake();
            result.network_id = payload.get('node_data').get('network_id');
            result.version =
                payload.get('node_data').get('version')
                    .toJSNumber();
            const lt = payload.get('node_data').get('local_time')
                .toString(16)
                .padStart(16, '0');
            result.local_time = (new bytestream_1.Reader(lt)).time_t(true);
            result.my_port =
                payload.get('node_data').get('my_port')
                    .toJSNumber();
            result.peer_id =
                payload.get('node_data').get('peer_id')
                    .toString(16).padStart(16, '0');
            result.current_height =
                payload.get('payload_data').get('current_height')
                    .toJSNumber();
            result.top_id = payload.get('payload_data').get('top_id');
            if (payload.exists('local_peerlist')) {
                const peerlist = (payload.get('local_peerlist'));
                const reader = new bytestream_1.Reader(peerlist);
                if (reader.length % 24 !== 0) {
                    throw new Error('Error parsing local_peer list');
                }
                while (reader.unreadBytes > 0) {
                    result.local_peerlist.push(PeerEntry.from(reader.bytes(24)));
                }
            }
            return result;
        }
        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        toBuffer() {
            const node_data = new Types_1.PortableStorage();
            node_data.set('network_id', this.network_id, Types_1.StorageType.STRING);
            node_data.set('version', Types_1.BigInteger(this.version), Types_1.StorageType.UINT8);
            node_data.set('peer_id', Types_1.BigInteger(this.peer_id, 16), Types_1.StorageType.UINT64);
            const writer = new bytestream_1.Writer();
            writer.time_t(this.local_time, true);
            node_data.set('local_time', Types_1.BigInteger(writer.blob, 16), Types_1.StorageType.UINT64);
            node_data.set('my_port', Types_1.BigInteger(this.my_port), Types_1.StorageType.UINT32);
            const payload_data = new Types_1.PortableStorage();
            payload_data.set('current_height', Types_1.BigInteger(this.current_height), Types_1.StorageType.UINT32);
            payload_data.set('top_id', this.top_id, Types_1.StorageType.STRING);
            const payload = new Types_1.PortableStorage();
            payload.set('node_data', node_data, Types_1.StorageType.OBJECT);
            payload.set('payload_data', payload_data, Types_1.StorageType.OBJECT);
            const peerList = new bytestream_1.Writer();
            this.local_peerlist.forEach((peer) => peerList.write(peer.toBuffer()));
            if (peerList.length !== 0) {
                payload.set('local_peerlist', peerList.buffer.toString('hex'), Types_1.StorageType.STRING);
            }
            return payload.toBuffer();
        }
        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        toString() {
            return this.toBuffer().toString('hex');
        }
    }
    LevinPayloads.Handshake = Handshake;
    class LiteBlock {
        constructor() {
            this.m_blockTemplate = new Block_1.Block();
            this.m_current_blockchain_height = 0;
            this.m_hop = 0;
        }
        /**
         * The block template a as block
         */
        get blockTemplate() {
            return this.m_blockTemplate;
        }
        set blockTemplate(value) {
            this.m_blockTemplate = value;
        }
        /**
         * The current blockchain height
         */
        get current_blockchain_height() {
            return this.m_current_blockchain_height;
        }
        set current_blockchain_height(value) {
            this.m_current_blockchain_height = value;
        }
        /**
         * The hops from the originating node
         */
        get hop() {
            return this.m_hop;
        }
        set hop(value) {
            this.m_hop = value;
        }
        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        static from(data) {
            return __awaiter(this, void 0, void 0, function* () {
                const payload = Types_1.PortableStorage.from(data);
                const result = new LiteBlock();
                result.current_blockchain_height =
                    payload.get('current_blockchain_height').toJSNumber();
                result.hop = payload.get('hop').toJSNumber();
                result.blockTemplate = yield Block_1.Block.from(payload.get('blockTemplate'));
                return result;
            });
        }
        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        toBuffer() {
            const payload = new Types_1.PortableStorage();
            payload.set('current_blockchain_height', Types_1.BigInteger(this.current_blockchain_height), Types_1.StorageType.UINT32);
            payload.set('hop', Types_1.BigInteger(this.hop), Types_1.StorageType.UINT32);
            payload.set('blockTemplate', this.blockTemplate.toString(), Types_1.StorageType.STRING);
            return payload.toBuffer();
        }
        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        toString() {
            return this.toBuffer().toString('hex');
        }
    }
    LevinPayloads.LiteBlock = LiteBlock;
    class MissingTransactions {
        constructor() {
            this.m_blockHash = ''.padStart(64, '0');
            this.m_current_blockchain_height = 0;
            this.m_missing_txs = [];
        }
        /**
         * The current blockchain height
         */
        get current_blockchain_height() {
            return this.m_current_blockchain_height;
        }
        set current_blockchain_height(value) {
            this.m_current_blockchain_height = value;
        }
        /**
         * The block hash containing for which we need the transactions
         */
        get blockHash() {
            return this.m_blockHash;
        }
        set blockHash(value) {
            const reader = new bytestream_1.Reader(value);
            if (reader.length !== SIZES.KEY) {
                throw new Error('Invalid hash supplied');
            }
            this.m_blockHash = reader.hash();
        }
        /**
         * The list of missing transaction hashes we need
         */
        get missing_txs() {
            return this.m_missing_txs;
        }
        set missing_txs(value) {
            const tmp = [];
            value.forEach((v) => {
                const reader = new bytestream_1.Reader(v);
                if (v.length !== SIZES.KEY) {
                    throw new Error('Invalid hash supplied');
                }
                tmp.push(reader.hash());
            });
            this.m_missing_txs = tmp;
        }
        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        static from(data) {
            const payload = Types_1.PortableStorage.from(data);
            const result = new MissingTransactions();
            result.current_blockchain_height =
                payload.get('current_blockchain_height').toJSNumber();
            result.blockHash = payload.get('blockHash');
            if (payload.exists('missing_txs')) {
                const reader = new bytestream_1.Reader(payload.get('missing_txs'));
                if (reader.length % SIZES.KEY) {
                    throw new RangeError('Invalid missing_tx data');
                }
                while (reader.unreadBytes > 0) {
                    result.missing_txs.push(reader.hash());
                }
            }
            return result;
        }
        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        toBuffer() {
            const payload = new Types_1.PortableStorage();
            payload.set('current_blockchain_height', Types_1.BigInteger(this.current_blockchain_height), Types_1.StorageType.UINT32);
            payload.set('blockHash', this.blockHash, Types_1.StorageType.STRING);
            const writer = new bytestream_1.Writer();
            this.missing_txs.forEach((tx) => writer.hash(tx));
            payload.set('missing_txs', writer.buffer.toString('hex'), Types_1.StorageType.STRING);
            return payload.toBuffer();
        }
        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        toString() {
            return this.toBuffer().toString('hex');
        }
    }
    LevinPayloads.MissingTransactions = MissingTransactions;
    class NewBlock {
        constructor() {
            this.m_block = new Block_1.Block();
            this.m_transactions = [];
            this.m_current_blockchain_height = 0;
            this.m_hop = 0;
        }
        /**
         * The new block
         */
        get block() {
            return this.m_block;
        }
        set block(value) {
            this.m_block = value;
        }
        /**
         * The transactions in the new block
         */
        get transactions() {
            return this.m_transactions;
        }
        set transactions(value) {
            this.m_transactions = value;
        }
        /**
         * The current blockchain height
         */
        get current_blockchain_height() {
            return this.m_current_blockchain_height;
        }
        set current_blockchain_height(value) {
            this.m_current_blockchain_height = value;
        }
        /**
         * The number of hops from the originating node
         */
        get hop() {
            return this.m_hop;
        }
        set hop(value) {
            this.m_hop = value;
        }
        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        static from(data) {
            return __awaiter(this, void 0, void 0, function* () {
                const payload = Types_1.PortableStorage.from(data);
                const result = new NewBlock();
                if (payload.exists('block')) {
                    const blockPayload = payload.get('block');
                    result.block = yield Block_1.Block.from(blockPayload.get('block'));
                    if (blockPayload.exists('txs')) {
                        for (const tx of blockPayload.get('txs')) {
                            result.transactions.push(yield Transaction_1.Transaction.from(tx));
                        }
                    }
                }
                result.current_blockchain_height =
                    payload.get('current_blockchain_height').toJSNumber();
                result.hop = payload.get('hop').toJSNumber();
                return result;
            });
        }
        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        toBuffer() {
            const payload = new Types_1.PortableStorage();
            const blockPayload = new Types_1.PortableStorage();
            blockPayload.set('block', this.block.toString(), Types_1.StorageType.STRING);
            if (this.transactions.length !== 0) {
                const txs = [];
                this.transactions.forEach((tx) => {
                    txs.push(tx.toString());
                });
                blockPayload.set('txs', txs, Types_1.StorageType.STRING_ARRAY);
            }
            payload.set('block', blockPayload, Types_1.StorageType.OBJECT);
            payload.set('current_blockchain_height', Types_1.BigInteger(this.current_blockchain_height), Types_1.StorageType.UINT32);
            payload.set('hop', Types_1.BigInteger(this.hop), Types_1.StorageType.UINT32);
            return payload.toBuffer();
        }
        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        toString() {
            return this.toBuffer().toString('hex');
        }
    }
    LevinPayloads.NewBlock = NewBlock;
    class NewTransactions {
        constructor() {
            this.m_transactions = [];
        }
        /**
         * The new transactions in the packet
         */
        get transactions() {
            return this.m_transactions;
        }
        set transactions(value) {
            this.m_transactions = value;
        }
        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        static from(data) {
            return __awaiter(this, void 0, void 0, function* () {
                const payload = Types_1.PortableStorage.from(data);
                const result = new NewTransactions();
                if (payload.exists('txs')) {
                    for (const tx of payload.get('txs')) {
                        result.transactions.push(yield Transaction_1.Transaction.from(tx));
                    }
                }
                return result;
            });
        }
        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        toBuffer() {
            const payload = new Types_1.PortableStorage();
            const txs = [];
            this.transactions.forEach((tx) => txs.push(tx.toString()));
            payload.set('txs', txs, Types_1.StorageType.STRING_ARRAY);
            return payload.toBuffer();
        }
        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        toString() {
            return this.toBuffer().toString('hex');
        }
    }
    LevinPayloads.NewTransactions = NewTransactions;
    class Ping {
        constructor() {
            this.m_status = '';
            this.m_peer_id = ''.padStart(16, '0');
        }
        /**
         * The current ping status message
         * Usually 'OK'
         */
        get status() {
            return this.m_status;
        }
        set status(value) {
            this.m_status = value;
        }
        /**
         * The peer ID
         */
        get peer_id() {
            return this.m_peer_id;
        }
        set peer_id(value) {
            const reader = new bytestream_1.Reader(value);
            if (reader.length !== 8) {
                throw new Error('Invalid peer id length');
            }
            this.m_peer_id = reader.hex(SIZES.PEER_ID);
        }
        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        static from(data) {
            const payload = Types_1.PortableStorage.from(data);
            const result = new Ping();
            if (payload.exists('peer_id')) {
                result.peer_id = payload.get('peer_id')
                    .toString(16).padStart(16, '0');
            }
            if (payload.exists('status')) {
                result.status = Buffer.from(payload.get('status'), 'hex').toString();
            }
            return result;
        }
        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        toBuffer() {
            const payload = new Types_1.PortableStorage();
            if (this.status.length !== 0) {
                payload.set('status', Buffer.from(this.status).toString('hex'), Types_1.StorageType.STRING);
            }
            if (this.peer_id !== ''.padStart(16, '0')) {
                payload.set('peer_id', Types_1.BigInteger(this.peer_id, 16), Types_1.StorageType.UINT64);
            }
            return payload.toBuffer();
        }
        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        toString() {
            return this.toBuffer().toString('hex');
        }
    }
    LevinPayloads.Ping = Ping;
    class RequestChain {
        constructor() {
            this.m_block_ids = [];
        }
        /**
         * A list of known block IDs in descending order (genesis block last)
         */
        get block_ids() {
            return this.m_block_ids;
        }
        set block_ids(value) {
            const tmp = [];
            value.forEach((v) => {
                const reader = new bytestream_1.Reader(v);
                if (v.length !== SIZES.KEY) {
                    throw new Error('Invalid hash supplied');
                }
                tmp.push(reader.hash());
            });
            this.m_block_ids = tmp;
        }
        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        static from(data) {
            const payload = Types_1.PortableStorage.from(data);
            const result = new RequestChain();
            if (payload.exists('block_ids')) {
                const reader = new bytestream_1.Reader(payload.get('block_ids'));
                if (reader.length % 32 !== 0) {
                    throw new Error('Error parsing block ids');
                }
                while (reader.unreadBytes > 0) {
                    result.block_ids.push(reader.hash());
                }
            }
            return result;
        }
        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        toBuffer() {
            const payload = new Types_1.PortableStorage();
            const writer = new bytestream_1.Writer();
            this.block_ids.forEach((hash) => writer.hash(hash));
            payload.set('block_ids', writer.buffer.toString('hex'), Types_1.StorageType.STRING);
            return payload.toBuffer();
        }
        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        toString() {
            return this.toBuffer().toString('hex');
        }
    }
    LevinPayloads.RequestChain = RequestChain;
    class RequestGetObjects {
        constructor() {
            this.m_transactions = [];
            this.m_blocks = [];
        }
        /**
         * A list of block hashes we would like the data for
         */
        get blocks() {
            return this.m_transactions;
        }
        set blocks(value) {
            const tmp = [];
            value.forEach((v) => {
                const reader = new bytestream_1.Reader(v);
                if (v.length !== SIZES.KEY) {
                    throw new Error('Invalid hash supplied');
                }
                tmp.push(reader.hash());
            });
            this.m_blocks = tmp;
        }
        /**
         * A list of transaction hashes we would like the data for
         */
        get transactions() {
            return this.m_blocks;
        }
        set transactions(value) {
            const tmp = [];
            value.forEach((v) => {
                const reader = new bytestream_1.Reader(v);
                if (v.length !== SIZES.KEY) {
                    throw new Error('Invalid hash supplied');
                }
                tmp.push(reader.hash());
            });
            this.m_transactions = tmp;
        }
        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        static from(data) {
            const payload = Types_1.PortableStorage.from(data);
            const result = new RequestGetObjects();
            if (payload.exists('blocks')) {
                const reader = new bytestream_1.Reader(payload.get('blocks'));
                if (reader.length % 32 !== 0) {
                    throw new Error('Error parsing txs');
                }
                while (reader.unreadBytes > 0) {
                    result.blocks.push(reader.hash());
                }
            }
            if (payload.exists('txs')) {
                const reader = new bytestream_1.Reader(payload.get('txs'));
                if (reader.length % 32 !== 0) {
                    throw new Error('Error parsing txs');
                }
                while (reader.unreadBytes > 0) {
                    result.transactions.push(reader.hash());
                }
            }
            return result;
        }
        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        toBuffer() {
            const payload = new Types_1.PortableStorage();
            const writer = new bytestream_1.Writer();
            if (this.transactions.length !== 0) {
                this.transactions.forEach((tx) => writer.hash(tx));
                payload.set('txs', writer.buffer.toString('hex'), Types_1.StorageType.STRING);
            }
            if (this.blocks.length !== 0) {
                this.blocks.forEach((tx) => writer.hash(tx));
                payload.set('blocks', writer.buffer.toString('hex'), Types_1.StorageType.STRING);
            }
            return payload.toBuffer();
        }
        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        toString() {
            return this.toBuffer().toString('hex');
        }
    }
    LevinPayloads.RequestGetObjects = RequestGetObjects;
    class RequestTXPool {
        constructor() {
            this.m_transactions = [];
        }
        /**
         * A list of transaction hashes we need data for in the pool
         */
        get transactions() {
            return this.m_transactions;
        }
        set transactions(value) {
            const tmp = [];
            value.forEach((v) => {
                const reader = new bytestream_1.Reader(v);
                if (v.length !== SIZES.KEY) {
                    throw new Error('Invalid hash supplied');
                }
                tmp.push(reader.hash());
            });
            this.m_transactions = tmp;
        }
        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        static from(data) {
            const payload = Types_1.PortableStorage.from(data);
            const result = new RequestTXPool();
            if (payload.exists('txs')) {
                const reader = new bytestream_1.Reader(payload.get('txs'));
                if (reader.length % 32 !== 0) {
                    throw new Error('Error parsing txs');
                }
                while (reader.unreadBytes > 0) {
                    result.transactions.push(reader.hash());
                }
            }
            return result;
        }
        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        toBuffer() {
            const payload = new Types_1.PortableStorage();
            const writer = new bytestream_1.Writer();
            this.transactions.forEach((tx) => writer.hash(tx));
            payload.set('txs', writer.buffer.toString('hex'), Types_1.StorageType.STRING);
            return payload.toBuffer();
        }
        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        toString() {
            return this.toBuffer().toString('hex');
        }
    }
    LevinPayloads.RequestTXPool = RequestTXPool;
    class ResponseChain {
        constructor() {
            this.m_start_height = 0;
            this.m_total_height = 0;
            this.m_block_ids = [];
        }
        /**
         * The block hashes that we know about in descending order
         */
        get block_ids() {
            return this.m_block_ids;
        }
        set block_ids(value) {
            const tmp = [];
            value.forEach((v) => {
                const reader = new bytestream_1.Reader(v);
                if (v.length !== SIZES.KEY) {
                    throw new Error('Invalid hash supplied');
                }
                tmp.push(reader.hash());
            });
            this.m_block_ids = tmp;
        }
        /**
         * the starting height of the response data
         */
        get start_height() {
            return this.m_start_height;
        }
        set start_height(value) {
            this.m_start_height = value;
        }
        /**
         * The current network height we have observed
         */
        get total_height() {
            return this.m_total_height;
        }
        set total_height(value) {
            this.m_total_height = value;
        }
        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        static from(data) {
            const payload = Types_1.PortableStorage.from(data);
            const result = new ResponseChain();
            result.start_height = payload.get('start_height')
                .toJSNumber();
            result.total_height = payload.get('total_height')
                .toJSNumber();
            if (payload.exists('m_block_ids')) {
                const reader = new bytestream_1.Reader(payload.get('m_block_ids'));
                if (reader.length % 32 !== 0) {
                    throw new Error('Error parsing block ids');
                }
                while (reader.unreadBytes > 0) {
                    result.block_ids.push(reader.hash());
                }
            }
            return result;
        }
        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        toBuffer() {
            const payload = new Types_1.PortableStorage();
            payload.set('start_height', Types_1.BigInteger(this.start_height), Types_1.StorageType.UINT32);
            payload.set('total_height', Types_1.BigInteger(this.total_height), Types_1.StorageType.UINT32);
            const writer = new bytestream_1.Writer();
            this.block_ids.forEach((hash) => writer.hash(hash));
            payload.set('m_block_ids', writer.buffer.toString('hex'), Types_1.StorageType.STRING);
            return payload.toBuffer();
        }
        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        toString() {
            return this.toBuffer().toString('hex');
        }
    }
    LevinPayloads.ResponseChain = ResponseChain;
    class ResponseGetObjects {
        constructor() {
            this.m_transactions = [];
            this.m_raw_blocks = [];
            this.m_missed_ids = [];
            this.m_current_blockchain_height = 0;
        }
        /**
         * A list of transactions in the response
         */
        get transactions() {
            return this.m_transactions;
        }
        set transactions(value) {
            this.m_transactions = value;
        }
        /**
         * A list of hashes that we cannot find in our copy of the blockchain
         */
        get missed_ids() {
            return this.m_missed_ids;
        }
        set missed_ids(value) {
            this.m_missed_ids = value;
        }
        /**
         * The current blockchain height
         */
        get current_blockchain_height() {
            return this.m_current_blockchain_height;
        }
        set current_blockchain_height(value) {
            this.m_current_blockchain_height = value;
        }
        /**
         * A list of blocks in the response
         */
        get blocks() {
            return this.m_raw_blocks;
        }
        set blocks(value) {
            this.m_raw_blocks = value;
        }
        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        static from(data) {
            return __awaiter(this, void 0, void 0, function* () {
                const payload = Types_1.PortableStorage.from(data);
                const result = new ResponseGetObjects();
                if (payload.exists('txs')) {
                    for (const tx of payload.get('txs')) {
                        result.transactions.push(yield Transaction_1.Transaction.from(tx));
                    }
                }
                if (payload.exists('blocks')) {
                    for (const block of payload.get('blocks')) {
                        const l_block = yield Block_1.Block.from(block.get('block'));
                        const l_txs = [];
                        if (block.exists('txs')) {
                            for (const tx of block.get('txs')) {
                                l_txs.push(yield Transaction_1.Transaction.from(tx));
                            }
                        }
                        result.blocks.push(new RawBlock(l_block, l_txs));
                    }
                }
                if (payload.exists('missed_ids')) {
                    const reader = new bytestream_1.Reader(payload.get('missed_ids'));
                    if (reader.length % 32 !== 0) {
                        throw new Error('Cannot parsed missed_ids');
                    }
                    while (reader.unreadBytes) {
                        result.missed_ids.push(reader.hash());
                    }
                }
                if (payload.exists('current_blockchain_height')) {
                    result.current_blockchain_height =
                        payload.get('current_blockchain_height').toJSNumber();
                }
                return result;
            });
        }
        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        toBuffer() {
            const payload = new Types_1.PortableStorage();
            if (this.transactions.length !== 0) {
                const txs = [];
                this.transactions.forEach((tx) => txs.push(tx.toString()));
                payload.set('txs', txs, Types_1.StorageType.STRING_ARRAY);
            }
            if (this.blocks.length !== 0) {
                const blocks = [];
                this.blocks.forEach((rawBlock) => {
                    const block = new Types_1.PortableStorage();
                    block.set('block', rawBlock.block.toString(), Types_1.StorageType.STRING);
                    const txs = [];
                    rawBlock.transactions.forEach((tx) => txs.push(tx.toString()));
                    if (txs.length !== 0) {
                        block.set('txs', txs, Types_1.StorageType.STRING_ARRAY);
                    }
                    blocks.push(block);
                });
                payload.set('blocks', blocks, Types_1.StorageType.OBJECT_ARRAY);
            }
            if (this.missed_ids.length !== 0) {
                const writer = new bytestream_1.Writer();
                this.missed_ids.forEach((id) => writer.hash(id));
                payload.set('missed_ids', writer.buffer.toString('hex'), Types_1.StorageType.STRING);
            }
            payload.set('current_blockchain_height', Types_1.BigInteger(this.current_blockchain_height), Types_1.StorageType.UINT32);
            return payload.toBuffer();
        }
        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        toString() {
            return this.toBuffer().toString('hex');
        }
    }
    LevinPayloads.ResponseGetObjects = ResponseGetObjects;
    class TimedSync {
        constructor() {
            this.m_local_time = new Date(0);
            this.m_current_height = 0;
            this.m_top_id = ''.padStart(64, '0');
            this.m_local_peerlist = [];
        }
        /**
         * The current time of the node
         */
        get local_time() {
            return this.m_local_time;
        }
        set local_time(value) {
            this.m_local_time = value;
        }
        /**
         * The current height of the node
         */
        get current_height() {
            return this.m_current_height;
        }
        set current_height(value) {
            this.m_current_height = value;
        }
        /**
         * The last known block hash of the node
         */
        get top_id() {
            return this.m_top_id;
        }
        set top_id(value) {
            const reader = new bytestream_1.Reader(value);
            if (reader.length !== SIZES.KEY) {
                throw new Error('Invalid top id length');
            }
            this.m_top_id = reader.hash();
        }
        /**
         * The list of locally known peers
         */
        get local_peerlist() {
            return this.m_local_peerlist;
        }
        set local_peerlist(value) {
            this.m_local_peerlist = value;
        }
        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        static from(data) {
            const payload = Types_1.PortableStorage.from(data);
            const result = new TimedSync();
            if (payload.exists('local_time')) {
                const lt = payload.get('local_time')
                    .toString(16)
                    .padStart(16, '0');
                result.local_time = (new bytestream_1.Reader(lt)).time_t(true);
            }
            result.current_height =
                payload.get('payload_data').get('current_height')
                    .toJSNumber();
            result.top_id = payload.get('payload_data').get('top_id');
            if (payload.exists('local_peerlist')) {
                const peerlist = (payload.get('local_peerlist'));
                const reader = new bytestream_1.Reader(peerlist);
                if (reader.length % 24 !== 0) {
                    throw new Error('Error parsing local_peer list');
                }
                while (reader.unreadBytes > 0) {
                    result.local_peerlist.push(PeerEntry.from(reader.bytes(24)));
                }
            }
            return result;
        }
        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        toBuffer() {
            const payload = new Types_1.PortableStorage();
            if (this.local_time.getTime() !== 0) {
                const writer = new bytestream_1.Writer();
                writer.time_t(this.local_time, true);
                payload.set('local_time', Types_1.BigInteger(writer.blob, 16), Types_1.StorageType.UINT64);
            }
            const payload_data = new Types_1.PortableStorage();
            payload_data.set('current_height', Types_1.BigInteger(this.current_height), Types_1.StorageType.UINT32);
            payload_data.set('top_id', this.top_id, Types_1.StorageType.STRING);
            payload.set('payload_data', payload_data, Types_1.StorageType.OBJECT);
            const peerList = new bytestream_1.Writer();
            this.local_peerlist.forEach((peer) => peerList.write(peer.toBuffer()));
            if (peerList.length !== 0) {
                payload.set('local_peerlist', peerList.buffer.toString('hex'), Types_1.StorageType.STRING);
            }
            return payload.toBuffer();
        }
        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        toString() {
            return this.toBuffer().toString('hex');
        }
    }
    LevinPayloads.TimedSync = TimedSync;
})(LevinPayloads = exports.LevinPayloads || (exports.LevinPayloads = {}));
/** @ignore */
function int2ip(ipInt) {
    if (ipInt > 4294967295) {
        throw new Error('Integer value exceeds 32-bit bounds');
    }
    return ((ipInt >>> 24) + '.' + (ipInt >> 16 & 255) + '.' + (ipInt >> 8 & 255) + '.' + (ipInt & 255));
}
exports.int2ip = int2ip;
/** @ignore */
function ip2int(ip) {
    const tmp = ip.split('.');
    if (tmp.length !== 4) {
        throw new Error('Does not appear to be a valid IP address');
    }
    tmp.forEach((octet) => {
        if (isNaN(parseInt(octet, 10))) {
            throw new Error('Non-numeric value found in octet');
        }
        if (parseInt(octet, 10) > 255 || parseInt(octet, 10) < 0) {
            throw new Error('Invalid value found in octet');
        }
    });
    return tmp.reduce((ipInt, octet) => (ipInt << 8) + parseInt(octet, 10), 0) >>> 0;
}
exports.ip2int = ip2int;
