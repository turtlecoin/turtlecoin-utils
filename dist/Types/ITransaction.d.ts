import { Transaction } from '../Transaction';
import { Address } from '../Address';
import { ED25519 } from './ED25519';
export declare namespace Interfaces {
    /**
     * Represents a transaction recipient
     */
    interface TransactionRecipient {
        /**
         * The recipient public wallet address
         */
        address: string;
        /**
         * The amount sent to the recipient
         */
        amount: number;
    }
    /**
     * Represents a prepared ring signature for a given input of a prepared transaction
     */
    interface PreparedRingSignature {
        /**
         * The index of the input in the transaction in which these prepared ring signatures belong
         */
        index: number;
        /**
         * The index in the list of prepared ring signatures that is our real input.
         * Although this can sometimes be deduced based on the last 32-bytes being all 0s,
         * it is safer to make sure that this value is transferred with the prepared
         * ring signatures
         */
        realOutputIndex: number;
        /**
         * The randomly generated scalar value that was created in preparing the ring signatures
         * This value is required for when we restore the ring signatures will all of the required
         * partial signing keys.
         */
        key: string;
        /**
         * The prepared ring signatures
         */
        signatures?: string[];
        /**
         * The public keys used in the signature preparation (random + real)
         */
        inputKeys?: string[];
        /**
         * The output information used to create this input
         */
        input: {
            derivation: string;
            tx_public_key?: string;
            outputIndex: number;
        };
    }
    /**
     * Represents a prepared transaction
     */
    interface PreparedTransaction {
        /**
         * The prepared transaction as a hexadecimal string (blob) -- this should be the prefix only (no signatures)
         */
        transaction: Transaction;
        /**
         * The transaction one-time private key.
         * We need this value along with the list of addresses that funds are being sent to
         * to ensure that funds are going where we believe the funds are going.
         */
        transactionPrivateKey: string;
        /**
         * The list of recipient addresses where funds are being sent to in the transaction.
         * This is provided so that other participants can check the outputs to determine what
         * amounts are going to which addresses so that they can verify that funds are going
         * where they believe them to be going.
         */
        transactionRecipients: TransactionRecipient[];
        /**
         * The list of prepared ring signatures (incomplete) that are later used
         * when we generate our partial signing key for the prepared transaction
         */
        signatureMeta: PreparedRingSignature[];
    }
    /**
     * The derived input transaction keys
     */
    interface InputKeys {
        /**
         * The derived public key
         */
        publicKey: string;
        /**
         * The key derivation
         */
        derivedKey: string;
        /**
         * The output index
         */
        outputIndex: number;
    }
    /**
     * Represents a generated input if the output belongs to us
     */
    interface GeneratedInput {
        /**
         * The derived transaction keys
         */
        transactionKeys: InputKeys;
        /**
         * The public ephemeral of the input
         */
        publicEphemeral: string;
        /**
         * the private ephemeral of the input
         */
        privateEphemeral?: string;
    }
    /**
     * Represents a Generated Output (destination)
     */
    interface GeneratedOutput {
        /**
         * The amount of the output
         */
        amount: number;
        /**
         * The destination of the output
         */
        destination: Address;
    }
    /**
     * Represents a transaction output to external applications
     */
    interface Output {
        /**
         * The output key
         */
        key: string;
        /**
         * The output index (position) in the transaction
         */
        index: number;
        /**
         * The output global index
         */
        globalIndex: number;
        /**
         * The output amount
         */
        amount: number;
        /**
         * The output type
         */
        type?: number;
        /**
         * The output key image
         */
        keyImage?: string;
        /**
         * The GeneratedInput of the output (if it belongs to us)
         */
        input?: GeneratedInput;
        /**
         * Defines whether this is a partial key image
         */
        isPartialKeyImage?: boolean;
    }
    /**
     * Represents a random output
     */
    interface RandomOutput {
        /**
         * The output key
         */
        key: string;
        /**
         * The output global index
         */
        globalIndex: number;
    }
    /** @ignore */
    interface PreparedInputOutputs {
        key: string;
        index: number;
    }
    /** @ignore */
    interface PreparedInput {
        amount: number;
        realOutputIndex: number;
        keyImage: string;
        input: GeneratedInput;
        outputs: PreparedInputOutputs[];
    }
    /** @ignore */
    interface PreparedOutput {
        amount: number;
        key: string;
    }
    /** @ignore */
    interface PreparedOutputs {
        transactionKeys: ED25519.KeyPair;
        outputs: PreparedOutput[];
    }
    /** @ignore */
    interface GeneratedRingSignatures {
        signatures: string[];
        index: number;
    }
    interface IPreparedTransaction {
        transaction: Transaction;
        inputs: PreparedInput[];
    }
}
