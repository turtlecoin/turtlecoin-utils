"use strict";
// Copyright (c) 2018-2020, Brandon Lehmann, The TurtleCoin Developers
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
exports.WalletAPI = void 0;
const util_1 = require("util");
const HTTPClient_1 = require("./Helpers/HTTPClient");
/**
 * A class interface that allows for easy interaction with the wallet-api service
 */
class WalletAPI extends HTTPClient_1.HTTPClient {
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
    constructor(password, host, port, timeout, ssl, userAgent, keepAlive, defaultMixin, decimalDivisor, defaultFeePerByte, defaultUnlockTime) {
        super(host, port || 8070, timeout, ssl, userAgent, keepAlive, password, handleError);
        this.m_decimalDivisor = 100;
        this.m_defaultFeePerByte = 1.953125;
        this.m_defaultUnlockTime = 0;
        if (defaultMixin)
            this.m_defaultMixin = defaultMixin;
        if (decimalDivisor)
            this.m_decimalDivisor = decimalDivisor;
        if (defaultFeePerByte)
            this.m_defaultFeePerByte = defaultFeePerByte;
        if (defaultUnlockTime)
            this.m_defaultUnlockTime = defaultUnlockTime;
    }
    /**
     * Returns if the Wallet-API service is reachable
     */
    alive() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.status();
            }
            catch (e) {
                if (e.toString().indexOf('ECONNREFUSED') !== -1) {
                    return false;
                }
            }
            return true;
        });
    }
    /**
     * Retrieves a list of the addresses in the wallet container
     */
    addresses() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.get('addresses');
            return response.addresses;
        });
    }
    /**
     * Retrieves the balance for the entire wallet container or the specified wallet address
     * @param address the wallet address to check or undefined for the entire container
     */
    balance(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = (address) ? util_1.format('balance/%s', address) : 'balance';
            const balance = yield this.get(url);
            return {
                unlocked: fromAtomicUnits(balance.unlocked, this.m_decimalDivisor),
                locked: fromAtomicUnits(balance.locked, this.m_decimalDivisor)
            };
        });
    }
    /**
     * Retrieves the balance for every wallet address in the container
     */
    balances() {
        return __awaiter(this, void 0, void 0, function* () {
            const balances = yield this.get('balances');
            return balances.map((elem) => {
                elem.unlocked = fromAtomicUnits(elem.unlocked, this.m_decimalDivisor);
                elem.locked = fromAtomicUnits(elem.locked, this.m_decimalDivisor);
                return elem;
            });
        });
    }
    /**
     * Closes the wallet container that is currently open
     */
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.delete('wallet');
        });
    }
    /**
     * Creates a new wallet container using the specified parameters
     * @param filename the filename of the wallet container
     * @param password the password of the wallet container
     * @param daemonHost the node to use for the wallet container
     * @param daemonPort the node port to use for the wallet container
     * @param daemonSSL whether the node uses SSL or not
     */
    create(filename, password, daemonHost = '127.0.0.1', daemonPort = 11898, daemonSSL = false) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post('wallet/create', { daemonHost, daemonPort, daemonSSL, filename, password });
        });
    }
    /**
     * Creates a new, random address in the wallet container
     */
    createAddress() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post('addresses/create');
        });
    }
    /**
     * Creates an integrated address forom the given address and payment ID
     * @param address the address to use to generate the integrated address
     * @param paymentId the payment ID to use to generate the integrated address
     */
    createIntegratedAddress(address, paymentId) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = util_1.format('addresses/%s/%s', address, paymentId);
            const response = yield this.get(url);
            return response.integratedAddress;
        });
    }
    /**
     * Deletes the given subwallet from the container
     * @param address the address of the subwallet to delete
     */
    deleteAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = util_1.format('addresses/%s', address);
            return this.delete(url);
        });
    }
    /**
t     * Deletes a previous prepared transaction
     * @param hash the hash of the prepared transaction
     */
    deletePreparedTransaction(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = util_1.format('transactions/prepared/%s', hash);
            return this.delete(url);
        });
    }
    /**
     * Retrieves the node, address, port, fee, and fee address of the connected node
     */
    getNode() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.get('node');
            response.nodeFee = fromAtomicUnits(response.nodeFee, this.m_decimalDivisor);
            return response;
        });
    }
    /**
     * Imports a subwallet with the given private spend key starting at the specified can height
     * @param privateSpendKey the private spend key of the subwallet to import
     * @param scanHeight the height to start scanning from upon import of the subwallet
     */
    importAddress(privateSpendKey, scanHeight = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.post('addresses/import', { privateSpendKey, scanHeight });
            return response.address;
        });
    }
    /**
     * Imports a deterministic subwallet with the given wallet index number
     * @param walletIndex the index of the deterministic subwallet
     * @param scanHeight the height to start scanning from upon import of the subwallet
     */
    importDeterministic(walletIndex = 0, scanHeight = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.post('addresses/import/deterministic', { walletIndex, scanHeight });
            return response.address;
        });
    }
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
    importKey(filename, password, privateViewKey, privateSpendKey, scanHeight = 0, daemonHost, daemonPort, daemonSSL) {
        return __awaiter(this, void 0, void 0, function* () {
            daemonHost = daemonHost || '127.0.0.1';
            daemonPort = daemonPort || 11898;
            daemonSSL = daemonSSL || false;
            return this.post('wallet/import/key', {
                daemonHost,
                daemonPort,
                daemonSSL,
                filename,
                password,
                scanHeight,
                privateViewKey,
                privateSpendKey
            });
        });
    }
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
    importSeed(filename, password, mnemonicSeed, scanHeight = 0, daemonHost, daemonPort, daemonSSL) {
        return __awaiter(this, void 0, void 0, function* () {
            daemonHost = daemonHost || '127.0.0.1';
            daemonPort = daemonPort || 11898;
            daemonSSL = daemonSSL || false;
            return this.post('wallet/import/seed', {
                daemonHost,
                daemonPort,
                daemonSSL,
                filename,
                password,
                scanHeight,
                mnemonicSeed
            });
        });
    }
    /**
     * Imports a view only subwallet with the given public spend key
     * @param publicSpendKey the public spend key of the subwallet
     * @param scanHeight the height to start scanning from upon import of the subwallet
     */
    importViewAddress(publicSpendKey, scanHeight = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.post('addresses/import/view', { publicSpendKey, scanHeight });
            return response.address;
        });
    }
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
    importViewOnly(filename, password, privateViewKey, address, scanHeight = 0, daemonHost, daemonPort, daemonSSL) {
        return __awaiter(this, void 0, void 0, function* () {
            daemonHost = daemonHost || '127.0.0.1';
            daemonPort = daemonPort || 11898;
            daemonSSL = daemonSSL || false;
            return this.post('wallet/import/view', {
                daemonHost,
                daemonPort,
                daemonSSL,
                filename,
                password,
                scanHeight,
                privateViewKey,
                address
            });
        });
    }
    /**
     * Retrieves the wallet container's shared private view key, or if an address is specified, returns the
     * public and private spend keys for the given address
     * @param address the wallet address
     */
    keys(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = (address) ? util_1.format('keys/%s', address) : 'keys';
            const response = yield this.get(url);
            if (response.privateViewKey)
                return response.privateViewKey;
            return response;
        });
    }
    /**
     * Retrieves the menemonic seed for the given address if possible
     * @param address the wallet address
     */
    keysMnemonic(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = util_1.format('keys/mnemonic/%s', address);
            const response = yield this.get(url);
            return response.mnemonicSeed;
        });
    }
    /**
     * Creates a new output destination object
     * @param address the address of the recipient
     * @param amount the human readable amount to send to the recipient
     */
    newDestination(address, amount) {
        return {
            address: address,
            amount: toAtomicUnits(amount, this.m_decimalDivisor)
        };
    }
    /**
     * Opens an existing wallet container
     * @param filename the filename of the wallet container
     * @param password the password of the wallet container
     * @param daemonHost the node to use for the wallet container
     * @param daemonPort the node port to use for the wallet container
     * @param daemonSSL whether the node uses SSL or not
     */
    open(filename, password, daemonHost, daemonPort, daemonSSL) {
        return __awaiter(this, void 0, void 0, function* () {
            daemonHost = daemonHost || '127.0.0.1';
            daemonPort = daemonPort || 11898;
            daemonSSL = daemonSSL || false;
            return this.post('wallet/open', { daemonHost, daemonPort, daemonSSL, filename, password });
        });
    }
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
    prepareAdvanced(destinations, mixin, fee, sourceAddresses, paymentId, changeAddress, unlockTime, extraData) {
        return __awaiter(this, void 0, void 0, function* () {
            mixin = mixin || this.m_defaultMixin;
            unlockTime = unlockTime || this.m_defaultUnlockTime;
            sourceAddresses = sourceAddresses || [];
            if (typeof fee !== 'object') {
                fee = { feePerByte: this.m_defaultFeePerByte };
            }
            if (fee.fee)
                fee.fee = toAtomicUnits(fee.fee, this.m_decimalDivisor);
            if (!fee.fee || !fee.feePerByte)
                throw new Error('Must supply either a fee or feePerByte');
            if (extraData) {
                if (typeof extraData !== 'string')
                    extraData = JSON.stringify(extraData);
                if (!isHex(extraData))
                    extraData = Buffer.from(extraData).toString('hex');
            }
            for (const dst of destinations) {
                if (!dst.address)
                    throw new Error('Must supply a wallet address in destination object');
                if (typeof dst.amount === 'undefined')
                    throw new Error('Must supply an amount in destination object');
            }
            const request = {
                destinations: destinations,
                mixin: mixin,
                sourceAddresses: sourceAddresses,
                paymentID: paymentId || false,
                changeAddress: changeAddress || false,
                unlockTime: unlockTime,
                extraData: extraData || false
            };
            if (fee.fee) {
                request.fee = fee.fee;
            }
            else {
                request.feePerByte = fee.feePerByte;
            }
            if (!request.mixin)
                delete request.mixin;
            if (request.sourceAddresses.length === 0)
                delete request.sourceAddresses;
            if (!request.paymentID)
                delete request.paymentID;
            if (!request.changeAddress)
                delete request.changeAddress;
            if (!request.extraData)
                delete request.extraData;
            const response = yield this.post('transactions/prepare/advanced', request);
            if (response.fee)
                response.fee = fromAtomicUnits(response.fee, this.m_decimalDivisor);
            return response;
        });
    }
    /**
     * Prepares a basic transaction
     * @param address the address to send funds to
     * @param amount the amount to send in the transaction
     * @param paymentId the payment ID to include with the transaction
     */
    prepareBasic(address, amount, paymentId) {
        return __awaiter(this, void 0, void 0, function* () {
            amount = toAtomicUnits(amount, this.m_decimalDivisor);
            const request = {
                destination: address,
                amount: amount
            };
            if (paymentId) {
                request.paymentID = paymentId;
            }
            const response = yield this.post('transactions/prepare/basic', request);
            if (response.fee)
                response.fee = fromAtomicUnits(response.fee, this.m_decimalDivisor);
            return response;
        });
    }
    /**
     * Retrieves the primary public wallet address of the container
     */
    primaryAddress() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.get('addresses/primary');
            return response.address;
        });
    }
    /**
     * Resets and saves the wallet container, beginning scanning from the height given, if any
     * @param scanHeight the scan height at which to begin scanning
     */
    reset(scanHeight = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.put('reset', { scanHeight });
        });
    }
    /**
     * Saves the wallet container currently open to disk
     */
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.put('save', false);
        });
    }
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
    sendAdvanced(destinations, mixin, fee, sourceAddresses, paymentId, changeAddress, unlockTime, extraData) {
        return __awaiter(this, void 0, void 0, function* () {
            mixin = mixin || this.m_defaultMixin;
            unlockTime = unlockTime || this.m_defaultUnlockTime;
            sourceAddresses = sourceAddresses || [];
            if (typeof fee !== 'object') {
                fee = { feePerByte: this.m_defaultFeePerByte };
            }
            if (fee.fee)
                fee.fee = toAtomicUnits(fee.fee, this.m_decimalDivisor);
            if (!fee.fee || !fee.feePerByte)
                throw new Error('Must supply either a fee or feePerByte');
            if (extraData) {
                if (typeof extraData !== 'string')
                    extraData = JSON.stringify(extraData);
                if (!isHex(extraData))
                    extraData = Buffer.from(extraData).toString('hex');
            }
            for (const dst of destinations) {
                if (!dst.address)
                    throw new Error('Must supply a wallet address in destination object');
                if (typeof dst.amount === 'undefined')
                    throw new Error('Must supply an amount in destination object');
            }
            const request = {
                destinations: destinations,
                mixin: mixin,
                sourceAddresses: sourceAddresses,
                paymentID: paymentId || false,
                changeAddress: changeAddress || false,
                unlockTime: unlockTime,
                extraData: extraData || false
            };
            if (fee.fee) {
                request.fee = fee.fee;
            }
            else {
                request.feePerByte = fee.feePerByte;
            }
            if (!request.mixin)
                delete request.mixin;
            if (request.sourceAddresses.length === 0)
                delete request.sourceAddresses;
            if (!request.paymentID)
                delete request.paymentID;
            if (!request.changeAddress)
                delete request.changeAddress;
            if (!request.extraData)
                delete request.extraData;
            const response = yield this.post('transactions/send/advanced', request);
            if (response.fee)
                response.fee = fromAtomicUnits(response.fee, this.m_decimalDivisor);
            return response;
        });
    }
    /**
     * Sends a basic transaction
     * @param address the address to send funds to
     * @param amount the amount to send in the transaction
     * @param paymentId the payment ID to include with the transaction
     */
    sendBasic(address, amount, paymentId) {
        return __awaiter(this, void 0, void 0, function* () {
            amount = toAtomicUnits(amount, this.m_decimalDivisor);
            const request = {
                destination: address,
                amount: amount
            };
            if (paymentId) {
                request.paymentID = paymentId;
            }
            const response = yield this.post('transactions/send/basic', request);
            if (response.fee)
                response.fee = fromAtomicUnits(response.fee, this.m_decimalDivisor);
            return response;
        });
    }
    /**
     * Sends a previously prepared transaction
     * @param transactionHash the hash of the prepared transaction
     */
    sendPrepared(transactionHash) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.post('transactions/send/prepared', { transactionHash });
            if (response.transactionHash !== transactionHash) {
                throw new Error('Could not send prepared transaction');
            }
        });
    }
    /**
     * Sends an advanced fusion transaction
     * @param address the address to send the fusion transaction to
     * @param mixin the number of mixins to use in the fusion transaction
     * @param sourceAddresses the source addresses, if any, of the funds for the fusion transaction
     */
    sendFusionAdvanced(address, mixin, sourceAddresses) {
        return __awaiter(this, void 0, void 0, function* () {
            mixin = mixin || this.m_defaultMixin;
            sourceAddresses = sourceAddresses || [];
            const request = {
                destination: address,
                mixin: mixin,
                sourceAddresses: sourceAddresses
            };
            if (!request.mixin)
                delete request.mixin;
            if (request.sourceAddresses.length === 0)
                delete request.sourceAddresses;
            const response = yield this.post('transactions/send/fusion/advanced', request);
            return response.transactionHash;
        });
    }
    /**
     * Sends a basic fusion transaction
     */
    sendFusionBasic() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.post('transactions/send/fusion/basic');
            return response.transactionHash;
        });
    }
    /**
     * Opens an existing wallet container
     * @param daemonHost the node to use for the wallet container
     * @param daemonPort the node port to use for the wallet container
     * @param daemonSSL whether the node uses SSL or not
     */
    setNode(daemonHost, daemonPort, daemonSSL = false) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = { daemonHost, daemonPort, daemonSSL };
            if (!request.daemonHost)
                delete request.daemonHost;
            if (!request.daemonPort)
                delete request.daemonPort;
            return this.put('node', request);
        });
    }
    /**
     * Retrieves the wallet sync status, peer count, and network hashrate
     */
    status() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.get('status');
        });
    }
    /**
     * Retrieves details on a given transaction if found
     * @param hash the transaction hash to retrieve
     */
    transactionByHash(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = util_1.format('transactions/hash/%s', hash);
            const response = yield this.get(url);
            response.transaction.fee = fromAtomicUnits(response.transaction.fee, this.m_decimalDivisor);
            response.transaction.transfers = response.transaction.transfers.map((elem) => {
                elem.amount = fromAtomicUnits(elem.amount, this.m_decimalDivisor);
                return elem;
            });
            return response;
        });
    }
    /**
     * Retrieves the transaction private key that can be used to audit a transaction
     * @param hash
     */
    transactionPrivateKey(hash) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = util_1.format('/transactions/privatekey/%s', hash);
            const response = yield this.get(url);
            return response.transactionPrivateKey;
        });
    }
    /**
     * Retrieves a list of all transactions in the wallet container and/or within the supplied constraints
     * @param startHeight the height to return transfers from
     * @param endHeight the height to return transactions until
     */
    transactions(startHeight, endHeight) {
        return __awaiter(this, void 0, void 0, function* () {
            let url = 'transactions';
            if (startHeight) {
                url += util_1.format('/%s', startHeight);
                if (endHeight) {
                    url += util_1.format('/%s', endHeight);
                }
            }
            const response = yield this.get(url);
            response.transactions = response.transactions.map((txn) => {
                txn.fee = fromAtomicUnits(txn.fee, this.m_decimalDivisor);
                txn.transfers = txn.transfers.map((elem) => {
                    elem.amount = fromAtomicUnits(elem.amount, this.m_decimalDivisor);
                    return elem;
                });
                return txn;
            });
            return response.transactions;
        });
    }
    /**
     * Retrieves a list of all transactions in the wallet container by address and/or within the supplied constraints
     * @param address the wallet address
     * @param startHeight the height to return transfers from
     * @param endHeight the height to return transactions until
     */
    transactionsByAddress(address, startHeight = 0, endHeight) {
        return __awaiter(this, void 0, void 0, function* () {
            let url = util_1.format('transactions/address/%s/%s', address, startHeight);
            if (endHeight) {
                url += util_1.format('/%s', endHeight);
            }
            const response = yield this.get(url);
            response.transactions = response.transactions.map((txn) => {
                txn.fee = fromAtomicUnits(txn.fee, this.m_decimalDivisor);
                txn.transfers = txn.transfers.map((elem) => {
                    elem.amount = fromAtomicUnits(elem.amount, this.m_decimalDivisor);
                    return elem;
                });
                return txn;
            });
            return response.transactions;
        });
    }
    /**
     * Retrieves a list of all unconfirmed outgoing transactions in the wallet container
     * @param address
     */
    unconfirmedTransactions(address) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = (address) ? util_1.format('transactions/unconfirmed/%s', address) : 'transactions/unconfirmed';
            const response = yield this.get(url);
            response.transactions = response.transactions.map((txn) => {
                txn.fee = fromAtomicUnits(txn.fee, this.m_decimalDivisor);
                txn.transfers = txn.transfers.map((elem) => {
                    elem.amount = fromAtomicUnits(elem.amount, this.m_decimalDivisor);
                    return elem;
                });
                return txn;
            });
            return response.transactions;
        });
    }
    /**
     * Validates a given address
     * @param address the wallet address to validate
     */
    validateAddress(address) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.post('addresses/validate', { address });
        });
    }
}
exports.WalletAPI = WalletAPI;
/** @ignore */
function handleError(statusCode, error) {
    if (error.message.indexOf('cannot get a mnemonic seed') !== -1)
        return new Error(error.message);
    if (error.message && error.message.indexOf('ECONNREFUSED') !== -1) {
        return new Error('ECONNREFUSED: Cannot connect to WalletAPI at given host and port.');
    }
    switch (statusCode) {
        case 400: return new Error('A parse error occurred, or an error occurred processing your request: ' +
            error.message);
        case 401: return new Error('API key is missing or invalid');
        case 403: return new Error('This operation requires a wallet be open and one has not been opened yet');
        case 404: return new Error('The item requested does not exist');
        case 500: return new Error('An exception was throw while processing the request. See the console for logs.');
        default: return new Error(error.toString());
    }
}
/** @ignore */
function fromAtomicUnits(amount, decimalDivisor) {
    if (amount.toString().indexOf('.') !== -1)
        return amount;
    return +((amount / decimalDivisor)
        .toFixed(decimalDivisor
        .toString()
        .length - 1));
}
/** @ignore */
function toAtomicUnits(amount, decimalDivisor) {
    return Math.round(amount * decimalDivisor);
}
/** @ignore */
function isHex(str) {
    const regex = /^[0-9a-fA-F]+$/;
    return regex.test(str);
}
