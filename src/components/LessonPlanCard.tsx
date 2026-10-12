import React, { useState } from 'react';
import {
  LessonPlan,
  Teacher,
  isTeacherAdmin,
  PlanStatusConfig,
  PlanTypeDeadlineConfig,
} from '../types';
import { formatGoogleDriveImageUrl, getInitials } from '../utils/imageUtils';
import {
  getPlanStatusInfo,
  checkSubmissionTimeliness,
  formatThaiDateTime,
} from '../utils/deadlineUtils';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Printer,
  UserCheck,
  Award,
  MoreVertical,
  Trash2,
  Calendar,
  Layers,
  RotateCcw,
  Tag,
  ShieldCheck,
  Edit,
} from 'lucide-react';

interface LessonPlanCardProps {
  plan: LessonPlan;
  currentTeacher: Teacher;
  onOpenReceipt: (plan: LessonPlan) => void;
  onOpenReview: (plan: LessonPlan) => void;
  onDeletePlan: (planId: string) => void;
  onEditPlan?: (plan: LessonPlan) => void;
  onResubmitPlan?: (plan: LessonPlan) => void;
  statusConfigs?: PlanStatusConfig[];
  deadlineConfigs?: PlanTypeDeadlineConfig[];
  onQuickChangeStatus?: (plan: LessonPlan, newStatus: string) => void;
  onToggleLate?: (plan: LessonPlan) => void;
}

export const LessonPlanCard: React.FC<LessonPlanCardProps> = ({
  plan,
  currentTeacher,
  onOpenReceipt,
  onOpenReview,
  onDeletePlan,
  onEditPlan,
  onResubmitPlan,
  statusConfigs,
  deadlineConfigs,
  onQuickChangeStatus,
  onToggleLate,
}) => {
  const photoUrl = formatGoogleDriveImageUrl(plan.teacher_photo);
  const isAdmin = isTeacherAdmin(currentTeacher);
  const isOwner = plan.teacher_id === currentTeacher.Teacher_ID;
  const canReview = isAdmin;

  // Timeliness & Late Status calculation
  const timeliness = checkSubmissionTimeliness(plan.plan_type, plan.submitted_at, deadlineConfigs);
  const isLate = plan.is_late !== undefined ? plan.is_late : timeliness.isLate;
  const delayNote = plan.submission_delay_text || timeliness.delayText;

  // Dynamic Status Info configured by Admin
  const statusInfo = getPlanStatusInfo(plan.status, statusConfigs);

  return (
    <div className={`bg-white rounded-2xl border shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between group ${
      isLate ? 'border-orange-200 hover:border-orange-300' : 'border-slate-200/80 hover:border-indigo-200'
    }`}>
      <div>
        {/* Card Header: Subject Code & Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {plan.subject_code}
            </span>
            <span className="text-xs font-semibold text-slate-700">
              {plan.subject_name}
            </span>
          </div>

          {/* Badges Container */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {/* LATE SUBMISSION BADGE */}
            {isLate && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-300 shadow-2xs"
                title={`ส่งช้ากว่ากำหนด: ${delayNote}`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                <span>ส่งช้า</span>
              </span>
            )}

            {/* DYNAMIC STATUS BADGE (Configured by Admin) */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusInfo.style.badge}`}
              title={statusInfo.id}
            >
              <span className={`w-2 h-2 rounded-full ${statusInfo.style.dot}`}></span>
              <span>{statusInfo.label}</span>
              {plan.status === 'approved' && plan.total_score ? (
                <span className="font-mono text-[11px]">({plan.total_score}%)</span>
              ) : null}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="mt-3 text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
          {plan.plan_title}
        </h3>

        {/* Meta tags */}
        <div className="mt-2.5 flex items-center gap-2 flex-wrap text-xs text-slate-500">
          <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-600 font-medium">
            {plan.grade_level}
          </span>
          <span>•</span>
          <span>เทอม {plan.semester}/{plan.academic_year}</span>
          <span>•</span>
          <span>{plan.total_hours} ชม.</span>
          <span>•</span>
          <span className="text-indigo-600 font-medium">{plan.plan_type}</span>
        </div>

        {/* Teacher details */}
        <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={plan.teacher_name}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[11px] font-bold text-indigo-700">
                  {getInitials(plan.teacher_name)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-800 truncate">
                {plan.teacher_name}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                รหัส {plan.teacher_id} • {plan.learning_area}
              </div>
            </div>
          </div>

          <span className="text-[11px] text-slate-400 font-mono shrink-0">
            {plan.submitted_at.split(' ')[0]}
          </span>
        </div>

        {/* Late submission explanation banner */}
        {isLate && (
          <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-orange-50 border border-orange-200/80 text-[11px] text-orange-950 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 font-bold">
              <Clock className="w-3.5 h-3.5 text-orange-600 shrink-0" />
              <span>ส่งช้ากว่ากำหนด: {delayNote}</span>
            </span>
            {plan.deadline_at && (
              <span className="text-orange-800/80 font-mono text-[10px] shrink-0">
                กำหนด: {plan.deadline_at}
              </span>
            )}
          </div>
        )}

        {/* Needs revision alert & Resubmit action */}
        {plan.status === 'needs_revision' && (
          <div className="mt-3 p-3 rounded-2xl bg-amber-50/90 border border-amber-200/90 text-xs space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>สถานะ: ส่งกลับแก้ไข</span>
              </span>
              {(isAdmin || isOwner) && onResubmitPlan && (
                <button
                  onClick={() => onResubmitPlan(plan)}
                  className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-bold text-xs shadow-xs hover:shadow flex items-center gap-1 transition-all cursor-pointer"
                  title="ส่งแผนที่ปรับปรุงแล้วเพื่อขอรับการตรวจอีกครั้ง"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>ส่งแผนใหม่อีกครั้ง</span>
                </button>
              )}
            </div>
            {plan.review_comment ? (
              <div className="text-amber-900 bg-white/85 p-2.5 rounded-xl border border-amber-200/60">
                <span className="font-semibold text-slate-700 block mb-0.5 text-[11px]">
                  ข้อเสนอแนะ ({plan.reviewer_name || 'ฝ่ายวิชาการ'}):
                </span>
                <p className="line-clamp-2 leading-relaxed">{plan.review_comment}</p>
              </div>
            ) : (
              <p className="text-amber-800 text-[11px]">
                กรุณาปรับปรุงแผนการจัดการเรียนรู้ และกดปุ่ม &quot;ส่งแผนใหม่อีกครั้ง&quot; เพื่อให้ผู้ดูแลระบบตรวจอีกครั้ง
              </p>
            )}
          </div>
        )}

        {/* Feedback snippet if approved or submitted with comment */}
        {plan.status !== 'needs_revision' && plan.review_comment && (
          <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600">
            <span className="font-semibold text-slate-700 block mb-0.5">
              ข้อเสนอแนะ ({plan.reviewer_name || 'ฝ่ายวิชาการ'}):
            </span>
            <p className="line-clamp-2">{plan.review_comment}</p>
          </div>
        )}
      </div>

      {/* Admin Quick Status Bar */}
      {isAdmin && onQuickChangeStatus && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-500 text-[11px] font-bold flex items-center gap-1 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>ปรับสถานะ (Admin):</span>
          </span>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <select
              value={plan.status}
              onChange={(e) => onQuickChangeStatus(plan, e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-300 text-[11px] font-bold bg-white text-slate-800 shadow-2xs cursor-pointer focus:ring-1 focus:ring-amber-500"
              title="แอดมินปรับเปลี่ยนสถานะของแผนนี้ทันที"
            >
              {(statusConfigs || []).map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {sc.label}
                </option>
              ))}
            </select>
            {onToggleLate && (
              <button
                type="button"
                onClick={() => onToggleLate(plan)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                  isLate
                    ? 'bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
                title="คลิกเพื่อสลับสถานะส่งช้า / ส่งตรงเวลา"
              >
                {isLate ? '⚠️ ส่งช้า' : 'ตรงเวลา'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* File link */}
          <a
            href={plan.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>ดูไฟล์</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>

          {/* Receipt button */}
          <button
            onClick={() => onOpenReceipt(plan)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            title="พิมพ์ใบตอบรับการส่งแผน"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>ใบตอบรับ</span>
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* Resubmit button (for needs_revision plans) */}
          {plan.status === 'needs_revision' && (isAdmin || isOwner) && onResubmitPlan && (
            <button
              onClick={() => onResubmitPlan(plan)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer"
              title="ส่งแผนการสอนที่ปรับปรุงแล้วเพื่อขอรับการตรวจอีกครั้ง"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>ส่งแผนใหม่อีกครั้ง</span>
            </button>
          )}

          {/* Edit plan button (for owner or admin) */}
          {(isAdmin || isOwner) && onEditPlan && (
            <button
              onClick={() => onEditPlan(plan)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors border border-indigo-200 cursor-pointer"
              title={isAdmin ? 'แก้ไขข้อมูลแผนการสอน (แอดมิน)' : 'แก้ไขข้อมูลแผนการสอนของฉัน'}
            >
              <span>แก้ไขแผน</span>
            </button>
          )}

          {/* Review button (Admin only, supervisor) */}
          {canReview && (
            <button
              onClick={() => onOpenReview(plan)}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold transition-colors border border-purple-200 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{plan.status === 'submitted' ? 'ตรวจแผน' : 'แก้ไขผลตรวจ'}</span>
            </button>
          )}

          {/* Delete (if owner or admin) */}
          {(isAdmin || isOwner) && (
            <button
              onClick={() => onDeletePlan(plan.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title={isAdmin ? 'ลบรายการส่งแผน (แอดมิน)' : 'ลบรายการส่งแผนของฉัน'}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
