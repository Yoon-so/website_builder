const navLinks = document.querySelectorAll("[data-nav-link]");
const navActiveClasses = ["text-indigo-500", "hover:text-indigo-700"];
const navInactiveClasses = ["text-slate-600", "hover:text-slate-800"];

const currentPage = window.location.pathname.split("/").pop() || "index.html";

navLinks.forEach((link) => {
    const isActive = link.dataset.navLink === currentPage;

    link.classList.remove(...navActiveClasses, ...navInactiveClasses);
    link.classList.add(...(isActive ? navActiveClasses : navInactiveClasses));
});
