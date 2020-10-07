/// <reference types="node" />
import { Block } from './Block';
import { Transaction } from './Transaction';
import { TurtleCoindTypes } from './Types';
/** @ignore */
export declare enum SIZES {
    KEY = 32,
    CHECKSUM = 4
}
/**
 * Represents a BlockTemplate received from a Daemon that can be manipulated to perform mining operations
 */
export declare class BlockTemplate {
    /**
     * The major block version for which to activate the use of parent blocks
     */
    get activateParentBlockVersion(): number;
    set activateParentBlockVersion(value: number);
    /**
     * The original block template as a buffer
     */
    get blockTemplateBuffer(): Buffer;
    /**
     * The original block template in hexadecimal (blob)
     */
    get blockTemplate(): string;
    /**
     * The block template difficulty
     */
    get difficulty(): number;
    /**
     * The block template height
     */
    get height(): number;
    /**
     * The block template reserved offset position
     */
    get reservedOffset(): number;
    /**
     * The block nonce
     */
    get nonce(): number;
    set nonce(value: number);
    /**
     * The block defined in the block template
     */
    get block(): Block;
    /**
     * The miner transaction defined in the block of the block template
     */
    get minerTransaction(): Transaction;
    /**
     * The extra miner nonce typically used for pool based mining
     */
    get minerNonce(): number;
    set minerNonce(nonce: number);
    /**
     * Whether the given hash meets the difficulty specified
     * @param hash the block POW hash
     * @param difficulty the target difficulty
     */
    static hashMeetsDifficulty(hash: string, difficulty: number): boolean;
    /**
     * Creates a new block template instance using the supplied daemon response
     * @param response the daemon response to the get_blocktemplate call
     */
    static from(response: TurtleCoindTypes.IBlockTemplate): Promise<BlockTemplate>;
    protected m_blockTemplate: Buffer;
    protected m_difficulty: number;
    protected m_height: number;
    protected m_reservedOffset: number;
    protected m_block: Block;
    protected m_extraNonceOffset: number;
    protected m_extraNonceSafeLength: number;
    /**
     * Converts a block into a v1 hashing block typically used by miners during mining operations
     * this method actually creates a merged mining block that merge mines itself
     * @param block the block to convert for miner hashing
     * @returns the mining block
     */
    convert(block?: Block): Promise<Block>;
    /**
     * Constructs a new "final" block that can be submitted to the network using
     * an original the original block in the block template and the nonce value found
     * @param nonce the nonce value for the block
     * @param [branch] the blockchain branch containing the merged mining information
     * @returns the block that can be submitted to the network
     */
    construct(nonce: number, branch?: string): Promise<Block>;
}
