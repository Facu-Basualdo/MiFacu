-- Migration: Create tables for Calificaciones de Catedras feature
-- Run this script in your Supabase SQL editor

-- Create enum type for dificultad
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dificultad_enum') THEN
        CREATE TYPE dificultad_enum AS ENUM ('facil', 'media', 'dificil');
    END IF;
END
$$;

-- Create enum type for tipo_voto
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_voto_enum') THEN
        CREATE TYPE tipo_voto_enum AS ENUM ('util', 'no_util');
    END IF;
END
$$;

-- Create calificaciones_catedras table
CREATE TABLE IF NOT EXISTS calificaciones_catedras (
    id SERIAL PRIMARY KEY,
    materia_id INT NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
    profesor_nombre VARCHAR(150) NOT NULL,
    rating DECIMAL(2,1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
    dificultad dificultad_enum NOT NULL,
    comentario TEXT NOT NULL,
    es_anonimo BOOLEAN NOT NULL DEFAULT FALSE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    votos_utiles INT NOT NULL DEFAULT 0,
    votos_no_utiles INT NOT NULL DEFAULT 0,
    reportes INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for calificaciones_catedras
CREATE INDEX IF NOT EXISTS idx_calificaciones_materia_id ON calificaciones_catedras(materia_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_user_id ON calificaciones_catedras(user_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_created_at ON calificaciones_catedras(created_at DESC);

-- Create votos_calificaciones table
CREATE TABLE IF NOT EXISTS votos_calificaciones (
    id SERIAL PRIMARY KEY,
    calificacion_id INT NOT NULL REFERENCES calificaciones_catedras(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tipo tipo_voto_enum NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(calificacion_id, user_id)
);

-- Create indexes for votos_calificaciones
CREATE INDEX IF NOT EXISTS idx_votos_calificacion_id ON votos_calificaciones(calificacion_id);
CREATE INDEX IF NOT EXISTS idx_votos_user_id ON votos_calificaciones(user_id);

-- Create reportes_calificaciones table
CREATE TABLE IF NOT EXISTS reportes_calificaciones (
    id SERIAL PRIMARY KEY,
    calificacion_id INT NOT NULL REFERENCES calificaciones_catedras(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    motivo VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(calificacion_id, user_id)
);

-- Create indexes for reportes_calificaciones
CREATE INDEX IF NOT EXISTS idx_reportes_calificacion_id ON reportes_calificaciones(calificacion_id);

-- Create trigger to update updated_at on calificaciones_catedras
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_calificaciones_updated_at ON calificaciones_catedras;
CREATE TRIGGER update_calificaciones_updated_at
    BEFORE UPDATE ON calificaciones_catedras
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (adjust based on your RLS policies)
-- These are examples - adjust based on your Supabase setup

-- Enable RLS on the tables
ALTER TABLE calificaciones_catedras ENABLE ROW LEVEL SECURITY;
ALTER TABLE votos_calificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes_calificaciones ENABLE ROW LEVEL SECURITY;

-- Policies for calificaciones_catedras
DROP POLICY IF EXISTS "Allow authenticated read calificaciones" ON calificaciones_catedras;
CREATE POLICY "Allow authenticated read calificaciones"
    ON calificaciones_catedras FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow insert own calificaciones" ON calificaciones_catedras;
CREATE POLICY "Allow insert own calificaciones"
    ON calificaciones_catedras FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow update own calificaciones" ON calificaciones_catedras;
CREATE POLICY "Allow update own calificaciones"
    ON calificaciones_catedras FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow delete own calificaciones" ON calificaciones_catedras;
CREATE POLICY "Allow delete own calificaciones"
    ON calificaciones_catedras FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Policies for votos_calificaciones
DROP POLICY IF EXISTS "Allow authenticated read votos" ON votos_calificaciones;
CREATE POLICY "Allow authenticated read votos"
    ON votos_calificaciones FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow insert own votos" ON votos_calificaciones;
CREATE POLICY "Allow insert own votos"
    ON votos_calificaciones FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow update own votos" ON votos_calificaciones;
CREATE POLICY "Allow update own votos"
    ON votos_calificaciones FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow delete own votos" ON votos_calificaciones;
CREATE POLICY "Allow delete own votos"
    ON votos_calificaciones FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Policies for reportes_calificaciones
DROP POLICY IF EXISTS "Allow authenticated read reportes" ON reportes_calificaciones;
CREATE POLICY "Allow authenticated read reportes"
    ON reportes_calificaciones FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow insert own reportes" ON reportes_calificaciones;
CREATE POLICY "Allow insert own reportes"
    ON reportes_calificaciones FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
