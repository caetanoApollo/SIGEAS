const bcrypt = require('bcryptjs');

const passwords = {
    admin: 'admin123',
    professor: 'prof123',
    aluno: 'aluno123'
};

const generateHashes = async () => {
    console.log('Gerando hashes...');
    const salt = await bcrypt.genSalt(10);

    const adminHash = await bcrypt.hash(passwords.admin, salt);
    const professorHash = await bcrypt.hash(passwords.professor, salt);
    const alunoHash = await bcrypt.hash(passwords.aluno, salt);

    console.log('--- Copie e use os valores abaixo para o seu SQL ---');
    console.log('Hash para "admin123":', adminHash);
    console.log('Hash para "prof123":', professorHash);
    console.log('Hash para "aluno123":', alunoHash);
};

generateHashes();