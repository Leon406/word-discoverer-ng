import { add_lexeme, make_hl_style, make_class_name, unhighlight } from './common_lib'
import { handleLexResult } from './utils/bing'

import { get_dict_definition_url } from './context_menu_lib'


const function_words = new Set([
  // Articles
  'the', 'a', 'an',
  // Prepositions
  'about', 'above', 'across', 'after', 'against', 'along', 'among', 'around', 'as',
  'at', 'before', 'behind', 'below', 'beneath', 'beside', 'between', 'beyond', 'by',
  'down', 'during', 'except', 'for', 'from', 'in', 'inside', 'into', 'like', 'near',
  'of', 'off', 'on', 'onto', 'opposite', 'out', 'outside', 'over', 'past', 'round',
  'since', 'through', 'to', 'toward', 'under', 'underneath', 'until', 'up', 'upon',
  'with', 'within', 'without',
  // Pronouns
  // Personal Pronouns
  'i', 'me', 'my', 'mine', 'we', 'us', 'our', 'ours', 'you', 'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'hers', 'it', 'its', 'they', 'them', 'their', 'theirs',
  // Demonstrative Pronouns
  'this', 'that', 'these', 'those',
  // Interrogative Pronouns
  'who', 'whom', 'whose', 'what', 'which',
  // Relative Pronouns
  'who', 'whom', 'whose', 'which', 'that',
  // Indefinite Pronouns
  'all', 'another', 'any', 'anybody', 'anyone', 'anything', 'both', 'each', 'either',
  'every', 'everybody', 'everyone', 'everything', 'few', 'many', 'most', 'much',
  'neither', 'none', 'nobody', 'nothing', 'one', 'other', 'several', 'some', 'somebody',
  'someone', 'something',
  // Reflexive Pronouns
  'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'yourselves', 'themselves',
  // Conjunctions
  // Coordinating Conjunctions
  'and', 'but', 'or', 'nor', 'for', 'so', 'yet',
  // Subordinating Conjunctions
  'after', 'although', 'as', 'because', 'before', 'if', 'lest', 'once', 'since', 'than',
  'that', 'though', 'till', 'unless', 'until', 'when', 'whenever', 'where',
  'whereas', 'wherever', 'while',
  'whether',
  // Auxiliary Verbs / Modal Verbs
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should',
  'can', 'could', 'may', 'might', 'must',
  // Interjections
  'oh', 'ah', 'wow', 'ouch', 'gosh', 'ow', 'ew', 'yes', 'okay', 'no', 'nope'
])
let dict_words = null
let dict_idioms = null

let min_show_rank = null
let max_show_rank = null
let word_max_rank = null
let user_vocabulary = null
let is_enabled = null
let wd_hl_settings = null
let wd_hover_settings = null
let wd_online_dicts = null
let wd_enable_tts = null
let wd_enable_prefetch = null

let disable_by_keypress = false

let pre_words = new Set()

let current_lexeme = ''
let cur_wd_node_id = 1

const word_re = /^[a-z'’]+$/

let function_key_is_pressed = false
let rendered_node_id = null
let node_to_render_id = null
let frequency = { rare: { count: 0, sets: new Set() }, tokens: 0, lemmas: {} }

const FUNCTION_WORD_STYLE = 'font:inherit;font-size:0.875em;color:#777777;background-color:inherit;'
const NORMAL_STYLE = 'font:inherit;color:inherit;background-color:inherit;'

function get_rare_lemma(word) {
  if (word.length < 3) return undefined
  let wf
  if (dict_words.hasOwnProperty(word)) {
    wf = dict_words[word]
  }
  if (check_hidden_rank(wf)) return undefined
  const lemma = wf[0]
  return !user_vocabulary || !user_vocabulary.hasOwnProperty(lemma)
    ? lemma
    : undefined
}

function get_lemma(word) {
  let wf
  if (dict_words.hasOwnProperty(word)) {
    wf = dict_words[word]
  }
  if (!wf) return word
  const lemma = wf[0]
  if (!lemma) return word
  return !user_vocabulary || !user_vocabulary.hasOwnProperty(lemma)
    ? lemma
    : word
}

function get_rare_lemma2(word) {
  let wf
  if (dict_words.hasOwnProperty(word)) {
    wf = dict_words[word]
  }
  if (check_hidden_rank(wf)) return undefined
  return wf ? wf[0] : undefined
}

function check_hidden_rank(wf) {
  return !wf || wf[1] < min_show_rank || wf[1] > max_show_rank
}

function get_word_percentile(word) {
  if (!dict_words.hasOwnProperty(word)) return undefined
  const wf = dict_words[word]
  return Math.ceil((wf[1] * 100) / word_max_rank)
}

function get_word_rank(word) {
  if (!dict_words.hasOwnProperty(word)) return undefined
  const wf = dict_words[word]
  return wf[1]
}

function get_word_level(word) {
  if (!dict_words.hasOwnProperty(word)) return undefined
  const wf = dict_words[word]
  return Math.ceil(wf[1] / 1000)
}

function assert(condition, message) {
  if (!condition) {
    throw message || 'Assertion failed'
  }
}

function limit_text_len(word) {
  if (!word) return word
  word = word.toLowerCase()
  const max_len = 60
  if (word.length <= max_len) return word
  return `${word.slice(0, max_len)}...`
}

function getHeatColorPoint(freqPercent) {
  if (!freqPercent) freqPercent = 0
  freqPercent = Math.max(0, Math.min(100, freqPercent))
  const hue = 100 - freqPercent
  return `hsl(${hue}, 100%, 50%)`
}

/**
 *  Can't use inline js, CSP
 * Refused to execute inline event handler because it violates the following Content Security Policy directive
 */
function addPhoneticClickEvent() {
  let us = document.getElementById('play_us')
  let uk = document.getElementById('play_uk')
  if (!us || !uk) return

  let clickFunc = (evt) => play(evt.target.getAttribute('data-src'))
  us.addEventListener('click', clickFunc)
  us.addEventListener('mouseover', clickFunc)
  uk.addEventListener('click', clickFunc)
  uk.addEventListener('mouseover', clickFunc)
}

function play(audioUrl) {
  console.debug('play', audioUrl)
  // try {
  new Audio(audioUrl).play().catch((e) => {
    console.error(e)
    chrome.runtime.sendMessage(
      {
        type: 'fetchArrayBuffer',
        audioUrl
      },
      (res) => {
        const arraybuffer = new Uint8Array(JSON.parse(res).data).buffer
        playArrayBuffer(arraybuffer)
      }
    )
  })
}

/**播放 ArrayBuffer 音频*/
function playArrayBuffer(arrayBuffer) {
  const context = new AudioContext()
  context.decodeAudioData(arrayBuffer.slice(0), (audioBuffer) => {
    // `slice(0)`克隆一份（`decodeAudioData`后原数组清空）
    const bufferSource = context.createBufferSource()
    bufferSource.buffer = audioBuffer
    bufferSource.connect(context.destination)
    bufferSource.start(0)
  })
}

function renderBubble() {
  if (!node_to_render_id) return
  if (node_to_render_id === rendered_node_id) return

  const node_to_render = document.getElementById(node_to_render_id)
  if (!node_to_render) return

  const classattr = node_to_render.getAttribute('class')
  const is_highlighted = classattr !== 'wdhl_none_none'
  const param_key = is_highlighted ? 'hl_hover' : 'ow_hover'
  const param_value = wd_hover_settings[param_key]
  if (
    param_value === 'never' ||
    (param_value === 'key' && !function_key_is_pressed)
  ) {
    return
  }

  const wdSpanText = node_to_render.textContent
  const q = wdSpanText.toLowerCase()
  let lemma = node_to_render.getAttribute('lemma')
  lemma = lemma && lemma !== 'undefined' ? lemma : ''
  const bubbleDOM = document.getElementById('wd_selection_bubble')
  const bubbleText = document.getElementById('wd_selection_bubble_text')
  const bubbleFreq = document.getElementById('wd_selection_bubble_freq')
  const wdnTranslateBingDom = document.getElementById('wdn_translate_bing')
  // 避免网络问题，显示上一次内容
  wdnTranslateBingDom.innerHTML = ''

  function bingHtml(bingResult) {
    let inf_html = ''
    let phonetic_html = ''
    console.log('audio1', bingResult)
    if (bingResult.phsym && bingResult.phsym.length) {
      phonetic_html = `<div class="phonetic">
        <span id="play_us" data-src="${bingResult.phsym[0].pron}">${bingResult.phsym[0].lang}</span>
        <span id="play_uk" data-src="${bingResult.phsym[1].pron}">${bingResult.phsym[1].lang}</span>
      </div>`
    } else {
      phonetic_html = `<div>♫
      <a target="_blank" href="https://youglish.com/search/${q}">
      YouGlish</a>
      <a target="_blank" href="https://www.playphrase.me/#/search?q=${q}">
      PlayPhrase</a>
      <a target="_blank" href="https://getyarn.io/yarn-find?text=${q}">
      Yarn</a>
    </div>`
    }
    if (bingResult.infs && bingResult.infs.length) {
      inf_html = `<div class="inflection"><span>词形变换</span>${bingResult.infs.map((c) => `${c}&nbsp;&nbsp;`).join('')}</div>`
    }
    wdnTranslateBingDom.innerHTML =
      phonetic_html +
      `<div>${bingResult.cdef.map((c) => `<span>${c.pos}</span>${c.def}`).join('<br />')}</div>` +
      inf_html
    addPhoneticClickEvent()
  }

  function errorHtml() {
    const dict_html = `<div >Definition: 
          <a target="_blank" href="https://www.google.com/search?q=${q}+definition">Google</a>
          </div>`
    const pron_html = `<div>♫
          <a target="_blank" href="https://youglish.com/search/${q}">
          YouGlish</a>
          <a target="_blank" href="https://www.playphrase.me/#/search?q=${q}">
          PlayPhrase</a>
          <a target="_blank" href="https://getyarn.io/yarn-find?text=${q}">
          Yarn</a>
        </div>`
    wdnTranslateBingDom.innerHTML = dict_html + pron_html
  }

  chrome.runtime.sendMessage(
    {
      type: 'fetch',
      q: wdSpanText
    },
    (res) => {
      const doc = new DOMParser().parseFromString(res, 'text/html')
      if (doc.querySelector('.client_def_hd_hd')) {
        let lexResult = handleLexResult(
          doc,
          {
            tense: true,
            phsym: true,
            cdef: true,
            related: false,
            sentence: 0
          },
          null
        )
        if (lexResult && lexResult.result && lexResult.result.cdef) {
          const { result } = lexResult
          bingHtml(result)
        } else {
          errorHtml()
        }
      } else {
        errorHtml()
      }
    }
  )

  bubbleText.textContent = limit_text_len(wdSpanText)
  // if config third schema, use last one
  let thirdDict = wd_online_dicts.findLast(
    (dict) => !dict.url.startsWith('http')
  )
  if (thirdDict) {
    bubbleText.onclick = function(e) {
      e.preventDefault()
      e.stopImmediatePropagation()
      window.open(get_dict_definition_url(thirdDict.url, wdSpanText))
    }
  }

  bubbleText.setAttribute('title', lemma)
  const prcntFreq = get_word_percentile(q)
  const level = get_word_level(q)
  bubbleFreq.textContent = prcntFreq ? `${level} K (${prcntFreq}%)` : 'n/a'
  if (lemma) {
    const rank = get_word_rank(q)
    let pageLemmaCounts = lemma
      ? document.querySelectorAll(`wdhl[lemma="${lemma}"]`).length
      : 1
    bubbleFreq.title =
      `count: ${pageLemmaCounts}` + (rank ? ` rank: ${rank}` : '')
  }

  bubbleFreq.style.backgroundColor = getHeatColorPoint(prcntFreq)
  current_lexeme = lemma
  let maxLeft = window.innerWidth - 424
  let maxTop = window.innerHeight - 300
  const bcr = node_to_render.getBoundingClientRect()

  let topPx = Math.min(maxTop, bcr.bottom)
  bubbleDOM.style.top = `${topPx}px`
  let leftPx = Math.min(
    maxLeft,
    Math.max(5, Math.floor((bcr.left + bcr.right) / 2) - 100)
  )
  bubbleDOM.style.left = `${leftPx}px`
  bubbleDOM.style.display = 'block'
  rendered_node_id = node_to_render_id

  if (wd_enable_tts) {
    chrome.runtime.sendMessage({ type: 'tts_speak', word: wdSpanText })
  }
}

function hideBubble(force) {
  function_key_is_pressed = false
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
  if (!classattr || !classattr.startsWith('wdhl_')) {
    process_hl_leave()
    return
  }
  node_to_render_id = hitNode.id
  setTimeout(function() {
    renderBubble()
  }, 200)
}

function preFetchBing(w) {
  var q = w.toLowerCase().trim()
  // 只预缓存 100
  if (wd_enable_prefetch && !pre_words.has(q) && pre_words.size < 100) {
    pre_words.add(q)
    chrome.runtime.sendMessage(
      {
        type: 'fetch',
        q: q
      },
      function(res) {
        console.log(`prefetch ${q}`)
      }
    )
  }
}

function text_to_hl_nodes(text, dst) {
  const lc_text = text.toLowerCase()
  let ws_text = lc_text.replace(
    /[,;()?!`:".\s\-\u2013\u2014\u201C\u201D]/g,
    ' '
  )

  ws_text = ws_text.replace(/[^\w '\u2019]/g, '.')
  const tokens = ws_text.split(' ')
  let words = tokens.filter(w => word_re.test(w) && !w.startsWith('\''))
  frequency.tokens += words.length
  words.map(item => get_lemma(item))
    .reduce((acc, key) => {
      if (!acc[key]) {
        acc[key] = 0
      }
      acc[key] = acc[key] + 1
      return acc
    }, frequency.lemmas)

  console.log('tokens', Object.keys(frequency.lemmas).length, frequency)
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
      tokens[wnum].length >= 2 &&
      word_re.test(tokens[wnum])
    ) {
      match = {
        normalized: null,
        raw: tokens[wnum],
        kind: 'word',
        begin: ibegin,
        end: ibegin + tokens[wnum].length
      }
      ibegin += tokens[wnum].length + 1
      wnum += 1
      num_good += 1
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
      frequency.rare.count++
      frequency.rare.sets.add(match.normalized)
    } else if (match.kind === 'idiom') {
      const hlParams = wd_hl_settings.idiomParams
      text_style = make_hl_style(hlParams)
    } else if (match.kind === 'word') {
      // function word
      text_style = function_words.has(match.raw) ? FUNCTION_WORD_STYLE : NORMAL_STYLE
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
      const span = document.createElement('wdhl')
      span.textContent = text.slice(match.begin, last_hl_end_pos)
      if (text_style === FUNCTION_WORD_STYLE && isAllUpperCase(span.textContent)) {
        text_style = NORMAL_STYLE
      }
      span.setAttribute('style', text_style)
      if (match.normalized) {
        span.setAttribute('lemma', match.normalized)
        preFetchBing(span.textContent)
      } else {
        const lemma = get_rare_lemma2(span.textContent.toLowerCase().trim())
        span.setAttribute('lemma', lemma)
      }
      span.id = `wdhl_id_${cur_wd_node_id}`
      cur_wd_node_id += 1
      const wdclassname = make_class_name(match.normalized)
      span.setAttribute('class', wdclassname)
      dst.push(span)
    }
  }

  if (insert_count && last_hl_end_pos < text.length) {
    dst.push(document.createTextNode(text.slice(last_hl_end_pos, text.length)))
  }
  console.log(make_rate_info())
  return insert_count
}

function make_rate_info() {
  const lemmaRareCount = frequency.rare.sets.size
  const lemmaCount = Object.keys(frequency.lemmas).length
  const lemmaRate = parseFloat(lemmaRareCount * 100 / lemmaCount).toFixed(2)
  const tokenRate = parseFloat(frequency.rare.count * 100 / frequency.tokens).toFixed(2)
  return `tokens ${frequency.rare.count}/${frequency.tokens} (${tokenRate}%) lemma: ${lemmaRareCount}/${lemmaCount} (${lemmaRate}%)`
}

const invalidTags = [
  'SCRIPT',
  'STYLE',
  'TITLE',
  'VIDEO',
  'SVG',
  'CODE',
  'NOSCRIPT',
  'NOFRAMES',
  'INPUT',
  'TEXTAREA',
  'ABBR',
  'AREA',
  'PRE',
  'AUDIO',
  'CANVAS',
  'HEAD',
  'MAP',
  'META',
  'OBJECT',
  'WH-ROOT',
  'WDHL',
  'W-MARK-T'
]
const EN_REG = /\b[a-z'’]{2,}\b/gi
const SCHEMA_REG = /:\/\//gi

function isAllUpperCase(word) {
  return word === word.toUpperCase()
}


function filterType(node) {
  // 过滤可编辑文本
  if (node.isContentEditable || node.parentElement.isContentEditable) {
    return NodeFilter.FILTER_SKIP
  }
  // 不包含字母
  let trimText = node.textContent.trim().toString()
  if (!EN_REG.test(trimText)) {
    return NodeFilter.FILTER_SKIP
  }

  let b1 = SCHEMA_REG.test(trimText)
  if (b1 || SCHEMA_REG.test(trimText)) {
    return NodeFilter.FILTER_SKIP
  }

  if (node.parentNode.classList.contains('base-model')) {
    return NodeFilter.FILTER_SKIP
  }
  // mat-select 下拉选择失效
  // .wdSelectionBubble 翻译bubble
  if (node.parentNode.closest('mat-option,mat-select,.wdSelectionBubble,#wd_toast')) {
    return NodeFilter.FILTER_SKIP
  }
  return invalidTags.includes(node.tagName) ||
  invalidTags.includes(node.parentNode.tagName)
    ? NodeFilter.FILTER_SKIP
    : NodeFilter.FILTER_ACCEPT
}

function textNodesUnder(el) {
  let n
  const a = []
  const walk = document.createTreeWalker(
    el,
    NodeFilter.SHOW_TEXT,
    filterType,
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
      // 修复flex 空格失效
      let computedValue =
        getComputedStyle(parent_node) ||
        document.defaultView.getComputedStyle(parent_node)
      console.log(
        'doHighlightText',
        parent_node.textContent,
        computedValue.display
      )
      const isFlex =
        computedValue.display === 'flex' ||
        computedValue.display === 'inline-flex'
      assert(new_children.length > 0, 'children must be non empty')
      for (let j = 0; j < new_children.length; j++) {
        const child = new_children[j]
        if (isFlex) {
          child.className = 'fix'
        }
        parent_node.insertBefore(child, textNodes[i])
      }
      parent_node.removeChild(textNodes[i])
    }
    if (num_found > 10000)
      // limiting number of words to highlight
      break
  }
}

function onNodeChanged(event) {
  const inobj = event.target
  if (!inobj) return
  // todo ignore editor
  if (inobj.closest('.wdSelectionBubble,.cm-editor')) {
    console.info('bypass', inobj)
    return
  }

  let classattr = null
  if (typeof inobj.getAttribute !== 'function') {
    return
  }
  try {
    classattr = inobj.getAttribute('class')
  } catch (e) {
    return
  }
  if (!classattr || !classattr.startsWith('wdhl_')) {
    const textNodes = textNodesUnder(inobj)
    if (textNodes.length) {
      console.log(
        'onNodeChanged highlight',
        textNodes.map((e) => e.textContent)
      )
      doHighlightText(textNodes)
    }
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
    let count = document.getElementsByClassName(make_class_name(lemma)).length
    frequency.rare.count-= count
    frequency.rare.sets.delete(lemma)
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
  addAndAudioWrapDom.style.marginBottom = '8px'
  bubbleDOM.appendChild(addAndAudioWrapDom)

  const addButton = document.createElement('button')
  addButton.setAttribute('class', 'wdAddButton')
  addButton.textContent = chrome.i18n.getMessage('menuItem')
  addButton.style.marginBottom = '4px'
  addButton.addEventListener('click', function() {
    add_lexeme(current_lexeme, bubble_handle_add_result)
    user_vocabulary[current_lexeme] = 1
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
function showToast(message) {
  // 防止重复添加
  let existingToast = document.getElementById('wd_toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.id = 'wd_toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  // 5秒后自动隐藏
  setTimeout(() => {
    toast.style.display = 'none';
  }, 5000);
}

export function initForPage() {
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
    ['words_discoverer_eng_dict', 'wd_idioms', 'wd_user_vocabulary'],
    function(result) {
      dict_words = result.words_discoverer_eng_dict
      dict_idioms = result.wd_idioms
      user_vocabulary = result.wd_user_vocabulary
      chrome.storage.sync.get(
        [
          'wd_online_dicts',
          'wd_hover_settings',
          'wd_show_percents',
          'wd_last_hidden_percents',
          'wd_is_enabled',
          'wd_hl_settings',
          'wd_black_list',
          'wd_white_list',
          'wd_word_max_rank',
          'wd_enable_prefetch',
          'wd_enable_tts'
        ],
        function(config) {
          wd_online_dicts = config.wd_online_dicts
          wd_enable_tts = config.wd_enable_tts
          wd_enable_prefetch = config.wd_enable_prefetch
          wd_hover_settings = config.wd_hover_settings
          word_max_rank = config.wd_word_max_rank
          const show_percents = config.wd_show_percents
          const wd_last_hidden_percents = config.wd_last_hidden_percents
          wd_hl_settings = config.wd_hl_settings
          min_show_rank = (show_percents * word_max_rank) / 100
          max_show_rank = word_max_rank - (wd_last_hidden_percents * word_max_rank) / 100
          console.log('max', wd_last_hidden_percents, max_show_rank)
          is_enabled = config.wd_is_enabled
          const black_list = config.wd_black_list
          const white_list = config.wd_white_list
          get_verdict(is_enabled, black_list, white_list, function(verdict) {
            console.log('get_verdict', verdict)
            chrome.runtime.sendMessage({ wdm_verdict: verdict })
            // 支持非英文网页
            if (
              verdict !== 'highlight' &&
              verdict !== 'page language is not English'
            )
              return
            let keyPressHistory = [];
            document.addEventListener('keydown', function(event) {
              if (event.keyCode === 17) {
                // Ctrl
                function_key_is_pressed = true
                renderBubble()
                return
              }
              if (event.key === 'i') {
                const now = Date.now();
                keyPressHistory.push(now);
                keyPressHistory = keyPressHistory.filter(time => now - time < 1000);
                if (keyPressHistory.length >= 2) {
                  keyPressHistory = [];
                  const info = make_rate_info();
                  showToast(info);
                }
              }
              const elementTagName = event.target.tagName
              // const href = location.href
              // console.log('elementTagName', elementTagName, href)
              if (!disable_by_keypress && elementTagName !== 'BODY' && location.protocol != 'chrome-extension:') {
                // 例如新建issue，写md，然后预览会触发
                // workaround to prevent highlighting in facebook messages
                // this logic can also be helpful in other situations, it's better play safe and stop highlighting when user enters data.
                disable_by_keypress = true
                chrome.runtime.sendMessage({ wdm_verdict: 'keyboard' })
              } else {
                disable_by_keypress = false
              }
            })

            document.addEventListener('keyup', function(event) {
              if (event.keyCode === 17) {
                // Ctrl
                function_key_is_pressed = false
              }
            })

            // 默认加载
            const textNodes = textNodesUnder(document.body)
            doHighlightText(textNodes)

            const bubbleDOM = create_bubble()
            document.body.appendChild(bubbleDOM)
            document.addEventListener('mousemove', processMouse, false)
            // 动态加载
            new MutationObserver((mutationList, observer) => {
              mutationList.forEach(onNodeChanged)
            }).observe(document, { subtree: true, childList: true })

            window.addEventListener('scroll', function() {
              node_to_render_id = null
              hideBubble(true)
            })
          })
        }
      )
    }
  )
}

document.addEventListener('DOMContentLoaded', initForPage)
