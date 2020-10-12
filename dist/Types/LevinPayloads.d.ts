/// <reference types="node" />
import { Reader } from '@turtlecoin/bytestream';
import { Block } from '../Block';
import { Transaction } from '../Transaction';
/** @ignore */
export declare enum SIZES {
    KEY = 32,
    PEER_ID = 8,
    NETWORK_ID = 16
}
export declare namespace LevinPayloads {
    /**
     * Represents a Raw Block For Levin Based Payloads
     */
    class RawBlock {
        /**
         * The block
         */
        block: Block;
        /**
         * The transactions in the block
         */
        transactions: Transaction[];
        /**
         * Constructs a new raw block given the supplied values
         * @param block
         * @param transactions
         */
        constructor(block?: Block, transactions?: Transaction[]);
    }
    /**
     * Represents a peer entry in the peer list
     */
    class PeerEntry {
        /**
         * The peer IP address
         */
        get ip(): string;
        set ip(value: string);
        /**
         * The peer's port number
         */
        get port(): number;
        set port(value: number);
        /**
         * The peer ID
         */
        get id(): string;
        set id(value: string);
        /**
         * The last seen datetime of the peer
         */
        get last_seen(): Date;
        set last_seen(value: Date);
        /**
         * Creates a new peer entry instance using the supplied data
         * @param data the raw data of the peer entry
         * @returns a new instance of the object
         */
        static from(data: Reader | Buffer | string): PeerEntry;
        protected m_ip: number;
        protected m_port: number;
        protected m_id: string;
        protected m_last_seen: Date;
        /**
         * Constructs a new peer entry using the supplied values
         * @param ip the peer ip address
         * @param port the peer port
         * @param id the peer id
         * @param last_seen the date the peer was last seen
         */
        constructor(ip: string, port: number, id: string, last_seen: Date);
        /**
         * The Buffer representation of the peer entry
         * @returns the buffer representation of the object
         */
        toBuffer(): Buffer;
        /**
         * The hexadecimal (blob) representation of the peer entry
         * @returns the hexadecimal (blob) representation of the object
         */
        toString(): string;
    }
    /**
     * Abstract object for all Levin Payloads
     */
    abstract class ILevinPayload {
        abstract toBuffer(): Buffer;
        abstract toString(): string;
    }
    /** @ignore */
    class LevinPayload implements ILevinPayload {
        toBuffer(): Buffer;
        toString(): string;
    }
    /**
     * Represents a handshake payload
     */
    class Handshake implements ILevinPayload {
        /**
         * The network ID
         */
        get network_id(): string;
        set network_id(value: string);
        /**
         * The protocol version supported
         */
        get version(): number;
        set version(value: number);
        /**
         * The current date and time
         */
        get local_time(): Date;
        set local_time(value: Date);
        /**
         * Our port number for p2p traffic
         */
        get my_port(): number;
        set my_port(value: number);
        /**
         * Our peer ID
         */
        get peer_id(): string;
        set peer_id(value: string);
        /**
         * Our current blockchain height
         */
        get current_height(): number;
        set current_height(value: number);
        /**
         * The top block hash that we know about
         */
        get top_id(): string;
        set top_id(value: string);
        /**
         * Our list of locally known peers
         */
        get local_peerlist(): PeerEntry[];
        set local_peerlist(value: PeerEntry[]);
        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        static from(data: Reader | Buffer | string): Handshake;
        private m_network_id;
        private m_version;
        private m_local_time;
        private m_my_port;
        private m_peer_id;
        private m_current_height;
        private m_top_id;
        private m_local_peerlist;
        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        toBuffer(): Buffer;
        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        toString(): string;
    }
    class LiteBlock implements ILevinPayload {
        /**
         * The block template a as block
         */
        get blockTemplate(): Block;
        set blockTemplate(value: Block);
        /**
         * The current blockchain height
         */
        get current_blockchain_height(): number;
        set current_blockchain_height(value: number);
        /**
         * The hops from the originating node
         */
        get hop(): number;
        set hop(value: number);
        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        static from(data: Reader | Buffer | string): Promise<LiteBlock>;
        private m_blockTemplate;
        private m_current_blockchain_height;
        private m_hop;
        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        toBuffer(): Buffer;
        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        toString(): string;
    }
    class MissingTransactions implements ILevinPayload {
        /**
         * The current blockchain height
         */
        get current_blockchain_height(): number;
        set current_blockchain_height(value: number);
        /**
         * The block hash containing for which we need the transactions
         */
        get blockHash(): string;
        set blockHash(value: string);
        /**
         * The list of missing transaction hashes we need
         */
        get missing_txs(): string[];
        set missing_txs(value: string[]);
        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        static from(data: Reader | Buffer | string): MissingTransactions;
        private m_blockHash;
        private m_current_blockchain_height;
        private m_missing_txs;
        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        toBuffer(): Buffer;
        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        toString(): string;
    }
    class NewBlock implements ILevinPayload {
        /**
         * The new block
         */
        get block(): Block;
        set block(value: Block);
        /**
         * The transactions in the new block
         */
        get transactions(): Transaction[];
        set transactions(value: Transaction[]);
        /**
         * The current blockchain height
         */
        get current_blockchain_height(): number;
        set current_blockchain_height(value: number);
        /**
         * The number of hops from the originating node
         */
        get hop(): number;
        set hop(value: number);
        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        static from(data: Reader | Buffer | string): Promise<NewBlock>;
        private m_block;
        private m_transactions;
        private m_current_blockchain_height;
        private m_hop;
        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        toBuffer(): Buffer;
        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        toString(): string;
    }
    class NewTransactions implements ILevinPayload {
        /**
         * The new transactions in the packet
         */
        get transactions(): Transaction[];
        set transactions(value: Transaction[]);
        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        static from(data: Reader | Buffer | string): Promise<NewTransactions>;
        private m_transactions;
        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        toBuffer(): Buffer;
        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        toString(): string;
    }
    class Ping implements ILevinPayload {
        /**
         * The current ping status message
         * Usually 'OK'
         */
        get status(): string;
        set status(value: string);
        /**
         * The peer ID
         */
        get peer_id(): string;
        set peer_id(value: string);
        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        static from(data: Reader | Buffer | string): Ping;
        private m_status;
        private m_peer_id;
        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        toBuffer(): Buffer;
        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        toString(): string;
    }
    class RequestChain implements ILevinPayload {
        /**
         * A list of known block IDs in descending order (genesis block last)
         */
        get block_ids(): string[];
        set block_ids(value: string[]);
        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        static from(data: Reader | Buffer | string): RequestChain;
        private m_block_ids;
        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        toBuffer(): Buffer;
        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        toString(): string;
    }
    class RequestGetObjects implements ILevinPayload {
        /**
         * A list of block hashes we would like the data for
         */
        get blocks(): string[];
        set blocks(value: string[]);
        /**
         * A list of transaction hashes we would like the data for
         */
        get transactions(): string[];
        set transactions(value: string[]);
        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        static from(data: Reader | Buffer | string): RequestGetObjects;
        private m_transactions;
        private m_blocks;
        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        toBuffer(): Buffer;
        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        toString(): string;
    }
    class RequestTXPool implements ILevinPayload {
        /**
         * A list of transaction hashes we need data for in the pool
         */
        get transactions(): string[];
        set transactions(value: string[]);
        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        static from(data: Reader | Buffer | string): RequestTXPool;
        private m_transactions;
        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        toBuffer(): Buffer;
        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        toString(): string;
    }
    class ResponseChain implements ILevinPayload {
        /**
         * The block hashes that we know about in descending order
         */
        get block_ids(): string[];
        set block_ids(value: string[]);
        /**
         * the starting height of the response data
         */
        get start_height(): number;
        set start_height(value: number);
        /**
         * The current network height we have observed
         */
        get total_height(): number;
        set total_height(value: number);
        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        static from(data: Reader | Buffer | string): ResponseChain;
        private m_start_height;
        private m_total_height;
        private m_block_ids;
        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        toBuffer(): Buffer;
        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        toString(): string;
    }
    class ResponseGetObjects implements ILevinPayload {
        /**
         * A list of transactions in the response
         */
        get transactions(): Transaction[];
        set transactions(value: Transaction[]);
        /**
         * A list of hashes that we cannot find in our copy of the blockchain
         */
        get missed_ids(): string[];
        set missed_ids(value: string[]);
        /**
         * The current blockchain height
         */
        get current_blockchain_height(): number;
        set current_blockchain_height(value: number);
        /**
         * A list of blocks in the response
         */
        get blocks(): RawBlock[];
        set blocks(value: RawBlock[]);
        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        static from(data: Reader | Buffer | string): Promise<ResponseGetObjects>;
        private m_transactions;
        private m_raw_blocks;
        private m_missed_ids;
        private m_current_blockchain_height;
        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        toBuffer(): Buffer;
        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        toString(): string;
    }
    class TimedSync implements ILevinPayload {
        /**
         * The current time of the node
         */
        get local_time(): Date;
        set local_time(value: Date);
        /**
         * The current height of the node
         */
        get current_height(): number;
        set current_height(value: number);
        /**
         * The last known block hash of the node
         */
        get top_id(): string;
        set top_id(value: string);
        /**
         * The list of locally known peers
         */
        get local_peerlist(): PeerEntry[];
        set local_peerlist(value: PeerEntry[]);
        /**
         * Creates a new instance of the object using the supplied data found in the levin packet
         * @param data the data contained for the payload in the levin packet
         * @returns a new instance of the object
         */
        static from(data: Reader | Buffer | string): TimedSync;
        private m_local_time;
        private m_current_height;
        private m_top_id;
        private m_local_peerlist;
        /**
         * Provides the Buffer representation of the object
         * @returns the buffer representation of the object
         */
        toBuffer(): Buffer;
        /**
         * Provides the hexadecimal (blob) representation of the object
         * @returns the hexadecimal (blob) representation of the object
         */
        toString(): string;
    }
}
/** @ignore */
export declare function int2ip(ipInt: number): string;
/** @ignore */
export declare function ip2int(ip: string): number;
