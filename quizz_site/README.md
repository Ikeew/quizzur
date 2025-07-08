# Quizzur - Plataforma de Quiz Interativa

Uma plataforma moderna e completa para criar e participar de quizzes interativos, com área administrativa e sistema de usuários.

## 🚀 Características

- **Design Moderno**: Interface limpa e responsiva com cabeçalho fixo e menu lateral
- **Sistema de Usuários**: Registro, login e perfis personalizados
- **Criação de Quizzes**: Ferramenta completa para criar quizzes personalizados
- **Exploração**: Sistema de busca e filtros para encontrar quizzes
- **Painel Administrativo**: Gerenciamento completo de usuários, perguntas e estatísticas
- **Estatísticas**: Acompanhamento de performance e progresso
- **Responsivo**: Funciona perfeitamente em desktop, tablet e mobile

## 📋 Pré-requisitos

- **Node.js** (versão 14 ou superior)
- **MySQL** (versão 5.7 ou superior)
- **npm** ou **yarn**

## 🛠️ Instalação

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd quizz-site
```

### 2. Configure o banco de dados
- Crie um banco de dados MySQL chamado `quizzur`
- Configure as credenciais no arquivo `backend/server.js` se necessário

### 3. Instale as dependências
```bash
cd quizz_site
npm install
```

### 4. Inicie o servidor
```bash
npm start
```

### 5. Acesse a aplicação
Abra seu navegador e acesse: `http://localhost:3000`

## 👤 Usuário Padrão

- **Email**: admin@quizzur.com
- **Senha**: admin123

## 📁 Estrutura do Projeto

```
quizz_site/
├── backend/
│   └── server.js          # Servidor Express
├── public/
│   ├── css/
│   │   └── style.css      # Estilos principais
│   ├── js/
│   │   ├── script.js      # JavaScript principal
│   │   ├── explore.js     # Página de explorar
│   │   ├── create.js      # Página de criar quiz
│   │   └── admin.js       # Página administrativa
│   ├── index.html         # Página inicial
│   ├── explore.html       # Página de explorar
│   ├── create.html        # Página de criar quiz
│   └── admin.html         # Página administrativa
├── package.json
└── README.md
```

## 🎯 Funcionalidades

### Página Inicial
- Apresentação da plataforma
- Categorias populares
- Estatísticas do usuário
- Navegação rápida

### Explorar Quizzes
- Lista de quizzes disponíveis
- Filtros por categoria e dificuldade
- Busca por texto
- Cards interativos

### Criar Quiz
- Formulário completo de criação
- Adição dinâmica de perguntas
- Validação em tempo real
- Auto-save de rascunhos

### Painel Administrativo
- Dashboard com estatísticas
- Gerenciamento de usuários
- Gerenciamento de perguntas
- Relatórios detalhados

## 🔧 Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Banco de Dados**: MySQL
- **Autenticação**: bcrypt
- **Ícones**: Font Awesome
- **Fontes**: Google Fonts (Inter)

## 🎨 Design System

### Cores Principais
- **Primária**: #4f46e5 (Indigo)
- **Secundária**: #7c3aed (Purple)
- **Sucesso**: #10b981 (Green)
- **Erro**: #ef4444 (Red)
- **Aviso**: #f59e0b (Yellow)

### Tipografia
- **Família**: Inter
- **Pesos**: 300, 400, 500, 600, 700

## 📱 Responsividade

O site é totalmente responsivo e funciona em:
- **Desktop**: Layout completo com menu lateral
- **Tablet**: Menu lateral colapsável
- **Mobile**: Menu lateral oculto, navegação otimizada

## 🔒 Segurança

- Senhas criptografadas com bcrypt
- Validação de entrada em todas as rotas
- Proteção contra SQL injection
- Autenticação de administradores

## 🚀 Deploy

### Local
```bash
npm start
```

### Produção
1. Configure variáveis de ambiente
2. Use um processo manager como PM2
3. Configure um proxy reverso (nginx)
4. Configure SSL/HTTPS

## 📊 APIs Disponíveis

### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login

### Perguntas
- `GET /api/questions` - Listar perguntas
- `POST /api/questions` - Criar pergunta
- `DELETE /api/questions/:id` - Excluir pergunta

### Quizzes
- `GET /api/quizzes` - Listar quizzes
- `POST /api/quizzes` - Criar quiz
- `DELETE /api/quizzes/:id` - Excluir quiz

### Usuários
- `GET /api/users` - Listar usuários
- `DELETE /api/users/:id` - Excluir usuário

### Estatísticas
- `GET /api/user/stats/:userId` - Estatísticas do usuário
- `GET /api/admin/stats` - Estatísticas administrativas

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🆘 Suporte

Se você encontrar algum problema ou tiver dúvidas:

1. Verifique se o MySQL está rodando
2. Confirme se todas as dependências foram instaladas
3. Verifique os logs do servidor
4. Abra uma issue no repositório

## 🔄 Atualizações

Para atualizar o projeto:

```bash
git pull origin main
npm install
npm start
```

---

**Quizzur** - Transformando a aprendizagem em diversão! 🎓✨ 