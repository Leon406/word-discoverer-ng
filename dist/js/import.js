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
/*!***********************!*\
  !*** ./src/import.js ***!
  \***********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _common_lib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./common_lib */ "./src/common_lib.js");


function parse_vocabulary(text) {
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

function add_new_words(new_words) {
  chrome.storage.local.get(
    ['wd_user_vocabulary', 'wd_user_vocab_added', 'wd_user_vocab_deleted'],
    function (result) {
      const user_vocabulary = result.wd_user_vocabulary
      const { wd_user_vocab_added } = result
      const { wd_user_vocab_deleted } = result
      let num_added = 0
      const new_state = { wd_user_vocabulary: user_vocabulary }
      for (let i = 0; i < new_words.length; ++i) {
        const word = new_words[i]
        if (!user_vocabulary.hasOwnProperty(word)) {
          user_vocabulary[word] = 1
          ++num_added
          if (typeof wd_user_vocab_added !== 'undefined') {
            wd_user_vocab_added[word] = 1
            new_state.wd_user_vocab_added = wd_user_vocab_added
          }
          if (typeof wd_user_vocab_deleted !== 'undefined') {
            delete wd_user_vocab_deleted[word]
            new_state.wd_user_vocab_deleted = wd_user_vocab_deleted
          }
        }
      }
      if (num_added) {
        chrome.storage.local.set(new_state, _common_lib__WEBPACK_IMPORTED_MODULE_0__.sync_if_needed)
      }
      const num_skipped = new_words.length - num_added
      document.getElementById('addedInfo').textContent =
        `Added ${num_added} new words.`
      document.getElementById('skippedInfo').textContent =
        `Skipped ${num_skipped} existing words.`
    },
  )
}

function process_change() {
  const inputElem = document.getElementById('doLoadVocab')
  const baseName = inputElem.files[0].name
  document.getElementById('fnamePreview').textContent = baseName
}

function process_submit() {
  // TODO add a radio button with two options: 1. merge vocabulary [default]; 2. replace vocabulary
  const inputElem = document.getElementById('doLoadVocab')
  const file = inputElem.files[0]
  const reader = new FileReader()
  reader.onload = function (e) {
    const new_words = parse_vocabulary(reader.result)
    add_new_words(new_words)
  }
  reader.readAsText(file)
}

function init_controls() {
  window.onload = function () {
    (0,_common_lib__WEBPACK_IMPORTED_MODULE_0__.localizeHtmlPage)()
    document
      .getElementById('vocabSubmit')
      .addEventListener('click', process_submit)
    document
      .getElementById('doLoadVocab')
      .addEventListener('change', process_change)
  }
}

init_controls()

})();


//# sourceMappingURL=import.js.map