(()=>{'use strict';const $=s=>document.querySelector(s),M=window.AdmissionGuide;
const st={working:true,multicultural:true,scenario:'none'};let lastAction='initial';
function card(which,result){const node=$('#application-'+which);node.dataset.group=result.group;node.querySelector('.application-work').textContent=st.working?'맞벌이':'외벌이';node.querySelector('.application-family').textContent=which==='b'&&st.multicultural?'다문화가정 구성 예시':'다문화가정 항목 해당 없음';node.querySelector('.application-extra').textContent=M.scenarios[st.scenario].label;node.querySelector('.application-result').textContent=result.title;node.querySelector('.application-tier').textContent=result.tier||'일반모집 요강 확인';
 const reason=node.querySelector('.application-reason');reason.textContent=result.group==='lowIncome'?'적용 항목: 법정저소득층 · 1순위. 다른 우선항목에도 해당하면 보호자가 더 높은 조건 하나를 골라 지원합니다.':result.group==='other'?'해당하는 항목: '+result.matches.join(' · ')+'. 이 요강은 이 항목들을 ‘기타 4순위 이하’로 묶으며, 해당 항목 수를 더해 순위를 올리지 않습니다.':'이 예시에는 해당하는 우선항목이 없습니다. 일반모집의 일정과 자격은 별도 요강에서 확인해야 합니다.';
 node.querySelector('.application-page').textContent='모집요강 PDF · '+result.page+'쪽 ↗';}
function render(){const a=M.evaluate({...st,multicultural:false}),b=M.evaluate(st);card('a',a);card('b',b);const same=a.group===b.group;
 $('#desk-summary').textContent=same?'이번 조건에서는\n두 원서의 모집 분류가 같습니다.':'둘 다 '+(st.working?'맞벌이':'외벌이')+'지만,\nB만 우선모집 항목에 해당합니다.';
 $('#desk-explanation').textContent=st.scenario==='lowIncome'?'두 가정 모두 법정저소득층 자격에 해당하면 1순위로 분류됩니다. 다문화가정 항목에 별도 소득조건이 없다는 말과, 전체 모집요강이 소득을 보지 않는다는 말은 다릅니다.':st.scenario!=='none'?'두 가정이 같은 다른 우선요건에도 해당하므로, 다문화가정 구성 예시인 원서 B만 우선모집 대상이 되는 것은 아닙니다.':st.multicultural?'원서 A와 B의 취업조건은 같습니다. 이 비교에서 다른 점은 요강에 적힌 다문화가정 항목에 해당하는 구성인지 여부입니다.':'원서 B에서도 다문화가정 항목을 제외했습니다. 두 원서 모두 이 예시에 설정한 조건만으로는 우선모집 대상에 해당하지 않습니다.';
 $('#change-note').textContent=lastAction==='work'?(st.working?'맞벌이':'외벌이')+'로 함께 바꿨습니다. 두 원서의 모집 분류는 바뀌지 않습니다. 이 요강의 우선모집 항목에 맞벌이 자체가 없기 때문입니다.':lastAction==='scenario'?'두 가정의 공통조건을 바꿨습니다. '+M.scenarios[st.scenario].label+'.':lastAction==='family'?'원서 B의 가족 자격 항목을 '+(st.multicultural?'반영했습니다.':'제외했습니다.'):'먼저 결과를 보고, 두 가정의 취업조건을 함께 바꿔보세요.';
 for(const button of document.querySelectorAll('[data-working]'))button.setAttribute('aria-pressed',String((button.dataset.working==='true')===st.working));$('#family-match').checked=st.multicultural;$('#common-scenario').value=st.scenario;
 $('#ending-result').textContent=same?'지금 선택한 조건에서는 두 원서의 모집 분류가 같습니다.':'지금 선택한 조건에서는 원서 B만 우선모집 대상에 해당합니다.';
 $('#ending-condition').textContent='두 가정 '+(st.working?'맞벌이':'외벌이')+' · '+M.scenarios[st.scenario].label+' · B의 다문화가정 항목 '+(st.multicultural?'반영':'제외');
}
for(const b of document.querySelectorAll('[data-working]'))b.addEventListener('click',()=>{st.working=b.dataset.working==='true';lastAction='work';render();});$('#family-match').addEventListener('change',e=>{st.multicultural=e.target.checked;lastAction='family';render();});$('#common-scenario').addEventListener('change',e=>{st.scenario=e.target.value;lastAction='scenario';render();});$('#reset-example').addEventListener('click',()=>{Object.assign(st,{working:true,multicultural:true,scenario:'none'});lastAction='initial';render();});render();
})();

(()=>{
'use strict';
const scenes={waiting:{kicker:'어린이집 대기 중',number:'두 달',title:'부모님이 아이를 맡았다.',copy:'입소 차례가 오지 않은 두 달 동안 조부모가 아이를 돌봤다. 김씨는 부모님이 근처에 계시지 않았다면 복직이 어려웠을 것이라고 말했다.'},longday:{kicker:'다른 도움을 받기 어려웠던 때',number:'11~12시간',title:'아이가 어린이집에서 보낸 하루.',copy:'김씨의 출근은 오전 9시, 퇴근은 오후 6시였다. 김씨는 아이가 우울해하고 정서적으로 힘들어했다고도 전했다.'},service:{kicker:'다른 돌봄을 찾아서',number:'긴급돌봄·맘시터',title:'이용해봤지만 충분하지 않았다고 했다.',copy:'김씨는 정부 긴급돌봄과 민간 맘시터를 이용했지만 자신에게는 큰 도움이 되지 않았다고 말했다.'}};
for(const button of document.querySelectorAll('[data-kim]'))button.addEventListener('click',()=>{const scene=scenes[button.dataset.kim];for(const b of document.querySelectorAll('[data-kim]'))b.setAttribute('aria-pressed',String(b===button));for(const [id,key]of [['kim-kicker','kicker'],['kim-number','number'],['kim-scene-title','title'],['kim-scene-copy','copy']])document.getElementById(id).textContent=scene[key];});
function openTarget(){const id=location.hash.slice(1),target=document.getElementById(id);if(target){let parent=target.closest('details');while(parent){parent.open=true;parent=parent.parentElement.closest('details');}}}
window.addEventListener('hashchange',openTarget);openTarget();
document.getElementById('reopen-compare').addEventListener('click',()=>{document.getElementById('deep-dive').open=true;});
})();
