'use strict';
// Editorial comparison of demands already sourced in the country chapters.
// A point is a reported city, not an origin or a route of transmission.
const demandAtlas=(()=>{
 const topics=[
  {id:'education',label:'교육 지원',context:'교사·교육 예산·학생수당. 같은 교육 요구도 대상은 다르다.',initial:'lyon'},
  {id:'housing',label:'주거비',context:'집세·퇴거 보호·공공주택을 놓고 나온 요구.',initial:'madrid'},
  {id:'living',label:'생활비',context:'물가·임금·공공요금. 교실 밖의 부담도 집회 쟁점으로.',initial:'lyon'}
 ];
 const records=[
  {city:'lyon',country:'France',name:'프랑스',side:'left',offset:-10,demands:{
   education:{date:'10월2일',text:'교사 충원·낡은 학교 시설 개선',scope:'리옹 고교생들의 행진에서 제기한 요구.',scene:'lyon-school-map',source:'NISX20261007_0003816508'},
   living:{date:'10월17일',text:'교육 개선에 연대하며 생활비 상승에 항의',scope:'2일 고교생 행진과는 날짜·참가자가 다른 집회.',scene:'lyon-living-map',source:'NISX20261018_0003830169'}
  }},
  {city:'brussels',country:'Belgium',name:'벨기에',side:'left',offset:-25,demands:{
   education:{date:'10월9일',text:'교육 개혁·교육 예산 삭감에 반대',scope:'벨기에 프랑스어권 정책에 항의한 학생·교사들.',scene:'country-brussels',source:'NISX20261022_0003836934'}
  }},
  {city:'frankfurt',country:'Germany',name:'독일',side:'right',offset:1,demands:{
   education:{date:'10월31일',text:'교육·기후 지원 확대 요구',scope:'지도는 프랑크푸르트. 요구는 전국 청년 행동의 쟁점.',scene:'country-frankfurt',source:'NISX20261101_0003849471'},
   living:{date:'10월31일',text:'생활비 대책을 요구한 청년들',scope:'10월31일 전국 행동의 요구. 14일 후속 집회와 구분.',scene:'country-frankfurt',source:'NISX20261101_0003849471'}
  }},
  {city:'rome',country:'Italy',name:'이탈리아',side:'left',offset:-24,demands:{
   housing:{date:'10월30일',text:'주거난·집세 부담에 항의',scope:'로마 사진과 함께 전한 이탈리아 총파업의 쟁점.',scene:'country-rome',source:'NISX20261102_0003850591'},
   living:{date:'10월30일',text:'생활비·공공요금 부담에 항의',scope:'군비 확대 반대도 함께 제기한 총파업 참가자들.',scene:'country-rome',source:'NISX20261102_0003850591'}
  }},
  {city:'tirana',country:'Albania',name:'알바니아',side:'left',offset:-17,demands:{
   education:{date:'10월24일',text:'등록금 인하·교육 투자 확대 요구',scope:'18일 개발 특혜 논란 뒤,24일에도 확인된 교육 요구.',scene:'country-tirana',source:'NISX20261025_0003839845'}
  }},
  {city:'athens',country:'Greece',name:'그리스',side:'right',offset:-10,demands:{
   education:{date:'10월21일',text:'악화된 교육 여건에 항의',scope:'20일 텐트 농성 사진과21일 학생 시위는 별도 기록.',scene:'country-athens',source:'NISX20261023_0003838580'},
   housing:{date:'10월20일',text:'비싼 집세에 항의하며 학생 주택 요구',scope:'신타그마 광장에 텐트를 설치한 학생들.',scene:'country-athens',source:'NISX20261023_0003838580'},
   living:{date:'10월21일',text:'생활비 부담에 항의한 학생들',scope:'21일 아테네 등의 시위. 20일 텐트 농성과 구분.',scene:'country-athens',source:'NISX20261023_0003838580'}
  }},
  {city:'madrid',country:'Spain',name:'스페인',side:'right',offset:-6,demands:{
   housing:{date:'10월17일',text:'세입자 보호 법률 강화 요구',scope:'푸에르타델솔 광장에서 텐트 농성에 나선 참가자들.',scene:'country-madrid',source:'NISX20261023_0003838663'}
  }},
  {city:'lisbon',country:'Portugal',name:'포르투갈',side:'left',offset:2,demands:{
   housing:{date:'11월14일',text:'임대료 인상 제한·퇴거 보호·공공주택 확대',scope:'리스본 등30여 도시의 항의. 지도 점은 리스본.',scene:'country-lisbon',source:'NISX20261116_0003869075'}
  }},
  {city:'copenhagen',country:'Denmark',name:'덴마크',side:'right',offset:6,demands:{
   education:{date:'11월4일',text:'학생수당 삭감안에 반대',scope:'부모 소득에 따라 수당을 줄이는 정부안에 항의.',scene:'country-copenhagen',source:'NISX20261105_0003856225'}
  }}
 ];
 function matches(topic){return records.filter(r=>r.demands[topic])}
 function choose(topic,city){if(!topics.some(t=>t.id===topic))topic=topics[0].id;return{topic,city:matches(topic).some(r=>r.city===city)?city:topics.find(t=>t.id===topic).initial}}
 function fact(state){const record=records.find(r=>r.city===state.city&&r.demands[state.topic]);return record?{record,...record.demands[state.topic]}:null}
 function viewport(w,h,phone=false){
  if(w>500&&h<540)return{x:6,y:12,width:w*.51,height:h-26};
  if(w<=800||phone){const top=h<650?190:220;return{x:6,y:top,width:w-12,height:Math.max(110,h-top-210)}}
  return{x:w*.43,y:28,width:w*.55,height:h-62};
 }
 function overviewCamera(points,rect){
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  const k=Math.max((x1-x0)/Math.max(80,rect.width-108),(y1-y0)/Math.max(80,rect.height-54));
  return{k,x:(x0+x1)/2-(rect.x+rect.width/2)*k,y:(y0+y1)/2-(rect.y+rect.height/2)*k};
 }
 return{topics,records,matches,choose,fact,viewport,overviewCamera};
})();
if(typeof module!=='undefined')module.exports=demandAtlas;
