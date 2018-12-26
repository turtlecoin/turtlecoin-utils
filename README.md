![image](https://user-images.githubusercontent.com/34389545/35821974-62e0e25c-0a70-11e8-87dd-2cfffeb6ed47.png)

#### Master Build Status
[![Build Status](https://travis-ci.org/turtlecoin/turtlecoin-utils.svg?branch=master)](https://travis-ci.org/turtlecoin/turtlecoin-utils)

# TurtleCoin Javascript Utilities

## Disclaimer

***Use of this code in its current state may lead to unexpected results***

This repository contains highly experimental code  with the goal of making it possible to interact with a daemon including wallet functionaity (sending/receiving transactions) without the need for `turtle-service` or `wallet-api` using Node.js. By using the code in this repo, you understand that some functions may not work, others may work but be untested, while others may upset you.

The best way to address such situations is to submit a Pull Request to resolve the issue you're running into.

## Installation

```bash
npm i git+https://github.com/turtlecoin/turtlecoin-utils
```

## Initialization

```javascript
const TurtleCoinUtils = require('turtlecoin-utils')
const coinUtils = new TurtleCoinUtils()
```

If initializing for a different CryptoNote project you can specify the configuration

```javascript
const TurtleCoinUtils = require('turtlecoin-utils')
const coinUtils = new TurtleCoinUtils({
  coinUnitPlaces: 8,
  addressPrefix: 6581243850
})
```

## Public Methods

#### createNewSeed([entropy])

Creates a new address seed using the provided entropy or if entropy is undefined, uses a randomly selected entropy source.

#### createNewAddress([entropy], [language], [addressPrefix])

Creates a new [address](#address) using the provided entropy, language (for the mnemonic), and address prefix if supplied.

#### createAddressFromSeed(seed, [language], [addressPrefix])

Creates a new [address](#address) using the provided seed, language (for the mnemonic), and address prefix if supplied.

#### createAddressFromMnemonic(mnemonic, [language], [addressPrefix])

Creates a new [address](#address) using the provided mnemonic, language (for the mnemonic), and address prefix if supplied.

#### createAddressFromKeys(privateSpendKey, privateViewKey, [addressPrefix])

Creates a new [address](#address) using the provided private spend key, private view key, and address prefix if supplied.

#### decodeAddressPrefix(address)

Decodes the [address prefix](#decoded-address-prefix) from the specified CryptoNote public address.

#### decodeAddress(address, [addressPrefix])

Decodes the address into the public key pairs, prefix, payment ID, etc. Returns a [decoded address](#decoded-address) object.

#### encodeRawAddress(rawAddress)

Encodes the rawAddress using CN-Base58 encoding.

#### encodeAddress(publicViewKey, publicSpendKey, [paymentId], [addressPrefix])

Encodes the publicViewKey, publicSpendKey, and payment ID into a standard CryptoNote address (or Integrated address if payment ID is supplied)

#### createIntegratedAddress(address, paymentId, [addressPrefix])

Creates an Integrated Address using the supplied address and payment ID.

#### scanTransactionOutputs(transactionPublicKey, outputs, privateViewKey, publicSpendKey, [privateSpendKey])

*Documentation In Progress*

#### isOurTransactionOutput(transactionPublicKey, output, privateViewKey, publicSpendKey, [privateSpendKey])

*Documentation In Progress*

#### generateKeyImage(transactionPublicKey, privateViewKey, publicSpendKey, privateSpendKey, outputIndex)

*Documentation In Progress*

#### createTransaction(ourKeys, transfers, ourOutputs, randomOuts, mixin, feeAmount, [paymentId], [unlockTime])

*Documentation In Progress*

#### serializeTransaction(transaction)

*Documentation In Progress*

## Common Data Structures

#### Address

```javascript
{
  spend: {
    privateKey: '517f0d3c5438416adad752557fdf001acfea189d35af8bba326c86928cc6100e',
    publicKey: '0b5a6ed3fde5470fe13a6e817b5b4caf4ce014e65155ae2f6db66a3b9ad6e819'
  },
  view: {
    privateKey: '40cf3cdab84ef0c2c17c100ffb1ba3cb1c86e22f2c4bed766a465d466b210a0f',
    publicKey: '1909af618bef1ecd30339fe12fb133bbaad05cc0ea365caf02254a5f3ae735df'
  },
  address: 'TRTLuwmU3QWjU77wyHMvBiMdiQdKgj9qfEc3oiEhHfizSu8wZ6K8ZoWQQY57qNmDC48yg6UAHzyTugB9tMohMnUEArSCdrmeUdP',
  mnemonic: 'lagoon much skirting goes okay afield royal cupcake lordship myriad necklace pliers noodles laboratory axes useful poverty igloo diode ablaze nifty inline point ritual necklace',
  seed: '517f0d3c5438416adad752557fdf001acfea189d35af8bba326c86928cc6100e'
}
```

#### Decoded Address

```javascript
{ publicViewKey: 'f0ba225065e1b9c2e43165b3e41f10fcb768853126dfa7e612a3df2deb332492',
  publicSpendKey: 'f71e440f9a5aab08dbdab0f4f36bba813660a0600f109b1371dc53be33f23c99',
  paymentId: '',
  encodedPrefix: '9df6ee01',
  prefix: 3914525,
  rawAddress: '9df6ee01f71e440f9a5aab08dbdab0f4f36bba813660a0600f109b1371dc53be33f23c99f0ba225065e1b9c2e43165b3e41f10fcb768853126dfa7e612a3df2deb332492cc073a66' }
```

#### Decoded Address Prefix

```javascript
{ prefix: '9df6ee01',
  base58: 'TRTL',
  decimal: 3914525,
  hexadecimal: '3bbb1d' }
```

### Credits

Special thanks goes out to:

* Lucas Jones
* Paul Shapiro
* Luigi111
* [The MyMonero Project](https://github.com/mymonero/mymonero-app-js)
* The Masari Project: [gnock](https://github.com/gnock)
* The Plentum Project: [DaveLong](https://github.com/DaveLong)