// ========== DATA MANAGEMENT ==========
let polls = [];
let currentVotePollId = null;
let selectedOptionIndex = null;

// Load polls from localStorage
function loadPolls() {
    const savedPolls = localStorage.getItem('studentPolls');
    if (savedPolls) {
        polls = JSON.parse(savedPolls);
    } else {
        // Create some sample polls
        polls = [
            {
                id: 1,
                title: "Best Cafeteria on Campus",
                description: "Which cafeteria serves the best food?",
                options: ["Main Cafeteria", "Science Block Cafe", "Engineering Cafeteria", "Student Union Cafe"],
                votes: [45, 32, 28, 40],
                category: "campus-life",
                createdDate: "2025-11-20",
                totalVotes: 145
            },
            {
                id: 2,
                title: "Preferred Lecture Duration",
                description: "How long should regular lectures be?",
                options: ["45 minutes", "60 minutes", "90 minutes", "120 minutes"],
                votes: [25, 60, 40, 15],
                category: "academic",
                createdDate: "2025-11-22",
                totalVotes: 140
            },
            {
                id: 3,
                title: "Library Opening Hours",
                description: "Should the library stay open later?",
                options: ["Yes, until midnight", "Yes, until 10 PM", "No, current hours are fine", "Open 24/7 during exams"],
                votes: [55, 40, 30, 75],
                category: "facilities",
                createdDate: "2025-11-24",
                totalVotes: 200
            }
        ];
        savePolls();
    }
    updateStats();
}

// Save polls to localStorage
function savePolls() {
    localStorage.setItem('studentPolls', JSON.stringify(polls));
}

// Generate unique ID for new polls
function generateId() {
    return polls.length > 0 ? Math.max(...polls.map(p => p.id)) + 1 : 1;
}

// ========== UI UPDATES ==========
// Update statistics on home page
function updateStats() {
    document.getElementById('total-polls').textContent = polls.length;
    
    const totalVotes = polls.reduce((sum, poll) => sum + poll.totalVotes, 0);
    document.getElementById('total-votes').textContent = totalVotes;
    
    const totalSurveys = polls.length; // For simplicity, same as polls
    document.getElementById('total-surveys').textContent = totalSurveys;
}

// Display trending polls on home page
function displayTrendingPolls() {
    const container = document.getElementById('trending-polls');
    container.innerHTML = '';
    
    // Sort by total votes (most popular first)
    const trending = [...polls]
        .sort((a, b) => b.totalVotes - a.totalVotes)
        .slice(0, 4);
    
    trending.forEach(poll => {
        const pollCard = document.createElement('div');
        pollCard.className = 'poll-card';
        
        const categoryLabel = getCategoryLabel(poll.category);
        const maxVotes = Math.max(...poll.votes);
        const leadingOption = poll.options[poll.votes.indexOf(maxVotes)];
        
        pollCard.innerHTML = `
            <h3>${poll.title}</h3>
            <p>${poll.description || 'No description provided.'}</p>
            <div class="category">${categoryLabel}</div>
            <p><strong>Leading:</strong> ${leadingOption} (${maxVotes} votes)</p>
            <div class="votes-count">Total Votes: ${poll.totalVotes}</div>
        `;
        
        container.appendChild(pollCard);
    });
}

// Display active polls in vote section
function displayActivePolls(filterCategory = 'all', searchTerm = '') {
    const container = document.getElementById('active-polls');
    container.innerHTML = '';
    
    let filteredPolls = polls;
    
    // Apply category filter
    if (filterCategory !== 'all') {
        filteredPolls = filteredPolls.filter(poll => poll.category === filterCategory);
    }
    
    // Apply search filter
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filteredPolls = filteredPolls.filter(poll => 
            poll.title.toLowerCase().includes(term) || 
            (poll.description && poll.description.toLowerCase().includes(term))
        );
    }
    
    if (filteredPolls.length === 0) {
        container.innerHTML = `
            <div class="no-polls">
                <p>No polls found. Create the first one!</p>
            </div>
        `;
        return;
    }
    
    filteredPolls.forEach(poll => {
        const pollItem = document.createElement('div');
        pollItem.className = 'poll-item';
        
        const categoryLabel = getCategoryLabel(poll.category);
        
        pollItem.innerHTML = `
            <div class="poll-info">
                <h3>${poll.title}</h3>
                <p>${poll.description || 'No description'}</p>
                <div class="category">${categoryLabel}</div>
                <p>Total Votes: ${poll.totalVotes}</p>
            </div>
            <div class="poll-actions">
                <button class="btn btn-primary vote-btn" data-id="${poll.id}">
                    <i class="fas fa-vote-yea"></i> Vote
                </button>
                <button class="btn btn-secondary view-results-btn" data-id="${poll.id}">
                    <i class="fas fa-chart-bar"></i> Results
                </button>
            </div>
        `;
        
        container.appendChild(pollItem);
    });
    
    // Add event listeners to new buttons
    document.querySelectorAll('.vote-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const pollId = parseInt(this.getAttribute('data-id'));
            openVoteModal(pollId);
        });
    });
    
    document.querySelectorAll('.view-results-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const pollId = parseInt(this.getAttribute('data-id'));
            showPollResults(pollId);
            switchSection('results-section');
        });
    });
}

// Display results in results section
function displayAllResults() {
    const container = document.getElementById('results-list');
    container.innerHTML = '';
    
    polls.forEach(poll => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        const totalVotes = poll.totalVotes;
        const resultsHTML = poll.options.map((option, index) => {
            const votes = poll.votes[index];
            const percentage = totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(1) : 0;
            
            return `
                <div class="result-option">
                    <div class="option-header">
                        <span>${option}</span>
                        <span>${votes} votes (${percentage}%)</span>
                    </div>
                    <div class="result-bar">
                        <div class="result-fill" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        }).join('');
        
        resultItem.innerHTML = `
            <h4>${poll.title}</h4>
            <p>${poll.description || ''}</p>
            ${resultsHTML}
            <p class="total-votes">Total Votes: ${totalVotes}</p>
        `;
        
        container.appendChild(resultItem);
    });
    
    // Update chart with first poll
    if (polls.length > 0) {
        updateChart(polls[0]);
    }
}

// Update chart for a specific poll
function updateChart(poll) {
    const ctx = document.getElementById('results-chart').getContext('2d');
    
    // Destroy previous chart if exists
    if (window.pollChart) {
        window.pollChart.destroy();
    }
    
    const colors = ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'];
    
    window.pollChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: poll.options,
            datasets: [{
                label: 'Votes',
                data: poll.votes,
                backgroundColor: colors.slice(0, poll.options.length),
                borderColor: colors.slice(0, poll.options.length).map(c => c.replace('0.8', '1')),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 10
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: poll.title,
                    font: {
                        size: 16
                    }
                }
            }
        }
    });
}

// Show results for a specific poll
function showPollResults(pollId) {
    const poll = polls.find(p => p.id === pollId);
    if (!poll) return;
    
    updateChart(poll);
    
    // Scroll to chart
    document.querySelector('.chart-container').scrollIntoView({ behavior: 'smooth' });
}

// Get category label for display
function getCategoryLabel(category) {
    const labels = {
        'academic': 'Academic',
        'campus-life': 'Campus Life',
        'facilities': 'Facilities',
        'events': 'Events',
        'suggestions': 'Suggestions'
    };
    return labels[category] || 'General';
}

// ========== MODAL FUNCTIONS ==========
// Open voting modal
function openVoteModal(pollId) {
    const poll = polls.find(p => p.id === pollId);
    if (!poll) return;
    
    currentVotePollId = pollId;
    selectedOptionIndex = null;
    
    document.getElementById('modal-poll-question').textContent = poll.title;
    
    const optionsContainer = document.getElementById('modal-options');
    optionsContainer.innerHTML = '';
    
    poll.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'modal-option';
        optionElement.textContent = option;
        optionElement.dataset.index = index;
        
        optionElement.addEventListener('click', function() {
            // Remove selected class from all options
            document.querySelectorAll('.modal-option').forEach(el => {
                el.classList.remove('selected');
            });
            // Add selected class to clicked option
            this.classList.add('selected');
            selectedOptionIndex = index;
        });
        
        optionsContainer.appendChild(optionElement);
    });
    
    document.getElementById('vote-modal').style.display = 'flex';
}

// Submit vote
function submitVote() {
    if (selectedOptionIndex === null) {
        showToast('Please select an option first!', 'error');
        return;
    }
    
    const pollIndex = polls.findIndex(p => p.id === currentVotePollId);
    if (pollIndex === -1) return;
    
    // Increment vote count
    polls[pollIndex].votes[selectedOptionIndex]++;
    polls[pollIndex].totalVotes++;
    
    savePolls();
    updateStats();
    
    showToast('Your vote has been recorded successfully!');
    
    // Close modal
    document.getElementById('vote-modal').style.display = 'none';
    
    // Refresh displays
    displayActivePolls();
    displayTrendingPolls();
    displayAllResults();
}

// ========== FORM HANDLING ==========
// Create new poll
function createNewPoll() {
    const title = document.getElementById('poll-title').value.trim();
    const description = document.getElementById('poll-description').value.trim();
    const category = document.getElementById('poll-category').value;
    
    const optionInputs = document.querySelectorAll('.poll-option');
    const options = [];
    
    optionInputs.forEach(input => {
        const value = input.value.trim();
        if (value) options.push(value);
    });
    
    // Validation
    if (!title) {
        showToast('Please enter a poll title', 'error');
        return;
    }
    
    if (options.length < 2) {
        showToast('Please add at least 2 options', 'error');
        return;
    }
    
    // Create new poll object
    const newPoll = {
        id: generateId(),
        title,
        description: description || null,
        options,
        votes: new Array(options.length).fill(0),
        category,
        createdDate: new Date().toISOString().split('T')[0],
        totalVotes: 0
    };
    
    // Add to polls array
    polls.push(newPoll);
    savePolls();
    
    // Reset form
    resetPollForm();
    
    // Show success message
    showToast('Poll created successfully!');
    
    // Update UI
    updateStats();
    displayTrendingPolls();
    displayActivePolls();
    displayAllResults();
    
    // Switch to vote section to see the new poll
    switchSection('vote-section');
}

// Reset poll form
function resetPollForm() {
    document.getElementById('poll-title').value = '';
    document.getElementById('poll-description').value = '';
    document.getElementById('poll-category').value = 'academic';
    
    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = `
        <div class="option-input">
            <input type="text" class="poll-option" placeholder="Option 1" required>
            <button type="button" class="btn-remove-option"><i class="fas fa-times"></i></button>
        </div>
        <div class="option-input">
            <input type="text" class="poll-option" placeholder="Option 2" required>
            <button type="button" class="btn-remove-option"><i class="fas fa-times"></i></button>
        </div>
    `;
    
    // Reattach event listeners to remove buttons
    document.querySelectorAll('.btn-remove-option').forEach(btn => {
        btn.addEventListener('click', function() {
            if (document.querySelectorAll('.option-input').length > 2) {
                this.parentElement.remove();
            } else {
                showToast('
