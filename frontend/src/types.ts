export type UserRole = 'Admin' | 'Employee';

export interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar: string;
  registrationDate?: string;
  verificationStatus?: 'Verified' | 'Pending';
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  department: string;
  modules: number;
  status: 'Published' | 'Draft' | 'Archived';
  lastModified: string;
  icon: string;
}

export interface Mentee {
  id: string;
  name: string;
  role: string;
  avatar: string;
  progress: number;
  lastActive: string;
  status: 'On Track' | 'Needs Attention' | 'Blocked';
  blockedReason?: string;
}

export interface Buddy {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  activeMentees: number;
  maxMentees: number;
  isOnline: boolean;
  tags: string[];
}
