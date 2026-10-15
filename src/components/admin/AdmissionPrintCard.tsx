import React, { useState } from "react";
import { Printer, CheckCircle2, Key, Info, FileText, Phone, Globe } from "lucide-react";
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
  const siteUrl = "www.fargoniymaktabi.uz";

  const handlePrintThermal = () => {
    const fullName = escapeHtml(admission.fullName || "O'quvchi");
    const phoneNumber = escapeHtml(admission.phoneNumber || "-");
    const parentPhone = escapeHtml(admission.parentPhone || "");
    const subject = escapeHtml(admission.interestedSubject || "Umumiy ta'lim");
    const groupName = escapeHtml(admission.assignedGroupName || "");
    const login = escapeHtml(admission.login || "login");
    const password = escapeHtml(admission.plainPassword || "******");
    const admissionNumber = escapeHtml(admission.id ? admission.id.slice(-6).toUpperCase() : Date.now().toString().slice(-6));
    const dateStr = formatDate(admission.createdAt);

    const printHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Qabul_Cheki_${admissionNumber}</title>
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
      font-family: 'Segoe UI', Arial, -apple-system, sans-serif;
      overflow: hidden;
    }
    .receipt-container {
      width: 58mm;
      max-width: 58mm;
      padding: 3.5mm 3mm 4.5mm 3mm;
      margin: 0 auto;
      background: #ffffff;
      color: #000000;
      page-break-after: avoid;
      break-after: avoid;
    }
    .logo-box {
      text-align: center;
      margin-bottom: 2px;
    }
    .brand-title {
      font-size: 16.5px;
      font-weight: 900;
      text-align: center;
      line-height: 1.15;
      color: #000000;
      margin-top: 2px;
    }
    .brand-sub {
      font-size: 10.5px;
      font-weight: 800;
      text-align: center;
      letter-spacing: 1.8px;
      text-transform: uppercase;
      color: #000000;
      margin-top: 1px;
    }
    .brand-motto {
      font-size: 9.5px;
      font-style: italic;
      font-weight: 700;
      text-align: center;
      color: #000000;
      margin-top: 1.5px;
      margin-bottom: 3.5px;
    }
    .solid-divider {
      border-top: 1.5px solid #000000;
      margin: 3.5px 0;
    }
    .receipt-header-title {
      font-size: 14.5px;
      font-weight: 900;
      text-align: center;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      color: #000000;
      margin: 2px 0;
    }
    .receipt-meta {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 10.5px;
      font-weight: 800;
      color: #000000;
      margin: 2px 0;
    }
    .meta-num {
      font-weight: 900;
    }
    .data-table {
      width: 100%;
      margin: 3px 0;
      font-size: 11px;
      border-collapse: collapse;
    }
    .data-table td {
      padding: 1.5px 0;
      vertical-align: top;
      color: #000000;
    }
    .label-col {
      width: 32%;
      font-weight: 700;
      white-space: nowrap;
    }
    .colon-col {
      width: 6%;
      text-align: center;
      font-weight: 900;
    }
    .val-col {
      width: 62%;
      font-weight: 800;
      word-break: break-word;
      padding-left: 2px;
    }
    .creds-box {
      border: 1.5px solid #000000;
      border-radius: 3px;
      padding: 3.5px 3px;
      margin: 4px 0;
      background: #ffffff;
    }
    .creds-title {
      font-size: 10.5px;
      font-weight: 900;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px dashed #000000;
      padding-bottom: 2px;
      margin-bottom: 3px;
    }
    .cred-site {
      font-family: 'Courier New', Courier, monospace;
      font-weight: 900;
      font-size: 11px;
      letter-spacing: -0.2px;
    }
    .cred-value-bold {
      font-family: 'Courier New', Courier, monospace;
      font-weight: 900;
      font-size: 13px;
      letter-spacing: 0.5px;
    }
    .footer-section {
      text-align: center;
      margin-top: 4px;
      color: #000000;
    }
    .thank-you {
      font-size: 10.5px;
      font-weight: 800;
      line-height: 1.2;
    }
    .heart-sep {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin: 3px 0;
    }
    .heart-line {
      display: inline-block;
      width: 34px;
      height: 1px;
      background: #000000;
    }
    .heart-symbol {
      font-size: 10px;
    }
    .web-url {
      font-size: 11px;
      font-weight: 900;
      font-family: 'Courier New', Courier, monospace;
      margin: 1px 0 2px 0;
    }
    .phone-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 0.3px;
      margin-top: 1.5px;
    }
    .phone-or {
      font-size: 9px;
      font-weight: 700;
      margin: 0.5px 0;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <!-- LOGO (Farg'oniy Maktabi Romb logotipi) -->
    <div class="logo-box">
      <svg width="40" height="40" viewBox="0 0 120 120" fill="none" style="display:inline-block; vertical-align:middle;">
        <g transform="translate(60, 60) rotate(-45) translate(-60, -60)">
          <path d="M16 16H66V34H36V50H60V66H36V104H16V16Z" fill="#0B3E91"/>
          <path d="M72 16H104V104H44V88H86V72H72V16Z" fill="#F26522"/>
          <path d="M44 50H68V66H44V50Z" fill="#F26522"/>
        </g>
      </svg>
    </div>

    <!-- Sarlavha -->
    <div class="brand-title">Farg'oniy Maktabi</div>
    <div class="brand-sub">O'QUV MARKAZI</div>
    <div class="brand-motto">Bilim — kelajak kaliti!</div>

    <div class="solid-divider"></div>

    <!-- Chek sarlavhasi -->
    <div class="receipt-header-title">QABUL CHEKI</div>

    <div class="receipt-meta">
      <span>Qabul №: <span class="meta-num">${admissionNumber}</span></span>
      <span>${dateStr}</span>
    </div>

    <div class="solid-divider"></div>

    <!-- O'quvchi ma'lumotlari -->
    <table class="data-table">
      <tr>
        <td class="label-col">O'quvchi</td>
        <td class="colon-col">:</td>
        <td class="val-col">${fullName}</td>
      </tr>
      <tr>
        <td class="label-col">Telefon</td>
        <td class="colon-col">:</td>
        <td class="val-col">${phoneNumber}</td>
      </tr>
      ${parentPhone ? `
      <tr>
        <td class="label-col">Ota-ona</td>
        <td class="colon-col">:</td>
        <td class="val-col">${parentPhone}</td>
      </tr>` : ""}
      <tr>
        <td class="label-col">Fan</td>
        <td class="colon-col">:</td>
        <td class="val-col">${subject}</td>
      </tr>
      ${groupName ? `
      <tr>
        <td class="label-col">Guruh</td>
        <td class="colon-col">:</td>
        <td class="val-col">${groupName}</td>
      </tr>` : ""}
    </table>

    <div class="solid-divider"></div>

    <!-- Platforma ma'lumotlari (Login va Parol) -->
    <div class="creds-box">
      <div class="creds-title">PLATFORMA MA'LUMOTLARI</div>
      <table class="data-table">
        <tr>
          <td class="label-col">Sayt</td>
          <td class="colon-col">:</td>
          <td class="val-col cred-site">www.fargoniymaktabi.uz</td>
        </tr>
        <tr>
          <td class="label-col">Login</td>
          <td class="colon-col">:</td>
          <td class="val-col cred-value-bold">${login}</td>
        </tr>
        <tr>
          <td class="label-col">Parol</td>
          <td class="colon-col">:</td>
          <td class="val-col cred-value-bold">${password}</td>
        </tr>
      </table>
    </div>

    <div class="solid-divider"></div>

    <!-- Footer -->
    <div class="footer-section">
      <div class="thank-you">O'qishingizda omad tilaymiz!</div>
      <div class="heart-sep">
        <span class="heart-line"></span>
        <span class="heart-symbol">♥</span>
        <span class="heart-line"></span>
      </div>
      <div class="web-url">www.fargoniymaktabi.uz</div>
      <div class="phone-row">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block; vertical-align:middle; margin-right:2px;">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
        <span>+998 959 252 200</span>
      </div>
      <div class="phone-or">yoki</div>
      <div class="phone-row">
        <span>+998 558 122 200</span>
      </div>
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

  const admissionNumber = admission.id ? admission.id.slice(-6).toUpperCase() : Date.now().toString().slice(-6);

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
              <span className="font-semibold">Xprinter XP-58 (58mm Qabul cheki)</span>
            </div>
            <span className="text-[11px] bg-emerald-500/20 px-2.5 py-0.5 rounded font-mono font-bold">
              58mm
            </span>
          </div>

          {/* Receipt Preview */}
          <div className="flex justify-center p-4 bg-slate-950/60 rounded-xl border border-slate-800">
            <div
              id="printable-thermal-admission"
              className="w-[58mm] max-w-[58mm] bg-white text-black p-[3mm] rounded shadow-2xl font-sans leading-tight select-none border border-slate-400"
              style={{
                width: "58mm",
                maxWidth: "58mm",
                boxSizing: "border-box",
                color: "#000000",
              }}
            >
              {/* Logo & Header */}
              <div className="text-center">
                <div className="flex justify-center mb-1">
                  <svg width="38" height="38" viewBox="0 0 120 120" fill="none">
                    <g transform="translate(60, 60) rotate(-45) translate(-60, -60)">
                      <path d="M16 16H66V34H36V50H60V66H36V104H16V16Z" fill="#0B3E91"/>
                      <path d="M72 16H104V104H44V88H86V72H72V16Z" fill="#F26522"/>
                      <path d="M44 50H68V66H44V50Z" fill="#F26522"/>
                    </g>
                  </svg>
                </div>
                <div className="text-[16px] font-black tracking-tight text-black leading-tight">
                  Farg'oniy Maktabi
                </div>
                <div className="text-[10.5px] font-extrabold uppercase tracking-widest text-black mt-0.5">
                  O'QUV MARKAZI
                </div>
                <div className="text-[9.5px] italic font-bold text-black mt-0.5">
                  Bilim — kelajak kaliti!
                </div>
              </div>

              {/* Solid divider */}
              <div className="border-t-[1.5px] border-black my-1.5" />

              {/* Title & Meta */}
              <div className="text-center font-black text-[14.5px] uppercase tracking-wide text-black mb-1">
                QABUL CHEKI
              </div>
              <div className="flex justify-between items-baseline text-[10.5px] font-extrabold text-black">
                <span>Qabul №: <span className="font-black">{admissionNumber}</span></span>
                <span>{formatDate(admission.createdAt)}</span>
              </div>

              {/* Solid divider */}
              <div className="border-t-[1.5px] border-black my-1.5" />

              {/* Data Table */}
              <div className="space-y-1 text-black text-[11px]">
                <div className="flex items-start">
                  <span className="w-[32%] font-bold shrink-0">O'quvchi</span>
                  <span className="w-[6%] font-black text-center">:</span>
                  <span className="w-[62%] font-extrabold break-words pl-0.5">
                    {admission.fullName}
                  </span>
                </div>
                <div className="flex items-start">
                  <span className="w-[32%] font-bold shrink-0">Telefon</span>
                  <span className="w-[6%] font-black text-center">:</span>
                  <span className="w-[62%] font-extrabold pl-0.5">
                    {admission.phoneNumber}
                  </span>
                </div>
                {admission.parentPhone && (
                  <div className="flex items-start">
                    <span className="w-[32%] font-bold shrink-0">Ota-ona</span>
                    <span className="w-[6%] font-black text-center">:</span>
                    <span className="w-[62%] font-extrabold pl-0.5">
                      {admission.parentPhone}
                    </span>
                  </div>
                )}
                <div className="flex items-start">
                  <span className="w-[32%] font-bold shrink-0">Fan</span>
                  <span className="w-[6%] font-black text-center">:</span>
                  <span className="w-[62%] font-extrabold break-words pl-0.5">
                    {admission.interestedSubject || "Umumiy ta'lim"}
                  </span>
                </div>
                {admission.assignedGroupName && (
                  <div className="flex items-start">
                    <span className="w-[32%] font-bold shrink-0">Guruh</span>
                    <span className="w-[6%] font-black text-center">:</span>
                    <span className="w-[62%] font-extrabold break-words pl-0.5">
                      {admission.assignedGroupName}
                    </span>
                  </div>
                )}
              </div>

              {/* Solid divider */}
              <div className="border-t-[1.5px] border-black my-1.5" />

              {/* Platform Credentials Box */}
              <div className="border-[1.5px] border-black rounded p-1.5 my-1 text-black bg-white">
                <div className="text-[10.5px] font-black uppercase text-center border-b border-dashed border-black pb-1 mb-1 tracking-wider">
                  PLATFORMA MA'LUMOTLARI
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center">
                    <span className="w-[32%] font-bold shrink-0">Sayt</span>
                    <span className="w-[6%] font-black text-center">:</span>
                    <span className="w-[62%] font-black font-mono text-[10.5px] pl-0.5">
                      {siteUrl}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-[32%] font-bold shrink-0">Login</span>
                    <span className="w-[6%] font-black text-center">:</span>
                    <span className="w-[62%] font-black font-mono text-[12.5px] pl-0.5">
                      {admission.login || "-"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-[32%] font-bold shrink-0">Parol</span>
                    <span className="w-[6%] font-black text-center">:</span>
                    <span className="w-[62%] font-black font-mono text-[13px] pl-0.5">
                      {admission.plainPassword || "******"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Solid divider */}
              <div className="border-t-[1.5px] border-black my-1.5" />

              {/* Footer */}
              <div className="text-center pt-0.5 text-black">
                <p className="font-extrabold text-[10.5px]">O'qishingizda omad tilaymiz!</p>
                <div className="flex items-center justify-center gap-1.5 my-1">
                  <span className="w-8 h-[1px] bg-black inline-block" />
                  <span className="text-[10px]">♥</span>
                  <span className="w-8 h-[1px] bg-black inline-block" />
                </div>
                <p className="text-[10.5px] font-black font-mono">{siteUrl}</p>
                <div className="flex items-center justify-center gap-1 text-[12.5px] font-black mt-1">
                  <Phone className="w-3 h-3 text-black shrink-0 stroke-[2.5]" />
                  <span>+998 959 252 200</span>
                </div>
                <p className="text-[9px] font-bold text-black my-0.5">yoki</p>
                <div className="text-[12.5px] font-black">
                  +998 558 122 200
                </div>
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

      {/* A4 Format View */}
      {format === "a4" && (
        <div
          id="printable-admission-card"
          className="bg-white text-black rounded-2xl p-6 sm:p-8 border-2 border-black shadow-xl max-w-2xl mx-auto font-sans"
        >
          {/* Card Header */}
          <div className="flex items-start justify-between border-b-2 border-black pb-4 mb-5">
            <div className="flex items-center gap-3">
              <FargoniyLogo size={50} subtitle="maktabi" theme="light" />
              <div>
                <h2 className="text-xl font-black text-black uppercase tracking-tight">Farg'oniy Maktabi</h2>
                <p className="text-xs font-extrabold uppercase tracking-widest text-slate-800">O'quv Markazi</p>
                <p className="text-[11px] font-semibold italic text-slate-700">Bilim — kelajak kaliti!</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded bg-black text-white text-xs font-mono font-black tracking-wider">
                QABUL #{admissionNumber}
              </span>
              <p className="text-xs text-black mt-1.5 font-bold">
                Sana: {formatDate(admission.createdAt)}
              </p>
            </div>
          </div>

          {/* Student Details Grid */}
          <div className="grid grid-cols-2 gap-4 pb-4 mb-4 border-b border-dashed border-black text-xs">
            <div>
              <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                O'quvchi (F.I.Sh):
              </span>
              <span className="text-base font-black text-black block mt-0.5">
                {admission.fullName}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                Telefon Raqami:
              </span>
              <span className="text-sm font-black text-black block mt-0.5 font-mono">
                {admission.phoneNumber}
              </span>
            </div>

            {admission.parentPhone && (
              <div>
                <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                  Ota-ona Telefoni:
                </span>
                <span className="text-xs font-bold text-black block mt-0.5 font-mono">
                  {admission.parentPhone}
                </span>
              </div>
            )}

            <div>
              <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                Fan / Yo'nalish:
              </span>
              <span className="text-xs font-black text-black block mt-0.5">
                {admission.interestedSubject || "Umumiy ta'lim"}
              </span>
            </div>

            {admission.assignedGroupName && (
              <div>
                <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                  Biriktirilgan Guruh:
                </span>
                <span className="text-xs font-black text-brand-700 block mt-0.5">
                  {admission.assignedGroupName}
                </span>
              </div>
            )}

            <div>
              <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                Holati:
              </span>
              <span className="inline-block mt-1 px-2.5 py-0.5 text-[10px] font-black uppercase rounded bg-emerald-100 text-emerald-950 border border-emerald-400">
                {admission.status === "active" ? "AKTIV (Darsga kelgan)" : admission.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Credentials Box */}
          <div className="bg-slate-50 border-2 border-black rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-black">
              <span className="text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-600" />
                Tizimga Kirish Ma'lumotlari (Shaxsiy Kabinet)
              </span>
              <span className="text-[10px] font-black text-black uppercase bg-amber-200 px-2 py-0.5 rounded">
                Maxfiy
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white rounded-lg border-2 border-slate-300">
                <span className="text-[10px] font-bold text-slate-700 uppercase block">Platforma Manzili:</span>
                <span className="text-sm font-black text-blue-800 block mt-0.5 font-mono">
                  {siteUrl}
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border-2 border-slate-300">
                <span className="text-[10px] font-bold text-slate-700 uppercase block">Foydalanuvchi Logini:</span>
                <span className="text-sm font-black text-black block mt-0.5 font-mono select-all tracking-wide">
                  {admission.login || "Hali belgilanmagan"}
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border-2 border-slate-300 sm:col-span-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-700 uppercase block">Parol (Birinchi kirish uchun):</span>
                  <span className="text-base font-black text-emerald-800 block mt-0.5 font-mono select-all tracking-wider">
                    {admission.plainPassword || "********"}
                  </span>
                </div>
                <div className="text-right text-[10px] text-slate-600 font-bold">
                  *Tizimga kirgach parolni o'zgartirishingiz mumkin
                </div>
              </div>
            </div>
          </div>

          {/* Quick Instructions */}
          <div className="bg-amber-50/70 border border-amber-300 rounded-xl p-3 mb-5 text-[11px] text-black leading-relaxed font-medium">
            <p className="font-extrabold text-black mb-1 flex items-center gap-1">
              📌 O'quvchi va ota-onalar uchun eslatma:
            </p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Telefon yoki kompyuter brauzerida <strong>{siteUrl}</strong> manzilini oching.</li>
              <li><strong>Login</strong> va <strong>Parol</strong> orqali shaxsiy kabinetingizga kiring.</li>
              <li>Dars jadvali, mavzular, uyga vazifalar va test natijalari profilingizda ko'rsatiladi.</li>
            </ol>
          </div>

          {/* Contact Row */}
          <div className="flex items-center justify-between py-2 px-3 bg-slate-100 rounded-lg mb-4 text-xs font-bold text-black border border-slate-300">
            <div className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-blue-700" />
              <span>{siteUrl}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-black" />
                +998 959 252 200
              </span>
              <span>•</span>
              <span>+998 558 122 200</span>
            </div>
          </div>

          {/* Footer with Signatures */}
          <div className="pt-3 border-t-2 border-black flex items-end justify-between text-xs text-black">
            <div>
              <p className="font-black text-black">Farg'oniy Ta'lim Markazi Ma'muriyati</p>
              <p className="text-[10px] text-slate-600 mt-0.5 font-bold">Mas'ul xodim: ____________________</p>
            </div>
            <div className="text-right">
              <div className="w-24 h-14 border-2 border-dashed border-black rounded flex items-center justify-center text-[10px] text-slate-700 font-black uppercase inline-block">
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
            padding: 3.5mm 3mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            font-family: 'Segoe UI', Arial, -apple-system, sans-serif !important;
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
