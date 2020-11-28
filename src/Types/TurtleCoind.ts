// Copyright (c) 2020, Brandon Lehmann, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import * as BigInteger from 'big-integer';

export namespace TurtleCoindTypes {
    export interface IVersion {
        /**
         * The major version number
         */
        major: number;

        /**
         * The minor version number
         */
        minor: number;

        /**
         * The patch version number
         */
        patch: number;
    }

    export interface IFee {
        /**
         * The wallet address to send the node transaction fee to
         */
        address: string;

        /**
         * The amount for the node transaction fee
         */
        amount: BigInteger.BigInteger;
    }

    export interface IHeight {
        /**
         * The current sync height of the node
         */
        height: number;

        /**
         * The current observed network height
         */
        networkHeight: number;
    }

    export interface IInfo {
        /**
         * The number of alternate candidate blocks the node is aware of
         */
        alternateBlockCount: number;

        /**
         * The current mining difficulty of the network
         */
        difficulty: number;

        /**
         * Whether the daemon supports the block explorer calls
         */
        explorer?: boolean;

        /**
         * The number of peers in the node's greylist
         */
        greyPeerlistSize: number;

        /**
         * The estimated global network hashrate
         */
        hashrate: number;

        /**
         * The current sync height of the node
         */
        height: number;

        /**
         * The number of current incoming connections into the node
         */
        incomingConnections: number;

        /**
         * The last block index of the node
         */
        lastBlockIndex: number;

        /**
         * The current block major version number
         */
        majorVersion: number;

        /**
         * The current block minor version number
         */
        minorVersion: number;

        /**
         * The current observed network height
         */
        networkHeight: number;

        /**
         * The number of current outgoing connections from the node
         */
        outgoingConnections: number;

        /**
         * The datetime of when the node was started
         */
        startTime: Date;

        /**
         * The block height that this node has support until
         */
        supportedHeight: number;

        /**
         * Whether the node is synced or not
         */
        synced: boolean;

        /**
         * The number of transactions in the memory pool
         */
        transactionsPoolSize: number;

        /**
         * The number of user-generated transactions in the blockchain
         */
        transactionsSize: number;

        /**
         * The network upgrade heights that this node knows about
         */
        upgradeHeights: number[];

        /**
         * The version number of this node
         */
        version: IVersion;

        /**
         * The number of candidate peers in the node's whitelist
         */
        whitePeerlistSize: number;

        /**
         * Whether this node is a cache API or not
         */
        isCacheApi?: boolean
    }

    export interface IPeers {
        /**
         * A list of grey listed peers
         */
        greyPeers: {
            /**
             * The IP/hostname
             */
            host: string,

            /**
             * The port
             */
            port: number
        }[];

        /**
         * A list of candidate peers
         */
        peers: {
            /**
             * The IP/hostname
             */
            host: string,

            /**
             * The port
             */
            port: number
        }[];
    }

    export interface TransactionSummary {
        /**
         * The total amount of the outputs in the transaction
         */
        amountOut: number;

        /**
         * The network fee paid by the transaction
         */
        fee: number;

        /**
         * The transaction hash
         */
        hash: string;

        /**
         * The size of the transaction in bytes
         */
        size: number;
    }

    export interface ITransactionMeta {
        /**
         * The total amount of the outputs in the transaction
         */
        amountOut: number;

        /**
         * The network fee paid by the transaction
         */
        fee: number;

        /**
         * The payment ID contained in the transaction
         */
        paymentId: string;

        /**
         * The transaction one-time public key
         */
        publicKey: string;

        /**
         * The number of participant keys used in the ring signatures
         */
        ringSize: number;

        /**
         * The size of the transaction in bytes
         */
        size: number;
    }

    export interface IBlockHeader {
        /**
         * The currency circulation as of the given block
         */
        alreadyGeneratedCoins: BigInteger.BigInteger;

        /**
         * The number of transactions (including coinbase) in the chain as of the given block
         */
        alreadyGeneratedTransactions: number;

        /**
         * The base reward of the block
         */
        baseReward: number;

        /**
         * The current block depth
         */
        depth: number;

        /**
         * The difficulty of the block
         */
        difficulty: number;

        /**
         * The block hash
         */
        hash: string;

        /**
         * The block height
         */
        height: number;

        /**
         * The block major version number
         */
        majorVersion: number;

        /**
         * The block minor version number
         */
        minorVersion: number;

        /**
         * The block nonce
         */
        nonce: number;

        /**
         * Whether the block is an orphan
         */
        orphan: boolean;

        /**
         * The block reward penalty applied
         */
        penalty: number;

        /**
         * The previous block hash
         */
        prevHash: string;

        /**
         * The total reward granted for mining this block
         */
        reward: number;

        /**
         * The size of the block in bytes
         */
        size: number;

        /**
         * The median block size in bytes
         */
        sizeMedian: number;

        /**
         * The datetime the block was mined
         */
        timestamp: Date;

        /**
         * The total amount of transaction fees included in the block
         */
        totalFeeAmount: number;

        /**
         * The number of transactions included in this block
         */
        transactionCount: number;

        /**
         * The total size (in bytes) of the transactions in this block
         */
        transactionsCumulativeSize: number;
    }

    export interface IBlock extends IBlockHeader {
        /**
         * An array of transaction summaries contained in the block
         */
        transactions: TransactionSummary[];
    }

    export interface IRawBlock {
        /**
         * The raw block in hex representation
         */
        blob: string;

        /**
         * An array of raw transactions in hex representation
         */
        transactions: string[];
    }

    export interface IBlockTemplate {
        /**
         * The difficulty that must be met for this block
         */
        difficulty: number;

        /**
         * The height for which the block template is valid
         */
        height: number;

        /**
         * The location of the offset bytes that can be used
         * for pooled mining
         */
        reservedOffset: number;

        /**
         * The raw block template in hex representation
         */
        blob: string;
    }

    export interface ITransactionInput {
        /**
         * The input type
         */
        type: string;
    }

    export interface ITransactionInputCoinbase extends ITransactionInput {
        /**
         * The block height of the coinbase input
         */
        height: number;
    }

    export interface ITransactionInputKey extends ITransactionInput {
        /**
         * The amount of the transaction input
         */
        amount: number;

        /**
         * The key image used by the transaction input
         */
        keyImage: string;

        /**
         * The global index offsets used in the input signature(s)
         */
        offsets: number[];
    }

    export interface ITransactionOutput {
        /**
         * The output type
         */
        type: string;
    }

    export interface ITransactionOutputKey extends ITransactionOutput {
        /**
         * The amount of the transaction output
         */
        amount: number;

        /**
         * The destination key of the transaction output
         */
        key: string;
    }

    export type ITransactionPrefixInput = ITransactionInputCoinbase | ITransactionInputKey;

    export type ITransactionPrefixOutput = ITransactionOutputKey;

    export interface ITransactionPrefix {
        /**
         * The hex representation of the data contained in the TX_EXTRA field
         */
        extra: string;

        /**
         * The transaction input(s)
         */
        inputs: ITransactionPrefixInput[];

        /**
         * The transaction output(s)
         */
        outputs: ITransactionPrefixOutput[];

        /**
         * The unlock time of the transaction
         */
        unlockTime: BigInteger.BigInteger;

        /**
         * The version number of the transaction
         */
        version: number;
    }

    export interface ITransaction {
        /**
         * The header of the block containing the transaction
         */
        block: IBlockHeader;

        /**
         * The transaction prefix information
         */
        prefix: ITransactionPrefix;

        /**
         * The meta data regarding the transaction
         */
        meta: ITransactionMeta;
    }

    export interface ITransactionPoolDelta {
        /**
         * An array of raw transactions in hex representation that were added
         * to the memory pool
         */
        added: string[];

        /**
         * An array of transaction hashes that have been removed from the memory pool
         */
        deleted: string[];

        /**
         * Whether the last known block hash supplied is at the top of the block chain
         */
        synced: boolean;
    }

    export interface ITransactionsStatus {
        /**
         * An array of transaction hashes that are contained within blocks
         */
        inBlock: string[];

        /**
         * An array of transaction hashes that are contained within the memory pool
         */
        inPool: string[];

        /**
         * An array of transaction hashes that could not be found
         */
        notFound: string[];
    }

    export interface IRandomOutput {
        /**
         * The amount of the output
         */
        amount: number;

        /**
         * An array of outputs for the given amount
         */
        outputs: {
            /**
             * The global index
             */
            index: number,

            /**
             * The output key
             */
            key: string
        }[]
    }

    export interface ITransactionIndexes
    {
        /**
         * The transaction hash
         */
        hash: string;

        /**
         * An array of global indexes for the transaction in the order in which
         * they were listed in the transaction output(s)
         */
        indexes: number[];
    }

    export interface ISyncTransaction {
        /**
         * The transaction hash
         */
        hash: string;

        /**
         * An array of the transaction inputs
         */
        inputs: {
            /**
             * The amount of the input
             */
            amount: number;

            /**
             * The key image used for the input
             */
            keyImage: string;
        }[];

        /**
         * An array of the transaction outputs
         */
        outputs: {
            /**
             * The amount of the output
             */
            amount: number;

            /**
             * The output key
             */
            key: string;
        }[];

        /**
         * The payment ID of the transaction
         */
        paymentId: string;

        /**
         * The one-time public key of the transaction
         */
        publicKey: string;

        /**
         * The unlock time of the transaction
         */
        unlockTime: BigInteger.BigInteger;
    }

    export interface ISyncBlock {
        /**
         * The block hash
         */
        hash: string;

        /**
         * The block height
         */
        height: number;

        /**
         * The datetime of the block
         */
        timestamp: Date;

        /**
         * The coinbase transaction contained in the block
         */
        coinbaseTX?: {
            /**
             * The transaction hash
             */
            hash: string;
            /**
             * The transaction outputs
             */
            outputs: {
                /**
                 * The output amount
                 */
                amount: number,

                /**
                 * The output key
                 */
                key: string
            }[],

            /**
             * The one-time public key of the transaction
             */
            publicKey: string;

            /**
             * The unlock time of the transaction
             */
            unlockTime: BigInteger.BigInteger;
        }

        /**
         * An array of transactions in the block
         */
        transactions: ISyncTransaction[]
    }

    export interface ISync {
        /**
         * An array of blocks as a result of the sync request
         */
        blocks: ISyncBlock[],

        /**
         * Whether, based on the information supplied, you are synced with the block chain
         */
        synced: boolean;

        /**
         * Information regarding the top block of the block chain
         */
        topBlock?: {
            /**
             * The top block hash
             */
            hash: string;

            /**
             * The top block height
             */
            height: number;
        }
    }

    export interface IRawSync {
        /**
         * An array of RawBlocks as a result of the sync request
         */
        blocks: IRawBlock[];

        /**
         * Whether, based on the information supplied, you are synced with the block chain
         */
        synced: boolean;

        /**
         * Information regarding the top block of the block chain
         */
        topBlock?: {
            /**
             * The top block hash
             */
            hash: string;

            /**
             * The top block height
             */
            height: number;
        }
    }

    /**
     * Defines the necessary methods that must be implemented by a TurtleCoind interface
     */
    export abstract class ITurtleCoind {
        public abstract fee(): Promise<IFee>;

        public abstract height(): Promise<IHeight>;

        public abstract info(): Promise<IInfo>;

        public abstract peers(): Promise<IPeers>;

        public abstract blockCount(): Promise<number>;

        public abstract block(block: string | number): Promise<IBlock>;

        public abstract lastBlock(): Promise<IBlock>;

        public abstract blockHeaders(height: number): Promise<IBlock[]>;

        public abstract rawBlock(block: string | number): Promise<IRawBlock>;

        public abstract blockTemplate(address: string, reserveSize: number): Promise<IBlockTemplate>;

        public abstract submitBlock(block: string): Promise<string>;

        public abstract submitTransaction(transaction: string): Promise<string>;

        public abstract transaction(hash: string): Promise<ITransaction>;

        public abstract rawTransaction(hash: string): Promise<string>;

        public abstract transactionPool(): Promise<TransactionSummary[]>;

        public abstract rawTransactionPool(): Promise<string[]>;

        public abstract transactionPoolChanges(
            lastKnownBlock: string,
            transactions: string[]): Promise<ITransactionPoolDelta>;

        public abstract transactionsStatus(transactions: string[]): Promise<ITransactionsStatus>;

        public abstract randomIndexes(amounts: number[], count: number): Promise<IRandomOutput[]>;

        public abstract indexes(startHeight: number, endHeight: number): Promise<ITransactionIndexes[]>;

        public abstract sync(
            checkpoints: string[],
            height: number,
            timestamp: number,
            skipCoinbaseTransactions: boolean,
            count: number): Promise<ISync>;

        public abstract rawSync(
            checkpoints: string[],
            height: number,
            timestamp: number,
            skipCoinbaseTransactions: boolean,
            count: number): Promise<IRawSync>;
    }
}
