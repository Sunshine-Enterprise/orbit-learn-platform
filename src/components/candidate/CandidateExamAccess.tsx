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
  Mail,
  Eye,
  EyeOff,
  KeyRound,
  Key,
  ShieldAlert,
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
    verifyCandidateAuth,
    updateCandidatePassword,
    t,
    language,
  } = useApp();

  const isEs = language === 'es';

  // Auth tabs & input state
  const [authTab, setAuthTab] = useState<'login' | 'change_password'>('login');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [candidatePassword, setCandidatePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Password change state
  const [currentTempPass, setCurrentTempPass] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Session state
  const [candidateSession, setCandidateSession] = useState<CandidateSession | null>(null);
  const [activeAssignment, setActiveAssignment] = useState<AssessmentAssignment | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isUsingTempPassword, setIsUsingTempPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // In-lobby password change modal
  const [isLobbyPassModalOpen, setIsLobbyPassModalOpen] = useState(false);
  const [lobbyNewPass, setLobbyNewPass] = useState('');
  const [lobbyConfirmPass, setLobbyConfirmPass] = useState('');

  // Modals state
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
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

    return null;
  };

  // Check URL query param (?code=... or ?test=... or ?email=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get('email');
    const tempParam = params.get('temp');
    const codeParam = params.get('code') || params.get('test');

    if (emailParam) {
      setCandidateEmail(emailParam.trim());
      if (tempParam) {
        setCandidatePassword(tempParam.trim());
      }
    } else if (codeParam) {
      const res = resolveCandidate(codeParam.trim());
      if (res) {
        setCandidateEmail(res.session.candidateEmail);
      }
    }
  }, [assignments, typingAssignments, excelSubmissions, candidates]);

  // Handle Candidate Login with Email + Password (temporary or custom)
  const handleCandidateLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailTrimmed = candidateEmail.trim().toLowerCase();
    const result = verifyCandidateAuth(emailTrimmed, candidatePassword);

    if (!result.success || !result.candidate) {
      setErrorMessage(
        result.error ||
          (isEs
            ? 'Credenciales de acceso incorrectas. Ingrese con la contraseña temporal recibida por correo.'
            : 'Invalid login credentials. Please use the temporary password received by email.')
      );
      return;
    }

    const cand = result.candidate;
    setIsUsingTempPassword(Boolean(result.isTemporary));

    const candAssign = assignments.find(
      a => a.candidateEmail.toLowerCase() === cand.email.toLowerCase()
    );

    setCandidateSession({
      candidateId: cand.id,
      candidateName: cand.name,
      candidateEmail: cand.email,
    });
    if (candAssign) {
      setActiveAssignment(candAssign);
    }
    setIsEmailVerified(true);
  };

  // Handle Changing Temporary Password to Permanent Password before entry
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailTrimmed = candidateEmail.trim().toLowerCase();
    const verify = verifyCandidateAuth(emailTrimmed, currentTempPass);
    if (!verify.success) {
      setErrorMessage(
        isEs
          ? 'La contraseña temporal ingresada no es válida para este correo.'
          : 'The current temporary password entered is invalid for this email.'
      );
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage(
        isEs
          ? 'La nueva contraseña debe tener un mínimo de 6 caracteres.'
          : 'Your new custom password must be at least 6 characters.'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(
        isEs ? 'Las nuevas contraseñas no coinciden.' : 'New custom passwords do not match.'
      );
      return;
    }

    const res = await updateCandidatePassword(emailTrimmed, newPassword);
    if (!res.success) {
      setErrorMessage(res.error || 'Failed to update password');
      return;
    }

    // Success: auto-login candidate with permanent password
    setIsUsingTempPassword(false);
    const cand = verify.candidate || candidates.find(c => c.email.toLowerCase() === emailTrimmed);
    if (cand) {
      const candAssign = assignments.find(
        a => a.candidateEmail.toLowerCase() === cand.email.toLowerCase()
      );
      setCandidateSession({
        candidateId: cand.id,
        candidateName: cand.name,
        candidateEmail: cand.email,
      });
      if (candAssign) {
        setActiveAssignment(candAssign);
      }
      setIsEmailVerified(true);
    }
  };

  // Handle changing password from inside the lobby
  const handleLobbyChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (lobbyNewPass.length < 6) {
      alert(isEs ? 'La nueva contraseña debe tener al menos 6 caracteres.' : 'New password must have at least 6 characters.');
      return;
    }
    if (lobbyNewPass !== lobbyConfirmPass) {
      alert(isEs ? 'Las contraseñas no coinciden.' : 'Passwords do not match.');
      return;
    }

    const effectiveEmail = candidateSession?.candidateEmail || '';
    const res = await updateCandidatePassword(effectiveEmail, lobbyNewPass);
    if (res.success) {
      setIsUsingTempPassword(false);
      setIsLobbyPassModalOpen(false);
      setLobbyNewPass('');
      setLobbyConfirmPass('');
      alert(isEs ? 'Tu contraseña personalizada ha sido establecida exitosamente.' : 'Your custom password has been saved successfully.');
    } else {
      alert(res.error || 'Error updating password');
    }
  };

  const handleExitToLogin = () => {
    setCandidateSession(null);
    setActiveAssignment(null);
    setIsEmailVerified(false);
    setIsUsingTempPassword(false);
    setCandidatePassword('');
    setCurrentTempPass('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMessage(null);
    setSuccessMessage(null);
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
          {isEs
            ? 'Acceso Seguro para Postulantes mediante Correo y Contraseña'
            : 'Secure Candidate Access with Email and Password'}
        </p>
      </div>

      {/* Screen 1: Candidate Authentication Card */}
      {(!candidateSession || !isEmailVerified) && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
          {/* Auth Tab Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setAuthTab('login');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                authTab === 'login'
                  ? 'bg-white text-[#10243e] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isEs ? 'Iniciar Sesión' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab('change_password');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                authTab === 'change_password'
                  ? 'bg-white text-[#10243e] shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {isEs ? 'Establecer Contraseña Propia' : 'Set Custom Password'}
            </button>
          </div>

          {authTab === 'login' ? (
            <form onSubmit={handleCandidateLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  {isEs ? 'Correo Electrónico Registrado' : 'Registered Email Address'} *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder={isEs ? 'nombre.apellido@correo.com' : 'name.surname@email.com'}
                    value={candidateEmail}
                    onChange={e => setCandidateEmail(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2368f5]/20 focus:border-[#2368f5]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-800">
                    {isEs ? 'Contraseña (Temporal o Personalizada)' : 'Password (Temporary or Custom)'} *
                  </label>
                  <button
                    type="button"
                    onClick={() => setAuthTab('change_password')}
                    className="text-[11px] font-semibold text-[#2368f5] hover:underline cursor-pointer"
                  >
                    {isEs ? '¿Cambiar contraseña temporal?' : 'Change temp password?'}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={candidatePassword}
                    onChange={e => setCandidatePassword(e.target.value)}
                    className="w-full text-xs pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2368f5]/20 focus:border-[#2368f5]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showPassword ? (isEs ? 'Ocultar contraseña' : 'Hide password') : (isEs ? 'Mostrar contraseña' : 'Show password')}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-[#2368f5] hover:bg-[#144cc0] text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isEs ? 'Ingresar a mis Evaluaciones' : 'Enter My Assessments'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <Key className="w-3.5 h-3.5 text-[#2368f5]" />
                  <span>{isEs ? 'Definir Contraseña Personalizada' : 'Set Your Personal Password'}</span>
                </p>
                <p>
                  {isEs
                    ? 'Si recibiste una contraseña temporal por correo, ingrésala a continuación junto con tu nueva clave para asegurar tus futuros accesos.'
                    : 'If you received a temporary password via email, enter it below along with your new password to secure future logins.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  {isEs ? 'Correo Electrónico Registrado' : 'Registered Email Address'} *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="nombre.apellido@correo.com"
                    value={candidateEmail}
                    onChange={e => setCandidateEmail(e.target.value)}
                    className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2368f5]/20 focus:border-[#2368f5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  {isEs ? 'Contraseña Temporal Actual' : 'Current Temporary Password'} *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="ej. SEU-temp-101"
                    value={currentTempPass}
                    onChange={e => setCurrentTempPass(e.target.value)}
                    className="w-full text-xs font-mono pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2368f5]/20 focus:border-[#2368f5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    {isEs ? 'Nueva Contraseña' : 'New Password'} *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Mínimo 6 caracteres"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full text-xs pl-9 pr-9 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2368f5]/20 focus:border-[#2368f5]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(prev => !prev)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1">
                    {isEs ? 'Confirmar Nueva Contraseña' : 'Confirm New Password'} *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Repita la contraseña"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2368f5]/20 focus:border-[#2368f5]"
                    />
                  </div>
                </div>
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
                <span>{isEs ? 'Actualizar Contraseña e Ingresar' : 'Update Password and Enter'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick autofill candidate credentials reference card */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
            <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <KeyRound className="w-3.5 h-3.5 text-[#2368f5]" />
              {isEs ? 'Candidatos con Contraseña Temporal Activa' : 'Candidates with Active Temporary Password'}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              {candidates.slice(0, 4).map(cand => (
                <button
                  key={cand.id}
                  type="button"
                  onClick={() => {
                    setCandidateEmail(cand.email);
                    setCandidatePassword(cand.temporaryPassword || 'SEU-temp-101');
                    setCurrentTempPass(cand.temporaryPassword || 'SEU-temp-101');
                    setErrorMessage(null);
                  }}
                  className="p-2 bg-white rounded-lg border border-slate-200 text-left hover:border-blue-400 hover:bg-blue-50/40 transition-colors cursor-pointer"
                >
                  <p className="font-bold text-slate-800 truncate">{cand.name}</p>
                  <p className="text-slate-500 text-[10px] truncate">{cand.email}</p>
                  <p className="font-mono text-[#2368f5] font-bold text-[10px] mt-0.5">
                    {cand.isPasswordChanged ? (isEs ? 'Clave propia establecida' : 'Custom pass active') : (cand.temporaryPassword || 'SEU-temp-101')}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {onSwitchToAdmin && (
            <div className="pt-2 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={() => {
                  setActiveRole('recruiter');
                  onSwitchToAdmin();
                }}
                className="text-xs text-[#2368f5] hover:underline font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>{isEs ? 'Acceso Administrativo / Reclutador' : 'Administrative / Recruiter Portal Access'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Screen 2: Assessment Lobby & Multi-Module Suite */}
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
                  {isUsingTempPassword && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                      {isEs ? 'Contraseña Temporal' : 'Temporary Password'}
                    </span>
                  )}
                </div>
                <h2 className="font-bold text-base sm:text-lg text-[#10243e] mt-1">
                  {t.candidateAccess.screenLobby.welcome} <span className="text-[#2368f5]">{effectiveName}</span>
                </h2>
                <p className="text-xs text-[#60738a] font-mono">{effectiveEmail}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {isUsingTempPassword && (
                <button
                  type="button"
                  onClick={() => setIsLobbyPassModalOpen(true)}
                  className="px-3 py-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  title={isEs ? 'Cambiar a contraseña propia' : 'Change to custom password'}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{isEs ? 'Definir Clave Propia' : 'Set Custom Pass'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleExitToLogin}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.candidateAccess.screenVoucher.exitBtn}</span>
              </button>
            </div>
          </div>

          {/* Temporary Password Security Notice Banner */}
          {isUsingTempPassword && (
            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="font-bold">
                    {isEs ? 'Aviso de Seguridad de Acceso' : 'Access Security Notice'}
                  </p>
                  <p className="text-amber-800 mt-0.5">
                    {isEs
                      ? 'Has ingresado con tu contraseña temporal asignada. Te recomendamos definir una contraseña personal para mayor seguridad en futuros ingresos.'
                      : 'You are signed in with a temporary password. We recommend setting a personal password for enhanced security.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLobbyPassModalOpen(true)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shrink-0 cursor-pointer text-xs"
              >
                {isEs ? 'Cambiar Clave' : 'Change Password'}
              </button>
            </div>
          )}

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
                  className="w-full py-4 bg-[#2368f5] hover:bg-[#144cc0] text-white font-black text-sm rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{t.candidateAccess.screenLobby.startBtn}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}

          {/* Module 2: Typing Assessments */}
          {candidateTypingTests.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2368f5] flex items-center justify-center shrink-0">
                    <Keyboard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-[#10243e]">
                      {isEs ? 'Evaluaciones de Velocidad de Mecanografía' : 'Typing Speed Assessments'}
                    </h3>
                    <p className="text-xs text-[#60738a]">
                      {isEs
                        ? 'Mide palabras por minuto (WPM), precisión y fluidez'
                        : 'Measure words per minute (WPM), accuracy, and typing speed'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {candidateTypingTests.map(test => {
                  const isDone = test.status === 'completed';
                  return (
                    <div
                      key={test.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-[#f8fafc] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              isDone
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {isDone ? (isEs ? 'Completado' : 'Completed') : (isEs ? 'Pendiente' : 'Pending')}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-800">{test.templateTitle}</h4>
                        {isDone ? (
                          <div className="flex items-center gap-3 text-xs text-slate-600 font-mono">
                            <span>{test.netWpm} PPM Netas</span>
                            <span>•</span>
                            <span>{test.accuracy}% Precisión</span>
                            <span>•</span>
                            <span className="font-bold text-[#2368f5] uppercase">{test.level}</span>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">
                            {isEs ? 'Prueba temporizada de digitación estándar' : 'Standard timed keying test'}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTypingAssignment(test);
                          setIsTypingModalOpen(true);
                        }}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer shrink-0 ${
                          isDone
                            ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                            : 'bg-[#2368f5] hover:bg-[#144cc0] text-white shadow-xs'
                        }`}
                      >
                        {isDone ? (isEs ? 'Repetir Prueba' : 'Retake Test') : (isEs ? 'Iniciar Prueba de Typing' : 'Start Typing Test')}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Module 3: Practical Excel Assessments */}
          {candidateExcelTasks.length > 0 && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-[#10243e]">
                      {isEs ? 'Evaluaciones Prácticas de Excel' : 'Practical Excel Assessments'}
                    </h3>
                    <p className="text-xs text-[#60738a]">
                      {isEs
                        ? 'Descarga la plantilla oficial, resuelve el ejercicio y sube tu solución'
                        : 'Download official template workbook, solve the assignment, and upload your file'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {candidateExcelTasks.map(task => {
                  const assessObj = excelAssessments.find(a => a.id === task.assessmentId);
                  const isSubmitted = Boolean(task.submittedFileName);
                  const isReviewed = task.reviewStatus && task.reviewStatus !== 'pending';

                  return (
                    <div
                      key={task.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-[#f8fafc] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              isReviewed
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : isSubmitted
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {isReviewed
                              ? (isEs ? `Calificado (${task.score}%)` : `Reviewed (${task.score}%)`)
                              : isSubmitted
                              ? (isEs ? 'Archivo Enviado' : 'Submitted')
                              : (isEs ? 'Pendiente de Envío' : 'Pending')}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-800">
                          {task.assessmentTitle || assessObj?.title || 'Excel Assessment'}
                        </h4>
                        {isSubmitted ? (
                          <p className="text-xs text-slate-600 font-mono">
                            {task.submittedFileName} • {task.submittedAt}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-500">
                            {assessObj?.timeLimitMinutes || 30} min • {assessObj?.departmentArea || 'General'}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const targetAssess = assessObj || {
                            id: task.assessmentId,
                            title: task.assessmentTitle,
                            description: '',
                            departmentArea: '',
                            timeLimitMinutes: 30,
                            createdAt: '',
                            templateFileName: 'SkillProof_Financial_Model_Template.xlsx',
                            templateFileData: '/templates/SkillProof_Financial_Model_Template.xlsx',
                            instructions: '',
                          };
                          setSelectedExcelAssessment(targetAssess);
                          setIsExcelModalOpen(true);
                        }}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer shrink-0 ${
                          isSubmitted
                            ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                        }`}
                      >
                        <span>
                          {task.submittedFileName
                            ? (isEs ? 'Reenviar / Ver Solución' : 'Resubmit / View')
                            : (isEs ? 'Abrir Tarea de Excel' : 'Open Excel Task')}
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
                {isEs ? 'Sin evaluaciones asignadas' : 'No assessments assigned'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isEs
                  ? 'Actualmente no tienes pruebas técnicas pendientes. Comunícate con tu reclutador para más detalles.'
                  : 'You do not have any pending assessments right now. Please contact your hiring recruiter for details.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Lobby Change Password Modal */}
      {isLobbyPassModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2368f5] flex items-center justify-center shrink-0">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  {isEs ? 'Establecer Contraseña Propia' : 'Set Your Personal Password'}
                </h3>
                <p className="text-xs text-slate-500">
                  {effectiveEmail}
                </p>
              </div>
            </div>

            <form onSubmit={handleLobbyChangePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  {isEs ? 'Nueva Contraseña Personalizada' : 'New Custom Password'} *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  value={lobbyNewPass}
                  onChange={e => setLobbyNewPass(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2368f5]/20 focus:border-[#2368f5]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  {isEs ? 'Confirmar Nueva Contraseña' : 'Confirm New Password'} *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Repita la contraseña"
                  value={lobbyConfirmPass}
                  onChange={e => setLobbyConfirmPass(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2368f5]/20 focus:border-[#2368f5]"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsLobbyPassModalOpen(false);
                    setLobbyNewPass('');
                    setLobbyConfirmPass('');
                  }}
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  {isEs ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-[#2368f5] hover:bg-[#144cc0] rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  {isEs ? 'Guardar Contraseña' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
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
