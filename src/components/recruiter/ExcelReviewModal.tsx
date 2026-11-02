import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  MessageSquare,
  Award,
  Check,
  Clock,
  User,
} from 'lucide-react';
import { CustomSelect } from '../common/CustomSelect';
import type { ExcelSubmission } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  submission: ExcelSubmission | null;
}

export const ExcelReviewModal: React.FC<Props> = ({ isOpen, onClose, submission }) => {
  const { excelAssessments, updateExcelReviewStatus, t, language } = useApp();

  const [score, setScore] = useState<number>(submission?.score ?? 85);
  const [reviewStatus, setReviewStatus] = useState<'pending' | 'approved' | 'rejected'>(
    submission?.reviewStatus || 'approved'
  );
  const [feedback, setFeedback] = useState<string>(submission?.feedback || '');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (submission) {
      setScore(submission.score ?? 85);
      setReviewStatus(submission.reviewStatus || 'approved');
      setFeedback(submission.feedback || '');
      setIsSaved(false);
    }
  }, [submission]);

  if (!isOpen || !submission) return null;

  const assessment = excelAssessments.find(a => a.id === submission.assessmentId);

  const handleDownloadSolution = () => {
    if (submission.submittedFileData && submission.submittedFileData.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = submission.submittedFileData;
      link.download = submission.submittedFileName || 'candidate_solution.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const sampleSol = submission.submittedFileData || `Candidate Excel Submission: ${assessment?.title || 'Excel Task'}\nCandidate: ${submission.candidateName} (${submission.candidateEmail})\nSubmitted: ${submission.submittedAt}\n\nCategory,Quarter,Budget,Actual,Variance,Status\nRevenue,Q1,50000,52000,=D4-C4,Favorable\nOperations,Q1,20000,19500,=C5-D5,On Budget\nMarketing,Q1,15000,16200,=C6-D6,Over Budget\nIT Infrastructure,Q1,8000,7800,=C7-D7,Under Budget\nTotal,=SUM(C4:C7),=SUM(D4:D7),=SUM(E4:E7),Calculated\n`;
      const fileName = (submission.submittedFileName || 'candidate_solution.csv').replace(/\.xlsx$/i, '.csv');
      const blob = new Blob(['\uFEFF' + sampleSol], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const clampedScore = Math.max(0, Math.min(100, Number(score) || 0));

    updateExcelReviewStatus(submission.id, reviewStatus, clampedScore, feedback.trim());
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-4 sm:p-6 border border-slate-200 shadow-2xl max-h-[92vh] overflow-y-auto my-auto space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#2368f5] flex items-center justify-center shrink-0 border border-blue-100">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                {t.recruiter.excel.reviewModalTitle}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'es'
                  ? 'Audita el archivo resuelto por el postulante y emite calificación técnica'
                  : 'Audit candidate solution and assign numerical score & feedback'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSaved ? (
          <div className="py-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              {language === 'es' ? 'Calificación Guardada Exitosamente' : 'Evaluation Saved Successfully'}
            </h3>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {/* Candidate & Assessment Summary Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#2368f5]" />
                  <span>{t.recruiter.excel.colCandidate}:</span>
                </span>
                <span className="font-bold text-slate-900">
                  {submission.candidateName}{' '}
                  {submission.candidateEmail && (
                    <span className="text-slate-400 font-normal">({submission.candidateEmail})</span>
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">
                  {t.recruiter.excel.colTask}:
                </span>
                <span className="font-bold text-slate-900 truncate max-w-[240px]">
                  {assessment?.title || submission.assessmentTitle || 'Excel Task'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t.recruiter.excel.colDate}:</span>
                </span>
                <span className="font-mono text-slate-700">{submission.submittedAt}</span>
              </div>
            </div>

            {/* Download Candidate Workbook Action */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                  {t.recruiter.excel.colSubmission}
                </span>
                <p className="font-mono text-xs font-bold text-slate-900 truncate max-w-[240px]">
                  {submission.submittedFileName || 'solution_file.xlsx'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadSolution}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t.recruiter.excel.downloadSubmission}</span>
              </button>
            </div>

            {/* Scoring & Review Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-[#2368f5]" />
                  <span>{t.recruiter.excel.scoreLabel}</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={score}
                  onChange={e => setScore(Number(e.target.value))}
                  className="w-full text-xs font-mono font-bold p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2368f5]/20 focus:border-[#2368f5]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {t.recruiter.excel.colReviewStatus}
                </label>
                <CustomSelect
                  value={reviewStatus}
                  onChange={val => setReviewStatus(val as 'pending' | 'approved' | 'rejected')}
                  className="w-full"
                  options={[
                    {
                      value: 'approved',
                      label: language === 'es' ? 'Aprobado / Satisfactorio' : 'Approved',
                    },
                    {
                      value: 'rejected',
                      label: language === 'es' ? 'Rechazado / Por Mejorar' : 'Needs Revision',
                    },
                    {
                      value: 'pending',
                      label: language === 'es' ? 'En Auditoría / Pendiente' : 'Under Review',
                    },
                  ]}
                />
              </div>
            </div>

            {/* Feedback Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.recruiter.excel.feedbackLabel}</span>
              </label>
              <textarea
                rows={3}
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder={t.recruiter.excel.feedbackPlaceholder}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2368f5]/20 focus:border-[#2368f5] resize-none"
              />
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold bg-[#2368f5] hover:bg-[#144cc0] text-white rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>{t.recruiter.excel.saveEvaluationBtn}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
