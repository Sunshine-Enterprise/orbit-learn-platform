import React, { useEffect, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { RecruiterDashboard } from './components/recruiter/RecruiterDashboard';
import { CandidateExamAccess } from './components/candidate/CandidateExamAccess';
import { AdminAuthView } from './components/admin/AdminAuthView';
import { authService } from './services/authService';

const AppContent: React.FC = () => {
  const { activeRole, setActiveRole } = useApp();
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('skillproof_admin_session'));
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') !== null || params.get('portal') === 'admin' || params.get('role') === 'admin') {
      setActiveRole('recruiter');
      return;
    }

    if (params.get('code') || params.get('test') || params.get('email') || params.get('portal') === 'candidate' || params.get('role') === 'candidate') {
      setActiveRole('candidate');
      return;
    }

    authService.getCurrentUser().then(user => {
      if (user) {
        setIsAdminAuthenticated(true);
      }
    });
  }, [setActiveRole]);

  const handleAdminLogout = async () => {
    await authService.signOut();
    setIsAdminAuthenticated(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f8fc] text-[#10243e]">
      <Navbar
        isAdminAuthenticated={isAdminAuthenticated}
        onAdminLogout={isAdminAuthenticated && activeRole === 'recruiter' ? handleAdminLogout : undefined}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeRole === 'candidate' ? (
          <CandidateExamAccess />
        ) : isAdminAuthenticated ? (
          <RecruiterDashboard />
        ) : (
          <AdminAuthView
            onSuccess={() => setIsAdminAuthenticated(true)}
            onSwitchToCandidate={() => setActiveRole('candidate')}
          />
        )}
      </main>
      <Footer isAdminAuthenticated={isAdminAuthenticated} />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
