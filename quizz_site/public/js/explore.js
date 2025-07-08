let currentUser = null;
let allQuizzes = [];
let filteredQuizzes = [];

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupEventListeners();
    // Remover chamada automática de loadAllQuizzes()
    // loadAllQuizzes();
    // Adicionar event listener ao botão Buscar
    const buscarBtn = document.getElementById('buscarQuizzesBtn');
    if (buscarBtn) buscarBtn.onclick = loadAllQuizzes;
});

function checkAuth() {
    const userId = localStorage.getItem('userId');
    if (userId) {
        fetch('/api/auth/me', {
            headers: {
                'user-id': userId
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentUser = data.user;
                updateUserMenu();
            } else {
                localStorage.removeItem('userId');
                currentUser = null;
                updateUserMenu();
            }
        })
        .catch(error => {
            console.error('Erro ao verificar autenticação:', error);
            localStorage.removeItem('userId');
            currentUser = null;
            updateUserMenu();
        });
    }
}

function updateUserMenu() {
    const userName = document.getElementById('userName');
    const userDropdown = document.getElementById('userDropdown');
    const dropdownDivider = document.getElementById('dropdownDivider');
    const logoutBtn = document.getElementById('logoutBtn');
    const adminNavItem = document.getElementById('adminNavItem');

    if (currentUser) {
        userName.textContent = currentUser.name;
        dropdownDivider.style.display = 'block';
        logoutBtn.style.display = 'block';
        
        // Mostrar link admin se for administrador
        if (currentUser.isAdmin) {
            adminNavItem.style.display = 'block';
        }
    } else {
        userName.textContent = 'Entrar';
        dropdownDivider.style.display = 'none';
        logoutBtn.style.display = 'none';
        adminNavItem.style.display = 'none';
    }
}

function setupEventListeners() {
    // Busca
    document.getElementById('searchInput').addEventListener('input', filterQuizzes);
    
    // Filtros
    document.getElementById('categoryFilter').addEventListener('change', filterQuizzes);
    document.getElementById('difficultyFilter').addEventListener('change', filterQuizzes);
    document.getElementById('sortBy').addEventListener('change', filterQuizzes);
}

function loadAllQuizzes() {
    fetch('/api/quizzes/public')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            allQuizzes = data.quizzes;
            filteredQuizzes = [...allQuizzes];
            displayQuizzes(filteredQuizzes);
        } else {
            showError('Erro ao carregar quizzes: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        showError('Erro ao carregar quizzes. Tente novamente.');
    });
}

function displayQuizzes(quizzes) {
    const container = document.getElementById('quizzesGrid');
    const loading = document.getElementById('loading');
    const emptyState = document.getElementById('emptyState');
    
    if (loading) loading.style.display = 'none';
    
    if (quizzes.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        if (container) container.innerHTML = '';
        return;
    }
    
    if (emptyState) emptyState.style.display = 'none';
    
    const quizzesHTML = quizzes.map(quiz => `
        <div class="quiz-card" data-quiz-id="${quiz.id}">
            <div class="quiz-header">
                <div class="quiz-info">
                    <h3>${quiz.title}</h3>
                    <div class="quiz-meta">
                        <span class="category ${quiz.category}">${getCategoryName(quiz.category)}</span>
                        <span class="difficulty ${quiz.difficulty}">${getDifficultyName(quiz.difficulty)}</span>
                        <span class="author">por ${quiz.authorName}</span>
                    </div>
                </div>
                <div class="quiz-stats">
                    <div class="stat">
                        <i class="fas fa-question-circle"></i>
                        <span>${quiz.questionCount} perguntas</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-users"></i>
                        <span>${quiz.playCount || 0} jogos</span>
                    </div>
                    <div class="stat">
                        <i class="fas fa-star"></i>
                        <span>${quiz.averageScore || 0}%</span>
                    </div>
                </div>
            </div>
            
            <div class="quiz-description">
                <p>${quiz.description || 'Sem descrição'}</p>
            </div>
            
            <div class="quiz-actions">
                <button class="btn btn-primary btn-sm" onclick="playQuiz(${quiz.id})">
                    <i class="fas fa-play"></i> Jogar
                </button>
                <button class="btn btn-secondary btn-sm" onclick="viewQuizDetails(${quiz.id})">
                    <i class="fas fa-info-circle"></i> Detalhes
                </button>
                ${currentUser && currentUser.id === quiz.userId ? `
                    <button class="btn btn-warning btn-sm" onclick="editQuiz(${quiz.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                ` : ''}
            </div>
            
            <div class="quiz-footer">
                <small>Criado em ${formatDate(quiz.createdAt)}</small>
            </div>
        </div>
    `).join('');
    
    if (container) container.innerHTML = quizzesHTML;
}

function filterQuizzes() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const difficultyFilter = document.getElementById('difficultyFilter').value;
    const sortBy = document.getElementById('sortBy').value;
    
    // Aplicar filtros
    filteredQuizzes = allQuizzes.filter(quiz => {
        const matchesSearch = quiz.title.toLowerCase().includes(searchTerm) ||
                            (quiz.description && quiz.description.toLowerCase().includes(searchTerm)) ||
                            quiz.authorName.toLowerCase().includes(searchTerm);
        const matchesCategory = !categoryFilter || quiz.category === categoryFilter;
        const matchesDifficulty = !difficultyFilter || quiz.difficulty === difficultyFilter;
        
        return matchesSearch && matchesCategory && matchesDifficulty;
    });
    
    // Aplicar ordenação
    switch (sortBy) {
        case 'newest':
            filteredQuizzes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'oldest':
            filteredQuizzes.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        case 'popular':
            filteredQuizzes.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
            break;
        case 'rating':
            filteredQuizzes.sort((a, b) => (b.averageScore || 0) - (a.averageScore || 0));
            break;
        case 'title':
            filteredQuizzes.sort((a, b) => a.title.localeCompare(b.title));
            break;
        default:
            break;
    }
    
    displayQuizzes(filteredQuizzes);
}

function playQuiz(quizId) {
    if (!currentUser) {
        alert('Você precisa estar logado para jogar um quiz.');
        showLoginModal();
        return;
    }
    
    // Implementar funcionalidade de jogar quiz
    alert('Funcionalidade de jogar quiz será implementada em breve!');
}

function viewQuizDetails(quizId) {
    // Implementar funcionalidade de ver detalhes
    alert('Funcionalidade de ver detalhes será implementada em breve!');
}

function editQuiz(quizId) {
    // Implementar funcionalidade de editar quiz
    alert('Funcionalidade de editar quiz será implementada em breve!');
}

function getCategoryName(category) {
    const categories = {
        'geral': 'Conhecimento Geral',
        'historia': 'História',
        'ciencia': 'Ciência',
        'geografia': 'Geografia'
    };
    return categories[category] || category;
}

function getDifficultyName(difficulty) {
    const difficulties = {
        'facil': 'Fácil',
        'medio': 'Médio',
        'dificil': 'Difícil'
    };
    return difficulties[difficulty] || difficulty;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function showError(message) {
    // Implementar notificação de erro
    alert(message);
}

// Funções de autenticação
function showLoginModal() {
    document.getElementById('loginModal').style.display = 'flex';
}

function closeLoginModal() {
    document.getElementById('loginModal').style.display = 'none';
}

function showRegisterModal() {
    document.getElementById('registerModal').style.display = 'flex';
}

function closeRegisterModal() {
    document.getElementById('registerModal').style.display = 'none';
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('userDropdown');
    dropdown.classList.toggle('show');
}

function logout() {
    if (currentUser) {
        fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'user-id': currentUser.id
            }
        })
        .then(response => response.json())
        .then(data => {
            localStorage.removeItem('userId');
            currentUser = null;
            updateUserMenu();
            window.location.reload();
        })
        .catch(error => {
            console.error('Erro no logout:', error);
            localStorage.removeItem('userId');
            currentUser = null;
            updateUserMenu();
            window.location.reload();
        });
    }
}

// Event listeners para autenticação
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const loginData = {
        email: document.getElementById('loginEmail').value,
        password: document.getElementById('loginPassword').value
    };
    
    fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem('userId', data.user.id);
            currentUser = data.user;
            updateUserMenu();
            closeLoginModal();
            window.location.reload();
        } else {
            alert('Erro no login: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro no login. Tente novamente.');
    });
});

document.getElementById('registerForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    if (password !== confirmPassword) {
        alert('As senhas não coincidem.');
        return;
    }
    
    const registerData = {
        name: document.getElementById('registerName').value,
        email: document.getElementById('registerEmail').value,
        password: password
    };
    
    fetch('/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem('userId', data.user.id);
            currentUser = data.user;
            updateUserMenu();
            alert('Conta criada com sucesso!');
            closeRegisterModal();
            window.location.reload();
        } else {
            alert('Erro no registro: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro no registro. Tente novamente.');
    });
});

// Fechar modais ao clicar fora
window.addEventListener('click', function(e) {
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    
    if (e.target === loginModal) {
        closeLoginModal();
    }
    if (e.target === registerModal) {
        closeRegisterModal();
    }
}); 
window.loadAllQuizzes = loadAllQuizzes; 