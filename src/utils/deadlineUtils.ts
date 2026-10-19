import {
  PlanTypeDeadlineConfig,
  PlanStatusConfig,
  StatusColor,
  LessonPlan,
  EvaluationType,
} from '../types';

export const STORAGE_KEY_DEADLINES = 'lp_deadline_configs';
export const STORAGE_KEY_STATUSES = 'lp_status_configs';

export const DEFAULT_DEADLINE_CONFIGS: PlanTypeDeadlineConfig[] = [
  {
    id: 'type_summary',
    name: 'แผนการจัดการเรียนรู้ฉบับย่อ',
    description: 'แผนการสอนแบบย่อ 1-2 หน้า สรุปจุดประสงค์ สาระการเรียนรู้ และกิจกรรมสำคัญ',
    academic_year: '2569',
    semester: '1',
    start_date: '2026-08-01',
    start_time: '08:30',
    end_date: '2026-08-16',
    end_time: '16:30',
    allow_late: true,
    is_active: true,
    evaluation_type: 'approval_only', // ตรวจแค่อนุมัติ/ไม่อนุมัติ ไม่ต้องให้คะแนน
    notes: 'ส่งก่อนเปิดภาคเรียนอย่างน้อย 1 สัปดาห์',
  },
  {
    id: 'type_full',
    name: 'แผนการจัดการเรียนรู้ฉบับสมบูรณ์',
    description: 'แผนการจัดการเรียนรู้เชิงรุก (Active Learning) ฉบับสมบูรณ์ พร้อมแบบวัดและประเมินผล',
    academic_year: '2569',
    semester: '1',
    start_date: '2026-08-01',
    start_time: '08:30',
    end_date: '2026-08-18',
    end_time: '23:59',
    allow_late: true,
    is_active: true,
    evaluation_type: 'rubric_score', // ตรวจแบบให้คะแนนรูบริก 100 คะแนน
    notes: 'ส่งไฟล์ PDF ทางลิงก์ พร้อมบันทึกข้อเสนอแนะและแบบรูบริกส์',
  },
];

export const DEFAULT_STATUS_CONFIGS: PlanStatusConfig[] = [
  {
    id: 'submitted',
    label: 'รอตรวจ',
    color: 'amber',
    description: 'ส่งแผนแล้ว อยู่ระหว่างรอฝ่ายวิชาการ/ผู้ตรวจประเมินตรวจ',
    is_system: true,
  },
  {
    id: 'approved',
    label: 'อนุมัติแล้ว',
    color: 'emerald',
    description: 'แผนผ่านเกณฑ์การประเมินและได้รับอนุมัติการสอนเรียบร้อย',
    is_system: true,
  },
  {
    id: 'needs_revision',
    label: 'ส่งกลับแก้ไข',
    color: 'rose',
    description: 'มีข้อเสนอแนะจากผู้ตรวจ ครูผู้สอนต้องปรับปรุงแล้วส่งใหม่',
    is_system: true,
  },
  {
    id: 'late',
    label: 'ส่งล่าช้า (เลยกำหนด)',
    color: 'orange',
    description: 'ส่งแผนเกินวันและเวลาที่กำหนดไว้สำหรับประเภทเอกสารนี้',
    is_system: true,
  },
];

/**
 * Load saved deadline configs from LocalStorage or fall back to defaults
 */
export function getSavedDeadlineConfigs(): PlanTypeDeadlineConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DEADLINES);
    if (raw) {
      const parsed: PlanTypeDeadlineConfig[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse deadline configs:', e);
  }
  return DEFAULT_DEADLINE_CONFIGS;
}

/**
 * Save deadline configs to LocalStorage
 */
export function saveDeadlineConfigs(configs: PlanTypeDeadlineConfig[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_DEADLINES, JSON.stringify(configs));
  } catch (e) {
    console.error('Failed to save deadline configs:', e);
  }
}

/**
 * Determine evaluation type ('rubric_score' or 'approval_only') for a given plan type
 */
export function getPlanEvaluationType(
  planTypeOrName?: string,
  configs?: PlanTypeDeadlineConfig[]
): EvaluationType {
  if (!planTypeOrName) return 'rubric_score';
  const allConfigs = configs && configs.length > 0 ? configs : getSavedDeadlineConfigs();
  const trimmed = planTypeOrName.trim().toLowerCase();
  const found = allConfigs.find((c) => (c.name || '').trim().toLowerCase() === trimmed);
  if (found && found.evaluation_type) {
    return found.evaluation_type;
  }
  // Smart default: if the title mentions 'ฉบับย่อ' or 'ย่อ', default to 'approval_only', else 'rubric_score'
  if (trimmed.includes('ฉบับย่อ') || trimmed.includes('ย่อ')) {
    return 'approval_only';
  }
  return 'rubric_score';
}

/**
 * Load saved status configs from LocalStorage or fall back to defaults
 */
export function getSavedStatusConfigs(): PlanStatusConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STATUSES);
    if (raw) {
      const parsed: PlanStatusConfig[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse status configs:', e);
  }
  return DEFAULT_STATUS_CONFIGS;
}

/**
 * Save status configs to LocalStorage
 */
export function saveStatusConfigs(configs: PlanStatusConfig[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_STATUSES, JSON.stringify(configs));
  } catch (e) {
    console.error('Failed to save status configs:', e);
  }
}

/**
 * Parses date string (ISO or 'YYYY-MM-DD HH:mm') safely to Date
 */
export function parseDateSafe(dateStr?: string): Date {
  if (!dateStr) return new Date();
  // If format is YYYY-MM-DD HH:mm
  if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(dateStr)) {
    const [d, t] = dateStr.split(/\s+/);
    return new Date(`${d}T${t}:00`);
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Constructs a Date object from date (YYYY-MM-DD) and time (HH:mm)
 */
export function constructDateTime(dateStr: string, timeStr: string = '23:59'): Date {
  const time = timeStr && timeStr.trim() ? timeStr.trim() : '23:59';
  const cleanTime = time.length === 5 ? `${time}:00` : time;
  return new Date(`${dateStr}T${cleanTime}`);
}

/**
 * Formats a Date or ISO string into friendly Thai readable string
 * e.g. "16 ส.ค. 2569 เวลา 16:30 น."
 */
export function formatThaiDateTime(dateInput: Date | string): string {
  const d = typeof dateInput === 'string' ? parseDateSafe(dateInput) : dateInput;
  if (!d || isNaN(d.getTime())) return '-';

  const day = d.getDate();
  const months = [
    'ม.ค.',
    'ก.พ.',
    'มี.ค.',
    'เม.ย.',
    'พ.ค.',
    'มิ.ย.',
    'ก.ค.',
    'ส.ค.',
    'ก.ย.',
    'ต.ค.',
    'พ.ย.',
    'ธ.ค.',
  ];
  const month = months[d.getMonth()];
  const yearBE = d.getFullYear() + (d.getFullYear() < 2500 ? 543 : 0);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return `${day} ${month} ${yearBE} เวลา ${hours}:${minutes} น.`;
}

/**
 * Formats a deadline configuration to friendly display
 */
export function formatDeadlineRange(config: PlanTypeDeadlineConfig): string {
  const startStr = `${config.start_date} ${config.start_time}`;
  const endStr = `${config.end_date} ${config.end_time}`;
  return `${formatThaiDateTime(startStr)} - ${formatThaiDateTime(endStr)}`;
}

export interface SubmissionTimelinessResult {
  isLate: boolean;
  delayText: string;
  diffMinutes: number;
  deadlineDate: Date | null;
  formattedDeadline: string;
  configFound: boolean;
  allowLate: boolean;
  hasStarted: boolean;
  startDate: Date | null;
}

/**
 * Checks whether a given plan submission is late according to the document type's deadline
 */
export function checkSubmissionTimeliness(
  planType: string,
  submittedAtInput: string | Date,
  configs?: PlanTypeDeadlineConfig[]
): SubmissionTimelinessResult {
  const deadlineConfigs = configs || getSavedDeadlineConfigs();
  const targetConfig = deadlineConfigs.find(
    (c) => c.name.trim().toLowerCase() === planType.trim().toLowerCase()
  );

  const subDate =
    typeof submittedAtInput === 'string'
      ? parseDateSafe(submittedAtInput)
      : submittedAtInput;

  if (!targetConfig) {
    return {
      isLate: false,
      delayText: 'ตรงเวลา',
      diffMinutes: 0,
      deadlineDate: null,
      formattedDeadline: 'ไม่ระบุกำหนดส่ง',
      configFound: false,
      allowLate: true,
      hasStarted: true,
      startDate: null,
    };
  }

  const deadlineDate = constructDateTime(
    targetConfig.end_date,
    targetConfig.end_time || '23:59'
  );
  const startDate = constructDateTime(
    targetConfig.start_date,
    targetConfig.start_time || '00:00'
  );

  const subTime = subDate.getTime();
  const deadTime = deadlineDate.getTime();
  const startTime = startDate.getTime();

  const isLate = subTime > deadTime;
  const hasStarted = subTime >= startTime;

  let delayText = 'ตรงเวลา';
  const diffMs = Math.abs(subTime - deadTime);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const remainingHours = diffHours % 24;

  if (isLate) {
    if (diffDays > 0) {
      delayText = `ส่งช้ากว่ากำหนด ${diffDays} วัน ${remainingHours > 0 ? `${remainingHours} ชม.` : ''}`.trim();
    } else if (diffHours > 0) {
      delayText = `ส่งช้ากว่ากำหนด ${diffHours} ชั่วโมง`;
    } else {
      delayText = `ส่งช้ากว่ากำหนด ${Math.max(1, diffMinutes)} นาที`;
    }
  } else {
    if (diffDays > 0) {
      delayText = `ส่งตรงเวลา (ก่อนกำหนด ${diffDays} วัน)`;
    } else {
      delayText = 'ส่งตรงเวลา';
    }
  }

  return {
    isLate,
    delayText,
    diffMinutes: isLate ? diffMinutes : -diffMinutes,
    deadlineDate,
    formattedDeadline: formatThaiDateTime(deadlineDate),
    configFound: true,
    allowLate: targetConfig.allow_late ?? true,
    hasStarted,
    startDate,
  };
}

/**
 * Checks if a plan is late (either explicitly flagged by admin or computed by deadline)
 */
export function isPlanLate(
  plan: LessonPlan,
  configs?: PlanTypeDeadlineConfig[]
): boolean {
  if (plan.is_late !== undefined) {
    return plan.is_late;
  }
  const result = checkSubmissionTimeliness(plan.plan_type, plan.submitted_at, configs);
  return result.isLate;
}

/**
 * Returns Tailwind color style classes for a given status color key
 */
export function getStatusStyle(color: StatusColor = 'indigo'): {
  bg: string;
  text: string;
  border: string;
  badge: string;
  dot: string;
} {
  switch (color) {
    case 'emerald':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'amber':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        badge: 'bg-amber-100 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'rose':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        badge: 'bg-rose-100 text-rose-800 border-rose-200',
        dot: 'bg-rose-500',
      };
    case 'orange':
      return {
        bg: 'bg-orange-50',
        text: 'text-orange-700',
        border: 'border-orange-200',
        badge: 'bg-orange-100 text-orange-800 border-orange-200',
        dot: 'bg-orange-500',
      };
    case 'sky':
      return {
        bg: 'bg-sky-50',
        text: 'text-sky-700',
        border: 'border-sky-200',
        badge: 'bg-sky-100 text-sky-800 border-sky-200',
        dot: 'bg-sky-500',
      };
    case 'purple':
      return {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-200',
        badge: 'bg-purple-100 text-purple-800 border-purple-200',
        dot: 'bg-purple-500',
      };
    case 'slate':
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-300',
        badge: 'bg-slate-200 text-slate-800 border-slate-300',
        dot: 'bg-slate-500',
      };
    case 'indigo':
    default:
      return {
        bg: 'bg-indigo-50',
        text: 'text-indigo-700',
        border: 'border-indigo-200',
        badge: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        dot: 'bg-indigo-500',
      };
  }
}

/**
 * Returns formatted status info for a plan
 */
export function getPlanStatusInfo(
  statusId: string,
  statusConfigs?: PlanStatusConfig[]
): {
  id: string;
  label: string;
  color: StatusColor;
  style: ReturnType<typeof getStatusStyle>;
} {
  const configs = statusConfigs || getSavedStatusConfigs();
  const found = configs.find((c) => c.id === statusId);

  if (found) {
    return {
      id: found.id,
      label: found.label,
      color: found.color,
      style: getStatusStyle(found.color),
    };
  }

  // Fallback defaults if id matches traditional keys
  if (statusId === 'approved') {
    return {
      id: 'approved',
      label: 'อนุมัติแล้ว',
      color: 'emerald',
      style: getStatusStyle('emerald'),
    };
  }
  if (statusId === 'needs_revision') {
    return {
      id: 'needs_revision',
      label: 'ส่งกลับแก้ไข',
      color: 'rose',
      style: getStatusStyle('rose'),
    };
  }
  if (statusId === 'late') {
    return {
      id: 'late',
      label: 'ส่งล่าช้า (เลยกำหนด)',
      color: 'orange',
      style: getStatusStyle('orange'),
    };
  }

  return {
    id: statusId || 'submitted',
    label: statusId || 'รอตรวจ',
    color: 'amber',
    style: getStatusStyle('amber'),
  };
}
