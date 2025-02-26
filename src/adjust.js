import {
  idClickFunc,
  localizeHtmlPage,
  make_hl_style,
  open_local_tab,
} from './common_lib'
import {
  get_dict_definition_url,
  initContextMenus,
  make_default_online_dicts,
} from './context_menu_lib'
import { saveAs } from 'file-saver'

let wd_hl_settings = null
let wd_hover_settings = null
let wd_online_dicts = null
let wd_enable_tts = false
let wd_enable_prefetch = false
let wd_online_vocabulary_url = ''

const wc_rb_ids = ['wc1', 'wc2', 'wc3', 'wc4', 'wc5']
const ic_rb_ids = ['ic1', 'ic2', 'ic3', 'ic4', 'ic5']
const wb_rb_ids = ['wb1', 'wb2', 'wb3', 'wb4', 'wb5']
const ib_rb_ids = ['ib1', 'ib2', 'ib3', 'ib4', 'ib5']

const hover_popup_types = ['never', 'key', 'always']
const target_types = ['hl', 'ow']

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
    console.log(`last_error:${chrome.runtime.lastError}`)
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
    saveAs(blob, 'my_vocabulary.txt', true)
  })
}

function process_import() {
  open_local_tab('import.html')
}

function process_config_export() {
  chrome.storage.sync.get(
    [
      'wd_hl_settings',
      'wd_hover_settings',
      'wd_online_dicts',
      'wd_developer_mode',
      'wd_enable_tts',
      'wd_enable_prefetch',
      'wd_online_vocabulary_url',
    ],
    function (config) {
      const file_content = JSON.stringify(config)
      console.log(file_content)
      const blob = new Blob([file_content], {
        type: 'text/plain;charset=utf-8',
      })
      saveAs(blob, 'wd_config.json', true)
    },
  )
}

function process_config_import() {
  let openConfigFile = document.getElementById('openFile')
  const file = openConfigFile.files[0]
  if (!file) {
    alert('Plz Choose config.json first!')
    return
  }
  const reader = new FileReader()
  reader.onload = function (e) {
    let config = reader.result
    console.log('config', JSON.parse(config))

    chrome.storage.sync.set(JSON.parse(config)).then(reloadData)
  }
  reader.readAsText(file)
}

function highlight_example_text(hl_params, text_id, lq_id, rq_id) {
  document.getElementById(lq_id).textContent = ''
  document.getElementById(rq_id).textContent = ''
  document.getElementById(lq_id).style = undefined
  document.getElementById(rq_id).style = undefined
  document.getElementById(text_id).style = make_hl_style(hl_params)
}

function show_rb_states(ids, color) {
  for (let i = 0; i < ids.length; i++) {
    const doc_element = document.getElementById(ids[i])
    if (doc_element.label.style.backgroundColor === color) {
      doc_element.checked = true
    }
  }
}

function openUrl(url) {
  window.open(url)
}

function process_test_old_dict(e) {
  const button = e.target
  const btn_id = button.id
  if (!btn_id.startsWith('testDictBtn_')) return
  const btn_no = parseInt(btn_id.split('_')[1], 10)
  _openDict(wd_online_dicts[btn_no].url)
}

function process_delete_old_dict(e) {
  const button = e.target
  const btn_id = button.id
  if (!btn_id.startsWith('delDict')) return
  const btn_no = parseInt(btn_id.split('_')[1], 10)
  wd_online_dicts.splice(btn_no, 1)
  chrome.storage.sync.set({ wd_online_dicts })
  initContextMenus(wd_online_dicts)
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
  chrome.storage.sync.set({ wd_online_dicts })
  initContextMenus(wd_online_dicts)
  show_user_dicts()
  document.getElementById('addDictName').value = ''
  document.getElementById('addDictUrl').value = ''
}

function process_test_new_dict() {
  let dictUrl = document.getElementById('addDictUrl').value
  dictUrl = dictUrl.trim()
  if (!dictUrl) return
  _openDict(dictUrl)
}

function _openDict(dictUrl) {
  const url = get_dict_definition_url(dictUrl, 'test')
  if (url.startsWith('http')) {
    chrome.tabs.create({ url }, function (tab) {})
  } else {
    openUrl(url)
  }
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
  document.getElementById('bingPrefetchEnabled').checked = wd_enable_prefetch

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
    dst_params[dst_key] = !!checkboxElem.checked
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
  chrome.storage.sync.set({ wd_hover_settings })
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

function reloadData() {
  chrome.storage.sync.get(
    [
      'wd_hl_settings',
      'wd_hover_settings',
      'wd_online_dicts',
      'wd_developer_mode',
      'wd_enable_tts',
      'wd_enable_prefetch',
      'wd_online_vocabulary_url',
    ],
    function (result) {
      assign_back_labels()
      wd_hl_settings = result.wd_hl_settings
      wd_hover_settings = result.wd_hover_settings
      wd_online_dicts = result.wd_online_dicts
      wd_enable_tts = !!result.wd_enable_tts
      wd_enable_prefetch = !!result.wd_enable_prefetch
      wd_online_vocabulary_url = result.wd_online_vocabulary_url

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
      add_cb_event_listener('wordsColor', wd_hl_settings.wordParams, 'useColor')
      add_cb_event_listener(
        'idiomsColor',
        wd_hl_settings.idiomParams,
        'useColor',
      )

      add_hover_rb_listeners()

      if (wd_developer_mode) {
        document.getElementById('debugControl').style.display = 'block'
      }

      idClickFunc('saveVocab', process_export)
      idClickFunc('loadVocab', process_import)

      idClickFunc('exportConfig', process_config_export)
      idClickFunc('importConfig', process_config_import)

      idClickFunc('getFromStorageBtn', process_get_dbg)
      idClickFunc('setToStorageBtn', process_set_dbg)

      idClickFunc('testManifestWarningsBtn', process_test_warnings)
      idClickFunc('addDict', process_add_dict)
      idClickFunc('testNewDict', process_test_new_dict)
      idClickFunc('saveVisuals', function () {
        chrome.storage.sync.set({ wd_hl_settings })
      })
      idClickFunc('defaultDicts', function () {
        wd_online_dicts = make_default_online_dicts()
        chrome.storage.sync.set({ wd_online_dicts })
        initContextMenus(wd_online_dicts)
        show_user_dicts()
      })

      idClickFunc('pronunciationEnabled', function (e) {
        wd_enable_tts = e.target.checked
        chrome.storage.sync.set({ wd_enable_tts })
      })

      idClickFunc('bingPrefetchEnabled', function (e) {
        wd_enable_prefetch = e.target.checked
        chrome.storage.sync.set({ wd_enable_prefetch })
      })
      let onlineVocabularyEle = document.getElementById('onlineVocabularyUrl')

      if (wd_online_vocabulary_url) {
        onlineVocabularyEle.value = wd_online_vocabulary_url
      }
      onlineVocabularyEle.addEventListener('blur', function (e) {
        wd_online_vocabulary_url = e.target.value
        if (wd_online_vocabulary_url.startsWith('http')) {
          chrome.storage.sync.set({ wd_online_vocabulary_url })
        }
      })

      show_internal_state()
    },
  )
}

function process_display() {
  window.onload = reloadData
}

document.addEventListener('DOMContentLoaded', function () {
  localizeHtmlPage()
  process_display()
})
