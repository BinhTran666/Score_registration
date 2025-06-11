exports.up = function(knex) {
  return knex.schema.createTable('subject_statistics', function(table) {
    table.increments('id').primary();
    table.string('subject_code', 20).notNullable().comment('Subject code: toan, ngu_van, etc');
    table.string('subject_name', 100).notNullable().comment('Subject display name');
    table.string('score_level', 20).notNullable().comment('excellent, good, average, poor');
    table.decimal('min_score', 4, 2).notNullable().comment('Minimum score for level');
    table.decimal('max_score', 4, 2).nullable().comment('Maximum score for level');
    table.integer('student_count').defaultTo(0).comment('Number of students in this level');
    table.decimal('percentage', 5, 2).defaultTo(0).comment('Percentage of students in this level');
    table.timestamp('calculated_at').defaultTo(knex.fn.now()).comment('When statistics were calculated');
    table.timestamps(true, true);
    
    // Indexes for fast retrieval
    table.index('subject_code', 'idx_subject_code');
    table.index('score_level', 'idx_score_level');
    table.index(['subject_code', 'score_level'], 'idx_subject_level');
    table.unique(['subject_code', 'score_level'], 'uk_subject_score_level');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('subject_statistics');
};