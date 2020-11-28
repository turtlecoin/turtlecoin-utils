// Copyright (c) 2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import { Interfaces } from './ITransaction';

export namespace MultisigInterfaces {
    /**
     * Represents a partial key image
     */
    export interface PartialKeyImage {
        /**
         * The partial key image
         */
        partialKeyImage: string;
        /**
         * The transaction hash for which the partial key image belongs
         */
        transactionHash: string;
        /**
         * The index in the transaction outputs for which the partial key image belongs
         */
        outputIndex: number;
    }

    /**
     * Represents a partial signing key for a particular prepared transaction
     */
    export interface PartialSigningKey {
        /**
         * The transaction prefix hash for which this partial signing key is valid
         */
        transactionPrefixHash: string;
        /**
         * The transaction signature index (which signature set this applies to)
         */
        index: number;
        /**
         * The partial signing key
         */
        partialSigningKey: string;
    }

    /** @ignore */
    export interface PublicSpendKey {
        key: string;
        signature: string;
    }

    /** @ignore */
    export interface Payload {
        publicSpendKeys: PublicSpendKey[];
        privateViewKey: string;
        partialKeyImages?: PartialKeyImage[];
        partialSigningKeys?: PartialSigningKey[];
        preparedTransactions?: Interfaces.PreparedTransaction[];
    }

    /** @ignore */
    export interface Transfer {
        address: string;
        messageId: number;
        payload: string;
    }
}
