const POMODORO_DURATION = 25 * 60; 
const SHORT_BREAK_DURATION = 5 * 60; 
const HISTORY_KEY = 'pomodory_history';
const DARK_MODE_KEY = 'darkModeEnabled';

const SERVICES = {
    MEME: 'http://localhost:5001/meme',
    QUOTE: 'http://localhost:5002/quote',
    TIP: 'http://localhost:5003/tip',
    ACTIVITY: 'http://localhost:5004/activity'
};

let currentTime = POMODORO_DURATION;
let timerInterval = null; 
let isPaused = true;
let sessionType = 'focus'; 

const screens = document.querySelectorAll('.screen-container');
const timerDisplay = document.getElementById('timer-display');
const timerModeTitle = document.getElementById('timer-mode-title');
const startPauseBtn = document.getElementById('start-pause-btn');
const historyListShort = document.getElementById('history-list');
const historyListFull = document.getElementById('full-history-list');
const totalSessionsSpan = document.getElementById('total-sessions');
const shortcutButtons = document.querySelectorAll('.shortcut-btn[data-target], .back-btn');
const timerBox = document.querySelector('.timer-box');
const darkModeToggleBtn = document.getElementById('dark-mode-toggle'); 
const sessionNameInput = document.getElementById('session-name');
const startBreakBtn = document.getElementById('start-break-btn');
const skipBreakBtn = document.getElementById('skip-break-btn');

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('/auth/validate-session');
        const data = await res.json();
        
        if (data.authenticated) {
            document.querySelector('#page-login').classList.add('hidden');
            document.querySelector('#page-login').classList.remove('visible');
            
            document.querySelector('#page-welcome').classList.remove('hidden');
            document.querySelector('#page-welcome').classList.add('visible');
            
            if(document.querySelector('#page-welcome h1')) {
                document.querySelector('#page-welcome h1').innerText = `Welcome back, ${data.user.username}! 🌟`;
                document.querySelector('#user-display').innerText = data.user.username;
            }
            renderHistory('short');
        }
    } catch (e) {
        console.log("Not logged in");
    }
});

function showRegister() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
}

function showLogin() {
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
}

const loginForm = document.getElementById('login-form');
if(loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        const res = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) window.location.reload();
        else document.getElementById('login-error').innerText = result.Error || "Login failed";
    });
}

const registerForm = document.getElementById('register-form');
if(registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        const payload = { username: data.username, password: data.password, details: { bio: data.details } };
        const res = await fetch('/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (result.success) {
            alert("Account created! Please log in.");
            showLogin();
        } else {
            document.getElementById('register-error').innerText = result.Error || "Failed";
        }
    });
}

async function logout() {
    await fetch('/auth/logout', { method: 'POST' });
    window.location.reload();
}
function updateDisplay() {
    const minutes = Math.floor(currentTime / 60);
    const seconds = currentTime % 60;
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    timerDisplay.textContent = formatted;
    document.title = `(${formatted}) Pomodory`;
    
    if(timerModeTitle) timerModeTitle.textContent = sessionType === 'focus' ? 'Focus Session' : 'Break Time';

    if(sessionNameInput) {
        sessionNameInput.style.display = sessionType === 'break' ? 'none' : 'block';
    }

    if (timerBox) {
        timerBox.style.backgroundColor = sessionType === 'focus' ? 'rgba(0,0,0,0.03)' : 'rgba(33, 150, 243, 0.1)';
    }

    if (isPaused) {
        startPauseBtn.textContent = 'Start';
        startPauseBtn.classList.add('primary-btn');
        startPauseBtn.classList.remove('secondary-btn');
    } else {
        startPauseBtn.textContent = (sessionType === 'focus' ? 'Pause Focus' : 'Pause Break');
        startPauseBtn.classList.remove('primary-btn');
        startPauseBtn.classList.add('secondary-btn');
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
    if (targetId === 'page-welcome') renderHistory('short');
    if (targetId === 'page-history') renderHistory('full');
    if (targetId === 'page-account') updateAccountInfo();
}

async function fetchBreakContent() {
    const isDevClick = event && event.target && event.target.classList.contains('dev-btn');
    if(isDevClick) {
        sessionType = 'break';
        currentTime = SHORT_BREAK_DURATION;
        updateDisplay(); 
        showScreen('page-break');
    }

    const fetchWithTimeout = (url) => Promise.race([
        fetch(url),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 2000))
    ]);

    try {
        try {
            const res = await fetchWithTimeout(SERVICES.MEME);
            const data = await res.json();
            document.getElementById('break-meme').src = data.url;
        } catch (e) { document.getElementById('break-meme').src = "https://i.imgflip.com/1ur9b0.jpg"; }

        try {
            const res = await fetchWithTimeout(SERVICES.QUOTE);
            const data = await res.json();
            document.getElementById('break-quote').textContent = `"${data.text}" — ${data.author}`;
        } catch (e) { document.getElementById('break-quote').textContent = '"Relaxation is the stepping stone to tranquility."'; }

        try {
            const res = await fetchWithTimeout(SERVICES.ACTIVITY);
            const data = await res.json();
            document.getElementById('break-activity').textContent = data.activity;
        } catch (e) { document.getElementById('break-activity').textContent = "Stretch your neck and shoulders."; }
    } catch (error) { console.log("Global fetch error", error); }
}

function tick() {
    if (currentTime > 0) {
        currentTime--;
        updateDisplay();
    } else {
        clearInterval(timerInterval);
        isPaused = true;
        if (sessionType === 'focus') {
            logSession(25); 
            sessionType = 'break'; 
            fetchBreakContent();
            showScreen('page-break');
            currentTime = SHORT_BREAK_DURATION;
        } else { 
            sessionType = 'focus'; 
            alert("Break finished! Time to focus again."); 
            isPaused = true;
            currentTime = POMODORO_DURATION;
            updateDisplay();
            showScreen('page-welcome');
        }
    }
}

function startPauseTimer() {
    if (isPaused) {
        isPaused = false;
        timerInterval = setInterval(tick, 1000);
    } else {
        isPaused = true;
        clearInterval(timerInterval);
    }
    updateDisplay();
}

function resetTimer() {
    clearInterval(timerInterval);
    isPaused = true;
    currentTime = (sessionType === 'focus' ? POMODORO_DURATION : SHORT_BREAK_DURATION);
    updateDisplay();
}

function getHistory() { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }

function logSession(duration) {
    const history = getHistory();
    const now = new Date();
    const nameVal = sessionNameInput.value.trim();
    const displayName = nameVal || "Focus Session";
    history.unshift({ 
        name: displayName,
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: duration
    });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function renderHistory(type) {
    const history = getHistory();
    const targetList = (type === 'short') ? historyListShort : historyListFull;
    if(!targetList) return;
    targetList.innerHTML = ''; 
    const displayHistory = (type === 'short') ? history.slice(0, 3) : history; 
    if (displayHistory.length === 0) {
        targetList.innerHTML = `<li class="placeholder">No sessions logged yet.</li>`;
        return;
    }
    displayHistory.forEach(s => {
        const li = document.createElement('li');
        const sName = s.name || "Focus Session";
        li.innerHTML = `
            <div style="text-align: left;">
                <div style="font-weight:bold; color: var(--text-main); font-size: 1em;">${sName}</div>
                <div style="font-size:0.8em; color: var(--text-sub);">${s.date} • ${s.time}</div>
            </div>
            <div style="font-weight:800; color: var(--primary); font-size: 1.1em;">
                ${s.duration} min
            </div>
        `;
        targetList.appendChild(li);
    });
}

function updateAccountInfo() {
    const total = getHistory().length;
    if(totalSessionsSpan) totalSessionsSpan.textContent = total;
}

shortcutButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-target');
        if(document.getElementById('page-timer').classList.contains('visible') && target !== 'page-timer') resetTimer(false);
        if (target) showScreen(target);
    });
});

startPauseBtn.addEventListener('click', startPauseTimer);
if(startBreakBtn) startBreakBtn.addEventListener('click', () => { showScreen('page-timer'); updateDisplay(); startPauseTimer(); });
if(skipBreakBtn) skipBreakBtn.addEventListener('click', () => { sessionType = 'focus'; currentTime = POMODORO_DURATION; isPaused = true; updateDisplay(); showScreen('page-timer'); });
if(darkModeToggleBtn) darkModeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem(DARK_MODE_KEY, document.body.classList.contains('dark-mode'));
});
if(localStorage.getItem(DARK_MODE_KEY) === 'true') document.body.classList.add('dark-mode');

window.fetchBreakContent = fetchBreakContent;
window.showRegister = showRegister;
window.showLogin = showLogin;
window.logout = logout;

updateDisplay();