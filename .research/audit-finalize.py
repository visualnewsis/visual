from pathlib import Path
import re,sys
r=Path(sys.argv[1])/'goodeasy'
p=r/'assets/research-other.mjs';s=p.read_text(encoding='utf8').replace('bow.position.z=(phase-.5)*.12;','bow.position.z=-.22+phase*.55;');p.write_text(s,encoding='utf8')
links={
'guitar':('https://openstax.org/books/university-physics-volume-1/pages/16-6-standing-waves-and-resonance','OpenStax · 현의 정상파와 배음'),
'violin':('https://newt.phys.unsw.edu.au/jw/violintro.html','UNSW · 바이올린 음향과 브리지·사운드포스트'),
'watch':('https://shopb2b.eta.ch/en/technicaldocuments/index/pdf/id/1532/','ETA 6497-2 · 기술 자료 (부품 관계 참고)'),
'camera':('https://www.fujifilm-x.com/en-gb/learning-centre/apertures-and-depth-of-field/','FUJIFILM · 조리개와 심도'),
'projector':('https://collection.sciencemuseumgroup.org.uk/objects/co8084613/butchers-empire-cinematograph-model-a-projector-mechanism-for-35mm-film','Science Museum Group · 간헐 이송·셔터 소장품'),
'keyboard':('https://docs.qmk.fm/feature_debounce_type','QMK · 접점 바운스와 디바운스 방식'),
'espresso-machine':('https://www.lamarzocco.com/uk/en/using-espresso-brew-ratios/','La Marzocco · 질량 기준 추출 비율'),
'fishing-reel':('https://fishshop.shimano.com/pages/infinity-loop','SHIMANO · 스풀의 왕복 이동')}
for slug,(url,title) in links.items():
 p=r/slug/'index.html';s=p.read_text(encoding='utf8');a=s.index('id="making"');head=s[:a];tail=s[a:];tail=tail.replace('</ul>',f'<li><a href="{url}">{title} ↗</a></li></ul>',1);p.write_text(head+tail,encoding='utf8')
p=r/'violin/index.html';s=p.read_text(encoding='utf8').replace('붙음 80%·미끄러짐 20%는 설명용 가정입니다.','접촉점의 붙음·복귀를 가상 변위로 표현했습니다. 현 전체의 헬름홀츠 파동 해석은 아니며, 붙음 80%·미끄러짐 20%는 설명용 가정입니다.');p.write_text(s,encoding='utf8')
for p in (r/'assets').rglob('*'):
 if p.suffix not in ['.js','.mjs']:continue
 s=p.read_text(encoding='utf8');s=s.replace('20261024-r7','20261024-r8')
 s=s.replace("from './mechanism-checks.mjs'","from './mechanism-checks.mjs?v=20261024-r8'")
 p.write_text(s,encoding='utf8')
for slug in ['piano','guitar','fishing-reel','camera','watch','violin','projector','keyboard','espresso-machine']:
 p=r/slug/'index.html';s=p.read_text(encoding='utf8').replace('20261024-r7','20261024-r8');p.write_text(s,encoding='utf8')
p=r/'piano/observation.js';s=p.read_text(encoding='utf8').replace("import('./scene.js')","import('./scene.js?v=20261024-audit1')");p.write_text(s,encoding='utf8')
p=r/'piano/index.html';s=p.read_text(encoding='utf8').replace('observation.js?v=20261024-2','observation.js?v=20261024-audit1');p.write_text(s,encoding='utf8')
print('Source links and cache versions updated; no internal audit in service pages')
