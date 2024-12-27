import { initContextMenus, make_default_online_dicts } from './context_menu_lib'
import { LRUCache } from 'lru-cache'

const options = {
  max: 200,
  dispose: (value, key) => {
    console.info('Cache Evict', key)
  }
}

const cacheAudio = new LRUCache(options)

let db

function initDatabase() {
  const request = indexedDB.open('WordDiscovererDB', 1)

  request.onerror = function(event) {
    console.error('Database error:', event.target.errorCode)
  }

  request.onsuccess = function(event) {
    db = event.target.result
    console.log('Database initialized.')
  }

  request.onupgradeneeded = function(event) {
    db = event.target.result
    const objectStore = db.createObjectStore('dictionary', { keyPath: 'q' })
    objectStore.createIndex('q', 'q', { unique: true })
  }
}

function saveToIndexedDB(q, data) {
  const transaction = db.transaction(['dictionary'], 'readwrite')
  const objectStore = transaction.objectStore('dictionary')
  const request = objectStore.add({ q: q.toLowerCase(), data: data })

  request.onsuccess = function(event) {
    console.info(`\x1B[31msaved to DB ==> \x1B[34m${q}`)
  }

  request.onerror = function(event) {
    console.error('Error saving data to IndexedDB:', event.target.errorCode)
  }
}

function getFromIndexedDB(q) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['dictionary'], 'readonly')
    const objectStore = transaction.objectStore('dictionary')
    const request = objectStore.get(q.toLowerCase())

    request.onsuccess = function(event) {
      resolve(event.target.result ? event.target.result.data : null)
    }

    request.onerror = function(event) {
      reject(event.target.errorCode)
    }
  })
}


function do_load_dictionary(file_text) {
  const lines = file_text.split(/[\r\n]+/)
  const rare_words = {}
  let rank = 0
  for (let i = 0; i < lines.length; ++i) {
    const fields = lines[i].split('\t')
    if (!fields.length) break
    const lemma = fields[0]
    rank++
    fields.forEach(item => {
        if (item) {
          rare_words[item] = [lemma, rank]
          if (item.includes('’')) {
            rare_words[item.replace(/’/g, '\'')] = [lemma, rank]
          }
        }
      }
    )

  }
  const local_storage = chrome.storage.local
  local_storage.set({ words_discoverer_eng_dict: rare_words })
  chrome.storage.sync.set({ wd_word_max_rank: rank })
}

function load_eng_dictionary() {
  const file_path = chrome.runtime.getURL('../assets/eng_dict.txt')
  fetch(file_path)
    .then((res) => res.text())
    .then(do_load_dictionary)
}

function deriveKey(key, rare_words, value) {
  let tmp = key.replace(/’/g, '\'')
  if (tmp !== key) {
    rare_words[tmp] = value
  }
}

function do_load_idioms(file_text) {
  const lines = file_text.split(/[\r\n]+/).filter(line => !line.startsWith('#'))
  const rare_words = {}

  for (let lno = 0; lno < lines.length; ++lno) {
    const fields = lines[lno].split('\t')
    if (!fields.length) break
    const idiom = fields[0]
    fields.forEach(item => {
      if (item) {
        const words = item.toLowerCase().split(' ')
        for (let i = 0; i + 1 < words.length; ++i) {
          const key = words.slice(0, i + 1).join(' ')
          if (key) rare_words[key] = -1
          deriveKey(key, rare_words, -1)
        }
        const key = item.toLowerCase()
        rare_words[key] = idiom
        deriveKey(key, rare_words, idiom)
      }
    })
  }
  const local_storage = chrome.storage.local
  local_storage.set({ wd_idioms: rare_words })
}

function load_idioms() {
  const file_path = chrome.runtime.getURL('../assets/eng_idioms.txt')
  fetch(file_path)
    .then((res) => res.text())
    .then(do_load_idioms)
}

function initialize_extension() {
  initDatabase()
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === 'fetch') {
      getFromIndexedDB(request.q)
        .then(cachedData => {
          if (cachedData) {
            console.info(`\tcache: \x1b[43m${request.q}`)
            sendResponse(cachedData)
          } else {
            console.log('fetch bing: ', request.q)
            return fetch(
              `https://cn.bing.com/dict/clientsearch?mkt=zh-CN&setLang=zh&form=BDVEHC&ClientVer=BDDTV3.5.1.4320&q=${encodeURIComponent(request.q)}`
            ).then(response => response.text())
              .then(html => {
                const minimizeHtml = html
                  .replace(/<script [\s\S]+?<\/script>/g, '')
                  .replace(/<head[\s\S]+?<\/head>/g, '')
                  // 删除无用跳转数据
                  .replace(/<span id="anchor1">[\s\S]+?<span id="dictionaryvoiceid"><\/span>/g, '</div></div></div>')
                // console.log("minimizeHtml",minimizeHtml)
                saveToIndexedDB(request.q, minimizeHtml)
                sendResponse(minimizeHtml)
              })
          }
        })
        .catch(error => {
          console.error('Error handling message:', error)
          sendResponse(null) // 或者返回一个错误对象
        })

      return true // Will respond asynchronously.
    } else if (request.type === 'fetchArrayBuffer') {
      let cached = cacheAudio.get(request.audioUrl)
      if (cached) {
        console.info(`\tarraybuffer cache: ${request.audioUrl} size: ${cacheAudio.size}`)
        sendResponse(cached)
      } else {
        console.log('request fetchArrayBuffer', request.audioUrl)
        fetch(request.audioUrl)
          .then(response => response.arrayBuffer())
          .then((buffer) => {
            let jsonBuffer = JSON.stringify({
              data: Array.apply(null, new Uint8Array(buffer))
            })
            cacheAudio.set(request.audioUrl, jsonBuffer)
            return jsonBuffer
          })
          .then(sendResponse)
          .catch(error => {
            console.error('Error fetching array buffer:', error)
            sendResponse(null) // 或者返回一个错误对象
          })
      }

      return true // Will respond asynchronously.
    } else if (request.wdm_request === 'hostname') {
      const tab_url = sender.tab.url
      const url = new URL(tab_url)
      const domain = url.hostname
      sendResponse({ wdm_hostname: domain })
    } else if (request.wdm_request === 'page_language') {
      chrome.tabs.detectLanguage(sender.tab.id, function(iso_language_code) {
        sendResponse({ wdm_iso_language_code: iso_language_code })
      })
      return true // Will respond asynchronously.
    } else if (request.wdm_verdict) {
      if (request.wdm_verdict === 'keyboard') {
        chrome.action.setIcon({
          path: '../assets/no_dynamic.png',
          tabId: sender.tab.id
        })
      } else {
        chrome.action.setIcon({
          path: '../assets/result48_gray.png',
          tabId: sender.tab.id
        })
      }
      sendResponse() // 确保发送空响应
    } else if (request.wdm_new_tab_url) {
      const fullUrl = request.wdm_new_tab_url
      chrome.tabs.create({ url: fullUrl }, function(tab) {
      })
      sendResponse() // 确保发送空响应
    } else if (request.type === 'tts_speak') {
      if (!!request.word && typeof request.word === 'string') {
        chrome.tts.speak(request.word, { lang: 'en', gender: 'male' })
      }
      sendResponse() // 确保发送空响应
    }
  })

  function loadConfig() {
    chrome.storage.sync.get(['wd_show_percents',
      'wd_is_enabled',
      'wd_hl_settings',
      'wd_online_dicts',
      'wd_hover_settings',
      'wd_black_list',
      'wd_white_list',
      'wd_enable_tts'], function(result) {
      let {
        wd_hl_settings,
        wd_enable_tts,
        wd_hover_settings,
        wd_online_dicts,
        wd_show_percents,
        wd_black_list,
        wd_white_list,
        wd_is_enabled
      } = result
      const default_options = {}
      if (typeof wd_hl_settings === 'undefined') {
        const word_hl_params = {
          enabled: true,
          quoted: false,
          bold: true,
          useBackground: false,
          backgroundColor: 'rgb(255, 248, 220)',
          useColor: true,
          color: 'red'
        }
        const idiom_hl_params = {
          enabled: true,
          quoted: false,
          bold: true,
          useBackground: false,
          backgroundColor: 'rgb(255, 248, 220)',
          useColor: true,
          color: 'blue'
        }
        wd_hl_settings = {
          wordParams: word_hl_params,
          idiomParams: idiom_hl_params
        }
        default_options['wd_hl_settings'] = wd_hl_settings
      }
      if (typeof wd_enable_tts === 'undefined') {
        default_options['wd_enable_tts'] = false
      }
      if (typeof wd_hover_settings === 'undefined') {
        wd_hover_settings = { hl_hover: 'always', ow_hover: 'never' }
        default_options['wd_hover_settings'] = wd_hover_settings
      }
      if (typeof wd_online_dicts === 'undefined') {
        wd_online_dicts = make_default_online_dicts()
        default_options['wd_online_dicts'] = wd_online_dicts
      }
      initContextMenus(wd_online_dicts)

      if (typeof wd_show_percents === 'undefined') {
        default_options['wd_show_percents'] = 12
      }
      if (typeof wd_is_enabled === 'undefined') {
        default_options['wd_is_enabled'] = true
      }
      if (typeof wd_black_list === 'undefined') {
        default_options['wd_black_list'] = {}
      }
      if (typeof wd_white_list === 'undefined') {
        default_options['wd_white_list'] = {}
      }
      if (Object.keys(default_options).length) {
        chrome.storage.sync.set(default_options)
      }
    })
  }

  chrome.storage.local.get(
    ['wd_user_vocabulary'],
    function(result) {
      load_eng_dictionary()
      load_idioms()
      const user_vocabulary = result.wd_user_vocabulary
      if (typeof user_vocabulary === 'undefined') {
        chrome.storage.local.set({ wd_user_vocabulary: {} })
      }
      loadConfig()
    }
  )
}

initialize_extension()
