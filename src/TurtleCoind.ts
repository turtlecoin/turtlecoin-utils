// Copyright (c) 2018-2020, Brandon Lehmann, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import * as BigInteger from 'big-integer';
import { HTTPClient } from './Helpers/HTTPClient';
import { TurtleCoindTypes } from './Types/TurtleCoind';

/**
 * A class interface that allows for easy interaction with TurtleCoind
 */
export class TurtleCoind extends HTTPClient implements TurtleCoindTypes.ITurtleCoind {
    /**
     * Retrieves the node fee information
     */
    public async fee (): Promise<TurtleCoindTypes.IFee> {
        const response = await this.get('fee');

        response.amount = BigInteger(response.amount);

        return response;
    }

    /**
     * Retrieves the node height information
     */
    public async height (): Promise<TurtleCoindTypes.IHeight> {
        return this.get('height');
    }

    /**
     * Retrieves the node information
     */
    public async info (): Promise<TurtleCoindTypes.IInfo> {
        const response = await this.get('info');

        response.startTime = new Date((response.startTime || response.start_time) * 1000);

        const parse = (elem: string): TurtleCoindTypes.IVersion => {
            const [major, minor, patch] = elem.split('.')
                .map(elem => parseInt(elem, 10));

            return { major, minor, patch };
        };

        response.version = parse(response.version);

        return response;
    }

    /**
     * Retrieves the node peer information
     */
    public async peers (): Promise<TurtleCoindTypes.IPeers> {
        const response = await this.get('peers');

        const parse = (elem: string): { host: string, port: number } => {
            const [host, port] = elem.split(':');

            return { host, port: parseInt(port, 10) };
        };

        response.greyPeers = response.greyPeers.map((elem: string) => parse(elem));

        response.peers = response.peers.map((elem: string) => parse(elem));

        return response;
    }

    /**
     * Retrieves the number of blocks the node has in its chain
     */
    public async blockCount (): Promise<number> {
        return this.get('block/count');
    }

    /**
     * Retrieves the block information for the specified block
     * Requires the daemon to have the explorer enabled
     * @param block the block height or hash
     */
    public async block (block: string | number): Promise<TurtleCoindTypes.IBlock> {
        const response = await this.get('block/' + block);

        response.alreadyGeneratedCoins = BigInteger(response.alreadyGeneratedCoins);

        response.timestamp = new Date(response.timestamp * 1000);

        return response;
    }

    /**
     * Retrieves the block information for the last block available
     */
    public async lastBlock (): Promise<TurtleCoindTypes.IBlock> {
        const response = await this.get('block/last');

        response.alreadyGeneratedCoins = BigInteger(response.alreadyGeneratedCoins);

        response.timestamp = new Date(response.timestamp * 1000);

        return response;
    }

    /**
     * Retrieves the block information for the last 30 blocks up to the current height
     * Requires the daemon to have the explorer enabled
     * @param height the height to stop at
     */
    public async blockHeaders (height: number): Promise<TurtleCoindTypes.IBlock[]> {
        const response: any[] = await this.get('block/headers/' + height);

        for (const item of response) {
            item.alreadyGeneratedCoins = BigInteger(item.alreadyGeneratedCoins);

            item.timestamp = new Date(item.timestamp * 1000);
        }

        return response;
    }

    /**
     * Retrieves the RawBlock information from the node for the specified block
     * Requires the daemon to have the explorer enabled
     * @param block the block height or hash
     */
    public async rawBlock (block: string | number): Promise<TurtleCoindTypes.IRawBlock> {
        return this.get('block/' + block + '/raw');
    }

    /**
     * Retrieves a mining block template using the specified address and reserve size
     * @param address the wallet address that will receive the coinbase outputs
     * @param reserveSize the amount of data to reserve in the miner transaction
     */
    public async blockTemplate (
        address: string,
        reserveSize = 6
    ): Promise<TurtleCoindTypes.IBlockTemplate> {
        return this.post('block/template', { address, reserveSize });
    }

    /**
     * Submits a block to the node for processing
     * @param block the hex representation of the block
     */
    public async submitBlock (block: string): Promise<string> {
        return this.post('block', block);
    }

    /**
     * Submits a transaction to the node for processing
     * @param transaction the hex representation of the transaction
     */
    public async submitTransaction (transaction: string): Promise<string> {
        return this.post('transaction', transaction);
    }

    /**
     * Retrieves the transaction information for the specified transaction
     * Requires the daemon to have the explorer enabled
     * @param hash the transaction hash
     */
    public async transaction (hash: string): Promise<TurtleCoindTypes.ITransaction> {
        const response = await this.get('transaction/' + hash);

        response.block.alreadyGeneratedCoins = BigInteger(response.block.alreadyGeneratedCoins);

        response.block.timestamp = new Date(response.block.timestamp * 1000);

        response.prefix.unlockTime = BigInteger(response.prefix.unlockTime);

        return response;
    }

    /**
     * Retrieves the RawTransaction from the node for the specified transaction
     * Requires the daemon to have the explorer enabled
     * @param hash the transaction hash
     */
    public async rawTransaction (hash: string): Promise<string> {
        return this.get('transaction/' + hash + '/raw');
    }

    /**
     * Retrieves the transaction summary information for the transactions currently
     * Requires the daemon to have the explorer enabled
     * in the memory pool
     */
    public async transactionPool (): Promise<TurtleCoindTypes.TransactionSummary[]> {
        return this.get('transaction/pool');
    }

    /**
     * Retrieves the RawTransactions currently in the memory pool
     * Requires the daemon to have the explorer enabled
     */
    public async rawTransactionPool (): Promise<string[]> {
        return this.get('transaction/pool/raw');
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
        return this.post('transaction/pool/delta', { lastKnownBlock, transactions });
    }

    /**
     * Retrieves information on where the specified transactions are located
     * @param transactions an array of transaction hashes
     */
    public async transactionsStatus (
        transactions: string[]
    ): Promise<TurtleCoindTypes.ITransactionsStatus> {
        return this.post('transaction/status', transactions);
    }

    /**
     * Retrieves random global indexes typically used for mixing operations for the specified
     * amounts and for the number requested (if available)
     * @param amounts an array of amounts for which we need random global indexes
     * @param count the number of global indexes to return for each amount
     */
    public async randomIndexes (
        amounts: number[],
        count = 3
    ): Promise<TurtleCoindTypes.IRandomOutput[]> {
        return this.post('indexes/random', { amounts, count });
    }

    /**
     * Retrieves the global indexes for all transactions contained within the blocks heights specified (non-inclusive)
     * @param startHeight the starting block height
     * @param endHeight the ending block height
     */
    public async indexes (
        startHeight: number,
        endHeight: number
    ): Promise<TurtleCoindTypes.ITransactionIndexes[]> {
        return this.get('indexes/' + startHeight + '/' + endHeight)
            .then((result: TurtleCoindTypes.ITransactionIndexes[]) =>
                result.sort((a, b) => (a.hash > b.hash) ? 1 : -1));
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
        count = 100): Promise<TurtleCoindTypes.ISync> {
        const response = await this.post('sync', {
            checkpoints,
            count,
            height,
            skipCoinbaseTransactions,
            timestamp
        });

        response.blocks = response.blocks.map((block: TurtleCoindTypes.ISyncBlock) => {
            if (block.coinbaseTX) {
                block.coinbaseTX.unlockTime = BigInteger(block.coinbaseTX.unlockTime);
            }

            block.transactions = block.transactions.map(tx => {
                tx.unlockTime = BigInteger(tx.unlockTime);

                return tx;
            });

            return block;
        });

        return response;
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
        count = 100): Promise<TurtleCoindTypes.IRawSync> {
        return this.post('sync/raw', {
            checkpoints,
            count,
            height,
            skipCoinbaseTransactions,
            timestamp
        });
    }
}
