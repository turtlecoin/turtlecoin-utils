import { Crypto } from 'turtlecoin-crypto';
import * as BigInteger from 'big-integer';
/** @ignore */
declare const TurtleCoinCrypto: Crypto;
export { TurtleCoinCrypto };
/** @ignore */
export declare enum PortableStorageConstants {
    SIGNATURE_A = 16847105,
    SIGNATURE_B = 16908545,
    VERSION = 1
}
export * from './Types/PortableStorageValue';
export { ICryptoConfig } from 'turtlecoin-crypto';
export * from './Types/IExtraNonce';
export * from './Types/IExtraTag';
export * from './Types/ITransactionInput';
export * from './Types/ITransactionOutput';
export * from './Types/ED25519';
export * from './Types/ITransaction';
export * from './Types/MultisigInterfaces';
export * from './Types/ICryptoNote';
export * from './Types/Ledger';
export * from './Types/WalletAPI';
export * from './Types/LegacyTurtleCoind';
export * from './Types/TurtleCoind';
export { PortableStorage, StorageType } from './Types/PortableStorage';
export { BigInteger };
