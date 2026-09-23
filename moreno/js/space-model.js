(function(root){'use strict';
// Editorial reconstruction: positions and responses are authored examples, not measurements or predictions.
const duration=8000;
const homeBase=[[95,280],[240,95],[240,215],[240,345],[240,465],[420,165],[420,250],[420,340],[420,465],[605,210],[605,350]];
const awayBase=[[825,280],[690,95],[690,215],[690,345],[690,465],[570,150],[570,280],[570,410],[330,110],[330,280],[330,450]];
const lenses={
 wing:{indices:[5],labels:{5:'측면 선수'},opponents:{follow:{1:'따라붙는 풀백'},hold:{1:'자리를 지키는 풀백'}},time:500,end:4500,kicker:'움직임 01 / 측면이 벌린다',title:'터치라인까지 벌리고,\n풀백 뒤를 넘본다.',copy:'측면 선수가 터치라인을 밟듯 넓게 벌린 뒤, 상대 풀백 바깥으로 계속 올라갑니다.',holdTitle:'끝까지 벌려도\n수비는 나오지 않는다.',holdCopy:'상대 풀백이 자리를 지키자 측면 선수는 더 전진해 보지만, 같은 안쪽 길은 열리지 않습니다.',watch:'측면이 끝까지 넓히자 상대 풀백도 따라 나오는가.',holdWatch:'측면이 끝까지 넓혀도 상대 풀백이 자리를 지키는가.'},
 midfield:{indices:[6],labels:{6:'연결 미드필더'},opponents:{follow:{5:'따라오는 미드필더'},hold:{5:'자리를 지키는 미드필더'}},time:1700,end:6200,kicker:'움직임 02 / 중앙이 잇는다',title:'빈 안쪽으로 들어가,\n수비를 끌고 연결한다.',copy:'연결 미드필더가 측면이 만든 공간으로 전진하고, 상대 미드필더도 뒤따라 움직입니다.',holdTitle:'막힌 안쪽을 확인하고,\n옆으로 방향을 바꾼다.',holdCopy:'연결 미드필더도 멈추지 않고 안쪽을 찌른 뒤, 수비가 버티자 공이 갈 반대편을 향해 움직입니다.',watch:'연결 미드필더를 따라 상대 미드필더도 움직이는가.',holdWatch:'연결 미드필더가 움직여도 상대 미드필더가 자리를 지키는가.'},
 forward:{indices:[9,10],labels:{9:'내려오는 공격수',10:'침투하는 공격수'},opponents:{follow:{2:'따라 나온 센터백',3:'남은 센터백'},hold:{2:'자리를 지키는 센터백',3:'간격을 지키는 센터백'}},time:3000,end:7600,kicker:'움직임 03 / 공격수 둘이 갈라선다',title:'한 명은 내려오고,\n한 명은 뒷공간으로.',copy:'한 공격수는 공을 받으러 내려오고, 다른 공격수는 반대 방향으로 갈라져 센터백 사이를 파고듭니다.',holdTitle:'둘은 엇갈려 움직이며,\n수비 간격을 흔든다.',holdCopy:'길이 바로 열리지 않아도 두 공격수는 짧게 내려오고 비스듬히 움직이며 센터백 사이를 흔듭니다.',watch:'두 공격수가 서로 다른 높이와 방향으로 갈라지는가.',holdWatch:'두 공격수가 엇갈려 움직여도 센터백 간격이 유지되는가.'}
};
const clone=a=>a.map(p=>p.slice());
function build(response){let home=clone(homeBase),away=clone(awayBase);const frames=[];
 const add=(at,own,opp,holder,caption,space=false)=>{home=clone(home);away=clone(away);Object.entries(own).forEach(([i,p])=>home[i]=p);Object.entries(opp).forEach(([i,p])=>away[i]=p);frames.push({at,home,away,holder,caption,space});};
 add(0,{}, {},2,'센터백의 발에서 공격이 시작됩니다.');
 add(1100,{1:[365,105],5:[455,155]}, {8:[360,115]},1,'풀백이 올라가고 측면 선수는 터치라인 쪽으로 움직이기 시작합니다.');
 add(2300,{5:[540,88],6:[465,235]},response==='follow'?{1:[580,100],5:[565,185]}:{1:[682,98],5:[560,175]},5,'측면 선수가 터치라인까지 벌려 공을 받습니다.',response==='follow');
 if(response==='follow'){
 add(3300,{6:[545,205],5:[610,68],9:[615,220],10:[625,335]}, {5:[575,220],1:[600,82]},6,'측면 선수는 풀백 바깥으로 더 올라가고, 연결 미드필더가 열린 안쪽에서 받습니다.',true);
 add(4300,{5:[650,66],9:[610,260],10:[640,315],6:[565,220]}, {1:[625,80],2:[650,247],5:[585,230],6:[575,282]},9,'내려오는 공격수를 센터백이 따라 나옵니다. 다른 공격수는 반대 방향으로 벌어집니다.',true);
 add(5150,{5:[675,72],6:[580,228],9:[610,260],10:[700,190]}, {3:[690,300],2:[650,252],5:[600,238]},6,'공을 다시 내주는 동안 침투하는 공격수가 센터백 사이를 가릅니다.',true);
 add(6200,{10:[750,190],6:[595,230],5:[700,76]}, {3:[720,255],2:[680,240],5:[615,245],0:[820,268]},10,'열린 길로 패스가 들어가 침투한 공격수의 발에 연결됩니다.',true);
 add(7200,{10:[792,210],9:[665,270],6:[610,238]}, {3:[755,246],2:[700,250],0:[820,270]},10,'내려온 공격수는 뒤를 받치고, 침투한 공격수는 짧게 드리블합니다.');
 add(8000,{10:[782,216]}, {},[852,269],'여러 움직임 끝에 슛을 시도합니다. 득점 결과는 설정하지 않았습니다.');
 }else{
 add(3300,{6:[515,228],5:[590,72],9:[595,230],10:[620,338]}, {1:[670,95],2:[680,215],3:[682,340],5:[565,182]},5,'측면 선수가 더 넓게 올라가지만 상대 풀백과 미드필더는 자리를 지킵니다.');
 add(4300,{1:[405,112],5:[620,70],6:[530,240],9:[580,250],10:[645,320]}, {1:[675,98],2:[675,220],3:[680,335],5:[568,192],8:[378,115]},1,'공격수 둘이 엇갈려 움직여도 수비 간격이 유지돼 풀백에게 돌려줍니다.');
 add(5150,{2:[287,220],3:[308,350],4:[366,460],5:[600,80],6:[505,260],9:[600,240],10:[660,295]}, {1:[680,100],2:[675,225],3:[680,330],5:[570,200],9:[351,280]},2,'연결 미드필더가 안쪽을 다시 찌르고 공격수들은 위치를 바꾸지만 길이 막힙니다.');
 add(6200,{7:[460,362],8:[490,457],6:[465,275],5:[575,105],9:[615,255],10:[675,280]}, {2:[680,235],3:[685,325],5:[575,215],6:[555,300],7:[580,405]},7,'선수들은 계속 간격을 바꾸며 중앙을 거쳐 공격 방향을 전환합니다.');
 add(7200,{8:[554,454],4:[395,463],5:[540,130],6:[475,290],9:[630,245],10:[650,315]}, {2:[685,225],3:[682,335],4:[690,465],10:[380,448]},8,'두 공격수는 다시 서로 다른 높이를 잡고, 반대편 측면에서 공을 받습니다.');
 add(8000,{8:[575,442],5:[525,145],6:[485,300],9:[640,250],10:[670,310]}, {2:[680,230],3:[685,330],4:[670,457]},8,'반대쪽에서 전개를 다시 시작합니다. 움직임은 이어가되 닫힌 길을 억지로 반복하지 않습니다.');
 }return frames;}
const clips={follow:build('follow'),hold:build('hold')};
const lerp=(a,b,q)=>a+(b-a)*q;
const foot=(holder,home)=>Array.isArray(holder)?holder.slice():[home[holder][0]+9,home[holder][1]+10];
function sample(response,time){const frames=clips[response]||clips.follow,t=Math.max(0,Math.min(duration,Number(time)||0));let a=frames[0],b=a;
 for(let i=1;i<frames.length;i++){if(t<frames[i].at){b=frames[i];break;}a=frames[i];b=a;}
 const q=a===b?0:(t-a.at)/(b.at-a.at),smooth=q*q*(3-2*q);
 const blend=(one,two)=>one.map((p,i)=>[lerp(p[0],two[i][0],smooth),lerp(p[1],two[i][1],smooth)]);
 const home=blend(a.home,b.home),away=blend(a.away,b.away),from=foot(a.holder,a.home),to=foot(b.holder,b.home);
 const held=typeof a.holder==='number'&&a.holder===b.holder;
 const ball=held?foot(a.holder,home):[lerp(from[0],to[0],q),lerp(from[1],to[1],q)];
 return {time:t,home,away,ball,from,to,passing:!held&&a!==b,space:a.space?1:0,caption:a.caption,step:frames.indexOf(a)};}
const api={duration,lenses,clips,homeBase,awayBase,sample,foot};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.FootballSpace=api;
})(typeof window==='undefined'?globalThis:window);
