import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  // State
  const [polls, setPolls] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('home');
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [newPoll, setNewPoll] = useState({ 
    title: '', 
    description: '', 
    options: ['', ''] 
  });
  const [vote, setVote] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [matricNumber, setMatricNumber] = useState('');
  const [studentLevel, setStudentLevel] = useState('100');
  const [studentName, setStudentName] = useState('');
  
  // Level statistics for each poll
  const [levelStats, setLevelStats] = useState({});

  // Initialize
  useEffect(() => {
    // Check for dark mode preference
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    
    // Check for saved user
    const savedUser = localStorage.getItem('pollsUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setCurrentUser(userData);
      } catch (e) {
        // Invalid data, show modal
        setTimeout(() => {
          setShowWelcomeModal(true);
        }, 500);
      }
    } else {
      // Show welcome modal for new users
      setTimeout(() => {
        setShowWelcomeModal(true);
      }, 500);
    }

    // Mock polls data with level voting
    const mockPolls = [
      {
        id: 1,
        title: 'Best Campus Cafeteria',
        description: 'Which cafeteria has the best food quality and variety?',
        createdBy: 'CSC/2021/12345',
        votes: [
          { option: 'Rukamat', count: 45, levels: { '100': 15, '200': 12, '300': 10, '400': 5, '500': 3 } },
          { option: 'Exceeding grace', count: 32, levels: { '100': 10, '200': 8, '300': 7, '400': 4, '500': 3 } },
          { option: 'Mum pee', count: 23, levels: { '100': 5, '200': 7, '300': 6, '400': 3, '500': 2 } },
        ],
        participants: 100,
        category: 'Campus Life',
        date: '2025-11-20'
      },
      {
        id: 2,
        title: 'Library Hours Extension',
        description: 'Should the library operate 24/7 during examination periods?',
        createdBy: 'CSC/2021/13145',
        votes: [
          { option: 'Yes, absolutely', count: 78, levels: { '100': 30, '200': 22, '300': 15, '400': 8, '500': 3 } },
          { option: 'No, current hours are fine', count: 22, levels: { '100': 5, '200': 7, '300': 6, '400': 3, '500': 1 } },
        ],
        participants: 100,
        category: 'Academic',
        date: '2025-11-15'
      }
    ];
    
    setPolls(mockPolls);
    calculateLevelStats(mockPolls);
  }, []);

  // Calculate level statistics for all polls
  const calculateLevelStats = (pollsData) => {
    const stats = {};
    const levels = ['100', '200', '300', '400', '500'];
    
    pollsData.forEach(poll => {
      poll.votes.forEach(vote => {
        levels.forEach(level => {
          if (vote.levels[level]) {
            if (!stats[level]) stats[level] = { total: 0 };
            stats[level].total += vote.levels[level];
          }
        });
      });
    });
    
    // Calculate percentages for each level
    const totalVotes = Object.values(stats).reduce((sum, level) => sum + level.total, 0);
    Object.keys(stats).forEach(level => {
      stats[level].percentage = totalVotes > 0 ? Math.round((stats[level].total / totalVotes) * 100) : 0;
    });
    
    setLevelStats(stats);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    document.body.className = newDarkMode ? 'dark-theme' : 'light-theme';
  };

  // Set initial theme on load
  useEffect(() => {
    document.body.className = darkMode ? 'dark-theme' : 'light-theme';
  }, [darkMode]);

  // Handle user registration
  const handleUserRegistration = () => {
    if (matricNumber.trim() && studentName.trim() && studentLevel) {
      const userData = {
        id: matricNumber,
        name: studentName,
        level: studentLevel,
        matric: matricNumber
      };
      
      localStorage.setItem('pollsUser', JSON.stringify(userData));
      setCurrentUser(userData);
      setShowWelcomeModal(false);
    }
  };

  // Create new poll
  const handleCreatePoll = (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert('Please register first!');
      setShowWelcomeModal(true);
      return;
    }
    
    const newPollObj = {
      id: polls.length + 1,
      title: newPoll.title,
      description: newPoll.description,
      createdBy: currentUser.matric,
      votes: newPoll.options.filter(opt => opt.trim() !== '').map(opt => ({
        option: opt,
        count: 0,
        levels: { '100': 0, '200': 0, '300': 0, '400': 0, '500': 0 }
      })),
      participants: 0,
      category: 'General',
      date: new Date().toISOString().split('T')[0]
    };
    
    setPolls([...polls, newPollObj]);
    calculateLevelStats([...polls, newPollObj]);
    setNewPoll({ title: '', description: '', options: ['', ''] });
    setView('home');
    alert('Poll created successfully!');
  };

  // Submit vote with level tracking
  const handleVote = () => {
    if (!vote) {
      alert('Please select an option');
      return;
    }
    
    if (!currentUser) {
      alert('Please register first!');
      setShowWelcomeModal(true);
      return;
    }
    
    const userLevel = currentUser.level;
    
    const updatedPolls = polls.map(poll => {
      if (poll.id === selectedPoll.id) {
        const updatedVotes = poll.votes.map(v => {
          if (v.option === vote) {
            const updatedLevels = { ...v.levels };
            updatedLevels[userLevel] = (updatedLevels[userLevel] || 0) + 1;
            
            return {
              ...v,
              count: v.count + 1,
              levels: updatedLevels
            };
          }
          return v;
        });
        
        return {
          ...poll,
          votes: updatedVotes,
          participants: poll.participants + 1
        };
      }
      return poll;
    });
    
    setPolls(updatedPolls);
    calculateLevelStats(updatedPolls);
    setView('results');
    setVote('');
    alert('Vote submitted!');
  };

  // Add option to new poll
  const addOption = () => {
    setNewPoll({
      ...newPoll,
      options: [...newPoll.options, '']
    });
  };

  // Update option in new poll
  const updateOption = (index, value) => {
    const newOptions = [...newPoll.options];
    newOptions[index] = value;
    setNewPoll({
      ...newPoll,
      options: newOptions
    });
  };

  // Calculate percentage
  const calculatePercentage = (count, total) => {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  };

  // Render level statistics circles
  const renderLevelStatistics = () => {
    const levels = ['100', '200', '300', '400', '500'];
    
    return (
      <div className="level-stats-container">
        <h3 className="level-stats-title">📊 Voting Statistics by Level</h3>
        <div className="level-circles">
          {levels.map(level => {
            const stats = levelStats[level] || { total: 0, percentage: 0 };
            const radius = 40;
            const circumference = 2 * Math.PI * radius;
            const dashOffset = circumference - (stats.percentage / 100) * circumference;
            
            return (
              <div key={level} className={`level-circle level-${level}`}>
                <div className="circle-container">
                  <svg width="100" height="100">
                    <circle
                      className="circle-bg"
                      cx="50"
                      cy="50"
                      r={radius}
                    />
                    <circle
                      className="circle-progress"
                      cx="50"
                      cy="50"
                      r={radius}
                      strokeDasharray={circumference}
                      strokeDashoffset={dashOffset}
                    />
                  </svg>
                  <div className="circle-text">{stats.percentage}%</div>
                </div>
                <div className="level-label">Level {level}</div>
                <div className="level-count">{stats.total} votes</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render different views
  const renderView = () => {
    switch(view) {
      case 'create':
        return (
          <div className="form-container">
            <h2>Create New Poll</h2>
            <form onSubmit={handleCreatePoll}>
              <div className="form-group">
                <label>Poll Title</label>
                <input 
                  type="text" 
                  value={newPoll.title}
                  onChange={(e) => setNewPoll({...newPoll, title: e.target.value})}
                  required
                  placeholder="Enter poll title"
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea 
                  value={newPoll.description}
                  onChange={(e) => setNewPoll({...newPoll, description: e.target.value})}
                  required
                  placeholder="Describe your poll"
                />
              </div>
              
              <div className="form-group">
                <label>Options (Minimum 2)</label>
                {newPoll.options.map((option, index) => (
                  <input
                    key={index}
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="form-group"
                    required={index < 2}
                  />
                ))}
                <button 
                  type="button" 
                  onClick={addOption}
                  className="btn btn-secondary"
                  style={{marginTop: '0.5rem'}}
                >
                  Add Option
                </button>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setView('home')}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Poll
                </button>
              </div>
            </form>
          </div>
        );

      case 'vote':
        return (
          <div className="form-container">
            <button 
              className="btn btn-secondary"
              onClick={() => setView('home')}
              style={{marginBottom: '1.5rem'}}
            >
              ← Back to Polls
            </button>
            
            <h2>{selectedPoll.title}</h2>
            <p>{selectedPoll.description}</p>
            
            <div style={{margin: '2rem 0'}}>
              <h3>Select your vote:</h3>
              {selectedPoll.votes.map((option, index) => (
                <div 
                  key={index}
                  className={`vote-option ${vote === option.option ? 'selected' : ''}`}
                  onClick={() => setVote(option.option)}
                >
                  {option.option}
                </div>
              ))}
            </div>
            
            <div className="form-actions">
              <button 
                className="btn btn-primary"
                onClick={handleVote}
                disabled={!vote}
              >
                Submit Vote
              </button>
            </div>
          </div>
        );

      case 'results':
        const poll = polls.find(p => p.id === selectedPoll.id);
        const totalVotes = poll.participants;
        
        return (
          <div className="results-container">
            <button 
              className="btn btn-secondary"
              onClick={() => setView('home')}
              style={{marginBottom: '1.5rem'}}
            >
              ← Back to Polls
            </button>
            
            <h2>{poll.title} - Results</h2>
            <p>{poll.description}</p>
            
            <div style={{marginTop: '2rem'}}>
              <h3>Total Votes: {totalVotes}</h3>
              
              {poll.votes.map((result, index) => (
                <div key={index} style={{margin: '1rem 0'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                    <span>{result.option}</span>
                    <span>{result.count} votes ({calculatePercentage(result.count, totalVotes)}%)</span>
                  </div>
                  <div className="result-bar">
                    <div 
                      className="result-fill"
                      style={{width: `${calculatePercentage(result.count, totalVotes)}%`}}
                    />
                  </div>
                  
                  {/* Level breakdown for this option */}
                  <div style={{marginTop: '0.5rem', fontSize: '0.9rem', color: darkMode ? '#b2bec3' : '#636e72'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                      {['100', '200', '300', '400', '500'].map(level => (
                        <div key={level} style={{textAlign: 'center'}}>
                          <div>Lvl {level}</div>
                          <div>{result.levels[level] || 0}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Level Statistics */}
            {renderLevelStatistics()}
          </div>
        );

      default: // Home view
        return (
          <>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
              <h2>Active Polls</h2>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  if (!currentUser) {
                    setShowWelcomeModal(true);
                  } else {
                    setView('create');
                  }
                }}
              >
                Create New Poll
              </button>
            </div>
            
            <div className="poll-grid">
              {polls.map(poll => (
                <div key={poll.id} className="poll-card">
                  <h3 className="poll-title">{poll.title}</h3>
                  <p className="poll-description">{poll.description}</p>
                  
                  <div className="poll-meta">
                    <span>By: {poll.createdBy}</span>
                    <span>{poll.participants} votes</span>
                  </div>
                  
                  <div style={{display: 'flex', gap: '0.5rem', marginTop: '1rem'}}>
                    <button 
                      className="btn btn-primary"
                      onClick={() => {
                        setSelectedPoll(poll);
                        setView('vote');
                      }}
                    >
                      Vote Now
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => {
                        setSelectedPoll(poll);
                        setView('results');
                      }}
                    >
                      View Results
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Level Statistics on Home Page */}
            {renderLevelStatistics()}
          </>
        );
    }
  };

  return (
    <div className="app">
      {/* Welcome/Registration Modal */}
      {showWelcomeModal && (
        <div className="modal-overlay">
          <div className="welcome-modal">
            <h2>🎓 Bells University Student Registration</h2>
            <p>
              Please register to participate in student polls and surveys.
              Your data helps us analyze voting patterns by academic level.
            </p>
            
            <div className="form-group">
              <label>Matriculation Number</label>
              <input
                type="text"
                className="name-input"
                placeholder="e.g., CSC/2021/001"
                value={matricNumber}
                onChange={(e) => setMatricNumber(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                className="name-input"
                placeholder="Enter your full name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label>Academic Level</label>
              <select 
                className="name-input"
                value={studentLevel}
                onChange={(e) => setStudentLevel(e.target.value)}
              >
                <option value="100">100 Level</option>
                <option value="200">200 Level</option>
                <option value="300">300 Level</option>
                <option value="400">400 Level</option>
                <option value="500">500 Level</option>
              </select>
            </div>
            
            <button 
              className="btn btn-primary"
              onClick={handleUserRegistration}
              disabled={!matricNumber.trim() || !studentName.trim()}
              style={{width: '100%', padding: '1rem'}}
            >
              Register & Continue
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <h1>📊 Bells Poll Portal</h1>
        
        <div className="header-controls">
          <nav className="nav">
            <a href="#" onClick={(e) => { e.preventDefault(); setView('home'); }}>
              Home
            </a>
            <a href="#" onClick={(e) => { e.preventDefault(); setView('create'); }}>
              Create Poll
            </a>
          </nav>
          
          <button 
            className="theme-toggle"
            onClick={toggleDarkMode}
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
          
          {currentUser && (
            <div className="user-welcome">
              👤 {currentUser.name} (Lvl {currentUser.level})
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="main">
        {renderView()}
      </main>

      {/* Simplified Footer */}
      <footer className="footer">
        <p>© 2026 Dev-x235 |  Student Polls & Surveys Portal</p>
        <p className="copyright">
        </p>
      </footer>
    </div>
  );
}

export default App;