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
    <div className="overflow-hidden rounded-2xl border border-emerald-200/60 bg-white shadow-lg shadow-emerald-900/5 ring-1 ring-emerald-100/80">
      <div className="border-b border-emerald-100/80 bg-gradient-to-r from-emerald-50/90 via-white to-teal-50/50 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={prevMonth}
            className="rounded-lg p-2 text-emerald-800 transition hover:bg-white/90 hover:text-emerald-950 hover:shadow-sm"
            aria-label="Previous month"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="font-brand text-base font-semibold tracking-tight text-emerald-950 sm:text-lg">
            {monthLabel}
          </span>
          <button
            type="button"
            onClick={nextMonth}
            className="rounded-lg p-2 text-emerald-800 transition hover:bg-white/90 hover:text-emerald-950 hover:shadow-sm"
            aria-label="Next month"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      <div className="p-3 sm:p-4">
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {WEEKDAYS.map((w) => (
            <div key={w} className="py-2">
              {w}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            if (!cell.dateStr) {
              return <div key={`e-${i}`} className="aspect-square min-h-[2.25rem]" />;
            }
            const { dateStr } = cell;
            const isPast = dateStr < todayStr;
            const beyondHorizon = dateStr > horizonEnd;
            const isOpen = dayIsOpen(dateStr);
            const inRange =
              startDate && endDate && dateStr >= startDate && dateStr <= endDate;
            const onlyStartSelected = Boolean(startDate && !endDate && dateStr === startDate);
            const isStart = dateStr === startDate;
            const isEnd = dateStr === endDate;
            const isToday = dateStr === todayStr;

            let cellClass =
              'aspect-square min-h-[2.25rem] flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-150 ';
            if (isPast || beyondHorizon) {
              cellClass += 'cursor-not-allowed text-slate-300';
            } else if (!isOpen) {
              cellClass +=
                'cursor-not-allowed bg-slate-100 text-slate-400 line-through decoration-slate-400/60';
            } else if (inRange || onlyStartSelected) {
              if (startDate && endDate && inRange && !isStart && !isEnd) {
                cellClass +=
                  'bg-emerald-500/90 text-white shadow-inner ring-1 ring-emerald-600/30 hover:bg-emerald-500';
              } else {
                cellClass +=
                  'bg-emerald-600 text-white shadow-md shadow-emerald-700/25 ring-2 ring-emerald-500/40 hover:bg-emerald-700';
              }
            } else {
              cellClass +=
                'cursor-pointer bg-white text-slate-800 shadow-sm ring-1 ring-emerald-100/90 hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-md hover:ring-emerald-200';
            }
            if (isToday && !inRange && !onlyStartSelected && isOpen && !isPast && !beyondHorizon) {
              cellClass += ' ring-2 ring-amber-400/80 ring-offset-2 ring-offset-white';
            }
            if ((isStart || isEnd) && startDate && endDate) {
              cellClass += ' z-[1] scale-[1.02]';
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
        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-emerald-50 pt-3 text-[11px] text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-md bg-white shadow-sm ring-1 ring-emerald-200" />{' '}
            Open
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-md bg-slate-100 ring-1 ring-slate-200/80" /> Booked
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-md bg-emerald-600 shadow-sm ring-1 ring-emerald-700/30" />{' '}
            Selected
          </span>
          <span className="text-slate-500">· Tap start, then end</span>
        </div>
      </div>
    </div>
  );
}
