// ========================================
// ✅ Admin Dashboard Script (Final Version)
// ========================================

// Auto-detect backend URL (works locally + on Vercel)
const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000/api"
    : "https://dev-hack-tan.vercel.app/api";

// DOM Elements
const totalTeamsEl = document.getElementById("totalTeams");
const checkedInCountEl = document.getElementById("checkedInCount");
const pendingCountEl = document.getElementById("pendingCount");
const teamTableBody = document.querySelector("#teamTable tbody");
const messageBox = document.getElementById("message");

// ===============================
// Utility: Show message on screen
// ===============================
function showMessage(text, type = "info") {
  messageBox.textContent = text;
  messageBox.className = `message ${type}`;
  messageBox.style.display = "block";
  setTimeout(() => (messageBox.style.display = "none"), 5000);
}

// ========================================
// Utility: Retry fetch to handle cold starts
// ========================================
async function fetchWithRetry(url, options = {}, retries = 1) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (err) {
      if (i === retries) throw err;
      console.warn("Retrying fetch...", i + 1);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

// ============================
// Load all data on page startup
// ============================
async function loadAllData() {
  await Promise.all([loadStats(), loadTeams()]);
}

// =========================================
// Fetch and render overall event statistics
// =========================================
async function loadStats() {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/admin/stats`);
    const data = await response.json();

    if (data.success) {
      totalTeamsEl.textContent = data.stats.total;
      checkedInCountEl.textContent = data.stats.checkedIn;
      pendingCountEl.textContent = data.stats.pending;
      console.log("✅ Stats loaded:", data.stats);
    } else {
      console.warn("⚠️ Unexpected stats response:", data);
      showMessage("Error loading stats.", "error");
    }
  } catch (error) {
    console.error("❌ Error loading stats:", error);
    showMessage("Error loading stats. Please refresh.", "error");
  }
}

// ======================================
// Fetch and render all team information
// ======================================
async function loadTeams() {
  try {
    const response = await fetchWithRetry(`${API_BASE_URL}/admin/all-teams`);
    const data = await response.json();

    if (data.success && Array.isArray(data.teams)) {
      console.log(`✅ Loaded ${data.teams.length} teams`);
      renderTeams(data.teams);
    } else {
      console.warn("⚠️ Unexpected API data:", data);
      throw new Error("Invalid API data structure");
    }
  } catch (error) {
    console.error("❌ Error loading teams:", error);
    showMessage("Error loading teams. Please refresh.", "error");
  }
}

// =========================================
// Render teams inside the table dynamically
// =========================================
function renderTeams(teams) {
  teamTableBody.innerHTML = "";

  teams.forEach((team, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${team.teamId}</td>
      <td>${team.teamName}</td>
      <td>${team.college}</td>
      <td>${team.email}</td>
      <td>${team.isCheckedIn ? "✅" : "❌"}</td>
      <td>${
        team.checkInTime
          ? new Date(team.checkInTime).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            })
          : "-"
      }</td>
    `;
    teamTableBody.appendChild(row);
  });
}

// ==========================================
// Auto refresh data every 15 seconds (live)
// ==========================================
setInterval(loadAllData, 15000);

// Initial page load
window.addEventListener("load", () => {
  console.log("🌐 Admin dashboard loaded");
  loadAllData();
});
