document.addEventListener("DOMContentLoaded", () => {
    const { loadData, Utils } = window.SIGEAS;
    let data = loadData();

    (function ensureAluno() {
        const user = JSON.parse(sessionStorage.getItem("sigeas_user") || "null");
        if (!user || user.role !== "aluno") {
            window.location.href = "./index.html";
        } else {
            Utils.el("alunoName").textContent = user.name || user.username;
            window.alunoUser = user;
        }
    })();

    function renderAlunoDashboard() {
        const alunoId = window.alunoUser.id || "a-1";
        const aluno = data.alunos.find(a => a.id === alunoId);
        if (!aluno) {
            Utils.el("alunoTurmasList").innerHTML = "<p>Aluno não encontrado.</p>";
            return;
        }

        // Exibir informações do aluno
        Utils.el("alunoNome").textContent = aluno.nome;
        Utils.el("alunoEmail").textContent = aluno.email;
        Utils.el("alunoDataNascimento").textContent = aluno.dataNascimento || "N/A";
        Utils.el("alunoEndereco").textContent = aluno.endereco || "N/A";

        // Turma
        const turma = data.turmas.find(t => t.id === aluno.turmaId);
        if (turma) {
            Utils.el("alunoTurmaTitle").textContent = `Matriculado em: ${turma.nome}`;
            Utils.el("alunoTurmasList").innerHTML = `
                <p><strong>Curso:</strong> ${turma.curso}</p>
                <p><strong>Descrição:</strong> ${turma.descricao || "N/A"}</p>
                <p><strong>Horário:</strong> ${turma.horario || "N/A"}</p>
            `;
        } else {
            Utils.el("alunoTurmaTitle").textContent = "Sem turma matriculada";
            Utils.el("alunoTurmasList").innerHTML = "";
        }

        // Presenças
        const pWrap = Utils.el("presencas");
        pWrap.innerHTML = "";
        const alunoPresencas = data.presencas.filter(p => p.alunoId === alunoId && p.turmaId === aluno.turmaId);
        if (alunoPresencas.length === 0) {
            pWrap.innerHTML = "<p>Nenhuma presença registrada.</p>";
        } else {
            const ul = document.createElement("ul");
            alunoPresencas.forEach(p => {
                const li = document.createElement("li");
                li.textContent = `${p.data} — ${p.presente ? "Presente" : "Falta"}`;
                ul.appendChild(li);
            });
            pWrap.appendChild(ul);
            const total = alunoPresencas.length;
            const presentes = alunoPresencas.filter(p => p.presente).length;
            const perc = Math.round((presentes / total) * 100);
            pWrap.innerHTML += `<p class="small-note">Comparecimento: ${presentes}/${total} (${perc}%)</p>`;
        }

        // Notas
        const notasWrap = Utils.el("notasAluno");
        notasWrap.innerHTML = "";
        const alunoNotas = data.notas.filter(n => n.alunoId === alunoId && n.turmaId === aluno.turmaId);
        if (alunoNotas.length === 0) {
            notasWrap.innerHTML = "<p>Sem notas lançadas.</p>";
        } else {
            const tbl = document.createElement("table");
            tbl.style.width = "100%";
            tbl.innerHTML = `<thead><tr><th>Bimestre</th><th>Disciplina</th><th>Nota</th></tr></thead>`;
            const tbody = document.createElement("tbody");
            alunoNotas.forEach(n => {
                const tr = document.createElement("tr");
                tr.innerHTML = `<td>${n.bimestre}</td><td>${n.disciplina || "N/A"}</td><td>${n.valor}</td>`;
                tbody.appendChild(tr);
            });
            tbl.appendChild(tbody);
            notasWrap.appendChild(tbl);
            const media = (alunoNotas.reduce((s, x) => s + (x.valor || 0), 0) / alunoNotas.length).toFixed(2);
            notasWrap.innerHTML += `<p class="small-note">Média atual: <strong>${isNaN(media) ? "—" : media}</strong></p>`;
        }
    }

    renderAlunoDashboard();
});