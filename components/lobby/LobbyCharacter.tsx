/** Personnage du lobby : silhouette encapuchonnée au trait néon, posée sur un socle lumineux. */
export function LobbyCharacter() {
  return (
    <div className="lobby-character">
      <div className="lobby-figure">
        <svg viewBox="0 0 200 330" width="100%" height="100%" aria-hidden="true">
          <defs>
            <linearGradient id="lobby-edge" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#B26BFF" />
              <stop offset="1" stopColor="#3BC8FF" />
            </linearGradient>
            <linearGradient id="lobby-cloth" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#1A1530" />
              <stop offset="1" stopColor="#07080D" />
            </linearGradient>
          </defs>

          {/* Cape */}
          <path
            d="M76 112 C56 120 42 136 38 160 L26 300 C60 314 140 314 174 300 L162 160 C158 136 144 120 124 112 Z"
            fill="url(#lobby-cloth)" stroke="url(#lobby-edge)" strokeWidth={2} strokeLinejoin="round"
          />
          {/* Bras, ceinture, couture */}
          <g fill="none" stroke="url(#lobby-edge)" strokeWidth={1.2} strokeLinecap="round" opacity={0.55}>
            <path d="M60 148 C52 196 50 238 56 274" />
            <path d="M140 148 C148 196 150 238 144 274" />
            <path d="M46 222 Q100 236 154 222" />
            <path d="M100 196 L100 306" />
          </g>
          {/* Emblème */}
          <path d="M100 152 L112 166 L100 180 L88 166 Z" fill="#06070A" stroke="#FFD21F" strokeWidth={1.6} />
          <circle className="lobby-emblem" cx={100} cy={166} r={3.5} fill="#FFD21F" />

          {/* Capuche */}
          <path
            d="M100 26 C70 26 58 50 58 78 C58 98 66 112 76 120 L124 120 C134 112 142 98 142 78 C142 50 130 26 100 26 Z"
            fill="url(#lobby-cloth)" stroke="url(#lobby-edge)" strokeWidth={2}
          />
          {/* Visage dans l'ombre et visière */}
          <path d="M100 48 C84 48 75 62 75 80 C75 97 86 110 100 110 C114 110 125 97 125 80 C125 62 116 48 100 48 Z" fill="#020305" />
          <path className="lobby-visor" d="M83 81 Q100 89 117 81" fill="none" stroke="#3BC8FF" strokeWidth={3.2} strokeLinecap="round" />
        </svg>
      </div>

      {/* Socle : anneaux lumineux vus en perspective */}
      <div className="lobby-pedestal" aria-hidden="true">
        <div className="lobby-ring lobby-ring-outer" />
        <div className="lobby-ring lobby-ring-inner" />
        <div className="lobby-ring-glow" />
      </div>
    </div>
  );
}
