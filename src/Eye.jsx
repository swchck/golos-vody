const BASE = import.meta.env.BASE_URL

// Grade indicator using the game's own deck-eye sprite: closed (I) → open (II)
// → radiant (III). Grade 0 (not collected) reuses the closed frame, dimmed.
// The sprite is applied as a CSS mask so it takes currentColor and theme-adapts.
export function Eye({ grade = 0 }) {
  const g = Math.max(0, Math.min(3, grade))
  const frame = g === 0 ? 1 : g
  return (
    <span
      className={`eye g${g}`}
      aria-hidden
      style={{ '--eye-src': `url(${BASE}ui/eye-${frame}.webp)` }}
    />
  )
}
