/* A comparison of fictional applications under one published admission guide. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AdmissionGuide=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const school='인천한빛초등학교병설유치원';
const scenarios=Object.freeze({none:{label:'다른 우선요건 없음',rule:null},children:{label:'두 가정 모두 자녀가 2명 이상',rule:'다자녀가정'},sibling:{label:'두 가정 모두 이 유치원에 다닐 형제자매가 있음',rule:'입학 뒤 함께 재원할 형제자매'},lowIncome:{label:'두 가정 모두 법정저소득층 자격에 해당',rule:'법정저소득층'}});
function evaluate(input){
 if(!input||typeof input.multicultural!=='boolean'||typeof input.working!=='boolean'||!Object.hasOwn(scenarios,input.scenario))throw new TypeError('구성 예시와 공통조건을 확인하세요.');
 const matches=[];if(input.multicultural)matches.push('다문화가정 구성 예시');if(scenarios[input.scenario].rule)matches.push(scenarios[input.scenario].rule);
 const group=input.scenario==='lowIncome'?'lowIncome':matches.length?'other':'general';
 return Object.freeze({group,tier:group==='lowIncome'?'1순위':group==='other'?'기타 4순위 이하':null,eligible:group!=='general',title:group==='lowIncome'?'우선모집 지원 대상':group==='other'?'우선모집 지원 대상':'이 조건만으로는\n우선모집 대상 아님',matches:Object.freeze(matches),working:input.working,scenario:input.scenario,page:group==='lowIncome'?5:group==='other'?6:3});
}
return Object.freeze({school,year:2027,scenarios,evaluate});
});
