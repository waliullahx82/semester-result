from __future__ import annotations

import argparse
import csv
import json
import re
import shutil
import sys
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import quote

import pdfplumber


ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "data" / "source-config.json"
OUTPUT_PATH = ROOT / "src" / "data" / "results.generated.json"
REPORT_PATH = ROOT / "data" / "validation-report.json"
PUBLIC_SOURCES = ROOT / "public" / "sources"
REGISTRATION_RE = re.compile(r"^\d{10}$")
GRADE_RE = re.compile(r"^(?:A\+|A-|A|B\+|B-|B|C\+|C-|C|F)$")


class ValidationError(RuntimeError):
    pass


@dataclass(frozen=True)
class ExtractedRow:
    registration: str
    name: str | None
    letter_grade: str
    grade_point: float | None
    source_id: str
    course_id: str
    page: int
    score: float | None = None
    max_score: float | None = None
    note: str | None = None


def clean(value: str | None) -> str:
    return " ".join((value or "").replace("\x00", " ").split())


def compact_code(value: str) -> str:
    return re.sub(r"\s+", "", value).upper()


def parse_metadata(text: str) -> dict[str, str | None]:
    normalized = clean(text)

    def capture(pattern: str) -> str | None:
        match = re.search(pattern, normalized, flags=re.IGNORECASE)
        return clean(match.group(1)) if match else None

    return {
        "courseCode": capture(r"Course (?:Number|Code)\s*:\s*([A-Z]{3}\s+\d{4}\s+\d{4}D?)"),
        "courseTitle": capture(r"Course Title\s*:\s*(.+?)(?=\s+(?:Course Credit|Session|Sl\.|Registration|$))"),
        "courseCredit": capture(r"Course Credit\s*:\s*([0-9.]+)"),
        "printedSession": capture(r"Session\s*:\s*([0-9]{4}(?:-[0-9]{2,4})?)"),
        "publishedDate": capture(r"((?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\s+\d{1,2}\s+[A-Za-z]+\s+\d{4})"),
    }


def source_path(source: dict[str, Any]) -> Path:
    configured = ROOT / source.get("relativePath", source["fileName"])
    if configured.exists():
        return configured
    organized = ROOT / "pdf" / source["fileName"]
    return organized if organized.exists() else configured


def extract_pdf_source(source: dict[str, Any], grade_points: dict[str, float]) -> tuple[dict[str, Any], list[ExtractedRow]]:
    pdf_path = source_path(source)
    if not pdf_path.exists():
        raise ValidationError(f"Missing configured source: {source['fileName']}")

    rows: list[ExtractedRow] = []
    first_page_text = ""
    with pdfplumber.open(pdf_path) as pdf:
        page_count = len(pdf.pages)
        for page_number, page in enumerate(pdf.pages, start=1):
            page_text = page.extract_text() or ""
            if page_number == 1:
                first_page_text = page_text
            for table in page.extract_tables() or []:
                for raw_row in table:
                    cells = [clean(cell) for cell in raw_row]
                    registration = next((cell for cell in cells if REGISTRATION_RE.fullmatch(cell)), None)
                    letter_grade = next((cell for cell in reversed(cells) if GRADE_RE.fullmatch(cell)), None)
                    if not registration or not letter_grade:
                        continue

                    name: str | None = None
                    grade_point: float | None = None
                    if source["status"] == "official":
                        if len(cells) < 5:
                            raise ValidationError(f"Unexpected official row shape in {source['fileName']} page {page_number}: {cells}")
                        name = cells[2] or None
                        try:
                            grade_point = float(cells[-2])
                        except ValueError as exc:
                            raise ValidationError(f"Invalid grade point in {source['fileName']} page {page_number}: {cells}") from exc
                        expected_point = float(grade_points[letter_grade])
                        if grade_point != expected_point:
                            raise ValidationError(
                                f"Grade mismatch in {source['fileName']} for {registration}: "
                                f"{letter_grade} should be {expected_point}, found {grade_point}"
                            )

                    rows.append(
                        ExtractedRow(
                            registration=registration,
                            name=name,
                            letter_grade=letter_grade,
                            grade_point=grade_point,
                            source_id=source["sourceId"],
                            course_id=source["courseId"],
                            page=page_number,
                        )
                    )

    metadata = parse_metadata(first_page_text)
    printed_code = metadata["courseCode"]
    if not printed_code or compact_code(printed_code) != compact_code(source["code"]):
        raise ValidationError(
            f"Course code mismatch for {source['fileName']}: expected {source['code']}, found {printed_code}"
        )
    if source["status"] == "official":
        if metadata["courseCredit"] is None or float(metadata["courseCredit"]) != float(source["credits"]):
            raise ValidationError(
                f"Course credit mismatch for {source['fileName']}: expected {source['credits']}, found {metadata['courseCredit']}"
            )

    unique_rows = len({row.registration for row in rows})
    if unique_rows != source["expectedUniqueRows"]:
        raise ValidationError(
            f"Row count mismatch for {source['fileName']}: expected {source['expectedUniqueRows']}, found {unique_rows}"
        )

    source_record = {
        "id": source["sourceId"],
        "fileName": source["fileName"],
        "url": f"/sources/{quote(source['fileName'])}",
        "kind": "pdf",
        "status": source["status"],
        "courseId": source["courseId"],
        "pageCount": page_count,
        "rowCount": unique_rows,
        "printedSession": metadata["printedSession"],
        "publishedDate": metadata["publishedDate"],
        "notes": source.get("notes", []),
    }
    return source_record, rows


def grade_from_mark(mark: float) -> str:
    thresholds = [(80, "A+"), (75, "A"), (70, "A-"), (65, "B+"), (60, "B"), (55, "B-"), (50, "C+"), (45, "C"), (40, "C-")]
    return next((grade for threshold, grade in thresholds if mark >= threshold), "F")


def extract_csv_source(source: dict[str, Any], grade_points: dict[str, float]) -> tuple[dict[str, Any], list[ExtractedRow]]:
    csv_path = source_path(source)
    if not csv_path.exists():
        raise ValidationError(f"Missing configured source: {source.get('relativePath', source['fileName'])}")

    rows: list[ExtractedRow] = []
    summary: dict[str, int] = {}
    with csv_path.open(encoding="utf-8-sig", newline="") as stream:
        for raw_row in csv.reader(stream):
            cells = [clean(cell) for cell in raw_row]
            if len(cells) > 6 and cells[5].startswith("Total "):
                try:
                    summary[cells[5].removeprefix("Total ")] = int(cells[6])
                except (ValueError, IndexError) as exc:
                    raise ValidationError(f"Invalid grade summary row in {source['fileName']}: {cells}") from exc
                continue
            if not cells or not REGISTRATION_RE.fullmatch(cells[0]):
                continue
            if len(cells) < 7 or not GRADE_RE.fullmatch(cells[6]):
                raise ValidationError(f"Invalid DS lab row in {source['fileName']}: {cells}")
            try:
                total = float(cells[5])
            except ValueError as exc:
                raise ValidationError(f"Invalid total mark in {source['fileName']}: {cells}") from exc
            letter_grade = cells[6]
            expected_grade = grade_from_mark(total)
            if letter_grade != expected_grade:
                raise ValidationError(
                    f"Grade/mark mismatch in {source['fileName']} for {cells[0]}: "
                    f"{total} maps to {expected_grade}, found {letter_grade}"
                )
            rows.append(
                ExtractedRow(
                    registration=cells[0],
                    name=None,
                    letter_grade=letter_grade,
                    grade_point=grade_points[letter_grade],
                    source_id=source["sourceId"],
                    course_id=source["courseId"],
                    page=1,
                    score=total,
                    max_score=100.0,
                    note=cells[8] if len(cells) > 8 and cells[8] else None,
                )
            )

    unique_rows = len({row.registration for row in rows})
    if unique_rows != source["expectedUniqueRows"] or len(rows) != unique_rows:
        raise ValidationError(
            f"Row count/duplicate mismatch for {source['fileName']}: "
            f"expected {source['expectedUniqueRows']} unique rows, found {len(rows)} rows/{unique_rows} unique"
        )
    observed = defaultdict(int)
    for row in rows:
        observed[row.letter_grade] += 1
    if dict(observed) != summary:
        raise ValidationError(f"CSV grade summary mismatch for {source['fileName']}: observed={dict(observed)}, summary={summary}")

    return (
        {
            "id": source["sourceId"],
            "fileName": source["fileName"],
            "url": f"/sources/{quote(source['fileName'])}",
            "kind": "csv",
            "status": source["status"],
            "courseId": source["courseId"],
            "pageCount": None,
            "rowCount": unique_rows,
            "printedSession": None,
            "publishedDate": None,
            "notes": source.get("notes", []),
        },
        rows,
    )


def extract_source(source: dict[str, Any], grade_points: dict[str, float]) -> tuple[dict[str, Any], list[ExtractedRow]]:
    return extract_csv_source(source, grade_points) if source.get("format") == "csv" else extract_pdf_source(source, grade_points)


def build() -> dict[str, Any]:
    config = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    grade_points = {grade: float(point) for grade, point in config["gradePoints"].items()}
    all_rows: list[ExtractedRow] = []
    source_records: list[dict[str, Any]] = []

    configured_files = {source["fileName"] for source in config["sources"] if source.get("format", "pdf") == "pdf"}
    actual_files = {path.name for path in ROOT.glob("*.pdf")} | {path.name for path in (ROOT / "pdf").glob("*.pdf")}
    if configured_files != actual_files:
        missing = sorted(configured_files - actual_files)
        extra = sorted(actual_files - configured_files)
        raise ValidationError(f"PDF source set mismatch. Missing={missing}; unconfigured={extra}")

    for source in config["sources"]:
        source_record, rows = extract_source(source, grade_points)
        source_records.append(source_record)
        all_rows.extend(rows)

    source_by_id = {source["sourceId"]: source for source in config["sources"]}
    grouped: dict[tuple[str, str], list[ExtractedRow]] = defaultdict(list)
    names: dict[str, set[str]] = defaultdict(set)
    for row in all_rows:
        grouped[(row.course_id, row.registration)].append(row)
        if row.name:
            names[row.registration].add(row.name)

    name_conflicts = {registration: values for registration, values in names.items() if len(values) > 1}
    if name_conflicts:
        raise ValidationError(f"Conflicting student names found: {name_conflicts}")

    reviewed_lookup = {
        (issue["courseId"], issue["registration"]): issue for issue in config["reviewedIssues"]
    }
    issues: list[dict[str, Any]] = []
    results: list[dict[str, Any]] = []

    for (course_id, registration), candidates in sorted(grouped.items()):
        grades = {candidate.letter_grade for candidate in candidates}
        if len(candidates) > 1:
            reviewed = reviewed_lookup.get((course_id, registration))
            if not reviewed or grades != set(reviewed["allowedGrades"]):
                detail = [(candidate.letter_grade, candidate.source_id, candidate.page) for candidate in candidates]
                raise ValidationError(f"Unexpected duplicate/conflict for {course_id} {registration}: {detail}")
            issues.append(
                {
                    "id": reviewed["id"],
                    "severity": "warning",
                    "type": reviewed["type"],
                    "courseId": course_id,
                    "registration": registration,
                    "sourceIds": sorted({candidate.source_id for candidate in candidates}),
                    "score": None,
                    "maxScore": None,
                    "note": None,
                    "message": f"Source contains conflicting grades: {', '.join(sorted(grades))}. No grade was selected.",
                }
            )
            results.append(
                {
                    "registration": registration,
                    "courseId": course_id,
                    "letterGrade": None,
                    "gradePoint": None,
                    "status": "conflicted",
                    "sourceIds": sorted({candidate.source_id for candidate in candidates}),
                }
            )
            continue

        row = candidates[0]
        source = source_by_id[row.source_id]
        grade_point = row.grade_point if row.grade_point is not None else grade_points[row.letter_grade]
        results.append(
            {
                "registration": registration,
                "courseId": course_id,
                "letterGrade": row.letter_grade,
                "gradePoint": grade_point,
                "status": source["status"],
                "sourceIds": [row.source_id],
                "score": row.score,
                "maxScore": row.max_score,
                "note": row.note,
            }
        )

    course_map: dict[str, dict[str, Any]] = {}
    for source in config["sources"]:
        existing = course_map.get(source["courseId"])
        if existing:
            if any(existing[key] != source[key] for key in ("code", "title", "credits")):
                raise ValidationError(f"Inconsistent course config for {source['courseId']}")
            existing["sourceIds"].append(source["sourceId"])
            if source["status"] == "unofficial":
                existing["status"] = "unofficial"
        else:
            course_map[source["courseId"]] = {
                "id": source["courseId"],
                "code": source["code"],
                "title": source["title"],
                "credits": float(source["credits"]),
                "status": source["status"],
                "sourceIds": [source["sourceId"]],
            }
    courses = list(course_map.values())

    all_registrations = sorted({row.registration for row in all_rows})
    regular_prefix = config["semester"]["regularRegistrationPrefix"]
    students = [
        {
            "registration": registration,
            "name": next(iter(names[registration]), None),
            "cohort": registration[:4],
            "isRegular": registration.startswith(regular_prefix),
        }
        for registration in all_registrations
    ]

    result_lookup = {(result["courseId"], result["registration"]): result for result in results}
    regular_students = [student for student in students if student["isRegular"]]
    lab_course_id = "eee-0714-1212d"
    lab_covered = sum(1 for student in regular_students if (lab_course_id, student["registration"]) in result_lookup)
    eligible = sum(
        1
        for student in regular_students
        if all(
            (result := result_lookup.get((course["id"], student["registration"]))) is not None
            and result["gradePoint"] is not None
            for course in courses
        )
    )
    total_credits = sum(course["credits"] for course in courses)
    official_course_ids = [course["id"] for course in courses if course["status"] == "official"]
    official_regular = sum(
        1
        for student in regular_students
        if all(
            (result := result_lookup.get((course_id, student["registration"]))) is not None
            and result["gradePoint"] is not None
            for course_id in official_course_ids
        )
    )

    expectations = config["expectations"]
    computed = {
        "sourceCount": len(source_records),
        "officialSourceCount": sum(source["status"] == "official" for source in source_records),
        "courseCount": len(courses),
        "regularStudentCount": len(regular_students),
        "officialRegularStudentCount": official_regular,
        "labCoveredRegularCount": lab_covered,
        "eligibleOverallCount": eligible,
        "totalCredits": total_credits,
    }
    for key, expected in expectations.items():
        if computed[key] != expected:
            raise ValidationError(f"Expectation failed for {key}: expected {expected}, found {computed[key]}")

    source_mismatch = next(
        source for source in source_records if source["id"] == "eee-0714-1212d-unofficial-odd"
    )
    if source_mismatch["printedSession"] != "2021-22":
        raise ValidationError(
            f"Expected reviewed session mismatch to remain 2021-22, found {source_mismatch['printedSession']}"
        )
    issues.append(
        {
            "id": "eee-1212d-session-mismatch",
            "severity": "warning",
            "type": "source-metadata-mismatch",
            "courseId": lab_course_id,
            "registration": None,
            "sourceIds": [source_mismatch["id"]],
            "message": "The PDF prints session 2021-22 while its filename identifies 2024-25.",
        }
    )

    return {
        "schemaVersion": 1,
        "semester": config["semester"],
        "gradePoints": config["gradePoints"],
        "courses": courses,
        "students": students,
        "results": results,
        "sources": source_records,
        "issues": issues,
        "stats": computed,
    }


def write_outputs(data: dict[str, Any]) -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC_SOURCES.mkdir(parents=True, exist_ok=True)

    for source in data["sources"]:
        configured = next(item for item in json.loads(CONFIG_PATH.read_text(encoding="utf-8"))["sources"] if item["sourceId"] == source["id"])
        shutil.copy2(source_path(configured), PUBLIC_SOURCES / source["fileName"])

    OUTPUT_PATH.write_text(json.dumps(data, indent=2, ensure_ascii=True) + "\n", encoding="utf-8")
    REPORT_PATH.write_text(
        json.dumps(
            {
                "valid": True,
                "stats": data["stats"],
                "issues": data["issues"],
                "sources": [
                    {
                        "id": source["id"],
                        "fileName": source["fileName"],
                        "pageCount": source["pageCount"],
                        "rowCount": source["rowCount"],
                        "status": source["status"],
                    }
                    for source in data["sources"]
                ],
            },
            indent=2,
            ensure_ascii=True,
        )
        + "\n",
        encoding="utf-8",
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Extract and validate the CSE 1-2 result PDFs.")
    parser.add_argument("--check", action="store_true", help="Validate without writing generated files.")
    args = parser.parse_args()
    try:
        data = build()
        if not args.check:
            write_outputs(data)
        stats = data["stats"]
        print(
            "Validated "
            f"{stats['sourceCount']} sources, {stats['courseCount']} courses, "
            f"{stats['regularStudentCount']} regular students, "
            f"{stats['eligibleOverallCount']} overall leaderboard entries."
        )
        print(f"Reviewed warnings retained: {len(data['issues'])}")
        return 0
    except ValidationError as error:
        print(f"Validation failed: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
