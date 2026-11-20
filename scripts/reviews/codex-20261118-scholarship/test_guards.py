"""Negative regression tests for the private review assembly guards.

Run: python -m unittest scripts/reviews/codex-20261118-scholarship/test_guards.py
Synthetic data only; no question content is read.
"""
import copy
import importlib.util
import subprocess
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("prepare_review", HERE / "prepare-review.py")
review = importlib.util.module_from_spec(spec)
spec.loader.exec_module(review)


def git(*args, cwd):
    subprocess.run(["git", *args], cwd=cwd, check=True, capture_output=True, text=True)


def unit_of(count=3):
    return [{"question": {"id": f"synthetic-{n}", "prompt": f"Synthetic prompt {n}", "options": [{"id": "a", "text": "x"}],
                          "answerKey": {"optionId": "a"}, "explanation": "private"}} for n in range(1, count + 1)]


def replies_for(unit):
    return [{"n": n, "id": i["question"]["id"], "packetHash": review.packet_hash(i["question"]), "choice": "a"}
            for n, i in enumerate(unit, 1)]


class OutputGuard(unittest.TestCase):
    def test_rejects_this_checkout_and_other_worktrees(self):
        with tempfile.TemporaryDirectory() as scratch:
            other = Path(scratch) / "other-repo"
            other.mkdir()
            git("init", "-q", cwd=other)
            git("-c", "user.name=t", "-c", "user.email=t@example.invalid", "commit", "-q", "--allow-empty", "-m", "x", cwd=other)
            linked = Path(scratch) / "linked-worktree"
            git("worktree", "add", "-q", str(linked), "-b", "linked", cwd=other)
            self.assertTrue(review.inside_repository(review.ROOT / "private"))
            self.assertTrue(review.inside_repository(other / "private"))
            self.assertTrue(review.inside_repository(linked / "private" / "deeper"))

    def test_rejects_a_sibling_worktree_of_this_repository(self):
        listing = subprocess.run(["git", "-C", str(review.ROOT), "worktree", "list", "--porcelain"],
                                 check=True, capture_output=True, text=True).stdout
        siblings = [Path(line[9:]) for line in listing.splitlines() if line.startswith("worktree ")]
        for tree in siblings:
            self.assertTrue(review.inside_repository(tree / "private"))

    def test_accepts_a_plain_private_directory(self):
        with tempfile.TemporaryDirectory() as scratch:
            self.assertFalse(review.inside_repository(Path(scratch) / "private-review"))


class BlindReviewBinding(unittest.TestCase):
    def test_accepts_replies_bound_to_the_exact_questions(self):
        unit = unit_of()
        self.assertEqual(set(review.bind_replies(unit, replies_for(unit), 1)), {"synthetic-1", "synthetic-2", "synthetic-3"})

    def test_rejects_reordered_replies(self):
        unit = unit_of()
        replies = replies_for(unit)
        replies[0], replies[1] = replies[1], replies[0]
        for n, reply in enumerate(replies, 1):
            reply["n"] = n
        with self.assertRaisesRegex(ValueError, "not bound"):
            review.bind_replies(unit, replies, 1)

    def test_rejects_replies_without_an_id_or_hash(self):
        unit = unit_of()
        for field in ("id", "packetHash"):
            replies = replies_for(unit)
            del replies[0][field]
            with self.assertRaises(ValueError):
                review.bind_replies(unit, replies, 1)

    def test_rejects_a_reply_made_against_an_edited_question(self):
        unit = unit_of()
        replies = replies_for(unit)
        edited = copy.deepcopy(unit)
        edited[1]["question"]["prompt"] += " (edited after review)"
        with self.assertRaisesRegex(ValueError, "exact question"):
            review.bind_replies(edited, replies, 1)

    def test_answer_material_does_not_change_the_packet_hash(self):
        question = unit_of(1)[0]["question"]
        before = review.packet_hash(question)
        question["answerKey"] = {"optionId": "b"}
        question["explanation"] = "changed"
        self.assertEqual(before, review.packet_hash(question))

    def test_rejects_duplicate_question_ids(self):
        unit = unit_of(2)
        unit[1]["question"]["id"] = unit[0]["question"]["id"]
        with self.assertRaises(ValueError):
            review.bind_replies(unit, replies_for(unit), 1)


if __name__ == "__main__":
    unittest.main()
