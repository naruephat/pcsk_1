import React, { useState } from 'react';
import { Teacher } from '../types';
import { INITIAL_TEACHERS } from '../data/initialTeachers';
import { updateTeacherRecord } from '../services/supabaseClient';
import { formatGoogleDriveImageUrl, getInitials } from '../utils/imageUtils';
import {
  Lock,
  Mail,
  LogIn,
  School,
  Sparkles,
  Users,
  Search,
  CheckCircle2,
  ShieldCheck,
  Info,
} from 'lucide-react';

interface LoginModalProps {
  teachers: Teacher[];
  isOpen: boolean;
  onLogin: (teacher: Teacher) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  teachers,
  isOpen,
  onLogin,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'form' | 'quickSelect'>('quickSelect');

  if (!isOpen) return null;

  const allAvailableTeachers: Teacher[] = React.useMemo(() => {
    const map = new Map<string, Teacher>();
    INITIAL_TEACHERS.forEach((t) => map.set(t.Teacher_ID.toLowerCase(), t));
    teachers.forEach((t) => map.set(t.Teacher_ID.toLowerCase(), t));
    return Array.from(map.values());
  }, [teachers]);

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    const found = allAvailableTeachers.find(
      (t) =>
        t.Email.toLowerCase() === trimmedEmail ||
        t.Teacher_ID.toLowerCase() === trimmedEmail ||
        t.national_id === trimmedEmail
    );

    if (!found) {
      setError('ไม่พบบัญชีผู้ใช้นี้ในระบบ กรุณาตรวจสอบอีเมลหรือรหัสครู');
      return;
    }

    if (found.Pass !== password.trim()) {
      setError('รหัสผ่านไม่ถูกต้อง');
      return;
    }

    updateTeacherRecord(found);
    onLogin(found);
  };

  const handleQuickSelect = (teacher: Teacher) => {
    onLogin(teacher);
  };

  const filteredTeachers = allAvailableTeachers.filter(
    (t) =>
      t.Name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.Email.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.Learning_Area.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.Teacher_ID.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Banner */}
        <div className="relative bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 p-6 sm:p-8 text-white">
          <div className="flex items-center gap-4">
            <img
              src="/logo.svg"
              alt="ตราสัญลักษณ์โรงเรียน"
              className="w-12 h-16 sm:w-14 sm:h-20 object-contain drop-shadow-md"
            />
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md text-amber-200 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย กาฬสินธุ์
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                สลับผู้ใช้งาน / เข้าสู่ระบบ
              </h1>
              <p className="text-indigo-100 text-xs sm:text-sm mt-0.5">
                ฐานข้อมูลบุคลากรครูและผู้บริหารสถานศึกษา (27 ท่าน)
              </p>
            </div>
          </div>

          {/* Tab buttons */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => setActiveTab('quickSelect')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'quickSelect'
                  ? 'bg-white text-indigo-900 shadow-md font-semibold'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              <Users className="w-4 h-4" />
              เลือกบัญชีบุคลากร ({teachers.length} ท่าน)
            </button>
            <button
              onClick={() => setActiveTab('form')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === 'form'
                  ? 'bg-white text-indigo-900 shadow-md font-semibold'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              <LogIn className="w-4 h-4" />
              กรอกอีเมลและรหัสผ่าน
            </button>
          </div>
        </div>

        {/* Notice Info */}
        <div className="bg-indigo-50/70 border-b border-indigo-100/60 px-6 py-2.5 flex items-center gap-2 text-xs text-indigo-900">
          <Info className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            รหัสผ่านเริ่มต้นสำหรับทุกท่านคือ <strong className="font-mono bg-indigo-100 px-1 py-0.5 rounded text-indigo-800">12345</strong> หากยังไม่เคยเปลี่ยน ระบบจะบังคับให้เปลี่ยนรหัสทันที
          </span>
        </div>

        {/* Tab 1: Quick Select */}
        {activeTab === 'quickSelect' ? (
          <div className="p-6">
            <div className="relative mb-4">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="ค้นหาชื่อครู, อีเมล, รหัสครู, หรือกลุ่มสาระฯ..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white"
              />
            </div>

            <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
              {filteredTeachers.map((teacher) => {
                const photoUrl = formatGoogleDriveImageUrl(teacher.photo);
                const isDefaultPass = teacher.Pass === '12345';
                const isReviewer = teacher.role === 'academic_director' || teacher.position.includes('รองผู้');

                return (
                  <div
                    key={teacher.Teacher_ID}
                    onClick={() => handleQuickSelect(teacher)}
                    className="pt-2 first:pt-0 group flex items-center justify-between p-2.5 hover:bg-indigo-50/60 rounded-xl cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-xl overflow-hidden bg-gradient-to-tr from-slate-200 to-indigo-100 flex items-center justify-center shrink-0 border border-slate-200">
                        {photoUrl ? (
                          <img
                            src={photoUrl}
                            alt={teacher.Name}
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold text-indigo-700">
                            {getInitials(teacher.Name)}
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 truncate">
                            {teacher.Name}
                          </h4>
                          <span className="text-[11px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                            {teacher.Teacher_ID}
                          </span>
                          {isReviewer && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 shrink-0">
                              ฝ่ายวิชาการ/ตรวจแผน
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span className="truncate">{teacher.Email}</span>
                          <span>•</span>
                          <span className="text-indigo-600 font-medium truncate">
                            {teacher.Learning_Area}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      {isDefaultPass ? (
                        <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          ยังไม่เปลี่ยนรหัส
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          เปลี่ยนรหัสแล้ว
                        </span>
                      )}
                      <button className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium group-hover:bg-indigo-700 transition-colors shadow-sm">
                        เข้าใช้งาน
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Tab 2: Custom Credentials */
          <form onSubmit={handleFormLogin} className="p-6 space-y-4">
            {/* Quick Admin fill banner */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/80 rounded-xl p-2.5 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-purple-900 font-medium">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>บัญชีแอดมิน:</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin01');
                    setPassword('admin01');
                  }}
                  className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-semibold transition-colors"
                >
                  admin01
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin02');
                    setPassword('admin02');
                  }}
                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-semibold transition-colors"
                >
                  admin02
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin03');
                    setPassword('admin03');
                  }}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition-colors"
                  title="ฝ่ายบริหาร (Executive Director)"
                >
                  admin03 (บริหาร)
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                E-mail หรือ Teacher_ID <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="เช่น thanyarat.su@pcshsksn.ac.th หรือ te001"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                รหัสผ่าน (Pass) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="รหัสผ่าน (เริ่มต้น 12345)"
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
              >
                <LogIn className="w-4 h-4" />
                เข้าสู่ระบบ
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
