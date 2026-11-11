"use strict";
const BASE="https://suaghyqignjgqgwffzbt.supabase.co";
const KEY="sb_publishable_UIbvS8Aphy-A4vidQGGXDA_f3CWTeaK";
const E=id=>document.getElementById(id);
let token=null,role=null,profile=null,tab=null,driver=null,drivers=[],clients=[],orders=[],routes=[],stats=null,selectedRoute=null,routeData=null,changed=false,dragIndex=null,map=null,mapLayer=null;
const escape=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const date=()=>E("date").value;
const cash=(n,c="CAD")=>new Intl.NumberFormat("en-CA",{style:"currency",currency:c}).format(Number(n||0));
const pill=(v)=>{const x=String(v??"").toLowerCase();const cls=["delivered","completed","ready","active","paid","sent"].includes(x)?" good":["failed","cancelled","inactive","rejected"].includes(x)?" bad":["pending","loading","out_for_delivery","assigned","processing"].includes(x)?" warn":"";return '<span class="pill'+cls+'">'+escape(String(v??"").replaceAll("_"," "))+'</span>'};
const cell=v=>'<td>'+escape(v)+'</td>';
const card=(title,body)=>'<section class="card"><h2>'+escape(title)+'</h2>'+body+'</section>';
const metric=(v,title)=>'<div class="card metric"><strong>'+escape(v)+'</strong><span>'+escape(title)+'</span></div>';
const tiles=items=>'<div class="cards">'+items.join("")+'</div>';
function table(headers,rows){return '<div class="scroll"><table><thead><tr>'+headers.map(h=>'<th>'+escape(h)+'</th>').join("")+'</tr></thead><tbody>'+(rows.length?rows.join(""):'<tr><td colspan="'+headers.length+'">No records for this selection.</td></tr>')+'</tbody></table></div>'}
function notify(text,kind="bad"){E("notice").textContent=text;E("notice").className="notice "+kind;}
function clearNotice(){E("notice").className="notice hidden";}
function setView(html){clearMap();E("view").innerHTML=html;}
function clearMap(){if(map){map.remove();map=null;mapLayer=null}}
async function request(path,data,method){const headers={apikey:KEY};if(token)headers.Authorization="Bearer "+token;if(data!==undefined)headers["Content-Type"]="application/json";
const res=await fetch(BASE+path,{method:method||(data===undefined?"GET":"POST"),headers,body:data===undefined?undefined:JSON.stringify(data)});const out=await res.json().catch(()=>({}));
if(!res.ok||out.success===false){throw Error(out.message||out.error_description||out.error||"Request failed (HTTP "+res.status+")")}return out;}
const edge=(name,data)=>request("/functions/v1/"+name,data);
const rest=(table,params)=>request("/rest/v1/"+table+"?"+params);
const dayDefault=()=>{const fmt=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Toronto",year:"numeric",month:"2-digit",day:"2-digit"});const ps=fmt.formatToParts(new Date());const parts=Object.fromEntries(ps.map(p=>[p.type,p.value]));return parts.year+"-"+parts.month+"-"+parts.day};
function tabList(){
if(role==="admin")return [["overview","Overview"],["orders","Orders"],["routes","Routes & Map"],["drivers","Drivers"],["analytics","Analytics"],["payouts","Payouts"],["companies","Companies"],["notifications","Notifications"]];
if(role==="driver")return [["today","My routes"],["map","Map & sequence"],["scan","Pickup scanning"],["deliveries","Deliveries"]];
return [["company","Overview"],["companyorders","Orders"],["companymap","Delivery map"],["invoices","Invoices"]];
}

const ICONS={
overview:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
orders:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 12h6M9 17h4"/>',
routes:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15m6-12v15"/>',
drivers:'<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
analytics:'<path d="M4 20V12m5 8V7m5 13v-9m5 9V4"/>',
payouts:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/><circle cx="12" cy="15" r="2"/>',
companies:'<path d="M3 21V7l9-4 9 4v14zM8 11h1m6 0h1M8 15h1m6 0h1M10 21v-4h4v4"/>',
notifications:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
today:'<path d="M3 9h18M7 9V5h10v4M4 9v11h16V9M9 14h6"/>',
map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15m6-12v15"/>',
scan:'<path d="M4 9V5h5m6 0h5v4M4 15v4h5m6 0h5v-4M8 12h8"/>',
deliveries:'<path d="M3 7h11v10H3zM14 11h4l3 3v3h-7M7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4M18 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4"/>',
company:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 12h10M12 7v10"/>',
companyorders:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6m-6 4h6m-6 4h4"/>',
companymap:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15m6-12v15"/>',
invoices:'<path d="M5 3h14v18l-3-2-4 2-4-2-3 2zM9 8h6M9 12h6"/>'
};
function drawTabs(){
E("tabs").innerHTML=tabList().map(([id,title])=>'<button data-tab="'+id+'" class="'+(tab===id?"selected":"")+'" aria-current="'+(tab===id?"page":"false")+'"><span class="nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24">'+(ICONS[id]||ICONS.overview)+'</svg></span>'+escape(title)+'</button>').join("");
E("roleLabel").textContent=role==="admin"?"EKSA OPERATIONS":role==="driver"?"DRIVER PORTAL":"COMPANY PORTAL";
}

async function initialize(){
const p=await rest("profiles","select=role,client_id,full_name&user_id=eq."+encodeURIComponent(profile.id));
if(!Array.isArray(p)||!p.length||!["admin","driver","client"].includes(p[0].role))throw Error("Your EKSA user role is not configured");
role=p[0].role;profile={...p[0],user_id:profile.id};
if(role==="driver"){const d=await rest("drivers","select=id,display_name,vehicle_capacity,active&user_id=eq."+profile.user_id);driver=d[0]||null;if(!driver||!driver.active)throw Error("Driver account is not active")}
E("login").classList.add("hidden");E("shell").classList.remove("hidden");E("logout").classList.remove("hidden");
tab=role==="admin"?"overview":role==="driver"?"today":"company";drawTabs();await load();
}
E("loginForm").addEventListener("submit",async e=>{e.preventDefault();const b=e.submitter;b.disabled=true;
try{const auth=await request("/auth/v1/token?grant_type=password",{email:E("email").value.trim(),password:E("password").value});token=auth.access_token;profile={id:auth.user.id};E("password").value="";await initialize()}
catch(err){token=null;alert(err.message)}finally{b.disabled=false}});
E("logout").addEventListener("click",()=>{token=null;role=null;profile=null;driver=null;selectedRoute=null;routeData=null;clearMap();E("shell").classList.add("hidden");E("logout").classList.add("hidden");E("login").classList.remove("hidden")});
E("tabs").addEventListener("click",e=>{const button=e.target.closest("[data-tab]");if(!button)return;tab=button.dataset.tab;drawTabs();load().catch(err=>notify(err.message));});
E("refresh").addEventListener("click",()=>load().catch(err=>notify(err.message)));
E("date").addEventListener("change",()=>{selectedRoute=null;routeData=null;load().catch(err=>notify(err.message))});
E("date").value=dayDefault();
async function load(){
clearNotice();E("pageTitle").textContent=tabList().find(x=>x[0]===tab)?.[1]||"Dispatch";E("pageSub").textContent=role==="admin"?"Your command centre for every delivery":role==="driver"?"Your assigned deliveries and pickup progress":"Manage and monitor your meal-prep deliveries";E("view").innerHTML='<div class="card">Loading EKSA Dispatch…</div>';clearMap();
if(role==="admin")await adminLoad();else if(role==="driver")await driverLoad();else await companyLoad();
}
async function adminCommon(){
[drivers,clients]=await Promise.all([rest("drivers","select=id,display_name,active,vehicle_capacity&order=display_name&limit=250"),rest("clients","select=id,name,code&order=name&limit=250")]);
}
async function adminLoad(){
await adminCommon();
if(tab==="overview"||tab==="analytics"){stats=await edge("eksa-owner",{action:"metrics",date:date()});tab==="overview"?renderOverview():renderAnalytics();return;}
if(tab==="orders"){orders=await rest("orders","select=id,client_id,external_order_id,recipient_name,recipient_phone,address_line1,address_line2,delivery_instructions,city,postal_code,status,route_id,stop_sequence&delivery_date=eq."+date()+"&order=created_at.desc&limit=1000");renderAdminOrders();return}
if(tab==="routes"){routes=await rest("routes","select=id,city_group,route_date,status,driver_id,sequence_version&route_date=eq."+date()+"&order=created_at.desc&limit=250");renderAdminRoutes();return}
if(tab==="drivers"){routes=await rest("routes","select=id,driver_id,status&limit=1000");renderDrivers();return}
if(tab==="companies"){renderCompanies();return}
if(tab==="notifications"){await renderNotifications();return}
if(tab==="payouts"){await payoutLoad();return}
}
function renderOverview(){
const d=stats.daily,a=stats.all_time,p=stats.pickup;
setView(tiles([metric(d.orders,"Scheduled orders"),metric(d.delivered,"Delivered today"),metric(d.incoming,"Incoming orders"),metric(d.active,"In progress")])+
'<div class="cols">'+card("All-time delivery totals",tiles([metric(a.orders,"Processed"),metric(a.delivered,"Delivered"),metric(a.failed,"Failed"),metric(a.routed,"Routed")]))+
card("Pickup checks",tiles([metric(p.total,"Expected bags"),metric(p.scanned,"Scanned"),metric(p.remaining,"Remaining"),metric(p.flagged_missing,"Reported missing")]))+'</div>'+
card("Driver operations",table(["Driver","Assigned","Delivered","Bags scanned","Missing"],(stats.drivers||[]).map(x=>'<tr>'+cell(x.driver_name)+cell(x.assigned_orders)+cell(x.delivered)+cell(x.scanned_bags+" / "+x.total_bags)+cell(x.reported_missing)+'</tr>'))));
}
function renderAnalytics(){
const data=stats.chart||[],max=Math.max(1,...data.flatMap(x=>[x.orders_received,x.deliveries_done]));
const bars=data.map(x=>'<div class="chartgroup"><div class="bar" title="'+x.orders_received+' incoming" style="height:'+Math.max(2,106*x.orders_received/max)+'px"></div><div class="bar green" title="'+x.deliveries_done+' delivered" style="height:'+Math.max(2,106*x.deliveries_done/max)+'px"></div><small>'+escape(x.day.slice(5))+'</small></div>').join("");
setView(card("Incoming orders vs completed deliveries · 14 days",'<p>Blue = Incoming · Green = Completed</p><div class="chart">'+bars+'</div>')+card("Driver performance & time",'<p>Elapsed minutes from the out-for-delivery event to delivery confirmation; not pure driving time.</p>'+table(["Driver","Routes","Delivered","Failed","Average minutes"],(stats.drivers||[]).map(x=>'<tr>'+cell(x.driver_name)+cell(x.routes)+cell(x.delivered)+cell(x.failed)+cell(x.avg_minutes_from_out_for_delivery_to_dropoff??"No data")+'</tr>'))));
}

async function renderNotifications(){
const jobs=await rest("notification_jobs","select=order_id,channel,event_type,status,attempts,created_at,sent_at,last_error&order=created_at.desc&limit=200");
const pending=jobs.filter(x=>x.status==="pending").length;
const sent=jobs.filter(x=>x.status==="sent").length;
const failed=jobs.filter(x=>x.status==="failed").length;
setView(tiles([metric(jobs.length,"Tracked events"),metric(pending,"Pending"),metric(sent,"Sent"),metric(failed,"Failed")])+
card("Customer dispatch and delivery notices",'<p>Delivery changes queue SMS events if a customer phone is present. <strong>Messages are not being sent yet:</strong> an SMS provider and delivery worker must be configured and tested first.</p>'+
table(["Event","Channel","Status","Attempts","Created","Sent"],jobs.map(x=>'<tr>'+cell(x.event_type)+cell(x.channel)+'<td>'+pill(x.status)+'</td>'+cell(x.attempts)+cell(x.created_at?new Date(x.created_at).toLocaleString("en-CA"):"—")+cell(x.sent_at?new Date(x.sent_at).toLocaleString("en-CA"):"Not sent")+'</tr>'))));
}


async function printBagLabels(orderId){
const format=E("labelSize")?.value||"thermal";
const tab=window.open("","_blank");
if(!tab){notify("Allow pop-up windows for EKSA Dispatch to print labels.");return}
tab.document.title="Preparing EKSA barcode labels";
tab.document.body.innerHTML="<p style='font:16px system-ui;padding:24px'>Preparing EKSA bag labels…</p>";
try{
const response=await fetch(BASE+"/functions/v1/eksa-labels-view",{
method:"POST",
headers:{"apikey":KEY,"Authorization":"Bearer "+token,"Content-Type":"application/json"},
body:JSON.stringify({tracking_id:orderId,format})
});
if(!response.ok){
const err=await response.json().catch(()=>({}));
throw Error(err.message||err.error||"Label generation failed (HTTP "+response.status+")");
}
const html=await response.text();
if(!html.startsWith("<!doctype html")&&!html.startsWith("<!DOCTYPE html"))throw Error("Label service returned an unexpected format.");
tab.document.open();tab.document.write(html);tab.document.close();
tab.focus();
notify("Barcode labels opened in a new tab. Choose Print or Save as PDF in your browser.","ok");
}catch(error){tab.document.body.textContent="Could not generate labels: "+error.message;notify(error.message)}
}


async function openAdminOrder(id){
 const data=await edge("eksa-admin-edit",{action:"order_details",order_id:id});
 const o=data.order,bags=data.bags||[],events=data.events||[];
 document.getElementById("eksaOrderDialog")?.remove();
 const dialog=document.createElement("dialog");dialog.id="eksaOrderDialog";dialog.style.cssText="width:min(750px,96vw);max-height:90vh;overflow:auto;border:1px solid #ccd7ed;border-radius:16px;padding:24px";
 const wrapper=document.createElement("div");
 const fields=[["recipient_name","Customer name"],["recipient_phone","Phone"],["address_line1","Street address"],["address_line2","Unit / buzzer"],["city","City"],["postal_code","Postal code"],["delivery_instructions","Delivery instructions"]];
 const form='<form id="adminEditOrder"><div class="cols">'+fields.map(([key,label])=>'<div><label>'+label+'</label>'+(key==="delivery_instructions"?'<textarea name="'+key+'" maxlength="1000">'+escape(o[key]||"")+'</textarea>':'<input name="'+key+'" value="'+escape(o[key]||"")+'" '+(["recipient_name","address_line1","city"].includes(key)?"required":"")+'>')+'</div>').join("")+'</div><div style="margin:12px 0"><label>Reason for change (audit history)</label><input name="reason" placeholder="Corrected address, customer request, etc."></div><button>Save customer changes</button></form>';
 wrapper.innerHTML='<h2>Order '+escape(o.external_order_id)+'</h2><p>'+pill(o.status)+' '+escape(o.route_id?"Assigned to a route":"Not assigned")+'</p>'+form+
 '<h3>Bags ('+bags.length+')</h3>'+bags.map(b=>'<div class="flex" style="align-items:center;margin:6px 0"><span>Bag '+escape(b.bag_number)+' · '+escape(b.barcode)+'</span>'+(b.scanned_pickup_at?' <strong>Scanned</strong>':'<button class="minibtn mutedbtn" data-remove-bag="'+escape(b.id)+'">Remove bag</button>')+'</div>').join("")+
 '<div class="actions" style="margin:12px 0"><button class="minibtn" data-verify-address>Verify address with Google</button><button class="minibtn" data-add-bag>Add bag</button>'+(o.route_id?'<button class="minibtn mutedbtn" data-remove-route>Remove from route</button>':'<button class="minibtn mutedbtn" data-cancel-order>Cancel order</button>')+'</div>'+
 '<h3>Operations note</h3><form id="adminOrderNote"><textarea name="note" required maxlength="1000" placeholder="Leave an operations note or issue for the team"></textarea><button>Save note</button></form>'+
 '<h3>Event history</h3>'+(events.length?'<ul>'+events.slice(0,30).map(ev=>'<li>'+escape(ev.event_type)+' · '+escape(ev.created_at)+' '+escape(ev.notes||"")+'</li>').join("")+'</ul>':'<p>No events yet.</p>')+
 '<div class="actions" style="margin-top:18px"><button class="mutedbtn" data-close>Close</button></div>';
 dialog.append(wrapper);document.body.append(dialog);dialog.showModal();
 const act=async(action,data={})=>{
   const result=await edge("eksa-admin-edit",{action,entity_id:id,data});
   if(result.success===false)throw Error(result.error||"Action unavailable");
   dialog.close();dialog.remove();await load();notify("Order updated. Changes are in the audit trail. Recheck map coordinates after an address change.","ok");
 };
 dialog.addEventListener("close",()=>dialog.remove(),{once:true});
 wrapper.addEventListener("click",async e=>{
   const b=e.target.closest("button");if(!b||b.type==="submit")return;
   if(b.dataset.close!==undefined){dialog.close();return}
   try{
     if(b.dataset.verifyAddress!==undefined){
const result=await edge("eksa-geocode",{action:"geocode",order_id:id});
if(!result.success)throw Error(result.error||"Could not verify address");
notify("Customer street address verified. The route map will update when refreshed.","ok");
dialog.close();await load();return;
}
if(b.dataset.addBag!==undefined)await act("add_bag",{reason:"Bag quantity correction"});
     if(b.dataset.removeBag){if(confirm("Remove this unscanned bag?"))await act("remove_bag",{bag_id:b.dataset.removeBag,reason:"Bag quantity correction"})}
     if(b.dataset.removeRoute!==undefined){if(confirm("Unassign this order from the route?"))await act("remove_from_route",{reason:"Admin route correction"})}
     if(b.dataset.cancelOrder!==undefined){if(confirm("Cancel this order?"))await act("cancel_order",{reason:"Cancelled by EKSA admin"})}
   }catch(err){alert(err.message)}
 });
 wrapper.addEventListener("submit",async e=>{
   e.preventDefault();const form=e.target;try{
    if(form.id==="adminEditOrder"){
      const fd=new FormData(form);const fields=Object.fromEntries(fd.entries());
      await act("edit_order",fields);
    }else if(form.id==="adminOrderNote"){
      const fd=new FormData(form);await act("add_note",{note:String(fd.get("note")),on_behalf_of:"admin"});
    }
   }catch(err){alert(err.message)}
 });
}


function bulkUploadCard(admin=false){
 const clientSelect=admin?'<div><label>Company to import for</label><select name="client_id" required><option value="">Select company</option>'+clients.map(c=>'<option value="'+escape(c.id)+'">'+escape(c.name)+'</option>').join("")+'</select></div>':"";
 return card("Bulk import · Excel / CSV",'<a class="mutedbtn" href="eksa_sample_orders.csv" download="EKSA_Sample_Orders.csv" style="display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;font-weight:800;text-decoration:none;margin-bottom:14px">↓ Download editable sample CSV</a><p>Upload up to 300 rows per file. Required columns: <strong>order_id, customer_name, address, city, postal_code, delivery_date</strong>. Optional: phone, bag_count, address_line2, delivery_instructions, sms_consent. SMS consent must be explicitly <strong>true</strong> only if the customer agreed to delivery text alerts.</p>'+
 '<form id="bulkUploadForm"><div class="cols">'+clientSelect+'<div><label>Excel (.xlsx) or CSV file</label><input type="file" name="file" accept=".xlsx,.xls,.csv,text/csv" required></div></div><button type="submit">Validate & import orders</button></form><div id="bulkReport"></div>');
}
function parseCsv(text){
 let rows=[],row=[],value="",quoted=false;
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){if(c==='"'&&text[i+1]==='"'){value+='"';i++;}else if(c==='"')quoted=false;else value+=c;}
  else if(c==='"')quoted=true;
  else if(c===","){row.push(value);value="";}
  else if(c==="\n"||c==="\r"){if(c==="\r"&&text[i+1]==="\n")i++;row.push(value);if(row.some(x=>x.trim()))rows.push(row);row=[];value="";}
  else value+=c;
 }
 if(quoted)throw Error("CSV has an unclosed quoted field.");
 row.push(value);if(row.some(x=>x.trim()))rows.push(row);
 if(!rows.length)throw Error("The file is empty.");
 const head=rows.shift().map(v=>v.replace(/^\uFEFF/,"").trim().toLowerCase().replace(/[\s-]+/g,"_"));
 return rows.map(row=>Object.fromEntries(head.map((h,i)=>[h,(row[i]??"").trim()])));
}
async function rowsFromUpload(file){
 if(file.size>2000000)throw Error("File exceeds 2 MB. Split into batches of 300 rows.");
 if(/\.csv$/i.test(file.name))return parseCsv(await file.text());
 if(!/\.xlsx?$/i.test(file.name))throw Error("Choose an Excel .xlsx or .csv file.");
 if(!window.XLSX){
  await new Promise((resolve,reject)=>{const t=document.createElement("script");t.src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";t.onload=resolve;t.onerror=()=>reject(Error("Excel reader unavailable. Please save your spreadsheet as CSV and retry."));document.head.append(t)});
 }
 const workbook=window.XLSX.read(await file.arrayBuffer(),{type:"array",cellDates:false});
 const sheet=workbook.Sheets[workbook.SheetNames[0]];
 const items=window.XLSX.utils.sheet_to_json(sheet,{defval:"",raw:false});
 return items.map(x=>Object.fromEntries(Object.entries(x).map(([k,v])=>[k.trim().toLowerCase().replace(/[\s-]+/g,"_"),String(v??"").trim()])));
}
function normalizeImportRow(r,i){
 const get=(...aliases)=>{for(const a of aliases)if(r[a]!=null&&String(r[a]).trim())return String(r[a]).trim();return"";};
 const dateValue=get("delivery_date","date","delivery_day");
 const match=dateValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
 const yyyyDate=match?match[3]+"-"+match[1].padStart(2,"0")+"-"+match[2].padStart(2,"0"):dateValue;
 const consent=get("sms_consent","customer_sms_consent","sms_opt_in").toLowerCase();
 const count=Number(get("bag_count","bags","quantity")||1);
 return {order_id:get("order_id","order_number","reference","id"),customer_name:get("customer_name","recipient_name","customer","name"),address:get("address","street_address","address_line1"),
  address_line2:get("address_line2","unit","apartment","buzzer"),city:get("city"),postal_code:get("postal_code","postcode","zip"),
  delivery_date:yyyyDate,phone:get("phone","customer_phone","recipient_phone"),delivery_instructions:get("delivery_instructions","instructions","delivery_notes"),
  bag_count:count,sms_consent:["true","yes","1"].includes(consent)};
}
async function importFile(form){
 const fd=new FormData(form),file=fd.get("file");
 if(!(file instanceof File))throw Error("Choose an import file.");
 const rows=await rowsFromUpload(file);
 if(!rows.length||rows.length>300)throw Error("Import requires 1–300 data rows. Split larger files.");
 const normalized=rows.map(normalizeImportRow);
 const result=await edge("eksa-bulk-import",{client_id:role==="admin"?String(fd.get("client_id")):undefined,orders:normalized});
 const text="Received "+result.received+" rows · Created "+result.created+" · Existing duplicates "+result.duplicates+" · Rejected "+result.rejected;
 const errors=(result.errors||[]).slice(0,30).map(x=>"<li>Row "+escape(x.row)+": "+escape(x.order_id)+" — "+escape(x.reason)+"</li>").join("");
 const report=E("bulkReport");
 if(report)report.innerHTML="<p><strong>"+escape(text)+"</strong></p>"+(errors?"<ul>"+errors+"</ul>":"");
 notify(text,result.rejected?"bad":"ok");
}

function renderAdminOrders(){
const lookup=Object.fromEntries(clients.map(c=>[c.id,c.name]));
setView(bulkUploadCard(true)+card("Add one customer order",'<form id="adminSingleOrder"><div class="cols"><div><label>Company</label><select name="client_id" required><option value="">Choose company</option>'+clients.map(c=>'<option value="'+escape(c.id)+'">'+escape(c.name)+'</option>').join("")+'</select></div><div><label>Order ID</label><input name="order_id" required></div><div><label>Customer name</label><input name="customer_name" required></div><div><label>Customer phone</label><input name="phone" type="tel"></div><div><label>Street address</label><input name="address" required></div><div><label>Unit / buzzer</label><input name="address_line2"></div><div><label>City</label><input name="city" required></div><div><label>Postal code</label><input name="postal_code" required></div><div><label>Delivery date</label><input name="delivery_date" type="date" value="'+date()+'" required></div><div><label>Bags</label><input name="bag_count" type="number" min="1" max="20" value="1" required></div><div><label>Delivery instructions</label><textarea name="delivery_instructions" maxlength="1000"></textarea></div></div><label style="display:flex;align-items:center;gap:9px"><input type="checkbox" name="sms_consent" style="width:auto">Customer explicitly consented to delivery text messages</label><button type="submit">Add order</button></form>')+card("Company orders",'<p>Orders arrive automatically from each company. Print a unique barcode label for <strong>each physical bag</strong>; the assigned driver scans those labels at pickup. Use 4×6 thermal labels or regular A4/letter paper.</p>'+
'<div class="flex" style="margin:12px 0"><div class="field"><label>Label paper size</label><select id="labelSize"><option value="thermal">4×6 thermal</option><option value="letter">Letter</option><option value="a4">A4</option></select></div></div>'+
table(["Order","Company","Customer / address","City","Stop","Status","Actions"],orders.map(x=>'<tr>'+cell(x.external_order_id)+cell(lookup[x.client_id]||"—")+cell(x.recipient_name+" · "+x.address_line1+" "+(x.postal_code||""))+cell(x.city)+cell(x.stop_sequence??"—")+'<td>'+pill(x.status)+'</td><td><div class="actions"><button class="minibtn" data-order-details="'+escape(x.id)+'">View / Edit</button><button class="minibtn" data-print-label="'+escape(x.id)+'">Labels</button></div></td></tr>'))));
}
function renderAdminRoutes(){
const look=Object.fromEntries(drivers.map(x=>[x.id,x.display_name]));
const options=drivers.filter(x=>x.active).map(x=>'<option value="'+escape(x.id)+'">'+escape(x.display_name)+'</option>').join("");
const tableRows=routes.map(r=>'<tr>'+cell(r.city_group)+cell(r.route_date)+'<td>'+pill(r.status)+'</td>'+cell(look[r.driver_id]||"Unassigned")+'<td><div class="actions"><button class="minibtn" data-map="'+escape(r.id)+'">Map</button><button class="minibtn mutedbtn" data-opt-preview="'+escape(r.id)+'">Check optimization</button>'+
(!r.driver_id?'<select style="max-width:180px" data-pick="'+escape(r.id)+'"><option value="">Select driver</option>'+options+'</select><button class="minibtn" data-assign="'+escape(r.id)+'">Assign</button>':"")+'</div></td></tr>');
setView(card("Create routes",'<form class="flex" id="createRoute"><div class="field"><label>City</label><input name="city" required value="Brampton"></div><div class="field"><label>Maximum bags per route</label><input name="bags" type="number" min="1" max="300" value="80" required></div><button>Create routes</button></form><p>Routes can be planned and assigned before bags are scanned. Drivers confirm pickup before departure.</p>')+card("Assigned and draft routes",table(["City","Date","Status","Driver","Actions"],tableRows))+'<section id="routeMapArea"></section>');
}
function renderDrivers(){
setView(tiles([metric(drivers.length,"Registered"),metric(drivers.filter(x=>x.active).length,"Active"),metric(drivers.filter(x=>!x.active).length,"Inactive"),metric(routes.length,"Routes in system")])+
card("Invite driver",'<form id="inviteDriver" class="flex"><div class="field"><label>Name</label><input name="name" required></div><div class="field"><label>Email</label><input name="email" type="email" required></div><div class="field"><label>Vehicle capacity (bags)</label><input name="capacity" type="number" min="1" max="300" value="100" required></div><button>Send invitation</button></form><p>Already registered? <a href="../eksa-password.html" target="_blank" rel="noopener">Reset password</a>; do not invite twice.</p>')+
card("Driver team",table(["Driver","Status","Capacity","Routes","Action"],drivers.map(x=>'<tr>'+cell(x.display_name)+'<td>'+pill(x.active?"Active":"Inactive")+'</td>'+cell(x.vehicle_capacity)+cell(routes.filter(r=>r.driver_id===x.id).length)+'<td><div class="actions"><button class="minibtn mutedbtn" data-password-driver="'+escape(x.id)+'" data-driver-name="'+escape(x.display_name)+'">Set password</button><button class="minibtn mutedbtn" data-driver="'+escape(x.id)+'" data-active="'+(!x.active)+'">'+(x.active?"Deactivate":"Reactivate")+'</button></div></td></tr>'))));
}
function renderCompanies(){
setView(card("Create company",'<form class="flex" id="createCompany"><div class="field"><label>Company name</label><input name="name" required></div><div class="field"><label>Short company code</label><input name="code" required maxlength="20"></div><div class="field"><label>Billing email</label><input name="billing" type="email"></div><button>Add company</button></form>')+
card("Invite company staff",'<form class="flex" id="inviteCompany"><div class="field"><label>Company</label><select name="client" required><option value="">Select company</option>'+clients.map(c=>'<option value="'+escape(c.id)+'">'+escape(c.name)+'</option>').join("")+'</select></div><div class="field"><label>User email</label><input name="email" type="email" required></div><button>Send invitation</button></form><p>Each company can view only its own deliveries, orders, map, and finalized invoices.</p>')+
card("Companies",table(["Name","Code","Portal"],clients.map(c=>'<tr>'+cell(c.name)+cell(c.code)+'<td><a href="index.html">Company sign-in</a></td></tr>'))));
}
async function payoutLoad(){
const payouts=await edge("eksa-owner",{action:"payouts"});
const names=Object.fromEntries(drivers.map(d=>[d.id,d.display_name]));
setView(card("Driver pay rates",'<form class="flex" id="rateForm"><div class="field"><label>Driver</label><select name="driver" required><option value="">Select driver</option>'+drivers.map(d=>'<option value="'+escape(d.id)+'">'+escape(d.display_name)+'</option>').join("")+'</select></div><div class="field"><label>Effective from</label><input name="start" type="date" value="'+date()+'" required></div><div class="field"><label>Per delivery (CAD)</label><input name="delivery" type="number" min="0" step="0.01" value="0" required></div><div class="field"><label>Per bag (CAD)</label><input name="bag" type="number" min="0" step="0.01" value="0" required></div><button>Save new rate</button></form><p>Rates are specific to each driver. No payouts happen automatically.</p>')+
card("Prepare payout",'<form id="payoutForm" class="flex"><div class="field"><label>Driver</label><select name="driver" required><option value="">Select driver</option>'+drivers.map(d=>'<option value="'+escape(d.id)+'">'+escape(d.display_name)+'</option>').join("")+'</select></div><div class="field"><label>Start date</label><input name="start" type="date" value="'+date()+'" required></div><div class="field"><label>End date</label><input name="end" type="date" value="'+date()+'" required></div><button name="action" value="payout_preview" type="submit">Preview</button><button name="action" value="payout_create" type="submit">Create draft</button></form><p id="preview" class="subtle">Only delivered orders count toward payout. Duplicates are blocked.</p>')+
card("Payout history",table(["Driver","Period","Total","Status","Actions"],(payouts.payouts||[]).map(x=>'<tr>'+cell(names[x.driver_id]||"—")+cell(x.period_start+" – "+x.period_end)+cell(cash(x.total,x.currency))+'<td>'+pill(x.status)+'</td><td class="actions">'+(x.status==="draft"?'<button class="minibtn" data-payout="'+escape(x.id)+'" data-action="payout_approve">Approve</button>':'')+(x.status==="approved"?'<button class="minibtn" data-payout="'+escape(x.id)+'" data-action="payout_mark_paid">Mark paid</button>':'')+'</td></tr>'))));
}
async function driverCommon(){
routes=await rest("routes","select=id,route_date,city_group,status,driver_id,sequence_version&route_date=eq."+date()+"&order=created_at.desc&limit=250");
orders=await rest("orders","select=id,external_order_id,recipient_name,recipient_phone,address_line1,address_line2,delivery_instructions,city,postal_code,status,stop_sequence,route_id&delivery_date=eq."+date()+"&order=stop_sequence.asc&limit=750");
}
async function driverLoad(){
await driverCommon();const activeIds=new Set(routes.map(r=>r.id));orders=orders.filter(o=>activeIds.has(o.route_id));
if(tab==="today"){setView(tiles([metric(routes.length,"Assigned routes"),metric(orders.length,"Stops"),metric(orders.filter(o=>o.status==="delivered").length,"Delivered"),metric(orders.filter(o=>o.status==="failed").length,"Failed")])+
card("My assigned routes",'<p><strong>Start Route</strong> only becomes available after all assigned bags are scanned. It marks the route out for delivery and queues eligible customer notifications (sending awaits SMS provider setup).</p>'+table(["City","Date","Status","Action"],routes.map(r=>'<tr>'+cell(r.city_group)+cell(r.route_date)+'<td>'+pill(r.status)+'</td><td><div class="actions"><button class="minibtn" data-map="'+escape(r.id)+'">Open map</button>'+(["assigned","loading","ready"].includes(r.status)?'<button class="minibtn successbtn" data-start-route="'+escape(r.id)+'">▶ Start route</button>':"")+'</div></td></tr>')))+'<div id="routeMapArea"></div>');return}
if(tab==="map"){selectRouteView("Driver map & delivery sequence");return}
if(tab==="scan"){renderScan();return}
if(tab==="deliveries"){renderDeliveries();return}
}
function renderScan(){
const list=routes.map(r=>'<option value="'+escape(r.id)+'">'+escape(r.city_group+" · "+r.route_date)+'</option>').join("");
setView(card("Pickup scanning",'<p>Admin already has the order information. Scan each physical bag at pickup to confirm it is on your vehicle.</p><form id="scan" class="flex"><div class="field"><label>Enter or scan barcode</label><input name="barcode" placeholder="Scan barcode or paste ID" required autofocus></div><button>Record scan</button></form><div id="scanResult" class="subtle"></div><p>For camera scanning, use the EKSA Dispatch mobile app. The web form also works with USB/Bluetooth barcode scanners.</p>')+
card("Bag counts by route",'<div class="flex"><div class="field"><label>Assigned route</label><select id="scanRoute"><option value="">Select route</option>'+list+'</select></div><button class="mutedbtn" data-checkpickup>Update counts</button></div><div id="scanCounts" style="margin-top:15px"></div>'));
}

async function openOrderActivity(orderId){
document.getElementById("eksaActivityDialog")?.remove();
const [notes,pods]=await Promise.all([
 edge("eksa-comments",{action:"list",order_id:orderId}),
 edge("eksa-delivery",{action:"list_pod",order_id:orderId})
]);
const dialog=document.createElement("dialog");dialog.id="eksaActivityDialog";dialog.style.cssText="width:min(580px,95vw);max-height:88vh;overflow:auto;border:1px solid #d4e0f1;border-radius:17px;padding:23px";
const items=(notes.events||[]).slice(0,30);
const photos=(pods.pod||[]);
const canPhoto=role==="driver"&&orders.some(x=>x.id===orderId&&x.status==="delivered");
dialog.innerHTML='<h2>Order updates · Notes & proof</h2><p>Updates are shared with the authorized EKSA team, assigned driver and the meal-prep company.</p>'+
'<h3>Delivery proof</h3>'+(photos.length?photos.map(x=>'<div class="stoprow"><div class="stopdetail">'+escape(x.created_at||"")+" · "+escape(x.recipient_name||"Delivery confirmed")+'</div>'+(x.has_photo?'<button class="minibtn mutedbtn" data-pod="'+escape(x.id)+'">View photo</button>':"No photo")+'</div>').join(""):'<p>No proof recorded yet.</p>')+
(canPhoto?'<form id="podUploadForm"><label>Attach delivery photo (JPG or PNG, max 5 MB)</label><input type="file" name="photo" accept="image/jpeg,image/png" required><button>Upload proof of delivery</button></form>':"")+
'<h3 style="margin-top:20px">Comments & issues</h3>'+(items.length?'<ul>'+items.map(x=>'<li>'+escape(x.created_at||"")+" · "+escape(x.notes||"")+'</li>').join("")+'</ul>':'<p>No comments recorded.</p>')+
'<form id="orderCommentForm"><label>Message or correction request</label><textarea name="note" maxlength="1000" placeholder="Describe the issue or necessary correction. EKSA Admin reviews any changes to active routes." required></textarea><button>Add comment</button></form>'+
'<div style="margin-top:18px"><button class="mutedbtn" type="button" data-close>Close</button></div>';
document.body.append(dialog);dialog.showModal();
dialog.addEventListener("close",()=>dialog.remove(),{once:true});
dialog.addEventListener("click",async e=>{
const b=e.target.closest("button");if(!b)return;
if(b.dataset.close!==undefined){dialog.close();return}
if(b.dataset.pod){
try{
const d=await edge("eksa-delivery",{action:"get_pod_photo_url",order_id:orderId,pod_id:b.dataset.pod});
window.open(d.url,"_blank","noopener");
}catch(err){alert(err.message)}
}
});
dialog.addEventListener("submit",async e=>{
e.preventDefault();const form=e.target;const btn=e.submitter;if(btn)btn.disabled=true;
try{
if(form.id==="orderCommentForm"){
const note=String(new FormData(form).get("note")||"").trim();
if(!note)throw Error("Enter a comment first");
await edge("eksa-comments",{action:"create",order_id:orderId,note});
dialog.close();notify("Comment saved to the order's activity history.","ok");
}
if(form.id==="podUploadForm"){
const file=new FormData(form).get("photo");
if(!(file instanceof File)||!["image/jpeg","image/png"].includes(file.type)||file.size>5000000||file.size<100)throw Error("Choose a JPEG or PNG photo smaller than 5 MB.");
const b64=await new Promise((resolve,reject)=>{
 const reader=new FileReader();reader.onerror=()=>reject(Error("Could not read photo"));reader.onload=()=>resolve(String(reader.result).split(",")[1]);reader.readAsDataURL(file)});
await edge("eksa-delivery",{action:"upload_pod_photo",order_id:orderId,photo_base64:b64});
dialog.close();notify("Proof-of-delivery photo saved privately.","ok");
}
}catch(err){alert(err.message)}
finally{if(btn)btn.disabled=false}
});
}

function renderDeliveries(){
setView(card("Delivery stops",'<p>Update stop status after delivery. Status changes are shared with the admin and company dashboards.</p>'+table(["Stop","Customer","Address","Phone","Instructions","Status","Action"],orders.map(o=>'<tr>'+cell(o.stop_sequence??"—")+cell(o.recipient_name)+cell(o.address_line1+", "+(o.address_line2||"")+", "+o.city)+(o.recipient_phone?'<td><a href="tel:'+escape(o.recipient_phone)+'">'+escape(o.recipient_phone)+'</a></td>':'<td>—</td>')+cell(o.delivery_instructions||"—")+'<td>'+pill(o.status)+'</td><td>'+(!["delivered","failed","cancelled"].includes(o.status)?'<div class="actions"><button class="minibtn" data-delivery="'+escape(o.id)+'" data-status="out_for_delivery">Start</button><button class="minibtn" data-delivery="'+escape(o.id)+'" data-status="delivered">Delivered</button><button class="minibtn mutedbtn" data-delivery="'+escape(o.id)+'" data-status="failed">Failed</button><button class="minibtn mutedbtn" data-activity="'+escape(o.id)+'">Notes / issue</button></div>':'<button class="minibtn mutedbtn" data-activity="'+escape(o.id)+'">Proof & notes</button>')+'</td></tr>'))));
}
async function companyLoad(){
orders=await rest("orders","select=id,external_order_id,recipient_name,address_line1,city,postal_code,status,stop_sequence,route_id,delivery_date,client_id&delivery_date=eq."+date()+"&order=stop_sequence.asc&limit=750");
if(tab==="company"){setView(tiles([metric(orders.length,"Orders"),metric(orders.filter(x=>x.status==="delivered").length,"Delivered"),metric(orders.filter(x=>x.status==="out_for_delivery").length,"Out for delivery"),metric(orders.filter(x=>x.status==="failed").length,"Failed")])+card("Delivery visibility",'<p>Your company can see only its own orders, stop sequence, delivery statuses, and read-only map. Map changes are reserved for EKSA admin and assigned drivers.</p>'+table(["Order","Customer","City","Status"],orders.map(o=>'<tr>'+cell(o.external_order_id)+cell(o.recipient_name)+cell(o.city)+'<td>'+pill(o.status)+'</td></tr>'))));return}
if(tab==="companyorders"){setView(bulkUploadCard(false)+card("Submit a new order",'<p>Orders submitted here appear in EKSA Admin automatically. Each bag gets its own barcode label.</p><form id="companyOrderForm"><div class="cols"><div><label>Order reference</label><input name="order_id" required maxlength="100" placeholder="Your order ID"></div><div><label>Delivery date</label><input type="date" name="delivery_date" value="'+date()+'" required></div><div><label>Customer name</label><input name="customer_name" required maxlength="200"></div><div><label>Phone (optional)</label><input type="tel" name="phone" maxlength="30"></div><div><label>Street address</label><input name="address" required maxlength="500"></div><div><label>City</label><input name="city" required maxlength="100"></div><div><label>Postal code</label><input name="postal_code" required maxlength="20"></div><div><label>Unit / buzzer</label><input name="address_line2" maxlength="200"></div><div><label>Delivery instructions</label><input name="delivery_instructions" maxlength="1000" placeholder="Gate code, customer requests"></div><div><label>Number of bags</label><input name="bag_count" type="number" value="1" min="1" max="20" required></div></div><label style="display:flex;gap:9px;align-items:center;margin:12px 0"><input type="checkbox" name="sms_consent" value="yes" style="width:auto">Customer explicitly agreed to SMS delivery updates</label><button type="submit" style="margin-top:16px">Submit order</button></form>')+card("Company delivery orders",'<p>Your company can print bag barcode labels. EKSA and drivers use these to confirm pickup. The delivery map remains read-only.</p><div class="flex"><div class="field"><label>Label paper size</label><select id="labelSize"><option value="thermal">4×6 thermal</option><option value="letter">Letter</option><option value="a4">A4</option></select></div></div>'+table(["Order","Customer / address","Stop","Status","Bag labels"],orders.map(o=>'<tr>'+cell(o.external_order_id)+cell(o.recipient_name+" · "+o.address_line1+", "+o.city)+cell(o.stop_sequence??"—")+'<td>'+pill(o.status)+'</td><td><button class="minibtn" data-print-label="'+escape(o.id)+'">Print bag labels</button><button class="minibtn mutedbtn" data-activity="'+escape(o.id)+'">Request correction / POD</button></td></tr>'))));return}
if(tab==="companymap"){selectRouteView("Company delivery map · Read only");return}
if(tab==="invoices"){const invoices=await rest("invoices","select=invoice_number,period_start,period_end,total,currency,status,due_date&order=created_at.desc&limit=150");setView(card("Invoices",'<p>Only your company’s finalized and paid invoices appear here.</p>'+table(["Number","Period","Amount","Due","Status"],invoices.map(i=>'<tr>'+cell(i.invoice_number)+cell(i.period_start+" – "+i.period_end)+cell(cash(i.total,i.currency))+cell(i.due_date)+'<td>'+pill(i.status)+'</td></tr>'))));return}
}
function selectRouteView(title){
let ids=role==="client"?[...new Set(orders.map(x=>x.route_id).filter(Boolean))]:routes.map(x=>x.id);
if(!ids.length){setView('<div class="empty">No assigned routes with map stops for this date.</div>');return;}
if(!ids.includes(selectedRoute))selectedRoute=ids[0];
const opts=ids.map(id=>{const r=routes.find(x=>x.id===id);return '<option value="'+escape(id)+'"'+(id===selectedRoute?" selected":"")+'>'+escape((r?.city_group||"Delivery route")+" · "+id.slice(0,8))+'</option>'}).join("");
setView(card(title,'<div class="flex"><div class="field"><label>Route</label><select id="mapRoute">'+opts+'</select></div><button class="mutedbtn" data-refreshmap>Refresh map</button></div>')+'<div id="routeMapArea"></div>');
showRoute(selectedRoute);
}
async function showRoute(id){
const area=E("routeMapArea");if(!area)return;
selectedRoute=id;changed=false;routeData=null;area.innerHTML='<div class="card">Loading route map…</div>';
try{routeData=await edge("eksa-route-map",{action:"map",route_id:id});renderRouteMap()}
catch(err){area.innerHTML='<div class="notice bad">'+escape(err.message)+'</div>'}
}
function renderRouteMap(){
if(!routeData)return;
clearMap();
const rows=routeData.orders||[],edit=routeData.editable&&role!=="client";
const info='<div class="flex"><span class="pill">'+escape(routeData.route.status)+'</span><span class="subtle">'+rows.length+' stops · '+escape(routeData.route.city_group)+'</span>'+(edit?'<div class="grow"></div><button id="saveSequence" disabled>Save sequence</button>':'<span class="pill">Read-only company view</span>')+'</div>';
const list=rows.map((x,i)=>'<div class="stoprow" '+(edit?'draggable="true" data-index="'+i+'"':'')+'><div class="stopnum">'+escape(x.stop_sequence??i+1)+'</div><div class="stopdetail"><b>'+escape(x.recipient_name)+'</b><small>'+escape(x.address_line1+", "+x.city+" "+(x.postal_code||""))+'</small><span class="pill">'+escape(x.status)+'</span></div>'+(edit?'<div class="actions"><button class="mutedbtn minibtn" data-move="'+i+'" data-dir="-1" aria-label="Move stop up">↑</button><button class="mutedbtn minibtn" data-move="'+i+'" data-dir="1" aria-label="Move stop down">↓</button></div>':'')+'</div>').join("");
const area=E("routeMapArea");
area.innerHTML=card("Route map & sequence",info+'<div class="mapgrid" style="margin-top:14px"><div id="mapcanvas" class="mapcanvas"></div><div class="stoplist" id="stoplist">'+list+'</div></div><p class="footnote">'+(edit?"Move stops using arrows or drag the stop cards, then save. Completed stops cannot be moved.":"EKSA and the driver control sequence changes; this company view is read only.")+' Map pins are shown only for verified street coordinates.</p>');
const coords=rows.filter(x=>x.latitude!==null&&x.longitude!==null&&Number.isFinite(Number(x.latitude))&&Number.isFinite(Number(x.longitude)));
if(!coords.length){E("mapcanvas").innerHTML='<div class="empty" style="margin:25px">No verified coordinates yet. Stops are listed in sequence at right. Google must verify addresses before map pins appear.</div>';return;}
if(!window.L){E("mapcanvas").innerHTML='<div class="empty">Map tiles are unavailable. The ordered stop list is still accessible.</div>';return;}
map=L.map("mapcanvas",{scrollWheelZoom:false});
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:18,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
mapLayer=L.featureGroup().addTo(map);
coords.forEach(x=>{
const icon=L.divIcon({html:'<div class="badgepoint">'+escape(x.stop_sequence??"•")+'</div>',className:"",iconSize:[30,30],iconAnchor:[15,15]});
L.marker([Number(x.latitude),Number(x.longitude)],{icon}).bindPopup('<b>'+escape(x.external_order_id)+'</b><p>'+escape(x.address_line1+", "+x.city)+'</p><b>'+escape(x.status)+'</b>').addTo(mapLayer);
});
map.fitBounds(mapLayer.getBounds().pad(.18));setTimeout(()=>map&&map.invalidateSize(),200);
}
function moveOrder(a,b){
if(!routeData||a<0||b<0||a>=routeData.orders.length||b>=routeData.orders.length)return;
const arr=routeData.orders;
if(["delivered","failed","cancelled"].includes(arr[a].status)||["delivered","failed","cancelled"].includes(arr[b].status)){notify("Completed or failed stops cannot change position.");return}
const item=arr.splice(a,1)[0];arr.splice(b,0,item);arr.forEach((x,i)=>x.stop_sequence=i+1);
changed=true;renderRouteMap();const button=E("saveSequence");if(button)button.disabled=false;
}
async function saveSequence(){
if(!routeData||!changed)return;
const p={action:"reorder",route_id:routeData.route.id,order_ids:routeData.orders.map(x=>x.id),expected_version:routeData.route.sequence_version};
try{const result=await edge("eksa-route-map",p);notify("Stop sequence saved and shared across EKSA dashboards.", "ok");await showRoute(routeData.route.id)}
catch(err){notify(err.message+" Refresh route and try again.");}
}
async function pickupCounts(routeId){
const result=await edge("eksa-pickup-status",{route_id:routeId});
E("scanCounts").innerHTML=tiles([metric(result.summary.total_bags,"Expected bags"),metric(result.summary.scanned_bags,"Scanned"),metric(result.summary.missing_bags,"Still to scan"),metric(result.summary.ready_to_depart?"Yes":"No","Pickup complete")])+table(["Stop","Customer","Scanned","Remaining"],result.orders.map(o=>'<tr>'+cell(o.stop_sequence??"—")+cell(o.recipient_name)+cell(o.scanned_bags+" / "+o.total_bags)+cell(o.missing_bags)+'</tr>'));
}


E("view").addEventListener("submit",async e=>{
const form=e.target;if(!form?.id)return;e.preventDefault();
const b=e.submitter;if(b)b.disabled=true;
const data=new FormData(form);
try{
if(form.id==="bulkUploadForm"){await importFile(form);return;}
if(form.id==="adminSingleOrder"){
 const payload={
 client_id:String(data.get("client_id")),
 orders:[{
 order_id:String(data.get("order_id")||"").trim(),
 customer_name:String(data.get("customer_name")||"").trim(),
 phone:String(data.get("phone")||"").trim(),
 address:String(data.get("address")||"").trim(),
 address_line2:String(data.get("address_line2")||"").trim(),
 city:String(data.get("city")||"").trim(),
 postal_code:String(data.get("postal_code")||"").trim(),
 delivery_date:String(data.get("delivery_date")||"").trim(),
 bag_count:Number(data.get("bag_count")||1),
 delivery_instructions:String(data.get("delivery_instructions")||"").trim(),
 sms_consent:data.get("sms_consent")!==null
 }]};
 const r=await edge("eksa-bulk-import",payload);
 if(r.rejected)throw Error(r.errors?.[0]?.reason||"Order was rejected");
 await load();notify(r.duplicates?"Order reference already exists.":"Customer order added with bag barcodes.","ok");return;
}
if(form.id==="companyOrderForm"){
const payload={
order_id:String(data.get("order_id")).trim(),
delivery_date:String(data.get("delivery_date")),
customer_name:String(data.get("customer_name")).trim(),
phone:String(data.get("phone")||"").trim(),
address:String(data.get("address")).trim(),
city:String(data.get("city")).trim(),
postal_code:String(data.get("postal_code")).trim(),
bag_count:Number(data.get("bag_count")),
address_line2:String(data.get("address_line2")||"").trim(),
delivery_instructions:String(data.get("delivery_instructions")||"").trim(),
sms_consent:data.get("sms_consent")==="yes"
};
const result=await edge("eksa-company-submit",payload);
await load();
notify(result.existing_order?"That order reference already exists; no duplicate was added.":"Order received by EKSA. Bag barcode labels are ready to print.","ok");
return;
}
if(form.id==="createRoute"){
const r=await edge("eksa-dispatch",{action:"create_batched_city_routes",city:String(data.get("city")).trim(),delivery_date:date(),max_bags:Number(data.get("bags"))});
notify("Created "+r.routes_created+" routes with "+r.orders_assigned+" orders.","ok");await load();return;
}
if(form.id==="inviteDriver"){
const mail=String(data.get("email")).trim().toLowerCase();
await edge("eksa-users",{action:"invite_driver",email:mail,display_name:String(data.get("name")).trim(),vehicle_capacity:Number(data.get("capacity"))});
await load();notify("Invitation sent to "+mail,"ok");return;
}
if(form.id==="createCompany"){
const r=await edge("eksa-users",{action:"create_company",name:String(data.get("name")).trim(),code:String(data.get("code")).trim(),billing_email:String(data.get("billing")).trim()||null});
await load();notify("Company created in EKSA Dispatch.","ok");return;
}
if(form.id==="inviteCompany"){
const mail=String(data.get("email")).trim().toLowerCase();
await edge("eksa-users",{action:"invite_client",email:mail,client_id:String(data.get("client"))});
await load();notify("Company portal invitation sent to "+mail,"ok");return;
}
if(form.id==="rateForm"){
await edge("eksa-owner",{action:"save_rate",driver_id:String(data.get("driver")),effective_from:String(data.get("start")),currency:"CAD",pay_per_delivery:Number(data.get("delivery")),pay_per_bag:Number(data.get("bag"))});
notify("Driver pay rate saved. No money has been sent.","ok");return;
}
if(form.id==="payoutForm"){
const action=b?.value||"payout_preview";
const r=await edge("eksa-owner",{action,driver_id:String(data.get("driver")),start:String(data.get("start")),end:String(data.get("end"))});
if(action==="payout_preview"){
E("preview").textContent=r.deliveries+" deliveries · "+cash(r.total,r.currency)+" estimated · "+r.already_in_a_payout+" already in a payout · "+r.unpriced+" without rate";
}else{await load();notify("Payout draft created for "+cash(r.total,r.currency)+". It has NOT been paid.","ok")}
return;
}
if(form.id==="scan"){
const barcode=String(data.get("barcode")).trim();
const r=await edge("eksa-scan",{barcode});
E("scanResult").textContent="Order "+r.order_number+" · "+r.scanned_bags+"/"+r.total_bags+" scanned · Route: "+r.route_scanned_bags+"/"+r.route_total_bags+" · "+r.route_remaining_bags+" bags remaining";
form.reset();form.querySelector("input")?.focus();
const rid=E("scanRoute")?.value;if(rid)await pickupCounts(rid);
return;
}
}catch(err){notify(err.message)}finally{if(b)b.disabled=false}
});
E("view").addEventListener("change",async e=>{
if(e.target.id==="mapRoute"){selectedRoute=e.target.value;await showRoute(selectedRoute)}
if(e.target.id==="scanRoute"&&e.target.value){try{await pickupCounts(e.target.value)}catch(err){notify(err.message)}}
});
E("view").addEventListener("click",async e=>{
const b=e.target.closest("button");if(!b)return;
try{
if(b.dataset.activity){await openOrderActivity(b.dataset.activity);return;}
if(b.dataset.optPreview){
const result=await edge("eksa-optimize",{action:"preview",route_id:b.dataset.optPreview});
if(result.success!==true)throw Error(result.error||"Route cannot be optimized yet");
const lat=prompt("Pickup latitude (decimal degrees). Example: 43.68", "43.68");
if(lat===null)return;
const lng=prompt("Pickup longitude (decimal degrees). Example: -79.76", "-79.76");
if(lng===null)return;
const endLat=prompt("Optional route end latitude; leave blank to finish at last stop","");
if(endLat===null)return;
const endLng=endLat.trim()?prompt("Route end longitude (decimal degrees)",""):null;
if(endLat.trim()&&endLng===null)return;
const start_latitude=Number(lat),start_longitude=Number(lng);
if(!Number.isFinite(start_latitude)||!Number.isFinite(start_longitude)||start_latitude<40||start_latitude>60||start_longitude>-70||start_longitude< -100)throw Error("Check the pickup coordinates.");
const args={action:"optimize",route_id:b.dataset.optPreview,start_latitude,start_longitude};
if(endLat.trim()){args.end_latitude=Number(endLat);args.end_longitude=Number(endLng);if(!Number.isFinite(args.end_latitude)||!Number.isFinite(args.end_longitude))throw Error("Invalid route end coordinates");}
if(!confirm("Optimize this route using verified street coordinates? This will replace the current draft sequence."))return;
b.disabled=true;
const opt=await edge("eksa-optimize",args);
await load();
notify("Google route optimized: "+opt.optimized_stops+" stops. Review the map and sequence before dispatch.","ok");return;
}
if(b.dataset.startRoute){
 if(!confirm("Start this route? All bags must be scanned. Eligible customers will be queued for an on-the-way SMS; no SMS is sent until the provider is enabled."))return;
 b.disabled=true;
 const res=await edge("eksa-route-start",{action:"start_route",route_id:b.dataset.startRoute});
 if(res.success===false)throw Error(res.error||"Unable to start route");
 await load();notify("Route started. "+res.orders_started+" orders out for delivery; "+res.sms_queued+" SMS jobs queued (not yet sent).","ok");
 return;
}
if(b.dataset.orderDetails){await openAdminOrder(b.dataset.orderDetails);return;}
if(b.dataset.printLabel){
await printBagLabels(b.dataset.printLabel);
return;
}
if(b.dataset.map){selectedRoute=b.dataset.map;await showRoute(selectedRoute);E("routeMapArea")?.scrollIntoView({behavior:"smooth",block:"start"});return}
if(b.dataset.refreshmap!==undefined){await showRoute(selectedRoute);return}
if(b.id==="saveSequence"){b.disabled=true;await saveSequence();return}
if(b.dataset.move!==undefined){moveOrder(Number(b.dataset.move),Number(b.dataset.dir)+Number(b.dataset.move));return}
if(b.dataset.assign){
const select=E("view").querySelector('[data-pick="'+b.dataset.assign+'"]');
if(!select?.value)return notify("Choose a driver before assigning.");
b.disabled=true;
await edge("eksa-dispatch",{action:"assign_driver",route_id:b.dataset.assign,driver_id:select.value});
await load();notify("Route assigned to driver. It is visible in their dashboard.","ok");return;
}
if(b.dataset.passwordDriver){
const old=document.getElementById("eksaPasswordDialog");if(old)old.remove();
const dialog=document.createElement("dialog");dialog.id="eksaPasswordDialog";dialog.style.cssText="border:1px solid #d8dff1;border-radius:16px;box-shadow:0 20px 70px #101a3e50;max-width:420px;width:90%;padding:23px";
const title=document.createElement("h2");title.textContent="Set password for "+b.dataset.driverName;
const explain=document.createElement("p");explain.textContent="This replaces the existing password. The driver account and assigned routes remain unchanged.";
const form=document.createElement("form");
const field=document.createElement("input");field.type="password";field.autocomplete="new-password";field.minLength=12;field.maxLength=128;field.required=true;field.placeholder="New password (12+ characters)";
const confirmField=document.createElement("input");confirmField.type="password";confirmField.autocomplete="new-password";confirmField.required=true;confirmField.placeholder="Confirm new password";confirmField.style.marginTop="10px";
const actions=document.createElement("div");actions.className="actions";actions.style.marginTop="16px";
const cancel=document.createElement("button");cancel.type="button";cancel.className="mutedbtn";cancel.textContent="Cancel";cancel.onclick=()=>dialog.close();
const save=document.createElement("button");save.type="submit";save.textContent="Save password";
actions.append(cancel,save);form.append(field,confirmField,actions);dialog.append(title,explain,form);document.body.append(dialog);dialog.showModal();
dialog.addEventListener("close",()=>dialog.remove(),{once:true});
form.addEventListener("submit",async event=>{
event.preventDefault();
const password=field.value;
if(password.length<12||password.length>128||/\s/.test(password)){alert("Password must be 12–128 characters without spaces.");return;}
if(password!==confirmField.value){alert("Passwords do not match.");return;}
save.disabled=true;cancel.disabled=true;
try{
await edge("eksa-users",{action:"set_driver_password",driver_id:b.dataset.passwordDriver,new_password:password});
field.value="";confirmField.value="";dialog.close();
notify("Driver password updated. They can now sign in with their email and new password.","ok");
}catch(error){alert(error.message);save.disabled=false;cancel.disabled=false;}
});
return;
}
if(b.dataset.driver){
const active=b.dataset.active==="true";
if(!confirm(active?"Reactivate driver?":"Deactivate driver? Existing deliveries and payouts will be retained."))return;
b.disabled=true;
await edge("eksa-users",{action:"set_driver_active",driver_id:b.dataset.driver,active});
await load();notify("Driver "+(active?"reactivated.":"deactivated."),"ok");return;
}
if(b.dataset.payout){
const action=b.dataset.action;
let ref=null;
if(action==="payout_mark_paid"){
ref=prompt("Enter the actual payment reference (e-transfer confirmation or transaction ID). No payment will be sent by this app.");
if(!ref?.trim())return;
}
if(!confirm(action==="payout_approve"?"Approve this payout draft?":"Confirm that payment has ALREADY been sent?"))return;
b.disabled=true;
await edge("eksa-owner",{action,payout_id:b.dataset.payout,payment_reference:ref});
await load();notify("Payout record updated. The app does not transfer funds.","ok");return;
}
if(b.dataset.checkpickup!==undefined){
const rid=E("scanRoute").value;if(!rid)return notify("Choose an assigned route first.");
await pickupCounts(rid);return;
}
if(b.dataset.delivery){
const status=b.dataset.status;
if(!confirm("Set this delivery status to "+status.replaceAll("_"," ")+"?"))return;
const notes=status==="failed"?prompt("Reason for failed delivery (required)"):null;
if(status==="failed"&&!notes?.trim())return;
b.disabled=true;await edge("eksa-delivery",{action:"update_status",order_id:b.dataset.delivery,status,notes:notes?.trim()||null});
await load();notify("Delivery status updated. Notification event queued if the customer has a phone number.","ok");return;
}
}catch(err){notify(err.message)}
});
E("view").addEventListener("dragstart",e=>{
const row=e.target.closest(".stoprow[draggable=true]");
if(!row||!routeData?.editable)return;
dragIndex=Number(row.dataset.index);row.classList.add("dragging");e.dataTransfer.effectAllowed="move";
});
E("view").addEventListener("dragover",e=>{
const row=e.target.closest(".stoprow[draggable=true]");
if(!row||dragIndex===null)return;
e.preventDefault();e.dataTransfer.dropEffect="move";
});
E("view").addEventListener("drop",e=>{
const row=e.target.closest(".stoprow[draggable=true]");
if(!row||dragIndex===null)return;
e.preventDefault();const to=Number(row.dataset.index),from=dragIndex;dragIndex=null;moveOrder(from,to);
});
E("view").addEventListener("dragend",()=>{dragIndex=null;E("view").querySelectorAll(".dragging").forEach(x=>x.classList.remove("dragging"))});
setInterval(()=>{
if(!token||changed||document.visibilityState!=="visible"||!selectedRoute||!E("routeMapArea"))return;
if(["map","companymap","routes","today"].includes(tab))showRoute(selectedRoute).catch(()=>{});
},30000);
