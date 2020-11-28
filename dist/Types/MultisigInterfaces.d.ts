import { Interfaces } from './ITransaction';
export declare namespace MultisigInterfaces {
    /**
     * Represents a partial key image
     */
    interface PartialKeyImage {
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
    interface PartialSigningKey {
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
    interface PublicSpendKey {
        key: string;
        signature: string;
    }
    /** @ignore */
    interface Payload {
        publicSpendKeys: PublicSpendKey[];
        privateViewKey: string;
        partialKeyImages?: PartialKeyImage[];
        partialSigningKeys?: PartialSigningKey[];
        preparedTransactions?: Interfaces.PreparedTransaction[];
    }
    /** @ignore */
    interface Transfer {
        address: string;
        messageId: number;
        payload: string;
    }
}
