export type FeeStatus = 'paid' | 'pending' | 'waived';

export interface Fee {
  id: string;
  type: 'overdue_fine' | 'lost_book' | 'damage' | 'processing';
  loanId: string;
  bookTitle: string;
  amount: number;
  issuedDate: string;
  paidDate?: string;
  status: FeeStatus;
  description: string;
}

export const mockFees: Fee[] = [
  {
    id: 'FE001',
    type: 'overdue_fine',
    loanId: 'LN002',
    bookTitle: 'To Kill a Mockingbird',
    amount: 4.50,
    issuedDate: '2026-05-16',
    status: 'pending',
    description: 'Overdue fine — 30 days overdue at $0.15/day',
  },
  {
    id: 'FE002',
    type: 'overdue_fine',
    loanId: 'LN004',
    bookTitle: 'Dune',
    amount: 12.00,
    issuedDate: '2026-04-02',
    status: 'pending',
    description: 'Overdue fine — 80 days overdue at $0.15/day',
  },
  {
    id: 'FE003',
    type: 'overdue_fine',
    loanId: 'LN006',
    bookTitle: 'Brave New World',
    amount: 3.00,
    issuedDate: '2026-04-11',
    paidDate: '2026-04-20',
    status: 'paid',
    description: 'Overdue fine — 20 days overdue at $0.15/day',
  },
  {
    id: 'FE004',
    type: 'overdue_fine',
    loanId: 'LN007',
    bookTitle: 'The Hobbit',
    amount: 2.25,
    issuedDate: '2026-03-16',
    paidDate: '2026-03-25',
    status: 'paid',
    description: 'Overdue fine — 15 days overdue at $0.15/day',
  },
  {
    id: 'FE005',
    type: 'damage',
    loanId: 'LN007',
    bookTitle: 'The Hobbit',
    amount: 15.00,
    issuedDate: '2026-03-10',
    paidDate: '2026-03-25',
    status: 'paid',
    description: 'Minor water damage to cover page',
  },
  {
    id: 'FE006',
    type: 'overdue_fine',
    loanId: 'LN008',
    bookTitle: 'Fahrenheit 451',
    amount: 1.50,
    issuedDate: '2026-02-06',
    paidDate: '2026-02-10',
    status: 'paid',
    description: 'Overdue fine — 10 days overdue at $0.15/day',
  },
  {
    id: 'FE007',
    type: 'processing',
    loanId: 'LN009',
    bookTitle: 'Pride and Prejudice',
    amount: 2.00,
    issuedDate: '2026-04-01',
    paidDate: '2026-04-28',
    status: 'paid',
    description: 'Processing fee for inter-library loan',
  },
  {
    id: 'FE008',
    type: 'lost_book',
    loanId: 'LN004',
    bookTitle: 'Dune',
    amount: 35.00,
    issuedDate: '2026-06-01',
    status: 'pending',
    description: 'Lost book replacement fee',
  },
  {
    id: 'FE009',
    type: 'overdue_fine',
    loanId: 'LN001',
    bookTitle: 'The Great Gatsby',
    amount: 0.00,
    issuedDate: '2026-06-11',
    status: 'pending',
    description: 'Overdue fine accruing — due yesterday',
  },
];
