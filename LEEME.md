# Cani Shop — tu tienda propia

Tienda estática (sin servidor ni base de datos): catálogo, buscador, carrito y pedidos por WhatsApp.
Funciona en Vercel, Cloudflare Pages, Netlify o GitHub Pages sin cambiar nada.

## Archivos
- `productos.js` → **el único que necesitas editar**: tu WhatsApp, textos, categorías y productos.
- `index.html`, `styles.css`, `app.js` → el diseño y funcionamiento.

## 1. Configura tu WhatsApp
En `productos.js`, cambia `whatsapp: "59170000000"` por tu número con 591 delante, sin espacios.

## 2. Agrega productos
Copia el bloque del producto de ejemplo y cambia nombre, precio, fotos y variantes.
- `stock: false` en una variante la muestra como agotada.
- `nuevo: true` lo pone en "Novedades" con etiqueta.

## 3. Fotos (importante antes de cancelar Shopify)
Ahora las fotos se cargan desde los servidores de Shopify. Si cierras Shopify, **dejarán de verse**.
Antes de cancelar:
1. Descarga cada foto (abre el enlace del archivo y guárdala).
2. Crea una carpeta `img` junto a `index.html` y ponlas ahí.
3. En `productos.js` cambia los enlaces por `"img/nombre-foto.webp"`.

## 4. Subir a Vercel (sin programar)
1. Crea una cuenta en vercel.com (puedes entrar con GitHub o tu correo).
2. Instala nada: ve a **vercel.com/new**, elige la opción de subir/importar un proyecto.
   La forma más fácil: sube esta carpeta a un repositorio de **GitHub** (botón "Add file → Upload files")
   y luego en Vercel elige "Import" sobre ese repositorio. Framework: **Other**. Deploy.
3. Cada vez que edites `productos.js` en GitHub, Vercel actualiza la tienda solo.

Recuerda: el plan gratis de Vercel (Hobby) es solo para uso no comercial; una tienda requiere el plan Pro.
Alternativa gratis que sí permite tiendas: **Cloudflare Pages** (pages.cloudflare.com → "Upload assets" → arrastra la carpeta).

## 5. Dominio propio
En el panel de Vercel o Cloudflare: Settings → Domains → agrega tu dominio y sigue las instrucciones DNS.
