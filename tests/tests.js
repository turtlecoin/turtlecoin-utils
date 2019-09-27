// Copyright (c) 2018-2019, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const assert = require('assert')
const Crypto = require('../').Crypto
const describe = require('mocha').describe
const it = require('mocha').it
const TurtleCoinCrypto = new Crypto()
const TurtleCoinUtils = require('../').CryptoNote
const cnUtil = new TurtleCoinUtils(require('../config.json'))

console.log('Using Crypto: %s', TurtleCoinCrypto.type)

describe('Cryptography', () => {
  it('Generate Random Keys', () => {
    const [err, keys] = TurtleCoinCrypto.generateKeys()

    assert(!err && (keys))
  })

  it('Check Key - Public Key', () => {
    const key = '7849297236cd7c0d6c69a3c8c179c038d3c1c434735741bb3c8995c3c9d6f2ac'
    const isValid = TurtleCoinCrypto.checkKey(key)

    assert(isValid === true)
  })

  it('Check Key - Private Key', () => {
    const key = '4a078e76cd41a3d3b534b83dc6f2ea2de500b653ca82273b7bfad8045d85a400'
    const isValid = TurtleCoinCrypto.checkKey(key)

    assert(isValid === false)
  })

  it('Tree Hash', () => {
    const expectedTreeHash = 'dff9b4e047803822e97fb25bb9acb8320648954e15a6ddf6fa757873793c535e'
    const [err, treeHash] = TurtleCoinCrypto.tree_hash([
      'b542df5b6e7f5f05275c98e7345884e2ac726aeeb07e03e44e0389eb86cd05f0',
      '1b606a3f4a07d6489a1bcd07697bd16696b61c8ae982f61a90160f4e52828a7f',
      'c9fae8425d8688dc236bcdbc42fdb42d376c6ec190501aa84b04a4b4cf1ee122',
      '871fcd6823f6a879bb3f33951c8e8e891d4043880b02dfa1bb3be498b50e7578'
    ])
    assert(treeHash === expectedTreeHash && !err)
  })

  it('Tree Branch', () => {
    const expectedTreeBranch = [
      'f49291f9b352701d97dffad838def8cefcc34d1e767e450558261b161ab78cb1',
      '1b606a3f4a07d6489a1bcd07697bd16696b61c8ae982f61a90160f4e52828a7f'
    ]

    const [err, treeBranch] = TurtleCoinCrypto.tree_branch([
      'b542df5b6e7f5f05275c98e7345884e2ac726aeeb07e03e44e0389eb86cd05f0',
      '1b606a3f4a07d6489a1bcd07697bd16696b61c8ae982f61a90160f4e52828a7f',
      'c9fae8425d8688dc236bcdbc42fdb42d376c6ec190501aa84b04a4b4cf1ee122',
      '871fcd6823f6a879bb3f33951c8e8e891d4043880b02dfa1bb3be498b50e7578'
    ])

    assert(!err)
    assert.deepStrictEqual(treeBranch, expectedTreeBranch)
  })

  const testdata = '0100fb8e8ac805899323371bb790db19218afd8db8e3755d8b90f39b3d5506a9abce4fa912244500000000ee8146d49fa93ee724deb57d12cbc6c6f3b924d946127c7a97418f9348828f0f02'

  const algos = [
    { name: 'CryptoNight Fast Hash', func: 'cn_fast_hash', hash: 'b542df5b6e7f5f05275c98e7345884e2ac726aeeb07e03e44e0389eb86cd05f0' },
    { name: 'CryptoNight v0', func: 'cn_slow_hash_v0', hash: '1b606a3f4a07d6489a1bcd07697bd16696b61c8ae982f61a90160f4e52828a7f' },
    { name: 'CryptoNight v1', func: 'cn_slow_hash_v1', hash: 'c9fae8425d8688dc236bcdbc42fdb42d376c6ec190501aa84b04a4b4cf1ee122' },
    { name: 'CryptoNight v2', func: 'cn_slow_hash_v2', hash: '871fcd6823f6a879bb3f33951c8e8e891d4043880b02dfa1bb3be498b50e7578' },
    { name: 'CryptoNight Lite v0', func: 'cn_lite_slow_hash_v0', hash: '28a22bad3f93d1408fca472eb5ad1cbe75f21d053c8ce5b3af105a57713e21dd' },
    { name: 'CryptoNight Lite v1', func: 'cn_lite_slow_hash_v1', hash: '87c4e570653eb4c2b42b7a0d546559452dfab573b82ec52f152b7ff98e79446f' },
    { name: 'CryptoNight Lite v2', func: 'cn_lite_slow_hash_v2', hash: 'b7e78fab22eb19cb8c9c3afe034fb53390321511bab6ab4915cd538a630c3c62' },
    { name: 'CryptoNight Dark v0', func: 'cn_dark_slow_hash_v0', hash: 'bea42eadd78614f875e55bb972aa5ec54a5edf2dd7068220fda26bf4b1080fb8' },
    { name: 'CryptoNight Dark v1', func: 'cn_dark_slow_hash_v1', hash: 'd18cb32bd5b465e5a7ba4763d60f88b5792f24e513306f1052954294b737e871' },
    { name: 'CryptoNight Dark v2', func: 'cn_dark_slow_hash_v2', hash: 'a18a14d94efea108757a42633a1b4d4dc11838084c3c4347850d39ab5211a91f' },
    { name: 'CryptoNight Dark Lite v0', func: 'cn_dark_lite_slow_hash_v0', hash: 'faa7884d9c08126eb164814aeba6547b5d6064277a09fb6b414f5dbc9d01eb2b' },
    { name: 'CryptoNight Dark Lite v1', func: 'cn_dark_lite_slow_hash_v1', hash: 'c75c010780fffd9d5e99838eb093b37c0dd015101c9d298217866daa2993d277' },
    { name: 'CryptoNight Dark Lite v2', func: 'cn_dark_lite_slow_hash_v2', hash: 'fdceb794c1055977a955f31c576a8be528a0356ee1b0a1f9b7f09e20185cda28' },
    { name: 'CryptoNight Turtle v0', func: 'cn_turtle_slow_hash_v0', hash: '546c3f1badd7c1232c7a3b88cdb013f7f611b7bd3d1d2463540fccbd12997982' },
    { name: 'CryptoNight Turtle v1', func: 'cn_turtle_slow_hash_v1', hash: '29e7831780a0ab930e0fe3b965f30e8a44d9b3f9ad2241d67cfbfea3ed62a64e' },
    { name: 'CryptoNight Turtle v2', func: 'cn_turtle_slow_hash_v2', hash: 'fc67dfccb5fc90d7855ae903361eabd76f1e40a22a72ad3ef2d6ad27b5a60ce5' },
    { name: 'CryptoNight Turtle Lite v0', func: 'cn_turtle_lite_slow_hash_v0', hash: '5e1891a15d5d85c09baf4a3bbe33675cfa3f77229c8ad66c01779e590528d6d3' },
    { name: 'CryptoNight Turtle Lite v1', func: 'cn_turtle_lite_slow_hash_v1', hash: 'ae7f864a7a2f2b07dcef253581e60a014972b9655a152341cb989164761c180a' },
    { name: 'CryptoNight Turtle Lite v2', func: 'cn_turtle_lite_slow_hash_v2', hash: 'b2172ec9466e1aee70ec8572a14c233ee354582bcb93f869d429744de5726a26' },
    { name: 'Chukwa', func: 'chukwa_slow_hash', hash: 'c0dad0eeb9c52e92a1c3aa5b76a3cb90bd7376c28dce191ceeb1096e3a390d2e' }
  ]

  algos.forEach((algo) => {
    it(algo.name, () => {
      const [err, hash] = TurtleCoinCrypto[algo.func](testdata)
      assert(algo.hash === hash && !err)
    })
  })
})

describe('Wallets', () => {
  const rawSeed = 'dd0c02d3202634821b4d9d91b63d919725f5c3e97e803f3512e52fb0dc2aab0c'
  const rawMnemonic = 'teeming taken piano ramped vegan jazz earth enjoy suture quick lied awkward ferry python often exotic cube hexagon ionic joyous cage abnormal hull jigsaw lied'
  const testAddress = 'TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX'
  const testAddressRaw = '9df6ee01f71e440f9a5aab08dbdab0f4f36bba813660a0600f109b1371dc53be33f23c99f0ba225065e1b9c2e43165b3e41f10fcb768853126dfa7e612a3df2deb332492cc073a66'

  describe('Mnemonics', () => {
    it('address from mnemonic phrase has matching seed', () => {
      const outputSeed = cnUtil.createAddressFromMnemonic(rawMnemonic)
      assert(rawSeed === outputSeed.seed)
    })

    it('address from seed has matching mnemonic phrase', () => {
      const outputMnemonic = cnUtil.createAddressFromSeed(rawSeed)
      assert(rawMnemonic === outputMnemonic.mnemonic)
    })

    it('address from keys and seed have matching mnemonic phrases', () => {
      const outputSeed = cnUtil.createAddressFromMnemonic(rawMnemonic)
      const mnemonicAddressByKey = cnUtil.createAddressFromKeys(outputSeed.spend.privateKey, outputSeed.view.privateKey)
      assert(mnemonicAddressByKey.mnemonic === outputSeed.mnemonic)
    })

    it('cannot create mnemonic phrase from non-deterministic keys', () => {
      const nonMnemonicPrivateSpendKey = '7a4a9a5b174e5713433fb5735a35b8fe8ce5bf411d5f6a587002e455a2b33703'
      const nonMnemonicPrivateViewKey = '3c986487d9b85e979e4f30eca56558874d2792ec73326d7aa0b2cf24c099ad0f'
      const nonMnemonicAddressByKey = cnUtil.createAddressFromKeys(nonMnemonicPrivateSpendKey, nonMnemonicPrivateViewKey)
      assert(nonMnemonicAddressByKey.mnemonic === null)
    })
  })

  describe('Base58 Encoding', () => {
    const outputAddress = cnUtil.encodeRawAddress(testAddressRaw)
    const outputRaw = cnUtil.decodeAddress(testAddress)

    it('encode a raw address', () => {
      assert(testAddress === outputAddress)
    })

    it('decode an address', () => {
      assert(testAddressRaw === outputRaw.rawAddress)
    })
  })

  describe('Wallet Creation', () => {
    const newAddress = cnUtil.createNewAddress(testAddress, 'english')
    const newAddressByKey = cnUtil.createAddressFromKeys(newAddress.spend.privateKey, newAddress.view.privateKey)

    it('create new address', () => {
      assert(newAddress)
    })

    it('create new address from keys', () => {
      assert(newAddress.address === newAddressByKey.address)
    })
  })

  describe('Message Signing', () => {
    it('sign a string message', () => {
      const signature = cnUtil.signMessage('this is a test message', 'TRTLuwWQ7dBCWnm3rwdLmtUbzMnJ3bJy4G851T184W8gf2f9zrsdC3rPLxKmtG5rmFfa91uXDYRUkYKZvrKNXzXqfKmVvSYVXkx', 'd4c7e338d7efe0468b6498dd2f96620fad6b103d1a70dea76bab4de9db9c0a0b')

      assert((signature))
    })

    it('sign an object-based message', () => {
      const signature = cnUtil.signMessage({ mac: 'deadbeef', amount: 10 }, 'TRTLuwWQ7dBCWnm3rwdLmtUbzMnJ3bJy4G851T184W8gf2f9zrsdC3rPLxKmtG5rmFfa91uXDYRUkYKZvrKNXzXqfKmVvSYVXkx', 'd4c7e338d7efe0468b6498dd2f96620fad6b103d1a70dea76bab4de9db9c0a0b')

      assert((signature))
    })

    it('verify signature - string message', () => {
      const isValid = cnUtil.verifyMessageSignature('this is a test message', 'TRTLuwWQ7dBCWnm3rwdLmtUbzMnJ3bJy4G851T184W8gf2f9zrsdC3rPLxKmtG5rmFfa91uXDYRUkYKZvrKNXzXqfKmVvSYVXkx', '9ef44c5b3ffe86e31b126e284227953bdb78714b40af4e43c66d4e4a72a3150096b2b8e6a974e5fbc5a6ed700381f5356e6f80ad0ca62b020382f37b00d4d401')

      assert(isValid)
    })

    it('verify signature - object-based message', () => {
      const isValid = cnUtil.verifyMessageSignature({ mac: 'deadbeef', amount: 10 }, 'TRTLuwWQ7dBCWnm3rwdLmtUbzMnJ3bJy4G851T184W8gf2f9zrsdC3rPLxKmtG5rmFfa91uXDYRUkYKZvrKNXzXqfKmVvSYVXkx', 'f111faac9365c62eaf016364e9db6ec50060f379e9b0e480ba1dc41993c3380f55a6f4b10bb3e1d18ee0aa139157ee657a451746e5f6358199a7425e4f65af0c')

      assert(isValid)
    })
  })

  describe('Keys', () => {
    const testPrivateKey = '4a078e76cd41a3d3b534b83dc6f2ea2de500b653ca82273b7bfad8045d85a400'
    const testPublicKey = '7849297236cd7c0d6c69a3c8c179c038d3c1c434735741bb3c8995c3c9d6f2ac'

    it('create public key from private key', () => {
      const derivedPublicKey = cnUtil.privateKeyToPublicKey(testPrivateKey)
      assert(derivedPublicKey === testPublicKey)
    })
  })

  describe('Prefix Detection', () => {
    const athenaAddress = 'athena28QHa49cTHWjRLYN1XW46Xj8D2mPiu7bovQ67V4z1C84R16VSJvbHmD2Yfq5Yvw5GKVTnfuS5pX3LXH3LNPezfLhhe5Lc27'
    const athenaPrefix = {
      prefix: 'ca9f97c218',
      base58: 'athena',
      decimal: 6581243850,
      hexadecimal: '18845cfca'
    }
    const calculatedPrefix = cnUtil.decodeAddressPrefix(athenaAddress)

    it('detects proper Base58 prefix', () => {
      assert(athenaPrefix.base58 === calculatedPrefix.base58)
    })

    it('detects proper decimal prefix', () => {
      assert(athenaPrefix.decimal === calculatedPrefix.decimal)
    })

    it('encodes an existing address with an alternate prefix', () => {
      const newAddress = cnUtil.createNewAddress(testAddress, 'english')
      const newAthenaAddress = cnUtil.encodeAddress(newAddress.view.publicKey, newAddress.spend.publicKey, false, athenaPrefix.decimal)
      const newAthenaAddressByKey = cnUtil.createAddressFromKeys(newAddress.spend.privateKey, newAddress.view.privateKey, athenaPrefix.decimal)
      assert(newAthenaAddress === newAthenaAddressByKey.address)
    })
  })
})

describe('SubWallets', () => {
  const baseWallet = cnUtil.createAddressFromSeed('dd0c02d3202634821b4d9d91b63d919725f5c3e97e803f3512e52fb0dc2aab0c')
  const subWallets = [
    cnUtil.createSubWalletFromPrivateSpendKey(baseWallet.spend.privateKey, 0),
    cnUtil.createSubWalletFromPrivateSpendKey(baseWallet.spend.privateKey, 1),
    cnUtil.createSubWalletFromPrivateSpendKey(baseWallet.spend.privateKey, 2),
    cnUtil.createSubWalletFromPrivateSpendKey(baseWallet.spend.privateKey, 64),
    cnUtil.createSubWalletFromPrivateSpendKey(baseWallet.spend.privateKey, 65)
  ]

  it('creates subwallets', () => {
    assert((subWallets[0]) && (subWallets[1]) && (subWallets[2]) && (subWallets[3]) && (subWallets[4]))
  })

  it('Subwallet #0 matches base wallet', () => {
    assert(baseWallet.spend.privateKey, subWallets[0].spend.privateKey)
  })

  it('Subwallet #0 does not match any other subwallets', () => {
    for (var i = 1; i < subWallets.length; i++) {
      assert(subWallets[0].spend.privateKey !== subWallets[i].spend.privateKey)
    }
  })

  it('Subwallet #1 does not match any other subwallets', () => {
    for (var i = 2; i < subWallets.length; i++) {
      assert(subWallets[1].spend.privateKey !== subWallets[i].spend.privateKey)
    }
  })

  it('Subwallet #2 does not match any other subwallets', () => {
    for (var i = 3; i < subWallets.length; i++) {
      assert(subWallets[2].spend.privateKey !== subWallets[i].spend.privateKey)
    }
  })

  it('Subwallet #64 does not match any other subwallets', () => {
    for (var i = 4; i < subWallets.length; i++) {
      assert(subWallets[3].spend.privateKey !== subWallets[i].spend.privateKey)
    }
  })

  it('Subwallet #2 not found from Subwallet #1', () => {
    var key = cnUtil.cnFastHash(subWallets[1].spend.privateKey)
    assert(key !== subWallets[2].spend.privateKey)
    assert(cnUtil.scReduce32(key) !== subWallets[2].spend.privateKey)
  })

  it('Subwallet #64 not found from Subwallet #1', () => {
    var key = subWallets[1].spend.privateKey
    for (var i = 0; i < 63; i++) {
      key = cnUtil.cnFastHash(key)
    }
    assert(key !== subWallets[3].spend.privateKey)
    assert(cnUtil.scReduce32(key) !== subWallets[3].spend.privateKey)
  })

  it('Subwallet #65 not found from Subwallet #1', () => {
    var key = subWallets[1].spend.privateKey
    for (var i = 0; i < 64; i++) {
      key = cnUtil.cnFastHash(key)
    }
    assert(key !== subWallets[4].spend.privateKey)
    assert(cnUtil.scReduce32(key) !== subWallets[4].spend.privateKey)
  })

  it('Subwallet #64 not found from Subwallet #2', () => {
    var key = subWallets[2].spend.privateKey
    for (var i = 0; i < 62; i++) {
      key = cnUtil.cnFastHash(key)
    }
    assert(key !== subWallets[3].spend.privateKey)
    assert(cnUtil.scReduce32(key) !== subWallets[3].spend.privateKey)
  })

  it('Subwallet #65 not found from Subwallet #2', () => {
    var key = subWallets[2].spend.privateKey
    for (var i = 0; i < 63; i++) {
      key = cnUtil.cnFastHash(key)
    }
    assert(key !== subWallets[4].spend.privateKey)
    assert(cnUtil.scReduce32(key) !== subWallets[4].spend.privateKey)
  })
})

describe('Transactions', () => {
  describe('Create Transaction Outputs', () => {
    it('Amount: 1234567', () => {
      const amount = 1234567
      const transfers = cnUtil.createTransactionOutputs('TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX', amount)
      assert(transfers.length === 7)
    })

    it('Amount: 101010', () => {
      const amount = 101010
      const transfers = cnUtil.createTransactionOutputs('TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX', amount)
      assert(transfers.length === 3)
    })

    it('Amount: 500000000000', () => {
      const amount = 500000000000
      const transfers = cnUtil.createTransactionOutputs('TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX', amount)
      assert(transfers.length === 5)
    })

    it('Amount: 555555555555', () => {
      const amount = 955555555555
      const transfers = cnUtil.createTransactionOutputs('TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX', amount)
      assert(transfers.length === 20)
    })
  })

  describe('Output Discovery', () => {
    const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94'
    const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909'
    const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418'
    const derivation = cnUtil.generateKeyDerivation(txPublicKey, walletPrivateViewKey)
    const ourOutputIndex = 2

    it('derive public spend key (no match)', () => {
      const publicSpendKey1 = cnUtil.underivePublicKey(derivation, 0, 'aae1b90b4d0a7debb417d91b7f7aa8fdfd80c42ebc6757e1449fd1618a5a3ff1')
      assert(publicSpendKey1 !== walletPublicSpendKey)
    })

    it('derive public spend key (match)', () => {
      const publicSpendKey2 = cnUtil.underivePublicKey(derivation, ourOutputIndex, 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d')
      assert(publicSpendKey2 === walletPublicSpendKey)
    })
  })

  describe('Key Images', () => {
    const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94'
    const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909'
    const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b'
    const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418'
    const derivation = cnUtil.generateKeyDerivation(txPublicKey, walletPrivateViewKey)
    const ourOutputIndex = 2
    const expectedKeyImage = '5997cf23543ce2e05c327297a47f26e710af868344859a6f8d65683d8a2498b0'

    const [keyImage] = cnUtil.generateKeyImage(txPublicKey, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey, ourOutputIndex)
    const [keyImagePrimitive] = cnUtil.generateKeyImagePrimitive(walletPublicSpendKey, walletPrivateSpendKey, ourOutputIndex, derivation)

    it('generate keyImage', () => {
      assert(keyImage === expectedKeyImage)
    })

    it('generate keyImage primitive', () => {
      assert(keyImagePrimitive === expectedKeyImage)
    })
  })

  describe('Input Offsets', () => {
    const idx = ['53984', '403047', '1533859', '1595598']
    const expectedIdx = ['53984', '349063', '1130812', '61739']
    const calculatedRelativeOffsets = cnUtil.absoluteToRelativeOffsets(idx)
    const calculatedAbsoluteOffsets = cnUtil.relativeToAbsoluteOffsets(calculatedRelativeOffsets)

    it('absolute to relative offsets', () => {
      assert(JSON.stringify(expectedIdx) === JSON.stringify(calculatedRelativeOffsets))
    })

    it('relative to absolute offsets', () => {
      assert(JSON.stringify(idx) === JSON.stringify(calculatedAbsoluteOffsets))
    })
  })

  describe('Transaction Creation', () => {
    it('generate a transaction', () => {
      const madeOutputs = cnUtil.createTransactionOutputs('TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX', 90)
      const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94'
      const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909'
      const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b'
      const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418'

      const fakeInput = {
        index: 2,
        key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
        amount: 100,
        globalIndex: 1595598
      }

      const madeInput = cnUtil.isOurTransactionOutput(txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey)

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
      ]]

      try {
        cnUtil.createTransaction(madeOutputs, [madeInput], randomOutputs, 3, 10, '', 0)
      } catch (e) {
        assert(e === false)
      }
    })

    it('generate a transaction with arbitrary data payload', () => {
      const madeOutputs = cnUtil.createTransactionOutputs('TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX', 90)
      const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94'
      const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909'
      const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b'
      const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418'

      const fakeInput = {
        index: 2,
        key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
        amount: 100,
        globalIndex: 1595598
      }

      const madeInput = cnUtil.isOurTransactionOutput(txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey)

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
      ]]

      const message = { msg: '001100010010011110100001101101110011', paradoxResolution: true }

      try {
        const tx = cnUtil.createTransaction(madeOutputs, [madeInput], randomOutputs, 3, 10, '', 0, message)

        const data = JSON.parse(Buffer.from(tx.transaction.extraData, 'hex').toString())

        assert.deepStrictEqual(message, data)
      } catch (e) {
        assert(e === false)
      }
    })

    it('fail to generate a transaction when output too large', () => {
      const madeOutputs = cnUtil.createTransactionOutputs('TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX', 90)
      const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94'
      const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909'
      const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b'
      const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418'

      madeOutputs[0].amount = 200000000000

      const fakeInput = {
        index: 2,
        key: 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d',
        amount: 100,
        globalIndex: 1595598
      }

      const madeInput = cnUtil.isOurTransactionOutput(txPublicKey, fakeInput, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey)

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
      ]]

      try {
        cnUtil.createTransaction(madeOutputs, [madeInput], randomOutputs, 3, 10, '', 0)
        assert(false === true)
      } catch (e) {
        assert(e)
      }
    })
  })
})

describe('Blocks', () => {
  const Block = require('../').Block
  const BlockTemplate = require('../').BlockTemplate

  describe('Structures', () => {
    const BlockTemplateSample = require('./template.json')
    const genesisBlockRaw = '010000000000000000000000000000000000000000000000000000000000000000000046000000010a01ff000188f3b501029b2e4c0281c0b02e7c53291a94d1d0cbff8883f8024f5142ee494ffbbd088071210142694232c5b04151d9e4c27d31ec7a68ea568b19488cfcb422659a07a0e44dd500'
    const miningBlob = '0100b5f9abe605b4318c1249164393f7b9d691e60aba81ca9bbffb9e0b23e6b01c93d9c621ab80000000004b27c162bc89b0bdfa0db8b5c99977943caf754bb6181d8e1bafc6af2ab0b0bb01'

    it('deserializes and reserializes block template', () => {
      const testBlock = new Block(BlockTemplateSample.blocktemplate)
      assert(BlockTemplateSample.blocktemplate === testBlock.blob)
    })

    it('deserializes and serializes block', () => {
      const testBlock = new Block(genesisBlockRaw)
      assert(genesisBlockRaw === testBlock.blob)
    })

    it('calculates mining blob', () => {
      const testBlockTemplate = new BlockTemplate(BlockTemplateSample)
      const convertedTemplate = testBlockTemplate.convert()
      assert(convertedTemplate.hashingBlob === miningBlob)
    })

    it('merges blocks', () => {
      const testBlockTemplate = new BlockTemplate(BlockTemplateSample)
      const mergedBlobResult = testBlockTemplate.construct(0x641c0000)
      const expectedMergedBlob = '0500b4318c1249164393f7b9d691e60aba81ca9bbffb9e0b23e6b01c93d9c621ab800100b5f9abe605b4318c1249164393f7b9d691e60aba81ca9bbffb9e0b23e6b01c93d9c621ab80641c00000101000000230321008a7f7239a53ead2db2fc1062a898c1af301e919e2f26e13a568176ba7f1a0e1f01b9fe5801ff91fe58070802959f9d01c4cbd664e7c937687e7ae847f75745614ba4a11a6f5c0b25a5ca42c314026840ba5dc6c84a533d005f0a6f9758c4eb4d19bffa3b4a73547596dac17b7d169003022f88b7b85f42c789721e7ee44bded4b6e1e48f7fb9bb73dc87cda264adf06a54f02e02175cea7cf09b914749c650b9321678d3f0e4390cad20ac6896be7ac14ba4f31ab0ea01021192fdc86fd815642850c0f50bc11df8ba1d39581d2c0642aa83f72f1c3fb22580ea3002c28a03fb9b3b7f6e4f9cdf2e74e93c8282580d8134722302b9978cdc3a35f39980897a02a4978ee1742da6f77791f065326922ff8c713687d2b52215ce7911b08922a7602901296929051bf0b258b717ffdca80c8b0822063c9d3f70f0dbed9b3f2e0aca2fa1020600000000000012f6b48f1800c368e046252e50165620fbb155176d17ddfdb98fd3227237760cf579af90593ec64a4a5549bd219969dc9aa1aac2dc3eab529c90b2f8c20221f99f02bdfb9a7efb5e5e85b710ef442b3cc82431173db142947a4f755a22f45915e5f2d53027a4aee505305c7cde822f960578417779ef71c1c8b611e95f1643fd125a39df66f40ce82794c9debc342381f26763c80968f8bf8e5378b433c583a6078348457ebe6ad61e5487ac3bebe22e03c46d9c894a511561ffbe9612809c17207493941d607b152f4ce193f828085ee8afcc0a351a9cecac0f01b2729df67af831637f76a8430848d86beb643df918af6cc554a8d0b42899671ee02cfbe64905b4458647a90a50aa307be48f3db57ff7f5446926ee70cee0c0cf7ad9021de727b2f97b5e2f0fd0103b24725d0c11ddd876de27a7b837bdd43eb4d9ca479883ad2dcd853ece92e6a7544b24e44051411e6b913760b9d997ca986985b92d51ccbc5708f0cd93c0ce2d1aea46a6744cc81a3df394cd099518cb3c3a5fa43e187c9d72bc3a245256fa60b450411b56d2258d4001b6133f58a5d48af0cc12af652c202b3c9de3f426026500c493c075340ca713a49843db16bda542fd76fb597914e1c975a70d12971baf70b8f7f6f452fd669f3cc00d0a0f36a3312f7c51cadf24cac9c24841eeaa742b5d1e74a750e5763afbd2a75e341edb4439801ac665dd0a3b16cc648a651546c7a3633f0a0274bb3815d6bda05e12fb7cbb908ceb582590a84a30ba6043178279343f5107713390b8e2ca2a8723ee7e5855c6af674bbd9b5a'
      assert(mergedBlobResult.blob === expectedMergedBlob)
    })
  })

  describe('Hashing', () => {
    const blocks = [
      { block: '010000000000000000000000000000000000000000000000000000000000000000000046000000010a01ff000188f3b501029b2e4c0281c0b02e7c53291a94d1d0cbff8883f8024f5142ee494ffbbd088071210142694232c5b04151d9e4c27d31ec7a68ea568b19488cfcb422659a07a0e44dd500', hash: '7fb97df81221dd1366051b2d0bc7f49c66c22ac4431d879c895b06d66ef66f4c', pow: 'c47674de70b0f4b4dafcd5b3e423ee301de6c16093e57e93c7997c28c18a1b92' },
      { block: '0100b483aed1057fb97df81221dd1366051b2d0bc7f49c66c22ac4431d879c895b06d66ef66f4c5f59fbb6012901ff01060202c88b97a816870f3179e4f963d2c3876ab28cbd685776e67af79294f4072bedb31e02db599739f69f2590687a5247508745254c04aa4e367866a91bc79bea9c456857c801021f46687138e0b9d29be92fe8d6ee8ea46c4dc9e57b050554039e7b3fc38712c580f10402fbd7a33c704ede0403a134fbcdf23bd3c74ffee8929aa0e6c81f08e2bad4718ca0f736028490517006f93c79bf19edaa2edde725bc3b1cb2b2e5422287c8c20ad1550e2880897a0243a264e0e9ef291c8bf6310e98adfd52a42eeaea791d2f4eb2304a181a3270d72101bcdd0d175a90ce8514f6832833461afec5c5e4d373400a5783b8b66ae38d59e000', hash: '8c9738f961a278486f27ce214d1e4d67e08f7400c8b38fe00cdd571a8d302c7d', pow: '5dc80c7f5b2266396999f746105ec6550b25f3d87b1eb52c0c05c5777d2e8392' },
      { block: '02008c9738f961a278486f27ce214d1e4d67e08f7400c8b38fe00cdd571a8d302c7d0000b483aed10500000000000000000000000000000000000000000000000000000000000000004948e0db010000000023032100c65b39cd7039298b9694e6178a5a55364ca7b7cb1f4fb35b388a1bd5e4825ea3012a01ff0206020227ea00051423f6aace07448a2eb0eb4e8ae4006299c74a536ce8f2682069751a1e026eed7794fc693bfe1ba83b5e72a3277607a7e20c8c2ab1d5a6b951bd6be1e170c8010258d9f4894ce20ca17b214f1680a870677a0824a4dad75a12d4a06ba4db94060780f10402269f6c470b756eaaa7fd8fd3c56bef281714d82b1eb48877a6faadd77448b1ffa0f736022542809be833811cca2457bc677a909b64f101b1369a086e2448ba3f4f2198cf80897a02dfd6722b4bf027c5bc72885360a8e50ee2be4215d0dc17c9834cc84ab1ba6ac32101ead62bb586940d823e1a83e141340bc301be99c49f38c9847f6d1b7e0653d2b600', hash: '2ef060801dd27327533580cfa538849f9e1968d13418f2dd2535774a8c494bf4', pow: 'b771c7fe88088b77651b3513deda116b80cf8c31236e090cafd5d60275146c8a' },
      { block: '03002ef060801dd27327533580cfa538849f9e1968d13418f2dd2535774a8c494bf40000b483aed1050000000000000000000000000000000000000000000000000000000000000000455b91ef0100000000230321009935291e2efc4565b0673cf18d1d4f33a4e5d18d86b26ceb2f577beb1dc3406f012b01ff03060102c5e55545994dbcc3b31efd8f777bafa0cad9e4f02971bbe69ef90abdc170dfe91e0295a4d62f2135b414437182009787171d9c27fa473f901cc569725e085b9e0f12c8010218779d15ab8e8da072470bd36ca052e6043451672c26d37e54b4d5bf50b9d42f80f1040216f65d51d576c1e452846da20dfedc42a26b7bb7fb8e2af919c380bc6cd759a7a0f73602ded1b8199cc98e413ebb22333c0a9681f1a26f3b1f2aee3c0129f50afafdcc7c80897a02384c3d8166770d32f9e61769b4f0aa8716ad7dacae24a631f5283d68158d33e621010ada647cf3319792b664ac3d01fc88c4b7df7aa3266da8895fe3dd33c7d6676b00', hash: '3ac40c464986437dafe9057f73780e1a3a6cd2f90e0c5fa69c5caab80556a68a', pow: 'a05b313e45a8f265d7fd88d9ea588d876a9802a2f0358914a23c7c0136a33b04' },
      { block: '03003ac40c464986437dafe9057f73780e1a3a6cd2f90e0c5fa69c5caab80556a68a0000b683aed10500000000000000000000000000000000000000000000000000000000000000004adf3dd2010000000023032100743b609f508fd60bafbe7b01a3bd3915bbca5a306f453c133b8d2a99722cb585012c01ff04060102a4c328c97ba559a9bd9341a5499bfb1b1b053423b417174ef239db2be9e85b261e02dd1f0ea9176d8f292119b403687c9958193d15d0d16ae91c6ee799bcafd026c6c80102723cc40778b0bacb0c5103eec244c948a0b5322feda932b8040848358c0ae5e680f10402fe91b1c79a8eeb14605142227a45a47fb99815c8d806b9c54264bbe6ba67838ea0f73602e382cff75fe1190458773b5b7e1c7b2ab1183f18859878b9e71de78f1e608d4880897a02d3ded0758382ef5595626c38678a104775c9a0f6c709499a6322d153988b9ba72101316936a3fceb3c29f00cab5275d709dfac738648a3da75ae7720fdff4d1b19e000', hash: 'ac821fcb9e9c903abe494bbd2c8f3333602ebdb2f0a98519fc84899906a7f52b', pow: 'e03427d8a040555482976f6715976e67cf897e8f7c73bccc8d39b7286e6a0d00' },
      { block: '040045aaec7312e7b85ae1c05408fbf4fe88ee44a72b85d9c9277f17596a0da84bfd010097c2a5d60545aaec7312e7b85ae1c05408fbf4fe88ee44a72b85d9c9277f17596a0da84bfd8cd10200010100000023032100a24280b42fc645a74a2079a30edf754ac383ed76711e061b3ddd98977199ede401d9ae1501ffb1ae15060102eb87270abf0d0c6a181d667b18df2ed7b3e63668fef4bc0111c9182a2e5c9ff41402d75e91fa351a3c3b7d5e5cde7dce9e153a250d774c8f016f4ff4ed28cbd9b427c80102099c7669c14c63fee2644e8e7e2e3fb8d6e7cdbc022e95ec83790a7d9310dc46d08603028df7d2197f9973232c02185af8eba79d525a19c74ca7538cd46af287fbca195fa0f73602a0a1327dc8c7b19770030cf74092e4e8f72b75286945f44f7d2d9f00e5ab5b7680897a02bdc3bb642bf881ed6722c438dd9d6193a162fb525936d07e08a81a4f658c6b742b01db6449146a051995398f26a99b633890c934782ce72a5f3030dc42b4676a5363020800000002059f142546a2a2bb6a81f85b550cf0464688d9ed5a574d74a5ba6c6da1cb7de96dd6d7c93b82b3f82fca90d167697e0557840aebe2b20ab2ca3a53ac689a42d49d2f5ba12523b884357a1f8f11d575358353925b5e6ed574fc1791e58f757d8bc2578c908eb45da6b5a2328e42baf36be97b5054ab340e114603f91a2030418189d48fbeb789fbd871ab800dee6bf3e0eba1e47ee0e05924af8d19e2c91f00bebd6c83b588614ef32963f8863057048703a64d03240e607c029d70d2ffca887cd2f7a5d7443f4c2de847005df443b060524d1e2f88fcad78ff9ec6648f42a6a6b765c67bb0bfe5c736a919dc20101350aadda3a1f7b92d2bcaa0eb353e6e47343702c7cb923532d64ae5c5678e2be69985b3b949fb1833ee28ef638c1d209cf127bd16dfbe5e62563324c01528d41fe7a4bae138658181b5a3f7c30d9bb447d4c2bafaf712078e531bbd256c1ad3bfa35460f2d29ed8ee513ce615fe27066632623e88ffaffc90a7710da52a92a10b35df1fc4815bf6d35c740f8418461a37523fb959f97b432827d80401503bf47ed30129981b3ddb4ca68c0072bb93606f2d7c67879b2fa56c42c5393af5d5dda280feef8f8061353fab02a09cb38b59b29cb635fa3411dda747c6e0cac34e36b70e8bef2f639d0d633ce469205131510da612c6db4a1fd668c6498bd81c2db66826da4693c7b6c3164755204bee16757bfd37af99ff374dcfb2f1d0431bf21db8bf51e1d00ffe36e12bf3bf20fdcd35a0711d0133827583e913995ff12376c520f7c5d8f32f08f026443027ee267b8525b26c224fef0a112600edd08457f2d7df07c169ac593d4fcbb6cbac0c429b7c3916d516f4dea3bf8fc31269369dac5378c716c67b82c3135110e34d5d2c61166b1bdd5c4825aafb5836d578881d081de120ec99663323ad1a751773e7cdc1d0d5cf319edb5f4fe1077490db89a6060f115bb5001048c35e9a74a9ab45fa7baa595baaf5312c775ef446ca2a4e362b623ca580fcd1e59f9932facdf2e8775c24162b62a81d8b35b9a52eaf301d211e92d713060b9c65efb28e95fd2faec8b9b3649e2bd27a3b0778efeebb03e2b1b2b35a3232e674c35ba48898f5df10a364e2142ea15e3e85622a14682c1c713139dc609e6bbe4527be4ef474ab00c86f2f591ef4f84884e4e3a034021599d12cd14fa810137b4262501e02d5cf3c3556a62b4f1912c295bb1aa01feda6b726515d107fed26596a922b068171290474a3e61700830e882d59c02f8c04a6e7477b1af2db438a831472b2a5c39b24d1092f9d0e5a0f11445693661081be52869bfb20730f7f24cd851d303af253b2d113b966d64caa3bd05749e4b2941dfa53460ee4a74c3735655f5b5eac2e9521f417dd8a5a48ea1712ca3b61b2a88f009870e3d3611d90561499aff37bf1b77befe4c9ffa6fcea7289081524ddb929deb7d17e46d3da640d366e7be3b75e4465e85594805e75e2474decf3bbff0ca31591ce4d254799452b0a117e9258b57c917f50776b505e32dbf01d69cc435175fb188ec90db58239fa9b5f6d064ae00aff0d133b987c8638163b0c7c27dd96c2a4ff6af6a2166df60f8414488d184cee8b8681266f9113aa0b5fa61de3e0a3fc282500b29087d4737f36fdfacf3380ea902edea57ed75726ed92dbfd1661eb8510167193f7841f45e697b39169771c028cfb96672d44ddd7653f957863a3954c1124ed06ec314dad0675c1bc8046aabb90bf60ff7a23b9e4d1aaaa88089cf2f9c7066f77100d669e0012854e090fef570addf017fb9f1a6ac305916dee424488d5e491d3438fa777d9407d826c9a07334757ae4147a8eaa8518b19ae7b74ccd2d1eb5c0dee7a033978baadb4c0e8ab7aa03c47ce78c49aa1aa875633d6022f0b673bfc38e3c67ef2b51ae6e345815f597e7b42bb6aadc401bc23a6018e1910e21a65f03833189ce6e5bb237c1275f107a860e4526d66d97acae92a8cc5e5df41671f99c972c84c14af27ceca3764d0c1da6fbad378c6b56e0e2fdadb35c1700fb9a825b068d7aee660f16f02057d5d6c9b398010ec412dde146942b1c240be90494adde04308e4314c7c015faa28940d2cc6a5c0e99f3e2a5ff60c802a46ba27fb82cbef7e24043af228efd94dc12d680c51a48c2e010446196c2e254da9e10bcc7b2b5149f2d62c4cb735118c1feb6b4ee46ae2d1bd62563536575c544f1eb1f5aa7124783109919c6ba6a7efecb5f1ece475129ef9922d0dee841c5282bb6e9887254dc3944618604368099e13567e05e23cba76d1620fb33b8c47af75750b9d8d011319bf267de13c9c5e3fc0c7ec2e5f1bf26d2e7bdf0aa3d905b83876f6fdf788e4590421081e884aa6c0885a0d8aa60a9aeaf868a96d9b1022d7d53da2320b64f75b9ef86f3d180de260b7a544458fa0532705a37bc1b2b4dd8c80e520abc0e25bb6e09335f94c963a68dd6f005d87b4ac4e35619fd19717d7529d6a43e92a01c6a5a626240b2a15ecc5d593b744b7c6aac3c7ff0a978baa06b491c3e4a4fd9d8a05f1138304946d70894654adc1eed99274795036bc4e33fefba79791fe0899d05ce5dbeb67cd1f50f770e8de1b9fc2d3af1337ba2f49823d964dbc3685600a0e0508c0b3938e6eeb4087ea2815fdbbba43d522c07c06962addafbceb508d042e479de24d812fe75a53f52d36a9b053d10237c56a4010a1dc1a2f5282f7cb8c41d9572de7003c3ee3c2fc4fafe4f5d10911bb1f6d367d660bf65a2fd03bbc68ea143a51d312832bb16ffd0add9d6d2b0895a9f33c3cb5ee62aa9cc969a9034af73f00f84200821d13919921c23ec278a4219b5dd767347b694903ad407eb08f99490e4145ea8f082114c07930a7fad52c323e592fb2d7d0e53015a9aef1985ae75ad67b999434efb5f3f9dce25c66ec850640a12d4ba0390b633348073808c665d54ea65e2a2ca4cdc519ef7c921d90f7237c601c0d68cf9e8e830203ecfecd2d9ae4118b235a3ff990070ae0f1f67d071794ad2273e9951cca1c5e10cf4c999e409e21206e172d6ff3e96b652f9b545ab1851efd620ae1dadf99287d607bde39443e569d5cf90a714c5f7cc72a2260b636185fe0e35754300afde859c7f555f7993e138b6c70aa9e31181a067760f3bf397187882139597831', hash: '8f5c66c16672df146cb3f87b98bacca4236e812a9ef77fee6b53fbac24064257', pow: 'aad3691b189910385c28e3059caf90ffd59b53a89b8eeac55de80e760c000000' },
      { block: '0500fcab13ae0b430433292f9b164f7de8e2d2caaff6e9d6bc82d1c0c1c77a1d66260100d6a0d1e205fcab13ae0b430433292f9b164f7de8e2d2caaff6e9d6bc82d1c0c1c77a1d662633b0c3dc010100000023032100297edb5fdd48f84577660842669c987d25bd83642374199886cbfc3e4e78d44a01a99f4901ff819f49070402a2975cc08c184d221c40d2d14a14df86c0460cd6b1fa0af4dc2cddf5d591ced35a022af8e4cd46e23f7f31e205803f70560577cde0972981e98be19532d73816cb8ebc05020caf3c45e57dfaa0db15a6286c2d59f6599df516a90488bb41fb8352ff4b1b5c882702791aaee06868b3a837130ace69ad6ab50330371cf65b74782b97ee642f303757f0a20402be34547ccf220c7963b5315961685482c5bbab993dc1e77869c8d9c5deaae06580ea3002637995ccb18f7fe806ca253d4e5ca7262961e5d45995b0e5d1612688b20c14af80897a0217ca5563e2f020a48f128b0447a733636c0c4e0ff49848baf2aec48c1baa21b82b01b84f3f3be5f750959b14be5bffbc3f904d5e2f9ba302fb94028821cb5451563802080000000119b4415703e7e80f2fd9a3db2a75c6e01cbd9aff31ed609fb52d4837e50e942fe8e645aa53a21cf744edf3854a342cf1d20dfd9d269d1790c0f99630c925f8c8b5a98e03972901ced6052db4b6e8e8315d235df8a95bc1f737e608ca36c99a07fa01989013', hash: 'dd173a8c7f78e101f1bb2221b53bfb3f8017498fb36294f7af9f83159dfed31b', pow: 'f0d7f894b7c2c1aab4aca6f5c0ac3522abd07b6392bb313827643a0300000000' },
      { block: '0500ac7321caded24a7ca51aacf2a8395bb5d42207921c22be17f82eb53a2271bb850b0bd4a9c1e5059330ec585ef39e68554fd764860cd739a7f55e750733a01bf75cab0bcf692500a82d000001029f8e0f01ff818e0f02868298e73a02a0270275c455df54cbf63183722a42bce9712298240d8bba8e32e9f735e7da42f8acc5ab4102ae8d54c2c17d05c015f2452ae2d08784a5f1b81232b58611856af53ef6c96f21990101002d97816230888fdf9f2342bfaecd083d0ea834637b355ec734e203c30e3483021100000017f0110400000000000000000000032100043a2898114043d0a97fb7e98c184478053389d130e53121252609c6648ce4e10170f612462afb3036f1aaf187234a362161b459455729ab9704e7ba1b6ae61f2b7228151c14dcd396a8bec782608fd3ef452b4511e96fac238ac85a904a196bee090001e9b95501ffc1b955060802ec6fbfc404ca3a6fd81507ba1ba52bdd33c249a59d84f987af03be7be507939ed80402686743715b84dc455a6ec873d4badb21800c0d248c4666da75bc3bbbd22e8aa9c03e02f5d167e58799c2630919776c9afef3c43fdb49b179e66a9a5b7641709fea54bed086030207f92bfa570fafe4af045db82a4e2be673b93db26a00acbe1b55d5341c3aa13a80ea30029c8581d7dda7bb883d12f3f7391f183cc9223ff330aa29063f47156e6f312e3080897a025b18f50404513945c5dfd08d5391a5dbf60b7555dadc3209952169d979999f153401936efde8a9a11a4fcfc109314ab69c1ab356c2edc8bec0a3634f1e7b52ce5c1302110000000000d9110400000000000000000005248e6fdc2921fd5f4a35ccd18dcc6d748b5d30125bf47bd717ccdb35ab59dea895a059a4cbe61c46f76e88cec2436bade1ef60dcfedbbf445237b16506e124ea08e013043337c920796f4cf9776d5c1c98173ef2e99fbe08fd0ad9df80170bdd11b52abbb4aee93fca1a8db75eca1f15769b3cf0f1efb0407ac119837fe3de9de2a63e8b090f69a71c9edf278c40c37d971b06404ef4c380aae3e91090694eee', hash: 'ab3e530a46ca48220b29e04fe879d9415fb69384b0108aa9a3239a355a07458d', pow: '29d6ffea58e90391362481dd6f0c9d711bbfc778aee3798bcb1b777b00000000' },
      { block: '050001e1822b9b3badaef93046468e2af8c9a5987ab1daa7af67ce4d5c9b32dc88b30b0bc1c9f9e6051e0eba88e7725bf12ba6e2e9c6c90a3bd4fdf87786bce7d882cc1b8e6e31cdfacaaaaa410102b6d21001ff98d21002a4b2af813802030da8cfdb8a901c7002638c50ce5ffdfffd93a696adf8af054e0d459b626bc3c3e2fb9d3e029ee970bc6eb30635874040e96606b76fa8d11d83f9e1501610eb3b93ef476ece99010179cceedaca9daaca1a34822bda0b1f227d21bb7e79ab3e0b154a299a981a58b602110000005598b0b6e000000000000000000003210013947d83d1f19567fbd96ee799d30cb3f03df186594bde16b4ffe10da4ce5a4c016c90b23d1b64929c4a1feb8815950c5c776c95595af7fa14434d8a9b812fc92a7299b12db8025b98b1b623ace323b3f936dffe1eadfff1c03f845811ac1a24c8f1000188c75b01ffe0c65b0403024a9f3d528ae30cd2fded80d1b230492707dd1d061c563cfb557cfc19e0cdc689d086030291c127d1e174bd68108bb353cd249786881fc6453b23efd11c012edbc925257d80ea300292135ee96769f626943cfba205171185c96c96a6b2d5abc7e2ff1468b02bbe3480897a027789b25f7133d4ce91cfb27422dad5e15221317b9a04ed272f9f0a65cf88616734019f8fd8a6dbf36a2e7f35b11234fae5b2d3b5d77d51dd4fd7877e55f179e19df602110000000098b0b6e00000000000000000000380a31720ddd7dd06a46c73c3dc5bed3d32b21322e505c908ef73358f1221d7a873a8b3ba4a06154f32c2b29ed5f056df7415706d84a26bb7f546696eed5c98d817cba3ece47666bab7b20715583f994768961d3484fecd335ff930f6cf4cfae4', hash: '9771396c7b1efe85c51340e216481a1e7e5686d0e9be3cab42015add2841abb4', pow: '39044ddbc57c4a19a14db1f16bc107ef120ddd5d3bccc0646baf8b2200000000' },
      { block: '05009b5522ae9957a5b2ab402bd27e0f6bd00b723f6766f24fac359f7eb615eb5f780b0baebbd5e7050c0c13b39f25c6acdee4c2af656c1447daeee40c0f3ee673c3ebdc21eeeafd8873bdaa9201029db41101ffffb31102c7a9eaef36024dd4fd84736429878bb3fe834d7d9129b96391e52250d11bed84ee74c7639a0a86e7a0fc3c02bf007ec781a940b882ed83b912ab7946129aef098181d1ac3ac6aeb89ee29b1f990101da796c5020fdb4d6bf561474bb5977f94d52094168fa426e19364c9c23ed71c602110000008dca604e080000000000000000000321002040743ef5b7ce858df784fd355d5538b495ba6af88f5fd030758d554617e52a01534851b6f1c276fa603538b16b3a0238a5a8ab30c8dbe4b19b40c1c20f826cb872bdc5746454cda24471b2ff539192fba88c5f4d3eef995a8c7d556bda03edd1c60001d8cd5e01ffb0cd5e07010226985a5c0068948410222cda5743e16363e640a0ef2c4527d990f6eceb2ce8103c02ccd84de05b7c289317e3d34dbf251132c7c762f5baa66e228ef3c0127792196dbc05027cda310f1c41bb5a4eb43353b637caae883e9a264e422d0501f64f67b03308928827020b6a8a13ef7ec5b4812618d34513e35ca67f56c9104498da97810369177f6d4fc0b8020276f1cd96569520ddefc8e44d3c7bcf95a7cec9e8d68df57df30dec12670db4e980ea300267c3d999e7787ee02f417aff836c068ec610ad676c21682b710ac9750bc5039780897a02a1417c9063dadc400a158910e9084d1963515922cb35e56502a054fa4988cb5834017877cf0cbef600f8cb78ed078761736564f4d386909eb93da57daa357433013a021100000000ca604e0800000000000000000000', hash: 'c90be6e123d5a84e86287180bca1b5583104b80d037796fdf94a05cc39def650', pow: '84045f18b369818f4d24cc47bb77c675175f6d7490098df702f3786300000000' },
      { block: '05007c893d22fee5b9894c158acca55c77134b939327fe0feac215ebefdcb28b4c940c0c94988be80574fc5e458e23ca15510fc4f598b2ad887c836b9f348cad4a6f2122c1729d975de2cdbbbb0102e68a0c01ffd48a0c01decbf4d84402904ade8f5d73dfbe43634d63122f3510e0d6fe677b7f6b50311550226f5490f1790172abece908bfdd8bfe1488a9f09b1a1af448567f1a6fe47e69512aa9c3306cb8032101fec53a51adee8564f1b6d060457a1efb2e13ed47ab32d4d067ae4cebe780877f0321005c81f49d031482c23c5fd2b417af3724b7e91d030ddd112301aa24fdd964d0e5021000000024d9370d000000000000000000009b90b9f46f10401fc0eb152e2c011c1edef01f54ac73e7a51c8331ae80be9ffc01e7b16001ffbfb160070602409fac372611af6ccdc657d5ddc5a43957fbb83b9acbd07613bae92ec03c55265002a4144652bd5fa644f45a3cf9d1c62edbe268c407e1c9a3559f010ea33a238b7ec80102bce0ded1c3f778ca6342cfd1871cb914a88430c95fab37b5773b96b30acb13dcb817026f0e9bcbd52e70d6406fdeeb21a445cdf8cdc2c89fdb7de9ebf38303436269abc0b8020278a194eea6ff669a626aa22e09202792165191c7ce2e7b73a9a465641cd8854780ea3002a93226f81d09f415934f025ba020a2f22d7692843de852c50ad5425c13f9e43480897a022f86f589c5748c453fc72ceda220ab25de3b18aeea5a194dce49608ca5c7b4c13401f821c09f01164e23fa8c75c840934987eece909cb4929c13acdcc406035479490211000000000000000000000000000000000000', hash: '28f21b7f39e736e5e3fe3a9665ba03276fbb677f0a52524bb164e807cfc9abde', pow: '128fd7bdc760f8c1ee001738ae0903f90e91570bc110defa993e991700000000' },
      { block: '050060cb98d99969d134a55f89c13c36e3c9fe6579db219c22bb49056d98f05eec760b0baaf18fe805a96f08a3ffb8ef0abbb7421725eb5ef6f3064a309cfc3f4890f038aaccdad90544550028028f052a13d7c08069fc3175cfc6e9e04863127b22276a9291d49a5ba921e2085b02baf21101ff9cf21102fdcba39d3602e2d6771991fb81f468422f53995318ffd2c6bacf7b5a209df3a26ad030d67841af9f8ba03c02bfd8771443605f90d6b31530b7d08cb0023e6f3fd0bab505d4c939b9af8bb614a30101dfade3139169b90d73a3f22ac7b355d42a601bbaacc1450b41400be83b94bde5032100e52e1508b1a8c8baeab469bd392ced9b1d79ca7df66225ce05c6710d8ee22c41021b0000000000000000000000000abc51ca4a2e000000000000000000010de22ecadf5df4ed10e0bb4f319631d3c2240ca9f85d20ecdbb5dee1015b7aaf72f52f5102b31c1023d5519d777891ac68abc6dade0706ec24c52f7cdbf3cc51bb0001e7c56001ffbfc560070902cfa4dfe1870ab82478af67c4a9053edab50cb0a90e710dd9c76c653bd9c161130a02164c0e2e8e6cab4fbc51f128f7134d570aa7fc747e44b0532c4a357d9b9afda86402a10df923ea3f41bd9f977671b56e094b49082be2f37eea74aa02526951656f0db8170266286662b13eb95319249c28af61843bd81cd9ecbb804368584a6d5b7ac24967c0b80202d9689343b5923958f8485ad2e2512b973f06c8d3eb7b30fb7c25a03d04f7eefa80ea3002f38374d54bc6a7b737c926b07932c3463c31e90d40db2145509cc55f8ce8ad0380897a02785e176f3e718af0d19b7fc9648ce388c959814fd53dbf7dae0356f1e4d169416101da51e8e299dc61b694d42b4eb7c23ee03fffc9123d1d679735bfb031692d4cd4023e000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000051ca4a2e0000000000000000010e7e1c479cb227e0986df0e5b58aa55b6b98396a54f11b97f8a3df7bc86f26f3', hash: '37f42da37103a7664b02ddeba85aff087ae0bf2025aa1d620b5fde7ff1dd89ae', pow: '9c8b39e766cce817e7d188956f1058a48da1a2e2a79451dd24dc295900000000' },
      { block: '0600372c032536432cbb8e6977bbd53a8f6b7a35fdbeb05fff16f41cdfbae1cfc8da0100d28c99ec05372c032536432cbb8e6977bbd53a8f6b7a35fdbeb05fff16f41cdfbae1cfc8daaab46c1c010100000023032100e0f912cdd518ed49c9839b51700e6ea48686266a68ecf0d547f50bd0c31e563b018ce87101ffe4e771060302200cc4fbea3668fb1e9c9c5f542b5e54176569b00ea9f43180204d2da3e2c24ac80102678f20794f73409c93435e1acbb281a48d3bc1ac230b61cce7d1772d9058abfca8460274cb0245ff3a89d95ad6be544441edd577d851c8ee3b9b629d2a034921bcac87904e0292f287fbf0bade1462642bd986aea318aa212dcdeed1cc0f898b3820e6e85c0880ea30025bbbc7fd4bc48d0bd5dc7039692bb07c9e70167eeb66de2c766a96436505157180897a02835daa0dd160c2822b0e0ed4d1ea9782d7df29ed755f4ea8d67c3be2ec5828b42b0168de92073d653fff40b7acc7bf59620141e99e061ed2adfe09054fdb1c77e4480208000500095013d9d600', hash: '460af45c885f064a0f0b199c17f8d79409d498b0856ed43894fc62834ed299f3', pow: 'ae6d9c3df0d2e9e4db7beeab3df4e2e14f63c472dcd9a9903f0b0c7900000000' }
    ]

    blocks.forEach((block) => {
      const testBlock = new Block(block.block)

      describe('Test block v' + testBlock.majorVersion + '.' + testBlock.minorVersion + ' #' + testBlock.height, () => {
        it('serialization works', () => {
          assert(testBlock.blob === block.block)
        })

        it('hash works', () => {
          assert(testBlock.hash === block.hash)
        })

        it('PoW hash works', () => {
          assert(testBlock.longHash === block.pow)
        })
      })
    })
  })
})

describe('P2P Tests', () => {
  const LevinPacket = require('../').LevinPacket
  const samplePacket = '0121010101010101560000000000000001ea030000000000000100000001000000011101010101020101040c7061796c6f61645f646174610c080e63757272656e745f686569676874060fce1b0006746f705f69640a80ba6aee8fe65ea9ef3c1618d5598e546e1806fb9561f4d3b518af2a001cbd5e2b'

  const packet = new LevinPacket(samplePacket)

  it('serialization works', () => {
    assert(samplePacket === packet.blob)
  })
})
