import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  Role,
  Quiz,
  Candidate,
  AssessmentAssignment,
  QuizArea,
  TypingTemplate,
  TypingAssignment,
  ExcelAssessment,
  ExcelSubmission,
  TypingLevel,
} from '../types';
import {
  initialQuizzes,
  initialCandidates,
  initialAssignments,
  initialTypingTemplates,
  initialTypingAssignments,
  initialExcelAssessments,
  initialExcelSubmissions,
} from '../data/mockData';
import { translations } from '../i18n/translations';
import type { Language } from '../i18n/translations';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { quizService } from '../services/quizService';
import { candidateService } from '../services/candidateService';
import { assignmentService } from '../services/assignmentService';
import { seedService } from '../services/seedService';
import { areaService, initialDefaultAreas } from '../services/areaService';

interface SubmitResult {
  score: number;
  correctCount: number;
  totalQuestions: number;
  passed: boolean;
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['en'];
  activeRole: Role;
  setActiveRole: (role: Role) => void;
  activeCandidateId: string;
  setActiveCandidateId: (id: string) => void;
  quizzes: Quiz[];
  candidates: Candidate[];
  assignments: AssessmentAssignment[];
  areas: QuizArea[];
  typingTemplates: TypingTemplate[];
  typingAssignments: TypingAssignment[];
  excelAssessments: ExcelAssessment[];
  excelSubmissions: ExcelSubmission[];
  isLiveDatabase: boolean;
  loading: boolean;
  createArea: (name: string, description?: string) => Promise<QuizArea>;
  createQuiz: (quiz: Omit<Quiz, 'id' | 'createdAt'>) => Promise<void>;
  updateQuiz: (quizId: string, updatedData: Partial<Quiz>) => Promise<void>;
  createCandidate: (candidate: Omit<Candidate, 'id' | 'registeredAt' | 'avatar'> & { gender?: 'male' | 'female'; area?: string; secondaryAreas?: string[]; typingEnabled?: boolean; typingTemplateId?: string; excelEnabled?: boolean; excelAssessmentIds?: string[] }) => Promise<void>;
  updateCandidate: (candidateId: string, updatedData: { name: string; email: string; roleApplied: string; gender: 'male' | 'female'; area?: string; secondaryAreas?: string[]; typingEnabled?: boolean; typingTemplateId?: string; excelEnabled?: boolean; excelAssessmentIds?: string[] }) => Promise<void>;
  assignQuiz: (candidateId: string, quizId: string, selectedQuestionIds?: string[]) => void;
  assignCustomQuiz: (candidateIds: string[], quizId: string, selectedQuestionIds: string[], durationMinutes?: number) => Promise<void>;
  assignCustomSuite: (candidateIds: string[], suite: { quizId: string; selectedQuestionIds: string[]; durationMinutes?: number }[]) => Promise<void>;
  submitAssessment: (assignmentId: string, userAnswers: Record<string, string[]>) => SubmitResult;
  updateAssignmentReviewStatus: (assignmentId: string, reviewStatus: 'stand_by' | 'approved' | 'rejected') => Promise<void>;
  deleteQuiz: (quizId: string) => Promise<void>;
  deleteCandidate: (candidateId: string) => Promise<void>;
  createTypingTemplate: (template: Omit<TypingTemplate, 'id' | 'createdAt'>) => Promise<void>;
  assignTypingTest: (candidateIds: string[], templateId: string) => Promise<void>;
  submitTypingTest: (assignmentId: string, result: { netWpm: number; grossWpm: number; accuracy: number; errorsCount: number; level: TypingLevel }) => Promise<void>;
  createExcelAssessment: (assessment: Omit<ExcelAssessment, 'id' | 'createdAt'>) => Promise<void>;
  assignExcelAssessment: (candidateIds: string[], assessmentId: string) => Promise<void>;
  submitExcelAssessment: (submission: Omit<ExcelSubmission, 'id' | 'submittedAt' | 'reviewStatus'>) => Promise<void>;
  updateExcelReviewStatus: (submissionId: string, reviewStatus: 'pending' | 'approved' | 'rejected', score?: number, feedback?: string) => Promise<void>;
  updateCandidatePassword: (email: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  resetCandidatePassword: (candidateId: string) => Promise<string>;
  verifyCandidateAuth: (email: string, password: string) => { success: boolean; candidate?: Candidate; isTemporary?: boolean; error?: string };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('skillproof_lang') as Language;
    return saved === 'es' || saved === 'en' ? saved : 'en'; // English is default
  });

  const [activeRole, setActiveRole] = useState<Role>('recruiter');
  const [activeCandidateId, setActiveCandidateId] = useState<string>('cand-4');
  const [loading, setLoading] = useState<boolean>(isSupabaseConfigured);
  const isLiveDatabase = isSupabaseConfigured;

  const [quizzes, setQuizzes] = useState<Quiz[]>(() => {
    const saved = localStorage.getItem('skillproof_quizzes');
    return saved ? JSON.parse(saved) : initialQuizzes;
  });

  const [candidates, setCandidates] = useState<Candidate[]>(() => {
    const saved = localStorage.getItem('skillproof_candidates');
    if (!saved) return initialCandidates;
    try {
      const parsed: Candidate[] = JSON.parse(saved);
      return parsed.map((c, idx) => ({
        ...c,
        temporaryPassword: c.temporaryPassword || `SEU-temp-${(idx + 1) * 101}`,
        isPasswordChanged: Boolean(c.isPasswordChanged),
      }));
    } catch {
      return initialCandidates;
    }
  });

  const [assignments, setAssignments] = useState<AssessmentAssignment[]>(() => {
    const saved = localStorage.getItem('skillproof_assignments');
    return saved ? JSON.parse(saved) : initialAssignments;
  });

  const [areas, setAreas] = useState<QuizArea[]>(initialDefaultAreas);

  const [typingTemplates, setTypingTemplates] = useState<TypingTemplate[]>(() => {
    const saved = localStorage.getItem('skillproof_typing_templates');
    return saved ? JSON.parse(saved) : initialTypingTemplates;
  });

  const [typingAssignments, setTypingAssignments] = useState<TypingAssignment[]>(() => {
    const saved = localStorage.getItem('skillproof_typing_assignments');
    return saved ? JSON.parse(saved) : initialTypingAssignments;
  });

  const [excelAssessments, setExcelAssessments] = useState<ExcelAssessment[]>(() => {
    const saved = localStorage.getItem('skillproof_excel_assessments');
    return saved ? JSON.parse(saved) : initialExcelAssessments;
  });

  const [excelSubmissions, setExcelSubmissions] = useState<ExcelSubmission[]>(() => {
    const saved = localStorage.getItem('skillproof_excel_submissions');
    return saved ? JSON.parse(saved) : initialExcelSubmissions;
  });

  // Sync typing and excel states to localStorage
  useEffect(() => {
    localStorage.setItem('skillproof_typing_templates', JSON.stringify(typingTemplates));
  }, [typingTemplates]);

  useEffect(() => {
    localStorage.setItem('skillproof_typing_assignments', JSON.stringify(typingAssignments));
  }, [typingAssignments]);

  useEffect(() => {
    localStorage.setItem('skillproof_excel_assessments', JSON.stringify(excelAssessments));
  }, [excelAssessments]);

  useEffect(() => {
    localStorage.setItem('skillproof_excel_submissions', JSON.stringify(excelSubmissions));
  }, [excelSubmissions]);

  const t = translations[language];

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('skillproof_lang', lang);
  };

  // Sync state with Supabase cloud on mount
  useEffect(() => {
    async function initData() {
      if (!isSupabaseConfigured) return;

      try {
        setLoading(true);
        // Auto-seed if database tables are currently empty
        await seedService.seedIfEmpty();
        // Sync County of Orange standardized banks if missing
        await seedService.syncOrangeCountyBanks();

        const [remoteQuizzes, remoteCandidates, remoteAssignments, remoteAreas] = await Promise.all([
          quizService.getAll(),
          candidateService.getAll(),
          assignmentService.getAll(),
          areaService.getAll(),
        ]);

        if (remoteQuizzes && remoteQuizzes.length > 0) {
          setQuizzes(remoteQuizzes);
        }
        if (remoteCandidates && remoteCandidates.length > 0) {
          setCandidates(remoteCandidates);
          setActiveCandidateId(prev =>
            remoteCandidates.some(c => c.id === prev) ? prev : remoteCandidates[0].id
          );
        }
        if (remoteAreas && remoteAreas.length > 0) {
          setAreas(remoteAreas);
        }
        setAssignments(remoteAssignments || []);
      } catch (err) {
        console.error('Failed to sync data with Supabase:', err);
      } finally {
        setLoading(false);
      }
    }

    initData();
  }, []);

  // Supabase Realtime: Sincronización en vivo sin recargar pantalla
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('skillproof-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assessment_assignments' },
        async (payload) => {
          console.log('[Realtime] Assessment change detected:', payload.eventType);
          try {
            const refreshed = await assignmentService.getAll();
            setAssignments(refreshed);
          } catch (err) {
            console.error('Error refreshing assignments via Realtime:', err);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'candidates' },
        async () => {
          try {
            const refreshed = await candidateService.getAll();
            setCandidates(refreshed);
          } catch (err) {
            console.error('Error refreshing candidates via Realtime:', err);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quizzes' },
        async () => {
          try {
            const refreshed = await quizService.getAll();
            setQuizzes(refreshed);
          } catch (err) {
            console.error('Error refreshing quizzes via Realtime:', err);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Realtime] Live channel connected to Supabase');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('skillproof_quizzes', JSON.stringify(quizzes));
  }, [quizzes]);

  useEffect(() => {
    localStorage.setItem('skillproof_candidates', JSON.stringify(candidates));
  }, [candidates]);

  useEffect(() => {
    localStorage.setItem('skillproof_assignments', JSON.stringify(assignments));
  }, [assignments]);

  const createQuiz = async (newQuizData: Omit<Quiz, 'id' | 'createdAt'>) => {
    if (isSupabaseConfigured) {
      try {
        const created = await quizService.create(newQuizData);
        setQuizzes(prev => [created, ...prev]);
        return;
      } catch (err) {
        console.error('Error creating quiz on Supabase:', err);
      }
    }
    const created: Quiz = {
      ...newQuizData,
      id: `quiz-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setQuizzes(prev => [created, ...prev]);
  };

  const updateQuiz = async (quizId: string, updatedData: Partial<Quiz>) => {
    if (isSupabaseConfigured) {
      try {
        await quizService.update(quizId, updatedData);
        const refreshed = await quizService.getAll();
        setQuizzes(refreshed);
        return;
      } catch (err) {
        console.error('Error updating quiz on Supabase:', err);
      }
    }
    setQuizzes(prev =>
      prev.map(q => (q.id === quizId ? { ...q, ...updatedData } : q))
    );
    if (updatedData.title) {
      setAssignments(prev =>
        prev.map(a => (a.quizId === quizId ? { ...a, quizTitle: updatedData.title! } : a))
      );
    }
  };

  const deleteQuiz = async (quizId: string) => {
    if (isSupabaseConfigured) {
      try {
        await quizService.delete(quizId);
      } catch (err) {
        console.error('Error deleting quiz on Supabase:', err);
      }
    }
    setQuizzes(prev => prev.filter(q => q.id !== quizId));
    setAssignments(prev => prev.filter(a => a.quizId !== quizId));
  };

  const createCandidate = async (
    newCandData: Omit<Candidate, 'id' | 'registeredAt' | 'avatar'> & {
      gender?: 'male' | 'female';
      area?: string;
      secondaryAreas?: string[];
      typingEnabled?: boolean;
      typingTemplateId?: string;
      excelEnabled?: boolean;
      excelAssessmentIds?: string[];
      temporaryPassword?: string;
    }
  ) => {
    const secPart = newCandData.secondaryAreas && newCandData.secondaryAreas.length > 0 ? `|sec:${newCandData.secondaryAreas.join(';')}` : '';
    const newId = `cand-${Date.now()}`;
    const tempPass = newCandData.temporaryPassword || `SEU-temp-${Math.floor(1000 + Math.random() * 9000)}`;
    const created: Candidate = {
      ...newCandData,
      id: newId,
      avatar: `gender:${newCandData.gender || 'male'}${newCandData.area ? `|area:${newCandData.area}` : ''}${secPart}`,
      gender: newCandData.gender || 'male',
      area: newCandData.area,
      secondaryAreas: newCandData.secondaryAreas || [],
      typingEnabled: newCandData.typingEnabled,
      typingTemplateId: newCandData.typingTemplateId,
      excelEnabled: newCandData.excelEnabled,
      excelAssessmentIds: newCandData.excelAssessmentIds,
      registeredAt: new Date().toISOString().split('T')[0],
      temporaryPassword: tempPass,
      isPasswordChanged: false,
    };

    if (isSupabaseConfigured) {
      try {
        const remoteCreated = await candidateService.create(newCandData);
        setCandidates(prev => [remoteCreated, ...prev]);
      } catch (err) {
        console.error('Error creating candidate on Supabase:', err);
        setCandidates(prev => [created, ...prev]);
      }
    } else {
      setCandidates(prev => [created, ...prev]);
    }

    // Auto-assign typing test if enabled
    if (newCandData.typingEnabled) {
      const template = typingTemplates.find(t => t.id === newCandData.typingTemplateId) || typingTemplates[0];
      if (template) {
        const typingAssign: TypingAssignment = {
          id: `type-assign-${Date.now()}`,
          candidateId: newId,
          candidateName: newCandData.name,
          candidateEmail: newCandData.email,
          templateId: template.id,
          templateTitle: template.title,
          status: 'pending',
          assignedAt: new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
        };
        setTypingAssignments(prev => [typingAssign, ...prev]);
      }
    }

    // Auto-assign excel tasks if enabled
    if (newCandData.excelEnabled && newCandData.excelAssessmentIds && newCandData.excelAssessmentIds.length > 0) {
      const newSubs: ExcelSubmission[] = newCandData.excelAssessmentIds.map(aId => {
        const assess = excelAssessments.find(a => a.id === aId);
        return {
          id: `excel-sub-${Date.now()}-${aId}`,
          assessmentId: aId,
          assessmentTitle: assess?.title || 'Practical Excel Assessment',
          candidateId: newId,
          candidateName: newCandData.name,
          candidateEmail: newCandData.email,
          submittedFileName: '',
          submittedFileData: '',
          submittedAt: new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
          reviewStatus: 'pending',
        };
      });
      setExcelSubmissions(prev => [...newSubs, ...prev]);
    }
  };

  const updateCandidate = async (
    candidateId: string,
    updatedData: {
      name: string;
      email: string;
      roleApplied: string;
      gender: 'male' | 'female';
      area?: string;
      secondaryAreas?: string[];
      typingEnabled?: boolean;
      typingTemplateId?: string;
      excelEnabled?: boolean;
      excelAssessmentIds?: string[];
    }
  ) => {
    if (isSupabaseConfigured) {
      try {
        const updated = await candidateService.update(candidateId, updatedData);
        setCandidates(prev => prev.map(c => (c.id === candidateId ? updated : c)));
      } catch (err) {
        console.error('Error updating candidate on Supabase:', err);
      }
    }

    const secPart = updatedData.secondaryAreas && updatedData.secondaryAreas.length > 0 ? `|sec:${updatedData.secondaryAreas.join(';')}` : '';
    setCandidates(prev =>
      prev.map(c => {
        if (c.id !== candidateId) return c;
        return {
          ...c,
          name: updatedData.name,
          email: updatedData.email,
          roleApplied: updatedData.roleApplied,
          area: updatedData.area,
          secondaryAreas: updatedData.secondaryAreas || [],
          gender: updatedData.gender,
          typingEnabled: updatedData.typingEnabled,
          typingTemplateId: updatedData.typingTemplateId,
          excelEnabled: updatedData.excelEnabled,
          excelAssessmentIds: updatedData.excelAssessmentIds,
          avatar: `gender:${updatedData.gender}${updatedData.area ? `|area:${updatedData.area}` : ''}${secPart}`,
        };
      })
    );

    // Auto-assign typing if newly enabled
    if (updatedData.typingEnabled) {
      const alreadyHasTyping = typingAssignments.some(t => t.candidateId === candidateId);
      if (!alreadyHasTyping) {
        const template = typingTemplates.find(t => t.id === updatedData.typingTemplateId) || typingTemplates[0];
        if (template) {
          const typingAssign: TypingAssignment = {
            id: `type-assign-${Date.now()}`,
            candidateId,
            candidateName: updatedData.name,
            candidateEmail: updatedData.email,
            templateId: template.id,
            templateTitle: template.title,
            status: 'pending',
            assignedAt: new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
          };
          setTypingAssignments(prev => [typingAssign, ...prev]);
        }
      }
    }

    // Auto-assign Excel tasks if enabled
    if (updatedData.excelEnabled && updatedData.excelAssessmentIds && updatedData.excelAssessmentIds.length > 0) {
      const tasksToAdd = updatedData.excelAssessmentIds.filter(
        aId => !excelSubmissions.some(s => s.candidateId === candidateId && s.assessmentId === aId)
      );
      if (tasksToAdd.length > 0) {
        const newSubs: ExcelSubmission[] = tasksToAdd.map(aId => {
          const assess = excelAssessments.find(a => a.id === aId);
          return {
            id: `excel-sub-${Date.now()}-${aId}`,
            assessmentId: aId,
            assessmentTitle: assess?.title || 'Practical Excel Assessment',
            candidateId,
            candidateName: updatedData.name,
            candidateEmail: updatedData.email,
            submittedFileName: '',
            submittedFileData: '',
            submittedAt: new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
            reviewStatus: 'pending',
          };
        });
        setExcelSubmissions(prev => [...newSubs, ...prev]);
      }
    }

    setAssignments(prev =>
      prev.map(a =>
        a.candidateId === candidateId
          ? {
              ...a,
              candidateName: updatedData.name,
              candidateEmail: updatedData.email,
              roleApplied: updatedData.roleApplied,
            }
          : a
      )
    );
  };

  const deleteCandidate = async (candidateId: string) => {
    if (isSupabaseConfigured) {
      try {
        await candidateService.delete(candidateId);
      } catch (err) {
        console.error('Error deleting candidate on Supabase:', err);
      }
    }
    setCandidates(prev => prev.filter(c => c.id !== candidateId));
    setAssignments(prev => prev.filter(a => a.candidateId !== candidateId));
  };

  const updateCandidatePassword = async (email: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    const norm = email.trim().toLowerCase();
    const cand = candidates.find(c => c.email.toLowerCase() === norm);
    if (!cand) {
      return { success: false, error: 'Candidate not found' };
    }
    setCandidates(prev =>
      prev.map(c =>
        c.id === cand.id
          ? {
              ...c,
              customPassword: newPassword,
              isPasswordChanged: true,
            }
          : c
      )
    );
    return { success: true };
  };

  const resetCandidatePassword = async (candidateId: string): Promise<string> => {
    const newTemp = `SEU-temp-${Math.floor(1000 + Math.random() * 9000)}`;
    setCandidates(prev =>
      prev.map(c =>
        c.id === candidateId
          ? {
              ...c,
              temporaryPassword: newTemp,
              customPassword: undefined,
              isPasswordChanged: false,
            }
          : c
      )
    );
    return newTemp;
  };

  const verifyCandidateAuth = (email: string, password: string): { success: boolean; candidate?: Candidate; isTemporary?: boolean; error?: string } => {
    const norm = email.trim().toLowerCase();
    const cand = candidates.find(c => c.email.toLowerCase() === norm);
    if (!cand) {
      return {
        success: false,
        error: language === 'es' ? 'No se encontró ningún candidato registrado con este correo.' : 'No registered candidate found with this email.',
      };
    }

    const trimmedPass = password.trim();
    // 1. Check custom password if set
    if (cand.isPasswordChanged && cand.customPassword) {
      if (cand.customPassword === trimmedPass) {
        return { success: true, candidate: cand, isTemporary: false };
      }
    }

    // 2. Check temporary password
    const expectedTemp = cand.temporaryPassword || 'SEU-temp-101';
    if (trimmedPass === expectedTemp) {
      return { success: true, candidate: cand, isTemporary: true };
    }

    // 3. Fallback master temp password for initial testing
    if (trimmedPass === 'SkillProof2026!' || trimmedPass === 'SeuCandidate2026!') {
      return { success: true, candidate: cand, isTemporary: true };
    }

    return {
      success: false,
      error: language === 'es' ? 'Contraseña incorrecta. Ingrese la contraseña temporal recibida por correo o su nueva contraseña.' : 'Incorrect password. Enter the temporary password received by email or your new custom password.',
    };
  };

  const assignQuiz = (candidateId: string, quizId: string, selectedQuestionIds?: string[]) => {
    const candidate = candidates.find(c => c.id === candidateId);
    const quiz = quizzes.find(q => q.id === quizId);
    if (!candidate || !quiz) return;

    const chosenIds = selectedQuestionIds && selectedQuestionIds.length > 0
      ? selectedQuestionIds
      : quiz.questions.map(q => q.id);

    const newAssignment: AssessmentAssignment = {
      id: `assign-${Date.now()}`,
      candidateId: candidate.id,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      roleApplied: candidate.roleApplied,
      quizId: quiz.id,
      quizTitle: quiz.title,
      difficulty: quiz.difficulty,
      durationMinutes: quiz.timeLimitMinutes,
      selectedQuestionIds: chosenIds,
      status: 'pending',
      totalQuestions: chosenIds.length,
      assignedAt: new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
    };

    setAssignments(prev => [newAssignment, ...prev]);
  };

  const assignCustomQuiz = async (candidateIds: string[], quizId: string, selectedQuestionIds: string[], durationMinutes?: number) => {
    if (isSupabaseConfigured) {
      try {
        await assignmentService.assignCustom(candidateIds, quizId, selectedQuestionIds, durationMinutes);
        const refreshed = await assignmentService.getAll();
        setAssignments(refreshed);
        return;
      } catch (err) {
        console.error('Error assigning custom quiz on Supabase:', err);
      }
    }

    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz || candidateIds.length === 0 || selectedQuestionIds.length === 0) return;

    const nowStr = new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

    const newAssignments: AssessmentAssignment[] = candidateIds.map((cId, idx) => {
      const candidate = candidates.find(c => c.id === cId);
      return {
        id: `assign-${Date.now()}-${idx}`,
        candidateId: cId,
        candidateName: candidate?.name || 'Candidate',
        candidateEmail: candidate?.email || 'email@candidate.com',
        roleApplied: candidate?.roleApplied || 'Applicant',
        quizId: quiz.id,
        quizTitle: quiz.title,
        difficulty: quiz.difficulty,
        durationMinutes: durationMinutes || quiz.timeLimitMinutes,
        selectedQuestionIds: selectedQuestionIds,
        status: 'pending',
        totalQuestions: selectedQuestionIds.length,
        assignedAt: nowStr,
      };
    });

    setAssignments(prev => [...newAssignments, ...prev]);
  };

  const assignCustomSuite = async (
    candidateIds: string[],
    suite: { quizId: string; selectedQuestionIds: string[]; durationMinutes?: number }[]
  ) => {
    if (candidateIds.length === 0 || suite.length === 0) return;

    if (isSupabaseConfigured) {
      try {
        await assignmentService.assignCustomSuite(candidateIds, suite);
        const refreshed = await assignmentService.getAll();
        setAssignments(refreshed);
        return;
      } catch (err) {
        console.error('Error assigning custom suite on Supabase:', err);
      }
    }

    const nowStr = new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    const newAssignments: AssessmentAssignment[] = [];

    suite.forEach((item, itemIdx) => {
      const quiz = quizzes.find(q => q.id === item.quizId);
      if (!quiz) return;
      candidateIds.forEach((cId, candIdx) => {
        const candidate = candidates.find(c => c.id === cId);
        newAssignments.push({
          id: `assign-${Date.now()}-${itemIdx}-${candIdx}-${Math.random().toString(36).substring(2, 7)}`,
          candidateId: cId,
          candidateName: candidate?.name || 'Candidate',
          candidateEmail: candidate?.email || 'email@candidate.com',
          roleApplied: candidate?.roleApplied || 'Applicant',
          quizId: quiz.id,
          quizTitle: quiz.title,
          difficulty: quiz.difficulty,
          durationMinutes: item.durationMinutes || quiz.timeLimitMinutes,
          selectedQuestionIds: item.selectedQuestionIds,
          status: 'pending',
          totalQuestions: item.selectedQuestionIds.length,
          assignedAt: nowStr,
        });
      });
    });

    setAssignments(prev => [...newAssignments, ...prev]);
  };

  const submitAssessment = (assignmentId: string, userAnswers: Record<string, string[]>): SubmitResult => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (!assignment) {
      return { score: 0, correctCount: 0, totalQuestions: 0, passed: false };
    }

    const quiz = quizzes.find(q => q.id === assignment.quizId);
    if (!quiz) {
      return { score: 0, correctCount: 0, totalQuestions: 0, passed: false };
    }

    const questionsToGrade = assignment.selectedQuestionIds && assignment.selectedQuestionIds.length > 0
      ? quiz.questions.filter(q => assignment.selectedQuestionIds!.includes(q.id))
      : quiz.questions;

    let correctCount = 0;

    questionsToGrade.forEach(q => {
      const selected = (userAnswers[q.id] || []).slice().sort();
      const expected = q.correctOptionIds.slice().sort();

      const isMatch =
        selected.length === expected.length &&
        selected.every((val, index) => val === expected[index]);

      if (isMatch) {
        correctCount += 1;
      }
    });

    const totalQuestions = questionsToGrade.length;
    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = score >= 75;

    const completedAt = new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

    if (isSupabaseConfigured) {
      assignmentService.submitAssessment(
        assignmentId,
        userAnswers,
        score,
        correctCount,
        totalQuestions,
        passed
      ).catch(err => console.error('Error submitting assessment to Supabase:', err));
    }

    const defaultReviewStatus = score >= 50 ? 'stand_by' : 'rejected';

    setAssignments(prev =>
      prev.map(a => {
        if (a.id === assignmentId) {
          return {
            ...a,
            status: 'completed',
            reviewStatus: defaultReviewStatus,
            score,
            totalQuestions,
            correctAnswersCount: correctCount,
            passedThreshold: passed,
            answers: { ...userAnswers, _review_status: defaultReviewStatus },
            completedAt,
          };
        }
        return a;
      })
    );

    return {
      score,
      correctCount,
      totalQuestions,
      passed,
    };
  };

  const updateAssignmentReviewStatus = async (
    assignmentId: string,
    reviewStatus: 'stand_by' | 'approved' | 'rejected'
  ) => {
    const target = assignments.find(a => a.id === assignmentId);
    if (isSupabaseConfigured) {
      try {
        await assignmentService.updateReviewStatus(assignmentId, reviewStatus, target?.answers || {});
      } catch (err) {
        console.error('Error updating review status on Supabase:', err);
      }
    }

    setAssignments(prev =>
      prev.map(a => {
        if (a.id === assignmentId) {
          return {
            ...a,
            reviewStatus,
            answers: { ...(a.answers || {}), _review_status: reviewStatus },
          };
        }
        return a;
      })
    );
  };

  const createArea = async (name: string, description: string = ''): Promise<QuizArea> => {
    if (isSupabaseConfigured) {
      try {
        const created = await areaService.create(name, description);
        setAreas(prev => [...prev.filter(a => a.id !== created.id), created]);
        return created;
      } catch (err) {
        console.error('Error creating area on Supabase:', err);
      }
    }
    const created: QuizArea = {
      id: `area-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
    };
    setAreas(prev => [...prev, created]);
    return created;
  };

  // Typing Assessment Module Methods
  const createTypingTemplate = async (template: Omit<TypingTemplate, 'id' | 'createdAt'>) => {
    const newTemplate: TypingTemplate = {
      ...template,
      id: `typing-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTypingTemplates(prev => [newTemplate, ...prev]);
  };

  const assignTypingTest = async (candidateIds: string[], templateId: string) => {
    const template = typingTemplates.find(t => t.id === templateId) || typingTemplates[0];
    const nowStr = new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

    const newAssignments: TypingAssignment[] = candidateIds.map((cId, idx) => {
      const candidate = candidates.find(c => c.id === cId);
      return {
        id: `type-assign-${Date.now()}-${idx}`,
        candidateId: cId,
        candidateName: candidate?.name || 'Candidate',
        candidateEmail: candidate?.email || 'email@candidate.com',
        templateId: template?.id || 'typing-default',
        templateTitle: template?.title || 'General Typing Test',
        status: 'pending',
        assignedAt: nowStr,
      };
    });

    setTypingAssignments(prev => [...newAssignments, ...prev]);
  };

  const submitTypingTest = async (
    assignmentId: string,
    result: { netWpm: number; grossWpm: number; accuracy: number; errorsCount: number; level: TypingLevel }
  ) => {
    const nowStr = new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    setTypingAssignments(prev =>
      prev.map(a =>
        a.id === assignmentId
          ? {
              ...a,
              status: 'completed',
              netWpm: result.netWpm,
              grossWpm: result.grossWpm,
              accuracy: result.accuracy,
              errorsCount: result.errorsCount,
              level: result.level,
              completedAt: nowStr,
            }
          : a
      )
    );
  };

  // Excel Practical Assessment Module Methods
  const createExcelAssessment = async (assessment: Omit<ExcelAssessment, 'id' | 'createdAt'>) => {
    const newAssessment: ExcelAssessment = {
      ...assessment,
      id: `excel-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setExcelAssessments(prev => [newAssessment, ...prev]);
  };

  const assignExcelAssessment = async (candidateIds: string[], assessmentId: string) => {
    const assessment = excelAssessments.find(a => a.id === assessmentId);
    if (!assessment) return;
    const nowStr = new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

    const newSubmissions: ExcelSubmission[] = candidateIds.map((cId, idx) => {
      const candidate = candidates.find(c => c.id === cId);
      return {
        id: `excel-sub-${Date.now()}-${idx}-${cId}`,
        assessmentId: assessment.id,
        assessmentTitle: assessment.title,
        candidateId: cId,
        candidateName: candidate?.name || 'Candidate',
        candidateEmail: candidate?.email || 'email@candidate.com',
        submittedFileName: '',
        submittedFileData: '',
        submittedAt: nowStr,
        reviewStatus: 'pending',
      };
    });

    setExcelSubmissions(prev => [...newSubmissions, ...prev]);
  };

  const submitExcelAssessment = async (submission: Omit<ExcelSubmission, 'id' | 'submittedAt' | 'reviewStatus'>) => {
    const nowStr = new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    const existingIndex = excelSubmissions.findIndex(
      s => s.assessmentId === submission.assessmentId && s.candidateId === submission.candidateId
    );

    if (existingIndex >= 0) {
      setExcelSubmissions(prev =>
        prev.map((s, idx) =>
          idx === existingIndex
            ? {
                ...s,
                submittedFileName: submission.submittedFileName,
                submittedFileData: submission.submittedFileData,
                submittedAt: nowStr,
                reviewStatus: 'pending',
              }
            : s
        )
      );
    } else {
      const newSub: ExcelSubmission = {
        id: `excel-sub-${Date.now()}`,
        ...submission,
        submittedAt: nowStr,
        reviewStatus: 'pending',
      };
      setExcelSubmissions(prev => [newSub, ...prev]);
    }
  };

  const updateExcelReviewStatus = async (
    submissionId: string,
    reviewStatus: 'pending' | 'approved' | 'rejected',
    score?: number,
    feedback?: string
  ) => {
    setExcelSubmissions(prev =>
      prev.map(s =>
        s.id === submissionId
          ? {
              ...s,
              reviewStatus,
              score: score !== undefined ? score : s.score,
              feedback: feedback !== undefined ? feedback : s.feedback,
            }
          : s
      )
    );
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        t,
        activeRole,
        setActiveRole,
        activeCandidateId,
        setActiveCandidateId,
        quizzes,
        candidates,
        assignments,
        areas,
        typingTemplates,
        typingAssignments,
        excelAssessments,
        excelSubmissions,
        isLiveDatabase,
        loading,
        createArea,
        createQuiz,
        updateQuiz,
        createCandidate,
        updateCandidate,
        assignQuiz,
        assignCustomQuiz,
        assignCustomSuite,
        submitAssessment,
        updateAssignmentReviewStatus,
        deleteQuiz,
        deleteCandidate,
        createTypingTemplate,
        assignTypingTest,
        submitTypingTest,
        createExcelAssessment,
        assignExcelAssessment,
        submitExcelAssessment,
        updateExcelReviewStatus,
        updateCandidatePassword,
        resetCandidatePassword,
        verifyCandidateAuth,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
