(() => {
  const T = window.TIENDA, CATS = window.CATEGORIAS, PRODS = window.PRODUCTOS;
  const $ = s => document.querySelector(s);
  const app = $("#app");
  const bs = n => `${T.moneda} ${n.toFixed(2).replace(".", ",")}`;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const hayStock = p => !p.variantes ? p.stock !== false : p.variantes.some(v => v.stock);

  // ---------- Datos fijos ----------
  document.title = T.nombre;
  $("#marca-nombre").textContent = T.nombre;
  $("#pie-nombre").textContent = $("#pie-nombre2").textContent = T.nombre;
  $("#anio").textContent = new Date().getFullYear();
  if (T.logo) $("#logo").src = T.logo; else $("#logo").remove();
  $("#pie-redes").innerHTML = [
    T.instagram && `<a href="${T.instagram}" target="_blank" rel="noopener">Instagram</a>`,
    T.tiktok && `<a href="${T.tiktok}" target="_blank" rel="noopener">TikTok</a>`,
    `<a href="https://wa.me/${T.whatsapp}" target="_blank" rel="noopener">WhatsApp</a>`
  ].filter(Boolean).join("");
  let ia = 0; const av = $("#aviso-texto");
  const rotar = () => { av.textContent = T.avisos[ia++ % T.avisos.length]; };
  rotar(); setInterval(rotar, 4000);

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
        <img src="${i.p.imagenes[0]}" alt="">
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
    if (d.mas) carrito[d.mas].cant++;
    else if (d.menos) { carrito[d.menos].cant--; if (carrito[d.menos].cant < 1) carrito.splice(d.menos, 1); }
    else if (d.quitar) carrito.splice(d.quitar, 1);
    else return;
    guardar();
  });
  const abrir = v => { $("#carrito").classList.toggle("abierto", v); $("#velo").classList.toggle("abierto", v); };
  $("#btn-carrito").onclick = () => abrir(true);
  $("#cerrar-carrito").onclick = $("#velo").onclick = () => abrir(false);

  $("#form-pedido").addEventListener("submit", e => {
    e.preventDefault();
    const f = new FormData(e.target);
    const lineas = carrito.map(i => {
      const p = PRODS.find(x => x.id === i.id); if (!p) return "";
      return `• ${i.cant} x ${p.nombre}${i.variante ? ` (${i.variante})` : ""} — ${bs(p.precio * i.cant)}`;
    }).filter(Boolean);
    const total = carrito.reduce((a, i) => a + (PRODS.find(p => p.id === i.id)?.precio || 0) * i.cant, 0);
    const msg = [`¡Hola ${T.nombre}! Quiero hacer este pedido:`, "", ...lineas, "", `Subtotal: ${bs(total)}`, "",
      `Nombre: ${f.get("nombre")}`, `Ciudad: ${f.get("ciudad")}`,
      f.get("direccion") ? `Dirección: ${f.get("direccion")}` : null, f.get("nota") ? `Nota: ${f.get("nota")}` : null
    ].filter(x => x !== null).join("\n");
    window.open(`https://wa.me/${T.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
  });

  let tt; function toast(t) { const el = $("#toast"); el.textContent = t; el.classList.add("ver"); clearTimeout(tt); tt = setTimeout(() => el.classList.remove("ver"), 1800); }

  // ---------- Vistas ----------
  const tarjeta = p => `
    <a class="tarjeta" href="#/producto/${p.id}">
      <div class="foto"><img loading="lazy" src="${p.imagenes[0]}" alt="${esc(p.nombre)}">
        ${!hayStock(p) ? `<span class="etiqueta agotado">Agotado</span>` : p.nuevo ? `<span class="etiqueta">Nuevo</span>` : ""}</div>
      <div class="info"><h3>${esc(p.nombre)}</h3><div class="precio">${bs(p.precio)}</div></div>
    </a>`;
  const grilla = lista => lista.length ? `<div class="grilla">${lista.map(tarjeta).join("")}</div>` : `<p class="vacio">No encontramos productos 😿</p>`;

  function inicio() {
    const nuevos = PRODS.filter(p => p.nuevo).concat(PRODS.filter(p => !p.nuevo)).slice(0, 8);
    app.innerHTML = `
      <section class="hero">
        <div>
          <h1>Cositas <span>kawaii</span> para alegrar tu día</h1>
          <p>Sanrio, Snoopy, papelería y más. Scoops y ventas unitarias, con envíos a toda Bolivia.</p>
          <a class="btn" href="#/catalogo">Ver catálogo</a>
        </div>
        <div class="hero-img">${T.logo ? `<img src="${T.logo}" alt="">` : ""}</div>
      </section>
      <section class="seccion"><h2>Compra por categorías</h2>
        <div class="cats">${CATS.map(c => `<a class="cat" href="#/catalogo/${c.id}"><div class="circ"><img src="${c.imagen}" alt=""></div>${esc(c.nombre)}</a>`).join("")}</div>
      </section>
      <section class="seccion"><h2>Novedades</h2>${grilla(nuevos)}</section>`;
  }

  function catalogo(cat, q) {
    let lista = PRODS;
    if (cat) lista = lista.filter(p => p.categorias?.includes(cat));
    if (q) { const t = q.toLowerCase(); lista = lista.filter(p => (p.nombre + " " + p.descripcion).toLowerCase().includes(t)); }
    app.innerHTML = `<section class="seccion">
      <h2>${q ? `Resultados para “${esc(q)}”` : cat ? esc(CATS.find(c => c.id === cat)?.nombre || "Catálogo") : "Catálogo"}</h2>
      <div class="filtros"><a class="chip ${!cat ? "activo" : ""}" href="#/catalogo">Todo</a>
        ${CATS.map(c => `<a class="chip ${cat === c.id ? "activo" : ""}" href="#/catalogo/${c.id}">${esc(c.nombre)}</a>`).join("")}</div>
      ${grilla(lista)}</section>`;
  }

  function producto(id) {
    const p = PRODS.find(x => x.id === id);
    if (!p) return catalogo();
    let img = 0, cant = 1, vari = p.variantes ? (p.variantes.find(v => v.stock) || {}).nombre : null;
    const pintar = () => {
      const dispo = p.variantes ? !!vari : p.stock !== false;
      app.innerHTML = `<section class="seccion">
        <a class="volver" href="#/catalogo">← Volver al catálogo</a>
        <div class="producto">
          <div class="galeria">
            <div class="principal"><img src="${p.imagenes[img]}" alt="${esc(p.nombre)}"></div>
            ${p.imagenes.length > 1 ? `<div class="miniaturas">${p.imagenes.map((s, k) => `<button class="${k === img ? "activo" : ""}" data-img="${k}"><img src="${s}" alt=""></button>`).join("")}</div>` : ""}
          </div>
          <div>
            <h1>${esc(p.nombre)}</h1>
            <div class="precio">${bs(p.precio)}</div>
            <p>${esc(p.descripcion || "")}</p>
            ${p.variantes ? `<div class="etiq">Modelo</div><div class="opciones">${p.variantes.map(v => `<button class="opcion ${v.nombre === vari ? "activo" : ""}" data-var="${esc(v.nombre)}" ${v.stock ? "" : "disabled"}>${esc(v.nombre)}</button>`).join("")}</div>` : ""}
            <div class="etiq">Cantidad</div>
            <div class="cantidad"><button data-c="-1">−</button><span>${cant}</span><button data-c="1">+</button></div><br>
            <button class="btn" id="agregar" ${dispo ? "" : "disabled"}>${dispo ? "Agregar al carrito" : "Agotado"}</button>
            <p class="nota" style="margin-top:16px">${esc(T.pago)}</p>
          </div>
        </div></section>`;
    };
    pintar();
    app.onclick = e => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.img) { img = +b.dataset.img; pintar(); }
      else if (b.dataset.var) { vari = b.dataset.var; pintar(); }
      else if (b.dataset.c) { cant = Math.max(1, cant + +b.dataset.c); pintar(); }
      else if (b.id === "agregar") agregar(p.id, vari, cant);
    };
  }

  function nosotros() {
    app.innerHTML = `<section class="seccion"><h2>Nosotros</h2><p class="texto">${esc(T.nosotros)}</p></section>`;
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
    app.onclick = null;
    const [, sec, arg] = (location.hash.slice(1) || "/").split("/");
    document.querySelectorAll(".menu a").forEach(a => a.classList.toggle("activo", a.getAttribute("href") === "#/" + (sec || "")));
    $("#menu").classList.remove("abierto");
    ({ catalogo: () => catalogo(arg), producto: () => producto(arg), nosotros, contacto }[sec] || inicio)();
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", ruta);

  $("#btn-menu").onclick = () => $("#menu").classList.toggle("abierto");
  $("#btn-buscar").onclick = () => { const b = $("#barra-busqueda"); b.hidden = !b.hidden; if (!b.hidden) $("#input-buscar").focus(); };
  $("#input-buscar").addEventListener("input", e => catalogo(null, e.target.value.trim()));

  pintarCarrito(); ruta();
})();
