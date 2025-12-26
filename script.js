// Estado da aplicação
let appState = {
    habits: [],
    selectedColor: '#00d4ff',
    selectedIcon: '💧',
    completions: {}
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    loadFromStorage();
    setupEventListeners();
    renderHabits();
    renderCalendar();
    updateStats();
    
    // Animação de entrada
    setTimeout(() => {
        document.querySelector('.container').style.opacity = '1';
    }, 100);
});

// Event Listeners
function setupEventListeners() {
    // Formulário de novo hábito
    document.getElementById('habitForm').addEventListener('submit', handleHabitSubmit);
    
    // Seletores de cor
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => selectColor(option. dataset.color, option));
    });
    
    // Seletores de ícone
    document.querySelectorAll('.icon-option').forEach(option => {
        option.addEventListener('click', () => selectIcon(option.dataset.icon, option));
    });
    
    // Selecionar primeira cor e ícone por padrão
    document.querySelector('.color-option').classList.add('selected');
    document.querySelector('.icon-option').classList.add('selected');
}

// Selecionar cor
function selectColor(color, element) {
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
    element.classList.add('selected');
    appState.selectedColor = color;
}

// Selecionar ícone
function selectIcon(icon, element) {
    document.querySelectorAll('.icon-option').forEach(opt => opt.classList. remove('selected'));
    element.classList.add('selected');
    appState.selectedIcon = icon;
}

// Criar novo hábito
function handleHabitSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('habitName').value.trim();
    
    if (! name) {
        showNotification('Por favor, insira um nome para o hábito!', 'error');
        return;
    }
    
    const habit = {
        id: Date. now(),
        name: name,
        color: appState.selectedColor,
        icon: appState.selectedIcon,
        createdAt: new Date().toISOString(),
        streak: 0
    };
    
    appState.habits.push(habit);
    saveToStorage();
    renderHabits();
    updateStats();
    
    // Limpar formulário
    document.getElementById('habitName').value = '';
    
    showNotification('Hábito criado com sucesso!  🎉', 'success');
    createParticles(e.target);
}

// Renderizar hábitos
function renderHabits() {
    const container = document.getElementById('habitsList');
    
    if (appState.habits.length === 0) {
        container. innerHTML = `
            <div style="text-align: center; color: var(--text-secondary); padding: 40px 0;">
                <div style="font-size: 3rem; margin-bottom: 10px;">🎯</div>
                <p>Nenhum hábito criado ainda. </p>
                <p>Comece criando seu primeiro hábito! </p>
            </div>
        `;
        return;
    }
    
    container. innerHTML = appState.habits.map(habit => {
        const today = new Date().toDateString();
        const isCompleted = appState.completions[habit.id] && 
                          appState.completions[habit.id].includes(today);
        
        return `
            <div class="habit-item" style="animation-delay: ${appState.habits.indexOf(habit) * 0.1}s">
                <div class="habit-icon" style="background:  ${habit.color}">
                    ${habit.icon}
                </div>
                <div class="habit-info">
                    <div class="habit-name">${habit. name}</div>
                    <div class="habit-streak">🔥 ${habit.streak} dias seguidos</div>
                </div>
                <button class="habit-check ${isCompleted ? 'completed' : ''}" 
                        style="border-color: ${habit.color}; color: ${habit.color}"
                        onclick="toggleHabit(${habit.id}, this)">
                    ${isCompleted ? '✓' : ''}
                </button>
            </div>
        `;
    }).join('');
}

// Toggle hábito
function toggleHabit(habitId, button) {
    const today = new Date().toDateString();
    
    if (! appState.completions[habitId]) {
        appState.completions[habitId] = [];
    }
    
    const completions = appState.completions[habitId];
    const isCompleted = completions.includes(today);
    
    if (isCompleted) {
        // Remover conclusão
        appState.completions[habitId] = completions.filter(date => date !== today);
        button.classList.remove('completed');
        button.innerHTML = '';
        showNotification('Hábito desmarcado', 'error');
    } else {
        // Adicionar conclusão
        completions.push(today);
        button.classList.add('completed');
        button.innerHTML = '✓';
        showNotification('Hábito concluído!  🎉', 'success');
        createParticles(button);
    }
    
    updateHabitStreak(habitId);
    saveToStorage();
    updateStats();
    renderCalendar();
}

// Atualizar sequência do hábito
function updateHabitStreak(habitId) {
    const habit = appState.habits.find(h => h.id === habitId);
    const completions = appState.completions[habitId] || [];
    
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 365; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateString = checkDate.toDateString();
        
        if (completions.includes(dateString)) {
            streak++;
        } else {
            break;
        }
    }
    
    habit.streak = streak;
}

// Atualizar estatísticas
function updateStats() {
    const today = new Date().toDateString();
    const totalHabits = appState.habits.length;
    
    let completedToday = 0;
    let totalCompletions = 0;
    let maxStreak = 0;
    
    appState.habits.forEach(habit => {
        const completions = appState.completions[habit.id] || [];
        
        if (completions.includes(today)) {
            completedToday++;
        }
        
        totalCompletions += completions.length;
        maxStreak = Math.max(maxStreak, habit.streak);
    });
    
    const completionRate = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0;
    
    // Atualizar elementos
    document.getElementById('totalHabits').textContent = totalHabits;
    document.getElementById('completedToday').textContent = completedToday;
    document.getElementById('currentStreak').textContent = maxStreak;
    document.getElementById('completionRate').textContent = completionRate + '%';
    
    // Atualizar gráfico circular
    updateProgressCircle(completionRate);
}

// Atualizar gráfico circular
function updateProgressCircle(percentage) {
    const circle = document.getElementById('progressCircle');
    const text = document.getElementById('progressText');
    
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    
    circle.style.strokeDasharray = circumference;
    circle. style.strokeDashoffset = offset;
    circle.style.stroke = `url(#gradient-${percentage > 50 ? 'green' : 'blue'})`;
    
    text.textContent = percentage + '%';
    
    // Adicionar gradientes se não existirem
    if (! document.querySelector('#gradient-green')) {
        const svg = circle.closest('svg');
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        
        const gradientGreen = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradientGreen.id = 'gradient-green';
        gradientGreen.innerHTML = `
            <stop offset="0%" stop-color="#00ff88"/>
            <stop offset="100%" stop-color="#00d4ff"/>
        `;
        
        const gradientBlue = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradientBlue. id = 'gradient-blue';
        gradientBlue.innerHTML = `
            <stop offset="0%" stop-color="#00d4ff"/>
            <stop offset="100%" stop-color="#8b5cf6"/>
        `;
        
        defs.appendChild(gradientGreen);
        defs.appendChild(gradientBlue);
        svg.appendChild(defs);
    }
}

// Renderizar calendário
function renderCalendar() {
    const container = document.getElementById('calendar');
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Cabeçalhos dos dias da semana
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    let calendarHTML = weekdays.map(day => 
        `<div class="calendar-day header">${day}</div>`
    ).join('');
    
    // Primeiro dia do mês
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // Dias vazios no início
    for (let i = 0; i < firstDay; i++) {
        calendarHTML += '<div class="calendar-day"></div>';
    }
    
    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateString = date.toDateString();
        const isToday = dateString === today.toDateString();
        
        let completedHabits = 0;
        appState.habits.forEach(habit => {
            const completions = appState.completions[habit.id] || [];
            if (completions.includes(dateString)) {
                completedHabits++;
            }
        });
        
        const isCompleted = completedHabits > 0;
        const classes = `calendar-day ${isToday ? 'today' : ''} ${isCompleted ? 'completed' : ''}`;
        
        calendarHTML += `<div class="${classes}">${day}</div>`;
    }
    
    container.innerHTML = calendarHTML;
}

// Criar partículas
function createParticles(element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect. width / 2;
    const centerY = rect.top + rect.height / 2;
    
    for (let i = 0; i < 12; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        const angle = (i / 12) * Math.PI * 2;
        const velocity = 50 + Math.random() * 50;
        const x = centerX + Math.cos(angle) * velocity;
        const y = centerY + Math.sin(angle) * velocity;
        
        particle.style.left = centerX + 'px';
        particle.style.top = centerY + 'px';
        particle.style.background = appState.selectedColor;
        
        document.getElementById('particles').appendChild(particle);
        
        // Animar partícula
        setTimeout(() => {
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.opacity = '0';
        }, 10);
        
        // Remover partícula
        setTimeout(() => {
            particle.remove();
        }, 2000);
    }
}

// Mostrar notificação
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification. className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList. remove('show');
    }, 3000);
}

// Salvar no localStorage
function saveToStorage() {
    localStorage.setItem('habitsApp', JSON.stringify({
        habits: appState.habits,
        completions: appState.completions
    }));
}

// Carregar do localStorage
function loadFromStorage() {
    const saved = localStorage.getItem('habitsApp');
    if (saved) {
        const data = JSON.parse(saved);
        appState.habits = data. habits || [];
        appState. completions = data.completions || {};
    }
}

// Efeitos visuais adicionais
setInterval(() => {
    const elements = document.querySelectorAll('. glass-card');
    elements.forEach((el, index) => {
        setTimeout(() => {
            el.style.transform = 'translateY(-2px)';
            setTimeout(() => {
                el.style.transform = 'translateY(0)';
            }, 200);
        }, index * 100);
    });
}, 10000);

// Adicionar efeito de glow nos elementos importantes
document.addEventListener('mouseover', (e) => {
    if (e.target.classList.contains('habit-check') && ! e.target.classList.contains('completed')) {
        e.target.classList.add('glow');
    }
});

document.addEventListener('mouseout', (e) => {
    if (e.target. classList.contains('habit-check')) {
        e.target.classList.remove('glow');
    }
});
