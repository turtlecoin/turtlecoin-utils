// Copyright (c) 2018-2019, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

export class Block {
    constructor(hexData?: string | BlockConfig, opts?: BlockConfig);

    /**
     * The block major version at which Parent Blocks were enabled
     */
    public activateParentBlockVersion: number;

    /**
     * The block base transaction branch
     */
    public readonly baseTransactionBranch: string;

    /**
     * The hexadecimal representation of the block
     */
    public blob: string;

    /**
     * Returns the underlying cryptography module used
     */
    public readonly cryptoType: string;

    /**
     * The block extra nonce
     */
    public extraNonce: number;

    /**
     * The block hash
     */
    public readonly hash: string;

    /**
     * The hexadecimal representation of the block used for hashing (PoW)
     */
    public readonly hashingBlob: string;

    /**
     * The block height
     */
    public height: number | null;

    /**
     * The block PoW hash
     */
    public longHash: string;

    /**
     * The block major version
     */
    public majorVersion: number;

    /**
     * Whether the block meets the defined difficulty
     */
    public readonly meetsDiff: boolean;

    /**
     * The block merkle root
     */
    public readonly merkleRoot: string;

    /**
     * The previous block miner transaction
     */
    public minerTransaction: Transaction;

    /**
     * The block minor version
     */
    public minorVersion: number;

    /**
     * The block parent block structure
     */
    public parentBlock: ParentBlock;

    /**
     * The previous block hash
     */
    public previousBlockHash: string;

    /**
     * The size of the block in bytes
     */
    public readonly size: number;

    /**
     * The target difficulty of the block
     */
    public targetDifficulty: number;

    /**
     * The block timestamp
     */
    public timestamp: number;

    /**
     * The transaction hashes in the block
     */
    public transactions: string[];

    /**
     * The block transaction tree hash
     */
    public transactionTreeHashData: string;

    /**
     * Whether the PoW hash meets the supplied difficulty
     *
     * @param hash          The PoW hash
     * @param difficulty    The difficulty to meet (or exceed)
     */
    public hashMeetsDifficulty(
        hash: string,
        difficulty: number): boolean;
}

export class BlockTemplate {
    constructor(opts?: BlockTemplateConfig);

    /**
     * The block major version at which Parent Blocks were enabled
     */
    public activateParentBlockVersion: number;

    /**
     * The block contained in the BlockTemplate
     */
    public block: Block;

    /**
     * The BlockTemplate from the daemon
     */
    public blocktemplate: string;

    /**
     * The BlockTemplate target difficulty
     */
    public difficulty: number;

    /**
     * The block extra nonce
     */
    public extraNonce: number;

    /**
     * The BlockTemplate height
     */
    public height: number;

    /**
     * The block nonce
     */
    public nonce: number;

    /**
     * The BlockTemplate reserved offset
     */
    public reservedOffset: number;

    /**
     * Reconstructs a full block template using the nonce found by a pool miner
     * but first creating the parent block in the convert method and then merging
     * the two blocks together
     *
     * @param nonce The nonce to use in the new block
     * @param branch The blockchain branch to use in the new block
     */
    public construct(
        nonce: number,
        branch?: string): Block;

    /**
     * Converts the block template into a v1 block bob that is used by a
     * compatible miner during its PoW calculations
     */
    public convert(block?: Block): Block;
}

export class Crypto {
    constructor();

    /**
     * Whether the module is using native JS or WASM methods
     */
    public readonly isNative: boolean;

    /**
     * Whether the module is loaded and ready
     */
    public readonly isReady: boolean;

    /**
     * What type of underlying cryptographic library is being used
     */
    public readonly type: string;

    /**
     * Checks that the given key is a valid public key
     *
     * @param key   The public key to check
     */
    public checkKey(key: string): boolean;

    /**
     * Validates that the ring signatures provided are valid
     *
     * @param transactionPrefixHash The transaction prefix hash
     * @param keyImage              The key image that the signature pertains to
     * @param inputKeys             The input keys used in the ring
     * @param signatures            The signatures to verify
     */
    public checkRingSignatures(
        transactionPrefixHash: string,
        keyImage: string,
        inputKeys: string[],
        signatures: string[]): boolean;

    /**
     * Checks an individual signatures
     *
     * @param hash      The input hash
     * @param publicKey The public key used
     * @param signature The signature to check
     */
    public checkSignature(
        hash: string,
        publicKey: string,
        signature: string): boolean;

    /**
     * Chukwa Slow Hash Method
     *
     * @param data  Hexadecimal string to hash
     */
    public chukwa_slow_hash(data: string): [boolean, string];

    /**
     * CryptoNight Dark Lite v0 Slow Hash Method 
     *
     * @param data  Hexadecimal string to hash
     */
    public cn_dark_lite_slow_hash_v0(data: string): [boolean, string];

    /**
     * CryptoNight Dark Lite v1 Slow Hash Method 
     *
     * @param data  Hexadecimal string to hash
     */
    public cn_dark_lite_slow_hash_v1(data: string): [boolean, string];

    /**
     * CryptoNight Dark Lite v2 Slow Hash Method 
     *
     * @param data  Hexadecimal string to hash
     */
    public cn_dark_lite_slow_hash_v2(data: string): [boolean, string];

    /**
     * CryptoNight Dark v0 Slow Hash Method 
     *
     * @param data  Hexadecimal string to hash
     */
    public cn_dark_slow_hash_v0(data: string): [boolean, string];

    /**
     * CryptoNight Dark v1 Slow Hash Method 
     *
     * @param data  Hexadecimal string to hash
     */
    public cn_dark_slow_hash_v1(data: string): [boolean, string];

    /**
     * CryptoNight Dark v2 Slow Hash Method 
     *
     * @param data  Hexadecimal string to hash
     */
    public cn_dark_slow_hash_v2(data: string): [boolean, string];

    /**
     * CryptoNight Fast Hash Method 
     *
     * @param data  Hexadecimal string to hash
     */
    public cn_fast_hash(data: string): [boolean, string];

    /**
     * CryptoNight Lite v0 Slow Hash Method 
     *
     * @param data  Hexadecimal string to hash
     */
    public cn_lite_slow_hash_v0(data: string): [boolean, string];

    /**
     * CryptoNight Lite v1 Slow Hash Method 
     *
     * @param data  Hexadecimal string to hash
     */
    public cn_lite_slow_hash_v1(data: string): [boolean, string];

    /**
     * CryptoNight Lite v2 Slow Hash Method 
     *
     * @param data  Hexadecimal string to hash
     */
    public cn_lite_slow_hash_v2(data: string): [boolean, string];

    /**
     * CryptoNight v0 Slow Hash Method 
     *
     * @param data  Hexadecimal string to hash
     */
    public cn_slow_hash_v0(data: string): [boolean, string];

    /**
     * CryptoNight v1 Slow Hash Method 
     *
     * @param data  Hexadecimal string to hash
     */
    public cn_slow_hash_v1(data: string): [boolean, string];

    /**
     * CryptoNight v2 Slow Hash Method 
     *
     * @param data  Hexadecimal string to hash
     */
    public cn_slow_hash_v2(data: string): [boolean, string];

    /**
     * CryptoNight Soft Shell v0 Slow Hash Method 
     *
     * @param data      Hexadecimal string to hash
     * @param height    The height to use in the calculation
     */
    public cn_soft_shell_slow_hash_v0(
        data: string,
        height: number): [boolean, string];

    /**
     * CryptoNight Soft Shell v1 Slow Hash Method 
     *
     * @param data      Hexadecimal string to hash
     * @param height    The height to use in the calculation
     */
    public cn_soft_shell_slow_hash_v1(
        data: string,
        height: number): [boolean, string];

    /**
     * CryptoNight Soft Shell v2 Slow Hash Method 
     *
     * @param data      Hexadecimal string to hash
     * @param height    The height to use in the calculation
     */
    public cn_soft_shell_slow_hash_v2(
        data: string,
        height: number): [boolean, string];

    /**
     * CryptoNight Turtle Lite v0 Slow Hash Method 
     *
     * @param data  Hexadecimal string to hash
     */
    public cn_turtle_lite_slow_hash_v0(data: string): [boolean, string];

    /**
     * CryptoNight Turtle Lite v1 Slow Hash Method 
     *
     * @param data  Hexadecimal string to hash
     */
    public cn_turtle_lite_slow_hash_v1(data: string): [boolean, string];

    /**
     * CryptoNight Turtle Lite v2 Slow Hash Method 
     *
     * @param data  Hexadecimal string to hash
     */
    public cn_turtle_lite_slow_hash_v2(data: string): [boolean, string];

    /**
     * CryptoNight Turtle v0 Slow Hash Method 
     *
     * @param data  Hexadecimal string to hash
     */
    public cn_turtle_slow_hash_v0(data: string): [boolean, string];

    /**
     * CryptoNight Turtle v1 Slow Hash Method 
     *
     * @param data  Hexadecimal string to hash
     */
    public cn_turtle_slow_hash_v1(data: string): [boolean, string];

    /**
     * CryptoNight Turtle v2 Slow Hash Method 
     *
     * @param data  Hexadecimal string to hash
     */
    public cn_turtle_slow_hash_v2(data: string): [boolean, string];

    /**
     * Derives the public key from the specified parameters
     *
     * @param derivation    The derivation
     * @param outputIndex   The output index in the transaction
     * @param publicKey     The public key
     */
    public derivePublicKey(
        derivation: string,
        outputIndex: number,
        publicKey: string): [boolean, string];

    /**
     * Derives the secret key from the specified parameters
     *
     * @param derivation    The derivation
     * @param outputIndex   The output index in the transaction
     * @param secretKey     The secret key
     */
    public deriveSecretKey(
        derivation: string,
        outputIndex: number,
        secretKey: string): [boolean, string];

    /**
     * Generates a deterministic subwallet key pair
     */
    public generateDeterministicSubwalletKeys(): [boolean, { publicKey: string, secretKey: string }];

    /**
     * Generates the key derivation of the given keys
     *
     * @param transactionPublicKey  The transaction public key
     * @param privateViewKey        The private view key
     */
    public generateKeyDerivation(
        transactionPublicKey: string,
        privateViewKey: string): [boolean, string];

    /**
     * Generates the key image from the given public and private keys
     *
     * @param publicKey     The public ephemeral
     * @param privateKey    The private ephemeral
     */
    public generateKeyImage(
        publicKey: string,
        privateKey: string): [boolean, string];

    /**
     * Generates a key pair
     */
    public generateKeys(): [boolean, { publicKey: string, secretKey: string }];

    /**
     * Generates the deterministic private view key from the supplied private
     * spend key
     *
     * @param privateKey    The private spend key
     */
    public generatePrivateViewKeyFromPrivateSpendKey(privateKey: string): [boolean, string];

    /**
     * Generates the ring signatures for the supplied parameters
     *
     * @param transactionPrefixHash The transaction prefix hash
     * @param keyImage              The key image that the signature pertains to
     * @param inputKeys             The input keys used in the ringt
     * @param privateKey            The real private key used for signing
     * @param realIndex             The index of the real output in the inputKeys array
     */
    public generateRingSignatures(
        transactionPrefixHash: string,
        keyImage: string,
        inputKeys: string[],
        privateKey: string,
        realIndex: number): [boolean, string[]];

    /**
     * Generates a single signature
     *
     * @param hash          The input hash
     * @param publicKey     The public key to use
     * @param privateKey    The private key to use for signing process
     */
    public generateSignature(
        hash: string,
        publicKey: string,
        privateKey: string): [boolean, string];

    /**
     * Generates the determinstic view keys from the supplied private spend key
     *
     * @param privateKey    The private spend key
     */
    public generateViewKeysFromPrivateSpendKey(privateKey: string): [boolean, { publicKey: string, secretKey: string }];

    /**
     * Converts a hash to an elliptic curve
     *
     * @param hash  The hash to convert
     */
    public hashToEllipticCurve(hash: string): [boolean, string];

    /**
     * Converts a hash to a scalar
     *
     * @param hash  The hash to convert
     */
    public hashToScalar(hash: string): [boolean, string];

    /**
     * Performs a scalar multkey operation
     *
     * @param keyImageA     The first key image
     * @param keyImageB     The second key image
     */
    public scalarmultKey(
        keyImageA: string,
        keyImageB: string): [boolean, string];

    /**
     * Scalar 32-bit reduction
     *
     * @param data  Hexadecimal data to reduce
     */
    public scReduce32(data: string): [boolean, string];

    /**
     * Generates the public key from the private key
     *
     * @param privateKey    The private key
     */
    public secretKeyToPublicKey(privateKey: string): [boolean, string];

    /**
     * Calculates the tree branch of the given hashes
     *
     * @param arr   The hashes to use in the calculation
     */
    public tree_branch(arr: string[]): [boolean, string[]];

    /**
     * Calculates the tree depth of the given value
     *
     * @param count The number of items
     */
    public tree_depth(count: number): [boolean, number];

    /**
     * Calculates the tree hash of the given hashes
     *
     * @param arr   The hashes to use in the calculation
     */
    public tree_hash(arr: string[]): [boolean, string];

    /**
     * Calculates the tree hash of the given branches
     *
     * @param branches  The hashes of the branches to use in the calculation
     * @param leaf      The leaf to include in the calculation
     * @param path      The path to include in the calculation
     */
    public tree_hash_from_branch(
        branches: string[],
        leaf: string[],
        path: number): [boolean, string];

    /**
     * Underives the public key from the given parameters
     *
     * @param derivation    The derivation
     * @param outputIndex   The output index in the transaction
     * @param outputKey     The output key
     */
    public underivePublicKey(
        derivation: string,
        outputIndex: number,
        outputKey: string): [boolean, string];
}

export class CryptoNote {
    constructor(config?: Config);

    /**
     * Returns the underlying cryptography module used
     */
    public readonly cryptoType: string;

    /**
     * Converts a list of absolute output offsets to relative offsets 
     */
    public absoluteToRelativeOffsets(offsets: number[] | string[]): string[];

    /**
     * Hashes the the supplied data with the CryptoNight Fast Hash method 
     */
    public cnFastHash(data: string): string;

    /**
     * Creates a new wallet from keys
     *
     * @param privateSpendKey   The wallet private spend key
     * @param privateViewKey    The wallet private view key
     * @param addressPrefix     Decimal representation of the CryptoNote address prefix
     */
    public createAddressFromKeys(
        privateSpendKey: string,
        privateViewKey: string,
        addressPrefix?: string): Wallet;

    /**
     * Creates a new wallet from mnemonic seed phrase
     *
     * @param mnemnoic      The wallet mnemonic seed phrase
     * @param lang          Language for the returned mnemonic
     * @param addressPrefix Decimal representation of the CryptoNote address prefix
     */
    public createAddressFromMnemonic(
        mnemonic: string,
        lang?: string,
        addressPrefix?: string): Wallet;

    /**
     * Creates an address from the given seed.
     *
     * @param seed          Hexadecimal representation of the wallet seed
     * @param lang          Language for the returned mnemonic
     * @param addressPrefix Decimal representation of the CryptoNote address prefix
     */
    public createAddressFromSeed(
        seed: string,
        lang?: string,
        addressPrefix?: string): Wallet;

    /**
     * Creates an integrated address from the supplied wallet address and payment ID
     *
     * @param address       The wallet address
     * @param paymentId     A 64 hexadecimal character payment ID
     * @param addressPrefix Decimal representation of the CryptoNote address prefix
     */
    public createIntegratedAddress(
        address: string,
        paymentId?: string,
        addressPrefix?: string): string;

    /**
     * Creates a new wallet
     *
     * @param entropy       Random data for entropy purposes
     * @param lang          Language for the returned mnemonic
     * @param addressPrefix Decimal representation of the CryptoNote address prefix
     */
    public createNewAddress(
        entropy?: string,
        lang?: string,
        addressPrefix?: string): Wallet;

    /**
     * Creates a new wallet seed using the supplied entropy and iteration count
     *
     * @param entropy       Optional entropy to use, otherwise we will use our own.
     * @param interations   Amount of keccak iterations to use on our pseudo pbkdf2.
     *                      Suggested to use a high amount if using poor entropy.
     */
    public createNewSeed(
        entropy?: string,
        iterations?: number): string;

    /**
     * Creates a new determinstic subwallet using the supplied values
     *
     * @param privateSpendKey   The seed/privateSpendKey of the primary wallet
     * @param subWalletIndex    The subwallet index number
     * @param lang              The language of the wallet (only used if index == 0)
     * @param addressPrefix     Decimal representation of the CryptoNote address prefix
     */
    public createSubWalletFromPrivateSpendKey(
        privateSpendKey: string,
        subWalletIndex: number,
        lang?: string,
        addressPrefix?: number): Wallet;

    /**
     * Creates a new Transaction object using the supplied values
     *
     * @param newOutputs    The outputs of the new transaction
     * @param ourOutputs    The outputs we are spending
     * @param randomOuts    The random outputs to mix with
     * @param mixin         The mixin count to use
     * @param feeAmount     The transaction fee to use
     * @param paymentId     The payment ID to use with the transaction
     * @param unlockTime    The unlock time for the transaction
     * @param extraData     Extra data to include in the transaction
     */
    public createTransaction(
        newOutputs: GeneratedOutput[],
        ourOutputs: Output[],
        randomOuts: RandomOutput[][],
        mixin: number,
        feeAmount: number,
        paymentId?: string,
        unlockTime?: number,
        extra?: Buffer | Object | string): boolean | GeneratedTransaction;

    /**
     * Creates a new Transaction using the supplied values in an asynchronous manner
     *
     * @param newOutputs    The outputs of the new transaction
     * @param ourOutputs    The outputs we are spending
     * @param randomOuts    The random outputs to mix with
     * @param mixin         The mixin count to use
     * @param feeAmount     The transaction fee to use
     * @param paymentId     The payment ID to use with the transaction
     * @param unlockTime    The unlock time for the transaction
     * @param extraData     Extra data to include in the transaction
     */
    public createTransactionAsync(
        newOutputs: GeneratedOutput[],
        ourOutputs: Output[],
        randomOuts: RandomOutput[][],
        mixin: number,
        feeAmount: number,
        paymentId?: string,
        unlockTime?: number,
        extra?: Buffer | Object | string): Promise<boolean | GeneratedTransaction>;

    /**
     * Creates pretty (base 10) outputs for the address and amount specified
     *
     * @param address   The destination wallet address
     * @param amount    The total amount for which we need to generate outputs
     */
    public createTransactionOutputs(
        address: string,
        amount: number): GeneratedOutput[];

    /**
     * Creates a new Transaction object using the supplied values
     *
     * @param newOutputs    The outputs of the new transaction
     * @param ourOutputs    The outputs we are spending
     * @param randomOuts    The random outputs to mix with
     * @param mixin         The mixin count to use
     * @param feeAmount     The transaction fee to use
     * @param paymentId     The payment ID to use with the transaction
     * @param unlockTime    The unlock time for the transaction
     * @param _async        Whether we are calling this method asynchronously or not
     * @param extraData     Extra data to include in the transaction
     */
    public createTransactionStructure(
        newOutputs: GeneratedOutput[],
        ourOutputs: Output[],
        randomOuts: RandomOutput[][],
        mixin: number,
        feeAmount: number,
        paymentId?: string,
        unlockTime?: number,
        extra?: Buffer | Object | string): (boolean | GeneratedTransaction) | Promise<boolean | GeneratedTransaction>;

    /**
     * Decodes the given address into its respective parts
     *
     * @param address       The wallet address
     * @param addressPrefix Decimal representation of the CryptoNote address prefix
     */
    public decodeAddress(
        address: string,
        addressPrefix?: string): DecodedAddress;

    /**
     * Decodes the address prefix from the given address
     *
     * @param address The wallet address
     */
    public decodeAddressPrefix(address: string): AddressPrefix;

    /**
     * Encodes the public information into a wallet address
     *
     * @param publicViewKey     The wallet public view key
     * @param publicSpendKey    The wallet public spend key
     * @param paymentId         A 64 hexadecimal character payment ID
     * @param addressPrefix     Decimal representation of the CryptoNote address prefix
     */
    public encodeAddress(
        publicViewKey: string,
        publicSpendKey: string,
        paymentId?: string,
        addressPrefix?: string): string;

    /**
     * Encodes the raw (hex) address into Base58
     *
     * @param rawAddress The hexadecimal representation of the address
     */
    public encodeRawAddress(rawAddress: string): string;

    /**
     * Formats the amount into a human readable form
     *
     * @param amount    The amount to format
     */
    public formatMoney(amount: number): string;

    /**
     * Generates a key derivation from the supplied keys
     *
     * @param transactionPublicKey  The transaction public key
     * @param privateViewKey        The wallet private view key
     */
    public generateKeyDerivation(
        transactionPublicKey: string,
        privateViewKey: string): string;

    /**
     * Generates the key image of an output that is required to spend it
     *
     * @param transactionPublicKey  The transaction public key
     * @param privateViewKey        The private view key of the wallet
     * @param publicSpendKey        The public spend key of the wallet
     * @param privateSpendKey       The private spend key of the wallet
     * @param outputIndex           The index of this output in the transaction
     */
    public generateKeyImage(
        transactionPublicKey: string,
        privateViewKey: string,
        publicSpendKey: string,
        privateSpendKey: string,
        outputIndex: number): [string, string];

    /**
     * Generates the key image primitive of an output that is required to spend it
     *
     * @param publicSpendKey    The wallet public spend key
     * @param privateSpendKey   The wallet private spend key
     * @param outputIndex       The index of this output in the transaction
     * @param derivation        The output derivation
     */
    public generateKeyImagePrimitive(
        publicSpendKey: string,
        privateSpendKey: string,
        outputIndex: number,
        derivation: string): [string, string];

    /**
     * Generates a signature using the supplied parameters
     *
     * @param hash          The hash to sign
     * @param publicKey     The public key to use in signing
     * @param privateKey    The private key to use in signing
     */
    public generateSignaturePrimitive(
        hash: string,
        publicKey: string,
        privateKey: string): string;

    /**
     * Checks a particular output to determine if it belongs to the keys provided
     *
     * @param transactionPublicKey  The transaction public key
     * @param output                The transaction output to check
     * @param privateViewKey        The private view key of the wallet
     * @param privateSpendKey       The private spend key of the wallet
     *                              spending transactions.
     *
     */
    public isOurTransactionOutput(
        transactionPublicKey: string,
        output: Output,
        privateViewKey: string,
        privateSpendKey?: string): Output | boolean;

    /**
     * Generates the public key for the given private key
     *
     * @param privateKey    The private key
     */
    public privateKeyToPublicKey(privateKey: string): string;

    /**
     * Converts a list of relative output offsets to absolute offsets
     * 
     * @param offsets   The offsets
     */
    public relativeToAbsoluteOffsets(offsets: number[] | string[]): string[];

    /**
     * Checks all outputs to determine if any of the outputs belong to the keys provided
     *
     * @param transactionPublicKey  The transaction public key
     * @param outputs               The array of outputs of a transaction
     * @param privateViewKey        The private view key of the wallet
     * @param publicSpendKey        The public spend key of the wallet
     * @param privateSpendKey       The private spend key of the wallet
     */
    public scanTransactionOutputs(
        transactionPublicKey: string,
        outputs: Output[],
        privateViewKey: string,
        publicSpendKey: string,
        privateSpendKey?: string): Output[];

    /**
     * Value to scalar method
     *
     * @param value The 64-character hexadecimal value to reduce
     */
    public scReduce32(value: string): string;

    /**
     * Signs an arbitrary message from the specified signer with their private
     * spend key
     *
     * @param message           The message to sign
     * @param signerAddress     The signer's wallet address
     * @param privateSpendKey   The signer's private spend key
     */
    public signMessage(
        message: string | Object,
        signerAddress: string,
        privateSpendKey: string): string;

    /**
     * Underives the public key from the supplied derivation and other values
     *
     * @param derivation    The derivation
     * @param outputIndex   The index of the output in the transaction
     * @param outputKey     The output key to underive from
     */
    public underivePublicKey(
        derivation: string,
        outputIndex: number,
        outputKey: string): string;

    /**
     * Verifies that the signature of the supplied message was generated by 
     * the specified signer's wallet
     *
     * @param message       The message that was signed
     * @param signerAddress The signer's wallet address
     * @param signature     The signature to verify
     */
    public verifyMessageSignature(
        message: string | Object,
        signerAddress: string,
        signature: string): boolean;
    
    /**
     * Verifies a signature using the supplied parameters
     *
     * @param hash      The hash that was signed
     * @param publicKey The public key that was used in signing
     * @param signature The signature
     */
    public verifySignaturePrimitive(
        hash: string,
        publicKey: string,
        signature: string): boolean;
}

export class LevinPacket {
    constructor(hexData?: string);

    /**
     * The hexadecimal representation of the packet
     */
    public readonly blob: string;

    /**
     * The packet as a Buffer
     */
    public readonly buffer: Buffer;

    /**
     * The command this packet is for
     */
    public command: number;

    /**
     * The packet flag(s)
     */
    public flags: number;

    /**
     * The payload contained within the packet
     */
    public payload: Buffer;

    /**
     * The length of the payload in bytes
     */
    public readonly payloadLength: number;
    
    /**
     * The level protocol version
     */
    public protocolVersion: number;

    /**
     * The return code of the packet
     */
    public returnCode: number;

    /**
     * Whether this packet is in response to a request
     */
    public returnData: boolean;

    /**
     * The levin packet signature
     */
    public signature: string;
}

export class Transaction {
    constructor(hexData?: string);

    /**
     * The amount of the transaction
     */
    public readonly amount: number;

    /**
     * The hexadecimal representation of the transaction
     */
    public blob: string;

    /**
     * Returns the underlying cryptography module used
     */
    public readonly cryptoType: string;

    /**
     * The transaction extra tags/hex
     */
    public extra: TransactionExtraTag[] | string;

    /**
     * The hexadecimal representation of the transaction extra information
     */
    public readonly extraBlob: string;

    /**
     * The hexadecimal representation of the transaction extra data
     */
    public readonly extraData: string;

    /**
     * The size of  the transaction extra field in bytes
     */
    public readonly extraSize: number;

    /**
     * The transaction fee of the transaction
     */
    public readonly fee: number;

    /**
     * The transaction hash
     */
    public readonly hash: string;

    /**
     * Ignored field only used in some transactions
     */
    public ignoredField: boolean;

    /**
     * The transaction inputs
     */
    public inputs: TransactionInput[];

    /**
     * The transaction outputs
     */
    public outputs: TransactionOutput[];

    /**
     * The hexadecimal representation of the transaction payment ID
     */
    public readonly paymentId: string;

    /**
     * The hexadecimal representation of the transaction prefix
     */
    public readonly prefix: string;

    /**
     * The transaction prefix hash
     */
    public readonly prefixHash: string;

    /**
     * The hexadecimal representation of the transaction public key
     */
    public readonly publicKey: string;

    /**
     * The transaction signatures
     */
    public signatures: Array<string[]>;

    /**
     * The size of the transaction in bytes
     */
    public readonly size: number;

    /**
     * The unlock time of the transaction
     */
    public unlockTime: number;

    /**
     * The version number of the transaction
     */
    public version: number;

    /**
     * Adds an arbitrary data to the Transaction's extra information
     *
     * @param data  The data to add
     */
    public addExtraData(data: Buffer | string): boolean;

    /**
     * Adds a payment ID to the Transactions' extra information
     *
     * @param paymentId The payment ID for the transaction
     */
    public addPaymentId(paymentId: string): boolean;

    /**
     * Adds a transaction public key to the Transaction's extra information
     * 
     * @param publicKey The public key of the transaction
     */
    public addPublicKey(publicKey: string): boolean;
}

export interface Address extends Wallet {
}

export interface AddressPrefix {
    prefix: string;
    base58: string;
    decimal: number;
    hexadecimal: string;
}

export interface BlockConfig {
    /**
     * The block major version at which parent blocks were enabled.
     */
    activateParentBlockVersion: number;
}

export interface BlockTemplateConfig {
    /**
     * The BlockTemplate from the daemon
     */
    blocktemplate: string;

    /**
     * The target difficulty for the BlockTemplate
     */
    difficulty: number;

    /**
     * The block height of the BlockTemplate
     */
    height: number;

    /**
     * The reserved offset of the BlockTemplate
     */
    reservedOffset: number;
}

export interface Config {
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
    
    /*
     * The max output size in atomic units to create in transactions
     */
    maximumOutputAmount?: number;

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
     * A replacement function for the JS/C++ checkRingSignatures.
     */
    checkRingSignatures?: (transactionPrefixHash: string,
                           keyImage: string,
                           publicKeys: string[],
                           signatures: string[]) => boolean;

    /**
     * A replacement function for the JS/C++ generateKeyDerivation.
     */
    generateKeyDerivation?: (transactionPublicKey: string,
                             privateViewKey: string) => string;
    
    /**
     * A replacement function for the JS/C++ checkSignature.
     */
    checkSignature?: (digestHash: string,
                      publicKey: string,
                      signature: string) => boolean;
    
    /**
     * A replacement function for the JS/C++ generateSignature.
     */
    generateSignature?: (digestHash: string,
                         publicKey: string,
                         privateKey: string) => [boolean, string];
}

export interface CreatedTransaction extends GeneratedTransaction {
}

export interface CryptoNoteOptions extends Config {
}

export interface DecodedAddress {
    publicViewKey: string;
    publicSpendKey: string;
    paymentId: string;
    encodingPrefix: string;
    prefix: number;
    rawAddress: string;
}

export interface DecodedAddressPrefix extends AddressPrefix {
}

export interface GeneratedInput {
    transactionKey: KeyPair;
    publicEphemeral: string;
    privateEphemeral?: string;
}

export interface GeneratedOutput {
    amount: number;
    keys: Address;
}

export interface GeneratedTransaction {
    transaction: Transaction;
    rawTransaction: string;
    hash: string;
}

export interface Keys extends KeyPair {
}

export interface KeyPair {
    privateKey: string;
    publicKey: string;
}

export interface OurOutput extends Output {
}

export interface Output {
    key: string;
    index: number;
    globalIndex: number;
    amount: number;
    type?: string;
    keyImage?: string;
    input?: GeneratedInput;
}

export interface OutputToScan extends Output {
}

export interface ParentBlock {
    /**
     * The major version of the parent block
     */
    majorVersion: number;

    /**
     * The minor version of the parent block
     */
    minorVersion: number;

    /**
     * The parent block previous block hash
     */
    previousBlockHash: string;
    
    /**
     * The number of transactions in the parent block
     */
    transactionCount: number;

    /**
     * The parent block base transaction branch hash(es)
     */
    baseTransactionBranch: string[];

    /**
     * The parent block miner transaction
     */
    minerTransaction: Transaction;

    /**
     * The parent block blockchain branch hash(es)
     */
    blockchainBranch: string[];
}

export interface RandomOutput {
    key: string;
    globalIndex: number;
}

export interface TransactionExtraNonce {
    tag: number;
    paymentId: string;
}

export interface TransactionExtraTag {
    tag: number;
    publicKey?: string;
    nonces?: TransactionExtraNonce[];
    depth?: number;
    merkleRoot?: string;
}

export interface TransactionInput {
    type: string;
    amount?: number;
    keyOffsets?: number[];
    keyImage?: string;
    blockIndex?: number;
}

export interface TransactionOutput {
    type: string;
    amount: number;
    key: string;
}

export interface TxDestination extends GeneratedOutput {
}

export interface Vin extends TransactionInput {
}

export interface Vout extends TransactionOutput {
}

export interface Wallet {
    spend: KeyPair;
    view: KeyPair;
    address: string;
    mnemonic: string;
    seed: string;
    subWalletIndex: number;
}
