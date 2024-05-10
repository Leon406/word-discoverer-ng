/******/ "use strict";
/******/ var __webpack_modules__ = ({

/***/ "./src/common_lib.js":
/*!***************************!*\
  !*** ./src/common_lib.js ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   add_lexeme: () => (/* binding */ add_lexeme),
/* harmony export */   localizeHtmlPage: () => (/* binding */ localizeHtmlPage),
/* harmony export */   make_hl_style: () => (/* binding */ make_hl_style),
/* harmony export */   make_id_suffix: () => (/* binding */ make_id_suffix),
/* harmony export */   request_unhighlight: () => (/* binding */ request_unhighlight),
/* harmony export */   sync_if_needed: () => (/* binding */ sync_if_needed)
/* harmony export */ });
function request_unhighlight(lemma) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { wdm_unhighlight: lemma })
  })
}

function make_id_suffix(text) {
  const before = btoa(text)
  const after = before
    .replace(/\+/g, '_')
    .replace(/\//g, '-')
    .replace(/=/g, '_')
  return after
}

function sync_if_needed() {
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

function add_lexeme(lexeme, result_handler) {
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

function make_hl_style(hl_params) {
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

function localizeHtmlPage() {
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



/***/ }),

/***/ "./src/context_menu_lib.js":
/*!*********************************!*\
  !*** ./src/context_menu_lib.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   context_handle_add_result: () => (/* binding */ context_handle_add_result),
/* harmony export */   createDictionaryEntry: () => (/* binding */ createDictionaryEntry),
/* harmony export */   get_dict_definition_url: () => (/* binding */ get_dict_definition_url),
/* harmony export */   initContextMenus: () => (/* binding */ initContextMenus),
/* harmony export */   make_default_online_dicts: () => (/* binding */ make_default_online_dicts),
/* harmony export */   onClickHandler: () => (/* binding */ onClickHandler),
/* harmony export */   showDefinition: () => (/* binding */ showDefinition)
/* harmony export */ });
/* harmony import */ var _common_lib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./common_lib */ "./src/common_lib.js");


const isoLangs = {
  ab: 'Abkhaz',
  aa: 'Afar',
  af: 'Afrikaans',
  ak: 'Akan',
  sq: 'Albanian',
  am: 'Amharic',
  ar: 'Arabic',
  an: 'Aragonese',
  hy: 'Armenian',
  as: 'Assamese',
  av: 'Avaric',
  ae: 'Avestan',
  ay: 'Aymara',
  az: 'Azerbaijani',
  bm: 'Bambara',
  ba: 'Bashkir',
  eu: 'Basque',
  be: 'Belarusian',
  bn: 'Bengali',
  bh: 'Bihari',
  bi: 'Bislama',
  bs: 'Bosnian',
  br: 'Breton',
  bg: 'Bulgarian',
  my: 'Burmese',
  ca: 'Catalan',
  ch: 'Chamorro',
  ce: 'Chechen',
  ny: 'Chichewa',
  zh: 'Chinese',
  cv: 'Chuvash',
  kw: 'Cornish',
  co: 'Corsican',
  cr: 'Cree',
  hr: 'Croatian',
  cs: 'Czech',
  da: 'Danish',
  dv: 'Divehi',
  nl: 'Dutch',
  en: 'English',
  eo: 'Esperanto',
  et: 'Estonian',
  ee: 'Ewe',
  fo: 'Faroese',
  fj: 'Fijian',
  fi: 'Finnish',
  fr: 'French',
  ff: 'Fula',
  gl: 'Galician',
  ka: 'Georgian',
  de: 'German',
  el: 'Greek',
  gu: 'Gujarati',
  ht: 'Haitian',
  ha: 'Hausa',
  he: 'Hebrew',
  hz: 'Herero',
  hi: 'Hindi',
  ho: 'Hiri Motu',
  hu: 'Hungarian',
  ia: 'Interlingua',
  id: 'Indonesian',
  ie: 'Interlingue',
  ga: 'Irish',
  ig: 'Igbo',
  ik: 'Inupiaq',
  io: 'Ido',
  is: 'Icelandic',
  it: 'Italian',
  iu: 'Inuktitut',
  ja: 'Japanese',
  jv: 'Javanese',
  kl: 'Kalaallisut',
  kn: 'Kannada',
  kr: 'Kanuri',
  ks: 'Kashmiri',
  kk: 'Kazakh',
  km: 'Khmer',
  ki: 'Kikuyu',
  rw: 'Kinyarwanda',
  ky: 'Kirghiz',
  kv: 'Komi',
  kg: 'Kongo',
  ko: 'Korean',
  ku: 'Kurdish',
  kj: 'Kwanyama',
  la: 'Latin',
  lb: 'Luxembourgish',
  lg: 'Luganda',
  li: 'Limburgish',
  ln: 'Lingala',
  lo: 'Lao',
  lt: 'Lithuanian',
  lu: 'Luba-Katanga',
  lv: 'Latvian',
  gv: 'Manx',
  mk: 'Macedonian',
  mg: 'Malagasy',
  ms: 'Malay',
  ml: 'Malayalam',
  mt: 'Maltese',
  mh: 'Marshallese',
  mn: 'Mongolian',
  na: 'Nauru',
  nv: 'Navajo',
  nd: 'Ndebele',
  ne: 'Nepali',
  ng: 'Ndonga',
  nn: 'Norwegian',
  no: 'Norwegian',
  ii: 'Nuosu',
  nr: 'Ndebele',
  oc: 'Occitan',
  oj: 'Ojibwe',
  om: 'Oromo',
  or: 'Oriya',
  os: 'Ossetian',
  pa: 'Panjabi',
  fa: 'Persian',
  pl: 'Polish',
  ps: 'Pashto',
  pt: 'Portuguese',
  qu: 'Quechua',
  rm: 'Romansh',
  rn: 'Kirundi',
  ro: 'Romanian',
  ru: 'Russian',
  sc: 'Sardinian',
  sd: 'Sindhi',
  se: 'Sami',
  sm: 'Samoan',
  sg: 'Sango',
  sr: 'Serbian',
  gd: 'Gaelic',
  sn: 'Shona',
  si: 'Sinhala',
  sk: 'Slovak',
  sl: 'Slovene',
  so: 'Somali',
  st: 'Sotho',
  es: 'Spanish',
  su: 'Sundanese',
  sw: 'Swahili',
  ss: 'Swati',
  sv: 'Swedish',
  ta: 'Tamil',
  te: 'Telugu',
  tg: 'Tajik',
  th: 'Thai',
  ti: 'Tigrinya',
  bo: 'Tibetan',
  tk: 'Turkmen',
  tl: 'Tagalog',
  tn: 'Tswana',
  to: 'Tonga',
  tr: 'Turkish',
  ts: 'Tsonga',
  tt: 'Tatar',
  tw: 'Twi',
  ty: 'Tahitian',
  ug: 'Uighur',
  uk: 'Ukrainian',
  ur: 'Urdu',
  uz: 'Uzbek',
  ve: 'Venda',
  vi: 'Vietnamese',
  wa: 'Walloon',
  cy: 'Welsh',
  wo: 'Wolof',
  fy: 'Frisian',
  xh: 'Xhosa',
  yi: 'Yiddish',
  yo: 'Yoruba',
  za: 'Zhuang',
}

function get_dict_definition_url(dictUrl, text) {
  return dictUrl + encodeURIComponent(text)
}

function showDefinition(dictUrl, text) {
  const fullUrl = get_dict_definition_url(dictUrl, text)
  chrome.tabs.create({ url: fullUrl }, function (tab) {
    // opens definition in a new tab
  })
}

function createDictionaryEntry(title, dictUrl, entryId) {
  chrome.contextMenus.create({
    title,
    contexts: ['selection'],
    id: entryId,
  })
  chrome.contextMenus.onClicked.addListener(function (info, tab) {
    const word = info.selectionText
    showDefinition(dictUrl, word)
  })
}

function context_handle_add_result(report, lemma) {
  if (report === 'ok') {
    (0,_common_lib__WEBPACK_IMPORTED_MODULE_0__.request_unhighlight)(lemma)
  }
}

function onClickHandler(info, tab) {
  const word = info.selectionText
  ;(0,_common_lib__WEBPACK_IMPORTED_MODULE_0__.add_lexeme)(word, context_handle_add_result)
}

function make_default_online_dicts() {
  const result = []

  let uiLang = chrome.i18n.getUILanguage()
  uiLang = uiLang.split('-')[0]
  if (uiLang !== 'en' && isoLangs.hasOwnProperty(uiLang)) {
    const langName = isoLangs[uiLang]
    result.push({
      title: `Translate to ${langName} in Google`,
      url: `https://translate.google.com/#en/${uiLang}/`,
    })
  }
  result.push({
    title: 'Define in Merriam-Webster',
    url: 'https://www.merriam-webster.com/dictionary/',
  })
  result.push({
    title: 'Define in Google',
    url: 'https://encrypted.google.com/search?hl=en&gl=en&q=define:',
  })
  result.push({
    title: 'View pictures in Google',
    url: 'https://encrypted.google.com/search?hl=en&gl=en&tbm=isch&q=',
  })
  return result
}

function initContextMenus(dictPairs) {
  chrome.contextMenus.removeAll(function () {
    const title = chrome.i18n.getMessage('menuItem')
    chrome.contextMenus.create({
      title,
      contexts: ['selection'],
      id: 'vocab_select_add',
    })
    chrome.contextMenus.onClicked.addListener(onClickHandler)
    chrome.contextMenus.create({
      type: 'separator',
      contexts: ['selection'],
      id: 'wd_separator_id',
    })
    for (let i = 0; i < dictPairs.length; ++i) {
      createDictionaryEntry(
        dictPairs[i].title,
        dictPairs[i].url,
        `wd_define_${i}`,
      )
    }
  })
}


/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __webpack_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = (exports) => {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ })();
/******/ 
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!***************************!*\
  !*** ./src/background.js ***!
  \***************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _context_menu_lib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./context_menu_lib */ "./src/context_menu_lib.js");


let gapi_loaded = false
let gapi_inited = false

// TODO check chrome.runtime.lastError for all storage.local operations

function do_load_dictionary(file_text) {
  const lines = file_text.split('\n')
  const rare_words = {}
  let rank = 0
  let prev_lemma = null
  for (let i = 0; i < lines.length; ++i) {
    const fields = lines[i].split('\t')
    if (i + 1 === lines.length && fields.length === 1) break
    const form = fields[0]
    const lemma = fields[1]
    if (lemma !== prev_lemma) {
      rank += 1
      prev_lemma = lemma
    }
    rare_words[fields[0]] = [fields[1], rank]
  }
  const local_storage = chrome.storage.local
  local_storage.set({ words_discoverer_eng_dict: rare_words })
  local_storage.set({ wd_word_max_rank: rank })
}

function load_eng_dictionary() {
  const file_path = chrome.runtime.getURL('../assets/eng_dict.txt')
  fetch(file_path)
    .then((res) => res.text())
    .then(do_load_dictionary)
}

function do_load_idioms(file_text) {
  const lines = file_text.split('\n')
  const rare_words = {}
  for (let lno = 0; lno < lines.length; ++lno) {
    const fields = lines[lno].split('\t')
    if (lno + 1 === lines.length && fields.length === 1) break
    const words = fields[0].split(' ')
    for (let i = 0; i + 1 < words.length; ++i) {
      const key = words.slice(0, i + 1).join(' ')
      rare_words[key] = -1
    }
    const key = fields[0]
    rare_words[key] = fields[1]
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

function report_sync_failure(error_msg) {
  chrome.storage.local.set({ wd_last_sync_error: error_msg }, function () {
    chrome.runtime.sendMessage({ sync_feedback: 1 })
  })
}

function load_script(url, callback_func) {
  const request = new XMLHttpRequest()
  request.onreadystatechange = function () {
    if (request.readyState !== 4) return
    if (request.status !== 200) return
    // eslint-disable-next-line no-eval
    eval(request.responseText)
    callback_func()
  }
  request.open('GET', url)
  request.send()
}

function authorize_user(interactive_authorization) {
  chrome.identity.getAuthToken(
    { interactive: interactive_authorization },
    function (token) {
      if (token === undefined) {
        report_sync_failure('Unable to get oauth token')
      } else {
        gapi.client.setToken({ access_token: token })
        sync_user_vocabularies()
      }
    },
  )
}

function transform_key(src_key) {
  let dc = window.atob(src_key)
  dc = dc.substring(3)
  dc = dc.substring(0, dc.length - 6)
  return dc
}

function generate_key() {
  const protokey =
    'b2ZCQUl6YVN5Q2hqM2xvZkJPWnV2TUt2TGNCSlVaa0RDTUhZa25NWktBa25NWktB'
  return transform_key(protokey)
}

function list_to_set(src_list) {
  const result = {}
  for (let i = 0; i < src_list.length; ++i) {
    result[src_list[i]] = 1
  }
  return result
}

function substract_from_set(lhs_set, rhs_set) {
  Object.keys(rhs_set).forEach((key) => {
    if (rhs_set.hasOwnProperty(key) && lhs_set.hasOwnProperty(key)) {
      delete lhs_set[key]
    }
  })
}

function add_to_set(lhs_set, rhs_set) {
  Object.keys(rhs_set).forEach((key) => {
    if (rhs_set.hasOwnProperty(key)) {
      lhs_set[key] = 1
    }
  })
}

function serialize_vocabulary(entries) {
  const keys = []
  Object.keys(entries).forEach((key) => {
    if (entries.hasOwnProperty(key)) {
      keys.push(key)
    }
  })
  keys.sort()
  return keys.join('\r\n')
}

function parse_vocabulary(text) {
  // code duplication with parse_vocabulary in import.js
  const lines = text.split('\n')
  const found = []
  for (let i = 0; i < lines.length; ++i) {
    let word = lines[i]
    if (i + 1 === lines.length && word.length <= 1) break
    if (word.slice(-1) === '\r') {
      word = word.slice(0, -1)
    }
    found.push(word)
  }
  return found
}

function create_new_dir(dir_name, success_cb) {
  const body = {
    name: dir_name,
    mimeType: 'application/vnd.google-apps.folder',
    appProperties: { wdfile: '1' },
  }
  const req_params = {
    path: 'https://www.googleapis.com/drive/v3/files/',
    method: 'POST',
    body,
  }
  gapi.client.request(req_params).then(function (jsonResp, rawResp) {
    if (jsonResp.status === 200) {
      success_cb(jsonResp.result.id)
    } else {
      report_sync_failure(`Bad dir create status: ${jsonResp.status}`)
    }
  })
}

function create_new_file(fname, parent_dir_id, success_cb) {
  const body = {
    name: fname,
    parents: [parent_dir_id],
    appProperties: { wdfile: '1' },
    mimeType: 'text/plain',
  }
  const req_params = {
    path: 'https://www.googleapis.com/drive/v3/files',
    method: 'POST',
    body,
  }
  gapi.client.request(req_params).then(function (jsonResp, rawResp) {
    if (jsonResp.status === 200) {
      success_cb(jsonResp.result.id)
    } else {
      report_sync_failure(`Bad file create status: ${jsonResp.status}`)
    }
  })
}

function upload_file_content(file_id, file_content, success_cb) {
  const req_params = {
    path: `https://www.googleapis.com/upload/drive/v3/files/${file_id}`,
    method: 'PATCH',
    body: file_content,
  }
  gapi.client.request(req_params).then(function (jsonResp, rawResp) {
    if (jsonResp.status === 200) {
      success_cb()
    } else {
      report_sync_failure(`Bad upload content status: ${jsonResp.status}`)
    }
  })
}

function fetch_file_content(file_id, success_cb) {
  // https://developers.google.com/drive/v3/web/manage-downloads
  const full_query_url = `https://www.googleapis.com/drive/v3/files/${file_id}?alt=media`
  gapi.client
    .request({ path: full_query_url, method: 'GET' })
    .then(function (jsonResp, rawResp) {
      if (jsonResp.status !== 200) {
        report_sync_failure(
          `Bad status: ${jsonResp.status} for getting content of file: ${file_id}`,
        )
        return
      }
      const file_content = jsonResp.body
      success_cb(file_id, file_content)
    })
}

function find_gdrive_id(query, found_cb, not_found_cb) {
  // generic function to find single object id
  const full_query_url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}`
  gapi.client
    .request({ path: full_query_url, method: 'GET' })
    .then(function (jsonResp, rawResp) {
      if (jsonResp.status !== 200) {
        report_sync_failure(
          `Bad status: ${jsonResp.status} for query: ${query}`,
        )
        return
      }
      if (jsonResp.result.files.length > 1) {
        report_sync_failure(`More than one object found for query: ${query}`)
        return
      }
      if (jsonResp.result.files.length === 1) {
        const drive_id = jsonResp.result.files[0].id
        found_cb(drive_id)
        return
      }
      not_found_cb()
    })
}

function apply_cloud_vocab(entries) {
  const sync_date = new Date()
  const sync_time = sync_date.getTime()
  const new_state = {
    wd_last_sync_error: null,
    wd_user_vocabulary: entries,
    wd_user_vocab_added: {},
    wd_user_vocab_deleted: {},
    wd_last_sync: sync_time,
  }
  chrome.storage.local.set(new_state, function () {
    chrome.runtime.sendMessage({ sync_feedback: 1 })
  })
}

function sync_vocabulary(dir_id, vocab) {
  const merge_and_upload_vocab = function (file_id, file_content) {
    const vocab_list = parse_vocabulary(file_content)
    const entries = list_to_set(vocab_list)
    substract_from_set(entries, vocab.deleted)
    add_to_set(entries, vocab.added)
    const merged_content = serialize_vocabulary(entries)

    const set_merged_vocab = function () {
      apply_cloud_vocab(entries)
    }
    upload_file_content(file_id, merged_content, set_merged_vocab)
  }

  const merge_vocab_to_cloud = function (file_id) {
    fetch_file_content(file_id, merge_and_upload_vocab)
  }

  const vocab_file_name = `${vocab.name}.txt`
  const file_query = `name = '${vocab_file_name}' and trashed = false and appProperties has { key='wdfile' and value='1' } and '${dir_id}' in parents`
  const create_new_file_wrap = function () {
    create_new_file(vocab_file_name, dir_id, merge_vocab_to_cloud)
    const new_added = {}
    add_to_set(new_added, vocab.all)
    add_to_set(new_added, vocab.added)
    vocab.added = new_added
  }
  find_gdrive_id(file_query, merge_vocab_to_cloud, create_new_file_wrap)
}

function backup_vocabulary(dir_id, vocab, success_cb) {
  const merge_and_upload_backup = function (file_id, file_content) {
    const vocab_list = parse_vocabulary(file_content)
    const entries = list_to_set(vocab_list)
    add_to_set(entries, vocab.all)
    add_to_set(entries, vocab.deleted)
    add_to_set(entries, vocab.added)
    const merged_content = serialize_vocabulary(entries)
    upload_file_content(file_id, merged_content, success_cb)
  }
  const merge_backup_to_cloud = function (file_id) {
    fetch_file_content(file_id, merge_and_upload_backup)
  }

  const backup_file_name = `.${vocab.name}.backup`
  const backup_query = `name = '${backup_file_name}' and trashed = false and appProperties has { key='wdfile' and value='1' } and '${dir_id}' in parents`
  const create_new_backup_file_wrap = function () {
    create_new_file(backup_file_name, dir_id, merge_backup_to_cloud)
  }
  find_gdrive_id(
    backup_query,
    merge_backup_to_cloud,
    create_new_backup_file_wrap,
  )
}

function perform_full_sync(vocab) {
  const dir_name = 'Words Discoverer Sync'
  const dir_query = `name = '${dir_name}' and trashed = false and appProperties has { key='wdfile' and value='1' }`
  const backup_and_sync_vocabulary = function (dir_id) {
    const sync_vocabulary_wrap = function () {
      sync_vocabulary(dir_id, vocab)
    }
    backup_vocabulary(dir_id, vocab, sync_vocabulary_wrap)
  }
  const create_new_dir_wrap = function () {
    create_new_dir(dir_name, backup_and_sync_vocabulary)
  }
  find_gdrive_id(dir_query, backup_and_sync_vocabulary, create_new_dir_wrap)
}

function sync_user_vocabularies() {
  chrome.storage.local.get(
    ['wd_user_vocabulary', 'wd_user_vocab_added', 'wd_user_vocab_deleted'],
    function (result) {
      let { wd_user_vocabulary } = result
      let { wd_user_vocab_added } = result
      let { wd_user_vocab_deleted } = result
      if (typeof wd_user_vocabulary === 'undefined') {
        wd_user_vocabulary = {}
      }
      if (typeof wd_user_vocab_added === 'undefined') {
        wd_user_vocab_added = { ...wd_user_vocabulary }
      }
      if (typeof wd_user_vocab_deleted === 'undefined') {
        wd_user_vocab_deleted = {}
      }
      const vocab = {
        name: 'my_vocabulary',
        all: wd_user_vocabulary,
        added: wd_user_vocab_added,
        deleted: wd_user_vocab_deleted,
      }
      perform_full_sync(vocab)
    },
  )
}

function init_gapi(interactive_authorization) {
  const gapikey = generate_key()
  const init_params = { apiKey: gapikey }
  gapi.client.init(init_params).then(
    function () {
      gapi_inited = true
      authorize_user(interactive_authorization)
    },
    function (reject_reason) {
      const error_msg = `Unable to init client. Reject reason: ${reject_reason}`
      console.error(error_msg)
      report_sync_failure(error_msg)
    },
  )
}

function load_and_init_gapi(interactive_authorization) {
  load_script('https://apis.google.com/js/api.js', function () {
    gapi.load('client', function () {
      gapi_loaded = true
      init_gapi(interactive_authorization)
    })
  })
}

function start_sync_sequence(interactive_authorization) {
  chrome.storage.local.set(
    { wd_last_sync_error: 'Unknown sync problem' },
    function () {
      if (!gapi_loaded) {
        load_and_init_gapi(interactive_authorization)
      } else if (!gapi_inited) {
        init_gapi(interactive_authorization)
      } else {
        authorize_user(interactive_authorization)
      }
    },
  )
}

function initialize_extension() {
  chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
      if (request.type === 'fetch') {
        console.log('request', request)
        fetch(
          `https://cn.bing.com/dict/clientsearch?mkt=zh-CN&setLang=zh&form=BDVEHC&ClientVer=BDDTV3.5.1.4320&q=${request.q}`,
        )
          .then((response) => response.text())
          .then(sendResponse)
        return true // Will respond asynchronously.
      }
      if (request.wdm_request === 'hostname') {
        const tab_url = sender.tab.url
        const url = new URL(tab_url)
        const domain = url.hostname
        sendResponse({ wdm_hostname: domain })
      } else if (request.wdm_request === 'page_language') {
        chrome.tabs.detectLanguage(sender.tab.id, function (iso_language_code) {
          sendResponse({ wdm_iso_language_code: iso_language_code })
        })
        return true // This is to indicate that sendResponse would be sent asynchronously and keep the message channel open, see https://developer.chrome.com/extensions/runtime#event-onMessage
      } else if (request.wdm_verdict) {
        if (request.wdm_verdict === 'highlight') {
          chrome.storage.local.get(
            ['wd_gd_sync_enabled', 'wd_last_sync_error'],
            function (result) {
              chrome.action.setIcon(
                { path: '../assets/result48.png', tabId: sender.tab.id },
                function () {
                  if (result.wd_gd_sync_enabled) {
                    if (result.wd_last_sync_error == null) {
                      chrome.action.setBadgeText({
                        text: 'sync',
                        tabId: sender.tab.id,
                      })
                      chrome.action.setBadgeBackgroundColor({
                        color: [25, 137, 0, 255],
                        tabId: sender.tab.id,
                      })
                    } else {
                      chrome.action.setBadgeText({
                        text: 'err',
                        tabId: sender.tab.id,
                      })
                      chrome.action.setBadgeBackgroundColor({
                        color: [137, 0, 0, 255],
                        tabId: sender.tab.id,
                      })
                    }
                  }
                },
              )
            },
          )
        } else if (request.wdm_verdict === 'keyboard') {
          chrome.action.setIcon({
            path: '../assets/no_dynamic.png',
            tabId: sender.tab.id,
          })
        } else {
          chrome.action.setIcon({
            path: '../assets/result48_gray.png',
            tabId: sender.tab.id,
          })
        }
      } else if (request.wdm_new_tab_url) {
        const fullUrl = request.wdm_new_tab_url
        chrome.tabs.create({ url: fullUrl }, function (tab) {})
      } else if (request.wdm_request === 'gd_sync') {
        start_sync_sequence(request.interactive_mode)
      }
    },
  )

  chrome.storage.local.get(
    [
      'words_discoverer_eng_dict',
      'wd_hl_settings',
      'wd_online_dicts',
      'wd_hover_settings',
      'wd_idioms',
      'wd_show_percents',
      'wd_is_enabled',
      'wd_user_vocabulary',
      'wd_black_list',
      'wd_white_list',
      'wd_gd_sync_enabled',
      'wd_enable_tts',
    ],
    function (result) {
      load_eng_dictionary()
      load_idioms()
      let { wd_hl_settings } = result
      if (typeof wd_hl_settings === 'undefined') {
        const word_hl_params = {
          enabled: true,
          quoted: false,
          bold: true,
          useBackground: false,
          backgroundColor: 'rgb(255, 248, 220)',
          useColor: true,
          color: 'red',
        }
        const idiom_hl_params = {
          enabled: true,
          quoted: false,
          bold: true,
          useBackground: false,
          backgroundColor: 'rgb(255, 248, 220)',
          useColor: true,
          color: 'blue',
        }
        wd_hl_settings = {
          wordParams: word_hl_params,
          idiomParams: idiom_hl_params,
        }
        chrome.storage.local.set({ wd_hl_settings })
      }
      const { wd_enable_tts } = result
      if (typeof wd_enable_tts === 'undefined') {
        chrome.storage.local.set({ wd_enable_tts: false })
      }
      let { wd_hover_settings } = result
      if (typeof wd_hover_settings === 'undefined') {
        wd_hover_settings = { hl_hover: 'always', ow_hover: 'never' }
        chrome.storage.local.set({ wd_hover_settings })
      }
      let { wd_online_dicts } = result
      if (typeof wd_online_dicts === 'undefined') {
        wd_online_dicts = (0,_context_menu_lib__WEBPACK_IMPORTED_MODULE_0__.make_default_online_dicts)()
        chrome.storage.local.set({ wd_online_dicts })
      }
      (0,_context_menu_lib__WEBPACK_IMPORTED_MODULE_0__.initContextMenus)(wd_online_dicts)

      const show_percents = result.wd_show_percents
      if (typeof show_percents === 'undefined') {
        chrome.storage.local.set({ wd_show_percents: 15 })
      }
      const { wd_is_enabled } = result
      if (typeof wd_is_enabled === 'undefined') {
        chrome.storage.local.set({ wd_is_enabled: true })
      }
      const user_vocabulary = result.wd_user_vocabulary
      if (typeof user_vocabulary === 'undefined') {
        chrome.storage.local.set({ wd_user_vocabulary: {} })
      }
      const black_list = result.wd_black_list
      if (typeof black_list === 'undefined') {
        chrome.storage.local.set({ wd_black_list: {} })
      }
      const white_list = result.wd_white_list
      if (typeof white_list === 'undefined') {
        chrome.storage.local.set({ wd_white_list: {} })
      }
    },
  )

  chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
      if ((request.type = 'tts_speak')) {
        if (!!request.word && typeof request.word === 'string') {
          chrome.tts.speak(request.word, { lang: 'en', gender: 'male' })
        }
      }
    },
  )
}

initialize_extension()

})();


//# sourceMappingURL=background.js.map