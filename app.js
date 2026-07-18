
const STORE_KEY="bearTravelPlanner_v25";
const OLD_KEYS=["bearTravelPlanner_v24","bearTravelPlanner_v23","bearTravelPlanner_v22","bearTravelPlanner_v21","bearTravelPlanner_v20","bearTravelPlanner_v19","bearTravelPlanner_v18","bearTravelPlanner_v17","bearTravelPlanner_v16","bearTravelPlanner_v15","bearTravelPlanner_v14","bearTravelPlanner_v13","bearTravelPlanner_v12","bearTravelPlanner_v11","bearTravelPlanner_v10","bearTravelPlanner_v5","bearTravelPlanner_v3","bearTravelPlanner_v2_full","bearTravelPlanner_v1_full","bearTravelPlannerV4","bearMultiTripV3","bearMultiTrip"];
const types=["🏯 景點","🏨 住宿","🍜 美食","🛍 購物","☕ 咖啡廳"];
const transports=["🚗 開車","🚶‍♀️ 走路","🚕 計程車","🚆 大眾交通","🚌 巴士"];
const currencies=["JPY","TWD","KRW","THB","USD","EUR"];
const week=["Sun.","Mon.","Tue.","Wed.","Thu.","Fri.","Sat."];
let state=loadState(), currentTripId=state.trips[0]?.id||null, currentTab=0, filterType="全部", dragInfo=null;

const app=document.getElementById("app"), tabsEl=document.getElementById("tabs"), subtitle=document.getElementById("subtitle"), mainTitle=document.getElementById("mainTitle"), modal=document.getElementById("modal"), modalBody=document.getElementById("modalBody"), backToTrips=document.getElementById("backToTrips");
backToTrips.onclick=()=>{currentTripId=null;currentTab=0;render()}; modal.onclick=e=>{if(e.target.id==="modal")closeModal()};

function defTrip(){return {id:Date.now()+Math.random(),name:"🍁 福岡 Autumn",date:"2026.10.10－10.14",startDate:"2026-10-10",members:["爸爸","媽媽","弟弟","妹妹","🐻","👦🏻"],mainCurrency:"JPY",rates:{JPY:.21,TWD:1,KRW:.023,THB:.9},flight:{go:{airline:"",no:"",from:"TPE",to:"FUK",time:"",duration:"",terminal:"",note:""},back:{airline:"",no:"",from:"FUK",to:"TPE",time:"",duration:"",terminal:"",note:""}},days:Array.from({length:5},()=>[]),expenses:[],splits:[],buy:[],dayMeta:[],notes:[],luggage:[],tickets:[]}}
function loadState(){try{let raw=localStorage.getItem(STORE_KEY); if(!raw){for(const k of OLD_KEYS){raw=localStorage.getItem(k);if(raw)break}} const s=raw?JSON.parse(raw):{trips:[defTrip()]}; if(!s.trips?.length)s.trips=[defTrip()]; s.trips.forEach(norm); return s}catch{return{trips:[defTrip()]}}}
function norm(t){t.members||=[];t.mainCurrency||="JPY";t.rates||={JPY:.21,TWD:1,KRW:.023,THB:.9};t.days=(t.days&&t.days.length)?t.days:[[],[],[],[],[]];t.expenses||=[];t.splits||=[];t.buy||=[];t.dayMeta||=[];t.notes||=[];t.luggage||=[];t.tickets||=[];while(t.dayMeta.length<t.days.length)t.dayMeta.push({weather:"",outfit:""});t.startDate=t.startDate||parseStartDate(t.date)||""; if(!t.flight)t.flight=defTrip().flight; if(typeof t.flight.go==="string")t.flight=defTrip().flight; ["go","back"].forEach(k=>{t.flight[k]||={};Object.assign(t.flight[k],{airline:t.flight[k].airline||"",no:t.flight[k].no||"",from:t.flight[k].from||(k==="go"?"TPE":"FUK"),to:t.flight[k].to||(k==="go"?"FUK":"TPE"),time:t.flight[k].time||"",duration:t.flight[k].duration||"",terminal:t.flight[k].terminal||"",note:t.flight[k].note||""})})}
function parseStartDate(str){const m=String(str||"").match(/(\d{4})[.\/-](\d{1,2})[.\/-](\d{1,2})/);if(!m)return "";return `${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`}
function save(){localStorage.setItem(STORE_KEY,JSON.stringify(state))}
function trip(){return state.trips.find(t=>t.id==currentTripId)}
function esc(s){return String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}
function fmtTime(v){v=String(v||"").trim(); if(/^\d{3,4}$/.test(v)){v=v.padStart(4,"0"); return v.slice(0,2)+":"+v.slice(2)} return v}
function readImage(input,cb){
  const f=input.files&&input.files[0];
  if(!f)return cb("");
  const r=new FileReader();
  r.onload=()=>{
    const im=new Image();
    im.onload=()=>{
      const max=900;
      let w=im.width,h=im.height;
      if(w>h&&w>max){h=Math.round(h*max/w);w=max}
      if(h>=w&&h>max){w=Math.round(w*max/h);h=max}
      const canvas=document.createElement("canvas");
      canvas.width=w;canvas.height=h;
      const ctx=canvas.getContext("2d");
      ctx.drawImage(im,0,0,w,h);
      cb(canvas.toDataURL("image/jpeg",0.72));
    };
    im.onerror=()=>cb(r.result);
    im.src=r.result;
  };
  r.readAsDataURL(f);
}
function toTWD(a,c){return Math.round(Number(a||0)*(trip().rates[c]||1))}
function toTripCurrency(a,c){
  const t=trip(), main=t.mainCurrency||"JPY", cur=c||main;
  const n=Number(a||0);
  if(cur===main)return n;
  const twd=n*(t.rates[cur]||1);
  const mainRate=t.rates[main]||1;
  return mainRate? twd/mainRate : n;
}
function moneyTextTrip(a,c){
  const t=trip(), main=t.mainCurrency||"JPY", cur=c||main;
  const mainAmount=toTripCurrency(a,cur);
  const twd=toTWD(a,cur);
  const original=cur!==main?`<p class="small muted">原始金額：${fmtMoney(a,cur)}</p>`:"";
  return `<div class="money">${fmtMoney(mainAmount,main)}</div><p class="small">約 NT$ ${Math.round(twd).toLocaleString()}</p>${original}`;
}
function fmtMoney(a,c){
  const cur=c||trip().mainCurrency||"JPY", n=Number(a||0);
  const symbol={JPY:"¥",TWD:"NT$",KRW:"₩",THB:"฿",USD:"US$",EUR:"€"}[cur]||cur+" ";
  return `${symbol}${Math.round(n).toLocaleString()}`;
}
function moneyText(a,c){
  const cur=c||trip().mainCurrency||"JPY";
  return `<div class="money">${fmtMoney(a,cur)}</div><p class="small">約 NT$ ${toTWD(a,cur).toLocaleString()}</p>`;
}
function perPersonAmount(x){return (Number(x.amount||0)/(x.people?.length||1))}
function parseMoneyLike(s){
  const cleaned=String(s||"").replace(/[,，]/g,"");
  const m=cleaned.match(/(?:¥|￥|NT\$?|TWD|JPY)?\s*([0-9]+(?:\.[0-9]+)?)/i);
  return m?Number(m[1]):0;
}
function openModal(h){modalBody.innerHTML=h;modal.classList.remove("hidden")}function closeModal(){modal.classList.add("hidden");modalBody.innerHTML=""}
function previewImage(src){if(!src)return;openModal(`<h2>圖片預覽</h2><img class="full-preview" src="${src}"><p class="small">點空白處可關閉。</p>`)}
function imgAttrs(src){return `onclick="previewImage('${src}')" oncontextmenu="event.preventDefault();previewImage('${src}');return false"`}
function tabs(){if(!currentTripId)return["旅程"];const t=trip();return["總覽","航班",...t.days.map((_,i)=>`Day ${i+1}`),"記帳","分攤","必買","票券","搜尋","備忘","行李","工具"]}
function renderTabs(){tabsEl.innerHTML=tabs().map((x,i)=>`<button class="${i===currentTab?'active':''}" onclick="setTab(${i})">${x}</button>`).join("")}
function setTab(i){currentTab=i;filterType="全部";render()}
function render(){save();renderTabs();const t=trip();backToTrips.classList.toggle("hidden",!currentTripId);if(mainTitle){mainTitle.innerHTML=currentTripId?`<span class="title-name">${esc(t.name)}</span><span class="title-date">${esc(t.date||"未設定日期")}</span>`:`<span class="title-name">🍁 Bear Travel Planner</span>`;}if(subtitle)subtitle.textContent="";if(!currentTripId){app.innerHTML=tripList();return} if(currentTab===0)app.innerHTML=overview();else if(currentTab===1)app.innerHTML=flight();else if(currentTab>=2&&currentTab<2+t.days.length)app.innerHTML=day(currentTab-2);else if(currentTab===2+t.days.length)app.innerHTML=expenses();else if(currentTab===3+t.days.length)app.innerHTML=splits();else if(currentTab===4+t.days.length)app.innerHTML=buy();else if(currentTab===5+t.days.length)app.innerHTML=ticketsPage();else if(currentTab===6+t.days.length)app.innerHTML=searchPage();else if(currentTab===7+t.days.length)app.innerHTML=notesPage();else if(currentTab===8+t.days.length)app.innerHTML=luggagePage();else app.innerHTML=toolsPage()}
function dayDate(i){if(!trip().startDate)return{w:"DAY",d:`Day ${i+1}`,full:`Day ${i+1}`};const d=new Date(trip().startDate+"T00:00:00");d.setDate(d.getDate()+i);return{w:week[d.getDay()],d:`${d.getDate()}`,full:`${d.getMonth()+1}/${d.getDate()}`}}
function itemClass(x){const s=x.type||"";if(s.includes("住宿"))return"stay";if(s.includes("美食"))return"food";if(s.includes("購物"))return"shop";if(s.includes("咖啡"))return"cafe";return""}
function typeIcon(x){const s=x||"";if(s.includes("住宿"))return"🏨";if(s.includes("美食"))return"🍜";if(s.includes("購物"))return"🛍";if(s.includes("咖啡"))return"☕";return"🏯"}

/* touch drag */
function startTouchDrag(e,d,i){dragInfo={d,i,el:e.currentTarget};e.currentTarget.classList.add("dragging")}
function moveTouchDrag(e){e.preventDefault();const t=e.touches[0],el=document.elementFromPoint(t.clientX,t.clientY);document.querySelectorAll(".drop-target").forEach(x=>x.classList.remove("drop-target"));const card=el&&el.closest&&el.closest(".it-card");if(card)card.classList.add("drop-target")}
function endTouchDrag(e){const t=e.changedTouches[0],el=document.elementFromPoint(t.clientX,t.clientY),card=el&&el.closest&&el.closest(".it-card");document.querySelectorAll(".drop-target").forEach(x=>x.classList.remove("drop-target"));if(dragInfo?.el)dragInfo.el.classList.remove("dragging");if(card&&dragInfo){const to=Number(card.dataset.idx);moveTo(dragInfo.d,dragInfo.i,to)}dragInfo=null}

/* trips */
function tripList(){return `<section class="trip-list-head compact"><button class="btn primary create-trip-btn" onclick="openTripCreate()">＋ 新增旅程</button></section>${state.trips.map((t,i)=>`<section class="card trip-card"><div class="trip-card-main" onclick="currentTripId=${t.id};currentTab=0;render()"><span class="trip-card-tag">${t.days.length} DAYS</span><h2>${esc(t.name)}</h2><p>${esc(t.date||'尚未設定日期')}</p><p class="small">${t.mainCurrency||"JPY"}｜${t.members.join("、")||'尚未設定旅伴'}</p></div><div class="trip-card-actions"><button class="btn" onclick="editTrip(${i})">編輯</button><button class="btn danger" onclick="delTrip(${i})">刪除</button></div></section>`).join("")}`}
function openTripCreate(){openModal(`<h2>新增旅程</h2><input id="tn" placeholder="旅程名稱"><input id="td" placeholder="日期顯示，例如 2026.10.10－10.14"><input id="ts" type="date"><input id="tm" placeholder="旅伴，用逗號分隔"><input id="tnum" type="number" min="1" value="5" placeholder="天數"><select id="tc"><option value="JPY">日幣 JPY</option><option value="TWD">台幣 TWD</option><option value="KRW">韓幣 KRW</option><option value="THB">泰幣 THB</option><option value="USD">美金 USD</option><option value="EUR">歐元 EUR</option></select><button class="btn primary" onclick="addTrip()">建立旅程</button><button class="btn" onclick="closeModal()">取消</button>`)}
function addTrip(){const t=defTrip();t.name=tn.value||"未命名旅程";t.date=td.value||"";t.startDate=ts.value||"";t.mainCurrency=tc.value;t.members=tm.value?tm.value.split(",").map(x=>x.trim()).filter(Boolean):[];t.days=Array.from({length:Math.max(1,Number(tnum.value||5))},()=>[]);state.trips.push(t);currentTripId=t.id;currentTab=0;closeModal();render()}
function editTrip(i){const t=state.trips[i];openModal(`<h2>編輯旅程</h2><input id="en" value="${esc(t.name)}"><input id="ed" value="${esc(t.date)}"><input id="es" type="date" value="${esc(t.startDate)}"><input id="em" value="${esc(t.members.join(","))}"><select id="ec">${currencies.map(c=>`<option value="${c}" ${c===(t.mainCurrency||"JPY")?"selected":""}>${c}</option>`).join("")}</select><button class="btn primary" onclick="state.trips[${i}].name=en.value;state.trips[${i}].date=ed.value;state.trips[${i}].startDate=es.value;state.trips[${i}].members=em.value.split(',').map(x=>x.trim()).filter(Boolean);state.trips[${i}].mainCurrency=ec.value;closeModal();render()">儲存</button>`)}
function delTrip(i){if(state.trips.length<=1)return alert("至少保留一趟旅程");if(confirm("刪除旅程？")){state.trips.splice(i,1);currentTripId=state.trips[0].id;render()}}

/* overview */
function overview(){const t=trip();return `<section class="trip-hero"><h2>${esc(t.name)}</h2><p>${esc(t.date)}</p><p>${t.days.length}天｜${t.members.length}位旅伴｜${t.days.flat().length}個行程｜${t.mainCurrency}</p></section><section class="card"><h3>旅伴設定</h3><input id="members" value="${esc(t.members.join(","))}"><button class="btn primary" onclick="trip().members=members.value.split(',').map(x=>x.trim()).filter(Boolean);render()">更新旅伴</button><h3>主要幣別</h3><select id="mainCur">${currencies.map(c=>`<option value="${c}" ${c===(t.mainCurrency||"JPY")?"selected":""}>${c}</option>`).join("")}</select><button class="btn primary" onclick="trip().mainCurrency=mainCur.value;render()">更新幣別</button><h3>天數設定</h3><button class="btn dark" onclick="trip().days.push([]);render()">＋增加一天</button><button class="btn danger" onclick="removeDay()">－減少一天</button></section>`}
function removeDay(){if(trip().days.length<=1)return;if(confirm("刪除最後一天？")){trip().days.pop();render()}}

/* flight */
function flight(){const f=trip().flight;return `<section class="card"><h2>✈️ 航班頁</h2><div class="flight-edit-card">${flightBlock("去程",f.go)}<div class="flight-edit-actions"><button class="btn primary" onclick="editFlight('go')">編輯去程</button></div></div><div class="flight-edit-card">${flightBlock("回程",f.back)}<div class="flight-edit-actions"><button class="btn primary" onclick="editFlight('back')">編輯回程</button></div></div></section>`}
function flightBlock(title,x){return `<h3>${title}</h3><div class="flight-card compact"><div class="flight-brand"><span>${esc(x.airline||"航空公司")}</span><b>${esc(x.no||"航班號")}</b></div><div class="flight-route"><div><div class="airport">${esc(x.from||"TPE")}</div><small>出發</small></div><div class="flight-path"><span>✈</span></div><div><div class="airport">${esc(x.to||"FUK")}</div><small>抵達</small></div></div><div class="flight-info"><div>航班時間<b>${esc(x.time||"未填")}</b></div><div>飛行時間<b>${esc(x.duration||"未填")}</b></div><div class="flight-note-cell">備註<b>${esc(x.note||"—")}</b></div></div></div>`}
function editFlight(which){const x=trip().flight[which];openModal(`<h2>編輯${which==="go"?"去程":"回程"}航班</h2><input id="fAirline" placeholder="航空公司" value="${esc(x.airline)}"><input id="fNo" placeholder="航班號" value="${esc(x.no)}"><div class="grid"><input id="fFrom" placeholder="出發機場代碼" value="${esc(x.from)}"><input id="fTo" placeholder="抵達機場代碼" value="${esc(x.to)}"></div><input id="fTime" placeholder="航班時間" value="${esc(x.time)}"><input id="fDuration" placeholder="飛行時間" value="${esc(x.duration)}"><textarea id="fNote" placeholder="備註">${esc(x.note)}</textarea><button class="btn primary" onclick="saveFlight('${which}')">儲存</button><button class="btn" onclick="closeModal()">取消</button>`)}
function saveFlight(which){trip().flight[which]={airline:fAirline.value,no:fNo.value,from:fFrom.value,to:fTo.value,time:fTime.value,duration:fDuration.value,terminal:"",note:fNote.value};closeModal();render()}

/* itinerary */
function weatherIcon(text){const v=String(text||"");if(/雨|rain|傘/.test(v))return "🌧️";if(/雷/.test(v))return "⛈️";if(/雪/.test(v))return "❄️";if(/晴|太陽|sun/.test(v))return "☀️";if(/多雲|雲/.test(v))return "⛅";if(/陰|cloud/.test(v))return "☁️";if(/冷|涼/.test(v))return "🌬️";return "☁️"}
function day(i){const t=trip(),list=t.days[i],meta=t.dayMeta[i]||{weather:"",outfit:""},d=dayDate(i);return `<section class="day-stage"><div class="day-heading clean"><h2>${d.full} <small>(${d.w})</small></h2></div><div class="date-strip">${t.days.map((_,idx)=>{const dd=dayDate(idx);return `<div class="date-chip ${idx===i?'active':''}" onclick="setTab(${idx+2})"><div class="date-main">${dd.w}</div><div class="week-main">${dd.d}</div></div>`}).join("")}<button class="date-chip add-day-chip" onclick="trip().days.push([]);trip().dayMeta.push({weather:'',outfit:''});render()"><span>＋</span><small>加一天</small></button></div><div class="day-meta-grid"><div class="mini-info-card"><div class="mini-info-head"><b>${weatherIcon(meta.weather)} 天氣</b><button class="tiny-edit" onclick="editDayMeta(${i},'weather')">編輯</button></div><p>${esc(meta.weather||"點編輯輸入天氣")}</p></div><div class="mini-info-card"><div class="mini-info-head"><b>👕 穿著備註</b><button class="tiny-edit" onclick="editDayMeta(${i},'outfit')">編輯</button></div><p>${esc(meta.outfit||"點編輯輸入穿著備註")}</p></div></div><div class="day-command-row two"><button onclick="openDayMoveModal(${i})">▦ 整趟總覽</button><button onclick="showTodayRoute(${i})">⌘ 今日路線</button></div></section><div class="filters">${["全部","景點","住宿","美食","購物"].map(f=>`<button class="${filterType===f?'on':''}" onclick="filterType='${f}';render()">${f}</button>`).join("")}<button class="add-filter" onclick="openItForm(${i})">＋ 新增行程</button><button class="day-tool-btn danger-soft" onclick="removeCurrentDay(${i})">刪除此天</button></div>${filteredList(list).length?`<div class="timeline">${filteredList(list).map(x=>card(x,list.indexOf(x),i,list)).join("")}</div>`:`<section class="card empty">這一天還沒有行程，按「新增行程」開始安排 🍂</section>`}`}



/* ===== v25.1 missing itinerary helpers + safe rendering ===== */
function filteredList(list){
  const rows=Array.isArray(list)?list:[];
  if(filterType==="全部")return rows;
  return rows.filter(x=>String(x?.type||"").includes(filterType));
}
function editDayMeta(i,key){
  const meta=trip().dayMeta[i]||(trip().dayMeta[i]={weather:"",outfit:""});
  const label=key==="weather"?"天氣":"穿著備註";
  openModal(`<h2>編輯${label}</h2><textarea id="dayMetaValue" placeholder="請輸入${label}">${esc(meta[key]||"")}</textarea><button class="btn primary" onclick="trip().dayMeta[${i}]['${key}']=dayMetaValue.value;closeModal();render()">儲存</button><button class="btn" onclick="closeModal()">取消</button>`);
}
function showTodayRoute(d){
  const rows=trip().days[d]||[];
  openModal(`<h2>今日路線</h2>${rows.length?`<div class="today-route-list">${rows.map(x=>`<div class="today-route-row"><b>${esc(fmtTime(x.arrive)||'--:--')}</b><span>${esc(x.name||'未命名行程')}</span></div>`).join('')}</div>`:'<p class="empty-route">今天尚未新增行程</p>'}<button class="btn" onclick="closeModal()">關閉</button>`);
}
function removeCurrentDay(i){
  if(trip().days.length<=1)return alert("至少保留一天");
  if(!confirm(`確定刪除 Day ${i+1}？`))return;
  trip().days.splice(i,1);trip().dayMeta.splice(i,1);
  currentTab=Math.min(currentTab,trip().days.length+1);render();
}
function previewFile(input,targetId){
  const box=document.getElementById(targetId);if(!box)return;
  const f=input.files&&input.files[0];if(!f){box.innerHTML='';return}
  const r=new FileReader();r.onload=()=>box.innerHTML=`<img class="receipt-preview" src="${r.result}">`;r.readAsDataURL(f);
}
function card(x,i,d,list){
  const photo=x.photo?`<img class="it-thumb" src="${x.photo}" ${imgAttrs(x.photo)}>`:"";
  const map=x.map?`<a class="btn green" target="_blank" rel="noopener" href="${esc(x.map)}">導航</a>`:"";
  const move=(x.trans||x.moveTime)?`<div class="move-line">${esc([x.trans,x.moveTime].filter(Boolean).join('・'))}</div>`:"";
  return `${i>0?move:""}<article class="it-card ${itemClass(x)} ${x.done?'done':''}" data-idx="${i}" draggable="true" ondragstart="window.dragIndex=${i}" ondragover="event.preventDefault()" ondrop="dropItem(${d},${i})"><div class="it-top">${photo}<div class="it-main"><div class="it-title-row"><div class="it-title"><span class="inline-icon">${typeIcon(x.type)}</span>${esc(x.name||'未命名行程')}</div>${x.arrive?`<span class="right-time">${esc(fmtTime(x.arrive))}</span>`:""}</div><div class="chips">${x.stay?`<span class="chip">停留 ${esc(x.stay)}</span>`:""}${x.rating?`<span class="chip">${esc(x.rating)}</span>`:""}</div>${x.memo?`<p class="note">${esc(x.memo)}</p>`:""}</div></div><div class="card-actions-row"><button class="btn" onclick="toggleDone(${d},${i})">${x.done?'取消完成':'完成'}</button>${map}<button class="btn" onclick="editItem(${d},${i})">編輯</button><button class="btn" onclick="openItemMoveModal(${d},${i})">跨天</button><button class="it-delete-btn" onclick="delItem(${d},${i})" aria-label="刪除行程">🗑</button><span class="drag-grip" ontouchstart="startTouchDrag(event,${d},${i})" ontouchmove="moveTouchDrag(event)" ontouchend="endTouchDrag(event)">⋮⋮</span></div></article>`;
}

function saveCoverFromUrl(d,i){
  const url=(coverUrl.value||"").trim();
  if(!url)return alert("請先貼上圖片網址");
  trip().days[d][i].photo=url;
  closeModal();render();
}
function saveCoverFromFile(d,i){
  readImage(coverFile,photo=>{
    if(!photo)return alert("請先選擇圖片");
    trip().days[d][i].photo=photo;
    closeModal();render();
  })
}

function form(x={},action){return `<h2>${x.name?"編輯":"新增"}行程</h2><select id="itType">${types.map(v=>`<option ${v===x.type?"selected":""}>${v}</option>`).join("")}</select><input id="itName" placeholder="名稱" value="${esc(x.name)}"><input id="itMap" placeholder="Google Maps連結" value="${esc(x.map)}"><div class="grid"><input id="itArrive" placeholder="抵達時間，例如 10:25" value="${esc(fmtTime(x.arrive))}"><input id="itStay" placeholder="停留時間" value="${esc(x.stay)}"></div><div class="grid"><select id="itTrans">${transports.map(v=>`<option ${v===x.trans?"selected":""}>${v}</option>`).join("")}</select><input id="itMoveTime" placeholder="交通所需時間，例如：開車 15 分鐘" value="${esc(x.moveTime)}"></div><select id="itRating"><option value="" ${!x.rating?"selected":""}>推薦程度（選填）</option><option value="5 必去" ${x.rating==="5 必去"?"selected":""}>⭐⭐⭐⭐⭐ 必去</option><option value="4 推薦" ${x.rating==="4 推薦"?"selected":""}>⭐⭐⭐⭐ 推薦</option><option value="3 普通" ${x.rating==="3 普通"?"selected":""}>⭐⭐⭐ 普通</option><option value="1 不用再來" ${x.rating==="1 不用再來"?"selected":""}>⭐ 不用再來</option></select><textarea id="itMemo" placeholder="備註">${esc(x.memo)}</textarea>${x.photo?`<img class="pic" src="${x.photo}" ${imgAttrs(x.photo)}>`:""}<input id="itPhoto" type="file" accept="image/*"><button class="btn primary" onclick="${action}">儲存</button>`}
function openItForm(d){openModal(form({},`addItem(${d})`))}
function addItem(d){readImage(itPhoto,photo=>{trip().days[d].push({type:itType.value,name:itName.value,map:itMap.value,arrive:fmtTime(itArrive.value),stay:itStay.value,trans:itTrans.value,moveTime:itMoveTime.value,memo:itMemo.value,photo,rating:itRating.value,done:false});closeModal();render()})}
function editItem(d,i){openModal(form(trip().days[d][i],`saveItem(${d},${i})`))}
function saveItem(d,i){const x=trip().days[d][i];readImage(itPhoto,photo=>{Object.assign(x,{type:itType.value,name:itName.value,map:itMap.value,arrive:fmtTime(itArrive.value),stay:itStay.value,trans:itTrans.value,moveTime:itMoveTime.value,memo:itMemo.value,rating:itRating.value});if(photo)x.photo=photo;closeModal();render()})}
function toggleDone(d,i){trip().days[d][i].done=!trip().days[d][i].done;render()}
function delItem(d,i){if(confirm("刪除行程？")){trip().days[d].splice(i,1);render()}}
function dropItem(d,i){const arr=trip().days[d];if(window.dragIndex==null)return;const it=arr.splice(window.dragIndex,1)[0];arr.splice(i,0,it);window.dragIndex=null;render()}
function moveTo(d,from,to){to=Number(to);if(from===to)return;const arr=trip().days[d],it=arr.splice(from,1)[0];arr.splice(to,0,it);render()}
function cloneItemForMove(x){return JSON.parse(JSON.stringify(x||{}))}
function dayOptions(selected){return trip().days.map((_,idx)=>`<option value="${idx}" ${idx===selected?'selected':''}>Day ${idx+1}（${dayDate(idx).full}）</option>`).join("")}
function openItemMoveModal(d,i){const x=trip().days[d][i];openModal(`<h2>複製／移動單筆行程</h2><p class="small">目前：Day ${d+1}｜${esc(x.name||'未命名')}</p><select id="targetDay">${dayOptions(d)}</select><div class="grid"><button class="btn primary" onclick="copyItemToDay(${d},${i},targetDay.value)">複製到此天</button><button class="btn dark" onclick="moveItemToDay(${d},${i},targetDay.value)">移動到此天</button></div><button class="btn" onclick="closeModal()">取消</button>`)}
function copyItemToDay(fromDay,itemIndex,toDay){toDay=Number(toDay);const item=cloneItemForMove(trip().days[fromDay][itemIndex]);trip().days[toDay].push(item);closeModal();currentTab=toDay+2;render()}
function moveItemToDay(fromDay,itemIndex,toDay){toDay=Number(toDay);if(fromDay===toDay){closeModal();return}const item=trip().days[fromDay].splice(itemIndex,1)[0];trip().days[toDay].push(item);closeModal();currentTab=toDay+2;render()}
function openDayMoveModal(d){const count=trip().days[d].length;openModal(`<h2>整天行程調整</h2><p class="small">目前：Day ${d+1}，共 ${count} 筆行程。會先保留自動備份，再進行調整。</p><select id="targetDay">${dayOptions(d)}</select><div class="grid"><button class="btn primary" onclick="copyWholeDay(${d},targetDay.value)">複製整天到此天</button><button class="btn dark" onclick="moveWholeDay(${d},targetDay.value)">移動整天到此天</button></div><button class="btn" onclick="swapWholeDay(${d},targetDay.value)">交換兩天行程</button><button class="btn" onclick="closeModal()">取消</button>`)}
function copyWholeDay(fromDay,toDay){toDay=Number(toDay);if(fromDay===toDay){closeModal();return}const items=trip().days[fromDay].map(cloneItemForMove);trip().days[toDay].push(...items);closeModal();currentTab=toDay+2;render()}
function moveWholeDay(fromDay,toDay){toDay=Number(toDay);if(fromDay===toDay){closeModal();return}if(!confirm(`確定把 Day ${fromDay+1} 全部行程移到 Day ${toDay+1}？\n目標日原本行程會保留，這些行程會接在後面。`))return;const items=trip().days[fromDay].splice(0);trip().days[toDay].push(...items);closeModal();currentTab=toDay+2;render()}
function swapWholeDay(a,b){b=Number(b);if(a===b){closeModal();return}const tmp=trip().days[a];trip().days[a]=trip().days[b];trip().days[b]=tmp;closeModal();currentTab=b+2;render()}

/* money */
function rateBox(){const t=trip(),c=t.mainCurrency||"JPY";return `<section class="card rate-card"><h3>匯率設定</h3><p class="small">全站金額以 ${c} 為主，台幣只作輔助換算。</p><label>${c} → TWD<input type="number" step="0.0001" value="${t.rates[c]??1}" onchange="trip().rates['${c}']=Number(this.value||1);render()"></label></section>`}
function receiptScan(){
  openModal(`<h2>掃描收據</h2><p class="small">可拍照或從相簿上傳。按「AI辨識」會嘗試自動讀取文字；若辨識不完整，也可以手動確認明細。</p><div class="scan-choice"><label class="btn primary">📷 拍照<input id="scanCamera" type="file" accept="image/*" capture="environment" onchange="previewFile(this,'scanPreview')" hidden></label><label class="btn">🖼 從相簿上傳<input id="scanAlbum" type="file" accept="image/*" onchange="previewFile(this,'scanPreview')" hidden></label></div><div id="scanPreview"></div><button class="btn primary" onclick="runReceiptOCR()">✨ AI辨識明細</button><button class="btn" onclick="openReceiptConfirm()">手動確認明細</button><button class="btn" onclick="closeModal()">取消</button><div id="ocrStatus" class="small"></div>`)
}
function selectedScanInput(){return (document.getElementById('scanAlbum')&&scanAlbum.files&&scanAlbum.files[0])?scanAlbum:((document.getElementById('scanCamera')&&scanCamera.files&&scanCamera.files[0])?scanCamera:null)}
function loadTesseract(){
  return new Promise((resolve,reject)=>{
    if(window.Tesseract)return resolve(window.Tesseract);
    const s=document.createElement('script');
    s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
    s.onload=()=>resolve(window.Tesseract);
    s.onerror=()=>reject(new Error('OCR 載入失敗'));
    document.head.appendChild(s);
  })
}
function parseReceiptLines(text){
  const rows=[];
  String(text||'').split(/\n+/).map(x=>x.trim()).filter(Boolean).forEach(line=>{
    const nums=[...line.replace(/[,，]/g,'').matchAll(/(?:¥|￥|NT\$?|TWD|JPY)?\s*([0-9]{2,6})(?![0-9])/gi)].map(m=>Number(m[1]));
    if(!nums.length)return;
    const amount=nums[nums.length-1];
    let name=line.replace(/(?:¥|￥|NT\$?|TWD|JPY)?\s*[0-9]{2,6}(?![0-9])/gi,'').replace(/[＊*×xX]\s*\d+/g,'').trim();
    name=name.replace(/^[-–—・\s]+|[-–—・\s]+$/g,'');
    if(amount>0 && amount<100000 && name && !/total|合計|小計|現計|稅|税|找零|釣銭|現金|credit|visa/i.test(name)) rows.push({name,amount});
  });
  return rows.slice(0,24);
}
function runReceiptOCR(){
  const input=selectedScanInput();
  if(!input){alert('請先拍照或從相簿選擇收據照片');return}
  const st=document.getElementById('ocrStatus');
  if(st)st.textContent='AI辨識中…第一次使用可能需要等一下';
  loadTesseract().then(T=>T.recognize(input.files[0],'eng+jpn+chi_tra',{logger:m=>{if(st&&m.status)st.textContent=`AI辨識中… ${m.status} ${m.progress?Math.round(m.progress*100)+'%':''}`}})).then(res=>{
    const text=res?.data?.text||'';
    const rows=parseReceiptLines(text);
    openReceiptConfirm(rows,text);
  }).catch(err=>{
    if(st)st.textContent='AI辨識暫時無法使用，已切換成手動確認。';
    alert('AI辨識暫時無法使用，請先用手動確認明細。');
    openReceiptConfirm();
  })
}
function openReceiptConfirm(rows=[],ocrText=''){
  const input=selectedScanInput();
  if(!input){alert('請先拍照或從相簿選擇收據照片');return}
  readImage(input,receipt=>{
    const lineHtml=(rows&&rows.length?rows:[{},{}]).map((r,i)=>receiptLineHtml(i+1,r.name||'',r.amount||'')).join('');
    modalBody.innerHTML=`<h2>確認收據內容</h2><p class="small">請確認或修改品項與金額，按儲存後會自動加入記帳。</p><div class="receipt-confirm-card"><input id="rcStore" placeholder="店名／商店"><input id="rcDate" type="date"><h3>購買明細</h3><div id="receiptLines">${lineHtml}</div><button class="btn" onclick="addReceiptLine()">＋新增品項</button></div>${ocrText?`<details class="ocr-raw"><summary>查看辨識原文</summary><textarea readonly>${esc(ocrText)}</textarea></details>`:''}${receipt?`<img class="receipt-preview" src="${receipt}" ${imgAttrs(receipt)}>`:""}<button class="btn primary" onclick="saveReceiptExpense('${receipt}')">確認儲存</button><button class="btn" onclick="closeModal()">取消</button>`;
  })
}
function mockRecognizeReceipt(){openReceiptConfirm()}
function receiptLineHtml(n,name='',amount=''){
  return `<div class="receipt-line"><span>${n}</span><input class="rName" placeholder="品項名稱" value="${esc(name)}"><input class="rAmount" type="number" placeholder="金額" value="${esc(amount)}"><button class="delete-mini" onclick="this.closest('.receipt-line').remove()">刪除</button></div>`
}
function addReceiptLine(){
  const box=document.getElementById('receiptLines');
  box.insertAdjacentHTML('beforeend',receiptLineHtml(box.children.length+1));
}
function saveReceiptExpense(receipt){
  const c=trip().mainCurrency||"JPY";
  const names=[...document.querySelectorAll('.rName')].map(x=>x.value.trim());
  const amounts=[...document.querySelectorAll('.rAmount')].map(x=>Number(x.value||0));
  names.forEach((name,i)=>{if(name||amounts[i])trip().expenses.push({name:name||'未命名品項',amount:amounts[i]||0,cur:c,memo:`收據：${rcStore.value||''} ${rcDate.value||''}`.trim(),receipt})});
  closeModal();render();
}
function expenses(){
  const t=trip(),c=t.mainCurrency||"JPY";let totalMain=0,totalTwd=0;
  t.expenses.forEach(x=>{const cur=x.cur||c;totalMain+=toTripCurrency(x.amount,cur);totalTwd+=toTWD(x.amount,cur)});
  return `<section class="page-title-row"><h2>💰 記帳</h2><button class="small-add-btn" onclick="openExpenseForm()">＋ 新增</button></section><section class="compact-total"><b>${c} 總額</b><strong>${fmtMoney(totalMain,c)}</strong><small>約 NT$ ${Math.round(totalTwd).toLocaleString()}</small></section><section class="compact-card-grid expense-grid">${t.expenses.map((x,i)=>`<article class="compact-data-card">${x.receipt?`<img src="${x.receipt}" ${imgAttrs(x.receipt)}>`:""}<h3>${esc(x.name||'未命名')}</h3><b>${fmtMoney(toTripCurrency(x.amount,x.cur||c),c)}</b><small>約 NT$ ${toTWD(x.amount,x.cur||c).toLocaleString()}</small>${x.memo?`<p>${esc(x.memo)}</p>`:""}<div><button onclick="editExpense(${i})">✎</button><button class="delete" onclick="delExpense(${i})">🗑</button></div></article>`).join("")||'<div class="card empty grid-empty">尚未新增記帳</div>'}</section>`
}
function openExpenseForm(){const c=trip().mainCurrency||"JPY";openModal(`<div class="modal-title-row"><h2>新增記帳</h2><button class="modal-x" onclick="closeModal()">×</button></div><button class="btn" onclick="receiptScan()">📷 掃描收據</button><input id="exName" placeholder="項目名稱"><input id="exAmount" type="number" placeholder="金額（${c}）"><textarea id="exMemo" placeholder="備註"></textarea><input id="exReceipt" type="file" accept="image/*" onchange="previewFile(this,'expensePreview')"><div id="expensePreview"></div><button class="btn primary" onclick="addExpense()">儲存</button>`)}

function addExpense(){const c=trip().mainCurrency||"JPY";readImage(exReceipt,receipt=>{trip().expenses.push({name:exName.value,amount:exAmount.value,cur:c,memo:exMemo.value,receipt});closeModal();render()})}
function editExpense(i){const x=trip().expenses[i],c=x.cur||trip().mainCurrency||"JPY";openModal(`<h2>編輯記帳</h2><input id="eeName" value="${esc(x.name)}" placeholder="項目名稱"><input id="eeAmount" type="number" value="${esc(x.amount)}" placeholder="金額"><select id="eeCur">${currencies.map(v=>`<option value="${v}" ${v===c?'selected':''}>${v}</option>`).join('')}</select><textarea id="eeMemo" placeholder="備註">${esc(x.memo||"")}</textarea>${x.receipt?`<img class="receipt-preview" src="${x.receipt}" ${imgAttrs(x.receipt)}>`:""}<input id="eeReceipt" type="file" accept="image/*" onchange="previewFile(this,'eePreview')"><div id="eePreview"></div><button class="btn primary" onclick="saveExpenseEdit(${i})">儲存</button><button class="btn" onclick="closeModal()">取消</button>`)}
function saveExpenseEdit(i){const x=trip().expenses[i];readImage(eeReceipt,receipt=>{Object.assign(x,{name:eeName.value,amount:eeAmount.value,cur:eeCur.value,memo:eeMemo.value});if(receipt)x.receipt=receipt;closeModal();render()})}
function delExpense(i){if(confirm("刪除這筆記帳？")){trip().expenses.splice(i,1);render()}}
function splits(){
  const t=trip(),c=t.mainCurrency||"JPY",tot={};
  t.members.forEach(m=>tot[m]={native:0,twd:0});
  let totalMain=0,totalTwd=0;
  t.splits.forEach(x=>{
    const cur=x.cur||c, each=perPersonAmount(x), eachMain=toTripCurrency(each,cur), eachTwd=toTWD(each,cur);
    totalMain+=toTripCurrency(x.amount,cur); totalTwd+=toTWD(x.amount,cur);
    (x.people||[]).forEach(p=>{if(!tot[p])tot[p]={native:0,twd:0};tot[p].native+=eachMain;tot[p].twd+=eachTwd;});
  });
  const memberCards=t.members.map((m,idx)=>{const initial=String(m||'?').trim().charAt(0).toUpperCase();return `<article class="split-member-card ${idx%2?'green-member':''}"><div class="split-avatar">${esc(initial)}</div><b>${esc(m)}</b><div class="split-member-money">${fmtMoney(tot[m]?.native||0,c)}</div><small>≈ NT$ ${Math.round(tot[m]?.twd||0).toLocaleString()}</small></article>`}).join("");
  const items=t.splits.map((x,i)=>{const cur=x.cur||c;return `<article class="split-item-card">${x.photo?`<img class="split-item-photo" src="${x.photo}" ${imgAttrs(x.photo)}>`:""}<div class="split-item-main"><h3>${esc(x.name||'未命名項目')}</h3><p class="split-item-money">${fmtMoney(x.amount,cur)} <small>≈ NT$ ${toTWD(x.amount,cur).toLocaleString()}</small></p><p>分攤：${(x.people||[]).map(esc).join('、')||'未設定'}</p></div><div class="split-item-actions"><button onclick="editSplit(${i})" aria-label="編輯">✎</button><button class="delete" onclick="delSplit(${i})" aria-label="刪除">♜</button></div></article>`}).join("");
  return `<section class="split-page-head"><div><span class="split-head-icon">♙</span><h2>分攤 <small>🧾</small></h2></div><button class="split-add-btn" onclick="openSplitForm()">＋ 新增項目</button></section><section class="split-companion-card"><h3>旅伴</h3><div class="split-tags">${t.members.map((m,i)=>`<span>${esc(m)} <button onclick="removeSplitMember(${i})">×</button></span>`).join('')}</div><button class="small-add-btn member-add" onclick="openSplitMemberForm()">＋ 新增旅伴</button></section><section class="split-total-card"><span>共同支出總額</span><strong>${fmtMoney(totalMain,c)} <small>≈ NT$ ${Math.round(totalTwd).toLocaleString()}</small></strong><button onclick="openRateEditor()">⟳ 1 ${c} ≈ ${(t.rates[c]??1).toFixed(4)} TWD・更新匯率</button></section><section class="split-member-grid">${memberCards||'<p class="empty-route">尚未新增旅伴</p>'}</section><section class="split-items">${items||'<div class="card empty">尚未新增分攤項目</div>'}</section>`
}
function openSplitForm(){const t=trip(),c=t.mainCurrency||"JPY";openModal(`<h2>新增分攤項目</h2><input id="spName" placeholder="項目名稱"><div class="grid"><input id="spAmount" type="number" placeholder="總金額"><select id="spCur">${currencies.map(v=>`<option value="${v}" ${v===c?'selected':''}>${v}</option>`).join('')}</select></div><input id="spPhoto" type="file" accept="image/*" onchange="previewFile(this,'splitPreview')"><div id="splitPreview"></div><p class="small">選擇要一起分攤的旅伴</p><div class="people-box">${t.members.map(m=>`<label class="tag"><input type="checkbox" name="sp" value="${esc(m)}"> ${esc(m)}</label>`).join('')}</div><button class="btn primary" onclick="addSplit()">新增</button><button class="btn" onclick="closeModal()">取消</button>`)}
function openSplitMemberForm(){openModal(`<div class="modal-title-row"><h2>新增旅伴</h2><button class="modal-x" onclick="closeModal()">×</button></div><input id="newSplitMember" placeholder="旅伴姓名"><button class="btn primary" onclick="addSplitMember()">儲存</button>`)}
function addSplitMember(){const el=document.getElementById('newSplitMember'),name=(el?.value||'').trim();if(!name)return;if(!trip().members.includes(name))trip().members.push(name);closeModal();render()}
function removeSplitMember(i){const name=trip().members[i];if(!confirm(`移除旅伴「${name}」？既有分攤紀錄不會刪除。`))return;trip().members.splice(i,1);render()}
function openRateEditor(){const c=trip().mainCurrency||'JPY';openModal(`<h2>更新匯率</h2><label>1 ${c} 等於多少 TWD<input id="splitRate" type="number" step="0.0001" value="${trip().rates[c]??1}"></label><button class="btn primary" onclick="trip().rates['${c}']=Number(splitRate.value||1);closeModal();render()">儲存</button>`)}
function addSplit(){const people=[...document.querySelectorAll("input[name=sp]:checked")].map(x=>x.value),c=spCur.value||trip().mainCurrency||"JPY";if(!people.length)return alert("請勾選成員");readImage(spPhoto,photo=>{trip().splits.push({name:spName.value,amount:spAmount.value,cur:c,people,photo});render()})}
function editSplit(i){const x=trip().splits[i],cur=x.cur||trip().mainCurrency||"JPY";openModal(`<h2>編輯分攤</h2><input id="seName" value="${esc(x.name)}"><div class="grid"><input id="seAmount" type="number" value="${esc(x.amount)}"><select id="seCur">${currencies.map(v=>`<option value="${v}" ${v===cur?'selected':''}>${v}</option>`).join('')}</select></div>${x.photo?`<img class="receipt-preview" src="${x.photo}" ${imgAttrs(x.photo)}>`:""}<input id="sePhoto" type="file" accept="image/*" onchange="previewFile(this,'sePreview')"><div id="sePreview"></div><div class="people-box">${trip().members.map(m=>`<label class="tag"><input type="checkbox" name="sep" value="${esc(m)}" ${x.people.includes(m)?'checked':''}> ${esc(m)}</label>`).join('')}</div><button class="btn primary" onclick="saveSplitEdit(${i})">儲存</button><button class="btn" onclick="closeModal()">取消</button>`)}
function saveSplitEdit(i){const people=[...document.querySelectorAll("input[name=sep]:checked")].map(x=>x.value);if(!people.length)return alert("請勾選成員");readImage(sePhoto,photo=>{Object.assign(trip().splits[i],{name:seName.value,amount:seAmount.value,cur:seCur.value,people});if(photo)trip().splits[i].photo=photo;closeModal();render()})}
function delSplit(i){if(confirm("刪除這筆分攤？")){trip().splits.splice(i,1);render()}}
function buy(){const t=trip(),g={};t.buy.forEach((x,i)=>{const a=x.area||"未分類";if(!g[a])g[a]=[];g[a].push({...x,i})});return `<section class="page-title-row"><h2>🛍 必買</h2><button class="small-add-btn" onclick="openBuyForm()">＋ 新增</button></section>${Object.keys(g).sort().map(a=>`<section class="buy-card"><h3 class="area-title">${esc(a)}</h3><div class="buy-grid">${g[a].map(x=>`<div class="buy-item ${x.done?'done':''}">${x.pic?`<img class="buy-pic" src="${x.pic}" ${imgAttrs(x.pic)}>`:`<div class="buy-pic placeholder">🛍</div>`}<label><input type="checkbox" ${x.done?'checked':''} onchange="toggleBuy(${x.i})"> <b>${esc(x.name)}</b></label>${x.memo?`<small>${esc(x.memo)}</small>`:""}<div class="mini-actions"><button class="delete-mini edit" onclick="editBuy(${x.i})">編輯</button><button class="delete-mini" onclick="trip().buy.splice(${x.i},1);render()">刪除</button></div></div>`).join("")}</div></section>`).join("")||'<section class="card empty">尚未新增必買</section>'}`}
function openBuyForm(){openModal(`<div class="modal-title-row"><h2>新增必買</h2><button class="modal-x" onclick="closeModal()">×</button></div><input id="buyName" placeholder="商品名稱"><input id="buyArea" placeholder="商店／地區"><textarea id="buyMemo" placeholder="備註"></textarea><input id="buyPic" type="file" accept="image/*" onchange="previewFile(this,'buyPreview')"><div id="buyPreview"></div><button class="btn primary" onclick="addBuy()">儲存</button>`)}
function toggleBuy(i){trip().buy[i].done=!trip().buy[i].done;render()}
function addBuy(){readImage(buyPic,pic=>{trip().buy.push({name:buyName.value,area:buyArea.value||"未分類",memo:buyMemo.value,pic,done:false});closeModal();render()})}
function editBuy(i){const x=trip().buy[i];openModal(`<h2>編輯必買</h2><input id="beName" value="${esc(x.name)}" placeholder="商品名稱"><input id="beArea" value="${esc(x.area)}" placeholder="商店／地區"><textarea id="beMemo" placeholder="備註">${esc(x.memo||"")}</textarea>${x.pic?`<img class="receipt-preview" src="${x.pic}" ${imgAttrs(x.pic)}>`:""}<input id="bePic" type="file" accept="image/*" onchange="previewFile(this,'bePreview')"><div id="bePreview"></div><button class="btn primary" onclick="saveBuyEdit(${i})">儲存</button><button class="btn" onclick="closeModal()">取消</button>`)}
function saveBuyEdit(i){const x=trip().buy[i];readImage(bePic,pic=>{Object.assign(x,{name:beName.value,area:beArea.value||'未分類',memo:beMemo.value});if(pic)x.pic=pic;closeModal();render()})}

/* v13 core tools */
function safeName(s){return String(s||'BearTravel').replace(/[\\/:*?"<>|\s]+/g,'_').slice(0,60)}
function downloadText(name,text,type='application/json'){
  const blob=new Blob([text],{type}); const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function exportTrip(){const t=trip();downloadText(`${safeName(t.name)}.beartravel`,JSON.stringify({version:21,exportedAt:new Date().toISOString(),trip:t},null,2))}
function exportAll(){downloadText(`BearTravel_全部備份_${new Date().toISOString().slice(0,10)}.beartravel`,JSON.stringify({version:21,exportedAt:new Date().toISOString(),state},null,2))}
function importFile(input,mode){const f=input.files&&input.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const data=JSON.parse(r.result);if(data.state){state=data.state}else if(data.trip){const t=data.trip;t.id=Date.now()+Math.random();norm(t);state.trips.push(t);currentTripId=t.id}else if(data.trips){state=data}else{throw new Error('format')}state.trips.forEach(norm);currentTripId=state.trips[0]?.id||null;currentTab=0;save();closeModal();render();alert('匯入完成')}catch(e){alert('檔案格式不正確')}};r.readAsText(f)}
function openImport(){openModal(`<h2>匯入／還原</h2><p class="small">可匯入 .beartravel 或 JSON 備份檔。匯入單趟旅程會加入列表；匯入完整備份會覆蓋目前資料。</p><input type="file" accept=".beartravel,.json,application/json" onchange="importFile(this)"><button class="btn" onclick="closeModal()">取消</button>`)}
function duplicateTrip(){const t=JSON.parse(JSON.stringify(trip()));t.id=Date.now()+Math.random();t.name=t.name+' 複製';norm(t);state.trips.push(t);currentTripId=t.id;currentTab=0;render()}
function printTrip(){window.print()}
function autoBackup(){localStorage.setItem('bearTravelPlanner_v21_autoBackup',JSON.stringify({time:new Date().toISOString(),state}))}
const oldSave=save; save=function(){oldSave();try{autoBackup()}catch(e){}}

function toolsPage(){const t=trip(),c=t.mainCurrency||'JPY';return `<section class="card"><h2>⚙️ 工具</h2><p class="small">正式使用前建議先按「一鍵完整備份」。資料存在手機瀏覽器，下載備份後換手機也可以匯入還原。</p><div class="tool-grid"><button class="btn primary" onclick="exportTrip()">匯出這趟旅程</button><button class="btn primary" onclick="exportAll()">一鍵完整備份</button><button class="btn" onclick="openImport()">匯入／還原</button><button class="btn" onclick="duplicateTrip()">複製旅程</button><button class="btn" onclick="printTrip()">匯出 PDF / 列印</button></div><p class="small">目前版本：Bear Travel Planner v21 正式可用版</p></section><section class="card"><h2>💱 匯率換算</h2><div class="grid"><input id="cvAmount" type="number" placeholder="金額，例如 1000"><select id="cvCur">${currencies.map(x=>`<option value="${x}" ${x===c?'selected':''}>${x}</option>`).join('')}</select></div><button class="btn primary" onclick="convertMoney()">換算台幣</button><div id="cvResult" class="note">輸入金額後按換算。</div><h3>匯率設定</h3><p class="small">更改匯率後，記帳與分攤的「約 NT$」會重新換算，原始旅程幣別金額不會被改掉。</p>${currencies.map(x=>`<label>${x} → TWD<input type="number" step="0.0001" value="${t.rates[x]??1}" onchange="trip().rates['${x}']=Number(this.value||1);render()"></label>`).join('')}</section>`}
function convertMoney(){const a=Number(cvAmount.value||0),cur=cvCur.value,rate=trip().rates[cur]||1;cvResult.textContent=`約 NT$ ${Math.round(a*rate)}（${a} ${cur} × ${rate}）`}


function ticketsPage(){const t=trip(),items=t.tickets||[];return `<section class="page-title-row"><h2>🎟️ 票券／圖片夾</h2><button class="small-add-btn" onclick="openTicketForm()">＋ 新增</button></section>${items.length?`<section class="ticket-grid">${items.map((x,i)=>`<div class="ticket-card">${x.pic?`<img class="ticket-thumb" src="${x.pic}" ${imgAttrs(x.pic)}>`:`<div class="ticket-thumb ticket-empty">🎟️</div>`}<div class="ticket-info"><b>${esc(x.title||'未命名圖片')}</b>${x.memo?`<small>${esc(x.memo)}</small>`:''}</div><div class="mini-actions"><button class="delete-mini edit" onclick="editTicket(${i})">編輯</button><button class="delete-mini" onclick="delTicket(${i})">刪除</button></div></div>`).join('')}</section>`:`<section class="card empty">還沒有票券圖片</section>`}`}
function openTicketForm(){openModal(`<div class="modal-title-row"><h2>新增票券圖片</h2><button class="modal-x" onclick="closeModal()">×</button></div><input id="ticketTitle" placeholder="名稱，例如：唐吉優惠券／餐廳訂位"><textarea id="ticketMemo" placeholder="備註"></textarea><input id="ticketPic" type="file" accept="image/*" onchange="previewFile(this,'ticketPreview')"><div id="ticketPreview"></div><button class="btn primary" onclick="addTicket()">儲存</button>`)}
function addTicket(){
  readImage(ticketPic,pic=>{
    if(!pic)return alert('請先上傳圖片');
    trip().tickets.push({title:ticketTitle.value||'未命名圖片',memo:ticketMemo.value||'',pic,createdAt:new Date().toISOString()});
    closeModal();render();
  })
}
function editTicket(i){
  const x=trip().tickets[i];
  openModal(`<h2>編輯票券圖片</h2><input id="teTitle" value="${esc(x.title||'')}" placeholder="名稱"><textarea id="teMemo" placeholder="備註">${esc(x.memo||'')}</textarea>${x.pic?`<img class="receipt-preview" src="${x.pic}" ${imgAttrs(x.pic)}>`:''}<input id="tePic" type="file" accept="image/*" onchange="previewFile(this,'tePreview')"><div id="tePreview"></div><button class="btn primary" onclick="saveTicketEdit(${i})">儲存</button><button class="btn" onclick="closeModal()">取消</button>`)
}
function saveTicketEdit(i){
  const x=trip().tickets[i];
  readImage(tePic,pic=>{
    Object.assign(x,{title:teTitle.value||'未命名圖片',memo:teMemo.value||''});
    if(pic)x.pic=pic;
    closeModal();render();
  })
}
function delTicket(i){if(confirm('刪除這張票券圖片？')){trip().tickets.splice(i,1);render()}}

function searchPage(){return `<section class="card"><h2>🔍 全旅程搜尋</h2><input id="q" placeholder="搜尋行程、必買、記帳、備忘、行李，例如：拉麵 / UNIQLO / 燒肉" oninput="doSearch()"><div id="searchResult" class="search-result"><p class="small">輸入關鍵字後會搜尋所有旅程。</p></div></section>`}
function doSearch(){const kw=q.value.trim().toLowerCase();if(!kw){searchResult.innerHTML='<p class="small">輸入關鍵字後會搜尋所有旅程。</p>';return}let rows=[];state.trips.forEach(t=>{t.days.forEach((day,di)=>day.forEach((x,ii)=>{const text=[x.name,x.memo,x.type,x.arrive,x.map,x.rating].join(' ').toLowerCase();if(text.includes(kw))rows.push({trip:t.name,where:`Day ${di+1}`,title:x.name||'未命名',memo:x.memo||'',go:`currentTripId=${t.id};currentTab=${di+2};render()`})}));t.buy.forEach(x=>{if([x.name,x.area,x.memo].join(' ').toLowerCase().includes(kw))rows.push({trip:t.name,where:'必買',title:x.name,memo:x.area||'',go:`currentTripId=${t.id};currentTab=${4+t.days.length};render()`})});t.expenses.forEach(x=>{if([x.name,x.memo,x.amount].join(' ').toLowerCase().includes(kw))rows.push({trip:t.name,where:'記帳',title:x.name,memo:`${x.amount} ${x.cur||t.mainCurrency}`,go:`currentTripId=${t.id};currentTab=${2+t.days.length};render()`})});(t.notes||[]).forEach(x=>{if([x.title,x.text].join(' ').toLowerCase().includes(kw))rows.push({trip:t.name,where:'備忘',title:x.title||'備忘',memo:x.text||'',go:`currentTripId=${t.id};currentTab=${8+t.days.length};render()`})});(t.tickets||[]).forEach(x=>{if([x.title,x.memo].join(' ').toLowerCase().includes(kw))rows.push({trip:t.name,where:'票券',title:x.title||'票券圖片',memo:x.memo||'',go:`currentTripId=${t.id};currentTab=${5+t.days.length};render()`})});(t.luggage||[]).forEach(x=>{if([x.owner,x.item,x.memo].join(' ').toLowerCase().includes(kw))rows.push({trip:t.name,where:'行李',title:x.item||'行李',memo:x.owner||'',go:`currentTripId=${t.id};currentTab=${8+t.days.length};render()`})})});searchResult.innerHTML=rows.length?rows.map(r=>`<section class="mini-result" onclick="${r.go}"><b>${esc(r.title)}</b><p>${esc(r.trip)}｜${esc(r.where)}</p>${r.memo?`<small>${esc(r.memo)}</small>`:''}</section>`).join(''):'<p class="empty">找不到相關內容</p>'}

function notesPage(){const t=trip();return `<section class="page-title-row"><h2>📝 備忘</h2><button class="small-add-btn" onclick="openNoteForm()">＋ 新增</button></section><section class="compact-card-grid note-grid">${(t.notes||[]).map((n,i)=>`<article class="compact-data-card note-mini">${n.photo?`<img src="${n.photo}" ${imgAttrs(n.photo)}>`:''}<h3>${esc(n.title||'備忘')}</h3>${n.text?`<p>${esc(n.text)}</p>`:''}${n.map?`<a target="_blank" href="${esc(n.map)}">導航／連結</a>`:''}<div><button onclick="editNote(${i})">✎</button><button class="delete" onclick="delNote(${i})">🗑</button></div></article>`).join('')||'<div class="card empty grid-empty">尚未新增備忘</div>'}</section>`}
function openNoteForm(){openModal(`<div class="modal-title-row"><h2>新增備忘</h2><button class="modal-x" onclick="closeModal()">×</button></div><input id="noteTitle" placeholder="標題，例如：唐吉軻德"><textarea id="noteText" placeholder="備忘內容"></textarea><input id="noteMap" placeholder="導航／網址連結（選填）"><input id="notePhoto" type="file" accept="image/*"><button class="btn primary" onclick="addNote()">儲存</button>`)}
function addNote(){readImage(notePhoto,photo=>{trip().notes.push({title:noteTitle.value,text:noteText.value,map:noteMap.value,photo});closeModal();render()})}
function editNote(i){const n=trip().notes[i];openModal(`<h2>編輯備忘</h2><input id="neTitle" value="${esc(n.title)}"><textarea id="neText">${esc(n.text)}</textarea><input id="neMap" placeholder="導航／網址連結" value="${esc(n.map||'')}">${n.photo?`<img class="receipt-preview" src="${n.photo}" ${imgAttrs(n.photo)}>`:''}<input id="nePhoto" type="file" accept="image/*"><button class="btn primary" onclick="saveNoteEdit(${i})">儲存</button>`)}
function saveNoteEdit(i){const n=trip().notes[i];readImage(nePhoto,photo=>{Object.assign(n,{title:neTitle.value,text:neText.value,map:neMap.value});if(photo)n.photo=photo;closeModal();render()})}
function delNote(i){if(confirm('刪除備忘？')){trip().notes.splice(i,1);render()}}
function luggagePage(){const t=trip(),groups={};(t.luggage||[]).forEach((x,i)=>{const o=x.owner||'未分類';(groups[o]||(groups[o]=[])).push({...x,i})});return `<section class="page-title-row"><h2>🧳 行李清單</h2><button class="small-add-btn" onclick="openLuggageForm()">＋ 新增</button></section>${Object.keys(groups).sort().map(o=>`<section class="card"><h3>${esc(o)}</h3>${groups[o].map(x=>`<label class="check-row ${x.done?'done':''}"><input type="checkbox" ${x.done?'checked':''} onchange="toggleLuggage(${x.i})"><span><b>${esc(x.item)}</b>${x.memo?`<small>${esc(x.memo)}</small>`:''}</span><button class="delete-mini" onclick="event.preventDefault();delLuggage(${x.i})">刪除</button></label>`).join('')}</section>`).join('')||'<section class="card empty">尚未新增行李</section>'}`}
function openLuggageForm(){openModal(`<div class="modal-title-row"><h2>新增行李</h2><button class="modal-x" onclick="closeModal()">×</button></div><input id="lugOwner" placeholder="對象，例如：媽媽 / 樂寶 / 共用"><input id="lugItem" placeholder="物品，例如：尿布 / 充電器"><textarea id="lugMemo" placeholder="備註"></textarea><button class="btn primary" onclick="addLuggage()">儲存</button>`)}
function addLuggage(){trip().luggage.push({owner:lugOwner.value||'共用',item:lugItem.value,memo:lugMemo.value,done:false});closeModal();render()}
function toggleLuggage(i){trip().luggage[i].done=!trip().luggage[i].done;render()}
function delLuggage(i){if(confirm('刪除行李？')){trip().luggage.splice(i,1);render()}}
try{render()}catch(err){console.error(err);const target=document.getElementById("app");if(target)target.innerHTML=`<section class="card error-card"><h2>頁面載入失敗</h2><p>${esc(err?.message||err)}</p><button class="btn primary" onclick="localStorage.removeItem(STORE_KEY);location.reload()">重設此版本資料後重新載入</button></section>`}
