import React, { useState } from "react";
import { 
  auth, 
  savePlannerData 
} from "../lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth";
import { ThemeType, PlannerState } from "../types";
import { 
  BookOpen, 
  CalendarDays, 
  DollarSign, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft, 
  ArrowRight, 
  Check, 
  UserPlus, 
  LogIn,
  Eye,
  EyeOff,
  X
} from "lucide-react";

interface OnboardingViewProps {
  theme: ThemeType;
  onLoginSuccess: (userId: string, state: PlannerState, theme: ThemeType) => void;
  onTryGuest: () => void;
  onClose?: () => void;
}

export default function OnboardingView({ theme, onLoginSuccess, onTryGuest, onClose }: OnboardingViewProps) {
  const [step, setStep] = useState<"guide" | "example" | "auth">("guide");
  
  // Auth states
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);

  // Guide slides config
  const guidePoints = [
    {
      icon: <BookOpen className="w-6 h-6 text-natural-sage" />,
      title: "Tactile Parchment Design",
      desc: "Inspired by physical journal planning. Clean, deliberate, structured columns with gorgeous spacing and custom rules for deep, focused focus."
    },
    {
      icon: <CalendarDays className="w-6 h-6 text-natural-sage" />,
      title: "Daily Flow Tracking",
      desc: "Log your scheduled events, tick off specialized habit tags, write detailed notes on tea brewing, and journal feelings with real-time preservation."
    },
    {
      icon: <DollarSign className="w-6 h-6 text-natural-sage" />,
      title: "Integrated Expense Ledger",
      desc: "Stay financially conscious with a minimalist spending tracker. Categorize transit, food, and shopping instantly, showing direct spending limits."
    },
    {
      icon: <Sparkles className="w-6 h-6 text-natural-sage" />,
      title: "AI-Powered Brain Dump",
      desc: "Empty your busy mind at the bottom panel. Simply write down any random thoughts, and the built-in AI will automatically parse, sort, and log them into events, todo tasks, and expenses."
    }
  ];

  // Dummy filled-in example data for display
  const exampleTasks = [
    { title: "Brew and evaluate a cup of high-mountain Oolong tea", tag: "Tea" as const, completed: true },
    { title: "Complete college computer science assignment", tag: "College" as const, completed: false },
    { title: "Finalize travel schedule to Kyoto", tag: "Travel" as const, completed: false }
  ];

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setLoading(true);

    try {
      if (isSignUp) {
        // Create user
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        // Initialize with empty state on cloud
        const emptyState: PlannerState = {
          events: [],
          tasks: [],
          reminders: [],
          journals: [],
          expenses: [],
          brainDumps: []
        };
        await savePlannerData(credential.user.uid, emptyState, theme);
        onLoginSuccess(credential.user.uid, emptyState, theme);
      } else {
        // Sign In
        const credential = await signInWithEmailAndPassword(auth, email, password);
        // Data fetch happens in App.tsx
      }
    } catch (err: any) {
      console.error(err);
      let msg = "Authentication failed. Please verify inputs.";
      if (err.code === "auth/email-already-in-use") {
        msg = "Email address is already registered.";
      } else if (err.code === "auth/invalid-credential") {
        msg = "Invalid email or password.";
      } else if (err.code === "auth/weak-password") {
        msg = "Password should be at least 6 characters.";
      }
      setAuthError(msg);
    } finally {
      setLoading(false);
    }
  };

  const wrapperThemeClass = () => {
    switch (theme) {
      case "natural-tones":
        return "bg-[#FAF7F0] border-natural-border text-natural-text";
      case "warm-paper":
        return "bg-[#faf6f0] border-[#eae1d4] text-stone-800";
      case "charcoal-dark":
        return "bg-[#1c1b19] border-[#2a2926] text-[#d6cbb5]";
      default:
        return "bg-white border-stone-200 text-stone-800";
    }
  };

  const cardThemeClass = () => {
    if (theme === "natural-tones") {
      return "bg-white border-natural-border rounded-[24px] shadow-2xs";
    }
    if (theme === "charcoal-dark") {
      return "bg-stone-900/60 border-stone-800 rounded-2xl";
    }
    return "bg-white border-stone-200 rounded-2xl shadow-sm";
  };

  return (
    <div className={`flex-1 flex flex-col justify-center items-center px-4 py-12 max-w-2xl mx-auto w-full transition-colors ${wrapperThemeClass()}`}>
      
      {/* Brand Badge */}
      <div className="flex flex-col items-center mb-8 text-center select-none">
        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-serif font-light text-lg shadow-sm mb-3 ${
          theme === "natural-tones" ? "bg-natural-sage text-white" : "bg-stone-800 dark:bg-stone-100 text-white dark:text-stone-900"
        }`}>
          P
        </div>
        <h1 className="text-2xl font-serif font-bold tracking-tight text-stone-800 dark:text-stone-100">
          Paper Planner
        </h1>
        <p className="text-[10px] font-mono tracking-widest text-stone-400 dark:text-stone-500 uppercase mt-0.5">
          Tactile Cloud Workspace
        </p>
      </div>

      {/* Main Container */}
      <div className={`w-full border p-6 md:p-8 relative ${cardThemeClass()}`}>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        )}
        
        {/* STEP 1: QUICK GUIDE */}
        {step === "guide" && (
          <div>
            <div className="text-center mb-6">
              <span className="text-[10px] font-mono tracking-widest uppercase text-stone-400 dark:text-stone-500 font-bold bg-stone-100 dark:bg-stone-800/60 px-2 py-0.5 rounded">
                Step 1 of 3
              </span>
              <h2 className="text-xl font-serif font-medium text-stone-800 dark:text-stone-100 mt-2">
                Minimalist Life Desk Philosophy
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-md mx-auto">
                Designed to restore tranquility and focus to your days, freeing your schedule of digital clutter.
              </p>
            </div>

            {/* Guide Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
              {guidePoints.map((gp, i) => (
                <div key={i} className={`p-4 rounded-xl border ${
                  theme === "natural-tones" 
                    ? "bg-natural-sage-light/30 border-natural-border/40" 
                    : "bg-stone-50/50 dark:bg-stone-900/30 border-stone-100 dark:border-stone-850"
                }`}>
                  <div className="mb-2">{gp.icon}</div>
                  <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200 font-sans">
                    {gp.title}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mt-1 font-sans">
                    {gp.desc}
                  </p>
                </div>
              ))}
            </div>

            {/* Next buttons */}
            <div className="flex justify-end pt-4 border-t border-stone-100 dark:border-stone-800/80 mt-6">
              <button
                onClick={() => setStep("example")}
                className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-all ${
                  theme === "natural-tones"
                    ? "bg-natural-sage text-white hover:bg-natural-sage/95 shadow-2xs"
                    : "bg-stone-800 hover:bg-stone-900 text-white"
                }`}
              >
                View Example <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: EXAMPLE HIGHLIGHT */}
        {step === "example" && (
          <div>
            <div className="text-center mb-6">
              <span className="text-[10px] font-mono tracking-widest uppercase text-stone-400 dark:text-stone-500 font-bold bg-stone-100 dark:bg-stone-800/60 px-2 py-0.5 rounded">
                Step 2 of 3
              </span>
              <h2 className="text-xl font-serif font-medium text-stone-800 dark:text-stone-100 mt-2">
                A Sample Day Log
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                How a balanced day structure looks once filled. Elegant typography with functional tags.
              </p>
            </div>

            {/* Sample Layout Container */}
            <div className={`p-4 rounded-xl border mb-6 ${
              theme === "natural-tones" ? "bg-[#FAF7F0] border-natural-border" : "bg-stone-50/50 dark:bg-stone-950/40 border-stone-100 dark:border-stone-900"
            }`}>
              {/* Columns Preview */}
              <div className="space-y-4">
                {/* Header */}
                <div className="border-b border-stone-200/60 pb-2 flex justify-between items-center text-xs">
                  <span className="font-serif font-semibold text-stone-700 dark:text-stone-300">Today: June 25, 2026</span>
                  <span className="font-mono text-stone-400 uppercase tracking-widest text-[9px]">Sample Page</span>
                </div>

                {/* Left col: Events */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5 font-mono">Scheduled Events</h4>
                  <div className="space-y-1.5">
                    <div className="flex gap-2 text-xs items-center">
                      <span className="font-mono text-natural-sage text-[10px] font-semibold">10:00 AM</span>
                      <span className="text-stone-800 dark:text-stone-200 font-sans">Tea brewing and evaluate session</span>
                    </div>
                    <div className="flex gap-2 text-xs items-center">
                      <span className="font-mono text-natural-sage text-[10px] font-semibold">03:30 PM</span>
                      <span className="text-stone-800 dark:text-stone-200 font-sans">Research paper review</span>
                    </div>
                  </div>
                </div>

                {/* Habits checklist */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5 font-mono">Tasks Checklist</h4>
                  <div className="space-y-2">
                    {exampleTasks.map((t, i) => (
                      <div key={i} className="flex items-center justify-between text-xs py-1 px-1.5 bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800/80 rounded">
                        <div className="flex items-center gap-2">
                          <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                            t.completed ? "bg-natural-sage border-transparent text-white" : "border-stone-300"
                          }`}>
                            {t.completed && <Check className="w-2.5 h-2.5" />}
                          </span>
                          <span className={`${t.completed ? "line-through text-stone-400" : "text-stone-700 dark:text-stone-300"}`}>{t.title}</span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono ${
                          t.tag === "Tea" ? "bg-emerald-100 text-emerald-800" : t.tag === "College" ? "bg-indigo-100 text-indigo-800" : "bg-stone-100 text-stone-800"
                        }`}>
                          {t.tag}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expense ledger */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1.5 font-mono">Expenses Tracker</h4>
                  <div className="flex items-center gap-2 text-xs py-1 px-1.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/30 dark:border-emerald-900/10 rounded">
                    <span className="font-mono font-bold text-natural-sage">NT$ 120</span>
                    <span className="px-1.5 bg-white dark:bg-stone-900 rounded border border-stone-100 text-[8px] font-mono text-stone-500 uppercase tracking-widest">Food</span>
                    <span className="text-stone-600 dark:text-stone-400 truncate">Lunch box</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Nav controls */}
            <div className="flex justify-between items-center pt-4 border-t border-stone-100 dark:border-stone-800/80 mt-6">
              <button
                onClick={() => setStep("guide")}
                className="px-3.5 py-2 text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>

              <button
                onClick={() => setStep("auth")}
                className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer transition-all ${
                  theme === "natural-tones"
                    ? "bg-natural-sage text-white hover:bg-natural-sage/95 shadow-2xs"
                    : "bg-stone-800 hover:bg-stone-900 text-white"
                }`}
              >
                Proceed to Cloud Sync <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: AUTHENTICATION / LOGIN PAGE */}
        {step === "auth" && (
          <div>
            <div className="text-center mb-6">
              <span className="text-[10px] font-mono tracking-widest uppercase text-stone-400 dark:text-stone-500 font-bold bg-stone-100 dark:bg-stone-800/60 px-2 py-0.5 rounded">
                Step 3 of 3
              </span>
              <h2 className="text-xl font-serif font-medium text-stone-800 dark:text-stone-100 mt-2">
                {isSignUp ? "Create Cloud Planner Account" : "Access Your Cloud Planner"}
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                Your daily entries, logs, and financial stances will be securely preserved in Firebase.
              </p>
            </div>

            {/* Error banner */}
            {authError && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs">
                {authError}
              </div>
            )}

            {/* Submit Auth Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase text-stone-400 dark:text-stone-500 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={`w-full px-3 py-2 text-sm border rounded-lg bg-white dark:bg-stone-950 text-stone-850 dark:text-stone-100 focus:outline-none focus:ring-1 ${
                    theme === "natural-tones" 
                      ? "border-natural-border focus:ring-natural-sage focus:border-natural-sage" 
                      : "border-stone-200 dark:border-stone-800 focus:ring-amber-500 focus:border-amber-500"
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase text-stone-400 dark:text-stone-500 mb-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full px-3 py-2 pr-10 text-sm border rounded-lg bg-white dark:bg-stone-950 text-stone-850 dark:text-stone-100 focus:outline-none focus:ring-1 ${
                      theme === "natural-tones" 
                        ? "border-natural-border focus:ring-natural-sage focus:border-natural-sage" 
                        : "border-stone-200 dark:border-stone-800 focus:ring-amber-500 focus:border-amber-500"
                    }`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  theme === "natural-tones"
                    ? "bg-natural-sage text-white hover:bg-natural-sage/95 shadow-2xs"
                    : "bg-stone-800 hover:bg-stone-900 text-white"
                } disabled:opacity-50`}
              >
                {loading ? (
                  <span>Signing processing...</span>
                ) : (
                  <>
                    {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                    {isSignUp ? "Register Account" : "Sign In to Cloud"}
                  </>
                )}
              </button>
            </form>

            {/* Toggle Sign Up / Sign In */}
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setAuthError("");
                }}
                className={`text-xs hover:underline cursor-pointer ${
                  theme === "natural-tones" ? "text-natural-sage font-medium" : "text-stone-600 dark:text-stone-400"
                }`}
              >
                {isSignUp ? "Already have an account? Sign In" : "Need an account? Register Now"}
              </button>
            </div>

            {/* Separator line */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-stone-200/60 dark:border-stone-800/80"></div>
              <span className="px-3 text-[10px] font-mono text-stone-400 uppercase tracking-widest">Or</span>
              <div className="flex-1 border-t border-stone-200/60 dark:border-stone-800/80"></div>
            </div>

            {/* Guest Action Panel */}
            <div className="text-center">
              <button
                type="button"
                onClick={onTryGuest}
                className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:underline cursor-pointer font-serif flex items-center justify-center gap-1 mx-auto"
              >
                Try Application as Guest <ArrowRight className="w-3.5 h-3.5 animate-pulse" />
              </button>
              <p className="text-[10px] text-stone-400/80 mt-1 max-w-xs mx-auto">
                Note: Guest planners store data locally inside your tablet/browser. You can register anytime to backup.
              </p>
            </div>

            {/* Navigation back */}
            <div className="flex justify-start pt-4 border-t border-stone-100 dark:border-stone-800/80 mt-6">
              <button
                onClick={() => setStep("example")}
                className="px-3.5 py-2 text-xs font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back to Example
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
