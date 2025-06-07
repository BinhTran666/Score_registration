const express = require('express');
const router = express.Router();
const GroupPerformanceController = require('../controllers/groupPerformanceController');

// ============ GROUP PERFORMANCE ROUTES ============

// Group overview and configuration
router.get('/', GroupPerformanceController.getAvailableGroups.bind(GroupPerformanceController));
router.get('/all/top-students', GroupPerformanceController.getTopPerformersAllGroups.bind(GroupPerformanceController));

// Individual group routes
router.get('/:groupCode/top-students', GroupPerformanceController.getTopStudentsByGroup.bind(GroupPerformanceController));
router.get('/:groupCode/statistics', GroupPerformanceController.getGroupStatistics.bind(GroupPerformanceController));
router.get('/:groupCode/ranking', GroupPerformanceController.getGroupRanking.bind(GroupPerformanceController));
router.get('/:groupCode/analysis', GroupPerformanceController.getGroupAnalysis.bind(GroupPerformanceController));

// Group comparison
router.post('/compare', GroupPerformanceController.compareGroups.bind(GroupPerformanceController));

// ============ UTILITY ROUTES ============

// Get group configuration details
router.get('/config/:groupCode', async (req, res) => {
  try {
    const { groupCode } = req.params;
    const GroupConfig = require('../config/groupConfig');
    
    const group = GroupConfig.getGroup(groupCode);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: `Group ${groupCode.toUpperCase()} not found`,
        available_groups: GroupConfig.getAvailableGroups()
      });
    }

    res.json({
      success: true,
      data: {
        group: group,
        subjects_details: group.subjects.map(subjectCode => {
          const Subjects = require('../config/subjectConfig');
          const subject = Subjects.getSubject(subjectCode);
          return {
            code: subjectCode,
            name: subject ? subject.name : subjectCode,
            weight: group.weights[subjectCode] || 1
          };
        })
      },
      message: `Configuration for Group ${groupCode.toUpperCase()} retrieved successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get group configuration',
      error: error.message
    });
  }
});

// Get quick summary for all groups
router.get('/summary/all', async (req, res) => {
  try {
    const GroupConfig = require('../config/groupConfig');
    const GroupPerformanceService = require('../services/groupPerformanceService');
    const groupService = new GroupPerformanceService();
    
    const groups = GroupConfig.getAvailableGroups();
    const summary = {};
    
    for (const groupCode of groups) {
      try {
        const stats = await groupService.getGroupStatistics(groupCode);
        summary[groupCode] = {
          name: stats.group.name,
          total_students: stats.total_students,
          average_score: stats.average_score,
          max_score: stats.max_score,
          excellence_rate: stats.score_distribution?.find(d => d.label.includes('Excellent'))?.percentage || 0
        };
      } catch (error) {
        summary[groupCode] = {
          error: error.message
        };
      }
    }
    
    res.json({
      success: true,
      data: {
        summary: summary,
        generated_at: new Date().toISOString()
      },
      message: 'Quick summary for all groups retrieved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get groups summary',
      error: error.message
    });
  }
});

// Validate group code middleware for specific routes
router.param('groupCode', (req, res, next, groupCode) => {
  const GroupConfig = require('../config/groupConfig');
  const group = GroupConfig.getGroup(groupCode);
  
  if (!group) {
    return res.status(400).json({
      success: false,
      message: `Invalid group code: ${groupCode.toUpperCase()}`,
      available_groups: GroupConfig.getAvailableGroups()
    });
  }
  
  req.groupConfig = group;
  next();
});

module.exports = router;