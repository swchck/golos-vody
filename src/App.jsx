import { useMemo, useRef, useState, useEffect, useCallback } from 'react'
import data from './data.json'
import { Eye } from './Eye.jsx'

// base path so /icons and /chars resolve under a GitHub Pages sub-path too
const BASE = import.meta.env.BASE_URL

const MOODS = [
  { key: 'Страшные', short: 'Страшные', cls: 'm-scary' },
  { key: 'Захватывающие приключения', short: 'Приключения', cls: 'm-adv' },
  { key: 'Весёлые', short: 'Весёлые', cls: 'm-fun' },
  { key: 'Грустные', short: 'Грустные', cls: 'm-sad' },
  { key: 'Счастливые/Оптимистичные', short: 'Светлые', cls: 'm-hope' },
]
const moodCls = (k) => MOODS.find((m) => m.key === k)?.cls || 'm-fun'
const GRADE_LABEL = ['грейд I', 'грейд II', 'грейд III']
const WHERE =
  'Ищи на карте домики с иконкой глаза. Большинство историй встречается случайно в фиксированном порядке сбора; часть привязана к конкретному городу или региону. Быстро поднимать грейды удобно в Джексонвилле (юго-восток, у Майами) — там два дома рядом.'

// как персонажи (особенно в русской локализации) просят каждое настроение
const MOOD_HINTS = {
  Весёлые: {
    en: 'humorous',
    phrases: ['расскажи шутку', 'что-нибудь смешное', 'рассмеши меня'],
    note: 'Не каждая весёлая история — шутка: петух или корова насмешат, а женщина с письмом — нет.',
  },
  'Захватывающие приключения': {
    en: 'thrilling / adventurous',
    phrases: ['дикая история', 'чтоб сердце колотилось', 'захватывающая'],
    note: 'Золотая середина между смешным и страшным: фолк-герой, странное существо, необычное событие.',
  },
  'Счастливые/Оптимистичные': {
    en: 'hopeful',
    phrases: ['с хорошим концом', 'история, которая дарит силы', 'что-то обнадёживающее'],
    note: 'Эскапизм, покой, преодоление бед. Пример из гайда: астроном в пустыне.',
  },
  Грустные: {
    en: 'tragic',
    phrases: ['грустная', 'с плохим концом', 'печальная'],
    note: 'Зеркало оптимистичных: смерть, нигилизм, горькая нота.',
  },
  Страшные: {
    en: 'scary',
    phrases: ['от которой кровь стынет в жилах', 'жуткая', 'страшная'],
    note: 'Убийцы, призраки, чудовища, сверхъестественное.',
  },
}

const RX = 43
const RY = 45
const NODE_ANGLES = (() => {
  const right = Array.from({ length: 8 }, (_, i) => 68 - i * (136 / 7))
  const left = Array.from({ length: 8 }, (_, i) => 248 - i * (136 / 7))
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
const GKEY = 'gv-grades-v1'
const TKEY = 'gv-told-v1'
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
  const [theme, setTheme] = useState(
    () =>
      localStorage.getItem('gv-theme') ||
      (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'night' : 'day'),
  )
  const [grades, setGrades] = useState(() => loadLS(GKEY))
  const [told, setTold] = useState(() => loadLS(TKEY))
  const stageRef = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => localStorage.setItem('gv-theme', theme), [theme])
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
    return true
  }

  // ---- wheel view data ----
  const card = data.cards[active]
  const wheelStories = useMemo(
    () => (card.stories[mood] || []).filter((s) => matchQ(s) && matchOwned(s)),
    [card, mood, q, owned, grades, told],
  )
  const hasMood = useCallback((c) => (c.stories[mood] || []).length > 0, [mood])

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
      [JSON.stringify({ app: 'golos-vody', version: 1, grades, told }, null, 2)],
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
      } catch {
        alert('Не получилось прочитать файл — нужен JSON, выгруженный этим приложением.')
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
          <div className="sub">альманах кочующих историй · сбор по картам Таро</div>
        </div>

        <button
          className="hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Меню"
          aria-expanded={menuOpen}
        >
          <span /><span /><span />
        </button>

        <div className="controls">
          <div className="toprow">
            <div className="views">
              <button className={view === 'wheel' ? 'on' : ''} onClick={() => setView('wheel')}>
                Колесо
              </button>
              <button className={view === 'all' ? 'on' : ''} onClick={() => setView('all')}>
                Все истории
              </button>
              <button className={view === 'camp' ? 'on' : ''} onClick={() => setView('camp')}>
                Костёр
              </button>
            </div>
            <div className="collbox">
              <button
                className="ghost theme-btn"
                onClick={() => setTheme((t) => (t === 'day' ? 'night' : 'day'))}
                title={theme === 'day' ? 'Ночная тема' : 'Дневная тема'}
              >
                {theme === 'day' ? '☾ Ночь' : '☀ День'}
              </button>
              <button className="ghost" onClick={() => setOverlay('guide')} title="Как играть: механики игры">
                Как играть
              </button>
              <button className="ghost" onClick={() => setOverlay('hint')} title="Какое настроение просит персонаж">
                Подсказка
              </button>
              <button
                className="collcount"
                onClick={() => setOverlay('stats')}
                title="Открыть статистику прогресса"
              >
                собрано <b>{collected}</b> / {TOTAL}
              </button>
              <button className="ghost" onClick={exportJson} title="Выгрузить прогресс в JSON">
                Экспорт
              </button>
              <button className="ghost" onClick={() => fileRef.current?.click()} title="Загрузить прогресс из JSON">
                Импорт
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
            <div className="moods" role="group" aria-label="Тип истории">
              {view !== 'wheel' && (
                <button
                  className={`mood all ${allMoods ? 'on' : ''}`}
                  onClick={() => setAllMoods((v) => !v)}
                  title={view === 'camp' ? 'любое настроение' : 'все настроения'}
                >
                  {view === 'camp' ? 'Любое' : 'Все'}
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
                  {m.short}
                </button>
              ))}
            </div>
            <label className="search">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="искать по словам в истории…"
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
            {data.cards.map((c, i) => {
              const p = nodePos(NODE_ANGLES[i])
              return (
                <button
                  key={c.slug}
                  className={`node ${i === active ? 'active' : ''} ${i === aim ? 'aim' : ''} ${
                    hasMood(c) ? 'has' : 'empty'
                  }`}
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}
                  title={c.name}
                  aria-label={c.name}
                  onPointerEnter={() => setAim(i)}
                  onClick={() => openCard(i)}
                >
                  <img src={`${BASE}icons/${c.slug}.png`} alt="" draggable="false" />
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
              наведи и кликни карту
            </button>
          )}

          {reading && (
          <section className="reading" key={active + mood}>
            <button className="reading-close" onClick={() => setReading(false)} aria-label="Закрыть">
              ×
            </button>
            <div className="reading-card">
              <img className="bigcard" src={`${BASE}cards/${card.slug}.webp`} alt={card.name} />
            </div>
            <div className="reading-body">
              <div className="card-head">
                <span className="roman">{card.roman}</span>
                <h2>{card.name}</h2>
                <div className="en">{card.en}</div>
                <div className="teller">
                  <span className="lbl">История персонажа</span>
                  {card.character || '—'}
                </div>
              </div>
              <div className="list-head">
                <span className={`tag ${moodCls(mood)}`}>{mood}</span>
                <span className="count">
                  {wheelStories.length ? `${wheelStories.length} ${plural(wheelStories.length)}` : 'пусто'}
                </span>
              </div>
              <div className="stories">
                {wheelStories.length === 0 && (
                  <p className="empty-msg">
                    {q || owned !== 'all'
                      ? 'Под фильтры ничего не попало.'
                      : 'Для этой карты в выбранном настроении историй нет. Поверни колесо — карты с историями отмечены красным.'}
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
                  />
                ))}
              </div>
            </div>
          </section>
          )}
        </main>
      ) : view === 'all' ? (
        <AllView
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
        />
      ) : (
        <CampView
          allMoods={allMoods}
          mood={mood}
          setMood={setMood}
          setAllMoods={setAllMoods}
          matchQ={matchQ}
          grades={grades}
          told={told}
          toggleTold={toggleTold}
          onOpen={openStory}
        />
      )}

      {overlay === 'guide' && <GuideModal onClose={() => setOverlay(null)} onMoods={() => setOverlay('hint')} />}
      {overlay === 'hint' && <HintModal onClose={() => setOverlay(null)} />}
      {overlay === 'stats' && <StatsModal grades={grades} told={told} onClose={() => setOverlay(null)} />}

      {modal && (
        <StoryModal
          {...modal}
          grade={grades[modal.story.id] || 0}
          onSetGrade={(g) => setGrade(modal.story.id, g)}
          onCycle={() => cycle(modal.story.id)}
          told={told[modal.story.id] || []}
          onToggleTold={(i) => toggleTold(modal.story.id, i)}
          onClose={() => setModal(null)}
        />
      )}

      <footer className="hint">
        {view === 'wheel' ? (
          <>стрелка идёт за курсором · <b>клик</b> открывает истории · <b>← →</b> целься, <b>Enter</b> открой · глаз у истории — <b>грейд эволюции</b></>
        ) : view === 'camp' ? (
          <>выбери персонажа и что он просит · <b>«Рассказал»</b> отметит историю и займёт карту на раунд · карту можно взять раз за 5 историй</>
        ) : (
          <>клик по истории — детали, грейды и где искать · <b>глаз</b> — грейд эволюции · <b>аватары</b> — кому уже рассказал · прогресс хранится в браузере</>
        )}
      </footer>

      {menuOpen && (
        <div className="msheet-scrim" onClick={() => setMenuOpen(false)}>
          <div className="msheet" onClick={(e) => e.stopPropagation()}>
            <div className="msheet-grab" />
            <button onClick={() => { setTheme((t) => (t === 'day' ? 'night' : 'day')) }}>
              {theme === 'day' ? '☾ Ночная тема' : '☀ Дневная тема'}
            </button>
            <button onClick={() => { setOverlay('guide'); setMenuOpen(false) }}>Как играть</button>
            <button onClick={() => { setOverlay('hint'); setMenuOpen(false) }}>Подсказка настроений</button>
            <button onClick={() => { setOverlay('stats'); setMenuOpen(false) }}>
              Статистика · собрано {collected}/{TOTAL}
            </button>
            <button onClick={() => { exportJson(); setMenuOpen(false) }}>Экспорт прогресса</button>
            <button onClick={() => { fileRef.current?.click(); setMenuOpen(false) }}>Импорт прогресса</button>
          </div>
        </div>
      )}

      <nav className="tabbar">
        <button className={view === 'wheel' ? 'on' : ''} onClick={() => setView('wheel')}>
          <span className="tb-ico">✦</span>Колесо
        </button>
        <button className={view === 'all' ? 'on' : ''} onClick={() => setView('all')}>
          <span className="tb-ico">☰</span>Все истории
        </button>
        <button className={view === 'camp' ? 'on' : ''} onClick={() => setView('camp')}>
          <span className="tb-ico">✸</span>Костёр
        </button>
      </nav>
    </div>
  )
}

function AllView({ allMoods, mood, matchQ, matchOwned, owned, setOwned, sort, setSort, grades, cycle, told, onOpen }) {
  const CARD_ORDER = data.cards.map((c) => c.slug)
  const list = ALL.filter(
    (s) => (allMoods || s.mood === mood) && matchQ(s) && matchOwned(s),
  ).sort((a, b) => {
    if (sort === 'grade') return (grades[b.id] || 0) - (grades[a.id] || 0)
    if (sort === 'told') return (told[b.id] || []).length - (told[a.id] || []).length
    if (sort === 'az') return a.tellings[0].localeCompare(b.tellings[0], 'ru')
    return CARD_ORDER.indexOf(a.card.slug) - CARD_ORDER.indexOf(b.card.slug)
  })
  return (
    <main className="allview">
      <div className="allbar">
        <div className="ownfilter">
          {[
            ['all', 'Все'],
            ['have', 'В котомке'],
            ['missing', 'Не собраны'],
            ['partial', 'Не полные'],
            ['untold', 'Не рассказаны'],
          ].map(([k, l]) => (
            <button key={k} className={owned === k ? 'on' : ''} onClick={() => setOwned(k)}>
              {l}
            </button>
          ))}
        </div>
        <div className="allright">
          <label className="sortbox">
            сортировка
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="card">по карте</option>
              <option value="grade">по грейду</option>
              <option value="told">по адресатам</option>
              <option value="az">А→Я</option>
            </select>
          </label>
          <span className="allcount">{list.length} из {TOTAL}</span>
        </div>
      </div>
      <div className="allgrid">
        {list.length === 0 && <p className="empty-msg">Ничего не найдено под эти фильтры.</p>}
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
          />
        ))}
      </div>
    </main>
  )
}

function StoryRow({ story, card, mood, showMeta, grade, onCycle, told = [], onOpen }) {
  return (
    <article className={`story ${grade ? 'have' : ''}`}>
      <div className="story-row">
        <button
          className="eye-btn"
          onClick={(e) => {
            e.stopPropagation()
            onCycle()
          }}
          title={grade ? `${GRADE_LABEL[grade - 1]} — клик, чтобы поднять грейд` : 'Отметить как собранную'}
          aria-label="грейд истории"
        >
          <Eye grade={grade} />
        </button>
        <span className="story-icon">
          <img src={`${BASE}icons/${card.slug}.png`} alt="" />
        </span>
        <span className="story-main" onClick={onOpen}>
          <span className="story-title">{story.tellings[0]}</span>
          {showMeta && (
            <span className="story-meta">
              {card.name} · <span className={`dot ${moodCls(mood)}`} /> {MOODS.find((m) => m.key === mood)?.short}
            </span>
          )}
        </span>
        {told.length > 0 && (
          <span className="told-avatars" onClick={onOpen} title={`рассказано: ${told.length}`}>
            {[...told]
              .sort((a, b) => a - b)
              .slice(0, 5)
              .map((i) => (
                <img key={i} src={`${BASE}chars/${CHARACTERS[i].slug}.png`} alt={CHARACTERS[i].short} />
              ))}
            {told.length > 5 && <em>+{told.length - 5}</em>}
          </span>
        )}
        {grade === 3 ? (
          <span className="full-badge" onClick={onOpen} title="полная — собраны все 3 грейда">
            полная
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

function StoryModal({ story, card, mood, grade, onSetGrade, onCycle, told, onToggleTold, onClose }) {
  const t = story.tellings
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Закрыть">
          ✕
        </button>
        <div className="modal-hero">
          <img className="modal-card" src={`${BASE}cards/${card.slug}.webp`} alt={card.name} />
          <div className="modal-head">
            <span className="roman">{card.roman}</span>
            <div className={`tag ${moodCls(mood)}`}>{mood}</div>
            <h2>{story.tellings[0]}</h2>
            <div className="modal-sub">
              <span>{card.name}</span> · <span className="en">{card.en}</span>
            </div>
            <button className="grade-set" onClick={onCycle}>
              <Eye grade={grade} />
              <span>{grade ? GRADE_LABEL[grade - 1] : 'нет в котомке'}</span>
              <span className="grade-pips big">
                {[1, 2, 3].map((n) => (
                  <i key={n} className={n <= grade ? 'on' : ''} />
                ))}
              </span>
            </button>
          </div>
        </div>

        <div className="modal-section">
          <div className="section-lbl">Эволюция · 3 грейда</div>
          {t.map((x, j) => {
            const known = j < grade
            return (
              <div className={`telling ${known ? 'known' : 'unknown'}`} key={j}>
                <button
                  className="tmark"
                  onClick={() => onSetGrade(known && grade === j + 1 ? j : j + 1)}
                  title={known ? 'услышана — клик, чтобы снять' : 'отметить как услышанную'}
                >
                  <Eye grade={known ? 3 : 0} />
                </button>
                <span className="tier">{GRADE_LABEL[j] || '···'}</span>
                <span className="tell-text">{x}</span>
              </div>
            )
          })}
        </div>

        <div className="modal-section">
          <div className="section-lbl">Где искать</div>
          <p className="where-text">{story.location || WHERE}</p>
        </div>

        <div className="modal-section">
          <div className="section-lbl">
            Кому рассказано <span className="told-hint">· персонаж не слушает историю дважды</span>
          </div>
          <div className="chars">
            {CHARACTERS.map((ch, i) => (
              <button
                key={ch.slug}
                className={`char ${told.includes(i) ? 'on' : ''} ${ch.wolf ? 'wolf' : ''}`}
                onClick={() => onToggleTold(i)}
                title={ch.short}
              >
                <img src={`${BASE}chars/${ch.slug}.png`} alt="" />
                <span>{ch.short}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function CampView({ allMoods, mood, matchQ, grades, told, toggleTold, onOpen, setMood, setAllMoods }) {
  const [char, setChar] = useState(0)
  const [used, setUsed] = useState(() => new Set())
  const [infoOpen, setInfoOpen] = useState(false)
  const ch = CHARACTERS[char]

  const avail = ALL.filter(
    (s) => (grades[s.id] || 0) >= 1 && !(told[s.id] || []).includes(char) && matchQ(s),
  )
  const matchesN = allMoods ? 0 : avail.filter((s) => s.mood === mood).length
  const byCard = data.cards
    .map((c) => ({
      card: c,
      list: avail
        .filter((s) => s.card.slug === c.slug)
        .sort((a, b) => (allMoods ? 0 : (b.mood === mood) - (a.mood === mood))),
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
        <div className="camp-lbl">Сижу у костра с</div>
        <div className="camp-chars">
          {CHARACTERS.map((c, i) => (
            <button
              key={c.slug}
              className={`camp-char ${i === char ? 'on' : ''} ${c.wolf ? 'wolf' : ''}`}
              onClick={() => setChar(i)}
              title={c.short}
            >
              <img src={`${BASE}chars/${c.slug}.png`} alt="" />
              <span>{c.short}</span>
            </button>
          ))}
        </div>

        <div className="camp-info">
          <div className="camp-info-txt">
            <span className="camp-info-role">{ch.role}{ch.card ? ` · ${ch.card}` : ''}</span>
            <span className="camp-info-loc"><em>где искать:</em> {ch.location}</span>
            {ch.moods?.length > 0 && (
              <span className="camp-info-moods">
                <em>любит:</em>
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
                      title="выбрать это настроение"
                    >
                      {m.short}
                    </button>
                  )
                })}
              </span>
            )}
          </div>
          <button className="ghost" onClick={() => setInfoOpen(true)}>О персонаже</button>
        </div>

        <div className="camp-round">
          {!allMoods && (
            <span className="camp-match">
              подходящих по настроению: <b>{matchesN}</b>
            </span>
          )}
          <span>карт занято: <b>{used.size}</b> / 5</span>
          <button className="ghost" onClick={() => setUsed(new Set())}>
            Новый костёр
          </button>
        </div>
      </div>

      <div className="camp-body">
        {byCard.length === 0 && (
          <p className="empty-msg">
            У тебя нет собранных историй, которых {ch.short} ещё не слышал(а). Собери ещё — или отметь
            грейды в каталоге.
          </p>
        )}
        {byCard.map(({ card, list }) => {
          const cardUsed = used.has(card.slug)
          return (
            <section key={card.slug} className={`camp-card ${cardUsed ? 'used' : ''}`}>
              <div className="camp-card-head">
                <span className="camp-card-icon">
                  <img src={`${BASE}icons/${card.slug}.png`} alt="" />
                </span>
                <h3>{card.name}</h3>
                {cardUsed && <span className="used-tag">карта занята</span>}
                <span className="camp-card-count">{list.length}</span>
              </div>
              <div className="camp-stories">
                {list.map((s) => {
                  const g = grades[s.id] || 0
                  const matches = !allMoods && s.mood === mood
                  return (
                    <div key={s.id} className={`camp-story ${matches ? 'match' : ''}`}>
                      <span className={`dot ${moodCls(s.mood)}`} />
                      <span className="camp-story-title" onClick={() => onOpen(s, s.card, s.mood)}>
                        {s.tellings[Math.max(0, g - 1)]}
                      </span>
                      <span className="camp-story-mood">
                        {MOODS.find((m) => m.key === s.mood)?.short}
                      </span>
                      <button
                        className="tell-btn"
                        onClick={() => tell(s)}
                        disabled={cardUsed}
                        title={cardUsed ? 'карта уже занята в этом раунде' : 'отметить рассказанной этому персонажу'}
                      >
                        Рассказал
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>

      {infoOpen && <CharacterModal ch={ch} onClose={() => setInfoOpen(false)} />}
    </main>
  )
}

function CharacterModal({ ch, onClose }) {
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal char-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Закрыть">✕</button>
        <div className="modal-hero">
          <img className="char-portrait" src={`${BASE}chars/${ch.slug}.png`} alt={ch.short} />
          <div className="modal-head">
            <span className="roman">{ch.role}</span>
            <h2>{ch.short}</h2>
            {ch.card && (
              <div className="modal-sub">карта: <b>{ch.card}</b></div>
            )}
          </div>
        </div>
        <div className="modal-section">
          <div className="section-lbl">Где искать</div>
          <p className="where-text">{ch.location}</p>
        </div>
        {ch.moods?.length > 0 && (
          <div className="modal-section">
            <div className="section-lbl">Любимые настроения</div>
            <div className="char-moods">
              {ch.moods.map((mk) => {
                const m = MOODS.find((x) => x.key === mk)
                return <span key={mk} className={`tag ${m.cls}`}>{m.short}</span>
              })}
            </div>
          </div>
        )}
        <div className="modal-section">
          <div className="section-lbl">О персонаже</div>
          <p className="guide-p">{ch.bio}</p>
        </div>
      </div>
    </div>
  )
}

function GuideModal({ onClose, onMoods }) {
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal guide-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Закрыть">✕</button>
        <h2 className="overlay-title">Как играть</h2>
        <p className="overlay-intro">
          Where the Water Tastes Like Wine — про сбор и пересказ американских баек эпохи Великой
          депрессии. Ты бродишь по стране, собираешь истории и рассказываешь их случайным попутчикам
          у костра, чтобы раскрыть их судьбы.
        </p>

        <div className="guide-sec">
          <div className="section-lbl">Как получить истории</div>
          <p className="guide-p">
            Ищи на карте <b>домики с иконкой глаза</b> и исследуй города — запустится мини-игра
            встречи. Ещё историю жизни даёт <b>первая ночь у костра</b> с каждым персонажем.
          </p>
        </div>

        <div className="guide-sec">
          <div className="section-lbl">Карты и настроения</div>
          <p className="guide-p">
            Каждая история относится к одной из <b>16 карт Таро</b> (карта = тема: семья, свобода,
            рок…) и к одному из <b>5 настроений</b>: страшные, приключения, весёлые, грустные,
            светлые.
          </p>
        </div>

        <div className="guide-sec">
          <div className="section-lbl">Эволюция историй · 3 грейда</div>
          <p className="guide-p">
            Это неочевидно: после того как ты рассказал историю, она <b>обрастает слухами</b> и
            меняется. Услышь её снова в мире (тот самый домик с глазом) — и она эволюционирует:{' '}
            <b>грейд&nbsp;I → II → III</b>. Прогресс показывает иконка глаза:
          </p>
          <div className="guide-eyes">
            <span><Eye grade={1} /> закрытый — I</span>
            <span><Eye grade={2} /> приоткрытый — II</span>
            <span><Eye grade={3} /> открытый — III</span>
          </div>
          <p className="guide-p">
            В приложении это <b>глаз у каждой истории</b> — отмечай грейд кликом. Персонаж не станет
            слушать одну историю дважды <b>вне зависимости от грейда</b>.
          </p>
        </div>

        <div className="guide-sec">
          <div className="section-lbl">Одна история — разные карты</div>
          <p className="guide-p">
            Тоже неочевидно: в мини-игре встречи <b>часть вариантов выбора помечена картой Таро</b>.
            Твой выбор решает, под какую <b>карту и настроение</b> ляжет история (и как она будет
            называться). Поэтому у разных игроков одна встреча даёт разные карты — меняющиеся иконки
            при исследовании это и показывают.
          </p>
        </div>

        <div className="guide-sec">
          <div className="section-lbl">У костра</div>
          <p className="guide-p">
            Персонаж просит историю определённого <b>настроения</b> — угадай по его словам (жми{' '}
            <button className="inline-link" onClick={onMoods}>«Подсказка»</button>). Попал → персонаж
            «просыпается», открывается глава его жизни. За раунд можно рассказать <b>до 5 историй</b>,
            каждую <b>карту — только раз за раунд</b>. Истории персонажей — <b>вайлдкарты</b>: подходят
            под любое настроение и не имеют грейдов.
          </p>
        </div>

        <div className="guide-sec">
          <div className="section-lbl">Волк и смерть</div>
          <p className="guide-p">
            Смерти не бойся — она почти ни на что не влияет. После неё будет раунд с <b>Волком</b>:
            ему можно рассказать любые 5 историй (на прогресс не влияет), зато это <b>идеально для
            фарма грейдов</b>. Быстрый способ умереть — кататься зайцем на поездах.
          </p>
        </div>

        <div className="guide-sec">
          <div className="section-lbl">Что умеет это приложение</div>
          <p className="guide-p">
            <b>Колесо</b> — выбор истории как в игре · <b>Все истории</b> — каталог с фильтрами ·{' '}
            <b>Костёр</b> — что рассказать конкретному персонажу · <b>глаз</b> — грейд · <b>аватары</b>{' '}
            — кому уже рассказал · <b>Статистика</b> — прогресс. Всё хранится в браузере и выгружается
            в JSON.
          </p>
        </div>
      </div>
    </div>
  )
}

function HintModal({ onClose }) {
  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="modal hint-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Закрыть">
          ✕
        </button>
        <h2 className="overlay-title">Какое настроение просят?</h2>
        <p className="overlay-intro">
          Русская локализация формулирует просьбы иносказательно. Ориентируйся по фразе персонажа:
        </p>
        {MOODS.map((m) => {
          const h = MOOD_HINTS[m.key]
          return (
            <div className="hint-row" key={m.key}>
              <div className="hint-mood">
                <span className={`dot ${m.cls}`} /> {m.short} <em>· {h.en}</em>
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

function StatsModal({ grades, told, onClose }) {
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
        <button className="modal-close" onClick={onClose} aria-label="Закрыть">
          ✕
        </button>
        <h2 className="overlay-title">Прогресс альманаха</h2>
        <div className="stat-tiles">
          <div className="stat-tile"><b>{collected}</b><span>собрано из {TOTAL}</span></div>
          <div className="stat-tile"><b>{full}</b><span>полных · грейд III</span></div>
          <div className="stat-tile"><b>{toldStories}</b><span>кому-то рассказано</span></div>
        </div>
        <div className="section-lbl">По настроениям</div>
        {byMood.map(({ m, total, c, f }) => (
          <div className="bar-row" key={m.key}>
            <span className="bar-lbl">{m.short}</span>
            <span className="bar"><i className={m.cls} style={{ width: `${total ? (c / total) * 100 : 0}%` }} /></span>
            <span className="bar-num">{c}/{total}{f ? ` · ${f}✦` : ''}</span>
          </div>
        ))}
        <div className="section-lbl">По картам</div>
        {byCard.map(({ card, total, c }) => (
          <div className="bar-row" key={card.slug}>
            <span className="bar-lbl">{card.name}</span>
            <span className="bar"><i style={{ width: `${total ? (c / total) * 100 : 0}%` }} /></span>
            <span className="bar-num">{c}/{total}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function plural(n) {
  const a = n % 10
  const b = n % 100
  if (a === 1 && b !== 11) return 'история'
  if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return 'истории'
  return 'историй'
}
