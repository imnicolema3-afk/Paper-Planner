import React from 'react';
import { Settings, Moon, Sun, RotateCcw, Download, Upload, Trash2, Heart, ExternalLink, RefreshCw, Cloud, LogOut, User, Phone, Cake, Activity, Check, Edit3, Save, ChevronDown } from 'lucide-react';
import { ThemeType, PlannerState, UserProfile } from '../types';
import { generateInitialData } from '../data/initialData';
import { Language, translations } from '../lib/localization';

interface SettingsViewProps {
  theme: ThemeType;
  onChangeTheme: (theme: ThemeType) => void;
  state: PlannerState;
  onUpdateState: (updater: (prev: PlannerState) => PlannerState) => void;
  userEmail: string | null;
  onLogout: () => void;
  userProfile?: UserProfile | null;
  onUpdateProfile?: (profile: UserProfile) => void;
  language: Language;
  onChangeLanguage: (lang: Language) => void;
}

export default function SettingsView({ 
  theme, 
  onChangeTheme, 
  state, 
  onUpdateState, 
  userEmail, 
  onLogout,
  userProfile,
  onUpdateProfile,
  language,
  onChangeLanguage
}: SettingsViewProps) {
  
  // Profile editing states
  const [isEditingProfile, setIsEditingProfile] = React.useState(false);
  const [editName, setEditName] = React.useState(userProfile?.name || "");
  const [editPhone, setEditPhone] = React.useState(userProfile?.phone || "");
  const [editBirthday, setEditBirthday] = React.useState(userProfile?.birthday || "");
  const [editGender, setEditGender] = React.useState(userProfile?.gender || "");
  const [editImage, setEditImage] = React.useState(userProfile?.profileImage || "🍵");

  // Keep internal state synchronized with userProfile props changes
  React.useEffect(() => {
    if (userProfile) {
      setEditName(userProfile.name);
      setEditPhone(userProfile.phone);
      setEditBirthday(userProfile.birthday);
      setEditGender(userProfile.gender);
      setEditImage(userProfile.profileImage);
    }
  }, [userProfile]);

  const avatarPresets = [
    { emoji: "🍵", bg: "bg-emerald-50 text-emerald-800 border-emerald-200/50 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/30", label: "Matcha" },
    { emoji: "☕", bg: "bg-amber-50 text-amber-800 border-amber-200/50 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/30", label: "Brew" },
    { emoji: "🌿", bg: "bg-teal-50 text-teal-800 border-teal-200/50 dark:bg-teal-950/20 dark:text-teal-300 dark:border-teal-900/30", label: "Sage" },
    { emoji: "🌙", bg: "bg-slate-50 text-slate-800 border-slate-250 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800", label: "Midnight" },
    { emoji: "🌊", bg: "bg-sky-50 text-sky-800 border-sky-200/50 dark:bg-sky-950/20 dark:text-sky-300 dark:border-sky-900/30", label: "Ocean" },
    { emoji: "🪵", bg: "bg-orange-50 text-orange-800 border-orange-200/50 dark:bg-orange-950/20 dark:text-orange-300 dark:border-orange-900/30", label: "Wood" }
  ];

  // Reset database to initial sample data
  const handleRestoreSampleData = () => {
    if (window.confirm('This will populate sample entries for today, yesterday, and past days. Any custom modifications will be preserved or merged. Proceed?')) {
      onUpdateState(() => generateInitialData());
    }
  };

  // Clear all database entries
  const handleClearAllData = () => {
    if (window.confirm('WARNING: This will permanently erase all your tasks, expenses, schedules, journals, and reminders! This action cannot be undone. Proceed?')) {
      onUpdateState(() => ({
        events: [],
        tasks: [],
        reminders: [],
        journals: [],
        expenses: [],
        brainDumps: []
      }));
    }
  };

  // Export data as JSON file download
  const handleExportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `paper_planner_backup_${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Import data from JSON file upload
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (parsed && typeof parsed === 'object') {
            onUpdateState((prev) => ({
              events: Array.isArray(parsed.events) ? parsed.events : prev.events,
              tasks: Array.isArray(parsed.tasks) ? parsed.tasks : prev.tasks,
              reminders: Array.isArray(parsed.reminders) ? parsed.reminders : prev.reminders,
              journals: Array.isArray(parsed.journals) ? parsed.journals : prev.journals,
              expenses: Array.isArray(parsed.expenses) ? parsed.expenses : prev.expenses,
              brainDumps: Array.isArray(parsed.brainDumps) ? parsed.brainDumps : prev.brainDumps,
            }));
            alert('Planner logs imported successfully!');
          } else {
            alert('Invalid backup file format.');
          }
        } catch (err) {
          alert('Error parsing JSON backup file.');
        }
      };
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-2 px-1 animate-fade-in" id="settings-view-root">
      {/* Header */}
      <div className="border-b border-stone-200 dark:border-stone-800 pb-5 mb-8">
        <div className="flex items-center gap-3">
          <Settings className="w-5.5 h-5.5 text-stone-700 dark:text-stone-300" />
          <div>
            <h2 className="text-xl font-serif font-medium text-stone-800 dark:text-stone-100">
              Planner Preferences
            </h2>
            <p className="text-[10px] font-mono text-stone-400 dark:text-stone-500 uppercase tracking-wider">
              Configure paper styling, backups, and database purges
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* CLOUD WORKSPACE CARD */}
        <div className={`p-5 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
          theme === 'natural-tones'
            ? 'bg-natural-sage-light/25 border-natural-border/60 rounded-[24px]'
            : 'bg-stone-50 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800'
        }`} id="cloud-account-card">
          <div className="flex gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              theme === 'natural-tones' ? 'bg-natural-sage/20 text-natural-sage' : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
            }`}>
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-850 dark:text-stone-100 font-sans">
                {userEmail ? "Firebase Cloud Backup" : "Local-Only Offline Guest Mode"}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 font-sans">
                {userEmail 
                  ? `Active account: ${userEmail} • Your planner logs are securely backed up in the cloud.`
                  : "All logs are stored purely in your tablet browser. Create or log in to a cloud account to prevent loss."
                }
              </p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              theme === 'natural-tones'
                ? 'bg-natural-sage text-white hover:bg-natural-sage/90'
                : 'bg-stone-800 hover:bg-stone-900 text-white dark:bg-stone-200 dark:text-stone-950 dark:hover:bg-stone-100'
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{userEmail ? "Sign Out & Switch Account" : "Access Cloud & Log In"}</span>
          </button>
        </div>

        {/* USER PROFILE SECTION */}
        {userEmail && userProfile && (
          <div className="p-5 bg-white dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800" id="user-profile-card">
            <div className="flex justify-between items-center mb-4 border-b border-stone-100 dark:border-stone-850 pb-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 flex items-center gap-1.5 font-mono">
                <User className="w-4 h-4 text-natural-sage" />
                <span>Your Profile Parchment</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (isEditingProfile) {
                    // Save profile changes
                    if (onUpdateProfile) {
                      onUpdateProfile({
                        name: editName,
                        phone: editPhone,
                        birthday: editBirthday,
                        gender: editGender,
                        profileImage: editImage,
                        email: userEmail
                      });
                    }
                  }
                  setIsEditingProfile(!isEditingProfile);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border ${
                  isEditingProfile 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/50' 
                    : theme === 'natural-tones'
                      ? 'bg-natural-sage/10 text-natural-sage border-natural-sage/20 hover:bg-natural-sage/20'
                      : 'bg-stone-50 hover:bg-stone-100 dark:bg-stone-900 dark:hover:bg-stone-850 text-stone-750 dark:text-stone-300 border-stone-200 dark:border-stone-800'
                }`}
              >
                {isEditingProfile ? (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </>
                ) : (
                  <>
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </>
                )}
              </button>
            </div>

            {isEditingProfile ? (
              <div className="space-y-4 pt-1 animate-fade-in">
                {/* Avatar selector */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-stone-400 dark:text-stone-500 mb-2 font-semibold">
                    Profile Avatar
                  </label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 rounded-xl border border-stone-150 dark:border-stone-800/60 bg-stone-50/40 dark:bg-stone-900/20">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-950 text-2xl shadow-2xs shrink-0 overflow-hidden select-none">
                      {editImage.startsWith("http") ? (
                        <img src={editImage} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <span>{editImage}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {avatarPresets.map((p, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setEditImage(p.emoji)}
                          className={`w-9 h-9 rounded-full border flex items-center justify-center text-lg shadow-2xs hover:scale-105 active:scale-95 transition-all cursor-pointer ${p.bg} ${
                            editImage === p.emoji ? "ring-2 ring-natural-sage ring-offset-2 dark:ring-offset-stone-900" : ""
                          }`}
                          title={p.label}
                        >
                          {p.emoji}
                        </button>
                      ))}
                      {userProfile.profileImage.startsWith("http") && editImage !== userProfile.profileImage && (
                        <button
                          type="button"
                          onClick={() => setEditImage(userProfile.profileImage)}
                          className="w-9 h-9 rounded-full border overflow-hidden hover:scale-105 active:scale-95 transition-all cursor-pointer"
                          title="Original Profile Photo"
                        >
                          <img src={userProfile.profileImage} alt="Original Photo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-stone-400 dark:text-stone-500 mb-1 font-semibold">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={`w-full px-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-stone-950 text-stone-850 dark:text-stone-100 focus:outline-none focus:ring-1 ${
                        theme === "natural-tones" 
                          ? "border-natural-border focus:ring-natural-sage focus:border-natural-sage" 
                          : "border-stone-200 dark:border-stone-800 focus:ring-amber-500 focus:border-amber-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-stone-400 dark:text-stone-500 mb-1 font-semibold">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      className={`w-full px-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-stone-950 text-stone-850 dark:text-stone-100 focus:outline-none focus:ring-1 ${
                        theme === "natural-tones" 
                          ? "border-natural-border focus:ring-natural-sage focus:border-natural-sage" 
                          : "border-stone-200 dark:border-stone-800 focus:ring-amber-500 focus:border-amber-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-stone-400 dark:text-stone-500 mb-1 font-semibold">
                      Birthday
                    </label>
                    <input
                      type="date"
                      value={editBirthday}
                      onChange={(e) => setEditBirthday(e.target.value)}
                      className={`w-full px-3 py-1.5 text-sm border rounded-lg bg-white dark:bg-stone-950 text-stone-850 dark:text-stone-100 focus:outline-none focus:ring-1 ${
                        theme === "natural-tones" 
                          ? "border-natural-border focus:ring-natural-sage focus:border-natural-sage" 
                          : "border-stone-200 dark:border-stone-800 focus:ring-amber-500 focus:border-amber-500"
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-stone-400 dark:text-stone-500 mb-1 font-semibold">
                      Gender
                    </label>
                    <div className="relative">
                      <select
                        value={editGender}
                        onChange={(e) => setEditGender(e.target.value)}
                        className={`w-full pl-3 pr-8 py-1.5 text-sm border rounded-lg bg-white dark:bg-stone-950 text-stone-850 dark:text-stone-100 focus:outline-none focus:ring-1 appearance-none ${
                          theme === "natural-tones" 
                            ? "border-natural-border focus:ring-natural-sage focus:border-natural-sage" 
                            : "border-stone-200 dark:border-stone-800 focus:ring-amber-500 focus:border-amber-500"
                        }`}
                      >
                        <option value="">Select Gender</option>
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="non-binary">Non-binary</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center py-2 animate-fade-in">
                {/* Profile Pic preview */}
                <div className="flex items-center justify-center w-16 h-16 rounded-full border-2 border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 text-3xl shadow-xs overflow-hidden shrink-0 select-none">
                  {userProfile.profileImage.startsWith("http") ? (
                    <img src={userProfile.profileImage} alt={userProfile.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span>{userProfile.profileImage}</span>
                  )}
                </div>

                {/* Details list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 flex-1 w-full text-xs">
                  <div>
                    <span className="block font-mono text-[9px] uppercase tracking-wider text-stone-400 dark:text-stone-500">Full Name</span>
                    <span className="font-semibold text-stone-800 dark:text-stone-200 mt-0.5 block">{userProfile.name || "—"}</span>
                  </div>
                  <div>
                    <span className="block font-mono text-[9px] uppercase tracking-wider text-stone-400 dark:text-stone-500">Phone</span>
                    <span className="text-stone-700 dark:text-stone-300 mt-0.5 block">{userProfile.phone || "—"}</span>
                  </div>
                  <div>
                    <span className="block font-mono text-[9px] uppercase tracking-wider text-stone-400 dark:text-stone-500">Birthday</span>
                    <span className="text-stone-700 dark:text-stone-300 mt-0.5 block">
                      {userProfile.birthday ? new Date(userProfile.birthday).toLocaleDateString(undefined, { dateStyle: 'medium' }) : "—"}
                    </span>
                  </div>
                  <div>
                    <span className="block font-mono text-[9px] uppercase tracking-wider text-stone-400 dark:text-stone-500">Gender</span>
                    <span className="text-stone-700 dark:text-stone-300 mt-0.5 block capitalize">{userProfile.gender || "—"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LANGUAGE SELECTOR CARD */}
        <div className="p-5 bg-white dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800" id="language-card">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-4">
            {translations[language]['settings.language_label']}
          </h3>

          <div className="flex gap-4">
            {[
              { id: 'en', name: 'English (US)' },
              { id: 'zh-TW', name: '繁體中文 (Traditional Chinese)' }
            ].map((langOption) => (
              <button
                key={langOption.id}
                onClick={() => onChangeLanguage(langOption.id as Language)}
                className={`flex-1 px-4 py-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer hover:shadow-xs ${
                  language === langOption.id
                    ? theme === 'natural-tones'
                      ? 'bg-natural-sage-light/30 border-natural-border ring-2 ring-natural-sage'
                      : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 ring-2 ring-amber-600 dark:ring-amber-500'
                    : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 opacity-70 hover:opacity-100'
                }`}
              >
                <span className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                  {langOption.name}
                </span>
                {language === langOption.id && (
                  <Check className={`w-4.5 h-4.5 ${theme === 'natural-tones' ? 'text-natural-sage' : 'text-amber-800 dark:text-amber-500'}`} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* THEME SELECTOR CARD */}
        <div className="p-5 bg-white dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-4">
            {translations[language]['settings.theme_label'] || "Parchment Theme Presets"}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                id: 'natural-tones',
                name: 'Natural Tones',
                desc: 'Sage green accents on soft warm paper. Inspired by Japanese organic stationery and quiet gardens.',
                colorBg: 'bg-natural-bg',
                colorBorder: 'border-natural-border',
                textColor: 'text-natural-text'
              },
              {
                id: 'warm-paper',
                name: 'Warm Moleskine',
                desc: 'Ivory tinted warm paper with charcoal text and brown accents. Replicates premium sketchbooks.',
                colorBg: 'bg-[#faf6f0]',
                colorBorder: 'border-[#eae1d4]',
                textColor: 'text-stone-800'
              },
              {
                id: 'slate-clean',
                name: 'Slate Minimal',
                desc: 'Swiss architectural grid mode. Clean white canvas, crisp gray outlines and structured fonts.',
                colorBg: 'bg-white',
                colorBorder: 'border-stone-200',
                textColor: 'text-stone-800'
              },
              {
                id: 'charcoal-dark',
                name: 'Charcoal Nocturne',
                desc: 'Eye-safe dark parchment mode. Deep slate-charcoal canvas with muted soft cream highlights.',
                colorBg: 'bg-[#1c1b19]',
                colorBorder: 'border-[#2d2c29]',
                textColor: 'text-[#d6cbb5]'
              }
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => onChangeTheme(preset.id as ThemeType)}
                className={`p-4 rounded-xl border text-left flex flex-col justify-between h-[155px] transition-all cursor-pointer hover:shadow-sm ${preset.colorBg} ${preset.colorBorder} ${
                  theme === preset.id
                    ? preset.id === 'natural-tones'
                      ? 'ring-2 ring-natural-sage scale-[1.02]'
                      : 'ring-2 ring-amber-600 dark:ring-amber-500 scale-[1.02]'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                <div>
                  <h4 className={`text-xs font-semibold ${preset.textColor}`}>
                    {preset.name}
                  </h4>
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-2 leading-relaxed">
                    {preset.desc}
                  </p>
                </div>
                <div className={`text-[10px] font-mono ${preset.textColor} flex items-center justify-between border-t border-dashed ${preset.colorBorder} pt-2 mt-2 w-full`}>
                  <span>{theme === preset.id ? '● Active' : 'Select'}</span>
                  <span>{preset.id === 'charcoal-dark' ? 'Dark' : 'Light'}</span>
                </div>
              </button>
            ))}
          </div>

        </div>

        {/* DATA UTILITIES CARD */}
        <div className="p-5 bg-white dark:bg-stone-950 rounded-xl border border-stone-200 dark:border-stone-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-4">
            Data Ledger & Backups
          </h3>
          <p className="text-xs text-stone-600 dark:text-stone-400 mb-4 leading-relaxed">
            All database entries (tasks, journals, reminders, expenses, events) are cached securely on your device's browser database. 
            You can download backups or restore standard presets for testing at any time.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="settings-data-actions">
            {/* Backup/Restore Buttons */}
            <button
              onClick={handleExportData}
              className="flex items-center justify-center gap-2 px-4 py-2 text-xs border border-stone-200 dark:border-stone-800 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-900 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-700 dark:text-amber-500" />
              <span>Export backup JSON</span>
            </button>

            <label className="flex items-center justify-center gap-2 px-4 py-2 text-xs border border-stone-200 dark:border-stone-800 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-900 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer">
              <Upload className="w-4 h-4 text-emerald-700 dark:text-emerald-500" />
              <span>Import backup JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>

            <button
              onClick={handleRestoreSampleData}
              className="flex items-center justify-center gap-2 px-4 py-2 text-xs border border-stone-200 dark:border-stone-800 rounded-lg hover:bg-amber-50/50 dark:hover:bg-amber-950/20 text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-amber-600" />
              <span>Restore Demo Data</span>
            </button>

            <button
              onClick={handleClearAllData}
              className="flex items-center justify-center gap-2 px-4 py-2 text-xs border border-stone-200 dark:border-stone-800 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-700 dark:text-rose-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Wipe database clean</span>
            </button>
          </div>
        </div>

        {/* INFO ABOUT COGNITIVE LOAD CARD */}
        <div className="p-5 bg-amber-50/20 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-xl space-y-2">
          <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 fill-amber-700/20" />
            Product Design Core Intent
          </h4>
          <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
            This workspace was created specifically to escape the noise of notifications, gamified points, streak badges, 
            and complex hierarchies. It is not designed to help you cram more work into a day, 
            but to offer a calm visual space to reflect on what is done, write down what happened, 
            and track small everyday moments.
          </p>
        </div>
      </div>
    </div>
  );
}
