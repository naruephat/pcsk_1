import React, { useState } from 'react';
import {
  PlanTypeDeadlineConfig,
  PlanStatusConfig,
  StatusColor,
  LessonPlan,
} from '../types';
import {
  formatThaiDateTime,
  formatDeadlineRange,
  getStatusStyle,
  getPlanStatusInfo,
  constructDateTime,
  DEFAULT_DEADLINE_CONFIGS,
  DEFAULT_STATUS_CONFIGS,
} from '../utils/deadlineUtils';
import {
  X,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Save,
  Tag,
  ShieldCheck,
  Layers,
  Sparkles,
  Info,
  HelpCircle,
  Check,
  Search,
} from 'lucide-react';

interface DeadlineManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  deadlineConfigs: PlanTypeDeadlineConfig[];
  onSaveDeadlineConfigs: (configs: PlanTypeDeadlineConfig[]) => void;
  statusConfigs: PlanStatusConfig[];
  onSaveStatusConfigs: (configs: PlanStatusConfig[]) => void;
  plans: LessonPlan[];
  onUpdatePlanStatus?: (planId: string, newStatus: string, isLate?: boolean, adminNotes?: string) => Promise<void> | void;
}

const COLOR_OPTIONS: { id: StatusColor; name: string; bg: string }[] = [
  { id: 'amber', name: 'สีส้มอำพัน (Amber)', bg: 'bg-amber-500' },
  { id: 'emerald', name: 'สีเขียวมรกต (Emerald)', bg: 'bg-emerald-500' },
  { id: 'rose', name: 'สีแดงกุหลาบ (Rose)', bg: 'bg-rose-500' },
  { id: 'orange', name: 'สีส้มสด (Orange)', bg: 'bg-orange-500' },
  { id: 'indigo', name: 'สีน้ำเงินคราม (Indigo)', bg: 'bg-indigo-500' },
  { id: 'sky', name: 'สีฟ้ากระจ่าง (Sky)', bg: 'bg-sky-500' },
  { id: 'purple', name: 'สีม่วง (Purple)', bg: 'bg-purple-500' },
  { id: 'slate', name: 'สีเทาสุภาพ (Slate)', bg: 'bg-slate-500' },
];

export const DeadlineManagerModal: React.FC<DeadlineManagerModalProps> = ({
  isOpen,
  onClose,
  deadlineConfigs,
  onSaveDeadlineConfigs,
  statusConfigs,
  onSaveStatusConfigs,
  plans,
  onUpdatePlanStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'deadlines' | 'statuses' | 'plans'>('deadlines');

  // Deadlines state
  const [deadlines, setDeadlines] = useState<PlanTypeDeadlineConfig[]>([...deadlineConfigs]);
  const [editingDeadlineId, setEditingDeadlineId] = useState<string | null>(null);
  const [newDeadline, setNewDeadline] = useState<Partial<PlanTypeDeadlineConfig>>({
    name: '',
    description: '',
    academic_year: '2569',
    semester: '1',
    start_date: new Date().toISOString().split('T')[0],
    start_time: '08:30',
    end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_time: '16:30',
    allow_late: true,
    is_active: true,
    notes: '',
  });
  const [isAddingDeadline, setIsAddingDeadline] = useState(false);

  // Statuses state
  const [statuses, setStatuses] = useState<PlanStatusConfig[]>([...statusConfigs]);
  const [newStatus, setNewStatus] = useState<Partial<PlanStatusConfig>>({
    id: '',
    label: '',
    color: 'indigo',
    description: '',
  });
  const [isAddingStatus, setIsAddingStatus] = useState(false);

  // Quick Plan status editor
  const [planSearch, setPlanSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [updatingPlanId, setUpdatingPlanId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Save deadlines
  const handleSaveDeadlines = (updatedList: PlanTypeDeadlineConfig[]) => {
    setDeadlines(updatedList);
    onSaveDeadlineConfigs(updatedList);
  };

  // Add new deadline config
  const handleAddNewDeadline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeadline.name?.trim()) return;

    const id = `type_${Date.now()}`;
    const item: PlanTypeDeadlineConfig = {
      id,
      name: newDeadline.name.trim(),
      description: newDeadline.description?.trim() || '',
      academic_year: newDeadline.academic_year || '2569',
      semester: newDeadline.semester || '1',
      start_date: newDeadline.start_date || new Date().toISOString().split('T')[0],
      start_time: newDeadline.start_time || '08:30',
      end_date: newDeadline.end_date || new Date().toISOString().split('T')[0],
      end_time: newDeadline.end_time || '16:30',
      allow_late: newDeadline.allow_late ?? true,
      is_active: newDeadline.is_active ?? true,
      notes: newDeadline.notes?.trim() || '',
    };

    const nextList = [...deadlines, item];
    handleSaveDeadlines(nextList);
    setIsAddingDeadline(false);
    setNewDeadline({
      name: '',
      description: '',
      academic_year: '2569',
      semester: '1',
      start_date: new Date().toISOString().split('T')[0],
      start_time: '08:30',
      end_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end_time: '16:30',
      allow_late: true,
      is_active: true,
      notes: '',
    });
  };

  const handleDeleteDeadline = (id: string) => {
    if (deadlines.length <= 1) {
      alert('ต้องมีประเภทเอกสารและกำหนดส่งอย่างน้อย 1 ประเภทในระบบ');
      return;
    }
    const filtered = deadlines.filter((d) => d.id !== id);
    handleSaveDeadlines(filtered);
  };

  const handleUpdateDeadlineItem = (id: string, updates: Partial<PlanTypeDeadlineConfig>) => {
    const updated = deadlines.map((d) => (d.id === id ? { ...d, ...updates } : d));
    handleSaveDeadlines(updated);
  };

  // Status management
  const handleSaveStatuses = (updatedList: PlanStatusConfig[]) => {
    setStatuses(updatedList);
    onSaveStatusConfigs(updatedList);
  };

  const handleAddNewStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatus.label?.trim()) return;

    const id = (newStatus.id?.trim() || `custom_${Date.now()}`).toLowerCase().replace(/\s+/g, '_');
    const existing = statuses.find((s) => s.id === id);
    if (existing) {
      alert('มีรหัสสถานะนี้ในระบบแล้ว กรุณาใช้รหัสอื่น');
      return;
    }

    const item: PlanStatusConfig = {
      id,
      label: newStatus.label.trim(),
      color: (newStatus.color as StatusColor) || 'indigo',
      description: newStatus.description?.trim() || '',
      is_system: false,
    };

    const nextList = [...statuses, item];
    handleSaveStatuses(nextList);
    setIsAddingStatus(false);
    setNewStatus({
      id: '',
      label: '',
      color: 'indigo',
      description: '',
    });
  };

  const handleUpdateStatusItem = (id: string, updates: Partial<PlanStatusConfig>) => {
    const nextList = statuses.map((s) => (s.id === id ? { ...s, ...updates } : s));
    handleSaveStatuses(nextList);
  };

  const handleDeleteStatus = (id: string) => {
    const target = statuses.find((s) => s.id === id);
    if (target?.is_system && ['submitted', 'approved', 'needs_revision'].includes(id)) {
      alert('ไม่สามารถลบสถานะหลักของระบบได้ แต่ท่านสามารถแก้ไขชื่อและสีของสถานะนี้ได้');
      return;
    }
    const nextList = statuses.filter((s) => s.id !== id);
    handleSaveStatuses(nextList);
  };

  // Quick Plan Status change
  const handlePlanStatusChange = async (plan: LessonPlan, newStatusVal: string) => {
    if (!onUpdatePlanStatus) return;
    setUpdatingPlanId(plan.id);
    try {
      await onUpdatePlanStatus(plan.id, newStatusVal, plan.is_late, plan.admin_notes);
    } finally {
      setUpdatingPlanId(null);
    }
  };

  const handleTogglePlanLate = async (plan: LessonPlan) => {
    if (!onUpdatePlanStatus) return;
    setUpdatingPlanId(plan.id);
    try {
      const nextLate = !plan.is_late;
      await onUpdatePlanStatus(plan.id, plan.status, nextLate, plan.admin_notes);
    } finally {
      setUpdatingPlanId(null);
    }
  };

  // Filter plans for Tab 3
  const filteredPlans = plans.filter((p) => {
    if (planFilter === 'late' && !p.is_late) return false;
    if (planFilter !== 'all' && planFilter !== 'late' && p.status !== planFilter) return false;
    if (planSearch.trim()) {
      const q = planSearch.toLowerCase();
      const matchSub = p.subject_code.toLowerCase().includes(q) || p.subject_name.toLowerCase().includes(q);
      const matchTeach = p.teacher_name.toLowerCase().includes(q) || p.teacher_id.toLowerCase().includes(q);
      const matchTitle = p.plan_title.toLowerCase().includes(q);
      return matchSub || matchTeach || matchTitle;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 p-6 text-white shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0 shadow-inner">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-md text-amber-100 border border-white/20 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-200" />
                แผงควบคุมผู้ดูแลระบบ (Admin Control Center)
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                กำหนดช่วงเวลาและวันส่งงาน & จัดการสถานะทั้งหมด
              </h2>
              <p className="text-xs text-amber-100/90 mt-0.5">
                กำหนดเวลาส่งของแต่ละประเภทเอกสาร ควบคุมการแจ้งเตือนส่งช้า และปรับแต่งชื่อ/สีสถานะทั้งหมดในระบบได้อย่างอิสระ
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 border-t border-white/20 pt-3 overflow-x-auto">
            <button
              onClick={() => setActiveTab('deadlines')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'deadlines'
                  ? 'bg-white text-slate-900 shadow-md scale-102'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>1. กำหนดช่วงเวลาและวันส่ง ({deadlines.length} ประเภท)</span>
            </button>
            <button
              onClick={() => setActiveTab('statuses')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'statuses'
                  ? 'bg-white text-slate-900 shadow-md scale-102'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>2. จัดการสถานะทั้งหมด ({statuses.length} สถานะ)</span>
            </button>
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                activeTab === 'plans'
                  ? 'bg-white text-slate-900 shadow-md scale-102'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>3. ปรับสถานะแผนรายบุคคล ({plans.length} แผน)</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
          {/* TAB 1: DEADLINES CONFIG */}
          {activeTab === 'deadlines' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs">
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold text-amber-900">
                      ระบบคำนวณการส่งช้าอัตโนมัติ:
                    </span>
                    <span className="text-amber-800 ml-1">
                      เมื่อครูผู้สอนส่งแผนการสอนหลัง &quot;วันและเวลาสิ้นสุด (Deadline)&quot; ระบบจะติดแท็ก &quot;ส่งช้า&quot; พร้อมแสดงเวลาที่ล่าช้าโดยอัตโนมัติ และอนุญาตให้แอดมินปรับเปลี่ยนสถานะได้ทุกเมื่อ
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleSaveDeadlines(DEFAULT_DEADLINE_CONFIGS)}
                    className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    title="คืนค่าช่วงเวลาเริ่มต้นที่ระบบแนะนำ"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>คืนค่าเริ่มต้น</span>
                  </button>
                  <button
                    onClick={() => setIsAddingDeadline(!isAddingDeadline)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มประเภทเอกสารใหม่</span>
                  </button>
                </div>
              </div>

              {/* Form to Add New Deadline */}
              {isAddingDeadline && (
                <form
                  onSubmit={handleAddNewDeadline}
                  className="bg-white p-5 rounded-2xl border-2 border-amber-300 shadow-md space-y-4 animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>เพิ่มประเภทเอกสารและกำหนดเวลาส่งใหม่</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingDeadline(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ยกเลิก
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ชื่อประเภทเอกสารแผนการสอน *
                      </label>
                      <input
                        type="text"
                        required
                        value={newDeadline.name || ''}
                        onChange={(e) => setNewDeadline({ ...newDeadline, name: e.target.value })}
                        placeholder="เช่น แผนการจัดการเรียนรู้บูรณาการท้องถิ่น หรือ แผนรายสัปดาห์"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ภาคเรียน / ปีการศึกษา
                      </label>
                      <div className="flex items-center gap-2">
                        <select
                          value={newDeadline.semester || '1'}
                          onChange={(e) => setNewDeadline({ ...newDeadline, semester: e.target.value })}
                          className="px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white flex-1"
                        >
                          <option value="1">ภาคเรียนที่ 1</option>
                          <option value="2">ภาคเรียนที่ 2</option>
                        </select>
                        <input
                          type="text"
                          value={newDeadline.academic_year || '2569'}
                          onChange={(e) => setNewDeadline({ ...newDeadline, academic_year: e.target.value })}
                          placeholder="ปีการศึกษา เช่น 2569"
                          className="w-24 px-3 py-2 border border-slate-300 rounded-xl text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        คำอธิบาย / รายละเอียดประเภทเอกสาร
                      </label>
                      <input
                        type="text"
                        value={newDeadline.description || ''}
                        onChange={(e) => setNewDeadline({ ...newDeadline, description: e.target.value })}
                        placeholder="คำชี้แจงสำหรับครูผู้สอน..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                      />
                    </div>

                    {/* Start Date & Time */}
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        <span>วันและเวลาเริ่มต้นเปิดรับส่ง:</span>
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-slate-500 mb-0.5">วันที่เริ่ม</label>
                          <input
                            type="date"
                            required
                            value={newDeadline.start_date || ''}
                            onChange={(e) => setNewDeadline({ ...newDeadline, start_date: e.target.value })}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-slate-500 mb-0.5">เวลาที่เริ่ม</label>
                          <input
                            type="time"
                            required
                            value={newDeadline.start_time || '08:30'}
                            onChange={(e) => setNewDeadline({ ...newDeadline, start_time: e.target.value })}
                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* End Date & Time (Deadline) */}
                    <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-200 space-y-2">
                      <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>วันและเวลากำหนดส่ง (Deadline สิ้นสุด):</span>
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] text-rose-700 mb-0.5">วันที่กำหนดส่ง</label>
                          <input
                            type="date"
                            required
                            value={newDeadline.end_date || ''}
                            onChange={(e) => setNewDeadline({ ...newDeadline, end_date: e.target.value })}
                            className="w-full px-2.5 py-1.5 border border-rose-300 rounded-lg text-xs bg-white font-semibold text-rose-950"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-rose-700 mb-0.5">เวลากำหนดส่ง</label>
                          <input
                            type="time"
                            required
                            value={newDeadline.end_time || '16:30'}
                            onChange={(e) => setNewDeadline({ ...newDeadline, end_time: e.target.value })}
                            className="w-full px-2.5 py-1.5 border border-rose-300 rounded-lg text-xs bg-white font-semibold text-rose-950"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={newDeadline.allow_late ?? true}
                        onChange={(e) => setNewDeadline({ ...newDeadline, allow_late: e.target.checked })}
                        className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                      />
                      <span>อนุญาตให้ส่งช้าได้ (โดยระบบจะติดป้ายสถานะ &quot;ส่งช้า&quot; อัตโนมัติ)</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAddingDeadline(false)}
                        className="px-3.5 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100"
                      >
                        ยกเลิก
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-sm"
                      >
                        บันทึกประเภทเอกสารนี้
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Deadlines List */}
              <div className="space-y-4">
                {deadlines.map((dl) => {
                  const isEditing = editingDeadlineId === dl.id;
                  const deadlineDate = constructDateTime(dl.end_date, dl.end_time);
                  const isPastDeadline = Date.now() > deadlineDate.getTime();

                  return (
                    <div
                      key={dl.id}
                      className={`bg-white rounded-2xl border transition-all p-5 shadow-xs ${
                        isPastDeadline
                          ? 'border-amber-200/90 hover:border-amber-300'
                          : 'border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">
                              {dl.name}
                            </span>
                            <span className="text-xs text-slate-500 font-medium">
                              ภาคเรียนที่ {dl.semester}/{dl.academic_year}
                            </span>
                            {isPastDeadline ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertTriangle className="w-3 h-3 text-rose-600" />
                                <span>เลยกำหนดส่งแล้ว (ระบบตรวจพบส่งช้า)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>เปิดรับส่งตามกำหนด</span>
                              </span>
                            )}
                          </div>

                          {dl.description && (
                            <p className="text-xs text-slate-600">{dl.description}</p>
                          )}

                          {/* Date Range Display / Inline Edit */}
                          {!isEditing ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                                <span className="text-slate-500 block text-[11px] font-medium">
                                  วันและเวลาเริ่มต้นเปิดรับส่ง:
                                </span>
                                <span className="font-bold text-slate-800 mt-0.5 block">
                                  {formatThaiDateTime(`${dl.start_date} ${dl.start_time}`)}
                                </span>
                              </div>

                              <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 text-xs">
                                <span className="text-rose-700 block text-[11px] font-bold flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-rose-600" />
                                  <span>วันและเวลากำหนดส่ง (Deadline):</span>
                                </span>
                                <span className="font-bold text-rose-950 mt-0.5 block text-sm">
                                  {formatThaiDateTime(`${dl.end_date} ${dl.end_time}`)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 p-4 bg-amber-50/50 rounded-2xl border border-amber-200">
                              <div className="space-y-2">
                                <span className="text-xs font-bold text-slate-700">เริ่มต้นรับส่ง:</span>
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="date"
                                    value={dl.start_date}
                                    onChange={(e) =>
                                      handleUpdateDeadlineItem(dl.id, { start_date: e.target.value })
                                    }
                                    className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                                  />
                                  <input
                                    type="time"
                                    value={dl.start_time}
                                    onChange={(e) =>
                                      handleUpdateDeadlineItem(dl.id, { start_time: e.target.value })
                                    }
                                    className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                                  />
                                </div>
                              </div>

                              <div className="space-y-2">
                                <span className="text-xs font-bold text-rose-800">กำหนดส่ง (Deadline):</span>
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    type="date"
                                    value={dl.end_date}
                                    onChange={(e) =>
                                      handleUpdateDeadlineItem(dl.id, { end_date: e.target.value })
                                    }
                                    className="px-2.5 py-1.5 border border-rose-300 rounded-lg text-xs bg-white font-bold text-rose-900"
                                  />
                                  <input
                                    type="time"
                                    value={dl.end_time}
                                    onChange={(e) =>
                                      handleUpdateDeadlineItem(dl.id, { end_time: e.target.value })
                                    }
                                    className="px-2.5 py-1.5 border border-rose-300 rounded-lg text-xs bg-white font-bold text-rose-900"
                                  />
                                </div>
                              </div>

                              <div className="sm:col-span-2 pt-2 flex items-center justify-between">
                                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={dl.allow_late}
                                    onChange={(e) =>
                                      handleUpdateDeadlineItem(dl.id, { allow_late: e.target.checked })
                                    }
                                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                                  />
                                  <span>อนุญาตให้ส่งช้าได้ (ติดป้ายส่งช้า)</span>
                                </label>
                                <button
                                  onClick={() => setEditingDeadlineId(null)}
                                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>เสร็จสิ้น</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex sm:flex-col items-center gap-1.5 shrink-0 self-end sm:self-start">
                          <button
                            onClick={() => setEditingDeadlineId(isEditing ? null : dl.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1 cursor-pointer transition-colors ${
                              isEditing
                                ? 'bg-amber-100 text-amber-900 border-amber-300'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                            }`}
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>{isEditing ? 'ปิดการแก้ไข' : 'ปรับวันเวลาส่ง'}</span>
                          </button>
                          {deadlines.length > 1 && (
                            <button
                              onClick={() => handleDeleteDeadline(dl.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="ลบประเภทนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: STATUS CUSTOMIZATION */}
          {activeTab === 'statuses' && (
            <div className="space-y-6">
              <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-4 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <Tag className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold text-indigo-950">
                      ปรับแต่งสถานะที่แสดงในระบบทั้งหมด:
                    </span>
                    <span className="text-indigo-800 ml-1">
                      ท่านสามารถเปลี่ยนชื่อสถานะ (เช่น เปลี่ยนคำว่า &quot;รอตรวจ&quot; หรือ &quot;ส่งกลับแก้ไข&quot;), เปลี่ยนสีป้ายสถานะ และเพิ่มสถานะที่กำหนดเองได้ตามต้องการ
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleSaveStatuses(DEFAULT_STATUS_CONFIGS)}
                    className="px-3 py-1.5 bg-white hover:bg-indigo-100 text-indigo-900 border border-indigo-300 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>คืนค่าสถานะเริ่มต้น</span>
                  </button>
                  <button
                    onClick={() => setIsAddingStatus(!isAddingStatus)}
                    className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มสถานะใหม่</span>
                  </button>
                </div>
              </div>

              {/* Form to Add New Status */}
              {isAddingStatus && (
                <form
                  onSubmit={handleAddNewStatus}
                  className="bg-white p-5 rounded-2xl border-2 border-indigo-300 shadow-md space-y-4 animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-indigo-600" />
                      <span>เพิ่มสถานะใหม่ที่กำหนดเอง</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingStatus(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ยกเลิก
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ชื่อสถานะที่แสดงในระบบ (Label) *
                      </label>
                      <input
                        type="text"
                        required
                        value={newStatus.label || ''}
                        onChange={(e) => setNewStatus({ ...newStatus, label: e.target.value })}
                        placeholder="เช่น ตรวจแล้วรอบที่ 1 หรือ รอลงนามผู้อำนวยการ"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        รหัสสถานะภาษาอังกฤษ (System Key - ไม่บังคับ)
                      </label>
                      <input
                        type="text"
                        value={newStatus.id || ''}
                        onChange={(e) => setNewStatus({ ...newStatus, id: e.target.value })}
                        placeholder="เช่น pending_signature (เว้นว่างเพื่อสร้างอัตโนมัติ)"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        เลือกชุดสีของป้ายสถานะ (Color Theme)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {COLOR_OPTIONS.map((c) => {
                          const isSel = (newStatus.color || 'indigo') === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setNewStatus({ ...newStatus, color: c.id })}
                              className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                                isSel
                                  ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-500'
                                  : 'border-slate-200 hover:border-slate-300 bg-white'
                              }`}
                            >
                              <span className={`w-3.5 h-3.5 rounded-full ${c.bg}`}></span>
                              <span className="text-xs font-semibold text-slate-700">{c.name.split(' ')[0]}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        คำอธิบายความหมายของสถานะนี้
                      </label>
                      <input
                        type="text"
                        value={newStatus.description || ''}
                        onChange={(e) => setNewStatus({ ...newStatus, description: e.target.value })}
                        placeholder="คำชี้แจงสถานะนี้สำหรับครูผู้สอน..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingStatus(false)}
                      className="px-3.5 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-100"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-xs font-bold shadow-sm"
                    >
                      บันทึกสถานะใหม่
                    </button>
                  </div>
                </form>
              )}

              {/* Statuses Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {statuses.map((st) => {
                  const style = getStatusStyle(st.color);
                  return (
                    <div
                      key={st.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${style.badge}`}
                          >
                            <span className={`w-2 h-2 rounded-full ${style.dot}`}></span>
                            <span>{st.label}</span>
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            ({st.id})
                          </span>
                        </div>

                        {!st.is_system && (
                          <button
                            onClick={() => handleDeleteStatus(st.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                            title="ลบสถานะนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Editable Label */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-600">
                          ชื่อสถานะที่แสดง (ปรับได้อิสระ):
                        </label>
                        <input
                          type="text"
                          value={st.label}
                          onChange={(e) =>
                            handleUpdateStatusItem(st.id, { label: e.target.value })
                          }
                          className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      {/* Color Selector */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-600">
                          สีป้าย:
                        </label>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {COLOR_OPTIONS.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleUpdateStatusItem(st.id, { color: c.id })}
                              className={`w-6 h-6 rounded-lg ${c.bg} flex items-center justify-center transition-transform cursor-pointer ${
                                st.color === c.id
                                  ? 'ring-2 ring-offset-1 ring-slate-800 scale-110 shadow-sm'
                                  : 'opacity-60 hover:opacity-100 hover:scale-105'
                              }`}
                              title={c.name}
                            >
                              {st.color === c.id && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-bold text-slate-600">
                          คำอธิบายสถานะ:
                        </label>
                        <input
                          type="text"
                          value={st.description || ''}
                          onChange={(e) =>
                            handleUpdateStatusItem(st.id, { description: e.target.value })
                          }
                          placeholder="คำอธิบายสั้นๆ..."
                          className="w-full px-2.5 py-1 border border-slate-200 rounded-lg text-[11px] text-slate-600"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: QUICK PLAN STATUS ADJUSTMENT */}
          {activeTab === 'plans' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={planSearch}
                    onChange={(e) => setPlanSearch(e.target.value)}
                    placeholder="ค้นหาชื่อครู, รหัสวิชา, หรือชื่อแผน..."
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Filter */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs shrink-0">
                  <span className="text-slate-400 text-xs">กรอง:</span>
                  {[
                    { id: 'all', label: 'ทั้งหมด' },
                    { id: 'late', label: '⚠️ ส่งช้าเท่านั้น' },
                    ...statuses.map((s) => ({ id: s.id, label: s.label })),
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setPlanFilter(f.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                        planFilter === f.id
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plans Table/List */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">วิชา / แผนการสอน</th>
                        <th className="py-3 px-4">ครูผู้สอน</th>
                        <th className="py-3 px-4">ประเภทเอกสาร</th>
                        <th className="py-3 px-4">วันเวลาที่ส่ง</th>
                        <th className="py-3 px-4">สถานะส่งช้า (Late)</th>
                        <th className="py-3 px-4">ปรับสถานะ (Admin)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPlans.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            ไม่พบรายการแผนการสอนที่ตรงกับเงื่อนไข
                          </td>
                        </tr>
                      ) : (
                        filteredPlans.map((plan) => {
                          const statusInfo = getPlanStatusInfo(plan.status, statuses);
                          const isUpdating = updatingPlanId === plan.id;

                          return (
                            <tr key={plan.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3 px-4 max-w-xs">
                                <div className="font-bold text-slate-900 truncate">
                                  {plan.subject_code} - {plan.subject_name}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate" title={plan.plan_title}>
                                  {plan.plan_title}
                                </div>
                              </td>

                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="font-semibold text-slate-800">{plan.teacher_name}</div>
                                <div className="text-[10px] text-slate-400">รหัส {plan.teacher_id}</div>
                              </td>

                              <td className="py-3 px-4 whitespace-nowrap">
                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                                  {plan.plan_type}
                                </span>
                              </td>

                              <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-600">
                                {formatThaiDateTime(plan.submitted_at)}
                              </td>

                              <td className="py-3 px-4 whitespace-nowrap">
                                <button
                                  onClick={() => handleTogglePlanLate(plan)}
                                  disabled={isUpdating}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                    plan.is_late
                                      ? 'bg-orange-100 text-orange-800 border border-orange-300 hover:bg-orange-200'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                  }`}
                                  title="คลิกเพื่อสลับสถานะส่งช้า / ส่งตรงเวลา"
                                >
                                  {plan.is_late ? (
                                    <>
                                      <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                                      <span>ส่งช้า</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                      <span>ตรงเวลา</span>
                                    </>
                                  )}
                                </button>
                              </td>

                              <td className="py-3 px-4 whitespace-nowrap">
                                <select
                                  value={plan.status}
                                  disabled={isUpdating}
                                  onChange={(e) => handlePlanStatusChange(plan, e.target.value)}
                                  className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-2xs"
                                >
                                  {statuses.map((st) => (
                                    <option key={st.id} value={st.id}>
                                      {st.label} ({st.id})
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>การปรับเปลี่ยนจะมีผลกับทุกส่วนของระบบและบันทึกแบบ Realtime</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
