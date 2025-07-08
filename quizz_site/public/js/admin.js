let currentUser = null;
let adminStats = {};
let users = [];
let questions = [];

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
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
                if (currentUser.isAdmin) {
                    updateUserMenu();
                    loadAdminData();
                } else {
                    alert('Acesso negado. Apenas administradores podem acessar esta página.');
                    window.location.href = 'index.html';
                }
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
    alert('Você precisa estar logado como administrador para acessar esta página.');
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

function loadAdminData() {
    loadStats();
    loadUsers();
    loadQuestions();
}

function loadStats() {
    fetch('/api/admin/stats', {
        headers: {
            'user-id': currentUser.id
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            adminStats = data.stats;
            displayStats();
        } else {
            showError('Erro ao carregar estatísticas: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        showError('Erro ao carregar estatísticas. Tente novamente.');
    });
}

function displayStats() {
    document.getElementById('totalUsers').textContent = adminStats.totalUsers || 0;
    document.getElementById('totalQuizzes').textContent = adminStats.totalQuizzes || 0;
    document.getElementById('totalQuestions').textContent = adminStats.totalQuestions || 0;
    document.getElementById('totalResults').textContent = adminStats.totalResults || 0;
}

function loadUsers() {
    fetch('/api/admin/users', {
        headers: {
            'user-id': currentUser.id
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            users = data.users;
            displayUsers();
        } else {
            showError('Erro ao carregar usuários: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        showError('Erro ao carregar usuários. Tente novamente.');
    });
}

function displayUsers() {
    const container = document.getElementById('usersContainer');
    
    if (users.length === 0) {
        container.innerHTML = '<p>Nenhum usuário encontrado.</p>';
        return;
    }
    
    const usersHTML = users.map(user => `
        <div class="user-card">
            <div class="user-info">
                <h4>${user.name}</h4>
                <p>${user.email}</p>
                <span class="user-role ${user.isAdmin ? 'admin' : 'user'}">
                    ${user.isAdmin ? 'Administrador' : 'Usuário'}
                </span>
            </div>
            <div class="user-stats">
                <div class="stat">
                    <span class="stat-number">${user.totalQuizzes}</span>
                    <span class="stat-label">Quizzes</span>
                </div>
                <div class="stat">
                    <span class="stat-number">${user.averageScore}%</span>
                    <span class="stat-label">Média</span>
                </div>
            </div>
            <div class="user-actions">
                <button class="btn btn-secondary btn-sm" onclick="viewUserDetails(${user.id})">
                    <i class="fas fa-eye"></i> Ver
                </button>
                <button class="btn btn-warning btn-sm" onclick="toggleUserRole(${user.id})">
                    <i class="fas fa-user-cog"></i> ${user.isAdmin ? 'Remover Admin' : 'Tornar Admin'}
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = usersHTML;
}

function loadQuestions() {
    fetch('/api/admin/questions', {
        headers: {
            'user-id': currentUser.id
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            questions = data.questions;
            displayQuestions();
        } else {
            showError('Erro ao carregar perguntas: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        showError('Erro ao carregar perguntas. Tente novamente.');
    });
}

function displayQuestions() {
    const container = document.getElementById('questionsContainer');
    
    if (questions.length === 0) {
        container.innerHTML = '<p>Nenhuma pergunta encontrada.</p>';
        return;
    }
    
    const questionsHTML = questions.map(question => `
        <div class="question-card">
            <div class="question-info">
                <h4>${question.question}</h4>
                <p><strong>Quiz:</strong> ${question.quizTitle || 'N/A'}</p>
                <p><strong>Autor:</strong> ${question.authorName || 'N/A'}</p>
                <div class="alternatives">
                    <span class="alternative ${question.correctAnswer === 0 ? 'correct' : ''}">A: ${question.alternative1}</span>
                    <span class="alternative ${question.correctAnswer === 1 ? 'correct' : ''}">B: ${question.alternative2}</span>
                    <span class="alternative ${question.correctAnswer === 2 ? 'correct' : ''}">C: ${question.alternative3}</span>
                    <span class="alternative ${question.correctAnswer === 3 ? 'correct' : ''}">D: ${question.alternative4}</span>
                </div>
            </div>
            <div class="question-actions">
                <button class="btn btn-secondary btn-sm" onclick="viewQuestionDetails(${question.id})">
                    <i class="fas fa-eye"></i> Ver
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteQuestion(${question.id})">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = questionsHTML;
}

function viewUserDetails(userId) {
    alert('Funcionalidade de visualizar detalhes do usuário será implementada em breve!');
}

function toggleUserRole(userId) {
    alert('Funcionalidade de alterar role do usuário será implementada em breve!');
}

function viewQuestionDetails(questionId) {
    alert('Funcionalidade de visualizar detalhes da pergunta será implementada em breve!');
}

function deleteQuestion(questionId) {
    if (confirm('Tem certeza que deseja excluir esta pergunta?')) {
        alert('Funcionalidade de excluir pergunta será implementada em breve!');
    }
}

function showTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.style.display = 'none');
    
    const buttons = document.querySelectorAll('.tab-button');
    buttons.forEach(button => button.classList.remove('active'));
    
    document.getElementById(tabName).style.display = 'block';
    
    event.target.classList.add('active');
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
    
    if (e.target === loginModal) {
        closeLoginModal();
    }
    if (e.target === registerModal) {
        closeRegisterModal();
    }
}); 