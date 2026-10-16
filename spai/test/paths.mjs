// 편집# 016 SPAI: 4장면 × 3선택 = 81경로 전수 검사
// 실행: node spai/test/paths.mjs
import {readFileSync} from "node:fs";
import vm from "node:vm";

const ctx={};
vm.runInNewContext(readFileSync(new URL("../js/scenarios.js",import.meta.url),"utf8"),{globalThis:ctx});
const {scenes,buildReport,allPaths}=ctx.SPAI;

const errors=[];
const fail=msg=>errors.push(msg);
const FORBIDDEN=[/\d+\s*%/,/\d+\s*점(?!심)/,/해고/,/징계/,/위험도/,/생산성 점수/];

// 데이터 필드 점검
const REQUIRED=["id","label","detail","observables","log","classification","reportInterpretation","realContext","flipReveal","verdict","caveat"];
const OBS=["app","activity","idle","visibleDuration"];
const ids=new Set();
for(const s of scenes){
  if(s.choices.length!==3)fail(`${s.id}: 선택지가 3개가 아님`);
  for(const c of s.choices){
    for(const k of REQUIRED)if(c[k]===undefined||c[k]==="")fail(`${c.id}: ${k} 없음`);
    for(const k of OBS)if(!c.observables?.[k])fail(`${c.id}: observables.${k} 없음`);
    if(ids.has(c.id))fail(`중복 id ${c.id}`);ids.add(c.id);
    if(!["work","nonwork","check"].includes(c.classification))fail(`${c.id}: 분류값 오류`);
    if(!["under","over","match"].includes(c.verdict))fail(`${c.id}: 판정값 오류`);
    // 로그는 장면 시각 안에서만 기록한다
    for(const line of c.log){const t=line.slice(0,5);if(t<s.time||t>s.until)fail(`${c.id}: 로그 시각 ${t}가 ${s.time}–${s.until} 밖`)}
    const text=[c.label,c.detail,c.reportInterpretation,c.realContext,c.flipReveal,c.caveat,...c.log].join(" ");
    for(const re of FORBIDDEN)if(re.test(text))fail(`${c.id}: 금지 표현 ${re}`);
  }
  // 같은 장면 안에 비업무 선택지가 정직하게 남아 있는지(14:30)
}
const personal=scenes.find(s=>s.id==="s3").choices.find(c=>c.id==="s3-personal");
if(personal.verdict!=="match"||!/실제로 개인 영상/.test(personal.realContext))fail("개인 영상 시청을 업무로 합리화함");
// 무입력을 '놀았다'로 단정하지 않는지
for(const s of scenes)for(const c of s.choices)if(/놀았|딴짓했/.test(c.reportInterpretation))fail(`${c.id}: 보고서가 단정 표현 사용`);

// 81경로 전수
const paths=allPaths();
if(paths.length!==81)fail(`경로 수 ${paths.length}`);
const tallySeen=new Set();
let allVictim=0;
const gradeSeen={};
for(const p of paths){
  const r=buildReport(p);
  if(r.rows.length!==4)fail(`${p}: 행 수 ${r.rows.length}`);
  r.rows.forEach((row,i)=>{
    if(row.choice.id!==p[i])fail(`${p}: ${i}행 선택 불일치`);
    if(row.front.time!==row.back.time)fail(`${p}: ${i}행 앞뒤 시각 불일치`);
    if(row.scene.id!==scenes[i].id)fail(`${p}: ${i}행 장면 순서 오류`);
    // 뒷면 맥락은 해당 선택지 자신의 문장에서만 온다
    if(row.back.realContext!==row.choice.realContext)fail(`${p}: ${i}행 맥락 출처 오류`);
  });
  // 고과는 공개된 규칙(의심 항목 수)으로만 매긴다
  const expected=r.flags===0?"A":r.flags===1?"B":r.flags===2?"C":"D";
  if(r.grade!==expected)fail(`${p}: 고과 ${r.grade} ≠ 규칙 ${expected}`);
  gradeSeen[r.grade]=(gradeSeen[r.grade]||0)+1;
  if(r.offTask!==(p.includes("s3-personal")?1:0))fail(`${p}: 실제 쉰 시간 집계 오류`);
  const t=r.tally;
  if(t.under+t.over+t.match!==4)fail(`${p}: 집계 합계 오류`);
  if(t.under===4)allVictim++;
  tallySeen.add(`${t.under}/${t.over}/${t.match}`);
}
if(errors.length){console.error(errors.join("\n"));console.error(`\n실패 ${errors.length}건`);process.exit(1)}
console.log(`81경로 통과 · 결말 집계 유형 ${tallySeen.size}가지 (${[...tallySeen].sort().join(", ")}) · 4건 모두 '놓친 맥락'인 경로 ${allVictim}개 · 고과 분포 ${JSON.stringify(gradeSeen)}`);
