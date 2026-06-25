export type TaskTag = 'Tea' | 'Travel' | 'College' | 'Personal' | 'None';

export interface PlannerEvent {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  title: string;
}

export interface PlannerTask {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  tag: TaskTag;
  completed: boolean;
}

export interface PlannerReminder {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  completed?: boolean;
}

export interface PlannerJournal {
  id: string;
  date: string; // YYYY-MM-DD
  content: string;
}

export interface PlannerExpense {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  category: string;
  note: string;
}

export interface PlannerBrainDump {
  id: string;
  date: string; // YYYY-MM-DD
  content: string;
}

export interface PlannerState {
  events: PlannerEvent[];
  tasks: PlannerTask[];
  reminders: PlannerReminder[];
  journals: PlannerJournal[];
  expenses: PlannerExpense[];
  brainDumps: PlannerBrainDump[];
  preferences?: string;
}

export type ThemeType = 'natural-tones' | 'warm-paper' | 'slate-clean' | 'charcoal-dark';
