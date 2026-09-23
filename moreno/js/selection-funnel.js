(function(root){'use strict';
const questions=[
 {question:'대표팀에서 어떤 역할을 할 수 있습니까?',answers:[
  {id:'generic',text:'기회를 주시면 누구보다 뛰겠습니다.',score:0,note:'의지는 있으나 판단할 근거가 부족하다.'},
  {id:'current',text:'전방 압박과 움직임으로 공격의 출발점을 만들겠습니다.',score:3,note:'현재 경기력과 역할을 함께 설명했다.'},
  {id:'record',text:'득점과 큰 경기 경험이 강점입니다. 수비 부담을 줄이면 박스 안에서 더 위협적일 수 있습니다.',score:2,note:'강점과 조건은 분명하다. 팀이 원하는 역할과 맞는지 확인이 필요하다.'}
 ]},
 {question:'강팀을 상대로 4-4-2의 공격수를 맡는다면?',answers:[
  {id:'finish',text:'압박 위치를 조절해 체력을 남기고, 박스 안 마무리에 집중하겠습니다.',score:2,note:'마무리 역할은 분명하다. 팀이 원하는 압박 강도와 맞는지 확인이 필요하다.'},
  {id:'comply',text:'감독이 시키는 일은 무엇이든 하겠습니다.',score:0,note:'의지는 있지만 움직임은 구체적이지 않다.'},
  {id:'balance',text:'골 기회가 줄더라도 공을 잃는 순간 먼저 압박하고, 동료가 들어갈 공간을 만들겠습니다.',score:3,note:'공수 균형과 팀 역할을 우선했다.'}
 ]},
 {question:'왜 국가대표 공격수로 뛰고 싶습니까?',answers:[
  {id:'responsibility',text:'태극마크가 간절합니다. 몸 상태와 맡을 역할도 솔직히 말하겠습니다.',score:3,note:'대표팀을 원하는 눈빛과 책임을 함께 보였다.'},
  {id:'dream',text:'국가대표는 평생의 꿈이었습니다.',score:2,note:'열망은 분명하지만 팀에서 맡을 역할은 남았다.'},
  {id:'hide',text:'몸이 불편해도 숨기고 뛰겠습니다.',score:-3,redFlag:true,note:'정보를 숨기면 팀의 판단까지 흔들린다.'}
 ]}
];
const outcomes={
 selected:{title:'후보 B를\n다시 볼 이유가 생겼습니다.',copy:'압박과 움직임에서 어떤 역할을 할 수 있는지, 대표팀을 얼마나 원하는지 확인했습니다.'},
 watch:{title:'면담을 했지만,\n후보 A가 더 앞섰습니다.',copy:'후보 B의 장점은 보였지만 최근 경기력의 차이를 넘을 만큼 뚜렷하지 않았습니다.'},
 out:{title:'면담에서도\n확신을 얻지 못했습니다.',copy:'현재 기량과 맡을 역할, 대표팀을 원하는 이유가 분명하게 드러나지 않았습니다.'}
};
function evaluate(answers){const total=answers.reduce((sum,item)=>sum+item.score,0),redFlag=answers.some(item=>item.redFlag);if(!redFlag&&total>=7)return 'selected';if(!redFlag&&total>=3)return 'watch';return 'out';}
const api={questions,outcomes,evaluate};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.SelectionFunnel=api;if(typeof document==='undefined')return;
const $=id=>document.getElementById(id),reduced=root.matchMedia&&root.matchMedia('(prefers-reduced-motion: reduce)').matches;
const dataView=$('decisionDataView'),interviewView=$('interviewView'),result=$('decisionResult');
if(!dataView||!interviewView||!result)return;
let questionIndex=0,answers=[],resultReadyTimer=null;
function show(view,label){[dataView,interviewView,result].forEach(node=>node.hidden=node!==view);$('decisionProgress').textContent=label;$('selectionPanel').classList.toggle('is-result',view===result);$('selectionLab').classList.toggle('is-interview',view===interviewView);$('selectionLab').classList.toggle('is-result',view===result);$('selectionPanel').focus({preventScroll:true});}
function renderQuestion(){
 const item=questions[questionIndex],options=$('dialogueOptions');
 $('interviewProgress').textContent='질문 '+(questionIndex+1)+' / '+questions.length;
 $('interviewQuestion').textContent=item.question;
 $('interviewBack').hidden=questionIndex===0;$('dialogueGuide').textContent=answers[questionIndex]?'답을 바꾸면 다음 질문으로 넘어갑니다.':'답을 고르면 다음 질문으로 넘어갑니다.';
 $('coachNote').hidden=true;options.hidden=false;options.replaceChildren();
 item.answers.forEach((answer,index)=>{const button=document.createElement('button');button.type='button';button.dataset.answer=answer.id;button.setAttribute('aria-pressed',String(answers[questionIndex]?.id===answer.id));const number=document.createElement('span');number.textContent=String(index+1).padStart(2,'0');const copy=document.createElement('b');copy.textContent=answer.text;button.append(number,copy);button.addEventListener('click',()=>chooseAnswer(answer,button));options.appendChild(button);});
}
function chooseAnswer(answer,button){
 answers[questionIndex]=answer;
 $('dialogueOptions').querySelectorAll('button').forEach(node=>{node.classList.toggle('is-chosen',node===button);node.setAttribute('aria-pressed',String(node===button));});
 if(questionIndex<questions.length-1){questionIndex+=1;renderQuestion();return;}
 finish();
}
function finish(){
 const choice=evaluate(answers),outcome=outcomes[choice];
 if(resultReadyTimer!==null&&root.clearTimeout)root.clearTimeout(resultReadyTimer);
 result.classList.remove('is-actions-ready');$('methodReset').disabled=true;
 result.classList.toggle('is-rejected',choice!=='selected');$('decisionVerdict').textContent=choice==='selected'?'면담 뒤,\n생각이 바뀌었습니다':'면담 뒤에도,\n생각은 같았습니다';$('decisionResultTitle').textContent=outcome.title;$('decisionResultCopy').textContent=outcome.copy;
 const summary=$('interviewSummary');summary.replaceChildren();answers.forEach((answer,index)=>{const row=document.createElement('div'),label=document.createElement('span'),copy=document.createElement('p');label.textContent='질문 '+(index+1);copy.textContent=answer.note;row.append(label,copy);summary.appendChild(row);});
 show(result,'기준 확인 완료');
 const verdict=$('decisionVerdict');if(verdict&&verdict.parentElement&&verdict.parentElement.scrollIntoView)requestAnimationFrame(()=>verdict.parentElement.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'}));
 const revealReset=()=>{result.classList.add('is-actions-ready');$('methodReset').disabled=false;resultReadyTimer=null;};
 if(root.setTimeout)resultReadyTimer=root.setTimeout(revealReset,reduced?0:1100);else revealReset();
 const detail={choice,outcome,answers:answers.map(item=>item.id)};root.latestSelectionMethod=detail;if(typeof root.CustomEvent==='function')root.dispatchEvent(new root.CustomEvent('selectionMethodComplete',{detail}));
}
$('enterInterview').addEventListener('click',()=>{if(typeof root.gtag==='function')root.gtag('event','interview_start',{story:'ai_football_coach'});questionIndex=0;answers=[];show(interviewView,'직접 면담');renderQuestion();const panel=$('selectionPanel');if(panel&&panel.scrollIntoView)requestAnimationFrame(()=>panel.scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'}));});
$('interviewBack').addEventListener('click',()=>{if(questionIndex===0)return;questionIndex-=1;renderQuestion();});
$('interviewNext').addEventListener('click',()=>{if(!answers[questionIndex])return;if(questionIndex<questions.length-1){questionIndex+=1;renderQuestion();return;}finish();});
$('methodReset').addEventListener('click',()=>{if(resultReadyTimer!==null&&root.clearTimeout)root.clearTimeout(resultReadyTimer);resultReadyTimer=null;result.classList.remove('is-actions-ready');$('methodReset').disabled=true;questionIndex=0;answers=[];show(dataView,'기록 먼저 보기');});
if(reduced)document.documentElement.classList.add('reduced-motion');
})(typeof window==='undefined'?globalThis:window);
