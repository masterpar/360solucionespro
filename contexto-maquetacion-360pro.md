# Especificación de Diseño UX/UI, Maquetación y Contenido Web
**Proyecto:** 360° Pro Soluciones Integrales S.A.S.
**Enfoque:** Landing Page / Sitio Corporativo B2B & B2G (Licitaciones, Empresas, Instituciones y Particulares)
**Estilo Visual:** Corporativo, Elegante, Moderno, Premium, Mobile-First.

---

## 1. Instrucciones para el Agente / IDE (Antigravity Prompt Context)
Actúa como un Desarrollador Frontend Senior y Diseñador UX/UI Especialista. Utiliza este documento como la **única fuente de verdad** para construir y maquetar el sitio web de **360° Pro Soluciones Integrales S.A.S.**. 
- Respeta estrictamente la jerarquía tipográfica, la paleta de colores (regla 60-30-10), el sistema de grillas y los textos oficiales detallados en cada sección.
- Garantiza que la interfaz sea **100% adaptable a dispositivos móviles (Responsive Design)**, aplicando micro-interacciones sutiles, sombras difusas, bordes redondeados modernos y alto contraste de legibilidad.

---

## 2. Sistema de Diseño (UI Kit & Tokens)

### 2.1. Paleta de Colores (Regla 60-30-10)
| Token / Variable CSS | Rol en la Interfaz | Color | Código Hex | Aplicación Estratégica |
| :--- | :--- | :--- | :--- | :--- |
| `--color-primary` | Primario (Autoridad) | Azul Marino Profundo | `#0A2239` | Fondos principales (Hero, Por qué elegirnos, Footer), títulos `H1/H2/H3` sobre fondo claro y textos de marca. |
| `--color-secondary` | Secundario (Soporte) | Azul Corporativo Medio | `#133C63` | Degradados sutiles, bordes activos, íconos secundarios y estados *hover* de tarjetas. |
| `--color-accent` | Acento / Conversión | Naranja Vibrante | `#FF6B00` | Botones CTA principales, palabras clave destacadas en títulos, indicadores activos, badges y viñetas. |
| `--color-accent-hover` | Acento Hover | Naranja Cálido Oscuro | `#E05A00` | Estado `:hover` en botones principales y elementos interactivos naranjas. |
| `--bg-light` | Fondo Neutro Base | Blanco Puro | `#FFFFFF` | Fondo de secciones principales (Nosotros, Contacto) y fondo de tarjetas. |
| `--bg-surface` | Fondo Neutro Alterno | Gris Hielo Tenue | `#F4F7FA` | Fondo de sección de Servicios y tarjetas secundarias para separar bloques sin líneas divisorias. |
| `--color-dark-footer` | Fondo Ultra Oscuro | Azul Noche | `#061524` | Fondo exclusivo para el Footer corporativo. |
| `--text-body` | Texto de Párrafo | Gris Pizarra Oscuro | `#475569` | Textos descriptivos sobre fondos claros (evitar `#000000` puro). |
| `--text-light` | Texto sobre Oscuro | Gris Perla / Blanco | `#F8FAFC` / `#CBD5E1` | Títulos y párrafos sobre secciones de fondo azul profundo (`#0A2239`). |

### 2.2. Jerarquía Tipográfica (Google Fonts)
- **Fuente para Títulos (`--font-heading`):** `'Plus Jakarta Sans'` o `'Montserrat'`, sans-serif (Pesos: `700 Bold`, `800 ExtraBold`).
- **Fuente para Cuerpo y UI (`--font-body`):** `'Inter'` o `'DM Sans'`, sans-serif (Pesos: `400 Regular`, `500 Medium`, `600 SemiBold`).

**Escala Tipográfica:**
- **Eyebrow Text (Subtítulos superiores):** `0.8125rem` (`13px`), `font-weight: 700`, `text-transform: uppercase`, `letter-spacing: 0.12em` (`2px`), color `#FF6B00` o `#0A2239`.
- **H1 (Hero Principal):** Desktop: `3.25rem - 3.5rem` (`52px - 56px`) | Mobile: `2.125rem` (`34px`). `line-height: 1.15`, `font-weight: 800`.
- **H2 (Títulos de Sección):** Desktop: `2.25rem - 2.5rem` (`36px - 40px`) | Mobile: `1.75rem` (`28px`). `line-height: 1.2`, `font-weight: 800`.
- **H3 (Títulos de Tarjetas):** Desktop: `1.25rem - 1.375rem` (`20px - 22px`). `line-height: 1.3`, `font-weight: 700`.
- **Body Large (Introducciones):** `1.125rem` (`18px`), `line-height: 1.6`.
- **Body Regular (Párrafos y Tarjetas):** `1rem` (`16px`), `line-height: 1.6`.
- **Badges / Tags:** `0.75rem` (`12px`), `font-weight: 600`, `border-radius: 9999px`.

### 2.3. Layout, Contenedores y Sombras
- **Container Max-Width:** `1280px` o `1320px`, centrado (`margin: 0 auto`), con `padding-inline: 24px` (móvil) y `40px` (desktop).
- **Espaciado Vertical de Secciones (`padding-block`):** `96px` en Desktop / `64px` en Móvil.
- **Border Radius Estándar:** `16px` para tarjetas (`border-radius: 1rem`), `9999px` (píldora) para botones principales.
- **Sombra Corporativa (Card Shadow):** `0 10px 30px -5px rgba(10, 34, 57, 0.06)` con transición en hover a `0 20px 40px -10px rgba(10, 34, 57, 0.12)` y `transform: translateY(-5px)`.

---

## 3. Arquitectura y Contenido Detallado por Sección

### 3.1. Header / Barra de Navegación (`<header>`)
**Comportamiento UX/UI:**
- Posición fija superior (`position: sticky; top: 0; z-index: 50`).
- Fondo blanco translúcido (`background: rgba(255, 255, 255, 0.92); backdrop-filter: blur(12px)`), con borde inferior sutil (`1px solid rgba(10, 34, 57, 0.08)`).
- **Diseño limpio sin íconos en los enlaces del menú:** Usar únicamente texto tipográfico limpio con indicador inferior naranja (`2px solid #FF6B00`) en el ítem activo o en `:hover`.

**Estructura:**
1. **Izquierda (Brand):** Logo `360° PRO - SOLUCIONES INTEGRALES S.A.S.`
2. **Centro (Navegación Simplificada):**
   - `Inicio` (`#inicio`)
   - `Nosotros` (`#nosotros`)
   - `Servicios` (`#servicios`)
   - `Contacto` (`#contacto`)
3. **Derecha (CTA Header):** Botón tipo píldora en color naranja (`#FF6B00`), texto blanco en negrita: `Solicitar cotización` (anclado a `#contacto`).
4. **Móvil:** Botón hamburguesa minimalista que despliega un Drawer/Modal a pantalla completa con los enlaces centrados y el botón de cotización fijo en la parte inferior.

---

### 3.2. Sección 1: Inicio — Hero Banner (`#inicio`)
**Maquetación y Estilo Visual:**
- Altura mínima: `min-height: 85vh` en Desktop.
- **Fondo:** Imagen arquitectónica/corporativa moderna de alta resolución a la derecha, cubierta en el lado izquierdo por un corte diagonal o máscara de degradado en Azul Marino Profundo (`linear-gradient(105deg, #0A2239 0%, #0A2239 52%, rgba(10, 34, 57, 0.75) 70%, rgba(10, 34, 57, 0.2) 100%)`).
- En móvil, el degradado pasa a ser vertical para garantizar legibilidad del 100%.

**Contenido Exacto (Columna Izquierda - 60% ancho en Desktop):**
- **Eyebrow:** `SOLUCIONES INTEGRALES PARA TUS PROYECTOS` (acompañado de una línea horizontal corta en `#FF6B00`).
- **Título H1:** `IDEAS QUE CONSTRUYEN GRANDES RESULTADOS` *(Aplicar color `#FF6B00` a la palabra **CONSTRUYEN**, resto en blanco `#FFFFFF`)*.
- **Párrafo Principal (Copy Ejecutivo):**
  > En **360° Pro Soluciones Integrales S.A.S.** integramos conocimientos, experiencia y capacidades profesionales para ofrecer soluciones a las necesidades de empresas, instituciones, entidades públicas y clientes particulares. Desarrollamos servicios en arquitectura e ingeniería civil, construcción, mantenimiento y adecuaciones, publicidad y artes gráficas, suministros, logística operativa y consultoría técnica y ambiental.
- **Frase de Apoyo (Destacada en SemiBold blanco con borde izquierdo naranja):**
  > **Un solo aliado para múltiples soluciones.**
- **Grupo de Botones (Flexbox, apilables al 100% en móvil):**
  - **Botón Primario:** `Conoce nuestros servicios` (Fondo `#FF6B00`, texto blanco, acompañado a la derecha por un círculo blanco con flecha naranja `→` adentro, redirige a `#servicios`).
  - **Botón Secundario:** `Solicitar cotización` (Fondo transparente `rgba(255,255,255,0.08)`, borde `2px solid #FFFFFF`, texto blanco, redirige a `#contacto`).

---

### 3.3. Sección 2: Nuestros Servicios — Portafolio Corporativo (`#servicios`)
**Maquetación y Estilo Visual:**
- **Fondo de sección:** Gris hielo (`#F4F7FA`).
- **Grid Principal:** **3 columnas x 2 filas en Desktop** (`grid-template-columns: repeat(3, 1fr); gap: 28px`), 2 columnas en Tablet. *(Nota crítica: No colocar las 6 tarjetas en una sola fila para evitar que el texto se comprima)*.
- **Comportamiento Mobile:** En pantallas `< 768px`, implementar como carrusel deslizable horizontal (`display: flex; overflow-x: auto; scroll-snap-type: x mandatory`) mostrando el 85% de la tarjeta activa para invitar al swipe, o apilado limpio con márgenes generosos.

**Encabezado de Sección (Centrado, `max-width: 780px`):**
- **Eyebrow:** `— NUESTROS SERVICIOS —`
- **Título H2:** `Un solo aliado para` <span style="color:#FF6B00">`múltiples soluciones`</span> *(Subtítulo complementario: Soluciones integrales para cada necesidad)*.
- **Párrafo Introductorio:**
  > Ofrecemos un portafolio de servicios orientado a los sectores residencial, comercial, industrial, institucional y público. Integramos diferentes especialidades para brindar alternativas adaptadas a los requerimientos de cada proyecto, con atención profesional y compromiso con la calidad.

**Estructura de las 6 Tarjetas de Servicio:**
Cada tarjeta debe tener fondo blanco (`#FFFFFF`), `border-radius: 16px`, imagen superior con recorte curvo suave en la base, un **ícono circular flotante** superpuesto entre la imagen y el texto (intercalando azul `#0A2239` y naranja `#FF6B00` con borde blanco de `3px`), título `H3`, descripción, **píldoras (tags) de especialidades** y enlace inferior `Conocer servicios` con botón circular de flecha `→`.

#### Tarjeta 1: Arquitectura e Ingeniería Civil
- **Color del Ícono Flotante:** Azul (`#0A2239`) — Ícono: Edificio / Compás arquitectónico.
- **Descripción:** Diseñamos, planificamos y desarrollamos soluciones arquitectónicas y de ingeniería para proyectos residenciales, comerciales e institucionales.
- **Tags / Especialidades:** `Diseño arquitectónico` · `Planos` · `Ingeniería` · `Urbanismo`
- **CTA:** `Conocer servicios →`

#### Tarjeta 2: Construcción y Obras Civiles
- **Color del Ícono Flotante:** Naranja (`#FF6B00`) — Ícono: Casco de ingeniero / Grúa de construcción.
- **Descripción:** Desarrollamos proyectos de construcción, remodelación e infraestructura, integrando planificación, conocimiento técnico y seguimiento de obra.
- **Tags / Especialidades:** `Construcción` · `Infraestructura` · `Adecuaciones` · `Obras civiles`
- **CTA:** `Conocer servicios →`

#### Tarjeta 3: Mantenimiento, Reparaciones y Adecuaciones
- **Color del Ícono Flotante:** Azul (`#0A2239`) — Ícono: Rayo eléctrico / Herramientas técnicas.
- **Descripción:** Ofrecemos soluciones para conservar, reparar y mejorar viviendas, oficinas, locales comerciales e instalaciones institucionales.
- **Tags / Especialidades:** `Pintura` · `Plomería` · `Electricidad` · `Impermeabilización` · `Drywall`
- **CTA:** `Conocer servicios →`

#### Tarjeta 4: Publicidad, Diseño Gráfico y Artes Gráficas
- **Color del Ícono Flotante:** Naranja (`#FF6B00`) — Ícono: Monitor de diseño / Plotter de impresión.
- **Descripción:** Transformamos ideas en soluciones de comunicación visual mediante creatividad, diseño, publicidad, impresión y producción gráfica.
- **Tags / Especialidades:** `Identidad corporativa` · `Marketing digital` · `Gran formato` · `Señalización`
- **CTA:** `Conocer servicios →`

#### Tarjeta 5: Consultoría y Gestión Ambiental
- **Color del Ícono Flotante:** Azul (`#0A2239`) — Ícono: Hoja ecológica / Sostenibilidad.
- **Descripción:** Acompañamos proyectos orientados al manejo responsable de recursos naturales, la conservación de ecosistemas y la sostenibilidad.
- **Tags / Especialidades:** `Diagnósticos` · `Biodiversidad` · `Recursos hídricos` · `Restauración ecológica`
- **CTA:** `Conocer servicios →`

#### Tarjeta 6: Suministros y Logística Operativa
- **Color del Ícono Flotante:** Naranja (`#FF6B00`) — Ícono: Caja de suministro / Logística 3D.
- **Descripción:** Facilitamos el abastecimiento de equipos, materiales, dotaciones y suministros para las necesidades operativas de empresas e instituciones.
- **Tags / Especialidades:** `Equipos tecnológicos` · `Herramientas` · `Dotaciones` · `Abastecimiento`
- **CTA:** `Conocer servicios →`

---

### 3.4. Sub-sección Complementaria: Franja de Consultoría y Asesoría Técnica
*(Ubicada inmediatamente debajo del grid de las 6 tarjetas dentro de la sección de Servicios)*.

**Maquetación y Estilo Visual:**
- **Formato:** Banner horizontal tipo tarjeta de ancho completo (12 columnas), fondo azul hielo muy suave (`#EBF2F7`) con borde fino blanco y sombra suave.
- **Distribución Interna:**
  - **Izquierda (35% ancho):** Fotografía corporativa con corte diagonal a la derecha (Equipo de ingenieros y consultores analizando planos/proyectos ejecutivos).
  - **Derecha (65% ancho):** Contenido informativo + fila de 4 pilares con íconos + botón CTA a la derecha.

**Contenido Exacto:**
- **Título H3 Grande:** `CONSULTORÍA Y` <span style="color:#FF6B00">`ASESORÍA TÉCNICA`</span> (Acompañado de ícono circular azul a la izquierda).
- **Subtítulo en Negrita:** `Experiencia y conocimiento para impulsar tus proyectos.`
- **Descripción:**
  > Ofrecemos acompañamiento profesional en formulación, estructuración, evaluación, supervisión y gestión de proyectos para empresas y entidades públicas y privadas.
- **4 Íconos de Especialidad (Separados por líneas verticales sutiles):**
  1. `Formulación de proyectos`
  2. `Estudios de viabilidad`
  3. `Supervisión e interventoría`
  4. `Asesoría especializada`
- **Botón CTA Derecha:** `Explorar servicios` / `Conocer nuestros servicios →` (Fondo `#FF6B00`).

---

### 3.5. Sección 3: Nosotros — Identidad y Trayectoria (`#nosotros`)
**Maquetación y Estilo Visual:**
- **Fondo de sección:** Blanco puro (`#FFFFFF`).
- Dividida en 3 bloques jerárquicos:
  1. **Bloque Superior (2 Columnas 50/50):** Composición visual con sello de experiencia a la izquierda + Historia y Respaldo a la derecha.
  2. **Bloque Medio (2 Columnas):** Tarjetas destacadas de **Misión** y **Visión**.
  3. **Bloque Inferior (Grid 3x2 o 6 columnas):** Tarjetas de **Valores Corporativos**.

**Contenido Exacto — Bloque 1: ¿Quiénes somos? y Experiencia:**
- **Badge / Sello Visual Flotante (sobre la composición fotográfica izquierda):**
  - Número grande: `+25 Años`
  - Texto del sello: `De experiencia acumulada en nuestro equipo profesional`
- **Eyebrow:** `SOBRE NOSOTROS`
- **Título H2:** ` ¿Quiénes` <span style="color:#FF6B00">`somos?`</span>
- **Párrafos de Presentación:**
  > **360° Pro Soluciones Integrales S.A.S.** es una empresa colombiana con sede en **Villavicencio, Meta**, orientada a ofrecer soluciones integrales para los sectores público y privado.
  >
  > Nuestra propuesta reúne diferentes áreas de conocimiento y servicio, entre ellas arquitectura, ingeniería civil, construcción, mantenimiento, publicidad, artes gráficas, suministros, logística y consultoría especializada.
  >
  > Contamos con un equipo multidisciplinario que aporta conocimientos técnicos y experiencia profesional para atender las necesidades de cada cliente, promoviendo soluciones funcionales, responsables y adaptadas a los objetivos de cada proyecto.
- **Recuadro Destacado (Callout con borde izquierdo `#FF6B00` y fondo `#F4F7FA`):**
  - **Título:** `Experiencia que respalda nuestro trabajo`
  - **Texto:** Nuestro equipo profesional reúne **más de 25 años de experiencia acumulada** en el desarrollo de proyectos arquitectónicos, de infraestructura y de carácter institucional. Esta trayectoria corresponde a la experiencia de los profesionales que integran nuestro equipo y constituye un respaldo técnico para el desarrollo de nuevos proyectos.
  - **Frase Cierre:** *360° Pro: soluciones integrales, un solo aliado.*

**Contenido Exacto — Bloque 2: Misión y Visión (2 Tarjetas Lado a Lado):**
- **Tarjeta 1: Nuestra Misión** (Borde superior de `4px solid #0A2239`, fondo `#F4F7FA`)
  > Brindar soluciones integrales mediante servicios profesionales, técnicos, comerciales y operativos, respondiendo a las necesidades de nuestros clientes con calidad, responsabilidad, innovación y compromiso. Buscamos generar relaciones de confianza, optimizar recursos y aportar al desarrollo de proyectos sostenibles y eficientes.
- **Tarjeta 2: Nuestra Visión** (Borde superior de `4px solid #FF6B00`, fondo `#F4F7FA`)
  > Consolidarnos como una empresa reconocida a nivel regional y nacional por la calidad de nuestros servicios, la capacidad de integrar diferentes especialidades y el compromiso con nuestros clientes. Aspiramos a fortalecer nuestra presencia en los sectores público y privado, ampliando nuestras capacidades y construyendo relaciones comerciales duraderas.

**Contenido Exacto — Bloque 3: Nuestros Valores (Grid de 6 Tarjetas Minimalistas):**
1. **Responsabilidad:** Asumimos cada compromiso con seriedad y profesionalismo.
2. **Calidad:** Orientamos nuestro trabajo hacia resultados que respondan a las necesidades del cliente.
3. **Integridad:** Promovemos relaciones basadas en la honestidad y la transparencia.
4. **Innovación:** Buscamos soluciones prácticas y oportunidades de mejoramiento.
5. **Trabajo en equipo:** Integramos conocimientos y capacidades para alcanzar objetivos comunes.
6. **Compromiso:** Trabajamos con dedicación en cada etapa de nuestros servicios.

---

### 3.6. Sección 4: ¿Por Qué Elegirnos? — Diferenciadores (`#por-que-elegirnos`)
**Maquetación y Estilo Visual:**
- **Fondo de sección:** Modo Oscuro Corporativo (`#0A2239`) con un patrón geométrico arquitectónico muy sutil de fondo (`opacity: 0.04`).
- **Diseño de Tarjetas de Fortalezas:** Estilo *Glassmorphism* ejecutivo (`background: rgba(255, 255, 255, 0.05)`, `border: 1px solid rgba(255, 255, 255, 0.1)`, `backdrop-filter: blur(8px)`), en un **Grid de 3 columnas x 2 filas**.

**Contenido Exacto:**
- **Eyebrow:** `¿POR QUÉ ELEGIRNOS?` (Color `#FF6B00`)
- **Título H2 (Blanco):** `Un solo aliado,` <span style="color:#FF6B00">`múltiples soluciones`</span>
- **Párrafo Introductorio (Color `#CBD5E1`):**
  > En **360° Pro Soluciones Integrales S.A.S.** creemos que cada proyecto merece atención profesional, soluciones adecuadas y un acompañamiento responsable. Integramos diferentes especialidades para facilitar la gestión de las necesidades de nuestros clientes, ofreciendo alternativas técnicas, comerciales y operativas desde una misma organización.

**Grid de 6 Fortalezas ("Nuestras fortalezas"):**
1. **Experiencia profesional:** Contamos con un equipo multidisciplinario que aporta conocimientos y trayectoria en diferentes áreas de servicio.
2. **Soluciones integrales:** Reunimos distintas capacidades profesionales y operativas para atender múltiples necesidades desde un solo aliado.
3. **Atención personalizada:** Escuchamos los requerimientos de cada cliente para proponer alternativas adaptadas a sus objetivos.
4. **Compromiso con la calidad:** Orientamos nuestros procesos hacia la responsabilidad, el cumplimiento y el mejoramiento continuo.
5. **Visión técnica y estratégica:** Combinamos planificación, análisis y conocimientos especializados para apoyar el desarrollo de proyectos.
6. **Versatilidad de servicios:** Atendemos necesidades de los sectores residencial, comercial, industrial, institucional y público.

**Banner Interno de Cierre de Sección:**
- Contenedor horizontal degradado o bordeado en naranja dentro de la misma sección:
  - **Título:** `Tu proyecto, nuestro compromiso`
  - **Subtítulo:** `Más que ofrecer servicios, buscamos construir relaciones de confianza y soluciones que generen valor.`
  - **Botón CTA:** `Hablemos de tu proyecto` (Fondo `#FF6B00`, redirige a `#contacto`).

---

### 3.7. Sección 5: Contacto y Cotizaciones (`#contacto`)
**Maquetación y Estilo Visual:**
- **Fondo de sección:** Blanco (`#FFFFFF`) o Gris Hielo suave (`#F4F7FA`).
- **Layout de 2 Columnas (45% Columna Informativa Izquierda / 55% Tarjeta de Formulario Derecha):**

**Columna Izquierda — Información de Contacto:**
- **Eyebrow:** `CONTACTO`
- **Título H2:** `Estamos listos para conocer` <span style="color:#FF6B00">`tu proyecto`</span>
- **Subtítulo:** `Hablemos de tus ideas y encontremos juntos la mejor solución.`
- **Párrafo:**
  > En **360° Pro Soluciones Integrales S.A.S.** estamos disponibles para recibir tus consultas, conocer tus necesidades y orientarte sobre nuestros servicios. Si necesitas una cotización, asesoría profesional, información sobre suministros o acompañamiento para desarrollar un proyecto, comunícate con nosotros.
- **Lista de Datos Oficiales (Tarjetas compactas con ícono circular a la izquierda):**
  - **Empresa:** `360° Pro Soluciones Integrales S.A.S.`
  - **WhatsApp comercial:** `301 540 9222` *(Enlace directo: `https://wa.me/573015409222`)*
  - **Teléfono alternativo:** `313 767 6692` *(Enlace `tel:+573137676692`)*
  - **Correo electrónico:** `360psi.sas@gmail.com` *(Enlace `mailto:360psi.sas@gmail.com`)*
  - **Dirección:** `Carrera 17 N.º 32A-03, Urbanización El Bosque.`
  - **Ciudad:** `Villavicencio, Meta, Colombia.`
- **Botón de Acción Directa:**
  - `Escríbenos por WhatsApp` (Botón destacado con ícono oficial de WhatsApp, enlace directo a `https://wa.me/573015409222`).

**Columna Derecha — Tarjeta de Formulario ("Solicita tu cotización"):**
- Contenedor blanco (`#FFFFFF`), `padding: 40px`, `border-radius: 20px`, sombra ejecutiva.
- **Encabezado del Formulario:**
  - **Título H3:** `Solicita tu cotización`
  - **Descripción:** `Cuéntanos qué necesitas. Nuestro equipo revisará tu solicitud para brindarte información sobre los servicios que podemos ofrecerte.`
- **Campos del Formulario (`<form>`):**
  1. `Nombre completo o Razón Social` (Input text, requerido).
  2. `Correo electrónico` y `Teléfono / WhatsApp` (En fila de 2 columnas en Desktop, requeridos).
  3. `Línea de servicio de interés` (Select desplegable con las opciones):
     - *Arquitectura e Ingeniería Civil*
     - *Construcción y Obras Civiles*
     - *Mantenimiento, Reparaciones y Adecuaciones*
     - *Publicidad, Diseño Gráfico y Artes Gráficas*
     - *Consultoría y Gestión Ambiental*
     - *Suministros y Logística Operativa*
     - *Consultoría y Asesoría Técnica*
     - *Múltiples servicios / Otro*
  4. `Mensaje o descripción del requerimiento` (Textarea, 4 filas).
  5. Checkbox de aceptación de Política de Tratamiento de Datos Personales (Habeas Data Colombia).
  6. **Botón Submit (100% ancho):** `Enviar solicitud` (Fondo `#FF6B00`, texto blanco en negrita).

---

### 3.8. Footer Corporativo (`<footer>`)
- **Fondo:** `#061524`, texto en `#CBD5E1`.
- **Distribución en 4 Columnas:**
  1. **Marca:** Logo `360° PRO Soluciones Integrales S.A.S.` en versión blanca + eslogan *"360° Pro: soluciones integrales, un solo aliado."*
  2. **Enlaces Rápidos:** Inicio, Nosotros, Servicios, ¿Por qué elegirnos?, Contacto.
  3. **Portafolio de Servicios:** Accesos directos a las 6 líneas de negocio y Consultoría Técnica.
  4. **Contacto Directo:** Dirección en Villavicencio (Carrera 17 N.º 32A-03, Urb. El Bosque), teléfonos (`301 540 9222` / `313 767 6692`) y correo (`360psi.sas@gmail.com`).
- **Barra Inferior (Copyright):** `© 2026 360° Pro Soluciones Integrales S.A.S. Todos los derechos reservados. | Villavicencio, Meta, Colombia.`

---

## 4. Requerimientos Técnicos de Implementación para Antigravity
1. **Semántica y SEO Local:** Utilizar etiquetas HTML5 semánticas (`<header>`, `<main>`, `<section>`, `<article>`, `<footer>`), meta-etiquetas optimizadas para *"Soluciones integrales en Villavicencio, Meta — Arquitectura, Obras Civiles, Mantenimiento, Publicidad, Suministros y Consultoría"* y atributos `alt` descriptivos en todas las imágenes.
2. **Navegación Suave:** Aplicar `scroll-behavior: smooth` en el documento y `scroll-margin-top: 90px` en cada `<section id="...">` para que el header fijo no tape los títulos al hacer clic en el menú.
3. **Botón Flotante de WhatsApp (FAB):** Incluir un botón circular flotante en la esquina inferior derecha (`bottom: 24px; right: 24px; z-index: 60`) con enlace directo a WhatsApp (`301 540 9222`) y animación sutil de pulso.
4. **Accesibilidad y Estados Interactivos:** Todos los inputs deben tener estados `:focus` claros con anillo en color `#FF6B00` o `#133C63`, y los botones deben tener transiciones suaves (`transition: all 0.25s ease`).
