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
/*!****************************!*\
  !*** ./src/black_white.js ***!
  \****************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _common_lib__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./common_lib */ "./src/common_lib.js");


const list_section_names = {
  wd_black_list: 'blackListSection',
  wd_white_list: 'whiteListSection',
  wd_user_vocabulary: 'vocabularySection',
}

function process_delete_simple(list_name, key) {
  chrome.storage.local.get([list_name], function (result) {
    const user_list = result[list_name]
    delete user_list[key]
    chrome.storage.local.set({ [list_name]: user_list })
    show_user_list(list_name, user_list)
  })
}

function process_delete_vocab_entry(key) {
  chrome.storage.local.get(
    ['wd_user_vocabulary', 'wd_user_vocab_added', 'wd_user_vocab_deleted'],
    function (result) {
      const user_vocabulary = result.wd_user_vocabulary
      const { wd_user_vocab_added } = result
      const { wd_user_vocab_deleted } = result
      const new_state = { wd_user_vocabulary: user_vocabulary }
      delete user_vocabulary[key]
      if (typeof wd_user_vocab_added !== 'undefined') {
        delete wd_user_vocab_added[key]
        new_state.wd_user_vocab_added = wd_user_vocab_added
      }
      if (typeof wd_user_vocab_deleted !== 'undefined') {
        wd_user_vocab_deleted[key] = 1
        new_state.wd_user_vocab_deleted = wd_user_vocab_deleted
      }
      chrome.storage.local.set(new_state, _common_lib__WEBPACK_IMPORTED_MODULE_0__.sync_if_needed)
      show_user_list('wd_user_vocabulary', user_vocabulary)
    },
  )
}

function create_button(list_name, text) {
  const result = document.createElement('button')
  result.setAttribute('class', 'deleteButton')
  result.expression_text = text
  if (list_name === 'wd_user_vocabulary') {
    result.addEventListener('click', function () {
      process_delete_vocab_entry(this.expression_text)
    })
  } else {
    result.addEventListener('click', function () {
      process_delete_simple(list_name, this.expression_text)
    })
  }
  const img = document.createElement('img')
  img.setAttribute('src', '../assets/delete.png')
  result.appendChild(img)
  return result
}

function create_label(text) {
  const result = document.createElement('span')
  result.setAttribute('class', 'wordText')
  result.textContent = text
  return result
}

function show_user_list(list_name, user_list) {
  const keys = []
  Object.keys(user_list).forEach((key) => {
    if (user_list.hasOwnProperty(key)) {
      keys.push(key)
    }
  })
  const section_name = list_section_names[list_name]
  const div_element = document.getElementById(section_name)
  while (div_element.firstChild) {
    div_element.removeChild(div_element.firstChild)
  }
  if (!keys.length) {
    div_element.appendChild(
      create_label(chrome.i18n.getMessage('emptyListError')),
    )
    div_element.appendChild(document.createElement('br'))
    return
  }
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (key.indexOf("'") !== -1 || key.indexOf('"') !== -1) {
      continue
    }
    div_element.appendChild(create_button(list_name, key))
    div_element.appendChild(create_label(key))
    div_element.appendChild(document.createElement('br'))
  }
}

function process_display() {
  let list_name = ''
  // TODO replace this clumsy logic by adding a special "data-list-name" attribute and renaming all 3 tags to "userListSection"
  if (document.getElementById('blackListSection')) {
    list_name = 'wd_black_list'
  } else if (document.getElementById('whiteListSection')) {
    list_name = 'wd_white_list'
  } else {
    list_name = 'wd_user_vocabulary'
  }

  chrome.storage.local.get([list_name], function (result) {
    const user_list = result[list_name]
    show_user_list(list_name, user_list)
  })
}

document.addEventListener('DOMContentLoaded', function (event) {
  process_display()
})

})();


//# sourceMappingURL=black_white.js.map