import data11Raw from '../data/results-1-1.generated.json'
import data12Raw from '../data/results.generated.json'
import type { Course, ResultData, SemesterKey, SemesterOption, Student } from '../types'

export const SEMESTER_OPTIONS: SemesterOption[] = [
  {
    key: '1-1',
    label: '1-1 Semester',
    shortLabel: '1-1',
    description: 'First semester course results from the compiled grade sheet.',
  },
  {
    key: '1-2',
    label: '1-2 Semester',
    shortLabel: '1-2',
    description: 'Second semester results from the supplied PDFs and lab CSV.',
  },
  {
    key: 'combined',
    label: 'Combined',
    shortLabel: 'Both',
    description: 'Both semesters together with a credit-weighted combined CGPA.',
  },
]

export const DEFAULT_SEMESTER: SemesterKey = '1-2'

export function isSemesterKey(value: string | undefined): value is SemesterKey {
  return value === '1-1' || value === '1-2' || value === 'combined'
}

function withSemesterKey(data: ResultData, semesterKey: '1-1' | '1-2'): ResultData {
  return {
    ...data,
    courses: data.courses.map((course) => ({
      ...course,
      semesterKey: course.semesterKey ?? semesterKey,
    })),
  }
}

function mergeStudents(primary: Student[], secondary: Student[]): Student[] {
  const byRegistration = new Map<string, Student>()
  for (const student of [...primary, ...secondary]) {
    const existing = byRegistration.get(student.registration)
    if (!existing) {
      byRegistration.set(student.registration, student)
      continue
    }
    byRegistration.set(student.registration, {
      ...existing,
      name: existing.name ?? student.name,
      isRegular: existing.isRegular || student.isRegular,
    })
  }
  return [...byRegistration.values()].sort((a, b) => a.registration.localeCompare(b.registration))
}

function buildCombinedData(first: ResultData, second: ResultData): ResultData {
  const courses = [...first.courses, ...second.courses]
  const students = mergeStudents(first.students, second.students)
  const results = [...first.results, ...second.results]
  const sources = [...first.sources, ...second.sources]
  const issues = [...first.issues, ...second.issues]
  const courseIds = new Set(courses.map((course) => course.id))
  const resultsByStudent = new Map<string, Set<string>>()

  for (const result of results) {
    if (result.gradePoint === null) continue
    const set = resultsByStudent.get(result.registration) ?? new Set<string>()
    set.add(result.courseId)
    resultsByStudent.set(result.registration, set)
  }

  const eligibleOverallCount = students.filter((student) => {
    if (!student.isRegular) return false
    const completed = resultsByStudent.get(student.registration)
    if (!completed || completed.size !== courseIds.size) return false
    return [...courseIds].every((courseId) => completed.has(courseId))
  }).length

  return {
    schemaVersion: 1,
    semester: {
      department: first.semester.department,
      degree: first.semester.degree,
      name: '1-1 + 1-2 Combined',
      number: 'Both semesters',
      session: first.semester.session,
      usn: 'Full first year',
      regularRegistrationPrefix: first.semester.regularRegistrationPrefix,
    },
    gradePoints: first.gradePoints,
    courses,
    students,
    results,
    sources,
    issues,
    stats: {
      sourceCount: sources.length,
      officialSourceCount: sources.filter((source) => source.status === 'official').length,
      courseCount: courses.length,
      regularStudentCount: students.filter((student) => student.isRegular).length,
      officialRegularStudentCount: students.filter((student) => student.isRegular).length,
      labCoveredRegularCount: Math.min(
        first.stats.labCoveredRegularCount,
        second.stats.labCoveredRegularCount,
      ),
      eligibleOverallCount,
      totalCredits: courses.reduce((sum, course) => sum + course.credits, 0),
    },
  }
}

const semester11 = withSemesterKey(data11Raw as ResultData, '1-1')
const semester12 = withSemesterKey(data12Raw as ResultData, '1-2')

export const datasets: Record<SemesterKey, ResultData> = {
  '1-1': semester11,
  '1-2': semester12,
  combined: buildCombinedData(semester11, semester12),
}

export function getSemesterLabel(key: SemesterKey): string {
  return SEMESTER_OPTIONS.find((option) => option.key === key)?.label ?? key
}

export function courseSemesterLabel(course: Course): string {
  return course.semesterKey === '1-1' ? '1-1' : course.semesterKey === '1-2' ? '1-2' : 'Course'
}
