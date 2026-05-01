// Guard de autenticacion
const _token = sessionStorage.getItem("bt_token");
if (!_token) window.location.replace("/login.html");

const alerta = document.getElementById("alerta");
const form = document.getElementById("formMantenimiento");
const motoSelect = document.getElementById("motoId");
const historialContainer = document.getElementById("historialContainer");

let _motosCache = [];

function notify(type, text) {
  alerta.className = `alert alert-${type}`;
  alerta.textContent = text;
  alerta.classList.remove("d-none");
  setTimeout(() => alerta.classList.add("d-none"), 3000);
}

function setInvalid(el, message) {
  el.classList.add("is-invalid");
  el.classList.remove("is-valid");
  const fb = el.nextElementSibling;
  if (fb && fb.classList.contains("invalid-feedback") && message) {
    fb.textContent = message;
  }
}

function setValid(el) {
  el.classList.remove("is-invalid");
  el.classList.add("is-valid");
}

function clearValidation() {
  form.querySelectorAll(".is-valid, .is-invalid").forEach((el) => {
    el.classList.remove("is-valid", "is-invalid");
  });
}

function validate() {
  let ok = true;

  const motoId = document.getElementById("motoId");
  const tipo = document.getElementById("tipo");
  const descripcion = document.getElementById("descripcion");
  const fecha = document.getElementById("fecha");
  const costo = document.getElementById("costo");
  const tecnico = document.getElementById("tecnico");

  if (!motoId.value) { setInvalid(motoId); ok = false; } else setValid(motoId);
  if (!tipo.value) { setInvalid(tipo); ok = false; } else setValid(tipo);
  if (!descripcion.value.trim()) { setInvalid(descripcion); ok = false; } else setValid(descripcion);

  if (!fecha.value) {
    setInvalid(fecha, "La fecha es obligatoria.");
    ok = false;
  } else {
    const selected = new Date(fecha.value + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selected > today) {
      setInvalid(fecha, "La fecha no puede ser futura.");
      ok = false;
    } else {
      setValid(fecha);
    }
  }

  const costoVal = costo.value.trim();
  if (costoVal === "" || Number(costoVal) < 0 || isNaN(Number(costoVal))) {
    setInvalid(costo, "El costo debe ser un numero igual o mayor a 0.");
    ok = false;
  } else {
    setValid(costo);
  }

  if (!tecnico.value.trim()) { setInvalid(tecnico); ok = false; } else setValid(tecnico);

  return ok;
}

async function loadMotos() {
  try {
    const token = sessionStorage.getItem("bt_token");
    const res = await fetch("/api/motos", { headers: { "Authorization": `Bearer ${token}` } });
    if (res.status === 401) { sessionStorage.clear(); window.location.replace("/login.html"); return; }
    if (!res.ok) throw new Error();
    const motos = await res.json();
    _motosCache = motos;

    if (!motos.length) {
      motoSelect.innerHTML =
        '<option value="">Primero registra tu moto personal</option>';
      motoSelect.disabled = true;
      return;
    }

    if (motos.length === 1) {
      const moto = motos[0];
      motoSelect.innerHTML = "";
      const opt = document.createElement("option");
      opt.value = moto.id;
      opt.textContent = `Mi moto: ${moto.placa} — ${moto.marca} ${moto.modelo}`;
      motoSelect.appendChild(opt);
      motoSelect.value = moto.id;
      return;
    }

    motos.forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = `${m.placa} — ${m.propietario}`;
      motoSelect.appendChild(opt);
    });
  } catch {
    notify("warning", "No se pudo cargar la lista de motocicletas.");
  }
}

function getMotoPlaca(motoId) {
  const m = _motosCache.find((x) => x.id === motoId);
  return m ? m.placa : null;
}

function formatCOP(value) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(value);
}

function formatFecha(value) {
  if (!value) return "-";
  return new Date(value + "T00:00:00").toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

async function loadHistorial() {
  try {
    const token = sessionStorage.getItem("bt_token");
    const res = await fetch("/api/mantenimientos", { headers: { "Authorization": `Bearer ${token}` } });
    if (!res.ok) throw new Error();
    const items = await res.json();

    if (!items.length) {
      historialContainer.innerHTML = '<p class="text-muted">No tienes mantenimientos registrados aun.</p>';
      return;
    }

    // Ordenar por fecha mas reciente primero
    items.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    historialContainer.innerHTML = `
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead class="table-light">
            <tr>
              <th>Fecha</th>
              <th>Vehiculo</th>
              <th>Tipo</th>
              <th>Descripcion</th>
              <th>Costo</th>
              <th>Tecnico</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((m) => {
              const placa = getMotoPlaca(m.moto_id);
              return `<tr>
                <td>${formatFecha(m.fecha)}</td>
                <td>${placa ? `<span class="badge bg-secondary">${placa}</span>` : '<span class="text-muted small">Desconocido</span>'}</td>
                <td class="text-capitalize">${m.tipo}</td>
                <td>${m.descripcion}</td>
                <td>${formatCOP(m.costo)}</td>
                <td>${m.tecnico}</td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  } catch {
    historialContainer.innerHTML = '<p class="text-muted text-danger">No se pudo cargar el historial.</p>';
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validate()) return;

  const payload = {
    moto_id: document.getElementById("motoId").value,
    tipo: document.getElementById("tipo").value,
    descripcion: document.getElementById("descripcion").value.trim(),
    fecha: document.getElementById("fecha").value,
    costo: Number(document.getElementById("costo").value),
    tecnico: document.getElementById("tecnico").value.trim()
  };

  try {
    const token = sessionStorage.getItem("bt_token");
    const res = await fetch("/api/mantenimientos", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const data = await res.json();
      const msg = data?.errors?.join(" ") || data?.message || "Error al guardar.";
      notify("danger", msg);
      return;
    }

    notify("success", "Mantenimiento registrado correctamente.");
    form.reset();
    clearValidation();
    loadHistorial();
  } catch {
    notify("danger", "No se pudo conectar con el servidor.");
  }
});

document.getElementById("btnLimpiar").addEventListener("click", () => {
  form.reset();
  clearValidation();
});

loadMotos().then(() => loadHistorial());

// Logout
document.getElementById("btnLogout")?.addEventListener("click", async () => {
  const token = sessionStorage.getItem("bt_token");
  await fetch("/api/auth/logout", { method: "POST", headers: { "Authorization": `Bearer ${token}` } }).catch(() => {});
  sessionStorage.clear();
  window.location.replace("/login.html");
});
