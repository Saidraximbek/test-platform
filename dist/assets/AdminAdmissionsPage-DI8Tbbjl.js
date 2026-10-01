import{d as j,m as dt,j as e,f as ee,F as ct,u as xt,a as mt,S as ht}from"./index-Bhn_Hfzp.js";import{r as o}from"./vendor-react-D785DYxF.js";import{O as pt,x as S,f as ut,h as bt,j as gt,F as ft,B as jt,K as Z,N as Ue,G as U,I as N,z as vt,A as Ye}from"./vendor-firebase-Dtv4vnt5.js";import{g as He}from"./groupService-CwKds2E8.js";import{s as Nt}from"./subjectService-BuUBpjLR.js";import{C as F}from"./Card-Cp8_xc7f.js";import{B as m}from"./Button-BQL8_66v.js";import{I as y}from"./Input-CmP-sIN1.js";import{M as E}from"./Modal-quMsLezb.js";import{B as wt}from"./Badge-DOmdr3AG.js";import{ao as oe,W as kt,c as $,I as yt,ap as de,k as At,j as $e,$ as St,J as Ge,ag as Ct,B as qt,G as Qe,ac as Ke,ad as Re,ai as zt,af as It}from"./vendor-icons-KMrwZWfz.js";const Pt=s=>{const l=s.trim().toLowerCase().replace(/['`ʻ’]/g,"").replace(/sh/g,"sh").replace(/ch/g,"ch").replace(/[^a-z0-9]/gi,"_").split("_").filter(Boolean)[0]||"talaba",a=Math.floor(1e3+Math.random()*9e3),i=`${l}_${a}`,r=`talaba${Math.floor(1e3+Math.random()*9e3)}`;return{login:i,password:r}};let z=null;async function Ot(){try{const s=S(j,"users","system_admissions"),l=await Ye(s);if(l.exists()){const a=l.data();return(a==null?void 0:a.list)||[]}}catch(s){console.warn("Could not read system_admissions doc:",s==null?void 0:s.message)}return[]}function G(s){const l=Array.isArray(s)?[]:{};for(const[a,i]of Object.entries(s))i!==void 0&&(i!==null&&typeof i=="object"&&!(i instanceof Date)&&!i.toMillis?l[a]=G(i):l[a]=i);return l}async function re(s){var r;const l=S(j,"users","system_admissions");let a=[];try{const c=await Ye(l);c.exists()&&(a=((r=c.data())==null?void 0:r.list)||[])}catch{}const n=s(a).map(c=>G(c));return await U(l,{list:n,updatedAt:N()},{merge:!0}),z={list:n,time:Date.now()},n}const M={async getAdmissions(s="all",l=""){let a=[];if(z&&Date.now()-z.time<3e4)a=z.list;else{try{const n=await Ue(Z(j,"admissions"));n.empty||(a=n.docs.map(r=>({...r.data(),id:r.id,status:r.data().status||"new"})))}catch{}const i=await Ot();if(i.length>0){const n=new Map;a.forEach(r=>n.set(r.id,r)),i.forEach(r=>n.set(r.id,r)),a=Array.from(n.values())}z={list:a,time:Date.now()}}if(s&&s!=="all"&&(a=a.filter(i=>i.status===s)),l.trim()){const i=l.toLowerCase().trim();a=a.filter(n=>{var r,c,h,b,v;return((r=n.fullName)==null?void 0:r.toLowerCase().includes(i))||((c=n.phoneNumber)==null?void 0:c.toLowerCase().includes(i))||((h=n.parentPhone)==null?void 0:h.toLowerCase().includes(i))||((b=n.interestedSubject)==null?void 0:b.toLowerCase().includes(i))||((v=n.login)==null?void 0:v.toLowerCase().includes(i))})}return a.sort((i,n)=>{var h,b;const r=(h=i.createdAt)!=null&&h.toMillis?i.createdAt.toMillis():i.createdAt?new Date(i.createdAt).getTime():0;return((b=n.createdAt)!=null&&b.toMillis?n.createdAt.toMillis():n.createdAt?new Date(n.createdAt).getTime():0)-r}),a},async getAdmissionById(s){if(z){const a=z.list.find(i=>i.id===s);if(a)return a}return(await this.getAdmissions()).find(a=>a.id===s)||null},async createAdmission(s){const l=`adm_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,a=new Date().toISOString(),i={id:l,fullName:s.fullName.trim(),phoneNumber:s.phoneNumber.trim(),parentPhone:s.parentPhone?s.parentPhone.trim():"",age:s.age||"",birthDate:s.birthDate||"",interestedSubject:s.interestedSubject||"",subjectId:s.subjectId||"",preferredTime:s.preferredTime||"farqi_yoq",source:s.source||"boshqa",notes:s.notes||"",status:s.status||"new",createdAt:a,updatedAt:a};await re(n=>[i,...n.filter(r=>r.id!==l)]);try{await U(S(j,"admissions",l),{...i,createdAt:N(),updatedAt:N()})}catch{}return i},async updateAdmission(s,l){const a=new Date().toISOString(),i=G(l);await re(n=>n.map(r=>r.id===s?{...r,...i,updatedAt:a}:r));try{Object.keys(i).length>0&&await vt(S(j,"admissions",s),{...i,updatedAt:N()})}catch{}},async updateStatus(s,l,a){if(await this.updateAdmission(s,{status:l}),a)try{const i=S(Z(j,"audit_logs"));await U(i,{logId:i.id,adminUid:a,action:`ADMISSION_STATUS_${l.toUpperCase()}`,targetCollection:"admissions",targetDocumentId:s,changes:{status:l},createdAt:N()})}catch{}},async activateAdmission(s,l){const a=await this.getAdmissionById(s);if(!a)throw new Error("Qabul hujjati topilmadi");const i=l.login.trim().toLowerCase().replace(/[^a-z0-9_]/g,""),n=`${i}@fargoniy.uz`,r=l.password.trim();if(!i||i.length<3)throw new Error("Login kamida 3 ta belgidan iborat bo'lishi kerak");if(!r||r.length<6)throw new Error("Parol kamida 6 ta belgidan iborat bo'lishi kerak");let c=`student_${Date.now()}`;try{const p="StudentCreatorApp",I=ut().find(L=>L.name===p)||bt(dt,p),g=gt(I);c=(await ft(g,n,r)).user.uid,await jt(g)}catch(p){if(console.warn("Isolated auth registration note:",p),p.code==="auth/email-already-in-use")try{const f=Z(j,"users"),g=(await Ue(f)).docs.find(P=>P.data().email===n);g&&(c=g.id)}catch{}}const h={uid:c,displayName:a.fullName,email:n,login:i,phoneNumber:a.phoneNumber,role:"student",status:"active",coinBalance:50,totalCorrectAnswers:0,testsCompleted:0,educationPlace:a.notes||"Farg'oniy Ta'lim Markazi",isCenterStudent:!0,photoURL:null,groupIds:l.groupId?[l.groupId]:[],createdAt:N(),updatedAt:N(),lastActiveAt:N()};if(await U(S(j,"users",c),G(h),{merge:!0}),l.groupId)try{await He.addStudentToGroup(l.groupId,c)}catch(p){console.warn("Could not auto-add to group:",p)}const b=new Date().toISOString(),v={status:"active",assignedStudentUid:c,login:i,plainPassword:r,assignedGroupId:l.groupId||"",assignedGroupName:l.groupName||"",activatedAt:b,activatedBy:l.currentAdminUid||"admin"};await this.updateAdmission(s,v);try{const p=S(Z(j,"audit_logs")),f=G({logId:p.id,adminUid:l.currentAdminUid||"admin",action:"ADMISSION_ACTIVATED",targetCollection:"admissions",targetDocumentId:s,changes:{fullName:a.fullName,studentUid:c,login:i,groupId:l.groupId||""},createdAt:N()});await U(p,f)}catch{}return{studentUid:c,login:i,password:r}},async deleteAdmission(s){await re(l=>l.filter(a=>a.id!==s));try{await pt(S(j,"admissions",s))}catch{}}};function A(s){return(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}const Tt=({admission:s,onClose:l})=>{const[a,i]=o.useState("thermal"),n=typeof window<"u"?window.location.origin:"https://fargoniy.uz",r=()=>{var D;const h=A(s.fullName||"O'quvchi"),b=A(s.phoneNumber||"-"),v=A(s.parentPhone||""),p=A(s.interestedSubject||"Umumiy ta'lim"),f=A(s.assignedGroupName||""),I=A(s.login||"login"),g=A(s.plainPassword||"******"),P=A(s.id.slice(-6).toUpperCase()),L=ee(s.createdAt),O=`<!DOCTYPE html>
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
        <span>QABUL: #${P}</span>
        <span>${L}</span>
      </div>
    </div>

    <div class="divider"></div>

    <div class="info-list">
      <div class="info-row">
        <span class="info-label">O'quvchi:</span>
        <span class="info-value">${h}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Telefon:</span>
        <span class="info-value">${b}</span>
      </div>
      ${v?`
      <div class="info-row">
        <span class="info-label">Ota-ona:</span>
        <span class="info-value">${v}</span>
      </div>`:""}
      <div class="info-row">
        <span class="info-label">Fan:</span>
        <span class="info-value">${p}</span>
      </div>
      ${f?`
      <div class="info-row">
        <span class="info-label">Guruh:</span>
        <span class="info-value">${f}</span>
      </div>`:""}
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
        <span class="cred-value">${I}</span>
      </div>
      <div class="cred-row">
        <span class="cred-label">Parol:</span>
        <span class="cred-value">${g}</span>
      </div>
    </div>

    <div class="divider"></div>

    <div class="footer">
      <div class="footer-bold">O'qishingizda omad tilaymiz!</div>
      <div class="footer-sub">fargoniy.uz orqali kiring</div>
    </div>
  </div>
</body>
</html>`,Q=document.getElementById("admission-print-frame");Q&&Q.remove();const x=document.createElement("iframe");x.id="admission-print-frame",x.style.position="fixed",x.style.top="0",x.style.left="0",x.style.width="58mm",x.style.height="100px",x.style.border="none",x.style.opacity="0",x.style.pointerEvents="none",x.style.zIndex="-9999",document.body.appendChild(x);const w=((D=x.contentWindow)==null?void 0:D.document)||x.contentDocument;w?(w.open(),w.write(O),w.close(),setTimeout(()=>{var C,_;try{(C=x.contentWindow)==null||C.focus(),(_=x.contentWindow)==null||_.print()}catch(K){console.error("Print error:",K),window.print()}finally{setTimeout(()=>{document.body.contains(x)&&document.body.removeChild(x)},3e3)}},200)):window.print()},c=()=>{window.print()};return e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-800/80 rounded-xl border border-slate-700 print:hidden",children:[e.jsxs("div",{className:"flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-700 text-xs",children:[e.jsxs("button",{type:"button",onClick:()=>i("thermal"),className:`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${a==="thermal"?"bg-brand-600 text-white shadow":"text-slate-400 hover:text-white"}`,children:[e.jsx(oe,{className:"w-3.5 h-3.5"}),"58mm Termal Chek"]}),e.jsxs("button",{type:"button",onClick:()=>i("a4"),className:`px-3 py-1.5 rounded-md font-bold transition-all flex items-center gap-1.5 ${a==="a4"?"bg-brand-600 text-white shadow":"text-slate-400 hover:text-white"}`,children:[e.jsx(kt,{className:"w-3.5 h-3.5"}),"A4 Guvohnoma"]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[l&&e.jsx(m,{size:"sm",variant:"ghost",onClick:l,children:"Yopish"}),e.jsxs(m,{size:"sm",onClick:a==="thermal"?r:c,className:"bg-brand-600 hover:bg-brand-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-brand-600/30",children:[e.jsx(oe,{className:"w-4 h-4"}),a==="thermal"?"Chop etish (58mm)":"A4 Chop etish"]})]})]}),a==="thermal"&&e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex items-center justify-between px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx($,{className:"w-4 h-4 text-emerald-400 shrink-0"}),e.jsx("span",{className:"font-semibold",children:"Xprinter XP-58 (58mm login-parol cheki)"})]}),e.jsx("span",{className:"text-[11px] bg-emerald-500/20 px-2.5 py-0.5 rounded font-mono font-bold",children:"58mm"})]}),e.jsx("div",{className:"flex justify-center p-3 bg-slate-950/60 rounded-xl border border-slate-800",children:e.jsxs("div",{id:"printable-thermal-admission",className:"w-[58mm] max-w-[58mm] bg-white text-black p-[2.5mm] rounded shadow-xl font-mono leading-tight select-none border border-slate-300",style:{width:"58mm",maxWidth:"58mm",boxSizing:"border-box"},children:[e.jsxs("div",{className:"text-center pb-0.5",children:[e.jsx("div",{className:"text-[16px] font-black uppercase tracking-tight text-black leading-tight",children:"FARG'ONIY MAKTABI"}),e.jsx("div",{className:"text-[12px] font-extrabold uppercase tracking-wider text-black mt-0.5",children:"O'QUVCHI KABINETI"}),e.jsxs("div",{className:"flex justify-between items-center text-[10.5px] font-bold text-black mt-1 px-0.5",children:[e.jsxs("span",{children:["QABUL: #",s.id.slice(-6).toUpperCase()]}),e.jsx("span",{children:ee(s.createdAt)})]})]}),e.jsx("div",{className:"border-b-[1.5px] border-dashed border-black my-1.5"}),e.jsxs("div",{className:"space-y-1 text-black text-[12px] leading-tight",children:[e.jsxs("div",{className:"flex justify-between items-baseline gap-1",children:[e.jsx("span",{className:"font-bold text-black shrink-0 text-[11.5px]",children:"O'quvchi:"}),e.jsx("span",{className:"font-black text-black text-right text-[12px] break-words",children:s.fullName})]}),e.jsxs("div",{className:"flex justify-between items-baseline gap-1",children:[e.jsx("span",{className:"font-bold text-black shrink-0 text-[11.5px]",children:"Telefon:"}),e.jsx("span",{className:"font-black text-black text-right text-[12px]",children:s.phoneNumber})]}),s.parentPhone&&e.jsxs("div",{className:"flex justify-between items-baseline gap-1",children:[e.jsx("span",{className:"font-bold text-black shrink-0 text-[11.5px]",children:"Ota-ona:"}),e.jsx("span",{className:"font-black text-black text-right text-[12px]",children:s.parentPhone})]}),e.jsxs("div",{className:"flex justify-between items-baseline gap-1",children:[e.jsx("span",{className:"font-bold text-black shrink-0 text-[11.5px]",children:"Fan:"}),e.jsx("span",{className:"font-black text-black text-right text-[12px] break-words",children:s.interestedSubject||"Umumiy ta'lim"})]}),s.assignedGroupName&&e.jsxs("div",{className:"flex justify-between items-baseline gap-1",children:[e.jsx("span",{className:"font-bold text-black shrink-0 text-[11.5px]",children:"Guruh:"}),e.jsx("span",{className:"font-black text-black text-right text-[12px] break-words",children:s.assignedGroupName})]})]}),e.jsx("div",{className:"border-b-[1.5px] border-dashed border-black my-1.5"}),e.jsxs("div",{className:"border-[1.5px] border-black p-1.5 my-1 text-center",children:[e.jsx("div",{className:"text-[10px] font-black uppercase border-b border-dashed border-black pb-1 mb-1 tracking-wide",children:"PLATFORMA MA'LUMOTLARI"}),e.jsxs("div",{className:"flex justify-between items-center py-0.5 text-[11px]",children:[e.jsx("span",{className:"font-bold",children:"Sayt:"}),e.jsx("span",{className:"font-bold font-mono",children:"fargoniy.uz"})]}),e.jsxs("div",{className:"flex justify-between items-center py-0.5 text-[11.5px]",children:[e.jsx("span",{className:"font-bold",children:"Login:"}),e.jsx("span",{className:"font-black font-mono text-[13px]",children:s.login||"-"})]}),e.jsxs("div",{className:"flex justify-between items-center py-0.5 text-[11.5px]",children:[e.jsx("span",{className:"font-bold",children:"Parol:"}),e.jsx("span",{className:"font-black font-mono text-[14px]",children:s.plainPassword||"******"})]})]}),e.jsx("div",{className:"border-b-[1.5px] border-dashed border-black my-1.5"}),e.jsxs("div",{className:"text-center pt-1 text-black leading-tight",children:[e.jsx("p",{className:"font-extrabold text-[11px]",children:"O'qishingizda omad tilaymiz!"}),e.jsx("p",{className:"text-[9px] font-bold text-black/80 mt-0.5",children:"fargoniy.uz platformasiga kiring"})]})]})}),e.jsxs("div",{className:"flex items-start gap-2 p-2.5 bg-slate-800/60 rounded-lg text-slate-400 text-[11px] leading-relaxed border border-slate-700/50",children:[e.jsx(yt,{className:"w-4 h-4 text-brand-400 shrink-0 mt-0.5"}),e.jsxs("span",{children:["Qog'oz toza va qisqa chiqishi uchun printer dialogida ",e.jsx("strong",{children:"Headers and footers"})," belgisi o'chiq bo'lishini tekshiring."]})]})]}),a==="a4"&&e.jsxs("div",{id:"printable-admission-card",className:"bg-white text-slate-900 rounded-2xl p-6 sm:p-8 border-2 border-slate-300 shadow-xl max-w-2xl mx-auto",children:[e.jsxs("div",{className:"flex items-start justify-between border-b-2 border-slate-900 pb-4 mb-5",children:[e.jsx("div",{className:"flex items-center gap-3",children:e.jsx(ct,{size:46,subtitle:"maktabi",theme:"light"})}),e.jsxs("div",{className:"text-right",children:[e.jsxs("span",{className:"inline-block px-2.5 py-1 rounded bg-slate-100 border border-slate-300 text-[11px] font-mono font-black text-slate-800",children:["QABUL #",s.id.slice(-6).toUpperCase()]}),e.jsxs("p",{className:"text-[10px] text-slate-500 mt-1 font-medium",children:["Sana: ",ee(s.createdAt)]})]})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-4 pb-4 mb-4 border-b border-dashed border-slate-300 text-xs",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-[11px] font-bold text-slate-500 block uppercase tracking-wider",children:"O'quvchi (F.I.Sh):"}),e.jsx("span",{className:"text-base font-extrabold text-slate-950 block mt-0.5",children:s.fullName})]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-[11px] font-bold text-slate-500 block uppercase tracking-wider",children:"Telefon Raqami:"}),e.jsx("span",{className:"text-sm font-bold text-slate-900 block mt-0.5 font-mono",children:s.phoneNumber})]}),s.parentPhone&&e.jsxs("div",{children:[e.jsx("span",{className:"text-[11px] font-bold text-slate-500 block uppercase tracking-wider",children:"Ota-ona Telefoni:"}),e.jsx("span",{className:"text-xs font-semibold text-slate-800 block mt-0.5 font-mono",children:s.parentPhone})]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-[11px] font-bold text-slate-500 block uppercase tracking-wider",children:"Fan / Yo'nalish:"}),e.jsx("span",{className:"text-xs font-bold text-slate-900 block mt-0.5",children:s.interestedSubject||"Umumiy ta'lim"})]}),s.assignedGroupName&&e.jsxs("div",{children:[e.jsx("span",{className:"text-[11px] font-bold text-slate-500 block uppercase tracking-wider",children:"Biriktirilgan Guruh:"}),e.jsx("span",{className:"text-xs font-black text-brand-700 block mt-0.5",children:s.assignedGroupName})]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-[11px] font-bold text-slate-500 block uppercase tracking-wider",children:"Holati:"}),e.jsx("span",{className:"inline-block mt-1 px-2 py-0.5 text-[10px] font-black uppercase rounded bg-emerald-100 text-emerald-800 border border-emerald-300",children:s.status==="active"?"AKTIV (Darsga kelgan)":s.status.toUpperCase()})]})]}),e.jsxs("div",{className:"bg-slate-50 border-2 border-slate-900 rounded-xl p-4 mb-4",children:[e.jsxs("div",{className:"flex items-center justify-between pb-2 mb-3 border-b border-slate-200",children:[e.jsxs("span",{className:"text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5",children:[e.jsx(de,{className:"w-4 h-4 text-amber-600"}),"Tizimga Kirish Ma'lumotlari (Shaxsiy Kabinet)"]}),e.jsx("span",{className:"text-[10px] font-bold text-slate-500 uppercase",children:"Maxfiy"})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs",children:[e.jsxs("div",{className:"p-3 bg-white rounded-lg border border-slate-300",children:[e.jsx("span",{className:"text-[10px] font-bold text-slate-500 uppercase block",children:"Platforma Manzili:"}),e.jsx("span",{className:"text-xs font-bold text-blue-700 block mt-0.5 break-all font-mono",children:n})]}),e.jsxs("div",{className:"p-3 bg-white rounded-lg border border-slate-300",children:[e.jsx("span",{className:"text-[10px] font-bold text-slate-500 uppercase block",children:"Foydalanuvchi Logini:"}),e.jsx("span",{className:"text-sm font-black text-slate-950 block mt-0.5 font-mono select-all tracking-wide",children:s.login||"Hali belgilanmagan"})]}),e.jsxs("div",{className:"p-3 bg-white rounded-lg border border-slate-300 sm:col-span-2 flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-[10px] font-bold text-slate-500 uppercase block",children:"Parol (Birinchi kirish uchun):"}),e.jsx("span",{className:"text-base font-black text-emerald-700 block mt-0.5 font-mono select-all tracking-wider",children:s.plainPassword||"********"})]}),e.jsx("div",{className:"text-right text-[10px] text-slate-500 font-medium",children:"*Kirgandan so'ng parolni o'zgartirishingiz mumkin"})]})]})]}),e.jsxs("div",{className:"bg-amber-50/60 border border-amber-200 rounded-xl p-3 mb-5 text-[11px] text-slate-700 leading-relaxed",children:[e.jsx("p",{className:"font-bold text-slate-900 mb-1 flex items-center gap-1",children:"📌 O'quvchi va ota-onalar uchun eslatma:"}),e.jsxs("ol",{className:"list-decimal list-inside space-y-0.5",children:[e.jsx("li",{children:"Telefon yoki kompyuter brauzerida platforma manzilini oching."}),e.jsxs("li",{children:[e.jsx("strong",{children:"Login"})," va ",e.jsx("strong",{children:"Parol"})," orqali tizimga kiring."]}),e.jsx("li",{children:"Dars jadvali, mavzular, uyga vazifalar va test natijalari profilingizda ko'rsatiladi."})]})]}),e.jsxs("div",{className:"pt-3 border-t-2 border-slate-900 flex items-end justify-between text-xs text-slate-800",children:[e.jsxs("div",{children:[e.jsx("p",{className:"font-bold text-slate-900",children:"Farg'oniy Ta'lim Markazi Ma'muriyati"}),e.jsx("p",{className:"text-[10px] text-slate-500 mt-0.5",children:"Mas'ul xodim: ____________________"})]}),e.jsx("div",{className:"text-right",children:e.jsx("div",{className:"w-20 h-12 border-2 border-dashed border-slate-300 rounded flex items-center justify-center text-[9px] text-slate-400 font-bold uppercase inline-block",children:"M.O' (Muhr)"})})]})]}),e.jsx("style",{children:`
        @media print {
          @page {
            size: ${a==="thermal"?"58mm auto":"A4 portrait"};
            margin: ${a==="thermal"?"0mm !important":"15mm"};
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
      `})]})},Kt=()=>{const{user:s}=xt(),{success:l,error:a}=mt(),[i,n]=o.useState([]),[r,c]=o.useState([]),[h,b]=o.useState([]),[v,p]=o.useState(!0),[f,I]=o.useState(""),[g,P]=o.useState("all"),[L,O]=o.useState(!1),[Q,x]=o.useState(!1),[w,D]=o.useState(""),[C,_]=o.useState("+998"),[K,ce]=o.useState(""),[xe,me]=o.useState(""),[he,pe]=o.useState(""),[ue,be]=o.useState("farqi_yoq"),[ge,fe]=o.useState("boshqa"),[je,ve]=o.useState(""),[k,R]=o.useState(null),[We,Ne]=o.useState(!1),[Y,we]=o.useState(""),[H,ke]=o.useState(""),[W,ye]=o.useState(""),[te,V]=o.useState(null),[B,J]=o.useState(null),[Ve,Ae]=o.useState(!1),[se,Se]=o.useState(""),[ae,Ce]=o.useState(""),[ie,qe]=o.useState(""),[le,ze]=o.useState(""),[ne,Ie]=o.useState(""),[T,X]=o.useState(null),[Je,Pe]=o.useState(!1),[Oe,Te]=o.useState(null),Me=async()=>{try{p(!0);const[t,d,u]=await Promise.all([M.getAdmissions(g,f),He.getGroups().catch(()=>[]),Nt.getSubjects(!1).catch(()=>[])]);n(t),c(d),b(u)}catch(t){console.error("Admissions load error:",t),a("Qabul ma'lumotlarini yuklashda xatolik yuz berdi")}finally{p(!1)}};o.useEffect(()=>{Me()},[g]);const Xe=t=>{t.preventDefault(),Me()},Le=()=>{var t;D(""),_("+998"),ce(""),me(""),pe(((t=h[0])==null?void 0:t.name)||""),be("farqi_yoq"),fe("boshqa"),ve(""),O(!0)},Ze=async t=>{if(t.preventDefault(),!w.trim()){a("O'quvchining F.I.Sh ni kiriting");return}if(!C.trim()||C.length<9){a("To'g'ri telefon raqam kiriting");return}try{x(!0);const d=await M.createAdmission({fullName:w,phoneNumber:C,parentPhone:K,age:xe,interestedSubject:he,preferredTime:ue,source:ge,notes:je,status:"new"});l("Yangi o'quvchi qabulga muvaffaqiyatli qo'shildi!"),O(!1),n(u=>[d,...u])}catch(d){a(d.message||"Qo'shishda xatolik yuz berdi")}finally{x(!1)}},De=t=>{const d=Pt(t.fullName);R(t),we(t.login||d.login),ke(t.plainPassword||d.password),ye(t.assignedGroupId||"")},et=async()=>{if(k){if(!Y.trim()){a("Loginni kiriting");return}if(!H.trim()||H.length<6){a("Parol kamida 6 ta belgi bo'lishi kerak");return}try{Ne(!0);const t=r.find(q=>q.groupId===W),d=await M.activateAdmission(k.id,{login:Y,password:H,groupId:W||"",groupName:(t==null?void 0:t.name)||"",currentAdminUid:s==null?void 0:s.uid}),u={...k,status:"active",login:d.login,plainPassword:d.password,assignedStudentUid:d.studentUid,assignedGroupId:W||"",assignedGroupName:(t==null?void 0:t.name)||"",activatedAt:new Date().toISOString()};n(q=>q.map(Ee=>Ee.id===k.id?u:Ee)),l("O'quvchi faollashtirildi, login va parol biriktirildi!"),R(null),V(u)}catch(t){a(t.message||"Faollashtirishda xatolik yuz berdi")}finally{Ne(!1)}}},tt=async(t,d)=>{if(d==="active"){De(t);return}try{await M.updateStatus(t.id,d,s==null?void 0:s.uid),n(u=>u.map(q=>q.id===t.id?{...q,status:d}:q)),l(`Holat "${Be(d)}" ga o'zgartirildi`)}catch{a("Holatni o'zgartirishda xatolik")}},st=t=>{J(t),Se(t.fullName),Ce(t.phoneNumber),qe(t.parentPhone||""),ze(t.interestedSubject||""),Ie(t.notes||"")},at=async t=>{if(t.preventDefault(),!!B)try{Ae(!0),await M.updateAdmission(B.id,{fullName:se.trim(),phoneNumber:ae.trim(),parentPhone:ie.trim(),interestedSubject:le.trim(),notes:ne.trim()}),n(d=>d.map(u=>u.id===B.id?{...u,fullName:se.trim(),phoneNumber:ae.trim(),parentPhone:ie.trim(),interestedSubject:le.trim(),notes:ne.trim()}:u)),l("Ma'lumotlar muvaffaqiyatli saqlandi"),J(null)}catch{a("Saqlashda xatolik yuz berdi")}finally{Ae(!1)}},it=async()=>{if(T)try{Pe(!0),await M.deleteAdmission(T.id),n(t=>t.filter(d=>d.id!==T.id)),l("Ariza o'chirildi"),X(null)}catch{a("O'chirishda xatolik")}finally{Pe(!1)}},_e=(t,d)=>{navigator.clipboard.writeText(t),Te(d),setTimeout(()=>Te(null),2e3)},Be=t=>{switch(t){case"new":return"Yangi (Kutilmoqda)";case"contacted":return"Bog'lanildi";case"active":return"Aktiv (Darsga kelgan)";case"cancelled":return"Rad etildi";default:return t}},lt=t=>{switch(t){case"new":return"warning";case"contacted":return"info";case"active":return"success";case"cancelled":return"neutral";default:return"neutral"}},Fe=i.length,nt=i.filter(t=>t.status==="new").length,rt=i.filter(t=>t.status==="active").length,ot=i.filter(t=>t.status==="contacted").length;return e.jsxs("div",{className:"space-y-6",children:[e.jsxs("div",{className:"flex flex-col sm:flex-row sm:items-center justify-between gap-4",children:[e.jsxs("div",{children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("h2",{className:"text-2xl font-black text-white tracking-tight",children:"Qabul Bo'limi (LMS Qabul & Lidlar)"}),e.jsx("span",{className:"px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",children:"Yangi Oqim"})]}),e.jsx("p",{className:"text-xs text-slate-400 mt-1",children:"Yangi kelgan o'quvchilarni ro'yxatga olish, darsga kelganda holatini Aktivlashtirish, login/parol berish va guvohnomani chop etish"})]}),e.jsxs(m,{onClick:Le,className:"bg-brand-600 hover:bg-brand-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-brand-600/30 shrink-0",children:[e.jsx(At,{className:"w-4 h-4"}),"+ Yangi O'quvchi Qabuli"]})]}),e.jsxs("div",{className:"grid grid-cols-2 lg:grid-cols-4 gap-4",children:[e.jsxs(F,{className:"p-4 bg-slate-900/90 border-slate-800",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-xs font-semibold text-slate-400",children:"Jami Arizalar"}),e.jsx($e,{className:"w-5 h-5 text-brand-400"})]}),e.jsx("p",{className:"text-2xl font-black text-white mt-2",children:Fe}),e.jsx("p",{className:"text-[11px] text-slate-500 mt-1",children:"Barcha qabul ro'yxati"})]}),e.jsxs(F,{className:"p-4 bg-slate-900/90 border-slate-800",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-xs font-semibold text-amber-400",children:"Yangi / Kutilmoqda"}),e.jsx(St,{className:"w-5 h-5 text-amber-400"})]}),e.jsx("p",{className:"text-2xl font-black text-amber-400 mt-2",children:nt}),e.jsx("p",{className:"text-[11px] text-slate-500 mt-1",children:"Darsga kelishi kutilmoqda"})]}),e.jsxs(F,{className:"p-4 bg-slate-900/90 border-slate-800",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-xs font-semibold text-emerald-400",children:"Aktiv (Darsga kelgan)"}),e.jsx($,{className:"w-5 h-5 text-emerald-400"})]}),e.jsx("p",{className:"text-2xl font-black text-emerald-400 mt-2",children:rt}),e.jsx("p",{className:"text-[11px] text-slate-500 mt-1",children:"Login/parol berilganlar"})]}),e.jsxs(F,{className:"p-4 bg-slate-900/90 border-slate-800",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-xs font-semibold text-sky-400",children:"Bog'lanilganlar"}),e.jsx(Ge,{className:"w-5 h-5 text-sky-400"})]}),e.jsx("p",{className:"text-2xl font-black text-sky-400 mt-2",children:ot}),e.jsx("p",{className:"text-[11px] text-slate-500 mt-1",children:"Suhbatlashilgan o'quvchilar"})]})]}),e.jsxs("div",{className:"flex flex-col sm:flex-row gap-3",children:[e.jsxs("form",{onSubmit:Xe,className:"flex-1 flex gap-2",children:[e.jsx(y,{placeholder:"F.I.Sh, telefon yoki qiziqqan fan bo'yicha qidiruv...",value:f,onChange:t=>I(t.target.value),leftIcon:e.jsx(Ct,{className:"w-4 h-4"}),className:"bg-slate-900 border-slate-800 text-white"}),e.jsx(m,{type:"submit",children:"Qidirish"})]}),e.jsxs("select",{value:g,onChange:t=>P(t.target.value),className:"rounded-xl border border-slate-800 bg-slate-900 text-xs px-3 py-2 text-slate-300 focus:outline-none focus:border-brand-500",children:[e.jsxs("option",{value:"all",children:["Barcha holatlar (",Fe,")"]}),e.jsx("option",{value:"new",children:"Faqat yangi (Kutilmoqda)"}),e.jsx("option",{value:"contacted",children:"Bog'lanilgan"}),e.jsx("option",{value:"active",children:"Aktiv (Darsga kelgan / Login berilgan)"}),e.jsx("option",{value:"cancelled",children:"Rad etilgan"})]})]}),e.jsx(F,{className:"bg-slate-900 border-slate-800 overflow-hidden divide-y divide-slate-800",children:v?e.jsx("div",{className:"flex justify-center items-center py-20",children:e.jsx(ht,{size:"lg",className:"text-brand-500"})}):i.length===0?e.jsxs("div",{className:"p-12 text-center text-xs text-slate-500 space-y-2",children:[e.jsx($e,{className:"w-8 h-8 text-slate-600 mx-auto"}),e.jsx("p",{children:"Hozircha qabul qilingan o'quvchilar topilmadi"}),e.jsx(m,{size:"sm",onClick:Le,className:"mt-2",children:"Birinchi o'quvchini qo'shish"})]}):e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"w-full text-left text-xs",children:[e.jsx("thead",{className:"bg-slate-950 text-slate-400 uppercase tracking-wider font-bold text-[10px]",children:e.jsxs("tr",{children:[e.jsx("th",{className:"p-4",children:"O'quvchi (F.I.Sh)"}),e.jsx("th",{className:"p-4",children:"Aloqa"}),e.jsx("th",{className:"p-4",children:"Fan & Vaqt"}),e.jsx("th",{className:"p-4",children:"Holat (Status)"}),e.jsx("th",{className:"p-4",children:"Tizim Kirishi (Login / Parol)"}),e.jsx("th",{className:"p-4 text-right",children:"Amallar"})]})}),e.jsx("tbody",{className:"divide-y divide-slate-800",children:i.map(t=>{const d=t.status==="active";return e.jsxs("tr",{className:"hover:bg-slate-800/40 transition-colors",children:[e.jsx("td",{className:"p-4",children:e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"w-9 h-9 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-black text-sm",children:t.fullName.charAt(0).toUpperCase()}),e.jsxs("div",{children:[e.jsx("span",{className:"font-bold text-white text-sm block",children:t.fullName}),e.jsxs("div",{className:"flex items-center gap-2 mt-0.5",children:[e.jsxs("span",{className:"text-[10px] text-slate-500 font-mono",children:["#",t.id.slice(-6).toUpperCase()]}),e.jsx("span",{className:"text-[10px] text-slate-500",children:"•"}),e.jsx("span",{className:"text-[10px] text-slate-400",children:ee(t.createdAt)})]})]})]})}),e.jsxs("td",{className:"p-4 text-slate-300",children:[e.jsxs("div",{className:"flex items-center gap-1.5 font-mono text-[11px] font-semibold text-slate-200",children:[e.jsx(Ge,{className:"w-3.5 h-3.5 text-brand-400"}),t.phoneNumber]}),t.parentPhone&&e.jsxs("div",{className:"text-[10px] text-slate-400 mt-0.5",children:["Ota-ona: ",e.jsx("span",{className:"font-mono",children:t.parentPhone})]})]}),e.jsxs("td",{className:"p-4 text-slate-300",children:[e.jsxs("div",{className:"font-bold text-white flex items-center gap-1",children:[e.jsx(qt,{className:"w-3 h-3 text-amber-400"}),t.interestedSubject||"Umumiy"]}),e.jsxs("div",{className:"text-[10px] text-slate-400 mt-0.5",children:[t.preferredTime==="ertalab"?"Ertalab":t.preferredTime==="tushdan_keyin"?"Tushdan keyin":t.preferredTime==="kechki"?"Kechki":"Ixtiyoriy vaqt",t.notes?` • ${t.notes}`:""]})]}),e.jsxs("td",{className:"p-4",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(wt,{variant:lt(t.status),children:Be(t.status)}),e.jsxs("select",{value:t.status,onChange:u=>tt(t,u.target.value),className:"bg-slate-800 border border-slate-700 rounded-lg text-[10px] px-1.5 py-1 text-slate-300 hover:text-white",children:[e.jsx("option",{value:"new",children:"Yangi"}),e.jsx("option",{value:"contacted",children:"Bog'lanildi"}),e.jsx("option",{value:"active",children:"Aktiv (Darsga keldi)"}),e.jsx("option",{value:"cancelled",children:"Rad etildi"})]})]}),t.assignedGroupName&&e.jsxs("div",{className:"text-[10px] text-emerald-400 mt-1 font-semibold flex items-center gap-1",children:[e.jsx(Qe,{className:"w-3 h-3"}),t.assignedGroupName]})]}),e.jsx("td",{className:"p-4",children:d&&t.login?e.jsxs("div",{className:"space-y-1",children:[e.jsxs("div",{className:"flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded border border-slate-800 w-fit",children:[e.jsx("span",{className:"text-[10px] text-slate-400 font-medium",children:"Login:"}),e.jsx("span",{className:"text-xs font-mono font-bold text-amber-300",children:t.login}),e.jsx("button",{onClick:()=>_e(t.login,`log_${t.id}`),className:"text-slate-400 hover:text-white ml-1",title:"Loginni nusxalash",children:Oe===`log_${t.id}`?e.jsx(Ke,{className:"w-3 h-3 text-emerald-400"}):e.jsx(Re,{className:"w-3 h-3"})})]}),e.jsxs("div",{className:"flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded border border-slate-800 w-fit",children:[e.jsx("span",{className:"text-[10px] text-slate-400 font-medium",children:"Parol:"}),e.jsx("span",{className:"text-xs font-mono font-bold text-emerald-400",children:t.plainPassword||"********"}),t.plainPassword&&e.jsx("button",{onClick:()=>_e(t.plainPassword,`pass_${t.id}`),className:"text-slate-400 hover:text-white ml-1",title:"Parolni nusxalash",children:Oe===`pass_${t.id}`?e.jsx(Ke,{className:"w-3 h-3 text-emerald-400"}):e.jsx(Re,{className:"w-3 h-3"})})]})]}):e.jsx("span",{className:"text-[11px] text-slate-500 italic",children:"Darsga kelgach beriladi"})}),e.jsxs("td",{className:"p-4 text-right space-x-1.5 whitespace-nowrap",children:[d?e.jsxs(m,{size:"sm",variant:"secondary",onClick:()=>V(t),className:"bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-amber-500/30",title:"Printerdan chop etish",children:[e.jsx(oe,{className:"w-3.5 h-3.5 mr-1 text-amber-400"}),"Chop etish"]}):e.jsxs(m,{size:"sm",onClick:()=>De(t),className:"bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs",title:"O'quvchi darsga keldi - Aktivlashtirish va login/parol berish",children:[e.jsx($,{className:"w-3.5 h-3.5 mr-1"}),"Darsga keldi"]}),e.jsx(m,{size:"sm",variant:"ghost",onClick:()=>st(t),className:"text-slate-400 hover:text-white",title:"Tahrirlash",children:e.jsx(zt,{className:"w-3.5 h-3.5"})}),e.jsx(m,{size:"sm",variant:"ghost",onClick:()=>X(t),className:"text-rose-400 hover:bg-rose-500/10",title:"O'chirish",children:e.jsx(It,{className:"w-3.5 h-3.5"})})]})]},t.id)})})]})})}),e.jsx(E,{isOpen:L,onClose:()=>O(!1),title:"Yangi O'quvchini Qabul Qilish (Lid qo'shish)",maxWidth:"lg",children:e.jsxs("form",{onSubmit:Ze,className:"space-y-4",children:[e.jsx(y,{label:"O'quvchining F.I.Sh (To'liq ism-familiyasi) *",placeholder:"Masalan: Saidov Saidraximbek",value:w,onChange:t=>D(t.target.value),required:!0}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[e.jsx(y,{label:"Telefon raqami *",placeholder:"+998901234567",value:C,onChange:t=>_(t.target.value),required:!0}),e.jsx(y,{label:"Ota-onasi telefon raqami",placeholder:"+998912345678",value:K,onChange:t=>ce(t.target.value)})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-semibold text-slate-300 mb-1",children:"Qiziqqan fan / Kurs"}),e.jsx("select",{value:he,onChange:t=>pe(t.target.value),className:"w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white focus:outline-none focus:border-brand-500",children:h.length>0?e.jsxs(e.Fragment,{children:[e.jsx("option",{value:"",children:"Fanni tanlang..."}),h.map(t=>e.jsx("option",{value:t.name,children:t.name},t.subjectId))]}):e.jsx("option",{value:"",disabled:!0,children:"Mavjud fanlar topilmadi"})}),h.length===0&&e.jsx("p",{className:"text-[10px] text-amber-400 mt-1",children:`* Tizimda hali fanlar mavjud emas ("Fanlar Boshqaruvi" bo'limidan qo'shishingiz mumkin)`})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-semibold text-slate-300 mb-1",children:"Ma'qul keladigan vaqt"}),e.jsxs("select",{value:ue,onChange:t=>be(t.target.value),className:"w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white focus:outline-none focus:border-brand-500",children:[e.jsx("option",{value:"farqi_yoq",children:"Farqi yo'q (Ixtiyoriy)"}),e.jsx("option",{value:"ertalab",children:"Ertalab (08:00 - 12:00)"}),e.jsx("option",{value:"tushdan_keyin",children:"Tushdan keyin (13:00 - 17:00)"}),e.jsx("option",{value:"kechki",children:"Kechki (17:00 - 20:00)"})]})]})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[e.jsx(y,{label:"Yoshi yoki Maktab/Sinfi",placeholder:"Masalan: 15 yosh yoki 9-sinf",value:xe,onChange:t=>me(t.target.value)}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-semibold text-slate-300 mb-1",children:"Qayerdan bildi (Manba)"}),e.jsxs("select",{value:ge,onChange:t=>fe(t.target.value),className:"w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white focus:outline-none focus:border-brand-500",children:[e.jsx("option",{value:"telegram",children:"Telegram kanali"}),e.jsx("option",{value:"instagram",children:"Instagram"}),e.jsx("option",{value:"tavsiya",children:"Tanish / Do'st tavsiyasi"}),e.jsx("option",{value:"banner",children:"Tashqi reklama / Banner"}),e.jsx("option",{value:"boshqa",children:"Boshqa"})]})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-semibold text-slate-300 mb-1",children:"Qo'shimcha izoh / Ma'lumot"}),e.jsx("textarea",{rows:2,placeholder:"Qo'shimcha istaklar, bilim darajasi yoki eslatmalar...",value:je,onChange:t=>ve(t.target.value),className:"w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white focus:outline-none focus:border-brand-500"})]}),e.jsxs("div",{className:"flex items-center justify-end gap-3 pt-3 border-t border-slate-800",children:[e.jsx(m,{variant:"outline",type:"button",onClick:()=>O(!1),children:"Bekor qilish"}),e.jsx(m,{isLoading:Q,type:"submit",className:"bg-brand-600 hover:bg-brand-500",children:"Qabulga Qo'shish"})]})]})}),e.jsx(E,{isOpen:!!k,onClose:()=>R(null),title:"O'quvchini Aktivlashtirish & Login-Parol Berish",maxWidth:"lg",children:k&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20",children:[e.jsxs("div",{className:"flex items-center gap-2 text-emerald-400 font-bold text-sm",children:[e.jsx($,{className:"w-5 h-5"}),e.jsx("span",{children:"O'quvchi darsga keldi!"})]}),e.jsxs("p",{className:"text-xs text-slate-300 mt-1",children:["Foydalanuvchi: ",e.jsx("strong",{className:"text-white",children:k.fullName})," (",k.phoneNumber,")"]}),e.jsx("p",{className:"text-[11px] text-slate-400 mt-0.5",children:"Quyidagi login va parol orqali o'quvchi platformaga kira oladi. Saqlangandan so'ng darhol chop etish varaqasi ochiladi."})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-2 gap-3",children:[e.jsxs("div",{children:[e.jsxs("label",{className:"block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5",children:[e.jsx(de,{className:"w-3.5 h-3.5 text-amber-400"}),"Biriktiriladigan Login *"]}),e.jsx("input",{type:"text",value:Y,onChange:t=>we(t.target.value.toLowerCase().replace(/\s/g,"")),placeholder:"masalan: alisher_4821",className:"w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white font-mono focus:outline-none focus:border-brand-500",required:!0}),e.jsxs("span",{className:"text-[10px] text-slate-500 mt-1 block",children:["Email: ",Y||"login","@fargoniy.uz"]})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5",children:[e.jsx(de,{className:"w-3.5 h-3.5 text-emerald-400"}),"Birinchi kirish paroli *"]}),e.jsx("input",{type:"text",value:H,onChange:t=>ke(t.target.value),placeholder:"kamida 6 ta belgi",className:"w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white font-mono focus:outline-none focus:border-brand-500",required:!0}),e.jsx("span",{className:"text-[10px] text-slate-500 mt-1 block",children:"O'quvchi o'z profilida parolni o'zgartira oladi"})]})]}),e.jsxs("div",{children:[e.jsxs("label",{className:"block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5",children:[e.jsx(Qe,{className:"w-3.5 h-3.5 text-brand-400"}),"Guruhga biriktirish (Ixtiyoriy)"]}),e.jsxs("select",{value:W,onChange:t=>ye(t.target.value),className:"w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white focus:outline-none focus:border-brand-500",children:[e.jsx("option",{value:"",children:"Hozircha guruhsiz (Keyinroq biriktirish)"}),r.map(t=>e.jsxs("option",{value:t.groupId,children:[t.name," (",t.teacherName||t.subjectId||"Guruh",") [",t.currentStudentsCount||0," o'quvchi]"]},t.groupId))]})]}),e.jsxs("div",{className:"flex items-center justify-end gap-3 pt-3 border-t border-slate-800",children:[e.jsx(m,{variant:"outline",onClick:()=>R(null),children:"Bekor qilish"}),e.jsxs(m,{isLoading:We,onClick:et,className:"bg-emerald-600 hover:bg-emerald-500 text-white font-bold",children:[e.jsx($,{className:"w-4 h-4 mr-1.5"}),"Aktivlashtirish va Login Berish"]})]})]})}),e.jsx(E,{isOpen:!!te,onClose:()=>V(null),title:"O'quvchi Qabul Cheki (Login & Parol)",maxWidth:"lg",children:te&&e.jsx(Tt,{admission:te,onClose:()=>V(null)})}),e.jsx(E,{isOpen:!!B,onClose:()=>J(null),title:"Ariza Ma'lumotlarini Tahrirlash",children:B&&e.jsxs("form",{onSubmit:at,className:"space-y-4",children:[e.jsx(y,{label:"O'quvchining F.I.Sh",value:se,onChange:t=>Se(t.target.value),required:!0}),e.jsxs("div",{className:"grid grid-cols-2 gap-3",children:[e.jsx(y,{label:"Telefon",value:ae,onChange:t=>Ce(t.target.value),required:!0}),e.jsx(y,{label:"Ota-ona telefoni",value:ie,onChange:t=>qe(t.target.value)})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-semibold text-slate-300 mb-1",children:"Fan / Yo'nalish"}),e.jsx("select",{value:le,onChange:t=>ze(t.target.value),className:"w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white focus:outline-none focus:border-brand-500",children:h.length>0?e.jsxs(e.Fragment,{children:[e.jsx("option",{value:"",children:"Fanni tanlang..."}),h.map(t=>e.jsx("option",{value:t.name,children:t.name},t.subjectId))]}):e.jsx("option",{value:"",disabled:!0,children:"Mavjud fanlar topilmadi"})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-xs font-semibold text-slate-300 mb-1",children:"Izoh"}),e.jsx("textarea",{rows:2,value:ne,onChange:t=>Ie(t.target.value),className:"w-full rounded-xl border border-slate-700 bg-slate-800 text-xs p-3 text-white focus:outline-none focus:border-brand-500"})]}),e.jsxs("div",{className:"flex items-center justify-end gap-3 pt-3 border-t border-slate-800",children:[e.jsx(m,{variant:"outline",type:"button",onClick:()=>J(null),children:"Bekor qilish"}),e.jsx(m,{isLoading:Ve,type:"submit",children:"Saqlash"})]})]})}),e.jsx(E,{isOpen:!!T,onClose:()=>X(null),title:"Arizani O'chirish",children:T&&e.jsxs("div",{className:"space-y-4",children:[e.jsxs("p",{className:"text-xs text-slate-300 leading-relaxed",children:["Haqiqatan ham ",e.jsx("strong",{className:"text-white",children:T.fullName})," nomli qabul arizasini o'chirmoqchimisiz?"]}),e.jsxs("div",{className:"flex items-center justify-end gap-3 pt-3 border-t border-slate-800",children:[e.jsx(m,{variant:"outline",onClick:()=>X(null),children:"Bekor qilish"}),e.jsx(m,{variant:"danger",isLoading:Je,onClick:it,children:"O'chirish"})]})]})})]})};export{Kt as AdminAdmissionsPage,Kt as default};
