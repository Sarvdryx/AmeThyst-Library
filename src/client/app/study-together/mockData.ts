export interface StudyGroupLeader {
  name: string;
  initials: string;
  avatar?: string | null;
  role?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  occupation?: string | null;
  hometown?: string | null;
  description?: string | null;
}

export interface StudyGroup {
  id: string;
  subject: string;
  title: string;
  description: string;
  leader: StudyGroupLeader;
  time: string;
  address: string;
  room: string;
  currentMembers: number;
  maxMembers: number;
  status: 'Available' | 'Full';
  requirements: string[];
  userStatus?: 'upcoming' | 'full' | 'cancelled' | 'inprogress' | 'completed' | 'expired';
  userApplicantStatus?: 'pending' | 'approved' | 'denied' | 'expired';
  participationType?: 'request' | 'invite';
  participationRequestId?: string;
  pendingApplicants?: number;
  canJoin?: boolean;
  retryAt?: string | null;
  isCreator?: boolean;
}

export const mockStudyGroups: StudyGroup[] = [
  {
    id: '1',
    subject: 'Computer Science',
    title: 'Algorithms & Logic',
    description: 'Preparing for technical interviews through rigorous problem solving and leetcode practice.',
    leader: { name: 'Julian Drake', initials: 'JD' },
    time: '5:00 PM - 9:00 PM',
    address: 'Library Main Building',
    room: 'Room 304',
    currentMembers: 1,
    maxMembers: 6,
    status: 'Available',
    requirements: ['Bring your laptop', 'Completed Data Structures', 'Leetcode account required']
  },
  {
    id: '2',
    subject: 'Physics',
    title: 'Quantum Physics',
    description: 'Deep dive into wave-particle duality and Schrödinger equations. Preparation for midterms.',
    leader: { name: 'Sarah Lin', initials: 'SL' },
    time: '2:00 PM - 4:00 PM',
    address: 'Science Annex',
    room: 'Room 102',
    currentMembers: 5,
    maxMembers: 5,
    status: 'Full',
    requirements: ['Read chapter 4 and 5', 'Bring scientific calculator']
  },
  {
    id: '3',
    subject: 'Architecture',
    title: 'Architecture 101: Vernacular Structures',
    description: 'Weekly review sessions focused on global vernacular architectural forms',
    leader: { name: 'Elena Langford', initials: 'EL' },
    time: '10:00 AM - 12:00 PM',
    address: 'Design Studio',
    room: 'Room 205',
    currentMembers: 3,
    maxMembers: 5,
    status: 'Available',
    requirements: ['Bring sketching materials', 'Review weekly case studies']
  },
  {
    id: '4',
    subject: 'Economics',
    title: 'Global Trade Patterns',
    description: 'Analyzing global trade patterns and fiscal policy impacts. Collaborative case study review.',
    leader: { name: 'Mark Chen', initials: 'MC' },
    time: '3:00 PM - 5:00 PM',
    address: 'Business Wing',
    room: 'Room 401',
    currentMembers: 2,
    maxMembers: 4,
    status: 'Available',
    requirements: ['Read The Wealth of Nations excerpts', 'Basic understanding of macroeconomics']
  },
  {
    id: '5',
    subject: 'Mathematics',
    title: 'Calculus III Study Group',
    description: 'Multivariable calculus problem solving. We meet every week to do practice exams.',
    leader: { name: 'Alice Wong', initials: 'AW' },
    time: '6:00 PM - 8:00 PM',
    address: 'Library Main Building',
    room: 'Room 305',
    currentMembers: 4,
    maxMembers: 4,
    status: 'Full',
    requirements: ['Bring practice exam printouts', 'Graphing calculator recommended']
  },
  {
    id: '6',
    subject: 'Biology',
    title: 'Genetics Review',
    description: 'Discussing Mendelian genetics, DNA replication, and upcoming lab reports.',
    leader: { name: 'Robert Smith', initials: 'RS' },
    time: '1:00 PM - 3:00 PM',
    address: 'Science Annex',
    room: 'Lab 2A',
    currentMembers: 2,
    maxMembers: 6,
    status: 'Available',
    requirements: ['Completed Biology 101', 'Bring lab coat if staying for practicals']
  },
  {
    id: '7',
    subject: 'Literature',
    title: 'Modernist Poetry',
    description: 'Reading and dissecting works of T.S. Eliot, Ezra Pound, and other modernists.',
    leader: { name: 'Emily Davis', initials: 'ED' },
    time: '4:00 PM - 6:00 PM',
    address: 'Humanities Hall',
    room: 'Room 112',
    currentMembers: 3,
    maxMembers: 8,
    status: 'Available',
    requirements: ['Read The Waste Land', 'Open mind for discussion']
  },
  {
    id: '8',
    subject: 'Computer Science',
    title: 'Machine Learning Basics',
    description: 'A beginner friendly group focusing on regression, classification, and neural networks.',
    leader: { name: 'Kevin Zhang', initials: 'KZ' },
    time: '7:00 PM - 9:00 PM',
    address: 'Tech Hub',
    room: 'Room 410',
    currentMembers: 5,
    maxMembers: 10,
    status: 'Available',
    requirements: ['Basic Python programming', 'Bring your own laptop']
  },
  {
    id: '9',
    subject: 'History',
    title: 'World War II Era',
    description: 'In-depth discussion on the socio-political causes and effects of WWII.',
    leader: { name: 'Laura Martinez', initials: 'LM' },
    time: '11:00 AM - 1:00 PM',
    address: 'Library Main Building',
    room: 'Room 210',
    currentMembers: 4,
    maxMembers: 5,
    status: 'Available',
    requirements: ['Read assigned textbook chapters', 'Prepare 2 discussion questions']
  },
  {
    id: '10',
    subject: 'Chemistry',
    title: 'Organic Chemistry Help',
    description: 'Struggling with Orgo? Join us to review reaction mechanisms and stereochemistry.',
    leader: { name: 'Daniel Lee', initials: 'DL' },
    time: '5:00 PM - 7:30 PM',
    address: 'Science Annex',
    room: 'Room 105',
    currentMembers: 6,
    maxMembers: 6,
    status: 'Full',
    requirements: ['Bring molecular model kit', 'Review SN1/SN2 reactions']
  }
];

export const mockJoinedGroups: StudyGroup[] = Array.from({ length: 16 }).map((_, i) => ({
  ...mockStudyGroups[i % mockStudyGroups.length],
  id: `j${i + 1}`,
  userApplicantStatus: i % 4 === 0 ? 'approved' : i % 4 === 1 ? 'pending' : i % 4 === 2 ? 'denied' : 'expired'
}));

export const mockCreatedGroups: StudyGroup[] = Array.from({ length: 16 }).map((_, i) => ({
  ...mockStudyGroups[i % mockStudyGroups.length],
  id: `c${i + 1}`,
  userStatus: i % 5 === 0 ? 'upcoming' : i % 5 === 1 ? 'inprogress' : i % 5 === 2 ? 'completed' : i % 5 === 3 ? 'cancelled' : 'expired',
  pendingApplicants: [0, 2, 4, 0, 1, 3, 0, 2][i % 8],
  leader: { name: 'You', initials: 'ME' }
}));
