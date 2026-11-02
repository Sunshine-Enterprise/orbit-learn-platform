import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  SendHorizontal,
  CheckCircle2,
  CheckSquare,
  Square,
  Search,
  Users,
  BookOpen,
  Briefcase,
  Check,
  Mars,
  Venus,
  Filter,
  Clock,
  Shield,
  Zap,
  Award,
  Info,
  Layers,
  PlusCircle,
  Trash2,
  Keyboard,
  FileSpreadsheet,
} from 'lucide-react';

import { getLocalizedArea } from '../../utils/areaLocalization';
import { resolveCandidateGender, getCandidateInitials } from '../../utils/genderHelper';
import { CustomSelect } from '../common/CustomSelect';
import { sendAssessmentInviteEmail } from '../../services/emailService';

interface ConfiguredBank {
  quizId: string;
  durationPreset: 5 | 15 | 30;
  selectedQuestionIds: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  defaultCandidateId?: string;
  defaultQuizId?: string;
}

export const AssignQuizModal: React.FC<Props> = ({
  isOpen,
  onClose,
  defaultCandidateId,
  defaultQuizId,
}) => {
  const {
    candidates,
    quizzes,
    assignCustomSuite,
    typingTemplates,
    assignTypingTest,
    excelAssessments,
    assignExcelAssessment,
    t,
    language,
  } = useApp();

  // Assessment Modality: Quiz Bank, Typing Test, or Practical Excel
  const [modality, setModality] = useState<'quiz' | 'typing' | 'excel'>('quiz');
  const [selectedTypingId, setSelectedTypingId] = useState<string>('');
  const [selectedExcelId, setSelectedExcelId] = useState<string>('');

  // Top Demand Filters
  const [filterArea, setFilterArea] = useState<string>('');
  const [filterRole, setFilterRole] = useState<string>('');

  // Target Candidate Selection
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);

  // Step 2: Cascading branch/bank selectors to add to suite
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');

  // Multi-Bank Suite Configuration
  const [configuredBanks, setConfiguredBanks] = useState<ConfiguredBank[]>([]);
  const [activeBankIndex, setActiveBankIndex] = useState<number>(0);

  // Notifications & Search
  const [suiteWarning, setSuiteWarning] = useState<string | null>(null);
  const [trimNotice, setTrimNotice] = useState<string | null>(null);
  const [questionSearch, setQuestionSearch] = useState('');
  const [assignedSuccess, setAssignedSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available filters from candidate pool
  const candidateAreas = Array.from(
    new Set(candidates.map(c => c.area).filter(Boolean))
  ) as string[];
  const candidateRoles = Array.from(
    new Set(candidates.map(c => c.roleApplied).filter(Boolean))
  ) as string[];

  // All distinct quiz branches / categories
  const availableBranches = Array.from(
    new Set(quizzes.map(q => q.category).filter(Boolean))
  );

  // Filtered candidate list based on Demand Filters
  const filteredCandidates = candidates.filter(c => {
    if (filterArea) {
      const inPrimary = c.area === filterArea;
      const inSecondary = c.secondaryAreas?.includes(filterArea);
      if (!inPrimary && !inSecondary) return false;
    }
    if (filterRole && c.roleApplied !== filterRole) return false;
    return true;
  });

  // Single candidate detection
  const isSingleCandidate = selectedCandidateIds.length === 1;
  const singleCandidate = isSingleCandidate
    ? candidates.find(c => c.id === selectedCandidateIds[0])
    : null;

  const candidateAssociatedAreas: string[] = singleCandidate
    ? ([singleCandidate.area, ...(singleCandidate.secondaryAreas || [])].filter(Boolean) as string[])
    : [];

  // Filter quizzes strictly by the selected branch (or all if empty)
  const branchQuizzes = selectedBranch
    ? quizzes.filter(
        q => q.category.toLowerCase().trim() === selectedBranch.toLowerCase().trim()
      )
    : quizzes;

  // Active bank being edited in Step 3
  const activeBank = configuredBanks[activeBankIndex] || configuredBanks[0];
  const activeQuiz = activeBank
    ? quizzes.find(q => q.id === activeBank.quizId)
    : null;

  const activeMaxAllowed = activeBank
    ? activeBank.durationPreset === 5
      ? 5
      : activeBank.durationPreset === 15
      ? 10
      : Infinity
    : Infinity;

  // Initialize defaults on modal open
  useEffect(() => {
    if (isOpen) {
      setFilterArea('');
      setFilterRole('');
      setSuiteWarning(null);
      setTrimNotice(null);
      setQuestionSearch('');
      setIsSubmitting(false);

      const initialCandIds = defaultCandidateId
        ? [defaultCandidateId]
        : candidates.length > 0
        ? [candidates[0].id]
        : [];
      setSelectedCandidateIds(initialCandIds);

      // Candidate branch
      const cand = candidates.find(c => c.id === initialCandIds[0]);
      const initialBranch = cand?.area || '';
      setSelectedBranch(initialBranch);

      const matchingQuizzes = initialBranch
        ? quizzes.filter(
            q => q.category.toLowerCase().trim() === initialBranch.toLowerCase().trim()
          )
        : quizzes;

      const initialQId = defaultQuizId || matchingQuizzes[0]?.id || quizzes[0]?.id || '';
      setSelectedQuizId(initialQId);

      // Pre-seed 1 default bank in configured suite (15 mins, up to 10 questions)
      const chosenQuiz = quizzes.find(q => q.id === initialQId) || matchingQuizzes[0] || quizzes[0];
      if (chosenQuiz) {
        const initialQuestions = chosenQuiz.questions.slice(0, 10).map(q => q.id);
        setConfiguredBanks([
          {
            quizId: chosenQuiz.id,
            durationPreset: 15,
            selectedQuestionIds: initialQuestions,
          },
        ]);
        setActiveBankIndex(0);
      } else {
        setConfiguredBanks([]);
        setActiveBankIndex(0);
      }

      setModality('quiz');
      if (typingTemplates.length > 0) {
        setSelectedTypingId(typingTemplates[0].id);
      }
      if (excelAssessments.length > 0) {
        setSelectedExcelId(excelAssessments[0].id);
      }

      setAssignedSuccess(false);
    }
  }, [isOpen, defaultCandidateId, defaultQuizId, candidates, quizzes, typingTemplates, excelAssessments]);

  // Handle modality change in Nivel 0
  const handleModalityChange = (newModality: 'quiz' | 'typing' | 'excel') => {
    setModality(newModality);
    setSuiteWarning(null);
    setTrimNotice(null);

    if (newModality === 'typing') {
      if (!selectedTypingId && typingTemplates.length > 0) {
        setSelectedTypingId(typingTemplates[0].id);
      }
    } else if (newModality === 'excel') {
      if (!selectedExcelId && excelAssessments.length > 0) {
        setSelectedExcelId(excelAssessments[0].id);
      }
    } else if (newModality === 'quiz') {
      if (configuredBanks.length === 0 && quizzes.length > 0) {
        const defaultQ = branchQuizzes[0] || quizzes[0];
        if (defaultQ) {
          setConfiguredBanks([
            {
              quizId: defaultQ.id,
              durationPreset: 15,
              selectedQuestionIds: defaultQ.questions.slice(0, 10).map(q => q.id),
            },
          ]);
          setActiveBankIndex(0);
        }
      }
    }
  };

  // Handle branch cascading change in Step 2
  const handleBranchChange = (branch: string) => {
    setSelectedBranch(branch);
    const matching = branch
      ? quizzes.filter(
          q => q.category.toLowerCase().trim() === branch.toLowerCase().trim()
        )
      : quizzes;

    if (matching.length > 0) {
      setSelectedQuizId(matching[0].id);
    } else {
      setSelectedQuizId('');
    }
  };

  // Add selected bank into the Assessment Suite
  const handleAddBankToSuite = () => {
    if (!selectedQuizId) return;

    // Check duplicate
    const alreadyExists = configuredBanks.some(b => b.quizId === selectedQuizId);
    if (alreadyExists) {
      setSuiteWarning(t.recruiter.assignModal.bankAlreadyAdded);
      setTimeout(() => setSuiteWarning(null), 4000);
      return;
    }

    const quizToAdd = quizzes.find(q => q.id === selectedQuizId);
    if (!quizToAdd) return;

    // Default 15 min preset (max 10 questions)
    const initialQuestions = quizToAdd.questions.slice(0, 10).map(q => q.id);
    const newBank: ConfiguredBank = {
      quizId: selectedQuizId,
      durationPreset: 15,
      selectedQuestionIds: initialQuestions,
    };

    const nextSuite = [...configuredBanks, newBank];
    setConfiguredBanks(nextSuite);
    setActiveBankIndex(nextSuite.length - 1);
    setSuiteWarning(null);
  };

  // Remove bank from the suite
  const handleRemoveBank = (indexToRemove: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSuite = configuredBanks.filter((_, idx) => idx !== indexToRemove);
    setConfiguredBanks(nextSuite);
    if (activeBankIndex >= nextSuite.length) {
      setActiveBankIndex(Math.max(0, nextSuite.length - 1));
    }
  };

  // Candidate selection toggle
  const toggleCandidate = (cId: string) => {
    let next: string[];
    if (selectedCandidateIds.includes(cId)) {
      next = selectedCandidateIds.filter(id => id !== cId);
    } else {
      next = [...selectedCandidateIds, cId];
    }
    setSelectedCandidateIds(next);

    // If only one candidate selected and no suite configured yet, align branch
    if (next.length === 1 && configuredBanks.length <= 1) {
      const single = candidates.find(c => c.id === next[0]);
      if (single?.area && (!selectedBranch || selectedBranch !== single.area)) {
        handleBranchChange(single.area);
      }
    }
  };

  const selectAllCandidates = () => {
    setSelectedCandidateIds(filteredCandidates.map(c => c.id));
  };

  const deselectAllCandidates = () => {
    setSelectedCandidateIds([]);
  };

  // Handle duration change for ACTIVE bank with auto-trimming
  const handleDurationPresetChange = (newPreset: 5 | 15 | 30) => {
    if (!activeBank) return;
    const newMax = newPreset === 5 ? 5 : newPreset === 15 ? 10 : Infinity;

    setConfiguredBanks(prev =>
      prev.map((bank, idx) => {
        if (idx !== activeBankIndex) return bank;
        let newQuestions = bank.selectedQuestionIds;
        if (newQuestions.length > newMax) {
          newQuestions = newQuestions.slice(0, newMax);
          setTrimNotice(
            t.recruiter.assignModal.capAutoTrimmed.replace('{max}', String(newMax))
          );
          setTimeout(() => setTrimNotice(null), 4000);
        }
        return {
          ...bank,
          durationPreset: newPreset,
          selectedQuestionIds: newQuestions,
        };
      })
    );
  };

  // Question toggle for ACTIVE bank
  const toggleQuestion = (qId: string) => {
    if (!activeBank) return;
    const maxAllowed = activeMaxAllowed;

    setConfiguredBanks(prev =>
      prev.map((bank, idx) => {
        if (idx !== activeBankIndex) return bank;
        const isChecked = bank.selectedQuestionIds.includes(qId);
        if (isChecked) {
          return {
            ...bank,
            selectedQuestionIds: bank.selectedQuestionIds.filter(id => id !== qId),
          };
        } else {
          if (bank.selectedQuestionIds.length >= maxAllowed) {
            return bank; // Cap reached
          }
          return {
            ...bank,
            selectedQuestionIds: [...bank.selectedQuestionIds, qId],
          };
        }
      })
    );
  };

  const selectAllQuestions = () => {
    if (!activeBank || !activeQuiz) return;
    const maxAllowed = activeMaxAllowed;
    const allIds = activeQuiz.questions.map(q => q.id);
    const chosen = allIds.length > maxAllowed ? allIds.slice(0, maxAllowed) : allIds;

    if (allIds.length > maxAllowed) {
      setTrimNotice(
        t.recruiter.assignModal.capAutoTrimmed.replace('{max}', String(maxAllowed))
      );
      setTimeout(() => setTrimNotice(null), 4000);
    }

    setConfiguredBanks(prev =>
      prev.map((bank, idx) =>
        idx === activeBankIndex ? { ...bank, selectedQuestionIds: chosen } : bank
      )
    );
  };

  const deselectAllQuestions = () => {
    setConfiguredBanks(prev =>
      prev.map((bank, idx) =>
        idx === activeBankIndex ? { ...bank, selectedQuestionIds: [] } : bank
      )
    );
  };

  if (!isOpen) return null;

  // Filter questions by search within the active bank
  const filteredQuestions =
    activeQuiz?.questions.filter(q => {
      if (!questionSearch.trim()) return true;
      const term = questionSearch.toLowerCase();
      return (
        q.text.toLowerCase().includes(term) ||
        (q.categoryTag && q.categoryTag.toLowerCase().includes(term))
      );
    }) || [];

  const isCapReached =
    Boolean(activeBank) && activeBank.selectedQuestionIds.length >= activeMaxAllowed;

  // Calculations for total suite metrics
  const totalQuestions = configuredBanks.reduce(
    (sum, b) => sum + b.selectedQuestionIds.length,
    0
  );
  const hasEmptyBank = configuredBanks.some(b => b.selectedQuestionIds.length === 0);

  // Preview quiz currently in the Step 2 dropdown
  const previewDropdownQuiz = branchQuizzes.find(q => q.id === selectedQuizId);

  // Helper for typing and excel preview
  const selectedTypingTemplate = typingTemplates.find(t => t.id === selectedTypingId) || typingTemplates[0];
  const selectedExcelAssessment = excelAssessments.find(a => a.id === selectedExcelId) || excelAssessments[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCandidateIds.length === 0) {
      alert(t.recruiter.assignModal.noCandidatesSelected);
      return;
    }

    if (modality === 'typing') {
      if (!selectedTypingId) {
        alert(language === 'es' ? 'Selecciona una plantilla de mecanografía.' : 'Please select a typing template.');
        return;
      }
      setIsSubmitting(true);
      try {
        await assignTypingTest(selectedCandidateIds, selectedTypingId);

        // Send automated invitation email via Microsoft 365 (web@seu-usa.com)
        const targetCandidates = candidates.filter(c => selectedCandidateIds.includes(c.id));
        const typingTpl = typingTemplates.find(t => t.id === selectedTypingId);
        const typingDurationMin = Math.round((typingTpl?.targetDurationSeconds || 180) / 60);
        targetCandidates.forEach(cand => {
          const directLink = `${window.location.origin}?code=${encodeURIComponent(cand.id)}`;
          sendAssessmentInviteEmail({
            candidateName: cand.name,
            candidateEmail: cand.email,
            assessmentTitle: typingTpl?.title || (language === 'es' ? 'Prueba de Mecanografía' : 'Typing Speed Assessment'),
            roleApplied: cand.roleApplied,
            accessLink: directLink,
            assessmentCode: cand.id.toUpperCase(),
            timeLimit: typingDurationMin,
            type: 'typing',
            language,
          }).catch(() => {});
        });
        setAssignedSuccess(true);
        setTimeout(() => {
          setAssignedSuccess(false);
          setIsSubmitting(false);
          onClose();
        }, 1600);
      } catch (err) {
        console.error('Error assigning typing test:', err);
        setIsSubmitting(false);
      }
      return;
    }

    if (modality === 'excel') {
      if (!selectedExcelId) {
        alert(language === 'es' ? 'Selecciona una evaluación de Excel.' : 'Please select an Excel assessment.');
        return;
      }
      setIsSubmitting(true);
      try {
        await assignExcelAssessment(selectedCandidateIds, selectedExcelId);

        // Send automated invitation email via Microsoft 365 (web@seu-usa.com)
        const targetCandidates = candidates.filter(c => selectedCandidateIds.includes(c.id));
        const excelObj = excelAssessments.find(a => a.id === selectedExcelId);
        targetCandidates.forEach(cand => {
          const directLink = `${window.location.origin}?code=${encodeURIComponent(cand.id)}`;
          sendAssessmentInviteEmail({
            candidateName: cand.name,
            candidateEmail: cand.email,
            assessmentTitle: excelObj?.title || (language === 'es' ? 'Evaluación Práctica de Excel' : 'Practical Excel Assessment'),
            roleApplied: cand.roleApplied,
            accessLink: directLink,
            assessmentCode: cand.id.toUpperCase(),
            timeLimit: excelObj?.timeLimitMinutes || 30,
            type: 'excel',
            language,
          }).catch(() => {});
        });
        setAssignedSuccess(true);
        setTimeout(() => {
          setAssignedSuccess(false);
          setIsSubmitting(false);
          onClose();
        }, 1600);
      } catch (err) {
        console.error('Error assigning excel task:', err);
        setIsSubmitting(false);
      }
      return;
    }

    // Default 'quiz' modality
    if (configuredBanks.length === 0) {
      alert(t.recruiter.assignModal.atLeastOneBankNeeded);
      return;
    }
    if (hasEmptyBank) {
      alert(t.recruiter.assignModal.noQuestionsSelected);
      return;
    }

    setIsSubmitting(true);
    try {
      await assignCustomSuite(
        selectedCandidateIds,
        configuredBanks.map(b => ({
          quizId: b.quizId,
          selectedQuestionIds: b.selectedQuestionIds,
          durationMinutes: b.durationPreset,
        }))
      );

      // Send automated invitation email via Microsoft 365 (web@seu-usa.com)
      const targetCandidates = candidates.filter(c => selectedCandidateIds.includes(c.id));
      const firstQuiz = quizzes.find(q => q.id === configuredBanks[0]?.quizId);
      targetCandidates.forEach(cand => {
        const directLink = `${window.location.origin}?code=${encodeURIComponent(cand.id)}`;
        sendAssessmentInviteEmail({
          candidateName: cand.name,
          candidateEmail: cand.email,
          assessmentTitle: firstQuiz?.title || (language === 'es' ? 'Evaluación Técnica de Habilidades' : 'Technical Assessment Suite'),
          roleApplied: cand.roleApplied,
          accessLink: directLink,
          assessmentCode: cand.id.toUpperCase(),
          timeLimit: configuredBanks[0]?.durationPreset || 20,
          questionsCount: totalQuestions,
          type: 'quiz',
          language,
        }).catch(() => {});
      });
      setAssignedSuccess(true);
      setTimeout(() => {
        setAssignedSuccess(false);
        setIsSubmitting(false);
        onClose();
      }, 1600);
    } catch (err) {
      console.error('Error assigning suite:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-4 sm:p-6 border border-slate-200 shadow-2xl my-auto max-h-[92vh] flex flex-col">
        {assignedSuccess ? (
          <div className="text-center py-12 space-y-4 my-auto">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h3 className="text-xl font-black text-slate-900">
              {t.recruiter.assignModal.successTitle}
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {modality === 'typing'
                ? t.recruiter.assignModal.typingSuccessDesc.replace(
                    '{count}',
                    String(selectedCandidateIds.length)
                  )
                : modality === 'excel'
                ? t.recruiter.assignModal.excelSuccessDesc.replace(
                    '{count}',
                    String(selectedCandidateIds.length)
                  )
                : t.recruiter.assignModal.successMultiDesc
                    .replace('{banks}', String(configuredBanks.length))
                    .replace('{questions}', String(totalQuestions))
                    .replace('{candidates}', String(selectedCandidateIds.length))}
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-200 shrink-0">
              <div>
                <h2 className="text-base sm:text-xl font-bold text-slate-900">
                  {t.recruiter.assignModal.title}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {t.recruiter.assignModal.subtitle}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto pr-1 py-4 space-y-5 flex-1">
              {/* Nivel 0: Selector Maestro de Modalidad (Assessment Modality Bar) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-[#2368f5]" />
                    <span>{t.recruiter.assignModal.modalityTitle}</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                    {language === 'es'
                      ? 'Selecciona la modalidad para configurar sus parámetros'
                      : 'Select modality to configure custom parameters'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Option 1: Quiz Bank */}
                  <button
                    type="button"
                    onClick={() => handleModalityChange('quiz')}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      modality === 'quiz'
                        ? 'bg-blue-50/90 border-[#2368f5] ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        modality === 'quiz'
                          ? 'bg-[#2368f5] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold truncate ${modality === 'quiz' ? 'text-[#10243e]' : 'text-slate-800'}`}>
                        {t.recruiter.assignModal.modalityQuiz}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {quizzes.length} {language === 'es' ? 'bancos de preguntas' : 'question banks'}
                      </p>
                    </div>
                  </button>

                  {/* Option 2: Typing Speed Test */}
                  <button
                    type="button"
                    onClick={() => handleModalityChange('typing')}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      modality === 'typing'
                        ? 'bg-blue-50/90 border-[#2368f5] ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        modality === 'typing'
                          ? 'bg-[#2368f5] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Keyboard className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold truncate ${modality === 'typing' ? 'text-[#10243e]' : 'text-slate-800'}`}>
                        {t.recruiter.assignModal.modalityTyping}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {typingTemplates.length} {language === 'es' ? 'plantillas configurables' : 'configurable templates'}
                      </p>
                    </div>
                  </button>

                  {/* Option 3: Excel Practical Task */}
                  <button
                    type="button"
                    onClick={() => handleModalityChange('excel')}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      modality === 'excel'
                        ? 'bg-emerald-50/90 border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        modality === 'excel'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-xs font-bold truncate ${modality === 'excel' ? 'text-emerald-950' : 'text-slate-800'}`}>
                        {t.recruiter.assignModal.modalityExcel}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {excelAssessments.length} {language === 'es' ? 'tareas prácticas' : 'practical tasks'}
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Paso 1: Filtro de Demanda y Selección Masiva de Candidatos */}
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#2368f5]" />
                    <span>{t.recruiter.assignModal.step1Label}</span>
                    <span className="ml-1 text-[11px] font-semibold text-slate-500">
                      ({selectedCandidateIds.length} {t.common.selected})
                    </span>
                  </label>
                  <div className="flex gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={selectAllCandidates}
                      className="text-[#2368f5] font-semibold hover:underline cursor-pointer"
                    >
                      {t.common.selectAll}
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={deselectAllCandidates}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {t.common.deselectAll}
                    </button>
                  </div>
                </div>

                {/* Top Demand Filter Bar */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Filter className="w-3.5 h-3.5 text-[#2368f5]" />
                      <span>{t.recruiter.assignModal.filterDemandTitle}</span>
                    </span>
                    <span className="text-[11px] text-slate-500 font-semibold">
                      {t.recruiter.assignModal.candidatesFound.replace(
                        '{count}',
                        String(filteredCandidates.length)
                      )}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        {t.recruiter.assignModal.filterDemandAreaLabel}
                      </label>
                      <CustomSelect
                        value={filterArea}
                        onChange={val => setFilterArea(val)}
                        className="w-full"
                        options={[
                          { value: '', label: t.recruiter.assignModal.allAreasOption },
                          ...candidateAreas.map(area => ({
                            value: area,
                            label: getLocalizedArea(area, language),
                          })),
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        {t.recruiter.assignModal.filterDemandRoleLabel}
                      </label>
                      <CustomSelect
                        value={filterRole}
                        onChange={val => setFilterRole(val)}
                        className="w-full"
                        options={[
                          { value: '', label: t.recruiter.assignModal.allRolesOption },
                          ...candidateRoles.map(role => ({
                            value: role,
                            label: role,
                          })),
                        ]}
                      />
                    </div>
                  </div>
                </div>

                {/* Candidate Selection Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 rounded-2xl border border-slate-200">
                  {filteredCandidates.length === 0 ? (
                    <div className="col-span-full py-4 text-center text-xs text-slate-400 italic">
                      {language === 'es'
                        ? 'No hay candidatos que coincidan con los filtros de demanda seleccionados.'
                        : 'No candidates match the selected demand criteria.'}
                    </div>
                  ) : (
                    filteredCandidates.map(cand => {
                      const isChecked = selectedCandidateIds.includes(cand.id);
                      return (
                        <div
                          key={cand.id}
                          onClick={() => toggleCandidate(cand.id)}
                          className={`p-2 rounded-xl border flex items-center gap-2.5 cursor-pointer text-xs transition-colors ${
                            isChecked
                              ? 'bg-blue-50/70 border-[#2368f5] text-[#10243e] font-semibold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-[#2368f5] shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 shrink-0" />
                          )}
                          <div className="relative shrink-0">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs border ${
                                cand.gender === 'female' ||
                                resolveCandidateGender(cand) === 'female'
                                  ? 'bg-purple-50 border-purple-200 text-purple-700'
                                  : 'bg-blue-50 border-blue-200 text-blue-700'
                              }`}
                            >
                              <span>{getCandidateInitials(cand.name)}</span>
                            </div>
                            <div
                              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center border shadow-2xs ${
                                cand.gender === 'female' ||
                                resolveCandidateGender(cand) === 'female'
                                  ? 'bg-purple-100 text-purple-700 border-purple-300'
                                  : 'bg-blue-100 text-blue-700 border-blue-300'
                              }`}
                            >
                              {cand.gender === 'female' ||
                              resolveCandidateGender(cand) === 'female' ? (
                                <Venus className="w-2.5 h-2.5" />
                              ) : (
                                <Mars className="w-2.5 h-2.5" />
                              )}
                            </div>
                          </div>
                          <div className="truncate">
                            <p className="truncate font-semibold">{cand.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {cand.roleApplied}
                              {cand.area
                                ? ` • ${getLocalizedArea(cand.area, language)}`
                                : ''}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Paso 2: Configuración Dinámica según la Modalidad */}
              {/* Typing Configuration Panel */}
              {modality === 'typing' && (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Keyboard className="w-4 h-4 text-[#2368f5]" />
                      <span>{t.recruiter.assignModal.step2Label}</span>
                    </label>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#2368f5] border border-blue-200">
                      1 {language === 'es' ? 'Minuto Estándar' : 'Minute Benchmark'}
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                        <Keyboard className="w-4 h-4 text-[#2368f5]" />
                        <span>{t.recruiter.assignModal.typingTemplateLabel}</span>
                      </label>
                      <CustomSelect
                        value={selectedTypingId}
                        onChange={val => setSelectedTypingId(val)}
                        className="w-full"
                        options={typingTemplates.map(tmp => ({
                          value: tmp.id,
                          label: `${tmp.title} (${tmp.language.toUpperCase()} • ${tmp.difficulty})`,
                        }))}
                      />
                    </div>

                    {selectedTypingTemplate && (
                      <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">
                            {t.recruiter.assignModal.typingPreviewLabel}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#2368f5] border border-blue-200">
                            {Math.round((selectedTypingTemplate.targetDurationSeconds || 180) / 60)} {language === 'es' ? 'Minutos' : 'Minutes'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed font-mono">
                          "{selectedTypingTemplate.text}"
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span className="font-medium">
                            {selectedTypingTemplate.text.split(/\s+/).length}{' '}
                            {language === 'es' ? 'palabras' : 'words'}
                          </span>
                          <span>•</span>
                          <span className="font-medium">
                            {selectedTypingTemplate.text.length}{' '}
                            {language === 'es' ? 'caracteres' : 'chars'}
                          </span>
                          <span>•</span>
                          <span className="font-medium text-[#2368f5]">
                            {selectedTypingTemplate.language.toUpperCase()}
                          </span>
                        </div>

                        {/* Benchmark Scoring Reference Pills */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                          <div className="p-2 rounded-lg border border-blue-100 bg-blue-50/50 flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 text-[#2368f5] shrink-0" />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 text-[10px]">
                                {language === 'es' ? 'Nivel Inicial' : 'Novice Level'}
                              </p>
                              <p className="text-[10px] text-slate-500">&lt; 30 Net WPM</p>
                            </div>
                          </div>
                          <div className="p-2 rounded-lg border border-amber-100 bg-amber-50/50 flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 text-[10px]">
                                {language === 'es' ? 'Intermedio' : 'Intermediate'}
                              </p>
                              <p className="text-[10px] text-slate-500">30 – 55 Net WPM</p>
                            </div>
                          </div>
                          <div className="p-2 rounded-lg border border-emerald-100 bg-emerald-50/50 flex items-center gap-2">
                            <Award className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 text-[10px]">
                                {language === 'es' ? 'Avanzado' : 'Advanced'}
                              </p>
                              <p className="text-[10px] text-slate-500">&gt; 55 Net WPM</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Excel Practical Configuration Panel */}
              {modality === 'excel' && (
                <div className="space-y-3 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>{t.recruiter.assignModal.step2Label}</span>
                    </label>
                    {selectedExcelAssessment && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {selectedExcelAssessment.timeLimitMinutes} min
                      </span>
                    )}
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                        <span>{t.recruiter.assignModal.excelTaskLabel}</span>
                      </label>
                      <CustomSelect
                        value={selectedExcelId}
                        onChange={val => setSelectedExcelId(val)}
                        className="w-full"
                        options={excelAssessments.map(a => ({
                          value: a.id,
                          label: `${a.title} (${getLocalizedArea(a.departmentArea, language)} • ${a.timeLimitMinutes} min)`,
                        }))}
                      />
                    </div>

                    {selectedExcelAssessment && (
                      <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">
                            {t.recruiter.assignModal.excelInstructionsPreview}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {selectedExcelAssessment.timeLimitMinutes} min
                          </span>
                        </div>
                        <p className="text-xs text-slate-600">{selectedExcelAssessment.description}</p>
                        <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                          {(typeof selectedExcelAssessment.instructions === 'string'
                            ? selectedExcelAssessment.instructions.split('\n')
                            : Array.isArray(selectedExcelAssessment.instructions)
                            ? (selectedExcelAssessment.instructions as string[])
                            : []
                          )
                            .map(i => i.trim())
                            .filter(Boolean)
                            .map((inst, idx) => (
                              <p key={idx} className="flex items-start gap-1.5">
                                <span className="font-bold shrink-0">{idx + 1}.</span>
                                <span className="leading-relaxed">{inst}</span>
                              </p>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                          <FileSpreadsheet className="w-4 h-4 shrink-0 text-emerald-600" />
                          <span className="text-slate-500 font-normal">
                            {t.recruiter.assignModal.excelTemplateFile}:
                          </span>
                          <span className="font-mono truncate">{selectedExcelAssessment.templateFileName}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Multi-Bank Assessment Suite Builder (Quiz Modality only) */}
              {modality === 'quiz' && (
                <>
                  <div className="space-y-3 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#2368f5]" />
                    <span>{t.recruiter.assignModal.step2Label}</span>
                  </label>
                  {isSingleCandidate && singleCandidate?.area && (
                    <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                      <Briefcase className="w-3.5 h-3.5 text-[#2368f5]" />
                      <span>
                        {t.recruiter.assignModal.candidateAreaBadge}:{' '}
                        <strong>{getLocalizedArea(singleCandidate.area, language)}</strong>
                      </span>
                    </span>
                  )}
                </div>

                {/* Cascading Branch & Bank Selector Bar with Add Button */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                    {/* Level 1: Branch / Discipline Dropdown */}
                    <div className="sm:col-span-5">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-[#2368f5]" />
                        <span>{t.recruiter.assignModal.step2BranchLabel}</span>
                      </label>
                      <CustomSelect
                        value={selectedBranch}
                        onChange={val => handleBranchChange(val)}
                        className="w-full"
                        options={[
                          {
                            value: '',
                            label: `${t.recruiter.assignModal.allBranchesOption} (${quizzes.length})`,
                          },
                          ...availableBranches.map(branch => {
                            const count = quizzes.filter(
                              q => q.category.toLowerCase().trim() === branch.toLowerCase().trim()
                            ).length;
                            const isCandidateDept = candidateAssociatedAreas.some(
                              a => a.toLowerCase().trim() === branch.toLowerCase().trim()
                            );
                            return {
                              value: branch,
                              label: `${getLocalizedArea(branch, language)} (${count})`,
                              badge: isCandidateDept ? (language === 'es' ? 'Sugerido' : 'Suggested') : undefined,
                            };
                          }),
                        ]}
                      />
                    </div>

                    {/* Level 2: Question Banks in that Branch */}
                    <div className="sm:col-span-4">
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-[#2368f5]" />
                        <span>{t.recruiter.assignModal.step2BankLabel}</span>
                      </label>
                      <CustomSelect
                        value={selectedQuizId}
                        onChange={val => setSelectedQuizId(val)}
                        disabled={branchQuizzes.length === 0}
                        placeholder={t.recruiter.assignModal.selectBankPlaceholder}
                        className="w-full"
                        options={branchQuizzes.map(q => ({
                          value: q.id,
                          label: `${getLocalizedArea(q.title, language)} (${q.questions.length} ${t.recruiter.assignModal.questionsInBank})`,
                        }))}
                      />
                    </div>

                    {/* Action Button: Add Bank to Suite */}
                    <div className="sm:col-span-3">
                      <button
                        type="button"
                        onClick={handleAddBankToSuite}
                        disabled={!selectedQuizId}
                        className="w-full py-2.5 px-3 min-h-[40px] rounded-xl bg-[#2368f5] hover:bg-[#144cc0] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <PlusCircle className="w-4 h-4 shrink-0" />
                        <span className="truncate">{t.recruiter.assignModal.addBankToSuiteBtn}</span>
                      </button>
                    </div>
                  </div>

                  {/* Warning / duplicate message */}
                  {suiteWarning && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                      <Info className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{suiteWarning}</span>
                    </div>
                  )}

                  {/* Dropdown Quiz Preview Metadata */}
                  {previewDropdownQuiz && (
                    <div className="flex items-center gap-2 flex-wrap pt-1 text-[11px]">
                      {previewDropdownQuiz.difficulty === 1 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <Shield className="w-3 h-3 text-emerald-600" />
                          <span>{t.recruiter.createQuizModal.diffLevel1}</span>
                        </span>
                      ) : previewDropdownQuiz.difficulty === 3 ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200">
                          <Award className="w-3 h-3 text-purple-600" />
                          <span>{t.recruiter.createQuizModal.diffLevel3}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-[#2368f5] border border-blue-200">
                          <Zap className="w-3 h-3 text-[#2368f5]" />
                          <span>{t.recruiter.createQuizModal.diffLevel2}</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{previewDropdownQuiz.timeLimitMinutes || 60}m standard</span>
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                        <Layers className="w-3 h-3 text-slate-400" />
                        <span>{getLocalizedArea(previewDropdownQuiz.category, language)}</span>
                      </span>
                    </div>
                  )}
                </div>

                {/* Configured Assessment Suite Display Tray */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#2368f5]" />
                      <span>
                        {t.recruiter.assignModal.configuredSuiteTitle.replace(
                          '{count}',
                          String(configuredBanks.length)
                        )}
                      </span>
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {t.recruiter.assignModal.totalBanksCount.replace(
                        '{count}',
                        String(configuredBanks.length)
                      )}{' '}
                      •{' '}
                      {t.recruiter.assignModal.totalQuestionsCount.replace(
                        '{count}',
                        String(totalQuestions)
                      )}
                    </span>
                  </div>

                  {configuredBanks.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center text-xs text-slate-500">
                      <Info className="w-4 h-4 text-slate-400 mx-auto mb-1" />
                      <span>{t.recruiter.assignModal.atLeastOneBankNeeded}</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {configuredBanks.map((b, idx) => {
                        const q = quizzes.find(item => item.id === b.quizId);
                        const isActive = idx === activeBankIndex;
                        return (
                          <div
                            key={`${b.quizId}-${idx}`}
                            onClick={() => setActiveBankIndex(idx)}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                              isActive
                                ? 'bg-blue-50/70 border-[#2368f5] ring-2 ring-blue-500/20 shadow-xs'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span
                                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                                      isActive
                                        ? 'bg-[#2368f5] text-white'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    #{idx + 1}
                                  </span>
                                  {q?.category && (
                                    <span className="text-[10px] font-semibold text-slate-500 truncate flex items-center gap-1">
                                      <Layers className="w-2.5 h-2.5 text-slate-400" />
                                      <span>{getLocalizedArea(q.category, language)}</span>
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-xs font-bold text-slate-900 truncate">
                                  {q?.title || b.quizId}
                                </h4>
                              </div>

                              <button
                                type="button"
                                onClick={e => handleRemoveBank(idx, e)}
                                title={t.recruiter.assignModal.removeBankTooltip}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0 min-w-[28px] min-h-[28px] flex items-center justify-center"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 mt-2 border-t border-slate-200/60 text-[11px]">
                              {/* Difficulty Badge */}
                              {q?.difficulty === 1 ? (
                                <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                                  <Shield className="w-3 h-3 text-emerald-600" />
                                  <span>Level 1</span>
                                </span>
                              ) : q?.difficulty === 3 ? (
                                <span className="text-[10px] font-semibold text-purple-700 flex items-center gap-1">
                                  <Award className="w-3 h-3 text-purple-600" />
                                  <span>Level 3</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-blue-700 flex items-center gap-1">
                                  <Zap className="w-3 h-3 text-[#2368f5]" />
                                  <span>Level 2</span>
                                </span>
                              )}

                              {/* Time & Question Pill */}
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 flex items-center gap-1 shadow-2xs">
                                <Clock className="w-2.5 h-2.5 text-slate-400" />
                                <span>{b.durationPreset}m</span>
                                <span>•</span>
                                <span className="text-[#2368f5]">
                                  {b.selectedQuestionIds.length} Qs
                                </span>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: Module Question Customizer (Duration & Question Picker for Active Bank) */}
              {configuredBanks.length > 0 && activeBank && activeQuiz && (
                <div className="space-y-3 pt-3 border-t border-slate-200">
                  {/* Module Segmented Tab Switcher */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-[#2368f5]" />
                        <span>{t.recruiter.assignModal.step3Label}</span>
                      </label>
                      <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                        <span>{t.recruiter.assignModal.activeBankTab}</span>
                        <strong className="text-slate-900">{activeQuiz.title}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 max-w-full scroll-smooth scrollbar-thin">
                      {configuredBanks.map((b, idx) => {
                        const q = quizzes.find(item => item.id === b.quizId);
                        const isActive = idx === activeBankIndex;
                        return (
                          <button
                            key={`tab-${b.quizId}-${idx}`}
                            type="button"
                            onClick={() => setActiveBankIndex(idx)}
                            className={`text-xs font-bold px-3 py-1.5 min-h-[34px] rounded-xl border whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                              isActive
                                ? 'bg-[#2368f5] text-white border-[#2368f5] shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>
                              {q?.title
                                ? q.title.length > 20
                                  ? `${q.title.slice(0, 20)}...`
                                  : q.title
                                : `Bank ${idx + 1}`}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {b.selectedQuestionIds.length} Qs
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Duration Presets for Active Bank */}
                  <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#2368f5]" />
                        <span>{t.recruiter.assignModal.stepDurationTitle}</span>
                      </label>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {activeBank.durationPreset} min limit
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleDurationPresetChange(5)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          activeBank.durationPreset === 5
                            ? 'bg-blue-50 border-[#2368f5] text-[#2368f5] ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{t.recruiter.assignModal.preset5Min}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDurationPresetChange(15)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          activeBank.durationPreset === 15
                            ? 'bg-blue-50 border-[#2368f5] text-[#2368f5] ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{t.recruiter.assignModal.preset15Min}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDurationPresetChange(30)}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                          activeBank.durationPreset === 30
                            ? 'bg-blue-50 border-[#2368f5] text-[#2368f5] ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{t.recruiter.assignModal.preset30Min}</span>
                      </button>
                    </div>

                    {/* Trim Notification */}
                    {trimNotice && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                        <Info className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{trimNotice}</span>
                      </div>
                    )}

                    {/* Cap Reached Alert */}
                    {isCapReached && activeMaxAllowed !== Infinity && (
                      <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                        <Info className="w-4 h-4 text-[#2368f5] shrink-0" />
                        <span>
                          {t.recruiter.assignModal.capReachedNotice
                            .replace('{minutes}', String(activeBank.durationPreset))
                            .replace('{max}', String(activeMaxAllowed))}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Manual Question Picker Header & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                    <div className="text-[11px] font-bold text-[#2368f5] flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>
                        {activeBank.selectedQuestionIds.length} /{' '}
                        {activeMaxAllowed === Infinity
                          ? activeQuiz.questions.length
                          : `${activeMaxAllowed} max`}{' '}
                        {t.recruiter.assignModal.selectedCounter}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={selectAllQuestions}
                        className="text-[11px] font-bold text-[#2368f5] hover:underline cursor-pointer"
                      >
                        {t.common.selectAll}
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={deselectAllQuestions}
                        className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {t.common.deselectAll}
                      </button>
                    </div>
                  </div>

                  {/* Search filter in question bank */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder={t.recruiter.assignModal.searchQuestionsPlaceholder}
                      value={questionSearch}
                      onChange={e => setQuestionSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-[#2368f5]"
                    />
                  </div>

                  {/* Question Checklist */}
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {filteredQuestions.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">
                        {t.recruiter.assignModal.noQuestionsMatch}
                      </p>
                    ) : (
                      filteredQuestions.map((q, idx) => {
                        const isChecked = activeBank.selectedQuestionIds.includes(q.id);
                        const isDisabled = !isChecked && isCapReached;

                        return (
                          <div
                            key={q.id}
                            onClick={() => {
                              if (!isDisabled) toggleQuestion(q.id);
                            }}
                            className={`p-3 rounded-xl border flex items-start gap-3 text-xs transition-all ${
                              isChecked
                                ? 'bg-blue-50/50 border-[#2368f5] text-[#10243e] font-medium shadow-2xs cursor-pointer'
                                : isDisabled
                                ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed'
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 cursor-pointer'
                            }`}
                          >
                            <div className="pt-0.5 shrink-0">
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-[#2368f5]" />
                              ) : (
                                <Square
                                  className={`w-4 h-4 ${
                                    isDisabled ? 'text-slate-200' : 'text-slate-300'
                                  }`}
                                />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-slate-900">
                                  #{idx + 1}
                                </span>
                                {q.categoryTag && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-slate-100 text-slate-700">
                                    {getLocalizedArea(q.categoryTag, language)}
                                  </span>
                                )}
                                <span className="text-[10px] text-slate-400">
                                  ({q.options.length}{' '}
                                  {t.recruiter.assignModal.optionsLabel})
                                </span>
                              </div>
                              <p className="line-clamp-2 leading-relaxed">{q.text}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </>
          )}

              {/* Bottom Actions */}
              <div className="flex flex-col-reverse sm:flex-row gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:flex-1 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  disabled={
                    selectedCandidateIds.length === 0 ||
                    isSubmitting ||
                    (modality === 'quiz' &&
                      (configuredBanks.length === 0 || hasEmptyBank || totalQuestions === 0)) ||
                    (modality === 'typing' && !selectedTypingId) ||
                    (modality === 'excel' && !selectedExcelId)
                  }
                  className="w-full sm:flex-2 py-3 sm:py-2.5 px-4 text-xs font-bold bg-[#2368f5] text-white rounded-xl hover:bg-[#144cc0] disabled:opacity-40 transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <SendHorizontal className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">
                    {isSubmitting
                      ? t.common.loading
                      : modality === 'typing'
                      ? t.recruiter.assignModal.typingAssignBtn.replace(
                          '{candidates}',
                          String(selectedCandidateIds.length)
                        )
                      : modality === 'excel'
                      ? t.recruiter.assignModal.excelAssignBtn.replace(
                          '{candidates}',
                          String(selectedCandidateIds.length)
                        )
                      : t.recruiter.assignModal.confirmMultiBtn
                          .replace('{banks}', String(configuredBanks.length))
                          .replace('{questions}', String(totalQuestions))
                          .replace('{candidates}', String(selectedCandidateIds.length))}
                  </span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
