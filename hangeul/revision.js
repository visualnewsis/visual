/* Reader interactions for the first Hangul Day story. */
(()=>{'use strict';
const choices=document.querySelectorAll('[data-boat-choice]');
choices.forEach(button=>button.addEventListener('click',()=>{
  choices.forEach(other=>other.setAttribute('aria-pressed',String(other===button)));
  const small=button.dataset.boatChoice==='small';
  document.getElementById('choice-response').textContent=small
    ? '작은 배에 ‘동동’을 붙이셨군요. 국립국어원도 동동·둥둥을 작은 것과 큰 것의 인상이 갈리는 예로 소개합니다. 이제 아래에서 다른 말도 바꿔 보세요.'
    : '큰 배에 ‘동동’을 붙이셨군요. 흔히 작은 것에는 동동, 큰 것에는 둥둥을 연결하지만, 말의 느낌은 문맥과 경험에도 영향을 받습니다. 아래의 다른 말은 어떻게 느껴지나요?';
}));
const context=document.getElementById('context-toggle');
context.addEventListener('click',()=>{
  const heart=context.getAttribute('aria-pressed')!=='true';
  context.setAttribute('aria-pressed',String(heart));
  document.getElementById('context-subject').textContent=heart?'속이':'찌개가';
  document.getElementById('context-lead').textContent=heart?'억울한 말을 듣고 돌아왔다.':'저녁을 준비하며 냄비를 들여다봤다.';
  document.getElementById('context-note').textContent=heart?'물도 불도 없는 문장입니다. 끓어오르는 것은 화와 답답함. 액체가 끓는 표현을 마음의 움직임에도 쓰고 있습니다.':'지금 끓는 것은 냄비 속 액체입니다. 이번에는 앞뒤 상황과 주어를 바꿔 보세요.';
  context.textContent=heart?'다시 냄비로 돌아가기':'마음의 문장으로 옮겨보기';
});
const fields=[...document.querySelectorAll('[data-story-word]')];
const output=document.getElementById('story-result');
function render(){
  const [boat,pot,glow]=fields.map(el=>el.value);
  output.textContent=`숲에서 하루를 보냈다. 배가 ${boat} 떠 있었다. 냄비가 ${pot} 끓었다. 밤이 되자 불빛이 ${glow} 빛났다.`;
  document.getElementById('story-reading').textContent=`${boat==='동동'?'작고 가벼운 배':'더 크고 묵직하게 느껴지는 배'}, ${pot==='보글보글'?'작은 거품이 이는 냄비':'거품이 크게 솟는 냄비'}, ${glow==='반짝반짝'?'작은 빛의 반짝임':'큰 빛의 번쩍임'}. 같은 사건에 서로 다른 묘사를 골랐습니다. 이는 이 기사에서 제안하는 읽기이며 정답은 아닙니다.`;
}
fields.forEach(el=>el.addEventListener('change',render));render();
document.getElementById('story-reset').addEventListener('click',()=>{fields.forEach(el=>el.selectedIndex=0);render();});
})();
