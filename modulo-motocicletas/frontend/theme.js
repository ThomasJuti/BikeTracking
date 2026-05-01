// Aplica el tema guardado antes del primer render para evitar parpadeo
(function () {
  const saved = localStorage.getItem("bt_theme") || "dark";
  const bsTheme = saved === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-bs-theme", bsTheme);
  document.documentElement.setAttribute("data-bt-theme", saved);
})();

function _updateDots() {
  const current = document.documentElement.getAttribute("data-bt-theme") || "dark";
  document.querySelectorAll(".theme-dot").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.theme === current);
  });
}

function setTheme(name) {
  const bsTheme = name === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-bs-theme", bsTheme);
  document.documentElement.setAttribute("data-bt-theme", name);
  localStorage.setItem("bt_theme", name);
  _updateDots();
}

document.addEventListener("DOMContentLoaded", () => {
  _updateDots();
  document.querySelectorAll(".theme-dot").forEach((btn) => {
    btn.addEventListener("click", () => setTheme(btn.dataset.theme));
  });
});
