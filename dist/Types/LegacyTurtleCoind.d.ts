import * as BigInteger from 'big-integer';
/** @ignore */
export declare namespace LegacyTurtleCoindTypes {
    interface ITransactionOutput {
        /**
         * the amount of the output
         */
        amount: number;
        target: {
            data: {
                /**
                 * the one-time output key
                 */
                key: string;
            };
            /**
             * the type of the output
             */
            type: string;
        };
    }
    interface ITransactionDetailOutput {
        /**
         * the global index of the output
         */
        globalIndex: number;
        /**
         * the output data
         */
        output: ITransactionOutput;
    }
    interface ITransactionExtraDetail {
        /**
         * The transaction nonce
         */
        nonce?: number[];
        /**
         * The transaction public key
         */
        publicKey: string;
        /**
         * The hex representation of the raw extra in the transaction
         */
        raw: string;
    }
    interface ITransactionDetailInputCoinbase {
        /**
         * The input amount
         */
        amount: number;
        input: {
            /**
             * The height for which this input was generated
             */
            height: number;
        };
    }
    interface ITransactionDetailInputKeyInput {
        /**
         * the amount of the input
         */
        amount: number;
        /**
         * the key image of the input
         */
        k_image: string;
        /**
         * The output offsets used in mixing for this input
         */
        key_offsets: number[];
    }
    interface ITransactionDetailInputKeyOutput {
        /**
         * the number (index) of the output
         */
        number: number;
        /**
         * The transaction hash of the output
         */
        transactionHash: string;
    }
    interface ITransactionDetailInputKey {
        /**
         * The input data
         */
        input: ITransactionDetailInputKeyInput;
        /**
         * The number of mixins used for this input
         */
        mixin: number;
        /**
         * output information of this input
         */
        output: ITransactionDetailInputKeyOutput;
    }
    interface ITransactionDetailInput {
        /**
         * The transaction input data
         */
        data: ITransactionDetailInputCoinbase | ITransactionDetailInputKey;
        /**
         * The transaction input type
         */
        type: string;
    }
    interface ITransactionDetail {
        /**
         * The hash of the block the transaction is in
         */
        blockHash: string;
        /**
         * The index of the block the transaction is in
         */
        blockIndex: number;
        /**
         * The extra data contained in the transaction
         */
        extra: ITransactionExtraDetail;
        /**
         * The Transaction fee
         */
        fee: number;
        /**
         * The transaction hash
         */
        hash: string;
        /**
         * Whether the transaction is in the blockchain or not
         */
        inBlockchain: boolean;
        /**
         * The inputs of the transaction
         */
        inputs: ITransactionDetailInput[];
        /**
         * The number of mixins used in the transaction's ring signatures
         */
        mixin: number;
        /**
         * The outputs of the transaction
         */
        outputs: ITransactionDetailOutput[];
        /**
         * The paymentId of the transaction
         */
        paymentId: string;
        /**
         * The ring signatures of the inputs of the transaction
         */
        signatures: string[];
        /**
         * The size in bytes of the transaction signatures
         */
        signaturesSize: number;
        /**
         * The size in bytes of the transaction
         */
        size: number;
        /**
         * The timestamp of the transaction (inferred from block timestamp)
         */
        timestamp: number;
        /**
         * The total amount of the transaction inputs
         */
        totalInputsAmount: number;
        /**
         * The total amount of the transaction outputs
         */
        totalOutputsAmount: number;
        /**
         * The unlock time of the transaction
         */
        unlockTime: BigInteger.BigInteger;
    }
    interface IBlockDetails {
        /**
         * The number of already generated coins in the blockchain (aka. circulation)
         */
        alreadyGeneratedCoins: BigInteger.BigInteger;
        /**
         * The number of generated transactions in the blockchain
         */
        alreadyGeneratedTransactions: number;
        /**
         * The base reward for the block which does not include any transaction fees or penalty modifiers
         */
        baseReward: number;
        /**
         * The size of the block in bytes
         */
        blockSize: number;
        /**
         * How deep the block is from the tip of the blockchain. (aka. confirmations)
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
         * The zero-based index of the block
         */
        index: number;
        /**
         * The major version of the block
         */
        majorVersion: number;
        /**
         * The minor version of the block
         */
        minorVersion: number;
        /**
         * The nonce for the block
         */
        nonce: number;
        /**
         * The previous block hash included in this block
         */
        prevBlockhash: string;
        /**
         * The total reward for the block including any transaction fees and penalty modifiers
         */
        reward: number;
        /**
         * The median size of the last n blocks
         */
        sizeMedian: number;
        /**
         * The timestamp of the block
         */
        timestamp: number;
        /**
         * The total amount of transaction fees claimed in the block
         */
        totalFeeAmount: number;
        /**
         * The transactions contained in the block
         */
        transactions: ITransactionDetail[];
        /**
         * The total size of the transactions contained in the block
         */
        transactionsCumulativeSize: number;
    }
    interface IBlocksDetailedResponse {
        /**
         * an array of blocks
         */
        blocks: IBlockDetails[];
        /**
         * The current height of the blockchain
         */
        currentHeight: number;
        /**
         * The offset of the response
         */
        fullOffset: number;
        /**
         * The height at which this response starts
         */
        startHeight: number;
        /**
         * the status of the response
         */
        status: string;
    }
    interface ITransactionSummary {
        /**
         * the transaction hash
         */
        hash: string;
        /**
         * the fee of the transaction
         */
        fee: number;
        /**
         * the total amount of the outputs of the transaction
         */
        amount_out: number;
        /**
         * the size of the transaction in bytes
         */
        size: number;
    }
    interface IBlockSummary {
        /**
         * the number of generated coins in the blockchain
         */
        alreadyGeneratedCoins: BigInteger.BigInteger;
        /**
         * the number of generated transactions in the blockchain
         */
        alreadyGeneratedTransactions: number;
        /**
         * the base reward of the block without transactions fees or penalty modifiers applied
         */
        baseReward: number;
        /**
         * the size of the block in bytes
         */
        blockSize: number;
        /**
         * the number of blocks from the tip of the blockchain (aka. confirmations)
         */
        depth: number;
        /**
         * the difficulty of the block
         */
        difficulty: number;
        /**
         * the effective median size of the last n blocks in bytes
         */
        effectiveSizeMedian: number;
        /**
         * the block hash
         */
        hash: string;
        /**
         * the block height
         */
        height: number;
        /**
         * the major version of the block
         */
        major_version: number;
        /**
         * the minor version of the block
         */
        minor_version: number;
        /**
         * the block nonce
         */
        nonce: number;
        /**
         * whether the block is an orphan or not
         */
        orphan_status: boolean;
        /**
         * the penalty applied to this block
         */
        penalty: number;
        /**
         * the previous block hash included in this block
         */
        prev_hash: string;
        /**
         * the total reward for this block including transaction fees and penalty modifiers
         */
        reward: number;
        /**
         * the median size of the last n blocks in bytes
         */
        sizeMedian: number;
        /**
         * the timestamp of the block
         */
        timestamp: number;
        /**
         * the total transaction fees included in the block
         */
        totalFeeAmount: number;
        /**
         * the transactions included in the block
         */
        transactions: ITransactionSummary[];
        /**
         * the total size of the transactions included in the block in bytes
         */
        transactionsCumulativeSize: number;
    }
    interface IBlockHeader {
        /**
         * the size of the block in bytes
         */
        block_size: number;
        /**
         * the number of blocks from the tip of the blockchain (aka. confirmations)
         */
        depth: number;
        /**
         * the difficulty of the block
         */
        difficulty: number;
        /**
         * the block hash
         */
        hash: string;
        /**
         * the block height
         */
        height: number;
        /**
         * the block major version
         */
        major_version: number;
        /**
         * the block minor version
         */
        minor_version: number;
        /**
         * the block nonce
         */
        nonce: number;
        /**
         * the number of transactions included in the block
         */
        num_txes: number;
        /**
         * whether the block is orphaned or not
         */
        orphan_status: boolean;
        /**
         * the previous block hash included in this block
         */
        prev_hash: string;
        /**
         * the total reward of this block including transaction fees and penalty modifiers
         */
        reward: number;
        /**
         * the timestamp of the block
         */
        timestamp: number;
    }
    interface IBlockShortHeader {
        /**
         * the total size of the block including transactions
         */
        cumul_size: number;
        /**
         * the difficulty of the block
         */
        difficulty: number;
        /**
         * the block hash
         */
        hash: string;
        /**
         * the block height
         */
        height: number;
        /**
         * the timestamp of the block
         */
        timestamp: number;
        /**
         * the number of transactions included in the block
         */
        tx_count: number;
    }
    interface IPeersResponse {
        /**
         * list of greylisted peers
         */
        peers_gray: string[];
        /**
         * list of candidate peers
         */
        peers: string[];
        /**
         * the response status
         */
        status: string;
    }
    interface IInfoResponse {
        /**
         * the number of alternate (candidate) blocks available
         */
        alt_blocks_count: number;
        /**
         * the current difficulty the network must solve for
         */
        difficulty: number;
        /**
         * the number of peers in the daemon's greylist
         */
        grey_peerlist_size: number;
        /**
         * the current estimate of the total network hashrate
         */
        hashrate: number;
        /**
         * the height of the block the daemon is currently looking for
         */
        height: number;
        /**
         * the number of incoming connections to the daemon
         */
        incoming_connections_count: number;
        /**
         * the last known commited block index
         */
        last_known_block_index: number;
        /**
         * the major version of the block for which the network is solving for
         */
        major_version: number;
        /**
         * the minor version of the block for which the network is solving for
         */
        minor_version: number;
        /**
         * the observed network height for which the network is solving for
         */
        network_height: number;
        /**
         * the number of outgoing connections from the daemon
         */
        outgoing_connections_count: number;
        /**
         * the timestamp of when the daemon was launched
         */
        start_time: number;
        /**
         * the response status message
         */
        status: string;
        /**
         * the height that the current daemon is currently supported until
         */
        supported_height: number;
        /**
         * whether the daemon believes it is synchronized with the network or not
         */
        synced: boolean;
        /**
         * the number of transactions the daemon is aware of
         */
        tx_count: number;
        /**
         * the number of transactions in the daemon's mempool
         */
        tx_pool_size: number;
        /**
         * the network upgrade heights the daemon is aware of
         */
        upgrade_heights: number[];
        /**
         * the version of the software the daemon is currently running
         */
        version: string;
        /**
         * the number of whitelisted peers in the daemon's peerlist
         */
        white_peerlist_size: number;
    }
    interface IHeightResponse {
        /**
         * the height of the block the daemon is currently looking for
         */
        height: number;
        /**
         * the observed network height for which the network is solving for
         */
        network_height: number;
        /**
         * the response status
         */
        status: string;
    }
    interface IFeeResponse {
        /**
         * the address to send node fee donations to
         */
        address: string;
        /**
         * the requested node fee donation amount
         */
        amount: BigInteger.BigInteger;
        /**
         * the response status
         */
        status: string;
    }
    interface IBlockTemplate {
        /**
         * the hex representation of the block template
         */
        blocktemplate_blob: string;
        /**
         * the difficulty to solve for
         */
        difficulty: number;
        /**
         * the height this block template applies to
         */
        height: number;
        /**
         * the offset location (inclusive and 0-based in bytes) in the blocktemplate blob that has been zeroed for use
         */
        reserved_offset: number;
        /**
         * the response status
         */
        status: string;
    }
    interface ITransactionStatusResponse {
        /**
         * the list of transaction hashes found in blocks
         */
        transactionsInBlock: string[];
        /**
         * the list of transaction hashes found in the mempool
         */
        transactionsInPool: string[];
        /**
         * the list of transaction hashes that were not found
         */
        transactionsUnknown: string[];
    }
    interface IInputCoinbase {
        /**
         * the input type
         */
        type: string;
        value: {
            /**
             * the height for which this coinbase input was generated
             */
            height: number;
        };
    }
    interface IInputKey {
        /**
         * the input type
         */
        type: string;
        value: {
            /**
             * the input amount
             */
            amount: number;
            /**
             * the input key image
             */
            k_image: string;
            /**
             * the output offsets used within this input ring signature
             */
            key_offsets: number[];
        };
    }
    interface IOutputKey {
        /**
         * the output amount
         */
        amount: number;
        target: {
            data: {
                /**
                 * the one-time output key of the output
                 */
                key: string;
            };
            /**
             * the output type
             */
            type: string;
        };
    }
    interface ITransactionPrefix {
        /**
         * the extra data included in the transaction
         */
        extra: string;
        /**
         * the unlock time of the transaction
         */
        unlock_time: BigInteger.BigInteger;
        /**
         * the transaction version number
         */
        version: number;
        /**
         * the transaction inputs
         */
        vin: IInputCoinbase[] | IInputKey[];
        /**
         * the transaction outputs
         */
        vout: IOutputKey[];
    }
    interface IBlockLiteTransaction {
        /**
         * the transaction hash
         */
        hash: string;
        /**
         * the transaction prefix
         */
        prefix: ITransactionPrefix;
    }
    interface IBlockLite {
        /**
         * the hexrepsentation of the block
         */
        block: string;
        /**
         * the block hash
         */
        hash: string;
        /**
         * the transactions included in the block
         */
        transactions: IBlockLiteTransaction[];
    }
    interface IBlockLiteResponse {
        /**
         * the current height of the daemon
         */
        currentHeight: number;
        /**
         * the offset of the response
         */
        fullOffset: number;
        /**
         * the blocks
         */
        items: IBlockLite[];
        /**
         * the starting height of the blocks included in this response
         */
        startHeight: number;
        /**
         * the response status
         */
        status: string;
    }
    interface ISendRawTransactionResponse {
        /**
         * the response status
         */
        status: string;
        /**
         * the response error message (if any)
         */
        error?: string;
    }
    interface ITransactionMeta {
        /**
         * the total amount of the transaction outputs
         */
        amount_out: number;
        /**
         * the transaction fee
         */
        fee: number;
        /**
         * the transaction hash
         */
        hash: string;
        /**
         * the number of ring signature participants used in the input ring signatures
         */
        mixin: number;
        /**
         * the payment ID of the transaction
         */
        paymentId: string;
        /**
         * the size of the transaction in bytes
         */
        size: number;
    }
    interface ITransactionResponse {
        /**
         * the block short header
         */
        block: IBlockShortHeader;
        /**
         * the response status
         */
        status: string;
        /**
         * the transaction prefix
         */
        tx: ITransactionPrefix;
        /**
         * the transaction details
         */
        txDetails: ITransactionMeta;
    }
    interface IGlobalIndexesResponse {
        /**
         * the transaction hash/key
         */
        key: string;
        /**
         * the global output indexes in the transaction
         */
        value: number[];
    }
    interface IPoolChangesAdded {
        /**
         * the transaction hash
         */
        hash: string;
        /**
         * the transaction prefix
         */
        prefix: ITransactionPrefix;
    }
    interface IPoolChanges {
        /**
         * the transactions added to the mempool since the last ask
         */
        addedTxs: IPoolChangesAdded[];
        /**
         * an array of transaction hashes that have been deleted from the mempool
         */
        deletedTxsIds: string[];
        /**
         * whether the block hash supplied is the top of the blockchain or not
         */
        isTailBlockActual: boolean;
        /**
         * the response status
         */
        status: string;
    }
    interface IWalletSyncDataTransactionOutput {
        /**
         * the output amount
         */
        amount: number;
        /**
         * the one-time output key
         */
        key: string;
    }
    interface IWalletSyncDataTransaction {
        /**
         * the transaction hash
         */
        hash: string;
        /**
         * the public key of the transaction
         */
        txPublicKey: string;
        /**
         * the unlock time of the transaction
         */
        unlockTime: BigInteger.BigInteger;
        /**
         * the transaction inputs
         */
        inputs?: ITransactionDetailInputKeyInput[];
        /**
         * the transaction outputs
         */
        outputs: IWalletSyncDataTransactionOutput[];
    }
    interface IWalletSyncDataBlock {
        /**
         * the block hash
         */
        blockHash: string;
        /**
         * the block height
         */
        blockHeight: number;
        /**
         * the block timestamp
         */
        blockTimestamp: number;
        /**
         * the coinbase transaction
         */
        coinbaseTX?: IWalletSyncDataTransaction;
        /**
         * the transactions contained within the block
         */
        transactions: IWalletSyncDataTransaction[];
    }
    interface IWalletSyncData {
        /**
         * the blocks
         */
        items: IWalletSyncDataBlock[];
        /**
         * the response status
         */
        status: string;
        /**
         * whether the information we supplied indicates that we are currently synchronized with the top
         * of the blockchain
         */
        synced: boolean;
        topBlock?: {
            /**
             * the top block hash
             */
            hash: string;
            /**
             * the top block height
             */
            height: number;
        };
    }
    interface IRawBlock {
        /**
         * the hex representation fo the block
         */
        block: string;
        /**
         * an array of hex representations of the transactions included in the block
         */
        transactions: string[];
    }
    interface IRawBlocksResponse {
        /**
         * the raw blocks
         */
        items: IRawBlock[];
        /**
         * whether the information we supplied indicates that we are currently synchronized with the top
         * of the blockchain
         */
        synced: boolean;
        /**
         * the response status
         */
        status: string;
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
        };
    }
    interface IRandomOutput {
        /**
         * the output global index value
         */
        global_amount_index: number;
        /**
         * the output one-time key
         */
        out_key: string;
    }
    interface IRandomOuts {
        /**
         * the amount of the random output
         */
        amount: number;
        /**
         * the random outputs data
         */
        outs: IRandomOutput[];
    }
    interface IRandomOutputsResponse {
        /**
         * the random outputs matrices
         */
        outs: IRandomOuts[];
        /**
         * the response status
         */
        status: string;
    }
    /**
     * Defines the necessary methods that must be implemented by a Legacy TurtleCoind interface
     */
    abstract class ILegacyTurtleCoind {
        abstract block(hash: string): Promise<IBlockSummary>;
        abstract blockCount(): Promise<number>;
        abstract blockHeaderByHash(hash: string): Promise<IBlockHeader>;
        abstract blockHeaderByHeight(height: number): Promise<IBlockHeader>;
        abstract blocksDetailed(timestamp: number, blockHashes: string[], blockCount: number): Promise<IBlocksDetailedResponse>;
        abstract blockShortHeaders(height: number): Promise<IBlockShortHeader[]>;
        abstract blocksLite(blockHashes: string[], timestamp: number): Promise<IBlockLiteResponse>;
        abstract blockTemplate(walletAddress: string, reserveSize: number): Promise<IBlockTemplate>;
        abstract fee(): Promise<IFeeResponse>;
        abstract globalIndexes(transactionHash: string): Promise<number[]>;
        abstract globalIndexesForRange(startHeight: number, endHeight: number): Promise<IGlobalIndexesResponse[]>;
        abstract height(): Promise<IHeightResponse>;
        abstract info(): Promise<IInfoResponse>;
        abstract lastBlockHeader(): Promise<IBlockHeader>;
        abstract peers(): Promise<IPeersResponse>;
        abstract poolChanges(tailBlockHash: string, knownTransactionHashes: string[]): Promise<IPoolChanges>;
        abstract randomOutputs(amounts: number[], mixin: number): Promise<IRandomOutputsResponse>;
        abstract rawBlocks(startHeight: number, startTimestamp: number, blockHashCheckpoints: string[], skipCoinbaseTransactions: boolean, blockCount: number): Promise<IRawBlocksResponse>;
        abstract sendRawTransaction(transaction: string): Promise<ISendRawTransactionResponse>;
        abstract submitBlock(blockBlob: string): Promise<string>;
        abstract transaction(hash: string): Promise<ITransactionResponse>;
        abstract transactionPool(): Promise<ITransactionSummary[]>;
        abstract transactionStatus(transactionHashes: string[]): Promise<ITransactionStatusResponse>;
        abstract walletSyncData(startHeight: number, startTimestamp: number, blockHashCheckpoints: string[], skipCoinbaseTransactions: boolean, blockCount: number): Promise<IWalletSyncData>;
    }
}
