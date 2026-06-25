import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Tag, Calendar, Sparkles, Check, CheckCircle2, ChevronLeft, ChevronRight, AlertCircle, Bookmark, Cloud, Info, BarChart3, ChevronDown, ChevronUp, TrendingUp, Wallet } from 'lucide-react';
import { PlannerState, PlannerEvent, PlannerTask, PlannerReminder, PlannerExpense, TaskTag, ThemeType } from '../types';
import { Language, translations } from '../lib/localization';

interface TodayViewProps {
  selectedDate: string; // YYYY-MM-DD
  state: PlannerState;
  onUpdateState: (updater: (prev: PlannerState) => PlannerState) => void;
  theme: ThemeType;
  userEmail?: string | null;
  onOpenAuth?: () => void;
  onOffsetDate?: (offset: number) => void;
  onJumpToToday?: () => void;
  language: Language;
}

export default function TodayView({ selectedDate, state, onUpdateState, theme, userEmail, onOpenAuth, onOffsetDate, onJumpToToday, language }: TodayViewProps) {

  // State to track item detail popover/modal editing
  const [editingItem, setEditingItem] = useState<{
    type: 'task' | 'reminder';
    id: string;
    title: string;
    tag?: TaskTag;
    memo?: string;
  } | null>(null);

  // Local state for forms
  const [eventTime, setEventTime] = useState('12:00');
  const [eventTitle, setEventTitle] = useState('');
  const [showAddEvent, setShowAddEvent] = useState(false);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskTag, setTaskTag] = useState<TaskTag>('None');

  const [reminderTitle, setReminderTitle] = useState('');

  const [smartExpenseInput, setSmartExpenseInput] = useState('');
  const [isParsingSmartExpense, setIsParsingSmartExpense] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showManualExpenseForm, setShowManualExpenseForm] = useState(false);

  const [expenseType, setExpenseType] = useState<'expense' | 'income'>('expense');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('food');
  const [expenseNote, setExpenseNote] = useState('');

  const expenseCategories = ['food', 'clothing', 'housing', 'transit', 'education', 'entertainment', 'other'];
  const incomeCategories = ['salary', 'other'];

  useEffect(() => {
    setExpenseCategory(expenseType === 'expense' ? 'food' : 'salary');
  }, [expenseType]);

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

  // Sum spending and incomes
  const totalExpenses = dayExpenses.filter(ex => ex.type !== 'income').reduce((sum, ex) => sum + ex.amount, 0);
  const totalIncome = dayExpenses.filter(ex => ex.type === 'income').reduce((sum, ex) => sum + ex.amount, 0);
  const netBalance = totalIncome - totalExpenses;
  const totalSpending = totalExpenses;

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
              category: ex.category || 'other',
              note: ex.note || 'Unnoted',
              type: ex.type || 'expense'
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
      tag: 'None',
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

  const handleSaveItemDetails = () => {
    if (!editingItem) return;
    onUpdateState(prev => {
      if (editingItem.type === 'task') {
        return {
          ...prev,
          tasks: prev.tasks.map(t => t.id === editingItem.id ? {
            ...t,
            title: editingItem.title,
            tag: editingItem.tag || 'None',
            memo: editingItem.memo || ''
          } : t)
        };
      } else {
        return {
          ...prev,
          reminders: prev.reminders.map(r => r.id === editingItem.id ? {
            ...r,
            title: editingItem.title,
            tag: editingItem.tag || 'None',
            memo: editingItem.memo || ''
          } : r)
        };
      }
    });
    setEditingItem(null);
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
      note: expenseNote.trim() || 'Unnoted',
      type: expenseType
    };

    onUpdateState(prev => ({
      ...prev,
      expenses: [...prev.expenses, newExpense]
    }));

    setExpenseAmount('');
    setExpenseNote('');
  };

  const handleSmartExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartExpenseInput.trim()) return;

    setIsParsingSmartExpense(true);

    // Short smart simulation delay for smooth UX feeling
    await new Promise(resolve => setTimeout(resolve, 350));

    const input = smartExpenseInput.trim();
    const amountRegex = /(?:NT\$?|\$)?\s*([0-9]+(?:[,.][0-9]+)?)\s*(?:元|nt|usd|hkd|rmb|dollars|bucks)?/i;
    const match = input.match(amountRegex);
    
    let amount = 0;
    if (match && match[1]) {
      amount = parseFloat(match[1].replace(/,/g, ''));
    }

    if (isNaN(amount) || amount <= 0) {
      setIsParsingSmartExpense(false);
      return;
    }

    let note = input;
    if (match && match[0]) {
      note = note.replace(match[0], '');
    }
    note = note.replace(/[,.，。!！?？]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!note) {
      note = language === 'zh-TW' ? '未命名項目' : 'Unnamed Item';
    }

    const incomeKeywords = ['薪', '資', '收入', '賺', '紅包', '獎金', '外快', '利息', 'salary', 'income', 'bonus', 'earned', 'pay', 'inc'];
    const isIncome = incomeKeywords.some(keyword => input.toLowerCase().includes(keyword));
    const type: 'expense' | 'income' = isIncome ? 'income' : 'expense';

    let category = 'other';
    if (isIncome) {
      if (input.includes('薪水') || input.includes('薪資') || input.toLowerCase().includes('salary') || input.toLowerCase().includes('pay')) {
        category = 'salary';
      } else {
        category = 'other';
      }
    } else {
      const foodKeywords = ['外送', '吃', '餐', '飯', '麵', '蛋', '飲料', '茶', '肉', '咖啡', '午餐', '晚餐', '早餐', '麥當勞', 'food', 'drink', 'eat', 'lunch', 'dinner', 'restaurant', 'cafe'];
      const clothingKeywords = ['衣服', '褲子', '鞋', '衣', '飾品', '買衣服', '裙', 'clothes', 'wear', 'shirt', 'shoes', 'boutique'];
      const housingKeywords = ['租', '房', '住', '水電', '瓦斯', '管理費', '電費', 'rent', 'housing', 'electricity', 'water bill', 'utilities'];
      const transitKeywords = ['捷運', '公車', '計程車', '高鐵', '火車', '車資', '行', '油', '交通', '機車', '悠遊卡', 'bus', 'taxi', 'mrt', 'gas', 'metro', 'train', 'uber'];
      const educationKeywords = ['書', '學費', '課程', '課', '育', '文具', '筆記', 'book', 'school', 'course', 'class', 'tuition'];
      const entertainmentKeywords = ['電影', '遊戲', '玩', '樂', '唱歌', 'ktv', '歡樂', '景點', '門票', '娛樂', '育樂', '課金', '玩具', 'movie', 'game', 'fun', 'play', 'amusement'];

      if (foodKeywords.some(kw => input.toLowerCase().includes(kw))) {
        category = 'food';
      } else if (clothingKeywords.some(kw => input.toLowerCase().includes(kw))) {
        category = 'clothing';
      } else if (housingKeywords.some(kw => input.toLowerCase().includes(kw))) {
        category = 'housing';
      } else if (transitKeywords.some(kw => input.toLowerCase().includes(kw))) {
        category = 'transit';
      } else if (educationKeywords.some(kw => input.toLowerCase().includes(kw))) {
        category = 'education';
      } else if (entertainmentKeywords.some(kw => input.toLowerCase().includes(kw))) {
        category = 'entertainment';
      }
    }

    const newExpense: PlannerExpense = {
      id: `ex-${Date.now()}`,
      date: selectedDate,
      amount,
      category,
      note,
      type
    };

    onUpdateState(prev => ({
      ...prev,
      expenses: [...prev.expenses, newExpense]
    }));

    setSmartExpenseInput('');
    setIsParsingSmartExpense(false);
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
    if (!selectedDate || typeof selectedDate !== 'string') {
      return { weekday: '', dateString: '' };
    }
    const parts = selectedDate.split('-');
    if (parts.length < 3) return { weekday: '', dateString: selectedDate };
    
    const [year, month, day] = parts.map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      return { weekday: '', dateString: selectedDate };
    }
    const dateObj = new Date(year, month - 1, day);
    
    if (language === 'zh-TW') {
      const weekday = dateObj.toLocaleDateString('zh-TW', { weekday: 'long' });
      const dateString = `${year}年${month}月${day}日`;
      return { weekday, dateString };
    } else {
      const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
      const monthName = dateObj.toLocaleDateString('en-US', { month: 'long' });
      const dayOfMonth = dateObj.getDate();
      const fullYear = dateObj.getFullYear();
      return { weekday, dateString: `${monthName} ${dayOfMonth}, ${fullYear}` };
    }
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
      {/* Date Header Title with Inline Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-stone-200 dark:border-stone-800 pb-5 mb-3 gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <span className={`text-xs sm:text-sm font-mono uppercase tracking-widest ${getWeekdayTextClass()}`}>
              {weekday}
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-light text-stone-800 dark:text-stone-100 tracking-tight mt-1">
              {dateString}
            </h2>
          </div>

          {/* Inline Navigation Buttons */}
          {onOffsetDate && onJumpToToday && (
            <div className="flex items-center border border-stone-200 dark:border-stone-800 rounded-lg bg-white dark:bg-stone-950 p-1 shadow-2xs">
              <button
                onClick={() => onOffsetDate(-1)}
                className="p-1.5 hover:bg-stone-50 dark:hover:bg-stone-900 rounded text-stone-600 dark:text-stone-400 transition-colors cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={onJumpToToday}
                className="px-3 py-1 text-xs font-mono font-medium hover:bg-stone-50 dark:hover:bg-stone-900 rounded text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                title="Jump to Today"
              >
                {translations[language]['tab.today']}
              </button>
              <button
                onClick={() => onOffsetDate(1)}
                className="p-1.5 hover:bg-stone-50 dark:hover:bg-stone-900 rounded text-stone-600 dark:text-stone-400 transition-colors cursor-pointer"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs sm:text-sm font-mono text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-900/60 px-4 py-2.5 rounded-lg border border-stone-100 dark:border-stone-800">
          <span className={`w-2.5 h-2.5 rounded-full ${userEmail ? 'bg-sky-500' : 'bg-emerald-500'} animate-pulse`}></span>
          {userEmail ? translations[language]['today.cloud_backup_synced'] : translations[language]['today.guest_mode']}
        </div>
      </div>

      {/* Cloud Backup Promotion Banner (only for Guests / local-only mode) */}
      {!userEmail && (
        <div className={`p-6 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5 ${
          theme === 'natural-tones'
            ? 'bg-natural-sage-light/25 border-natural-border/50 rounded-[24px]'
            : 'bg-amber-50/40 dark:bg-amber-950/10 border-amber-100/50 dark:border-amber-900/30'
        }`} id="cloud-sync-banner">
          <div className="flex gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
              theme === 'natural-tones' ? 'bg-natural-sage/10 text-natural-sage' : 'bg-amber-100/50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400'
            }`}>
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-stone-800 dark:text-stone-200">
                {translations[language]['today.offline_guest_mode']}
              </h4>
              <p className="text-[14px] text-stone-600 dark:text-stone-400 mt-1 leading-relaxed font-sans">
                {translations[language]['today.offline_desc']}
              </p>
            </div>
          </div>
          <button
            onClick={onOpenAuth}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-1.5 shrink-0 shadow-2xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer ${
              theme === 'natural-tones'
                ? 'bg-natural-sage text-white hover:bg-natural-sage/95'
                : 'bg-stone-800 hover:bg-stone-900 text-white dark:bg-stone-200 dark:text-stone-950 dark:hover:bg-stone-100'
            }`}
          >
            <span>{translations[language]['today.cloud_backup']}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* SECTION 1: EVENTS */}
      <div className={getEventsCardClass()} id="events-card">
        <div className="flex justify-between items-center mb-3">
          <h3 className={getSectionHeaderClass()}>
            {translations[language]['today.scheduled_events']}
          </h3>
          <button
            onClick={() => setShowAddEvent(!showAddEvent)}
            className={`flex items-center gap-1 text-xs font-medium border px-3 py-1.5 rounded-lg transition-all cursor-pointer ${getButtonAccentClass()}`}
          >
            <Plus className="w-3.5 h-3.5" />
            {showAddEvent ? translations[language]['today.cancel'] : translations[language]['today.add_event']}
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
              placeholder={translations[language]['today.placeholder_event_title']}
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="flex-1 min-w-[150px] px-3.5 py-2 text-sm border border-stone-200 dark:border-stone-800 rounded-lg bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-natural-sage placeholder-stone-400 dark:placeholder-stone-600"
              required
            />
            <button
              type="submit"
              className={`px-4 py-2 text-sm rounded-lg transition-colors font-medium cursor-pointer ${getSubmitButtonClass()}`}
            >
              {translations[language]['today.save']}
            </button>
          </form>
        )}

        {/* Events List */}
        {dayEvents.length === 0 ? (
          <p className="text-sm text-stone-400 dark:text-stone-500 italic py-3 text-center">
            {translations[language]['today.no_events']}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT: TODAY'S TASKS */}
        <div className={`p-6 flex flex-col justify-between ${
          theme === 'natural-tones'
            ? 'bg-white border border-natural-border rounded-[24px] shadow-2xs'
            : 'bg-white dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800'
        }`} id="tasks-card">
          <div>
            <h3 className="text-base font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-4 border-b border-stone-100 dark:border-stone-900 pb-2 flex items-center justify-between">
              <span className={theme === 'natural-tones' ? 'text-xs font-bold uppercase tracking-[0.1em] text-natural-muted' : ''}>
                {translations[language]['today.todays_tasks']}
              </span>
              <span className="text-xs font-mono text-stone-400 dark:text-stone-500 font-normal">
                {dayTasks.filter(t => t.completed).length}/{dayTasks.length} {translations[language]['today.done']}
              </span>
            </h3>

            {/* Task input at top of card (no tag selector by default) */}
            <form onSubmit={handleAddTask} className="mb-5">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={translations[language]['today.placeholder_task']}
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className={`flex-1 px-4 py-2.5 text-base border rounded-lg bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100 focus:outline-none placeholder-stone-450 dark:placeholder-stone-500 ${
                    theme === 'natural-tones' ? 'border-natural-border focus:ring-1 focus:ring-natural-sage' : 'border-stone-200 dark:border-stone-800 focus:outline-amber-600'
                  }`}
                  required
                />
                <button
                  type="submit"
                  className={`px-4.5 border text-stone-700 dark:text-stone-300 rounded-lg cursor-pointer transition-colors ${
                    theme === 'natural-tones'
                      ? 'bg-white hover:bg-natural-sage-light border-natural-border text-natural-sage'
                      : 'bg-stone-100 dark:bg-stone-900 hover:bg-amber-100/50 dark:hover:bg-amber-950/30 border-stone-200 dark:border-stone-800'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </form>

            {/* Tasks list */}
            {dayTasks.length === 0 ? (
              <p className="text-base text-stone-400 dark:text-stone-500 italic py-8 text-center">
                {translations[language]['today.no_tasks']}
              </p>
            ) : (
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {dayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="group flex justify-between items-center py-2.5 px-3 hover:bg-stone-50/70 dark:hover:bg-stone-900/60 rounded-lg transition-all border border-transparent hover:border-stone-100 dark:hover:border-stone-900/40"
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleTask(task.id)}
                        className={`w-5.5 h-5.5 rounded-[6px] border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
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
                          <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                        )}
                      </button>
                      
                      <div 
                        onClick={() => setEditingItem({
                          type: 'task',
                          id: task.id,
                          title: task.title,
                          tag: task.tag,
                          memo: task.memo || ''
                        })}
                        className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer group-hover:text-amber-800 dark:group-hover:text-amber-500 transition-colors"
                        title="Click to view more info"
                      >
                        <span
                          className={`text-base select-none truncate transition-all font-sans ${
                            task.completed
                              ? 'line-through text-stone-400 dark:text-stone-600 opacity-60'
                              : 'text-stone-800 dark:text-stone-200 font-medium'
                          }`}
                        >
                          {task.title}
                        </span>

                        {task.memo && (
                          <Bookmark className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 shrink-0" title={task.memo} />
                        )}

                        {task.tag && task.tag !== 'None' && (
                          <span className={`text-[11px] font-sans font-medium px-2.5 py-0.5 rounded-full shrink-0 ${getTagStyle(task.tag)}`}>
                            {task.tag}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-600 transition-all p-1 hover:bg-stone-50 dark:hover:bg-stone-900 rounded cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: REMINDERS */}
        <div className={`p-6 flex flex-col justify-between ${
          theme === 'natural-tones'
            ? 'bg-white border border-natural-border rounded-[24px] shadow-2xs'
            : 'bg-white dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800'
        }`} id="reminders-card">
          <div>
            <h3 className="text-base font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-4 border-b border-stone-100 dark:border-stone-900 pb-2">
              <span className={theme === 'natural-tones' ? 'text-xs font-bold uppercase tracking-[0.1em] text-natural-muted' : ''}>
                {translations[language]['today.bullet_reminders']}
              </span>
            </h3>

            {/* Reminder entry */}
            <form onSubmit={handleAddReminder} className="mb-5 flex gap-2">
              <input
                type="text"
                placeholder={translations[language]['today.placeholder_reminder']}
                value={reminderTitle}
                onChange={(e) => setReminderTitle(e.target.value)}
                className={`flex-1 px-4 py-2.5 text-base border rounded-lg bg-stone-50 dark:bg-stone-900 text-stone-800 dark:text-stone-100 focus:outline-none placeholder-stone-450 dark:placeholder-stone-500 ${
                  theme === 'natural-tones' ? 'border-natural-border focus:ring-1 focus:ring-natural-sage' : 'border-stone-200 dark:border-stone-800 focus:outline-amber-600'
                }`}
                required
              />
              <button
                type="submit"
                className={`px-4.5 border text-stone-700 dark:text-stone-300 rounded-lg cursor-pointer transition-colors ${
                  theme === 'natural-tones'
                    ? 'bg-white hover:bg-natural-sage-light border-natural-border text-natural-sage'
                    : 'bg-stone-100 dark:bg-stone-900 hover:bg-amber-100/50 dark:hover:bg-amber-950/30 border-stone-200 dark:border-stone-800'
                }`}
              >
                <Plus className="w-5 h-5" />
              </button>
            </form>


            {/* Reminders List */}
            {dayReminders.length === 0 ? (
              <p className="text-base text-stone-400 dark:text-stone-500 italic py-8 text-center">
                {translations[language]['today.no_reminders']}
              </p>
            ) : (
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {dayReminders.map((rem) => (
                  <div
                    key={rem.id}
                    className="group flex justify-between items-start py-2.5 px-3 hover:bg-stone-50/70 dark:hover:bg-stone-900/60 rounded-lg transition-all border border-transparent hover:border-stone-100 dark:hover:border-stone-900/40"
                  >
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <span
                        onClick={() => handleToggleReminder(rem.id)}
                        className={`w-2.5 h-2.5 rounded-full mt-2.5 cursor-pointer transition-all shrink-0 ${
                          rem.completed
                            ? theme === 'natural-tones'
                              ? 'bg-natural-border'
                              : 'bg-stone-300 dark:bg-stone-700'
                            : theme === 'natural-tones'
                            ? 'bg-natural-sage'
                            : 'bg-amber-600 dark:bg-amber-500'
                        }`}
                      ></span>
                      
                      <div
                        onClick={() => setEditingItem({
                          type: 'reminder',
                          id: rem.id,
                          title: rem.title,
                          tag: rem.tag || 'None',
                          memo: rem.memo || ''
                        })}
                        className="flex flex-wrap items-center gap-2 flex-1 min-w-0 cursor-pointer group-hover:text-amber-800 dark:group-hover:text-amber-500 transition-colors"
                        title="Click to view more info"
                      >
                        <span
                          className={`text-base cursor-pointer select-none leading-normal ${
                            rem.completed
                              ? 'line-through text-stone-400 dark:text-stone-600 opacity-60 font-sans'
                              : 'text-stone-800 dark:text-stone-200 font-sans font-medium'
                          }`}
                        >
                          {rem.title}
                        </span>

                        {rem.memo && (
                          <Bookmark className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 shrink-0" title={rem.memo} />
                        )}

                        {rem.tag && rem.tag !== 'None' && (
                          <span className={`text-[11px] font-sans font-medium px-2.5 py-0.5 rounded-full shrink-0 ${getTagStyle(rem.tag)}`}>
                            {rem.tag}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteReminder(rem.id)}
                      className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-rose-600 transition-all p-1 hover:bg-stone-50 dark:hover:bg-stone-900 rounded cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
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
                <span className={theme === 'natural-tones' ? 'text-xs font-bold uppercase tracking-[0.1em] text-natural-muted' : ''}>
                  {translations[language]['today.daily_journal']}
                </span>
              </h3>
              <span className="text-xs font-mono text-stone-400 dark:text-stone-500">
                {journalSaveStatus === 'saving' && translations[language]['today.journal_saving']}
                {journalSaveStatus === 'saved' && translations[language]['today.journal_saved']}
                {journalSaveStatus === 'idle' && translations[language]['today.journal_idle']}
              </span>
            </div>

            {/* Notepad area */}
            <div className="relative flex-1">
              <textarea
                value={dayJournal}
                onChange={(e) => handleJournalChange(e.target.value)}
                placeholder={translations[language]['today.placeholder_journal']}
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
            <div className="flex justify-between items-center mb-3 border-b border-stone-100 dark:border-stone-900 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                <span className={theme === 'natural-tones' ? 'text-xs font-bold uppercase tracking-[0.1em] text-natural-muted' : ''}>
                  {translations[language]['today.expenses_tracker']}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                  theme === 'natural-tones'
                    ? 'border-natural-border bg-white text-natural-sage hover:bg-natural-sage-light'
                    : 'border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-900 text-stone-600 dark:text-stone-400'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-natural-sage" />
                <span>{translations[language]['today.view_report']}</span>
              </button>
            </div>

            {/* Total cards summary */}
            <div className="grid grid-cols-3 gap-2 mb-3.5">
              <div className="p-2 bg-stone-105/40 dark:bg-stone-900/40 rounded-lg border border-stone-200/40 dark:border-stone-800/40 text-center">
                <span className="block text-[10px] font-mono text-stone-400 dark:text-stone-500 uppercase">
                  {language === 'zh-TW' ? '總支出' : 'Total Exp'}
                </span>
                <span className="text-sm font-bold text-rose-600 dark:text-rose-450">
                  NT$ {totalExpenses}
                </span>
              </div>
              <div className="p-2 bg-stone-105/40 dark:bg-stone-900/40 rounded-lg border border-stone-200/40 dark:border-stone-800/40 text-center">
                <span className="block text-[10px] font-mono text-stone-400 dark:text-stone-500 uppercase">
                  {language === 'zh-TW' ? '總收入' : 'Total Inc'}
                </span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-450">
                  NT$ {totalIncome}
                </span>
              </div>
              <div className="p-2 bg-stone-105/40 dark:bg-stone-900/40 rounded-lg border border-stone-200/40 dark:border-stone-800/40 text-center">
                <span className="block text-[10px] font-mono text-stone-400 dark:text-stone-500 uppercase">
                  {language === 'zh-TW' ? '結餘' : 'Balance'}
                </span>
                <span className={`text-sm font-bold ${netBalance >= 0 ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-450'}`}>
                  NT$ {netBalance}
                </span>
              </div>
            </div>

            {/* Smart Voice-Like Chatbox entry */}
            <form onSubmit={handleSmartExpenseSubmit} className="mb-3">
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={smartExpenseInput}
                    onChange={(e) => setSmartExpenseInput(e.target.value)}
                    placeholder={translations[language]['today.smart_input_placeholder']}
                    disabled={isParsingSmartExpense}
                    className={`w-full px-3 py-2 pr-8 text-sm border rounded-lg text-stone-800 dark:text-stone-100 focus:outline-none placeholder-stone-400 ${
                      theme === 'natural-tones'
                        ? 'border-natural-border bg-white focus:ring-1 focus:ring-natural-sage'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 focus:outline-amber-600'
                    }`}
                  />
                  {isParsingSmartExpense && (
                    <span className="absolute right-2.5 top-3 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isParsingSmartExpense || !smartExpenseInput.trim()}
                  className={`px-3 py-2 text-sm rounded-lg font-bold flex items-center justify-center gap-1 cursor-pointer shrink-0 transition-all ${
                    theme === 'natural-tones'
                      ? 'bg-natural-sage text-white hover:bg-natural-sage/90 disabled:bg-stone-100 disabled:text-stone-400'
                      : 'bg-stone-800 hover:bg-stone-900 text-white dark:bg-stone-200 dark:text-stone-950 dark:hover:bg-stone-100 disabled:opacity-40'
                  } disabled:cursor-not-allowed`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{translations[language]['today.smart_quick_log']}</span>
                </button>
              </div>
            </form>

            {/* Manual Form Toggle */}
            <div className="mb-3 flex justify-center">
              <button
                type="button"
                onClick={() => setShowManualExpenseForm(!showManualExpenseForm)}
                className="text-xs text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 font-medium flex items-center gap-1 transition-all cursor-pointer py-1 px-2 rounded hover:bg-stone-100/40 dark:hover:bg-stone-900/40"
              >
                {showManualExpenseForm ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                <span>{language === 'zh-TW' ? '手動詳細記帳' : 'Detailed Manual Log'}</span>
              </button>
            </div>

            {/* Collapsible Manual Ledger Form */}
            {showManualExpenseForm && (
              <form onSubmit={handleAddExpense} className={`mb-3.5 space-y-2.5 p-3 border rounded-xl animate-fadeIn ${
                theme === 'natural-tones'
                  ? 'bg-natural-sage-light/40 border-natural-border'
                  : 'bg-stone-50 dark:bg-stone-900/60 border-stone-200/50 dark:border-stone-800'
              }`}>
                {/* Type selector toggle */}
                <div className="flex gap-1 border border-stone-250 dark:border-stone-800 rounded-lg p-0.5 bg-white dark:bg-stone-950 overflow-hidden shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setExpenseType('expense')}
                    className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      expenseType === 'expense'
                        ? theme === 'natural-tones'
                          ? 'bg-natural-sage text-white'
                          : 'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-950'
                        : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    {translations[language]['today.type_expense']}
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpenseType('income')}
                    className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      expenseType === 'income'
                        ? theme === 'natural-tones'
                          ? 'bg-natural-sage text-white'
                          : 'bg-natural-sage/10 text-natural-sage border border-natural-sage-border'
                        : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                    }`}
                  >
                    {translations[language]['today.type_income']}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder={translations[language]['today.amount']}
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
                    {expenseType === 'expense' ? (
                      expenseCategories.map(cat => (
                        <option key={cat} value={cat}>
                          {translations[language][`category.${cat}`]}
                        </option>
                      ))
                    ) : (
                      incomeCategories.map(cat => (
                        <option key={cat} value={cat}>
                          {translations[language][`category.${cat}`]}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder={translations[language]['today.note']}
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
                    {translations[language]['today.save']}
                  </button>
                </div>
              </form>
            )}

            {/* Ledger logs list */}
            {dayExpenses.length === 0 ? (
              <p className="text-sm text-stone-400 dark:text-stone-500 italic py-6 text-center">
                {translations[language]['today.no_expenses']}
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
                      <span className={`font-mono font-bold text-sm shrink-0 ${
                        ex.type === 'income' 
                          ? 'text-emerald-600 dark:text-emerald-400' 
                          : 'text-rose-600 dark:text-rose-450'
                      }`}>
                        {ex.type === 'income' ? '+' : '-'} NT$ {ex.amount}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-sans font-medium uppercase tracking-wider ${
                        ex.type === 'income'
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-100/30'
                          : theme === 'natural-tones'
                          ? 'bg-natural-tag-bg text-natural-tag-text'
                          : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                      }`}>
                        {translations[language][`category.${ex.category}`] || ex.category}
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
      <div className={`p-4 ${
        theme === 'natural-tones'
          ? 'bg-white border border-natural-border rounded-[24px] shadow-2xs'
          : 'bg-white dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800'
      }`} id="braindump-card">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className={`w-4 h-4 ${theme === 'natural-tones' ? 'text-natural-sage' : 'text-amber-850 dark:text-amber-500'}`} />
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-450">
              <span className={theme === 'natural-tones' ? 'text-xs font-bold uppercase tracking-[0.1em] text-natural-muted' : ''}>
                {translations[language]['today.ai_brain_dump']}
              </span>
            </h3>
          </div>
          <span className="text-[11px] font-mono text-stone-400 dark:text-stone-500">
            {aiProcessing ? (
              <span className="animate-pulse text-amber-700 dark:text-amber-400 font-bold">{translations[language]['today.ai_processing']}</span>
            ) : (
              <>
                {brainDumpSaveStatus === 'saving' && (language === 'zh-TW' ? '儲存中...' : 'Saving...')}
                {brainDumpSaveStatus === 'saved' && (language === 'zh-TW' ? '已儲存' : 'Saved draft')}
              </>
            )}
          </span>
        </div>

        {/* Single Chatbox Layout */}
        <div className="relative flex gap-2 items-end border border-stone-200 dark:border-stone-800 rounded-xl bg-stone-50/50 dark:bg-stone-900/40 p-2 focus-within:ring-1 focus-within:ring-natural-sage transition-all">
          <textarea
            value={dayBrainDump}
            onChange={(e) => handleBrainDumpChange(e.target.value)}
            disabled={aiProcessing}
            placeholder={translations[language]['today.placeholder_braindump']}
            rows={1}
            className="flex-1 text-sm font-sans leading-relaxed text-stone-805 dark:text-stone-150 bg-transparent resize-none focus:outline-none px-2 py-1.5 placeholder-stone-400 dark:placeholder-stone-500 min-h-[40px] max-h-[120px]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleOrganizeWithAI();
              }
            }}
          />
          <button
            onClick={handleOrganizeWithAI}
            disabled={aiProcessing || !dayBrainDump.trim()}
            className={`p-2 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer ${
              theme === 'natural-tones'
                ? 'bg-natural-sage text-white hover:bg-natural-sage/90 disabled:bg-stone-100 disabled:text-stone-400'
                : 'bg-stone-800 hover:bg-stone-900 text-white dark:bg-stone-200 dark:text-stone-950 dark:hover:bg-stone-100 disabled:opacity-40'
            } disabled:cursor-not-allowed`}
            title={translations[language]['today.ai_brain_dump']}
          >
            <Sparkles className="w-4 h-4" />
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
              {translations[language]['today.ai_success']}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono text-stone-600 dark:text-stone-400">
              {aiResultSummary.eventsAdded > 0 && (
                <span className="bg-white dark:bg-stone-900 p-1.5 rounded border text-center">
                  📅 {aiResultSummary.eventsAdded} {translations[language]['today.event_count']}
                </span>
              )}
              {aiResultSummary.tasksAdded > 0 && (
                <span className="bg-white dark:bg-stone-900 p-1.5 rounded border text-center">
                  ✓ {aiResultSummary.tasksAdded} {translations[language]['today.task_count']}
                </span>
              )}
              {aiResultSummary.remindersAdded > 0 && (
                <span className="bg-white dark:bg-stone-900 p-1.5 rounded border text-center">
                  🔔 {aiResultSummary.remindersAdded} {translations[language]['today.goal_count']}
                </span>
              )}
              {aiResultSummary.expensesAdded > 0 && (
                <span className="bg-white dark:bg-stone-900 p-1.5 rounded border text-center">
                  💰 {aiResultSummary.expensesAdded} {translations[language]['today.expense_count']}
                </span>
              )}
              {aiResultSummary.journalsAdded > 0 && (
                <span className="bg-white dark:bg-stone-900 p-1.5 rounded border text-center">
                  ✍ {aiResultSummary.journalsAdded} {translations[language]['today.journal_count']}
                </span>
              )}
            </div>
            {aiResultSummary.preferencesRemembered && (
              <p className="text-xs text-stone-550 dark:text-stone-450 italic mt-1 font-sans border-t pt-1.5 border-dashed border-stone-100">
                💡 {translations[language]['today.ai_preference']} "{aiResultSummary.preferencesRemembered}"
              </p>
            )}
          </div>
        )}

        {/* Stored Preferences Section */}
        {state.preferences && (
          <div className="mt-4 p-3.5 bg-stone-50 dark:bg-stone-900/20 border border-stone-200/50 dark:border-stone-800/80 rounded-xl font-sans">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 font-mono">
                {translations[language]['today.ai_remembered']}
              </span>
              <button
                onClick={() => {
                  if (window.confirm("Do you want to clear AI remembered preferences?")) {
                    onUpdateState(prev => ({ ...prev, preferences: undefined }));
                  }
                }}
                className="text-xs font-mono text-rose-600 hover:underline cursor-pointer"
              >
                {translations[language]['today.reset_preferences']}
              </button>
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed bg-white dark:bg-stone-950/40 p-3 rounded-lg border border-stone-100 dark:border-stone-900 font-mono">
              {state.preferences}
            </p>
          </div>
        )}

      </div>

      {/* 4. ITEM DETAILS POPOVER / MODAL */}
      {editingItem && (
        <div className="fixed inset-0 bg-stone-900/40 dark:bg-stone-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-[20px] border border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden p-6 font-sans">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-3 mb-4">
              <h4 className="text-base font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
                <Info className="w-4.5 h-4.5 text-natural-sage shrink-0" />
                {editingItem.type === 'task' 
                  ? translations[language]['detail.task_title'] 
                  : translations[language]['detail.reminder_title']}
              </h4>
              <button 
                onClick={() => setEditingItem(null)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-sm font-medium transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4">
              {/* Title Field */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5">
                  {translations[language]['detail.title_label']}
                </label>
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem(prev => prev ? { ...prev, title: e.target.value } : null)}
                  className={`w-full px-3.5 py-2 text-base border rounded-lg bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 focus:outline-none ${
                    theme === 'natural-tones' ? 'border-natural-border focus:ring-1 focus:ring-natural-sage' : 'border-stone-200 dark:border-stone-800 focus:outline-amber-600'
                  }`}
                  required
                />
              </div>

              {/* Tag Selection Field */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5">
                  {translations[language]['detail.tag_label']}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(['Tea', 'Travel', 'College', 'Personal', 'None'] as TaskTag[]).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setEditingItem(prev => prev ? { ...prev, tag } : null)}
                      className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                        editingItem.tag === tag
                          ? theme === 'natural-tones'
                            ? 'bg-natural-sage text-white scale-[1.02] font-semibold'
                            : 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-950 scale-[1.02] font-semibold'
                          : theme === 'natural-tones'
                          ? 'bg-natural-sage-light text-natural-tag-text border border-natural-sage-border/50 hover:bg-natural-tag-bg'
                          : 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
                      }`}
                    >
                      {tag === 'None' ? 'No tag' : tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Memo Textarea Field */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1.5">
                  {translations[language]['detail.memo_label']}
                </label>
                <textarea
                  placeholder={translations[language]['detail.placeholder_memo']}
                  value={editingItem.memo || ''}
                  onChange={(e) => setEditingItem(prev => prev ? { ...prev, memo: e.target.value } : null)}
                  rows={4}
                  className={`w-full px-3.5 py-2 text-base border rounded-lg bg-stone-50 dark:bg-stone-950 text-stone-800 dark:text-stone-100 focus:outline-none resize-none placeholder-stone-400 dark:placeholder-stone-600 ${
                    theme === 'natural-tones' ? 'border-natural-border focus:ring-1 focus:ring-natural-sage' : 'border-stone-200 dark:border-stone-800 focus:outline-amber-600'
                  }`}
                />
              </div>
            </div>

            {/* Modal Footer actions */}
            <div className="flex justify-end gap-3 border-t border-stone-100 dark:border-stone-800 pt-4 mt-5">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 rounded-lg cursor-pointer transition-colors"
              >
                {translations[language]['today.cancel']}
              </button>
              <button
                type="button"
                onClick={handleSaveItemDetails}
                className={`px-5 py-2 text-sm font-semibold rounded-lg shadow-3xs cursor-pointer transition-all ${
                  theme === 'natural-tones'
                    ? 'bg-natural-sage text-white hover:bg-natural-sage/95'
                    : 'bg-stone-800 hover:bg-stone-950 dark:bg-stone-200 dark:text-stone-950 hover:opacity-90'
                }`}
              >
                {translations[language]['detail.save_changes']}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MONTHLY FINANCIAL REPORT MODAL */}
      {showReportModal && (() => {
        const activeMonthStr = selectedDate.substring(0, 7); // e.g. "2026-06"
        const expensesForMonth = state.expenses.filter(ex => ex.date && ex.date.startsWith(activeMonthStr));
        
        const monthlyExpensesTotal = expensesForMonth.filter(ex => ex.type !== 'income').reduce((sum, ex) => sum + ex.amount, 0);
        const monthlyIncomeTotal = expensesForMonth.filter(ex => ex.type === 'income').reduce((sum, ex) => sum + ex.amount, 0);
        const monthlyNetSavings = monthlyIncomeTotal - monthlyExpensesTotal;
        const savingsRate = monthlyIncomeTotal > 0 ? Math.round((monthlyNetSavings / monthlyIncomeTotal) * 100) : 0;

        // Calculate Category Breakdown
        const categoryTotals: Record<string, number> = {};
        expenseCategories.forEach(cat => { categoryTotals[cat] = 0; });
        categoryTotals['other'] = 0;
        expensesForMonth.filter(ex => ex.type !== 'income').forEach(ex => {
          const cat = ex.category || 'other';
          categoryTotals[cat] = (categoryTotals[cat] || 0) + ex.amount;
        });

        // Sorted categories with spending > 0
        const spentCategories = Object.entries(categoryTotals)
          .map(([category, amount]) => ({ category, amount }))
          .filter(item => item.amount > 0)
          .sort((a, b) => b.amount - a.amount);

        // Month formatting helper
        const getMonthDisplay = () => {
          const parts = selectedDate.split('-');
          if (parts.length < 2) return selectedDate;
          const [year, month] = parts;
          const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
          if (language === 'zh-TW') {
            return `${year} 年 ${parseInt(month)} 月`;
          } else {
            return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          }
        };

        return (
          <div className="fixed inset-0 bg-stone-900/45 dark:bg-stone-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-xl bg-white dark:bg-stone-900 rounded-[24px] border border-stone-200 dark:border-stone-800 shadow-2xl overflow-hidden p-6 font-sans">
              
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-stone-100 dark:border-stone-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-natural-sage shrink-0" />
                  <div>
                    <h4 className="text-base font-bold text-stone-850 dark:text-stone-100 leading-tight">
                      {translations[language]['today.monthly_report']}
                    </h4>
                    <p className="text-xs font-mono text-stone-400 dark:text-stone-550 mt-0.5">
                      {getMonthDisplay()}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-sm font-bold transition-colors cursor-pointer w-7 h-7 flex items-center justify-center rounded-full hover:bg-stone-50 dark:hover:bg-stone-800"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body (Scrollable if content gets large) */}
              <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
                
                {/* 1. Key Metrics Bento Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-rose-50/30 dark:bg-rose-950/5 rounded-xl border border-rose-100/30 dark:border-rose-900/10">
                    <span className="block text-[10px] font-mono text-stone-450 dark:text-stone-500 uppercase font-semibold">
                      {language === 'zh-TW' ? '本月總支出' : 'Monthly Exp'}
                    </span>
                    <span className="text-lg font-extrabold text-rose-600 dark:text-rose-450 mt-1 block">
                      NT$ {monthlyExpensesTotal}
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-50/30 dark:bg-emerald-950/5 rounded-xl border border-emerald-100/30 dark:border-emerald-900/10">
                    <span className="block text-[10px] font-mono text-stone-450 dark:text-stone-500 uppercase font-semibold">
                      {language === 'zh-TW' ? '本月總收入' : 'Monthly Inc'}
                    </span>
                    <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-450 mt-1 block">
                      NT$ {monthlyIncomeTotal}
                    </span>
                  </div>
                  <div className="p-3 bg-stone-105/40 dark:bg-stone-900/40 rounded-xl border border-stone-200/40 dark:border-stone-800/40 col-span-2 flex justify-between items-center">
                    <div>
                      <span className="block text-[10px] font-mono text-stone-450 dark:text-stone-500 uppercase font-semibold">
                        {language === 'zh-TW' ? '本月淨收支' : 'Monthly Savings'}
                      </span>
                      <span className={`text-base font-extrabold mt-0.5 block ${monthlyNetSavings >= 0 ? 'text-emerald-600 dark:text-emerald-455' : 'text-rose-600 dark:text-rose-455'}`}>
                        NT$ {monthlyNetSavings}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] font-mono text-stone-450 dark:text-stone-500 uppercase font-semibold">
                        {translations[language]['today.net_savings']}
                      </span>
                      <span className="text-base font-extrabold mt-0.5 block text-stone-800 dark:text-stone-200">
                        {savingsRate}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Category Progress Bars */}
                <div>
                  <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-2.5">
                    {translations[language]['today.monthly_breakdown']}
                  </h5>
                  {spentCategories.length === 0 ? (
                    <p className="text-xs text-stone-400 dark:text-stone-500 italic py-2 text-center">
                      {translations[language]['today.no_monthly_expenses']}
                    </p>
                  ) : (
                    <div className="space-y-2.5 bg-stone-50/50 dark:bg-stone-950/20 p-3.5 rounded-xl border border-stone-100 dark:border-stone-900/50">
                      {spentCategories.map(({ category, amount }) => {
                        const percent = monthlyExpensesTotal > 0 ? Math.round((amount / monthlyExpensesTotal) * 100) : 0;
                        return (
                          <div key={category} className="space-y-1">
                            <div className="flex justify-between text-xs text-stone-650 dark:text-stone-355 font-sans font-medium">
                              <span className="flex items-center gap-1">
                                {translations[language][`category.${category}`] || category}
                              </span>
                              <span className="font-mono">
                                NT$ {amount} ({percent}%)
                              </span>
                            </div>
                            <div className="w-full bg-stone-100 dark:bg-stone-850 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-natural-sage h-full rounded-full transition-all"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. This Month's Items List */}
                <div>
                  <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-2.5">
                    {translations[language]['today.monthly_item_list']}
                  </h5>
                  {expensesForMonth.length === 0 ? (
                    <p className="text-xs text-stone-400 dark:text-stone-500 italic py-4 text-center">
                      {translations[language]['today.no_monthly_expenses']}
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {expensesForMonth.map((ex) => (
                        <div 
                          key={ex.id}
                          className="flex justify-between items-center py-2 px-2.5 border border-stone-100 dark:border-stone-900/60 rounded-lg text-xs bg-white dark:bg-stone-950"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-stone-400 dark:text-stone-550 shrink-0">
                              {ex.date ? ex.date.substring(8, 10) : '--'}
                            </span>
                            <span className={`font-mono font-bold ${ex.type === 'income' ? 'text-emerald-600 dark:text-emerald-450' : 'text-rose-600 dark:text-rose-450'}`}>
                              {ex.type === 'income' ? '+' : '-'} NT$ {ex.amount}
                            </span>
                            <span className="text-stone-555 dark:text-stone-400 font-sans truncate max-w-[130px]">
                              {ex.note}
                            </span>
                          </div>
                          <span className="text-[10px] font-sans bg-stone-100 dark:bg-stone-850 text-stone-500 dark:text-stone-400 px-1.5 py-0.5 rounded-full shrink-0">
                            {translations[language][`category.${ex.category}`] || ex.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="flex justify-end border-t border-stone-100 dark:border-stone-800 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className={`px-5 py-2 text-sm font-semibold rounded-lg cursor-pointer transition-all ${
                    theme === 'natural-tones'
                      ? 'bg-natural-sage text-white hover:bg-natural-sage/95'
                      : 'bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-950 hover:opacity-90'
                  }`}
                >
                  {translations[language]['detail.close']}
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
