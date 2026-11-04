import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Briefcase,
  GraduationCap,
  Languages,
  ShieldCheck,
  Database,
  LogOut,
} from 'lucide-react';

interface NavbarProps {
  isAdminAuthenticated?: boolean;
  onAdminLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ isAdminAuthenticated = false, onAdminLogout }) => {
  const {
    language,
    setLanguage,
    t,
    activeRole,
    setActiveRole,
    assignments,
    isLiveDatabase,
    loading,
  } = useApp();

  const completedCount = assignments.filter(a => a.status === 'completed').length;
  const pendingCount = assignments.filter(a => a.status === 'pending').length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#dfe7f1] shadow-xs">
      {/* Top Banner: Demo Mode & Role Switcher */}
      <div className="bg-[#10243e] text-xs text-white py-2 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          {/* Active Mode Indicator */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-[#22a06b] animate-pulse"></span>
            <span className="font-semibold text-white tracking-wide uppercase text-[11px] sm:text-xs">
              {activeRole === 'recruiter' ? t.nav.enterprisePortal : t.nav.candidateAssessment}
            </span>
            {activeRole === 'recruiter' && (
              <span className="hidden md:inline text-slate-400">
                • {completedCount} {t.common.completed.toLowerCase()} / {pendingCount} {t.common.pending.toLowerCase()}
              </span>
            )}
            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-tight border ${
              isLiveDatabase 
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
            }`}>
              <Database className="w-3 h-3 shrink-0" />
              <span>
                {loading 
                  ? t.nav.syncing 
                  : isLiveDatabase 
                    ? t.nav.cloudMode 
                    : t.nav.localMode}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Role Switcher Buttons - Only visible to authenticated administrators */}
            {isAdminAuthenticated && (
              <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-full border border-white/20">
                <button
                  onClick={() => setActiveRole('recruiter')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    activeRole === 'recruiter'
                      ? 'bg-[#2368f5] text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{t.roles.recruiter}</span>
                </button>

                <button
                  onClick={() => setActiveRole('candidate')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    activeRole === 'candidate'
                      ? 'bg-[#2368f5] text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>{t.roles.candidate}</span>
                </button>
              </div>
            )}

            {/* Language Selector: EN | ES */}
            <div className="flex items-center gap-1 bg-white/10 rounded-full p-0.5 border border-white/20 pl-1.5">
              <Languages className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-[#2368f5] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('es')}
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                  language === 'es'
                    ? 'bg-[#2368f5] text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                ES
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#2368f5] to-[#2bc5d9] flex items-center justify-center text-white shadow-xs">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-extrabold text-xl text-[#10243e] tracking-tight font-sans">
                  {t.brand}
                </span>
                <span className="hidden lg:inline-block ml-2 text-[10px] font-bold bg-[#f5f8fc] text-[#2368f5] px-2 py-0.5 rounded-full border border-[#dfe7f1]">
                  {t.nav.skillsVerificationPlatform}
                </span>
              </div>
            </div>
          </div>

          {/* Role specific profile indicator */}
          <div className="flex items-center gap-3">
            {activeRole === 'recruiter' ? (
              <div className="flex items-center gap-3 pl-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-[#2368f5] flex items-center justify-center font-bold text-xs ring-2 ring-blue-100">
                    SP
                  </div>
                  <div className="text-left text-xs leading-tight hidden sm:block">
                    <p className="font-bold text-[#10243e]">{t.nav.hiringManagerRole}</p>
                    <p className="text-[#60738a] text-[11px]">{t.nav.enterpriseOrg}</p>
                  </div>
                </div>
                {onAdminLogout && (
                  <button
                    onClick={onAdminLogout}
                    title={t.nav.logoutAdminTitle}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-blue-50 text-[#2368f5] border border-blue-200 shadow-2xs">
                  {t.candidate.portalBadge}
                </span>
                {isAdminAuthenticated && (
                  <button
                    onClick={() => setActiveRole('recruiter')}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#2368f5] hover:text-[#144cc0] bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 px-2.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{language === 'es' ? 'Volver a Admin' : 'Back to Admin'}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
