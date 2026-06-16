import { auth, db } from "./firebase.js";
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
    doc,
    serverTimestamp,
    setDoc
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const statusMessage = document.getElementById("auth-status");

let didSubmitAuthForm = false;

initAuthForms();
initLoginRedirect();

function initAuthForms() {
    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }

    if (registerForm) {
        registerForm.addEventListener("submit", handleRegister);
    }
}

function initLoginRedirect() {
    onAuthStateChanged(auth, (user) => {
        if (!user || didSubmitAuthForm) return;
        window.location.href = "profile.html";
    });
}

async function handleLogin(event) {
    event.preventDefault();
    clearStatus();

    const email = getInputValue("email");
    const password = getInputValue("password");

    try {
        didSubmitAuthForm = true;
        await signInWithEmailAndPassword(auth, email, password);
        showStatus("Login successful. Redirecting...", false);

        setTimeout(() => {
          window.location.href = "profile.html?welcome=login";
        }, 1000);

    } catch (error) {
        didSubmitAuthForm = false;
        handleAuthError(error);
    }
}

async function handleRegister(event) {
    event.preventDefault();
    clearStatus();

    const displayName = getInputValue("name");
    const email = getInputValue("register-email");
    const password = getInputValue("register-password");

    try {
        didSubmitAuthForm = true;
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(user, { displayName });

        await setDoc(doc(db, "users", user.uid), {
            displayName,
            email,
            createdAt: serverTimestamp()
        });

        showStatus("Account created. Redirecting...", false);
        
        setTimeout(() => {
          window.location.href = "profile.html?welcome=register";
        }, 1000);
        
    } catch (error) {
        didSubmitAuthForm = false;
        handleAuthError(error);
    }
}

function getInputValue(id) {
    return document.getElementById(id)?.value.trim() || "";
}

function clearStatus() {
    if (!statusMessage) return;
    statusMessage.textContent = "";
    statusMessage.classList.add("hidden");
}

function showStatus(message, isError = true) {
    if (!statusMessage) return;
    statusMessage.textContent = message;
    statusMessage.classList.remove("hidden");

    statusMessage.className = isError
        ? "mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        : "mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700";
}

function handleAuthError(error) {
    console.error("Authentication error:", error);
    showStatus(readableAuthError(error));
}

function readableAuthError(error) {
    const messages = {
        "auth/email-already-in-use": "This email is already registered.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/invalid-credential": "Email or password is incorrect.",
        "auth/missing-password": "Please enter your password.",
        "auth/weak-password": "Password must be at least 6 characters.",
        "auth/network-request-failed": "Network error. Please try again."
    };

    return messages[error?.code] || error?.message || "Authentication failed. Please try again.";
}
