class ScoreLevels {
  static LEVELS = {
    EXCELLENT: {
      code: 'excellent',
      name: 'Excellent',
      minScore: 8.0,
      maxScore: 10.0,
      color: '#10B981',
      bgColor: '#D1FAE5',
      icon: '🏆',
      description: 'Outstanding performance (≥8.0 points)'
    },
    GOOD: {
      code: 'good', 
      name: 'Good',
      minScore: 6.0,
      maxScore: 7.99,
      color: '#3B82F6',
      bgColor: '#DBEAFE', 
      icon: '👍',
      description: 'Good performance (6.0 - 7.99 points)'
    },
    AVERAGE: {
      code: 'average',
      name: 'Average', 
      minScore: 4.0,
      maxScore: 5.99,
      color: '#F59E0B',
      bgColor: '#FEF3C7',
      icon: '⚠️',
      description: 'Average performance (4.0 - 5.99 points)'
    },
    POOR: {
      code: 'poor',
      name: 'Poor',
      minScore: 0.0,
      maxScore: 3.99,
      color: '#EF4444',
      bgColor: '#FEE2E2',
      icon: '❌',
      description: 'Below average performance (<4.0 points)'
    }
  };

  static getLevel(score) {
    if (score === null || score === undefined || score === 0) return null;
    
    const numScore = parseFloat(score);
    if (isNaN(numScore)) return null;

    for (const level of Object.values(this.LEVELS)) {
      if (numScore >= level.minScore && numScore <= level.maxScore) {
        return level;
      }
    }
    return this.LEVELS.POOR;
  }

  static getAllLevels() {
    return Object.values(this.LEVELS);
  }

  static getLevelByCode(code) {
    return Object.values(this.LEVELS).find(level => level.code === code);
  }
}

module.exports = ScoreLevels;