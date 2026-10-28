// Fictional seed data for the click prototypes. Amounts are integer minor units (cents).
window.PM_SEED = () => {
  const entry = (at, type, amount, comment = '', by = 'Mara Example') => ({ at, type, amount, comment, by });
  const allowance = (month, amount) => entry(`2026-${month}-01T00:00:00+02:00`, 'allowance', amount, '', 'automatic');

  const emma = [
    entry('2026-03-15T10:00:00+01:00', 'opening', 2000),
    allowance('04', 500), entry('2026-04-12T15:20:00+02:00', 'withdrawal', -350, 'Ice cream'),
    allowance('05', 500), entry('2026-05-03T11:00:00+02:00', 'deposit', 1000, 'Flea market'), entry('2026-05-20T16:45:00+02:00', 'withdrawal', -799, 'Comic book'),
    allowance('06', 500), entry('2026-06-08T09:30:00+02:00', 'withdrawal', -250, 'Stickers'), entry('2026-06-21T18:00:00+02:00', 'deposit', 2000, 'Birthday gift from grandma', 'Tom Example'),
    allowance('07', 500), entry('2026-07-14T14:10:00+02:00', 'withdrawal', -1299, 'Swimming goggles'), entry('2026-07-28T10:05:00+02:00', 'withdrawal', -300, 'Cinema snacks'),
    allowance('08', 500), entry('2026-08-09T12:00:00+02:00', 'deposit', 500, 'Helped in the garden', 'Tom Example'), entry('2026-08-22T17:30:00+02:00', 'withdrawal', -450, 'Pencils'),
    allowance('09', 500), entry('2026-09-05T13:15:00+02:00', 'withdrawal', -199, 'Bus ticket'), entry('2026-09-18T15:00:00+02:00', 'deposit', 300, 'Returned bottles'), entry('2026-09-27T11:40:00+02:00', 'withdrawal', -600, 'Board game share'),
    allowance('10', 500), entry('2026-10-04T10:25:00+02:00', 'withdrawal', -150, 'Chewing gum'), entry('2026-10-06T16:00:00+02:00', 'deposit', 200, 'Found coins'), entry('2026-10-08T09:10:00+02:00', 'withdrawal', -277, 'Notebook'), entry('2026-10-09T14:00:00+02:00', 'withdrawal', -1000, 'Savings for bike', 'Tom Example')
  ];

  return {
    accounts: [
      {
        id: 'alex', name: 'Alex', allowance: { enabled: true, amount: 500 },
        purgeAtUtc: '2026-11-09T11:00:00+01:00', missedAllowanceMonths: [{ month: '2026-10', amount: 500 }],
        history: [entry('2026-09-01T10:00:00+02:00', 'opening', 1000), entry('2026-09-15T10:00:00+02:00', 'deposit', 500)]
      },
      { id: 'ben', name: 'Ben', allowance: { enabled: false, amount: 0 }, history: [] },
      { id: 'emma', name: 'Emma', allowance: { enabled: true, amount: 500 }, history: emma },
      {
        id: 'lena', name: 'Lena', allowance: { enabled: true, amount: 1000 }, history: [
          entry('2026-09-15T09:00:00+02:00', 'opening', 120000, 'Savings book'), allowance('10', 1000), entry('2026-10-02T17:00:00+02:00', 'deposit', 4000, 'Babysitting')
        ]
      },
      { id: 'mia', name: 'Mia', allowance: { enabled: false, amount: 0 }, history: [entry('2026-09-01T08:00:00+02:00', 'opening', 0)] },
      {
        id: 'noah', name: 'Noah', allowance: { enabled: true, amount: 500 }, history: [
          entry('2026-08-15T09:12:00+02:00', 'opening', -5500), allowance('09', 500), entry('2026-09-24T17:05:00+02:00', 'deposit', 5000, 'Birthday gift from grandma', 'Tom Example'), allowance('10', 500), entry('2026-10-10T14:32:00+02:00', 'withdrawal', -1299, 'Book')
        ]
      },
      {
        id: 'paul', name: 'Paul', allowance: { enabled: true, amount: 250, failedPeriod: '2026-10' }, history: [
          entry('2026-08-20T10:00:00+02:00', 'opening', 70), allowance('09', 250)
        ]
      }
    ],
    users: [
      { id: 'mara', displayName: 'Mara Example', username: 'mara', role: 'Manager', status: 'active' },
      { id: 'tom', displayName: 'Tom Example', username: 'tom', role: 'Manager', status: 'active' },
      { id: 'emma', displayName: 'Emma', username: 'emma', role: 'Member', status: 'active' },
      { id: 'noah', displayName: 'Noah', username: 'noah', role: 'Member', status: 'disabled' },
      { id: 'lena', displayName: 'Lena', username: 'lena', role: 'Member', status: 'mustChange' }
    ]
  };
};
