// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import { Common } from './Common';
import { Address } from './Address';
import {
    BigInteger,
    ED25519,
    ExtraNonceTag,
    ExtraTag,
    TransactionInputs,
    TransactionOutputs,
    TurtleCoinCrypto
} from './Types';
import { Reader, Writer } from '@turtlecoin/bytestream';

/** @ignore */
const TransactionVersion2Suffix = 'bc36789e7a1e281436464229828f817d6612f7b477d66591ff96a9e064bcc98a' +
    '0000000000000000000000000000000000000000000000000000000000000000';

/** @ignore */
interface Cache {
    prefix: string;
    blob: string;
    prefixHash: string;
    hash: string;
}

/**
 * Represents a TurtleCoin Transaction
 */
export class Transaction {
    /**
     * Returns the total amount of the inputs
     */
    private get inputAmount (): number {
        let amount = BigInteger.zero;

        for (const input of this.inputs) {
            if (input.type === TransactionInputs.InputType.KEY) {
                amount = amount.add((input as TransactionInputs.KeyInput).amount);
            }
        }

        return amount.toJSNumber();
    }

    /**
     * Returns the total amount of the outputs
     */
    private get outputAmount (): number {
        let amount = BigInteger.zero;

        for (const output of this.outputs) {
            if (output.type === TransactionOutputs.OutputType.KEY) {
                amount = amount.add((output as TransactionOutputs.KeyOutput).amount);
            }
        }

        return amount.toJSNumber();
    }

    /**
     * Returns whether this is a coinbase transaction or not
     */
    public get isCoinbase (): boolean {
        for (const input of this.inputs) {
            if (input.type === TransactionInputs.InputType.COINBASE) {
                return true;
            }
        }

        return false;
    }

    /**
     * Calculates the transaction fingerprint if the transaction
     * is a coinbase transaction and it contains the information
     * necessary to do so
     */
    public async fingerprint (): Promise<string | undefined> {
        if (!this.isCoinbase) {
            return;
        }

        if (!this.recipientPublicViewKey || !this.recipientPublicSpendKey) {
            return;
        }

        const writer = new Writer();

        writer.hash(this.recipientPublicSpendKey);

        writer.hash(this.recipientPublicViewKey);

        return TurtleCoinCrypto.cn_fast_hash(writer.blob);
    }

    /**
     * Returns the recipient address if this is a coinbase
     * transaction and the information is available
     */
    public async recipient (): Promise<Address | undefined> {
        if (!this.isCoinbase) {
            return;
        }

        if (!this.recipientPublicSpendKey || !this.recipientPublicViewKey) {
            return;
        }

        return Address.fromPublicKeys(this.recipientPublicSpendKey, this.recipientPublicViewKey);
    }

    /**
     * Returns the total amount transferred in the transaction
     */
    public get amount (): number {
        if (this.isCoinbase) {
            return this.outputAmount;
        }

        return this.inputAmount;
    }

    /**
     * Returns the transaction extra as a buffer
     */
    public get extra (): Buffer {
        if (!this.m_readonly) {
            return writeExtra(this.m_extra);
        }

        return this.m_rawExtra;
    }

    /**
     * Returns the structured arbitrary data found in the transaction extra
     */
    public get extraData (): Buffer {
        let result = Buffer.alloc(0);

        for (const tag of this.m_extra) {
            if (tag.tag === ExtraTag.ExtraTagType.NONCE) {
                const innerTag = tag as ExtraTag.ExtraNonce;
                for (const subTag of innerTag.tags) {
                    if (subTag.tag === ExtraNonceTag.NonceTagType.EXTRA_DATA) {
                        result = (subTag as ExtraNonceTag.ExtraNonceData).data;
                    }
                }
            }
        }

        return result;
    }

    /**
     * Returns the fee of the transaction
     */
    public get fee (): number {
        return this.amount - this.outputAmount;
    }

    /**
     * Returns the transaction hash
     */
    public async hash (): Promise<string> {
        if (this.m_cached.blob && this.m_cached.blob === this.toString() && this.m_cached.hash) {
            return this.m_cached.hash;
        }

        this.m_cached.blob = this.toString();

        const hash = await TurtleCoinCrypto.cn_fast_hash(this.m_cached.blob);

        if (this.version >= 2) {
            const hash2 = await TurtleCoinCrypto.cn_fast_hash(hash + TransactionVersion2Suffix);

            this.m_cached.hash = hash2;

            return hash2;
        }

        this.m_cached.hash = hash;

        return hash;
    }

    /**
     * Returns the merged mining tag found within the transaction
     */
    public get mergedMining (): ExtraTag.ExtraMergedMining | undefined {
        let result;

        for (const tag of this.m_extra) {
            if (tag.tag === ExtraTag.ExtraTagType.MERGED_MINING) {
                result = tag as ExtraTag.ExtraMergedMining;
            }
        }

        return result;
    }

    /**
     * Returns the payment ID found within the transaction
     */
    public get paymentId (): string | undefined {
        let result;

        for (const tag of this.m_extra) {
            if (tag.tag === ExtraTag.ExtraTagType.NONCE) {
                const innerTag = tag as ExtraTag.ExtraNonce;
                for (const subTag of innerTag.tags) {
                    if (subTag.tag === ExtraNonceTag.NonceTagType.PAYMENT_ID) {
                        result = (subTag as ExtraNonceTag.ExtraNoncePaymentId).paymentId;
                    }
                }
            }
        }

        return result;
    }

    /**
     * Increments the pool nonce by 1
     */
    public incrementPoolNonce () {
        this.poolNonce = this.poolNonce.add(1);
    }

    /**
     * Returns pool nonce field within the transaction as Buffer
     */
    public get poolNonce (): BigInteger.BigInteger {
        let result;

        for (const tag of this.m_extra) {
            if (tag.tag === ExtraTag.ExtraTagType.POOL_NONCE) {
                result = BigInteger((tag as ExtraTag.ExtraPoolNonce).data
                    .toString('hex'));
            }
        }

        if (!result) {
            return BigInteger.zero;
        } else {
            return result;
        }
    }

    /**
     * Sets the pool nonce field within the transaction from a Buffer
     * @param nonce the nonce data to use
     */
    public set poolNonce (nonce: BigInteger.BigInteger) {
        if (!nonce) {
            this.m_extra = removeExtraTag(this.m_extra, ExtraTag.ExtraTagType.POOL_NONCE);

            return;
        }

        const buffer = Common.hexPadToBuffer(nonce);

        const tag = new ExtraTag.ExtraPoolNonce(buffer);

        this.m_extra = removeExtraTag(this.m_extra, tag.tag);

        this.m_extra.push(tag);

        this.m_extra.sort((a, b) => (a.tag > b.tag) ? 1 : -1);
    }

    /**
     * Returns the pool nonce field as hexadecimal text
     */
    public get poolNonceHex (): string | undefined {
        for (const tag of this.m_extra) {
            if (tag.tag === ExtraTag.ExtraTagType.POOL_NONCE) {
                return (tag as ExtraTag.ExtraPoolNonce).data
                    .toString('hex');
            }
        }

        return undefined;
    }

    /**
     * Returns the transaction prefix in hexadecimal (blob) form
     */
    public get prefix (): string {
        return this.toBuffer(true).toString('hex');
    }

    /**
     * Returns the transaction prefix hash
     */
    public async prefixHash (): Promise<string> {
        if (this.m_cached.prefix && this.m_cached.prefix === this.prefix && this.m_cached.prefixHash) {
            return this.m_cached.prefixHash;
        }

        this.m_cached.prefix = this.prefix;

        const hash = await TurtleCoinCrypto.cn_fast_hash(this.m_cached.prefix);

        if (this.version >= 2) {
            const hash2 = await TurtleCoinCrypto.cn_fast_hash(hash + TransactionVersion2Suffix);

            this.m_cached.prefixHash = hash2;

            return hash2;
        }

        this.m_cached.prefixHash = hash;

        return hash;
    }

    /**
     * Returns the transaction public key (if available)
     */
    public get publicKey (): string | undefined {
        let result;

        for (const tag of this.m_extra) {
            if (tag.tag === ExtraTag.ExtraTagType.PUBKEY) {
                result = (tag as ExtraTag.ExtraPublicKey).publicKey;
            }
        }

        if (!result && this.transactionKeys.publicKey) {
            result = this.transactionKeys.publicKey;
        }

        return result;
    }

    /**
     * Returns the transaction private key (if available)
     */
    public get privateKey (): string | undefined {
        let result;

        for (const tag of this.m_extra) {
            if (tag.tag === ExtraTag.ExtraTagType.TRANSACTION_PRIVATE_KEY) {
                result = (tag as ExtraTag.ExtraTransactionPrivateKey).privateKey;
            }
        }

        if (!result && this.transactionKeys.privateKey) {
            result = this.transactionKeys.privateKey;
        }

        return result;
    }

    /**
     * Returns the transacton recipient public view key (if available)
     */
    public get recipientPublicViewKey (): string | undefined {
        let result;

        for (const tag of this.m_extra) {
            if (tag.tag === ExtraTag.ExtraTagType.RECIPIENT_PUBLIC_VIEW_KEY) {
                result = (tag as ExtraTag.ExtraRecipientPublicViewKey).publicKey;
            }
        }

        return result;
    }

    /**
     * Returns the transacton recipient public spend key (if available)
     */
    public get recipientPublicSpendKey (): string | undefined {
        let result;

        for (const tag of this.m_extra) {
            if (tag.tag === ExtraTag.ExtraTagType.RECIPIENT_PUBLIC_SPEND_KEY) {
                result = (tag as ExtraTag.ExtraRecipientPublicSpendKey).publicKey;
            }
        }

        return result;
    }

    /**
     * Returns the transaction size in bytes
     */
    public get size (): number {
        return this.toBuffer().length;
    }

    /**
     * The unlock time (or block height) for when the funds in the transaction are made available.
     * Returns a BigInteger only if the value exceeds MAX_SAFE_INTEGER
     */
    public get unlockTime (): BigInteger.BigInteger | number {
        if (this.m_unlockTime.greater(Number.MAX_SAFE_INTEGER)) {
            return this.m_unlockTime;
        } else {
            return this.m_unlockTime.toJSNumber();
        }
    }

    public set unlockTime (value: BigInteger.BigInteger | number) {
        if (typeof value === 'number') {
            value = BigInteger(value);
        }

        this.m_unlockTime = value;
    }

    /**
     * Whether the transaction data is read only
     * This is only set if the transaction is created from a blob as it is unlikely that
     * we will be changing data after a transaction is created and signed as it would
     * invalidate the transaction signatures
     */
    public get readonly (): boolean {
        return this.m_readonly;
    }

    public set readonly (value: boolean) {
        this.m_readonly = value;
    }

    /**
     * Constructs a new transaction from an existing transaction blob
     * @param data the transaction data blob
     * @returns the new transaction object
     */
    public static async from (data: Buffer | string): Promise<Transaction> {
        const result = new Transaction();

        const reader = new Reader(data);

        result.m_readonly = true;

        result.version = reader.varint().toJSNumber();

        result.unlockTime = reader.varint();

        const inputsCount = reader.varint().toJSNumber();

        for (let i = 0; i < inputsCount; i++) {
            const type = reader.uint8_t().toJSNumber();

            switch (type) {
                case TransactionInputs.InputType.COINBASE: {
                    const blockIndex = reader.varint().toJSNumber();
                    result.inputs.push(new TransactionInputs.CoinbaseInput(blockIndex));
                }
                    break;
                case TransactionInputs.InputType.KEY: {
                    const amount = reader.varint();
                    const keyOffsets: BigInteger.BigInteger[] = [];
                    const keyOffsetsLength = reader.varint().toJSNumber();
                    for (let j = 0; j < keyOffsetsLength; j++) {
                        keyOffsets.push(reader.varint());
                    }
                    const keyImage = reader.hash();
                    result.inputs.push(new TransactionInputs.KeyInput(amount, keyOffsets, keyImage));
                }
                    break;
                default:
                    throw new Error('Unknown input type');
            }
        }

        const outputsCount = reader.varint().toJSNumber();

        for (let i = 0; i < outputsCount; i++) {
            const amount = reader.varint();
            const type = reader.uint8_t().toJSNumber();

            if (type === TransactionOutputs.OutputType.KEY) {
                const key = reader.hash();
                result.outputs.push(new TransactionOutputs.KeyOutput(amount, key));
            } else {
                throw new Error('Unknown output type');
            }
        }

        const extraLength = reader.varint().toJSNumber();

        result.m_rawExtra = reader.bytes(extraLength);

        result.m_extra = readExtra(result.m_rawExtra);

        if (result.publicKey) {
            await result.transactionKeys.setPublicKey(result.publicKey);
        }

        /* If there are bytes remaining and mod 64 then they are signatures */
        if (reader.unreadBytes > 0 && reader.unreadBytes % 64 === 0) {
            for (const input of result.inputs) {
                if (input.type === TransactionInputs.InputType.COINBASE) {
                    continue;
                }

                const inputObject = input as TransactionInputs.KeyInput;

                const signatures = [];

                for (let i = 0; i < inputObject.keyOffsets.length; i++) {
                    const sig = reader.hex(64);

                    if (!Common.isHex128(sig)) {
                        throw new Error('Invalid signature data detected');
                    }

                    signatures.push(sig);
                }

                result.signatures.push(signatures);
            }
        }

        if (reader.unreadBytes > 0) {
            throw new RangeError('Unstructured data found at the end of the transaction');
        }

        return result;
    }

    public version = 1;
    public inputs: TransactionInputs.ITransactionInput[] = [];
    public outputs: TransactionOutputs.ITransactionOutput[] = [];
    public signatures: string[][] = [];
    public ignoredField = 0;
    public transactionKeys: ED25519.KeyPair = new ED25519.KeyPair();

    protected m_unlockTime: BigInteger.BigInteger = BigInteger.zero;
    protected m_rawExtra: Buffer = Buffer.alloc(0);
    protected m_readonly = false;
    protected m_extra: ExtraTag.IExtraTag[] = [];
    protected m_cached: Cache = { prefix: '', prefixHash: '', blob: '', hash: '' };

    /** @ignore */
    public async parseExtra (extra: Buffer): Promise<void> {
        this.m_readonly = true;

        this.m_rawExtra = extra;

        this.m_extra = readExtra(this.m_rawExtra);

        if (this.publicKey && await TurtleCoinCrypto.checkKey(this.publicKey)) {
            await this.transactionKeys.setPublicKey(this.publicKey);
        }
    }

    /**
     * Adds the arbitrary data supplied to the transaction extra field
     * @param data arbitrary data to be included
     */
    public addData (data: Buffer) {
        if (this.readonly) {
            throw new Error('Transaction is read-only');
        }

        const subTag = new ExtraNonceTag.ExtraNonceData(data);

        let found = false;

        for (let i = 0; i < this.m_extra.length; i++) {
            if (this.m_extra[i].tag === ExtraTag.ExtraTagType.NONCE) {
                (this.m_extra[i] as ExtraTag.ExtraNonce).addTag(subTag);
                found = true;
            }
        }

        if (!found) {
            const tag = new ExtraTag.ExtraNonce([subTag]);
            this.m_extra.push(tag);
        }
    }

    /**
     * Adds a merged minging tag with the supplied values to the transaction
     * @param depth the depth of the blockchain branch in the merkle root
     * @param merkleRoot the merkle root value
     */
    public addMergedMining (depth: number, merkleRoot: string) {
        if (this.readonly) {
            throw new Error('Transaction is read-only');
        }

        const tag = new ExtraTag.ExtraMergedMining(depth, merkleRoot);

        this.m_extra = removeExtraTag(this.m_extra, tag.tag);

        this.m_extra.push(tag);

        this.m_extra.sort((a, b) => (a.tag > b.tag) ? 1 : -1);
    }

    /**
     * Adds the supplied payment ID to the transaction extra field
     * @param paymentId the payment Id to include
     */
    public addPaymentId (paymentId: string) {
        if (this.readonly) {
            throw new Error('Transaction is read-only');
        }

        const subTag = new ExtraNonceTag.ExtraNoncePaymentId(paymentId);

        let found = false;
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < this.m_extra.length; i++) {
            if (this.m_extra[i].tag === ExtraTag.ExtraTagType.NONCE) {
                (this.m_extra[i] as ExtraTag.ExtraNonce).addTag(subTag);
                found = true;
            }
        }

        if (!found) {
            const tag = new ExtraTag.ExtraNonce([subTag]);
            this.m_extra.push(tag);
        }
    }

    /**
     * Adds the public key for the transaction to the transaction extra field
     * @param publicKey the public key of the transaction
     */
    public async addPublicKey (publicKey: string): Promise<void> {
        if (this.readonly) {
            throw new Error('Transaction is read-only');
        }

        const tag = new ExtraTag.ExtraPublicKey(publicKey);

        this.m_extra = removeExtraTag(this.m_extra, tag.tag);

        this.m_extra.push(tag);

        this.m_extra.sort((a, b) => (a.tag > b.tag) ? 1 : -1);

        await this.transactionKeys.setPublicKey(publicKey);
    }

    /**
     * Adds the private key for the transaction to the transaction extra field
     * @param privateKey the private key of the transaction
     */
    public async addPrivateKey (privateKey: string): Promise<void> {
        if (this.readonly) {
            throw new Error('Transaction is read-only');
        }

        const tag = new ExtraTag.ExtraTransactionPrivateKey(privateKey);

        this.m_extra = removeExtraTag(this.m_extra, tag.tag);

        this.m_extra.push(tag);

        this.m_extra.sort((a, b) => (a.tag > b.tag) ? 1 : -1);

        await this.transactionKeys.setPrivateKey(privateKey);
    }

    /**
     * Returns a buffer representation of the transaction object
     * @param [headerOnly] whether we should return just the prefix or not
     * @returns the buffer representation
     */
    public toBuffer (headerOnly = false): Buffer {
        const writer = new Writer();

        writer.varint(this.version);
        writer.varint(this.unlockTime);
        writer.varint(this.inputs.length);

        for (const input of this.inputs) {
            writer.write(input.toBuffer());
        }

        writer.varint(this.outputs.length);

        for (const output of this.outputs) {
            writer.write(output.toBuffer());
        }

        if (this.readonly) {
            writer.varint(this.m_rawExtra.length);
            writer.write(this.m_rawExtra);
        } else {
            const extra = writeExtra(this.m_extra);
            writer.varint(extra.length);
            writer.write(extra);
        }

        if (!headerOnly && this.signatures.length !== 0) {
            if (this.inputs.length !== this.signatures.length) {
                throw new RangeError('Number of signatures does not match the number of inputs');
            }

            for (let i = 0; i < this.inputs.length; i++) {
                for (const sig of this.signatures[i]) {
                    writer.hex(sig);
                }
            }
        }

        return writer.buffer;
    }

    /**
     * Returns the hexadecimal (blob) representation of the transaction object
     * @param [headerOnly] whether we should return just the prefix or not
     * @returns the hexadecimal (blob)  representation
     */
    public toString (headerOnly = false): string {
        return this.toBuffer(headerOnly).toString('hex');
    }
}

/** @ignore */
function removeExtraTag (tags: ExtraTag.IExtraTag[], removeTag: ExtraTag.ExtraTagType): ExtraTag.IExtraTag[] {
    const result: ExtraTag.IExtraTag[] = [];

    for (const tag of tags) {
        if (tag.tag !== removeTag) {
            result.push(tag);
        }
    }

    return result;
}

/** @ignore */
function readExtra (data: Buffer): ExtraTag.IExtraTag[] {
    const tags: ExtraTag.IExtraTag[] = [];
    const seen = {
        padding: false,
        publicKey: false,
        nonce: false,
        mergedMining: false,
        transactionPrivateKey: false,
        recipientPublicViewKey: false,
        recipientPublicSpendKey: false,
        poolNonce: false
    };

    const reader = new Reader(data);

    while (reader.unreadBytes > 0) {
        let tag = 0;

        try {
            tag = reader.varint(true).toJSNumber();
        } catch {
            reader.skip();
            continue;
        }

        let totalLength = Common.varintLength(tag);

        switch (tag) {
            case ExtraTag.ExtraTagType.PADDING:
                if (!seen.padding) {
                    try {
                        tags.push(ExtraTag.ExtraPadding.from(reader.bytes(totalLength)));
                        seen.padding = true;
                    } catch (e) {
                        reader.skip();
                    }
                } else {
                    reader.skip();
                }
                break;
            case ExtraTag.ExtraTagType.PUBKEY:
                totalLength += 32;
                if (!seen.publicKey && reader.unreadBytes >= totalLength) {
                    try {
                        tags.push(ExtraTag.ExtraPublicKey.from(reader.bytes(totalLength)));
                        seen.publicKey = true;
                    } catch (e) {
                        reader.skip();
                    }
                } else {
                    reader.skip();
                }
                break;
            case ExtraTag.ExtraTagType.NONCE:
                if (!seen.nonce && reader.unreadBytes >= 1) {
                    const tmpReader = new Reader(reader.unreadBuffer);
                    tmpReader.skip(totalLength);

                    let nonceLength = 0;
                    try {
                        nonceLength = tmpReader.varint().toJSNumber();
                        if (nonceLength > reader.unreadBytes) {
                            reader.skip();
                            continue;
                        }
                    } catch {
                        reader.skip();
                        continue;
                    }

                    totalLength += Common.varintLength(nonceLength) + nonceLength;

                    try {
                        tags.push(ExtraTag.ExtraNonce.from(reader.bytes(totalLength)));
                        seen.nonce = true;
                    } catch (e) {
                        reader.skip();
                    }
                } else {
                    reader.skip();
                }
                break;
            case ExtraTag.ExtraTagType.MERGED_MINING:
                if (!seen.mergedMining && reader.unreadBytes >= 1) {
                    const tmpReader = new Reader(reader.unreadBuffer);
                    tmpReader.skip(totalLength);

                    let mmLength = 0;
                    try {
                        mmLength = tmpReader.varint().toJSNumber();
                        if (mmLength > reader.unreadBytes) {
                            reader.skip();
                            continue;
                        }
                    } catch {
                        reader.skip();
                        continue;
                    }

                    totalLength += Common.varintLength(mmLength) + mmLength;

                    try {
                        tags.push(ExtraTag.ExtraMergedMining.from(reader.bytes(totalLength)));
                        seen.mergedMining = true;
                    } catch (e) {
                        reader.skip();
                    }
                } else {
                    reader.skip();
                }
                break;
            case ExtraTag.ExtraTagType.TRANSACTION_PRIVATE_KEY:
                totalLength += 32;
                if (!seen.transactionPrivateKey && reader.unreadBytes >= totalLength) {
                    try {
                        tags.push(ExtraTag.ExtraTransactionPrivateKey.from(reader.bytes(totalLength)));
                        seen.transactionPrivateKey = true;
                    } catch (e) {
                        reader.skip();
                    }
                } else {
                    reader.skip();
                }
                break;
            case ExtraTag.ExtraTagType.RECIPIENT_PUBLIC_VIEW_KEY:
                totalLength += 32;
                if (!seen.recipientPublicViewKey && reader.unreadBytes >= totalLength) {
                    try {
                        tags.push(ExtraTag.ExtraRecipientPublicViewKey.from(reader.bytes(totalLength)));
                        seen.recipientPublicViewKey = true;
                    } catch (e) {
                        reader.skip();
                    }
                } else {
                    reader.skip();
                }
                break;
            case ExtraTag.ExtraTagType.RECIPIENT_PUBLIC_SPEND_KEY:
                totalLength += 32;
                if (!seen.recipientPublicSpendKey && reader.unreadBytes >= totalLength) {
                    try {
                        tags.push(ExtraTag.ExtraRecipientPublicSpendKey.from(reader.bytes(totalLength)));
                        seen.recipientPublicSpendKey = true;
                    } catch (e) {
                        reader.skip();
                    }
                } else {
                    reader.skip();
                }
                break;
            case ExtraTag.ExtraTagType.POOL_NONCE:
                if (!seen.poolNonce) {
                    const tmpReader = new Reader(reader.unreadBuffer);
                    tmpReader.skip(totalLength);

                    let nonceLength = 0;
                    try {
                        nonceLength = tmpReader.varint().toJSNumber();
                        if (nonceLength > reader.unreadBytes) {
                            reader.skip();
                            continue;
                        }
                    } catch {
                        reader.skip();
                        continue;
                    }

                    totalLength += Common.varintLength(nonceLength) + nonceLength;

                    try {
                        tags.push(ExtraTag.ExtraPoolNonce.from(reader.bytes(totalLength)));
                        seen.nonce = true;
                    } catch (e) {
                        reader.skip();
                    }
                } else {
                    reader.skip();
                }
                break;
            default:
                reader.skip();
                break;
        }
    }

    return tags;
}

/** @ignore */
function writeExtra (tags: ExtraTag.IExtraTag[]): Buffer {
    const writer = new Writer();

    for (const tag of tags) {
        writer.write(tag.toBuffer());
    }

    return writer.buffer;
}
