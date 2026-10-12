import React, { useState } from 'react';
import {
  X,
  Database,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  Server,
  Key,
  ShieldCheck,
  AlertCircle,
  Upload,
} from 'lucide-react';
import {
  getSavedSupabaseConfig,
  saveSupabaseConfig,
  generateSupabaseSqlScript,
  seedTeachersToSupabase,
  seedPlansToSupabase,
  seedDocumentTypesToSupabase,
  SYSTEM_SETTINGS_TABLE_SQL,
  getSupabaseClient,
} from '../services/supabaseClient';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const currentConfig = getSavedSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [isCopied, setIsCopied] = useState(false);
  const [isCopiedSettingsSql, setIsCopiedSettingsSql] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');
  const [isSyncingPlans, setIsSyncingPlans] = useState(false);
  const [syncPlansMessage, setSyncPlansMessage] = useState('');
  const [isSyncingDocTypes, setIsSyncingDocTypes] = useState(false);
  const [syncDocTypesMessage, setSyncDocTypesMessage] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    saveSupabaseConfig({ url: url.trim(), anonKey: anonKey.trim() });
    onConfigSaved();
    setTestMessage('บันทึกการตั้งค่าแล้ว');
    setTimeout(() => onClose(), 800);
  };

  const handleCopySql = () => {
    const sql = generateSupabaseSqlScript();
    navigator.clipboard.writeText(sql);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopySettingsTableSql = () => {
    navigator.clipboard.writeText(SYSTEM_SETTINGS_TABLE_SQL);
    setIsCopiedSettingsSql(true);
    setTimeout(() => setIsCopiedSettingsSql(false), 2000);
  };

  const handleSyncDocTypes = async () => {
    setIsSyncingDocTypes(true);
    setSyncDocTypesMessage('');
    saveSupabaseConfig({ url: url.trim(), anonKey: anonKey.trim() });
    const res = await seedDocumentTypesToSupabase();
    if (res.success) {
      setSyncDocTypesMessage('ซิงค์ข้อมูลประเภทเอกสารและวันส่งงานขึ้น Supabase สำเร็จเรียบร้อย! คอมพิวเตอร์เครื่องอื่นจะมองเห็นทันที');
      onConfigSaved();
    } else {
      setSyncDocTypesMessage(`เกิดข้อผิดพลาด: ${res.error || 'ตาราง system_settings ยังไม่ถูกสร้าง (โปรดรัน SQL ด้านล่างก่อน)'}`);
    }
    setIsSyncingDocTypes(false);
  };

  const handleTestConnection = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestStatus('error');
      setTestMessage('กรุณากรอกทั้ง Supabase URL และ Anon Key ก่อนทดสอบ');
      return;
    }

    setTestStatus('testing');
    setTestMessage('กำลังทดสอบการเชื่อมต่อไปยัง Supabase...');

    try {
      saveSupabaseConfig({ url: url.trim(), anonKey: anonKey.trim() });
      const client = getSupabaseClient();
      if (!client) {
        throw new Error('ไม่สามารถสร้าง Supabase Client ได้');
      }

      // Test query
      const { data, error } = await client.from('teachers').select('count', { count: 'exact', head: true });
      if (error) {
        if (error.code === 'PGRST125' || error.message.includes('Invalid path specified in request URL')) {
          setTestStatus('error');
          setTestMessage('Supabase URL ไม่ถูกต้อง (Code: PGRST125): โปรดตรวจสอบว่าไม่ได้ใส่ /rest/v1 ต่อท้าย หรือใส่ลิงก์หน้าแดชบอร์ด ให้ใช้ Project URL เช่น https://xxxx.supabase.co');
        } else if (error.code === '42P01' || error.message.includes('relation "teachers" does not exist')) {
          setTestStatus('success');
          setTestMessage('เชื่อมต่อ Supabase สำเร็จ! (แต่ยังไม่ได้สร้างตาราง กรุณาคัดลอก SQL ไปรันใน SQL Editor ด้านล่าง)');
        } else {
          setTestStatus('error');
          setTestMessage(`ข้อผิดพลาดจาก Supabase: ${error.message}`);
        }
      } else {
        setTestStatus('success');
        setTestMessage('เชื่อมต่อกับตาราง teachers บน Supabase สำเร็จสมบูรณ์!');
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(`เชื่อมต่อไม่สำเร็จ: ${err?.message || 'โปรดตรวจสอบ URL และ Key'}`);
    }
  };

  const handleSeedToSupabase = async () => {
    setIsSeeding(true);
    setSeedMessage('');

    saveSupabaseConfig({ url: url.trim(), anonKey: anonKey.trim() });
    const res = await seedTeachersToSupabase();
    if (res.success) {
      setSeedMessage(`ซิงค์ข้อมูลบุคลากร ${res.count} ท่านขึ้น Supabase สำเร็จเรียบร้อย!`);
    } else {
      setSeedMessage(`เกิดข้อผิดพลาด: ${res.error}`);
    }
    setIsSeeding(false);
  };

  const handleSyncPlansToSupabase = async () => {
    setIsSyncingPlans(true);
    setSyncPlansMessage('');

    saveSupabaseConfig({ url: url.trim(), anonKey: anonKey.trim() });
    const res = await seedPlansToSupabase();
    if (res.success) {
      setSyncPlansMessage(`ซิงค์แผนการสอน ${res.count} รายการขึ้น Supabase SQL สำเร็จสมบูรณ์!`);
      onConfigSaved();
    } else {
      setSyncPlansMessage(`เกิดข้อผิดพลาด: ${res.error}`);
    }
    setIsSyncingPlans(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/25">
              <Database className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-emerald-100">
                Database Integration
              </span>
              <h2 className="text-xl font-bold">การเชื่อมต่อฐานข้อมูล Supabase</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {/* Status info */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block text-emerald-800 mb-1">
                ระบบรองรับทั้งฐานข้อมูล Supabase บน Cloud และ Local Fallback
              </strong>
              ท่านสามารถใส่ค่า <strong>Project URL</strong> และ <strong>Anon Key</strong> จากแดชบอร์ด Supabase ของท่าน เพื่อเชื่อมต่อตาราง <strong>teachers</strong> และ <strong>lesson_plans</strong> ได้โดยตรง
            </div>
          </div>

          {/* Form Credentials */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1.5">
                <Server className="w-4 h-4 text-emerald-600" />
                Supabase Project URL
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xyzcompany.supabase.co"
                className="w-full px-3.5 py-2.5 font-mono text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
              <p className="mt-1 text-[11px] text-slate-400">
                ตัวอย่าง: <span className="font-mono text-slate-600">https://xyzcompany.supabase.co</span> (ห้ามใส่ <code className="text-rose-500">/rest/v1</code> หรือลิงก์หน้าแดชบอร์ด)
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-emerald-600" />
                Supabase Anon (Public) Key
              </label>
              <input
                type="password"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3.5 py-2.5 font-mono text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            {testMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  testStatus === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : testStatus === 'error'
                    ? 'bg-rose-50 text-rose-800 border border-rose-200'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {testStatus === 'testing' && (
                  <RefreshCw className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
                )}
                {testStatus === 'success' && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                {testStatus === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />}
                <span>{testMessage}</span>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                ทดสอบการเชื่อมต่อ
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                บันทึกการตั้งค่า
              </button>
            </div>
          </div>

          {/* Section: SQL Migration Script */}
          <div className="border-t border-slate-200/80 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  SQL Schema & Seed สำหรับสร้างตารางบน Supabase
                </h3>
                <p className="text-xs text-slate-500">
                  รวมโค้ดสร้างตาราง teachers (คีย์หลัก Teacher_ID) และตาราง lesson_plans พร้อมข้อมูลครู 27 คน
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopySql}
                className="shrink-0 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-indigo-200"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    คัดลอกเรียบร้อย!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    คัดลอก SQL ทั้งหมด
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 font-mono text-xs overflow-x-auto max-h-48 border border-slate-800 select-all">
              <pre>{generateSupabaseSqlScript()}</pre>
            </div>

            {/* Seed directly button */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-600">
                  1. ส่งข้อมูลบุคลากร 27 ท่าน + แอดมิน (admin01, admin02) เข้า Supabase:
                </span>
                <button
                  type="button"
                  onClick={handleSeedToSupabase}
                  disabled={isSeeding || !url || !anonKey}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
                >
                  {isSeeding ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  อัปโหลดครู 27 คนขึ้น Supabase
                </button>
              </div>

              {seedMessage && (
                <div className="text-xs text-emerald-700 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                  {seedMessage}
                </div>
              )}

              <div className="flex items-center justify-between bg-indigo-50/70 p-3 rounded-xl border border-indigo-200 text-xs">
                <span className="text-indigo-900 font-medium">
                  2. ซิงค์แผนการสอนทั้งหมดเข้าสู่ตาราง lesson_plans บน Supabase SQL:
                </span>
                <button
                  type="button"
                  onClick={handleSyncPlansToSupabase}
                  disabled={isSyncingPlans || !url || !anonKey}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 shrink-0"
                >
                  {isSyncingPlans ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  ซิงค์แผนการสอนขึ้น Supabase SQL
                </button>
              </div>

              {syncPlansMessage && (
                <div
                  className={`text-xs p-2.5 rounded-lg border ${
                    syncPlansMessage.includes('สำเร็จ')
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : 'text-rose-700 bg-rose-50 border-rose-200'
                  }`}
                >
                  {syncPlansMessage}
                </div>
              )}

              {/* 3. Sync Document Types & Deadlines */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-amber-50/80 p-3 rounded-xl border border-amber-200 text-xs gap-2">
                <div>
                  <span className="text-amber-950 font-bold block">
                    3. ซิงค์ประเภทเอกสารและกำหนดเวลาส่ง (แผนฉบับย่อ / แผนฉบับสมบูรณ์ / ประเภทใหม่):
                  </span>
                  <span className="text-amber-800 text-[11px]">
                    บันทึกลงตาราง system_settings เพื่อให้อุปกรณ์และคอมพิวเตอร์เครื่องอื่นมองเห็นตรงกัน
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopySettingsTableSql}
                    className="px-2.5 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-medium flex items-center gap-1 transition-colors"
                    title="คัดลอกเฉพาะโค้ด SQL สร้างตาราง system_settings (สำหรับผู้ที่มีฐานข้อมูลเดิมอยู่แล้ว)"
                  >
                    {isCopiedSettingsSql ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>คัดลอกแล้ว!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>คัดลอก SQL ตารางระบบ</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncDocTypes}
                    disabled={isSyncingDocTypes || !url || !anonKey}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    {isSyncingDocTypes ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    ซิงค์ประเภทเอกสารขึ้น Cloud
                  </button>
                </div>
              </div>

              {syncDocTypesMessage && (
                <div
                  className={`text-xs p-2.5 rounded-lg border ${
                    syncDocTypesMessage.includes('สำเร็จ')
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : 'text-rose-700 bg-rose-50 border-rose-200'
                  }`}
                >
                  {syncDocTypesMessage}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
