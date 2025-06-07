class Subjects {
  static SUBJECTS = {
    toan: {
      code: 'toan',
      name: 'Toán',
      englishName: 'Mathematics',
      icon: '🧮',
      color: '#3B82F6',
      category: 'core'
    },
    ngu_van: {
      code: 'ngu_van', 
      name: 'Ngữ Văn',
      englishName: 'Literature',
      icon: '📚',
      color: '#10B981',
      category: 'core'
    },
    ngoai_ngu: {
      code: 'ngoai_ngu',
      name: 'Ngoại Ngữ', 
      englishName: 'Foreign Language',
      icon: '🌍',
      color: '#8B5CF6',
      category: 'core'
    },
    vat_li: {
      code: 'vat_li',
      name: 'Vật Lí',
      englishName: 'Physics', 
      icon: '⚡',
      color: '#EF4444',
      category: 'science'
    },
    hoa_hoc: {
      code: 'hoa_hoc',
      name: 'Hóa Học',
      englishName: 'Chemistry',
      icon: '🧪', 
      color: '#F59E0B',
      category: 'science'
    },
    sinh_hoc: {
      code: 'sinh_hoc',
      name: 'Sinh Học',
      englishName: 'Biology',
      icon: '🌱',
      color: '#10B981',
      category: 'science'
    },
    lich_su: {
      code: 'lich_su',
      name: 'Lịch Sử', 
      englishName: 'History',
      icon: '📜',
      color: '#6366F1',
      category: 'social'
    },
    dia_li: {
      code: 'dia_li',
      name: 'Địa Lí',
      englishName: 'Geography',
      icon: '🗺️', 
      color: '#06B6D4',
      category: 'social'
    },
    gdcd: {
      code: 'gdcd',
      name: 'GDCD',
      englishName: 'Civic Education',
      icon: '⚖️',
      color: '#8B5CF6', 
      category: 'social'
    }
  };

  static getAllSubjects() {
    return Object.values(this.SUBJECTS);
  }

  static getSubject(code) {
    return this.SUBJECTS[code];
  }

  static getSubjectsByCategory(category) {
    return Object.values(this.SUBJECTS).filter(subject => subject.category === category);
  }

  static getCoreSubjects() {
    return this.getSubjectsByCategory('core');
  }

  static getScienceSubjects() {
    return this.getSubjectsByCategory('science');
  }

  static getSocialSubjects() {
    return this.getSubjectsByCategory('social');
  }
}

module.exports = Subjects;