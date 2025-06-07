const GroupPerformanceService = require("../services/groupPerformanceService");
const logger = require("../utils/logger");

class GroupPerformanceController {
  constructor() {
    this.groupPerformanceService = new GroupPerformanceService();
  }

  // GET /api/reports/groups
  async getAvailableGroups(req, res) {
    try {
      logger.info("Getting available groups...");
      const result = this.groupPerformanceService.getAvailableGroups();

      res.json({
        success: true,
        data: result,
        message: "Available groups retrieved successfully",
      });
    } catch (error) {
      logger.error("Error getting available groups:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get available groups",
        error: error.message,
      });
    }
  }

  // GET /api/reports/groups/:groupCode/top-students
  async getTopStudentsByGroup(req, res) {
    try {
      const { groupCode } = req.params;
      const {
        limit = 10,
        minScore = 5.0,
        orderBy = "average_score",
        direction = "desc",
      } = req.query;

      logger.info(
        `Getting top ${limit} students for Group ${groupCode.toUpperCase()}`
      );

      const result = await this.groupPerformanceService.getTopStudentsByGroup(
        groupCode,
        parseInt(limit),
        {
          minScore: parseFloat(minScore),
          orderBy,
          direction,
        }
      );

      res.json({
        success: true,
        data: result,
        message: `Top ${limit} students for Group ${groupCode.toUpperCase()} retrieved successfully`,
      });
    } catch (error) {
      logger.error(
        `Error getting top students for Group ${req.params.groupCode}:`,
        error
      );
      res.status(400).json({
        success: false,
        message: "Failed to get top students",
        error: error.message,
      });
    }
  }

  // GET /api/reports/groups/:groupCode/statistics
  async getGroupStatistics(req, res) {
    try {
      const { groupCode } = req.params;
      logger.info(`Getting statistics for Group ${groupCode.toUpperCase()}`);

      const result = await this.groupPerformanceService.getGroupStatistics(
        groupCode
      );

      res.json({
        success: true,
        data: result,
        message: `Statistics for Group ${groupCode.toUpperCase()} retrieved successfully`,
      });
    } catch (error) {
      logger.error(
        `Error getting statistics for Group ${req.params.groupCode}:`,
        error
      );
      res.status(400).json({
        success: false,
        message: "Failed to get group statistics",
        error: error.message,
      });
    }
  }

  // POST /api/reports/groups/compare
  async compareGroups(req, res) {
    try {
      const { groups, limit = 10 } = req.body;

      // Validate input
      if (!groups || !Array.isArray(groups) || groups.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Please provide an array of group codes to compare",
          example: { groups: ["A", "B"], limit: 10 },
        });
      }

      if (groups.length > 4) {
        return res.status(400).json({
          success: false,
          message: "Maximum 4 groups can be compared at once",
        });
      }

      logger.info(`Comparing ${groups.length} groups: ${groups.join(", ")}`);

      const result = await this.groupPerformanceService.compareGroups(
        groups,
        parseInt(limit)
      );

      res.json({
        success: true,
        data: result,
        message: `Comparison of ${groups.length} groups completed successfully`,
      });
    } catch (error) {
      logger.error("Error comparing groups:", error);
      res.status(400).json({
        success: false,
        message: "Failed to compare groups",
        error: error.message,
      });
    }
  }

  // GET /api/reports/groups/all/top-students
  async getTopPerformersAllGroups(req, res) {
    try {
      const { limit = 10 } = req.query;
      logger.info(`Getting top ${limit} students for all groups`);

      const result =
        await this.groupPerformanceService.getTopPerformersAllGroups(
          parseInt(limit)
        );

      res.json({
        success: true,
        data: result,
        message: `Top ${limit} students for all groups retrieved successfully`,
      });
    } catch (error) {
      logger.error("Error getting top performers for all groups:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get top performers for all groups",
        error: error.message,
      });
    }
  }

  // GET /api/reports/groups/:groupCode/ranking
  async getGroupRanking(req, res) {
    try {
      const { groupCode } = req.params;
      const { page = 1, limit = 50, minScore = 0 } = req.query;

      logger.info(
        `Getting ranking for Group ${groupCode.toUpperCase()} (page ${page})`
      );

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);
      const offset = (pageNum - 1) * limitNum;

      const result = await this.groupPerformanceService.getTopStudentsByGroup(
        groupCode,
        limitNum + offset,
        {
          minScore: parseFloat(minScore),
          orderBy: "average_score", 
          direction: "desc",
        }
      );

      // Apply pagination
      const paginatedStudents = result.students.slice(
        offset,
        offset + limitNum
      );

      res.json({
        success: true,
        data: {
          ...result,
          students: paginatedStudents,
          pagination: {
            current_page: pageNum,
            per_page: limitNum,
            total_students: result.students.length,
            total_pages: Math.ceil(result.students.length / limitNum),
            has_next: pageNum * limitNum < result.students.length,
            has_prev: pageNum > 1,
          },
        },
        message: `Group ${groupCode.toUpperCase()} ranking (page ${pageNum}) retrieved successfully`,
      });
    } catch (error) {
      logger.error(
        `Error getting ranking for Group ${req.params.groupCode}:`,
        error
      );
      res.status(400).json({
        success: false,
        message: "Failed to get group ranking",
        error: error.message,
      });
    }
  }

  // GET /api/reports/groups/:groupCode/analysis
  async getGroupAnalysis(req, res) {
    try {
      const { groupCode } = req.params;
      logger.info(
        `Getting detailed analysis for Group ${groupCode.toUpperCase()}`
      );

      const [topStudents, statistics] = await Promise.all([
        this.groupPerformanceService.getTopStudentsByGroup(groupCode, 20),
        this.groupPerformanceService.getGroupStatistics(groupCode),
      ]);

      const analysis = {
        group_info: topStudents.group,
        performance_summary: {
          total_eligible: statistics.total_students,
          average_score: statistics.average_score,
          score_range: {
            highest: statistics.max_score,
            lowest: statistics.min_score,
            spread: statistics.max_score - statistics.min_score,
          },
          distribution: statistics.score_distribution,
        },
        top_performers: {
          top_20: topStudents.students,
          excellence_rate:
            statistics.score_distribution.find((d) =>
              d.label.includes("Excellent")
            )?.percentage || 0,
        },
        insights: this.generateGroupInsights(statistics, topStudents),
      };

      res.json({
        success: true,
        data: analysis,
        message: `Detailed analysis for Group ${groupCode.toUpperCase()} completed successfully`,
      });
    } catch (error) {
      logger.error(
        `Error getting analysis for Group ${req.params.groupCode}:`,
        error
      );
      res.status(400).json({
        success: false,
        message: "Failed to get group analysis",
        error: error.message,
      });
    }
  }

  // Helper method to generate insights
  generateGroupInsights(statistics, topStudents) {
    const insights = [];

    // Performance insights
    if (statistics.average_score >= 8.0) {
      insights.push({
        type: "positive",
        message: "Excellent overall performance with high average score",
        value: statistics.average_score,
      });
    } else if (statistics.average_score >= 6.5) {
      insights.push({
        type: "neutral",
        message: "Good performance with room for improvement",
        value: statistics.average_score,
      });
    } else {
      insights.push({
        type: "attention",
        message: "Below average performance requires attention",
        value: statistics.average_score,
      });
    }

    // Distribution insights
    const excellentRate =
      statistics.score_distribution?.find((d) => d.label.includes("Excellent"))
        ?.percentage || 0;
    if (excellentRate >= 30) {
      insights.push({
        type: "positive",
        message: "High percentage of excellent performers",
        value: `${excellentRate}%`,
      });
    }

    // Competition insights
    if (topStudents.students.length > 0) {
      const topScore = topStudents.students[0]?.average_score; 
      if (topScore >= 9.0) {
        insights.push({
          type: "highlight",
          message: "Outstanding top performer with exceptional scores",
          value: topScore,
          sbd: topStudents.students[0]?.sbd,
        });
      }
    }

    // Participation insights
    insights.push({
      type: "info",
      message: "Total eligible students for this group",
      value: statistics.total_students,
    });

    return insights;
  }
}

module.exports = new GroupPerformanceController();
