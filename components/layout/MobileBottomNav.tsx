"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULES } from "@/lib/modules";

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="mobile-bottom-nav">
      {MODULES.map((module) => {
        const isActive = pathname.startsWith(module.path);
        return (
          <Link
            key={module.id}
            href={module.path}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              flex: 1,
              height: "100%",
              textDecoration: "none",
              color: isActive ? module.accent : "var(--color-text-tertiary)",
              transition: "color 0.15s",
            }}
          >
            <i className={`ti ${module.icon}`} style={{ fontSize: 22 }} />
            <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400 }}>
              {module.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
