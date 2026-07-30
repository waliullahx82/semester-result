import { describe, expect, it } from 'vitest'
import {
  assignCompetitionRanks,
  resultsBySemester,
} from './results'

const semester12 = resultsBySemester['1-2']
const semester11 = resultsBySemester['1-1']
const combined = resultsBySemester.combined

describe('result calculations', () => {
  it('uses the validated 1-2 credit course set', () => {
    expect(semester12.data.courses.reduce((sum, course) => sum + course.credits, 0)).toBe(19.5)
  })

  it('builds the expected complete regular 1-2 leaderboard', () => {
    expect(semester12.overallLeaderboard).toHaveLength(90)
    expect(semester12.overallLeaderboard.every((entry) => entry.courseCount === 9)).toBe(true)
  })

  it('does not calculate a full result for the conflicted registration', () => {
    const profile = semester12.getStudentProfile('2024331088')
    expect(profile).not.toBeNull()
    expect(profile?.isComplete).toBe(false)
    expect(profile?.sgpa).toBeNull()
    expect(profile?.overallRank).toBeNull()
    expect(profile?.unresolvedCount).toBe(1)
  })

  it('assigns competition ranks without arbitrary tie breaking', () => {
    const ranked = assignCompetitionRanks(
      [{ score: 4 }, { score: 3.75 }, { score: 3.75 }, { score: 3.5 }],
      (entry) => entry.score,
    )
    expect(ranked.map((entry) => entry.rank)).toEqual([1, 2, 2, 4])
  })

  it('ranks every valid result inside a course', () => {
    const ranking = semester12.buildCourseLeaderboard('eee-0714-1212d')
    expect(ranking.some((entry) => entry.registration === '2024331088')).toBe(false)
    expect(ranking.length).toBeGreaterThan(90)
  })

  it('includes all 126 DS lab results and their published marks', () => {
    const ranking = semester12.buildCourseLeaderboard('cse-0613-1238')
    expect(ranking).toHaveLength(126)
    const profile = semester12.getStudentProfile('2024331001')
    const dsLab = profile?.courseResults.find(({ course }) => course.id === 'cse-0613-1238')?.result
    expect(dsLab?.score).toBe(95)
  })

  it('loads the compiled 1-1 semester dataset', () => {
    expect(semester11.data.courses).toHaveLength(8)
    expect(semester11.data.courses.map((course) => course.id)).toEqual(
      expect.arrayContaining(['eee-lab-1-1', 'english-1-1', 'english-lab-1-1']),
    )
    expect(semester11.data.stats.totalCredits).toBe(19.5)
    expect(semester11.data.students.length).toBe(99)
    const profile = semester11.getStudentProfile('2024331001')
    expect(profile?.courseResults).toHaveLength(8)
    expect(profile?.isComplete).toBe(true)
    expect(profile?.sgpa).toBeCloseTo(3.923076923076923)
  })

  it('builds a combined view with both semester course sets', () => {
    expect(combined.data.courses).toHaveLength(17)
    expect(combined.data.stats.totalCredits).toBe(39)
    const profile = combined.getStudentProfile('2024331001')
    expect(profile?.courseResults).toHaveLength(17)
    expect(profile?.isComplete).toBe(true)
    expect(profile?.sgpa).not.toBeNull()
  })
})
