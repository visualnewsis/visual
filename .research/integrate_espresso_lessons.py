from pathlib import Path
import re
r=Path(r'C:\Users\user\.codex\worktrees\piano-finish\editshop\goodeasy')
p=r/'assets/espresso-lessons.mjs';s=p.read_text(encoding='utf-8')
s=s.replace(" const route=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v)),false,'centripetal');\n const path=tube(group,points,.027,water);path.userData.noFit=true;", " for(let i=0;i<points.length-1;i++){const pipe=rod(group,points[i],points[i+1],.027,water);pipe.userData.noFit=true;}")
p.write_text(s,encoding='utf-8')
p=r/'assets/research-other.mjs';s=p.read_text(encoding='utf-8')
s="import {buildCoffeeComparison,buildCoffeeWaterPath} from './espresso-lessons.mjs?v=20261024-editorial1';\n"+s
s=s.replace('puck:buildPuck','puck:buildCoffeeComparison').replace("'water-path':buildWaterPath","'water-path':buildCoffeeWaterPath")
p.write_text(s,encoding='utf-8')
p=r/'assets/research.mjs';s=p.read_text(encoding='utf-8')
s=s.replace('v.ctx.drawImage(renderer.domElement,0,0,W,H);v.dirty=false;', '''v.ctx.drawImage(renderer.domElement,0,0,W,H);
 if(v.model.annotations)for(const [i,a] of v.model.annotations.entries()){
  const p=new T.Vector3(...a.point).applyMatrix4(v.root.matrixWorld).project(v.camera),x=(p.x+1)*W/2,y=(1-p.y)*H/2;
  v.ctx.beginPath();v.ctx.arc(x,y,10*dpr,0,Math.PI*2);v.ctx.fillStyle=v.state.activePart===i?'#d7be91':'#152c2e';v.ctx.fill();v.ctx.strokeStyle='#91bbc0';v.ctx.stroke();v.ctx.fillStyle=v.state.activePart===i?'#152c2e':'#e3efed';v.ctx.font=`${11*dpr}px sans-serif`;v.ctx.textAlign='center';v.ctx.textBaseline='middle';v.ctx.fillText(i+1,x,y);
 }
 if(v.id==='puck'){const c=v.model.compare(v.state);for(const side of ['left','right']){const out=v.card.querySelector(`[data-compare="${side}"]`);if(out)out.textContent=c[side];const bar=v.card.querySelector(`[data-bar="${side}"]`);if(bar)bar.style.width=Math.min(100,c[side]/1.7)+'%';}const out=v.card.querySelector('[data-selected-grind]');if(out)out.textContent=c.grind;const note=v.card.querySelector('[data-compare-note]');if(note)note.textContent=c.channel?'右側の隙間'.replace('右側の隙間','오른쪽 한쪽 틈으로 물길이 몰립니다. 총유량 변화는 계산하지 않습니다.'):`같은 압력 ${c.pressure}bar · ${c.right<c.left?'오른쪽이 더 느리게 흐릅니다.':c.right===c.left?'분쇄도가 같아 흐름도 같습니다.':'오른쪽이 더 빠르게 흐릅니다.'}`;}
 if(v.id==='water-path')for(const b of v.card.querySelectorAll('[data-water-stage]'))b.setAttribute('aria-pressed',String(Number(b.dataset.waterStage)===v.state.activePart));
 syncPlay(v);v.dirty=false;''')
s=s.replace("case 'play':if(v.id==='assembly'", "case 'play':if(v.id==='water-path'&&s.phase>=1)s.phase=0;if(v.id==='assembly'")
needle=" for(const b of card.querySelectorAll('[data-do]'))"
extra=""" for(const b of card.querySelectorAll('[data-preset],[data-water-stage]'))b.addEventListener('click',()=>{const values=b.dataset.waterStage!==undefined?{phase:(Number(b.dataset.waterStage)+.5)/5}:{grind:Number(b.dataset.preset),pressure:9,channel:0};for(const [key,value] of Object.entries(values)){v.state[key]=value;const input=card.querySelector(`[data-param="${key}"]`);if(input){input.value=value;const out=input.closest('label')?.querySelector('output');if(out)out.textContent=value;}}v.state.running=false;v.animation=null;v.dirty=true;syncPlay(v);wake();});
"""
assert needle in s;s=s.replace(needle,extra+needle)
s=s.replace("'3D 실험 · 회전하려면 시점 조작을 켜세요'","'3D 실험 · 회전하려면 돌려서 보기를 켜세요'")
p.write_text(s,encoding='utf-8')
p=r/'espresso-machine/index.html';s=p.read_text(encoding='utf-8')
s=s.replace('data-param="grind" min="10" max="90" step="1" value="50"','data-param="grind" min="10" max="90" step="1" value="70"').replace('분쇄 저항 · 높을수록 가늘게','오른쪽 분쇄도 · 높을수록 가늘게')
s=s.replace('>균일한 저항</option>','>고르게 담긴 커피</option>').replace('>한쪽에 큰 틈</option>','>오른쪽에 큰 틈</option>')
s=s.replace('<div class="research-controls"><label>오른쪽 분쇄도', '<div class="coffee-presets" role="group" aria-label="분쇄도 비교 조건"><button type="button" data-preset="30">같은 굵기로 맞추기</button><button type="button" data-preset="70">오른쪽만 가늘게</button></div><div class="research-controls"><label>오른쪽 분쇄도')
compare='''<div class="coffee-comparison" aria-label="같은 시간 동안 통과하는 상대적인 물의 양"><div><span>① 왼쪽 · 굵게 30</span><strong data-compare="left">100</strong><div class="coffee-bar"><i data-bar="left"></i></div></div><div><span>② 오른쪽 · 분쇄도 <b data-selected-grind>70</b></span><strong data-compare="right">55</strong><div class="coffee-bar"><i data-bar="right"></i></div></div><p data-compare-note role="status">같은 압력 9bar · 오른쪽이 더 느리게 흐릅니다.</p><small>같은 시간에 통과하는 양의 비교값 · 굵게·9bar를 100으로 둡니다. 실제 측정값이 아닙니다.</small></div>'''
s=s.replace('<p class="research-caption">흐름은 압력뿐 아니라 커피층의 저항과 물길에도 영향을 받습니다.</p>',compare+'<p class="research-caption">압력이 같아도 커피층의 저항이 크면 물은 더 천천히 흐릅니다.</p>')
legend='<div class="water-legend" role="group" aria-label="물길의 부품 선택">'+''.join(f'<button type="button" data-water-stage="{i}" aria-pressed="false">{i+1} {name}</button>' for i,name in enumerate(['물탱크','펌프','보일러','커피층','잔']))+'</div>'
s=s.replace('<p class="research-look"><span>보는 곳</span>① 물탱크 → ② 펌프 → ③ 보일러 → ④ 커피층 → ⑤ 잔</p>','<p class="research-look"><span>보는 곳</span>파란 물길 위의 번호를 아래 부품 이름과 맞춰보세요.</p>'+legend)
s=s.replace('흐름은 압력뿐 아니라 커피층의 저항과 물길에도 영향을 받습니다.','압력이 같아도 커피층의 저항이 크면 물은 더 천천히 흐릅니다.')
s=s.replace('<p class="research-limits">비교 유량은 임의 단위입니다.', '<p class="research-limits">입자와 통로의 크기는 차이를 보이기 위해 과장했습니다. 두 잔의 높이는 같은 시간 동안 흐른 상대량입니다. 비교 유량은 임의 단위입니다.')
s=s.replace('<p id="feedback"','<p class="brew-tip">분쇄도를 가늘게 바꿔보세요. 같은 압력에서도 잔이 차는 속도가 달라집니다.</p><p id="feedback"')
p.write_text(s,encoding='utf-8')
p=r/'assets/lab.js';s=p.read_text(encoding='utf-8')
s=s.replace("if(kind==='espresso-machine')say(`${state.locked?'포터필터 장착':'포터필터를 먼저 끼우세요.'} · ${state.brewing?'추출 중':'정지'} · ${state.volume.toFixed(1)}mL`);", """if(kind==='espresso-machine'){
  $('action').disabled=!state.locked||state.volume>=40;$('action').textContent=state.brewing?'추출 멈추기':state.volume>=40?'잔을 비워주세요':'추출하기';$('action').setAttribute('aria-pressed',String(state.brewing));
  say(!state.locked?'포터필터 끼우기를 눌러 손잡이를 장착하세요.':`${state.brewing?'추출 중':state.volume>=40?'잔이 찼습니다. 잔을 비우면 다시 내릴 수 있습니다.':'추출 버튼을 눌러보세요.'} · ${state.volume.toFixed(1)}mL · ${state.pressure}bar`);
 }""")
p.write_text(s,encoding='utf-8')
css='''
.research-look{font-size:12px;line-height:1.9;color:#b7c7c0;max-width:760px;margin:22px 0 0}.research-look span{display:inline-block;margin-right:14px;font-size:10px;color:#d4b987}.research-scope{margin:20px 0;color:#8faaa0;font-size:11px;line-height:1.8}.research-scope summary{cursor:pointer;min-height:35px;padding:8px 0}.research-scope .research-limits{margin-top:8px}.coffee-presets,.water-legend{display:flex;gap:10px;flex-wrap:wrap;margin:20px 0}.coffee-presets button,.water-legend button{font:inherit;font-size:11px;padding:11px 16px;min-height:44px;border:1px solid #657a6b80;border-radius:24px;background:#182622;color:#d2dfd5}.water-legend button[aria-pressed=true]{color:#142d31;background:#a2c6c7}.coffee-comparison{max-width:760px;border-block:1px solid #52665c66;padding:22px 0;display:grid;grid-template-columns:1fr 1fr;gap:18px 28px}.coffee-comparison>div{min-width:0}.coffee-comparison span{display:block;font-size:11px;line-height:1.8;color:#a7b8ae}.coffee-comparison strong{display:block;font-size:30px;font-weight:400;color:#d6bf97;margin:10px 0}.coffee-bar{height:4px;background:#203632}.coffee-bar i{display:block;width:0;height:100%;background:#79b9be}.coffee-comparison p,.coffee-comparison>small{grid-column:1/-1;margin:0;line-height:1.8;font-size:12px;color:#c0cec5}.coffee-comparison>small{font-size:10px;color:#8b9e94}.brew-tip{margin:10px 4vw 0;font-size:12px;color:#b6c3bb;line-height:1.9}.tools button:disabled{opacity:.45;cursor:default}
@media(max-width:700px){.research-look{font-size:11px}.research-look span{display:block;margin:0 0 5px}.coffee-comparison{gap:18px 14px}.coffee-comparison span{font-size:10px}.coffee-comparison p{font-size:11px}.brew-tip{margin:10px 23px 0;font-size:11px}.water-legend{gap:6px}.water-legend button{font-size:10px;padding:10px 12px}.research-chapter[data-research=puck] .research-stage canvas{height:300px}}
'''
p=r/'assets/research.css';p.write_text(p.read_text(encoding='utf-8')+css,encoding='utf-8')
# Version the shared ES module graph together to avoid duplicate Three.js copies.
for p in list((r/'assets').rglob('*.mjs'))+list((r/'assets').rglob('*.js'))+list(r.glob('*/index.html')):
 s=p.read_text(encoding='utf-8');s=s.replace('20261024-r9','20261024-editorial1').replace('20261024-layout1','20261024-editorial1')
 p.write_text(s,encoding='utf-8')
print('Connected water-path labels, side-by-side coffee comparison, presets, and status controls.')
