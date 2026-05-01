// Guard de autenticacion
const _token = sessionStorage.getItem("bt_token");
if (!_token) window.location.replace("/login.html");

const API_BASE = "/api/motos";

const state = {
  motos: [],
  draftFoto: "",
  draftFotoPreset: ""
};

const MOTO_IMAGE_PRESETS = [
  { id: "yamaha-fz25", brand: "Yamaha", model: "FZ25", accent: "#3b9eff", detail: "Naked 250" },
  { id: "bajaj-ns200", brand: "Bajaj", model: "Pulsar NS200", accent: "#ff8a00", detail: "Street 200" },
  { id: "akt-nkd125", brand: "AKT", model: "NKD 125", accent: "#00c4b0", detail: "Urbana 125" },
  { id: "honda-cb125f", brand: "Honda", model: "CB125F", accent: "#e74c3c", detail: "City 125" },
  { id: "suzuki-gixxer150", brand: "Suzuki", model: "Gixxer 150", accent: "#f5c542", detail: "Street 150" },
  { id: "tvs-apache200", brand: "TVS", model: "Apache RTR 200", accent: "#9b59b6", detail: "Sport 200" }
];

const ui = {
  stats: document.getElementById("stats"),
  profile: document.getElementById("vehicleProfile"),
  alerta: document.getElementById("alerta"),
  btnNueva: document.getElementById("btnNueva"),
  form: document.getElementById("formMoto"),
  modalTitulo: document.getElementById("modalTitulo"),
  fotoInput: document.getElementById("fotoMoto"),
  fotoPreview: document.getElementById("fotoPreview"),
  fotoEmpty: document.getElementById("fotoEmpty"),
  presetGallery: document.getElementById("presetGallery"),
  btnClearPhoto: document.getElementById("btnClearPhoto"),
  fields: {
    id: document.getElementById("motoId"),
    placa: document.getElementById("placa"),
    marca: document.getElementById("marca"),
    modelo: document.getElementById("modelo"),
    anio: document.getElementById("anio"),
    cilindraje: document.getElementById("cilindraje"),
    estado: document.getElementById("estado"),
    relieve: document.getElementById("relieve"),
    propietario: document.getElementById("propietario")
  }
};

const modal = new bootstrap.Modal(document.getElementById("motoModal"));
const COLOMBIA_MOTO_PLATE_REGEX = /^[A-Z]{3}\d{2}[A-Z]$/;

function createPresetImageSrc(preset) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" role="img" aria-label="${preset.brand} ${preset.model}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0f1726" />
          <stop offset="100%" stop-color="#1b314d" />
        </linearGradient>
      </defs>
      <rect width="640" height="360" rx="28" fill="url(#bg)" />
      <circle cx="165" cy="255" r="56" fill="#0c1320" stroke="#dce8f5" stroke-width="10" />
      <circle cx="458" cy="255" r="56" fill="#0c1320" stroke="#dce8f5" stroke-width="10" />
      <path d="M170 245 L255 185 L350 185 L412 225 L468 225" fill="none" stroke="${preset.accent}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M254 185 L298 142 L354 142" fill="none" stroke="#ffffff" stroke-width="12" stroke-linecap="round" />
      <path d="M305 142 L360 176" fill="none" stroke="#9dc6ff" stroke-width="12" stroke-linecap="round" />
      <path d="M220 205 L185 160" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round" />
      <path d="M389 212 L424 163" fill="none" stroke="#ffffff" stroke-width="10" stroke-linecap="round" />
      <rect x="62" y="42" width="230" height="42" rx="21" fill="${preset.accent}" opacity="0.18" />
      <text x="80" y="70" font-size="28" font-family="Sora, Arial, sans-serif" fill="#dce8f5">${preset.brand}</text>
      <text x="80" y="114" font-size="42" font-weight="700" font-family="Sora, Arial, sans-serif" fill="#ffffff">${preset.model}</text>
      <text x="80" y="152" font-size="20" font-family="Sora, Arial, sans-serif" fill="#9dc6ff">${preset.detail}</text>
      <text x="440" y="70" font-size="16" font-family="Sora, Arial, sans-serif" fill="#c9d6e5">Referencia visual</text>
      <text x="440" y="96" font-size="16" font-family="Sora, Arial, sans-serif" fill="#c9d6e5">Modelos populares en Colombia</text>
    </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getPresetById(id) {
  return MOTO_IMAGE_PRESETS.find((preset) => preset.id === id) || null;
}

function inferPresetId(moto) {
  if (!moto) return "";
  const brand = String(moto.marca || "").toLowerCase();
  const model = String(moto.modelo || "").toLowerCase();
  return MOTO_IMAGE_PRESETS.find((preset) => {
    return brand.includes(preset.brand.toLowerCase()) && model.includes(preset.model.toLowerCase().replace(/\s+/g, " "));
  })?.id || "";
}

function getMotoImage(moto) {
  if (moto?.foto) return moto.foto;
  const preset = getPresetById(moto?.fotoPreset) || getPresetById(inferPresetId(moto)) || MOTO_IMAGE_PRESETS[0];
  return createPresetImageSrc(preset);
}

function renderPresetGallery() {
  ui.presetGallery.innerHTML = MOTO_IMAGE_PRESETS.map((preset) => `
    <button class="preset-card ${state.draftFotoPreset === preset.id ? "active" : ""}" type="button" data-preset-id="${preset.id}">
      <img src="${createPresetImageSrc(preset)}" alt="${preset.brand} ${preset.model}" class="preset-card-image" />
      <span class="preset-card-title">${preset.brand} ${preset.model}</span>
      <span class="preset-card-meta">${preset.detail}</span>
    </button>
  `).join("");

  ui.presetGallery.querySelectorAll("[data-preset-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.draftFotoPreset = button.dataset.presetId || "";
      state.draftFoto = "";
      ui.fotoInput.value = "";
      const preset = getPresetById(state.draftFotoPreset);
      if (preset) {
        if (!ui.fields.marca.value.trim()) ui.fields.marca.value = preset.brand;
        if (!ui.fields.modelo.value.trim()) ui.fields.modelo.value = preset.model;
      }
      updatePhotoPreview();
      renderPresetGallery();
    });
  });
}

function updatePhotoPreview() {
  const src = state.draftFoto || (state.draftFotoPreset ? createPresetImageSrc(getPresetById(state.draftFotoPreset)) : "");
  if (src) {
    ui.fotoPreview.src = src;
    ui.fotoPreview.classList.remove("d-none");
    ui.fotoEmpty.classList.add("d-none");
  } else {
    ui.fotoPreview.removeAttribute("src");
    ui.fotoPreview.classList.add("d-none");
    ui.fotoEmpty.classList.remove("d-none");
  }
}

function resetPhotoState() {
  state.draftFoto = "";
  state.draftFotoPreset = "";
  ui.fotoInput.value = "";
  updatePhotoPreview();
  renderPresetGallery();
}

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
        <div class="d-flex flex-column flex-md-row gap-3 align-items-start flex-grow-1">
          <img src="${getMotoImage(moto)}" alt="${escapeHtml(moto.marca)} ${escapeHtml(moto.modelo)}" class="vehicle-photo" />
          <div>
            <p class="text-uppercase tracking fw-semibold mb-2">Mi vehiculo</p>
            <h2 class="fs-3 fw-bold mb-1">${escapeHtml(moto.marca)} ${escapeHtml(moto.modelo)}</h2>
            <p class="text-muted mb-2">Placa ${escapeHtml(moto.placa)} · ${escapeHtml(moto.cilindraje)}</p>
            <p class="small text-muted mb-0">${moto.foto ? "Foto propia cargada" : "Referencia visual del modelo"}</p>
          </div>
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
        <div class="col-12 col-md-6 col-xl-3">
          <div class="profile-detail h-100">
            <p class="profile-label mb-1">Relieve</p>
            <p class="profile-value mb-0 text-capitalize">${escapeHtml(moto.relieve || "—")}</p>
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
  const token = sessionStorage.getItem("bt_token");
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    ...options
  });

  if (response.status === 401) {
    sessionStorage.clear();
    window.location.replace("/login.html");
    return;
  }

  if (!response.ok) {
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
  ui.fields.relieve.value = "bajo";
  resetPhotoState();
}

function fillForm(moto) {
  ui.fields.id.value = moto.id;
  ui.fields.placa.value = moto.placa;
  ui.fields.marca.value = moto.marca;
  ui.fields.modelo.value = moto.modelo;
  ui.fields.anio.value = moto.anio;
  ui.fields.cilindraje.value = moto.cilindraje;
  ui.fields.estado.value = moto.estado;
  ui.fields.relieve.value = moto.relieve || "bajo";
  ui.fields.propietario.value = moto.propietario;
  state.draftFoto = moto.foto || "";
  state.draftFotoPreset = moto.fotoPreset || inferPresetId(moto);
  updatePhotoPreview();
  renderPresetGallery();
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
    relieve: ui.fields.relieve.value,
    foto: state.draftFoto,
    fotoPreset: state.draftFoto ? "" : state.draftFotoPreset,
    propietario: ui.fields.propietario.value.trim()
  };

  if (!COLOMBIA_MOTO_PLATE_REGEX.test(payload.placa)) {
    notify("danger", "La placa debe tener formato colombiano de moto: ABC12D.");
    ui.fields.placa.focus();
    return;
  }

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

ui.fotoInput.addEventListener("change", async (event) => {
  const [file] = event.target.files || [];
  if (!file) {
    updatePhotoPreview();
    return;
  }

  if (!file.type.startsWith("image/")) {
    notify("danger", "Solo puedes subir imagenes.");
    ui.fotoInput.value = "";
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    notify("danger", "La imagen debe pesar maximo 2 MB.");
    ui.fotoInput.value = "";
    return;
  }

  state.draftFoto = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen."));
    reader.readAsDataURL(file);
  }).catch((error) => {
    notify("danger", error.message);
    return "";
  });

  if (!state.draftFoto) return;

  state.draftFotoPreset = "";
  updatePhotoPreview();
  renderPresetGallery();
});

ui.btnClearPhoto.addEventListener("click", () => {
  resetPhotoState();
});

renderPresetGallery();
updatePhotoPreview();

// Logout
document.getElementById("btnLogout")?.addEventListener("click", async () => {
  const token = sessionStorage.getItem("bt_token");
  await fetch("/api/auth/logout", { method: "POST", headers: { "Authorization": `Bearer ${token}` } }).catch(() => {});
  sessionStorage.clear();
  window.location.replace("/login.html");
});
