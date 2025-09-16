document.addEventListener("DOMContentLoaded", () => {
    const { loadData, saveData, Utils } = window.SIGEAS;
    let data = loadData();

    (function ensureProfessor() {
        const user = JSON.parse(sessionStorage.getItem("sigeas_user") || "null");
        if (!user || user.role !== "professor") {
            window.location.href = "./index.html";
        } else {
            Utils.el("profName").textContent = user.name || user.username;
            window.professorUser = user;
        }
    })();

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
        const professorId = window.professorUser.id || "p-1";
        const turmas = data.turmas.filter(t => t.professorId === professorId);
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

    function openChamada(turmaId) {
        const container = Utils.el("chamadaArea");
        const turma = data.turmas.find(t => t.id === turmaId);
        if (!turma) {
            container.innerHTML = "<p>Turma não encontrada.</p>";
            return;
        }
        const alunos = data.alunos.filter(a => a.turmaId === turmaId);
        container.innerHTML = `<h3>${turma.nome} — Registrar Chamada</h3>`;
        if (alunos.length === 0) {
            container.innerHTML += "<p>Sem alunos matriculados.</p>";
            return;
        }

        const form = document.createElement("form");
        form.id = "chamadaForm";
        alunos.forEach(a => {
            const hoje = new Date().toISOString().slice(0, 10);
            const presencaAtual = data.presencas.find(p => p.alunoId === a.id && p.turmaId === turmaId && p.data === hoje);
            const isPresente = presencaAtual ? presencaAtual.presente : true; // Default to present

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
        });
        container.appendChild(form);

        const btnSave = document.createElement("button");
        btnSave.textContent = "Salvar Chamada";
        btnSave.className = "btn";
        btnSave.style.marginTop = "12px";
        btnSave.addEventListener("click", () => {
            const hoje = new Date().toISOString().slice(0, 10);
            alunos.forEach(a => {
                const radio = Utils.q(`input[name="presenca-${a.id}"]:checked`);
                const presente = radio ? radio.value === "presente" : false;

                const existingIndex = data.presencas.findIndex(p => p.alunoId === a.id && p.turmaId === turmaId && p.data === hoje);
                if (existingIndex !== -1) {
                    data.presencas[existingIndex].presente = presente;
                } else {
                    data.presencas.push({ alunoId: a.id, turmaId: turmaId, data: hoje, presente });
                }
            });
            saveData(data);
            alert("Chamada registrada.");
        });
        container.appendChild(btnSave);
        showProfessorView("chamada");
    }

    function openNotas(turmaId) {
        const container = Utils.el("notasArea");
        const turma = data.turmas.find(t => t.id === turmaId);
        const alunos = data.alunos.filter(a => a.turmaId === turmaId);
        container.innerHTML = `<h3>${turma.nome} — Lançar Notas</h3>`;
        if (alunos.length === 0) {
            container.innerHTML += "<p>Sem alunos matriculados.</p>";
            return;
        }

        const table = document.createElement("table");
        table.style.width = "100%";
        table.innerHTML = `<thead><tr><th>Aluno</th><th>Bimestre</th><th>Disciplina</th><th>Nota</th></tr></thead>`;
        const tbody = document.createElement("tbody");
        alunos.forEach(a => {
            for (let b = 1; b <= 2; b++) {
                const tr = document.createElement("tr");
                const notaObj = data.notas.find(n => n.alunoId === a.id && n.turmaId === turmaId && n.bimestre === b) || { valor: "", disciplina: turma.nome }; // Default disciplina to turma name
                tr.innerHTML = `<td>${a.nome}</td>
                    <td>${b}</td>
                    <td><input type="text" data-aluno="${a.id}" data-turma="${turmaId}" data-bim="${b}" class="input-disciplina" value="${notaObj.disciplina || turma.nome}"></td>
                    <td><input type="number" min="0" max="10" step="0.5" data-aluno="${a.id}" data-turma="${turmaId}" data-bim="${b}" class="input-nota" value="${notaObj.valor || ""}"></td>`;
                tbody.appendChild(tr);
            }
        });
        table.appendChild(tbody);
        container.appendChild(table);

        const btnSave = document.createElement("button");
        btnSave.textContent = "Salvar Notas";
        btnSave.className = "btn";
        btnSave.style.marginTop = "12px";
        btnSave.addEventListener("click", () => {
            const notaInputs = Utils.qa("input.input-nota", container);
            const disciplinaInputs = Utils.qa("input.input-disciplina", container);

            notaInputs.forEach((inp, index) => {
                const alunoId = inp.dataset.aluno;
                const turmaId = inp.dataset.turma;
                const bim = Number(inp.dataset.bim);
                const valor = parseFloat(inp.value);
                const disciplina = disciplinaInputs[index].value.trim();

                const existingIndex = data.notas.findIndex(n => n.alunoId === alunoId && n.turmaId === turmaId && n.bimestre === bim);
                if (!isNaN(valor) && disciplina) {
                    if (existingIndex !== -1) {
                        data.notas[existingIndex].valor = valor;
                        data.notas[existingIndex].disciplina = disciplina;
                    } else {
                        data.notas.push({ alunoId: alunoId, turmaId: turmaId, disciplina: disciplina, bimestre: bim, valor: valor });
                    }
                } else if (existingIndex !== -1) {
                    data.notas.splice(existingIndex, 1);
                }
            });
            saveData(data);
            alert("Notas salvas.");
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

    renderTurmasProfessor();
    showProfessorView("minhasTurmas");
});