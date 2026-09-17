import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  CalendarCheck, ClipboardCheck, CalendarClock, Users, AlertTriangle,
  BookOpenCheck, LayoutGrid, Plus, X, Check, ChevronRight, Printer,
  Search, Pencil, Trash2, Clock, ChevronLeft, Image as ImageIcon, Paperclip,
  FileText, LogOut, Lock, MoreHorizontal, GraduationCap, Calendar, Upload, Download
} from "lucide-react";
import { supabase } from "./supabaseClient";

/* ============================== BRAND DESIGN TOKENS ============================== */
// Dirección "Estudio SaaS moderno": sidebar casi negro, acento verde
// esmeralda (no el azul genérico de siempre), tipografía geométrica,
// y paneles con borde fino en vez de tarjetas con relleno de color.
const T = {
  bg: "oklch(97.3% 0.006 80)",
  bgElevated: "oklch(99% 0.003 80)",
  card: "oklch(99% 0.003 80)",
  ink: "oklch(21% 0.02 260)",
  inkSoft: "oklch(46% 0.02 260)",
  inkFaint: "oklch(65% 0.014 260)",
  separator: "oklch(89% 0.01 80)",
  fill: "oklch(94% 0.006 80)",
  blue: "oklch(55% 0.15 155)",
  blueDark: "oklch(45% 0.14 155)",
  green: "oklch(55% 0.15 155)",
  red: "oklch(53% 0.18 25)",
  orange: "oklch(60% 0.15 55)",
  purple: "oklch(52% 0.11 300)",
  teal: "oklch(52% 0.09 200)",
  indigo: "oklch(52% 0.11 300)",
  blueTint: "oklch(55% 0.15 155 / 0.10)",
  greenTint: "oklch(55% 0.15 155 / 0.10)",
  redTint: "oklch(53% 0.18 25 / 0.10)",
  orangeTint: "oklch(60% 0.15 55 / 0.10)",
  purpleTint: "oklch(52% 0.11 300 / 0.10)",
  tealTint: "oklch(52% 0.09 200 / 0.10)",
  sidebar: "oklch(27% 0.02 260)",
  sidebarActive: "oklch(35% 0.05 155)",
  sidebarBorder: "oklch(35% 0.02 260)",
  sidebarText: "oklch(82% 0.012 260)",
  sidebarTextMuted: "oklch(64% 0.016 260)",
};

const sysFont =
  "'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const headFont = "'Space Grotesk', 'Manrope', -apple-system, sans-serif";

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
    html, body, #root { margin: 0; padding: 0; }
    .cc-root, .cc-root * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    .cc-root { font-family: ${sysFont}; }
    .cc-root input, .cc-root select, .cc-root textarea, .cc-root button { font-family: ${sysFont}; }
    .cc-root input:focus, .cc-root select:focus, .cc-root textarea:focus { outline: none; border-color: ${T.blue} !important; box-shadow: 0 0 0 3px ${T.blueTint}; }
    .cc-root ::-webkit-scrollbar { width: 6px; height: 6px; }
    .cc-root ::-webkit-scrollbar-thumb { background: #D1D1D6; border-radius: 3px; }
    .cc-tap { transition: transform .12s ease, opacity .12s ease; }
    .cc-tap:active { transform: scale(0.96); opacity: 0.75; }
    .cc-row-tap:active { background: ${T.bg} !important; }
    @keyframes cc-sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @keyframes cc-fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes cc-pop { from { opacity: 0; transform: scale(.94) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    @keyframes cc-spin { to { transform: rotate(360deg); } }
    .cc-scrollx { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
    .cc-scrollx::-webkit-scrollbar { display: none; }
    .print-only, .print-only-flex { display: none; }
    @media print {
      .no-print { display: none !important; }
      .print-only { display: block !important; }
      .print-only-flex { display: flex !important; }
      html, body { background: #fff !important; }
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
      .cc-card { box-shadow: none !important; border: 1px solid #D1D1D6 !important; }
      .cc-scrollx { overflow-x: visible !important; }
      .cc-scrollx table { min-width: 0 !important; width: 100% !important; font-size: 10.5px !important; }
      .cc-scrollx th, .cc-scrollx td { padding: 6px 4px !important; }
    }
  `}</style>
);

/* ============================== RESPONSIVE HOOK ============================== */
function useIsMobile(ref) {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") {
      const mq = window.matchMedia("(max-width: 720px)");
      setMobile(mq.matches);
      const fn = (e) => setMobile(e.matches);
      mq.addEventListener ? mq.addEventListener("change", fn) : mq.addListener(fn);
      return () => (mq.removeEventListener ? mq.removeEventListener("change", fn) : mq.removeListener(fn));
    }
    const ro = new ResizeObserver((entries) => setMobile(entries[0].contentRect.width < 720));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return mobile;
}

/* ============================== SEED DATA ============================== */
const seedTeachers = () => {
  const rows = [
    ["Rosa María Arcos Hernández", "Español"],
    ["Ma. Leticia Hernández Martínez", "Español"],
    ["Amy Anahi Villegas León", "Español"],
    ["Nora Elizabeth Juárez Santillán", "Inglés, Tecnología"],
    ["José de Jesús Donjuan López", "Inglés"],
    ["Joziany Edith Trejo Arcos", "Inglés"],
    ["Verónica del Carmen Oñate González", "Matemáticas"],
    ["Alejandra Odhett Madrigal Gallardo", "Matemáticas"],
    ["Erika Jazmín Zúñiga Banda", "Matemáticas"],
    ["Alejandra Campos Gamboa", "Matemáticas"],
    ["Luis Alfredo Alvarez Rodríguez", "Ciencias"],
    ["Ilse Rocío Patiño Miranda", "Ciencias"],
    ["Ada Paulina Rubio Chávez", "Ciencias"],
    ["Martina García Ramos", "Ciencias"],
    ["Aser Rosas Marquez", "Historia, Geografía"],
    ["Nohemi Griselda Iracheta", "Historia, FCyE"],
    ["Zulema Karina Urbina Rodríguez", "FCyE"],
    ["María del Socorro Contreras López", "Artes"],
    ["Miguel Angel Armadillo Fortuna", "Artes"],
  ];
  return rows.map(([name, disciplina], i) => ({
    id: "t" + (i + 1), name, disciplina, telefono: "", correo: "", notas: "",
  }));
};

const VISIT_GROUP_A = new Set(["Español", "Inglés, Tecnología", "Inglés", "Matemáticas"]);
function visitsForTeacher(t) {
  const isA = VISIT_GROUP_A.has(t.disciplina);
  const plan = isA
    ? [["SEPT", "7 al 11"], ["ENERO", "18 al 22"], ["ABRIL", "12 al 16"]]
    : [["OCT", "5 al 9"], ["FEBRERO", "15 al 19"], ["JUNIO", "14 al 18"]];
  return plan.map(([month, semana], idx) => ({ id: `v${t.id}_${idx}`, teacherId: t.id, month, semana, status: "pendiente", notas: "", tipo: "programada", fecha: "", observationId: null }));
}
const seedVisits = (teachers) => teachers.flatMap(visitsForTeacher);
function normalizeVisit(v) { return { tipo: "programada", fecha: "", observationId: null, ...v }; }

const PLANEACION_TIPOS = ["Evaluación diagnóstica", "Plan Anual", "Planeación Primer Trimestre", "Planeación Segundo Trimestre", "Planeación Tercer Trimestre"];
function planeacionesForTeacher(t) {
  return PLANEACION_TIPOS.map((tipo, idx) => ({ id: `pl${t.id}_${idx}`, teacherId: t.id, tipo, status: "pendiente", fecha: "", evaluacion: null }));
}
function normalizePlaneacion(p) { return { evaluacion: null, ...p }; }
const seedPlaneaciones = (teachers) => teachers.flatMap(planeacionesForTeacher);
const PLANEACIONES_DRIVE_URL = "https://drive.google.com/drive/folders/1PbrzkXSvc9WtXBfDGrLRyQXmASwfAT9q?usp=sharing";

/* ============================== LISTA DE COTEJO DE PLANEACIONES (NEM) ============================== */
const NIVEL_COTEJO = {
  pendiente: { label: "Pendiente de incorporar", tone: "red" },
  parcial: { label: "Incorporado parcialmente", tone: "orange" },
  completo: { label: "Incorporado", tone: "green" },
};
const NIVEL_COTEJO_ORDER = ["pendiente", "parcial", "completo"];

const CRITERIOS_COMUNES_TRIMESTRAL = [
  { id: "campo", texto: "Campo formativo y/o asignatura identificado" },
  { id: "contenido", texto: "Contenido del Programa Sintético especificado" },
  { id: "pda", texto: "Proceso de Desarrollo de Aprendizaje (PDA) vinculado al contenido" },
  { id: "eje", texto: "Eje(s) articulador(es) identificado(s)" },
  { id: "evaluacion", texto: "Evaluación formativa: instrumento(s) y momento(s) especificados" },
  { id: "inclusion", texto: "Estrategias de inclusión/atención a la diversidad" },
  { id: "recursos", texto: "Recursos y materiales listados" },
  { id: "tiempos", texto: "Tiempos/sesiones estimados" },
];

const CRITERIOS_DIAGNOSTICA = [
  { id: "instrumento", texto: "Instrumento de diagnóstico definido (examen, rúbrica, portafolio, observación, etc.)" },
  { id: "aprendizajes_previos", texto: "Aprendizajes/saberes previos que evalúa, ligados al grado y campo formativo" },
  { id: "aplicacion", texto: "Fecha y forma de aplicación especificadas" },
  { id: "uso_resultados", texto: "Uso previsto de los resultados" },
];

const CRITERIOS_PLAN_ANUAL = [
  { id: "diagnostico_grupo", texto: "Diagnóstico inicial del grupo considerado" },
  { id: "distribucion", texto: "Campo(s) formativo(s)/asignatura y contenidos distribuidos a lo largo del ciclo" },
  { id: "ejes_transversales", texto: "Ejes articuladores contemplados de forma transversal" },
  { id: "metodologias_previstas", texto: "Metodología(s) prevista(s) (ABP, Aprendizaje Servicio, STEAM, Proyectos Comunitarios)" },
  { id: "calendarizacion", texto: "Calendarización por trimestre" },
  { id: "vinculacion_pa", texto: "Vinculación con el Programa Analítico del colectivo docente (CTE)" },
  { id: "mecanismos_eval", texto: "Mecanismos de evaluación previstos a lo largo del año" },
];

const METODOLOGIAS_NEM = {
  abp: {
    nombre: "Aprendizaje Basado en Problemas (ABP)",
    fases: [
      { id: "presentamos", nombre: "Presentamos", desc: "Introducir una situación problemática real o ficticia mediante una lectura, imagen o vivencia para despertar el interés." },
      { id: "recolectamos", nombre: "Recolectamos", desc: "Explorar y recuperar los saberes previos de los alumnos necesarios para comprender la problemática." },
      { id: "formulemos", nombre: "Formulemos el problema", desc: "Definir con claridad el problema central o el conflicto cognitivo que se va a resolver." },
      { id: "organicemos", nombre: "Organicemos la experiencia", desc: "Planificar la ruta de trabajo, asignando tareas, tiempos y recursos." },
      { id: "vivamos", nombre: "Vivamos la experiencia", desc: "Guiar a los alumnos en la indagación individual o en equipo para construir los saberes necesarios y resolver el problema." },
      { id: "resultados", nombre: "Resultados y análisis", desc: "Visualizar los avances, presentar las soluciones propuestas y reflexionar de manera conjunta sobre el proceso vivido." },
    ],
  },
  as: {
    nombre: "Aprendizaje Servicio (AS)",
    fases: [
      { id: "partida", nombre: "Punto de partida", desc: "Nace de un interés o necesidad de la comunidad. El docente presenta la metodología y activa los saberes de los alumnos." },
      { id: "se_quiero_saber", nombre: "Lo que sé y lo que quiero saber", desc: "Se delimita el problema social o ambiental que se atenderá, investigando sus causas y consecuencias." },
      { id: "organicemos_act", nombre: "Organicemos las actividades", desc: "Se planifican de manera coordinada las acciones, los recursos necesarios y los responsables del servicio comunitario." },
      { id: "creatividad", nombre: "Creatividad en marcha", desc: "Se ejecuta el plan de trabajo; incluye el monitoreo continuo de las actividades y el servicio social acordado." },
      { id: "compartimos", nombre: "Compartimos y evaluamos lo aprendido", desc: "Se evalúan los resultados del aprendizaje académico, el impacto real del servicio prestado y se realiza una autoevaluación grupal." },
    ],
  },
  steam: {
    nombre: "Aprendizaje Basado en Indagación (STEAM)",
    fases: [
      { id: "introduccion", nombre: "Introducción al tema", desc: "Se introducen los conocimientos previos, se identifica la problemática y se plantean las preguntas de indagación." },
      { id: "diseno", nombre: "Diseño de la investigación", desc: "Se organiza cómo se responderán las preguntas, definiendo fuentes de información, experimentos u observaciones." },
      { id: "organizar", nombre: "Organizar y estructurar las respuestas", desc: "Se analizan los datos recolectados, se sintetizan las ideas y se elaboran explicaciones de los fenómenos investigados." },
      { id: "presentacion", nombre: "Presentación de resultados", desc: "Se comparten las conclusiones de la indagación y se formulan propuestas de solución o aplicaciones técnicas." },
      { id: "metacognicion", nombre: "Metacognición", desc: "Se reflexiona sobre todo el proceso de aprendizaje realizado, los aciertos y las áreas de mejora." },
    ],
  },
  comunitarios: {
    nombre: "Aprendizaje Basado en Proyectos Comunitarios",
    fases: [
      { id: "identificacion", nombre: "Identificación", grupo: "Planeación", desc: "Proponer planteamientos para introducir el diálogo y detectar un problema real." },
      { id: "recuperacion", nombre: "Recuperación", grupo: "Planeación", desc: "Rescatar conocimientos previos de los alumnos." },
      { id: "planificacion", nombre: "Planificación", grupo: "Planeación", desc: "Negociar las actividades, tiempos y productos del proyecto." },
      { id: "acercamiento", nombre: "Acercamiento", grupo: "Acción", desc: "Explorar el problema en profundidad mediante diversas fuentes." },
      { id: "comprension_prod", nombre: "Comprensión y producción", grupo: "Acción", desc: "Elaborar las primeras producciones o borradores." },
      { id: "reconocimiento", nombre: "Reconocimiento", grupo: "Acción", desc: "Identificar avances, dificultades y realizar ajustes." },
      { id: "concrecion", nombre: "Concreción", grupo: "Acción", desc: "Generar el producto final para responder al problema." },
      { id: "integracion", nombre: "Integración", grupo: "Intervención", desc: "Compartir las producciones para intercambiar ideas y retroalimentar." },
      { id: "difusion", nombre: "Difusión", grupo: "Intervención", desc: "Presentar el producto final a la comunidad o al grupo." },
      { id: "consideraciones", nombre: "Consideraciones", grupo: "Intervención", desc: "Reflexionar sobre el impacto y el proceso de trabajo." },
      { id: "avances", nombre: "Avances", grupo: "Intervención", desc: "Tomar decisiones para dar continuidad o cerrar el proyecto." },
    ],
  },
};

function blankEvaluacion() {
  return { metodologia: null, comunes: {}, fases: {}, fecha: "" };
}
function criteriosParaTipo(tipo) {
  if (tipo === "Evaluación diagnóstica") return CRITERIOS_DIAGNOSTICA;
  if (tipo === "Plan Anual") return CRITERIOS_PLAN_ANUAL;
  return CRITERIOS_COMUNES_TRIMESTRAL; // trimestrales
}
function esTrimestral(tipo) { return tipo.startsWith("Planeación "); }
// Revisa una evaluación y regresa si está completa y, si no, las orientaciones puntuales para el docente.
function evaluarPlaneacion(tipo, evaluacion) {
  const criterios = criteriosParaTipo(tipo);
  const items = [...criterios.map((c) => ({ id: c.id, nombre: c.texto, desc: null, nivel: evaluacion.comunes?.[c.id] || "pendiente" }))];
  if (esTrimestral(tipo) && evaluacion.metodologia) {
    const meta = METODOLOGIAS_NEM[evaluacion.metodologia];
    meta.fases.forEach((f) => items.push({ id: f.id, nombre: f.nombre, desc: f.desc, nivel: evaluacion.fases?.[f.id] || "pendiente" }));
  }
  const metodologiaFalta = esTrimestral(tipo) && !evaluacion.metodologia;
  const completada = !metodologiaFalta && items.length > 0 && items.every((it) => it.nivel === "completo");
  const orientaciones = items.filter((it) => it.nivel !== "completo").map((it) => ({ ...it }));
  return { items, completada, orientaciones, metodologiaFalta };
}

const GRADOS = ["1°", "2°", "3°"];
const GRUPOS = ["A", "B", "C", "D", "E", "F"];

const seedCte = () => [
  { id: "cte0", fecha: "2026-08-24", tema: "Fase Intensiva del CTE (24 al 28 de agosto de 2026)", acuerdos: "", responsables: "", status: "pendiente", asistencia: {}, evidencias: [] },
  { id: "cte1", fecha: "2026-09-25", tema: "1ª sesión ordinaria de CTE", acuerdos: "", responsables: "", status: "pendiente", asistencia: {}, evidencias: [] },
  { id: "cte2", fecha: "2026-10-30", tema: "2ª sesión ordinaria de CTE", acuerdos: "", responsables: "", status: "pendiente", asistencia: {}, evidencias: [] },
  { id: "cte3", fecha: "2026-11-27", tema: "3ª sesión ordinaria de CTE", acuerdos: "", responsables: "", status: "pendiente", asistencia: {}, evidencias: [] },
  { id: "cte4", fecha: "2027-01-29", tema: "4ª sesión ordinaria de CTE", acuerdos: "", responsables: "", status: "pendiente", asistencia: {}, evidencias: [] },
  { id: "cte5", fecha: "2027-02-26", tema: "5ª sesión ordinaria de CTE", acuerdos: "", responsables: "", status: "pendiente", asistencia: {}, evidencias: [] },
  { id: "cte6", fecha: "2027-04-30", tema: "6ª sesión ordinaria de CTE", acuerdos: "", responsables: "", status: "pendiente", asistencia: {}, evidencias: [] },
  { id: "cte7", fecha: "2027-05-28", tema: "7ª sesión ordinaria de CTE", acuerdos: "", responsables: "", status: "pendiente", asistencia: {}, evidencias: [] },
  { id: "cte8", fecha: "2027-06-25", tema: "8ª sesión ordinaria de CTE", acuerdos: "", responsables: "", status: "pendiente", asistencia: {}, evidencias: [] },
];

const seedEvalPeriods = () => [
  { id: "p1", periodo: "I", inicia: "2026-08-31", termina: "2026-11-20", evalInicio: "2026-11-02", evalFin: "2026-11-06", entrega: "2026-11-13",
    tareas: [{ id: "p1t1", texto: "Aplicar evaluaciones", hecho: false }, { id: "p1t2", texto: "Capturar calificaciones", hecho: false }, { id: "p1t3", texto: "Concentrar en formato de coordinación", hecho: false }] },
  { id: "p2", periodo: "II", inicia: "2026-11-23", termina: "2027-03-19", evalInicio: "2027-03-01", evalFin: "2027-03-05", entrega: "2027-03-12",
    tareas: [{ id: "p2t1", texto: "Aplicar evaluaciones", hecho: false }, { id: "p2t2", texto: "Capturar calificaciones", hecho: false }, { id: "p2t3", texto: "Concentrar en formato de coordinación", hecho: false }] },
  { id: "p3", periodo: "III", inicia: "2027-03-16", termina: "2027-07-08", evalInicio: "2027-06-07", evalFin: "2027-06-11", entrega: "2027-06-18",
    tareas: [{ id: "p3t1", texto: "Aplicar evaluaciones", hecho: false }, { id: "p3t2", texto: "Capturar calificaciones", hecho: false }, { id: "p3t3", texto: "Concentrar en formato de coordinación", hecho: false }] },
];

const RUBRIC = [
  { id: "I", titulo: "Planeación", items: [
    { id: "I1", nombre: "Diseño de estrategias didácticas", desc: "Especifica estrategias didácticas acordes con el PDA y los contenidos que desarrollará durante la clase." },
    { id: "I2", nombre: "Selección de mecanismos de evaluación", desc: "Especifica mecanismos de evaluación que permitan detectar de manera eficiente el grado de avance y logro del propósito." },
  ]},
  { id: "II", titulo: "Gestión del ambiente de clase", items: [
    { id: "II1", nombre: "Relaciones interpersonales", desc: "Propicia de manera permanente relaciones interpersonales de respeto y confianza que contribuyen a un ambiente de aprendizaje." },
    { id: "II2", nombre: "Manejo del grupo", desc: "Logra de manera permanente un manejo de grupo que posibilita la comunicación dentro del mismo." },
  ]},
  { id: "III", titulo: "Gestión curricular", items: [
    { id: "III1", nombre: "Conocimiento de la asignatura", desc: "Muestra amplio conocimiento y comprensión del conjunto de contenidos de la asignatura que tiene a su cargo." },
    { id: "III2", nombre: "Conexión con las disciplinas y contextos", desc: "Establece de manera frecuente y pertinente relaciones entre los contenidos de las disciplinas y el contexto de los alumnos." },
  ]},
  { id: "IV", titulo: "Gestión didáctica", items: [
    { id: "IV1", nombre: "Presentación curricular", desc: "Al inicio de la clase presenta y/o recuerda de forma clara el aprendizaje esperado y los contenidos a desarrollar." },
    { id: "IV2", nombre: "Atención diferenciada", desc: "Atiende de manera diferenciada las necesidades de aprendizaje de los alumnos." },
    { id: "IV3", nombre: "Organización del grupo", desc: "Organiza el grupo de manera muy adecuada a las necesidades que demandan las actividades." },
    { id: "IV4", nombre: "Recursos didácticos", desc: "Usa de manera motivante recursos didácticos acordes para promover el aprendizaje de los contenidos." },
    { id: "IV5", nombre: "Manejo del tiempo", desc: "Distribuye y maneja el tiempo de manera eficaz y flexible respecto a contenidos y actividades." },
    { id: "IV6", nombre: "Indicaciones", desc: "Da indicaciones de manera muy clara de los procedimientos a seguir respecto a las actividades." },
    { id: "IV7", nombre: "Explicaciones", desc: "Brinda explicaciones de manera clara y significativa de los conceptos y definiciones que trata." },
    { id: "IV8", nombre: "Preguntas", desc: "Formula de manera muy frecuente preguntas abiertas que promueven la reflexión de los alumnos." },
  ]},
  { id: "V", titulo: "Evaluación", items: [
    { id: "V1", nombre: "Autovaloración", desc: "Promueve de manera eficiente que los alumnos expresen valoraciones sobre sus propios procesos y resultados." },
    { id: "V2", nombre: "Valoración entre alumnos", desc: "Promueve de manera eficiente que los alumnos expresen valoraciones sobre los procesos de sus compañeros." },
    { id: "V3", nombre: "Valoración del docente a los alumnos", desc: "Expresa valoraciones congruentes sobre los procesos y resultados de los alumnos." },
    { id: "V4", nombre: "Retroalimentación de saberes", desc: "Rescata y sistematiza de manera pertinente los conocimientos previos y los retroalimenta de forma significativa." },
  ]},
];
const RUBRIC_ITEM_COUNT = RUBRIC.reduce((n, c) => n + c.items.length, 0);
const NIVELES_DESEMPENO = { 1: "Insuficiente", 2: "Suficiente", 3: "Bueno", 4: "Destacado" };

/* ============================== DATA LAYER (Supabase) ============================== */
const KEYS = {
  teachers: "coordinacion:teachers",
  visits: "coordinacion:visits",
  observations: "coordinacion:observations",
  evalPeriods: "coordinacion:evalPeriods",
  incidencias: "coordinacion:incidencias",
  cte: "coordinacion:cte",
  planeaciones: "coordinacion:planeaciones",
};

async function loadKey(key, fallback) {
  const { data, error } = await supabase.from("app_data").select("value").eq("key", key).maybeSingle();
  if (error || !data) return fallback;
  return data.value;
}
async function saveKey(key, value) {
  const { error } = await supabase.from("app_data").upsert({ key, value }, { onConflict: "key" });
  if (error) console.error("Error guardando", key, error);
}

const EVIDENCIAS_BUCKET = "evidencias";
async function uploadEvidenciaFile(folder, file, tipo) {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${folder}/${uid("ev")}-${safeName}`;
  const body = tipo === "foto" ? await compressImageToBlob(file) : file;
  const { error } = await supabase.storage.from(EVIDENCIAS_BUCKET).upload(path, body, {
    contentType: tipo === "foto" ? "image/jpeg" : (file.type || "application/octet-stream"),
  });
  if (error) throw error;
  return { path, size: body.size };
}
async function removeEvidenciaFile(path) {
  try { await supabase.storage.from(EVIDENCIAS_BUCKET).remove([path]); } catch { /* noop */ }
}
async function removeEvidenciaFolder(folder) {
  try {
    const { data: files } = await supabase.storage.from(EVIDENCIAS_BUCKET).list(folder);
    if (files && files.length) {
      await supabase.storage.from(EVIDENCIAS_BUCKET).remove(files.map((f) => `${folder}/${f.name}`));
    }
  } catch { /* noop */ }
}
async function getSignedEvidenciaUrl(path) {
  const { data, error } = await supabase.storage.from(EVIDENCIAS_BUCKET).createSignedUrl(path, 3600);
  if (error) return null;
  return data.signedUrl;
}

/* ============================== UTILS ============================== */
function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
}
function fmtDateShort(iso) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}
function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function daysUntil(iso) {
  const today = new Date(todayIso() + "T00:00:00");
  const target = new Date(iso + "T00:00:00");
  return Math.round((target - today) / 86400000);
}
function uid(prefix) { return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// Parser de CSV simple pero correcto: soporta campos entre comillas con comas y comillas escapadas ("").
function parseCsv(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  const pushField = () => { row.push(field); field = ""; };
  const pushRow = () => { pushField(); rows.push(row); row = []; };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; } }
      else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") pushField();
    else if (c === "\n") pushRow();
    else if (c === "\r") { /* ignore, \n lo maneja */ }
    else field += c;
  }
  if (field !== "" || row.length) pushRow();
  return rows.filter((r) => r.some((f) => f.trim() !== ""));
}
function downloadTextFile(filename, content, mime = "text/csv;charset=utf-8;") {
  const blob = new Blob(["﻿" + content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Completa los campos del expediente que los registros antiguos no tenían, sin mutar lo guardado.
function normalizeTeacher(t) {
  return {
    ...t,
    fotoPath: t.fotoPath || "",
    personal: { curp: "", fechaNacimiento: "", domicilio: "", contactoEmergenciaNombre: "", contactoEmergenciaTelefono: "", ...(t.personal || {}) },
    laboral: { clavePresupuestal: "", categoria: "", nombramiento: "", horasFrenteGrupo: "", fechaIngreso: "", ...(t.laboral || {}) },
    formacion: { titulo: "", cedulaProfesional: "", estudios: [], cursos: [], ...(t.formacion || {}) },
    bitacora: t.bitacora || [],
  };
}
// Migra en memoria las incidencias viejas (involucrados en texto libre) al nuevo formato con teacherIds.
function normalizeIncidencia(i) {
  if (i.teacherIds) return { notasInvolucrados: "", evidencias: [], ...i };
  return { ...i, teacherIds: [], notasInvolucrados: i.involucrados || "", evidencias: i.evidencias || [] };
}
const NOMBRAMIENTOS = ["Base", "Interinato", "Honorarios", "Contrato", "Otro"];

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
// Comprime imágenes antes de subirlas a Storage
function compressImageToBlob(file, maxDim = 1200, quality = 0.7) {
  return new Promise((resolve, reject) => {
    readFileAsDataURL(file).then((dataUrl) => {
      const img = new window.Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round((height * maxDim) / width); width = maxDim; }
          else { width = Math.round((width * maxDim) / height); height = maxDim; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("No se pudo procesar la imagen"))), "image/jpeg", quality);
      };
      img.onerror = reject;
      img.src = dataUrl;
    }).catch(reject);
  });
}
function fileSizeLabel(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ============================== IOS UI PRIMITIVES ============================== */
const LogoMark = ({ size = 34, radius = 10 }) => (
  <div style={{
    width: size, height: size, borderRadius: radius, flexShrink: 0,
    background: T.blue, display: "flex", alignItems: "center", justifyContent: "center",
  }}>
    <GraduationCap size={size * 0.58} color="#fff" strokeWidth={2.2} />
  </div>
);

const Card = ({ children, style, className, ...rest }) => (
  <div className={["cc-card", className].filter(Boolean).join(" ")} style={{ background: T.card, borderRadius: 10, overflow: "hidden", border: `1px solid ${T.separator}`, ...style }} {...rest}>
    {children}
  </div>
);

const Row = ({ children, onClick, last, style }) => (
  <div className={onClick ? "cc-row-tap" : ""} onClick={onClick} style={{
    display: "flex", alignItems: "center", gap: 10, padding: "13px 16px",
    borderBottom: last ? "none" : `0.5px solid ${T.separator}`,
    cursor: onClick ? "pointer" : "default", transition: "background .1s", ...style,
  }}>
    {children}
  </div>
);

const Badge = ({ children, tone = "neutral" }) => {
  const map = {
    neutral: { dot: T.inkFaint, fg: T.inkSoft },
    green: { dot: T.green, fg: T.ink },
    orange: { dot: T.orange, fg: T.orange },
    red: { dot: T.red, fg: T.red },
    blue: { dot: T.blue, fg: T.ink },
    purple: { dot: T.purple, fg: T.purple },
    teal: { dot: T.teal, fg: T.teal },
  };
  const c = map[tone] || map.neutral;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: c.fg, fontSize: 12, fontWeight: 600, padding: "3px 9px", borderRadius: 6, whiteSpace: "nowrap", lineHeight: 1.5, border: `1px solid ${T.separator}` }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
      {children}
    </span>
  );
};

const Btn = ({ children, onClick, kind = "filled", tone = "blue", size = "md", style, disabled, type = "button", href, ...rest }) => {
  const color = T[tone] || T.blue;
  const base = {
    filled: { background: disabled ? T.fill : color, color: disabled ? T.inkFaint : "#fff", border: "none" },
    tinted: { background: disabled ? T.fill : T.card, color: disabled ? T.inkFaint : (tone === "red" ? T.red : T.ink), border: `1px solid ${T.separator}` },
    text: { background: "transparent", color: disabled ? T.inkFaint : color, border: "none", padding: "6px 4px" },
    outline: { background: "#fff", color, border: `1px solid ${T.separator}` },
  };
  const sizes = { sm: { fontSize: 13, padding: "6px 12px" }, md: { fontSize: 15, padding: "10px 16px" } };
  const commonStyle = {
    ...base[kind], ...sizes[size], display: "inline-flex", alignItems: "center", gap: 6,
    fontWeight: 600, borderRadius: kind === "text" ? 0 : 8, cursor: disabled ? "default" : "pointer", textDecoration: "none", ...style,
  };
  // Enlace externo real (abre en pestaña nueva sin reemplazar la app) en vez de window.open, que algunos navegadores navegan en la misma pestaña.
  if (href && !disabled) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="cc-tap" style={commonStyle} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} className="cc-tap" disabled={disabled} onClick={onClick} style={commonStyle} {...rest}>
      {children}
    </button>
  );
};

const IconBtn = ({ icon: Icon, onClick, tone = "inkSoft", size = 30 }) => (
  <button className="cc-tap" onClick={onClick} style={{
    width: size, height: size, borderRadius: "50%", border: "none", background: T.fill,
    display: "flex", alignItems: "center", justifyContent: "center", color: T[tone] || T.inkSoft, cursor: "pointer", flexShrink: 0,
  }}>
    <Icon size={size * 0.5} strokeWidth={2.3} />
  </button>
);

const SegmentedControl = ({ options, value, onChange }) => (
  <div style={{ display: "inline-flex", background: T.fill, borderRadius: 8, padding: 2, gap: 2 }}>
    {options.map((opt) => {
      const active = opt.value === value;
      return (
        <button key={opt.value} onClick={() => onChange(opt.value)} className="cc-tap" style={{
          border: "none", cursor: "pointer", padding: "6px 14px", borderRadius: 6, fontSize: 13, fontWeight: 600,
          background: active ? T.card : "transparent", color: active ? T.ink : T.inkSoft,
          boxShadow: active ? `0 1px 2px rgba(0,0,0,0.08)` : "none", transition: "all .15s",
        }}>{opt.label}</button>
      );
    })}
  </div>
);

const inputStyle = { border: `1px solid ${T.separator}`, borderRadius: 8, padding: "10px 12px", fontSize: 15, color: T.ink, background: T.card, outline: "none", width: "100%" };

const Field = ({ label, children }) => (
  <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
    <span style={{ color: T.inkSoft, fontWeight: 600 }}>{label}</span>
    {children}
  </label>
);

const EmptyHint = ({ text, icon: Icon }) => (
  <div style={{ textAlign: "center", padding: "40px 20px", color: T.inkFaint }}>
    {Icon && <Icon size={30} strokeWidth={1.5} style={{ marginBottom: 10, opacity: 0.6 }} />}
    <div style={{ fontSize: 14 }}>{text}</div>
  </div>
);

const ReportLetterhead = ({ title }) => (
  <div className="print-only" style={{ textAlign: "center", marginBottom: 18, paddingBottom: 12, borderBottom: "2px solid #1C1C1E" }}>
    <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: 0.3 }}>SECUNDARIA TÉCNICA No. 84</div>
    <div style={{ fontSize: 12.5, color: "#555", marginTop: 3 }}>{title} · Ciclo escolar 2026–2027</div>
  </div>
);

const FirmasBlock = ({ roles = ["Docente", "Coordinador(a)", "Director(a)"] }) => (
  <div className="print-only-flex" style={{ justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginTop: 50 }}>
    {roles.map((rol) => (
      <div key={rol} style={{ flex: 1, minWidth: 150, textAlign: "center" }}>
        <div style={{ height: 46 }} />
        <div style={{ borderTop: "1px solid #1C1C1E", paddingTop: 6, fontSize: 12, fontWeight: 600, color: "#1C1C1E" }}>
          Nombre y firma del {rol}
        </div>
      </div>
    ))}
  </div>
);

const Sheet = ({ title, onClose, onSave, saveLabel = "Guardar", saveDisabled, children, isMobile }) => (
  <div className="no-print" style={{
    position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.35)",
    display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", animation: "cc-fade-in .18s ease",
  }} onClick={onClose}>
    <div onClick={(e) => e.stopPropagation()} style={{
      background: T.bg, width: isMobile ? "100%" : 560, maxWidth: "100%", maxHeight: isMobile ? "88vh" : "85vh",
      borderRadius: isMobile ? "16px 16px 0 0" : 16, display: "flex", flexDirection: "column",
      animation: isMobile ? "cc-sheet-up .25s cubic-bezier(.32,.72,0,1)" : "cc-pop .18s ease", overflow: "hidden",
    }}>
      {isMobile && <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 2px" }}><div style={{ width: 36, height: 5, borderRadius: 3, background: "#D1D1D6" }} /></div>}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: `0.5px solid ${T.separator}`, background: T.bgElevated }}>
        <Btn kind="text" onClick={onClose}>Cancelar</Btn>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
        <Btn kind="text" onClick={onSave} disabled={saveDisabled} style={{ fontWeight: 700 }}>{saveLabel}</Btn>
      </div>
      <div style={{ padding: 16, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>{children}</div>
    </div>
  </div>
);

const ScreenHeader = ({ title, subtitle, action, avatar }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
        {avatar}
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontFamily: headFont, fontSize: "clamp(22px, 6vw, 30px)", fontWeight: 700, letterSpacing: -0.3, margin: 0, color: T.ink }}>{title}</h1>
          {subtitle && <div style={{ color: T.inkSoft, fontSize: 14, marginTop: 3 }}>{subtitle}</div>}
        </div>
      </div>
      {action && <div className="no-print" style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" }}>{action}</div>}
    </div>
  </div>
);

/* ============================== AUTH ============================== */
function Login() {
  const rootRef = useRef(null);
  const isMobile = useIsMobile(rootRef);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setInfo(""); setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError("Correo o contraseña incorrectos, o tu cuenta aún no ha sido invitada.");
  };

  const handleForgot = async () => {
    if (!email) { setError("Escribe tu correo arriba y vuelve a intentar."); return; }
    setError(""); setInfo("");
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) setError("No se pudo enviar el correo de recuperación.");
    else setInfo("Te enviamos un enlace a tu correo para restablecer tu contraseña.");
  };

  return (
    <div ref={rootRef} className="cc-root" style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? 0 : 20 }}>
      <GlobalStyle />
      <div style={{ width: 880, maxWidth: "100%", minHeight: isMobile ? "100vh" : 520, display: "flex", flexWrap: "wrap", alignContent: "flex-start", borderRadius: isMobile ? 0 : 14, overflow: "hidden", border: isMobile ? "none" : `1px solid ${T.separator}`, boxShadow: isMobile ? "none" : "0 1px 3px rgba(0,0,0,0.05)" }}>

        <div style={{
          flex: isMobile ? "0 0 auto" : "1 1 340px", width: isMobile ? "100%" : "auto", minWidth: isMobile ? "100%" : 300, background: T.sidebar, position: "relative", overflow: "hidden",
          display: "flex", flexDirection: isMobile ? "row" : "column", alignItems: isMobile ? "center" : "stretch", justifyContent: isMobile ? "flex-start" : "space-between",
          padding: isMobile ? "18px 20px" : 40,
          backgroundImage: isMobile ? "none" : `repeating-linear-gradient(115deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent 34px)`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <LogoMark size={isMobile ? 26 : 30} radius={8} />
            <span style={{ fontFamily: headFont, fontSize: isMobile ? 15 : 17, fontWeight: 600, color: "#fff" }}>CoordinadorPro</span>
          </div>
          {!isMobile && (
            <>
              <div>
                <div style={{ fontFamily: headFont, fontSize: 28, fontWeight: 600, color: "#fff", lineHeight: 1.3, maxWidth: 300 }}>Coordinación académica, en un solo lugar.</div>
                <div style={{ fontSize: 13.5, color: T.sidebarTextMuted, marginTop: 14, maxWidth: 280, lineHeight: 1.6 }}>Visitas, observación de clase, planeaciones y expedientes docentes de la Secundaria Técnica No. 84.</div>
              </div>
              <div style={{ fontSize: 12, color: T.sidebarTextMuted }}>Ciclo escolar 2026–2027</div>
            </>
          )}
        </div>

        <div style={{ flex: "1 1 340px", minWidth: 300, background: T.card, display: "flex", flexDirection: "column", justifyContent: "center", padding: isMobile ? "32px 24px" : 48 }}>
          <div style={{ maxWidth: 320, width: "100%" }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.blue, marginBottom: 8 }}>BIENVENIDO DE VUELTA</div>
            <h1 style={{ fontFamily: headFont, fontSize: 25, fontWeight: 600, color: T.ink, margin: "0 0 28px" }}>Inicia sesión</h1>

            <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Correo institucional">
                <input type="email" required autoComplete="username" style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu.nombre@tudominio.edu.mx" />
              </Field>
              <Field label="Contraseña">
                <input type="password" required autoComplete="current-password" style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} />
              </Field>
              {error && <div style={{ fontSize: 12.5, color: T.red }}>{error}</div>}
              {info && <div style={{ fontSize: 12.5, color: T.green }}>{info}</div>}
              <Btn type="submit" disabled={loading} style={{ justifyContent: "center", marginTop: 6 }}>{loading ? "Entrando…" : "Entrar"}</Btn>
              <button type="button" onClick={handleForgot} style={{ background: "none", border: "none", color: T.inkSoft, fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: "4px 0", textAlign: "center" }}>
                ¿Olvidaste tu contraseña?
              </button>
            </form>
            <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 28, textAlign: "center" }}>
              El acceso es solo por invitación. Si no tienes cuenta, pídele a tu coordinador que te invite.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== AUTH GATE (default export) ============================== */
function SetNewPassword({ onDone, invite }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres."); return; }
    if (password !== confirm) { setError("Las contraseñas no coinciden."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError("No se pudo guardar la contraseña. Intenta de nuevo."); return; }
    window.history.replaceState({}, document.title, window.location.pathname);
    onDone();
  };

  return (
    <div className="cc-root" style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <GlobalStyle />
      <Card style={{ width: 380, maxWidth: "100%", padding: 28 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: T.blueTint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Lock size={22} color={T.blue} />
        </div>
        <h1 style={{ fontFamily: headFont, fontSize: 21, fontWeight: 600, margin: 0, color: T.ink }}>{invite ? "Crea tu contraseña" : "Restablece tu contraseña"}</h1>
        <div style={{ fontSize: 13.5, color: T.inkSoft, marginTop: 4, marginBottom: 22 }}>
          {invite ? "Es la primera vez que entras. Elige una contraseña para tu cuenta." : "Elige una nueva contraseña para tu cuenta."}
        </div>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Nueva contraseña">
            <input type="password" required autoComplete="new-password" style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Field label="Confirmar contraseña">
            <input type="password" required autoComplete="new-password" style={inputStyle} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </Field>
          {error && <div style={{ fontSize: 12.5, color: T.red }}>{error}</div>}
          <Btn type="submit" disabled={loading} style={{ justifyContent: "center", marginTop: 6 }}>{loading ? "Guardando…" : "Guardar y entrar"}</Btn>
        </form>
      </Card>
    </div>
  );
}

function InviteError() {
  return (
    <div className="cc-root" style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <GlobalStyle />
      <Card style={{ width: 380, maxWidth: "100%", padding: 28, textAlign: "center" }}>
        <h1 style={{ fontFamily: headFont, fontSize: 19, fontWeight: 600, margin: 0, color: T.ink }}>El enlace ya no es válido</h1>
        <div style={{ fontSize: 13.5, color: T.inkSoft, marginTop: 10, marginBottom: 20 }}>
          Los enlaces de invitación y recuperación son de un solo uso y expiran después de un tiempo. Pídele a tu coordinador que te reenvíe la invitación, o usa "¿Olvidaste tu contraseña?" en la pantalla de acceso.
        </div>
        <Btn onClick={() => { window.history.replaceState({}, document.title, window.location.pathname); window.location.reload(); }} style={{ justifyContent: "center" }}>Ir a la pantalla de acceso</Btn>
      </Card>
    </div>
  );
}

export default function AuthGate() {
  const [session, setSession] = useState(undefined); // undefined = cargando
  // Se detecta ANTES de que Supabase limpie el fragmento de la URL (#access_token=...&type=invite)
  const [authFlowType, setAuthFlowType] = useState(() => {
    if (typeof window === "undefined") return null;
    const hash = window.location.hash || "";
    if (hash.includes("type=invite")) return "invite";
    if (hash.includes("type=recovery")) return "recovery";
    return null;
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => listener.subscription.unsubscribe();
  }, []);

  const Loading = () => (
    <div className="cc-root" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg, color: T.inkSoft, fontSize: 14 }}>
      <GlobalStyle />
      Cargando…
    </div>
  );

  // Venimos de un enlace de invitación o de recuperación de contraseña
  if (authFlowType) {
    if (session === undefined) return <Loading />;
    if (!session) return <InviteError />;
    return <SetNewPassword invite={authFlowType === "invite"} onDone={() => setAuthFlowType(null)} />;
  }

  if (session === undefined) return <Loading />;
  if (!session) return <Login />;
  return <AppShell session={session} />;
}

/* ============================== APP SHELL ============================== */
function AppShell({ session }) {
  const rootRef = useRef(null);
  const isMobile = useIsMobile(rootRef);

  const [ready, setReady] = useState(false);
  const [active, setActive] = useState("dashboard");
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [teachers, setTeachers] = useState([]);
  const [visits, setVisits] = useState([]);
  const [observations, setObservations] = useState([]);
  const [evalPeriods, setEvalPeriods] = useState([]);
  const [incidencias, setIncidencias] = useState([]);
  const [cte, setCte] = useState([]);
  const [planeaciones, setPlaneaciones] = useState([]);

  useEffect(() => {
    (async () => {
      const [tch, vis, obs, evp, inc, cteData, plan] = await Promise.all([
        loadKey(KEYS.teachers, null),
        loadKey(KEYS.visits, null),
        loadKey(KEYS.observations, []),
        loadKey(KEYS.evalPeriods, null),
        loadKey(KEYS.incidencias, []),
        loadKey(KEYS.cte, null),
        loadKey(KEYS.planeaciones, null),
      ]);
      // null = nunca se guardó (primera vez, usar datos de ejemplo).
      // Un arreglo vacío es una elección deliberada del usuario y debe respetarse.
      const finalTeachers = (tch !== null ? tch : seedTeachers()).map(normalizeTeacher);
      const finalVisits = (vis !== null ? vis : seedVisits(finalTeachers)).map(normalizeVisit);
      const finalPlaneaciones = (plan !== null ? plan : seedPlaneaciones(finalTeachers)).map(normalizePlaneacion);
      setTeachers(finalTeachers);
      setVisits(finalVisits);
      setObservations(obs || []);
      setEvalPeriods(evp !== null ? evp : seedEvalPeriods());
      setIncidencias((inc || []).map(normalizeIncidencia));
      setCte(cteData !== null ? cteData : seedCte());
      setPlaneaciones(finalPlaneaciones);
      setReady(true);
    })();
  }, []);

  const persistTeachers = useCallback((next) => { setTeachers(next); saveKey(KEYS.teachers, next); }, []);
  const persistVisits = useCallback((next) => { setVisits(next); saveKey(KEYS.visits, next); }, []);
  const persistObservations = useCallback((next) => { setObservations(next); saveKey(KEYS.observations, next); }, []);
  const persistEvalPeriods = useCallback((next) => { setEvalPeriods(next); saveKey(KEYS.evalPeriods, next); }, []);
  const persistIncidencias = useCallback((next) => { setIncidencias(next); saveKey(KEYS.incidencias, next); }, []);
  const persistCte = useCallback((next) => { setCte(next); saveKey(KEYS.cte, next); }, []);
  const persistPlaneaciones = useCallback((next) => { setPlaneaciones(next); saveKey(KEYS.planeaciones, next); }, []);

  const [obsPrefill, setObsPrefill] = useState(null);
  const goToObservation = useCallback((teacherId) => { setObsPrefill(teacherId); setActive("observacion"); }, []);
  const clearObsPrefill = useCallback(() => setObsPrefill(null), []);

  const [obsViewPrefill, setObsViewPrefill] = useState(null);
  const goToObservationRecord = useCallback((observationId) => { setObsViewPrefill(observationId); setActive("observacion"); }, []);
  const clearObsViewPrefill = useCallback(() => setObsViewPrefill(null), []);

  const teacherName = (id) => teachers.find((t) => t.id === id)?.name || "—";
  const signOut = () => supabase.auth.signOut();

  const nav = [
    { id: "dashboard", label: "Inicio", icon: LayoutGrid },
    { id: "calendario", label: "Calendario", icon: Calendar },
    { id: "visitas", label: "Visitas", icon: CalendarCheck },
    { id: "observacion", label: "Observación", icon: ClipboardCheck },
    { id: "evaluaciones", label: "Evaluaciones", icon: CalendarClock },
    { id: "planeaciones", label: "Planeaciones", icon: FileText },
    { id: "docentes", label: "Docentes", icon: Users },
    { id: "incidencias", label: "Incidencias", icon: AlertTriangle },
    { id: "cte", label: "CTE", icon: BookOpenCheck },
  ];
  const MOBILE_PRIMARY_IDS = ["dashboard", "visitas", "observacion", "docentes"];
  const mobilePrimaryNav = MOBILE_PRIMARY_IDS.map((id) => nav.find((n) => n.id === id));
  const mobileMoreNav = nav.filter((n) => !MOBILE_PRIMARY_IDS.includes(n.id));
  const isInMoreSection = mobileMoreNav.some((n) => n.id === active);

  if (!ready) {
    return (
      <div ref={rootRef} className="cc-root" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg, color: T.inkSoft, fontSize: 14 }}>
        <GlobalStyle />
        Cargando coordinación académica…
      </div>
    );
  }

  const moduleProps = { teachers, visits, observations, evalPeriods, incidencias, cte, planeaciones, teacherName, isMobile, session,
    setVisits: persistVisits, setObservations: persistObservations, setEvalPeriods: persistEvalPeriods,
    setTeachers: persistTeachers, setIncidencias: persistIncidencias, setCte: persistCte, setPlaneaciones: persistPlaneaciones, setActive,
    goToObservation, obsPrefill, clearObsPrefill,
    goToObservationRecord, obsViewPrefill, clearObsViewPrefill };

  return (
    <div ref={rootRef} className="cc-root" style={{ display: "flex", minHeight: "100vh", background: T.bg, color: T.ink }}>
      <GlobalStyle />

      {!isMobile && (
        <div className="no-print" style={{ width: 240, flexShrink: 0, padding: "18px 12px", display: "flex", flexDirection: "column", gap: 16, background: T.sidebar }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "2px 8px 12px" }}>
            <LogoMark />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: headFont, fontWeight: 600, fontSize: 15, color: "#fff", letterSpacing: -0.1, lineHeight: 1.15 }}>CoordinadorPro</div>
              <div style={{ fontSize: 11.5, color: T.sidebarTextMuted, marginTop: 1 }}>Sec. Técnica No. 84</div>
            </div>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {nav.map((n) => {
              const Icon = n.icon;
              const isActive = active === n.id;
              return (
                <button key={n.id} onClick={() => setActive(n.id)} className="cc-tap" style={{
                  display: "flex", alignItems: "center", gap: 10, textAlign: "left", padding: "9px 10px", borderRadius: 8,
                  border: "none", cursor: "pointer", fontSize: 14, fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#fff" : T.sidebarTextMuted, background: isActive ? T.sidebarActive : "transparent",
                }}>
                  <Icon size={18} strokeWidth={2.1} color={isActive ? T.blue : "currentColor"} />
                  {n.label}
                </button>
              );
            })}
          </nav>
          <div style={{ marginTop: "auto", paddingTop: 12, borderTop: `1px solid ${T.sidebarBorder}` }}>
            <div style={{ fontSize: 11.5, color: T.sidebarTextMuted, padding: "0 10px", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.user.email}</div>
            <button onClick={signOut} className="cc-tap" style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", border: "none", background: "transparent", color: "oklch(72% 0.15 25)", fontSize: 13, fontWeight: 600, cursor: "pointer", borderRadius: 8 }}>
              <LogOut size={15} /> Cerrar sesión
            </button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {isMobile && (
          <div className="no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: `1px solid ${T.separator}`, background: T.bgElevated }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <LogoMark size={28} radius={8} />
              <div style={{ fontFamily: headFont, fontWeight: 600, fontSize: 15, color: T.ink }}>CoordinadorPro</div>
            </div>
            <button onClick={signOut} className="cc-tap" style={{ background: "none", border: "none", color: T.red, display: "flex", alignItems: "center", gap: 4, fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
              <LogOut size={14} /> Salir
            </button>
          </div>
        )}
        <div style={{ flex: 1, padding: isMobile ? "18px 16px 90px" : "26px 32px", overflow: "auto" }}>
          {active === "dashboard" && <Dashboard {...moduleProps} />}
          {active === "visitas" && <VisitasModule {...moduleProps} />}
          {active === "observacion" && <ObservacionModule {...moduleProps} />}
          {active === "evaluaciones" && <EvaluacionesModule {...moduleProps} />}
          {active === "planeaciones" && <PlaneacionesModule {...moduleProps} />}
          {active === "docentes" && <DocentesModule {...moduleProps} />}
          {active === "incidencias" && <IncidenciasModule {...moduleProps} />}
          {active === "cte" && <CteModule {...moduleProps} />}
          {active === "calendario" && <CalendarioModule {...moduleProps} />}
        </div>
      </div>

      {isMobile && showMoreMenu && (
        <div className="no-print" style={{
          position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.35)",
          display: "flex", alignItems: "flex-end", justifyContent: "center", animation: "cc-fade-in .18s ease",
        }} onClick={() => setShowMoreMenu(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: T.bg, width: "100%", maxHeight: "70vh", borderRadius: "18px 18px 0 0",
            display: "flex", flexDirection: "column", animation: "cc-sheet-up .25s cubic-bezier(.32,.72,0,1)",
            overflow: "hidden", paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
          }}>
            <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 2px" }}><div style={{ width: 36, height: 5, borderRadius: 3, background: "#D1D1D6" }} /></div>
            <div style={{ padding: "10px 18px 12px", fontWeight: 800, fontSize: 16, color: T.ink }}>Más secciones</div>
            <div style={{ overflowY: "auto", padding: "0 10px" }}>
              {mobileMoreNav.map((n) => {
                const Icon = n.icon;
                const isActive = active === n.id;
                return (
                  <button key={n.id} onClick={() => { setActive(n.id); setShowMoreMenu(false); }} className="cc-tap" style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 14, padding: "13px 12px", marginBottom: 2,
                    border: "none", borderRadius: 8, cursor: "pointer", textAlign: "left",
                    background: isActive ? T.fill : "transparent", color: T.ink,
                    fontSize: 15, fontWeight: isActive ? 600 : 500,
                  }}>
                    <Icon size={20} strokeWidth={2.1} color={isActive ? T.blue : T.inkSoft} />
                    {n.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {isMobile && (
        <div className="no-print" style={{
          position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 900, display: "flex", justifyContent: "space-around",
          background: "rgba(249,249,251,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderTop: `0.5px solid ${T.separator}`, padding: "6px 2px calc(6px + env(safe-area-inset-bottom))",
        }}>
          {mobilePrimaryNav.map((n) => {
            const Icon = n.icon;
            const isActive = active === n.id;
            return (
              <button key={n.id} onClick={() => setActive(n.id)} style={{
                background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column",
                alignItems: "center", gap: 2, padding: "4px 6px", color: isActive ? T.blue : T.inkFaint, flex: 1, minWidth: 0,
              }}>
                <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
                <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, whiteSpace: "nowrap" }}>{n.label}</span>
              </button>
            );
          })}
          <button onClick={() => setShowMoreMenu(true)} style={{
            background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column",
            alignItems: "center", gap: 2, padding: "4px 6px", color: isInMoreSection ? T.blue : T.inkFaint, flex: 1, minWidth: 0,
          }}>
            <MoreHorizontal size={22} strokeWidth={isInMoreSection ? 2.4 : 2} />
            <span style={{ fontSize: 10, fontWeight: isInMoreSection ? 700 : 500, whiteSpace: "nowrap" }}>Más</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ============================== DASHBOARD ============================== */
function Dashboard({ teachers, visits, observations, evalPeriods, incidencias, cte, setActive, isMobile }) {
  const completed = visits.filter((v) => v.status === "realizada").length;
  const pct = visits.length ? Math.round((completed / visits.length) * 100) : 0;

  const avgScore = useMemo(() => {
    if (!observations.length) return null;
    let sum = 0, n = 0;
    observations.forEach((o) => Object.values(o.scores || {}).forEach((v) => { if (v) { sum += v; n++; } }));
    return n ? (sum / n).toFixed(2) : null;
  }, [observations]);

  const openIncidents = incidencias.filter((i) => i.status !== "cerrada").length;

  const nextEval = useMemo(() => {
    const future = evalPeriods.map((p) => ({ ...p, d: daysUntil(p.entrega) })).filter((p) => p.d >= 0).sort((a, b) => a.d - b.d);
    return future[0] || null;
  }, [evalPeriods]);

  const categoryAverages = useMemo(() => RUBRIC.map((cat) => {
    let sum = 0, n = 0;
    observations.forEach((o) => cat.items.forEach((it) => { const v = o.scores?.[it.id]; if (v) { sum += v; n++; } }));
    return { categoria: cat.id, titulo: cat.titulo, promedio: n ? +(sum / n).toFixed(2) : 0 };
  }), [observations]);

  const cteOpen = cte.filter((s) => s.status !== "cumplido").length;

  const cards = [
    { label: "Docentes", value: teachers.length, tone: "blue", icon: Users, onClick: () => setActive("docentes") },
    { label: "Visitas realizadas", value: `${completed}/${visits.length}`, sub: `${pct}%`, tone: "green", icon: CalendarCheck, onClick: () => setActive("visitas") },
    { label: "Promedio observación", value: avgScore ?? "—", sub: avgScore ? "de 4" : "sin datos", tone: "orange", icon: ClipboardCheck, onClick: () => setActive("observacion") },
    { label: "Incidencias abiertas", value: openIncidents, tone: "red", icon: AlertTriangle, onClick: () => setActive("incidencias") },
  ];

  return (
    <div>
      <ScreenHeader title="Inicio" subtitle="Ciclo escolar 2026–2027" />
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10, marginBottom: 18 }}>
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} onClick={c.onClick} className="cc-tap" style={{ padding: 16, cursor: "pointer" }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: T[`${c.tone}Tint`], display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <Icon size={17} color={T[c.tone]} strokeWidth={2.3} />
              </div>
              <div style={{ fontFamily: headFont, fontSize: 26, fontWeight: 600, color: T.ink, letterSpacing: -0.3 }}>{c.value}</div>
              <div style={{ fontSize: 12.5, color: T.inkSoft, fontWeight: 600, marginTop: 2 }}>{c.label}</div>
              {c.sub && <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 2 }}>{c.sub}</div>}
            </Card>
          );
        })}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.3fr 1fr", gap: 12 }}>
        <Card style={{ padding: 18 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Promedio por categoría</div>
          {avgScore ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {categoryAverages.map((c) => (
                <div key={c.categoria}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                    <span style={{ color: T.inkSoft }}>{c.categoria}. {c.titulo}</span>
                    <span style={{ fontWeight: 700 }}>{c.promedio || "—"}</span>
                  </div>
                  <div style={{ height: 6, background: T.fill, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${(c.promedio / 4) * 100}%`, height: "100%", background: T.orange, borderRadius: 3 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : <EmptyHint text="Todavía no hay observaciones de clase registradas." />}
        </Card>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Card style={{ padding: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Próxima entrega</div>
            {nextEval ? (
              <div>
                <div style={{ fontSize: 12.5, color: T.inkSoft, marginBottom: 3 }}>Periodo {nextEval.periodo}</div>
                <div style={{ fontFamily: headFont, fontSize: 20, fontWeight: 600 }}>{fmtDate(nextEval.entrega)}</div>
                <div style={{ marginTop: 8 }}><Badge tone={nextEval.d <= 7 ? "red" : "orange"}>{nextEval.d === 0 ? "es hoy" : `en ${nextEval.d} días`}</Badge></div>
              </div>
            ) : <EmptyHint text="No hay entregas pendientes." />}
          </Card>
          <Card style={{ padding: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Consejo Técnico Escolar</div>
            <div style={{ fontSize: 13, color: T.inkSoft }}>{cte.length} sesión(es) · <strong style={{ color: T.ink }}>{cteOpen}</strong> con acuerdos pendientes</div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ============================== CALENDARIO MODULE ============================== */
const CAL_LEYENDA = [
  { type: "cte", tone: "purple", label: "CTE" },
  { type: "evaluacion", tone: "orange", label: "Evaluaciones" },
  { type: "visita", tone: "green", label: "Visitas" },
  { type: "incidencia", tone: "red", label: "Incidencias" },
];
const CAL_DIAS = ["D", "L", "M", "M", "J", "V", "S"];
const CAL_MODULO_POR_TIPO = { cte: "cte", evaluacion: "evaluaciones", visita: "visitas", incidencia: "incidencias" };

function CalendarioModule({ visits, cte, evalPeriods, incidencias, teacherName, setActive, isMobile }) {
  const today = todayIso();
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { year: d.getFullYear(), month: d.getMonth() }; });
  const [selectedDate, setSelectedDate] = useState(today);

  const events = useMemo(() => {
    const map = {};
    const add = (date, ev) => { if (!date) return; (map[date] ||= []).push(ev); };
    cte.forEach((s) => add(s.fecha, { type: "cte", tone: "purple", label: s.tema || "Sesión de CTE" }));
    evalPeriods.forEach((p) => {
      add(p.entrega, { type: "evaluacion", tone: "orange", label: `Entrega Periodo ${p.periodo} a coordinación` });
      add(p.evalInicio, { type: "evaluacion", tone: "orange", label: `Inicia evaluación · Periodo ${p.periodo}` });
      add(p.evalFin, { type: "evaluacion", tone: "orange", label: `Termina evaluación · Periodo ${p.periodo}` });
    });
    visits.filter((v) => v.fecha).forEach((v) => add(v.fecha, { type: "visita", tone: "green", label: `Visita a ${teacherName(v.teacherId)}${v.tipo === "sorpresa" ? " (sorpresa)" : ""}` }));
    incidencias.map(normalizeIncidencia).forEach((i) => add(i.fecha, { type: "incidencia", tone: "red", label: i.descripcion ? i.descripcion.slice(0, 70) : "Incidencia registrada" }));
    return map;
  }, [cte, evalPeriods, visits, incidencias, teacherName]);

  const { year, month } = cursor;
  const monthLabel = new Date(year, month, 1).toLocaleDateString("es-MX", { month: "long", year: "numeric" });
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const isoOf = (d) => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const shiftMonth = (delta) => setCursor((c) => {
    const nm = c.month + delta;
    if (nm < 0) return { year: c.year - 1, month: 11 };
    if (nm > 11) return { year: c.year + 1, month: 0 };
    return { year: c.year, month: nm };
  });
  const goToday = () => { const d = new Date(); setCursor({ year: d.getFullYear(), month: d.getMonth() }); setSelectedDate(today); };

  const selectedEvents = events[selectedDate] || [];

  return (
    <div>
      <ScreenHeader title="Calendario" subtitle="Visitas, CTE, evaluaciones e incidencias en un solo lugar" />

      <div className="no-print" style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {CAL_LEYENDA.map((l) => (
          <div key={l.type} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: T.inkSoft }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: T[l.tone] }} />
            {l.label}
          </div>
        ))}
      </div>

      <Card style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontFamily: headFont, fontSize: 17, fontWeight: 600, textTransform: "capitalize" }}>{monthLabel}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <IconBtn icon={ChevronLeft} size={28} onClick={() => shiftMonth(-1)} />
            <Btn kind="tinted" size="sm" onClick={goToday}>Hoy</Btn>
            <IconBtn icon={ChevronRight} size={28} onClick={() => shiftMonth(1)} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 4 }}>
          {CAL_DIAS.map((d, idx) => <div key={idx} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: T.inkFaint, padding: "4px 0" }}>{d}</div>)}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
          {cells.map((d, idx) => {
            if (!d) return <div key={idx} />;
            const iso = isoOf(d);
            const dayEvents = events[iso] || [];
            const isToday = iso === today;
            const isSelected = iso === selectedDate;
            return (
              <button key={idx} onClick={() => setSelectedDate(iso)} className="cc-tap" style={{
                aspectRatio: "1", border: isSelected ? `1.5px solid ${T.blue}` : `1px solid ${isToday ? T.blue : "transparent"}`,
                borderRadius: 8, background: isSelected ? T.blueTint : T.fill, cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, padding: 2,
              }}>
                <span style={{ fontSize: isMobile ? 12 : 13, fontWeight: isToday ? 700 : 500, color: T.ink }}>{d}</span>
                {dayEvents.length > 0 && (
                  <div style={{ display: "flex", gap: 2 }}>
                    {dayEvents.slice(0, 3).map((ev, i) => <span key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: T[ev.tone] }} />)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <Card style={{ padding: 16 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 10 }}>{fmtDate(selectedDate)}</div>
        {selectedEvents.length === 0 ? (
          <EmptyHint icon={Calendar} text="Sin eventos registrados este día." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {selectedEvents.map((ev, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: T[ev.tone], flexShrink: 0 }} />
                <div style={{ flex: 1, fontSize: 13.5 }}>{ev.label}</div>
                <button className="no-print" onClick={() => setActive(CAL_MODULO_POR_TIPO[ev.type])} style={{ background: "none", border: "none", color: T.blue, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>Ver →</button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ============================== VISITAS MODULE ============================== */
function VisitasModule({ teachers, visits, setVisits, isMobile, goToObservation, goToObservationRecord, teacherName }) {
  const [filter, setFilter] = useState("");
  const [sorpresaDraft, setSorpresaDraft] = useState(null);
  const months = ["SEPT", "OCT", "ENERO", "FEBRERO", "ABRIL", "JUNIO"];

  const grouped = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return teachers.filter((t) => !q || t.name.toLowerCase().includes(q) || t.disciplina.toLowerCase().includes(q))
      .map((t) => ({ teacher: t, visits: visits.filter((v) => v.teacherId === t.id && v.tipo !== "sorpresa") }));
  }, [teachers, visits, filter]);

  const sorpresas = useMemo(() =>
    visits.filter((v) => v.tipo === "sorpresa").slice().sort((a, b) => (b.fecha || "").localeCompare(a.fecha || "")),
  [visits]);

  const toggleStatus = (visitId) => setVisits(visits.map((v) => v.id === visitId ? { ...v, status: v.status === "realizada" ? "pendiente" : "realizada" } : v));
  const completed = visits.filter((v) => v.status === "realizada").length;

  const saveSorpresa = () => {
    if (!sorpresaDraft.teacherId || !sorpresaDraft.fecha) return;
    setVisits([...visits, { id: uid("v"), teacherId: sorpresaDraft.teacherId, month: "SORPRESA", semana: "", status: "realizada", notas: sorpresaDraft.notas, tipo: "sorpresa", fecha: sorpresaDraft.fecha, observationId: null }]);
    setSorpresaDraft(null);
  };
  const removeSorpresa = (id) => setVisits(visits.filter((v) => v.id !== id));

  return (
    <div>
      <ReportLetterhead title="Calendario de Visitas de Acompañamiento" />
      <ScreenHeader title="Visitas" subtitle={`${completed} de ${visits.length} realizadas`}
        action={<div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Btn kind="tinted" size="sm" onClick={() => setSorpresaDraft({ teacherId: teachers[0]?.id || "", fecha: todayIso(), notas: "" })}><Plus size={13} /> Visita sorpresa</Btn>
          <Btn kind="tinted" size="sm" onClick={() => window.print()}><Printer size={13} /> Imprimir</Btn>
        </div>} />

      {sorpresaDraft && (
        <Sheet title="Registrar visita sorpresa" onClose={() => setSorpresaDraft(null)} onSave={saveSorpresa} saveDisabled={!sorpresaDraft.teacherId || !sorpresaDraft.fecha} isMobile={isMobile}>
          <Field label="Docente">
            <select style={inputStyle} value={sorpresaDraft.teacherId} onChange={(e) => setSorpresaDraft({ ...sorpresaDraft, teacherId: e.target.value })}>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          <Field label="Fecha"><input type="date" style={inputStyle} value={sorpresaDraft.fecha} onChange={(e) => setSorpresaDraft({ ...sorpresaDraft, fecha: e.target.value })} /></Field>
          <Field label="Notas (opcional)"><textarea style={{ ...inputStyle, minHeight: 70 }} value={sorpresaDraft.notas} onChange={(e) => setSorpresaDraft({ ...sorpresaDraft, notas: e.target.value })} /></Field>
          <div style={{ fontSize: 11.5, color: T.inkFaint }}>Si además quieres registrar la observación de clase completa, hazlo desde el módulo de Observación y marca ahí la casilla "visita sorpresa" — quedará vinculada automáticamente.</div>
        </Sheet>
      )}
      <div className="no-print" style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8, background: T.card, borderRadius: 10, padding: "9px 12px" }}>
        <Search size={15} color={T.inkFaint} />
        <input style={{ border: "none", outline: "none", fontSize: 15, background: "transparent", width: "100%" }} placeholder="Buscar docente o disciplina" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </div>
      <div className="no-print" style={{ fontSize: 12, color: T.inkFaint, marginBottom: 12, display: "flex", alignItems: "center", gap: 5 }}>
        <Clock size={12} /> marca pendiente/realizada · <ClipboardCheck size={12} /> abre la observación de ese docente
      </div>

      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {grouped.map(({ teacher, visits: tv }) => (
            <Card key={teacher.id} style={{ padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>{teacher.name}</div>
              <div style={{ fontSize: 12.5, color: T.inkSoft, marginBottom: 10 }}>{teacher.disciplina}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {tv.map((v) => (
                  <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <button onClick={() => toggleStatus(v.id)} className="cc-tap" title="Marcar pendiente/realizada" style={{
                      border: "none", cursor: "pointer", borderRadius: "10px 0 0 10px", padding: "8px 9px",
                      background: v.status === "realizada" ? T.greenTint : T.fill, color: v.status === "realizada" ? T.blueDark : T.inkSoft, display: "flex", alignItems: "center",
                    }}>{v.status === "realizada" ? <Check size={13} /> : <Clock size={13} />}</button>
                    <button onClick={() => goToObservation(teacher.id)} className="cc-tap" title="Ir a observación de este docente" style={{
                      border: "none", cursor: "pointer", borderRadius: "0 10px 10px 0", padding: "8px 12px 8px 8px",
                      background: v.status === "realizada" ? T.greenTint : T.fill, color: v.status === "realizada" ? T.blueDark : T.inkSoft,
                      fontSize: 12, fontWeight: 700, borderLeft: `1px solid ${v.status === "realizada" ? "oklch(55% 0.15 155 / 0.3)" : T.separator}`,
                    }}>{v.month} · {v.semana}</button>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="cc-scrollx">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 760 }}>
            <thead>
              <tr style={{ background: T.fill }}>
                <th style={thStyle}>Docente</th>
                <th style={thStyle}>Disciplina</th>
                {months.map((m) => <th key={m} style={{ ...thStyle, textAlign: "center" }}>{m}</th>)}
              </tr>
            </thead>
            <tbody>
              {grouped.map(({ teacher, visits: tv }) => (
                <tr key={teacher.id} style={{ borderTop: `0.5px solid ${T.separator}` }}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{teacher.name}</td>
                  <td style={tdStyle}>{teacher.disciplina}</td>
                  {months.map((m) => {
                    const v = tv.find((x) => x.month === m);
                    return (
                      <td key={m} style={{ ...tdStyle, textAlign: "center" }}>
                        {v ? (
                          <div style={{ display: "inline-flex", alignItems: "center", borderRadius: 6, overflow: "hidden" }}>
                            <button onClick={() => toggleStatus(v.id)} className="cc-tap" title="Marcar pendiente/realizada" style={{
                              border: "none", cursor: "pointer", padding: "5px 7px", background: v.status === "realizada" ? T.greenTint : T.fill,
                              color: v.status === "realizada" ? T.blueDark : T.inkSoft, display: "flex", alignItems: "center",
                            }}>{v.status === "realizada" ? <Check size={12} /> : <Clock size={12} />}</button>
                            <button onClick={() => goToObservation(teacher.id)} className="cc-tap" title="Ir a observación de este docente" style={{
                              border: "none", cursor: "pointer", padding: "5px 10px 5px 6px", background: v.status === "realizada" ? T.greenTint : T.fill,
                              color: v.status === "realizada" ? T.blueDark : T.inkSoft, fontSize: 11.5, fontWeight: 700,
                              borderLeft: `1px solid ${v.status === "realizada" ? "oklch(55% 0.15 155 / 0.3)" : T.separator}`,
                            }}>{v.semana}</button>
                          </div>
                        ) : <span style={{ color: T.inkFaint }}>—</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {sorpresas.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Visitas sorpresa ({sorpresas.length})</div>
          <Card>
            {sorpresas.map((v, idx) => (
              <Row key={v.id} last={idx === sorpresas.length - 1} style={{ alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{teacherName(v.teacherId)}</div>
                  <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2 }}>{fmtDate(v.fecha)}{v.notas ? ` · ${v.notas}` : ""}</div>
                </div>
                <div className="no-print" style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  {v.observationId
                    ? <Btn kind="text" size="sm" onClick={() => goToObservationRecord(v.observationId)}>Ver observación</Btn>
                    : <IconBtn icon={Trash2} size={28} tone="red" onClick={() => removeSorpresa(v.id)} />}
                </div>
              </Row>
            ))}
          </Card>
        </div>
      )}
      <FirmasBlock roles={["Coordinador(a)", "Director(a)"]} />
    </div>
  );
}
const thStyle = { textAlign: "left", padding: "10px 14px", fontSize: 11.5, fontWeight: 700, color: T.inkSoft };
const tdStyle = { padding: "10px 14px", color: T.ink, verticalAlign: "middle" };

/* ============================== PLANEACIONES MODULE ============================== */
function PlaneacionesModule({ teachers, planeaciones, setPlaneaciones, isMobile }) {
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState(null);

  const findOrDefault = (teacherId, tipo, idx) =>
    planeaciones.find((p) => p.teacherId === teacherId && p.tipo === tipo) || { id: `pl${teacherId}_${idx}`, teacherId, tipo, status: "pendiente", fecha: "", evaluacion: null };

  const displayFor = (p) => {
    if (p.status !== "entregada") return { label: "Pendiente", tone: "neutral" };
    if (!p.evaluacion) return { label: fmtDateShort(p.fecha), tone: "blue" };
    const { completada } = evaluarPlaneacion(p.tipo, p.evaluacion);
    return completada ? { label: "Completa", tone: "green" } : { label: "Con observaciones", tone: "orange" };
  };

  const grouped = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return teachers.filter((t) => !q || t.name.toLowerCase().includes(q) || t.disciplina.toLowerCase().includes(q))
      .map((t) => ({ teacher: t, items: PLANEACION_TIPOS.map((tipo, idx) => findOrDefault(t.id, tipo, idx)) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teachers, planeaciones, filter]);

  const totalDone = planeaciones.filter((p) => p.status === "entregada").length;
  const totalAll = teachers.length * PLANEACION_TIPOS.length;

  const setMetodologia = (key) => setEditing((e) => ({ ...e, evaluacion: { ...(e.evaluacion || blankEvaluacion()), metodologia: key || null, fases: {} } }));
  const toggleComun = (critId) => setEditing((e) => {
    const ev = e.evaluacion || blankEvaluacion();
    const next = NIVEL_COTEJO_ORDER[(NIVEL_COTEJO_ORDER.indexOf(ev.comunes?.[critId] || "pendiente") + 1) % 3];
    return { ...e, evaluacion: { ...ev, comunes: { ...ev.comunes, [critId]: next } } };
  });
  const toggleFase = (faseId) => setEditing((e) => {
    const ev = e.evaluacion || blankEvaluacion();
    const next = NIVEL_COTEJO_ORDER[(NIVEL_COTEJO_ORDER.indexOf(ev.fases?.[faseId] || "pendiente") + 1) % 3];
    return { ...e, evaluacion: { ...ev, fases: { ...ev.fases, [faseId]: next } } };
  });

  const save = () => {
    const exists = planeaciones.some((p) => p.id === editing.id);
    setPlaneaciones(exists ? planeaciones.map((p) => (p.id === editing.id ? editing : p)) : [...planeaciones, editing]);
    setEditing(null);
  };

  return (
    <div>
      <ReportLetterhead title="Seguimiento de Planeaciones Didácticas" />
      <ScreenHeader title="Planeaciones" subtitle={`${totalDone} de ${totalAll} entregables completados`}
        action={<div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Btn kind="tinted" size="sm" href={PLANEACIONES_DRIVE_URL}><FileText size={13} /> Abrir carpeta de Drive</Btn>
          <Btn kind="tinted" size="sm" onClick={() => window.print()}><Printer size={13} /> Imprimir</Btn>
        </div>} />
      <div className="no-print" style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8, background: T.card, borderRadius: 10, padding: "9px 12px" }}>
        <Search size={15} color={T.inkFaint} />
        <input style={{ border: "none", outline: "none", fontSize: 15, background: "transparent", width: "100%" }} placeholder="Buscar docente o disciplina" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </div>
      <div className="no-print" style={{ fontSize: 12, color: T.inkFaint, marginBottom: 12 }}>
        Toca un entregable para marcar la entrega y la fecha. Los archivos viven en la carpeta de Drive de arriba.
      </div>

      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {grouped.map(({ teacher, items }) => (
            <Card key={teacher.id} style={{ padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5 }}>{teacher.name}</div>
              <div style={{ fontSize: 12.5, color: T.inkSoft, marginBottom: 10 }}>{teacher.disciplina}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {items.map((p) => {
                  const d = displayFor(p);
                  return (
                    <button key={p.tipo} onClick={() => setEditing(p)} className="cc-tap" style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center", border: "none", cursor: "pointer",
                      borderRadius: 10, padding: "8px 10px", background: T.fill, textAlign: "left",
                    }}>
                      <span style={{ fontSize: 12.5, color: T.ink }}>{p.tipo}</span>
                      <Badge tone={d.tone}>{d.label}</Badge>
                    </button>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="cc-scrollx">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 900 }}>
            <thead>
              <tr style={{ background: T.fill }}>
                <th style={thStyle}>Docente</th>
                {PLANEACION_TIPOS.map((tipo) => <th key={tipo} style={{ ...thStyle, textAlign: "center" }}>{tipo}</th>)}
              </tr>
            </thead>
            <tbody>
              {grouped.map(({ teacher, items }) => (
                <tr key={teacher.id} style={{ borderTop: `0.5px solid ${T.separator}` }}>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{teacher.name}</td>
                  {items.map((p) => {
                    const d = displayFor(p);
                    return (
                      <td key={p.tipo} style={{ ...tdStyle, textAlign: "center" }}>
                        <button onClick={() => setEditing(p)} className="cc-tap" style={{ border: "none", cursor: "pointer", background: "none", padding: 0 }}>
                          <Badge tone={d.tone}>{d.label}</Badge>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {editing && (
        <Sheet title={editing.tipo} onClose={() => setEditing(null)} onSave={save} isMobile={isMobile}>
          <div style={{ fontSize: 13, color: T.inkSoft, marginTop: -8 }}>{teachers.find((t) => t.id === editing.teacherId)?.name}</div>
          <Field label="Estatus">
            <SegmentedControl value={editing.status}
              onChange={(v) => setEditing({ ...editing, status: v, fecha: v === "entregada" ? (editing.fecha || todayIso()) : editing.fecha })}
              options={[{ value: "pendiente", label: "Pendiente" }, { value: "entregada", label: "Entregada" }]} />
          </Field>
          <Field label="Fecha de entrega"><input type="date" style={inputStyle} value={editing.fecha} onChange={(e) => setEditing({ ...editing, fecha: e.target.value })} /></Field>
          <Btn kind="tinted" size="sm" href={PLANEACIONES_DRIVE_URL}><FileText size={13} /> Abrir carpeta de Drive</Btn>

          {editing.status === "entregada" && (() => {
            const trimestral = esTrimestral(editing.tipo);
            const criterios = criteriosParaTipo(editing.tipo);
            const ev = editing.evaluacion || blankEvaluacion();
            const result = evaluarPlaneacion(editing.tipo, ev);
            const isComun = (id) => criterios.some((c) => c.id === id);
            return (
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Lista de cotejo</div>
                {trimestral && (
                  <Field label="Metodología utilizada">
                    <select style={inputStyle} value={ev.metodologia || ""} onChange={(e) => setMetodologia(e.target.value)}>
                      <option value="">Elegir…</option>
                      {Object.entries(METODOLOGIAS_NEM).map(([key, m]) => <option key={key} value={key}>{m.nombre}</option>)}
                    </select>
                  </Field>
                )}
                <Card style={{ marginTop: 10 }}>
                  {result.items.map((it, idx) => (
                    <Row key={it.id} last={idx === result.items.length - 1} onClick={() => (isComun(it.id) ? toggleComun(it.id) : toggleFase(it.id))} style={{ alignItems: "flex-start" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{it.nombre}</div>
                        {it.desc && <div style={{ fontSize: 11.5, color: T.inkSoft, marginTop: 2 }}>{it.desc}</div>}
                      </div>
                      <Badge tone={NIVEL_COTEJO[it.nivel].tone}>{NIVEL_COTEJO[it.nivel].label}</Badge>
                    </Row>
                  ))}
                </Card>
                {trimestral && !ev.metodologia && (
                  <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 6 }}>Elige la metodología para revisar sus fases específicas.</div>
                )}
                <div style={{ marginTop: 12 }}>
                  {result.completada
                    ? <Badge tone="green">✓ Planeación completa</Badge>
                    : <Badge tone="orange">Con observaciones</Badge>}
                </div>
                {!result.completada && result.orientaciones.length > 0 && (
                  <Card style={{ padding: 14, marginTop: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8 }}>Orientaciones para el docente</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {result.orientaciones.map((o) => (
                        <div key={o.id} style={{ fontSize: 12.5 }}>
                          <strong>{o.nombre}</strong> · <span style={{ color: T.inkSoft }}>{NIVEL_COTEJO[o.nivel].label}</span>
                          {o.desc && <div style={{ color: T.inkSoft, marginTop: 2 }}>{o.desc}</div>}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            );
          })()}
        </Sheet>
      )}
      <FirmasBlock roles={["Coordinador(a)", "Director(a)"]} />
    </div>
  );
}

/* ============================== OBSERVACIÓN MODULE ============================== */
function ObservacionModule({ teachers, observations, setObservations, visits, setVisits, teacherName, isMobile, obsPrefill, clearObsPrefill, obsViewPrefill, clearObsViewPrefill }) {
  const [mode, setMode] = useState("list");
  const [editingId, setEditingId] = useState(null);
  const blank = () => ({
    id: uid("o"), teacherId: teachers[0]?.id || "", grado: "", grupo: "", asignatura: "", tematica: "",
    fecha: "", horaInicio: "", horaTermino: "", alumnosLista: "", alumnosPresentes: "",
    scores: {}, observaciones: "", recomendaciones: "", autorreflexion: "", sorpresa: false,
  });
  const [draft, setDraft] = useState(blank());

  const startNew = (teacherId) => { const d = blank(); if (teacherId) d.teacherId = teacherId; setDraft(d); setEditingId(null); setMode("form"); };
  const startEdit = (o) => { setDraft(o); setEditingId(o.id); setMode("form"); };
  const view = (o) => { setDraft(o); setMode("view"); };

  useEffect(() => {
    if (obsPrefill) { startNew(obsPrefill); clearObsPrefill(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obsPrefill]);

  useEffect(() => {
    if (obsViewPrefill) {
      const found = observations.find((o) => o.id === obsViewPrefill);
      if (found) view(found);
      clearObsViewPrefill();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [obsViewPrefill]);

  const linkVisit = (obs) => {
    const alreadyLinked = visits.find((v) => v.observationId === obs.id);
    if (alreadyLinked) {
      setVisits(visits.map((v) => (v.id === alreadyLinked.id ? { ...v, fecha: obs.fecha, status: "realizada" } : v)));
      return;
    }
    if (!obs.sorpresa) {
      const pending = visits.find((v) => v.teacherId === obs.teacherId && v.status === "pendiente" && v.tipo !== "sorpresa");
      if (pending) {
        setVisits(visits.map((v) => (v.id === pending.id ? { ...v, status: "realizada", fecha: obs.fecha, observationId: obs.id } : v)));
        return;
      }
    }
    setVisits([...visits, { id: uid("v"), teacherId: obs.teacherId, month: "SORPRESA", semana: "", status: "realizada", notas: "", tipo: "sorpresa", fecha: obs.fecha, observationId: obs.id }]);
  };
  const unlinkVisit = (observationId) => {
    const linked = visits.find((v) => v.observationId === observationId);
    if (!linked) return;
    if (linked.tipo === "sorpresa") setVisits(visits.filter((v) => v.id !== linked.id));
    else setVisits(visits.map((v) => (v.id === linked.id ? { ...v, status: "pendiente", fecha: "", observationId: null } : v)));
  };

  const save = () => {
    if (!draft.teacherId || !draft.fecha) return;
    if (editingId) setObservations(observations.map((o) => (o.id === editingId ? draft : o)));
    else setObservations([draft, ...observations]);
    linkVisit(draft);
    setMode("list");
  };
  const remove = (id) => {
    setObservations(observations.filter((o) => o.id !== id));
    unlinkVisit(id);
  };
  const setScore = (itemId, val) => setDraft({ ...draft, scores: { ...draft.scores, [itemId]: val } });
  const scoreAvg = (o) => {
    const vals = Object.values(o.scores || {}).filter(Boolean);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : "—";
  };

  if (mode === "form") {
    return (
      <Sheet title={editingId ? "Editar observación" : "Nueva observación"} onClose={() => setMode("list")} onSave={save} isMobile={isMobile} saveDisabled={!draft.teacherId || !draft.fecha}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10 }}>
          <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}>
            <Field label="Docente">
              <select style={inputStyle} value={draft.teacherId} onChange={(e) => setDraft({ ...draft, teacherId: e.target.value })}>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Grado">
            <select style={inputStyle} value={draft.grado} onChange={(e) => setDraft({ ...draft, grado: e.target.value })}>
              <option value="">Elegir</option>
              {GRADOS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Grupo">
            <select style={inputStyle} value={draft.grupo} onChange={(e) => setDraft({ ...draft, grupo: e.target.value })}>
              <option value="">Elegir</option>
              {GRUPOS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Asignatura"><input style={inputStyle} value={draft.asignatura} onChange={(e) => setDraft({ ...draft, asignatura: e.target.value })} /></Field>
          <Field label="Temática"><input style={inputStyle} value={draft.tematica} onChange={(e) => setDraft({ ...draft, tematica: e.target.value })} /></Field>
          <Field label="Fecha"><input type="date" style={inputStyle} value={draft.fecha} onChange={(e) => setDraft({ ...draft, fecha: e.target.value })} /></Field>
          <Field label="Hora inicio"><input type="time" style={inputStyle} value={draft.horaInicio} onChange={(e) => setDraft({ ...draft, horaInicio: e.target.value })} /></Field>
          <Field label="Hora término"><input type="time" style={inputStyle} value={draft.horaTermino} onChange={(e) => setDraft({ ...draft, horaTermino: e.target.value })} /></Field>
          <Field label="Alumnos en lista"><input type="number" style={inputStyle} value={draft.alumnosLista} onChange={(e) => setDraft({ ...draft, alumnosLista: e.target.value })} /></Field>
          <Field label="Alumnos presentes"><input type="number" style={inputStyle} value={draft.alumnosPresentes} onChange={(e) => setDraft({ ...draft, alumnosPresentes: e.target.value })} /></Field>
        </div>

        <label onClick={() => setDraft({ ...draft, sorpresa: !draft.sorpresa })} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, cursor: "pointer" }}>
          <span style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: draft.sorpresa ? T.orange : T.fill, border: draft.sorpresa ? "none" : `1.5px solid ${T.separator}` }}>
            {draft.sorpresa && <Check size={13} color="#fff" strokeWidth={3} />}
          </span>
          <span>Fue una visita sorpresa (no programada en el calendario)</span>
        </label>

        {RUBRIC.map((cat) => (
          <div key={cat.id}>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.blue, marginBottom: 8 }}>{cat.id}. {cat.titulo}</div>
            <Card style={{ overflow: "hidden" }}>
              {cat.items.map((it, idx) => (
                <Row key={it.id} last={idx === cat.items.length - 1} style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5 }}>{it.nombre}</div>
                    <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 2 }}>{it.desc}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {[1, 2, 3, 4].map((n) => (
                      <button key={n} onClick={() => setScore(it.id, n)} className="cc-tap" style={{
                        flex: 1, height: 40, borderRadius: 10, border: "none",
                        background: draft.scores[it.id] === n ? T.blue : T.fill, color: draft.scores[it.id] === n ? "#fff" : T.inkSoft,
                        fontWeight: 700, fontSize: 14, cursor: "pointer",
                      }}>{n}</button>
                    ))}
                  </div>
                </Row>
              ))}
            </Card>
          </div>
        ))}

        <Field label="Observaciones"><textarea style={{ ...inputStyle, minHeight: 70 }} value={draft.observaciones} onChange={(e) => setDraft({ ...draft, observaciones: e.target.value })} /></Field>
        <Field label="Recomendaciones"><textarea style={{ ...inputStyle, minHeight: 70 }} value={draft.recomendaciones} onChange={(e) => setDraft({ ...draft, recomendaciones: e.target.value })} /></Field>
        <Field label="Autorreflexión del docente"><textarea style={{ ...inputStyle, minHeight: 70 }} value={draft.autorreflexion} onChange={(e) => setDraft({ ...draft, autorreflexion: e.target.value })} /></Field>
      </Sheet>
    );
  }

  if (mode === "view") {
    const filled = Object.keys(draft.scores || {}).length;
    return (
      <div>
        <ReportLetterhead title="Formato de Observación de Clase" />
        <ScreenHeader title={teacherName(draft.teacherId)} subtitle={fmtDate(draft.fecha)}
          action={<div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <IconBtn icon={ChevronLeft} onClick={() => setMode("list")} />
            <IconBtn icon={Pencil} onClick={() => startEdit(draft)} />
            <IconBtn icon={Printer} onClick={() => window.print()} />
          </div>} />
        <Card style={{ padding: 16, marginBottom: 14 }}>
          <div style={{ fontWeight: 700, fontSize: 12.5, color: T.inkSoft, marginBottom: 6 }}>CRITERIOS EVALUADOS</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            {RUBRIC.map((cat) => <Badge key={cat.id} tone="blue">{cat.id}. {cat.titulo}</Badge>)}
          </div>
          <div style={{ fontWeight: 700, fontSize: 12.5, color: T.inkSoft, marginBottom: 6 }}>ESCALA DE VALORACIÓN</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {Object.entries(NIVELES_DESEMPENO).map(([n, label]) => <Badge key={n} tone="neutral">{n} · {label}</Badge>)}
          </div>
        </Card>
        <Card style={{ padding: 18, marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 10, fontSize: 13, marginBottom: 14 }}>
            <div><strong>Grado/Grupo:</strong> {draft.grado} {draft.grupo}</div>
            <div><strong>Asignatura:</strong> {draft.asignatura}</div>
            <div><strong>Hora:</strong> {draft.horaInicio}–{draft.horaTermino}</div>
            <div><strong>Alumnos:</strong> {draft.alumnosPresentes}/{draft.alumnosLista}</div>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <Badge tone="orange">Promedio {scoreAvg(draft)} / 4 · {filled}/{RUBRIC_ITEM_COUNT} ítems</Badge>
            {draft.sorpresa && <Badge tone="purple">Visita sorpresa</Badge>}
          </div>
        </Card>
        {RUBRIC.map((cat) => (
          <Card key={cat.id} style={{ marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5, color: T.blue, padding: "12px 14px 4px" }}>{cat.id}. {cat.titulo}</div>
            {cat.items.map((it, idx) => (
              <Row key={it.id} last={idx === cat.items.length - 1} style={{ justifyContent: "space-between" }}>
                <span style={{ fontSize: 13 }}>{it.nombre}</span>
                <Badge tone={draft.scores[it.id] >= 3 ? "green" : draft.scores[it.id] ? "orange" : "neutral"}>{draft.scores[it.id] || "—"}</Badge>
              </Row>
            ))}
          </Card>
        ))}
        {(draft.observaciones || draft.recomendaciones || draft.autorreflexion) && (
          <Card style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            {draft.observaciones && <div style={{ fontSize: 13 }}><strong>Observaciones:</strong> {draft.observaciones}</div>}
            {draft.recomendaciones && <div style={{ fontSize: 13 }}><strong>Recomendaciones:</strong> {draft.recomendaciones}</div>}
            {draft.autorreflexion && <div style={{ fontSize: 13 }}><strong>Autorreflexión:</strong> {draft.autorreflexion}</div>}
          </Card>
        )}
        <FirmasBlock />
      </div>
    );
  }

  return (
    <div>
      <ScreenHeader title="Observación" subtitle={`${observations.length} registradas`}
        action={<Btn kind="filled" size="sm" onClick={() => startNew()}><Plus size={14} /> Nueva</Btn>} />
      {observations.length === 0 ? (
        <Card><EmptyHint icon={ClipboardCheck} text="Aún no hay observaciones de clase. Registra la primera." /></Card>
      ) : (
        <Card>
          {observations.map((o, idx) => (
            <Row key={o.id} last={idx === observations.length - 1} onClick={() => view(o)}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                  {teacherName(o.teacherId)}
                  {o.sorpresa && <Badge tone="purple">Sorpresa</Badge>}
                </div>
                <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2 }}>{fmtDateShort(o.fecha)} · {o.asignatura || "sin asignatura"} · {o.grado}{o.grupo}</div>
              </div>
              <Badge tone="orange">{scoreAvg(o)}</Badge>
              <button onClick={(e) => { e.stopPropagation(); remove(o.id); }} style={{ background: "none", border: "none", cursor: "pointer", color: T.red, padding: 4 }}><Trash2 size={15} /></button>
              <ChevronRight size={17} color={T.inkFaint} />
            </Row>
          ))}
        </Card>
      )}
    </div>
  );
}

/* ============================== EVALUACIONES MODULE ============================== */
function EvaluacionesModule({ evalPeriods, setEvalPeriods, isMobile }) {
  const statusOf = (p) => {
    const d = daysUntil(p.entrega);
    const today = todayIso();
    if (today < p.evalInicio) return { text: "Próximo", tone: "neutral" };
    if (today >= p.evalInicio && today <= p.evalFin) return { text: "En evaluación", tone: "orange" };
    if (today > p.evalFin && d >= 0) return { text: "Preparando entrega", tone: "blue" };
    return { text: "Completado", tone: "green" };
  };
  const toggleTask = (periodId, taskId) => setEvalPeriods(evalPeriods.map((p) => p.id === periodId
    ? { ...p, tareas: p.tareas.map((t) => t.id === taskId ? { ...t, hecho: !t.hecho } : t) } : p));
  const addTask = (periodId) => {
    const text = prompt("Nueva tarea para este periodo:");
    if (!text) return;
    setEvalPeriods(evalPeriods.map((p) => p.id === periodId ? { ...p, tareas: [...p.tareas, { id: uid("t"), texto: text, hecho: false }] } : p));
  };

  return (
    <div>
      <ReportLetterhead title="Cronograma de Evaluaciones" />
      <ScreenHeader title="Evaluaciones" subtitle="Cronograma anual de periodos de evaluación"
        action={<Btn kind="tinted" size="sm" onClick={() => window.print()}><Printer size={13} /> Imprimir</Btn>} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {evalPeriods.map((p) => {
          const s = statusOf(p);
          const done = p.tareas.filter((t) => t.hecho).length;
          return (
            <Card key={p.id} style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12, gap: 10 }}>
                <div>
                  <div style={{ fontFamily: headFont, fontWeight: 600, fontSize: 18 }}>Periodo {p.periodo}</div>
                  <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2 }}>{fmtDate(p.inicia)} — {fmtDate(p.termina)}</div>
                </div>
                <Badge tone={s.tone}>{s.text}</Badge>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 10, marginBottom: 14 }}>
                <div style={{ background: T.fill, borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ color: T.inkSoft, fontSize: 11, fontWeight: 700, marginBottom: 3 }}>PERIODO DE EVALUACIÓN</div>
                  <div style={{ fontSize: 13.5 }}>{fmtDate(p.evalInicio)} – {fmtDate(p.evalFin)}</div>
                </div>
                <div style={{ background: T.fill, borderRadius: 10, padding: "10px 12px" }}>
                  <div style={{ color: T.inkSoft, fontSize: 11, fontWeight: 700, marginBottom: 3 }}>ENTREGA A COORDINACIÓN</div>
                  <div style={{ fontSize: 13.5 }}>{fmtDate(p.entrega)}{daysUntil(p.entrega) >= 0 && <span style={{ color: T.inkFaint }}> · en {daysUntil(p.entrega)} días</span>}</div>
                </div>
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft, marginBottom: 6 }}>Pendientes ({done}/{p.tareas.length})</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {p.tareas.map((t) => (
                  <label key={t.id} onClick={() => toggleTask(p.id, t.id)} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, cursor: "pointer", padding: "7px 2px" }}>
                    <span style={{ width: 20, height: 20, borderRadius: 6, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: t.hecho ? T.green : T.fill, border: t.hecho ? "none" : `1.5px solid ${T.separator}` }}>
                      {t.hecho && <Check size={13} color="#fff" strokeWidth={3} />}
                    </span>
                    <span style={{ textDecoration: t.hecho ? "line-through" : "none", color: t.hecho ? T.inkFaint : T.ink }}>{t.texto}</span>
                  </label>
                ))}
              </div>
              <button className="no-print" onClick={() => addTask(p.id)} style={{ marginTop: 6, background: "none", border: "none", color: T.blue, fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: "4px 2px" }}>
                <Plus size={14} /> Agregar pendiente
              </button>
            </Card>
          );
        })}
      </div>
      <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 14, fontStyle: "italic" }}>
        Nota: las fechas están sujetas a cambio según la organización interna de la escuela y las indicaciones del Departamento de Registro y Certificación.
      </div>
      <FirmasBlock roles={["Coordinador(a)", "Director(a)"]} />
    </div>
  );
}

/* ============================== DOCENTES MODULE ============================== */
const CSV_TEMPLATE = "Nombre,Disciplina,Telefono,Correo\nJuan Pérez López,Matemáticas,4491234567,juan.perez@sec84.edu.mx\n";

function DocentesModule(props) {
  const { teachers, setTeachers, visits, setVisits, observations, setObservations, incidencias, setIncidencias, planeaciones, setPlaneaciones, isMobile } = props;
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [importRows, setImportRows] = useState(null);
  const csvInputRef = useRef(null);

  const stats = (id) => {
    const tv = visits.filter((v) => v.teacherId === id);
    const done = tv.filter((v) => v.status === "realizada").length;
    const tObs = observations.filter((o) => o.teacherId === id);
    const vals = tObs.flatMap((o) => Object.values(o.scores || {})).filter(Boolean);
    const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : null;
    return { visits: `${done}/${tv.length}`, observations: tObs.length, avg };
  };

  const filtered = teachers.filter((t) => !filter || t.name.toLowerCase().includes(filter.toLowerCase()) || t.disciplina.toLowerCase().includes(filter.toLowerCase()));
  const save = () => {
    if (!editing.name) return;
    const newTeacher = normalizeTeacher(editing);
    setTeachers([...teachers, newTeacher]);
    setVisits([...visits, ...visitsForTeacher(newTeacher)]);
    setPlaneaciones([...planeaciones, ...planeacionesForTeacher(newTeacher)]);
    setEditing(null);
    setOpenId(newTeacher.id);
  };
  const remove = async (id) => {
    const t = teachers.find((x) => x.id === id);
    if (!confirm(`¿Eliminar a ${t?.name || "este docente"}? También se borrarán sus visitas, observaciones, planeaciones y su expediente registrado.`)) return;
    await removeEvidenciaFolder(`docentes/${id}`);
    setTeachers(teachers.filter((x) => x.id !== id));
    setVisits(visits.filter((v) => v.teacherId !== id));
    setObservations(observations.filter((o) => o.teacherId !== id));
    setPlaneaciones(planeaciones.filter((p) => p.teacherId !== id));
    setIncidencias(incidencias.map((i) => normalizeIncidencia(i)).map((i) => ({ ...i, teacherIds: i.teacherIds.filter((x) => x !== id) })));
  };

  const handleCsvPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const text = await file.text();
    const parsed = parseCsv(text);
    const dataRows = parsed.slice(1); // primera fila = encabezado
    const existingNames = new Set(teachers.map((t) => t.name.trim().toLowerCase()));
    const seenInFile = new Set();
    const rows = dataRows.map(([name = "", disciplina = "", telefono = "", correo = ""]) => {
      const cleanName = name.trim();
      const key = cleanName.toLowerCase();
      let status = "nueva";
      if (!cleanName) status = "invalida";
      else if (existingNames.has(key) || seenInFile.has(key)) status = "duplicada";
      if (status === "nueva") seenInFile.add(key);
      return { name: cleanName, disciplina: disciplina.trim(), telefono: telefono.trim(), correo: correo.trim(), status };
    });
    setImportRows(rows);
  };
  const confirmImport = () => {
    const nuevos = importRows.filter((r) => r.status === "nueva").map((r) => normalizeTeacher({
      id: uid("t"), name: r.name, disciplina: r.disciplina, telefono: r.telefono, correo: r.correo, notas: "",
    }));
    if (nuevos.length) {
      setTeachers([...teachers, ...nuevos]);
      setVisits([...visits, ...nuevos.flatMap(visitsForTeacher)]);
      setPlaneaciones([...planeaciones, ...nuevos.flatMap(planeacionesForTeacher)]);
    }
    setImportRows(null);
  };

  const openTeacher = teachers.find((t) => t.id === openId);
  if (openTeacher) {
    return <TeacherExpediente {...props} teacher={openTeacher} onBack={() => setOpenId(null)} />;
  }

  return (
    <div>
      <ScreenHeader title="Docentes" subtitle={`${teachers.length} registrados`}
        action={<div style={{ display: "flex", gap: 8 }}>
          <Btn kind="tinted" size="sm" onClick={() => csvInputRef.current?.click()}><Upload size={14} /> Importar CSV</Btn>
          <Btn kind="filled" size="sm" onClick={() => setEditing({ id: uid("t"), name: "", disciplina: "", telefono: "", correo: "", notas: "" })}><Plus size={14} /> Agregar</Btn>
        </div>} />
      <input ref={csvInputRef} type="file" accept=".csv,text/csv" style={{ display: "none" }} onChange={handleCsvPick} />
      <div className="no-print" style={{ marginBottom: 8, display: "flex", alignItems: "center", gap: 8, background: T.card, borderRadius: 10, padding: "9px 12px" }}>
        <Search size={15} color={T.inkFaint} />
        <input style={{ border: "none", outline: "none", fontSize: 15, background: "transparent", width: "100%" }} placeholder="Buscar por nombre o disciplina" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </div>
      <button className="no-print" onClick={() => downloadTextFile("plantilla-docentes.csv", CSV_TEMPLATE)} style={{ background: "none", border: "none", color: T.blue, fontSize: 12, fontWeight: 600, cursor: "pointer", padding: "2px 0 14px", display: "flex", alignItems: "center", gap: 4 }}>
        <Download size={12} /> Descargar plantilla CSV
      </button>

      {importRows && (
        <Sheet title="Importar docentes" onClose={() => setImportRows(null)} onSave={confirmImport}
          saveLabel={`Importar ${importRows.filter((r) => r.status === "nueva").length}`}
          saveDisabled={importRows.every((r) => r.status !== "nueva")} isMobile={isMobile}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Badge tone="green">{importRows.filter((r) => r.status === "nueva").length} nuevos</Badge>
            <Badge tone="orange">{importRows.filter((r) => r.status === "duplicada").length} ya existen (se omiten)</Badge>
            <Badge tone="red">{importRows.filter((r) => r.status === "invalida").length} sin nombre (se omiten)</Badge>
          </div>
          <Card className="cc-scrollx">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 480 }}>
              <thead><tr style={{ background: T.fill }}>
                <th style={thStyle}>Nombre</th><th style={thStyle}>Disciplina</th><th style={thStyle}>Estatus</th>
              </tr></thead>
              <tbody>
                {importRows.map((r, idx) => (
                  <tr key={idx} style={{ borderTop: `0.5px solid ${T.separator}` }}>
                    <td style={tdStyle}>{r.name || <span style={{ color: T.inkFaint }}>(sin nombre)</span>}</td>
                    <td style={tdStyle}>{r.disciplina}</td>
                    <td style={tdStyle}>
                      {r.status === "nueva" && <Badge tone="green">Nueva</Badge>}
                      {r.status === "duplicada" && <Badge tone="orange">Ya existe</Badge>}
                      {r.status === "invalida" && <Badge tone="red">Inválida</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </Sheet>
      )}

      {editing && (
        <Sheet title="Nuevo docente" onClose={() => setEditing(null)} onSave={save} saveLabel="Crear y abrir expediente" saveDisabled={!editing.name} isMobile={isMobile}>
          <Field label="Nombre completo"><input style={inputStyle} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
          <Field label="Disciplina(s)"><input style={inputStyle} value={editing.disciplina} onChange={(e) => setEditing({ ...editing, disciplina: e.target.value })} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Teléfono"><input style={inputStyle} value={editing.telefono} onChange={(e) => setEditing({ ...editing, telefono: e.target.value })} /></Field>
            <Field label="Correo"><input style={inputStyle} value={editing.correo} onChange={(e) => setEditing({ ...editing, correo: e.target.value })} /></Field>
          </div>
        </Sheet>
      )}

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 10 }}>
        {filtered.map((t) => {
          const s = stats(t.id);
          return (
            <Card key={t.id} onClick={() => setOpenId(t.id)} className="cc-row-tap" style={{ padding: 15, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5 }}>{t.name}</div>
                  <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2 }}>{t.disciplina}</div>
                </div>
                <div className="no-print" style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <IconBtn icon={Trash2} size={28} tone="red" onClick={(e) => { e.stopPropagation(); remove(t.id); }} />
                  <ChevronRight size={17} color={T.inkFaint} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                <Badge tone="green">Visitas {s.visits}</Badge>
                <Badge tone="orange">Obs. {s.observations}</Badge>
                {s.avg && <Badge tone="blue">Prom. {s.avg}</Badge>}
              </div>
              {(t.telefono || t.correo) && <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 8 }}>{t.telefono}{t.telefono && t.correo && " · "}{t.correo}</div>}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ============================== EXPEDIENTE DOCENTE ============================== */
const NIVELES_ESTUDIO = ["Normal", "Licenciatura", "Especialidad", "Maestría", "Doctorado", "Técnico", "Otro"];

function TeacherAvatar({ path, uploading, onPick, onRemove }) {
  const [src, setSrc] = useState(null);
  const inputRef = useRef(null);
  useEffect(() => {
    let active = true;
    if (!path) { setSrc(null); return; }
    getSignedEvidenciaUrl(path).then((url) => { if (active) setSrc(url); });
    return () => { active = false; };
  }, [path]);
  return (
    <div style={{ position: "relative", width: 72, height: 72, borderRadius: "50%", overflow: "hidden", background: T.fill, flexShrink: 0, border: `1px solid ${T.separator}` }}>
      {src ? <img src={src} alt="Foto del docente" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: T.inkFaint }}>
          <Users size={28} strokeWidth={1.5} />
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) onPick(f); e.target.value = ""; }} />
      <button className="no-print cc-tap" type="button" disabled={uploading} onClick={() => inputRef.current?.click()} title="Cambiar foto" style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.55)", border: "none", color: "#fff", fontSize: 9.5, fontWeight: 600, padding: "3px 0", cursor: "pointer" }}>
        {uploading ? "…" : "Cambiar"}
      </button>
      {path && !uploading && (
        <button className="no-print" type="button" onClick={onRemove} title="Quitar foto" style={{ position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%", width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <X size={10} color="#fff" />
        </button>
      )}
    </div>
  );
}

function TeacherExpediente({ teacher, teachers, visits, observations, incidencias, planeaciones, session, isMobile, onBack, setActive, goToObservationRecord, setTeachers }) {
  const updateTeacher = (patch) => setTeachers(teachers.map((t) => (t.id === teacher.id ? { ...t, ...patch } : t)));

  const [editingBasics, setEditingBasics] = useState(null);
  const [estudioDraft, setEstudioDraft] = useState(null);
  const [cursoDraft, setCursoDraft] = useState(null);
  const [bitacoraDraft, setBitacoraDraft] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const tVisits = visits.filter((v) => v.teacherId === teacher.id);
  const tObs = observations.filter((o) => o.teacherId === teacher.id);
  const tInc = incidencias.map(normalizeIncidencia).filter((i) => i.teacherIds.includes(teacher.id));
  const tPlan = PLANEACION_TIPOS.map((tipo, idx) => planeaciones.find((p) => p.teacherId === teacher.id && p.tipo === tipo) || { id: `pl${teacher.id}_${idx}`, teacherId: teacher.id, tipo, status: "pendiente", fecha: "", link: "" });
  const planDone = tPlan.filter((p) => p.status === "entregada").length;
  const visitsDone = tVisits.filter((v) => v.status === "realizada").length;
  const scoreVals = tObs.flatMap((o) => Object.values(o.scores || {})).filter(Boolean);
  const avg = scoreVals.length ? (scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length).toFixed(2) : null;
  const incAbiertas = tInc.filter((i) => i.status !== "cerrada").length;

  const openEditBasics = () => setEditingBasics({
    name: teacher.name, disciplina: teacher.disciplina, telefono: teacher.telefono, correo: teacher.correo,
    personal: { ...teacher.personal }, laboral: { ...teacher.laboral },
    titulo: teacher.formacion.titulo, cedulaProfesional: teacher.formacion.cedulaProfesional,
  });
  const saveBasics = () => {
    updateTeacher({
      name: editingBasics.name, disciplina: editingBasics.disciplina, telefono: editingBasics.telefono, correo: editingBasics.correo,
      personal: editingBasics.personal, laboral: editingBasics.laboral,
      formacion: { ...teacher.formacion, titulo: editingBasics.titulo, cedulaProfesional: editingBasics.cedulaProfesional },
    });
    setEditingBasics(null);
  };

  const saveEstudio = () => {
    if (!estudioDraft.nivel && !estudioDraft.tituloGrado) return;
    const list = teacher.formacion.estudios;
    const exists = list.some((e) => e.id === estudioDraft.id);
    const next = exists ? list.map((e) => (e.id === estudioDraft.id ? estudioDraft : e)) : [...list, estudioDraft];
    updateTeacher({ formacion: { ...teacher.formacion, estudios: next } });
    setEstudioDraft(null);
  };
  const removeEstudio = (id) => updateTeacher({ formacion: { ...teacher.formacion, estudios: teacher.formacion.estudios.filter((e) => e.id !== id) } });

  const saveCurso = () => {
    if (!cursoDraft.nombre) return;
    const list = teacher.formacion.cursos;
    const exists = list.some((c) => c.id === cursoDraft.id);
    const next = exists ? list.map((c) => (c.id === cursoDraft.id ? cursoDraft : c)) : [...list, cursoDraft];
    updateTeacher({ formacion: { ...teacher.formacion, cursos: next } });
    setCursoDraft(null);
  };
  const removeCurso = (id) => updateTeacher({ formacion: { ...teacher.formacion, cursos: teacher.formacion.cursos.filter((c) => c.id !== id) } });

  const saveBitacora = () => {
    if (!bitacoraDraft.texto) return;
    const exists = teacher.bitacora.some((b) => b.id === bitacoraDraft.id);
    const next = exists ? teacher.bitacora.map((b) => (b.id === bitacoraDraft.id ? bitacoraDraft : b)) : [{ ...bitacoraDraft, id: uid("b") }, ...teacher.bitacora];
    updateTeacher({ bitacora: next });
    setBitacoraDraft(null);
  };
  const removeBitacora = (id) => updateTeacher({ bitacora: teacher.bitacora.filter((b) => b.id !== id) });
  const migrateNota = () => {
    updateTeacher({ bitacora: [{ id: uid("b"), fecha: todayIso(), autor: session.user.email, texto: teacher.notas }, ...teacher.bitacora], notas: "" });
  };

  const handlePhotoPick = async (file) => {
    setPhotoUploading(true);
    try {
      const oldPath = teacher.fotoPath;
      const { path } = await uploadEvidenciaFile(`docentes/${teacher.id}`, file, "foto");
      updateTeacher({ fotoPath: path });
      if (oldPath) await removeEvidenciaFile(oldPath);
    } catch (err) {
      alert(`No se pudo subir la foto: ${err.message || "error desconocido"}`);
    }
    setPhotoUploading(false);
  };
  const removePhoto = async () => {
    if (teacher.fotoPath) await removeEvidenciaFile(teacher.fotoPath);
    updateTeacher({ fotoPath: "" });
  };

  return (
    <div>
      <ReportLetterhead title="Expediente del Docente" />
      <ScreenHeader title={teacher.name} subtitle={teacher.disciplina}
        avatar={<TeacherAvatar path={teacher.fotoPath} uploading={photoUploading} onPick={handlePhotoPick} onRemove={removePhoto} />}
        action={<div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <IconBtn icon={ChevronLeft} onClick={onBack} />
          <IconBtn icon={Pencil} onClick={openEditBasics} />
          <IconBtn icon={Printer} onClick={() => window.print()} />
        </div>} />

      {editingBasics && (
        <Sheet title="Editar datos del docente" onClose={() => setEditingBasics(null)} onSave={saveBasics} saveDisabled={!editingBasics.name} isMobile={isMobile}>
          <div style={{ fontWeight: 700, fontSize: 13, color: T.blue }}>Datos generales</div>
          <Field label="Nombre completo"><input style={inputStyle} value={editingBasics.name} onChange={(e) => setEditingBasics({ ...editingBasics, name: e.target.value })} /></Field>
          <Field label="Disciplina(s)"><input style={inputStyle} value={editingBasics.disciplina} onChange={(e) => setEditingBasics({ ...editingBasics, disciplina: e.target.value })} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Teléfono"><input style={inputStyle} value={editingBasics.telefono} onChange={(e) => setEditingBasics({ ...editingBasics, telefono: e.target.value })} /></Field>
            <Field label="Correo"><input style={inputStyle} value={editingBasics.correo} onChange={(e) => setEditingBasics({ ...editingBasics, correo: e.target.value })} /></Field>
          </div>

          <div style={{ fontWeight: 700, fontSize: 13, color: T.blue, marginTop: 4 }}>Datos personales</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="CURP"><input style={inputStyle} value={editingBasics.personal.curp} onChange={(e) => setEditingBasics({ ...editingBasics, personal: { ...editingBasics.personal, curp: e.target.value } })} /></Field>
            <Field label="Fecha de nacimiento"><input type="date" style={inputStyle} value={editingBasics.personal.fechaNacimiento} onChange={(e) => setEditingBasics({ ...editingBasics, personal: { ...editingBasics.personal, fechaNacimiento: e.target.value } })} /></Field>
          </div>
          <Field label="Domicilio"><input style={inputStyle} value={editingBasics.personal.domicilio} onChange={(e) => setEditingBasics({ ...editingBasics, personal: { ...editingBasics.personal, domicilio: e.target.value } })} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Contacto de emergencia"><input style={inputStyle} value={editingBasics.personal.contactoEmergenciaNombre} onChange={(e) => setEditingBasics({ ...editingBasics, personal: { ...editingBasics.personal, contactoEmergenciaNombre: e.target.value } })} /></Field>
            <Field label="Teléfono de emergencia"><input style={inputStyle} value={editingBasics.personal.contactoEmergenciaTelefono} onChange={(e) => setEditingBasics({ ...editingBasics, personal: { ...editingBasics.personal, contactoEmergenciaTelefono: e.target.value } })} /></Field>
          </div>

          <div style={{ fontWeight: 700, fontSize: 13, color: T.blue, marginTop: 4 }}>Datos laborales</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Clave presupuestal"><input style={inputStyle} value={editingBasics.laboral.clavePresupuestal} onChange={(e) => setEditingBasics({ ...editingBasics, laboral: { ...editingBasics.laboral, clavePresupuestal: e.target.value } })} /></Field>
            <Field label="Categoría"><input style={inputStyle} value={editingBasics.laboral.categoria} onChange={(e) => setEditingBasics({ ...editingBasics, laboral: { ...editingBasics.laboral, categoria: e.target.value } })} /></Field>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Nombramiento">
              <select style={inputStyle} value={editingBasics.laboral.nombramiento} onChange={(e) => setEditingBasics({ ...editingBasics, laboral: { ...editingBasics.laboral, nombramiento: e.target.value } })}>
                <option value="">Elegir</option>
                {NOMBRAMIENTOS.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="Horas frente a grupo"><input type="number" style={inputStyle} value={editingBasics.laboral.horasFrenteGrupo} onChange={(e) => setEditingBasics({ ...editingBasics, laboral: { ...editingBasics.laboral, horasFrenteGrupo: e.target.value } })} /></Field>
          </div>
          <Field label="Fecha de ingreso"><input type="date" style={inputStyle} value={editingBasics.laboral.fechaIngreso} onChange={(e) => setEditingBasics({ ...editingBasics, laboral: { ...editingBasics.laboral, fechaIngreso: e.target.value } })} /></Field>

          <div style={{ fontWeight: 700, fontSize: 13, color: T.blue, marginTop: 4 }}>Formación académica</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Título profesional"><input style={inputStyle} value={editingBasics.titulo} onChange={(e) => setEditingBasics({ ...editingBasics, titulo: e.target.value })} /></Field>
            <Field label="Cédula profesional"><input style={inputStyle} value={editingBasics.cedulaProfesional} onChange={(e) => setEditingBasics({ ...editingBasics, cedulaProfesional: e.target.value })} /></Field>
          </div>
        </Sheet>
      )}

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
        <Card style={{ padding: 14 }}><div style={{ fontFamily: headFont, fontSize: 22, fontWeight: 600 }}>{visitsDone}/{tVisits.length}</div><div style={{ fontSize: 12, color: T.inkSoft, fontWeight: 600 }}>Visitas realizadas</div></Card>
        <Card style={{ padding: 14 }}><div style={{ fontFamily: headFont, fontSize: 22, fontWeight: 600 }}>{tObs.length}</div><div style={{ fontSize: 12, color: T.inkSoft, fontWeight: 600 }}>Observaciones</div></Card>
        <Card style={{ padding: 14 }}><div style={{ fontFamily: headFont, fontSize: 22, fontWeight: 600 }}>{avg ?? "—"}</div><div style={{ fontSize: 12, color: T.inkSoft, fontWeight: 600 }}>Promedio</div></Card>
        <Card style={{ padding: 14 }}><div style={{ fontFamily: headFont, fontSize: 22, fontWeight: 600, color: incAbiertas ? T.red : T.ink }}>{incAbiertas}</div><div style={{ fontSize: 12, color: T.inkSoft, fontWeight: 600 }}>Incidencias abiertas</div></Card>
      </div>

      {teacher.notas && (
        <Card style={{ padding: 16, marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 13 }}><strong>Nota anterior:</strong> {teacher.notas}</div>
          <Btn kind="tinted" size="sm" onClick={migrateNota} style={{ flexShrink: 0 }}>Convertir en bitácora</Btn>
        </Card>
      )}

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14 }}>
        {/* Formación académica */}
        <Card style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 14.5 }}>Estudios</div>
            <button className="no-print" onClick={() => setEstudioDraft({ id: uid("es"), nivel: "", institucion: "", tituloGrado: "", anio: "" })} style={{ background: "none", border: "none", color: T.blue, cursor: "pointer", display: "flex", alignItems: "center", gap: 3, fontSize: 12.5, fontWeight: 700 }}><Plus size={14} /> Agregar</button>
          </div>
          {teacher.formacion.estudios.length === 0 ? <div style={{ fontSize: 12.5, color: T.inkFaint }}>Sin estudios registrados.</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {teacher.formacion.estudios.map((e) => (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, background: T.fill, borderRadius: 10, padding: "8px 10px" }}>
                  <div style={{ minWidth: 0, fontSize: 12.5 }}>
                    <div style={{ fontWeight: 700 }}>{e.nivel}{e.anio ? ` · ${e.anio}` : ""}</div>
                    <div style={{ color: T.inkSoft }}>{e.tituloGrado}{e.institucion ? ` — ${e.institucion}` : ""}</div>
                  </div>
                  <div className="no-print" style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                    <IconBtn icon={Pencil} size={24} onClick={() => setEstudioDraft(e)} />
                    <IconBtn icon={Trash2} size={24} tone="red" onClick={() => removeEstudio(e.id)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 14.5 }}>Cursos y certificaciones</div>
            <button className="no-print" onClick={() => setCursoDraft({ id: uid("cu"), nombre: "", institucion: "", fecha: "", horas: "" })} style={{ background: "none", border: "none", color: T.blue, cursor: "pointer", display: "flex", alignItems: "center", gap: 3, fontSize: 12.5, fontWeight: 700 }}><Plus size={14} /> Agregar</button>
          </div>
          {teacher.formacion.cursos.length === 0 ? <div style={{ fontSize: 12.5, color: T.inkFaint }}>Sin cursos registrados.</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {teacher.formacion.cursos.map((c) => (
                <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, background: T.fill, borderRadius: 10, padding: "8px 10px" }}>
                  <div style={{ minWidth: 0, fontSize: 12.5 }}>
                    <div style={{ fontWeight: 700 }}>{c.nombre}{c.horas ? ` · ${c.horas} hrs` : ""}</div>
                    <div style={{ color: T.inkSoft }}>{c.institucion}{c.fecha ? ` — ${fmtDateShort(c.fecha)}` : ""}</div>
                  </div>
                  <div className="no-print" style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                    <IconBtn icon={Pencil} size={24} onClick={() => setCursoDraft(c)} />
                    <IconBtn icon={Trash2} size={24} tone="red" onClick={() => removeCurso(c.id)} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {estudioDraft && (
        <Sheet title="Estudio" onClose={() => setEstudioDraft(null)} onSave={saveEstudio} isMobile={isMobile}>
          <Field label="Nivel">
            <select style={inputStyle} value={estudioDraft.nivel} onChange={(e) => setEstudioDraft({ ...estudioDraft, nivel: e.target.value })}>
              <option value="">Elegir</option>
              {NIVELES_ESTUDIO.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </Field>
          <Field label="Título / grado obtenido"><input style={inputStyle} value={estudioDraft.tituloGrado} onChange={(e) => setEstudioDraft({ ...estudioDraft, tituloGrado: e.target.value })} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Institución"><input style={inputStyle} value={estudioDraft.institucion} onChange={(e) => setEstudioDraft({ ...estudioDraft, institucion: e.target.value })} /></Field>
            <Field label="Año"><input style={inputStyle} value={estudioDraft.anio} onChange={(e) => setEstudioDraft({ ...estudioDraft, anio: e.target.value })} /></Field>
          </div>
        </Sheet>
      )}
      {cursoDraft && (
        <Sheet title="Curso / certificación" onClose={() => setCursoDraft(null)} onSave={saveCurso} isMobile={isMobile}>
          <Field label="Nombre del curso"><input style={inputStyle} value={cursoDraft.nombre} onChange={(e) => setCursoDraft({ ...cursoDraft, nombre: e.target.value })} /></Field>
          <Field label="Institución"><input style={inputStyle} value={cursoDraft.institucion} onChange={(e) => setCursoDraft({ ...cursoDraft, institucion: e.target.value })} /></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="Fecha"><input type="date" style={inputStyle} value={cursoDraft.fecha} onChange={(e) => setCursoDraft({ ...cursoDraft, fecha: e.target.value })} /></Field>
            <Field label="Horas"><input type="number" style={inputStyle} value={cursoDraft.horas} onChange={(e) => setCursoDraft({ ...cursoDraft, horas: e.target.value })} /></Field>
          </div>
        </Sheet>
      )}

      {/* Bitácora */}
      <Card style={{ padding: 16, marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5 }}>Bitácora de seguimiento</div>
          <button className="no-print" onClick={() => setBitacoraDraft({ id: uid("b"), fecha: todayIso(), autor: session.user.email, texto: "" })} style={{ background: "none", border: "none", color: T.blue, cursor: "pointer", display: "flex", alignItems: "center", gap: 3, fontSize: 12.5, fontWeight: 700 }}><Plus size={14} /> Nueva entrada</button>
        </div>
        {teacher.bitacora.length === 0 ? <div style={{ fontSize: 12.5, color: T.inkFaint }}>Sin entradas todavía.</div> : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {teacher.bitacora.map((b) => (
              <div key={b.id} style={{ borderLeft: `2px solid ${T.blueTint}`, paddingLeft: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 11.5, color: T.inkSoft, fontWeight: 700 }}>{fmtDate(b.fecha)} · {b.autor}</div>
                  <div className="no-print" style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                    <IconBtn icon={Pencil} size={22} onClick={() => setBitacoraDraft(b)} />
                    <IconBtn icon={Trash2} size={22} tone="red" onClick={() => removeBitacora(b.id)} />
                  </div>
                </div>
                <div style={{ fontSize: 13.5, marginTop: 2 }}>{b.texto}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
      {bitacoraDraft && (
        <Sheet title="Entrada de bitácora" onClose={() => setBitacoraDraft(null)} onSave={saveBitacora} isMobile={isMobile}>
          <Field label="Fecha"><input type="date" style={inputStyle} value={bitacoraDraft.fecha} onChange={(e) => setBitacoraDraft({ ...bitacoraDraft, fecha: e.target.value })} /></Field>
          <Field label="Nota"><textarea style={{ ...inputStyle, minHeight: 90 }} value={bitacoraDraft.texto} onChange={(e) => setBitacoraDraft({ ...bitacoraDraft, texto: e.target.value })} /></Field>
        </Sheet>
      )}

      {/* Historial */}
      <div style={{ fontWeight: 800, fontSize: 17, marginTop: 22, marginBottom: 10 }}>Historial</div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)", gap: 12 }}>
        <Card style={{ padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><CalendarCheck size={14} color={T.inkSoft} /> Visitas</div>
          {tVisits.length === 0 ? <div style={{ fontSize: 12, color: T.inkFaint }}>Sin visitas programadas.</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {tVisits.map((v) => (
                <div key={v.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                  <span>{v.month} · {v.semana}</span>
                  <Badge tone={v.status === "realizada" ? "green" : "neutral"}>{v.status === "realizada" ? "Realizada" : "Pendiente"}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card style={{ padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><FileText size={14} color={T.inkSoft} /> Planeaciones ({planDone}/{tPlan.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {tPlan.map((p) => (
              <div key={p.tipo} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, gap: 6 }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.tipo}</span>
                <Badge tone={p.status === "entregada" ? "green" : "neutral"}>{p.status === "entregada" ? "Entregada" : "Pendiente"}</Badge>
              </div>
            ))}
            <button className="no-print" onClick={() => setActive("planeaciones")} style={{ background: "none", border: "none", color: T.blue, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "4px 0", textAlign: "left" }}>Ver en Planeaciones →</button>
          </div>
        </Card>
        <Card style={{ padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><ClipboardCheck size={14} color={T.inkSoft} /> Observaciones</div>
          {tObs.length === 0 ? <div style={{ fontSize: 12, color: T.inkFaint }}>Sin observaciones registradas.</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {tObs.map((o) => {
                const vals = Object.values(o.scores || {}).filter(Boolean);
                const oAvg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2) : "—";
                return (
                  <button key={o.id} className="no-print cc-tap" onClick={() => goToObservationRecord(o.id)} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, background: "none", border: "none", cursor: "pointer", padding: "3px 0", color: T.ink, textAlign: "left" }}>
                    <span>{fmtDateShort(o.fecha)} · {o.asignatura || "sin asignatura"}</span>
                    <Badge tone="orange">{oAvg}</Badge>
                  </button>
                );
              })}
            </div>
          )}
        </Card>
        <Card style={{ padding: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><AlertTriangle size={14} color={T.inkSoft} /> Incidencias</div>
          {tInc.length === 0 ? <div style={{ fontSize: 12, color: T.inkFaint }}>Sin incidencias registradas.</div> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {tInc.map((i) => (
                <div key={i.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fmtDateShort(i.fecha)} · {i.tipo}</span>
                  <Badge tone={i.status === "cerrada" ? "green" : "red"}>{i.status === "cerrada" ? "Cerrada" : "Abierta"}</Badge>
                </div>
              ))}
              <button className="no-print" onClick={() => setActive("incidencias")} style={{ background: "none", border: "none", color: T.blue, fontSize: 12, fontWeight: 700, cursor: "pointer", padding: "4px 0", textAlign: "left" }}>Ver en Incidencias →</button>
            </div>
          )}
        </Card>
      </div>
      <FirmasBlock />
    </div>
  );
}

/* ============================== INCIDENCIAS MODULE ============================== */
const ChipToggle = ({ label, active, onClick }) => (
  <button type="button" onClick={onClick} className="cc-tap" style={{
    border: `1px solid ${active ? T.blue : T.separator}`, cursor: "pointer", borderRadius: 6, padding: "6px 12px", fontSize: 12.5, fontWeight: 600,
    background: active ? T.blue : T.card, color: active ? "#fff" : T.inkSoft,
  }}>{label}</button>
);

function IncidenciasModule({ incidencias, setIncidencias, isMobile, teachers, teacherName, setActive }) {
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("todas");
  const [uploading, setUploading] = useState(false);
  const photoInputRef = useRef(null);
  const docInputRef = useRef(null);
  const makeBlank = () => ({ id: uid("i"), fecha: "", teacherIds: [], notasInvolucrados: "", tipo: "Académica", descripcion: "", accion: "", status: "abierta", evidencias: [] });
  const [draft, setDraft] = useState(makeBlank);

  const save = () => {
    if (!draft.fecha || !draft.descripcion) return;
    const exists = incidencias.some((i) => i.id === draft.id);
    setIncidencias(exists ? incidencias.map((i) => (i.id === draft.id ? draft : i)) : [draft, ...incidencias]);
    setDraft(makeBlank()); setShowForm(false);
  };
  const edit = (i) => { setDraft(normalizeIncidencia(i)); setShowForm(true); };
  const remove = async (id) => {
    if (!confirm("¿Eliminar esta incidencia y sus evidencias?")) return;
    await removeEvidenciaFolder(`incidencias/${id}`);
    setIncidencias(incidencias.filter((i) => i.id !== id));
  };
  const toggleStatus = (i) => setIncidencias(incidencias.map((x) => x.id === i.id ? { ...x, status: x.status === "cerrada" ? "abierta" : "cerrada" } : x));
  const toggleDraftTeacher = (id) => setDraft((d) => ({ ...d, teacherIds: d.teacherIds.includes(id) ? d.teacherIds.filter((x) => x !== id) : [...d.teacherIds, id] }));

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    setUploading(true);
    for (const file of files) {
      try {
        const { path, size } = await uploadEvidenciaFile(`incidencias/${draft.id}`, file, "foto");
        setDraft((d) => ({ ...d, evidencias: [...(d.evidencias || []), { id: uid("ev"), tipo: "foto", nombre: file.name, path, size }] }));
      } catch (err) {
        alert(`No se pudo subir "${file.name}": ${err.message || "error desconocido"}`);
      }
    }
    setUploading(false);
    e.target.value = "";
  };
  const handleDocUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    setUploading(true);
    for (const file of files) {
      if (file.size > 20 * 1024 * 1024) {
        alert(`"${file.name}" pesa más de 20 MB y no se puede subir.`);
        continue;
      }
      try {
        const { path, size } = await uploadEvidenciaFile(`incidencias/${draft.id}`, file, "documento");
        setDraft((d) => ({ ...d, evidencias: [...(d.evidencias || []), { id: uid("ev"), tipo: "documento", nombre: file.name, path, size }] }));
      } catch (err) {
        alert(`No se pudo subir "${file.name}": ${err.message || "error desconocido"}`);
      }
    }
    setUploading(false);
    e.target.value = "";
  };
  const removeEvidencia = async (id) => {
    const ev = draft.evidencias.find((e) => e.id === id);
    if (ev?.path) await removeEvidenciaFile(ev.path);
    setDraft((d) => ({ ...d, evidencias: (d.evidencias || []).filter((x) => x.id !== id) }));
  };

  const filtered = incidencias.filter((i) => filterStatus === "todas" || i.status === filterStatus);
  const tipos = ["Académica", "Disciplina", "Administrativa", "Otra"];
  const tipoTone = { "Académica": "blue", "Disciplina": "red", "Administrativa": "orange", "Otra": "neutral" };

  return (
    <div>
      <ReportLetterhead title="Registro de Incidencias" />
      <ScreenHeader title="Incidencias" subtitle={`${incidencias.filter((i) => i.status !== "cerrada").length} abiertas de ${incidencias.length}`}
        action={<div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Btn kind="tinted" size="sm" onClick={() => window.print()}><Printer size={13} /> Imprimir</Btn>
          <Btn kind="filled" size="sm" onClick={() => { setDraft(makeBlank()); setShowForm(true); }}><Plus size={14} /> Registrar</Btn>
        </div>} />
      <div className="no-print" style={{ marginBottom: 14 }}>
        <SegmentedControl value={filterStatus} onChange={setFilterStatus} options={[{ value: "todas", label: "Todas" }, { value: "abierta", label: "Abiertas" }, { value: "cerrada", label: "Cerradas" }]} />
      </div>

      {showForm && (
        <Sheet title={draft.id ? "Editar incidencia" : "Nueva incidencia"} onClose={() => setShowForm(false)} onSave={save} saveDisabled={!draft.fecha || !draft.descripcion} isMobile={isMobile}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(2, 1fr)", gap: 10 }}>
            <Field label="Fecha"><input type="date" style={inputStyle} value={draft.fecha} onChange={(e) => setDraft({ ...draft, fecha: e.target.value })} /></Field>
            <Field label="Tipo">
              <select style={inputStyle} value={draft.tipo} onChange={(e) => setDraft({ ...draft, tipo: e.target.value })}>
                {tipos.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Docente(s) involucrado(s)">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {teachers.map((t) => (
                <ChipToggle key={t.id} label={t.name} active={draft.teacherIds.includes(t.id)} onClick={() => toggleDraftTeacher(t.id)} />
              ))}
            </div>
          </Field>
          <Field label="Otras personas involucradas (opcional)"><input style={inputStyle} placeholder="Alumnos, padres de familia, etc." value={draft.notasInvolucrados} onChange={(e) => setDraft({ ...draft, notasInvolucrados: e.target.value })} /></Field>
          <Field label="Descripción"><textarea style={{ ...inputStyle, minHeight: 70 }} value={draft.descripcion} onChange={(e) => setDraft({ ...draft, descripcion: e.target.value })} /></Field>
          <Field label="Acción tomada"><textarea style={{ ...inputStyle, minHeight: 70 }} value={draft.accion} onChange={(e) => setDraft({ ...draft, accion: e.target.value })} /></Field>

          <div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Evidencias</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <Btn kind="tinted" size="sm" disabled={uploading} onClick={() => photoInputRef.current?.click()}><ImageIcon size={14} /> {uploading ? "Subiendo…" : "Agregar foto"}</Btn>
              <Btn kind="tinted" size="sm" disabled={uploading} onClick={() => docInputRef.current?.click()}><Paperclip size={14} /> Agregar documento</Btn>
            </div>
            <input ref={photoInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handlePhotoUpload} />
            <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" multiple style={{ display: "none" }} onChange={handleDocUpload} />
            {draft.evidencias?.length ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {draft.evidencias.map((ev) => ev.tipo === "foto"
                  ? <EvidenceThumb key={ev.id} path={ev.path} onRemove={() => removeEvidencia(ev.id)} />
                  : <DocChip key={ev.id} ev={ev} onRemove={() => removeEvidencia(ev.id)} />)}
              </div>
            ) : <div style={{ fontSize: 12, color: T.inkFaint }}>Sin evidencias todavía. Puedes escanear o fotografiar quejas en papel y subirlas aquí.</div>}
            <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 8 }}>
              Las fotos y documentos se guardan en Supabase Storage, dentro de tu propio proyecto.
            </div>
          </div>
        </Sheet>
      )}

      {filtered.length === 0 ? (
        <Card><EmptyHint icon={AlertTriangle} text="No hay incidencias en esta vista." /></Card>
      ) : (
        <Card>
          {filtered.map((iRaw, idx) => {
            const i = normalizeIncidencia(iRaw);
            return (
              <Row key={i.id} last={idx === filtered.length - 1} style={{ alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 5, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, fontSize: 13.5 }}>{fmtDateShort(i.fecha)}</span>
                    <Badge tone={tipoTone[i.tipo] || "neutral"}>{i.tipo}</Badge>
                    <Badge tone={i.status === "cerrada" ? "green" : "red"}>{i.status === "cerrada" ? "Cerrada" : "Abierta"}</Badge>
                  </div>
                  {i.teacherIds.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 4 }}>
                      {i.teacherIds.map((tid) => <Badge key={tid} tone="purple">{teacherName(tid)}</Badge>)}
                    </div>
                  )}
                  {i.notasInvolucrados && <div style={{ fontSize: 12.5, color: T.inkSoft, marginBottom: 4 }}>Otros involucrados: {i.notasInvolucrados}</div>}
                  <div style={{ fontSize: 13.5 }}>{i.descripcion}</div>
                  {i.accion && <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 4 }}><strong>Acción:</strong> {i.accion}</div>}
                  {i.evidencias?.length > 0 && (
                    <div style={{ marginTop: 6 }}><Badge tone="blue">{i.evidencias.length} evidencia{i.evidencias.length > 1 ? "s" : ""}</Badge></div>
                  )}
                </div>
                <div className="no-print" style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                  <IconBtn icon={Check} size={28} tone="green" onClick={() => toggleStatus(i)} />
                  <IconBtn icon={Pencil} size={28} onClick={() => edit(i)} />
                  <IconBtn icon={Trash2} size={28} tone="red" onClick={() => remove(i.id)} />
                </div>
              </Row>
            );
          })}
        </Card>
      )}
      <FirmasBlock roles={["Coordinador(a)", "Director(a)"]} />
    </div>
  );
}

/* ============================== CTE MODULE ============================== */
const ASIST_ORDER = ["presente", "parcial", "ausente"];
const ASIST_LABEL = { presente: "Presente", parcial: "Permanencia parcial", ausente: "Ausente" };
const ASIST_TONE = { presente: "green", parcial: "orange", ausente: "red" };

function EvidenceThumb({ path, onRemove }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let active = true;
    getSignedEvidenciaUrl(path).then((url) => { if (active) setSrc(url); });
    return () => { active = false; };
  }, [path]);
  return (
    <div style={{ position: "relative", width: 72, height: 72, borderRadius: 10, overflow: "hidden", border: `1px solid ${T.separator}`, background: T.fill }}>
      {src ? <img src={src} alt="evidencia" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 16, height: 16, border: `2px solid ${T.separator}`, borderTopColor: T.blue, borderRadius: "50%", animation: "cc-spin .8s linear infinite" }} />
        </div>
      )}
      <button onClick={onRemove} style={{ position: "absolute", top: 3, right: 3, background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        <X size={11} color="#fff" />
      </button>
    </div>
  );
}

function DocChip({ ev, onRemove }) {
  const openDoc = async () => {
    const url = await getSignedEvidenciaUrl(ev.path);
    if (url) window.open(url, "_blank");
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, background: T.fill, borderRadius: 10, padding: "8px 10px", fontSize: 12, maxWidth: 220 }}>
      <button onClick={openDoc} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0, minWidth: 0 }}>
        <FileText size={14} color={T.inkSoft} style={{ flexShrink: 0 }} />
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: T.ink }}>{ev.nombre}</span>
      </button>
      <span style={{ color: T.inkFaint, flexShrink: 0 }}>{fileSizeLabel(ev.size)}</span>
      <button onClick={onRemove} style={{ background: "none", border: "none", cursor: "pointer", color: T.red, flexShrink: 0 }}><X size={12} /></button>
    </div>
  );
}

function CteModule({ cte, setCte, isMobile, teachers }) {
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const photoInputRef = useRef(null);
  const docInputRef = useRef(null);
  const makeBlank = () => ({ id: uid("c"), fecha: "", tema: "", acuerdos: "", responsables: "", status: "pendiente", asistencia: {}, evidencias: [] });
  const [draft, setDraft] = useState(makeBlank);

  const save = () => {
    if (!draft.fecha || !draft.tema) return;
    const exists = cte.some((s) => s.id === draft.id);
    if (exists) setCte(cte.map((s) => (s.id === draft.id ? draft : s)));
    else setCte([draft, ...cte]);
    setDraft(makeBlank()); setShowForm(false);
  };
  const edit = (s) => { setDraft({ asistencia: {}, evidencias: [], ...s }); setShowForm(true); };
  const remove = async (id) => {
    if (!confirm("¿Eliminar esta sesión y sus evidencias?")) return;
    await removeEvidenciaFolder(`cte/${id}`);
    setCte(cte.filter((s) => s.id !== id));
  };
  const cycleStatus = (s) => {
    const order = ["pendiente", "en_proceso", "cumplido"];
    const next = order[(order.indexOf(s.status) + 1) % order.length];
    setCte(cte.map((x) => x.id === s.id ? { ...x, status: next } : x));
  };
  const statusLabel = { pendiente: "Pendiente", en_proceso: "En proceso", cumplido: "Cumplido" };
  const statusTone = { pendiente: "red", en_proceso: "orange", cumplido: "green" };

  const cycleAttendance = (teacherId) => {
    setDraft((d) => {
      const cur = d.asistencia?.[teacherId] || "presente";
      const next = ASIST_ORDER[(ASIST_ORDER.indexOf(cur) + 1) % ASIST_ORDER.length];
      return { ...d, asistencia: { ...d.asistencia, [teacherId]: next } };
    });
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    setUploading(true);
    for (const file of files) {
      try {
        const { path, size } = await uploadEvidenciaFile(`cte/${draft.id}`, file, "foto");
        setDraft((d) => ({ ...d, evidencias: [...(d.evidencias || []), { id: uid("ev"), tipo: "foto", nombre: file.name, path, size }] }));
      } catch (err) {
        alert(`No se pudo subir "${file.name}": ${err.message || "error desconocido"}`);
      }
    }
    setUploading(false);
    e.target.value = "";
  };
  const handleDocUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    setUploading(true);
    for (const file of files) {
      if (file.size > 20 * 1024 * 1024) {
        alert(`"${file.name}" pesa más de 20 MB y no se puede subir.`);
        continue;
      }
      try {
        const { path, size } = await uploadEvidenciaFile(`cte/${draft.id}`, file, "documento");
        setDraft((d) => ({ ...d, evidencias: [...(d.evidencias || []), { id: uid("ev"), tipo: "documento", nombre: file.name, path, size }] }));
      } catch (err) {
        alert(`No se pudo subir "${file.name}": ${err.message || "error desconocido"}`);
      }
    }
    setUploading(false);
    e.target.value = "";
  };
  const removeEvidencia = async (id) => {
    const ev = draft.evidencias.find((e) => e.id === id);
    if (ev?.path) await removeEvidenciaFile(ev.path);
    setDraft((d) => ({ ...d, evidencias: (d.evidencias || []).filter((x) => x.id !== id) }));
  };

  const attendanceSummary = (s) => {
    const asis = s.asistencia || {};
    const ausentes = teachers.filter((t) => asis[t.id] === "ausente").length;
    const parciales = teachers.filter((t) => asis[t.id] === "parcial").length;
    return { presentes: teachers.length - ausentes, total: teachers.length, ausentes, parciales };
  };

  return (
    <div>
      <ReportLetterhead title="Consejo Técnico Escolar · Minuta de Sesión" />
      <ScreenHeader title="Consejo Técnico" subtitle={`${cte.length} sesión(es) registradas`}
        action={<div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Btn kind="tinted" size="sm" onClick={() => window.print()}><Printer size={13} /> Imprimir</Btn>
          <Btn kind="filled" size="sm" onClick={() => { setDraft(makeBlank()); setShowForm(true); }}><Plus size={14} /> Registrar</Btn>
        </div>} />

      {showForm && (
        <Sheet title={cte.some((s) => s.id === draft.id) ? "Editar sesión" : "Nueva sesión"} onClose={() => setShowForm(false)} onSave={save} saveDisabled={!draft.fecha || !draft.tema} isMobile={isMobile}>
          <Field label="Fecha de sesión"><input type="date" style={inputStyle} value={draft.fecha} onChange={(e) => setDraft({ ...draft, fecha: e.target.value })} /></Field>
          <Field label="Tema / orden del día"><input style={inputStyle} value={draft.tema} onChange={(e) => setDraft({ ...draft, tema: e.target.value })} /></Field>
          <Field label="Acuerdos"><textarea style={{ ...inputStyle, minHeight: 70 }} value={draft.acuerdos} onChange={(e) => setDraft({ ...draft, acuerdos: e.target.value })} /></Field>
          <Field label="Responsables del seguimiento"><textarea style={{ ...inputStyle, minHeight: 70 }} value={draft.responsables} onChange={(e) => setDraft({ ...draft, responsables: e.target.value })} /></Field>

          <div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Asistencia y permanencia</div>
            <Card>
              {teachers.map((t, idx) => {
                const st = draft.asistencia?.[t.id] || "presente";
                return (
                  <Row key={t.id} last={idx === teachers.length - 1} onClick={() => cycleAttendance(t.id)}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600 }}>{t.name}</div>
                      <div style={{ fontSize: 11.5, color: T.inkSoft }}>{t.disciplina}</div>
                    </div>
                    <Badge tone={ASIST_TONE[st]}>{ASIST_LABEL[st]}</Badge>
                  </Row>
                );
              })}
            </Card>
            <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 6 }}>Toca a un docente para alternar: presente · permanencia parcial · ausente. Por defecto se asume presente.</div>
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Evidencias</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <Btn kind="tinted" size="sm" disabled={uploading} onClick={() => photoInputRef.current?.click()}><ImageIcon size={14} /> {uploading ? "Subiendo…" : "Agregar foto"}</Btn>
              <Btn kind="tinted" size="sm" disabled={uploading} onClick={() => docInputRef.current?.click()}><Paperclip size={14} /> Agregar documento</Btn>
            </div>
            <input ref={photoInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handlePhotoUpload} />
            <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" multiple style={{ display: "none" }} onChange={handleDocUpload} />
            {draft.evidencias?.length ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {draft.evidencias.map((ev) => ev.tipo === "foto"
                  ? <EvidenceThumb key={ev.id} path={ev.path} onRemove={() => removeEvidencia(ev.id)} />
                  : <DocChip key={ev.id} ev={ev} onRemove={() => removeEvidencia(ev.id)} />)}
              </div>
            ) : <div style={{ fontSize: 12, color: T.inkFaint }}>Sin evidencias todavía.</div>}
            <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 8 }}>
              Las fotos y documentos se guardan en Supabase Storage, dentro de tu propio proyecto.
            </div>
          </div>
        </Sheet>
      )}

      {cte.length === 0 ? (
        <Card><EmptyHint icon={BookOpenCheck} text="Aún no hay sesiones de Consejo Técnico Escolar." /></Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {cte.map((s) => {
            const att = attendanceSummary(s);
            const nEvid = (s.evidencias || []).length;
            return (
              <Card key={s.id} onClick={() => edit(s)} className="cc-row-tap" style={{ padding: 14, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 5, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: 13.5 }}>{fmtDateShort(s.fecha)}</span>
                      <button onClick={(e) => { e.stopPropagation(); cycleStatus(s); }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
                        <Badge tone={statusTone[s.status]}>{statusLabel[s.status]}</Badge>
                      </button>
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 4 }}>{s.tema}</div>
                    {s.acuerdos && <div style={{ fontSize: 12.5, color: T.inkSoft }}><strong>Acuerdos:</strong> {s.acuerdos}</div>}
                    {s.responsables && <div style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 2 }}><strong>Responsables:</strong> {s.responsables}</div>}
                    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                      <Badge tone={att.ausentes === 0 ? "green" : "orange"}>{att.presentes}/{att.total} presentes</Badge>
                      {att.parciales > 0 && <Badge tone="orange">{att.parciales} permanencia parcial</Badge>}
                      {nEvid > 0 && <Badge tone="blue">{nEvid} evidencia{nEvid > 1 ? "s" : ""}</Badge>}
                    </div>
                  </div>
                  <div className="no-print" style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <IconBtn icon={Pencil} size={28} onClick={(e) => { e.stopPropagation(); edit(s); }} />
                    <IconBtn icon={Trash2} size={28} tone="red" onClick={(e) => { e.stopPropagation(); remove(s.id); }} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <FirmasBlock roles={["Coordinador(a)", "Director(a)"]} />
    </div>
  );
}
