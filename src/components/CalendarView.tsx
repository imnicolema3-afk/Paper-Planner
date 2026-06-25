import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CheckSquare, FileText, DollarSign, CalendarDays } from 'lucide-react';
import { PlannerState, ThemeType } from '../types';
import { formatToISODate } from '../data/initialData';

interface CalendarViewProps {
  selectedDate: string; // YYYY-MM-DD
  state: PlannerState;
  onSelectDate: (date: string) => void;
  onNavigateToTodayTab: () => void;
  theme: ThemeType;
}

export default function CalendarView({ selectedDate, state, onSelectDate, onNavigateToTodayTab, theme }: CalendarViewProps) {
  // Local state to track which month the user is viewing in the calendar
  const initialDateParts = selectedDate.split('-').map(Number);
  const [currentYear, setCurrentYear] = useState(initialDateParts[0]);
  const [currentMonth, setCurrentMonth] = useState(initialDateParts[1] - 1); // 0-indexed

  // Month names
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Days of week header
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Total days in current month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Preceding weekday offset (0 for Sunday, 6 for Saturday)
  const getFirstDayOfMonthOffset = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const offset = getFirstDayOfMonthOffset(currentYear, currentMonth);

  // Go to previous month
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  // Go to next month
  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  // Jump calendar back to the actual active date's month
  const handleSyncWithActiveDate = () => {
    const activeParts = selectedDate.split('-').map(Number);
    setCurrentYear(activeParts[0]);
    setCurrentMonth(activeParts[1] - 1);
  };

  // Check if a day has items in state
  const getDayMetadata = (dayNum: number) => {
    const mStr = String(currentMonth + 1).padStart(2, '0');
    const dStr = String(dayNum).padStart(2, '0');
    const lookupDate = `${currentYear}-${mStr}-${dStr}`;

    const hasEvents = state.events.some(e => e.date === lookupDate);
    const tasks = state.tasks.filter(t => t.date === lookupDate);
    const hasTasks = tasks.length > 0;
    const completedAllTasks = hasTasks && tasks.every(t => t.completed);
    const hasJournal = state.journals.some(j => j.date === lookupDate && j.content.trim().length > 0);
    const hasExpenses = state.expenses.some(ex => ex.date === lookupDate);

    return { lookupDate, hasEvents, hasTasks, completedAllTasks, hasJournal, hasExpenses };
  };

  // Build grid items
  const gridCells = [];
  
  // Empty spaces for first week offset
  for (let i = 0; i < offset; i++) {
    gridCells.push(null);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    gridCells.push(day);
  }

  return (
    <div className="max-w-3xl mx-auto py-2 px-1 animate-fade-in" id="calendar-view-container">
      {/* Calendar Header with Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center border-b border-stone-200 dark:border-stone-800 pb-5 mb-6 gap-3">
        <div className="flex items-center gap-3">
          <CalendarDays className={`w-5.5 h-5.5 ${theme === 'natural-tones' ? 'text-natural-sage' : 'text-amber-800 dark:text-amber-500'}`} />
          <div>
            <h2 className="text-xl font-serif font-medium text-stone-800 dark:text-stone-100">
              {months[currentMonth]} {currentYear}
            </h2>
            <p className="text-[10px] font-mono text-stone-400 dark:text-stone-500 uppercase tracking-wider">
              Select any day to configure Today's logs
            </p>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={handleSyncWithActiveDate}
            className={`text-[11px] font-medium border px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              theme === 'natural-tones'
                ? 'border-natural-border bg-white text-natural-text hover:bg-natural-sage-light hover:text-natural-sage hover:border-natural-sage'
                : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-50'
            }`}
            title="Locate actively loaded planner date"
          >
            Locate Active
          </button>
          
          <div className={`flex border rounded-lg overflow-hidden ${theme === 'natural-tones' ? 'border-natural-border bg-white' : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900'}`}>
            <button
              onClick={handlePrevMonth}
              className={`p-1.5 transition-colors cursor-pointer ${theme === 'natural-tones' ? 'hover:bg-natural-sage-light text-natural-text' : 'hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'}`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className={`w-[1px] ${theme === 'natural-tones' ? 'bg-natural-border' : 'bg-stone-200 dark:bg-stone-800'}`}></div>
            <button
              onClick={handleNextMonth}
              className={`p-1.5 transition-colors cursor-pointer ${theme === 'natural-tones' ? 'hover:bg-natural-sage-light text-natural-text' : 'hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400'}`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Month Board */}
      <div className={`shadow-sm ${
        theme === 'natural-tones'
          ? 'bg-white border border-natural-border rounded-[24px] p-5'
          : 'bg-white dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-2xl p-5'
      }`}>
        {/* Days of Week Row */}
        <div className="grid grid-cols-7 text-center font-mono text-xs text-stone-400 dark:text-stone-500 font-medium pb-3 mb-3 border-b border-stone-100 dark:border-stone-900">

          {weekdays.map(day => (
            <div key={day} className="py-1">{day}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-y-3.5 gap-x-2 text-center" id="calendar-days-grid">
          {gridCells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="aspect-square opacity-0"></div>;
            }

            const {
              lookupDate,
              hasEvents,
              hasTasks,
              completedAllTasks,
              hasJournal,
              hasExpenses
            } = getDayMetadata(day);

            const isSelected = selectedDate === lookupDate;
            const isTodayDate = formatToISODate(new Date()) === lookupDate;

            const getCellClass = () => {
              if (isSelected) {
                if (theme === 'natural-tones') {
                  return 'bg-natural-sage/20 border-natural-sage text-natural-text font-bold scale-[1.03]';
                }
                return 'bg-amber-50/75 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60 text-amber-900 dark:text-amber-400 font-bold scale-[1.03]';
              }
              if (isTodayDate) {
                if (theme === 'natural-tones') {
                  return 'bg-natural-sage-light border-natural-border text-natural-sage font-semibold';
                }
                return 'bg-stone-50 dark:bg-stone-900 border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 font-semibold';
              }
              if (theme === 'natural-tones') {
                return 'bg-white border-natural-border hover:bg-natural-sage-light/50 hover:border-natural-sage text-natural-text';
              }
              return 'bg-white dark:bg-stone-950 border-stone-100 dark:border-stone-900/50 hover:bg-stone-50/50 dark:hover:bg-stone-900/50 hover:border-stone-200 dark:hover:border-stone-800 text-stone-700 dark:text-stone-300';
            };

            return (
              <button
                key={`day-${day}`}
                onClick={() => {
                  onSelectDate(lookupDate);
                  onNavigateToTodayTab();
                }}
                className={`aspect-square p-1.5 rounded-xl border flex flex-col justify-between items-center transition-all relative group cursor-pointer ${getCellClass()}`}
              >
                {/* Day number */}
                <span className="text-xs font-mono select-none">{day}</span>

                {/* Micro indicators under number */}
                <div className="flex gap-1 justify-center mt-1 w-full min-h-[6px]">
                  {hasEvents && (
                    <span className={`w-1 h-1 rounded-full ${theme === 'natural-tones' ? 'bg-natural-sage' : 'bg-amber-500 dark:bg-amber-400'}`} title="Has scheduled events"></span>
                  )}
                  {hasTasks && (
                    <span className={`w-1 h-1 rounded-full ${completedAllTasks ? 'bg-emerald-500' : 'bg-indigo-400'}`} title="Has tasks"></span>
                  )}
                  {hasJournal && (
                    <span className="w-1 h-1 rounded-full bg-rose-400" title="Has journal diary log"></span>
                  )}
                  {hasExpenses && (
                    <span className="w-1 h-1 rounded-full bg-emerald-600" title="Has logged expenses"></span>
                  )}
                </div>

                {/* Subtle outer indicator ring for hover focus */}
                {isTodayDate && !isSelected && (
                  <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 border border-white dark:border-stone-950 rounded-full ${
                    theme === 'natural-tones' ? 'bg-natural-sage' : 'bg-amber-600'
                  }`} title="Current calendar day"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend Desk */}
      <div className={`mt-6 p-4 rounded-xl border ${
        theme === 'natural-tones'
          ? 'bg-white border-natural-border text-natural-text rounded-[24px]'
          : 'bg-stone-50/50 dark:bg-stone-900/20 border border-stone-200/50 dark:border-stone-800/40'
      }`}>
        <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2.5">
          Planner Icons Guide
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-stone-600 dark:text-stone-400">
          <div className="flex items-center gap-1.5 font-mono">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${theme === 'natural-tones' ? 'bg-natural-sage' : 'bg-amber-500'}`}></span>
            <span>Events (e.g. Piano)</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></span>
            <span>Pending/Open Tasks</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
            <span>Completed Tasks</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"></span>
            <span>Journal Draft Log</span>
          </div>
        </div>
      </div>

    </div>
  );
}
