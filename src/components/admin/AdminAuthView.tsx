import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { authService } from '../../services/authService';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Eye,
  EyeOff,
} from 'lucide-react';

interface Props {
  onSuccess: () => void;
  onSwitchToCandidate: () => void;
}

export const AdminAuthView: React.FC<Props> = ({ onSuccess, onSwitchToCandidate }) => {
  const { t, language } = useApp();
  const isEs = language === 'es';

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { user, error } = await authService.signIn(email, password);
        if (error) {
          setErrorMessage(
            error === 'Invalid login credentials'
              ? t.adminAuth.errorInvalidCreds
              : error
          );
          return;
        }
        if (user) {
          onSuccess();
        }
      } else {
        const { user, error, requiresEmailConfirmation } = await authService.signUp(email, password, fullName);
        if (error) {
          setErrorMessage(error);
          return;
        }
        if (requiresEmailConfirmation) {
          setInfoMessage(t.adminAuth.successSignUpConfirmation);
          return;
        }
        if (user) {
          onSuccess();
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || t.adminAuth.errorUnexpected);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#2368f5] to-[#2bc5d9] text-white shadow-md mb-3">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-[#10243e] tracking-tight">
          {t.adminAuth.brandTitle}
        </h1>
        <p className="text-xs text-[#60738a] mt-1">
          {isEs
            ? 'Inicio de sesión administrativo corporativo en vivo'
            : 'Live Enterprise Administrator Portal Access'}
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'signin' ? 'bg-white text-[#10243e] shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.adminAuth.tabSignIn}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'signup' ? 'bg-white text-[#10243e] shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {t.adminAuth.tabSignUp}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                {t.adminAuth.nameLabel}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder={t.adminAuth.namePlaceholder}
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2368f5]/20 focus:border-[#2368f5]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              {t.adminAuth.emailLabel}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder={t.adminAuth.emailPlaceholder}
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2368f5]/20 focus:border-[#2368f5]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              {t.adminAuth.passwordLabel}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
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

          {infoMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{infoMessage}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#2368f5] hover:bg-[#144cc0] disabled:opacity-60 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>
              {loading
                ? t.adminAuth.connectingBtn
                : mode === 'signin'
                ? t.adminAuth.signInBtn
                : t.adminAuth.signUpBtn}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Link to Candidate Portal */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onSwitchToCandidate}
            className="text-xs text-[#2368f5] hover:underline font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>{t.adminAuth.switchToCandidateLink}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
