const API_URL = "http://localhost:4000";

const auth = async (username, password) => {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (response.ok) {
            sessionStorage.setItem("sigeas_user", JSON.stringify(data));
            sessionStorage.setItem("sigeas_token", data.token);
            return data;
        }
        return null;
    } catch (error) {
        console.error("Erro na autenticação:", error);
        return null;
    }
}

const logout = () => {
    sessionStorage.removeItem("sigeas_user");
    sessionStorage.removeItem("sigeas_token");
}

const Utils = {
    el: (id) => document.getElementById(id),
    q: (selector, scope = document) => scope.querySelector(selector),
    qa: (selector, scope = document) => Array.from(scope.querySelectorAll(selector)),
    getToken: () => sessionStorage.getItem("sigeas_token")
};

window.SIGEAS = {
    auth,
    Utils
};

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = Utils.el('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = Utils.el('username').value.trim();
            const password = Utils.el('password').value.trim();
            const user = await auth(username, password);
            if (!user) {
                Utils.el('loginError').textContent = 'Usuário ou senha inválidos';
                return;
            }
            if (user.role === 'admin') {
                window.location.href = './admin.html';
            } else if (user.role === 'professor') {
                window.location.href = './professor.html';
            } else {
                window.location.href = './aluno.html';
            }
        });
    }

    const logoutBtn = Utils.el('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            logout();
            window.location.href = './index.html';
        });
    }
});