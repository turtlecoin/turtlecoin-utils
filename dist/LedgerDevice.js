"use strict";
// Copyright (c) 2020, The TurtleCoin Developers
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
exports.LedgerDevice = exports.LedgerTransport = void 0;
const hw_transport_1 = require("@ledgerhq/hw-transport");
exports.LedgerTransport = hw_transport_1.default;
const bytestream_1 = require("@turtlecoin/bytestream");
const events_1 = require("events");
const _1 = require("./");
const Ledger_1 = require("./Types/Ledger");
const Config_1 = require("./Config");
const Common_1 = require("./Common");
const semver = require("semver");
/** @ignore */
const IDENT = '547572746c65436f696e206973206e6f742061204d6f6e65726f20666f726b21';
/**
 * An easy to use interface that uses a Ledger HW transport to communicate with
 * the TurtleCoin application running on a ledger device.
 * Please see. See https://github.com/LedgerHQ/ledgerjs for available transport providers
 */
class LedgerDevice extends events_1.EventEmitter {
    /**
     * Creates a new instance of the Ledger interface
     * The transport MUST be connected already before passing to this constructor
     * @param transport See https://github.com/LedgerHQ/ledgerjs for available transport providers
     * @param config coin configuration
     */
    constructor(transport, config) {
        super();
        this.m_config = Config_1.Config;
        if (config) {
            this.m_config = Common_1.Common.mergeConfig(config);
        }
        this.m_transport = transport;
    }
    /**
     * Returns the underlying transport
     */
    get transport() {
        return this.m_transport;
    }
    /** @ignore */
    on(event, listener) {
        return super.on(event, listener);
    }
    /**
     * Retrieves the current version of the application running
     * on the ledger device
     */
    getVersion() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.exchange(Ledger_1.LedgerTypes.Command.VERSION);
            return {
                major: result.uint8_t().toJSNumber(),
                minor: result.uint8_t().toJSNumber(),
                patch: result.uint8_t().toJSNumber()
            };
        });
    }
    /**
     * Returns if the application running on the ledger is a debug build
     */
    isDebug() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.exchange(Ledger_1.LedgerTypes.Command.DEBUG);
            return (result.uint8_t().toJSNumber() === 1);
        });
    }
    /**
     * Retrieves the current identification bytes of the application
     * running on the ledger device
     */
    getIdent() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.exchange(Ledger_1.LedgerTypes.Command.IDENT);
            return result.unreadBuffer.toString('hex');
        });
    }
    /**
     * Checks to make sure that the application running on the ledger
     * at least claims to be the TurtleCoin ledger application
     */
    checkIdent() {
        return __awaiter(this, void 0, void 0, function* () {
            const ident = yield this.getIdent();
            return ident === IDENT;
        });
    }
    /**
     * Checks to
     */
    checkVersion(requiredVersion) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!semver.valid(requiredVersion)) {
                throw new Error('Invalid required version supplied');
            }
            const l_version = yield this.getVersion();
            const version = [l_version.major, l_version.minor, l_version.patch].join('.');
            if (!semver.valid(version)) {
                return false;
            }
            return semver.gte(version, requiredVersion);
        });
    }
    /**
     * Checks to confirm that the key is a valid public key
     * @param key the key to check
     */
    checkKey(key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!isHex64(key)) {
                throw new Error('Malformed key supplied');
            }
            const writer = new bytestream_1.Writer();
            writer.hash(key);
            const result = yield this.exchange(Ledger_1.LedgerTypes.Command.CHECK_KEY, undefined, writer.buffer);
            return (result.uint8_t().toJSNumber() === 1);
        });
    }
    /**
     * Checks to confirm that the scalar is indeed a scalar value
     * @param scalar the scalar to check
     */
    checkScalar(scalar) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!isHex64(scalar)) {
                throw new Error('Malformed key supplied');
            }
            const writer = new bytestream_1.Writer();
            writer.hash(scalar);
            const result = yield this.exchange(Ledger_1.LedgerTypes.Command.CHECK_SCALAR, undefined, writer.buffer);
            return (result.uint8_t().toJSNumber() === 1);
        });
    }
    /**
     * Retrieves the public keys from the connected ledger device
     * @param confirm whether the device will prompt the user to confirm their actions
     *        (to disable, must be running a DEBUG build)
     */
    getPublicKeys(confirm = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.exchange(Ledger_1.LedgerTypes.Command.PUBLIC_KEYS, confirm);
            const spend = yield _1.KeyPair.from(result.hash());
            const view = yield _1.KeyPair.from(result.hash());
            return _1.Keys.from(spend, view);
        });
    }
    /**
     * Retrieves the private view key from the connected ledger device
     * @param confirm whether the device will prompt the user to confirm their actions
     *        (to disable, must be running a DEBUG build)
     */
    getPrivateViewKey(confirm = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.exchange(Ledger_1.LedgerTypes.Command.VIEW_SECRET_KEY, confirm);
            return _1.KeyPair.from(undefined, result.hash());
        });
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
    getPrivateSpendKey(confirm = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.exchange(Ledger_1.LedgerTypes.Command.SPEND_SECRET_KEY, confirm);
            return _1.KeyPair.from(undefined, result.hash());
        });
    }
    /**
     * Retrieves the the public spend key and private view key from the
     * ledger device which is essentially a view only wallet
     * @param confirm whether the device will prompt the user to confirm their actions
     *        (to disable, must be running a DEBUG build)
     */
    getViewWallet(confirm = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.exchange(Ledger_1.LedgerTypes.Command.WALLET_KEYS, confirm);
            return _1.Address.fromViewOnlyKeys(result.hash(), result.hash());
        });
    }
    /**
     * Calculates the public key for the given private key
     * @param private_key the private key
     */
    privateToPublic(private_key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!isHex64(private_key)) {
                throw new Error('Malformed private_key supplied');
            }
            const writer = new bytestream_1.Writer();
            writer.hash(private_key);
            const result = yield this.exchange(Ledger_1.LedgerTypes.Command.PRIVATE_TO_PUBLIC, undefined, writer.buffer);
            return _1.KeyPair.from(result.hash());
        });
    }
    /**
     * Generates a random key pair on the connected device
     */
    getRandomKeyPair() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.exchange(Ledger_1.LedgerTypes.Command.RANDOM_KEY_PAIR);
            return _1.KeyPair.from(result.hash(), result.hash());
        });
    }
    /**
     * Gets the public wallet address from the connected device
     * @param confirm whether the device will prompt the user to confirm their actions
     *        (to disable, must be running a DEBUG build)
     */
    getAddress(confirm = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.exchange(Ledger_1.LedgerTypes.Command.ADDRESS, confirm);
            return _1.Address.fromAddress(result.unreadBuffer.toString());
        });
    }
    /**
     * Generates a key image on the device using the supplied parameters
     * @param tx_public_key the transaction public key
     * @param output_index the index of the given output in the transaction
     * @param output_key the key of the given output in the transaction
     * @param confirm whether the device will prompt the user to confirm their actions
     *        (to disable, must be running a DEBUG build)
     */
    generateKeyImage(tx_public_key, output_index, output_key, confirm = true) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!isHex64(tx_public_key)) {
                throw new Error('Malformed tx_public_key supplied');
            }
            if (output_index < 0) {
                throw new Error('output_index must be >= 0');
            }
            if (!isHex64(output_key)) {
                throw new Error('Malformed output_key supplied');
            }
            const writer = new bytestream_1.Writer();
            writer.hash(tx_public_key);
            writer.uint32_t(output_index, true);
            writer.hash(output_key);
            const result = yield this.exchange(Ledger_1.LedgerTypes.Command.GENERATE_KEY_IMAGE, confirm, writer.buffer);
            return result.hash();
        });
    }
    /**
     * Generates a key image on the device using the supplied parameters
     * @param derivation the output derivation
     * @param output_index the index of the given output in the transaction
     * @param output_key the key of the given output in the transaction
     * @param confirm whether the device will prompt the user to confirm their actions
     *        (to disable, must be running a DEBUG build)
     */
    generateKeyImagePrimitive(derivation, output_index, output_key, confirm = true) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!isHex64(derivation)) {
                throw new Error('Malformed derivation supplied');
            }
            if (output_index < 0) {
                throw new Error('output_index must be >= 0');
            }
            if (!isHex64(output_key)) {
                throw new Error('Malformed output_key supplied');
            }
            const writer = new bytestream_1.Writer();
            writer.hash(derivation);
            writer.uint32_t(output_index, true);
            writer.hash(output_key);
            const result = yield this.exchange(Ledger_1.LedgerTypes.Command.GENERATE_KEY_IMAGE_PRIMITIVE, confirm, writer.buffer);
            return result.hash();
        });
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
    completeRingSignature(tx_public_key, output_index, output_key, k, signature, confirm = true) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const writer = new bytestream_1.Writer();
            writer.hash(tx_public_key);
            writer.uint32_t(output_index, true);
            writer.hash(output_key);
            writer.hash(k);
            writer.hex(signature);
            const result = yield this.exchange(Ledger_1.LedgerTypes.Command.COMPLETE_RING_SIGNATURE, confirm, writer.buffer);
            return result.hex(64);
        });
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
    generateRingSignatures(tx_public_key, output_index, output_key, tx_prefix_hash, input_keys, real_output_index, confirm = true) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const signatures = [];
            const writer = new bytestream_1.Writer();
            writer.hash(tx_public_key);
            writer.uint32_t(output_index, true);
            writer.hash(output_key);
            writer.hash(tx_prefix_hash);
            for (const input of input_keys) {
                writer.hash(input);
            }
            writer.uint32_t(real_output_index, true);
            const result = yield this.exchange(Ledger_1.LedgerTypes.Command.GENERATE_RING_SIGNATURES, confirm, writer.buffer);
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
        });
    }
    /**
     * Generates a signature of the message digest using the private spend key stored
     * on the ledger device without revealing the private spend key
     * @param message_digest the message digest (hash)
     * @param confirm whether the device will prompt the user to confirm their actions
     *        (to disable, must be running a DEBUG build)
     */
    generateSignature(message_digest, confirm = true) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!isHex64(message_digest)) {
                throw new Error('Malformed message_digest supplied');
            }
            const writer = new bytestream_1.Writer();
            writer.hash(message_digest);
            const result = yield this.exchange(Ledger_1.LedgerTypes.Command.GENERATE_SIGNATURE, confirm, writer.buffer);
            if (result.length !== 64) {
                throw new Error('Data returned does not appear to be a signature');
            }
            return result.hex(64);
        });
    }
    /**
     * Generates the transaction key derivation using the private view key stored
     * on the ledger device
     * @param tx_public_key the transactions public key
     * @param confirm whether the device will prompt the user to confirm their actions
     *        (to disable, must be running a DEBUG build)
     */
    generateKeyDerivation(tx_public_key, confirm = true) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!isHex64(tx_public_key)) {
                throw new Error('Malformed tx_public_key supplied');
            }
            const writer = new bytestream_1.Writer();
            writer.hash(tx_public_key);
            const result = yield this.exchange(Ledger_1.LedgerTypes.Command.GENERATE_KEY_DERIVATION, confirm, writer.buffer);
            return result.hash();
        });
    }
    /**
     * Generates the public ephemeral of the given output in a transaction
     * @param derivation the key derivation
     * @param output_index the index of the output in the transaction
     * @param confirm whether the device will prompt the user to confirm their actions
     *        (to disable, must be running a DEBUG build)
     */
    derivePublicKey(derivation, output_index, confirm = true) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!isHex64(derivation)) {
                throw new Error('Malformed derivation supplied');
            }
            if (output_index < 0) {
                throw new Error('output_index must be >= 0');
            }
            const writer = new bytestream_1.Writer();
            writer.hash(derivation);
            writer.uint32_t(output_index, true);
            const result = yield this.exchange(Ledger_1.LedgerTypes.Command.DERIVE_PUBLIC_KEY, confirm, writer.buffer);
            return _1.KeyPair.from(result.hash());
        });
    }
    /**
     * Generates the private ephemeral of the given output in a transaction
     * @param derivation the key derivation
     * @param output_index the index of the output in the transaction
     * @param confirm whether the device will prompt the user to confirm their actions
     *        (to disable, must be running a DEBUG build)
     */
    deriveSecretKey(derivation, output_index, confirm = true) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!isHex64(derivation)) {
                throw new Error('Malformed derivation supplied');
            }
            if (output_index < 0) {
                throw new Error('output_index must be >= 0');
            }
            const writer = new bytestream_1.Writer();
            writer.hash(derivation);
            writer.uint32_t(output_index, true);
            const result = yield this.exchange(Ledger_1.LedgerTypes.Command.DERIVE_SECRET_KEY, confirm, writer.buffer);
            return _1.KeyPair.from(undefined, result.hash());
        });
    }
    /**
     * Checks a given signature using the supplied public key for validity
     * @param message_digest the message digest (hash)
     * @param public_key the public key of the private key used to sign the transaction
     * @param signature the signature to validate
     */
    checkSignature(message_digest, public_key, signature) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!isHex64(message_digest)) {
                throw new Error('Malformed message_disgest supplied');
            }
            if (!isHex64(public_key)) {
                throw new Error('Malformed public_key supplied');
            }
            if (!isHex128(signature)) {
                throw new Error('Malformed signature supplied');
            }
            const writer = new bytestream_1.Writer();
            writer.hash(message_digest);
            writer.hash(public_key);
            writer.hex(signature);
            const result = yield this.exchange(Ledger_1.LedgerTypes.Command.CHECK_SIGNATURE, undefined, writer.buffer);
            return (result.uint8_t().toJSNumber() === 1);
        });
    }
    /**
     * Checks the ring signatures given for their validity to verify that the proper
     * private key was used for signing purposes
     * @param tx_prefix_hash the transaction prefix hash
     * @param key_image the key image spent in the input
     * @param public_keys the ring participant keys
     * @param signatures the signatures to verify
     */
    checkRingSignatures(tx_prefix_hash, key_image, public_keys, signatures) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const writer = new bytestream_1.Writer();
            writer.hash(tx_prefix_hash);
            writer.hash(key_image);
            for (const key of public_keys) {
                writer.hash(key);
            }
            for (const sig of signatures) {
                writer.hex(sig);
            }
            const result = yield this.exchange(Ledger_1.LedgerTypes.Command.CHECK_RING_SIGNATURES, undefined, writer.buffer);
            return (result.uint8_t().toJSNumber() === 1);
        });
    }
    /**
     * Resets the keys on the ledger device the same way that they
     * are first initialized on the device
     * @param confirm
     */
    resetKeys(confirm = true) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.exchange(Ledger_1.LedgerTypes.Command.RESET_KEYS, confirm);
        });
    }
    /**
     * Retrieves the current state of the transaction construction process on the ledger device
     */
    transactionState() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.exchange(Ledger_1.LedgerTypes.Command.TX_STATE, undefined);
            return result.uint8_t().toJSNumber();
        });
    }
    /**
     * Resets the transaction state of the transaction construction process on the ledger device
     */
    resetTransaction(confirm = true) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.exchange(Ledger_1.LedgerTypes.Command.TX_RESET, confirm);
        });
    }
    /**
     * Starts a new transaction construction on the ledger device
     * @param unlock_time the unlock time (or block) of the transaction
     * @param input_count the number of inputs that will be included in the transaction
     * @param output_count the number of outputs that will be included in the transaction
     * @param tx_public_key the transaction public key
     * @param payment_id the transaction payment id if one needs to be included
     */
    startTransaction(unlock_time = 0, input_count = 0, output_count = 0, tx_public_key, payment_id) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const writer = new bytestream_1.Writer();
            writer.uint64_t(unlock_time, true);
            writer.uint8_t(input_count);
            writer.uint8_t(output_count);
            writer.hash(tx_public_key);
            if (payment_id) {
                writer.uint8_t(1);
                writer.hash(payment_id);
            }
            else {
                writer.uint8_t(0);
            }
            yield this.exchange(Ledger_1.LedgerTypes.Command.TX_START, undefined, writer.buffer);
        });
    }
    /**
     * Signals to the ledger that we are ready to start loading transaction inputs
     */
    startTransactionInputLoad() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.exchange(Ledger_1.LedgerTypes.Command.TX_START_INPUT_LOAD, undefined);
        });
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
    loadTransactionInput(input_tx_public_key, input_output_index, amount, public_keys, offsets, real_output_index) {
        return __awaiter(this, void 0, void 0, function* () {
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
            const writer = new bytestream_1.Writer();
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
            yield this.exchange(Ledger_1.LedgerTypes.Command.TX_LOAD_INPUT, undefined, writer.buffer);
        });
    }
    /**
     * Signals to the ledger that we are ready to start loading transaction outputs
     */
    startTransactionOutputLoad() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.exchange(Ledger_1.LedgerTypes.Command.TX_START_OUTPUT_LOAD, undefined);
        });
    }
    /**
     * Load a transaction output to the transaction construction process
     * @param amount the amount of the output
     * @param output_key the output key
     */
    loadTransactionOutput(amount, output_key) {
        return __awaiter(this, void 0, void 0, function* () {
            if (amount < 0 || amount > this.m_config.maximumOutputAmount) {
                throw new Error('amount out of range');
            }
            if (!isHex64(output_key)) {
                throw new Error('Malformed output_key supplied');
            }
            const writer = new bytestream_1.Writer();
            writer.uint64_t(amount, true);
            writer.hash(output_key);
            yield this.exchange(Ledger_1.LedgerTypes.Command.TX_LOAD_OUTPUT, undefined, writer.buffer);
        });
    }
    /**
     * Finalizes a transaction prefix
     */
    finalizeTransactionPrefix() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.exchange(Ledger_1.LedgerTypes.Command.TX_FINALIZE_TX_PREFIX, undefined);
        });
    }
    /**
     * Instructs the ledger device to sign the transaction we have constructed
     */
    signTransaction(confirm = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.exchange(Ledger_1.LedgerTypes.Command.TX_SIGN, confirm);
            return {
                hash: result.hash(),
                size: result.uint16_t(true).toJSNumber()
            };
        });
    }
    /**
     * Exports the completed full transaction that we constructed from the ledger device
     */
    retrieveTransaction() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = new bytestream_1.Writer();
            while (response.length < this.m_config.maximumLedgerTransactionSize) {
                const writer = new bytestream_1.Writer();
                writer.uint16_t(response.length, true);
                const result = yield this.exchange(Ledger_1.LedgerTypes.Command.TX_DUMP, undefined, writer.buffer);
                // if we didn't receive any more data, then break out of the loop
                if (result.unreadBytes === 0) {
                    break;
                }
                response.write(result.unreadBuffer);
            }
            return _1.Transaction.from(response.buffer);
        });
    }
    /**
     * Exchanges an APDU with the connected device
     * @param command the command to send
     * @param confirm whether the device will prompt the user to confirm their actions
     *        (to disable, must be running a DEBUG build)
     * @param data any data that must be included in the payload for the given command
     */
    exchange(command, confirm = true, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const writer = new bytestream_1.Writer();
            writer.uint8_t(Ledger_1.LedgerTypes.APDU.INS);
            writer.uint8_t(command);
            if (confirm) {
                writer.uint8_t(Ledger_1.LedgerTypes.APDU.P1_CONFIRM);
            }
            else {
                writer.uint8_t(Ledger_1.LedgerTypes.APDU.P1_NON_CONFIRM);
            }
            writer.uint8_t(Ledger_1.LedgerTypes.APDU.P2);
            if (data) {
                if (data.length > (this.m_config.maximumLedgerAPDUPayloadSize - 6)) {
                    throw new Error('Data payload exceeds maximum size');
                }
                writer.uint16_t(data.length, true);
                writer.write(data);
            }
            else {
                writer.uint16_t(0);
            }
            let event_timer;
            if (confirm && requiresConfirmation(command)) {
                event_timer = setTimeout(() => {
                    this.emit('user_confirm');
                }, 1000);
            }
            this.emit('send', writer.blob);
            const result = yield this.m_transport.exchange(writer.buffer);
            if (event_timer) {
                clearTimeout(event_timer);
            }
            this.emit('receive', (new bytestream_1.Reader(result)).unreadBuffer.toString('hex'));
            const code = result.slice(result.length - 2);
            const response = new bytestream_1.Reader(result.slice(0, result.length - code.length));
            const reader = new bytestream_1.Reader(code);
            let errCode = reader.uint16_t(true).toJSNumber();
            if (errCode !== Ledger_1.LedgerTypes.ErrorCode.OK) {
                if (response.length >= 2) {
                    errCode = response.uint16_t(true).toJSNumber();
                }
                throw new Ledger_1.LedgerTypes.LedgerError(errCode, 'Could not complete request');
            }
            return response;
        });
    }
}
exports.LedgerDevice = LedgerDevice;
/** @ignore */
function requiresConfirmation(command) {
    switch (command) {
        case Ledger_1.LedgerTypes.Command.VERSION:
        case Ledger_1.LedgerTypes.Command.DEBUG:
        case Ledger_1.LedgerTypes.Command.IDENT:
        case Ledger_1.LedgerTypes.Command.CHECK_KEY:
        case Ledger_1.LedgerTypes.Command.CHECK_SCALAR:
        case Ledger_1.LedgerTypes.Command.RANDOM_KEY_PAIR:
        case Ledger_1.LedgerTypes.Command.CHECK_RING_SIGNATURES:
        case Ledger_1.LedgerTypes.Command.CHECK_SIGNATURE:
        case Ledger_1.LedgerTypes.Command.TX_STATE:
        case Ledger_1.LedgerTypes.Command.TX_START:
        case Ledger_1.LedgerTypes.Command.TX_START_INPUT_LOAD:
        case Ledger_1.LedgerTypes.Command.TX_LOAD_INPUT:
        case Ledger_1.LedgerTypes.Command.TX_START_OUTPUT_LOAD:
        case Ledger_1.LedgerTypes.Command.TX_LOAD_OUTPUT:
        case Ledger_1.LedgerTypes.Command.TX_FINALIZE_TX_PREFIX:
        case Ledger_1.LedgerTypes.Command.TX_DUMP:
        case Ledger_1.LedgerTypes.Command.TX_RESET:
            return false;
        default:
            return true;
    }
}
/**
 * @ignore
 */
function isHex(value) {
    if (value.length % 2 !== 0) {
        return false;
    }
    const regex = new RegExp('^[0-9a-fA-F]{' + value.length + '}$');
    return regex.test(value);
}
/**
 * @ignore
 */
function isHex64(value) {
    return (isHex(value) && value.length === 64);
}
/**
 * @ignore
 */
function isHex128(value) {
    return (isHex(value) && value.length === 128);
}
