// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import { BigInteger, Interfaces } from '../Types';
import { AddressPrefix } from '../AddressPrefix';
import { Address } from '../Address';
import { Transaction } from '../Transaction';
import { ICoinConfig } from '../Config';
import { ICryptoConfig } from 'turtlecoin-crypto';
import { EventEmitter } from 'events';

export namespace CryptoNoteInterfaces {
    export interface IKeyImage {
        keyImage: string;
        publicEphemeral: string;
        privateEphemeral?: string;
    }

    export abstract class ICryptoNote extends EventEmitter {
        public abstract on(event: 'user_confirm', listener: () => void): this;

        public abstract get config(): ICoinConfig;

        public abstract set config(config: ICoinConfig);

        public abstract get cryptoConfig(): ICryptoConfig;

        public abstract set cryptoConfig(config: ICryptoConfig);

        public abstract get address(): Address | undefined;

        public abstract async init(): Promise<void>;

        public abstract async fetchKeys(): Promise<void>;

        public abstract absoluteToRelativeOffsets(offsets: BigInteger.BigInteger[] | string[] | number[]): number[];

        public abstract relativeToAbsoluteOffsets(offsets: BigInteger.BigInteger[] | string[] | number[]): number[];

        public abstract async generateKeyDerivation(
            transactionPublicKey: string,
            privateViewKey: string): Promise<string>;

        public abstract async generateKeyImage(
            transactionPublicKey: string,
            privateViewKey: string,
            publicSpendKey: string,
            privateSpendKey: string,
            outputIndex: number
        ): Promise<IKeyImage>;

        public abstract async generateKeyImagePrimitive(
            publicSpendKey: string,
            privateSpendKey: string,
            outputIndex: number,
            derivation: string
        ): Promise<IKeyImage>;

        public abstract async privateKeyToPublicKey(privateKey: string): Promise<string>;

        public abstract async scanTransactionOutputs(
            transactionPublicKey: string,
            outputs: Interfaces.Output[],
            privateViewKey: string,
            publicSpendKey: string,
            privateSpendKey?: string,
            generatePartial?: boolean
        ): Promise<Interfaces.Output[]>;

        public abstract async isOurTransactionOutput (
            transactionPublicKey: string,
            output: Interfaces.Output,
            privateViewKey: string,
            publicSpendKey: string,
            privateSpendKey?: string,
            generatePartial?: boolean
        ): Promise<Interfaces.Output>;

        public abstract calculateMinimumTransactionFee (txSize: number): number

        public abstract async createIntegratedAddress (
            address: string,
            paymentId: string,
            prefix?: AddressPrefix | number
        ): Promise<string>

        public abstract formatMoney (amount: BigInteger.BigInteger | number): string;

        public abstract async generateTransactionOutputs (
            address: string,
            amount: number
        ): Promise<Interfaces.GeneratedOutput[]>;

        public abstract async signMessage (message: any, privateKey: string): Promise<string>;

        public abstract async verifyMessageSignature (
            message: any,
            publicKey: string,
            signature: string
        ): Promise<boolean>;

        public abstract async createTransaction (
            outputs: Interfaces.GeneratedOutput[],
            inputs: Interfaces.Output[],
            randomOutputs: Interfaces.RandomOutput[][],
            mixin: number,
            feeAmount?: number,
            paymentId?: string,
            unlockTime?: number,
            extraData?: any
        ): Promise<Transaction>;

        public abstract async createTransactionStructure (
            outputs: Interfaces.GeneratedOutput[],
            inputs: Interfaces.Output[],
            randomOutputs: Interfaces.RandomOutput[][],
            mixin: number,
            feeAmount?: number,
            paymentId?: string,
            unlockTime?: number,
            extraData?: any
        ): Promise<Interfaces.IPreparedTransaction>;

        public abstract async prepareTransaction (
            outputs: Interfaces.GeneratedOutput[],
            inputs: Interfaces.Output[],
            randomOutputs: Interfaces.RandomOutput[][],
            mixin: number,
            feeAmount?: number,
            paymentId?: string,
            unlockTime?: number,
            extraData?: any,
            randomKey?: string
        ): Promise<Interfaces.PreparedTransaction>;

        public abstract async completeTransaction (
            preparedTransaction: Interfaces.PreparedTransaction,
            privateSpendKey: string
        ): Promise<Transaction>;
    }
}
