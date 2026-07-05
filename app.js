
const STORE_KEY="bearTravelPlanner_v12";
const OLD_KEYS=["bearTravelPlanner_v11","bearTravelPlanner_v10","bearTravelPlanner_v5","bearTravelPlanner_v3","bearTravelPlanner_v2_full","bearTravelPlanner_v1_full","bearTravelPlannerV4","bearMultiTripV3","bearMultiTrip"];
const types=["🏯 景點","🏨 住宿","🍜 美食","🛍 購物","☕ 咖啡廳"];
const transports=["🚗 開車","🚶‍♀️ 走路","🚕 計程車","🚆 大眾交通","🚌 巴士"];
const currencies=["JPY","TWD","KRW","THB"];
const week=["Sun.","Mon.","Tue.","Wed.","Thu.","Fri.","Sat."];
let state=loadState(), currentTripId=state.trips[0]?.id||null, currentTab=0, filterType="全部", dragInfo=null;

const app=document.getElementById("app"), tabsEl=document.getElementById("tabs"), subtitle=document.getElementById("subtitle"), mainTitle=document.getElementById("mainTitle"), modal=document.getElementById("modal"), modalBody=document.getElementById("modalBody"), backToTrips=document.getElementById("backToTrips");
backToTrips.onclick=()=>{currentTripId=null;currentTab=0;render()}; modal.onclick=e=>{if(e.target.id==="modal")closeModal()};

function defTrip(){return {id:Date.now()+Math.random(),name:"🍁 福岡 Autumn",date:"2026.10.10－10.14",startDate:"2026-10-10",members:["爸爸","媽媽","弟弟","妹妹","🐻","👦🏻"],mainCurrency:"JPY",rates:{JPY:.21,TWD:1,KRW:.023,THB:.9},flight:{go:{airline:"",no:"",from:"TPE",to:"FUK",time:"",duration:"",terminal:"",note:""},back:{airline:"",no:"",from:"FUK",to:"TPE",time:"",duration:"",terminal:"",note:""}},days:Array.from({length:5},()=>[]),expenses:[],splits:[],buy:[],dayMeta:[]}}
function loadState(){try{let raw=localStorage.getItem(STORE_KEY); if(!raw){for(const k of OLD_KEYS){raw=localStorage.getItem(k);if(raw)break}} const s=raw?JSON.parse(raw):{trips:[defTrip()]}; if(!s.trips?.length)s.trips=[defTrip()]; s.trips.forEach(norm); return s}catch{return{trips:[defTrip()]}}}
function norm(t){t.members||=[];t.mainCurrency||="JPY";t.rates||={JPY:.21,TWD:1,KRW:.023,THB:.9};t.days=(t.days&&t.days.length)?t.days:[[],[],[],[],[]];t.expenses||=[];t.splits||=[];t.buy||=[];t.dayMeta||=[];while(t.dayMeta.length<t.days.length)t.dayMeta.push({weather:"",outfit:""});t.startDate=t.startDate||parseStartDate(t.date)||""; if(!t.flight)t.flight=defTrip().flight; if(typeof t.flight.go==="string")t.flight=defTrip().flight; ["go","back"].forEach(k=>{t.flight[k]||={};Object.assign(t.flight[k],{airline:t.flight[k].airline||"",no:t.flight[k].no||"",from:t.flight[k].from||(k==="go"?"TPE":"FUK"),to:t.flight[k].to||(k==="go"?"FUK":"TPE"),time:t.flight[k].time||"",duration:t.flight[k].duration||"",terminal:t.flight[k].terminal||"",note:t.flight[k].note||""})})}
function parseStartDate(str){const m=String(str||"").match(/(\d{4})[.\/-](\d{1,2})[.\/-](\d{1,2})/);if(!m)return "";return `${m[1]}-${String(m[2]).padStart(2,"0")}-${String(m[3]).padStart(2,"0")}`}
function save(){localStorage.setItem(STORE_KEY,JSON.stringify(state))}
function trip(){return state.trips.find(t=>t.id==currentTripId)}
function esc(s){return String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;")}
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
function openModal(h){modalBody.innerHTML=h;modal.classList.remove("hidden")}function closeModal(){modal.classList.add("hidden");modalBody.innerHTML=""}
function tabs(){if(!currentTripId)return["旅程"];const t=trip();return["總覽","航班",...t.days.map((_,i)=>`Day ${i+1}`),"記帳","分攤","必買"]}
function renderTabs(){tabsEl.innerHTML=tabs().map((x,i)=>`<button class="${i===currentTab?'active':''}" onclick="setTab(${i})">${x}</button>`).join("")}
function setTab(i){currentTab=i;filterType="全部";render()}
function render(){save();renderTabs();const t=trip();backToTrips.classList.toggle("hidden",!currentTripId);if(mainTitle)mainTitle.textContent=currentTripId?`${t.name} | ${t.date||"未設定日期"}`:"🍁 Bear Travel Planner";if(subtitle)subtitle.textContent="";if(!currentTripId){app.innerHTML=tripList();return} if(currentTab===0)app.innerHTML=overview();else if(currentTab===1)app.innerHTML=flight();else if(currentTab>=2&&currentTab<2+t.days.length)app.innerHTML=day(currentTab-2);else if(currentTab===2+t.days.length)app.innerHTML=expenses();else if(currentTab===3+t.days.length)app.innerHTML=splits();else app.innerHTML=buy()}
function dayDate(i){if(!trip().startDate)return{w:"DAY",d:`Day ${i+1}`,full:`Day ${i+1}`};const d=new Date(trip().startDate+"T00:00:00");d.setDate(d.getDate()+i);return{w:week[d.getDay()],d:`${d.getDate()}`,full:`${d.getMonth()+1}/${d.getDate()}`}}
function itemClass(x){const s=x.type||"";if(s.includes("住宿"))return"stay";if(s.includes("美食"))return"food";if(s.includes("購物"))return"shop";if(s.includes("咖啡"))return"cafe";return""}
function typeIcon(x){const s=x||"";if(s.includes("住宿"))return"🏨";if(s.includes("美食"))return"🍜";if(s.includes("購物"))return"🛍";if(s.includes("咖啡"))return"☕";return"🏯"}

/* touch drag */
function startTouchDrag(e,d,i){dragInfo={d,i,el:e.currentTarget};e.currentTarget.classList.add("dragging")}
function moveTouchDrag(e){e.preventDefault();const t=e.touches[0],el=document.elementFromPoint(t.clientX,t.clientY);document.querySelectorAll(".drop-target").forEach(x=>x.classList.remove("drop-target"));const card=el&&el.closest&&el.closest(".it-card");if(card)card.classList.add("drop-target")}
function endTouchDrag(e){const t=e.changedTouches[0],el=document.elementFromPoint(t.clientX,t.clientY),card=el&&el.closest&&el.closest(".it-card");document.querySelectorAll(".drop-target").forEach(x=>x.classList.remove("drop-target"));if(dragInfo?.el)dragInfo.el.classList.remove("dragging");if(card&&dragInfo){const to=Number(card.dataset.idx);moveTo(dragInfo.d,dragInfo.i,to)}dragInfo=null}

/* trips */
function tripList(){return `<section class="card"><h2>🧸 我的旅程</h2><input id="tn" placeholder="旅程名稱"><input id="td" placeholder="日期顯示"><input id="ts" type="date"><input id="tm" placeholder="旅伴，用逗號分隔"><input id="tnum" type="number" placeholder="天數"><select id="tc"><option value="JPY">日幣 JPY</option><option value="TWD">台幣 TWD</option><option value="KRW">韓幣 KRW</option><option value="THB">泰幣 THB</option></select><button class="btn primary" onclick="addTrip()">新增旅程</button></section>${state.trips.map((t,i)=>`<section class="card trip-card"><div onclick="currentTripId=${t.id};currentTab=0;render()"><h2>${esc(t.name)}</h2><p>${esc(t.date)}</p><p class="small">${t.days.length} 天｜${t.mainCurrency||"JPY"}｜${t.members.join("、")}</p></div><button class="btn" onclick="editTrip(${i})">編輯</button><button class="btn danger" onclick="delTrip(${i})">刪除</button></section>`).join("")}`}
function addTrip(){const t=defTrip();t.name=tn.value||"未命名旅程";t.date=td.value||"";t.startDate=ts.value||"";t.mainCurrency=tc.value;t.members=tm.value?tm.value.split(",").map(x=>x.trim()).filter(Boolean):[];t.days=Array.from({length:Math.max(1,Number(tnum.value||5))},()=>[]);state.trips.push(t);currentTripId=t.id;currentTab=0;render()}
function editTrip(i){const t=state.trips[i];openModal(`<h2>編輯旅程</h2><input id="en" value="${esc(t.name)}"><input id="ed" value="${esc(t.date)}"><input id="es" type="date" value="${esc(t.startDate)}"><input id="em" value="${esc(t.members.join(","))}"><select id="ec">${currencies.map(c=>`<option value="${c}" ${c===(t.mainCurrency||"JPY")?"selected":""}>${c}</option>`).join("")}</select><button class="btn primary" onclick="state.trips[${i}].name=en.value;state.trips[${i}].date=ed.value;state.trips[${i}].startDate=es.value;state.trips[${i}].members=em.value.split(',').map(x=>x.trim()).filter(Boolean);state.trips[${i}].mainCurrency=ec.value;closeModal();render()">儲存</button>`)}
function delTrip(i){if(state.trips.length<=1)return alert("至少保留一趟旅程");if(confirm("刪除旅程？")){state.trips.splice(i,1);currentTripId=state.trips[0].id;render()}}

/* overview */
function overview(){const t=trip();return `<section class="trip-hero"><h2>${esc(t.name)}</h2><p>${esc(t.date)}</p><p>${t.days.length}天｜${t.members.length}位旅伴｜${t.days.flat().length}個行程｜${t.mainCurrency}</p></section><section class="card"><h3>旅伴設定</h3><input id="members" value="${esc(t.members.join(","))}"><button class="btn primary" onclick="trip().members=members.value.split(',').map(x=>x.trim()).filter(Boolean);render()">更新旅伴</button><h3>主要幣別</h3><select id="mainCur">${currencies.map(c=>`<option value="${c}" ${c===(t.mainCurrency||"JPY")?"selected":""}>${c}</option>`).join("")}</select><button class="btn primary" onclick="trip().mainCurrency=mainCur.value;render()">更新幣別</button><h3>天數設定</h3><button class="btn dark" onclick="trip().days.push([]);render()">＋增加一天</button><button class="btn danger" onclick="removeDay()">－減少一天</button></section>`}
function removeDay(){if(trip().days.length<=1)return;if(confirm("刪除最後一天？")){trip().days.pop();render()}}

/* flight */
function flight(){const f=trip().flight;return `<section class="card"><h2>✈️ 航班頁</h2><p class="small">頁面只顯示精緻卡片；點編輯輸入資訊。</p><div class="flight-edit-card">${flightBlock("去程",f.go)}<div class="flight-edit-actions"><button class="btn primary" onclick="editFlight('go')">編輯去程</button></div></div><div class="flight-edit-card">${flightBlock("回程",f.back)}<div class="flight-edit-actions"><button class="btn primary" onclick="editFlight('back')">編輯回程</button></div></div></section>`}
function flightBlock(title,x){return `<h3>${title}</h3><div class="flight-card compact"><b>${esc(x.airline||"航空公司")} ${esc(x.no||"航班號")}</b><div class="flight-route"><div><div class="airport">${esc(x.from||"TPE")}</div><small>出發</small></div><div class="arrow">→</div><div><div class="airport">${esc(x.to||"FUK")}</div><small>抵達</small></div></div><div class="flight-info"><div>航班時間<b>${esc(x.time||"未填")}</b></div><div>飛行時間<b>${esc(x.duration||"未填")}</b></div><div>航廈<b>${esc(x.terminal||"未填")}</b></div><div>備註<b>${esc(x.note||"—")}</b></div></div></div>`}
function editFlight(which){const x=trip().flight[which];openModal(`<h2>編輯${which==="go"?"去程":"回程"}航班</h2><input id="fAirline" placeholder="航空公司" value="${esc(x.airline)}"><input id="fNo" placeholder="航班號" value="${esc(x.no)}"><div class="grid"><input id="fFrom" placeholder="出發機場代碼" value="${esc(x.from)}"><input id="fTo" placeholder="抵達機場代碼" value="${esc(x.to)}"></div><input id="fTime" placeholder="航班時間" value="${esc(x.time)}"><input id="fDuration" placeholder="飛行時間" value="${esc(x.duration)}"><input id="fTerminal" placeholder="航廈" value="${esc(x.terminal)}"><textarea id="fNote" placeholder="備註">${esc(x.note)}</textarea><button class="btn primary" onclick="saveFlight('${which}')">儲存</button><button class="btn" onclick="closeModal()">取消</button>`)}
function saveFlight(which){trip().flight[which]={airline:fAirline.value,no:fNo.value,from:fFrom.value,to:fTo.value,time:fTime.value,duration:fDuration.value,terminal:fTerminal.value,note:fNote.value};closeModal();render()}

/* itinerary */
function weatherIcon(text){const v=String(text||"");if(/雨|rain|傘/.test(v))return "🌧️";if(/雷/.test(v))return "⛈️";if(/雪/.test(v))return "❄️";if(/晴|太陽|sun/.test(v))return "☀️";if(/多雲|雲/.test(v))return "⛅";if(/陰|cloud/.test(v))return "☁️";if(/冷|涼/.test(v))return "🌬️";return "☁️"}
function day(i){const t=trip(),list=t.days[i],meta=t.dayMeta[i]||{weather:"",outfit:""};return `<section class="trip-hero"><div class="date-strip">${t.days.map((_,idx)=>{const d=dayDate(idx);return `<div class="date-chip ${idx===i?'active':''}" onclick="setTab(${idx+2})"><div class="date-main">${d.w}</div><div class="week-main">${d.d}</div></div>`}).join("")}</div><div class="day-meta-grid"><div class="mini-info-card"><div class="mini-info-head"><b>${weatherIcon(meta.weather)} 天氣</b><button class="tiny-edit" onclick="editDayMeta(${i},'weather')">編輯</button></div><p>${esc(meta.weather||"點編輯輸入天氣")}</p></div><div class="mini-info-card"><div class="mini-info-head"><b>👕 穿著</b><button class="tiny-edit" onclick="editDayMeta(${i},'outfit')">編輯</button></div><p>${esc(meta.outfit||"點編輯輸入穿著備註")}</p></div></div></section><div class="filters">${["全部","景點","住宿","美食","購物"].map(f=>`<button class="${filterType===f?'on':''}" onclick="filterType='${f}';render()">${f}</button>`).join("")}<button class="add-filter" onclick="openItForm(${i})">＋新增行程</button></div>${filteredList(list).length?`<div class="timeline">${filteredList(list).map(x=>card(x,list.indexOf(x),i,list)).join("")}</div>`:`<section class="card empty">這個分類還沒有行程 🍂</section>`}`
}
function editDayMeta(i,key){const meta=trip().dayMeta[i]||(trip().dayMeta[i]={weather:"",outfit:""});openModal(`<h2>${key==='weather'?'編輯天氣':'編輯穿著'}</h2><textarea id="metaText" placeholder="${key==='weather'?'例如：18度陰天':'例如：薄外套、晚上加件外套'}">${esc(meta[key]||"")}</textarea><button class="btn primary" onclick="saveDayMeta(${i},'${key}')">儲存</button><button class="btn" onclick="closeModal()">取消</button>`)}
function saveDayMeta(i,key){const meta=trip().dayMeta[i]||(trip().dayMeta[i]={weather:"",outfit:""});meta[key]=metaText.value;closeModal();render()}
function filteredList(list){return filterType==="全部"?list:list.filter(x=>(x.type||"").includes(filterType))}
function card(x,i,d,list){const move=i<list.length-1?`<div class="move-line">${esc(x.trans||"🚗 開車")} 約 ${esc(x.moveTime||"未填")}</div>`:"";return `<section class="it-card ${itemClass(x)}" data-idx="${i}" draggable="true" ondragstart="window.dragIndex=${i};this.classList.add('dragging')" ondragend="this.classList.remove('dragging')" ondragover="event.preventDefault();this.classList.add('drop-target')" ondragleave="this.classList.remove('drop-target')" ondrop="dropItem(${d},${i})"><div class="it-head"><div class="media-stack"><div class="it-icon">${typeIcon(x.type)}</div>${x.photo?`<img class="pic" src="${x.photo}">`:""}</div><div class="it-body"><div class="it-title-row"><div class="it-title">${esc(x.name||"未命名")}</div><div class="right-time">${esc(x.arrive||"")}</div></div><div class="chips">${x.stay?`<span class="chip">⏱ ${esc(x.stay)}</span>`:""}</div>${x.memo?`<p class="note">${esc(x.memo)}</p>`:""}<div class="card-actions-row">${x.map?`<a class="btn green" href="${esc(x.map)}" target="_blank">導航</a>`:`<button class="btn green" onclick="alert('尚未填寫導航連結')">導航</button>`}<button class="btn" onclick="editItem(${d},${i})">編輯</button><button class="btn danger" onclick="delItem(${d},${i})">刪除</button><span class="drag-grip" ontouchstart="startTouchDrag(event,${d},${i})" ontouchmove="moveTouchDrag(event)" ontouchend="endTouchDrag(event)">≡</span></div></div></div></section>${move}`}
function form(x={},action){return `<h2>${x.name?"編輯":"新增"}行程</h2><select id="itType">${types.map(v=>`<option ${v===x.type?"selected":""}>${v}</option>`).join("")}</select><input id="itName" placeholder="名稱" value="${esc(x.name)}"><input id="itMap" placeholder="Google Maps連結" value="${esc(x.map)}"><div class="grid"><input id="itArrive" placeholder="抵達時間" value="${esc(x.arrive)}"><input id="itStay" placeholder="停留時間" value="${esc(x.stay)}"></div><select id="itTrans">${transports.map(v=>`<option ${v===x.trans?"selected":""}>${v}</option>`).join("")}</select><input id="itMove" placeholder="到下一站時間，例如 25分鐘" value="${esc(x.moveTime)}"><textarea id="itMemo" placeholder="備註">${esc(x.memo)}</textarea>${x.photo?`<img class="pic" src="${x.photo}">`:""}<input id="itPhoto" type="file" accept="image/*"><button class="btn primary" onclick="${action}">儲存</button>`}
function openItForm(d){openModal(form({},`addItem(${d})`))}
function addItem(d){readImage(itPhoto,photo=>{trip().days[d].push({type:itType.value,name:itName.value,map:itMap.value,arrive:itArrive.value,stay:itStay.value,trans:itTrans.value,moveTime:itMove.value,memo:itMemo.value,photo});closeModal();render()})}
function editItem(d,i){openModal(form(trip().days[d][i],`saveItem(${d},${i})`))}
function saveItem(d,i){const x=trip().days[d][i];readImage(itPhoto,photo=>{Object.assign(x,{type:itType.value,name:itName.value,map:itMap.value,arrive:itArrive.value,stay:itStay.value,trans:itTrans.value,moveTime:itMove.value,memo:itMemo.value});if(photo)x.photo=photo;closeModal();render()})}
function delItem(d,i){if(confirm("刪除行程？")){trip().days[d].splice(i,1);render()}}
function dropItem(d,i){const arr=trip().days[d];if(window.dragIndex==null)return;const it=arr.splice(window.dragIndex,1)[0];arr.splice(i,0,it);window.dragIndex=null;render()}
function moveTo(d,from,to){to=Number(to);if(from===to)return;const arr=trip().days[d],it=arr.splice(from,1)[0];arr.splice(to,0,it);render()}

/* money */
function rateBox(){const t=trip(),c=t.mainCurrency||"JPY";return `<section class="card"><h3>匯率設定</h3><label>${c}<input type="number" step="0.001" value="${t.rates[c]}" onchange="trip().rates['${c}']=Number(this.value);render()"></label></section>`}
function previewFile(input, targetId){
  const box=document.getElementById(targetId); if(!box)return;
  const f=input.files&&input.files[0];
  if(!f){box.innerHTML="";return}
  const url=URL.createObjectURL(f);
  box.innerHTML=`<img class="receipt-preview" src="${url}"><p class="small">已上傳圖片，可先確認是否清楚。</p>`;
}
function receiptScan(){
  openModal(`<h2>掃描收據</h2><p class="small">目前先提供「上傳預覽＋確認明細」流程；若要真的自動辨識日文收據，需要另外串 OCR / AI API。</p><input id="scanReceipt" type="file" accept="image/*" onchange="previewFile(this,'scanPreview')"><div id="scanPreview"></div><button class="btn primary" onclick="mockRecognizeReceipt()">AI 辨識收據</button><button class="btn" onclick="closeModal()">取消</button>`)
}
function mockRecognizeReceipt(){
  readImage(scanReceipt,receipt=>{
    modalBody.innerHTML=`<h2>確認收據內容</h2><p class="small">請確認或修改以下辨識結果。</p><div class="receipt-confirm-card"><input id="rcStore" placeholder="店名／商店" value=""><input id="rcDate" type="date" value=""><h3>購買明細</h3><div id="receiptLines">${receiptLineHtml(1)}${receiptLineHtml(2)}</div><button class="btn" onclick="addReceiptLine()">＋新增品項</button></div>${receipt?`<img class="receipt-preview" src="${receipt}">`:""}<button class="btn primary" onclick="saveReceiptExpense('${receipt}')">確認儲存</button><button class="btn" onclick="closeModal()">取消</button>`;
  })
}
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
function expenses(){const t=trip(),c=t.mainCurrency||"JPY";let total=0;t.expenses.forEach(x=>{if((x.cur||c)===c)total+=Number(x.amount||0)});return `${rateBox()}<section class="card"><h2>💰 記帳</h2><div class="card"><b>${c} 總額</b><div class="money">${total} ${c}</div><p>約 NT$ ${Math.round(total*(t.rates[c]||1))}</p></div><button class="btn primary" onclick="receiptScan()">📷 掃描收據</button><input id="exName" placeholder="項目名稱"><input id="exAmount" type="number" placeholder="金額"><textarea id="exMemo" placeholder="備註"></textarea><input id="exReceipt" type="file" accept="image/*" onchange="previewFile(this,'expensePreview')"><div id="expensePreview"></div><button class="btn primary" onclick="addExpense()">新增</button></section>${t.expenses.map((x,i)=>`<section class="card">${x.receipt?`<img class="pic expense-thumb" src="${x.receipt}">`:""}<h3>${esc(x.name)}</h3><div class="money">${x.amount} ${x.cur||c}</div><p>約 NT$ ${toTWD(x.amount,x.cur||c)}</p>${x.memo?`<p class="note">${esc(x.memo)}</p>`:""}<button class="btn" onclick="editExpense(${i})">編輯</button><button class="btn danger" onclick="delExpense(${i})">刪除</button></section>`).join("")}`}
function addExpense(){const c=trip().mainCurrency||"JPY";readImage(exReceipt,receipt=>{trip().expenses.push({name:exName.value,amount:exAmount.value,cur:c,memo:exMemo.value,receipt});render()})}
function editExpense(i){const x=trip().expenses[i],c=x.cur||trip().mainCurrency||"JPY";openModal(`<h2>編輯記帳</h2><input id="eeName" value="${esc(x.name)}" placeholder="項目名稱"><input id="eeAmount" type="number" value="${esc(x.amount)}" placeholder="金額"><select id="eeCur">${currencies.map(v=>`<option value="${v}" ${v===c?'selected':''}>${v}</option>`).join('')}</select><textarea id="eeMemo" placeholder="備註">${esc(x.memo||"")}</textarea>${x.receipt?`<img class="receipt-preview" src="${x.receipt}">`:""}<input id="eeReceipt" type="file" accept="image/*" onchange="previewFile(this,'eePreview')"><div id="eePreview"></div><button class="btn primary" onclick="saveExpenseEdit(${i})">儲存</button><button class="btn" onclick="closeModal()">取消</button>`)}
function saveExpenseEdit(i){const x=trip().expenses[i];readImage(eeReceipt,receipt=>{Object.assign(x,{name:eeName.value,amount:eeAmount.value,cur:eeCur.value,memo:eeMemo.value});if(receipt)x.receipt=receipt;closeModal();render()})}
function delExpense(i){if(confirm("刪除這筆記帳？")){trip().expenses.splice(i,1);render()}}
function splits(){const t=trip(),c=t.mainCurrency||"JPY",tot={};t.members.forEach(m=>tot[m]=0);t.splits.forEach(x=>x.people.forEach(p=>{if((x.cur||c)===c)tot[p]+=Number(x.amount||0)/x.people.length}));return `${rateBox()}<section class="card"><h2>👨‍👩‍👧‍👦 分攤</h2><div class="grid">${t.members.map(m=>`<div class="card"><b>${esc(m)}</b><div class="money">${Math.round(tot[m]||0)} ${c}</div></div>`).join("")}</div><input id="spName" placeholder="項目"><input id="spAmount" type="number" placeholder="總金額"><div class="people-box">${t.members.map(m=>`<label class="tag"><input type="checkbox" name="sp" value="${esc(m)}"> ${esc(m)}</label>`).join("")}</div><button class="btn primary" onclick="addSplit()">新增</button></section>${t.splits.map((x,i)=>`<section class="card"><h3>${esc(x.name)}</h3><p>${x.amount} ${x.cur||c}｜${x.people.join("、")}</p><p>每人：${Math.round(Number(x.amount||0)/x.people.length)} ${x.cur||c}</p><button class="btn" onclick="editSplit(${i})">編輯</button><button class="btn danger" onclick="delSplit(${i})">刪除</button></section>`).join("")}`}
function addSplit(){const people=[...document.querySelectorAll("input[name=sp]:checked")].map(x=>x.value),c=trip().mainCurrency||"JPY";if(!people.length)return alert("請勾選成員");trip().splits.push({name:spName.value,amount:spAmount.value,cur:c,people});render()}
function editSplit(i){const x=trip().splits[i];openModal(`<h2>編輯分攤</h2><input id="seName" value="${esc(x.name)}"><input id="seAmount" type="number" value="${esc(x.amount)}"><div class="people-box">${trip().members.map(m=>`<label class="tag"><input type="checkbox" name="sep" value="${esc(m)}" ${x.people.includes(m)?'checked':''}> ${esc(m)}</label>`).join('')}</div><button class="btn primary" onclick="saveSplitEdit(${i})">儲存</button><button class="btn" onclick="closeModal()">取消</button>`)}
function saveSplitEdit(i){const people=[...document.querySelectorAll("input[name=sep]:checked")].map(x=>x.value);if(!people.length)return alert("請勾選成員");Object.assign(trip().splits[i],{name:seName.value,amount:seAmount.value,people});closeModal();render()}
function delSplit(i){if(confirm("刪除這筆分攤？")){trip().splits.splice(i,1);render()}}
function buy(){const t=trip(),g={};t.buy.forEach((x,i)=>{const a=x.area||"未分類";if(!g[a])g[a]=[];g[a].push({...x,i})});return `<section class="card"><h2>🛍 必買</h2><input id="buyName" placeholder="商品名稱"><input id="buyArea" placeholder="商店／地區"><textarea id="buyMemo" placeholder="備註"></textarea><input id="buyPic" type="file" accept="image/*"><button class="btn primary" onclick="addBuy()">新增</button></section>${Object.keys(g).sort().map(a=>`<section class="buy-card"><h3 class="area-title">${esc(a)}</h3><div class="buy-grid">${g[a].map(x=>`<div class="buy-item ${x.done?'done':''}">${x.pic?`<img class="buy-pic" src="${x.pic}">`:`<div class="buy-pic placeholder">🛍</div>`}<label><input type="checkbox" ${x.done?'checked':''} onchange="toggleBuy(${x.i})"> <b>${esc(x.name)}</b></label>${x.memo?`<small>${esc(x.memo)}</small>`:""}<button class="delete-mini" onclick="trip().buy.splice(${x.i},1);render()">刪除</button></div>`).join("")}</div></section>`).join("")}`}
function toggleBuy(i){trip().buy[i].done=!trip().buy[i].done;render()}
function addBuy(){readImage(buyPic,pic=>{trip().buy.push({name:buyName.value,area:buyArea.value||"未分類",memo:buyMemo.value,pic,done:false});render()})}
render();
