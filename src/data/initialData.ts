import { PlannerState, TaskTag } from '../types';

// Helper to format Date objects to YYYY-MM-DD
export function formatToISODate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function generateInitialData(): PlannerState {
  const today = new Date();
  
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(today.getDate() - 2);
  
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(today.getDate() - 3);

  const d1 = formatToISODate(today);
  const d2 = formatToISODate(yesterday);
  const d3 = formatToISODate(twoDaysAgo);
  const d4 = formatToISODate(threeDaysAgo);

  return {
    events: [
      // Today's events
      {
        id: 'e-today-1',
        date: d1,
        time: '14:00',
        title: 'Lunch with Mom at the Garden Cafe'
      },
      {
        id: 'e-today-2',
        date: d1,
        time: '18:00',
        title: 'Piano Lesson with Mr. Schubert'
      },
      // Yesterday's events
      {
        id: 'e-yest-1',
        date: d2,
        time: '10:00',
        title: 'Review weekly progress report'
      },
      {
        id: 'e-yest-2',
        date: d2,
        time: '16:30',
        title: 'Call travel agent about flight'
      },
      // Three days ago
      {
        id: 'e-3ago-1',
        date: d4,
        time: '11:00',
        title: 'Dentist appointment'
      }
    ],
    tasks: [
      // Today's tasks
      {
        id: 't-today-1',
        date: d1,
        title: 'Buy premium Oolong tea leaves',
        tag: 'Tea' as TaskTag,
        completed: false
      },
      {
        id: 't-today-2',
        date: d1,
        title: 'Prepare final slides for College presentation',
        tag: 'College' as TaskTag,
        completed: true
      },
      {
        id: 't-today-3',
        date: d1,
        title: 'Research affordable hostels in Kyoto',
        tag: 'Travel' as TaskTag,
        completed: false
      },
      {
        id: 't-today-4',
        date: d1,
        title: 'Organize bedroom desk and drawers',
        tag: 'Personal' as TaskTag,
        completed: true
      },
      // Yesterday's tasks
      {
        id: 't-yest-1',
        date: d2,
        title: 'Attend lecture on ancient philosophies',
        tag: 'College' as TaskTag,
        completed: true
      },
      {
        id: 't-yest-2',
        date: d2,
        title: 'Clean Matcha whisk and matcha bowl',
        tag: 'Tea' as TaskTag,
        completed: true
      },
      {
        id: 't-yest-3',
        date: d2,
        title: 'Stretch for 20 minutes before bed',
        tag: 'Personal' as TaskTag,
        completed: false
      },
      // Two days ago tasks
      {
        id: 't-2ago-1',
        date: d3,
        title: 'Submit College chemistry homework',
        tag: 'College' as TaskTag,
        completed: true
      },
      {
        id: 't-2ago-2',
        date: d3,
        title: 'Book train tickets for weekend getaway',
        tag: 'Travel' as TaskTag,
        completed: true
      },
      {
        id: 't-2ago-3',
        date: d3,
        title: 'Drink 2 liters of water',
        tag: 'Personal' as TaskTag,
        completed: true
      }
    ],
    reminders: [
      {
        id: 'r-1',
        date: d1,
        title: 'Submit chemistry assignment by Friday midnight',
        completed: false
      },
      {
        id: 'r-2',
        date: d1,
        title: 'Renew scooter insurance before next week',
        completed: false
      },
      {
        id: 'r-3',
        date: d2,
        title: 'Call grandma to check in',
        completed: true
      }
    ],
    journals: [
      {
        id: 'j-today',
        date: d1,
        content: "Had a slow and thoughtful morning. Sipped a cup of cold-brew tea and watched the rainfall. The lunch with Mom was delightful; she shared some old family stories I'd never heard before. Felt a bit tired in the afternoon but the piano lesson really rejuvenated me. Getting the hang of that Chopin nocturne."
      },
      {
        id: 'j-yest',
        date: d2,
        content: "College was busy today with the philosophy seminar. We debated the concepts of mindfulness in modern lifestyles—very fitting for this planner. Later, did a deep cleaning of my matcha set. The calm focus required for tea preparation acts as a perfect reset button for my mind."
      },
      {
        id: 'j-2ago',
        date: d3,
        content: "Finished booking the weekend trip! Very excited to spend some quiet time in nature. College workload is picking up, but keeping everything tracked in one place is helping me stay relaxed. Less worrying about forgetting things, more focusing on what's in front of me."
      }
    ],
    expenses: [
      // Today's expenses
      {
        id: 'ex-today-1',
        date: d1,
        amount: 220,
        category: 'Food',
        note: 'Lunch with Mom at the garden cafe'
      },
      {
        id: 'ex-today-2',
        date: d1,
        amount: 150,
        category: 'Personal',
        note: 'Specialty black tea can'
      },
      // Yesterday's expenses
      {
        id: 'ex-yest-1',
        date: d2,
        amount: 85,
        category: 'Food',
        note: 'Subway quick dinner'
      },
      {
        id: 'ex-yest-2',
        date: d2,
        amount: 450,
        category: 'College',
        note: 'Textbook on Eastern philosophies'
      },
      // Two days ago expenses
      {
        id: 'ex-2ago-1',
        date: d3,
        amount: 1200,
        category: 'Travel',
        note: 'Weekend train ticket package'
      },
      {
        id: 'ex-2ago-2',
        date: d3,
        amount: 120,
        category: 'Personal',
        note: 'A5 leather notebook refills'
      }
    ],
    brainDumps: [
      {
        id: 'bd-today',
        date: d1,
        content: "Ideas for the travel blog layout: keep it extremely simple, just a photo grid and short descriptions. Maybe use a cream background. \n\nAlso need to remember to look up that book on Zen gardens recommended by my philosophy professor. \n\nWhy is Oolong tea so much more complex when brewed at 85 degrees versus boiling?"
      },
      {
        id: 'bd-yest',
        date: d2,
        content: "Feeling a bit overwhelmed by the group project but I think if I break it down it's fine. Need to let go of trying to control other people's speed. \n\nKyoto flight dates check: Oct 14-22? Check fall foliage calendar."
      },
      {
        id: 'bd-2ago',
        date: d3,
        content: "Random sketch ideas for the design portfolio. Use minimalist borders. Bold headings, light text underneath. Focus on high-contrast negative space."
      }
    ]
  };
}
