(function(root){
 'use strict';
 const noise=new Set(['요즘','최근','오늘','뉴스','기사','관련','내용','소식','좀','좀더','알려','알려줘','알려주세요','보여줘','보여주세요','찾아줘','찾아주세요','찾고','싶어','궁금해','궁금해요','무슨','어떤','어떻게','얼마나','됐어','됐나요','돼','정리','정리해줘','있어','있어요','있나요','해주세요','해줘','궁금한데','말이야','대한','대해','관한','그','이','것','거']);
 ['될까','될까요','했어','했나요','왜','어때','알고','싶어요'].forEach(w=>noise.add(w));
 function extract(question){
  const text=String(question).normalize('NFKC').replace(/국민\s+연금/g,'국민연금').replace(/인공\s+지능/g,'인공지능').replace(/어떻게\s*됐(?:어|나요|는지)/g,' ').replace(/퇴사하면/g,'퇴사').replace(/버틸(?:까|까요|수)/g,' ');
  const knownSubjects=new Set(['금리','물가','주가','환율','연금','국민연금','연금개혁','대출','정부','월세','전세','주택','반도체','퇴사','생활비','인공지능','일자리','AI','IT','손흥민','이강인','삼성전자','하이닉스','SK하이닉스','미국','한국','서울','중구','뉴시스','트럼프','이재명','윤석열','계산대로','여기뉴스','고령화','기후재난','점자','시각장애']);
  const words=(text.match(/[\p{L}\p{N}][\p{L}\p{N}·.+-]*/gu)||[]).filter(w=>!noise.has(w)).map(word=>{
   word=word.replace(/(?:했어|했나요|했는지|될까|될까요)$/u,m=>word.length-m.length>=2?'':m);
   // Single-character endings can be part of a name (김정은, 어린이, 한강대로).
   // Strip those only from known subjects; preserve unknown names for the editable query.
   return word.replace(/(?:에서는|에서|에게|이랑|하고|으로|랑|은|는|을|를|에|의|이|가|와|과|로)$/u,m=>{const stem=word.slice(0,-m.length);return (m.length>1&&stem.length>=2)||knownSubjects.has(stem)?'':m;});
  }).filter(w=>w&&!noise.has(w)&&w.length>1);
  return [...new Set(words)].slice(0,8).join(' ').slice(0,100);
 }
 const concepts=[['퇴사','생활비','통장','잔고'],['AI','인공지능','일자리','노동시장'],['연금','국민연금','노후'],['주택','대출','내집','집값'],['고령','나이','환갑'],['점자','시각장애','훈맹정음'],['안전','재난','폭염','폭우'],['축구','손흥민','이강인']];
 function rank(query,items){const terms=extract(query).toLowerCase().split(/\s+/).filter(Boolean);if(!terms.length)return [];const expanded=new Set(terms);concepts.forEach(group=>{if(group.some(w=>terms.some(t=>t.includes(w.toLowerCase()))))group.forEach(w=>expanded.add(w.toLowerCase()));});return items.map(item=>{const title=item.title.toLowerCase(),text=(item.title+' '+item.description).toLowerCase();let score=0;for(const term of expanded){if(text.includes(term))score+=terms.includes(term)?(title.includes(term)?6:3):1;}return {...item,score};}).filter(item=>item.score>0).sort((a,b)=>b.score-a.score).slice(0,3);}
 function searchURL(keywords){const url=new URL('https://www.google.com/search');url.searchParams.set('q','site:newsis.com/view/ '+keywords);return url.href;}
 function easterEgg(question){
  const text=String(question).normalize('NFKC').replace(/[\s?!！？.,。~～]/gu,'');
  return /^(?:(?:통이(?:야|는|의)?|너(?:는|의)?|네|니))?(?:아빠|아버지)(?:가|는)?(?:누구(?:야|예요|에요|세요|입니까|니|인가요|인지알려줘|인지알려주세요)?|누군가요)$/.test(text)?'안재현 기자입니다':null;
 }
 const api={extract,rank,searchURL,easterEgg};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.TongiSearch=api;
})(typeof window==='undefined'?globalThis:window);
