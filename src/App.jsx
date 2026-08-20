import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import data from './data.json'
import { Eye } from './Eye.jsx'
import { tr, moodShort, moodFull, MOOD_HINTS, cardName, cardAlt, cardMeaning } from './i18n.js'

// base path so /icons and /chars resolve under a GitHub Pages sub-path too
const BASE = import.meta.env.BASE_URL

// mood keys are Russian because they double as the join key against story data;
// their display labels are localized via moodShort/moodFull
const MOODS = [
  { key: 'Страшные', cls: 'm-scary' },
  { key: 'Захватывающие приключения', cls: 'm-adv' },
  { key: 'Весёлые', cls: 'm-fun' },
  { key: 'Грустные', cls: 'm-sad' },
  { key: 'Счастливые/Оптимистичные', cls: 'm-hope' },
]
const moodCls = (k) => MOODS.find((m) => m.key === k)?.cls || 'm-fun'

const RX = 42
const RY = 46
// как в игре: карты жмутся к бокам двумя дугами по ~90°, с широкими разрывами
// сверху (меню-бар) и снизу (EXIT). правая дуга сверху→вниз, левая снизу→вверх —
// так индексы идут непрерывным кольцом для навигации стрелками
const NODE_ANGLES = (() => {
  const step = 90 / 7
  const right = Array.from({ length: 8 }, (_, i) => 45 - i * step)
  const left = Array.from({ length: 8 }, (_, i) => 225 - i * step)
  return [...right, ...left]
})()
const nodePos = (deg) => {
  const a = (deg * Math.PI) / 180
  return { x: 50 + RX * Math.cos(a), y: 50 - RY * Math.sin(a) }
}
const norm = (s) => s.toLowerCase().replace(/ё/g, 'е')

// flat catalogue of every story with its card + mood, for the browse view & search
const ALL = data.cards.flatMap((c) =>
  MOODS.flatMap((m) =>
    (c.stories[m.key] || []).map((s) => ({ ...s, card: c, mood: m.key })),
  ),
)
const TOTAL = ALL.length

const CHARACTERS = data.characters // 16 люди + Волк
const CARD_BY_SLUG = Object.fromEntries(data.cards.map((c) => [c.slug, c]))
// exact card order around the wheel as in the game, read off the in-game screen.
// node indices from NODE_ANGLES: 0-7 = right arc top→bottom, 8-15 = left arc bottom→top
const WHEEL_ORDER = [
  'three-of-staves', 'justice', 'fool', 'devil', 'world', 'star', 'wheel', 'tower',
  'nine-of-swords', 'two-of-coins', 'empress', 'lovers', 'queen-of-cups', 'high-priestess', 'sun', 'emperor',
]
const WHEEL_CARDS = WHEEL_ORDER.map((s) => CARD_BY_SLUG[s])
// story title in the chosen language — falls back to RU per grade when the game
// has no English/title for that level
const titleAt = (s, lang, i = 0) => (lang === 'en' && s.tellingsEn?.[i]) || s.tellings[i]
const titlesFor = (s, lang) => s.tellings.map((t, i) => (lang === 'en' && s.tellingsEn?.[i]) || t)
const GKEY = 'gv-grades-v1'
const TKEY = 'gv-told-v1'
const VKEY = 'gv-variant-v1'
const DKEY = 'gv-deck-v1'
const DECK_MAX = 3 // in-game: at most 3 active stories per tarot card
const loadLS = (k) => {
  try {
    return JSON.parse(localStorage.getItem(k)) || {}
  } catch {
    return {}
  }
}

export default function App() {
  const [view, setView] = useState('wheel') // 'wheel' | 'all' | 'camp'
  const [aim, setAim] = useState(7)
  const [active, setActive] = useState(7)
  const [reading, setReading] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [mood, setMood] = useState('Весёлые')
  const [allMoods, setAllMoods] = useState(true)
  const [query, setQuery] = useState('')
  const [owned, setOwned] = useState('all') // all | have | missing | partial | untold
  const [sort, setSort] = useState('card') // card | grade | told | az
  const [modal, setModal] = useState(null) // {story, card, mood}
  const [overlay, setOverlay] = useState(null) // 'hint' | 'stats' | 'guide' | null
  const [theme, setTheme] = useState(() =>
    localStorage.getItem('gv-theme-manual') === '1' && localStorage.getItem('gv-theme')
      ? localStorage.getItem('gv-theme')
      : window.matchMedia?.('(prefers-color-scheme: dark)').matches
        ? 'night'
        : 'day',
  )
  // manual toggle pins the theme; otherwise it tracks the OS live
  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === 'day' ? 'night' : 'day'
      localStorage.setItem('gv-theme', next)
      localStorage.setItem('gv-theme-manual', '1')
      return next
    })
  }, [])
  const [grades, setGrades] = useState(() => loadLS(GKEY))
  const [told, setTold] = useState(() => loadLS(TKEY))
  const [variant, setVariant] = useState(() => loadLS(VKEY))
  const [deck, setDeck] = useState(() => loadLS(DKEY)) // {cardSlug: [storyId, ...] max 3}
  const [lang, setLang] = useState(() => localStorage.getItem('gv-lang') || 'ru')
  const [gs, setGs] = useState(null) // lazy-loaded gamestories.json
  const [gModal, setGModal] = useState(null) // opened game story
  const [charModal, setCharModal] = useState(null) // opened character life-story (slug)
  const stageRef = useRef(null)
  const fileRef = useRef(null)
  const L = tr(lang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  useEffect(() => {
    const bg = theme === 'night' ? '#18130d' : '#e7ddc6'
    document.getElementById('theme-color')?.setAttribute('content', bg)
    document.documentElement.style.backgroundColor = bg
    document.body.style.backgroundColor = bg
  }, [theme])
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!mq) return
    const onChange = (e) => {
      if (localStorage.getItem('gv-theme-manual') !== '1') setTheme(e.matches ? 'night' : 'day')
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  useEffect(() => localStorage.setItem('gv-lang', lang), [lang])
  useEffect(() => {
    if ((view === 'all' || view === 'camp' || modal) && !gs) {
      fetch(`${BASE}gamestories.json`)
        .then((r) => r.json())
        .then(setGs)
        .catch(() => setGs({ error: true, stories: [], meta: {} }))
    }
  }, [view, modal, gs])
  useEffect(() => {
    if (!localStorage.getItem('gv-seen-guide')) {
      setOverlay('guide')
      localStorage.setItem('gv-seen-guide', '1')
    }
  }, [])
  useEffect(() => {
    const k = (e) => {
      if (e.key === 'Escape') {
        setModal(null)
        setOverlay(null)
      }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])

  useEffect(() => {
    localStorage.setItem(GKEY, JSON.stringify(grades))
  }, [grades])
  useEffect(() => {
    localStorage.setItem(TKEY, JSON.stringify(told))
  }, [told])
  useEffect(() => {
    localStorage.setItem(VKEY, JSON.stringify(variant))
  }, [variant])
  useEffect(() => {
    localStorage.setItem(DKEY, JSON.stringify(deck))
  }, [deck])

  // deck holds up to 3 stories per card; toggling caps at DECK_MAX
  const toggleDeck = useCallback((cardSlug, id) => {
    setDeck((prev) => {
      const cur = prev[cardSlug] || []
      let next
      if (cur.includes(id)) next = cur.filter((x) => x !== id)
      else if (cur.length >= DECK_MAX) return prev
      else next = [...cur, id]
      const o = { ...prev }
      if (next.length) o[cardSlug] = next
      else delete o[cardSlug]
      return o
    })
  }, [])

  // a variant story lives under its game default card until the player marks which
  // card the mini-game choice actually gave them; then it moves to that card everywhere.
  const setStoryVariant = useCallback((id, slug) => {
    setVariant((prev) => {
      const next = { ...prev }
      if (!slug || prev[id] === slug) delete next[id]
      else next[id] = slug
      return next
    })
  }, [])
  const allEff = useMemo(
    () =>
      ALL.map((s) => {
        const vc = variant[s.id] && CARD_BY_SLUG[variant[s.id]]
        return vc && vc.slug !== s.card.slug ? { ...s, card: vc } : s
      }),
    [variant],
  )
  // character life-stories are wildcards (jokers): one arc per character, named like
  // in the game ("Увольнение Берты"), fit any mood, and can be collected
  const wildcards = useMemo(() => {
    if (!gs || gs.error) return []
    const byChar = {}
    for (const s of gs.stories) {
      if (s.kind !== 'chapter') continue
      const slug = charSlug(s.character)
      ;(byChar[slug] ||= []).push(s)
    }
    return data.cards
      .filter((c) => c.charSlug && byChar[c.charSlug])
      .map((c) => ({
        id: `char-${c.charSlug}`,
        wildcard: true,
        charSlug: c.charSlug,
        short: c.charShort || c.charSlug,
        title: c.character, // life-story name as shown in the game
        chapters: byChar[c.charSlug].slice().sort((a, b) => chapterNo(a.id) - chapterNo(b.id)),
      }))
      .sort((a, b) => a.short.localeCompare(b.short, 'ru'))
  }, [gs])

  const toggleTold = useCallback((id, idx) => {
    setTold((prev) => {
      const cur = prev[id] || []
      const next = cur.includes(idx) ? cur.filter((x) => x !== idx) : [...cur, idx]
      const o = { ...prev }
      if (next.length) o[id] = next
      else delete o[id]
      return o
    })
  }, [])

  const setGrade = useCallback((id, g) => {
    setGrades((prev) => {
      const next = { ...prev }
      if (g <= 0) delete next[id]
      else next[id] = g
      return next
    })
  }, [])
  const cycle = useCallback(
    (id) => setGrade(id, ((grades[id] || 0) + 1) % 4),
    [grades, setGrade],
  )

  const collected = ALL.filter((s) => grades[s.id]).length
  const q = norm(query.trim())
  const matchQ = (s) =>
    !q || q.split(/\s+/).every((w) => w.length < 2 || norm(s.tellings.join(' ')).includes(w))
  const matchOwned = (s) => {
    const g = grades[s.id] || 0
    const t = (told[s.id] || []).length
    if (owned === 'have') return g > 0
    if (owned === 'missing') return g === 0
    if (owned === 'partial') return g > 0 && g < 3
    if (owned === 'untold') return g > 0 && t === 0
    if (owned === 'variants') return (s.variantCards || []).length === 2
    return true
  }

  // ---- wheel view data ----
  const card = WHEEL_CARDS[active]
  const wheelStories = useMemo(
    () =>
      allEff.filter(
        (s) => s.card.slug === card.slug && s.mood === mood && matchQ(s) && matchOwned(s),
      ),
    [allEff, card, mood, q, owned, grades, told],
  )
  const hasMood = useCallback(
    (c) => allEff.some((s) => s.card.slug === c.slug && s.mood === mood),
    [allEff, mood],
  )

  // ---- pointer follows cursor ----
  const aimAt = useCallback((cx, cy) => {
    const el = stageRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const dx = cx - (r.left + r.width / 2)
    const dy = cy - (r.top + r.height / 2)
    if (Math.hypot(dx, dy) < r.width * 0.24) return // inside the reading table — ignore
    const ang = (Math.atan2(-dy, dx) * 180) / Math.PI
    let best = 0
    let bestD = Infinity
    NODE_ANGLES.forEach((na, i) => {
      const d = Math.abs(((na - ang + 540) % 360) - 180)
      if (d < bestD) {
        bestD = d
        best = i
      }
    })
    setAim(best)
  }, [])

  useEffect(() => {
    if (view !== 'wheel') return
    const key = (e) => {
      if (e.target.tagName === 'INPUT') return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') setAim((s) => (s + 1) % 16)
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') setAim((s) => (s + 15) % 16)
      if (e.key === 'Enter' || e.key === ' ') openCard(aim)
      if (e.key === 'Escape') setReading(false)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [view, aim])

  const pointerAngle =
    (Math.atan2(
      -(RY * Math.sin((NODE_ANGLES[aim] * Math.PI) / 180)),
      RX * Math.cos((NODE_ANGLES[aim] * Math.PI) / 180),
    ) *
      180) /
    Math.PI

  const openCard = (i) => {
    setActive(i)
    setAim(i)
    setReading(true)
  }
  const openStory = (story, c, m) => setModal({ story, card: c, mood: m })

  const exportJson = () => {
    const blob = new Blob(
      [JSON.stringify({ app: 'golos-vody', version: 1, grades, told, variant }, null, 2)],
      { type: 'application/json' },
    )
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'golos-vody-collection.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }
  const importJson = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        const g = parsed.grades && typeof parsed.grades === 'object' ? parsed.grades : parsed
        setGrades((prev) => ({ ...prev, ...g }))
        if (parsed.told && typeof parsed.told === 'object') setTold((prev) => ({ ...prev, ...parsed.told }))
        if (parsed.variant && typeof parsed.variant === 'object')
          setVariant((prev) => ({ ...prev, ...parsed.variant }))
      } catch {
        alert(L.import_fail)
      }
    }
    reader.readAsText(f)
    e.target.value = ''
  }

  return (
    <div className={`app ${moodCls(mood)} ${theme}`}>
      <header className="masthead">
        <div className="title-block">
          <div className="kicker">Where the Water Tastes Like Wine</div>
          <h1>Голос&nbsp;воды</h1>
          <div className="sub">{L.tagline}</div>
        </div>

        <button
          className="hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={L.menu}
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>

        <div className="controls">
          <div className="toprow">
            <div className="views">
              <button className={view === 'wheel' ? 'on' : ''} onClick={() => setView('wheel')}>
                {L.view_wheel}
              </button>
              <button className={view === 'all' ? 'on' : ''} onClick={() => setView('all')}>
                {L.view_all}
              </button>
              <button className={view === 'camp' ? 'on' : ''} onClick={() => setView('camp')}>
                {L.view_camp}
              </button>
            </div>
            <div className="collbox">
              <LangToggle lang={lang} setLang={setLang} title={L.lang_label} />
              <button
                className="ghost theme-btn"
                onClick={toggleTheme}
                title={theme === 'day' ? L.theme_to_night : L.theme_to_day}
              >
                {theme === 'day' ? L.theme_night : L.theme_day}
              </button>
              <button className="ghost" onClick={() => setOverlay('guide')} title={L.howto_title}>
                {L.howto}
              </button>
              <button className="ghost" onClick={() => setOverlay('hint')} title={L.hint_title}>
                {L.hint}
              </button>
              <button
                className="collcount"
                onClick={() => setOverlay('stats')}
                title={L.collected_title}
              >
                {L.collected} <b>{collected}</b> / {TOTAL}
              </button>
              <button className="ghost" onClick={exportJson} title={L.export_title}>
                {L.export}
              </button>
              <button className="ghost" onClick={() => fileRef.current?.click()} title={L.import_title}>
                {L.import}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                onChange={importJson}
                hidden
              />
            </div>
          </div>

          <div className="filterrow">
            <div className="moods" role="group" aria-label={L.type_group}>
              {view !== 'wheel' && (
                <button
                  className={`mood all ${allMoods ? 'on' : ''}`}
                  onClick={() => setAllMoods((v) => !v)}
                  title={view === 'camp' ? L.filter_all_camp : L.filter_all_wheel}
                >
                  {view === 'camp' ? L.filter_any : L.filter_all}
                </button>
              )}
              {MOODS.map((m) => (
                <button
                  key={m.key}
                  className={`mood ${m.cls} ${!allMoods && m.key === mood ? 'on' : ''}`}
                  aria-pressed={!allMoods && m.key === mood}
                  onClick={() => {
                    setMood(m.key)
                    setAllMoods(false)
                  }}
                >
                  {moodShort(m.key, lang)}
                </button>
              ))}
            </div>
            <label className="search">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={L.search_ph}
                autoComplete="off"
              />
            </label>
          </div>
        </div>
      </header>

      {view === 'wheel' ? (
        <main
          className="stage"
          ref={stageRef}
          onPointerMove={(e) => !e.target.closest('.reading') && aimAt(e.clientX, e.clientY)}
          onClick={(e) => {
            if (e.target.closest('.reading') || e.target.closest('.node')) return
            reading ? setReading(false) : openCard(aim)
          }}
        >
          <div className="divider" aria-hidden />
          <div className="hub" aria-hidden />
          <div
            className="pointer"
            style={{ transform: `translateY(-50%) rotate(${pointerAngle}deg)` }}
            aria-hidden
          />

          <div className="ring">
            {WHEEL_CARDS.map((c, i) => {
              const p = nodePos(NODE_ANGLES[i])
              return (
                <button
                  key={c.slug}
                  className={`node ${reading && i === active ? 'active' : ''} ${i === aim ? 'aim' : ''} ${
                    hasMood(c) ? 'has' : 'empty'
                  }`}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  title={cardName(c, lang)}
                  aria-label={cardName(c, lang)}
                  onPointerEnter={() => setAim(i)}
                  onClick={() => openCard(i)}
                >
                  <img src={`${BASE}icons/${c.slug}.webp`} alt="" draggable="false" />
                </button>
              )
            })}
          </div>

          {!reading && (
            <button
              type="button"
              className="wheel-hint"
              onClick={() => openCard(aim)}
            >
              {L.wheel_hint}
            </button>
          )}

          {reading && (
          <section className="reading" key={active + mood}>
            <button className="reading-close" onClick={() => setReading(false)} aria-label={L.close}>
              ×
            </button>
            <div className="reading-card">
              <img className="bigcard" src={`${BASE}cards/${card.slug}.webp`} alt={cardName(card, lang)} />
            </div>
            <div className="reading-body">
              <div className="card-head">
                <span className="roman">{card.roman}</span>
                <h2>{cardName(card, lang)}</h2>
                <div className="en">{cardAlt(card, lang)}</div>
                {cardMeaning(card, lang) && <div className="card-meaning">{cardMeaning(card, lang)}</div>}
                <div className="teller">
                  <span className="lbl">{L.char_story}</span>
                  {card.character || '—'}
                </div>
              </div>
              <div className="list-head">
                <span className={`tag ${moodCls(mood)}`}>{moodFull(mood, lang)}</span>
                <span className="count">
                  {wheelStories.length ? `${wheelStories.length} ${L.story_word(wheelStories.length)}` : L.empty}
                </span>
              </div>
              <div className="stories">
                {wheelStories.length === 0 && (
                  <p className="empty-msg">
                    {q || owned !== 'all' ? L.empty_filtered : L.empty_card}
                  </p>
                )}
                {wheelStories.map((s) => (
                  <StoryRow
                    key={s.id}
                    story={s}
                    card={card}
                    grade={grades[s.id] || 0}
                    onCycle={() => cycle(s.id)}
                    told={told[s.id] || []}
                    onOpen={() => openStory(s, card, mood)}
                    lang={lang}
                  />
                ))}
              </div>
            </div>
          </section>
          )}
        </main>
      ) : view === 'all' ? (
        <AllView
          stories={allEff}
          allMoods={allMoods}
          mood={mood}
          matchQ={matchQ}
          matchOwned={matchOwned}
          owned={owned}
          setOwned={setOwned}
          sort={sort}
          setSort={setSort}
          grades={grades}
          cycle={cycle}
          told={told}
          onOpen={openStory}
          wildcards={wildcards}
          onOpenChapter={(w) => setCharModal(w.charSlug)}
          lang={lang}
        />
      ) : (
        <CampView
          stories={allEff}
          allMoods={allMoods}
          mood={mood}
          setMood={setMood}
          setAllMoods={setAllMoods}
          matchQ={matchQ}
          grades={grades}
          told={told}
          toggleTold={toggleTold}
          onOpen={openStory}
          gs={gs}
          deck={deck}
          toggleDeck={toggleDeck}
          setDeck={setDeck}
          lang={lang}
          setLang={setLang}
        />
      )}

      {overlay === 'guide' && <GuideModal lang={lang} onClose={() => setOverlay(null)} onMoods={() => setOverlay('hint')} />}
      {overlay === 'hint' && <HintModal lang={lang} onClose={() => setOverlay(null)} />}
      {overlay === 'stats' && <StatsModal grades={grades} told={told} lang={lang} onClose={() => setOverlay(null)} />}

      {modal && (
        <StoryModal
          {...modal}
          grade={grades[modal.story.id] || 0}
          onSetGrade={(g) => setGrade(modal.story.id, g)}
          onCycle={() => cycle(modal.story.id)}
          told={told[modal.story.id] || []}
          onToggleTold={(i) => toggleTold(modal.story.id, i)}
          gs={gs}
          lang={lang}
          setLang={setLang}
          variant={variant[modal.story.id] || null}
          onSetVariant={(slug) => setStoryVariant(modal.story.id, slug)}
          onClose={() => setModal(null)}
        />
      )}

      {gModal && (
        <GameStoryModal
          story={gModal}
          meta={gs?.meta}
          lang={lang}
          setLang={setLang}
          onClose={() => setGModal(null)}
        />
      )}

      {charModal && (
        <CharacterModal
          ch={CHARACTERS.find((c) => c.slug === charModal)}
          gs={gs}
          lang={lang}
          setLang={setLang}
          onClose={() => setCharModal(null)}
        />
      )}

      <footer className="hint">
        {view === 'wheel' ? (
          <>{L.footer_wheel_1}<b>{lang === 'en' ? 'click' : 'клик'}</b>{L.footer_wheel_2}<b>← →</b>{L.footer_wheel_3}<b>Enter</b>{L.footer_wheel_4}<b>{lang === 'en' ? 'evolution grade' : 'грейд эволюции'}</b></>
        ) : view === 'camp' ? (
          <>{L.footer_camp_1}<b>«{L.tell_btn}»</b>{L.footer_camp_2}</>
        ) : (
          <>{L.footer_all_1}<b>{lang === 'en' ? 'the eye' : 'глаз'}</b>{L.footer_all_2}<b>{lang === 'en' ? 'avatars' : 'аватары'}</b>{L.footer_all_3}</>
        )}
      </footer>

      {menuOpen && (
        <div className="msheet-scrim" onClick={() => setMenuOpen(false)}>
          <div className="msheet" onClick={(e) => e.stopPropagation()}>
            <div className="msheet-grab" />
            <div className="msheet-lang">
              <span>{L.lang_label}</span>
              <LangToggle lang={lang} setLang={setLang} />
            </div>
            <button onClick={toggleTheme}>
              {theme === 'day' ? L.theme_night_full : L.theme_day_full}
            </button>
            <button onClick={() => { setOverlay('guide'); setMenuOpen(false) }}>{L.howto}</button>
            <button onClick={() => { setOverlay('hint'); setMenuOpen(false) }}>{L.hint_menu}</button>
            <button onClick={() => { setOverlay('stats'); setMenuOpen(false) }}>
              {L.stats_menu} · {L.collected} {collected}/{TOTAL}
            </button>
            <button onClick={() => { exportJson(); setMenuOpen(false) }}>{L.export_menu}</button>
            <button onClick={() => { fileRef.current?.click(); setMenuOpen(false) }}>{L.import_menu}</button>
          </div>
        </div>
      )}

      <nav className="tabbar">
        <button className={view === 'wheel' ? 'on' : ''} onClick={() => setView('wheel')}>
          <span className="tb-ico">✦</span>{L.view_wheel}
        </button>
        <button className={view === 'all' ? 'on' : ''} onClick={() => setView('all')}>
          <span className="tb-ico">☰</span>{L.view_all}
        </button>
        <button className={view === 'camp' ? 'on' : ''} onClick={() => setView('camp')}>
          <span className="tb-ico">✸</span>{L.view_camp}
        </button>
      </nav>
    </div>
  )
}

function LangToggle({ lang, setLang, title }) {
  return (
    <div className="lang-toggle" role="group" aria-label={title || 'Language'} title={title}>
      <button className={lang === 'ru' ? 'on' : ''} onClick={() => setLang('ru')}>RU</button>
      <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
    </div>
  )
}

function GameStoryModal({ story, meta, lang, setLang, onClose }) {
  const L = tr(lang)
  const cards = story.cards.map((sl) => CARD_BY_SLUG[sl]).filter(Boolean)
  const hasRu = story.ru && story.ru.length > 0
  const showLang = lang === 'ru' && !hasRu ? 'en' : lang
  const text = story[showLang] || story.en || []
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal gs-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label={L.close}>×</button>
        <div className="gs-modal-head">
          {story.wildcard ? (
            <img className="gs-modal-ico" src={`${BASE}chars/${story.charSlug}.webp`} alt="" />
          ) : (
            story.icon && <img className="gs-modal-ico" src={`${BASE}storyicons/${story.id}.webp`} alt="" />
          )}
          <div className="gs-modal-title">
            <h2>{story.title}</h2>
            <div className="modal-sub">
              {L.kinds[story.kind]}{story.character ? ` · ${story.character}` : ''}
            </div>
            <div className="gs-tags">
              {story.wildcard && <span className="joker-badge">{L.joker_badge_full}</span>}
              {cards.map((c) => (
                <span key={c.slug} className="gs-cardtag">
                  <img src={`${BASE}icons/${c.slug}.webp`} alt="" />
                  <b>{cardName(c, lang)}</b>
                  {cardMeaning(c, lang) && <em>{cardMeaning(c, lang)}</em>}
                </span>
              ))}
              {(story.moodsApp || []).map((m) => (
                <span key={m} className={`tag ${moodCls(m)}`}>{moodShort(m, lang)}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="gs-modal-bar">
          <LangToggle lang={lang} setLang={setLang} />
          {lang === 'ru' && !hasRu && <span className="gs-noru">{L.no_ru}</span>}
        </div>

        <div className="gs-text">
          {text.map((p, i) => <p key={i}>{p}</p>)}
        </div>
      </div>
    </div>
  )
}

function AllView({ stories, allMoods, mood, matchQ, matchOwned, owned, setOwned, sort, setSort, grades, cycle, told, onOpen, wildcards = [], onOpenChapter, lang = 'ru' }) {
  const L = tr(lang)
  const CARD_ORDER = data.cards.map((c) => c.slug)
  const onlyWild = owned === 'wildcards'
  const list = onlyWild
    ? []
    : stories
        .filter((s) => (allMoods || s.mood === mood) && matchQ(s) && matchOwned(s))
        .sort((a, b) => {
          if (sort === 'grade') return (grades[b.id] || 0) - (grades[a.id] || 0)
          if (sort === 'told') return (told[b.id] || []).length - (told[a.id] || []).length
          if (sort === 'az') return titleAt(a, lang).localeCompare(titleAt(b, lang), 'ru')
          return CARD_ORDER.indexOf(a.card.slug) - CARD_ORDER.indexOf(b.card.slug)
        })
  const wildList =
    onlyWild || (owned === 'all' && allMoods)
      ? wildcards.filter((w) =>
          matchQ({ tellings: [w.title, ...(w.chapters || []).flatMap((c) => [c.chapterTitle, c.chapterTitleRu])] }),
        )
      : []
  return (
    <main className="allview">
      <div className="allbar">
        <div className="ownfilter">
          {[
            ['all', L.own_all],
            ['have', L.own_have],
            ['missing', L.own_missing],
            ['partial', L.own_partial],
            ['untold', L.own_untold],
            ['variants', L.own_variants],
            ['wildcards', L.own_wildcards],
          ].map(([k, l]) => (
            <button key={k} className={owned === k ? 'on' : ''} onClick={() => setOwned(k)}>
              {l}
            </button>
          ))}
        </div>
        <div className="allright">
          <label className="sortbox">
            {L.sort_label}
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="card">{L.sort_card}</option>
              <option value="grade">{L.sort_grade}</option>
              <option value="told">{L.sort_told}</option>
              <option value="az">{L.sort_az}</option>
            </select>
          </label>
          <span className="allcount">{L.of_flat(list.length + wildList.length, TOTAL)}</span>
        </div>
      </div>
      <div className="allgrid">
        {list.length === 0 && wildList.length === 0 && (
          <p className="empty-msg">{L.nothing_found}</p>
        )}
        {list.map((s) => (
          <StoryRow
            key={s.id}
            story={s}
            card={s.card}
            mood={s.mood}
            showMeta
            grade={grades[s.id] || 0}
            onCycle={() => cycle(s.id)}
            told={told[s.id] || []}
            onOpen={() => onOpen(s, s.card, s.mood)}
            lang={lang}
          />
        ))}
        {wildList.map((w) => (
          <WildcardRow
            key={w.id}
            w={w}
            grade={grades[w.id] || 0}
            onCycle={() => cycle(w.id)}
            onOpen={() => onOpenChapter(w)}
            lang={lang}
          />
        ))}
      </div>
    </main>
  )
}

function chapterWord(n, lang) {
  if (lang === 'en') return n === 1 ? 'chapter' : 'chapters'
  const a = n % 10, b = n % 100
  if (a === 1 && b !== 11) return 'глава'
  if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return 'главы'
  return 'глав'
}
function WildcardRow({ w, grade = 0, onCycle, onOpen, lang = 'ru' }) {
  const L = tr(lang)
  const nCh = w.chapters?.length || 0
  return (
    <article className={`story wildcard ${grade ? 'have' : ''}`}>
      <div className="story-row">
        <button
          className="eye-btn"
          onClick={(e) => { e.stopPropagation(); onCycle?.() }}
          title={grade ? L.full_title : L.grade_mark}
          aria-label={L.grade_story_aria}
        >
          <Eye grade={grade} />
        </button>
        <span className="story-icon joker" onClick={onOpen}>
          <img src={`${BASE}chars/${w.charSlug}.webp`} alt="" loading="lazy" />
        </span>
        <span className="story-main" onClick={onOpen}>
          <span className="story-title">{w.title}</span>
          <span className="story-meta">
            <span className="joker-badge">{L.joker}</span> {L.joker_sub}
            {nCh ? ` · ${nCh} ${chapterWord(nCh, lang)}` : ''}
          </span>
        </span>
        <span className="chev" aria-hidden onClick={onOpen}>›</span>
      </div>
    </article>
  )
}

function StoryRow({ story, card, mood, showMeta, grade, onCycle, told = [], onOpen, lang = 'ru' }) {
  const L = tr(lang)
  return (
    <article className={`story ${grade ? 'have' : ''}`}>
      <div className="story-row">
        <button
          className="eye-btn"
          onClick={(e) => {
            e.stopPropagation()
            onCycle()
          }}
          title={grade ? `${L.grades[grade - 1]}${L.grade_up_suffix}` : L.grade_mark}
          aria-label={L.grade_story_aria}
        >
          <Eye grade={grade} />
        </button>
        <span className="story-icon">
          <img
            src={story.icon ? `${BASE}storyicons/${story.icon}.webp` : `${BASE}icons/${card.slug}.webp`}
            alt=""
            loading="lazy"
          />
        </span>
        <span className="story-main" onClick={onOpen}>
          <span className="story-title">{titleAt(story, lang)}</span>
          {showMeta && (
            <span className="story-meta">
              {cardName(card, lang)} · <span className={`dot ${moodCls(mood)}`} /> {moodShort(mood, lang)}
            </span>
          )}
        </span>
        {told.length > 0 && (
          <span className="told-avatars" onClick={onOpen} title={`${L.told_title}: ${told.length}`}>
            {[...told]
              .sort((a, b) => a - b)
              .slice(0, 5)
              .map((i) => (
                <img key={i} src={`${BASE}chars/${CHARACTERS[i].slug}.webp`} alt={CHARACTERS[i].short} loading="lazy" />
              ))}
            {told.length > 5 && <em>+{told.length - 5}</em>}
          </span>
        )}
        {grade === 3 ? (
          <span className="full-badge" onClick={onOpen} title={L.full_title}>
            {L.full}
          </span>
        ) : (
          <span className="grade-pips" onClick={onOpen} aria-hidden>
            {[1, 2, 3].map((n) => (
              <i key={n} className={n <= grade ? 'on' : ''} />
            ))}
          </span>
        )}
        <span className="chev" onClick={onOpen} aria-hidden>
          ›
        </span>
      </div>
    </article>
  )
}

function StoryModal({ story, card, mood, grade, onSetGrade, onCycle, told, onToggleTold, gs, lang, setLang, variant, onSetVariant, onClose }) {
  const L = tr(lang)
  const t = titlesFor(story, lang)
  const g = story.icon && gs && !gs.error ? gs.stories.find((s) => s.id === story.icon) : null
  const variantCards = (story.variantCards || []).map((sl) => CARD_BY_SLUG[sl]).filter(Boolean)
  const shownCard = (variant && CARD_BY_SLUG[variant]) || card
  const hasRu = g && g.ru && g.ru.length > 0
  const showLang = lang === 'ru' && !hasRu ? 'en' : lang
  const gText = g ? g[showLang] || g.en || [] : []
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label={L.close}>
          ✕
        </button>
        <div className={`modal-hero ${story.icon ? 'has-vignette' : ''}`}>
          {story.icon ? (
            <img
              className="modal-vignette"
              src={`${BASE}storyicons/${story.icon}.webp`}
              alt={t[0]}
            />
          ) : (
            <img className="modal-card" src={`${BASE}cards/${shownCard.slug}.webp`} alt={cardName(shownCard, lang)} />
          )}
          <div className="modal-head">
            <span className="roman">{shownCard.roman}</span>
            <div className={`tag ${moodCls(mood)}`}>{moodFull(mood, lang)}</div>
            <h2>{t[0]}</h2>
            <div className="modal-sub">
              <img className="modal-cardicon" src={`${BASE}icons/${shownCard.slug}.webp`} alt="" />
              <span>{cardName(shownCard, lang)}</span> · <span className="en">{cardAlt(shownCard, lang)}</span>
              {cardMeaning(shownCard, lang) && <span className="card-meaning"> · {cardMeaning(shownCard, lang)}</span>}
            </div>
            <button className="grade-set" onClick={onCycle}>
              <Eye grade={grade} />
              <span>{grade ? L.grades[grade - 1] : L.not_in_bag}</span>
              <span className="grade-pips big">
                {[1, 2, 3].map((n) => (
                  <i key={n} className={n <= grade ? 'on' : ''} />
                ))}
              </span>
            </button>
          </div>
        </div>

        <div className="modal-section">
          <div className="section-lbl">{L.sec_evo}</div>
          {t.map((x, j) => {
            const known = j < grade
            return (
              <div className={`telling ${known ? 'known' : 'unknown'}`} key={j}>
                <button
                  className="tmark"
                  onClick={() => onSetGrade(known && grade === j + 1 ? j : j + 1)}
                  title={known ? L.tell_heard : L.tell_mark}
                >
                  <Eye grade={known ? 3 : 0} />
                </button>
                <span className="tier">{L.grades[j] || '···'}</span>
                <span className="tell-text">{x}</span>
              </div>
            )
          })}
        </div>

        {variantCards.length === 2 && (
          <div className="modal-section">
            <div className="section-lbl">
              {L.sec_variants}{' '}
              <span className="told-hint">{L.variants_hint}</span>
            </div>
            <div className="variant-cards">
              {variantCards.map((c) => (
                <button
                  key={c.slug}
                  className={`variant-card ${variant === c.slug ? 'on' : ''}`}
                  onClick={() => onSetVariant(c.slug)}
                  title={variant === c.slug ? L.variant_untake : L.variant_take}
                >
                  <img src={`${BASE}icons/${c.slug}.webp`} alt="" />
                  <b>{cardName(c, lang)}</b>
                  {cardMeaning(c, lang) && <em>{cardMeaning(c, lang)}</em>}
                </button>
              ))}
            </div>
          </div>
        )}

        {g && gText.length > 0 && (
          <div className="modal-section">
            <div className="section-lbl gs-orig-lbl">
              {L.sec_original}
              <LangToggle lang={lang} setLang={setLang} />
              {lang === 'ru' && !hasRu && <span className="gs-noru">{L.no_ru}</span>}
            </div>
            <div className="gs-text">
              {gText.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </div>
        )}

        <div className="modal-section">
          <div className="section-lbl">{L.sec_where}</div>
          <p className="where-text">
            {(lang === 'en' ? story.locationEn : story.location) && (
              <><b className="where-region">{lang === 'en' ? story.locationEn : story.location}</b><br /></>
            )}
            {L.where_default}
          </p>
        </div>

        <div className="modal-section">
          <div className="section-lbl">
            {L.sec_told} <span className="told-hint">{L.told_hint}</span>
          </div>
          <div className="chars">
            {CHARACTERS.map((ch, i) => (
              <button
                key={ch.slug}
                className={`char ${told.includes(i) ? 'on' : ''} ${ch.wolf ? 'wolf' : ''}`}
                onClick={() => onToggleTold(i)}
                title={ch.short}
              >
                <img src={`${BASE}chars/${ch.slug}.webp`} alt="" loading="lazy" />
                <span>{ch.short}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function CampView({ stories, allMoods, mood, matchQ, grades, told, toggleTold, onOpen, setMood, setAllMoods, gs, deck, toggleDeck, setDeck, lang, setLang }) {
  const L = tr(lang)
  const [char, setChar] = useState(0)
  const [used, setUsed] = useState(() => new Set())
  const [infoOpen, setInfoOpen] = useState(false)
  const ch = CHARACTERS[char]

  // auto-build the deck for this character: up to 3 per card, favoring liked moods
  const buildDeck = () => {
    const pool = stories.filter((s) => (grades[s.id] || 0) >= 1 && !(told[s.id] || []).includes(char))
    const likes = new Set(ch.moods || [])
    const next = {}
    for (const c of data.cards) {
      const picks = pool
        .filter((s) => s.card.slug === c.slug)
        .sort((a, b) => (likes.has(b.mood) - likes.has(a.mood)) || (grades[b.id] || 0) - (grades[a.id] || 0))
        .slice(0, DECK_MAX)
        .map((s) => s.id)
      if (picks.length) next[c.slug] = picks
    }
    setDeck(next)
  }

  // a mood filter hides non-matching stories entirely (highlighting them was confusing)
  const avail = stories.filter(
    (s) =>
      (grades[s.id] || 0) >= 1 &&
      !(told[s.id] || []).includes(char) &&
      matchQ(s) &&
      (allMoods || s.mood === mood),
  )
  const matchesN = allMoods ? 0 : avail.length
  const byCard = data.cards
    .map((c) => ({
      card: c,
      list: avail.filter((s) => s.card.slug === c.slug),
    }))
    .filter((g) => g.list.length)
    // an already-used card is locked for the round → drop it to the bottom
    .sort((a, b) => used.has(a.card.slug) - used.has(b.card.slug))

  const tell = (s) => {
    toggleTold(s.id, char)
    setUsed((u) => new Set(u).add(s.card.slug))
  }

  return (
    <main className="campview">
      <div className="camp-top">
        <div className="camp-lbl">{L.camp_with}</div>
        <div className="camp-chars">
          {CHARACTERS.map((c, i) => (
            <button
              key={c.slug}
              className={`camp-char ${i === char ? 'on' : ''} ${c.wolf ? 'wolf' : ''}`}
              onClick={() => setChar(i)}
              title={c.short}
            >
              <img src={`${BASE}chars/${c.slug}.webp`} alt="" loading="lazy" />
              <span>{c.short}</span>
            </button>
          ))}
        </div>

        <div className="camp-info">
          <div className="camp-info-txt">
            <span className="camp-info-role">{ch.role}{ch.card ? ` · ${ch.card}` : ''}</span>
            <span className="camp-info-loc">
              <em>{L.camp_where}</em> {ch.location}
              {ch.regions?.length > 0 && <span className="camp-regions"> · {ch.regions.join(', ')}</span>}
            </span>
            {(ch.conceptRu || ch.author) && (
              <span className="camp-info-extra">
                {ch.conceptRu && <><em>{L.camp_theme}</em> {ch.conceptRu}</>}
                {ch.author && <span className="camp-author"><em>{L.camp_text}</em> {ch.author}</span>}
              </span>
            )}
            {ch.moods?.length > 0 && (
              <span className="camp-info-moods">
                <em>{L.camp_likes}</em>
                {ch.moods.map((mk) => {
                  const m = MOODS.find((x) => x.key === mk)
                  return (
                    <button
                      key={mk}
                      className={`chip ${m.cls} ${!allMoods && mood === mk ? 'on' : ''}`}
                      onClick={() => {
                        setMood(mk)
                        setAllMoods(false)
                      }}
                      title={L.camp_pick_mood}
                    >
                      {moodShort(mk, lang)}
                    </button>
                  )
                })}
              </span>
            )}
          </div>
          <button className="ghost" onClick={() => setInfoOpen(true)}>{L.camp_about}</button>
        </div>

        <div className="camp-round">
          {!allMoods && (
            <span className="camp-match">
              {L.camp_matches} <b>{matchesN}</b>
            </span>
          )}
          <span>{L.camp_cards_used()}<b>{used.size}</b>{L.camp_of5}</span>
          <button className="ghost" onClick={() => setUsed(new Set())}>
            {L.camp_new}
          </button>
          <button className="ghost deck-build" onClick={buildDeck} title={L.deck_build_hint}>
            ✦ {L.deck_build}
          </button>
          {Object.keys(deck).length > 0 && (
            <button className="ghost" onClick={() => setDeck({})}>{L.deck_clear}</button>
          )}
        </div>
        <div className="camp-deckhint">{L.deck_hint}</div>
      </div>

      <div className="camp-body">
        {byCard.length === 0 && (
          <p className="empty-msg">{L.camp_empty(ch.short)}</p>
        )}
        {byCard.map(({ card, list }) => {
          const cardUsed = used.has(card.slug)
          const deckIds = deck[card.slug] || []
          const deckFull = deckIds.length >= DECK_MAX
          // deck stories first, so the active hand is on top
          const ordered = list.slice().sort((a, b) => deckIds.includes(b.id) - deckIds.includes(a.id))
          return (
            <section key={card.slug} className={`camp-card ${cardUsed ? 'used' : ''}`}>
              <div className="camp-card-head">
                <span className="camp-card-icon">
                  <img src={`${BASE}icons/${card.slug}.webp`} alt="" loading="lazy" />
                </span>
                <h3>{cardName(card, lang)}</h3>
                {cardUsed && <span className="used-tag">{L.camp_card_locked}</span>}
                <span className={`camp-deck-count ${deckIds.length ? 'on' : ''}`}>
                  {L.deck_in} {deckIds.length}/{DECK_MAX}
                </span>
                <span className="camp-card-count">{list.length}</span>
              </div>
              <div className="camp-stories">
                {ordered.map((s) => {
                  const g = grades[s.id] || 0
                  const inDeck = deckIds.includes(s.id)
                  return (
                    <div key={s.id} className={`camp-story ${inDeck ? 'in-deck' : ''}`}>
                      <button
                        className={`deck-star ${inDeck ? 'on' : ''}`}
                        onClick={() => toggleDeck(card.slug, s.id)}
                        disabled={!inDeck && deckFull}
                        title={inDeck ? L.deck_remove : deckFull ? L.deck_full : L.deck_add}
                        aria-label={inDeck ? L.deck_remove : L.deck_add}
                      >
                        {inDeck ? '★' : '☆'}
                      </button>
                      <span className={`dot ${moodCls(s.mood)}`} />
                      <span className="camp-story-title" onClick={() => onOpen(s, s.card, s.mood)}>
                        {titleAt(s, lang, Math.max(0, g - 1))}
                      </span>
                      <span className="camp-story-mood">
                        {moodShort(s.mood, lang)}
                      </span>
                      <button
                        className="tell-btn"
                        onClick={() => tell(s)}
                        disabled={cardUsed || !inDeck}
                        title={cardUsed ? L.tell_btn_locked : !inDeck ? L.tell_need_deck : L.tell_btn_do}
                      >
                        {L.tell_btn}
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {infoOpen && (
        <CharacterModal ch={ch} gs={gs} lang={lang} setLang={setLang} onClose={() => setInfoOpen(false)} />
      )}
    </main>
  )
}

// game character name ("Dire Wolf", "Little Ben") -> app character slug
const charSlug = (name) => {
  const s = (name || '').toLowerCase().replace(/\s+/g, '-')
  return s === 'dire-wolf' ? 'wolf' : s
}
const chapterNo = (id) => {
  const m = /(\d+)\s*$/.exec(id || '')
  return m ? +m[1] : 0
}

function CharacterModal({ ch, gs, lang, setLang, onClose }) {
  const L = tr(lang)
  const [open, setOpen] = useState(null)
  const chapters =
    gs && !gs.error
      ? gs.stories
          .filter((s) => s.kind === 'chapter' && charSlug(s.character) === ch.slug)
          .sort((a, b) => chapterNo(a.id) - chapterNo(b.id))
      : []
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal char-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label={L.close}>✕</button>
        <div className="modal-hero">
          <img className="char-portrait" src={`${BASE}chars/${ch.slug}.webp`} alt={ch.short} />
          <div className="modal-head">
            <span className="roman">{ch.role}</span>
            <h2>{ch.short}</h2>
            {ch.card && (
              <div className="modal-sub">{L.card_word}: <b>{ch.card}</b></div>
            )}
          </div>
        </div>
        <div className="modal-section">
          <div className="section-lbl">{L.ch_where}</div>
          <p className="where-text">{ch.location}</p>
        </div>
        {ch.moods?.length > 0 && (
          <div className="modal-section">
            <div className="section-lbl">{L.ch_moods}</div>
            <div className="char-moods">
              {ch.moods.map((mk) => {
                const m = MOODS.find((x) => x.key === mk)
                return <span key={mk} className={`tag ${m.cls}`}>{moodShort(mk, lang)}</span>
              })}
            </div>
          </div>
        )}
        <div className="modal-section">
          <div className="section-lbl">{L.ch_about}</div>
          <p className="guide-p">{ch.bio}</p>
        </div>
        {chapters.length > 0 && (
          <div className="modal-section">
            <div className="section-lbl gs-orig-lbl">
              {L.ch_life(chapters.length, L.story_word(chapters.length))}
              <LangToggle lang={lang} setLang={setLang} />
            </div>
            <div className="chapters">
              {chapters.map((c, i) => {
                const hasRu = c.ru && c.ru.length > 0
                const show = lang === 'ru' && !hasRu ? 'en' : lang
                const text = c[show] || c.en || []
                const isOpen = open === i
                return (
                  <div key={c.id} className={`chapter ${isOpen ? 'open' : ''}`}>
                    <button className="chapter-head" onClick={() => setOpen(isOpen ? null : i)}>
                      <span className="chapter-no">{L.chapter} {chapterNo(c.id) || i + 1}</span>
                      {(lang === 'en' ? c.chapterTitle : c.chapterTitleRu) && (
                        <span className="chapter-title">{lang === 'en' ? c.chapterTitle : c.chapterTitleRu}</span>
                      )}
                      {lang === 'ru' && !hasRu && <span className="gs-noru">{L.only_original}</span>}
                      <span className="chapter-toggle">{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && (
                      <div className="chapter-body gs-text">
                        {text.map((p, j) => <p key={j}>{p}</p>)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function GuideModal({ lang = 'ru', onClose, onMoods }) {
  const en = lang === 'en'
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal guide-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label={en ? 'Close' : 'Закрыть'}>✕</button>
        <h2 className="overlay-title">{en ? 'How to play' : 'Как играть'}</h2>
        <p className="overlay-intro">
          {en
            ? 'Where the Water Tastes Like Wine is about collecting and retelling American tall tales of the Great Depression. You wander the country, gather stories and tell them to the travelers you meet by the fire to unlock their fates.'
            : 'Where the Water Tastes Like Wine — про сбор и пересказ американских баек эпохи Великой депрессии. Ты бродишь по стране, собираешь истории и рассказываешь их случайным попутчикам у костра, чтобы раскрыть их судьбы.'}
        </p>

        <div className="guide-sec">
          <div className="section-lbl">{en ? 'How to get stories' : 'Как получить истории'}</div>
          <p className="guide-p">
            {en ? (
              <>Look for <b>houses with an eye icon</b> on the map and explore cities — an encounter mini-game starts. The <b>first night by the fire</b> with each character also gives their life story.</>
            ) : (
              <>Ищи на карте <b>домики с иконкой глаза</b> и исследуй города — запустится мини-игра встречи. Ещё историю жизни даёт <b>первая ночь у костра</b> с каждым персонажем.</>
            )}
          </p>
        </div>

        <div className="guide-sec">
          <div className="section-lbl">{en ? 'Cards and moods' : 'Карты и настроения'}</div>
          <p className="guide-p">
            {en ? (
              <>Every story belongs to one of <b>16 tarot cards</b> (a card = a theme: family, freedom, fate…) and one of <b>5 moods</b>: scary, adventurous, funny, sad, hopeful.</>
            ) : (
              <>Каждая история относится к одной из <b>16 карт Таро</b> (карта = тема: семья, свобода, рок…) и к одному из <b>5 настроений</b>: страшные, приключения, весёлые, грустные, светлые.</>
            )}
          </p>
        </div>

        <div className="guide-sec">
          <div className="section-lbl">{en ? 'Story evolution · 3 grades' : 'Эволюция историй · 3 грейда'}</div>
          <p className="guide-p">
            {en ? (
              <>Not obvious: once you tell a story, it <b>gathers rumors</b> and changes. Hear it again out in the world (that same eye house) and it evolves: <b>grade&nbsp;I → II → III</b>. The eye icon shows the progress:</>
            ) : (
              <>Это неочевидно: после того как ты рассказал историю, она <b>обрастает слухами</b> и меняется. Услышь её снова в мире (тот самый домик с глазом) — и она эволюционирует:{' '}<b>грейд&nbsp;I → II → III</b>. Прогресс показывает иконка глаза:</>
            )}
          </p>
          <div className="guide-eyes">
            <span><Eye grade={1} /> {en ? 'closed — I' : 'закрытый — I'}</span>
            <span><Eye grade={2} /> {en ? 'open — II' : 'открытый — II'}</span>
            <span><Eye grade={3} /> {en ? 'radiant — III' : 'сияющий — III'}</span>
          </div>
          <p className="guide-p">
            {en ? (
              <>In this app that's the <b>eye on each story</b> — click to mark the grade. A character won't hear the same story twice <b>regardless of grade</b>.</>
            ) : (
              <>В приложении это <b>глаз у каждой истории</b> — отмечай грейд кликом. Персонаж не станет слушать одну историю дважды <b>вне зависимости от грейда</b>.</>
            )}
          </p>
        </div>

        <div className="guide-sec">
          <div className="section-lbl">{en ? 'One story — different cards' : 'Одна история — разные карты'}</div>
          <p className="guide-p">
            {en ? (
              <>Also not obvious: in the encounter mini-game <b>some of the choices are tagged with a tarot card</b>. Your choice decides which <b>card and mood</b> the story lands under (and what it's called). So one encounter gives different cards to different players — the changing icons while exploring show exactly that.</>
            ) : (
              <>Тоже неочевидно: в мини-игре встречи <b>часть вариантов выбора помечена картой Таро</b>. Твой выбор решает, под какую <b>карту и настроение</b> ляжет история (и как она будет называться). Поэтому у разных игроков одна встреча даёт разные карты — меняющиеся иконки при исследовании это и показывают.</>
            )}
          </p>
        </div>

        <div className="guide-sec">
          <div className="section-lbl">{en ? 'By the fire' : 'У костра'}</div>
          <p className="guide-p">
            {en ? (
              <>A character asks for a story of a certain <b>mood</b> — guess it from their words (hit{' '}<button className="inline-link" onClick={onMoods}>«Hint»</button>). Get it right → the character "wakes up" and a chapter of their life opens. Per round you can tell <b>up to 5 stories</b>, each <b>card only once per round</b>. Character stories are <b>wildcards</b>: they fit any mood and have no grades.</>
            ) : (
              <>Персонаж просит историю определённого <b>настроения</b> — угадай по его словам (жми{' '}<button className="inline-link" onClick={onMoods}>«Подсказка»</button>). Попал → персонаж «просыпается», открывается глава его жизни. За раунд можно рассказать <b>до 5 историй</b>, каждую <b>карту — только раз за раунд</b>. Истории персонажей — <b>вайлдкарты</b>: подходят под любое настроение и не имеют грейдов.</>
            )}
          </p>
        </div>

        <div className="guide-sec">
          <div className="section-lbl">{en ? 'The Wolf and death' : 'Волк и смерть'}</div>
          <p className="guide-p">
            {en ? (
              <>Don't fear death — it barely matters. After it comes a round with the <b>Wolf</b>: you can tell it any 5 stories (no effect on progress), which makes it <b>perfect for grinding grades</b>. The fast way to die is riding the rails as a stowaway.</>
            ) : (
              <>Смерти не бойся — она почти ни на что не влияет. После неё будет раунд с <b>Волком</b>: ему можно рассказать любые 5 историй (на прогресс не влияет), зато это <b>идеально для фарма грейдов</b>. Быстрый способ умереть — кататься зайцем на поездах.</>
            )}
          </p>
        </div>

        <div className="guide-sec">
          <div className="section-lbl">{en ? 'What this app does' : 'Что умеет это приложение'}</div>
          <p className="guide-p">
            {en ? (
              <><b>Wheel</b> — pick a story like in the game · <b>All stories</b> — catalogue with filters · <b>Campfire</b> — what to tell a specific character · <b>eye</b> — grade · <b>avatars</b> — who you already told · <b>Stats</b> — progress. Everything is stored in your browser and can be exported to JSON.</>
            ) : (
              <><b>Колесо</b> — выбор истории как в игре · <b>Все истории</b> — каталог с фильтрами ·{' '}<b>Костёр</b> — что рассказать конкретному персонажу · <b>глаз</b> — грейд · <b>аватары</b>{' '}— кому уже рассказал · <b>Статистика</b> — прогресс. Всё хранится в браузере и выгружается в JSON.</>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

function HintModal({ lang = 'ru', onClose }) {
  const L = tr(lang)
  const H = MOOD_HINTS[lang] || MOOD_HINTS.ru
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal hint-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label={L.close}>
          ✕
        </button>
        <h2 className="overlay-title">{L.hint_title}</h2>
        <p className="overlay-intro">{H.intro}</p>
        {MOODS.map((m) => {
          const h = H.moods[m.key]
          return (
            <div className="hint-row" key={m.key}>
              <div className="hint-mood">
                <span className={`dot ${m.cls}`} /> {moodShort(m.key, lang)} <em>· {h.en}</em>
              </div>
              <div className="hint-phrases">
                {h.phrases.map((p, i) => (
                  <span key={i} className="phrase">«{p}»</span>
                ))}
              </div>
              <div className="hint-note">{h.note}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatsModal({ grades, told, lang = 'ru', onClose }) {
  const L = tr(lang)
  const collected = ALL.filter((s) => grades[s.id]).length
  const full = ALL.filter((s) => grades[s.id] === 3).length
  const toldStories = ALL.filter((s) => (told[s.id] || []).length).length
  const byMood = MOODS.map((m) => {
    const items = ALL.filter((s) => s.mood === m.key)
    return {
      m,
      total: items.length,
      c: items.filter((s) => grades[s.id]).length,
      f: items.filter((s) => grades[s.id] === 3).length,
    }
  })
  const byCard = data.cards.map((card) => {
    const items = ALL.filter((s) => s.card.slug === card.slug)
    return { card, total: items.length, c: items.filter((s) => grades[s.id]).length }
  })
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal stats-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label={L.close}>
          ✕
        </button>
        <h2 className="overlay-title">{L.stats_title}</h2>
        <div className="stat-tiles">
          <div className="stat-tile"><b>{collected}</b><span>{L.stats_collected(TOTAL)}</span></div>
          <div className="stat-tile"><b>{full}</b><span>{L.stats_full}</span></div>
          <div className="stat-tile"><b>{toldStories}</b><span>{L.stats_told}</span></div>
        </div>
        <div className="section-lbl">{L.stats_by_mood}</div>
        {byMood.map(({ m, total, c, f }) => (
          <div className="bar-row" key={m.key}>
            <span className="bar-lbl">{moodShort(m.key, lang)}</span>
            <span className="bar"><i className={m.cls} style={{ width: `${total ? (c / total) * 100 : 0}%` }} /></span>
            <span className="bar-num">{c}/{total}{f ? ` · ${f}✦` : ''}</span>
          </div>
        ))}
        <div className="section-lbl">{L.stats_by_card}</div>
        {byCard.map(({ card, total, c }) => (
          <div className="bar-row" key={card.slug}>
            <span className="bar-lbl">{cardName(card, lang)}</span>
            <span className="bar"><i style={{ width: `${total ? (c / total) * 100 : 0}%` }} /></span>
            <span className="bar-num">{c}/{total}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

