import{j as e,l as p,u as Fe,a as Ge,S as ke}from"./index-DOgzeHJ0.js";import{r as s}from"./vendor-react-D785DYxF.js";import{f as W}from"./financeService-Cq0gW3O6.js";import{g as Ue}from"./groupService-BMPSUCUy.js";import{a as Ke}from"./adminService-C0DsbCfu.js";import{t as He}from"./teacherService-K5giwnwx.js";import{B as v}from"./Button-Cjewlr5R.js";import{C as j}from"./Card-eP125tb5.js";import{M as le}from"./Modal-H9_Qf0LX.js";import{I as J}from"./Input-DEF5bcvO.js";import{c as ne,I as Ze,ao as re,n as _,ae as Se,D as Ye,x as We,j as Je,m as qe,ag as Ce,t as _e,l as Xe,af as Ve,X as et}from"./vendor-icons-BuBZv-f_.js";function k(h){return(h||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}const tt=({isOpen:h,onClose:u,payment:o})=>{const S=s.useRef(null);if(!o)return null;const x=()=>{var C;const D=k(o.studentName||"O'quvchi"),q=k(o.groupName||"O'quv guruhi"),X=k(o.month||"-"),b=k(o.adminName||"Administrator"),V=k(o.receiptNumber||`FM-${Date.now().toString().slice(-6)}`),f=k(o.paymentDate||new Date().toISOString().slice(0,10)),ee=`${p(o.amount)} UZS`,te=`<!DOCTYPE html>
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
        <span>№: ${V}</span>
        <span>${f}</span>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Body Rows -->
    <div class="info-list">
      <div class="info-row">
        <span class="info-label">O'quvchi:</span>
        <span class="info-value">${D}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Guruh:</span>
        <span class="info-value">${q}</span>
      </div>
      <div class="info-row">
        <span class="info-label">To'lov oyi:</span>
        <span class="info-value">${X}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Qabul qildi:</span>
        <span class="info-value">${b}</span>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Total -->
    <div class="total-box">
      <span class="total-label">JAMI:</span>
      <span class="total-value">${ee}</span>
    </div>

    <div class="divider"></div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-bold">To'lovingiz uchun rahmat!</div>
      <div class="footer-sub">Rasmiy to'lov hujjati</div>
    </div>
  </div>
</body>
</html>`,L=document.getElementById("thermal-print-frame");L&&L.remove();const n=document.createElement("iframe");n.id="thermal-print-frame",n.style.position="fixed",n.style.top="0",n.style.left="0",n.style.width="58mm",n.style.height="100px",n.style.border="none",n.style.opacity="0",n.style.pointerEvents="none",n.style.zIndex="-9999",document.body.appendChild(n);const N=((C=n.contentWindow)==null?void 0:C.document)||n.contentDocument;N?(N.open(),N.write(te),N.close(),setTimeout(()=>{var I,M;try{(I=n.contentWindow)==null||I.focus(),(M=n.contentWindow)==null||M.print()}catch($){console.error("Print error:",$),window.print()}finally{setTimeout(()=>{document.body.contains(n)&&document.body.removeChild(n)},3e3)}},200)):window.print()};return e.jsxs(le,{isOpen:h,onClose:u,title:"To'lov Cheki (58mm)",maxWidth:"sm",children:[e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center justify-between px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(ne,{className:"w-4 h-4 text-emerald-400 shrink-0"}),e.jsx("span",{className:"font-semibold",children:"Xprinter XP-58 (58mm ixcham chek)"})]}),e.jsx("span",{className:"text-[11px] bg-emerald-500/20 px-2.5 py-0.5 rounded font-mono font-bold",children:"58mm"})]}),e.jsx("div",{className:"flex justify-center p-3 bg-slate-950/60 rounded-xl border border-slate-800",children:e.jsxs("div",{id:"printable-thermal-receipt",ref:S,className:"w-[58mm] max-w-[58mm] bg-white text-black p-[2.5mm] rounded shadow-xl font-mono leading-tight select-none border border-slate-300",style:{width:"58mm",maxWidth:"58mm",boxSizing:"border-box"},children:[e.jsxs("div",{className:"text-center pb-0.5",children:[e.jsx("div",{className:"text-[16px] font-black uppercase tracking-tight text-black leading-tight",children:"FARG'ONIY MAKTABI"}),e.jsx("div",{className:"text-[12px] font-extrabold uppercase tracking-wider text-black mt-0.5",children:"TO'LOV CHEKI"}),e.jsxs("div",{className:"flex justify-between items-center text-[11px] font-bold text-black mt-1 px-0.5",children:[e.jsxs("span",{children:["№: ",o.receiptNumber]}),e.jsx("span",{children:o.paymentDate})]})]}),e.jsx("div",{className:"border-b-[1.5px] border-dashed border-black my-1.5"}),e.jsxs("div",{className:"space-y-1 text-black text-[12px] leading-tight",children:[e.jsxs("div",{className:"flex justify-between items-baseline gap-1",children:[e.jsx("span",{className:"font-bold text-black shrink-0 text-[11.5px]",children:"O'quvchi:"}),e.jsx("span",{className:"font-black text-black text-right text-[12px] break-words",children:o.studentName})]}),e.jsxs("div",{className:"flex justify-between items-baseline gap-1",children:[e.jsx("span",{className:"font-bold text-black shrink-0 text-[11.5px]",children:"Guruh:"}),e.jsx("span",{className:"font-black text-black text-right text-[12px] break-words",children:o.groupName||"O'quv guruhi"})]}),e.jsxs("div",{className:"flex justify-between items-baseline gap-1",children:[e.jsx("span",{className:"font-bold text-black shrink-0 text-[11.5px]",children:"To'lov oyi:"}),e.jsx("span",{className:"font-black text-black text-right text-[12px]",children:o.month})]}),e.jsxs("div",{className:"flex justify-between items-baseline gap-1",children:[e.jsx("span",{className:"font-bold text-black shrink-0 text-[11.5px]",children:"Qabul qildi:"}),e.jsx("span",{className:"font-black text-black text-right text-[12px] break-words",children:o.adminName||"Admin"})]})]}),e.jsx("div",{className:"border-b-[1.5px] border-dashed border-black my-1.5"}),e.jsxs("div",{className:"flex justify-between items-baseline py-1 px-0.5",children:[e.jsx("span",{className:"text-[13.5px] font-black uppercase text-black",children:"JAMI:"}),e.jsxs("span",{className:"text-[16.5px] font-black text-black",children:[p(o.amount)," UZS"]})]}),e.jsx("div",{className:"border-b-[1.5px] border-dashed border-black my-1.5"}),e.jsxs("div",{className:"text-center pt-1 text-black leading-tight",children:[e.jsx("p",{className:"font-extrabold text-[11px]",children:"To'lovingiz uchun rahmat!"}),e.jsx("p",{className:"text-[9px] font-bold text-black/80 mt-0.5",children:"Rasmiy to'lov hujjati"})]})]})}),e.jsxs("div",{className:"flex items-start gap-2 p-2.5 bg-slate-800/60 rounded-lg text-slate-400 text-[11px] leading-relaxed border border-slate-700/50",children:[e.jsx(Ze,{className:"w-4 h-4 text-brand-400 shrink-0 mt-0.5"}),e.jsxs("span",{children:["Qog'oz ortiqcha cho'zilib ketmasligi uchun printer oynasida ",e.jsx("strong",{children:"More settings > Headers and footers"})," belgisi o'chiq ekanligiga ishonch hosil qiling."]})]}),e.jsxs("div",{className:"flex items-center justify-between pt-1",children:[e.jsx(v,{variant:"outline",onClick:u,children:"Yopish"}),e.jsx(v,{onClick:x,leftIcon:e.jsx(re,{className:"w-4 h-4"}),children:"Chop etish (58mm)"})]})]}),e.jsx("style",{children:`
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
      `})]})},ht=()=>{var ve;const{user:h,isDirector:u}=Fe(),{success:o,error:S}=Ge(),[x,D]=s.useState("control"),[q,X]=s.useState([]),[b,V]=s.useState([]),[f,ee]=s.useState([]),[te,L]=s.useState([]),[n,N]=s.useState([]),[C,I]=s.useState(!0),[M,$]=s.useState(!1),[g,Ie]=s.useState(""),[d,ie]=s.useState(new Date().toISOString().slice(0,7)),[se,Pe]=s.useState("all"),[Q,Te]=s.useState("all"),[B,Ae]=s.useState("all"),[Oe,P]=s.useState(!1),[T,E]=s.useState(""),[R,F]=s.useState(""),[oe,A]=s.useState(5e5),[de,ze]=s.useState(new Date().toISOString().slice(0,10)),[ce,xe]=s.useState("PAID"),[me,he]=s.useState(""),[De,ue]=s.useState(!1),[O,z]=s.useState(""),[Le,G]=s.useState(!1),[pe,U]=s.useState(null),[i,K]=s.useState(null),[Me,be]=s.useState(!1),H=async()=>{try{I(!0);const[t,a,l,r]=await Promise.all([W.getPayments().catch(()=>[]),Ke.getAllUsers("","all",300).catch(()=>[]),Ue.getGroups().catch(()=>[]),He.getAllTeachers().catch(()=>[])]);X(t);const m=a.filter(c=>c.role==="student"||c.role==="user"||!c.role);V(m),ee(l.filter(c=>c.status==="active"||!c.status)),L(r)}catch(t){console.warn("Payments loadData error:",t)}finally{I(!1)}},Z=async()=>{try{$(!0);const t=await W.getStudentPaymentStatusByMonth(d,se);N(t.items)}catch(t){console.warn("loadStudentPaymentControl error:",t)}finally{$(!1)}};s.useEffect(()=>{H();const t=()=>{H(),Z()};return window.addEventListener("finance_updated",t),()=>window.removeEventListener("finance_updated",t)},[]),s.useEffect(()=>{Z()},[d,se]);const $e=t=>{E(t.studentId),F(t.groupId),A(t.debtAmount>0?t.debtAmount:t.monthlyFee),xe("PAID"),he(`${d} oyi uchun to'lov`),P(!0)},Qe=async t=>{if(t.preventDefault(),!T||!R){S("O'quvchi va guruhni tanlang");return}const a=b.find(r=>r.uid===T),l=f.find(r=>r.groupId===R);try{ue(!0);const r=await W.recordPayment({studentId:T,studentName:(a==null?void 0:a.displayName)||"O'quvchi",groupId:R,groupName:(l==null?void 0:l.name)||"",subjectId:(l==null?void 0:l.subjectId)||"",amount:Number(oe),month:d,paymentDate:de,adminId:(h==null?void 0:h.uid)||"admin",adminName:(h==null?void 0:h.displayName)||"Administrator",status:ce,note:me});o("To'lov muvaffaqiyatli qabul qilindi!"),P(!1),z(""),H(),Z(),U(r)}catch(r){S(r.message||"To'lovni saqlashda xatolik")}finally{ue(!1)}},Be=async()=>{if(i)try{be(!0),await W.deletePayment(i.paymentId),o("To'lov muvaffaqiyatli o'chirildi!"),K(null),H(),Z()}catch(t){S(t.message||"To'lovni o'chirishda xatolik yuz berdi")}finally{be(!1)}},y=s.useMemo(()=>q.filter(t=>{var c,Ne,ye,we;const a=t.month?t.month.slice(0,7):(c=t.paymentDate)==null?void 0:c.slice(0,7),l=!g||((Ne=t.studentName)==null?void 0:Ne.toLowerCase().includes(g.toLowerCase()))||((ye=t.receiptNumber)==null?void 0:ye.toLowerCase().includes(g.toLowerCase()))||((we=t.groupName)==null?void 0:we.toLowerCase().includes(g.toLowerCase())),r=!d||a===d,m=Q==="all"||t.status===Q;return l&&r&&m}),[q,g,d,Q]),fe=s.useMemo(()=>n.filter(t=>{const a=g.toLowerCase().trim(),l=!a||t.studentName.toLowerCase().includes(a)||t.studentPhone&&t.studentPhone.includes(a)||t.groupName.toLowerCase().includes(a)||t.teacherName.toLowerCase().includes(a),r=B==="all"||t.status===B;return l&&r}),[n,g,B]),ae=s.useMemo(()=>n.filter(t=>t.status==="PAID").length,[n]),ge=s.useMemo(()=>n.filter(t=>t.status==="DEBT"||t.status==="PARTIAL").length,[n]),Y=n.length,Ee=s.useMemo(()=>y.filter(t=>t.status==="PAID"&&Number(t.amount)>0).reduce((t,a)=>t+Number(a.amount),0),[y]),Re=s.useMemo(()=>n.reduce((t,a)=>t+a.debtAmount,0),[n]),je=s.useMemo(()=>{if(!O.trim())return b.slice(0,8);const t=O.toLowerCase().trim();return b.filter(a=>{var l,r,m;return((l=a.displayName)==null?void 0:l.toLowerCase().includes(t))||((r=a.phoneNumber)==null?void 0:r.toLowerCase().includes(t))||((m=a.login)==null?void 0:m.toLowerCase().includes(t))}).slice(0,10)},[b,O]),w=s.useMemo(()=>b.find(t=>t.uid===T),[b,T]);return e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center justify-between gap-4",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(_,{className:"w-7 h-7 text-emerald-400"}),e.jsx("h1",{className:"text-2xl font-black tracking-tight text-white",children:"To'lovlar & Kassa Boshqaruvi"})]}),e.jsx("p",{className:"text-xs text-slate-400 mt-1",children:"O'quvchilar to'lovlarini qabul qilish, to'lov qilgan va qarzdorlarni nazorat qilish hamda cheklar chiqarish"})]}),e.jsx(v,{onClick:()=>{var t,a;E(""),F(((t=f[0])==null?void 0:t.groupId)||""),A(((a=f[0])==null?void 0:a.monthlyPrice)||5e5),z(""),P(!0)},leftIcon:e.jsx(Se,{className:"w-4 h-4"}),children:"Yangi to'lov qabul qilish"})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-4",children:[e.jsxs(j,{className:"p-5 bg-gradient-to-br from-emerald-950/40 to-slate-900 border-emerald-500/20",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-xs font-bold text-slate-400",children:u?`Jami Tushum (${d})`:`To'lov Qilgan O'quvchilar (${d})`}),e.jsx("div",{className:"p-2 rounded-xl bg-emerald-500/10 text-emerald-400",children:u?e.jsx(Ye,{className:"w-5 h-5"}):e.jsx(ne,{className:"w-5 h-5"})})]}),e.jsx("h3",{className:"text-2xl font-black text-white mt-2",children:u?e.jsxs(e.Fragment,{children:[p(Ee)," ",e.jsx("span",{className:"text-xs font-semibold text-emerald-400",children:"UZS"})]}):e.jsxs(e.Fragment,{children:[ae," ",e.jsx("span",{className:"text-xs font-semibold text-emerald-400",children:"nafar"})]})}),e.jsxs("p",{className:"text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1",children:[e.jsx(ne,{className:"w-3.5 h-3.5"}),u?`${ae} nafar o'quvchi to'liq to'lagan`:"To'lovni to'liq bajargan o'quvchilar"]})]}),e.jsxs(j,{className:"p-5 bg-gradient-to-br from-rose-950/40 to-slate-900 border-rose-500/20",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-xs font-bold text-slate-400",children:u?`Qarzdorlik Qoldig'i (${d})`:`Qarzdor O'quvchilar (${d})`}),e.jsx("div",{className:"p-2 rounded-xl bg-rose-500/10 text-rose-400",children:e.jsx(We,{className:"w-5 h-5"})})]}),e.jsx("h3",{className:"text-2xl font-black text-white mt-2",children:u?e.jsxs(e.Fragment,{children:[p(Re)," ",e.jsx("span",{className:"text-xs font-semibold text-rose-400",children:"UZS"})]}):e.jsxs(e.Fragment,{children:[ge," ",e.jsx("span",{className:"text-xs font-semibold text-rose-400",children:"nafar"})]})}),e.jsx("p",{className:"text-[11px] text-rose-400/80 mt-1 flex items-center gap-1",children:u?`${ge} nafar qarzdor o'quvchi summasi`:"Ushbu oy uchun to'lovi kutilayotganlar"})]}),e.jsxs(j,{className:"p-5 bg-slate-900 border-slate-800",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-xs font-bold text-slate-400",children:x==="control"?"Guruhlardagi Jami O'quvchilar":"Rasmiylashtirilgan Cheklar"}),e.jsx("div",{className:"p-2 rounded-xl bg-slate-800 text-slate-400",children:x==="control"?e.jsx(Je,{className:"w-5 h-5"}):e.jsx(_,{className:"w-5 h-5"})})]}),e.jsx("h3",{className:"text-2xl font-black text-white mt-2",children:x==="control"?e.jsxs(e.Fragment,{children:[Y," ",e.jsx("span",{className:"text-xs font-semibold text-slate-400",children:"nafar"})]}):e.jsxs(e.Fragment,{children:[y.length," ",e.jsx("span",{className:"text-xs font-semibold text-slate-400",children:"ta"})]})}),e.jsx("p",{className:"text-[11px] text-slate-400 mt-1",children:x==="control"?`To'lov qamrovi: ${Y>0?Math.round(ae/Y*100):0}%`:"Shu oy bo'yicha kvitansiyalar soni"})]})]}),e.jsxs("div",{className:"flex items-center gap-2 border-b border-slate-800 pb-2",children:[e.jsxs("button",{onClick:()=>D("control"),className:`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${x==="control"?"bg-brand-600 text-white shadow-lg shadow-brand-500/20":"text-slate-400 hover:text-white hover:bg-slate-800/60"}`,children:[e.jsx(qe,{className:"w-4 h-4"}),e.jsx("span",{children:"O'quvchilar To'lov Nazorati"}),e.jsx("span",{className:"px-1.5 py-0.5 rounded-md text-[10px] bg-slate-900/60 font-black",children:Y})]}),e.jsxs("button",{onClick:()=>D("history"),className:`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${x==="history"?"bg-brand-600 text-white shadow-lg shadow-brand-500/20":"text-slate-400 hover:text-white hover:bg-slate-800/60"}`,children:[e.jsx(_,{className:"w-4 h-4"}),e.jsx("span",{children:"To'lov Cheklari & Kassa Tarixi"}),e.jsx("span",{className:"px-1.5 py-0.5 rounded-md text-[10px] bg-slate-900/60 font-black",children:y.length})]})]}),e.jsxs(j,{className:"p-4 bg-slate-900/60 border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3",children:[e.jsxs("div",{className:"relative flex-1",children:[e.jsx(Ce,{className:"w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"}),e.jsx("input",{type:"text",placeholder:x==="control"?"O'quvchi ismi, telefoni, guruh yoki o'qituvchi bo'yicha qidirish...":"O'quvchi ismi yoki kvitansiya raqami (#FM-...) bo'yicha qidirish...",value:g,onChange:t=>Ie(t.target.value),className:"w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[e.jsxs("div",{className:"flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 rounded-xl px-2.5 py-1.5",children:[e.jsx(_e,{className:"w-3.5 h-3.5 text-slate-400"}),e.jsx("input",{type:"month",value:d,onChange:t=>ie(t.target.value),className:"bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer"})]}),e.jsxs("div",{className:"flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 rounded-xl px-2.5 py-1.5",children:[e.jsx(Xe,{className:"w-3.5 h-3.5 text-slate-400"}),e.jsxs("select",{value:se,onChange:t=>Pe(t.target.value),className:"bg-transparent text-xs text-white font-semibold focus:outline-none cursor-pointer",children:[e.jsx("option",{value:"all",className:"bg-slate-900 text-white",children:"Barcha O'qituvchilar"}),te.map(t=>e.jsx("option",{value:t.uid,className:"bg-slate-900 text-white",children:t.displayName||"Ustoz"},t.uid))]})]}),x==="control"?e.jsxs("select",{value:B,onChange:t=>Ae(t.target.value),className:"bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-brand-500 cursor-pointer",children:[e.jsx("option",{value:"all",children:"Barcha Holatlar"}),e.jsx("option",{value:"PAID",children:"To'lov Qilganlar (To'liq)"}),e.jsx("option",{value:"DEBT",children:"Qarzdorlar (To'lamaganlar)"}),e.jsx("option",{value:"PARTIAL",children:"Qisman To'laganlar"})]}):e.jsxs("select",{value:Q,onChange:t=>Te(t.target.value),className:"bg-slate-800/80 border border-slate-700/60 rounded-xl text-xs text-white px-3 py-2 focus:outline-none focus:border-brand-500 cursor-pointer",children:[e.jsx("option",{value:"all",children:"Barcha holatlar"}),e.jsx("option",{value:"PAID",children:"To'langan (PAID)"}),e.jsx("option",{value:"PARTIAL",children:"Qisman (PARTIAL)"}),e.jsx("option",{value:"DEBT",children:"Qarz (DEBT)"}),e.jsx("option",{value:"CANCELLED",children:"Bekor qilingan"})]})]})]}),x==="control"?M||C?e.jsx("div",{className:"flex justify-center py-20",children:e.jsx(ke,{size:"lg",className:"text-brand-500"})}):fe.length===0?e.jsxs(j,{className:"p-12 text-center bg-slate-900/40 border-slate-800",children:[e.jsx(qe,{className:"w-12 h-12 mx-auto text-slate-600 mb-3"}),e.jsx("h3",{className:"text-base font-bold text-white",children:"O'quvchilar ro'yxati topilmadi"}),e.jsx("p",{className:"text-xs text-slate-400 mt-1 max-w-sm mx-auto",children:"Tanlangan oy, o'qituvchi yoki qidiruv so'rovi bo'yicha hech qanday o'quvchi ma'lumoti topilmadi."})]}):e.jsx(j,{className:"bg-slate-900/80 border-slate-800 overflow-hidden",children:e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"w-full text-left text-xs text-slate-300",children:[e.jsx("thead",{className:"bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800",children:e.jsxs("tr",{children:[e.jsx("th",{className:"p-3.5",children:"O'quvchi"}),e.jsx("th",{className:"p-3.5",children:"Guruh & Fan"}),e.jsx("th",{className:"p-3.5",children:"O'qituvchi"}),e.jsx("th",{className:"p-3.5",children:"Oylik To'lov"}),e.jsx("th",{className:"p-3.5",children:"Shu Oy To'langan"}),e.jsx("th",{className:"p-3.5",children:"Qarz Qoldig'i"}),e.jsx("th",{className:"p-3.5",children:"Holat"}),e.jsx("th",{className:"p-3.5 text-right",children:"Amal"})]})}),e.jsx("tbody",{className:"divide-y divide-slate-800/60",children:fe.map((t,a)=>{const l=t.status==="PAID";t.status;const r=t.status==="PARTIAL";return e.jsxs("tr",{className:"hover:bg-slate-800/40 transition-colors",children:[e.jsx("td",{className:"p-3.5",children:e.jsxs("div",{className:"flex items-center gap-2.5",children:[e.jsx("div",{className:"w-8 h-8 rounded-xl bg-slate-800 text-brand-400 flex items-center justify-center font-bold text-xs border border-slate-700",children:t.studentName.charAt(0)}),e.jsxs("div",{children:[e.jsx("p",{className:"font-bold text-white",children:t.studentName}),t.studentPhone&&e.jsx("p",{className:"text-[11px] text-slate-400",children:t.studentPhone})]})]})}),e.jsx("td",{className:"p-3.5",children:e.jsx("span",{className:"font-semibold text-slate-200",children:t.groupName})}),e.jsx("td",{className:"p-3.5",children:e.jsx("span",{className:"text-slate-300 font-medium",children:t.teacherName})}),e.jsxs("td",{className:"p-3.5 font-semibold text-white",children:[p(t.monthlyFee)," ",e.jsx("span",{className:"text-[10px] text-slate-400",children:"so'm"})]}),e.jsx("td",{className:"p-3.5",children:e.jsxs("span",{className:"font-bold text-emerald-400",children:[p(t.paidAmount)," ",e.jsx("span",{className:"text-[10px] text-slate-400",children:"so'm"})]})}),e.jsx("td",{className:"p-3.5",children:t.debtAmount>0?e.jsxs("span",{className:"font-bold text-rose-400",children:[p(t.debtAmount)," ",e.jsx("span",{className:"text-[10px] text-slate-400",children:"so'm"})]}):e.jsx("span",{className:"text-slate-500 font-medium",children:"0 so'm"})}),e.jsx("td",{className:"p-3.5",children:e.jsx("span",{className:`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border ${l?"bg-emerald-500/10 text-emerald-400 border-emerald-500/30":r?"bg-sky-500/10 text-sky-400 border-sky-500/30":"bg-rose-500/10 text-rose-400 border-rose-500/30"}`,children:l?"To'langan":r?"Qisman":"Qarzdor"})}),e.jsx("td",{className:"p-3.5 text-right",children:e.jsx("div",{className:"flex items-center justify-end gap-1.5",children:l?e.jsxs("button",{onClick:()=>{const m=q.find(c=>c.studentId===t.studentId&&c.groupId===t.groupId&&c.status==="PAID");m&&U(m)},className:"inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-brand-300 hover:bg-brand-600 hover:text-white transition-all border border-slate-700/60",title:"Kvitansiyani ko'rish",children:[e.jsx(re,{className:"w-3.5 h-3.5"})," Chek"]}):e.jsx(v,{size:"sm",variant:"primary",onClick:()=>$e(t),leftIcon:e.jsx(Se,{className:"w-3.5 h-3.5"}),children:"To'lov olish"})})})]},`${t.studentId}_${t.groupId}_${a}`)})})]})})}):C?e.jsx("div",{className:"flex justify-center py-20",children:e.jsx(ke,{size:"lg",className:"text-brand-500"})}):y.length===0?e.jsxs(j,{className:"p-12 text-center bg-slate-900/40 border-slate-800",children:[e.jsx(_,{className:"w-12 h-12 mx-auto text-slate-600 mb-3"}),e.jsx("h3",{className:"text-base font-bold text-white",children:"To'lovlar topilmadi"}),e.jsx("p",{className:"text-xs text-slate-400 mt-1 max-w-sm mx-auto",children:"Tanlangan oy yoki qidiruv so'rovi bo'yicha hech qanday to'lov mavjud emas."})]}):e.jsx(j,{className:"bg-slate-900/80 border-slate-800 overflow-hidden",children:e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"w-full text-left text-xs text-slate-300",children:[e.jsx("thead",{className:"bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800",children:e.jsxs("tr",{children:[e.jsx("th",{className:"p-3.5",children:"Kvitansiya"}),e.jsx("th",{className:"p-3.5",children:"O'quvchi"}),e.jsx("th",{className:"p-3.5",children:"Guruh"}),e.jsx("th",{className:"p-3.5",children:"Oy / Sana"}),e.jsx("th",{className:"p-3.5",children:"Summa"}),e.jsx("th",{className:"p-3.5",children:"Holat"}),e.jsx("th",{className:"p-3.5 text-right",children:"Amallar"})]})}),e.jsx("tbody",{className:"divide-y divide-slate-800/60",children:y.map(t=>e.jsxs("tr",{className:"hover:bg-slate-800/40 transition-colors",children:[e.jsx("td",{className:"p-3.5",children:e.jsx("span",{className:"font-mono font-bold text-brand-400",children:t.receiptNumber})}),e.jsx("td",{className:"p-3.5",children:e.jsx("p",{className:"font-bold text-white",children:t.studentName})}),e.jsx("td",{className:"p-3.5",children:e.jsx("span",{className:"text-slate-300 font-medium",children:t.groupName||"Guruh"})}),e.jsxs("td",{className:"p-3.5",children:[e.jsx("p",{className:"font-semibold text-white",children:t.month}),e.jsx("p",{className:"text-[11px] text-slate-400",children:t.paymentDate})]}),e.jsx("td",{className:"p-3.5",children:e.jsxs("span",{className:"font-bold text-white text-sm",children:[p(t.amount)," ",e.jsx("span",{className:"text-[10px] text-slate-400",children:"so'm"})]})}),e.jsx("td",{className:"p-3.5",children:e.jsx("span",{className:`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${t.status==="PAID"?"bg-emerald-500/10 text-emerald-400 border-emerald-500/30":t.status==="PARTIAL"?"bg-sky-500/10 text-sky-400 border-sky-500/30":t.status==="DEBT"?"bg-rose-500/10 text-rose-400 border-rose-500/30":"bg-slate-500/10 text-slate-400 border-slate-500/30"}`,children:t.status})}),e.jsx("td",{className:"p-3.5 text-right",children:e.jsxs("div",{className:"flex items-center justify-end gap-1.5",children:[e.jsxs("button",{onClick:()=>U(t),className:"inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-brand-300 hover:bg-brand-600 hover:text-white transition-all border border-slate-700/60",title:"Kvitansiyani chop etish",children:[e.jsx(re,{className:"w-3.5 h-3.5"})," Chop etish"]}),e.jsx("button",{onClick:()=>K(t),className:"p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors",title:"To'lovni o'chirish",children:e.jsx(Ve,{className:"w-4 h-4"})})]})})]},t.paymentId))})]})})}),e.jsx(le,{isOpen:Oe,onClose:()=>P(!1),title:"Yangi To'lov Qabul Qilish",children:e.jsxs("form",{onSubmit:Qe,className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-semibold text-slate-300 mb-1",children:"O'quvchini qidirish va tanlash"}),w?e.jsxs("div",{className:"flex items-center justify-between p-3 bg-slate-800/90 border border-brand-500/40 rounded-xl",children:[e.jsxs("div",{className:"flex items-center gap-2.5",children:[e.jsx("div",{className:"w-9 h-9 rounded-xl bg-brand-600/30 text-brand-400 flex items-center justify-center font-bold text-sm border border-brand-500/30",children:((ve=w.displayName)==null?void 0:ve.charAt(0))||"O"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-bold text-white",children:w.displayName}),e.jsxs("p",{className:"text-[11px] text-slate-400",children:[w.phoneNumber||"Telefon raqamsiz"," ",w.login?`(@${w.login})`:""]})]})]}),e.jsx("button",{type:"button",onClick:()=>{E(""),z(""),G(!0)},className:"px-2.5 py-1 text-xs text-brand-400 hover:text-white bg-slate-700/60 hover:bg-brand-600 rounded-lg transition-all",children:"O'zgartirish"})]}):e.jsxs("div",{className:"relative",children:[e.jsxs("div",{className:"relative",children:[e.jsx(Ce,{className:"w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"}),e.jsx("input",{type:"text",placeholder:"Ism, telefon raqami yoki login bo'yicha qidiring...",value:O,onChange:t=>{z(t.target.value),G(!0)},onFocus:()=>G(!0),className:"w-full pl-9 pr-8 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500"}),O&&e.jsx("button",{type:"button",onClick:()=>z(""),className:"absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white",children:e.jsx(et,{className:"w-3.5 h-3.5"})})]}),Le&&je.length>0&&e.jsx("div",{className:"absolute z-50 left-0 right-0 mt-1 max-h-52 overflow-y-auto bg-slate-900 border border-slate-700 rounded-xl shadow-2xl divide-y divide-slate-800",children:je.map(t=>{var a;return e.jsxs("button",{type:"button",onClick:()=>{E(t.uid),G(!1);const l=f.find(r=>Array.isArray(r.studentIds)&&r.studentIds.includes(t.uid)||Array.isArray(t.enrolledGroups)&&t.enrolledGroups.some(m=>m.groupId===r.groupId));l&&(F(l.groupId),l.monthlyPrice&&A(l.monthlyPrice))},className:"w-full text-left p-2.5 hover:bg-slate-800 flex items-center justify-between transition-colors group",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"w-7 h-7 rounded-lg bg-slate-800 text-brand-400 flex items-center justify-center font-bold text-xs group-hover:bg-brand-600 group-hover:text-white transition-colors",children:((a=t.displayName)==null?void 0:a.charAt(0))||"O"}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-semibold text-white",children:t.displayName}),e.jsx("p",{className:"text-[10px] text-slate-400",children:t.phoneNumber||"Raqamsiz"})]})]}),e.jsx("span",{className:"text-[10px] text-brand-400 font-bold group-hover:underline",children:"Tanlash →"})]},t.uid)})})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-semibold text-slate-300 mb-1",children:"Guruh"}),e.jsxs("select",{value:R,onChange:t=>{const a=t.target.value;F(a);const l=f.find(r=>r.groupId===a);l!=null&&l.monthlyPrice&&A(l.monthlyPrice)},className:"w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500",required:!0,children:[e.jsx("option",{value:"",children:"Guruhni tanlang"}),f.map(t=>e.jsxs("option",{value:t.groupId,children:[t.name," (",p(t.monthlyPrice||5e5)," UZS)"]},t.groupId))]})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-3",children:[e.jsx(J,{label:"To'lov summasi (UZS)",type:"number",value:oe,onChange:t=>A(Number(t.target.value)),required:!0}),e.jsx(J,{label:"Qaysi oy uchun",type:"month",value:d,onChange:t=>ie(t.target.value),required:!0})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-3",children:[e.jsx(J,{label:"To'lov qabul qilingan sana",type:"date",value:de,onChange:t=>ze(t.target.value),required:!0}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-semibold text-slate-300 mb-1",children:"To'lov holati"}),e.jsxs("select",{value:ce,onChange:t=>xe(t.target.value),className:"w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500",children:[e.jsx("option",{value:"PAID",children:"To'liq to'landi (PAID)"}),e.jsx("option",{value:"PARTIAL",children:"Qisman to'lov (PARTIAL)"}),e.jsx("option",{value:"DEBT",children:"Qarzdorlik (DEBT)"})]})]})]}),e.jsx(J,{label:"Qo'shimcha izoh (ixtiyoriy)",placeholder:"Masalan: Naqd yoki karta orqali",value:me,onChange:t=>he(t.target.value)}),e.jsxs("div",{className:"flex justify-end gap-2 pt-2",children:[e.jsx(v,{type:"button",variant:"outline",onClick:()=>P(!1),children:"Bekor qilish"}),e.jsx(v,{type:"submit",isLoading:De,children:"To'lovni tasdiqlash"})]})]})}),e.jsx(tt,{isOpen:!!pe,onClose:()=>U(null),payment:pe}),e.jsx(le,{isOpen:!!i,onClose:()=>K(null),title:"To'lovni O'chirish",children:e.jsxs("div",{className:"space-y-4 text-xs",children:[e.jsx("p",{className:"text-slate-300",children:"Rostdan ham ushbu to'lov yozuvini o'chirmoqchimisiz?"}),e.jsxs("div",{className:"p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-slate-400",children:"O'quvchi:"}),e.jsx("span",{className:"font-bold text-white text-sm",children:i==null?void 0:i.studentName})]}),e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-slate-400",children:"Guruh:"}),e.jsx("span",{className:"font-semibold text-slate-200",children:(i==null?void 0:i.groupName)||"Guruh"})]}),e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-slate-400",children:"Summa:"}),e.jsxs("span",{className:"font-bold text-emerald-400 text-sm",children:[p((i==null?void 0:i.amount)||0)," UZS"]})]}),e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-slate-400",children:"Kvitansiya raqami:"}),e.jsx("span",{className:"font-mono text-brand-400 font-bold",children:i==null?void 0:i.receiptNumber})]}),e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-slate-400",children:"Sana / Oy:"}),e.jsxs("span",{className:"text-slate-300",children:[i==null?void 0:i.paymentDate," (",i==null?void 0:i.month,")"]})]})]}),e.jsx("p",{className:"text-[11px] text-rose-400 bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20",children:"⚠️ Ushbu to'lov o'chirilgach, markaz tushumlari hisoboti va ustozlar maoshidagi guruh tushumi ham shunga mos yangilanadi."}),e.jsxs("div",{className:"flex justify-end gap-2 pt-2",children:[e.jsx(v,{variant:"outline",onClick:()=>K(null),children:"Bekor qilish"}),e.jsx(v,{variant:"danger",onClick:Be,isLoading:Me,children:"To'lovni O'chirish"})]})]})})]})};export{ht as AdminPaymentsPage,ht as default};
