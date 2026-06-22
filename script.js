// ===== УПРАВЛЕНИЕ ЗАДАЧАМИ =====
let tasks = [];
let currentFilter = 'all';

// Загрузка из localStorage
function loadTasks() {
    const saved = localStorage.getItem('tasks');
    if (saved) {
        tasks = JSON.parse(saved);
    }
    renderTasks();
}

// Сохранение в localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    updateStats();
    renderChart(); // Обновляем диаграмму
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
    renderChart(); // Обновляем диаграмму
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
                // Если задача выполнена — записываем дату
                if (task.completed) {
                    task.completedAt = new Date().toISOString();
                } else {
                    task.completedAt = null;
                }
                saveTasks();
                renderTasks();
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
        completedAt: null // Дата выполнения
    });
    
    input.value = '';
    saveTasks();
    renderTasks();
}

// Очистка выполненных
function clearCompleted() {
    if (tasks.filter(t => t.completed).length === 0) {
        alert('Нет выполненных задач для очистки!');
        return;
    }
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    renderTasks();
}

// ===== ДИАГРАММА ПРОДУКТИВНОСТИ =====

// Получить статистику по дням недели
function getWeeklyStats() {
    const days = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];
    const stats = [0, 0, 0, 0, 0, 0, 0];
    
    // Получаем все выполненные задачи
    const completedTasks = tasks.filter(t => t.completed);
    
    // Текущая дата
    const today = new Date();
    const todayDay = today.getDay(); // 0 = воскресенье
    
    // Для каждой выполненной задачи проверяем, когда она была выполнена
    completedTasks.forEach(task => {
        if (task.completedAt) {
            const taskDate = new Date(task.completedAt);
            // Проверяем, что задача выполнена в течение последних 7 дней
            const diffDays = Math.floor((today - taskDate) / (1000 * 60 * 60 * 24));
            if (diffDays < 7 && diffDays >= 0) {
                // Определяем день недели (понедельник = 0)
                let dayIndex = taskDate.getDay() - 1;
                if (dayIndex < 0) dayIndex = 6; // воскресенье → 6
                stats[dayIndex]++;
            }
        }
    });
    
    // Сдвигаем так, чтобы сегодня был последним днём
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

// Отрисовать диаграмму
function renderChart() {
    const chartBars = document.getElementById('chartBars');
    const chartLabels = document.getElementById('chartLabels');
    
    if (!chartBars || !chartLabels) return;
    
    const { stats, labels } = getWeeklyStats();
    const maxVal = Math.max(...stats, 1); // минимум 1, чтобы не делить на ноль
    
    // Отрисовка столбцов
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
    
    // Отрисовка подписей
    chartLabels.innerHTML = labels.map((label, index) => {
        const isToday = index === 6;
        return `<span class="chart-label ${isToday ? 'today' : ''}">${label}</span>`;
    }).join('');
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    
    // Кнопка добавления
    const addBtn = document.getElementById('addTaskBtn');
    if (addBtn) {
        addBtn.addEventListener('click', addTask);
    }
    
    // Enter
    const taskInput = document.getElementById('taskInput');
    if (taskInput) {
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTask();
        });
    }
    
    // Очистка выполненных
    const clearBtn = document.getElementById('clearCompletedBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearCompleted);
    }
    
    // Фильтры
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });
    
    // Отрисовка диаграммы при загрузке
    renderChart();
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

// Функция показа пасхалки с 67
function showMeme67() {
    // Проверяем, не открыта ли уже
    if (document.querySelector('.easter-egg-overlay')) {
        return;
    }

    console.log('🎉 Показываем пасхалку 67!');

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

    // Закрытие по клику на крестик
    const closeBtn = document.getElementById('easterEggClose');
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            closeEasterEgg67();
        });
    }

    // Закрытие по клику на оверлей
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            closeEasterEgg67();
        }
    });

    // Закрытие по Escape
    document.addEventListener('keydown', handleEscape67);
}

function closeEasterEgg67() {
    const overlay = document.querySelector('.easter-egg-overlay');
    if (overlay) {
        overlay.remove();
    }
    document.removeEventListener('keydown', handleEscape67);
    document.body.style.overflow = '';
    console.log('❌ Пасхалка закрыта');
}

function handleEscape67(e) {
    if (e.key === 'Escape') {
        closeEasterEgg67();
    }
}

// Инициализация кнопки 67
function initEasterEggButton() {
    const btn = document.getElementById('easterEggBtn');
    
    if (!btn) {
        console.warn('⚠️ Кнопка #easterEggBtn не найдена');
        return;
    }
    
    btn.addEventListener('click', function() {
        console.log('🔮 Нажата кнопка 67!');
        showMeme67();
    });
    
    // Эффект при наведении
    btn.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1) rotate(-3deg)';
        this.style.boxShadow = '0 8px 30px rgba(255, 107, 138, 0.5)';
    });
    
    btn.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1) rotate(0deg)';
        this.style.boxShadow = '0 5px 20px rgba(255, 107, 138, 0.3)';
    });
    
    console.log('✅ Кнопка 67 инициализирована!');
}
