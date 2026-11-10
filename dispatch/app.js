"use strict";
const BASE="https://suaghyqignjgqgwffzbt.supabase.co";
const KEY="sb_publishable_UIbvS8Aphy-A4vidQGGXDA_f3CWTeaK";
const E=id=>document.getElementById(id);
let token=null,role=null,profile=null,tab=null,driver=null,drivers=[],clients=[],orders=[],routes=[],stats=null,selectedRoute=null,routeData=null,changed=false,dragIndex=null,map=null,mapLayer=null;
const escape=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;":"&quot;","'":"&#39;"}[c]));
const date=()=>E("date").value;
const cash=(n,c="CAD")=>new Intl.NumberFormat("en-CA",{style:"currency",currency:c}).format(Number(n||0));
const pill=(v)=>'<span class="pill">'+escape(v)+'</span>';
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
if(role==="admin")return [["overview","Overview"],["orders","Orders"],["routes","Routes & Map"],["drivers","Drivers"],["analytics","Analytics"],["payouts","Payouts"],["companies","Companies"]];
if(role==="driver")return [["today","My routes"],["map","Map & sequence"],["scan","Pickup scanning"],["deliveries","Deliveries"]];
return [["company","Overview"],["companyorders","Orders"],["companymap","Delivery map"],["invoices","Invoices"]];
}
function drawTabs(){E("tabs").innerHTML=tabList().map(([id,title])=>'<button data-tab="'+id+'" class="'+(tab===id?"selected":"")+'">'+escape(title)+'</button>').join("");E("roleLabel").textContent=role==="admin"?"OWNER":role==="driver"?"DRIVER":"COMPANY";}
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
clearNotice();E("pageTitle").textContent=tabList().find(x=>x[0]===tab)?.[1]||"Dispatch";E("view").innerHTML='<div class="card">Loading EKSA Dispatch…</div>';clearMap();
if(role==="admin")await adminLoad();else if(role==="driver")await driverLoad();else await companyLoad();
}
async function adminCommon(){
[drivers,clients]=await Promise.all([rest("drivers","select=id,display_name,active,vehicle_capacity&order=display_name&limit=250"),rest("clients","select=id,name,code&order=name&limit=250")]);
}
async function adminLoad(){
await adminCommon();
if(tab==="overview"||tab==="analytics"){stats=await edge("eksa-owner",{action:"metrics",date:date()});tab==="overview"?renderOverview():renderAnalytics();return;}
if(tab==="orders"){orders=await rest("orders","select=id,client_id,external_order_id,recipient_name,address_line1,city,postal_code,status,route_id,stop_sequence&delivery_date=eq."+date()+"&order=created_at.desc&limit=1000");renderAdminOrders();return}
if(tab==="routes"){routes=await rest("routes","select=id,city_group,route_date,status,driver_id,sequence_version&route_date=eq."+date()+"&order=created_at.desc&limit=250");renderAdminRoutes();return}
if(tab==="drivers"){routes=await rest("routes","select=id,driver_id,status&limit=1000");renderDrivers();return}
if(tab==="companies"){renderCompanies();return}
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
function renderAdminOrders(){const lookup=Object.fromEntries(clients.map(c=>[c.id,c.name]));
setView(card("Company orders",'<p>Orders appear when companies submit them. Pickup scanning is primarily the driver’s task.</p>'+table(["Order","Company","Customer / address","City","Stop","Status"],orders.map(x=>'<tr>'+cell(x.external_order_id)+cell(lookup[x.client_id]||"—")+cell(x.recipient_name+" · "+x.address_line1+" "+(x.postal_code||""))+cell(x.city)+cell(x.stop_sequence??"—")+'<td>'+pill(x.status)+'</td></tr>'))));
}
function renderAdminRoutes(){
const look=Object.fromEntries(drivers.map(x=>[x.id,x.display_name]));
const options=drivers.filter(x=>x.active).map(x=>'<option value="'+escape(x.id)+'">'+escape(x.display_name)+'</option>').join("");
const tableRows=routes.map(r=>'<tr>'+cell(r.city_group)+cell(r.route_date)+'<td>'+pill(r.status)+'</td>'+cell(look[r.driver_id]||"Unassigned")+'<td><div class="actions"><button class="minibtn" data-map="'+escape(r.id)+'">Map</button>'+
(!r.driver_id?'<select style="max-width:180px" data-pick="'+escape(r.id)+'"><option value="">Select driver</option>'+options+'</select><button class="minibtn" data-assign="'+escape(r.id)+'">Assign</button>':"")+'</div></td></tr>');
setView(card("Create routes",'<form class="flex" id="createRoute"><div class="field"><label>City</label><input name="city" required value="Brampton"></div><div class="field"><label>Maximum bags per route</label><input name="bags" type="number" min="1" max="300" value="80" required></div><button>Create routes</button></form><p>Routes can be planned and assigned before bags are scanned. Drivers confirm pickup before departure.</p>')+card("Assigned and draft routes",table(["City","Date","Status","Driver","Actions"],tableRows))+'<section id="routeMapArea"></section>');
}
function renderDrivers(){
setView(tiles([metric(drivers.length,"Registered"),metric(drivers.filter(x=>x.active).length,"Active"),metric(drivers.filter(x=>!x.active).length,"Inactive"),metric(routes.length,"Routes in system")])+
card("Invite driver",'<form id="inviteDriver" class="flex"><div class="field"><label>Name</label><input name="name" required></div><div class="field"><label>Email</label><input name="email" type="email" required></div><div class="field"><label>Vehicle capacity (bags)</label><input name="capacity" type="number" min="1" max="300" value="100" required></div><button>Send invitation</button></form><p>Already registered? <a href="../eksa-password.html" target="_blank" rel="noopener">Reset password</a>; do not invite twice.</p>')+
card("Driver team",table(["Driver","Status","Capacity","Routes","Action"],drivers.map(x=>'<tr>'+cell(x.display_name)+'<td>'+pill(x.active?"Active":"Inactive")+'</td>'+cell(x.vehicle_capacity)+cell(routes.filter(r=>r.driver_id===x.id).length)+'<td><button class="minibtn mutedbtn" data-driver="'+escape(x.id)+'" data-active="'+(!x.active)+'">'+(x.active?"Deactivate":"Reactivate")+'</button></td></tr>'))));
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
orders=await rest("orders","select=id,external_order_id,recipient_name,address_line1,city,postal_code,status,stop_sequence,route_id&delivery_date=eq."+date()+"&order=stop_sequence.asc&limit=750");
}
async function driverLoad(){
await driverCommon();const activeIds=new Set(routes.map(r=>r.id));orders=orders.filter(o=>activeIds.has(o.route_id));
if(tab==="today"){setView(tiles([metric(routes.length,"Assigned routes"),metric(orders.length,"Stops"),metric(orders.filter(o=>o.status==="delivered").length,"Delivered"),metric(orders.filter(o=>o.status==="failed").length,"Failed")])+
card("My assigned routes",table(["City","Date","Status","Action"],routes.map(r=>'<tr>'+cell(r.city_group)+cell(r.route_date)+'<td>'+pill(r.status)+'</td><td><button data-map="'+escape(r.id)+'">Open map</button></td></tr>')))+'<div id="routeMapArea"></div>');return}
if(tab==="map"){selectRouteView("Driver map & delivery sequence");return}
if(tab==="scan"){renderScan();return}
if(tab==="deliveries"){renderDeliveries();return}
}
function renderScan(){
const list=routes.map(r=>'<option value="'+escape(r.id)+'">'+escape(r.city_group+" · "+r.route_date)+'</option>').join("");
setView(card("Pickup scanning",'<p>Admin already has the order information. Scan each physical bag at pickup to confirm it is on your vehicle.</p><form id="scan" class="flex"><div class="field"><label>Enter or scan barcode</label><input name="barcode" placeholder="Scan barcode or paste ID" required autofocus></div><button>Record scan</button></form><div id="scanResult" class="subtle"></div><p>For camera scanning, use the EKSA Dispatch mobile app. The web form also works with USB/Bluetooth barcode scanners.</p>')+
card("Bag counts by route",'<div class="flex"><div class="field"><label>Assigned route</label><select id="scanRoute"><option value="">Select route</option>'+list+'</select></div><button class="mutedbtn" data-checkpickup>Update counts</button></div><div id="scanCounts" style="margin-top:15px"></div>'));
}
function renderDeliveries(){
setView(card("Delivery stops",'<p>Update stop status after delivery. Status changes are shared with the admin and company dashboards.</p>'+table(["Stop","Customer","Address","Status","Action"],orders.map(o=>'<tr>'+cell(o.stop_sequence??"—")+cell(o.recipient_name)+cell(o.address_line1+", "+o.city)+'<td>'+pill(o.status)+'</td><td>'+(!["delivered","failed","cancelled"].includes(o.status)?'<div class="actions"><button class="minibtn" data-delivery="'+escape(o.id)+'" data-status="out_for_delivery">Start</button><button class="minibtn" data-delivery="'+escape(o.id)+'" data-status="delivered">Delivered</button><button class="minibtn mutedbtn" data-delivery="'+escape(o.id)+'" data-status="failed">Failed</button></div>':"Completed")+'</td></tr>'))));
}
async function companyLoad(){
orders=await rest("orders","select=id,external_order_id,recipient_name,address_line1,city,postal_code,status,stop_sequence,route_id,delivery_date,client_id&delivery_date=eq."+date()+"&order=stop_sequence.asc&limit=750");
if(tab==="company"){setView(tiles([metric(orders.length,"Orders"),metric(orders.filter(x=>x.status==="delivered").length,"Delivered"),metric(orders.filter(x=>x.status==="out_for_delivery").length,"Out for delivery"),metric(orders.filter(x=>x.status==="failed").length,"Failed")])+card("Delivery visibility",'<p>Your company can see only its own orders, stop sequence, delivery statuses, and read-only map. Map changes are reserved for EKSA admin and assigned drivers.</p>'+table(["Order","Customer","City","Status"],orders.map(o=>'<tr>'+cell(o.external_order_id)+cell(o.recipient_name)+cell(o.city)+'<td>'+pill(o.status)+'</td></tr>'))));return}
if(tab==="companyorders"){setView(card("Company delivery orders",table(["Order","Customer / address","Stop","Status"],orders.map(o=>'<tr>'+cell(o.external_order_id)+cell(o.recipient_name+" · "+o.address_line1+", "+o.city)+cell(o.stop_sequence??"—")+'<td>'+pill(o.status)+'</td></tr>'))));return}
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
