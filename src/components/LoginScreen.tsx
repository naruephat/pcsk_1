import React, { useState } from 'react';
import { Teacher } from '../types';
import { INITIAL_TEACHERS } from '../data/initialTeachers';
import { updateTeacherRecord } from '../services/supabaseClient';
import { formatGoogleDriveImageUrl, getInitials } from '../utils/imageUtils';
import {
  Lock,
  Mail,
  LogIn,
  Search,
  Info,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface LoginScreenProps {
  teachers: Teacher[];
  isSupabaseConnected: boolean;
  onLogin: (teacher: Teacher) => void;
  onOpenSupabaseModal?: () => void;
  onShowLoadingDemo?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  teachers,
  isSupabaseConnected,
  onLogin,
  onOpenSupabaseModal,
  onShowLoadingDemo,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'form' | 'quickSelect'>('form');
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedArea, setSelectedArea] = useState('ทั้งหมด');

  // Merge passed teachers with INITIAL_TEACHERS so admins like admin02 are always guaranteed
  const allAvailableTeachers: Teacher[] = React.useMemo(() => {
    const map = new Map<string, Teacher>();
    INITIAL_TEACHERS.forEach((t) => map.set(t.Teacher_ID.toLowerCase(), t));
    teachers.forEach((t) => map.set(t.Teacher_ID.toLowerCase(), t));
    return Array.from(map.values());
  }, [teachers]);

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedInput = email.trim().toLowerCase();
    const found = allAvailableTeachers.find(
      (t) =>
        t.Email.toLowerCase() === trimmedInput ||
        t.Teacher_ID.toLowerCase() === trimmedInput ||
        t.national_id === trimmedInput
    );

    if (!found) {
      setError('ไม่พบบัญชีผู้ใช้นี้ในระบบ กรุณาตรวจสอบอีเมลหรือรหัสครู (Teacher_ID)');
      return;
    }

    if (found.Pass !== password.trim()) {
      setError('รหัสผ่านไม่ถูกต้อง');
      return;
    }

    // Ensure teacher record is saved in storage
    updateTeacherRecord(found);
    onLogin(found);
  };

  const areas = [
    'ทั้งหมด',
    'วิทยาศาสตร์และเทคโนโลยี',
    'คณิตศาสตร์',
    'ภาษาต่างประเทศ',
    'ภาษาไทย',
    'สังคมศึกษา ศาสนา และวัฒนธรรม',
    'ศิลปะ',
    'สุขศึกษาและพลศึกษา',
    'กลุ่มบริหารวิชาการ',
  ];

  const filteredTeachers = allAvailableTeachers.filter((t) => {
    const matchArea = selectedArea === 'ทั้งหมด' || t.Learning_Area === selectedArea;
    const matchQuery =
      t.Name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.Email.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.Teacher_ID.toLowerCase().includes(searchFilter.toLowerCase()) ||
      t.Learning_Area.toLowerCase().includes(searchFilter.toLowerCase());
    return matchArea && matchQuery;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 flex flex-col justify-between relative overflow-hidden font-['Prompt',sans-serif]">
      {/* Background glowing orbs */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Bar */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/logo.svg"
            alt="ตราสัญลักษณ์โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย กาฬสินธุ์"
            className="w-10 h-14 sm:w-12 sm:h-16 object-contain drop-shadow-md"
          />
          <div>
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight">
              โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย กาฬสินธุ์
            </h1>
            <p className="text-[11px] sm:text-xs text-amber-200/90 font-medium">
              Princess Chulabhorn Science High School Kalasin
            </p>
          </div>
        </div>
      </header>

      {/* Main Login Card Container */}
      <main className="relative z-10 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 my-auto">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl shadow-black/40 border border-white/40 overflow-hidden flex flex-col md:flex-row">
          {/* Left Hero Column: School Emblem & Vision */}
          <div className="md:w-5/12 bg-gradient-to-b from-blue-900 via-indigo-900 to-slate-900 p-8 text-white flex flex-col items-center justify-between text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>

            <div className="relative z-10 my-auto py-4 flex flex-col items-center">
              {/* Official School Crest Logo */}
              <div className="relative mb-5 group">
                <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full blur-md opacity-30 group-hover:opacity-50 transition duration-500"></div>
                <div className="relative w-28 h-40 sm:w-32 sm:h-44 flex items-center justify-center p-2">
                  <img
                    src="/logo.svg"
                    alt="Logo PCSHS Kalasin"
                    className="w-full h-full object-contain filter drop-shadow-2xl transform transition hover:scale-105 duration-300"
                  />
                </div>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md text-amber-200 border border-amber-300/30 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                กลุ่มบริหารวิชาการ
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                ระบบส่งแผนการสอน
              </h2>
              <p className="text-xs text-indigo-200 mt-1 max-w-[240px]">
                Lesson Plan Submission System สำหรับครูและบุคลากรทางการศึกษา
              </p>
            </div>

            <div className="relative z-10 text-[11px] text-indigo-300/80 pt-2">
              โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย กาฬสินธุ์
            </div>
          </div>

          {/* Right Form Column */}
          <div className="md:w-7/12 p-6 sm:p-8 flex flex-col justify-between bg-white">
            <div>
              {/* Right Column Header */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <LogIn className="w-5 h-5 text-indigo-600" />
                  เข้าสู่ระบบ
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  กรอกอีเมล/Teacher_ID และรหัสผ่านเพื่อเข้าใช้งาน
                </p>
              </div>

              {/* Password notice badge */}
              <div className="space-y-2 mb-5">
                <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-amber-800">รหัสผ่านเริ่มต้นของครูคือ </span>
                    <strong className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-900 font-bold">12345</strong>
                    <span className="block text-[11px] text-amber-700 mt-0.5">
                      (ระบบจะบังคับให้เปลี่ยนเป็นรหัสผ่านใหม่ทันทีเมื่อเข้าสู่ระบบครั้งแรก)
                    </span>
                  </div>
                </div>
              </div>

              {/* Tab 1: Form Login */}
              {activeTab === 'form' ? (
                <form onSubmit={handleFormLogin} className="space-y-4">
                  {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center gap-2 animate-in fade-in">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      อีเมล หรือ Teacher_ID <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="เช่น thanyarat.su@pcshsksn.ac.th หรือ te001"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        รหัสผ่าน (Pass) <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">
                        ค่าเริ่มต้น: 12345
                      </span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="กรอกรหัสผ่าน"
                        className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 hover:from-blue-800 hover:to-indigo-900 text-white font-bold rounded-xl shadow-lg shadow-indigo-700/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] text-sm"
                    >
                      <LogIn className="w-4 h-4" />
                      เข้าสู่ระบบส่งแผนการสอน
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              ) : (
                /* Tab 2: Quick Demo Selector */
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="ค้นหาชื่อครู, อีเมล, รหัสครู..."
                      className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white"
                    />
                  </div>

                  {/* Learning Area filter pills */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
                    {areas.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setSelectedArea(a)}
                        className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-colors ${
                          selectedArea === a
                            ? 'bg-indigo-600 text-white font-semibold'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        {a}
                      </button>
                    ))}
                  </div>

                  {/* Teachers scroll list */}
                  <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                    {filteredTeachers.map((teacher) => {
                      const photoUrl = formatGoogleDriveImageUrl(teacher.photo);
                      const isDefaultPass = teacher.Pass === '12345';
                      const isReviewer =
                        teacher.role === 'academic_director' ||
                        teacher.position.includes('รองผู้');

                      return (
                        <div
                          key={teacher.Teacher_ID}
                          onClick={() => onLogin(teacher)}
                          className="pt-2 first:pt-0 group flex items-center justify-between p-2.5 hover:bg-indigo-50/70 rounded-xl cursor-pointer transition-all border border-transparent hover:border-indigo-100"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
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
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-indigo-600 truncate">
                                  {teacher.Name}
                                </h4>
                                <span className="text-[10px] font-mono px-1 py-0.2 bg-slate-100 text-slate-600 rounded">
                                  {teacher.Teacher_ID}
                                </span>
                                {isReviewer && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-purple-100 text-purple-700">
                                    ผู้บริหาร/ตรวจแผน
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-indigo-600 font-medium truncate">
                                {teacher.Learning_Area}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {isDefaultPass ? (
                              <span className="hidden sm:inline-flex text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                                รหัส 12345
                              </span>
                            ) : (
                              <span className="hidden sm:inline-flex text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                เปลี่ยนรหัสแล้ว
                              </span>
                            )}
                            <button
                              type="button"
                              className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-medium group-hover:bg-indigo-700 shadow-xs"
                            >
                              เลือก
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer inside card */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="truncate">ระบบบริหารงานวิชาการ • PCSHS KSN</span>
              <span className="text-slate-400 text-[11px]">เชื่อมต่อระบบอัตโนมัติ</span>
            </div>
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="relative z-10 py-4 px-4 text-center text-xs text-indigo-200/70 flex flex-col sm:flex-row items-center justify-center gap-3">
        <p>
          © 2026 กลุ่มบริหารวิชาการ โรงเรียนวิทยาศาสตร์จุฬาภรณราชวิทยาลัย กาฬสินธุ์
        </p>
      </footer>
    </div>
  );
};
