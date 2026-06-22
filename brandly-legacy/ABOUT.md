# Remix — Editor de Branding Automatizado

## ¿Qué es Remix?

Remix es una plataforma SaaS de creación de contenido visual (videos e imágenes) que automatiza la aplicación de la identidad de marca. En lugar de depender de un diseñador para cada pieza de contenido, Remix permite que cualquier persona dentro de una organización genere material visualmente consistente — respetando estrictamente los colores, tipografías, logos, intros, outros y reglas visuales definidas por la marca.

La plataforma está pensada para equipos de marketing, agencias creativas y emprendedores que necesitan producir contenido de marca de forma rápida, consistente y a escala, sin sacrificar calidad visual.

---

## El Problema que Resuelve

Crear contenido de marca de forma consistente es costoso y lento:

- **Inconsistencia visual:** Cada persona aplica los colores, fuentes y logos de forma diferente, erosionando la identidad de marca.
- **Dependencia del diseñador:** Cualquier pieza, por simple que sea, requiere pasar por un diseñador que conozca las reglas del brand.
- **Fragmentación de herramientas:** Los equipos saltan entre Canva, Premiere, After Effects, Figma y hojas de cálculo para planificar, diseñar y publicar contenido.
- **Repetición manual:** Las intros, outros, marcas de agua y elementos recurrentes se aplican manualmente en cada proyecto.

Remix centraliza todo esto en un solo flujo: defines tu marca una vez, y toda la producción de contenido la respeta automáticamente.

---

## Concepto Central: Design MD

El corazón de Remix es el concepto de **Design MD** (Markdown de Diseño) — un conjunto de reglas programáticas que definen la identidad visual de una marca de forma estricta y reusable.

Un Design MD incluye:

- **Paleta de colores:** Color primario, secundario y de texto.
- **Tipografía:** Fuente base, fuente de títulos, fuente de subtítulos, con tamaños predeterminados.
- **Logo y posicionamiento:** Imagen del logo con posición configurable en el canvas.
- **Marco visual:** Grosor del borde/frame que envuelve el contenido.
- **Videos de marca:** Intro y outro pregrabados que se insertan automáticamente.
- **Audio de marca:** Música o jingle de fondo con control de volumen y fade in/out.
- **Transiciones por defecto:** Animaciones de entrada y salida que se aplican a los elementos.
- **Redes sociales:** Handles de Instagram, TikTok, Twitter, YouTube, etc.

La clave es que el Design MD **no es un template visual** — es un *plano arquitectónico*. Todo el contenido generado en la plataforma lo hereda automáticamente, garantizando consistencia sin intervención manual.

---

## Flujos Principales

### 1. Panel de Marca (Dashboard)

El punto de entrada de la plataforma. Aquí el usuario puede:

- **Crear y gestionar múltiples marcas** — cada una con su propio Design MD independiente.
- **Ver un preview en vivo** de la identidad visual de cada marca (imagen estática o video con intro/outro).
- **Seleccionar el formato de salida** (video o imagen) antes de iniciar un proyecto.
- **Acceder a proyectos guardados** para continuar editando.
- **Elegir entre dos modos de creación:** Express (rápido y guiado) o Editor Pro (control total).

### 2. Configuración de Marca (Brand Architecture)

Un editor dedicado donde se define el Design MD completo de una marca. Está organizado en pestañas:

- **Información:** Nombre de la empresa, industria, tagline, redes sociales.
- **Visual y Colores:** Paleta de colores (primario, secundario, texto), logo, grosor del marco.
- **Tipografía:** Fuente base y fuentes específicas por jerarquía (título, subtítulo, párrafo) con selector de Google Fonts.
- **Video y Audio:** Upload de videos de intro/outro, audio de marca, configuración de duraciones y transiciones.
- **Contenido:** Creación de piezas de contenido reutilizables (tarjetas de texto, badges sociales, badges de logo) con editor visual de posicionamiento.
- **Plantillas:** Creación y gestión de plantillas personalizadas que respetan el Design MD, usando un editor visual tipo Figma.

El panel incluye un preview en vivo a la derecha que se actualiza en tiempo real conforme se modifican los parámetros.

### 3. Editor Express ⚡

Un flujo simplificado de creación basado en **plantillas con escenas**:

- El usuario selecciona una plantilla (post social, anuncio, historia, etc.) de una galería.
- La plantilla define un storyboard de escenas con campos editables prellenados con variables de la marca.
- El usuario solo modifica el contenido (textos, imágenes) — el branding se aplica automáticamente.
- Soporta múltiples aspect ratios (9:16, 16:9, 1:1, 4:5).
- Las escenas se pueden reordenar y sus duraciones se pueden ajustar.
- Los campos se auto-rellenan con datos de la marca (nombre, logo, redes sociales).

### 4. Editor Pro (Studio)

Un editor de video/imagen profesional con control granular:

- **Canvas tipo Figma** con zoom, pasteboard y guías de snap.
- **Timeline multi-capa** para componer elementos en el tiempo.
- **Elementos soportados:** Texto, imágenes, videos, audio, stickers, formas (rectángulo, círculo, triángulo, estrella, etc.), colores de fondo.
- **Propiedades por elemento:** Posición, tamaño, rotación, opacidad, color, tipografía, sombras, bordes, filtros, modos de mezcla, chroma key, y más.
- **Sistema de animación:** Transiciones de entrada/salida (fade, slide, scale, blur, spin, flip, typewriter, bounce) con keyframes multi-punto.
- **Capas con control:** Visibilidad, bloqueo, opacidad, color de etiqueta, mute/solo para audio.
- **Media Library** con soporte para uploads locales y búsqueda de stock (Pexels).
- **Subtítulos automáticos** con transcripción vía Whisper (API de Groq).
- **Renderizado real** del proyecto a video/imagen exportable usando Remotion como motor de render en el servidor.

### 5. Malla de Contenidos (Content Grid)

Un sistema de planificación editorial para organizar el contenido de cada marca:

- **Vista de calendario** mensual para visualizar publicaciones programadas.
- **Vista de grilla** con tarjetas de contenido organizadas por estado.
- **Vista de lista** detallada con toda la información.
- **Estados de contenido:** Idea → Borrador → En Revisión → Aprobado → Programado → Publicado.
- **Pilares de contenido** personalizables con colores para categorizar el tipo de contenido.
- **Plataformas destino:** Instagram, TikTok, YouTube, Facebook, Twitter, LinkedIn.
- **Vinculación con proyectos:** Cada pieza de contenido puede asociarse a un proyecto del editor para acceder directamente.

---

## Stack Tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Estilos | Tailwind CSS v4 |
| Animaciones | Motion (Framer Motion) |
| Motor de Render | Remotion v4 (composición + renderizado server-side) |
| Iconos | Lucide React |
| Backend | Express.js (servidor unificado con Vite en desarrollo) |
| Uploads | Multer (disco local) |
| Transcripción | Groq API (Whisper Large v3) |
| Stock Media | Pexels API |
| Persistencia | LocalStorage (frontend) + PostgreSQL (esquema preparado para SaaS) |

---

## Arquitectura Multi-Editor

Remix implementa tres editores que comparten una base arquitectónica común:

| Editor | Propósito | Audiencia |
|---|---|---|
| **Studio** | Editor profesional completo con timeline | Diseñadores, editores de video |
| **Express** | Creación rápida basada en plantillas | Equipos de marketing, community managers |
| **Template Builder** | Creación de plantillas personalizadas | Brand managers, agencias |

Los tres editores comparten componentes de UI, hooks de interacción (drag & resize) y el modelo de datos subyacente. El Template Builder convierte entre el formato de plantillas (escenas + campos) y el formato de timeline (elementos + capas) de forma transparente.

---

## Modelo Multi-Tenant

La plataforma está diseñada para manejar múltiples marcas (empresas) de forma aislada:

- Cada marca tiene su propio Design MD, contenido, plantillas y proyectos.
- El esquema de base de datos está preparado para un modelo SaaS con tenants, usuarios con roles (admin, editor, viewer) y activos por empresa.
- Actualmente la persistencia del frontend es via LocalStorage, pero la estructura está lista para migrar a un backend con autenticación.

---

## ¿Para Quién es Remix?

- **Agencias de marketing** que manejan múltiples clientes y necesitan producir contenido de marca a escala.
- **Equipos internos de marketing** que quieren empoderar a cualquier miembro para crear contenido sin depender de un diseñador.
- **Emprendedores y small businesses** que necesitan contenido profesional pero no tienen presupuesto para un equipo creativo.
- **Freelancers y creadores de contenido** que buscan mantener consistencia visual en sus publicaciones.

---

## Visión a Futuro

Remix busca convertirse en la plataforma de referencia para la automatización de branding visual — donde definir una marca una vez sea suficiente para generar contenido infinito, consistente y profesional, sin intervención de IA generativa en el diseño (las reglas son estrictas y programáticas, no probabilísticas).
