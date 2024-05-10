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
/*!**********************!*\
  !*** ./src/popup.js ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _common_lib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./common_lib */ "./src/common_lib.js");


let dict_size = null
let enabled_mode = true

function display_mode() {
  chrome.tabs.query(
    {
      active: true,
      lastFocusedWindow: true,
    },
    function (tabs) {
      const tab = tabs[0]
      const url = new URL(tab.url)
      const domain = url.hostname
      document.getElementById('addHostName').textContent = domain
      if (enabled_mode) {
        document.getElementById('rb_enabled').checked = true
        document.getElementById('addToListLabel').textContent =
          chrome.i18n.getMessage('addSkippedLabel')
        document.getElementById('addToListLabel').href =
          chrome.runtime.getURL('black_list.html')
        chrome.storage.local.get(['wd_black_list'], function (result) {
          const black_list = result.wd_black_list
          document.getElementById('addToList').checked =
            black_list.hasOwnProperty(domain)
        })
      } else {
        document.getElementById('rb_disabled').checked = true
        document.getElementById('addToListLabel').textContent =
          chrome.i18n.getMessage('addFavoritesLabel')
        document.getElementById('addToListLabel').href =
          chrome.runtime.getURL('white_list.html')
        chrome.storage.local.get(['wd_white_list'], function (result) {
          const white_list = result.wd_white_list
          document.getElementById('addToList').checked =
            white_list.hasOwnProperty(domain)
        })
      }
    },
  )
}

function process_checkbox() {
  const checkboxElem = document.getElementById('addToList')
  chrome.tabs.query({ active: true, lastFocusedWindow: true }, function (tabs) {
    const tab = tabs[0]
    const url = new URL(tab.url)
    const domain = url.hostname
    document.getElementById('addHostName').textContent = domain
    const list_name = enabled_mode ? 'wd_black_list' : 'wd_white_list'
    chrome.storage.local.get([list_name], function (result) {
      const site_list = result[list_name]
      if (checkboxElem.checked) {
        site_list[domain] = 1
      } else {
        delete site_list[domain]
      }
      chrome.storage.local.set({ [list_name]: site_list }, function () {
        display_mode()
      })
    })
  })
}

function process_mode_switch() {
  if (document.getElementById('rb_enabled').checked) {
    enabled_mode = true
  } else if (document.getElementById('rb_disabled').checked) {
    enabled_mode = false
  }
  chrome.storage.local.set({ wd_is_enabled: enabled_mode })
  display_mode()
}

function process_show() {
  chrome.tabs.create(
    { url: chrome.runtime.getURL('display.html') },
    function (tab) {
      // opens import dialog in new tab
    },
  )
}

function process_help() {
  chrome.tabs.create(
    { url: chrome.runtime.getURL('help.html') },
    function (tab) {
      // opens import dialog in new tab
    },
  )
}

function process_adjust() {
  chrome.tabs.create(
    { url: chrome.runtime.getURL('adjust.html') },
    function (tab) {
      // opens adjust dialog in new tab
    },
  )
}

function display_vocabulary_size() {
  chrome.storage.local.get(['wd_user_vocabulary'], function (result) {
    const { wd_user_vocabulary } = result
    const vocab_size = Object.keys(wd_user_vocabulary).length
    document.getElementById('vocabIndicator').textContent = vocab_size
  })
}

function popup_handle_add_result(report, lemma) {
  if (report === 'ok') {
    (0,_common_lib__WEBPACK_IMPORTED_MODULE_0__.request_unhighlight)(lemma)
    display_vocabulary_size()
    document.getElementById('addText').value = ''
    document.getElementById('addOpResult').textContent =
      chrome.i18n.getMessage('addSuccess')
  } else if (report === 'exists') {
    document.getElementById('addOpResult').textContent =
      chrome.i18n.getMessage('addErrorDupp')
  } else {
    document.getElementById('addOpResult').textContent =
      chrome.i18n.getMessage('addErrorBad')
  }
}

function process_add_word() {
  const lexeme = document.getElementById('addText').value
  if (lexeme === 'dev-mode-on') {
    chrome.storage.local.set({ wd_developer_mode: true })
    document.getElementById('addText').value = ''
    return
  }
  if (lexeme === 'dev-mode-off') {
    chrome.storage.local.set({ wd_developer_mode: false })
    document.getElementById('addText').value = ''
    return
  }
  (0,_common_lib__WEBPACK_IMPORTED_MODULE_0__.add_lexeme)(lexeme, popup_handle_add_result)
}
function display_percents(show_percents) {
  const not_showing_cnt = Math.floor((dict_size / 100.0) * show_percents)
  document.getElementById('rateIndicator1').textContent = `${show_percents}%`
  document.getElementById('rateIndicator2').textContent = `${show_percents}%`
  document.getElementById('countIndicator').textContent = not_showing_cnt
}
function process_rate(increase) {
  chrome.storage.local.get(['wd_show_percents'], function (result) {
    let show_percents = result.wd_show_percents
    show_percents += increase
    show_percents = Math.min(100, Math.max(0, show_percents))
    display_percents(show_percents)
    chrome.storage.local.set({ wd_show_percents: show_percents })
  })
}

function process_rate_m1() {
  process_rate(-1)
}
function process_rate_m10() {
  process_rate(-10)
}
function process_rate_p1() {
  process_rate(1)
}
function process_rate_p10() {
  process_rate(10)
}

function init_controls() {
  window.onload = function () {
    document
      .getElementById('addToList')
      .addEventListener('click', process_checkbox)
    document.getElementById('adjust').addEventListener('click', process_adjust)
    document.getElementById('showVocab').addEventListener('click', process_show)
    document.getElementById('getHelp').addEventListener('click', process_help)
    document
      .getElementById('addWord')
      .addEventListener('click', process_add_word)
    document
      .getElementById('rateM10')
      .addEventListener('click', process_rate_m10)
    document.getElementById('rateM1').addEventListener('click', process_rate_m1)
    document.getElementById('rateP1').addEventListener('click', process_rate_p1)
    document
      .getElementById('rateP10')
      .addEventListener('click', process_rate_p10)
    document
      .getElementById('rb_enabled')
      .addEventListener('click', process_mode_switch)
    document
      .getElementById('rb_disabled')
      .addEventListener('click', process_mode_switch)

    document
      .getElementById('addText')
      .addEventListener('keyup', function (event) {
        event.preventDefault()
        if (event.keyCode === 13) {
          process_add_word()
        }
      })

    display_vocabulary_size()

    chrome.storage.local.get(
      ['wd_show_percents', 'wd_is_enabled', 'wd_word_max_rank'],
      function (result) {
        const show_percents = result.wd_show_percents
        enabled_mode = result.wd_is_enabled
        dict_size = result.wd_word_max_rank
        display_percents(show_percents)
        display_mode()
      },
    )
  }
}

document.addEventListener('DOMContentLoaded', function (event) {
  (0,_common_lib__WEBPACK_IMPORTED_MODULE_0__.localizeHtmlPage)()
  init_controls()
})

})();


//# sourceMappingURL=popup.js.map