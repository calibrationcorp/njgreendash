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
  const response=await fetch('/api/news?category='+encodeURIComponent(topic),{headers:{Accept:'application/json'}});
  if(!response.ok) throw new Error('Unable to retrieve news');
  const data=await response.json();if(current!==sequence)return;
  const articles=Array.isArray(data.articles)?data.articles:[];
  if(!articles.length){showMessage('No current headlines found for this category. Try again later.');}
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
  status.textContent='Last checked: '+new Date(data.updatedAt).toLocaleString()+(data.stale?' · Showing last available results':'')+' · '+articles.length+' headlines';
 }catch(e){if(current!==sequence)return;status.textContent='News feed temporarily unavailable';showMessage('Headlines could not be loaded. Please try Refresh headlines shortly.');}
}
buttons.forEach(b=>b.addEventListener('click',()=>load(b.dataset.topic)));
document.getElementById('news-refresh').addEventListener('click',()=>load(active));
load(active);
