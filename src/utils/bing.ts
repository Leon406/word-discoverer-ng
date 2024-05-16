import { handleNoResult, getText, getInnerHTML, DictSearchResult } from './index'

const HOST = 'https://cn.bing.com'

type BingSearchResultLex = DictSearchResult<BingResultLex>

/** Lexical result */
export interface BingResultLex {
  type: 'lex'
  title: string
  /** phonetic symbols */
  phsym?: Array<{
    /** Phonetic Alphabet, UK|US|PY */
    lang: string
    /** pronunciation */
    pron: string
  }>
  /** common definitions */
  cdef?: Array<{
    /** part of speech */
    pos: string
    /** definition */
    def: string
  }>
  /** infinitive */
  infs?: string[]
  sentences?: Array<{
    en?: string
    chs?: string
    source?: string
    mp3?: string
  }>
}

type BingConfigOption={
  tense: boolean
  phsym: boolean
  cdef: boolean
  related: boolean
  sentence: number
}

export function handleLexResult(
  doc: Document,
  options: BingConfigOption,
  transform: null | ((text: string) => string),
): BingSearchResultLex | Promise<BingSearchResultLex> {
  const searchResult: DictSearchResult<BingResultLex> = {
    result: {
      type: 'lex',
      title: getText(doc, '.client_def_hd_hd', transform),
    },
  }

  // pronunciation
  if (options.phsym) {
    const $prons = Array.from(doc.querySelectorAll('.client_def_hd_pn_list'))
    if ($prons.length > 0) {
      searchResult.result.phsym = $prons.map((el) => {
        let pron = ''
        const $audio = el.querySelector('.client_aud_o')
        console.log("audio",$audio)
        if ($audio) {
          pron = (($audio.getAttribute('data-pronunciation') || '').match(/https.*\.mp3/) || [''])[0]
          console.log("pron",pron)
        }
        return {
          lang: getText(el, '.client_def_hd_pn'),
          pron,
        }
      })

      searchResult.audio = searchResult.result.phsym.reduce((audio: any, { lang, pron }) => {
        if (/us|美/i.test(lang)) {
          audio.us = pron
        } else if (/uk|英/i.test(lang)) {
          audio.uk = pron
        }
        return audio
      }, {})
    }
  }

  // definitions
  if (options.cdef) {
    const $container = doc.querySelector('.client_def_container')
    if ($container) {
      const $defs = Array.from($container.querySelectorAll('.client_def_bar'))
      if ($defs.length > 0) {
        searchResult.result.cdef = $defs.map((el) => ({
          pos: getText(el, '.client_def_title_bar', transform),
          def: getText(el, '.client_def_list', transform),
        }))
      }
    }
  }

  // tense
  if (options.tense) {
    const $infs = Array.from(doc.querySelectorAll('.client_word_change_word'))
    if ($infs.length > 0) {
      searchResult.result.infs = $infs.map((el) => (el.textContent || '').trim())
    }
  }

  if (options.sentence > 0) {
    const $sens = doc.querySelectorAll('.client_sentence_list')
    const sentences: typeof searchResult.result.sentences = []
    for (let i = 0; i < $sens.length && sentences.length < options.sentence; i++) {
      const el = $sens[i]
      let mp3 = ''
      const $audio = el.querySelector('.client_aud_o')
      if ($audio) {
        mp3 = (($audio.getAttribute('onclick') || '').match(/https.*\.mp3/) || [''])[0]
      }
      el.querySelectorAll('.client_sen_en_word').forEach(($word) => {
        $word.outerHTML = getText($word)
      })
      el.querySelectorAll('.client_sen_cn_word').forEach(($word) => {
        $word.outerHTML = getText($word, transform)
      })
      el.querySelectorAll('.client_sentence_search').forEach(($word) => {
        $word.outerHTML = `<span class="dictBing-SentenceItem_HL">${getText($word)}</span>`
      })
      sentences.push({
        en: getInnerHTML(HOST, el, '.client_sen_en'),
        chs: getInnerHTML(HOST, el, {
          selector: '.client_sen_cn',
          transform,
        }),
        source: getText(el, '.client_sentence_list_link'),
        mp3,
      })
    }
    searchResult.result.sentences = sentences
  }

  if (Object.keys(searchResult.result).length > 2) {
    return searchResult
  }
  return handleNoResult()
}

