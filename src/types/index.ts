export type Role = 'recruiter' | 'candidate';

export type AssessmentKind = 'quiz' | 'typing' | 'excel';

export interface Question {
  id: string;
  text: string;
  options: {
    id: string;
    text: string;
  }[];
  correctOptionIds: string[]; // Supports single or multiple correct answers
  explanation?: string;
  categoryTag?: string;
  imageUrl?: string;
}

export interface QuizArea {
  id: string;
  name: string;
  description?: string;
  classifications?: string[];
  icon?: string;
  createdAt?: string;
}

export interface Quiz {
  id: string;
  title: string;
  category: string;
  description: string;
  supportedClassifications?: string[];
  difficulty?: 1 | 2 | 3; // 1 = Fundamental/Entry, 2 = Intermediate/Mid-Level, 3 = Advanced/Senior
  timeLimitMinutes?: number;
  questions: Question[];
  createdAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  roleApplied: string;
  area?: string; // Primary department / area
  secondaryAreas?: string[]; // Additional departments / secondary areas
  avatar: string;
  gender?: 'male' | 'female';
  typingEnabled?: boolean;
  typingTemplateId?: string;
  excelEnabled?: boolean;
  excelAssessmentIds?: string[];
  registeredAt: string;
  temporaryPassword?: string;
  customPassword?: string;
  isPasswordChanged?: boolean;
}

export type AssessmentStatus = 'pending' | 'in_progress' | 'completed';
export type RecruiterReviewStatus = 'stand_by' | 'approved' | 'rejected';

export interface AssessmentAssignment {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  roleApplied: string;
  quizId: string;
  quizTitle: string;
  assessmentKind?: AssessmentKind; // 'quiz' (default) | 'typing' | 'excel'
  difficulty?: 1 | 2 | 3;
  durationMinutes?: number;
  selectedQuestionIds?: string[]; // IDs of questions manually picked by recruiter
  status: AssessmentStatus;
  reviewStatus?: RecruiterReviewStatus;
  score?: number; // 0 to 100
  totalQuestions: number;
  correctAnswersCount?: number;
  answers?: Record<string, any>; // questionId -> selectedOptionIds, plus _review_status
  assignedAt: string;
  completedAt?: string;
  passedThreshold?: boolean; // e.g. score >= 75
}

// Typing Assessment Module Types
export type TypingLevel = 'basic' | 'intermediate' | 'advanced';

export interface TypingTemplate {
  id: string;
  title: string;
  language: 'en' | 'es';
  text: string;
  targetDurationSeconds: number; // default: 60
  difficulty: 1 | 2 | 3;
  createdAt: string;
}

export interface TypingAssignment {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  templateId: string;
  templateTitle: string;
  status: 'pending' | 'completed';
  netWpm?: number;
  grossWpm?: number;
  accuracy?: number; // 0 - 100
  errorsCount?: number;
  level?: TypingLevel;
  completedAt?: string;
  assignedAt: string;
}

// Excel Practical Assessment Module Types
export interface ExcelAssessment {
  id: string;
  title: string;
  description: string;
  instructions: string;
  templateFileName: string;
  templateFileData?: string; // CSV/XLSX text or Base64 data for download
  departmentArea: string;
  timeLimitMinutes: number;
  createdAt: string;
}

export interface ExcelSubmission {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  submittedFileName: string;
  submittedFileData?: string;
  submittedAt: string;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  score?: number; // 0 - 100
  feedback?: string;
}
