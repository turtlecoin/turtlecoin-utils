// Copyright (c) 2018-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import {
    Address,
    AddressPrefix,
    Block,
    BlockTemplate,
    Crypto,
    CryptoNote,
    CryptoType,
    KeyInput,
    KeyOutput,
    LedgerDevice,
    LedgerNote,
    LevinPacket,
    Transaction,
    KeyPair,
    TurtleCoind,
    WalletAPI,
    LegacyTurtleCoind,
    WalletAPITypes
} from '../src';
import * as assert from 'assert';
import { before, describe, it } from 'mocha';
import { BigInteger } from '../src/Types';

const TurtleCoinCrypto = new Crypto();
const cnUtil = new CryptoNote();

if (process.env.FORCE_JS) {
    if (TurtleCoinCrypto.forceJSCrypto()) {
        console.warn('Performing tests with JS Cryptographic library');
    } else {
        console.warn('Could not activate JS Cryptographic library');
        process.exit(1);
    }
} else {
    console.warn('Performing tests with C++ Cryptographic library');
}

describe('Cryptography', async function () {
    this.timeout(30000);

    it('Generate Random Keys', async () => {
        const keys = await TurtleCoinCrypto.generateKeys();

        assert(keys);
    });

    it('Check Key - Public Key', async () => {
        const key = '7849297236cd7c0d6c69a3c8c179c038d3c1c434735741bb3c8995c3c9d6f2ac';

        assert(await TurtleCoinCrypto.checkKey(key));
    });

    it('Check Key - Private Key', async () => {
        const key = '4a078e76cd41a3d3b534b83dc6f2ea2de500b653ca82273b7bfad8045d85a400';

        assert(!await TurtleCoinCrypto.checkKey(key));
    });

    it('Tree Hash', async () => {
        const expectedTreeHash = 'dff9b4e047803822e97fb25bb9acb8320648954e15a6ddf6fa757873793c535e';
        const treeHash = await TurtleCoinCrypto.tree_hash([
            'b542df5b6e7f5f05275c98e7345884e2ac726aeeb07e03e44e0389eb86cd05f0',
            '1b606a3f4a07d6489a1bcd07697bd16696b61c8ae982f61a90160f4e52828a7f',
            'c9fae8425d8688dc236bcdbc42fdb42d376c6ec190501aa84b04a4b4cf1ee122',
            '871fcd6823f6a879bb3f33951c8e8e891d4043880b02dfa1bb3be498b50e7578'
        ]);
        assert(treeHash === expectedTreeHash);
    });

    it('Tree Branch', async () => {
        const expectedTreeBranch = [
            'f49291f9b352701d97dffad838def8cefcc34d1e767e450558261b161ab78cb1',
            '1b606a3f4a07d6489a1bcd07697bd16696b61c8ae982f61a90160f4e52828a7f'
        ];

        const treeBranch = await TurtleCoinCrypto.tree_branch([
            'b542df5b6e7f5f05275c98e7345884e2ac726aeeb07e03e44e0389eb86cd05f0',
            '1b606a3f4a07d6489a1bcd07697bd16696b61c8ae982f61a90160f4e52828a7f',
            'c9fae8425d8688dc236bcdbc42fdb42d376c6ec190501aa84b04a4b4cf1ee122',
            '871fcd6823f6a879bb3f33951c8e8e891d4043880b02dfa1bb3be498b50e7578'
        ]);

        assert.deepStrictEqual(treeBranch, expectedTreeBranch);
    });

    const testdata = '0100fb8e8ac805899323371bb790db19218afd8db8e3755d8b90f39b3d5506a9abce' +
        '4fa912244500000000ee8146d49fa93ee724deb57d12cbc6c6f3b924d946127c7a97418f9348828f0f02';

    interface IHashingAlgo {
        name: string;
        hash: string;
        func: (value: string) => Promise<string>;
    }

    const algos: IHashingAlgo[] = [
        {
            name: 'CryptoNight Fast Hash',
            func: TurtleCoinCrypto.cn_fast_hash,
            hash: 'b542df5b6e7f5f05275c98e7345884e2ac726aeeb07e03e44e0389eb86cd05f0'
        },
        {
            name: 'CryptoNight v0',
            func: TurtleCoinCrypto.cn_slow_hash_v0,
            hash: '1b606a3f4a07d6489a1bcd07697bd16696b61c8ae982f61a90160f4e52828a7f'
        },
        {
            name: 'CryptoNight v1',
            func: TurtleCoinCrypto.cn_slow_hash_v1,
            hash: 'c9fae8425d8688dc236bcdbc42fdb42d376c6ec190501aa84b04a4b4cf1ee122'
        },
        {
            name: 'CryptoNight v2',
            func: TurtleCoinCrypto.cn_slow_hash_v2,
            hash: '871fcd6823f6a879bb3f33951c8e8e891d4043880b02dfa1bb3be498b50e7578'
        },
        {
            name: 'CryptoNight Lite v0',
            func: TurtleCoinCrypto.cn_lite_slow_hash_v0,
            hash: '28a22bad3f93d1408fca472eb5ad1cbe75f21d053c8ce5b3af105a57713e21dd'
        },
        {
            name: 'CryptoNight Lite v1',
            func: TurtleCoinCrypto.cn_lite_slow_hash_v1,
            hash: '87c4e570653eb4c2b42b7a0d546559452dfab573b82ec52f152b7ff98e79446f'
        },
        {
            name: 'CryptoNight Lite v2',
            func: TurtleCoinCrypto.cn_lite_slow_hash_v2,
            hash: 'b7e78fab22eb19cb8c9c3afe034fb53390321511bab6ab4915cd538a630c3c62'
        },
        {
            name: 'CryptoNight Dark v0',
            func: TurtleCoinCrypto.cn_dark_slow_hash_v0,
            hash: 'bea42eadd78614f875e55bb972aa5ec54a5edf2dd7068220fda26bf4b1080fb8'
        },
        {
            name: 'CryptoNight Dark v1',
            func: TurtleCoinCrypto.cn_dark_slow_hash_v1,
            hash: 'd18cb32bd5b465e5a7ba4763d60f88b5792f24e513306f1052954294b737e871'
        },
        {
            name: 'CryptoNight Dark v2',
            func: TurtleCoinCrypto.cn_dark_slow_hash_v2,
            hash: 'a18a14d94efea108757a42633a1b4d4dc11838084c3c4347850d39ab5211a91f'
        },
        {
            name: 'CryptoNight Dark Lite v0',
            func: TurtleCoinCrypto.cn_dark_lite_slow_hash_v0,
            hash: 'faa7884d9c08126eb164814aeba6547b5d6064277a09fb6b414f5dbc9d01eb2b'
        },
        {
            name: 'CryptoNight Dark Lite v1',
            func: TurtleCoinCrypto.cn_dark_lite_slow_hash_v1,
            hash: 'c75c010780fffd9d5e99838eb093b37c0dd015101c9d298217866daa2993d277'
        },
        {
            name: 'CryptoNight Dark Lite v2',
            func: TurtleCoinCrypto.cn_dark_lite_slow_hash_v2,
            hash: 'fdceb794c1055977a955f31c576a8be528a0356ee1b0a1f9b7f09e20185cda28'
        },
        {
            name: 'CryptoNight Turtle v0',
            func: TurtleCoinCrypto.cn_turtle_slow_hash_v0,
            hash: '546c3f1badd7c1232c7a3b88cdb013f7f611b7bd3d1d2463540fccbd12997982'
        },
        {
            name: 'CryptoNight Turtle v1',
            func: TurtleCoinCrypto.cn_turtle_slow_hash_v1,
            hash: '29e7831780a0ab930e0fe3b965f30e8a44d9b3f9ad2241d67cfbfea3ed62a64e'
        },
        {
            name: 'CryptoNight Turtle v2',
            func: TurtleCoinCrypto.cn_turtle_slow_hash_v2,
            hash: 'fc67dfccb5fc90d7855ae903361eabd76f1e40a22a72ad3ef2d6ad27b5a60ce5'
        },
        {
            name: 'CryptoNight Turtle Lite v0',
            func: TurtleCoinCrypto.cn_turtle_lite_slow_hash_v0,
            hash: '5e1891a15d5d85c09baf4a3bbe33675cfa3f77229c8ad66c01779e590528d6d3'
        },
        {
            name: 'CryptoNight Turtle Lite v1',
            func: TurtleCoinCrypto.cn_turtle_lite_slow_hash_v1,
            hash: 'ae7f864a7a2f2b07dcef253581e60a014972b9655a152341cb989164761c180a'
        },
        {
            name: 'CryptoNight Turtle Lite v2',
            func: TurtleCoinCrypto.cn_turtle_lite_slow_hash_v2,
            hash: 'b2172ec9466e1aee70ec8572a14c233ee354582bcb93f869d429744de5726a26'
        },
        {
            name: 'Chukwa',
            func: TurtleCoinCrypto.chukwa_slow_hash,
            hash: 'c0dad0eeb9c52e92a1c3aa5b76a3cb90bd7376c28dce191ceeb1096e3a390d2e'
        }
    ];

    for (const algo of algos) {
        it(algo.name, async () => {
            const hash = await algo.func(testdata);
            assert(algo.hash === hash);
        });
    }
});

describe('Wallets', async function () {
    this.timeout(30000);

    const rawSeed = 'dd0c02d3202634821b4d9d91b63d919725f5c3e97e803f3512e52fb0dc2aab0c';
    const rawMnemonic = [
        'teeming', 'taken', 'piano', 'ramped', 'vegan',
        'jazz', 'earth', 'enjoy', 'suture', 'quick',
        'lied', 'awkward', 'ferry', 'python', 'often',
        'exotic', 'cube', 'hexagon', 'ionic', 'joyous',
        'cage', 'abnormal', 'hull', 'jigsaw', 'lied'
    ].join(' ');
    const testAddress = 'TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB' +
        '6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX';

    describe('Mnemonics', async () => {
        it('address from mnemonic phrase has matching seed', async () => {
            const result = await Address.fromMnemonic(rawMnemonic);

            assert(rawSeed === result.seed);
        });

        it('address from seed has matching mnemonic phrase', async () => {
            const result = await Address.fromSeed(rawSeed);

            assert(rawMnemonic === result.mnemonic);
        });

        it('address from keys and seed have matching mnemonic phrases', async () => {
            const result = await Address.fromMnemonic(rawMnemonic);

            const result2 = await Address.fromKeys(result.spend.privateKey, result.view.privateKey);

            assert(result.mnemonic === result2.mnemonic);
        });

        it('cannot create mnemonic phrase from non-deterministic keys', async () => {
            const nonMnemonicPrivateSpendKey = '7a4a9a5b174e5713433fb5735a35b8fe8ce5bf411d5f6a587002e455a2b33703';
            const nonMnemonicPrivateViewKey = '3c986487d9b85e979e4f30eca56558874d2792ec73326d7aa0b2cf24c099ad0f';

            const result = await Address.fromKeys(nonMnemonicPrivateSpendKey, nonMnemonicPrivateViewKey);

            assert(!result.mnemonic);
        });
    });

    describe('Wallet Creation', async () => {
        let result: Address;
        let result2: Address;

        before('Generate Addresses', async () => {
            result = await Address.fromEntropy(testAddress, 'english');

            result2 = await Address.fromKeys(result.spend.privateKey, result.view.privateKey);
        });

        it('create new address', () => {
            assert(result);
        });

        it('create new address from keys', async () => {
            assert(await result.address() === await result2.address());
        });
    });

    describe('Message Signing', async () => {
        it('sign a string message', async () => {
            await cnUtil.signMessage(
                'this is a test message', 'd4c7e338d7efe0468b6498dd2f96620fad6b103d1a70dea76bab4de9db9c0a0b');
        });

        it('sign an object-based message', async () => {
            await cnUtil.signMessage({
                mac: 'deadbeef',
                amount: 10
            }, 'd4c7e338d7efe0468b6498dd2f96620fad6b103d1a70dea76bab4de9db9c0a0b');
        });

        it('verify signature - string message', async () => {
            const valid = await cnUtil.verifyMessageSignature(
                'this is a test message',
                '013099b244d5d86194f3bbf7a50772b50e6c73675a6866dc2f278139e35ba8e8',
                '9ef44c5b3ffe86e31b126e284227953bdb78714b40af4e43c66d4e4a72a31500' +
                    '96b2b8e6a974e5fbc5a6ed700381f5356e6f80ad0ca62b020382f37b00d4d401');
            assert(valid);
        });

        it('verify signature - object-based message', async () => {
            const valid = await cnUtil.verifyMessageSignature(
                {
                    mac: 'deadbeef',
                    amount: 10
                },
                '013099b244d5d86194f3bbf7a50772b50e6c73675a6866dc2f278139e35ba8e8',
                'f111faac9365c62eaf016364e9db6ec50060f379e9b0e480ba1dc41993c3380f' +
                '55a6f4b10bb3e1d18ee0aa139157ee657a451746e5f6358199a7425e4f65af0c');
            assert(valid);
        });

        it('fail to verify signature - string message', async () => {
            const valid = await cnUtil.verifyMessageSignature(
                'this is a test message',
                '013099b244d5d86194f3bbf7a50772b50e6c73675a6866dc2f278139e35ba8e8',
                '9ef44c5b3ffe86e31b126e284227953bdb78714b40af4e43c66d4e4a72a31500' +
                    '96b2b8e6a974e5fbc5a6ed700381f5356e6f80ad0ca62b020382f37b00d4d401');
            assert(valid);
        });
    });
    describe('Keys', async () => {
        const testPrivateKey = '4a078e76cd41a3d3b534b83dc6f2ea2de500b653ca82273b7bfad8045d85a400';
        const testPublicKey = '7849297236cd7c0d6c69a3c8c179c038d3c1c434735741bb3c8995c3c9d6f2ac';

        it('create public key from private key', async () => {
            const pubkey = await cnUtil.privateKeyToPublicKey(testPrivateKey);
            assert(pubkey === testPublicKey);
        });
    });

    describe('Prefix Detection', async () => {
        const athenaAddress =
            'athena28QHa49cTHWjRLYN1XW46Xj8D2mPiu7bovQ67V4z1C84R16VSJvbHmD2Yfq5Yvw5GKVTnfuS5pX3LXH3LNPezfLhhe5Lc27';
        const athenaPrefix = {
            prefix: 'ca9f97c218',
            base58: 'athena',
            decimal: 6581243850,
            hexadecimal: '18845cfca'
        };

        let calculatedPrefix: AddressPrefix;

        before('Calculate Prefix', async () => {
            calculatedPrefix = AddressPrefix.from(athenaAddress);
        });

        it('detects proper Base58 prefix', async () => {
            assert(athenaPrefix.base58 === calculatedPrefix.base58);
        });

        it('detects proper decimal prefix', async () => {
            assert(athenaPrefix.decimal === calculatedPrefix.decimal);
        });

        it('encodes an existing address with an alternate prefix', async () => {
            const newAddress = await Address.fromEntropy(testAddress, 'english');
            const newAthenaAddress = await Address.fromPublicKeys(
                newAddress.spend.publicKey, newAddress.view.publicKey, undefined, athenaPrefix.decimal);
            const newAthenaAddressByKey = await Address.fromKeys(
                newAddress.spend.privateKey, newAddress.view.privateKey, athenaPrefix.decimal);

            assert(await newAthenaAddress.address() === await newAthenaAddressByKey.address());
        });
    });
});

describe('SubWallets', async function () {
    this.timeout(30000);

    let baseWallet: Address;
    let subWallets: Address[] = [];

    before('Generate Check Wallets', async () => {
        baseWallet = await Address.fromSeed('dd0c02d3202634821b4d9d91b63d919725f5c3e97e803f3512e52fb0dc2aab0c');

        subWallets = [
            await Address.generateSubwallet(baseWallet.spend.privateKey, 0),
            await Address.generateSubwallet(baseWallet.spend.privateKey, 1),
            await Address.generateSubwallet(baseWallet.spend.privateKey, 2),
            await Address.generateSubwallet(baseWallet.spend.privateKey, 64),
            await Address.generateSubwallet(baseWallet.spend.privateKey, 65)
        ];
    });

    it('creates subwallets', async () => {
        assert((subWallets[0]) && (subWallets[1]) && (subWallets[2]) && (subWallets[3]) && (subWallets[4]));
    });

    it('Subwallet #0 matches base wallet', async () => {
        assert(baseWallet.spend.privateKey, subWallets[0].spend.privateKey);
    });

    it('SubWallets #1 is correct', async () => {
        assert(subWallets[1].spend.privateKey === 'c55cbe4fd1c49dca5958fa1c7b9212c2dbf3fd5bfec84de741d434056e298600');
    });

    it('SubWallets #2 is correct', async () => {
        assert(subWallets[2].spend.privateKey === '9813c40428ed9b380a2f72bac1374a9d3852a974b0527e003cbc93afab764d01');
    });

    it('SubWallets #64 is correct', async () => {
        assert(subWallets[3].spend.privateKey === '29c2afed13271e2bb3321c2483356fd8798f2709af4de3906b6627ec71727108');
    });

    it('SubWallets #65 is correct', async () => {
        assert(subWallets[4].spend.privateKey === '0c6b5fff72260832558e35c38e690072503211af065056862288dc7fd992350a');
    });

    it('Subwallet #0 does not match any other subwallets', async () => {
        for (let i = 1; i < subWallets.length; i++) {
            assert(subWallets[0].spend.privateKey !== subWallets[i].spend.privateKey);
        }
    });

    it('Subwallet #1 does not match any other subwallets', async () => {
        for (let i = 2; i < subWallets.length; i++) {
            assert(subWallets[1].spend.privateKey !== subWallets[i].spend.privateKey);
        }
    });

    it('Subwallet #2 does not match any other subwallets', async () => {
        for (let i = 3; i < subWallets.length; i++) {
            assert(subWallets[2].spend.privateKey !== subWallets[i].spend.privateKey);
        }
    });

    it('Subwallet #64 does not match any other subwallets', async () => {
        for (let i = 4; i < subWallets.length; i++) {
            assert(subWallets[3].spend.privateKey !== subWallets[i].spend.privateKey);
        }
    });

    it('Subwallet #2 not found from Subwallet #1', async () => {
        const key = await TurtleCoinCrypto.cn_fast_hash(subWallets[1].spend.privateKey);
        assert(key !== subWallets[2].spend.privateKey);
        assert(await TurtleCoinCrypto.scReduce32(key) !== subWallets[2].spend.privateKey);
    });

    it('Subwallet #64 not found from Subwallet #1', async () => {
        let key = subWallets[1].spend.privateKey;
        for (let i = 0; i < 63; i++) {
            key = await TurtleCoinCrypto.cn_fast_hash(key);
        }
        assert(key !== subWallets[3].spend.privateKey);
        assert(await TurtleCoinCrypto.scReduce32(key) !== subWallets[3].spend.privateKey);
    });

    it('Subwallet #65 not found from Subwallet #1', async () => {
        let key = subWallets[1].spend.privateKey;
        for (let i = 0; i < 64; i++) {
            key = await TurtleCoinCrypto.cn_fast_hash(key);
        }
        assert(key !== subWallets[4].spend.privateKey);
        assert(await TurtleCoinCrypto.scReduce32(key) !== subWallets[4].spend.privateKey);
    });

    it('Subwallet #64 not found from Subwallet #2', async () => {
        let key = subWallets[2].spend.privateKey;
        for (let i = 0; i < 62; i++) {
            key = await TurtleCoinCrypto.cn_fast_hash(key);
        }
        assert(key !== subWallets[3].spend.privateKey);
        assert(await TurtleCoinCrypto.scReduce32(key) !== subWallets[3].spend.privateKey);
    });

    it('Subwallet #65 not found from Subwallet #2', async () => {
        let key = subWallets[2].spend.privateKey;
        for (let i = 0; i < 63; i++) {
            key = await TurtleCoinCrypto.cn_fast_hash(key);
        }
        assert(key !== subWallets[4].spend.privateKey);
        assert(await TurtleCoinCrypto.scReduce32(key) !== subWallets[4].spend.privateKey);
    });
});

describe('Transactions', async function () {
    this.timeout(30000);

    describe('Create Transaction Outputs', async () => {
        it('Amount: 1234567', async () => {
            const amount = 1234567;
            const transfers = await cnUtil.generateTransactionOutputs(
                'TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX',
                amount);
            assert(transfers.length === 7);
        });

        it('Amount: 101010', async () => {
            const amount = 101010;
            const transfers = await cnUtil.generateTransactionOutputs(
                'TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX',
                amount);
            assert(transfers.length === 3);
        });

        it('Amount: 500000000000', async () => {
            const amount = 500000000000;
            const transfers = await cnUtil.generateTransactionOutputs(
                'TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX',
                amount);
            assert(transfers.length === 5);
        });

        it('Amount: 555555555555', async () => {
            const amount = 955555555555;
            const transfers = await cnUtil.generateTransactionOutputs(
                'TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX',
                amount);
            assert(transfers.length === 20);
        });
    });

    describe('Output Discovery', async () => {
        const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94';
        const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909';
        const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418';
        const ourOutputIndex = 2;

        let derivation: string;

        before('Generate Derivation', async () => {
            derivation = await TurtleCoinCrypto.generateKeyDerivation(txPublicKey, walletPrivateViewKey);
        });

        it('underive public spend key (no match)', async () => {
            const publicSpendKey1 = await TurtleCoinCrypto.underivePublicKey(
                derivation, 0, 'aae1b90b4d0a7debb417d91b7f7aa8fdfd80c42ebc6757e1449fd1618a5a3ff1');
            assert(publicSpendKey1 !== walletPublicSpendKey);
        });

        it('underive public spend key (match)', async () => {
            const publicSpendKey2 = await TurtleCoinCrypto.underivePublicKey(
                derivation, ourOutputIndex, 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d');
            assert(publicSpendKey2 === walletPublicSpendKey);
        });

        it('scan output (no match)', async () => {
            await cnUtil.isOurTransactionOutput(
                txPublicKey,
                {
                    key: 'aae1b90b4d0a7debb417d91b7f7aa8fdfd80c42ebc6757e1449fd1618a5a3ff1',
                    index: 0,
                    amount: 1,
                    globalIndex: 0
                },
                walletPrivateViewKey,
                walletPublicSpendKey)
                .then(() => assert(false))
                .catch(() => assert(true));
        });

        it('scan output (match)', async () => {
            await cnUtil.isOurTransactionOutput(
                txPublicKey,
                {
                    key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
                    index: ourOutputIndex,
                    amount: 1,
                    globalIndex: 0
                },
                walletPrivateViewKey,
                walletPublicSpendKey);
        });
    });

    describe('Key Images', async () => {
        const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94';
        const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909';
        const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b';
        const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418';
        const ourOutputIndex = 2;
        const expectedKeyImage = '5997cf23543ce2e05c327297a47f26e710af868344859a6f8d65683d8a2498b0';

        let derivation: string;

        before('Generate derivation', async () => {
            derivation = await TurtleCoinCrypto.generateKeyDerivation(txPublicKey, walletPrivateViewKey);
        });

        it('generate keyImage', async () => {
            const result = await cnUtil.generateKeyImage(
                txPublicKey, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey, ourOutputIndex);
            assert(result.keyImage === expectedKeyImage);
        });

        it('generate keyImage primitive', async () => {
            const result = await cnUtil.generateKeyImagePrimitive(
                walletPublicSpendKey, walletPrivateSpendKey, ourOutputIndex, derivation);
            assert(result.keyImage === expectedKeyImage);
        });
    });

    describe('Input Offsets', async () => {
        const idx = ['53984', '403047', '1533859', '1595598'];
        const expectedIdx = ['53984', '349063', '1130812', '61739'];
        const calculatedRelativeOffsets = cnUtil.absoluteToRelativeOffsets(idx);
        const calculatedAbsoluteOffsets = cnUtil.relativeToAbsoluteOffsets(calculatedRelativeOffsets);

        it('absolute to relative offsets', async () => {
            for (let i = 0; i < expectedIdx.length; i++) {
                assert(parseInt(expectedIdx[i], 10) === calculatedRelativeOffsets[i]);
            }
        });

        it('relative to absolute offsets', async () => {
            for (let i = 0; i < idx.length; i++) {
                assert(parseInt(idx[i], 10) === calculatedAbsoluteOffsets[i]);
            }
        });
    });

    describe('Creation', async () => {
        it('generate a transaction', async function () {
            const madeOutputs = await cnUtil.generateTransactionOutputs(
                'TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX',
                90);
            const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94';
            const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909';
            const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b';
            const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418';

            const fakeInput = {
                index: 2,
                key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
                amount: 1090,
                globalIndex: 1595598
            };

            const madeInput = await cnUtil.isOurTransactionOutput(
                txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey);

            const randomOutputs = [[
                {
                    globalIndex: 53984,
                    key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
                },
                {
                    globalIndex: 403047,
                    key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
                },
                {
                    globalIndex: 1533859,
                    key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
                }
            ]];

            await cnUtil.createTransaction(madeOutputs, [madeInput], randomOutputs, 3, 1000, undefined, 0);
        });

        it('generate a fusion transaction', async function () {
            const madeOutputs = await cnUtil.generateTransactionOutputs(
                'TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX',
                13080);
            const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94';
            const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909';
            const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b';
            const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418';

            const fakeInput = {
                index: 2,
                key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
                amount: 1090,
                globalIndex: 1595598
            };

            const madeInput = await cnUtil.isOurTransactionOutput(
                txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey);

            const inputs = [];
            for (let i = 0; i < 12; i++) {
                inputs.push(madeInput);
            }

            const randomOutput = [
                {
                    globalIndex: 53984,
                    key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
                },
                {
                    globalIndex: 403047,
                    key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
                },
                {
                    globalIndex: 1533859,
                    key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
                }
            ];

            const randomOutputs = [];
            for (let i = 0; i < 12; i++) {
                randomOutputs.push(randomOutput);
            }

            await cnUtil.createTransaction(madeOutputs, inputs, randomOutputs, 3, 0, undefined, 0);
        });

        it('generate a transaction with arbitrary data payload', async function () {
            const madeOutputs = await cnUtil.generateTransactionOutputs(
                'TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX',
                90);
            const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94';
            const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909';
            const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b';
            const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418';

            const fakeInput = {
                index: 2,
                key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
                amount: 1090,
                globalIndex: 1595598
            };

            const madeInput = await cnUtil.isOurTransactionOutput(
                txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey);

            const randomOutputs = [[
                {
                    globalIndex: 53984,
                    key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
                },
                {
                    globalIndex: 403047,
                    key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
                },
                {
                    globalIndex: 1533859,
                    key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
                }
            ]];

            const message = { msg: '001100010010011110100001101101110011', paradoxResolution: true };

            await cnUtil.createTransaction(madeOutputs, [madeInput], randomOutputs, 3, 1000, '', 0, message)
                .then(tx => {
                    const data = JSON.parse(tx.extraData.toString());

                    assert.deepStrictEqual(message, data);
                });
        });

        it('generate a transaction with close input keys', async function () {
            const expectedPrefix = '01000102904e04c9c8940101013f86a1c38f2f1b712b8ed1c0b9db5108d37469' +
                'cee287b345c301e0d6298ad1011c0501027c58ce140c54108f92d088f345e269' +
                '3f04e01d76221913af7ee5863d4ec88502090227b5375a8ec6037a2d2901b654' +
                'e345c1134c11baf3c85fa29014b0dc9fecaaf15a0215140ab1db83d1cfbdfd24' +
                '0a869aa3e16e2b78913bea0b09cb469129e85a2f42900302ecda72c450d12342' +
                'baf6e44dffdad2e99004e42cdc9cded7e88a3dcea9fc63eec03e0255b88b9cc6' +
                '649a5bbee45bfeeaaad6e90150fe1951ead6486c1c044a90590cee2101980aaf' +
                'f7df61f7c8e52c8cec71c3c558b86a4f753886e44ed489e15c5c1e04a3';

            const tx = new Transaction();

            tx.inputs.push(new KeyInput(
                10000, [2434121, 1, 1, 63], '86a1c38f2f1b712b8ed1c0b9db5108d37469cee287b345c301e0d6298ad1011c'));

            tx.outputs = [
                new KeyOutput(1, '7c58ce140c54108f92d088f345e2693f04e01d76221913af7ee5863d4ec88502'),
                new KeyOutput(9, '27b5375a8ec6037a2d2901b654e345c1134c11baf3c85fa29014b0dc9fecaaf1'),
                new KeyOutput(90, '15140ab1db83d1cfbdfd240a869aa3e16e2b78913bea0b09cb469129e85a2f42'),
                new KeyOutput(400, 'ecda72c450d12342baf6e44dffdad2e99004e42cdc9cded7e88a3dcea9fc63ee'),
                new KeyOutput(8000, '55b88b9cc6649a5bbee45bfeeaaad6e90150fe1951ead6486c1c044a90590cee')];

            await tx.addPublicKey('980aaff7df61f7c8e52c8cec71c3c558b86a4f753886e44ed489e15c5c1e04a3');

            assert(tx.prefix === expectedPrefix);
        });

        it('generate a transaction using payment Id', async function () {
            const paymentId = '1886db9573ae180e27f39cced773bdf83aa3a55f1168d89e82bf337bb5373506';
            const madeOutputs = await cnUtil.generateTransactionOutputs(
                'TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX',
                90);
            const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94';
            const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909';
            const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b';
            const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418';

            const fakeInput = {
                index: 2,
                key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
                amount: 1090,
                globalIndex: 1595598
            };

            const madeInput = await cnUtil.isOurTransactionOutput(
                txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey);

            const randomOutputs = [[
                {
                    globalIndex: 53984,
                    key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
                },
                {
                    globalIndex: 403047,
                    key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
                },
                {
                    globalIndex: 1533859,
                    key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
                }
            ]];

            await cnUtil.createTransaction(madeOutputs, [madeInput], randomOutputs, 3, 1000, paymentId, 0)
                .then(tx => {
                    assert(tx.paymentId === paymentId);
                    assert(tx.toString().indexOf(paymentId) !== -1);
                });
        });

        it('generate a transaction using integrated address', async function () {
            const paymentId = '1886db9573ae180e27f39cced773bdf83aa3a55f1168d89e82bf337bb5373506';
            const madeOutputs = await cnUtil.generateTransactionOutputs(
                'TRTLuxjc5auCRCJ9dUVPzt9EVTdT8GwogAaXBVFiTzbUC5sTZZaueftBubfuHB6C2BCQpKNjQDAdB9ZhsjZMndwc9Zn' +
                'DBrCj846SpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzPs6LiD',
                90);
            const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94';
            const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909';
            const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b';
            const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418';

            const fakeInput = {
                index: 2,
                key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
                amount: 1090,
                globalIndex: 1595598
            };

            const madeInput = await cnUtil.isOurTransactionOutput(
                txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey);

            const randomOutputs = [[
                {
                    globalIndex: 53984,
                    key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
                },
                {
                    globalIndex: 403047,
                    key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
                },
                {
                    globalIndex: 1533859,
                    key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
                }
            ]];

            await cnUtil.createTransaction(madeOutputs, [madeInput], randomOutputs, 3, 1000, '', 0)
                .then(tx => {
                    assert(tx.paymentId === paymentId);
                    assert(tx.toString().indexOf(paymentId) !== -1);
                });
        });

        it('generate a transaction using integrated address and matching payment ID', async function () {
            const paymentId = '1886db9573ae180e27f39cced773bdf83aa3a55f1168d89e82bf337bb5373506';
            const madeOutputs = await cnUtil.generateTransactionOutputs(
                'TRTLuxjc5auCRCJ9dUVPzt9EVTdT8GwogAaXBVFiTzbUC5sTZZaueftBubfuHB6C2BCQpKNjQDAdB9ZhsjZMndwc9Zn' +
                'DBrCj846SpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzPs6LiD',
                90);
            const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94';
            const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909';
            const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b';
            const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418';

            const fakeInput = {
                index: 2,
                key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
                amount: 1090,
                globalIndex: 1595598
            };

            const madeInput = await cnUtil.isOurTransactionOutput(
                txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey);

            const randomOutputs = [[
                {
                    globalIndex: 53984,
                    key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
                },
                {
                    globalIndex: 403047,
                    key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
                },
                {
                    globalIndex: 1533859,
                    key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
                }
            ]];

            await cnUtil.createTransaction(madeOutputs, [madeInput], randomOutputs, 3, 1000, paymentId, 0)
                .then(tx => {
                    assert(tx.paymentId === paymentId);
                    assert(tx.toString().indexOf(paymentId) !== -1);
                });
        });

        it('fail to generate a fusion transaction when not enough inputs are used', async function () {
            const madeOutputs = await cnUtil.generateTransactionOutputs(
                'TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX',
                13080);
            const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94';
            const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909';
            const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b';
            const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418';

            const fakeInput = {
                index: 2,
                key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
                amount: 1090,
                globalIndex: 1595598
            };

            const madeInput = await cnUtil.isOurTransactionOutput(
                txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey);

            const inputs = [];
            for (let i = 0; i < 6; i++) {
                inputs.push(madeInput);
            }

            const randomOutput = [
                {
                    globalIndex: 53984,
                    key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
                },
                {
                    globalIndex: 403047,
                    key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
                },
                {
                    globalIndex: 1533859,
                    key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
                }
            ];

            const randomOutputs = [];
            for (let i = 0; i < 6; i++) {
                randomOutputs.push(randomOutput);
            }

            await cnUtil.createTransaction(madeOutputs, inputs, randomOutputs, 3, 0, '', 0)
                .then(() => {
                    assert(false);
                })
                .catch(() => {
                    assert(true);
                });
        });

        it('fail to generate a fusion transaction when not enough outputs are created', async function () {
            const madeOutputs = await cnUtil.generateTransactionOutputs(
                'TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX',
                12000);
            const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94';
            const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909';
            const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b';
            const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418';

            const fakeInput = {
                index: 2,
                key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
                amount: 1000,
                globalIndex: 1595598
            };

            const madeInput = await cnUtil.isOurTransactionOutput(
                txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey);

            const inputs = [];
            for (let i = 0; i < 12; i++) {
                inputs.push(madeInput);
            }

            const randomOutput = [
                {
                    globalIndex: 53984,
                    key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
                },
                {
                    globalIndex: 403047,
                    key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
                },
                {
                    globalIndex: 1533859,
                    key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
                }
            ];

            const randomOutputs = [];
            for (let i = 0; i < 12; i++) {
                randomOutputs.push(randomOutput);
            }

            await cnUtil.createTransaction(madeOutputs, inputs, randomOutputs, 3, 0, '', 0)
                .then(() => {
                    assert(false);
                })
                .catch(() => {
                    assert(true);
                });
        });

        it('fail to generate a transaction when network fee is incorrect', async function () {
            const madeOutputs = await cnUtil.generateTransactionOutputs(
                'TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX',
                90);
            const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94';
            const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909';
            const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b';
            const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418';

            const fakeInput = {
                index: 2,
                key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
                amount: 100,
                globalIndex: 1595598
            };

            const madeInput = await cnUtil.isOurTransactionOutput(
                txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey);

            const randomOutputs = [[
                {
                    globalIndex: 53984,
                    key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
                },
                {
                    globalIndex: 403047,
                    key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
                },
                {
                    globalIndex: 1533859,
                    key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
                }
            ]];

            await cnUtil.createTransaction(madeOutputs, [madeInput], randomOutputs, 3, 10, '', 0)
                .then(() => {
                    assert(false);
                })
                .catch(() => {
                    assert(true);
                });
        });

        it('fail to generate a transaction with an excessive number of outputs', async function () {
            const madeOutputs = [];

            for (let i = 0; i < 100; i++) {
                const outputs = await cnUtil.generateTransactionOutputs(
                    'TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB' +
                    '6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX',
                    90);

                for (const output of outputs) {
                    madeOutputs.push(output);
                }
            }

            const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94';
            const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909';
            const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b';
            const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418';

            const fakeInput = {
                index: 2,
                key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
                amount: 16500,
                globalIndex: 1595598
            };

            const madeInput = await cnUtil.isOurTransactionOutput(
                txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey);

            const randomOutputs = [[
                {
                    globalIndex: 53984,
                    key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
                },
                {
                    globalIndex: 403047,
                    key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
                },
                {
                    globalIndex: 1533859,
                    key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
                }
            ]];

            await cnUtil.createTransaction(madeOutputs, [madeInput], randomOutputs, 3, 7500, '', 0)
                .then(() => {
                    assert(false);
                })
                .catch(() => {
                    assert(true);
                });
        });

        it('fail to generate a transaction with too much extra data', async function () {
            const madeOutputs = await cnUtil.generateTransactionOutputs(
                'TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX',
                90);
            const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94';
            const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909';
            const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b';
            const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418';

            const fakeInput = {
                index: 2,
                key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
                amount: 100,
                globalIndex: 1595598
            };

            const madeInput = await cnUtil.isOurTransactionOutput(
                txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey);

            const randomOutputs = [[
                {
                    globalIndex: 53984,
                    key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
                },
                {
                    globalIndex: 403047,
                    key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
                },
                {
                    globalIndex: 1533859,
                    key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
                }
            ]];

            const message = {
                msg: '001100010010011110100001101101110011',
                paradoxResolution: true,
                random:
                    '5a4f86e32ab8533a7073eff7e321394a8751ab2b2f6e3219733eb5ccdb37974e' +
                    '8e67e9b95a285d3fffff862e6c1fbe281212d4bea1594f05824471f98ea76e51' +
                    '622c79c0f88ac8e3ffdfa9225a72973eabe0db8d5ce93034f67d7f334bfe7477' +
                    '1e6b59e1d90b6539cc53482fe34a8de0ce7eb2875329ec7069b73a8cfe87dd33' +
                    'eeeffd38aa84c96d2e5878e0b17410c81c581a2c88c09a908953c2ef442efe26' +
                    '708ed0fdd7612f23b0002421193e4cceb6838e1b9fb2da8776ff3cbd414fcec5' +
                    'c8fe7bbbd9d011326317bc063a8fda6b4116622cca752732ec0574f2010caff2' +
                    '79d369d0de930c9ad14e9f87b0697429d2ebedfe5bc4b909d5e31319eacfd249' +
                    '98739315efdfca2d06dee1297c51130d989f904583f80f92ce5b167a435b43d1' +
                    'a5ab3730a9fa55020c2374dbf2fa4e89b3e0e911acd86591c3129050cda46512' +
                    '92a38628be548e27f74f0453146ebff3479ab6031a8eeb4c83e027f935972b99' +
                    '3a52df953ffdb14530a561fc4b05eb3c0af2cf913730815ec1b1ee79f4acbdea' +
                    '46b220e9571080ccbe684ea777611c743bdb4848b26d04ab877f1293f160bc18' +
                    '11ab5077a63c0838550e7fe3584f2ac5a11f87952580f522ac8bb44b8f96c3f0' +
                    'bb71b0ca8eeba64eb761ae9f6c671117a1391a5ad56a43f3f6483a9c4438c6f8' +
                    'cb53163754296469c40b5764e258240c0f8ce1f8b91b1a0f3a60a5794b55bf04' +
                    'c68aa616ea59cfbda4a79929af254c1b581ce65592a4814830dd72c125e6d834' +
                    '298fc96348b5be20129f15b61f8bb38c8f6766a097b03a4fa010eb26a7a3844f' +
                    '6813e97b413eb1dd3d36192b6f147fc7cded87ed3fa0c75d3551d9a86e92f92f' +
                    '5b0b5cb87d46c8fe7ff84ef73ceafb8ada54f08718333c4afa948f982649178b' +
                    '6832345f6368d42f4828739925b4b0b75930279157fb91498d7f37153402f485' +
                    '27e9eebc87e6cd5638da4af41be019df3592da344bb0bfa1919f54bcc25764c3' +
                    'f521cbb15f3e6cee84f1a9004884a5828ea7c5518a365c23535a604471a33da3' +
                    'b906c360b7b63b722cbbc4fc9f42891e157257390db6dd5c3176442eb087fd38' +
                    'fd69c1fa14ff40189ff036c2d85e5e19963d82f877a1b419b7627eedd1d7fdad' +
                    '07aa001bd31e71aa07329a4814b8c39a1ef741baffaa60c67095a2eeea9b5c9e' +
                    'c34dc13aa7748f7f5ac42793861f59ac2ce612341a6807256e8154734b98b15e' +
                    'e9d814c777e788f9008ed009b98550c472016836235517a4d13195af3aef51f2' +
                    '77993fee9e0cde6fa843903e78b151d7298cf04f59350db1203423a455b3c20d' +
                    '571b7a2c0251fe345781b2d365e5fccae4ae3a0e25e6e3d15f00eef15ac8095a' +
                    'd0c1c0cda119b4bb19dd67b717619564143f08d106dd22686b37b0c4f29f6b70' +
                    '572996170755ed16157a13ce1468ee15a127cf6d19caa176aa47f67f4f13ad3e'
            };

            await cnUtil.createTransaction(madeOutputs, [madeInput], randomOutputs, 3, 10, '', 0, message)
                .then(() => {
                    assert(false);
                })
                .catch(() => {
                    assert(true);
                });
        });

        it('fail to generate a transaction when output too large', async function () {
            const madeOutputs = await cnUtil.generateTransactionOutputs(
                'TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX',
                90);
            const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94';
            const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909';
            const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b';
            const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418';

            madeOutputs[0].amount = 200000000000;

            const fakeInput = {
                index: 2,
                key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
                amount: 100,
                globalIndex: 1595598
            };

            const madeInput = await cnUtil.isOurTransactionOutput(
                txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey);

            const randomOutputs = [[
                {
                    globalIndex: 53984,
                    key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
                },
                {
                    globalIndex: 403047,
                    key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
                },
                {
                    globalIndex: 1533859,
                    key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
                }
            ]];

            await cnUtil.createTransaction(madeOutputs, [madeInput], randomOutputs, 3, 10, '', 0)
                .then(() => assert(false))
                .catch(() => assert(true));
        });

        it('fail to generate transaction when payment ID does not match payment ID in integrated address',
            async function () {
                const paymentId = '1886db9573ae180e27f39cced773bdf83aa3a55f1168d89e82bf337bb5373505';
                const madeOutputs = await cnUtil.generateTransactionOutputs(
                    'TRTLuxjc5auCRCJ9dUVPzt9EVTdT8GwogAaXBVFiTzbUC5sTZ' +
                'ZaueftBubfuHB6C2BCQpKNjQDAdB9ZhsjZMndwc9ZnDBrCj846SpRsZW' +
                'xkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3' +
                'Avwz7W89J4doLuigLjUzPs6LiD',
                    90);
                const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94';
                const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909';
                const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b';
                const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418';

                const fakeInput = {
                    index: 2,
                    key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
                    amount: 1090,
                    globalIndex: 1595598
                };

                const madeInput = await cnUtil.isOurTransactionOutput(
                    txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey);

                const randomOutputs = [[
                    {
                        globalIndex: 53984,
                        key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
                    },
                    {
                        globalIndex: 403047,
                        key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
                    },
                    {
                        globalIndex: 1533859,
                        key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
                    }
                ]];

                await cnUtil.createTransaction(madeOutputs, [madeInput], randomOutputs, 3, 1000, paymentId, 0)
                    .then(() => assert(false))
                    .catch(() => assert(true));
            });

        it('fail to generate transaction using two destinations with differing payment IDs', async function () {
            const madeOutputs = await cnUtil.generateTransactionOutputs(
                'TRTLuxjc5auCRCJ9dUVPzt9EVTdT8GwogAaXBVFiTzbUC5sTZ' +
                'ZaueftBubfuHB6C2BCQpKNjQDAdB9ZhsjZMndwc9ZnDBrCj846SpRsZW' +
                'xkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3' +
                'Avwz7W89J4doLuigLjUzPs6LiD',
                90);
            const madeOutputs2 = await cnUtil.generateTransactionOutputs(
                'TRTLuxp8RkjA5TMvFWhSoz94bwe9fHbFpCb1f669XiNc95D7s' +
                '7CShfW9unmPq2M3nS9jbdbx37dnH9unntNPGVmqA5LbzVL4HQrSpRsZW' +
                'xkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3' +
                'Avwz7W89J4doLuigLjUzPembYH',
                90);
            const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94';
            const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909';
            const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b';
            const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418';

            const fakeInput = {
                index: 2,
                key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
                amount: 1180,
                globalIndex: 1595598
            };

            const madeInput = await cnUtil.isOurTransactionOutput(
                txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey);

            const randomOutputs = [[
                {
                    globalIndex: 53984,
                    key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
                },
                {
                    globalIndex: 403047,
                    key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
                },
                {
                    globalIndex: 1533859,
                    key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
                }
            ]];

            await cnUtil.createTransaction(madeOutputs.concat(madeOutputs2), [madeInput], randomOutputs, 3, 1000, '', 0)
                .then(() => assert(false))
                .catch(() => assert(true));
        });
    });

    describe('Prepared Transactions', async () => {
        it('prepare a transaction', async function () {
            const madeOutputs = await cnUtil.generateTransactionOutputs(
                'TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX',
                90);
            const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94';
            const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909';
            const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b';
            const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418';

            const fakeInput = {
                index: 2,
                key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
                amount: 1090,
                globalIndex: 1595598
            };

            const madeInput = await cnUtil.isOurTransactionOutput(
                txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey);

            const randomOutputs = [[
                {
                    globalIndex: 53984,
                    key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
                },
                {
                    globalIndex: 403047,
                    key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
                },
                {
                    globalIndex: 1533859,
                    key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
                }
            ]];

            await cnUtil.prepareTransaction(madeOutputs, [madeInput], randomOutputs, 3, 1000, undefined, 0);
        });

        it('prepare a transaction - precomputed K', async function () {
            const madeOutputs = await cnUtil.generateTransactionOutputs(
                'TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX',
                90);
            const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94';
            const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909';
            const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b';
            const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418';
            const keys = await TurtleCoinCrypto.generateKeys();

            const fakeInput = {
                index: 2,
                key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
                amount: 1090,
                globalIndex: 1595598
            };

            const madeInput = await cnUtil.isOurTransactionOutput(
                txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey);

            const randomOutputs = [[
                {
                    globalIndex: 53984,
                    key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
                },
                {
                    globalIndex: 403047,
                    key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
                },
                {
                    globalIndex: 1533859,
                    key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
                }
            ]];

            const prep = await cnUtil.prepareTransaction(
                madeOutputs,
                [madeInput],
                randomOutputs,
                3,
                1000,
                undefined,
                0,
                undefined,
                keys.private_key);

            assert(prep && prep.signatureMeta[0].key === keys.private_key);
        });

        it('complete a transaction', async function () {
            const madeOutputs = await cnUtil.generateTransactionOutputs(
                'TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX',
                90);
            const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94';
            const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909';
            const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b';
            const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418';

            const fakeInput = {
                index: 2,
                key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
                amount: 1090,
                globalIndex: 1595598
            };

            const madeInput = await cnUtil.isOurTransactionOutput(
                txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey);

            const randomOutputs = [[
                {
                    globalIndex: 53984,
                    key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
                },
                {
                    globalIndex: 403047,
                    key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
                },
                {
                    globalIndex: 1533859,
                    key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
                }
            ]];

            const prep = await cnUtil.prepareTransaction(
                madeOutputs, [madeInput], randomOutputs, 3, 1000, undefined, 0);

            await cnUtil.completeTransaction(prep, walletPrivateSpendKey);
        });

        it('complete a transaction - precomputed K', async function () {
            const madeOutputs = await cnUtil.generateTransactionOutputs(
                'TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX',
                90);
            const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94';
            const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909';
            const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b';
            const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418';
            const keys = await TurtleCoinCrypto.generateKeys();

            const fakeInput = {
                index: 2,
                key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
                amount: 1090,
                globalIndex: 1595598
            };

            const madeInput = await cnUtil.isOurTransactionOutput(
                txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey);

            const randomOutputs = [[
                {
                    globalIndex: 53984,
                    key: 'a5add8e36ca2473734fc7019730593888ae8c320753215976aac105816ba4848'
                },
                {
                    globalIndex: 403047,
                    key: '273dd5b63e84e6d7f12cf05eab092a7556708d8aac836c8748c1f0df3f0ff7fa'
                },
                {
                    globalIndex: 1533859,
                    key: '147121ea91715ee21af16513bc058d4ac445accfbe5cedc377c897fb04f4fecc'
                }
            ]];

            const prep = await cnUtil.prepareTransaction(
                madeOutputs, [madeInput], randomOutputs, 3, 1000, undefined, 0, undefined, keys.private_key);

            await cnUtil.completeTransaction(prep, walletPrivateSpendKey);
        });
    });

    describe('Parsing', async () => {
        it('Parse a transaction with a max unlock time', async () => {
            const raw =
                '01feffffffffffffffff010102e80705a101b3094bee0afe0ecfbb15ec014559' +
                '49cfb1969da686948ed1babb761b45b053f8db505bcce50645035a02144da66c' +
                '147cb413b99504fecf2d23a23b605ca98327043208d1d0658dc7fc8e6402038e' +
                '86bd155a518d9810c7b9c568ce665a4078df99b826007aac3bf43dd94edaa006' +
                '02488c123065769f6017340d93f349f084afa805695034e4da6cb640b9fdfeda' +
                '9544022100cad826dac837aa45954bd48e66173f0cf6ff653e42055855b88ccb' +
                '34d074324a011c4fadf9225eed74d3953e388c74c227803336d2f0f0939b1536' +
                '17c0c86deff7692d63c7db269107e3b6842d9a31b5dbe4a7ebc3ab4ede9318c8' +
                '089df0d9a7069d84f5bc9e15826c3e30cbf6386bbfe4936afd1967f41011e14f' +
                '0a662207550ebf4dd5d7100e6100bdfdd4503d456dbc7a70593eeeb941e41cc0' +
                '618e55c43505d2cb5619eb83c1e22a309143a826dcaeac84d8a8648d4ba86d19' +
                '76d05c7384029c894d3b4ece9c9c6dfd5c699c38e3f90dc010ee1fd57930a9f3' +
                '8e744ade500ad7ca6418cdcf55ec0570f8cd22fe40a04a19ae55ccbdb0833fc4' +
                '1e2d62f06802fd65a556b2a187c2c115a0acf8b1b934c1efb9ec383f5de33f8b' +
                '981803e45d09f63cb1c7dfa239e15df9c122b636899d93641e1e1a61ad8d8ceb' +
                '5759a8dcad03dd7e0e459aa6d623ab9052b29e228bacd3bb89cdbdc82bd3a8b9' +
                '9615cdc4f309df7e33650eab865674672d381d38774351dc1e9db66492d4c186' +
                '3ca30b0e8105';

            const tx = await Transaction.from(raw);

            assert(raw === tx.toString());
        });
    });
});

describe('Blocks', async function () {
    this.timeout(30000);

    describe('Structures', async () => {
        const BlockTemplateSample = require('./template.json');
        const BlockTemplateSample2 = require('./template2.json');

        const genesisBlockRaw =
            '0100000000000000000000000000000000000000000000000000000000000000' +
            '00000046000000010a01ff000188f3b501029b2e4c0281c0b02e7c53291a94d1' +
            'd0cbff8883f8024f5142ee494ffbbd088071210142694232c5b04151d9e4c27d' +
            '31ec7a68ea568b19488cfcb422659a07a0e44dd500';
        const miningBlob =
            '0100b5f9abe605b4318c1249164393f7b9d691e60aba81ca9bbffb9e0b23e6b0' +
            '1c93d9c621ab80000000004b27c162bc89b0bdfa0db8b5c99977943caf754bb6' +
            '181d8e1bafc6af2ab0b0bb01';

        it('deserializes and reserializes block template', async () => {
            const testBlock = await Block.from(BlockTemplateSample.blob);

            assert(BlockTemplateSample.blob === testBlock.toString());
        });

        it('deserializes and serializes block', async () => {
            const testBlock = await Block.from(genesisBlockRaw);

            assert(genesisBlockRaw === testBlock.toString());
        });

        it('calculates mining blob', async () => {
            const testBlockTemplate = await BlockTemplate.from(BlockTemplateSample);
            const convertedTemplate = await testBlockTemplate.convert();

            assert(await convertedTemplate.toHashingString(true) === miningBlob);
        });

        it('merges blocks', async () => {
            const testBlockTemplate = await BlockTemplate.from(BlockTemplateSample);
            const mergedBlobResult = await testBlockTemplate.construct(0x1c64);
            const expectedMergedBlob =
                '0500b4318c1249164393f7b9d691e60aba81ca9bbffb9e0b23e6b01c93d9c621' +
                'ab800100b5f9abe605b4318c1249164393f7b9d691e60aba81ca9bbffb9e0b23' +
                'e6b01c93d9c621ab80641c00000101000000230321008a7f7239a53ead2db2fc' +
                '1062a898c1af301e919e2f26e13a568176ba7f1a0e1f01b9fe5801ff91fe5807' +
                '0802959f9d01c4cbd664e7c937687e7ae847f75745614ba4a11a6f5c0b25a5ca' +
                '42c314026840ba5dc6c84a533d005f0a6f9758c4eb4d19bffa3b4a73547596da' +
                'c17b7d169003022f88b7b85f42c789721e7ee44bded4b6e1e48f7fb9bb73dc87' +
                'cda264adf06a54f02e02175cea7cf09b914749c650b9321678d3f0e4390cad20' +
                'ac6896be7ac14ba4f31ab0ea01021192fdc86fd815642850c0f50bc11df8ba1d' +
                '39581d2c0642aa83f72f1c3fb22580ea3002c28a03fb9b3b7f6e4f9cdf2e74e9' +
                '3c8282580d8134722302b9978cdc3a35f39980897a02a4978ee1742da6f77791' +
                'f065326922ff8c713687d2b52215ce7911b08922a7602901296929051bf0b258' +
                'b717ffdca80c8b0822063c9d3f70f0dbed9b3f2e0aca2fa10206000000000000' +
                '12f6b48f1800c368e046252e50165620fbb155176d17ddfdb98fd3227237760c' +
                'f579af90593ec64a4a5549bd219969dc9aa1aac2dc3eab529c90b2f8c20221f9' +
                '9f02bdfb9a7efb5e5e85b710ef442b3cc82431173db142947a4f755a22f45915' +
                'e5f2d53027a4aee505305c7cde822f960578417779ef71c1c8b611e95f1643fd' +
                '125a39df66f40ce82794c9debc342381f26763c80968f8bf8e5378b433c583a6' +
                '078348457ebe6ad61e5487ac3bebe22e03c46d9c894a511561ffbe9612809c17' +
                '207493941d607b152f4ce193f828085ee8afcc0a351a9cecac0f01b2729df67a' +
                'f831637f76a8430848d86beb643df918af6cc554a8d0b42899671ee02cfbe649' +
                '05b4458647a90a50aa307be48f3db57ff7f5446926ee70cee0c0cf7ad9021de7' +
                '27b2f97b5e2f0fd0103b24725d0c11ddd876de27a7b837bdd43eb4d9ca479883' +
                'ad2dcd853ece92e6a7544b24e44051411e6b913760b9d997ca986985b92d51cc' +
                'bc5708f0cd93c0ce2d1aea46a6744cc81a3df394cd099518cb3c3a5fa43e187c' +
                '9d72bc3a245256fa60b450411b56d2258d4001b6133f58a5d48af0cc12af652c' +
                '202b3c9de3f426026500c493c075340ca713a49843db16bda542fd76fb597914' +
                'e1c975a70d12971baf70b8f7f6f452fd669f3cc00d0a0f36a3312f7c51cadf24' +
                'cac9c24841eeaa742b5d1e74a750e5763afbd2a75e341edb4439801ac665dd0a' +
                '3b16cc648a651546c7a3633f0a0274bb3815d6bda05e12fb7cbb908ceb582590' +
                'a84a30ba6043178279343f5107713390b8e2ca2a8723ee7e5855c6af674bbd9b' +
                '5a';

            assert(mergedBlobResult.toString() === expectedMergedBlob);
        });

        it('sets miner transaction nonce', async () => {
            const testBlockTemplate = await BlockTemplate.from(BlockTemplateSample);

            testBlockTemplate.minerNonce++;

            assert(testBlockTemplate.minerNonce === 1);
        });

        it('handles block miner transaction with malformed TX_EXTRA data', async () => {
            const a = await Block.from(
                '030051f645cd8d0b1ac7adab144afb79cb4b75edaf4504c62f9c5f6ef1209cfd' +
                'a2a10100b287bcd10551f645cd8d0b1ac7adab144afb79cb4b75edaf4504c62f9c5f6' +
                'ef1209cfda2a1956055d5010100000023032100f5ecd333d82d3037e7ce4d075945e8' +
                '14fc0f1f0720e3c02f8a05ae7f5e33f09c01cd3d01ffa53d070502870a894387ea214' +
                '2f1bacd9e146af668ef96121bb85e8a41062323ed39f1cce31e022b437667e4eea934' +
                '7631f5d6711fc766303446fc1292d5e306606db915e8dd35f4030282473db1baeb876' +
                '79169cfc623d7428c8a177f177050c0aff4de1ba2c1819525a846021b73ab4b753c22' +
                '6eecce342061ed25f6472adbc4437c5246a1252e2a22d9601ff0a2040296083a917dc' +
                'a96091d6ecebf535086aa2bebfb89011f0b11d57599665ce81b31a0f736027cd97488' +
                '3b783ff451d539a91eb4f5c5da8f2380131e4c6ecd48e936dcfe30fa80897a027f907' +
                'ef11b0bc4eb102af3c5fc665c0e2a37b58d2f3d3989d4ae6a475f245ee12b01ffd035' +
                '15fde283456ea51132743ae3dbcd2045008aec028de8e7fea72b32734202080000000' +
                '001547f1300');

            assert((a));
        });

        it('Can read pool nonce in miner transaction correctly via .poolNonce', async () => {
            const expected = BigInteger(2);
            const a = await BlockTemplate.from(BlockTemplateSample2);

            a.minerTransaction.incrementPoolNonce();

            // The value is set to 1 already in the sample template
            assert.deepStrictEqual(a.minerTransaction.poolNonce, expected);
        });

        it('Can read pool nonce in miner transaction correctly via .minerNonce', async () => {
            const testBlockTemplate = await BlockTemplate.from(BlockTemplateSample2);

            testBlockTemplate.minerNonce++;

            // The value is set to 1 already in the sample template
            assert(testBlockTemplate.minerNonce === 2);
        });
    });

    describe('Hashing', async () => {
        interface IBlock {
            block: string;
            hash: string;
            pow: string;
            nonce: number;
        }

        const blocks: IBlock[] = require('./blocks.json');

        for (const block of blocks) {
            const testBlock = await Block.from(block.block);

            describe('Test block v' + testBlock.majorVersion + '.' + testBlock.minorVersion + ' #' + testBlock.height,
                async () => {
                    it('serialization works', async () => {
                        assert(await testBlock.toString() === block.block);
                    });

                    it('hash works', async () => {
                        assert(await testBlock.hash() === block.hash);
                    });

                    it('PoW hash works', async () => {
                        assert(await testBlock.longHash() === block.pow);
                    });

                    it('Nonce matches', async () => {
                        assert(testBlock.nonce === block.nonce);
                    });
                });
        }
    });
});

describe('Peer-to-Peer', async function () {
    this.timeout(30000);

    describe('1001: COMMAND_HANDSHAKE', async () => {
        it('Request', async () => {
            const raw = require('./levin_packets.json').COMMAND_HANDSHAKE;

            const packet = await LevinPacket.from(raw);

            assert(raw === packet.toString());
        });

        it('Response', async () => {
            const raw = require('./levin_packets.json').COMMAND_HANDSHAKE_Response;

            const packet = await LevinPacket.from(raw);

            assert(raw === packet.toString());
        });
    });

    describe('1002: COMMAND_TIMED_SYNC', async () => {
        it('Request', async () => {
            const raw = require('./levin_packets.json').COMMAND_TIMED_SYNC;

            const packet = await LevinPacket.from(raw);

            assert(raw === packet.toString());
        });

        it('Response', async () => {
            const raw = require('./levin_packets.json').COMMAND_TIMED_SYNC_Response;

            const packet = await LevinPacket.from(raw);

            assert(raw === packet.toString());
        });
    });

    describe('1003: COMMAND_PING', async () => {
        it('Request', async () => {
            const raw = require('./levin_packets.json').COMMAND_PING;

            const packet = await LevinPacket.from(raw);

            assert(raw === packet.toString());
        });

        it('Response', async () => {
            const raw = require('./levin_packets.json').COMMAND_PING_Response;

            const packet = await LevinPacket.from(raw);

            assert(raw === packet.toString());
        });
    });

    describe('2001: NOTIFY_NEW_BLOCK', async () => {
        it('Request', async () => {
            const raw = require('./levin_packets.json').NOTIFY_NEW_BLOCK;

            const packet = await LevinPacket.from(raw);

            assert(raw === packet.toString());
        });
    });

    describe('2002: NOTIFY_NEW_TRANSACTIONS', async () => {
        it('Response', async () => {
            const raw = require('./levin_packets.json').NOTIFY_NEW_TRANSACTIONS;

            const packet = await LevinPacket.from(raw);

            assert(raw === packet.toString());
        });
    });

    describe('2003: NOTIFY_REQUEST_GET_OBJECTS', async () => {
        it('Request', async () => {
            const raw = require('./levin_packets.json').NOTIFY_REQUEST_GET_OBJECTS;

            const packet = await LevinPacket.from(raw);

            assert(raw === packet.toString());
        });
    });

    describe('2004: NOTIFY_RESPONSE_GET_OBJECTS', async () => {
        it('Request', async () => {
            const raw = require('./levin_packets.json').NOTIFY_RESPONSE_GET_OBJECTS;

            const packet = await LevinPacket.from(raw);

            assert(raw === packet.toString());
        });
    });

    describe('2005: RESERVED_FOR_FUTURE_USE', async () => {
        it('Request', async function () {
            this.skip();
        });
    });

    describe('2006: NOTIFY_REQUEST_CHAIN', async () => {
        it('Request', async () => {
            const raw = require('./levin_packets.json').NOTIFY_REQUEST_CHAIN;

            const packet = await LevinPacket.from(raw);

            assert(raw === packet.toString());
        });
    });

    describe('2007: NOTIFY_RESPONSE_CHAIN_ENTRY', async () => {
        it('Request', async () => {
            const raw = require('./levin_packets.json').NOTIFY_RESPONSE_CHAIN_ENTRY;

            const packet = await LevinPacket.from(raw);

            assert(raw === packet.toString());
        });
    });

    describe('2008: NOTIFY_REQUEST_TX_POOL', async () => {
        it('Request', async () => {
            const raw = require('./levin_packets.json').NOTIFY_REQUEST_TX_POOL;

            const packet = await LevinPacket.from(raw);

            assert(raw === packet.toString());
        });
    });

    describe('2009: NOTIFY_NEW_LITE_BLOCK', async () => {
        it('Request', async () => {
            const raw = require('./levin_packets.json').NOTIFY_NEW_LITE_BLOCK;

            const packet = await LevinPacket.from(raw);

            assert(raw === packet.toString());
        });
    });

    describe('2010: NOTIFY_MISSING_TXS', async () => {
        it('Request', async () => {
            const raw = require('./levin_packets.json').NOTIFY_MISSING_TXS;

            const packet = await LevinPacket.from(raw);

            assert(raw === packet.toString());
        });
    });
});

describe('Test Ledger Integration', async function () {
    let skipLedgerTests = TurtleCoinCrypto.type !== CryptoType.NODEADDON;
    let TransportNodeHID: any;

    let ledger: LedgerNote;
    let device: LedgerDevice;
    let spend_key: KeyPair;

    before(async () => {
        if (!skipLedgerTests) {
            try {
                TransportNodeHID = (await import('@ledgerhq/hw-transport-node-hid')).default;

                const devices = await TransportNodeHID.list();

                if (devices.length === 0) {
                    skipLedgerTests = true;
                }
            } catch (e) {
                skipLedgerTests = true;
            }
        }
    });

    it('Connect to Ledger', async function () {
        if (skipLedgerTests) {
            return this.skip();
        }

        try {
            const transport = await TransportNodeHID.create(1000);

            ledger = new LedgerNote(transport);

            device = new LedgerDevice(transport);
        } catch (e) {
            skipLedgerTests = true;

            return this.skip();
        }
    });

    it('Initialize Ledger', async function () {
        if (skipLedgerTests) {
            return this.skip();
        }

        await ledger.init()
            .catch(() => {
                skipLedgerTests = true;

                assert(false);
            });
    });

    it('Fetch Keys', async function () {
        if (skipLedgerTests) {
            return this.skip();
        }

        await ledger.fetchKeys()
            .catch(() => {
                skipLedgerTests = false;

                assert(false);
            });
    });

    it('Fetch Private Spend Key', async function () {
        if (skipLedgerTests) {
            return this.skip();
        }

        await device.getPrivateSpendKey()
            .then(key => { spend_key = key; })
            .catch(() => assert(false));
    });

    it('Generate Key Image', async function () {
        if (skipLedgerTests || !spend_key) {
            return this.skip();
        }

        const keys = await TurtleCoinCrypto.generateKeys();

        const derivation = await TurtleCoinCrypto.generateKeyDerivation(
            ledger.address.view.publicKey, keys.private_key);

        const public_ephemeral = await TurtleCoinCrypto.derivePublicKey(
            derivation, 0, ledger.address.spend.publicKey);

        const private_ephemeral = await TurtleCoinCrypto.deriveSecretKey(
            derivation, 0, spend_key.privateKey);

        const key_image = await TurtleCoinCrypto.generateKeyImage(public_ephemeral, private_ephemeral);

        const ledger_key_image = await ledger.generateKeyImage(
            keys.public_key, undefined, undefined, undefined, 0);

        assert(ledger_key_image.keyImage === key_image);
        assert(ledger_key_image.publicEphemeral === public_ephemeral);
        assert(!ledger_key_image.privateEphemeral);
    });

    it('Generate Key Image Primitive', async function () {
        if (skipLedgerTests || !spend_key) {
            return this.skip();
        }

        const keys = await TurtleCoinCrypto.generateKeys();

        const derivation = await TurtleCoinCrypto.generateKeyDerivation(
            ledger.address.view.publicKey, keys.private_key);

        const public_ephemeral = await TurtleCoinCrypto.derivePublicKey(
            derivation, 0, ledger.address.spend.publicKey);

        const private_ephemeral = await TurtleCoinCrypto.deriveSecretKey(
            derivation, 0, spend_key.privateKey);

        const key_image = await TurtleCoinCrypto.generateKeyImage(public_ephemeral, private_ephemeral);

        const ledger_key_image = await ledger.generateKeyImagePrimitive(
            keys.public_key, undefined, 0, derivation);

        assert(ledger_key_image.keyImage === key_image);
        assert(ledger_key_image.publicEphemeral === public_ephemeral);
        assert(!ledger_key_image.privateEphemeral);
    });

    it('Sign a message', async function () {
        if (skipLedgerTests) {
            return this.skip();
        }

        const message = { ledger: 'TurtleCoin Rocks!' };

        const signature = await ledger.signMessage(message, undefined);

        assert(await cnUtil.verifyMessageSignature(message, ledger.address.spend.publicKey, signature));
    });

    it('Create a Transaction', async function () {
        if (skipLedgerTests) {
            return this.skip();
        }

        const outputs = await ledger.generateTransactionOutputs(await ledger.address.address(), 1000000);

        const keys = await TurtleCoinCrypto.generateKeys();

        const derivation = await TurtleCoinCrypto.generateKeyDerivation(
            ledger.address.view.publicKey, keys.private_key);

        const public_ephemeral = await TurtleCoinCrypto.derivePublicKey(
            derivation, 0, ledger.address.spend.publicKey);

        const fakeInput = { index: 0, key: public_ephemeral, amount: 2000000, globalIndex: 0 };

        const inputs = [await ledger.isOurTransactionOutput(
            keys.public_key, fakeInput, undefined, undefined, undefined)];

        const random_outputs = [];

        for (let i = 0; i < 3; i++) {
            const random = await TurtleCoinCrypto.generateKeys();

            random_outputs.push({
                globalIndex: parseInt(random.private_key.slice(0, 4), 16),
                key: random.public_key
            });
        }

        await ledger.createTransaction(outputs, inputs, [random_outputs], 3);
    });
});

describe('TurtleCoind < 1.0.0', function () {
    this.timeout(60000);

    let is_explorer = false;

    const server = new LegacyTurtleCoind('seed.turtlenode.io');

    before('check()', async function () {
        try {
            const result = await server.info();

            if (result.version.major > 0) {
                this.skip();
            }

            try {
                await server.transactionPool();

                is_explorer = true;
            } catch (e) {
                is_explorer = false;
            }
        } catch (e) {
            this.skip();
        }
    });

    it('block({hash})', async function () {
        if (!is_explorer) {
            return this.skip();
        }

        const hash = '7fb97df81221dd1366051b2d0bc7f49c66c22ac4431d879c895b06d66ef66f4c';
        const prevHash = '0000000000000000000000000000000000000000000000000000000000000000';
        const block = await server.block(hash);
        assert(block.hash === hash);
        assert(block.prevHash === prevHash);
    });

    it('block({height})', async function () {
        if (!is_explorer) {
            return this.skip();
        }

        const hash = '7fb97df81221dd1366051b2d0bc7f49c66c22ac4431d879c895b06d66ef66f4c';
        const prevHash = '0000000000000000000000000000000000000000000000000000000000000000';
        const block = await server.block(0);
        assert(block.hash === hash);
        assert(block.prevHash === prevHash);
    });

    it('rawBlock({hash})', async function () {
        if (!is_explorer) {
            return this.skip();
        }

        const expected_blob = '0100000000000000000000000000000000000000000000000000000000000000000000' +
            '46000000010a01ff000188f3b501029b2e4c0281c0b02e7c53291a94d1d0cbff8883f8024f5142ee494ffbbd' +
            '088071210142694232c5b04151d9e4c27d31ec7a68ea568b19488cfcb422659a07a0e44dd500';
        const hash = '7fb97df81221dd1366051b2d0bc7f49c66c22ac4431d879c895b06d66ef66f4c';
        const block = await server.rawBlock(hash);
        assert(block.blob === expected_blob);
    });

    it('rawBlock({height})', async function () {
        if (!is_explorer) {
            return this.skip();
        }

        const expected_blob = '0100000000000000000000000000000000000000000000000000000000000000000000' +
            '46000000010a01ff000188f3b501029b2e4c0281c0b02e7c53291a94d1d0cbff8883f8024f5142ee494ffbbd' +
            '088071210142694232c5b04151d9e4c27d31ec7a68ea568b19488cfcb422659a07a0e44dd500';
        const block = await server.rawBlock(0);
        assert(block.blob === expected_blob);
    });

    it('blockCount()', () => {
        return server.blockCount();
    });

    it('blockHeaders()', async function () {
        if (!is_explorer) {
            return this.skip();
        }

        const headers = await server.blockHeaders(100);
        assert(headers.length === 31);
    });

    it('blockTemplate()', async () => {
        const wallet = 'TRTLv1pacKFJk9QgSmzk2LJWn14JGmTKzReFLz1RgY3K9Ryn77' +
            '83RDT2TretzfYdck5GMCGzXTuwKfePWQYViNs4avKpnUbrwfQ';
        const reserve = 8;
        const template = await server.blockTemplate(wallet, reserve);
        assert(template.difficulty > 0);
    });

    it('fee()', async () => {
        const fee = await server.fee();

        assert(fee);
    });

    it('indexes()', async () => {
        const indexes = await server.indexes(0, 10);

        assert(indexes.length === 11);
    });

    it('height()', async () => {
        await server.height();
    });

    it('info()', async () => {
        await server.info();
    });

    it('lastBlock()', async () => {
        const header = await server.lastBlock();
        assert(header.depth === 0);
    });

    it('peers()', async () => {
        await server.peers();
    });

    it('transactionPoolChanges()', async () => {
        const hash = 'ea531b1af3da7dc71a7f7a304076e74b526655bc2daf83d9b5d69f1bc4555af0';
        const changes = await server.transactionPoolChanges(hash, []);
        assert(!changes.synced);
    });

    it('randomIndexes()', async () => {
        const random = await server.randomIndexes([1, 2, 3], 3);
        assert(random.length === 3);
        for (const rnd of random) {
            assert(rnd.outputs.length === 3);
        }
    });

    it('rawSync()', async () => {
        const sync = await server.rawSync(
            undefined,
            0,
            undefined,
            true,
            10
        );
        assert(sync.blocks.length === 10);
    });

    it('submitTransaction()', async () => {
        const txn = '010001026404d48008fff717d2872294b71e51b8304ed711c0fe240a2614610cc0380a5d0b8b13e2652e6c062fbb' +
            '056b7f1f015a027b2288942d52247932af36dc1d722da61f296089015b83d591f5a71afafa948021015af0c037fcfe8' +
            'c50f1e11876c98338fe664c85bc11cd696bc04c988b5669deda96a4299dd9cb471795d079da82e25827badcd79400b3' +
            '94e7c51b67c662d0fc03204a3967aa2bc90708c97cc0370597ad9e154dc7d418ab71b981f8bb805cc603bde2fcb1025' +
            'bb8b7a04e5e5168cebd724c920fcbb3399210543db9cf7ef9440fa0f11f5a2ea908da1f60f359ab2af2f79783b21113' +
            '62260fc8d562b268dd350dcb07941d179f34cfd43a3b8d689db6ff453fce4e987a537a528a80f011217e0460434e52d' +
            'a411e8760b10c34a3b63236eb966273a26a3ad3fc7a863a3b6bc508b16cc7763b28743f4ba5a9711e95eeb95762aa6e' +
            '9c79725170d42fc8968dcd051d2eef49e1726db2fd92e76c47455efff52fc0b473899acaff169316f9654802';

        /* We know this test will fail as this txn is no longer valid */
        await server.submitTransaction(txn)
            .then(() => assert(false))
            .catch(() => assert(true));
    });

    it('submitBlock()', async () => {
        const block = '0400850d6b0dcd9aee8adc27ddf2c0102cc7985d006bd7ca057d09313c6afe9f34580000829de8e10500000000' +
            '00000000000000000000000000000000000000000000000000000000000000000100000000230321000000000000000' +
            '000000000000000000000000000000000000000000000000000018ee14501ffe6e045050202e9567859b844305a8c33' +
            'd36d7a31ac29a78b233dc00de39878c77e4b639d23b4f403024f44e842ba4d0aaade34ac03940da2dc6f8ae146f6948' +
            'a8b240db947a661f3c280f104026d11bea76123efc53ab8e233252486c6bfb1cd499823d383a22711405cc6346580ea' +
            '30027b64b9e6c9922387a1343d22c8040ae4a1b787ed7f3bfbeac92ba1b8356175fe80897a023cfa03f1fc506eb7971' +
            '16baa22f4d63425f2137fb9c1e3116f1ab5b6e0a6d54aeb01011f8b6c0e5635716d6446867cdc4dba0006989ec5440e' +
            'f4804a44727bf713a2c702c800000000000000000000000000000000000000000000000000000000000000000000000' +
            '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000' +
            '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000' +
            '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000' +
            '0000000000000000000000000000000000000000000002baa8def39990827a71965b84d61be5d7db6a6270428d8e48d' +
            '8eb8015d43f65f0e189e52e3fe9f0da5b04fed64effc070e1b97e32cb5445a4434a70eda8c6572f';

        /* We know this test will fail as this block won't work */
        await server.submitBlock(block)
            .then(() => assert(false))
            .catch(() => assert(true));
    });

    it('transaction({hash})', async function () {
        if (!is_explorer) {
            return this.skip();
        }

        const hash = 'bdcbc8162dc1949793c1c6d0656ac60a6e5a3c505969b18bdfa10360d1c2909d';
        const txn = await server.transaction(hash);

        const expectedBlock = 'ea531b1af3da7dc71a7f7a304076e74b526655bc2daf83d9b5d69f1bc4555af0';
        const expectedPublicKey = '7d812f35cfff8bc6b5d118944d6476c73495f5c2de3f6a923f3510661646ac9d';

        assert(txn.block.hash === expectedBlock && txn.meta.publicKey === expectedPublicKey);
    });

    it('rawTransaction({hash})', async function () {
        if (!is_explorer) {
            return this.skip();
        }

        const expected_blob = '013201ff0a06010279a78987dd1e771524a5ad4fb7b05cc591f2786cbade5244c3b1c6f' +
            '5cebdf54d1e028ea944735448b57ffacd5c39b1a8077da6b442c56a597d79c469f1c10f5918dbc80102efb31a' +
            'bbb1479f33eab2f6a9e9a347a75ff966b270303163a18864c6d29382e980f10402a77b76ae03cd068e514ded0' +
            '20301107667fe21e984de6f5af24ab09f89662a7ea0f736023c099cb84669fc57f65aa8154b7ff683cbbd31f7' +
            'f0963601a2f5a02eb1137d5880897a0266e2c2153e0d954073cf4b48c23b16c922dc7b346093571a9dd1c265d' +
            'a08473b21017d812f35cfff8bc6b5d118944d6476c73495f5c2de3f6a923f3510661646ac9d';
        const hash = 'bdcbc8162dc1949793c1c6d0656ac60a6e5a3c505969b18bdfa10360d1c2909d';
        const txn = await server.rawTransaction(hash);
        assert(txn === expected_blob);
    });

    it('transactionPool()', async function () {
        if (!is_explorer) {
            return this.skip();
        }

        await server.transactionPool();
    });

    it('rawTransactionPool()', async function () {
        if (!is_explorer) {
            return this.skip();
        }

        await server.rawTransactionPool()
            .then(() => assert(false))
            .catch(() => this.skip());
    });

    it('transactionStatus()', async () => {
        const status = await server.transactionsStatus([
            'bdcbc8162dc1949793c1c6d0656ac60a6e5a3c505969b18bdfa10360d1c2909d',
            'bdcbc8162dc1949793c1c6d0656ac60a6e5a3c505969b18bdfa10360d1c2909c'
        ]);
        assert(status.notFound.length === 1 && status.inBlock.length === 1);
    });

    it('sync()', async () => {
        const sync = await server.sync();
        assert(sync.blocks.length !== 0 && !sync.synced);
    });
});

describe('TurtleCoind >= 1.0.0', function () {
    this.timeout(60000);

    let is_explorer = false;

    const server = new TurtleCoind('localhost');

    before('check()', async function () {
        try {
            const result = await server.info();

            if (result.version.major < 1) {
                this.skip();
            }

            is_explorer = (result.explorer) ? result.explorer : false;
        } catch (e) {
            this.skip();
        }
    });

    it('block({hash})', async function () {
        if (!is_explorer) {
            return this.skip();
        }

        const hash = '7fb97df81221dd1366051b2d0bc7f49c66c22ac4431d879c895b06d66ef66f4c';
        const prevHash = '0000000000000000000000000000000000000000000000000000000000000000';
        const block = await server.block(hash);
        assert(block.hash === hash);
        assert(block.prevHash === prevHash);
    });

    it('block({height})', async function () {
        if (!is_explorer) {
            return this.skip();
        }

        const hash = '7fb97df81221dd1366051b2d0bc7f49c66c22ac4431d879c895b06d66ef66f4c';
        const prevHash = '0000000000000000000000000000000000000000000000000000000000000000';
        const block = await server.block(0);
        assert(block.hash === hash);
        assert(block.prevHash === prevHash);
    });

    it('rawBlock({hash})', async function () {
        if (!is_explorer) {
            return this.skip();
        }

        const expected_blob = '0100000000000000000000000000000000000000000000000000000000000000000000' +
            '46000000010a01ff000188f3b501029b2e4c0281c0b02e7c53291a94d1d0cbff8883f8024f5142ee494ffbbd' +
            '088071210142694232c5b04151d9e4c27d31ec7a68ea568b19488cfcb422659a07a0e44dd500';
        const hash = '7fb97df81221dd1366051b2d0bc7f49c66c22ac4431d879c895b06d66ef66f4c';
        const block = await server.rawBlock(hash);
        assert(block.blob === expected_blob);
    });

    it('rawBlock({height})', async function () {
        if (!is_explorer) {
            return this.skip();
        }

        const expected_blob = '0100000000000000000000000000000000000000000000000000000000000000000000' +
            '46000000010a01ff000188f3b501029b2e4c0281c0b02e7c53291a94d1d0cbff8883f8024f5142ee494ffbbd' +
            '088071210142694232c5b04151d9e4c27d31ec7a68ea568b19488cfcb422659a07a0e44dd500';
        const block = await server.rawBlock(0);
        assert(block.blob === expected_blob);
    });

    it('blockCount()', () => {
        return server.blockCount();
    });

    it('blockHeaders()', async function () {
        if (!is_explorer) {
            return this.skip();
        }

        const headers = await server.blockHeaders(100);
        assert(headers.length === 31);
    });

    it('blockTemplate()', async () => {
        const wallet = 'TRTLv1pacKFJk9QgSmzk2LJWn14JGmTKzReFLz1RgY3K9Ryn77' +
            '83RDT2TretzfYdck5GMCGzXTuwKfePWQYViNs4avKpnUbrwfQ';
        const reserve = 8;
        const template = await server.blockTemplate(wallet, reserve);
        assert(template.difficulty > 0);
    });

    it('fee()', async () => {
        const fee = await server.fee();

        assert(fee);
    });

    it('indexes()', async () => {
        const indexes = await server.indexes(0, 10);

        assert(indexes.length === 11);
    });

    it('height()', async () => {
        await server.height();
    });

    it('info()', async () => {
        await server.info();
    });

    it('lastBlock()', async () => {
        const header = await server.lastBlock();
        assert(header.depth === 0);
    });

    it('peers()', async () => {
        await server.peers();
    });

    it('transactionPoolChanges()', async () => {
        const hash = 'ea531b1af3da7dc71a7f7a304076e74b526655bc2daf83d9b5d69f1bc4555af0';
        const changes = await server.transactionPoolChanges(hash, []);
        assert(!changes.synced);
    });

    it('randomIndexes()', async () => {
        const random = await server.randomIndexes([1, 2, 3], 3);
        assert(random.length === 3);
        for (const rnd of random) {
            assert(rnd.outputs.length === 3);
        }
    });

    it('rawSync()', async () => {
        const sync = await server.rawSync(
            undefined,
            0,
            undefined,
            true,
            10
        );
        assert(sync.blocks.length === 10);
    });

    it('submitTransaction()', async () => {
        const txn = '010001026404d48008fff717d2872294b71e51b8304ed711c0fe240a2614610cc0380a5d0b8b13e2652e6c062fbb' +
            '056b7f1f015a027b2288942d52247932af36dc1d722da61f296089015b83d591f5a71afafa948021015af0c037fcfe8' +
            'c50f1e11876c98338fe664c85bc11cd696bc04c988b5669deda96a4299dd9cb471795d079da82e25827badcd79400b3' +
            '94e7c51b67c662d0fc03204a3967aa2bc90708c97cc0370597ad9e154dc7d418ab71b981f8bb805cc603bde2fcb1025' +
            'bb8b7a04e5e5168cebd724c920fcbb3399210543db9cf7ef9440fa0f11f5a2ea908da1f60f359ab2af2f79783b21113' +
            '62260fc8d562b268dd350dcb07941d179f34cfd43a3b8d689db6ff453fce4e987a537a528a80f011217e0460434e52d' +
            'a411e8760b10c34a3b63236eb966273a26a3ad3fc7a863a3b6bc508b16cc7763b28743f4ba5a9711e95eeb95762aa6e' +
            '9c79725170d42fc8968dcd051d2eef49e1726db2fd92e76c47455efff52fc0b473899acaff169316f9654802';

        /* We know this test will fail as this txn is no longer valid */
        await server.submitTransaction(txn)
            .then(() => assert(false))
            .catch(() => assert(true));
    });

    it('submitBlock()', async () => {
        const block = '0400850d6b0dcd9aee8adc27ddf2c0102cc7985d006bd7ca057d09313c6afe9f34580000829de8e10500000000' +
            '00000000000000000000000000000000000000000000000000000000000000000100000000230321000000000000000' +
            '000000000000000000000000000000000000000000000000000018ee14501ffe6e045050202e9567859b844305a8c33' +
            'd36d7a31ac29a78b233dc00de39878c77e4b639d23b4f403024f44e842ba4d0aaade34ac03940da2dc6f8ae146f6948' +
            'a8b240db947a661f3c280f104026d11bea76123efc53ab8e233252486c6bfb1cd499823d383a22711405cc6346580ea' +
            '30027b64b9e6c9922387a1343d22c8040ae4a1b787ed7f3bfbeac92ba1b8356175fe80897a023cfa03f1fc506eb7971' +
            '16baa22f4d63425f2137fb9c1e3116f1ab5b6e0a6d54aeb01011f8b6c0e5635716d6446867cdc4dba0006989ec5440e' +
            'f4804a44727bf713a2c702c800000000000000000000000000000000000000000000000000000000000000000000000' +
            '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000' +
            '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000' +
            '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000' +
            '0000000000000000000000000000000000000000000002baa8def39990827a71965b84d61be5d7db6a6270428d8e48d' +
            '8eb8015d43f65f0e189e52e3fe9f0da5b04fed64effc070e1b97e32cb5445a4434a70eda8c6572f';

        /* We know this test will fail as this block won't work */
        await server.submitBlock(block)
            .then(() => assert(false))
            .catch(() => assert(true));
    });

    it('transaction({hash})', async function () {
        if (!is_explorer) {
            return this.skip();
        }

        const hash = 'bdcbc8162dc1949793c1c6d0656ac60a6e5a3c505969b18bdfa10360d1c2909d';
        const txn = await server.transaction(hash);

        const expectedBlock = 'ea531b1af3da7dc71a7f7a304076e74b526655bc2daf83d9b5d69f1bc4555af0';
        const expectedPublicKey = '7d812f35cfff8bc6b5d118944d6476c73495f5c2de3f6a923f3510661646ac9d';

        assert(txn.block.hash === expectedBlock && txn.meta.publicKey === expectedPublicKey);
    });

    it('rawTransaction({hash})', async function () {
        if (!is_explorer) {
            return this.skip();
        }

        const expected_blob = '013201ff0a06010279a78987dd1e771524a5ad4fb7b05cc591f2786cbade5244c3b1c6f' +
            '5cebdf54d1e028ea944735448b57ffacd5c39b1a8077da6b442c56a597d79c469f1c10f5918dbc80102efb31a' +
            'bbb1479f33eab2f6a9e9a347a75ff966b270303163a18864c6d29382e980f10402a77b76ae03cd068e514ded0' +
            '20301107667fe21e984de6f5af24ab09f89662a7ea0f736023c099cb84669fc57f65aa8154b7ff683cbbd31f7' +
            'f0963601a2f5a02eb1137d5880897a0266e2c2153e0d954073cf4b48c23b16c922dc7b346093571a9dd1c265d' +
            'a08473b21017d812f35cfff8bc6b5d118944d6476c73495f5c2de3f6a923f3510661646ac9d';
        const hash = 'bdcbc8162dc1949793c1c6d0656ac60a6e5a3c505969b18bdfa10360d1c2909d';
        const txn = await server.rawTransaction(hash);
        assert(txn === expected_blob);
    });

    it('transactionPool()', async function () {
        if (!is_explorer) {
            return this.skip();
        }

        await server.transactionPool();
    });

    it('rawTransactionPool()', async function () {
        if (!is_explorer) {
            return this.skip();
        }

        await server.rawTransactionPool();
    });

    it('transactionStatus()', async () => {
        const status = await server.transactionsStatus([
            'bdcbc8162dc1949793c1c6d0656ac60a6e5a3c505969b18bdfa10360d1c2909d',
            'bdcbc8162dc1949793c1c6d0656ac60a6e5a3c505969b18bdfa10360d1c2909c'
        ]);
        assert(status.notFound.length === 1 && status.inBlock.length === 1);
    });

    it('sync()', async () => {
        const sync = await server.sync();
        assert(sync.blocks.length !== 0 && !sync.synced);
    });
});

describe('WalletAPI', async function () {
    this.timeout(60000);

    const randomFilename = () => (Math.random() * 100000000).toString() + '.wallet';

    const newFilename = randomFilename();
    const password = 'password';

    const server = new WalletAPI(process.env.WALLETAPI_PASSWORD || 'password');

    describe('New Wallet', () => {
        let skipped = false;

        before('create()', async function () {
            if (!await server.alive()) {
                skipped = true;
                this.skip();
            }

            await server.create(newFilename, password);
        });

        after('close()', async function () {
            if (!skipped) {
                await server.close();
            }
        });

        it('addresses()', async () => {
            const response = await server.addresses();
            assert(response.length === 1);
        });

        it('balance()', async () => {
            const response = await server.balance();
            assert(response.unlocked === 0 && response.locked === 0);
        });

        it('balance(address)', async () => {
            const response = await server.addresses();
            const res = await server.balance(response[0]);
            assert(res.unlocked === 0 && res.locked === 0);
        });

        it('balances()', async () => {
            const response = await server.balances();
            assert(response.length === 1);
        });

        it('createAddress()', async () => {
            await server.createAddress();
        });

        it('createIntegratedAddress()', async () => {
            const address = 'TRTLuwuGiuyWSkTTKQy8jGj4Dfr5typGJFoaHKzKGdu79S79x1Mk5biMnWUFXRtr9K' +
                'FmDAQxUuh9j3WretzXaZzGVPyzRQSM8Wu';
            const paymentId = '1DE6276D400098659A6B065D6422959FB15C83A260D32E59095987E91FF01B05';
            const response = await server.createIntegratedAddress(address, paymentId);

            const expected = 'TRTLuxjg8MT9Q9z9a1oMTmAa6thQCcjQV94iS9Cmu3tVAZzKnMkf5iAAQDKkcBhon' +
                'A9QgkMdUZe6tAQN9gQUkhqh9EsSQLNDoX9WSkTTKQy8jGj4Dfr5typGJFoaHKzKGdu79S79x1Mk5biMn' +
                'WUFXRtr9KFmDAQxUuh9j3WretzXaZzGVPyzRUXFtwc';

            assert(response === expected);
        });

        it('deleteAddress()', async () => {
            const wallet = await server.createAddress();
            if (wallet.address) {
                await server.deleteAddress(wallet.address);
            }
        });

        it.skip('deletePreparedTransaction()');

        it('getNode()', async () => {
            const response = await server.getNode();
            assert(response.daemonHost && response.daemonPort);
        });

        it('importAddress()', async () => {
            await server.importAddress(
                'c1493e663cec48cb1db70fc6bb3e04be1eec99f398f5a7c343aa67f159419e09');
        });

        it('importDeterministic()', async () => {
            await server.importDeterministic(5);
        });

        it('keys()', async () => {
            await server.keys();
        });

        it('keys(address)', async () => {
            const address = await server.primaryAddress();
            const res = await server.keys(address) as WalletAPITypes.IWallet;
            assert(res.privateSpendKey && res.publicSpendKey);
        });

        it('keysMnemonic()', async () => {
            const address = await server.primaryAddress();
            const mnemonic = await server.keysMnemonic(address);
            assert(mnemonic.length !== 0);
        });

        it('newDestination()', () => {
            const dst = server.newDestination(
                'TRTLuwuGiuyWSkTTKQy8jGj4Dfr5typGJFoaHKzKGdu79S79x1Mk5biMnWUFXRtr9KFmDAQxUuh9j3WretzXaZzGVPyzRQSM8Wu',
                1.15
            );
            assert(dst.amount === 115);
        });

        it.skip('prepareAdvanced()');

        it.skip('prepareBasic()');

        it('primaryAddress()', async () => {
            await server.primaryAddress();
        });

        it('reset()', async () => {
            await server.reset();
        });

        it('save()', async () => {
            await server.save();
        });

        it.skip('sendAdvanced()');

        it.skip('sendBasic()');

        it.skip('sendFusionAdvanced()');

        it.skip('sendFusionBasic()');

        it.skip('sendPrepared()');

        it('setNode()', async () => {
            await server.setNode('localhost', 11898);
        });

        it('status()', async () => {
            const response = await server.status();
            assert(!response.isViewWallet && response.peerCount);
        });

        it.skip('transactionByHash()');

        it.skip('transactionPrivateKey()');

        it('transactions()', async () => {
            const response = await server.transactions();
            assert(response.length === 0);
        });

        it('transactionsByAddress()', async () => {
            const address = await server.primaryAddress();
            const response = await server.transactionsByAddress(address);
            assert(response.length === 0);
        });

        it('unconfirmedTransactions()', async () => {
            const response = await server.unconfirmedTransactions();
            assert(response.length === 0);
        });

        it('unconfirmedTransactions(address)', async () => {
            const address = await server.primaryAddress();
            const response = await server.unconfirmedTransactions(address);
            assert(response.length === 0);
        });

        it('validateAddress()', async () => {
            const address = 'TRTLuxQ2jXVeGrQNKFgAvGc4GifYEcrLC8UWEebLMjfNDt7JXZhAyzChdAthLTZHWYPKRgeimfJqzHBmv' +
                'hwUzYgPAHML6SRXjoz';
            const response = await server.validateAddress(address);
            assert(response.actualAddress === address);
        });

        it('fail validateAddress()', async () => {
            const address = 'TRTLuxQ2jXVeGrQNKFgAvGc4GifYEcrLC8UWEebLMjfNDt7JXZhAyzChdAthLTZHWYPKRgeimfJqzHBmv' +
                'hwUzYgPAHML6SRXjoq';

            /* We expect this test to fail as this address is invalid */
            await server.validateAddress(address)
                .then(() => assert(false))
                .catch(() => assert(true));
        });
    });

    describe('Import Wallet', () => {
        describe('By Keys', () => {
            let skipped = false;

            before('check', async function () {
                if (!await server.alive()) {
                    skipped = true;
                    this.skip();
                }
            });

            after('close()', async function () {
                if (!skipped) {
                    await server.close();
                }
            });

            it('importKey()', async () => {
                await server.importKey(
                    randomFilename(),
                    password,
                    '84271126f661ae8cdb06de981d69fd7fc7b14aaa9af53766440836b5c52da900',
                    'dd8d88c0d391db824190fc83dfb516d35ea1d7ec8ce0e7b6bf48566fcc7d1a0f'
                );
            });
        });

        describe('By Seed', () => {
            let skipped = false;

            before('check', async function () {
                if (!await server.alive()) {
                    skipped = true;
                    this.skip();
                }
            });

            after('close()', async function () {
                if (!skipped) {
                    await server.close();
                }
            });

            it('importSeed()', async () => {
                await server.importSeed(
                    randomFilename(),
                    password,
                    'five aphid spiders obnoxious wolf library love anxiety nephew mumble apex tufts ' +
                    'ladder hyper gasp hobby android segments sneeze flying royal betting vixen abnormal obnoxious'
                );
            });
        });

        describe('View Only', () => {
            let skipped = false;

            before('check', async function () {
                if (!await server.alive()) {
                    skipped = true;
                    this.skip();
                }
            });

            after('close()', async function () {
                if (!skipped) {
                    await server.close();
                }
            });

            it('importViewOnly', async () => {
                await server.importViewOnly(
                    randomFilename(),
                    password,
                    '84271126f661ae8cdb06de981d69fd7fc7b14aaa9af53766440836b5c52da900',
                    'TRTLuxQ2jXVeGrQNKFgAvGc4GifYEcrLC8UWEebLMjfNDt7JXZhAyzChdAthLTZH' +
                    'WYPKRgeimfJqzHBmvhwUzYgPAHML6SRXjoz'
                );
            });

            it('importViewAddress()', async () => {
                await server.importViewAddress(
                    'adda22257c435d09697d6ffe5841f4e70a32900a0f08e69f75875761a9c524f6');
            });
        });
    });

    describe('Open Wallet', () => {
        let skipped = false;

        before('check', async function () {
            if (!await server.alive()) {
                skipped = true;
                this.skip();
            }
        });

        after('close()', async function () {
            if (!skipped) {
                await server.close();
            }
        });

        it('open()', async () => {
            await server.open(newFilename, password);
        });
    });
});
