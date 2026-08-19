// Builds public/icon-checker-data.json for the manual vignette-matching tool.
// Re-run after editing story_icon_map.json / data.json to refresh the tool.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const data = JSON.parse(readFileSync(join(root, 'src/data.json'), 'utf8'))

const MOODS = [
  { key: 'Страшные', short: 'Страшные' },
  { key: 'Захватывающие приключения', short: 'Приключения' },
  { key: 'Весёлые', short: 'Весёлые' },
  { key: 'Грустные', short: 'Грустные' },
  { key: 'Счастливые/Оптимистичные', short: 'Светлые' },
]

const images = readdirSync(join(root, 'public/storyicons'))
  .filter((f) => f.endsWith('.webp'))
  .map((f) => f.replace('.webp', ''))
  .sort()

const stories = []
const usedBy = {}
for (const c of data.cards) {
  for (const m of MOODS) {
    for (const s of c.stories[m.key] || []) {
      stories.push({
        id: s.id,
        cardSlug: c.slug,
        cardName: c.name,
        cardEn: c.en,
        roman: c.roman,
        mood: m.key,
        moodShort: m.short,
        titleRu: s.tellings?.[0] || '',
        titleEn: s.tellingsEn?.[0] || '',
        icon: s.icon || null,
      })
      if (s.icon) (usedBy[s.icon] ||= []).push(s.id)
    }
  }
}

const out = { generatedFrom: 'src/data.json', total: stories.length, images, usedBy, stories }
writeFileSync(join(root, 'public/icon-checker-data.json'), JSON.stringify(out))
const unmapped = stories.filter((s) => !s.icon).length
console.log(`checker data: ${stories.length} stories (${unmapped} unmapped), ${images.length} vignettes`)
