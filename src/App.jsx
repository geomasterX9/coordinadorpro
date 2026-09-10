import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  CalendarCheck, ClipboardCheck, CalendarClock, Users, AlertTriangle,
  BookOpenCheck, LayoutGrid, Plus, X, Check, ChevronRight, Printer,
  Search, Pencil, Trash2, Clock, ChevronLeft, Image as ImageIcon, Paperclip,
  FileText, LogOut, Lock
} from "lucide-react";
import { supabase } from "./supabaseClient";

/* ============================== IOS DESIGN TOKENS ============================== */
const T = {
  bg: "#F2F2F7",
  bgElevated: "#FFFFFF",
  card: "#FFFFFF",
  ink: "#1C1C1E",
  inkSoft: "#6E6E73",
  inkFaint: "#AEAEB2",
  separator: "#E5E5EA",
  fill: "#F2F2F7",
  blue: "#007AFF",
  green: "#34C759",
  red: "#FF3B30",
  orange: "#FF9500",
  purple: "#AF52DE",
  teal: "#30B0C7",
  indigo: "#5856D6",
  blueTint: "rgba(0,122,255,0.1)",
  greenTint: "rgba(52,199,89,0.12)",
  redTint: "rgba(255,59,48,0.1)",
  orangeTint: "rgba(255,149,0,0.12)",
  purpleTint: "rgba(175,82,222,0.12)",
  tealTint: "rgba(48,176,199,0.12)",
};

const sysFont =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const GlobalStyle = () => (
  <style>{`
    html, body, #root { margin: 0; padding: 0; }
    .cc-root, .cc-root * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
    .cc-root { font-family: ${sysFont}; }
    .cc-root input, .cc-root select, .cc-root textarea, .cc-root button { font-family: ${sysFont}; }
    .cc-root ::-webkit-scrollbar { width: 6px; height: 6px; }
    .cc-root ::-webkit-scrollbar-thumb { background: #D1D1D6; border-radius: 3px; }
    .cc-tap { transition: transform .12s ease, opacity .12s ease; }
    .cc-tap:active { transform: scale(0.96); opacity: 0.75; }
    .cc-row-tap:active { background: #F2F2F7 !important; }
    @keyframes cc-sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @keyframes cc-fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes cc-pop { from { opacity: 0; transform: scale(.94) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    @keyframes cc-spin { to { transform: rotate(360deg); } }
    .cc-scrollx { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
    .cc-scrollx::-webkit-scrollbar { display: none; }
    @media print { .no-print { display: none !important; } }
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
  return plan.map(([month, semana], idx) => ({ id: `v${t.id}_${idx}`, teacherId: t.id, month, semana, status: "pendiente", notas: "" }));
}
const seedVisits = (teachers) => teachers.flatMap(visitsForTeacher);

const PLANEACION_TIPOS = ["Evaluación diagnóstica", "Plan Anual", "Planeación Primer Trimestre", "Planeación Segundo Trimestre", "Planeación Tercer Trimestre"];
function planeacionesForTeacher(t) {
  return PLANEACION_TIPOS.map((tipo, idx) => ({ id: `pl${t.id}_${idx}`, teacherId: t.id, tipo, status: "pendiente", fecha: "" }));
}
const seedPlaneaciones = (teachers) => teachers.flatMap(planeacionesForTeacher);
const PLANEACIONES_DRIVE_URL = "https://drive.google.com/drive/folders/1PbrzkXSvc9WtXBfDGrLRyQXmASwfAT9q?usp=sharing";

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
  if (i.teacherIds) return { notasInvolucrados: "", ...i };
  return { ...i, teacherIds: [], notasInvolucrados: i.involucrados || "" };
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
const Card = ({ children, style, ...rest }) => (
  <div style={{ background: T.card, borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 0 0 0.5px rgba(0,0,0,0.04)", ...style }} {...rest}>
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
    neutral: { bg: "#EBEBF0", fg: T.inkSoft },
    green: { bg: T.greenTint, fg: "#248A3D" },
    orange: { bg: T.orangeTint, fg: "#C36700" },
    red: { bg: T.redTint, fg: T.red },
    blue: { bg: T.blueTint, fg: T.blue },
    purple: { bg: T.purpleTint, fg: T.purple },
    teal: { bg: T.tealTint, fg: "#1E7E8C" },
  };
  const c = map[tone] || map.neutral;
  return <span style={{ background: c.bg, color: c.fg, fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 100, whiteSpace: "nowrap", lineHeight: 1.5 }}>{children}</span>;
};

const Btn = ({ children, onClick, kind = "filled", tone = "blue", size = "md", style, disabled, type = "button", href, ...rest }) => {
  const color = T[tone] || T.blue;
  const base = {
    filled: { background: disabled ? "#C7C7CC" : color, color: "#fff", border: "none" },
    tinted: { background: disabled ? "#EBEBF0" : (tone === "red" ? T.redTint : T.blueTint), color: disabled ? T.inkFaint : color, border: "none" },
    text: { background: "transparent", color: disabled ? T.inkFaint : color, border: "none", padding: "6px 4px" },
    outline: { background: "#fff", color, border: `1px solid ${T.separator}` },
  };
  const sizes = { sm: { fontSize: 13, padding: "6px 12px" }, md: { fontSize: 15, padding: "10px 16px" } };
  const commonStyle = {
    ...base[kind], ...sizes[size], display: "inline-flex", alignItems: "center", gap: 6,
    fontWeight: 600, borderRadius: kind === "text" ? 0 : 100, cursor: disabled ? "default" : "pointer", textDecoration: "none", ...style,
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
  <div style={{ display: "inline-flex", background: "#E9E9EE", borderRadius: 9, padding: 2, gap: 2 }}>
    {options.map((opt) => {
      const active = opt.value === value;
      return (
        <button key={opt.value} onClick={() => onChange(opt.value)} className="cc-tap" style={{
          border: "none", cursor: "pointer", padding: "6px 14px", borderRadius: 7, fontSize: 13, fontWeight: 600,
          background: active ? "#fff" : "transparent", color: active ? T.ink : T.inkSoft,
          boxShadow: active ? "0 1px 2px rgba(0,0,0,0.12)" : "none", transition: "all .15s",
        }}>{opt.label}</button>
      );
    })}
  </div>
);

const inputStyle = { border: "none", borderRadius: 10, padding: "11px 12px", fontSize: 15, color: T.ink, background: T.fill, outline: "none", width: "100%" };

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
  <div style={{ marginBottom: 18 }}>
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
        {avatar}
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.4, margin: 0, color: T.ink }}>{title}</h1>
          {subtitle && <div style={{ color: T.inkSoft, fontSize: 14, marginTop: 3 }}>{subtitle}</div>}
        </div>
      </div>
      {action && <div className="no-print" style={{ flexShrink: 0, paddingTop: 4 }}>{action}</div>}
    </div>
  </div>
);

/* ============================== AUTH ============================== */
function Login() {
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
    <div className="cc-root" style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <GlobalStyle />
      <Card style={{ width: 380, maxWidth: "100%", padding: 28 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: T.blueTint, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Lock size={22} color={T.blue} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: T.ink }}>Coordinación Académica</h1>
        <div style={{ fontSize: 13.5, color: T.inkSoft, marginTop: 4, marginBottom: 22 }}>Secundaria Técnica No. 84 · 2026–2027</div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Correo institucional">
            <input type="email" required autoComplete="username" style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu.nombre@tudominio.edu.mx" />
          </Field>
          <Field label="Contraseña">
            <input type="password" required autoComplete="current-password" style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {error && <div style={{ fontSize: 12.5, color: T.red }}>{error}</div>}
          {info && <div style={{ fontSize: 12.5, color: T.green }}>{info}</div>}
          <Btn type="submit" disabled={loading} style={{ justifyContent: "center", marginTop: 6 }}>{loading ? "Entrando…" : "Entrar"}</Btn>
          <button type="button" onClick={handleForgot} style={{ background: "none", border: "none", color: T.blue, fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: "4px 0" }}>
            ¿Olvidaste tu contraseña?
          </button>
        </form>
        <div style={{ fontSize: 11.5, color: T.inkFaint, marginTop: 18, textAlign: "center" }}>
          El acceso es solo por invitación. Si no tienes cuenta, pídele a tu coordinador que te invite.
        </div>
      </Card>
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
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: T.ink }}>{invite ? "Crea tu contraseña" : "Restablece tu contraseña"}</h1>
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
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: T.ink }}>El enlace ya no es válido</h1>
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
  const [teachers, setTeachers] = useState([]);
  const [visits, setVisits] = useState([]);
  const [observations, setObservations] = useState([]);
  const [evalPeriods, setEvalPeriods] = useState([]);
  const [incidencias, setIncidencias] = useState([]);
  const [cte, setCte] = useState([]);
  const [planeaciones, setPlaneaciones] = useState([]);

  useEffect(() => {
    (async () => {
      const defaultTeachers = seedTeachers();
      const [tch, vis, obs, evp, inc, cteData, plan] = await Promise.all([
        loadKey(KEYS.teachers, defaultTeachers),
        loadKey(KEYS.visits, null),
        loadKey(KEYS.observations, []),
        loadKey(KEYS.evalPeriods, seedEvalPeriods()),
        loadKey(KEYS.incidencias, []),
        loadKey(KEYS.cte, null),
        loadKey(KEYS.planeaciones, null),
      ]);
      const finalTeachers = (tch && tch.length ? tch : defaultTeachers).map(normalizeTeacher);
      const finalVisits = vis && vis.length ? vis : seedVisits(finalTeachers);
      const finalPlaneaciones = plan && plan.length ? plan : seedPlaneaciones(finalTeachers);
      setTeachers(finalTeachers);
      setVisits(finalVisits);
      setObservations(obs || []);
      setEvalPeriods(evp && evp.length ? evp : seedEvalPeriods());
      setIncidencias((inc || []).map(normalizeIncidencia));
      setCte(cteData && cteData.length ? cteData : seedCte());
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
    { id: "visitas", label: "Visitas", icon: CalendarCheck },
    { id: "observacion", label: "Observación", icon: ClipboardCheck },
    { id: "evaluaciones", label: "Evaluaciones", icon: CalendarClock },
    { id: "planeaciones", label: "Planeaciones", icon: FileText },
    { id: "docentes", label: "Docentes", icon: Users },
    { id: "incidencias", label: "Incidencias", icon: AlertTriangle },
    { id: "cte", label: "CTE", icon: BookOpenCheck },
  ];

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
        <div className="no-print" style={{ width: 232, flexShrink: 0, borderRight: `0.5px solid ${T.separator}`, padding: "20px 12px", display: "flex", flexDirection: "column", gap: 16, background: T.bgElevated }}>
          <div style={{ padding: "2px 10px 10px" }}>
            <div style={{ fontWeight: 800, fontSize: 17, color: T.ink, letterSpacing: -0.2 }}>Coordinación</div>
            <div style={{ fontSize: 12, color: T.inkFaint, marginTop: 2 }}>Sec. Técnica No. 84 · 2026–2027</div>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {nav.map((n) => {
              const Icon = n.icon;
              const isActive = active === n.id;
              return (
                <button key={n.id} onClick={() => setActive(n.id)} className="cc-tap" style={{
                  display: "flex", alignItems: "center", gap: 10, textAlign: "left", padding: "9px 10px", borderRadius: 9,
                  border: "none", cursor: "pointer", fontSize: 14, fontWeight: isActive ? 700 : 500,
                  color: isActive ? T.blue : T.ink, background: isActive ? T.blueTint : "transparent",
                }}>
                  <Icon size={18} strokeWidth={2.1} />
                  {n.label}
                </button>
              );
            })}
          </nav>
          <div style={{ marginTop: "auto", paddingTop: 12, borderTop: `0.5px solid ${T.separator}` }}>
            <div style={{ fontSize: 11.5, color: T.inkFaint, padding: "0 10px", marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{session.user.email}</div>
            <button onClick={signOut} className="cc-tap" style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 10px", border: "none", background: "transparent", color: T.red, fontSize: 13, fontWeight: 600, cursor: "pointer", borderRadius: 8 }}>
              <LogOut size={15} /> Cerrar sesión
            </button>
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {isMobile && (
          <div className="no-print" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: `0.5px solid ${T.separator}`, background: T.bgElevated }}>
            <div style={{ fontWeight: 800, fontSize: 15 }}>Coordinación</div>
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
        </div>
      </div>

      {isMobile && (
        <div className="no-print" style={{
          position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 900, display: "flex", justifyContent: "space-around",
          background: "rgba(249,249,251,0.92)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          borderTop: `0.5px solid ${T.separator}`, padding: "6px 2px calc(6px + env(safe-area-inset-bottom))",
        }}>
          {nav.map((n) => {
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
    { label: "Docentes", value: teachers.length, tone: "blue", onClick: () => setActive("docentes") },
    { label: "Visitas realizadas", value: `${completed}/${visits.length}`, sub: `${pct}%`, tone: "green", onClick: () => setActive("visitas") },
    { label: "Promedio observación", value: avgScore ?? "—", sub: avgScore ? "de 4" : "sin datos", tone: "orange", onClick: () => setActive("observacion") },
    { label: "Incidencias abiertas", value: openIncidents, tone: "red", onClick: () => setActive("incidencias") },
  ];

  return (
    <div>
      <ScreenHeader title="Inicio" subtitle="Ciclo escolar 2026–2027" />
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 10, marginBottom: 18 }}>
        {cards.map((c) => (
          <Card key={c.label} onClick={c.onClick} className="cc-tap" style={{ padding: 16, cursor: "pointer" }}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: T[c.tone], marginBottom: 10 }} />
            <div style={{ fontSize: 26, fontWeight: 800, color: T.ink, letterSpacing: -0.5 }}>{c.value}</div>
            <div style={{ fontSize: 12.5, color: T.inkSoft, fontWeight: 600, marginTop: 2 }}>{c.label}</div>
            {c.sub && <div style={{ fontSize: 11, color: T.inkFaint, marginTop: 2 }}>{c.sub}</div>}
          </Card>
        ))}
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
                <div style={{ fontSize: 20, fontWeight: 800 }}>{fmtDate(nextEval.entrega)}</div>
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

/* ============================== VISITAS MODULE ============================== */
function VisitasModule({ teachers, visits, setVisits, isMobile, goToObservation }) {
  const [filter, setFilter] = useState("");
  const months = ["SEPT", "OCT", "ENERO", "FEBRERO", "ABRIL", "JUNIO"];

  const grouped = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return teachers.filter((t) => !q || t.name.toLowerCase().includes(q) || t.disciplina.toLowerCase().includes(q))
      .map((t) => ({ teacher: t, visits: visits.filter((v) => v.teacherId === t.id) }));
  }, [teachers, visits, filter]);

  const toggleStatus = (visitId) => setVisits(visits.map((v) => v.id === visitId ? { ...v, status: v.status === "realizada" ? "pendiente" : "realizada" } : v));
  const completed = visits.filter((v) => v.status === "realizada").length;

  return (
    <div>
      <ScreenHeader title="Visitas" subtitle={`${completed} de ${visits.length} realizadas`}
        action={<Btn kind="tinted" size="sm" onClick={() => window.print()}><Printer size={13} /> Imprimir</Btn>} />
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
                      background: v.status === "realizada" ? T.greenTint : T.fill, color: v.status === "realizada" ? "#248A3D" : T.inkSoft, display: "flex", alignItems: "center",
                    }}>{v.status === "realizada" ? <Check size={13} /> : <Clock size={13} />}</button>
                    <button onClick={() => goToObservation(teacher.id)} className="cc-tap" title="Ir a observación de este docente" style={{
                      border: "none", cursor: "pointer", borderRadius: "0 10px 10px 0", padding: "8px 12px 8px 8px",
                      background: v.status === "realizada" ? T.greenTint : T.fill, color: v.status === "realizada" ? "#248A3D" : T.inkSoft,
                      fontSize: 12, fontWeight: 700, borderLeft: `1px solid ${v.status === "realizada" ? "rgba(52,199,89,0.25)" : T.separator}`,
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
                          <div style={{ display: "inline-flex", alignItems: "center", borderRadius: 100, overflow: "hidden" }}>
                            <button onClick={() => toggleStatus(v.id)} className="cc-tap" title="Marcar pendiente/realizada" style={{
                              border: "none", cursor: "pointer", padding: "5px 7px", background: v.status === "realizada" ? T.greenTint : T.fill,
                              color: v.status === "realizada" ? "#248A3D" : T.inkSoft, display: "flex", alignItems: "center",
                            }}>{v.status === "realizada" ? <Check size={12} /> : <Clock size={12} />}</button>
                            <button onClick={() => goToObservation(teacher.id)} className="cc-tap" title="Ir a observación de este docente" style={{
                              border: "none", cursor: "pointer", padding: "5px 10px 5px 6px", background: v.status === "realizada" ? T.greenTint : T.fill,
                              color: v.status === "realizada" ? "#248A3D" : T.inkSoft, fontSize: 11.5, fontWeight: 700,
                              borderLeft: `1px solid ${v.status === "realizada" ? "rgba(52,199,89,0.25)" : T.separator}`,
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
    planeaciones.find((p) => p.teacherId === teacherId && p.tipo === tipo) || { id: `pl${teacherId}_${idx}`, teacherId, tipo, status: "pendiente", fecha: "" };

  const grouped = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return teachers.filter((t) => !q || t.name.toLowerCase().includes(q) || t.disciplina.toLowerCase().includes(q))
      .map((t) => ({ teacher: t, items: PLANEACION_TIPOS.map((tipo, idx) => findOrDefault(t.id, tipo, idx)) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teachers, planeaciones, filter]);

  const totalDone = planeaciones.filter((p) => p.status === "entregada").length;
  const totalAll = teachers.length * PLANEACION_TIPOS.length;

  const save = () => {
    const exists = planeaciones.some((p) => p.id === editing.id);
    setPlaneaciones(exists ? planeaciones.map((p) => (p.id === editing.id ? editing : p)) : [...planeaciones, editing]);
    setEditing(null);
  };

  return (
    <div>
      <ScreenHeader title="Planeaciones" subtitle={`${totalDone} de ${totalAll} entregables completados`}
        action={<div style={{ display: "flex", gap: 8 }}>
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
                {items.map((p) => (
                  <button key={p.tipo} onClick={() => setEditing(p)} className="cc-tap" style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center", border: "none", cursor: "pointer",
                    borderRadius: 10, padding: "8px 10px", background: p.status === "entregada" ? T.greenTint : T.fill, textAlign: "left",
                  }}>
                    <span style={{ fontSize: 12.5, color: T.ink }}>{p.tipo}</span>
                    <Badge tone={p.status === "entregada" ? "green" : "neutral"}>{p.status === "entregada" ? fmtDateShort(p.fecha) : "Pendiente"}</Badge>
                  </button>
                ))}
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
                  {items.map((p) => (
                    <td key={p.tipo} style={{ ...tdStyle, textAlign: "center" }}>
                      <button onClick={() => setEditing(p)} className="cc-tap" style={{
                        border: "none", cursor: "pointer", borderRadius: 100, padding: "5px 10px",
                        background: p.status === "entregada" ? T.greenTint : T.fill, color: p.status === "entregada" ? "#248A3D" : T.inkSoft,
                        display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11.5, fontWeight: 700,
                      }}>
                        {p.status === "entregada" ? <Check size={12} /> : <Clock size={12} />}
                        {p.status === "entregada" ? fmtDateShort(p.fecha) : "Pendiente"}
                      </button>
                    </td>
                  ))}
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
        </Sheet>
      )}
    </div>
  );
}

/* ============================== OBSERVACIÓN MODULE ============================== */
function ObservacionModule({ teachers, observations, setObservations, teacherName, isMobile, obsPrefill, clearObsPrefill, obsViewPrefill, clearObsViewPrefill }) {
  const [mode, setMode] = useState("list");
  const [editingId, setEditingId] = useState(null);
  const blank = () => ({
    id: uid("o"), teacherId: teachers[0]?.id || "", grado: "", grupo: "", asignatura: "", tematica: "",
    fecha: "", horaInicio: "", horaTermino: "", alumnosLista: "", alumnosPresentes: "",
    scores: {}, observaciones: "", recomendaciones: "", autorreflexion: "",
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

  const save = () => {
    if (!draft.teacherId || !draft.fecha) return;
    if (editingId) setObservations(observations.map((o) => (o.id === editingId ? draft : o)));
    else setObservations([draft, ...observations]);
    setMode("list");
  };
  const remove = (id) => setObservations(observations.filter((o) => o.id !== id));
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
        <ScreenHeader title={teacherName(draft.teacherId)} subtitle={fmtDate(draft.fecha)}
          action={<div style={{ display: "flex", gap: 8 }}>
            <IconBtn icon={ChevronLeft} onClick={() => setMode("list")} />
            <IconBtn icon={Pencil} onClick={() => startEdit(draft)} />
            <IconBtn icon={Printer} onClick={() => window.print()} />
          </div>} />
        <Card style={{ padding: 18, marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4,1fr)", gap: 10, fontSize: 13, marginBottom: 14 }}>
            <div><strong>Grado/Grupo:</strong> {draft.grado} {draft.grupo}</div>
            <div><strong>Asignatura:</strong> {draft.asignatura}</div>
            <div><strong>Hora:</strong> {draft.horaInicio}–{draft.horaTermino}</div>
            <div><strong>Alumnos:</strong> {draft.alumnosPresentes}/{draft.alumnosLista}</div>
          </div>
          <Badge tone="orange">Promedio {scoreAvg(draft)} / 4 · {filled}/{RUBRIC_ITEM_COUNT} ítems</Badge>
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
                <div style={{ fontWeight: 700, fontSize: 14 }}>{teacherName(o.teacherId)}</div>
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
                  <div style={{ fontWeight: 800, fontSize: 18 }}>Periodo {p.periodo}</div>
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
    </div>
  );
}

/* ============================== DOCENTES MODULE ============================== */
function DocentesModule(props) {
  const { teachers, setTeachers, visits, setVisits, observations, setObservations, incidencias, setIncidencias, planeaciones, setPlaneaciones, isMobile } = props;
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [openId, setOpenId] = useState(null);

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

  const openTeacher = teachers.find((t) => t.id === openId);
  if (openTeacher) {
    return <TeacherExpediente {...props} teacher={openTeacher} onBack={() => setOpenId(null)} />;
  }

  return (
    <div>
      <ScreenHeader title="Docentes" subtitle={`${teachers.length} registrados`}
        action={<Btn kind="filled" size="sm" onClick={() => setEditing({ id: uid("t"), name: "", disciplina: "", telefono: "", correo: "", notas: "" })}><Plus size={14} /> Agregar</Btn>} />
      <div className="no-print" style={{ marginBottom: 14, display: "flex", alignItems: "center", gap: 8, background: T.card, borderRadius: 10, padding: "9px 12px" }}>
        <Search size={15} color={T.inkFaint} />
        <input style={{ border: "none", outline: "none", fontSize: 15, background: "transparent", width: "100%" }} placeholder="Buscar por nombre o disciplina" value={filter} onChange={(e) => setFilter(e.target.value)} />
      </div>

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
      <ScreenHeader title={teacher.name} subtitle={teacher.disciplina}
        avatar={<TeacherAvatar path={teacher.fotoPath} uploading={photoUploading} onPick={handlePhotoPick} onRemove={removePhoto} />}
        action={<div style={{ display: "flex", gap: 8 }}>
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
        <Card style={{ padding: 14 }}><div style={{ fontSize: 22, fontWeight: 800 }}>{visitsDone}/{tVisits.length}</div><div style={{ fontSize: 12, color: T.inkSoft, fontWeight: 600 }}>Visitas realizadas</div></Card>
        <Card style={{ padding: 14 }}><div style={{ fontSize: 22, fontWeight: 800 }}>{tObs.length}</div><div style={{ fontSize: 12, color: T.inkSoft, fontWeight: 600 }}>Observaciones</div></Card>
        <Card style={{ padding: 14 }}><div style={{ fontSize: 22, fontWeight: 800 }}>{avg ?? "—"}</div><div style={{ fontSize: 12, color: T.inkSoft, fontWeight: 600 }}>Promedio</div></Card>
        <Card style={{ padding: 14 }}><div style={{ fontSize: 22, fontWeight: 800, color: incAbiertas ? T.red : T.ink }}>{incAbiertas}</div><div style={{ fontSize: 12, color: T.inkSoft, fontWeight: 600 }}>Incidencias abiertas</div></Card>
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
    </div>
  );
}

/* ============================== INCIDENCIAS MODULE ============================== */
const ChipToggle = ({ label, active, onClick }) => (
  <button type="button" onClick={onClick} className="cc-tap" style={{
    border: "none", cursor: "pointer", borderRadius: 100, padding: "6px 12px", fontSize: 12.5, fontWeight: 600,
    background: active ? T.blue : T.fill, color: active ? "#fff" : T.inkSoft,
  }}>{label}</button>
);

function IncidenciasModule({ incidencias, setIncidencias, isMobile, teachers, teacherName, setActive }) {
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("todas");
  const blank = { id: null, fecha: "", teacherIds: [], notasInvolucrados: "", tipo: "Académica", descripcion: "", accion: "", status: "abierta" };
  const [draft, setDraft] = useState(blank);

  const save = () => {
    if (!draft.fecha || !draft.descripcion) return;
    if (draft.id) setIncidencias(incidencias.map((i) => (i.id === draft.id ? draft : i)));
    else setIncidencias([{ ...draft, id: uid("i") }, ...incidencias]);
    setDraft(blank); setShowForm(false);
  };
  const edit = (i) => { setDraft(normalizeIncidencia(i)); setShowForm(true); };
  const remove = (id) => setIncidencias(incidencias.filter((i) => i.id !== id));
  const toggleStatus = (i) => setIncidencias(incidencias.map((x) => x.id === i.id ? { ...x, status: x.status === "cerrada" ? "abierta" : "cerrada" } : x));
  const toggleDraftTeacher = (id) => setDraft((d) => ({ ...d, teacherIds: d.teacherIds.includes(id) ? d.teacherIds.filter((x) => x !== id) : [...d.teacherIds, id] }));

  const filtered = incidencias.filter((i) => filterStatus === "todas" || i.status === filterStatus);
  const tipos = ["Académica", "Disciplina", "Administrativa", "Otra"];
  const tipoTone = { "Académica": "blue", "Disciplina": "red", "Administrativa": "orange", "Otra": "neutral" };

  return (
    <div>
      <ScreenHeader title="Incidencias" subtitle={`${incidencias.filter((i) => i.status !== "cerrada").length} abiertas de ${incidencias.length}`}
        action={<Btn kind="filled" size="sm" onClick={() => { setDraft(blank); setShowForm(true); }}><Plus size={14} /> Registrar</Btn>} />
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
      <ScreenHeader title="Consejo Técnico" subtitle={`${cte.length} sesión(es) registradas`}
        action={<Btn kind="filled" size="sm" onClick={() => { setDraft(makeBlank()); setShowForm(true); }}><Plus size={14} /> Registrar</Btn>} />

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
                      <button className="no-print" onClick={(e) => { e.stopPropagation(); cycleStatus(s); }} style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}>
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
    </div>
  );
}
