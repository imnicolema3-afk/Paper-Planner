import React, { useState } from 'react';
import { BookOpen, Database, FolderTree, Layout, FileCode, CheckSquare, Sparkles, Copy, Check } from 'lucide-react';

export default function SpecsPortal() {
  const [activeTab, setActiveTab] = useState<'architecture' | 'schema' | 'folder' | 'wireframe' | 'roadmap'>('architecture');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sqlSchema = `-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Define Custom Type for Task Tags
create type task_tag as enum ('Tea', 'Travel', 'College', 'Personal', 'None');

-- 1. EVENTS TABLE
create table events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  time time not null,
  title text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Events
alter table events enable row level security;

create policy "Users can manage their own events"
  on events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 2. TASKS TABLE
create table tasks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  title text not null,
  tag task_tag default 'None'::task_tag not null,
  completed boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Tasks
alter table tasks enable row level security;

create policy "Users can manage their own tasks"
  on tasks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. REMINDERS TABLE
create table reminders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  title text not null,
  completed boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Reminders
alter table reminders enable row level security;

create policy "Users can manage their own reminders"
  on reminders for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. JOURNAL ENTRIES TABLE
create table journal_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_user_date_journal unique (user_id, date)
);

-- Enable RLS for Journal
alter table journal_entries enable row level security;

create policy "Users can manage their own journal entries"
  on journal_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 5. EXPENSES TABLE
create table expenses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  amount numeric(12,2) not null check (amount >= 0),
  category text not null,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Expenses
alter table expenses enable row level security;

create policy "Users can manage their own expenses"
  on expenses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 6. BRAIN DUMP ENTRIES TABLE
create table brain_dump_entries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint unique_user_date_braindump unique (user_id, date)
);

-- Enable RLS for Brain Dump
alter table brain_dump_entries enable row level security;

create policy "Users can manage their own brain dump entries"
  on brain_dump_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- PERFORMANCE INDEXES (Optimized for Daily Date-based queries)
create index idx_events_user_date on events(user_id, date);
create index idx_tasks_user_date on tasks(user_id, date);
create index idx_reminders_user_date on reminders(user_id, date);
create index idx_expenses_user_date on expenses(user_id, date);
`;

  return (
    <div className="max-w-4xl mx-auto py-4 px-2" id="specs-portal-container">
      {/* Header */}
      <div className="border-b border-stone-200 dark:border-stone-800 pb-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-6 h-6 text-amber-700 dark:text-amber-500" />
          <h1 className="text-2xl font-serif font-medium text-stone-800 dark:text-stone-100">
            Technical Specification & Developer Portal
          </h1>
        </div>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Complete production blueprint for building the minimalist iPad planner using Next.js 15, Supabase, and Tailwind CSS.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-stone-200 dark:border-stone-800 pb-2">
        {[
          { id: 'architecture', label: 'Architecture', icon: BookOpen },
          { id: 'schema', label: 'Database Schema', icon: Database },
          { id: 'folder', label: 'Folder Structure', icon: FolderTree },
          { id: 'wireframe', label: 'UI Wireframe', icon: Layout },
          { id: 'roadmap', label: 'Next.js MVP Roadmap', icon: CheckSquare },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-amber-100/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-900 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* TAB 1: ARCHITECTURE */}
        {activeTab === 'architecture' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800/60">
              <h2 className="text-lg font-serif font-medium text-stone-800 dark:text-stone-100 mb-3">
                1. Product & Systems Architecture
              </h2>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-4">
                The core architectural tenet of this life management app is <strong>absolute cognitive relief</strong>. 
                Instead of micro-managing or complex dashboard widgets, the system replicates the flow of a traditional paper planner.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                <div className="p-4 bg-white dark:bg-stone-950 rounded-lg border border-stone-200 dark:border-stone-800">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-500 mb-2">
                    Client & State Engine
                  </h3>
                  <ul className="text-xs text-stone-600 dark:text-stone-400 space-y-2 list-disc list-inside">
                    <li><strong>Single-screen layout:</strong> All daily data modules are visual simultaneously on iPad landscape.</li>
                    <li><strong>Context-based State:</strong> React context holds active date configuration; switching dates in the mini-calendar swaps all underlying datasets instantly.</li>
                    <li><strong>Offline-First Synchronization:</strong> Write directly to client state, save instantly in memory/LocalStorage, and queue background requests to Supabase PostgreSQL.</li>
                  </ul>
                </div>

                <div className="p-4 bg-white dark:bg-stone-950 rounded-lg border border-stone-200 dark:border-stone-800">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-500 mb-2">
                    Backend & Realtime Syncer
                  </h3>
                  <ul className="text-xs text-stone-600 dark:text-stone-400 space-y-2 list-disc list-inside">
                    <li><strong>Supabase Authentication:</strong> Simple email/password signup or Google OAuth. Single-tenant session locks.</li>
                    <li><strong>PostgreSQL Database:</strong> Structured columns optimized for quick date-level queries (`YYYY-MM-DD`).</li>
                    <li><strong>RLS (Row-Level Security):</strong> Enforces strict isolation. Users can only fetch and update rows belonging to their verified UID.</li>
                  </ul>
                </div>
              </div>

              <div className="border-t border-stone-200 dark:border-stone-800 pt-4 mt-4">
                <h3 className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2 uppercase tracking-wider">
                  Technical Goals
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-stone-100/50 dark:bg-stone-900 rounded border border-stone-200 dark:border-stone-800 text-center">
                    <span className="block font-bold text-lg text-amber-800 dark:text-amber-500">{"< 100ms"}</span>
                    <span className="text-[10px] text-stone-500">UI Interaction Latency</span>
                  </div>
                  <div className="p-3 bg-stone-100/50 dark:bg-stone-900 rounded border border-stone-200 dark:border-stone-800 text-center">
                    <span className="block font-bold text-lg text-amber-800 dark:text-amber-500">Zero</span>
                    <span className="text-[10px] text-stone-500">Gamification Noise</span>
                  </div>
                  <div className="p-3 bg-stone-100/50 dark:bg-stone-900 rounded border border-stone-200 dark:border-stone-800 text-center col-span-2 sm:col-span-1">
                    <span className="block font-bold text-lg text-amber-800 dark:text-amber-500">Offline</span>
                    <span className="text-[10px] text-stone-500">Local Cache Priority</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SCHEMA */}
        {activeTab === 'schema' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-serif font-medium text-stone-800 dark:text-stone-100">
                2. Database & Supabase PostgreSQL Schema
              </h2>
              <button
                onClick={() => copyToClipboard(sqlSchema, 'sql')}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-stone-200 dark:border-stone-800 rounded bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 transition-colors"
              >
                {copiedId === 'sql' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy SQL
                  </>
                )}
              </button>
            </div>
            
            <p className="text-xs text-stone-500 dark:text-stone-400">
              The primary database design groups content logically by date. Standard queries fetch all columns with <code className="px-1 py-0.5 bg-stone-100 dark:bg-stone-900 rounded text-amber-800 dark:text-amber-400">date = YYYY-MM-DD</code> and <code className="px-1 py-0.5 bg-stone-100 dark:bg-stone-900 rounded text-amber-800 dark:text-amber-400">user_id = auth.uid()</code>.
            </p>

            <pre className="text-[11px] leading-relaxed p-4 bg-stone-900 text-stone-300 font-mono rounded-lg overflow-x-auto max-h-[350px] border border-stone-800 select-all">
              {sqlSchema}
            </pre>

            <div className="p-4 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-xl space-y-2">
              <h4 className="text-xs font-semibold text-amber-800 dark:text-amber-400 uppercase tracking-wider">
                Database Optimization Strategy
              </h4>
              <ul className="text-xs text-stone-600 dark:text-stone-400 list-disc list-inside space-y-1">
                <li><strong>UUID Defaults:</strong> Uses standard PostgreSQL UUIDs with cryptographically secure generation.</li>
                <li><strong>Composite Indexes:</strong> The indexing of <code className="text-[10px] font-mono px-1 bg-stone-100 dark:bg-stone-900">(user_id, date)</code> ensures instant lookup speeds for the single-day "Today View".</li>
                <li><strong>RLS Isolation:</strong> Pre-configured policy templates guarantee multi-tenant security and zero cross-account leakage.</li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 3: FOLDER */}
        {activeTab === 'folder' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800/60">
              <h2 className="text-lg font-serif font-medium text-stone-800 dark:text-stone-100 mb-3">
                3. Next.js 15 App Router Folder Structure
              </h2>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-4">
                Structured according to modern Next.js 15 standards, utilizing Server Actions for database writes and layouts for lightweight wrapper logic.
              </p>

              <pre className="p-4 bg-stone-900 text-stone-300 font-mono text-xs rounded-lg overflow-x-auto border border-stone-800">
{`my-planner/
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout (themes, fonts, auth provider)
│   │   ├── page.tsx           # Today view (default view router)
│   │   ├── calendar/
│   │   │   └── page.tsx       # Full month interactive view
│   │   ├── history/
│   │   │   └── page.tsx       # Past timeline feed
│   │   ├── insights/
│   │   │   └── page.tsx       # Statistics & tag aggregation
│   │   ├── settings/
│   │   │   └── page.tsx       # Mode, Export, Backup panel
│   │   └── api/               # Server-proxied endpoints (if needed)
│   ├── components/
│   │   ├── ui/                # Custom styled atomic components (buttons, textareas)
│   │   ├── planner/
│   │   │   ├── events.tsx     # Today's timed event list & addition modal
│   │   │   ├── tasks.tsx      # Checkbox lists with College, Tea, Travel tags
│   │   │   ├── reminders.tsx  # Quick bulleted reminders
│   │   │   ├── journal.tsx    # Responsive journal notepad textarea
│   │   │   ├── expenses.tsx   # Ledger entries with automatic total summing
│   │   │   └── braindump.tsx  # Freeform endless notepad
│   │   └── layout/
│   │       ├── bottom-nav.tsx # iPad-optimized bottom paper dock
│   │       └── header.tsx     # Current Date indicator with calendar dialog
│   ├── lib/
│   │   ├── supabase.ts        # Client-side configuration and helpers
│   │   └── utils.ts           # Typography dynamic pairing helpers
│   └── types/
│       └── index.ts           # Types, Interfaces, & Enum definitions
├── supabase/
│   └── migrations/
│       └── 20260625_schema.sql # Complete local migration folder`}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 4: WIREFRAME */}
        {activeTab === 'wireframe' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800/60">
              <h2 className="text-lg font-serif font-medium text-stone-800 dark:text-stone-100 mb-3">
                4. Component Hierarchy & Wireframe Specification
              </h2>
              <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed mb-4">
                The visual layout mimics a physical high-grade paper binder, structured beautifully with soft colors, lightweight borders, and precise grid allocations for iPad landscape viewing.
              </p>

              <div className="border border-stone-300 dark:border-stone-700 rounded-lg p-4 bg-stone-100/40 dark:bg-stone-950 font-mono text-[11px] text-stone-700 dark:text-stone-300 space-y-2">
                <div className="text-center border-b border-stone-300 dark:border-stone-700 pb-2 font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                  iPad Screen Stage Layout [Landscape 4:3]
                </div>
                <div className="p-2 border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 rounded">
                  <div className="flex justify-between items-center text-xs text-amber-700 dark:text-amber-500 font-bold mb-2">
                    <span>📅 Thursday, June 25, 2026</span>
                    <span>[Calendar Popover Button]</span>
                  </div>
                  
                  {/* Events Section */}
                  <div className="p-2 border border-stone-200 dark:border-stone-800 bg-amber-50/20 dark:bg-stone-900 rounded mb-3">
                    <span className="font-bold">SECTION 1: EVENTS</span> (14:00 Lunch with Mom | 18:00 Piano Lesson)
                  </div>

                  {/* Tasks & Reminders Row */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="p-2 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded min-h-[80px]">
                      <span className="font-bold block border-b border-stone-100 dark:border-stone-800 pb-1 mb-1">SECTION 2 (LEFT): TODAY'S TASKS</span>
                      [x] Buy specialty oolong tea <span className="bg-emerald-50 dark:bg-emerald-950/40 px-1 rounded text-[9px] text-emerald-800">Tea</span><br />
                      [ ] Prep Slides <span className="bg-indigo-50 dark:bg-indigo-950/40 px-1 rounded text-[9px] text-indigo-800">College</span>
                    </div>
                    <div className="p-2 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded min-h-[80px]">
                      <span className="font-bold block border-b border-stone-100 dark:border-stone-800 pb-1 mb-1">SECTION 2 (RIGHT): REMINDERS</span>
                      • Submit chemistry homework<br />
                      • Renew scooter insurance
                    </div>
                  </div>

                  {/* Journal & Expenses Row */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="p-2 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded min-h-[80px]">
                      <span className="font-bold block border-b border-stone-100 dark:border-stone-800 pb-1 mb-1">SECTION 3 (LEFT): JOURNAL</span>
                      <span className="text-stone-400">"What happened today?"</span>... (Freeform journal entry box)
                    </div>
                    <div className="p-2 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded min-h-[80px]">
                      <span className="font-bold block border-b border-stone-100 dark:border-stone-800 pb-1 mb-1">SECTION 3 (RIGHT): EXPENSES</span>
                      NT$ 220 - Lunch (Food)<br />
                      NT$ 150 - Black Tea (Tea)
                    </div>
                  </div>

                  {/* Brain Dump Row */}
                  <div className="p-2 border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 rounded mb-2 min-h-[60px]">
                    <span className="font-bold block border-b border-stone-100 dark:border-stone-800 pb-1 mb-1">SECTION 4: BRAIN DUMP</span>
                    <span className="text-stone-400">Random scribbles, sketches, non-structured thoughts...</span>
                  </div>

                  {/* Nav Bar */}
                  <div className="p-1.5 border border-dashed border-stone-300 dark:border-stone-700 text-center rounded text-[10px] text-stone-500 bg-stone-50 dark:bg-stone-950">
                    NAVIGATION DOCK: Today | Calendar | History | Insights | Settings
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: ROADMAP */}
        {activeTab === 'roadmap' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/60 dark:border-stone-800/60">
              <h2 className="text-lg font-serif font-medium text-stone-800 dark:text-stone-100 mb-3">
                5. Complete MVP Implementation Roadmap & Action Plan
              </h2>
              
              <div className="space-y-4">
                {[
                  {
                    phase: 'PHASE 1: Project Scaffolding (Days 1-2)',
                    items: [
                      'Initialize Next.js 15 app with Tailwind CSS v4 and TypeScript configured.',
                      'Set up basic fonts (Lora for headers, Inter for system UI, Fira Code for ledger numbers).',
                      'Configure base layouts including responsive constraints prioritizing standard iPad dimensions (1024x768 / 1112x834).'
                    ]
                  },
                  {
                    phase: 'PHASE 2: Supabase Connectivity & Migrations (Days 3-4)',
                    items: [
                      'Provision Supabase project, execute SQL migrations script in the Supabase SQL editor.',
                      'Configure Server Actions representing CRUD queries for each of the 6 core components.',
                      'Enable Row-Level Security policies to secure individual logs.'
                    ]
                  },
                  {
                    phase: 'PHASE 3: Component Realization & iPad Wireframes (Days 5-7)',
                    items: [
                      'Implement TodayView layout with custom, responsive columns fitting perfectly.',
                      'Add active state hooks holding journal text and auto-saving expenses.',
                      'Build Month calendar layout allowing quick day selection back-and-forth.'
                    ]
                  },
                  {
                    phase: 'PHASE 4: History feed, Insights, & Local Sync (Days 8-9)',
                    items: [
                      'Assemble the Insights layout using CSS SVG graphs to display category expenses and completed tasks.',
                      'Program background offline synchronizer which queues edits to IndexedDB / LocalStorage if network drops.',
                      'Construct a pristine timeline display inside the History tab.'
                    ]
                  },
                  {
                    phase: 'PHASE 5: Polishing, Refinement & Deployment (Day 10)',
                    items: [
                      'Execute final audits on dark/light mode switches, ensuring correct warm-yellow and deep slate levels.',
                      'Test tactile UI touches (44px target sizes) specifically using iPad Safari.',
                      'Deploy the production-ready compilation to Vercel/Cloud Run.'
                    ]
                  }
                ].map((p, i) => (
                  <div key={i} className="border-l-2 border-amber-600 pl-4 space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                      {p.phase}
                    </h3>
                    <ul className="text-xs text-stone-600 dark:text-stone-400 space-y-1 list-disc list-inside">
                      {p.items.map((item, j) => (
                        <li key={j} className="leading-relaxed">{item}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
