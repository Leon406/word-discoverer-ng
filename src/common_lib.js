import { compressToBase64, decompressFromBase64 } from 'lz-string'

export function request_unhighlight(lemma) {
  sendMessage({ wdm_unhighlight: lemma })
}
export function sendMessage(msg) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, msg)
  })
}

/**
 * 如需使用 chrome.scripting API，请在清单中声明 "scripting" 权限，以及要将脚本注入的网页的主机权限。
 * refer https://developer.chrome.com/docs/extensions/reference/api/scripting?hl=zh-cn
 */
export function eval_func(func, args = []) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func,
      args
    })
  })
}

export function open_local_tab(url, cb) {
  chrome.tabs.create({ url: chrome.runtime.getURL(url) }, cb)
}

/**
 * 压缩字符串，提高url query传递长度
 */
export function compress(text) {
    return compressToBase64(text)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
}

export function decompress(text) {
  if (!text) return
  text = text.replace(/-/g, '+').replace(/_/g, '/');
  while (text.length % 4) {
    text += '=';
  }
  return decompressFromBase64(text)
}

export function readerService() {
  const sentenceKey = 'sentence'
  const newEle = document.getElementById('new')
  const input = document.getElementById('input')
  const deleteEle = document.getElementById('delete')
  const sentenceEle = document.getElementById('text-to-read')

  chrome.storage.local.get(sentenceKey, result => {
    let previouseSentence = decompress(result.sentence)
    if (previouseSentence) {
      input.value = previouseSentence
      sentenceEle.innerHTML = previouseSentence
    }

    // todo 解析和删除 暂时通过刷新页面同步词频数据
    newEle.onclick = function() {
      sentenceEle.innerHTML = input.value
      chrome.storage.local.set({sentence: compress(input.value)},function() {
         location.reload()
      })
    }
    deleteEle.onclick = function() {
      input.value = ''
      sentenceEle.innerHTML = ''
      chrome.storage.local.remove(sentenceKey,function() {
        location.reload()
      })
    }
  });
}

export function idClickFunc(id, func) {
  document.getElementById(id).addEventListener('click', func)
}

export function make_id_suffix(text) {
  const before = btoa(text.replace(/['’]/g, '_'))
  const after = before
    .replace(/\+/g, '_')
    .replace(/\//g, '-')
    .replace(/=/g, '_')
  return after
}

export function add_lexeme(lexeme, result_handler) {
  const req_keys = [
    'words_discoverer_eng_dict',
    'wd_idioms',
    'wd_user_vocabulary',
    'wd_user_vocab_added',
    'wd_user_vocab_deleted'
  ]
  chrome.storage.local.get(req_keys, function(result) {
    const dict_words = result.words_discoverer_eng_dict
    const dict_idioms = result.wd_idioms
    const user_vocabulary = result.wd_user_vocabulary
    const { wd_user_vocab_added } = result
    const { wd_user_vocab_deleted } = result
    if (lexeme.length > 100) {
      result_handler('bad', undefined)
      return
    }
    lexeme = lexeme.toLowerCase().trim()
    if (!lexeme) {
      result_handler('bad', undefined)
      return
    }

    let key = lexeme
    if (dict_words.hasOwnProperty(lexeme)) {
      const wf = dict_words[lexeme]
      if (wf) {
        const [first] = wf
        key = first
      }
    } else if (dict_idioms.hasOwnProperty(lexeme)) {
      const wf = dict_idioms[lexeme]
      if (wf && wf !== -1) {
        key = wf
      }
    }

    if (user_vocabulary.hasOwnProperty(key)) {
      result_handler('exists', key)
      return
    }

    const new_state = { wd_user_vocabulary: user_vocabulary }

    user_vocabulary[key] = 1
    if (typeof wd_user_vocab_added !== 'undefined') {
      wd_user_vocab_added[key] = 1
      new_state.wd_user_vocab_added = wd_user_vocab_added
    }
    if (typeof wd_user_vocab_deleted !== 'undefined') {
      delete wd_user_vocab_deleted[key]
      new_state.wd_user_vocab_deleted = wd_user_vocab_deleted
    }

    chrome.storage.local.set(new_state, function() {
      result_handler('ok', key)
    })
  })
}

export function add_lexeme2(lexeme, result_handler) {
  const req_keys = [
    'words_discoverer_eng_dict',
    'wd_idioms',
    'wd_user_vocabulary'
  ]
  chrome.storage.local.get(req_keys, function(result) {
    const dict_words = result.words_discoverer_eng_dict
    const dict_idioms = result.wd_idioms
    const user_vocabulary = result.wd_user_vocabulary
    if (lexeme.length > 100) {
      result_handler('bad', undefined)
      return
    }
    lexeme = lexeme.toLowerCase().trim()
    if (!lexeme) {
      result_handler('bad', undefined)
      return
    }
    let added = []
    lexeme.split(/[\n;；]+/).forEach(
      lemma => {
        let key = lemma
        console.log('lemma add', lemma)
        if (dict_words.hasOwnProperty(lemma)) {
          const wf = dict_words[lemma]
          if (wf) {
            const [first] = wf
            key = first
          }
        } else if (dict_idioms.hasOwnProperty(lemma)) {
          const wf = dict_idioms[lemma]
          if (wf && wf !== -1) {
            key = wf
          }
        }

        if (!user_vocabulary.hasOwnProperty(key)) {
          user_vocabulary[key] = 1
          added.push(key)
        }
      })

    if (added.length) {
      const new_state = { wd_user_vocabulary: user_vocabulary }
      console.log('lemma add', added)
      chrome.storage.local.set(new_state, function() {
        result_handler('ok', added)
      })
    } else {
      result_handler('exists', undefined)
    }

  })
}

export function delete_lexeme(lexeme, result_handler) {
  const req_keys = [
    'words_discoverer_eng_dict',
    'wd_idioms',
    'wd_user_vocabulary'
  ]
  chrome.storage.local.get(req_keys, function(result) {
    const dict_words = result.words_discoverer_eng_dict
    const dict_idioms = result.wd_idioms
    const user_vocabulary = result.wd_user_vocabulary
    if (lexeme.length > 100) {
      result_handler('bad', undefined)
      return
    }
    lexeme = lexeme.toLowerCase().trim()
    if (!lexeme) {
      result_handler('bad', undefined)
      return
    }
    let deleted = []
    lexeme.split(/[\n;；]+/).forEach(
      lemma => {
        console.log('lemma del', lemma)
        let key = lemma
        if (dict_words.hasOwnProperty(lemma)) {
          const wf = dict_words[lemma]
          if (wf) {
            const [first] = wf
            key = first
          }
        } else if (dict_idioms.hasOwnProperty(lemma)) {
          const wf = dict_idioms[lemma]
          if (wf && wf !== -1) {
            key = wf
          }
        }
        if (user_vocabulary.hasOwnProperty(key)) {
          delete user_vocabulary[key]
          deleted.push(key)
        }
      }
    )

    if (deleted.length) {
      console.log('lemma del', deleted)
      const new_state = { wd_user_vocabulary: user_vocabulary }
      chrome.storage.local.set(new_state, function() {
        result_handler('delOk', deleted)
      })
    }

  })
}

export function make_hl_style(hl_params) {
  if (!hl_params.enabled) return undefined
  let result = ''
  if (hl_params.bold) result += 'font-weight:bold;'
  if (hl_params.useBackground)
    result += `background-color:${hl_params.backgroundColor};`
  if (hl_params.useColor) result += `color:${hl_params.color};`
  if (!result) return undefined
  result += 'font-size:inherit;'
  return result
}

export function localizeHtmlPage() {
  // Localize by replacing __MSG_***__ meta tags
  const objects = document.getElementsByTagName('html')
  for (let j = 0; j < objects.length; j++) {
    const obj = objects[j]
    const valStrH = obj.innerHTML.toString()
    const valNewH = valStrH.replace(/__MSG_(\w+)__/g, function(match, v1) {
      return v1 ? chrome.i18n.getMessage(v1) : ''
    })
    if (valNewH !== valStrH) {
      obj.innerHTML = valNewH
    }
  }
}

export function make_class_name(lemma) {
  if (lemma) {
    return `wdhl_${make_id_suffix(lemma)}`
  }
  return 'wdhl_none_none'
}

export function unhighlight(lemma) {
  const wdclassname = make_class_name(lemma)
  const hlNodes = document.getElementsByClassName(wdclassname)
  Array.from(hlNodes).forEach((span) => {
    span.setAttribute(
      'style',
      'font-weight:inherit;color:inherit;background-color:inherit;'
    )
    span.setAttribute('class', 'wdhl_none_none')
  })
}
