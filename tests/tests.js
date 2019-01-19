// Copyright (c) 2018, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const assert = require('assert')

const TurtleCoinUtils = require('../').CryptoNote
const config = require('../config.json')
const cnUtil = new TurtleCoinUtils(config)

const rawSeed = 'dd0c02d3202634821b4d9d91b63d919725f5c3e97e803f3512e52fb0dc2aab0c'
const rawMnemonic = 'teeming taken piano ramped vegan jazz earth enjoy suture quick lied awkward ferry python often exotic cube hexagon ionic joyous cage abnormal hull jigsaw lied'

console.log('')
console.log('In Seed:          ', rawSeed)
console.log('In Mnemonic:      ', rawMnemonic)

const outputMnemonic = cnUtil.createAddressFromSeed(rawSeed)
const outputSeed = cnUtil.createAddressFromMnemonic(rawMnemonic)

console.log('')
console.log('Out Seed:         ', outputSeed.seed)
console.log('Out Mnemonic:     ', outputMnemonic.mnemonic)

assert(rawSeed === outputSeed.seed)
assert(rawMnemonic === outputMnemonic.mnemonic)

const testAddress = 'TRTLv3nzumGSpRsZWxkcbDhiVEfy9rAgX3X9b7z8XQAy9gwjB6cwr6BJ3P52a6TQUSfA4eXf3Avwz7W89J4doLuigLjUzQjvRqX'
const testAddressRaw = '9df6ee01f71e440f9a5aab08dbdab0f4f36bba813660a0600f109b1371dc53be33f23c99f0ba225065e1b9c2e43165b3e41f10fcb768853126dfa7e612a3df2deb332492cc073a66'

console.log('')
console.log('In  Test Address: ', testAddress)
console.log('In  Raw Address:  ', testAddressRaw)

const outputAddress = cnUtil.encodeRawAddress(testAddressRaw)
const outputRaw = cnUtil.decodeAddress(testAddress)

console.log('')
console.log('Out Test Address: ', outputAddress)
console.log('Out Raw Address:  ', outputRaw.rawAddress)

assert(testAddressRaw === outputRaw.rawAddress)
assert(testAddress === outputAddress)

const newAddress = cnUtil.createNewAddress(testAddress, 'english')
const newAddressByKey = cnUtil.createAddressFromKeys(newAddress.spend.privateKey, newAddress.view.privateKey)

console.log('')
console.log('New Address: ', newAddress.address)
console.log('New Address Keys: ', newAddress.spend.privateKey, newAddress.view.privateKey)
console.log('New Address By Keys: ', newAddressByKey.address)

assert(newAddress.address === newAddressByKey.address)

const testPrivateKey = '4a078e76cd41a3d3b534b83dc6f2ea2de500b653ca82273b7bfad8045d85a400'
const testPublicKey = '7849297236cd7c0d6c69a3c8c179c038d3c1c434735741bb3c8995c3c9d6f2ac'

const derivedPublicKey = cnUtil.privateKeyToPublicKey(testPrivateKey)

console.log('')
console.log('In Test Private Key: ', testPrivateKey)
console.log('In Test Public Key: ', testPublicKey)
console.log('Out Derived Public Key: ', derivedPublicKey)

assert(derivedPublicKey === testPublicKey)

const mnemonicAddressByKey = cnUtil.createAddressFromKeys(outputSeed.spend.privateKey, outputSeed.view.privateKey)

console.log('')
console.log('In Mnemonic Private Spend Key: ', outputSeed.spend.privateKey)
console.log('In Mnemonic Private View Key: ', outputSeed.view.privateKey)
console.log('In Mnemonic Seed: ', mnemonicAddressByKey.mnemonic)

assert(mnemonicAddressByKey.mnemonic === outputSeed.mnemonic)

const nonMnemonicPrivateSpendKey = '7a4a9a5b174e5713433fb5735a35b8fe8ce5bf411d5f6a587002e455a2b33703'
const nonMnemonicPrivateViewKey = '3c986487d9b85e979e4f30eca56558874d2792ec73326d7aa0b2cf24c099ad0f'
const nonMnemonicAddressByKey = cnUtil.createAddressFromKeys(nonMnemonicPrivateSpendKey, nonMnemonicPrivateViewKey)

console.log('')
console.log('In Non Mnemonic Private Spend Key: ', nonMnemonicPrivateSpendKey)
console.log('In Non Mnemonic Private View Key: ', nonMnemonicPrivateViewKey)
console.log('In Non Mnemonic Seed: ', nonMnemonicAddressByKey.mnemonic)

assert(nonMnemonicAddressByKey.mnemonic === null)

var amount = 1234567
console.log('')
console.log('Creating outputs for amount %s to %s', amount, newAddress.address)
var transfers = cnUtil.createTransactionOutputs(newAddress.address, amount)
var amounts = []
transfers.forEach((elem) => {
  amounts.push(elem.amount)
})
console.log('Created %s outputs [%s]', transfers.length, amounts.join(','))

assert(transfers.length === 7)

amount = 101010
console.log('')
console.log('Creating outputs for amount %s to %s', amount, newAddress.address)
transfers = cnUtil.createTransactionOutputs(newAddress.address, amount)
amounts = []
transfers.forEach((elem) => {
  amounts.push(elem.amount)
})
console.log('Created %s outputs [%s]', transfers.length, amounts.join(','))

assert(transfers.length === 3)

console.log('')
console.log('Validating prefix detection for alternate chain...')
console.log('')

const athenaAddress = 'athena28QHa49cTHWjRLYN1XW46Xj8D2mPiu7bovQ67V4z1C84R16VSJvbHmD2Yfq5Yvw5GKVTnfuS5pX3LXH3LNPezfLhhe5Lc27'
const athenaPrefix = { prefix: 'ca9f97c218',
  base58: 'athena',
  decimal: 6581243850,
  hexadecimal: '18845cfca' }

const calculatedPrefix = cnUtil.decodeAddressPrefix(athenaAddress)

console.log('Athena Address: ', athenaAddress)
console.log('Athena Calculated Prefix: ', calculatedPrefix.base58)
assert(athenaPrefix.base58 === calculatedPrefix.base58)

console.log('Athena Calculated Raw Prefix: ', calculatedPrefix.decimal)
assert(athenaPrefix.decimal === calculatedPrefix.decimal)

const newAthenaAddress = cnUtil.encodeAddress(newAddress.view.publicKey, newAddress.spend.publicKey, false, athenaPrefix.decimal)
const newAthenaAddressByKey = cnUtil.createAddressFromKeys(newAddress.spend.privateKey, newAddress.view.privateKey, athenaPrefix.decimal)

console.log('New Athena Address: ', newAthenaAddress)
console.log('New Athena Address By Keys: ', newAthenaAddressByKey.address)

assert(newAthenaAddress === newAthenaAddressByKey.address)

console.log('')
console.log('Verifying output discovery...')
console.log('')

/* For reference, this is transaction fd9b0767c18752610833a8138e4bbb31d02b29bf50aa3af1557e2974a45c629c */
const txPublicKey = '3b0cc2b066812e6b9fcc42a797dc3c723a7344b604fd4be0b22e06254ff57f94'

const walletPrivateViewKey = '6968a0b8f744ec4b8cea5ec124a1b4bd1626a2e6f31e999f8adbab52c4dfa909'

/* Not using this right now, but will probably need this later to test something else */
const walletPrivateSpendKey = 'd9d555a892a85f64916cae1a168bd3f7f400b6471c7b12b438b599601298210b'

const walletPublicSpendKey = '854a637b2863af9e8e8216eb2382f3d16616b3ac3e53d0976fbd6f8da6c56418'

const derivation = cnUtil.generateKeyDerivation(txPublicKey, walletPrivateViewKey)

const ourOutputIndex = 2

/* (First output) This is not our output. */
const publicSpendKey1 = cnUtil.underivePublicKey(derivation, 0, 'aae1b90b4d0a7debb417d91b7f7aa8fdfd80c42ebc6757e1449fd1618a5a3ff1')

console.log('Derived public spend key: ', publicSpendKey1)
console.log('Our public spend key: ', walletPublicSpendKey)

assert(publicSpendKey1 !== walletPublicSpendKey)

/* (Third output) This is our output. */
const publicSpendKey2 = cnUtil.underivePublicKey(derivation, ourOutputIndex, 'bb55bef919d1c9f74b5b52a8a6995a1dc4af4c0bb8824f5dc889012bc748173d')

console.log('Derived public spend key: ', publicSpendKey2)
console.log('Our public spend key: ', walletPublicSpendKey)

assert(publicSpendKey2 === walletPublicSpendKey)

console.log('')
console.log('Verifying key images are correctly created...')
console.log('')

const [keyImage] = cnUtil.generateKeyImage(txPublicKey, walletPrivateViewKey, walletPublicSpendKey, walletPrivateSpendKey, ourOutputIndex)
const [keyImagePrimitive] = cnUtil.generateKeyImagePrimitive(walletPublicSpendKey, walletPrivateSpendKey, ourOutputIndex, derivation)

console.log('Generated key image: ', keyImage)
console.log('Generated key image (primitive): ', keyImagePrimitive)

assert(keyImage === keyImagePrimitive)

const expectedKeyImage = '5997cf23543ce2e05c327297a47f26e710af868344859a6f8d65683d8a2498b0'

console.log('Expected key image: ', expectedKeyImage)

assert(keyImage === expectedKeyImage)
