/**
 * Official Ukrainian romanization — Cabinet of Ministers of Ukraine
 * Resolution No. 55 (27.01.2010), still in force: passports, geographic
 * names, official documents. https://zakon.rada.gov.ua/go/55-2010-п
 *
 * Positional rules from the resolution:
 * - Є, Ї, Й, Ю, Я romanize as Ye, Yi, Y, Yu, Ya at the START of a word,
 *   and as ie, i, i, iu, ia elsewhere.
 * - The letter combination «зг» romanizes as `zgh` (Згорани → Zghorany),
 *   never `zh` (which would collide with ж).
 * - The soft sign (ь) and the apostrophe are omitted.
 */

const base: Record<string, string> = {
	а: 'a',
	б: 'b',
	в: 'v',
	г: 'h',
	ґ: 'g',
	д: 'd',
	е: 'e',
	ж: 'zh',
	з: 'z',
	и: 'y',
	і: 'i',
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
	ц: 'ts',
	ч: 'ch',
	ш: 'sh',
	щ: 'shch',
	ь: '',
}

const APOSTROPHES = new Set(["'", '’', 'ʼ'])

const wordInitial: Record<string, string> = {
	є: 'ye',
	ї: 'yi',
	й: 'y',
	ю: 'yu',
	я: 'ya',
}

const midWord: Record<string, string> = {
	є: 'ie',
	ї: 'i',
	й: 'i',
	ю: 'iu',
	я: 'ia',
}

const isUkLetter = (ch: string): boolean =>
	ch in base || ch in midWord || ch === 'з' || /[а-щьюяєіїґ]/i.test(ch)

/**
 * Match the source casing. A multi-char token from an UPPERCASE source is
 * Title-case when the next source char is a lowercase letter (`Ша → Sha`),
 * else ALL-CAPS (`ШАПКА → SHAPKA`, `зГ → zGH`) — mirrors ICU/uklatn behavior.
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
 * Transliterate Ukrainian Cyrillic per КМУ №55/2010. Non-Ukrainian characters
 * pass through untouched (compose with a general folder for mixed input).
 */
export const transliterateUkKmu2010 = (raw: string): string => {
	// NFC both ways (like uklatn): composes и+◌̆ → й on input; recomposes any
	// combining marks that ride through (stressed vowels) on output.
	const input = raw.normalize('NFC')
	let out = ''
	let atWordStart = true
	for (let i = 0; i < input.length; i++) {
		const ch = input[i] as string
		const lower = ch.toLowerCase()

		// «зг» → zgh (any casing), so Згорани → Zghorany, РОЗГОН → ROZGHON.
		if (lower === 'з' && (input[i + 1]?.toLowerCase() ?? '') === 'г') {
			const g = input[i + 1] as string
			out += cased('z', ch, g) + cased('gh', g, nextBase(input, i + 2))
			i++
			atWordStart = false
			continue
		}

		// The apostrophe is omitted only INSIDE a Ukrainian word (ім’я → imia);
		// standalone quotes are punctuation and pass through.
		if (APOSTROPHES.has(ch)) {
			const prev = input[i - 1] ?? ''
			const next = nextBase(input, i + 1)
			if (prev && isUkLetter(prev.toLowerCase()) && next && isUkLetter(next.toLowerCase())) {
				continue
			}
			out += ch
			atWordStart = true
			continue
		}

		const positional = atWordStart ? wordInitial[lower] : midWord[lower]
		const mapped = positional ?? base[lower]
		if (mapped !== undefined) {
			out += cased(mapped, ch, nextBase(input, i + 1))
			atWordStart = false
			continue
		}

		out += ch
		// Any non-Ukrainian-letter character (space, punctuation, digit, Latin)
		// starts a new word for the positional rules.
		atWordStart = !isUkLetter(lower)
	}
	return out.normalize('NFC')
}
