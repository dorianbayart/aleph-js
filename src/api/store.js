import {
  ipfs_push_file, storage_push_file,
  sign_and_broadcast, put_content} from './create'
import axios from 'axios'
import {DEFAULT_SERVER} from './base'

export async function submit(
  address, {
    file_hash = null, fileobject = null,
    storage_engine = 'storage',
    chain = null, channel = null, api_server = DEFAULT_SERVER,
    account = null } = {}) {

  if ((file_hash === null) && (fileobject === null)) {
    throw "You must either provide a hash and an engine or a fileobject" 
  }
  
  if (fileobject !== null) {
    // let's try to upload it ourselves
    if (storage_engine === 'storage') {
      file_hash = await storage_push_file(fileobject, {
        api_server: api_server
      })
    } else if (storage_engine === 'ipfs') {
      file_hash = await ipfs_push_file(fileobject, {
        api_server: api_server
      })
    } else {
      throw "Unsupported storage engine"
    }

    if (file_hash === null) {
      throw "Upload error"
    }
  }

  let store_content = {
    'address': address,
    'item_type': storage_engine,
    'item_hash': file_hash,
    'time': Date.now() / 1000
  }
  let message = {
    'chain': chain,
    'channel': channel,
    'sender': address,
    'type': 'STORE',
    'time': Date.now() / 1000
  }
  await put_content(message, store_content, true, storage_engine, api_server)

  await sign_and_broadcast(message, account, api_server)

  message['content'] = store_content

  return message
}

export async function retrieve(file_hash, {api_server = DEFAULT_SERVER} = {}) {
  try {
    let response = await axios.get(`${api_server}/api/v0/storage/raw/${file_hash}?find`,
      {
        responseType: 'arraybuffer'
      })
    if (response.status === 200) {
      return response.data
    } else {
      return null
    }
  } catch (err) {
    return null
  }
}