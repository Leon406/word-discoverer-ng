import { add_lexeme, idClickFunc, localizeHtmlPage, open_local_tab, request_unhighlight } from './common_lib'

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
        chrome.storage.sync.get(['wd_black_list'], function (result) {
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
        chrome.storage.sync.get(['wd_white_list'], function (result) {
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
    chrome.storage.sync.get([list_name], function (result) {
      const site_list = result[list_name]
      if (checkboxElem.checked) {
        site_list[domain] = 1
      } else {
        delete site_list[domain]
      }
      chrome.storage.sync.set({ [list_name]: site_list }, function () {
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
  chrome.storage.sync.set({ wd_is_enabled: enabled_mode })
  display_mode()
}

function process_show() {
  open_local_tab('display.html')
}

function process_help() {
  open_local_tab('help.html')
}

function process_adjust() {
  open_local_tab('adjust.html')
}

function display_vocabulary_size() {
  chrome.storage.local.get(['wd_user_vocabulary'], function (result) {
    const { wd_user_vocabulary } = result
    document.getElementById('vocabIndicator').textContent = Object.keys(wd_user_vocabulary).length
  })
}

function popup_handle_add_result(report, lemma) {
  if (report === 'ok') {
    request_unhighlight(lemma)
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
    chrome.storage.sync.set({ wd_developer_mode: true })
    document.getElementById('addText').value = ''
    return
  }
  if (lexeme === 'dev-mode-off') {
    chrome.storage.sync.set({ wd_developer_mode: false })
    document.getElementById('addText').value = ''
    return
  }
  add_lexeme(lexeme, popup_handle_add_result)
}
function display_percents(show_percents) {
  const not_showing_cnt = Math.floor((dict_size / 100.0) * show_percents)
  document.getElementById('rateIndicator1').textContent = `${show_percents}%`
  document.getElementById('rateIndicator2').textContent = `${show_percents}%`
  document.getElementById('countIndicator').textContent = not_showing_cnt
}
function process_rate(increase) {
  chrome.storage.sync.get(['wd_show_percents'], function (result) {
    let show_percents = result.wd_show_percents
    show_percents += increase
    show_percents = Math.min(100, Math.max(0, show_percents))
    display_percents(show_percents)
    chrome.storage.sync.set({ wd_show_percents: show_percents })
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
    idClickFunc('addToList',process_checkbox)
    idClickFunc('adjust',process_adjust)
    idClickFunc('showVocab',process_show)
    idClickFunc('getHelp',process_help)
    idClickFunc('addWord',process_add_word)
    idClickFunc('rateM10',process_rate_m10)
    idClickFunc('rateM1',process_rate_m1)
    idClickFunc('rateP1',process_rate_p1)
    idClickFunc('rateP10',process_rate_p10)
    idClickFunc('rb_enabled',process_mode_switch)
    idClickFunc('rb_disabled',process_mode_switch)
    document
      .getElementById('addText')
      .addEventListener('keyup', function (event) {
        event.preventDefault()
        if (event.keyCode === 13) { // Enter
          process_add_word()
        }
      })

    display_vocabulary_size()

    chrome.storage.sync.get(
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

document.addEventListener('DOMContentLoaded', function () {
  localizeHtmlPage()
  init_controls()
})
