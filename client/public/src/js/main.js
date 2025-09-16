const MOCK_USERS = [
    { username: 'admin', password: 'admin123', role: 'admin', name: 'Beatriz (Admin)' },
    { username: 'ricardo', password: 'prof123', role: 'professor', name: 'Ricardo (Professor)', id: 'p-1' },
    { username: 'sofia', password: 'aluno123', role: 'aluno', name: 'Sofia (Aluno)', id: 'a-1' },
    { username: 'ana', password: 'prof123', role: 'professor', name: 'Ana (Professor)', id: 'p-2' },
    { username: 'gabriel', password: 'aluno123', role: 'aluno', name: 'Gabriel (Aluno)', id: 'a-2' },
    { username: 'laura', password: 'aluno123', role: 'aluno', name: 'Laura (Aluno)', id: 'a-3' }
];

const INITIAL_DATA = {
    turmas: [
        { id: 't-1', nome: 'Matemática A', curso: 'Ensino Médio', professorId: 'p-1', vagas: 30, descricao: 'Introdução à álgebra e geometria.', horario: 'Seg/Qua 08:00-09:30' },
        { id: 't-2', nome: 'História Moderna', curso: 'Ensino Médio', professorId: 'p-3', vagas: 25, descricao: 'Estudo dos principais eventos da era moderna.', horario: 'Ter/Qui 10:00-11:30' },
        { id: 't-3', nome: 'Física Básica', curso: 'Ensino Médio', professorId: 'p-2', vagas: 28, descricao: 'Fundamentos da mecânica e termodinâmica.', horario: 'Seg/Qua 14:00-15:30' },
        { id: 't-4', nome: 'Artes Visuais', curso: 'Ensino Fundamental', professorId: 'p-2', vagas: 20, descricao: 'Introdução ao desenho e pintura.', horario: 'Sex 16:00-17:30' }
    ],
    professores: [
        { id: 'p-1', nome: 'Ricardo Souza', email: 'ricardo@sigeas.edu', telefone: '11987654321', departamento: 'Matemática' },
        { id: 'p-2', nome: 'Ana Pereira', email: 'ana@sigeas.edu', telefone: '11998765432', departamento: 'Física e Artes' },
        { id: 'p-3', nome: 'Carlos Lima', email: 'carlos@sigeas.edu', telefone: '11976543210', departamento: 'História' }
    ],
    alunos: [
        { id: 'a-1', nome: 'Sofia Almeida', email: 'sofia@student.edu', turmaId: 't-1', dataNascimento: '2008-03-15', endereco: 'Rua das Flores, 123' },
        { id: 'a-2', nome: 'Gabriel Costa', email: 'gabriel@student.edu', turmaId: 't-1', dataNascimento: '2007-11-20', endereco: 'Av. Principal, 456' },
        { id: 'a-3', nome: 'Laura Santos', email: 'laura@student.edu', turmaId: 't-3', dataNascimento: '2008-01-05', endereco: 'Travessa da Paz, 78' },
        { id: 'a-4', nome: 'Juliana Oliveira', email: 'juliana@student.edu', turmaId: 't-4', dataNascimento: '2009-06-25', endereco: 'Rua das Palmeiras, 30' }
    ],
    presencas: [
        { alunoId: 'a-1', turmaId: 't-1', data: '2025-08-01', presente: true },
        { alunoId: 'a-2', turmaId: 't-1', data: '2025-08-01', presente: false },
        { alunoId: 'a-3', turmaId: 't-3', data: '2025-08-01', presente: true },
        { alunoId: 'a-1', turmaId: 't-1', data: '2025-08-03', presente: true },
        { alunoId: 'a-2', turmaId: 't-1', data: '2025-08-03', presente: true },
    ],
    notas: [
        { alunoId: 'a-1', turmaId: 't-1', disciplina: 'Matemática', bimestre: 1, valor: 8.5 },
        { alunoId: 'a-2', turmaId: 't-1', disciplina: 'Matemática', bimestre: 1, valor: 5.0 },
        { alunoId: 'a-3', turmaId: 't-3', disciplina: 'Física', bimestre: 1, valor: 7.0 },
        { alunoId: 'a-1', turmaId: 't-1', disciplina: 'Matemática', bimestre: 2, valor: 9.0 },
        { alunoId: 'a-2', turmaId: 't-1', disciplina: 'Matemática', bimestre: 2, valor: 6.5 }
    ]
};

const STORAGE_KEY = 'sigeas_demo_data';

const loadData = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
        return structuredClone(INITIAL_DATA);
    }
    return JSON.parse(raw);
}

const saveData = (data) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const auth = (username, password) => {
    const user = MOCK_USERS.find(u => u.username === username && u.password === password);
    if (user) {
        sessionStorage.setItem('sigeas_user', JSON.stringify(user));
        return user;
    }
    return null;
}

const logout = () => {
    sessionStorage.removeItem('sigeas_user');
}

const Utils = {
    el: (id) => document.getElementById(id),
    q: (selector, scope = document) => scope.querySelector(selector),
    qa: (selector, scope = document) => Array.from(scope.querySelectorAll(selector))
};

window.SIGEAS = {
    loadData,
    saveData,
    MOCK_USERS,
    Utils
};

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = Utils.el('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = Utils.el('username').value.trim();
            const password = Utils.el('password').value.trim();
            const user = auth(username, password);
            if (!user) {
                Utils.el('loginError').textContent = 'Usuário ou senha inválidos';
                return;
            }
            if (user.role === 'admin') {
                window.location.href = './admin.html';
            } else if (user.role === 'professor') {
                window.location.href = './professor.html';
            } else {
                window.location.href = './aluno.html';
            }
        });
    }

    const logoutBtn = Utils.el('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logout();
            window.location.href = './index.html';
        });
    }
});