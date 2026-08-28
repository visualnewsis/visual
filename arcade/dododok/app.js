const $=selector=>document.querySelector(selector);
const fallback=[
  {category:'사회',title:'오늘의 뉴스는 제목에서 시작됩니다',url:'https://www.newsis.com/'},
  {category:'문화',title:'읽는 속도와 쓰는 속도 사이',url:'https://www.newsis.com/'}
];
const SESSION_SIZE=12;
let articles=[],currentIndex=0,current=null,startedAt=0,composing=false,audioContext=null,completed=[],advancing=false;
const input=$('#typingInput'),target=$('#target');

const chars=value=>Array.from(String(value||'').normalize('NFC'));
const typingTitle=value=>String(value||'').normalize('NFC');
const isTypingCharacter=()=>true;
function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function shuffle(items){return [...items].sort(()=>Math.random()-.5)}
function keySound(ok=true){
  if(!audioContext)audioContext=new(window.AudioContext||window.webkitAudioContext)();
  const oscillator=audioContext.createOscillator(),gain=audioContext.createGain(),now=audioContext.currentTime;
  oscillator.type='square';oscillator.frequency.setValueAtTime(ok?170:95,now);gain.gain.setValueAtTime(.025,now);gain.gain.exponentialRampToValueAtTime(.001,now+.035);oscillator.connect(gain).connect(audioContext.destination);oscillator.start(now);oscillator.stop(now+.04);
}
function typingBurst(ok=true){
  const burst=$('#typingBurst');if(!burst)return;
  burst.textContent=ok?(Math.random()>.5?'도도독':'도독'):'도도...';
  burst.classList.remove('pop');void burst.offsetWidth;burst.classList.add('pop');
}
function metrics(){
  const expected=chars(typingTitle(current.title)),typed=chars(typingTitle(input.value)),matches=typed.filter((letter,index)=>letter===expected[index]).length;
  const accuracy=typed.length?Math.round(matches/typed.length*100):100,progress=Math.min(100,Math.round(typed.length/expected.length*100));
  const elapsed=startedAt?(Date.now()-startedAt)/60000:0,speed=elapsed?Math.round(typed.length/elapsed):0;
  return{expected,typed,matches,accuracy,progress,speed};
}
function renderTyping(){
  const {expected,typed,accuracy,progress,speed}=metrics();
  let typingIndex=0;
  target.innerHTML=chars(current.title).map(letter=>{
    if(!isTypingCharacter(letter))return `<span class="ignored">${escapeHtml(letter)}</span>`;
    const index=typingIndex++;
    if(index<typed.length)return `<span class="${typed[index]===expected[index]?'done':'wrong'}">${escapeHtml(letter)}</span>`;
    if(index===typed.length)return `<span class="cursor">${escapeHtml(letter)}</span>`;
    return `<span>${escapeHtml(letter)}</span>`;
  }).join('');
  $('#accuracy').textContent=`${accuracy}%`;$('#progress').textContent=`${progress}%`;$('#speed').textContent=speed;
  const complete=typed.length===expected.length&&typed.every((letter,index)=>letter===expected[index]);
  $('#status').textContent=typed.length?complete?'도도독, 제목을 완성했습니다.':`${typed.length} / ${expected.length}자 입력 중`:'첫 글자를 입력하면 측정이 시작됩니다.';
  if(complete)finish();
}
function loadArticle(index){
  currentIndex=index%articles.length;current=articles[currentIndex];startedAt=0;advancing=false;input.value='';input.disabled=false;
  $('#category').textContent=current.category||'오늘의 뉴스';$('#count').textContent=`${String(currentIndex+1).padStart(2,'0')} / ${String(articles.length).padStart(2,'0')}`;$('#headline').textContent=current.title;$('#result').hidden=true;
  const sheet=$('.copy-sheet'),length=chars(current.title).length;sheet.classList.toggle('long-title',length>36);sheet.classList.toggle('very-long-title',length>50);
  renderTyping();if(completed.length)requestAnimationFrame(()=>input.focus({preventScroll:true}));window.gtag?.('event','dododok_article_start',{article_title:current.title});
}
function finish(){
  if(advancing)return;advancing=true;const score=metrics();completed.push({...current,accuracy:score.accuracy,speed:score.speed});window.gtag?.('event','dododok_title_complete',{accuracy:score.accuracy,speed:score.speed,article_title:current.title,question_number:completed.length});
  if(completed.length<articles.length){$('#status').textContent=`${completed.length}번째 제목 완성! 다음 제목을 불러옵니다.`;setTimeout(()=>loadArticle(currentIndex+1),650);return}
  input.disabled=true;showFinal();
}
function showFinal(){
  const averageAccuracy=Math.round(completed.reduce((sum,item)=>sum+item.accuracy,0)/completed.length),averageSpeed=Math.round(completed.reduce((sum,item)=>sum+item.speed,0)/completed.length);$('#finalAccuracy').textContent=`${averageAccuracy}%`;$('#finalSpeed').textContent=averageSpeed;
  $('#sessionArticles').innerHTML=completed.map((item,index)=>`<a href="${escapeHtml(item.url)}" target="_blank" rel="noopener"><span>${String(index+1).padStart(2,'0')}</span><b>${escapeHtml(item.title)}</b><i>기사 보기 ↗</i></a>`).join('');$('#result').hidden=false;$('#result').scrollIntoView({behavior:'smooth',block:'start'});window.gtag?.('event','dododok_session_complete',{average_accuracy:averageAccuracy,average_speed:averageSpeed,article_count:completed.length});
}
input.addEventListener('compositionstart',()=>{composing=true});
input.addEventListener('compositionend',()=>{
  composing=false;if(!startedAt&&input.value)startedAt=Date.now();
  const typed=chars(input.value),expected=chars(typingTitle(current.title)),ok=!typed.length||typed.at(-1)===expected[typed.length-1];keySound(ok);typingBurst(ok);renderTyping();
});
input.addEventListener('input',event=>{
  if(composing||event.isComposing)return;if(!startedAt&&input.value)startedAt=Date.now();
  const limit=chars(typingTitle(current.title)).length;if(chars(input.value).length>limit)input.value=chars(input.value).slice(0,limit).join('');
  const typed=chars(input.value),expected=chars(typingTitle(current.title)),ok=!typed.length||typed.at(-1)===expected[typed.length-1];keySound(ok);typingBurst(ok);const keys=document.querySelectorAll('.key-row i'),key=keys.length?keys[Math.floor(Math.random()*keys.length)]:null;if(key){key.classList.add('hit');setTimeout(()=>key.classList.remove('hit'),70)}renderTyping();
});
input.addEventListener('paste',event=>event.preventDefault());
$('#nextButton').addEventListener('click',()=>{completed=[];articles=shuffle(articles);loadArticle(0)});
$('#sessionArticles').addEventListener('click',event=>{const link=event.target.closest('a');if(link)window.gtag?.('event','dododok_article_click',{article_url:link.href})});
$('.start-link').addEventListener('click',()=>setTimeout(()=>input.focus(),280));

async function init(){
  try{
    const response=await fetch('../puzzle/data/puzzles.json',{cache:'no-store'});if(!response.ok)throw new Error(response.status);const data=await response.json();
    articles=(data.puzzles||[]).map(item=>({category:item.category,title:String(item.title||'').trim(),url:item.url})).filter(item=>item.title.length>=8&&item.title.length<=60&&item.url).slice(0,20);
  }catch(error){console.warn('최신 제목을 불러오지 못해 기본 문장을 사용합니다.',error)}
  if(!articles.length)articles=fallback;articles=shuffle(articles).slice(0,Math.min(SESSION_SIZE,articles.length));loadArticle(0);
}
init();
