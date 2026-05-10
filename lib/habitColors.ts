export interface HabitColor {
  hex: string;
  pastel: string;
  iconColor: string;  // -600 level, used on icon and active text
  textColor: string;  // -800 level, used on streak text
}

export const HABIT_COLORS: HabitColor[] = [
  { hex: "#7F77DD", pastel: "#EEEDFE", iconColor: "#534AB7", textColor: "#3C3489" },
  { hex: "#378ADD", pastel: "#E6F1FB", iconColor: "#185FA5", textColor: "#0C447C" },
  { hex: "#1D9E75", pastel: "#E1F5EE", iconColor: "#0F6E56", textColor: "#085041" },
  { hex: "#639922", pastel: "#EAF3DE", iconColor: "#3B6D11", textColor: "#27500A" },
  { hex: "#EF9F27", pastel: "#FAEEDA", iconColor: "#854F0B", textColor: "#633806" },
  { hex: "#D85A30", pastel: "#FAECE7", iconColor: "#993C1D", textColor: "#712B13" },
  { hex: "#D4537E", pastel: "#FBEAF0", iconColor: "#993556", textColor: "#72243E" },
  { hex: "#888780", pastel: "#F1EFE8", iconColor: "#5F5E5A", textColor: "#444441" },
];

export const HABIT_ICONS = [
  "ti-run",
  "ti-book",
  "ti-droplet",
  "ti-brain",
  "ti-pencil",
  "ti-moon",
  "ti-heart",
  "ti-music",
  "ti-apple",
  "ti-dumbbell",
  "ti-bed",
  "ti-code",
  "ti-bike",
  "ti-leaf",
  "ti-camera",
  "ti-star",
] as const;

export type HabitIconName = (typeof HABIT_ICONS)[number];

export function getColorInfo(hex: string): HabitColor {
  return HABIT_COLORS.find((c) => c.hex === hex) ?? HABIT_COLORS[0];
}
