"use strict";
// Copyright (c) 2018-2020, The TurtleCoin Developers
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
exports.Address = exports.SIZES = void 0;
const AddressPrefix_1 = require("./AddressPrefix");
const base58_1 = require("@turtlecoin/base58");
const Common_1 = require("./Common");
const Config_1 = require("./Config");
const Types_1 = require("./Types");
const mnemonics_1 = require("@turtlecoin/mnemonics");
const bytestream_1 = require("@turtlecoin/bytestream");
/** @ignore */
var SIZES;
(function (SIZES) {
    SIZES[SIZES["KEY"] = 32] = "KEY";
    SIZES[SIZES["CHECKSUM"] = 4] = "CHECKSUM";
})(SIZES = exports.SIZES || (exports.SIZES = {}));
/**
 * Represents a TurtleCoin address
 */
class Address {
    constructor() {
        this.m_keys = new Types_1.ED25519.Keys();
        this.m_language = 'english';
        this.m_subwalletIndex = 0;
        this.m_prefix = new AddressPrefix_1.AddressPrefix(Config_1.Config.addressPrefix);
        this.m_cached = { addressPrefix: '', address: '' };
    }
    /**
     * The Base58 encoded address
     */
    address() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.toString();
        });
    }
    /**
     * The address index number [0=primary]
     */
    get subwalletIndex() {
        return this.m_subwalletIndex;
    }
    /**
     * The seed phrase for the address if available
     */
    get seed() {
        return this.m_seed;
    }
    /**
     * The mnemonic phrase for the address if available
     */
    get mnemonic() {
        return (this.m_seed) ? mnemonics_1.Mnemonics.encode(this.m_seed) : undefined;
    }
    /**
     * The payment Id of the address if one exists
     */
    get paymentId() {
        return Buffer.from(this.m_paymentId || '', 'hex').toString().toLowerCase();
    }
    set paymentId(paymentId) {
        if (!Common_1.Common.isHex64(paymentId)) {
            throw new Error('Invalid payment ID supplied');
        }
        this.m_paymentId = Buffer.from(paymentId).toString('hex');
    }
    /**
     * The address prefix
     */
    get prefix() {
        return this.m_prefix;
    }
    set prefix(addressPrefix) {
        this.m_prefix = addressPrefix;
    }
    /**
     * The address spend keys
     */
    get spend() {
        return this.m_keys.spend;
    }
    set spend(keys) {
        this.m_keys.spend = keys;
    }
    /**
     * The address view keys
     */
    get view() {
        return this.m_keys.view;
    }
    set view(keys) {
        this.m_keys.view = keys;
    }
    /**
     * Creates a new address object from a Base58 address
     * @param address the public address to decode
     * @param [prefix] the address prefix
     * @returns a new address object
     */
    static fromAddress(address, prefix) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof prefix === 'number') {
                prefix = new AddressPrefix_1.AddressPrefix(prefix);
            }
            else if (typeof prefix === 'undefined') {
                prefix = new AddressPrefix_1.AddressPrefix();
            }
            const decodedAddress = base58_1.Base58.decode(address);
            const reader = new bytestream_1.Reader(decodedAddress);
            const decodedPrefix = reader.bytes(prefix.size).toString('hex');
            if (decodedPrefix !== prefix.hex) {
                throw new Error('Invalid address prefix');
            }
            let paymentId = '';
            if (reader.unreadBytes > ((SIZES.KEY * 2) + SIZES.CHECKSUM)) {
                paymentId = reader.hex(SIZES.KEY * 2);
            }
            const publicSpend = reader.hash();
            const publicView = reader.hash();
            const expectedChecksum = reader.bytes(SIZES.CHECKSUM).toString('hex');
            const checksum = (new bytestream_1.Reader(yield Types_1.TurtleCoinCrypto.cn_fast_hash(decodedPrefix + paymentId + publicSpend + publicView))).bytes(SIZES.CHECKSUM).toString('hex');
            if (expectedChecksum !== checksum) {
                throw new Error('Could not parse address: checksum mismatch');
            }
            const result = new Address();
            result.m_paymentId = paymentId;
            result.m_keys = yield Types_1.ED25519.Keys.from(yield Types_1.ED25519.KeyPair.from(publicSpend), yield Types_1.ED25519.KeyPair.from(publicView));
            return result;
        });
    }
    /**
     * Creates a new address object using the supplied public keys
     * @param publicSpendKey the public spend key
     * @param publicViewKey the public view key
     * @param [paymentId] the payment ID
     * @param [prefix] the address prefix
     * @returns a new address object
     */
    static fromPublicKeys(publicSpendKey, publicViewKey, paymentId, prefix) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof prefix === 'number') {
                prefix = new AddressPrefix_1.AddressPrefix(prefix);
            }
            const address = new Address();
            if (prefix) {
                address.prefix = prefix;
            }
            if (paymentId) {
                address.paymentId = paymentId;
            }
            address.m_keys = yield Types_1.ED25519.Keys.from(yield Types_1.ED25519.KeyPair.from(publicSpendKey), yield Types_1.ED25519.KeyPair.from(publicViewKey));
            return address;
        });
    }
    /**
     * Creates a new address object (view only) using the supplied keys
     * @param publicSpendKey the public spend key
     * @param privateViewKey the private view key
     * @param [paymentId] the payment ID
     * @param [prefix] the address prefix
     * @returns a new address object
     */
    static fromViewOnlyKeys(publicSpendKey, privateViewKey, paymentId, prefix) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof prefix === 'number') {
                prefix = new AddressPrefix_1.AddressPrefix(prefix);
            }
            const address = new Address();
            if (prefix) {
                address.prefix = prefix;
            }
            if (paymentId) {
                address.paymentId = paymentId;
            }
            address.m_keys = yield Types_1.ED25519.Keys.from(yield Types_1.ED25519.KeyPair.from(publicSpendKey), yield Types_1.ED25519.KeyPair.from(undefined, privateViewKey));
            return address;
        });
    }
    /**
     * Creates a new address object using the supplied private keys
     * @param privateSpendKey the private spend key
     * @param privateViewKey the private view key
     * @param [prefix] the address prefix
     * @returns a new address object
     */
    static fromKeys(privateSpendKey, privateViewKey, prefix) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof prefix === 'number') {
                prefix = new AddressPrefix_1.AddressPrefix(prefix);
            }
            const address = new Address();
            if (prefix) {
                address.prefix = prefix;
            }
            address.m_keys = yield Types_1.ED25519.Keys.from(yield Types_1.ED25519.KeyPair.from(undefined, privateSpendKey), yield Types_1.ED25519.KeyPair.from(undefined, privateViewKey));
            const derivedViewKey = yield Types_1.ED25519.KeyPair.from(undefined, privateSpendKey, undefined, 1);
            if (derivedViewKey.privateKey === privateViewKey) {
                address.m_seed = privateSpendKey;
            }
            return address;
        });
    }
    /**
     * Creates a new address object from a mnemonic phrase
     * @param mnemonic the wallet mnemonic phrase
     * @param [language] the language of the mnemonic phrase
     * @param [prefix] the address prefix
     * @returns a new address object
     */
    static fromMnemonic(mnemonic, language, prefix) {
        return __awaiter(this, void 0, void 0, function* () {
            const seed = mnemonics_1.Mnemonics.decode(mnemonic);
            return Address.fromSeed(seed, language, prefix);
        });
    }
    /**
     * Creates a new address object from a seed
     * @param seed the wallet seed
     * @param [language] the language of the mnemonic phrase
     * @param [prefix] the address prefix
     * @returns a new address object
     */
    static fromSeed(seed, language, prefix) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof prefix === 'number') {
                prefix = new AddressPrefix_1.AddressPrefix(prefix);
            }
            if (!Common_1.Common.isHex64(seed)) {
                seed = yield Types_1.TurtleCoinCrypto.cn_fast_hash(seed);
            }
            const address = new Address();
            address.m_seed = seed;
            address.m_language = language || 'english';
            if (prefix) {
                address.prefix = prefix;
            }
            address.m_keys = yield Types_1.ED25519.Keys.from(yield Types_1.ED25519.KeyPair.from(undefined, seed), yield Types_1.ED25519.KeyPair.from(undefined, seed, undefined, 1));
            return address;
        });
    }
    /**
     * Creates a new address object from entropy (new address)
     * @param [entropy] data to use for entropy to feed to the underlying random generation function
     * @param [language] the language of the mnemonic phrase
     * @param [prefix] the address prefix
     * @returns a new address object
     */
    static fromEntropy(entropy, language, prefix) {
        return __awaiter(this, void 0, void 0, function* () {
            const seed = yield Address.generateSeed(entropy);
            return Address.fromSeed(seed, language, prefix);
        });
    }
    /**
     * Generates a new seed from entropy
     * @param [entropy] data to use for entropy to feed to the underlying random generation function
     * @param [iterations] the number of iterations to run the hashing function when generating the seed
     * @returns a new randomly created seed
     */
    static generateSeed(entropy, iterations) {
        return __awaiter(this, void 0, void 0, function* () {
            const random = yield Types_1.ED25519.KeyPair.from(undefined, undefined, entropy, iterations);
            return random.privateKey;
        });
    }
    /**
     * Generates a new subwallet address object using the supplied parameters
     * @param privateSpendKey the private spend key
     * @param subwalletIndex the subwallet index number
     * @param [language] the language of the mnemonic phrase
     * @param [prefix] the address prefix
     * @returns a new address object
     */
    static generateSubwallet(privateSpendKey, subwalletIndex, language, prefix) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof prefix === 'number') {
                prefix = new AddressPrefix_1.AddressPrefix(prefix);
            }
            if (!(yield Types_1.TurtleCoinCrypto.checkScalar(privateSpendKey))) {
                throw new Error('Invalid private spend key supplied');
            }
            subwalletIndex = Math.abs(subwalletIndex);
            if (subwalletIndex === 0) {
                return Address.fromSeed(privateSpendKey, language, prefix);
            }
            const address = new Address();
            address.m_subwalletIndex = subwalletIndex;
            if (prefix) {
                address.prefix = prefix;
            }
            const view = yield Types_1.ED25519.KeyPair.from(undefined, privateSpendKey, undefined, 1);
            const spend = yield Types_1.TurtleCoinCrypto.generateDeterministicSubwalletKeys(privateSpendKey, subwalletIndex);
            address.m_keys = yield Types_1.ED25519.Keys.from(yield Types_1.ED25519.KeyPair.from(spend.public_key, spend.private_key), view);
            return address;
        });
    }
    /**
     * Encodes a raw address (hex) into Base58 notation
     * @param rawAddress the raw address in hexadecimal form
     * @retursn the Base58 representation of the address
     */
    static encodeRaw(rawAddress) {
        return base58_1.Base58.encode(rawAddress);
    }
    /**
     * Returns the Base58 encoded address
     * @returns Base58 encoded address
     */
    toString() {
        return __awaiter(this, void 0, void 0, function* () {
            const writer = new bytestream_1.Writer();
            writer.hex(this.prefix.hex);
            if (this.m_paymentId) {
                writer.hex(this.m_paymentId);
            }
            writer.hash(this.m_keys.spend.publicKey);
            writer.hash(this.m_keys.view.publicKey);
            if (this.m_cached.addressPrefix === writer.blob && this.m_cached.address.length !== 0) {
                return base58_1.Base58.encode(this.m_cached.address);
            }
            const checksum = (yield Types_1.TurtleCoinCrypto.cn_fast_hash(writer.blob))
                .slice(0, 8);
            this.m_cached.addressPrefix = writer.blob;
            writer.hex(checksum);
            this.m_cached.address = writer.blob;
            return base58_1.Base58.encode(writer.blob);
        });
    }
}
exports.Address = Address;
