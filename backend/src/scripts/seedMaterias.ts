import { DataSource } from "typeorm";
import { Materia } from "../models/materias.model";
import { Recordatorio } from "../models/recordatorios.model";
import { Final } from "../models/finales.model";
import { Duración } from "../types/materias";
import dotenv from "dotenv";

dotenv.config();

// DataSource sin sincronización para el seed
const SeedDataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    synchronize: false, // Desactivado para evitar conflictos
    logging: false,
    entities: [Materia, Recordatorio, Final],
    extra: {
        ssl: {
            rejectUnauthorized: false
        }
    },
});

const materiasData = [
    // NIVEL I
    { numero: 1, nivel: "I", nombre: "Análisis Matemático I" },
    { numero: 2, nivel: "I", nombre: "Álgebra y Geometría Analítica" },
    { numero: 3, nivel: "I", nombre: "Física I" },
    { numero: 4, nivel: "I", nombre: "Inglés I" },
    { numero: 5, nivel: "I", nombre: "Lógica y Estructuras Discretas" },
    { numero: 6, nivel: "I", nombre: "Algoritmos y Estructuras de Datos" },
    { numero: 7, nivel: "I", nombre: "Arquitectura de Computadoras" },
    { numero: 8, nivel: "I", nombre: "Sistemas y Procesos de Negocio" },
    // NIVEL II
    { numero: 9, nivel: "II", nombre: "Análisis Matemático II", cursarAprobadas: [1, 2] },
    { numero: 10, nivel: "II", nombre: "Física II", cursarAprobadas: [1, 3] },
    { numero: 11, nivel: "II", nombre: "Ingeniería y Sociedad" },
    { numero: 12, nivel: "II", nombre: "Inglés II", cursarAprobadas: [4] },
    { numero: 13, nivel: "II", nombre: "Sintaxis y Semántica de los Lenguajes", cursarAprobadas: [5, 6] },
    { numero: 14, nivel: "II", nombre: "Paradigmas de Programación", cursarAprobadas: [5, 6] },
    { numero: 15, nivel: "II", nombre: "Sistemas Operativos", cursarAprobadas: [7] },
    { numero: 16, nivel: "II", nombre: "Análisis de Sistemas de Información", cursarAprobadas: [6, 8] },
    // NIVEL III
    { numero: 17, nivel: "III", nombre: "Probabilidad y Estadística", cursarAprobadas: [1, 2] },
    { numero: 18, nivel: "III", nombre: "Economía", cursarAprobadas: [1, 2] },
    { numero: 19, nivel: "III", nombre: "Bases de Datos", cursarAprobadas: [13, 16], cursarCursadas: [5, 6] },
    { numero: 20, nivel: "III", nombre: "Desarrollo de Software", cursarAprobadas: [5, 6], cursarCursadas: [14, 16] },
    { numero: 21, nivel: "III", nombre: "Comunicación de Datos", cursarAprobadas: [3, 7] },
    { numero: 22, nivel: "III", nombre: "Análisis Numérico", cursarAprobadas: [9], cursarCursadas: [1, 2] },
    { numero: 23, nivel: "III", nombre: "Diseño de Sistemas de Información", cursarAprobadas: [4, 6, 8], cursarCursadas: [14, 16] },
    // NIVEL IV
    { numero: 24, nivel: "IV", nombre: "Legislación", cursarAprobadas: [11] },
    { numero: 25, nivel: "IV", nombre: "Ingeniería y Calidad de Software", cursarAprobadas: [19, 20, 23], cursarCursadas: [13, 14] },
    { numero: 26, nivel: "IV", nombre: "Redes de Datos", cursarAprobadas: [15, 21] },
    { numero: 27, nivel: "IV", nombre: "Investigación Operativa", cursarAprobadas: [17, 22] },
    { numero: 28, nivel: "IV", nombre: "Simulación", cursarAprobadas: [17], cursarCursadas: [9] },
    { numero: 29, nivel: "IV", nombre: "Tecnologías para la automatización", cursarAprobadas: [10, 22], cursarCursadas: [9] },
    { numero: 30, nivel: "IV", nombre: "Administración de Sistemas de Información", cursarAprobadas: [16], cursarCursadas: [18, 23] },
    // NIVEL V
    { numero: 31, nivel: "V", nombre: "Inteligencia Artificial", cursarAprobadas: [17, 22], cursarCursadas: [28] },
    { numero: 32, nivel: "V", nombre: "Ciencia de Datos", cursarAprobadas: [17, 19], cursarCursadas: [28] },
    { numero: 33, nivel: "V", nombre: "Sistemas de Gestión", cursarAprobadas: [18, 27], cursarCursadas: [23] },
    { numero: 34, nivel: "V", nombre: "Gestión Gerencial", cursarAprobadas: [24, 30], cursarCursadas: [18] },
    { numero: 35, nivel: "V", nombre: "Seguridad en los Sistemas de Información", cursarAprobadas: [26, 30], cursarCursadas: [20, 21] },
    { numero: 36, nivel: "V", nombre: "Proyecto Final", cursarAprobadas: [25, 26, 30], cursarCursadas: [12, 20, 23] },
];

export const seedMaterias = async () => {
    try {
        if (!SeedDataSource.isInitialized) await SeedDataSource.initialize();
        const repo = SeedDataSource.getRepository(Materia);
        const queryRunner = SeedDataSource.createQueryRunner();

        console.log("Verificando y actualizando esquema de la tabla materias...");
        // Actualizar esquema: eliminar columna antigua y agregar nuevas
        try {
            await queryRunner.query(`
                DO $$ 
                BEGIN
                    -- Eliminar columna antigua si existe
                    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='materias' AND column_name='anio') THEN
                        ALTER TABLE materias DROP COLUMN anio;
                    END IF;
                    -- Agregar nuevas columnas si no existen
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='materias' AND column_name='numero') THEN
                        ALTER TABLE materias ADD COLUMN numero INTEGER UNIQUE;
                    END IF;
                    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='materias' AND column_name='nivel') THEN
                        ALTER TABLE materias ADD COLUMN nivel VARCHAR(10);
                    END IF;
                    -- Crear tabla correlativas si no existe
                    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='correlativas') THEN
                        CREATE TABLE correlativas (
                            materia_id INTEGER NOT NULL,
                            correlativa_id INTEGER NOT NULL,
                            PRIMARY KEY (materia_id, correlativa_id),
                            FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
                            FOREIGN KEY (correlativa_id) REFERENCES materias(id) ON DELETE CASCADE
                        );
                    END IF;
                END $$;
            `);
        } catch (error: any) {
            console.warn("Error al actualizar esquema (puede ser normal):", error.message);
        }
        
        console.log("Limpiando datos existentes...");
        // Limpiar datos
        try {
            await queryRunner.query('DELETE FROM correlativas');
        } catch (error: any) {
            if (error.code !== '42P01') throw error;
        }
        try {
            await queryRunner.query('DELETE FROM recordatorios');
        } catch (error: any) {
            if (error.code !== '42P01') throw error;
        }
        try {
            await queryRunner.query('DELETE FROM finales');
        } catch (error: any) {
            if (error.code !== '42P01') throw error;
        }
        await queryRunner.query('DELETE FROM materias');
        console.log("Datos limpiados.");
        
        console.log("Cargando materias...");
        
        // 1. Crear todas las materias
        for (const m of materiasData) {
            let materia = await repo.findOneBy({ nombre: m.nombre });
            if (!materia) {
                materia = repo.create({
                    numero: m.numero,
                    nivel: m.nivel,
                    nombre: m.nombre,
                    duracion: Duración.Anual // Por defecto o lógica según nivel
                });
            } else {
                // Actualizar materia existente con los nuevos campos
                materia.numero = m.numero;
                materia.nivel = m.nivel;
                if (!materia.duracion) {
                    materia.duracion = Duración.Anual;
                }
            }
            await repo.save(materia);
        }

        // 2. Establecer correlatividades (usando cursarAprobadas como base)
        for (const m of materiasData) {
            if (m.cursarAprobadas) {
                const materiaActual = await repo.findOne({ 
                    where: { numero: m.numero }
                });
                
                if (materiaActual) {
                    const correlativas = await repo.createQueryBuilder("materia")
                        .where("materia.numero IN (:...nums)", { nums: m.cursarAprobadas })
                        .getMany();
                    
                    // Usar query directo para insertar en la tabla de correlativas
                    for (const correlativa of correlativas) {
                        try {
                            await queryRunner.query(
                                'INSERT INTO correlativas (materia_id, correlativa_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                                [materiaActual.id, correlativa.id]
                            );
                        } catch (error: any) {
                            // Ignorar errores de duplicados
                            if (error.code !== '23505') throw error;
                        }
                    }
                }
            }
        }

        console.log("¡Carga masiva completada!");
    } catch (error) {
        console.error("Error en el seed:", error);
        throw error;
    } finally {
        if (SeedDataSource.isInitialized) {
            await SeedDataSource.destroy();
        }
    }
};

seedMaterias();