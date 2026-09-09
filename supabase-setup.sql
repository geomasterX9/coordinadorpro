-- ============================================================
-- Coordinación Académica · Esc. Sec. Técnica No. 84
-- Script de configuración inicial para Supabase
-- Pégalo completo en SQL Editor y da clic en "Run"
-- ============================================================

-- Tabla única de datos de la app (docentes, visitas, observaciones,
-- periodos de evaluación, incidencias y sesiones de CTE), cada una
-- guardada como un registro JSON bajo su propia llave.
create table if not exists app_data (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table app_data enable row level security;

-- Solo usuarios autenticados (los que tú invitaste) pueden leer y escribir.
create policy "Lectura para usuarios autenticados"
  on app_data for select
  to authenticated
  using (true);

create policy "Inserción para usuarios autenticados"
  on app_data for insert
  to authenticated
  with check (true);

create policy "Actualización para usuarios autenticados"
  on app_data for update
  to authenticated
  using (true);

-- Refresca updated_at automáticamente en cada cambio
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger app_data_set_updated_at
  before update on app_data
  for each row execute procedure set_updated_at();

-- ============================================================
-- Bucket de Storage para evidencias del CTE (fotos y documentos)
-- Crea el bucket "evidencias" desde el panel de Storage ANTES
-- de correr esto (marcado como privado, no público).
-- ============================================================

create policy "Lectura de evidencias para autenticados"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'evidencias');

create policy "Subida de evidencias para autenticados"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'evidencias');

create policy "Borrado de evidencias para autenticados"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'evidencias');
