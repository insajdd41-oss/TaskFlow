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
        createdAt: new Date().toISOString()
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
});