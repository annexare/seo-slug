import { transliterateUkDstu9112 } from './uk-dstu-9112'
import { transliterateUkKmu2010 } from './uk-kmu-2010'

export { transliterateUkDstu9112 } from './uk-dstu-9112'
export { transliterateUkKmu2010 } from './uk-kmu-2010'

/**
 * Ukrainian romanization scheme:
 * - `kmu-2010` (default) — КМУ №55/2010, the official system for passports,
 *   geographic names and documents; what the world reads (`Київ → Kyiv`).
 * - `dstu-9112` — ДСТУ 9112:2021 System B (ASCII), the national technical
 *   standard (`Київ → Kyjiv`). Slug-grade, non-reversible (see module docs).
 */
export type UkScheme = 'kmu-2010' | 'dstu-9112'

export interface SlugOptions {
  /** Ukrainian romanization scheme. Default `kmu-2010`. */
  scheme?: UkScheme
  /** Word separator. Default `-`. */
  separator?: string
  /** Lowercase the result. Default `true`. */
  lowercase?: boolean
  /** Maximum length — cut at the last full word within it. Default unlimited. */
  maxLength?: number
  /** What `&` becomes — a real word, not silence (`AC & DC → ac-and-dc`).
   *  Default `'and'`; pass `''` to drop it. */
  ampersand?: string
}

/** Latin-extended characters NFKD can't fold (no combining-mark decomposition). */
const FOLD: Record<string, string> = {
  æ: 'ae',
  ø: 'o',
  ß: 'ss',
  đ: 'd',
  ð: 'd',
  þ: 'th',
  ł: 'l',
  œ: 'oe',
  ħ: 'h',
  ı: 'i',
  ĸ: 'k',
  ŋ: 'ng',
  ŧ: 't',
}

/** Transliterate Ukrainian Cyrillic to Latin. Non-Ukrainian input passes through. */
export const transliterateUk = (
  input: string,
  scheme: UkScheme = 'kmu-2010',
): string =>
  scheme === 'dstu-9112'
    ? transliterateUkDstu9112(input)
    : transliterateUkKmu2010(input)

const COMBINING_MARKS = /[\u0300-\u036f]/g
const FOLDABLE = new RegExp(`[${Object.keys(FOLD).join('')}]`, 'gi')

/** Fold Latin-script diacritics to ASCII: NFKD strip + the non-decomposable set. */
export const fold = (input: string): string =>
  input
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .replace(FOLDABLE, (ch) => {
      const lower = ch.toLowerCase()
      const mapped = FOLD[lower]
      if (mapped === undefined) return ch
      return ch === lower
        ? mapped
        : (mapped[0]?.toUpperCase() ?? '') + mapped.slice(1)
    })

/**
 * SEO-friendly slug: official Ukrainian romanization (КМУ №55/2010 by default)
 * → diacritics folding → ASCII word runs joined by the separator.
 *
 * ```ts
 * slug('Запоріжжя — це Україна!') // 'zaporizhzhia-tse-ukraina'
 * slug('Œuvre für São Paulo')     // 'oeuvre-fur-sao-paulo'
 * ```
 */
/** In-word apostrophes glue their word (`Gojira's → gojiras`) — the common
 *  slugger behavior (github-slugger, slugify) and the KMU treatment of the
 *  Ukrainian apostrophe extended to Latin text. */
const IN_WORD_APOSTROPHE = /([a-zA-Z0-9])['’ʼ]+(?=[a-zA-Z])/g

export const slug = (input: string, options: SlugOptions = {}): string => {
  const {
    scheme = 'kmu-2010',
    separator = '-',
    lowercase = true,
    maxLength,
    ampersand = 'and',
  } = options
  let text = fold(transliterateUk(input, scheme))
    .replace(IN_WORD_APOSTROPHE, '$1')
    .replace(/&/g, ampersand ? ` ${ampersand} ` : ' ')
  if (lowercase) text = text.toLowerCase()
  const words = text.match(/[a-zA-Z0-9]+/g) ?? []
  let out = words.join(separator)
  if (maxLength !== undefined && out.length > maxLength) {
    const cut = out.slice(0, maxLength + separator.length)
    const lastSep = cut.lastIndexOf(separator)
    out = lastSep > 0 ? cut.slice(0, lastSep) : out.slice(0, maxLength)
  }
  return out
}
