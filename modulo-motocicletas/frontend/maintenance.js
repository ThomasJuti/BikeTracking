const alerta = document.getElementById("alerta");
const form = document.getElementById("formMantenimiento");
const motoSelect = document.getElementById("motoId");

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
    const res = await fetch("/api/motos");
    if (!res.ok) throw new Error();
    const motos = await res.json();

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
    const res = await fetch("/api/mantenimientos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
  } catch {
    notify("danger", "No se pudo conectar con el servidor.");
  }
});

document.getElementById("btnLimpiar").addEventListener("click", () => {
  form.reset();
  clearValidation();
});

loadMotos();
