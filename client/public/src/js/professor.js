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
        cachedData.alunos = await fetch(`${API_URL}/alunos`, { headers }).then(res => res.json());
        cachedData.notas = await fetch(`${API_URL}/alunos/${professorUser.associated_id}/notas`, { headers }).then(res => res.json());
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
                <p><strong>Total de Aulas:</strong> ${t.totalAulas || 0}</p>
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

        const dateInput = document.createElement("div");
        dateInput.innerHTML = `<label>Data: </label><input type="date" id="data-chamada" value="${new Date().toISOString().slice(0, 10)}">`;
        form.appendChild(dateInput);

        const bimestreSelector = document.createElement("div");
        bimestreSelector.innerHTML = `<label>Bimestre: </label>
                                      <select id="bimestre-select">
                                          <option value="1">1º Bimestre</option>
                                          <option value="2">2º Bimestre</option>
                                          <option value="3">3º Bimestre</option>
                                          <option value="4">4º Bimestre</option>
                                      </select>`;
        form.appendChild(bimestreSelector);

        const hoje = form.querySelector("#data-chamada").value;

        alunosDaTurma.forEach(a => {
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
            const dataChamada = Utils.el("data-chamada").value;
            const bimestreAtual = Utils.el("bimestre-select").value;

            for (const aluno of alunosDaTurma) {
                const radio = Utils.q(`input[name="presenca-${aluno.id}"]:checked`);
                const presente = radio && radio.value === "presente";
                try {
                    await fetch(`${API_URL}/chamada`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                        body: JSON.stringify({ alunoId: aluno.id, turmaId: turmaId, data: dataChamada, presente, bimestre: bimestreAtual })
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

        const notasHtml = alunos.map(a => {
            const alunoNotas = notasPorAluno[a.id];

            let totalNotas = 0;
            let somaPonderada = 0;
            alunoNotas.forEach(n => {
                const valor = parseFloat(n.valor) || 0;
                const peso = parseFloat(n.peso) || 1;
                somaPonderada += valor * peso;
                totalNotas += peso;
            });
            const media = totalNotas > 0 ? (somaPonderada / totalNotas).toFixed(2) : "—";

            const notasListHtml = alunoNotas.map(n => `
                <div class="flex-end" style="margin-bottom: 8px;">
                    <input type="text" value="${n.disciplina}" data-id="${n.avaliacaoId}" data-campo="disciplina" data-aluno-id="${a.id}" data-turma-id="${turmaId}">
                    <input type="number" min="0" max="10" step="0.5" value="${n.valor}" data-id="${n.avaliacaoId}" data-campo="valor" data-aluno-id="${a.id}" data-turma-id="${turmaId}">
                    <input type="number" min="0" max="1" step="0.1" value="${n.peso || 1.0}" data-id="${n.avaliacaoId}" data-campo="peso" data-aluno-id="${a.id}" data-turma-id="${turmaId}">
                    <button class="btn btn-danger" data-action="delete-nota" data-id="${n.avaliacaoId}" data-turma-id="${turmaId}">Excluir</button>
                </div>
            `).join('');

            return `
                <div class="card-min" style="margin-bottom: 1rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h4>${a.nome}</h4>
                        <p>Média: <strong>${media}</strong></p>
                    </div>
                    <div>
                        <div class="flex-end" style="font-weight: bold; margin-bottom: 8px;">
                            <span style="flex:1;">Disciplina</span>
                            <span style="width: 80px;">Nota</span>
                            <span style="width: 80px;">Peso</span>
                            <span style="width: 80px;">Ações</span>
                        </div>
                        ${notasListHtml}
                        <div class="flex-end" style="margin-top: 1rem;">
                            <button class="btn" data-action="add-nota" data-aluno-id="${a.id}" data-turma-id="${turmaId}">Adicionar Nota</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML += notasHtml;
        showProfessorView("notas");
    }

    Utils.qa(".sidebar li[data-view]").forEach(navItem => {
        navItem.addEventListener("click", () => {
            const view = navItem.dataset.view;
            if (view === "minhasTurmas") {
                renderTurmasProfessor();
            }
            showProfessorView(view);
        });
    });

    document.addEventListener("click", async (e) => {
        const btn = e.target.closest("button[data-action]");
        if (!btn) return;
        const action = btn.dataset.action;
        const id = btn.dataset.id;

        if (action === "chamada") {
            openChamada(id);
        } else if (action === "notas") {
            openNotas(id);
        } else if (action === "add-nota") {
            const alunoId = btn.dataset.alunoId;
            const turmaId = btn.dataset.turmaId;
            const newNota = {
                alunoId,
                turmaId,
                bimestre: 1,
                disciplina: "",
                valor: 0,
                peso: 1.0
            };
            try {
                const response = await fetch(`${API_URL}/notas`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                    body: JSON.stringify(newNota)
                });
                if (response.ok) {
                    await fetchData();
                    await openNotas(turmaId);
                    alert("Nova nota adicionada. Preencha os campos e salve!");
                }
            } catch (error) {
                console.error("Erro ao adicionar nota:", error);
            }
        } else if (action === "delete-nota") {
            if (!confirm("Deseja realmente excluir esta nota?")) return;
            try {
                const turmaId = btn.dataset.turmaId;
                await fetch(`${API_URL}/notas/${id}`, {
                    method: "DELETE",
                    headers: { "Authorization": `Bearer ${token}` }
                });
                await fetchData();
                await openNotas(turmaId);
                alert("Nota excluída com sucesso!");
            } catch (error) {
                console.error("Erro ao excluir nota:", error);
            }
        }
    });

    Utils.el("notasArea").addEventListener("change", async (e) => {
        const inp = e.target;
        if (inp.dataset.campo) {
            const avaliacaoId = inp.dataset.id;
            const alunoId = inp.dataset.alunoId; // <-- NOVO: Pega o ID do aluno do HTML
            const campo = inp.dataset.campo;
            const valor = inp.value;
            const headers = { "Authorization": `Bearer ${token}` };

            if (!alunoId) {
                console.error("Erro: alunoId não encontrado no campo de input.");
                return;
            }

            try {

                const notasAluno = await fetch(`${API_URL}/alunos/${alunoId}/notas`, { headers }).then(res => res.json());

                
                const nota = notasAluno.find(n => n.avaliacaoId === Number(avaliacaoId));

                if (nota) {
                    nota[campo] = campo === "valor" || campo === "peso" ? parseFloat(valor) : valor;

                    nota.avaliacaoId = avaliacaoId;

                    const response = await fetch(`${API_URL}/notas`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                        body: JSON.stringify(nota)
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        console.error("Erro ao salvar nota:", error);
                    } else {
                        console.log("Nota salva com sucesso!");
                    }
                } else {
                    console.error("Nota não encontrada para o avaliacaoId:", avaliacaoId);
                }
            } catch (error) {
                console.error("Erro ao salvar nota:", error);
            }
        }
    })});