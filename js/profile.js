import { auth, db } from "./firebase.js";
import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const BUILDER_STATE_KEY = "advanced-builder-state";

const profileName = document.getElementById("profile-name");
const profileEmail = document.getElementById("profile-email");
const logoutBtn = document.getElementById("logout-btn");
const projectsStatus = document.getElementById("projects-status");
const projectsList = document.getElementById("projects-list");

let currentProjects = [];

showWelcomeMessage();
initProfilePage();

function initProfilePage() {
    logoutBtn?.addEventListener("click", handleLogout);
    projectsList?.addEventListener("click", handleProjectClick);

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = "login.html?redirect=profile.html";
            return;
        }

        renderUserInfo(user);
        await loadProjects(user.uid);
    });
}

function renderUserInfo(user) {
    if (profileName) {
        profileName.textContent = user.displayName || "No display name";
    }

    if (profileEmail) {
        profileEmail.textContent = user.email || "No email";
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
        window.location.href = "login.html";
    } catch (error) {
        console.error("Logout error:", error);
        showStatus("Could not log out. Please try again.", true);
    }
}

async function loadProjects(uid) {
    showStatus("Loading projects...");

    try {
        const projectsQuery = query(
            collection(db, "projects"),
            where("uid", "==", uid)
        );
        const snapshot = await getDocs(projectsQuery);

        currentProjects = snapshot.docs
            .map((projectDoc) => ({
                id: projectDoc.id,
                ...projectDoc.data()
            }))
            .sort((a, b) => getProjectTime(b) - getProjectTime(a));

        renderProjects(currentProjects);
    } catch (error) {
        console.error("Project load error:", error);
        showStatus("Could not load projects. Please try again.", true);
    }
}

function renderProjects(projects) {
    if (!projectsList || !projectsStatus) return;

    projectsList.innerHTML = "";

    if (!projects.length) {
        showStatus("No projects yet");
        return;
    }

    projectsStatus.classList.add("hidden");
    projects.forEach((project) => {
        projectsList.insertAdjacentHTML("beforeend", buildProjectCard(project));
    });
}

function buildProjectCard(project) {
    const projectState = project.projectState || project.settings || {};
    const title = escapeHtml(projectState.siteName || projectState.companyName || "Untitled Project");
    const description = escapeHtml(projectState.siteDesc || "No description saved.");
    const createdDate = escapeHtml(formatDate(project.createdAt));

    return `
        <article class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                    <h3 class="text-lg font-semibold text-slate-900 truncate">${title}</h3>
                    <p class="mt-1 text-sm text-slate-500">${createdDate}</p>
                </div>
                <span class="shrink-0 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1">
                    ${escapeHtml(projectState.selectedType || "custom")}
                </span>
            </div>
            <p class="mt-4 text-sm text-slate-600 line-clamp-2">${description}</p>
            <div class="mt-5 flex justify-end">
                <button type="button" data-open-project="${escapeHtml(project.id)}" class="inline-flex items-center justify-center gap-2 px-4 py-2 border-2 border-indigo-600 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-50 transition-colors">
                    Open
                </button>
            </div>
        </article>
    `;
}

function handleProjectClick(event) {
    const openButton = event.target.closest("[data-open-project]");
    if (!openButton) return;

    const project = currentProjects.find((item) => item.id === openButton.dataset.openProject);
    if (!project?.projectState && !project?.settings) return;

    localStorage.setItem(BUILDER_STATE_KEY, JSON.stringify(project.projectState || project.settings));
    window.location.href = "builder.html";
}

function showStatus(message, isError = false) {
    if (!projectsStatus) return;
    projectsStatus.textContent = message;
    projectsStatus.className = isError
        ? "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        : "rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600";
}

function getProjectTime(project) {
    const value = project.createdAt;
    if (!value) return 0;
    if (typeof value.toMillis === "function") return value.toMillis();
    if (typeof value.toDate === "function") return value.toDate().getTime();
    if (value instanceof Date) return value.getTime();
    return new Date(value).getTime() || 0;
}

function formatDate(value) {
    if (!value) return "No date";

    const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
    if (Number.isNaN(date.getTime())) return "No date";

    return new Intl.DateTimeFormat("en", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showWelcomeMessage() {

    const messageBox = document.getElementById("welcome-message");

    if (!messageBox) return;

    const params = new URLSearchParams(window.location.search);
    const welcome = params.get("welcome");

    if (welcome === "login") {
        messageBox.textContent = "환영합니다! 로그인되었습니다.";
        messageBox.classList.remove("hidden");

    } else if (welcome === "register") {
        messageBox.textContent = "회원가입이 완료되었습니다. 환영합니다!";
        messageBox.classList.remove("hidden");
    }
}
