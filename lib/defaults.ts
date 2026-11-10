import type { SiteContent } from "./content";

/** Contenido inicial del sitio. Lo que se guarda desde el panel lo reemplaza sección por sección. */
export const DEFAULT_CONTENT: SiteContent = {
  general: {
    instagram: "https://www.instagram.com/29er_argentina/",
    taplink: "https://taplink.cc/29erargentina",
    email: "29erargentina@gmail.com",
    mediaManagerHandle: "@delfi.meni",
    mediaManagerUrl: "https://www.instagram.com/delfi.meni/",
    classSite: "https://29er.org/",
  },

  home: {
    heroKicker: "Clase Internacional 29er · Argentina",
    heroIntro: "La comunidad argentina del 29er, el skiff juvenil de alto rendimiento. Dos tripulantes, un trapecio, un asimétrico y muchas ganas de ir rápido.",
    boatIntro:
      "Diseñado por Julian Bethwaite en 1998 a partir del olímpico 49er, el 29er es un barco de dos tripulantes, liviano y explosivo. Planeando puede ir más rápido que el viento, y por eso es la escuela favorita de los regatistas juveniles de todo el mundo.",
  },

  specs: [
    { value: 4.45, decimals: 2, unit: "m", label: "Eslora" },
    { value: 1.77, decimals: 2, unit: "m", label: "Manga con alas" },
    { value: 74, decimals: 0, unit: "kg", label: "Peso del casco" },
    { value: 6.25, decimals: 2, unit: "m", label: "Mástil" },
    { value: 12.5, decimals: 1, unit: "m²", label: "Mayor + foque" },
    { value: 15, decimals: 0, unit: "m²", label: "Asimétrico" },
  ],

  features: [
    { title: "Trapecio simple", text: "El proel cuelga del trapecio y el timonel hace banda desde las alas: el barco va plano y rápido." },
    { title: "Foque autovirante", text: "Menos maniobras con escotas, más cabeza para la táctica y para llevar la mayor ceñida." },
    { title: "Asimétrico fraccionado", text: "Con viento de través y popa, el spinnaker asimétrico lo hace planear y acelerar en segundos." },
    { title: "Camino olímpico", text: "Derivado del 49er, es la clase de los Mundiales Juveniles y la escuela natural hacia el 49er y el 49erFX." },
  ],

  events: [
    {
      id: "mundial-2026",
      name: "Mundial 29er 2026",
      start: "2026-07-02",
      end: "2026-07-09",
      place: "Kiel-Schilksee, Alemania",
      club: "",
      link: "https://29er.org/",
      kind: "mundial",
    },
    { id: "siy-2027", name: "Semana Internacional del Yachting", start: "", end: "", place: "Argentina", club: "", link: "", kind: "nacional" },
    { id: "sudamericano-2027", name: "Sudamericano 29er", start: "", end: "", place: "", club: "", link: "", kind: "sudamericano" },
    { id: "argentino-2027", name: "Campeonato Argentino 29er", start: "", end: "", place: "", club: "", link: "", kind: "nacional" },
  ],

  news: [
    {
      slug: "nueva-web-29er-argentina",
      title: "Estrenamos la nueva web de la clase",
      date: "2026-11-10",
      tag: "Clase",
      excerpt: "Agenda, anualidad, reglamentos, barcos a la venta y novedades: todo lo de la clase en un solo lugar.",
      body: [
        "La clase 29er en Argentina tiene nueva casa en internet. Juntamos en un mismo sitio todo lo que antes estaba repartido entre mensajes, historias de Instagram y planillas sueltas.",
        "En la agenda vas a encontrar las próximas regatas con su club y el link al aviso, y un calendario listo para imprimir. En Información están el estatuto, las reglas de la clase y el reglamento de World Sailing.",
        "Si tenés un barco para vender, una foto para compartir o una idea para la web, escribinos.",
      ],
      image: "",
    },
    {
      slug: "anualidad-como-pagar",
      title: "Anualidad: cuál te corresponde y cómo pagarla",
      date: "2026-11-10",
      tag: "Anualidad",
      excerpt: "Hay dos modalidades, completa y 50 %. Te contamos cómo elegir y con quién hablar.",
      body: [
        "La anualidad sostiene la actividad de la clase durante toda la temporada. Hay dos modalidades: la anualidad completa y la del 50 %.",
        "En la sección Anualidad explicamos cada una y está el contacto de tesorería para coordinar el pago y resolver dudas.",
      ],
      image: "",
    },
    {
      slug: "mundial-2026-kiel",
      title: "Mundial 2026 en Kiel-Schilksee",
      date: "2026-07-02",
      tag: "Mundial",
      excerpt: "Del 2 al 9 de julio la flota 29er se juntó en Alemania para el Campeonato Mundial.",
      body: [
        "Kiel-Schilksee, sede histórica de la vela olímpica, recibió el Campeonato Mundial 29er 2026 entre el 2 y el 9 de julio.",
        "Seguimos toda la semana en las historias destacadas de nuestro Instagram.",
      ],
      image: "",
    },
    {
      slug: "barcos-usados-a-la-venta",
      title: "¿Buscás barco? La planilla de usados",
      date: "2026-11-10",
      tag: "Barcos",
      excerpt: "Reunimos en una planilla los 29er usados que están a la venta en el país.",
      body: [
        "Para que sea más fácil arrancar en la clase, armamos una planilla con los barcos usados que están a la venta, con su estado y el contacto de cada dueño.",
        "Si querés publicar el tuyo, mandanos los datos por mail.",
      ],
      image: "",
    },
    {
      slug: "reglamentos-en-un-lugar",
      title: "Estatuto, reglas y reglamento, a un clic",
      date: "2026-11-10",
      tag: "Información",
      excerpt: "Los documentos que todo tripulante tiene que conocer, listos para descargar.",
      body: [
        "En la sección Información están el estatuto de la clase, las reglas de la clase 29er y el Reglamento de Regatas a Vela de World Sailing.",
        "Repasalos antes de cada temporada: las reglas cambian cada cuatro años y las de la clase se actualizan seguido.",
      ],
      image: "",
    },
    {
      slug: "queres-probar-un-29er",
      title: "¿Querés probar un 29er?",
      date: "2026-11-10",
      tag: "Sumate",
      excerpt: "Cómo dar el primer paso en el skiff juvenil más rápido del mundo.",
      body: [
        "El 29er es un barco para dos tripulantes, ideal para quienes vienen de Optimist, Cadet o 420 y quieren ir más rápido.",
        "Escribinos y te contamos qué clubes tienen flota, cómo conseguir barco y cuándo son los próximos entrenamientos.",
      ],
      image: "",
    },
  ],

  boats: {
    usedSheet: "",
    shipyardName: "Riotecna",
    shipyardText: "Astillero de referencia para el 29er en Argentina: barcos nuevos, repuestos y reparaciones.",
    shipyardServices: ["Barcos nuevos", "Repuestos", "Reparaciones", "Asesoramiento"],
    contactName: "",
    phone: "",
    email: "",
    web: "",
  },

  membership: [
    {
      id: "completa",
      name: "Anualidad completa",
      share: 100,
      price: null,
      text: "La cuota anual completa de la clase. Te deja al día para toda la temporada.",
      perks: ["Cuota anual completa", "Válida por toda la temporada"],
    },
    {
      id: "media",
      name: "Anualidad 50 %",
      share: 50,
      price: null,
      text: "La mitad de la cuota anual, para los casos que define la comisión directiva. Consultá con tesorería si te corresponde.",
      perks: ["50 % del valor anual", "Según las condiciones que define la comisión"],
    },
  ],

  treasurer: { name: "", email: "", phone: "" },

  docs: [
    {
      id: "estatuto",
      title: "Estatuto de la clase",
      text: "Cómo se organiza la Asociación Argentina de la clase 29er: socios, autoridades y asambleas.",
      source: "29er Argentina",
      url: "",
    },
    {
      id: "reglas",
      title: "Reglas de la clase",
      text: "Las reglas de medición y equipamiento del 29er que publica la Asociación Internacional.",
      source: "International 29er Class Association",
      url: "https://29er.org/",
    },
    {
      id: "reglamento",
      title: "Reglamento de Regatas a Vela",
      text: "El reglamento de World Sailing que rige todas las regatas: derechos de paso, protestas y penalidades.",
      source: "World Sailing",
      url: "https://www.sailing.org/inside-world-sailing/rules-regulations/racing-rules-of-sailing/",
    },
  ],

  clubs: [
    {
      id: "yca",
      short: "YCA",
      name: "Yacht Club Argentino",
      venues: ["Dársena Norte, CABA", "San Fernando, Buenos Aires"],
      contact: "",
      web: "https://www.yca.org.ar/",
    },
    { id: "cuba", short: "CUBA", name: "Club Universitario de Buenos Aires", venues: [], contact: "", web: "https://www.cuba.org.ar/" },
  ],

  board: [
    { role: "Presidencia", name: "" },
    { role: "Secretaría", name: "" },
    { role: "Tesorería", name: "" },
    { role: "Vocal", name: "" },
  ],
};
