export type Language = 'en' | 'zh-TW';

export const translations = {
  'en': {
    // Tabs
    'tab.today': 'Today',
    'tab.calendar': 'Calendar',
    'tab.history': 'History',
    'tab.insights': 'Insights',
    'tab.settings': 'Settings',

    // Today View
    'today.guest_mode': 'Guest Mode • Local Save',
    'today.cloud_backup_synced': 'Cloud Backup Synced',
    'today.offline_guest_mode': 'Offline Guest Mode: Your logs are stored locally',
    'today.offline_desc': 'Set up your day, write some entries, then save them safely in the cloud so you never lose your beautiful planner parchment when switching tablets.',
    'today.cloud_backup': 'Cloud Backup',
    
    // Scheduled Events
    'today.scheduled_events': 'Scheduled Events',
    'today.cancel': 'Cancel',
    'today.add_event': 'Add Event',
    'today.save': 'Save',
    'today.no_events': 'No scheduled events',
    'today.placeholder_event_title': 'e.g. Lunch with Mom',
    
    // Tasks
    'today.todays_tasks': "Today's Tasks",
    'today.done': 'Done',
    'today.no_tasks': 'No tasks added for this day',
    'today.placeholder_task': 'What needs to be done?',
    
    // Reminders
    'today.bullet_reminders': 'Bullet Reminders',
    'today.no_reminders': 'No reminders noted',
    'today.placeholder_reminder': 'Submit assignment, renew insurance...',
    
    // Journal
    'today.daily_journal': 'Daily Journal',
    'today.journal_saving': 'Saving diary...',
    'today.journal_saved': 'Saved to diary',
    'today.journal_idle': 'Draft matches cloud',
    'today.placeholder_journal': 'What happened today? Write down your feelings, discoveries, or details of tea brewed...',
    
    // Expenses
    'today.expenses_tracker': 'Expenses & Income',
    'today.total_spend': 'Total Expense: NT$',
    'today.total_income': 'Total Income: NT$',
    'today.balance': 'Net Balance: NT$',
    'today.no_expenses': 'No expenditures or incomes recorded today',
    'today.amount': 'Amount',
    'today.note': 'Note (e.g. Salary, Oolong tea can, lunch box)',
    'today.type_expense': 'Expense',
    'today.type_income': 'Income',
    
    // Categories
    'category.food': 'Food 🍔',
    'category.clothing': 'Clothing 👕',
    'category.housing': 'Housing 🏠',
    'category.transit': 'Transit 🚗',
    'category.education': 'Education 📚',
    'category.entertainment': 'Entertainment 🎮',
    'category.salary': 'Salary 💰',
    'category.other': 'Other 🏷️',
    
    // AI Brain Dump
    'today.ai_brain_dump': 'AI Brain Dump & Sort',
    'today.ai_processing': 'AI is parsing & sorting...',
    'today.ai_idle': 'Unstructured text entry',
    'today.placeholder_braindump': "Pour your busy thoughts here: e.g. 'Log NT$ 150 spent on high-mountain Oolong tea. Remind me to review travel options to Kyoto tomorrow at 3pm, and CS assignment.'",
    'today.ai_helper': 'AI automatically maps unstructured text to schedules, tag lists, journals, and expense ledgers.',
    'today.organize_ai': 'Organize with AI',
    'today.ai_success': 'AI Successfully Sorted Your Thoughts!',
    'today.event_count': 'Event(s)',
    'today.task_count': 'Task(s)',
    'today.goal_count': 'Goal(s)',
    'today.expense_count': 'Expense/Income',
    'today.journal_count': 'Journal(s)',
    'today.ai_preference': 'Remembered preference:',
    'today.ai_remembered': 'AI Remembered Preferences',
    'today.reset_preferences': 'Reset Preferences',

    // Modal / Detail Popups
    'detail.title': 'Item Details',
    'detail.task_title': 'Edit Task',
    'detail.reminder_title': 'Edit Reminder',
    'detail.title_label': 'Title',
    'detail.tag_label': 'Tag',
    'detail.memo_label': 'Memo / Details',
    'detail.placeholder_memo': 'Add extra notes or details here...',
    'detail.save_changes': 'Save Details',
    'detail.close': 'Close',

    // Settings
    'settings.title': 'Planner Preferences',
    'settings.subtitle': 'Configure paper styling, backups, and database purges',
    'settings.cloud_backup': 'Firebase Cloud Backup',
    'settings.local_guest': 'Local-Only Offline Guest Mode',
    'settings.profile_parchment': 'Your Profile Parchment',
    'settings.edit_profile': 'Edit Profile',
    'settings.save_changes': 'Save Changes',
    'settings.theme_presets': 'Parchment Theme Presets',
    'settings.data_utilities': 'Data Ledger & Backups',
    'settings.restore_demo': 'Restore Demo Data',
    'settings.wipe_db': 'Wipe database clean',
    'settings.export_json': 'Export backup JSON',
    'settings.import_json': 'Import backup JSON',
    'settings.language_label': 'Language / 語言',
    'settings.sign_out': 'Sign Out & Switch Account',
    'settings.access_cloud': 'Access Cloud & Log In',
  },
  'zh-TW': {
    // Tabs
    'tab.today': '今日',
    'tab.calendar': '日曆',
    'tab.history': '歷史',
    'tab.insights': '洞察',
    'tab.settings': '設定',

    // Today View
    'today.guest_mode': '訪客模式 • 本地儲存',
    'today.cloud_backup_synced': '雲端備份已同步',
    'today.offline_guest_mode': '離線訪客模式：日誌儲存在本地',
    'today.offline_desc': '安排您的日程、撰寫日誌，然後安全地儲存在雲端，讓您在切換裝置時永遠不會遺失精美的計劃書。',
    'today.cloud_backup': '雲端備份',
    
    // Scheduled Events
    'today.scheduled_events': '日程表',
    'today.cancel': '取消',
    'today.add_event': '新增日程',
    'today.save': '儲存',
    'today.no_events': '今日無預定日程',
    'today.placeholder_event_title': '例如：和媽媽吃午餐',
    
    // Tasks
    'today.todays_tasks': '今日任務',
    'today.done': '完成',
    'today.no_tasks': '今日未新增任何任務',
    'today.placeholder_task': '需要做些什麼？',
    
    // Reminders
    'today.bullet_reminders': '追蹤清單',
    'today.no_reminders': '無追蹤記錄',
    'today.placeholder_reminder': '繳交作業、續約保險...',
    
    // Journal
    'today.daily_journal': '每日日記',
    'today.journal_saving': '正在儲存日記...',
    'today.journal_saved': '日記已儲存',
    'today.journal_idle': '草稿與雲端一致',
    'today.placeholder_journal': '今天發生了什麼事？寫下您的心情、新發現，或是今天泡了什麼茶的細節...',
    
    // Expenses
    'today.expenses_tracker': '記帳帳本',
    'today.total_spend': '今日總支出：NT$',
    'today.total_income': '今日總收入：NT$',
    'today.balance': '今日收支差額：NT$',
    'today.no_expenses': '今日無花費與收入記錄',
    'today.amount': '金額',
    'today.note': '備註（例如：薪資、高山烏龍茶葉、便當）',
    'today.type_expense': '支出',
    'today.type_income': '收入',
    
    // Categories
    'category.food': '食 🍔',
    'category.clothing': '衣 👕',
    'category.housing': '住 🏠',
    'category.transit': '行 🚗',
    'category.education': '育 📚',
    'category.entertainment': '樂 🎮',
    'category.salary': '薪資收入 💰',
    'category.other': '其他 🏷️',
    
    // AI Brain Dump
    'today.ai_brain_dump': 'AI 腦力傾倒與整理',
    'today.ai_processing': 'AI 正在解析並整理中...',
    'today.ai_idle': '非結構化文字輸入',
    'today.placeholder_braindump': "在這裡傾倒您繁忙的思緒：例如「記帳花費 150 元買高山烏龍茶。提醒我明天下午三點看去京都的旅遊方案，還有寫 CS 作業。」",
    'today.ai_helper': 'AI 將會自動把非結構化的文字對應到日程、任務、備忘以及花費帳本中。',
    'today.organize_ai': '使用 AI 整理',
    'today.ai_success': 'AI 成功整理了您的思緒！',
    'today.event_count': '日程',
    'today.task_count': '任務',
    'today.goal_count': '追蹤項目',
    'today.expense_count': '支出/收入',
    'today.journal_count': '日記',
    'today.ai_preference': '記下的偏好：',
    'today.ai_remembered': 'AI 記下的用戶偏好',
    'today.reset_preferences': '重設偏好設定',

    // Modal / Detail Popups
    'detail.title': '項目詳情',
    'detail.task_title': '編輯任務',
    'detail.reminder_title': '編輯追蹤項目',
    'detail.title_label': '標題',
    'detail.tag_label': '標籤',
    'detail.memo_label': '備忘 / 詳情',
    'detail.placeholder_memo': '在此新增額外的備忘或詳情資訊...',
    'detail.save_changes': '儲存詳情',
    'detail.close': '關閉',

    // Settings
    'settings.title': '計劃書偏好設定',
    'settings.subtitle': '配置紙張樣式、備份以及資料清除',
    'settings.cloud_backup': 'Firebase 雲端備份',
    'settings.local_guest': '僅限本地的離線訪客模式',
    'settings.profile_parchment': '您的個人資料檔案',
    'settings.edit_profile': '編輯個人資料',
    'settings.save_changes': '儲存變更',
    'settings.theme_presets': '紙張主題預設值',
    'settings.data_utilities': '資料帳本與備份',
    'settings.restore_demo': '還原示範資料',
    'settings.wipe_db': '清空資料庫',
    'settings.export_json': '匯出備份 JSON',
    'settings.import_json': '匯入備份 JSON',
    'settings.language_label': 'Language / 語言',
    'settings.sign_out': '登出並切換帳號',
    'settings.access_cloud': '登入並連結雲端',
  }
};

export const detectLanguage = (): Language => {
  const lang = navigator.language || '';
  if (
    lang.toLowerCase().includes('zh-tw') || 
    lang.toLowerCase().includes('zh-hk') || 
    lang.toLowerCase().includes('zh-hant') || 
    lang.toLowerCase() === 'zh'
  ) {
    return 'zh-TW';
  }
  return 'en';
};
