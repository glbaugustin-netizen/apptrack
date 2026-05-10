import { formatISO, isSameDay, isBeforeDay } from "@/lib/utils/date";

const DAY_NAMES = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

interface DayStat {
  date: Date;
  completed: number;
  total: number;
}

interface WeekStripProps {
  weekDates: Date[];      // 7 dates Mon→Sun
  dayStats: DayStat[];    // one per date
  today: Date;
  weekRange: string;      // e.g. "5 – 11 mai"
}

type DayType = "done" | "partial" | "empty" | "future";

function getDayType(stat: DayStat, today: Date): DayType {
  if (isBeforeDay(today, stat.date)) return "future";
  if (stat.completed === 0) return "empty";
  if (stat.completed === stat.total) return "done";
  return "partial";
}

export function WeekStrip({ weekDates, dayStats, today, weekRange }: WeekStripProps) {
  return (
    <div
      style={{
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-md)",
        padding: "12px 14px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 11,
            color: "var(--color-text-secondary)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Semaine en cours
        </span>
        <span style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>
          {weekRange}
        </span>
      </div>

      {/* Jours */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 4 }}>
        {weekDates.map((date, i) => {
          const stat = dayStats[i];
          const type = getDayType(stat, today);
          const isToday = isSameDay(date, today);

          // Dot styles
          const dotStyle: React.CSSProperties = {
            width: 26,
            height: 26,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 500,
          };

          if (type === "done") {
            dotStyle.background = "#7F77DD";
            dotStyle.color = "#fff";
          } else if (type === "partial") {
            dotStyle.background = "#EEEDFE";
            dotStyle.color = "#534AB7";
            dotStyle.border = "0.5px solid #AFA9EC";
          } else {
            // empty or future
            dotStyle.background = "var(--color-background-secondary)";
            dotStyle.color = "var(--color-text-tertiary)";
            dotStyle.border = "0.5px solid var(--color-border-tertiary)";
          }

          if (isToday) {
            dotStyle.outline = "2px solid #7F77DD";
            dotStyle.outlineOffset = "1px";
          }

          const countLabel =
            type === "future"
              ? "—"
              : type === "empty"
              ? "0/" + stat.total
              : `${stat.completed}/${stat.total}`;

          return (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                flex: 1,
              }}
            >
              <span style={{ fontSize: 10, color: "var(--color-text-secondary)" }}>
                {DAY_NAMES[i]}
              </span>
              <div style={dotStyle}>
                {type === "done" ? (
                  <i className="ti ti-check" style={{ fontSize: 11 }} />
                ) : type === "future" ? (
                  "—"
                ) : (
                  stat.completed
                )}
              </div>
              <span
                style={{
                  fontSize: 10,
                  color: isToday ? "#7F77DD" : "var(--color-text-secondary)",
                  fontWeight: isToday ? 500 : 400,
                }}
              >
                {isToday ? "Auj." : countLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
