import * as DOMPurify from 'dompurify'

export interface DictSearchResult<Result> {
  /** search result */
  result: Result
  /** auto play sound */
  audio?: {
    uk?: string
    us?: string
    py?: string
  }
  /** generate menus on dict titlebars */
  catalog?: Array<
    | {
        // <button>
        key: string
        value: string
        label: string
        options?: undefined
      }
    | {
        // <select>
        key: string
        value: string
        options: Array<{
          value: string
          label: string
        }>
        title?: string
      }
  >
}

/** Return a dictionary source page url for the dictionary header */

export function handleNoResult<T = any>(): Promise<T> {
  return Promise.reject(new Error('NO_RESULT'))
}

export function handleNetWorkError(): Promise<never> {
  return Promise.reject(new Error('NETWORK_ERROR'))
}

/**
 * Get the textContent of a node or its child.
 */
export function getText(
  parent: ParentNode | null,
  selector?: string,
  transform?: null | ((text: string) => string),
): string
export function getText(
  parent: ParentNode | null,
  transform?: null | ((text: string) => string),
  selector?: string,
): string
export function getText(
  parent: ParentNode | null,
  ...args:
    | [string?, (null | ((text: string) => string))?]
    | [(null | ((text: string) => string))?, string?]
): string {
  if (!parent) {
    return ''
  }

  let selector = ''
  let transform: null | ((text: string) => string) = null
  for (let i = args.length - 1; i >= 0; i--) {
    if (typeof args[i] === 'string') {
      selector = args[i] as string
    } else if (typeof args[i] === 'function') {
      transform = args[i] as (text: string) => string
    }
  }

  const child = selector
    ? parent.querySelector(selector)
    : (parent as HTMLElement)
  if (!child) {
    return ''
  }

  const textContent = child.textContent || ''
  return transform ? transform(textContent) : textContent
}

export interface GetHTMLConfig {
  /** innerHTML or outerHTML */
  mode?: 'innerHTML' | 'outerHTML'
  /** Select child node */
  selector?: string
  /** transform text */
  transform?: null | ((text: string) => string)
  /** Give url and src a host */
  host?: string
  /** DOM Purify config */
  config?: DOMPurify.Config
}

const defaultDOMPurifyConfig: DOMPurify.Config = {
  FORBID_TAGS: ['style'],
  FORBID_ATTR: ['style'],
}

export function getHTML(
  parent: ParentNode,
  {
    mode = 'innerHTML',
    selector,
    transform,
    host,
    config = defaultDOMPurifyConfig,
  }: GetHTMLConfig = {},
): string {
  const node = selector
    ? parent.querySelector<HTMLElement>(selector)
    : (parent as HTMLElement)
  if (!node) {
    return ''
  }

  if (host) {
    const fillLink = (el: HTMLElement) => {
      if (el.getAttribute('href')) {
        el.setAttribute('href', getFullLink(host!, el, 'href'))
      }
      if (el.getAttribute('src')) {
        el.setAttribute('src', getFullLink(host!, el, 'src'))
      }
      if (isInternalPage() && el.getAttribute('srcset')) {
        el.setAttribute(
          'srcset',
          el
            .getAttribute('srcset')!
            .replace(/(,| |^)\/\//g, (_, head) => head + 'https://'),
        )
      }
    }

    if (isTagName(node, 'a') || isTagName(node, 'img')) {
      fillLink(node)
    }
    node.querySelectorAll('a').forEach(fillLink)
    node.querySelectorAll('img').forEach(fillLink)
  }

  const fragment = DOMPurify.sanitize(node, {
    ...config,
    RETURN_DOM_FRAGMENT: true,
  })

  const content = fragment.firstChild
    ? (fragment.firstChild as HTMLElement)[mode]
    : ''

  return transform ? transform(content) : content
}

export function getInnerHTML(
  host: string,
  parent: ParentNode,
  selectorOrConfig: string | Omit<GetHTMLConfig, 'mode' | 'host'> = {},
) {
  return getHTML(
    parent,
    typeof selectorOrConfig === 'string'
      ? { selector: selectorOrConfig, host, mode: 'innerHTML' }
      : { ...selectorOrConfig, host, mode: 'innerHTML' },
  )
}

export function getOuterHTML(
  host: string,
  parent: ParentNode,
  selectorOrConfig: string | Omit<GetHTMLConfig, 'mode' | 'host'> = {},
) {
  return getHTML(
    parent,
    typeof selectorOrConfig === 'string'
      ? { selector: selectorOrConfig, host, mode: 'outerHTML' }
      : { ...selectorOrConfig, host, mode: 'outerHTML' },
  )
}

/**
 * Remove a child node from a parent node
 */
export function removeChild(parent: ParentNode, selector: string) {
  const child = parent.querySelector(selector)
  if (child) {
    child.remove()
  }
}

export function getFullLink(host: string, el: Element, attr: string): string {
  if (host.endsWith('/')) {
    host = host.slice(0, -1)
  }

  const protocol = host.startsWith('https') ? 'https:' : 'http:'

  const link = el.getAttribute(attr)
  if (!link) {
    return ''
  }

  if (/^[a-zA-Z0-9]+:/.test(link)) {
    return link
  }

  if (link.startsWith('//')) {
    return protocol + link
  }

  if (/^.?\/+/.test(link)) {
    return host + '/' + link.replace(/^.?\/+/, '')
  }

  return host + '/' + link
}

/**
 * xhtml returns small case
 */
export function isTagName(node: Node, tagName: string): boolean {
  return (
    ((node as HTMLElement).tagName || '').toLowerCase() ===
    tagName.toLowerCase()
  )
}

export const isInternalPage = () => false
