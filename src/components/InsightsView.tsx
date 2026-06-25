import React from 'react';
import { BarChart3, TrendingUp, DollarSign, CheckSquare, Award, PieChart, Info } from 'lucide-react';
import { PlannerState, PlannerTask, TaskTag, ThemeType } from '../types';

interface InsightsViewProps {
  state: PlannerState;
  theme: ThemeType;
  language?: any;
}

export default function InsightsView({ state, theme }: InsightsViewProps) {
  // --- AGGREGATIONS ---
  const tasks = state.tasks;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  
  // 1. Completion Rate
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 2. Task Completion by Tag
  const tags: TaskTag[] = ['Tea', 'Travel', 'College', 'Personal'];
  const taskDataByTag = tags.map(tag => {
    const tagTasks = tasks.filter(t => t.tag === tag);
    const completed = tagTasks.filter(t => t.completed).length;
    const total = tagTasks.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { tag, completed, total, rate };
  });

  // 3. Expenses by Category
  const expenses = state.expenses;
  const expenseCategories = Array.from(new Set(expenses.map(ex => ex.category)));
  const totalSpend = expenses.reduce((sum, ex) => sum + ex.amount, 0);

  const spendByCat = expenseCategories.map(cat => {
    const catExpenses = expenses.filter(ex => ex.category === cat);
    const total = catExpenses.reduce((sum, ex) => sum + ex.amount, 0);
    const percentage = totalSpend > 0 ? Math.round((total / totalSpend) * 100) : 0;
    return { category: cat, total, percentage };
  }).sort((a, b) => b.total - a.total);

  // 4. Most Productive Day (Day with highest number of completed tasks)
  const taskDates = Array.from(new Set(tasks.map(t => t.date)));
  const dayStats = taskDates.map(date => {
    const dayTasks = tasks.filter(t => t.date === date);
    const completed = dayTasks.filter(t => t.completed).length;
    const total = dayTasks.length;
    const rate = total > 0 ? completed / total : 0;
    return { date, completed, total, rate };
  });

  // Sort by completed tasks count first, then by rate
  const sortedDays = dayStats.sort((a, b) => {
    if (b.completed !== a.completed) {
      return b.completed - a.completed;
    }
    return b.rate - a.rate;
  });

  const topDay = sortedDays[0];

  const formatSimpleDate = (dateStr?: string) => {
    if (!dateStr) return 'No days logged yet';
    const [year, month, day] = dateStr.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="max-w-3xl mx-auto py-2 px-1 animate-fade-in" id="insights-view-root">
      {/* Header */}
      <div className="border-b border-stone-200 dark:border-stone-800 pb-5 mb-8">
        <div className="flex items-center gap-3">
          <BarChart3 className={`w-5.5 h-5.5 ${theme === 'natural-tones' ? 'text-natural-sage' : 'text-amber-800 dark:text-amber-500'}`} />
          <div>
            <h2 className="text-xl font-serif font-medium text-stone-800 dark:text-stone-100">
              Clarity Insights
            </h2>
            <p className="text-[10px] font-mono text-stone-400 dark:text-stone-500 uppercase tracking-wider">
              Simple summaries of your habits, completion rates, and spending ledger
            </p>
          </div>
        </div>
      </div>

      {totalTasks === 0 && expenses.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl">
          <Info className="w-8 h-8 text-stone-300 dark:text-stone-700 mx-auto mb-3" />
          <h3 className="text-sm font-serif font-medium text-stone-600 dark:text-stone-400">
            No statistics available yet
          </h3>
          <p className="text-xs text-stone-400 dark:text-stone-500 mt-1 max-w-sm mx-auto">
            Once you log tasks and track expenses over multiple days, clean visual breakdowns will generate here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="insights-grid">
          
          {/* CARD 1: OVERALL COMPLETION RATE */}
          <div className={`p-5 flex flex-col justify-between ${
            theme === 'natural-tones'
              ? 'bg-white border border-natural-border rounded-[24px] shadow-2xs'
              : 'bg-white dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800'
          }`}>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-4 flex items-center gap-1.5">
                <CheckSquare className={`w-4 h-4 ${theme === 'natural-tones' ? 'text-natural-sage' : 'text-amber-700 dark:text-amber-500'}`} />
                <span className={theme === 'natural-tones' ? 'text-[11px] font-bold uppercase tracking-[0.1em] text-natural-muted' : ''}>Task Completion Rate</span>
              </h3>
              
              <div className="flex items-center gap-6 my-4">
                {/* Circular indicator (using SVG for extreme precision and look) */}
                <div className="relative w-20 h-20 shrink-0">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      className="stroke-stone-100 dark:stroke-stone-900 fill-none"
                      strokeWidth="6"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      className={`fill-none transition-all duration-1000 ${
                        theme === 'natural-tones' ? 'stroke-natural-sage' : 'stroke-amber-800 dark:stroke-amber-600'
                      }`}
                      strokeWidth="6"
                      strokeDasharray={`${2 * Math.PI * 34}`}
                      strokeDashoffset={`${2 * Math.PI * 34 * (1 - completionRate / 100)}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-mono font-bold text-stone-800 dark:text-stone-100">
                      {completionRate}%
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="block text-xs text-stone-400">Cumulative Progress:</span>
                  <p className="text-sm font-serif text-stone-800 dark:text-stone-200">
                    <strong>{completedTasks}</strong> tasks completed out of <strong>{totalTasks}</strong> total entries logged.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-stone-100 dark:border-stone-900 pt-3 mt-3">
              <span className="text-[10px] font-mono text-stone-400 block uppercase">
                Productivity Stance:
              </span>
              <p className="text-[11px] font-serif text-stone-500 dark:text-stone-400 italic mt-0.5">
                "Keep pace slow. The goal is intentional focus, not checking empty items."
              </p>
            </div>
          </div>

          {/* CARD 2: MOST ACTIVE DAY */}
          <div className={`p-5 flex flex-col justify-between ${
            theme === 'natural-tones'
              ? 'bg-white border border-natural-border rounded-[24px] shadow-2xs'
              : 'bg-white dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800'
          }`}>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-4 flex items-center gap-1.5">
                <Award className={`w-4 h-4 ${theme === 'natural-tones' ? 'text-natural-sage' : 'text-amber-700 dark:text-amber-500'}`} />
                <span className={theme === 'natural-tones' ? 'text-[11px] font-bold uppercase tracking-[0.1em] text-natural-muted' : ''}>Focus Highlight Day</span>
              </h3>

              <div className="my-5">
                {topDay ? (
                  <div className="space-y-2">
                    <span className={`text-xs font-mono px-2 py-1 rounded border ${
                      theme === 'natural-tones'
                        ? 'bg-natural-sage-light text-natural-sage border-natural-border/60'
                        : 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-500 border-amber-100 dark:border-amber-900'
                    }`}>
                      {formatSimpleDate(topDay.date)}
                    </span>
                    <p className="text-sm font-serif text-stone-800 dark:text-stone-200 pt-2 leading-relaxed">
                      You accomplished <strong>{topDay.completed} tasks</strong> on this date with a success rate of <strong>{Math.round(topDay.rate * 100)}%</strong>.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-stone-400 dark:text-stone-500 italic py-4">
                    Record tasks on different days to pinpoint highlights.
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-stone-100 dark:border-stone-900 pt-3 mt-3">
              <span className="text-[10px] font-mono text-stone-400 block uppercase">
                Planner Advice:
              </span>
              <p className="text-[11px] font-serif text-stone-500 dark:text-stone-400 italic mt-0.5">
                Identify what triggers positive focus on high accomplishment days.
              </p>
            </div>
          </div>


          {/* CARD 3: TASKS BY TAGS */}
          <div className={`p-5 ${
            theme === 'natural-tones'
              ? 'bg-white border border-natural-border rounded-[24px] shadow-2xs'
              : 'bg-white dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800'
          }`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-4">
              <span className={theme === 'natural-tones' ? 'text-[11px] font-bold uppercase tracking-[0.1em] text-natural-muted' : ''}>Habits Completed By Tag</span>
            </h3>

            <div className="space-y-4">
              {taskDataByTag.map(({ tag, completed, total, rate }) => (
                <div key={tag} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-serif text-stone-700 dark:text-stone-300 font-medium">{tag}</span>
                    <span className="font-mono text-stone-500 dark:text-stone-400">
                      {completed}/{total} ({rate}%)
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-stone-100 dark:bg-stone-900 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        theme === 'natural-tones' ? 'bg-natural-sage' : 'bg-amber-800 dark:bg-amber-600'
                      }`}
                      style={{ width: `${total > 0 ? rate : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CARD 4: EXPENDITURES BY CATEGORY */}
          <div className={`p-5 flex flex-col justify-between ${
            theme === 'natural-tones'
              ? 'bg-white border border-natural-border rounded-[24px] shadow-2xs'
              : 'bg-white dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800'
          }`}>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-4 flex items-center justify-between">
                <span className={theme === 'natural-tones' ? 'text-[11px] font-bold uppercase tracking-[0.1em] text-natural-muted' : ''}>Expenses Ledger Breakdown</span>
                <span className={`text-xs font-serif font-bold ${
                  theme === 'natural-tones' ? 'text-natural-sage' : 'text-stone-800 dark:text-stone-100'
                }`}>
                  Total spent: NT$ {totalSpend}
                </span>
              </h3>

              {spendByCat.length === 0 ? (
                <p className="text-xs text-stone-400 dark:text-stone-500 italic py-6 text-center">
                  No expenditures recorded yet
                </p>
              ) : (
                <div className="space-y-3">
                  {spendByCat.map(({ category, total, percentage }) => (
                    <div key={category} className="space-y-1 text-xs">
                      <div className="flex justify-between font-serif text-stone-700 dark:text-stone-300">
                        <span>{category}</span>
                        <span className="font-mono text-stone-500">
                          NT$ {total} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-stone-100 dark:bg-stone-900 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            theme === 'natural-tones' ? 'bg-natural-sage' : 'bg-emerald-600'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>


            <div className="border-t border-stone-100 dark:border-stone-900 pt-3 mt-4">
              <span className="text-[10px] font-mono text-stone-400 block uppercase">
                Financial Stance:
              </span>
              <p className="text-[11px] font-serif text-stone-500 dark:text-stone-400 italic mt-0.5">
                "Small tea and book expenses nurture the soul. Keep watch on food delivery leaks."
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
