import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck } from 'lucide-react';


interface FooterProps {
  isAdminAuthenticated?: boolean;
}

export const Footer: React.FC<FooterProps> = ({ isAdminAuthenticated = false }) => {
  const { t, activeRole, setActiveRole } = useApp();

  return (
    <footer className="mt-16 pt-8 border-t border-slate-200 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900">{t.brand}</span>
            <span>• {t.tagline}</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            {isAdminAuthenticated && activeRole === 'recruiter' && (
              <>
                <button
                  onClick={() => setActiveRole('recruiter')}
                  className="hover:text-slate-900 cursor-pointer"
                >
                  {t.nav.overview}
                </button>
                <button
                  onClick={() => setActiveRole('candidate')}
                  className="hover:text-slate-900 cursor-pointer"
                >
                  {t.nav.candidatePortal}
                </button>
              </>
            )}
            <span className="flex items-center gap-1 text-[#60738a]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2368f5]" />
              <span>Standardized Scoring Engine</span>
            </span>
            <span>&copy; 2026 SkillProof. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
