import React, { useEffect, useState } from "react";
import {
  Settings,
  Save,
  Shield,
  AlertTriangle,
  RefreshCw,
  Bell,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { rootService } from "../../services/rootService";
import { useToast } from "../../context/ToastContext";
import { Card } from "../../components/common/Card";
import { Button } from "../../components/common/Button";
import { Input } from "../../components/common/Input";
import { Spinner } from "../../components/common/Spinner";

export const RootSettingsPage: React.FC = () => {
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings State
  const [allowRegistration, setAllowRegistration] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [testPassingScore, setTestPassingScore] = useState(70);
  const [systemAnnouncement, setSystemAnnouncement] = useState("");
  const [directorCanCreateAdmins, setDirectorCanCreateAdmins] = useState(true);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await rootService.getGlobalSettings();
      if (data) {
        if (data.allowRegistration !== undefined) setAllowRegistration(data.allowRegistration);
        if (data.maintenanceMode !== undefined) setMaintenanceMode(data.maintenanceMode);
        if (data.testPassingScore !== undefined) setTestPassingScore(data.testPassingScore);
        if (data.systemAnnouncement !== undefined) setSystemAnnouncement(data.systemAnnouncement);
        if (data.directorCanCreateAdmins !== undefined) setDirectorCanCreateAdmins(data.directorCanCreateAdmins);
      }
    } catch (err: any) {
      toastError(err.message || "Sozlamalarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await rootService.updateGlobalSettings({
        allowRegistration,
        maintenanceMode,
        testPassingScore: Number(testPassingScore),
        systemAnnouncement,
        directorCanCreateAdmins,
      });
      success("Global tizim sozlamalari muvaffaqiyatli saqlandi!");
    } catch (err: any) {
      toastError(err.message || "Sozlamalarni saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-28">
        <Spinner size="lg" className="text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Settings className="w-6 h-6 text-purple-400" />
          Global Tizim Sozlamalari
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Barcha o'quv markazlari, direktorlar va foydalanuvchilar ustidan global konfiguratsiya
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Core Toggles */}
        <Card className="bg-[#0B0F1F]/90 border-slate-800 p-6 rounded-2xl space-y-5">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            Tizimga Kirish va Registratsiya Siyosati
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <div className="font-bold text-sm text-white">Yangi foydalanuvchilar registratsiyasi</div>
                <div className="text-xs text-slate-400">
                  O'quvchilar va tashrif buyuruvchilar mustaqil ro'yxatdan o'ta oladimi?
                </div>
              </div>
              <input
                type="checkbox"
                checked={allowRegistration}
                onChange={(e) => setAllowRegistration(e.target.checked)}
                className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <div className="font-bold text-sm text-white flex items-center gap-2">
                  <span>Texnik Xizmat Ko'rsatish Rejimi (Maintenance Mode)</span>
                  {maintenanceMode && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      FAOL
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400">
                  Yoqilsa, oddiy foydalanuvchilar uchun tizim vaqtincha yopiladi (Root kirishi saqlanadi)
                </div>
              </div>
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div>
                <div className="font-bold text-sm text-white">Direktorlarga Admin tayinlash ruxsati</div>
                <div className="text-xs text-slate-400">
                  Direktorlar o'z markazlariga administratorlarni tayinlay oladimi?
                </div>
              </div>
              <input
                type="checkbox"
                checked={directorCanCreateAdmins}
                onChange={(e) => setDirectorCanCreateAdmins(e.target.checked)}
                className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </Card>

        {/* Global Announcement */}
        <Card className="bg-[#0B0F1F]/90 border-slate-800 p-6 rounded-2xl space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            Umumiy Tizim E'loni (Banner)
          </h2>
          <p className="text-xs text-slate-400">
            Barcha foydalanuvchilar (direktorlar, ustozlar, o'quvchilar) ekranlarida ko'rinadigan rasmiy e'lon
          </p>

          <Input
            placeholder="Masalan: 1-noyabrdan barcha guruhlarda oraliq attestatsiya boshlanadi..."
            value={systemAnnouncement}
            onChange={(e) => setSystemAnnouncement(e.target.value)}
          />
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="primary"
            isLoading={saving}
            leftIcon={<Save className="w-4 h-4" />}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold border-none"
          >
            Sozlamalarni Saqlash
          </Button>
        </div>
      </form>
    </div>
  );
};
