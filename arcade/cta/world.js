// Spatial study only. Replace dimensions and stories after field documentation.
export const WORLD = {
  title: 'Grand Tour Around', subtitle: '충무로',
  spawn: { x: 0, z: 16 }, bounds: 35,
  walkArea: { minZ:-37,maxZ:20,plazaStart:-24,alleyHalfWidth:2.15,plazaHalfWidth:18 },
  buildings: [
    [-6,9,7,9.6,12,'#785247'],[6,9,7,8.2,12,'#a29d8e'],
    [-6,-5,7,7.2,12,'#959083'],[6,-5,7,10.4,12,'#77796e']
  ],
  discoveries: [
    { id:'alley', x:0,z:9,radius:2.5,weight:2,kind:'sign',label:'글자가 켜지는 골목',sign:'인쇄 · 제본',text:'비어 있던 간판에 글자가 들어옵니다. 골목이 첫 번째 표정을 얻었습니다.' },
    { id:'print', x:-1.4,z:1,radius:2.1,weight:3,kind:'sound',label:'작업실의 소리',sign:'작업 중',text:'문 너머 기계가 돌아가기 시작합니다. 소리를 켜면 작업실의 리듬을 들을 수 있습니다.' },
    { id:'person', x:1.4,z:-6,radius:2.3,weight:2,kind:'person',label:'불이 켜진 가게',sign:'잠시 쉬어가는 곳',text:'닫힌 듯했던 가게 앞에 사람이 나타났습니다.',dialogue:'“여기 앉아서 잠깐 쉬어도 돼요.”\n※ 상호작용 시험용 가상 인물·대사입니다.' },
    { id:'passage', x:0,z:-13,radius:2.5,weight:3,kind:'gate',label:'골목 너머',sign:'열린 마당',text:'가로막힌 통로가 열립니다. 빈 마당에 빛과 의자가 들어옵니다.' }
  ],
  copy: { limit:'10% · 이번 테스트의 끝', complete:'작은 골목이 열렸습니다. 계속 걸어도 좋습니다.', notice:'충무로 인쇄골목 공개 사진을 참고한 외관 연구입니다. 배치는 압축 재구성했으며 인물·대사·소리는 시연용입니다.' }
};
