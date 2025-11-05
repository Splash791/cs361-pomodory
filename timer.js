const POMODORO_DURATION = 25 * 60; 
const SHORT_BREAK_DURATION = 5 * 60; 
const HISTORY_KEY = 'pomodory_history';
const DARK_MODE_KEY = 'darkModeEnabled';
let currentTime = POMODORO_DURATION;
let timerInterval = null; 
let isPaused = true;
let sessionType = 'focus'; 
const screens = document.querySelectorAll('.screen-container');
const timerDisplay = document.getElementById('timer-display');
const startPauseBtn = document.getElementById('start-pause-btn');
const resetBtn = document.getElementById('reset-btn');
const saveBtn = document.getElementById('save-btn');
const historyListShort = document.getElementById('history-list');
const historyListFull = document.getElementById('full-history-list');
const totalSessionsSpan = document.getElementById('total-sessions');
const shortcutButtons = document.querySelectorAll('.shortcut-btn, .back-btn');
const feedbackForm = document.getElementById('feedback-form');
const feedbackMessage = document.getElementById('feedback-message');
const timerBox = document.querySelector('.timer-box');
const darkModeToggleBtn = document.getElementById('dark-mode-toggle'); 

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
function updateDisplay() {
    timerDisplay.textContent = formatTime(currentTime);
    
    if (timerBox) {
       
        timerBox.style.backgroundColor = (sessionType === 'focus' ? '#fffff' : '#047dff'); 
    }
    
    if (isPaused) {
        startPauseBtn.textContent = 'Start';
    } else {
        startPauseBtn.textContent = (sessionType === 'focus' ? 'Pause Focus' : 'Pause Break');
    }
}

function showScreen(targetId) {
    screens.forEach(screen => {
        screen.classList.add('hidden');
        screen.classList.remove('visible');
    });

    const targetScreen = document.getElementById(targetId);
    if (targetScreen) {
        targetScreen.classList.remove('hidden');
        targetScreen.classList.add('visible');
    }
    
    if (targetId === 'page-welcome') {
        renderHistory('short');
    } else if (targetId === 'page-history') {
        renderHistory('full');
    } else if (targetId === 'page-account') {
        updateAccountInfo();
    }
}

function getHistory() {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
}

function logSession(durationInMinutes) {
    const history = getHistory();
    const now = new Date();
    
    history.unshift({ 
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: durationInMinutes
    });
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function renderHistory(type) {
    const history = getHistory();
    const targetList = (type === 'short') ? historyListShort : historyListFull;
    targetList.innerHTML = ''; 

    const displayHistory = (type === 'short') ? history.slice(0, 3) : history; 

    if (displayHistory.length === 0) {
        targetList.innerHTML = `<li class="placeholder">No sessions logged yet.</li>`;
        return;
    }
    
    displayHistory.forEach(session => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <span>${session.duration} focused</span>
            <span style="font-size:0.9em; color:#777;">${session.date} at ${session.time}</span>
        `;
        targetList.appendChild(listItem);
    });
}

function updateAccountInfo() {
    const totalSessions = getHistory().length;
    totalSessionsSpan.textContent = totalSessions;
}

function initializeDarkMode() {
    // Check local storage first
    const isDarkMode = localStorage.getItem(DARK_MODE_KEY) === 'true';
    applyDarkMode(isDarkMode);
}

function toggleDarkMode() {
    const isEnabled = document.body.classList.contains('dark-mode');
    const newState = !isEnabled;
    
    applyDarkMode(newState);
    
    localStorage.setItem(DARK_MODE_KEY, newState);
}

function applyDarkMode(enable) {
    if (enable) {
        document.body.classList.add('dark-mode');
        darkModeToggleBtn.textContent = 'Disable Dark Mode';
    } else {
        document.body.classList.remove('dark-mode');
        darkModeToggleBtn.textContent = 'Enable Dark Mode';
    }
}

function tick() {
    if (currentTime > 0) {
        currentTime--;
        updateDisplay();
    } else {
        clearInterval(timerInterval);
        isPaused = true;
        
        if (sessionType === 'focus') {
            logSession(POMODORO_DURATION / 60); 
            sessionType = 'break'; 
            
            alert("Focus finished! Time for a 5-minute break."); 
            
            currentTime = SHORT_BREAK_DURATION;
            updateDisplay();
            startPauseTimer(); 
            
        } else { 
            sessionType = 'focus'; 
            alert("Break finished! Time to focus again."); 
            resetTimer(false); 
            showScreen('page-welcome');
        }
    }
}

function startPauseTimer() {
    if (isPaused) {
        isPaused = false;
        startPauseBtn.textContent = (sessionType === 'focus' ? 'Pause Focus' : 'Pause Break');
        timerInterval = setInterval(tick, 1000);
        
    } else {
        isPaused = true;
        startPauseBtn.textContent = 'Resume'; 
        clearInterval(timerInterval);
    }
}

function resetTimer(confirmNeeded = true) {
    if (confirmNeeded && !isPaused && !confirm("Are you sure you want to reset the current session?")) {
        return; 
    }

    clearInterval(timerInterval);
    isPaused = true;
    
    currentTime = (sessionType === 'focus' ? POMODORO_DURATION : SHORT_BREAK_DURATION);
    
    updateDisplay();
    startPauseBtn.textContent = 'Start';
}

function saveProgress() {
    if (isPaused || currentTime === (sessionType === 'focus' ? POMODORO_DURATION : SHORT_BREAK_DURATION)) {
        alert("Timer is not running or hasn't accumulated enough time to save.");
        return;
    }
    
    if (sessionType === 'break') {
        alert("Cannot save a break session. Only focus sessions can be saved.");
        return;
    }

    const focusedTimeSeconds = POMODORO_DURATION - currentTime;
    const focusedMinutes = Math.floor(focusedTimeSeconds / 60);

    if (focusedMinutes > 0) {
        logSession(focusedMinutes + ' minutes (Partial)');
        alert(`Progress saved! Logged ${focusedMinutes} minutes of focus.`);
        
        resetTimer(false); 
        showScreen('page-welcome'); 
    } else {
        alert("Focus time must be greater than 1 minute to save progress.");
    }
}

function handleFeedbackSubmit(event) {
    event.preventDefault(); 
    
    const problemName = document.getElementById('problem-name').value;
    const problemDesc = document.getElementById('problem-description').value;
    
    console.log("Feedback Sent:", { title: problemName, description: problemDesc });
    
    feedbackForm.reset();
    feedbackMessage.style.display = 'block';

    setTimeout(() => {
        feedbackMessage.style.display = 'none';
    }, 4000);
}

shortcutButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        const targetId = e.currentTarget.getAttribute('data-target');
        
        if (document.getElementById('page-timer').classList.contains('visible') && targetId !== 'page-timer') {
             resetTimer(true); 
        }
        
        showScreen(targetId);
    });
});

startPauseBtn.addEventListener('click', startPauseTimer);
resetBtn.addEventListener('click', resetTimer);
saveBtn.addEventListener('click', saveProgress);

feedbackForm.addEventListener('submit', handleFeedbackSubmit);

if (darkModeToggleBtn) {
    darkModeToggleBtn.addEventListener('click', toggleDarkMode);
}
updateDisplay(); 
initializeDarkMode(); 
showScreen('page-welcome');