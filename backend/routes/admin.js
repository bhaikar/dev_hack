const express = require('express');
const router = express.Router();
const { SelectedTeam, RegistrationDone } = require('../models/Team');
const XLSX = require('xlsx');

// GET /api/admin/stats - Get statistics
router.get('/stats', async (req, res) => {
  try {
    const totalTeams = await SelectedTeam.countDocuments();
    const checkedInTeams = await SelectedTeam.countDocuments({ isCheckedIn: true });
    const pendingTeams = totalTeams - checkedInTeams;

    res.status(200).json({
      success: true,
      stats: {
        total: totalTeams,
        checkedIn: checkedInTeams,
        pending: pendingTeams
      }
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// GET /api/admin/all-teams - Get all teams with status
router.get('/all-teams', async (req, res) => {
  try {
    const teams = await SelectedTeam.find()
      .sort({ isCheckedIn: -1, checkInTime: -1, teamId: 1 })
      .select('teamId teamName college members contactNumber email isCheckedIn checkInTime')
      .lean(); // Convert to plain JavaScript objects

    // Format the response
    const formattedTeams = teams.map(team => ({
      teamId: team.teamId,
      teamName: team.teamName,
      college: team.college,
      members: team.members || [],
      contactNumber: team.contactNumber || '',
      email: team.email || '',
      isCheckedIn: team.isCheckedIn || false,
      checkInTime: team.checkInTime || null
    }));

    res.status(200).json({
      success: true,
      count: formattedTeams.length,
      teams: formattedTeams
    });

  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching teams',
      error: error.message
    });
  }
});

// GET /api/admin/checked-in-teams - Get only checked-in teams
router.get('/checked-in-teams', async (req, res) => {
  try {
    const teams = await RegistrationDone.find()
      .sort({ checkInTime: -1 });

    res.status(200).json({
      success: true,
      count: teams.length,
      teams: teams
    });

  } catch (error) {
    console.error('Get checked-in teams error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching checked-in teams',
      error: error.message
    });
  }
});

// POST /api/admin/manual-checkin - Manually check-in a team
router.post('/manual-checkin', async (req, res) => {
  try {
    const { teamId } = req.body;

    if (!teamId) {
      return res.status(400).json({
        success: false,
        message: 'Team ID is required'
      });
    }

    const normalizedTeamId = teamId.trim().toUpperCase();

    // Find team
    const team = await SelectedTeam.findOne({ teamId: normalizedTeamId });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    // Check if already checked in
    if (team.isCheckedIn) {
      return res.status(400).json({
        success: false,
        message: 'Team already checked in'
      });
    }

    // Mark as checked in
    team.isCheckedIn = true;
    team.checkInTime = new Date();
    await team.save();

    // Add to registration done
    const registration = new RegistrationDone({
      teamId: team.teamId,
      teamName: team.teamName,
      checkInTime: team.checkInTime,
      status: 'present'
    });
    await registration.save();

    res.status(200).json({
      success: true,
      message: 'Team checked in successfully',
      team: {
        teamId: team.teamId,
        teamName: team.teamName,
        checkInTime: team.checkInTime
      }
    });

  } catch (error) {
    console.error('Manual check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during manual check-in',
      error: error.message
    });
  }
});

// DELETE /api/admin/undo-checkin/:teamId - Undo check-in
router.delete('/undo-checkin/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const normalizedTeamId = teamId.trim().toUpperCase();

    // Find team
    const team = await SelectedTeam.findOne({ teamId: normalizedTeamId });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    if (!team.isCheckedIn) {
      return res.status(400).json({
        success: false,
        message: 'Team is not checked in'
      });
    }

    // Undo check-in
    team.isCheckedIn = false;
    team.checkInTime = null;
    await team.save();

    // Remove from registration done
    await RegistrationDone.deleteOne({ teamId: normalizedTeamId });

    res.status(200).json({
      success: true,
      message: 'Check-in undone successfully'
    });

  } catch (error) {
    console.error('Undo check-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Error undoing check-in',
      error: error.message
    });
  }
});

// GET /api/admin/export - Export checked-in teams to Excel
router.get('/export', async (req, res) => {
  try {
    const checkedInTeams = await RegistrationDone.find().sort({ checkInTime: 1 });

    if (checkedInTeams.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No teams checked in yet'
      });
    }

    // Prepare data for Excel
    const excelData = checkedInTeams.map((team, index) => ({
      'S.No': index + 1,
      'Team ID': team.teamId,
      'Team Name': team.teamName,
      'Check-in Time': new Date(team.checkInTime).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'medium'
      }),
      'Status': team.status.toUpperCase()
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    ws['!cols'] = [
      { wch: 8 },  // S.No
      { wch: 15 }, // Team ID
      { wch: 30 }, // Team Name
      { wch: 25 }, // Check-in Time
      { wch: 12 }  // Status
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Checked-In Teams');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    const filename = `HACK_MCE_5.0_CheckedIn_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    res.send(buffer);

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting data',
      error: error.message
    });
  }
});

module.exports = router;