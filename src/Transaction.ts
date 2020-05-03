// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import {Common} from './Common';
import {
    BigInteger,
    ED25519,
    ExtraNonceTag,
    ExtraTag,
    TransactionInputs,
    TransactionOutputs,
    TurtleCoinCrypto,
} from './Types';
import {Reader, Writer} from 'bytestream-helper';

/** @ignore */
const TransactionVersion2Suffix = 'bc36789e7a1e281436464229828f817d6612f7b477d66591ff96a9e064bcc98a0000000000000000000000000000000000000000000000000000000000000000';

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
     * Returns the total amount of the transaction inputs
     */
    public get amount(): number {
        let amount = BigInteger.zero;

        for (const input of this.inputs) {
            if (input.type === TransactionInputs.InputType.KEY) {
                amount = amount.add((input as TransactionInputs.KeyInput).amount);
            }
        }

        return amount.toJSNumber();
    }

    /**
     * Returns the transaction extra as a buffer
     */
    public get extra(): Buffer {
        if (!this.m_readonly) {
            return writeExtra(this.m_extra);
        }

        return this.m_rawExtra;
    }

    /**
     * Returns the structured arbitrary data found in the transaction extra
     */
    public get extraData(): Buffer {
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
    public get fee(): number {
        const inputAmount = BigInteger(this.amount);

        if (inputAmount === BigInteger.zero) {
            return 0;
        }

        let outputAmount = BigInteger.zero;

        for (const output of this.outputs) {
            if (output.type === TransactionOutputs.OutputType.KEY) {
                outputAmount = outputAmount.add((output as TransactionOutputs.KeyOutput).amount);
            }
        }

        return inputAmount.subtract(outputAmount).toJSNumber();
    }

    /**
     * Returns the transaction hash
     */
    public get hash(): string {
        if (this.m_cached.blob && this.m_cached.blob === this.toString() && this.m_cached.hash) {
            return this.m_cached.hash;
        }

        this.m_cached.blob = this.toString();

        const hash = TurtleCoinCrypto.cn_fast_hash(this.m_cached.blob);

        if (this.version >= 2) {
            const hash2 = TurtleCoinCrypto.cn_fast_hash(hash + TransactionVersion2Suffix);

            this.m_cached.hash = hash2;

            return hash2;
        }

        this.m_cached.hash = hash;

        return hash;
    }

    /**
     * Returns the merged mining tag found within the transaction
     */
    public get mergedMining(): ExtraTag.ExtraMergedMining | undefined {
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
    public get paymentId(): string | undefined {
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
     * Returns the transaction prefix in hexadecimal (blob) form
     */
    public get prefix(): string {
        return this.toBuffer(true).toString('hex');
    }

    /**
     * Returns the transaction prefix hash
     */
    public get prefixHash(): string {
        if (this.m_cached.prefix && this.m_cached.prefix === this.prefix && this.m_cached.prefixHash) {
            return this.m_cached.prefixHash;
        }

        this.m_cached.prefix = this.prefix;

        const hash = TurtleCoinCrypto.cn_fast_hash(this.m_cached.prefix);

        if (this.version >= 2) {
            const hash2 = TurtleCoinCrypto.cn_fast_hash(hash + TransactionVersion2Suffix);

            this.m_cached.prefixHash = hash2;

            return hash2;
        }

        this.m_cached.prefixHash = hash;

        return hash;
    }

    /**
     * Returns the transaction public key
     */
    public get publicKey(): string | undefined {
        let result;

        for (const tag of this.m_extra) {
            if (tag.tag === ExtraTag.ExtraTagType.PUBKEY) {
                result = (tag as ExtraTag.ExtraPublicKey).publicKey;
            }
        }

        return result;
    }

    /**
     * Returns the transaction size in bytes
     */
    public get size(): number {
        return this.toBuffer().length;
    }

    /**
     * The unlock time (or block height) for when the funds in the transaction are made available.
     * Returns a BigInteger only if the value exceeds MAX_SAFE_INTEGER
     */
    public get unlockTime(): BigInteger.BigInteger | number {
        if (this.m_unlockTime.greater(Number.MAX_SAFE_INTEGER)) {
            return this.m_unlockTime;
        } else {
            return this.m_unlockTime.toJSNumber();
        }
    }

    public set unlockTime(value: BigInteger.BigInteger | number) {
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
    public get readonly(): boolean {
        return this.m_readonly;
    }

    /**
     * Constructs a new transaction from an existing transaction blob
     * @param data the transaction data blob
     * @returns the new transaction object
     */
    public static from(data: Buffer | string): Transaction {
        const reader = new Reader(data);

        const result = new Transaction();

        result.m_readonly = true;

        result.version = reader.varint().toJSNumber();

        result.unlockTime = reader.varint();

        const inputsCount = reader.varint().toJSNumber();

        for (let i = 0; i < inputsCount; i++) {
            const type = reader.uint8_t().toJSNumber();

            switch (type) {
                case TransactionInputs.InputType.COINBASE:
                    const blockIndex = reader.varint().toJSNumber();
                    result.inputs.push(new TransactionInputs.CoinbaseInput(blockIndex));
                    break;
                case TransactionInputs.InputType.KEY:
                    const amount = reader.varint();
                    const keyOffsets: BigInteger.BigInteger[] = [];
                    const keyOffsetsLength = reader.varint().toJSNumber();
                    for (let j = 0; j < keyOffsetsLength; j++) {
                        keyOffsets.push(reader.varint());
                    }
                    const keyImage = reader.hash();
                    result.inputs.push(new TransactionInputs.KeyInput(amount, keyOffsets, keyImage));
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
            result.transactionKeys.publicKey = result.publicKey;
        }

        /* If there are bytes remaining and mod 64 then they are signatures */
        if (reader.unreadBytes > 0 && reader.unreadBytes % 64 === 0) {
            for (const input of result.inputs) {
                if (input.type === TransactionInputs.InputType.COINBASE) {
                    continue;
                }

                const inputObject = input as TransactionInputs.KeyInput;

                const signatures = [];

                for (const offset of inputObject.keyOffsets) {
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

    public version: number = 1;
    public inputs: TransactionInputs.ITransactionInput[] = [];
    public outputs: TransactionOutputs.ITransactionOutput[] = [];
    public signatures: string[][] = [];
    public ignoredField: number = 0;
    public transactionKeys: ED25519.KeyPair = new ED25519.KeyPair(
        undefined,
        undefined,
        undefined,
        undefined,
        true);
    protected m_unlockTime: BigInteger.BigInteger = BigInteger.zero;
    protected m_rawExtra: Buffer = Buffer.alloc(0);
    protected m_readonly: boolean = false;
    protected m_extra: ExtraTag.IExtraTag[] = [];
    protected m_cached: Cache = {prefix: '', prefixHash: '', blob: '', hash: ''};

    /** @ignore */
    public parseExtra(extra: Buffer) {
        this.m_readonly = true;

        this.m_rawExtra = extra;

        this.m_extra = readExtra(this.m_rawExtra);

        if (this.publicKey) {
            this.transactionKeys.publicKey = this.publicKey;
        }
    }

    /**
     * Adds the arbitrary data supplied to the transaction extra field
     * @param data arbitrary data to be included
     */
    public addData(data: Buffer) {
        if (this.readonly) {
            throw new Error('Transaction is read-only');
        }

        const subTag = new ExtraNonceTag.ExtraNonceData(data);

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
     * Adds a merged minging tag with the supplied values to the transaction
     * @param depth the depth of the blockchain branch in the merkle root
     * @param merkleRoot the merkle root value
     */
    public addMergedMining(depth: number, merkleRoot: string) {
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
    public addPaymentId(paymentId: string) {
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
    public addPublicKey(publicKey: string) {
        if (this.readonly) {
            throw new Error('Transaction is read-only');
        }

        const tag = new ExtraTag.ExtraPublicKey(publicKey);

        this.m_extra = removeExtraTag(this.m_extra, tag.tag);

        this.m_extra.push(tag);

        this.m_extra.sort((a, b) => (a.tag > b.tag) ? 1 : -1);

        this.transactionKeys.publicKey = publicKey;
    }

    /**
     * Returns a buffer representation of the transaction object
     * @param [headerOnly] whether we should return just the prefix or not
     * @returns the buffer representation
     */
    public toBuffer(headerOnly: boolean = false): Buffer {
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
    public toString(headerOnly: boolean = false, encoding: string = 'hex'): string {
        return this.toBuffer(headerOnly).toString(encoding);
    }
}

/** @ignore */
function removeExtraTag(tags: ExtraTag.IExtraTag[], removeTag: ExtraTag.ExtraTagType): ExtraTag.IExtraTag[] {
    const result: ExtraTag.IExtraTag[] = [];

    for (const tag of tags) {
        if (tag.tag !== removeTag) {
            result.push(tag);
        }
    }

    return result;
}

/** @ignore */
function readExtra(data: Buffer): ExtraTag.IExtraTag[] {
    const tags: ExtraTag.IExtraTag[] = [];
    const seen = {
        padding: false,
        publicKey: false,
        nonce: false,
        mergedMining: false,
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
            default:
                reader.skip();
                break;
        }
    }

    return tags;
}

/** @ignore */
function writeExtra(tags: ExtraTag.IExtraTag[]): Buffer {
    const writer = new Writer();

    for (const tag of tags) {
        writer.write(tag.toBuffer());
    }

    return writer.buffer;
}
