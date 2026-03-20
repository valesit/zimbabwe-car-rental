'use client';

import { useMemo, useState } from 'react';
import {
  buildBlockedSet,
  isDayOpen,
  type AvailabilityRow,
} from '@/lib/availability';

export type { AvailabilityRow };

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
  /** Last bookable calendar day (inclusive), e.g. today + 400 */
  horizonEnd: string;
  startDate: string;
  endDate: string;
  onRangeChange: (start: string, end: string) => void;
  initialVisibleMonth?: string | null;
}

export function AvailabilityCalendar({
  availability,
  horizonEnd,
  startDate,
  endDate,
  onRangeChange,
  initialVisibleMonth,
}: AvailabilityCalendarProps) {
  const todayStr = useMemo(() => toISODate(new Date()), []);
  const blockedSet = useMemo(() => buildBlockedSet(availability), [availability]);

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

  function dayIsOpen(dateStr: string) {
    return isDayOpen(dateStr, todayStr, horizonEnd, blockedSet);
  }

  function handleDayClick(dateStr: string) {
    if (!dayIsOpen(dateStr)) return;

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
    <div className="rounded-xl border border-emerald-100 bg-gradient-to-b from-emerald-50/40 to-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={prevMonth}
          className="rounded-md p-1.5 text-emerald-800/70 hover:bg-emerald-100/80 hover:text-emerald-900"
          aria-label="Previous month"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-emerald-900">{monthLabel}</span>
        <button
          type="button"
          onClick={nextMonth}
          className="rounded-md p-1.5 text-emerald-800/70 hover:bg-emerald-100/80 hover:text-emerald-900"
          aria-label="Next month"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium uppercase tracking-wide text-emerald-800/60">
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
          const beyondHorizon = dateStr > horizonEnd;
          const isOpen = dayIsOpen(dateStr);
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
          if (isPast || beyondHorizon) {
            cellClass += 'cursor-not-allowed text-gray-300';
          } else if (!isOpen) {
            cellClass += 'cursor-not-allowed bg-gray-200/90 text-gray-500 line-through';
          } else if (inRange || onlyStartSelected) {
            cellClass += 'bg-emerald-600 text-white ring-1 ring-emerald-700 shadow-sm';
          } else {
            cellClass +=
              'cursor-pointer bg-white text-slate-700 ring-1 ring-emerald-100 hover:bg-emerald-50 hover:text-emerald-900';
          }
          if (isToday && !inRange && !onlyStartSelected && isOpen && !isPast && !beyondHorizon) {
            cellClass += ' ring-2 ring-emerald-400 ring-offset-1';
          }
          if ((isStart || isEnd) && startDate && endDate) {
            cellClass += ' font-bold';
          }

          return (
            <button
              key={dateStr}
              type="button"
              disabled={isPast || beyondHorizon || !isOpen}
              onClick={() => handleDayClick(dateStr)}
              className={cellClass}
            >
              {Number(dateStr.slice(8, 10))}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-emerald-900/70">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded bg-emerald-100 ring-1 ring-emerald-300" /> Open
        </span>
        <span className="mx-2">·</span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded bg-gray-200" /> Booked / blocked
        </span>
        <span className="mx-2">·</span>
        Tap start day, then end day.
      </p>
    </div>
  );
}
