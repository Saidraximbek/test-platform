import React, { useRef } from "react";
import { Printer, CheckCircle2, Info } from "lucide-react";
import { Payment } from "../../types";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { formatNumber } from "../../utils";

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

  const handlePrint = () => {
    const studentName = escapeHtml(payment.studentName || "O'quvchi");
    const groupName = escapeHtml(payment.groupName || "O'quv guruhi");
    const month = escapeHtml(payment.month || "-");
    const adminName = escapeHtml(payment.adminName || "Administrator");
    const receiptNumber = escapeHtml(payment.receiptNumber || `FM-${Date.now().toString().slice(-6)}`);
    const paymentDate = escapeHtml(payment.paymentDate || new Date().toISOString().slice(0, 10));
    const amountStr = `${formatNumber(payment.amount)} UZS`;

    // 58mm width, tight auto-height HTML for continuous roll printers (Xprinter XP-58, etc.)
    const printHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Chek</title>
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
      font-size: 11px;
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
    .total-box {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 3px 0;
    }
    .total-label {
      font-size: 13.5px;
      font-weight: 900;
      text-transform: uppercase;
    }
    .total-value {
      font-size: 16.5px;
      font-weight: 900;
      text-align: right;
    }
    .footer {
      text-align: center;
      margin-top: 3px;
      font-size: 11px;
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
    <!-- Header -->
    <div class="center">
      <div class="title">FARG'ONIY MAKTABI</div>
      <div class="subtitle">TO'LOV CHEKI</div>
      <div class="meta-row">
        <span>№: ${receiptNumber}</span>
        <span>${paymentDate}</span>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Body Rows -->
    <div class="info-list">
      <div class="info-row">
        <span class="info-label">O'quvchi:</span>
        <span class="info-value">${studentName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Guruh:</span>
        <span class="info-value">${groupName}</span>
      </div>
      <div class="info-row">
        <span class="info-label">To'lov oyi:</span>
        <span class="info-value">${month}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Qabul qildi:</span>
        <span class="info-value">${adminName}</span>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Total -->
    <div class="total-box">
      <span class="total-label">JAMI:</span>
      <span class="total-value">${amountStr}</span>
    </div>

    <div class="divider"></div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-bold">To'lovingiz uchun rahmat!</div>
      <div class="footer-sub">Rasmiy to'lov hujjati</div>
    </div>
  </div>
</body>
</html>`;

    // Remove existing iframe if any
    const existingIframe = document.getElementById("thermal-print-frame");
    if (existingIframe) {
      existingIframe.remove();
    }

    const iframe = document.createElement("iframe");
    iframe.id = "thermal-print-frame";
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="To'lov Cheki (58mm)" maxWidth="sm">
      <div className="space-y-4">
        {/* Printer Specs Info Callout */}
        <div className="flex items-center justify-between px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">Xprinter XP-58 (58mm ixcham chek)</span>
          </div>
          <span className="text-[11px] bg-emerald-500/20 px-2.5 py-0.5 rounded font-mono font-bold">
            58mm
          </span>
        </div>

        {/* Receipt Preview Container */}
        <div className="flex justify-center p-3 bg-slate-950/60 rounded-xl border border-slate-800">
          <div
            id="printable-thermal-receipt"
            ref={receiptRef}
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
                TO'LOV CHEKI
              </div>
              <div className="flex justify-between items-center text-[11px] font-bold text-black mt-1 px-0.5">
                <span>№: {payment.receiptNumber}</span>
                <span>{payment.paymentDate}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-b-[1.5px] border-dashed border-black my-1.5" />

            {/* Body */}
            <div className="space-y-1 text-black text-[12px] leading-tight">
              <div className="flex justify-between items-baseline gap-1">
                <span className="font-bold text-black shrink-0 text-[11.5px]">O'quvchi:</span>
                <span className="font-black text-black text-right text-[12px] break-words">
                  {payment.studentName}
                </span>
              </div>

              <div className="flex justify-between items-baseline gap-1">
                <span className="font-bold text-black shrink-0 text-[11.5px]">Guruh:</span>
                <span className="font-black text-black text-right text-[12px] break-words">
                  {payment.groupName || "O'quv guruhi"}
                </span>
              </div>

              <div className="flex justify-between items-baseline gap-1">
                <span className="font-bold text-black shrink-0 text-[11.5px]">To'lov oyi:</span>
                <span className="font-black text-black text-right text-[12px]">{payment.month}</span>
              </div>

              <div className="flex justify-between items-baseline gap-1">
                <span className="font-bold text-black shrink-0 text-[11.5px]">Qabul qildi:</span>
                <span className="font-black text-black text-right text-[12px] break-words">
                  {payment.adminName || "Admin"}
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="border-b-[1.5px] border-dashed border-black my-1.5" />

            {/* Total */}
            <div className="flex justify-between items-baseline py-1 px-0.5">
              <span className="text-[13.5px] font-black uppercase text-black">JAMI:</span>
              <span className="text-[16.5px] font-black text-black">
                {formatNumber(payment.amount)} UZS
              </span>
            </div>

            {/* Divider */}
            <div className="border-b-[1.5px] border-dashed border-black my-1.5" />

            {/* Footer */}
            <div className="text-center pt-1 text-black leading-tight">
              <p className="font-extrabold text-[11px]">To'lovingiz uchun rahmat!</p>
              <p className="text-[9px] font-bold text-black/80 mt-0.5">Rasmiy to'lov hujjati</p>
            </div>
          </div>
        </div>

        {/* Small Tip about Headers and Footers */}
        <div className="flex items-start gap-2 p-2.5 bg-slate-800/60 rounded-lg text-slate-400 text-[11px] leading-relaxed border border-slate-700/50">
          <Info className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
          <span>
            Qog'oz ortiqcha cho'zilib ketmasligi uchun printer oynasida <strong>More settings &gt; Headers and footers</strong> belgisi o'chiq ekanligiga ishonch hosil qiling.
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

      {/* Scoped Fallback Print Styles */}
      <style>{`
        @media print {
          @page {
            size: 58mm auto;
            margin: 0mm !important;
          }
          *, *::before, *::after {
            transform: none !important;
            filter: none !important;
            backdrop-filter: none !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          html, body {
            width: 58mm !important;
            max-width: 58mm !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            overflow: visible !important;
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
            max-height: none !important;
            margin: 0 !important;
            padding: 0 !important;
            transform: none !important;
            background: transparent !important;
            overflow: visible !important;
          }
          #printable-thermal-receipt,
          #printable-thermal-receipt * {
            visibility: visible !important;
          }
          #printable-thermal-receipt {
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
        }
      `}</style>
    </Modal>
  );
};
