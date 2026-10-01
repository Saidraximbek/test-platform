import React, { useState } from "react";
import { Printer, CheckCircle2, Key, Info, FileText } from "lucide-react";
import { AdmissionRecord } from "../../types";
import { Button } from "../common/Button";
import { formatDate } from "../../utils";
import { FargoniyLogo } from "../common/FargoniyLogo";

interface AdmissionPrintCardProps {
  admission: AdmissionRecord;
  onClose?: () => void;
}

function escapeHtml(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const AdmissionPrintCard: React.FC<AdmissionPrintCardProps> = ({ admission, onClose }) => {
  const [format, setFormat] = useState<"thermal" | "a4">("thermal");
  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://fargoniy.uz";

  const handlePrintThermal = () => {
    const fullName = escapeHtml(admission.fullName || "O'quvchi");
    const phoneNumber = escapeHtml(admission.phoneNumber || "-");
    const parentPhone = escapeHtml(admission.parentPhone || "");
    const subject = escapeHtml(admission.interestedSubject || "Umumiy ta'lim");
    const groupName = escapeHtml(admission.assignedGroupName || "");
    const login = escapeHtml(admission.login || "login");
    const password = escapeHtml(admission.plainPassword || "******");
    const admissionNumber = escapeHtml(admission.id.slice(-6).toUpperCase());
    const dateStr = formatDate(admission.createdAt);

    const printHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Talaba-Chek</title>
  <style>
    @page {
      size: 58mm auto;
      margin: 0mm !important;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      width: 58mm !important;
      max-width: 58mm !important;
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      color: #000000 !important;
      font-family: 'Courier New', Courier, monospace, monospace;
      overflow: hidden;
    }
    .receipt {
      width: 58mm;
      max-width: 58mm;
      padding: 2mm 2.5mm 3mm 2.5mm;
      margin: 0;
      box-sizing: border-box;
      background: #ffffff;
      color: #000000;
      page-break-after: avoid;
      break-after: avoid;
    }
    .center {
      text-align: center;
    }
    .title {
      font-size: 16px;
      font-weight: 900;
      letter-spacing: 0.3px;
      text-transform: uppercase;
      line-height: 1.15;
    }
    .subtitle {
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      margin-top: 2px;
      letter-spacing: 0.5px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 10.5px;
      font-weight: 700;
      margin-top: 3px;
      line-height: 1.2;
    }
    .divider {
      border-top: 1.5px dashed #000000;
      margin: 3.5px 0;
    }
    .info-list {
      font-size: 12px;
      line-height: 1.35;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 4px;
      padding: 1.5px 0;
    }
    .info-label {
      font-weight: 700;
      color: #000000;
      white-space: nowrap;
      font-size: 11.5px;
      flex-shrink: 0;
    }
    .info-value {
      font-weight: 900;
      color: #000000;
      text-align: right;
      font-size: 12px;
      word-break: break-word;
    }
    .creds-box {
      border: 1.5px solid #000000;
      padding: 3.5px;
      margin: 3.5px 0;
      text-align: center;
    }
    .creds-header {
      font-size: 10.5px;
      font-weight: 900;
      text-transform: uppercase;
      border-bottom: 1px dashed #000000;
      padding-bottom: 2px;
      margin-bottom: 3px;
      letter-spacing: 0.3px;
    }
    .cred-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5px 0;
    }
    .cred-label {
      font-weight: 700;
      font-size: 11.5px;
    }
    .cred-value {
      font-weight: 900;
      font-size: 13.5px;
      letter-spacing: 0.5px;
    }
    .footer {
      text-align: center;
      margin-top: 3px;
      font-size: 10.5px;
      line-height: 1.25;
    }
    .footer-bold {
      font-weight: 800;
    }
    .footer-sub {
      font-size: 9px;
      font-weight: 600;
      margin-top: 1px;
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="center">
      <div class="title">FARG'ONIY MAKTABI</div>
      <div class="subtitle">O'QUVCHI KABINETI</div>
      <div class="meta-row">
        <span>QABUL: #${admissionNumber}</span>
        <span>${dateStr}</span>
      </div>
    </div>

    <div class="divider"></div>

    <div class="info-list">
      <div class="info-row">
        <span class="info-label">O'quvchi:</span>
        <span class="info-value">${fullName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Telefon:</span>
        <span class="info-value">${phoneNumber}</span>
      </div>
      ${parentPhone ? `
      <div class="info-row">
        <span class="info-label">Ota-ona:</span>
        <span class="info-value">${parentPhone}</span>
      </div>` : ""}
      <div class="info-row">
        <span class="info-label">Fan:</span>
        <span class="info-value">${subject}</span>
      </div>
      ${groupName ? `
      <div class="info-row">
        <span class="info-label">Guruh:</span>
        <span class="info-value">${groupName}</span>
      </div>` : ""}
    </div>

    <div class="divider"></div>

    <div class="creds-box">
      <div class="creds-header">PLATFORMA MA'LUMOTLARI</div>
      <div class="cred-row">
        <span class="cred-label">Sayt:</span>
        <span class="cred-value" style="font-size: 11px;">fargoniy.uz</span>
      </div>
      <div class="cred-row">
        <span class="cred-label">Login:</span>
        <span class="cred-value">${login}</span>
      </div>
      <div class="cred-row">
        <span class="cred-label">Parol:</span>
        <span class="cred-value">${password}</span>
      </div>
    </div>

    <div class="divider"></div>

    <div class="footer">
      <div class="footer-bold">O'qishingizda omad tilaymiz!</div>
      <div class="footer-sub">fargoniy.uz orqali kiring</div>
    </div>
  </div>
</body>
</html>`;

    // Remove old iframe
    const oldIframe = document.getElementById("admission-print-frame");
    if (oldIframe) oldIframe.remove();

    const iframe = document.createElement("iframe");
    iframe.id = "admission-print-frame";
    iframe.style.position = "fixed";
    iframe.style.top = "0";
    iframe.style.left = "0";
    iframe.style.width = "58mm";
    iframe.style.height = "100px";
    iframe.style.border = "none";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    iframe.style.zIndex = "-9999";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(printHtml);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (err) {
          console.error("Print error:", err);
          window.print();
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 3000);
        }
      }, 200);
    } else {
      window.print();
    }
  };

  const handlePrintA4 = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Action Bar (Hidden in Print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700 print:hidden">
        {/* Format Selector: 58mm Thermal vs A4 */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-700 text-xs">
          <button
            type="button"
            onClick={() => setFormat("thermal")}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
              format === "thermal"
                ? "bg-brand-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            58mm Termal Chek
          </button>
          <button
            type="button"
            onClick={() => setFormat("a4")}
            className={`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${
              format === "a4"
                ? "bg-brand-600 text-white shadow"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            A4 Guvohnoma
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose}>
              Yopish
            </Button>
          )}
          <Button
            size="sm"
            onClick={format === "thermal" ? handlePrintThermal : handlePrintA4}
            className="bg-brand-600 hover:bg-brand-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-brand-600/30"
          >
            <Printer className="w-4 h-4" />
            {format === "thermal" ? "Chop etish (58mm)" : "A4 Chop etish"}
          </Button>
        </div>
      </div>

      {/* 58mm Thermal Format View */}
      {format === "thermal" && (
        <div className="space-y-3">
          {/* Info callout */}
          <div className="flex items-center justify-between px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold">Xprinter XP-58 (58mm login-parol cheki)</span>
            </div>
            <span className="text-[11px] bg-emerald-500/20 px-2.5 py-0.5 rounded font-mono font-bold">
              58mm
            </span>
          </div>

          {/* Receipt Preview */}
          <div className="flex justify-center p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <div
              id="printable-thermal-admission"
              className="w-[58mm] max-w-[58mm] bg-white text-black p-[2.5mm] rounded shadow-xl font-mono leading-tight select-none border border-slate-300"
              style={{
                width: "58mm",
                maxWidth: "58mm",
                boxSizing: "border-box",
              }}
            >
              {/* Header */}
              <div className="text-center pb-0.5">
                <div className="text-[16px] font-black uppercase tracking-tight text-black leading-tight">
                  FARG'ONIY MAKTABI
                </div>
                <div className="text-[12px] font-extrabold uppercase tracking-wider text-black mt-0.5">
                  O'QUVCHI KABINETI
                </div>
                <div className="flex justify-between items-center text-[10.5px] font-bold text-black mt-1 px-0.5">
                  <span>QABUL: #{admission.id.slice(-6).toUpperCase()}</span>
                  <span>{formatDate(admission.createdAt)}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-b-[1.5px] border-dashed border-black my-1.5" />

              {/* Body */}
              <div className="space-y-1 text-black text-[12px] leading-tight">
                <div className="flex justify-between items-baseline gap-1">
                  <span className="font-bold text-black shrink-0 text-[11.5px]">O'quvchi:</span>
                  <span className="font-black text-black text-right text-[12px] break-words">
                    {admission.fullName}
                  </span>
                </div>

                <div className="flex justify-between items-baseline gap-1">
                  <span className="font-bold text-black shrink-0 text-[11.5px]">Telefon:</span>
                  <span className="font-black text-black text-right text-[12px]">
                    {admission.phoneNumber}
                  </span>
                </div>

                {admission.parentPhone && (
                  <div className="flex justify-between items-baseline gap-1">
                    <span className="font-bold text-black shrink-0 text-[11.5px]">Ota-ona:</span>
                    <span className="font-black text-black text-right text-[12px]">
                      {admission.parentPhone}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-baseline gap-1">
                  <span className="font-bold text-black shrink-0 text-[11.5px]">Fan:</span>
                  <span className="font-black text-black text-right text-[12px] break-words">
                    {admission.interestedSubject || "Umumiy ta'lim"}
                  </span>
                </div>

                {admission.assignedGroupName && (
                  <div className="flex justify-between items-baseline gap-1">
                    <span className="font-bold text-black shrink-0 text-[11.5px]">Guruh:</span>
                    <span className="font-black text-black text-right text-[12px] break-words">
                      {admission.assignedGroupName}
                    </span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="border-b-[1.5px] border-dashed border-black my-1.5" />

              {/* Credentials Highlight Box */}
              <div className="border-[1.5px] border-black p-1.5 my-1 text-center">
                <div className="text-[10px] font-black uppercase border-b border-dashed border-black pb-1 mb-1 tracking-wide">
                  PLATFORMA MA'LUMOTLARI
                </div>
                <div className="flex justify-between items-center py-0.5 text-[11px]">
                  <span className="font-bold">Sayt:</span>
                  <span className="font-bold font-mono">fargoniy.uz</span>
                </div>
                <div className="flex justify-between items-center py-0.5 text-[11.5px]">
                  <span className="font-bold">Login:</span>
                  <span className="font-black font-mono text-[13px]">{admission.login || "-"}</span>
                </div>
                <div className="flex justify-between items-center py-0.5 text-[11.5px]">
                  <span className="font-bold">Parol:</span>
                  <span className="font-black font-mono text-[14px]">
                    {admission.plainPassword || "******"}
                  </span>
                </div>
              </div>

              {/* Divider */}
              <div className="border-b-[1.5px] border-dashed border-black my-1.5" />

              {/* Footer */}
              <div className="text-center pt-1 text-black leading-tight">
                <p className="font-extrabold text-[11px]">O'qishingizda omad tilaymiz!</p>
                <p className="text-[9px] font-bold text-black/80 mt-0.5">fargoniy.uz platformasiga kiring</p>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 p-2.5 bg-slate-800/60 rounded-lg text-slate-400 text-[11px] leading-relaxed border border-slate-700/50">
            <Info className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
            <span>
              Qog'oz toza va qisqa chiqishi uchun printer dialogida <strong>Headers and footers</strong> belgisi o'chiq bo'lishini tekshiring.
            </span>
          </div>
        </div>
      )}

      {/* A4 Format View (Optional alternative) */}
      {format === "a4" && (
        <div
          id="printable-admission-card"
          className="bg-white text-slate-900 rounded-2xl p-6 sm:p-8 border-2 border-slate-300 shadow-xl max-w-2xl mx-auto"
        >
          {/* Card Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-5">
            <div className="flex items-center gap-3">
              <FargoniyLogo size={46} subtitle="maktabi" theme="light" />
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded bg-slate-100 border border-slate-300 text-[11px] font-mono font-black text-slate-800">
                QABUL #{admission.id.slice(-6).toUpperCase()}
              </span>
              <p className="text-[10px] text-slate-500 mt-1 font-medium">
                Sana: {formatDate(admission.createdAt)}
              </p>
            </div>
          </div>

          {/* Student Details Grid */}
          <div className="grid grid-cols-2 gap-4 pb-4 mb-4 border-b border-dashed border-slate-300 text-xs">
            <div>
              <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                O'quvchi (F.I.Sh):
              </span>
              <span className="text-base font-extrabold text-slate-950 block mt-0.5">
                {admission.fullName}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                Telefon Raqami:
              </span>
              <span className="text-sm font-bold text-slate-900 block mt-0.5 font-mono">
                {admission.phoneNumber}
              </span>
            </div>

            {admission.parentPhone && (
              <div>
                <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                  Ota-ona Telefoni:
                </span>
                <span className="text-xs font-semibold text-slate-800 block mt-0.5 font-mono">
                  {admission.parentPhone}
                </span>
              </div>
            )}

            <div>
              <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                Fan / Yo'nalish:
              </span>
              <span className="text-xs font-bold text-slate-900 block mt-0.5">
                {admission.interestedSubject || "Umumiy ta'lim"}
              </span>
            </div>

            {admission.assignedGroupName && (
              <div>
                <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                  Biriktirilgan Guruh:
                </span>
                <span className="text-xs font-black text-brand-700 block mt-0.5">
                  {admission.assignedGroupName}
                </span>
              </div>
            )}

            <div>
              <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">
                Holati:
              </span>
              <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-black uppercase rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                {admission.status === "active" ? "AKTIV (Darsga kelgan)" : admission.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Credentials Box */}
          <div className="bg-slate-50 border-2 border-slate-900 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-600" />
                Tizimga Kirish Ma'lumotlari (Shaxsiy Kabinet)
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Maxfiy</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-slate-300">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Platforma Manzili:</span>
                <span className="text-xs font-bold text-blue-700 block mt-0.5 break-all font-mono">
                  {appUrl}
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-300">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Foydalanuvchi Logini:</span>
                <span className="text-sm font-black text-slate-950 block mt-0.5 font-mono select-all tracking-wide">
                  {admission.login || "Hali belgilanmagan"}
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-300 sm:col-span-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Parol (Birinchi kirish uchun):</span>
                  <span className="text-base font-black text-emerald-700 block mt-0.5 font-mono select-all tracking-wider">
                    {admission.plainPassword || "********"}
                  </span>
                </div>
                <div className="text-right text-[10px] text-slate-500 font-medium">
                  *Kirgandan so'ng parolni o'zgartirishingiz mumkin
                </div>
              </div>
            </div>
          </div>

          {/* Quick Instructions */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 mb-5 text-[11px] text-slate-700 leading-relaxed">
            <p className="font-bold text-slate-900 mb-1 flex items-center gap-1">
              📌 O'quvchi va ota-onalar uchun eslatma:
            </p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Telefon yoki kompyuter brauzerida platforma manzilini oching.</li>
              <li><strong>Login</strong> va <strong>Parol</strong> orqali tizimga kiring.</li>
              <li>Dars jadvali, mavzular, uyga vazifalar va test natijalari profilingizda ko'rsatiladi.</li>
            </ol>
          </div>

          {/* Footer with Signatures */}
          <div className="pt-3 border-t-2 border-slate-900 flex items-end justify-between text-xs text-slate-800">
            <div>
              <p className="font-bold text-slate-900">Farg'oniy Ta'lim Markazi Ma'muriyati</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Mas'ul xodim: ____________________</p>
            </div>
            <div className="text-right">
              <div className="w-20 h-12 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-400 font-bold uppercase inline-block">
                M.O' (Muhr)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scoped Fallback Print Styles */}
      <style>{`
        @media print {
          @page {
            size: ${format === "thermal" ? "58mm auto" : "A4 portrait"};
            margin: ${format === "thermal" ? "0mm !important" : "15mm"};
          }
          *, *::before, *::after {
            transform: none !important;
            filter: none !important;
            backdrop-filter: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          body * {
            visibility: hidden !important;
          }
          .dark,
          [class*="fixed"],
          [class*="inset-0"],
          [class*="min-h-"],
          [class*="items-center"],
          [class*="justify-center"],
          [class*="overflow-"] {
            position: static !important;
            display: block !important;
            min-height: 0 !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            transform: none !important;
            background: transparent !important;
            overflow: visible !important;
          }
          #printable-thermal-admission,
          #printable-thermal-admission *,
          #printable-admission-card,
          #printable-admission-card * {
            visibility: visible !important;
          }
          #printable-thermal-admission {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 58mm !important;
            max-width: 58mm !important;
            height: auto !important;
            margin: 0 !important;
            padding: 2mm 2.5mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            font-family: 'Courier New', Courier, monospace, monospace !important;
            page-break-after: avoid !important;
            break-after: avoid !important;
            z-index: 99999999 !important;
          }
          #printable-admission-card {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            border: 2px solid black !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
            z-index: 999999 !important;
          }
        }
      `}</style>
    </div>
  );
};
