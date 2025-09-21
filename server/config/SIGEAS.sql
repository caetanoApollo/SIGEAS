-- DROP DATABASE SIGEAS;

CREATE DATABASE SIGEAS;
USE SIGEAS;

CREATE TABLE alunos (
    id VARCHAR(20) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    dataNascimento DATE,
    endereco VARCHAR(255),
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE professores (
    id VARCHAR(20) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    materia VARCHAR(50)
);

CREATE TABLE turmas (
    id VARCHAR(20) PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    curso VARCHAR(100),
    professorId VARCHAR(20),
    vagas INT,
    descricao TEXT,
    horario VARCHAR(50),
    FOREIGN KEY (professorId) REFERENCES professores(id)
);

CREATE TABLE matriculas (
    alunoId VARCHAR(20),
    turmaId VARCHAR(20),
    data_matricula TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (alunoId, turmaId),
    FOREIGN KEY (alunoId) REFERENCES alunos(id),
    FOREIGN KEY (turmaId) REFERENCES turmas(id)
);

CREATE TABLE notas (
    alunoId VARCHAR(20),
    turmaId VARCHAR(20),
    bimestre INT,
    disciplina VARCHAR(100),
    valor DECIMAL(4,2),
    PRIMARY KEY (alunoId, turmaId, bimestre, disciplina),
    FOREIGN KEY (alunoId) REFERENCES alunos(id),
    FOREIGN KEY (turmaId) REFERENCES turmas(id)
);

CREATE TABLE presencas (
    alunoId VARCHAR(20),
    turmaId VARCHAR(20),
    data DATE,
    presente TINYINT(1),
    PRIMARY KEY (alunoId, turmaId, data),
    FOREIGN KEY (alunoId) REFERENCES alunos(id),
    FOREIGN KEY (turmaId) REFERENCES turmas(id)
);

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','professor','aluno') NOT NULL,
    name VARCHAR(100),
    associated_id VARCHAR(20), -- Pode ser alunoId ou professorId
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO alunos (id, nome, email, dataNascimento, endereco) VALUES
('a-1', 'Sofia Almeida', 'sofia@student.edu', '2008-03-15', 'Rua das Flores, 123'),
('a-2', 'Gabriel Costa', 'gabriel@student.edu', '2007-11-20', 'Av. Principal, 456'),
('a-3', 'Laura Santos', 'laura@student.edu', '2008-01-05', 'Travessa da Paz, 78'),
('a-4', 'Juliana Oliveira', 'juliana@student.edu', '2009-06-25', 'Rua das Palmeiras, 30');

INSERT INTO professores (id, nome, email, telefone, materia) VALUES
('p-1', 'Ricardo Souza', 'ricardo@sigeas.edu', '11987654321', 'Matemática'),
('p-2', 'Ana Pereira', 'ana@sigeas.edu', '11998765432', 'Física e Artes'),
('p-3', 'Carlos Lima', 'carlos@sigeas.edu', '11976543210', 'História');

INSERT INTO turmas (id, nome, curso, professorId, vagas, descricao, horario) VALUES
('t-1', 'Matemática A', 'Ensino Médio', 'p-1', 30, 'Introdução à álgebra e geometria.', 'Seg/Qua 08:00-09:30'),
('t-2', 'História Moderna', 'Ensino Médio', 'p-3', 25, 'Estudo dos principais eventos da era moderna.', 'Ter/Qui 10:00-11:30'),
('t-3', 'Física Básica', 'Ensino Médio', 'p-2', 28, 'Fundamentos da mecânica e termodinâmica.', 'Seg/Qua 14:00-15:30'),
('t-4', 'Artes Visuais', 'Ensino Fundamental', 'p-2', 20, 'Introdução ao desenho e pintura.', 'Sex 16:00-17:30');

INSERT INTO matriculas (alunoId, turmaId) VALUES
('a-1', 't-1'),
('a-2', 't-1'),
('a-3', 't-3'),
('a-4', 't-4');

INSERT INTO notas (alunoId, turmaId, bimestre, disciplina, valor) VALUES
('a-1', 't-1', 1, 'Matemática', 8.5),
('a-2', 't-1', 1, 'Matemática', 5.0),
('a-3', 't-3', 1, 'Física', 7.0),
('a-1', 't-1', 2, 'Matemática', 9.0),
('a-2', 't-1', 2, 'Matemática', 6.5);

INSERT INTO presencas (alunoId, turmaId, data, presente) VALUES
('a-1', 't-1', '2025-08-01', 1),
('a-2', 't-1', '2025-08-01', 0),
('a-3', 't-3', '2025-08-01', 1),
('a-1', 't-1', '2025-08-03', 1),
('a-2', 't-1', '2025-08-03', 1);

INSERT INTO usuarios (username, password, role, name, associated_id) VALUES
('admin', '$2a$10$w09u7uR5vF6s.5e.w09u7uR5vF6s.5e.w09u7uR5vF6s.5e', 'admin', 'Beatriz (Admin)', NULL),
('ricardo', '$2a$10$w09u7uR5vF6s.5e.w09u7uR5vF6s.5e.w09u7uR5vF6s.5e', 'professor', 'Ricardo (Professor)', 'p-1'),
('ana', '$2a$10$w09u7uR5vF6s.5e.w09u7uR5vF6s.5e.w09u7uR5vF6s.5e', 'professor', 'Ana (Professor)', 'p-2'),
('sofia', '$2a$10$w09u7uR5vF6s.5e.w09u7uR5vF6s.5e.w09u7uR5vF6s.5e', 'aluno', 'Sofia (Aluno)', 'a-1'),
('gabriel', '$2a$10$w09u7uR5vF6s.5e.w09u7uR5vF6s.5e.w09u7uR5vF6s.5e', 'aluno', 'Gabriel (Aluno)', 'a-2'),
('laura', '$2a$10$w09u7uR5vF6s.5e.w09u7uR5vF6s.5e.w09u7uR5vF6s.5e', 'aluno', 'Laura (Aluno)', 'a-3');

select * from usuarios;