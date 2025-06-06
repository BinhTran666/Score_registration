exports.up = function(knex) {
  return knex.schema.createTable('students', function(table) {
    table.increments('id').primary();
    table.string('sbd').notNullable().unique().comment('Student ID from CSV');
    table.decimal('toan', 4, 2).nullable().comment('Math score');
    table.decimal('ngu_van', 4, 2).nullable().comment('Literature score');
    table.decimal('ngoai_ngu', 4, 2).nullable().comment('Foreign language score');
    table.decimal('vat_li', 4, 2).nullable().comment('Physics score');
    table.decimal('hoa_hoc', 4, 2).nullable().comment('Chemistry score');
    table.decimal('sinh_hoc', 4, 2).nullable().comment('Biology score');
    table.decimal('lich_su', 4, 2).nullable().comment('History score');
    table.decimal('dia_li', 4, 2).nullable().comment('Geography score');
    table.decimal('gdcd', 4, 2).nullable().comment('Civic education score');
    table.string('ma_ngoai_ngu').nullable().comment('Foreign language code');
    table.timestamps(true, true);
    
    // Indexes
    table.index('sbd');
    table.index(['toan', 'ngu_van', 'ngoai_ngu']); // Common query pattern
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('students');
};