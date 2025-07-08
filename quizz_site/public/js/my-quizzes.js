var currentUser = null;
let userQuizzes = [];
let quizToDelete = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    setupEventListeners();
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
                loadUserQuizzes();
            } else {
                redirectToLogin();
            }
        })
        .catch(error => {
            console.error('Erro ao verificar autenticação:', error);
            redirectToLogin();
        });
    } else {
        redirectToLogin();
    }
}

function redirectToLogin() {
    alert('Você precisa estar logado para acessar esta página.');
    window.location.href = 'index.html';
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
    document.getElementById('searchInput').addEventListener('input', filterQuizzes);
    
    document.getElementById('categoryFilter').addEventListener('change', filterQuizzes);
    document.getElementById('statusFilter').addEventListener('change', filterQuizzes);
}

function loadUserQuizzes() {
    fetch('/api/quizzes/my', {
        headers: {
            'user-id': currentUser.id
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            userQuizzes = data.quizzes;
            displayQuizzes(userQuizzes);
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
    const container = document.getElementById('quizzesContainer');
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
                        <span class="status ${quiz.isPublic ? 'public' : 'private'}">
                            ${quiz.isPublic ? 'Público' : 'Privado'}
                        </span>
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
                </div>
            </div>
            
            <div class="quiz-description">
                <p>${quiz.description || 'Sem descrição'}</p>
            </div>
            
            <div class="quiz-actions">
                <button class="btn btn-primary btn-sm" onclick="playQuiz(${quiz.id})">
                    <i class="fas fa-play"></i> Jogar
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteQuiz(${quiz.id})">
                    <i class="fas fa-trash"></i> Excluir
                </button>
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
    const statusFilter = document.getElementById('statusFilter').value;
    
    const filteredQuizzes = userQuizzes.filter(quiz => {
        const matchesSearch = quiz.title.toLowerCase().includes(searchTerm) ||
                            (quiz.description && quiz.description.toLowerCase().includes(searchTerm));
        const matchesCategory = !categoryFilter || quiz.category === categoryFilter;
        const matchesStatus = !statusFilter || 
                            (statusFilter === 'public' && quiz.isPublic) ||
                            (statusFilter === 'private' && !quiz.isPublic);
        
        return matchesSearch && matchesCategory && matchesStatus;
    });
    
    displayQuizzes(filteredQuizzes);
}

function playQuiz(quizId) {
    fetch(`/api/quizzes/${quizId}/questions`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showPlayQuizModal(data.questions);
            } else {
                alert('Erro ao carregar perguntas do quiz.');
            }
        })
        .catch(() => alert('Erro ao carregar perguntas do quiz.'));
}

function showPlayQuizModal(questions) {
    let current = 0;
    let userAnswers = new Array(questions.length).fill(null);

    const modal = document.getElementById('playQuizModal');
    const content = document.getElementById('playQuizContent');

    function renderQuestion(idx) {
        const q = questions[idx];
        content.innerHTML = `
            <div class="quiz-play-header">
                <h3>Pergunta ${idx + 1} de ${questions.length}</h3>
            </div>
            <div class="quiz-play-question">
                <p><strong>${q.question_text}</strong></p>
                <form id="quizPlayForm">
                    ${[1,2,3,4].map(i => `
                        <div>
                            <label>
                                <input type="radio" name="alt" value="${i}" ${userAnswers[idx] == i ? 'checked' : ''}>
                                ${q[`alternative${i}`]}
                            </label>
                        </div>
                    `).join('')}
                </form>
            </div>
            <div class="quiz-play-actions">
                ${idx > 0 ? '<button id="prevBtn">Anterior</button>' : ''}
                ${idx < questions.length - 1 ? '<button id="nextBtn">Próxima</button>' : '<button id="finishBtn">Finalizar</button>'}
                <button id="closeQuizBtn" style="float:right;">Fechar</button>
            </div>
        `;
        document.getElementById('quizPlayForm').onsubmit = e => e.preventDefault();
        document.querySelectorAll('input[name="alt"]').forEach(input => {
            input.onchange = e => {
                userAnswers[idx] = parseInt(e.target.value);
            };
        });
        if (document.getElementById('prevBtn'))
            document.getElementById('prevBtn').onclick = () => { current--; renderQuestion(current); };
        if (document.getElementById('nextBtn'))
            document.getElementById('nextBtn').onclick = () => { current++; renderQuestion(current); };
        if (document.getElementById('finishBtn'))
            document.getElementById('finishBtn').onclick = showResult;
        document.getElementById('closeQuizBtn').onclick = closePlayQuizModal;
    }

    function showResult() {
        let correct = 0;
        questions.forEach((q, i) => {
            if (userAnswers[i] === q.correct_answer) correct++;
        });
        content.innerHTML = `
            <div class="quiz-play-header">
                <h3>Resultado</h3>
            </div>
            <div class="quiz-play-result">
                <p>Você acertou <strong>${correct}</strong> de <strong>${questions.length}</strong> perguntas!</p>
                <button id="closeQuizBtn">Fechar</button>
            </div>
        `;
        document.getElementById('closeQuizBtn').onclick = closePlayQuizModal;
    }

    function closePlayQuizModal() {
        modal.style.display = 'none';
        content.innerHTML = '';
    }

    modal.style.display = 'block';
    renderQuestion(current);
}

function deleteQuiz(quizId) {
    quizToDelete = quizId;
    document.getElementById('deleteModal').style.display = 'flex';
}

function confirmDelete() {
    if (!quizToDelete) return;
    
    fetch(`/api/quizzes/${quizToDelete}`, {
        method: 'DELETE',
        headers: {
            'user-id': currentUser.id
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            closeDeleteModal();
            loadUserQuizzes();
            showSuccess('Quiz excluído com sucesso!');
        } else {
            showError('Erro ao excluir quiz: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        showError('Erro ao excluir quiz. Tente novamente.');
    });
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    quizToDelete = null;
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

function showSuccess(message) {
    alert(message);
}

function showError(message) {
    alert(message);
}

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

window.addEventListener('click', function(e) {
    const loginModal = document.getElementById('loginModal');
    const registerModal = document.getElementById('registerModal');
    const deleteModal = document.getElementById('deleteModal');
    
    if (e.target === loginModal) {
        closeLoginModal();
    }
    if (e.target === registerModal) {
        closeRegisterModal();
    }
    if (e.target === deleteModal) {
        closeDeleteModal();
    }
}); 