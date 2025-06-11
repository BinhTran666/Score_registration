class Student {
  constructor(data = {}) {
    this.sbd = data.sbd || null;
    this.toan = this.parseScore(data.toan);
    this.ngu_van = this.parseScore(data.ngu_van);
    this.ngoai_ngu = this.parseScore(data.ngoai_ngu);
    this.vat_li = this.parseScore(data.vat_li);
    this.hoa_hoc = this.parseScore(data.hoa_hoc);
    this.sinh_hoc = this.parseScore(data.sinh_hoc);
    this.lich_su = this.parseScore(data.lich_su);
    this.dia_li = this.parseScore(data.dia_li);
    this.gdcd = this.parseScore(data.gdcd);
    this.ma_ngoai_ngu = data.ma_ngoai_ngu || null;
    this.created_at = data.created_at || null;
    this.updated_at = data.updated_at || null;
  }

  parseScore(score) {
    if (score === null || score === undefined || score === '') {
      return 0;
    }
    const parsed = parseFloat(score);
    return isNaN(parsed) ? null : parsed;
  }

  validate() {
    const errors = [];

    if (!this.sbd) {
      errors.push('Student ID (sbd) is required');
    }

    if (this.sbd && !/^\d{8}$/.test(this.sbd)) {
      errors.push('Student ID must be 8 digits');
    }

    // Validate scores (0-10 range)
    const subjects = ['toan', 'ngu_van', 'ngoai_ngu', 'vat_li', 'hoa_hoc', 'sinh_hoc', 'lich_su', 'dia_li', 'gdcd'];
    
    subjects.forEach(subject => {
      const score = this[subject];
      if (score !== null && (score < 0 || score > 10)) {
        errors.push(`${subject} score must be between 0 and 10`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  toJSON() {
    return {
      sbd: this.sbd,
      toan: this.toan,
      ngu_van: this.ngu_van,
      ngoai_ngu: this.ngoai_ngu,
      vat_li: this.vat_li,
      hoa_hoc: this.hoa_hoc,
      sinh_hoc: this.sinh_hoc,
      lich_su: this.lich_su,
      dia_li: this.dia_li,
      gdcd: this.gdcd,
      ma_ngoai_ngu: this.ma_ngoai_ngu,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  getSubjectScores() {
    return {
      toan: this.toan,
      ngu_van: this.ngu_van,
      ngoai_ngu: this.ngoai_ngu,
      vat_li: this.vat_li,
      hoa_hoc: this.hoa_hoc,
      sinh_hoc: this.sinh_hoc,
      lich_su: this.lich_su,
      dia_li: this.dia_li,
      gdcd: this.gdcd
    };
  }

  getAvailableSubjects() {
    const scores = this.getSubjectScores();
    return Object.keys(scores).filter(subject => scores[subject] !== null);
  }
}

module.exports = Student;