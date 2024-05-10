/******/ "use strict";
/******/ var __webpack_modules__ = ({

/***/ "./src/FileSaver.js":
/*!**************************!*\
  !*** ./src/FileSaver.js ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* export default binding */ __WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* FileSaver.js
 * A saveAs() FileSaver implementation.
 * 1.3.2
 * 2016-06-16 18:25:19
 *
 * By Eli Grey, http://eligrey.com
 * License: MIT
 *   See https://github.com/eligrey/FileSaver.js/blob/master/LICENSE.md
 */

/* jslint bitwise: true, indent: 4, laxbreak: true, laxcomma: true, smarttabs: true, plusplus: true */

/*! @source https://github.com/eligrey/FileSaver.js/blob/master/dist/FileSaver.js */

const view = window
const doc = view.document
// only get URL when necessary in case Blob.js hasn't overridden it yet
const get_URL = function () {
  return view.URL || view.webkitURL || view
}
const save_link = doc.createElementNS('http://www.w3.org/1999/xhtml', 'a')
const can_use_save_link = 'download' in save_link
const click = function (node) {
  const event = new MouseEvent('click')
  node.dispatchEvent(event)
}
const is_safari = /constructor/i.test(view.HTMLElement) || view.safari
const is_chrome_ios = /CriOS\/[\d]+/.test(navigator.userAgent)
const throw_outside = function (ex) {
  ;(view.setImmediate || view.setTimeout)(function () {
    throw ex
  }, 0)
}
const force_saveable_type = 'application/octet-stream'
// the Blob API is fundamentally broken as there is no "downloadfinished" event to subscribe to
const arbitrary_revoke_timeout = 1000 * 40 // in ms
const revoke = function (file) {
  const revoker = function () {
    if (typeof file === 'string') {
      // file is an object URL
      get_URL().revokeObjectURL(file)
    } else {
      // file is a File
      file.remove()
    }
  }
  setTimeout(revoker, arbitrary_revoke_timeout)
}
const dispatch = function (filesaver, event_types, event) {
  event_types = [].concat(event_types)
  let i = event_types.length
  while (i--) {
    const listener = filesaver[`on${event_types[i]}`]
    if (typeof listener === 'function') {
      try {
        listener.call(filesaver, event || filesaver)
      } catch (ex) {
        throw_outside(ex)
      }
    }
  }
}
const auto_bom = function (blob) {
  // prepend BOM for UTF-8 XML and text/* types (including HTML)
  // note: your browser will automatically convert UTF-16 U+FEFF to EF BB BF
  if (
    /^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(
      blob.type,
    )
  ) {
    return new Blob([String.fromCharCode(0xfeff), blob], {
      type: blob.type,
    })
  }
  return blob
}
const FileSaver = function (blob, name, no_auto_bom) {
  if (!no_auto_bom) {
    blob = auto_bom(blob)
  }
  // First try a.download, then web filesystem, then object URLs
  const filesaver = this
  const { type } = blob
  const force = type === force_saveable_type
  let object_url
  const dispatch_all = function () {
    dispatch(filesaver, 'writestart progress write writeend'.split(' '))
  }
  // on any filesys errors revert to saving with object URLs
  const fs_error = function () {
    if ((is_chrome_ios || (force && is_safari)) && view.FileReader) {
      // Safari doesn't allow downloading of blob urls
      const reader = new FileReader()
      reader.onloadend = function () {
        let url = is_chrome_ios
          ? reader.result
          : reader.result.replace(/^data:[^;]*;/, 'data:attachment/file;')
        const popup = view.open(url, '_blank')
        if (!popup) view.location.href = url
        url = undefined // release reference before dispatching
        filesaver.readyState = filesaver.DONE
        dispatch_all()
      }
      reader.readAsDataURL(blob)
      filesaver.readyState = filesaver.INIT
      return
    }
    // don't create more object URLs than needed
    if (!object_url) {
      object_url = get_URL().createObjectURL(blob)
    }
    if (force) {
      view.location.href = object_url
    } else {
      const opened = view.open(object_url, '_blank')
      if (!opened) {
        // Apple does not allow window.open, see https://developer.apple.com/library/safari/documentation/Tools/Conceptual/SafariExtensionGuide/WorkingwithWindowsandTabs/WorkingwithWindowsandTabs.html
        view.location.href = object_url
      }
    }
    filesaver.readyState = filesaver.DONE
    dispatch_all()
    revoke(object_url)
  }
  filesaver.readyState = filesaver.INIT

  if (can_use_save_link) {
    object_url = get_URL().createObjectURL(blob)
    setTimeout(function () {
      save_link.href = object_url
      save_link.download = name
      click(save_link)
      dispatch_all()
      revoke(object_url)
      filesaver.readyState = filesaver.DONE
    })
    return
  }

  fs_error()
}
const FS_proto = FileSaver.prototype

FS_proto.abort = function () {}
FS_proto.readyState = FS_proto.INIT = 0
FS_proto.WRITING = 1
FS_proto.DONE = 2

FS_proto.error =
  FS_proto.onwritestart =
  FS_proto.onprogress =
  FS_proto.onwrite =
  FS_proto.onabort =
  FS_proto.onerror =
  FS_proto.onwriteend =
    null

/* harmony default export */ function __WEBPACK_DEFAULT_EXPORT__(blob, name, no_auto_bom) {
  return new FileSaver(blob, name || blob.name || 'download', no_auto_bom)
}
// return saveAs;


/***/ }),

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
/*!***********************!*\
  !*** ./src/adjust.js ***!
  \***********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _common_lib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./common_lib */ "./src/common_lib.js");
/* harmony import */ var _context_menu_lib__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./context_menu_lib */ "./src/context_menu_lib.js");
/* harmony import */ var _FileSaver__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./FileSaver */ "./src/FileSaver.js");




let wd_hl_settings = null
let wd_hover_settings = null
let wd_online_dicts = null
let wd_enable_tts = false

const wc_rb_ids = ['wc1', 'wc2', 'wc3', 'wc4', 'wc5']
const ic_rb_ids = ['ic1', 'ic2', 'ic3', 'ic4', 'ic5']
const wb_rb_ids = ['wb1', 'wb2', 'wb3', 'wb4', 'wb5']
const ib_rb_ids = ['ib1', 'ib2', 'ib3', 'ib4', 'ib5']

const hover_popup_types = ['never', 'key', 'always']
const target_types = ['hl', 'ow']

function display_sync_interface() {
  chrome.storage.local.get(
    ['wd_gd_sync_enabled', 'wd_last_sync_error', 'wd_last_sync'],
    function (result) {
      const { wd_last_sync_error } = result
      const { wd_gd_sync_enabled } = result
      const { wd_last_sync } = result
      if (!wd_gd_sync_enabled) {
        document.getElementById('gdStopSyncButton').style.display = 'none'
        document.getElementById('syncStatusFeedback').style.display = 'none'
        return
      }
      document.getElementById('gdStopSyncButton').style.display = 'inline-block'
      document.getElementById('syncStatusFeedback').style.display = 'inline'
      if (wd_last_sync_error != null) {
        document.getElementById('syncStatusFeedback').textContent =
          `Error: ${wd_last_sync_error}`
      } else {
        document.getElementById('syncStatusFeedback').textContent =
          'Synchronized.'
      }
      if (typeof wd_last_sync !== 'undefined') {
        const cur_date = new Date()
        let seconds_passed = (cur_date.getTime() - wd_last_sync) / 1000
        const p_days = Math.floor(seconds_passed / (3600 * 24))
        seconds_passed %= 3600 * 24
        const p_hours = Math.floor(seconds_passed / 3600)
        seconds_passed %= 3600
        const p_minutes = Math.floor(seconds_passed / 60)
        const p_seconds = Math.floor(seconds_passed % 60)
        let passed_time_msg = ''
        if (p_days > 0) passed_time_msg += `${p_days} days, `
        if (p_hours > 0 || p_days > 0) passed_time_msg += `${p_hours} hours, `
        if (p_minutes > 0 || p_hours > 0 || p_days > 0)
          passed_time_msg += `${p_minutes} minutes, `
        passed_time_msg += `${p_seconds} seconds since the last sync.`
        const syncDateLabel = document.getElementById('lastSyncDate')
        syncDateLabel.style.display = 'inline'
        syncDateLabel.textContent = passed_time_msg
      }
    },
  )
}

function synchronize_now() {
  chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
      if (request.sync_feedback) {
        display_sync_interface()
      }
    },
  )
  document.getElementById('syncStatusFeedback').style.display = 'inline'
  document.getElementById('syncStatusFeedback').textContent =
    'Synchronization started...'
  chrome.storage.local.set({ wd_gd_sync_enabled: true }, function () {
    chrome.runtime.sendMessage({
      wdm_request: 'gd_sync',
      interactive_mode: true,
    })
  })
}

function request_permissions_and_sync() {
  chrome.permissions.request({ origins: ['https://*/*'] }, function (granted) {
    if (!granted) return
    synchronize_now()
  })
}

function stop_synchronization() {
  chrome.storage.local.set(
    { wd_gd_sync_enabled: false },
    display_sync_interface,
  )
}

function process_test_warnings() {
  chrome.management.getPermissionWarningsByManifest(prompt(), console.log)
}

function process_get_dbg() {
  const storage_key = document.getElementById('getFromStorageKey').value
  chrome.storage.local.get([storage_key], function (result) {
    const storage_value = result[storage_key]
    console.log(`key: ${storage_key}; value: ${JSON.stringify(storage_value)}`)
  })
}

function process_set_dbg() {
  console.log('processing dbg')
  const storage_key = document.getElementById('setToStorageKey').value
  let storage_value = document.getElementById('setToStorageVal').value
  if (storage_value === 'undefined') {
    storage_value = undefined
  } else {
    storage_value = JSON.parse(storage_value)
  }
  console.log(`storage_key:${storage_key}, storage_value:${storage_value}`)
  chrome.storage.local.set({ [storage_key]: storage_value }, function () {
    const last_error = chrome.runtime.lastError
    console.log(`last_error:${last_error}`)
    console.log('finished setting value')
  })
}

function process_export() {
  chrome.storage.local.get(['wd_user_vocabulary'], function (result) {
    const user_vocabulary = result.wd_user_vocabulary
    const keys = []
    Object.keys(user_vocabulary).forEach((key) => {
      if (user_vocabulary.hasOwnProperty(key)) {
        keys.push(key)
      }
    })
    const file_content = keys.join('\r\n')
    const blob = new Blob([file_content], { type: 'text/plain;charset=utf-8' })
    ;(0,_FileSaver__WEBPACK_IMPORTED_MODULE_2__["default"])(blob, 'my_vocabulary.txt', true)
  })
}

function process_import() {
  chrome.tabs.create(
    { url: chrome.runtime.getURL('import.html') },
    function (tab) {},
  )
}

function highlight_example_text(hl_params, text_id, lq_id, rq_id) {
  document.getElementById(lq_id).textContent = ''
  document.getElementById(rq_id).textContent = ''
  document.getElementById(lq_id).style = undefined
  document.getElementById(rq_id).style = undefined
  document.getElementById(text_id).style = (0,_common_lib__WEBPACK_IMPORTED_MODULE_0__.make_hl_style)(hl_params)
}

function show_rb_states(ids, color) {
  for (let i = 0; i < ids.length; i++) {
    const doc_element = document.getElementById(ids[i])
    if (doc_element.label.style.backgroundColor === color) {
      doc_element.checked = true
    }
  }
}

function process_test_old_dict(e) {
  const button = e.target
  const btn_id = button.id
  if (!btn_id.startsWith('testDictBtn_')) return
  const btn_no = parseInt(btn_id.split('_')[1], 10)
  const url = `${wd_online_dicts[btn_no].url}test`
  chrome.tabs.create({ url }, function (tab) {})
}

function process_delete_old_dict(e) {
  const button = e.target
  const btn_id = button.id
  if (!btn_id.startsWith('delDict')) return
  const btn_no = parseInt(btn_id.split('_')[1], 10)
  wd_online_dicts.splice(btn_no, 1)
  chrome.storage.local.set({ wd_online_dicts })
  ;(0,_context_menu_lib__WEBPACK_IMPORTED_MODULE_1__.initContextMenus)(wd_online_dicts)
  show_user_dicts()
}

function show_user_dicts() {
  const dicts_block = document.getElementById('existingDictsBlock')
  while (dicts_block.firstChild) {
    dicts_block.removeChild(dicts_block.firstChild)
  }
  const dictPairs = wd_online_dicts
  for (let i = 0; i < dictPairs.length; ++i) {
    const nameSpan = document.createElement('span')
    nameSpan.setAttribute('class', 'existingDictName')
    nameSpan.textContent = dictPairs[i].title
    dicts_block.appendChild(nameSpan)

    const urlInput = document.createElement('input')
    urlInput.setAttribute('type', 'text')
    urlInput.setAttribute('class', 'existingDictUrl')
    urlInput.setAttribute('value', dictPairs[i].url)
    urlInput.readOnly = true
    dicts_block.appendChild(urlInput)

    const testButton = document.createElement('button')
    testButton.setAttribute('class', 'shortButton')
    testButton.id = `testDictBtn_${i}`
    testButton.textContent = 'Test'
    testButton.addEventListener('click', process_test_old_dict)
    dicts_block.appendChild(testButton)

    const deleteButton = document.createElement('button')
    deleteButton.setAttribute('class', 'imgButton')
    deleteButton.id = `delDictBtn_${i}`
    const img = document.createElement('img')
    img.setAttribute('src', '../assets/delete.png')
    img.id = `delDictImg_${i}`
    deleteButton.appendChild(img)
    deleteButton.addEventListener('click', process_delete_old_dict)
    dicts_block.appendChild(deleteButton)

    dicts_block.appendChild(document.createElement('br'))
  }
}

function process_add_dict() {
  let dictName = document.getElementById('addDictName').value
  let dictUrl = document.getElementById('addDictUrl').value
  dictName = dictName.trim()
  dictUrl = dictUrl.trim()
  if (!dictName || !dictUrl) return
  wd_online_dicts.push({ title: dictName, url: dictUrl })
  chrome.storage.local.set({ wd_online_dicts })
  ;(0,_context_menu_lib__WEBPACK_IMPORTED_MODULE_1__.initContextMenus)(wd_online_dicts)
  show_user_dicts()
  document.getElementById('addDictName').value = ''
  document.getElementById('addDictUrl').value = ''
}

function process_test_new_dict() {
  let dictUrl = document.getElementById('addDictUrl').value
  dictUrl = dictUrl.trim()
  if (!dictUrl) return
  const url = `${dictUrl}test`
  chrome.tabs.create({ url }, function (tab) {})
}

function show_internal_state() {
  const word_hl_params = wd_hl_settings.wordParams
  const idiom_hl_params = wd_hl_settings.idiomParams

  document.getElementById('wordsEnabled').checked = word_hl_params.enabled
  document.getElementById('idiomsEnabled').checked = idiom_hl_params.enabled
  document.getElementById('wordsBlock').style.display = word_hl_params.enabled
    ? 'block'
    : 'none'
  document.getElementById('idiomsBlock').style.display = idiom_hl_params.enabled
    ? 'block'
    : 'none'

  document.getElementById('wordsBold').checked = word_hl_params.bold
  document.getElementById('idiomsBold').checked = idiom_hl_params.bold

  document.getElementById('wordsBackground').checked =
    word_hl_params.useBackground
  document.getElementById('idiomsBackground').checked =
    idiom_hl_params.useBackground

  document.getElementById('wordsColor').checked = word_hl_params.useColor
  document.getElementById('idiomsColor').checked = idiom_hl_params.useColor

  document.getElementById('pronunciationEnabled').checked = wd_enable_tts

  document.getElementById('wcRadioBlock').style.display =
    word_hl_params.useColor ? 'block' : 'none'
  show_rb_states(wc_rb_ids, word_hl_params.color)
  document.getElementById('icRadioBlock').style.display =
    idiom_hl_params.useColor ? 'block' : 'none'
  show_rb_states(ic_rb_ids, idiom_hl_params.color)
  document.getElementById('wbRadioBlock').style.display =
    word_hl_params.useBackground ? 'block' : 'none'
  show_rb_states(wb_rb_ids, word_hl_params.backgroundColor)
  document.getElementById('ibRadioBlock').style.display =
    idiom_hl_params.useBackground ? 'block' : 'none'
  show_rb_states(ib_rb_ids, idiom_hl_params.backgroundColor)

  for (let t = 0; t < target_types.length; t++) {
    const ttype = target_types[t]
    for (let i = 0; i < hover_popup_types.length; i++) {
      const is_hit =
        hover_popup_types[i] === wd_hover_settings[`${ttype}_hover`]
      document.getElementById(`${ttype}b_${hover_popup_types[i]}`).checked =
        is_hit
    }
  }

  highlight_example_text(word_hl_params, 'wordHlText', 'wql', 'wqr')
  highlight_example_text(idiom_hl_params, 'idiomHlText', 'iql', 'iqr')
  show_user_dicts()
}

function add_cb_event_listener(id, dst_params, dst_key) {
  document.getElementById(id).addEventListener('click', function () {
    const checkboxElem = document.getElementById(id)
    if (checkboxElem.checked) {
      dst_params[dst_key] = true
    } else {
      dst_params[dst_key] = false
    }
    show_internal_state()
  })
}

function process_rb(dst_params, dst_key, ids) {
  for (let i = 0; i < ids.length; i++) {
    const doc_element = document.getElementById(ids[i])
    if (doc_element.checked) {
      dst_params[dst_key] = doc_element.label.style.backgroundColor
    }
  }
  show_internal_state()
}

function handle_rb_loop(ids, dst_params, dst_key) {
  for (let i = 0; i < ids.length; i++) {
    document.getElementById(ids[i]).addEventListener('click', function () {
      process_rb(dst_params, dst_key, ids)
    })
  }
}

function assign_back_labels() {
  const labels = document.getElementsByTagName('LABEL')
  for (let i = 0; i < labels.length; i++) {
    if (labels[i].htmlFor !== '') {
      const elem = document.getElementById(labels[i].htmlFor)
      if (elem) elem.label = labels[i]
    }
  }
}

function hover_rb_handler() {
  for (let t = 0; t < target_types.length; t++) {
    const ttype = target_types[t]
    for (let i = 0; i < hover_popup_types.length; i++) {
      const element_id = `${ttype}b_${hover_popup_types[i]}`
      const param_key = `${ttype}_hover`
      const rbElem = document.getElementById(element_id)
      if (rbElem.checked) {
        wd_hover_settings[param_key] = hover_popup_types[i]
      }
    }
  }
  chrome.storage.local.set({ wd_hover_settings })
}

function add_hover_rb_listeners() {
  for (let t = 0; t < target_types.length; t++) {
    for (let i = 0; i < hover_popup_types.length; i++) {
      const element_id = `${target_types[t]}b_${hover_popup_types[i]}`
      document
        .getElementById(element_id)
        .addEventListener('click', hover_rb_handler)
    }
  }
}

function process_display() {
  window.onload = function () {
    chrome.storage.local.get(
      [
        'wd_hl_settings',
        'wd_hover_settings',
        'wd_online_dicts',
        'wd_developer_mode',
        'wd_enable_tts',
      ],
      function (result) {
        assign_back_labels()
        wd_hl_settings = result.wd_hl_settings
        wd_hover_settings = result.wd_hover_settings
        wd_online_dicts = result.wd_online_dicts
        wd_enable_tts = !!result.wd_enable_tts

        const { wd_developer_mode } = result

        // TODO fix this monstrosity using this wrapper-function hack:
        // http://stackoverflow.com/questions/7053965/when-using-callbacks-inside-a-loop-in-javascript-is-there-any-way-to-save-a-var
        handle_rb_loop(wc_rb_ids, wd_hl_settings.wordParams, 'color')
        handle_rb_loop(ic_rb_ids, wd_hl_settings.idiomParams, 'color')
        handle_rb_loop(wb_rb_ids, wd_hl_settings.wordParams, 'backgroundColor')
        handle_rb_loop(ib_rb_ids, wd_hl_settings.idiomParams, 'backgroundColor')

        add_cb_event_listener(
          'wordsEnabled',
          wd_hl_settings.wordParams,
          'enabled',
        )
        add_cb_event_listener(
          'idiomsEnabled',
          wd_hl_settings.idiomParams,
          'enabled',
        )
        add_cb_event_listener('wordsBold', wd_hl_settings.wordParams, 'bold')
        add_cb_event_listener('idiomsBold', wd_hl_settings.idiomParams, 'bold')
        add_cb_event_listener(
          'wordsBackground',
          wd_hl_settings.wordParams,
          'useBackground',
        )
        add_cb_event_listener(
          'idiomsBackground',
          wd_hl_settings.idiomParams,
          'useBackground',
        )
        add_cb_event_listener(
          'wordsColor',
          wd_hl_settings.wordParams,
          'useColor',
        )
        add_cb_event_listener(
          'idiomsColor',
          wd_hl_settings.idiomParams,
          'useColor',
        )

        add_hover_rb_listeners()

        if (wd_developer_mode) {
          document.getElementById('debugControl').style.display = 'block'
        }

        document
          .getElementById('gdSyncButton')
          .addEventListener('click', request_permissions_and_sync)
        document
          .getElementById('gdStopSyncButton')
          .addEventListener('click', stop_synchronization)

        document
          .getElementById('saveVocab')
          .addEventListener('click', process_export)
        document
          .getElementById('loadVocab')
          .addEventListener('click', process_import)

        document
          .getElementById('getFromStorageBtn')
          .addEventListener('click', process_get_dbg)
        document
          .getElementById('setToStorageBtn')
          .addEventListener('click', process_set_dbg)

        document
          .getElementById('testManifestWarningsBtn')
          .addEventListener('click', process_test_warnings)

        document
          .getElementById('addDict')
          .addEventListener('click', process_add_dict)
        document
          .getElementById('testNewDict')
          .addEventListener('click', process_test_new_dict)

        document.getElementById('moreInfoLink').href =
          chrome.runtime.getURL('sync_help.html')

        document
          .getElementById('saveVisuals')
          .addEventListener('click', function () {
            chrome.storage.local.set({ wd_hl_settings })
          })

        document
          .getElementById('defaultDicts')
          .addEventListener('click', function () {
            wd_online_dicts = (0,_context_menu_lib__WEBPACK_IMPORTED_MODULE_1__.make_default_online_dicts)()
            chrome.storage.local.set({ wd_online_dicts })
            ;(0,_context_menu_lib__WEBPACK_IMPORTED_MODULE_1__.initContextMenus)(wd_online_dicts)
            show_user_dicts()
          })

        document
          .getElementById('pronunciationEnabled')
          .addEventListener('click', function (e) {
            wd_enable_tts = e.target.checked
            chrome.storage.local.set({ wd_enable_tts })
          })

        display_sync_interface()
        show_internal_state()
      },
    )
  }
}

document.addEventListener('DOMContentLoaded', function (event) {
  (0,_common_lib__WEBPACK_IMPORTED_MODULE_0__.localizeHtmlPage)()
  process_display()
})

})();


//# sourceMappingURL=adjust.js.map