// Copyright (c) Lucas Jones
// Copyright (c) 2014-2017, MyMonero.com
// Copyright (c) 2016, Paul Shapiro
// Copyright (c) 2017, Luigi111
// Copyright (c) 2018, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const BigInteger = require('./lib/biginteger.js')
const Base58 = require('./lib/base58.js')
const Mnemonic = require('./lib/mnemonic.js')
const VarintDecoder = require('varint-decoder')
const SecureRandomString = require('secure-random-string')
const Numeral = require('numeral')

/* These are the JS implementations of the
   crypto functions that we need to do what
   we are trying to do. They are slow and
   painful */
const NACL = require('./lib/nacl-fast-cn.js')
const CNCrypto = require('./lib/crypto.js')
const SHA3 = require('./lib/sha3.js')

/* Try to load the Node C++ Addon module
   so that we can use that as it's a magnitudes
   faster, if not, we'll fall back to the
   JS implementations of the crypto functions */
var TurtleCoinCrypto
try {
  TurtleCoinCrypto = require('turtlecoin-crypto')
} catch (e) {
  /* Silence standardjs check */
  TurtleCoinCrypto = e
  TurtleCoinCrypto = false
}

/* This sets up the ability for the caller to specify
   their own cryptographic functions to use for parts
   of the methods used by this module. It is tracked outside
   of the instance of the module instance as there are
   a number of function calls that are not directly exposed
   to the caller to prevent confusion */
const userCryptoFunctions = {}

const SIZES = {
  HASH: 64,
  KEY: 64,
  PAYMENTID_HEX: 64,
  CHECKSUM: 8,
  ECPOINT: 32,
  GEP3: 160,
  GEP2: 120,
  GEP1P1: 160,
  GECACHED: 160,
  ECSCALAR: 32,
  KEYIMAGE: 32,
  GEDSMP: 160 * 8,
  SIGNATURE: 64
}
const TX_EXTRA_NONCE_MAX_COUNT = 255
const TX_EXTRA_TAGS = {
  PADDING: '00',
  PUBKEY: '01',
  NONCE: '02',
  MERGE_MINING: '03'
}
const TX_EXTRA_NONCE_TAGS = {
  PAYMENT_ID: '00',
  ENCRYPTED_PAYMENT_ID: '01'
}
const UINT64_MAX = BigInteger(2).pow(64)
const CURRENT_TX_VERSION = 1

class CryptoNote {
  constructor (config) {
    this.config = require('./config.json')

    if (config) {
      if (config.coinUnitPlaces) {
        this.config.coinUnitPlaces = config.coinUnitPlaces
      }

      if (config.addressPrefix) {
        this.config.addressPrefix = config.addressPrefix
      }

      if (config.keccakIterations) {
        this.config.keccakIterations = config.keccakIterations
      }

      if (config.defaultNetworkFee) {
        this.config.defaultNetworkFee = config.defaultNetworkFee
      }

      /* The checks below are for detecting customer caller
         cryptographic functions and loading them into the
         stack so that they can be used later throughout the
         module and it's underlying functions */
      if (typeof config.underivePublicKey === 'function') {
        userCryptoFunctions.underivePublicKey = config.underivePublicKey
      }

      if (typeof config.derivePublicKey === 'function') {
        userCryptoFunctions.derivePublicKey = config.derivePublicKey
      }

      if (typeof config.deriveSecretKey === 'function') {
        userCryptoFunctions.deriveSecretKey = config.deriveSecretKey
      }

      if (typeof config.generateKeyImage === 'function') {
        userCryptoFunctions.generateKeyImage = config.generateKeyImage
      }

      if (typeof config.secretKeyToPublicKey === 'function') {
        userCryptoFunctions.secretKeyToPublicKey = config.secretKeyToPublicKey
      }

      if (typeof config.cnFastHash === 'function') {
        userCryptoFunctions.cnFastHash = config.cnFastHash
      }

      if (typeof config.generateRingSignatures === 'function') {
        userCryptoFunctions.generateRingSignatures = config.generateRingSignatures
      }

      if (typeof config.generateKeyDerivation === 'function') {
        userCryptoFunctions.generateKeyDerivation = config.generateKeyDerivation
      }
    }
  }

  createNewSeed (entropy, iterations) {
    iterations = iterations || this.config.keccakIterations

    /* If you don't supply us with entropy, we'll go find our own */
    entropy = entropy || SecureRandomString({ length: 256 })

    /* We're going to take that entropy, throw a random value on
       to it, feed it through a poor very simple PBKDF2 implementation
       to create a seed using the supplied entropy */
    return scReduce32(simpleKdf(entropy + rand32(), iterations))
  }

  createNewAddress (entropy, lang, addressPrefix) {
    addressPrefix = addressPrefix || this.config.addressPrefix

    /* Let's create our new seed */
    const seed = this.createNewSeed(entropy)

    /* Using that seed, let's create our new CryptoNote address */
    return this.createAddressFromSeed(seed, lang, addressPrefix)
  }

  createAddressFromSeed (seed, lang, addressPrefix) {
    addressPrefix = addressPrefix || this.config.addressPrefix

    /* When we have a seed, then we can create a new key
       pair based on that seed */
    lang = lang || 'english'
    var keys = {}

    /* First we create the spend key pair; however,
       if the seed we were supplied isn't 64 characters
       long, we'll pass it through the CN Fast Hash function
       to turn it into 64 characters */
    var first = seed
    if (first.length !== 64) {
      first = cnFastHash(seed)
    }
    keys.spend = generateKeys(first)

    /* If our seed was less than 64 characters, then we
       hash our seed again to get us the necessary data
       to compute our view key pair; otherwise, we use
       the privateSpendKey we just created */
    var second
    if (seed.length !== 64) {
      second = cnFastHash(first)
    } else {
      second = cnFastHash(keys.spend.privateKey)
    }
    keys.view = generateKeys(second)

    /* Once we have our keys, then we can encode the public keys
       out of our view and spend pairs to create our public address */
    keys.address = this.encodeAddress(keys.view.publicKey, keys.spend.publicKey, false, addressPrefix)

    /* As we know the seed, we can encode it to a mnemonic string */
    keys.mnemonic = Mnemonic.encode(seed, lang)

    /* Put the seed in there for good measure */
    keys.seed = seed

    return keys
  }

  createAddressFromMnemonic (mnemonic, lang, addressPrefix) {
    addressPrefix = addressPrefix || this.config.addressPrefix

    /* The mnemonic is just a string representation of the seed
       that was initially used to create our key set */
    lang = lang || 'english'
    const seed = Mnemonic.decode(mnemonic, lang)

    /* As long as we have the seed we can recreate the key pairs
       pretty easily */
    return this.createAddressFromSeed(seed, lang, addressPrefix)
  }

  createAddressFromKeys (privateSpendKey, privateViewKey, addressPrefix) {
    addressPrefix = addressPrefix || this.config.addressPrefix

    let derivedViewKey = scReduce32(cnFastHash(privateSpendKey))

    /* We have our private keys so we can generate everything for use
       later except the mnemonic as we don't have the seed */
    const keys = {
      spend: {
        privateKey: privateSpendKey,
        publicKey: privateKeyToPublicKey(privateSpendKey)
      },
      view: {
        privateKey: privateViewKey,
        publicKey: privateKeyToPublicKey(privateViewKey)
      },
      address: '',
      /* If the view key is derived from the spend key, we can generate a seed */
      mnemonic: derivedViewKey === privateViewKey ? Mnemonic.encode(privateSpendKey) : null,
      seed: null
    }

    /* As we now have all of our keys, we can find out what our
       public address is */
    keys.address = this.encodeAddress(keys.view.publicKey, keys.spend.publicKey, false, addressPrefix)

    return keys
  }

  decodeAddressPrefix (address) {
    /* First we decode the address from Base58 into the raw address */
    var decodedAddress = Base58.decode(address)

    /* Now we need to work in reverse, starting with chopping off
       the checksum which is always the same */
    decodedAddress = decodedAddress.slice(0, -(SIZES.CHECKSUM))

    /* Now we find out how many extra characters there are
       in what's left after we find all of the keys in the address.
       Remember, this works because payment IDs are the same size as keys */
    var prefixLength = decodedAddress.length % SIZES.KEY

    /* Great, now we that we know how long the prefix length is, we
       can grab just that from the front of the address information */
    var prefixDecoded = decodedAddress.slice(0, prefixLength)

    /* Then we can decode it into the integer that it represents */
    var prefixVarint = decodeVarint(prefixDecoded)

    /* This block of code is a hack to figure out what the human readable
       address prefix is. While it has been tested with a few different
       cryptonote addresses from different projects, it is by no means
       guaranteed to work with every project. The reason for this is that
       due to the block encoding used in Base58, it's nearly impossible
       to reliably find out the Base58 version of just the prefix as it
       is not actually long enough to be encoded on its own and get the
       prefix we expect. */

    /* First we need the need to know how long the varint representation
       of the prefix is, we're going to need it later */
    var prefixVarintLength = prefixVarint.toString().length

    /* This is where it starts to get funny. If the length is an even
       number of characters, we'll need to grab the one extra character
       from the address we passed in to get the prefix that we all know
       and love */
    var offset = (prefixVarintLength % 2 === 0) ? 1 : 0

    /* This is kind of goofy. If the address prefix varint is longer
       than 10 characters, then we need to adjust the offset amount
       by the count of remaining characters. This is undoubtedly a
       hack to support obnoxiously long address prefixes */
    if (prefixVarintLength > 10) {
      offset += Math.floor((prefixVarintLength % 10) / 2)
    }

    /* Using all of that above, we can chop off the first couple of
       characters from the supplied address and get something that looks
       like the Base58 prefix we expected. */
    var prefixEncoded = address.slice(0, Math.ceil(prefixVarintLength / 2) + offset)

    return {
      prefix: prefixDecoded,
      base58: prefixEncoded,
      decimal: prefixVarint,
      hexadecimal: prefixVarint.toString(16)
    }
  }

  decodeAddress (address, addressPrefix) {
    addressPrefix = addressPrefix || this.config.addressPrefix

    /* First, we decode the base58 string to hex */
    var decodedAddress = Base58.decode(address)

    /* We need to encode the address prefix from our config
       so that we can compare it later */
    const encodedPrefix = encodeVarint(addressPrefix)

    /* Let's chop off the prefix from the address we decoded */
    var prefix = decodedAddress.slice(0, encodedPrefix.length)

    /* Do they match? They better... */
    if (prefix !== encodedPrefix) {
      throw new Error('Invalid address prefix')
    }

    /* We don't need the prefix in our working space any more */
    decodedAddress = decodedAddress.slice(encodedPrefix.length)

    var paymentId = ''

    /* If the decoded address is longer than a
      public spend key + public view key + checksum
      then it's very likely an integrated address and as
      such, we need to get the payment ID out of there for
      use later otherwise the resulting data does not make
      any sense whatsoever */
    if (decodedAddress.length > ((SIZES.KEY * 2) + SIZES.CHECKSUM)) {
      paymentId = decodedAddress.slice(0, (SIZES.KEY * 2))
      decodedAddress = decodedAddress.slice((SIZES.KEY * 2))
    }

    /* Finish decomposing the decoded address */
    const publicSpend = decodedAddress.slice(0, SIZES.KEY)
    const publicView = decodedAddress.slice(SIZES.KEY, (SIZES.KEY * 2))
    const expectedCheckum = decodedAddress.slice(-(SIZES.CHECKSUM))

    var checksum
    /* Calculate our address checksum */
    if (paymentId.length === 0) {
      /* If there is no payment ID it's pretty simple */
      checksum = cnFastHash(prefix + publicSpend + publicView).slice(0, SIZES.CHECKSUM)
    } else {
      /* If there is a payment ID it's pretty simple as well */
      checksum = cnFastHash(prefix + paymentId + publicSpend + publicView).slice(0, SIZES.CHECKSUM)

      /* As goofy as this sounds, we need to convert the payment
         ID from hex into a string representation so that it returns
         to a human readable form */
      paymentId = Base58.hextostr(paymentId)
    }

    /* If the checksum we found in the address doesn't match the
       checksum that we just computed, then the address is bad */
    if (expectedCheckum !== checksum) {
      throw new Error('Could not parse address: checksum mismatch')
    }

    return {
      publicViewKey: publicView,
      publicSpendKey: publicSpend,
      paymentId: paymentId,
      encodedPrefix: prefix,
      prefix: addressPrefix,
      rawAddress: Base58.decode(address)
    }
  }

  encodeRawAddress (rawAddress) {
    return Base58.encode(rawAddress)
  }

  encodeAddress (publicViewKey, publicSpendKey, paymentId, addressPrefix) {
    addressPrefix = addressPrefix || this.config.addressPrefix
    paymentId = paymentId || false

    if (!isHex64(publicViewKey)) {
      throw new Error('Invalid public view key format')
    }

    if (!isHex64(publicSpendKey)) {
      throw new Error('Invalid public spend key format')
    }

    /* If we included a payment ID it needs to be
       64 hexadecimal characters */
    if (paymentId && !isHex64(paymentId)) {
      throw new Error('Invalid payment ID format')
    }

    var rawAddress = []

    /* Encode our configured address prefix so that we can throw
       it on the front of our address */
    const encodedPrefix = encodeVarint(addressPrefix)
    rawAddress.push(encodedPrefix)

    /* Is there a payment ID? If so, that comes next */
    if (paymentId) {
      paymentId = Base58.strtohex(paymentId)
      rawAddress.push(paymentId)
    }

    /* Then toss on our publicSpendKey followed by our public
       view key */
    rawAddress.push(publicSpendKey.toString())
    rawAddress.push(publicViewKey.toString())
    rawAddress = rawAddress.join('')

    /* Generate the checksum and toss that on the end */
    const checksum = cnFastHash(rawAddress).slice(0, 8)
    rawAddress += checksum

    /* Finally, encode all that to Base58 */
    return Base58.encode(rawAddress)
  }

  createIntegratedAddress (address, paymentId, addressPrefix) {
    addressPrefix = addressPrefix || this.config.addressPrefix

    /* Decode our address */
    var addr = this.decodeAddress(address)
    /* Encode the address but this time include the payment ID */
    return this.encodeAddress(addr.publicViewKey, addr.publicSpendKey, paymentId, addressPrefix)
  }

  privateKeyToPublicKey (privateKey) {
    return privateKeyToPublicKey(privateKey)
  }

  scanTransactionOutputs (transactionPublicKey, outputs, privateViewKey, publicSpendKey, privateSpendKey) {
    /* Given the transaction public key and the array of outputs, let's see if
       any of the outputs belong to us */

    var ourOutputs = []

    for (var i = 0; i < outputs.length; i++) {
      var output = outputs[i]

      /* Check to see if this output belongs to us */
      var ourOutput = this.isOurTransactionOutput(transactionPublicKey, output, privateViewKey, publicSpendKey, privateSpendKey)
      if (ourOutput) {
        ourOutputs.push(ourOutput)
      }
    }

    return ourOutputs
  }

  isOurTransactionOutput (transactionPublicKey, output, privateViewKey, publicSpendKey, privateSpendKey) {
    privateSpendKey = privateSpendKey || false
    output = output || {}

    if (!isHex64(transactionPublicKey)) {
      throw new Error('Invalid transaction public key format')
    }

    if (!isHex64(privateViewKey)) {
      throw new Error('Invalid private view key format')
    }

    if (!isHex64(publicSpendKey)) {
      throw new Error('Invalid public spend key format')
    }

    if (privateSpendKey && !isHex64(privateSpendKey)) {
      throw new Error('Invalid private spend key format')
    }

    if (typeof output.index === 'undefined' || typeof output.key === 'undefined') {
      throw new Error('Output object not of correct type')
    }

    /* Generate the key deriviation from the random transaction public key and our private view key */
    const derivedKey = this.generateKeyDerivation(transactionPublicKey, privateViewKey)

    /* Derive the transfer public key from the derived key, the output index, and our public spend key */
    const publicEphemeral = derivePublicKey(derivedKey, output.index, publicSpendKey)

    /* If the derived transfer public key matches the output key then this output belongs to us */
    if (output.key === publicEphemeral) {
      output.input = {}
      output.input.transactionKey = {
        publicKey: transactionPublicKey,
        privateKey: derivedKey
      }
      output.input.publicEphemeral = publicEphemeral

      if (privateSpendKey) {
        /* Derive the key image private key from the derived key, the output index, and our spend secret key */
        const privateEphemeral = deriveSecretKey(derivedKey, output.index, privateSpendKey)

        /* Generate the key image */
        const keyImage = generateKeyImage(publicEphemeral, privateEphemeral)

        output.input.privateEphemeral = privateEphemeral
        output.keyImage = keyImage
      }

      return output
    }

    return false
  }

  generateKeyImage (transactionPublicKey, privateViewKey, publicSpendKey, privateSpendKey, outputIndex) {
    if (!isHex64(transactionPublicKey)) {
      throw new Error('Invalid transaction public key format')
    }

    if (!isHex64(privateViewKey)) {
      throw new Error('Invalid private view key format')
    }
    /* Generate the key deriviation from the random transaction public key and our private view key */
    let derivation = this.generateKeyDerivation(transactionPublicKey, privateViewKey)

    return this.generateKeyImagePrimitive(publicSpendKey, privateSpendKey, outputIndex, derivation)
  }

  /* If the user already has a derivation, they can pass that in instead of
     the privateViewKey and transactionPublicKey */
  generateKeyImagePrimitive (publicSpendKey, privateSpendKey, outputIndex, derivation) {
    if (!isHex64(publicSpendKey)) {
      throw new Error('Invalid public spend key format')
    }

    if (!isHex64(privateSpendKey)) {
      throw new Error('Invalid private spend key format')
    }

    /* Derive the transfer public key from the derived key, the output index, and our public spend key */
    const publicEphemeral = derivePublicKey(derivation, outputIndex, publicSpendKey)

    /* Derive the key image private key from the derived key, the output index, and our spend secret key */
    const privateEphemeral = deriveSecretKey(derivation, outputIndex, privateSpendKey)

    /* Generate the key image */
    const keyImage = generateKeyImage(publicEphemeral, privateEphemeral)

    return [keyImage, privateEphemeral]
  }

  /* This method is designed to create new outputs for use
     during transaction creation */
  createTransactionOutputs (address, amount) {
    amount = amount || false

    /* If we didn't specify an amount we can't send anything */
    if (!amount || amount < 0) {
      throw new Error('You must specify a valid amount')
    }

    const result = []

    /* Decode the address into it's important bits */
    var addressDecoded = this.decodeAddress(address)

    /* Now we need to decompose the amount into "pretty" amounts
       that we can actually mix later. We're doing this by
       converting the amount to a character array and reversing
       it so that we have the digits in each place */
    var amountChars = amount.toString().split('').reverse()

    /* Loop through the amount characters */
    for (var i = 0; i < amountChars.length; i++) {
      /* Create pretty amounts */
      var amt = parseInt(amountChars[i]) * Math.pow(10, i)

      if (amt !== 0) {
        result.push({
          amount: amt,
          keys: addressDecoded
        })
      }
    }

    return result
  }

  createTransactionStructure (ourKeys, newOutputs, ourOutputs, randomOuts, mixin, feeAmount, paymentId, unlockTime, _async) {
    return createTransaction(ourKeys, newOutputs, ourOutputs, randomOuts, mixin, feeAmount, paymentId, unlockTime, _async)
  }

  createTransaction (ourKeys, newOutputs, ourOutputs, randomOuts, mixin, feeAmount, paymentId, unlockTime) {
    var tx = this.createTransactionStructure(ourKeys, newOutputs, ourOutputs, randomOuts, mixin, feeAmount, paymentId, unlockTime, false)
    var serializedTransaction = serializeTransaction(tx)
    var txnHash = cnFastHash(serializedTransaction)

    return {
      transaction: tx,
      rawTransaction: serializedTransaction,
      hash: txnHash
    }
  }

  createTransactionAsync (ourKeys, newOutputs, ourOutputs, randomOuts, mixin, feeAmount, paymentId, unlockTime) {
    var tx = this.createTransactionStructure(ourKeys, newOutputs, ourOutputs, randomOuts, mixin, feeAmount, paymentId, unlockTime, true)
    var serializedTransaction = serializeTransaction(tx)
    var txnHash = cnFastHash(serializedTransaction)

    return {
      transaction: tx,
      rawTransaction: serializedTransaction,
      hash: txnHash
    }
  }

  serializeTransaction (transaction) {
    return serializeTransaction(transaction, false)
  }

  formatMoney (amount) {
    var places = ''
    for (var i = 0; i < this.config.coinUnitPlaces; i++) {
      places += '0'
    }
    return Numeral(amount / Math.pow(10, this.config.coinUnitPlaces)).format('0,0.' + places)
  }

  generateKeyDerivation (transactionPublicKey, privateViewKey) {
    return generateKeyDerivation(transactionPublicKey, privateViewKey)
  }

  underivePublicKey (derivation, outputIndex, outputKey) {
    if (!isHex64(derivation)) {
      throw new Error('Invalid derivation key format')
    }

    if (userCryptoFunctions.underivePublicKey) {
      userCryptoFunctions.underivePublicKey(derivation, outputIndex, outputKey)
    } else if (TurtleCoinCrypto) {
      return TurtleCoinCrypto.underivePublicKey(derivation, outputIndex, outputKey)
    } else {
      const RingSigs = require('./lib/ringsigs.js')

      return RingSigs.underivePublicKey(derivation, outputIndex, outputKey)
    }
  }
}

/* Internal support functions */
function isHex (str) {
  const regex = new RegExp('^[0-9a-fA-F]{' + str.length + '}$')
  return regex.test(str)
}

function isHex64 (str) {
  const regex = new RegExp('^[0-9a-fA-F]{64}$')
  return regex.test(str)
}

function swapEndian (hex) {
  if (hex.length % 2 !== 0) {
    throw new Error('Hex string length must be a multiple of 2!')
  }
  var result = ''

  var loopCount = hex.length / 2
  for (var i = 1; i <= loopCount; i++) {
    result += hex.substr(0 - 2 * i, 2)
  }

  return result
}

function d2h (integer) {
  if (typeof integer !== 'string' && integer.toString().length > 15) {
    throw new Error('Integer should be entered as a string for precision')
  }

  var padding = ''
  for (var i = 0; i < 64; i++) {
    padding += '0'
  }

  const result = (padding + BigInteger(integer).toString(16).toLowerCase()).slice(-(SIZES.KEY))
  return result
}

function d2s (integer) {
  return swapEndian(d2h(integer))
}

function hex2bin (hex) {
  if (hex.length % 2 !== 0) {
    throw new Error('Hex string has invalid length')
  }

  var result = new Uint8Array(hex.length / 2)
  var hexLength = hex.length / 2
  for (var i = 0; i < hexLength; i++) {
    result[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }

  return result
}

function bin2hex (bin) {
  var result = []
  for (var i = 0; i < bin.length; ++i) {
    result.push(('0' + bin[i].toString(16)).slice(-2))
  }

  return result.join('')
}

function str2bin (str) {
  var result = new Uint8Array(str.length)
  for (var i = 0; i < str.length; i++) {
    result[i] = str.charCodeAt(i)
  }

  return result
}

function rand32 () {
  /* Go get 256-bits (32 bytes) of random data */
  return Mnemonic.random(256)
}

function encodeVarint (i) {
  i = BigInteger(i)

  var result = ''
  while (i.compare(0x80) >= 0) {
    result += ('0' + ((i.lowVal() & 0x7f) | 0x80).toString(16)).slice(-2)
    i = i.divide(BigInteger(2).pow(7))
  }
  result += ('0' + i.toJSValue().toString(16)).slice(-2)

  return result
}

function decodeVarint (hex) {
  const buffer = Buffer.from(hex, 'hex')
  return parseInt(VarintDecoder(buffer))
}

function scReduce (hex, size) {
  size = size || 64
  var input = hex2bin(hex)
  if (input.length !== size) {
    throw new Error('Invalid input length')
  }

  var memory = CNCrypto._malloc(size)
  CNCrypto.HEAPU8.set(input, memory)
  CNCrypto.ccall('sc_reduce32', 'void', ['number'], [memory])

  var result = CNCrypto.HEAPU8.subarray(memory, memory + size)
  CNCrypto._free(memory)

  return bin2hex(result)
}

function scReduce32 (hex) {
  if (TurtleCoinCrypto) {
    return TurtleCoinCrypto.scReduce32(hex)
  } else {
    return scReduce(hex, 32)
  }
}

function geScalarMult (publicKey, privateKey) {
  if (!isHex64(publicKey)) {
    throw new Error('Invalid public key format')
  }

  if (!isHex64(privateKey)) {
    throw new Error('Invalid secret key format')
  }

  return bin2hex(NACL.ll.geScalarmult(hex2bin(publicKey), hex2bin(privateKey)))
}

function getScalarMultBase (privateKey) {
  return privateKeyToPublicKey(privateKey)
}

function derivePublicKey (derivation, outputIndex, publicKey) {
  if (derivation.length !== (SIZES.ECPOINT * 2)) {
    throw new Error('Invalid derivation length')
  }

  if (!isHex64(publicKey)) {
    throw new Error('Invalid public key format')
  }

  if (userCryptoFunctions.derivePublicKey) {
    return userCryptoFunctions.derivePublicKey(derivation, outputIndex, publicKey)
  } else if (TurtleCoinCrypto) {
    return TurtleCoinCrypto.derivePublicKey(derivation, outputIndex, publicKey)
  } else {
    var s = derivationToScalar(derivation, outputIndex)
    return bin2hex(NACL.ll.geAdd(hex2bin(publicKey), hex2bin(getScalarMultBase(s))))
  }
}

function deriveSecretKey (derivation, outputIndex, privateKey) {
  if (derivation.length !== (SIZES.ECPOINT * 2)) {
    throw new Error('Invalid derivation length')
  }

  if (!isHex64(privateKey)) {
    throw new Error('Invalid secret key format')
  }

  if (userCryptoFunctions.deriveSecretKey) {
    return userCryptoFunctions.deriveSecretKey(derivation, outputIndex, privateKey)
  } else if (TurtleCoinCrypto) {
    return TurtleCoinCrypto.deriveSecretKey(derivation, outputIndex, privateKey)
  } else {
    var m = CNCrypto._malloc(SIZES.ECSCALAR)
    var b = hex2bin(derivationToScalar(derivation, outputIndex))
    CNCrypto.HEAPU8.set(b, m)

    var baseM = CNCrypto._malloc(SIZES.ECSCALAR)
    CNCrypto.HEAPU8.set(hex2bin(privateKey), baseM)

    var derivedM = CNCrypto._malloc(SIZES.ECSCALAR)
    CNCrypto.ccall('sc_add', 'void', ['number', 'number', 'number'], [derivedM, baseM, m])

    var result = CNCrypto.HEAPU8.subarray(derivedM, derivedM + SIZES.ECSCALAR)
    CNCrypto._free(m)
    CNCrypto._free(baseM)
    CNCrypto._free(derivedM)

    return bin2hex(result)
  }
}

function generateKeyImage (publicKey, privateKey) {
  if (!isHex64(publicKey)) {
    throw new Error('Invalid public key format')
  }

  if (!isHex64(privateKey)) {
    throw new Error('Invalid secret key format')
  }

  if (userCryptoFunctions.generateKeyImage) {
    return userCryptoFunctions.generateKeyImage(publicKey, privateKey)
  } else if (TurtleCoinCrypto) {
    return TurtleCoinCrypto.generateKeyImage(publicKey, privateKey)
  } else {
    const RingSigs = require('./lib/ringsigs.js')

    return RingSigs.generate_key_image(publicKey, privateKey)
  }
}

function hashToScalar (buf) {
  const hash = cnFastHash(buf)
  return scReduce32(hash)
}

function derivationToScalar (derivation, outputIndex) {
  var buf = ''

  if (derivation.length !== (SIZES.ECPOINT * 2)) {
    throw new Error('Invalid derivation length')
  }

  buf += derivation

  var enc = encodeVarint(outputIndex)
  if (enc.length > (10 * 2)) {
    throw new Error('outputIndex does not fit in 64-bit varint')
  }

  buf += enc
  return hashToScalar(buf)
}

function privateKeyToPublicKey (privateKey) {
  if (privateKey.length !== SIZES.KEY) {
    throw new Error('Invalid secret key length')
  }

  if (userCryptoFunctions.secretKeyToPublicKey) {
    return userCryptoFunctions.secretKeyToPublicKey(privateKey)
  } else if (TurtleCoinCrypto) {
    return TurtleCoinCrypto.secretKeyToPublicKey(privateKey)
  } else {
    return bin2hex(NACL.ll.geScalarmultBase(hex2bin(privateKey)))
  }
}

function cnFastHash (input) {
  if (input.length % 2 !== 0 || !isHex(input)) {
    throw new Error('Invalid input: ' + input)
  }

  if (userCryptoFunctions.cnFastHash) {
    return userCryptoFunctions.cnFastHash(input)
  } else if (TurtleCoinCrypto) {
    return TurtleCoinCrypto.cnFastHash(input)
  } else {
    return SHA3.keccak_256(hex2bin(input))
  }
}

function simpleKdf (str, iterations) {
  /* This is a very simple implementation of a
     psuedo PBKDF2 function */
  var hex = bin2hex(str2bin(str))
  for (var n = 0; n < iterations; ++n) {
    hex = cnFastHash(hex)
  }
  return hex
}

function generateKeys (seed) {
  if (seed.length !== 64) {
    throw new Error('Invalid seed length')
  }

  var privateKey = scReduce32(seed)
  var publicKey = privateKeyToPublicKey(privateKey)

  return {
    privateKey: privateKey,
    publicKey: publicKey
  }
}

function randomKeypair () {
  /* Generate a random key pair */
  return generateKeys(simpleKdf(rand32(), 1))
}

/* This method calculates our relative offset positions for
   the globalIndexes for inclusion in a new transaction */
function absoluteToRelativeOffsets (offsets) {
  if (offsets.length === 0) {
    return offsets
  }

  for (var i = offsets.length - 1; i >= 1; --i) {
    offsets[i] = BigInteger(offsets[i]).subtract(offsets[i - 1]).toString()
  }

  /* All the other offsets are strings, not numbers. It still works, but, muh
     autism */
  offsets[0] = offsets[0].toString()

  return offsets
}

function addTransactionPublicKeyToExtra (extra, transactionPublicKey) {
  if (!isHex64(transactionPublicKey)) {
    throw new Error('Invalid Transaction Public Key Format')
  }

  extra += TX_EXTRA_TAGS.PUBKEY
  extra += transactionPublicKey

  return extra
}

function getPaymentIdNonce (paymentId) {
  if (!isHex64(paymentId)) {
    throw new Error('Payment ID must be 64 hexadecimal characters')
  }

  return TX_EXTRA_NONCE_TAGS.PAYMENT_ID + paymentId
}

function addNonceToExtra (extra, nonce) {
  if ((nonce.length % 2) !== 0) {
    throw new Error('Invalid extra nonce')
  }

  if ((nonce.length / 2) > TX_EXTRA_NONCE_MAX_COUNT) {
    throw new Error('Extra nonce must be at most ' + TX_EXTRA_NONCE_MAX_COUNT + ' bytes')
  }

  /* Add the NONCE tag */
  extra += TX_EXTRA_TAGS.NONCE

  /* Encode the length of the NONCE */
  extra += ('0' + (nonce.length / 2).toString(16)).slice(-2)

  /* Add the NONCE */
  extra += nonce

  return extra
}

function generateRingSignature (transactionPrefixHash, keyImage, inputKeys, privateKey, realIndex) {
  var sigs = []

  if (!isHex64(keyImage)) {
    throw new Error('Invalid Key Image format')
  }

  if (!isHex64(privateKey)) {
    throw new Error('Invalid secret key format')
  }

  if (!isHex64(transactionPrefixHash)) {
    throw new Error('Invalid transaction prefix hash format')
  }

  if (realIndex >= inputKeys.length || realIndex < 0) {
    throw new Error('Invalid realIndex supplied')
  }

  if (userCryptoFunctions.generateRingSignatures) {
    return userCryptoFunctions.generateRingSignatures(transactionPrefixHash, keyImage, inputKeys, privateKey, realIndex)
  } else if (TurtleCoinCrypto) {
    return TurtleCoinCrypto.generateRingSignatures(transactionPrefixHash, keyImage, inputKeys, privateKey, realIndex)
  } else {
    const RingSigs = require('./lib/ringsigs.js')

    var cSigs = new RingSigs.VectorString()
    var cInputKeys = new RingSigs.VectorString()

    inputKeys.forEach((key) => {
      cInputKeys.push_back(key)
    })

    cSigs = RingSigs.generateRingSignatures(transactionPrefixHash, keyImage, cInputKeys, privateKey, realIndex)

    for (var i = 0; i < cSigs.size(); i++) {
      sigs.push(cSigs.get(i))
    }

    return sigs
  }
}

function createTransaction (newOutputs, ourOutputs, randomOutputs, mixin, feeAmount, paymentId, unlockTime, _async) {
  unlockTime = unlockTime || 0
  randomOutputs = randomOutputs || []

  /* Verify that we've been passed an array of outputs */
  if (!Array.isArray(newOutputs)) {
    throw new Error('newOutputs must be an array')
  }

  /* Verify that we've been passed an array of our outputs (our funds) */
  if (!Array.isArray(ourOutputs)) {
    throw new Error('ourOutputs must be an array')
  }

  /* Make sure that if we are to use mixins that we've been given the
     correct number of sets of random outputs */
  if (randomOutputs.length !== ourOutputs.length && mixin !== 0) {
    throw new Error('Not enough random outputs sets were supplied with the transaction')
  }

  /* Make sure that there are the correct number of random outputs
     in each one of the sets that we were passed */
  for (var i = 0; i < randomOutputs.length; i++) {
    if ((randomOutputs[i] || []).length < mixin) {
      throw new Error('There are not enough outputs to mix with in the random outputs sets')
    }
  }

  /* Make sure that we're not trying to send more money than
     is actually possible within the confines of a uint64 */
  var neededMoney = BigInteger.ZERO
  for (i = 0; i < newOutputs.length; i++) {
    neededMoney = neededMoney.add(newOutputs[i].amount)
    if (neededMoney.compare(UINT64_MAX) !== -1) {
      throw new Error('Total output amount exceeds UINT64_MAX')
    }
  }

  /* Make sure that we're not trying to spend more money than
     is actually possible within the confines of a uint64 */
  var foundMoney = BigInteger.ZERO
  for (i = 0; i < ourOutputs.length; i++) {
    foundMoney = foundMoney.add(ourOutputs[i].amount)
    if (foundMoney.compare(UINT64_MAX) !== -1) {
      throw new Error('Total input amount exceeds UINT64_MAX')
    }
  }

  /* Validate that we're spending all of the necessary funds
     and that the transaction balances properly. We do this
     relatively early as everything starts to get a little
     more computationally expensive from here on out */
  var change = BigInteger.ZERO
  var cmp = neededMoney.compare(foundMoney)
  if (cmp < 0) {
    change = foundMoney.subtract(neededMoney)
    if (change.compare(feeAmount) !== 0) {
      throw new Error('We have not spent all of what we have passed in')
    }
  } else if (cmp > 0) {
    throw new Error('We need more money than was currently supplied for the transaction')
  }

  /* Create our transaction inputs using the helper function */
  var transactionInputs = createTransactionInputs(ourOutputs, randomOutputs, mixin)

  /* Prepare our transaction outputs using the helper function */
  var transactionOutputs = prepareTransactionOutputs(newOutputs, _async)

  var transactionExtra = ''
  /* If we have a payment ID we need to add it to tx_extra */
  if (isHex64(paymentId)) {
    const nonce = getPaymentIdNonce(paymentId)
    transactionExtra = addNonceToExtra(transactionExtra, nonce)
  }

  /* Start constructing our actual transaction */
  const tx = {
    unlockTime: unlockTime,
    version: CURRENT_TX_VERSION,
    extra: transactionExtra,
    transactionKeys: transactionOutputs.transactionKeys,
    vin: [],
    vout: [],
    signatures: []
  }

  transactionInputs.sort(function (a, b) {
    return (BigInteger.parse(a.keyImage, 16).compare(BigInteger.parse(b.keyImage, 16)) * -1)
  })

  transactionInputs.forEach((input) => {
    const inputToKey = {
      type: 'input_to_key',
      amount: input.amount,
      keyImage: input.keyImage,
      keyOffsets: []
    }

    input.outputs.forEach((output) => {
      inputToKey.keyOffsets.push(output.index)
    })

    inputToKey.keyOffsets = absoluteToRelativeOffsets(inputToKey.keyOffsets)

    tx.vin.push(inputToKey)
  })

  tx.extra = addTransactionPublicKeyToExtra(tx.extra, transactionOutputs.transactionKeys.publicKey)

  if (_async) {
    return transactionOutputs.outputs.then((outputs) => {
      outputs.forEeach((output) => {
        tx.vout.push(output)
      })

      const txPrefixHash = getTransactionPrefixHash(tx)

      const sigPromises = []

      for (i = 0; i < transactionInputs.length; i++) {
        var txInput = transactionInputs[i]

        var srcKeys = []
        txInput.outputs.forEach((out) => {
          srcKeys.push(out.key)
        })

        var sigPromise = generateRingSignature(
          txPrefixHash, txInput.keyImage, srcKeys, txInput.input.privateEphemeral, txInput.realOutputIndex
        ).then((sigs) => {
          tx.signatures.push(sigs)
        })

        sigPromises.push(sigPromise)
      }

      /* Wait for all the sigs to get created and added, then return the tx */
      return Promise.all(sigPromises).then(() => {
        return tx
      })
    })
  } else {
    transactionOutputs.outputs.forEach((output) => {
      tx.vout.push(output)
    })

    const txPrefixHash = getTransactionPrefixHash(tx)

    for (i = 0; i < transactionInputs.length; i++) {
      var txInput = transactionInputs[i]

      var srcKeys = []
      txInput.outputs.forEach((out) => {
        srcKeys.push(out.key)
      })

      const sigs = generateRingSignature(txPrefixHash, txInput.keyImage, srcKeys, txInput.input.privateEphemeral, txInput.realOutputIndex)
      tx.signatures.push(sigs)
    }

    return tx
  }
}

/* This method is designed to create mixed inputs for use
   during transaction construction */
function createTransactionInputs (ourOutputs, randomOutputs, mixin) {
  /* Make sure that if we are to use mixins that we've been given the
     correct number of sets of random outputs */
  if (ourOutputs.length !== randomOutputs.length && mixin !== 0) {
    throw new Error('There are not enough random output sets to mix with the real outputs')
  }

  /* Make sure that there are the correct number of random outputs
     in each one of the sets that we were passed */
  for (var i = 0; i < randomOutputs.length; i++) {
    if ((randomOutputs[i] || []).length < mixin) {
      throw new Error('There are not enough outputs to mix with in the random outputs sets')
    }
  }

  var mixedInputs = []

  /* Loop through our outputs that we're using to send funds */
  for (i = 0; i < ourOutputs.length; i++) {
    const mixedOutputs = []
    const realOutput = ourOutputs[i]

    /* If we're using mixins, then we need to use the random outputs */
    if (mixin !== 0) {
      /* Select our set of random outputs */
      const fakeOutputs = randomOutputs[i]

      /* Sort the random outputs by their global indexes */
      fakeOutputs.sort((a, b) => {
        return BigInteger(a.globalIndex).compare(b.globalIndex)
      })

      /* Insert the fake outputs into our array of mixed outputs */
      fakeOutputs.forEach((output) => {
        /* User can pass in extra outputs to let us continue if we get our
           own output as one to mix with. (See below). Continue once we've
           got enough. */
        if (mixedOutputs.length === mixin) {
          return
        }
        /* Can't mix with ourself, skip this iteration. Still might be able to
           succeed if given more outputs than mixin */
        if (output.globalIndex === realOutput.globalIndex) {
          return
        }
        mixedOutputs.push({
          key: output.key,
          index: output.globalIndex
        })
      })

      if (mixedOutputs.length < mixin) {
        throw new Error('It is impossible to mix with yourself. Find some more random outputs and try again.')
      }
    }

    /* Insert our real output into the stack of mixed outputs */
    mixedOutputs.push({
      key: realOutput.key,
      index: realOutput.globalIndex
    })

    /* Sort the outputs again by `globalIndex` */
    mixedOutputs.sort((a, b) => { return BigInteger(a.index).compare(b.index) })

    /* Set up our actual input, some extra information is added here
       to save time later */
    const input = {
      amount: realOutput.amount,
      realOutputIndex: 0,
      keyImage: realOutput.keyImage || false,
      input: realOutput.input,
      outputs: mixedOutputs
    }

    /* Loop through the mixed outputs and look for our real input
       as we'll need to know which one it is in the array later */
    for (var j = 0; j < mixedOutputs.length; j++) {
      if (mixedOutputs[j].index === realOutput.globalIndex) {
        input.realOutputIndex = j
      }
    }

    /* Push the input on to our stack */
    mixedInputs.push(input)
  }

  /* Return the array of mixed inputs */
  return mixedInputs
}

function prepareTransactionOutputs (outputs, _async) {
  if (!Array.isArray(outputs)) {
    throw new Error('Must supply an array of outputs')
  }

  /* Generate a transaction key pair */
  const transactionKeys = randomKeypair()

  /* Sort our outputs by amount */
  outputs.sort((a, b) => (a.amount > b.amount) ? 1 : ((b.amount > a.amount) ? -1 : 0))

  const preparedOutputs = []
  const promises = []

  for (var i = 0; i < outputs.length; i++) {
    var output = outputs[i]
    if (output.amount <= 0) {
      throw new Error('Cannot have an amount <= 0')
    }

    if (_async) {
      var promise = generateKeyDerivation(
        output.keys.publicViewKey, transactionKeys.privateKey
      ).then((outDerivation) => {
        return derivePublicKey(outDerivation, i, output.keys.publicSpendKey)
      }).then((outEphemeralPub) => {
        /* Push it on to our stack */
        preparedOutputs.push({
          amount: output.amount,
          target: {
            data: outEphemeralPub
          },
          type: 'txout_to_key'
        })
      })

      promises.push(promise)
    } else {
      var outDerivation = generateKeyDerivation(output.keys.publicViewKey, transactionKeys.privateKey)

      /* Generate the one time output key */
      const outEphemeralPub = derivePublicKey(outDerivation, i, output.keys.publicSpendKey)

      /* Push it on to our stack */
      preparedOutputs.push({
        amount: output.amount,
        target: {
          data: outEphemeralPub
        },
        type: 'txout_to_key'
      })
    }
  }

  if (_async) {
    return {
      transactionKeys,
      outputs: Promise.all(promises).then(() => {
        return preparedOutputs
      })
    }
  }

  return { transactionKeys, outputs: preparedOutputs }
}

function getTransactionPrefixHash (tx) {
  /* Serialize the transaction as a string (blob) but
     do not include the signatures */
  var prefix = serializeTransaction(tx, true)

  /* Hash it */
  return cnFastHash(prefix)
}

function serializeTransaction (tx, headerOnly) {
  headerOnly = headerOnly || false

  var buf = ''
  buf += encodeVarint(tx.version)
  buf += encodeVarint(tx.unlockTime)

  /* Loop through the transaction inputs and put them in the buffer */
  buf += encodeVarint(tx.vin.length)
  for (var i = 0; i < tx.vin.length; i++) {
    var vin = tx.vin[i]
    switch (vin.type.toLowerCase()) {
      case 'input_to_key':
        buf += '02'
        buf += encodeVarint(vin.amount)
        buf += encodeVarint(vin.keyOffsets.length)
        for (var j = 0; j < vin.keyOffsets.length; j++) {
          buf += encodeVarint(vin.keyOffsets[j])
        }
        buf += vin.keyImage
        break
      default:
        throw new Error('Unhandled transaction input type: ' + vin.type)
    }
  }

  /* Loop through the transaction outputs and put them in the buffer */
  buf += encodeVarint(tx.vout.length)
  for (i = 0; i < tx.vout.length; i++) {
    var vout = tx.vout[i]
    buf += encodeVarint(vout.amount)
    switch (vout.type.toLowerCase()) {
      case 'txout_to_key':
        buf += '02'
        buf += vout.target.data
        break
      default:
        throw new Error('Unhandled transacount output type: ' + vout.type)
    }
  }

  /* If we supplied extra data, it needs to be hexadecimal */
  if (!isHex(tx.extra)) {
    throw new Error('Transaction extra has invalid hexadecimal data')
  }

  buf += encodeVarint(tx.extra.length / 2)
  buf += tx.extra

  /* Loop through the transaction signatures if this is a full transaction payload
     and put them in the buffer */
  if (!headerOnly) {
    if (tx.vin.length !== tx.signatures.length) {
      throw new Error('Number of signatures supplied does not equal the number of inputs used')
    }
    for (i = 0; i < tx.vin.length; i++) {
      for (j = 0; j < tx.signatures[i].length; j++) {
        buf += tx.signatures[i][j]
      }
    }
  }

  return buf
}

function generateKeyDerivation (transactionPublicKey, privateViewKey) {
  if (!isHex64(transactionPublicKey)) {
    throw new Error('Invalid public key format')
  }

  if (!isHex64(privateViewKey)) {
    throw new Error('Invalid secret key format')
  }

  if (userCryptoFunctions.generateKeyDerivation) {
    return userCryptoFunctions.generateKeyDerivation(privateViewKey, transactionPublicKey)
  } else if (TurtleCoinCrypto) {
    return TurtleCoinCrypto.generateKeyDerivation(privateViewKey, transactionPublicKey)
  } else {
    var p = geScalarMult(transactionPublicKey, privateViewKey)
    return geScalarMult(p, d2s(8))
  }
}

module.exports = {
  CryptoNote
}
