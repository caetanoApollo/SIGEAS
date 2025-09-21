document.addEventListener("DOMContentLoaded", () => {
    const { Utils } = window.SIGEAS;
    const API_URL = "http://localhost:4000";
    const token = Utils.getToken();
    let alunoUser;

    (async function ensureAluno() {
        const user = JSON.parse(sessionStorage.getItem("sigeas_user") || "null");
        if (!user || user.role !== "aluno") {
            window.location.href = "./index.html";
        } else {
            Utils.el("alunoName").textContent = user.name || user.username;
            alunoUser = user;
            await renderAlunoDashboard();
        }
    })();

    async function renderAlunoDashboard() {
        const alunoId = alunoUser.associated_id;
        if (!alunoId) {
            Utils.el("alunoTurmasList").innerHTML = "<p>ID do aluno não encontrado.</p>";
            return;
        }
        const headers = { "Authorization": `Bearer ${token}` };
        
        try {
            const aluno = await fetch(`${API_URL}/alunos/${alunoId}`, { headers }).then(res => res.json());
            const turma = await fetch(`${API_URL}/alunos/${alunoId}/turma`, { headers }).then(res => res.json());
            const presencas = await fetch(`${API_URL}/alunos/${alunoId}/presencas`, { headers }).then(res => res.json());
            const notas = await fetch(`${API_URL}/alunos/${alunoId}/notas`, { headers }).then(res => res.json());

            Utils.el("alunoNome").textContent = aluno.nome;
            Utils.el("alunoEmail").textContent = aluno.email;
            Utils.el("alunoDataNascimento").textContent = aluno.dataNascimento || "N/A";
            Utils.el("alunoEndereco").textContent = aluno.endereco || "N/A";

            const turmaWrap = Utils.el("alunoTurmasList");
            const turmaTitle = Utils.el("alunoTurmaTitle");
            if (turma.nome) {
                turmaTitle.textContent = `Matriculado em: ${turma.nome}`;
                turmaWrap.innerHTML = `
                    <p><strong>Curso:</strong> ${turma.curso}</p>
                    <p><strong>Descrição:</strong> ${turma.descricao || "N/A"}</p>
                    <p><strong>Horário:</strong> ${turma.horario || "N/A"}</p>
                `;
            } else {
                turmaTitle.textContent = "Sem turma matriculada";
                turmaWrap.innerHTML = "";
            }

            const pWrap = Utils.el("presencas");
            pWrap.innerHTML = "";
            if (presencas.length === 0) {
                pWrap.innerHTML = "<p>Nenhuma presença registrada.</p>";
            } else {
                const ul = document.createElement("ul");
                presencas.forEach(p => {
                    const li = document.createElement("li");
                    li.textContent = `${p.data} — ${p.presente ? "Presente" : "Falta"}`;
                    ul.appendChild(li);
                });
                pWrap.appendChild(ul);
                const total = presencas.length;
                const presentes = presencas.filter(p => p.presente).length;
                const perc = Math.round((presentes / total) * 100);
                pWrap.innerHTML += `<p class="small-note">Comparecimento: ${presentes}/${total} (${perc}%)</p>`;
            }

            const notasWrap = Utils.el("notasAluno");
            notasWrap.innerHTML = "";
            if (notas.length === 0) {
                notasWrap.innerHTML = "<p>Sem notas lançadas.</p>";
            } else {
                const tbl = document.createElement("table");
                tbl.style.width = "100%";
                tbl.innerHTML = `<thead><tr><th>Bimestre</th><th>Disciplina</th><th>Nota</th></tr></thead>`;
                const tbody = document.createElement("tbody");
                notas.forEach(n => {
                    const tr = document.createElement("tr");
                    tr.innerHTML = `<td>${n.bimestre}</td><td>${n.disciplina || "N/A"}</td><td>${n.valor}</td>`;
                    tbody.appendChild(tr);
                });
                tbl.appendChild(tbody);
                notasWrap.appendChild(tbl);
                const media = (notas.reduce((s, x) => s + (x.valor || 0), 0) / notas.length).toFixed(2);
                notasWrap.innerHTML += `<p class="small-note">Média atual: <strong>${isNaN(media) ? "—" : media}</strong></p>`;
            }
        } catch (error) {
            console.error("Erro ao buscar dados do aluno:", error);
            Utils.el("alunoTurmasList").innerHTML = "<p>Erro ao carregar dados. Verifique a conexão com o servidor.</p>";
        }
    }
});