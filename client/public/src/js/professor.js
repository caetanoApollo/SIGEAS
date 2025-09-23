document.addEventListener("DOMContentLoaded", () => {
    const { Utils } = window.SIGEAS;
    const API_URL = "http://localhost:4000";
    const token = Utils.getToken();
    let cachedData = {};
    let professorUser;

    (async function ensureProfessor() {
        const user = JSON.parse(sessionStorage.getItem("sigeas_user") || "null");
        if (!user || user.role !== "professor") {
            window.location.href = "./index.html";
        } else {
            Utils.el("profName").textContent = user.name || user.username;
            professorUser = user;
            await fetchData();
            renderTurmasProfessor();
            showProfessorView("minhasTurmas");
        }
    })();

    async function fetchData() {
        const headers = { "Authorization": `Bearer ${token}` };
        cachedData.turmas = await fetch(`${API_URL}/turmas`, { headers }).then(res => res.json());
    }

    function showProfessorView(view) {
        Utils.qa(".view").forEach(v => v.classList.add("hidden"));
        const target = Utils.el(`view-${view}`);
        if (target) {
            target.classList.remove("hidden");
        }
        updateSidebar(view);
    }

    function updateSidebar(activeView) {
        Utils.qa(".sidebar li").forEach(i => i.classList.remove("active"));
        const activeItem = Utils.q(`[data-view="${activeView}"]`);
        if (activeItem) {
            activeItem.classList.add("active");
        }
    }

    function renderTurmasProfessor() {
        const container = Utils.el("profTurmas");
        container.innerHTML = "";
        const professorId = professorUser.associated_id || "p-1"; 
        const turmas = cachedData.turmas.filter(t => t.professorId === professorId);
        if (turmas.length === 0) {
            container.innerHTML = "<div class=\"card-min\"><p>Você não possui turmas alocadas.</p></div>";
            return;
        }
        turmas.forEach(t => {
            const div = document.createElement("div");
            div.className = "card-min";
            div.innerHTML = `
                <h4>${t.nome}</h4>
                <p><strong>Curso:</strong> ${t.curso}</p>
                <p><strong>Vagas:</strong> ${t.vagas}</p>
                <p><strong>Horário:</strong> ${t.horario || "N/A"}</p>
                <div style="margin-top:8px; display:flex; gap:8px;">
                    <button class="btn" data-action="chamada" data-id="${t.id}">Registrar Chamada</button>
                    <button class="btn" data-action="notas" data-id="${t.id}">Lançar Notas</button>
                </div>
            `;
            container.appendChild(div);
        });
    }

    async function openChamada(turmaId) {
        const container = Utils.el("chamadaArea");
        const turma = cachedData.turmas.find(t => t.id === turmaId);
        if (!turma) {
            container.innerHTML = "<p>Turma não encontrada.</p>";
            return;
        }

        const headers = { "Authorization": `Bearer ${token}` };
        const alunosDaTurma = await fetch(`${API_URL}/alunos/turma/${turmaId}`, { headers }).then(res => res.json());

        container.innerHTML = `<h3>${turma.nome} — Registrar Chamada</h3>`;
        if (alunosDaTurma.length === 0) {
            container.innerHTML += "<p>Sem alunos matriculados.</p>";
            return;
        }

        const presencasPorAluno = {};
        await Promise.all(
            alunosDaTurma.map(a => 
                fetch(`${API_URL}/alunos/${a.id}/presencas`, { headers }).then(res => res.json())
                    .then(presencas => { presencasPorAluno[a.id] = presencas; })
            )
        );

        const form = document.createElement("form");
        form.id = "chamadaForm";
        
        const bimestreSelector = document.createElement("div");
        bimestreSelector.innerHTML = `<label>Bimestre: </label>
                                      <select id="bimestre-select">
                                          <option value="1">1º Bimestre</option>
                                          <option value="2">2º Bimestre</option>
                                          <option value="3">3º Bimestre</option>
                                          <option value="4">4º Bimestre</option>
                                      </select>`;
        form.appendChild(bimestreSelector);

        alunosDaTurma.forEach(a => {
            const hoje = new Date().toISOString().slice(0, 10);
            const presencaAtual = presencasPorAluno[a.id].find(p => p.data === hoje);
            const isPresente = presencaAtual ? presencaAtual.presente : true;

            const row = document.createElement("div");
            row.style.display = "flex";
            row.style.justifyContent = "space-between";
            row.style.alignItems = "center";
            row.innerHTML = `<div><strong>${a.nome}</strong><div style="font-size:13px;color:#666">${a.email}</div></div>
                <div>
                    <label><input type="radio" name="presenca-${a.id}" value="presente" ${isPresente ? "checked" : ""}> Presente</label>
                    <label style="margin-left:8px"><input type="radio" name="presenca-${a.id}" value="falta" ${!isPresente ? "checked" : ""}> Falta</label>
                </div>`;
            form.appendChild(row);
            
            const resumoPresencas = {};
            presencasPorAluno[a.id].forEach(p => {
                const bimestre = p.bimestre || 1;
                if (!resumoPresencas[bimestre]) {
                    resumoPresencas[bimestre] = { total: 0, presentes: 0 };
                }
                resumoPresencas[bimestre].total++;
                if (p.presente) {
                    resumoPresencas[bimestre].presentes++;
                }
            });

            let resumoHtml = '';
            for (const bim in resumoPresencas) {
                const { total, presentes } = resumoPresencas[bim];
                const perc = Math.round((presentes / total) * 100);
                resumoHtml += `Bimestre ${bim}: ${presentes}/${total} (${perc}%) `;
            }
            if (resumoHtml) {
                const resumoDiv = document.createElement("div");
                resumoDiv.innerHTML = `<p class="small-note" style="margin-top: 5px;">${resumoHtml}</p>`;
                form.appendChild(resumoDiv);
            }
        });
        container.appendChild(form);

        const btnSave = document.createElement("button");
        btnSave.textContent = "Salvar Chamada";
        btnSave.className = "btn";
        btnSave.style.marginTop = "12px";
        btnSave.addEventListener("click", async () => {
            const hoje = new Date().toISOString().slice(0, 10);
            const bimestreAtual = Utils.el("bimestre-select").value;

            for (const aluno of alunosDaTurma) {
                const radio = Utils.q(`input[name="presenca-${aluno.id}"]:checked`);
                const presente = radio ? radio.value === "presente" : false;
                try {
                    await fetch(`${API_URL}/chamada`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                        body: JSON.stringify({ alunoId: aluno.id, turmaId: turmaId, data: hoje, presente, bimestre: bimestreAtual })
                    });
                } catch (error) {
                    console.error("Erro ao registrar chamada:", error);
                }
            }
            alert("Chamada registrada.");
            await fetchData();
            renderTurmasProfessor();
        });
        container.appendChild(btnSave);
        showProfessorView("chamada");
    }

    async function openNotas(turmaId) {
        const container = Utils.el("notasArea");
        const turma = cachedData.turmas.find(t => t.id === turmaId);
        const alunos = await fetch(`${API_URL}/alunos/turma/${turmaId}`, { headers: { "Authorization": `Bearer ${token}` } }).then(res => res.json());

        const headers = { "Authorization": `Bearer ${token}` };
        const notasPorAluno = {};
        await Promise.all(
            alunos.map(a => 
                fetch(`${API_URL}/alunos/${a.id}/notas`, { headers }).then(res => res.json())
                    .then(notas => { notasPorAluno[a.id] = notas; })
            )
        );

        container.innerHTML = `<h3>${turma.nome} — Lançar Notas</h3>`;
        if (alunos.length === 0) {
            container.innerHTML += "<p>Sem alunos matriculados.</p>";
            return;
        }

        alunos.forEach(a => {
            const alunoNotas = notasPorAluno[a.id];
            const notasValidas = alunoNotas.filter(n => typeof parseFloat(n.valor) === 'number' && !isNaN(parseFloat(n.valor)));
            const media = notasValidas.length > 0 ? (notasValidas.reduce((s, x) => s + parseFloat(x.valor), 0) / notasValidas.length).toFixed(2) : "—";

            const studentCard = document.createElement("div");
            studentCard.className = "card-min";
            studentCard.style.marginBottom = "1rem";
            studentCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h4>${a.nome}</h4>
                    <p>Média: <strong>${media}</strong></p>
                </div>
                <div class="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>Bimestre</th>
                                <th>Disciplina</th>
                                <th>Nota</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
            `;
            const tbody = studentCard.querySelector("tbody");

            const bimestresComNotas = [...new Set(alunoNotas.map(n => n.bimestre))].sort((a,b) => a-b);
            const todosOsBimestres = Array.from({length: Math.max(...bimestresComNotas, 2)}, (_, i) => i + 1);

            todosOsBimestres.forEach(b => {
                const tr = document.createElement("tr");
                const notaObj = alunoNotas.find(n => n.bimestre === b) || { valor: "", disciplina: turma.nome };
                
                tr.innerHTML = `
                    <td>${b}</td>
                    <td><input type="text" data-aluno="${a.id}" data-turma="${turmaId}" data-bim="${b}" class="input-disciplina" value="${notaObj.disciplina || turma.nome}"></td>
                    <td><input type="number" min="0" max="10" step="0.5" data-aluno="${a.id}" data-turma="${turmaId}" data-bim="${b}" class="input-nota" value="${notaObj.valor || ""}"></td>
                `;
                tbody.appendChild(tr);
            });
            container.appendChild(studentCard);
        });

        const btnSave = document.createElement("button");
        btnSave.textContent = "Salvar Notas";
        btnSave.className = "btn";
        btnSave.style.marginTop = "12px";
        btnSave.addEventListener("click", async () => {
            const notaInputs = Utils.qa("input.input-nota", container);
            const disciplinaInputs = Utils.qa("input.input-disciplina", container);
            for (let i = 0; i < notaInputs.length; i++) {
                const inp = notaInputs[i];
                const alunoId = inp.dataset.aluno;
                const turmaId = inp.dataset.turma;
                const bim = Number(inp.dataset.bim);
                const valor = parseFloat(inp.value);
                const disciplina = disciplinaInputs[i].value.trim();
                if (!isNaN(valor) && disciplina) {
                    try {
                        await fetch(`${API_URL}/notas`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                            body: JSON.stringify({ alunoId, turmaId, bimestre: bim, disciplina, valor })
                        });
                    } catch (error) {
                        console.error("Erro ao lançar notas:", error);
                    }
                }
            }
            alert("Notas salvas.");
            await fetchData();
            renderTurmasProfessor();
        });
        container.appendChild(btnSave);
        showProfessorView("notas");
    }

    document.addEventListener("click", (e) => {
        const btn = e.target.closest("button[data-action]");
        if (btn) {
            const action = btn.dataset.action;
            const id = btn.dataset.id;
            if (action === "chamada") openChamada(id);
            if (action === "notas") openNotas(id);
        }
        const navItem = e.target.closest(".sidebar li[data-view]");
        if (navItem) {
            const view = navItem.dataset.view;
            if (view === "minhasTurmas") {
                renderTurmasProfessor();
            }
            showProfessorView(view);
        }
    });
});