'use client';

import { useMemo, useState } from 'react';

export interface AvailabilityRow {
  available_date: string;
  is_available: boolean;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Monday = 0 … Sunday = 6 (ISO week) */
function mondayIndex(jsDay: number) {
  return jsDay === 0 ? 6 : jsDay - 1;
}

interface AvailabilityCalendarProps {
  availability: AvailabilityRow[];
  startDate: string;
  endDate: string;
  onRangeChange: (start: string, end: string) => void;
  /** Open the grid on this month (e.g. next available day) */
  initialVisibleMonth?: string | null;
}

export function AvailabilityCalendar({
  availability,
  startDate,
  endDate,
  onRangeChange,
  initialVisibleMonth,
}: AvailabilityCalendarProps) {
  const todayStr = useMemo(() => toISODate(new Date()), []);
  const availableSet = useMemo(
    () => new Set(availability.filter((a) => a.is_available).map((a) => a.available_date)),
    [availability]
  );

  const [view, setView] = useState(() => {
    const today = toISODate(new Date());
    const base =
      (initialVisibleMonth && initialVisibleMonth >= today ? initialVisibleMonth : '') ||
      (startDate && startDate >= today ? startDate : '') ||
      today;
    const [y, m] = base.split('-').map(Number);
    return new Date(y, m - 1, 1);
  });

  const year = view.getFullYear();
  const month = view.getMonth();
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const lead = mondayIndex(first.getDay());
  const daysInMonth = last.getDate();

  const cells: { dateStr: string | null }[] = [];
  for (let i = 0; i < lead; i++) cells.push({ dateStr: null });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ dateStr: toISODate(new Date(year, month, d)) });
  }

  function prevMonth() {
    setView(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setView(new Date(year, month + 1, 1));
  }

  function handleDayClick(dateStr: string) {
    if (dateStr < todayStr) return;
    if (!availableSet.has(dateStr)) return;

    if (!startDate || (startDate && endDate)) {
      onRangeChange(dateStr, '');
      return;
    }
    if (dateStr < startDate) {
      onRangeChange(dateStr, startDate);
      return;
    }
    onRangeChange(startDate, dateStr);
  }

  const monthLabel = view.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={prevMonth}
          className="rounded-md p-1.5 text-gray-600 hover:bg-white hover:text-slate-800"
          aria-label="Previous month"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-slate-800">{monthLabel}</span>
        <button
          type="button"
          onClick={nextMonth}
          className="rounded-md p-1.5 text-gray-600 hover:bg-white hover:text-slate-800"
          aria-label="Next month"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium uppercase tracking-wide text-gray-500">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-0.5">
        {cells.map((cell, i) => {
          if (!cell.dateStr) {
            return <div key={`e-${i}`} className="aspect-square" />;
          }
          const { dateStr } = cell;
          const isPast = dateStr < todayStr;
          const isOpen = availableSet.has(dateStr);
          const inRange =
            startDate &&
            endDate &&
            dateStr >= startDate &&
            dateStr <= endDate;
          const onlyStartSelected = Boolean(startDate && !endDate && dateStr === startDate);
          const isStart = dateStr === startDate;
          const isEnd = dateStr === endDate;
          const isToday = dateStr === todayStr;

          let cellClass =
            'aspect-square flex items-center justify-center rounded-md text-xs font-medium transition ';
          if (isPast) {
            cellClass += 'cursor-not-allowed text-gray-300';
          } else if (!isOpen) {
            cellClass += 'cursor-not-allowed bg-gray-200/80 text-gray-400 line-through';
          } else if (inRange || onlyStartSelected) {
            cellClass += 'bg-teal-600 text-white ring-1 ring-teal-700';
          } else {
            cellClass += 'cursor-pointer bg-white text-slate-700 hover:bg-teal-50 hover:text-teal-900';
          }
          if (isToday && !inRange && !onlyStartSelected && isOpen && !isPast) {
            cellClass += ' ring-2 ring-teal-400 ring-offset-1';
          }
          if ((isStart || isEnd) && startDate && endDate) {
            cellClass += ' font-bold';
          }

          return (
            <button
              key={dateStr}
              type="button"
              disabled={isPast || !isOpen}
              onClick={() => handleDayClick(dateStr)}
              className={cellClass}
            >
              {Number(dateStr.slice(8, 10))}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-gray-500">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded bg-white ring-1 ring-gray-200" /> Open
        </span>
        <span className="mx-2">·</span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded bg-gray-200" /> Booked / blocked
        </span>
        <span className="mx-2">·</span>
        Tap a day to set start, then another to set end.
      </p>
    </div>
  );
}
