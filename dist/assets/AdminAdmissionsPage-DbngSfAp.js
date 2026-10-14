import{n as ct,o as A,e as f,M as dt,N as xt,O as mt,P as ht,Q as pt,R as ut,d as J,g as Ue,y as U,t as v,p as bt,G as Re,j as e,B as h,f as ee,U as gt,u as ft,a as jt,S as vt}from"./index-SEQo181y.js";import{r as o}from"./vendor-react-D785DYxF.js";import{g as Ke}from"./groupService-CMX4Ffe7.js";import{s as Nt}from"./subjectService-EWWUUPkQ.js";import{C as E}from"./Card-CfjDK9du.js";import{I as k}from"./Input-BodNwmEX.js";import{M as H}from"./Modal-LyYLgQ6q.js";import{B as wt}from"./Badge-BGDzVgto.js";import{aB as de,Y as kt,c as Q,N as te,I as yt,a5 as xe,aE as At,k as St,j as Qe,a0 as Ct,ai as qt,B as zt,G as $e,ae as Ve,af as Ge,ak as Pt,ah as It}from"./vendor-icons-DefnnMfA.js";const Mt=a=>{const i=a.trim().toLowerCase().replace(/['`ʻ’]/g,"").replace(/sh/g,"sh").replace(/ch/g,"ch").replace(/[^a-z0-9]/gi,"_").split("_").filter(Boolean)[0]||"talaba",s=Math.floor(1e3+Math.random()*9e3),l=`${i}_${s}`,r=`talaba${Math.floor(1e3+Math.random()*9e3)}`;return{login:l,password:r}};let P=null;async function Ot(){try{const a=A(f,"users","system_admissions"),i=await Re(a);if(i.exists()){const s=i.data();return(s==null?void 0:s.list)||[]}}catch(a){console.warn("Could not read system_admissions doc:",a==null?void 0:a.message)}return[]}function $(a){const i=Array.isArray(a)?[]:{};for(const[s,l]of Object.entries(a))l!==void 0&&(l!==null&&typeof l=="object"&&!(l instanceof Date)&&!l.toMillis?i[s]=$(l):i[s]=l);return i}async function ce(a){var r;const i=A(f,"users","system_admissions");let s=[];try{const d=await Re(i);d.exists()&&(s=((r=d.data())==null?void 0:r.list)||[])}catch{}const n=a(s).map(d=>$(d));return await U(i,{list:n,updatedAt:v()},{merge:!0}),P={list:n,time:Date.now()},n}const T={async getAdmissions(a="all",i=""){let s=[];if(P&&Date.now()-P.time<3e4)s=P.list;else{try{const n=await Ue(J(f,"admissions"));n.empty||(s=n.docs.map(r=>({...r.data(),id:r.id,status:r.data().status||"new"})))}catch{}const l=await Ot();if(l.length>0){const n=new Map;s.forEach(r=>n.set(r.id,r)),l.forEach(r=>n.set(r.id,r)),s=Array.from(n.values())}P={list:s,time:Date.now()}}if(a&&a!=="all"&&(s=s.filter(l=>l.status===a)),i.trim()){const l=i.toLowerCase().trim();s=s.filter(n=>{var r,d,m,b,N;return((r=n.fullName)==null?void 0:r.toLowerCase().includes(l))||((d=n.phoneNumber)==null?void 0:d.toLowerCase().includes(l))||((m=n.parentPhone)==null?void 0:m.toLowerCase().includes(l))||((b=n.interestedSubject)==null?void 0:b.toLowerCase().includes(l))||((N=n.login)==null?void 0:N.toLowerCase().includes(l))})}return s.sort((l,n)=>{var m,b;const r=(m=l.createdAt)!=null&&m.toMillis?l.createdAt.toMillis():l.createdAt?new Date(l.createdAt).getTime():0;return((b=n.createdAt)!=null&&b.toMillis?n.createdAt.toMillis():n.createdAt?new Date(n.createdAt).getTime():0)-r}),s},async getAdmissionById(a){if(P){const s=P.list.find(l=>l.id===a);if(s)return s}return(await this.getAdmissions()).find(s=>s.id===a)||null},async createAdmission(a){const i=`adm_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,s=new Date().toISOString(),l={id:i,fullName:a.fullName.trim(),phoneNumber:a.phoneNumber.trim(),parentPhone:a.parentPhone?a.parentPhone.trim():"",age:a.age||"",birthDate:a.birthDate||"",interestedSubject:a.interestedSubject||"",subjectId:a.subjectId||"",preferredTime:a.preferredTime||"farqi_yoq",source:a.source||"boshqa",notes:a.notes||"",status:a.status||"new",createdAt:s,updatedAt:s};await ce(n=>[l,...n.filter(r=>r.id!==i)]);try{await U(A(f,"admissions",i),{...l,createdAt:v(),updatedAt:v()})}catch{}return l},async updateAdmission(a,i){const s=new Date().toISOString(),l=$(i);await ce(n=>n.map(r=>r.id===a?{...r,...l,updatedAt:s}:r));try{Object.keys(l).length>0&&await bt(A(f,"admissions",a),{...l,updatedAt:v()})}catch{}},async updateStatus(a,i,s){if(await this.updateAdmission(a,{status:i}),s)try{const l=A(J(f,"audit_logs"));await U(l,{logId:l.id,adminUid:s,action:`ADMISSION_STATUS_${i.toUpperCase()}`,targetCollection:"admissions",targetDocumentId:a,changes:{status:i},createdAt:v()})}catch{}},async activateAdmission(a,i){const s=await this.getAdmissionById(a);if(!s)throw new Error("Qabul hujjati topilmadi");const l=i.login.trim().toLowerCase().replace(/[^a-z0-9_]/g,""),n=`${l}@fargoniy.uz`,r=i.password.trim();if(!l||l.length<3)throw new Error("Login kamida 3 ta belgidan iborat bo'lishi kerak");if(!r||r.length<6)throw new Error("Parol kamida 6 ta belgidan iborat bo'lishi kerak");let d=`student_${Date.now()}`;try{const p="StudentCreatorApp",S=dt().find(M=>M.name===p)||xt(mt,p),g=ht(S);d=(await pt(g,n,r)).user.uid,await ut(g)}catch(p){if(console.warn("Isolated auth registration note:",p),p.code==="auth/email-already-in-use")try{const j=J(f,"users"),g=(await Ue(j)).docs.find(I=>I.data().email===n);g&&(d=g.id)}catch{}}const m={uid:d,displayName:s.fullName,email:n,login:l,phoneNumber:s.phoneNumber,role:"student",status:"active",coinBalance:50,totalCorrectAnswers:0,testsCompleted:0,educationPlace:s.notes||"Farg'oniy Ta'lim Markazi",isCenterStudent:!0,photoURL:null,groupIds:i.groupId?[i.groupId]:[],createdAt:v(),updatedAt:v(),lastActiveAt:v()};if(await U(A(f,"users",d),$(m),{merge:!0}),i.groupId)try{await Ke.addStudentToGroup(i.groupId,d)}catch(p){console.warn("Could not auto-add to group:",p)}const b=new Date().toISOString(),N={status:"active",assignedStudentUid:d,login:l,plainPassword:r,assignedGroupId:i.groupId||"",assignedGroupName:i.groupName||"",activatedAt:b,activatedBy:i.currentAdminUid||"admin"};await this.updateAdmission(a,N);try{const p=A(J(f,"audit_logs")),j=$({logId:p.id,adminUid:i.currentAdminUid||"admin",action:"ADMISSION_ACTIVATED",targetCollection:"admissions",targetDocumentId:a,changes:{fullName:s.fullName,studentUid:d,login:l,groupId:i.groupId||""},createdAt:v()});await U(p,j)}catch{}return{studentUid:d,login:l,password:r}},async deleteAdmission(a){await ce(i=>i.filter(s=>s.id!==a));try{await ct(A(f,"admissions",a))}catch{}}};function y(a){return(a||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}const Lt=({admission:a,onClose:i})=>{const[s,l]=o.useState("thermal"),n="www.fargoniymaktabi.uz",r=()=>{var q;const b=y(a.fullName||"O'quvchi"),N=y(a.phoneNumber||"-"),p=y(a.parentPhone||""),j=y(a.interestedSubject||"Umumiy ta'lim"),S=y(a.assignedGroupName||""),g=y(a.login||"login"),I=y(a.plainPassword||"******"),M=y(a.id?a.id.slice(-6).toUpperCase():Date.now().toString().slice(-6)),O=ee(a.createdAt),ae=`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Qabul_Cheki_${M}</title>
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
      <span>Qabul №: <span class="meta-num">${M}</span></span>
      <span>${O}</span>
    </div>

    <div class="solid-divider"></div>

    <!-- O'quvchi ma'lumotlari -->
    <table class="data-table">
      <tr>
        <td class="label-col">O'quvchi</td>
        <td class="colon-col">:</td>
        <td class="val-col">${b}</td>
      </tr>
      <tr>
        <td class="label-col">Telefon</td>
        <td class="colon-col">:</td>
        <td class="val-col">${N}</td>
      </tr>
      ${p?`
      <tr>
        <td class="label-col">Ota-ona</td>
        <td class="colon-col">:</td>
        <td class="val-col">${p}</td>
      </tr>`:""}
      <tr>
        <td class="label-col">Fan</td>
        <td class="colon-col">:</td>
        <td class="val-col">${j}</td>
      </tr>
      ${S?`
      <tr>
        <td class="label-col">Guruh</td>
        <td class="colon-col">:</td>
        <td class="val-col">${S}</td>
      </tr>`:""}
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
          <td class="val-col cred-value-bold">${g}</td>
        </tr>
        <tr>
          <td class="label-col">Parol</td>
          <td class="colon-col">:</td>
          <td class="val-col cred-value-bold">${I}</td>
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
</html>`,D=document.getElementById("admission-print-frame");D&&D.remove();const x=document.createElement("iframe");x.id="admission-print-frame",x.style.position="fixed",x.style.top="0",x.style.left="0",x.style.width="58mm",x.style.height="100px",x.style.border="none",x.style.opacity="0",x.style.pointerEvents="none",x.style.zIndex="-9999",document.body.appendChild(x);const C=((q=x.contentWindow)==null?void 0:q.document)||x.contentDocument;C?(C.open(),C.write(ae),C.close(),setTimeout(()=>{var F,B;try{(F=x.contentWindow)==null||F.focus(),(B=x.contentWindow)==null||B.print()}catch(V){console.error("Print error:",V),window.print()}finally{setTimeout(()=>{document.body.contains(x)&&document.body.removeChild(x)},3e3)}},200)):window.print()},d=()=>{window.print()},m=a.id?a.id.slice(-6).toUpperCase():Date.now().toString().slice(-6);return e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700 print:hidden",children:[e.jsxs("div",{className:"flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-700 text-xs",children:[e.jsxs("button",{type:"button",onClick:()=>l("thermal"),className:`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${s==="thermal"?"bg-brand-600 text-white shadow":"text-slate-400 hover:text-white"}`,children:[e.jsx(de,{className:"w-3.5 h-3.5"}),"58mm Termal Chek"]}),e.jsxs("button",{type:"button",onClick:()=>l("a4"),className:`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${s==="a4"?"bg-brand-600 text-white shadow":"text-slate-400 hover:text-white"}`,children:[e.jsx(kt,{className:"w-3.5 h-3.5"}),"A4 Guvohnoma"]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[i&&e.jsx(h,{size:"sm",variant:"ghost",onClick:i,children:"Yopish"}),e.jsxs(h,{size:"sm",onClick:s==="thermal"?r:d,className:"bg-brand-600 hover:bg-brand-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-brand-600/30",children:[e.jsx(de,{className:"w-4 h-4"}),s==="thermal"?"Chop etish (58mm)":"A4 Chop etish"]})]})]}),s==="thermal"&&e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex items-center justify-between px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(Q,{className:"w-4 h-4 text-emerald-400 shrink-0"}),e.jsx("span",{className:"font-semibold",children:"Xprinter XP-58 (58mm Qabul cheki)"})]}),e.jsx("span",{className:"text-[11px] bg-emerald-500/20 px-2.5 py-0.5 rounded font-mono font-bold",children:"58mm"})]}),e.jsx("div",{className:"flex justify-center p-4 bg-slate-950/60 rounded-xl border border-slate-800",children:e.jsxs("div",{id:"printable-thermal-admission",className:"w-[58mm] max-w-[58mm] bg-white text-black p-[3mm] rounded shadow-2xl font-sans leading-tight select-none border border-slate-400",style:{width:"58mm",maxWidth:"58mm",boxSizing:"border-box",color:"#000000"},children:[e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"flex justify-center mb-1",children:e.jsx("svg",{width:"38",height:"38",viewBox:"0 0 120 120",fill:"none",children:e.jsxs("g",{transform:"translate(60, 60) rotate(-45) translate(-60, -60)",children:[e.jsx("path",{d:"M16 16H66V34H36V50H60V66H36V104H16V16Z",fill:"#0B3E91"}),e.jsx("path",{d:"M72 16H104V104H44V88H86V72H72V16Z",fill:"#F26522"}),e.jsx("path",{d:"M44 50H68V66H44V50Z",fill:"#F26522"})]})})}),e.jsx("div",{className:"text-[16px] font-black tracking-tight text-black leading-tight",children:"Farg'oniy Maktabi"}),e.jsx("div",{className:"text-[10.5px] font-extrabold uppercase tracking-widest text-black mt-0.5",children:"O'QUV MARKAZI"}),e.jsx("div",{className:"text-[9.5px] italic font-bold text-black mt-0.5",children:"Bilim — kelajak kaliti!"})]}),e.jsx("div",{className:"border-t-[1.5px] border-black my-1.5"}),e.jsx("div",{className:"text-center font-black text-[14.5px] uppercase tracking-wide text-black mb-1",children:"QABUL CHEKI"}),e.jsxs("div",{className:"flex justify-between items-baseline text-[10.5px] font-extrabold text-black",children:[e.jsxs("span",{children:["Qabul №: ",e.jsx("span",{className:"font-black",children:m})]}),e.jsx("span",{children:ee(a.createdAt)})]}),e.jsx("div",{className:"border-t-[1.5px] border-black my-1.5"}),e.jsxs("div",{className:"space-y-1 text-black text-[11px]",children:[e.jsxs("div",{className:"flex items-start",children:[e.jsx("span",{className:"w-[32%] font-bold shrink-0",children:"O'quvchi"}),e.jsx("span",{className:"w-[6%] font-black text-center",children:":"}),e.jsx("span",{className:"w-[62%] font-extrabold break-words pl-0.5",children:a.fullName})]}),e.jsxs("div",{className:"flex items-start",children:[e.jsx("span",{className:"w-[32%] font-bold shrink-0",children:"Telefon"}),e.jsx("span",{className:"w-[6%] font-black text-center",children:":"}),e.jsx("span",{className:"w-[62%] font-extrabold pl-0.5",children:a.phoneNumber})]}),a.parentPhone&&e.jsxs("div",{className:"flex items-start",children:[e.jsx("span",{className:"w-[32%] font-bold shrink-0",children:"Ota-ona"}),e.jsx("span",{className:"w-[6%] font-black text-center",children:":"}),e.jsx("span",{className:"w-[62%] font-extrabold pl-0.5",children:a.parentPhone})]}),e.jsxs("div",{className:"flex items-start",children:[e.jsx("span",{className:"w-[32%] font-bold shrink-0",children:"Fan"}),e.jsx("span",{className:"w-[6%] font-black text-center",children:":"}),e.jsx("span",{className:"w-[62%] font-extrabold break-words pl-0.5",children:a.interestedSubject||"Umumiy ta'lim"})]}),a.assignedGroupName&&e.jsxs("div",{className:"flex items-start",children:[e.jsx("span",{className:"w-[32%] font-bold shrink-0",children:"Guruh"}),e.jsx("span",{className:"w-[6%] font-black text-center",children:":"}),e.jsx("span",{className:"w-[62%] font-extrabold break-words pl-0.5",children:a.assignedGroupName})]})]}),e.jsx("div",{className:"border-t-[1.5px] border-black my-1.5"}),e.jsxs("div",{className:"border-[1.5px] border-black rounded p-1.5 my-1 text-black bg-white",children:[e.jsx("div",{className:"text-[10.5px] font-black uppercase text-center border-b border-dashed border-black pb-1 mb-1 tracking-wider",children:"PLATFORMA MA'LUMOTLARI"}),e.jsxs("div",{className:"space-y-1 text-[11px]",children:[e.jsxs("div",{className:"flex items-center",children:[e.jsx("span",{className:"w-[32%] font-bold shrink-0",children:"Sayt"}),e.jsx("span",{className:"w-[6%] font-black text-center",children:":"}),e.jsx("span",{className:"w-[62%] font-black font-mono text-[10.5px] pl-0.5",children:n})]}),e.jsxs("div",{className:"flex items-center",children:[e.jsx("span",{className:"w-[32%] font-bold shrink-0",children:"Login"}),e.jsx("span",{className:"w-[6%] font-black text-center",children:":"}),e.jsx("span",{className:"w-[62%] font-black font-mono text-[12.5px] pl-0.5",children:a.login||"-"})]}),e.jsxs("div",{className:"flex items-center",children:[e.jsx("span",{className:"w-[32%] font-bold shrink-0",children:"Parol"}),e.jsx("span",{className:"w-[6%] font-black text-center",children:":"}),e.jsx("span",{className:"w-[62%] font-black font-mono text-[13px] pl-0.5",children:a.plainPassword||"******"})]})]})]}),e.jsx("div",{className:"border-t-[1.5px] border-black my-1.5"}),e.jsxs("div",{className:"text-center pt-0.5 text-black",children:[e.jsx("p",{className:"font-extrabold text-[10.5px]",children:"O'qishingizda omad tilaymiz!"}),e.jsxs("div",{className:"flex items-center justify-center gap-1.5 my-1",children:[e.jsx("span",{className:"w-8 h-[1px] bg-black inline-block"}),e.jsx("span",{className:"text-[10px]",children:"♥"}),e.jsx("span",{className:"w-8 h-[1px] bg-black inline-block"})]}),e.jsx("p",{className:"text-[10.5px] font-black font-mono",children:n}),e.jsxs("div",{className:"flex items-center justify-center gap-1 text-[12.5px] font-black mt-1",children:[e.jsx(te,{className:"w-3 h-3 text-black shrink-0 stroke-[2.5]"}),e.jsx("span",{children:"+998 959 252 200"})]}),e.jsx("p",{className:"text-[9px] font-bold text-black my-0.5",children:"yoki"}),e.jsx("div",{className:"text-[12.5px] font-black",children:"+998 558 122 200"})]})]})}),e.jsxs("div",{className:"flex items-start gap-2 p-2.5 bg-slate-800/60 rounded-lg text-slate-400 text-[11px] leading-relaxed border border-slate-700/50",children:[e.jsx(yt,{className:"w-4 h-4 text-brand-400 shrink-0 mt-0.5"}),e.jsxs("span",{children:["Qog'oz toza va qisqa chiqishi uchun printer dialogida ",e.jsx("strong",{children:"Headers and footers"})," belgisi o'chiq bo'lishini tekshiring."]})]})]}),s==="a4"&&e.jsxs("div",{id:"printable-admission-card",className:"bg-white text-black rounded-2xl p-6 sm:p-8 border-2 border-black shadow-xl max-w-2xl mx-auto font-sans",children:[e.jsxs("div",{className:"flex items-start justify-between border-b-2 border-black pb-4 mb-5",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(gt,{size:50,subtitle:"maktabi",theme:"light"}),e.jsxs("div",{children:[e.jsx("h2",{className:"text-xl font-black text-black uppercase tracking-tight",children:"Farg'oniy Maktabi"}),e.jsx("p",{className:"text-xs font-extrabold uppercase tracking-widest text-slate-800",children:"O'quv Markazi"}),e.jsx("p",{className:"text-[11px] font-semibold italic text-slate-700",children:"Bilim — kelajak kaliti!"})]})]}),e.jsxs("div",{className:"text-right",children:[e.jsxs("span",{className:"inline-block px-3 py-1 rounded bg-black text-white text-xs font-mono font-black tracking-wider",children:["QABUL #",m]}),e.jsxs("p",{className:"text-xs text-black mt-1.5 font-bold",children:["Sana: ",ee(a.createdAt)]})]})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-4 pb-4 mb-4 border-b border-dashed border-black text-xs",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-[11px] font-bold text-slate-700 block uppercase tracking-wider",children:"O'quvchi (F.I.Sh):"}),e.jsx("span",{className:"text-base font-black text-black block mt-0.5",children:a.fullName})]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-[11px] font-bold text-slate-700 block uppercase tracking-wider",children:"Telefon Raqami:"}),e.jsx("span",{className:"text-sm font-black text-black block mt-0.5 font-mono",children:a.phoneNumber})]}),a.parentPhone&&e.jsxs("div",{children:[e.jsx("span",{className:"text-[11px] font-bold text-slate-700 block uppercase tracking-wider",children:"Ota-ona Telefoni:"}),e.jsx("span",{className:"text-xs font-bold text-black block mt-0.5 font-mono",children:a.parentPhone})]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-[11px] font-bold text-slate-700 block uppercase tracking-wider",children:"Fan / Yo'nalish:"}),e.jsx("span",{className:"text-xs font-black text-black block mt-0.5",children:a.interestedSubject||"Umumiy ta'lim"})]}),a.assignedGroupName&&e.jsxs("div",{children:[e.jsx("span",{className:"text-[11px] font-bold text-slate-700 block uppercase tracking-wider",children:"Biriktirilgan Guruh:"}),e.jsx("span",{className:"text-xs font-black text-brand-700 block mt-0.5",children:a.assignedGroupName})]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-[11px] font-bold text-slate-700 block uppercase tracking-wider",children:"Holati:"}),e.jsx("span",{className:"inline-block mt-1 px-2.5 py-0.5 text-[10px] font-black uppercase rounded bg-emerald-100 text-emerald-950 border border-emerald-400",children:a.status==="active"?"AKTIV (Darsga kelgan)":a.status.toUpperCase()})]})]}),e.jsxs("div",{className:"bg-slate-50 border-2 border-black rounded-xl p-4 mb-4",children:[e.jsxs("div",{className:"flex items-center justify-between pb-2 mb-3 border-b border-black",children:[e.jsxs("span",{className:"text-xs font-black uppercase tracking-wider text-black flex items-center gap-1.5",children:[e.jsx(xe,{className:"w-4 h-4 text-amber-600"}),"Tizimga Kirish Ma'lumotlari (Shaxsiy Kabinet)"]}),e.jsx("span",{className:"text-[10px] font-black text-black uppercase bg-amber-200 px-2 py-0.5 rounded",children:"Maxfiy"})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs",children:[e.jsxs("div",{className:"p-3 bg-white rounded-lg border-2 border-slate-300",children:[e.jsx("span",{className:"text-[10px] font-bold text-slate-700 uppercase block",children:"Platforma Manzili:"}),e.jsx("span",{className:"text-sm font-black text-blue-800 block mt-0.5 font-mono",children:n})]}),e.jsxs("div",{className:"p-3 bg-white rounded-lg border-2 border-slate-300",children:[e.jsx("span",{className:"text-[10px] font-bold text-slate-700 uppercase block",children:"Foydalanuvchi Logini:"}),e.jsx("span",{className:"text-sm font-black text-black block mt-0.5 font-mono select-all tracking-wide",children:a.login||"Hali belgilanmagan"})]}),e.jsxs("div",{className:"p-3 bg-white rounded-lg border-2 border-slate-300 sm:col-span-2 flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-[10px] font-bold text-slate-700 uppercase block",children:"Parol (Birinchi kirish uchun):"}),e.jsx("span",{className:"text-base font-black text-emerald-800 block mt-0.5 font-mono select-all tracking-wider",children:a.plainPassword||"********"})]}),e.jsx("div",{className:"text-right text-[10px] text-slate-600 font-bold",children:"*Tizimga kirgach parolni o'zgartirishingiz mumkin"})]})]})]}),e.jsxs("div",{className:"bg-amber-50/70 border border-amber-300 rounded-xl p-3 mb-5 text-[11px] text-black leading-relaxed font-medium",children:[e.jsx("p",{className:"font-extrabold text-black mb-1 flex items-center gap-1",children:"📌 O'quvchi va ota-onalar uchun eslatma:"}),e.jsxs("ol",{className:"list-decimal list-inside space-y-0.5",children:[e.jsxs("li",{children:["Telefon yoki kompyuter brauzerida ",e.jsx("strong",{children:n})," manzilini oching."]}),e.jsxs("li",{children:[e.jsx("strong",{children:"Login"})," va ",e.jsx("strong",{children:"Parol"})," orqali shaxsiy kabinetingizga kiring."]}),e.jsx("li",{children:"Dars jadvali, mavzular, uyga vazifalar va test natijalari profilingizda ko'rsatiladi."})]})]}),e.jsxs("div",{className:"flex items-center justify-between py-2 px-3 bg-slate-100 rounded-lg mb-4 text-xs font-bold text-black border border-slate-300",children:[e.jsxs("div",{className:"flex items-center gap-1.5",children:[e.jsx(At,{className:"w-4 h-4 text-blue-700"}),e.jsx("span",{children:n})]}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsxs("span",{className:"flex items-center gap-1",children:[e.jsx(te,{className:"w-3.5 h-3.5 text-black"}),"+998 959 252 200"]}),e.jsx("span",{children:"•"}),e.jsx("span",{children:"+998 558 122 200"})]})]}),e.jsxs("div",{className:"pt-3 border-t-2 border-black flex items-end justify-between text-xs text-black",children:[e.jsxs("div",{children:[e.jsx("p",{className:"font-black text-black",children:"Farg'oniy Ta'lim Markazi Ma'muriyati"}),e.jsx("p",{className:"text-[10px] text-slate-600 mt-0.5 font-bold",children:"Mas'ul xodim: ____________________"})]}),e.jsx("div",{className:"text-right",children:e.jsx("div",{className:"w-24 h-14 border-2 border-dashed border-black rounded flex items-center justify-center text-[10px] text-slate-700 font-black uppercase inline-block",children:"M.O' (Muhr)"})})]})]}),e.jsx("style",{children:`
        @media print {
          @page {
            size: ${s==="thermal"?"58mm auto":"A4 portrait"};
            margin: ${s==="thermal"?"0mm !important":"15mm"};
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
      `})]})},$t=()=>{const{user:a}=ft(),{success:i,error:s}=jt(),[l,n]=o.useState([]),[r,d]=o.useState([]),[m,b]=o.useState([]),[N,p]=o.useState(!0),[j,S]=o.useState(""),[g,I]=o.useState("all"),[M,O]=o.useState(!1),[ae,D]=o.useState(!1),[x,C]=o.useState(""),[q,F]=o.useState("+998"),[B,V]=o.useState(""),[me,he]=o.useState(""),[pe,ue]=o.useState(""),[be,ge]=o.useState("farqi_yoq"),[fe,je]=o.useState("boshqa"),[ve,Ne]=o.useState(""),[w,G]=o.useState(null),[Ye,we]=o.useState(!1),[R,ke]=o.useState(""),[K,ye]=o.useState(""),[Y,Ae]=o.useState(""),[se,W]=o.useState(null),[_,Z]=o.useState(null),[We,Se]=o.useState(!1),[le,Ce]=o.useState(""),[ie,qe]=o.useState(""),[ne,ze]=o.useState(""),[re,Pe]=o.useState(""),[oe,Ie]=o.useState(""),[L,X]=o.useState(null),[Ze,Me]=o.useState(!1),[Oe,Le]=o.useState(null),Te=async()=>{try{p(!0);const[t,c,u]=await Promise.all([T.getAdmissions(g,j),Ke.getGroups().catch(()=>[]),Nt.getSubjects(!1).catch(()=>[])]);n(t),d(c),b(u)}catch(t){console.error("Admissions load error:",t),s("Qabul ma'lumotlarini yuklashda xatolik yuz berdi")}finally{p(!1)}};o.useEffect(()=>{Te()},[g]);const Xe=t=>{t.preventDefault(),Te()},De=()=>{var t;C(""),F("+998"),V(""),he(""),ue(((t=m[0])==null?void 0:t.name)||""),ge("farqi_yoq"),je("boshqa"),Ne(""),O(!0)},Je=async t=>{if(t.preventDefault(),!x.trim()){s("O'quvchining F.I.Sh ni kiriting");return}if(!q.trim()||q.length<9){s("To'g'ri telefon raqam kiriting");return}try{D(!0);const c=await T.createAdmission({fullName:x,phoneNumber:q,parentPhone:B,age:me,interestedSubject:pe,preferredTime:be,source:fe,notes:ve,status:"new"});i("Yangi o'quvchi qabulga muvaffaqiyatli qo'shildi!"),O(!1),n(u=>[c,...u])}catch(c){s(c.message||"Qo'shishda xatolik yuz berdi")}finally{D(!1)}},Fe=t=>{const c=Mt(t.fullName);G(t),ke(t.login||c.login),ye(t.plainPassword||c.password),Ae(t.assignedGroupId||"")},et=async()=>{if(w){if(!R.trim()){s("Loginni kiriting");return}if(!K.trim()||K.length<6){s("Parol kamida 6 ta belgi bo'lishi kerak");return}try{we(!0);const t=r.find(z=>z.groupId===Y),c=await T.activateAdmission(w.id,{login:R,password:K,groupId:Y||"",groupName:(t==null?void 0:t.name)||"",currentAdminUid:a==null?void 0:a.uid}),u={...w,status:"active",login:c.login,plainPassword:c.password,assignedStudentUid:c.studentUid,assignedGroupId:Y||"",assignedGroupName:(t==null?void 0:t.name)||"",activatedAt:new Date().toISOString()};n(z=>z.map(He=>He.id===w.id?u:He)),i("O'quvchi faollashtirildi, login va parol biriktirildi!"),G(null),W(u)}catch(t){s(t.message||"Faollashtirishda xatolik yuz berdi")}finally{we(!1)}}},tt=async(t,c)=>{if(c==="active"){Fe(t);return}try{await T.updateStatus(t.id,c,a==null?void 0:a.uid),n(u=>u.map(z=>z.id===t.id?{...z,status:c}:z)),i(`Holat "${_e(c)}" ga o'zgartirildi`)}catch{s("Holatni o'zgartirishda xatolik")}},at=t=>{Z(t),Ce(t.fullName),qe(t.phoneNumber),ze(t.parentPhone||""),Pe(t.interestedSubject||""),Ie(t.notes||"")},st=async t=>{if(t.preventDefault(),!!_)try{Se(!0),await T.updateAdmission(_.id,{fullName:le.trim(),phoneNumber:ie.trim(),parentPhone:ne.trim(),interestedSubject:re.trim(),notes:oe.trim()}),n(c=>c.map(u=>u.id===_.id?{...u,fullName:le.trim(),phoneNumber:ie.trim(),parentPhone:ne.trim(),interestedSubject:re.trim(),notes:oe.trim()}:u)),i("Ma'lumotlar muvaffaqiyatli saqlandi"),Z(null)}catch{s("Saqlashda xatolik yuz berdi")}finally{Se(!1)}},lt=async()=>{if(L)try{Me(!0),await T.deleteAdmission(L.id),n(t=>t.filter(c=>c.id!==L.id)),i("Ariza o'chirildi"),X(null)}catch{s("O'chirishda xatolik")}finally{Me(!1)}},Be=(t,c)=>{navigator.clipboard.writeText(t),Le(c),setTimeout(()=>Le(null),2e3)},_e=t=>{switch(t){case"new":return"Yangi (Kutilmoqda)";case"contacted":return"Bog'lanildi";case"active":return"Aktiv (Darsga kelgan)";case"cancelled":return"Rad etildi";default:return t}},it=t=>{switch(t){case"new":return"warning";case"contacted":return"info";case"active":return"success";case"cancelled":return"neutral";default:return"neutral"}},Ee=l.length,nt=l.filter(t=>t.status==="new").length,rt=l.filter(t=>t.status==="active").length,ot=l.filter(t=>t.status==="contacted").length;return e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center justify-between gap-4",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("h2",{className:"text-2xl font-black text-white tracking-tight",children:"Qabul Bo'limi (LMS Qabul & Lidlar)"}),e.jsx("span",{className:"px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",children:"Yangi Oqim"})]}),e.jsx("p",{className:"text-xs text-slate-400 mt-1",children:"Yangi kelgan o'quvchilarni ro'yxatga olish, darsga kelganda holatini Aktivlashtirish, login/parol berish va guvohnomani chop etish"})]}),e.jsxs(h,{onClick:De,className:"bg-brand-600 hover:bg-brand-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-brand-600/30 shrink-0",children:[e.jsx(St,{className:"w-4 h-4"}),"+ Yangi O'quvchi Qabuli"]})]}),e.jsxs("div",{className:"grid grid-cols-2 lg:grid-cols-4 gap-4",children:[e.jsxs(E,{className:"p-4 bg-slate-900/90 border-slate-800",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-xs font-semibold text-slate-400",children:"Jami Arizalar"}),e.jsx(Qe,{className:"w-5 h-5 text-brand-400"})]}),e.jsx("p",{className:"text-2xl font-black text-white mt-2",children:Ee}),e.jsx("p",{className:"text-[11px] text-slate-500 mt-1",children:"Barcha qabul ro'yxati"})]}),e.jsxs(E,{className:"p-4 bg-slate-900/90 border-slate-800",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-xs font-semibold text-amber-400",children:"Yangi / Kutilmoqda"}),e.jsx(Ct,{className:"w-5 h-5 text-amber-400"})]}),e.jsx("p",{className:"text-2xl font-black text-amber-400 mt-2",children:nt}),e.jsx("p",{className:"text-[11px] text-slate-500 mt-1",children:"Darsga kelishi kutilmoqda"})]}),e.jsxs(E,{className:"p-4 bg-slate-900/90 border-slate-800",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-xs font-semibold text-emerald-400",children:"Aktiv (Darsga kelgan)"}),e.jsx(Q,{className:"w-5 h-5 text-emerald-400"})]}),e.jsx("p",{className:"text-2xl font-black text-emerald-400 mt-2",children:rt}),e.jsx("p",{className:"text-[11px] text-slate-500 mt-1",children:"Login/parol berilganlar"})]}),e.jsxs(E,{className:"p-4 bg-slate-900/90 border-slate-800",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-xs font-semibold text-sky-400",children:"Bog'lanilganlar"}),e.jsx(te,{className:"w-5 h-5 text-sky-400"})]}),e.jsx("p",{className:"text-2xl font-black text-sky-400 mt-2",children:ot}),e.jsx("p",{className:"text-[11px] text-slate-500 mt-1",children:"Suhbatlashilgan o'quvchilar"})]})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-3",children:[e.jsxs("form",{onSubmit:Xe,className:"flex-1 flex gap-2",children:[e.jsx(k,{placeholder:"F.I.Sh, telefon yoki qiziqqan fan bo'yicha qidiruv...",value:j,onChange:t=>S(t.target.value),leftIcon:e.jsx(qt,{className:"w-4 h-4"}),className:"bg-slate-900 border-slate-800 text-white"}),e.jsx(h,{type:"submit",children:"Qidirish"})]}),e.jsxs("select",{value:g,onChange:t=>I(t.target.value),className:"rounded-xl border border-slate-800 bg-slate-900 text-xs px-3 py-2 text-slate-300 focus:outline-none focus:border-brand-500",children:[e.jsxs("option",{value:"all",children:["Barcha holatlar (",Ee,")"]}),e.jsx("option",{value:"new",children:"Faqat yangi (Kutilmoqda)"}),e.jsx("option",{value:"contacted",children:"Bog'lanilgan"}),e.jsx("option",{value:"active",children:"Aktiv (Darsga kelgan / Login berilgan)"}),e.jsx("option",{value:"cancelled",children:"Rad etilgan"})]})]}),e.jsx(E,{className:"bg-slate-900 border-slate-800 overflow-hidden divide-y divide-slate-800",children:N?e.jsx("div",{className:"flex justify-center items-center py-20",children:e.jsx(vt,{size:"lg",className:"text-brand-500"})}):l.length===0?e.jsxs("div",{className:"p-12 text-center text-xs text-slate-500 space-y-2",children:[e.jsx(Qe,{className:"w-8 h-8 text-slate-600 mx-auto"}),e.jsx("p",{children:"Hozircha qabul qilingan o'quvchilar topilmadi"}),e.jsx(h,{size:"sm",onClick:De,className:"mt-2",children:"Birinchi o'quvchini qo'shish"})]}):e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"w-full text-left text-xs",children:[e.jsx("thead",{className:"bg-slate-950 text-slate-400 uppercase tracking-wider font-bold text-[10px]",children:e.jsxs("tr",{children:[e.jsx("th",{className:"p-4",children:"O'quvchi (F.I.Sh)"}),e.jsx("th",{className:"p-4",children:"Aloqa"}),e.jsx("th",{className:"p-4",children:"Fan & Vaqt"}),e.jsx("th",{className:"p-4",children:"Holat (Status)"}),e.jsx("th",{className:"p-4",children:"Tizim Kirishi (Login / Parol)"}),e.jsx("th",{className:"p-4 text-right",children:"Amallar"})]})}),e.jsx("tbody",{className:"divide-y divide-slate-800",children:l.map(t=>{const c=t.status==="active";return e.jsxs("tr",{className:"hover:bg-slate-800/40 transition-colors",children:[e.jsx("td",{className:"p-4",children:e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"w-9 h-9 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-black text-sm",children:t.fullName.charAt(0).toUpperCase()}),e.jsxs("div",{children:[e.jsx("span",{className:"font-bold text-white text-sm block",children:t.fullName}),e.jsxs("div",{className:"flex items-center gap-2 mt-0.5",children:[e.jsxs("span",{className:"text-[10px] text-slate-500 font-mono",children:["#",t.id.slice(-6).toUpperCase()]}),e.jsx("span",{className:"text-[10px] text-slate-500",children:"•"}),e.jsx("span",{className:"text-[10px] text-slate-400",children:ee(t.createdAt)})]})]})]})}),e.jsxs("td",{className:"p-4 text-slate-300",children:[e.jsxs("div",{className:"flex items-center gap-1.5 font-mono text-[11px] font-semibold text-slate-200",children:[e.jsx(te,{className:"w-3.5 h-3.5 text-brand-400"}),t.phoneNumber]}),t.parentPhone&&e.jsxs("div",{className:"text-[10px] text-slate-400 mt-0.5",children:["Ota-ona: ",e.jsx("span",{className:"font-mono",children:t.parentPhone})]})]}),e.jsxs("td",{className:"p-4 text-slate-300",children:[e.jsxs("div",{className:"font-bold text-white flex items-center gap-1",children:[e.jsx(zt,{className:"w-3 h-3 text-amber-400"}),t.interestedSubject||"Umumiy"]}),e.jsxs("div",{className:"text-[10px] text-slate-400 mt-0.5",children:[t.preferredTime==="ertalab"?"Ertalab":t.preferredTime==="tushdan_keyin"?"Tushdan keyin":t.preferredTime==="kechki"?"Kechki":"Ixtiyoriy vaqt",t.notes?` • ${t.notes}`:""]})]}),e.jsxs("td",{className:"p-4",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(wt,{variant:it(t.status),children:_e(t.status)}),e.jsxs("select",{value:t.status,onChange:u=>tt(t,u.target.value),className:"bg-slate-800 border border-slate-700 rounded-lg text-[10px] px-1.5 py-1 text-slate-300 hover:text-white",children:[e.jsx("option",{value:"new",children:"Yangi"}),e.jsx("option",{value:"contacted",children:"Bog'lanildi"}),e.jsx("option",{value:"active",children:"Aktiv (Darsga keldi)"}),e.jsx("option",{value:"cancelled",children:"Rad etildi"})]})]}),t.assignedGroupName&&e.jsxs("div",{className:"text-[10px] text-emerald-400 mt-1 font-semibold flex items-center gap-1",children:[e.jsx($e,{className:"w-3 h-3"}),t.assignedGroupName]})]}),e.jsx("td",{className:"p-4",children:c&&t.login?e.jsxs("div",{className:"space-y-1",children:[e.jsxs("div",{className:"flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded border border-slate-800 w-fit",children:[e.jsx("span",{className:"text-[10px] text-slate-400 font-medium",children:"Login:"}),e.jsx("span",{className:"text-xs font-mono font-bold text-amber-300",children:t.login}),e.jsx("button",{onClick:()=>Be(t.login,`log_${t.id}`),className:"text-slate-400 hover:text-white ml-1",title:"Loginni nusxalash",children:Oe===`log_${t.id}`?e.jsx(Ve,{className:"w-3 h-3 text-emerald-400"}):e.jsx(Ge,{className:"w-3 h-3"})})]}),e.jsxs("div",{className:"flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded border border-slate-800 w-fit",children:[e.jsx("span",{className:"text-[10px] text-slate-400 font-medium",children:"Parol:"}),e.jsx("span",{className:"text-xs font-mono font-bold text-emerald-400",children:t.plainPassword||"********"}),t.plainPassword&&e.jsx("button",{onClick:()=>Be(t.plainPassword,`pass_${t.id}`),className:"text-slate-400 hover:text-white ml-1",title:"Parolni nusxalash",children:Oe===`pass_${t.id}`?e.jsx(Ve,{className:"w-3 h-3 text-emerald-400"}):e.jsx(Ge,{className:"w-3 h-3"})})]})]}):e.jsx("span",{className:"text-[11px] text-slate-500 italic",children:"Darsga kelgach beriladi"})}),e.jsxs("td",{className:"p-4 text-right space-x-1.5 whitespace-nowrap",children:[c?e.jsxs(h,{size:"sm",variant:"secondary",onClick:()=>W(t),className:"bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-500/30",title:"Printerdan chop etish",children:[e.jsx(de,{className:"w-3.5 h-3.5 mr-1 text-amber-400"}),"Chop etish"]}):e.jsxs(h,{size:"sm",onClick:()=>Fe(t),className:"bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs",title:"O'quvchi darsga keldi - Aktivlashtirish va login/parol berish",children:[e.jsx(Q,{className:"w-3.5 h-3.5 mr-1"}),"Darsga keldi"]}),e.jsx(h,{size:"sm",variant:"ghost",onClick:()=>at(t),className:"text-slate-400 hover:text-white",title:"Tahrirlash",children:e.jsx(Pt,{className:"w-3.5 h-3.5"})}),e.jsx(h,{size:"sm",variant:"ghost",onClick:()=>X(t),className:"text-rose-400 hover:bg-rose-500/10",title:"O'chirish",children:e.jsx(It,{className:"w-3.5 h-3.5"})})]})]},t.id)})})]})})}),e.jsx(H,{isOpen:M,onClose:()=>O(!1),title:"Yangi O'quvchini Qabul Qilish (Lid qo'shish)",maxWidth:"lg",children:e.jsxs("form",{onSubmit:Je,className:"space-y-4",children:[e.jsx(k,{label:"O'quvchining F.I.Sh (To'liq ism-familiyasi) *",placeholder:"Masalan: Saidov Saidraximbek",value:x,onChange:t=>C(t.target.value),required:!0}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[e.jsx(k,{label:"Telefon raqami *",placeholder:"+998901234567",value:q,onChange:t=>F(t.target.value),required:!0}),e.jsx(k,{label:"Ota-onasi telefon raqami",placeholder:"+998912345678",value:B,onChange:t=>V(t.target.value)})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-semibold text-slate-300 mb-1",children:"Qiziqqan fan / Kurs"}),e.jsx("select",{value:pe,onChange:t=>ue(t.target.value),className:"w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white focus:outline-none focus:border-brand-500",children:m.length>0?e.jsxs(e.Fragment,{children:[e.jsx("option",{value:"",children:"Fanni tanlang..."}),m.map(t=>e.jsx("option",{value:t.name,children:t.name},t.subjectId))]}):e.jsx("option",{value:"",disabled:!0,children:"Mavjud fanlar topilmadi"})}),m.length===0&&e.jsx("p",{className:"text-[10px] text-amber-400 mt-1",children:`* Tizimda hali fanlar mavjud emas ("Fanlar Boshqaruvi" bo'limidan qo'shishingiz mumkin)`})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-semibold text-slate-300 mb-1",children:"Ma'qul keladigan vaqt"}),e.jsxs("select",{value:be,onChange:t=>ge(t.target.value),className:"w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white focus:outline-none focus:border-brand-500",children:[e.jsx("option",{value:"farqi_yoq",children:"Farqi yo'q (Ixtiyoriy)"}),e.jsx("option",{value:"ertalab",children:"Ertalab (08:00 - 12:00)"}),e.jsx("option",{value:"tushdan_keyin",children:"Tushdan keyin (13:00 - 17:00)"}),e.jsx("option",{value:"kechki",children:"Kechki (17:00 - 20:00)"})]})]})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[e.jsx(k,{label:"Yoshi yoki Maktab/Sinfi",placeholder:"Masalan: 15 yosh yoki 9-sinf",value:me,onChange:t=>he(t.target.value)}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-semibold text-slate-300 mb-1",children:"Qayerdan bildi (Manba)"}),e.jsxs("select",{value:fe,onChange:t=>je(t.target.value),className:"w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white focus:outline-none focus:border-brand-500",children:[e.jsx("option",{value:"telegram",children:"Telegram kanali"}),e.jsx("option",{value:"instagram",children:"Instagram"}),e.jsx("option",{value:"tavsiya",children:"Tanish / Do'st tavsiyasi"}),e.jsx("option",{value:"banner",children:"Tashqi reklama / Banner"}),e.jsx("option",{value:"boshqa",children:"Boshqa"})]})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-semibold text-slate-300 mb-1",children:"Qo'shimcha izoh / Ma'lumot"}),e.jsx("textarea",{rows:2,placeholder:"Qo'shimcha istaklar, bilim darajasi yoki eslatmalar...",value:ve,onChange:t=>Ne(t.target.value),className:"w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white focus:outline-none focus:border-brand-500"})]}),e.jsxs("div",{className:"flex items-center justify-end gap-3 pt-3 border-t border-slate-800",children:[e.jsx(h,{variant:"outline",type:"button",onClick:()=>O(!1),children:"Bekor qilish"}),e.jsx(h,{isLoading:ae,type:"submit",className:"bg-brand-600 hover:bg-brand-500",children:"Qabulga Qo'shish"})]})]})}),e.jsx(H,{isOpen:!!w,onClose:()=>G(null),title:"O'quvchini Aktivlashtirish & Login-Parol Berish",maxWidth:"lg",children:w&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20",children:[e.jsxs("div",{className:"flex items-center gap-2 text-emerald-400 font-bold text-sm",children:[e.jsx(Q,{className:"w-5 h-5"}),e.jsx("span",{children:"O'quvchi darsga keldi!"})]}),e.jsxs("p",{className:"text-xs text-slate-300 mt-1",children:["Foydalanuvchi: ",e.jsx("strong",{className:"text-white",children:w.fullName})," (",w.phoneNumber,")"]}),e.jsx("p",{className:"text-[11px] text-slate-400 mt-0.5",children:"Quyidagi login va parol orqali o'quvchi platformaga kira oladi. Saqlangandan so'ng darhol chop etish varaqasi ochiladi."})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5",children:[e.jsx(xe,{className:"w-3.5 h-3.5 text-amber-400"}),"Biriktiriladigan Login *"]}),e.jsx("input",{type:"text",value:R,onChange:t=>ke(t.target.value.toLowerCase().replace(/\s/g,"")),placeholder:"masalan: alisher_4821",className:"w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white font-mono focus:outline-none focus:border-brand-500",required:!0}),e.jsxs("span",{className:"text-[10px] text-slate-500 mt-1 block",children:["Email: ",R||"login","@fargoniy.uz"]})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5",children:[e.jsx(xe,{className:"w-3.5 h-3.5 text-emerald-400"}),"Birinchi kirish paroli *"]}),e.jsx("input",{type:"text",value:K,onChange:t=>ye(t.target.value),placeholder:"kamida 6 ta belgi",className:"w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white font-mono focus:outline-none focus:border-brand-500",required:!0}),e.jsx("span",{className:"text-[10px] text-slate-500 mt-1 block",children:"O'quvchi o'z profilida parolni o'zgartira oladi"})]})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5",children:[e.jsx($e,{className:"w-3.5 h-3.5 text-brand-400"}),"Guruhga biriktirish (Ixtiyoriy)"]}),e.jsxs("select",{value:Y,onChange:t=>Ae(t.target.value),className:"w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white focus:outline-none focus:border-brand-500",children:[e.jsx("option",{value:"",children:"Hozircha guruhsiz (Keyinroq biriktirish)"}),r.map(t=>e.jsxs("option",{value:t.groupId,children:[t.name," (",t.teacherName||t.subjectId||"Guruh",") [",t.currentStudentsCount||0," o'quvchi]"]},t.groupId))]})]}),e.jsxs("div",{className:"flex items-center justify-end gap-3 pt-3 border-t border-slate-800",children:[e.jsx(h,{variant:"outline",onClick:()=>G(null),children:"Bekor qilish"}),e.jsxs(h,{isLoading:Ye,onClick:et,className:"bg-emerald-600 hover:bg-emerald-500 text-white font-bold",children:[e.jsx(Q,{className:"w-4 h-4 mr-1.5"}),"Aktivlashtirish va Login Berish"]})]})]})}),e.jsx(H,{isOpen:!!se,onClose:()=>W(null),title:"O'quvchi Qabul Cheki (Login & Parol)",maxWidth:"lg",children:se&&e.jsx(Lt,{admission:se,onClose:()=>W(null)})}),e.jsx(H,{isOpen:!!_,onClose:()=>Z(null),title:"Ariza Ma'lumotlarini Tahrirlash",children:_&&e.jsxs("form",{onSubmit:st,className:"space-y-4",children:[e.jsx(k,{label:"O'quvchining F.I.Sh",value:le,onChange:t=>Ce(t.target.value),required:!0}),e.jsxs("div",{className:"grid grid-cols-2 gap-3",children:[e.jsx(k,{label:"Telefon",value:ie,onChange:t=>qe(t.target.value),required:!0}),e.jsx(k,{label:"Ota-ona telefoni",value:ne,onChange:t=>ze(t.target.value)})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-semibold text-slate-300 mb-1",children:"Fan / Yo'nalish"}),e.jsx("select",{value:re,onChange:t=>Pe(t.target.value),className:"w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white focus:outline-none focus:border-brand-500",children:m.length>0?e.jsxs(e.Fragment,{children:[e.jsx("option",{value:"",children:"Fanni tanlang..."}),m.map(t=>e.jsx("option",{value:t.name,children:t.name},t.subjectId))]}):e.jsx("option",{value:"",disabled:!0,children:"Mavjud fanlar topilmadi"})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-semibold text-slate-300 mb-1",children:"Izoh"}),e.jsx("textarea",{rows:2,value:oe,onChange:t=>Ie(t.target.value),className:"w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white focus:outline-none focus:border-brand-500"})]}),e.jsxs("div",{className:"flex items-center justify-end gap-3 pt-3 border-t border-slate-800",children:[e.jsx(h,{variant:"outline",type:"button",onClick:()=>Z(null),children:"Bekor qilish"}),e.jsx(h,{isLoading:We,type:"submit",children:"Saqlash"})]})]})}),e.jsx(H,{isOpen:!!L,onClose:()=>X(null),title:"Arizani O'chirish",children:L&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("p",{className:"text-xs text-slate-300 leading-relaxed",children:["Haqiqatan ham ",e.jsx("strong",{className:"text-white",children:L.fullName})," nomli qabul arizasini o'chirmoqchimisiz?"]}),e.jsxs("div",{className:"flex items-center justify-end gap-3 pt-3 border-t border-slate-800",children:[e.jsx(h,{variant:"outline",onClick:()=>X(null),children:"Bekor qilish"}),e.jsx(h,{variant:"danger",isLoading:Ze,onClick:lt,children:"O'chirish"})]})]})})]})};export{$t as AdminAdmissionsPage,$t as default};
