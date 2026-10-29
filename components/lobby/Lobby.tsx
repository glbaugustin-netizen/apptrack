"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MODULES } from "@/lib/modules";
import { useAuthStore } from "@/lib/store/auth.store";
import { LobbyCharacter } from "./LobbyCharacter";

/** Petites particules qui montent derrière le personnage (positions fixes pour éviter les écarts serveur/client). */
const PARTICLES = [
  { left: 18, delay: 0, duration: 9, size: 2 },
  { left: 27, delay: 3.5, duration: 11, size: 3 },
  { left: 36, delay: 6, duration: 8, size: 2 },
  { left: 44, delay: 1.5, duration: 12, size: 2 },
  { left: 57, delay: 4.5, duration: 10, size: 3 },
  { left: 64, delay: 7.5, duration: 9, size: 2 },
  { left: 73, delay: 2.5, duration: 11, size: 2 },
  { left: 82, delay: 5.5, duration: 10, size: 3 },
];

export function Lobby() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const playerName = user?.displayName?.trim().split(/\s+/)[0] || "Joueur";

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <div className="lobby">
      <div className="lobby-backdrop" aria-hidden="true">
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="lobby-particle"
            style={{ left: `${p.left}%`, width: p.size, height: p.size, animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s` }}
          />
        ))}
      </div>

      <header className="lobby-header">
        <nav className="lobby-nav" aria-label="Pages">
          {MODULES.map((m) => (
            <Link key={m.id} href={m.path} className="lobby-tab" style={{ "--neon": m.neon } as React.CSSProperties}>
              <i className={`ti ${m.icon}`} />
              <span>{m.label}</span>
            </Link>
          ))}
        </nav>
        <button className="lobby-logout" onClick={handleLogout} title="Déconnexion" aria-label="Déconnexion">
          <i className="ti ti-logout" />
        </button>
      </header>

      <main className="lobby-stage">
        <LobbyCharacter />
        <div className="lobby-nameplate">
          <span className="lobby-name">{playerName}</span>
        </div>
      </main>
    </div>
  );
}
