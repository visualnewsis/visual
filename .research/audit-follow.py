exec(open(__file__.replace('audit-follow.py','audit-fix.py'),encoding='utf8').read().split("(r/'assets/mechanism-checks.mjs')")[0])
change('assets/research-other.mjs',"'狭い'.replace('狭い','좁은 틈이 이동하는 고속 노출')","'좁은 틈이 이동하는 고속 노출'")
change('assets/quality-machines.mjs',"'GOODEASY / 16'","'GOODEASY'")
change('assets/quality-machines.mjs',"*(i?-1:1)","*1")
change('piano/scene.js','a.update(s?liveAction(s,time,snapshot.pedal):m,0,time);','a.update(s?liveAction(s,time,snapshot.pedal):{key:0,hammer:0,jack:0,damper:snapshot.pedal?1:0,vibration:0},0,time);')
# Declarations state which side is E / treble and keep bassbar aligned with strings.
change('assets/research-other.mjs','const post=cyl(group,.025,.23,M.wood,.18,-.01,.145);box(group,.8,.035,.05,M.darkWood,-.05,.07,-.145);','const post=cyl(group,.025,.23,M.wood,.27,-.01,.145);const bassbar=box(group,.8,.035,.05,M.darkWood,-.05,.07,-.145);const bridgeY=m.parts.bridge.position.y;bassbar.userData.restY=bassbar.position.y;')
change('assets/research-other.mjs','back.position.y=by-e*.4;post.scale.y=1;','back.position.y=by-e*.4;post.scale.y=1;bassbar.position.y=bassbar.userData.restY+e*.65;m.parts.bridge.position.y=bridgeY+e*.65;')
# Keep first camera iris outer rim fixed; rebuild the blades around the shrinking clear opening.
change('assets/quality-machines.mjs','const iris=part(lens,\'aperture\');for(let i=0;i<8;i++)',"const iris=part(lens,'aperture');let previousAperture=0;for(let i=0;i<8;i++)")
change('assets/quality-machines.mjs','iris.scale.setScalar(2.8/(s.aperture||2.8));', '''const aperture=s.aperture||2.8;if(aperture!==previousAperture){previousAperture=aperture;while(iris.children.length){const o=iris.children[0];o.geometry.dispose();iris.remove(o);}const inner=.56*2.8/aperture;for(let i=0;i<8;i++){const a=i/8*TAU,b=a+TAU/8+.008,shape=new T.Shape();shape.absarc(0,0,.83,a,b,false);shape.lineTo(Math.cos(b)*inner,Math.sin(b)*inner);shape.absarc(0,0,inner,b,a,true);shape.closePath();mesh(iris,new T.ShapeGeometry(shape),M.black,0,0,1.88+i*.0005);}}''')
# Per-chapter precision notes describe the object, not implementation recipes.
replacements={
'guitar': [('기본 진동수는 기본음의','기본 진동수는 기본음의'),('이상적인 현의 관계입니다.','이상적인 현의 관계입니다.')],
'fishing-reel':[('회전을 왕복 이동으로 바꾸는 구조를 분리했습니다.','크랭크 핀과 슬롯을 이용해 회전을 왕복 이동으로 바꾸는 예시입니다.'),('교차 홈·웜과 팔로어의 개념도입니다. 특정 릴의 실제 홈 경로나 왕복 캠을 재현한 것은 아닙니다.','이 실험은 크랭크·슬롯의 운동 관계를 보여줍니다. 특정 릴의 웜샤프트·홈 경로나 기어 배치를 재현하지 않습니다.')],
'violin':[('마찰력과 현의 실제 파동을 계산하지 않습니다.','마찰력과 현의 실제 파동을 계산하지 않습니다.'),('브리지 한쪽 발 아래 사운드포스트','브리지 E현 쪽 발 가까이의 사운드포스트')],
'keyboard':[('가상 바운스 패턴과 단순 안정화 방식입니다.','25ms 창 안의 가상 바운스 패턴과 단순 안정화 방식입니다. CHERRY MX2A RED의 바운스 사양(통상 1ms 미만)을 재현한 값은 아닙니다.')],
'espresso-machine':[('실제 머신의 가열 과정이나 커피의 맛·크레마·추출 성능을 예측하지 않습니다.','실제 머신의 가열 과정이나 커피의 맛·크레마·추출 성능을 예측하지 않습니다. 9bar는 비교 기준이며 모든 추출의 정답은 아닙니다. mL와 g는 같은 값으로 취급하지 않습니다.')],
'watch':[('분해 간격은 관찰을 위해 늘렸고 실제 제조 순서·특정 칼리버의 부품 배치를 뜻하지 않습니다.','분해 간격과 층 배치는 관찰용이며 실제 분해·조립 순서나 특정 칼리버의 부품 배치를 뜻하지 않습니다. 전체 모형의 바늘과 윤열 속도는 각각의 설명을 위한 것으로, 하나의 검증된 실제 기어열로 연결된 것은 아닙니다.')],
'camera':[('고정점 사이의 마디','고정점 사이의 마디')],
'projector':[('필름 경로와 회전은 개념 표현입니다.','필름 경로와 회전은 개념 표현입니다.')],
'piano':[]}
for slug,pairs in replacements.items():
 p=r/slug/'index.html';s=p.read_text(encoding='utf8')
 for a,b in pairs:
  if a in s:s=s.replace(a,b)
 # No new development report in public footers.
 p.write_text(s,encoding='utf8')
print('Finished follow-up corrections')
