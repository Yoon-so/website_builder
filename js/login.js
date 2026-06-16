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
        showStatus("로그인 성공. 이동 중....", false);

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

        showStatus("계정 생성 완료. 이동 중...", false);
        
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
        "auth/email-already-in-use": "이미 등록된 이메일입니다.",
        "auth/invalid-email": "유효한 이메일 주소를 입력해 주세요.",
        "auth/invalid-credential": "이메일 또는 비밀번호가 올바르지 않습니다.",
        "auth/missing-password": "비밀번호를 입력해 주세요.",
        "auth/weak-password": "비밀번호는 최소 6자 이상이어야 합니다.",
        "auth/network-request-failed": "네트워크 오류가 발생했습니다. 다시 시도해 주세요."
    };

    return messages[error?.code] || error?.message || "인증에 실패했습니다. 다시 시도해 주세요.";
}
