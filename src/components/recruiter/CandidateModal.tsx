import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  UserPlus,
  Mars,
  Venus,
  Briefcase,
  Layers,
  Edit3,
  Keyboard,
  FileSpreadsheet,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import { getLocalizedArea } from '../../utils/areaLocalization';
import { resolveCandidateGender } from '../../utils/genderHelper';
import { CustomSelect } from '../common/CustomSelect';
import type { Candidate } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  candidateToEdit?: Candidate | null;
}

export const CandidateModal: React.FC<Props> = ({ isOpen, onClose, candidateToEdit }) => {
  const {
    createCandidate,
    updateCandidate,
    areas,
    typingTemplates,
    excelAssessments,
    t,
    language,
  } = useApp();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [secondaryAreas, setSecondaryAreas] = useState<string[]>([]);
  const [selectedClassification, setSelectedClassification] = useState('');
  const [isCustomRole, setIsCustomRole] = useState(false);
  const [customRoleText, setCustomRoleText] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [showTempPass, setShowTempPass] = useState(false);

  // Typing and Excel toggles
  const [typingEnabled, setTypingEnabled] = useState(false);
  const [typingTemplateId, setTypingTemplateId] = useState('');
  const [excelEnabled, setExcelEnabled] = useState(false);
  const [excelAssessmentIds, setExcelAssessmentIds] = useState<string[]>([]);

  // Initialize or prefill fields when modal opens or candidateToEdit changes
  useEffect(() => {
    if (isOpen) {
      if (candidateToEdit) {
        setName(candidateToEdit.name);
        setEmail(candidateToEdit.email);
        const resolvedGender = resolveCandidateGender(candidateToEdit);
        setGender(resolvedGender);
        setTemporaryPassword(candidateToEdit.temporaryPassword || candidateToEdit.customPassword || 'SEU-temp-101');

        const candArea = candidateToEdit.area || (areas.length > 0 ? areas[0].name : '');
        setSelectedArea(candArea);
        setSecondaryAreas(candidateToEdit.secondaryAreas || []);

        const areaObj = areas.find(a => a.name === candArea);
        const cls = areaObj?.classifications || [];
        if (cls.includes(candidateToEdit.roleApplied)) {
          setSelectedClassification(candidateToEdit.roleApplied);
          setIsCustomRole(false);
          setCustomRoleText('');
        } else {
          setSelectedClassification('');
          setIsCustomRole(true);
          setCustomRoleText(candidateToEdit.roleApplied || '');
        }

        setTypingEnabled(Boolean(candidateToEdit.typingEnabled));
        setTypingTemplateId(
          candidateToEdit.typingTemplateId || (typingTemplates[0]?.id || '')
        );
        setExcelEnabled(Boolean(candidateToEdit.excelEnabled));
        setExcelAssessmentIds(candidateToEdit.excelAssessmentIds || []);
      } else {
        setName('');
        setEmail('');
        setTemporaryPassword(`SEU-temp-${Math.floor(1000 + Math.random() * 9000)}`);
        setGender('male');
        setCustomRoleText('');
        setIsCustomRole(false);
        setSecondaryAreas([]);
        setTypingEnabled(false);
        setTypingTemplateId(typingTemplates[0]?.id || '');
        setExcelEnabled(false);
        setExcelAssessmentIds([]);

        if (areas.length > 0) {
          const initialArea = areas[0].name;
          setSelectedArea(initialArea);
          const areaObj = areas.find(a => a.name === initialArea);
          const cls = areaObj?.classifications || [];
          if (cls.length > 0) {
            setSelectedClassification(cls[0]);
            setIsCustomRole(false);
          } else {
            setSelectedClassification('');
            setIsCustomRole(true);
          }
        }
      }
    }
  }, [isOpen, candidateToEdit, areas]);

  // Handle area change
  const handleAreaChange = (newAreaName: string) => {
    setSelectedArea(newAreaName);
    setSecondaryAreas(prev => prev.filter(a => a !== newAreaName));
    const areaObj = areas.find(a => a.name === newAreaName);
    const cls = areaObj?.classifications || [];
    if (cls.length > 0) {
      setSelectedClassification(cls[0]);
      setIsCustomRole(false);
    } else {
      setSelectedClassification('');
      setIsCustomRole(true);
    }
  };

  if (!isOpen) return null;

  const currentAreaObj = areas.find(a => a.name === selectedArea);
  const availableClassifications = currentAreaObj?.classifications || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const finalRole = isCustomRole ? customRoleText.trim() : selectedClassification;

    if (candidateToEdit) {
      await updateCandidate(candidateToEdit.id, {
        name: name.trim(),
        email: email.trim(),
        area: selectedArea,
        secondaryAreas,
        roleApplied: finalRole || 'General Applicant',
        gender,
        typingEnabled,
        typingTemplateId: typingEnabled ? typingTemplateId : undefined,
        excelEnabled,
        excelAssessmentIds: excelEnabled ? excelAssessmentIds : [],
        temporaryPassword: temporaryPassword.trim() || undefined,
      });
    } else {
      await createCandidate({
        name: name.trim(),
        email: email.trim(),
        area: selectedArea,
        secondaryAreas,
        roleApplied: finalRole || 'General Applicant',
        gender,
        typingEnabled,
        typingTemplateId: typingEnabled ? typingTemplateId : undefined,
        excelEnabled,
        excelAssessmentIds: excelEnabled ? excelAssessmentIds : [],
        temporaryPassword: temporaryPassword.trim() || undefined,
      });
    }

    setName('');
    setEmail('');
    setCustomRoleText('');
    setIsCustomRole(false);
    setSecondaryAreas([]);
    setGender('male');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 border border-slate-200 shadow-2xl max-h-[92vh] overflow-y-auto my-auto">
        <div className="flex items-start justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2368f5] flex items-center justify-center shrink-0">
              {candidateToEdit ? <Edit3 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {candidateToEdit
                  ? t.recruiter.createCandidateModal.editTitle
                  : t.recruiter.createCandidateModal.title}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {candidateToEdit
                  ? t.recruiter.createCandidateModal.editSubtitle
                  : t.recruiter.createCandidateModal.subtitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              {t.recruiter.createCandidateModal.fieldName} *
            </label>
            <input
              type="text"
              required
              placeholder={t.recruiter.createCandidateModal.namePlaceholder}
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#2368f5]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              {t.recruiter.createCandidateModal.fieldEmail} *
            </label>
            <input
              type="email"
              required
              placeholder={t.recruiter.createCandidateModal.emailPlaceholder}
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#2368f5]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              {language === 'es' ? 'Contraseña Temporal de Acceso' : 'Initial Temporary Password'}
            </label>
            <div className="relative">
              <input
                type={showTempPass ? 'text' : 'password'}
                value={temporaryPassword}
                onChange={e => setTemporaryPassword(e.target.value)}
                className="w-full text-xs font-mono p-2.5 pr-9 rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#2368f5]"
                placeholder="ej. SEU-temp-101"
              />
              <button
                type="button"
                onClick={() => setShowTempPass(prev => !prev)}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showTempPass ? (language === 'es' ? 'Ocultar' : 'Hide') : (language === 'es' ? 'Mostrar' : 'Show')}
              >
                {showTempPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {language === 'es'
                ? 'El postulante recibirá esta clave por correo y podrá conservarla o cambiarla al acceder.'
                : 'Candidate will receive this password via email and can keep or change it upon entry.'}
            </p>
          </div>

          {/* Primary Area Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#2368f5]" />
              <span>{t.recruiter.createCandidateModal.fieldArea} *</span>
            </label>
            <CustomSelect
              value={selectedArea}
              onChange={val => handleAreaChange(val)}
              className="w-full"
              options={areas.map(a => ({
                value: a.name,
                label: getLocalizedArea(a.name, language),
              }))}
            />
          </div>

          {/* Secondary Areas / Additional Departments Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>{t.recruiter.createCandidateModal.secondaryAreasLabel}</span>
            </label>

            <CustomSelect
              value=""
              onChange={val => {
                if (val && !secondaryAreas.includes(val) && val !== selectedArea) {
                  setSecondaryAreas(prev => [...prev, val]);
                }
              }}
              placeholder={t.recruiter.createCandidateModal.selectSecondaryAreaPlaceholder}
              className="w-full"
              options={areas
                .filter(a => a.name !== selectedArea && !secondaryAreas.includes(a.name))
                .map(a => ({
                  value: a.name,
                  label: getLocalizedArea(a.name, language),
                }))}
            />

            {/* Badges with X */}
            {secondaryAreas.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl max-h-28 overflow-y-auto">
                {secondaryAreas.map(secArea => (
                  <span
                    key={secArea}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs"
                  >
                    <span className="truncate max-w-[180px] sm:max-w-none">{getLocalizedArea(secArea, language)}</span>
                    <button
                      type="button"
                      onClick={() => setSecondaryAreas(prev => prev.filter(a => a !== secArea))}
                      className="text-indigo-400 hover:text-indigo-700 cursor-pointer shrink-0"
                      title="Remove department"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic mt-1.5">
                {t.recruiter.createCandidateModal.noSecondaryAreas}
              </p>
            )}
          </div>

          {/* Sub-area / Classification Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-[#2368f5]" />
              <span>{t.recruiter.createCandidateModal.fieldRole} *</span>
            </label>

            <CustomSelect
              value={isCustomRole ? '__custom__' : selectedClassification}
              onChange={val => {
                if (val === '__custom__') {
                  setIsCustomRole(true);
                } else {
                  setIsCustomRole(false);
                  setSelectedClassification(val);
                }
              }}
              className="w-full"
              options={[
                ...availableClassifications.map(item => ({
                  value: item,
                  label: item,
                })),
                {
                  value: '__custom__',
                  label: t.recruiter.createCandidateModal.customRoleOption,
                },
              ]}
            />

            {isCustomRole && (
              <input
                type="text"
                required
                placeholder={t.recruiter.createCandidateModal.customRolePlaceholder}
                value={customRoleText}
                onChange={e => setCustomRoleText(e.target.value)}
                className="w-full text-xs p-2.5 mt-2 rounded-xl border border-blue-300 bg-blue-50/20 focus:outline-none focus:ring-1 focus:ring-[#2368f5]"
              />
            )}
          </div>

          {/* Gender Selection: Mars (Male) & Venus (Female) Icons */}
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              {t.recruiter.createCandidateModal.fieldGender} *
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`py-2.5 px-3 min-h-[44px] rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  gender === 'male'
                    ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs ring-1 ring-blue-500'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Mars className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{t.recruiter.createCandidateModal.genderMale}</span>
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`py-2.5 px-3 min-h-[44px] rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  gender === 'female'
                    ? 'bg-purple-50 border-purple-500 text-purple-700 shadow-xs ring-1 ring-purple-500'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Venus className="w-4 h-4 text-purple-600 shrink-0" />
                <span>{t.recruiter.createCandidateModal.genderFemale}</span>
              </button>
            </div>
          </div>

          {/* Practical Assessment Modalities: Typing & Excel Toggles */}
          <div className="pt-2 border-t border-slate-200 space-y-3">
            {/* Typing Test Toggle */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Keyboard className="w-4 h-4 text-[#2368f5]" />
                  <span>{t.recruiter.createCandidateModal.enableTypingLabel}</span>
                </span>
                <input
                  type="checkbox"
                  checked={typingEnabled}
                  onChange={e => setTypingEnabled(e.target.checked)}
                  className="w-4 h-4 text-[#2368f5] rounded-md border-slate-300 focus:ring-[#2368f5] cursor-pointer"
                />
              </label>

              {typingEnabled && (
                <div className="pt-1">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {t.recruiter.createCandidateModal.selectTypingTemplate}
                  </label>
                  <CustomSelect
                    value={typingTemplateId}
                    onChange={val => setTypingTemplateId(val)}
                    className="w-full"
                    options={typingTemplates.map(tmp => ({
                      value: tmp.id,
                      label: `${tmp.title} (${tmp.language.toUpperCase()})`,
                    }))}
                  />
                </div>
              )}
            </div>

            {/* Excel Practical Tasks Toggle */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>{t.recruiter.createCandidateModal.enableExcelLabel}</span>
                </span>
                <input
                  type="checkbox"
                  checked={excelEnabled}
                  onChange={e => {
                    const checked = e.target.checked;
                    setExcelEnabled(checked);
                    if (checked && excelAssessmentIds.length === 0 && excelAssessments.length > 0) {
                      setExcelAssessmentIds([excelAssessments[0].id]);
                    }
                  }}
                  className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
              </label>

              {excelEnabled && (
                <div className="pt-1 space-y-1.5">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {t.recruiter.createCandidateModal.selectExcelTasks}
                  </label>
                  <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
                    {excelAssessments.map(task => {
                      const isTaskChecked = excelAssessmentIds.includes(task.id);
                      return (
                        <div
                          key={task.id}
                          onClick={() => {
                            setExcelAssessmentIds(prev =>
                              prev.includes(task.id)
                                ? prev.filter(id => id !== task.id)
                                : [...prev, task.id]
                            );
                          }}
                          className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer text-xs transition-colors ${
                            isTaskChecked
                              ? 'bg-emerald-50/70 border-emerald-500 text-emerald-950 font-semibold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate">{task.title}</span>
                          {isTaskChecked && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1.5" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              className="w-full sm:flex-1 py-2.5 text-xs font-bold bg-[#2368f5] text-white rounded-xl hover:bg-[#144cc0] transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              {candidateToEdit ? <Edit3 className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>
                {candidateToEdit
                  ? t.recruiter.createCandidateModal.saveChangesBtn
                  : t.recruiter.createCandidateModal.saveBtn}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
