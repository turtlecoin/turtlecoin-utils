/// <reference types="ledgerhq__hw-transport" />
/// <reference types="node" />
import { CryptoNoteInterfaces } from './Types/ICryptoNote';
import { ICoinConfig, ICoinRunningConfig } from './Config';
import Transport from '@ledgerhq/hw-transport';
import { BigInteger, ICryptoConfig, Interfaces } from './Types';
import { AddressPrefix } from './AddressPrefix';
import { Address } from './Address';
import { Transaction } from './Transaction';
import { EventEmitter } from 'events';
/** @ignore */
import ICryptoNote = CryptoNoteInterfaces.ICryptoNote;
/**
 * Ledger CryptoNote helper class for constructing transactions and performing
 * various other cryptographic items during the receipt or transfer of funds
 * on the network using a Ledger based hardware device
 */
export declare class LedgerNote extends EventEmitter implements ICryptoNote {
    protected m_config: ICoinRunningConfig;
    private readonly m_ledger;
    private m_address;
    private m_fetched;
    /**
     * Constructs a new instance of the Ledger-based CryptoNote tools
     * @param transport the transport mechanism for talking to a Ledger device
     * @param config  the base configuration to apply to our helper
     * @param cryptoConfig configuration to allow for overriding the provided cryptographic primitives
     */
    constructor(transport: Transport, config?: ICoinConfig, cryptoConfig?: ICryptoConfig);
    /**
     * Emits an event if we have sent a command to the cryptographic library that is likely awaiting
     * manual user confirmation on the device
     * @param event
     * @param listener
     */
    on(event: 'user_confirm', listener: () => void): this;
    /**
     * Emits an event when the underlying cryptographic library receives data
     * @param event
     * @param listener
     */
    on(event: 'transport_receive', listener: (data: string) => void): this;
    /**
     * Emits an event when the underlying cryptographic library sends data
     * @param event
     * @param listener
     */
    on(event: 'transport_send', listener: (data: string) => void): this;
    /**
     * The current coin configuration
     */
    get config(): ICoinConfig;
    set config(config: ICoinConfig);
    /**
     * The current cryptographic primitives configuration
     */
    get cryptoConfig(): ICryptoConfig;
    set cryptoConfig(config: ICryptoConfig);
    /**
     * Provides the public wallet address of the ledger device
     */
    get address(): Address;
    /**
     * Manually initializes the class if necessary
     */
    init(): Promise<void>;
    /**
     * Fetches the public keys and private view key from the Ledger device
     * and stores it locally for use later
     */
    fetchKeys(): Promise<void>;
    /**
     * Indicates whether the keys have been fetched from the ledger device
     * and this instance of the class is ready for further interaction
     */
    get ready(): boolean;
    /**
     * Converts absolute global index offsets to relative ones
     * @param offsets the absolute offsets
     * @returns the relative offsets
     */
    absoluteToRelativeOffsets(offsets: BigInteger.BigInteger[] | string[] | number[]): number[];
    /**
     * Converts relative global index offsets to absolute offsets
     * @param offsets the relative offsets
     * @returns the absolute offsets
     */
    relativeToAbsoluteOffsets(offsets: BigInteger.BigInteger[] | string[] | number[]): number[];
    /**
     * Generates a key derivation
     * @param transactionPublicKey the transaction public key
     * @param privateViewKey the private view key (ignored)
     */
    generateKeyDerivation(transactionPublicKey: string, privateViewKey: string | undefined): Promise<string>;
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
    generateKeyImage(transactionPublicKey: string, privateViewKey: string | undefined, publicSpendKey: string | undefined, privateSpendKey: string | undefined, outputIndex: number): Promise<CryptoNoteInterfaces.IKeyImage>;
    /**
     * Primitive method for generating a key image from the supplied values
     * @async
     * @param publicSpendKey the public spend key
     * @param privateSpendKey the private spend key
     * @param outputIndex the index of the output in the transaction
     * @param derivation the key derivation
     * @returns the key image
     */
    generateKeyImagePrimitive(publicSpendKey: string | undefined, privateSpendKey: string | undefined, outputIndex: number, derivation: string): Promise<CryptoNoteInterfaces.IKeyImage>;
    /**
     * Provides the public key of the supplied private key
     * @async
     * @param privateKey the private key
     * @returns the public key
     */
    privateKeyToPublicKey(privateKey: string): Promise<string>;
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
    scanTransactionOutputs(transactionPublicKey: string, outputs: Interfaces.Output[], privateViewKey: string, publicSpendKey: string, privateSpendKey?: string, generatePartial?: boolean): Promise<Interfaces.Output[]>;
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
    isOurTransactionOutput(transactionPublicKey: string, output: Interfaces.Output, privateViewKey: string | undefined, publicSpendKey: string | undefined, privateSpendKey?: string, generatePartial?: boolean): Promise<Interfaces.Output>;
    /**
     * Calculates the minimum transaction fee given the transaction size (bytes)
     * @param txSize the transaction size in bytes
     * @returns the minimum transaction fee
     */
    calculateMinimumTransactionFee(txSize: number): number;
    /**
     * Creates an integrated address using the supplied values
     * @param address the wallet address
     * @param paymentId the payment ID
     * @param [prefix] the address prefix
     * @returns the integrated address
     */
    createIntegratedAddress(address: string, paymentId: string, prefix?: AddressPrefix | number): Promise<string>;
    /**
     * Formats atomic units into human readable units
     * @param amount the amount in atomic units
     * @returns the amount in human readable units
     */
    formatMoney(amount: BigInteger.BigInteger | number): string;
    /**
     * Generates an array of transaction outputs (new destinations) for the given address
     * and the given amount within the allowed rules of the network
     * @param address the destination wallet address
     * @param amount the amount to send
     * @returns a list of transaction outputs
     */
    generateTransactionOutputs(address: string, amount: number): Promise<Interfaces.GeneratedOutput[]>;
    /**
     * Signs an arbitrary message using the supplied private key
     * @async
     * @param message the arbitrary message to sign
     * @param privateKey the private key to sign with
     * @returns the signature
     */
    signMessage(message: any, privateKey: string | undefined): Promise<string>;
    /**
     * Verifies the signature of an arbitrary message using the signature and the supplied public key
     * @async
     * @param message the arbitrary message that was signed
     * @param publicKey the public key of the private key that was used to sign
     * @param signature the signature
     * @returns whether the signature is valid
     */
    verifyMessageSignature(message: any, publicKey: string, signature: string): Promise<boolean>;
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
    createTransaction(outputs: Interfaces.GeneratedOutput[], inputs: Interfaces.Output[], randomOutputs: Interfaces.RandomOutput[][], mixin: number, feeAmount?: number, paymentId?: string, unlockTime?: number, extraData?: any): Promise<Transaction>;
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
    createTransactionStructure(outputs: Interfaces.GeneratedOutput[], inputs: Interfaces.Output[], randomOutputs: Interfaces.RandomOutput[][], mixin: number, feeAmount?: number, paymentId?: string, unlockTime?: number, extraData?: any): Promise<Interfaces.IPreparedTransaction>;
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
    prepareTransaction(outputs: Interfaces.GeneratedOutput[], inputs: Interfaces.Output[], randomOutputs: Interfaces.RandomOutput[][], mixin: number, feeAmount?: number, paymentId?: string, unlockTime?: number, extraData?: any, randomKey?: string): Promise<Interfaces.PreparedTransaction>;
    /**
     * Completes a prepared transaction using the supplied private ephemeral
     * The resulting transaction can be broadcast to the network. Please note that the PreparedTransaction
     * signatures meta data must be updated to include the proper private ephemeral
     * @param preparedTransaction the prepared transaction
     * @param privateSpendKey the private spend key of the wallet that contains the funds
     * @returns the completed transaction
     */
    completeTransaction(preparedTransaction: Interfaces.PreparedTransaction, privateSpendKey: string | undefined): Promise<Transaction>;
}
