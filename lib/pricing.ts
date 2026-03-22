export type MainCategory = 'estufas' | 'otros' | 'mantenciones';

export type EstufaFuel = 'pellet' | 'lena';
export type EstufaMode =
  | 'muro'
  | 'muro_salida_techo'
  | 'preexistente_1'
  | 'preexistente_2'
  | 'techo';

export type OtherService =
  | 'aire_split'
  | 'motor_porton'
  | 'termo_electrico'
  | 'calefont'
  | 'cerradura_digital'
  | 'bomba_calor_piscina'
  | 'cargador_auto';

export type MantencionService =
  | 'estufa_pellet'
  | 'aire_acondicionado'
  | 'calefont'
  | 'termo_hasta_200'
  | 'termo_mas_200'
  | 'bomba_calor_piscina';

export type QuoteForm = {
  promoCode?: string;
  category: MainCategory;

  region: string;
  comuna: string;

  fuelType?: EstufaFuel;
  estufaMode?: EstufaMode;
  vivienda?: string;
  pisos?: string;
  metrosTotales?: number;
  metrosAdicionales?: number;
  tipoTecho?: string;
  formaTecho?: string;
  tipoCielo?: string;
  materialMuro?: string;
  tieneCobertizo?: string;
  tipoTechoCobertizo?: string;
  salidaMuro?: string;
  quiereJuegoCodos?: string;
  yaTieneEstufa?: string;
  metrajeCalefaccionar?: string;

  otherService?: OtherService;
  aireMetros?: number;

  mantencionService?: MantencionService;
};

export type QuoteResult = {
  factible: boolean;
  titulo: string;
  manoObraBase: number;
  adicionalesManoObra: { label: string; amount: number }[];
  descuentoCiudad: number;
  recargoComuna: number;
  totalManoObra: number;
  materiales: string[];
  observaciones: string[];
  recomendacionEstufa?: string;
  comunaEsUrbana: boolean;
  promoCode?: string;
  promoDiscount?: number;
  promoValid?: boolean;
  promoLabel?: string;
};

type RegionCoverage = {
  urbanas: string[];
  adicionales: Record<string, number>;
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatMoney(value: number) {
  return `$${value.toLocaleString('es-CL')}`;
}

const PROMO_CODES: Record<
  string,
  { type: 'fixed' | 'percent'; amount: number; label: string }
> = {
  FERRETERIAMADRID: { type: 'fixed', amount: 30000, label: 'Ferretería convenio' },
  COPELEC: { type: 'fixed', amount: 30000, label: 'Campaña JEGAL' },
  FERREMAX10: { type: 'percent', amount: 10, label: 'Ferretería %' },
};

function getPromoDiscount(total: number, promoCode?: string) {
  if (!promoCode) {
    return {
      amount: 0,
      valid: false,
      label: '',
      code: '',
    };
  }

  const code = normalizeText(promoCode).replace(/\s+/g, '').toUpperCase();

  const found = Object.entries(PROMO_CODES).find(
    ([key]) => normalizeText(key).replace(/\s+/g, '').toUpperCase() === code
  );

  if (!found) {
    return {
      amount: 0,
      valid: false,
      label: '',
      code,
    };
  }

  const [, promo] = found;

  const amount =
    promo.type === 'fixed'
      ? promo.amount
      : Math.round((total * promo.amount) / 100);

  return {
    amount,
    valid: true,
    label: promo.label,
    code,
  };
}

function getEstufaRecommendation(metraje?: string) {
  if (!metraje) return '';

  const mapping: Record<string, string> = {
    hasta_100: 'Bambú 6000',
    hasta_120: 'Italy 6100',
    hasta_160: 'Italy 8100 Plus',
    mas_160: 'Slim 9000',
  };

  return mapping[metraje] || '';
}

function getAirePrice(metros?: number) {
  const map: Record<number, number> = {
    3: 150000,
    4: 170000,
    5: 190000,
    6: 210000,
    7: 230000,
    8: 250000,
    9: 270000,
    10: 290000,
    11: 310000,
    12: 330000,
    13: 350000,
    14: 370000,
    15: 390000,
    16: 410000,
    17: 430000,
    18: 450000,
    19: 470000,
    20: 490000,
  };

  return metros ? map[metros] || 0 : 0;
}

function getOtherServiceBasePrice(service?: OtherService, aireMetros?: number) {
  switch (service) {
    case 'aire_split':
      return getAirePrice(aireMetros);
    case 'motor_porton':
      return 110000;
    case 'termo_electrico':
      return 135000;
    case 'calefont':
      return 110000;
    case 'cerradura_digital':
      return 80000;
    case 'bomba_calor_piscina':
      return 350000;
    case 'cargador_auto':
      return 1990000;
    default:
      return 0;
  }
}

function getMantencionBasePrice(service?: MantencionService) {
  switch (service) {
    case 'estufa_pellet':
      return 80000;
    case 'aire_acondicionado':
      return 50000;
      return 65000;
    case 'calefont':
      return 79900;
    case 'termo_hasta_200':
      return 120000;
    case 'termo_mas_200':
      return 180000;
    case 'bomba_calor_piscina':
      return 150000;
    default:
      return 0;
  }
}

export const REGION_DATA: Record<string, RegionCoverage> = {
  'region de arica y parinacota': {
    urbanas: ['arica', 'azapa'],
    adicionales: {
      'valle de lluta': 24000,
      camarones: 84800,
      putre: 113600,
      'general lagos': 126400,
    },
  },
  'region de tarapaca': {
    urbanas: ['iquique', 'alto hospicio'],
    adicionales: {
      'pozo almonte': 44800,
      huara: 62400,
      pica: 95200,
      camina: 155200,
      colchane: 189600,
    },
  },
  'region de antofagasta': {
    urbanas: ['antofagasta', 'calama'],
    adicionales: {
      mejillones: 52800,
      'sierra gorda': 117600,
      tocopilla: 150400,
      taltal: 164800,
      'maria elena': 82400,
      'san pedro de atacama': 80000,
      ollague: 330400,
    },
  },
  'region de atacama': {
    urbanas: ['copiapo', 'tierra amarilla', 'vallenar'],
    adicionales: {
      caldera: 62400,
      chanaral: 135200,
      'diego de almagro': 120000,
      freirina: 28000,
      huasco: 40000,
      'alto del carmen': 34400,
    },
  },
  'region de coquimbo': {
    urbanas: ['la serena', 'coquimbo', 'ovalle', 'illapel'],
    adicionales: {
      'la higuera': 48800,
      andacollo: 46400,
      vicuna: 50400,
      paihuano: 70400,
      'rio hurtado': 62400,
      'monte patria': 27200,
      punitaqui: 23200,
      combarbala: 70400,
      salamanca: 25600,
      'los vilos': 51200,
      canela: 62400,
    },
  },
  'region de valparaiso': {
    urbanas: [
      'valparaiso',
      'vina del mar',
      'concon',
      'quilpue',
      'san antonio',
      'cartagena',
      'santo domingo',
      'quilota',
      'la cruz',
      'hijuelas',
      'los andes',
      'san felipe',
      'calle larga',
      'rinconada',
      'san esteban',
      'la ligua',
      'cabildo',
    ],
    adicionales: {
      'villa alemana': 23200,
      casablanca: 32800,
      quintero: 38400,
      puchuncavi: 42400,
      'el quisco': 28800,
      'el tabo': 23200,
      algarrobo: 29800,
      nogales: 19200,
      'santa maria': 16900,
      putaendo: 29000,
      catemu: 36900,
      'llay llay': 39200,
      panquehue: 24000,
      petorca: 43200,
      papudo: 19200,
      zapallar: 29000,
    },
  },
  'region metropolitana': {
    urbanas: [
      'santiago',
      'vitacura',
      'la reina',
      'puente alto',
      'san miguel',
      'lo espejo',
      'estacion central',
      'renca',
      'conchali',
      'huechuraba',
      'la pintana',
      'providencia',
      'lo barnechea',
      'penalolen',
      'san joaquin',
      'la cisterna',
      'pedro aguirre cerda',
      'quinta normal',
      'pudahuel',
      'independencia',
      'san ramon',
      'maipu',
      'las condes',
      'nunoa',
      'la florida',
      'macul',
      'el bosque',
      'cerrillos',
      'cerro navia',
      'quilicura',
      'recoleta',
      'la granja',
    ],
    adicionales: {
      lampa: 28000,
      'san jose de maipo': 42400,
      buin: 29900,
      penaflor: 25600,
      melipilla: 56900,
      colina: 26400,
      tiltil: 49900,
      'san bernardo': 16000,
      paine: 36000,
      'el monte': 39200,
      alhue: 109000,
      pirque: 32000,
      'calera de tango': 22400,
      talagante: 33600,
      'isla de maipo': 40000,
      'san pedro': 96400,
    },
  },
  'region de ohiggins': {
    urbanas: [
      'rancagua',
      'machali',
      'graneros',
      'olivar',
      'requinoa',
      'codegua',
      'san fernando',
      'chimbarongo',
      'placilla',
      'santa cruz',
      'palmilla',
      'pichilemu',
    ],
    adicionales: {
      malloa: 20000,
      peralillo: 18400,
      lolol: 26400,
      pumanque: 36900,
      navidad: 76000,
      litueche: 49600,
      marchihue: 44000,
      paredones: 38400,
    },
  },
  'region del maule': {
    urbanas: [
      'talca',
      'maule',
      'san rafael',
      'molina',
      'rauco',
      'linares',
      'yerbas buenas',
      'longavi',
      'cauquenes',
    ],
    adicionales: {
      pelarco: 20800,
      'rio claro': 40000,
      curico: 32800,
      teno: 38400,
      romeral: 42400,
      'sagrada familia': 17600,
      licanten: 71200,
      vichuquen: 83200,
      hualane: 56800,
      colbun: 24000,
      'villa alegre': 21600,
      parral: 43200,
      retiro: 52800,
      chancho: 36000,
      pelluhue: 30400,
      constitucion: 85600,
    },
  },
  'region de nuble': {
    urbanas: ['chillan', 'chillan viejo'],
    adicionales: {
      bulnes: 10000,
      'san ignacio': 10000,
      pinto: 20000,
      coihueco: 21600,
      'san carlos': 10000,
      niquen: 48000,
      'san nicolas': 20000,
      quirihue: 55200,
      ninhue: 36800,
      portezuelo: 27200,
      coelemu: 57600,
      trehuaco: 68800,
      ranquil: 43200,
      cobquecura: 82400,
      yungay: 53600,
      'el carmen': 33600,
      pemuco: 36800,
    },
  },
  'region del bio bio': {
    urbanas: [
      'concepcion',
      'talcahuano',
      'hualpen',
      'san pedro de la paz',
      'chiguayante',
      'penco',
      'los angeles',
    ],
    adicionales: {
      coronel: 10000,
      lota: 15000,
      tome: 15000,
      dichato: 29600,
      nacimiento: 28000,
      negrete: 26400,
      laja: 36800,
      cabrero: 45600,
      yumbel: 40800,
      mulchen: 31200,
      'santa barbara': 32000,
      quilleco: 32800,
      tucapel: 38400,
      antuco: 52000,
      'alto bio bio': 71200,
      canete: 80000,
      lebu: 80000,
      curanilahue: 80000,
      'los alamos': 100000,
      contulmo: 100000,
      tirua: 120000,
    },
  },
  'region de la araucania': {
    urbanas: ['temuco', 'padre las casas', 'angol', 'villarrica', 'victoria'],
    adicionales: {
      lautaro: 24000,
      vilcun: 29600,
      perquenco: 35200,
      freire: 21600,
      renaico: 16800,
      collipulli: 24800,
      'los sauces': 24800,
      puren: 42400,
      lumaco: 43200,
      traiguen: 52800,
      pucon: 20000,
      loncoche: 33600,
      pitrufquen: 46400,
      curarrehue: 48800,
      melipeuco: 75200,
      curacautin: 45600,
      ercilla: 17600,
    },
  },
  'region de los rios': {
    urbanas: ['valdivia', 'corral'],
    adicionales: {
      mafil: 31200,
      mariquina: 38400,
      paillaco: 38400,
      'la union': 68000,
      'rio bueno': 64000,
      'lago ranco': 84800,
      futrono: 75200,
      panguipulli: 84800,
      lanco: 56000,
    },
  },
  'region de los lagos': {
    urbanas: [
      'puerto montt',
      'puerto varas',
      'llanquihue',
      'osorno',
      'san pablo',
      'castro',
      'dalcahue',
      'chonchi',
      'chaiten',
    ],
    adicionales: {
      calbuco: 44000,
      frutillar: 36800,
      'rio negro': 28000,
      purranque: 32000,
      puyehue: 38400,
      'san juan de la costa': 28000,
      ancud: 66400,
      quellon: 68000,
      quemchi: 52000,
      queilen: 50400,
      quinchao: 39200,
      puqueldon: 32800,
      'curaco de velez': 22400,
      futaleufu: 120800,
      hualaihue: 132000,
      palena: 116800,
    },
  },
};

export function getRegionOptions() {
  return Object.keys(REGION_DATA);
}

export function getComunasByRegion(region: string) {
  const regionKey = normalizeText(region);
  const entry = Object.entries(REGION_DATA).find(
    ([key]) => normalizeText(key) === regionKey
  )?.[1];

  if (!entry) return [];

  return [
    ...entry.urbanas.map((c) => ({ comuna: c, urbana: true, adicional: 0 })),
    ...Object.entries(entry.adicionales).map(([comuna, adicional]) => ({
      comuna,
      urbana: false,
      adicional,
    })),
  ].sort((a, b) => a.comuna.localeCompare(b.comuna));
}

export function getTravelCharge(region: string, comuna: string) {
  const regionKey = normalizeText(region);
  const comunaKey = normalizeText(comuna);

  const entry = Object.entries(REGION_DATA).find(
    ([key]) => normalizeText(key) === regionKey
  )?.[1];

  if (!entry) {
    return {
      found: false,
      urbana: false,
      adicional: 0,
    };
  }

  const isUrbana = entry.urbanas.some((c) => normalizeText(c) === comunaKey);
  if (isUrbana) {
    return {
      found: true,
      urbana: true,
      adicional: 0,
    };
  }

  const adicionalEntry = Object.entries(entry.adicionales).find(
    ([c]) => normalizeText(c) === comunaKey
  );

  if (adicionalEntry) {
    return {
      found: true,
      urbana: false,
      adicional: adicionalEntry[1],
    };
  }

  return {
    found: false,
    urbana: false,
    adicional: 0,
  };
}

function buildEstufaQuote(form: QuoteForm): QuoteResult {
  const adicionales: { label: string; amount: number }[] = [];
  const observaciones: string[] = [];
  const materiales: string[] = [];
  let factible = true;
  let manoObraBase = 0;
  let titulo = 'Cotización de estufa';
  const fuelLabel = form.fuelType === 'lena' ? 'leña' : 'pellet';

  if (form.pisos === '3') {
    factible = false;
    observaciones.push('El máximo de pisos soportado por este cotizador es 2 pisos.');
  }

  if (form.estufaMode === 'muro' || form.estufaMode === 'muro_salida_techo') {
    titulo = `Instalación ${fuelLabel} por muro`;

    const usarSalidaTecho =
      form.estufaMode === 'muro_salida_techo' || form.tieneCobertizo === 'si';

    if (usarSalidaTecho) {
      titulo = `Instalación ${fuelLabel} muro salida techo`;
      manoObraBase = 185000;

      if (form.tipoTechoCobertizo === 'normal') {
        materiales.push(
          '1 tubo de 50 cm pellet',
          'T de registro pellet',
          '4 tubos de metro pellet',
          '2 tubos protectores',
          'Tapacielo pellet',
          'Saco de lana mineral',
          'Gorro pellet',
          'Embudillo pellet'
        );
      }

      if (form.tipoTechoCobertizo === 'policarbonato') {
        materiales.push(
          '1 tubo de 50 cm pellet',
          'T de registro pellet',
          '4 tubos de metro pellet',
          'Tapacielo',
          'Manta',
          'Gorro americano'
        );
      }

      if (form.quiereJuegoCodos === 'si') {
        materiales.push('Juego de codos (opcional)');
      }
    } else {
      manoObraBase = 150000;
      materiales.push('Kit muro estándar');
    }

    if (form.materialMuro === 'tabique') {
      materiales.push('Adicional seguridad con lana mineral');
      adicionales.push({
        label: 'Adicional seguridad con lana mineral',
        amount: 20000,
      });
    }
  }

  if (form.estufaMode === 'preexistente_1') {
    titulo = `Instalación preexistente conexión primer piso (${fuelLabel})`;
    manoObraBase = 145000;
    materiales.push(
      'Reductor 5/6" a 80 mm',
      'Juego de codos 80 mm',
      '2 tubos de metro pellet',
      '1 Tee de registro'
    );
  }

  if (form.estufaMode === 'preexistente_2') {
    titulo = `Instalación preexistente conexión segundo piso (${fuelLabel})`;
    manoObraBase = 155000;
    materiales.push(
      'Reductor 5/6" a 80 mm',
      'Juego de codos 80 mm',
      '4 tubos de metro pellet',
      '1 Tee de registro',
      '2 tapacielos pellet'
    );
  }

  if (form.estufaMode === 'techo') {
    const metros = Number(form.metrosTotales || 0);

    if (Number(form.pisos || 0) > 2) {
      factible = false;
      observaciones.push('Instalaciones por techo: máximo 2 pisos.');
    }

    if (form.tipoTecho === 'pizarreno') {
      factible = false;
      observaciones.push('Techo de pizarreño: no factible.');
    }

    if (metros <= 4) {
      titulo = `Instalación ${fuelLabel} 1 piso (hasta 4 mts)`;
      manoObraBase = 150000;
      materiales.push('Kit techo estándar');
    } else if (metros === 5) {
      titulo = `Instalación ${fuelLabel} 1 piso y medio (5 mts)`;
      manoObraBase = 165000;
      materiales.push(
        'Kit techo estándar',
        '1 cañón de 6 pulgadas',
        '1 cañón protector'
      );
    } else if (metros === 6) {
      titulo = `Instalación ${fuelLabel} 2 pisos (6 mts)`;
      manoObraBase = 190000;
      materiales.push('Kit techo estándar', '2 cañones', '2 tapacielos');
    } else if (metros > 6) {
      titulo = `Instalación ${fuelLabel} 2 pisos (${metros} mts)`;
      manoObraBase = 190000;
      const metrosExtra = metros - 6;

      adicionales.push({
        label: `Adicional por ${metrosExtra} metro(s) extra`,
        amount: metrosExtra * 10000,
      });

      materiales.push(
        'Kit techo estándar',
        '2 cañones',
        '2 tapacielos',
        `${metrosExtra} tubo(s) adicional(es)`
      );
    }

    if (form.tipoTecho === 'teja_chilena') {
      adicionales.push({
        label: 'Adicional por techo de teja',
        amount: 10000,
      });
    }

    if (form.formaTecho === 'tipo_a') {
      adicionales.push({
        label: 'Adicional por techo tipo A',
        amount: 10000,
      });
    }

    if (form.tipoCielo === 'losa') {
      adicionales.push({
        label: 'Picado de losa',
        amount: 50000,
      });
    }
  }

  const travel = getTravelCharge(form.region, form.comuna);
  const recargoComuna = travel.adicional;
  const comunaEsUrbana = travel.urbana;

  const subtotalAntesPromo =
    manoObraBase +
    adicionales.reduce((acc, item) => acc + item.amount, 0) +
    recargoComuna;

  const promo = getPromoDiscount(subtotalAntesPromo, form.promoCode);
  const descuentoCiudad = promo.amount;

  if (promo.valid && promo.amount > 0) {
    observaciones.push(
      `Descuento promocional aplicado (${promo.code} - ${promo.label}): -${formatMoney(
        promo.amount
      )}`
    );
  } else if (form.promoCode) {
    observaciones.push(`Código promocional no válido: ${form.promoCode}`);
  }

  if (!travel.found) {
    observaciones.push(
      'La comuna ingresada no está en la tabla cargada. El recargo por distancia quedó en $0 y debe revisarse manualmente.'
    );
  } else if (!travel.urbana && travel.adicional > 0) {
    observaciones.push(
      `Recargo por comuna fuera de radio urbano: ${formatMoney(travel.adicional)}.`
    );
  }

  if (form.metrajeCalefaccionar) {
    const reco = getEstufaRecommendation(form.metrajeCalefaccionar);
    if (reco) {
      observaciones.push(`Recomendación de estufa según m²: ${reco}.`);
    }
  }

  observaciones.push(
    'Todos los valores corresponden netamente a mano de obra.',
    'El día de la instalación podrían requerirse materiales adicionales según la condición real del lugar.'
  );

  const totalManoObra =
    manoObraBase +
    adicionales.reduce((acc, item) => acc + item.amount, 0) +
    recargoComuna -
    descuentoCiudad;

  return {
    factible,
    titulo,
    manoObraBase,
    adicionalesManoObra: adicionales,
    descuentoCiudad,
    recargoComuna,
    totalManoObra: Math.max(totalManoObra, 0),
    materiales,
    observaciones,
    recomendacionEstufa: getEstufaRecommendation(form.metrajeCalefaccionar),
    comunaEsUrbana,
    promoCode: promo.code,
    promoDiscount: promo.amount,
    promoValid: promo.valid,
    promoLabel: promo.label,
  };
}

function buildOtrosQuote(form: QuoteForm): QuoteResult {
  const manoObraBase = getOtherServiceBasePrice(form.otherService, form.aireMetros);
  const travel = getTravelCharge(form.region, form.comuna);

  const observaciones: string[] = [
    'Todos los valores corresponden netamente a mano de obra.',
    'El día de la instalación podrían requerirse materiales adicionales según la condición real del lugar.',
  ];

  const subtotalAntesPromo = manoObraBase + travel.adicional;
  const promo = getPromoDiscount(subtotalAntesPromo, form.promoCode);
  const descuentoCiudad = promo.amount;

  if (promo.valid && promo.amount > 0) {
    observaciones.push(
      `Descuento promocional aplicado (${promo.code} - ${promo.label}): -${formatMoney(
        promo.amount
      )}`
    );
  } else if (form.promoCode) {
    observaciones.push(`Código promocional no válido: ${form.promoCode}`);
  }

  if (!travel.found) {
    observaciones.push(
      'La comuna ingresada no está en la tabla cargada. El recargo por distancia quedó en $0 y debe revisarse manualmente.'
    );
  }

  const titleMap: Record<string, string> = {
    aire_split: `Instalación aire acondicionado split muro ${form.aireMetros || ''} mts cañería`,
    motor_porton: 'Instalación motor portón eléctrico',
    termo_electrico: 'Instalación termo eléctrico',
    calefont: 'Instalación calefont',
    cerradura_digital: 'Instalación cerradura digital',
    bomba_calor_piscina: 'Instalación bomba de calor de piscina',
    cargador_auto: 'Instalación cargador auto eléctrico (incluye cargador)',
  };

  return {
    factible: manoObraBase > 0,
    titulo: titleMap[form.otherService || ''] || 'Otro servicio',
    manoObraBase,
    adicionalesManoObra: [],
    descuentoCiudad,
    recargoComuna: travel.adicional,
    totalManoObra: Math.max(manoObraBase + travel.adicional - descuentoCiudad, 0),
    materiales: [],
    observaciones,
    comunaEsUrbana: travel.urbana,
    promoCode: promo.code,
    promoDiscount: promo.amount,
    promoValid: promo.valid,
    promoLabel: promo.label,
  };
}

function buildMantencionQuote(form: QuoteForm): QuoteResult {
  const manoObraBase = getMantencionBasePrice(form.mantencionService);
  const travel = getTravelCharge(form.region, form.comuna);

  const observaciones: string[] = [
    'Todos los valores corresponden netamente a mano de obra.',
    'El día del servicio podrían requerirse materiales o repuestos adicionales según diagnóstico.',
  ];

  const subtotalAntesPromo = manoObraBase + travel.adicional;
  const promo = getPromoDiscount(subtotalAntesPromo, form.promoCode);
  const descuentoCiudad = promo.amount;

  if (promo.valid && promo.amount > 0) {
    observaciones.push(
      `Descuento promocional aplicado (${promo.code} - ${promo.label}): -${formatMoney(
        promo.amount
      )}`
    );
  } else if (form.promoCode) {
    observaciones.push(`Código promocional no válido: ${form.promoCode}`);
  }

  if (!travel.found) {
    observaciones.push(
      'La comuna ingresada no está en la tabla cargada. El recargo por distancia quedó en $0 y debe revisarse manualmente.'
    );
  }

  const titleMap: Record<string, string> = {
    estufa_pellet: 'Mantención estufa pellet',
    aire_acondicionado: 'Mantención aire acondicionado',
    calefont: 'Mantención calefont',
    termo_hasta_200: 'Mantención termo eléctrico hasta 200 lts',
    termo_mas_200: 'Mantención termo eléctrico más de 200 lts',
    bomba_calor_piscina: 'Mantención bomba de calor piscina',
  };

  return {
    factible: manoObraBase > 0,
    titulo: titleMap[form.mantencionService || ''] || 'Mantención',
    manoObraBase,
    adicionalesManoObra: [],
    descuentoCiudad,
    recargoComuna: travel.adicional,
    totalManoObra: Math.max(manoObraBase + travel.adicional - descuentoCiudad, 0),
    materiales: [],
    observaciones,
    comunaEsUrbana: travel.urbana,
    promoCode: promo.code,
    promoDiscount: promo.amount,
    promoValid: promo.valid,
    promoLabel: promo.label,
  };
}

export function computeQuote(form: QuoteForm): QuoteResult {
  if (form.category === 'estufas') return buildEstufaQuote(form);
  if (form.category === 'otros') return buildOtrosQuote(form);
  return buildMantencionQuote(form);
}