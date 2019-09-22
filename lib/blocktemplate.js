// Copyright (c) 2019, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const Block = require('./block')

/**
 * Class representing a CryptoNote BlockTemplate
 * @module BlockTemplate
 * @class
 */
class BlockTemplate {
  /**
   * A BlockTemplate Configuration
   * @typedef {Object} BlockTemplateConfig
   * @property {string} blocktemplate - The BlockTemplate from the daemon
   * @property {number} difficulty - The target difficulty for the BlockTemplate
   * @property {number} height - The block height of the BlockTemplate
   * @property {number} reservedOffset - The reserved offset of the BlockTemplate
   * @property {number} [activateParentBlockVersion=2] - The block major version at which Parent Blocks were enabled
   */

  /**
   * Initializes a new CryptoNote BlockTemplate object
   * @constructs
   * @param {BlockTemplateConfig} [opts] - a configuration object
   */
  constructor (opts) {
    opts = opts || {}

    if (!opts.blocktemplate || !opts.difficulty || !opts.height || !opts.reservedOffset) {
      throw new Error('Cannot initialize object without required parameters')
    }

    /**
     * The block major version at which Parent Blocks were enabled
     * @type {number}
     * @default 2
     */
    this.activateParentBlockVersion = opts.activateParentBlockVersion || 2

    /**
     * The BlockTemplate from the daemon
     * @type {string}
     */
    this.blocktemplate = opts.blocktemplate

    /**
     * The BlockTemplate target difficulty
     * @type {number}
     */
    this.difficulty = opts.difficulty

    /**
     * The BlockTemplate height
     * @type {number}
     */
    this.height = opts.height

    /**
     * The BlockTemplate reserved offset
     * @type {number}
     */
    this.reservedOffset = opts.reservedOffset

    try {
      /**
       * The block contained in the BlockTemplate
       * @type {Block}
       */
      this.block = new Block(this.blocktemplate, {
        activateParentBlockVersion: this.activateParentBlockVersion
      })
    } catch (e) {
      throw new Error('Could not parse provided Block Template: ' + e.toString())
    }

    this.block.targetDifficulty = opts.difficulty
  }

  /**
   * The block extra nonce
   * @type {number}
   */
  get extraNonce () {
    return this.block.extraNonce
  }

  set extraNonce (value) {
    this.block.extraNonce = value
  }

  /**
   * The block nonce
   * @type {number}
   */
  get nonce () {
    return this.block.nonce
  }

  set nonce (value) {
    this.block.nonce = value
  }

  /**
   * Converts the block template into a v1 block blob that is used by a compatible miner
     during its PoW calculations.
   * @param {Block} [block] - The block to convert
   * @returns {Block} the resulting block
   */
  convert (block) {
    block = block || this.block

    if (block.majorVersion >= this.activateParentBlockVersion) {
    /* If we support merged mining, then we can reduce the size of
       the block blob sent to the miners by crafting a new block
       with the blocktemplate provided by the daemon into a new
       block that contains the original block information as a MM
       tag in the miner transaction */
      const newBlock = new Block()
      newBlock.majorVersion = 1
      newBlock.minorVersion = 0
      newBlock.timestamp = block.timestamp
      newBlock.previousBlockHash = block.previousBlockHash
      newBlock.nonce = block.nonce

      /* Here, we fill the new block miner transaction with the
       MM tag and the merkle root of the block contained
       in the blocktemplate provided by the daemon. We form the
       tag using the nice transaction API because that makes life
       a lot easier than forming it by hand */
      newBlock.minerTransaction.extra = []
      newBlock.minerTransaction.extra.push({
        tag: 3,
        depth: 0,
        merkleRoot: block.merkleRoot
      })
      /* Once the extra tag is formed, we'll overwrite extra
       with the blob version of it */
      newBlock.minerTransaction.extra = newBlock.minerTransaction.extraBlob

      return newBlock
    } else {
      return block
    }
  }

  /**
   * Reconstructs a full block template using the nonce found by a
     pool miner by first creating the parent block in the convert method
     and then merging the two blocks together
   * @param {number} nonce - The nonce to use in the new block
   * @param {string} [branch] - The blockchain branch to use in the new block
   * @returns {Block} the resulting block
   */
  construct (nonce, branch) {
    const block = this.block
    block.nonce = nonce

    if (block.majorVersion >= this.activateParentBlockVersion) {
    /* First we create the new parent block */
      const newBlock = this.convert(block)
      /* Then assign the nonce to it */
      newBlock.parentBlock.nonce = nonce

      /* Then we merge the two blocks together */
      block.timestamp = newBlock.timestamp
      block.parentBlock.majorVersion = newBlock.majorVersion
      block.parentBlock.minorVersion = newBlock.minorVersion
      block.parentBlock.previousBlockHash = newBlock.previousBlockHash
      block.parentBlock.nonce = newBlock.nonce
      block.parentBlock.minerTransaction = newBlock.minerTransaction
      block.parentBlock.transactionCount = newBlock.transactions.length + 1 // +1 for the miner transaction
      block.parentBlock.baseTransactionBranch = newBlock.baseTransactionBranch

      /* We only add this if it actually exists */
      if (branch) {
        block.parentBlock.blockchainBranch = branch
      }
    }

    return block
  }
}

module.exports = BlockTemplate
