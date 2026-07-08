[![Monthly Downloads](https://img.shields.io/npm/dm/seo-slug.svg)](https://www.npmjs.com/package/seo-slug)
[![NPM](https://img.shields.io/npm/v/seo-slug.svg 'NPM package version')](https://www.npmjs.com/package/seo-slug)
[![CI](https://github.com/annexare/seo-slug/actions/workflows/ci.yml/badge.svg)](https://github.com/annexare/seo-slug/actions/workflows/ci.yml)

# seo-slug

SEO-friendly slugs with **official Ukrainian transliteration**. Tiny, zero-dependency, TypeScript, ESM.

```ts
import { slug, transliterateUk } from 'seo-slug'

slug('Запоріжжя — це Україна!')  // 'zaporizhzhia-tse-ukraina'
slug('Œuvre für São Paulo')      // 'oeuvre-fur-sao-paulo'
transliterateUk('Київ')          // 'Kyiv'
```

## Why another slugger?

Generic sluggers transliterate Ukrainian with Russian-ish or ISO-9 tables (`и→i`, `Київ→Kiyv/Kijev`). Ukraine has an **official romanization** — Cabinet of Ministers [Resolution No. 55 (2010)](https://zakon.rada.gov.ua/go/55-2010-п) — with positional rules generic tables can't express: `Київ→Kyiv`, `Згорани→Zghorany`, word-initial `Я→Ya` vs mid-word `я→ia`. It's what passports, road signs, and the world's press use. This library makes it the default.

## Ukrainian schemes

- **`kmu-2010`** (default) — КМУ №55/2010: passports, geographic names, official documents. Positional rules (word-initial Є/Ї/Й/Ю/Я, `зг→zgh`), soft sign and in-word apostrophe omitted. Still in force, unchanged.
- **`dstu-9112`** — [ДСТУ 9112:2021](https://uk.wikipedia.org/wiki/ДСТУ_9112:2021) System B (ASCII), the national technical standard (in force since 2022; complements, does not replace, КМУ №55): `Київ→Kyjiv`, `ь→j`, `г→gh`. **Slug-grade**: the standard's retransliteration disambiguation marks are omitted (slugs strip apostrophes anyway). For faithful, reversible ДСТУ 9112 — both systems, 11 languages — use [`uklatn`](https://github.com/paiv/uklatn).

```ts
slug('Хмельницький')                       // 'khmelnytskyi'
slug('Хмельницький', { scheme: 'dstu-9112' }) // 'khmeljnycjkyj'
```

## API

### `slug(input, options?)`

Ukrainian romanization → Latin diacritics folding (NFKD + `æ/ø/ß/đ/ł/þ/œ/…`) → ASCII word runs joined by the separator.

| Option      | Default      | |
|-------------|--------------|---|
| `scheme`    | `'kmu-2010'` | Ukrainian romanization scheme |
| `separator` | `'-'`        | word separator |
| `lowercase` | `true`       | lowercase the result |
| `maxLength` | ∞            | cut at the last full word within the limit |

### `transliterateUk(input, scheme?)`

Ukrainian Cyrillic → Latin, casing-aware (`ШАПКА→SHAPKA`, `Шапка→Shapka`). Non-Ukrainian characters pass through.

### `fold(input)`

Latin diacritics → ASCII.

## Correctness

Tested against every canonical example in the resolution's own annex (Алушта→Alushta … Феодосія→Feodosiia) and cross-checked against [`uklatn`](https://github.com/paiv/uklatn)'s generated fixtures, including casing torture tests (`зГ→zGH`, `зГин→zGhyn`) and stressed-vowel combining marks.

## License

MIT © [Annexare Studio](https://annexare.com). Successor in spirit to [toURI](https://github.com/annexare/toURI).
