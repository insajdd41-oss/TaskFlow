// ================================================================
// ===== ДАННЫЕ =====
// ================================================================

let tasks = [];
let currentFilter = 'all';
let unlockedAchievements = [];
let activeTimers = {};

// ================================================================
// ===== ДОСТИЖЕНИЯ =====
// ================================================================

const ACHIEVEMENTS = [
    { id: 'first_task', name: 'Первый шаг', desc: 'Выполнить 1 задачу', icon: '🌟', check: s => s.total >= 1 },
    { id: 'task_5', name: 'Мастер задач', desc: 'Выполнить 5 задач', icon: '📋', check: s => s.total >= 5 },
    { id: 'task_10', name: 'Продуктивный', desc: 'Выполнить 10 задач', icon: '🏆', check: s => s.total >= 10 },
    { id: 'task_25', name: 'Король', desc: 'Выполнить 25 задач', icon: '👑', check: s => s.total >= 25 },
    { id: 'task_50', name: 'Легенда', desc: 'Выполнить 50 задач', icon: '🚀', check: s => s.total >= 50 },
    { id: 'speed_3', name: 'Демон скорости', desc: 'Выполнить 3 задачи за день', icon: '⚡', check: s => s.today >= 3 },
    { id: 'week_15', name: 'Недельный воин', desc: 'Выполнить 15 задач за неделю', icon: '📅', check: s => s.week >= 15 },
    { id: 'streak_3', name: 'Серия 3 дня', desc: '3 дня подряд', icon: '🔥', check: s => s.streak >= 3 },
    { id: 'streak_7', name: 'Недельная серия', desc: '7 дней подряд', icon: '⚡', check: s => s.streak >= 7 },
    { id: 'streak_30', name: 'Месяц', desc: '30 дней подряд', icon: '💎', check: s => s.streak >= 30 },
    { id: 'perfect_day', name: 'Идеальный день', desc: 'Все задачи за день (≥3)', icon: '☀️', check: s => s.today >= 3 && s.active === 0 },
    { id: 'all_clear', name: 'Чистота', desc: 'Очистить все выполненные', icon: '🧹', check: s => s.cleared === true },
    { id: 'fast_task', name: 'Скоростной', desc: 'Задача быстрее 1 минуты', icon: '🏃', check: s => s.fastest !== null && s.fastest < 60 },
    { id: 'long_task', name: 'Марафонец', desc: 'Задача дольше 1 часа', icon: '🏃‍♂️', check: s => s.longest !== null && s.longest > 3600 }
];

let streak = 0;
let lastDate = null;
let clearedAll = false;

// ================================================================
// ===== ЗАГРУЗКА / СОХРАНЕНИЕ =====
// ================================================================

function loadData() {
    const saved = localStorage.getItem('tasks');
    if (saved) tasks = JSON.parse(saved);
    
    const ach = localStorage.getItem('achievements');
    if (ach) {
        const data = JSON.parse(ach);
        unlockedAchievements = data.unlocked || [];
        streak = data.streak || 0;
        lastDate = data.lastDate ? new Date(data.lastDate) : null;
        clearedAll = data.clearedAll || false;
    }
    
    renderAll();
}

function saveData() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    localStorage.setItem('achievements', JSON.stringify({
        unlocked: unlockedAchievements,
        streak: streak,
        lastDate: lastDate ? lastDate.toISOString() : null,
        clearedAll: clearedAll
    }));
}

// ================================================================
// ===== ОТРИСОВКА =====
// ================================================================

function renderAll() {
    renderTasks();
    updateStats();
    renderChart();
    renderAchievements();
}

function formatTime(sec) {
    if (sec === null || sec === undefined) return '—';
    if (sec < 60) return Math.floor(sec) + 'с';
    if (sec < 3600) return Math.floor(sec/60) + 'м ' + Math.floor(sec%60) + 'с';
    return Math.floor(sec/3600) + 'ч ' + Math.floor((sec%3600)/60) + 'м';
}

function formatHours(sec) {
    if (!sec) return '0';
    return (sec / 3600).toFixed(1);
}

function renderTasks() {
    const list = document.getElementById('taskList');
    if (!list) return;
    
    let filtered = tasks;
    if (currentFilter === 'active') filtered = tasks.filter(t => !t.completed);
    else if (currentFilter === 'completed') filtered = tasks.filter(t => t.completed);
    
    if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-state">✨ Нет задач</div>';
        return;
    }
    
    list.innerHTML = filtered.map(task => {
        let timerHtml = '';
        if (!task.completed) {
            const elapsed = task.timerStarted ? Math.floor((Date.now() - new Date(task.timerStarted).getTime()) / 1000) : 0;
            timerHtml = `<span class="task-timer" id="timer-${task.id}">⏱️ ${formatTime(elapsed)}</span>`;
        } else if (task.timeSpent !== null && task.timeSpent !== undefined) {
            timerHtml = `<span class="task-timer completed-timer">✅ ${formatTime(task.timeSpent)}</span>`;
        }
        
        return `
            <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text">${escapeHtml(task.text)}</span>
                ${timerHtml}
                <button class="task-delete">🗑️</button>
            </li>
        `;
    }).join('');
    
    attachEvents();
    startTimers();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function attachEvents() {
    document.querySelectorAll('.task-item').forEach(item => {
        const id = parseInt(item.dataset.id);
        const checkbox = item.querySelector('.task-checkbox');
        const deleteBtn = item.querySelector('.task-delete');
        const textSpan = item.querySelector('.task-text');
        
        checkbox.addEventListener('change', () => {
            const task = tasks.find(t => t.id === id);
            if (!task) return;
            
            task.completed = checkbox.checked;
            if (task.completed) {
                if (task.timerStarted) {
                    task.timeSpent = Math.floor((Date.now() - new Date(task.timerStarted).getTime()) / 1000);
                } else if (task.createdAt) {
                    task.timeSpent = Math.floor((Date.now() - new Date(task.createdAt).getTime()) / 1000);
                } else {
                    task.timeSpent = 0;
                }
                task.completedAt = new Date().toISOString();
                task.timerStarted = null;
                if (activeTimers[id]) {
                    clearInterval(activeTimers[id]);
                    delete activeTimers[id];
                }
                checkStreak();
                checkAchievements();
            } else {
                task.timerStarted = new Date().toISOString();
                task.completedAt = null;
                task.timeSpent = null;
            }
            saveData();
            renderAll();
        });
        
        deleteBtn.addEventListener('click', () => {
            if (activeTimers[id]) {
                clearInterval(activeTimers[id]);
                delete activeTimers[id];
            }
            tasks = tasks.filter(t => t.id !== id);
            saveData();
            renderAll();
        });
        
        textSpan.addEventListener('dblclick', () => {
            const task = tasks.find(t => t.id === id);
            if (!task) return;
            const newText = prompt('Редактировать задачу:', task.text);
            if (newText !== null && newText.trim() !== '') {
                task.text = newText.trim();
                saveData();
                renderAll();
            }
        });
    });
}

function startTimers() {
    Object.values(activeTimers).forEach(clearInterval);
    activeTimers = {};
    
    tasks.forEach(task => {
        if (!task.completed && task.timerStarted) {
            const interval = setInterval(() => {
                const el = document.getElementById(`timer-${task.id}`);
                if (el) {
                    const elapsed = Math.floor((Date.now() - new Date(task.timerStarted).getTime()) / 1000);
                    el.textContent = `⏱️ ${formatTime(elapsed)}`;
                }
            }, 1000);
            activeTimers[task.id] = interval;
        }
    });
}

// ================================================================
// ===== СТАТИСТИКА =====
// ================================================================

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;
    const prod = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    let totalTime = 0, count = 0;
    tasks.forEach(t => {
        if (t.completed && t.timeSpent) { totalTime += t.timeSpent; count++; }
    });
    const avg = count > 0 ? totalTime / count : 0;
    
    document.getElementById('completedCount').textContent = completed;
    document.getElementById('totalCount').textContent = total;
    document.getElementById('totalTimeStat').textContent = formatHours(totalTime);
    document.getElementById('activeStat').textContent = active;
    document.getElementById('todayStat').textContent = completed;
    document.getElementById('productivityStat').textContent = prod;
    document.getElementById('totalTimeStat2').textContent = formatHours(totalTime);
    document.getElementById('avgTimeStat').textContent = Math.round(avg / 60);
}

// ================================================================
// ===== ДИАГРАММА =====
// ================================================================

function renderChart() {
    const bars = document.getElementById('chartBars');
    const labels = document.getElementById('chartLabels');
    if (!bars || !labels) return;
    
    const days = ['ПН','ВТ','СР','ЧТ','ПТ','СБ','ВС'];
    const stats = [0,0,0,0,0,0,0];
    const today = new Date();
    const todayDay = today.getDay();
    
    tasks.filter(t => t.completed && t.completedAt).forEach(t => {
        const d = new Date(t.completedAt);
        const diff = Math.floor((today - d) / (1000*60*60*24));
        if (diff < 7 && diff >= 0) {
            let idx = d.getDay() - 1;
            if (idx < 0) idx = 6;
            stats[idx]++;
        }
    });
    
    const todayIdx = todayDay === 0 ? 6 : todayDay - 1;
    const shifted = [], shiftedLabels = [];
    for (let i = 0; i < 7; i++) {
        const idx = (todayIdx - 6 + i + 7) % 7;
        shifted.push(stats[idx]);
        shiftedLabels.push(i === 6 ? days[idx] + ' 🎯' : days[idx]);
    }
    
    const max = Math.max(...shifted, 1);
    bars.innerHTML = shifted.map((v, i) => {
        const h = (v / max) * 100;
        const cls = i === 6 ? 'chart-bar' : 'chart-bar green-bar';
        return `
            <div class="chart-bar-wrapper">
                <span class="chart-bar-value">${v}</span>
                <div class="${cls}" style="height: ${Math.max(h, 5)}%;"></div>
            </div>
        `;
    }).join('');
    
    labels.innerHTML = shiftedLabels.map((l, i) => 
        `<span class="chart-label ${i === 6 ? 'today' : ''}">${l}</span>`
    ).join('');
}

// ================================================================
// ===== ДОСТИЖЕНИЯ =====
// ================================================================

function getStats() {
    const completed = tasks.filter(t => t.completed);
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const todayDone = completed.filter(t => {
        if (!t.completedAt) return false;
        const d = new Date(t.completedAt);
        d.setHours(0,0,0,0);
        return d.getTime() === today.getTime();
    }).length;
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekDone = completed.filter(t => {
        if (!t.completedAt) return false;
        return new Date(t.completedAt) >= weekAgo;
    }).length;
    
    let fastest = null, longest = null;
    completed.forEach(t => {
        if (t.timeSpent) {
            if (fastest === null || t.timeSpent < fastest) fastest = t.timeSpent;
            if (longest === null || t.timeSpent > longest) longest = t.timeSpent;
        }
    });
    
    return {
        total: completed.length,
        active: tasks.length - completed.length,
        today: todayDone,
        week: weekDone,
        streak: streak,
        cleared: clearedAll,
        fastest: fastest,
        longest: longest
    };
}

function checkAchievements() {
    const s = getStats();
    let newOnes = [];
    ACHIEVEMENTS.forEach(ach => {
        if (!unlockedAchievements.includes(ach.id) && ach.check(s)) {
            unlockedAchievements.push(ach.id);
            newOnes.push(ach);
        }
    });
    if (newOnes.length > 0) {
        saveData();
        renderAchievements();
        newOnes.forEach(showNotification);
    }
}

function checkStreak() {
    const today = new Date();
    today.setHours(0,0,0,0);
    const completed = tasks.filter(t => t.completed && t.completedAt);
    if (completed.length === 0) return;
    
    const todayDone = completed.filter(t => {
        const d = new Date(t.completedAt);
        d.setHours(0,0,0,0);
        return d.getTime() === today.getTime();
    });
    
    if (todayDone.length > 0) {
        if (!lastDate) {
            streak = 1;
        } else {
            const diff = Math.floor((today - lastDate) / (1000*60*60*24));
            if (diff === 0) return;
            if (diff === 1) streak++;
            else streak = 1;
        }
        lastDate = new Date(today);
        saveData();
    }
}

function renderAchievements() {
    const grid = document.getElementById('achievementsGrid');
    if (!grid) return;
    
    const total = ACHIEVEMENTS.length;
    const unlocked = unlockedAchievements.length;
    document.getElementById('achievementTotal').textContent = unlocked;
    document.getElementById('achievementMax').textContent = total;
    document.getElementById('achievementProgress').style.width = total === 0 ? '0%' : (unlocked / total * 100) + '%';
    
    grid.innerHTML = ACHIEVEMENTS.map(ach => {
        const isUnlocked = unlockedAchievements.includes(ach.id);
        return `
            <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${ach.icon}</div>
                <div class="achievement-name">${ach.name}</div>
                <div class="achievement-desc">${ach.desc}</div>
                <div class="achievement-status">${isUnlocked ? '✅ Разблокировано' : '🔒 Заблокировано'}</div>
            </div>
        `;
    }).join('');
}

function showNotification(ach) {
    const notif = document.createElement('div');
    notif.className = 'achievement-notification';
    notif.innerHTML = `
        <div class="achievement-notif-icon">${ach.icon}</div>
        <div class="achievement-notif-content">
            <div class="achievement-notif-title">🏅 Новое достижение!</div>
            <div class="achievement-notif-name">${ach.name}</div>
            <div class="achievement-notif-desc">${ach.desc}</div>
        </div>
    `;
    document.body.appendChild(notif);
    setTimeout(() => notif.classList.add('show'), 100);
    setTimeout(() => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 500);
    }, 5000);
    notif.addEventListener('click', () => {
        notif.classList.remove('show');
        setTimeout(() => notif.remove(), 500);
    });
}

// ================================================================
// ===== ДЕЙСТВИЯ С ЗАДАЧАМИ =====
// ================================================================

function addTask() {
    const input = document.getElementById('taskInput');
    const text = input.value.trim();
    if (!text) { alert('Введите текст!'); return; }
    
    tasks.unshift({
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null,
        timeSpent: null,
        timerStarted: new Date().toISOString()
    });
    input.value = '';
    saveData();
    renderAll();
}

function clearCompleted() {
    const has = tasks.some(t => t.completed);
    if (!has) { alert('Нет выполненных задач!'); return; }
    tasks = tasks.filter(t => !t.completed);
    clearedAll = true;
    saveData();
    renderAll();
    checkAchievements();
}

// ================================================================
// ===== ТЕМНАЯ ТЕМА =====
// ================================================================

document.getElementById('themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    document.getElementById('themeToggle').textContent = document.body.classList.contains('dark-theme') ? '☀️' : '🌙';
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
});

if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-theme');
    document.getElementById('themeToggle').textContent = '☀️';
}

// ================================================================
// ===== ИНИЦИАЛИЗАЦИЯ =====
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    
    document.getElementById('addTaskBtn').addEventListener('click', addTask);
    document.getElementById('taskInput').addEventListener('keypress', e => { if (e.key === 'Enter') addTask(); });
    document.getElementById('clearCompletedBtn').addEventListener('click', clearCompleted);
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });
});
