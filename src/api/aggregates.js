import axios from 'axios'
import {ipfs_push} from './create'
import {DEFAULT_SERVER} from './base'

export async function fetch_one(address, key, {api_server = DEFAULT_SERVER} = {}) {
  let response = await axios.get(`${api_server}/api/v0/aggregates/${address}.json?keys=${key}`)
  if ((response.data.data !== undefined) && (response.data.data[key] !== undefined))
  {
    return response.data.data[key]
  } else
    return null
}

export async function fetch(address, {keys = null, api_server = DEFAULT_SERVER} = {}) {
  let response = await axios.get(
    `${api_server}/api/v0/aggregates/${address}.json`,
    {keys: keys})
  if ((response.data.data !== undefined))
  {
    return response.data.data
  } else
    return null
}

export async function fetch_profile(address, {api_server = DEFAULT_SERVER} = {}) {
  return await fetch_one(address, ['profile'], {'api_server': api_server})
}

export async function submit(address, key, content,
                             {chain='NULS', channel=null,
                              api_server = DEFAULT_SERVER} = {}) {
  let post_content = {
    'address': address,
    'key': key,
    'content': content,
    'time': Date.now() / 1000
  }

  let hash = await ipfs_push(post_content, {api_server: api_server})
  let message = {
    'item_hash': hash,
    'chain': chain,
    'channel': channel,
    'sender': address,
    'type': 'AGGREGATE',
    'time': Date.now() / 1000
  }
  return message
}
