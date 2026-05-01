// ─── Auth guard ────────────────────────────────────────────────────────────
const _token = sessionStorage.getItem("bt_token");
if (!_token) window.location.replace("/login.html");

const statsContainer = document.getElementById("stats");
const summaryContainer = document.getElementById("homeSummary");

function prettyState(value) {
  const map = {
    activa: "Activa",
    mantenimiento: "En mantenimiento",
    inactiva: "Inactiva"
  };

  return map[value] || "Sin definir";
}

function formatDate(value) {
  if (!value) return "Sin registro";

  return new Date(value).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function renderStats(primaryMoto, mantenimientos) {
  const cards = [
    {
      title: "Mi placa",
      value: primaryMoto?.placa || "Sin registro",
      tone: "primary"
    },
    {
      title: "Estado actual",
      value: prettyState(primaryMoto?.estado),
      tone: primaryMoto?.estado === "mantenimiento" ? "warning" : "success"
    },
    {
      title: "Servicios guardados",
      value: String(mantenimientos.length),
      tone: "warning"
    },
    {
      title: "Ultimo servicio",
      value: formatDate(mantenimientos[0]?.fecha),
      tone: "secondary"
    }
  ];

  statsContainer.innerHTML = cards
    .map(
      (card) => `
      <div class="col-6 col-md-3">
        <article class="card h-100 border-0 shadow-sm">
          <div class="card-body">
            <p class="text-muted mb-1 small">${card.title}</p>
            <p class="fs-4 fw-bold text-${card.tone} mb-0">${card.value}</p>
          </div>
        </article>
      </div>
    `
    )
    .join("");
}

function renderSummary(primaryMoto, mantenimientos) {
  if (!primaryMoto) {
    summaryContainer.innerHTML = `
      <article class="card border-0 shadow-sm">
        <div class="card-body p-4">
          <p class="text-uppercase tracking fw-semibold mb-2">Primer paso</p>
          <h2 class="fs-4 fw-bold mb-2">Todavia no has registrado tu moto</h2>
          <p class="text-muted mb-0">
            Crea la ficha de tu vehiculo personal para empezar a registrar revisiones y mantenimientos.
          </p>
        </div>
      </article>
    `;
    return;
  }

  summaryContainer.innerHTML = `
    <article class="card border-0 shadow-sm">
      <div class="card-body p-4 p-md-5">
        <div class="row g-3 align-items-center">
          <div class="col-12 col-lg-8">
            <p class="text-uppercase tracking fw-semibold mb-2">Vehiculo principal</p>
            <h2 class="fs-3 fw-bold mb-2">${primaryMoto.marca} ${primaryMoto.modelo}</h2>
            <p class="text-muted mb-0">
              Placa ${primaryMoto.placa} · ${primaryMoto.cilindraje} · Propietario ${primaryMoto.propietario}
            </p>
          </div>
          <div class="col-12 col-lg-4">
            <div class="rounded-4 p-3 bg-light border">
              <p class="text-muted mb-1 small">Historial personal</p>
              <p class="fs-4 fw-bold mb-1">${mantenimientos.length} registros</p>
              <p class="text-muted small mb-0">Ultima fecha: ${formatDate(mantenimientos[0]?.fecha)}</p>
            </div>
          </div>
        </div>
      </div>
    </article>
  `;
}

(async function init() {
  try {
    const authHeader = { "Authorization": `Bearer ${sessionStorage.getItem("bt_token")}` };
    const [motosRes, mantenimientosRes] = await Promise.all([
      fetch("/api/motos", { headers: authHeader }),
      fetch("/api/mantenimientos", { headers: authHeader })
    ]);

    if (!motosRes.ok || !mantenimientosRes.ok) {
      throw new Error("No se pudieron cargar los datos principales.");
    }

    const motos = await motosRes.json();
    const mantenimientos = await mantenimientosRes.json();
    const primaryMoto = motos[0] || null;
    const motoMantenimientos = primaryMoto
      ? mantenimientos
          .filter((item) => item.moto_id === primaryMoto.id)
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      : [];

    renderStats(primaryMoto, motoMantenimientos);
    renderSummary(primaryMoto, motoMantenimientos);
  } catch {
    statsContainer.innerHTML = `
      <div class="col-12">
        <article class="card border-0 shadow-sm">
          <div class="card-body">
            <p class="text-muted mb-0">No se pudieron cargar los datos del seguimiento personal.</p>
          </div>
        </article>
      </div>
    `;
    summaryContainer.innerHTML = "";
  }
})();

// ─── Header: usuario y logout ──────────────────────────────────────────────
const headerUser = document.getElementById("headerUser");
if (headerUser) {
  headerUser.textContent = sessionStorage.getItem("bt_username") || "";
}

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
