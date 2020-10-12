// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import { BigInteger, PortableStorage, StorageType } from '../Types';
import { Reader, Writer } from '@turtlecoin/bytestream';
import { Block } from '../Block';
import { Transaction } from '../Transaction';

/** @ignore */
export enum SIZES {
    KEY = 32,
    PEER_ID = 8,
    NETWORK_ID = 16,
}

export namespace LevinPayloads {

    /**
     * Represents a Raw Block For Levin Based Payloads
     */
    export class RawBlock {
        /**
         * The block
         */
        public block: Block = new Block();
        /**
         * The transactions in the block
         */
        public transactions: Transaction[] = [];

        /**
         * Constructs a new raw block given the supplied values
         * @param block
         * @param transactions
         */
        constructor (block?: Block, transactions?: Transaction[]) {
            if (block) {
                this.block = block;
            }

            if (transactions) {
                this.transactions = transactions;
            }
        }
    }

    /**
     * Represents a peer entry in the peer list
     */
    export class PeerEntry {
        /**
         * The peer IP address
         */
        public get ip (): string {
            return int2ip(this.m_ip);
        }

        public set ip (value: string) {
            this.m_ip = ip2int(value);
        }

        /**
         * The peer's port number
         */
        public get port (): number {
            return this.m_port;
        }

        public set port (value: number) {
            this.m_port = value;
        }

        /**
         * The peer ID
         */
        public get id (): string {
            return this.m_id;
        }

        public set id (value: string) {
            const reader = new Reader(value);

            if (reader.length !== 8) {
                throw new RangeError('Invalid id supplied');
            }

            this.m_id = reader.hex(SIZES.PEER_ID);
        }

        /**
         * The last seen datetime of the peer
         */
        public get last_seen (): Date {
            return this.m_last_seen;
        }

        public set last_seen (value: Date) {
            this.m_last_seen = value;
        }

        /**
         * Creates a new peer entry instance using the supplied data
         * @param data the raw data of the peer entry
         * @returns a new instance of the object
         */
        public static from (data: Reader | Buffer | string): PeerEntry {
            const reader = new Reader(data);

            if (reader.length !== 24) {
                throw new RangeError('Invalid data length');
            }

            const ip = int2ip(reader.uint32_t().toJSNumber());
            const port = reader.uint32_t().toJSNumber();
            const id = reader.hex(SIZES.PEER_ID);

            const last_seen = reader.time_t(true);

            return new PeerEntry(ip, port, id, last_seen);
        }

        protected m_ip = 0;
        protected m_port = 0;
        protected m_id: string = ''.padStart(16, '0');
        protected m_last_seen: Date = new Date();

        /**
         * Constructs a new peer entry using the supplied values
         * @param ip the peer ip address
         * @param port the peer port
         * @param id the peer id
         * @param last_seen the date the peer was last seen
         */
        constructor (ip: string, port: number, id: string, last_seen: Date) {
            this.m_ip = ip2int(ip);
            this.m_port = port;

            const reader = new Reader(id);

            if (reader.length !== 8) {
                throw new RangeError('Invalid id supplied');
            }

            this.m_id = reader.hex(SIZES.PEER_ID);
            this.m_last_seen = last_seen;
        }

        /**
         * The Buffer representation of the peer entry
         * @returns the buffer representation of the object
         */
        public toBuffer (): Buffer {
            const writer = new Writer();

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
        public toString (): string {
            return this.toBuffer().toString('hex');
        }
    }

    /**
     * Abstract object for all Levin Payloads
     */
    export abstract class ILevinPayload {
        public abstract toBuffer(): Buffer;

        public abstract toString(): string;
    }

    /** @ignore */
    export class LevinPayload implements ILevinPayload {
        public toBuffer (): Buffer {
            return Buffer.alloc(0);
        }

        public toString (): string {
            return this.toBuffer().toString('hex');
        }
    }

    /**
     * Represents a handshake payload
     */
    export class Handshake implements ILevinPayload {
        /**
         * The network ID
         */
        public get network_id (): string {
            return this.m_network_id;
        }

        public set network_id (value: string) {
            const reader = new Reader(value);
            if (reader.length !== 16) {
                throw new Error('Invalid network id length');
            }

            this.m_network_id = reader.hex(SIZES.NETWORK_ID);
        }

        /**
         * The protocol version supported
         */
        public get version (): number {
            return this.m_version;
        }

        public set version (value: number) {
            this.m_version = value;
        }

        /**
         * The current date and time
         */
        public get local_time (): Date {
            return this.m_local_time;
        }

        public set local_time (value: Date) {
            this.m_local_time = value;
        }

        /**
         * Our port number for p2p traffic
         */
        public get my_port (): number {
            return this.m_my_port;
        }

        public set my_port (value: number) {
            this.m_my_port = value;
        }

        /**
         * Our peer ID
         */
        public get peer_id (): string {
            return this.m_peer_id;
        }

        public set peer_id (value: string) {
            const reader = new Reader(value);
            if (reader.length !== 8) {
                throw new Error('Invalid peer id length');
            }

            this.m_peer_id = reader.hex(SIZES.PEER_ID);
        }

        /**
         * Our current blockchain height
         */
        public get current_height (): number {
            return this.m_current_height;
        }

        public set current_height (value: number) {
            this.m_current_height = value;
        }

        /**
         * The top block hash that we know about
         */
        public get top_id (): string {
            return this.m_top_id;
        }

        public set top_id (value: string) {
            const reader = new Reader(value);
            if (reader.length !== SIZES.KEY) {
                throw new Error('Invalid top id length');
            }

            this.m_top_id = reader.bytes(SIZES.KEY).toString('hex');
        }

        /**
         * Our list of locally known peers
         */
        public get local_peerlist (): PeerEntry[] {
            return this.m_local_peerlist;
        }

        public set local_peerlist (value: PeerEntry[]) {
            this.m_local_peerlist = value;
        }

        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        public static from (data: Reader | Buffer | string): Handshake {
            const payload = PortableStorage.from(data);

            const result = new Handshake();

            result.network_id = (payload.get('node_data') as PortableStorage).get('network_id') as string;

            result.version =
                ((payload.get('node_data') as PortableStorage).get('version') as BigInteger.BigInteger)
                    .toJSNumber();

            const lt =
                ((payload.get('node_data') as PortableStorage).get('local_time') as BigInteger.BigInteger)
                    .toString(16)
                    .padStart(16, '0');

            result.local_time = (new Reader(lt)).time_t(true);

            result.my_port =
                ((payload.get('node_data') as PortableStorage).get('my_port') as BigInteger.BigInteger)
                    .toJSNumber();

            result.peer_id =
                ((payload.get('node_data') as PortableStorage).get('peer_id') as BigInteger.BigInteger)
                    .toString(16).padStart(16, '0');

            result.current_height =
                ((payload.get('payload_data') as PortableStorage).get('current_height') as BigInteger.BigInteger)
                    .toJSNumber();

            result.top_id = (payload.get('payload_data') as PortableStorage).get('top_id') as string;

            if (payload.exists('local_peerlist')) {
                const peerlist = (payload.get('local_peerlist')) as Buffer;

                const reader = new Reader(peerlist);

                if (reader.length % 24 !== 0) {
                    throw new Error('Error parsing local_peer list');
                }

                while (reader.unreadBytes > 0) {
                    result.local_peerlist.push(PeerEntry.from(reader.bytes(24)));
                }
            }

            return result;
        }

        private m_network_id: string = ''.padStart(32, '0');
        private m_version = 0;
        private m_local_time: Date = new Date();
        private m_my_port = 0;
        private m_peer_id: string = ''.padStart(16, '0');
        private m_current_height = 0;
        private m_top_id: string = ''.padStart(64, '0');
        private m_local_peerlist: PeerEntry[] = [];

        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        public toBuffer (): Buffer {
            const node_data = new PortableStorage();
            node_data.set('network_id', this.network_id, StorageType.STRING);
            node_data.set('version', BigInteger(this.version), StorageType.UINT8);
            node_data.set('peer_id', BigInteger(this.peer_id, 16), StorageType.UINT64);

            const writer = new Writer();
            writer.time_t(this.local_time, true);

            node_data.set('local_time', BigInteger(writer.blob, 16), StorageType.UINT64);
            node_data.set('my_port', BigInteger(this.my_port), StorageType.UINT32);

            const payload_data = new PortableStorage();
            payload_data.set('current_height', BigInteger(this.current_height), StorageType.UINT32);
            payload_data.set('top_id', this.top_id, StorageType.STRING);

            const payload = new PortableStorage();

            payload.set('node_data', node_data, StorageType.OBJECT);
            payload.set('payload_data', payload_data, StorageType.OBJECT);

            const peerList = new Writer();
            this.local_peerlist.forEach((peer) => peerList.write(peer.toBuffer()));

            if (peerList.length !== 0) {
                payload.set('local_peerlist', peerList.buffer.toString('hex'), StorageType.STRING);
            }

            return payload.toBuffer();
        }

        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        public toString (): string {
            return this.toBuffer().toString('hex');
        }
    }

    export class LiteBlock implements ILevinPayload {
        /**
         * The block template a as block
         */
        public get blockTemplate (): Block {
            return this.m_blockTemplate;
        }

        public set blockTemplate (value: Block) {
            this.m_blockTemplate = value;
        }

        /**
         * The current blockchain height
         */
        public get current_blockchain_height (): number {
            return this.m_current_blockchain_height;
        }

        public set current_blockchain_height (value: number) {
            this.m_current_blockchain_height = value;
        }

        /**
         * The hops from the originating node
         */
        public get hop (): number {
            return this.m_hop;
        }

        public set hop (value: number) {
            this.m_hop = value;
        }

        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        public static async from (data: Reader | Buffer | string): Promise<LiteBlock> {
            const payload = PortableStorage.from(data);

            const result = new LiteBlock();

            result.current_blockchain_height =
                (payload.get('current_blockchain_height') as BigInteger.BigInteger).toJSNumber();
            result.hop = (payload.get('hop') as BigInteger.BigInteger).toJSNumber();
            result.blockTemplate = await Block.from((payload.get('blockTemplate') as string));

            return result;
        }

        private m_blockTemplate: Block = new Block();
        private m_current_blockchain_height = 0;
        private m_hop = 0;

        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        public toBuffer (): Buffer {
            const payload = new PortableStorage();

            payload.set('current_blockchain_height', BigInteger(this.current_blockchain_height), StorageType.UINT32);
            payload.set('hop', BigInteger(this.hop), StorageType.UINT32);
            payload.set('blockTemplate', this.blockTemplate.toString(), StorageType.STRING);

            return payload.toBuffer();
        }

        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        public toString (): string {
            return this.toBuffer().toString('hex');
        }
    }

    export class MissingTransactions implements ILevinPayload {
        /**
         * The current blockchain height
         */
        public get current_blockchain_height (): number {
            return this.m_current_blockchain_height;
        }

        public set current_blockchain_height (value: number) {
            this.m_current_blockchain_height = value;
        }

        /**
         * The block hash containing for which we need the transactions
         */
        public get blockHash (): string {
            return this.m_blockHash;
        }

        public set blockHash (value: string) {
            const reader = new Reader(value);
            if (reader.length !== SIZES.KEY) {
                throw new Error('Invalid hash supplied');
            }

            this.m_blockHash = reader.hash();
        }

        /**
         * The list of missing transaction hashes we need
         */
        public get missing_txs (): string[] {
            return this.m_missing_txs;
        }

        public set missing_txs (value: string[]) {
            const tmp: string[] = [];

            value.forEach((v) => {
                const reader = new Reader(v);

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
        public static from (data: Reader | Buffer | string): MissingTransactions {
            const payload = PortableStorage.from(data);

            const result = new MissingTransactions();

            result.current_blockchain_height =
                (payload.get('current_blockchain_height') as BigInteger.BigInteger).toJSNumber();
            result.blockHash = payload.get('blockHash') as string;

            if (payload.exists('missing_txs')) {
                const reader = new Reader(payload.get('missing_txs') as string);

                if (reader.length % SIZES.KEY) {
                    throw new RangeError('Invalid missing_tx data');
                }

                while (reader.unreadBytes > 0) {
                    result.missing_txs.push(reader.hash());
                }
            }

            return result;
        }

        private m_blockHash: string = ''.padStart(64, '0');
        private m_current_blockchain_height = 0;
        private m_missing_txs: string[] = [];

        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        public toBuffer (): Buffer {
            const payload = new PortableStorage();

            payload.set('current_blockchain_height', BigInteger(this.current_blockchain_height), StorageType.UINT32);
            payload.set('blockHash', this.blockHash, StorageType.STRING);

            const writer = new Writer();

            this.missing_txs.forEach((tx) => writer.hash(tx));

            payload.set('missing_txs', writer.buffer.toString('hex'), StorageType.STRING);

            return payload.toBuffer();
        }

        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        public toString (): string {
            return this.toBuffer().toString('hex');
        }
    }

    export class NewBlock implements ILevinPayload {
        /**
         * The new block
         */
        public get block (): Block {
            return this.m_block;
        }

        public set block (value: Block) {
            this.m_block = value;
        }

        /**
         * The transactions in the new block
         */
        public get transactions (): Transaction[] {
            return this.m_transactions;
        }

        public set transactions (value: Transaction[]) {
            this.m_transactions = value;
        }

        /**
         * The current blockchain height
         */
        public get current_blockchain_height (): number {
            return this.m_current_blockchain_height;
        }

        public set current_blockchain_height (value: number) {
            this.m_current_blockchain_height = value;
        }

        /**
         * The number of hops from the originating node
         */
        public get hop (): number {
            return this.m_hop;
        }

        public set hop (value: number) {
            this.m_hop = value;
        }

        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        public static async from (data: Reader | Buffer | string): Promise<NewBlock> {
            const payload = PortableStorage.from(data);

            const result = new NewBlock();

            if (payload.exists('block')) {
                const blockPayload = (payload.get('block') as PortableStorage);

                result.block = await Block.from((blockPayload.get('block') as string));

                if (blockPayload.exists('txs')) {
                    for (const tx of (blockPayload.get('txs') as string[])) {
                        result.transactions.push(await Transaction.from(tx));
                    }
                }
            }

            result.current_blockchain_height =
                (payload.get('current_blockchain_height') as BigInteger.BigInteger).toJSNumber();
            result.hop = (payload.get('hop') as BigInteger.BigInteger).toJSNumber();

            return result;
        }

        private m_block: Block = new Block();
        private m_transactions: Transaction[] = [];
        private m_current_blockchain_height = 0;
        private m_hop = 0;

        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        public toBuffer (): Buffer {
            const payload = new PortableStorage();

            const blockPayload = new PortableStorage();

            blockPayload.set('block', this.block.toString(), StorageType.STRING);

            if (this.transactions.length !== 0) {
                const txs: string[] = [];

                this.transactions.forEach((tx) => {
                    txs.push(tx.toString());
                });

                blockPayload.set('txs', txs, StorageType.STRING_ARRAY);
            }

            payload.set('block', blockPayload, StorageType.OBJECT);
            payload.set('current_blockchain_height', BigInteger(this.current_blockchain_height), StorageType.UINT32);
            payload.set('hop', BigInteger(this.hop), StorageType.UINT32);

            return payload.toBuffer();
        }

        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        public toString (): string {
            return this.toBuffer().toString('hex');
        }
    }

    export class NewTransactions implements ILevinPayload {
        /**
         * The new transactions in the packet
         */
        public get transactions (): Transaction[] {
            return this.m_transactions;
        }

        public set transactions (value: Transaction[]) {
            this.m_transactions = value;
        }

        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        public static async from (data: Reader | Buffer | string): Promise<NewTransactions> {
            const payload = PortableStorage.from(data);

            const result = new NewTransactions();

            if (payload.exists('txs')) {
                for (const tx of (payload.get('txs') as string[])) {
                    result.transactions.push(await Transaction.from(tx));
                }
            }

            return result;
        }

        private m_transactions: Transaction[] = [];

        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        public toBuffer (): Buffer {
            const payload = new PortableStorage();

            const txs: string[] = [];

            this.transactions.forEach((tx) => txs.push(tx.toString()));

            payload.set('txs', txs, StorageType.STRING_ARRAY);

            return payload.toBuffer();
        }

        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        public toString (): string {
            return this.toBuffer().toString('hex');
        }
    }

    export class Ping implements ILevinPayload {
        /**
         * The current ping status message
         * Usually 'OK'
         */
        public get status (): string {
            return this.m_status;
        }

        public set status (value: string) {
            this.m_status = value;
        }

        /**
         * The peer ID
         */
        public get peer_id (): string {
            return this.m_peer_id;
        }

        public set peer_id (value: string) {
            const reader = new Reader(value);
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
        public static from (data: Reader | Buffer | string): Ping {
            const payload = PortableStorage.from(data);

            const result = new Ping();

            if (payload.exists('peer_id')) {
                result.peer_id = (payload.get('peer_id') as BigInteger.BigInteger)
                    .toString(16).padStart(16, '0');
            }

            if (payload.exists('status')) {
                result.status = Buffer.from(payload.get('status') as string, 'hex').toString();
            }

            return result;
        }

        private m_status = '';
        private m_peer_id: string = ''.padStart(16, '0');

        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        public toBuffer (): Buffer {
            const payload = new PortableStorage();

            if (this.status.length !== 0) {
                payload.set('status', Buffer.from(this.status).toString('hex'), StorageType.STRING);
            }

            if (this.peer_id !== ''.padStart(16, '0')) {
                payload.set('peer_id', BigInteger(this.peer_id, 16), StorageType.UINT64);
            }

            return payload.toBuffer();
        }

        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        public toString (): string {
            return this.toBuffer().toString('hex');
        }
    }

    export class RequestChain implements ILevinPayload {
        /**
         * A list of known block IDs in descending order (genesis block last)
         */
        public get block_ids (): string[] {
            return this.m_block_ids;
        }

        public set block_ids (value: string[]) {
            const tmp: string[] = [];

            value.forEach((v) => {
                const reader = new Reader(v);

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
        public static from (data: Reader | Buffer | string): RequestChain {
            const payload = PortableStorage.from(data);

            const result = new RequestChain();

            if (payload.exists('block_ids')) {
                const reader = new Reader(payload.get('block_ids') as string);

                if (reader.length % 32 !== 0) {
                    throw new Error('Error parsing block ids');
                }

                while (reader.unreadBytes > 0) {
                    result.block_ids.push(reader.hash());
                }
            }

            return result;
        }

        private m_block_ids: string[] = [];

        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        public toBuffer (): Buffer {
            const payload = new PortableStorage();

            const writer = new Writer();

            this.block_ids.forEach((hash) => writer.hash(hash));

            payload.set('block_ids', writer.buffer.toString('hex'), StorageType.STRING);

            return payload.toBuffer();
        }

        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        public toString (): string {
            return this.toBuffer().toString('hex');
        }
    }

    export class RequestGetObjects implements ILevinPayload {
        /**
         * A list of block hashes we would like the data for
         */
        public get blocks (): string[] {
            return this.m_transactions;
        }

        public set blocks (value: string[]) {
            const tmp: string[] = [];

            value.forEach((v) => {
                const reader = new Reader(v);

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
        public get transactions (): string[] {
            return this.m_blocks;
        }

        public set transactions (value: string[]) {
            const tmp: string[] = [];

            value.forEach((v) => {
                const reader = new Reader(v);

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
        public static from (data: Reader | Buffer | string): RequestGetObjects {
            const payload = PortableStorage.from(data);

            const result = new RequestGetObjects();

            if (payload.exists('blocks')) {
                const reader = new Reader(payload.get('blocks') as string);

                if (reader.length % 32 !== 0) {
                    throw new Error('Error parsing txs');
                }

                while (reader.unreadBytes > 0) {
                    result.blocks.push(reader.hash());
                }
            }

            if (payload.exists('txs')) {
                const reader = new Reader(payload.get('txs') as string);

                if (reader.length % 32 !== 0) {
                    throw new Error('Error parsing txs');
                }

                while (reader.unreadBytes > 0) {
                    result.transactions.push(reader.hash());
                }
            }

            return result;
        }

        private m_transactions: string[] = [];
        private m_blocks: string[] = [];

        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        public toBuffer (): Buffer {
            const payload = new PortableStorage();

            const writer = new Writer();

            if (this.transactions.length !== 0) {
                this.transactions.forEach((tx) => writer.hash(tx));

                payload.set('txs', writer.buffer.toString('hex'), StorageType.STRING);
            }

            if (this.blocks.length !== 0) {
                this.blocks.forEach((tx) => writer.hash(tx));

                payload.set('blocks', writer.buffer.toString('hex'), StorageType.STRING);
            }

            return payload.toBuffer();
        }

        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        public toString (): string {
            return this.toBuffer().toString('hex');
        }
    }

    export class RequestTXPool implements ILevinPayload {
        /**
         * A list of transaction hashes we need data for in the pool
         */
        public get transactions (): string[] {
            return this.m_transactions;
        }

        public set transactions (value: string[]) {
            const tmp: string[] = [];

            value.forEach((v) => {
                const reader = new Reader(v);

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
        public static from (data: Reader | Buffer | string): RequestTXPool {
            const payload = PortableStorage.from(data);

            const result = new RequestTXPool();

            if (payload.exists('txs')) {
                const reader = new Reader(payload.get('txs') as string);

                if (reader.length % 32 !== 0) {
                    throw new Error('Error parsing txs');
                }

                while (reader.unreadBytes > 0) {
                    result.transactions.push(reader.hash());
                }
            }

            return result;
        }

        private m_transactions: string[] = [];

        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        public toBuffer (): Buffer {
            const payload = new PortableStorage();

            const writer = new Writer();

            this.transactions.forEach((tx) => writer.hash(tx));

            payload.set('txs', writer.buffer.toString('hex'), StorageType.STRING);

            return payload.toBuffer();
        }

        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        public toString (): string {
            return this.toBuffer().toString('hex');
        }
    }

    export class ResponseChain implements ILevinPayload {
        /**
         * The block hashes that we know about in descending order
         */
        public get block_ids (): string[] {
            return this.m_block_ids;
        }

        public set block_ids (value: string[]) {
            const tmp: string[] = [];

            value.forEach((v) => {
                const reader = new Reader(v);

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
        public get start_height (): number {
            return this.m_start_height;
        }

        public set start_height (value: number) {
            this.m_start_height = value;
        }

        /**
         * The current network height we have observed
         */
        public get total_height (): number {
            return this.m_total_height;
        }

        public set total_height (value: number) {
            this.m_total_height = value;
        }

        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        public static from (data: Reader | Buffer | string): ResponseChain {
            const payload = PortableStorage.from(data);

            const result = new ResponseChain();

            result.start_height = (payload.get('start_height') as BigInteger.BigInteger)
                .toJSNumber();

            result.total_height = (payload.get('total_height') as BigInteger.BigInteger)
                .toJSNumber();

            if (payload.exists('m_block_ids')) {
                const reader = new Reader(payload.get('m_block_ids') as string);

                if (reader.length % 32 !== 0) {
                    throw new Error('Error parsing block ids');
                }

                while (reader.unreadBytes > 0) {
                    result.block_ids.push(reader.hash());
                }
            }

            return result;
        }

        private m_start_height = 0;
        private m_total_height = 0;
        private m_block_ids: string[] = [];

        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        public toBuffer (): Buffer {
            const payload = new PortableStorage();

            payload.set('start_height', BigInteger(this.start_height), StorageType.UINT32);

            payload.set('total_height', BigInteger(this.total_height), StorageType.UINT32);

            const writer = new Writer();

            this.block_ids.forEach((hash) => writer.hash(hash));

            payload.set('m_block_ids', writer.buffer.toString('hex'), StorageType.STRING);

            return payload.toBuffer();
        }

        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        public toString (): string {
            return this.toBuffer().toString('hex');
        }
    }

    export class ResponseGetObjects implements ILevinPayload {
        /**
         * A list of transactions in the response
         */
        public get transactions (): Transaction[] {
            return this.m_transactions;
        }

        public set transactions (value: Transaction[]) {
            this.m_transactions = value;
        }

        /**
         * A list of hashes that we cannot find in our copy of the blockchain
         */
        public get missed_ids (): string[] {
            return this.m_missed_ids;
        }

        public set missed_ids (value: string[]) {
            this.m_missed_ids = value;
        }

        /**
         * The current blockchain height
         */
        public get current_blockchain_height (): number {
            return this.m_current_blockchain_height;
        }

        public set current_blockchain_height (value: number) {
            this.m_current_blockchain_height = value;
        }

        /**
         * A list of blocks in the response
         */
        public get blocks (): RawBlock[] {
            return this.m_raw_blocks;
        }

        public set blocks (value: RawBlock[]) {
            this.m_raw_blocks = value;
        }

        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        public static async from (data: Reader | Buffer | string): Promise<ResponseGetObjects> {
            const payload = PortableStorage.from(data);

            const result = new ResponseGetObjects();

            if (payload.exists('txs')) {
                for (const tx of (payload.get('txs') as string[])) {
                    result.transactions.push(await Transaction.from(tx));
                }
            }

            if (payload.exists('blocks')) {
                for (const block of (payload.get('blocks') as PortableStorage[])) {
                    const l_block = await Block.from(block.get('block') as string);

                    const l_txs: Transaction[] = [];

                    if (block.exists('txs')) {
                        for (const tx of (block.get('txs') as string[])) {
                            l_txs.push(await Transaction.from(tx));
                        }
                    }

                    result.blocks.push(new RawBlock(l_block, l_txs));
                }
            }

            if (payload.exists('missed_ids')) {
                const reader = new Reader(payload.get('missed_ids') as string);

                if (reader.length % 32 !== 0) {
                    throw new Error('Cannot parsed missed_ids');
                }

                while (reader.unreadBytes) {
                    result.missed_ids.push(reader.hash());
                }
            }

            if (payload.exists('current_blockchain_height')) {
                result.current_blockchain_height =
                    (payload.get('current_blockchain_height') as BigInteger.BigInteger).toJSNumber();
            }

            return result;
        }

        private m_transactions: Transaction[] = [];
        private m_raw_blocks: RawBlock[] = [];
        private m_missed_ids: string[] = [];
        private m_current_blockchain_height = 0;

        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        public toBuffer (): Buffer {
            const payload = new PortableStorage();

            if (this.transactions.length !== 0) {
                const txs: string[] = [];

                this.transactions.forEach((tx) => txs.push(tx.toString()));

                payload.set('txs', txs, StorageType.STRING_ARRAY);
            }

            if (this.blocks.length !== 0) {
                const blocks: PortableStorage[] = [];

                this.blocks.forEach((rawBlock) => {
                    const block = new PortableStorage();

                    block.set('block', rawBlock.block.toString(), StorageType.STRING);

                    const txs: string[] = [];

                    rawBlock.transactions.forEach((tx) => txs.push(tx.toString()));

                    if (txs.length !== 0) {
                        block.set('txs', txs, StorageType.STRING_ARRAY);
                    }

                    blocks.push(block);
                });

                payload.set('blocks', blocks, StorageType.OBJECT_ARRAY);
            }

            if (this.missed_ids.length !== 0) {
                const writer = new Writer();

                this.missed_ids.forEach((id) => writer.hash(id));

                payload.set('missed_ids', writer.buffer.toString('hex'), StorageType.STRING);
            }

            payload.set('current_blockchain_height', BigInteger(this.current_blockchain_height), StorageType.UINT32);

            return payload.toBuffer();
        }

        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        public toString (): string {
            return this.toBuffer().toString('hex');
        }
    }

    export class TimedSync implements ILevinPayload {
        /**
         * The current time of the node
         */
        public get local_time (): Date {
            return this.m_local_time;
        }

        public set local_time (value: Date) {
            this.m_local_time = value;
        }

        /**
         * The current height of the node
         */
        public get current_height (): number {
            return this.m_current_height;
        }

        public set current_height (value: number) {
            this.m_current_height = value;
        }

        /**
         * The last known block hash of the node
         */
        public get top_id (): string {
            return this.m_top_id;
        }

        public set top_id (value: string) {
            const reader = new Reader(value);
            if (reader.length !== SIZES.KEY) {
                throw new Error('Invalid top id length');
            }

            this.m_top_id = reader.hash();
        }

        /**
         * The list of locally known peers
         */
        public get local_peerlist (): PeerEntry[] {
            return this.m_local_peerlist;
        }

        public set local_peerlist (value: PeerEntry[]) {
            this.m_local_peerlist = value;
        }

        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        public static from (data: Reader | Buffer | string): TimedSync {
            const payload = PortableStorage.from(data);

            const result = new TimedSync();

            if (payload.exists('local_time')) {
                const lt = (payload.get('local_time') as BigInteger.BigInteger)
                    .toString(16)
                    .padStart(16, '0');

                result.local_time = (new Reader(lt)).time_t(true);
            }

            result.current_height =
                ((payload.get('payload_data') as PortableStorage).get('current_height') as BigInteger.BigInteger)
                    .toJSNumber();

            result.top_id = (payload.get('payload_data') as PortableStorage).get('top_id') as string;

            if (payload.exists('local_peerlist')) {
                const peerlist = (payload.get('local_peerlist')) as Buffer;

                const reader = new Reader(peerlist);

                if (reader.length % 24 !== 0) {
                    throw new Error('Error parsing local_peer list');
                }

                while (reader.unreadBytes > 0) {
                    result.local_peerlist.push(PeerEntry.from(reader.bytes(24)));
                }
            }

            return result;
        }

        private m_local_time: Date = new Date(0);
        private m_current_height = 0;
        private m_top_id: string = ''.padStart(64, '0');
        private m_local_peerlist: PeerEntry[] = [];

        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        public toBuffer (): Buffer {
            const payload = new PortableStorage();

            if (this.local_time.getTime() !== 0) {
                const writer = new Writer();
                writer.time_t(this.local_time, true);

                payload.set('local_time', BigInteger(writer.blob, 16), StorageType.UINT64);
            }

            const payload_data = new PortableStorage();
            payload_data.set('current_height', BigInteger(this.current_height), StorageType.UINT32);
            payload_data.set('top_id', this.top_id, StorageType.STRING);

            payload.set('payload_data', payload_data, StorageType.OBJECT);

            const peerList = new Writer();
            this.local_peerlist.forEach((peer) => peerList.write(peer.toBuffer()));

            if (peerList.length !== 0) {
                payload.set('local_peerlist', peerList.buffer.toString('hex'), StorageType.STRING);
            }

            return payload.toBuffer();
        }

        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        public toString (): string {
            return this.toBuffer().toString('hex');
        }
    }
}

/** @ignore */
export function int2ip (ipInt: number): string {
    if (ipInt > 4294967295) {
        throw new Error('Integer value exceeds 32-bit bounds');
    }

    return ((ipInt >>> 24) + '.' + (ipInt >> 16 & 255) + '.' + (ipInt >> 8 & 255) + '.' + (ipInt & 255));
}

/** @ignore */
export function ip2int (ip: string): number {
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
