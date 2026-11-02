import React from 'react';
import { useApp } from '../../context/AppContext';
import type { Candidate, AssessmentAssignment } from '../../types';
import { resolveCandidateGender, getCandidateInitials } from '../../utils/genderHelper';
import { getLocalizedArea } from '../../utils/areaLocalization';
import {
  X,
  Mail,
  Briefcase,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  SendHorizontal,
  Mars,
  Venus,
  Edit3,
  KeyRound,
  RotateCcw,
  Copy,
  Check,
} from 'lucide-react';

interface Props {
  candidate: Candidate | null;
  onClose: () => void;
  onViewScorecard?: (assignment: AssessmentAssignment) => void;
  onAssignTest?: (candidateId: string) => void;
  onEdit?: (candidate: Candidate) => void;
}

export const CandidateProfileModal: React.FC<Props> = ({
  candidate,
  onClose,
  onViewScorecard,
  onAssignTest,
  onEdit,
}) => {
  const { assignments, language, t, resetCandidatePassword, updateCandidatePassword } = useApp();
  const activePassword = candidate?.customPassword || candidate?.temporaryPassword || 'SEU-temp-101';
  const [currentTempPass, setCurrentTempPass] = React.useState<string>(activePassword);
  const [isResetting, setIsResetting] = React.useState(false);
  const [showPass, setShowPass] = React.useState(false);
  const [isEditingPass, setIsEditingPass] = React.useState(false);
  const [editPassInput, setEditPassInput] = React.useState(activePassword);
  const [isSavingPass, setIsSavingPass] = React.useState(false);

  React.useEffect(() => {
    const pass = candidate?.customPassword || candidate?.temporaryPassword || 'SEU-temp-101';
    setCurrentTempPass(pass);
    setEditPassInput(pass);
  }, [candidate]);

  if (!candidate) return null;

  const isEs = language === 'es';
  const gender = resolveCandidateGender(candidate);
  const isFemale = gender === 'female';
  const initials = getCandidateInitials(candidate.name);

  // Candidate assignments
  const candAssignments = assignments.filter(a => a.candidateId === candidate.id);
  const completedAssignments = candAssignments.filter(a => a.status === 'completed');
  const scores = completedAssignments.map(a => a.score ?? 0);
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const bestScore = scores.length > 0 ? Math.max(...scores) : 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 shadow-2xl my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-4">
            {/* Non-image Gender Avatar with single initial and vector symbol */}
            <div className="relative shrink-0">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xs border ${
                  isFemale
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                <span>{initials}</span>
              </div>
              <div
                className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border shadow-xs ${
                  isFemale
                    ? 'bg-purple-100 text-purple-700 border-purple-300'
                    : 'bg-blue-100 text-blue-700 border-blue-300'
                }`}
                title={isFemale ? (isEs ? 'Femenino' : 'Female') : (isEs ? 'Masculino' : 'Male')}
              >
                {isFemale ? <Venus className="w-3.5 h-3.5" /> : <Mars className="w-3.5 h-3.5" />}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {candidate.area && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    {getLocalizedArea(candidate.area, language)}
                  </span>
                )}
                <span className="text-xs text-slate-400 font-mono">ID: {candidate.id.substring(0, 8)}...</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {candidate.name}
              </h2>

              <p className="text-xs text-[#2368f5] font-semibold flex items-center gap-1.5 mt-0.5">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>{candidate.roleApplied}</span>
                <span className="text-slate-300">•</span>
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500 font-normal">{candidate.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEdit(candidate);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-50 text-[#2368f5] hover:bg-blue-100 text-xs font-bold transition-colors border border-blue-200 cursor-pointer"
                title={isEs ? 'Editar Perfil' : 'Edit Profile'}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isEs ? 'Editar Perfil' : 'Edit Profile'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <span className="text-[11px] text-slate-500 block font-medium">
              {isEs ? 'Asignadas' : 'Assigned'}
            </span>
            <span className="text-xl font-black text-slate-900 mt-0.5 block">
              {candAssignments.length}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <span className="text-[11px] text-slate-500 block font-medium">
              {isEs ? 'Completadas' : 'Completed'}
            </span>
            <span className="text-xl font-black text-emerald-600 mt-0.5 block">
              {completedAssignments.length}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <span className="text-[11px] text-slate-500 block font-medium">
              {isEs ? 'Score Promedio' : 'Average Score'}
            </span>
            <span className="text-xl font-black text-[#2368f5] mt-0.5 block">
              {completedAssignments.length > 0 ? `${avgScore}%` : '--'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center">
            <span className="text-[11px] text-slate-500 block font-medium">
              {isEs ? 'Mejor Score' : 'Best Score'}
            </span>
            <span className="text-xl font-black text-purple-600 mt-0.5 block">
              {completedAssignments.length > 0 ? `${bestScore}%` : '--'}
            </span>
          </div>
        </div>

        {/* Candidate Access Credentials Card */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mb-3">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-slate-700 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <KeyRound className="w-3.5 h-3.5 text-[#2368f5]" />
                {isEs ? 'Credenciales de Acceso del Candidato' : 'Candidate Portal Access Credentials'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold shrink-0">
                {candidate.isPasswordChanged
                  ? (isEs ? 'Personalizada' : 'Custom')
                  : (isEs ? 'Temporal Activa' : 'Active Temp')}
              </span>
            </div>

            {isEditingPass ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={editPassInput}
                  onChange={e => setEditPassInput(e.target.value)}
                  placeholder="ej. Test12"
                  className="font-mono text-xs px-2.5 py-1.5 rounded-lg border border-[#2368f5] bg-white focus:outline-none focus:ring-1 focus:ring-[#2368f5] w-48"
                />
                <button
                  type="button"
                  disabled={isSavingPass || !editPassInput.trim()}
                  onClick={async () => {
                    setIsSavingPass(true);
                    try {
                      await updateCandidatePassword(candidate.email, editPassInput.trim(), false);
                      setCurrentTempPass(editPassInput.trim());
                      setIsEditingPass(false);
                    } finally {
                      setIsSavingPass(false);
                    }
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-[#2368f5] text-white font-bold hover:bg-[#1546b8] transition-colors cursor-pointer text-xs flex items-center gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isEs ? 'Guardar' : 'Save'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditPassInput(currentTempPass);
                    setIsEditingPass(false);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition-colors cursor-pointer text-xs"
                >
                  {isEs ? 'Cancelar' : 'Cancel'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-500 font-medium">{isEs ? 'Contraseña actual:' : 'Current password:'}</span>
                <span className="font-mono font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 inline-flex items-center gap-1.5">
                  <span>{showPass ? currentTempPass : '••••••••'}</span>
                  <button
                    type="button"
                    onClick={() => setShowPass(prev => !prev)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    title={showPass ? (isEs ? 'Ocultar' : 'Hide') : (isEs ? 'Mostrar' : 'Show')}
                  >
                    {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(currentTempPass);
                      alert(isEs ? 'Contraseña copiada al portapapeles' : 'Password copied to clipboard');
                    }}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                    title={isEs ? 'Copiar contraseña' : 'Copy password'}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setEditPassInput(currentTempPass);
                    setIsEditingPass(true);
                  }}
                  className="text-xs text-[#2368f5] hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer ml-1"
                  title={isEs ? 'Cambiar contraseña de acceso' : 'Edit candidate password'}
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{isEs ? 'Editar Clave' : 'Edit Pass'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isResetting}
              onClick={async () => {
                setIsResetting(true);
                try {
                  const newTemp = await resetCandidatePassword(candidate.id);
                  setCurrentTempPass(newTemp);
                  setEditPassInput(newTemp);
                  alert(isEs ? `Nueva contraseña temporal generada: ${newTemp}` : `New temporary password generated: ${newTemp}`);
                } finally {
                  setIsResetting(false);
                }
              }}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-300 rounded-xl transition-colors cursor-pointer text-xs flex items-center gap-1.5 shrink-0"
              title={isEs ? 'Generar nueva contraseña temporal' : 'Generate new temporary password'}
            >
              <RotateCcw className={`w-3.5 h-3.5 text-[#2368f5] ${isResetting ? 'animate-spin' : ''}`} />
              <span>{isEs ? 'Restablecer Clave Temporal' : 'Reset Temp Password'}</span>
            </button>
          </div>
        </div>

        {/* Assessment History */}
        <div className="overflow-y-auto flex-1 space-y-3 pr-1 py-1">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800">
              {isEs ? 'Historial de Evaluaciones Técnicas' : 'Technical Assessments History'} ({candAssignments.length})
            </h3>
            {onAssignTest && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAssignTest(candidate.id);
                }}
                className="text-xs font-bold text-[#2368f5] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <SendHorizontal className="w-3 h-3" />
                <span>{isEs ? 'Asignar Nuevo Test' : 'Assign New Test'}</span>
              </button>
            )}
          </div>

          {candAssignments.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              {isEs ? 'No hay evaluaciones asignadas a este postulante.' : 'No assessments assigned to this candidate yet.'}
            </div>
          ) : (
            candAssignments.map(item => {
              const isDone = item.status === 'completed';
              const effectiveStatus = item.reviewStatus || (isDone ? ((item.score ?? 0) >= 50 ? 'stand_by' : 'rejected') : 'pending');

              return (
                <div
                  key={item.id}
                  className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">
                      {getLocalizedArea(item.quizTitle, language)}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{isEs ? 'Asignado:' : 'Assigned:'} {item.assignedAt}</span>
                      {item.completedAt && (
                        <>
                          <span>•</span>
                          <span>{isEs ? 'Finalizado:' : 'Completed:'} {item.completedAt}</span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Score */}
                    {isDone ? (
                      <span
                        className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                          (item.score ?? 0) >= 75
                            ? 'bg-emerald-100 text-emerald-800'
                            : (item.score ?? 0) >= 50
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {item.score}%
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 font-semibold italic">--</span>
                    )}

                    {/* Status badge */}
                    {!isDone ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{isEs ? 'Aún no completada' : 'Not completed'}</span>
                      </span>
                    ) : effectiveStatus === 'approved' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{isEs ? 'Aprobado' : 'Approved'}</span>
                      </span>
                    ) : effectiveStatus === 'rejected' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <X className="w-3 h-3 text-rose-600" />
                        <span>{isEs ? 'Rechazado' : 'Rejected'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Stand By</span>
                      </span>
                    )}

                    {/* View scorecard */}
                    {isDone && onViewScorecard && (
                      <button
                        type="button"
                        onClick={() => onViewScorecard(item)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-[#2368f5] hover:bg-blue-50 transition-colors cursor-pointer"
                        title={isEs ? 'Ver Scorecard' : 'View Scorecard'}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-[#10243e] text-white rounded-xl hover:bg-[#1c3553] transition-colors cursor-pointer"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
};
