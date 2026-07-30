import { describe, expect, it } from 'vitest'
import {
  assignCompetitionRanks,
  buildCourseLeaderboard,
  data,
  getStudentProfile,
  overallLeaderboard,
} from './results'

describe('result calculations', () => {
  it('uses the validated 18-credit course set', () => {
    expect(data.courses.reduce((sum, course) => sum + course.credits, 0)).toBe(19.5)
  })

  it('builds the expected complete regular leaderboard', () => {
    expect(overallLeaderboard).toHaveLength(90)
    expect(overallLeaderboard.every((entry) => entry.courseCount === 9)).toBe(true)
  })

  it('does not calculate a full result for the conflicted registration', () => {
    const profile = getStudentProfile('2024331088')
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
    const ranking = buildCourseLeaderboard('eee-0714-1212d')
    expect(ranking.some((entry) => entry.registration === '2024331088')).toBe(false)
    expect(ranking.length).toBeGreaterThan(90)
  })

  it('includes all 126 DS lab results and their published marks', () => {
    const ranking = buildCourseLeaderboard('cse-0613-1238')
    expect(ranking).toHaveLength(126)
    const profile = getStudentProfile('2024331001')
    const dsLab = profile?.courseResults.find(({ course }) => course.id === 'cse-0613-1238')?.result
    expect(dsLab?.score).toBe(95)
  })
})
