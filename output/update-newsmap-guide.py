from pathlib import Path
p=Path(r'C:/Users/user/.codex/worktrees/newsmap-review/editshop/newsmap/index.html')
s=p.read_text(encoding='utf-8')
s=s.replace('<strong>기사에서 확인된 곳까지만.</strong>동네가 확인된 기사는 구·시에서도 보입니다. 구까지만 확인된 기사는 특정 동네에 나타나지 않습니다. 법정동·통칭과 행정동은 임의로 같게 취급하지 않습니다.','<strong>동네뉴스와 전체뉴스를 골라보세요.</strong>동네뉴스는 지역의 생활·현장 소식, 전체뉴스는 국내 뉴스를 관련 장소에서 보여줍니다. 국제뉴스는 제외합니다. 구까지만 확인된 기사를 특정 동네로 추정하지 않습니다.')
s=s.replace('<strong>새 소식이 있는 지역에서 파동이 두 번 퍼집니다.</strong>첫 방문은 최근 24시간, 다음 방문은 마지막 방문 이후 발행된 기사가 기준입니다. 방문 기록은 이 브라우저에 저장합니다. 파동이 멈춘 뒤에도 새 기사가 있는 원의 색상은 유지됩니다.','<strong>새로 들어온 기사는 파동으로 알려드려요.</strong>수집한 새 기사는 최대 10분 동안 읽기 전까지 파동을 표시합니다. 기사를 읽거나 시간이 지나면 파동이 멈춥니다. 읽음 기록은 이 브라우저에 저장합니다.')
p.write_text(s,encoding='utf-8')
