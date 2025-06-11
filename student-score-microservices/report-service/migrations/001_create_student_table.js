/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('students', function(table) {
    table.increments('id').primary();
    table.string('sbd', 20).unique().notNullable().comment('Student ID');
    
    // Subject scores (nullable, decimal with 2 decimal places)
    table.decimal('toan', 4, 2).nullable().comment('Mathematics');
    table.decimal('ngu_van', 4, 2).nullable().comment('Vietnamese Literature');
    table.decimal('ngoai_ngu', 4, 2).nullable().comment('Foreign Language');
    table.decimal('vat_li', 4, 2).nullable().comment('Physics');
    table.decimal('hoa_hoc', 4, 2).nullable().comment('Chemistry');
    table.decimal('sinh_hoc', 4, 2).nullable().comment('Biology');
    table.decimal('lich_su', 4, 2).nullable().comment('History');
    table.decimal('dia_li', 4, 2).nullable().comment('Geography');
    table.decimal('gdcd', 4, 2).nullable().comment('Civic Education');
    
    // Foreign language code
    table.string('ma_ngoai_ngu', 10).nullable().comment('Foreign Language Code');
    
    // Timestamps
    table.timestamps(true, true);
    
    // Composite indexes for performance
    table.index(['toan', 'vat_li', 'hoa_hoc'], 'idx_group_a_subjects');
    table.index(['toan', 'hoa_hoc', 'sinh_hoc'], 'idx_group_b_subjects');
    table.index(['ngu_van', 'lich_su', 'dia_li'], 'idx_group_c_subjects');
    table.index(['toan', 'ngu_van', 'ngoai_ngu'], 'idx_group_d_subjects');
    
    table.comment('Student exam scores table for report service');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('students');
};