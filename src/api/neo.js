import core from '@cityofzion/neon-core'
import neon from '@cityofzion/neon-js'
import { v4 as uuid } from 'uuid'
import * as bip39 from 'bip39'
import * as bip32 from 'bip32'

function get_verification_string(message) {
  // Returns a serialized string to verify the message integrity
  return `${message.chain}\n${message.sender}\n${message.type}\n${message.item_hash}`
}

export async function new_account() {
  let mnemonics =  bip39.generateMnemonic()
  // let pkey = core.wallet.generatePrivateKey()
  // let wif = core.wallet.getWIFFromPrivateKey(pkey)
  return import_account({
    'mnemonics': mnemonics
  })
}

async function _from_wallet(walletobj, mnemonics, name) {
  if (walletobj) {
    let account = {
      'mnemonics': mnemonics,
      'public_key': walletobj.publicKey,
      'private_key': walletobj.privateKey,
      'wif': walletobj.WIF,
      'address': walletobj.address,
      'type': 'NEO',
      'source': 'integrated'
    }
    if (name)
      account['name'] = name
    else
      account['name'] = account['address']
    console.log(account)

    return account
  }
  return null
}

export async function import_account({
  private_key = null, wif = null,
  name = null, mnemonics = null } = {}) {

  if (mnemonics) {
    console.log(mnemonics)
    let v = await bip39.mnemonicToSeed(mnemonics)
    let b = bip32.fromSeed(v)
    private_key = b.privateKey.toString('hex')
    wif = core.wallet.getWIFFromPrivateKey(private_key)
  }

  let walletobj = null
  if (wif) {
    walletobj = new core.wallet.Account(wif)
  } else if (private_key !== null) {
    walletobj = new core.wallet.Account(private_key)
  }
  return await _from_wallet(walletobj, mnemonics, name)
}

export async function sign(account, message) {
  const salt = uuid().replace(/-/g, '')

  const verif_buffer = get_verification_string(message)
  
  const parameterHexString = neon.u.str2hexstring(salt + verif_buffer)

  const lengthHex = neon.u.num2VarInt(parameterHexString.length / 2)
  const concatenated_string = lengthHex + parameterHexString
  const message_hex = '010001f0' + concatenated_string + '0000'
  
  const signature_data = neon.sign.hex(message_hex, account.private_key)
  let signature_object = {
    publicKey: account.public_key, // Public key of account that signed message
    salt: salt, // Salt added to original message as prefix, before signing
    data: signature_data // Signed message
  }
  message.signature = JSON.stringify(signature_object)
  return message
}