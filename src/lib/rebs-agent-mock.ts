export type RebsAgentMock = {
  id: number
  name: string
  email: string
  phone: string
  avatar: string
  closed_transactions: number
  total_value: number
  active_listings: number
  last_transaction_date: string
}

export const rebsMockAgents: RebsAgentMock[] = [
  {
    id: 1,
    name: 'Maria Popescu',
    email: 'maria.popescu@rebs.ro',
    phone: '+40 722 123 456',
    avatar: 'https://i.pravatar.cc/150?img=1',
    closed_transactions: 28,
    total_value: 3500000,
    active_listings: 12,
    last_transaction_date: '2025-10-05',
  },
  {
    id: 2,
    name: 'Ion Ionescu',
    email: 'ion.ionescu@rebs.ro',
    phone: '+40 722 234 567',
    avatar: 'https://i.pravatar.cc/150?img=12',
    closed_transactions: 25,
    total_value: 3200000,
    active_listings: 8,
    last_transaction_date: '2025-10-04',
  },
  {
    id: 3,
    name: 'Ana Georgescu',
    email: 'ana.georgescu@rebs.ro',
    phone: '+40 722 345 678',
    avatar: 'https://i.pravatar.cc/150?img=5',
    closed_transactions: 22,
    total_value: 2800000,
    active_listings: 15,
    last_transaction_date: '2025-10-03',
  },
  {
    id: 4,
    name: 'Mihai Dumitrescu',
    email: 'mihai.dumitrescu@rebs.ro',
    phone: '+40 722 456 789',
    avatar: 'https://i.pravatar.cc/150?img=13',
    closed_transactions: 19,
    total_value: 2400000,
    active_listings: 10,
    last_transaction_date: '2025-10-02',
  },
  {
    id: 5,
    name: 'Elena Constantinescu',
    email: 'elena.const@rebs.ro',
    phone: '+40 722 567 890',
    avatar: 'https://i.pravatar.cc/150?img=9',
    closed_transactions: 17,
    total_value: 2100000,
    active_listings: 7,
    last_transaction_date: '2025-10-01',
  },
  {
    id: 6,
    name: 'Alexandru Stanciu',
    email: 'alex.stanciu@rebs.ro',
    phone: '+40 722 678 901',
    avatar: 'https://i.pravatar.cc/150?img=14',
    closed_transactions: 15,
    total_value: 1900000,
    active_listings: 9,
    last_transaction_date: '2025-09-30',
  },
  {
    id: 7,
    name: 'Cristina Marin',
    email: 'cristina.marin@rebs.ro',
    phone: '+40 722 789 012',
    avatar: 'https://i.pravatar.cc/150?img=10',
    closed_transactions: 13,
    total_value: 1600000,
    active_listings: 6,
    last_transaction_date: '2025-09-28',
  },
  {
    id: 8,
    name: 'Andrei Popa',
    email: 'andrei.popa@rebs.ro',
    phone: '+40 722 890 123',
    avatar: 'https://i.pravatar.cc/150?img=15',
    closed_transactions: 11,
    total_value: 1400000,
    active_listings: 5,
    last_transaction_date: '2025-09-25',
  },
]


