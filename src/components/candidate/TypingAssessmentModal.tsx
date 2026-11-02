import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import type { TypingAssignment, TypingTemplate, TypingLevel } from '../../types';
import {
  Keyboard,
  Clock,
  CheckCircle2,
  Award,
  Zap,
  Shield,
  LogOut,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  assignment: TypingAssignment;
  template: TypingTemplate;
  onClose: () => void;
  onComplete?: () => void;
}

export const TypingAssessmentModal: React.FC<Props> = ({
  isOpen,
  assignment,
  template,
  onClose,
  onComplete,
}) => {
  const { submitTypingTest, t, language } = useApp();

  const totalDuration = template.targetDurationSeconds || 60;
  const targetText = template.text;

  const [userInput, setUserInput] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(totalDuration);
  const [hasStarted, setHasStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [finalStats, setFinalStats] = useState<{
    netWpm: number;
    grossWpm: number;
    accuracy: number;
    errorsCount: number;
    level: TypingLevel;
  } | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const textDisplayRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<any>(null);

  // Focus input automatically on open
  useEffect(() => {
    if (isOpen && !isFinished) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, isFinished]);

  // Reset if assignment/template changes
  useEffect(() => {
    if (isOpen) {
      setUserInput('');
      setTimeRemaining(totalDuration);
      setHasStarted(false);
      setIsFinished(false);
      setFinalStats(null);
    }
  }, [isOpen, assignment.id, template.id]);

  // Timer Countdown
  useEffect(() => {
    if (hasStarted && !isFinished) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            finishAssessment();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasStarted, isFinished]);

  // Live Metrics Calculation
  const liveStats = useMemo(() => {
    let correct = 0;
    let errors = 0;

    for (let i = 0; i < userInput.length; i++) {
      if (userInput[i] === targetText[i]) {
        correct++;
      } else {
        errors++;
      }
    }

    const elapsedSeconds = Math.max(1, totalDuration - timeRemaining);
    const elapsedMinutes = elapsedSeconds / 60;

    // Gross WPM = (Total Typed Characters / 5) / elapsedMinutes
    const grossWpm = Math.round((userInput.length / 5) / elapsedMinutes);
    // Accuracy % = (Correct Characters / Total Typed Characters) * 100
    const accuracy = userInput.length > 0 ? Math.round((correct / userInput.length) * 100) : 100;
    // Net WPM = Max(0, Gross WPM - (Errors / elapsedMinutes))
    const netWpm = Math.max(0, Math.round(grossWpm - (errors / elapsedMinutes)));

    return {
      correct,
      errors,
      grossWpm,
      accuracy,
      netWpm,
    };
  }, [userInput, targetText, timeRemaining, totalDuration]);

  // Handle typing input
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (isFinished) return;

    const val = e.target.value;

    if (!hasStarted && val.length > 0) {
      setHasStarted(true);
    }

    // Limit to target length
    if (val.length <= targetText.length) {
      setUserInput(val);

      // Auto-finish if complete passage is typed
      if (val.length === targetText.length) {
        finishAssessment(val);
      }
    }
  };

  const finishAssessment = async (finalInputVal?: string) => {
    if (isFinished) return;
    setIsFinished(true);
    if (timerRef.current) clearInterval(timerRef.current);

    const inputToScore = finalInputVal !== undefined ? finalInputVal : userInput;

    let correct = 0;
    let errors = 0;
    for (let i = 0; i < inputToScore.length; i++) {
      if (inputToScore[i] === targetText[i]) {
        correct++;
      } else {
        errors++;
      }
    }

    const elapsedSeconds = Math.max(1, totalDuration - timeRemaining);
    const elapsedMinutes = elapsedSeconds / 60;
    const grossWpm = Math.round((inputToScore.length / 5) / elapsedMinutes);
    const accuracy = inputToScore.length > 0 ? Math.round((correct / inputToScore.length) * 100) : 100;
    const netWpm = Math.max(0, Math.round(grossWpm - (errors / elapsedMinutes)));

    // 3 Performance Levels
    let level: TypingLevel = 'basic';
    if (netWpm >= 55 && accuracy >= 96) {
      level = 'advanced';
    } else if (netWpm >= 35 && accuracy >= 92) {
      level = 'intermediate';
    } else {
      level = 'basic';
    }

    const calculated = {
      netWpm,
      grossWpm,
      accuracy,
      errorsCount: errors,
      level,
    };

    setFinalStats(calculated);

    try {
      await submitTypingTest(assignment.id, calculated);
      if (onComplete) onComplete();
    } catch (err) {
      console.error('Error submitting typing test:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div
        className="bg-white rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-6"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#2368f5] flex items-center justify-center font-bold">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2368f5] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                1-Minute Speed Benchmark
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                {template.title}
              </h2>
            </div>
          </div>

          {/* Live Timer Pill */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-bold text-xs sm:text-sm shadow-2xs transition-colors ${
              timeRemaining <= 10
                ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                : timeRemaining <= 20
                ? 'bg-amber-50 text-amber-700 border-amber-300'
                : 'bg-white text-slate-800 border-slate-200'
            }`}
          >
            <Clock className="w-4 h-4 text-[#2368f5]" />
            <span>
              {String(Math.floor(timeRemaining / 60)).padStart(2, '0')}:
              {String(timeRemaining % 60).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Live Metrics Bar during test */}
        {!isFinished && (
          <div className="grid grid-cols-3 gap-2 px-6 py-3 bg-slate-50/50 border-b border-slate-100 text-center">
            <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">
                {t.recruiter.typing.colNetWpm}
              </span>
              <span className="text-lg font-black font-mono text-[#2368f5]">
                {liveStats.netWpm}
              </span>
            </div>
            <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">
                {t.recruiter.typing.colAccuracy}
              </span>
              <span className="text-lg font-black font-mono text-emerald-600">
                {liveStats.accuracy}%
              </span>
            </div>
            <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">
                {t.recruiter.typing.colErrors}
              </span>
              <span className="text-lg font-black font-mono text-rose-600">
                {liveStats.errors}
              </span>
            </div>
          </div>
        )}

        {/* Body: Active Typing Engine or Scorecard View */}
        {!isFinished ? (
          <div className="p-6 space-y-4">
            {!hasStarted && (
              <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 text-xs text-blue-800 flex items-center gap-2">
                <Keyboard className="w-4 h-4 text-[#2368f5] shrink-0" />
                <span>
                  {(() => {
                    const durationMin = Math.round(totalDuration / 60);
                    const durationLabel = durationMin >= 1
                      ? `${durationMin} ${language === 'es' ? (durationMin === 1 ? 'minuto' : 'minutos') : (durationMin === 1 ? 'minute' : 'minutes')}`
                      : `${totalDuration} ${language === 'es' ? 'segundos' : 'seconds'}`;
                    return language === 'es'
                      ? `Haz clic en el cuadro y comienza a teclear. El temporizador (${durationLabel}) iniciará con tu primera pulsación.`
                      : `Click in the box and start typing. The ${durationLabel} countdown will begin upon your first keystroke.`;
                  })()}
                </span>
              </div>
            )}

            {/* Interactive Passage Display with Character Color Highlights */}
            <div
              ref={textDisplayRef}
              onClick={() => inputRef.current?.focus()}
              className="p-5 rounded-2xl bg-slate-50 border-2 border-slate-200 focus-within:border-[#2368f5] transition-all font-mono text-sm leading-loose tracking-wide cursor-text max-h-60 overflow-y-auto select-none"
            >
              {targetText.split('').map((char, index) => {
                const isTyped = index < userInput.length;
                const isCurrent = index === userInput.length;
                const isMatch = isTyped && userInput[index] === char;
                const isError = isTyped && userInput[index] !== char;

                return (
                  <span
                    key={index}
                    className={`${
                      isCurrent
                        ? 'bg-[#2368f5] text-white rounded-xs px-0.5 animate-pulse font-bold'
                        : isMatch
                        ? 'text-emerald-700 bg-emerald-50/80 font-bold'
                        : isError
                        ? 'text-rose-700 bg-rose-100 rounded-xs underline font-bold'
                        : 'text-slate-500'
                    }`}
                  >
                    {char}
                  </span>
                );
              })}
            </div>

            {/* Hidden / Real Input Area capturing user typing */}
            <div className="relative">
              <textarea
                ref={inputRef}
                value={userInput}
                onChange={handleInputChange}
                disabled={isFinished}
                rows={3}
                placeholder={
                  language === 'es'
                    ? 'Escribe aquí el texto que ves arriba...'
                    : 'Type the passage here...'
                }
                className="w-full text-xs font-mono p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#2368f5]/20 focus:border-[#2368f5] text-slate-800 resize-none"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </div>
          </div>
        ) : (
          /* Finished Scorecard Screen */
          <div className="p-6 sm:p-8 space-y-6 text-center animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Official SkillProof Speed Certificate
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                {language === 'es' ? 'Prueba de Mecanografía Finalizada' : 'Typing Assessment Completed'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {assignment.candidateName} • {assignment.candidateEmail}
              </p>
            </div>

            {/* Main Score & Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  {t.recruiter.typing.colNetWpm}
                </span>
                <span className="text-3xl font-black font-mono text-[#2368f5]">
                  {finalStats?.netWpm ?? 0}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  WPM (Score)
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  {t.recruiter.typing.colAccuracy}
                </span>
                <span className="text-3xl font-black font-mono text-emerald-700">
                  {finalStats?.accuracy ?? 0}%
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Precision Rate
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  {t.recruiter.typing.colGrossWpm}
                </span>
                <span className="text-3xl font-black font-mono text-slate-800">
                  {finalStats?.grossWpm ?? 0}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Gross Keying
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">
                  {t.recruiter.typing.colErrors}
                </span>
                <span className="text-3xl font-black font-mono text-rose-600">
                  {finalStats?.errorsCount ?? 0}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Uncorrected
                </span>
              </div>
            </div>

            {/* Performance Level Badge Banner */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="text-left">
                <span className="text-xs font-bold text-slate-700 block">
                  {t.recruiter.typing.colLevel}
                </span>
                <span className="text-[11px] text-slate-500">
                  {language === 'es' ? 'Clasificación oficial según velocidad y precisión' : 'Standardized benchmark certification tier'}
                </span>
              </div>

              <div>
                {finalStats?.level === 'advanced' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <Award className="w-4 h-4 text-emerald-600" />
                    <span>{t.recruiter.typing.levelAdvanced}</span>
                  </span>
                ) : finalStats?.level === 'intermediate' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-blue-100 text-blue-800 border border-blue-300">
                    <Zap className="w-4 h-4 text-[#2368f5]" />
                    <span>{t.recruiter.typing.levelIntermediate}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs bg-amber-100 text-amber-800 border border-amber-300">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span>{t.recruiter.typing.levelBasic}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Exit to Lobby Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3.5 bg-[#2368f5] hover:bg-[#144cc0] text-white text-xs font-bold rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{language === 'es' ? 'Finalizar y Volver al Portal' : 'Finish & Return to Portal'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
