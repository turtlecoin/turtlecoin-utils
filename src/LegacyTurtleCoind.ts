// Copyright (c) 2018-2020, Brandon Lehmann, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import { HTTPClient } from './Helpers/HTTPClient';
import { LegacyTurtleCoindTypes } from './Types/LegacyTurtleCoind';
import { TurtleCoindTypes } from './Types/TurtleCoind';
import * as BigInteger from 'big-integer';
import { Block } from './Block';
import { Transaction } from './Transaction';
import { TransactionOutputs } from './Types/ITransactionOutput';
import { TransactionInputs } from './Types/ITransactionInput';

/** @ignore */
import KeyOutput = TransactionOutputs.KeyOutput;

/** @ignore */
import CoinbaseInput = TransactionInputs.CoinbaseInput;

/** @ignore */
import KeyInput = TransactionInputs.KeyInput;

/**
 * A class interface that allows for easy interaction with Legacy TurtleCoind
 * THIS OBJECT IS DEPRECATED AND SUBJECT TO REMOVAL WITH LITTLE NOTICE
 */
export class LegacyTurtleCoind extends HTTPClient implements TurtleCoindTypes.ITurtleCoind {
    /**
     * Retrieves the node fee information
     */
    public async fee (): Promise<TurtleCoindTypes.IFee> {
        const response: LegacyTurtleCoindTypes.IFeeResponse = await this.get('fee');

        return {
            address: response.address,
            amount: BigInteger(response.amount)
        };
    }

    /**
     * Retrieves the node height information
     */
    public async height (): Promise<TurtleCoindTypes.IHeight> {
        const response: LegacyTurtleCoindTypes.IHeightResponse = await this.get('height');

        return {
            height: response.height,
            networkHeight: response.network_height
        };
    }

    /**
     * Retrieves the node information
     */
    public async info (): Promise<TurtleCoindTypes.IInfo> {
        const response: LegacyTurtleCoindTypes.IInfoResponse = await this.get('info');

        const parse = (elem: string): TurtleCoindTypes.IVersion => {
            const [major, minor, patch] = elem.split('.')
                .map(elem => parseInt(elem, 10));

            return { major, minor, patch };
        };

        return {
            alternateBlockCount: response.alt_blocks_count,
            difficulty: response.difficulty,
            greyPeerlistSize: response.grey_peerlist_size,
            hashrate: response.hashrate,
            height: response.height,
            incomingConnections: response.incoming_connections_count,
            lastBlockIndex: response.last_known_block_index,
            majorVersion: response.major_version,
            minorVersion: response.minor_version,
            networkHeight: response.network_height,
            outgoingConnections: response.outgoing_connections_count,
            startTime: new Date(response.start_time),
            supportedHeight: response.supported_height,
            synced: response.synced,
            transactionsPoolSize: response.tx_pool_size,
            transactionsSize: response.tx_count,
            upgradeHeights: response.upgrade_heights,
            version: parse(response.version),
            whitePeerlistSize: response.white_peerlist_size
        };
    }

    /**
     * Retrieves the node peer information
     */
    public async peers (): Promise<TurtleCoindTypes.IPeers> {
        const response: LegacyTurtleCoindTypes.IPeersResponse = await this.get('peers');

        const parse = (elem: string): { host: string, port: number } => {
            const [host, port] = elem.split(':');

            return { host, port: parseInt(port, 10) };
        };

        return {
            greyPeers: response.peers_gray.map(peer => parse(peer)),
            peers: response.peers.map(peer => parse(peer))
        };
    }

    /**
     * Retrieves the number of blocks the node has in its chain
     */
    public async blockCount (): Promise<number> {
        const response = await this.rpcPost('getblockcount');

        return response.count;
    }

    /**
     * Retrieves the block information for the specified block
     * Requires the daemon to have the explorer enabled
     * @param block the block height or hash
     */
    public async block (block: string | number): Promise<TurtleCoindTypes.IBlock> {
        if (typeof block === 'number') {
            const header = await this._blockHeaderByHeight(block);

            block = header.hash;
        }

        const response: LegacyTurtleCoindTypes.IBlockSummary = await this.rpcPost('f_block_json', { hash: block })
            .then(response => response.block);

        const result: TurtleCoindTypes.IBlock = {
            alreadyGeneratedCoins: BigInteger(response.alreadyGeneratedCoins),
            alreadyGeneratedTransactions: response.alreadyGeneratedTransactions,
            baseReward: response.baseReward,
            depth: response.depth,
            difficulty: response.difficulty,
            hash: response.hash,
            height: response.height,
            majorVersion: response.major_version,
            minorVersion: response.minor_version,
            nonce: response.nonce,
            orphan: response.orphan_status,
            penalty: response.penalty,
            prevHash: response.prev_hash,
            reward: response.reward,
            size: response.blockSize,
            sizeMedian: response.sizeMedian,
            timestamp: new Date(response.timestamp),
            totalFeeAmount: response.totalFeeAmount,
            transactionCount: response.transactions.length,
            transactionsCumulativeSize: response.transactionsCumulativeSize,
            transactions: []
        };

        for (const tx of response.transactions) {
            result.transactions.push({
                amountOut: tx.amount_out,
                fee: tx.fee,
                hash: tx.hash,
                size: tx.size
            });
        }

        return result;
    }

    /**
     * Retrieves the block information for the last block available
     */
    public async lastBlock (): Promise<TurtleCoindTypes.IBlock> {
        const response = await this._lastBlockHeader();

        return this.block(response.hash);
    }

    /**
     * Retrieves the block information for the last 30 blocks up to the current height
     * Requires the daemon to have the explorer enabled
     * @param height the height to stop at
     */
    public async blockHeaders (height: number): Promise<TurtleCoindTypes.IBlock[]> {
        const response = await this._blockShortHeaders(height);

        const promises: Promise<TurtleCoindTypes.IBlock>[] = response.map(block => this.block(block.hash));

        return Promise.all(promises)
            .then(results => results.sort((a, b) => (a.height > b.height) ? 1 : -1));
    }

    /**
     * Retrieves the RawBlock information from the node for the specified block
     * Requires the daemon to have the explorer enabled
     * @param block the block height or hash
     */
    public async rawBlock (block: string | number): Promise<TurtleCoindTypes.IRawBlock> {
        let header: LegacyTurtleCoindTypes.IBlockHeader;

        try {
            if (typeof block === 'number') {
                header = await this._blockHeaderByHeight(block);
            } else {
                header = await this._blockHeaderByHash(block);
            }
        } catch (e) {
            throw new ReferenceError('Block not found');
        }

        const rawBlocks = await this.rawSync(undefined, header.height, undefined, undefined, 1);

        if (rawBlocks.blocks.length !== 1) {
            throw new ReferenceError('Block not found');
        }

        return rawBlocks.blocks[0];
    }

    /**
     * Retrieves a mining block template using the specified address and reserve size
     * @param address the wallet address that will receive the coinbase outputs
     * @param reserveSize the amount of data to reserve in the miner transaction
     */
    public async blockTemplate (
        address: string,
        reserveSize = 8
    ): Promise<TurtleCoindTypes.IBlockTemplate> {
        const response: LegacyTurtleCoindTypes.IBlockTemplate = await this.rpcPost(
            'getblocktemplate', { reserve_size: reserveSize, wallet_address: address });

        return {
            blob: response.blocktemplate_blob,
            difficulty: response.difficulty,
            height: response.height,
            reservedOffset: response.reserved_offset
        };
    }

    /**
     * Submits a block to the node for processing
     * @param block the hex representation of the block
     */
    public async submitBlock (block: string): Promise<string> {
        const response = await this.rpcPost('submitblock', [block]);

        if (response.status.toLowerCase() !== 'ok') {
            throw new Error(response.error);
        }

        const l_block = await Block.from(block);

        return l_block.hash();
    }

    /**
     * Submits a transaction to the node for processing
     * @param transaction the hex representation of the transaction
     */
    public async submitTransaction (transaction: string): Promise<string> {
        const response = await this._sendRawTransaction(transaction);

        if (response.status.toLowerCase() !== 'ok') {
            throw new Error(response.error);
        }

        const tx = await Transaction.from(transaction);

        return tx.hash();
    }

    /**
     * Retrieves the transaction information for the specified transaction
     * Requires the daemon to have the explorer enabled
     * @param hash the transaction hash
     */
    public async transaction (hash: string): Promise<TurtleCoindTypes.ITransaction> {
        const response = await this._transaction(hash);

        const toOutput = (output: LegacyTurtleCoindTypes.IOutputKey): TurtleCoindTypes.ITransactionOutputKey => {
            return {
                amount: output.amount,
                key: output.target.data.key,
                type: output.target.type
            };
        };

        const toCoinbaseInput =
            (input: LegacyTurtleCoindTypes.IInputCoinbase): TurtleCoindTypes.ITransactionInputCoinbase => {
                return {
                    height: input.value.height,
                    type: input.type
                };
            };

        const toKeyInput =
            (input: LegacyTurtleCoindTypes.IInputKey): TurtleCoindTypes.ITransactionInputKey => {
                return {
                    amount: input.value.amount,
                    keyImage: input.value.k_image,
                    offsets: input.value.key_offsets,
                    type: input.type
                };
            };

        let coinbase = false;

        const inputs = [];
        for (const input of response.tx.vin) {
            switch (input.type) {
                case 'ff':
                    coinbase = true;
                    inputs.push(toCoinbaseInput(input as LegacyTurtleCoindTypes.IInputCoinbase));
                    break;
                case '02':
                    inputs.push(toKeyInput(input as LegacyTurtleCoindTypes.IInputKey));
                    break;
            }
        }

        const tx = new Transaction();

        await tx.parseExtra(Buffer.from(response.tx.extra, 'hex'));

        tx.readonly = false;

        if (!tx.publicKey) {
            const syncData = await this.rawSync(undefined, response.block.height, undefined, undefined, 1);

            for (const rawBlock of syncData.blocks) {
                const block = await Block.from(rawBlock.blob);

                if (await block.minerTransaction.hash() === response.txDetails.hash) {
                    if (block.minerTransaction.publicKey) {
                        await tx.addPublicKey(block.minerTransaction.publicKey);

                        break;
                    }
                }

                for (const rawTx of rawBlock.transactions) {
                    const txn = await Transaction.from(rawTx);

                    if (await txn.hash() === response.txDetails.hash) {
                        if (txn.publicKey) {
                            await tx.addPublicKey(txn.publicKey);
                        }
                    }
                }
            }
        }

        return {
            block: await this.block(response.block.hash),
            prefix: {
                extra: response.tx.extra,
                inputs: (coinbase)
                    ? inputs as TurtleCoindTypes.ITransactionInputCoinbase[]
                    : inputs as TurtleCoindTypes.ITransactionInputKey[],
                outputs: response.tx.vout.map(output => toOutput(output)),
                unlockTime: response.tx.unlock_time,
                version: response.tx.version
            },
            meta: {
                amountOut: response.txDetails.amount_out,
                fee: response.txDetails.fee,
                paymentId: response.txDetails.paymentId,
                publicKey: tx.publicKey || '',
                ringSize: response.txDetails.mixin,
                size: response.txDetails.size
            }
        };
    }

    /**
     * Retrieves the RawTransaction from the node for the specified transaction
     * Requires the daemon to have the explorer enabled
     * @param hash the transaction hash
     */
    public async rawTransaction (hash: string): Promise<string> {
        try {
            const header = await this.transaction(hash);

            const block = await this.rawBlock(header.block.hash);

            const b = await Block.from(block.blob);

            if (await b.minerTransaction.hash() === hash) {
                return b.minerTransaction.toString();
            }

            for (const rawTx of block.transactions) {
                const tx = await Transaction.from(rawTx);

                if (await tx.hash() === hash) {
                    return rawTx;
                }
            }
        } catch (e) {}

        throw new ReferenceError('Transaction not found');
    }

    /**
     * Retrieves the transaction summary information for the transactions currently
     * Requires the daemon to have the explorer enabled
     * in the memory pool
     */
    public async transactionPool (): Promise<TurtleCoindTypes.TransactionSummary[]> {
        const response = await this._transactionPool();

        return response.map(tx => {
            return {
                amountOut: tx.amount_out,
                fee: tx.fee,
                hash: tx.hash,
                size: tx.size
            };
        });
    }

    /**
     * Retrieves the RawTransactions currently in the memory pool
     * Requires the daemon to have the explorer enabled
     */
    public async rawTransactionPool (): Promise<string[]> {
        throw new Error('Method not available');
    }

    /**
     * Gets the transaction memory pool changes given the last known block hash and
     * the transactions we last knew to be in the memory pool
     * @param lastKnownBlock the last known block hash
     * @param transactions an array of transaction hashes we last saw in the memory pool
     */
    public async transactionPoolChanges (
        lastKnownBlock: string,
        transactions: string[] = []
    ): Promise<TurtleCoindTypes.ITransactionPoolDelta> {
        const response = await this._poolChanges(lastKnownBlock, transactions);

        const result: TurtleCoindTypes.ITransactionPoolDelta = {
            added: [],
            deleted: response.deletedTxsIds,
            synced: response.isTailBlockActual
        };

        for (const added of response.addedTxs) {
            const tx = new Transaction();

            tx.version = added.prefix.version;

            tx.unlockTime = added.prefix.unlock_time;

            await tx.parseExtra(Buffer.from(added.prefix.extra, 'hex'));

            const addCoinbase = (input: LegacyTurtleCoindTypes.IInputCoinbase) =>
                tx.inputs.push(new CoinbaseInput(input.value.height));

            const addKeyInput = (input: LegacyTurtleCoindTypes.IInputKey) =>
                tx.inputs.push(new KeyInput(input.value.amount, input.value.key_offsets, input.value.k_image));

            for (const input of added.prefix.vin) {
                switch (input.type) {
                    case 'ff':
                        addCoinbase(input as LegacyTurtleCoindTypes.IInputCoinbase);
                        break;
                    case '02':
                        addKeyInput(input as LegacyTurtleCoindTypes.IInputKey);
                        break;
                }
            }

            for (const output of added.prefix.vout) {
                const o = new KeyOutput(output.amount, output.target.data.key);

                tx.outputs.push(o);
            }

            result.added.push(await tx.toString());
        }

        return result;
    }

    /**
     * Retrieves information on where the specified transactions are located
     * @param transactions an array of transaction hashes
     */
    public async transactionsStatus (transactions: string[]): Promise<TurtleCoindTypes.ITransactionsStatus> {
        const response = await this._transactionStatus(transactions);

        return {
            inBlock: response.transactionsInBlock,
            inPool: response.transactionsInPool,
            notFound: response.transactionsUnknown
        };
    }

    /**
     * Retrieves random global indexes typically used for mixing operations for the specified
     * amounts and for the number requested (if available)
     * @param amounts an array of amounts for which we need random global indexes
     * @param count the number of global indexes to return for each amount
     */
    public async randomIndexes (amounts: number[], count: number): Promise<TurtleCoindTypes.IRandomOutput[]> {
        const response = await this._randomOutputs(amounts, count);

        const results: TurtleCoindTypes.IRandomOutput[] = [];

        for (const out of response.outs) {
            results.push({
                amount: out.amount,
                outputs: out.outs.map(o => {
                    return {
                        index: o.global_amount_index,
                        key: o.out_key
                    };
                })
            });
        }

        return results;
    }

    /**
     * Retrieves the global indexes for all transactions contained within the blocks heights specified (non-inclusive)
     * @param startHeight the starting block height
     * @param endHeight the ending block height
     */
    public async indexes (startHeight: number, endHeight: number): Promise<TurtleCoindTypes.ITransactionIndexes[]> {
        // we +1 the endHeight here because daemon version < 1.0.0 is not inclusive of the end
        const response = await this._globalIndexesForRange(startHeight, endHeight + 1);

        const results: TurtleCoindTypes.ITransactionIndexes[] = [];

        for (const tx of response) {
            results.push({
                hash: tx.key,
                indexes: tx.value
            });
        }

        return results.sort((a, b) => (a.hash > b.hash) ? 1 : -1);
    }

    /**
     * Retrieves the information necessary for syncing a wallet (or other utility) against the node
     * @param checkpoints a list of block hashes that we know about in descending height order
     * @param height the height to start syncing from
     * @param timestamp the timestamp to start syncing from
     * @param skipCoinbaseTransactions whether we should skip blocks that only include coinbase transactions
     * @param count the number of blocks to return
     */
    public async sync (
        checkpoints: string[] = [],
        height = 0,
        timestamp = 0,
        skipCoinbaseTransactions = false,
        count = 100
    ): Promise<TurtleCoindTypes.ISync> {
        const response = await this._walletSyncData(height, timestamp, checkpoints, skipCoinbaseTransactions, count);

        const result: TurtleCoindTypes.ISync = {
            blocks: [],
            synced: response.synced
        };

        for (const block of response.items) {
            const b: TurtleCoindTypes.ISyncBlock = {
                hash: block.blockHash,
                height: block.blockHeight,
                timestamp: new Date(block.blockTimestamp),
                transactions: []
            };

            if (block.coinbaseTX) {
                b.coinbaseTX = {
                    hash: block.coinbaseTX.hash,
                    outputs: block.coinbaseTX.outputs,
                    publicKey: block.coinbaseTX.txPublicKey,
                    unlockTime: block.coinbaseTX.unlockTime
                };
            }

            for (const tx of block.transactions) {
                const header = await this.transaction(tx.hash);

                b.transactions.push({
                    hash: tx.hash,
                    inputs: (tx.inputs)
                        ? tx.inputs.map(input => {
                            return {
                                amount: input.amount,
                                keyImage: input.k_image
                            };
                        })
                        : [],
                    outputs: tx.outputs,
                    paymentId: header.meta.paymentId,
                    publicKey: tx.txPublicKey,
                    unlockTime: tx.unlockTime
                });
            }

            result.blocks.push(b);
        }

        if (response.topBlock) {
            result.topBlock = response.topBlock;
        }

        return result;
    }

    /**
     * Retrieves the RawBlocks & RawTransactions for syncing a wallet (or other utility) against the node
     * @param checkpoints a list of block hashes that we know about in descending height order
     * @param height the height to start syncing from
     * @param timestamp the timestamp to start syncing from
     * @param skipCoinbaseTransactions whether we should skip blocks that only include coinbase transactions
     * @param count the number of blocks to return
     */
    public async rawSync (
        checkpoints: string[] = [],
        height = 0,
        timestamp = 0,
        skipCoinbaseTransactions = false,
        count = 100
    ): Promise<TurtleCoindTypes.IRawSync> {
        const response = await this._rawBlocks(height, timestamp, checkpoints, skipCoinbaseTransactions, count);

        const toRawBlock = (rawBlock: LegacyTurtleCoindTypes.IRawBlock): TurtleCoindTypes.IRawBlock => {
            return {
                blob: rawBlock.block,
                transactions: rawBlock.transactions
            };
        };

        const result: TurtleCoindTypes.IRawSync = {
            blocks: response.items.map(block => toRawBlock(block)),
            synced: response.synced
        };

        if (response.topBlock) {
            result.topBlock = response.topBlock;
        }

        return result;
    }

    /**
     * OLD LEGACY METHODS BELOW THIS MARK, SHOULD ALL BE PRIVATE
     * THEY ONLY STILL EXIST HERE AS THEY USE THE OLD TYPES AND
     * THUS MAKE IT EASIER TO TRANSFORM THE DATA TO THE NEW TYPES
     */

    /**
     * Retrieves the last block header information
     */
    private async _lastBlockHeader (): Promise<LegacyTurtleCoindTypes.IBlockHeader> {
        const response = await this.rpcPost('getlastblockheader');

        return response.block_header;
    }

    /**
     * Retrieves the block header information by hash
     * @param hash the hash of the block to retrieve the header for
     */
    private async _blockHeaderByHash (hash: string): Promise<LegacyTurtleCoindTypes.IBlockHeader> {
        const response = await this.rpcPost('getblockheaderbyhash', { hash });

        return response.block_header;
    }

    /**
     * Retrieves the block header by the height
     * @param height the height of the block to retrieve the header for
     */
    private async _blockHeaderByHeight (height: number): Promise<LegacyTurtleCoindTypes.IBlockHeader> {
        const response = await this.rpcPost('getblockheaderbyheight', { height });

        return response.block_header;
    }

    /**
     * Retrieves abbreviated block information for the last 31 blocks before the specified height (inclusive)
     * @param height the height of the block to retrieve
     */
    private async _blockShortHeaders (height: number): Promise<LegacyTurtleCoindTypes.IBlockShortHeader[]> {
        const response = await this.rpcPost('f_blocks_list_json', { height });

        return response.blocks;
    }

    /**
     * Retrieves the global indexes for any transactions in the range [startHeight .. endHeight]. Generally, you
     * only want the global index for a specific transaction, however, this reveals that you probably are the
     * recipient of this transaction. By supplying a range of blocks, you can obfusticate which transaction
     * you are enquiring about.
     * @param startHeight the height to begin returning indices from
     * @param endHeight the height to end returning indices from
     */
    private async _globalIndexesForRange (
        startHeight: number,
        endHeight: number
    ): Promise<LegacyTurtleCoindTypes.IGlobalIndexesResponse[]> {
        const response = await this.post('get_global_indexes_for_range', { startHeight, endHeight });

        if (!response.status || !response.indexes) { throw new Error('Missing indexes or status key'); }
        if (response.status.toLowerCase() !== 'ok') { throw new Error('Status is not OK'); }

        return response.indexes;
    }

    /**
     * Retrieves updates regarding the transaction mempool
     * @param tailBlockHash the last block hash that we know about
     * @param knownTransactionHashes an array of the transaction hashes we last knew were in the mempool
     */
    private async _poolChanges (
        tailBlockHash: string,
        knownTransactionHashes: string[] = []
    ): Promise<LegacyTurtleCoindTypes.IPoolChanges> {
        const body: any = {
            tailBlockId: tailBlockHash
        };

        if (knownTransactionHashes) body.knownTxsIds = knownTransactionHashes;

        const response = await this.post('get_pool_changes_lite', body);

        const tmp: LegacyTurtleCoindTypes.IBlockLiteTransaction[] = [];

        for (const tx of response.addedTxs) {
            tmp.push({
                hash: tx['transactionPrefixInfo.txHash'],
                prefix: tx['transactionPrefixInfo.txPrefix']
            });
        }

        for (const tx of tmp) {
            tx.prefix.unlock_time = BigInteger(tx.prefix.unlock_time);
        }

        response.addedTxs = tmp;

        return response;
    }

    /**
     * Retrieves random outputs from the chain for mixing purposes during the creation of a new transaction
     * @param amounts an array of the amounts for which we need random outputs
     * @param mixin the number of random outputs we need for each amount specified
     */
    private async _randomOutputs (
        amounts: number[],
        mixin = 1
    ): Promise<LegacyTurtleCoindTypes.IRandomOutputsResponse> {
        return this.post('getrandom_outs', {
            amounts: amounts,
            outs_count: mixin
        });
    }

    /**
     * Retrieves the raw hex representation of each block and the transactions in the blocks versus returning
     * JSON or other encoded versions of the same.
     *
     * Retrieves up to 100 blocks. If block hash checkpoints are given, it will return beginning from the height of
     * the first hash it finds, plus one. However, if startHeight or startTimestamp is given, and this value is
     * higher than the block hash checkpoints, it will start returning from that height instead. The block hash
     * checkpoints should be given with the highest block height hashes first.
     * Typical usage: specify a start height/timestamp initially, and from then on, also provide the returned
     * block hashes.
     * @param startHeight the height to start returning blocks from
     * @param startTimestamp the timestamp to start returning blocks from
     * @param blockHashCheckpoints the block hash checkpoints
     * @param skipCoinbaseTransactions whether to skip returning blocks with only coinbase transactions
     * @param blockCount the number of blocks to retrieve
     */
    private async _rawBlocks (
        startHeight = 0,
        startTimestamp = 0,
        blockHashCheckpoints: string[] = [],
        skipCoinbaseTransactions = false,
        blockCount = 100
    ): Promise<LegacyTurtleCoindTypes.IRawBlocksResponse> {
        return this.post('getrawblocks', {
            startHeight: startHeight,
            startTimestamp: startTimestamp,
            blockHashCheckpoints: blockHashCheckpoints,
            skipCoinbaseTransactions: skipCoinbaseTransactions,
            blockCount: blockCount
        });
    }

    /**
     * Submits a raw transaction to the daemon for processing relaying to the network
     * @param transaction the hex representation of the transaction
     */
    private async _sendRawTransaction (
        transaction: string
    ): Promise<LegacyTurtleCoindTypes.ISendRawTransactionResponse> {
        return this.post('sendrawtransaction', { tx_as_hex: transaction });
    }

    /**
     * Retrieves a single transaction's information
     * @param hash the hash of the transaction to retrieve
     */
    private async _transaction (hash: string): Promise<LegacyTurtleCoindTypes.ITransactionResponse> {
        const response = await this.rpcPost('f_transaction_json', { hash });

        if (response.tx && response.tx['']) { delete response.tx['']; }

        response.tx.unlock_time = BigInteger(response.tx.unlock_time);

        return response;
    }

    /**
     * Retrieves summary information of the transactions currently in the mempool
     */
    private async _transactionPool (): Promise<LegacyTurtleCoindTypes.ITransactionSummary[]> {
        const response = await this.rpcPost('f_on_transactions_pool_json');

        return response.transactions;
    }

    /**
     * Retrieves the status of the transaction hashes provided
     * @param transactionHashes an array of transaction hashes to check
     */
    private async _transactionStatus (
        transactionHashes: string[]
    ): Promise<LegacyTurtleCoindTypes.ITransactionStatusResponse> {
        const response = await this.post('get_transactions_status', { transactionHashes });

        if (!response.status ||
            !response.transactionsInPool ||
            !response.transactionsInBlock ||
            !response.transactionsUnknown) { throw new Error('Missing status of transactions key'); }

        if (response.status.toLowerCase() !== 'ok') { throw new Error('Status is not ok'); }

        return {
            transactionsInPool: response.transactionsInPool,
            transactionsInBlock: response.transactionsInBlock,
            transactionsUnknown: response.transactionsUnknown
        };
    }

    /**
     * The only the data necessary for wallet syncing purposes
     *
     * Retrieves up to 100 blocks. If block hash checkpoints are given, it will return beginning from the height of
     * the first hash it finds, plus one. However, if startHeight or startTimestamp is given, and this value is
     * higher than the block hash checkpoints, it will start returning from that height instead. The block hash
     * checkpoints should be given with the highest block height hashes first.
     * Typical usage: specify a start height/timestamp initially, and from then on, also provide the returned
     * block hashes.
     * @param startHeight the height to start returning blocks from
     * @param startTimestamp the timestamp to start returning blocks from
     * @param blockHashCheckpoints the block hash checkpoints
     * @param skipCoinbaseTransactions whether to skip returning blocks with only coinbase transactions
     * @param blockCount the number of blocks to request
     */
    private async _walletSyncData (
        startHeight = 0,
        startTimestamp = 0,
        blockHashCheckpoints: string[] = [],
        skipCoinbaseTransactions = false,
        blockCount = 100
    ): Promise<LegacyTurtleCoindTypes.IWalletSyncData> {
        const response = await this.post('getwalletsyncdata', {
            startHeight: startHeight,
            startTimestamp: startTimestamp,
            blockHashCheckpoints: blockHashCheckpoints,
            skipCoinbaseTransactions: skipCoinbaseTransactions,
            blockCount: blockCount
        });

        if (!response.status || !response.items) throw new Error('Missing items or status key');
        if (response.status.toLowerCase() !== 'ok') throw new Error('Status is not OK');

        for (const block of response.items) {
            block.coinbaseTX.unlockTime = BigInteger(block.coinbaseTX.unlockTime);

            for (const txn of block.transactions) {
                txn.unlockTime = BigInteger(txn.unlockTime);
            }
        }

        return response;
    }
}
