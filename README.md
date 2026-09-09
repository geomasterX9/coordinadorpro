# Coordinación Académica · Secundaria Técnica No. 84

App de coordinación académica (visitas de acompañamiento, observación de
clase, evaluaciones, docentes, incidencias y Consejo Técnico Escolar),
construida con React + Vite y conectada a Supabase (base de datos,
autenticación y almacenamiento de evidencias).

## 1. Requisitos previos en Supabase

Antes de correr esta app necesitas haber hecho, dentro de tu proyecto de Supabase:

1. Ejecutado el script `supabase-setup.sql` en el **SQL Editor** (crea la
   tabla `app_data` y sus políticas de seguridad, además de las políticas
   del bucket de Storage).
2. Creado un bucket de Storage llamado **`evidencias`**, marcado como
   **privado** (no público).
3. Desactivado el registro abierto en **Authentication > Providers > Email**
   (apaga "Allow new users to sign up").
4. Invitado a las personas de tu equipo desde **Authentication > Users >
   Invite user**.
5. Copiado tu **Project URL** y tu **anon public key** desde
   **Settings > API**.

## 2. Configurar variables de entorno (desarrollo local)

Copia `.env.example` a `.env.local` y pega tus valores:

```
cp .env.example .env.local
```

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-llave-anon-publica
```

Estas llaves son seguras de exponer en el navegador: el acceso real está
controlado por las políticas de seguridad (RLS) que ya configuraste en el
paso 1, no por mantener la llave en secreto.

## 3. Correr en tu computadora (opcional, para probar antes de publicar)

```
npm install
npm run dev
```

Abre la URL que te muestre la terminal (normalmente `http://localhost:5173`).

## 4. Publicar en Vercel

1. Sube esta carpeta a un repositorio de GitHub (puede ser privado).
2. Entra a [vercel.com](https://vercel.com), inicia sesión con GitHub e
   importa el repositorio.
3. En "Environment Variables" agrega:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Da clic en "Deploy". En un par de minutos tendrás tu app en un enlace
   propio tipo `coordinacion-sec84.vercel.app`.

## Notas

- El inicio de sesión es solo por invitación: nadie puede crear su propia
  cuenta, solo quienes tú invites desde el panel de Supabase.
- Las fotos de evidencias se comprimen automáticamente antes de subirse.
  Los documentos se suben tal cual, hasta 20 MB.
- Todos los datos (docentes, visitas, observaciones, evaluaciones,
  incidencias, CTE) viven en la tabla `app_data` de tu proyecto de
  Supabase — puedes consultarlos directamente ahí en cualquier momento.
