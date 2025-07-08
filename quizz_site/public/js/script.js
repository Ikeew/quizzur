const API_BASE_URL = 'http://localhost:3000';
var currentUser = null;
let isAdmin = false;
let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = {};

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadUserStats();
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
    const statsSection = document.getElementById('statsSection');

    if (currentUser) {
        userName.textContent = currentUser.name;
        dropdownDivider.style.display = 'block';
        logoutBtn.style.display = 'block';
        
        if (currentUser.isAdmin) {
            adminNavItem.style.display = 'block';
        }
        
        if (statsSection) {
            statsSection.style.display = 'block';
        }
    } else {
        userName.textContent = 'Entrar';
        dropdownDivider.style.display = 'none';
        logoutBtn.style.display = 'none';
        adminNavItem.style.display = 'none';
        
        if (statsSection) {
            statsSection.style.display = 'none';
        }
    }
}

function loadUserStats() {
    if (!currentUser) return;
    
    document.getElementById('totalQuizzes').textContent = '0';
    document.getElementById('averageScore').textContent = '0%';
    document.getElementById('bestScore').textContent = '0%';
}

function navigateToCategory(category) {
    window.location.href = `explore.html?category=${category}`;
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

function setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    const addQuestionForm = document.getElementById('addQuestionForm');
    if (addQuestionForm) {
        addQuestionForm.addEventListener('submit', handleAddQuestion);
    }
}

function showAddQuestionModal() {
    const modal = document.getElementById('addQuestionModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeAddQuestionModal() {
    const modal = document.getElementById('addQuestionModal');
    if (modal) {
        modal.style.display = 'none';
        const form = document.getElementById('addQuestionForm');
        if (form) form.reset();
    }
}

async function handleAddQuestion(e) {
    e.preventDefault();
    
    const formData = {
        category: document.getElementById('questionCategory').value,
        text: document.getElementById('questionText').value,
        optionA: document.getElementById('optionA').value,
        optionB: document.getElementById('optionB').value,
        optionC: document.getElementById('optionC').value,
        optionD: document.getElementById('optionD').value,
        correctAnswer: document.getElementById('correctAnswer').value
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/questions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Pergunta adicionada com sucesso!', 'success');
            closeAddQuestionModal();
            
            if (typeof loadQuestions === 'function') {
                loadQuestions();
            }
        } else {
            showNotification(data.message || 'Erro ao adicionar pergunta', 'error');
        }
    } catch (error) {
        console.error('Erro ao adicionar pergunta:', error);
        showNotification('Erro de conexão', 'error');
    }
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

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

if (!document.querySelector('#notification-styles')) {
    const notificationStyles = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            color: white;
            font-weight: 600;
            z-index: 3000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification-success {
            background: linear-gradient(135deg, #10b981, #059669);
        }
        
        .notification-error {
            background: linear-gradient(135deg, #ef4444, #dc2626);
        }
        
        .notification-warning {
            background: linear-gradient(135deg, #f59e0b, #d97706);
        }
        
        .notification-info {
            background: linear-gradient(135deg, #3b82f6, #2563eb);
        }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.id = 'notification-styles';
    styleSheet.textContent = notificationStyles;
    document.head.appendChild(styleSheet);
}

window.loadAllQuizzes = loadAllQuizzes;
