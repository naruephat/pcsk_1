import React, { useState } from 'react';
import { Teacher, LessonPlan, PlanType, PlanTypeDeadlineConfig } from '../types';
import {
  checkSubmissionTimeliness,
  getSavedDeadlineConfigs,
  formatThaiDateTime,
} from '../utils/deadlineUtils';
import {
  X,
  UploadCloud,
  FileText,
  FileCheck2,
  Sparkles,
  Link as LinkIcon,
  BookOpen,
  Calendar,
  Clock,
  Layers,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface SubmitPlanModalProps {
  currentTeacher: Teacher;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (plan: LessonPlan) => Promise<any>;
  isSupabaseConnected?: boolean;
  onOpenSupabaseModal?: () => void;
  deadlineConfigs?: PlanTypeDeadlineConfig[];
}

const DEFAULT_PLAN_TYPES: PlanType[] = [
  'แผนการจัดการเรียนรู้ฉบับย่อ',
  'แผนการจัดการเรียนรู้ฉบับสมบูรณ์',
];

const GRADE_LEVELS = [
  'มัธยมศึกษาปีที่ 1',
  'มัธยมศึกษาปีที่ 2',
  'มัธยมศึกษาปีที่ 3',
  'มัธยมศึกษาปีที่ 4',
  'มัธยมศึกษาปีที่ 5',
  'มัธยมศึกษาปีที่ 6',
];

export const SubmitPlanModal: React.FC<SubmitPlanModalProps> = ({
  currentTeacher,
  isOpen,
  onClose,
  onSubmit,
  isSupabaseConnected = false,
  onOpenSupabaseModal,
  deadlineConfigs,
}) => {
  const currentDeadlines = deadlineConfigs || getSavedDeadlineConfigs();
  const availablePlanTypes = currentDeadlines.map((d) => d.name);
  const initialType = availablePlanTypes.length > 0 ? availablePlanTypes[0] : DEFAULT_PLAN_TYPES[0];

  const [subjectCode, setSubjectCode] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [gradeLevel, setGradeLevel] = useState(GRADE_LEVELS[3]); // ม.4 default
  const [semester, setSemester] = useState('1');
  const [academicYear, setAcademicYear] = useState('2569');
  const [planTitle, setPlanTitle] = useState('');
  const [planType, setPlanType] = useState<PlanType>(initialType);
  const [totalHours, setTotalHours] = useState<number>(40);
  const [notes, setNotes] = useState('');

  // Strict PDF link enforcement
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Check timeliness for currently selected plan type
  const timeliness = checkSubmissionTimeliness(planType, new Date(), currentDeadlines);

  if (!isOpen) return null;

  const handleTestOpenLink = () => {
    let urlToTest = fileUrl.trim();
    if (!urlToTest) {
      setError('กรุณากรอกลิงก์ไฟล์ PDF ก่อนทดสอบเปิด');
      return;
    }
    if (!/^https?:\/\//i.test(urlToTest)) {
      urlToTest = 'https://' + urlToTest;
    }
    window.open(urlToTest, '_blank', 'noopener,noreferrer');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!subjectCode.trim() || !subjectName.trim() || !planTitle.trim()) {
      setError('กรุณากรอกรหัสวิชา ชื่อวิชา และชื่อแผนการจัดการเรียนรู้ให้ครบถ้วน');
      return;
    }

    // Strict PDF link validation
    const trimmedUrl = fileUrl.trim();
    if (!trimmedUrl) {
      setError('บังคับส่งเป็นลิงก์ไฟล์ PDF: กรุณาระบุลิงก์เอกสารแผนการสอน (เช่น ลิงก์ Google Drive ของไฟล์ PDF หรือลิงก์ตรง .pdf)');
      return;
    }

    let finalUrl = trimmedUrl;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    try {
      new URL(finalUrl);
    } catch {
      setError('รูปแบบลิงก์ไม่ถูกต้อง กรุณากรอก URL ให้ถูกต้อง เช่น https://drive.google.com/...');
      return;
    }

    const isGoogleDrive = /drive\.google\.com|docs\.google\.com/i.test(finalUrl);
    const isCloudDoc = /onedrive|1drv\.ms|dropbox\.com|sharepoint\.com|supabase\.co|storage\.googleapis\.com/i.test(finalUrl);
    const isPdfExt = /\.pdf(\?|$|#)/i.test(finalUrl);

    if (!isPdfExt && !isGoogleDrive && !isCloudDoc) {
      setError('บังคับส่งเฉพาะลิงก์ไฟล์ PDF เท่านั้น! (เช่น ลิงก์ไฟล์ PDF บน Google Drive, OneDrive หรือลิงก์ตรงที่ลงท้ายด้วย .pdf)');
      return;
    }

    setIsSubmitting(true);

    try {
      const generatedId = `LP-${academicYear}-${Math.floor(1000 + Math.random() * 9000)}`;
      const safeCode = subjectCode.trim().toUpperCase();
      const generatedFileName = fileName.trim()
        ? (fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`)
        : `${safeCode}_${planTitle.trim().slice(0, 25)}.pdf`;

      const submissionTimeliness = checkSubmissionTimeliness(planType, new Date(), currentDeadlines);

      const newPlan: LessonPlan = {
        id: generatedId,
        teacher_id: currentTeacher.Teacher_ID,
        teacher_name: currentTeacher.Name,
        teacher_photo: currentTeacher.photo,
        learning_area: currentTeacher.Learning_Area,
        subject_code: safeCode,
        subject_name: subjectName.trim(),
        grade_level: gradeLevel,
        semester,
        academic_year: academicYear,
        plan_title: planTitle.trim(),
        plan_type: planType,
        total_hours: Number(totalHours) || 40,
        file_url: finalUrl,
        file_name: generatedFileName,
        file_size: 'PDF Cloud Link',
        notes: notes.trim(),
        submitted_at: new Date().toISOString(),
        status: submissionTimeliness.isLate ? 'late' : 'submitted',
        is_late: submissionTimeliness.isLate,
        submission_delay_text: submissionTimeliness.delayText,
        deadline_at: submissionTimeliness.formattedDeadline,
      };

      const res: any = await onSubmit(newPlan);

      if (res && res.isSupabase && !res.success) {
        const isTableMissing =
          res.error?.includes('42P01') ||
          res.error?.includes('PGRST205') ||
          res.error?.includes('สร้างตาราง');
        const hint = isTableMissing
          ? '\n(โปรดตรวจสอบว่าได้สร้างตาราง lesson_plans และรันคำสั่ง SQL ใน Supabase แล้วหรือไม่)'
          : '';
        setError(`บันทึกในเครื่องแล้ว แต่ Supabase SQL ปฏิเสธ: ${res.error}${hint}`);
        setIsSubmitting(false);
        return;
      }

      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      onClose();
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการส่งแผนการสอน');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/25 shadow-inner">
              <UploadCloud className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-blue-200">
                Lesson Plan Submission
              </span>
              <h2 className="text-xl font-bold">ส่งแผนการจัดการเรียนรู้</h2>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-3 text-xs bg-white/10 backdrop-blur-sm px-3.5 py-2 rounded-xl border border-white/15">
            <span className="font-semibold text-sky-200">ผู้ส่ง:</span>
            <span>{currentTeacher.Name}</span>
            <span className="font-mono bg-white/20 px-1.5 py-0.5 rounded">
              Key: {currentTeacher.Teacher_ID}
            </span>
            <span>•</span>
            <span className="text-amber-200">{currentTeacher.Learning_Area}</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[72vh] overflow-y-auto">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm whitespace-pre-line leading-relaxed">
              {error}
            </div>
          )}

          {/* Section 1: ข้อมูลรายวิชา */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                รหัสวิชา (Subject Code) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                placeholder="เช่น ว31101, ค22101, ท32101"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ชื่อรายวิชา (Subject Name) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="เช่น วิทยาศาสตร์ชีวภาพ 1"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ระดับชั้น <span className="text-rose-500">*</span>
              </label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              >
                {GRADE_LEVELS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ภาคเรียน / ปีการศึกษา <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-1/2 px-2.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                >
                  <option value="1">เทอม 1</option>
                  <option value="2">เทอม 2</option>
                </select>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="2569"
                  className="w-1/2 px-2.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono text-center"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                จำนวนชั่วโมงสอนรวม
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={totalHours}
                  onChange={(e) => setTotalHours(Number(e.target.value))}
                  className="w-full pl-9 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-700">
                ประเภทเอกสาร <span className="text-rose-500">*</span>
              </label>
              {timeliness.configFound && (
                <span className="text-[11px] font-mono text-slate-500">
                  กำหนดส่ง: {timeliness.formattedDeadline}
                </span>
              )}
            </div>
            <select
              value={planType}
              onChange={(e) => setPlanType(e.target.value as PlanType)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            >
              {availablePlanTypes.map((pt) => (
                <option key={pt} value={pt}>
                  {pt}
                </option>
              ))}
            </select>

            {/* Deadline / Late Status Notice Card */}
            {timeliness.configFound && (
              <div
                className={`mt-2.5 p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                  timeliness.isLate
                    ? 'bg-amber-50/90 border-amber-300 text-amber-900 shadow-2xs'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                }`}
              >
                {timeliness.isLate ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold flex items-center gap-1.5 flex-wrap">
                        <span>ส่งเกินกำหนดเวลา (ระบบจะติดสถานะ &quot;ส่งช้า&quot;)</span>
                        <span className="bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-md text-[10px] font-bold">
                          {timeliness.delayText}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        กำหนดส่งของเอกสารประเภทนี้คือ <strong>{timeliness.formattedDeadline}</strong> — ท่านยังสามารถส่งเอกสารได้ และระบบจะบันทึกสถานะส่งช้าเพื่อให้ฝ่ายวิชาการและแอดมินพิจารณา
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-emerald-900 flex items-center gap-1.5 flex-wrap">
                        <span>อยู่ในช่วงเวลาส่งงานตามกำหนด ({timeliness.delayText})</span>
                      </div>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        สามารถส่งได้ถึงวันที่ <strong>{timeliness.formattedDeadline}</strong>
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              ชื่อแผนการจัดการเรียนรู้ / หน่วยการเรียนรู้ <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={planTitle}
              onChange={(e) => setPlanTitle(e.target.value)}
              placeholder="เช่น แผนการจัดการเรียนรู้ที่ 1-10 เรื่อง การถ่ายทอดลักษณะทางพันธุกรรม และการประยุกต์ใช้เทคโนโลยีชีวภาพ"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          {/* Section 2: บังคับส่งไฟล์เป็นลิงก์ PDF */}
          <div className="bg-indigo-50/50 border-2 border-indigo-200/90 rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-rose-600" />
                <span>ลิงก์ไฟล์เอกสารแผนการสอน (บังคับเป็นลิงก์ PDF เท่านั้น)</span>
                <span className="text-rose-500">*</span>
              </label>

              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                บังคับส่งไฟล์เป็นลิงก์ PDF
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="url"
                    required
                    value={fileUrl}
                    onChange={(e) => {
                      setFileUrl(e.target.value);
                      if (!fileName && e.target.value) {
                        setFileName(`${subjectCode || 'แผนการสอน'}_${planTitle ? planTitle.slice(0, 20) : 'เอกสาร'}.pdf`);
                      }
                    }}
                    placeholder="https://drive.google.com/file/d/... หรือ ลิงก์ตรงที่ลงท้ายด้วย .pdf"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-600 font-mono text-xs sm:text-sm"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleTestOpenLink}
                  disabled={!fileUrl.trim()}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shrink-0 disabled:opacity-40 transition-colors flex items-center gap-1.5 shadow-xs"
                  title="ทดสอบเปิดลิงก์ในหน้าต่างใหม่"
                >
                  <span>ทดสอบเปิด</span>
                  <span>↗</span>
                </button>
              </div>

              {/* Instructions Guide for Google Drive PDF Sharing */}
              <div className="bg-white/90 border border-indigo-150 rounded-xl p-3 text-xs text-slate-600 space-y-1.5">
                <div className="font-semibold text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>คำแนะนำการแชร์ลิงก์ไฟล์ PDF จาก Google Drive:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
                  <li>อัปโหลดไฟล์แผนการสอน <strong>.PDF</strong> ขึ้นบน Google Drive ของท่าน</li>
                  <li>คลิกขวาที่ไฟล์ PDF เลือก <strong>"แชร์" (Share)</strong></li>
                  <li>ปรับการเข้าถึงทั่วไปเป็น <strong>"ทุกคนที่มีลิงก์ (มีสิทธิ์ดู)"</strong> เพื่อให้ฝ่ายวิชาการเปิดตรวจได้</li>
                  <li>กด <strong>"คัดลอกลิงก์"</strong> แล้วนำมาวางในช่องด้านบน</li>
                </ol>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              หมายเหตุ / รูปแบบการจัดกิจกรรมการเรียนรู้เพิ่มเติม
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น จัดการเรียนรู้แบบ Active Learning, กระบวนการสืบเสาะหาความรู้ 5E, บูรณาการ STEM ศึกษา"
              className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
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
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-sm shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  กำลังส่งแผน...
                </>
              ) : (
                <>
                  <FileCheck2 className="w-4 h-4" />
                  ยืนยันส่งแผนการสอน
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
