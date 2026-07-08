/**
 * ДСТУ 9112:2021 System B (ASCII) — the national technical standard for
 * Cyrillic↔Latin transliteration (in force since 2022-04-01; it complements,
 * not replaces, КМУ №55/2010). Context-free per-letter table, so `Київ → Kyjiv`.
 *
 * SLUG-GRADE implementation: the standard's retransliteration disambiguation
 * marks (apostrophes around ambiguous J sequences) are intentionally omitted —
 * slugs strip apostrophes anyway, and this library never promises round-trips.
 * For faithful reversible ДСТУ 9112 (systems A and B), use `uklatn`.
 */

const table: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'gh',
  ґ: 'g',
  д: 'd',
  е: 'e',
  є: 'je',
  ж: 'zh',
  з: 'z',
  и: 'y',
  і: 'i',
  ї: 'ji',
  й: 'j',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'c',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ь: 'j',
  ю: 'ju',
  я: 'ja',
  ʼ: "'",
  '’': "'",
  "'": "'",
}

/**
 * Match the source casing. A multi-char token from an UPPERCASE source is
 * Title-case when the next source char is a lowercase letter, else ALL-CAPS
 * (`ШАПКА → SHAPKA`) — mirrors ICU/uklatn behavior.
 */
const COMBINING = /[\u0300-\u036f]/

const cased = (token: string, source: string, next: string): string => {
  if (!token || source === source.toLowerCase()) return token
  const titleContext = next !== '' && next !== next.toUpperCase()
  return titleContext
    ? (token[0]?.toUpperCase() ?? '') + token.slice(1)
    : token.toUpperCase()
}

/** The casing context is the next BASE char — combining marks are transparent. */
const nextBase = (input: string, from: number): string => {
  for (let i = from; i < input.length; i++) {
    const ch = input[i] as string
    if (!COMBINING.test(ch)) return ch
  }
  return ''
}

/**
 * Transliterate Ukrainian Cyrillic per ДСТУ 9112:2021 System B (slug-grade).
 * Non-Ukrainian characters pass through untouched.
 */
export const transliterateUkDstu9112 = (raw: string): string => {
  // NFC both ways (like uklatn): composes и+◌̆ → й on input; recomposes any
  // combining marks that ride through (stressed vowels) on output.
  const input = raw.normalize('NFC')
  let out = ''
  for (let i = 0; i < input.length; i++) {
    const ch = input[i] as string
    const mapped = table[ch.toLowerCase()]
    out += mapped !== undefined ? cased(mapped, ch, nextBase(input, i + 1)) : ch
  }
  return out.normalize('NFC')
}
