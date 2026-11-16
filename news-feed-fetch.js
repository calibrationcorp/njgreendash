'use strict';
const fs=require('node:fs');
const https=require('node:https');
const topics={
 cannabis:'cannabis marijuana legalization regulation industry when:7d',
 psychedelics:'psychedelic psilocybin MDMA research policy when:7d'
};
function unescape(s){return String(s||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>{const v=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return v>0&&v<=0x10ffff?String.fromCodePoint(v):''}).replace(/&(?:amp|lt|gt|quot|apos|nbsp);/g,m=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':' '}[m])).replace(/<[^>]+>/g,'').trim()}
function tag(block,name){const m=block.match(new RegExp('<'+name+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/'+name+'>','i'));return m?unescape(m[1]):''}
function download(topic){const url='https://news.google.com/rss/search?q='+encodeURIComponent(topics[topic])+'&hl=en-US&gl=US&ceid=US:en';return new Promise((resolve,reject)=>{https.get(url,{headers:{'User-Agent':'NJGreenDash/1.0'}},response=>{if(response.statusCode!==200){response.resume();return reject(Error('RSS HTTP '+response.statusCode))}let xml='';response.setEncoding('utf8');response.on('data',part=>{xml+=part;if(xml.length>1500000)response.destroy(Error('RSS too large'))});response.on('end',()=>resolve(xml));response.on('error',reject)}).on('error',reject).setTimeout(12000,function(){this.destroy(Error('timeout'))})})}
async function main(){let old={};try{old=JSON.parse(fs.readFileSync('news-cache.json','utf8'))}catch{}
const result={updatedAt:new Date().toISOString(),topics:{}};
let fresh=0;
for(const topic of Object.keys(topics)){try{const xml=await download(topic);const articles=[...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(x=>({title:tag(x[1],'title'),link:tag(x[1],'link'),source:tag(x[1],'source')||'Google News',published:tag(x[1],'pubDate')})).filter(x=>x.title&&/^https:\/\//.test(x.link)&&!Number.isNaN(Date.parse(x.published))).sort((a,b)=>Date.parse(b.published)-Date.parse(a.published)).slice(0,25);if(!articles.length)throw Error('No articles');result.topics[topic]={updatedAt:result.updatedAt,articles};fresh++}catch(e){console.error(topic,e.message);if(old.topics?.[topic]?.articles?.length)result.topics[topic]=old.topics[topic];else result.topics[topic]={updatedAt:null,articles:[]}}}
if(!fresh)throw Error('No feeds updated. Keeping existing cache.');
fs.writeFileSync('news-cache.json',JSON.stringify(result,null,2)+'\n');
console.log('Updated '+fresh+' news feeds')}
main().catch(e=>{console.error(e);process.exitCode=1});
