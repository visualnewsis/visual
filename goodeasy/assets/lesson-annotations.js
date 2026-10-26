// Labels identify the actual moving objects; diagram-only coordinates are explicit.
export function lessonAnnotations(model,id){
 const find=name=>model.group.getObjectByName(name),point=(text,p)=>({text,point:p}),object=(text,o)=>({text,object:o});
 const sets={
  string:[point('진동하는 구간',s=>[-2+2*(s.length||100)/100,.7,0]),point('줄을 짚는 위치',s=>[-2+4*(s.length||100)/100,.65,0]),point('고정된 끝',[2,.65,0])],
  harmonics:[point('진동하는 현',[0,.7,0]),point('고정된 양 끝',[-2,.65,0])],
  'guitar-body':[object('브리지',find('bridge')),object('상판',model.group.getObjectByName('top')||find('arched soundboard'))],
  bow:[point('활털과 현의 접촉점',[0,.65,0]),object('움직이는 활',find('bow'))],
  'violin-bridge':[object('브리지',find('upright violin bridge with feet and windows')),point('상판',[.54,.38,0]),point('사운드포스트',[.54,-.08,.435])],
  'violin-body':[point('사운드포스트',[.27,-.01,.145]),point('상판 안쪽 배스바',s=>[-.05,.07+(s.explode||0)*.65,-.145])],
  retrieve:[object('손잡이',model.parts?.handle),object('로터와 베일',model.parts?.rotor),object('줄이 감기는 스풀',model.parts?.spool)],
  oscillation:[object('회전 크랭크',find('crank')),object('왕복 슬라이더',find('slotted follower'))],
  drag:[object('교대로 겹친 마찰판',find('washers')),point('압력을 조절하는 노브',[0,1.2,0])],
  'mx-structure':[object('키캡',model.parts?.keycap),object('십자 스템',model.parts?.stem),object('복귀 스프링',model.parts?.spring),object('금속 접점',model.parts?.movingLeaf)],
  'spring-force':[point('압축되는 스프링',[0,1,0]),point('스프링의 반발력',[1,.8,0])],
  debounce:[point('접점에서 읽힌 신호',[-.7,.1,0]),point('안정화한 뒤의 입력',[.7,.1,0])],
  power:[point('태엽의 안쪽 축',[0,.2,0]),point('태엽통의 톱니',[.86,.1,0])],
  gears:[point('큰 바퀴 · 톱니 48개',[-.6,.07,0]),point('작은 피니언 · 톱니 12개',[.6,.07,0])],
  escapement:[point('탈진바퀴',[0,.05,0]),point('앵커와 팔렛',[0,.12,1.18]),point('밸런스',[0,.1,2.45])],
  balance:[point('진동하는 밸런스',[.9,.02,0]),point('헤어스프링',[.18,.1,0])],
  'film-gate':[object('필름과 퍼포레이션',find('film')),object('필름 게이트',find('gate'))],
  frames:[point('한 장씩 교대하는 그림',[0,.2,0])]
 };
 return (sets[id]||[]).filter(a=>a.point||a.object);
}
