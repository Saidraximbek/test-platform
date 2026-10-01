import{j as e,g as f,u as me,a as xe,S as he}from"./index-Bhn_Hfzp.js";import{r as l}from"./vendor-react-D785DYxF.js";import{f as M}from"./financeService-C0zZhQhN.js";import{g as pe}from"./groupService-CwKds2E8.js";import{a as ue}from"./adminService-BMEOb_lQ.js";import{B as h}from"./Button-BQL8_66v.js";import{C as u}from"./Card-Cp8_xc7f.js";import{M as R}from"./Modal-quMsLezb.js";import{I as P}from"./Input-CmP-sIN1.js";import{c as X,I as be,ao as _,n as B,ae as fe,D as ge,x as ve,ag as je,af as Ne}from"./vendor-icons-KMrwZWfz.js";import"./vendor-firebase-Dtv4vnt5.js";import"./teacherService-DSpTTmUK.js";function b(o){return(o||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}const ye=({isOpen:o,onClose:g,payment:i})=>{const A=l.useRef(null);if(!i)return null;const z=()=>{var k;const v=b(i.studentName||"O'quvchi"),T=b(i.groupName||"O'quv guruhi"),j=b(i.month||"-"),O=b(i.adminName||"Administrator"),D=b(i.receiptNumber||`FM-${Date.now().toString().slice(-6)}`),w=b(i.paymentDate||new Date().toISOString().slice(0,10)),N=`${f(i.amount)} UZS`,E=`<!DOCTYPE html>
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
        <span>№: ${D}</span>
        <span>${w}</span>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Body Rows -->
    <div class="info-list">
      <div class="info-row">
        <span class="info-label">O'quvchi:</span>
        <span class="info-value">${v}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Guruh:</span>
        <span class="info-value">${T}</span>
      </div>
      <div class="info-row">
        <span class="info-label">To'lov oyi:</span>
        <span class="info-value">${j}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Qabul qildi:</span>
        <span class="info-value">${O}</span>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Total -->
    <div class="total-box">
      <span class="total-label">JAMI:</span>
      <span class="total-value">${N}</span>
    </div>

    <div class="divider"></div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-bold">To'lovingiz uchun rahmat!</div>
      <div class="footer-sub">Rasmiy to'lov hujjati</div>
    </div>
  </div>
</body>
</html>`,d=document.getElementById("thermal-print-frame");d&&d.remove();const a=document.createElement("iframe");a.id="thermal-print-frame",a.style.position="fixed",a.style.top="0",a.style.left="0",a.style.width="58mm",a.style.height="100px",a.style.border="none",a.style.opacity="0",a.style.pointerEvents="none",a.style.zIndex="-9999",document.body.appendChild(a);const m=((k=a.contentWindow)==null?void 0:k.document)||a.contentDocument;m?(m.open(),m.write(E),m.close(),setTimeout(()=>{var S,x;try{(S=a.contentWindow)==null||S.focus(),(x=a.contentWindow)==null||x.print()}catch(p){console.error("Print error:",p),window.print()}finally{setTimeout(()=>{document.body.contains(a)&&document.body.removeChild(a)},3e3)}},200)):window.print()};return e.jsxs(R,{isOpen:o,onClose:g,title:"To'lov Cheki (58mm)",maxWidth:"sm",children:[e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center justify-between px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(X,{className:"w-4 h-4 text-emerald-400 shrink-0"}),e.jsx("span",{className:"font-semibold",children:"Xprinter XP-58 (58mm ixcham chek)"})]}),e.jsx("span",{className:"text-[11px] bg-emerald-500/20 px-2.5 py-0.5 rounded font-mono font-bold",children:"58mm"})]}),e.jsx("div",{className:"flex justify-center p-3 bg-slate-950/60 rounded-xl border border-slate-800",children:e.jsxs("div",{id:"printable-thermal-receipt",ref:A,className:"w-[58mm] max-w-[58mm] bg-white text-black p-[2.5mm] rounded shadow-xl font-mono leading-tight select-none border border-slate-300",style:{width:"58mm",maxWidth:"58mm",boxSizing:"border-box"},children:[e.jsxs("div",{className:"text-center pb-0.5",children:[e.jsx("div",{className:"text-[16px] font-black uppercase tracking-tight text-black leading-tight",children:"FARG'ONIY MAKTABI"}),e.jsx("div",{className:"text-[12px] font-extrabold uppercase tracking-wider text-black mt-0.5",children:"TO'LOV CHEKI"}),e.jsxs("div",{className:"flex justify-between items-center text-[11px] font-bold text-black mt-1 px-0.5",children:[e.jsxs("span",{children:["№: ",i.receiptNumber]}),e.jsx("span",{children:i.paymentDate})]})]}),e.jsx("div",{className:"border-b-[1.5px] border-dashed border-black my-1.5"}),e.jsxs("div",{className:"space-y-1 text-black text-[12px] leading-tight",children:[e.jsxs("div",{className:"flex justify-between items-baseline gap-1",children:[e.jsx("span",{className:"font-bold text-black shrink-0 text-[11.5px]",children:"O'quvchi:"}),e.jsx("span",{className:"font-black text-black text-right text-[12px] break-words",children:i.studentName})]}),e.jsxs("div",{className:"flex justify-between items-baseline gap-1",children:[e.jsx("span",{className:"font-bold text-black shrink-0 text-[11.5px]",children:"Guruh:"}),e.jsx("span",{className:"font-black text-black text-right text-[12px] break-words",children:i.groupName||"O'quv guruhi"})]}),e.jsxs("div",{className:"flex justify-between items-baseline gap-1",children:[e.jsx("span",{className:"font-bold text-black shrink-0 text-[11.5px]",children:"To'lov oyi:"}),e.jsx("span",{className:"font-black text-black text-right text-[12px]",children:i.month})]}),e.jsxs("div",{className:"flex justify-between items-baseline gap-1",children:[e.jsx("span",{className:"font-bold text-black shrink-0 text-[11.5px]",children:"Qabul qildi:"}),e.jsx("span",{className:"font-black text-black text-right text-[12px] break-words",children:i.adminName||"Admin"})]})]}),e.jsx("div",{className:"border-b-[1.5px] border-dashed border-black my-1.5"}),e.jsxs("div",{className:"flex justify-between items-baseline py-1 px-0.5",children:[e.jsx("span",{className:"text-[13.5px] font-black uppercase text-black",children:"JAMI:"}),e.jsxs("span",{className:"text-[16.5px] font-black text-black",children:[f(i.amount)," UZS"]})]}),e.jsx("div",{className:"border-b-[1.5px] border-dashed border-black my-1.5"}),e.jsxs("div",{className:"text-center pt-1 text-black leading-tight",children:[e.jsx("p",{className:"font-extrabold text-[11px]",children:"To'lovingiz uchun rahmat!"}),e.jsx("p",{className:"text-[9px] font-bold text-black/80 mt-0.5",children:"Rasmiy to'lov hujjati"})]})]})}),e.jsxs("div",{className:"flex items-start gap-2 p-2.5 bg-slate-800/60 rounded-lg text-slate-400 text-[11px] leading-relaxed border border-slate-700/50",children:[e.jsx(be,{className:"w-4 h-4 text-brand-400 shrink-0 mt-0.5"}),e.jsxs("span",{children:["Qog'oz ortiqcha cho'zilib ketmasligi uchun printer oynasida ",e.jsx("strong",{children:"More settings > Headers and footers"})," belgisi o'chiq ekanligiga ishonch hosil qiling."]})]}),e.jsxs("div",{className:"flex items-center justify-between pt-1",children:[e.jsx(h,{variant:"outline",onClick:g,children:"Yopish"}),e.jsx(h,{onClick:z,leftIcon:e.jsx(_,{className:"w-4 h-4"}),children:"Chop etish (58mm)"})]})]}),e.jsx("style",{children:`
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
      `})]})},Ee=()=>{const{user:o}=me(),{success:g,error:i}=xe(),[A,z]=l.useState([]),[v,T]=l.useState([]),[j,O]=l.useState([]),[D,w]=l.useState(!0),[N,E]=l.useState(""),[d,a]=l.useState(new Date().toISOString().slice(0,7)),[m,k]=l.useState("all"),[S,x]=l.useState(!1),[p,G]=l.useState(""),[q,Q]=l.useState(""),[$,ee]=l.useState(5e5),[K,te]=l.useState(new Date().toISOString().slice(0,10)),[U,se]=l.useState("PAID"),[F,ae]=l.useState(""),[le,H]=l.useState(!1),[Y,L]=l.useState(null),[s,I]=l.useState(null),[ie,Z]=l.useState(!1),ne=async()=>{if(s)try{Z(!0),await M.deletePayment(s.paymentId),g("To'lov muvaffaqiyatli o'chirildi!"),I(null),C()}catch(t){i(t.message||"To'lovni o'chirishda xatolik yuz berdi")}finally{Z(!1)}},C=async()=>{try{w(!0);const[t,n,c]=await Promise.all([M.getPayments().catch(()=>[]),ue.getAllUsers("","all",200).catch(()=>[]),pe.getGroups().catch(()=>[])]);z(t),T(n.filter(r=>r.role==="student"||r.role==="user"||!r.role)),O(c)}catch(t){console.warn("Payments loadData error:",t)}finally{w(!1)}};l.useEffect(()=>{C();const t=()=>C();return window.addEventListener("finance_updated",t),()=>window.removeEventListener("finance_updated",t)},[]);const re=async t=>{if(t.preventDefault(),!p||!q){i("O'quvchi va guruhni tanlang");return}const n=v.find(r=>r.uid===p),c=j.find(r=>r.groupId===q);try{H(!0);const r=await M.recordPayment({studentId:p,studentName:(n==null?void 0:n.displayName)||"O'quvchi",groupId:q,groupName:(c==null?void 0:c.name)||"",subjectId:(c==null?void 0:c.subjectId)||"",amount:Number($),month:d,paymentDate:K,adminId:(o==null?void 0:o.uid)||"admin",adminName:(o==null?void 0:o.displayName)||"Administrator",status:U,note:F});g("To'lov muvaffaqiyatli qabul qilindi!"),x(!1),C(),L(r)}catch(r){i(r.message||"To'lovni saqlashda xatolik")}finally{H(!1)}},y=A.filter(t=>{var W,J,V;const n=t.month?t.month.slice(0,7):(W=t.paymentDate)==null?void 0:W.slice(0,7),c=((J=t.studentName)==null?void 0:J.toLowerCase().includes(N.toLowerCase()))||((V=t.receiptNumber)==null?void 0:V.toLowerCase().includes(N.toLowerCase())),r=!d||n===d,de=m==="all"||t.status===m;return c&&r&&de}),oe=y.filter(t=>t.status==="PAID"&&Number(t.amount)>0).reduce((t,n)=>t+Number(n.amount),0),ce=y.filter(t=>(t.status==="DEBT"||t.status==="PARTIAL")&&Number(t.amount)>0).reduce((t,n)=>t+Number(n.amount),0);return e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center justify-between gap-4",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(B,{className:"w-7 h-7 text-emerald-400"}),e.jsx("h1",{className:"text-2xl font-black tracking-tight text-white",children:"To'lovlar Boshqaruvi"})]}),e.jsx("p",{className:"text-xs text-slate-400 mt-1",children:"O'quvchilar to'lovlarini qabul qilish, kvitansiya chiqarish va qarzdorlik nazorati"})]}),e.jsx(h,{onClick:()=>{var t,n;G(((t=v[0])==null?void 0:t.uid)||""),Q(((n=j[0])==null?void 0:n.groupId)||""),x(!0)},leftIcon:e.jsx(fe,{className:"w-4 h-4"}),children:"Yangi to'lov qabul qilish"})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-4",children:[e.jsxs(u,{className:"p-5 bg-gradient-to-br from-emerald-950/40 to-slate-900 border-emerald-500/20",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsxs("span",{className:"text-xs font-bold text-slate-400",children:["Jami Tushum (",d,")"]}),e.jsx("div",{className:"p-2 rounded-xl bg-emerald-500/10 text-emerald-400",children:e.jsx(ge,{className:"w-5 h-5"})})]}),e.jsxs("h3",{className:"text-2xl font-black text-white mt-2",children:[f(oe)," ",e.jsx("span",{className:"text-xs font-semibold text-emerald-400",children:"UZS"})]}),e.jsxs("p",{className:"text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1",children:[e.jsx(X,{className:"w-3.5 h-3.5"})," Muvaffaqiyatli qabul qilingan to'lovlar"]})]}),e.jsxs(u,{className:"p-5 bg-gradient-to-br from-rose-950/40 to-slate-900 border-rose-500/20",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-xs font-bold text-slate-400",children:"Qarzdorlik / Qoldiq"}),e.jsx("div",{className:"p-2 rounded-xl bg-rose-500/10 text-rose-400",children:e.jsx(ve,{className:"w-5 h-5"})})]}),e.jsxs("h3",{className:"text-2xl font-black text-white mt-2",children:[f(ce)," ",e.jsx("span",{className:"text-xs font-semibold text-rose-400",children:"UZS"})]}),e.jsx("p",{className:"text-[11px] text-rose-400/80 mt-1 flex items-center gap-1",children:"Kutilayotgan yoki to'lanmagan mablag'lar"})]}),e.jsxs(u,{className:"p-5 bg-slate-900 border-slate-800",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-xs font-bold text-slate-400",children:"Tranzaksiyalar Soni"}),e.jsx("div",{className:"p-2 rounded-xl bg-slate-800 text-slate-400",children:e.jsx(B,{className:"w-5 h-5"})})]}),e.jsxs("h3",{className:"text-2xl font-black text-white mt-2",children:[y.length," ",e.jsx("span",{className:"text-xs font-semibold text-slate-400",children:"ta"})]}),e.jsx("p",{className:"text-[11px] text-slate-400 mt-1",children:"Ko'rsatilayotgan to'lovlar soni"})]})]}),e.jsxs(u,{className:"p-4 bg-slate-900/60 border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3",children:[e.jsxs("div",{className:"relative flex-1",children:[e.jsx(je,{className:"w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"}),e.jsx("input",{type:"text",placeholder:"O'quvchi ismi yoki kvitansiya raqami (#FM-...) bo'yicha qidirish...",value:N,onChange:t=>E(t.target.value),className:"w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("input",{type:"month",value:d,onChange:t=>a(t.target.value),className:"bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-brand-500"}),e.jsxs("select",{value:m,onChange:t=>k(t.target.value),className:"bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-brand-500",children:[e.jsx("option",{value:"all",children:"Barcha holatlar"}),e.jsx("option",{value:"PAID",children:"To'langan (PAID)"}),e.jsx("option",{value:"PARTIAL",children:"Qisman (PARTIAL)"}),e.jsx("option",{value:"DEBT",children:"Qarz (DEBT)"}),e.jsx("option",{value:"CANCELLED",children:"Bekor qilingan"})]})]})]}),D?e.jsx("div",{className:"flex justify-center py-20",children:e.jsx(he,{size:"lg",className:"text-brand-500"})}):y.length===0?e.jsxs(u,{className:"p-12 text-center bg-slate-900/40 border-slate-800",children:[e.jsx(B,{className:"w-12 h-12 mx-auto text-slate-600 mb-3"}),e.jsx("h3",{className:"text-base font-bold text-white",children:"To'lovlar topilmadi"}),e.jsx("p",{className:"text-xs text-slate-400 mt-1 max-w-sm mx-auto",children:"Tanlangan oy yoki qidiruv so'rovi bo'yicha hech qanday to'lov mavjud emas."})]}):e.jsx(u,{className:"bg-slate-900/80 border-slate-800 overflow-hidden",children:e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"w-full text-left text-xs text-slate-300",children:[e.jsx("thead",{className:"bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800",children:e.jsxs("tr",{children:[e.jsx("th",{className:"p-3.5",children:"Kvitansiya"}),e.jsx("th",{className:"p-3.5",children:"O'quvchi"}),e.jsx("th",{className:"p-3.5",children:"Guruh"}),e.jsx("th",{className:"p-3.5",children:"Oy / Sana"}),e.jsx("th",{className:"p-3.5",children:"Summa"}),e.jsx("th",{className:"p-3.5",children:"Holat"}),e.jsx("th",{className:"p-3.5 text-right",children:"Amallar"})]})}),e.jsx("tbody",{className:"divide-y divide-slate-800/60",children:y.map(t=>e.jsxs("tr",{className:"hover:bg-slate-800/40 transition-colors",children:[e.jsx("td",{className:"p-3.5",children:e.jsx("span",{className:"font-mono font-bold text-brand-400",children:t.receiptNumber})}),e.jsx("td",{className:"p-3.5",children:e.jsx("p",{className:"font-bold text-white",children:t.studentName})}),e.jsx("td",{className:"p-3.5",children:e.jsx("span",{className:"text-slate-300 font-medium",children:t.groupName||"Guruh"})}),e.jsxs("td",{className:"p-3.5",children:[e.jsx("p",{className:"font-semibold text-white",children:t.month}),e.jsx("p",{className:"text-[11px] text-slate-400",children:t.paymentDate})]}),e.jsx("td",{className:"p-3.5",children:e.jsxs("span",{className:"font-bold text-white text-sm",children:[f(t.amount)," ",e.jsx("span",{className:"text-[10px] text-slate-400",children:"so'm"})]})}),e.jsx("td",{className:"p-3.5",children:e.jsx("span",{className:`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${t.status==="PAID"?"bg-emerald-500/10 text-emerald-400 border-emerald-500/30":t.status==="PARTIAL"?"bg-sky-500/10 text-sky-400 border-sky-500/30":t.status==="DEBT"?"bg-rose-500/10 text-rose-400 border-rose-500/30":"bg-slate-500/10 text-slate-400 border-slate-500/30"}`,children:t.status})}),e.jsx("td",{className:"p-3.5 text-right",children:e.jsxs("div",{className:"flex items-center justify-end gap-1.5",children:[e.jsxs("button",{onClick:()=>L(t),className:"inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-brand-300 hover:bg-brand-600 hover:text-white transition-all border border-slate-700/60",title:"Kvitansiyani chop etish",children:[e.jsx(_,{className:"w-3.5 h-3.5"})," Chop etish"]}),e.jsx("button",{onClick:()=>I(t),className:"p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors",title:"To'lovni o'chirish",children:e.jsx(Ne,{className:"w-4 h-4"})})]})})]},t.paymentId))})]})})}),e.jsx(R,{isOpen:S,onClose:()=>x(!1),title:"Yangi To'lov Qabul Qilish",children:e.jsxs("form",{onSubmit:re,className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-semibold text-slate-300 mb-1",children:"O'quvchi"}),e.jsxs("select",{value:p,onChange:t=>G(t.target.value),className:"w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500",required:!0,children:[e.jsx("option",{value:"",children:"O'quvchini tanlang"}),v.map(t=>e.jsxs("option",{value:t.uid,children:[t.displayName," (",t.phoneNumber||"raqamsiz",")"]},t.uid))]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-semibold text-slate-300 mb-1",children:"Guruh"}),e.jsxs("select",{value:q,onChange:t=>Q(t.target.value),className:"w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500",required:!0,children:[e.jsx("option",{value:"",children:"Guruhni tanlang"}),j.map(t=>e.jsx("option",{value:t.groupId,children:t.name},t.groupId))]})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-3",children:[e.jsx(P,{label:"To'lov summasi (UZS)",type:"number",value:$,onChange:t=>ee(Number(t.target.value)),required:!0}),e.jsx(P,{label:"Qaysi oy uchun",type:"month",value:d,onChange:t=>a(t.target.value),required:!0})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-3",children:[e.jsx(P,{label:"To'lov qabul qilingan sana",type:"date",value:K,onChange:t=>te(t.target.value),required:!0}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-semibold text-slate-300 mb-1",children:"To'lov holati"}),e.jsxs("select",{value:U,onChange:t=>se(t.target.value),className:"w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500",children:[e.jsx("option",{value:"PAID",children:"To'liq to'landi (PAID)"}),e.jsx("option",{value:"PARTIAL",children:"Qisman to'lov (PARTIAL)"}),e.jsx("option",{value:"DEBT",children:"Qarzdorlik (DEBT)"})]})]})]}),e.jsx(P,{label:"Qo'shimcha izoh (ixtiyoriy)",placeholder:"Masalan: Naqd yoki karta orqali",value:F,onChange:t=>ae(t.target.value)}),e.jsxs("div",{className:"flex justify-end gap-2 pt-2",children:[e.jsx(h,{type:"button",variant:"outline",onClick:()=>x(!1),children:"Bekor qilish"}),e.jsx(h,{type:"submit",isLoading:le,children:"To'lovni tasdiqlash"})]})]})}),e.jsx(ye,{isOpen:!!Y,onClose:()=>L(null),payment:Y}),e.jsx(R,{isOpen:!!s,onClose:()=>I(null),title:"To'lovni O'chirish",children:e.jsxs("div",{className:"space-y-4 text-xs",children:[e.jsx("p",{className:"text-slate-300",children:"Rostdan ham ushbu to'lov yozuvini o'chirmoqchimisiz?"}),e.jsxs("div",{className:"p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-slate-400",children:"O'quvchi:"}),e.jsx("span",{className:"font-bold text-white text-sm",children:s==null?void 0:s.studentName})]}),e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-slate-400",children:"Guruh:"}),e.jsx("span",{className:"font-semibold text-slate-200",children:(s==null?void 0:s.groupName)||"Guruh"})]}),e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-slate-400",children:"Summa:"}),e.jsxs("span",{className:"font-bold text-emerald-400 text-sm",children:[f((s==null?void 0:s.amount)||0)," UZS"]})]}),e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-slate-400",children:"Kvitansiya raqami:"}),e.jsx("span",{className:"font-mono text-brand-400 font-bold",children:s==null?void 0:s.receiptNumber})]}),e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-slate-400",children:"Sana / Oy:"}),e.jsxs("span",{className:"text-slate-300",children:[s==null?void 0:s.paymentDate," (",s==null?void 0:s.month,")"]})]})]}),e.jsx("p",{className:"text-[11px] text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20",children:"⚠️ Ushbu to'lov o'chirilgach, markazning umumiy tushumlar hisoboti va ustozlar maoshidagi guruh tushumi ham shunga mos yangilanadi."}),e.jsxs("div",{className:"flex justify-end gap-2 pt-2",children:[e.jsx(h,{variant:"outline",onClick:()=>I(null),children:"Bekor qilish"}),e.jsx(h,{variant:"danger",onClick:ne,isLoading:ie,children:"To'lovni O'chirish"})]})]})})]})};export{Ee as AdminPaymentsPage};
