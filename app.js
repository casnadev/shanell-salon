/* =========================================================
   Shanell Salón — interacción de la maqueta
   (datos de ejemplo; en la versión final vienen de Supabase)
   ========================================================= */
const CONFIG = {
  whatsapp: "51999999999",              // número de la dueña, con código de país
  salon: "Shanell Salón",
  dominio: "shanellsalon.pe",
  intervalo: 30,                        // minutos entre horarios
  horario: { 0: null, 1: [9, 20], 2: [9, 20], 3: [9, 20], 4: [9, 20], 5: [9, 20], 6: [9, 19] },
};

const SERVICIOS = [
  { id: 1, cat: "Estilismo", nombre: "Corte y cepillado", min: 60, precio: 60 },
  { id: 2, cat: "Estilismo", nombre: "Peinado para evento", min: 60, precio: 90 },
  { id: 3, cat: "Estilismo", nombre: "Tinte completo", min: 120, precio: 140 },
  { id: 4, cat: "Estilismo", nombre: "Balayage", min: 180, precio: 280 },
  { id: 5, cat: "Nails", nombre: "Manicure semipermanente", min: 60, precio: 45 },
  { id: 6, cat: "Nails", nombre: "Pedicure spa", min: 60, precio: 50 },
  { id: 7, cat: "Nails", nombre: "Uñas acrílicas", min: 90, precio: 90 },
  { id: 8, cat: "Tratamientos", nombre: "Hidratación profunda", min: 60, precio: 80 },
  { id: 9, cat: "Tratamientos", nombre: "Alisado orgánico", min: 150, precio: 220 },
  { id: 10, cat: "Barbería", nombre: "Corte clásico", min: 30, precio: 35 },
  { id: 11, cat: "Barbería", nombre: "Corte + barba", min: 60, precio: 55 },
];

const IMG = (id) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=160&h=160&crop=faces&q=70`;
const PROFESIONALES = [
  { id: 1, nombre: "Trabajador 1", rol: "Estilista", foto: IMG("1739825353871-2b9c6716142a"), cats: ["Estilismo", "Tratamientos"] },
  { id: 2, nombre: "Trabajador 2", rol: "Colorista", foto: IMG("1753951494095-a9570d65dfe1"), cats: ["Estilismo", "Tratamientos"] },
  { id: 3, nombre: "Trabajador 3", rol: "Barbero", foto: IMG("1642795730901-84f82e088e17"), cats: ["Barbería"] },
  { id: 4, nombre: "Trabajador 4", rol: "Nails & spa", foto: IMG("1704311183024-5600be2a1a7e"), cats: ["Nails", "Tratamientos"] },
];

const CATS = ["Estilismo", "Nails", "Tratamientos", "Barbería"];
const DIAS = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];
const DIAS_LARGO = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const pad = (n) => String(n).padStart(2, "0");
const fmtHora = (m) => `${Math.floor(m / 60)}:${pad(m % 60)}`;
const fmt12 = (m) => {
  const h = Math.floor(m / 60), mm = pad(m % 60);
  return `${((h + 11) % 12) + 1}:${mm} ${h < 12 ? "a. m." : "p. m."}`;
};
const waLink = (txt) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(txt)}`;

/* ---------- Header, menú, reveal ---------- */
const header = $("#header");
const onScroll = () => header.classList.toggle("solid", window.scrollY > window.innerHeight * 0.6);
addEventListener("scroll", onScroll, { passive: true }); onScroll();

const menu = $("#menu");
$("#menuOpen").onclick = () => { menu.classList.add("open"); menu.setAttribute("aria-hidden", "false"); };
const closeMenu = () => { menu.classList.remove("open"); menu.setAttribute("aria-hidden", "true"); };
$("#menuClose").onclick = closeMenu;
$$("#menu nav a").forEach((a) => (a.onclick = closeMenu));

const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))), { threshold: 0.15 });
$$(".reveal").forEach((el) => io.observe(el));

$$("[data-wa-info]").forEach((a) => (a.href = waLink(`Hola, quisiera información sobre los servicios de ${CONFIG.salon} ✨`)));
const hoy = new Date().getDay();
$(`#hoursList li[data-d="${hoy}"]`)?.classList.add("today");

/* ---------- Modales ---------- */
const booking = $("#booking"), policy = $("#policy");
const open = (el) => { el.classList.add("open"); document.body.style.overflow = "hidden"; };
const close = (el) => { el.classList.remove("open"); if (!$(".sheet-wrap.open")) document.body.style.overflow = ""; };
$$(".sheet-wrap").forEach((w) => {
  w.addEventListener("click", (e) => { if (e.target === w || e.target.closest("[data-close]")) close(w); });
});
addEventListener("keydown", (e) => { if (e.key === "Escape") $$(".sheet-wrap.open").forEach(close); });
$$("[data-open-policy]").forEach((a) => a.addEventListener("click", (e) => { e.preventDefault(); open(policy); }));

/* ---------- Estado de la reserva ---------- */
const S = { paso: 1, cat: CATS[0], servicio: null, pro: null, fecha: null, hora: null };
const ETIQUETAS = { 1: "Servicio", 2: "Profesional", 3: "Fecha y hora", 4: "Tus datos" };

$$("[data-reservar]").forEach((b) =>
  b.addEventListener("click", () => {
    closeMenu();
    const cat = b.dataset.reservar;
    Object.assign(S, { paso: 1, servicio: null, pro: null, fecha: null, hora: null, cat: CATS.includes(cat) ? cat : CATS[0] });
    render(); open(booking);
  })
);

function render() {
  $$(".step").forEach((s) => s.classList.toggle("active", +s.dataset.step === S.paso));
  $$("#bkProgress i").forEach((i, n) => i.classList.toggle("on", n < Math.min(S.paso, 4)));
  $("#bkStepLabel").innerHTML = S.paso <= 4 ? `Paso ${S.paso} de 4 · <b>${ETIQUETAS[S.paso]}</b>` : "<b>Reserva enviada</b>";
  $("#bkFoot").style.display = S.paso === 5 ? "none" : "";
  $("#bkBack").style.visibility = S.paso === 1 ? "hidden" : "visible";
  const next = $("#bkNext");
  next.className = "btn-next" + (S.paso === 4 ? " wa" : "");
  next.innerHTML = S.paso === 4 ? `<svg><use href="#i-wa"/></svg> Reservar por WhatsApp` : "Continuar";
  ({ 1: paso1, 2: paso2, 3: paso3, 4: paso4 })[S.paso]?.();
  validar();
  $(".sheet-body").scrollTop = 0;
}

function validar() {
  const ok = {
    1: !!S.servicio,
    2: !!S.pro,
    3: !!S.fecha && S.hora != null,
    4: $("#fNombre").value.trim().length >= 3 && /^9\d{8}$/.test($("#fCel").value) && $("#fPriv").checked,
  }[S.paso];
  $("#bkNext").disabled = !ok;
}

/* Paso 1 */
function paso1() {
  $("#catChips").innerHTML = CATS.map((c) => `<button class="chip ${c === S.cat ? "on" : ""}" data-cat="${c}">${c}</button>`).join("");
  $$("#catChips .chip").forEach((b) => (b.onclick = () => { S.cat = b.dataset.cat; paso1(); }));
  $("#svcList").innerHTML = SERVICIOS.filter((s) => s.cat === S.cat).map((s) => `
    <button class="opt ${S.servicio?.id === s.id ? "on" : ""}" data-id="${s.id}">
      <span class="check">✓</span>
      <span class="grow"><b>${s.nombre}</b><small>${s.min} min</small></span>
      <span class="price">S/ ${s.precio}</span>
    </button>`).join("");
  $$("#svcList .opt").forEach((b) => (b.onclick = () => {
    const s = SERVICIOS.find((x) => x.id === +b.dataset.id);
    if (S.servicio?.id !== s.id) Object.assign(S, { servicio: s, pro: null, hora: null });
    paso1(); validar();
  }));
}

/* Paso 2 */
function paso2() {
  const lista = PROFESIONALES.filter((p) => p.cats.includes(S.servicio.cat));
  $("#proList").innerHTML = lista.map((p) => `
    <button class="opt ${S.pro?.id === p.id ? "on" : ""}" data-id="${p.id}">
      <img src="${p.foto}" alt="">
      <span class="grow"><b>${p.nombre}</b><small>${p.rol}</small></span>
      <span class="check">✓</span>
    </button>`).join("");
  $$("#proList .opt").forEach((b) => (b.onclick = () => {
    S.pro = PROFESIONALES.find((x) => x.id === +b.dataset.id); S.hora = null;
    paso2(); validar();
  }));
}

/* Paso 3 */
const diasDisponibles = () => {
  const base = new Date(); base.setHours(0, 0, 0, 0);
  return Array.from({ length: 21 }, (_, i) => { const d = new Date(base); d.setDate(base.getDate() + i); return d; });
};
const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Ocupación simulada y estable por profesional/día (en la versión real: horarios_disponibles())
function ocupado(proId, fechaIso, minuto) {
  let h = 0; const k = `${proId}|${fechaIso}|${Math.floor(minuto / 60)}`;
  for (const c of k) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 10 < 3;
}
function horasLibres(fecha) {
  const rango = CONFIG.horario[fecha.getDay()];
  if (!rango) return [];
  const [ini, fin] = rango, dur = S.servicio.min, iso = isoDate(fecha);
  const ahora = new Date(), esHoy = isoDate(ahora) === iso;
  const minAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const out = [];
  for (let m = ini * 60; m + dur <= fin * 60; m += CONFIG.intervalo) {
    if (esHoy && m <= minAhora + 30) continue;
    let libre = true;
    for (let t = m; t < m + dur; t += CONFIG.intervalo) if (ocupado(S.pro.id, iso, t)) { libre = false; break; }
    if (libre) out.push(m);
  }
  return out;
}

function paso3() {
  const dias = diasDisponibles();
  if (!S.fecha) S.fecha = dias.find((d) => horasLibres(d).length) || null;
  $("#dateStrip").innerHTML = dias.map((d) => {
    const cerrado = !CONFIG.horario[d.getDay()];
    const sel = S.fecha && isoDate(S.fecha) === isoDate(d);
    return `<button class="date ${sel ? "on" : ""}" data-iso="${isoDate(d)}" ${cerrado ? "disabled title='Cerrado'" : ""}>
      <small>${DIAS[d.getDay()]}</small><b>${d.getDate()}</b><small>${MESES[d.getMonth()].slice(0, 3)}</small></button>`;
  }).join("");
  $$("#dateStrip .date").forEach((b) => (b.onclick = () => {
    S.fecha = dias.find((d) => isoDate(d) === b.dataset.iso); S.hora = null; paso3(); validar();
  }));
  $("#dateStrip .date.on")?.scrollIntoView({ block: "nearest", inline: "center" });

  $("#monthLabel").textContent = S.fecha ? `${MESES[S.fecha.getMonth()]} ${S.fecha.getFullYear()}` : "";
  $("#durLabel").textContent = `${S.servicio.nombre} · ${S.servicio.min} min`;
  const horas = S.fecha ? horasLibres(S.fecha) : [];
  $("#hourGrid").innerHTML = horas.length
    ? horas.map((m) => `<button class="hour ${S.hora === m ? "on" : ""}" data-m="${m}">${fmtHora(m)}</button>`).join("")
    : `<p class="empty" style="grid-column:1/-1">Sin horarios disponibles ese día.</p>`;
  $$("#hourGrid .hour").forEach((b) => (b.onclick = () => { S.hora = +b.dataset.m; paso3(); validar(); }));
}

/* Paso 4 */
const fechaTexto = () => `${DIAS_LARGO[S.fecha.getDay()]} ${pad(S.fecha.getDate())}/${pad(S.fecha.getMonth() + 1)}`;
function paso4() {
  $("#summaryBox").innerHTML = `
    <div><span>Servicio</span><b>${S.servicio.nombre}</b></div>
    <div><span>Profesional</span><b>${S.pro.nombre}</b></div>
    <div><span>Fecha</span><b>${fechaTexto()}</b></div>
    <div><span>Hora</span><b>${fmt12(S.hora)} – ${fmt12(S.hora + S.servicio.min)}</b></div>
    <div class="total"><span>Total referencial</span><b>S/ ${S.servicio.precio}</b></div>`;
}
["#fNombre", "#fCel", "#fPriv"].forEach((id) => $(id).addEventListener("input", () => {
  if (id === "#fCel") {
    const el = $(id); el.value = el.value.replace(/\D/g, "").slice(0, 9);
    $("#celHint").textContent = el.value && !/^9\d{8}$/.test(el.value) ? "Ingresa un celular de 9 dígitos que empiece con 9" : "";
  }
  validar();
}));

/* Navegación */
$("#bkBack").onclick = () => { if (S.paso > 1) { S.paso--; render(); } };
$("#bkNext").onclick = () => {
  if ($("#bkNext").disabled) return;
  if (S.paso < 4) { S.paso++; render(); return; }
  enviar();
};

function enviar() {
  // En la versión final: POST /api/reservar (Turnstile + Supabase) devuelve código y token
  const codigo = "#A" + (1000 + Math.floor(Math.random() * 9000));
  const token = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(16).slice(2)).slice(0, 8);
  const msg = [
    "Hola, quiero reservar una cita ✨",
    `💇 Servicio: ${S.servicio.nombre}`,
    `👩 Profesional: ${S.pro.nombre}`,
    `📅 ${fechaTexto()} a las ${fmt12(S.hora)}`,
    `🙋 Nombre: ${$("#fNombre").value.trim()}`,
    `📱 Celular: ${$("#fCel").value}`,
    `🔗 Mi reserva: https://${CONFIG.dominio}/reserva/${token}`,
    `Código: ${codigo}`,
  ].join("\n");
  const link = waLink(msg);
  $("#doneCode").textContent = codigo;
  $("#doneWa").href = link;
  S.paso = 5; render();
  window.open(link, "_blank", "noopener");
}
