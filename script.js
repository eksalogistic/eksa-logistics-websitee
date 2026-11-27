
async function submitEksaForm(event){
  event.preventDefault();
  const form=event.currentTarget;
  if(!form.reportValidity())return;
  const status=form.querySelector('.form-status');
  const button=form.querySelector('button[type="submit"]');
  const values=Object.fromEntries(new FormData(form).entries());
  if(values.website)return;
  if(Date.now()-Number(form.dataset.startedAt||0)<3500){const notice=form.querySelector('.form-status');notice.textContent='Please review your details and try again.';return;}
  const throttleKey='eksa-last-'+form.dataset.kind;
  if(Date.now()-Number(sessionStorage.getItem(throttleKey)||0)<60000){form.querySelector('.form-status').textContent='Please wait one minute before sending another inquiry.';return;}
  const kind=form.dataset.kind;
  const payload={
    website:values.website||'', elapsedMs:Date.now()-Number(form.dataset.startedAt||0),
    formType:kind==='contact'?(values.topic==='Pharmacy partnership'?'pharmacy':values.topic==='Driver opportunity'?'driver':'business'):kind,
    name:values.contactName||values.fullName||'',
    email:values.email||'',phone:values.phone||'',
    company:values.company||values.pharmacy||'',
    city:values.city||values.pickup||'',
    vehicle:values.vehicle||'',availability:values.availability||values.window||'',
    message:[values.details,values.businessType&&'Business type: '+values.businessType,values.volume&&'Estimated volume: '+values.volume,values.pickup&&'Pickup location: '+values.pickup,values.serviceAreas&&'Delivery areas: '+values.serviceAreas,values.frequency&&'Delivery frequency: '+values.frequency,values.window&&'Pickup window: '+values.window,values.experience&&'Driver experience: '+values.experience,values.licenseConfirmed&&'Valid licence confirmed: '+values.licenseConfirmed,values.topic&&'Inquiry topic: '+values.topic].filter(Boolean).join('\n')
  };
  if(!payload.name.trim()||!payload.email.trim()){
    status.textContent='Please enter your name and email address.';return;
  }
  button.disabled=true;button.textContent='Sending…';status.textContent='Sending your inquiry…';
  try{
    // Apps Script redirects and does not expose a readable cross-origin response.
    // An opaque fetch means the browser cannot verify that Sheets saved the record.
    await fetch(EKSA_FORM_ENDPOINT,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});
    status.textContent='Your request was sent. If you do not hear back, please email info@eksalogistic.ca.';
    sessionStorage.setItem(throttleKey,String(Date.now()));
    form.reset();
    form.dataset.startedAt=String(Date.now());
  }catch(err){
    status.textContent='We could not send your inquiry. Please email info@eksalogistic.ca directly.';
  }finally{button.disabled=false;button.innerHTML='Submit inquiry '+EKSA_ARROW;}
}
const EKSA_FORM_ENDPOINT='https://script.google.com/macros/s/AKfycbyI9N4MNd86PZOt_h9TdgNG0-9OalRG0U3VA3hvS6kUMc9Sv2mMcfjz-KuoUxG1h28/exec';
const EKSA_ARROW=`<svg class="eksa-arrow" xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`;
const IMG={food:'/eksa-home-hero.webp',logistics:'same-day-delivery.jpg',warehouse:'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1100&auto=format&fit=crop&q=80',pharmacy:'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1100&auto=format&fit=crop&q=80',driver:'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1100&auto=format&fit=crop&q=80',parcels:'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1100&auto=format&fit=crop&q=80',city:'https://images.unsplash.com/photo-1517090504586-fde19ea6066f?w=1100&auto=format&fit=crop&q=80'};
const link=(path,label,cls='btn')=>`<a class="${cls}" href="#${path}">${label} <span aria-hidden="true"><svg class="eksa-arrow" xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a>`;
const heading=(tag,title,sub='')=>`<div class="section-head"><div><span class="eyebrow">${tag}</span><h2>${title}</h2>${sub?`<p class="section-intro">${sub}</p>`:''}</div></div>`;
const card=(img,title,desc,path)=>`<article class="card"><img src="${img}" alt="" loading="lazy"><div class="card-body"><h3>${title}</h3><p>${desc}</p><a href="#${path}">Learn more <svg class="eksa-arrow" xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></a></div></article>`;
const areas=['Toronto','Brampton','Mississauga','Vaughan','Scarborough','Oshawa','North York','Markham','Hamilton'];
function coverage(){return `<section class="coverage-section"><div class="container coverage-grid"><div class="coverage-copy"><span class="eyebrow">Where we operate</span><h2>Serving the GTA <span class="gradient-text">and beyond.</span></h2><p>From Toronto to communities across the Greater Toronto Area, EKSA Logistic helps businesses and pharmacies connect with customers through flexible last-mile delivery.</p><div class="coverage-locations">${areas.map(a=>`<div class="coverage-city"><span class="coverage-pin" aria-hidden="true">⌖</span><span>${a}</span></div>`).join('')}</div><div class="coverage-actions"><a class="btn dark" href="#contact">Ask about coverage <span aria-hidden="true"><svg class="eksa-arrow" xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></span></a><span>Have deliveries outside these areas? Let's talk.</span></div></div><div class="coverage-art" role="img" aria-label="Toronto skyline and EKSA delivery vehicle"><div class="coverage-art-caption"><span class="coverage-dot"></span> Local routes. Connected communities.</div></div></div></section>`;}
const partners = [
  ['fusion-feasts', 'Fusion Feasts'],
  ['free-will-eats', 'Free Will Eats'],
  ['tiffinstash', 'TiffinStash'],
  ['ida-pharmacy', 'I.D.A. Pharmacy'],
];
const trust = `<section class="partner-strip" aria-label="Trusted partners"><div class="container partner-row"><h2>Trusted by</h2>${partners.map(([file, name]) => `<img class="partner-logo ${file}" src="/partners/${file}.webp" alt="${name}">`).join('')}</div></section>`;
const services = [
  ['Food Delivery', 'Scheduled delivery for meal prep, tiffin and prepared food businesses across the GTA.', 'businesses', IMG.food],
  ['Pharmacy Delivery', 'Coordinated pharmacy pickups and deliveries with clear handling and delivery procedures.', 'pharmacies', IMG.pharmacy],
];
function home() {
  return `<section class="hero">
    <div class="container hero-inner">
      <div>
        <span class="eyebrow">Toronto & the GTA</span>
        <h1>Local delivery.<br>Done right.</h1>
        <p>Food and pharmacy delivery across the Greater Toronto Area.</p>
        <div class="hero-actions">${link('businesses','Get a Business Quote')}${link('drivers','Drive with EKSA','btn secondary')}</div>
      </div>
      <figure class="hero-visual">
        <img src="/eksa-home-hero.webp" alt="Courier carrying an insulated delivery bag with the EKSA E emblem" fetchpriority="high" width="1280" height="960">
      </figure>
    </div>
  </section>
  ${trust}
  <section class="section"><div class="container">
    ${heading('Our services','Food and pharmacy delivery')}
    <div class="cards service-cards">${services.map(([title, description, route, image]) => card(image, title, description, route)).join('')}</div>
  </div></section>
  ${coverage()}
  ${contactSection()}`;
}
function cta(title,desc,path,label){return `<section class="section dark-band"><div class="container cta-band"><div><span class="eyebrow light">Dreams delivered</span><h2>${title}</h2><p>${desc}</p></div>${link(path,label)}</div></section>`}
function pageHero(kicker,title,desc,img){return `<section class="page-hero"><div class="container"><div><span class="eyebrow">${kicker}</span><h1>${title}</h1><p>${desc}</p></div><img src="${img}" alt="" loading="lazy"></div></section>`}
const field=(name,label,type='text',required=true)=>`<div class="field"><label for="${name}">${label}${required?' *':''}</label><input id="${name}" name="${name}" type="${type}" ${required?'required':''}></div>`;
const select=(name,label,opts)=>`<div class="field"><label for="${name}">${label}</label><select id="${name}" name="${name}"><option value="">Select an option</option>${opts.map(o=>`<option>${o}</option>`).join('')}</select></div>`;
const textArea=(name,label)=>`<div class="field full"><label for="${name}">${label}</label><textarea id="${name}" name="${name}" placeholder="Share any details that would help our team..."></textarea></div>`;
const baseFields=field('contactName','Contact name')+field('email','Business email','email')+field('phone','Phone number','tel');
const volumes=['1–20 per day','21–50 per day','51–100 per day','100+ per day','Varies / not sure'];
function form(kind){let title='',fields='';
if(kind==='business'){title='Business partnership inquiry';fields=field('company','Company name')+baseFields+select('businessType','Business type',['Meal prep','Tiffin service','Prepared food','Other food business','Other'])+field('pickup','Primary pickup city / location')+field('serviceAreas','Delivery cities / service areas')+select('volume','Estimated daily deliveries',volumes)+select('frequency','Delivery frequency',['Daily','Weekdays','Weekends','Several times a week','Occasional / on demand'])+textArea('details','Service requirements or questions')}
if(kind==='pharmacy'){title='Pharmacy partnership inquiry';fields=field('pharmacy','Pharmacy name')+baseFields+field('pickup','Pharmacy pickup city / location')+field('serviceAreas','Delivery cities / service areas')+select('volume','Estimated daily deliveries',volumes)+select('window','Preferred pickup window',['Morning','Afternoon','Evening','Multiple pickups','To be discussed'])+select('frequency','Pickup frequency',['Daily','Weekdays','Weekends','Several times a week','To be discussed'])+textArea('details','Handling and scheduling requirements (no patient information)')}
if(kind==='driver'){title='Driver application';fields=field('fullName','Full name')+field('email','Email','email')+field('phone','Phone number','tel')+select('vehicle','Vehicle type',['Sedan','SUV','Minivan','Cargo van','Electric vehicle','Other'])+field('city','Home city / preferred service area')+select('availability','Availability',['Weekdays','Weekends','Both weekdays and weekends','Flexible'])+select('experience','Delivery experience',['New to delivery','Less than 1 year','1–3 years','3+ years'])+select('licenseConfirmed','Do you hold a valid driver’s licence?',['Yes','No'])+textArea('details','Additional information (optional; no document uploads)')}
if(kind==='contact'){title='General inquiry';fields=field('fullName','Full name')+field('email','Email','email')+field('phone','Phone number','tel',false)+select('topic','Inquiry type',['Business partnership','Pharmacy partnership','Driver opportunity','General question'])+textArea('details','Your message')}
return `<div class="form-panel"><h3>${title}</h3><p class="hint">Complete the fields below and our team will follow up.</p><form data-kind="${kind}"><input name="website" type="text" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px" /><div class="form-grid">${fields}</div><div class="form-submit"><button class="btn" type="submit">Submit inquiry <svg class="eksa-arrow" xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg></button></div><div class="form-status" role="status" aria-live="polite"></div><p class="privacy-note">Do not include patient, prescription, or other sensitive personal information, or upload driver documents. Your contact details are used to respond to your inquiry.</p></form></div>`}
function partnership(kind){const pharmacy=kind==='pharmacy';return `${pageHero(pharmacy?'Pharmacy delivery':'Food delivery',pharmacy?'Your patients deserve a dependable delivery experience.':'Food delivery for GTA businesses.',pharmacy?'Coordinate pharmacy pickups and deliveries with an operations-focused local courier partner.':'Scheduled delivery for meal prep companies, tiffin services and other prepared food businesses.',pharmacy?IMG.pharmacy:IMG.food)}<section class="section soft"><div class="container form-wrap"><div><span class="eyebrow">Let's work together</span><h2>${pharmacy?'Pharmacy delivery, thoughtfully coordinated.':'Built around your delivery needs.'}</h2><p class="section-intro">${pharmacy?'Discuss pickup schedules, delivery zones, handling expectations and reporting requirements with EKSA.':'Tell us your pickup locations, delivery volumes and operational needs. We can discuss a suitable service model.'}</p><ul class="checks">${(pharmacy?['Scheduled pharmacy pickups','Documented delivery and exception workflows','Delivery status communication','Handling requirements reviewed during onboarding']:['Flexible delivery capacity','Recurring and scheduled routes','Centralized dispatch coordination','Service-area planning and reporting']).map(x=>`<li>${x}</li>`).join('')}</ul><div class="notice">${pharmacy?'Pharmacy partnerships require appropriate privacy, security, and medication-handling arrangements before any patient-related deliveries begin.':'Service availability, pricing and operating commitments are confirmed through an individual partnership agreement.'}</div></div>${form(kind)}</div></section><section class="section"><div class="container">${heading('How it works','A straightforward partnership process.')}<div class="steps"><div class="step"><span class="num">01</span><h3>Tell us your needs</h3><p>Share pickup locations, service areas, frequency and estimated volumes.</p></div><div class="step"><span class="num">02</span><h3>Plan your solution</h3><p>We discuss delivery windows, pricing, operating requirements and service expectations.</p></div><div class="step"><span class="num">03</span><h3>Start delivering</h3><p>Once approved and onboarded, EKSA coordinates routes, drivers and delivery updates.</p></div></div></div></section>`}
function driver(){return `${pageHero('Driver opportunities','Drive your next opportunity with EKSA.','Join our network of independent delivery professionals serving the Greater Toronto Area.',IMG.driver)}<section class="section soft"><div class="container form-wrap"><div><span class="eyebrow">Join the network</span><h2>Built for dependable owner-operators.</h2><p class="section-intro">We look for reliable, service-focused drivers who communicate clearly, follow procedures and can commit to their assigned schedules.</p><ul class="checks"><li>Delivery opportunities across GTA service areas</li><li>Route and dispatch coordination</li><li>Clear onboarding and delivery expectations</li><li>Opportunities based on operational demand</li></ul><div class="notice">Submitting an inquiry is not a job offer. Vehicle, insurance, driving record, training and eligibility requirements will be verified during onboarding.</div></div>${form('driver')}</div></section>`}
function servicePage(){return `${pageHero('Our services','Last-mile solutions for the way you operate.','Scheduled food and pharmacy delivery across Toronto and the GTA.',IMG.logistics)}<section class="section"><div class="container"><div class="cards service-cards">${services.map(s=>card(s[3],s[0],s[1],s[2])).join('')}</div></div></section>${cta('Need a custom delivery plan?','Tell us about your business and delivery needs.','businesses','Discuss a Solution')}`}
function about(){return `${pageHero('About EKSA','Driven by service. Built on relationships.','EKSA Logistics Inc. is a GTA-focused last-mile delivery business committed to practical, flexible service.',IMG.city)}<section class="section"><div class="container split"><div><span class="eyebrow">Our approach</span><h2>Local delivery for food and pharmacy businesses.</h2><p class="section-intro">Every delivery represents a customer expectation and a business relationship. We work to coordinate dependable delivery operations while staying responsive to the businesses and communities we serve.</p><ul class="checks"><li>Locally focused delivery operations</li><li>Clear communication with partners</li><li>Careful route and driver coordination</li><li>Flexible solutions as your business grows</li></ul></div><img src="${IMG.warehouse}" alt="Logistics operations" loading="lazy"></div></section>${coverage()}`}
function contactSection() {
  return `<section class="section soft"><div class="container form-wrap">
    <div><h2>Contact us</h2><p class="section-intro">Tell us what you need delivered or ask about driving with EKSA.</p>
      <a class="contact-email" href="mailto:info@eksalogistic.ca">info@eksalogistic.ca</a>
    </div>
    ${form('contact')}
  </div></section>`;
}

function contact() {
  return contactSection();
}

function portal() {
  return `<section class="section soft portal-section"><div class="container">
    <div class="form-panel">
      <h1>Delivery Portal</h1>
      <p>Sign in to EKSA Dispatch with your customer, driver or admin account.</p>
      <a class="btn" href="https://dispatch.eksalogistic.ca/">Sign in to EKSA Dispatch</a>
    </div>
  </div></section>`;
}
const pages={home,businesses:()=>partnership('business'),pharmacies:()=>partnership('pharmacy'),drivers:driver,services:servicePage,about,contact,portal};
function render(){const name=location.hash.slice(1).split('?')[0]||'home';const route=pages[name]?name:'home';document.querySelector('#app').innerHTML=pages[route]();document.title=(route==='home'?'EKSA Logistics':route[0].toUpperCase()+route.slice(1)+' | EKSA Logistics')+' — Dreams Delivered';document.querySelectorAll('#main-nav a').forEach(a=>{const active=a.getAttribute('href')==='#'+route;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')});document.querySelector('#main-nav').classList.remove('open');document.querySelector('.menu-toggle').setAttribute('aria-expanded','false');window.scrollTo({top:0,behavior:'instant'});document.querySelectorAll('form').forEach(f=>{f.dataset.startedAt=String(Date.now());f.addEventListener('submit',submitEksaForm)})}
document.querySelector('.menu-toggle').addEventListener('click',()=>{const n=document.querySelector('#main-nav');n.classList.toggle('open');document.querySelector('.menu-toggle').setAttribute('aria-expanded',String(n.classList.contains('open')))});document.getElementById('year').textContent=new Date().getFullYear();window.addEventListener('hashchange',render);render();