// Si ya hay sesion activa, ir directo al home
if (sessionStorage.getItem("bt_token")) {
  window.location.replace("/home.html");
}

const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const formLogin = document.getElementById("formLogin");
const formRegister = document.getElementById("formRegister");
const alerta = document.getElementById("alerta");

// ─── Tabs ──────────────────────────────────────────────────────────────────

tabLogin.addEventListener("click", () => {
  tabLogin.classList.add("active");
  tabRegister.classList.remove("active");
  formLogin.classList.remove("d-none");
  formRegister.classList.add("d-none");
  alerta.classList.add("d-none");
  clearValidation(formLogin);
});

tabRegister.addEventListener("click", () => {
  tabRegister.classList.add("active");
  tabLogin.classList.remove("active");
  formRegister.classList.remove("d-none");
  formLogin.classList.add("d-none");
  alerta.classList.add("d-none");
  clearValidation(formRegister);
});

// ─── Helpers ───────────────────────────────────────────────────────────────

function notify(type, text) {
  alerta.className = `alert alert-${type}`;
  alerta.textContent = text;
  alerta.classList.remove("d-none");
}

function clearValidation(form) {
  form.querySelectorAll(".is-invalid, .is-valid").forEach((el) => {
    el.classList.remove("is-invalid", "is-valid");
  });
}

function setInvalid(el, msg) {
  el.classList.add("is-invalid");
  el.classList.remove("is-valid");
  const fb = el.closest(".input-group")?.nextElementSibling
    ?? el.nextElementSibling;
  if (fb && fb.classList.contains("invalid-feedback") && msg) {
    fb.textContent = msg;
  }
}

function setValid(el) {
  el.classList.remove("is-invalid");
  el.classList.add("is-valid");
}

function setBusy(btn, busy) {
  btn.disabled = busy;
  if (busy) {
    btn.dataset.original = btn.innerHTML;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Espera...';
  } else {
    btn.innerHTML = btn.dataset.original;
  }
}

// ─── Login ─────────────────────────────────────────────────────────────────

formLogin.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearValidation(formLogin);
  alerta.classList.add("d-none");

  const usernameEl = document.getElementById("loginUsername");
  const passwordEl = document.getElementById("loginPassword");

  let valid = true;
  if (!usernameEl.value.trim()) { setInvalid(usernameEl); valid = false; } else setValid(usernameEl);
  if (!passwordEl.value) { setInvalid(passwordEl); valid = false; } else setValid(passwordEl);
  if (!valid) return;

  const btn = document.getElementById("btnLogin");
  setBusy(btn, true);

  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: usernameEl.value.trim(),
        password: passwordEl.value
      })
    });

    const data = await res.json();

    if (!res.ok) {
      notify("danger", data.message || "Error al iniciar sesion.");
      setBusy(btn, false);
      return;
    }

    sessionStorage.setItem("bt_token", data.token);
    sessionStorage.setItem("bt_username", data.username);
    window.location.replace("/home.html");
  } catch {
    notify("danger", "No se pudo conectar con el servidor.");
    setBusy(btn, false);
  }
});

// ─── Registro ──────────────────────────────────────────────────────────────

formRegister.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearValidation(formRegister);
  alerta.classList.add("d-none");

  const usernameEl = document.getElementById("regUsername");
  const passwordEl = document.getElementById("regPassword");
  const confirmEl = document.getElementById("regPasswordConfirm");

  let valid = true;

  if (!usernameEl.value.trim() || usernameEl.value.trim().length < 3) {
    setInvalid(usernameEl, "El usuario debe tener al menos 3 caracteres.");
    valid = false;
  } else {
    setValid(usernameEl);
  }

  if (!passwordEl.value || passwordEl.value.length < 6) {
    setInvalid(passwordEl, "La contrasena debe tener al menos 6 caracteres.");
    valid = false;
  } else {
    setValid(passwordEl);
  }

  if (!confirmEl.value || confirmEl.value !== passwordEl.value) {
    setInvalid(confirmEl, "Las contrasenas no coinciden.");
    valid = false;
  } else if (passwordEl.value.length >= 6) {
    setValid(confirmEl);
  }

  if (!valid) return;

  const btn = document.getElementById("btnRegister");
  setBusy(btn, true);

  try {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: usernameEl.value.trim(),
        password: passwordEl.value
      })
    });

    const data = await res.json();

    if (!res.ok) {
      notify("danger", data.message || "Error al registrar el usuario.");
      setBusy(btn, false);
      return;
    }

    // Registro exitoso: mostrar mensaje y cambiar al tab de login
    notify("success", "Cuenta creada. Ahora inicia sesion.");
    setBusy(btn, false);
    formRegister.reset();
    clearValidation(formRegister);
    tabLogin.click();
    document.getElementById("loginUsername").value = usernameEl.value.trim();
  } catch {
    notify("danger", "No se pudo conectar con el servidor.");
    setBusy(btn, false);
  }
});
