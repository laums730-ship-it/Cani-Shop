# Cani Shop — tu tienda propia

Catálogo, buscador, carrito, pedidos por WhatsApp y **panel de administrador** para manejar productos y stock.

## Archivos
- `index.html`, `styles.css`, `app.js` → la tienda.
- `admin.html` → tu panel de administrador (entras en `tutienda.vercel.app/admin.html`).
- `productos.js` → configuración: WhatsApp, textos, categorías y la conexión con Supabase.
- `logo.png` → tu logo.
- `supabase-setup.sql` → crea la base de datos (se usa una sola vez).

## Conectar el panel de administrador (una sola vez, ~5 min)

### 1. Crea tu proyecto en Supabase (gratis)
1. Entra a **supabase.com** → **Start your project** → entra con tu cuenta de GitHub.
2. **New project** → nombre: `canishop`, inventa una contraseña de base de datos (guárdala),
   región: **South America (São Paulo)** → **Create new project**. Espera 1-2 minutos.

### 2. Crea la base de datos
1. En el menú izquierdo: **SQL Editor** → **New query**.
2. Abre `supabase-setup.sql`, copia TODO el texto, pégalo y toca **Run**.
   Debe decir "Success". (Arriba del archivo está tu correo como administradora; si quieres usar otro, cámbialo antes de correrlo.)

### 3. Crea tu usuario de administradora
1. Menú izquierdo: **Authentication** → **Users** → **Add user** → **Create new user**.
2. Pon **el mismo correo** del paso anterior y una contraseña. Marca **Auto Confirm User**. Crear.
3. Para que nadie más pueda registrarse: **Authentication** → **Sign In / Providers** (o **Settings**)
   → apaga **Allow new users to sign up** → Save.

### 4. Conecta tu tienda
1. En Supabase: **Project Settings** (engranaje) → **API** / **API Keys**.
2. Copia el **Project URL** y la clave **anon** o **publishable**.
3. En GitHub abre `productos.js` → lápiz ✏️ → pégalos arriba:
   ```js
   window.SUPABASE = {
     url: "https://tuproyecto.supabase.co",
     key: "tu-clave-anon-o-publishable"
   };
   ```
4. **Commit changes**. ¡Listo! Entra a `tutienda.vercel.app/admin.html` con tu correo y contraseña.

## Usar el panel
- **＋ Nuevo producto**: nombre, precio, categorías, descripción, fotos y stock.
- **Modelos**: activa "Este producto tiene modelos" y pon cuántas unidades hay de cada uno.
- **− / +** en la lista: sube o baja el stock al instante (se guarda solo).
- Con 0 unidades se muestra **Agotado**; con 3 o menos, "¡Solo quedan X!".
- **Ocultar**: el producto deja de verse en la tienda sin borrarlo.
- Cuando vendas por WhatsApp, baja el stock con el botón **−**.

## Lo que sigue en productos.js
WhatsApp, avisos, textos, redes sociales y categorías se cambian ahí (lápiz ✏️ en GitHub).

## Fotos que venían de Shopify
El primer producto usa fotos guardadas en Shopify. Antes de cancelar Shopify, entra a editarlo en el panel,
quita esas fotos y vuelve a subirlas desde tu celular o compu.

## Hosting
El plan gratis de Vercel (Hobby) es solo para uso no comercial; una tienda requiere el plan Pro.
Alternativa gratis que sí permite tiendas: **Cloudflare Pages**. Supabase gratis sí permite uso comercial.
