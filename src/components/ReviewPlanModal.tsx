import React, { useState } from 'react';
import { LessonPlan, Teacher, PlanStatus, RubricScore, PlanStatusConfig } from '../types';
import { getSavedStatusConfigs } from '../utils/deadlineUtils';
import {
  X,
  CheckCircle,
  AlertTriangle,
  FileText,
  Star,
  ExternalLink,
  Award,
  MessageSquare,
  UserCheck,
  Tag,
} from 'lucide-react';

interface ReviewPlanModalProps {
  plan: LessonPlan;
  reviewer: Teacher;
  isOpen: boolean;
  onClose: () => void;
  onSaveReview: (updatedPlan: LessonPlan) => Promise<any> | any;
  statusConfigs?: PlanStatusConfig[];
}

export const ReviewPlanModal: React.FC<ReviewPlanModalProps> = ({
  plan,
  reviewer,
  isOpen,
  onClose,
  onSaveReview,
  statusConfigs,
}) => {
  const allStatuses = statusConfigs || getSavedStatusConfigs();
  const [status, setStatus] = useState<PlanStatus>(plan.status === 'submitted' ? 'approved' : plan.status);
  const [comment, setComment] = useState(plan.review_comment || '');
  const [rubrics, setRubrics] = useState<RubricScore>(
    plan.rubric_scores || {
      standards: 5,
      activities: 5,
      media: 4,
      assessment: 4,
      recording: 5,
    }
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const totalRubricScore =
    Math.round(
      ((rubrics.standards +
        rubrics.activities +
        rubrics.media +
        rubrics.assessment +
        rubrics.recording) /
        25) *
        100
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const updated: LessonPlan = {
      ...plan,
      status,
      reviewed_by: reviewer.Teacher_ID,
      reviewer_name: `${reviewer.Name} (${reviewer.position})`,
      reviewed_at: dateStr,
      review_comment: comment.trim(),
      rubric_scores: rubrics,
      total_score: totalRubricScore,
    };

    try {
      await onSaveReview(updated);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateRubric = (key: keyof RubricScore, val: number) => {
    setRubrics((prev) => ({ ...prev, [key]: val }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-700 via-indigo-700 to-indigo-800 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/25">
              <UserCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-purple-200">
                Academic Review
              </span>
              <h2 className="text-xl font-bold">ตรวจและประเมินแผนการสอน</h2>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3 text-xs bg-white/10 backdrop-blur-sm px-3.5 py-2 rounded-xl">
            <span className="text-purple-200">ผู้ตรวจ:</span>
            <span className="font-semibold">{reviewer.Name}</span>
            <span className="font-mono bg-white/20 px-1.5 py-0.5 rounded">
              {reviewer.Teacher_ID}
            </span>
            <span>•</span>
            <span>{reviewer.position}</span>
          </div>
        </div>

        {/* Plan Summary Card */}
        <div className="p-6 pb-2 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-indigo-100 text-indigo-700 mb-1">
                {plan.subject_code} - {plan.subject_name}
              </span>
              <h3 className="text-base font-bold text-slate-800">{plan.plan_title}</h3>
              <p className="text-xs text-slate-500 mt-1">
                ครูผู้สอน: <strong className="text-slate-700">{plan.teacher_name}</strong> (รหัส: {plan.teacher_id}) • {plan.learning_area} • ชั้น {plan.grade_level}
              </p>
            </div>
            <a
              href={plan.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium shadow-sm transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              เปิดดูไฟล์แผน
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Status Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              ผลการพิจารณาตรวจสอบ <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label
                className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  status === 'approved'
                    ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="review_status"
                  value="approved"
                  checked={status === 'approved'}
                  onChange={() => setStatus('approved')}
                  className="hidden"
                />
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    status === 'approved' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                  }`}
                >
                  {status === 'approved' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                </div>
                <div>
                  <div className="text-sm font-bold flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    อนุมัติให้ใช้จัดการเรียนรู้ได้
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    แผนมีความสมบูรณ์ สอดคล้องกับหลักสูตร
                  </div>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  status === 'needs_revision'
                    ? 'border-amber-500 bg-amber-50/80 text-amber-900 shadow-sm'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="review_status"
                  value="needs_revision"
                  checked={status === 'needs_revision'}
                  onChange={() => setStatus('needs_revision')}
                  className="hidden"
                />
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    status === 'needs_revision' ? 'border-amber-600 bg-amber-600' : 'border-slate-300'
                  }`}
                >
                  {status === 'needs_revision' && <div className="w-2 h-2 rounded-full bg-white"></div>}
                </div>
                <div>
                  <div className="text-sm font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    ส่งกลับเพื่อปรับปรุงแก้ไข
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    ต้องปรับปรุงตามข้อเสนอแนะ
                  </div>
                </div>
              </label>
            </div>

            {/* Custom status selector for admin */}
            <div className="mt-3 flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                <span>หรือระบุสถานะอื่นตามที่แอดมินกำหนด:</span>
              </span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-800 shadow-2xs focus:ring-1 focus:ring-indigo-500"
              >
                {allStatuses.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.label} ({st.id})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rubric Evaluation */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-600" />
                เกณฑ์การประเมินคุณภาพแผน (5 ด้าน)
              </h4>
              <div className="text-xs font-bold px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-lg">
                คะแนนรวม: {totalRubricScore}%
              </div>
            </div>

            <div className="space-y-2.5 pt-1 text-xs">
              {[
                { key: 'standards' as const, label: '1. ความสอดคล้องของมาตรฐานการเรียนรู้และตัวชี้วัด' },
                { key: 'activities' as const, label: '2. การจัดกิจกรรมการเรียนรู้เชิงรุก (Active Learning)' },
                { key: 'media' as const, label: '3. สื่อ นวัตกรรม เทคโนโลยี และแหล่งเรียนรู้' },
                { key: 'assessment' as const, label: '4. เครื่องมือการวัดผลและประเมินผลตามสภาพจริง' },
                { key: 'recording' as const, label: '5. บันทึกผลหลังสอนและการสะท้อนคิด (Reflection)' },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200/60"
                >
                  <span className="text-slate-700 font-medium">{item.label}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((score) => (
                      <button
                        type="button"
                        key={score}
                        onClick={() => updateRubric(item.key, score)}
                        className={`w-7 h-7 rounded-lg font-bold text-xs transition-all ${
                          rubrics[item.key] >= score
                            ? 'bg-amber-400 text-slate-900 shadow-sm'
                            : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        {score}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comment & Feedback */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-indigo-600" />
              ข้อเสนอแนะและข้อคิดเห็นของฝ่ายวิชาการ
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="ระบุข้อเสนอแนะ จุดเด่น หรือสิ่งที่ควรเพิ่มเติมปรับปรุง เพื่อพัฒนาการจัดการเรียนรู้..."
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-medium text-sm shadow-md shadow-purple-700/20 flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกผลการประเมิน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
