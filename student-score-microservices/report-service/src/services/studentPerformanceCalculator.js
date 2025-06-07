const knex = require("../database/connection");
const GroupConfig = require("../config/groupConfig");
const Subjects = require("../config/subjectConfig");
const logger = require("../utils/logger");

class StudentPerformanceCalculator {
  constructor(groupCode) {
    this.groupConfig = GroupConfig.getGroup(groupCode);
    if (!this.groupConfig) {
      throw new Error(`Invalid group code: ${groupCode}`);
    }
  }

  // Calculate total score for a student in this group
  calculateTotalScore(studentScores) {
    const { subjects } = this.groupConfig;
    let totalScore = 0;
    let validSubjects = 0;

    for (const subject of subjects) {
      const score = studentScores[subject];
      const numericScore =
        typeof score === "string" ? parseFloat(score) : score;

      if (!isNaN(numericScore) && numericScore > 0) {
        totalScore += numericScore;
        validSubjects++;
      }
    }

    if (validSubjects < this.groupConfig.minSubjectsRequired) {
      return null;
    }

    return validSubjects > 0 ? totalScore : null;
  }

  // SIMPLE & EFFICIENT: Direct SQL approach for top students
  async getTopStudents(limit = 10, options = {}) {
    try {
      const { minTotalScore = 15.0 } = options;

      logger.info(
        `Getting top ${limit} students for Group ${this.groupConfig.code} (Direct SQL)`
      );

      const subjects = this.groupConfig.subjects;

      const sqlQuery = `
        SELECT 
          sbd,
          ${subjects.join(", ")},
          (${subjects.join(" + ")}) as total_score
        FROM students 
        WHERE ${subjects
          .map((s) => `${s} IS NOT NULL AND ${s} > 0`)
          .join(" AND ")}
          AND (${subjects.join(" + ")}) >= ${minTotalScore}
        ORDER BY (${subjects.join(" + ")}) DESC 
        LIMIT ${limit}
      `;

      logger.info(`Executing: ${sqlQuery}`);
      const result = await knex.raw(sqlQuery);
      const rows = result.rows || result;

      if (rows.length === 0) {
        return {
          group: this.groupConfig,
          students: [],
          total_eligible: 0,
          message: `No students found with valid scores for Group ${this.groupConfig.code}`,
        };
      }

      // Process the top results (already sorted and limited by database)
      const studentsWithScores = rows.map((student, index) => {
        const subjectDetails = subjects.map((subjectCode) => {
          const subject = Subjects.getSubject(subjectCode);
          const rawScore = student[subjectCode];

          // FIX: Handle string and number scores correctly
          let finalScore = 0;
          if (rawScore !== null && rawScore !== undefined) {
            if (typeof rawScore === "number") {
              finalScore = Math.round(rawScore * 100) / 100;
            } else if (typeof rawScore === "string") {
              const parsed = parseFloat(rawScore);
              finalScore = !isNaN(parsed) ? Math.round(parsed * 100) / 100 : 0;
            }
          }

          return {
            code: subjectCode,
            name: subject ? subject.name : subjectCode,
            score: finalScore, // Use the properly converted score
          };
        });

        const totalScore = student.total_score;
        const averageScore = totalScore / subjects.length;

        return {
          sbd: student.sbd,
          total_score: Math.round(totalScore * 100) / 100,
          average_score: Math.round(averageScore * 100) / 100,
          subjects: subjectDetails,
          valid_subjects: subjectDetails.filter((s) => s.score > 0).length,
          rank: index + 1,
        };
      });

      // Get total count for eligible students (separate lightweight query)
      const countQuery = `
        SELECT COUNT(*) as total_eligible
        FROM students 
        WHERE ${subjects
          .map((s) => `${s} IS NOT NULL AND ${s} > 0`)
          .join(" AND ")}
          AND (${subjects.join(" + ")}) >= ${minTotalScore}
      `;

      const countResult = await knex.raw(countQuery);
      const totalEligible = parseInt(
        (countResult.rows || countResult)[0].total_eligible
      );

      return {
        group: this.groupConfig,
        students: studentsWithScores,
        total_eligible: totalEligible,
        optimization: "direct-sql",
        criteria: {
          min_total_score: minTotalScore,
          min_subjects_required: this.groupConfig.minSubjectsRequired,
          order_by: "total_score",
          direction: "desc",
        },
        generated_at: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(
        `Error getting top students for Group ${this.groupConfig.code}:`,
        error
      );
      throw new Error(`Failed to get top students: ${error.message}`);
    }
  }

  // SIMPLE & EFFICIENT: Direct SQL for statistics
  async getGroupStatistics() {
    try {
      logger.info(
        `Getting statistics for Group ${this.groupConfig.code} (Direct SQL)`
      );

      const subjects = this.groupConfig.subjects;
      const sumFormula = subjects.join(" + ");

      // Single SQL query with all aggregations
      const statsQuery = `
        SELECT 
          COUNT(*) as total_students,
          AVG(${sumFormula}) as avg_total,
          MAX(${sumFormula}) as max_total,
          MIN(${sumFormula}) as min_total,
          COUNT(CASE WHEN (${sumFormula}) >= 24.0 THEN 1 END) as excellent_count,
          COUNT(CASE WHEN (${sumFormula}) >= 18.0 AND (${sumFormula}) < 24.0 THEN 1 END) as good_count,
          COUNT(CASE WHEN (${sumFormula}) >= 15.0 AND (${sumFormula}) < 18.0 THEN 1 END) as average_count,
          COUNT(CASE WHEN (${sumFormula}) < 15.0 THEN 1 END) as below_avg_count
        FROM students 
        WHERE ${subjects
          .map((s) => `${s} IS NOT NULL AND ${s} > 0`)
          .join(" AND ")}
      `;

      const result = await knex.raw(statsQuery);
      const stats = result.rows ? result.rows[0] : result[0];
      const totalStudents = parseInt(stats.total_students);

      if (totalStudents === 0) {
        return {
          group: this.groupConfig,
          total_students: 0,
          average_total_score: 0,
          max_total_score: 0,
          min_total_score: 0,
          score_distribution: [],
        };
      }

      return {
        group: this.groupConfig,
        total_students: totalStudents,
        average_total_score:
          Math.round(parseFloat(stats.avg_total) * 100) / 100,
        max_total_score: Math.round(parseFloat(stats.max_total) * 100) / 100,
        min_total_score: Math.round(parseFloat(stats.min_total) * 100) / 100,
        score_distribution: [
          {
            min: 24.0,
            max: 30.0,
            label: "Excellent (24.0-30.0)",
            count: parseInt(stats.excellent_count),
            percentage:
              Math.round(
                (parseInt(stats.excellent_count) / totalStudents) * 10000
              ) / 100,
          },
          {
            min: 18.0,
            max: 23.99,
            label: "Good (18.0-23.99)",
            count: parseInt(stats.good_count),
            percentage:
              Math.round((parseInt(stats.good_count) / totalStudents) * 10000) /
              100,
          },
          {
            min: 15.0,
            max: 17.99,
            label: "Average (15.0-17.99)",
            count: parseInt(stats.average_count),
            percentage:
              Math.round(
                (parseInt(stats.average_count) / totalStudents) * 10000
              ) / 100,
          },
          {
            min: 0,
            max: 14.99,
            label: "Below Average (<15.0)",
            count: parseInt(stats.below_avg_count),
            percentage:
              Math.round(
                (parseInt(stats.below_avg_count) / totalStudents) * 10000
              ) / 100,
          },
        ],
        optimization: "direct-sql",
      };
    } catch (error) {
      logger.error(
        `Error getting Group ${this.groupConfig.code} statistics:`,
        error
      );
      throw error;
    }
  }

  // Helper method for total score distribution
  calculateTotalScoreDistribution(totalScores) {
    const ranges = [
      { min: 24.0, max: 30.0, label: "Excellent (24.0-30.0)" },
      { min: 18.0, max: 23.99, label: "Good (18.0-23.99)" },
      { min: 15.0, max: 17.99, label: "Average (15.0-17.99)" },
      { min: 0, max: 14.99, label: "Below Average (<15.0)" },
    ];

    return ranges.map((range) => {
      const count = totalScores.filter(
        (score) => score >= range.min && score <= range.max
      ).length;
      return {
        ...range,
        count,
        percentage:
          totalScores.length > 0
            ? Math.round((count / totalScores.length) * 100 * 100) / 100
            : 0,
      };
    });
  }
}

module.exports = StudentPerformanceCalculator;
