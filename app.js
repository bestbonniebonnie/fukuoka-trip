
const STORE_KEY = "bearTravelPlanner_v1_full";
const types = ["🏯 景點","🍜 美食","🛍 購物","☕ 咖啡廳","🌃 夜景"];
const transports = ["🚗 開車","🚶‍♀️ 走路","🚕 計程車","🚆 大眾交通"];
const currencies = ["JPY","TWD","KRW","THB"];

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
  return {
    id: Date.now() + Math.random(),
    name: "🍁 福岡 Autumn",
    date: "2026.10.10－10.14",
    members: ["爸爸","媽媽","弟弟","妹妹","🐻","👦🏻"],
    rates: { JPY:0.21, TWD:1, KRW:0.023, THB:0.9 },
    flight: { go:"", back:"", note:"" },
    days: Array.from({length:5}, () => []),
    expenses: [],
    splits: [],
    buy: []
  };
}
function loadState(){
  try{
    const raw = localStorage.getItem(STORE_KEY)
      || localStorage.getItem("bearTravelPlannerV4")
      || localStorage.getItem("bearMultiTripV3")
      || localStorage.getItem("bearMultiTrip");
    const parsed = raw ? JSON.parse(raw) : { trips:[defaultTrip()] };
    if(!parsed.trips || !parsed.trips.length) parsed.trips = [defaultTrip()];
    parsed.trips.forEach(normalizeTrip);
    return parsed;
  }catch{
    return { trips:[defaultTrip()] };
  }
}
function normalizeTrip(t){
  t.members ||= [];
  t.rates ||= { JPY:0.21, TWD:1, KRW:0.023, THB:0.9 };
  t.flight ||= { go:"", back:"", note:"" };
  t.days = (t.days && t.days.length) ? t.days : Array.from({length:5},()=>[]);
  t.expenses ||= [];
  t.splits ||= [];
  t.buy ||= [];
}
function save(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function trip(){ return state.trips.find(t => t.id == currentTripId); }
function esc(s){ return String(s ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;"); }
function toTWD(amount, cur){ return Math.round(Number(amount || 0) * (trip().rates[cur] || 1)); }
function readImage(input, cb){
  const file = input.files && input.files[0];
  if(!file) return cb("");
  const reader = new FileReader();
  reader.onload = () => cb(reader.result);
  reader.readAsDataURL(file);
}
function openModal(html){ modalBody.innerHTML = html; modal.classList.remove("hidden"); }
function closeModal(){ modal.classList.add("hidden"); modalBody.innerHTML = ""; }

function tabNames(){
  if(!currentTripId) return ["旅程"];
  const t = trip();
  return ["總覽","航班", ...t.days.map((_,i)=>`D${i+1}`), "記帳","分攤","必買"];
}
function renderTabs(){
  tabsEl.innerHTML = tabNames().map((t,i)=>`<button class="${i===currentTab?'active':''}" onclick="setTab(${i})">${t}</button>`).join("");
}
function setTab(i){ currentTab = i; render(); }

function render(){
  save();
  renderTabs();
  const t = trip();
  backToTrips.classList.toggle("hidden", !currentTripId);
  subtitle.textContent = currentTripId ? `${t.name}｜${t.date || "未設定日期"}` : "Every journey becomes a beautiful memory. 🍂";

  if(!currentTripId){ app.innerHTML = renderTripList(); return; }

  if(currentTab === 0) app.innerHTML = renderOverview();
  else if(currentTab === 1) app.innerHTML = renderFlight();
  else if(currentTab >= 2 && currentTab < 2 + t.days.length) app.innerHTML = renderDay(currentTab - 2);
  else if(currentTab === 2 + t.days.length) app.innerHTML = renderExpenses();
  else if(currentTab === 3 + t.days.length) app.innerHTML = renderSplits();
  else app.innerHTML = renderBuy();
}

/* Trip list */
function renderTripList(){
  return `
  <section class="card">
    <h2>🧸 我的旅程</h2>
    <input id="newTripName" placeholder="旅程名稱，例如：🌸 東京 Spring">
    <input id="newTripDate" placeholder="日期，例如：2027.03.20－03.25">
    <input id="newTripMembers" placeholder="旅伴，用逗號分隔，例如：🐻,媽媽,朋友A">
    <input id="newTripDays" type="number" min="1" placeholder="天數，例如：5">
    <button class="btn primary" onclick="addTrip()">新增旅程</button>
  </section>
  ${state.trips.map((t,i)=>`
    <section class="card trip-card">
      <div onclick="selectTrip(${t.id})">
        <h2>${esc(t.name)}</h2>
        <p>${esc(t.date)}</p>
        <p class="small">${t.days.length} 天｜旅伴：${t.members.join("、") || "尚未設定"}</p>
      </div>
      <div class="actions">
        <button class="btn" onclick="editTrip(${i})">編輯</button>
        <button class="btn danger" onclick="deleteTrip(${i})">刪除</button>
      </div>
    </section>`).join("")}
  `;
}
function addTrip(){
  const days = Math.max(1, Number(newTripDays.value || 5));
  const t = defaultTrip();
  t.name = newTripName.value || "未命名旅程";
  t.date = newTripDate.value || "";
  t.members = newTripMembers.value ? newTripMembers.value.split(",").map(x=>x.trim()).filter(Boolean) : [];
  t.days = Array.from({length:days},()=>[]);
  state.trips.push(t);
  currentTripId = t.id;
  currentTab = 0;
  render();
}
function selectTrip(id){ currentTripId = id; currentTab = 0; render(); }
function editTrip(i){
  const t = state.trips[i];
  openModal(`
    <h2>編輯旅程</h2>
    <input id="editTripName" value="${esc(t.name)}">
    <input id="editTripDate" value="${esc(t.date)}">
    <input id="editTripMembers" value="${esc(t.members.join(","))}">
    <button class="btn primary" onclick="saveTripEdit(${i})">儲存</button>
    <button class="btn" onclick="closeModal()">取消</button>
  `);
}
function saveTripEdit(i){
  const t = state.trips[i];
  t.name = editTripName.value;
  t.date = editTripDate.value;
  t.members = editTripMembers.value.split(",").map(x=>x.trim()).filter(Boolean);
  closeModal(); render();
}
function deleteTrip(i){
  if(state.trips.length <= 1) return alert("至少保留一個旅程");
  if(confirm("確定刪除這趟旅程？")){
    state.trips.splice(i,1);
    currentTripId = state.trips[0].id;
    currentTab = 0;
    render();
  }
}

/* Overview */
function renderOverview(){
  const t = trip();
  const itineraryCount = t.days.flat().length;
  return `
  <section class="card">
    <h2>${esc(t.name)}</h2>
    <p>${esc(t.date)}</p>
    <div class="grid">
      <div class="card"><b>天數</b><div class="money">${t.days.length}</div></div>
      <div class="card"><b>行程</b><div class="money">${itineraryCount}</div></div>
      <div class="card"><b>記帳</b><div class="money">${t.expenses.length}</div></div>
      <div class="card"><b>必買</b><div class="money">${t.buy.length}</div></div>
    </div>
    <h3>旅伴設定</h3>
    <input id="membersInput" value="${esc(t.members.join(","))}" placeholder="用逗號分隔">
    <button class="btn primary" onclick="trip().members=membersInput.value.split(',').map(x=>x.trim()).filter(Boolean);render()">更新旅伴</button>
    <h3>天數設定</h3>
    <p class="small">每趟旅行可自由增加／減少天數。減少天數會刪除最後一天行程。</p>
    <button class="btn dark" onclick="trip().days.push([]);render()">＋增加一天</button>
    <button class="btn danger" onclick="removeDay()">－減少一天</button>
  </section>`;
}
function removeDay(){
  const t = trip();
  if(t.days.length <= 1) return alert("至少保留 1 天");
  if(confirm("會刪除最後一天的行程資料，確定嗎？")){
    t.days.pop();
    if(currentTab >= 2 + t.days.length) currentTab = 0;
    render();
  }
}

/* Flight */
function renderFlight(){
  const f = trip().flight;
  return `
  <section class="card">
    <h2>✈️ 航班</h2>
    <textarea id="flightGo" placeholder="去程資訊">${esc(f.go)}</textarea>
    <textarea id="flightBack" placeholder="回程資訊">${esc(f.back)}</textarea>
    <textarea id="flightNote" placeholder="備註">${esc(f.note)}</textarea>
    <button class="btn primary" onclick="trip().flight={go:flightGo.value,back:flightBack.value,note:flightNote.value};render()">儲存航班</button>
  </section>`;
}

/* Day */
function renderDay(dayIndex){
  const list = trip().days[dayIndex];
  return `
  <section class="card">
    <h2>🍂 Day ${dayIndex + 1}</h2>
    <p class="small">長按／拖曳卡片可調整順序。</p>
    <select id="itType">${types.map(x=>`<option>${x}</option>`).join("")}</select>
    <input id="itName" placeholder="名稱">
    <input id="itMap" placeholder="Google Maps 連結">
    <select id="itTrans">${transports.map(x=>`<option>${x}</option>`).join("")}</select>
    <input id="itTime" placeholder="移動時間，例如：20 分鐘">
    <textarea id="itMemo" placeholder="備註"></textarea>
    <input id="itPhoto" type="file" accept="image/*">
    <button class="btn primary" onclick="addItinerary(${dayIndex})">新增行程</button>
  </section>
  ${!list.length ? `<section class="card empty">Day ${dayIndex+1} 還沒有行程 🍂</section>` : ""}
  ${list.map((x,i)=>`
    <section class="card" draggable="true"
      ontouchstart="dragIndex=${i}"
      ondragstart="dragIndex=${i};this.classList.add('dragging')"
      ondragend="this.classList.remove('dragging')"
      ondragover="event.preventDefault();this.classList.add('drop-target')"
      ondragleave="this.classList.remove('drop-target')"
      ondrop="dropItinerary(${dayIndex},${i})">
      ${x.photo ? `<img class="pic" src="${x.photo}">` : ""}
      <div class="item-title"><h3>${esc(x.type || "")} ${esc(x.name || "未命名行程")}</h3><span class="badge">拖曳</span></div>
      <p class="drive">${esc(x.trans || "")}｜${esc(x.time || "未填時間")}</p>
      ${x.memo ? `<p class="note">📝 ${esc(x.memo)}</p>` : ""}
      ${x.map ? `<p><a href="${esc(x.map)}" target="_blank">📍 開啟導航</a></p>` : ""}
      <div class="actions">
        <button class="btn" onclick="editItinerary(${dayIndex},${i})">編輯</button>
        <button class="btn danger" onclick="deleteItinerary(${dayIndex},${i})">刪除</button>
      </div>
    </section>`).join("")}
  `;
}
function addItinerary(d){
  readImage(itPhoto, photo => {
    trip().days[d].push({type:itType.value,name:itName.value,map:itMap.value,trans:itTrans.value,time:itTime.value,memo:itMemo.value,photo});
    render();
  });
}
function dropItinerary(d,i){
  const arr = trip().days[d];
  if(dragIndex === null) return;
  const item = arr.splice(dragIndex,1)[0];
  arr.splice(i,0,item);
  dragIndex = null;
  render();
}
function deleteItinerary(d,i){ if(confirm("刪除這筆行程？")){ trip().days[d].splice(i,1); render(); } }
function editItinerary(d,i){
  const x = trip().days[d][i];
  openModal(`
    <h2>編輯行程</h2>
    <select id="eType">${types.map(v=>`<option ${v===x.type?"selected":""}>${v}</option>`).join("")}</select>
    <input id="eName" value="${esc(x.name)}" placeholder="名稱">
    <input id="eMap" value="${esc(x.map)}" placeholder="Google Maps 連結">
    <select id="eTrans">${transports.map(v=>`<option ${v===x.trans?"selected":""}>${v}</option>`).join("")}</select>
    <input id="eTime" value="${esc(x.time)}" placeholder="移動時間">
    <textarea id="eMemo">${esc(x.memo)}</textarea>
    ${x.photo ? `<img class="pic" src="${x.photo}">` : ""}
    <input id="ePhoto" type="file" accept="image/*">
    <button class="btn primary" onclick="saveItineraryEdit(${d},${i})">儲存</button>
    <button class="btn" onclick="closeModal()">取消</button>
  `);
}
function saveItineraryEdit(d,i){
  const x = trip().days[d][i];
  readImage(ePhoto, photo => {
    Object.assign(x,{type:eType.value,name:eName.value,map:eMap.value,trans:eTrans.value,time:eTime.value,memo:eMemo.value});
    if(photo) x.photo = photo;
    closeModal(); render();
  });
}

/* Rates */
function rateBox(){
  const t = trip();
  return `<section class="card"><h3>匯率設定</h3><p class="small">設定「1 原幣 = 幾元台幣」。</p>
  ${currencies.map(c=>`<label>${c}<input type="number" step="0.001" value="${t.rates[c]}" onchange="trip().rates['${c}']=Number(this.value);render()"></label>`).join("")}</section>`;
}

/* Expenses */
function renderExpenses(){
  const t = trip();
  const totals = {JPY:0,TWD:0,KRW:0,THB:0};
  let totalTWD = 0;
  t.expenses.forEach(x => { totals[x.cur] += Number(x.amount || 0); totalTWD += toTWD(x.amount,x.cur); });
  return `${rateBox()}
  <section class="card">
    <h2>💰 記帳</h2>
    <div class="grid">${currencies.map(c=>`<div class="card"><b>${c}</b><div class="money">${totals[c]}</div></div>`).join("")}</div>
    <div class="card"><b>約台幣總額</b><div class="money">NT$ ${totalTWD}</div></div>
    <input id="exName" placeholder="項目名稱">
    <input id="exAmount" type="number" placeholder="金額">
    <select id="exCur">${currencies.map(c=>`<option>${c}</option>`).join("")}</select>
    <textarea id="exMemo" placeholder="備註／收據狀態"></textarea>
    <input id="exReceipt" type="file" accept="image/*">
    <button class="btn primary" onclick="addExpense()">新增記帳</button>
  </section>
  ${!t.expenses.length ? `<section class="card empty">還沒有記帳紀錄 💰</section>` : ""}
  ${t.expenses.map((x,i)=>`
    <section class="card">
      ${x.receipt ? `<img class="pic" src="${x.receipt}">` : ""}
      <h3>${esc(x.name)}</h3><div class="money">${x.amount} ${x.cur}</div>
      <p>約 NT$ ${toTWD(x.amount,x.cur)}</p>
      ${x.memo ? `<p class="note">📝 ${esc(x.memo)}</p>` : ""}
      <button class="btn" onclick="editExpense(${i})">編輯</button>
      <button class="btn danger" onclick="deleteExpense(${i})">刪除</button>
    </section>`).join("")}`;
}
function addExpense(){
  readImage(exReceipt, receipt => {
    trip().expenses.push({name:exName.value,amount:exAmount.value,cur:exCur.value,memo:exMemo.value,receipt});
    render();
  });
}
function deleteExpense(i){ if(confirm("刪除這筆記帳？")){ trip().expenses.splice(i,1); render(); } }
function editExpense(i){
  const x = trip().expenses[i];
  openModal(`
    <h2>編輯記帳</h2>
    <input id="eeName" value="${esc(x.name)}">
    <input id="eeAmount" type="number" value="${esc(x.amount)}">
    <select id="eeCur">${currencies.map(c=>`<option ${c===x.cur?"selected":""}>${c}</option>`).join("")}</select>
    <textarea id="eeMemo">${esc(x.memo)}</textarea>
    ${x.receipt ? `<img class="pic" src="${x.receipt}">` : ""}
    <input id="eeReceipt" type="file" accept="image/*">
    <button class="btn primary" onclick="saveExpenseEdit(${i})">儲存</button>
    <button class="btn" onclick="closeModal()">取消</button>
  `);
}
function saveExpenseEdit(i){
  const x = trip().expenses[i];
  readImage(eeReceipt, receipt => {
    Object.assign(x,{name:eeName.value,amount:eeAmount.value,cur:eeCur.value,memo:eeMemo.value});
    if(receipt) x.receipt = receipt;
    closeModal(); render();
  });
}

/* Splits */
function renderSplits(){
  const t = trip();
  const sums = {};
  t.members.forEach(m => sums[m] = 0);
  t.splits.forEach(x => x.people.forEach(p => sums[p] += toTWD(x.amount,x.cur) / x.people.length));
  return `${rateBox()}
  <section class="card">
    <h2>👨‍👩‍👧‍👦 分攤</h2>
    <div class="grid">${t.members.map(m=>`<div class="card"><b>${esc(m)}</b><div class="money">NT$ ${Math.round(sums[m] || 0)}</div></div>`).join("")}</div>
    <input id="spName" placeholder="項目">
    <input id="spAmount" type="number" placeholder="總金額">
    <select id="spCur">${currencies.map(c=>`<option>${c}</option>`).join("")}</select>
    <div>${t.members.map(m=>`<label class="tag"><input type="checkbox" name="splitPeople" value="${esc(m)}"> ${esc(m)}</label>`).join("")}</div>
    <button class="btn primary" onclick="addSplit()">新增分攤</button>
  </section>
  ${!t.splits.length ? `<section class="card empty">還沒有分攤紀錄 👨‍👩‍👧‍👦</section>` : ""}
  ${t.splits.map((x,i)=>`
    <section class="card">
      <h3>${esc(x.name)}</h3><div class="money">${x.amount} ${x.cur}</div>
      <p>約 NT$ ${toTWD(x.amount,x.cur)}</p>
      <p>分攤：${x.people.join("、")}</p>
      <p>每人：約 NT$ ${Math.round(toTWD(x.amount,x.cur) / x.people.length)}</p>
      <button class="btn" onclick="editSplit(${i})">編輯</button>
      <button class="btn danger" onclick="deleteSplit(${i})">刪除</button>
    </section>`).join("")}`;
}
function addSplit(){
  const people = [...document.querySelectorAll("input[name=splitPeople]:checked")].map(x=>x.value);
  if(!people.length) return alert("請勾選分攤成員");
  trip().splits.push({name:spName.value,amount:spAmount.value,cur:spCur.value,people});
  render();
}
function deleteSplit(i){ if(confirm("刪除這筆分攤？")){ trip().splits.splice(i,1); render(); } }
function editSplit(i){
  const t = trip(), x = t.splits[i];
  openModal(`
    <h2>編輯分攤</h2>
    <input id="seName" value="${esc(x.name)}">
    <input id="seAmount" type="number" value="${esc(x.amount)}">
    <select id="seCur">${currencies.map(c=>`<option ${c===x.cur?"selected":""}>${c}</option>`).join("")}</select>
    <div>${t.members.map(m=>`<label class="tag"><input type="checkbox" name="editSplitPeople" value="${esc(m)}" ${x.people.includes(m)?"checked":""}> ${esc(m)}</label>`).join("")}</div>
    <button class="btn primary" onclick="saveSplitEdit(${i})">儲存</button>
    <button class="btn" onclick="closeModal()">取消</button>
  `);
}
function saveSplitEdit(i){
  const people = [...document.querySelectorAll("input[name=editSplitPeople]:checked")].map(x=>x.value);
  if(!people.length) return alert("請勾選分攤成員");
  Object.assign(trip().splits[i],{name:seName.value,amount:seAmount.value,cur:seCur.value,people});
  closeModal(); render();
}

/* Buy */
function renderBuy(){
  const t = trip();
  const grouped = {};
  t.buy.forEach((x,i)=>{
    const area = x.area || "未分類";
    if(!grouped[area]) grouped[area] = [];
    grouped[area].push({...x,i});
  });
  return `
  <section class="card">
    <h2>🛍 必買</h2>
    <p class="small">地區自己輸入，系統會自動把相同地區排在一起。</p>
    <input id="buyName" placeholder="商品名稱">
    <input id="buyArea" placeholder="地區／會經過的地方">
    <textarea id="buyMemo" placeholder="備註"></textarea>
    <input id="buyPic" type="file" accept="image/*">
    <button class="btn primary" onclick="addBuy()">新增</button>
  </section>
  ${!t.buy.length ? `<section class="card empty">還沒有必買清單 🛍</section>` : ""}
  ${Object.keys(grouped).sort().map(area=>`
    <h3 class="area-title">${esc(area)}</h3>
    <div class="grid">${grouped[area].map(x=>`
      <section class="card">
        ${x.pic ? `<img class="pic" src="${x.pic}">` : ""}
        <h3>${esc(x.name)}</h3>
        ${x.memo ? `<p class="note">${esc(x.memo)}</p>` : ""}
        <button class="btn" onclick="editBuy(${x.i})">編輯</button>
        <button class="btn danger" onclick="deleteBuy(${x.i})">刪除</button>
      </section>`).join("")}</div>`).join("")}`;
}
function addBuy(){
  readImage(buyPic, pic => {
    trip().buy.push({name:buyName.value,area:buyArea.value || "未分類",memo:buyMemo.value,pic});
    render();
  });
}
function deleteBuy(i){ if(confirm("刪除這項必買？")){ trip().buy.splice(i,1); render(); } }
function editBuy(i){
  const x = trip().buy[i];
  openModal(`
    <h2>編輯必買</h2>
    <input id="beName" value="${esc(x.name)}">
    <input id="beArea" value="${esc(x.area)}">
    <textarea id="beMemo">${esc(x.memo)}</textarea>
    ${x.pic ? `<img class="pic" src="${x.pic}">` : ""}
    <input id="bePic" type="file" accept="image/*">
    <button class="btn primary" onclick="saveBuyEdit(${i})">儲存</button>
    <button class="btn" onclick="closeModal()">取消</button>
  `);
}
function saveBuyEdit(i){
  const x = trip().buy[i];
  readImage(bePic, pic => {
    Object.assign(x,{name:beName.value,area:beArea.value || "未分類",memo:beMemo.value});
    if(pic) x.pic = pic;
    closeModal(); render();
  });
}

render();
