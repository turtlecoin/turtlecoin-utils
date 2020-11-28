// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import { Config } from '../Config';
import { TurtleCoinCrypto } from '../Types';
import { randomBytes } from 'crypto';

export namespace ED25519 {
    /**
     * Represents a ED25519 Key Pair (private & public) and provides a few methods
     * for generating new key pairs including deterministic methods.
     */
    export class KeyPair {
        protected m_privateKey?: string;
        protected m_publicKey?: string;

        /**
         * Constructs a new KeyPair object
         * @param publicKey
         * @param privateKey
         * @param entropy
         * @param iterations
         * @param createEmpty
         */
        public static async from (
            publicKey?: string,
            privateKey?: string,
            entropy?: string,
            iterations?: number,
            createEmpty = false
        ): Promise<KeyPair> {
            const pair = new KeyPair();

            if (createEmpty) {
                return pair;
            }

            /* If no entropy was supplied, we'll go find our own */
            entropy = entropy || rand(256);

            if (publicKey && await TurtleCoinCrypto.checkKey(publicKey)) {
                pair.m_publicKey = publicKey;
            }

            if (privateKey && await TurtleCoinCrypto.checkScalar(privateKey)) {
                pair.m_privateKey = privateKey;
            }

            if (!publicKey && !privateKey) {
                const temp = await simpleKdf(
                    entropy + rand(32), iterations || Config.keccakIterations);
                await pair.setPrivateKey(temp);
            }

            if (pair.m_privateKey && !pair.m_publicKey) {
                /* If we supplied a private key but no public key, and we said 1 iteration
                    we are probably looking to generate the deterministic view key for the
                    specified private spend key */
                if (iterations && iterations === 1) {
                    const temp = await TurtleCoinCrypto.cn_fast_hash(
                        pair.m_privateKey);

                    await pair.setPrivateKey(temp);
                }

                pair.m_publicKey = await TurtleCoinCrypto.secretKeyToPublicKey(pair.m_privateKey);
            }

            return pair;
        }

        /**
         * Returns the private key
         */
        public get privateKey (): string {
            return (this.m_privateKey) ? this.m_privateKey : '';
        }

        /**
         * Sets the private key or reduces the value to a private key
         * @param key
         */
        public async setPrivateKey (key: string): Promise<void> {
            try {
                this.m_privateKey = (await TurtleCoinCrypto.checkScalar(key))
                    ? key
                    : await TurtleCoinCrypto.scReduce32(key);
            } catch (e) {
                this.m_publicKey = key;
            }
        }

        /**
         * Returns the public key
         */
        public get publicKey (): string {
            return (this.m_publicKey) ? this.m_publicKey : '';
        }

        /**
         * Sets the public key
         * @param key
         */
        public async setPublicKey (key: string): Promise<void> {
            let isPubKey = false;

            // Try to verify that it is a public key via the library
            try {
                isPubKey = await TurtleCoinCrypto.checkKey(key);
            } catch (e) {
                // If the library could not process this, then set the key anyway
                this.m_publicKey = key;

                return;
            }

            if (isPubKey) {
                this.m_publicKey = key;
            } else {
                throw new Error('Not a public key');
            }
        }

        /**
         * Returns if the public key belongs to the private key
         */
        public async isPaired (): Promise<boolean> {
            if (this.publicKey.length === 0 || this.privateKey.length === 0) {
                return false;
            }

            return (await TurtleCoinCrypto.secretKeyToPublicKey(this.privateKey) === this.publicKey);
        }
    }

    /**
     * Represents a set of ED25519 key pairs (view and spend) used by TurtleCoin wallets
     */
    export class Keys {
        protected m_spendKeys: KeyPair = new KeyPair();
        protected m_viewKeys: KeyPair = new KeyPair();

        /**
         * Creates a new instance of a set of Keys
         * @param spendKeys the spend key pair
         * @param viewKeys the view key pair
         */
        public static async from (spendKeys?: KeyPair, viewKeys?: KeyPair): Promise<Keys> {
            const keys = new Keys();

            if (spendKeys) {
                keys.m_spendKeys = spendKeys;
            }

            if (viewKeys) {
                keys.m_viewKeys = viewKeys;
            }

            if (!spendKeys && !viewKeys) {
                keys.m_spendKeys = await KeyPair.from();
                keys.m_viewKeys = await KeyPair.from(
                    undefined, keys.m_spendKeys.privateKey, undefined, 1);
            }

            return keys;
        }

        /**
         * Returns the spend keys
         */
        public get spend (): KeyPair {
            return this.m_spendKeys;
        }

        /**
         * Sets the spend keys
         * @param keys
         */
        public set spend (keys: KeyPair) {
            this.m_spendKeys = keys;
        }

        /**
         * Returns the view keys
         */
        public get view (): KeyPair {
            return this.m_viewKeys;
        }

        /**
         * Sets the view keys
         * @param keys
         */
        public set view (keys: KeyPair) {
            this.m_viewKeys = keys;
        }
    }
}

/** @ignore */
function rand (bytes = 32): string {
    return randomBytes(bytes)
        .toString('base64');
}

/** @ignore */
async function simpleKdf (value: string, iterations: number): Promise<string> {
    /** This is a very simple implementation of a pseudo PBKDF2 function */
    let hex = Buffer.from(value).toString('hex');
    for (let i = 0; i < iterations; i++) {
        hex = await TurtleCoinCrypto.cn_fast_hash(hex);
    }
    return hex;
}
