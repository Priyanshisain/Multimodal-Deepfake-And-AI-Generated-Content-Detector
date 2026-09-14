/**
 * Multimodel Deepfake and AI Generated Content Detector
 * Authentication, Theme & Session Controller (Gatekeeper)
 */
(function () {
    const TOKEN_KEY = "detector_token";
    const TOKEN_KEY_ALT = "detector_auth_token";
    const USER_KEY = "detector_user";
    const USER_KEY_ALT = "detector_auth_user";
    const GUEST_KEY = "detector_guest";
    const GUEST_KEY_ALT = "detector_auth_guest";
    const THEME_KEY = "detector-theme";
    const GUEST_SCAN_COUNT_KEY = "detector_guest_scan_count";
    const GUEST_SCAN_LIMIT = 2;

    // Global switchAuthTab: Seamless switching between Login and Create Account
    window.switchAuthTab = function (tab) {
        const signInTab = document.getElementById("authTabSignIn");
        const signUpTab = document.getElementById("authTabSignUp");
        const navLoginBtn = document.getElementById("navLoginBtn");
        const navSignUpBtn = document.getElementById("navSignUpBtn");
        const signInForm = document.getElementById("portalSignInForm");
        const signUpForm = document.getElementById("portalSignUpForm");
        const signInErr = document.getElementById("portalSignInError");
        const signUpErr = document.getElementById("portalSignUpError");

        if (signInErr) signInErr.classList.add("hidden");
        if (signUpErr) signUpErr.classList.add("hidden");

        const isSignUp = (tab === "signup" || tab === "register" || tab === "create");

        if (isSignUp) {
            if (signInTab) signInTab.classList.remove("active");
            if (signUpTab) signUpTab.classList.add("active");
            if (navLoginBtn) navLoginBtn.classList.remove("active");
            if (navSignUpBtn) navSignUpBtn.classList.add("active");
            if (signInForm) signInForm.classList.add("hidden");
            if (signUpForm) signUpForm.classList.remove("hidden");

            const u = document.getElementById("portalSignUpUser");
            if (u) setTimeout(() => u.focus(), 60);
        } else {
            if (signInTab) signInTab.classList.add("active");
            if (signUpTab) signUpTab.classList.remove("active");
            if (navLoginBtn) navLoginBtn.classList.add("active");
            if (navSignUpBtn) navSignUpBtn.classList.remove("active");
            if (signInForm) signInForm.classList.remove("hidden");
            if (signUpForm) signUpForm.classList.add("hidden");

            const u = document.getElementById("portalSignInUser");
            if (u) setTimeout(() => u.focus(), 60);
        }
    };

    // Standardized Vector SVG Icons
    const SUN_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;

    const MOON_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;

    const EYE_OPEN_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;

    const EYE_OFF_SVG = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;

    // Unified Global Theme Switcher
    window.applyTheme = function (theme) {
        document.documentElement.setAttribute("data-theme", theme);
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch {}
        const iconSvg = theme === "dark" ? MOON_SVG : SUN_SVG;
        document.querySelectorAll(".theme-toggle-btn").forEach(btn => {
            btn.innerHTML = iconSvg;
            btn.setAttribute("title", `Current theme: ${theme} (Click to toggle)`);
            btn.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} mode`);
        });
    };

    window.toggleTheme = function () {
        const current = document.documentElement.getAttribute("data-theme") || "dark";
        const next = current === "dark" ? "light" : "dark";
        window.applyTheme(next);
    };

    // Apply theme immediately as soon as script evaluates
    try {
        const initialTheme = localStorage.getItem(THEME_KEY) || "dark";
        window.applyTheme(initialTheme);
    } catch {}

    // Unified Password Visibility Toggle
    window.togglePasswordVisibility = function (inputId, btn) {
        const input = document.getElementById(inputId);
        if (!input) return;
        if (input.type === "password") {
            input.type = "text";
            btn.innerHTML = EYE_OFF_SVG;
            btn.setAttribute("title", "Hide password");
            btn.setAttribute("aria-label", "Hide password");
        } else {
            input.type = "password";
            btn.innerHTML = EYE_OPEN_SVG;
            btn.setAttribute("title", "Show password");
            btn.setAttribute("aria-label", "Show password");
        }
    };

    // Guest Quota Management (2 scans max for guests)
    window.getGuestScanCount = () => {
        try {
            return parseInt(localStorage.getItem(GUEST_SCAN_COUNT_KEY) || "0", 10);
        } catch {
            return 0;
        }
    };

    window.incrementGuestScanCount = () => {
        const current = window.getGuestScanCount() + 1;
        try {
            localStorage.setItem(GUEST_SCAN_COUNT_KEY, current.toString());
        } catch {}
        window.updateGuestQuotaUI();
        return current;
    };

    window.resetGuestScanCount = () => {
        try {
            localStorage.removeItem(GUEST_SCAN_COUNT_KEY);
        } catch {}
        window.updateGuestQuotaUI();
    };

    window.isGuestLimitReached = () => {
        return window.isGuestMode() && window.getGuestScanCount() >= GUEST_SCAN_LIMIT;
    };

    window.showGuestLimitModal = (completedSecond = false) => {
        const modal = document.getElementById("guestLimitModal");
        const subtitle = document.getElementById("guestLimitSubtitle");
        if (subtitle) {
            if (completedSecond) {
                subtitle.innerHTML = "You have used your <strong>2 free guest analyses</strong> (2/2 completed). Sign in or create a free account to continue scanning media without limits.";
            } else {
                subtitle.innerHTML = "You have reached the <strong>2 free analyses limit</strong> for Guest Mode. Please sign in or create an account to run additional scans.";
            }
        }
        if (modal) modal.classList.remove("hidden");
    };

    window.hideGuestLimitModal = () => {
        const modal = document.getElementById("guestLimitModal");
        if (modal) modal.classList.add("hidden");
    };

    window.updateGuestQuotaUI = () => {
        const quotaPill = document.getElementById("guestQuotaPill");
        const quotaDisplay = document.getElementById("guestQuotaDisplay");
        if (!quotaPill) return;

        if (window.isGuestMode()) {
            const count = window.getGuestScanCount();
            quotaPill.classList.remove("hidden");
            if (quotaDisplay) {
                quotaDisplay.textContent = `${count}/${GUEST_SCAN_LIMIT}`;
            }
        } else {
            quotaPill.classList.add("hidden");
        }
    };

    // Form Reset Helper: Clears inputs and ensures forms start completely empty
    function clearAuthForms() {
        const signInForm = document.getElementById("portalSignInForm");
        const signUpForm = document.getElementById("portalSignUpForm");
        if (signInForm) signInForm.reset();
        if (signUpForm) signUpForm.reset();

        const inputIds = [
            "portalSignInUser",
            "portalSignInPass",
            "portalSignUpUser",
            "portalSignUpEmail",
            "portalSignUpPass"
        ];
        inputIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = "";
        });

        const signInErr = document.getElementById("portalSignInError");
        const signUpErr = document.getElementById("portalSignUpError");
        if (signInErr) signInErr.classList.add("hidden");
        if (signUpErr) signUpErr.classList.add("hidden");
    }

    // Inactivity Session Timeout Mechanism
    const INACTIVITY_STORAGE_KEY = "detector_last_activity";
    const DEFAULT_INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 minutes of inactivity
    window.SESSION_TIMEOUT_MS = window.SESSION_TIMEOUT_MS || DEFAULT_INACTIVITY_LIMIT_MS;

    let lastActivityTimestamp = Date.now();

    function recordActivity() {
        const now = Date.now();
        // Throttle writing to localStorage to at most once per 2 seconds
        if (now - lastActivityTimestamp > 2000) {
            lastActivityTimestamp = now;
            try {
                localStorage.setItem(INACTIVITY_STORAGE_KEY, now.toString());
            } catch(e) {}
        }
    }

    // Register active user interaction listeners
    ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"].forEach(evt => {
        window.addEventListener(evt, recordActivity, { passive: true });
    });

    window.resetInactivityClock = function () {
        lastActivityTimestamp = Date.now();
        try {
            localStorage.setItem(INACTIVITY_STORAGE_KEY, lastActivityTimestamp.toString());
        } catch(e) {}
    };

    window.checkSessionTimeout = function () {
        const token = window.getAuthToken ? window.getAuthToken() : null;
        const isGuest = window.isGuestMode ? window.isGuestMode() : false;

        // Only enforce timeout if there is an active user or guest session
        if (!token && !isGuest) return;

        let lastActive = lastActivityTimestamp;
        try {
            const stored = localStorage.getItem(INACTIVITY_STORAGE_KEY);
            if (stored) {
                lastActive = Math.max(lastActive, parseInt(stored, 10) || 0);
            }
        } catch(e) {}

        const elapsed = Date.now() - lastActive;
        const limit = window.SESSION_TIMEOUT_MS || DEFAULT_INACTIVITY_LIMIT_MS;

        if (elapsed >= limit) {
            console.warn(`[Session Inactivity Timeout] User inactive for ${Math.round(elapsed / 1000)}s. Expiring session.`);
            window.clearAuthSession(true);
        }
    };

    // Run timeout check periodically
    setInterval(() => {
        window.checkSessionTimeout();
    }, 10000);

    // Auth Sessions
    window.getAuthToken = () => localStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY_ALT);
    window.isGuestMode = () => sessionStorage.getItem(GUEST_KEY) === "true" || sessionStorage.getItem(GUEST_KEY_ALT) === "true";

    window.getCurrentUser = () => {
        try {
            const raw = localStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY_ALT);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    };

    window.setAuthSession = (token, user) => {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(TOKEN_KEY_ALT, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        localStorage.setItem(USER_KEY_ALT, JSON.stringify(user));
        sessionStorage.removeItem(GUEST_KEY);
        sessionStorage.removeItem(GUEST_KEY_ALT);

        window.resetInactivityClock();
        window.resetGuestScanCount();
        window.hideGuestLimitModal();
        revealDashboard();
        updateNavUserUI();
        window.updateGuestQuotaUI();

        if (window.showToast) {
            window.showToast(`Welcome, ${user.username}!`, "success");
        }
    };

    window.clearAuthSession = (isTimeout = false) => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_KEY_ALT);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(USER_KEY_ALT);
        localStorage.removeItem(INACTIVITY_STORAGE_KEY);
        sessionStorage.removeItem(GUEST_KEY);
        sessionStorage.removeItem(GUEST_KEY_ALT);

        clearAuthForms();
        if (window.clearUploadedFile) {
            window.clearUploadedFile();
        }
        window.showAuthScreen("signin");
        window.updateGuestQuotaUI();

        if (window.showToast) {
            if (isTimeout) {
                window.showToast("Session expired due to inactivity. Please sign in to continue.", "warning");
            } else {
                window.showToast("Signed out. Please sign in to continue.", "info");
            }
        }
    };

    window.continueAsGuest = () => {
        sessionStorage.setItem(GUEST_KEY, "true");
        sessionStorage.setItem(GUEST_KEY_ALT, "true");
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_KEY_ALT);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(USER_KEY_ALT);

        window.resetInactivityClock();
        clearAuthForms();
        if (window.clearUploadedFile) {
            window.clearUploadedFile();
        }
        revealDashboard();
        updateNavUserUI();
        window.updateGuestQuotaUI();

        if (window.showToast) {
            window.showToast("Continuing in Guest Mode (Limit: 2 free analyses)", "info");
        }
        if (window.isGuestLimitReached()) {
            setTimeout(() => window.showGuestLimitModal(false), 500);
        }
    };

    window.showAuthScreen = function (tab = "signin") {
        if (window.clearUploadedFile) {
            window.clearUploadedFile();
        }
        const authScreen = document.getElementById("authScreen");
        const appDashboard = document.getElementById("appDashboard");
        if (authScreen) authScreen.classList.remove("hidden");
        if (appDashboard) appDashboard.classList.add("hidden");
        window.switchAuthTab(tab);
    };

    function revealDashboard() {
        const authScreen = document.getElementById("authScreen");
        const appDashboard = document.getElementById("appDashboard");
        if (authScreen) authScreen.classList.add("hidden");
        if (appDashboard) appDashboard.classList.remove("hidden");
    }

    window.revealDashboard = revealDashboard;

    function updateNavUserUI() {
        const user = window.getCurrentUser();
        const isGuest = window.isGuestMode();
        const navUsername = document.getElementById("navUsername");
        const navAvatar = document.getElementById("navAvatar");
        const navGuestLoginBtn = document.getElementById("navGuestLoginBtn");

        if (user) {
            if (navUsername) navUsername.textContent = user.username;
            if (navAvatar) navAvatar.textContent = user.username.charAt(0).toUpperCase();
            if (navGuestLoginBtn) navGuestLoginBtn.classList.add("hidden");
        } else if (isGuest) {
            if (navUsername) navUsername.textContent = "Guest";
            if (navAvatar) navAvatar.textContent = "G";
            if (navGuestLoginBtn) navGuestLoginBtn.classList.remove("hidden");
        }
    }

    window.updateNavUserUI = updateNavUserUI;

    // Always reset form fields on page load, page show, and before unload
    window.addEventListener("pageshow", clearAuthForms);
    window.addEventListener("beforeunload", clearAuthForms);

    document.addEventListener("DOMContentLoaded", () => {
        // Clear all inputs on reload
        clearAuthForms();

        // Initialize Theme
        const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
        window.applyTheme(savedTheme);

        // Bind theme toggle buttons
        const authThemeToggle = document.getElementById("authThemeToggle");
        const mainThemeToggle = document.getElementById("themeToggle");

        if (authThemeToggle) {
            authThemeToggle.onclick = window.toggleTheme;
        }
        if (mainThemeToggle) {
            mainThemeToggle.onclick = window.toggleTheme;
        }

        // Initialize password toggle button icons
        document.querySelectorAll(".pwd-toggle-btn").forEach(btn => {
            btn.innerHTML = EYE_OPEN_SVG;
            btn.setAttribute("title", "Show password");
            btn.setAttribute("aria-label", "Show password");
        });

        // 1. Parse URL routing, query parameters, and hashes
        const path = window.location.pathname.toLowerCase();
        const hash = window.location.hash.toLowerCase();
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get("tab") || "";

        const wantsSignUp = (
            path.includes("signup") ||
            path.includes("register") ||
            hash.includes("signup") ||
            hash.includes("register") ||
            tabParam === "signup" ||
            tabParam === "register"
        );

        const wantsLogin = (
            path.includes("login") ||
            path.includes("signin") ||
            hash.includes("login") ||
            hash.includes("signin") ||
            tabParam === "login" ||
            tabParam === "signin"
        );

        const explicitAuthTarget = wantsSignUp ? "signup" : (wantsLogin ? "signin" : null);

        // Session check: If user navigated explicitly to /login or /signup, show auth screen
        const token = window.getAuthToken();
        const isGuest = window.isGuestMode();

        // Check if existing session has expired due to inactivity
        if (token || isGuest) {
            let lastActive = 0;
            try {
                const stored = localStorage.getItem(INACTIVITY_STORAGE_KEY);
                if (stored) lastActive = parseInt(stored, 10) || 0;
            } catch(e) {}
            const limit = window.SESSION_TIMEOUT_MS || DEFAULT_INACTIVITY_LIMIT_MS;
            if (lastActive && (Date.now() - lastActive >= limit)) {
                console.warn("[Session Inactivity Timeout] Stored session expired during idle period.");
                window.clearAuthSession(true);
                return;
            }
        }

        if (explicitAuthTarget) {
            window.showAuthScreen(explicitAuthTarget);
        } else if (token) {
            fetch("/api/auth/me", {
                headers: { "Authorization": `Bearer ${token}` }
            })
            .then(res => {
                if (res.ok) {
                    revealDashboard();
                    updateNavUserUI();
                    window.updateGuestQuotaUI();
                } else {
                    window.clearAuthSession();
                }
            })
            .catch(() => {
                revealDashboard();
                updateNavUserUI();
                window.updateGuestQuotaUI();
            });
        } else if (isGuest) {
            revealDashboard();
            updateNavUserUI();
            window.updateGuestQuotaUI();
            if (window.isGuestLimitReached()) {
                setTimeout(() => window.showGuestLimitModal(false), 600);
            }
        } else {
            window.showAuthScreen("signin");
        }

        // Tab Switching & Nav Button Listeners
        const authTabSignIn = document.getElementById("authTabSignIn");
        const authTabSignUp = document.getElementById("authTabSignUp");
        const navLoginBtn = document.getElementById("navLoginBtn");
        const navSignUpBtn = document.getElementById("navSignUpBtn");

        if (authTabSignIn) {
            authTabSignIn.addEventListener("click", (e) => {
                e.preventDefault();
                window.switchAuthTab("signin");
            });
        }

        if (authTabSignUp) {
            authTabSignUp.addEventListener("click", (e) => {
                e.preventDefault();
                window.switchAuthTab("signup");
            });
        }

        if (navLoginBtn) {
            navLoginBtn.addEventListener("click", (e) => {
                e.preventDefault();
                window.switchAuthTab("signin");
            });
        }

        if (navSignUpBtn) {
            navSignUpBtn.addEventListener("click", (e) => {
                e.preventDefault();
                window.switchAuthTab("signup");
            });
        }

        // Unified Form Submit Handlers (Prevents duplicate event listener firing)
        const portalSignInForm = document.getElementById("portalSignInForm");
        if (portalSignInForm) {
            portalSignInForm.onsubmit = (e) => {
                if (window.handleSignIn) {
                    return window.handleSignIn(e);
                }
            };
        }

        const portalSignUpForm = document.getElementById("portalSignUpForm");
        if (portalSignUpForm) {
            portalSignUpForm.onsubmit = (e) => {
                if (window.handleSignUp) {
                    return window.handleSignUp(e);
                }
            };
        }

        // Continue as Guest Button
        const portalGuestBtn = document.getElementById("portalGuestBtn");
        if (portalGuestBtn) {
            portalGuestBtn.addEventListener("click", () => {
                window.continueAsGuest();
            });
        }

        // Dashboard Sign Out Button
        const dashboardSignOutBtn = document.getElementById("dashboardSignOutBtn");
        if (dashboardSignOutBtn) {
            dashboardSignOutBtn.addEventListener("click", () => {
                window.clearAuthSession();
            });
        }

        // Dashboard Guest Login Button
        const navGuestLoginBtn = document.getElementById("navGuestLoginBtn");
        if (navGuestLoginBtn) {
            navGuestLoginBtn.addEventListener("click", () => {
                window.clearAuthSession();
                window.showAuthScreen("signin");
            });
        }

        // History prompt sign in button
        const historySignInBtn = document.getElementById("historySignInBtn");
        if (historySignInBtn) {
            historySignInBtn.addEventListener("click", () => {
                window.showAuthScreen("signin");
            });
        }

        // Guest Limit Modal Buttons
        const limitModalSignInBtn = document.getElementById("limitModalSignInBtn");
        const limitModalSignUpBtn = document.getElementById("limitModalSignUpBtn");
        const closeGuestLimitModalBtn = document.getElementById("closeGuestLimitModalBtn");

        if (limitModalSignInBtn) {
            limitModalSignInBtn.addEventListener("click", () => {
                window.hideGuestLimitModal();
                window.showAuthScreen("signin");
            });
        }

        if (limitModalSignUpBtn) {
            limitModalSignUpBtn.addEventListener("click", () => {
                window.hideGuestLimitModal();
                window.showAuthScreen("signup");
            });
        }

        if (closeGuestLimitModalBtn) {
            closeGuestLimitModalBtn.addEventListener("click", () => {
                window.hideGuestLimitModal();
            });
        }
    });
})();
