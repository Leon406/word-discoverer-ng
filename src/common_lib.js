export function request_unhighlight(lemma) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { wdm_unhighlight: lemma })
  })
}

/**
 * 如需使用 chrome.scripting API，请在清单中声明 "scripting" 权限，以及要将脚本注入的网页的主机权限。
 * refer https://developer.chrome.com/docs/extensions/reference/api/scripting?hl=zh-cn
 */
export function eval_func(func, args = []) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func,
      args
    })
  })
}

export function make_id_suffix(text) {
  const before = btoa(text.replace(/['’]/g, '_'))
  const after = before
    .replace(/\+/g, '_')
    .replace(/\//g, '-')
    .replace(/=/g, '_')
  return after
}

export function sync_if_needed() {
  const req_keys = ['wd_last_sync', 'wd_gd_sync_enabled', 'wd_last_sync_error']
  chrome.storage.local.get(req_keys, function (result) {
    const { wd_last_sync } = result
    const { wd_gd_sync_enabled } = result
    const { wd_last_sync_error } = result
    if (!wd_gd_sync_enabled || wd_last_sync_error != null) {
      return
    }
    const cur_date = new Date()
    const mins_passed = (cur_date.getTime() - wd_last_sync) / (60 * 1000)
    const sync_period_mins = 30
    if (mins_passed >= sync_period_mins) {
      chrome.runtime.sendMessage({
        wdm_request: 'gd_sync',
        interactive_mode: false,
      })
    }
  })
}

export function add_lexeme(lexeme, result_handler) {
  const req_keys = [
    'words_discoverer_eng_dict',
    'wd_idioms',
    'wd_user_vocabulary',
    'wd_user_vocab_added',
    'wd_user_vocab_deleted',
  ]
  chrome.storage.local.get(req_keys, function (result) {
    const dict_words = result.words_discoverer_eng_dict
    const dict_idioms = result.wd_idioms
    const user_vocabulary = result.wd_user_vocabulary
    const { wd_user_vocab_added } = result
    const { wd_user_vocab_deleted } = result
    if (lexeme.length > 100) {
      result_handler('bad', undefined)
      return
    }
    lexeme = lexeme.toLowerCase()
    lexeme = lexeme.trim()
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

    chrome.storage.local.set(new_state, function () {
      sync_if_needed()
      result_handler('ok', key)
    })
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
  result += 'font-size:inherit;display:inline;'
  return result
}

export function localizeHtmlPage() {
  // Localize by replacing __MSG_***__ meta tags
  const objects = document.getElementsByTagName('html')
  for (let j = 0; j < objects.length; j++) {
    const obj = objects[j]
    const valStrH = obj.innerHTML.toString()
    const valNewH = valStrH.replace(/__MSG_(\w+)__/g, function (match, v1) {
      return v1 ? chrome.i18n.getMessage(v1) : ''
    })
    if (valNewH !== valStrH) {
      obj.innerHTML = valNewH
    }
  }
}

