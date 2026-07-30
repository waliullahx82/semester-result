import { datasets } from './datasets'
import type {
  Course,
  CourseAnalytics,
  RankedEntry,
  ResultData,
  ResultRecord,
  SemesterKey,
  Student,
  StudentProfile,
} from '../types'

export const gradeOrder = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'F']

export function formatScore(value: number): string {
  return value.toFixed(2)
}

export function assignCompetitionRanks<T>(items: T[], getScore: (item: T) => number): Array<T & { rank: number }> {
  let previousScore: number | null = null
  let currentRank = 0
  return items.map((item, index) => {
    const score = getScore(item)
    if (previousScore === null || score !== previousScore) {
      currentRank = index + 1
      previousScore = score
    }
    return { ...item, rank: currentRank }
  })
}

export interface ResultsApi {
  key: SemesterKey
  data: ResultData
  overallLeaderboard: RankedEntry[]
  courseAnalytics: CourseAnalytics[]
  getStudent: (registration: string) => Student | null
  getCourse: (courseId: string) => Course | null
  getResult: (registration: string, courseId: string) => ResultRecord | null
  buildOverallLeaderboard: () => RankedEntry[]
  buildCourseLeaderboard: (courseId: string) => RankedEntry[]
  getStudentProfile: (registration: string) => StudentProfile | null
  getCourseAnalytics: (courseId: string) => CourseAnalytics | null
}

export function createResultsApi(key: SemesterKey, data: ResultData): ResultsApi {
  const studentByRegistration = new Map(data.students.map((student) => [student.registration, student]))
  const courseById = new Map(data.courses.map((course) => [course.id, course]))
  const resultByStudentCourse = new Map(
    data.results.map((result) => [`${result.registration}:${result.courseId}`, result]),
  )

  function getStudent(registration: string): Student | null {
    return studentByRegistration.get(registration) ?? null
  }

  function getCourse(courseId: string): Course | null {
    return courseById.get(courseId) ?? null
  }

  function getResult(registration: string, courseId: string): ResultRecord | null {
    return resultByStudentCourse.get(`${registration}:${courseId}`) ?? null
  }

  function calculateWeightedScore(results: ResultRecord[]): { score: number; credits: number } | null {
    let weightedTotal = 0
    let credits = 0
    for (const result of results) {
      const course = courseById.get(result.courseId)
      if (!course || result.gradePoint === null) return null
      weightedTotal += result.gradePoint * course.credits
      credits += course.credits
    }
    return credits > 0 ? { score: weightedTotal / credits, credits } : null
  }

  function buildOverallLeaderboard(): RankedEntry[] {
    const eligible: Omit<RankedEntry, 'rank'>[] = []
    for (const student of data.students) {
      if (!student.isRegular) continue
      const results = data.courses.map((course) => getResult(student.registration, course.id))
      if (results.some((result) => result === null || result.gradePoint === null)) continue
      const validResults = results as ResultRecord[]
      const calculation = calculateWeightedScore(validResults)
      if (!calculation) continue
      eligible.push({
        registration: student.registration,
        name: student.name,
        score: calculation.score,
        courseCount: validResults.length,
        totalCredits: calculation.credits,
      })
    }
    eligible.sort((a, b) => b.score - a.score || a.registration.localeCompare(b.registration))
    return assignCompetitionRanks(eligible, (entry) => entry.score)
  }

  const overallLeaderboard = buildOverallLeaderboard()
  const overallRankByRegistration = new Map(
    overallLeaderboard.map((entry) => [entry.registration, entry.rank]),
  )

  function buildCourseLeaderboard(courseId: string): RankedEntry[] {
    const course = courseById.get(courseId)
    if (!course) return []
    const entries: Omit<RankedEntry, 'rank'>[] = data.results
      .filter((result) => result.courseId === courseId && result.gradePoint !== null)
      .map((result) => {
        const student = studentByRegistration.get(result.registration)
        return {
          registration: result.registration,
          name: student?.name ?? null,
          score: result.gradePoint as number,
          courseCount: 1,
          totalCredits: course.credits,
        }
      })
      .sort((a, b) => b.score - a.score || a.registration.localeCompare(b.registration))
    return assignCompetitionRanks(entries, (entry) => entry.score)
  }

  function getStudentProfile(registration: string): StudentProfile | null {
    const student = getStudent(registration)
    if (!student) return null
    const courseResults = data.courses.map((course) => ({
      course,
      result: getResult(registration, course.id),
    }))
    const validResults = courseResults
      .map(({ result }) => result)
      .filter((result): result is ResultRecord => result !== null && result.gradePoint !== null)
    const calculation = calculateWeightedScore(validResults)
    const isComplete = validResults.length === data.courses.length
    return {
      student,
      courseResults,
      sgpa: isComplete && calculation ? calculation.score : null,
      overallRank: isComplete ? (overallRankByRegistration.get(registration) ?? null) : null,
      completedCredits: calculation?.credits ?? 0,
      isComplete,
      unresolvedCount: courseResults.filter(({ result }) => result?.status === 'conflicted').length,
    }
  }

  function getCourseAnalytics(courseId: string): CourseAnalytics | null {
    const course = getCourse(courseId)
    if (!course) return null
    const courseResults = data.results.filter((result) => result.courseId === courseId)
    const validResults = courseResults.filter(
      (result): result is ResultRecord & { letterGrade: string; gradePoint: number } =>
        result.letterGrade !== null && result.gradePoint !== null,
    )
    const averageGradePoint = validResults.length
      ? validResults.reduce((sum, result) => sum + result.gradePoint, 0) / validResults.length
      : 0
    const passCount = validResults.filter((result) => result.letterGrade !== 'F').length
    return {
      course,
      validCount: validResults.length,
      unresolvedCount: courseResults.length - validResults.length,
      averageGradePoint,
      passRate: validResults.length ? (passCount / validResults.length) * 100 : 0,
      distribution: gradeOrder.map((grade) => ({
        grade,
        count: validResults.filter((result) => result.letterGrade === grade).length,
      })),
    }
  }

  const courseAnalytics = data.courses
    .map((course) => getCourseAnalytics(course.id))
    .filter((analytics): analytics is CourseAnalytics => analytics !== null)

  return {
    key,
    data,
    overallLeaderboard,
    courseAnalytics,
    getStudent,
    getCourse,
    getResult,
    buildOverallLeaderboard,
    buildCourseLeaderboard,
    getStudentProfile,
    getCourseAnalytics,
  }
}

export const resultsBySemester: Record<SemesterKey, ResultsApi> = {
  '1-1': createResultsApi('1-1', datasets['1-1']),
  '1-2': createResultsApi('1-2', datasets['1-2']),
  combined: createResultsApi('combined', datasets.combined),
}

/** Default export surface for tests and pages that still import named helpers for 1-2. */
export const data = resultsBySemester['1-2'].data
export const overallLeaderboard = resultsBySemester['1-2'].overallLeaderboard
export const courseAnalytics = resultsBySemester['1-2'].courseAnalytics
export const getStudent = resultsBySemester['1-2'].getStudent
export const getCourse = resultsBySemester['1-2'].getCourse
export const getResult = resultsBySemester['1-2'].getResult
export const buildOverallLeaderboard = resultsBySemester['1-2'].buildOverallLeaderboard
export const buildCourseLeaderboard = resultsBySemester['1-2'].buildCourseLeaderboard
export const getStudentProfile = resultsBySemester['1-2'].getStudentProfile
export const getCourseAnalytics = resultsBySemester['1-2'].getCourseAnalytics
