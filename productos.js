// =====================================================
//  CONFIGURACIÓN DE TU TIENDA — edita solo este archivo
// =====================================================

window.TIENDA = {
  nombre: "Cani Shop",
  // Tu número de WhatsApp con código de país, sin + ni espacios (Bolivia = 591)
  whatsapp: "59170000000",
  moneda: "Bs",
  avisos: ["Scoops y ventas unitarias", "Envíos a toda Bolivia", "Te damos la bienvenida a nuestra tienda"],
  logo: "https://canishopbo.myshopify.com/cdn/shop/files/Gatito_negro_con_hojas_verdes.png?v=1792972704&width=300",
  instagram: "",   // ej: "https://instagram.com/canishopbo"
  tiktok: "",
  nosotros:
    "Somos Cani Shop, una tienda boliviana de productos kawaii: papelería, Sanrio, Snoopy y mucho más. Vendemos por unidad y en scoops, y enviamos a todo el país.",
  pago:
    "Al enviar tu pedido por WhatsApp te confirmamos stock y el costo de envío, y te pasamos el QR para pagar."
};

// Categorías: el "id" se usa en cada producto
window.CATEGORIAS = [
  { id: "sanrio", nombre: "Sanrio", imagen: "https://canishopbo.myshopify.com/cdn/shop/files/Circulo_kawaii_de_personajes_Sanrio.png?v=1792954593&width=800" },
  { id: "snoopy", nombre: "Snoopy", imagen: "https://canishopbo.myshopify.com/cdn/shop/files/Snoopy_abrazando_un_corazon_rojo.png?v=1792955473&width=800" },
  { id: "papeleria", nombre: "Papelería", imagen: "https://canishopbo.myshopify.com/cdn/shop/collections/Papeleria_kawaii_en_circulo_pastel.png?v=1792963793&width=800" }
];

// Productos. Para agregar uno, copia un bloque { ... } y cambia los datos.
// "variantes" es opcional. stock: true = disponible, false = agotado.
window.PRODUCTOS = [
  {
    id: "armable-acrilico-sanrio",
    nombre: "Armable Acrílico Sanrio",
    precio: 12,
    categorias: ["sanrio"],
    nuevo: true,
    descripcion:
      "Personaliza a tu personaje favorito con diferentes accesorios y outfits. Modelos: Kuromi, My Melody, Cinnamoroll y Hello Kitty.",
    imagenes: [
      "https://canishopbo.myshopify.com/cdn/shop/files/a0X7xgON_wzIqcUhIchbBg.webp?v=1792717426&width=900",
      "https://canishopbo.myshopify.com/cdn/shop/files/d7iS3oa1v_6jqHHFFKSSQ_87cfdbbf-d414-4fb1-931b-e497427c624a.webp?v=1792951627&width=900"
    ],
    variantes: [
      { nombre: "Cinnamoroll", stock: false },
      { nombre: "Kuromi", stock: true },
      { nombre: "My Melody", stock: true },
      { nombre: "Hello Kitty", stock: true }
    ]
  }
];
