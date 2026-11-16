'use strict';
const buttons=[...document.querySelectorAll('[data-topic]')];
const grid=document.getElementById('news-grid');
const status=document.getElementById('news-status');
let active='cannabis';
let sequence=0;
function showMessage(message){grid.replaceChildren();const p=document.createElement('p');p.className='news-empty';p.textContent=message;grid.append(p);}
async function load(topic){
 const current=++sequence;active=topic;
 buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.topic===topic)));
 status.textContent='Loading recent '+(topic==='cannabis'?'cannabis':'psychedelics')+' headlines…';
 grid.replaceChildren();
 try {
  let data, source='live';
  try {
   const response=await fetch('/api/news?category='+encodeURIComponent(topic),{headers:{Accept:'application/json'},signal:AbortSignal.timeout(6500)});
   if(!response.ok)throw new Error('Live feed unavailable');
   data=await response.json();
   if(!Array.isArray(data.articles)||!data.articles.length)throw new Error('Empty live feed');
  }catch(error){
   source='cached';
   const response=await fetch('news-cache.json?v=20261116',{cache:'no-store',signal:AbortSignal.timeout(6500)});
   if(!response.ok)throw new Error('Cached feed unavailable');
   const snapshot=await response.json();
   data=snapshot.topics?.[topic]||{articles:[],updatedAt:null};
  }
  if(current!==sequence)return;
  const articles=Array.isArray(data.articles)?data.articles:[];
  if(!articles.length){showMessage('Automatic headlines are temporarily unavailable. Open the live search below for current reporting.');const link=document.createElement('a');link.href=topic==='cannabis'?'https://news.google.com/search?q=cannabis%20marijuana':'https://news.google.com/search?q=psychedelic%20psilocybin';link.target='_blank';link.rel='noopener noreferrer';link.textContent='Browse current '+topic+' news on Google News';grid.append(link);}
  articles.forEach(a=>{
   let url;try{url=new URL(a.link);}catch{return;}
   if(url.protocol!=='https:')return;
   const card=document.createElement('article');card.className='news-card';
   const meta=document.createElement('div');meta.className='meta';
   const date=new Date(a.published);
   meta.textContent=(a.source||'News source')+' · '+(Number.isNaN(date.getTime())?'Date unavailable':date.toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'}));
   const title=document.createElement('h2');const link=document.createElement('a');link.href=url.href;link.target='_blank';link.rel='noopener noreferrer';link.textContent=a.title;title.append(link);
   card.append(meta,title);grid.append(card);
  });
  status.textContent='Source: '+(source==='cached'?'scheduled news snapshot':'live news service')+' · Last updated: '+(data.updatedAt?new Date(data.updatedAt).toLocaleString():'Not yet refreshed')+(data.stale?' · Showing last available results':'')+' · '+articles.length+' headlines';
 }catch(e){if(current!==sequence)return;status.textContent='News feed temporarily unavailable';showMessage('Headlines could not be loaded. Please try Refresh headlines shortly.');}
}
buttons.forEach(b=>b.addEventListener('click',()=>load(b.dataset.topic)));
document.getElementById('news-refresh').addEventListener('click',()=>load(active));
load(active);
