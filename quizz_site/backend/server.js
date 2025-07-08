const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

let currentUsers = new Map();

function authenticateUser(req, res, next) {
  const userId = req.headers['user-id'];
  
  if (!userId || !currentUsers.has(parseInt(userId))) {
    return res.status(401).json({ 
      success: false, 
      message: 'Usuário não autenticado' 
    });
  }
  
  req.user = currentUsers.get(parseInt(userId));
  next();
}

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'quizzur'
});

db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar no banco:', err);
  } else {
    console.log('Conectado ao MySQL');
  }
});

function createTables() {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      isAdmin BOOLEAN DEFAULT FALSE,
      isActive BOOLEAN DEFAULT TRUE,
      level INT DEFAULT 1,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createQuizzesTable = `
    CREATE TABLE IF NOT EXISTS quizzes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      category VARCHAR(100) NOT NULL,
      difficulty VARCHAR(50) NOT NULL,
      timeLimit INT,
      isPublic BOOLEAN DEFAULT TRUE,
      userId INT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `;

  const createQuestionsTable = `
    CREATE TABLE IF NOT EXISTS questions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      quiz_id INT,
      question TEXT NOT NULL,
      alternative1 VARCHAR(255) NOT NULL,
      alternative2 VARCHAR(255) NOT NULL,
      alternative3 VARCHAR(255) NOT NULL,
      alternative4 VARCHAR(255) NOT NULL,
      correctAnswer INT NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    )
  `;

  const createResultsTable = `
    CREATE TABLE IF NOT EXISTS results (
      id INT AUTO_INCREMENT PRIMARY KEY,
      userId INT,
      quiz_id INT,
      score DECIMAL(5,2) NOT NULL,
      totalQuestions INT NOT NULL,
      correctAnswers INT NOT NULL,
      timeSpent INT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id),
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id)
    )
  `;

  db.query(createUsersTable, (err) => {
    if (err) console.error('Erro ao criar tabela users:', err);
  });

  db.query(createQuizzesTable, (err) => {
    if (err) console.error('Erro ao criar tabela quizzes:', err);
  });

  db.query(createQuestionsTable, (err) => {
    if (err) console.error('Erro ao criar tabela questions:', err);
  });

  db.query(createResultsTable, (err) => {
    if (err) console.error('Erro ao criar tabela results:', err);
  });

  insertSampleData();
}

function insertSampleData() {
  db.query('SELECT COUNT(*) as count FROM users', (err, results) => {
    if (err) return;
    
    if (results[0].count === 0) {
      const adminPassword = 'admin123';
      const adminUser = `
        INSERT INTO users (name, email, password, isAdmin) 
        VALUES ('Administrador', 'admin@quiz.com', '${adminPassword}', TRUE)
      `;
      
      db.query(adminUser, (err) => {
        if (err) console.error('Erro ao criar admin:', err);
        else console.log('Usuário admin criado');
      });
    }
  });
}

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    db.query('SELECT id FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) {
        return res.status(500).json({ 
          success: false,
          message: 'Erro interno do servidor' 
        });
      }

      if (results.length > 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Email já cadastrado' 
        });
      }

      const hashedPassword = password;

      const insertQuery = 'INSERT INTO users (name, email, password) VALUES (?, ?, ?)';
      db.query(insertQuery, [name, email, hashedPassword], (err, result) => {
        if (err) {
          return res.status(500).json({ 
            success: false,
            message: 'Erro ao criar usuário' 
          });
        }

        db.query('SELECT id, name, email, isAdmin, level, createdAt FROM users WHERE id = ?', [result.insertId], (err, userResults) => {
          if (err || userResults.length === 0) {
            return res.status(500).json({ 
              success: false,
              message: 'Erro ao buscar usuário criado' 
            });
          }

          const user = userResults[0];
          
          currentUsers.set(user.id, {
            ...user,
            role: user.isAdmin ? 'admin' : 'user'
          });

          res.status(201).json({ 
            success: true,
            message: 'Usuário criado com sucesso',
            user: {
              ...user,
              role: user.isAdmin ? 'admin' : 'user'
            }
          });
        });
      });
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor' 
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) {
        return res.status(500).json({ 
          success: false,
          message: 'Erro interno do servidor' 
        });
      }

      if (results.length === 0) {
        return res.status(401).json({ 
          success: false,
          message: 'Email ou senha incorretos' 
        });
      }

      const user = results[0];

      const isValidPassword = password === user.password;
      if (!isValidPassword) {
        return res.status(401).json({ 
          success: false,
          message: 'Email ou senha incorretos' 
        });
      }

      currentUsers.set(user.id, {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        level: user.level,
        role: user.isAdmin ? 'admin' : 'user'
      });

      res.json({ 
        success: true,
        message: 'Login realizado com sucesso',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          level: user.level,
          role: user.isAdmin ? 'admin' : 'user'
        }
      });
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Erro interno do servidor' 
    });
  }
});

app.get('/api/auth/me', authenticateUser, (req, res) => {
  res.json({ 
    success: true,
    user: req.user
  });
});

app.post('/api/auth/logout', authenticateUser, (req, res) => {
  currentUsers.delete(req.user.id);
  res.json({ 
    success: true,
    message: 'Logout realizado com sucesso'
  });
});

app.post('/api/quizzes', authenticateUser, async (req, res) => {
  try {
    const { title, description, category, difficulty, timeLimit, isPublic, questions } = req.body;
    const userId = req.user.id;

    console.log('Dados recebidos:', {
      title,
      description,
      category,
      difficulty,
      timeLimit,
      isPublic,
      questionsCount: questions ? questions.length : 0,
      questions: questions
    });

    const quizQuery = `
      INSERT INTO quizzes (title, description, category, difficulty, time_limit, is_public, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(quizQuery, [title, description, category, difficulty, timeLimit, isPublic, userId], (err, result) => {
      if (err) {
        console.error('Erro ao inserir quiz:', err);
        return res.status(500).json({
          success: false,
          message: 'Erro ao criar quiz'
        });
      }

      const quizId = result.insertId;
      console.log('Quiz criado com ID:', quizId);

      if (questions && questions.length > 0) {
        console.log('Inserindo', questions.length, 'perguntas...');
        
        const questionPromises = questions.map((question, index) => {
          return new Promise((resolve, reject) => {
            console.log(`Processando pergunta ${index + 1}:`, question);
            
            const questionQuery = `
              INSERT INTO questions (quiz_id, question_text, alternative1, alternative2, alternative3, alternative4, correct_answer)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            
            const questionData = [
              quizId,
              question.question,
              question.alternatives[0],
              question.alternatives[1],
              question.alternatives[2],
              question.alternatives[3],
              question.correctAnswer
            ];
            
            console.log('Dados da pergunta para inserção:', questionData);
            
            db.query(questionQuery, questionData, (err) => {
              if (err) {
                console.error(`Erro ao inserir pergunta ${index + 1}:`, err);
                reject(err);
              } else {
                console.log(`Pergunta ${index + 1} inserida com sucesso`);
                resolve();
              }
            });
          });
        });

        Promise.all(questionPromises)
          .then(() => {
            console.log('Todas as perguntas foram inseridas com sucesso');
            res.status(201).json({
              success: true,
              message: 'Quiz criado com sucesso',
              quizId: quizId
            });
          })
          .catch(error => {
            console.error('Erro ao inserir perguntas:', error);
            res.status(500).json({
              success: false,
              message: 'Erro ao criar perguntas do quiz'
            });
          });
      } else {
        console.log('Nenhuma pergunta para inserir');
        res.status(201).json({
          success: true,
          message: 'Quiz criado com sucesso',
          quizId: quizId
        });
      }
    });
  } catch (error) {
    console.error('Erro geral:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

app.get('/api/quizzes/public', async (req, res) => {
  try {
    const [quizzes] = await db.promise().execute(`
      SELECT 
        q.id, q.title, q.description, q.category, q.difficulty, 
        q.time_limit, q.is_public, q.created_at, q.user_id as userId,
        u.username as authorName,
        COUNT(p.id) as questionCount,
        COALESCE(AVG(r.score), 0) as averageScore,
        COUNT(DISTINCT r.id) as playCount
      FROM quizzes q
      LEFT JOIN users u ON q.user_id = u.id
      LEFT JOIN questions p ON q.id = p.quiz_id
      LEFT JOIN results r ON q.id = r.quiz_id
      WHERE q.is_public = 1
      GROUP BY q.id
      ORDER BY q.created_at DESC
    `);
    
    res.json({
      success: true,
      quizzes: quizzes.map(quiz => ({
        ...quiz,
        averageScore: Math.round(quiz.averageScore || 0),
        questionCount: parseInt(quiz.questionCount || 0),
        playCount: parseInt(quiz.playCount || 0)
      }))
    });
  } catch (error) {
    console.error('Erro ao buscar quizzes públicos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

app.get('/api/quizzes/my', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const [quizzes] = await db.promise().execute(`
      SELECT 
        q.id, q.title, q.description, q.category, q.difficulty, 
        q.time_limit, q.is_public, q.created_at, q.user_id,
        COUNT(p.id) as questionCount,
        COALESCE(AVG(r.score), 0) as averageScore,
        COUNT(DISTINCT r.id) as playCount
      FROM quizzes q
      LEFT JOIN questions p ON q.id = p.quiz_id
      LEFT JOIN results r ON q.id = r.quiz_id
      WHERE q.user_id = ?
      GROUP BY q.id
      ORDER BY q.created_at DESC
    `, [userId]);
    
    res.json({
      success: true,
      quizzes: quizzes.map(quiz => ({
        ...quiz,
        averageScore: Math.round(quiz.averageScore || 0),
        questionCount: parseInt(quiz.questionCount || 0),
        playCount: parseInt(quiz.playCount || 0)
      }))
    });
  } catch (error) {
    console.error('Erro ao buscar quizzes do usuário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

app.get('/api/quizzes/:id/questions', async (req, res) => {
  try {
    const quizId = req.params.id;
    const [questions] = await db.promise().execute(
      'SELECT id, question_text, alternative1, alternative2, alternative3, alternative4, correct_answer FROM questions WHERE quiz_id = ?',
      [quizId]
    );
    res.json({
      success: true,
      questions
    });
  } catch (error) {
    console.error('Erro ao buscar perguntas do quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar perguntas do quiz'
    });
  }
});

app.delete('/api/quizzes/:id', authenticateUser, async (req, res) => {
  try {
    const quizId = req.params.id;
    const userId = req.user.id;
    
    const [quiz] = await db.promise().execute(
      'SELECT * FROM quizzes WHERE id = ? AND user_id = ?',
      [quizId, userId]
    );
    
    if (quiz.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Quiz não encontrado ou você não tem permissão para excluí-lo'
      });
    }
    
    await db.promise().execute('DELETE FROM quizzes WHERE id = ?', [quizId]);
    
    res.json({
      success: true,
      message: 'Quiz excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

app.get('/api/admin/users', authenticateUser, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    const [users] = await db.promise().execute(`
      SELECT u.id, u.username, u.email, u.is_admin, u.created_at,
             COUNT(r.id) as totalQuizzes,
             AVG(r.score) as averageScore
      FROM users u
      LEFT JOIN results r ON u.id = r.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    
    res.json({
      success: true,
      users: users.map(user => ({
        ...user,
        totalQuizzes: parseInt(user.totalQuizzes) || 0,
        averageScore: Math.round(user.averageScore) || 0
      }))
    });
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

app.get('/api/admin/questions', authenticateUser, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    const [questions] = await db.promise().execute(`
      SELECT p.*, q.title as quizTitle, u.username as authorName
      FROM questions p
      LEFT JOIN quizzes q ON p.quiz_id = q.id
      LEFT JOIN users u ON q.user_id = u.id
      ORDER BY p.id DESC
    `);
    
    res.json({
      success: true,
      questions: questions
    });
  } catch (error) {
    console.error('Erro ao buscar perguntas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

app.get('/api/admin/stats', authenticateUser, async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    const [userCount] = await db.promise().execute('SELECT COUNT(*) as count FROM users');
    const [quizCount] = await db.promise().execute('SELECT COUNT(*) as count FROM quizzes');
    const [questionCount] = await db.promise().execute('SELECT COUNT(*) as count FROM questions');
    const [resultCount] = await db.promise().execute('SELECT COUNT(*) as count FROM results');

    res.json({
      success: true,
      stats: {
        totalUsers: userCount[0].count,
        totalQuizzes: quizCount[0].count,
        totalQuestions: questionCount[0].count,
        totalResults: resultCount[0].count
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
  console.log(`Acesse: http://localhost:${port}`);
});
