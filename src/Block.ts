// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import { Config, ICoinConfig, ICoinRunningConfig } from './Config';
import { Transaction } from './Transaction';
import { ParentBlock } from './ParentBlock';
import { TransactionInputs, TransactionOutputs, TurtleCoinCrypto } from './Types';
import { Reader, Writer } from '@turtlecoin/bytestream';
import { Common } from './Common';

/** @ignore */
interface Cache {
    blob: string;
    hash: string;
    longBlob: string;
    longHash: string;
}

/**
 * Represents a TurtleCoin Block
 */
export class Block {
    /**
     * The size of the block in bytes
     */
    public get size (): number {
        return this.toBuffer().length;
    }

    /**
     * The height of the block
     */
    public get height (): number {
        if (this.m_minerTransaction.inputs.length !== 0) {
            return (this.m_minerTransaction.inputs[0] as TransactionInputs.CoinbaseInput).blockIndex;
        } else {
            return 0;
        }
    }

    /**
     * The nonce of the block
     */
    public get nonce (): number {
        const writer = new Writer();
        writer.uint32_t(this.m_nonce, true);
        const reader = new Reader(writer.buffer);
        return reader.uint32_t().toJSNumber();
    }

    public set nonce (value: number) {
        if (value > 0xFFFFFFFF) {
            throw new Error('value exceeds uint32_t maximum');
        }

        const writer = new Writer();
        writer.uint32_t(value);
        const reader = new Reader(writer.buffer);
        this.m_nonce = reader.uint32_t(true).toJSNumber();
    }

    /**
     * The transactions hashes (non-coinbase) included in the block
     */
    public get transactions (): string[] {
        return this.m_transactions;
    }

    /**
     * The base transaction branch of the block
     */
    public async baseTransactionBranch (): Promise<string[]> {
        const transactions = [await this.m_minerTransaction.hash()].concat(this.transactions);

        return TurtleCoinCrypto.tree_branch(transactions);
    }

    /**
     * The transaction tree hash of the block
     */
    public async transactionTreeHash (): Promise<{ hash: string, count: number }> {
        const transactions = [await this.m_minerTransaction.hash()].concat(this.transactions);

        const treeHash = await TurtleCoinCrypto.tree_hash(transactions);

        return { hash: treeHash, count: transactions.length };
    }

    /**
     * The merkle root of the block
     */
    public async merkleRoot (): Promise<string> {
        const writer = new Writer();

        writer.varint(this.m_majorVersion);
        writer.varint(this.m_minorVersion);

        if (this.m_majorVersion < this.m_config.activateParentBlockVersion) {
            writer.varint(this.m_timestamp.getTime() / 1000);
        }

        writer.hash(this.m_previousBlockHash);

        if (this.m_majorVersion < this.m_config.activateParentBlockVersion) {
            writer.uint32_t(this.m_nonce, true);
        }

        const transactionTreeHash = await this.transactionTreeHash();

        writer.hash(transactionTreeHash.hash);
        writer.varint(transactionTreeHash.count);

        return getBlockHash(writer.buffer);
    }

    /**
     * The major block version
     */
    public get majorVersion (): number {
        return this.m_majorVersion;
    }

    public set majorVersion (majorVersion: number) {
        this.m_majorVersion = majorVersion;
    }

    /**
     * The minor block version
     */
    public get minorVersion (): number {
        return this.m_minorVersion;
    }

    public set minorVersion (minorVersion: number) {
        this.m_minorVersion = minorVersion;
    }

    /**
     * The block hash (id)
     */
    public async hash (): Promise<string> {
        const blob = await this.toHashingBuffer();

        if (this.m_cache.blob === blob.toString('hex') && this.m_cache.hash) {
            return this.m_cache.hash;
        }

        this.m_cache.blob = blob.toString('hex');

        this.m_cache.hash = await getBlockHash(blob);

        return this.m_cache.hash;
    }

    /**
     * The block PoW hash
     */
    public async longHash (): Promise<string> {
        const blob = await this.toHashingBuffer(true);

        if (this.m_cache.longBlob === blob.toString('hex') && this.m_cache.longHash) {
            return this.m_cache.longHash;
        }

        this.m_cache.longBlob = blob.toString('hex');

        this.m_cache.longHash = await getBlockPoWHash(blob, this.m_majorVersion);

        return this.m_cache.longHash;
    }

    /**
     * The timestamp of the block
     */
    public get timestamp (): Date {
        return this.m_timestamp;
    }

    public set timestamp (timestamp: Date) {
        this.m_timestamp = timestamp;
    }

    /**
     * The previous block hash of the block
     */
    public get previousBlockHash (): string {
        return this.m_previousBlockHash;
    }

    public set previousBlockHash (previousBlockHash: string) {
        this.m_previousBlockHash = previousBlockHash;
    }

    /**
     * The miner (coinbase) transaction of the block
     */
    public get minerTransaction (): Transaction {
        return this.m_minerTransaction;
    }

    public set minerTransaction (minerTransaction: Transaction) {
        this.m_minerTransaction = minerTransaction;
    }

    /**
     * The parent block of the block
     */
    public get parentBlock (): ParentBlock {
        return this.m_parentBlock;
    }

    public set parentBlock (parentBlock: ParentBlock) {
        this.m_parentBlock = parentBlock;
    }

    /**
     * Defines what major block version activates the use of parent blocks
     */
    public get activateParentBlockVersion (): number {
        return this.m_config.activateParentBlockVersion;
    }

    public set activateParentBlockVersion (activateParentBlockVersion: number) {
        this.m_config.activateParentBlockVersion = activateParentBlockVersion;
    }

    /**
     * Creates a new instance of a block from the data supplied
     * @param data the raw block data to decode
     * @param [config] the configuration that may define the major block version to activate parent block usage
     * @returns the new block object
     */
    public static async from (data: Buffer | string, config?: ICoinConfig): Promise<Block> {
        const block = new Block();

        if (config) {
            block.m_config = Common.mergeConfig(config);
        }

        const reader = new Reader(data);

        block.m_majorVersion = reader.varint().toJSNumber();
        block.m_minorVersion = reader.varint().toJSNumber();

        if (block.m_majorVersion >= block.m_config.activateParentBlockVersion) {
            block.m_previousBlockHash = reader.hash();
            block.m_parentBlock.majorVersion = reader.varint().toJSNumber();
            block.m_parentBlock.minorVersion = reader.varint().toJSNumber();
        }

        block.m_timestamp = new Date(reader.varint().toJSNumber() * 1000);

        if (block.m_majorVersion >= block.m_config.activateParentBlockVersion) {
            block.m_parentBlock.previousBlockHash = reader.hash();
        } else {
            block.m_previousBlockHash = reader.hash();
        }

        block.m_nonce = reader.uint32_t(true).toJSNumber();

        if (block.m_majorVersion >= block.m_config.activateParentBlockVersion) {
            block.m_parentBlock.transactionCount = reader.varint().toJSNumber();

            const baseTransactionBranchDepth = await TurtleCoinCrypto.tree_depth(block.m_parentBlock.transactionCount);

            for (let i = 0; i < baseTransactionBranchDepth; i++) {
                block.m_parentBlock.baseTransactionBranch.push(reader.hash());
            }

            block.m_parentBlock.minerTransaction.version = reader.varint().toJSNumber();
            block.m_parentBlock.minerTransaction.unlockTime = reader.varint();

            const p_inputs = reader.varint().toJSNumber();

            for (let i = 0; i < p_inputs; i++) {
                if (reader.uint8_t().toJSNumber() === TransactionInputs.InputType.COINBASE) {
                    block.m_parentBlock.minerTransaction.inputs.push(
                        new TransactionInputs.CoinbaseInput(reader.varint().toJSNumber())
                    );
                } else {
                    throw new Error('Non-coinbase input found in parent block miner transaction');
                }
            }

            const p_outputs = reader.varint().toJSNumber();

            for (let i = 0; i < p_outputs; i++) {
                const amount = reader.varint();
                const type = reader.uint8_t().toJSNumber();
                if (type === TransactionOutputs.OutputType.KEY) {
                    block.m_parentBlock.minerTransaction.outputs.push(
                        new TransactionOutputs.KeyOutput(amount, reader.hash())
                    );
                } else {
                    throw new Error('Unknown output type detected');
                }
            }

            const p_extraLength = reader.varint().toJSNumber();

            const p_extra = reader.bytes(p_extraLength);

            await block.m_parentBlock.minerTransaction.parseExtra(p_extra);

            if (block.m_parentBlock.minerTransaction.version >= 2) {
                block.m_parentBlock.minerTransaction.ignoredField = reader.varint().toJSNumber();
            }

            const blockchainBranchDepth = (block.m_parentBlock.minerTransaction.mergedMining)
                ? block.m_parentBlock.minerTransaction.mergedMining.depth
                : 0;

            for (let i = 0; i < blockchainBranchDepth; i++) {
                block.m_parentBlock.blockchainBranch.push(reader.hash());
            }
        }

        block.m_minerTransaction.version = reader.varint().toJSNumber();
        block.m_minerTransaction.unlockTime = reader.varint();

        const inputs = reader.varint().toJSNumber();

        for (let i = 0; i < inputs; i++) {
            if (reader.uint8_t().toJSNumber() === TransactionInputs.InputType.COINBASE) {
                block.m_minerTransaction.inputs.push(
                    new TransactionInputs.CoinbaseInput(reader.varint().toJSNumber())
                );
            } else {
                throw new Error('Non-coinbase input found in miner transaction');
            }
        }

        const outputs = reader.varint().toJSNumber();

        for (let i = 0; i < outputs; i++) {
            const amount = reader.varint();
            const type = reader.uint8_t().toJSNumber();
            if (type === TransactionOutputs.OutputType.KEY) {
                block.m_minerTransaction.outputs.push(
                    new TransactionOutputs.KeyOutput(amount, reader.hash())
                );
            } else {
                throw new Error('Unknown output type detected');
            }
        }

        const extraLength = reader.varint().toJSNumber();

        const extra = reader.bytes(extraLength);

        await block.m_minerTransaction.parseExtra(extra);

        const txnCount = reader.varint().toJSNumber();

        for (let i = 0; i < txnCount; i++) {
            block.m_transactions.push(reader.hash());
        }

        if (reader.unreadBytes > 0) {
            throw new RangeError('Unhandled data in block blob detected');
        }

        return block;
    }

    protected m_majorVersion = 0;
    protected m_minorVersion = 0;
    protected m_timestamp: Date = new Date();
    protected m_previousBlockHash: string = ''.padStart(64, '0');
    protected m_parentBlock: ParentBlock = new ParentBlock();
    protected m_nonce = 0;
    protected m_minerTransaction: Transaction = new Transaction();
    protected m_transactions: string[] = [];
    protected m_config: ICoinRunningConfig = Config;
    protected m_cache: Cache = {
        blob: '',
        hash: '',
        longBlob: '',
        longHash: ''
    };

    /**
     * Returns a Buffer representation of the block
     * @returns the resulting Buffer
     */
    public toBuffer (): Buffer {
        const writer = new Writer();

        writer.varint(this.m_majorVersion);
        writer.varint(this.m_minorVersion);

        if (this.m_majorVersion >= this.m_config.activateParentBlockVersion) {
            writer.hash(this.m_previousBlockHash);
            writer.varint(this.m_parentBlock.majorVersion);
            writer.varint(this.m_parentBlock.minorVersion);
        }

        writer.varint(this.m_timestamp.getTime() / 1000);

        if (this.m_majorVersion >= this.m_config.activateParentBlockVersion) {
            writer.hash(this.m_parentBlock.previousBlockHash);
        } else {
            writer.hash(this.m_previousBlockHash);
        }

        writer.uint32_t(this.m_nonce, true);

        if (this.m_majorVersion >= this.m_config.activateParentBlockVersion) {
            writer.varint(this.m_parentBlock.transactionCount);

            if (Array.isArray(this.m_parentBlock.baseTransactionBranch)) {
                this.m_parentBlock.baseTransactionBranch.forEach((branch) => {
                    writer.hash(branch);
                });
            } else {
                writer.hash(this.m_parentBlock.baseTransactionBranch);
            }

            writer.write(this.m_parentBlock.minerTransaction.toBuffer(true));

            if (this.m_parentBlock.minerTransaction.version >= 2) {
                writer.varint(this.m_parentBlock.minerTransaction.ignoredField);
            }

            this.m_parentBlock.blockchainBranch.forEach((branch) => {
                writer.hash(branch);
            });
        }

        writer.write(this.m_minerTransaction.toBuffer(true));

        writer.varint(this.m_transactions.length);

        this.m_transactions.forEach((hash) => {
            writer.hash(hash);
        });

        return writer.buffer;
    }

    /**
     * Returns a hexadecimal (blob) representation of the block
     * @returns the hexadecimal representation of the block
     */
    public toString (): string {
        return this.toBuffer().toString('hex');
    }

    /**
     * Returns a Buffer representation of the data for hashing (mining) the block
     * @param [headerOnly] whether to return just the header or the full block
     * @returns the hashing buffer
     */
    public async toHashingBuffer (headerOnly = false): Promise<Buffer> {
        const writer = new Writer();

        writer.varint(this.m_majorVersion);
        writer.varint(this.m_minorVersion);

        if (this.m_majorVersion >= this.m_config.activateParentBlockVersion) {
            writer.hash(this.m_previousBlockHash);
        } else {
            writer.varint(this.m_timestamp.getTime() / 1000);
            writer.hash(this.m_previousBlockHash);
            writer.uint32_t(this.m_nonce, true);
        }

        const transactionTreeHash = await this.transactionTreeHash();

        writer.hash(transactionTreeHash.hash);

        writer.varint(transactionTreeHash.count);

        if (this.m_majorVersion >= this.m_config.activateParentBlockVersion) {
            if (headerOnly) {
                writer.clear();
            }

            writer.varint(this.m_parentBlock.majorVersion);
            writer.varint(this.m_parentBlock.minorVersion);
            writer.varint(this.m_timestamp.getTime() / 1000);
            writer.hash(this.m_parentBlock.previousBlockHash);
            writer.uint32_t(this.m_nonce, true);

            const treeHash = await TurtleCoinCrypto.tree_hash_from_branch(
                this.m_parentBlock.baseTransactionBranch,
                await this.m_parentBlock.minerTransaction.hash(),
                0
            );

            writer.hash(treeHash);

            writer.varint(this.m_parentBlock.transactionCount);

            if (headerOnly) {
                return writer.buffer;
            }

            this.m_parentBlock.baseTransactionBranch.forEach((branch) => {
                writer.hash(branch);
            });

            writer.write(this.m_parentBlock.minerTransaction.toBuffer());

            if (this.m_parentBlock.minerTransaction.version >= 2) {
                writer.varint(this.m_parentBlock.minerTransaction.ignoredField);
            }

            this.m_parentBlock.blockchainBranch.forEach((branch) => {
                writer.hash(branch);
            });
        }

        return writer.buffer;
    }

    /**
     * Returns a hexadecimal (blob) representation of the data for hashing (mining) the block
     * @param [headerOnly] whether to return just the header or the full block
     * @returns the hexadecimal (blob) representation of the hashing buffer
     */
    public async toHashingString (headerOnly = false): Promise<string> {
        return (await this.toHashingBuffer(headerOnly))
            .toString('hex');
    }
}

/** @ignore */
async function getBlockHash (data: Buffer): Promise<string> {
    const writer = new Writer();

    writer.varint(data.length);
    writer.write(data);

    return TurtleCoinCrypto.cn_fast_hash(writer.blob);
}

/** @ignore */
async function getBlockPoWHash (data: Buffer, majorVersion: number): Promise<string> {
    const blob = data.toString('hex');

    switch (majorVersion) {
        case 1:
        case 2:
        case 3:
            return TurtleCoinCrypto.cn_slow_hash_v0(blob);
        case 4:
            return TurtleCoinCrypto.cn_lite_slow_hash_v1(blob);
        case 5:
            return TurtleCoinCrypto.cn_turtle_lite_slow_hash_v2(blob);
        case 6:
            return TurtleCoinCrypto.chukwa_slow_hash_v1(blob);
        case 7:
            return TurtleCoinCrypto.chukwa_slow_hash_v2(blob);
        default:
            throw new Error('Unhandled major block version');
    }
}
