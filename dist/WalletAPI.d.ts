import { HTTPClient } from './Helpers/HTTPClient';
import { WalletAPITypes } from './Types/WalletAPI';
/**
 * A class interface that allows for easy interaction with the wallet-api service
 */
export declare class WalletAPI extends HTTPClient {
    private readonly m_defaultMixin?;
    private readonly m_decimalDivisor;
    private readonly m_defaultFeePerByte;
    private readonly m_defaultUnlockTime;
    /**
     * Initializes a new WalletAPI interface
     * @param password the API password for the WalletAPI instance
     * @param host the address of the wallet-api instance
     * @param port the port of the wallet-api instance
     * @param timeout the timeout to wait for each request in ms
     * @param ssl whether the wallet-api instance uses SSL (HTTPS) or not
     * @param userAgent the user agent string to use with requests
     * @param keepAlive whether the underlying HTTP(s) connection should be kept alive and reused
     * @param defaultMixin the default mixin used for generated transactions
     * @param decimalDivisor the decimal divisor to use in converting between atomic units and human readable values
     * @param defaultFeePerByte the default fee per byte to use in generating transactions
     * @param defaultUnlockTime the default unlock time to use in generating transaction
     */
    constructor(password: string, host?: string, port?: number, timeout?: number, ssl?: boolean, userAgent?: string, keepAlive?: boolean, defaultMixin?: number, decimalDivisor?: number, defaultFeePerByte?: number, defaultUnlockTime?: number);
    /**
     * Returns if the Wallet-API service is reachable
     */
    alive(): Promise<boolean>;
    /**
     * Retrieves a list of the addresses in the wallet container
     */
    addresses(): Promise<string[]>;
    /**
     * Retrieves the balance for the entire wallet container or the specified wallet address
     * @param address the wallet address to check or undefined for the entire container
     */
    balance(address?: string): Promise<WalletAPITypes.IWalletBalance>;
    /**
     * Retrieves the balance for every wallet address in the container
     */
    balances(): Promise<WalletAPITypes.IWalletBalances[]>;
    /**
     * Closes the wallet container that is currently open
     */
    close(): Promise<void>;
    /**
     * Creates a new wallet container using the specified parameters
     * @param filename the filename of the wallet container
     * @param password the password of the wallet container
     * @param daemonHost the node to use for the wallet container
     * @param daemonPort the node port to use for the wallet container
     * @param daemonSSL whether the node uses SSL or not
     */
    create(filename: string, password: string, daemonHost?: string, daemonPort?: number, daemonSSL?: boolean): Promise<void>;
    /**
     * Creates a new, random address in the wallet container
     */
    createAddress(): Promise<WalletAPITypes.IWallet>;
    /**
     * Creates an integrated address forom the given address and payment ID
     * @param address the address to use to generate the integrated address
     * @param paymentId the payment ID to use to generate the integrated address
     */
    createIntegratedAddress(address: string, paymentId: string): Promise<string>;
    /**
     * Deletes the given subwallet from the container
     * @param address the address of the subwallet to delete
     */
    deleteAddress(address: string): Promise<void>;
    /**
t     * Deletes a previous prepared transaction
     * @param hash the hash of the prepared transaction
     */
    deletePreparedTransaction(hash: string): Promise<void>;
    /**
     * Retrieves the node, address, port, fee, and fee address of the connected node
     */
    getNode(): Promise<WalletAPITypes.INode>;
    /**
     * Imports a subwallet with the given private spend key starting at the specified can height
     * @param privateSpendKey the private spend key of the subwallet to import
     * @param scanHeight the height to start scanning from upon import of the subwallet
     */
    importAddress(privateSpendKey: string, scanHeight?: number): Promise<string>;
    /**
     * Imports a deterministic subwallet with the given wallet index number
     * @param walletIndex the index of the deterministic subwallet
     * @param scanHeight the height to start scanning from upon import of the subwallet
     */
    importDeterministic(walletIndex?: number, scanHeight?: number): Promise<string>;
    /**
     * Imports a new wallet container using the specified keys and optional params
     * @param filename the filename of the wallet container
     * @param password the password of the wallet container
     * @param privateViewKey the private view key of the wallet
     * @param privateSpendKey the private spend key of the wallet
     * @param scanHeight the height to start scanning from upon import of the wallet
     * @param daemonHost the node to use for the wallet container
     * @param daemonPort the node port to use for the wallet container
     * @param daemonSSL whether the node uses SSL or not
     */
    importKey(filename: string, password: string, privateViewKey: string, privateSpendKey: string, scanHeight?: number, daemonHost?: string, daemonPort?: number, daemonSSL?: boolean): Promise<void>;
    /**
     * Imports a new wallet container using the specified mnemonic seed and optional params
     * @param filename the filename of the wallet container
     * @param password the password of the wallet container
     * @param mnemonicSeed the mnemonic seed of the wallet to import
     * @param scanHeight the height to start scanning from upon import of the wallet
     * @param daemonHost the node to use for the wallet container
     * @param daemonPort the node port to use for the wallet container
     * @param daemonSSL whether the node uses SSL or not
     */
    importSeed(filename: string, password: string, mnemonicSeed: string, scanHeight?: number, daemonHost?: string, daemonPort?: number, daemonSSL?: boolean): Promise<void>;
    /**
     * Imports a view only subwallet with the given public spend key
     * @param publicSpendKey the public spend key of the subwallet
     * @param scanHeight the height to start scanning from upon import of the subwallet
     */
    importViewAddress(publicSpendKey: string, scanHeight?: number): Promise<string>;
    /**
     * Imports a new view only wallet container using the specified mnemonic seed and optional params
     * @param filename the filename of the wallet container
     * @param password the password of the wallet container
     * @param privateViewKey the private view key of the wallet
     * @param address the public wallet address
     * @param scanHeight the height to start scanning from upon import of the wallet
     * @param daemonHost the node to use for the wallet container
     * @param daemonPort the node port to use for the wallet container
     * @param daemonSSL whether the node uses SSL or not
     */
    importViewOnly(filename: string, password: string, privateViewKey: string, address: string, scanHeight?: number, daemonHost?: string, daemonPort?: number, daemonSSL?: boolean): Promise<void>;
    /**
     * Retrieves the wallet container's shared private view key, or if an address is specified, returns the
     * public and private spend keys for the given address
     * @param address the wallet address
     */
    keys(address?: string): Promise<string | WalletAPITypes.IWallet>;
    /**
     * Retrieves the menemonic seed for the given address if possible
     * @param address the wallet address
     */
    keysMnemonic(address: string): Promise<string>;
    /**
     * Creates a new output destination object
     * @param address the address of the recipient
     * @param amount the human readable amount to send to the recipient
     */
    newDestination(address: string, amount: number): WalletAPITypes.ITransferDestination;
    /**
     * Opens an existing wallet container
     * @param filename the filename of the wallet container
     * @param password the password of the wallet container
     * @param daemonHost the node to use for the wallet container
     * @param daemonPort the node port to use for the wallet container
     * @param daemonSSL whether the node uses SSL or not
     */
    open(filename: string, password: string, daemonHost?: string, daemonPort?: number, daemonSSL?: boolean): Promise<void>;
    /**
     * Prepares an advanced transaction
     * @param destinations the destination(s) of the transaction
     * @param mixin the number of mixins to use
     * @param fee the transaction fee to pay
     * @param sourceAddresses the source addresses, if any, of the funds for the transaction
     * @param paymentId the payment ID to include with the transactions
     * @param changeAddress the address to send transaction change to
     * @param unlockTime the unlock time of the new transaction
     * @param extraData any extra data to be included in the TX_EXTRA field of the transaction
     */
    prepareAdvanced(destinations: WalletAPITypes.ITransferDestination[], mixin?: number, fee?: WalletAPITypes.IFeeType, sourceAddresses?: string[], paymentId?: string, changeAddress?: string, unlockTime?: number, extraData?: any | string): Promise<WalletAPITypes.ISendTransactionResult>;
    /**
     * Prepares a basic transaction
     * @param address the address to send funds to
     * @param amount the amount to send in the transaction
     * @param paymentId the payment ID to include with the transaction
     */
    prepareBasic(address: string, amount: number, paymentId?: string): Promise<WalletAPITypes.ISendTransactionResult>;
    /**
     * Retrieves the primary public wallet address of the container
     */
    primaryAddress(): Promise<string>;
    /**
     * Resets and saves the wallet container, beginning scanning from the height given, if any
     * @param scanHeight the scan height at which to begin scanning
     */
    reset(scanHeight?: number): Promise<void>;
    /**
     * Saves the wallet container currently open to disk
     */
    save(): Promise<void>;
    /**
     * Sends an advanced transaction
     * @param destinations the destination(s) of the transaction
     * @param mixin the number of mixins to use
     * @param fee the transaction fee to pay
     * @param sourceAddresses the source addresses, if any, of the funds for the transaction
     * @param paymentId the payment ID to include with the transactions
     * @param changeAddress the address to send transaction change to
     * @param unlockTime the unlock time of the new transaction
     * @param extraData any extra data to be included in the TX_EXTRA field of the transaction
     */
    sendAdvanced(destinations: WalletAPITypes.ITransferDestination[], mixin?: number, fee?: WalletAPITypes.IFeeType, sourceAddresses?: string[], paymentId?: string, changeAddress?: string, unlockTime?: number, extraData?: any | string): Promise<WalletAPITypes.ISendTransactionResult>;
    /**
     * Sends a basic transaction
     * @param address the address to send funds to
     * @param amount the amount to send in the transaction
     * @param paymentId the payment ID to include with the transaction
     */
    sendBasic(address: string, amount: number, paymentId?: string): Promise<WalletAPITypes.ISendTransactionResult>;
    /**
     * Sends a previously prepared transaction
     * @param transactionHash the hash of the prepared transaction
     */
    sendPrepared(transactionHash: string): Promise<void>;
    /**
     * Sends an advanced fusion transaction
     * @param address the address to send the fusion transaction to
     * @param mixin the number of mixins to use in the fusion transaction
     * @param sourceAddresses the source addresses, if any, of the funds for the fusion transaction
     */
    sendFusionAdvanced(address: string, mixin?: number, sourceAddresses?: string[]): Promise<string>;
    /**
     * Sends a basic fusion transaction
     */
    sendFusionBasic(): Promise<string>;
    /**
     * Opens an existing wallet container
     * @param daemonHost the node to use for the wallet container
     * @param daemonPort the node port to use for the wallet container
     * @param daemonSSL whether the node uses SSL or not
     */
    setNode(daemonHost?: string, daemonPort?: number, daemonSSL?: boolean): Promise<void>;
    /**
     * Retrieves the wallet sync status, peer count, and network hashrate
     */
    status(): Promise<WalletAPITypes.IStatusInfo>;
    /**
     * Retrieves details on a given transaction if found
     * @param hash the transaction hash to retrieve
     */
    transactionByHash(hash: string): Promise<WalletAPITypes.ITransactionInfo>;
    /**
     * Retrieves the transaction private key that can be used to audit a transaction
     * @param hash
     */
    transactionPrivateKey(hash: string): Promise<string>;
    /**
     * Retrieves a list of all transactions in the wallet container and/or within the supplied constraints
     * @param startHeight the height to return transfers from
     * @param endHeight the height to return transactions until
     */
    transactions(startHeight?: number, endHeight?: number): Promise<WalletAPITypes.ITransactionInfo[]>;
    /**
     * Retrieves a list of all transactions in the wallet container by address and/or within the supplied constraints
     * @param address the wallet address
     * @param startHeight the height to return transfers from
     * @param endHeight the height to return transactions until
     */
    transactionsByAddress(address: string, startHeight?: number, endHeight?: number): Promise<WalletAPITypes.ITransactionInfo[]>;
    /**
     * Retrieves a list of all unconfirmed outgoing transactions in the wallet container
     * @param address
     */
    unconfirmedTransactions(address?: string): Promise<WalletAPITypes.ITransactionInfo[]>;
    /**
     * Validates a given address
     * @param address the wallet address to validate
     */
    validateAddress(address: string): Promise<WalletAPITypes.IValidationInfo>;
}
