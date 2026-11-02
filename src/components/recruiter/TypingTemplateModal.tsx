import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Keyboard, CheckCircle2, Shield, Zap, Award } from 'lucide-react';
import { CustomSelect } from '../common/CustomSelect';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const TypingTemplateModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { createTypingTemplate, t, language } = useApp();

  const [title, setTitle] = useState('');
  const [templateLang, setTemplateLang] = useState<'en' | 'es'>(language);
  const [difficulty, setDifficulty] = useState<1 | 2 | 3>(2);
  const [durationSeconds, setDurationSeconds] = useState<number>(180); // default 3 minutes (180s)
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanText = text.trim();
    if (cleanText.length < 50) {
      setErrorMsg(
        language === 'es'
          ? 'El texto de referencia debe tener al menos 50 caracteres para una prueba válida.'
          : 'The text passage must contain at least 50 characters for a valid test.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await createTypingTemplate({
        title: title.trim(),
        language: templateLang,
        difficulty,
        targetDurationSeconds: durationSeconds,
        text: cleanText,
      });

      // Reset and close
      setTitle('');
      setText('');
      setDifficulty(2);
      setDurationSeconds(180);
      onClose();
    } catch (err) {
      console.error('Error creating typing template:', err);
      setErrorMsg('Failed to save typing template.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div
        className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#2368f5] flex items-center justify-center">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                {t.recruiter.typing.templatesModalTitle}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'es'
                  ? 'Define el texto estandarizado para la prueba de mecanografía y velocidad'
                  : 'Define the standardized passage for benchmark typing speed testing'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200/50 transition-colors cursor-pointer"
            title={t.common.cancel}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              {t.recruiter.typing.fieldTitle}
            </label>
            <input
              type="text"
              required
              placeholder={t.recruiter.typing.fieldTitlePlaceholder}
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#2368f5] font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                {t.recruiter.typing.fieldLanguage}
              </label>
              <CustomSelect
                value={templateLang}
                onChange={val => setTemplateLang(val as 'en' | 'es')}
                className="w-full"
                searchable={false}
                options={[
                  { value: 'en', label: 'English' },
                  { value: 'es', label: 'Español' },
                ]}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 mb-1">
                {t.recruiter.typing.fieldDifficulty}
              </label>
              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                {[
                  { id: 1, label: 'L1', name: t.recruiter.typing.levelBasic, icon: Shield },
                  { id: 2, label: 'L2', name: t.recruiter.typing.levelIntermediate, icon: Zap },
                  { id: 3, label: 'L3', name: t.recruiter.typing.levelAdvanced, icon: Award },
                ].map(lvl => {
                  const isSelected = difficulty === lvl.id;
                  const Icon = lvl.icon;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setDifficulty(lvl.id as 1 | 2 | 3)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#2368f5] text-white border-[#2368f5] shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                      title={lvl.name}
                    >
                      <Icon className="w-3 h-3" />
                      <span>{lvl.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Duration Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              {language === 'es' ? 'Duración de la Prueba (Tiempo Límite):' : 'Test Duration (Time Limit):'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { sec: 60, label: language === 'es' ? '1 Minuto' : '1 Minute' },
                { sec: 120, label: language === 'es' ? '2 Minutos' : '2 Minutes' },
                { sec: 180, label: language === 'es' ? '3 Minutos' : '3 Minutes', badge: language === 'es' ? 'Recomendado' : 'Recommended' },
                { sec: 300, label: language === 'es' ? '5 Minutos' : '5 Minutes' },
              ].map(opt => (
                <button
                  key={opt.sec}
                  type="button"
                  onClick={() => setDurationSeconds(opt.sec)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                    durationSeconds === opt.sec
                      ? 'bg-[#2368f5] text-white border-[#2368f5] shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span>{opt.label}</span>
                  {opt.badge && (
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                      durationSeconds === opt.sec ? 'bg-white/20 text-white' : 'bg-blue-50 text-[#2368f5]'
                    }`}>
                      {opt.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-800">
                {t.recruiter.typing.fieldText}
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {wordCount} {language === 'es' ? 'palabras' : 'words'} • {text.length} {language === 'es' ? 'caracteres' : 'chars'}
              </span>
            </div>
            <textarea
              required
              rows={6}
              placeholder={t.recruiter.typing.fieldTextPlaceholder}
              value={text}
              onChange={e => setText(e.target.value)}
              className="w-full text-xs p-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#2368f5] font-sans leading-relaxed text-slate-700"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !text.trim()}
              className="px-5 py-2.5 bg-[#2368f5] hover:bg-[#144cc0] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t.recruiter.typing.saveTemplateBtn}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
