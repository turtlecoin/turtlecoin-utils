/// <reference types="node" />
import { BigInteger, Interfaces } from '../Types';
import { AddressPrefix } from '../AddressPrefix';
import { Address } from '../Address';
import { Transaction } from '../Transaction';
import { ICoinConfig } from '../Config';
import { ICryptoConfig } from 'turtlecoin-crypto';
import { EventEmitter } from 'events';
export declare namespace CryptoNoteInterfaces {
    interface IKeyImage {
        keyImage: string;
        publicEphemeral: string;
        privateEphemeral?: string;
    }
    abstract class ICryptoNote extends EventEmitter {
        abstract on(event: 'user_confirm', listener: () => void): this;
        abstract on(event: 'transport_receive', listener: (data: string) => void): this;
        abstract on(event: 'transport_send', listener: (data: string) => void): this;
        abstract get config(): ICoinConfig;
        abstract set config(config: ICoinConfig);
        abstract get cryptoConfig(): ICryptoConfig;
        abstract set cryptoConfig(config: ICryptoConfig);
        abstract get address(): Address | undefined;
        abstract init(): Promise<void>;
        abstract fetchKeys(): Promise<void>;
        abstract absoluteToRelativeOffsets(offsets: BigInteger.BigInteger[] | string[] | number[]): number[];
        abstract relativeToAbsoluteOffsets(offsets: BigInteger.BigInteger[] | string[] | number[]): number[];
        abstract generateKeyDerivation(transactionPublicKey: string, privateViewKey: string): Promise<string>;
        abstract generateKeyImage(transactionPublicKey: string, privateViewKey: string, publicSpendKey: string, privateSpendKey: string, outputIndex: number): Promise<IKeyImage>;
        abstract generateKeyImagePrimitive(publicSpendKey: string, privateSpendKey: string, outputIndex: number, derivation: string): Promise<IKeyImage>;
        abstract privateKeyToPublicKey(privateKey: string): Promise<string>;
        abstract scanTransactionOutputs(transactionPublicKey: string, outputs: Interfaces.Output[], privateViewKey: string, publicSpendKey: string, privateSpendKey?: string, generatePartial?: boolean): Promise<Interfaces.Output[]>;
        abstract isOurTransactionOutput(transactionPublicKey: string, output: Interfaces.Output, privateViewKey: string, publicSpendKey: string, privateSpendKey?: string, generatePartial?: boolean): Promise<Interfaces.Output>;
        abstract calculateMinimumTransactionFee(txSize: number): number;
        abstract createIntegratedAddress(address: string, paymentId: string, prefix?: AddressPrefix | number): Promise<string>;
        abstract formatMoney(amount: BigInteger.BigInteger | number): string;
        abstract generateTransactionOutputs(address: string, amount: number): Promise<Interfaces.GeneratedOutput[]>;
        abstract signMessage(message: any, privateKey: string): Promise<string>;
        abstract verifyMessageSignature(message: any, publicKey: string, signature: string): Promise<boolean>;
        abstract createTransaction(outputs: Interfaces.GeneratedOutput[], inputs: Interfaces.Output[], randomOutputs: Interfaces.RandomOutput[][], mixin: number, feeAmount?: number, paymentId?: string, unlockTime?: number, extraData?: any): Promise<Transaction>;
        abstract createTransactionStructure(outputs: Interfaces.GeneratedOutput[], inputs: Interfaces.Output[], randomOutputs: Interfaces.RandomOutput[][], mixin: number, feeAmount?: number, paymentId?: string, unlockTime?: number, extraData?: any): Promise<Interfaces.IPreparedTransaction>;
        abstract prepareTransaction(outputs: Interfaces.GeneratedOutput[], inputs: Interfaces.Output[], randomOutputs: Interfaces.RandomOutput[][], mixin: number, feeAmount?: number, paymentId?: string, unlockTime?: number, extraData?: any, randomKey?: string): Promise<Interfaces.PreparedTransaction>;
        abstract completeTransaction(preparedTransaction: Interfaces.PreparedTransaction, privateSpendKey: string): Promise<Transaction>;
    }
}
