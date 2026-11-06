"""One-time repair: retain source articles, review meanings, replace numeric fragment."""
import importlib.util
import json
from pathlib import Path

root = Path(__file__).parent / "arcade-quality-20261025"
spec = importlib.util.spec_from_file_location("crossword", root / ".github/scripts/update_crossword.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
path = root / "arcade/words/data/crossword.json"
payload = json.loads(path.read_text(encoding="utf-8"))
reviewed = []
for word in payload["puzzles"][0]["words"]:
    if word["answer"] == "만명":
        continue
    candidate = {k: v for k, v in word.items() if k not in {"row", "col", "direction", "number"}}
    if candidate["answer"] == "자산":
        candidate["definition"] = "개인이나 단체가 소유한, 경제적 가치가 있는 재산."
        candidate["definitionSource"] = "기사 문맥 검수"
    elif candidate["answer"] == "자금":
        candidate["definition"] = "사업이나 활동에 필요한 돈."
        candidate["definitionSource"] = "기사 문맥 검수"
    candidate["score"] = 50
    reviewed.append(candidate)
title = "최장 1㎞ 방수 가능…서울시, 고성능 물탱크차 도입"
reviewed.append({
    "answer": "도입", "definition": "새로운 기술·제도·장비 등을 들여와 쓰기 시작하는 일.",
    "definitionSource": "기사 문맥 검수", "clue": title.replace("도입", "□□"),
    "title": title, "url": "https://www.newsis.com/view/NISX20260816_0003750899", "category": "사회", "score": 50,
})
board = module.layout(reviewed, size=17)
if not board or len(board["words"]) < 7:
    raise RuntimeError("Reviewed candidates could not form a complete board")
payload["puzzles"] = [board]
payload.update(board)
payload["reviewedAt"] = "2026-10-25"
path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("Reviewed crossword:", ", ".join(word["answer"] for word in board["words"]))
