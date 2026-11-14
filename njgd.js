(()=>{"use strict";
const $=id=>document.getElementById(id),P=window.NJGD_PROJECTS||[],C=window.NJGD_CASES||[];
function initNav(){const t=$("mobile-toggle"),n=$("navlinks");if(t&&n)t.addEventListener("click",()=>{const open=n.classList.toggle("open");t.setAttribute("aria-expanded",String(open))});}
function initPortfolio(){const el=$("all-projects"),input=$("portfolio-search"),count=$("project-count"),filters=$("project-filters");if(!el)return;let active="All";
const cards=new Map(Array.from(el.querySelectorAll("[data-project]"),card=>[Number(card.dataset.project),card]));
const show=()=>{
 const search=(input?.value||"").toLowerCase().trim();
 let shown=0;
 for(const p of P){
  const card=cards.get(p.id);
  if(!card)continue;
  const matches=(active==="All"||p.type===active)&&[p.name,p.description,p.type].join(" ").toLowerCase().includes(search);
  card.hidden=!matches;
  if(matches)shown++;
 }
 if(count)count.textContent="Showing "+shown+" of "+P.length+" illustrative studies.";
};
if(input)input.addEventListener("input",show);
if(filters)filters.addEventListener("click",e=>{const b=e.target.closest("[data-filter]");if(!b)return;active=b.dataset.filter;for(const t of filters.querySelectorAll("button"))t.classList.toggle("active",t===b);show()});
show();}
function initProject(){const node=document.body,id=Number(node.dataset.id||new URLSearchParams(location.search).get("id")||1),p=P.find(x=>x.id===id),s=C.find(x=>x.id===id);if(!p||!s)return;
const pdf=$("pdf-button");if(pdf)pdf.addEventListener("click",e=>{e.preventDefault();if(typeof window.NJGD_DOWNLOAD_PDF==="function")window.NJGD_DOWNLOAD_PDF(p,s,pdf);else alert("The PDF library could not load.")});
}
function initContact(){const f=$("contact-form");if(!f)return;
const status=$("contact-status"),btn=$("contact-submit"),backup=$("contact-fallback");
f.addEventListener("submit",async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(f));if(backup){backup.style.display="none";backup.removeAttribute("href")};if(btn){btn.disabled=true;btn.textContent="Sending request…"}if(status)status.textContent="Submitting your request…";
const content=[d.name||"",d.email||"",d.phone||"",d.project||"",d.details||""].join("\n");
const mailto="mailto:njgreendash@gmail.com?subject="+encodeURIComponent("NJ Green Dash consultation inquiry")+"&body="+encodeURIComponent("Name: "+d.name+"\nEmail: "+d.email+"\nPhone: "+d.phone+"\nProject: "+d.project+"\n\n"+d.details);
try{const res=await fetch("https://njgreendash-email-api.onrender.com/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)});let result={};try{result=await res.json()}catch(_){}if(!res.ok||!result.ok)throw new Error(result.error||"Delivery could not be confirmed");if(status)status.textContent="Request sent. Please watch for a confirmation email.";f.reset()}
catch(err){if(status)status.textContent="Email delivery is not currently confirmed. Use the email draft link below to send your inquiry directly.";if(backup){backup.href=mailto;backup.style.display="inline-flex"}console.warn("Contact delivery:",err.message)}
finally{if(btn){btn.disabled=false;btn.textContent="Send Consultation Request →"}}});}
initNav();const page=document.body.dataset.page;if(page==="portfolio")initPortfolio();if(page==="project")initProject();if(page==="home")initContact();
})();