"use strict";
// Copyright (c) 2018-2020, Brandon Lehmann, The TurtleCoin Developers
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
exports.TurtleCoind = void 0;
const BigInteger = require("big-integer");
const HTTPClient_1 = require("./Helpers/HTTPClient");
/**
 * A class interface that allows for easy interaction with TurtleCoind
 */
class TurtleCoind extends HTTPClient_1.HTTPClient {
    /**
     * Retrieves the node fee information
     */
    fee() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.get('fee');
            response.amount = BigInteger(response.amount);
            return response;
        });
    }
    /**
     * Retrieves the node height information
     */
    height() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.get('height');
        });
    }
    /**
     * Retrieves the node information
     */
    info() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.get('info');
            response.startTime = new Date((response.startTime || response.start_time) * 1000);
            const parse = (elem) => {
                const [major, minor, patch] = elem.split('.')
                    .map(elem => parseInt(elem, 10));
                return { major, minor, patch };
            };
            response.version = parse(response.version);
            return response;
        });
    }
    /**
     * Retrieves the node peer information
     */
    peers() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.get('peers');
            const parse = (elem) => {
                const [host, port] = elem.split(':');
                return { host, port: parseInt(port, 10) };
            };
            response.greyPeers = response.greyPeers.map((elem) => parse(elem));
            response.peers = response.peers.map((elem) => parse(elem));
            return response;
        });
    }
    /**
     * Retrieves the number of blocks the node has in its chain
     */
    blockCount() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.get('block/count');
        });
    }
    /**
     * Retrieves the block information for the specified block
     * Requires the daemon to have the explorer enabled
     * @param block the block height or hash
     */
    block(block) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.get('block/' + block);
            response.alreadyGeneratedCoins = BigInteger(response.alreadyGeneratedCoins);
            response.timestamp = new Date(response.timestamp * 1000);
            return response;
        });
    }
    /**
     * Retrieves the block information for the last block available
     */
    lastBlock() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.get('block/last');
            response.alreadyGeneratedCoins = BigInteger(response.alreadyGeneratedCoins);
            response.timestamp = new Date(response.timestamp * 1000);
            return response;
        });
    }
    /**
     * Retrieves the block information for the last 30 blocks up to the current height
     * Requires the daemon to have the explorer enabled
     * @param height the height to stop at
     */
    blockHeaders(height) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.get('block/headers/' + height);
            for (const item of response) {
                item.alreadyGeneratedCoins = BigInteger(item.alreadyGeneratedCoins);
                item.timestamp = new Date(item.timestamp * 1000);
            }
            return response;
        });
    }
    /**
     * Retrieves the RawBlock information from the node for the specified block
     * Requires the daemon to have the explorer enabled
     * @param block the block height or hash
     */
    rawBlock(block) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.get('block/' + block + '/raw');
        });
    }
    /**
     * Retrieves a mining block template using the specified address and reserve size
     * @param address the wallet address that will receive the coinbase outputs
     * @param reserveSize the amount of data to reserve in the miner transaction
     */
    blockTemplate(address, reserveSize = 6) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post('block/template', { address, reserveSize });
        });
    }
    /**
     * Submits a block to the node for processing
     * @param block the hex representation of the block
     */
    submitBlock(block) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post('block', block);
        });
    }
    /**
     * Submits a transaction to the node for processing
     * @param transaction the hex representation of the transaction
     */
    submitTransaction(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post('transaction', transaction);
        });
    }
    /**
     * Retrieves the transaction information for the specified transaction
     * Requires the daemon to have the explorer enabled
     * @param hash the transaction hash
     */
    transaction(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.get('transaction/' + hash);
            response.block.alreadyGeneratedCoins = BigInteger(response.block.alreadyGeneratedCoins);
            response.block.timestamp = new Date(response.block.timestamp * 1000);
            response.prefix.unlockTime = BigInteger(response.prefix.unlockTime);
            return response;
        });
    }
    /**
     * Retrieves the RawTransaction from the node for the specified transaction
     * Requires the daemon to have the explorer enabled
     * @param hash the transaction hash
     */
    rawTransaction(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.get('transaction/' + hash + '/raw');
        });
    }
    /**
     * Retrieves the transaction summary information for the transactions currently
     * Requires the daemon to have the explorer enabled
     * in the memory pool
     */
    transactionPool() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.get('transaction/pool');
        });
    }
    /**
     * Retrieves the RawTransactions currently in the memory pool
     * Requires the daemon to have the explorer enabled
     */
    rawTransactionPool() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.get('transaction/pool/raw');
        });
    }
    /**
     * Gets the transaction memory pool changes given the last known block hash and
     * the transactions we last knew to be in the memory pool
     * @param lastKnownBlock the last known block hash
     * @param transactions an array of transaction hashes we last saw in the memory pool
     */
    transactionPoolChanges(lastKnownBlock, transactions = []) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post('transaction/pool/delta', { lastKnownBlock, transactions });
        });
    }
    /**
     * Retrieves information on where the specified transactions are located
     * @param transactions an array of transaction hashes
     */
    transactionsStatus(transactions) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post('transaction/status', transactions);
        });
    }
    /**
     * Retrieves random global indexes typically used for mixing operations for the specified
     * amounts and for the number requested (if available)
     * @param amounts an array of amounts for which we need random global indexes
     * @param count the number of global indexes to return for each amount
     */
    randomIndexes(amounts, count = 3) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post('indexes/random', { amounts, count });
        });
    }
    /**
     * Retrieves the global indexes for all transactions contained within the blocks heights specified (non-inclusive)
     * @param startHeight the starting block height
     * @param endHeight the ending block height
     */
    indexes(startHeight, endHeight) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.get('indexes/' + startHeight + '/' + endHeight)
                .then((result) => result.sort((a, b) => (a.hash > b.hash) ? 1 : -1));
        });
    }
    /**
     * Retrieves the information necessary for syncing a wallet (or other utility) against the node
     * @param checkpoints a list of block hashes that we know about in descending height order
     * @param height the height to start syncing from
     * @param timestamp the timestamp to start syncing from
     * @param skipCoinbaseTransactions whether we should skip blocks that only include coinbase transactions
     * @param count the number of blocks to return
     */
    sync(checkpoints = [], height = 0, timestamp = 0, skipCoinbaseTransactions = false, count = 100) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.post('sync', {
                checkpoints,
                count,
                height,
                skipCoinbaseTransactions,
                timestamp
            });
            response.blocks = response.blocks.map((block) => {
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
        });
    }
    /**
     * Retrieves the RawBlocks & RawTransactions for syncing a wallet (or other utility) against the node
     * @param checkpoints a list of block hashes that we know about in descending height order
     * @param height the height to start syncing from
     * @param timestamp the timestamp to start syncing from
     * @param skipCoinbaseTransactions whether we should skip blocks that only include coinbase transactions
     * @param count the number of blocks to return
     */
    rawSync(checkpoints = [], height = 0, timestamp = 0, skipCoinbaseTransactions = false, count = 100) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post('sync/raw', {
                checkpoints,
                count,
                height,
                skipCoinbaseTransactions,
                timestamp
            });
        });
    }
}
exports.TurtleCoind = TurtleCoind;
