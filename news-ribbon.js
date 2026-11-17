'use strict';
(function(){
  const host=document.getElementById('njgd-headline-links');
  if(!host)return;
  const makeLink=(label,href,external=true)=>{
    const a=document.createElement('a');
    a.href=href;
    a.textContent=label;
    if(external){a.target='_blank';a.rel='noopener noreferrer';}
    return a;
  };
  const official=[
    ['NJ-CRC resources','https://www.nj.gov/cannabis/resources/'],
    ['Licensing & enforcement','https://www.nj.gov/cannabis/businesses/compliance-investigations/violations-and-enforcement/'],
    ['All industry news','news.html',false]
  ];
  fetch('news-cache.json',{cache:'no-store'})
    .then(response=>{if(!response.ok)throw new Error('News cache unavailable');return response.json();})
    .then(data=>{
      const articles=Array.isArray(data?.topics?.cannabis?.articles)?data.topics.cannabis.articles:[];
      const links=[];
      for(const article of articles){
        if(links.length>=2)break;
        try{
          const url=new URL(article.link);
          if(url.protocol!=='https:'||!article.title)continue;
          links.push(makeLink(article.title,url.href));
        }catch(_){}
      }
      for(const [label,url,external] of official)links.push(makeLink(label,url,external!==false));
      host.replaceChildren(...links);
    })
    .catch(()=>{
      host.replaceChildren(
        makeLink('Latest cannabis headlines','https://news.google.com/search?q=New+Jersey+cannabis+regulation&hl=en-US&gl=US&ceid=US%3Aen'),
        ...official.map(([label,url,external])=>makeLink(label,url,external!==false))
      );
    });
})();