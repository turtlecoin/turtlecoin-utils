// Copyright (c) Lucas Jones
// Copyright (c) 2014-2017, MyMonero.com
// Copyright (c) 2016, Paul Shapiro
// Copyright (c) 2017, Luigi111
// Copyright (c) 2018-2019, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

'use strict'

const Base58 = require('./base58')
const BigInteger = require('./biginteger')
const Mnemonic = require('./mnemonic')
const Numeral = require('numeral')
const SecureRandomString = require('secure-random-string')
const Transaction = require('./transaction')
const TurtleCoinCrypto = require('./turtlecoin-crypto')()
const Varint = require('varint')

/* This sets up the ability for the caller to specify
   their own cryptographic functions to use for parts
   of the methods used by this module. It is tracked outside
   of the instance of the module instance as there are
   a number of function calls that are not directly exposed
   to the caller to prevent confusion */
const userCryptoFunctions = {}

const SIZES = {
  KEY: 64,
  CHECKSUM: 8
}

const UINT64_MAX = BigInteger(2).pow(64)
const CURRENT_TX_VERSION = 1

/**
 * User-defined external cryptography methods
 * @external Crypto
 */

/**
 * A user-defined check ring signatures method
 * @function external:Crypto.CheckRingSignatures
 * @param {string} transactionPrefixHash - the transaction prefix hash
 * @param {string} keyImage - the key image to use during the checking process
 * @param {string[]} inputKeys - the output keys to use during the checking process
 * @param {string[]} signatures - the signatures to verify during the checking process
 * @returns {boolean} Whether the signatures are valid
 */

/**
 * A user-defined CryptoNight Fast hash method
 * @function external:Crypto.CNFastHash
 * @param {string} data - hexadecimal data to hash
 * @returns {string} the hexadecimal representation of the hash
 */

/**
 * A user-defined derive public key method
 * @function external:Crypto.DerivePublicKey
 * @param {string} derivedKey - the derived key
 * @param {number} outputIndex - the index of the output in the transaction
 * @param {string} publicSpendKey - the public spend key of the wallet
 * @returns {string} the public key
 */

/**
 * A user-defined derive secret key method
 * @function external:Crypto.DeriveSecretKey
 * @param {string} derivedKey - the derived key
 * @param {number} outputIndex - the index of the output in the transaction
 * @param {string} privateSpendKey - the private spend key of the wallet
 * @returns {string} the secret key
 */

/**
 * A user-defined generate key derivation method
 * @function external:Crypto.GenerateKeyDerivation
 * @param {string} transactionPublicKey - the transaction public key
 * @param {string} privateViewKey - the private view key of the wallet
 * @returns {string} the key derivation
 */

/**
 * A user-defined generate key image method
 * @function external:Crypto.GenerateKeyImage
 * @param {string} publicKey - a public key
 * @param {string} privateKey - a private key
 * @returns {string} the key image
 */

/**
 * A user-defined generate ring signatures method
 * @function external:Crypto.GenerateRingSignatures
 * @param {string} transactionPrefixHash - the transaction prefix hash
 * @param {string} keyImage - the key image to use during the signing process
 * @param {string[]} inputKeys - the output keys to use during the signing process
 * @param {string} privateKey - the private emphermal to use during the signing process
 * @param {number} realIndex - the input key index of the real output being spent
 * @returns {string[]} the ring signatures
 */

/**
 * A user-defined secret key to public key method
 * @function external:Crypto.SecretKeyToPublicKey
 * @param {string} privateKey - the private key to use in this operation
 * @returns {string} the public key
 */

/**
 * A user-defined underive public key method
 * @function external:Crypto.UnderivePublicKey
 * @param {string} derivation - the derivation
 * @param {number} outputIndex - the index of the output in the transaction
 * @param {string} outputKey - the output key to underive from
 * @returns {string} the public key
 */

/**
  * Class representing a CryptoNote implementation
  * @module CryptoNote
  * @class
  */
class CryptoNote {
  /**
   * A structure containing the configuration for this library
   * @typedef {Object} Config
   * @property {number} [coinUnitPlaces=2] - The number of decimal places in the human readable form of the amount
   * @property {number} [addressPrefix=3914525] - The decimal representation of the wallet address prefix
   * @property {number} [keccakIterations=1] - The number of KDF iterations to perform for KDF operations
   * @property {number} [defaultNetworkFee=10] - The default network fee for transactions in atomic units
   * @property {number} [mmMiningBlockVersion=2] - The block version at which merged mining was enabled
   * @property {external:Crypto.CheckRingSignatures} [checkRingSignatures] - A user-defined check ring signatures method
   * @property {external:Crypto.CNFastHash} [cnFastHash] - A user-defined CryptoNight Fast hash method
   * @property {external:Crypto.DerivePublicKey} [derivePublicKey] - A user-defined derive public key method
   * @property {external:Crypto.DeriveSecretKey} [deriveSecretKey] - A user-defined derive secret key method
   * @property {external:Crypto.GenerateKeyDerivation} [generateKeyDerivation] - A user-defined generate key derivation method
   * @property {external:Crypto.GenerateKeyImage} [generateKeyImage] - A user-defined generate key image method
   * @property {external:Crypto.GenerateRingSignatures} [generateRingSignatures] - A user-defined generate ring signatures method
   * @property {external:Crypto.SecretKeyToPublicKey} [secretKeyToPublicKey] - A user-defined secret key to private key method
   * @property {external:Crypto.UnderivePublicKey} [underivePublicKey] - A user-defined underive public key method
   */

  /**
   * A decoded address prefix
   * @typedef {Object} AddressPrefix
   * @property {string} prefix - The encoded address prefix
   * @property {string} base58 - The Base58 encoded address prefix
   * @property {number} decimal - The decimal encoded address prefix
   * @property {string} hexadecimal - The hexadecimal encoded address prefix
   */

  /**
   * A decoded address structure
   * @typedef {Object} Address
   * @property {string} publicViewKey - The public view key of the address
   * @property {string} publicSpendKey - The public spend key of the address
   * @property {string} paymentId - The payment ID included in an integrated address
   * @property {string} encodedPrefix - the encoded address prefix
   * @property {number} prefix - The decimal encoded address prefix
   * @property {string} rawAddress - The hexadecimal encoded address
   */

  /**
   * A public/private key pair
   * @typedef {Object} KeyPair
   * @property {string} privateKey - The private key
   * @property {string} publicKey - The public key
   */

  /**
   * A Wallet Address Structure
   * @typedef {Object} Wallet
   * @property {KeyPair} spend - The spend key pair
   * @property {KeyPair} view - The view key pair
   * @property {string} address - The Base58 encoded wallet address
   * @property {string} mnemonic - The wallet mnemonic phrase
   * @property {string} seed - The wallet seed
   */

  /**
   * The generated input of an output that belongs to us
   * @typedef {Object} GeneratedInput
   * @property {KeyPair} transactionKey - The key pair of the input transaction
   * @property {string} publicEphemeral - The public Ephemeral of the output
   * @property {string} [privateEphemeral] - The private Ephemeral of the output
   */

  /**
   * A transaction output
   * @typedef {Object} Output
   * @property {string} key - The output key
   * @property {number} index - The output index (in the list of transaction outputs)
   * @property {number} globalIndex - The output global index in the blockchain
   * @property {number} amount - The amount of the output
   * @property {string} [type] - The type of the output
   * @property {string} [keyImage] - The generated key image of the output
   * @property {GeneratedInput} [input] - The generated input of the output
   */

  /**
   * A generated output for a new transaction
   * @typedef {Object} GeneratedOutput
   * @property {number} amount - The amount of the generated output
   * @property {Address} keys - The recipient of the output
   */

  /**
   * A random output for mixing
   * @typedef {Object} RandomOutput
   * @property {string} key - The output key
   * @property {number} globalIndex - The output global index in the blockchain
   */

  /**
   * A newly generated transaction
   * @typedef GeneratedTransaction
   * @property {Transaction} transaction - A Transaction object
   * @property {string} rawTransaction - A hexadecimal representation of the transaction
   * @property {string} hash - The transaction hash
   */

  /**
   * Initializes a new CryptoNote object
   * @constructs
   * @param {Config} [config] - A configuration object for the object
   */
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

      /* The checks below are for detecting custom caller
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

      if (typeof config.checkRingSignatures === 'function') {
        userCryptoFunctions.checkRingSignatures = config.checkRingSignatures
      }

      if (typeof config.generateKeyDerivation === 'function') {
        userCryptoFunctions.generateKeyDerivation = config.generateKeyDerivation
      }
    }
  }

  /**
   * Creates a new wallet seed using the supplied entropy and iteration count
   * @param {string} [entropy=random] - random data for entropy purposes
   * @param {number} [iterations=1] - the number of times to perform a simple KDF operation on the entropy
   * @returns {string} the new seed in hexadecimal
   */
  createNewSeed (entropy, iterations) {
    iterations = iterations || this.config.keccakIterations

    /* If you don't supply us with entropy, we'll go find our own */
    entropy = entropy || SecureRandomString({ length: 256 })

    /* We're going to take that entropy, throw a random value on
       to it, feed it through a poor very simple PBKDF2 implementation
       to create a seed using the supplied entropy */
    return scReduce32(simpleKdf(entropy + rand32(), iterations))
  }

  /**
   * Creates a new wallet
   * @param {string} [entropy=random] - random data for entropy purposes
   * @param {string} [lang=en] - language for the returned mnemonic
   * @param {number} [addressPrefix=3914525] - decimal representation of the CryptoNote address prefix
   * @returns {Wallet} A newly generated wallet
   */
  createNewAddress (entropy, lang, addressPrefix) {
    addressPrefix = addressPrefix || this.config.addressPrefix

    /* Let's create our new seed */
    const seed = this.createNewSeed(entropy)

    /* Using that seed, let's create our new CryptoNote address */
    return this.createAddressFromSeed(seed, lang, addressPrefix)
  }

  /**
   * Creates a new wallet from a wallet seed
   * @param {string} seed - hexadecimal representation of the wallet seed
   * @param {string} [lang=en] - language for the returned mnemonic
   * @param {number} [addressPrefix=3914525] - decimal representation of the CryptoNote address prefix
   * @returns {Wallet} The wallet restored from the provided seed
   */
  createAddressFromSeed (seed, lang, addressPrefix) {
    addressPrefix = addressPrefix || this.config.addressPrefix

    /* When we have a seed, then we can create a new key
       pair based on that seed */
    lang = lang || 'english'
    const keys = {}

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

  /**
   * Creates a new wallet from mnemonic seed phrase
   * @param {string} mnemonic - the wallet mnemonic seed phrase
   * @param {string} [lang=en] - language for the returned mnemonic
   * @param {number} [addressPrefix=3914525] - decimal representation of the CryptoNote address prefix
   * @returns {Wallet} The wallet restored from the provided mnemonic phrase
   */
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

  /**
   * Creates a new wallet from keys
   * @param {string} privateSpendKey - the wallet private spend key
   * @param {string} privateViewKey - the wallet private view key
   * @param {number} [addressPrefix=3914525] - decimal representation of the CryptoNote address prefix
   * @returns {Wallet} The wallet restored from the provided private spend and view keys
   */
  createAddressFromKeys (privateSpendKey, privateViewKey, addressPrefix) {
    addressPrefix = addressPrefix || this.config.addressPrefix

    const derivedViewKey = scReduce32(cnFastHash(privateSpendKey))

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

  /**
   * Decodes the address prefix from the given wallet address
   * @param {string} address - the wallet address
   * @returns {AddressPrefix} The address prefix structure
   */
  decodeAddressPrefix (address) {
    /* First we decode the address from Base58 into the raw address */
    var decodedAddress
    try {
      decodedAddress = Base58.decode(address)
    } catch (err) {
      throw new Error('Could not Base58 decode supplied address. Please check the length and try again.: ' + err.toString())
    }

    /* Now we need to work in reverse, starting with chopping off
       the checksum which is always the same */
    decodedAddress = decodedAddress.slice(0, -(SIZES.CHECKSUM))

    /* Now we find out how many extra characters there are
       in what's left after we find all of the keys in the address.
       Remember, this works because payment IDs are the same size as keys */
    const prefixLength = decodedAddress.length % SIZES.KEY

    /* Great, now we that we know how long the prefix length is, we
       can grab just that from the front of the address information */
    const prefixDecoded = decodedAddress.slice(0, prefixLength)

    /* Then we can decode it into the integer that it represents */
    const prefixVarint = decodeVarint(prefixDecoded)

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
    const prefixVarintLength = prefixVarint.toString().length

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
    const prefixEncoded = address.slice(0, Math.ceil(prefixVarintLength / 2) + offset)

    return {
      prefix: prefixDecoded,
      base58: prefixEncoded,
      decimal: prefixVarint,
      hexadecimal: prefixVarint.toString(16)
    }
  }

  /**
   * Decodes the given address into its respective parts
   * @param {string} address - the wallet address
   * @param {number} [addressPrefix=3914525] - decimal representation of the CryptoNote address prefix
   * @returns {Address} The decoded address structure
   */
  decodeAddress (address, addressPrefix) {
    addressPrefix = addressPrefix || this.config.addressPrefix

    /* First, we decode the base58 string to hex */
    var decodedAddress
    try {
      decodedAddress = Base58.decode(address)
    } catch (err) {
      throw new Error('Could not Base58 decode supplied address. Please check the length and try again.: ' + err.toString())
    }

    /* We need to encode the address prefix from our config
       so that we can compare it later */
    const encodedPrefix = encodeVarint(addressPrefix)

    /* Let's chop off the prefix from the address we decoded */
    const prefix = decodedAddress.slice(0, encodedPrefix.length)

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

  /**
   * Encodes a raw (hex) address into Base58
   * @param {string} rawAddress - the hexadecimal representation of the address
   * @returns {string} the address in Base58
   */
  encodeRawAddress (rawAddress) {
    if (!isHex(rawAddress)) {
      throw new Error('Supplied Raw address must be hexadecimal characters')
    }

    if (rawAddress.length % 2 !== 0) {
      throw new Error('Supplied Raw address must be an even number of characters')
    }

    try {
      return Base58.encode(rawAddress)
    } catch (err) {
      throw new Error('Could not encode supplied Raw Address to Base58.: ' + err.toString())
    }
  }

  /**
   * Encodes the public information into a wallet address
   * @param {string} publicViewKey - the wallet public view key
   * @param {string} publicSpendKey - the wallet public spend key
   * @param {string} [paymentId=""] - a 64 hexadecimal character payment ID
   * @param {number} [addressPrefix=3914525] - decimal representation of the CryptoNote address prefix
   * @returns {string} the address in Base58
   */
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

  /**
   * Creates an integrated address from the supplied wallet address and payment ID
   * @param {string} address - the wallet address
   * @param {string} [paymentId=""] - a 64 hexadecimal character payment ID
   * @param {number} [addressPrefix=3914525] - decimal representation of the CryptoNote address prefix
   * @returns {string} The Base58 Integrated address
   */
  createIntegratedAddress (address, paymentId, addressPrefix) {
    addressPrefix = addressPrefix || this.config.addressPrefix

    /* Decode our address */
    const addr = this.decodeAddress(address)

    /* Encode the address but this time include the payment ID */
    return this.encodeAddress(addr.publicViewKey, addr.publicSpendKey, paymentId, addressPrefix)
  }

  /**
   * Generates the public key for the given private key
   * @param {string} privateKey - the private key
   * @returns {string} the resulting public key
   */
  privateKeyToPublicKey (privateKey) {
    return privateKeyToPublicKey(privateKey)
  }

  /**
   * Checks all outputs to determine if any of the outputs belong to the keys provided
   * @param {string} transactionPublicKey - the transaction public key
   * @param {Array} outputs - the array of outputs of a transaction
   * @param {string} privateViewKey - the private view key of the wallet
   * @param {string} publicSpendKey - the public spend key of the wallet
   * @param {string} [privateSpendKey] - the private spend key of the wallet
   * @returns {Output[]} An array of outputs that belong to the keys provided
   */
  scanTransactionOutputs (transactionPublicKey, outputs, privateViewKey, publicSpendKey, privateSpendKey) {
    /* Given the transaction public key and the array of outputs, let's see if
       any of the outputs belong to us */

    const ourOutputs = []

    for (var i = 0; i < outputs.length; i++) {
      const output = outputs[i]

      /* Check to see if this output belongs to us */
      const ourOutput = this.isOurTransactionOutput(transactionPublicKey, output, privateViewKey, publicSpendKey, privateSpendKey)
      if (ourOutput) {
        ourOutputs.push(ourOutput)
      }
    }

    return ourOutputs
  }

  /**
   * Checks a particular output to determine if it belongs to the keys provided
   * @param {string} transactionPublicKey - the transaction public key
   * @param {Object} output - the transaction output to check
   * @param {string} privateViewKey - the private view key of the wallet
   * @param {string} publicSpendKey - the public spend key of the wallet
   * @param {string} [privateSpendKey] - the private spend key of the wallet
   * @returns {boolean|Output} If the transaction output is ours
   */
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

  /**
   * Generates the key image of an output that is required to spend it
   * @param {string} transactionPublicKey - the transaction public key
   * @param {string} privateViewKey - the private view key of the wallet
   * @param {string} publicSpendKey - the public spend key of the wallet
   * @param {string} privateSpendKey - the private spend key of the wallet
   * @param {number} outputIndex - the index of the output in the transaction
   * @returns {string} the hexadecimal representation of the key image
   */
  generateKeyImage (transactionPublicKey, privateViewKey, publicSpendKey, privateSpendKey, outputIndex) {
    if (!isHex64(transactionPublicKey)) {
      throw new Error('Invalid transaction public key format')
    }

    if (!isHex64(privateViewKey)) {
      throw new Error('Invalid private view key format')
    }
    /* Generate the key deriviation from the random transaction public key and our private view key */
    const derivation = this.generateKeyDerivation(transactionPublicKey, privateViewKey)

    return this.generateKeyImagePrimitive(publicSpendKey, privateSpendKey, outputIndex, derivation)
  }

  /**
   * Generates the key image primitive of an output that is required to spend it
   * @param {string} publicSpendKey - the wallet public spend key
   * @param {string} privateSpendKey - the wallet private spend key
   * @param {number} outputIndex - the index of the output in the transaction
   * @param {string} derivation - the output derivation
   * @returns {string} the hexadecimal representation of the key image
   */
  generateKeyImagePrimitive (publicSpendKey, privateSpendKey, outputIndex, derivation) {
    /* If the user already has a derivation, they can pass that in instead of
       the privateViewKey and transactionPublicKey */
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

  /**
   * Creates pretty (base 10) outputs for the address and amount specified
   * @param {string} address - the destination wallet address
   * @param {number} amount - the total amount for which we need to generate outputs
   * @returns {GeneratedOutput[]} The generated outputs for the specified recipient and amount
   */
  createTransactionOutputs (address, amount) {
    amount = amount || false

    /* If we didn't specify an amount we can't send anything */
    if (!amount || amount < 0) {
      throw new Error('You must specify a valid amount')
    }

    const result = []

    /* Decode the address into it's important bits */
    const addressDecoded = this.decodeAddress(address)

    /* Now we need to decompose the amount into "pretty" amounts
       that we can actually mix later. We're doing this by
       converting the amount to a character array and reversing
       it so that we have the digits in each place */
    const amountChars = amount.toString().split('').reverse()

    /* Loop through the amount characters */
    for (var i = 0; i < amountChars.length; i++) {
      /* Create pretty amounts */
      const amt = parseInt(amountChars[i]) * Math.pow(10, i)

      if (amt !== 0) {
        result.push({
          amount: amt,
          keys: addressDecoded
        })
      }
    }

    return result
  }

  /**
   * Creates a new Transaction object using the supplied values
   * @param {GeneratedOutput[]} newOutputs - The outputs of the new transaction
   * @param {Output[]} ourOutputs - The outputs we are spending
   * @param {RandomOutput[]} randomOuts - The random outputs to mix with
   * @param {number} mixin - The mixin count to use
   * @param {number} feeAmount - The transaction fee to use
   * @param {string} [paymentId=""] - The payment ID to use with the transaction
   * @param {number} [unlockTime=0] - The unlock time for the transaction
   * @param {boolean} [_async=false] - Whether we are calling this method asynchronously or not
   * @returns {boolean|Transaction} A newly generated transaction
   */
  createTransactionStructure (newOutputs, ourOutputs, randomOuts, mixin, feeAmount, paymentId, unlockTime, _async) {
    return createTransaction(newOutputs, ourOutputs, randomOuts, mixin, feeAmount, paymentId, unlockTime, _async)
  }

  /**
   * Creates a new Transaction object using the supplied values
   * @param {GeneratedOutput[]} newOutputs - The outputs of the new transaction
   * @param {Output[]} ourOutputs - The outputs we are spending
   * @param {RandomOutput[]} randomOuts - The random outputs to mix with
   * @param {number} mixin - The mixin count to use
   * @param {number} feeAmount - The transaction fee to use
   * @param {string} [paymentId=""] - The payment ID to use with the transaction
   * @param {number} [unlockTime=0] - The unlock time for the transaction
   * @returns {boolean|GeneratedTransaction} A newly generated transaction
   */
  createTransaction (newOutputs, ourOutputs, randomOuts, mixin, feeAmount, paymentId, unlockTime) {
    const tx = this.createTransactionStructure(newOutputs, ourOutputs, randomOuts, mixin, feeAmount, paymentId, unlockTime, false)

    return {
      transaction: tx,
      rawTransaction: tx.blob,
      hash: tx.hash
    }
  }

  /**
   * Creates a new Transaction using the supplied values in an asynchronous manner
   * @async
   * @param {GeneratedOutput[]} newOutputs - The outputs of the new transaction
   * @param {Output[]} ourOutputs - The outputs we are spending
   * @param {RandomOutput[]} randomOuts - The random outputs to mix with
   * @param {number} mixin - The mixin count to use
   * @param {number} feeAmount - The transaction fee to use
   * @param {string} [paymentId=""] - The payment ID to use with the transaction
   * @param {number} [unlockTime=0] - The unlock time for the transaction
   * @returns {boolean|GeneratedTransaction} A newly generated transaction
   */
  createTransactionAsync (newOutputs, ourOutputs, randomOuts, mixin, feeAmount, paymentId, unlockTime) {
    return this.createTransactionStructure(
      newOutputs, ourOutputs, randomOuts, mixin, feeAmount, paymentId, unlockTime, true
    ).then((tx) => {
      return {
        transaction: tx,
        rawTransaction: tx.blob,
        hash: tx.hash
      }
    })
  }

  /**
   * Formats the amount into a human readable form
   * @param {number} amount - the amount to format
   * @returns {string} the human readable amount
   */
  formatMoney (amount) {
    var places = ''
    for (var i = 0; i < this.config.coinUnitPlaces; i++) {
      places += '0'
    }
    return Numeral(amount / Math.pow(10, this.config.coinUnitPlaces)).format('0,0.' + places)
  }

  /**
   * Generates a key derivation from the supplied keys
   * @param {string} transactionPublicKey - the transaction public key
   * @param {string} privateViewKey - the wallet private view key
   * @returns {string} the key derivation
   */
  generateKeyDerivation (transactionPublicKey, privateViewKey) {
    return generateKeyDerivation(transactionPublicKey, privateViewKey)
  }

  /**
   * Underives the public key from the supplied derivation and other values
   * @param {string} derivation - the derivation
   * @param {number} outputIndex - the index of the output in the transaction
   * @param {string} outputKey - the output key to underive from
   * @returns {string} the public key
   */
  underivePublicKey (derivation, outputIndex, outputKey) {
    if (!isHex64(derivation)) {
      throw new Error('Invalid derivation key format')
    }

    if (userCryptoFunctions.underivePublicKey) {
      userCryptoFunctions.underivePublicKey(derivation, outputIndex, outputKey)
    }

    const [err, key] = TurtleCoinCrypto.underivePublicKey(derivation, outputIndex, outputKey)

    if (err) throw new Error('Could not underive public key')

    return key
  }

  /**
   * Converts a list of absolute output offsets to relative offsets
   * @param {number[]|string[]} offsets - the offsets
   * @returns {string[]} the relative offsets
   */
  absoluteToRelativeOffsets (offsets) {
    return absoluteToRelativeOffsets(offsets)
  }

  /**
   * Converts a list of relative output offsets to absolute offsets
   * @param {number[]|string[]} offsets - the offsets
   * @returns {string[]} the absolute offsets
   */
  relativeToAbsoluteOffsets (offsets) {
    return relativeToAbsoluteOffsets(offsets)
  }

  /**
   * Hashes the the supplied data with the CryptoNight Fast Hash method
   * @param {string} data - hexadecimal representation of data to hash
   * @returns {string} hexadecimal representation of the hash
   */
  cnFastHash (data) {
    return cnFastHash(data)
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

function bin2hex (bin) {
  const result = []
  for (var i = 0; i < bin.length; ++i) {
    result.push(('0' + bin[i].toString(16)).slice(-2))
  }

  return result.join('')
}

function str2bin (str) {
  const result = new Uint8Array(str.length)
  for (var i = 0; i < str.length; i++) {
    result[i] = str.charCodeAt(i)
  }

  return result
}

function rand32 () {
  /* Go get 256-bits (32 bytes) of random data */
  try {
    return Mnemonic.random(256)
  } catch (err) {
    throw new Error('Could not retrieve 32-bytes of random data: ' + err.toString())
  }
}

function encodeVarint (val) {
  const buf = Buffer.from(Varint.encode(val))
  return buf.toString('hex')
}

function decodeVarint (hex) {
  const buffer = Buffer.from(hex, 'hex')
  return parseInt(Varint.decode(buffer))
}

function scReduce32 (hex) {
  const [err, result] = TurtleCoinCrypto.scReduce32(hex)

  if (err) throw new Error('Could not scReduce32')

  return result
}

function derivePublicKey (derivation, outputIndex, publicKey) {
  if (derivation.length !== SIZES.KEY) {
    throw new Error('Invalid derivation length')
  }

  if (!isHex64(publicKey)) {
    throw new Error('Invalid public key format')
  }

  if (userCryptoFunctions.derivePublicKey) {
    return userCryptoFunctions.derivePublicKey(derivation, outputIndex, publicKey)
  }

  const [err, key] = TurtleCoinCrypto.derivePublicKey(derivation, outputIndex, publicKey)

  if (err) throw new Error('Could not derive public key')

  return key
}

function deriveSecretKey (derivation, outputIndex, privateKey) {
  if (derivation.length !== SIZES.KEY) {
    throw new Error('Invalid derivation length')
  }

  if (!isHex64(privateKey)) {
    throw new Error('Invalid secret key format')
  }

  if (userCryptoFunctions.deriveSecretKey) {
    return userCryptoFunctions.deriveSecretKey(derivation, outputIndex, privateKey)
  }

  const [err, key] = TurtleCoinCrypto.deriveSecretKey(derivation, outputIndex, privateKey)

  if (err) throw new Error('Could not derive secret key')

  return key
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
  }

  const [err, keyImage] = TurtleCoinCrypto.generateKeyImage(publicKey, privateKey)

  if (err) throw new Error('Could not generate key image')

  return keyImage
}

function privateKeyToPublicKey (privateKey) {
  if (privateKey.length !== SIZES.KEY) {
    throw new Error('Invalid secret key length')
  }

  if (userCryptoFunctions.secretKeyToPublicKey) {
    return userCryptoFunctions.secretKeyToPublicKey(privateKey)
  }

  const [err, key] = TurtleCoinCrypto.secretKeyToPublicKey(privateKey)

  if (err) throw new Error('Could not derive public key from secret key')

  return key
}

function cnFastHash (input) {
  if (input.length % 2 !== 0 || !isHex(input)) {
    throw new Error('Invalid input: ' + input)
  }

  if (userCryptoFunctions.cnFastHash) {
    return userCryptoFunctions.cnFastHash(input)
  }

  const [err, hash] = TurtleCoinCrypto.cn_fast_hash(input)

  if (err) throw new Error('Could not calculate CN Fast Hash')

  return hash
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

  const privateKey = scReduce32(seed)

  const publicKey = privateKeyToPublicKey(privateKey)

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
  const temp = offsets.slice()
  if (temp.length < 2) {
    return temp
  }

  for (var i = temp.length - 1; i >= 1; --i) {
    temp[i] = BigInteger(temp[i]).subtract(temp[i - 1]).toString()
  }

  /* All the other offsets are strings, not numbers. It still works, but, muh
     autism */
  temp[0] = temp[0].toString()

  return temp
}

function relativeToAbsoluteOffsets (offsets) {
  const temp = offsets.slice()

  if (temp.length < 2) {
    return temp
  }

  for (var i = 1; i < temp.length; i++) {
    temp[i] = BigInteger(temp[i - 1]).add(temp[i]).toString()
  }

  temp[0] = temp[0].toString()

  return temp
}

function generateRingSignature (transactionPrefixHash, keyImage, inputKeys, privateKey, realIndex) {
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

  var signatures

  if (userCryptoFunctions.generateRingSignatures) {
    signatures = userCryptoFunctions.generateRingSignatures(transactionPrefixHash, keyImage, inputKeys, privateKey, realIndex)
  } else {
    const [err, sigs] = TurtleCoinCrypto.generateRingSignatures(transactionPrefixHash, keyImage, inputKeys, privateKey, realIndex)

    if (err) return new Error('Could not generate ring signatures')

    signatures = sigs
  }

  var validSigs = false

  if (userCryptoFunctions.checkRingSignatures) {
    validSigs = userCryptoFunctions.checkRingSignatures(transactionPrefixHash, keyImage, inputKeys, signatures)
  } else {
    validSigs = TurtleCoinCrypto.checkRingSignatures(transactionPrefixHash, keyImage, inputKeys, signatures)
  }

  if (!validSigs) {
    return new Error('Could not verify generated ring signatures')
  }

  return signatures
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
    if (newOutputs[i].amount <= 0) throw new Error('Cannot create an output with an amount <= 0')
    neededMoney = neededMoney.add(newOutputs[i].amount)
    if (neededMoney.compare(UINT64_MAX) !== -1) {
      throw new Error('Total output amount exceeds UINT64_MAX')
    }
  }

  /* Make sure that we're not trying to spend more money than
     is actually possible within the confines of a uint64 */
  var foundMoney = BigInteger.ZERO
  for (i = 0; i < ourOutputs.length; i++) {
    if (ourOutputs[i].amount <= 0) throw new Error('Cannot spend outputs with an amount <= 0')
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
  const cmp = neededMoney.compare(foundMoney)
  if (cmp < 0) {
    change = foundMoney.subtract(neededMoney)
    if (change.compare(feeAmount) !== 0) {
      throw new Error('We have not spent all of what we have passed in')
    }
  } else if (cmp > 0) {
    throw new Error('We need more money than was currently supplied for the transaction')
  }

  /* Create our transaction inputs using the helper function */
  const transactionInputs = createTransactionInputs(ourOutputs, randomOutputs, mixin)

  /* Prepare our transaction outputs using the helper function */
  const transactionOutputs = prepareTransactionOutputs(newOutputs, _async)

  /* Start constructing our actual transaction */
  const tx = new Transaction()
  tx.version = CURRENT_TX_VERSION
  tx.unlockTime = unlockTime
  tx.transactionKeys = transactionOutputs.transactionKeys

  /* If there is a payment ID add it to the transaction */
  if (isHex64(paymentId)) {
    tx.addPaymentId(paymentId)
  }

  transactionInputs.sort(function (a, b) {
    return (BigInteger.parse(a.keyImage, 16).compare(BigInteger.parse(b.keyImage, 16)) * -1)
  })

  transactionInputs.forEach((input) => {
    const inputToKey = {
      type: '02',
      amount: input.amount,
      keyImage: input.keyImage,
      keyOffsets: []
    }

    input.outputs.forEach((output) => {
      inputToKey.keyOffsets.push(output.index)
    })

    inputToKey.keyOffsets = absoluteToRelativeOffsets(inputToKey.keyOffsets)

    tx.inputs.push(inputToKey)
  })

  /* Add the transaction public key to the transaction */
  tx.addPublicKey(transactionOutputs.transactionKeys.publicKey)

  if (_async) {
    /* Use Promise.resolve so even if the result isn't a promise, it still
       works */
    return Promise.resolve(transactionOutputs.outputs).then((outputs) => {
      outputs.forEach((output) => {
        tx.outputs.push(output)
      })

      const txPrefixHash = tx.prefixHash

      const sigPromises = []

      for (i = 0; i < transactionInputs.length; i++) {
        const txInput = transactionInputs[i]

        const srcKeys = []
        txInput.outputs.forEach((out) => {
          srcKeys.push(out.key)
        })

        const sigPromise = Promise.resolve(generateRingSignature(
          txPrefixHash, txInput.keyImage, srcKeys, txInput.input.privateEphemeral, txInput.realOutputIndex
        )).then((sigs) => {
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
      tx.outputs.push(output)
    })

    const txPrefixHash = tx.prefixHash

    for (i = 0; i < transactionInputs.length; i++) {
      const txInput = transactionInputs[i]

      const srcKeys = []
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

  const mixedInputs = []

  /* Loop through our outputs that we're using to send funds */
  for (i = 0; i < ourOutputs.length; i++) {
    const mixedOutputs = []
    const realOutput = ourOutputs[i]

    if (realOutput.amount <= 0) throw new Error('Real Inputs cannot have an amount <= 0')

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
  let promises = []

  if (_async) {
    promises = outputs.map((output, i) => {
      if (output.amount <= 0) {
        throw new Error('Cannot have an amount <= 0')
      }

      return Promise.resolve(generateKeyDerivation(
        output.keys.publicViewKey, transactionKeys.privateKey
      )).then((outDerivation) => {
        return Promise.resolve(derivePublicKey(outDerivation, i, output.keys.publicSpendKey))
      }).then((outEphemeralPub) => {
        return ({
          amount: output.amount,
          key: outEphemeralPub,
          type: '02'
        })
      })
    })
  } else {
    for (var i = 0; i < outputs.length; i++) {
      const output = outputs[i]
      if (output.amount <= 0) {
        throw new Error('Cannot have an amount <= 0')
      }

      const outDerivation = generateKeyDerivation(output.keys.publicViewKey, transactionKeys.privateKey)

      /* Generate the one time output key */
      const outEphemeralPub = derivePublicKey(outDerivation, i, output.keys.publicSpendKey)

      /* Push it on to our stack */
      preparedOutputs.push({
        amount: output.amount,
        key: outEphemeralPub,
        type: '02'
      })
    }
  }

  if (_async) {
    return {
      transactionKeys,
      outputs: Promise.all(promises).then((outputs) => {
        return outputs
      })
    }
  }

  return { transactionKeys, outputs: preparedOutputs }
}

function generateKeyDerivation (transactionPublicKey, privateViewKey) {
  if (!isHex64(transactionPublicKey)) {
    throw new Error('Invalid public key format')
  }

  if (!isHex64(privateViewKey)) {
    throw new Error('Invalid secret key format')
  }

  if (userCryptoFunctions.generateKeyDerivation) {
    return userCryptoFunctions.generateKeyDerivation(transactionPublicKey, privateViewKey)
  }

  const [err, derivation] = TurtleCoinCrypto.generateKeyDerivation(transactionPublicKey, privateViewKey)

  if (err) throw new Error('Could not generate key derivation')

  return derivation
}

module.exports = CryptoNote
