const mongoose = require('mongoose');
const XLSX = require('xlsx');
const path = require('path');
const { SelectedTeam } = require('../models/Team');
require('dotenv').config(); // Load environment variables

// MongoDB Connection - Use Atlas or local
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hackmce5';

async function importTeamsFromExcel() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');

    // Read Excel file
    const excelFilePath = path.join(__dirname, '../data/SelectedTeams.xlsx');
    console.log('📂 Reading Excel file:', excelFilePath);

    const workbook = XLSX.readFile(excelFilePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    console.log(`📊 Found ${data.length} rows in Excel file`);

    if (data.length === 0) {
      console.log('⚠️  No data found in Excel file');
      process.exit(0);
    }

    // Show first row to see column names
    console.log('\n📋 First row sample:', JSON.stringify(data[0], null, 2));
    console.log('\n📋 Available columns:', Object.keys(data[0]));

    // Ask user to confirm before clearing
    console.log('\n⚠️  This will CLEAR existing data and import fresh data!');
    
    // Clear existing data
    const deletedCount = await SelectedTeam.deleteMany({});
    console.log(`🗑️  Cleared ${deletedCount.deletedCount} existing teams\n`);

    // Import teams
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Flexible column mapping - handles different column name variations
        const teamData = {
          teamId: (
            row['Team ID'] || 
            row['TeamID'] || 
            row['team_id'] || 
            row['id'] ||
            row['ID'] ||
            `HACK${String(i + 1).padStart(3, '0')}`  // Auto-generate if missing
          ).toString().trim().toUpperCase(),
          
          teamName: (
            row['Team Name'] || 
            row['TeamName'] || 
            row['team_name'] || 
            row['name'] ||
            row['Name'] ||
            ''
          ).toString().trim(),
          
          college: (
            row['College'] || 
            row['college'] || 
            row['Institution'] ||
            'Malnad College of Engineering'
          ).toString().trim(),
          
          members: [
            row['Member 1'] || row['member_1'] || row['Member1'],
            row['Member 2'] || row['member_2'] || row['Member2'],
            row['Member 3'] || row['member_3'] || row['Member3'],
            row['Member 4'] || row['member_4'] || row['Member4']
          ].filter(member => member && member.toString().trim() !== '')
           .map(member => member.toString().trim()),
          
          contactNumber: (
            row['Contact'] || 
            row['contact'] || 
            row['Phone'] || 
            row['Mobile'] ||
            row['Contact Number'] ||
            ''
          ).toString().trim(),
          
          email: (
            row['Email'] || 
            row['email'] || 
            row['E-mail'] ||
            ''
          ).toString().trim(),
          
          isCheckedIn: false,
          checkInTime: null
        };

        // Validate required fields
        if (!teamData.teamId) {
          errors.push({ row: i + 1, error: 'Missing Team ID' });
          errorCount++;
          continue;
        }

        if (!teamData.teamName || teamData.teamName === '') {
          errors.push({ 
            row: i + 1, 
            teamId: teamData.teamId, 
            error: 'Missing Team Name' 
          });
          errorCount++;
          continue;
        }

        // Create team
        await SelectedTeam.create(teamData);
        successCount++;
        console.log(`✅ Row ${i + 1}: ${teamData.teamId} - ${teamData.teamName}`);

      } catch (error) {
        console.error(`❌ Row ${i + 1} Error:`, error.message);
        errors.push({ 
          row: i + 1, 
          error: error.message 
        });
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Successfully imported: ${successCount} teams`);
    console.log(`❌ Failed to import: ${errorCount} teams`);
    console.log(`📈 Total teams in database: ${await SelectedTeam.countDocuments()}`);
    
    if (errors.length > 0 && errors.length <= 10) {
      console.log('\n❌ Errors:');
      errors.forEach(err => {
        console.log(`   Row ${err.row}: ${err.error}${err.teamId ? ` (Team ID: ${err.teamId})` : ''}`);
      });
    } else if (errors.length > 10) {
      console.log(`\n❌ ${errors.length} errors occurred (showing first 10):`);
      errors.slice(0, 10).forEach(err => {
        console.log(`   Row ${err.row}: ${err.error}${err.teamId ? ` (Team ID: ${err.teamId})` : ''}`);
      });
    }

    console.log('='.repeat(60) + '\n');

    // Show sample of imported data
    const sampleTeams = await SelectedTeam.find().limit(3);
    console.log('📋 Sample of imported teams:');
    sampleTeams.forEach(team => {
      console.log(`   ${team.teamId} - ${team.teamName} (${team.members.length} members)`);
    });

    process.exit(0);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run import
importTeamsFromExcel();