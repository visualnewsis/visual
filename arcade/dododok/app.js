const $=selector=>document.querySelector(selector);
const fallback=[
  {category:'사회',title:'오늘의 뉴스는 한 문장에서 시작됩니다',description:'뉴스의 첫 문장을 천천히 입력하며 오늘의 흐름을 손끝으로 만나보세요.',url:'https://www.newsis.com/'},
  {category:'문화',title:'읽는 속도와 쓰는 속도 사이',description:'한 글자씩 정확하게 옮겨 적다 보면 그냥 지나쳤던 문장이 조금 다르게 보입니다.',url:'https://www.newsis.com/'}
];
let articles=[],currentIndex=0,current=null,startedAt=0,composing=false,audioContext=null;
const input=$('#typingInput'),target=$('#target');

const chars=value=>Array.from(String(value||'').normalize('NFC'));
function cleanLead(value){return String(value||'').replace(/^\s*\[[^\]]+=뉴시스\]\s*[^=]{1,40}\s*=\s*/,'').replace(/\s+/g,' ').trim().slice(0,220)}
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function shuffle(items){return [...items].sort(()=>Math.random()-.5)}
function keySound(ok=true){
  if(!audioContext)audioContext=new(window.AudioContext||window.webkitAudioContext)();
  const oscillator=audioContext.createOscillator(),gain=audioContext.createGain(),now=audioContext.currentTime;
  oscillator.type='square';oscillator.frequency.setValueAtTime(ok?170:95,now);gain.gain.setValueAtTime(.025,now);gain.gain.exponentialRampToValueAtTime(.001,now+.035);oscillator.connect(gain).connect(audioContext.destination);oscillator.start(now);oscillator.stop(now+.04);
}
function metrics(){
  const expected=chars(current.description),typed=chars(input.value),matches=typed.filter((letter,index)=>letter===expected[index]).length;
  const accuracy=typed.length?Math.round(matches/typed.length*100):100,progress=Math.min(100,Math.round(typed.length/expected.length*100));
  const elapsed=startedAt?(Date.now()-startedAt)/60000:0,speed=elapsed?Math.round(typed.length/elapsed):0;
  return{expected,typed,matches,accuracy,progress,speed};
}
function renderTyping(){
  const {expected,typed,accuracy,progress,speed}=metrics();
  target.innerHTML=expected.map((letter,index)=>{
    if(index<typed.length)return `<span class="${typed[index]===letter?'done':'wrong'}">${escapeHtml(letter)}</span>`;
    if(index===typed.length)return `<span class="cursor">${escapeHtml(letter)}</span>`;
    return escapeHtml(letter);
  }).join('');
  $('#accuracy').textContent=`${accuracy}%`;$('#progress').textContent=`${progress}%`;$('#speed').textContent=speed;
  const complete=typed.length===expected.length&&typed.every((letter,index)=>letter===expected[index]);
  $('#status').textContent=typed.length?complete?'도도독, 한 문장을 완성했습니다.':`${typed.length} / ${expected.length}자 입력 중`:'첫 글자를 입력하면 측정이 시작됩니다.';
  if(complete)finish();
}
function loadArticle(index){
  currentIndex=index%articles.length;current=articles[currentIndex];startedAt=0;input.value='';input.disabled=false;
  $('#category').textContent=current.category||'오늘의 뉴스';$('#count').textContent=`${String(currentIndex+1).padStart(2,'0')} / ${String(articles.length).padStart(2,'0')}`;$('#headline').textContent=current.title;$('#result').hidden=true;
  renderTyping();setTimeout(()=>input.focus(),120);window.gtag?.('event','dododok_article_start',{article_title:current.title});
}
function finish(){
  input.disabled=true;const result=metrics();$('#finalAccuracy').textContent=`${result.accuracy}%`;$('#finalSpeed').textContent=result.speed;$('#resultTitle').textContent=current.title;$('#articleLink').href=current.url;$('#result').hidden=false;$('#result').scrollIntoView({behavior:'smooth',block:'center'});window.gtag?.('event','dododok_complete',{accuracy:result.accuracy,speed:result.speed,article_title:current.title});
}
input.addEventListener('compositionstart',()=>{composing=true});
input.addEventListener('compositionend',()=>{
  composing=false;input.value=input.value.normalize('NFC');if(!startedAt&&input.value)startedAt=Date.now();
  const typed=chars(input.value),expected=chars(current.description),ok=!typed.length||typed.at(-1)===expected[typed.length-1];keySound(ok);renderTyping();
});
input.addEventListener('input',event=>{
  if(composing||event.isComposing)return;if(!startedAt&&input.value)startedAt=Date.now();
  const limit=chars(current.description).length;if(chars(input.value).length>limit)input.value=chars(input.value).slice(0,limit).join('');
  const typed=chars(input.value),expected=chars(current.description),ok=!typed.length||typed.at(-1)===expected[typed.length-1];keySound(ok);const keys=document.querySelectorAll('.key-row i'),key=keys[Math.floor(Math.random()*keys.length)];key.classList.add('hit');setTimeout(()=>key.classList.remove('hit'),70);renderTyping();
});
input.addEventListener('paste',event=>event.preventDefault());
$('#nextButton').addEventListener('click',()=>loadArticle(currentIndex+1));
$('#articleLink').addEventListener('click',()=>window.gtag?.('event','dododok_article_click',{article_title:current.title}));

async function init(){
  try{
    const response=await fetch('../puzzle/data/puzzles.json',{cache:'no-store'});if(!response.ok)throw new Error(response.status);const data=await response.json();
    articles=(data.puzzles||[]).map(item=>({category:item.category,title:item.title,description:cleanLead(item.description),url:item.url})).filter(item=>item.description.length>=35&&item.url).slice(0,20);
  }catch(error){console.warn('최신 리드문을 불러오지 못해 기본 문장을 사용합니다.',error)}
  if(!articles.length)articles=fallback;articles=shuffle(articles);loadArticle(0);
}
init();
