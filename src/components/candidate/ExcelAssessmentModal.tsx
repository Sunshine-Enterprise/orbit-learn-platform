import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  FileSpreadsheet,
  Download,
  UploadCloud,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Trash2,
  LogOut,
  SendHorizontal,
  Check,
  ShieldCheck,
} from 'lucide-react';
import type { ExcelAssessment } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  assessment: ExcelAssessment;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  onSubmitted?: () => void;
}

export const ExcelAssessmentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  assessment,
  candidateId,
  candidateName,
  candidateEmail,
  onSubmitted,
}) => {
  const { submitExcelAssessment, t, language } = useApp();

  const [timeLeft, setTimeLeft] = useState<number>(assessment.timeLimitMinutes * 60);
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileData, setUploadedFileData] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || !hasStarted || isCompleted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, hasStarted, isCompleted]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(assessment.timeLimitMinutes * 60);
      setHasStarted(false);
      setUploadedFile(null);
      setUploadedFileData('');
      setIsCompleted(false);
      setIsSubmitting(false);
      setErrorMessage(null);
    }
  }, [isOpen, assessment]);

  if (!isOpen) return null;

  // Format time MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isTimeCritical = timeLeft < 300; // < 5 mins

  // Download template workbook handler
  const handleDownloadTemplate = () => {
    // 1. Data URL (Base64)
    if (assessment.templateFileData && assessment.templateFileData.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = assessment.templateFileData;
      link.download = assessment.templateFileName || 'assessment_template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // 2. Direct static file path (e.g. /templates/...)
    if (assessment.templateFileData && (assessment.templateFileData.startsWith('/') || assessment.templateFileData.startsWith('http'))) {
      const link = document.createElement('a');
      link.href = assessment.templateFileData;
      link.download = assessment.templateFileName || 'assessment_template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // 3. Fallback: If template is a known file in /templates/
    if (assessment.templateFileName) {
      const link = document.createElement('a');
      link.href = `/templates/${assessment.templateFileName}`;
      link.download = assessment.templateFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // 4. Fallback: Plain CSV text, ensure UTF-8 BOM and .csv extension so Excel opens cleanly without corruption errors
    const rawData = assessment.templateFileData || `SkillProof Assessment: ${assessment.title}\nCandidate: ${candidateName} (${candidateEmail})\n\nCategory,Quarter,Budget,Actual,Variance Formula\nRevenue,Q1,50000,52000,=D4-C4\nOperations,Q1,20000,19500,=C5-D5\nMarketing,Q1,15000,16200,=C6-D6\nIT Infrastructure,Q1,8000,7800,=C7-D7\nTotal,=SUM(C4:C7),=SUM(D4:D7),=SUM(E4:E7)\n`;
    const fileName = (assessment.templateFileName || 'assessment_template.csv').replace(/\.xlsx$/i, '.csv');
    const blob = new Blob(['\uFEFF' + rawData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedFileData(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedFile) {
      setErrorMessage(
        language === 'es'
          ? 'Debes adjuntar tu libro de trabajo resuelto antes de enviar.'
          : 'You must attach your completed workbook before submitting.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await submitExcelAssessment({
        assessmentId: assessment.id,
        assessmentTitle: assessment.title,
        candidateId,
        candidateName,
        candidateEmail,
        submittedFileName: uploadedFile.name,
        submittedFileData: uploadedFileData || 'data:text/plain;charset=utf-8,submitted',
      });
      setIsCompleted(true);
      if (onSubmitted) {
        onSubmitted();
      }
    } catch {
      setErrorMessage(
        language === 'es' ? 'Error al enviar el archivo. Intenta nuevamente.' : 'Error uploading file. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-4 sm:p-6 border border-slate-200 shadow-2xl max-h-[92vh] overflow-y-auto my-auto space-y-5">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {language === 'es' ? 'Evaluación Práctica de Excel' : 'Practical Excel Assessment'}
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight mt-1">
                {assessment.title}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voucher / Submission Confirmed State */}
        {isCompleted ? (
          <div className="py-6 space-y-6">
            <div className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                {language === 'es' ? 'Evaluación Práctica Enviada con Éxito' : 'Practical Assessment Submitted'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {language === 'es'
                  ? 'Tu archivo ha sido registrado de forma segura. El reclutador auditará las fórmulas y modelos financieros aplicados.'
                  : 'Your solved workbook has been securely submitted. The recruiter will evaluate formula integrity and modeling structure.'}
              </p>
            </div>

            {/* Official Voucher Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">
                  {language === 'es' ? 'Postulante:' : 'Candidate:'}
                </span>
                <span className="font-bold text-slate-900">{candidateName}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">
                  {language === 'es' ? 'Tarea Asignada:' : 'Assigned Task:'}
                </span>
                <span className="font-bold text-slate-900 truncate max-w-[220px]">
                  {assessment.title}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-medium">
                  {language === 'es' ? 'Archivo Entregado:' : 'Submitted Workbook:'}
                </span>
                <span className="font-mono text-emerald-700 font-bold truncate max-w-[220px]">
                  {uploadedFile?.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">
                  {language === 'es' ? 'Estado de Calificación:' : 'Review Status:'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  {language === 'es' ? 'Pendiente de Auditoría' : 'Pending Review'}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-[#2368f5] hover:bg-[#144cc0] text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{language === 'es' ? 'Cerrar y Volver al Portal' : 'Close and Return to Portal'}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Countdown Timer & Candidate Status Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>
                  {language === 'es' ? 'Postulante:' : 'Candidate:'}{' '}
                  <strong>{candidateName}</strong> ({candidateEmail})
                </span>
              </div>

              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-bold text-sm ${
                  isTimeCritical
                    ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                    : 'bg-white text-slate-800 border-slate-200 shadow-2xs'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>{timeFormatted}</span>
              </div>
            </div>

            {/* Description Card */}
            <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl text-xs text-[#10243e] space-y-1">
              <p className="font-bold">{language === 'es' ? 'Descripción del Reto:' : 'Task Overview:'}</p>
              <p className="text-slate-600 leading-relaxed">{assessment.description}</p>
            </div>

            {/* Step 1: Download Original Template */}
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px] font-bold">
                    1
                  </span>
                  <span>
                    {language === 'es'
                      ? 'Descarga la Plantilla de Trabajo'
                      : 'Download the Template Workbook'}
                  </span>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {assessment.templateFileName}
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setHasStarted(true);
                  handleDownloadTemplate();
                }}
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>
                  {language === 'es'
                    ? `Descargar Plantilla (${assessment.templateFileName})`
                    : `Download Template (${assessment.templateFileName})`}
                </span>
              </button>
            </div>

            {/* Step 2: Step-by-Step Instructions */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-[11px] font-bold">
                  2
                </span>
                <FileText className="w-4 h-4 text-amber-700" />
                <span>
                  {language === 'es'
                    ? 'Instrucciones de Resolución:'
                    : 'Step-by-Step Instructions:'}
                </span>
              </span>

              <ul className="space-y-1.5 text-xs text-amber-900 pl-2">
                {(typeof assessment.instructions === 'string'
                  ? assessment.instructions.split('\n')
                  : Array.isArray(assessment.instructions)
                  ? (assessment.instructions as string[])
                  : []
                )
                  .map(i => i.trim())
                  .filter(Boolean)
                  .map((inst, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="font-bold shrink-0">{idx + 1}.</span>
                      <span className="leading-relaxed">{inst}</span>
                    </li>
                  ))}
              </ul>
            </div>

            {/* Step 3: Upload Solved Workbook Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#2368f5] text-white flex items-center justify-center text-[11px] font-bold">
                    3
                  </span>
                  <UploadCloud className="w-4 h-4 text-[#2368f5]" />
                  <span>
                    {language === 'es'
                      ? 'Sube tu Archivo Resuelto (.xlsx, .xls, .csv)'
                      : 'Upload Completed Workbook (.xlsx, .xls, .csv)'}
                  </span>
                </span>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-[#2368f5] rounded-2xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-blue-50/20"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-800">
                    {language === 'es'
                      ? 'Haz clic aquí o arrastra tu archivo resuelto'
                      : 'Click here or drag and drop your completed file'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Excel Workbook (.xlsx, .xls) o CSV (.csv)
                  </p>
                </div>

                {uploadedFile && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold">
                    <div className="flex items-center gap-2 truncate">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">{uploadedFile.name}</span>
                      <span className="text-[10px] text-emerald-600 font-normal">
                        ({Math.round(uploadedFile.size / 1024)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUploadedFile(null);
                        setUploadedFileData('');
                      }}
                      className="p-1 hover:text-rose-600 cursor-pointer ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:flex-1 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={!uploadedFile || isSubmitting}
                  className="w-full sm:flex-2 py-3 sm:py-2.5 px-4 text-xs font-bold bg-[#2368f5] hover:bg-[#144cc0] disabled:opacity-40 text-white rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <SendHorizontal className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? t.common.loading
                      : language === 'es'
                      ? 'Enviar Solución al Reclutador'
                      : 'Submit Solution for Evaluation'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
