import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import type { AssessmentAssignment, Quiz, Candidate, TypingAssignment, ExcelSubmission } from '../../types';
import { QuizBuilderModal } from './QuizBuilderModal';
import { CandidateModal } from './CandidateModal';
import { AssignQuizModal } from './AssignQuizModal';
import { ResultsAuditModal } from './ResultsAuditModal';
import { CandidateProfileModal } from './CandidateProfileModal';
import { TypingTemplateModal } from './TypingTemplateModal';
import { ExcelBuilderModal } from './ExcelBuilderModal';
import { ExcelReviewModal } from './ExcelReviewModal';
import { CustomSelect } from '../common/CustomSelect';
import { ModernDateRangePicker } from '../common/ModernDateRangePicker';
import {
  Users,
  CheckCircle2,
  TrendingUp,
  Award,
  Shield,
  Zap,
  PlusCircle,
  Search,
  BookOpen,
  SendHorizontal,
  Clock,
  Eye,
  Trash2,
  Edit3,
  Copy,
  ChevronLeft,
  ChevronRight,
  Filter,
  RotateCcw,
  Briefcase,
  Mars,
  Venus,
  ArrowUpRight,
  Keyboard,
  FileSpreadsheet,
  Check,
  X,
  Mail,
  Loader2,
} from 'lucide-react';

import { sendAssessmentInviteEmail } from '../../services/emailService';

import { getLocalizedArea } from '../../utils/areaLocalization';
import { resolveCandidateGender, getCandidateInitials } from '../../utils/genderHelper';

export const RecruiterDashboard: React.FC = () => {
  const {
    candidates,
    quizzes,
    assignments,
    typingAssignments,
    typingTemplates,
    excelAssessments,
    excelSubmissions,
    deleteQuiz,
    deleteCandidate,
    updateAssignmentReviewStatus,
    t,
    language,
  } = useApp();

  // Active view tab
  const [activeTab, setActiveTab] = useState<'pipeline' | 'quizzes' | 'candidates' | 'typing' | 'excel'>('pipeline');

  // Modals state
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [candidateToEdit, setCandidateToEdit] = useState<Candidate | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedAuditAssignment, setSelectedAuditAssignment] = useState<AssessmentAssignment | null>(null);
  const [selectedProfileCandidate, setSelectedProfileCandidate] = useState<Candidate | null>(null);
  const [isTypingModalOpen, setIsTypingModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [selectedExcelSubmission, setSelectedExcelSubmission] = useState<ExcelSubmission | null>(null);
  const [selectedTypingCertificate, setSelectedTypingCertificate] = useState<TypingAssignment | null>(null);

  // Typing filters & pagination
  const [typingSearch, setTypingSearch] = useState('');
  const [typingLevelFilter, setTypingLevelFilter] = useState<'all' | 'basic' | 'intermediate' | 'advanced'>('all');
  const [typingPageSize, setTypingPageSize] = useState<number>(10);
  const [typingCurrentPage, setTypingCurrentPage] = useState<number>(1);

  // Excel filters & pagination
  const [excelSearch, setExcelSearch] = useState('');
  const [excelStatusFilter, setExcelStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [excelPageSize, setExcelPageSize] = useState<number>(10);
  const [excelCurrentPage, setExcelCurrentPage] = useState<number>(1);

  // Filters state for pipeline
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'not_completed' | 'stand_by' | 'approved' | 'rejected'>('all');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'top' | 'passing' | 'low'>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination state for pipeline (5, 10 default, 15, 20, 50)
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filter & Pagination state for candidates directory (5, 10 default, 15, 20, 50)
  const [candSearchQuery, setCandSearchQuery] = useState('');
  const [candAreaFilter, setCandAreaFilter] = useState('all');
  const [candPageSize, setCandPageSize] = useState<number>(10);
  const [candCurrentPage, setCandCurrentPage] = useState<number>(1);

  // Filter & Pagination state for question banks (5, 10 default, 15, 20, 50)
  const [quizSearchQuery, setQuizSearchQuery] = useState('');
  const [quizCategoryFilter, setQuizCategoryFilter] = useState('all');
  const [quizPageSize, setQuizPageSize] = useState<number>(10);
  const [currentQuizPage, setCurrentQuizPage] = useState<number>(1);
  const [assigningQuizId, setAssigningQuizId] = useState<string | undefined>(undefined);
  const [expandedQuizIds, setExpandedQuizIds] = useState<Record<string, boolean>>({});

  const toggleQuizExpanded = (quizId: string) => {
    setExpandedQuizIds(prev => ({ ...prev, [quizId]: !prev[quizId] }));
  };

  const [sendingEmailKey, setSendingEmailKey] = useState<string | null>(null);

  const handleSendInviteEmail = async (params: {
    candidateName: string;
    candidateEmail: string;
    assessmentTitle: string;
    roleApplied?: string;
    link: string;
    assessmentCode?: string;
    timeLimit?: number;
    questionsCount?: number;
    type?: 'quiz' | 'typing' | 'excel';
    uniqueKey: string;
  }) => {
    setSendingEmailKey(params.uniqueKey);
    try {
      const res = await sendAssessmentInviteEmail({
        candidateName: params.candidateName,
        candidateEmail: params.candidateEmail,
        assessmentTitle: params.assessmentTitle,
        roleApplied: params.roleApplied,
        accessLink: params.link,
        assessmentCode: params.assessmentCode,
        temporaryPassword: candidates.find(cand => cand.email.toLowerCase() === params.candidateEmail.toLowerCase())?.temporaryPassword || 'SEU-temp-101',
        timeLimit: params.timeLimit,
        questionsCount: params.questionsCount,
        type: params.type || 'quiz',
        language,
      });

      if (res.success) {
        alert(
          t.recruiter.pipeline.emailSentSuccess.replace('{email}', params.candidateEmail)
        );
      } else {
        const detailMsg = res.details ? ` - ${res.details}` : '';
        alert(
          t.recruiter.pipeline.emailSentError.replace('{error}', (res.error || 'Unknown error') + detailMsg)
        );
      }
    } catch (err: any) {
      alert(t.recruiter.pipeline.emailSentError.replace('{error}', err?.message || 'Network error'));
    } finally {
      setSendingEmailKey(null);
    }
  };


  // Metrics calculation
  const totalCandidatesCount = candidates.length;
  const completedAssignments = assignments.filter(a => a.status === 'completed');
  const completedCount = completedAssignments.length;

  const totalScore = completedAssignments.reduce((acc, a) => acc + (a.score ?? 0), 0);
  const avgScore = completedCount > 0 ? Math.round(totalScore / completedCount) : 0;

  const qualifiedCount = completedAssignments.filter(a => (a.score ?? 0) >= 75).length;
  const qualifiedRate = completedCount > 0 ? Math.round((qualifiedCount / completedCount) * 100) : 0;

  // Filtered pipeline list
  const filteredPipeline = assignments.filter(a => {
    // Review / Completion Status Filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'not_completed') {
        if (a.status === 'completed') return false;
      } else {
        if (a.status !== 'completed') return false;
        const effectiveStatus = a.reviewStatus || ((a.score ?? 0) >= 50 ? 'stand_by' : 'rejected');
        if (effectiveStatus !== statusFilter) return false;
      }
    }

    // Score Filter
    if (scoreFilter !== 'all') {
      if (a.status !== 'completed') return false;
      const score = a.score ?? 0;
      if (scoreFilter === 'top' && score < 75) return false;
      if (scoreFilter === 'passing' && (score < 50 || score >= 75)) return false;
      if (scoreFilter === 'low' && score >= 50) return false;
    }

    // Date Range Filter
    if (dateFrom) {
      const itemDate = (a.completedAt || a.assignedAt || '').substring(0, 10);
      if (itemDate && itemDate < dateFrom) return false;
    }
    if (dateTo) {
      const itemDate = (a.completedAt || a.assignedAt || '').substring(0, 10);
      if (itemDate && itemDate > dateTo) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = a.candidateName.toLowerCase().includes(q);
      const matchRole = a.roleApplied.toLowerCase().includes(q);
      const matchQuiz = a.quizTitle.toLowerCase().includes(q);
      if (!matchName && !matchRole && !matchQuiz) return false;
    }

    return true;
  });

  const hasActiveFilters =
    searchQuery !== '' ||
    statusFilter !== 'all' ||
    scoreFilter !== 'all' ||
    dateFrom !== '' ||
    dateTo !== '';

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setScoreFilter('all');
    setDateFrom('');
    setDateTo('');
    setCurrentPage(1);
  };

  // Pipeline Pagination Calculations
  const totalPipelineItems = filteredPipeline.length;
  const totalPipelinePages = Math.max(1, Math.ceil(totalPipelineItems / pageSize));
  const currentPipelinePage = Math.min(currentPage, totalPipelinePages);
  const pipelineStartIndex = (currentPipelinePage - 1) * pageSize;
  const paginatedPipeline = filteredPipeline.slice(pipelineStartIndex, pipelineStartIndex + pageSize);

  // Filtered Candidates Directory
  const filteredCandidates = candidates.filter(c => {
    if (candAreaFilter !== 'all' && c.area !== candAreaFilter) {
      return false;
    }
    if (candSearchQuery.trim()) {
      const q = candSearchQuery.toLowerCase().trim();
      const matchName = (c.name || '').toLowerCase().includes(q);
      const matchEmail = (c.email || '').toLowerCase().includes(q);
      const matchRole = (c.roleApplied || '').toLowerCase().includes(q);
      const matchArea = (c.area || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchRole && !matchArea) return false;
    }
    return true;
  });

  // Candidates Directory Pagination Calculations
  const totalCandItems = filteredCandidates.length;
  const totalCandPages = Math.max(1, Math.ceil(totalCandItems / candPageSize));
  const currentCandPage = Math.min(candCurrentPage, totalCandPages);
  const candStartIndex = (currentCandPage - 1) * candPageSize;
  const paginatedCandidates = filteredCandidates.slice(candStartIndex, candStartIndex + candPageSize);

  // Unique areas for candidate filter dropdown
  const uniqueCandidateAreas = Array.from(
    new Set(candidates.map(c => c.area).filter(Boolean))
  ) as string[];

  // Filtered Question Banks
  const filteredQuizzes = quizzes.filter(q => {
    if (quizCategoryFilter !== 'all' && q.category !== quizCategoryFilter) {
      return false;
    }
    if (quizSearchQuery.trim()) {
      const term = quizSearchQuery.toLowerCase().trim();
      const matchTitle = (q.title || '').toLowerCase().includes(term);
      const matchCat = (q.category || '').toLowerCase().includes(term);
      const matchDesc = (q.description || '').toLowerCase().includes(term);
      const matchClass = (q.supportedClassifications || []).some(c =>
        c.toLowerCase().includes(term)
      );
      if (!matchTitle && !matchCat && !matchDesc && !matchClass) return false;
    }
    return true;
  });

  // Question Banks Pagination Calculations
  const totalQuizItems = filteredQuizzes.length;
  const totalQuizPages = Math.max(1, Math.ceil(totalQuizItems / quizPageSize));
  const validQuizCurrentPage = Math.min(currentQuizPage, totalQuizPages);
  const quizStartIndex = (validQuizCurrentPage - 1) * quizPageSize;
  const paginatedQuizzes = filteredQuizzes.slice(quizStartIndex, quizStartIndex + quizPageSize);

  // Unique categories for quiz filter dropdown
  const uniqueQuizCategories = Array.from(new Set(quizzes.map(q => q.category))).filter(Boolean);

  // Typing Module Metrics & Pagination
  const completedTyping = typingAssignments.filter(t => t.status === 'completed');
  const typingCompletedCount = completedTyping.length;
  const avgNetWpm =
    typingCompletedCount > 0
      ? Math.round(
          completedTyping.reduce((acc, t) => acc + (t.netWpm || 0), 0) / typingCompletedCount
        )
      : 0;
  const avgAccuracy =
    typingCompletedCount > 0
      ? Math.round(
          completedTyping.reduce((acc, t) => acc + (t.accuracy || 0), 0) / typingCompletedCount
        )
      : 0;

  const filteredTyping = typingAssignments.filter(t => {
    if (typingLevelFilter !== 'all' && t.level !== typingLevelFilter) return false;
    if (typingSearch.trim()) {
      const q = typingSearch.toLowerCase().trim();
      const matchName = t.candidateName.toLowerCase().includes(q);
      const matchEmail = (t.candidateEmail || '').toLowerCase().includes(q);
      const matchTemplate = t.templateTitle.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchTemplate) return false;
    }
    return true;
  });

  const totalTypingItems = filteredTyping.length;
  const totalTypingPages = Math.max(1, Math.ceil(totalTypingItems / typingPageSize));
  const validTypingPage = Math.min(typingCurrentPage, totalTypingPages);
  const typingStartIndex = (validTypingPage - 1) * typingPageSize;
  const paginatedTyping = filteredTyping.slice(typingStartIndex, typingStartIndex + typingPageSize);

  // Excel Module Metrics & Pagination
  const totalExcelSubmissions = excelSubmissions.length;
  const pendingExcelCount = excelSubmissions.filter(s => s.reviewStatus === 'pending').length;
  const approvedExcelCount = excelSubmissions.filter(s => s.reviewStatus === 'approved').length;

  const filteredExcel = excelSubmissions.filter(s => {
    if (excelStatusFilter !== 'all' && s.reviewStatus !== excelStatusFilter) return false;
    if (excelSearch.trim()) {
      const q = excelSearch.toLowerCase().trim();
      const matchName = s.candidateName.toLowerCase().includes(q);
      const matchEmail = (s.candidateEmail || '').toLowerCase().includes(q);
      const matchTitle = (s.assessmentTitle || '').toLowerCase().includes(q);
      const matchFile = (s.submittedFileName || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchTitle && !matchFile) return false;
    }
    return true;
  });

  const totalExcelItems = filteredExcel.length;
  const totalExcelPages = Math.max(1, Math.ceil(totalExcelItems / excelPageSize));
  const validExcelPage = Math.min(excelCurrentPage, totalExcelPages);
  const excelStartIndex = (validExcelPage - 1) * excelPageSize;
  const paginatedExcel = filteredExcel.slice(excelStartIndex, excelStartIndex + excelPageSize);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t.recruiter.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {t.recruiter.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setEditingQuiz(null);
              setIsQuizModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 text-[#2368f5] text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{t.recruiter.quizzes.newQuizBtn}</span>
          </button>

          <button
            onClick={() => {
              setCandidateToEdit(null);
              setIsCandidateModalOpen(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 text-[#10243e] text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t.recruiter.candidates.newCandidateBtn}</span>
          </button>

          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#2368f5] text-white text-xs font-bold hover:bg-[#144cc0] transition-colors shadow-xs cursor-pointer"
          >
            <SendHorizontal className="w-3.5 h-3.5" />
            <span>{t.recruiter.candidates.assignQuizBtn}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Candidates */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t.recruiter.metrics.totalCandidates}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2368f5] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#10243e]">{totalCandidatesCount}</span>
            <span className="text-xs text-slate-400">in pool</span>
          </div>
        </div>

        {/* Completed Tests */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t.recruiter.metrics.completedTests}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{completedCount}</span>
            <span className="text-xs text-slate-400">graded</span>
          </div>
        </div>

        {/* Average Score */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t.recruiter.metrics.avgScore}
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900">{avgScore}%</span>
            <span className="text-xs text-slate-400">across tests</span>
          </div>
        </div>

        {/* Qualified Rate */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {t.recruiter.metrics.qualifiedRate}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600">{qualifiedRate}%</span>
            <span className="text-[11px] text-slate-400 font-medium">{t.recruiter.metrics.passingThreshold}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'pipeline'
              ? 'bg-[#2368f5] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{t.recruiter.tabs.pipeline} ({assignments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('quizzes')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'quizzes'
              ? 'bg-[#2368f5] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>{t.recruiter.tabs.quizzes} ({quizzes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('candidates')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'candidates'
              ? 'bg-[#2368f5] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{t.recruiter.tabs.candidates} ({candidates.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('typing')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'typing'
              ? 'bg-[#2368f5] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Keyboard className="w-3.5 h-3.5" />
          <span>{t.recruiter.tabs.typing} ({typingAssignments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('excel')}
          className={`flex items-center gap-2 px-3.5 sm:px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0 ${
            activeTab === 'excel'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>{t.recruiter.tabs.excel} ({excelSubmissions.length})</span>
        </button>
      </div>

      {/* Tab 1: Pipeline & Scores Table */}
      {activeTab === 'pipeline' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Advanced Filter Toolbar */}
          <div className="p-4 sm:p-5 border-b border-slate-200 space-y-3 bg-slate-50/50">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={t.recruiter.pipeline.searchPlaceholder}
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#2368f5]"
                />
              </div>

              {/* Status and Score Selectors */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Filter */}
                <CustomSelect
                  value={statusFilter}
                  onChange={val => {
                    setStatusFilter(val as any);
                    setCurrentPage(1);
                  }}
                  icon={<Filter className="w-3.5 h-3.5 text-slate-400" />}
                  searchable={false}
                  options={[
                    { value: 'all', label: t.recruiter.pipeline.filterStatusAll },
                    { value: 'not_completed', label: t.recruiter.pipeline.filterStatusNotCompleted },
                    { value: 'stand_by', label: t.recruiter.pipeline.filterStatusStandBy },
                    { value: 'approved', label: t.recruiter.pipeline.filterStatusApproved },
                    { value: 'rejected', label: t.recruiter.pipeline.filterStatusRejected },
                  ]}
                />

                {/* Score Filter */}
                <CustomSelect
                  value={scoreFilter}
                  onChange={val => {
                    setScoreFilter(val as any);
                    setCurrentPage(1);
                  }}
                  searchable={false}
                  options={[
                    { value: 'all', label: t.recruiter.pipeline.filterScoreAll },
                    { value: 'top', label: t.recruiter.pipeline.filterScoreTop },
                    { value: 'passing', label: t.recruiter.pipeline.filterScorePassing },
                    { value: 'low', label: t.recruiter.pipeline.filterScoreLow },
                  ]}
                />

                {/* Modern Floating Date Range Picker */}
                <ModernDateRangePicker
                  startDate={dateFrom}
                  endDate={dateTo}
                  onChange={(start, end) => {
                    setDateFrom(start);
                    setDateTo(end);
                    setCurrentPage(1);
                  }}
                  language={language}
                  placeholder={language === 'es' ? 'Filtrar por fecha' : 'Filter by date'}
                  align="right"
                />

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-1 px-2.5 py-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors cursor-pointer"
                    title={t.recruiter.pipeline.clearFilters}
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{t.recruiter.pipeline.clearFilters}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[750px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <th className="p-4">{t.recruiter.pipeline.colCandidate}</th>
                  <th className="p-4">{t.recruiter.pipeline.colQuiz}</th>
                  <th className="p-4">{t.recruiter.pipeline.colStage}</th>
                  <th className="p-4 text-center">{t.recruiter.pipeline.colScore}</th>
                  <th className="p-4 text-center">{t.recruiter.pipeline.colHits}</th>
                  <th className="p-4 text-right">{t.recruiter.pipeline.colAudit}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedPipeline.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-slate-400">
                      {t.recruiter.pipeline.empty}
                    </td>
                  </tr>
                ) : (
                  paginatedPipeline.map((item, idx) => {
                    const effectiveStatus = item.reviewStatus || ((item.score ?? 0) >= 50 ? 'stand_by' : 'rejected');

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* 1. Candidate Column: Clickable to open Profile Card */}
                        <td className="p-4">
                          {(() => {
                            const found = candidates.find(
                              c => c.id === item.candidateId || c.email === item.candidateEmail
                            );
                            const candGender = resolveCandidateGender(found || { name: item.candidateName });
                            const isFemale = candGender === 'female';
                            const initial = getCandidateInitials(item.candidateName);

                            return (
                              <div className="flex items-center gap-3">
                                <div className="relative shrink-0">
                                  <div
                                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs border ${
                                      isFemale
                                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                                        : 'bg-blue-50 text-blue-700 border-blue-200'
                                    }`}
                                  >
                                    <span>{initial}</span>
                                  </div>
                                  <div
                                    className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border shadow-2xs ${
                                      isFemale
                                        ? 'bg-purple-100 text-purple-700 border-purple-300'
                                        : 'bg-blue-100 text-blue-700 border-blue-300'
                                    }`}
                                    title={isFemale ? (language === 'es' ? 'Femenino' : 'Female') : (language === 'es' ? 'Masculino' : 'Male')}
                                  >
                                    {isFemale ? <Venus className="w-2.5 h-2.5" /> : <Mars className="w-2.5 h-2.5" />}
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (found) {
                                      setSelectedProfileCandidate(found);
                                    } else {
                                      setSelectedProfileCandidate({
                                        id: item.candidateId,
                                        name: item.candidateName,
                                        email: item.candidateEmail,
                                        roleApplied: item.roleApplied,
                                        avatar: isFemale ? 'gender:female' : 'gender:male',
                                        gender: isFemale ? 'female' : 'male',
                                        registeredAt: item.assignedAt,
                                      });
                                    }
                                  }}
                                  className="text-left group cursor-pointer block truncate"
                                  title={t.recruiter.pipeline.viewCandidateProfile}
                                >
                                  <p className="font-bold text-slate-900 group-hover:text-[#2368f5] group-hover:underline flex items-center gap-1 transition-colors">
                                    <span>{item.candidateName}</span>
                                    <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-[#2368f5]" />
                                  </p>
                                  <p className="text-[11px] text-slate-500 truncate max-w-[190px]">{item.roleApplied}</p>
                                </button>
                              </div>
                            );
                          })()}
                        </td>

                        {/* 2. Quiz Column with Difficulty Badge & Date */}
                        <td className="p-4">
                          <p className="font-semibold text-slate-900 max-w-xs truncate">
                            {getLocalizedArea(item.quizTitle, language)}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {(() => {
                              const foundQuiz = quizzes.find(q => q.id === item.quizId);
                              const diff = item.difficulty || foundQuiz?.difficulty || 2;
                              if (diff === 1) {
                                return (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                                    <Shield className="w-3 h-3 text-emerald-600" />
                                    <span>{language === 'es' ? 'Fundamental' : 'Fundamental'}</span>
                                  </span>
                                );
                              }
                              if (diff === 3) {
                                return (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200">
                                    <Award className="w-3 h-3 text-purple-600" />
                                    <span>{language === 'es' ? 'Avanzado' : 'Advanced'}</span>
                                  </span>
                                );
                              }
                              return (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-[#2368f5] border border-blue-200">
                                  <Zap className="w-3 h-3 text-[#2368f5]" />
                                  <span>{language === 'es' ? 'Intermedio' : 'Intermediate'}</span>
                                </span>
                              );
                            })()}
                            <span className="text-[11px] text-slate-400">{item.assignedAt}</span>
                          </div>
                        </td>

                        {/* 3. Testing Stage / Status Column */}
                        <td className="p-4">
                          {item.status === 'completed' ? (
                            <CustomSelect
                              value={effectiveStatus}
                              onChange={val => {
                                updateAssignmentReviewStatus(item.id, val as 'stand_by' | 'approved' | 'rejected');
                              }}
                              direction={idx >= paginatedPipeline.length - 2 && paginatedPipeline.length > 2 ? 'up' : 'down'}
                              searchable={false}
                              title={t.recruiter.pipeline.statusDropdownTitle}
                              triggerClassName={`py-1 px-3 rounded-full text-[11px] font-bold border transition-colors ${
                                effectiveStatus === 'approved'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:border-emerald-400'
                                  : effectiveStatus === 'rejected'
                                  ? 'bg-rose-50 text-rose-800 border-rose-300 hover:border-rose-400'
                                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:border-amber-400'
                              }`}
                              options={[
                                {
                                  value: 'stand_by',
                                  label: t.recruiter.pipeline.statusStandBy,
                                  badge: language === 'es' ? 'En espera' : 'Stand By',
                                },
                                {
                                  value: 'approved',
                                  label: t.recruiter.pipeline.statusApproved,
                                  badge: language === 'es' ? 'Aprobado' : 'Approved',
                                },
                                {
                                  value: 'rejected',
                                  label: t.recruiter.pipeline.statusRejected,
                                  badge: language === 'es' ? 'Rechazado' : 'Rejected',
                                },
                              ]}
                            />
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{t.recruiter.pipeline.statusNotCompleted}</span>
                            </span>
                          )}
                        </td>

                        {/* 4. Overall Score Column: Percentage only, font-mono tabular-nums */}
                        <td className="p-4 text-center">
                          {item.status === 'completed' ? (
                            <span
                              className={`inline-block font-mono tabular-nums text-xs font-black px-2.5 py-1 rounded-lg ${
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
                            <span className="text-slate-400 font-mono tabular-nums text-xs">--</span>
                          )}
                        </td>

                        {/* 5. Hits Column: font-mono tabular-nums */}
                        <td className="p-4 text-center">
                          {item.status === 'completed' ? (
                            <span className="font-mono tabular-nums font-semibold text-slate-700">
                              {item.correctAnswersCount} / {item.totalQuestions}
                            </span>
                          ) : (
                            <span className="font-mono tabular-nums text-slate-400">0 / {item.totalQuestions}</span>
                          )}
                        </td>

                        {/* 6. Audit & Actions Column */}
                        <td className="p-4 text-right">
                          {item.status === 'completed' ? (
                            <button
                              onClick={() => setSelectedAuditAssignment(item)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-[#2368f5] font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>{t.recruiter.pipeline.viewAudit}</span>
                            </button>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  const link = `${window.location.origin}?code=${item.id}&email=${encodeURIComponent(item.candidateEmail)}`;
                                  navigator.clipboard.writeText(link);
                                  alert(
                                    t.recruiter.pipeline.linkCopiedAlert
                                      .replace('{name}', item.candidateName)
                                      .replace('{email}', item.candidateEmail) + `\n\n${link}`
                                  );
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors cursor-pointer text-xs border border-emerald-200"
                                title={t.recruiter.pipeline.copyLinkBtn}
                              >
                                <Copy className="w-3 h-3" />
                                <span>{t.recruiter.pipeline.copyLinkBtn}</span>
                              </button>
                              <button
                                onClick={() => {
                                  const link = `${window.location.origin}?code=${item.id}&email=${encodeURIComponent(item.candidateEmail)}`;
                                  handleSendInviteEmail({
                                    candidateName: item.candidateName,
                                    candidateEmail: item.candidateEmail,
                                    assessmentTitle: item.quizTitle,
                                    roleApplied: item.roleApplied,
                                    link,
                                    assessmentCode: item.id,
                                    timeLimit: item.durationMinutes || 20,
                                    questionsCount: item.totalQuestions,
                                    type: 'quiz',
                                    uniqueKey: `quiz-${item.id}`,
                                  });
                                }}
                                disabled={sendingEmailKey === `quiz-${item.id}`}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 text-[#2368f5] font-bold hover:bg-blue-100 transition-colors cursor-pointer text-xs border border-blue-200 disabled:opacity-50"
                                title={t.recruiter.pipeline.sendEmailBtn}
                              >
                                {sendingEmailKey === `quiz-${item.id}` ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Mail className="w-3 h-3" />
                                )}
                                <span>
                                  {sendingEmailKey === `quiz-${item.id}`
                                    ? t.recruiter.pipeline.emailSending
                                    : t.recruiter.pipeline.sendEmailBtn}
                                </span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                {t.recruiter.pipeline.showingPage
                  .replace('{from}', totalPipelineItems === 0 ? '0' : String(pipelineStartIndex + 1))
                  .replace('{to}', String(Math.min(pipelineStartIndex + pageSize, totalPipelineItems)))
                  .replace('{total}', String(totalPipelineItems))}
              </span>

              {/* Page Size Selector: 5, 10 default, 15, 20, 50 */}
              <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                <span className="text-xs text-slate-400">{t.recruiter.pipeline.pageSizeLabel}</span>
                <CustomSelect
                  value={String(pageSize)}
                  onChange={val => {
                    setPageSize(Number(val));
                    setCurrentPage(1);
                  }}
                  direction="up"
                  searchable={false}
                  triggerClassName="py-1 px-2.5 text-xs font-bold bg-slate-50 border-slate-200 rounded-lg"
                  options={[5, 10, 15, 20, 50].map(size => ({
                    value: String(size),
                    label: `${size} ${t.recruiter.pipeline.perPage}`,
                  }))}
                />
              </div>
            </div>

            {/* Page Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPipelinePage <= 1}
                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>{t.recruiter.pipeline.prevPage}</span>
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPipelinePages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPipelinePages || Math.abs(p - currentPipelinePage) <= 1)
                  .map((page, idx, arr) => {
                    const prevPageNumber = arr[idx - 1];
                    const hasGap = prevPageNumber && page - prevPageNumber > 1;
                    return (
                      <React.Fragment key={page}>
                        {hasGap && <span className="text-xs text-slate-400 px-1">...</span>}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`min-w-7 h-7 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                            currentPipelinePage === page
                              ? 'bg-[#2368f5] text-white shadow-xs'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPipelinePages, p + 1))}
                disabled={currentPipelinePage >= totalPipelinePages}
                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
              >
                <span>{t.recruiter.pipeline.nextPage}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Questionnaires Bank */}
      {activeTab === 'quizzes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">{t.recruiter.quizzes.title}</h2>
              <p className="text-xs text-slate-500">{t.recruiter.quizzes.subtitle}</p>
            </div>
            <button
              onClick={() => {
                setEditingQuiz(null);
                setIsQuizModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2368f5] text-white text-xs font-bold hover:bg-[#144cc0] transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{t.recruiter.quizzes.newQuizBtn}</span>
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
            <div className="flex-1 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={t.recruiter.quizzes.searchPlaceholder}
                  value={quizSearchQuery}
                  onChange={e => {
                    setQuizSearchQuery(e.target.value);
                    setCurrentQuizPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2368f5]"
                />
              </div>

              <CustomSelect
                value={quizCategoryFilter}
                onChange={val => {
                  setQuizCategoryFilter(val);
                  setCurrentQuizPage(1);
                }}
                triggerClassName="py-1.5 px-3 rounded-xl bg-slate-50 border-slate-200"
                options={[
                  { value: 'all', label: t.recruiter.quizzes.filterAreaAll },
                  ...uniqueQuizCategories.map(cat => ({
                    value: cat,
                    label: getLocalizedArea(cat, language),
                  })),
                ]}
              />

              {(quizSearchQuery !== '' || quizCategoryFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setQuizSearchQuery('');
                    setQuizCategoryFilter('all');
                    setCurrentQuizPage(1);
                  }}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t.recruiter.pipeline.clearFilters}</span>
                </button>
              )}
            </div>

            <span className="text-xs text-slate-500 font-semibold self-end md:self-auto px-1">
              {filteredQuizzes.length} {t.recruiter.quizzes.cardQuestions.split(' ')[0]} {language === 'es' ? 'bancos' : 'banks'}
            </span>
          </div>

          {/* Quizzes Grid */}
          {paginatedQuizzes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                {t.recruiter.quizzes.noQuizzes}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {language === 'es'
                  ? 'Intenta ajustar los filtros de búsqueda o categoría.'
                  : 'Try adjusting your search or category filters.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedQuizzes.map(quiz => {
                const isExpanded = Boolean(expandedQuizIds[quiz.id]);
                const classifications = quiz.supportedClassifications || [];
                const displayedClassifications = isExpanded
                  ? classifications
                  : classifications.slice(0, 3);
                const remainingCount = classifications.length - 3;

                return (
                  <div
                    key={quiz.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-[#2368f5] transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-[#2368f5] truncate max-w-[200px]">
                          {getLocalizedArea(quiz.category, language)}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => {
                              setEditingQuiz(quiz);
                              setIsQuizModalOpen(true);
                            }}
                            className="text-slate-400 hover:text-[#2368f5] p-1.5 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                            title={t.recruiter.quizzes.editBtn}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (
                                window.confirm(
                                  `${t.recruiter.quizzes.confirmDelete} "${quiz.title}"?`
                                )
                              ) {
                                deleteQuiz(quiz.id);
                              }
                            }}
                            className="text-slate-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete quiz"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-bold text-sm text-slate-900 leading-snug">
                        {getLocalizedArea(quiz.title, language)}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {quiz.description}
                      </p>

                      {/* Supported County of Orange Classifications */}
                      {classifications.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                              <Briefcase className="w-3 h-3 text-[#2368f5]" />
                              <span>{t.recruiter.quizzes.supportedClassifications}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">
                              {classifications.length}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {displayedClassifications.map((item, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 font-medium border border-slate-200 truncate max-w-full"
                                title={item}
                              >
                                {item}
                              </span>
                            ))}
                            {classifications.length > 3 && (
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  toggleQuizExpanded(quiz.id);
                                }}
                                className="text-[10px] font-bold text-[#2368f5] hover:underline px-1 py-0.5 cursor-pointer"
                              >
                                {isExpanded
                                  ? t.recruiter.quizzes.showLessClassifications
                                  : t.recruiter.quizzes.showMoreClassifications.replace(
                                      '{count}',
                                      String(remainingCount)
                                    )}
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="mt-4 flex items-center gap-3 text-xs text-slate-600 font-semibold">
                        <span>
                          {quiz.questions.length} {t.recruiter.quizzes.cardQuestions}
                        </span>
                        <span>•</span>
                        <span>
                          {quiz.timeLimitMinutes} {t.recruiter.quizzes.cardTime}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400 truncate">
                        {t.recruiter.quizzes.createdLabel} {quiz.createdAt}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => {
                            setEditingQuiz(quiz);
                            setIsQuizModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3 text-[#2368f5]" />
                          <span>{t.recruiter.quizzes.editBtn}</span>
                        </button>
                        <button
                          onClick={() => {
                            setAssigningQuizId(quiz.id);
                            setIsAssignModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#10243e] text-white text-xs font-bold hover:bg-[#1c3553] transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <SendHorizontal className="w-3 h-3" />
                          <span>{t.recruiter.quizzes.assignBtn}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quizzes Pagination Controls */}
          {totalQuizItems > 0 && (
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <span className="font-semibold">{t.recruiter.quizzes.pageSizeLabel}</span>
                <CustomSelect
                  value={String(quizPageSize)}
                  onChange={val => {
                    setQuizPageSize(Number(val));
                    setCurrentQuizPage(1);
                  }}
                  direction="up"
                  searchable={false}
                  triggerClassName="px-2.5 py-1 text-xs font-bold rounded-lg border-slate-200"
                  options={[5, 10, 15, 20, 50].map(size => ({
                    value: String(size),
                    label: `${size} ${t.recruiter.quizzes.perPage}`,
                  }))}
                />
                <span className="text-slate-400 ml-1">
                  {t.recruiter.quizzes.showingPage
                    .replace('{from}', String(quizStartIndex + 1))
                    .replace('{to}', String(Math.min(quizStartIndex + quizPageSize, totalQuizItems)))
                    .replace('{total}', String(totalQuizItems))}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentQuizPage(p => Math.max(1, p - 1))}
                  disabled={validQuizCurrentPage <= 1}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>{t.recruiter.quizzes.prevPage}</span>
                </button>
                <span className="px-2 text-xs font-bold text-slate-700">
                  {validQuizCurrentPage} / {totalQuizPages}
                </span>
                <button
                  onClick={() => setCurrentQuizPage(p => Math.min(totalQuizPages, p + 1))}
                  disabled={validQuizCurrentPage >= totalQuizPages}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  <span>{t.recruiter.quizzes.nextPage}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Candidates Directory */}
      {activeTab === 'candidates' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">{t.recruiter.candidates.title}</h2>
              <p className="text-xs text-slate-500">{t.recruiter.candidates.subtitle}</p>
            </div>
            <button
              onClick={() => {
                setCandidateToEdit(null);
                setIsCandidateModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2368f5] text-white text-xs font-bold hover:bg-[#144cc0] transition-colors cursor-pointer shadow-xs self-start sm:self-auto"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{t.recruiter.candidates.newCandidateBtn}</span>
            </button>
          </div>

          {/* Search & Area Filter Toolbar */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-2.5 items-stretch md:items-center justify-between">
            <div className="flex-1 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={
                    language === 'es'
                      ? 'Buscar candidato por nombre, rol o email...'
                      : 'Search candidate by name, role or email...'
                  }
                  value={candSearchQuery}
                  onChange={e => {
                    setCandSearchQuery(e.target.value);
                    setCandCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2368f5]"
                />
              </div>

              {uniqueCandidateAreas.length > 0 && (
                <CustomSelect
                  value={candAreaFilter}
                  onChange={val => {
                    setCandAreaFilter(val);
                    setCandCurrentPage(1);
                  }}
                  triggerClassName="py-1.5 px-3 rounded-xl bg-slate-50 border-slate-200"
                  options={[
                    {
                      value: 'all',
                      label: language === 'es' ? 'Todas las Áreas' : 'All Professional Areas',
                    },
                    ...uniqueCandidateAreas.map(areaName => ({
                      value: areaName,
                      label: getLocalizedArea(areaName, language),
                    })),
                  ]}
                />
              )}

              {(candSearchQuery !== '' || candAreaFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setCandSearchQuery('');
                    setCandAreaFilter('all');
                    setCandCurrentPage(1);
                  }}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{t.recruiter.pipeline.clearFilters}</span>
                </button>
              )}
            </div>

            <span className="text-xs text-slate-500 font-semibold self-end md:self-auto px-1">
              {filteredCandidates.length} {language === 'es' ? 'candidatos' : 'candidates'}
            </span>
          </div>

          {paginatedCandidates.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">
                {t.recruiter.candidates.noCandidates}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {language === 'es'
                  ? 'Intenta ajustar los filtros de búsqueda o área.'
                  : 'Try adjusting your search or area filters.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedCandidates.map(cand => {
                const candAssignments = assignments.filter(a => a.candidateId === cand.id);
                const completed = candAssignments.filter(a => a.status === 'completed');
                const candGender = resolveCandidateGender(cand);
                const isFemaleCand = candGender === 'female';
                const candInitials = getCandidateInitials(cand.name);

                return (
                  <div
                    key={cand.id}
                    className="bg-white rounded-2xl border border-slate-200/80 hover:border-[#2368f5] p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Card Header: Avatar with single initial & single gender emblem + Profile info + Delete action */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Single initial Avatar with subtle corner Mars / Venus indicator */}
                          <div className="relative shrink-0">
                            <div
                              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base shadow-2xs border transition-transform group-hover:scale-105 ${
                                isFemaleCand
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              <span>{candInitials}</span>
                            </div>
                            <div
                              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border shadow-2xs ${
                                isFemaleCand
                                  ? 'bg-purple-100 text-purple-700 border-purple-300'
                                  : 'bg-blue-100 text-blue-700 border-blue-300'
                              }`}
                              title={
                                isFemaleCand
                                  ? language === 'es'
                                    ? 'Femenino'
                                    : 'Female'
                                  : language === 'es'
                                  ? 'Masculino'
                                  : 'Male'
                              }
                            >
                              {isFemaleCand ? <Venus className="w-2.5 h-2.5" /> : <Mars className="w-2.5 h-2.5" />}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedProfileCandidate(cand)}
                            className="text-left min-w-0 flex-1 cursor-pointer group/name"
                            title={t.recruiter.pipeline.viewCandidateProfile}
                          >
                            <h3 className="font-bold text-sm text-slate-900 group-hover/name:text-[#2368f5] group-hover/name:underline flex items-center gap-1 transition-colors truncate">
                              <span className="truncate">{cand.name}</span>
                              <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover/name:text-[#2368f5] shrink-0" />
                            </h3>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">{cand.email}</p>
                          </button>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setCandidateToEdit(cand);
                              setIsCandidateModalOpen(true);
                            }}
                            className="text-slate-300 hover:text-[#2368f5] hover:bg-blue-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title={language === 'es' ? 'Editar perfil' : 'Edit profile'}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCandidate(cand.id)}
                            className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title={language === 'es' ? 'Eliminar candidato' : 'Delete candidate'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Area & Role Tags */}
                      <div className="mt-3.5 space-y-1">
                        {cand.area && (
                          <div className="flex">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-[#2368f5] border border-blue-100 truncate max-w-full">
                              <Briefcase className="w-2.5 h-2.5 shrink-0" />
                              <span className="truncate">{getLocalizedArea(cand.area, language)}</span>
                            </span>
                          </div>
                        )}
                        <p className="text-xs font-semibold text-slate-700 truncate" title={cand.roleApplied}>
                          {cand.roleApplied}
                        </p>
                      </div>

                      {/* Micro-stats: Tests Assigned vs Tests Completed */}
                      <div className="mt-3.5 grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <span className="text-[10px] font-medium text-slate-500 block truncate">
                            {t.recruiter.candidates.testsAssigned}
                          </span>
                          <span className="text-sm font-black text-slate-800 block mt-0.5">
                            {candAssignments.length}
                          </span>
                        </div>
                        <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-100">
                          <span className="text-[10px] font-medium text-emerald-700 block truncate">
                            {t.recruiter.candidates.testsCompleted}
                          </span>
                          <span className="text-sm font-black text-emerald-600 block mt-0.5">
                            {completed.length}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => setSelectedProfileCandidate(cand)}
                        className="flex-1 py-2 px-2.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{language === 'es' ? 'Ver Ficha' : 'Profile'}</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsAssignModalOpen(true);
                        }}
                        className="flex-1 py-2 px-2.5 bg-blue-50 text-[#2368f5] rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-blue-200/50"
                      >
                        <SendHorizontal className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{t.recruiter.candidates.assignQuizBtn}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Candidates Pagination Controls */}
          {totalCandItems > 5 && (
            <div className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white mt-4">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">
                  {t.recruiter.pipeline.showingPage
                    .replace('{from}', totalCandItems === 0 ? '0' : String(candStartIndex + 1))
                    .replace('{to}', String(Math.min(candStartIndex + candPageSize, totalCandItems)))
                    .replace('{total}', String(totalCandItems))}
                </span>

                <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                  <span className="text-xs text-slate-400">{t.recruiter.pipeline.pageSizeLabel}</span>
                  <CustomSelect
                    value={String(candPageSize)}
                    onChange={val => {
                      setCandPageSize(Number(val));
                      setCandCurrentPage(1);
                    }}
                    direction="up"
                    searchable={false}
                    triggerClassName="py-1 px-2.5 text-xs font-bold bg-slate-50 border-slate-200 rounded-lg"
                    options={[5, 10, 15, 20, 50].map(size => ({
                      value: String(size),
                      label: `${size} ${t.recruiter.pipeline.perPage}`,
                    }))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCandCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentCandPage <= 1}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>{t.recruiter.pipeline.prevPage}</span>
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalCandPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCandCurrentPage(page)}
                      className={`min-w-7 h-7 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        currentCandPage === page
                          ? 'bg-[#2368f5] text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCandCurrentPage(p => Math.min(totalCandPages, p + 1))}
                  disabled={currentCandPage >= totalCandPages}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  <span>{t.recruiter.pipeline.nextPage}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Typing Assessments */}
      {activeTab === 'typing' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Typing Metrics Summary Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <Keyboard className="w-5 h-5 text-[#2368f5]" />
                <span>{t.recruiter.typing.title}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.recruiter.typing.subtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
                <span className="text-slate-500 font-semibold">{t.recruiter.typing.metricsTotal}:</span>
                <span className="font-bold font-mono text-slate-900">{typingCompletedCount}</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500 font-semibold">{t.recruiter.typing.metricsAvgWpm}:</span>
                <span className="font-bold font-mono text-[#2368f5]">{avgNetWpm} WPM</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500 font-semibold">{t.recruiter.typing.metricsAvgAccuracy}:</span>
                <span className="font-bold font-mono text-emerald-600">{avgAccuracy}%</span>
              </div>

              <button
                onClick={() => setIsTypingModalOpen(true)}
                className="px-3.5 py-2 bg-[#2368f5] hover:bg-[#144cc0] text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer ml-auto md:ml-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t.recruiter.typing.newTemplateBtn}</span>
              </button>
            </div>
          </div>

          {/* Typing Filters Toolbar */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'es' ? 'Buscar por postulante o plantilla...' : 'Search by candidate or template...'}
                value={typingSearch}
                onChange={e => {
                  setTypingSearch(e.target.value);
                  setTypingCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2368f5]/20 focus:border-[#2368f5]"
              />
            </div>

            <div className="w-full sm:w-56">
              <CustomSelect
                value={typingLevelFilter}
                onChange={val => {
                  setTypingLevelFilter(val as any);
                  setTypingCurrentPage(1);
                }}
                className="w-full"
                options={[
                  { value: 'all', label: t.recruiter.typing.filterAllLevels },
                  { value: 'basic', label: t.recruiter.typing.filterBasic },
                  { value: 'intermediate', label: t.recruiter.typing.filterIntermediate },
                  { value: 'advanced', label: t.recruiter.typing.filterAdvanced },
                ]}
              />
            </div>
          </div>

          {/* Typing Table */}
          {paginatedTyping.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <Keyboard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p>{t.recruiter.typing.empty}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">{t.recruiter.typing.colCandidate}</th>
                    <th className="py-3 px-4">{t.recruiter.typing.colTemplate}</th>
                    <th className="py-3 px-4 text-center">{t.recruiter.typing.colNetWpm}</th>
                    <th className="py-3 px-4 text-center">{t.recruiter.typing.colGrossWpm}</th>
                    <th className="py-3 px-4 text-center">{t.recruiter.typing.colAccuracy}</th>
                    <th className="py-3 px-4 text-center">{t.recruiter.typing.colLevel}</th>
                    <th className="py-3 px-4 text-center">{t.recruiter.typing.colErrors}</th>
                    <th className="py-3 px-4">{t.recruiter.typing.colDate}</th>
                    <th className="py-3 px-4 text-right">{t.recruiter.typing.colActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedTyping.map(test => {
                    const candidateObj = candidates.find(c => c.id === test.candidateId);
                    const gender = candidateObj ? resolveCandidateGender(candidateObj) : 'male';
                    const isCompleted = test.status === 'completed';

                    return (
                      <tr key={test.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="relative shrink-0">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs border ${
                                  gender === 'female'
                                    ? 'bg-purple-50 border-purple-200 text-purple-700'
                                    : 'bg-blue-50 border-blue-200 text-blue-700'
                                }`}
                              >
                                {getCandidateInitials(test.candidateName)}
                              </div>
                              <div
                                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center border shadow-2xs ${
                                  gender === 'female'
                                    ? 'bg-purple-100 text-purple-700 border-purple-300'
                                    : 'bg-blue-100 text-blue-700 border-blue-300'
                                }`}
                              >
                                {gender === 'female' ? (
                                  <Venus className="w-2.5 h-2.5" />
                                ) : (
                                  <Mars className="w-2.5 h-2.5" />
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const found = candidates.find(c => c.id === test.candidateId) || candidates.find(c => c.name.toLowerCase().trim() === test.candidateName.toLowerCase().trim());
                                if (found) {
                                  setSelectedProfileCandidate(found);
                                } else {
                                  setSelectedProfileCandidate({
                                    id: test.candidateId,
                                    name: test.candidateName,
                                    email: test.candidateEmail,
                                    roleApplied: '',
                                    avatar: gender === 'female' ? 'gender:female' : 'gender:male',
                                    gender: gender,
                                    registeredAt: test.assignedAt,
                                  });
                                }
                              }}
                              className="text-left group/cand cursor-pointer block truncate min-w-0"
                              title={t.recruiter.pipeline.viewCandidateProfile}
                            >
                              <p className="font-bold text-slate-900 group-hover/cand:text-[#2368f5] group-hover/cand:underline flex items-center gap-1 transition-colors truncate">
                                <span className="truncate">{test.candidateName}</span>
                                <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover/cand:text-[#2368f5] shrink-0" />
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">{test.candidateEmail}</p>
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {test.templateTitle}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {isCompleted ? (
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-md font-mono font-bold text-xs ${
                                (test.netWpm ?? 0) >= 55
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : (test.netWpm ?? 0) >= 35
                                  ? 'bg-blue-50 text-[#2368f5] border border-blue-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {test.netWpm} WPM
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Pending</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">
                          {isCompleted ? `${test.grossWpm} WPM` : '-'}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                          {isCompleted ? `${test.accuracy}%` : '-'}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {isCompleted ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                test.level === 'advanced'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : test.level === 'intermediate'
                                  ? 'bg-blue-50 text-[#2368f5] border border-blue-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {test.level === 'advanced' ? (
                                <Award className="w-3 h-3 text-purple-600" />
                              ) : test.level === 'intermediate' ? (
                                <Zap className="w-3 h-3 text-[#2368f5]" />
                              ) : (
                                <Shield className="w-3 h-3 text-amber-600" />
                              )}
                              <span>
                                {test.level === 'advanced'
                                  ? t.recruiter.typing.levelAdvanced
                                  : test.level === 'intermediate'
                                  ? t.recruiter.typing.levelIntermediate
                                  : t.recruiter.typing.levelBasic}
                              </span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              Pendiente
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-bold text-rose-600">
                          {isCompleted ? test.errorsCount : '-'}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                          {test.completedAt || test.assignedAt}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {isCompleted ? (
                            <button
                              onClick={() => setSelectedTypingCertificate(test)}
                              className="px-2.5 py-1 text-xs font-bold text-[#2368f5] bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 border border-blue-200"
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>{t.recruiter.typing.viewCertificateBtn}</span>
                            </button>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  const link = `${window.location.origin}?code=${test.id}&email=${encodeURIComponent(test.candidateEmail)}`;
                                  navigator.clipboard.writeText(link);
                                  alert(
                                    t.recruiter.pipeline.linkCopiedAlert
                                      .replace('{name}', test.candidateName)
                                      .replace('{email}', test.candidateEmail) + `\n\n${link}`
                                  );
                                }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors cursor-pointer text-xs border border-emerald-200"
                                title={t.recruiter.pipeline.copyLinkBtn}
                              >
                                <Copy className="w-3 h-3" />
                                <span>{t.recruiter.pipeline.copyLinkBtn}</span>
                              </button>
                              <button
                                onClick={() => {
                                  const link = `${window.location.origin}?code=${test.id}&email=${encodeURIComponent(test.candidateEmail)}`;
                                  handleSendInviteEmail({
                                    candidateName: test.candidateName,
                                    candidateEmail: test.candidateEmail,
                                    assessmentTitle: test.templateTitle,
                                    link,
                                    assessmentCode: test.id,
                                    timeLimit: Math.round((typingTemplates.find(t => t.id === test.templateId)?.targetDurationSeconds || 180) / 60),
                                    type: 'typing',
                                    uniqueKey: `typing-${test.id}`,
                                  });
                                }}
                                disabled={sendingEmailKey === `typing-${test.id}`}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 text-[#2368f5] font-bold hover:bg-blue-100 transition-colors cursor-pointer text-xs border border-blue-200 disabled:opacity-50"
                                title={t.recruiter.pipeline.sendEmailBtn}
                              >
                                {sendingEmailKey === `typing-${test.id}` ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Mail className="w-3 h-3" />
                                )}
                                <span>
                                  {sendingEmailKey === `typing-${test.id}`
                                    ? t.recruiter.pipeline.emailSending
                                    : t.recruiter.pipeline.sendEmailBtn}
                                </span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Typing Pagination Controls */}
          {totalTypingItems > 5 && (
            <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/30">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">
                  {t.recruiter.pipeline.showingPage
                    .replace('{from}', totalTypingItems === 0 ? '0' : String(typingStartIndex + 1))
                    .replace('{to}', String(Math.min(typingStartIndex + typingPageSize, totalTypingItems)))
                    .replace('{total}', String(totalTypingItems))}
                </span>

                <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                  <span className="text-xs text-slate-400">{t.recruiter.pipeline.pageSizeLabel}</span>
                  <CustomSelect
                    value={String(typingPageSize)}
                    onChange={val => {
                      setTypingPageSize(Number(val));
                      setTypingCurrentPage(1);
                    }}
                    direction="up"
                    searchable={false}
                    triggerClassName="py-1 px-2.5 text-xs font-bold bg-slate-50 border-slate-200 rounded-lg"
                    options={[5, 10, 15, 20, 50].map(size => ({
                      value: String(size),
                      label: `${size} ${t.recruiter.pipeline.perPage}`,
                    }))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setTypingCurrentPage(p => Math.max(1, p - 1))}
                  disabled={validTypingPage <= 1}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>{t.recruiter.pipeline.prevPage}</span>
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalTypingPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setTypingCurrentPage(page)}
                      className={`min-w-7 h-7 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        validTypingPage === page
                          ? 'bg-[#2368f5] text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setTypingCurrentPage(p => Math.min(totalTypingPages, p + 1))}
                  disabled={validTypingPage >= totalTypingPages}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  <span>{t.recruiter.pipeline.nextPage}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Excel Practical Assessments */}
      {activeTab === 'excel' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Excel Metrics Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>{t.recruiter.excel.title}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {t.recruiter.excel.subtitle}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs shadow-2xs">
                <span className="text-slate-500 font-semibold">{t.recruiter.excel.metricsTotal}:</span>
                <span className="font-bold font-mono text-slate-900">{totalExcelSubmissions}</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500 font-semibold">{t.recruiter.excel.metricsPending}:</span>
                <span className="font-bold font-mono text-amber-600">{pendingExcelCount}</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500 font-semibold">{t.recruiter.excel.metricsApproved}:</span>
                <span className="font-bold font-mono text-emerald-600">{approvedExcelCount}</span>
              </div>

              <button
                onClick={() => setIsExcelModalOpen(true)}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer ml-auto md:ml-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t.recruiter.excel.newTaskBtn}</span>
              </button>
            </div>
          </div>

          {/* Excel Filters Toolbar */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'es' ? 'Buscar por postulante, tarea o archivo...' : 'Search by candidate, task or file...'}
                value={excelSearch}
                onChange={e => {
                  setExcelSearch(e.target.value);
                  setExcelCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="w-full sm:w-56">
              <CustomSelect
                value={excelStatusFilter}
                onChange={val => {
                  setExcelStatusFilter(val as any);
                  setExcelCurrentPage(1);
                }}
                className="w-full"
                options={[
                  { value: 'all', label: language === 'es' ? 'Todos los Estados' : 'All Statuses' },
                  { value: 'pending', label: language === 'es' ? 'Pendiente de Revisión' : 'Pending Review' },
                  { value: 'approved', label: language === 'es' ? 'Aprobados' : 'Approved' },
                  { value: 'rejected', label: language === 'es' ? 'Rechazados' : 'Needs Revision' },
                ]}
              />
            </div>
          </div>

          {/* Excel Submissions Table */}
          {paginatedExcel.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <FileSpreadsheet className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p>{t.recruiter.excel.empty}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">{t.recruiter.excel.colCandidate}</th>
                    <th className="py-3 px-4">{t.recruiter.excel.colTask}</th>
                    <th className="py-3 px-4">{t.recruiter.excel.colTemplate}</th>
                    <th className="py-3 px-4">{t.recruiter.excel.colSubmission}</th>
                    <th className="py-3 px-4 text-center">{t.recruiter.excel.colReviewStatus}</th>
                    <th className="py-3 px-4 text-center">{t.recruiter.excel.colScore}</th>
                    <th className="py-3 px-4">{t.recruiter.excel.colDate}</th>
                    <th className="py-3 px-4 text-right">{t.recruiter.excel.colActions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedExcel.map(sub => {
                    const candidateObj = candidates.find(c => c.id === sub.candidateId);
                    const gender = candidateObj ? resolveCandidateGender(candidateObj) : 'male';
                    const assessObj = excelAssessments.find(a => a.id === sub.assessmentId);

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="relative shrink-0">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs border ${
                                  gender === 'female'
                                    ? 'bg-purple-50 border-purple-200 text-purple-700'
                                    : 'bg-blue-50 border-blue-200 text-blue-700'
                                }`}
                              >
                                {getCandidateInitials(sub.candidateName)}
                              </div>
                              <div
                                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center border shadow-2xs ${
                                  gender === 'female'
                                    ? 'bg-purple-100 text-purple-700 border-purple-300'
                                    : 'bg-blue-100 text-blue-700 border-blue-300'
                                }`}
                              >
                                {gender === 'female' ? (
                                  <Venus className="w-2.5 h-2.5" />
                                ) : (
                                  <Mars className="w-2.5 h-2.5" />
                                )}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const found = candidates.find(c => c.id === sub.candidateId) || candidates.find(c => c.name.toLowerCase().trim() === sub.candidateName.toLowerCase().trim());
                                if (found) {
                                  setSelectedProfileCandidate(found);
                                } else {
                                  setSelectedProfileCandidate({
                                    id: sub.candidateId,
                                    name: sub.candidateName,
                                    email: sub.candidateEmail,
                                    roleApplied: '',
                                    avatar: gender === 'female' ? 'gender:female' : 'gender:male',
                                    gender: gender,
                                    registeredAt: sub.submittedAt,
                                  });
                                }
                              }}
                              className="text-left group/cand cursor-pointer block truncate min-w-0"
                              title={t.recruiter.pipeline.viewCandidateProfile}
                            >
                              <p className="font-bold text-slate-900 group-hover/cand:text-[#2368f5] group-hover/cand:underline flex items-center gap-1 transition-colors truncate">
                                <span className="truncate">{sub.candidateName}</span>
                                <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover/cand:text-[#2368f5] shrink-0" />
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">{sub.candidateEmail}</p>
                            </button>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{sub.assessmentTitle || assessObj?.title}</p>
                          {assessObj?.departmentArea && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              {getLocalizedArea(assessObj.departmentArea, language)}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {assessObj ? (
                            <span className="font-mono text-[11px] text-slate-700 truncate max-w-[140px] block">
                              {assessObj.templateFileName}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">-</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {sub.submittedFileName ? (
                            <span className="font-mono text-[11px] text-emerald-800 font-bold truncate max-w-[150px] block">
                              {sub.submittedFileName}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">
                              {language === 'es' ? 'No adjuntado aún' : 'Not submitted yet'}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              sub.reviewStatus === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : sub.reviewStatus === 'rejected'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {sub.reviewStatus === 'approved' ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : sub.reviewStatus === 'rejected' ? (
                              <X className="w-3 h-3 text-rose-600" />
                            ) : (
                              <Clock className="w-3 h-3 text-amber-600" />
                            )}
                            <span>
                              {sub.reviewStatus === 'approved'
                                ? (language === 'es' ? 'Aprobado' : 'Approved')
                                : sub.reviewStatus === 'rejected'
                                ? (language === 'es' ? 'Rechazado' : 'Revision')
                                : (language === 'es' ? 'Por Revisar' : 'Pending')}
                            </span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {sub.score !== undefined ? (
                            <span
                              className={`font-mono font-bold text-xs ${
                                sub.score >= 75 ? 'text-emerald-700' : 'text-slate-800'
                              }`}
                            >
                              {sub.score}/100
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">-</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                          {sub.submittedAt}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {sub.submittedFileName && (
                              <button
                                onClick={() => setSelectedExcelSubmission(sub)}
                                className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1 border border-emerald-200"
                              >
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                                <span>{t.recruiter.excel.colActions}</span>
                              </button>
                            )}
                            <button
                              onClick={() => {
                                const link = `${window.location.origin}?code=${sub.id}&email=${encodeURIComponent(sub.candidateEmail)}`;
                                navigator.clipboard.writeText(link);
                                alert(
                                  t.recruiter.pipeline.linkCopiedAlert
                                    .replace('{name}', sub.candidateName)
                                    .replace('{email}', sub.candidateEmail) + `\n\n${link}`
                                );
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition-colors cursor-pointer text-xs border border-emerald-200"
                              title={t.recruiter.pipeline.copyLinkBtn}
                            >
                              <Copy className="w-3 h-3" />
                              <span>{t.recruiter.pipeline.copyLinkBtn}</span>
                            </button>
                            <button
                              onClick={() => {
                                const link = `${window.location.origin}?code=${sub.id}&email=${encodeURIComponent(sub.candidateEmail)}`;
                                handleSendInviteEmail({
                                  candidateName: sub.candidateName,
                                  candidateEmail: sub.candidateEmail,
                                  assessmentTitle: sub.assessmentTitle || assessObj?.title || 'Excel Assessment',
                                  link,
                                  assessmentCode: sub.id,
                                  timeLimit: assessObj?.timeLimitMinutes || 30,
                                  type: 'excel',
                                  uniqueKey: `excel-${sub.id}`,
                                });
                              }}
                              disabled={sendingEmailKey === `excel-${sub.id}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 text-[#2368f5] font-bold hover:bg-blue-100 transition-colors cursor-pointer text-xs border border-blue-200 disabled:opacity-50"
                              title={t.recruiter.pipeline.sendEmailBtn}
                            >
                              {sendingEmailKey === `excel-${sub.id}` ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Mail className="w-3 h-3" />
                              )}
                              <span>
                                {sendingEmailKey === `excel-${sub.id}`
                                  ? t.recruiter.pipeline.emailSending
                                  : t.recruiter.pipeline.sendEmailBtn}
                              </span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Excel Pagination Controls */}
          {totalExcelItems > 5 && (
            <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/30">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">
                  {t.recruiter.pipeline.showingPage
                    .replace('{from}', totalExcelItems === 0 ? '0' : String(excelStartIndex + 1))
                    .replace('{to}', String(Math.min(excelStartIndex + excelPageSize, totalExcelItems)))
                    .replace('{total}', String(totalExcelItems))}
                </span>

                <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
                  <span className="text-xs text-slate-400">{t.recruiter.pipeline.pageSizeLabel}</span>
                  <CustomSelect
                    value={String(excelPageSize)}
                    onChange={val => {
                      setExcelPageSize(Number(val));
                      setExcelCurrentPage(1);
                    }}
                    direction="up"
                    searchable={false}
                    triggerClassName="py-1 px-2.5 text-xs font-bold bg-slate-50 border-slate-200 rounded-lg"
                    options={[5, 10, 15, 20, 50].map(size => ({
                      value: String(size),
                      label: `${size} ${t.recruiter.pipeline.perPage}`,
                    }))}
                  />
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setExcelCurrentPage(p => Math.max(1, p - 1))}
                  disabled={validExcelPage <= 1}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>{t.recruiter.pipeline.prevPage}</span>
                </button>

                <div className="flex items-center gap-1 px-1">
                  {Array.from({ length: totalExcelPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setExcelCurrentPage(page)}
                      className={`min-w-7 h-7 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        validExcelPage === page
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setExcelCurrentPage(p => Math.min(totalExcelPages, p + 1))}
                  disabled={validExcelPage >= totalExcelPages}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                >
                  <span>{t.recruiter.pipeline.nextPage}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <QuizBuilderModal
        isOpen={isQuizModalOpen}
        quizToEdit={editingQuiz}
        onClose={() => {
          setIsQuizModalOpen(false);
          setEditingQuiz(null);
        }}
      />

      <CandidateModal
        isOpen={isCandidateModalOpen}
        onClose={() => {
          setIsCandidateModalOpen(false);
          setCandidateToEdit(null);
        }}
        candidateToEdit={candidateToEdit}
      />

      <AssignQuizModal
        isOpen={isAssignModalOpen}
        defaultQuizId={assigningQuizId}
        onClose={() => {
          setIsAssignModalOpen(false);
          setAssigningQuizId(undefined);
        }}
      />

      <ResultsAuditModal
        assignment={selectedAuditAssignment}
        onClose={() => setSelectedAuditAssignment(null)}
      />

      <TypingTemplateModal
        isOpen={isTypingModalOpen}
        onClose={() => setIsTypingModalOpen(false)}
      />

      <ExcelBuilderModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
      />

      <ExcelReviewModal
        isOpen={Boolean(selectedExcelSubmission)}
        onClose={() => setSelectedExcelSubmission(null)}
        submission={selectedExcelSubmission}
      />

      {/* Typing Certificate Scorecard Modal */}
      {selectedTypingCertificate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-5 text-center my-auto">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#2368f5] to-[#2bc5d9] text-white flex items-center justify-center mx-auto shadow-md">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2368f5] border border-blue-200">
                Official Typing Proficiency Certificate
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">
                {selectedTypingCertificate.candidateName}
              </h3>
              <p className="text-xs text-slate-500">
                {selectedTypingCertificate.templateTitle} • {selectedTypingCertificate.completedAt || selectedTypingCertificate.assignedAt}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="text-center">
                <span className="text-[11px] text-slate-500 font-semibold block">Net Speed</span>
                <span className="text-2xl font-black font-mono text-[#2368f5]">
                  {selectedTypingCertificate.netWpm} WPM
                </span>
              </div>
              <div className="text-center">
                <span className="text-[11px] text-slate-500 font-semibold block">Accuracy</span>
                <span className="text-2xl font-black font-mono text-emerald-600">
                  {selectedTypingCertificate.accuracy}%
                </span>
              </div>
            </div>

            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Proficiency Tier:</span>
              <span className="font-bold text-[#2368f5] capitalize">
                {selectedTypingCertificate.level} Level
              </span>
            </div>

            <button
              onClick={() => setSelectedTypingCertificate(null)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              {t.common.cancel}
            </button>
          </div>
        </div>
      )}

      <CandidateProfileModal
        candidate={selectedProfileCandidate}
        onClose={() => setSelectedProfileCandidate(null)}
        onViewScorecard={assignment => {
          setSelectedProfileCandidate(null);
          setSelectedAuditAssignment(assignment);
        }}
        onAssignTest={() => {
          setSelectedProfileCandidate(null);
          setIsAssignModalOpen(true);
        }}
        onEdit={cand => {
          setSelectedProfileCandidate(null);
          setCandidateToEdit(cand);
          setIsCandidateModalOpen(true);
        }}
      />
    </div>
  );
};
