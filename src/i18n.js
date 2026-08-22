// Interface localization. Story titles/text come from the game data; this file
// covers only the app's own chrome. The mood *keys* stay Russian because they're
// also the join keys against the story data — only their labels are localized.

export const STR = {
  ru: {
    tagline: 'альманах кочующих историй · сбор по картам Таро',
    menu: 'Меню',
    close: 'Закрыть',

    view_wheel: 'Колесо',
    view_all: 'Все истории',
    view_camp: 'Костёр',

    theme_night: '☾ Ночь',
    theme_day: '☀ День',
    theme_night_full: '☾ Ночная тема',
    theme_day_full: '☀ Дневная тема',
    theme_to_night: 'Ночная тема',
    theme_to_day: 'Дневная тема',

    howto: 'Как играть',
    howto_title: 'Как играть: механики игры',
    hint: 'Подсказка',
    hint_title: 'Какое настроение просит персонаж',
    hint_menu: 'Подсказка настроений',
    collected: 'собрано',
    collected_title: 'Открыть статистику прогресса',
    stats_menu: 'Статистика',
    export: 'Экспорт',
    export_title: 'Выгрузить прогресс в JSON',
    export_menu: 'Экспорт прогресса',
    import: 'Импорт',
    import_title: 'Загрузить прогресс из JSON',
    import_menu: 'Импорт прогресса',
    lang_label: 'Язык интерфейса',
    lang_aria: 'Язык интерфейса',

    type_group: 'Тип истории',
    filter_all: 'Все',
    filter_any: 'Любое',
    filter_all_wheel: 'все настроения',
    filter_all_camp: 'любое настроение',
    search_ph: 'искать по названию или тексту истории…',

    wheel_hint: 'наведи и кликни карту',
    char_story: 'История персонажа',
    empty: 'пусто',
    empty_filtered: 'Под фильтры ничего не попало.',
    empty_card:
      'Для этой карты в выбранном настроении историй нет. Поверни колесо — карты с историями отмечены красным.',
    nothing_found: 'Ничего не найдено под эти фильтры.',

    grade_story_aria: 'грейд истории',
    grade_mark: 'Отметить как собранную',
    grade_up_suffix: ' — клик, чтобы поднять грейд',
    full: 'полная',
    full_title: 'полная — собраны все 3 грейда',
    told_title: 'рассказано',

    // AllView filters
    of_flat: (n, total) => `${n} из ${total}`,
    own_all: 'Все',
    own_have: 'В котомке',
    own_missing: 'Не собраны',
    own_partial: 'Не полные',
    own_untold: 'Не рассказаны',
    own_variants: 'Разные карты',
    own_wildcards: 'Джокеры',
    sort_label: 'сортировка',
    sort_card: 'по карте',
    sort_grade: 'по грейду',
    sort_told: 'по адресатам',
    sort_az: 'А→Я',
    card_label: 'карта',
    card_all: 'все',
    n_stories: (n) => `${n} историй`,

    joker: 'джокер',
    joker_no_grades: 'джокер — без грейдов',
    joker_sub: 'история персонажа · подходит под любое настроение',
    joker_badge_full: 'джокер · любое настроение',

    loading_game: 'Загружаю истории из игры…',
    load_game_fail: 'Не удалось загрузить истории игры.',

    // StoryModal
    sec_evo: 'Эволюция · 3 грейда',
    not_in_bag: 'нет в котомке',
    sec_variants: 'Разные карты',
    variants_hint: '· отметь, какой вариант выпал у тебя — история встанет под эту карту',
    variant_take: 'у меня выпал этот вариант',
    variant_untake: 'снять отметку',
    sec_original: 'Оригинал из игры',
    no_ru: 'рус. перевода нет — оригинал',
    only_original: 'только оригинал',
    sec_where: 'Где искать',
    sec_told: 'Кому рассказано',
    told_hint: '· персонаж не слушает историю дважды',
    tell_heard: 'услышана — клик, чтобы снять',
    tell_mark: 'отметить как услышанную',

    // CampView
    camp_with: 'Сижу у костра с',
    camp_where: 'где искать:',
    camp_theme: 'тема:',
    camp_text: 'текст:',
    camp_likes: 'любит:',
    camp_about: 'О персонаже',
    camp_pick_mood: 'выбрать это настроение',
    camp_matches: 'подходящих по настроению:',
    camp_cards_used: (n) => `карт занято: `,
    camp_of5: ' / 5',
    camp_new: 'Новый костёр',
    camp_empty: (who) =>
      `У тебя нет собранных историй, которых ${who} ещё не слышал(а). Собери ещё — или отметь грейды в каталоге.`,
    camp_card_locked: 'карта занята',
    tell_btn: 'Рассказал',
    tell_btn_locked: 'карта уже занята в этом раунде',
    tell_btn_do: 'отметить рассказанной этому персонажу',
    tell_need_deck: 'сначала добавь историю в колоду',
    deck_in: 'в колоде',
    deck_add: 'в колоду',
    deck_remove: 'убрать из колоды',
    deck_full: 'в колоде уже 3 — сначала убери одну',
    deck_build: 'Собрать колоду',
    deck_build_for: (name) => `✦ Собрать колоду под ${name}`,
    deck_build_hint: 'подобрать до 3 историй на карту под настроения персонажа, приберегая уже прокачанные (грейд III)',
    deck_clear: 'Очистить колоду',
    deck_hint: 'В колоде — до 3 историй на карту, как в игре. Рассказывать можно только истории из колоды.',
    deck_summary: (n, liked) => `в колоде ${n} · под настроения персонажа: ${liked}`,

    // CharacterModal
    ch_where: 'Где искать',
    ch_moods: 'Любимые настроения',
    ch_about: 'О персонаже',
    ch_life: (n, word) => `История жизни · ${n} ${word} из игры`,
    ch_level: (n, total) => `Уровень: ${n}/${total} глав раскрыто`,
    chapter_read: 'глава раскрыта — клик, чтобы снять',
    chapter_unread: 'отметить главу раскрытой',
    chapter: 'Глава',
    card_word: 'карта',

    // footer
    footer_wheel_1: 'стрелка идёт за курсором · ',
    footer_wheel_2: ' открывает истории · ',
    footer_wheel_3: ' целься, ',
    footer_wheel_4: ' открой · глаз у истории — ',
    footer_camp_1: 'выбери персонажа и что он просит · ',
    footer_camp_2: ' отметит историю и займёт карту на раунд · карту можно взять раз за 5 историй',
    footer_all_1: 'клик по истории — детали, грейды и где искать · ',
    footer_all_2: ' — грейд эволюции · ',
    footer_all_3: ' — кому уже рассказал · прогресс хранится в браузере',

    // StatsModal
    stats_title: 'Прогресс альманаха',
    stats_collected: (t) => `собрано из ${t}`,
    stats_full: 'полных · грейд III',
    stats_told: 'кому-то рассказано',
    stats_by_mood: 'По настроениям',
    stats_by_card: 'По картам',

    import_fail: 'Не получилось прочитать файл — нужен JSON, выгруженный этим приложением.',

    grades: ['грейд I', 'грейд II', 'грейд III'],
    kinds: { traveling: 'кочующая', chapter: 'история персонажа', folklore: 'фольклор', other: '' },
    where_default:
      'Ищи на карте домики с иконкой глаза. Большинство историй встречается случайно в фиксированном порядке сбора; часть привязана к конкретному городу или региону. Быстро поднимать грейды удобно в Джексонвилле (юго-восток, у Майами) — там два дома рядом.',
    story_word: (n) => {
      const a = n % 10
      const b = n % 100
      if (a === 1 && b !== 11) return 'история'
      if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return 'истории'
      return 'историй'
    },
  },

  en: {
    tagline: 'an almanac of traveling tales · collected by tarot cards',
    menu: 'Menu',
    close: 'Close',

    view_wheel: 'Wheel',
    view_all: 'All stories',
    view_camp: 'Campfire',

    theme_night: '☾ Night',
    theme_day: '☀ Day',
    theme_night_full: '☾ Night theme',
    theme_day_full: '☀ Day theme',
    theme_to_night: 'Night theme',
    theme_to_day: 'Day theme',

    howto: 'How to play',
    howto_title: 'How to play: game mechanics',
    hint: 'Hint',
    hint_title: 'Which mood a character is asking for',
    hint_menu: 'Mood hints',
    collected: 'collected',
    collected_title: 'Open progress stats',
    stats_menu: 'Stats',
    export: 'Export',
    export_title: 'Export progress to JSON',
    export_menu: 'Export progress',
    import: 'Import',
    import_title: 'Import progress from JSON',
    import_menu: 'Import progress',
    lang_label: 'Interface language',
    lang_aria: 'Interface language',

    type_group: 'Story type',
    filter_all: 'All',
    filter_any: 'Any',
    filter_all_wheel: 'all moods',
    filter_all_camp: 'any mood',
    search_ph: 'search titles or story text…',

    wheel_hint: 'point and click a card',
    char_story: "Character's story",
    empty: 'empty',
    empty_filtered: 'Nothing matched the filters.',
    empty_card:
      'No stories for this card in the chosen mood. Turn the wheel — cards with stories are marked red.',
    nothing_found: 'Nothing matched these filters.',

    grade_story_aria: 'story grade',
    grade_mark: 'Mark as collected',
    grade_up_suffix: ' — click to raise the grade',
    full: 'complete',
    full_title: 'complete — all 3 grades collected',
    told_title: 'told to',

    of_flat: (n, total) => `${n} of ${total}`,
    own_all: 'All',
    own_have: 'In the bag',
    own_missing: 'Not collected',
    own_partial: 'Incomplete',
    own_untold: 'Untold',
    own_variants: 'Split cards',
    own_wildcards: 'Wildcards',
    sort_label: 'sort',
    sort_card: 'by card',
    sort_grade: 'by grade',
    sort_told: 'by listeners',
    sort_az: 'A→Z',
    card_label: 'card',
    card_all: 'all',
    n_stories: (n) => `${n} stories`,

    joker: 'wildcard',
    joker_no_grades: 'wildcard — no grades',
    joker_sub: "character's story · fits any mood",
    joker_badge_full: 'wildcard · any mood',

    loading_game: 'Loading stories from the game…',
    load_game_fail: 'Failed to load the game stories.',

    sec_evo: 'Evolution · 3 grades',
    not_in_bag: 'not in the bag',
    sec_variants: 'Split cards',
    variants_hint: '· mark which variant you got — the story moves under that card',
    variant_take: 'I got this variant',
    variant_untake: 'clear the mark',
    sec_original: 'Original from the game',
    no_ru: 'no Russian translation — original',
    only_original: 'original only',
    sec_where: 'Where to find',
    sec_told: 'Told to',
    told_hint: "· a character won't hear a story twice",
    tell_heard: 'heard — click to unmark',
    tell_mark: 'mark as heard',

    camp_with: 'Sitting by the fire with',
    camp_where: 'where to find:',
    camp_theme: 'theme:',
    camp_text: 'writing:',
    camp_likes: 'likes:',
    camp_about: 'About',
    camp_pick_mood: 'pick this mood',
    camp_matches: 'matching the mood:',
    camp_cards_used: (n) => `cards used: `,
    camp_of5: ' / 5',
    camp_new: 'New fire',
    camp_empty: (who) =>
      `You have no collected stories that ${who} hasn't heard yet. Collect more — or mark grades in the catalogue.`,
    camp_card_locked: 'card used',
    tell_btn: 'Told it',
    tell_btn_locked: 'this card is already used this round',
    tell_btn_do: 'mark as told to this character',
    tell_need_deck: 'add the story to your deck first',
    deck_in: 'in deck',
    deck_add: 'to deck',
    deck_remove: 'remove from deck',
    deck_full: 'deck already has 3 — remove one first',
    deck_build: 'Build a deck',
    deck_build_for: (name) => `✦ Build a deck for ${name}`,
    deck_build_hint: "pick up to 3 stories per card matching this character's moods, saving already-maxed (grade III) ones",
    deck_clear: 'Clear deck',
    deck_hint: 'A deck holds up to 3 stories per card, like in the game. You can only tell stories from your deck.',
    deck_summary: (n, liked) => `${n} in deck · matching this character: ${liked}`,

    ch_where: 'Where to find',
    ch_moods: 'Favorite moods',
    ch_about: 'About',
    ch_life: (n, word) => `Life story · ${n} ${word} from the game`,
    ch_level: (n, total) => `Progress: ${n}/${total} chapters revealed`,
    chapter_read: 'chapter revealed — click to unmark',
    chapter_unread: 'mark chapter revealed',
    chapter: 'Chapter',
    card_word: 'card',

    footer_wheel_1: 'the arrow follows the cursor · ',
    footer_wheel_2: ' opens stories · ',
    footer_wheel_3: ' to aim, ',
    footer_wheel_4: ' to open · the eye on a story is its ',
    footer_camp_1: 'pick a character and what they ask for · ',
    footer_camp_2: ' marks the story and locks its card for the round · one card per 5 stories',
    footer_all_1: 'click a story for details, grades and where to find it · ',
    footer_all_2: ' — evolution grade · ',
    footer_all_3: ' — who you already told · progress is stored in your browser',

    stats_title: 'Almanac progress',
    stats_collected: (t) => `collected of ${t}`,
    stats_full: 'complete · grade III',
    stats_told: 'told to someone',
    stats_by_mood: 'By mood',
    stats_by_card: 'By card',

    import_fail: "Couldn't read the file — it must be JSON exported by this app.",

    grades: ['grade I', 'grade II', 'grade III'],
    kinds: { traveling: 'traveling', chapter: "character's story", folklore: 'folklore', other: '' },
    where_default:
      'Look for houses with an eye icon on the map. Most stories appear at random in a fixed collection order; some are tied to a specific city or region. Jacksonville (southeast, near Miami) is handy for grinding grades — two houses stand side by side.',
    story_word: (n) => (n === 1 ? 'story' : 'stories'),
  },
}

export const tr = (lang) => STR[lang] || STR.ru

// card name/meaning localization. English tarot name lives on card.en; the RU
// meaning lives on card.meaning — English meanings are mapped here by slug.
const CARD_MEANING_EN = {
  'two-of-coins': 'Joy',
  star: 'Faith, trust',
  justice: 'Choice, morality',
  tower: 'Death, change, endings',
  'queen-of-cups': 'Family',
  'high-priestess': 'The future',
  world: 'Paradise, wishes fulfilled',
  'three-of-staves': 'Journey, the road',
  'nine-of-swords': 'Sadness, sorrow',
  sun: 'The past, memory',
  emperor: 'Power, order',
  lovers: 'Love',
  devil: 'Bondage, captivity',
  fool: 'Freedom',
  empress: 'Home, homeland',
  wheel: 'Luck, fate',
}
export const cardName = (c, lang) => (lang === 'en' ? c.en : c.name) || c.name
export const cardAlt = (c, lang) => (lang === 'en' ? c.name : c.en)
export const cardMeaning = (c, lang) =>
  lang === 'en' ? CARD_MEANING_EN[c.slug] || c.meaning : c.meaning

// mood labels (short = filter chips, full = tag pills). keys stay Russian.
const MOOD_TR = {
  Страшные: { short: { ru: 'Страшные', en: 'Scary' }, full: { ru: 'Страшные', en: 'Scary' } },
  'Захватывающие приключения': {
    short: { ru: 'Приключения', en: 'Adventurous' },
    full: { ru: 'Захватывающие приключения', en: 'Thrilling adventures' },
  },
  Весёлые: { short: { ru: 'Весёлые', en: 'Funny' }, full: { ru: 'Весёлые', en: 'Funny' } },
  Грустные: { short: { ru: 'Грустные', en: 'Sad' }, full: { ru: 'Грустные', en: 'Sad' } },
  'Счастливые/Оптимистичные': {
    short: { ru: 'Светлые', en: 'Hopeful' },
    full: { ru: 'Счастливые/Оптимистичные', en: 'Hopeful / uplifting' },
  },
}
export const moodShort = (key, lang) => MOOD_TR[key]?.short[lang] || MOOD_TR[key]?.short.ru || key
export const moodFull = (key, lang) => MOOD_TR[key]?.full[lang] || MOOD_TR[key]?.full.ru || key

// how each mood is asked for in-game, per localization
export const MOOD_HINTS = {
  ru: {
    intro: 'Русская локализация формулирует просьбы иносказательно. Ориентируйся по фразе персонажа:',
    moods: {
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
    },
  },
  en: {
    intro: 'Characters ask for a mood in their own words. Match the request to a mood:',
    moods: {
      Весёлые: {
        en: 'humorous',
        phrases: ['tell me a joke', 'something funny', 'make me laugh'],
        note: 'Not every funny story is a joke: a rooster or a cow will amuse, a woman with a letter will not.',
      },
      'Захватывающие приключения': {
        en: 'thrilling / adventurous',
        phrases: ['a wild story', 'something to get the heart racing', 'a thrilling one'],
        note: 'The middle ground between funny and scary: a folk hero, a strange creature, an unusual event.',
      },
      'Счастливые/Оптимистичные': {
        en: 'hopeful',
        phrases: ['with a happy ending', 'a story that gives strength', 'something hopeful'],
        note: 'Escapism, peace, overcoming hardship. Guide example: the astronomer in the desert.',
      },
      Грустные: {
        en: 'tragic',
        phrases: ['a sad one', 'with a bad ending', 'a sorrowful story'],
        note: 'The mirror of hopeful: death, nihilism, a bitter note.',
      },
      Страшные: {
        en: 'scary',
        phrases: ['one that chills the blood', 'a creepy story', 'a scary one'],
        note: 'Killers, ghosts, monsters, the supernatural.',
      },
    },
  },
}
