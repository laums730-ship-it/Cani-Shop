(async () => {
  const T = window.TIENDA, SB = window.SUPABASE || {};
  let CATS = window.CATEGORIAS || [];
  let PRODS = window.PRODUCTOS || [];
  const $ = s => document.querySelector(s);
  const app = $("#app");
  const bs = n => `${T.moneda} ${Number(n).toFixed(2).replace(".", ",")}`;
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // stock puede ser número (cantidad) o true/false
  const disp = x => x === true || (typeof x === "number" && x > 0);
  const tieneVar = p => Array.isArray(p.variantes) && p.variantes.length > 0;
  const hayStock = p => tieneVar(p) ? p.variantes.some(v => disp(v.stock)) : (p.stock === undefined || disp(p.stock));
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

  app.innerHTML = `<p class="vacio" style="padding:80px 16px">Cargando cositas kawaii… 🐾</p>`;
  await Promise.all([cargarAjustes(), cargarProductos()]);
  if (Array.isArray(T.categorias) && T.categorias.length) CATS = T.categorias;
  const circ = c => c.imagen ? `<img src="${esc(c.imagen)}" alt="">` : `<span class="circ-emoji">${esc(c.emoji || (c.nombre || "?")[0])}</span>`;

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
  const gato = (sel, src) => { const g = $(sel); if (src) { g.src = src; g.onerror = () => g.remove(); } else g.remove(); };
  gato("#gato-izq", T.gatoIzq); gato("#gato-der", T.gatoDer);

  $("#wa-flotante").href = `https://wa.me/${T.whatsapp}`;
  if (T.ubicacion) $(".pie-marca").insertAdjacentHTML("beforeend", `<p>📍 ${esc(T.ubicacion)}</p>`);
  if (T.whatsapp && !/^5917000000/.test(T.whatsapp)) $(".pie-marca").insertAdjacentHTML("beforeend", `<p>📞 +${esc(T.whatsapp)}</p>`);
  // Formas de entrega en el carrito
  const ENT = (T.entregas || []).filter(Boolean);
  if (ENT.length) $("#sel-entrega").innerHTML = `<option value="" disabled selected>¿Cómo quieres recibirlo?</option>` + ENT.map(x => `<option>${esc(x)}</option>`).join("");
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
    corazon: `<svg viewBox="0 0 32 32"><path d="M16 28S3 20 3 11a6.5 6.5 0 0 1 13-1 6.5 6.5 0 0 1 13 1c0 9-13 17-13 17z" fill="#f78db0"/><ellipse cx="10" cy="10" rx="2.5" ry="1.5" fill="#fff" opacity=".7"/></svg>`
  };
  const sticker = (tipo, clase, estilo = "") => `<span class="sticker ${clase}" style="${estilo}" aria-hidden="true">${STK[tipo]}</span>`;

  // ---------- Carrito ----------
  let carrito = [];
  try { carrito = JSON.parse(localStorage.getItem("carrito") || "[]"); } catch (e) {}
  const guardar = () => { try { localStorage.setItem("carrito", JSON.stringify(carrito)); } catch (e) {} pintarCarrito(); };
  const agregar = (id, variante, cant) => {
    const ex = carrito.find(i => i.id === id && i.variante === variante);
    ex ? ex.cant += cant : carrito.push({ id, variante, cant });
    guardar(); toast("Agregado al carrito 🐾");
  };
  function pintarCarrito() {
    const n = carrito.reduce((a, i) => a + i.cant, 0);
    const c = $("#contador"); c.textContent = n; c.dataset.v = n;
    const items = carrito.map((i, k) => ({ ...i, k, p: PRODS.find(p => p.id === i.id) })).filter(i => i.p);
    $("#carrito-items").innerHTML = items.length ? items.map(i => `
      <div class="item">
        <img src="${foto(i.p)}" alt="">
        <div>
          <h4>${esc(i.p.nombre)}</h4>
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
    let numero = null;
    if (SB.url && SB.key) {
      try {
        const r = await fetch(`${SB.url.replace(/\/$/, "")}/rest/v1/rpc/crear_pedido`, {
          method: "POST",
          headers: { apikey: SB.key, Authorization: `Bearer ${SB.key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ p: {
            cliente: f.get("nombre"), telefono: f.get("telefono"), ciudad: f.get("ciudad"),
            direccion: f.get("direccion") || "", entrega: f.get("entrega") || "", nota: f.get("nota") || "",
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
    const msg = [`¡Hola ${T.nombre}! Quiero hacer este pedido${numero ? ` (Pedido #${numero})` : ""}:`, "", ...lineas, "", `Subtotal: ${bs(total)}`, "",
      `Nombre: ${f.get("nombre")}`, `Teléfono: ${f.get("telefono")}`, `Ciudad: ${f.get("ciudad")}`,
      f.get("entrega") ? `Entrega: ${f.get("entrega")}` : null,
      f.get("direccion") ? `Dirección: ${f.get("direccion")}` : null, f.get("nota") ? `Nota: ${f.get("nota")}` : null
    ].filter(x => x !== null).join("\n");
    const url = `https://wa.me/${T.whatsapp}?text=${encodeURIComponent(msg)}`;
    if (ventana && !ventana.closed) ventana.location.href = url; else location.href = url;
    btn.disabled = false;
    if (numero) {
      carrito = []; guardar(); e.target.reset(); abrir(false);
      toast(`¡Pedido #${numero} enviado! 💕`);
    }
  });

  let tt; function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("ver"); clearTimeout(tt); tt = setTimeout(() => el.classList.remove("ver"), 1800); }

  // ---------- Vistas ----------
  const tarjeta = p => `
    <a class="tarjeta" href="#/producto/${p.id}">
      <div class="foto"><img loading="lazy" src="${foto(p)}" alt="${esc(p.nombre)}">
        ${!hayStock(p) ? `<span class="etiqueta agotado">Agotado</span>` : p.nuevo ? `<span class="etiqueta">Nuevo</span>` : ""}</div>
      <div class="info"><h3>${esc(p.nombre)}</h3><div class="precio">${bs(p.precio)}</div>
        <span class="ver-mas">${hayStock(p) ? "Ver opciones →" : "Ver detalles →"}</span></div>
    </a>`;
  const grilla = lista => lista.length ? `<div class="grilla">${lista.map(tarjeta).join("")}</div>` : `<p class="vacio">No encontramos productos 😿</p>`;

  function inicio() {
    const nuevos = PRODS.filter(p => p.nuevo).concat(PRODS.filter(p => !p.nuevo)).slice(0, 8);
    const marcas = CATS.filter(c => c.marca);
    const bans = (T.banners || []).filter(b => b && b.imagen);
    app.innerHTML = `
      ${bans.length ? `<section class="carrusel-wrap"><div class="carrusel">
        <div class="car-pista" id="car-pista">${bans.map(b => b.enlace
          ? `<a class="slide" href="${esc(b.enlace)}"${/^https?:/.test(b.enlace) ? ' target="_blank" rel="noopener"' : ""}><img src="${esc(b.imagen)}" alt=""></a>`
          : `<div class="slide"><img src="${esc(b.imagen)}" alt=""></div>`).join("")}</div>
        ${bans.length > 1 ? `<div class="car-puntos" id="car-puntos">${bans.map((_, i) => `<button data-s="${i}" aria-label="Banner ${i + 1}" class="${i ? "" : "on"}"></button>`).join("")}</div>` : ""}
      </div></section>` : ""}
      ${marcas.length ? `<section class="marcas">
        <div class="marcas-fila">${marcas.map(c => `<a class="marca-item" href="#/catalogo/${c.id}"><div class="circ">${circ(c)}</div>${esc(c.nombre)}</a>`).join("")}</div>
      </section>` : ""}
      <div class="franja">${sticker("lapiz", "st-lapiz")}${esc(T.franja || "")}${sticker("estrella", "st-estrella")}</div>

      <div class="fondo-gris">
        <section class="seccion"><h2>Compra por categorías</h2>
          <div class="cats">${CATS.map(c => `<a class="cat" href="#/catalogo/${c.id}"><div class="circ">${circ(c)}</div>${esc(c.nombre)}</a>`).join("")}</div>
        </section>
      </div>

      <section class="seccion">
        <div class="titulo"><h2>Novedades ✨</h2><a class="ver-todo" href="#/catalogo">Ver todo →</a></div>
        ${grilla(nuevos)}
      </section>

      <div class="fondo-gris">
        <section class="seccion"><h2>¿Cómo comprar? 🐾</h2>
          <div class="pasos">
            <div class="paso"><div class="num">1</div><h3>Elige tus cositas</h3><p>Agrega al carrito los productos y modelos que más te gusten.</p></div>
            <div class="paso"><div class="num">2</div><h3>Envía tu pedido</h3><p>Con un toque nos llega tu pedido completo por WhatsApp.</p></div>
            <div class="paso"><div class="num">3</div><h3>Paga y recibe</h3><p>Te pasamos el QR, pagas y te lo enviamos a cualquier ciudad de Bolivia.</p></div>
          </div>
        </section>
      </div>

      <section class="seccion">
        <div class="banner">
          ${sticker("corazon", "st-corazon", "top:18px;left:24px;transform:rotate(-14deg)")}
          ${sticker("corazon", "st-corazon", "bottom:20px;right:30px;transform:rotate(12deg)")}
          ${sticker("estrella", "", "top:16px;right:16%;width:40px;height:40px")}
          <h2>${esc(T.bannerTitulo || "¿Buscas algo especial?")}</h2>
          <p>${esc(T.bannerTexto || "Escríbenos y te ayudamos a encontrarlo 💕")}</p>
          <a class="btn" href="https://wa.me/${T.whatsapp}" target="_blank" rel="noopener">${esc(T.bannerBoton || "Hablar por WhatsApp")}</a>
        </div>
      </section>`;
    if (bans.length > 1) carrusel(bans.length);
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

  function catalogo(cat, q) {
    let lista = PRODS;
    if (cat) lista = lista.filter(p => p.categorias?.includes(cat));
    if (q) { const t = q.toLowerCase(); lista = lista.filter(p => (p.nombre + " " + (p.descripcion || "") + " " + (p.variantes || []).map(v => v.nombre).join(" ")).toLowerCase().includes(t)); }
    app.innerHTML = `<section class="seccion">
      <h2>${q ? `Resultados para “${esc(q)}”` : cat ? esc(CATS.find(c => c.id === cat)?.nombre || "Catálogo") : "Catálogo"}</h2>
      <div class="filtros"><a class="chip ${!cat ? "activo" : ""}" href="#/catalogo">Todo</a>
        ${CATS.map(c => `<a class="chip ${cat === c.id ? "activo" : ""}" href="#/catalogo/${c.id}">${esc(c.nombre)}</a>`).join("")}</div>
      ${grilla(lista)}</section>`;
  }

  function producto(id) {
    const p = PRODS.find(x => x.id === id);
    if (!p) return catalogo();
    let img = 0, cant = 1, vari = tieneVar(p) ? (p.variantes.find(v => disp(v.stock)) || {}).nombre : null;
    const imgs = p.imagenes && p.imagenes.length ? p.imagenes : [foto(p)];
    const pintar = () => {
      const dispo = tieneVar(p) ? !!vari : hayStock(p);
      const max = maxDe(p, vari); if (cant > max) cant = Math.max(1, max);
      const pocos = dispo && max <= 3 ? `<p class="pocos">¡Solo ${max === 1 ? "queda 1" : `quedan ${max}`}! 🏃‍♀️</p>` : "";
      app.innerHTML = `<section class="seccion">
        <a class="volver" href="#/catalogo">← Volver al catálogo</a>
        <div class="producto">
          <div class="galeria">
            <div class="principal"><img src="${imgs[img]}" alt="${esc(p.nombre)}"></div>
            ${imgs.length > 1 ? `<div class="miniaturas">${imgs.map((s, k) => `<button class="${k === img ? "activo" : ""}" data-img="${k}"><img src="${s}" alt=""></button>`).join("")}</div>` : ""}
          </div>
          <div>
            <h1>${esc(p.nombre)}</h1>
            <div class="precio">${bs(p.precio)}</div>
            <p>${esc(p.descripcion || "")}</p>
            ${tieneVar(p) ? `<div class="etiq">Modelo</div><div class="opciones">${p.variantes.map(v => `<button class="opcion ${v.nombre === vari ? "activo" : ""}" data-var="${esc(v.nombre)}" ${disp(v.stock) ? "" : "disabled"}>${esc(v.nombre)}</button>`).join("")}</div>` : ""}
            <div class="etiq">Cantidad</div>
            <div class="cantidad"><button data-c="-1">−</button><span>${cant}</span><button data-c="1">+</button></div><br>
            ${pocos}<button class="btn" id="agregar" ${dispo ? "" : "disabled"}>${dispo ? "Agregar al carrito" : "Agotado"}</button>
            <p class="nota" style="margin-top:16px">${esc(T.pago)}</p>
          </div>
        </div></section>`;
    };
    pintar();
    app.onclick = e => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.img) { img = +b.dataset.img; pintar(); }
      else if (b.dataset.var) { vari = b.dataset.var; pintar(); }
      else if (b.dataset.c) { cant = Math.min(maxDe(p, vari), Math.max(1, cant + +b.dataset.c)); pintar(); }
      else if (b.id === "agregar") agregar(p.id, vari, cant);
    };
  }

  function nosotros() {
    app.innerHTML = `<section class="seccion"><h2>Nosotros</h2><p class="texto">${esc(T.nosotros).replace(/\n/g, "<br>")}</p></section>`;
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
      window.open(`https://wa.me/${T.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
    };
  }

  // ---------- Rutas ----------
  function ruta() {
    app.onclick = null; clearInterval(carReloj);
    const [, sec, arg] = (location.hash.slice(1) || "/").split("/");
    document.querySelectorAll(".menu a").forEach(a => a.classList.toggle("activo", a.getAttribute("href") === "#/" + (sec || "")));
    $("#menu").classList.remove("abierto");
    ({ catalogo: () => catalogo(arg), producto: () => producto(arg), nosotros, contacto }[sec] || inicio)();
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

  $("#input-buscar").addEventListener("input", e => {
    const q = e.target.value.trim();
    app.onclick = null;
    q ? catalogo(null, q) : ruta();
  });

  pintarCarrito(); ruta();
})();
