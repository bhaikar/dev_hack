 // API Base URL
        const API_BASE_URL = 'http://localhost:3000/api';
        let allTeams = [];

        // Load all data on page load
        window.addEventListener('load', () => {
            loadAllData();
        });

        // Load all data (stats + teams)
        async function loadAllData() {
            await loadStats();
            await loadTeams();
        }

        // Load statistics
        async function loadStats() {
            try {
                const response = await fetch(`${API_BASE_URL}/admin/stats`);
                const data = await response.json();

                if (response.ok && data.success) {
                    document.getElementById('totalTeams').textContent = data.stats.total;
                    document.getElementById('checkedInCount').textContent = data.stats.checkedIn;
                    document.getElementById('pendingCount').textContent = data.stats.pending;
                    
                    const rate = data.stats.total > 0 
                        ? Math.round((data.stats.checkedIn / data.stats.total) * 100)
                        : 0;
                    document.getElementById('attendanceRate').textContent = rate + '%';
                }
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        }

        // Load all teams
        async function loadTeams() {
            try {
                const response = await fetch(`${API_BASE_URL}/admin/all-teams`);
                const data = await response.json();

                if (response.ok && data.success) {
                    allTeams = data.teams;
                    renderTeams(allTeams);
                }
            } catch (error) {
                console.error('Error loading teams:', error);
                document.getElementById('teamsTableBody').innerHTML = `
                    <tr><td colspan="6" style="text-align: center; color: #dc2626;">
                        Error loading teams. Please refresh.
                    </td></tr>
                `;
            }
        }

        // Render teams table
        function renderTeams(teams) {
            const tbody = document.getElementById('teamsTableBody');
            
            if (teams.length === 0) {
                tbody.innerHTML = `
                    <tr><td colspan="6" style="text-align: center; color: #888;">
                        No teams found
                    </td></tr>
                `;
                return;
            }

            tbody.innerHTML = teams.map((team, index) => {
                // Ensure isCheckedIn is a boolean
                const checkedIn = team.isCheckedIn === true || team.isCheckedIn === 'true';
                
                return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${team.teamId}</td>
                    <td>${team.teamName}</td>
                    <td>
                        <span class="status-badge ${checkedIn ? 'status-checked-in' : 'status-pending'}">
                            ${checkedIn ? '✓ Checked In' : '⏳ Pending'}
                        </span>
                    </td>
                    <td>${team.checkInTime ? new Date(team.checkInTime).toLocaleString() : '-'}</td>
                    <td>
                        ${checkedIn
                            ? `<button class="action-btn undo" onclick="undoCheckIn('${team.teamId}')">Undo</button>`
                            : `<button class="action-btn" onclick="manualCheckIn('${team.teamId}')">Check In</button>`
                        }
                    </td>
                </tr>
            `}).join('');
        }

        // Filter teams based on search
        function filterTeams() {
            const searchTerm = document.getElementById('searchInput').value.toLowerCase();
            const filtered = allTeams.filter(team => 
                team.teamId.toLowerCase().includes(searchTerm) ||
                team.teamName.toLowerCase().includes(searchTerm)
            );
            renderTeams(filtered);
        }

        // Manual check-in form
        document.getElementById('manualCheckInForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const teamId = document.getElementById('manualTeamId').value.trim().toUpperCase();
            await manualCheckIn(teamId);
            document.getElementById('manualTeamId').value = '';
        });

        // Manual check-in function
        async function manualCheckIn(teamId) {
            try {
                const response = await fetch(`${API_BASE_URL}/admin/manual-checkin`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ teamId })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showMessage('manualMessage', 'Team checked in successfully!', 'success');
                    await loadAllData();
                } else {
                    showMessage('manualMessage', data.message || 'Check-in failed', 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showMessage('manualMessage', 'Network error', 'error');
            }
        }

        // Undo check-in
        async function undoCheckIn(teamId) {
            if (!confirm(`Are you sure you want to undo check-in for ${teamId}?`)) {
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/admin/undo-checkin/${teamId}`, {
                    method: 'DELETE'
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    await loadAllData();
                } else {
                    alert(data.message || 'Failed to undo check-in');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Network error');
            }
        }

        // Export to Excel
        async function exportToExcel() {
            try {
                const response = await fetch(`${API_BASE_URL}/admin/export`);
                const blob = await response.blob();
                
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `HACK_MCE_5.0_CheckedIn_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } catch (error) {
                console.error('Error exporting:', error);
                alert('Failed to export data');
            }
        }

        // Show message
        function showMessage(elementId, text, type) {
            const messageBox = document.getElementById(elementId);
            messageBox.textContent = text;
            messageBox.className = `message ${type}`;
            messageBox.style.display = 'block';
            
            setTimeout(() => {
                messageBox.style.display = 'none';
            }, 5000);
        }

        // Auto-refresh every 15 seconds
        setInterval(loadAllData, 15000);