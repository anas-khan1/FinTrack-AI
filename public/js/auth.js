// Auth page logic
document.addEventListener('DOMContentLoaded', () => {
    // If already logged in, redirect to dashboard
    if (API.isLoggedIn()) {
        window.location.href = '/dashboard.html';
        return;
    }

    const overlay = document.getElementById('authOverlay');
    const loginSection = document.getElementById('loginSection');
    const signupSection = document.getElementById('signupSection');

    // Open modal
    const openAuth = (mode) => {
        overlay.classList.add('active');
        if (mode === 'signup') {
            loginSection.style.display = 'none';
            signupSection.style.display = 'block';
        } else {
            loginSection.style.display = 'block';
            signupSection.style.display = 'none';
        }
    };

    document.getElementById('openLoginBtn')?.addEventListener('click', () => openAuth('login'));
    document.getElementById('openSignupBtn')?.addEventListener('click', () => openAuth('signup'));
    document.getElementById('heroStartBtn')?.addEventListener('click', () => openAuth('signup'));
    document.getElementById('authClose')?.addEventListener('click', () => overlay.classList.remove('active'));
    document.getElementById('switchToSignup')?.addEventListener('click', (e) => { e.preventDefault(); openAuth('signup'); });
    document.getElementById('switchToLogin')?.addEventListener('click', (e) => { e.preventDefault(); openAuth('login'); });

    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('active'); });

    // Login
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('loginSubmitBtn');
        const errEl = document.getElementById('loginError');
        btn.textContent = 'Logging in...';
        btn.disabled = true;
        errEl.classList.remove('show');

        try {
            const data = await API.post('/auth/login', {
                email: document.getElementById('loginEmail').value,
                password: document.getElementById('loginPassword').value
            });
            API.setToken(data.token);
            API.setUser(data.user);
            window.location.href = '/dashboard.html';
        } catch (err) {
            errEl.textContent = err.message;
            errEl.classList.add('show');
            btn.textContent = 'Log In';
            btn.disabled = false;
        }
    });

    // Signup
    document.getElementById('signupForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('signupSubmitBtn');
        const errEl = document.getElementById('signupError');
        btn.textContent = 'Creating account...';
        btn.disabled = true;
        errEl.classList.remove('show');

        try {
            const data = await API.post('/auth/signup', {
                name: document.getElementById('signupName').value,
                email: document.getElementById('signupEmail').value,
                password: document.getElementById('signupPassword').value
            });
            API.setToken(data.token);
            API.setUser(data.user);
            window.location.href = '/dashboard.html';
        } catch (err) {
            errEl.textContent = err.message;
            errEl.classList.add('show');
            btn.textContent = 'Create Account';
            btn.disabled = false;
        }
    });
});
