export interface BookEntry {
  id: string;
  coverSrc: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  available: number;
  total: number;
  active: boolean;
}

export interface PickupEntry {
  id: string;
  bookTitle: string;
  bookISBN: string;
  bookCover: string;
  studentName: string;
  studentId: string;
  studentAvatar?: string;
  pin: string;
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'urgent' | 'expired' | 'redeemed';
}

export interface BorrowEntry {
  id: string;
  userAvatar?: string;
  userName: string;
  userId: string;
  bookTitle: string;
  bookCallNo: string;
  borrowDate: string;
  dueDate: string;
  status: 'active' | 'overdue';
  fees: number;
}

export interface ConditionSelection {
  id: string;
  name: string;
  fee: number;
  selected: boolean;
}

export interface InspectionEntry {
  borrowId: string;
  borrowerName: string;
  borrowerAvatar?: string;
  bookTitle: string;
  bookCover: string;
  isbn: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string;
  loanDuration: number;
  conditions: ConditionSelection[];
  notes: string;
  latePenalty: number;
  totalRepairFee: number;
  finalRefund: number;
}

export interface KPIMetric {
  id: string;
  label: string;
  value: number;
  trend: string;
  trendVariant: 'positive' | 'negative' | 'neutral';
  progress: number;
  progressColor: string;
  variant: 'default' | 'critical' | 'success';
}

const now = new Date();

function isoDate(daysOffset: number): string {
  const d = new Date(now);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString();
}

export const MOCK_BOOKS: BookEntry[] = [
  { id: 'b1', coverSrc: '/BookCover.png', title: 'Architecture of Thought', author: 'Julian Thorne', isbn: '978-3-16-148410-0', category: 'Philosophy', available: 3, total: 5, active: true },
  { id: 'b2', coverSrc: '/BookCover(1).png', title: 'The Modern Grid', author: 'Elena Rossi', isbn: '978-0-262-51763-8', category: 'Design', available: 0, total: 2, active: true },
  { id: 'b3', coverSrc: '/BookCover(2).png', title: 'Quantum Linguistics', author: 'Dr. Sarah Chen', isbn: '978-1-4028-9462-6', category: 'Science', available: 12, total: 15, active: false },
  { id: 'b4', coverSrc: '/BookCover(3).png', title: 'Urban Ecosystems', author: 'Marcus Vane', isbn: '978-3-540-49605-2', category: 'Environment', available: 8, total: 10, active: true },
  { id: 'b5', coverSrc: '/BookCover(4).png', title: 'The Silent Algorithm', author: 'Priya Kapoor', isbn: '978-0-13-468599-1', category: 'Technology', available: 5, total: 7, active: true },
  { id: 'b6', coverSrc: '/BookCover(5).png', title: 'Renaissance Revisited', author: 'Thomas Whitfield', isbn: '978-1-108-45678-9', category: 'Art', available: 1, total: 3, active: true },
  { id: 'b7', coverSrc: '/BookCover(6).png', title: 'Statistical Paradoxes', author: 'Dr. Lisa Huang', isbn: '978-0-19-876543-2', category: 'Mathematics', available: 0, total: 1, active: true },
  { id: 'b8', coverSrc: '/BookCover(7).png', title: 'The Art of Diplomacy', author: 'James Kensington', isbn: '978-0-7432-7356-6', category: 'Politics', available: 7, total: 8, active: true },
  { id: 'b9', coverSrc: '/BookCover(8).png', title: 'Neural Landscapes', author: 'Maria Santos', isbn: '978-0-262-04567-1', category: 'Science', available: 2, total: 6, active: true },
  { id: 'b10', coverSrc: '/BookCover(9).png', title: 'Bauhaus to Beyond', author: 'Oliver Grant', isbn: '978-3-7913-5678-9', category: 'Design', available: 4, total: 4, active: true },
  { id: 'b11', coverSrc: '/BookCover(10).png', title: 'Echoes of Empire', author: 'Ananya Mehta', isbn: '978-1-4088-4567-8', category: 'History', available: 6, total: 9, active: true },
  { id: 'b12', coverSrc: '/BookCover(11).png', title: 'Cybernetic Frontiers', author: 'Dr. Kenji Tanaka', isbn: '978-4-16-148410-5', category: 'Technology', available: 0, total: 2, active: false },
];

export const MOCK_PICKUPS: PickupEntry[] = [
  { id: 'p1', bookTitle: 'Architecture of Thought', bookISBN: '978-3-16-148410-0', bookCover: '/BookCover.png', studentName: 'Alice Nguyen', studentId: 'STU001', pin: '482931', createdAt: isoDate(-2), expiresAt: isoDate(0.5), status: 'urgent' },
  { id: 'p2', bookTitle: 'The Modern Grid', bookISBN: '978-0-262-51763-8', bookCover: '/BookCover(1).png', studentName: 'Ben Tran', studentId: 'STU002', pin: '719283', createdAt: isoDate(-1), expiresAt: isoDate(1), status: 'pending' },
  { id: 'p3', bookTitle: 'Quantum Linguistics', bookISBN: '978-1-4028-9462-6', bookCover: '/BookCover(2).png', studentName: 'Clara Lim', studentId: 'STU003', pin: '635274', createdAt: isoDate(-3), expiresAt: isoDate(-1), status: 'expired' },
  { id: 'p4', bookTitle: 'Urban Ecosystems', bookISBN: '978-3-540-49605-2', bookCover: '/BookCover(3).png', studentName: 'David Park', studentId: 'STU004', pin: '847362', createdAt: isoDate(-5), expiresAt: isoDate(-4), status: 'redeemed' },
  { id: 'p5', bookTitle: 'The Silent Algorithm', bookISBN: '978-0-13-468599-1', bookCover: '/BookCover(4).png', studentName: 'Elena Voss', studentId: 'STU005', pin: '192837', createdAt: isoDate(-1), expiresAt: isoDate(0.1), status: 'urgent' },
  { id: 'p6', bookTitle: 'Renaissance Revisited', bookISBN: '978-1-108-45678-9', bookCover: '/BookCover(5).png', studentName: 'Felix Chen', studentId: 'STU006', pin: '564738', createdAt: isoDate(0), expiresAt: isoDate(2), status: 'pending' },
  { id: 'p7', bookTitle: 'Statistical Paradoxes', bookISBN: '978-0-19-876543-2', bookCover: '/BookCover(6).png', studentName: 'Grace Kim', studentId: 'STU007', pin: '374829', createdAt: isoDate(-4), expiresAt: isoDate(-2), status: 'expired' },
  { id: 'p8', bookTitle: 'The Art of Diplomacy', bookISBN: '978-0-7432-7356-6', bookCover: '/BookCover(7).png', studentName: 'Hank Miller', studentId: 'STU008', pin: '918273', createdAt: isoDate(-6), expiresAt: isoDate(-5), status: 'redeemed' },
  { id: 'p9', bookTitle: 'Neural Landscapes', bookISBN: '978-0-262-04567-1', bookCover: '/BookCover(8).png', studentName: 'Iris Zhao', studentId: 'STU009', pin: '465738', createdAt: isoDate(-1), expiresAt: isoDate(0.8), status: 'pending' },
  { id: 'p10', bookTitle: 'Bauhaus to Beyond', bookISBN: '978-3-7913-5678-9', bookCover: '/BookCover(9).png', studentName: 'Jack Wilson', studentId: 'STU010', pin: '837465', createdAt: isoDate(-2), expiresAt: isoDate(-0.5), status: 'urgent' },
  { id: 'p11', bookTitle: 'Echoes of Empire', bookISBN: '978-1-4088-4567-8', bookCover: '/BookCover(10).png', studentName: 'Katie Brown', studentId: 'STU011', pin: '293847', createdAt: isoDate(-7), expiresAt: isoDate(-6), status: 'redeemed' },
  { id: 'p12', bookTitle: 'Cybernetic Frontiers', bookISBN: '978-4-16-148410-5', bookCover: '/BookCover(11).png', studentName: 'Leo Martinez', studentId: 'STU012', pin: '657483', createdAt: isoDate(0), expiresAt: isoDate(3), status: 'pending' },
  { id: 'p13', bookTitle: 'Architecture of Thought', bookISBN: '978-3-16-148410-0', bookCover: '/BookCover.png', studentName: 'Mia Anderson', studentId: 'STU013', pin: '182736', createdAt: isoDate(-3), expiresAt: isoDate(-1.5), status: 'expired' },
  { id: 'p14', bookTitle: 'The Silent Algorithm', bookISBN: '978-0-13-468599-1', bookCover: '/BookCover(4).png', studentName: 'Noah Patel', studentId: 'STU014', pin: '473829', createdAt: isoDate(-1), expiresAt: isoDate(1.5), status: 'pending' },
  { id: 'p15', bookTitle: 'Urban Ecosystems', bookISBN: '978-3-540-49605-2', bookCover: '/BookCover(3).png', studentName: 'Olivia Scott', studentId: 'STU015', pin: '918264', createdAt: isoDate(-2), expiresAt: isoDate(-0.2), status: 'urgent' },
  { id: 'p16', bookTitle: 'Renaissance Revisited', bookISBN: '978-1-108-45678-9', bookCover: '/BookCover(5).png', studentName: 'Peter Nguyen', studentId: 'STU016', pin: '736251', createdAt: isoDate(-8), expiresAt: isoDate(-7), status: 'redeemed' },
  { id: 'p17', bookTitle: 'Neural Landscapes', bookISBN: '978-0-262-04567-1', bookCover: '/BookCover(8).png', studentName: 'Quinn Davis', studentId: 'STU017', pin: '384756', createdAt: isoDate(-1), expiresAt: isoDate(0.3), status: 'urgent' },
  { id: 'p18', bookTitle: 'Echoes of Empire', bookISBN: '978-1-4088-4567-8', bookCover: '/BookCover(10).png', studentName: 'Rachel Lee', studentId: 'STU018', pin: '564738', createdAt: isoDate(-5), expiresAt: isoDate(-3), status: 'expired' },
  { id: 'p19', bookTitle: 'Bauhaus to Beyond', bookISBN: '978-3-7913-5678-9', bookCover: '/BookCover(9).png', studentName: 'Samir Joshi', studentId: 'STU019', pin: '293847', createdAt: isoDate(-3), expiresAt: isoDate(0), status: 'pending' },
  { id: 'p20', bookTitle: 'The Art of Diplomacy', bookISBN: '978-0-7432-7356-6', bookCover: '/BookCover(7).png', studentName: 'Tina Foster', studentId: 'STU020', pin: '172635', createdAt: isoDate(-4), expiresAt: isoDate(-2.5), status: 'expired' },
  { id: 'p21', bookTitle: 'Cybernetic Frontiers', bookISBN: '978-4-16-148410-5', bookCover: '/BookCover(11).png', studentName: 'Uma Singh', studentId: 'STU021', pin: '847362', createdAt: isoDate(-10), expiresAt: isoDate(-9), status: 'redeemed' },
  { id: 'p22', bookTitle: 'Statistical Paradoxes', bookISBN: '978-0-19-876543-2', bookCover: '/BookCover(6).png', studentName: 'Victor Tran', studentId: 'STU022', pin: '516273', createdAt: isoDate(0), expiresAt: isoDate(2.5), status: 'pending' },
  { id: 'p23', bookTitle: 'The Modern Grid', bookISBN: '978-0-262-51763-8', bookCover: '/BookCover(1).png', studentName: 'Wendy Chen', studentId: 'STU023', pin: '384756', createdAt: isoDate(-2), expiresAt: isoDate(-0.8), status: 'urgent' },
  { id: 'p24', bookTitle: 'Quantum Linguistics', bookISBN: '978-1-4028-9462-6', bookCover: '/BookCover(2).png', studentName: 'Xander Liu', studentId: 'STU024', pin: '627384', createdAt: isoDate(-6), expiresAt: isoDate(-5), status: 'redeemed' },
];

export const MOCK_BORROWS: BorrowEntry[] = [
  { id: 'r1', userName: 'Alice Nguyen', userId: 'STU001', bookTitle: 'Architecture of Thought', bookCallNo: 'PHI.001.234', borrowDate: isoDate(-14), dueDate: isoDate(0), status: 'active', fees: 0 },
  { id: 'r2', userName: 'Ben Tran', userId: 'STU002', bookTitle: 'The Modern Grid', bookCallNo: 'DES.002.567', borrowDate: isoDate(-30), dueDate: isoDate(-2), status: 'overdue', fees: 4.50 },
  { id: 'r3', userName: 'Clara Lim', userId: 'STU003', bookTitle: 'Quantum Linguistics', bookCallNo: 'SCI.003.890', borrowDate: isoDate(-21), dueDate: isoDate(-7), status: 'overdue', fees: 10.50 },
  { id: 'r4', userName: 'David Park', userId: 'STU004', bookTitle: 'Urban Ecosystems', bookCallNo: 'ENV.004.123', borrowDate: isoDate(-7), dueDate: isoDate(7), status: 'active', fees: 0 },
  { id: 'r5', userName: 'Elena Voss', userId: 'STU005', bookTitle: 'The Silent Algorithm', bookCallNo: 'TEC.005.456', borrowDate: isoDate(-10), dueDate: isoDate(4), status: 'active', fees: 0 },
  { id: 'r6', userName: 'Felix Chen', userId: 'STU006', bookTitle: 'Renaissance Revisited', bookCallNo: 'ART.006.789', borrowDate: isoDate(-45), dueDate: isoDate(-17), status: 'overdue', fees: 25.50 },
  { id: 'r7', userName: 'Grace Kim', userId: 'STU007', bookTitle: 'Statistical Paradoxes', bookCallNo: 'MAT.007.012', borrowDate: isoDate(-5), dueDate: isoDate(9), status: 'active', fees: 0 },
  { id: 'r8', userName: 'Hank Miller', userId: 'STU008', bookTitle: 'The Art of Diplomacy', bookCallNo: 'POL.008.345', borrowDate: isoDate(-28), dueDate: isoDate(-14), status: 'overdue', fees: 21.00 },
  { id: 'r9', userName: 'Iris Zhao', userId: 'STU009', bookTitle: 'Neural Landscapes', bookCallNo: 'SCI.009.678', borrowDate: isoDate(-3), dueDate: isoDate(11), status: 'active', fees: 0 },
  { id: 'r10', userName: 'Jack Wilson', userId: 'STU010', bookTitle: 'Bauhaus to Beyond', bookCallNo: 'DES.010.901', borrowDate: isoDate(-60), dueDate: isoDate(-32), status: 'overdue', fees: 48.00 },
  { id: 'r11', userName: 'Katie Brown', userId: 'STU011', bookTitle: 'Echoes of Empire', bookCallNo: 'HIS.011.234', borrowDate: isoDate(-14), dueDate: isoDate(0), status: 'active', fees: 0 },
  { id: 'r12', userName: 'Leo Martinez', userId: 'STU012', bookTitle: 'Cybernetic Frontiers', bookCallNo: 'TEC.012.567', borrowDate: isoDate(-35), dueDate: isoDate(-21), status: 'overdue', fees: 31.50 },
];

export const DEFAULT_CONDITIONS: ConditionSelection[] = [
  { id: 'perfect', name: 'Perfect Condition', fee: 0, selected: false },
  { id: 'cover_scratches', name: 'Slight Cover Scratches', fee: 2.00, selected: false },
  { id: 'folded_pages', name: 'Folded Pages', fee: 3.00, selected: false },
  { id: 'pencil_marks', name: 'Pencil Marks', fee: 5.00, selected: false },
  { id: 'torn_pages', name: 'Torn Pages', fee: 15.00, selected: false },
  { id: 'water_damage', name: 'Water Damage', fee: 20.00, selected: false },
];

export const MOCK_INSPECTION: InspectionEntry = {
  borrowId: 'r3',
  borrowerName: 'Clara Lim',
  borrowerAvatar: '',
  bookTitle: 'Quantum Linguistics',
  bookCover: '/BookCover(2).png',
  isbn: '978-1-4028-9462-6',
  borrowDate: isoDate(-21),
  dueDate: isoDate(-7),
  returnDate: isoDate(-1),
  loanDuration: 20,
  conditions: DEFAULT_CONDITIONS.map(c => ({ ...c })),
  notes: '',
  latePenalty: 10.50,
  totalRepairFee: 0,
  finalRefund: 39.50,
};

export const PICKUP_KPI_METRICS: KPIMetric[] = [
  {
    id: 'kpi_pending',
    label: 'Pending Pickups',
    value: 12,
    trend: '+8% vs last week',
    trendVariant: 'positive',
    progress: 60,
    progressColor: 'bg-amber-400',
    variant: 'default',
  },
  {
    id: 'kpi_expired',
    label: 'Expired Today',
    value: 3,
    trend: '+2 vs yesterday',
    trendVariant: 'negative',
    progress: 30,
    progressColor: 'bg-red-500',
    variant: 'critical',
  },
  {
    id: 'kpi_redeemed',
    label: 'Redeemed Today',
    value: 5,
    trend: '+15% vs last week',
    trendVariant: 'positive',
    progress: 75,
    progressColor: 'bg-emerald-500',
    variant: 'success',
  },
];

export const RETURN_KPI_METRICS: KPIMetric[] = [
  {
    id: 'kpi_active',
    label: 'Active Borrows',
    value: 48,
    trend: '+5% vs last month',
    trendVariant: 'positive',
    progress: 65,
    progressColor: 'bg-blue-500',
    variant: 'default',
  },
  {
    id: 'kpi_overdue',
    label: 'Overdue Items',
    value: 7,
    trend: '-3% vs last week',
    trendVariant: 'positive',
    progress: 15,
    progressColor: 'bg-red-500',
    variant: 'critical',
  },
  {
    id: 'kpi_returns',
    label: 'Returns Today',
    value: 4,
    trend: '+2 vs yesterday',
    trendVariant: 'positive',
    progress: 40,
    progressColor: 'bg-emerald-500',
    variant: 'success',
  },
];
