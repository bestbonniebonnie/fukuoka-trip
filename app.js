
const STORE_KEY = "bearTravelPlanner_v3";
const OLD_KEYS = ["bearTravelPlanner_v2_full","bearTravelPlanner_v1_full","bearTravelPlannerV4","bearMultiTripV3","bearMultiTrip"];
const types = ["🏯 景點","🍜 美食","🛍 購物","☕ 咖啡廳","🌃 夜景","🏨 住宿"];
const transports = ["🚗 開車","🚶‍♀️ 走路","🚕 計程車","🚆 大眾交通","🚌 巴士"];
const currencies = ["JPY","TWD","KRW","THB"];
const weekMap=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
let state = loadState();
let currentTripId = state.trips[0]?.id || null;
let currentTab = 0;
let dragIndex = null;

const app = document.getElementById("app");
const tabsEl = document.getElementById("tabs");
const subtitle = document.getElementById("subtitle");
const modal = document.getElementById("modal");
const modalBody = document.getElementById("modalBody");
const backToTrips = document.getElementById("backToTrips");
backToTrips.onclick = () => { currentTripId = null; currentTab = 0; render(); };
modal.onclick = (e) => { if(e.target.id === "modal") closeModal(); };

function defaultTrip(){
  return {id:Date.now()+Math.random(),name:"🍁 福岡 Autumn",date:"2026.10.10－10.14",startDate:"2026-10-10",
    members:["爸爸","媽媽","弟弟","妹妹","🐻","👦🏻"],rates:{JPY:.21,TWD:1,KRW:.023,THB:.9},
    flight:{go:{airline:"",no:"",from:"TPE",to:"FUK",date:"",time:"",duration:"",terminal:"",note:""},back:{airline:"",no:"",from:"FUK",to:"TPE",date:"",time:"",duration:"",terminal:"",note:""}},
    days:Array.from({length:5},()=>[]),expenses:[],splits:[],buy:[]}
}
function loadState(){
  try{let raw=localStorage.getItem(STORE_KEY); if(!raw){for(const k of OLD_KEYS){raw=localStorage.getItem(k); if(raw)break;}}
    const parsed=raw?JSON.parse(raw):{trips:[defaultTrip()]}; if(!parsed.trips?.length)parsed.trips=[defaultTrip()]; parsed.trips.forEach(normalizeTrip); return parsed;
  }catch{return {trips:[defaultTrip()]};}
}
function normalizeTrip(t){
  t.members ||= []; t.rates ||= {JPY:.21,TWD:1,KRW:.023,THB:.9}; t.days=(t.days&&t.days.length)?t.days:[[],[],[],[],[]]; t.expenses ||= []; t.splits ||= []; t.buy ||= [];
  if(!t.startDate) t.startDate = "";
  if(!t.flight) t.flight = defaultTrip().flight;
  if(typeof t.flight.go === "string" || typeof t.flight.back === "string"){
    t.flight={go:{airline:"",no:"",from:"TPE",to:"FUK",date:"",time:t.flight.go||"",duration:"",terminal:"",note:""},back:{airline:"",no:"",from:"FUK",to:"TPE",date:"",time:t.flight.back||"",duration:"",terminal:"",note:""}};
  } else {
    ["go","back"].forEach(k=>{t.flight[k] ||= {}; Object.assign(t.flight[k], {airline:t.flight[k].airline||"",no:t.flight[k].no||"",from:t.flight[k].from||(k==="go"?"TPE":"FUK"),to:t.flight[k].to||(k==="go"?"FUK":"TPE"),date:t.flight[k].date||"",time:t.flight[k].time||"",duration:t.flight[k].duration||"",terminal:t.flight[k].terminal||"",note:t.flight[k].note||""});});
  }
}
function save(){localStorage.setItem(STORE_KEY,JSON.stringify(state))}
function trip(){return state.trips.find(t=>t.id==currentTripId)}
function esc(s){return String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}
function clsType(t){return "type-"+String(t||"").replace(/[^\u4e00-\u9fa5]/g,"").trim()}
function toTWD(a,c){return Math.round(Number(a||0)*(trip().rates[c]||1))}
function readImage(input,cb){const file=input.files&&input.files[0]; if(!file)return cb(""); const r=new FileReader(); r.onload=()=>cb(r.result); r.readAsDataURL(file)}
function openModal(html){modalBody.innerHTML=html; modal.classList.remove("hidden")}
function closeModal(){modal.classList.add("hidden");modalBody.innerHTML=""}
function tabNames(){if(!currentTripId)return["旅程"];const t=trip();return["總覽","航班",...t.days.map((_,i)=>`D${i+1}`),"記帳","分攤","必買"]}
function renderTabs(){tabsEl.innerHTML=tabNames().map((t,i)=>`<button class="${i===currentTab?'active':''}" onclick="setTab(${i})">${t}</button>`).join("")}
function setTab(i){currentTab=i;render()}
function render(){save();renderTabs();const t=trip();backToTrips.classList.toggle("hidden",!currentTripId);subtitle.textContent=currentTripId?`${t.name}｜${t.date||"未設定日期"}`:"Every journey becomes a beautiful memory. 🍂";
 if(!currentTripId){app.innerHTML=renderTripList();return}
 if(currentTab===0)app.innerHTML=renderOverview(); else if(currentTab===1)app.innerHTML=renderFlight(); else if(currentTab>=2&&currentTab<2+t.days.length)app.innerHTML=renderDay(currentTab-2); else if(currentTab===2+t.days.length)app.innerHTML=renderExpenses(); else if(currentTab===3+t.days.length)app.innerHTML=renderSplits(); else app.innerHTML=renderBuy();
}
function dateForDay(i){const t=trip(); if(!t.startDate)return {main:`Day ${i+1}`,week:""}; const d=new Date(t.startDate+"T00:00:00"); d.setDate(d.getDate()+i); return {main:`${d.getMonth()+1}/${d.getDate()}`,week:weekMap[d.getDay()]};}

/* trips */
function renderTripList(){return `<section class="card"><h2>🧸 我的旅程</h2><input id="newTripName" placeholder="旅程名稱，例如：🌸 東京 Spring"><input id="newTripDate" placeholder="日期顯示，例如：2027.03.20－03.25"><input id="newTripStart" type="date" placeholder="出發日期"><input id="newTripMembers" placeholder="旅伴，用逗號分隔"><input id="newTripDays" type="number" min="1" placeholder="天數"><button class="btn primary" onclick="addTrip()">新增旅程</button></section>${state.trips.map((t,i)=>`<section class="card trip-card"><div onclick="selectTrip(${t.id})"><h2>${esc(t.name)}</h2><p>${esc(t.date)}</p><p class="small">${t.days.length} 天｜旅伴：${t.members.join("、")||"尚未設定"}</p></div><div class="actions"><button class="btn" onclick="editTrip(${i})">編輯</button><button class="btn danger" onclick="deleteTrip(${i})">刪除</button></div></section>`).join("")}`}
function addTrip(){const days=Math.max(1,Number(newTripDays.value||5));const t=defaultTrip();t.name=newTripName.value||"未命名旅程";t.date=newTripDate.value||"";t.startDate=newTripStart.value||"";t.members=newTripMembers.value?newTripMembers.value.split(",").map(x=>x.trim()).filter(Boolean):[];t.days=Array.from({length:days},()=>[]);state.trips.push(t);currentTripId=t.id;currentTab=0;render()}
function selectTrip(id){currentTripId=id;currentTab=0;render()}
function editTrip(i){const t=state.trips[i];openModal(`<h2>編輯旅程</h2><input id="editTripName" value="${esc(t.name)}"><input id="editTripDate" value="${esc(t.date)}"><input id="editTripStart" type="date" value="${esc(t.startDate)}"><input id="editTripMembers" value="${esc(t.members.join(","))}"><button class="btn primary" onclick="saveTripEdit(${i})">儲存</button><button class="btn" onclick="closeModal()">取消</button>`)}
function saveTripEdit(i){const t=state.trips[i];t.name=editTripName.value;t.date=editTripDate.value;t.startDate=editTripStart.value;t.members=editTripMembers.value.split(",").map(x=>x.trim()).filter(Boolean);closeModal();render()}
function deleteTrip(i){if(state.trips.length<=1)return alert("至少保留一個旅程");if(confirm("確定刪除這趟旅程？")){state.trips.splice(i,1);currentTripId=state.trips[0].id;currentTab=0;render()}}

/* overview */
function renderOverview(){const t=trip(),count=t.days.flat().length;return `<section class="card"><h2>${esc(t.name)}</h2><p>${esc(t.date)}</p><div class="grid"><div class="card"><b>天數</b><div class="money">${t.days.length}</div></div><div class="card"><b>行程</b><div class="money">${count}</div></div><div class="card"><b>記帳</b><div class="money">${t.expenses.length}</div></div><div class="card"><b>必買</b><div class="money">${t.buy.length}</div></div></div><h3>旅伴設定</h3><input id="membersInput" value="${esc(t.members.join(","))}"><button class="btn primary" onclick="trip().members=membersInput.value.split(',').map(x=>x.trim()).filter(Boolean);render()">更新旅伴</button><h3>天數設定</h3><button class="btn dark" onclick="trip().days.push([]);render()">＋增加一天</button><button class="btn danger" onclick="removeDay()">－減少一天</button></section>`}
function removeDay(){const t=trip();if(t.days.length<=1)return alert("至少保留 1 天");if(confirm("會刪除最後一天的行程資料，確定嗎？")){t.days.pop();if(currentTab>=2+t.days.length)currentTab=0;render()}}

/* flight refined */
function renderFlight(){const f=trip().flight;return `<section class="card"><h2>✈️ 航班資訊</h2><span class="flight-section-title">去程</span>${flightPreview(f.go)}${flightFields("go",f.go)}<span class="flight-section-title">回程</span>${flightPreview(f.back)}${flightFields("back",f.back)}<button class="btn primary" onclick="saveFlight()">儲存航班資訊</button></section>`}
function flightPreview(x){return `<div class="flight-card"><b>${esc(x.airline||"航空公司")} ${esc(x.no||"航班號")}</b><div class="flight-route"><div><div class="airport">${esc(x.from||"TPE")}</div><small>出發</small></div><div class="arrow">→</div><div><div class="airport">${esc(x.to||"FUK")}</div><small>抵達</small></div></div><div class="flight-info"><div>航班時間<b>${esc(x.time||"未填")}</b></div><div>飛行時間<b>${esc(x.duration||"未填")}</b></div><div>航廈<b>${esc(x.terminal||"未填")}</b></div><div>備註<b>${esc(x.note||"—")}</b></div></div></div>`}
function flightFields(prefix,x){return `<input id="${prefix}Airline" placeholder="航空公司" value="${esc(x.airline)}"><input id="${prefix}No" placeholder="航班號" value="${esc(x.no)}"><div class="grid"><input id="${prefix}From" placeholder="出發機場代碼，例如 TPE" value="${esc(x.from)}"><input id="${prefix}To" placeholder="抵達機場代碼，例如 FUK" value="${esc(x.to)}"></div><input id="${prefix}Time" placeholder="航班時間，例如：13:50 - 17:40" value="${esc(x.time)}"><input id="${prefix}Duration" placeholder="飛行時間，例如：2小時50分" value="${esc(x.duration)}"><input id="${prefix}Terminal" placeholder="航廈，例如：T1" value="${esc(x.terminal)}"><textarea id="${prefix}Note" placeholder="備註">${esc(x.note)}</textarea>`}
function saveFlight(){trip().flight={go:{airline:goAirline.value,no:goNo.value,from:goFrom.value,to:goTo.value,time:goTime.value,duration:goDuration.value,terminal:goTerminal.value,note:goNote.value},back:{airline:backAirline.value,no:backNo.value,from:backFrom.value,to:backTo.value,time:backTime.value,duration:backDuration.value,terminal:backTerminal.value,note:backNote.value}};render()}

/* itinerary timeline */
function renderDay(dayIndex){const list=trip().days[dayIndex],dfd=dateForDay(dayIndex);return `<section class="card"><div class="day-head"><div><div class="day-date">${dfd.main} <span class="weekday">(${dfd.week})</span></div><div class="day-num">Day ${dayIndex+1}</div></div><button class="btn dark" onclick="openAddItinerary(${dayIndex})">＋新增行程</button></div><p class="small">車程會顯示在景點與景點之間；每個地點可設定抵達時間、停留時間。</p></section>${!list.length?`<section class="card empty">Day ${dayIndex+1} 還沒有行程 🍂</section>`:`<div class="timeline">${list.map((x,i)=>renderItineraryCard(x,i,dayIndex,list)).join("")}</div>`}`}
function renderItineraryCard(x,i,d,list){let move=i<list.length-1?`<div class="move-block"><span>${esc(x.trans||"🚗 開車")} 約 ${esc(x.moveTime||x.time||"未填")}</span><span>${esc(x.moveRange||"")}</span></div>`:"";return `<section class="it-card" data-index="${i}" draggable="true" ondragstart="dragIndex=${i};this.classList.add('dragging')" ondragend="this.classList.remove('dragging')" ondragover="event.preventDefault();this.classList.add('drop-target')" ondragleave="this.classList.remove('drop-target')" ondrop="dropItinerary(${d},${i})"><div class="time-pill">${esc(x.arrive||"抵達")}</div><div class="it-inner"><div class="drag-handle">≡</div>${x.photo?`<img class="pic" src="${x.photo}">`:""}<div class="item-content"><div class="item-title"><span class="index-dot">${i+1}</span>${esc(x.name||"未命名行程")}</div><div class="meta-line"><span class="type-chip ${clsType(x.type)}">${esc(x.type||"景點")}</span><span class="arrive-stay">抵達 ${esc(x.arrive||"未填")}　停留 ${esc(x.stay||"未填")}</span></div>${x.memo?`<p class="note">📝 ${esc(x.memo)}</p>`:""}${x.map?`<p><a href="${esc(x.map)}" target="_blank">📍 開啟導航</a></p>`:""}<div class="actions"><button class="btn" onclick="editItinerary(${d},${i})">編輯</button><button class="btn danger" onclick="deleteItinerary(${d},${i})">刪除</button></div></div></div>${move}</section>`}
function openAddItinerary(d){openModal(itineraryForm("新增行程",{},`addItinerary(${d})`))}
function itineraryForm(title,x,action){return `<h2>${title}</h2><select id="itType">${types.map(v=>`<option ${v===x.type?"selected":""}>${v}</option>`).join("")}</select><input id="itName" placeholder="名稱" value="${esc(x.name)}"><input id="itMap" placeholder="Google Maps 連結" value="${esc(x.map)}"><div class="grid"><input id="itArrive" placeholder="抵達時間 例 09:30" value="${esc(x.arrive)}"><input id="itStay" placeholder="停留時間 例 1小時" value="${esc(x.stay)}"></div><select id="itTrans">${transports.map(v=>`<option ${v===x.trans?"selected":""}>${v}</option>`).join("")}</select><input id="itMoveTime" placeholder="到下一站車程／步行時間 例 25分鐘" value="${esc(x.moveTime||x.time)}"><input id="itMoveRange" placeholder="移動時段 例 09:30 → 09:55" value="${esc(x.moveRange)}"><textarea id="itMemo" placeholder="備註">${esc(x.memo)}</textarea>${x.photo?`<img class="pic" src="${x.photo}">`:""}<input id="itPhoto" type="file" accept="image/*"><button class="btn primary" onclick="${action}">儲存</button><button class="btn" onclick="closeModal()">取消</button>`}
function addItinerary(d){readImage(itPhoto,photo=>{trip().days[d].push({type:itType.value,name:itName.value,map:itMap.value,arrive:itArrive.value,stay:itStay.value,trans:itTrans.value,moveTime:itMoveTime.value,moveRange:itMoveRange.value,memo:itMemo.value,photo});closeModal();render()})}
function dropItinerary(d,i){const arr=trip().days[d];if(dragIndex===null)return;const item=arr.splice(dragIndex,1)[0];arr.splice(i,0,item);dragIndex=null;render()}
function deleteItinerary(d,i){if(confirm("刪除這筆行程？")){trip().days[d].splice(i,1);render()}}
function editItinerary(d,i){openModal(itineraryForm("編輯行程",trip().days[d][i],`saveItineraryEdit(${d},${i})`))}
function saveItineraryEdit(d,i){const x=trip().days[d][i];readImage(itPhoto,photo=>{Object.assign(x,{type:itType.value,name:itName.value,map:itMap.value,arrive:itArrive.value,stay:itStay.value,trans:itTrans.value,moveTime:itMoveTime.value,moveRange:itMoveRange.value,memo:itMemo.value});if(photo)x.photo=photo;closeModal();render()})}

/* money pages retained */
function rateBox(){const t=trip();return `<section class="card"><h3>匯率設定</h3>${currencies.map(c=>`<label>${c}<input type="number" step="0.001" value="${t.rates[c]}" onchange="trip().rates['${c}']=Number(this.value);render()"></label>`).join("")}</section>`}
function renderExpenses(){const t=trip(),totals={JPY:0,TWD:0,KRW:0,THB:0};let totalTWD=0;t.expenses.forEach(x=>{totals[x.cur]+=Number(x.amount||0);totalTWD+=toTWD(x.amount,x.cur)});return `${rateBox()}<section class="card"><h2>💰 記帳</h2><div class="grid">${currencies.map(c=>`<div class="card"><b>${c}</b><div class="money">${totals[c]}</div></div>`).join("")}</div><div class="card"><b>約台幣總額</b><div class="money">NT$ ${totalTWD}</div></div><input id="exName" placeholder="項目名稱"><input id="exAmount" type="number" placeholder="金額"><select id="exCur">${currencies.map(c=>`<option>${c}</option>`).join("")}</select><textarea id="exMemo" placeholder="備註／收據狀態"></textarea><input id="exReceipt" type="file" accept="image/*"><button class="btn primary" onclick="addExpense()">新增記帳</button></section>${!t.expenses.length?`<section class="card empty">還沒有記帳紀錄 💰</section>`:""}${t.expenses.map((x,i)=>`<section class="card">${x.receipt?`<img class="pic" src="${x.receipt}">`:""}<h3>${esc(x.name)}</h3><div class="money">${x.amount} ${x.cur}</div><p>約 NT$ ${toTWD(x.amount,x.cur)}</p>${x.memo?`<p class="note">📝 ${esc(x.memo)}</p>`:""}<button class="btn danger" onclick="deleteExpense(${i})">刪除</button></section>`).join("")}`}
function addExpense(){readImage(exReceipt,receipt=>{trip().expenses.push({name:exName.value,amount:exAmount.value,cur:exCur.value,memo:exMemo.value,receipt});render()})}
function deleteExpense(i){if(confirm("刪除這筆記帳？")){trip().expenses.splice(i,1);render()}}

function renderSplits(){const t=trip(),totals={};currencies.forEach(c=>totals[c]={});t.members.forEach(m=>currencies.forEach(c=>totals[c][m]=0));t.splits.forEach(x=>x.people.forEach(p=>totals[x.cur][p]+=Number(x.amount||0)/x.people.length));return `${rateBox()}<section class="card"><h2>👨‍👩‍👧‍👦 分攤</h2>${currencies.map(c=>`<h3>${c}</h3><div class="grid">${t.members.map(m=>`<div class="card"><b>${esc(m)}</b><div class="money">${Math.round(totals[c][m]||0)} ${c}</div><p class="small">約 NT$ ${Math.round((totals[c][m]||0)*(t.rates[c]||1))}</p></div>`).join("")}</div>`).join("")}<input id="spName" placeholder="項目"><input id="spAmount" type="number" placeholder="總金額"><select id="spCur">${currencies.map(c=>`<option>${c}</option>`).join("")}</select><div class="people-box">${t.members.map(m=>`<label class="tag"><input type="checkbox" name="splitPeople" value="${esc(m)}"> ${esc(m)}</label>`).join("")}</div><button class="btn primary" onclick="addSplit()">新增分攤</button></section>${!t.splits.length?`<section class="card empty">還沒有分攤紀錄 👨‍👩‍👧‍👦</section>`:""}${t.splits.map((x,i)=>`<section class="card"><h3>${esc(x.name)}</h3><div class="money">${x.amount} ${x.cur}</div><p>分攤：${x.people.join("、")}</p><p>每人：${Math.round(Number(x.amount||0)/x.people.length)} ${x.cur}</p><button class="btn danger" onclick="deleteSplit(${i})">刪除</button></section>`).join("")}`}
function addSplit(){const people=[...document.querySelectorAll("input[name=splitPeople]:checked")].map(x=>x.value);if(!people.length)return alert("請勾選分攤成員");trip().splits.push({name:spName.value,amount:spAmount.value,cur:spCur.value,people});render()}
function deleteSplit(i){if(confirm("刪除這筆分攤？")){trip().splits.splice(i,1);render()}}

function renderBuy(){const t=trip(),grouped={};t.buy.forEach((x,i)=>{const area=x.area||"未分類";if(!grouped[area])grouped[area]=[];grouped[area].push({...x,i})});return `<section class="card"><h2>🛍 必買</h2><input id="buyName" placeholder="商品名稱"><input id="buyArea" placeholder="地區／會經過的地方"><textarea id="buyMemo" placeholder="備註"></textarea><input id="buyPic" type="file" accept="image/*"><button class="btn primary" onclick="addBuy()">新增</button></section>${!t.buy.length?`<section class="card empty">還沒有必買清單 🛍</section>`:""}${Object.keys(grouped).sort().map(area=>`<h3 class="area-title">${esc(area)}</h3><div class="grid">${grouped[area].map(x=>`<section class="card">${x.pic?`<img class="pic" src="${x.pic}">`:""}<h3>${esc(x.name)}</h3>${x.memo?`<p class="note">${esc(x.memo)}</p>`:""}<button class="btn danger" onclick="deleteBuy(${x.i})">刪除</button></section>`).join("")}</div>`).join("")}`}
function addBuy(){readImage(buyPic,pic=>{trip().buy.push({name:buyName.value,area:buyArea.value||"未分類",memo:buyMemo.value,pic});render()})}
function deleteBuy(i){if(confirm("刪除這項必買？")){trip().buy.splice(i,1);render()}}

render();
