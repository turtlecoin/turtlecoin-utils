// Copyright (c) 2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import Transport from '@ledgerhq/hw-transport';
import { Reader, Writer } from '@turtlecoin/bytestream';
import { EventEmitter } from 'events';
import { Address, KeyPair, Keys, Transaction } from './';
import { LedgerTypes } from './Types/Ledger';
import { Config, ICoinConfig, ICoinRunningConfig } from './Config';
import { Common } from './Common';
import * as semver from 'semver';

/** @ignore */
export { Transport as LedgerTransport };

/** @ignore */
const IDENT = '547572746c65436f696e206973206e6f742061204d6f6e65726f20666f726b21';

/**
 * An easy to use interface that uses a Ledger HW transport to communicate with
 * the TurtleCoin application running on a ledger device.
 * Please see. See https://github.com/LedgerHQ/ledgerjs for available transport providers
 */
export class LedgerDevice extends EventEmitter {
    private readonly m_transport: Transport;
    private readonly m_config: ICoinRunningConfig = Config;

    /**
     * Creates a new instance of the Ledger interface
     * The transport MUST be connected already before passing to this constructor
     * @param transport See https://github.com/LedgerHQ/ledgerjs for available transport providers
     * @param config coin configuration
     */
    constructor (transport: Transport, config?: ICoinConfig) {
        super();

        if (config) {
            this.m_config = Common.mergeConfig(config);
        }

        this.m_transport = transport;
    }

    /**
     * Returns the underlying transport
     */
    public get transport (): Transport {
        return this.m_transport;
    }

    /**
     * Event that is emitted right before the raw bytes are sent via the APDU transport
     * @param event the event name
     * @param listener the listener function
     */
    public on(event: 'send', listener: (data: string) => void): this;

    /**
     * Emits the raw bytes received from the APDU transport in response to a request
     * @param event the event name
     * @param listener the listener function
     */
    public on(event: 'receive', listener: (data: string) => void): this;

    /** @ignore */
    public on (event: any, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    /**
     * Retrieves the current version of the application running
     * on the ledger device
     */
    public async getVersion (): Promise<{ major: number, minor: number, patch: number }> {
        const result = await this.exchange(LedgerTypes.Command.VERSION);

        return {
            major: result.uint8_t().toJSNumber(),
            minor: result.uint8_t().toJSNumber(),
            patch: result.uint8_t().toJSNumber()
        };
    }

    /**
     * Returns if the application running on the ledger is a debug build
     */
    public async isDebug (): Promise<boolean> {
        const result = await this.exchange(LedgerTypes.Command.DEBUG);

        return (result.uint8_t().toJSNumber() === 1);
    }

    /**
     * Retrieves the current identification bytes of the application
     * running on the ledger device
     */
    public async getIdent (): Promise<string> {
        const result = await this.exchange(LedgerTypes.Command.IDENT);

        return result.unreadBuffer.toString('hex');
    }

    /**
     * Checks to make sure that the application running on the ledger
     * at least claims to be the TurtleCoin ledger application
     */
    public async checkIdent (): Promise<boolean> {
        const ident = await this.getIdent();

        return ident === IDENT;
    }

    /**
     * Checks to
     */
    public async checkVersion (requiredVersion: string): Promise<boolean> {
        if (!semver.valid(requiredVersion)) {
            throw new Error('Invalid required version supplied');
        }

        const l_version = await this.getVersion();

        const version = [l_version.major, l_version.minor, l_version.patch].join('.');

        if (!semver.valid(version)) {
            return false;
        }

        return semver.gte(version, requiredVersion);
    }

    /**
     * Checks to confirm that the key is a valid public key
     * @param key the key to check
     */
    public async checkKey (key: string): Promise<boolean> {
        if (!isHex64(key)) {
            throw new Error('Malformed key supplied');
        }

        const writer = new Writer();

        writer.hash(key);

        const result = await this.exchange(LedgerTypes.Command.CHECK_KEY, undefined, writer.buffer);

        return (result.uint8_t().toJSNumber() === 1);
    }

    /**
     * Checks to confirm that the scalar is indeed a scalar value
     * @param scalar the scalar to check
     */
    public async checkScalar (scalar: string): Promise<boolean> {
        if (!isHex64(scalar)) {
            throw new Error('Malformed key supplied');
        }

        const writer = new Writer();

        writer.hash(scalar);

        const result = await this.exchange(LedgerTypes.Command.CHECK_SCALAR, undefined, writer.buffer);

        return (result.uint8_t().toJSNumber() === 1);
    }

    /**
     * Retrieves the public keys from the connected ledger device
     * @param confirm whether the device will prompt the user to confirm their actions
     *        (to disable, must be running a DEBUG build)
     */
    public async getPublicKeys (confirm = true): Promise<Keys> {
        const result = await this.exchange(LedgerTypes.Command.PUBLIC_KEYS, confirm);

        const spend = await KeyPair.from(result.hash());

        const view = await KeyPair.from(result.hash());

        return Keys.from(spend, view);
    }

    /**
     * Retrieves the private view key from the connected ledger device
     * @param confirm whether the device will prompt the user to confirm their actions
     *        (to disable, must be running a DEBUG build)
     */
    public async getPrivateViewKey (confirm = true): Promise<KeyPair> {
        const result = await this.exchange(LedgerTypes.Command.VIEW_SECRET_KEY, confirm);

        return KeyPair.from(undefined, result.hash());
    }

    /**
     * Retrieves the private spend key from the connected ledger device
     * !! WARNING !! Retrieving the private spend key from the device
     * may result in a complete loss of funds as the private spend key
     * should normally remain on the device and never leave
     *
     * @param confirm whether the device will prompt the user to confirm their actions
     *        (to disable, must be running a DEBUG build)
     */
    public async getPrivateSpendKey (confirm = true): Promise<KeyPair> {
        const result = await this.exchange(LedgerTypes.Command.SPEND_SECRET_KEY, confirm);

        return KeyPair.from(undefined, result.hash());
    }

    /**
     * Retrieves the the public spend key and private view key from the
     * ledger device which is essentially a view only wallet
     * @param confirm whether the device will prompt the user to confirm their actions
     *        (to disable, must be running a DEBUG build)
     */
    public async getViewWallet (confirm = true): Promise<Address> {
        const result = await this.exchange(LedgerTypes.Command.WALLET_KEYS, confirm);

        return Address.fromViewOnlyKeys(result.hash(), result.hash());
    }

    /**
     * Calculates the public key for the given private key
     * @param private_key the private key
     */
    public async privateToPublic (private_key: string): Promise<KeyPair> {
        if (!isHex64(private_key)) {
            throw new Error('Malformed private_key supplied');
        }

        const writer = new Writer();

        writer.hash(private_key);

        const result = await this.exchange(LedgerTypes.Command.PRIVATE_TO_PUBLIC, undefined, writer.buffer);

        return KeyPair.from(result.hash());
    }

    /**
     * Generates a random key pair on the connected device
     */
    public async getRandomKeyPair (): Promise<KeyPair> {
        const result = await this.exchange(LedgerTypes.Command.RANDOM_KEY_PAIR);

        return KeyPair.from(result.hash(), result.hash());
    }

    /**
     * Gets the public wallet address from the connected device
     * @param confirm whether the device will prompt the user to confirm their actions
     *        (to disable, must be running a DEBUG build)
     */
    public async getAddress (confirm = true): Promise<Address> {
        const result = await this.exchange(LedgerTypes.Command.ADDRESS, confirm);

        return Address.fromAddress(result.unreadBuffer.toString());
    }

    /**
     * Generates a key image on the device using the supplied parameters
     * @param tx_public_key the transaction public key
     * @param output_index the index of the given output in the transaction
     * @param output_key the key of the given output in the transaction
     * @param confirm whether the device will prompt the user to confirm their actions
     *        (to disable, must be running a DEBUG build)
     */
    public async generateKeyImage (
        tx_public_key: string,
        output_index: number,
        output_key: string,
        confirm = true
    ): Promise<string> {
        if (!isHex64(tx_public_key)) {
            throw new Error('Malformed tx_public_key supplied');
        }

        if (output_index < 0) {
            throw new Error('output_index must be >= 0');
        }

        if (!isHex64(output_key)) {
            throw new Error('Malformed output_key supplied');
        }

        const writer = new Writer();

        writer.hash(tx_public_key);

        writer.uint32_t(output_index, true);

        writer.hash(output_key);

        const result = await this.exchange(LedgerTypes.Command.GENERATE_KEY_IMAGE, confirm, writer.buffer);

        return result.hash();
    }

    /**
     * Generates a key image on the device using the supplied parameters
     * @param derivation the output derivation
     * @param output_index the index of the given output in the transaction
     * @param output_key the key of the given output in the transaction
     * @param confirm whether the device will prompt the user to confirm their actions
     *        (to disable, must be running a DEBUG build)
     */
    public async generateKeyImagePrimitive (
        derivation: string,
        output_index: number,
        output_key: string,
        confirm = true
    ): Promise<string> {
        if (!isHex64(derivation)) {
            throw new Error('Malformed derivation supplied');
        }

        if (output_index < 0) {
            throw new Error('output_index must be >= 0');
        }

        if (!isHex64(output_key)) {
            throw new Error('Malformed output_key supplied');
        }

        const writer = new Writer();

        writer.hash(derivation);

        writer.uint32_t(output_index, true);

        writer.hash(output_key);

        const result = await this.exchange(LedgerTypes.Command.GENERATE_KEY_IMAGE_PRIMITIVE, confirm, writer.buffer);

        return result.hash();
    }

    /**
     * Completes the given ring signature for using the supplied parameters
     * @param tx_public_key the transaction public key of the input used
     * @param output_index the index of the given output in the transaction of the input used
     * @param output_key the key of the given output in the transaction of the input used
     * @param k the random scalar returned by preparing the signatures before completion
     * @param signature the incomplete ring signature for the given input
     * @param confirm whether the device will prompt the user to confirm their actions
     *        (to disable, must be running a DEBUG build)
     */
    public async completeRingSignature (
        tx_public_key: string,
        output_index: number,
        output_key: string,
        k: string,
        signature: string,
        confirm = true
    ): Promise<string> {
        if (!isHex64(tx_public_key)) {
            throw new Error('Malformed tx_public_key supplied');
        }

        if (output_index < 0) {
            throw new Error('output_index must be >= 0');
        }

        if (!isHex64(output_key)) {
            throw new Error('Malformed output_key supplied');
        }

        if (!isHex64(k)) {
            throw new Error('Malformed k supplied');
        }

        if (!isHex128(signature)) {
            throw new Error('Malformed signature supplied');
        }

        const writer = new Writer();

        writer.hash(tx_public_key);

        writer.uint32_t(output_index, true);

        writer.hash(output_key);

        writer.hash(k);

        writer.hex(signature);

        const result = await this.exchange(LedgerTypes.Command.COMPLETE_RING_SIGNATURE, confirm, writer.buffer);

        return result.hex(64);
    }

    /**
     * Generates the ring signatures for the given inputs on the ledger device
     * without revealing the private spend key
     * @param tx_public_key the transaction public key of input being spent
     * @param output_index the index of the input being spent in the transaction
     * @param output_key the output key of the input being spent
     * @param tx_prefix_hash our transaction prefix hash
     * @param input_keys the ring participant keys (mixins + us)
     * @param real_output_index the index of the real output in the input_keys
     * @param confirm whether the device will prompt the user to confirm their actions
     *        (to disable, must be running a DEBUG build)
     */
    public async generateRingSignatures (
        tx_public_key: string,
        output_index: number,
        output_key: string,
        tx_prefix_hash: string,
        input_keys: string[],
        real_output_index: number,
        confirm = true
    ): Promise<string[]> {
        if (!isHex64(tx_public_key)) {
            throw new Error('Malformed tx_public_key supplied');
        }

        if (output_index < 0) {
            throw new Error('output_index must be >= 0');
        }

        if (!isHex64(output_key)) {
            throw new Error('Malformed output_key supplied');
        }

        if (!isHex64(tx_prefix_hash)) {
            throw new Error('Malformed tx_prefix_hash supplied');
        }

        if (real_output_index < 0) {
            throw new Error('real_output_index must be >= 0');
        }

        if (input_keys.length === 0) {
            throw new Error('Must supply at least one input_key');
        }

        for (const key of input_keys) {
            if (!isHex64(key)) {
                throw new Error('Malformed input_key supplied');
            }
        }

        const signatures: string[] = [];

        const writer = new Writer();

        writer.hash(tx_public_key);

        writer.uint32_t(output_index, true);

        writer.hash(output_key);

        writer.hash(tx_prefix_hash);

        for (const input of input_keys) {
            writer.hash(input);
        }

        writer.uint32_t(real_output_index, true);

        const result = await this.exchange(LedgerTypes.Command.GENERATE_RING_SIGNATURES, confirm, writer.buffer);

        if (result.length % 64 !== 0) {
            throw new Error('Data returned does not appear to be a set of signatures');
        }

        while (result.unreadBytes > 0) {
            signatures.push(result.hex(64));
        }

        if (signatures.length !== input_keys.length) {
            throw new Error('Returned signature count does not match the number of input keys supplied');
        }

        return signatures;
    }

    /**
     * Generates a signature of the message digest using the private spend key stored
     * on the ledger device without revealing the private spend key
     * @param message_digest the message digest (hash)
     * @param confirm whether the device will prompt the user to confirm their actions
     *        (to disable, must be running a DEBUG build)
     */
    public async generateSignature (
        message_digest: string,
        confirm = true
    ): Promise<string> {
        if (!isHex64(message_digest)) {
            throw new Error('Malformed message_digest supplied');
        }

        const writer = new Writer();

        writer.hash(message_digest);

        const result = await this.exchange(LedgerTypes.Command.GENERATE_SIGNATURE, confirm, writer.buffer);

        if (result.length !== 64) {
            throw new Error('Data returned does not appear to be a signature');
        }

        return result.hex(64);
    }

    /**
     * Generates the transaction key derivation using the private view key stored
     * on the ledger device
     * @param tx_public_key the transactions public key
     * @param confirm whether the device will prompt the user to confirm their actions
     *        (to disable, must be running a DEBUG build)
     */
    public async generateKeyDerivation (
        tx_public_key: string,
        confirm = true
    ): Promise<string> {
        if (!isHex64(tx_public_key)) {
            throw new Error('Malformed tx_public_key supplied');
        }

        const writer = new Writer();

        writer.hash(tx_public_key);

        const result = await this.exchange(LedgerTypes.Command.GENERATE_KEY_DERIVATION, confirm, writer.buffer);

        return result.hash();
    }

    /**
     * Generates the public ephemeral of the given output in a transaction
     * @param derivation the key derivation
     * @param output_index the index of the output in the transaction
     * @param confirm whether the device will prompt the user to confirm their actions
     *        (to disable, must be running a DEBUG build)
     */
    public async derivePublicKey (
        derivation: string,
        output_index: number,
        confirm = true
    ): Promise<KeyPair> {
        if (!isHex64(derivation)) {
            throw new Error('Malformed derivation supplied');
        }

        if (output_index < 0) {
            throw new Error('output_index must be >= 0');
        }

        const writer = new Writer();

        writer.hash(derivation);

        writer.uint32_t(output_index, true);

        const result = await this.exchange(LedgerTypes.Command.DERIVE_PUBLIC_KEY, confirm, writer.buffer);

        return KeyPair.from(result.hash());
    }

    /**
     * Generates the private ephemeral of the given output in a transaction
     * @param derivation the key derivation
     * @param output_index the index of the output in the transaction
     * @param confirm whether the device will prompt the user to confirm their actions
     *        (to disable, must be running a DEBUG build)
     */
    public async deriveSecretKey (
        derivation: string,
        output_index: number,
        confirm = true
    ): Promise<KeyPair> {
        if (!isHex64(derivation)) {
            throw new Error('Malformed derivation supplied');
        }

        if (output_index < 0) {
            throw new Error('output_index must be >= 0');
        }

        const writer = new Writer();

        writer.hash(derivation);

        writer.uint32_t(output_index, true);

        const result = await this.exchange(LedgerTypes.Command.DERIVE_SECRET_KEY, confirm, writer.buffer);

        return KeyPair.from(undefined, result.hash());
    }

    /**
     * Checks a given signature using the supplied public key for validity
     * @param message_digest the message digest (hash)
     * @param public_key the public key of the private key used to sign the transaction
     * @param signature the signature to validate
     */
    public async checkSignature (
        message_digest: string,
        public_key: string,
        signature: string
    ): Promise<boolean> {
        if (!isHex64(message_digest)) {
            throw new Error('Malformed message_disgest supplied');
        }

        if (!isHex64(public_key)) {
            throw new Error('Malformed public_key supplied');
        }

        if (!isHex128(signature)) {
            throw new Error('Malformed signature supplied');
        }

        const writer = new Writer();

        writer.hash(message_digest);

        writer.hash(public_key);

        writer.hex(signature);

        const result = await this.exchange(LedgerTypes.Command.CHECK_SIGNATURE, undefined, writer.buffer);

        return (result.uint8_t().toJSNumber() === 1);
    }

    /**
     * Checks the ring signatures given for their validity to verify that the proper
     * private key was used for signing purposes
     * @param tx_prefix_hash the transaction prefix hash
     * @param key_image the key image spent in the input
     * @param public_keys the ring participant keys
     * @param signatures the signatures to verify
     */
    public async checkRingSignatures (
        tx_prefix_hash: string,
        key_image: string,
        public_keys: string[],
        signatures: string[]
    ): Promise<boolean> {
        if (!isHex64(tx_prefix_hash)) {
            throw new Error('Malformed tx_prefix_hash supplied');
        }

        if (!isHex64(key_image)) {
            throw new Error('Malformed key_image supplied');
        }

        if (public_keys.length === 0) {
            throw new Error('Must supply at least one public_key');
        }

        if (signatures.length === 0) {
            throw new Error('Must supply at least one signature');
        }

        if (public_keys.length !== signatures.length) {
            throw new Error('The number of public_keys and signatures does not match');
        }

        for (const key of public_keys) {
            if (!isHex64(key)) {
                throw new Error('Malformed public_key supplied');
            }
        }

        for (const sig of signatures) {
            if (!isHex128(sig)) {
                throw new Error('Malformed signature supplied');
            }
        }

        const writer = new Writer();

        writer.hash(tx_prefix_hash);

        writer.hash(key_image);

        for (const key of public_keys) {
            writer.hash(key);
        }

        for (const sig of signatures) {
            writer.hex(sig);
        }

        const result = await this.exchange(LedgerTypes.Command.CHECK_RING_SIGNATURES, undefined, writer.buffer);

        return (result.uint8_t().toJSNumber() === 1);
    }

    /**
     * Resets the keys on the ledger device the same way that they
     * are first initialized on the device
     * @param confirm
     */
    public async resetKeys (
        confirm = true
    ): Promise<void> {
        await this.exchange(LedgerTypes.Command.RESET_KEYS, confirm);
    }

    /**
     * Retrieves the current state of the transaction construction process on the ledger device
     */
    public async transactionState (): Promise<LedgerTypes.TransactionState> {
        const result = await this.exchange(LedgerTypes.Command.TX_STATE, undefined);

        return result.uint8_t().toJSNumber();
    }

    /**
     * Resets the transaction state of the transaction construction process on the ledger device
     */
    public async resetTransaction (
        confirm = true
    ): Promise<void> {
        await this.exchange(LedgerTypes.Command.TX_RESET, confirm);
    }

    /**
     * Starts a new transaction construction on the ledger device
     * @param unlock_time the unlock time (or block) of the transaction
     * @param input_count the number of inputs that will be included in the transaction
     * @param output_count the number of outputs that will be included in the transaction
     * @param tx_public_key the transaction public key
     * @param payment_id the transaction payment id if one needs to be included
     */
    public async startTransaction (
        unlock_time = 0,
        input_count = 0,
        output_count = 0,
        tx_public_key: string,
        payment_id?: string
    ): Promise<void> {
        if (input_count > 90 || input_count < 0) {
            throw new RangeError('input_count not in range');
        }

        if (output_count > 90 || output_count < 0) {
            throw new RangeError('output_count not in range');
        }

        if (!isHex64(tx_public_key)) {
            throw new Error('Malformed tx_public_key supplied');
        }

        if (payment_id) {
            if (!isHex64(payment_id)) {
                throw new Error('Malformed payment_id supplied');
            }
        }

        const writer = new Writer();

        writer.uint64_t(unlock_time, true);

        writer.uint8_t(input_count);

        writer.uint8_t(output_count);

        writer.hash(tx_public_key);

        if (payment_id) {
            writer.uint8_t(1);

            writer.hash(payment_id);
        } else {
            writer.uint8_t(0);
        }

        await this.exchange(LedgerTypes.Command.TX_START, undefined, writer.buffer);
    }

    /**
     * Signals to the ledger that we are ready to start loading transaction inputs
     */
    public async startTransactionInputLoad (): Promise<void> {
        await this.exchange(LedgerTypes.Command.TX_START_INPUT_LOAD, undefined);
    }

    /**
     * Load a transaction input to the transaction construction process
     * @param input_tx_public_key the transaction public key of the input
     * @param input_output_index the output index of the transaction of the input
     * @param amount the amount of the input
     * @param public_keys the ring participant keys
     * @param offsets the RELATIVE offsets of the ring participant keys
     * @param real_output_index the index in the public_keys of the real output being spent
     */
    public async loadTransactionInput (
        input_tx_public_key: string,
        input_output_index: number,
        amount: number,
        public_keys: string[],
        offsets: number[],
        real_output_index: number
    ): Promise<void> {
        if (!isHex64(input_tx_public_key)) {
            throw new Error('Malformed input_tx_public_key');
        }

        if (input_output_index > 255 || input_output_index < 0) {
            throw new RangeError('input_output_index out of range');
        }

        if (amount > this.m_config.maximumOutputAmount || amount < 0) {
            throw new RangeError('amount out of range');
        }

        if (public_keys.length !== 4) {
            throw new Error('Must supply four (4) public_key values');
        }

        for (const key of public_keys) {
            if (!isHex64(key)) {
                throw new Error('Malformed public_key supplied');
            }
        }

        if (offsets.length !== 4) {
            throw new Error('Must supply four (4) offset values');
        }

        for (const offset of offsets) {
            if (offset < 0 || offset > 4294967295) {
                throw new RangeError('offset value out of range');
            }
        }

        if (real_output_index > 3 || real_output_index < 0) {
            throw new RangeError('real_output_index out of range');
        }

        const writer = new Writer();

        writer.hash(input_tx_public_key);

        writer.uint8_t(input_output_index);

        writer.uint64_t(amount, true);

        for (const key of public_keys) {
            writer.hash(key);
        }

        for (const offset of offsets) {
            writer.uint32_t(offset, true);
        }

        writer.uint8_t(real_output_index);

        await this.exchange(LedgerTypes.Command.TX_LOAD_INPUT, undefined, writer.buffer);
    }

    /**
     * Signals to the ledger that we are ready to start loading transaction outputs
     */
    public async startTransactionOutputLoad (): Promise<void> {
        await this.exchange(LedgerTypes.Command.TX_START_OUTPUT_LOAD, undefined);
    }

    /**
     * Load a transaction output to the transaction construction process
     * @param amount the amount of the output
     * @param output_key the output key
     */
    public async loadTransactionOutput (
        amount: number,
        output_key: string
    ): Promise<void> {
        if (amount < 0 || amount > this.m_config.maximumOutputAmount) {
            throw new Error('amount out of range');
        }

        if (!isHex64(output_key)) {
            throw new Error('Malformed output_key supplied');
        }

        const writer = new Writer();

        writer.uint64_t(amount, true);

        writer.hash(output_key);

        await this.exchange(LedgerTypes.Command.TX_LOAD_OUTPUT, undefined, writer.buffer);
    }

    /**
     * Finalizes a transaction prefix
     */
    public async finalizeTransactionPrefix (): Promise<void> {
        await this.exchange(LedgerTypes.Command.TX_FINALIZE_TX_PREFIX, undefined);
    }

    /**
     * Instructs the ledger device to sign the transaction we have constructed
     */
    public async signTransaction (
        confirm = true
    ): Promise<{ hash: string, size: number }> {
        const result = await this.exchange(LedgerTypes.Command.TX_SIGN, confirm);

        return {
            hash: result.hash(),
            size: result.uint16_t(true).toJSNumber()
        };
    }

    /**
     * Exports the completed full transaction that we constructed from the ledger device
     */
    public async retrieveTransaction (): Promise<Transaction> {
        const response = new Writer();

        while (response.length < this.m_config.maximumLedgerTransactionSize) {
            const writer = new Writer();

            writer.uint16_t(response.length, true);

            const result = await this.exchange(LedgerTypes.Command.TX_DUMP, undefined, writer.buffer);

            // if we didn't receive any more data, then break out of the loop
            if (result.unreadBytes === 0) {
                break;
            }

            response.write(result.unreadBuffer);
        }

        return Transaction.from(response.buffer);
    }

    /**
     * Exchanges an APDU with the connected device
     * @param command the command to send
     * @param confirm whether the device will prompt the user to confirm their actions
     *        (to disable, must be running a DEBUG build)
     * @param data any data that must be included in the payload for the given command
     */
    private async exchange (command: LedgerTypes.Command, confirm = true, data?: Buffer): Promise<Reader> {
        const writer = new Writer();

        writer.uint8_t(LedgerTypes.APDU.INS);

        writer.uint8_t(command);

        if (confirm) {
            writer.uint8_t(LedgerTypes.APDU.P1_CONFIRM);
        } else {
            writer.uint8_t(LedgerTypes.APDU.P1_NON_CONFIRM);
        }

        writer.uint8_t(LedgerTypes.APDU.P2);

        if (data) {
            if (data.length > (this.m_config.maximumLedgerAPDUPayloadSize - 6)) {
                throw new Error('Data payload exceeds maximum size');
            }

            writer.uint16_t(data.length, true);

            writer.write(data);
        } else {
            writer.uint16_t(0);
        }

        this.emit('send', writer.blob);

        const result = await this.m_transport.exchange(writer.buffer);

        this.emit('receive', (new Reader(result)).unreadBuffer.toString('hex'));

        const code = result.slice(result.length - 2);

        const response = new Reader(result.slice(0, result.length - code.length));

        const reader = new Reader(code);

        let errCode = reader.uint16_t(true).toJSNumber();

        if (errCode !== LedgerTypes.ErrorCode.OK) {
            if (response.length >= 2) {
                errCode = response.uint16_t(true).toJSNumber();
            }

            throw new LedgerTypes.LedgerError(errCode, 'Could not complete request');
        }

        return response;
    }
}

/**
 * @ignore
 */
function isHex (value: string): boolean {
    if (value.length % 2 !== 0) {
        return false;
    }

    const regex = new RegExp('^[0-9a-fA-F]{' + value.length + '}$');

    return regex.test(value);
}

/**
 * @ignore
 */
function isHex64 (value: string): boolean {
    return (isHex(value) && value.length === 64);
}

/**
 * @ignore
 */
function isHex128 (value: string): boolean {
    return (isHex(value) && value.length === 128);
}
