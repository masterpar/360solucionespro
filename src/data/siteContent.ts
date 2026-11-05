export interface ServiceItem {
  id: string;
  number: string;
  title: string;
  selectValue: string;
  accentColor: 'primary' | 'accent';
  iconName: 'architecture' | 'construction' | 'maintenance' | 'graphics' | 'environment' | 'logistics';
  description: string;
  tags: string[];
  /** Nombre base de la imagen optimizada en /public/images (ver src/data/images.ts) */
  image: string;
  fallbackImage: string;
  imageAlt: string;
}

export interface ScrollWorldScene {
  id: string;
  beatNumber: string;
  chapterLabel: string;
  eyebrow: string;
  title: string;
  highlight: string;
  description: string;
  metrics: string;
  tags: string[];
  stillImage: string;
  fallbackStill: string;
  /** Optional oso95/scroll-world video chain slots (drop MP4s in /public/videos/ when ready) */
  diveVideo?: string;
  connectorVideo?: string;
  serviceValue: string;
  hudPosition: 'left' | 'right';
}

export interface ValueItem {
  number: string;
  title: string;
  description: string;
  icon: string;
}

export interface StrengthItem {
  number: string;
  title: string;
  description: string;
  icon: string;
}

export const navLinks = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Nosotros', href: '#nosotros' },
  { label: 'Servicios', href: '#servicios' },
  { label: 'Contacto', href: '#contacto' },
];

export const scrollWorldScenes: ScrollWorldScene[] = [
  {
    id: 'beat-arquitectura',
    beatNumber: '01',
    chapterLabel: 'Arquitectura',
    eyebrow: 'CAPÍTULO 01 · DISEÑO Y ESTRUCTURACIÓN',
    title: 'Arquitectura e',
    highlight: 'Ingeniería Civil',
    description:
      'Planificación espacial, estudios técnicos, diseños estructurales y urbanismo de alta precisión para obras públicas, institucionales y privadas.',
    metrics: 'BIM · Planimetría · Cálculo Estructural',
    tags: ['Diseño arquitectónico', 'Planos', 'Ingeniería', 'Urbanismo'],
    stillImage: '/images/scene-01-arquitectura-1920.webp',
    fallbackStill: '/images/scene-01-arquitectura.jpg',
    serviceValue: 'Arquitectura e Ingeniería Civil',
    hudPosition: 'left',
  },
  {
    id: 'beat-construccion',
    beatNumber: '02',
    chapterLabel: 'Obras Civiles',
    eyebrow: 'CAPÍTULO 02 · EJECUCIÓN E INFRAESTRUCTURA',
    title: 'Construcción y',
    highlight: 'Obras Civiles',
    description:
      'Ejecución rigurosa de edificaciones, infraestructura vial, institucional y comercial bajo estándares técnicos superiores y control de obra.',
    metrics: 'Control Técnico · Seguridad · Cumplimiento',
    tags: ['Construcción', 'Infraestructura', 'Adecuaciones', 'Obras civiles'],
    stillImage: '/images/scene-02-construccion-1920.webp',
    fallbackStill: '/images/scene-02-construccion.jpg',
    serviceValue: 'Construcción y Obras Civiles',
    hudPosition: 'right',
  },
  {
    id: 'beat-mantenimiento',
    beatNumber: '03',
    chapterLabel: 'Mantenimiento',
    eyebrow: 'CAPÍTULO 03 · CONSERVACIÓN INTEGRAL',
    title: 'Mantenimiento y',
    highlight: 'Adecuaciones',
    description:
      'Modernización, mantenimiento preventivo y correctivo para instalaciones corporativas, entidades estatales, oficinas y complejos residenciales.',
    metrics: 'Redes Eléctricas · Hidrosanitarias · Acabados',
    tags: ['Pintura', 'Plomería', 'Electricidad', 'Impermeabilización', 'Drywall'],
    stillImage: '/images/scene-03-mantenimiento-1920.webp',
    fallbackStill: '/images/scene-03-mantenimiento.jpg',
    serviceValue: 'Mantenimiento, Reparaciones y Adecuaciones',
    hudPosition: 'left',
  },
  {
    id: 'beat-publicidad',
    beatNumber: '04',
    chapterLabel: 'Artes Gráficas',
    eyebrow: 'CAPÍTULO 04 · COMUNICACIÓN VISUAL',
    title: 'Publicidad y',
    highlight: 'Artes Gráficas',
    description:
      'Producción gráfica industrial, señalización arquitectónica y normativa, branding corporativo e impresión en gran formato de alto impacto.',
    metrics: 'Gran Formato · Señalética · Branding B2B',
    tags: ['Identidad corporativa', 'Marketing digital', 'Gran formato', 'Señalización'],
    stillImage: '/images/scene-04-publicidad-1920.webp',
    fallbackStill: '/images/scene-04-publicidad.jpg',
    serviceValue: 'Publicidad, Diseño Gráfico y Artes Gráficas',
    hudPosition: 'right',
  },
  {
    id: 'beat-ambiental',
    beatNumber: '05',
    chapterLabel: 'Ambiental',
    eyebrow: 'CAPÍTULO 05 · TERRITORIO Y SOSTENIBILIDAD',
    title: 'Consultoría y',
    highlight: 'Gestión Ambiental',
    description:
      'Estudios ambientales, manejo responsable de recursos hídricos, conservación de biodiversidad y restauración ecológica en proyectos regionales.',
    metrics: 'Diagnósticos · Biodiversidad · Sostenibilidad',
    tags: ['Diagnósticos', 'Biodiversidad', 'Recursos hídricos', 'Restauración ecológica'],
    stillImage: '/images/scene-05-ambiental-1920.webp',
    fallbackStill: '/images/scene-05-ambiental.jpg',
    serviceValue: 'Consultoría y Gestión Ambiental',
    hudPosition: 'left',
  },
  {
    id: 'beat-suministros',
    beatNumber: '06',
    chapterLabel: 'Suministros',
    eyebrow: 'CAPÍTULO 06 · CAPACIDAD OPERATIVA',
    title: 'Suministros y',
    highlight: 'Logística Operativa',
    description:
      'Abastecimiento oportuno de tecnología, herramientas especializadas, dotaciones industriales e insumos estratégicos para contratos y operaciones.',
    metrics: ' Dotación · Equipos · Abastecimiento B2B/B2G',
    tags: ['Equipos tecnológicos', 'Herramientas', 'Dotaciones', 'Abastecimiento'],
    stillImage: '/images/scene-06-suministros-1920.webp',
    fallbackStill: '/images/scene-06-suministros.jpg',
    serviceValue: 'Suministros y Logística Operativa',
    hudPosition: 'right',
  },
];

export const servicesList: ServiceItem[] = [
  {
    id: 'arquitectura-ingenieria',
    number: '01',
    title: 'Arquitectura e Ingeniería Civil',
    selectValue: 'Arquitectura e Ingeniería Civil',
    accentColor: 'primary',
    iconName: 'architecture',
    description:
      'Diseñamos, planificamos y desarrollamos soluciones arquitectónicas y de ingeniería para proyectos residenciales, comerciales e institucionales.',
    tags: ['Diseño arquitectónico', 'Planos', 'Ingeniería', 'Urbanismo'],
    image: 'scene-01-arquitectura',
    fallbackImage: '/images/scene-01-arquitectura.jpg',
    imageAlt:
      'Diseño arquitectónico, planos técnicos e ingeniería civil en Villavicencio por 360° Pro Soluciones Integrales',
  },
  {
    id: 'construccion-obras-civiles',
    number: '02',
    title: 'Construcción y Obras Civiles',
    selectValue: 'Construcción y Obras Civiles',
    accentColor: 'accent',
    iconName: 'construction',
    description:
      'Desarrollamos proyectos de construcción, remodelación e infraestructura, integrando planificación, conocimiento técnico y seguimiento de obra.',
    tags: ['Construcción', 'Infraestructura', 'Adecuaciones', 'Obras civiles'],
    image: 'scene-02-construccion',
    fallbackImage: '/images/scene-02-construccion.jpg',
    imageAlt:
      'Ejecución de construcción, infraestructura y obras civiles con supervisión profesional',
  },
  {
    id: 'mantenimiento-adecuaciones',
    number: '03',
    title: 'Mantenimiento, Reparaciones y Adecuaciones',
    selectValue: 'Mantenimiento, Reparaciones y Adecuaciones',
    accentColor: 'primary',
    iconName: 'maintenance',
    description:
      'Ofrecemos soluciones para conservar, reparar y mejorar viviendas, oficinas, locales comerciales e instalaciones institucionales.',
    tags: ['Pintura', 'Plomería', 'Electricidad', 'Impermeabilización', 'Drywall'],
    image: 'scene-03-mantenimiento',
    fallbackImage: '/images/scene-03-mantenimiento.jpg',
    imageAlt:
      'Servicios técnicos de mantenimiento locativo, electricidad, plomería, drywall y adecuaciones',
  },
  {
    id: 'publicidad-artes-graficas',
    number: '04',
    title: 'Publicidad, Diseño Gráfico y Artes Gráficas',
    selectValue: 'Publicidad, Diseño Gráfico y Artes Gráficas',
    accentColor: 'accent',
    iconName: 'graphics',
    description:
      'Transformamos ideas en soluciones de comunicación visual mediante creatividad, diseño, publicidad, impresión y producción gráfica.',
    tags: ['Identidad corporativa', 'Marketing digital', 'Gran formato', 'Señalización'],
    image: 'scene-04-publicidad',
    fallbackImage: '/images/scene-04-publicidad.jpg',
    imageAlt:
      'Estudio de publicidad, diseño gráfico, impresión en gran formato y señalización corporativa',
  },
  {
    id: 'consultoria-ambiental',
    number: '05',
    title: 'Consultoría y Gestión Ambiental',
    selectValue: 'Consultoría y Gestión Ambiental',
    accentColor: 'primary',
    iconName: 'environment',
    description:
      'Acompañamos proyectos orientados al manejo responsable de recursos naturales, la conservación de ecosistemas y la sostenibilidad.',
    tags: ['Diagnósticos', 'Biodiversidad', 'Recursos hídricos', 'Restauración ecológica'],
    image: 'scene-05-ambiental',
    fallbackImage: '/images/scene-05-ambiental.jpg',
    imageAlt:
      'Consultoría ambiental, gestión de recursos hídricos y restauración ecológica en Colombia',
  },
  {
    id: 'suministros-logistica',
    number: '06',
    title: 'Suministros y Logística Operativa',
    selectValue: 'Suministros y Logística Operativa',
    accentColor: 'accent',
    iconName: 'logistics',
    description:
      'Facilitamos el abastecimiento de equipos, materiales, dotaciones y suministros para las necesidades operativas de empresas e instituciones.',
    tags: ['Equipos tecnológicos', 'Herramientas', 'Dotaciones', 'Abastecimiento'],
    image: 'scene-06-suministros',
    fallbackImage: '/images/scene-06-suministros.jpg',
    imageAlt:
      'Centro de suministros corporativos, dotaciones industriales y logística operativa',
  },
];

export const consultingPillars = [
  {
    title: 'Formulación de proyectos',
    icon: 'clipboard',
  },
  {
    title: 'Estudios de viabilidad',
    icon: 'chart',
  },
  {
    title: 'Supervisión e interventoría',
    icon: 'shield-check',
  },
  {
    title: 'Asesoría especializada',
    icon: 'compass',
  },
];

export const corporateValues: ValueItem[] = [
  {
    number: '01',
    title: 'Responsabilidad',
    description: 'Asumimos cada compromiso con seriedad y profesionalismo.',
    icon: 'shield',
  },
  {
    number: '02',
    title: 'Calidad',
    description: 'Orientamos nuestro trabajo hacia resultados que respondan a las necesidades del cliente.',
    icon: 'award',
  },
  {
    number: '03',
    title: 'Integridad',
    description: 'Promovemos relaciones basadas en la honestidad y la transparencia.',
    icon: 'scale',
  },
  {
    number: '04',
    title: 'Innovación',
    description: 'Buscamos soluciones prácticas y oportunidades de mejoramiento.',
    icon: 'lightbulb',
  },
  {
    number: '05',
    title: 'Trabajo en equipo',
    description: 'Integramos conocimientos y capacidades para alcanzar objetivos comunes.',
    icon: 'users',
  },
  {
    number: '06',
    title: 'Compromiso',
    description: 'Trabajamos con dedicación en cada etapa de nuestros servicios.',
    icon: 'target',
  },
];

export const corporateStrengths: StrengthItem[] = [
  {
    number: '01',
    title: 'Experiencia profesional',
    description:
      'Contamos con un equipo multidisciplinario que aporta conocimientos y trayectoria en diferentes áreas de servicio.',
    icon: 'briefcase',
  },
  {
    number: '02',
    title: 'Soluciones integrales',
    description:
      'Reunimos distintas capacidades profesionales y operativas para atender múltiples necesidades desde un solo aliado.',
    icon: 'layers',
  },
  {
    number: '03',
    title: 'Atención personalizada',
    description:
      'Escuchamos los requerimientos de cada cliente para proponer alternativas adaptadas a sus objetivos.',
    icon: 'user-check',
  },
  {
    number: '04',
    title: 'Compromiso con la calidad',
    description:
      'Orientamos nuestros procesos hacia la responsabilidad, el cumplimiento y el mejoramiento continuo.',
    icon: 'check-badge',
  },
  {
    number: '05',
    title: 'Visión técnica y estratégica',
    description:
      'Combinamos planificación, análisis y conocimientos especializados para apoyar el desarrollo de proyectos.',
    icon: 'compass-draft',
  },
  {
    number: '06',
    title: 'Versatilidad de servicios',
    description:
      'Atendemos necesidades de los sectores residencial, comercial, industrial, institucional y público.',
    icon: 'grid',
  },
];

export const serviceSelectOptions = [
  'Arquitectura e Ingeniería Civil',
  'Construcción y Obras Civiles',
  'Mantenimiento, Reparaciones y Adecuaciones',
  'Publicidad, Diseño Gráfico y Artes Gráficas',
  'Consultoría y Gestión Ambiental',
  'Suministros y Logística Operativa',
  'Consultoría y Asesoría Técnica',
  'Múltiples servicios / Otro',
];

export const companyContact = {
  name: '360° Pro Soluciones Integrales S.A.S.',
  whatsappDisplay: '301 540 9222',
  whatsappUrl: 'https://wa.me/573015409222',
  altPhoneDisplay: '313 767 6692',
  altPhoneUrl: 'tel:+573137676692',
  email: '360psi.sas@gmail.com',
  emailUrl: 'mailto:360psi.sas@gmail.com',
  address: 'Carrera 17 N.º 32A-03, Urbanización El Bosque.',
  city: 'Villavicencio, Meta, Colombia.',
};
