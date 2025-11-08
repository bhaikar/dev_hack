  // API Base URL - Update this with your backend URL
        const API_BASE_URL = 'http://localhost:3000/api';

        // DOM Elements
        const checkInForm = document.getElementById('checkInForm');
        const teamIdInput = document.getElementById('teamId');
        const checkInBtn = document.getElementById('checkInBtn');
        const messageBox = document.getElementById('message');
        const checkedInCount = document.getElementById('checkedInCount');
        const totalTeams = document.getElementById('totalTeams');
        const pendingCount = document.getElementById('pendingCount');

        // Load stats on page load
        loadStats();

        // Form submission
        checkInForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const teamId = teamIdInput.value.trim().toUpperCase();
            
            if (!teamId) {
                showMessage('Please enter a Team ID', 'error');
                return;
            }

            await checkInTeam(teamId);
        });

        // Check-in team function
        async function checkInTeam(teamId) {
            try {
                // Show loading state
                checkInBtn.classList.add('loading');
                checkInBtn.disabled = true;
                messageBox.style.display = 'none';

                // API call to check-in
                const response = await fetch(`${API_BASE_URL}/checkin`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ teamId })
                });

                const data = await response.json();

                // Reset button state
                checkInBtn.classList.remove('loading');
                checkInBtn.disabled = false;

                if (response.ok && data.success) {
                    // Success
                    showMessage('Team checked in successfully!', 'success', data.team);
                    teamIdInput.value = '';
                    loadStats();
                    
                    // Auto-clear message after 5 seconds
                    setTimeout(() => {
                        messageBox.style.display = 'none';
                    }, 5000);
                } else {
                    // Error
                    showMessage(data.message || 'Check-in failed. Please try again.', 'error');
                }

            } catch (error) {
                console.error('Error:', error);
                checkInBtn.classList.remove('loading');
                checkInBtn.disabled = false;
                showMessage('Network error. Please check your connection.', 'error');
            }
        }

        // Load statistics
        async function loadStats() {
            try {
                const response = await fetch(`${API_BASE_URL}/admin/stats`);
                const data = await response.json();

                if (response.ok && data.success) {
                    checkedInCount.textContent = data.stats.checkedIn;
                    totalTeams.textContent = data.stats.total;
                    pendingCount.textContent = data.stats.pending;
                }
            } catch (error) {
                console.error('Error loading stats:', error);
            }
        }

        // Show message function
        function showMessage(text, type, teamData = null) {
            messageBox.className = `message ${type}`;
            
            let content = `<p>${text}</p>`;
            
            if (type === 'success' && teamData) {
                content += `
                    <div class="team-details">
                        <p><strong>Team ID:</strong> ${teamData.teamId}</p>
                        <p><strong>Team Name:</strong> ${teamData.teamName}</p>
                        <p><strong>Check-in Time:</strong> ${new Date(teamData.checkInTime).toLocaleString()}</p>
                    </div>
                `;
            }
            
            messageBox.innerHTML = content;
            messageBox.style.display = 'block';
        }

        // Auto-refresh stats every 10 seconds
        setInterval(loadStats, 10000);

        // Focus on input field on page load
        window.addEventListener('load', () => {
            teamIdInput.focus();
        });

        // Allow Enter key to submit from anywhere
        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && document.activeElement !== teamIdInput) {
                teamIdInput.focus();
            }
        });