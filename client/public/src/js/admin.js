document.addEventListener("DOMContentLoaded", () => {
    const { loadData, saveData, Utils } = window.SIGEAS;
    let data = loadData();
    const modal = Utils.el("modal");
    const modalContent = Utils.el("modalContent");

    /* Helper to ensure only admins access this page */
    (function ensureAdmin() {
        const user = JSON.parse(sessionStorage.getItem("sigeas_user") || "null");
        if (!user || user.role !== "admin") {
            window.location.href = "./index.html";
        } else {
            Utils.el("currentUserName").textContent = user.name || user.username;
        }
    })();

    /* ------- Navigation ------- */
    function showView(view) {
        Utils.qa(".view").forEach(v => v.classList.add("hidden"));
        const target = Utils.el(`view-${view}`);
        if (target) {
            target.classList.remove("hidden");
        }
        updateSidebar(view);
        // Render tables on demand
        if (view === "turmas") renderTurmas();
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

    /* ------- Dashboard counts ------- */
    function renderCounts() {
        Utils.el("countTurmas").textContent = data.turmas.length;
        Utils.el("countProfessores").textContent = data.professores.length;
        Utils.el("countAlunos").textContent = data.alunos.length;
    }

    /* ------- Tables rendering ------- */
    function renderTurmas() {
        const tbody = Utils.q("#turmasTable tbody");
        tbody.innerHTML = "";
        data.turmas.forEach(t => {
            const prof = data.professores.find(p => p.id === t.professorId);
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
        data.professores.forEach(p => {
            const turmas = data.turmas.filter(t => t.professorId === p.id).map(t => t.nome).join(", ") || "<em>—</em>";
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${p.nome}</td>
                <td>${p.email}</td>
                <td>${p.telefone || "N/A"}</td>
                <td>${p.departamento || "N/A"}</td>
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
        data.alunos.forEach(a => {
            const turma = data.turmas.find(t => t.id === a.turmaId);
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${a.nome}</td>
                <td>${a.email}</td>
                <td>${turma ? turma.nome : "<em>Não matriculado</em>"}</td>
                <td>${a.dataNascimento || "N/A"}</td>
                <td>${a.endereco || "N/A"}</td>
                <td>
                    <button class="btn" data-action="edit" data-id="${a.id}">Editar</button>
                    <button class="btn" data-action="delete" data-id="${a.id}">Excluir</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    /* ------- CRUD & Modals ------- */
    function closeModal() {
        modal.classList.add("hidden");
        modalContent.innerHTML = "";
    }

    function saveAndRefresh() {
        saveData(data);
        renderCounts();
        // Re-render the current visible view
        const currentView = Utils.q(".sidebar li.active").dataset.view;
        if (currentView === "turmas") renderTurmas();
        else if (currentView === "professores") renderProfessores();
        else if (currentView === "alunos") renderAlunos();
    }

    const modalTemplates = {
        turmas: (id) => {
            const turma = id ? data.turmas.find(t => t.id === id) : { nome: "", curso: "", professorId: "", vagas: 20, descricao: "", horario: "" };
            return `
                <h3>${id ? "Editar Turma" : "Nova Turma"}</h3>
                <label>Nome</label>
                <input id="mNome" value="${turma.nome || ""}">
                <label>Curso</label>
                <input id="mCurso" value="${turma.curso || ""}">
                <label>Professor</label>
                <select id="mProfessor">
                    <option value="">-- Selecionar --</option>
                    ${data.professores.map(p => `<option value="${p.id}" ${p.id === turma.professorId ? "selected" : ""}>${p.nome}</option>`).join("")}
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
            const p = id ? data.professores.find(x => x.id === id) : { nome: "", email: "", telefone: "", departamento: "" };
            return `
                <h3>${id ? "Editar Professor" : "Novo Professor"}</h3>
                <label>Nome</label>
                <input id="mPnome" value="${p.nome || ""}">
                <label>Email</label>
                <input id="mPemail" value="${p.email || ""}">
                <label>Telefone</label>
                <input id="mPtelefone" value="${p.telefone || ""}">
                <label>Departamento</label>
                <input id="mDepartamento" value="${p.departamento || ""}">
                <div style="margin-top:12px; display:flex; gap:8px; justify-content:flex-end">
                    <button id="saveItem" class="btn-primary" data-type="professores" data-id="${id || ""}">${id ? "Salvar" : "Criar"}</button>
                    <button id="cancelModal" class="btn">Cancelar</button>
                </div>
            `;
        },
        alunos: (id) => {
            const a = id ? data.alunos.find(x => x.id === id) : { nome: "", email: "", turmaId: "", dataNascimento: "", endereco: "" };
            return `
                <h3>${id ? "Editar Aluno" : "Novo Aluno"}</h3>
                <label>Nome</label>
                <input id="mAnome" value="${a.nome || ""}">
                <label>Email</label>
                <input id="mAemail" value="${a.email || ""}">
                <label>Matricular em</label>
                <select id="mAturma">
                    <option value="">-- Nenhuma --</option>
                    ${data.turmas.map(t => `<option value="${t.id}" ${t.id === a.turmaId ? "selected" : ""}>${t.nome}</option>`).join("")}
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

    function handleSave(type, id) {
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
            if (id) {
                Object.assign(data.turmas.find(x => x.id === id), { nome, curso, professorId, vagas, descricao, horario });
            } else {
                data.turmas.push({ id: "t-" + Date.now(), nome, curso, professorId, vagas, descricao, horario });
            }
        } else if (type === "professores") {
            const nome = Utils.el("mPnome").value.trim();
            const email = Utils.el("mPemail").value.trim();
            const telefone = Utils.el("mPtelefone").value.trim();
            const departamento = Utils.el("mDepartamento").value.trim();
            if (!nome || !email) {
                alert("Preencha nome e email.");
                return;
            }
            if (id) {
                Object.assign(data.professores.find(x => x.id === id), { nome, email, telefone, departamento });
            } else {
                data.professores.push({ id: "p-" + Date.now(), nome, email, telefone, departamento });
            }
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
            if (id) {
                Object.assign(data.alunos.find(x => x.id === id), { nome, email, turmaId, dataNascimento, endereco });
            } else {
                data.alunos.push({ id: "a-" + Date.now(), nome, email, turmaId, dataNascimento, endereco, presencas: [], notas: [] });
            }
        }
        saveAndRefresh();
        closeModal();
    }

    function handleDelete(table, id) {
        if (!confirm("Deseja realmente excluir este item?")) return;
        if (table.id === "turmasTable") {
            data.turmas = data.turmas.filter(t => t.id !== id);
        } else if (table.id === "professoresTable") {
            data.turmas.forEach(t => { if (t.professorId === id) t.professorId = null; });
            data.professores = data.professores.filter(p => p.id !== id);
        } else if (table.id === "alunosTable") {
            data.alunos = data.alunos.filter(a => a.id !== id);
        }
        saveAndRefresh();
    }

    /* ------- Initialization ------- */
    function initAdmin() {
        renderCounts();
        showView("dashboard");

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
                handleDelete(table, id);
            }
        });

        Utils.el("modalClose").addEventListener("click", closeModal);
        modal.addEventListener("click", (ev) => {
            if (ev.target === ev.currentTarget) closeModal();
        });
    }

    initAdmin();
});