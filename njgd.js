(()=>{"use strict";
const $=id=>document.getElementById(id),P=window.NJGD_PROJECTS||[],C=window.NJGD_CASES||[];
const hid=x=>String(x).padStart(2,"0");
const link=p=>p.slug||("project-"+hid(p.id)+".html");
const safe=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const card=p=>`<a class="projectcard" href="${safe(link(p))}">
  <figure><img src="${safe(p.exterior)}" loading="lazy" alt=""></figure>
  <div class="cardtext">
    <small class="card-category">${safe(p.type)} · ${safe(p.sf)} SF</small>
    <strong>${safe(p.name)}</strong>
    ${p.design ? `<span class="card-design">${safe(p.design)}</span>` : ""}
    <span class="card-link">View study →</span>
  </div>
</a>`;
function initNav(){const t=$("mobile-toggle"),n=$("navlinks");if(t&&n)t.addEventListener("click",()=>{const open=n.classList.toggle("open");t.setAttribute("aria-expanded",String(open))});}
function initHome(){const el=$("featured-projects");if(el)el.innerHTML=[4,6,9,1,2,3,5,21,22,23,24,25,26].map(id=>P.find(p=>p.id===id)).filter(Boolean).map(card).join("");}
function initPortfolio(){const el=$("all-projects"),input=$("portfolio-search"),count=$("project-count"),filters=$("project-filters");if(!el)return;let active="All";
const show=()=>{const search=(input?.value||"").toLowerCase().trim();const data=P.filter(p=>(active==="All"||p.type===active)&&[p.name,p.description,p.type].join(" ").toLowerCase().includes(search));el.innerHTML=data.map(card).join("");if(count)count.textContent="Showing "+data.length+" of "+P.length+" illustrative studies.";};
if(input)input.addEventListener("input",show);
if(filters)filters.addEventListener("click",e=>{const b=e.target.closest("[data-filter]");if(!b)return;active=b.dataset.filter;for(const t of filters.querySelectorAll("button"))t.classList.toggle("active",t===b);show()});
show();}
function initProject(){const node=document.body,id=Number(node.dataset.id||new URLSearchParams(location.search).get("id")||1),p=P.find(x=>x.id===id),s=C.find(x=>x.id===id);if(!p||!s)return;
const set=(id,text)=>{const el=$(id);if(el)el.textContent=text};
const put=(id,path,alt)=>{const img=$(id);if(img){img.src=path;img.alt=alt}};
set("project-name",p.name);set("project-type",p.type);set("project-area",p.sf+" SF");set("project-summary",p.description);
put("project-cover",p.approach || p.exterior,"Generated exterior concept for "+p.name);
const drawings = [
  ["axon", "project-axon", "3D organization diagram"],
  ["plan", "project-plan", "Concept zoning plan"],
  ["elevations", "project-elevations", "Concept exterior elevations"],
  ["site", "project-site", "Site and landscape concept"],
];
for (const [key, target, label] of drawings) {
  if (p.drawings[key]) put(target, p.drawings[key], label + " for " + p.name);
}
const gallery = document.querySelector(".interiorgrid");
if (gallery) {
  gallery.classList.add("portfolio-gallery");
  gallery.innerHTML = p.gallery.map(({src, caption}) =>
    '<figure><img src="' + safe(src) + '" alt="' + safe(caption + " for " + p.name) +
    '" loading="lazy"><figcaption>' + safe(caption) + '</figcaption></figure>'
  ).join("");
}
put("presentation-board",p.board,"Full uncropped project case study presentation board");
const list=[["Consulting Story",s.story],["Principal Hurdles",s.challenge],["Proposed Planning Approach",s.approach],["High Points",s.high],["Limitations / Risks",s.low],["Licensing Questions (Not Cleared)",s.licensing],["Key Takeaway",s.takeaway],["Site & Landscape",s.site]];
const rows=$("case-rows");if(rows)rows.innerHTML=list.map(([h,c])=>'<div class="case-row"><dt>'+safe(h)+'</dt><dd>'+safe(c)+'</dd></div>').join("");
const prev=$("previous-project"),next=$("next-project");if(prev)prev.href=link(P[(id-2+P.length)%P.length]);if(next)next.href=link(P[id%P.length]);
const pdf=$("pdf-button");if(pdf)pdf.addEventListener("click",e=>{e.preventDefault();if(typeof window.NJGD_DOWNLOAD_PDF==="function")window.NJGD_DOWNLOAD_PDF(p,s,pdf);else alert("The PDF library could not load.")});
const q=$("project-jsonld");if(q){q.textContent=JSON.stringify({"@context":"https://schema.org","@type":"CreativeWork",name:p.name,description:p.description+" Illustrative facility consulting concept; no real client work or approvals implied.",url:"https://njgreendash.com/"+link(p),author:{"@type":"Person",name:"Lucian DeMarco"},publisher:{"@type":"Organization",name:"NJ Green Dash"}})}
}
function initContact(){const f=$("contact-form");if(!f)return;
const status=$("contact-status"),btn=$("contact-submit"),backup=$("contact-fallback");
f.addEventListener("submit",async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(f));if(backup){backup.style.display="none";backup.removeAttribute("href")};if(btn){btn.disabled=true;btn.textContent="Sending request…"}if(status)status.textContent="Submitting your request…";
const content=[d.name||"",d.email||"",d.phone||"",d.project||"",d.details||""].join("\n");
const mailto="mailto:njgreendash@gmail.com?subject="+encodeURIComponent("NJ Green Dash consultation inquiry")+"&body="+encodeURIComponent("Name: "+d.name+"\nEmail: "+d.email+"\nPhone: "+d.phone+"\nProject: "+d.project+"\n\n"+d.details);
try{const res=await fetch("https://njgreendash-email-api.onrender.com/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)});let result={};try{result=await res.json()}catch(_){}if(!res.ok||!result.ok)throw new Error(result.error||"Delivery could not be confirmed");if(status)status.textContent="Request sent. Please watch for a confirmation email.";f.reset()}
catch(err){if(status)status.textContent="Email delivery is not currently confirmed. Use the email draft link below to send your inquiry directly.";if(backup){backup.href=mailto;backup.style.display="inline-flex"}console.warn("Contact delivery:",err.message)}
finally{if(btn){btn.disabled=false;btn.textContent="Send Consultation Request →"}}});}
initNav();const page=document.body.dataset.page;if(page==="home")initHome();if(page==="portfolio")initPortfolio();if(page==="project")initProject();if(page==="home")initContact();
})();