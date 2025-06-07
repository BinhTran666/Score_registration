// Group configuration for different combinations
class GroupConfig {
  static GROUPS = {
    A: {
      code: 'A',
      name: 'Group A (Science)',
      description: 'Mathematics, Physics, Chemistry',
      subjects: ['toan', 'vat_li', 'hoa_hoc'],
      weights: { toan: 2, vat_li: 1, hoa_hoc: 1 }, // Math has double weight
      minSubjectsRequired: 3,
      icon: '🧪',
      color: '#3B82F6'
    },
    B: {
      code: 'B',
      name: 'Group B (Biology)',
      description: 'Mathematics, Chemistry, Biology',
      subjects: ['toan', 'hoa_hoc', 'sinh_hoc'],
      weights: { toan: 2, hoa_hoc: 1, sinh_hoc: 1 },
      minSubjectsRequired: 3,
      icon: '🌱',
      color: '#10B981'
    },
    C: {
      code: 'C',
      name: 'Group C (Social)',
      description: 'Literature, History, Geography',
      subjects: ['ngu_van', 'lich_su', 'dia_li'],
      weights: { ngu_van: 2, lich_su: 1, dia_li: 1 },
      minSubjectsRequired: 3,
      icon: '📚',
      color: '#8B5CF6'
    },
    D: {
      code: 'D',
      name: 'Group D (Language)',
      description: 'Mathematics, Literature, Foreign Language',
      subjects: ['toan', 'ngu_van', 'ngoai_ngu'],
      weights: { toan: 1, ngu_van: 1, ngoai_ngu: 2 },
      minSubjectsRequired: 3,
      icon: '🌍',
      color: '#F59E0B'
    }
  };

  static getGroup(code) {
    return this.GROUPS[code.toUpperCase()];
  }

  static getAllGroups() {
    return Object.values(this.GROUPS);
  }

  static getAvailableGroups() {
    return Object.keys(this.GROUPS);
  }
}

module.exports = GroupConfig;