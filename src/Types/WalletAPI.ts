// Copyright (c) 2020, Brandon Lehmann, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

export namespace WalletAPITypes {
    export interface IBasicRequest {
        /**
         * The address of the destination
         */
        destination: string;
        /**
         * The amount to send
         */
        amount: number;
        /**
         * The payment ID to include
         */
        paymentID?: string;
    }

    export interface IWalletBalance {
        /**
         * the amount of unlocked funds
         */
        unlocked: number;
        /**
         * the amount of locked funds
         */
        locked: number;
    }

    export interface IWalletBalances extends IWalletBalance {
        /**
         * the wallet address
         */
        address: string;
    }

    export interface IWallet {
        /**
         * the public wallet address
         */
        address: string;
        /**
         * the private spend key of the wallet
         */
        privateSpendKey: string;
        /**
         * the public spend key of the wallet
         */
        publicSpendKey: string;
        /**
         * the deterministic wallet index
         */
        walletIndex: number;
    }

    export interface INode {
        /**
         * the hostname/ip of the node the container is connected to
         */
        daemonHost: string;
        /**
         * the port of the node the container is connected to
         */
        daemonPort: number;
        /**
         * whether the connected node uses SSL or not
         */
        daemonSSL: boolean;
        /**
         * the wallet address for sending node fee donations to
         */
        nodeAddress: string;
        /**
         * the node fee amount
         */
        nodeFee: number;
    }

    export interface ITransferDestination {
        /**
         * the public wallet address of the recipient
         */
        address: string;
        /**
         * the atomic amount to send to the recipient
         */
        amount: number;
    }

    export interface IFeeType {
        /**
         * The static fee to use with the transaction
         */
        fee?: number;
        /**
         * The fee to pay for each byte of the resulting transaction size
         */
        feePerByte?: number;
    }

    export interface ISendTransactionResult {
        /**
         * the transaction hash
         */
        transactionHash: string;
        /**
         * the network fee paid
         */
        fee: number;
        /**
         * whether the transaction was relayed to the network
         */
        relayedToNetwork: boolean;
    }

    export interface IStatusInfo {
        /**
         * how many blocks the wallet has synced
         */
        walletBlockCount: number;
        /**
         * how many blocks the node has synced
         */
        localDaemonBlockCount: number;
        /**
         * how many blocks the network has synced
         */
        networkBlockCount: number;
        /**
         * the number of peers the node is connected to
         */
        peerCount: number;
        /**
         * the current estimated network hashrate
         */
        hashrate: number;
        /**
         * whether the current wallet container is a view-only wallet
         */
        isViewWallet: boolean;
        /**
         * how many subwallets exist in the wallet container
         */
        subWalletCount: number;
    }

    export interface ITransactionInfo {
        /**
         * the block height of the block containing the transaction
         */
        blockheight?: number;
        /**
         * the network fee of the transaction
         */
        fee: number;
        /**
         * the transaction hash
         */
        hash: string;
        /**
         * whether the transaction is a coinbase transaction
         */
        isCoinbaseTransaction: boolean;
        /**
         * the payment ID of the transaction, if any
         */
        paymentID: string;
        /**
         * the timestamp of the transaction
         */
        timestamp?: number;
        /**
         * the unlock time of the transaction
         */
        unlockTime: number;
        /**
         * a transfer destination object describing where the funds went
         */
        transfers: ITransferDestination[]
    }

    export interface IValidationInfo {
        /**
         * Whether the address is an integrated address
         */
        isIntegrated: boolean;
        /**
         * the payment ID if the address is an integrated address
         */
        paymentID: string;
        /**
         * the wallet address supplied
         */
        actualAddress: string;
        /**
         * the public spend key of the address
         */
        publicSpendKey: string;
        /**
         * the public view key of the address
         */
        publicViewKey: string;
    }
}
