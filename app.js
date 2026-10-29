(async () => {
  const T = window.TIENDA, SB = window.SUPABASE || {};
  let CATS = window.CATEGORIAS || [];
  let PRODS = window.PRODUCTOS || [];
  const $ = s => document.querySelector(s);
  // ---------- Sin emojis en toda la tienda ----------
  const RX_EMO = /(?![©®™♡])\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\uFE0F\u200D\u20E3]/gu;
  const limpiarTxt = t => t.replace(RX_EMO, "").replace(/ {2,}/g, " ").replace(/ +([!?.,:;)])/g, "$1");
  const limpiarNodo = raiz => {
    if (raiz.nodeType === 3) { const v = limpiarTxt(raiz.nodeValue); if (v !== raiz.nodeValue) raiz.nodeValue = v; return; }
    if (raiz.nodeType !== 1 || raiz.closest("script,style,textarea")) return;
    const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) { if (n.parentElement && n.parentElement.closest("script,style,textarea")) continue; const v = limpiarTxt(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; }
    raiz.querySelectorAll && raiz.querySelectorAll("[placeholder],[title],[aria-label]").forEach(el => ["placeholder", "title", "aria-label"].forEach(a => { const v = el.getAttribute(a); if (v) { const l = limpiarTxt(v); if (l !== v) el.setAttribute(a, l); } }));
  };
  limpiarNodo(document.body);
  new MutationObserver(ms => ms.forEach(m => { if (m.type === "characterData") limpiarNodo(m.target); else m.addedNodes.forEach(limpiarNodo); }))
    .observe(document.body, { childList: true, subtree: true, characterData: true });
  const _ph = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "placeholder");
  if (_ph && _ph.set) Object.defineProperty(HTMLInputElement.prototype, "placeholder", { get: _ph.get, set(v) { _ph.set.call(this, limpiarTxt(String(v))); }, configurable: true });
  const app = $("#app");
  const bs = n => `${T.moneda} ${Number(n).toFixed(2).replace(".", ",")}`;
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // stock puede ser número (cantidad) o true/false
  const disp = x => x === true || (typeof x === "number" && x > 0);
  const tieneVar = p => Array.isArray(p.variantes) && p.variantes.length > 0;
  const hayStock = p => tieneVar(p) ? p.variantes.some(v => disp(v.stock)) : (p.stock === undefined || disp(p.stock));
  const sinEmoji = t => String(t ?? "").replace(/(?!♡)[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{1F3FB}-\u{1F3FF}\uFE0F\u200D\u20E3]/gu, "").replace(/[ \t]{2,}/g, " ").replace(/^[ \t]+|[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n").trim();
  const foto = p => (p.imagenes && p.imagenes[0]) || T.logo;
  const maxDe = (p, vari) => { const s = tieneVar(p) ? (p.variantes.find(v => v.nombre === vari) || {}).stock : p.stock; return typeof s === "number" ? s : 99; };

  async function cargarProductos() {
    if (!SB.url || !SB.key) return;
    try {
      const r = await fetch(`${SB.url.replace(/\/$/, "")}/rest/v1/productos?select=*&activo=eq.true&order=orden.asc,creado.desc`,
        { headers: { apikey: SB.key, Authorization: `Bearer ${SB.key}` } });
      if (!r.ok) throw new Error(r.status);
      PRODS = (await r.json()).map(p => ({ ...p, precio: Number(p.precio), variantes: tieneVar(p) ? p.variantes : null }));
    } catch (e) { console.warn("No se pudieron cargar los productos de Supabase", e); }
  }

  // Ajustes que cambias desde el panel (avisos, banners, textos…)
  async function cargarAjustes() {
    if (!SB.url || !SB.key) return;
    try {
      const r = await fetch(`${SB.url.replace(/\/$/, "")}/rest/v1/ajustes?id=eq.tienda&select=datos`,
        { headers: { apikey: SB.key, Authorization: `Bearer ${SB.key}` } });
      if (!r.ok) throw new Error(r.status);
      const [fila] = await r.json();
      if (fila && fila.datos) for (const [k, v] of Object.entries(fila.datos)) if (v !== null && v !== undefined) T[k] = v;
    } catch (e) { console.warn("No se pudieron cargar los ajustes", e); }
  }

  app.innerHTML = `<p class="vacio" style="padding:80px 16px">Cargando cositas kawaii…</p>`;
  await Promise.all([cargarAjustes(), cargarProductos()]);
  if (Array.isArray(T.categorias) && T.categorias.length) CATS = T.categorias;
  const inicial = n => String(n || "?").replace(/[^\p{L}\p{N} ]/gu, " ").trim().split(/\s+/).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
  const circ = c => c.imagen ? `<img src="${esc(c.imagen)}" alt="">` : `<span class="circ-emoji circ-letra">${esc(inicial(c.nombre))}</span>`;

  // ---------- Datos fijos ----------
  document.title = T.nombre;
  $("#pie-nombre").textContent = $("#pie-nombre2").textContent = T.nombre;
  $("#anio").textContent = new Date().getFullYear();

  // Logo: si la imagen existe se muestra; si no, queda el nombre con letras rosadas
  const logo = $("#logo"), logoTxt = $("#logo-texto");
  logo.style.display = "none";
  if (T.logo) {
    logo.onload = () => { logo.style.display = ""; logoTxt.style.display = "none"; };
    logo.onerror = () => logo.remove();
    logo.src = T.logo; logo.alt = T.nombre;
  }
  document.querySelectorAll(".gato").forEach(g => g.remove());

  $("#wa-flotante").href = `https://wa.me/${T.whatsapp}`;
  { const pl = $("#pie-logo"); if (pl) { if (T.logo) { pl.src = T.logo; pl.alt = T.nombre; } else pl.remove(); } }
  { const pm = $(".pie-marca"); if (pm) {
    if (T.pieTexto && $("#pie-texto")) $("#pie-texto").textContent = T.pieTexto;
    if (T.ubicacion) pm.insertAdjacentHTML("beforeend", `<p class="pie-dato">${esc(T.ubicacion)}</p>`);
    if (T.whatsapp && !/^5917000000/.test(T.whatsapp)) pm.insertAdjacentHTML("beforeend", `<p class="pie-dato">WhatsApp: +${esc(T.whatsapp)}</p>`);
  } }
  // Formas de entrega en el carrito
  const ENT = (T.entregas || []).filter(Boolean);
  if (!$("#sel-entrega")) {} else if (ENT.length) $("#sel-entrega").innerHTML = `<option value="" disabled selected>¿Cómo quieres recibirlo?</option>` + ENT.map(x => `<option>${esc(x)}</option>`).join("");
  else $("#sel-entrega").remove();
  $("#pie-redes").insertAdjacentHTML("beforeend", [
    T.instagram && `<a href="${T.instagram}" target="_blank" rel="noopener">Instagram</a>`,
    T.tiktok && `<a href="${T.tiktok}" target="_blank" rel="noopener">TikTok</a>`,
    `<a href="https://wa.me/${T.whatsapp}" target="_blank" rel="noopener">WhatsApp</a>`
  ].filter(Boolean).join(""));

  // Barra de avisos con flechas
  const AV = (T.avisos || []).filter(Boolean); if (!AV.length) AV.push("");
  let ia = 0, reloj; const av = $("#aviso-texto");
  const mostrarAviso = d => {
    ia = (ia + d + AV.length) % AV.length;
    av.style.opacity = 0;
    setTimeout(() => { av.textContent = AV[ia]; av.style.opacity = 1; }, 200);
    clearInterval(reloj); reloj = setInterval(() => mostrarAviso(1), 4500);
  };
  av.textContent = AV[0];
  if (AV.length > 1) reloj = setInterval(() => mostrarAviso(1), 4500);
  else $("#aviso-prev").style.visibility = $("#aviso-sig").style.visibility = "hidden";
  $("#aviso-prev").onclick = () => mostrarAviso(-1);
  $("#aviso-sig").onclick = () => mostrarAviso(1);

  // Stickers dibujados
  const STK = {
    lapiz: `<svg viewBox="0 0 80 80"><g transform="rotate(-40 40 40)"><rect x="30" y="6" width="20" height="10" rx="4" fill="#f7a1bd"/><rect x="30" y="15" width="20" height="5" fill="#d9d4e8"/><rect x="30" y="20" width="20" height="38" fill="#ffc6d9"/><rect x="36" y="20" width="8" height="38" fill="#ffd9e6"/><circle cx="40" cy="30" r="3" fill="#fff"/><path d="M38 27c0-3 4-3 4 0-2 2-2 2-2 4 0-2 0-2-2-4z" fill="#f07aa3"/><circle cx="40" cy="44" r="2.5" fill="#ffe58a"/><path d="M30 58h20l-10 16z" fill="#ffe3c2"/><path d="M36.5 68.5h7L40 74z" fill="#7a5c63"/></g></svg>`,
    estrella: `<svg viewBox="0 0 64 64"><path d="M32 4l8.6 17.4 19.2 2.8-13.9 13.6 3.3 19.1L32 47.9 14.8 57l3.3-19.1L4.2 24.2l19.2-2.8z" fill="#ffd84d" stroke="#f5b82e" stroke-width="2.5" stroke-linejoin="round"/><path d="M22 22l5-1" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle cx="26" cy="33" r="2" fill="#7a5c22"/><circle cx="38" cy="33" r="2" fill="#7a5c22"/><path d="M29 38c2 2 4 2 6 0" stroke="#7a5c22" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="22" cy="38" r="2.5" fill="#ffa5b9" opacity=".8"/><circle cx="42" cy="38" r="2.5" fill="#ffa5b9" opacity=".8"/></svg>`,
    corazon: `<svg viewBox="0 0 32 32"><path d="M16 28S3 20 3 11a6.5 6.5 0 0 1 13-1 6.5 6.5 0 0 1 13 1c0 9-13 17-13 17z" fill="#fd95c8"/><ellipse cx="10" cy="10" rx="2.5" ry="1.5" fill="#fff" opacity=".7"/></svg>`
  };
  const sticker = (tipo, clase, estilo = "") => `<span class="sticker ${clase}" style="${estilo}" aria-hidden="true">${STK[tipo]}</span>`;

  // ---------- Carrito ----------
  let carrito = [];
  try { carrito = JSON.parse(localStorage.getItem("carrito") || "[]"); } catch (e) {}
  const guardar = () => { try { localStorage.setItem("carrito", JSON.stringify(carrito)); } catch (e) {} pintarCarrito(); };
  const agregar = (id, variante, cant) => {
    const ex = carrito.find(i => i.id === id && i.variante === variante);
    ex ? ex.cant += cant : carrito.push({ id, variante, cant });
    guardar(); toast("Agregado al carrito");
  };
  function pintarCarrito() {
    const n = carrito.reduce((a, i) => a + i.cant, 0);
    const c = $("#contador"); c.textContent = n; c.dataset.v = n;
    const items = carrito.map((i, k) => ({ ...i, k, p: PRODS.find(p => p.id === i.id) })).filter(i => i.p);
    $("#carrito-items").innerHTML = items.length ? items.map(i => `
      <div class="item">
        <img src="${esc(((i.p.variantes || []).find(v => v.nombre === i.variante) || {}).imagen || foto(i.p))}" alt="">
        <div>
          <h4>${esc(sinEmoji(i.p.nombre))}</h4>
          ${i.variante ? `<small>${esc(i.variante)}</small><br>` : ""}
          <small>${bs(i.p.precio)}</small>
          <div class="cantidad"><button data-menos="${i.k}">−</button><span>${i.cant}</span><button data-mas="${i.k}">+</button></div>
        </div>
        <button class="quitar" data-quitar="${i.k}">Quitar</button>
      </div>`).join("") : `<p class="vacio">Tu carrito está vacío</p>`;
    $("#subtotal").textContent = bs(items.reduce((a, i) => a + i.p.precio * i.cant, 0));
    $("#carrito-pie").style.display = items.length ? "" : "none";
  }
  $("#carrito-items").addEventListener("click", e => {
    const d = e.target.dataset;
    if (d.mas) { const it = carrito[d.mas], p = PRODS.find(x => x.id === it.id); if (p && it.cant >= maxDe(p, it.variante)) return toast("No hay más stock de este modelo"); it.cant++; }
    else if (d.menos) { carrito[d.menos].cant--; if (carrito[d.menos].cant < 1) carrito.splice(d.menos, 1); }
    else if (d.quitar) carrito.splice(d.quitar, 1);
    else return;
    guardar();
  });
  // Recordar los datos del formulario del carrito (nombre, WhatsApp, etc.)
  { const fp = $("#form-pedido");
    if (fp) {
      fp.addEventListener("input", () => { try { const d = {}; for (const el of fp.elements) if (el.name && el.type !== "file" && el.name !== "nota") d[el.name] = el.value; localStorage.setItem("datos-pedido", JSON.stringify(d)); } catch (e) {} });
      const t = document.createElement("p"); t.className = "form-tit"; t.textContent = "Tus datos para el pedido"; fp.before(t);
    } }
  const abrir = v => { $("#carrito").classList.toggle("abierto", v); $("#velo").classList.toggle("abierto", v); };
  $("#btn-carrito").onclick = () => abrir(true);
  $("#cerrar-carrito").onclick = $("#velo").onclick = () => abrir(false);

  $("#form-pedido").addEventListener("submit", async e => {
    e.preventDefault();
    const f = new FormData(e.target), btn = e.target.querySelector("button[type=submit]");
    const items = carrito.filter(i => PRODS.some(p => p.id === i.id));
    if (!items.length) return;
    // Abrir la ventana de WhatsApp ya (si no, el navegador la bloquea)
    const ventana = window.open("", "_blank");
    btn.disabled = true;
    let numero = null; const envio = datosEnvio(f);
    if (SB.url && SB.key) {
      try {
        const r = await fetch(`${SB.url.replace(/\/$/, "")}/rest/v1/rpc/crear_pedido`, {
          method: "POST",
          headers: { apikey: SB.key, Authorization: `Bearer ${SB.key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ p: {
            cliente: f.get("nombre"), telefono: f.get("telefono"), ciudad: envio.ciudad,
            direccion: envio.direccion, entrega: f.get("entrega") || "", nota: f.get("nota") || "",
            items: items.map(i => ({ id: i.id, variante: i.variante || null, cant: i.cant }))
          } })
        });
        if (r.ok) numero = await r.json();
      } catch (err) { console.warn("No se pudo guardar el pedido", err); }
    }
    const lineas = items.map(i => {
      const p = PRODS.find(x => x.id === i.id);
      return `• ${i.cant} x ${p.nombre}${i.variante ? ` (${i.variante})` : ""} — ${bs(p.precio * i.cant)}`;
    });
    const total = items.reduce((a, i) => a + PRODS.find(p => p.id === i.id).precio * i.cant, 0);
    const msg = [`🌸 *NUEVO PEDIDO · ${String(T.nombre).toUpperCase()}* 🌸`, numero ? `Pedido #${numero}` : null, "",
      "🛍️ *Mi pedido*", ...lineas, "",
      "👤 *Mis datos*", `Nombre: ${f.get("nombre")}`, `WhatsApp: ${f.get("telefono")}`, "",
      "🚚 *Entrega*", ...envio.lineas,
      f.get("nota") ? "" : null, f.get("nota") ? `📝 *Nota:* ${f.get("nota")}` : null, "",
      `💰 *TOTAL: ${bs(total)}*`, "",
      "¿Me envían el QR para realizar el pago? ¡Gracias! 💕"
    ].filter(x => x !== null).join("\n");
    const url = waURL(msg);
    if (ventana && !ventana.closed) ventana.location.href = url; else location.href = url;
    btn.disabled = false;
    if (numero) {
      carrito = []; guardar(); if (e.target.elements.nota) e.target.elements.nota.value = ""; abrir(false);
      toast(`¡Pedido #${numero} enviado! 💕`);
    }
  });

  // ---------- WhatsApp y datos de envío ----------
  const waURL = msg => `https://api.whatsapp.com/send?phone=${T.whatsapp}&text=${encodeURIComponent(msg)}`;
  const esOtroDepto = v => /otra ciudad|otro departamento|departamento|interior|provincia/i.test(v || "");
  const esRecojo = v => /recojo|retiro|recoger/i.test(v || "");
  const DEPTOS = ["La Paz", "El Alto", "Cochabamba", "Oruro", "Potosí", "Sucre", "Tarija", "Trinidad (Beni)", "Cobija (Pando)", "Montero", "Warnes"];
  const envioHTML = () => `<div class="envio-datos" hidden>
      <p class="envio-tit">Datos para el envío a otro departamento</p>
      <input name="env_nombre" placeholder="Nombre de quien recibe" autocomplete="name">
      <input name="env_ci" placeholder="Carnet de Identidad" inputmode="numeric">
      <input name="env_cel" type="tel" inputmode="tel" placeholder="Celular de quien recibe">
      <input name="env_destino" list="deptos-bo" placeholder="Destino (ciudad o departamento)">
      <datalist id="deptos-bo">${DEPTOS.map(d => `<option value="${d}">`).join("")}</datalist>
    </div>`;
  function ajustarEntrega(form) {
    const v = (form.querySelector("[name=entrega]") || {}).value || "", otro = esOtroDepto(v), recojo = esRecojo(v);
    const box = form.querySelector(".envio-datos");
    if (box) { box.hidden = !otro; box.querySelectorAll("input").forEach(i => i.required = otro); }
    ["ciudad", "direccion"].forEach(n => { const i = form.querySelector(`[name=${n}]`); if (!i) return; const ver = !otro && !recojo; i.hidden = !ver; i.required = ver && (n === "ciudad" || i.dataset.req === "1"); if (!ver) i.value = ""; });
  }
  function datosEnvio(f) {
    const ent = f.get("entrega") || "";
    if (esOtroDepto(ent)) {
      const d = { n: f.get("env_nombre"), ci: f.get("env_ci"), cel: f.get("env_cel"), des: f.get("env_destino") };
      return { ciudad: d.des, direccion: `Envío a ${d.des} · Recibe: ${d.n} · CI: ${d.ci} · Cel: ${d.cel}`,
        lineas: [ent, `Recibe: ${d.n}`, `Carnet de Identidad: ${d.ci}`, `Celular: ${d.cel}`, `Destino: ${d.des}`] };
    }
    if (esRecojo(ent)) return { ciudad: "Santa Cruz", direccion: "", lineas: [ent] };
    const dir = [f.get("direccion"), f.get("ciudad")].filter(x => x && x.trim()).join(", ");
    return { ciudad: f.get("ciudad") || "", direccion: f.get("direccion") || "", lineas: [ent, dir ? `Dirección: ${dir}` : null].filter(Boolean) };
  }
  { const fp = $("#form-pedido"), sel = $("#sel-entrega");
    if (fp && sel) {
      sel.insertAdjacentHTML("afterend", envioHTML()); sel.addEventListener("change", () => ajustarEntrega(fp));
      try { const d = JSON.parse(localStorage.getItem("datos-pedido") || "{}"); for (const [k, v] of Object.entries(d)) { const el = fp.elements[k]; if (el && v) el.value = v; } } catch (e) {}
      ajustarEntrega(fp);
    } }

  let tt; function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("ver"); clearTimeout(tt); tt = setTimeout(() => el.classList.remove("ver"), 1800); }

  // ---------- Vistas ----------
  const tarjeta = p => { const img2 = (p.imagenes || [])[1], per = personajeDe(p); return `
    <a class="tarjeta ${img2 ? "doble" : ""}" href="#/producto/${p.id}">
      <div class="foto"><img class="f1 ${(p.imagenes || []).length ? "" : "sin-foto"}" loading="lazy" src="${foto(p)}" alt="${esc(p.nombre)}">${img2 ? `<img class="f2" loading="lazy" src="${esc(img2)}" alt="">` : ""}
        ${!hayStock(p) ? `<span class="etiqueta agotado">Agotado</span>` : p.nuevo ? `<span class="etiqueta">Nuevo</span>` : ""}</div>
      <div class="info">${per ? `<span class="t-per">${esc(per.nombre)}</span>` : ""}<h3>${esc(sinEmoji(p.nombre))}</h3><div class="precio">${bs(p.precio)}</div>
        <span class="ver-mas">${hayStock(p) ? "Ver opciones →" : "Ver detalles →"}</span></div>
    </a>`; };
  const grilla = lista => lista.length ? `<div class="grilla">${lista.map(tarjeta).join("")}</div>` : `<p class="vacio">No encontramos productos 😿</p>`;

  const ESTRELLA_SVG = "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2.5l2.9 6.2 6.8.8-5 4.6 1.4 6.7L12 17.4l-6.1 3.4 1.4-6.7-5-4.6 6.8-.8z" fill="#fff275" stroke="#fd95c8" stroke-width="1.2" stroke-linejoin="round"/></svg>');
  let estrellaSrc = "estrella.webp";
  { const pre = new Image(); pre.onerror = () => { estrellaSrc = ESTRELLA_SVG; }; pre.src = estrellaSrc; }
  function estrellitas(el) {
    const r = el.getBoundingClientRect(), N = 16;
    const vis = Math.max(r.top, 0), visFin = Math.min(r.bottom, innerHeight);
    for (let i = 0; i < N; i++) {
      const st = document.createElement("img");
      st.src = estrellaSrc; st.alt = ""; st.className = "estrellita";
      const tam = Math.round(20 + Math.random() * 24);
      const x0 = r.left + scrollX + r.width * (.2 + Math.random() * .6) - tam / 2;
      const y0 = scrollY + vis + (visFin - vis) * (.3 + Math.random() * .4) - tam / 2;
      const ang = (i / N) * Math.PI * 2 + Math.random() * .4, dist = 90 + Math.random() * 120;
      Object.assign(st.style, { left: x0 + "px", top: y0 + "px", width: tam + "px", height: tam + "px" });
      document.body.appendChild(st);
      const dx = Math.round(Math.cos(ang) * dist), dy = Math.round(Math.sin(ang) * dist), rot = Math.round((Math.random() * 2 - 1) * 200);
      if (!st.animate) { st.remove(); continue; }
      const an = st.animate([
        { transform: "translate(0px,0px) scale(.2) rotate(0deg)", opacity: 0 },
        { transform: `translate(${Math.round(dx * .35)}px,${Math.round(dy * .35)}px) scale(1.15) rotate(${Math.round(rot * .3)}deg)`, opacity: 1, offset: .2 },
        { transform: `translate(${Math.round(dx * .85)}px,${Math.round(dy * .85 + 12)}px) scale(1) rotate(${Math.round(rot * .8)}deg)`, opacity: 1, offset: .7 },
        { transform: `translate(${dx}px,${dy + 40}px) scale(.6) rotate(${rot}deg)`, opacity: 0 }
      ], { duration: 1300 + Math.random() * 500, delay: Math.random() * 120, easing: "ease-out", fill: "forwards" });
      an.onfinish = () => st.remove();
      setTimeout(() => st.remove(), 2500);
    }
  }

  // Cani animado dentro de su caja (3 capas: caja, gatito, frente de la caja)
  const caniAnim = () => `<div class="cani-anim" role="img" aria-label="Cani, el gatito de Cani Shop, jugando en su caja">
      <img class="ca-caja" src="cani-caja.webp" alt=""><span class="ca-clip"><img class="ca-gato" src="cani-gato.webp" alt=""></span><img class="ca-frente" src="cani-frente.webp" alt=""></div>`;

  function inicio() {
    const bans = (T.banners || []).filter(b => b && b.imagen);
    const pers = PERS(), categs = CATEG().length ? CATEG() : CATS;
    const DEST = (Array.isArray(T.destacadas) && T.destacadas.filter(d => d && d.cat).length ? T.destacadas.filter(d => d && d.cat)
      : [{ titulo: "Novedades", cat: "__nuevos" }]).filter(d => d.cat !== "sanrio").slice(0, 3);
    // Beneficios: "Título | texto" (desde Mi tienda). Si no tienen ese formato, se usan los de siempre.
    const VAL_DEF = ["Productos kawaii | Papelería, regalos y cositas adorables", "Envíos a toda Bolivia | Desde Santa Cruz hasta tu departamento", "Punto de entrega | Consulta por nuestro punto de entrega en Santa Cruz"];
    const valGuardados = Array.isArray(T.valores) ? T.valores.filter(Boolean) : [];
    const VAL = (valGuardados.some(v => v.includes("|")) ? valGuardados : VAL_DEF).slice(0, 3).map(v => { const [t, ...d] = v.split("|"); return { t: t.trim(), d: d.join("|").trim() }; });
    const HIST = T.historia || {};
    const histImgs = (HIST.imagenes || []).filter(Boolean).length ? HIST.imagenes.filter(Boolean) : ["historia.webp"];
    const OPS = (T.opiniones || []).filter(o => o && o.texto);
    const ICON_VAL = [
      `<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/></svg>`,
      `<svg viewBox="0 0 24 24"><path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.7"/><circle cx="17" cy="17.5" r="1.7"/></svg>`,
      `<svg viewBox="0 0 24 24"><path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/></svg>`
    ];
    const ESTRELLAS = `<span class="op-estrellas">${Array(5).fill(`<svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.6 7.1.7-5.4 4.8 1.6 7L12 17.4 5.8 21.1l1.6-7L2 9.3l7.1-.7z"/></svg>`).join("")}</span>`;
    const listaDe = d => {
      const l = d.cat === "__nuevos" ? PRODS.filter(p => p.nuevo).concat(PRODS.filter(p => !p.nuevo)) : PRODS.filter(p => (p.categorias || []).includes(d.cat));
      return l.filter(hayStock).concat(l.filter(p => !hayStock(p))).slice(0, d.cat === "__nuevos" ? 2 : 8);
    };
    const destacada = d => {
      const l = listaDe(d); if (!l.length) return "";
      const href = d.cat === "__nuevos" ? "#/novedades" : `#/catalogo/${d.cat}`;
      return `<section class="seccion dest ${l.length <= 2 ? "dest-dos" : ""}"><div class="titulo"><h2>${esc(d.titulo || (CATS.find(c => c.id === d.cat) || {}).nombre || "Destacados")}</h2><a class="ver-todo" href="${href}">Ver todo</a></div>${grilla(l)}</section>`;
    };
    app.innerHTML = `
      ${bans.length ? `<section class="hero ${bans.every(b => b.imagenMovil) ? "movil-ok" : ""}"><div class="car-pista" id="car-pista">${bans.map(b => {
          const pic = `<picture>${b.imagenMovil ? `<source media="(max-width:820px)" srcset="${esc(b.imagenMovil)}">` : ""}<img src="${esc(b.imagen)}" alt=""></picture>`;
          return b.enlace
            ? `<a class="slide" href="${esc(b.enlace)}"${/^https?:/.test(b.enlace) ? ' target="_blank" rel="noopener"' : ""}>${pic}</a>`
            : `<div class="slide">${pic}</div>`; }).join("")}</div>
        ${bans.length > 1 ? `<div class="car-puntos" id="car-puntos">${bans.map((_, i) => `<button data-s="${i}" aria-label="Banner ${i + 1}" class="${i ? "" : "on"}"></button>`).join("")}</div>` : ""}
      </section>` : ""}

      ${pers.length ? `<section class="seccion pers-fila"><h2 class="fila-tit">Personajes</h2><div class="marcas-fila">${pers.map(c => `<a class="marca-item ${c.imagen ? "con-foto" : ""}" href="#/catalogo/${c.id}" title="${esc(c.nombre)}" aria-label="${esc(c.nombre)}"><div class="circ">${circ(c)}</div><span class="marca-nom">${esc(c.nombre)}</span></a>`).join("")}</div></section>` : ""}

      <h2 class="fila-tit">Categorías</h2>
      <section class="seccion cat-mosaico ${categs.length <= 6 || categs.length === 9 ? "c3" : "c4"}">${categs.map((c, i) => { const f = c.imagen || ((PRODS.find(p => (p.categorias || []).includes(c.id) && (p.imagenes || []).length) || {}).imagenes || [])[0];
        const n = categs.length, resto = n % 3, final = i >= n - resto;
        return `<a class="cat-tile ${i % 3 === 2 ? "grande" : ""} ${final && resto === 1 ? "grande sola" : ""} ${final && resto === 2 ? "par-final" : ""} ${n % 2 && i === n - 1 ? "impar-final" : ""}" href="#/catalogo/${c.id}">${f ? `<img loading="lazy" src="${esc(f)}" alt="">` : `<span class="cat-tile-ini">${esc(inicial(c.nombre))}</span>`}<span class="cat-tile-nom">${esc(c.nombre)}</span></a>`; }).join("")}</section>

      ${cinta()}

      <section class="valores2"><div class="valores2-in">${VAL.map((v, i) => `<div class="valor2">${ICON_VAL[i] || ICON_VAL[0]}<b>${esc(v.t)}</b>${v.d ? `<small>${esc(v.d)}</small>` : ""}</div>`).join("")}</div></section>

      ${destacada(DEST[0])}

      ${SC ? `<section class="seccion"><a class="sc-promo" href="#/scoops">
        <div><span class="sc-tag">${esc(SC.titulo || "Arma tu Scoop")}</span>
          <h2>Lucky Scoops</h2><p>${esc(SC.intro || "Elige tus colores y personajes favoritos y armamos tu scoop.")}</p>
          <span class="btn">Armar mi scoop</span></div>
        <div class="lucky-anim" aria-hidden="true">
          <img class="la-taza" src="taza-cani.webp" alt="">
          <img class="la-perla" src="perla.webp" alt="">
          <span class="la-brillo"><i></i><i></i><i></i><i></i><i></i><i></i></span>
          <img class="la-premio la-p1" src="llavero.webp" alt="">
          <img class="la-premio la-p2" src="libreta.webp" alt="">
        </div>
      </a></section>` : ""}

      ${DEST.slice(1).map(destacada).join("")}

      <section class="seccion historia">
        <div class="hist-imgs ${histImgs.length === 1 ? "una" : ""}">${histImgs.slice(0, 3).map(u => `<div><img src="${esc(u)}" alt=""></div>`).join("")}</div>
        <div class="hist-txt">
          <h2>${esc(HIST.titulo || `Hola, somos ${T.nombre}`)}</h2>
          <p>${esc(HIST.texto || resumenNosotros())}</p>
          <a class="btn btn-sec" href="#/nosotros">Conoce ${esc(T.nombre)}</a>
        </div>
      </section>

      ${OPS.length ? `<section class="seccion opiniones"><div class="titulo"><h2>Lo que dicen nuestros clientes</h2></div>
        <div class="op-fila">${OPS.map(o => `<figure class="op">${ESTRELLAS}<blockquote>${esc(o.texto)}</blockquote><figcaption>${esc(o.nombre || "")}</figcaption></figure>`).join("")}</div></section>` : ""}

      ${seccionTikTok()}`;
    if (bans.length > 1) carrusel(bans.length);
    if (ttUser) cargarTikTok();
    // Lucky Scoops: explotan estrellitas al llegar (solo celular)
    { const promo = document.querySelector(".sc-promo");
      if (promo && matchMedia("(max-width:820px)").matches) {
        let hecho = false;
        const mirar = () => {
          if (hecho || !promo.isConnected) return window.removeEventListener("scroll", mirar);
          const r = promo.getBoundingClientRect();
          if (r.top < innerHeight * .7 && r.bottom > innerHeight * .2) { hecho = true; window.removeEventListener("scroll", mirar); estrellitas(promo); }
        };
        window.addEventListener("scroll", mirar, { passive: true }); setTimeout(mirar, 400);
      } }
  }

  let carReloj;
  function carrusel(n) {
    const pista = $("#car-pista"), puntos = [...document.querySelectorAll("#car-puntos button")];
    let i = 0;
    const ir = k => { i = (k + n) % n; pista.scrollTo({ left: i * pista.clientWidth, behavior: "smooth" }); };
    const auto = () => { clearInterval(carReloj); carReloj = setInterval(() => ir(i + 1), 5000); };
    pista.addEventListener("scroll", () => {
      const k = Math.round(pista.scrollLeft / pista.clientWidth);
      if (k !== i) { i = k; }
      puntos.forEach((p, j) => p.classList.toggle("on", j === k));
    }, { passive: true });
    pista.addEventListener("pointerdown", auto);
    puntos.forEach(p => p.onclick = () => { ir(+p.dataset.s); auto(); });
    auto();
  }

  let ORDEN = "destacados", SOLO_STOCK = false;
  // Catálogo con filtros combinables: personajes (uno o varios) + categorías (una o varias)
  // Dentro de un grupo suma opciones (Sanrio o Snoopy); entre grupos se combinan (Sanrio y Peluches).
  function catalogo(cat, q, modo) {
    const PS = PERS(), CS = CATEG().length ? CATEG() : CATS.filter(c => !PS.some(p => p.id === c.id));
    const selP = new Set(), selC = new Set();
    if (cat) (PS.some(p => p.id === cat) ? selP : selC).add(cat);
    let base = PRODS;
    if (modo === "nuevos") base = PRODS.filter(p => p.nuevo).concat(PRODS.filter(p => !p.nuevo));
    if (q) { const t = q.toLowerCase(); base = base.filter(p => (p.nombre + " " + (p.descripcion || "") + " " + (p.variantes || []).map(v => v.nombre).join(" ")).toLowerCase().includes(t)); }
    const pasa = (p, sel) => !sel.size || (p.categorias || []).some(c => sel.has(c));
    const filtrar = () => {
      let l = base.filter(p => pasa(p, selP) && pasa(p, selC));
      if (SOLO_STOCK) l = l.filter(hayStock);
      if (ORDEN === "menor") l.sort((a, b) => a.precio - b.precio);
      else if (ORDEN === "mayor") l.sort((a, b) => b.precio - a.precio);
      else if (ORDEN === "az") l.sort((a, b) => sinEmoji(a.nombre).localeCompare(sinEmoji(b.nombre)));
      else l = l.filter(hayStock).concat(l.filter(p => !hayStock(p)));
      return l;
    };
    // cuántos productos quedarían al tocar cada opción (para no llevar a resultados vacíos)
    const cuantos = (id, grupo) => { const sp = new Set(selP), sc = new Set(selC); const g = grupo === "p" ? sp : sc; g.has(id) ? g.delete(id) : g.add(id);
      return base.filter(p => pasa(p, sp) && pasa(p, sc) && (!SOLO_STOCK || hayStock(p))).length; };
    const nombre = id => (CATS.find(c => c.id === id) || {}).nombre || id;
    const titulo = () => {
      if (q) return `Resultados para “${esc(q)}”`;
      const ps = [...selP].map(nombre), cs = [...selC].map(nombre);
      if (!ps.length && !cs.length) return modo === "nuevos" ? "Novedades" : "Todos los productos";
      return esc([cs.join(" y "), ps.length ? (cs.length ? "de " : "") + ps.join(" y ") : ""].filter(Boolean).join(" "));
    };
    const chip = (c, g) => { const on = (g === "p" ? selP : selC).has(c.id), n = on ? null : cuantos(c.id, g);
      return `<button type="button" class="chip ${on ? "activo" : ""}" data-f="${g}" data-id="${esc(c.id)}" ${n === 0 ? "disabled" : ""} aria-pressed="${on}">${esc(c.nombre)}${on ? ' <span class="chip-x" aria-hidden="true">×</span>' : ""}</button>`; };
    app.innerHTML = `<section class="seccion">
      <h1 class="cat-titulo" id="cat-titulo"></h1>
      <div id="cat-filtros"></div>
      <div class="orden-barra"><span id="cuenta"></span>
        <label class="solo-stock"><input type="checkbox" id="solo-stock" ${SOLO_STOCK ? "checked" : ""}> Solo disponibles</label>
        <select id="orden"><option value="destacados">Destacados</option><option value="menor">Precio: menor a mayor</option><option value="mayor">Precio: mayor a menor</option><option value="az">Nombre: A-Z</option></select></div>
      <div id="grilla-cat"></div></section>`;
    const pintar = () => {
      const l = filtrar(), hay = selP.size || selC.size;
      $("#cat-titulo").innerHTML = titulo();
      $("#cat-filtros").innerHTML = `
        ${PS.length ? `<div class="filtro-grupo"><span class="filtro-tit">Personaje</span><div class="filtros">${PS.map(c => chip(c, "p")).join("")}</div></div>` : ""}
        <div class="filtro-grupo"><span class="filtro-tit">Tipo de producto</span><div class="filtros">${CS.map(c => chip(c, "c")).join("")}</div></div>
        ${hay ? `<button type="button" class="filtro-limpiar" id="filtro-limpiar">Quitar filtros</button>` : ""}`;
      $("#cuenta").textContent = `${l.length} ${l.length === 1 ? "producto" : "productos"}`;
      $("#grilla-cat").innerHTML = l.length ? grilla(l) : `<p class="vacio">No hay productos con esa combinación. Prueba quitando un filtro.</p>`;
      document.querySelectorAll("#cat-filtros .chip.activo").forEach(ch => { const f = ch.parentElement; if (f.scrollWidth > f.clientWidth) f.scrollLeft = ch.offsetLeft - f.offsetLeft - 16; });
    };
    pintar();
    $("#cat-filtros").addEventListener("click", e => {
      if (e.target.closest("#filtro-limpiar")) { selP.clear(); selC.clear(); return pintar(); }
      const b = e.target.closest(".chip[data-f]"); if (!b) return;
      const g = b.dataset.f === "p" ? selP : selC, id = b.dataset.id;
      g.has(id) ? g.delete(id) : g.add(id); pintar();
    });
    $("#orden").value = ORDEN;
    $("#orden").onchange = e => { ORDEN = e.target.value; pintar(); };
    $("#solo-stock").onchange = e => { SOLO_STOCK = e.target.checked; pintar(); };
  }

  // Página de producto estilo Starface (opción 2: blanco con detalles rosa)
  function producto(id) {
    const p = PRODS.find(x => x.id === id);
    if (!p) return catalogo();
    let cant = 1, vari = tieneVar(p) ? (p.variantes.find(v => disp(v.stock)) || {}).nombre : null, abierto = false;
    const base = (p.imagenes && p.imagenes.length ? p.imagenes : [foto(p)]).slice();
    (p.variantes || []).forEach(v => { if (v.imagen && !base.includes(v.imagen)) base.push(v.imagen); });
    const fotos = () => { const v = (p.variantes || []).find(x => x.nombre === vari); return v && v.imagen ? [v.imagen, ...base.filter(u => u !== v.imagen)] : base; };
    const lineas = sinEmoji(p.descripcion || "").split("\n").map(l => l.trim()).filter(Boolean);
    const frase = lineas[0] || "", resto = lineas.slice(1);
    const per = personajeDe(p);
    app.innerHTML = `<section class="pdx">
      <div class="pdx-fotos" id="pdx-fotos"></div>
      <aside class="pdx-pan" id="pdx-pan"></aside>
    </section>`;
    const pintarFotos = () => {
      const f = fotos();
      $("#pdx-fotos").innerHTML = `<div class="pdx-pista" id="pdx-pista">${f.map((u, k) => `<div class="pdx-ph"><img src="${esc(u)}" alt="${k ? "" : esc(sinEmoji(p.nombre))}" ${k > 1 ? 'loading="lazy"' : ""}></div>`).join("")}</div>
        ${f.length > 1 ? `<div class="pdx-puntos">${f.map((_, k) => `<i class="${k ? "" : "on"}"></i>`).join("")}</div>` : ""}`;
      const pista = $("#pdx-pista");
      pista.onscroll = () => { const k = Math.round(pista.scrollLeft / pista.clientWidth); document.querySelectorAll(".pdx-puntos i").forEach((d, n) => d.classList.toggle("on", n === k)); };
    };
    const pintarPan = () => {
      const dispo = tieneVar(p) ? !!vari : hayStock(p);
      const max = maxDe(p, vari); if (cant > max) cant = Math.max(1, max);
      $("#pdx-pan").innerHTML = `
        <a class="pdx-volver" href="#/catalogo">← volver</a>
        ${per ? `<a class="pdx-per" href="#/catalogo/${per.id}">${esc(per.nombre)}</a>` : ""}
        <h1 class="pdx-tit">${esc(sinEmoji(p.nombre))}</h1>
        ${frase ? `<p class="pdx-frase">${esc(frase)}</p>` : ""}
        ${resto.length ? `<button type="button" class="pdx-mas" id="pdx-mas" aria-expanded="${abierto}">${abierto ? "ocultar detalles" : "ver detalles"}</button>
          <div class="pdx-det" ${abierto ? "" : "hidden"}>${resto.map(l => `<p>${esc(l)}</p>`).join("")}</div>` : ""}
        <div class="pdx-precio">${bs(p.precio)}</div>
        ${tieneVar(p) ? `<div class="pdx-etq">modelo: <b>${esc(vari || "elige uno")}</b></div>
          <div class="pdx-mods">${p.variantes.map(v => `<button type="button" class="pdx-mod ${v.nombre === vari ? "on" : ""}" data-var="${esc(v.nombre)}" ${disp(v.stock) ? "" : "disabled"}>${v.imagen ? `<img src="${esc(v.imagen)}" alt="">` : ""}${esc(v.nombre)}</button>`).join("")}</div>` : ""}
        ${dispo ? `<div class="pdx-fila">
            <div class="pdx-cant"><button type="button" data-c="-1" aria-label="Menos">−</button><span>${cant}</span><button type="button" data-c="1" aria-label="Más">+</button></div>
            <button type="button" class="pdx-btn" id="agregar">agregar al carrito</button></div>
          ${max <= 3 ? `<p class="pdx-pocos">${max === 1 ? "¡queda solo 1!" : `¡quedan solo ${max}!`}</p>` : ""}`
          : `<button type="button" class="pdx-btn" disabled>agotado</button>`}
        <small class="pdx-nota">envíos a toda bolivia · pago con QR</small>`;
    };
    pintarFotos(); pintarPan(); window.scrollTo(0, 0);
    app.onclick = e => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.id === "pdx-mas") { abierto = !abierto; pintarPan(); }
      else if (b.dataset.var) { vari = b.dataset.var; pintarPan(); pintarFotos(); }
      else if (b.dataset.c) { cant = Math.min(maxDe(p, vari), Math.max(1, cant + +b.dataset.c)); pintarPan(); }
      else if (b.id === "agregar") agregar(p.id, vari, cant);
    };
  }

  // ---------- Arma tu Scoop ----------
  const SC = T.scoops && T.scoops.activo ? T.scoops : null;
  // Mostrar "Arma tu Scoop" en el menú (si el index.html viejo no tiene el enlace, lo agrega)
  if (SC) {
    let m = $("#menu-scoops");
    if (!m) { m = document.createElement("a"); m.id = "menu-scoops"; m.href = "#/scoops"; m.textContent = "Arma tu Scoop"; const cat = document.querySelector('.menu a[href="#/catalogo"]'); cat ? cat.after(m) : $("#menu").appendChild(m); }
    m.hidden = false;
  }
  // ---------- Personajes / categorías ----------
  const tipoDe = c => c.tipo || (c.marca ? "personaje" : "categoria");
  const PERS = () => CATS.filter(c => tipoDe(c) === "personaje");
  const CATEG = () => CATS.filter(c => tipoDe(c) === "categoria");
  const personajeDe = p => {
    const ps = (p.categorias || []).map(id => CATS.find(c => c.id === id)).filter(c => c && tipoDe(c) === "personaje");
    return ps.find(c => c.id !== "sanrio") || ps[0];
  };

  // ---------- Tipografía ----------
  const FUENTES = {
    clasica:  { t: "'Fredoka'", x: "'Comfortaa'", url: "family=Fredoka:wght@400;500;600;700&family=Comfortaa:wght@400;500;600;700" },
    burbuja:  { t: "'Baloo 2'", x: "'Quicksand'", url: "family=Baloo+2:wght@500;600;700;800&family=Quicksand:wght@400;500;600;700" },
    japonesa: { t: "'Mochiy Pop One'", x: "'M PLUS Rounded 1c'", url: "family=Mochiy+Pop+One&family=M+PLUS+Rounded+1c:wght@400;500;700;800" },
    dulce:    { t: "'DynaPuff'", x: "'Nunito'", url: "family=DynaPuff:wght@400;500;600;700&family=Nunito:wght@400;600;700;800" },
    chicle:   { t: "'Chewy'", x: "'Quicksand'", url: "family=Chewy&family=Quicksand:wght@400;500;600;700" },
    retro:    { t: "'Grandstander'", x: "'Nunito'", url: "family=Grandstander:wght@500;600;700;800&family=Nunito:wght@400;600;700;800" },
    moderna:  { t: "'Poppins'", x: "'Poppins'", url: "family=Poppins:wght@400;500;600;700" }
  };
  const FU = FUENTES[T.fuente] || FUENTES.clasica;
  if (T.fuente && FUENTES[T.fuente] && T.fuente !== "clasica") {
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = `https://fonts.googleapis.com/css2?${FU.url}&display=swap`; document.head.appendChild(l);
  }
  document.documentElement.style.setProperty("--f-tit", `${FU.t}, Fredoka, Nunito, sans-serif`);
  document.documentElement.style.setProperty("--f-txt", `${FU.x}, Nunito, system-ui, sans-serif`);
  if (T.fuente === "moderna" || T.fuente === "japonesa") document.documentElement.classList.add("fuente-compacta");

  // ---------- Cursor de temporada ----------
  const CURSORES = {
    murcielago: `<svg xmlns='http://www.w3.org/2000/svg' width='34' height='26' viewBox='0 0 34 26'><path d='M17 7c1.3-3 2.4-4 3-6 .6 2 0 3.2.6 4.4 2.5-1.6 7-2 12.4-.4-3 1.5-4 4-3.6 7-2-1.2-4.4-1.2-6 .6-1.2-1.4-3-1.4-4 0-.8 2-1.4 4-2.4 6-1-2-1.6-4-2.4-6-1-1.4-2.8-1.4-4 0-1.6-1.8-4-1.8-6-.6.4-3-.6-5.5-3.6-7C6 3 10.5 3.4 13 5c.6-1.2 0-2.4.6-4.4.6 2 1.7 3 3 6z' fill='%23783746' stroke='%23fff' stroke-width='1.2'/><circle cx='15.4' cy='9' r='.9' fill='%23ff8fbf'/><circle cx='18.6' cy='9' r='.9' fill='%23ff8fbf'/></svg>`,
    fantasma: `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='32' viewBox='0 0 28 32'><path d='M14 2C7.4 2 3 7 3 13.5V29l3.6-2.6L10 29l4-2.6L18 29l3.4-2.6L25 29V13.5C25 7 20.6 2 14 2z' fill='%23fff' stroke='%23fd95c8' stroke-width='2'/><circle cx='10.5' cy='13' r='1.8' fill='%23783746'/><circle cx='17.5' cy='13' r='1.8' fill='%23783746'/><ellipse cx='8' cy='17' rx='2' ry='1.2' fill='%23ffb3cf'/><ellipse cx='20' cy='17' rx='2' ry='1.2' fill='%23ffb3cf'/></svg>`,
    corazon:  `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='26' viewBox='0 0 28 26'><path d='M14 24S2 16.5 2 8.5A6 6 0 0 1 14 6a6 6 0 0 1 12 2.5C26 16.5 14 24 14 24z' fill='%23f78db0' stroke='%23fff' stroke-width='2'/></svg>`,
    patita:   `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'><g fill='%23fd95c8' stroke='%23fff' stroke-width='1.4'><ellipse cx='14' cy='19' rx='7' ry='6'/><circle cx='6' cy='11' r='3'/><circle cx='11' cy='6' r='3'/><circle cx='17' cy='6' r='3'/><circle cx='22' cy='11' r='3'/></g></svg>`,
    estrella: `<svg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'><path d='M14 2l3.6 7.4 8.1 1.2-5.9 5.7 1.4 8.1L14 20.6l-7.2 3.8 1.4-8.1-5.9-5.7 8.1-1.2z' fill='%23ffd84d' stroke='%23fd95c8' stroke-width='1.6' stroke-linejoin='round'/></svg>`
  };
  if (CURSORES[T.cursor] && matchMedia("(pointer:fine)").matches) {
    const u = `url("data:image/svg+xml,${CURSORES[T.cursor].replace(/"/g, "'").replace(/#/g, "%23").replace(/\n/g, "")}") 4 4`;
    const st = document.createElement("style");
    st.textContent = `html,body,*{cursor:${u}, auto} a,button,label,select,.tarjeta,.sc-op-in,.chip,.sc-chip{cursor:${u}, pointer}`;
    document.head.appendChild(st);
  }

  // ---------- Menú "Tienda" con personajes y categorías ----------
  (() => {
    const nav = $("#menu"), cat = nav && nav.querySelector('a[href="#/catalogo"]');
    if (!cat || nav.querySelector(".menu-drop")) return;
    const pers = PERS(), categ = CATEG();
    const d = document.createElement("div"); d.className = "menu-drop";
    d.innerHTML = `<button type="button" class="menu-tienda" aria-expanded="false">Tienda <span>▾</span></button>
      <div class="mega">
        ${pers.length ? `<div class="mega-col"><h4>Por personaje</h4>${pers.map(c => `<a href="#/catalogo/${c.id}">${c.imagen ? `<i><img src="${esc(c.imagen)}" alt=""></i>` : ""}${esc(c.nombre)}</a>`).join("")}</div>` : ""}
        <div class="mega-col"><h4>Por categoría</h4>${(categ.length ? categ : CATS).map(c => `<a href="#/catalogo/${c.id}">${c.imagen ? `<i><img src="${esc(c.imagen)}" alt=""></i>` : ""}${esc(c.nombre)}</a>`).join("")}
          <a href="#/catalogo" class="mega-todo">Ver todo →</a></div>
        ${SC ? `<a class="mega-promo" href="#/scoops">${(SC.opciones || []).find(o => o.imagen) ? `<img src="${esc(SC.opciones.find(o => o.imagen).imagen)}" alt="">` : ""}<span>Arma tu Scoop</span></a>` : ""}
      </div>`;
    cat.replaceWith(d);
    const b = d.querySelector(".menu-tienda");
    b.onclick = e => { e.stopPropagation(); const a = d.classList.toggle("abierto"); b.setAttribute("aria-expanded", a); };
    d.querySelector(".mega").addEventListener("click", e => { if (e.target.closest("a")) d.classList.remove("abierto"); });
    document.addEventListener("click", e => { if (!d.contains(e.target)) d.classList.remove("abierto"); });
  })();

  // ---------- Cintas de texto en movimiento ----------
  const CINTA = (Array.isArray(T.cinta) && T.cinta.filter(Boolean).length ? T.cinta : String(T.franja || "").split("·")).map(x => x.trim()).filter(Boolean);
  const cinta = (clase = "") => CINTA.length ? `<div class="cinta ${clase}" aria-label="${esc(CINTA.join(" · "))}"><div class="cinta-pista">${
    Array(2).fill(`<span class="cinta-grupo">${Array(3).fill(CINTA.map(x => `<span>${esc(x)}</span><i>✦</i>`).join("")).join("")}</span>`).join("")}</div></div>` : "";

  // ---------- TikTok ----------
  const ttUser = (T.tiktok || "").replace(/\/+$/, "").split("/").pop().replace(/^@/, "");
  const ttVideos = (T.tiktokVideos || []).map(u => (String(u).match(/video\/(\d+)/) || String(u).match(/^(\d{10,})$/) || [])[1]).filter(Boolean).slice(0, 6);
  const seccionTikTok = () => !ttUser ? "" : `<section class="seccion tiktok">
      <div class="tk-cab"><h2>¡Míranos en TikTok! 🎥</h2><p>Unboxings, scoops y novedades todas las semanas</p></div>
      ${ttVideos.length ? `<div class="tk-videos">${ttVideos.map(id => `<div class="tk-video"><iframe src="https://www.tiktok.com/embed/v2/${id}" loading="lazy" allow="encrypted-media; fullscreen" allowfullscreen title="Video de TikTok"></iframe></div>`).join("")}</div>`
        : `<div class="tk-perfil"><blockquote class="tiktok-embed" cite="https://www.tiktok.com/@${esc(ttUser)}" data-unique-id="${esc(ttUser)}" data-embed-type="creator" style="max-width:780px;min-width:288px;margin:0 auto"><section><a target="_blank" href="https://www.tiktok.com/@${esc(ttUser)}">@${esc(ttUser)}</a></section></blockquote></div>`}
      <div style="text-align:center;margin-top:20px"><a class="btn btn-tk" href="https://www.tiktok.com/@${esc(ttUser)}" target="_blank" rel="noopener">Seguir a @${esc(ttUser)} en TikTok</a></div>
    </section>`;
  { const bt = $("#btn-tiktok"); if (bt && ttUser) { bt.href = `https://www.tiktok.com/@${ttUser}`; bt.hidden = false; }
    const bi = $("#btn-insta"); if (bi && T.instagram) { bi.href = T.instagram; bi.hidden = false; }
    const ps = document.querySelector(".pie-scoops"); if (ps && SC) ps.hidden = false; }
  const cargarTikTok = () => { if (!ttVideos.length && ttUser && !document.querySelector('script[src*="tiktok.com/embed.js"]')) { const s = document.createElement("script"); s.async = true; s.src = "https://www.tiktok.com/embed.js"; document.body.appendChild(s); } else if (window.tiktokEmbed && window.tiktokEmbed.lib) { try { window.tiktokEmbed.lib.render(document.querySelectorAll(".tiktok-embed")); } catch (e) {} } };

  // ---------- Quiz "¿Qué personaje eres?" ----------
  const QUIZ = {
    preguntas: [
      { p: "¿Cuál es tu plan ideal de fin de semana?", r: [["Pijamada con mis amigas 💕", "my-melody"], ["Algo misterioso y un poco rebelde 🖤", "kuromi"], ["Dormir hasta tarde y comer postrecitos 🍮", "pompompurin"], ["Salir a pasear y jugar al aire libre ⚽", "pochacco"], ["Un cafecito tranquilo mirando las nubes ☁️", "cinnamoroll"], ["Organizar una fiesta de té perfecta 🎀", "hello-kitty"]] },
      { p: "Elige un snack:", r: [["Pastel de fresa 🍓", "my-melody"], ["Chocolate amargo 🍫", "kuromi"], ["Flan con caramelo 🍮", "pompompurin"], ["Helado de banana 🍌", "pochacco"], ["Rollo de canela 🥐", "cinnamoroll"], ["Galletas de mantequilla 🍪", "hello-kitty"]] },
      { p: "¿Qué no puede faltar en tu mochila?", r: [["Un labial rosadito 💄", "my-melody"], ["Stickers de calaveritas 💀", "kuromi"], ["Una almohadita para siestas 😴", "pompompurin"], ["Mis audífonos para bailar 🎧", "pochacco"], ["Una libreta para soñar ✨", "cinnamoroll"], ["Mi agenda súper organizada 📒", "hello-kitty"]] }
    ],
    res: {
      "my-melody": ["My Melody", "🐰", "Dulce, amable y siempre con una sonrisa. Tus amigas saben que pueden contar contigo para todo. 💗"],
      "kuromi": ["Kuromi", "🖤", "Un poquito traviesa, súper auténtica y con un corazón enorme escondido bajo tu estilo único. 💜"],
      "pompompurin": ["Pompompurin", "🍮", "Relajada, tierna y amante de las cosas simples (y de los snacks). ¡La mejor compañía! 💛"],
      "pochacco": ["Pochacco", "⚽", "Llena de energía, curiosa y siempre lista para una aventura nueva. 🖤🤍"],
      "cinnamoroll": ["Cinnamoroll", "☁️", "Soñadora, tranquila y un poquito tímida, pero todos aman tu buena vibra. 💙"],
      "hello-kitty": ["Hello Kitty", "🎀", "Clásica, cariñosa y la amiga que siempre recuerda los cumpleaños. ¡Un ícono! ❤️"]
    }
  };
  function abrirQuiz(forzar) {
    if (!T.quiz || T.quiz.activo === false) { if (!forzar) return; }
    let paso = 0; const votos = {};
    const cap = document.createElement("div"); cap.className = "quiz-velo";
    const cerrar = () => { cap.classList.remove("ver"); setTimeout(() => cap.remove(), 250); try { localStorage.setItem("quiz-visto", "1"); } catch (e) {} };
    const pintar = () => {
      const caja = cap.querySelector(".quiz-caja");
      if (paso < 0) {
        caja.innerHTML = `<button class="quiz-x" aria-label="Cerrar">✕</button>
          <div class="quiz-emo">${T.logo ? `<img src="${esc(T.logo)}" alt="" style="height:70px;margin:0 auto">` : ""}</div><h2>${esc((T.quiz && T.quiz.titulo) || "¿Qué personaje kawaii eres?")}</h2>
          <p>Responde 3 preguntitas y descubre tu personaje… ¡y sus productos! ✨</p>
          <button class="btn quiz-go">¡Vamos! 👀</button><button class="quiz-no">Ahora no</button>`;
      } else if (paso < QUIZ.preguntas.length) {
        const q = QUIZ.preguntas[paso];
        caja.innerHTML = `<button class="quiz-x" aria-label="Cerrar">✕</button>
          <div class="quiz-prog">${QUIZ.preguntas.map((_, i) => `<i class="${i <= paso ? "on" : ""}"></i>`).join("")}</div>
          <h2>${esc(q.p)}</h2><div class="quiz-ops">${q.r.map(([t, k]) => `<button data-k="${k}">${esc(t)}</button>`).join("")}</div>`;
      } else {
        const gana = Object.entries(votos).sort((a, b) => b[1] - a[1])[0][0];
        const [nom, emo, txt] = QUIZ.res[gana], c = CATS.find(x => x.id === gana) || CATS.find(x => x.id === "sanrio");
        caja.innerHTML = `<button class="quiz-x" aria-label="Cerrar">✕</button>
          <div class="quiz-res">${c && c.imagen ? `<img src="${esc(c.imagen)}" alt="">` : `<span class="circ-letra">${esc(inicial(nom))}</span>`}</div>
          <p class="quiz-eres">Tu personaje es…</p><h2>¡${esc(nom)}! ${emo}</h2><p>${esc(txt)}</p>
          ${c ? `<a class="btn" href="#/catalogo/${c.id}" data-cerrar>Ver productos de ${esc(nom)}</a>` : `<a class="btn" href="#/catalogo" data-cerrar>Ver la tienda</a>`}
          <button class="quiz-no" data-otra>Hacerlo otra vez</button>`;
      }
    };
    cap.innerHTML = `<div class="quiz-caja" role="dialog" aria-modal="true"></div>`;
    document.body.appendChild(cap); paso = -1; pintar(); requestAnimationFrame(() => cap.classList.add("ver"));
    cap.addEventListener("click", e => {
      const b = e.target.closest("button,a");
      if (e.target === cap || (b && (b.classList.contains("quiz-x") || (b.classList.contains("quiz-no") && !b.dataset.otra)))) return cerrar();
      if (!b) return;
      if (b.classList.contains("quiz-go")) { paso = 0; pintar(); }
      else if (b.dataset.k) { votos[b.dataset.k] = (votos[b.dataset.k] || 0) + 1 + (paso === 0 ? 0.1 : 0); paso++; pintar(); }
      else if (b.dataset.otra) { paso = 0; for (const k in votos) delete votos[k]; pintar(); }
      else if (b.dataset.cerrar !== undefined) cerrar();
    });
  }
  window.abrirQuiz = abrirQuiz;
  try { if (T.quiz && T.quiz.activo && !localStorage.getItem("quiz-visto")) setTimeout(() => { if (!document.querySelector(".quiz-velo") && !location.hash.includes("scoops")) abrirQuiz(); }, 2500); } catch (e) {}

  const COLOR_HEX = { rosa: "#f7a1c4", lila: "#c9a7f0", celeste: "#9fd4f5", verde: "#9fe0b4", "verde menta": "#a8ecd0", amarillo: "#ffe27a",
    blanco: "#ffffff", negro: "#2b2b2b", naranja: "#ffb27a", rojo: "#f26b6b", morado: "#a77bdb", azul: "#7fa8f0",
    pastel: "linear-gradient(135deg,#f7a1c4,#c9a7f0,#9fd4f5)", multicolor: "linear-gradient(135deg,#f26b6b,#ffe27a,#9fe0b4,#9fd4f5,#c9a7f0)" };
  const hexDe = c => COLOR_HEX[(c || "").toLowerCase().trim()] || "#f9dbe4";
  // Fuentes "escritas a mano" para la carta impresa
  const FUENTES_CARTA = { "Caveat": 1.25, "Patrick Hand": 1, "Gochi Hand": 1, "Indie Flower": 1, "Mali": .88, "Dancing Script": 1.22 };
  function cargarFuenteCarta(f) {
    if (document.querySelector(`link[data-carta="${f}"]`)) return;
    const l = document.createElement("link"); l.rel = "stylesheet"; l.dataset.carta = f;
    l.href = `https://fonts.googleapis.com/css2?family=${f.replace(/ /g, "+")}${/Caveat|Mali|Dancing/.test(f) ? ":wght@400;600" : ""}&display=swap`;
    document.head.appendChild(l);
  }
  const cartaHTML = (txt, f) => `<div class="carta-prev" style="--fc:'${f}';--fz:${FUENTES_CARTA[f] || 1}"><img src="carta-marco.webp" alt=""><div class="carta-txt">${esc(txt) || '<span class="carta-ph">Aquí aparecerá tu mensaje…</span>'}</div></div>`;

  // Comunicado de entregas (editable en Mi tienda → Entregas)
  const AVISO_ENT_DEF = "La entrega es de 2 a 3 días una vez confirmado el pago de tu pedido.\nLos miércoles y sábados realizamos envíos a otros departamentos y provincias.";
  const avisoEntrega = () => { const t = String(T.avisoEntrega ?? AVISO_ENT_DEF).trim(); return t ? `<div class="aviso-ent" role="note"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.7"/><circle cx="17" cy="17.5" r="1.7"/></svg><div><b>Importante</b>${t.split("\n").filter(x => x.trim()).map(x => `<p>${esc(x)}</p>`).join("")}</div></div>` : ""; };

  function scoops() {
    if (!SC) { app.innerHTML = `<section class="seccion"><h2>Scoops</h2><p class="texto">Muy pronto 💕</p></section>`; return; }
    const ops = (SC.opciones || []).filter(o => o.nombre && +o.precio > 0);
    const CAJAS = (Array.isArray(SC.cajas) && SC.cajas.filter(c => c && c.nombre).length ? SC.cajas.filter(c => c && c.nombre)
      : [{ nombre: "Caja blanca", precio: 0, detalle: "Sin costo adicional", imagen: "" }, { nombre: "Caja especial", precio: 5, detalle: "", imagen: "" }]);
    const st = { op: null, cant: 1, colores: [], personajes: [], video: false, archivo: null, caja: 0, carta: false };
    const minC = +SC.minColores || 2, minP = +SC.minPersonajes || 2, pv = +SC.precioVideo || 0;
    const pc = SC.precioCarta === undefined || SC.precioCarta === "" ? 4 : +SC.precioCarta || 0, cartaOn = SC.carta !== false;
    const fuenteCarta = FUENTES_CARTA[SC.fuenteCarta] ? SC.fuenteCarta : "Caveat";
    if (cartaOn) cargarFuenteCarta(fuenteCarta);
    const ENT = (T.entregas || []).filter(Boolean);
    app.innerHTML = `<div class="sc-wrap">
      <section class="sc-hero">
        <h1>${esc(SC.titulo || "Arma tu Scoop")} <span>🍬</span></h1>
        <p>${esc(SC.intro || "Elige tu scoop, tus colores y personajes favoritos, ¡y nosotras lo armamos para ti!")}</p>
      </section>
      <form id="sc-form" class="sc-form" novalidate>
        <section class="sc-paso"><div class="sc-num">1</div><div class="sc-cont">
          <h2>Elige tu scoop</h2>
          <div class="sc-ops">${ops.map((o, i) => `<label class="sc-op">
            <input type="radio" name="op" value="${i}">
            <span class="sc-op-in">${o.imagen ? `<img src="${esc(o.imagen)}" alt="">` : `<span class="sc-op-emoji circ-letra">${esc(inicial(o.nombre))}</span>`}
              <b>${esc(o.nombre)}</b><em>${bs(+o.precio)}</em>${o.detalle ? `<small>${esc(o.detalle)}</small>` : ""}</span></label>`).join("")}</div>
          <div id="sc-contenido"></div>
        </div></section>

        <section class="sc-paso"><div class="sc-num">2</div><div class="sc-cont">
          <h2>🎨 Colores de preferencia <small>(elige mínimo ${minC})</small></h2>
          <div class="sc-chips" data-grupo="colores">${(SC.colores || []).map(c => `<button type="button" class="sc-chip" data-v="${esc(c)}"><i style="background:${hexDe(c)}"></i>${esc(c)}</button>`).join("")}</div>
        </div></section>

        <section class="sc-paso"><div class="sc-num">3</div><div class="sc-cont">
          <h2>✨ Personajes de preferencia <small>(elige mínimo ${minP})</small></h2>
          <div class="sc-chips" data-grupo="personajes">${(SC.personajes || []).map(c => `<button type="button" class="sc-chip" data-v="${esc(c)}">${esc(c)}</button>`).join("")}</div>
        </div></section>

        <section class="sc-paso"><div class="sc-num">4</div><div class="sc-cont">
          <h2>Escoge tu caja</h2>
          <div class="sc-cajas">${CAJAS.map((c, i) => `<label class="sc-caja">
            <input type="radio" name="caja" value="${i}" ${i === 0 ? "checked" : ""}>
            <span class="sc-caja-in">${c.imagen ? `<img src="${esc(c.imagen)}" alt="">` : `<span class="sc-caja-ph"><svg viewBox="0 0 48 48"><path d="M7 20h34v22H7z"/><path d="M5 13h38v7H5z"/><path d="M24 13v29"/></svg></span>`}
              <b>${esc(c.nombre)}</b><em>${+c.precio > 0 ? `+${bs(+c.precio)}` : "Sin costo adicional"}</em>${c.detalle && +c.precio > 0 ? `<small>${esc(c.detalle)}</small>` : ""}</span></label>`).join("")}</div>
        </div></section>

        <section class="sc-paso"><div class="sc-num">5</div><div class="sc-cont">
          <h2>🎥 Video de tu Scoop</h2>
          ${pv ? `<label class="sc-video"><input type="checkbox" id="sc-video"><span><b>¡Sí, quiero el video! +${bs(pv)}</b><small>Grabamos cómo armamos tu scoop y te etiquetamos en TikTok</small></span></label>` : ""}
          <div class="form"><input name="tiktok" placeholder="Tu usuario de TikTok (para etiquetarte) — ej: @tuusuario"></div>
        </div></section>

        ${cartaOn ? `<section class="sc-paso"><div class="sc-num">6</div><div class="sc-cont">
          <h2>💌 Carta personalizada</h2>
          <label class="sc-video"><input type="checkbox" id="sc-carta"><span><b>¡Sí, quiero una carta! ${pc ? `+${bs(pc)}` : "Sin costo"}</b><small>Escribe tu mensaje y lo <b>imprimimos</b> en esta cartita para ponerlo dentro de tu Scoop</small></span></label>
          <div class="carta-box" id="carta-box" hidden>
            <div id="carta-vista">${cartaHTML("", fuenteCarta)}</div>
            <div class="form"><textarea name="carta" id="carta-txt" rows="4" maxlength="280" placeholder="Ej: Para Sofi: ¡Feliz cumple! Espero que te encante. Con cariño, Laura"></textarea></div>
            <p class="carta-nota"><span id="carta-cuenta">0</span>/280 · Así se verá tu carta <b>impresa</b>. Revisa bien lo que escribes: la imprimimos tal cual.</p>
          </div>
        </div></section>` : ""}

        <section class="sc-paso"><div class="sc-num">${cartaOn ? 7 : 6}</div><div class="sc-cont">
          <h2>📝 Tus datos</h2>
          <div class="form sc-datos">
            <input name="nombre" placeholder="Tu nombre" required>
            <input name="telefono" type="tel" inputmode="tel" placeholder="Tu WhatsApp (ej: 71234567)" required>
            ${ENT.length ? `<select name="entrega" required><option value="" disabled selected>¿Cómo quieres recibirlo?</option>${ENT.map(x => `<option>${esc(x)}</option>`).join("")}</select>` : ""}
            ${envioHTML()}
            <input name="ciudad" placeholder="Ciudad" required>
            <input name="direccion" placeholder="Dirección de entrega" data-req="1" required>
          </div>
        </div></section>

        <section class="sc-paso"><div class="sc-num">${cartaOn ? 8 : 7}</div><div class="sc-cont">
          <h2>💳 Pago por QR</h2>
          <div class="sc-pago">
            <div>
              <div class="sc-total"><span>Total a pagar</span><b id="sc-total">—</b></div>
              <p class="nota">Cuando envíes tu pedido se abre WhatsApp: pídenos ahí tu <b>QR de pago</b> y te lo mandamos al toque. Tu Scoop se arma una vez confirmado el pago.</p>
            </div>
          </div>
        </div></section>

        ${avisoEntrega()}
        <p class="sc-aviso">${esc(SC.nota || "Haremos todo lo posible para que tu Scoop incluya los colores y personajes que elegiste, siempre sujeto a disponibilidad. 💖")}</p>
        <div class="sc-enviar"><div><small>Total</small><b id="sc-total2">—</b></div><button class="btn btn-wa" type="submit" id="sc-btn">Enviar mi pedido 💖</button></div>
      </form></div>`;

    const F = $("#sc-form");
    const total = () => st.op === null ? 0 : (+ops[st.op].precio) + (st.video ? pv : 0) + (+(CAJAS[st.caja] || {}).precio || 0) + (st.carta ? pc : 0);
    const pintarTotal = () => { const t = st.op === null ? "—" : bs(total()); $("#sc-total").textContent = $("#sc-total2").textContent = t; };
    F.addEventListener("input", e => {
      if (e.target.id !== "carta-txt") return;
      const t = e.target.value;
      $("#carta-cuenta").textContent = t.length;
      $("#carta-vista .carta-txt").innerHTML = esc(t) || '<span class="carta-ph">Aquí aparecerá tu mensaje…</span>';
      ajustarCarta();
    });
    const ajustarCarta = () => { const el = $("#carta-vista .carta-txt"); if (!el) return; el.style.setProperty("--k", 1); let k = 1; while (el.scrollHeight > el.clientHeight + 1 && k > .5) { k -= .05; el.style.setProperty("--k", k); } };
    F.addEventListener("change", e => {
      if (e.target.name === "op") {
        st.op = +e.target.value;
        const o = ops[st.op];
        $("#sc-contenido").innerHTML = o.contenido ? `<div class="sc-incluye"><b>Incluye:</b><ul>${o.contenido.split("\n").filter(Boolean).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : "";
      }
      if (e.target.name === "caja") st.caja = +e.target.value;
      if (e.target.id === "sc-video") st.video = e.target.checked;
      if (e.target.id === "sc-carta") { st.carta = e.target.checked; $("#carta-box").hidden = !st.carta; if (st.carta) setTimeout(() => $("#carta-txt").focus(), 50); }
      if (e.target.name === "entrega") ajustarEntrega(F);
      pintarTotal();
    });
    F.addEventListener("click", e => {
      const b = e.target.closest(".sc-chip"); if (!b) return;
      const arr = st[b.parentElement.dataset.grupo], v = b.dataset.v, i = arr.indexOf(v);
      i >= 0 ? arr.splice(i, 1) : arr.push(v); b.classList.toggle("on", i < 0);
    });
    const ir = sel => F.querySelector(sel).scrollIntoView({ behavior: "smooth", block: "center" });
    F.addEventListener("submit", async e => {
      e.preventDefault();
      if (st.op === null) { toast("Elige tu scoop 🍬"); return ir(".sc-ops"); }
      if (st.colores.length < minC) { toast(`Elige mínimo ${minC} colores 🎨`); return ir("[data-grupo=colores]"); }
      if (st.personajes.length < minP) { toast(`Elige mínimo ${minP} personajes ✨`); return ir("[data-grupo=personajes]"); }
      if (st.carta && !($("#carta-txt").value || "").trim()) { toast("Escribe el mensaje de tu carta 💌"); return ir("#carta-txt"); }
      if (!F.reportValidity()) return;
      const f = new FormData(F), btn = $("#sc-btn"); btn.disabled = true; btn.textContent = "Enviando…";
      const ventana = window.open("", "_blank");
      const base = SB.url ? SB.url.replace(/\/$/, "") : "", H = { apikey: SB.key, Authorization: `Bearer ${SB.key}` };
      let comp = null, numero = null; const envio = datosEnvio(f);
      try {
        if (base) {
          const r = await fetch(`${base}/rest/v1/rpc/crear_pedido`, { method: "POST", headers: { ...H, "Content-Type": "application/json" },
            body: JSON.stringify({ p: { cliente: f.get("nombre"), telefono: f.get("telefono"), ciudad: envio.ciudad, direccion: envio.direccion,
              entrega: f.get("entrega") || "", comprobante: comp,
              scoop: { opcion: ops[st.op].nombre, cant: 1, caja: (CAJAS[st.caja] || {}).nombre || "", video: st.video, colores: st.colores, personajes: st.personajes, tiktok: f.get("tiktok") || "",
                carta: st.carta, carta_texto: st.carta ? (f.get("carta") || "").trim() : "" } } }) });
          if (r.ok) numero = await r.json();
        }
      } catch (err) { console.warn(err); }
      const o = ops[st.op];
      const caja = CAJAS[st.caja] || {}, tk = (f.get("tiktok") || "").trim();
      const msg = ["🌸 *NUEVO PEDIDO · LUCKY SCOOP* 🌸", numero ? `Pedido #${numero}` : null, "",
        "👤 *Mis datos*", `Nombre: ${f.get("nombre")}`, `WhatsApp: ${f.get("telefono")}`, tk ? `TikTok: ${tk.startsWith("@") ? tk : "@" + tk}` : null, "",
        "🛍️ *Mi Scoop*", `• ${o.nombre} — ${bs(+o.precio)}`,
        `• ${caja.nombre || "Caja blanca"} — ${+caja.precio > 0 ? bs(+caja.precio) : "sin costo"}`,
        st.video ? `• Video del armado — ${bs(pv)}` : null,
        st.carta ? `• Carta personalizada impresa — ${pc ? bs(pc) : "sin costo"}` : null, "",
        st.carta ? "💌 *Mi carta*" : null, st.carta ? `"${(f.get("carta") || "").trim()}"` : null, st.carta ? "" : null,
        "🎨 *Mis preferencias*", `Colores: ${st.colores.join(", ")}`, `Personajes: ${st.personajes.join(", ")}`, "",
        "🚚 *Entrega*", ...envio.lineas, "",
        `💰 *TOTAL: ${bs(total())}*`, "",
        "¿Me envían el QR para realizar el pago? ¡Gracias! 💕"].filter(x => x !== null).join("\n");
      const url = waURL(msg);
      if (ventana && !ventana.closed) ventana.location.href = url; else location.href = url;
      btn.disabled = false; btn.textContent = "Enviar mi pedido 💖";
      if (numero) { app.innerHTML = `<section class="seccion sc-gracias"><div class="banner">
          ${o.imagen ? `<img src="${esc(o.imagen)}" alt="" style="width:180px;margin:0 auto 10px">` : ""}
          <h2>¡Recibimos tu Scoop! 💖</h2><p>Tu pedido es el <b>#${numero}</b>. Pídenos tu QR de pago por WhatsApp. Te escribimos pronto para coordinar la entrega.</p>
          <a class="btn" href="#/">Volver a la tienda</a></div></section>`; window.scrollTo(0, 0); }
    });
    pintarTotal();
  }

  // Página Nosotros: el texto de Mi tienda se arma solo en secciones (una línea corta sin punto = título)
  const NOSOTROS_DEF = `Un poquito sobre Cani Shop ♡
¡Hola! Somos Cani Shop, una tienda boliviana nacida en Santa Cruz de la Sierra, donde creemos que las pequeñas cosas pueden alegrar un día entero.
Nos encantan los detalles bonitos, los colores pastel y esas cositas que no sabías que necesitabas, pero que te hacen sonreír al encontrarlas.
En nuestra tienda encontrarás papelería, accesorios, productos kawaii y personajes que tanto nos gustan, como Sanrio y Snoopy.
Conoce a Cani
Cani es nuestro pequeño gatito negro, curioso, juguetón y amante de las cajas. Le encanta descubrir cosas nuevas y encontrar sorpresas en los lugares más inesperados.
Él representa el espíritu de nuestra tienda: curiosidad, ternura y la emoción de descubrir algo especial.
Una cajita llena de sorpresas
Además de nuestros productos individuales, tenemos experiencias como los Lucky Scoops y las Happy Boxes, pensadas para quienes aman las sorpresas y los pequeños detalles.
De Santa Cruz para toda Bolivia
Estamos en Santa Cruz de la Sierra y realizamos envíos a todo el país, para que un pedacito del universo de Cani llegue hasta ti.
Gracias por ser parte de nuestro pequeño mundo. ♡`;
  const textoNosotros = () => { const t = String(T.nosotros || "").trim(); return t.split("\n").filter(x => x.trim()).length >= 3 ? t : NOSOTROS_DEF; };
  const esTitulo = l => { const x = l.replace(/[\s♡]+$/, ""); return x.length > 0 && x.length <= 45 && !/[.!?,:;]$/.test(x); };
  function seccionesNosotros() {
    const out = []; let cur = null;
    textoNosotros().split("\n").map(x => x.trim()).filter(Boolean).forEach(l => {
      if (esTitulo(l)) { cur = { titulo: l, ps: [] }; out.push(cur); }
      else { if (!cur) { cur = { titulo: "", ps: [] }; out.push(cur); } cur.ps.push(l); }
    });
    let cierre = "";
    const ult = out[out.length - 1];
    if (ult && ult.ps.length > 1 && /^gracias/i.test(ult.ps[ult.ps.length - 1])) cierre = ult.ps.pop();
    return { secs: out, cierre };
  }
  const resumenNosotros = () => { const { secs } = seccionesNosotros(); return (secs[0] && secs[0].ps[0]) || ""; };
  function nosotros() {
    const { secs, cierre } = seccionesNosotros();
    const [intro, ...resto] = secs;
    const foto = ((T.historia || {}).imagenes || []).filter(Boolean)[0] || "historia.webp";
    const ICON = [
      `<svg viewBox="0 0 48 48"><path d="M10 40V18l6-8 4 7h8l4-7 6 8v22z"/><circle cx="19" cy="26" r="1.6"/><circle cx="29" cy="26" r="1.6"/><path d="M22 31c1.3 1 2.7 1 4 0"/></svg>`,
      `<svg viewBox="0 0 48 48"><path d="M7 20h34v22H7z"/><path d="M5 13h38v7H5z"/><path d="M24 13v29"/><path d="M24 13c-3-7-12-8-12-2s12 2 12 2c3-7 12-8 12-2s-12 2-12 2"/></svg>`,
      `<svg viewBox="0 0 48 48"><path d="M4 12h24v20H4z"/><path d="M28 18h9l7 7v7H28z"/><circle cx="12" cy="35" r="4"/><circle cx="36" cy="35" r="4"/></svg>`
    ];
    app.innerHTML = `<section class="seccion nos">
      <div class="nos-intro">
        <div class="nos-foto"><img src="${esc(foto)}" alt="Cani, el gatito de Cani Shop"></div>
        <div class="nos-txt">
          <h1>${esc(intro ? intro.titulo || "Nosotros" : "Nosotros")}</h1>
          ${(intro ? intro.ps : []).map(p => `<p>${esc(p)}</p>`).join("")}
        </div>
      </div>
      ${resto.length ? `<div class="nos-cards">${resto.map((s, i) => `<article class="nos-card">
          <span class="nos-ico">${ICON[i % ICON.length]}</span>
          <h2>${esc(s.titulo)}</h2>${s.ps.map(p => `<p>${esc(p)}</p>`).join("")}</article>`).join("")}</div>` : ""}
      ${cierre ? `<p class="nos-cierre">${esc(cierre)}</p>` : ""}
      <div class="nos-acciones"><a class="btn" href="#/todo">Ver la tienda</a>${SC ? `<a class="btn btn-sec" href="#/scoops">Arma tu Lucky Scoop</a>` : ""}</div>
    </section>`;
  }
  function contacto() {
    app.innerHTML = `<section class="seccion"><h2>Contacto</h2>
      <p class="texto">Escríbenos y te respondemos lo antes posible.</p>
      <form class="form" id="form-contacto" style="max-width:520px">
        <input name="nombre" placeholder="Nombre" required>
        <input name="telefono" placeholder="Teléfono">
        <textarea name="mensaje" rows="4" placeholder="Tu mensaje" required></textarea>
        <button class="btn btn-wa" type="submit">Enviar por WhatsApp</button>
      </form></section>`;
    $("#form-contacto").onsubmit = e => {
      e.preventDefault(); const f = new FormData(e.target);
      const msg = `Hola, soy ${f.get("nombre")}${f.get("telefono") ? ` (${f.get("telefono")})` : ""}.\n${f.get("mensaje")}`;
      window.open(waURL(msg), "_blank");
    };
  }

  // ---------- Rutas ----------
  function ruta() {
    app.onclick = null; clearInterval(carReloj);
    document.body.classList.toggle("en-scoop", (location.hash.split("/")[1] || "") === "scoops");
    const [, sec, arg] = (location.hash.slice(1) || "/").split("/");
    document.querySelectorAll(".menu a").forEach(a => a.classList.toggle("activo", a.getAttribute("href") === "#/" + (sec || "")));
    $("#menu").classList.remove("abierto");
    ({ catalogo: () => catalogo(arg), novedades: () => catalogo(null, null, "nuevos"), buscar: () => catalogo(null, decodeURIComponent(arg || "")), todo: () => catalogo(), producto: () => producto(arg), nosotros, contacto, scoops }[sec] || inicio)();
    cerrarBuscar();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", ruta);

  $("#btn-menu").onclick = () => $("#menu").classList.toggle("abierto");
  // Buscador que se escribe solo
  (() => {
    const inp = $("#input-buscar");
    const frases = T.busquedas || ["Kuromi…", "Hello Kitty…", "Snoopy…", "Stickers kawaii…", "Papelería…", "Cinnamoroll…"];
    let f = 0, i = 0, borrando = false;
    const paso = () => {
      if (document.activeElement === inp || inp.value) { inp.placeholder = "¿Qué estás buscando?"; return setTimeout(paso, 600); }
      const txt = "Buscar " + frases[f];
      if (!borrando) {
        i++;
        if (i >= txt.length) { borrando = true; inp.placeholder = txt; return setTimeout(paso, 1600); }
      } else {
        i--;
        if (i <= 7) { borrando = false; f = (f + 1) % frases.length; }
      }
      inp.placeholder = txt.slice(0, i) + "|";
      setTimeout(paso, borrando ? 45 : 95);
    };
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) setTimeout(paso, 800);
  })();

  // Búsqueda en ventana (como Momohana)
  const capa = $("#buscar-capa"), inpB = $("#input-buscar");
  function abrirBuscar() { if (!capa) return; capa.hidden = false; requestAnimationFrame(() => capa.classList.add("ver")); setTimeout(() => inpB.focus(), 60); pintarPop(""); }
  function cerrarBuscar() { if (!capa || capa.hidden) return; capa.classList.remove("ver"); setTimeout(() => { capa.hidden = true; }, 200); }
  function pintarPop(q) {
    const pop = $("#buscar-pop"); if (!pop) return;
    if (!q) {
      const pops = PERS().slice(0, 6);
      pop.innerHTML = pops.length ? `<p class="pop-tit">Búsquedas populares</p><div class="pop-chips">${pops.map(c => `<a class="pill" href="#/catalogo/${c.id}">${esc(c.nombre)}</a>`).join("")}</div>` : "";
      return;
    }
    const t = q.toLowerCase();
    const res = PRODS.filter(p => (p.nombre + " " + (p.variantes || []).map(v => v.nombre).join(" ")).toLowerCase().includes(t));
    pop.innerHTML = res.length ? `<p class="pop-tit">Productos</p><div class="pop-res">${res.slice(0, 6).map(p => `<a href="#/producto/${p.id}"><img src="${foto(p)}" alt=""><span>${esc(sinEmoji(p.nombre))}<b>${bs(p.precio)}</b></span></a>`).join("")}</div>
      <a class="ver-todo pop-todo" href="#/buscar/${encodeURIComponent(q)}">Ver los ${res.length} resultados</a>` : `<p class="pop-tit">No encontramos “${esc(q)}”</p>`;
  }
  if (capa) {
    $("#btn-buscar").onclick = abrirBuscar;
    $("#buscar-cerrar").onclick = cerrarBuscar;
    capa.addEventListener("click", e => { if (e.target === capa) cerrarBuscar(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") cerrarBuscar(); });
    inpB.addEventListener("input", e => pintarPop(e.target.value.trim()));
    inpB.addEventListener("keydown", e => { if (e.key === "Enter" && inpB.value.trim()) location.hash = "#/buscar/" + encodeURIComponent(inpB.value.trim()); });
  }

  { const pie = document.querySelector(".pie"); if (pie && CINTA.length) pie.insertAdjacentHTML("beforebegin", cinta("cinta-osc")); }
  { const n = document.querySelector("#carrito-pie .nota"); if (n) n.insertAdjacentHTML("afterend", avisoEntrega()); }
  pintarCarrito(); ruta();
})();
