
-- Modificar tabla recordatorios para permitir Quick Tasks (tareas sin materia/fecha específica)
ALTER TABLE recordatorios ALTER COLUMN materia_id DROP NOT NULL;
ALTER TABLE recordatorios ALTER COLUMN fecha DROP NOT NULL;
ALTER TABLE recordatorios ALTER COLUMN hora DROP NOT NULL;
ALTER TABLE recordatorios ALTER COLUMN color DROP NOT NULL;

-- Agregar columna 'descripcion' si no existe (el frontend la envía)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recordatorios' AND column_name='descripcion') THEN
        ALTER TABLE recordatorios ADD COLUMN descripcion TEXT;
    END IF;
END
$$;
