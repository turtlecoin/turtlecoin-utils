// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import { CryptoNoteInterfaces } from './Types/ICryptoNote';
import { Config, ICoinConfig, ICoinRunningConfig } from './Config';
import Transport from '@ledgerhq/hw-transport';
import { LedgerDevice } from './LedgerDevice';
import {
    BigInteger,
    ED25519,
    ICryptoConfig,
    Interfaces,
    LedgerTypes,
    TransactionInputs,
    TransactionOutputs,
    TurtleCoinCrypto
} from './Types';
import { Common } from './Common';
import { AddressPrefix } from './AddressPrefix';
import { Address } from './Address';
import * as Numeral from 'numeral';
import { Transaction } from './Transaction';
import { EventEmitter } from 'events';

/** @ignore */
import ICryptoNote = CryptoNoteInterfaces.ICryptoNote;
/** @ignore */
import TransactionState = LedgerTypes.TransactionState;
/** @ignore */
import KeyPair = ED25519.KeyPair;

/** @ignore */
const NULL_KEY: string = ''.padEnd(64, '0');

/** @ignore */
const UINT64_MAX = BigInteger(2).pow(64);

/**
 * Ledger CryptoNote helper class for constructing transactions and performing
 * various other cryptographic items during the receipt or transfer of funds
 * on the network using a Ledger based hardware device
 */
export class LedgerNote extends EventEmitter implements ICryptoNote {
    protected m_config: ICoinRunningConfig = Config;
    private readonly m_ledger: LedgerDevice;
    private m_address: Address = new Address();
    private m_fetched = false;

    /**
     * Constructs a new instance of the Ledger-based CryptoNote tools
     * @param transport the transport mechanism for talking to a Ledger device
     * @param config  the base configuration to apply to our helper
     * @param cryptoConfig configuration to allow for overriding the provided cryptographic primitives
     */
    constructor (transport: Transport, config?: ICoinConfig, cryptoConfig?: ICryptoConfig) {
        super();

        this.m_ledger = new LedgerDevice(transport, config);

        this.m_ledger.on('user_confirm', () => this.emit('user_confirm'));

        if (config) {
            this.m_config = Common.mergeConfig(config);
        }

        if (cryptoConfig) {
            TurtleCoinCrypto.userCryptoFunctions = cryptoConfig;
        }
    }

    /**
     * Emits an event if we have sent a command to the ledger wallet that is likely awaiting
     * manual user confirmation on the device
     * @param event
     * @param listener
     */
    public on(event: 'user_confirm', listener: () => void): this;

    /** @ignore */
    public on (event: any, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    /**
     * The current coin configuration
     */
    public get config (): ICoinConfig {
        return this.m_config;
    }

    public set config (config: ICoinConfig) {
        this.m_config = Common.mergeConfig(config);
    }

    /**
     * The current cryptographic primitives configuration
     */
    public get cryptoConfig (): ICryptoConfig {
        return TurtleCoinCrypto.userCryptoFunctions;
    }

    public set cryptoConfig (config: ICryptoConfig) {
        TurtleCoinCrypto.userCryptoFunctions = config;
    }

    /**
     * Provides the public wallet address of the ledger device
     */
    public get address (): Address {
        if (!this.ready) {
            throw new Error('Instance is not ready');
        }

        return this.m_address;
    }

    /**
     * Manually initializes the class if necessary
     */
    public async init (): Promise<void> {
        if (!await this.m_ledger.checkVersion(this.m_config.minimumLedgerVersion)) {
            throw new Error('Ledger application does not meet minimum version');
        }

        if (!await this.m_ledger.checkIdent()) {
            throw new Error('Application running on the Ledger has the wrong identity');
        }
    }

    /**
     * Fetches the public keys and private view key from the Ledger device
     * and stores it locally for use later
     */
    public async fetchKeys (): Promise<void> {
        this.m_address = await this.m_ledger.getViewWallet(!this.m_config.ledgerDebug);

        this.m_fetched = true;
    }

    /**
     * Indicates whether the keys have been fetched from the ledger device
     * and this instance of the class is ready for further interaction
     */
    public get ready (): boolean {
        return this.m_fetched;
    }

    /**
     * Converts absolute global index offsets to relative ones
     * @param offsets the absolute offsets
     * @returns the relative offsets
     */
    public absoluteToRelativeOffsets (offsets: BigInteger.BigInteger[] | string[] | number[]): number[] {
        const result: number[] = [];

        const tmpOffsets = Common.absoluteToRelativeOffsets(offsets);

        tmpOffsets.forEach((offset) => result.push(offset.toJSNumber()));

        return result;
    }

    /**
     * Converts relative global index offsets to absolute offsets
     * @param offsets the relative offsets
     * @returns the absolute offsets
     */
    public relativeToAbsoluteOffsets (offsets: BigInteger.BigInteger[] | string[] | number[]): number[] {
        const result: number[] = [];

        const tmpOffsets = Common.relativeToAbsoluteOffsets(offsets);

        tmpOffsets.forEach((offset) => result.push(offset.toJSNumber()));

        return result;
    }

    /**
     * Generates a key derivation
     * @param transactionPublicKey the transaction public key
     * @param privateViewKey the private view key (ignored)
     */
    public async generateKeyDerivation (
        transactionPublicKey: string,
        privateViewKey: string | undefined
    ): Promise<string> {
        if (!this.ready) {
            await this.fetchKeys();
        }

        UNUSED(privateViewKey);

        return TurtleCoinCrypto.generateKeyDerivation(
            transactionPublicKey, this.address.view.privateKey);
    }

    /**
     * Generates a key image from the supplied values
     * @async
     * @param transactionPublicKey the transaction public key
     * @param privateViewKey the private view key
     * @param publicSpendKey the public spend key
     * @param privateSpendKey the private spend key
     * @param outputIndex the index of the output in the transaction
     * @returns the key image
     */
    public async generateKeyImage (
        transactionPublicKey: string,
        privateViewKey: string | undefined,
        publicSpendKey: string | undefined,
        privateSpendKey: string | undefined,
        outputIndex: number
    ): Promise<CryptoNoteInterfaces.IKeyImage> {
        if (!this.ready) {
            await this.fetchKeys();
        }

        UNUSED(privateViewKey);
        UNUSED(publicSpendKey);
        UNUSED(privateSpendKey);

        const derivation = await TurtleCoinCrypto.generateKeyDerivation(
            transactionPublicKey, this.address.view.privateKey);

        return this.generateKeyImagePrimitive(undefined, undefined, outputIndex, derivation);
    }

    /**
     * Primitive method for generating a key image from the supplied values
     * @async
     * @param publicSpendKey the public spend key
     * @param privateSpendKey the private spend key
     * @param outputIndex the index of the output in the transaction
     * @param derivation the key derivation
     * @returns the key image
     */
    public async generateKeyImagePrimitive (
        publicSpendKey: string | undefined,
        privateSpendKey: string | undefined,
        outputIndex: number,
        derivation: string
    ): Promise<CryptoNoteInterfaces.IKeyImage> {
        if (!this.ready) {
            await this.fetchKeys();
        }

        UNUSED(publicSpendKey);
        UNUSED(privateSpendKey);

        const publicEphemeral = await TurtleCoinCrypto.derivePublicKey(
            derivation, outputIndex, this.address.spend.publicKey);

        const result = await this.m_ledger.generateKeyImagePrimitive(
            derivation, outputIndex, publicEphemeral, !this.m_config.ledgerDebug);

        return {
            publicEphemeral: publicEphemeral,
            keyImage: result
        };
    }

    /**
     * Provides the public key of the supplied private key
     * @async
     * @param privateKey the private key
     * @returns the public key
     */
    public async privateKeyToPublicKey (privateKey: string): Promise<string> {
        return TurtleCoinCrypto.secretKeyToPublicKey(privateKey);
    }

    /**
     * Scans the provided transaction outputs and returns those outputs which belong to us.
     * If the privateSpendKey is not supplied, the private ephemeral and key image will be undefined
     * @async
     * @param transactionPublicKey the transaction public key
     * @param outputs the transaction outputs
     * @param privateViewKey the private view key
     * @param publicSpendKey the public spend key
     * @param [privateSpendKey] the private spend key
     * @param [generatePartial] whether we should generate partial key images if the output belongs to use
     * @returns an list of outputs that belong to us
     */
    public async scanTransactionOutputs (
        transactionPublicKey: string,
        outputs: Interfaces.Output[],
        privateViewKey: string,
        publicSpendKey: string,
        privateSpendKey?: string,
        generatePartial?: boolean
    ): Promise<Interfaces.Output[]> {
        const promises = [];

        for (const output of outputs) {
            promises.push(
                this.isOurTransactionOutput(
                    transactionPublicKey,
                    output,
                    privateViewKey,
                    publicSpendKey,
                    privateSpendKey,
                    generatePartial).catch()
            );
        }

        const results = await Promise.all(promises);

        const ourOutputs: Interfaces.Output[] = [];

        for (const result of results) {
            if (result) {
                ourOutputs.push(result);
            }
        }

        return ourOutputs;
    }

    /**
     * Scans the given transaction output to determine if it belongs to us, if so, we return the output
     * with the private ephemeral and key image if the privateSpendKey was supplied
     * @async
     * @param transactionPublicKey the transaction public key
     * @param output the transaction output
     * @param privateViewKey the private view key
     * @param publicSpendKey the public spend key
     * @param [privateSpendKey] the private spend key
     * @param [generatePartial] whether we should generate partial key images
     * @returns the output if it belongs to us
     */
    public async isOurTransactionOutput (
        transactionPublicKey: string,
        output: Interfaces.Output,
        privateViewKey: string | undefined,
        publicSpendKey: string | undefined,
        privateSpendKey?: string,
        generatePartial = false
    ): Promise<Interfaces.Output> {
        if (!this.ready) {
            await this.fetchKeys();
        }

        if (generatePartial) {
            throw new Error('Generating partial key images is not supported');
        }

        UNUSED(privateViewKey);
        UNUSED(publicSpendKey);
        UNUSED(privateSpendKey);

        const derivedKey = await TurtleCoinCrypto.generateKeyDerivation(transactionPublicKey,
            this.address.view.privateKey);

        const publicEphemeral = await TurtleCoinCrypto.derivePublicKey(
            derivedKey, output.index, this.address.spend.publicKey);

        if (publicEphemeral === output.key) {
            output.input = {
                publicEphemeral,
                transactionKeys: {
                    publicKey: transactionPublicKey,
                    derivedKey,
                    outputIndex: output.index
                }
            };

            const result = await this.generateKeyImage(
                transactionPublicKey, undefined, undefined, undefined, output.index);

            // we don't store this as it is private
            output.input.privateEphemeral = NULL_KEY;

            output.keyImage = result.keyImage;

            return output;
        }

        throw new Error('Not our output');
    }

    /**
     * Calculates the minimum transaction fee given the transaction size (bytes)
     * @param txSize the transaction size in bytes
     * @returns the minimum transaction fee
     */
    public calculateMinimumTransactionFee (txSize: number): number {
        const chunks = Math.ceil(
            txSize /
            (this.m_config.feePerByteChunkSize || Config.feePerByteChunkSize));

        return chunks *
            (this.m_config.feePerByteChunkSize || Config.feePerByteChunkSize) *
            (this.m_config.feePerByte || Config.feePerByte);
    }

    /**
     * Creates an integrated address using the supplied values
     * @param address the wallet address
     * @param paymentId the payment ID
     * @param [prefix] the address prefix
     * @returns the integrated address
     */
    public async createIntegratedAddress (
        address: string,
        paymentId: string,
        prefix?: AddressPrefix | number
    ): Promise<string> {
        if (typeof prefix === 'number') {
            prefix = new AddressPrefix(prefix);
        }

        if (!prefix) {
            prefix = new AddressPrefix(this.m_config.addressPrefix || Config.addressPrefix);
        }

        const addr = await Address.fromAddress(address);

        addr.paymentId = paymentId;

        if (prefix) {
            addr.prefix = prefix;
        }

        return addr.toString();
    }

    /**
     * Formats atomic units into human readable units
     * @param amount the amount in atomic units
     * @returns the amount in human readable units
     */
    public formatMoney (amount: BigInteger.BigInteger | number): string {
        let places = '';

        for (let i = 0; i < (this.m_config.coinUnitPlaces || Config.coinUnitPlaces); i++) {
            places += '0';
        }

        if (typeof amount !== 'number') {
            amount = amount.toJSNumber();
        }

        return Numeral(
            amount / Math.pow(10, this.m_config.coinUnitPlaces || Config.coinUnitPlaces)
        ).format('0,0.' + places);
    }

    /**
     * Generates an array of transaction outputs (new destinations) for the given address
     * and the given amount within the allowed rules of the network
     * @param address the destination wallet address
     * @param amount the amount to send
     * @returns a list of transaction outputs
     */
    public async generateTransactionOutputs (
        address: string,
        amount: number
    ): Promise<Interfaces.GeneratedOutput[]> {
        if (amount < 0) {
            throw new RangeError('Amount must be a positive value');
        }

        const result: Interfaces.GeneratedOutput[] = [];

        const destination = await Address.fromAddress(address);

        const amountChars = amount.toString().split('').reverse();

        for (let i = 0; i < amountChars.length; i++) {
            const amt = parseInt(amountChars[i], 10) * Math.pow(10, i);

            if (amt > (this.m_config.maximumOutputAmount || Config.maximumOutputAmount)) {
                let splitAmt = amt;

                while (splitAmt >= (this.m_config.maximumOutputAmount || Config.maximumOutputAmount)) {
                    result.push({
                        amount: this.m_config.maximumOutputAmount || Config.maximumOutputAmount,
                        destination: destination
                    });
                    splitAmt -= this.m_config.maximumOutputAmount || Config.maximumOutputAmount;
                }
            } else if (amt !== 0) {
                result.push({
                    amount: amt,
                    destination: destination
                });
            }
        }

        return result;
    }

    /**
     * Signs an arbitrary message using the supplied private key
     * @async
     * @param message the arbitrary message to sign
     * @param privateKey the private key to sign with
     * @returns the signature
     */
    public async signMessage (message: any, privateKey: string | undefined): Promise<string> {
        UNUSED(privateKey);

        if (typeof message !== 'string') {
            message = JSON.stringify(message);
        }

        const hex = Buffer.from(message);

        const hash = await TurtleCoinCrypto.cn_fast_hash(hex.toString('hex'));

        return this.m_ledger.generateSignature(hash, !this.m_config.ledgerDebug);
    }

    /**
     * Verifies the signature of an arbitrary message using the signature and the supplied public key
     * @async
     * @param message the arbitrary message that was signed
     * @param publicKey the public key of the private key that was used to sign
     * @param signature the signature
     * @returns whether the signature is valid
     */
    public async verifyMessageSignature (message: any, publicKey: string, signature: string): Promise<boolean> {
        if (typeof message !== 'string') {
            message = JSON.stringify(message);
        }

        const hex = Buffer.from(message);

        const hash = await TurtleCoinCrypto.cn_fast_hash(hex.toString('hex'));

        return TurtleCoinCrypto.checkSignature(hash, publicKey, signature);
    }

    /**
     * Constructs a new Transaction using the supplied values.
     * Note: Does not sign the transaction
     * @async
     * @param outputs the new outputs for the transaction (TO)
     * @param inputs outputs we will be spending (FROM)
     * @param randomOutputs the random outputs to use for mixing
     * @param mixin the number of mixins to use
     * @param [feeAmount] the transaction fee amount to pay
     * @param [paymentId] the payment ID to use in the transaction,
     * @param [unlockTime] the unlock time or block height for the transaction
     * @param [extraData] arbitrary extra data to include in the transaction extra field
     * @returns the newly created transaction object and it's input data
     */
    public async createTransaction (
        outputs: Interfaces.GeneratedOutput[],
        inputs: Interfaces.Output[],
        randomOutputs: Interfaces.RandomOutput[][],
        mixin: number,
        feeAmount?: number,
        paymentId?: string,
        unlockTime?: number,
        extraData?: any
    ): Promise<Transaction> {
        if (extraData) {
            throw new Error('Supplying extra transaction data is not supported');
        }

        if (typeof feeAmount === 'undefined') {
            feeAmount = this.m_config.defaultNetworkFee || Config.defaultNetworkFee;
        }
        unlockTime = unlockTime || 0;

        const feePerByte =
            this.m_config.activateFeePerByteTransactions || Config.activateFeePerByteTransactions || false;

        if (randomOutputs.length !== inputs.length && mixin !== 0) {
            throw new Error('The sets of random outputs supplied does not match the number of inputs supplied');
        }

        for (const randomOutput of randomOutputs) {
            if (randomOutput.length < mixin) {
                throw new Error('There are not enough random outputs to mix with');
            }
        }

        let neededMoney = BigInteger.zero;
        let integratedPaymentId: string | undefined;

        for (const output of outputs) {
            if (output.amount <= 0) {
                throw new RangeError('Cannot create an output with an amount <= 0');
            }
            if (output.amount > (this.m_config.maximumOutputAmount || Config.maximumOutputAmount)) {
                throw new RangeError('Cannot create an output with an amount > ' +
                    (this.m_config.maximumOutputAmount || Config.maximumOutputAmount));
            }
            neededMoney = neededMoney.add(output.amount);
            if (neededMoney.greater(UINT64_MAX)) {
                throw new RangeError('Total output amount exceeds UINT64_MAX');
            }
            /* Check to see if our destination contains differeing payment IDs via integrated addresses */
            if (output.destination.paymentId) {
                if (!integratedPaymentId) {
                    integratedPaymentId = output.destination.paymentId;
                } else if (integratedPaymentId && integratedPaymentId !== output.destination.paymentId) {
                    throw new Error('Cannot perform multiple transfers with differing integrated addresses');
                }
            }
        }

        /* If we found an integrated payment ID in the destinations and we supplied a payment ID
        in our call to this method and they do not match, this will result in a failure */
        if (integratedPaymentId && paymentId && integratedPaymentId !== paymentId) {
            throw new Error('Transfer destinations contains an integrated payment ID that does not match the payment' +
                'ID supplied to this method');
        }

        let foundMoney = BigInteger.zero;

        for (const input of inputs) {
            if (input.amount <= 0) {
                throw new RangeError('Cannot spend outputs with an amount <= 0');
            }
            foundMoney = foundMoney.add(input.amount);
            if (foundMoney.greater(UINT64_MAX)) {
                throw new RangeError('Total input amount exceeds UINT64_MAX');
            }
        }

        if (neededMoney.greater(foundMoney)) {
            throw new Error('We need more funds than was currently supplied for the transaction');
        }

        const change = foundMoney.subtract(neededMoney);

        if (!feePerByte && feeAmount && change.lesser(feeAmount)) {
            throw new Error('We have not spent all of what we sent in');
        }

        const transactionInputs = await prepareTransactionInputs(inputs, randomOutputs, mixin);

        // Use the ledger to get our random pair of keys for the one-time transaction keys
        const tx_keys = await this.m_ledger.getRandomKeyPair();

        const transactionOutputs = await prepareTransactionOutputs(tx_keys, outputs);

        if (transactionOutputs.outputs.length >
            (this.m_config.maximumOutputsPerTransaction || Config.maximumOutputsPerTransaction)) {
            throw new RangeError('Tried to create a transaction with more outputs than permitted');
        }

        if (feeAmount === 0) {
            if (transactionInputs.length < 12) {
                throw new Error('Sending a [0] fee transaction (fusion) requires a minimum of [' +
                    (this.m_config.fusionMinInputCount || Config.fusionMinInputCount) + '] inputs');
            }
            const ratio = this.m_config.fusionMinInOutCountRatio || Config.fusionMinInOutCountRatio;
            if ((transactionInputs.length / transactionOutputs.outputs.length) < ratio) {
                throw new Error('Sending a [0] fee transaction (fusion) requires the ' +
                    'correct input:output ratio be met');
            }
        }

        transactionInputs.sort((a, b) => {
            return (BigInteger(a.keyImage, 16).compare(BigInteger(b.keyImage, 16)) * -1);
        });

        try {
            await this.m_ledger.startTransaction(
                unlockTime,
                transactionInputs.length,
                transactionOutputs.outputs.length,
                tx_keys.publicKey,
                paymentId || undefined);

            if (await this.m_ledger.transactionState() !== TransactionState.READY) {
                throw new Error('Ledger transaction construction not ready.');
            }

            await this.m_ledger.startTransactionInputLoad();

            if (await this.m_ledger.transactionState() !== TransactionState.RECEIVING_INPUTS) {
                throw new Error('Ledger is not ready to receive inputs.');
            }

            for (const input of transactionInputs) {
                let offsets: BigInteger.BigInteger[] | number[] = input.outputs
                    .map(output => BigInteger(output.index));

                offsets = Common.absoluteToRelativeOffsets(offsets)
                    .map(offset => offset.toJSNumber());

                await this.m_ledger.loadTransactionInput(
                    input.input.transactionKeys.publicKey,
                    input.input.transactionKeys.outputIndex,
                    input.amount,
                    input.outputs.map(elem => elem.key),
                    offsets,
                    input.realOutputIndex);
            }

            if (await this.m_ledger.transactionState() !== TransactionState.INPUTS_RECEIVED) {
                throw new Error('Ledger did not receive all required inputs.');
            }

            await this.m_ledger.startTransactionOutputLoad();

            if (await this.m_ledger.transactionState() !== TransactionState.RECEIVING_OUTPUTS) {
                throw new Error('Ledger is not ready to receive outputs.');
            }

            for (const output of transactionOutputs.outputs) {
                await this.m_ledger.loadTransactionOutput(output.amount, output.key);
            }

            if (await this.m_ledger.transactionState() !== TransactionState.OUTPUTS_RECEIVED) {
                throw new Error('Ledger did not receive all required outputs.');
            }

            await this.m_ledger.finalizeTransactionPrefix();

            if (await this.m_ledger.transactionState() !== TransactionState.PREFIX_READY) {
                throw new Error('Ledger did not properly finalize the transaction prefix.');
            }

            const result = await this.m_ledger.signTransaction(!this.m_config.ledgerDebug);

            if (await this.m_ledger.transactionState() !== TransactionState.COMPLETE) {
                throw new Error('Ledger did not properly complete the transaction.');
            }

            const tx = await this.m_ledger.retrieveTransaction();

            if (await tx.hash() !== result.hash) {
                throw new Error('Transaction hash mismatch');
            }

            if (tx.size !== result.size) {
                throw new Error('Transaction size mismatch');
            }

            return tx;
        } finally {
            await this.m_ledger.resetTransaction();
        }
    }

    /**
     * Constructs a new Transaction using the supplied values.
     * Note: Does not sign the transaction
     * @async
     * @param outputs the new outputs for the transaction (TO)
     * @param inputs outputs we will be spending (FROM)
     * @param randomOutputs the random outputs to use for mixing
     * @param mixin the number of mixins to use
     * @param [feeAmount] the transaction fee amount to pay
     * @param [paymentId] the payment ID to use in the transaction,
     * @param [unlockTime] the unlock time or block height for the transaction
     * @param [extraData] arbitrary extra data to include in the transaction extra field
     * @returns the newly created transaction object and it's input data
     */
    public async createTransactionStructure (
        outputs: Interfaces.GeneratedOutput[],
        inputs: Interfaces.Output[],
        randomOutputs: Interfaces.RandomOutput[][],
        mixin: number,
        feeAmount?: number,
        paymentId?: string,
        unlockTime?: number,
        extraData?: any
    ): Promise<Interfaces.IPreparedTransaction> {
        if (typeof feeAmount === 'undefined') {
            feeAmount = this.m_config.defaultNetworkFee || Config.defaultNetworkFee;
        }
        unlockTime = unlockTime || 0;

        const feePerByte =
            this.m_config.activateFeePerByteTransactions || Config.activateFeePerByteTransactions || false;

        if (randomOutputs.length !== inputs.length && mixin !== 0) {
            throw new Error('The sets of random outputs supplied does not match the number of inputs supplied');
        }

        for (const randomOutput of randomOutputs) {
            if (randomOutput.length < mixin) {
                throw new Error('There are not enough random outputs to mix with');
            }
        }

        let neededMoney = BigInteger.zero;
        let integratedPaymentId: string | undefined;

        for (const output of outputs) {
            if (output.amount <= 0) {
                throw new RangeError('Cannot create an output with an amount <= 0');
            }
            if (output.amount > (this.m_config.maximumOutputAmount || Config.maximumOutputAmount)) {
                throw new RangeError('Cannot create an output with an amount > ' +
                    (this.m_config.maximumOutputAmount || Config.maximumOutputAmount));
            }
            neededMoney = neededMoney.add(output.amount);
            if (neededMoney.greater(UINT64_MAX)) {
                throw new RangeError('Total output amount exceeds UINT64_MAX');
            }
            /* Check to see if our destination contains differeing payment IDs via integrated addresses */
            if (output.destination.paymentId) {
                if (!integratedPaymentId) {
                    integratedPaymentId = output.destination.paymentId;
                } else if (integratedPaymentId && integratedPaymentId !== output.destination.paymentId) {
                    throw new Error('Cannot perform multiple transfers with differing integrated addresses');
                }
            }
        }

        /* If we found an integrated payment ID in the destinations and we supplied a payment ID
        in our call to this method and they do not match, this will result in a failure */
        if (integratedPaymentId && paymentId && integratedPaymentId !== paymentId) {
            throw new Error('Transfer destinations contains an integrated payment ID that does not match the payment' +
                'ID supplied to this method');
        }

        let foundMoney = BigInteger.zero;

        for (const input of inputs) {
            if (input.amount <= 0) {
                throw new RangeError('Cannot spend outputs with an amount <= 0');
            }
            foundMoney = foundMoney.add(input.amount);
            if (foundMoney.greater(UINT64_MAX)) {
                throw new RangeError('Total input amount exceeds UINT64_MAX');
            }
        }

        if (neededMoney.greater(foundMoney)) {
            throw new Error('We need more funds than was currently supplied for the transaction');
        }

        const change = foundMoney.subtract(neededMoney);

        if (!feePerByte && feeAmount && change.lesser(feeAmount)) {
            throw new Error('We have not spent all of what we sent in');
        }

        const transactionInputs = await prepareTransactionInputs(inputs, randomOutputs, mixin);

        // Use the ledger to get our random pair of keys for the one-time transaction keys
        const tx_keys = await this.m_ledger.getRandomKeyPair();

        const transactionOutputs = await prepareTransactionOutputs(tx_keys, outputs);

        if (transactionOutputs.outputs.length >
            (this.m_config.maximumOutputsPerTransaction || Config.maximumOutputsPerTransaction)) {
            throw new RangeError('Tried to create a transaction with more outputs than permitted');
        }

        if (feeAmount === 0) {
            if (transactionInputs.length < 12) {
                throw new Error('Sending a [0] fee transaction (fusion) requires a minimum of [' +
                    (this.m_config.fusionMinInputCount || Config.fusionMinInputCount) + '] inputs');
            }
            const ratio = this.m_config.fusionMinInOutCountRatio || Config.fusionMinInOutCountRatio;
            if ((transactionInputs.length / transactionOutputs.outputs.length) < ratio) {
                throw new Error('Sending a [0] fee transaction (fusion) requires the ' +
                    'correct input:output ratio be met');
            }
        }

        const tx = new Transaction();
        tx.unlockTime = BigInteger(unlockTime);
        await tx.addPublicKey(transactionOutputs.transactionKeys.publicKey);
        tx.transactionKeys = transactionOutputs.transactionKeys;

        if (integratedPaymentId) {
            tx.addPaymentId(integratedPaymentId);
        } else if (paymentId) {
            tx.addPaymentId(paymentId);
        }

        if (extraData) {
            if (!(extraData instanceof Buffer)) {
                extraData = (typeof extraData === 'string')
                    ? Buffer.from(extraData)
                    : Buffer.from(JSON.stringify(extraData));
            }

            tx.addData(extraData);
        }

        transactionInputs.sort((a, b) => {
            return (BigInteger(a.keyImage, 16).compare(BigInteger(b.keyImage, 16)) * -1);
        });

        for (const input of transactionInputs) {
            let offsets: BigInteger.BigInteger[] = [];

            input.outputs.forEach((output) => offsets.push(BigInteger(output.index)));

            offsets = Common.absoluteToRelativeOffsets(offsets);

            tx.inputs.push(new TransactionInputs.KeyInput(input.amount, offsets, input.keyImage));
        }

        for (const output of transactionOutputs.outputs) {
            tx.outputs.push(new TransactionOutputs.KeyOutput(output.amount, output.key));
        }

        if (tx.extra.length > (this.m_config.maximumExtraSize || Config.maximumExtraSize)) {
            throw new Error('Transaction extra exceeds the limit of [' +
                (this.m_config.maximumExtraSize || Config.maximumExtraSize) + '] bytes');
        }

        return {
            transaction: tx,
            inputs: transactionInputs
        };
    }

    /**
     * Constructs a new Transaction using the supplied values.
     * The resulting transaction can be broadcasted to the TurtleCoin network
     * @async
     * @param outputs the new outputs for the transaction (TO)
     * @param inputs outputs we will be spending (FROM)
     * @param randomOutputs the random outputs to use for mixing
     * @param mixin the number of mixins to use
     * @param [feeAmount] the transaction fee amount to pay
     * @param [paymentId] the payment ID to use in the transaction,
     * @param [unlockTime] the unlock time or block height for the transaction
     * @param [extraData] arbitrary extra data to include in the transaction extra field
     * @param [randomKey] a random scalar (private key)
     * @returns the newly created transaction object with prepared signatures
     */
    public async prepareTransaction (
        outputs: Interfaces.GeneratedOutput[],
        inputs: Interfaces.Output[],
        randomOutputs: Interfaces.RandomOutput[][],
        mixin: number,
        feeAmount?: number,
        paymentId?: string,
        unlockTime?: number,
        extraData?: any,
        randomKey?: string
    ): Promise<Interfaces.PreparedTransaction> {
        const feePerByte =
            this.m_config.activateFeePerByteTransactions || Config.activateFeePerByteTransactions || false;

        const prepared = await this.createTransactionStructure(
            outputs, inputs, randomOutputs, mixin, feeAmount, paymentId, unlockTime, extraData
        );

        const recipients: Interfaces.TransactionRecipient[] = [];

        for (const output of outputs) {
            recipients.push({
                address: await output.destination.address(),
                amount: output.amount
            });
        }

        const txPrefixHash = await prepared.transaction.prefixHash();

        const promises = [];

        for (let i = 0; i < prepared.inputs.length; i++) {
            const input = prepared.inputs[i];
            const srcKeys: string[] = [];

            input.outputs.forEach((out) => srcKeys.push(out.key));

            promises.push(
                prepareRingSignatures(
                    txPrefixHash,
                    input.keyImage,
                    srcKeys,
                    input.realOutputIndex,
                    input.input.transactionKeys.derivedKey,
                    input.input.transactionKeys.outputIndex,
                    i,
                    input.input.transactionKeys.publicKey,
                    randomKey));
        }

        const results = await Promise.all(promises);

        results.sort((a, b) => (a.index > b.index) ? 1 : -1);

        const signatures: string[][] = [];

        const signatureMeta: Interfaces.PreparedRingSignature[] = [];

        for (const result of results) {
            const sigSet: string[] = [];
            if (!result.signatures) {
                throw new Error('Prepared signatures are incomplete');
            }

            result.signatures.forEach((sig) => sigSet.push(sig));
            signatures.push(sigSet);

            const meta: Interfaces.PreparedRingSignature = {
                index: result.index,
                realOutputIndex: result.realOutputIndex,
                key: result.key,
                inputKeys: result.inputKeys,
                input: {
                    derivation: prepared.inputs[result.index].input.transactionKeys.derivedKey,
                    outputIndex: prepared.inputs[result.index].input.transactionKeys.outputIndex,
                    tx_public_key: prepared.inputs[result.index].input.transactionKeys.publicKey
                }
            };

            signatureMeta.push(meta);
        }

        prepared.transaction.signatures = signatures;

        const minimumFee = this.calculateMinimumTransactionFee(prepared.transaction.size);

        if (feeAmount && feeAmount !== 0 && feePerByte && feeAmount < minimumFee) {
            throw new Error('Transaction fee [' + prepared.transaction.fee +
                '] is not enough for network transmission: ' + minimumFee);
        }

        return {
            transaction: prepared.transaction,
            transactionRecipients: recipients,
            transactionPrivateKey: prepared.transaction.transactionKeys.privateKey,
            signatureMeta: signatureMeta
        };
    }

    /**
     * Completes a prepared transaction using the supplied private ephemeral
     * The resulting transaction can be broadcast to the network. Please note that the PreparedTransaction
     * signatures meta data must be updated to include the proper private ephemeral
     * @param preparedTransaction the prepared transaction
     * @param privateSpendKey the private spend key of the wallet that contains the funds
     * @returns the completed transaction
     */
    public async completeTransaction (
        preparedTransaction: Interfaces.PreparedTransaction,
        privateSpendKey: string | undefined
    ): Promise<Transaction> {
        UNUSED(privateSpendKey);

        const promises = [];

        const tx = preparedTransaction.transaction;

        if (!preparedTransaction.signatureMeta) {
            throw new Error('No transaction signature meta data supplied');
        }

        for (const meta of preparedTransaction.signatureMeta) {
            if (!meta.input || !meta.input.derivation || !meta.input.outputIndex) {
                throw new Error('Meta data is missing critical information');
            }

            if (!meta.input.tx_public_key) {
                throw new Error('Transactions must be prepared by this class');
            }

            const public_ephemeral = await TurtleCoinCrypto.derivePublicKey(
                meta.input.derivation, meta.input.outputIndex, this.m_address.spend.publicKey);

            promises.push(completeRingSignatures(
                this.m_ledger,
                meta.input.tx_public_key,
                meta.input.outputIndex,
                public_ephemeral,
                meta.key,
                tx.signatures[meta.index],
                meta.realOutputIndex,
                meta.index,
                !this.m_config.ledgerDebug));
        }

        const results = await Promise.all(promises);

        for (const result of results) {
            tx.signatures[result.index] = result.signatures;
        }

        const prefixHash = await tx.prefixHash();

        const checkPromises = [];

        for (let i = 0; i < tx.inputs.length; i++) {
            checkPromises.push(checkRingSignatures(
                prefixHash,
                (tx.inputs[i] as TransactionInputs.KeyInput).keyImage,
                getInputKeys(preparedTransaction.signatureMeta, i),
                tx.signatures[i]
            ));
        }

        const validSigs = await Promise.all(checkPromises);

        for (const valid of validSigs) {
            if (!valid) {
                throw new Error('Could not complete ring signatures');
            }
        }

        return preparedTransaction.transaction;
    }
}

/** @ignore */
function UNUSED (val: any): any {
    return val || NULL_KEY;
}

/** @ignore */
function getInputKeys (preparedSignatures: Interfaces.PreparedRingSignature[], index: number): string[] {
    for (const meta of preparedSignatures) {
        if (meta.index === index) {
            if (meta.inputKeys) {
                return meta.inputKeys;
            }
        }
    }

    throw new Error('Could not locate input keys in the prepared signatures');
}

/** @ignore */
function prepareTransactionInputs (
    inputs: Interfaces.Output[],
    randomOutputs: Interfaces.RandomOutput[][],
    mixin: number): Interfaces.PreparedInput[] {
    if (inputs.length !== randomOutputs.length && mixin !== 0) {
        throw new Error('There are not enough random output sets to mix with the real outputs');
    }

    for (const randomOutput of randomOutputs) {
        if (randomOutput.length < mixin) {
            throw new Error('There are not enough random outputs to mix with');
        }
    }

    const mixedInputs: Interfaces.PreparedInput[] = [];

    for (let i = 0; i < inputs.length; i++) {
        const mixedOutputs: Interfaces.PreparedInputOutputs[] = [];
        const realOutput = inputs[i];

        if (!realOutput.keyImage) {
            throw new Error('input is missing its key image');
        }

        if (!realOutput.input) {
            throw new Error('input is missing mandatory data fields');
        }

        if (realOutput.amount <= 0) {
            throw new RangeError('Real inputs cannot have an amount <= 0');
        }

        if (mixin !== 0) {
            const fakeOutputs = randomOutputs[i];

            fakeOutputs.sort((a, b) => {
                return BigInteger(a.globalIndex).compare(b.globalIndex);
            });

            for (const fakeOutput of fakeOutputs) {
                if (mixedOutputs.length === mixin) {
                    continue;
                }

                if (fakeOutput.globalIndex === realOutput.globalIndex) {
                    continue;
                }

                mixedOutputs.push({
                    key: fakeOutput.key,
                    index: fakeOutput.globalIndex
                });
            }

            if (mixedOutputs.length < mixin) {
                throw new Error('It is impossible to mix with yourself. Find some more random outputs and try again.');
            }
        }

        mixedOutputs.push({
            key: realOutput.key,
            index: realOutput.globalIndex
        });

        mixedOutputs.sort((a, b) => {
            return BigInteger(a.index).compare(b.index);
        });

        const input = {
            amount: realOutput.amount,
            realOutputIndex: 0,
            keyImage: realOutput.keyImage,
            input: realOutput.input,
            outputs: mixedOutputs
        };

        for (let j = 0; j < mixedOutputs.length; j++) {
            if (mixedOutputs[j].index === realOutput.globalIndex) {
                input.realOutputIndex = j;
            }
        }

        mixedInputs.push(input);
    }

    return mixedInputs;
}

/** @ignore */
async function prepareTransactionOutputs (
    transactionKeys: KeyPair,
    outputs: Interfaces.GeneratedOutput[]
): Promise<Interfaces.PreparedOutputs> {
    async function prepareOutput (
        destination: Address,
        amount: number,
        index: number,
        privateKey: string
    ): Promise<Interfaces.PreparedOutput> {
        const outDerivation = await TurtleCoinCrypto.generateKeyDerivation(destination.view.publicKey, privateKey);

        const outPublicEphemeral = await TurtleCoinCrypto.derivePublicKey(
            outDerivation,
            index,
            destination.spend.publicKey);

        return {
            amount,
            key: outPublicEphemeral
        };
    }

    outputs.sort((a, b) => (a.amount > b.amount) ? 1 : ((b.amount > a.amount) ? -1 : 0));

    const promises = [];

    for (let i = 0; i < outputs.length; i++) {
        const output = outputs[i];
        if (output.amount <= 0) {
            throw new RangeError('Amount cannot be <= 0');
        }

        promises.push(prepareOutput(output.destination, output.amount, i, transactionKeys.privateKey));
    }

    const preparedOutputs = await Promise.all(promises);

    return {
        transactionKeys,
        outputs: preparedOutputs
    };
}

/** @ignore */
async function prepareRingSignatures (
    hash: string,
    keyImage: string,
    publicKeys: string[],
    realOutputIndex: number,
    derivation: string,
    outputIndex: number,
    index: number,
    tx_public_key: string,
    randomKey?: string
): Promise<Interfaces.PreparedRingSignature> {
    const prepped = await TurtleCoinCrypto.prepareRingSignatures(
        hash, keyImage, publicKeys, realOutputIndex, randomKey);

    return {
        index: index,
        realOutputIndex: realOutputIndex,
        key: prepped.k,
        signatures: prepped.signatures,
        inputKeys: publicKeys,
        input: {
            derivation,
            outputIndex,
            tx_public_key
        }
    };
}

/** @ignore */
async function checkRingSignatures (
    hash: string,
    keyImage: string,
    publicKeys: string[],
    signatures: string[]
): Promise<boolean> {
    return TurtleCoinCrypto.checkRingSignatures(hash, keyImage, publicKeys, signatures);
}

/** @ignore */
async function completeRingSignatures (
    ledger: LedgerDevice,
    tx_public_key: string,
    outputIndex: number,
    tx_output_key: string,
    key: string,
    signatures: string[],
    realOutputIndex: number,
    index: number,
    confirm: boolean
): Promise<Interfaces.GeneratedRingSignatures> {
    signatures[realOutputIndex] = await ledger.completeRingSignature(tx_public_key,
        outputIndex, tx_output_key, key, signatures[realOutputIndex], confirm);

    return { signatures, index };
}
