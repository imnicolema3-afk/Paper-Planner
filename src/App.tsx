import React, { useState, useEffect } from 'react';
import { Calendar, CalendarDays, BookOpen, BarChart3, Settings, FileCode, Check, HelpCircle, ChevronLeft, ChevronRight, PenTool, Loader2 } from 'lucide-react';
import { PlannerState, ThemeType, UserProfile } from './types';
import { generateInitialData, formatToISODate } from './data/initialData';

// Import Views
import TodayView from './components/TodayView';
import CalendarView from './components/CalendarView';
import HistoryView from './components/HistoryView';
import InsightsView from './components/InsightsView';
import SettingsView from './components/SettingsView';
import SpecsPortal from './components/SpecsPortal';
import OnboardingView from './components/OnboardingView';

// Firebase Imports
import { auth, fetchPlannerData, savePlannerData, saveUserProfile } from './lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';

export default function App() {
  // 1. Theme Configuration
  const [theme, setTheme] = useState<ThemeType>('natural-tones');

  // 2. Active Tab configuration
  const [activeTab, setActiveTab] = useState<'today' | 'calendar' | 'history' | 'insights' | 'settings' | 'specs'>('today');

  // 3. Active selected date in YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState<string>(() => formatToISODate(new Date()));

  // 4. Firebase Authentication & Guest States
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);
  const [isGuestMode, setIsGuestMode] = useState<boolean>(true);
  const [loadingAuth, setLoadingAuth] = useState<boolean>(true);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // 5. Main Database State
  const [state, setState] = useState<PlannerState>(() => {
    const cached = localStorage.getItem('paper_planner_db');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object' && parsed.tasks) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse cached database.', e);
      }
    }
    return {
      events: [],
      tasks: [],
      reminders: [],
      journals: [],
      expenses: [],
      brainDumps: []
    };
  });

  // Track Firebase Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setLoadingAuth(true);
        setCurrentUser(user);
        setIsGuestMode(false);
        localStorage.setItem('paper_planner_guest', 'false');

        // Load data from cloud
        const cloudData = await fetchPlannerData(user.uid);
        if (cloudData) {
          setState(cloudData.state);
          setTheme(cloudData.theme);
          if (cloudData.profile) {
            setCurrentUserProfile(cloudData.profile);
          } else {
            setCurrentUserProfile(null);
          }
        } else {
          // New user: starts with clean empty state as requested
          const empty: PlannerState = {
            events: [],
            tasks: [],
            reminders: [],
            journals: [],
            expenses: [],
            brainDumps: []
          };
          setState(empty);
          await savePlannerData(user.uid, empty, theme);
          setCurrentUserProfile(null);
        }
        setLoadingAuth(false);
      } else {
        setCurrentUser(null);
        setCurrentUserProfile(null);
        setLoadingAuth(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 6. Persistent Writer
  const handleUpdateState = (updater: (prev: PlannerState) => PlannerState) => {
    setState((prev) => {
      const nextState = updater(prev);
      localStorage.setItem('paper_planner_db', JSON.stringify(nextState));
      
      // If user is logged in, sync to Firebase Cloud Firestore
      if (currentUser) {
        savePlannerData(currentUser.uid, nextState, theme).catch(err => {
          console.error("Failed to background sync update to cloud:", err);
        });
      }
      return nextState;
    });
  };

  // 7. Theme Sync and Persistence
  useEffect(() => {
    if (currentUser) {
      savePlannerData(currentUser.uid, state, theme).catch(err => {
        console.error("Failed to sync theme update to cloud:", err);
      });
    }
  }, [theme, currentUser]);

  // Sync theme with document class or body for high-contrast colors
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    if (theme === 'charcoal-dark') {
      root.classList.add('dark');
    }
  }, [theme]);

  // Jump selected date back to today
  const handleJumpToToday = () => {
    setSelectedDate(formatToISODate(new Date()));
  };

  // Move selected date by -1 or +1 days
  const handleOffsetDate = (offset: number) => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day);
    dateObj.setDate(dateObj.getDate() + offset);
    setSelectedDate(formatToISODate(dateObj));
  };

  // Render Theme Styles for Wrapper
  const getThemeWrapperClass = () => {
    switch (theme) {
      case 'natural-tones':
        return 'bg-natural-bg text-natural-text border-natural-border selection:bg-natural-sage/20 selection:text-natural-dark-bg';
      case 'warm-paper':
        return 'bg-[#faf6f0] text-stone-800 border-[#eae1d4] selection:bg-amber-100 selection:text-amber-900';
      case 'slate-clean':
        return 'bg-white text-stone-800 border-stone-200 selection:bg-stone-100';
      case 'charcoal-dark':
        return 'bg-[#1c1b19] text-[#d6cbb5] border-[#2a2926] selection:bg-amber-900/40 selection:text-amber-200';
    }
  };

  const getLogoClass = () => {
    if (theme === 'natural-tones') return 'bg-natural-sage text-white';
    return 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-950';
  };

  // Logout / Account Switch Handler
  const handleLogout = async () => {
    if (currentUser) {
      if (window.confirm("Are you sure you want to sign out of your cloud planner account?")) {
        await signOut(auth);
        setIsGuestMode(true);
      }
    } else {
      setShowAuthModal(true);
    }
  };

  // Login Success Handler
  const handleLoginSuccess = (userId: string, fetchedState: PlannerState, fetchedTheme: ThemeType) => {
    setIsGuestMode(false);
    setShowAuthModal(false);
    // Snappy load
    fetchPlannerData(userId).then(cloudData => {
      if (cloudData) {
        if (cloudData.profile) setCurrentUserProfile(cloudData.profile);
        if (cloudData.state) setState(cloudData.state);
        if (cloudData.theme) setTheme(cloudData.theme);
      }
    });
  };

  // Guest Bypasser Handler
  const handleTryGuest = () => {
    setIsGuestMode(true);
    setShowAuthModal(false);
  };

  // Loading Shield Screen
  if (loadingAuth) {
    return (
      <div className={`min-h-screen flex flex-col justify-center items-center transition-colors duration-300 ${getThemeWrapperClass()}`}>
        <Loader2 className="w-8 h-8 animate-spin text-natural-sage" />
        <span className="text-xs font-mono tracking-widest mt-4 opacity-70 uppercase">Synchronizing cloud parchment...</span>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${getThemeWrapperClass()}`} id="app-wrapper">
      
      {/* 1. PAPER HEADER */}
      <header className="border-b border-inherit px-4 py-3.5 sticky top-0 z-50 backdrop-blur bg-opacity-80">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-serif font-light text-sm shadow-sm ${getLogoClass()}`}>
              P
            </div>
            <div>
              <h1 className="text-sm font-serif font-semibold tracking-tight text-stone-800 dark:text-stone-100">
                Paper Planner
              </h1>
              <p className="text-[9px] font-mono tracking-widest text-stone-400 uppercase">
                Minimalist Life Desk
              </p>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-2">
            
            {currentUser && currentUserProfile && (
              <button 
                onClick={() => setActiveTab('settings')} 
                className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-inherit bg-white dark:bg-stone-950 hover:bg-stone-50 dark:hover:bg-stone-900 cursor-pointer transition-all shadow-3xs"
                title={`${currentUserProfile.name}'s Profile`}
              >
                <div className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs shrink-0 select-none">
                  {currentUserProfile.profileImage.startsWith("http") ? (
                    <img src={currentUserProfile.profileImage} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span>{currentUserProfile.profileImage}</span>
                  )}
                </div>
                <span className="text-[10.5px] font-sans font-medium text-stone-700 dark:text-stone-300 hidden sm:inline max-w-[80px] truncate">
                  {currentUserProfile.name.split(" ")[0]}
                </span>
              </button>
            )}

            {/* Quick date navigators (Only relevant on Today View) */}
            {activeTab === 'today' && (
              <div className="flex items-center border border-inherit rounded-lg bg-white dark:bg-stone-950 p-0.5 overflow-hidden shadow-2xs">
                <button
                  onClick={() => handleOffsetDate(-1)}
                  className="p-1 hover:bg-stone-50 dark:hover:bg-stone-900 rounded text-stone-600 dark:text-stone-400 transition-colors cursor-pointer"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleJumpToToday}
                  className="px-2 py-0.5 text-[10px] font-mono hover:bg-stone-50 dark:hover:bg-stone-900 rounded text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                  title="Jump to Today"
                >
                  Today
                </button>
                <button
                  onClick={() => handleOffsetDate(1)}
                  className="p-1 hover:bg-stone-50 dark:hover:bg-stone-900 rounded text-stone-600 dark:text-stone-400 transition-colors cursor-pointer"
                  title="Next Day"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Floating Developer Specs Button */}
            <button
              onClick={() => setActiveTab(activeTab === 'specs' ? 'today' : 'specs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                activeTab === 'specs'
                  ? theme === 'natural-tones'
                    ? 'bg-natural-sage/20 text-natural-text border-natural-sage font-semibold'
                    : 'bg-amber-100/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-400 border-amber-300 dark:border-amber-900'
                  : theme === 'natural-tones'
                  ? 'bg-white text-natural-text border-natural-border hover:bg-natural-sage-light'
                  : 'bg-white dark:bg-stone-950 text-stone-600 dark:text-stone-400 border-inherit hover:bg-stone-50 dark:hover:bg-stone-900 shadow-2xs'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dev Spec Sheet</span>
            </button>
          </div>


        </div>
      </header>

      {/* 2. CORE STAGE CONTAINER */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 pb-28 md:pb-24">
        {activeTab === 'today' && (
          <TodayView
            selectedDate={selectedDate}
            state={state}
            onUpdateState={handleUpdateState}
            theme={theme}
            userEmail={currentUser ? currentUser.email : null}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            selectedDate={selectedDate}
            state={state}
            onSelectDate={setSelectedDate}
            onNavigateToTodayTab={() => setActiveTab('today')}
            theme={theme}
          />
        )}

        {activeTab === 'history' && (
          <HistoryView
            state={state}
            onSelectDate={setSelectedDate}
            onNavigateToTodayTab={() => setActiveTab('today')}
            theme={theme}
          />
        )}

        {activeTab === 'insights' && (
          <InsightsView state={state} theme={theme} />
        )}


        {activeTab === 'settings' && (
          <SettingsView
            theme={theme}
            onChangeTheme={setTheme}
            state={state}
            onUpdateState={handleUpdateState}
            userEmail={currentUser ? currentUser.email : null}
            onLogout={handleLogout}
            userProfile={currentUserProfile}
            onUpdateProfile={(profile) => {
              if (currentUser) {
                saveUserProfile(currentUser.uid, profile).then(() => {
                  setCurrentUserProfile(profile);
                });
              }
            }}
          />
        )}

        {activeTab === 'specs' && (
          <SpecsPortal />
        )}
      </main>

      {/* 3. TACTILE BOTTTOM PLANNER DOCK */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-inherit bg-opacity-95 backdrop-blur py-3 px-4 z-40" style={{ backgroundColor: 'inherit' }}>
        <div className="max-w-md mx-auto bg-white dark:bg-stone-950 border border-inherit rounded-2xl flex justify-around p-1 shadow-md">
          {[
            { id: 'today', label: 'Today', icon: Calendar },
            { id: 'calendar', label: 'Calendar', icon: CalendarDays },
            { id: 'history', label: 'History', icon: BookOpen },
            { id: 'insights', label: 'Insights', icon: BarChart3 },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`flex flex-col items-center justify-center flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? theme === 'natural-tones'
                      ? 'text-natural-sage bg-natural-sage-light font-semibold'
                      : 'text-amber-800 dark:text-amber-500 bg-amber-50/50 dark:bg-amber-950/20 font-medium'
                    : theme === 'natural-tones'
                    ? 'text-natural-muted hover:text-natural-text hover:bg-natural-sage-light/60'
                    : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-50/50 dark:hover:bg-stone-900/50'
                }`}
              >
                <Icon className="w-4.5 h-4.5 mb-1" />
                <span className="text-[10px] tracking-wide font-mono font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </footer>

      {showAuthModal && (
        <div className="fixed inset-0 bg-stone-900/60 dark:bg-stone-950/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-transparent my-8">
            <OnboardingView
              theme={theme}
              onLoginSuccess={handleLoginSuccess}
              onTryGuest={handleTryGuest}
              onClose={() => setShowAuthModal(false)}
            />
          </div>
        </div>
      )}

    </div>
  );
}
