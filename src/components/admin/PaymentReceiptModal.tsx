import React, { useRef } from "react";
import { Printer, CheckCircle2, Info } from "lucide-react";
import { Payment } from "../../types";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { formatNumber, numberToWordsUzbek } from "../../utils";

interface PaymentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
}

function escapeHtml(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const PaymentReceiptModal: React.FC<PaymentReceiptModalProps> = ({
  isOpen,
  onClose,
  payment,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!payment) return null;

  const studentName = payment.studentName || "O'quvchi";
  const groupName = payment.groupName || "O'quv guruhi";
  const paymentType = payment.note || (payment.month ? `${payment.month} oy to'lovi` : "Oy to'lovi");
  // Clean receipt number (e.g. 000123)
  const rawReceiptNo = payment.receiptNumber?.replace(/^FM-?/i, "") || Date.now().toString().slice(-6);
  const receiptNo = rawReceiptNo.padStart(6, "0");
  const paymentMethod = payment.paymentMethod || "Naqd";
  
  // Date & Time
  const pDate = payment.paymentDate ? new Date(payment.paymentDate) : new Date();
  const dateFormatted = `${String(pDate.getDate()).padStart(2, "0")}.${String(pDate.getMonth() + 1).padStart(2, "0")}.${pDate.getFullYear()}`;
  const timeFormatted = new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });

  const amountNumber = Number(payment.amount) || 0;
  const amountFormatted = `${formatNumber(amountNumber)} so'm`;
  const amountWords = `(${numberToWordsUzbek(amountNumber)})`;

  const handlePrint = () => {
    const sName = escapeHtml(studentName);
    const gName = escapeHtml(groupName);
    const pType = escapeHtml(paymentType);
    const rNo = escapeHtml(receiptNo);
    const pMethod = escapeHtml(paymentMethod);
    const dFormatted = escapeHtml(dateFormatted);
    const tFormatted = escapeHtml(timeFormatted);
    const aFormatted = escapeHtml(amountFormatted);
    const aWords = escapeHtml(amountWords);

    const printHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Chek_${rNo}</title>
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
      padding: 4mm 3mm 5mm 3mm;
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
      font-size: 18px;
      font-weight: 900;
      text-align: center;
      line-height: 1.15;
      color: #000000;
      margin-top: 2px;
      letter-spacing: -0.2px;
    }
    .brand-sub {
      font-size: 11.5px;
      font-weight: 900;
      text-align: center;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #000000;
      margin-top: 1.5px;
    }
    .brand-motto {
      font-size: 10px;
      font-style: italic;
      font-weight: 600;
      text-align: center;
      color: #000000;
      margin-top: 2px;
      margin-bottom: 4px;
    }
    .solid-divider {
      border-top: 1.5px solid #000000;
      margin: 4.5px 0;
    }
    .receipt-header-title {
      font-size: 16px;
      font-weight: 900;
      text-align: center;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      color: #000000;
      margin: 2px 0;
    }
    .receipt-meta {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: 11px;
      font-weight: 800;
      color: #000000;
      margin: 2px 0;
    }
    .meta-num {
      font-weight: 900;
      font-size: 12px;
    }
    .data-table {
      width: 100%;
      margin: 3px 0;
      font-size: 11.5px;
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
      width: 7%;
      text-align: center;
      font-weight: 900;
    }
    .val-col {
      width: 61%;
      font-weight: 800;
      word-break: break-word;
      padding-left: 2px;
    }
    .amount-box {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      padding: 3px 0;
    }
    .amount-left {
      flex: 1;
    }
    .amount-label {
      font-size: 12px;
      font-weight: 900;
      color: #000000;
    }
    .amount-words {
      font-size: 9.5px;
      font-weight: 700;
      color: #000000;
      margin-top: 1px;
      line-height: 1.15;
    }
    .amount-val {
      font-size: 17px;
      font-weight: 900;
      text-align: right;
      white-space: nowrap;
      color: #000000;
    }
    .footer-section {
      text-align: center;
      margin-top: 4px;
      color: #000000;
    }
    .thank-you {
      font-size: 11.5px;
      font-weight: 700;
      line-height: 1.25;
    }
    .heart-sep {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      margin: 4px 0;
    }
    .heart-line {
      display: inline-block;
      width: 40px;
      height: 1px;
      background: #000000;
    }
    .heart-symbol {
      font-size: 14px;
      line-height: 1;
      font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif;
    }
    .phone-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      font-size: 14px;
      font-weight: 900;
      letter-spacing: 0.3px;
      margin-top: 2px;
    }
    .phone-or {
      font-size: 10px;
      font-weight: 600;
      margin: 1px 0;
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <!-- LOGO (Farg'oniy Maktabi Romb logotipi) -->
    <div class="logo-box">
      <svg width="44" height="44" viewBox="0 0 120 120" fill="none" style="display:inline-block; vertical-align:middle;">
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
    <div class="brand-motto">Bilim – kelajak kaliti!</div>

    <div class="solid-divider"></div>

    <!-- TO'LOV CHEKI -->
    <div class="receipt-header-title">TO'LOV CHEKI</div>
    <div class="receipt-meta">
      <span>Chek №: <span class="meta-num">${rNo}</span></span>
      <span>${dFormatted}&nbsp;&nbsp;&nbsp;&nbsp;${tFormatted}</span>
    </div>

    <div class="solid-divider"></div>

    <!-- Ma'lumotlar jadvali -->
    <table class="data-table">
      <tr>
        <td class="label-col">O'quvchi</td>
        <td class="colon-col">:</td>
        <td class="val-col">${sName}</td>
      </tr>
      <tr>
        <td class="label-col">Guruh</td>
        <td class="colon-col">:</td>
        <td class="val-col">${gName}</td>
      </tr>
      <tr>
        <td class="label-col">To'lov turi</td>
        <td class="colon-col">:</td>
        <td class="val-col">${pType}</td>
      </tr>
      <tr>
        <td class="label-col">To'lov sanasi</td>
        <td class="colon-col">:</td>
        <td class="val-col">${dFormatted}</td>
      </tr>
      <tr>
        <td class="label-col">To'lov usuli</td>
        <td class="colon-col">:</td>
        <td class="val-col">${pMethod}</td>
      </tr>
    </table>

    <div class="solid-divider"></div>

    <!-- Summa qismi -->
    <div class="amount-box">
      <div class="amount-left">
        <div class="amount-label">To'langan summa</div>
        <div class="amount-words">${aWords}</div>
      </div>
      <div class="amount-val">${aFormatted}</div>
    </div>

    <div class="solid-divider"></div>

    <!-- Minnatdorchilik va Aloqa -->
    <div class="footer-section">
      <div class="thank-you">Bizni tanlaganingiz uchun<br/>rahmat!</div>
      <div class="heart-sep">
        <span class="heart-line"></span>
        <span class="heart-symbol">👌</span>
        <span class="heart-line"></span>
      </div>
      <div class="phone-row">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block; vertical-align:middle; margin-right:2px;">
          <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.44-5.15-3.75-6.59-6.59l1.97-1.57c.28-.28.37-.67.25-1.02A11.36 11.36 0 0 1 8.57 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.57c0-.55-.45-1-1-.05z"/>
        </svg>
        <span>+998 959 252 200</span>
      </div>
      <div class="phone-or">yoki</div>
      <div class="phone-row" style="margin-top: 0;">
        <span>+998 558 122 200</span>
      </div>
    </div>
  </div>
</body>
</html>`;

    // Dynamic hidden iframe print
    const oldIframe = document.getElementById("thermal-receipt-iframe");
    if (oldIframe) oldIframe.remove();

    const iframe = document.createElement("iframe");
    iframe.id = "thermal-receipt-iframe";
    iframe.style.position = "fixed";
    iframe.style.top = "0";
    iframe.style.left = "0";
    iframe.style.width = "58mm";
    iframe.style.height = "100%";
    iframe.style.border = "none";
    iframe.style.opacity = "0";
    iframe.style.pointerEvents = "none";
    iframe.style.zIndex = "-9999";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(printHtml);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="To'lov Cheki (58mm)" maxWidth="sm">
      <div className="space-y-4">
        {/* Printer Specs Info Callout */}
        <div className="flex items-center justify-between px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">58mm Termal Chek</span>
          </div>
          <span className="text-[11px] bg-emerald-500/20 px-2.5 py-0.5 rounded font-mono font-bold">
            58mm
          </span>
        </div>

        {/* Receipt Preview (Dizayn 2-rasm bilan 100% bir xil) */}
        <div className="flex justify-center p-3 bg-slate-950/60 rounded-xl border border-slate-800">
          <div
            id="printable-thermal-receipt"
            ref={receiptRef}
            className="w-[58mm] max-w-[58mm] bg-white text-black rounded-sm shadow-2xl select-none relative overflow-hidden"
            style={{
              width: "58mm",
              maxWidth: "58mm",
              boxSizing: "border-box",
              fontFamily: "'Segoe UI', Arial, sans-serif",
            }}
          >
            {/* Zigzag Top Edge (2-rasmdagi tishsimon qirra) */}
            <div className="w-full overflow-hidden leading-none h-[6px] bg-slate-950/60">
              <svg viewBox="0 0 100 6" preserveAspectRatio="none" className="w-full h-[6px] block">
                <polygon points="0,6 2.5,0 5,6 7.5,0 10,6 12.5,0 15,6 17.5,0 20,6 22.5,0 25,6 27.5,0 30,6 32.5,0 35,6 37.5,0 40,6 42.5,0 45,6 47.5,0 50,6 52.5,0 55,6 57.5,0 60,6 62.5,0 65,6 67.5,0 70,6 72.5,0 75,6 77.5,0 80,6 82.5,0 85,6 87.5,0 90,6 92.5,0 95,6 97.5,0 100,6" fill="#ffffff" />
              </svg>
            </div>

            <div className="p-3 pt-2">
              {/* Logo */}
              <div className="text-center mb-1">
                <svg width="42" height="42" viewBox="0 0 120 120" fill="none" className="mx-auto">
                  <g transform="translate(60, 60) rotate(-45) translate(-60, -60)">
                    <path d="M16 16H66V34H36V50H60V66H36V104H16V16Z" fill="#0B3E91"/>
                    <path d="M72 16H104V104H44V88H86V72H72V16Z" fill="#F26522"/>
                    <path d="M44 50H68V66H44V50Z" fill="#F26522"/>
                  </g>
                </svg>
              </div>

              {/* Brand Title */}
              <div className="text-center">
                <div className="text-[17px] font-black text-black leading-tight tracking-tight">
                  Farg'oniy Maktabi
                </div>
                <div className="text-[11px] font-black uppercase tracking-widest text-black mt-0.5">
                  O'QUV MARKAZI
                </div>
                <div className="text-[10px] italic font-semibold text-black mt-0.5 mb-1.5">
                  Bilim – kelajak kaliti!
                </div>
              </div>

              {/* Solid line */}
              <div className="border-t-[1.5px] border-black my-1.5" />

              {/* Header Title */}
              <div className="text-center text-[16px] font-black tracking-wide text-black my-0.5 uppercase">
                TO'LOV CHEKI
              </div>

              {/* Receipt Meta */}
              <div className="flex justify-between items-baseline text-[11px] font-bold text-black px-0.5 my-1">
                <span>Chek №: <strong className="font-black text-[12.5px]">{receiptNo}</strong></span>
                <span className="font-extrabold text-[11px]">{dateFormatted}&nbsp;&nbsp;&nbsp;&nbsp;{timeFormatted}</span>
              </div>

              {/* Solid line */}
              <div className="border-t-[1.5px] border-black my-1.5" />

              {/* Data rows with aligned colons */}
              <div className="text-[11.5px] space-y-1 text-black py-0.5">
                <div className="flex items-start">
                  <span className="w-[32%] font-bold shrink-0">O'quvchi</span>
                  <span className="w-[7%] font-black text-center">:</span>
                  <span className="w-[61%] font-extrabold break-words pl-1">{studentName}</span>
                </div>
                <div className="flex items-start">
                  <span className="w-[32%] font-bold shrink-0">Guruh</span>
                  <span className="w-[7%] font-black text-center">:</span>
                  <span className="w-[61%] font-extrabold break-words pl-1">{groupName}</span>
                </div>
                <div className="flex items-start">
                  <span className="w-[32%] font-bold shrink-0">To'lov turi</span>
                  <span className="w-[7%] font-black text-center">:</span>
                  <span className="w-[61%] font-extrabold break-words pl-1">{paymentType}</span>
                </div>
                <div className="flex items-start">
                  <span className="w-[32%] font-bold shrink-0">To'lov sanasi</span>
                  <span className="w-[7%] font-black text-center">:</span>
                  <span className="w-[61%] font-extrabold pl-1">{dateFormatted}</span>
                </div>
                <div className="flex items-start">
                  <span className="w-[32%] font-bold shrink-0">To'lov usuli</span>
                  <span className="w-[7%] font-black text-center">:</span>
                  <span className="w-[61%] font-extrabold pl-1">{paymentMethod}</span>
                </div>
              </div>

              {/* Solid line */}
              <div className="border-t-[1.5px] border-black my-1.5" />

              {/* Total Amount Box */}
              <div className="flex justify-between items-end py-1 px-0.5">
                <div>
                  <div className="text-[12px] font-black text-black">To'langan summa</div>
                  <div className="text-[9.5px] font-bold text-black mt-0.5 leading-tight">{amountWords}</div>
                </div>
                <div className="text-[17px] font-black text-black text-right whitespace-nowrap">
                  {amountFormatted}
                </div>
              </div>

              {/* Solid line */}
              <div className="border-t-[1.5px] border-black my-1.5" />

              {/* Footer Contact Info */}
              <div className="text-center pt-1 text-black">
                <p className="text-[11.5px] font-bold leading-tight">
                  Bizni tanlaganingiz uchun<br />rahmat!
                </p>
                <div className="flex items-center justify-center gap-2 my-1.5">
                  <span className="w-9 h-[1px] bg-black inline-block"></span>
                  <span className="text-[14px] leading-none">👌</span>
                  <span className="w-9 h-[1px] bg-black inline-block"></span>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-[14px] font-black tracking-tight">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                    <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.44-5.15-3.75-6.59-6.59l1.97-1.57c.28-.28.37-.67.25-1.02A11.36 11.36 0 0 1 8.57 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.57c0-.55-.45-1-1-.05z"/>
                  </svg>
                  <span>+998 959 252 200</span>
                </div>
                <p className="text-[10px] font-semibold my-0.5">yoki</p>
                <div className="text-[14px] font-black tracking-tight">
                  +998 558 122 200
                </div>
              </div>
            </div>

            {/* Zigzag Bottom Edge (2-rasmdagi tishsimon qirra) */}
            <div className="w-full overflow-hidden leading-none h-[6px] bg-slate-950/60">
              <svg viewBox="0 0 100 6" preserveAspectRatio="none" className="w-full h-[6px] block">
                <polygon points="0,0 2.5,6 5,0 7.5,6 10,0 12.5,6 15,0 17.5,6 20,0 22.5,6 25,0 27.5,6 30,0 32.5,6 35,0 37.5,6 40,0 42.5,6 45,0 47.5,6 50,0 52.5,6 55,0 57.5,6 60,0 62.5,6 65,0 67.5,6 70,0 72.5,6 75,0 77.5,6 80,0 82.5,6 85,0 87.5,6 90,0 92.5,6 95,0 97.5,6 100,0" fill="#ffffff" />
              </svg>
            </div>
          </div>
        </div>

        {/* Small Tip about Headers and Footers */}
        <div className="flex items-start gap-2 p-2.5 bg-slate-800/60 rounded-lg text-slate-400 text-[11px] leading-relaxed border border-slate-700/50">
          <Info className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
          <span>
            Printer oynasida <strong>More settings &gt; Headers and footers</strong> belgisi o'chiq ekanligiga ishonch hosil qiling.
          </span>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-1">
          <Button variant="outline" onClick={onClose}>
            Yopish
          </Button>
          <Button onClick={handlePrint} leftIcon={<Printer className="w-4 h-4" />}>
            Chop etish (58mm)
          </Button>
        </div>
      </div>
    </Modal>
  );
};
