import { localizeHtmlPage, sync_if_needed } from './common_lib'

function parse_vocabulary(text) {
  return text.split(/[\r\n]+/).filter((line) => line)
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
        // chrome.storage.local.set(new_state, sync_if_needed)
        chrome.storage.local.set({"wd_user_vocabulary": user_vocabulary});
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
    localizeHtmlPage()
    document
      .getElementById('vocabSubmit')
      .addEventListener('click', process_submit)
    document
      .getElementById('doLoadVocab')
      .addEventListener('change', process_change)
  }
}

init_controls()
