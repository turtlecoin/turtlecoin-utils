// Copyright (c) 2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import { Address } from './Address';
import { AddressPrefix } from './AddressPrefix';
import { ED25519, Interfaces as TransactionInterfaces, MultisigInterfaces, TurtleCoinCrypto } from './Types';
import { Counter, ModeOfOperation, utils as AESUtils } from 'aes-js';
import { Reader, Writer } from '@turtlecoin/bytestream';
import { Base58 } from '@turtlecoin/base58';

/** @ignore */
const messagePrefix = 0xde0aec198;

/**
 * Represents a Multisignature inter-wallet Message that is used to exchange data between multisignature participants
 */
export class MultisigMessage {
    /**
     * The private view key communicated in the message
     */
    public get view (): string {
        return this.m_privateViewKey.privateKey;
    }

    /**
     * The source individual wallet address that the message is being sent FROM
     */
    public get source (): Address {
        return this.m_source;
    }

    public set source (source: Address) {
        if (source.view.privateKey.length === 0) {
            throw new Error('Source private view key not available');
        }

        this.m_source = source;

        this.m_privateViewKey = source.view;
    }

    /**
     * The destination individual wallet address the message is being sent TO
     */
    public get destination (): Address {
        return this.m_destination;
    }

    public set destination (destination: Address) {
        this.m_destination = destination;
    }

    /**
     * A one-time nonce value that should increment/change for every message exchanged between the wallets
     */
    public get nonce (): number {
        return this.m_nonce;
    }

    /**
     * The multisig public spend keys transferred in the message
     */
    public get spendKeys (): ED25519.KeyPair[] {
        return this.m_spendKeys;
    }

    /**
     * The partial key images transferred in the message
     */
    public get partialKeyImages (): MultisigInterfaces.PartialKeyImage[] {
        return this.m_partialKeyImages;
    }

    public set partialKeyImages (partialKeyImages: MultisigInterfaces.PartialKeyImage[]) {
        this.m_partialKeyImages = partialKeyImages;
    }

    /**
     * The partial signing keys transferred in the message
     */
    public get partialSigningKeys (): MultisigInterfaces.PartialSigningKey[] {
        return this.m_partialSigningKeys;
    }

    public set partialSigningKeys (partialSigningKeys: MultisigInterfaces.PartialSigningKey[]) {
        this.m_partialSigningKeys = partialSigningKeys;
    }

    /**
     * The prepared transactions transferred in the message
     */
    public get preparedTransactions (): TransactionInterfaces.PreparedTransaction[] {
        return this.m_preparedTransactions;
    }

    public set preparedTransactions (preparedTransactions: TransactionInterfaces.PreparedTransaction[]) {
        this.m_preparedTransactions = preparedTransactions;
    }

    /**
     * Decodes a Base58 string into a multisig message object.
     *
     * This method validates that all signatures included in the data are valid, the data is properly
     * decrypted, and the signatures of the public keys included in the payload(s) are valid
     *
     * @async
     * @param destination The wallet address that this message was sent
     * @param base58 The Base58 encoded data
     */
    public static async decode (destination: Address, base58: string): Promise<MultisigMessage> {
        if (!destination.spend.isPaired) {
            throw new Error('Cannot attempt decryption without private spend key');
        }

        const prefix = new AddressPrefix(messagePrefix);

        const decoded = Base58.decode(base58);

        const signature = decoded.slice(-128);

        const rawData = decoded.slice(0, decoded.length - 128);

        const hash = await TurtleCoinCrypto.cn_fast_hash(rawData);

        const reader = new Reader(rawData);

        const foundPrefix = reader.hex(prefix.varint.length);

        if (foundPrefix !== prefix.hex) {
            throw new Error('Invalid data supplied');
        }

        const nonce = reader.varint().toJSNumber();

        const length = reader.varint().toJSNumber();

        const transfer: MultisigInterfaces.Transfer = JSON.parse(reader.bytes(length).toString());

        const source = await Address.fromAddress(transfer.address);

        if (!await TurtleCoinCrypto.checkSignature(hash, source.spend.publicKey, signature)) {
            throw new Error('Invalid data signature');
        }

        if (reader.unreadBytes !== 0) {
            throw new RangeError('Data contains unstructured information');
        }

        const result = new MultisigMessage();

        result.m_source = source;

        result.destination = destination;

        result.m_nonce = nonce;

        const payload = await decrypt(destination, transfer, nonce);

        for (const publicSpendKey of payload.publicSpendKeys) {
            result.m_spendKeys.push(await ED25519.KeyPair.from(publicSpendKey.key));
        }

        if (payload.partialKeyImages) {
            result.partialKeyImages = payload.partialKeyImages;
        }

        if (payload.partialSigningKeys) {
            result.partialSigningKeys = payload.partialSigningKeys;
        }

        if (payload.preparedTransactions) {
            result.preparedTransactions = payload.preparedTransactions;
        }

        result.m_privateViewKey = await ED25519.KeyPair.from(undefined, payload.privateViewKey);

        await verifySpendKeySignatures(payload.publicSpendKeys);

        return result;
    }

    protected m_source: Address = new Address();
    protected m_spendKeys: ED25519.KeyPair[] = [];
    protected m_privateViewKey: ED25519.KeyPair = new ED25519.KeyPair();
    protected m_nonce = 1;
    protected m_partialKeyImages: MultisigInterfaces.PartialKeyImage[] = [];
    protected m_partialSigningKeys: MultisigInterfaces.PartialSigningKey[] = [];
    protected m_preparedTransactions: TransactionInterfaces.PreparedTransaction[] = [];
    private m_destination: Address = new Address();

    /**
     * Constructs a new instance of a MultisigMessage object
     * @param [source] The source individual wallet address that the message is being sent FROM
     * @param [destination] The destination individual wallet address the message is being sent TO
     * @param [nonce] A one-time nonce value that should increment/change for every message
     * exchanged between the wallets
     */
    constructor (source?: Address, destination?: Address, nonce?: number) {
        if (source) {
            this.source = source;
        }

        if (destination) {
            this.destination = destination;
        }

        if (nonce) {
            this.m_nonce = nonce;
        }
    }

    /**
     * Adds a new set of spend keys to the message
     *
     * Note: The key pair must be complete (both private and public) to complete the necessary
     * signing processes to provide proof that we have the private key for the given public key.
     *
     * @param keypair The spend key pair to include.
     */
    public addSpendKeys (keypair: ED25519.KeyPair): boolean {
        if (!keypair.isPaired) {
            throw new Error('The private key and public key are not cryptographically paired');
        }

        for (const k of this.m_spendKeys) {
            if (k.publicKey === keypair.publicKey) {
                return false;
            }
        }

        this.m_spendKeys.push(keypair);

        return true;
    }

    /**
     * Encodes the multisig message object as a Base58 encoded string that can be easily
     *
     * This method performs all necessary signing of the supplied public keys, encrypts the payload,
     * and signs the message to prevent tampering and protect the confidential information inside.
     *
     * transferred between multisig wallet participants
     * @async
     * @returns The Base58 encoded string for transmission
     */
    public async encode (): Promise<string> {
        if (!this.source.spend.isPaired) {
            throw new Error('Cannot encode as we do not have the full key pair to do so [SPEND]');
        }

        if (!this.source.view.isPaired) {
            throw new Error('Cannot encode as we do not have the full key pair to do so [VIEW]');
        }

        const payload: MultisigInterfaces.Payload = {
            publicSpendKeys: await calculateSpendKeySignatures(this.spendKeys),
            privateViewKey: this.source.view.privateKey
        };

        if (this.partialKeyImages.length !== 0) {
            payload.partialKeyImages = this.partialKeyImages;
        }

        if (this.partialSigningKeys.length !== 0) {
            payload.partialSigningKeys = this.partialSigningKeys;
        }

        if (this.preparedTransactions.length !== 0) {
            payload.preparedTransactions = this.preparedTransactions;
        }

        const prefix = new AddressPrefix(messagePrefix);

        const writer = new Writer();

        writer.hex(prefix.hex);

        writer.varint(this.nonce);

        const transfer = await encrypt(this.source, this.destination, payload, this.nonce);

        const subWriter = new Writer();

        subWriter.write(transfer);

        writer.varint(subWriter.length);

        writer.write(subWriter.buffer);

        const hash = await TurtleCoinCrypto.cn_fast_hash(writer.blob);

        const sig = await TurtleCoinCrypto.generateSignature(
            hash, this.source.spend.publicKey, this.source.spend.privateKey);

        writer.hex(sig);

        return Base58.encode(writer.blob);
    }
}

/** @ignore */
async function encrypt (
    source: Address,
    destination: Address,
    payload: MultisigInterfaces.Payload,
    nonce: number
): Promise<MultisigInterfaces.Transfer> {
    const transfer = Buffer.from(JSON.stringify(payload));

    const aesKey = Buffer.from(
        await TurtleCoinCrypto.generateKeyDerivation(
            destination.spend.publicKey, source.spend.privateKey), 'hex');

    // eslint-disable-next-line new-cap
    const ctx = new ModeOfOperation.ctr(aesKey, new Counter(nonce));

    const encryptedBytes = ctx.encrypt(transfer);

    return {
        address: await source.address(),
        messageId: nonce,
        payload: AESUtils.hex.fromBytes(encryptedBytes)
    };
}

/** @ignore */
async function decrypt (
    destination: Address,
    transfer: MultisigInterfaces.Transfer,
    nonce: number
): Promise<MultisigInterfaces.Payload> {
    const sender = await Address.fromAddress(transfer.address);

    const aesKey = Buffer.from(
        await TurtleCoinCrypto.generateKeyDerivation(
            sender.spend.publicKey, destination.spend.privateKey), 'hex');

    // eslint-disable-next-line new-cap
    const ctx = new ModeOfOperation.ctr(aesKey, new Counter(nonce));

    const decryptedBytes = ctx.decrypt(AESUtils.hex.toBytes(transfer.payload));

    try {
        return JSON.parse(Buffer.from(decryptedBytes).toString());
    } catch {
        throw new Error('Could not decrypt transfer');
    }
}

/** @ignore */
async function calculateSpendKeySignatures (
    spendKeys: ED25519.KeyPair[]): Promise<MultisigInterfaces.PublicSpendKey[]> {
    const signatures: MultisigInterfaces.PublicSpendKey[] = [];

    for (const keys of spendKeys) {
        if (!keys.isPaired) {
            throw new Error('The supplied spend keys are not paired correctly');
        }

        const sig = await TurtleCoinCrypto.generateSignature(keys.publicKey, keys.publicKey, keys.privateKey);

        signatures.push({ key: keys.publicKey, signature: sig });
    }

    return signatures;
}

/** @ignore */
async function verifySpendKeySignatures (spendKeys: MultisigInterfaces.PublicSpendKey[]): Promise<void> {
    for (const spendKey of spendKeys) {
        if (!await TurtleCoinCrypto.checkSignature(spendKey.key, spendKey.key, spendKey.signature)) {
            throw new Error('Invalid public spend key signature for: ' + spendKey.key);
        }
    }
}
