import{l as I,R as S,j as e}from"./index-Y7lCIjbZ.js";import{r as A}from"./vendor-react-D785DYxF.js";import{M as R}from"./Modal-c5gKMyYJ.js";import{B as H}from"./Button-CthqgDZE.js";import{c as q,I as D,aB as Z}from"./vendor-icons-DefnnMfA.js";function s(i){return(i||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}const Y=({isOpen:i,onClose:r,payment:a})=>{var v;const V=A.useRef(null);if(!a)return null;const c=a.studentName||"O'quvchi",d=a.groupName||"O'quv guruhi",m=a.note||(a.month?`${a.month} oy to'lovi`:"Oy to'lovi"),p=(((v=a.receiptNumber)==null?void 0:v.replace(/^FM-?/i,""))||Date.now().toString().slice(-6)).padStart(6,"0"),x=a.paymentMethod||"Naqd",n=a.paymentDate?new Date(a.paymentDate):new Date,o=`${String(n.getDate()).padStart(2,"0")}.${String(n.getMonth()+1).padStart(2,"0")}.${n.getFullYear()}`,h=new Date().toLocaleTimeString("uz-UZ",{hour:"2-digit",minute:"2-digit"}),f=Number(a.amount)||0,g=`${I(f)} so'm`,b=`(${S(f)})`,z=()=>{var k;const M=s(c),T=s(d),C=s(m),u=s(p),$=s(x),w=s(o),B=s(h),F=s(g),O=s(b),E=`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Chek_${u}</title>
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
      <span>Chek №: <span class="meta-num">${u}</span></span>
      <span>${w}&nbsp;&nbsp;&nbsp;&nbsp;${B}</span>
    </div>

    <div class="solid-divider"></div>

    <!-- Ma'lumotlar jadvali -->
    <table class="data-table">
      <tr>
        <td class="label-col">O'quvchi</td>
        <td class="colon-col">:</td>
        <td class="val-col">${M}</td>
      </tr>
      <tr>
        <td class="label-col">Guruh</td>
        <td class="colon-col">:</td>
        <td class="val-col">${T}</td>
      </tr>
      <tr>
        <td class="label-col">To'lov turi</td>
        <td class="colon-col">:</td>
        <td class="val-col">${C}</td>
      </tr>
      <tr>
        <td class="label-col">To'lov sanasi</td>
        <td class="colon-col">:</td>
        <td class="val-col">${w}</td>
      </tr>
      <tr>
        <td class="label-col">To'lov usuli</td>
        <td class="colon-col">:</td>
        <td class="val-col">${$}</td>
      </tr>
    </table>

    <div class="solid-divider"></div>

    <!-- Summa qismi -->
    <div class="amount-box">
      <div class="amount-left">
        <div class="amount-label">To'langan summa</div>
        <div class="amount-words">${O}</div>
      </div>
      <div class="amount-val">${F}</div>
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
</html>`,j=document.getElementById("thermal-receipt-iframe");j&&j.remove();const t=document.createElement("iframe");t.id="thermal-receipt-iframe",t.style.position="fixed",t.style.top="0",t.style.left="0",t.style.width="58mm",t.style.height="100%",t.style.border="none",t.style.opacity="0",t.style.pointerEvents="none",t.style.zIndex="-9999",document.body.appendChild(t);const l=(k=t.contentWindow)==null?void 0:k.document;l?(l.open(),l.write(E),l.close(),setTimeout(()=>{var N,y;try{(N=t.contentWindow)==null||N.focus(),(y=t.contentWindow)==null||y.print()}finally{setTimeout(()=>{document.body.contains(t)&&document.body.removeChild(t)},3e3)}},200)):window.print()};return e.jsx(R,{isOpen:i,onClose:r,title:"To'lov Cheki (58mm)",maxWidth:"sm",children:e.jsxs("div",{className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center justify-between px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx(q,{className:"w-4 h-4 text-emerald-400 shrink-0"}),e.jsx("span",{className:"font-semibold",children:"58mm Termal Chek"})]}),e.jsx("span",{className:"text-[11px] bg-emerald-500/20 px-2.5 py-0.5 rounded font-mono font-bold",children:"58mm"})]}),e.jsx("div",{className:"flex justify-center p-3 bg-slate-950/60 rounded-xl border border-slate-800",children:e.jsxs("div",{id:"printable-thermal-receipt",ref:V,className:"w-[58mm] max-w-[58mm] bg-white text-black rounded-sm shadow-2xl select-none relative overflow-hidden",style:{width:"58mm",maxWidth:"58mm",boxSizing:"border-box",fontFamily:"'Segoe UI', Arial, sans-serif"},children:[e.jsx("div",{className:"w-full overflow-hidden leading-none h-[6px] bg-slate-950/60",children:e.jsx("svg",{viewBox:"0 0 100 6",preserveAspectRatio:"none",className:"w-full h-[6px] block",children:e.jsx("polygon",{points:"0,6 2.5,0 5,6 7.5,0 10,6 12.5,0 15,6 17.5,0 20,6 22.5,0 25,6 27.5,0 30,6 32.5,0 35,6 37.5,0 40,6 42.5,0 45,6 47.5,0 50,6 52.5,0 55,6 57.5,0 60,6 62.5,0 65,6 67.5,0 70,6 72.5,0 75,6 77.5,0 80,6 82.5,0 85,6 87.5,0 90,6 92.5,0 95,6 97.5,0 100,6",fill:"#ffffff"})})}),e.jsxs("div",{className:"p-3 pt-2",children:[e.jsx("div",{className:"text-center mb-1",children:e.jsx("svg",{width:"42",height:"42",viewBox:"0 0 120 120",fill:"none",className:"mx-auto",children:e.jsxs("g",{transform:"translate(60, 60) rotate(-45) translate(-60, -60)",children:[e.jsx("path",{d:"M16 16H66V34H36V50H60V66H36V104H16V16Z",fill:"#0B3E91"}),e.jsx("path",{d:"M72 16H104V104H44V88H86V72H72V16Z",fill:"#F26522"}),e.jsx("path",{d:"M44 50H68V66H44V50Z",fill:"#F26522"})]})})}),e.jsxs("div",{className:"text-center",children:[e.jsx("div",{className:"text-[17px] font-black text-black leading-tight tracking-tight",children:"Farg'oniy Maktabi"}),e.jsx("div",{className:"text-[11px] font-black uppercase tracking-widest text-black mt-0.5",children:"O'QUV MARKAZI"}),e.jsx("div",{className:"text-[10px] italic font-semibold text-black mt-0.5 mb-1.5",children:"Bilim – kelajak kaliti!"})]}),e.jsx("div",{className:"border-t-[1.5px] border-black my-1.5"}),e.jsx("div",{className:"text-center text-[16px] font-black tracking-wide text-black my-0.5 uppercase",children:"TO'LOV CHEKI"}),e.jsxs("div",{className:"flex justify-between items-baseline text-[11px] font-bold text-black px-0.5 my-1",children:[e.jsxs("span",{children:["Chek №: ",e.jsx("strong",{className:"font-black text-[12.5px]",children:p})]}),e.jsxs("span",{className:"font-extrabold text-[11px]",children:[o,"    ",h]})]}),e.jsx("div",{className:"border-t-[1.5px] border-black my-1.5"}),e.jsxs("div",{className:"text-[11.5px] space-y-1 text-black py-0.5",children:[e.jsxs("div",{className:"flex items-start",children:[e.jsx("span",{className:"w-[32%] font-bold shrink-0",children:"O'quvchi"}),e.jsx("span",{className:"w-[7%] font-black text-center",children:":"}),e.jsx("span",{className:"w-[61%] font-extrabold break-words pl-1",children:c})]}),e.jsxs("div",{className:"flex items-start",children:[e.jsx("span",{className:"w-[32%] font-bold shrink-0",children:"Guruh"}),e.jsx("span",{className:"w-[7%] font-black text-center",children:":"}),e.jsx("span",{className:"w-[61%] font-extrabold break-words pl-1",children:d})]}),e.jsxs("div",{className:"flex items-start",children:[e.jsx("span",{className:"w-[32%] font-bold shrink-0",children:"To'lov turi"}),e.jsx("span",{className:"w-[7%] font-black text-center",children:":"}),e.jsx("span",{className:"w-[61%] font-extrabold break-words pl-1",children:m})]}),e.jsxs("div",{className:"flex items-start",children:[e.jsx("span",{className:"w-[32%] font-bold shrink-0",children:"To'lov sanasi"}),e.jsx("span",{className:"w-[7%] font-black text-center",children:":"}),e.jsx("span",{className:"w-[61%] font-extrabold pl-1",children:o})]}),e.jsxs("div",{className:"flex items-start",children:[e.jsx("span",{className:"w-[32%] font-bold shrink-0",children:"To'lov usuli"}),e.jsx("span",{className:"w-[7%] font-black text-center",children:":"}),e.jsx("span",{className:"w-[61%] font-extrabold pl-1",children:x})]})]}),e.jsx("div",{className:"border-t-[1.5px] border-black my-1.5"}),e.jsxs("div",{className:"flex justify-between items-end py-1 px-0.5",children:[e.jsxs("div",{children:[e.jsx("div",{className:"text-[12px] font-black text-black",children:"To'langan summa"}),e.jsx("div",{className:"text-[9.5px] font-bold text-black mt-0.5 leading-tight",children:b})]}),e.jsx("div",{className:"text-[17px] font-black text-black text-right whitespace-nowrap",children:g})]}),e.jsx("div",{className:"border-t-[1.5px] border-black my-1.5"}),e.jsxs("div",{className:"text-center pt-1 text-black",children:[e.jsxs("p",{className:"text-[11.5px] font-bold leading-tight",children:["Bizni tanlaganingiz uchun",e.jsx("br",{}),"rahmat!"]}),e.jsxs("div",{className:"flex items-center justify-center gap-2 my-1.5",children:[e.jsx("span",{className:"w-9 h-[1px] bg-black inline-block"}),e.jsx("span",{className:"text-[14px] leading-none",children:"👌"}),e.jsx("span",{className:"w-9 h-[1px] bg-black inline-block"})]}),e.jsxs("div",{className:"flex items-center justify-center gap-1.5 text-[14px] font-black tracking-tight",children:[e.jsx("svg",{width:"13",height:"13",viewBox:"0 0 24 24",fill:"currentColor",className:"shrink-0",children:e.jsx("path",{d:"M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.44-5.15-3.75-6.59-6.59l1.97-1.57c.28-.28.37-.67.25-1.02A11.36 11.36 0 0 1 8.57 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.57c0-.55-.45-1-1-.05z"})}),e.jsx("span",{children:"+998 959 252 200"})]}),e.jsx("p",{className:"text-[10px] font-semibold my-0.5",children:"yoki"}),e.jsx("div",{className:"text-[14px] font-black tracking-tight",children:"+998 558 122 200"})]})]}),e.jsx("div",{className:"w-full overflow-hidden leading-none h-[6px] bg-slate-950/60",children:e.jsx("svg",{viewBox:"0 0 100 6",preserveAspectRatio:"none",className:"w-full h-[6px] block",children:e.jsx("polygon",{points:"0,0 2.5,6 5,0 7.5,6 10,0 12.5,6 15,0 17.5,6 20,0 22.5,6 25,0 27.5,6 30,0 32.5,6 35,0 37.5,6 40,0 42.5,6 45,0 47.5,6 50,0 52.5,6 55,0 57.5,6 60,0 62.5,6 65,0 67.5,6 70,0 72.5,6 75,0 77.5,6 80,0 82.5,6 85,0 87.5,6 90,0 92.5,6 95,0 97.5,6 100,0",fill:"#ffffff"})})})]})}),e.jsxs("div",{className:"flex items-start gap-2 p-2.5 bg-slate-800/60 rounded-lg text-slate-400 text-[11px] leading-relaxed border border-slate-700/50",children:[e.jsx(D,{className:"w-4 h-4 text-brand-400 shrink-0 mt-0.5"}),e.jsxs("span",{children:["Printer oynasida ",e.jsx("strong",{children:"More settings > Headers and footers"})," belgisi o'chiq ekanligiga ishonch hosil qiling."]})]}),e.jsxs("div",{className:"flex items-center justify-between pt-1",children:[e.jsx(H,{variant:"outline",onClick:r,children:"Yopish"}),e.jsx(H,{onClick:z,leftIcon:e.jsx(Z,{className:"w-4 h-4"}),children:"Chop etish (58mm)"})]})]})})};export{Y as P};
