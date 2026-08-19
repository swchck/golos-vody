// Grade indicator drawn like the in-game deck eye: closed → half-open → fully open.
export function Eye({ grade = 0 }) {
  const almond = 'M2 11 C7 4 17 4 22 11 C17 18 7 18 2 11 Z'
  return (
    <svg className={`eye g${grade}`} viewBox="0 0 24 22" width="24" height="22" aria-hidden>
      {grade === 0 && (
        <>
          <path d={almond} className="lid dash" />
          <line x1="4" y1="18" x2="20" y2="4" className="slash" />
        </>
      )}
      {grade === 1 && (
        <>
          <path d="M3 12 C8 16 16 16 21 12" className="lid" />
          <line x1="6" y1="15" x2="5" y2="17.5" className="lash" />
          <line x1="12" y1="16" x2="12" y2="18.5" className="lash" />
          <line x1="18" y1="15" x2="19" y2="17.5" className="lash" />
        </>
      )}
      {grade === 2 && (
        <>
          <path d={almond} className="lid" />
          <clipPath id="halfclip">
            <rect x="0" y="11" width="24" height="11" />
          </clipPath>
          <circle cx="12" cy="11" r="4.2" className="iris" clipPath="url(#halfclip)" />
        </>
      )}
      {grade === 3 && (
        <>
          <path d={almond} className="lid" />
          <circle cx="12" cy="11" r="4.4" className="iris" />
          <circle cx="12" cy="11" r="1.8" className="pupil" />
        </>
      )}
    </svg>
  )
}
