import { idClickFunc, localizeHtmlPage } from './common_lib'

function parse_vocabulary(text) {
  return text.split(/[\r\n]+/).filter((line) => line)
}

function add_new_words(new_words) {
  chrome.storage.local.get(
    ['wd_user_vocabulary', 'wd_user_vocab_added', 'wd_user_vocab_deleted'],
    function (result) {
      const { wd_user_vocabulary, wd_user_vocab_deleted, wd_user_vocab_added } =
        result
      let num_added = 0
      const new_state = { wd_user_vocabulary }
      for (let i = 0; i < new_words.length; ++i) {
        const word = new_words[i]
        if (!wd_user_vocabulary.hasOwnProperty(word)) {
          wd_user_vocabulary[word] = 1
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
        chrome.storage.local.set(new_state)
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
  document.getElementById('fnamePreview').textContent = inputElem.files[0].name
}

function process_submit() {
  const inputElem = document.getElementById('doLoadVocab')
  const configUrl = document.getElementById('configUrl').value
  if (configUrl && configUrl.startsWith('http')) {
    fetch(configUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        return response.text()
      })
      .then((config) => {
        console.log('config', config.length)
        add_new_words(parse_vocabulary(config))
      })
      .catch((error) => {
        console.error('Failed to import config:', error)
        alert('Failed to import config. Please check the URL and try again.')
      })
  } else {
    const file = inputElem.files[0]
    const reader = new FileReader()
    reader.onload = function (e) {
      add_new_words(parse_vocabulary(reader.result))
    }
    reader.readAsText(file)
  }
}

function init_controls() {
  window.onload = function () {
    localizeHtmlPage()
    idClickFunc('vocabSubmit', process_submit)
    idClickFunc('doLoadVocab', process_change)
    chrome.storage.sync.get(['wd_online_vocabulary_url'], function (config) {
      document.getElementById('configUrl').value =
        config.wd_online_vocabulary_url || ''
    })
  }
}

init_controls()
