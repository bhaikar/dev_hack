import express from "express";
import { SelectedTeam, RegistrationDone } from "../models/Team.js";

const router = express.Router();

// ------------------------------
// POST /api/checkin - Check-in a team
// ------------------------------
router.post("/", async (req, res) => {
  try {
    const { teamId } = req.body;

    // Validate input
    if (!teamId) {
      return res.status(400).json({
        success: false,
        message: "Team ID is required",
      });
    }

    const normalizedTeamId = teamId.trim().toUpperCase();

    // Check if team exists in selected teams
    const team = await SelectedTeam.findOne({ teamId: normalizedTeamId });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team ID not found. Please verify your Team ID.",
      });
    }

    // Validate that team has required data
    if (!team.teamName || team.teamName.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Team data is incomplete. Please contact admin.",
      });
    }

    // Check if already checked in
    if (team.isCheckedIn) {
      return res.status(400).json({
        success: false,
        message: "This team has already checked in.",
        team: {
          teamId: team.teamId,
          teamName: team.teamName,
          checkInTime: team.checkInTime,
        },
      });
    }

    // Mark as checked in
    team.isCheckedIn = true;
    team.checkInTime = new Date();
    await team.save();

    // Add to registration done collection
    try {
      const registration = new RegistrationDone({
        teamId: team.teamId,
        teamName: team.teamName,
        checkInTime: team.checkInTime,
        status: "present",
      });
      await registration.save();
    } catch (regError) {
      console.error("Error saving to RegistrationDone:", regError);
      // Continue even if this fails - main check-in is done
    }

    res.status(200).json({
      success: true,
      message: "Team checked in successfully!",
      team: {
        teamId: team.teamId,
        teamName: team.teamName,
        college: team.college,
        members: team.members || [],
        checkInTime: team.checkInTime,
      },
    });
  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during check-in. Please try again.",
      error: error.message,
    });
  }
});

// ------------------------------
// GET /api/checkin/status/:teamId - Check if team is already checked in
// ------------------------------
router.get("/status/:teamId", async (req, res) => {
  try {
    const { teamId } = req.params;
    const normalizedTeamId = teamId.trim().toUpperCase();

    const team = await SelectedTeam.findOne({ teamId: normalizedTeamId });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Team not found",
      });
    }

    res.status(200).json({
      success: true,
      isCheckedIn: team.isCheckedIn,
      checkInTime: team.checkInTime,
      teamName: team.teamName,
    });
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// ------------------------------
// ✅ Export router (ESM syntax)
// ------------------------------
export default router;
