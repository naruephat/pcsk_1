import React from 'react';
import { LessonPlan, Teacher, isTeacherAdmin } from '../types';
import {
  FileCheck2,
  Clock,
  AlertTriangle,
  Award,
  Users,
  CheckCircle2,
  BarChart3,
  Layers,
  ShieldCheck,
  Lock,
} from 'lucide-react';

interface DashboardStatsProps {
  plans: LessonPlan[];
  teachers: Teacher[];
  currentTeacher: Teacher;
  selectedArea: string;
  onSelectArea: (area: string) => void;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  plans,
  teachers,
  currentTeacher,
  selectedArea,
  onSelectArea,
}) => {
  const isAdmin = isTeacherAdmin(currentTeacher);

  // If regular teacher, calculate stats strictly from their own plans
  const displayPlans = isAdmin
    ? plans
    : plans.filter((p) => p.teacher_id === currentTeacher.Teacher_ID);

  const totalPlans = displayPlans.length;
  const approvedPlans = displayPlans.filter((p) => p.status === 'approved').length;
  const pendingPlans = displayPlans.filter((p) => p.status === 'submitted').length;
  const revisionPlans = displayPlans.filter((p) => p.status === 'needs_revision').length;
  const latePlans = displayPlans.filter((p) => p.is_late).length;

  const approvalRate = totalPlans > 0 ? Math.round((approvedPlans / totalPlans) * 100) : 0;

  // Group by learning areas (Admin only)
  const learningAreas = Array.from(
    new Set(teachers.map((t) => t.Learning_Area).filter((a) => a && a !== '-'))
  );

  return (
    <div className="space-y-6">
      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              {isAdmin ? 'แผนการสอนทั้งโรงเรียน' : 'แผนการสอนของฉัน'}
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{totalPlans}</span>
            <span className="text-xs text-slate-500">ฉบับ</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {isAdmin
              ? `จากครูผู้สอน ${teachers.length} ท่าน ทุกกลุ่มสาระ`
              : `${currentTeacher.Name} (${currentTeacher.Teacher_ID})`}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500"></div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">ผ่านการอนุมัติแล้ว</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-600">{approvedPlans}</span>
            <span className="text-xs text-emerald-700 font-semibold">({approvalRate}%)</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">มีผลประเมินตามเกณฑ์</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">รอการตรวจสอบ</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-amber-600">{pendingPlans}</span>
            <span className="text-xs text-slate-500">ฉบับ</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isAdmin ? 'รอฝ่ายวิชาการพิจารณา' : 'ส่งแล้ว กำลังรอฝ่ายวิชาการตรวจ'}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500"></div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-rose-300 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">ส่งกลับแก้ไข</span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-rose-600">{revisionPlans}</span>
            <span className="text-xs text-slate-500">ฉบับ</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {isAdmin ? 'รอครูผู้สอนส่งใหม่' : 'ต้องแก้ไขตามข้อเสนอแนะ'}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500"></div>
        </div>
      </div>

      {/* Late submissions notification pill */}
      {latePlans > 0 && (
        <div className="bg-orange-50/90 border border-orange-200/90 rounded-2xl p-3 sm:px-4 flex items-center justify-between gap-3 text-xs text-orange-950 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
            <span className="font-bold">
              {isAdmin ? 'ตรวจพบแผนการสอนที่ส่งช้ากว่ากำหนด:' : 'แผนของท่านที่ส่งเกินกำหนด:'}
            </span>
            <span>
              {latePlans} ฉบับ (ระบบคำนวณตามกำหนดวันเวลาส่งของแต่ละประเภทเอกสาร)
            </span>
          </div>
          <span className="text-[11px] font-bold text-orange-850 bg-orange-200/70 px-2.5 py-0.5 rounded-full shrink-0">
            ⚠️ ส่งช้า (Late)
          </span>
        </div>
      )}

      {/* Breakdown per Learning Area (Admin Only) or Privacy Note for Teachers */}
      {isAdmin ? (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">
                สถิติการส่งแผนแยกตามกลุ่มสาระการเรียนรู้ (โหมดแอดมิน)
              </h3>
            </div>
            {selectedArea && (
              <button
                onClick={() => onSelectArea('')}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium underline"
              >
                แสดงทุกกลุ่มสาระ
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {learningAreas.map((area) => {
              const countTeachers = teachers.filter((t) => t.Learning_Area === area).length;
              const areaPlans = plans.filter((p) => p.learning_area === area);
              const isSelected = selectedArea === area;

              return (
                <button
                  key={area}
                  onClick={() => onSelectArea(isSelected ? '' : area)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/80 shadow-sm ring-1 ring-indigo-600'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/40 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-800 truncate" title={area}>
                    {area}
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>ครู {countTeachers} คน</span>
                    <span className="font-semibold text-indigo-600 font-mono">
                      ส่งแล้ว {areaPlans.length} ฉบับ
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-indigo-50/60 border border-indigo-200/70 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-indigo-900 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-700">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-indigo-950">
                ระบบสิทธิ์และความเป็นส่วนตัว (Personal Privacy Mode)
              </p>
              <p className="text-[11px] text-indigo-700 mt-0.5">
                ท่านจะเห็นเฉพาะแผนการจัดการเรียนรู้และข้อมูลของตนเองเท่านั้น (รหัส {currentTeacher.Teacher_ID}) ไม่สามารถเข้าถึงข้อมูลของไอดีอื่นได้
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="inline-block bg-white/80 px-2.5 py-1 rounded-lg border border-indigo-200 font-medium text-indigo-800 text-[11px]">
              กลุ่มสาระ: {currentTeacher.Learning_Area}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
