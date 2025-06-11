const Subjects = require('../src/config/subjectConfig');
const ScoreLevels = require('../src/config/scoreConfig');

exports.seed = async function(knex) {
  try {
    console.log('🌱 Starting subject statistics seed...');
    
    // Check if students table has data
    const studentCount = await knex('students').count('id as count').first();
    const totalStudents = parseInt(studentCount.count) || 0;
    
    if (totalStudents === 0) {
      console.log('⚠️ No students found in database. Seeding will create empty statistics structure only.');
      console.log('💡 Import student data first, then run: npx knex seed:run');
    } else {
      console.log(`📊 Found ${totalStudents} students in database`);
    }
    
    // Clear existing data
    await knex('subject_statistics').del();
    console.log('🗑️ Cleared existing subject statistics');
    
    const subjects = Subjects.getAllSubjects();
    const levels = ScoreLevels.getAllLevels();
    
    const statisticsData = [];
    
    // Create default records for all subject-level combinations
    for (const subject of subjects) {
      for (const level of levels) {
        statisticsData.push({
          subject_code: subject.code,
          subject_name: subject.name,
          score_level: level.code,
          min_score: level.minScore,
          max_score: level.maxScore,
          student_count: 0,
          percentage: 0.00,
          calculated_at: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }
    
    // Insert all default records
    await knex('subject_statistics').insert(statisticsData);
    console.log(`✅ Inserted ${statisticsData.length} default statistics records`);
    console.log(`📋 ${subjects.length} subjects × ${levels.length} levels = ${statisticsData.length} records`);
    
    // Only calculate statistics if we have student data
    if (totalStudents > 0) {
      console.log('📊 Calculating statistics from student data...');
      
      for (const subject of subjects) {
        await calculateSubjectStatistics(knex, subject);
      }
      
      console.log('✅ Subject statistics calculation completed!');
    } else {
      console.log('⏭️ Skipping statistics calculation (no student data)');
      console.log('🔄 Statistics will be calculated automatically when student data is imported');
    }
    
    console.log('🎉 Subject statistics seed completed successfully!');
    
  } catch (error) {
    console.error('❌ Error in subject statistics seed:', error);
    throw error;
  }
};

// Calculate statistics for a specific subject
async function calculateSubjectStatistics(knex, subject) {
  try {
    console.log(`  📈 Calculating ${subject.name} (${subject.code})...`);
    
    // Get total students with valid scores for this subject
    const totalResult = await knex('students')
      .count('* as count')
      .whereNotNull(subject.code)
      .where(subject.code, '>', 0)
      .first();
    
    const totalStudents = parseInt(totalResult.count) || 0;
    
    if (totalStudents === 0) {
      console.log(`    ⚠️ No valid scores found for ${subject.code}`);
      return;
    }
    
    const levels = ScoreLevels.getAllLevels();
    
    for (const level of levels) {
      // Count students in this score level
      let query = knex('students')
        .count('* as count')
        .whereNotNull(subject.code)
        .where(subject.code, '>', 0)
        .where(subject.code, '>=', level.minScore);
      
      // Handle the highest level (no upper bound)
      if (level.maxScore < 10) {
        query = query.where(subject.code, '<=', level.maxScore);
      }
      
      const levelResult = await query.first();
      const levelCount = parseInt(levelResult.count) || 0;
      const percentage = totalStudents > 0 ? ((levelCount / totalStudents) * 100) : 0;
      
      // Update the statistics record
      await knex('subject_statistics')
        .where({
          subject_code: subject.code,
          score_level: level.code
        })
        .update({
          student_count: levelCount,
          percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
          calculated_at: new Date(),
          updated_at: new Date()
        });
      
      if (levelCount > 0) {
        console.log(`    📊 ${level.name}: ${levelCount} students (${percentage.toFixed(2)}%)`);
      }
    }
    
    console.log(`    ✅ ${subject.name}: ${totalStudents} total students`);
    
  } catch (error) {
    console.error(`❌ Error calculating statistics for ${subject.code}:`, error);
    throw error;
  }
}