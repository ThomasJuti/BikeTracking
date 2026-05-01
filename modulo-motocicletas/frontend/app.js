// ─── Auth guard ────────────────────────────────────────────────────────────
const _token = sessionStorage.getItem("bt_token");
if (!_token) window.location.replace("/login.html");

const API_BASE = "/api/motos";

const state = {
  motos: []
};

const ui = {
  stats: document.getElementById("stats"),
  profile: document.getElementById("vehicleProfile"),
  alerta: document.getElementById("alerta"),
  btnNueva: document.getElementById("btnNueva"),
  form: document.getElementById("formMoto"),
  modalTitulo: document.getElementById("modalTitulo"),
  fields: {
    id: document.getElementById("motoId"),
    placa: document.getElementById("placa"),
    marca: document.getElementById("marca"),
    modelo: document.getElementById("modelo"),
    anio: document.getElementById("anio"),
    cilindraje: document.getElementById("cilindraje"),
    estado: document.getElementById("estado"),
    propietario: document.getElementById("propietario")
  }
};

const modal = new bootstrap.Modal(document.getElementById("motoModal"));

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function notify(type, text) {
  ui.alerta.className = `alert alert-${type}`;
  ui.alerta.textContent = text;
  ui.alerta.classList.remove("d-none");

  setTimeout(() => {
    ui.alerta.classList.add("d-none");
  }, 2800);
}

function stateBadge(estado) {
  const map = {
    activa: "success",
    mantenimiento: "warning",
    inactiva: "secondary"
  };

  const badge = map[estado] || "dark";
  return `<span class="badge text-bg-${badge} badge-state">${escapeHtml(estado)}</span>`;
}

function buildStats() {
  const moto = state.motos[0];
  const estadoTone = moto?.estado === "mantenimiento" ? "warning" : "success";
  const estadoTexto = moto ? moto.estado : "pendiente";

  const cards = [
    { title: "Mi placa", value: moto?.placa || "Sin registro", tone: "primary" },
    { title: "Estado actual", value: estadoTexto, tone: estadoTone },
    {
      title: "Marca y modelo",
      value: moto ? `${moto.marca} ${moto.modelo}` : "Completa tu ficha",
      tone: "info"
    }
  ];

  ui.stats.innerHTML = cards
    .map(
      (card) => `
      <div class="col-12 col-md-4">
        <article class="card h-100">
          <div class="card-body">
            <p class="text-muted mb-1">${card.title}</p>
            <p class="display-6 fw-bold text-${card.tone} mb-0">${card.value}</p>
          </div>
        </article>
      </div>
    `
    )
    .join("");
}

function syncPersonalMode() {
  const hasMoto = state.motos.length > 0;

  ui.btnNueva.innerHTML = hasMoto
    ? '<i class="bi bi-pencil-square"></i> Editar mi moto'
    : '<i class="bi bi-plus-lg"></i> Registrar mi moto';
}

function renderProfile() {
  const moto = state.motos[0];

  if (!moto) {
    ui.profile.innerHTML = `
      <article class="empty-profile rounded-4 p-4 p-md-5 text-center">
        <div class="empty-profile-icon mx-auto mb-3">
          <i class="bi bi-bicycle fs-2"></i>
        </div>
        <h2 class="fs-4 fw-bold mb-2">Todavia no has registrado tu moto</h2>
        <p class="text-muted mb-4">
          Crea la ficha de tu vehiculo personal para llevar control de su estado y mantenimiento.
        </p>
        <button class="btn btn-primary" type="button" id="btnCrearPerfil">
          <i class="bi bi-plus-lg"></i>
          Registrar mi moto
        </button>
      </article>
    `;

    document.getElementById("btnCrearPerfil").addEventListener("click", () => {
      resetForm();
      ui.modalTitulo.textContent = "Registrar mi motocicleta";
      modal.show();
    });
    return;
  }

  ui.profile.innerHTML = `
    <article class="vehicle-profile-card rounded-4 p-4 p-md-5">
      <div class="d-flex flex-column flex-lg-row justify-content-between gap-4">
        <div>
          <p class="text-uppercase tracking fw-semibold mb-2">Mi vehiculo</p>
          <h2 class="fs-3 fw-bold mb-1">${escapeHtml(moto.marca)} ${escapeHtml(moto.modelo)}</h2>
          <p class="text-muted mb-0">Placa ${escapeHtml(moto.placa)} · ${escapeHtml(moto.cilindraje)}</p>
        </div>
        <div class="d-flex flex-wrap gap-2 align-items-start">
          ${stateBadge(moto.estado)}
          <button class="btn btn-outline-primary" type="button" onclick="editMoto('${moto.id}')">
            <i class="bi bi-pencil-square"></i>
            Editar datos
          </button>
          <button class="btn btn-outline-danger" type="button" onclick="deleteMoto('${moto.id}')">
            <i class="bi bi-trash3"></i>
            Eliminar
          </button>
        </div>
      </div>

      <div class="row g-3 mt-1">
        <div class="col-12 col-md-6 col-xl-3">
          <div class="profile-detail h-100">
            <p class="profile-label mb-1">Propietario</p>
            <p class="profile-value mb-0">${escapeHtml(moto.propietario)}</p>
          </div>
        </div>
        <div class="col-12 col-md-6 col-xl-3">
          <div class="profile-detail h-100">
            <p class="profile-label mb-1">Anio</p>
            <p class="profile-value mb-0">${escapeHtml(moto.anio)}</p>
          </div>
        </div>
        <div class="col-12 col-md-6 col-xl-3">
          <div class="profile-detail h-100">
            <p class="profile-label mb-1">Estado</p>
            <p class="profile-value mb-0 text-capitalize">${escapeHtml(moto.estado)}</p>
          </div>
        </div>
        <div class="col-12 col-md-6 col-xl-3">
          <div class="profile-detail h-100">
            <p class="profile-label mb-1">Cilindraje</p>
            <p class="profile-value mb-0">${escapeHtml(moto.cilindraje)}</p>
          </div>
        </div>
      </div>
    </article>
  `;
}

function render() {
  buildStats();
  syncPersonalMode();
  renderProfile();
}

async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${sessionStorage.getItem("bt_token")}`
    },
    ...options
  });

  if (!response.ok) {
    if (response.status === 401) {
      sessionStorage.clear();
      window.location.replace("/login.html");
      return;
    }
    let message = "Ocurrio un error en la solicitud.";
    try {
      const data = await response.json();
      message = data?.errors?.join(" ") || data?.message || message;
    } catch {
      // No se pudo parsear el error.
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function loadMotos() {
  const data = await request(API_BASE);
  state.motos = data;
  render();
}

function resetForm() {
  ui.form.reset();
  ui.fields.id.value = "";
  ui.fields.estado.value = "activa";
}

function fillForm(moto) {
  ui.fields.id.value = moto.id;
  ui.fields.placa.value = moto.placa;
  ui.fields.marca.value = moto.marca;
  ui.fields.modelo.value = moto.modelo;
  ui.fields.anio.value = moto.anio;
  ui.fields.cilindraje.value = moto.cilindraje;
  ui.fields.estado.value = moto.estado;
  ui.fields.propietario.value = moto.propietario;
}

window.editMoto = function (id) {
  const moto = state.motos.find((m) => m.id === id);
  if (!moto) return;
  ui.modalTitulo.textContent = "Editar mi motocicleta";
  fillForm(moto);
  modal.show();
};

window.deleteMoto = async function (id) {
  const ok = window.confirm("Esta accion eliminara la ficha de tu moto. Deseas continuar?");
  if (!ok) return;

  try {
    await request(`${API_BASE}/${id}`, { method: "DELETE" });
    await loadMotos();
    notify("success", "La ficha de tu moto fue eliminada.");
  } catch (error) {
    notify("danger", error.message);
  }
};

ui.btnNueva.addEventListener("click", () => {
  if (state.motos.length) {
    fillForm(state.motos[0]);
    ui.modalTitulo.textContent = "Editar mi motocicleta";
  } else {
    resetForm();
    ui.modalTitulo.textContent = "Registrar mi motocicleta";
  }
  modal.show();
});

ui.form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    placa: ui.fields.placa.value.trim().toUpperCase(),
    marca: ui.fields.marca.value.trim(),
    modelo: ui.fields.modelo.value.trim(),
    anio: Number(ui.fields.anio.value),
    cilindraje: ui.fields.cilindraje.value.trim(),
    estado: ui.fields.estado.value,
    propietario: ui.fields.propietario.value.trim()
  };

  try {
    const targetId = ui.fields.id.value || state.motos[0]?.id;

    if (targetId) {
      await request(`${API_BASE}/${targetId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      notify("success", "Datos de tu moto actualizados.");
    } else {
      await request(API_BASE, {
        method: "POST",
        body: JSON.stringify(payload)
      });
      notify("success", "Tu moto fue registrada.");
    }

    modal.hide();
    await loadMotos();
  } catch (error) {
    notify("danger", error.message);
  }
});

(async function init() {
  try {
    await loadMotos();
  } catch (error) {
    notify("danger", error.message);
  }
})();

// ─── Logout ────────────────────────────────────────────────────────────────
document.getElementById("btnLogout").addEventListener("click", async () => {
  const token = sessionStorage.getItem("bt_token");
  if (token) {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    }).catch(() => {});
  }
  sessionStorage.clear();
  window.location.replace("/login.html");
});
