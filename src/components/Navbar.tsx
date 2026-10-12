import React from 'react';
import { Teacher, isTeacherAdmin } from '../types';
import { formatGoogleDriveImageUrl, getInitials } from '../utils/imageUtils';
import {
  School,
  Upload,
  User,
  Users,
  LogOut,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ClipboardList,
  RefreshCw,
  Calendar,
  BarChart3,
} from 'lucide-react';

interface NavbarProps {
  currentTeacher: Teacher | null;
  isSupabaseConnected?: boolean;
  onOpenSubmitModal: () => void;
  onOpenProfileModal: () => void;
  onOpenDirectoryModal: () => void;
  onOpenSupabaseModal?: () => void;
  onOpenFileStorageModal?: () => void;
  onOpenAdminTrackerModal: () => void;
  onOpenDeadlineManager?: () => void;
  onOpenExecutiveDashboard?: () => void;
  onLogout: () => void;
  lastSyncTime?: string;
  isSyncing?: boolean;
  onManualSync?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTeacher,
  isSupabaseConnected,
  onOpenSubmitModal,
  onOpenProfileModal,
  onOpenDirectoryModal,
  onOpenSupabaseModal,
  onOpenFileStorageModal,
  onOpenAdminTrackerModal,
  onOpenDeadlineManager,
  onOpenExecutiveDashboard,
  onLogout,
  lastSyncTime,
  isSyncing = false,
  onManualSync,
}) => {
  const photoUrl = currentTeacher ? formatGoogleDriveImageUrl(currentTeacher.photo) : '';
  const isAdmin = isTeacherAdmin(currentTeacher);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & School title */}
          <div className="flex items-center gap-3.5">
            <img
              src="/logo.svg"
              alt="ตราสัญลักษณ์โรงเรียน"
              className="h-12 w-auto sm:h-14 object-contain drop-shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-tight">
                  ระบบส่งแผนการสอน
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  จ.ภ. กาฬสินธุ์
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-[200px] sm:max-w-md">
                โรงเรียนวิทยาศาสตร์จุภาพรณราชวิทยาลัย กาฬสินธุ์
              </p>
            </div>
          </div>

          {/* Right Navigation & Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {currentTeacher ? (
              <>
                {/* Executive Dashboard Button (for Admin & Leadership) */}
                {isAdmin && onOpenExecutiveDashboard && (
                  <button
                    onClick={onOpenExecutiveDashboard}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-indigo-700 shadow-sm hover:from-blue-700 hover:to-indigo-700 cursor-pointer"
                    title="แดชบอร์ดฝ่ายบริหาร สถิติความตรงต่อเวลา และกราฟวิเคราะห์รายกลุ่มสาระ/รายคน"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>แดชบอร์ดบริหาร</span>
                  </button>
                )}

                {/* Admin Deadline & Status Manager Button */}
                {isAdmin && onOpenDeadlineManager && (
                  <button
                    onClick={onOpenDeadlineManager}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-gradient-to-r from-amber-600 to-orange-600 text-white border-amber-700 shadow-sm hover:from-amber-700 hover:to-orange-700 cursor-pointer"
                    title="กำหนดช่วงเวลาส่งงานของแต่ละประเภทเอกสาร และปรับแต่งสถานะทั้งหมด"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>กำหนดส่ง & สถานะ</span>
                  </button>
                )}

                {/* Admin Tracker: only shown for admin */}
                {isAdmin && (
                  <button
                    onClick={onOpenAdminTrackerModal}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-600 shadow-sm hover:from-amber-600 hover:to-orange-600"
                    title="ติดตามดูว่าใครส่งแผนแล้วบ้างแยกตามกลุ่มสาระ"
                  >
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>ติดตามส่งแผน (Admin)</span>
                  </button>
                )}

                {/* Staff Directory Button: only shown for admin */}
                {isAdmin && (
                  <button
                    onClick={onOpenDirectoryModal}
                    className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-colors border border-slate-200"
                  >
                    <Users className="w-4 h-4 text-indigo-600" />
                    บุคลากร (27 ท่าน)
                  </button>
                )}

                {/* Primary Action: Submit Plan (Only for teachers, hidden for admin) */}
                {!isAdmin && (
                  <button
                    onClick={onOpenSubmitModal}
                    className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98]"
                  >
                    <Upload className="w-4 h-4" />
                    <span>ส่งเอกสาร</span>
                  </button>
                )}

                {/* Teacher Profile trigger */}
                <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-200">
                  <button
                    onClick={onOpenProfileModal}
                    className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left"
                    title="คลิกเพื่อแก้ไขข้อมูลส่วนตัว"
                  >
                    <div className="w-9 h-9 rounded-xl overflow-hidden bg-indigo-100 border border-slate-200 flex items-center justify-center shrink-0">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt={currentTeacher.Name}
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold text-indigo-700">
                          {getInitials(currentTeacher.Name)}
                        </span>
                      )}
                    </div>

                    <div className="hidden lg:block">
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        <span>{currentTeacher.Name}</span>
                        <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-200/60 px-1 rounded">
                          {currentTeacher.Teacher_ID}
                        </span>
                      </div>
                      <div className="text-[11px] text-indigo-600 font-medium truncate max-w-[130px]">
                        {currentTeacher.Learning_Area}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={onLogout}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="ออกจากระบบ"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};
