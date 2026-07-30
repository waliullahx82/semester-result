export type SourceStatus = 'official' | 'unofficial'
export type ResultStatus = SourceStatus | 'conflicted'
export type SemesterKey = '1-1' | '1-2' | 'combined'
export type SourceKind = 'pdf' | 'csv' | 'xlsx'

export interface Semester {
  department: string
  degree: string
  name: string
  number: string
  session: string
  usn: string
  regularRegistrationPrefix: string
}

export interface Course {
  id: string
  code: string
  title: string
  credits: number
  status: SourceStatus
  sourceIds: string[]
  semesterKey?: '1-1' | '1-2'
}

export interface Student {
  registration: string
  name: string | null
  cohort: string
  isRegular: boolean
}

export interface ResultRecord {
  registration: string
  courseId: string
  letterGrade: string | null
  gradePoint: number | null
  status: ResultStatus
  sourceIds: string[]
  score: number | null
  maxScore: number | null
  note: string | null
}

export interface SourceDocument {
  id: string
  fileName: string
  url: string
  kind: SourceKind
  status: SourceStatus
  courseId: string
  pageCount: number | null
  rowCount: number
  printedSession: string | null
  publishedDate: string | null
  notes: string[]
}

export interface DataIssue {
  id: string
  severity: 'warning' | 'error'
  type: string
  courseId: string
  registration: string | null
  sourceIds: string[]
  message: string
}

export interface DataStats {
  sourceCount: number
  officialSourceCount: number
  courseCount: number
  regularStudentCount: number
  officialRegularStudentCount: number
  labCoveredRegularCount: number
  eligibleOverallCount: number
  totalCredits: number
}

export interface ResultData {
  schemaVersion: number
  semester: Semester
  gradePoints: Record<string, number>
  courses: Course[]
  students: Student[]
  results: ResultRecord[]
  sources: SourceDocument[]
  issues: DataIssue[]
  stats: DataStats
}

export interface RankedEntry {
  registration: string
  name: string | null
  score: number
  rank: number
  courseCount: number
  totalCredits: number
}

export interface StudentCourseResult {
  course: Course
  result: ResultRecord | null
}

export interface StudentProfile {
  student: Student
  courseResults: StudentCourseResult[]
  sgpa: number | null
  overallRank: number | null
  completedCredits: number
  isComplete: boolean
  unresolvedCount: number
}

export interface CourseAnalytics {
  course: Course
  validCount: number
  unresolvedCount: number
  averageGradePoint: number
  passRate: number
  distribution: Array<{ grade: string; count: number }>
}

export interface SemesterOption {
  key: SemesterKey
  label: string
  shortLabel: string
  description: string
}
