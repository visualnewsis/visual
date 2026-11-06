from pathlib import Path
import sys
p=Path(sys.argv[1])/'goodeasy/assets/research-watch.mjs';s=p.read_text(encoding='utf8')
def rep(a,b):
 global s
 assert a in s,a[:60]
 s=s.replace(a,b)
rep("centers=[[-1.1,.3],[-.264,.3],[.506,.3],[.814,-.2335],[1.078,.2238]]", "centers=[[-1.1,.3],[-.264,.3],[.484,.3],[.880,-.3858921198],[1.254,.2618948822]]")
rep("specs=[[64,0,.15],[60,1,.28],[48,2,.41],[40,3,.54],[15,4,.69]]", "specs=[[64,0,.15],[60,1,.28],[64,2,.41],[60,3,.54],[15,4,.69]]")
rep("pinN=[0,12,10,8,8]", "pinN=[0,12,8,8,8]")
rep("const t=s.time||0,a=handAngles(t);for(const k in h)h[k].rotation.y=-a[k];const esc=escapeState(t*2);tr.wheels[4].rotation.y=-esc.angle;tr.wheels[3].rotation.y=esc.angle*8/40;tr.wheels[2].rotation.y=-esc.angle*8/40*8/48;tr.wheels[1].rotation.y=esc.angle*8/40*8/48*10/60;tr.wheels[0].rotation.y=-esc.angle*8/40*8/48*10/60*12/64;", "const t=s.time||0,esc=escapeState(t*3.75),fourthAngle=esc.angle*8/60,a=handAngles(fourthAngle*60/TAU);for(const k in h)h[k].rotation.y=-a[k];tr.wheels[4].rotation.y=esc.angle;tr.wheels[3].rotation.y=-fourthAngle;tr.wheels[2].rotation.y=fourthAngle*8/64;tr.wheels[1].rotation.y=-fourthAngle*8/64*8/60;tr.wheels[0].rotation.y=fourthAngle*8/64*8/60*12/64;")
p.write_text(s,encoding='utf8')
# All bearing openings follow the changed arbor locations.
s=p.read_text(encoding='utf8').replace('[.506,.3','[.484,.3').replace('[.814,-.2335','[.880,-.3858921198').replace('[1.078,.2238','[1.254,.2618948822');p.write_text(s,encoding='utf8')
p=p.parent.parent/'watch/index.html';s=p.read_text(encoding='utf8').replace('전체 모형의 바늘과 윤열 속도는 각각의 설명을 위한 것으로, 하나의 검증된 실제 기어열로 연결된 것은 아닙니다.','윤열은 분침과 초침의 60:1 관계에 맞춘 가상 이 수를 사용합니다. 중앙 초침으로 이어지는 중간 전달부·시각 맞춤 기구와 실제 치형 접촉은 생략했습니다.');p.write_text(s,encoding='utf8')
print('Corrected assembly train to 60:1 centre/fourth ratio and common escapement clock')
