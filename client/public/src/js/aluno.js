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
            const [aluno, turma, presencas, notas] = await Promise.all([
                fetch(`${API_URL}/alunos/${alunoId}`, { headers }).then(res => res.json()),
                fetch(`${API_URL}/alunos/${alunoId}/turma`, { headers }).then(res => res.json()),
                fetch(`${API_URL}/alunos/${alunoId}/presencas`, { headers }).then(res => res.json()),
                fetch(`${API_URL}/alunos/${alunoId}/notas`, { headers }).then(res => res.json())
            ]);

            let dataNascimentoFormatada = aluno.dataNascimento || "N/A";
            if (dataNascimentoFormatada !== "N/A") {
                const dataObj = new Date(dataNascimentoFormatada);
                dataNascimentoFormatada = dataObj.toLocaleDateString('pt-BR');
            }

            Utils.el("alunoNome").textContent = aluno.nome;
            Utils.el("alunoEmail").textContent = aluno.email;
            Utils.el("alunoDataNascimento").textContent = dataNascimentoFormatada;
            Utils.el("alunoEndereco").textContent = aluno.endereco || "N/A";

            const turmaWrap = Utils.el("alunoTurmasList");
            const turmaTitle = Utils.el("alunoTurmaTitle");
            const faltasInfo = Utils.el("alunoFaltasInfo");
            if (turma.nome) {
                turmaTitle.textContent = `Matriculado em: ${turma.nome}`;
                turmaWrap.innerHTML = `
                    <p><strong>Curso:</strong> ${turma.curso}</p>
                    <p><strong>Descrição:</strong> ${turma.descricao || "N/A"}</p>
                    <p><strong>Horário:</strong> ${turma.horario || "N/A"}</p>
                `;
                
                const totalFaltas = presencas.filter(p => p.presente === 0).length;
                const totalAulas = turma.totalAulas || 0;
                const aulasFaltadas = presencas.length - presencas.filter(p => p.presente === 1).length;
                const limiteFaltas = Math.ceil(totalAulas * 0.25);
                
                faltasInfo.innerHTML = `<p><strong>Faltas:</strong> ${aulasFaltadas} de ${totalAulas} aulas totais.</p>`;
                if (aulasFaltadas > limiteFaltas) {
                    faltasInfo.innerHTML += `<p style="color:red; font-weight:bold;">Atenção! Você excedeu o limite de faltas (${limiteFaltas}).</p>`;
                }

            } else {
                turmaTitle.textContent = "Sem turma matriculada";
                turmaWrap.innerHTML = "";
            }
            
            // Lógica para Presenças
            const pWrap = Utils.el("presencas");
            const pBimestreWrap = Utils.el("presencasBimestre");
            pWrap.innerHTML = "";
            pBimestreWrap.innerHTML = "";
            if (presencas.length === 0) {
                pWrap.innerHTML = "<p>Nenhuma presença registrada.</p>";
                pBimestreWrap.innerHTML = "<p>Nenhum resumo de presença disponível.</p>";
            } else {
                const resumoBimestre = {};
                presencas.forEach(p => {
                    const bimestre = p.bimestre || 1;
                    if (!resumoBimestre[bimestre]) {
                        resumoBimestre[bimestre] = { total: 0, presentes: 0 };
                    }
                    resumoBimestre[bimestre].total++;
                    if (p.presente) {
                        resumoBimestre[bimestre].presentes++;
                    }
                });
                for (const bim in resumoBimestre) {
                    const { total, presentes } = resumoBimestre[bim];
                    const perc = Math.round((presentes / total) * 100);
                    pBimestreWrap.innerHTML += `<p><strong>Bimestre ${bim}:</strong> ${presentes}/${total} (${perc}%)</p>`;
                }
                
                const ul = document.createElement("ul");
                presencas.forEach(p => {
                    const li = document.createElement("li");
                    const status = p.presente ? "Presente" : "Falta";
                    const dataFormatada = new Date(p.data).toLocaleDateString('pt-BR');
                    li.textContent = `Data: ${dataFormatada} — Status: ${status} (Bimestre: ${p.bimestre || "N/A"})`;
                    ul.appendChild(li);
                });
                pWrap.appendChild(ul);
            }
            
            // Lógica para Notas
            const notasWrap = Utils.el("notasAluno");
            notasWrap.innerHTML = "";
            if (notas.length === 0) {
                notasWrap.innerHTML = "<p>Sem notas lançadas.</p>";
            } else {
                const notasPorBimestre = notas.reduce((acc, n) => {
                    if (!acc[n.bimestre]) acc[n.bimestre] = [];
                    acc[n.bimestre].push(n);
                    return acc;
                }, {});

                let totalPonderadoFinal = 0;
                let totalPesoFinal = 0;
                
                for (const bimestre in notasPorBimestre) {
                    const notasDoBimestre = notasPorBimestre[bimestre];
                    let totalPonderadoBimestre = 0;
                    let totalPesoBimestre = 0;

                    const tbl = document.createElement("table");
                    tbl.style.width = "100%";
                    tbl.innerHTML = `<thead><tr><th>Disciplina</th><th>Nota</th><th>Peso</th></tr></thead>`;
                    const tbody = document.createElement("tbody");

                    notasDoBimestre.forEach(n => {
                        const tr = document.createElement("tr");
                        const peso = n.peso || 1.0;
                        const valor = parseFloat(n.valor) || 0;
                        totalPonderadoBimestre += valor * peso;
                        totalPesoBimestre += peso;
                        
                        tr.innerHTML = `<td>${n.disciplina || "N/A"}</td><td>${n.valor}</td><td>${peso}</td>`;
                        tbody.appendChild(tr);
                    });
                    
                    tbl.appendChild(tbody);
                    notasWrap.innerHTML += `<h4>Bimestre ${bimestre}</h4>`;
                    notasWrap.appendChild(tbl);
                    
                    const mediaBimestre = totalPesoBimestre > 0 ? (totalPonderadoBimestre / totalPesoBimestre).toFixed(2) : "—";
                    notasWrap.innerHTML += `<p class="small-note">Média do Bimestre: <strong>${mediaBimestre}</strong></p>`;

                    totalPonderadoFinal += totalPonderadoBimestre;
                    totalPesoFinal += totalPesoBimestre;
                }
                
                const mediaFinal = totalPesoFinal > 0 ? (totalPonderadoFinal / totalPesoFinal).toFixed(2) : "—";
                Utils.el("mediaFinal").innerHTML = `Média Final: <strong>${mediaFinal}</strong>`;
            }
        } catch (error) {
            console.error("Erro ao buscar dados do aluno:", error);
            Utils.el("alunoTurmasList").innerHTML = "<p>Erro ao carregar dados. Verifique a conexão com o servidor.</p>";
        }
    }
});