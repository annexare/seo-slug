import { describe, expect, test } from 'bun:test'
import { fold, slug, transliterateUk } from '../src/index'
import fixtures from './uklatn-fixtures.json'

// Canonical examples straight from the resolution's own annex —
// https://zakon.rada.gov.ua/go/55-2010-п
const KMU_OFFICIAL: [string, string][] = [
  ['Алушта', 'Alushta'],
  ['Андрій', 'Andrii'],
  ['Борщагівка', 'Borshchahivka'],
  ['Вінниця', 'Vinnytsia'],
  ['Гадяч', 'Hadiach'],
  ['Згурський', 'Zghurskyi'],
  ['Ґалаґан', 'Galagan'],
  ['Донецьк', 'Donetsk'],
  ['Рівне', 'Rivne'],
  ['Олег', 'Oleh'],
  ['Есмань', 'Esman'],
  ['Єнакієве', 'Yenakiieve'],
  ['Гаєвич', 'Haievych'],
  ["Короп'є", 'Koropie'],
  ['Житомир', 'Zhytomyr'],
  ['Закарпаття', 'Zakarpattia'],
  ['Медвин', 'Medvyn'],
  ['Михайленко', 'Mykhailenko'],
  ['Іванків', 'Ivankiv'],
  ['Їжакевич', 'Yizhakevych'],
  ['Кадиївка', 'Kadyivka'],
  ["Мар'їне", 'Marine'],
  ['Йосипівка', 'Yosypivka'],
  ['Стрий', 'Stryi'],
  ['Олексій', 'Oleksii'],
  ['Кий', 'Kyi'],
  ['Київ', 'Kyiv'],
  ['Миколаїв', 'Mykolaiv'],
  ['Ніжин', 'Nizhyn'],
  ['Наталія', 'Nataliia'],
  ['Одеса', 'Odesa'],
  ['Полтава', 'Poltava'],
  ['Решетилівка', 'Reshetylivka'],
  ['Рибчинський', 'Rybchynskyi'],
  ['Суми', 'Sumy'],
  ['Соломія', 'Solomiia'],
  ['Тернопіль', 'Ternopil'],
  ['Троць', 'Trots'],
  ['Ужгород', 'Uzhhorod'],
  ['Уляна', 'Uliana'],
  ['Фастів', 'Fastiv'],
  ['Харків', 'Kharkiv'],
  ['Христина', 'Khrystyna'],
  ['Біла Церква', 'Bila Tserkva'],
  ['Чернівці', 'Chernivtsi'],
  ['Шевченко', 'Shevchenko'],
  ['Щербухи', 'Shcherbukhy'],
  ['Гоща', 'Hoshcha'],
  ['Юрій', 'Yurii'],
  ['Корюківка', 'Koriukivka'],
  ['Яготин', 'Yahotyn'],
  ['Ярошенко', 'Yaroshenko'],
  ['Костянтин', 'Kostiantyn'],
  ["Знам'янка", 'Znamianka'],
  ['Феодосія', 'Feodosiia'],
]

describe('transliterateUk — КМУ №55/2010 (default)', () => {
  test('every canonical example from the resolution annex', () => {
    for (const [cyr, lat] of KMU_OFFICIAL) {
      expect(transliterateUk(cyr)).toBe(lat)
    }
  })

  test('uklatn cross-check fixtures', () => {
    for (const { cyr, lat } of fixtures.kmu) {
      expect(transliterateUk(cyr)).toBe(lat)
    }
  })
})

describe('transliterateUk — ДСТУ 9112:2021 System B (slug-grade)', () => {
  test('the standard headline cases', () => {
    expect(transliterateUk('Київ', 'dstu-9112')).toBe('Kyjiv')
    expect(transliterateUk('Україна, Хмельницький', 'dstu-9112')).toBe(
      'Ukrajina, Khmeljnycjkyj',
    )
    expect(transliterateUk('Згорани', 'dstu-9112')).toBe('Zghorany')
  })

  test('pangram (uklatn fixture)', () => {
    expect(
      transliterateUk(
        'Щастям б’єш жук їх глицю в фон й ґедзь пріч.',
        'dstu-9112',
      ),
    ).toBe("Shchastjam b'jesh zhuk jikh ghlycju v fon j gedzj prich.")
  })
})

describe('fold — Latin diacritics to ASCII', () => {
  test('NFKD strip + the non-decomposable set', () => {
    expect(fold('Œuvre für São Paulo')).toBe('Oeuvre fur Sao Paulo')
    expect(fold('Łódź, Ærø, straße, þing')).toBe('Lodz, Aero, strasse, thing')
  })
})

describe('slug', () => {
  test('Ukrainian titles the way the world reads them (kmu-2010 default)', () => {
    expect(slug('Запоріжжя — це Україна!')).toBe('zaporizhzhia-tse-ukraina')
    expect(slug('Нові альбоми: осінь 2026')).toBe('novi-albomy-osin-2026')
    expect(slug("Знам'янка")).toBe('znamianka')
  })

  test('the same title under dstu-9112', () => {
    expect(slug('Запоріжжя — це Україна!', { scheme: 'dstu-9112' })).toBe(
      'zaporizhzhja-ce-ukrajina',
    )
  })

  test('mixed-language and messy input', () => {
    expect(slug('  Björk & Гурт «Океан Ельзи»: LIVE!! ')).toBe(
      'bjork-and-hurt-okean-elzy-live',
    )
    expect(slug('C++ / C# --- 100%')).toBe('c-c-100')
    expect(slug('')).toBe('')
    expect(slug('---')).toBe('')
  })

  test('options: separator, lowercase, maxLength cuts at a word boundary', () => {
    expect(slug('Багато слів у назві', { separator: '_' })).toBe(
      'bahato_sliv_u_nazvi',
    )
    expect(slug('Kyiv Live', { lowercase: false })).toBe('Kyiv-Live')
    expect(slug('дуже довгий заголовок статті', { maxLength: 12 })).toBe(
      'duzhe-dovhyi',
    )
  })
})
