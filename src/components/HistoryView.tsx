import React from 'react';
import { Calendar, Check, DollarSign, FileText, Sparkles, ChevronRight, BookOpen, PenTool } from 'lucide-react';
import { PlannerState, PlannerTask, PlannerExpense, ThemeType } from '../types';

interface HistoryViewProps {
  state: PlannerState;
  onSelectDate: (date: string) => void;
  onNavigateToTodayTab: () => void;
  theme: ThemeType;
}

export default function HistoryView({ state, onSelectDate, onNavigateToTodayTab, theme }: HistoryViewProps) {
  // 1. Gather all dates that have any data recorded
  const allRecordedDates = new Set<string>();
  
  state.events.forEach(e => allRecordedDates.add(e.date));
  state.tasks.forEach(t => allRecordedDates.add(t.date));
  state.reminders.forEach(r => allRecordedDates.add(r.date));
  state.journals.forEach(j => { if (j.content.trim().length > 0) allRecordedDates.add(j.date); });
  state.expenses.forEach(ex => allRecordedDates.add(ex.date));
  state.brainDumps.forEach(b => { if (b.content.trim().length > 0) allRecordedDates.add(b.date); });

  // 2. Sort dates in descending order (most recent first)
  const sortedDates = Array.from(allRecordedDates).sort((a, b) => b.localeCompare(a));

  // Helper to format date label
  const formatDateLabel = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
    const dayNum = dateObj.getDate();
    return { dayName, dateText: `${monthName} ${dayNum}, ${year}` };
  };

  const getTagBg = (tag: string) => {
    switch (tag) {
      case 'Tea': return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400';
      case 'Travel': return 'bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400';
      case 'College': return 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/30 dark:text-indigo-400';
      case 'Personal': return 'bg-rose-50 text-rose-800 dark:bg-rose-950/30 dark:text-rose-400';
      default: return 'bg-stone-50 text-stone-500';
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-2 px-1 animate-fade-in" id="history-view-timeline">
      {/* Header */}
      <div className="border-b border-stone-200 dark:border-stone-800 pb-5 mb-8">
        <div className="flex items-center gap-3">
          <BookOpen className={`w-5.5 h-5.5 ${theme === 'natural-tones' ? 'text-natural-sage' : 'text-amber-700 dark:text-amber-500'}`} />
          <div>
            <h2 className="text-xl font-serif font-medium text-stone-800 dark:text-stone-100">
              Timeline History
            </h2>
            <p className="text-[10px] font-mono text-stone-400 dark:text-stone-500 uppercase tracking-wider">
              Flip backward through your daily logs, thoughts, and spent records
            </p>
          </div>
        </div>
      </div>

      {sortedDates.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl">
          <PenTool className="w-8 h-8 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
          <h3 className="text-sm font-serif font-medium text-stone-600 dark:text-stone-400">
            No history recorded yet
          </h3>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 max-w-sm mx-auto">
            Once you log events, add tasks, draft journals, or record daily expenses, they will populate here chronologically.
          </p>
        </div>
      ) : (
        <div className={`relative border-l pl-4 sm:pl-6 ml-2 space-y-10 ${
          theme === 'natural-tones' ? 'border-natural-border' : 'border-stone-200 dark:border-stone-800'
        }`}>
          {sortedDates.map((dateStr) => {
            const { dayName, dateText } = formatDateLabel(dateStr);
            
            // Filter data for this date
            const dayEvents = state.events.filter(e => e.date === dateStr);
            const dayTasks = state.tasks.filter(t => t.date === dateStr);
            const dayReminders = state.reminders.filter(r => r.date === dateStr);
            const journalText = state.journals.find(j => j.date === dateStr)?.content || '';
            const dayExpenses = state.expenses.filter(ex => ex.date === dateStr);
            const brainDumpText = state.brainDumps.find(b => b.date === dateStr)?.content || '';

            const dayTotalExpenses = dayExpenses.reduce((sum, ex) => sum + ex.amount, 0);

            return (
              <div key={dateStr} className="relative group">
                {/* Timeline Marker Bullet */}
                <div className={`absolute -left-[21px] sm:-left-[29px] top-1 w-3 h-3 rounded-full border-2 bg-white transition-colors ${
                  theme === 'natural-tones'
                    ? 'border-natural-border group-hover:border-natural-sage'
                    : 'border-stone-200 dark:border-stone-800 dark:bg-stone-950 group-hover:border-amber-600 dark:group-hover:border-amber-500'
                }`}></div>

                <div className={`p-5 border transition-all ${
                  theme === 'natural-tones'
                    ? 'bg-white border-natural-border rounded-[24px] hover:border-natural-sage shadow-2xs hover:shadow-xs'
                    : 'bg-white dark:bg-stone-950 border-stone-200 dark:border-stone-800 rounded-2xl hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-sm'
                }`}>
                  {/* Timeline Row Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-stone-100 dark:border-stone-900 pb-3 mb-4">
                    <div>
                      <span className={`text-[10px] font-mono uppercase tracking-widest font-medium mr-2 ${
                        theme === 'natural-tones' ? 'text-natural-sage font-semibold' : 'text-amber-800 dark:text-amber-500'
                      }`}>
                        {dayName}
                      </span>
                      <h3 className="text-base font-serif font-medium text-stone-800 dark:text-stone-100 inline-block">
                        {dateText}
                      </h3>
                    </div>
                    <button
                      onClick={() => {
                        onSelectDate(dateStr);
                        onNavigateToTodayTab();
                      }}
                      className={`text-[10px] font-mono hover:underline flex items-center gap-0.5 cursor-pointer ${
                        theme === 'natural-tones' ? 'text-natural-sage font-semibold' : 'text-amber-800 dark:text-amber-500'
                      }`}
                    >
                      Open day logs <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>


                  {/* Core Blocks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Tasks column */}
                    <div className="space-y-3">
                      {dayTasks.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5 font-bold">
                            Completed Tasks
                          </h4>
                          <div className="space-y-1">
                            {dayTasks.map(task => (
                              <div key={task.id} className="flex items-center gap-2 text-[11px]">
                                <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                  task.completed ? 'bg-stone-100 border-transparent dark:bg-stone-900' : 'border-stone-200 dark:border-stone-800'
                                }`}>
                                  {task.completed && <Check className="w-2.5 h-2.5 text-stone-600 dark:text-stone-400" />}
                                </span>
                                <span className={`truncate ${task.completed ? 'line-through text-stone-400' : 'text-stone-700 dark:text-stone-300 font-serif'}`}>
                                  {task.title}
                                </span>
                                {task.tag !== 'None' && (
                                  <span className={`text-[8px] px-1 rounded ${getTagBg(task.tag)}`}>
                                    {task.tag}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {dayEvents.length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5 font-bold">
                            Schedule Events
                          </h4>
                          <div className="space-y-1 font-serif text-[11px] text-stone-700 dark:text-stone-300">
                            {dayEvents.map(e => (
                              <div key={e.id} className="flex gap-2">
                                <span className="font-mono text-amber-800 dark:text-amber-500 font-medium shrink-0">{e.time}</span>
                                <span className="truncate">{e.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Journal Snippet & Expenses column */}
                    <div className="space-y-3">
                      {journalText.trim().length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5 font-bold">
                            Daily Journal snippet
                          </h4>
                          <p className="text-[11px] font-serif italic text-stone-600 dark:text-stone-400 leading-relaxed line-clamp-3 bg-stone-50/50 dark:bg-stone-900/30 p-2 rounded border border-stone-100 dark:border-stone-900">
                            "{journalText}"
                          </p>
                        </div>
                      )}

                      {dayExpenses.length > 0 && (
                        <div>
                          <div className="flex justify-between items-center mb-1.5">
                            <h4 className="text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 font-bold">
                              Expenses ledger
                            </h4>
                            <span className="text-[10px] font-mono font-medium text-amber-900 dark:text-amber-400">
                              Total: NT$ {dayTotalExpenses}
                            </span>
                          </div>
                          <div className="space-y-1 font-mono text-[10px]">
                            {dayExpenses.slice(0, 3).map(ex => (
                              <div key={ex.id} className="flex justify-between text-stone-600 dark:text-stone-400 border-b border-stone-50 dark:border-stone-900 pb-0.5">
                                <span>{ex.note} ({ex.category})</span>
                                <span>NT$ {ex.amount}</span>
                              </div>
                            ))}
                            {dayExpenses.length > 3 && (
                              <span className="text-[9px] text-stone-400 italic block mt-0.5">
                                + {dayExpenses.length - 3} more items
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {brainDumpText.trim().length > 0 && (
                        <div>
                          <h4 className="text-[10px] font-mono uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5 font-bold">
                            Brain Dump Notes
                          </h4>
                          <p className="text-[10px] font-mono text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                            {brainDumpText}
                          </p>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
