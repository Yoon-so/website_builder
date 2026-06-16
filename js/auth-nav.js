import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

initAuthNavbar();

export function initAuthNavbar() {
    const desktopLink = document.getElementById('desktop-auth-link');
    const desktopLabel = document.getElementById('desktop-auth-label');

    const mobileLink = document.getElementById("mobile-auth-link");
    const mobileLabel = document.getElementById("mobile-auth-label");

    if (!desktopLink || !desktopLabel || !mobileLink || !mobileLabel) return;

    onAuthStateChanged(auth, (user) => {
        if (!user) {
            desktopLink.href = 'login.html';
            desktopLabel.textContent = '로그인';

            mobileLink.href = 'login.html';
            mobileLabel.textContent = '로그인';
            return;
        }

        const label = user.displayName || user.email?.split('@')[0] || '프로필';

        desktopLink.href = 'profile.html';
        desktopLabel.textContent = label;

        mobileLink.href = 'profile.html';
        mobileLabel.textContent = '내 프로필';
    });
}