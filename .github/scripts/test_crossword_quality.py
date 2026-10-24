"""Offline regressions for crossword candidate quality and board integrity."""
import importlib.util
import json
from pathlib import Path
import unittest
import tempfile
from unittest.mock import patch

SCRIPT = Path(__file__).with_name("update_crossword.py")
SPEC = importlib.util.spec_from_file_location("crossword", SCRIPT)
crossword = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(crossword)


class CrosswordQualityTests(unittest.TestCase):
    def lookup(self, items, total=None):
        payload = {"channel": {"item": items, "total": len(items) if total is None else total}}
        with patch.object(crossword, "WOORIMAL_API_KEY", "offline-test"), patch.object(
            crossword, "request_text", return_value=json.dumps(payload)
        ):
            return crossword.dictionary_definition("장관")

    def test_ambiguous_homonyms_are_not_selected(self):
        self.assertIsNone(self.lookup([
            {"word": "장관", "sense": [{"definition": "훌륭한 광경."}]},
            {"word": "장관", "sense": [{"definition": "행정 각 부의 책임자."}]},
        ]))

    def test_multiple_senses_are_not_selected(self):
        self.assertIsNone(self.lookup([
            {"word": "장관", "sense": [{"definition": "뜻 하나."}, {"definition": "뜻 둘."}]},
        ]))

    def test_single_meaning_is_retained(self):
        self.assertEqual(self.lookup([
            {"word": "장관", "sense": [{"definition": "검증할 단일 뜻."}]},
        ]), "검증할 단일 뜻.")

    def test_truncated_dictionary_results_are_rejected(self):
        self.assertIsNone(self.lookup([
            {"word": "장관", "sense": [{"definition": "뜻 하나."}]},
        ], total=11))

    def test_number_and_latin_fragments_are_not_words(self):
        tokens = crossword.WORD_RE.findall("41만명 3000만원 50대 AI투자 시위와 장관의 발표")
        self.assertEqual(tokens, ["시위와", "장관의", "발표"])

    def test_sparse_candidates_preserve_existing_data_without_blocking_other_updates(self):
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder) / "crossword.json"
            original = json.dumps({"puzzles": [{"words": [{"answer": "낱말"}] * 7}]})
            output.write_text(original, encoding="utf-8")
            with patch.object(crossword, "OUTPUT", output), patch.object(crossword, "feed_articles", return_value=[]):
                crossword.main()
            self.assertEqual(output.read_text(encoding="utf-8"), original)

    def test_sparse_candidates_without_previous_data_still_fail(self):
        with tempfile.TemporaryDirectory() as folder:
            with patch.object(crossword, "OUTPUT", Path(folder) / "absent.json"), patch.object(crossword, "feed_articles", return_value=[]):
                with self.assertRaises(RuntimeError):
                    crossword.main()

    def test_current_board_has_consistent_crossings_and_clues(self):
        payload = json.loads(crossword.OUTPUT.read_text(encoding="utf-8"))
        self.assertEqual(payload["words"], payload["puzzles"][0]["words"])
        for puzzle in payload["puzzles"]:
            self.assertGreaterEqual(len(puzzle["words"]), 7)
            grid = {}
            occupied = []
            for word in puzzle["words"]:
                self.assertNotEqual(word["answer"], "만명")
                if word["answer"] == "자산":
                    self.assertIn("재산", word["definition"])
                if word["answer"] == "자금":
                    self.assertIn("돈", word["definition"])
                self.assertIn(word["answer"], word["title"])
                self.assertNotIn(word["answer"], word["clue"])
                positions = set()
                for i, letter in enumerate(word["answer"]):
                    row = word["row"] + (i if word["direction"] == "down" else 0)
                    col = word["col"] + (i if word["direction"] == "across" else 0)
                    self.assertTrue(0 <= row < puzzle["rows"] and 0 <= col < puzzle["cols"])
                    self.assertEqual(grid.setdefault((row, col), letter), letter)
                    positions.add((row, col))
                occupied.append(positions)
            connected = {0}
            while True:
                reached = connected | {i for i, cells in enumerate(occupied) if any(cells & occupied[j] for j in connected)}
                if reached == connected:
                    break
                connected = reached
            self.assertEqual(len(connected), len(occupied))


if __name__ == "__main__":
    unittest.main()
