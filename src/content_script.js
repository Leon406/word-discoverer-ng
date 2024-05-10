import { add_lexeme, make_hl_style, make_id_suffix } from './common_lib'
import { handleLexResult } from './utils/bing'
import { LRUCache } from 'lru-cache'

const options = {
  max: 5,
  dispose: (value, key) => {
    console.log('Cache Evict', key, value)
  }
}

const cache = new LRUCache(options)

let dict_words = null
let dict_idioms = null

let min_show_rank = null
let word_max_rank = null
let user_vocabulary = null
let is_enabled = null
let wd_hl_settings = null
let wd_hover_settings = null
let wd_online_dicts = null
let wd_enable_tts = null

let disable_by_keypress = false

let current_lexeme = ''
let cur_wd_node_id = 1

const word_re = /^[a-z][a-z]*$/

let function_key_is_pressed = false
let rendered_node_id = null
let node_to_render_id = null

function make_class_name(lemma) {
  if (lemma) {
    return `wdautohl_${make_id_suffix(lemma)}`
  }
  return 'wdautohl_none_none'
}

function get_rare_lemma(word) {
  if (word.length < 3) return undefined
  let wf
  if (dict_words.hasOwnProperty(word)) {
    wf = dict_words[word]
  }
  if (!wf || wf[1] < min_show_rank) return undefined
  const lemma = wf[0]
  return !user_vocabulary || !user_vocabulary.hasOwnProperty(lemma)
    ? lemma
    : undefined
}

function get_word_percentile(word) {
  if (!dict_words.hasOwnProperty(word)) return undefined
  const wf = dict_words[word]
  const result = Math.ceil((wf[1] * 100) / word_max_rank)
  return result
}

function assert(condition, message) {
  if (!condition) {
    throw message || 'Assertion failed'
  }
}

function limit_text_len(word) {
  if (!word) return word
  word = word.toLowerCase()
  const max_len = 20
  if (word.length <= max_len) return word
  return `${word.slice(0, max_len)}...`
}

function getHeatColorPoint(freqPercent) {
  if (!freqPercent) freqPercent = 0
  freqPercent = Math.max(0, Math.min(100, freqPercent))
  const hue = 100 - freqPercent
  return `hsl(${hue}, 100%, 50%)`
}

function renderBubble() {
  if (!node_to_render_id) return
  if (node_to_render_id === rendered_node_id) return

  const node_to_render = document.getElementById(node_to_render_id)
  if (!node_to_render) return

  const classattr = node_to_render.getAttribute('class')
  const is_highlighted = classattr !== 'wdautohl_none_none'
  const param_key = is_highlighted ? 'hl_hover' : 'ow_hover'
  const param_value = wd_hover_settings[param_key]
  if (
    param_value === 'never' ||
    (param_value === 'key' && !function_key_is_pressed)
  ) {
    return
  }

  const wdSpanText = node_to_render.textContent
  const bubbleDOM = document.getElementById('wd_selection_bubble')
  const bubbleText = document.getElementById('wd_selection_bubble_text')
  const bubbleFreq = document.getElementById('wd_selection_bubble_freq')
  const wdnTranslateBingDom =
    document.getElementById('wdn_translate_bing')
  // 避免网络问题，显示上一次内容
  wdnTranslateBingDom.innerHTML = ''
  let cacheResult = cache.get(wdSpanText)
  if (cacheResult) {
    console.log("use Cache",wdSpanText)
    wdnTranslateBingDom.innerHTML = `<div>${cacheResult.cdef.map((c) => `<span>${c.pos}</span>${c.def}`).join('<br />')}</div>`
  }else {
    chrome.runtime.sendMessage(
      {
        type: 'fetch',
        q: wdSpanText
      },
      (res) => {
        const doc = new DOMParser().parseFromString(res, 'text/html')
        console.log(doc)
        if (doc.querySelector('.client_def_hd_hd')) {
          const { audio, result } = handleLexResult(
            doc,
            {
              tense: true,
              phsym: true,
              cdef: true,
              related: true,
              sentence: 4
            },
            null
          )
          cache.set(wdSpanText, result)
          wdnTranslateBingDom.innerHTML = `<div>${result.cdef.map((c) => `<span>${c.pos}</span>${c.def}`).join('<br />')}</div>`
        }
      }
    )
  }

  bubbleText.textContent = limit_text_len(wdSpanText)
  const prcntFreq = get_word_percentile(wdSpanText.toLowerCase())
  bubbleFreq.textContent = prcntFreq ? `${prcntFreq}%` : 'n/a'
  bubbleFreq.style.backgroundColor = getHeatColorPoint(prcntFreq)
  current_lexeme = wdSpanText
  const bcr = node_to_render.getBoundingClientRect()
  bubbleDOM.style.top = `${bcr.bottom}px`
  bubbleDOM.style.left = `${Math.max(5, Math.floor((bcr.left + bcr.right) / 2) - 100)}px`
  bubbleDOM.style.display = 'block'
  rendered_node_id = node_to_render_id

  if (wd_enable_tts) {
    chrome.runtime.sendMessage({ type: 'tts_speak', word: wdSpanText })
  }
}

function hideBubble(force) {
  const bubbleDOM = document.getElementById('wd_selection_bubble')
  if (
    force ||
    (!bubbleDOM.wdMouseOn && node_to_render_id !== rendered_node_id)
  ) {
    bubbleDOM.style.display = 'none'
    rendered_node_id = null
  }
}

function process_hl_leave() {
  node_to_render_id = null
  setTimeout(function() {
    hideBubble(false)
  }, 100)
}

function processMouse(e) {
  const hitNode = document.elementFromPoint(e.clientX, e.clientY)
  if (!hitNode) {
    process_hl_leave()
    return
  }
  let classattr = null
  try {
    classattr = hitNode.getAttribute('class')
  } catch (exc) {
    process_hl_leave()
    return
  }
  if (!classattr || !classattr.startsWith('wdautohl_')) {
    process_hl_leave()
    return
  }
  node_to_render_id = hitNode.id
  setTimeout(function() {
    renderBubble()
  }, 200)
}

function text_to_hl_nodes(text, dst) {
  const lc_text = text.toLowerCase()
  let ws_text = lc_text.replace(
    /[,;()?!`:"'.\s\-\u2013\u2014\u201C\u201D\u2019]/g,
    ' '
  )
  ws_text = ws_text.replace(/[^\w ]/g, '.')

  const tokens = ws_text.split(' ')

  let num_good = 0 // number of found dictionary words
  let num_nonempty = 0
  let ibegin = 0 // beginning of word
  let wnum = 0 // word number

  const matches = []

  const tokenize_other = wd_hover_settings.ow_hover !== 'never'

  while (wnum < tokens.length) {
    if (!tokens[wnum].length) {
      wnum += 1
      ibegin += 1
      continue
    }
    num_nonempty += 1
    let match
    if (!match && wd_hl_settings.idiomParams.enabled) {
      let lwnum = wnum // look ahead word number
      let libegin = ibegin // look ahead word begin
      let mwe_prefix = ''
      while (lwnum < tokens.length) {
        mwe_prefix += tokens[lwnum]
        let wf
        if (dict_idioms.hasOwnProperty(mwe_prefix)) {
          wf = dict_idioms[mwe_prefix]
        }
        if (wf === -1 && (!libegin || text[libegin - 1] === ' ')) {
          // idiom prefix found
          mwe_prefix += ' '
          libegin += tokens[lwnum].length + 1
          lwnum += 1
        } else if (wf && wf !== -1 && (!libegin || text[libegin - 1] === ' ')) {
          // idiom found
          if (user_vocabulary && user_vocabulary.hasOwnProperty(wf)) break
          match = {
            normalized: wf,
            kind: 'idiom',
            begin: ibegin,
            end: ibegin + mwe_prefix.length
          }
          ibegin += mwe_prefix.length + 1
          num_good += lwnum - wnum + 1
          wnum = lwnum + 1
        } else {
          // idiom not found
          break
        }
      }
    }
    if (!match && wd_hl_settings.wordParams.enabled) {
      const lemma = get_rare_lemma(tokens[wnum])
      if (lemma) {
        match = {
          normalized: lemma,
          kind: 'lemma',
          begin: ibegin,
          end: ibegin + tokens[wnum].length
        }
        ibegin += tokens[wnum].length + 1
        wnum += 1
        num_good += 1
      }
    }
    if (
      tokenize_other &&
      !match &&
      tokens[wnum].length >= 3 &&
      word_re.test(tokens[wnum])
    ) {
      match = {
        normalized: null,
        kind: 'word',
        begin: ibegin,
        end: ibegin + tokens[wnum].length
      }
      ibegin += tokens[wnum].length + 1
      wnum += 1
    }
    if (dict_words.hasOwnProperty(tokens[wnum])) {
      num_good += 1
    }
    if (match) {
      matches.push(match)
    } else {
      ibegin += tokens[wnum].length + 1
      wnum += 1
    }
  }

  if (num_good / num_nonempty < 0.1) {
    return 0
  }

  let last_hl_end_pos = 0
  let insert_count = 0
  for (let i = 0; i < matches.length; i++) {
    let text_style
    const match = matches[i]
    if (match.kind === 'lemma') {
      const hlParams = wd_hl_settings.wordParams
      text_style = make_hl_style(hlParams)
    } else if (match.kind === 'idiom') {
      const hlParams = wd_hl_settings.idiomParams
      text_style = make_hl_style(hlParams)
    } else if (match.kind === 'word') {
      text_style =
        'font:inherit;display:inline;color:inherit;background-color:inherit;'
    }
    if (text_style) {
      insert_count += 1
      if (last_hl_end_pos < match.begin) {
        dst.push(
          document.createTextNode(text.slice(last_hl_end_pos, match.begin))
        )
      }
      last_hl_end_pos = match.end
      // span = document.createElement("span");
      const span = document.createElement('wdautohl-customtag')
      span.textContent = text.slice(match.begin, last_hl_end_pos)
      span.setAttribute('style', text_style)
      span.id = `wdautohl_id_${cur_wd_node_id}`
      cur_wd_node_id += 1
      const wdclassname = make_class_name(match.normalized)
      span.setAttribute('class', wdclassname)
      dst.push(span)
    }
  }

  if (insert_count && last_hl_end_pos < text.length) {
    dst.push(document.createTextNode(text.slice(last_hl_end_pos, text.length)))
  }

  return insert_count
}

const good_tags_list = [
  'P',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'B',
  'SMALL',
  'STRONG',
  'Q',
  'DIV',
  'SPAN'
]

function mygoodfilter(node) {
  if (good_tags_list.indexOf(node.parentNode.tagName) !== -1)
    return NodeFilter.FILTER_ACCEPT
  return NodeFilter.FILTER_SKIP
}

function textNodesUnder(el) {
  let n
  const a = []
  const walk = document.createTreeWalker(
    el,
    NodeFilter.SHOW_TEXT,
    mygoodfilter,
    false
  )
  while ((n = walk.nextNode())) {
    a.push(n)
  }
  return a
}

function doHighlightText(textNodes) {
  if (textNodes === null || dict_words === null || min_show_rank === null) {
    return
  }
  if (disable_by_keypress) {
    return
  }
  let num_found = 0
  for (let i = 0; i < textNodes.length; i++) {
    if (textNodes[i].offsetParent === null) {
      continue
    }
    const text = textNodes[i].textContent
    if (text.length <= 3) {
      continue
    }
    if (text.indexOf('{') !== -1 && text.indexOf('}') !== -1) {
      continue // pathetic hack to skip json data in text (e.g. google images use it).
    }
    const new_children = []
    const found_count = text_to_hl_nodes(text, new_children)
    if (found_count) {
      num_found += found_count
      const parent_node = textNodes[i].parentNode
      assert(new_children.length > 0, 'children must be non empty')
      for (let j = 0; j < new_children.length; j++) {
        parent_node.insertBefore(new_children[j], textNodes[i])
      }
      parent_node.removeChild(textNodes[i])
    }
    if (num_found > 10000)
      // limiting number of words to highlight
      break
  }
}

function onNodeInserted(event) {
  const inobj = event.target
  if (!inobj) return
  let classattr = null
  if (typeof inobj.getAttribute !== 'function') {
    return
  }
  try {
    classattr = inobj.getAttribute('class')
  } catch (e) {
    return
  }
  if (!classattr || !classattr.startsWith('wdautohl_')) {
    const textNodes = textNodesUnder(inobj)
    doHighlightText(textNodes)
  }
}

function unhighlight(lemma) {
  const wdclassname = make_class_name(lemma)
  const hlNodes = document.getElementsByClassName(wdclassname)
  while (hlNodes && hlNodes.length > 0) {
    const span = hlNodes[0]
    span.setAttribute(
      'style',
      'font-weight:inherit;color:inherit;font-size:inherit;background-color:inherit;display:inline;'
    )
    span.setAttribute('class', 'wdautohl_none_none')
  }
}

function get_verdict(isEnabled, black_list, white_list, callback_func) {
  chrome.runtime.sendMessage({ wdm_request: 'hostname' }, function(response) {
    if (!response) {
      callback_func('unknown error')
      return
    }
    const hostname = response.wdm_hostname
    if (black_list.hasOwnProperty(hostname)) {
      callback_func('site in "Skip List"')
      return
    }
    if (white_list.hasOwnProperty(hostname)) {
      callback_func('highlight')
      return
    }
    if (!isEnabled) {
      callback_func('site is not in "Favorites List"')
      return
    }
    chrome.runtime.sendMessage(
      { wdm_request: 'page_language' },
      function(lang_response) {
        if (!lang_response) {
          callback_func('unknown error')
          return
        }
        callback_func(
          lang_response.wdm_iso_language_code === 'en'
            ? 'highlight'
            : 'page language is not English'
        )
      }
    )
  })
}

function bubble_handle_tts(lexeme) {
  chrome.runtime.sendMessage({ type: 'tts_speak', word: lexeme })
}

function bubble_handle_add_result(report, lemma) {
  if (report === 'ok') {
    unhighlight(lemma)
  }
}

function create_bubble() {
  const bubbleDOM = document.createElement('div')
  bubbleDOM.setAttribute('class', 'wdSelectionBubble')
  bubbleDOM.setAttribute('id', 'wd_selection_bubble')

  const infoSpan = document.createElement('span')
  infoSpan.setAttribute('id', 'wd_selection_bubble_text')
  infoSpan.setAttribute('class', 'wdInfoSpan')
  bubbleDOM.appendChild(infoSpan)

  const freqSpan = document.createElement('span')
  freqSpan.setAttribute('id', 'wd_selection_bubble_freq')
  freqSpan.setAttribute('class', 'wdFreqSpan')
  freqSpan.textContent = 'n/a'
  bubbleDOM.appendChild(freqSpan)

  const addAndAudioWrapDom = document.createElement('div')
  addAndAudioWrapDom.setAttribute('class', 'addAndAudioWrap')
  bubbleDOM.appendChild(addAndAudioWrapDom)

  const addButton = document.createElement('button')
  addButton.setAttribute('class', 'wdAddButton')
  addButton.textContent = chrome.i18n.getMessage('menuItem')
  addButton.style.marginBottom = '4px'
  addButton.addEventListener('click', function() {
    add_lexeme(current_lexeme, bubble_handle_add_result)
  })
  addAndAudioWrapDom.appendChild(addButton)

  const speakButton = document.createElement('button')
  speakButton.setAttribute('class', 'wdAddButton')
  speakButton.textContent = 'Audio'
  speakButton.style.marginBottom = '4px'
  speakButton.addEventListener('click', function() {
    bubble_handle_tts(current_lexeme)
  })
  addAndAudioWrapDom.appendChild(speakButton)

  // dictPairs = makeDictionaryPairs();
  //   var dictPairs = wd_online_dicts
  //   for (var i = 0; i < dictPairs.length; ++i) {
  //     var dictButton = document.createElement('button')
  //     dictButton.setAttribute('class', 'wdAddButton')
  //     dictButton.textContent = dictPairs[i].title
  //     dictButton.setAttribute('wdDictRefUrl', dictPairs[i].url)
  //     dictButton.addEventListener('click', function (e) {
  //       target = e.target
  //       dictUrl = target.getAttribute('wdDictRefUrl')
  //       var newTabUrl = get_dict_definition_url(dictUrl, current_lexeme)
  //       chrome.runtime.sendMessage({ wdm_new_tab_url: newTabUrl })
  //     })
  //     bubbleDOM.appendChild(dictButton)
  //   }

  const div = document.createElement('div')
  div.id = 'wdn_translate_bing'
  bubbleDOM.appendChild(div)

  bubbleDOM.addEventListener('mouseleave', function(e) {
    bubbleDOM.wdMouseOn = false
    hideBubble(false)
  })
  bubbleDOM.addEventListener('mouseenter', function(e) {
    bubbleDOM.wdMouseOn = true
  })

  return bubbleDOM
}

function initForPage() {
  if (!document.body) return

  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.wdm_unhighlight) {
        const lemma = request.wdm_unhighlight
        unhighlight(lemma)
      }
    }
  )

  chrome.storage.local.get(
    [
      'words_discoverer_eng_dict',
      'wd_online_dicts',
      'wd_idioms',
      'wd_hover_settings',
      'wd_word_max_rank',
      'wd_show_percents',
      'wd_is_enabled',
      'wd_user_vocabulary',
      'wd_hl_settings',
      'wd_black_list',
      'wd_white_list',
      'wd_enable_tts'
    ],
    function(result) {
      dict_words = result.words_discoverer_eng_dict
      dict_idioms = result.wd_idioms
      wd_online_dicts = result.wd_online_dicts
      wd_enable_tts = result.wd_enable_tts
      user_vocabulary = result.wd_user_vocabulary
      wd_hover_settings = result.wd_hover_settings
      word_max_rank = result.wd_word_max_rank
      const show_percents = result.wd_show_percents
      wd_hl_settings = result.wd_hl_settings
      min_show_rank = (show_percents * word_max_rank) / 100
      is_enabled = result.wd_is_enabled
      const black_list = result.wd_black_list
      const white_list = result.wd_white_list

      get_verdict(is_enabled, black_list, white_list, function(verdict) {
        chrome.runtime.sendMessage({ wdm_verdict: verdict })
        if (verdict !== 'highlight') return

        document.addEventListener('keydown', function(event) {
          if (event.keyCode === 17) {
            function_key_is_pressed = true
            renderBubble()
            return
          }
          const elementTagName = event.target.tagName
          if (!disable_by_keypress && elementTagName !== 'BODY') {
            // 例如新建issue，写md，然后预览会触发
            // workaround to prevent highlighting in facebook messages
            // this logic can also be helpful in other situations, it's better play safe and stop highlighting when user enters data.
            disable_by_keypress = true
            chrome.runtime.sendMessage({ wdm_verdict: 'keyboard' })
          }
        })

        document.addEventListener('keyup', function(event) {
          if (event.keyCode === 17) {
            function_key_is_pressed = false
          }
        })

        const textNodes = textNodesUnder(document.body)
        doHighlightText(textNodes)

        const bubbleDOM = create_bubble()
        document.body.appendChild(bubbleDOM)
        document.addEventListener('mousedown', hideBubble(true), false)
        document.addEventListener('mousemove', processMouse, false)
        // document.addEventListener("DOMNodeInserted", onNodeInserted, false);
        new MutationObserver((mutationList, observer) => {
          mutationList.forEach(onNodeInserted)
        }).observe(document, { subtree: true, childList: true })

        window.addEventListener('scroll', function() {
          node_to_render_id = null
          hideBubble(true)
        })
      })
    }
  )
}

document.addEventListener('DOMContentLoaded', function(event) {
  initForPage()
})
