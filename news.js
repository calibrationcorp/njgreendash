'use strict';
const buttons=[...document.querySelectorAll('[data-topic]')];
const grid=document.getElementById('news-grid');
const status=document.getElementById('news-status');
const refreshButton=document.getElementById('news-refresh');
let active='cannabis';
let sequence=0;

const searches={
 cannabis:'https://news.google.com/search?q=cannabis%20marijuana%20regulation&hl=en-US&gl=US&ceid=US%3Aen',
 psychedelics:'https://news.google.com/search?q=psychedelics%20psilocybin%20research&hl=en-US&gl=US&ceid=US%3Aen'
};
function safeDate(value){
 const time=new Date(value||'');
 return Number.isNaN(time.getTime())?'Date unavailable':time.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
}
function addSourceLink(topic){
 const p=document.createElement('p');
 p.className='news-empty';
 p.textContent='You can still browse the latest headlines directly from Google News while this feed is unavailable.';
 const a=document.createElement('a');
 a.href=searches[topic];
 a.textContent='Browse current '+(topic==='cannabis'?'cannabis and marijuana':'psychedelics')+' headlines';
 a.target='_blank';a.rel='noopener noreferrer';
 p.append(document.createElement('br'),a);grid.append(p);
}
function showArticles(data,topic,source){
 grid.replaceChildren();
 const articles=Array.isArray(data?.articles)?data.articles:[];
 let shown=0;
 for(const article of articles){
  let target;
  try {target=new URL(article.link)}catch {continue}
  if(target.protocol!=='https:')continue;
  const card=document.createElement('article');card.className='news-card';
  const meta=document.createElement('div');meta.className='meta';
  meta.textContent=(article.source||'News source')+' · '+safeDate(article.published);
  const heading=document.createElement('h2');
  const link=document.createElement('a');link.href=target.href;link.target='_blank';link.rel='noopener noreferrer';link.textContent=article.title||'Read coverage';
  heading.append(link);card.append(meta,heading);grid.append(card);shown++;
 }
 if(!shown)addSourceLink(topic);
 const date=data?.updatedAt?safeDate(data.updatedAt):'Not yet refreshed';
 status.textContent=(shown?shown+' headlines · ':'')+(source==='live'?'Live news':'Latest saved headlines')+' · Last updated '+date;
 return shown;
}
async function fetchJSON(url,timeoutMs){
 const controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),timeoutMs);
 try {
  const response=await fetch(url,{cache:'no-store',headers:{Accept:'application/json'},signal:controller.signal});
  if(!response.ok)throw Error('HTTP '+response.status);
  return await response.json();
 }finally{clearTimeout(timeout)}
}
async function load(topic){
 active=topic;
 const serial=++sequence;
 buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.topic===topic)));
 status.textContent='Loading '+topic+' headlines…';
 grid.replaceChildren();
 // Show a useful link immediately, even if neither endpoint is available.
 addSourceLink(topic);
 let savedCount=0;
 try {
  const snapshot=await fetchJSON('news-cache.json?v=20261116b',4500);
  if(serial!==sequence)return;
  const saved=snapshot?.topics?.[topic];
  if(saved)savedCount=showArticles(saved,topic,'saved');
 }catch(error){if(serial!==sequence)return;status.textContent='Saved news temporarily unavailable; live news still loading…'}
 try {
  const live=await fetchJSON('/api/news?category='+encodeURIComponent(topic),5500);
  if(serial!==sequence)return;
  if(Array.isArray(live?.articles)&&live.articles.length)showArticles(live,topic,'live');
  else if(!savedCount)status.textContent='Headlines not available here — use the source link below.';
 }catch(error){
  if(serial!==sequence)return;
  if(!savedCount)status.textContent='News service not reachable — use the source link below.';
 }
}
buttons.forEach(b=>b.addEventListener('click',()=>load(b.dataset.topic)));
refreshButton?.addEventListener('click',()=>load(active));
load(active);
