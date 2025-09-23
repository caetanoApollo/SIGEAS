document.addEventListener("DOMContentLoaded", () => {
    const { Utils } = window.SIGEAS;
    const modal = Utils.el("modal");
    const modalContent = Utils.el("modalContent");
    let cachedData = {};
    const API_URL = "http://localhost:4000";
    const token = Utils.getToken();

    (async function ensureAdmin() {
        const user = JSON.parse(sessionStorage.getItem("sigeas_user") || "null");
        if (!user || user.role !== "admin") {
            window.location.href = "./index.html";
        } else {
            Utils.el("currentUserName").textContent = user.name || user.username;
            await fetchData();
            showView("dashboard");
        }
    })();

    async function fetchData() {
        const headers = { "Authorization": `Bearer ${token}` };
        const [turmas, professores, alunos] = await Promise.all([
            fetch(`${API_URL}/turmas`, { headers }).then(res => res.json()),
            fetch(`${API_URL}/professores`, { headers }).then(res => res.json()),
            fetch(`${API_URL}/alunos`, { headers }).then(res => res.json())
        ]);
        cachedData = { turmas, professores, alunos };
    }

    function showView(view) {
        Utils.qa(".view").forEach(v => v.classList.add("hidden"));
        const target = Utils.el(`view-${view}`);
        if (target) {
            target.classList.remove("hidden");
        }
        updateSidebar(view);
        if (view === "dashboard") renderCounts();
        else if (view === "turmas") renderTurmas();
        else if (view === "professores") renderProfessores();
        else if (view === "alunos") renderAlunos();
    }

    function updateSidebar(activeView) {
        Utils.qa(".sidebar li").forEach(i => i.classList.remove("active"));
        const activeItem = Utils.q(`[data-view="${activeView}"]`);
        if (activeItem) {
            activeItem.classList.add("active");
        }
    }

    function renderCounts() {
        Utils.el("countTurmas").textContent = cachedData.turmas.length;
        Utils.el("countProfessores").textContent = cachedData.professores.length;
        Utils.el("countAlunos").textContent = cachedData.alunos.length;
    }

    function renderTurmas() {
        const tbody = Utils.q("#turmasTable tbody");
        tbody.innerHTML = "";
        cachedData.turmas.forEach(t => {
            const prof = cachedData.professores.find(p => p.id === t.professorId);
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${t.nome}</td>
                <td>${t.curso}</td>
                <td>${prof ? prof.nome : "<em>Sem professor</em>"}</td>
                <td>${t.vagas}</td>
                <td>${t.horario || "N/A"}</td>
                <td>
                    <button class="btn" data-action="edit" data-id="${t.id}">Editar</button>
                    <button class="btn" data-action="delete" data-id="${t.id}">Excluir</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderProfessores() {
        const tbody = Utils.q("#professoresTable tbody");
        tbody.innerHTML = "";
        cachedData.professores.forEach(p => {
            const turmas = cachedData.turmas.filter(t => t.professorId === p.id).map(t => t.nome).join(", ") || "<em>—</em>";
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${p.nome}</td>
                <td>${p.email}</td>
                <td>${p.telefone || "N/A"}</td>
                <td>${p.materia || "N/A"}</td>
                <td>${turmas}</td>
                <td>
                    <button class="btn" data-action="edit" data-id="${p.id}">Editar</button>
                    <button class="btn" data-action="delete" data-id="${p.id}">Excluir</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function renderAlunos() {
        const tbody = Utils.q("#alunosTable tbody");
        tbody.innerHTML = "";
        cachedData.alunos.forEach(a => {
            const turma = cachedData.turmas.find(t => t.id === a.turmaId);
            const dataNascimentoFormatada = a.dataNascimento ? new Date(a.dataNascimento).toLocaleDateString('pt-BR') : "N/A";
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${a.nome}</td>
                <td>${a.email}</td>
                <td>${turma ? turma.nome : "<em>Não matriculado</em>"}</td>
                <td>${dataNascimentoFormatada}</td>
                <td>${a.endereco || "N/A"}</td>
                <td>
                    <button class="btn" data-action="edit" data-id="${a.id}">Editar</button>
                    <button class="btn" data-action="delete" data-id="${a.id}">Excluir</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    function closeModal() {
        modal.classList.add("hidden");
        modalContent.innerHTML = "";
    }

    async function saveAndRefresh() {
        await fetchData();
        renderCounts();
        const currentView = Utils.q(".sidebar li.active").dataset.view;
        if (currentView === "turmas") renderTurmas();
        else if (currentView === "professores") renderProfessores();
        else if (currentView === "alunos") renderAlunos();
    }

    const modalTemplates = {
        turmas: (id) => {
            const turma = id ? cachedData.turmas.find(t => t.id === id) : { nome: "", curso: "", professorId: "", vagas: 20, descricao: "", horario: "" };
            return `
                <h3>${id ? "Editar Turma" : "Nova Turma"}</h3>
                <label>Nome</label>
                <input id="mNome" value="${turma.nome || ""}">
                <label>Curso</label>
                <input id="mCurso" value="${turma.curso || ""}">
                <label>Professor</label>
                <select id="mProfessor">
                    <option value="">-- Selecionar --</option>
                    ${cachedData.professores.map(p => `<option value="${p.id}" ${p.id === turma.professorId ? "selected" : ""}>${p.nome}</option>`).join("")}
                </select>
                <label>Vagas</label>
                <input id="mVagas" type="number" value="${turma.vagas || 20}">
                <label>Descrição</label>
                <textarea id="mDescricao">${turma.descricao || ""}</textarea>
                <label>Horário</label>
                <input id="mHorario" value="${turma.horario || ""}">
                <div style="margin-top:12px; display:flex; gap:8px; justify-content:flex-end">
                    <button id="saveItem" class="btn-primary" data-type="turmas" data-id="${id || ""}">${id ? "Salvar" : "Criar"}</button>
                    <button id="cancelModal" class="btn">Cancelar</button>
                </div>
            `;
        },
        professores: (id) => {
            const p = id ? cachedData.professores.find(x => x.id === id) : { nome: "", email: "", telefone: "", materia: "" };
            return `
                <h3>${id ? "Editar Professor" : "Novo Professor"}</h3>
                <label>Nome</label>
                <input id="mPnome" value="${p.nome || ""}">
                <label>Email</label>
                <input id="mPemail" value="${p.email || ""}">
                <label>Telefone</label>
                <input id="mPtelefone" value="${p.telefone || ""}">
                <label>Matéria</label>
                <input id="mMateria" value="${p.materia || ""}">
                <div style="margin-top:12px; display:flex; gap:8px; justify-content:flex-end">
                    <button id="saveItem" class="btn-primary" data-type="professores" data-id="${id || ""}">${id ? "Salvar" : "Criar"}</button>
                    <button id="cancelModal" class="btn">Cancelar</button>
                </div>
            `;
        },
        alunos: (id) => {
            const a = id ? cachedData.alunos.find(x => x.id === id) : { nome: "", email: "", turmaId: "", dataNascimento: "", endereco: "" };
            return `
                <h3>${id ? "Editar Aluno" : "Novo Aluno"}</h3>
                <label>Nome</label>
                <input id="mAnome" value="${a.nome || ""}">
                <label>Email</label>
                <input id="mAemail" value="${a.email || ""}">
                <label>Matricular em</label>
                <select id="mAturma">
                    <option value="">-- Nenhuma --</option>
                    ${cachedData.turmas.map(t => `<option value="${t.id}" ${t.id === a.turmaId ? "selected" : ""}>${t.nome}</option>`).join("")}
                </select>
                <label>Data de Nascimento</label>
                <input id="mDataNascimento" type="date" value="${a.dataNascimento || ""}">
                <label>Endereço</label>
                <input id="mEndereco" value="${a.endereco || ""}">
                <div style="margin-top:12px; display:flex; gap:8px; justify-content:flex-end">
                    <button id="saveItem" class="btn-primary" data-type="alunos" data-id="${id || ""}">${id ? "Salvar" : "Criar"}</button>
                    <button id="cancelModal" class="btn">Cancelar</button>
                </div>
            `;
        }
    };

    function openModal(type, id = null) {
        if (modalTemplates[type]) {
            modalContent.innerHTML = modalTemplates[type](id);
            modal.classList.remove("hidden");
            Utils.el("cancelModal").addEventListener("click", closeModal, { once: true });
            Utils.el("saveItem").addEventListener("click", (e) => {
                handleSave(e.target.dataset.type, e.target.dataset.id);
            });
        }
    }

    async function handleSave(type, id) {
        const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };
        let body = {};
        let method = id ? "PUT" : "POST";
        let endpoint = `${API_URL}/${type}`;
        if (id) endpoint += `/${id}`;

        if (type === "turmas") {
            const nome = Utils.el("mNome").value.trim();
            const curso = Utils.el("mCurso").value.trim();
            const professorId = Utils.el("mProfessor").value || null;
            const vagas = parseInt(Utils.el("mVagas").value || 20, 10);
            const descricao = Utils.el("mDescricao").value.trim();
            const horario = Utils.el("mHorario").value.trim();
            if (!nome || !curso) {
                alert("Preencha nome e curso.");
                return;
            }
            body = { nome, curso, professorId, vagas, descricao, horario };
            if (!id) body.id = "t-" + Date.now();
        } else if (type === "professores") {
            const nome = Utils.el("mPnome").value.trim();
            const email = Utils.el("mPemail").value.trim();
            const telefone = Utils.el("mPtelefone").value.trim();
            const materia = Utils.el("mMateria").value.trim();
            if (!nome || !email) {
                alert("Preencha nome e email.");
                return;
            }
            body = { nome, email, telefone, materia };
            if (!id) body.id = "p-" + Date.now();
        } else if (type === "alunos") {
            const nome = Utils.el("mAnome").value.trim();
            const email = Utils.el("mAemail").value.trim();
            const turmaId = Utils.el("mAturma").value || null;
            const dataNascimento = Utils.el("mDataNascimento").value.trim();
            const endereco = Utils.el("mEndereco").value.trim();
            if (!nome || !email) {
                alert("Preencha nome e email.");
                return;
            }
            body = { nome, email, turmaId, dataNascimento, endereco };
            if (!id) body.id = "a-" + Date.now();
        }

        try {
            const response = await fetch(endpoint, { method, headers, body: JSON.stringify(body) });
            if (response.ok) {
                alert("Item salvo com sucesso!");
                await saveAndRefresh();
                closeModal();
            } else {
                const error = await response.json();
                alert(`Erro ao salvar: ${error.error || response.statusText}`);
            }
        } catch (error) {
            console.error("Erro ao salvar:", error);
            alert("Erro ao salvar o item. Verifique a conexão com o servidor.");
        }
    }

    async function handleDelete(type, id) {
        if (!confirm("Deseja realmente excluir este item?")) return;
        try {
            const response = await fetch(`${API_URL}/${type}/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                alert("Item excluído com sucesso!");
                await saveAndRefresh();
            } else {
                const error = await response.json();
                alert(`Erro ao excluir: ${error.error || response.statusText}`);
            }
        } catch (error) {
            console.error("Erro ao excluir:", error);
            alert("Erro ao excluir o item. Verifique a conexão com o servidor.");
        }
    }

    function initAdmin() {
        Utils.qa(".sidebar li").forEach(item => {
            item.addEventListener("click", () => {
                const view = item.getAttribute("data-view");
                showView(view);
            });
        });

        Utils.el("addTurmaBtn").addEventListener("click", () => openModal("turmas"));
        Utils.el("addProfessorBtn").addEventListener("click", () => openModal("professores"));
        Utils.el("addAlunoBtn").addEventListener("click", () => openModal("alunos"));

        document.body.addEventListener("click", (e) => {
            const btn = e.target.closest("button[data-action]");
            if (!btn) return;
            const action = btn.dataset.action;
            const id = btn.dataset.id;
            const table = btn.closest("table");
            const type = table.id.replace("Table", "");

            if (action === "edit") {
                openModal(type, id);
            } else if (action === "delete") {
                handleDelete(type, id);
            }
        });

        Utils.el("modalClose").addEventListener("click", closeModal);
        modal.addEventListener("click", (ev) => {
            if (ev.target === ev.currentTarget) closeModal();
        });
    }

    initAdmin();
});