let createPageQuestionCounter = 0;

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        createPageInit();
    }, 100);
});

function createPageInit() {
    const userId = localStorage.getItem('userId');
    if (userId) {
        if (typeof currentUser !== 'undefined' && currentUser) {
            // Usuário já carregado pelo script.js
        } else {
            // Buscar dados do usuário
            fetch('/api/auth/me', {
                headers: {
                    'user-id': userId
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    currentUser = data.user;
                }
            })
            .catch(error => {
                console.error('Erro ao carregar usuário:', error);
            });
        }
    }
    
    // Adicionar primeira pergunta
    addQuestion();
}

function addQuestion() {
    createPageQuestionCounter++;
    
    const questionsContainer = document.getElementById('questionsContainer');
    
    if (!questionsContainer) {
        console.error('Container de perguntas não encontrado!');
        return;
    }
    
    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-item';
    questionDiv.innerHTML = `
        <div class="question-header">
            <h4>Pergunta ${createPageQuestionCounter}</h4>
            <button type="button" class="btn btn-danger btn-sm" onclick="removeQuestion(this)">
                <i class="fas fa-trash"></i>
            </button>
        </div>
        <div class="form-group">
            <label>Pergunta</label>
            <input type="text" class="question-text" required placeholder="Digite a pergunta">
        </div>
        <div class="form-group">
            <label>Alternativas</label>
            <div class="alternatives-container">
                <div class="alternative-item">
                    <input type="radio" name="correct_${createPageQuestionCounter}" value="0" required>
                    <input type="text" class="alternative-text" placeholder="Alternativa A" required>
                </div>
                <div class="alternative-item">
                    <input type="radio" name="correct_${createPageQuestionCounter}" value="1" required>
                    <input type="text" class="alternative-text" placeholder="Alternativa B" required>
                </div>
                <div class="alternative-item">
                    <input type="radio" name="correct_${createPageQuestionCounter}" value="2" required>
                    <input type="text" class="alternative-text" placeholder="Alternativa C" required>
                </div>
                <div class="alternative-item">
                    <input type="radio" name="correct_${createPageQuestionCounter}" value="3" required>
                    <input type="text" class="alternative-text" placeholder="Alternativa D" required>
                </div>
            </div>
        </div>
    `;
    
    questionsContainer.appendChild(questionDiv);
}

function removeQuestion(button) {
    const questionItem = button.closest('.question-item');
    questionItem.remove();
    
    // Renumerar perguntas
    const questions = document.querySelectorAll('.question-item');
    questions.forEach((question, index) => {
        const header = question.querySelector('.question-header h4');
        header.textContent = `Pergunta ${index + 1}`;
    });
    createPageQuestionCounter = questions.length;
}

document.getElementById('quizForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (!currentUser) {
        alert('Você precisa estar logado para criar um quiz.');
        return;
    }
    
    // Coletar dados do formulário
    const quizData = {
        title: document.getElementById('quizTitle').value,
        description: document.getElementById('quizDescription').value,
        category: document.getElementById('quizCategory').value,
        difficulty: document.getElementById('quizDifficulty').value,
        timeLimit: document.getElementById('quizTimeLimit').value || null,
        isPublic: document.getElementById('quizPublic').checked,
        questions: []
    };
    
    console.log('Dados básicos do quiz:', quizData);
    
    // Coletar perguntas
    const questionItems = document.querySelectorAll('.question-item');
    console.log('Encontradas', questionItems.length, 'perguntas');
    
    questionItems.forEach((item, index) => {
        const questionText = item.querySelector('.question-text').value;
        const alternatives = Array.from(item.querySelectorAll('.alternative-text')).map(input => input.value);
        const correctAnswerElement = item.querySelector(`input[name="correct_${index + 1}"]:checked`);
        
        console.log(`Pergunta ${index + 1}:`, {
            questionText,
            alternatives,
            correctAnswerElement: correctAnswerElement ? correctAnswerElement.value : 'NÃO SELECIONADO'
        });
        
        if (!correctAnswerElement) {
            alert(`Selecione a resposta correta para a pergunta ${index + 1}`);
            return;
        }
        
        const correctAnswer = parseInt(correctAnswerElement.value);
        
        quizData.questions.push({
            question: questionText,
            alternatives: alternatives,
            correctAnswer: correctAnswer
        });
    });
    
    console.log('Dados completos do quiz:', quizData);
    
    // Validar dados
    if (quizData.questions.length === 0) {
        alert('Adicione pelo menos uma pergunta.');
        return;
    }
    
    // Enviar para o servidor
    fetch('/api/quizzes', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'user-id': currentUser.id
        },
        body: JSON.stringify(quizData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Quiz criado com sucesso!');
            window.location.href = 'my-quizzes.html';
        } else {
            alert('Erro ao criar quiz: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Erro ao criar quiz. Tente novamente.');
    });
}); 