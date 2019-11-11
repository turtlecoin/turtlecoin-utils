// Copyright (c) 2018-2019, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

export class CryptoNote {
    constructor(config?: CryptoNoteOptions);

    /**
     * Creates a new, random address seed.
     *
     * @param entropy       Optional entropy to use, otherwise we will use our own.
     * @param interations   Amount of keccak iterations to use on our pseudo pbkdf2.
     *                      Suggested to use a high amount if using poor entropy.
     */
    public createNewSeed(
        entropy?: string,
        iterations?: number): string;

    /**
     * Creates a new, random, deterministic address.
     *
     * @param entropy       Optional entropy to use, otherwise we will use our own.
     * @param lang          The language to encode the mnemonic in. Defaults to english.
     * @param addressPrefix The address prefix in decimal.
     */
    public createNewAddress(
        entropy?: string,
        lang?: string,
        addressPrefix?: string): Address;

    /**
     * Creates an address from the given seed.
     *
     * @param seed          The seed to create this address from.
     * @param lang          The language to encode the mnemonic in. Defaults to english.
     * @param addressPrefix The address prefix in decimal.
     */
    public createAddressFromSeed(
        seed: string,
        lang?: string,
        addressPrefix?: string): Address;

    /**
     * Creates an address from the given mnemonic seed.
     *
     * @param mnemnoic      A valid 25 word mnemonic.
     * @param lang          The language the mnemonic is encoded in. Defaults to english.
     * @param addressPrefix The address prefix in decimal.
     */
    public createAddressFromMnemonic(
        mnemonic: string,
        lang?: string,
        addressPrefix?: string): Address;

    /**
     * Creates an address from the given spend and view keys.
     *
     * @param privateSpendKey   A valid, 64 char hex key.
     * @param privateViewKey    A valid, 64 char hex key.
     * @param addressPrefix     The address prefix in decimal.
     */
    public createAddressFromKeys(
        privateSpendKey: string,
        privateViewKey: string,
        addressPrefix?: string): Address;

    /**
     * Decodes the address prefix from the given address into a number of formats.
     */
    public decodeAddressPrefix(address: string): DecodedAddressPrefix;

    /**
     * Decodes the given address or integrated address into public keys, prefix, and payment ID.
     */
    public decodeAddress(
        address: string,
        addressPrefix?: string): DecodedAddress;

    /**
     * Encodes the raw address data into a conventional address, using base58 encoding.
     */
    public encodeRawAddress(rawAddress: string): string;

    /**
     * Creates a standard address from a public view and spend key, and an optional payment ID,
     * for integrated addresses.
     */
    public encodeAddress(
        publicViewKey: string,
        publicSpendKey: string,
        paymentId?: string,
        addressPrefix?: string): string;

    /**
     * Creates an integrated address from a standard address and a paymentID.
     */
    public createIntegratedAddress(
        address: string,
        paymentId: string,
        addressPrefix?: string): string;

    /**
     * Converts a private key to the corresponding public key.
     */
    public privateKeyToPublicKey(privateKey: string): string;

    /**
     * Scans the given outputs, determining which of them belong to us.
     *
     * @param transactionPublicKey  The public key stored in the tx_extra of this transaction
     * @param outputs               The outputs of this transaction
     * @param privateViewKey        The private view key of the wallet you wish to scan with
     * @param publicSpendKey        The public spend key of the wallet you wish to scan with
     * @param privateSpendKey       The private spend key of the wallet you wish to scan with.
     *                              Optional. Required to aquire the necessary information for
     *                              spending transactions.
     */
    public scanTransactionOutputs(
        transactionPublicKey: string,
        outputs: OutputToScan[],
        privateViewKey: string,
        publicSpendKey: string,
        privateSpendKey?: string): OurOutput[];

    /**
     * Scans a single transaction output to determine if it belongs to us.
     *
     * @param transactionPublicKey  The public key stored in the tx_extra of this transaction
     * @param output                The output to scan
     * @param privateViewKey        The private view key of the wallet you wish to scan with
     * @param privateSpendKey       The private spend key of the wallet you wish to scan with.
     *                              Optional. Required to aquire the neccessary information for
     *                              spending transactions.
     *
     * @returns Returns false if the output is not ours.
     *          Returns the output with the input filled in, if the output is ours.
     *          If a private spend key is given, the `input.privateEphemeral` and `keyImage` properties
     *          will be filled in.
     */
    public isOurTransactionOutput(
        transactionPublicKey: string,
        output: OutputToScan,
        privateViewKey: string,
        privateSpendKey?: string): OurOutput | boolean;

    /**
     * Generates a key image for the given transaction data.
     *
     * @param transactionPublicKey  The public key stored in the tx_extra of this transaction
     * @param privateViewKey        The private view key of the wallet this transaction belongs to
     * @param publicSpendKey        The public spend key of the wallet this transaction belongs to
     * @param privateSpendKey       The private spend key of the wallet this transaction belongs to
     * @param outputIndex           The index of this output in the transaction (0 based indexing)
     *
     * @returns Returns the [keyImage, privateEphemeral]
     */
    public generateKeyImage(
        transactionPublicKey: string,
        privateViewKey: string,
        publicSpendKey: string,
        privateSpendKey: string,
        outputIndex: number): [string, string];

    /**
     * Generates a key image for the given transaction data, using a previously
     * created derivation.
     *
     * @param publicSpendKey    The public spend key of the wallet this transaction belongs to
     * @param privateSpendKey   The private spend key of the wallet this transaction belongs to
     * @param outputIndex       The index of this output in the transaction (0 based indexing)
     * @param derivation        The derivation of the private view key and the transaction public key
     *
     *
     * @returns Returns the [keyImage, privateEphemeral]
     */
    public generateKeyImagePrimitive(
        publicSpendKey: string,
        privateSpendKey: string,
        outputIndex: number,
        derivation: string): [string, string];

    /**
     * Creates a valid transaction to be submitted to the network for sending.
     */
    public createTransaction(
        newOutputs: TxDestination[],
        ourOutputs: Output[],
        randomOuts: RandomOutput[][],
        mixin: number,
        feeAmount: number,
        paymentId?: string,
        unlockTime?: number,
        extra?: any): CreatedTransaction;

    /**
     * Creates a valid transaction to be submitted to the network for sending.
     * Supports passed in user functions that are asynchronous.
     */
    public createTransactionAsync(
        newOutputs: TxDestination[],
        ourOutputs: Output[],
        randomOuts: RandomOutput[][],
        mixin: number,
        feeAmount: number,
        paymentId?: string,
        unlockTime?: number,
        extra?: any): Promise<CreatedTransaction>;

    /**
     * Converts an amount in atomic units, to a human friendly representation.
     */
    public formatMoney(amount: number): string;

    /**
     * Generates a key derivation from the transaction public key and the
     * wallet private view key.
     */
    public generateKeyDerivation(
        transactionPublicKey: string,
        privateViewKey: string): string;

    /**
     * Creates the corresponding public spend key of an output key, output index,
     * and derivation. If the public spend key matches the users public spend key,
     * the output belongs to them.
     */
    public underivePublicKey(
        derivation: string,
        outputIndex: number,
        outputKey: string): string;

    /**
     * Hashes the supplied data using the CN Fast Hash method
     */
    public cnFastHash(data: string): string;

    /**
     * Creates a BlockTemplate object based upon the JSON object returned by aLinkcolor
     * getBlockTemplate call to the daemon or blockchain cache
     */
    public blockTemplate(data: string): BlockTemplate;

    /**
     * A method to convert absolute offsets to relative offsets
     */
    public absoluteToRelativeOffsets(offsets: number[]): number[];

    /**
     * A method to convert relative offsets to absolute offsets
     */
    public relativeToAbsoluteOffsets(offsets: number[]): number[];

    /**
     * A primitive method to generate the signature of a message
     */
    public generateSignaturePrimitive(
        hash: string,
        publicKey: string,
        privateKey: string): string;

    /**
     * A primitive method to verify the signature of a message
     */
    public verifySignaturePrimitive(
        hash: string,
        publicKey: string,
        signature: string): boolean;

    /**
     * A method to generate the signature of a message
     */
    public signMessage(
        message: any,
        signerAddress: string,
        privateSpendKey: string): string;

    /**
     * A method to verify the signature of a message
     */
    public verifyMessageSignature(
        message: any,
        signerAddress: string,
        signature: string): boolean;

    /**
     * A method to create a deterministic subwallet from 
     * a given private key.
     */
    public createSubWalletFromPrivateSpendKey(
        privateSpendKey: string,
        subWalletIndex?: number,
        lang?: string,
        addressPrefix?: number
    ): DeterministicSubWallet;
}

export interface CryptoNoteOptions {
    /**
     * The amount of decimal places your coin has.
     */
    coinUnitPlaces?: number;

    /**
     * The hex/decimal address prefix of your coin.
     */
    addressPrefix?: number;

    /**
     * The amount of iterations to perform on pseudo pbkdf2.
     */
    keccakIterations?: number;

    /**
     * The default fee to use on a transaction when not specified.
     */
    defaultNetworkFee?: number;

    /**
     * The major block number where merged mining was activated
     */
    mmMiningBlockVersion?: number;

    /**
     * A replacement function for the JS/C++ underivePublicKey.
     */
    underivePublicKey?: (derivation: string,
                         outputIndex: number,
                         outputKey: string) => string;

    /**
     * A replacement function for the JS/C++ derivePublicKey.
     */
    derivePublicKey?: (derivation: string,
                       outputIndex: number,
                       publicKey: string) => string;

    /**
     * A replacement function for the JS/C++ deriveSecretKey.
     */
    deriveSecretKey?: (derivation: string,
                       outputIndex: number,
                       privateKey: string) => string;

    /**
     * A replacement function for the JS/C++ generateKeyImage.
     */
    generateKeyImage?: (transactionPublicKey: string,
                        privateViewKey: string,
                        publicSpendKey: string,
                        privateSpendKey: string,
                        outputIndex: number) => string;

    /**
     * A replacement function for the JS/C++ secretKeyToPublicKey.
     */
    secretKeyToPublicKey?: (privateKey: string) => string;

    /**
     * A replacement function for the JS/C++ cnFastHash.
     */
    cnFastHash?: (input: string) => string;

    /**
     * A replacement function for the JS/C++ generateRingSignatures.
     */
    generateRingSignatures?: (transactionPrefixHash: string,
                              keyImage: string,
                              inputKeys: string[],
                              privateKey: string,
                              realIndex: number) => string[];

    /**
     * A replacement function for the JS/C++ generateKeyDerivation.
     */
    generateKeyDerivation?: (transactionPublicKey: string,
                             privateViewKey: string) => string;
}

export interface DeterministicSubWallet {
    spend: Keys,
    view: Keys,
    address: string,
    mnemonic: string | null,
    seed: string | null,
    subWalletIndex: number
}

export interface OutputToScan {
    key: string;
    index: number;
}

export interface CreatedInput {
    transactionKey: Keys;
    publicEphemeral: string;
    privateEphemeral?: string;
}

export interface OurOutput extends OutputToScan {
    input: CreatedInput;
    keyImage?: string;
}

export interface Output {
    key: string;
    input: Input;
    keyImage: string;
    index: number;
    globalIndex: number;
    amount: number;
}

export interface Input {
    privateEphemeral: string;
}

export interface Address {
    spend: Keys;
    view: Keys;
    address: string;
    mnemonic: string;
    seed: string;
    subWalletIndex: number;
}

export interface Keys {
    privateKey: string;
    publicKey: string;
}

export interface DecodedAddressPrefix {
    prefix: string;
    base58: string;
    decimal: number;
    hexadecimal: string;
}

export interface DecodedAddress {
    publicViewKey: string;
    publicSpendKey: string;
    paymentId: string;
    encodedPrefix: string;
    prefix: number;
    rawAddress: string;
}

export interface TxDestination {
    amount: number;
    keys: DecodedAddress;
}

export interface Wallet {
    view: Keys;
    spend: Keys;
}

export interface RandomOutput {
    key: string;
    globalIndex: number;
}

export interface CreatedTransaction {
    transaction: Transaction;
    rawTransaction: string;
    hash: string;
}

export interface Transaction {
    version: number;
    unlockTime: number;
    inputs: Vin[];
    outputs: Vout[];
    extra: Extra;
    signatures: string[][];
    ignoredField: boolean;
    transactionKeys: Keys;
}

type Extra = Array<PublicKeyTag | NonceTag | MergeMiningTag>;

export interface PublicKeyTag {
    tag: 1;
    publicKey: string;
}

export interface NonceTag {
    tag: 2;
    nonces: Nonce[];
}

export interface MergeMiningTag {
    tag: 3;
    depth: number;
    merkleRoot: string;
}

export interface Nonce {
    tag: 0;
    paymentId: string;
}

export interface Vin {
    type: string;
    amount: number;
    keyImage: string;
    keyOffsets: number[];
}

export interface Vout {
    amount: number;
    type: string;
    key: string;
}

export interface BlockTemplate {
    blob: string;
    block: object;
    blockTemplate: string;
}
