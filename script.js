// ================================================================
// ===== СИСТЕМА ДОСТИЖЕНИЙ =====
// ================================================================

const ACHIEVEMENTS = [
    {
        id: 'first_task',
        name: '🌟 Первый шаг',
        description: 'Выполнить первую задачу',
        icon: '🌟',
        check: (stats) => stats.totalCompleted >= 1
    },
    {
        id: 'task_master_5',
        name: '📋 Мастер задач',
        description: 'Выполнить 5 задач',
        icon: '📋',
        check: (stats) => stats.totalCompleted >= 5
    },
    {
        id: 'task_master_10',
        name: '🏆 Продуктивный',
        description: 'Выполнить 10 задач',
        icon: '🏆',
        check: (stats) => stats.totalCompleted >= 10
    },
    {
        id: 'task_master_25',
        name: '👑 Король продуктивности',
        description: 'Выполнить 25 задач',
        icon: '👑',
        check: (stats) => stats.totalCompleted >= 25
    },
    {
        id: 'task_master_50',
        name: '🚀 Легенда',
        description: 'Выполнить 50 задач',
        icon: '🚀',
        check: (stats) => stats.totalCompleted >= 50
    },
    {
        id: 'perfect_day',
        name: '☀️ Идеальный день',
        description: 'Выполнить все задачи за день (минимум 3)',
        icon: '☀️',
        check: (stats) => stats.completedToday >= 3 && stats.activeTasks === 0
    },
    {
        id: 'streak_3',
        name: '🔥 Серия 3 дня',
        description: 'Выполнять хотя бы 1 задачу 3 дня подряд',
        icon: '🔥',
        check: (stats) => stats.streak >= 3
    },
    {
        id: 'streak_7',
        name: '⚡ Недельная серия',
        description: 'Выполнять хотя бы 1 задачу 7 дней подряд',
        icon: '⚡',
        check: (stats) => stats.streak >= 7
    },
    {
        id: 'streak_30',
        name: '💎 Месяц продуктивности',
        description: 'Выполнять хотя бы 1 задачу 30 дней подряд',
        icon: '💎',
        check: (stats) => stats.streak >= 30
    },
    {
        id: 'speed_demon',
        name: '⚡ Демон скорости',
        description: 'Выполнить 3 задачи за один день',
        icon: '⚡',
        check: (stats) => stats.completedToday >= 3
    },
    {
        id: 'week_warrior',
        name: '📅 Недельный воин',
        description: 'Выполнить 15 задач за неделю',
        icon: '📅',
        check: (stats) => stats.weeklyCompleted >= 15
    },
    {
        id: 'all_clear',
        name: '🧹 Чистота',
        description: 'Очистить все выполненные задачи',
        icon: '🧹',
        check: (stats) => stats.clearedAll === true
    }
];

let unlockedAchievements = [];
let achievementStreak = 0;
let lastCompletionDate = null;
let dailyCompleted = 0;
let weeklyCompleted = 0;
let clearedAllFlag = false;

// Загрузка достижений из localStorage
function loadAchievements() {
    const saved = localStorage.getItem('achievements');
    if (saved) {
        const data = JSON.parse(saved);
        unlockedAchievements = data.unlocked || [];
        achievementStreak = data.streak || 0;
        lastCompletionDate = data.lastDate ? new Date(data.lastDate) : null;
        dailyCompleted = data.dailyCompleted || 0;
        weeklyCompleted = data.weeklyCompleted || 0;
        clearedAllFlag = data.clearedAll || false;
    }
    renderAchievements();
}

// Сохранение достижений в localStorage
function saveAchievements() {
    localStorage.setItem('achievements', JSON.stringify({
        unlocked: unlockedAchievements,
        streak: achievementStreak,
        lastDate: lastCompletionDate ? lastCompletionDate.toISOString() : null,
        dailyCompleted: dailyCompleted,
        weeklyCompleted: weeklyCompleted,
        clearedAll: clearedAllFlag
    }));
}

// Получение статистики для проверки достижений
function getAchievementStats() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed);
    const totalCompleted = completedTasks.length;
    const activeTasks = totalTasks - totalCompleted;
    
    // Сегодняшние выполненные
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const completedToday = completedTasks.filter(t => {
        if (!t.completedAt) return false;
        const d = new Date(t.completedAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
    }).length;
    
    // Недельные выполненные
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyCompletedNow = completedTasks.filter(t => {
        if (!t.completedAt) return false;
        const d = new Date(t.completedAt);
        return d >= weekAgo;
    }).length;
    
    return {
        totalCompleted,
        activeTasks,
        completedToday,
        weeklyCompleted: weeklyCompletedNow,
        streak: achievementStreak,
        clearedAll: clearedAllFlag
    };
}

// Проверка и разблокировка достижений
function checkAchievements() {
    const stats = getAchievementStats();
    let newAchievements = [];
    
    // Обновляем daily и weekly счётчики
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Сброс daily если новый день
    if (lastCompletionDate) {
        const lastDate = new Date(lastCompletionDate);
        lastDate.setHours(0, 0, 0, 0);
        if (lastDate.getTime() < today.getTime()) {
            // Новый день
            if (dailyCompleted > 0) {
                // Если вчера были выполнены задачи — продлеваем серию
                if (dailyCompleted > 0) {
                    achievementStreak++;
                } else {
                    achievementStreak = 0;
                }
            }
            dailyCompleted = 0;
        }
    }
    
    // Сброс weekly если новая неделя
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
    if (lastCompletionDate) {
        const lastDate = new Date(lastCompletionDate);
        if (lastDate < weekStart) {
            weeklyCompleted = 0;
        }
    }
    
    // Проверяем все достижения
    ACHIEVEMENTS.forEach(ach => {
        if (!unlockedAchievements.includes(ach.id) && ach.check(stats)) {
            unlockedAchievements.push(ach.id);
            newAchievements.push(ach);
        }
    });
    
    // Обновляем прогресс
    if (newAchievements.length > 0) {
        saveAchievements();
        renderAchievements();
        
        // Показываем уведомление о новых достижениях
        newAchievements.forEach(ach => {
            showAchievementNotification(ach);
        });
    }
}

// Показ уведомления о достижении
function showAchievementNotification(achievement) {
    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <div class="achievement-notif-icon">${achievement.icon}</div>
        <div class="achievement-notif-content">
            <div class="achievement-notif-title">🏅 Новое достижение!</div>
            <div class="achievement-notif-name">${achievement.name}</div>
            <div class="achievement-notif-desc">${achievement.description}</div>
        </div>
    `;
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Автоматическое скрытие через 5 секунд
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 500);
    }, 5000);
    
    // Закрытие по клику
    notification.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 500);
    });
}

// Отрисовка достижений
function renderAchievements() {
    const grid = document.getElementById('achievementsGrid');
    const totalSpan = document.getElementById('achievementTotal');
    const maxSpan = document.getElementById('achievementMax');
    const progressFill = document.getElementById('achievementProgress');
    
    if (!grid) return;
    
    const total = ACHIEVEMENTS.length;
    const unlocked = unlockedAchievements.length;
    
    if (totalSpan) totalSpan.textContent = unlocked;
    if (maxSpan) maxSpan.textContent = total;
    if (progressFill) {
        const pct = total === 0 ? 0 : Math.round((unlocked / total) * 100);
        progressFill.style.width = pct + '%';
    }
    
    grid.innerHTML = ACHIEVEMENTS.map(ach => {
        const isUnlocked = unlockedAchievements.includes(ach.id);
        return `
            <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${ach.icon}</div>
                <div class="achievement-name">${ach.name}</div>
                <div class="achievement-desc">${ach.description}</div>
                <div class="achievement-status">${isUnlocked ? '✅ Разблокировано' : '🔒 Заблокировано'}</div>
            </div>
        `;
    }).join('');
}

// Обновление прогресса достижений при выполнении задачи
function updateAchievementProgress() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Обновляем daily счётчик
    const completedToday = tasks.filter(t => {
        if (!t.completed || !t.completedAt) return false;
        const d = new Date(t.completedAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
    }).length;
    dailyCompleted = completedToday;
    
    // Обновляем weekly счётчик
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    weeklyCompleted = tasks.filter(t => {
        if (!t.completed || !t.completedAt) return false;
        const d = new Date(t.completedAt);
        return d >= weekAgo;
    }).length;
    
    // Обновляем последнюю дату выполнения
    const completedTasks = tasks.filter(t => t.completed && t.completedAt);
    if (completedTasks.length > 0) {
        const latest = completedTasks.reduce((max, t) => {
            const d = new Date(t.completedAt);
            return d > max ? d : max;
        }, new Date(0));
        
        const latestDate = new Date(latest);
        latestDate.setHours(0, 0, 0, 0);
        
        if (!lastCompletionDate || latestDate.getTime() > new Date(lastCompletionDate).getTime()) {
            lastCompletionDate = latestDate;
        }
    }
    
    saveAchievements();
    checkAchievements();
}

// Очистка выполненных (для достижения "Чистота")
function clearCompletedWithAchievement() {
    const hasCompleted = tasks.some(t => t.completed);
    if (!hasCompleted) {
        alert('Нет выполненных задач для очистки!');
        return;
    }
    
    tasks = tasks.filter(t => !t.completed);
    clearedAllFlag = true;
    saveTasks();
    renderTasks();
    saveAchievements();
    checkAchievements();
}

// ================================================================
// ===== УПРАВЛЕНИЕ ЗАДАЧАМИ =====
// ================================================================

let tasks = [];
let currentFilter = 'all';

// Загрузка из localStorage
function loadTasks() {
    const saved = localStorage.getItem('tasks');
    if (saved) {
        tasks = JSON.parse(saved);
    }
    loadAchievements();
    renderTasks();
}

// Сохранение в localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    updateStats();
    renderChart();
    updateAchievementProgress();
}

// Рендер задач
function renderTasks() {
    const taskList = document.getElementById('taskList');
    if (!taskList) return;
    
    let filteredTasks = tasks;
    if (currentFilter === 'active') {
        filteredTasks = tasks.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
        filteredTasks = tasks.filter(t => t.completed);
    }
    
    if (filteredTasks.length === 0) {
        taskList.innerHTML = '<div class="empty-state">✨ Нет задач. Добавьте новую!</div>';
        return;
    }
    
    taskList.innerHTML = filteredTasks.map((task) => {
        return `
            <li class="task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-text">${escapeHtml(task.text)}</span>
                <button class="task-delete">🗑️</button>
            </li>
        `;
    }).join('');
    
    attachTaskEvents();
    updateStats();
    renderChart();
}

// Экранирование HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Прикрепление событий к задачам
function attachTaskEvents() {
    document.querySelectorAll('.task-item').forEach(item => {
        const id = parseInt(item.dataset.id);
        const checkbox = item.querySelector('.task-checkbox');
        const deleteBtn = item.querySelector('.task-delete');
        const textSpan = item.querySelector('.task-text');
        
        // Чекбокс
        checkbox.addEventListener('change', () => {
            const task = tasks.find(t => t.id === id);
            if (task) {
                task.completed = checkbox.checked;
                if (task.completed) {
                    task.completedAt = new Date().toISOString();
                } else {
                    task.completedAt = null;
                }
                saveTasks();
                renderTasks();
                // Проверяем достижения после выполнения задачи
                updateAchievementProgress();
            }
        });
        
        // Удаление
        deleteBtn.addEventListener('click', () => {
            tasks = tasks.filter(t => t.id !== id);
            saveTasks();
            renderTasks();
        });
        
        // Редактирование по двойному клику
        textSpan.addEventListener('dblclick', () => {
            const task = tasks.find(t => t.id === id);
            if (task) {
                const newText = prompt('Редактировать задачу:', task.text);
                if (newText !== null && newText.trim() !== '') {
                    task.text = newText.trim();
                    saveTasks();
                    renderTasks();
                }
            }
        });
    });
}

// Обновление статистики
function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;
    const productivity = total === 0 ? 0 : Math.round((completed / total) * 100);
    
    const completedSpan = document.getElementById('completedCount');
    const totalSpan = document.getElementById('totalCount');
    const activeStat = document.getElementById('activeStat');
    const todayStat = document.getElementById('todayStat');
    const productivityStat = document.getElementById('productivityStat');
    
    if (completedSpan) completedSpan.textContent = completed;
    if (totalSpan) totalSpan.textContent = total;
    if (activeStat) activeStat.textContent = active;
    if (todayStat) todayStat.textContent = completed;
    if (productivityStat) productivityStat.textContent = productivity;
}

// Добавление задачи
function addTask() {
    const input = document.getElementById('taskInput');
    const text = input.value.trim();
    
    if (text === '') {
        alert('Введите текст задачи!');
        return;
    }
    
    tasks.unshift({
        id: Date.now(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString(),
        completedAt: null
    });
    
    input.value = '';
    saveTasks();
    renderTasks();
}

// Очистка выполненных (старая версия, заменена на новую)
function clearCompleted() {
    clearCompletedWithAchievement();
}

// ===== ДИАГРАММА ПРОДУКТИВНОСТИ =====

function getWeeklyStats() {
    const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
    const stats = [0, 0, 0, 0, 0, 0, 0];
    
    const completedTasks = tasks.filter(t => t.completed);
    const today = new Date();
    const todayDay = today.getDay();
    
    completedTasks.forEach(task => {
        if (task.completedAt) {
            const taskDate = new Date(task.completedAt);
            const diffDays = Math.floor((today - taskDate) / (1000 * 60 * 60 * 24));
            if (diffDays < 7 && diffDays >= 0) {
                let dayIndex = taskDate.getDay() - 1;
                if (dayIndex < 0) dayIndex = 6;
                stats[dayIndex]++;
            }
        }
    });
    
    const todayIndex = todayDay === 0 ? 6 : todayDay - 1;
    const shiftedStats = [];
    const shiftedLabels = [];
    
    for (let i = 0; i < 7; i++) {
        const idx = (todayIndex - 6 + i + 7) % 7;
        shiftedStats.push(stats[idx]);
        const label = days[idx];
        shiftedLabels.push(i === 6 ? label + ' 🎯' : label);
    }
    
    return { stats: shiftedStats, labels: shiftedLabels };
}

function renderChart() {
    const chartBars = document.getElementById('chartBars');
    const chartLabels = document.getElementById('chartLabels');
    
    if (!chartBars || !chartLabels) return;
    
    const { stats, labels } = getWeeklyStats();
    const maxVal = Math.max(...stats, 1);
    
    chartBars.innerHTML = stats.map((val, index) => {
        const heightPercent = (val / maxVal) * 100;
        const isToday = index === 6;
        const barClass = isToday ? 'chart-bar' : 'chart-bar green-bar';
        
        return `
            <div class="chart-bar-wrapper">
                <span class="chart-bar-value">${val}</span>
                <div class="${barClass}" style="height: ${Math.max(heightPercent, 5)}%;"></div>
            </div>
        `;
    }).join('');
    
    chartLabels.innerHTML = labels.map((label, index) => {
        const isToday = index === 6;
        return `<span class="chart-label ${isToday ? 'today' : ''}">${label}</span>`;
    }).join('');
}

// ================================================================
// ===== ИНИЦИАЛИЗАЦИЯ =====
// ================================================================

document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    initEasterEggButton();
    
    const addBtn = document.getElementById('addTaskBtn');
    if (addBtn) {
        addBtn.addEventListener('click', addTask);
    }
    
    const taskInput = document.getElementById('taskInput');
    if (taskInput) {
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTask();
        });
    }
    
    const clearBtn = document.getElementById('clearCompletedBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearCompleted);
    }
    
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });
    
    renderChart();
    renderAchievements();
});

// ===== ТЕМНАЯ ТЕМА =====
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.classList.add('dark-theme');
    body.classList.add('theme-transition');
    if (themeToggle) {
        themeToggle.textContent = '☀️';
    }
}

if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        body.classList.add('theme-transition');
        
        if (body.classList.contains('dark-theme')) {
            localStorage.setItem('theme', 'dark');
            themeToggle.textContent = '☀️';
        } else {
            localStorage.setItem('theme', 'light');
            themeToggle.textContent = '🌙';
        }
    });
}

// ================================================================
// ===== ПАСХАЛКА — КНОПКА 67 =====
// ================================================================

function showMeme67() {
    if (document.querySelector('.easter-egg-overlay')) {
        return;
    }

    const overlay = document.createElement('div');
    overlay.className = 'easter-egg-overlay active';
    overlay.id = 'easterEggOverlay';
    overlay.innerHTML = `
        <button class="easter-egg-close" id="easterEggClose">✕</button>
        <div class="easter-egg-content">
            <div class="easter-egg-meme" style="font-size: 10rem;">67</div>
            <div class="easter-egg-text">🔥 67 🔥</div>
            <div class="easter-egg-subtext">Ты нашёл пасхалку! 🎉</div>
            <div style="margin-top: 30px; font-size: 4rem; animation: brainrotShake 2s ease-in-out infinite;">
                🗿 67 Rizz 🗿
            </div>
            <div style="margin-top: 20px; display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; font-size: 3rem;">
                <span>6️⃣</span>
                <span style="animation: brainrotPulse 1.5s ease-in-out infinite;">7️⃣</span>
                <span>6️⃣</span>
                <span style="animation: brainrotPulse 2s ease-in-out infinite;">7️⃣</span>
            </div>
            <div style="margin-top: 20px; color: #666; font-size: 1.2rem; letter-spacing: 4px;">
                ═══════ ✦ 67 ✦ ═══════
            </div>
            <div style="margin-top: 20px; color: #555; font-size: 0.8rem;">
                (нажмите ✕ или кликните в любом месте, чтобы закрыть)
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    const closeBtn = document.getElementById('easterEggClose');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeMeme67();
        });
    }

    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeMeme67();
        }
    });

    document.addEventListener('keydown', handleEscape67);
}

function closeMeme67() {
    const overlay = document.querySelector('.easter-egg-overlay');
    if (overlay) {
        overlay.remove();
    }
    document.removeEventListener('keydown', handleEscape67);
    document.body.style.overflow = '';
}

function handleEscape67(e) {
    if (e.key === 'Escape') {
        closeMeme67();
    }
}

function initEasterEggButton() {
    const btn = document.getElementById('easterEggBtn');
    if (!btn) return;
    
    btn.addEventListener('click', function() {
        showMeme67();
    });
    
    btn.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1) rotate(-3deg)';
        this.style.boxShadow = '0 8px 30px rgba(255, 107, 138, 0.5)';
    });
    
    btn.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1) rotate(0deg)';
        this.style.boxShadow = '0 5px 20px rgba(255, 107, 138, 0.3)';
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initEasterEggButton();
});
