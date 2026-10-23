// Educational timing; not measured action geometry or a physical solver.
export const STEPS = [
 ['대기','손끝의 힘이 전달되기 전입니다.','key'],
 ['건반 누름·전달','건반 후단이 올라가고 위펜과 잭이 힘을 전달합니다.','wippen'],
 ['잭 이탈','타현 직전, 잭이 너클 아래에서 빠져나옵니다.','jack'],
 ['타현','해머 펠트가 현을 순간적으로 때립니다.','hammer'],
 ['반발·현 진동','해머는 물러나고 현은 자유롭게 진동합니다.','strings'],
 ['손 뗌·댐퍼','손을 떼면 댐퍼가 내려옵니다. 페달 ON이면 들린 채 유지됩니다.','damper']
];
export const smooth = x => { x=Math.max(0,Math.min(1,x));return x*x*(3-2*x); };
export function timing(hold=300){const release=1150+Math.max(100,Math.min(1800,hold));return {escape:430,strike:620,rebound:800,release,duration:release+650};}
export function sampleAction(ms,hold=300,pedal=false){
 const e=timing(hold),press=smooth((ms-80)/380)*(1-smooth((ms-e.release)/300));
 let hammer=ms<e.strike?smooth((ms-80)/(e.strike-80)):1-.68*smooth((ms-e.strike)/260);
 if(ms>e.release)hammer*=1-smooth((ms-e.release)/300);
 const jack=smooth((ms-e.escape)/130)*(1-smooth((ms-e.release)/280));
 const damper=pedal?1:press;
 const vibration=ms<e.strike?0:Math.exp(-(ms-e.strike)/2400)*(pedal?1:1-smooth((ms-e.release)/300));
 const step=ms<80?0:ms<e.escape?1:ms<e.strike?2:ms<e.rebound?3:ms<e.release?4:5;
 return {key:press,hammer,jack,damper,vibration,step};
}
export function liveAction(note,now,pedal){
 const age=now-note.start, release=now-note.released;
 const key=note.down?smooth(age/30):1-smooth(release/110);
 const hammer=age<28?smooth(age/28):note.down?1-.68*smooth((age-28)/160):(.32*(1-smooth(release/110)));
 return {key,hammer:Math.max(0,hammer),jack:age>18?key:0,damper:pedal?1:key,vibration:age>28?Math.exp(-(age-28)/1500)*(note.down||pedal?1:1-smooth(release/200)):0};
}
