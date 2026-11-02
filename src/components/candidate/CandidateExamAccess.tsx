import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TakeAssessmentModal } from './TakeAssessmentModal';
import { TypingAssessmentModal } from './TypingAssessmentModal';
import { ExcelAssessmentModal } from './ExcelAssessmentModal';
import type { AssessmentAssignment, TypingAssignment, ExcelAssessment } from '../../types';
import { getLocalizedArea } from '../../utils/areaLocalization';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
  Briefcase,
  Lock,
  Award,
  LogOut,
  Keyboard,
  FileSpreadsheet,
  BookOpen,
} from 'lucide-react';

interface Props {
  onSwitchToAdmin?: () => void;
}

interface CandidateSession {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
}

export const CandidateExamAccess: React.FC<Props> = ({ onSwitchToAdmin }) => {
  const {
    assignments,
    quizzes,
    candidates,
    typingAssignments,
    typingTemplates,
    excelAssessments,
    excelSubmissions,
    setActiveRole,
    t,
    language,
  } = useApp();

  const [examCode, setExamCode] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidateSession, setCandidateSession] = useState<CandidateSession | null>(null);
  const [activeAssignment, setActiveAssignment] = useState<AssessmentAssignment | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  // Typing and Excel modal state
  const [isTypingModalOpen, setIsTypingModalOpen] = useState(false);
  const [selectedTypingAssignment, setSelectedTypingAssignment] = useState<TypingAssignment | null>(null);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [selectedExcelAssessment, setSelectedExcelAssessment] = useState<ExcelAssessment | null>(null);

  // Helper to resolve candidate identity from any code, test ID, or candidate email
  const resolveCandidate = (rawCode: string) => {
    if (!rawCode) return null;
    let code = rawCode.trim();
    try {
      code = decodeURIComponent(code);
    } catch {
      // ignore decode error
    }
    code = code.trim().toLowerCase().replace(/^["'#]+|["']+$/g, '');
    if (!code) return null;

    // 1. Direct match with an AssessmentAssignment ID
    const assignMatch = assignments.find(a => a.id.toLowerCase() === code);
    if (assignMatch) {
      return {
        session: {
          candidateId: assignMatch.candidateId,
          candidateName: assignMatch.candidateName,
          candidateEmail: assignMatch.candidateEmail,
        },
        assignment: assignMatch,
        typing: null,
        excel: null,
      };
    }

    // 2. Direct match with a TypingAssignment ID
    const typeMatch = typingAssignments.find(t => t.id.toLowerCase() === code);
    if (typeMatch) {
      const candAssign = assignments.find(
        a => a.candidateEmail.toLowerCase() === typeMatch.candidateEmail.toLowerCase()
      );
      return {
        session: {
          candidateId: typeMatch.candidateId,
          candidateName: typeMatch.candidateName,
          candidateEmail: typeMatch.candidateEmail,
        },
        assignment: candAssign || null,
        typing: typeMatch,
        excel: null,
      };
    }

    // 3. Direct match with an ExcelSubmission ID
    const excelMatch = excelSubmissions.find(s => s.id.toLowerCase() === code);
    if (excelMatch) {
      const candAssign = assignments.find(
        a => a.candidateEmail.toLowerCase() === excelMatch.candidateEmail.toLowerCase()
      );
      const excelAssoc = excelAssessments.find(a => a.id === excelMatch.assessmentId);
      return {
        session: {
          candidateId: excelMatch.candidateId,
          candidateName: excelMatch.candidateName,
          candidateEmail: excelMatch.candidateEmail,
        },
        assignment: candAssign || null,
        typing: null,
        excel: excelAssoc || null,
      };
    }

    // 4. Match by Candidate ID (e.g. cand-1, cand-2)
    const candIdMatch = candidates.find(c => c.id.toLowerCase() === code);
    if (candIdMatch) {
      const candAssign = assignments.find(
        a => a.candidateEmail.toLowerCase() === candIdMatch.email.toLowerCase()
      );
      return {
        session: {
          candidateId: candIdMatch.id,
          candidateName: candIdMatch.name,
          candidateEmail: candIdMatch.email,
        },
        assignment: candAssign || null,
        typing: null,
        excel: null,
      };
    }

    // 5. Match by Candidate Email
    const candidateMatch = candidates.find(c => c.email.toLowerCase() === code);
    if (candidateMatch) {
      const candAssign = assignments.find(
        a => a.candidateEmail.toLowerCase() === candidateMatch.email.toLowerCase()
      );
      return {
        session: {
          candidateId: candidateMatch.id,
          candidateName: candidateMatch.name,
          candidateEmail: candidateMatch.email,
        },
        assignment: candAssign || null,
        typing: null,
        excel: null,
      };
    }

    const emailAssign = assignments.find(a => a.candidateEmail.toLowerCase() === code);
    if (emailAssign) {
      return {
        session: {
          candidateId: emailAssign.candidateId,
          candidateName: emailAssign.candidateName,
          candidateEmail: emailAssign.candidateEmail,
        },
        assignment: emailAssign,
        typing: null,
        excel: null,
      };
    }

    const emailTyping = typingAssignments.find(t => t.candidateEmail.toLowerCase() === code);
    if (emailTyping) {
      const candAssign = assignments.find(
        a => a.candidateEmail.toLowerCase() === emailTyping.candidateEmail.toLowerCase()
      );
      return {
        session: {
          candidateId: emailTyping.candidateId,
          candidateName: emailTyping.candidateName,
          candidateEmail: emailTyping.candidateEmail,
        },
        assignment: candAssign || null,
        typing: emailTyping,
        excel: null,
      };
    }

    const emailExcel = excelSubmissions.find(s => s.candidateEmail.toLowerCase() === code);
    if (emailExcel) {
      const candAssign = assignments.find(
        a => a.candidateEmail.toLowerCase() === emailExcel.candidateEmail.toLowerCase()
      );
      return {
        session: {
          candidateId: emailExcel.candidateId,
          candidateName: emailExcel.candidateName,
          candidateEmail: emailExcel.candidateEmail,
        },
        assignment: candAssign || null,
        typing: null,
        excel: null,
      };
    }

    return null;
  };

  // Check URL query param (?code=... or ?test=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code') || params.get('test');
    if (codeParam) {
      setExamCode(codeParam.trim());
      const res = resolveCandidate(codeParam.trim());
      if (res) {
        setCandidateSession(res.session);
        setCandidateEmail(res.session.candidateEmail);
        if (res.assignment) {
          setActiveAssignment(res.assignment);
        }
        setIsEmailVerified(true);
      }
    }
  }, [assignments, typingAssignments, excelSubmissions, candidates]);

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = resolveCandidate(examCode);
    if (res) {
      setCandidateSession(res.session);
      setCandidateEmail(res.session.candidateEmail);
      if (res.assignment) {
        setActiveAssignment(res.assignment);
      }
      setIsEmailVerified(true);
      return;
    }

    setErrorMessage(t.candidateAccess.screenCode.codeNotFound);
  };

  const handleVerifyEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const expected = (candidateSession?.candidateEmail || activeAssignment?.candidateEmail || '').trim().toLowerCase();
    const entered = candidateEmail.trim().toLowerCase();

    if (!expected || entered !== expected) {
      setErrorMessage(t.candidateAccess.screenEmail.emailMismatch);
      return;
    }

    setIsEmailVerified(true);
  };

  const handleExitToLogin = () => {
    setCandidateSession(null);
    setActiveAssignment(null);
    setIsEmailVerified(false);
    setExamCode('');
    setCandidateEmail('');
    setErrorMessage(null);
    if (window.history.pushState) {
      const cleanUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
      window.history.pushState({ path: cleanUrl }, '', cleanUrl);
    }
  };

  const effectiveEmail = (candidateSession?.candidateEmail || activeAssignment?.candidateEmail || '').trim().toLowerCase();
  const effectiveName = candidateSession?.candidateName || activeAssignment?.candidateName || '';

  // Keep assignment updated with context state in real time
  const currentAssignment = activeAssignment
    ? assignments.find(a => a.id.toLowerCase() === activeAssignment.id.toLowerCase()) || activeAssignment
    : (effectiveEmail ? assignments.find(a => a.candidateEmail.toLowerCase() === effectiveEmail) || null : null);

  const candidateQuizAssignments = effectiveEmail
    ? assignments.filter(a => (a.candidateEmail || '').trim().toLowerCase() === effectiveEmail)
    : [];
  const candidateTypingTests = effectiveEmail
    ? typingAssignments.filter(t => (t.candidateEmail || '').trim().toLowerCase() === effectiveEmail)
    : [];
  const candidateExcelTasks = effectiveEmail
    ? excelSubmissions.filter(s => (s.candidateEmail || '').trim().toLowerCase() === effectiveEmail)
    : [];

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2368f5] to-[#2bc5d9] text-white shadow-md mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#10243e] tracking-tight">
          {t.candidateAccess.brandTitle}
        </h1>
        <p className="text-xs sm:text-sm text-[#60738a] mt-1">
          {t.candidateAccess.brandSubtitle}
        </p>
      </div>

      {/* Screen 1: Request Exam Code if not selected */}
      {!candidateSession && !currentAssignment && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2368f5] flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-[#10243e]">
                {t.candidateAccess.screenCode.headerTitle}
              </h2>
              <p className="text-xs text-[#60738a]">
                {t.candidateAccess.screenCode.headerSubtitle}
              </p>
            </div>
          </div>

          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                {t.candidateAccess.screenCode.codeLabel}
              </label>
              <input
                type="text"
                required
                placeholder={t.candidateAccess.screenCode.codePlaceholder}
                value={examCode}
                onChange={e => setExamCode(e.target.value)}
                className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2368f5]/20 focus:border-[#2368f5]"
              />
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#2368f5] hover:bg-[#144cc0] text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t.candidateAccess.screenCode.searchBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {onSwitchToAdmin && (
            <div className="pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => {
                  setActiveRole('recruiter');
                  onSwitchToAdmin();
                }}
                className="text-xs text-[#2368f5] hover:underline font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>{t.candidateAccess.screenCode.recruiterLink}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Screen 2: Identity Verification with Candidate Email */}
      {(candidateSession || currentAssignment) && !isEmailVerified && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
          <div className="flex items-start justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-[#2368f5] border border-blue-100">
                {t.candidateAccess.screenEmail.invitationConfirmed}
              </span>
              <h2 className="font-extrabold text-lg sm:text-xl text-[#10243e] mt-2">
                {currentAssignment
                  ? getLocalizedArea(currentAssignment.quizTitle, language)
                  : (language === 'es' ? 'Portal de Evaluación Técnica' : 'Technical Skills Assessment Portal')}
              </h2>
              <p className="text-xs text-[#60738a] mt-0.5">
                {t.candidateAccess.screenEmail.registeredCandidate}{' '}
                <span className="font-bold text-slate-800">{effectiveName}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={handleExitToLogin}
              className="text-xs text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              title={language === 'es' ? 'Cambiar código' : 'Change code'}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleVerifyEmail} className="space-y-4">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-[#60738a] space-y-1">
              <p className="font-semibold text-slate-800">
                {t.candidateAccess.screenEmail.verifyIdentityTitle}
              </p>
              <p>
                {t.candidateAccess.screenEmail.verifyIdentityDesc}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                {t.candidateAccess.screenEmail.emailLabel}
              </label>
              <input
                type="email"
                required
                placeholder={t.candidateAccess.screenEmail.emailPlaceholder}
                value={candidateEmail}
                onChange={e => setCandidateEmail(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2368f5]/20 focus:border-[#2368f5]"
                autoFocus
              />
            </div>

            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#2368f5] hover:bg-[#144cc0] text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t.candidateAccess.screenEmail.unlockBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Screen 3: Assessment Lobby & Multi-Module Suite */}
      {(candidateSession || currentAssignment) && isEmailVerified && (
        <div className="space-y-6">
          {/* Candidate Greeting Bar */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {t.candidateAccess.screenLobby.identityVerified}
                  </span>
                </div>
                <h2 className="font-bold text-base sm:text-lg text-[#10243e] mt-1">
                  {t.candidateAccess.screenLobby.welcome} <span className="text-[#2368f5]">{effectiveName}</span>
                </h2>
                <p className="text-xs text-[#60738a] font-mono">{effectiveEmail}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleExitToLogin}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t.candidateAccess.screenVoucher.exitBtn}</span>
            </button>
          </div>

          {/* Module 1: Question Bank Technical Assessments */}
          {candidateQuizAssignments.map(quizAssign => {
            const isQuizCompleted = quizAssign.status === 'completed';
            const quizInfo = quizzes.find(q => q.id === quizAssign.quizId);

            return isQuizCompleted ? (
              <div
                key={quizAssign.id}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-200 shadow-sm space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {t.candidateAccess.screenVoucher.statusBadge}
                      </span>
                      <h3 className="font-black text-lg text-slate-900 mt-1">
                        {getLocalizedArea(quizAssign.quizTitle, language)}
                      </h3>
                      <p className="text-xs text-slate-500">{quizAssign.roleApplied}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black font-mono tabular-nums text-[#2368f5]">
                      {quizAssign.score ?? 0}%
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {t.candidateAccess.screenVoucher.hitsSummary}: {quizAssign.correctAnswersCount ?? 0} / {quizAssign.totalQuestions}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{t.candidateAccess.screenVoucher.instructionsNotice}</span>
                  </div>
                  {quizAssign.completedAt && (
                    <span className="text-[11px] font-mono text-slate-400 shrink-0">
                      {quizAssign.completedAt}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div
                key={quizAssign.id}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6"
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2368f5] flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-xl text-[#10243e]">
                        {getLocalizedArea(quizAssign.quizTitle, language)}
                      </h3>
                      <p className="text-xs text-[#60738a] mt-0.5">{quizAssign.roleApplied}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-2">
                  <div className="p-4 rounded-2xl bg-[#f5f8fc] border border-slate-200 text-center">
                    <span className="text-xs text-[#60738a] block mb-1">
                      {t.candidateAccess.screenLobby.assignedQuestions}
                    </span>
                    <span className="text-2xl font-black font-mono tabular-nums text-[#10243e]">
                      {quizAssign.totalQuestions}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#f5f8fc] border border-slate-200 text-center">
                    <span className="text-xs text-[#60738a] block mb-1">
                      {t.candidateAccess.screenLobby.timeLimit}
                    </span>
                    <span className="text-2xl font-black font-mono tabular-nums text-[#10243e]">
                      {quizAssign.durationMinutes || quizInfo?.timeLimitMinutes || 60} min
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5 leading-relaxed">
                  <p className="font-bold flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-700" />
                    <span>{t.candidateAccess.screenLobby.instructionsTitle}</span>
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-amber-800 pl-1">
                    <li>{t.candidateAccess.screenLobby.rule1}</li>
                    <li>{t.candidateAccess.screenLobby.rule2}</li>
                    <li>{t.candidateAccess.screenLobby.rule3}</li>
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveAssignment(quizAssign);
                    setIsTestModalOpen(true);
                  }}
                  className="w-full py-3.5 bg-[#2368f5] hover:bg-[#144cc0] text-white text-sm font-bold rounded-2xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t.candidateAccess.screenLobby.startBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}

          {/* Module 2: Typing Speed Tests (1 Minute) */}
          {candidateTypingTests.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2368f5] flex items-center justify-center shrink-0">
                  <Keyboard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {language === 'es'
                      ? 'Prueba de Mecanografía (1 Minuto)'
                      : 'Typing Speed Assessment (1 Minute)'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {language === 'es'
                      ? 'Mide palabras por minuto (WPM) y precisión bajo estándar internacional de 1 minuto.'
                      : 'Measures net WPM and typing accuracy under a strict 1-minute benchmark.'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {candidateTypingTests.map(test => (
                  <div
                    key={test.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{test.templateTitle}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {test.status === 'completed'
                          ? `${language === 'es' ? 'Completado:' : 'Completed:'} ${test.netWpm} WPM • ${test.accuracy}% accuracy • ${test.level}`
                          : (language === 'es' ? 'Estado: Pendiente por realizar' : 'Status: Pending')}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTypingAssignment(test);
                        setIsTypingModalOpen(true);
                      }}
                      className={`px-4 py-2.5 rounded-xl font-bold transition-colors cursor-pointer shrink-0 flex items-center justify-center gap-1.5 ${
                        test.status === 'completed'
                          ? 'bg-blue-50 text-[#2368f5] hover:bg-blue-100 border border-blue-200'
                          : 'bg-[#2368f5] hover:bg-[#144cc0] text-white shadow-xs'
                      }`}
                    >
                      <Keyboard className="w-3.5 h-3.5" />
                      <span>
                        {test.status === 'completed'
                          ? (language === 'es' ? 'Repetir Prueba' : 'Retake Test')
                          : (language === 'es' ? 'Iniciar Mecanografía' : 'Start Typing Test')}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Module 3: Practical Excel Assessments */}
          {candidateExcelTasks.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {language === 'es'
                      ? 'Evaluación Práctica en Excel'
                      : 'Practical Excel Assessments'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {language === 'es'
                      ? 'Descarga la plantilla oficial, resuelve los ejercicios requeridos y sube tu libro de trabajo.'
                      : 'Download official workbook template, complete exercises, and upload your resolved spreadsheet.'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {candidateExcelTasks.map(task => {
                  const assess = excelAssessments.find(a => a.id === task.assessmentId);
                  return (
                    <div
                      key={task.id}
                      className="p-4 rounded-2xl bg-emerald-50/40 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{task.assessmentTitle || assess?.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {task.submittedFileName
                            ? `${language === 'es' ? 'Entregado:' : 'Submitted:'} ${task.submittedFileName}`
                            : (language === 'es' ? 'Estado: Pendiente por subir solución' : 'Status: Solution not uploaded yet')}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (assess) {
                            setSelectedExcelAssessment(assess);
                            setIsExcelModalOpen(true);
                          }
                        }}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-colors shadow-xs cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>
                          {task.submittedFileName
                            ? (language === 'es' ? 'Reenviar / Ver Solución' : 'Resubmit / View')
                            : (language === 'es' ? 'Abrir Tarea de Excel' : 'Open Excel Task')}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state when candidate has no modules assigned */}
          {candidateQuizAssignments.length === 0 && candidateTypingTests.length === 0 && candidateExcelTasks.length === 0 && (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-800">
                {language === 'es' ? 'Sin evaluaciones asignadas' : 'No assessments assigned'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {language === 'es'
                  ? 'Actualmente no tienes pruebas técnicas pendientes. Comunícate con tu reclutador para más detalles.'
                  : 'You do not have any pending assessments right now. Please contact your hiring recruiter for details.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Assessment Taking Modal */}
      {isTestModalOpen && (activeAssignment || currentAssignment) && (
        <TakeAssessmentModal
          assignment={activeAssignment || currentAssignment!}
          onClose={() => {
            setIsTestModalOpen(false);
          }}
        />
      )}

      {/* Typing Assessment Modal */}
      {isTypingModalOpen && selectedTypingAssignment && (
        <TypingAssessmentModal
          isOpen={isTypingModalOpen}
          assignment={selectedTypingAssignment}
          template={
            typingTemplates.find(t => t.id === selectedTypingAssignment.templateId) ||
            typingTemplates[0]
          }
          onClose={() => {
            setIsTypingModalOpen(false);
            setSelectedTypingAssignment(null);
          }}
        />
      )}

      {/* Excel Assessment Modal */}
      {isExcelModalOpen && selectedExcelAssessment && (
        <ExcelAssessmentModal
          isOpen={isExcelModalOpen}
          assessment={selectedExcelAssessment}
          candidateId={candidateSession?.candidateId || currentAssignment?.candidateId || ''}
          candidateName={candidateSession?.candidateName || currentAssignment?.candidateName || effectiveName}
          candidateEmail={candidateSession?.candidateEmail || currentAssignment?.candidateEmail || effectiveEmail}
          onClose={() => {
            setIsExcelModalOpen(false);
            setSelectedExcelAssessment(null);
          }}
        />
      )}
    </div>
  );
};
