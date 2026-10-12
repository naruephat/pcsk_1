import React, { useState, useMemo } from 'react';
import { Teacher, LessonPlan, PlanTypeDeadlineConfig, PlanStatusConfig } from '../types';
import {
  constructDateTime,
  formatThaiDateTime,
  formatDeadlineRange,
  getPlanStatusInfo,
  getStatusStyle,
} from '../utils/deadlineUtils';
import {
  Bell,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Receipt,
  Sparkles,
  Info,
  ArrowRight,
  ShieldAlert,
  Flame,
  Check,
} from 'lucide-react';

interface TeacherAssignmentNotificationProps {
  currentTeacher: Teacher;
  plans: LessonPlan[];
  deadlineConfigs: PlanTypeDeadlineConfig[];
  statusConfigs?: PlanStatusConfig[];
  onOpenSubmitForType: (planType: string) => void;
  onOpenReceipt?: (plan: LessonPlan) => void;
}

export interface AssignmentItem {
  config: PlanTypeDeadlineConfig;
  isSubmitted: boolean;
  submittedPlan?: LessonPlan;
  submittedCount: number;
  allSubmittedPlans: LessonPlan[];
  daysRemaining: number;
  hoursRemaining: number;
  minutesRemaining: number;
  isOverdue: boolean;
  isDueToday: boolean;
  isUrgent: boolean; // <= 3 days
  hasStarted: boolean;
  daysUntilStart: number;
  deadlineDate: Date;
  startDate: Date;
  deadlineFormatted: string;
}

export const TeacherAssignmentNotification: React.FC<TeacherAssignmentNotificationProps> = ({
  currentTeacher,
  plans,
  deadlineConfigs,
  statusConfigs,
  onOpenSubmitForType,
  onOpenReceipt,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'submitted'>('all');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Filter only active deadline configs configured by Admin
  const activeConfigs = useMemo(() => {
    return (deadlineConfigs || []).filter((c) => c.is_active !== false);
  }, [deadlineConfigs]);

  // Compute status for each assigned document type for the current teacher
  const assignments: AssignmentItem[] = useMemo(() => {
    const now = new Date();
    const teacherId = currentTeacher.Teacher_ID;

    // Plans belonging to this teacher
    const myPlans = plans.filter((p) => p.teacher_id === teacherId);

    return activeConfigs.map((config) => {
      const deadlineDate = constructDateTime(config.end_date, config.end_time || '23:59');
      const startDate = constructDateTime(config.start_date, config.start_time || '00:00');

      // Check if teacher has submitted any plan for this document type
      const matchingPlans = myPlans.filter(
        (p) => p.plan_type.trim().toLowerCase() === config.name.trim().toLowerCase()
      );
      const isSubmitted = matchingPlans.length > 0;
      // Sort newest first
      const sortedMatching = [...matchingPlans].sort(
        (a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime()
      );
      const submittedPlan = sortedMatching[0];

      // Time calculations
      const diffMs = deadlineDate.getTime() - now.getTime();
      const isOverdue = diffMs < 0;
      const absMs = Math.abs(diffMs);
      const days = Math.floor(absMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((absMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((absMs % (1000 * 60 * 60)) / (1000 * 60));

      const isDueToday = !isOverdue && days === 0;
      const isUrgent = !isOverdue && days <= 3;

      // Start date check
      const startDiffMs = startDate.getTime() - now.getTime();
      const hasStarted = startDiffMs <= 0;
      const daysUntilStart = hasStarted ? 0 : Math.ceil(startDiffMs / (1000 * 60 * 60 * 24));

      return {
        config,
        isSubmitted,
        submittedPlan,
        submittedCount: matchingPlans.length,
        allSubmittedPlans: sortedMatching,
        daysRemaining: days,
        hoursRemaining: hours,
        minutesRemaining: mins,
        isOverdue,
        isDueToday,
        isUrgent,
        hasStarted,
        daysUntilStart,
        deadlineDate,
        startDate,
        deadlineFormatted: formatThaiDateTime(deadlineDate),
      };
    });
  }, [activeConfigs, plans, currentTeacher.Teacher_ID]);

  // Statistics
  const totalAssigned = assignments.length;
  const submittedCount = assignments.filter((a) => a.isSubmitted).length;
  const pendingCount = totalAssigned - submittedCount;
  const overdueUnsubmittedCount = assignments.filter((a) => !a.isSubmitted && a.isOverdue).length;
  const urgentUnsubmittedCount = assignments.filter(
    (a) => !a.isSubmitted && !a.isOverdue && a.isUrgent
  ).length;

  const filteredAssignments = useMemo(() => {
    if (filter === 'pending') {
      return assignments.filter((a) => !a.isSubmitted);
    }
    if (filter === 'submitted') {
      return assignments.filter((a) => a.isSubmitted);
    }
    return assignments;
  }, [assignments, filter]);

  if (activeConfigs.length === 0) {
    return null;
  }

  return (
    <div
      id="assigned-documents-section"
      className="bg-white rounded-3xl border border-slate-200/90 shadow-md shadow-slate-200/50 overflow-hidden transition-all duration-200"
    >
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-5 sm:p-6 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-blue-500/15 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg shadow-orange-500/20">
              <Bell className="w-6 h-6 text-slate-950 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950">
                  แจ้งเตือนภาระงานที่ Admin มอบหมาย
                </span>
                {pendingCount > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500 text-white flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    รอส่ง {pendingCount} รายการ
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500 text-white flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    ส่งครบแล้วทุกรายการ 🎉
                  </span>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-1">
                ภาระงานเอกสารที่ฝ่ายวิชาการ/Admin กำหนดให้ส่ง
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                ตรวจสอบรายการเอกสารที่ต้องส่ง วันเวลาที่เหลือจนถึงกำหนด และสถานะการส่งของท่าน
              </p>
            </div>
          </div>

          {/* Quick Metrics & Collapse Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 self-end md:self-center shrink-0">
            <div className="flex items-center bg-white/10 backdrop-blur-md rounded-2xl p-1.5 border border-white/15 text-xs font-semibold">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  filter === 'all'
                    ? 'bg-white text-slate-900 shadow-sm font-bold'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                ทั้งหมด ({totalAssigned})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                  filter === 'pending'
                    ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                    : 'text-amber-300 hover:text-white'
                }`}
              >
                <span>ยังไม่ได้ส่ง</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/30 text-amber-100">
                  {pendingCount}
                </span>
              </button>
              <button
                onClick={() => setFilter('submitted')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                  filter === 'submitted'
                    ? 'bg-emerald-400 text-slate-950 shadow-sm font-bold'
                    : 'text-emerald-300 hover:text-white'
                }`}
              >
                <span>ส่งแล้ว</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/30 text-emerald-100">
                  {submittedCount}
                </span>
              </button>
            </div>

            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/15"
              title={isCollapsed ? 'ขยายรายการ' : 'ย่อรายการ'}
            >
              {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Urgent Warning Strip inside Header if there are urgent or overdue unsubmitted plans */}
        {!isCollapsed && overdueUnsubmittedCount > 0 && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 backdrop-blur-md flex items-center justify-between gap-3 text-xs text-rose-200">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>แจ้งเตือนด่วน:</strong> มีเอกสาร {overdueUnsubmittedCount} รายการที่เลยกำหนดส่งแล้ว กรุณาจัดส่งทันที (หากระบบเปิดให้อนุญาตส่งล่าช้า)
              </span>
            </div>
            <button
              onClick={() => setFilter('pending')}
              className="px-2.5 py-1 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-bold text-[11px] shrink-0 transition-colors"
            >
              ดูรายการที่ยังไม่ส่ง
            </button>
          </div>
        )}

        {!isCollapsed && overdueUnsubmittedCount === 0 && urgentUnsubmittedCount > 0 && (
          <div className="mt-4 p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 backdrop-blur-md flex items-center justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>ใกล้ครบกำหนดส่ง:</strong> มีเอกสาร {urgentUnsubmittedCount} รายการ ที่เหลือเวลาส่งอีกไม่เกิน 3 วัน
              </span>
            </div>
            <button
              onClick={() => setFilter('pending')}
              className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg font-bold text-[11px] shrink-0 transition-colors"
            >
              รีบส่งเอกสาร
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {!isCollapsed && (
        <div className="p-5 sm:p-6 space-y-4 bg-slate-50/60">
          {/* Quick Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                <FileText className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">มอบหมายทั้งหมด</div>
                <div className="text-lg font-extrabold text-slate-800">
                  {totalAssigned} <span className="text-xs font-normal text-slate-400">รายการ</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-emerald-200/80 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="text-xs text-emerald-700 font-medium">ส่งแล้ว (เสร็จสิ้น)</div>
                <div className="text-lg font-extrabold text-emerald-800">
                  {submittedCount} <span className="text-xs font-normal text-emerald-600">รายการ</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-amber-200/80 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-sm shrink-0">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="text-xs text-amber-700 font-medium">ยังไม่ได้ส่ง</div>
                <div className="text-lg font-extrabold text-amber-800">
                  {pendingCount} <span className="text-xs font-normal text-amber-600">รายการ</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-sm shrink-0">
                <Calendar className="w-5 h-5 text-sky-600" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-medium">ความคืบหน้าของท่าน</div>
                <div className="text-lg font-extrabold text-slate-800">
                  {totalAssigned > 0 ? Math.round((submittedCount / totalAssigned) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>

          {/* Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAssignments.map((item) => {
              const {
                config,
                isSubmitted,
                submittedPlan,
                submittedCount: userSubCount,
                daysRemaining,
                hoursRemaining,
                minutesRemaining,
                isOverdue,
                isDueToday,
                isUrgent,
                hasStarted,
                daysUntilStart,
                deadlineFormatted,
              } = item;

              const planStatusInfo = submittedPlan
                ? getPlanStatusInfo(submittedPlan.status, statusConfigs)
                : null;

              return (
                <div
                  key={config.id}
                  className={`bg-white rounded-2xl p-5 border transition-all duration-200 relative flex flex-col justify-between ${
                    isSubmitted
                      ? 'border-emerald-200 shadow-xs hover:border-emerald-300'
                      : isOverdue
                      ? 'border-rose-300 shadow-sm hover:border-rose-400 bg-gradient-to-b from-white to-rose-50/20'
                      : isUrgent
                      ? 'border-amber-300 shadow-sm hover:border-amber-400 bg-gradient-to-b from-white to-amber-50/20'
                      : 'border-slate-200 hover:border-indigo-200 shadow-xs'
                  }`}
                >
                  <div>
                    {/* Header line of card: Document title & submission status badge */}
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                          <FileText className="w-4 h-4" />
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                          {config.name}
                        </h4>
                      </div>

                      {/* Prominent status badge: ส่งแล้ว vs ยังไม่ได้ส่ง */}
                      {isSubmitted ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>ส่งแล้ว</span>
                          {userSubCount > 1 && (
                            <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded-full font-extrabold">
                              {userSubCount} ฉบับ
                            </span>
                          )}
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 shrink-0">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>ยังไม่ได้ส่ง (เลยกำหนด)</span>
                        </span>
                      ) : isDueToday ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0 animate-pulse">
                          <Flame className="w-3.5 h-3.5 text-amber-600" />
                          <span>ครบกำหนดวันนี้</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300 shrink-0">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>ยังไม่ได้ส่ง</span>
                        </span>
                      )}
                    </div>

                    {/* Term & Description */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-700">
                        ภาคเรียนที่ {config.semester}/{config.academic_year}
                      </span>
                      {config.allow_late && (
                        <span className="text-[11px] text-slate-500 font-medium">
                          • อนุญาตส่งล่าช้าได้
                        </span>
                      )}
                    </div>

                    {config.description && (
                      <p className="text-xs text-slate-600 mb-3 line-clamp-2 leading-relaxed">
                        {config.description}
                      </p>
                    )}

                    {config.notes && (
                      <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200/60 text-[11px] text-amber-900 mb-3 flex items-start gap-1.5">
                        <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <strong>คำชี้แจงจาก Admin:</strong> {config.notes}
                        </div>
                      </div>
                    )}

                    {/* Deadline and Countdown box */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                          กำหนดส่ง:
                        </span>
                        <span className="font-bold text-slate-800">{deadlineFormatted}</span>
                      </div>

                      {/* Remaining Days Countdown */}
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                        <span className="text-slate-500 flex items-center gap-1 font-medium">
                          <Clock className="w-3.5 h-3.5 text-indigo-600" />
                          เวลาคงเหลือ:
                        </span>
                        <div>
                          {!hasStarted ? (
                            <span className="font-bold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-md">
                              ยังไม่เปิดรับส่ง (เริ่มในอีก {daysUntilStart} วัน)
                            </span>
                          ) : isOverdue ? (
                            <span className="font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-md">
                              เลยกำหนดส่งแล้ว {daysRemaining > 0 ? `${daysRemaining} วัน` : ''} {hoursRemaining > 0 ? `${hoursRemaining} ชม.` : ''}
                            </span>
                          ) : isDueToday ? (
                            <span className="font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md">
                              ⚠️ เหลืออีก {hoursRemaining} ชั่วโมง {minutesRemaining} นาที
                            </span>
                          ) : isUrgent ? (
                            <span className="font-bold text-orange-800 bg-orange-100 px-2.5 py-0.5 rounded-md">
                              ⏳ เหลืออีก {daysRemaining} วัน {hoursRemaining > 0 ? `${hoursRemaining} ชม.` : ''}
                            </span>
                          ) : (
                            <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md">
                              เหลืออีก {daysRemaining} วัน
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Details if SUBMITTED */}
                    {isSubmitted && submittedPlan && (
                      <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2 mb-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-emerald-800 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ข้อมูลเอกสารที่ส่งแล้ว:
                          </span>
                          {planStatusInfo && (
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-md font-bold border ${planStatusInfo.style.badge}`}
                            >
                              {planStatusInfo.label}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-800 font-medium">
                          <span className="text-slate-500">วิชา:</span>{' '}
                          {submittedPlan.subject_code ? `[${submittedPlan.subject_code}] ` : ''}
                          {submittedPlan.plan_title || submittedPlan.subject_name}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>ส่งเมื่อ: {formatThaiDateTime(submittedPlan.submitted_at)}</span>
                          <span
                            className={
                              submittedPlan.is_late
                                ? 'text-orange-700 font-bold'
                                : 'text-emerald-700 font-bold'
                            }
                          >
                            {submittedPlan.is_late ? '⚠️ ส่งล่าช้า' : '✓ ตรงเวลา'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
                    {isSubmitted ? (
                      <div className="flex items-center gap-2 w-full justify-between">
                        <div className="flex items-center gap-1.5">
                          {submittedPlan?.file_url && (
                            <a
                              href={submittedPlan.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors"
                              title="เปิดดูไฟล์ที่ส่ง"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>ดูไฟล์ PDF</span>
                            </a>
                          )}

                          {onOpenReceipt && submittedPlan && (
                            <button
                              onClick={() => onOpenReceipt(submittedPlan)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                              title="พิมพ์/ดูใบตอบรับ"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>ใบตอบรับ</span>
                            </button>
                          )}
                        </div>

                        {/* Can submit additional or revised copy */}
                        <button
                          onClick={() => onOpenSubmitForType(config.name)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 hover:text-indigo-900 hover:bg-indigo-50 transition-colors"
                          title="ส่งฉบับปรับปรุงหรือส่งเพิ่มเติม"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>ส่งเพิ่ม/ปรับปรุง</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => onOpenSubmitForType(config.name)}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                          isOverdue
                            ? 'bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-700 hover:to-orange-700 text-white shadow-rose-600/20'
                            : isUrgent
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-amber-500/20'
                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-indigo-600/20'
                        }`}
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>ส่งเอกสารนี้ทันที ({config.name})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredAssignments.length === 0 && (
            <div className="text-center py-8 bg-white rounded-2xl border border-slate-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">
                {filter === 'pending'
                  ? 'ไม่มีรายการที่ค้างส่ง ท่านส่งเอกสารครบแล้วทุกรายการ!'
                  : 'ไม่พบรายการเอกสารในตัวกรองนี้'}
              </p>
              <button
                onClick={() => setFilter('all')}
                className="mt-2 text-xs text-indigo-600 font-bold hover:underline"
              >
                ดูรายการเอกสารทั้งหมด
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
