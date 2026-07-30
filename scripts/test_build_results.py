import unittest

from build_results import build


class BuildResultsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = build()

    def test_source_and_course_counts(self):
        self.assertEqual(self.data["stats"]["sourceCount"], 10)
        self.assertEqual(self.data["stats"]["officialSourceCount"], 7)
        self.assertEqual(self.data["stats"]["courseCount"], 9)
        self.assertEqual(self.data["stats"]["totalCredits"], 19.5)

    def test_regular_coverage(self):
        self.assertEqual(self.data["stats"]["regularStudentCount"], 116)
        self.assertEqual(self.data["stats"]["officialRegularStudentCount"], 96)
        self.assertEqual(self.data["stats"]["labCoveredRegularCount"], 91)
        self.assertEqual(self.data["stats"]["eligibleOverallCount"], 90)

    def test_ds_lab_csv_is_reconciled(self):
        source = next(item for item in self.data["sources"] if item["id"] == "cse-0613-1238-unofficial")
        self.assertEqual(source["kind"], "csv")
        self.assertEqual(source["rowCount"], 126)
        result = next(item for item in self.data["results"] if item["courseId"] == "cse-0613-1238" and item["registration"] == "2024331001")
        self.assertEqual(result["letterGrade"], "A+")
        self.assertEqual(result["score"], 95.0)

    def test_reviewed_conflict_is_not_resolved(self):
        result = next(
            item
            for item in self.data["results"]
            if item["courseId"] == "eee-0714-1212d" and item["registration"] == "2024331088"
        )
        self.assertEqual(result["status"], "conflicted")
        self.assertIsNone(result["letterGrade"])
        self.assertIsNone(result["gradePoint"])

    def test_session_mismatch_is_visible(self):
        source = next(
            item for item in self.data["sources"] if item["id"] == "eee-0714-1212d-unofficial-odd"
        )
        self.assertEqual(source["printedSession"], "2021-22")
        self.assertTrue(any(issue["type"] == "source-metadata-mismatch" for issue in self.data["issues"]))


if __name__ == "__main__":
    unittest.main()
