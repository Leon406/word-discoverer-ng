import { add_lexeme, eval_func, request_unhighlight,unhighlight } from './common_lib'

const isoLangs = {
  ab: 'Abkhaz',
  aa: 'Afar',
  af: 'Afrikaans',
  ak: 'Akan',
  sq: 'Albanian',
  am: 'Amharic',
  ar: 'Arabic',
  an: 'Aragonese',
  hy: 'Armenian',
  as: 'Assamese',
  av: 'Avaric',
  ae: 'Avestan',
  ay: 'Aymara',
  az: 'Azerbaijani',
  bm: 'Bambara',
  ba: 'Bashkir',
  eu: 'Basque',
  be: 'Belarusian',
  bn: 'Bengali',
  bh: 'Bihari',
  bi: 'Bislama',
  bs: 'Bosnian',
  br: 'Breton',
  bg: 'Bulgarian',
  my: 'Burmese',
  ca: 'Catalan',
  ch: 'Chamorro',
  ce: 'Chechen',
  ny: 'Chichewa',
  zh: 'Chinese',
  cv: 'Chuvash',
  kw: 'Cornish',
  co: 'Corsican',
  cr: 'Cree',
  hr: 'Croatian',
  cs: 'Czech',
  da: 'Danish',
  dv: 'Divehi',
  nl: 'Dutch',
  en: 'English',
  eo: 'Esperanto',
  et: 'Estonian',
  ee: 'Ewe',
  fo: 'Faroese',
  fj: 'Fijian',
  fi: 'Finnish',
  fr: 'French',
  ff: 'Fula',
  gl: 'Galician',
  ka: 'Georgian',
  de: 'German',
  el: 'Greek',
  gu: 'Gujarati',
  ht: 'Haitian',
  ha: 'Hausa',
  he: 'Hebrew',
  hz: 'Herero',
  hi: 'Hindi',
  ho: 'Hiri Motu',
  hu: 'Hungarian',
  ia: 'Interlingua',
  id: 'Indonesian',
  ie: 'Interlingue',
  ga: 'Irish',
  ig: 'Igbo',
  ik: 'Inupiaq',
  io: 'Ido',
  is: 'Icelandic',
  it: 'Italian',
  iu: 'Inuktitut',
  ja: 'Japanese',
  jv: 'Javanese',
  kl: 'Kalaallisut',
  kn: 'Kannada',
  kr: 'Kanuri',
  ks: 'Kashmiri',
  kk: 'Kazakh',
  km: 'Khmer',
  ki: 'Kikuyu',
  rw: 'Kinyarwanda',
  ky: 'Kirghiz',
  kv: 'Komi',
  kg: 'Kongo',
  ko: 'Korean',
  ku: 'Kurdish',
  kj: 'Kwanyama',
  la: 'Latin',
  lb: 'Luxembourgish',
  lg: 'Luganda',
  li: 'Limburgish',
  ln: 'Lingala',
  lo: 'Lao',
  lt: 'Lithuanian',
  lu: 'Luba-Katanga',
  lv: 'Latvian',
  gv: 'Manx',
  mk: 'Macedonian',
  mg: 'Malagasy',
  ms: 'Malay',
  ml: 'Malayalam',
  mt: 'Maltese',
  mh: 'Marshallese',
  mn: 'Mongolian',
  na: 'Nauru',
  nv: 'Navajo',
  nd: 'Ndebele',
  ne: 'Nepali',
  ng: 'Ndonga',
  nn: 'Norwegian',
  no: 'Norwegian',
  ii: 'Nuosu',
  nr: 'Ndebele',
  oc: 'Occitan',
  oj: 'Ojibwe',
  om: 'Oromo',
  or: 'Oriya',
  os: 'Ossetian',
  pa: 'Panjabi',
  fa: 'Persian',
  pl: 'Polish',
  ps: 'Pashto',
  pt: 'Portuguese',
  qu: 'Quechua',
  rm: 'Romansh',
  rn: 'Kirundi',
  ro: 'Romanian',
  ru: 'Russian',
  sc: 'Sardinian',
  sd: 'Sindhi',
  se: 'Sami',
  sm: 'Samoan',
  sg: 'Sango',
  sr: 'Serbian',
  gd: 'Gaelic',
  sn: 'Shona',
  si: 'Sinhala',
  sk: 'Slovak',
  sl: 'Slovene',
  so: 'Somali',
  st: 'Sotho',
  es: 'Spanish',
  su: 'Sundanese',
  sw: 'Swahili',
  ss: 'Swati',
  sv: 'Swedish',
  ta: 'Tamil',
  te: 'Telugu',
  tg: 'Tajik',
  th: 'Thai',
  ti: 'Tigrinya',
  bo: 'Tibetan',
  tk: 'Turkmen',
  tl: 'Tagalog',
  tn: 'Tswana',
  to: 'Tonga',
  tr: 'Turkish',
  ts: 'Tsonga',
  tt: 'Tatar',
  tw: 'Twi',
  ty: 'Tahitian',
  ug: 'Uighur',
  uk: 'Ukrainian',
  ur: 'Urdu',
  uz: 'Uzbek',
  ve: 'Venda',
  vi: 'Vietnamese',
  wa: 'Walloon',
  cy: 'Welsh',
  wo: 'Wolof',
  fy: 'Frisian',
  xh: 'Xhosa',
  yi: 'Yiddish',
  yo: 'Yoruba',
  za: 'Zhuang',
}

export function get_dict_definition_url(dictUrl, text) {
  return dictUrl.includes('%wd_text%')
    ? dictUrl.replace('%wd_text%', encodeURIComponent(text))
    : dictUrl + encodeURIComponent(text)
}

function openUrl(url) {
  window.open(url)
}

function copy_vocabulary() {

  let vocabularies = [...new Set(
    [...document.querySelectorAll('wdhl:not(.wdhl_none_none)')]
      .map(ele => ele.getAttribute('lemma'))
  )]
  if (!vocabularies.length) return
  const voca = vocabularies.join('\n');
  const textArea = document.createElement('textarea')
  textArea.value = voca
  textArea.style.position = 'fixed'
  textArea.style.left = '-10000px'
  textArea.style.top = '-10000px'
  document.body.appendChild(textArea)
  textArea.select()
  document.execCommand('copy')
  document.body.removeChild(textArea)
  alert(`${vocabularies.length} Copied`)
}

export function showDefinition(dictUrl, text) {
  const fullUrl = get_dict_definition_url(dictUrl, text)
  if (fullUrl.startsWith('http')) {
    chrome.tabs.create({ url: fullUrl }, function (tab) {
      // opens definition in a new tab
    })
  } else {
    eval_func(openUrl, [fullUrl])
  }
}

export function createDictionaryEntry(dictPairs) {
  for (let i = 0; i < dictPairs.length; ++i) {
    chrome.contextMenus.create({
      title: dictPairs[i].title,
      contexts: ['selection'],
      id: `wd_define_${i}`,
    })
  }
}

export function context_handle_add_result(report, lemma) {
  if (report === 'ok') {
    request_unhighlight(lemma)
  }
}

export function make_default_online_dicts() {
  const result = []

  let uiLang = chrome.i18n.getUILanguage()
  uiLang = uiLang.split('-')[0]
  if (uiLang !== 'en' && isoLangs.hasOwnProperty(uiLang)) {
    const langName = isoLangs[uiLang]
    result.push({
      title: `Translate to ${langName} in Google`,
      url: `https://translate.google.com/#en/${uiLang}/`,
    })
  }
  result.push({
    title: 'Define in Merriam-Webster',
    url: 'https://www.merriam-webster.com/dictionary/',
  })
  result.push({
    title: 'Define in Google',
    url: 'https://encrypted.google.com/search?hl=en&gl=en&q=define:',
  })
  result.push({
    title: 'View pictures in Google',
    url: 'https://encrypted.google.com/search?hl=en&gl=en&tbm=isch&q=',
  })
  return result
}

export function initContextMenus(dictPairs) {
  chrome.contextMenus.removeAll(function () {
    const title = chrome.i18n.getMessage('menuItem')
    chrome.contextMenus.create({
      title,
      contexts: ['selection'],
      id: 'vocab_select_add',
    })
     chrome.contextMenus.create({
      title:  "Open In Local",
      contexts: ['selection'],
      id: 'vocab_open_in_local',
    })
    chrome.contextMenus.create({
      title: 'Copy All Vocabularies',
      id: 'vocab_copy',
    })

    chrome.contextMenus.create({
      id: 'save_all_vocabulary',
      title: 'Save All Vocabularies',
      contexts: ['all'],
    });

    chrome.contextMenus.onClicked.addListener(async function (info, tab) {
      console.log('ContextMenus', info)
      let word = info.selectionText
      if (info.menuItemId === 'vocab_open_in_local') {
        try {
          // 在当前标签页里执行一段脚本，把选区文本带换行地拿回来
          const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: getSelectionTextWithBreaks
          });
          word = result;
        } catch (e) {
          console.error(e);
        }
      }
      if (info.menuItemId === 'vocab_select_add') {
        add_lexeme(word, context_handle_add_result)
      } else if (info.menuItemId === 'vocab_copy') {
        eval_func(copy_vocabulary)
      } else if (info.menuItemId === 'save_all_vocabulary') {
        eval_func(saveAllVocabulary);
      } else if (info.menuItemId === 'vocab_open_in_local') {
        const internalPageUrl = chrome.runtime.getURL('local.html');
        const urlWithParams = `${internalPageUrl}?s=${encodeURIComponent(word)}`;
        // 创建一个新的标签页来打开我们的内部页面
        chrome.tabs.create({
          url: urlWithParams
        });
      } else if (info.menuItemId.startsWith('wd_define_')) {
        let i = info.menuItemId.substring(info.menuItemId.lastIndexOf('_') + 1)
        showDefinition(dictPairs[parseInt(i)].url, word)
      }
    })
    chrome.contextMenus.create({
      type: 'separator',
      contexts: ['selection'],
      id: 'wd_separator_id',
    })
    createDictionaryEntry(dictPairs)
  })
}

// 这段代码会在页面上下文中运行
function getSelectionTextWithBreaks() {
  const selection = window.getSelection();
  if (!selection.rangeCount) return '';

  // 用 <br> 占位换行，再转成纯文本
  const div = document.createElement('div');
  for (let i = 0; i < selection.rangeCount; i++) {
    div.appendChild(selection.getRangeAt(i).cloneContents());
  }

  // 把 <br> 换成 \n\n，再剔除多余空白
  return div.innerHTML
    .replace(/<br\s*\/?>/gi, '\n\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')   // 去掉其余标签
    .replace(/\n{2,}/g, '\n\n')  // 合并多余空行
    .trim();
}

function saveAllVocabulary() {
  const highlightedNodes = document.querySelectorAll('wdhl[lemma]');
  const lemmasToSave = new Set();
  highlightedNodes.forEach((node) => {
    const lemma = node.getAttribute('lemma');
    if (lemma) {
      lemmasToSave.add(lemma);
      // 隐藏已高亮的词汇
      node.setAttribute(
        'style',
        'font-weight:inherit;color:inherit;background-color:inherit;',
      )
      node.setAttribute('class', 'wdhl_none_none')
    }
  });

  chrome.storage.local.get(['wd_user_vocabulary'], function (result) {
    const userVocabulary = result.wd_user_vocabulary || {};
    lemmasToSave.forEach((lemma) => {
      if (!userVocabulary.hasOwnProperty(lemma)) {
        userVocabulary[lemma] = 1;
      }
    });

    chrome.storage.local.set({ wd_user_vocabulary: userVocabulary }, function () {
      console.log(`Saved ${lemmasToSave.size} unique lemmas to vocabulary.`);
    });
  });
}
