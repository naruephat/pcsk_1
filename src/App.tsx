import React, { useState, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import {
  Teacher,
  LessonPlan,
  PlanStatus,
  isTeacherAdmin,
  isTeacherExecutive,
  PlanTypeDeadlineConfig,
  PlanStatusConfig,
} from './types';
import {
  fetchTeachers,
  getLocalTeachers,
  updateTeacherRecord,
  fetchPlans,
  savePlanRecord,
  deletePlanRecord,
  getSavedSupabaseConfig,
  subscribeToDatabaseChanges,
  fetchSystemSetting,
  saveSystemSetting,
} from './services/supabaseClient';
import {
  getSavedDeadlineConfigs,
  saveDeadlineConfigs,
  getSavedStatusConfigs,
  saveStatusConfigs,
  checkSubmissionTimeliness,
  getPlanStatusInfo,
  DEFAULT_DEADLINE_CONFIGS,
  DEFAULT_STATUS_CONFIGS,
} from './utils/deadlineUtils';
import { Navbar } from './components/Navbar';
import { DashboardStats } from './components/DashboardStats';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { LessonPlanCard } from './components/LessonPlanCard';
import { SubmitPlanModal } from './components/SubmitPlanModal';
import { ReviewPlanModal } from './components/ReviewPlanModal';
import { ProfileModal } from './components/ProfileModal';
import { ForcePasswordModal } from './components/ForcePasswordModal';
import { LoginModal } from './components/LoginModal';
import { LoginScreen } from './components/LoginScreen';
import { SubmissionReceiptModal } from './components/SubmissionReceiptModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { TeacherDirectoryModal } from './components/TeacherDirectoryModal';
import { FileStorageInfoModal } from './components/FileStorageInfoModal';
import { AdminTrackerModal } from './components/AdminTrackerModal';
import { EditPlanModal } from './components/EditPlanModal';
import { ConfirmDeleteModal } from './components/ConfirmDeleteModal';
import { ResubmitPlanModal } from './components/ResubmitPlanModal';
import { LoadingScreen } from './components/LoadingScreen';
import { DeadlineManagerModal } from './components/DeadlineManagerModal';
import {
  Search,
  Filter,
  PlusCircle,
  BookOpen,
  FileCheck2,
  ListFilter,
  LayoutGrid,
  Layers,
  GraduationCap,
  Sparkles,
  Database,
  HardDrive,
  ShieldCheck,
  ClipboardList,
  Calendar,
  BarChart3,
  FileText,
} from 'lucide-react';

export default function App() {
  const [teachers, setTeachers] = useState<Teacher[]>(() => getLocalTeachers());
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters & Views
  const [viewTab, setViewTab] = useState<'all' | 'my' | 'pending_review' | 'approved' | 'needs_revision'>('all');
  const [mainView, setMainView] = useState<'plans' | 'executive'>('plans');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [areaFilter, setAreaFilter] = useState<string>('');

  // Auto-switch to executive dashboard for leadership accounts
  useEffect(() => {
    if (currentTeacher && isTeacherExecutive(currentTeacher)) {
      setMainView('executive');
    }
  }, [currentTeacher]);

  // Modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isDirectoryModalOpen, setIsDirectoryModalOpen] = useState(false);
  const [isFileStorageModalOpen, setIsFileStorageModalOpen] = useState(false);
  const [isAdminTrackerModalOpen, setIsAdminTrackerModalOpen] = useState(false);
  const [isDeadlineModalOpen, setIsDeadlineModalOpen] = useState(false);
  const [deadlineConfigs, setDeadlineConfigs] = useState<PlanTypeDeadlineConfig[]>(() => getSavedDeadlineConfigs());
  const [statusConfigs, setStatusConfigs] = useState<PlanStatusConfig[]>(() => getSavedStatusConfigs());
  const [planToEdit, setPlanToEdit] = useState<LessonPlan | null>(null);
  const [selectedPlanForReview, setSelectedPlanForReview] = useState<LessonPlan | null>(null);
  const [selectedPlanForReceipt, setSelectedPlanForReceipt] = useState<LessonPlan | null>(null);
  const [teacherToEdit, setTeacherToEdit] = useState<Teacher | null>(null);
  const [planToDelete, setPlanToDelete] = useState<LessonPlan | null>(null);
  const [planToResubmit, setPlanToResubmit] = useState<LessonPlan | null>(null);
  const [toastNotice, setToastNotice] = useState<{
    type: 'success' | 'warning' | 'error' | 'info';
    message: string;
    details?: string;
  } | null>(null);

  const [lastSyncTime, setLastSyncTime] = useState<string>('เพิ่งเริ่มต้น');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Silent sync and re-fetch from database
  const syncWithDatabase = async (silent: boolean = true) => {
    setIsSyncing(true);
    try {
      const [teachersRes, plansRes, dlSettingsRes, statusSettingsRes] = await Promise.all([
        fetchTeachers(),
        fetchPlans(),
        fetchSystemSetting<PlanTypeDeadlineConfig[]>('deadline_configs', getSavedDeadlineConfigs()),
        fetchSystemSetting<PlanStatusConfig[]>('status_configs', getSavedStatusConfigs()),
      ]);
      setTeachers(teachersRes.data);
      setIsSupabaseConnected(teachersRes.isSupabase || plansRes.isSupabase);

      let effectiveDl = getSavedDeadlineConfigs();
      if (dlSettingsRes.isSupabase && Array.isArray(dlSettingsRes.data) && dlSettingsRes.data.length > 0) {
        effectiveDl = dlSettingsRes.data;
        saveDeadlineConfigs(dlSettingsRes.data);
        setDeadlineConfigs(dlSettingsRes.data);
      } else if (dlSettingsRes.isSupabase && (!dlSettingsRes.data || (Array.isArray(dlSettingsRes.data) && dlSettingsRes.data.length === 0))) {
        // Seed default deadline configs (แผนย่อ, แผนสมบูรณ์) to cloud if table is empty
        saveSystemSetting('deadline_configs', DEFAULT_DEADLINE_CONFIGS);
      }

      if (statusSettingsRes.isSupabase && Array.isArray(statusSettingsRes.data) && statusSettingsRes.data.length > 0) {
        saveStatusConfigs(statusSettingsRes.data);
        setStatusConfigs(statusSettingsRes.data);
      } else if (statusSettingsRes.isSupabase && (!statusSettingsRes.data || (Array.isArray(statusSettingsRes.data) && statusSettingsRes.data.length === 0))) {
        saveSystemSetting('status_configs', DEFAULT_STATUS_CONFIGS);
      }

      const evaluated = plansRes.data.map((p) => {
        if (p.is_late === undefined) {
          const tl = checkSubmissionTimeliness(p.plan_type, p.submitted_at, effectiveDl);
          return {
            ...p,
            is_late: tl.isLate,
            submission_delay_text: p.submission_delay_text || tl.delayText,
            deadline_at: p.deadline_at || tl.formattedDeadline,
          };
        }
        return p;
      });
      setPlans(evaluated);

      const now = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSyncTime(now);

      if (!silent) {
        setToastNotice({
          type: 'success',
          message: 'ซิงค์ข้อมูลกับฐานข้อมูลล่าสุดสำเร็จแล้ว!',
          details: `ดึงข้อมูลแผนการสอน ${plansRes.data.length} รายการ และบุคลากร ${teachersRes.data.length} ท่าน (สถานะ: ${
            plansRes.isSupabase ? 'เชื่อมต่อ Supabase SQL เรียบร้อย' : 'ใช้งาน Local Storage'
          })`,
        });
      }
    } catch (e) {
      console.error('Error syncing with database:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Load initial data
  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        syncWithDatabase(true),
        new Promise((resolve) => setTimeout(resolve, 750)),
      ]);

      // Restore active user session if previously logged in
      const savedUserEmail = localStorage.getItem('lp_current_user_email');
      if (savedUserEmail) {
        const teachersRes = await fetchTeachers();
        const found = teachersRes.data.find(
          (t) =>
            t.Email.toLowerCase() === savedUserEmail.toLowerCase() ||
            t.Teacher_ID.toLowerCase() === savedUserEmail.toLowerCase()
        );
        if (found) {
          setCurrentTeacher(found);
        }
      }
    } catch (e) {
      console.error('Error loading data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // 1. Supabase Realtime Subscription: listens to any changes in lesson_plans and teachers
    const unsubscribe = subscribeToDatabaseChanges((table) => {
      console.log(`[App] Realtime event on table ${table}: auto-syncing...`);
      syncWithDatabase(true);
    });

    // 2. Periodic sync every 8 seconds to ensure website and DB are always strictly synchronized
    const interval = setInterval(() => {
      syncWithDatabase(true);
    }, 8000);

    // 3. Sync on window focus
    const onFocus = () => {
      syncWithDatabase(true);
    };
    window.addEventListener('focus', onFocus);

    return () => {
      unsubscribe();
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  // Update current user in storage when changed
  const handleSetCurrentUser = (teacher: Teacher) => {
    setIsLoading(true);
    setCurrentTeacher(teacher);
    if (isTeacherExecutive(teacher)) {
      setMainView('executive');
    } else {
      setMainView('plans');
    }
    localStorage.setItem('lp_current_user_email', teacher.Email);
    setIsLoginModalOpen(false);
    setTimeout(() => {
      setIsLoading(false);
    }, 600);
  };

  const handleLogout = () => {
    setIsLoading(true);
    localStorage.removeItem('lp_current_user_email');
    setCurrentTeacher(null);
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  };

  // Password update enforcement (auto-updates in DB)
  const handlePasswordChanged = async (updated: Teacher) => {
    const res = await updateTeacherRecord(updated);
    setTeachers((prev) =>
      prev.map((t) => (t.Teacher_ID === updated.Teacher_ID ? updated : t))
    );
    setCurrentTeacher(updated);
    await syncWithDatabase(true);

    setToastNotice({
      type: 'success',
      message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว',
      details: !isAdmin
        ? 'รหัสผ่านใหม่ของคุณมีผลใช้งานทันทีและระบบบันทึกเรียบร้อยแล้ว'
        : res.isSupabase
        ? 'ข้อมูลรหัสผ่านใหม่ถูกอัปเดตลงฐานข้อมูล Supabase SQL (ตาราง teachers) อัตโนมัติแล้ว'
        : 'บันทึกในเครื่องเรียบร้อยแล้ว',
    });
  };

  // Profile save (auto-updates in DB)
  const handleSaveProfile = async (updated: Teacher) => {
    const res = await updateTeacherRecord(updated);
    setTeachers((prev) =>
      prev.map((t) => (t.Teacher_ID === updated.Teacher_ID ? updated : t))
    );
    if (currentTeacher?.Teacher_ID === updated.Teacher_ID) {
      setCurrentTeacher(updated);
    }
    // Also sync teacher name in existing lesson plans if name changed
    setPlans((prev) =>
      prev.map((p) =>
        p.teacher_id === updated.Teacher_ID
          ? {
              ...p,
              teacher_name: updated.Name,
              teacher_photo: updated.photo,
              learning_area: updated.Learning_Area,
            }
          : p
      )
    );
    await syncWithDatabase(true);

    setToastNotice({
      type: 'success',
      message: 'บันทึกข้อมูลส่วนตัวสำเร็จ',
      details: !isAdmin
        ? 'ข้อมูลของคุณได้รับการอัปเดตเรียบร้อยแล้ว'
        : res.isSupabase
        ? 'ระบบได้อัปเดตข้อมูลของคุณลงในฐานข้อมูล Supabase SQL (ตาราง teachers) อัตโนมัติเรียบร้อยแล้ว'
        : 'บันทึกในเครื่องเรียบร้อยแล้ว (ยังไม่ได้เชื่อมต่อ Supabase SQL)',
    });
  };

  // Plan creation (auto-updates in DB)
  const handleCreatePlan = async (newPlan: LessonPlan) => {
    const res = await savePlanRecord(newPlan);
    setPlans((prev) => [newPlan, ...prev]);
    await syncWithDatabase(true);

    if (!isAdmin) {
      setToastNotice({
        type: 'success',
        message: 'ส่งแผนการสอนสำเร็จเรียบร้อยแล้ว!',
        details: 'ระบบได้บันทึกข้อมูลและส่งแผนการสอนเข้าสู่ระบบเรียบร้อยแล้ว',
      });
    } else {
      if (!res.isSupabase) {
        setToastNotice({
          type: 'warning',
          message: 'บันทึกแผนลงในเครื่อง (Local Storage) แล้ว',
          details: '⚠️ ยังไม่ได้เชื่อมต่อ Supabase Database จึงยังไม่เข้าตาราง SQL ในฐานข้อมูลภายนอก กรุณาคลิก "ตั้งค่า Supabase" เพื่อเชื่อมต่อและรันคำสั่งสร้างตาราง',
        });
      } else if (!res.success) {
        setToastNotice({
          type: 'error',
          message: 'บันทึกในเครื่องแล้ว แต่ Supabase SQL บันทึกไม่สำเร็จ',
          details: res.error || 'โปรดตรวจสอบว่าได้สร้างตาราง lesson_plans ใน Supabase SQL แล้วหรือไม่',
        });
      } else {
        setToastNotice({
          type: 'success',
          message: 'ส่งแผนการสอนสำเร็จและบันทึกลงตาราง Supabase SQL เรียบร้อยแล้ว!',
          details: 'ข้อมูลบนเว็บไซต์และในฐานข้อมูล SQL อัปเดตตรงกันทันที',
        });
      }
    }
    return res;
  };

  // Plan review update (auto-updates in DB)
  const handleSaveReview = async (updatedPlan: LessonPlan) => {
    const res = await savePlanRecord(updatedPlan);
    setPlans((prev) =>
      prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p))
    );
    await syncWithDatabase(true);

    if (res.isSupabase && res.success) {
      setToastNotice({
        type: 'success',
        message: 'อัปเดตผลการตรวจแผนลงใน Supabase SQL เรียบร้อยแล้ว!',
        details: 'ข้อมูลบนเว็บไซต์และในฐานข้อมูล SQL อัปเดตตรงกันทันที',
      });
    }
    return res;
  };

  // Execute deletion in state and DB (no window.confirm block)
  const executeDeletePlan = async (planId: string) => {
    const res = await deletePlanRecord(planId);
    setPlans((prev) => prev.filter((p) => p.id !== planId));
    await syncWithDatabase(true);

    setToastNotice({
      type: 'success',
      message: 'ลบแผนการสอนเรียบร้อยแล้ว',
      details: !isAdmin
        ? 'ระบบได้ลบข้อมูลออกจากระบบเรียบร้อยแล้ว'
        : res.isSupabase
        ? 'ระบบได้ลบข้อมูลออกจากฐานข้อมูล Supabase SQL (ตาราง lesson_plans) อัตโนมัติแล้ว'
        : 'ลบออกจากเครื่องเรียบร้อยแล้ว (ยังไม่ได้เชื่อมต่อ Supabase SQL)',
    });
  };

  // Open custom confirmation modal for deletion (safe for iframe preview)
  const handleDeletePlan = (planId: string) => {
    const targetPlan = plans.find((p) => p.id === planId);
    if (targetPlan) {
      setPlanToDelete(targetPlan);
    } else {
      executeDeletePlan(planId);
    }
  };

  // Resubmit plan (status -> 'submitted' to let admin review again)
  const handleResubmitPlan = async (updatedPlan: LessonPlan) => {
    const res = await savePlanRecord(updatedPlan);
    setPlans((prev) =>
      prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p))
    );
    await syncWithDatabase(true);

    setToastNotice({
      type: 'success',
      message: 'ส่งแผนการสอนใหม่อีกครั้งสำเร็จ!',
      details: 'สถานะเปลี่ยนเป็น "รอตรวจ (submitted)" เรียบร้อยแล้ว เพื่อให้ผู้ดูแลระบบและฝ่ายวิชาการตรวจประเมินอีกครั้ง',
    });
  };

  // Save deadline configurations (Admin)
  const handleSaveDeadlineConfigs = async (newConfigs: PlanTypeDeadlineConfig[]) => {
    saveDeadlineConfigs(newConfigs);
    setDeadlineConfigs(newConfigs);
    setPlans((prev) =>
      prev.map((p) => {
        const tl = checkSubmissionTimeliness(p.plan_type, p.submitted_at, newConfigs);
        return {
          ...p,
          is_late: p.is_late !== undefined ? p.is_late : tl.isLate,
          submission_delay_text: tl.delayText,
          deadline_at: tl.formattedDeadline,
        };
      })
    );
    const dbRes = await saveSystemSetting('deadline_configs', newConfigs);
    if (dbRes.success && dbRes.isSupabase) {
      setToastNotice({
        type: 'success',
        message: 'บันทึกประเภทเอกสารและวันส่งงานลง Cloud Database สำเร็จ!',
        details: `บันทึกข้อมูลประเภทเอกสาร ${newConfigs.length} รายการ (รวมแผนการจัดการเรียนรู้ฉบับย่อ, แผนฉบับสมบูรณ์ และประเภทใหม่) ลงใน Supabase เรียบร้อย ข้อมูลจะซิงค์ไปยังอุปกรณ์และคอมพิวเตอร์ของครูทุกคนทันที`,
      });
    } else if (!dbRes.success && dbRes.isSupabase) {
      setToastNotice({
        type: 'warning',
        message: 'บันทึกในเครื่องนี้แล้ว (แต่ยังไม่บันทึกลง Cloud Supabase)',
        details: `ข้อความจากฐานข้อมูล: ${dbRes.error || 'ตาราง system_settings อาจยังไม่ได้ถูกสร้าง'} — แนะนำกดปุ่ม "คัดลอก SQL ตารางระบบ" ในหน้าต่างกำหนดส่งงานไปรันใน Supabase SQL Editor เพื่อเปิดการซิงค์ข้ามเครื่อง`,
      });
    } else {
      setToastNotice({
        type: 'info',
        message: 'บันทึกประเภทเอกสารในเบราว์เซอร์เครื่องนี้เรียบร้อย',
        details: `บันทึกใน Local Storage เครื่องนี้แล้ว (เชื่อมต่อ Supabase หรือใช้ปุ่มคัดลอก JSON ส่งต่อไปยังคอมพิวเตอร์เครื่องอื่น)`,
      });
    }
  };

  // Save status configurations (Admin)
  const handleSaveStatusConfigs = async (newConfigs: PlanStatusConfig[]) => {
    saveStatusConfigs(newConfigs);
    setStatusConfigs(newConfigs);
    const dbRes = await saveSystemSetting('status_configs', newConfigs);
    if (dbRes.success && dbRes.isSupabase) {
      setToastNotice({
        type: 'success',
        message: 'บันทึกการปรับแต่งสถานะลง Cloud Database สำเร็จ!',
        details: `อัปเดตข้อมูลสถานะ ${newConfigs.length} รายการ ไปยังอุปกรณ์ของครูทุกคนเรียบร้อย`,
      });
    } else if (!dbRes.success && dbRes.isSupabase) {
      setToastNotice({
        type: 'warning',
        message: 'บันทึกลงเครื่องนี้แล้ว (แต่ยังไม่บันทึกลง Cloud)',
        details: `เกิดข้อผิดพลาด: ${dbRes.error || 'ตาราง system_settings ยังไม่ถูกสร้าง'} — กรุณาสร้างตาราง system_settings ใน Supabase`,
      });
    } else {
      setToastNotice({
        type: 'info',
        message: 'บันทึกการปรับแต่งสถานะในเครื่องนี้เรียบร้อย',
        details: `อัปเดตข้อมูลสถานะ ${newConfigs.length} สถานะ ใน Local Storage ของเบราว์เซอร์นี้`,
      });
    }
  };

  // Quick Change Plan Status (Admin)
  const handleQuickChangePlanStatus = async (
    planOrId: LessonPlan | string,
    newStatus: string,
    isLateOverride?: boolean,
    adminNotes?: string
  ) => {
    const planId = typeof planOrId === 'string' ? planOrId : planOrId.id;
    const targetPlan = plans.find((p) => p.id === planId);
    if (!targetPlan) return;

    const updatedPlan: LessonPlan = {
      ...targetPlan,
      status: newStatus,
      is_late: isLateOverride !== undefined ? isLateOverride : targetPlan.is_late,
      admin_notes: adminNotes !== undefined ? adminNotes : targetPlan.admin_notes,
    };

    setPlans((prev) => prev.map((p) => (p.id === planId ? updatedPlan : p)));
    await savePlanRecord(updatedPlan);
    await syncWithDatabase(true);

    const stInfo = getPlanStatusInfo(newStatus, statusConfigs);
    setToastNotice({
      type: 'success',
      message: `ปรับสถานะเป็น "${stInfo.label}" เรียบร้อยแล้ว`,
      details: `แผนรหัส ${updatedPlan.id} (${updatedPlan.subject_code}) ได้รับการอัปเดตสถานะใหม่เรียบร้อย`,
    });
  };

  // Toggle Plan Late status (Admin)
  const handleTogglePlanLate = async (plan: LessonPlan) => {
    const nextLate = !plan.is_late;
    const updatedPlan: LessonPlan = {
      ...plan,
      is_late: nextLate,
    };
    setPlans((prev) => prev.map((p) => (p.id === plan.id ? updatedPlan : p)));
    await savePlanRecord(updatedPlan);
    await syncWithDatabase(true);

    setToastNotice({
      type: 'info',
      message: nextLate ? 'ทำเครื่องหมายเป็น "ส่งช้า" แล้ว' : 'ทำเครื่องหมายเป็น "ส่งตรงเวลา" แล้ว',
      details: `แผนรหัส ${plan.id} (${plan.subject_code})`,
    });
  };

  // Must force password change if current logged-in teacher has Pass === '12345'
  const mustForceChangePassword = currentTeacher && currentTeacher.Pass === '12345';
  const isAdmin = isTeacherAdmin(currentTeacher);

  // Filtered plans logic
  const filteredPlans = plans.filter((plan) => {
    // CRITICAL: Regular teachers can ONLY see their own plans! Cannot see other IDs!
    if (!isAdmin) {
      if (plan.teacher_id !== currentTeacher?.Teacher_ID) {
        return false;
      }
      if (viewTab === 'pending_review' && plan.status !== 'submitted') {
        return false;
      }
      if (viewTab === 'approved' && plan.status !== 'approved') {
        return false;
      }
      if (viewTab === 'needs_revision' && plan.status !== 'needs_revision') {
        return false;
      }
      if ((viewTab as any) === 'late' && !plan.is_late) {
        return false;
      }
    }

    // Status filter (Admin)
    if (isAdmin && statusFilter !== 'all') {
      if (statusFilter === 'late') {
        if (!plan.is_late) return false;
      } else if (plan.status !== statusFilter) {
        return false;
      }
    }

    // Area filter (Admin)
    if (isAdmin && areaFilter && plan.learning_area !== areaFilter) {
      return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSubject =
        plan.subject_code.toLowerCase().includes(q) ||
        plan.subject_name.toLowerCase().includes(q);
      const matchTitle = plan.plan_title.toLowerCase().includes(q);
      if (!isAdmin) {
        if (!matchSubject && !matchTitle) return false;
      } else {
        const matchTeacher =
          plan.teacher_name.toLowerCase().includes(q) ||
          plan.teacher_id.toLowerCase().includes(q);
        const matchArea = plan.learning_area.toLowerCase().includes(q);
        if (!matchSubject && !matchTitle && !matchTeacher && !matchArea) {
          return false;
        }
      }
    }

    return true;
  });

  // If data is initializing, show full-page LoadingScreen with dancing dinosaur
  if (isLoading) {
    return <LoadingScreen message="กำลังโหลดข้อมูลระบบ..." subMessage="โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย กาฬสินธุ์" />;
  }

  // If user is not logged in, show full-page LoginScreen with school logo
  if (!currentTeacher) {
    return (
      <>
        <LoginScreen
          teachers={teachers}
          isSupabaseConnected={isSupabaseConnected}
          onLogin={handleSetCurrentUser}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          onShowLoadingDemo={() => {
            setIsLoading(true);
            setTimeout(() => setIsLoading(false), 2200);
          }}
        />
        <SupabaseConfigModal
          isOpen={isSupabaseModalOpen}
          onClose={() => setIsSupabaseModalOpen(false)}
          onConfigSaved={() => loadData()}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-['Prompt',sans-serif]">
      {/* Navigation Bar */}
      <Navbar
        currentTeacher={currentTeacher}
        isSupabaseConnected={isSupabaseConnected}
        onOpenSubmitModal={() => setIsSubmitModalOpen(true)}
        onOpenProfileModal={() => {
          setTeacherToEdit(currentTeacher);
          setIsProfileModalOpen(true);
        }}
        onOpenDirectoryModal={() => setIsDirectoryModalOpen(true)}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onOpenFileStorageModal={() => setIsFileStorageModalOpen(true)}
        onOpenAdminTrackerModal={() => setIsAdminTrackerModalOpen(true)}
        onOpenDeadlineManager={() => setIsDeadlineModalOpen(true)}
        onOpenExecutiveDashboard={() => setMainView('executive')}
        onLogout={handleLogout}
        lastSyncTime={lastSyncTime}
        isSyncing={isSyncing}
        onManualSync={() => syncWithDatabase(false)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
        {/* Toast / Status Notice */}
        {toastNotice && (
          <div
            className={`p-4 rounded-2xl border shadow-sm flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
              toastNotice.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : toastNotice.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : toastNotice.type === 'error'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-indigo-50 border-indigo-200 text-indigo-900'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  toastNotice.type === 'success'
                    ? 'bg-emerald-100 text-emerald-700'
                    : toastNotice.type === 'warning'
                    ? 'bg-amber-100 text-amber-700'
                    : toastNotice.type === 'error'
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-indigo-100 text-indigo-700'
                }`}
              >
                {toastNotice.type === 'success' && <FileCheck2 className="w-5 h-5" />}
                {toastNotice.type === 'warning' && <Database className="w-5 h-5" />}
                {toastNotice.type === 'error' && <ShieldCheck className="w-5 h-5" />}
                {toastNotice.type === 'info' && <Sparkles className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-sm font-bold">{toastNotice.message}</p>
                {toastNotice.details && (
                  <p className="text-xs opacity-90 mt-1 whitespace-pre-line leading-relaxed">
                    {toastNotice.details}
                  </p>
                )}
                {toastNotice.type === 'warning' && isAdmin && (
                  <button
                    onClick={() => {
                      setToastNotice(null);
                      setIsSupabaseModalOpen(true);
                    }}
                    className="mt-2 text-xs font-bold underline hover:opacity-80 flex items-center gap-1 text-amber-950"
                  >
                    <span>คลิกที่นี่เพื่อตั้งค่า Supabase URL / Key และรัน SQL Script</span>
                    <span>→</span>
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => setToastNotice(null)}
              className="p-1 rounded-lg hover:bg-black/5 opacity-60 hover:opacity-100 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Banner with Welcome & Actions */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-900/10 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md text-sky-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                ภาคเรียนที่ 1 ปีการศึกษา 2569
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {isTeacherExecutive(currentTeacher)
                  ? `ยินดีต้อนรับ ${currentTeacher.Name}`
                  : `ยินดีต้อนรับ ${currentTeacher?.Name || 'อาจารย์'}`}
              </h2>
              <p className="text-indigo-100 text-xs sm:text-sm max-w-xl">
                {isTeacherExecutive(currentTeacher)
                  ? 'ศูนย์บัญชาการข้อมูลฝ่ายบริหาร: ติดตามสถานะการส่งงานรายคน รายกลุ่มสาระ สรุปช้าเร็วตรงเวลา พร้อมกราฟและรายงานผู้บริหาร'
                  : isAdmin
                  ? 'ระบบจัดการและส่งแผนการจัดการเรียนรู้ออนไลน์ พร้อมระบบอนุมัติและประเมินคุณภาพทุกกลุ่มสาระ'
                  : `เชื่อมต่อฐานข้อมูลบุคลากรครู ${teachers.length} ท่าน พร้อมระบบส่งเอกสารออนไลน์`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {/* Submit Document button: only for teachers, hidden for admin */}
              {!isAdmin && (
                <button
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="px-5 py-2.5 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl text-xs sm:text-sm font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4 text-indigo-600" />
                  ส่งเอกสาร
                </button>
              )}

              {/* Quick View Toggle for Admins */}
              {isAdmin && (
                <button
                  onClick={() => setMainView(mainView === 'executive' ? 'plans' : 'executive')}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2 ${
                    mainView === 'executive'
                      ? 'bg-white text-indigo-950 hover:bg-indigo-50'
                      : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                  }`}
                >
                  {mainView === 'executive' ? (
                    <>
                      <FileText className="w-4 h-4 text-indigo-700" />
                      <span>ดูรายการแผนการสอน ({plans.length})</span>
                    </>
                  ) : (
                    <>
                      <BarChart3 className="w-4 h-4 text-slate-950" />
                      <span>ดูแดชบอร์ดบริหาร (กราฟ)</span>
                    </>
                  )}
                </button>
              )}

              {/* Admin sees prominent tracker button */}
              {isAdmin && (
                <button
                  onClick={() => setIsAdminTrackerModalOpen(true)}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl text-xs sm:text-sm font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2"
                >
                  <ClipboardList className="w-4 h-4 text-slate-900" />
                  <span>ติดตามส่งแผนรายบุคคล</span>
                </button>
              )}

              <button
                onClick={() => {
                  setTeacherToEdit(currentTeacher);
                  setIsProfileModalOpen(true);
                }}
                className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white backdrop-blur-md rounded-xl text-xs sm:text-sm font-medium transition-colors border border-white/20"
              >
                แก้ไขข้อมูลส่วนตัว
              </button>
            </div>
          </div>

          {/* Decorative background shapes */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        {/* View Switcher for Admins & Leadership */}
        {isAdmin && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMainView('executive')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                  mainView === 'executive'
                    ? 'bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-emerald-300" />
                <span>แดชบอร์ดฝ่ายบริหาร & กราฟสถิติ</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-extrabold ml-1">
                  Executive
                </span>
              </button>

              <button
                onClick={() => setMainView('plans')}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                  mainView === 'plans'
                    ? 'bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4 text-indigo-400" />
                <span>รายการแผนการสอนทั้งหมด ({plans.length})</span>
              </button>
            </div>

            <div className="text-xs text-slate-500 font-medium px-2 flex items-center gap-2">
              <span>มุมมองปัจจุบัน:</span>
              <span className="font-bold text-indigo-600">
                {mainView === 'executive' ? '📊 แดชบอร์ดภาพรวมและกราฟ' : '📑 รายการแผนและการตรวจประเมิน'}
              </span>
            </div>
          </div>
        )}

        {/* Special Admin Control Notification Bar (shown on plans view) */}
        {isAdmin && mainView === 'plans' && (
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border-2 border-amber-300/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-900 flex items-center justify-center shrink-0 font-bold shadow-sm">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>โหมดผู้ดูแลระบบ (Admin: {currentTeacher?.Teacher_ID})</span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                    Super Admin
                  </span>
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  ท่านสามารถติดตามดูว่าครูคนใดส่งแผนแล้วบ้างแยกตามกลุ่มสาระการเรียนรู้ และมีสิทธิ์แก้ไขข้อมูลแผนการสอนรวมถึงข้อมูลครูทุกคนในระบบ
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                onClick={() => setIsDeadlineModalOpen(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                title="กำหนดช่วงเวลาส่งของแต่ละประเภทเอกสาร และปรับแต่งสถานะทั้งหมด"
              >
                <Calendar className="w-3.5 h-3.5 text-amber-200" />
                <span>กำหนดวันเวลาส่ง & จัดการสถานะ</span>
              </button>
              <button
                onClick={() => setIsAdminTrackerModalOpen(true)}
                className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
                <span>เปิดตารางติดตามการส่งแผน</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Display: Either Executive Dashboard OR Plans Grid */}
        {isAdmin && mainView === 'executive' ? (
          <ExecutiveDashboard
            teachers={teachers}
            plans={plans}
            currentTeacher={currentTeacher}
            deadlineConfigs={deadlineConfigs}
            onOpenPlan={(plan) => setSelectedPlanForReview(plan)}
            onOpenDeadlineManager={() => setIsDeadlineModalOpen(true)}
            onOpenDirectoryModal={() => setIsDirectoryModalOpen(true)}
          />
        ) : (
          <>
            {/* Dashboard Statistics */}
            <DashboardStats
              plans={plans}
              teachers={teachers}
              currentTeacher={currentTeacher}
              selectedArea={areaFilter}
              onSelectArea={(area) => setAreaFilter(area)}
            />

        {/* Lesson Plans Control Bar */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* View Tabs */}
            {!isAdmin ? (
              <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl text-xs sm:text-sm font-medium gap-1">
                <button
                  onClick={() => setViewTab('all')}
                  className={`px-3.5 py-2 rounded-lg transition-all ${
                    viewTab === 'all'
                      ? 'bg-white text-indigo-900 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  แผนของฉันทั้งหมด ({plans.filter((p) => p.teacher_id === currentTeacher?.Teacher_ID).length})
                </button>
                <button
                  onClick={() => setViewTab('pending_review')}
                  className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                    viewTab === 'pending_review'
                      ? 'bg-white text-amber-900 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>รอตรวจ</span>
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>({plans.filter((p) => p.teacher_id === currentTeacher?.Teacher_ID && p.status === 'submitted').length})</span>
                </button>
                <button
                  onClick={() => setViewTab('approved')}
                  className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                    viewTab === 'approved'
                      ? 'bg-white text-emerald-900 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>อนุมัติแล้ว</span>
                  <span>({plans.filter((p) => p.teacher_id === currentTeacher?.Teacher_ID && p.status === 'approved').length})</span>
                </button>
                <button
                  onClick={() => setViewTab('needs_revision')}
                  className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                    viewTab === 'needs_revision'
                      ? 'bg-white text-rose-900 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>ส่งกลับแก้ไข</span>
                  <span>({plans.filter((p) => p.teacher_id === currentTeacher?.Teacher_ID && p.status === 'needs_revision').length})</span>
                </button>
                <button
                  onClick={() => setViewTab('late' as any)}
                  className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 ${
                    (viewTab as any) === 'late'
                      ? 'bg-white text-orange-950 shadow-sm font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>ส่งช้า</span>
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  <span>({plans.filter((p) => p.teacher_id === currentTeacher?.Teacher_ID && p.is_late).length})</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="px-3.5 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-950 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>แผนทั้งหมดในระบบ ({plans.length} แผน)</span>
                </div>
              </div>
            )}

            {/* Status Filter buttons (Admin Only - Dynamic from statusConfigs) */}
            {isAdmin && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 text-xs">
                <span className="text-slate-400 text-xs shrink-0 flex items-center gap-1">
                  <ListFilter className="w-3.5 h-3.5" />
                  สถานะ:
                </span>
                {(() => {
                  const seen = new Set<string>();
                  const buttons: { id: string; label: string }[] = [];
                  buttons.push({ id: 'all', label: 'ทั้งหมด' });
                  seen.add('all');
                  buttons.push({ id: 'late', label: '⚠️ ส่งช้า' });
                  seen.add('late');

                  (statusConfigs || []).forEach((s) => {
                    const cleanId = (s.id || '').trim().toLowerCase();
                    if (!cleanId || seen.has(cleanId)) return;
                    seen.add(cleanId);
                    buttons.push({ id: s.id.trim(), label: s.label });
                  });

                  return buttons.map((s) => (
                    <button
                      key={`status-filter-${s.id}`}
                      onClick={() => setStatusFilter(s.id)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        statusFilter === s.id
                          ? 'bg-indigo-600 text-white font-bold shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {s.label}
                    </button>
                  ));
                })()}
              </div>
            )}
          </div>

          {/* Search bar & Active filter indicators */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 border-t border-slate-100">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหารหัสวิชา (ว31101), ชื่อวิชา, ชื่อแผน, หรือชื่อครูผู้สอน..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white"
              />
            </div>

            {areaFilter && (
              <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0">
                <span>กลุ่มสาระ: {areaFilter}</span>
                <button
                  onClick={() => setAreaFilter('')}
                  className="hover:text-indigo-900 font-bold ml-1"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Lesson Plans Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-indigo-600" />
              <span>รายการแผนการจัดการเรียนรู้</span>
              <span className="text-xs text-slate-500 font-normal">
                (พบ {filteredPlans.length} รายการ)
              </span>
            </h3>
          </div>

          {filteredPlans.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto text-indigo-400">
                <BookOpen className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-800">
                ไม่พบแผนการสอนที่ตรงกับเงื่อนไขการค้นหา
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isAdmin
                  ? 'ยังไม่มีรายการแผนการสอนที่ตรงกับตัวกรอง ท่านสามารถติดตามภาพรวมได้ที่ปุ่มติดตามส่งแผนรายบุคคล'
                  : 'ลองปรับเปลี่ยนคำค้นหา หรือคลิกปุ่มส่งเอกสารเพื่อเริ่มสร้างรายการ'}
              </p>
              {!isAdmin && (
                <button
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  ส่งเอกสาร
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPlans.map((plan) => (
                <LessonPlanCard
                  key={plan.id}
                  plan={plan}
                  currentTeacher={currentTeacher || teachers[0]}
                  onOpenReceipt={(p) => setSelectedPlanForReceipt(p)}
                  onOpenReview={(p) => setSelectedPlanForReview(p)}
                  onDeletePlan={(id) => handleDeletePlan(id)}
                  onEditPlan={(p) => setPlanToEdit(p)}
                  onResubmitPlan={(p) => setPlanToResubmit(p)}
                  statusConfigs={statusConfigs}
                  deadlineConfigs={deadlineConfigs}
                  onQuickChangeStatus={handleQuickChangePlanStatus}
                  onToggleLate={handleTogglePlanLate}
                />
              ))}
            </div>
          )}
        </div>
      </>
    )}
  </main>

      {/* Mandatory Force Password Change Modal (Pass === '12345') */}
      {mustForceChangePassword && currentTeacher && (
        <ForcePasswordModal
          teacher={currentTeacher}
          onPasswordChanged={handlePasswordChanged}
        />
      )}

      {/* Submit Plan Modal */}
      {currentTeacher && (
        <SubmitPlanModal
          currentTeacher={currentTeacher}
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          onSubmit={handleCreatePlan}
          isSupabaseConnected={isSupabaseConnected}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
          deadlineConfigs={deadlineConfigs}
        />
      )}

      {/* Profile Modal */}
      {teacherToEdit && (
        <ProfileModal
          teacher={teacherToEdit}
          isOpen={isProfileModalOpen}
          onClose={() => {
            setIsProfileModalOpen(false);
            setTeacherToEdit(null);
          }}
          onSave={handleSaveProfile}
        />
      )}

      {/* Review Plan Modal */}
      {selectedPlanForReview && currentTeacher && (
        <ReviewPlanModal
          plan={selectedPlanForReview}
          reviewer={currentTeacher}
          isOpen={!!selectedPlanForReview}
          onClose={() => setSelectedPlanForReview(null)}
          onSaveReview={handleSaveReview}
          statusConfigs={statusConfigs}
        />
      )}

      {/* Submission Receipt Modal */}
      {selectedPlanForReceipt && (
        <SubmissionReceiptModal
          plan={selectedPlanForReceipt}
          teacher={teachers.find((t) => t.Teacher_ID === selectedPlanForReceipt.teacher_id)}
          isOpen={!!selectedPlanForReceipt}
          onClose={() => setSelectedPlanForReceipt(null)}
        />
      )}

      {/* Teacher Directory Modal */}
      {currentTeacher && (
        <TeacherDirectoryModal
          teachers={teachers}
          currentTeacher={currentTeacher}
          isOpen={isDirectoryModalOpen}
          onClose={() => setIsDirectoryModalOpen(false)}
          onSwitchUser={handleSetCurrentUser}
          onEditTeacher={(t) => {
            setTeacherToEdit(t);
            setIsProfileModalOpen(true);
          }}
        />
      )}

      {/* Supabase Config & SQL Migration Modal */}
      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onConfigSaved={() => loadData()}
      />

      {/* File Storage Hub Info Modal */}
      <FileStorageInfoModal
        plans={plans}
        isOpen={isFileStorageModalOpen}
        onClose={() => setIsFileStorageModalOpen(false)}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
      />

      {/* Admin Tracker Matrix Modal */}
      <AdminTrackerModal
        teachers={teachers}
        plans={plans}
        isOpen={isAdminTrackerModalOpen}
        onClose={() => setIsAdminTrackerModalOpen(false)}
        onEditTeacher={(t) => {
          setTeacherToEdit(t);
          setIsProfileModalOpen(true);
        }}
        onEditPlan={(p) => setPlanToEdit(p)}
        onDeletePlan={(id) => handleDeletePlan(id)}
        onOpenDeadlineManager={() => setIsDeadlineModalOpen(true)}
      />

      {/* Deadline & Status Manager Modal (Admin) */}
      <DeadlineManagerModal
        isOpen={isDeadlineModalOpen}
        onClose={() => setIsDeadlineModalOpen(false)}
        deadlineConfigs={deadlineConfigs}
        onSaveDeadlineConfigs={handleSaveDeadlineConfigs}
        statusConfigs={statusConfigs}
        onSaveStatusConfigs={handleSaveStatusConfigs}
        plans={plans}
        onUpdatePlanStatus={handleQuickChangePlanStatus}
        isSupabaseConnected={isSupabaseConnected}
        onOpenSupabaseConfig={() => setIsSupabaseModalOpen(true)}
      />

      {/* Edit Plan Modal (Teacher owner or Admin) */}
      {planToEdit && (
        <EditPlanModal
          plan={planToEdit}
          isOpen={!!planToEdit}
          isAdmin={isAdmin}
          statusConfigs={statusConfigs}
          deadlineConfigs={deadlineConfigs}
          onClose={() => setPlanToEdit(null)}
          onSave={async (updatedPlan) => {
            const res = await savePlanRecord(updatedPlan);
            setPlans((prev) =>
              prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p))
            );
            await syncWithDatabase(true);

            setToastNotice({
              type: 'success',
              message: 'บันทึกการแก้ไขแผนเรียบร้อยแล้ว',
              details: res.isSupabase
                ? 'ระบบได้อัปเดตข้อมูลลงฐานข้อมูล Supabase SQL (ตาราง lesson_plans) อัตโนมัติแล้ว'
                : 'บันทึกในเครื่องเรียบร้อยแล้ว (ยังไม่ได้เชื่อมต่อ Supabase SQL)',
            });
          }}
        />
      )}

      {/* Confirm Delete Modal (safe in iframe, no window.confirm) */}
      <ConfirmDeleteModal
        isOpen={!!planToDelete}
        plan={planToDelete}
        onClose={() => setPlanToDelete(null)}
        onConfirm={async (id) => {
          await executeDeletePlan(id);
        }}
      />

      {/* Resubmit Plan Modal */}
      <ResubmitPlanModal
        isOpen={!!planToResubmit}
        plan={planToResubmit}
        onClose={() => setPlanToResubmit(null)}
        onResubmit={handleResubmitPlan}
      />

      {/* Login Modal */}
      <LoginModal
        teachers={teachers}
        isOpen={isLoginModalOpen}
        onLogin={handleSetCurrentUser}
      />

      {/* Vercel Web Analytics */}
      <Analytics />
    </div>
  );
}
