"use client";

import { useCalendarStore } from "@/lib/store/calendar.store";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { WeekView } from "@/components/calendar/WeekView";
import { DayView } from "@/components/calendar/DayView";
import { EventModal } from "@/components/calendar/EventModal";

export default function CalendarPage() {
  const { activeView } = useCalendarStore();

  return (
    <>
      {activeView === "month" && <MonthGrid />}
      {activeView === "week" && <WeekView />}
      {activeView === "day" && <DayView />}
      <EventModal />
    </>
  );
}
