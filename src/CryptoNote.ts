// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import { Address } from './Address';
import { AddressPrefix } from './AddressPrefix';
import { Config, ICoinConfig, ICoinRunningConfig } from './Config';
import { Common } from './Common';
import {
    BigInteger,
    ED25519,
    TransactionInputs,
    TransactionOutputs,
    TurtleCoinCrypto,
    Interfaces,
    CryptoNoteInterfaces,
    ICryptoConfig
} from './Types';
import { Transaction } from './Transaction';
import { EventEmitter } from 'events';
import * as Numeral from 'numeral';
import ICryptoNote = CryptoNoteInterfaces.ICryptoNote;

/** @ignore */
const UINT64_MAX = BigInteger(2).pow(64);

/**
 * CryptoNote helper class for constructing transactions and performing
 * various other cryptographic items during the receipt or transfer
 * of funds on the network
 */
export class CryptoNote extends EventEmitter implements ICryptoNote {
    protected m_config: ICoinRunningConfig = Config;

    /**
     * Constructs a new instance of the object
     * If a configuration is supplied, it is also passed to the underlying
     * cryptographic library
     * @param config the base configuration to apply to our helper
     * @param cryptoConfig configuration to allow for overriding the provided cryptographic primitives
     */
    constructor (config?: ICoinConfig, cryptoConfig?: ICryptoConfig) {
        super();

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
     * This does nothing in this class
     */
    public async init (): Promise<void> {
        return undefined;
    }

    /**
     * This does nothing in this class
     */
    public async fetchKeys (): Promise<void> {
        return undefined;
    }

    /**
     * This does nothing in this class
     */
    public get address (): undefined {
        return undefined;
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
        privateViewKey: string
    ): Promise<string> {
        return TurtleCoinCrypto.generateKeyDerivation(
            transactionPublicKey, privateViewKey);
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
        privateViewKey: string,
        publicSpendKey: string,
        privateSpendKey: string,
        outputIndex: number
    ): Promise<CryptoNoteInterfaces.IKeyImage> {
        const derivation = await TurtleCoinCrypto.generateKeyDerivation(transactionPublicKey, privateViewKey);

        return this.generateKeyImagePrimitive(publicSpendKey, privateSpendKey, outputIndex, derivation);
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
        publicSpendKey: string,
        privateSpendKey: string,
        outputIndex: number,
        derivation: string
    ): Promise<CryptoNoteInterfaces.IKeyImage> {
        const publicEphemeral = await TurtleCoinCrypto.derivePublicKey(derivation, outputIndex, publicSpendKey);

        const privateEphemeral = await TurtleCoinCrypto.deriveSecretKey(derivation, outputIndex, privateSpendKey);

        const keyImage = await TurtleCoinCrypto.generateKeyImage(publicEphemeral, privateEphemeral);

        return {
            publicEphemeral: publicEphemeral,
            privateEphemeral: privateEphemeral,
            keyImage: keyImage
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
        privateViewKey: string,
        publicSpendKey: string,
        privateSpendKey?: string,
        generatePartial?: boolean
    ): Promise<Interfaces.Output> {
        const derivedKey = await TurtleCoinCrypto.generateKeyDerivation(transactionPublicKey, privateViewKey);

        const publicEphemeral = await TurtleCoinCrypto.derivePublicKey(derivedKey, output.index, publicSpendKey);

        if (publicEphemeral === output.key) {
            output.input = {
                publicEphemeral,
                transactionKeys: {
                    publicKey: transactionPublicKey,
                    derivedKey,
                    outputIndex: output.index
                }
            };

            if (privateSpendKey) {
                /*  If we are forcing the generation of a partial key image then we
                    use the supplied private spend key in the key generation instead of
                    the privateEphemeral that we don't have
                 */
                const privateEphemeral = (generatePartial)
                    ? privateSpendKey
                    : await TurtleCoinCrypto.deriveSecretKey(
                        derivedKey, output.index, privateSpendKey);

                const derivedPublicEphemeral = await TurtleCoinCrypto.secretKeyToPublicKey(privateEphemeral);

                if (derivedPublicEphemeral !== publicEphemeral && !generatePartial) {
                    throw new Error('Incorrect private spend key supplied');
                }

                const keyImage = await TurtleCoinCrypto.generateKeyImage(publicEphemeral, privateEphemeral);

                output.input.privateEphemeral = privateEphemeral;

                output.keyImage = keyImage;

                output.isPartialKeyImage = (generatePartial) || false;
            }

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
    public async signMessage (message: any, privateKey: string): Promise<string> {
        if (typeof message !== 'string') {
            message = JSON.stringify(message);
        }

        const publicKey = await TurtleCoinCrypto.secretKeyToPublicKey(privateKey);

        const hex = Buffer.from(message);

        const hash = await TurtleCoinCrypto.cn_fast_hash(hex.toString('hex'));

        return TurtleCoinCrypto.generateSignature(hash, publicKey, privateKey);
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
     * @returns the newly created transaction object
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
        const feePerByte =
            this.m_config.activateFeePerByteTransactions || Config.activateFeePerByteTransactions || false;

        const prepared = await this.createTransactionStructure(
            outputs, inputs, randomOutputs, mixin, feeAmount, paymentId, unlockTime, extraData
        );

        const txPrefixHash = await prepared.transaction.prefixHash();

        const promises = [];

        for (let i = 0; i < prepared.inputs.length; i++) {
            const input = prepared.inputs[i];
            const srcKeys: string[] = [];

            if (!input.input.privateEphemeral) {
                throw new Error('private ephemeral missing from input');
            }

            input.outputs.forEach((out) => srcKeys.push(out.key));

            promises.push(
                generateRingSignatures(
                    txPrefixHash,
                    input.keyImage,
                    srcKeys,
                    input.input.privateEphemeral,
                    input.realOutputIndex,
                    i));
        }

        const tmpSignatures = await Promise.all(promises);

        tmpSignatures.sort((a, b) => (a.index > b.index) ? 1 : -1);

        const signatures: string[][] = [];

        tmpSignatures.forEach((sigs) => {
            const sigSet: string[] = [];
            sigs.signatures.forEach((sig) => sigSet.push(sig));
            signatures.push(sigSet);
        });

        prepared.transaction.signatures = signatures;

        const minimumFee = this.calculateMinimumTransactionFee(prepared.transaction.size);

        if (feeAmount && feeAmount !== 0 && feePerByte && feeAmount < minimumFee) {
            throw new Error('Transaction fee [' + prepared.transaction.fee +
                '] is not enough for network transmission: ' + minimumFee);
        }

        return prepared.transaction;
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

        const transactionOutputs = await prepareTransactionOutputs(outputs);

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
                    ? Buffer.from(extraData) : Buffer.from(JSON.stringify(extraData));
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
                    outputIndex: prepared.inputs[result.index].input.transactionKeys.outputIndex
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
        privateSpendKey: string
    ): Promise<Transaction> {
        const promises = [];

        const tx = preparedTransaction.transaction;

        if (!preparedTransaction.signatureMeta) {
            throw new Error('No transaction signature meta data supplied');
        }

        for (const meta of preparedTransaction.signatureMeta) {
            if (!meta.input || !meta.input.derivation || !meta.input.outputIndex) {
                throw new Error('Meta data is missing critical information');
            }

            promises.push(completeRingSignatures(
                privateSpendKey,
                meta.input.derivation,
                meta.input.outputIndex,
                meta.realOutputIndex,
                meta.key,
                tx.signatures[meta.index],
                meta.index
            ));
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
async function checkRingSignatures (
    hash: string,
    keyImage: string,
    publicKeys: string[],
    signatures: string[]
): Promise<boolean> {
    return TurtleCoinCrypto.checkRingSignatures(hash, keyImage, publicKeys, signatures);
}

/** @ignore */
async function generateRingSignatures (
    hash: string,
    keyImage: string,
    publicKeys: string[],
    privateKey: string,
    realOutputIndex: number,
    index: number
): Promise<Interfaces.GeneratedRingSignatures> {
    const signatures = await TurtleCoinCrypto.generateRingSignatures(
        hash,
        keyImage,
        publicKeys,
        privateKey,
        realOutputIndex);

    const valid = await checkRingSignatures(hash, keyImage, publicKeys, signatures);

    if (!valid) {
        throw new Error('Could not generate ring signatures');
    }

    return { signatures, index };
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
async function completeRingSignatures (
    privateSpendKey: string,
    derivation: string,
    outputIndex: number,
    realOutputIndex: number,
    key: string,
    sigs: string[],
    index: number
): Promise<Interfaces.GeneratedRingSignatures> {
    const privateEphemeral = await TurtleCoinCrypto.deriveSecretKey(derivation, outputIndex, privateSpendKey);

    const signatures = await TurtleCoinCrypto.completeRingSignatures(privateEphemeral, realOutputIndex, key, sigs);

    return { signatures, index };
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
async function prepareTransactionOutputs (outputs: Interfaces.GeneratedOutput[]): Promise<Interfaces.PreparedOutputs> {
    async function prepareOutput (
        destination: Address,
        amount: number,
        index: number,
        privateKey: string): Promise<Interfaces.PreparedOutput> {
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

    const keys = await TurtleCoinCrypto.generateKeys();

    const transactionKeys: ED25519.KeyPair = await ED25519.KeyPair.from(keys.public_key, keys.private_key);

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
