from pathlib import Path
import re,json
root=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop')
p=root/'goodeasy/index.html';s=p.read_text(encoding='utf8')
s=s.replace('피아노부터 시계까지, 직접 만져보며 작동 원리를 살펴보는 아홉 가지 실험.','직접 건반을 연주하고, 피아노 안에서 한 음이 만들어지는 과정을 살펴보세요.')
s=s.replace('직접 만져보며 사물의 안쪽을 살펴보는 아홉 가지 실험.','건반을 직접 연주하며 피아노의 안쪽을 살펴보세요.')
s=s.replace('직접 만져보며 사물의 작동 원리를 살펴보는 아홉 가지 실험.','피아노를 직접 연주하고 해머·현·댐퍼의 작동을 살펴보는 인터랙티브 시리즈.')
s=re.sub(r'  <script type="module" src="assets/landing-models[^\n]+\n','',s)
s=s.replace('다른 사물도 만져보기','첫 번째 이야기')
s=s.replace('건반을 누르고, 줄을 튕기고, 태엽을 감아보세요.<br>방금 손끝에서 시작한 움직임을 안쪽까지 따라갑니다.','건반 하나를 눌러보세요.<br>방금 손끝에서 시작한 움직임을 안쪽까지 따라갑니다.')
start=s.index('      <div class="series-heading">')
end=s.index('\n    </section>',start)
s=s[:start]+'''      <div class="series-heading"><span>첫 번째 이야기</span><span>01 / PIANO</span></div>
      <article class="piano-story">
        <a class="piano-story-image" href="piano/" aria-label="피아노 본편 보기"><img src="assets/landing-piano.png" width="1672" height="941" alt="그랜드피아노 내부를 표현한 AI 생성 일러스트" loading="lazy"><span>PIANO / 01</span></a>
        <div class="piano-story-copy"><p class="eyebrow">건반 하나의 안쪽</p><h3>피아노는 어떻게<br>소리가 날까요?</h3><p>건반 아래에서 레버가 움직이고, 해머가 현을 때립니다.<br>손을 떼면 댐퍼가 내려와 진동을 줄입니다.</p><p>직접 연주한 음을 느리게 다시 보고,<br>해머와 현 사이의 움직임을 살펴보세요.</p><a class="story-link" href="piano/">피아노 직접 만져보기 <span aria-hidden="true">↗</span></a></div>
      </article>'''+s[end:]
s=s.replace(' · 각 편 모형: 실제 체험의 3D 모형','')
p.write_text(s,encoding='utf8')
p=root/'goodeasy/assets/landing.css';s=p.read_text(encoding='utf8')
start=s.index('.episode-grid{');end=s.index('.footer{',start)
s=s[:start]+'''.piano-story{display:grid;grid-template-columns:1.35fr 1fr;gap:7%;align-items:center}.piano-story-image{position:relative;display:block;overflow:hidden;aspect-ratio:1.45;background:#161914}.piano-story-image img{display:block;width:100%;height:100%;object-fit:cover;object-position:70% 50%;transition:transform .4s}.piano-story-image:hover img{transform:scale(1.025)}.piano-story-image>span{position:absolute;bottom:22px;left:22px;font-size:11px;letter-spacing:.12em;color:#efdfc7}.piano-story-copy .eyebrow{color:var(--gold);font-size:11px}.piano-story h3{font-size:clamp(27px,3vw,43px);line-height:1.6;letter-spacing:-.05em;margin:20px 0}.piano-story-copy>p:not(.eyebrow){font-size:13px;color:var(--muted);line-height:2}.story-link{display:flex;justify-content:space-between;align-items:center;gap:30px;margin-top:30px;padding:17px 0;border-bottom:1px solid #cfba9377;font-size:13px;color:#e9d7b5}.story-link>span{font-size:23px}'''+s[end:]
s=s.replace('.episode-grid{grid-template-columns:repeat(2,minmax(0,1fr))}','.piano-story{gap:5%}.piano-story-copy>p:not(.eyebrow){font-size:12px}')
s=s.replace('.episode-grid{grid-template-columns:1fr;gap:16px}', '.piano-story{grid-template-columns:1fr;gap:20px}.piano-story-image{aspect-ratio:1.5}.piano-story h3{font-size:29px;margin:14px 0}.piano-story-copy>p:not(.eyebrow){font-size:12px}')
p.write_text(s,encoding='utf8')
print('Only piano is visible: other episode links, preview labels, and model loader removed.')
