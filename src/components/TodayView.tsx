import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Tag, Calendar, Sparkles, Check, CheckCircle2, ChevronRight, AlertCircle, Bookmark, Cloud } from 'lucide-react';
import { PlannerState, PlannerEvent, PlannerTask, PlannerReminder, PlannerExpense, TaskTag, ThemeType } from '../types';

interface TodayViewProps {
  selectedDate: string; // YYYY-MM-DD
  state: PlannerState;
  onUpdateState: (updater: (prev: PlannerState) => PlannerState) => void;
  theme: ThemeType;
  userEmail?: string | null;
  onOpenAuth?: () => void;
}

export default function TodayView({ selectedDate, state, onUpdateState, theme, userEmail, onOpenAuth }: TodayViewProps) {

  // Local state for forms
  const [eventTime, setEventTime] = useState('12:00');
  const [eventTitle, setEventTitle] = useState('');
  const [showAddEvent, setShowAddEvent] = useState(false);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskTag, setTaskTag] = useState<TaskTag>('None');

  const [reminderTitle, setReminderTitle] = useState('');

  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Food');
  const [expenseNote, setExpenseNote] = useState('');

  const [journalSaveStatus, setJournalSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [brainDumpSaveStatus, setBrainDumpSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');

  // AI Brain Dump states
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiResultSummary, setAiResultSummary] = useState<{
    eventsAdded: number;
    tasksAdded: number;
    remindersAdded: number;
    expensesAdded: number;
    journalsAdded: number;
    preferencesRemembered?: string;
  } | null>(null);

  // Filter current date items
  const dayEvents = state.events.filter(e => e.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time));
  const dayTasks = state.tasks.filter(t => t.date === selectedDate);
  const dayReminders = state.reminders.filter(r => r.date === selectedDate);
  const dayJournal = state.journals.find(j => j.date === selectedDate)?.content || '';
  const dayExpenses = state.expenses.filter(ex => ex.date === selectedDate);
  const dayBrainDump = state.brainDumps.find(b => b.date === selectedDate)?.content || '';

  // Sum spending
  const totalSpending = dayExpenses.reduce((sum, ex) => sum + ex.amount, 0);

  // Auto-saving journal
  const handleJournalChange = (val: string) => {
    setJournalSaveStatus('saving');
    onUpdateState(prev => {
      const idx = prev.journals.findIndex(j => j.date === selectedDate);
      const updatedJournals = [...prev.journals];
      if (idx >= 0) {
        updatedJournals[idx] = { ...updatedJournals[idx], content: val };
      } else {
        updatedJournals.push({ id: `j-${Date.now()}`, date: selectedDate, content: val });
      }
      return { ...prev, journals: updatedJournals };
    });
    
    // Simulate auto-save completion
    const timer = setTimeout(() => {
      setJournalSaveStatus('saved');
    }, 600);
    return () => clearTimeout(timer);
  };

  // Auto-saving brain dump
  const handleBrainDumpChange = (val: string) => {
    setBrainDumpSaveStatus('saving');
    onUpdateState(prev => {
      const idx = prev.brainDumps.findIndex(b => b.date === selectedDate);
      const updatedBrainDumps = [...prev.brainDumps];
      if (idx >= 0) {
        updatedBrainDumps[idx] = { ...updatedBrainDumps[idx], content: val };
      } else {
        updatedBrainDumps.push({ id: `b-${Date.now()}`, date: selectedDate, content: val });
      }
      return { ...prev, brainDumps: updatedBrainDumps };
    });
    
    const timer = setTimeout(() => {
      setBrainDumpSaveStatus('saved');
    }, 600);
    return () => clearTimeout(timer);
  };

  // AI Organize and Parse thoughts handler
  const handleOrganizeWithAI = async () => {
    if (!dayBrainDump || !dayBrainDump.trim()) return;

    setAiProcessing(true);
    setAiError('');
    setAiResultSummary(null);

    try {
      const response = await fetch('/api/braindump', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: dayBrainDump,
          activeDate: selectedDate,
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Server error during parsing');
      }

      const data = await response.json();
      
      // Parse data and update parent state!
      onUpdateState(prev => {
        let updatedEvents = [...prev.events];
        let updatedTasks = [...prev.tasks];
        let updatedReminders = [...prev.reminders];
        let updatedExpenses = [...prev.expenses];
        let updatedJournals = [...prev.journals];
        
        // Add events
        if (Array.isArray(data.events)) {
          data.events.forEach((ev: any, index: number) => {
            updatedEvents.push({
              id: `e-ai-${Date.now()}-${index}`,
              date: ev.date || selectedDate,
              time: ev.time || '12:00',
              title: ev.title
            });
          });
        }

        // Add tasks
        if (Array.isArray(data.tasks)) {
          data.tasks.forEach((tk: any, index: number) => {
            updatedTasks.push({
              id: `t-ai-${Date.now()}-${index}`,
              date: tk.date || selectedDate,
              title: tk.title,
              tag: (tk.tag || 'None') as TaskTag,
              completed: false
            });
          });
        }

        // Add reminders
        if (Array.isArray(data.reminders)) {
          data.reminders.forEach((rm: any, index: number) => {
            updatedReminders.push({
              id: `r-ai-${Date.now()}-${index}`,
              date: rm.date || selectedDate,
              title: rm.title,
              completed: false
            });
          });
        }

        // Add expenses
        if (Array.isArray(data.expenses)) {
          data.expenses.forEach((ex: any, index: number) => {
            updatedExpenses.push({
              id: `ex-ai-${Date.now()}-${index}`,
              date: ex.date || selectedDate,
              amount: typeof ex.amount === 'number' ? ex.amount : parseFloat(ex.amount) || 0,
              category: ex.category || 'Food',
              note: ex.note
            });
          });
        }

        // Add journals
        if (Array.isArray(data.journals)) {
          data.journals.forEach((jr: any, index: number) => {
            updatedJournals.push({
              id: `j-ai-${Date.now()}-${index}`,
              date: jr.date || selectedDate,
              content: jr.content
            });
          });
        }

        // Remember user preferences
        const accumulatedPreferences = data.preferences 
          ? (prev.preferences ? `${prev.preferences}\n${data.preferences}` : data.preferences)
          : prev.preferences;

        return {
          ...prev,
          events: updatedEvents,
          tasks: updatedTasks,
          reminders: updatedReminders,
          expenses: updatedExpenses,
          journals: updatedJournals,
          preferences: accumulatedPreferences
        };
      });

      // Show summary report
      setAiResultSummary({
        eventsAdded: Array.isArray(data.events) ? data.events.length : 0,
        tasksAdded: Array.isArray(data.tasks) ? data.tasks.length : 0,
        remindersAdded: Array.isArray(data.reminders) ? data.reminders.length : 0,
        expensesAdded: Array.isArray(data.expenses) ? data.expenses.length : 0,
        journalsAdded: Array.isArray(data.journals) ? data.journals.length : 0,
        preferencesRemembered: data.preferences || undefined
      });

      // Clear the raw brain dump so it is cleanly stored and organized
      handleBrainDumpChange('');

    } catch (err: any) {
      console.error('AI Brain Dump Error:', err);
      setAiError(err?.message || 'Failed to communicate with AI planner');
    } finally {
      setAiProcessing(false);
    }
  };

  // Clear AI success summary after 8 seconds
  useEffect(() => {
    if (aiResultSummary) {
      const t = setTimeout(() => {
        setAiResultSummary(null);
      }, 8000);
      return () => clearTimeout(t);
    }
  }, [aiResultSummary]);

  // Clear save status after a while
  useEffect(() => {
    if (journalSaveStatus === 'saved') {
      const t = setTimeout(() => setJournalSaveStatus('idle'), 2000);
      return () => clearTimeout(t);
    }
  }, [journalSaveStatus]);

  useEffect(() => {
    if (brainDumpSaveStatus === 'saved') {
      const t = setTimeout(() => setBrainDumpSaveStatus('idle'), 2000);
      return () => clearTimeout(t);
    }
  }, [brainDumpSaveStatus]);

  // Handlers for Add/Delete
  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    const newEvent: PlannerEvent = {
      id: `e-${Date.now()}`,
      date: selectedDate,
      time: eventTime,
      title: eventTitle.trim()
    };

    onUpdateState(prev => ({
      ...prev,
      events: [...prev.events, newEvent]
    }));

    setEventTitle('');
    setShowAddEvent(false);
  };

  const handleDeleteEvent = (id: string) => {
    onUpdateState(prev => ({
      ...prev,
      events: prev.events.filter(e => e.id !== id)
    }));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const newTask: PlannerTask = {
      id: `t-${Date.now()}`,
      date: selectedDate,
      title: taskTitle.trim(),
      tag: taskTag,
      completed: false
    };

    onUpdateState(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }));

    setTaskTitle('');
    setTaskTag('None');
  };

  const handleToggleTask = (id: string) => {
    onUpdateState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    }));
  };

  const handleDeleteTask = (id: string) => {
    onUpdateState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id)
    }));
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTitle.trim()) return;

    const newReminder: PlannerReminder = {
      id: `r-${Date.now()}`,
      date: selectedDate,
      title: reminderTitle.trim(),
      completed: false
    };

    onUpdateState(prev => ({
      ...prev,
      reminders: [...prev.reminders, newReminder]
    }));

    setReminderTitle('');
  };

  const handleToggleReminder = (id: string) => {
    onUpdateState(prev => ({
      ...prev,
      reminders: prev.reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r)
    }));
  };

  const handleDeleteReminder = (id: string) => {
    onUpdateState(prev => ({
      ...prev,
      reminders: prev.reminders.filter(r => r.id !== id)
    }));
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(expenseAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const newExpense: PlannerExpense = {
      id: `ex-${Date.now()}`,
      date: selectedDate,
      amount: parsedAmount,
      category: expenseCategory,
      note: expenseNote.trim() || 'Unnoted'
    };

    onUpdateState(prev => ({
      ...prev,
      expenses: [...prev.expenses, newExpense]
    }));

    setExpenseAmount('');
    setExpenseNote('');
  };

  const handleDeleteExpense = (id: string) => {
    onUpdateState(prev => ({
      ...prev,
      expenses: prev.expenses.filter(ex => ex.id !== id)
    }));
  };

  // Helper styles for Tags
  const getTagStyle = (tag: TaskTag) => {
    switch (tag) {
      case 'Tea':
        return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40';
      case 'Travel':
        return 'bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40';
      case 'College':
        return 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40';
      case 'Personal':
        return 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-100 dark:border-rose-900/40';
      default:
        return 'bg-stone-50 text-stone-600 dark:bg-stone-900 dark:text-stone-400 border border-stone-200/50 dark:border-stone-800/50';
    }
  };

  // Date formatting helpers
  const getFormattedDayLabel = () => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    
    const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const monthName = dateObj.toLocaleDateString('en-US', { month: 'long' });
    const dayOfMonth = dateObj.getDate();
    const fullYear = dateObj.getFullYear();
    
    return { weekday, dateString: `${monthName} ${dayOfMonth}, ${fullYear}` };
  };

  const { weekday, dateString } = getFormattedDayLabel();

  // Dynamic color helper classes
  const getWeekdayTextClass = () => {
    if (theme === 'natural-tones') return 'text-natural-sage font-semibold';
    if (theme === 'warm-paper') return 'text-amber-800 font-medium';
    return 'text-stone-700 dark:text-stone-300 font-medium';
  };

  const getEventsCardClass = () => {
    if (theme === 'natural-tones') {
      return 'p-6 bg-white border border-natural-border rounded-[24px] shadow-2xs';
    }
    return 'p-5 bg-stone-50/50 dark:bg-stone-900/40 rounded-xl border border-stone-200/60 dark:border-stone-800/60';
  };

  const getSectionHeaderClass = () => {
    if (theme === 'natural-tones') return 'text-xs font-bold uppercase tracking-[0.1em] text-natural-muted';
    return 'text-sm font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300';
  };

  const getButtonAccentClass = () => {
    if (theme === 'natural-tones') {
      return 'text-natural-sage border-natural-border bg-white hover:bg-natural-sage-light hover:border-natural-sage';
    }
    return 'text-amber-800 hover:text-amber-900 dark:text-amber-500 dark:hover:text-amber-400 border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800';
  };

  const getSubmitButtonClass = () => {
    if (theme === 'natural-tones') {
      return 'bg-natural-sage text-white hover:bg-natural-sage/90';
    }
    return 'bg-amber-800 text-white hover:bg-amber-900 dark:bg-amber-600 dark:hover:bg-amber-700';
  };

  return (
    <div className="space-y-6 px-1 md:px-2" id="today-view-root">
      {/* Date Header Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-stone-200 dark:border-stone-800 pb-4 mb-2">
        <div>
          <span className={`text-sm font-mono uppercase tracking-widest ${getWeekdayTextClass()}`}>
            {weekday}
          </span>
          <h2 className="text-3xl md:text-4xl font-serif font-light text-stone-800 dark:text-stone-100 tracking-tight mt-0.5">
            {dateString}
          </h2>
        </div>
        <div className="flex items-center gap-2 mt-2 md:mt-0 text-xs font-mono text-stone-400 dark:text-stone-500 bg-stone-50 dark:bg-stone-900/60 px-3.5 py-2 rounded-lg border border-stone-100 dark:border-stone-800">
          <span className={`w-2 h-2 rounded-full ${userEmail ? 'bg-sky-550' : 'bg-emerald-500'} animate-pulse`}></span>
          {userEmail ? 'Cloud Backup Synced' : 'Guest Mode • Local Save'}
        </div>
      </div>

      {/* Cloud Backup Promotion Banner (only for Guests / local-only mode) */}
      {!userEmail && (
        <div className={`p-5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
          theme === 'natural-tones'
            ? 'bg-natural-sage-light/25 border-natural-border/50 rounded-[24px]'
            : 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-100/50 dark:border-amber-900/30'
        }`} id="cloud-sync-banner">
          <div className="flex gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              theme === 'natural-tones' ? 'bg-natural-sage/10 text-natural-sage' : 'bg-amber-100/50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400'
            }`}>
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                Offline Guest Mode: Your logs are stored locally
              </h4>
              <p className="text-[13px] text-stone-550 dark:text-stone-400 mt-0.5 leading-relaxed font-sans">
                Set up your day, write some entries, then save them safely in the cloud so you never lose your beautiful planner parchment when switching tablets.
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAuth}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 shrink-0 shadow-2xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer ${
              theme === 'natural-tones'
                ? 'bg-natural-sage text-white hover:bg-natural-sage/95'
                : 'bg-stone-800 hover:bg-stone-900 text-white dark:bg-stone-200 dark:text-stone-950 dark:hover:bg-stone-100'
            }`}
          >
            <span>Cloud Backup</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTION 1: EVENTS */}
      <div className={getEventsCardClass()} id="events-card">
        <div className="flex justify-between items-center mb-3">
          <h3 className={getSectionHeaderClass()}>
            Events Scheduled
          </h3>
          <button
            onClick={() => setShowAddEvent(!showAddEvent)}
            className={`flex items-center gap-1 text-xs font-medium border px-3 py-1.5 rounded-lg transition-all cursor-pointer ${getButtonAccentClass()}`}
          >
            <Plus className="w-3.5 h-3.5" />
            {showAddEvent ? 'Cancel' : 'Add Event'}
          </button>
        </div>

        {/* Add Event Form */}
        {showAddEvent && (
          <form onSubmit={handleAddEvent} className="mb-4 p-3.5 bg-white dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800 flex flex-wrap gap-2.5 items-center">
            <input
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              className="px-3 py-2 text-sm border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-900 font-mono text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-natural-sage"
              required
            />
            <input
              type="text"
              placeholder="e.g. Lunch with Mom"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="flex-1 min-w-[150px] px-3.5 py-2 text-sm border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-natural-sage placeholder-stone-400 dark:placeholder-stone-600"
              required
            />
            <button
              type="submit"
              className={`px-4 py-2 text-sm rounded-lg transition-colors font-medium cursor-pointer ${getSubmitButtonClass()}`}
            >
              Save
            </button>
          </form>
        )}

        {/* Events List */}
        {dayEvents.length === 0 ? (
          <p className="text-sm text-stone-400 dark:text-stone-500 italic py-3 text-center">
            No scheduled events
          </p>
        ) : (
          <div className={`${theme === 'natural-tones' ? 'flex flex-row flex-wrap gap-4' : 'space-y-2'}`}>
            {dayEvents.map((event) => (
              <div
                key={event.id}
                className={`group transition-all ${
                  theme === 'natural-tones'
                    ? 'bg-natural-sage-light px-4 py-2.5 rounded-[14px] border border-natural-sage-border text-sm flex items-center justify-between gap-4'
                    : 'flex justify-between items-center py-2 px-3 bg-white dark:bg-stone-950 rounded-lg border border-stone-200/50 dark:border-stone-900/50 hover:border-amber-200 dark:hover:border-amber-900/30 text-sm'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`${
                    theme === 'natural-tones'
                      ? 'font-bold text-natural-sage font-mono text-sm'
                      : 'font-mono text-xs sm:text-sm text-amber-800 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-100 dark:border-amber-950 mr-2 shrink-0'
                  }`}>
                    {event.time}
                  </span>
                  <span className="text-sm sm:text-[15px] font-serif font-medium text-stone-800 dark:text-stone-200 leading-snug">
                    {event.title}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteEvent(event.id)}
                  className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-600 transition-all p-1 hover:bg-stone-50 dark:hover:bg-stone-900 rounded cursor-pointer"
                  title="Delete event"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>


      {/* SECTION 2: TASKS & REMINDERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* LEFT: TODAY'S TASKS */}
        <div className={`p-5 flex flex-col justify-between ${
          theme === 'natural-tones'
            ? 'bg-white border border-natural-border rounded-[24px] shadow-2xs'
            : 'bg-white dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800'
        }`} id="tasks-card">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-3 border-b border-stone-100 dark:border-stone-900 pb-2 flex items-center justify-between">
              <span className={theme === 'natural-tones' ? 'text-xs font-bold uppercase tracking-[0.1em] text-natural-muted' : ''}>Today's Tasks</span>
              <span className="text-xs font-mono text-stone-400 dark:text-stone-500 font-normal">
                {dayTasks.filter(t => t.completed).length}/{dayTasks.length} Done
              </span>
            </h3>

            {/* Task input at top of card */}
            <form onSubmit={handleAddTask} className="mb-4 flex flex-col gap-2.5">
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Create task..."
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className={`flex-1 px-3.5 py-2 text-sm border rounded-lg bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100 focus:outline-none placeholder-stone-400 dark:placeholder-stone-600 ${
                    theme === 'natural-tones' ? 'border-natural-border focus:ring-1 focus:ring-natural-sage' : 'border-stone-200 dark:border-stone-800 focus:outline-amber-600'
                  }`}
                  required
                />
                <button
                  type="submit"
                  className={`px-4 border text-stone-700 dark:text-stone-300 rounded-lg cursor-pointer transition-colors ${
                    theme === 'natural-tones'
                      ? 'bg-white hover:bg-natural-sage-light border-natural-border text-natural-sage'
                      : 'bg-stone-100 dark:bg-stone-900 hover:bg-amber-100/50 dark:hover:bg-amber-950/30 border-stone-200 dark:border-stone-800'
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Tag selector */}
              <div className="flex flex-wrap gap-1.5">
                {(['Tea', 'Travel', 'College', 'Personal', 'None'] as TaskTag[]).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setTaskTag(tag)}
                    className={`px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                      taskTag === tag
                        ? theme === 'natural-tones'
                          ? 'bg-natural-sage text-white scale-[1.02] font-medium'
                          : 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-950 scale-[1.02] font-medium'
                        : theme === 'natural-tones'
                        ? 'bg-natural-sage-light text-natural-tag-text border border-natural-sage-border/50 hover:bg-natural-tag-bg'
                        : 'bg-stone-100 text-stone-500 dark:bg-stone-900 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-800'
                    }`}
                  >
                    {tag === 'None' ? 'No tag' : tag}
                  </button>
                ))}
              </div>
            </form>

            {/* Tasks list */}
            {dayTasks.length === 0 ? (
              <p className="text-sm text-stone-400 dark:text-stone-500 italic py-6 text-center">
                No tasks added for this day
              </p>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="group flex justify-between items-center py-2 px-2 hover:bg-stone-50/50 dark:hover:bg-stone-900/40 rounded-lg transition-all"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleTask(task.id)}
                        className={`w-[20px] h-[20px] rounded-[6px] border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                          task.completed
                            ? theme === 'natural-tones'
                              ? 'bg-natural-sage border-natural-sage'
                              : 'bg-stone-800 border-stone-800 dark:bg-stone-200 dark:border-stone-200'
                            : theme === 'natural-tones'
                            ? 'border-natural-checkbox-border hover:border-natural-sage'
                            : 'border-stone-300 hover:border-stone-500 dark:border-stone-700 dark:hover:border-stone-500'
                        }`}
                      >
                        {task.completed && (
                          <Check className="w-3 h-3 text-white stroke-[3]" />
                        )}
                      </button>
                      <span
                        onClick={() => handleToggleTask(task.id)}
                        className={`text-base select-none truncate cursor-pointer transition-all ${
                          task.completed
                            ? 'line-through text-stone-400 dark:text-stone-600 opacity-60'
                            : 'text-stone-800 dark:text-stone-200 font-sans'
                        }`}
                      >
                        {task.title}
                      </span>
                      {task.tag !== 'None' && (
                        <span className={`text-[11px] font-sans font-medium px-2.5 py-0.5 rounded-full ${getTagStyle(task.tag)}`}>
                          {task.tag}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-600 transition-all p-1 hover:bg-stone-50 dark:hover:bg-stone-900 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: REMINDERS */}
        <div className={`p-5 flex flex-col justify-between ${
          theme === 'natural-tones'
            ? 'bg-white border border-natural-border rounded-[24px] shadow-2xs'
            : 'bg-white dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800'
        }`} id="reminders-card">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-3 border-b border-stone-100 dark:border-stone-900 pb-2">
              <span className={theme === 'natural-tones' ? 'text-xs font-bold uppercase tracking-[0.1em] text-natural-muted' : ''}>Bullet Reminders</span>
            </h3>

            {/* Reminder entry */}
            <form onSubmit={handleAddReminder} className="mb-4 flex gap-1.5">
              <input
                type="text"
                placeholder="Submit assignment, renew insurance..."
                value={reminderTitle}
                onChange={(e) => setReminderTitle(e.target.value)}
                className={`flex-1 px-3.5 py-2 text-sm border rounded-lg bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100 focus:outline-none placeholder-stone-400 dark:placeholder-stone-600 ${
                  theme === 'natural-tones' ? 'border-natural-border focus:ring-1 focus:ring-natural-sage' : 'border-stone-200 dark:border-stone-800 focus:outline-amber-600'
                }`}
                required
              />
              <button
                type="submit"
                className={`px-4 border text-stone-700 dark:text-stone-300 rounded-lg cursor-pointer transition-colors ${
                  theme === 'natural-tones'
                    ? 'bg-white hover:bg-natural-sage-light border-natural-border text-natural-sage'
                    : 'bg-stone-100 dark:bg-stone-900 hover:bg-amber-100/50 dark:hover:bg-amber-950/30 border-stone-200 dark:border-stone-800'
                }`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>


            {/* Reminders List */}
            {dayReminders.length === 0 ? (
              <p className="text-sm text-stone-400 dark:text-stone-500 italic py-6 text-center">
                No reminders noted
              </p>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {dayReminders.map((rem) => (
                  <div
                    key={rem.id}
                    className="group flex justify-between items-start py-2 px-2 hover:bg-stone-50/50 dark:hover:bg-stone-900/40 rounded-lg transition-all"
                  >
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <span
                        onClick={() => handleToggleReminder(rem.id)}
                        className={`w-2 h-2 rounded-full mt-2 cursor-pointer transition-all shrink-0 ${
                          rem.completed
                            ? theme === 'natural-tones'
                              ? 'bg-natural-border'
                              : 'bg-stone-300 dark:bg-stone-700'
                            : theme === 'natural-tones'
                            ? 'bg-natural-sage'
                            : 'bg-amber-600 dark:bg-amber-500'
                        }`}
                      ></span>
                      <span
                        onClick={() => handleToggleReminder(rem.id)}
                        className={`text-base cursor-pointer select-none leading-normal ${
                          rem.completed
                            ? 'line-through text-stone-400 dark:text-stone-600 opacity-60 font-sans'
                            : 'text-stone-800 dark:text-stone-200 font-sans'
                        }`}
                      >
                        {rem.title}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteReminder(rem.id)}
                      className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-600 transition-all p-1 hover:bg-stone-50 dark:hover:bg-stone-900 rounded cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: JOURNAL & EXPENSES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* LEFT: JOURNAL */}
        <div className={`p-5 flex flex-col justify-between ${
          theme === 'natural-tones'
            ? 'bg-white border border-natural-border rounded-[24px] shadow-2xs'
            : 'bg-white dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800'
        }`} id="journal-card">
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-2 border-b border-stone-100 dark:border-stone-900 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                <span className={theme === 'natural-tones' ? 'text-xs font-bold uppercase tracking-[0.1em] text-natural-muted' : ''}>Daily Journal</span>
              </h3>
              <span className="text-xs font-mono text-stone-400 dark:text-stone-500">
                {journalSaveStatus === 'saving' && 'Saving diary...'}
                {journalSaveStatus === 'saved' && 'Saved to diary'}
                {journalSaveStatus === 'idle' && 'Draft matches cloud'}
              </span>
            </div>

            {/* Notepad area */}
            <div className="relative flex-1">
              <textarea
                value={dayJournal}
                onChange={(e) => handleJournalChange(e.target.value)}
                placeholder="What happened today? Write down your feelings, discoveries, or details of tea brewed..."
                rows={7}
                className="w-full text-base sm:text-[17px] font-sans leading-relaxed text-stone-800 dark:text-stone-200 bg-transparent resize-none focus:outline-none p-1 placeholder-stone-400 dark:placeholder-stone-600"
                style={{
                  backgroundImage: theme === 'natural-tones'
                    ? 'linear-gradient(transparent, transparent 27px, #E6E1D6 27px, #E6E1D6 28px, transparent 28px)'
                    : 'linear-gradient(transparent, transparent 27px, #e7e5e4 27px, #e7e5e4 28px, transparent 28px)',
                  backgroundSize: '100% 28px',
                  lineHeight: '28px'
                }}
              />
            </div>
          </div>
        </div>

        {/* RIGHT: EXPENSES */}
        <div className={`p-5 flex flex-col justify-between ${
          theme === 'natural-tones'
            ? 'bg-white border border-natural-border rounded-[24px] shadow-2xs'
            : 'bg-white dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800'
        }`} id="expenses-card-ledger">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2 border-b border-stone-100 dark:border-stone-900 pb-2 flex justify-between items-center">
              <span className={theme === 'natural-tones' ? 'text-xs font-bold uppercase tracking-[0.1em] text-natural-muted' : ''}>Expenses Tracker</span>
              <span className={`text-sm font-serif font-semibold ${theme === 'natural-tones' ? 'text-natural-sage' : 'text-amber-950 dark:text-amber-400'}`}>
                Total Spend: NT$ {totalSpending}
              </span>
            </h3>

            {/* Ledger entry form */}
            <form onSubmit={handleAddExpense} className={`mb-4 space-y-2.5 p-3 border rounded-xl ${
              theme === 'natural-tones'
                ? 'bg-natural-sage-light/40 border-natural-border'
                : 'bg-stone-50 dark:bg-stone-900/60 border-stone-200/50 dark:border-stone-800'
            }`}>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Amount"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className={`px-3.5 py-2 text-sm border rounded-lg text-stone-800 dark:text-stone-100 focus:outline-none placeholder-stone-400 ${
                    theme === 'natural-tones'
                      ? 'border-natural-border bg-white focus:ring-1 focus:ring-natural-sage'
                      : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 focus:outline-amber-600'
                  }`}
                  required
                />
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  className={`px-3.5 py-2 text-sm border rounded-lg text-stone-800 dark:text-stone-100 focus:outline-none font-sans ${
                    theme === 'natural-tones'
                      ? 'border-natural-border bg-white focus:ring-1 focus:ring-natural-sage'
                      : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 focus:outline-amber-600'
                  }`}
                >
                  <option value="Food">Food</option>
                  <option value="Transit">Transit</option>
                  <option value="Tea">Tea</option>
                  <option value="College">College</option>
                  <option value="Travel">Travel</option>
                  <option value="Personal">Personal</option>
                  <option value="Misc">Misc</option>
                </select>
              </div>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Note (e.g. Oolong tea can, lunch box)"
                  value={expenseNote}
                  onChange={(e) => setExpenseNote(e.target.value)}
                  className={`flex-1 px-3.5 py-2 text-sm border rounded-lg text-stone-800 dark:text-stone-100 focus:outline-none placeholder-stone-400 ${
                    theme === 'natural-tones'
                      ? 'border-natural-border bg-white focus:ring-1 focus:ring-natural-sage'
                      : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 focus:outline-amber-600'
                  }`}
                />
                <button
                  type="submit"
                  className={`px-4.5 py-2 text-sm rounded-lg cursor-pointer font-medium transition-colors shrink-0 ${
                    theme === 'natural-tones'
                      ? 'bg-natural-sage text-white hover:bg-natural-sage/90 border border-transparent'
                      : 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-950 hover:bg-stone-900'
                  }`}
                >
                  Log
                </button>
              </div>
            </form>

            {/* Ledger logs list */}
            {dayExpenses.length === 0 ? (
              <p className="text-sm text-stone-400 dark:text-stone-500 italic py-6 text-center">
                No expenditures recorded
              </p>
            ) : (
              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                {dayExpenses.map((ex) => (
                  <div
                    key={ex.id}
                    className={`group flex justify-between items-center py-2 px-2 border rounded-lg transition-all text-sm ${
                      theme === 'natural-tones'
                        ? 'bg-natural-sage-light border-natural-sage-border/40 hover:border-natural-sage'
                        : 'bg-stone-50/50 dark:bg-stone-900/20 border-stone-100 dark:border-stone-900/50 hover:border-amber-100 dark:hover:border-amber-900/20'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-stone-800 dark:text-stone-200 text-sm shrink-0">
                        NT$ {ex.amount}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-sans font-medium uppercase tracking-wider ${
                        theme === 'natural-tones'
                          ? 'bg-natural-tag-bg text-natural-tag-text'
                          : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                      }`}>
                        {ex.category}
                      </span>
                      <span className="text-stone-600 dark:text-stone-400 truncate max-w-[150px] font-sans">
                        {ex.note}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteExpense(ex.id)}
                      className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-600 transition-all p-1 hover:bg-stone-50 dark:hover:bg-stone-900 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>      {/* SECTION 4: BRAIN DUMP */}
      <div className={`p-5 ${
        theme === 'natural-tones'
          ? 'bg-white border border-natural-border rounded-[24px] shadow-2xs'
          : 'bg-white dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800'
      }`} id="braindump-card">
        <div className="flex justify-between items-center mb-3 border-b border-stone-100 dark:border-stone-900 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className={`w-4.5 h-4.5 ${theme === 'natural-tones' ? 'text-natural-sage' : 'text-amber-800 dark:text-amber-500'}`} />
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
              <span className={theme === 'natural-tones' ? 'text-xs font-bold uppercase tracking-[0.1em] text-natural-muted' : ''}>AI Brain Dump & Sort</span>
            </h3>
          </div>
          <span className="text-xs font-mono text-stone-400 dark:text-stone-500">
            {aiProcessing ? (
              <span className="animate-pulse text-amber-700 dark:text-amber-400 font-bold">AI is parsing & sorting...</span>
            ) : (
              <>
                {brainDumpSaveStatus === 'saving' && 'Drafting...'}
                {brainDumpSaveStatus === 'saved' && 'Saved locally'}
                {brainDumpSaveStatus === 'idle' && 'Raw thoughts area'}
              </>
            )}
          </span>
        </div>

        <textarea
          value={dayBrainDump}
          onChange={(e) => handleBrainDumpChange(e.target.value)}
          disabled={aiProcessing}
          placeholder="Pour your busy thoughts here: e.g. 'Log NT$ 150 spent on high-mountain Oolong tea. Remind me to review travel options to Kyoto tomorrow at 3pm, and CS assignment. I always prefer Oolong tea over green tea.'"
          rows={5}
          className="w-full text-sm font-mono leading-relaxed text-stone-700 dark:text-stone-300 bg-transparent resize-none focus:outline-none p-1 placeholder-stone-400 dark:placeholder-stone-600 disabled:opacity-50"
        />

        {/* Action button toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-3 border-t border-dashed border-stone-100 dark:border-stone-900 mt-2">
          <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed max-w-sm font-sans">
            AI automatically maps unstructured text to schedules, tag lists, journals, and expense ledgers.
          </p>
          <button
            onClick={handleOrganizeWithAI}
            disabled={aiProcessing || !dayBrainDump.trim()}
            className={`px-5 py-2.5 text-sm font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
              theme === 'natural-tones'
                ? 'bg-natural-sage text-white hover:bg-natural-sage/90 shadow-2xs disabled:bg-stone-100 disabled:text-stone-400'
                : 'bg-stone-800 hover:bg-stone-900 text-white dark:bg-stone-200 dark:text-stone-950 dark:hover:bg-stone-100 disabled:opacity-40'
            } disabled:cursor-not-allowed`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{aiProcessing ? 'Processing...' : 'Organize with AI'}</span>
          </button>
        </div>

        {/* AI Error display */}
        {aiError && (
          <div className="mt-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-sm flex gap-1.5 items-center font-sans">
            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            <span>{aiError}</span>
          </div>
        )}

        {/* AI Success report */}
        {aiResultSummary && (
          <div className={`mt-3 p-3.5 rounded-lg border flex flex-col gap-2 font-sans ${
            theme === 'natural-tones'
              ? 'bg-natural-sage-light/40 border-natural-border/60'
              : 'bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-100/20 dark:border-emerald-900/10'
          }`}>
            <h4 className="text-sm font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
              AI Successfully Sorted Your Thoughts!
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono text-stone-600 dark:text-stone-400">
              {aiResultSummary.eventsAdded > 0 && (
                <span className="bg-white dark:bg-stone-900 p-1.5 rounded border text-center">
                  📅 {aiResultSummary.eventsAdded} Event(s)
                </span>
              )}
              {aiResultSummary.tasksAdded > 0 && (
                <span className="bg-white dark:bg-stone-900 p-1.5 rounded border text-center">
                  ✓ {aiResultSummary.tasksAdded} Task(s)
                </span>
              )}
              {aiResultSummary.remindersAdded > 0 && (
                <span className="bg-white dark:bg-stone-900 p-1.5 rounded border text-center">
                  🔔 {aiResultSummary.remindersAdded} Goal(s)
                </span>
              )}
              {aiResultSummary.expensesAdded > 0 && (
                <span className="bg-white dark:bg-stone-900 p-1.5 rounded border text-center">
                  💰 {aiResultSummary.expensesAdded} Expense(s)
                </span>
              )}
              {aiResultSummary.journalsAdded > 0 && (
                <span className="bg-white dark:bg-stone-900 p-1.5 rounded border text-center">
                  ✍ {aiResultSummary.journalsAdded} Journal(s)
                </span>
              )}
            </div>
            {aiResultSummary.preferencesRemembered && (
              <p className="text-xs text-stone-550 dark:text-stone-450 italic mt-1 font-sans border-t pt-1.5 border-dashed border-stone-100">
                💡 Remembered preference: "{aiResultSummary.preferencesRemembered}"
              </p>
            )}
          </div>
        )}

        {/* Stored Preferences Section */}
        {state.preferences && (
          <div className="mt-4 p-3.5 bg-stone-50 dark:bg-stone-900/20 border border-stone-200/50 dark:border-stone-800/80 rounded-xl font-sans">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 font-mono">
                AI Remembered Preferences
              </span>
              <button
                onClick={() => {
                  if (window.confirm("Do you want to clear AI remembered preferences?")) {
                    onUpdateState(prev => ({ ...prev, preferences: undefined }));
                  }
                }}
                className="text-xs font-mono text-rose-600 hover:underline cursor-pointer"
              >
                Reset Preferences
              </button>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed bg-white dark:bg-stone-950/40 p-3 rounded-lg border border-stone-100 dark:border-stone-900 font-mono">
              {state.preferences}
            </p>
          </div>
        )}

      </div>

    </div>
  );
}
