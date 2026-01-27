import { AppDataSource } from "../config/DataSource";
import { Materia } from "../models/materias.model";
import { CorrelativaDetalle, TipoCorrelativa } from "../models/correlativas.model";
import { Duración } from "../types/materias";

// Plan de Estudios 2023 - UTN FRRE - Ingeniería en Sistemas de Información
const MATERIAS_PLAN_2023 = [
  // NIVEL 1
  { numero: 1, nombre: "Análisis Matemático I", nivel: "I", duracion: Duración.Anual },
  { numero: 2, nombre: "Álgebra y Geometría Analítica", nivel: "I", duracion: Duración.Anual },
  { numero: 3, nombre: "Física I", nivel: "I", duracion: Duración.Anual },
  { numero: 4, nombre: "Inglés I", nivel: "I", duracion: Duración.Cuatrimestral1 },
  { numero: 5, nombre: "Lógica y Estructuras Discretas", nivel: "I", duracion: Duración.Cuatrimestral1 },
  { numero: 6, nombre: "Algoritmos y Estructuras de Datos", nivel: "I", duracion: Duración.Anual },
  { numero: 7, nombre: "Arquitectura de Computadoras", nivel: "I", duracion: Duración.Cuatrimestral2 },
  { numero: 8, nombre: "Sistemas y Procesos de Negocios", nivel: "I", duracion: Duración.Anual },

  // NIVEL 2
  { numero: 9, nombre: "Análisis Matemático II", nivel: "II", duracion: Duración.Anual },
  { numero: 10, nombre: "Física II", nivel: "II", duracion: Duración.Anual },
  { numero: 11, nombre: "Ingeniería y Sociedad", nivel: "II", duracion: Duración.Cuatrimestral1 },
  { numero: 12, nombre: "Inglés II", nivel: "II", duracion: Duración.Cuatrimestral2 },
  { numero: 13, nombre: "Sintaxis y Semántica de los Lenguajes", nivel: "II", duracion: Duración.Cuatrimestral1 },
  { numero: 14, nombre: "Paradigmas de Programación", nivel: "II", duracion: Duración.Cuatrimestral1 },
  { numero: 15, nombre: "Sistemas Operativos", nivel: "II", duracion: Duración.Cuatrimestral2 },
  { numero: 16, nombre: "Análisis de Sistemas de Información", nivel: "II", duracion: Duración.Anual },
  { numero: 17, nombre: "Probabilidades y Estadísticas", nivel: "II", duracion: Duración.Cuatrimestral2 },

  // NIVEL 3
  { numero: 18, nombre: "Economía", nivel: "III", duracion: Duración.Cuatrimestral1 },
  { numero: 19, nombre: "Base de Datos", nivel: "III", duracion: Duración.Cuatrimestral1 },
  { numero: 20, nombre: "Desarrollo de Software", nivel: "III", duracion: Duración.Anual },
  { numero: 21, nombre: "Comunicaciones de Datos", nivel: "III", duracion: Duración.Cuatrimestral1 },
  { numero: 22, nombre: "Análisis Numérico", nivel: "III", duracion: Duración.Cuatrimestral2 },
  { numero: 23, nombre: "Diseño de Sistemas de Información", nivel: "III", duracion: Duración.Anual },

  // NIVEL 4
  { numero: 24, nombre: "Legislación", nivel: "IV", duracion: Duración.Cuatrimestral1 },
  { numero: 25, nombre: "Ingeniería y Calidad de Software", nivel: "IV", duracion: Duración.Cuatrimestral1 },
  { numero: 26, nombre: "Redes de Datos", nivel: "IV", duracion: Duración.Cuatrimestral2 },
  { numero: 27, nombre: "Investigación Operativa", nivel: "IV", duracion: Duración.Cuatrimestral1 },
  { numero: 28, nombre: "Simulación", nivel: "IV", duracion: Duración.Cuatrimestral1 },
  { numero: 29, nombre: "Tecnologías para la Automatización", nivel: "IV", duracion: Duración.Cuatrimestral2 },
  { numero: 30, nombre: "Administración de Sistemas de Información", nivel: "IV", duracion: Duración.Anual },

  // NIVEL 5
  { numero: 31, nombre: "Inteligencia Artificial", nivel: "V", duracion: Duración.Cuatrimestral2 },
  { numero: 32, nombre: "Ciencia de Datos", nivel: "V", duracion: Duración.Cuatrimestral1 },
  { numero: 33, nombre: "Sistemas de Gestión", nivel: "V", duracion: Duración.Cuatrimestral1 },
  { numero: 34, nombre: "Gestión Gerencial", nivel: "V", duracion: Duración.Cuatrimestral1 },
  { numero: 35, nombre: "Seguridad en los Sistemas de Información", nivel: "V", duracion: Duración.Cuatrimestral2 },
  { numero: 36, nombre: "Proyecto Final", nivel: "V", duracion: Duración.Anual },
];

// Correlativas del Plan 2023
// Formato: numero_materia: { regularizadas: [numeros], aprobadas: [numeros] }
const CORRELATIVAS_PLAN_2023: Record<number, { regularizadas: number[], aprobadas: number[] }> = {
  // NIVEL 1 - Sin correlativas
  1: { regularizadas: [], aprobadas: [] },
  2: { regularizadas: [], aprobadas: [] },
  3: { regularizadas: [], aprobadas: [] },
  4: { regularizadas: [], aprobadas: [] },
  5: { regularizadas: [], aprobadas: [] },
  6: { regularizadas: [], aprobadas: [] },
  7: { regularizadas: [], aprobadas: [] },
  8: { regularizadas: [], aprobadas: [] },

  // NIVEL 2
  9: { regularizadas: [1, 2], aprobadas: [] },       // Análisis Matemático II
  10: { regularizadas: [1, 3], aprobadas: [] },      // Física II
  11: { regularizadas: [], aprobadas: [] },          // Ingeniería y Sociedad
  12: { regularizadas: [4], aprobadas: [] },         // Inglés II
  13: { regularizadas: [5, 6], aprobadas: [] },      // Sintaxis y Semántica
  14: { regularizadas: [5, 6], aprobadas: [] },      // Paradigmas de Programación
  15: { regularizadas: [7], aprobadas: [] },         // Sistemas Operativos
  16: { regularizadas: [6, 8], aprobadas: [] },      // Análisis de Sistemas
  17: { regularizadas: [1, 2], aprobadas: [1, 2] },  // Probabilidades y Estadísticas

  // NIVEL 3
  18: { regularizadas: [1, 2], aprobadas: [1, 2] },           // Economía
  19: { regularizadas: [13, 16], aprobadas: [5, 6] },         // Base de Datos
  20: { regularizadas: [14, 16], aprobadas: [5, 6] },         // Desarrollo de Software
  21: { regularizadas: [], aprobadas: [3, 7] },               // Comunicaciones de Datos
  22: { regularizadas: [9], aprobadas: [1, 2] },              // Análisis Numérico
  23: { regularizadas: [14, 16], aprobadas: [1, 2, 4, 6, 8] }, // Diseño de Sistemas

  // NIVEL 4
  24: { regularizadas: [11], aprobadas: [] },                 // Legislación
  25: { regularizadas: [19, 20, 23], aprobadas: [13, 14] },   // Ingeniería y Calidad de Software
  26: { regularizadas: [15, 21], aprobadas: [] },             // Redes de Datos
  27: { regularizadas: [17, 22], aprobadas: [9] },            // Investigación Operativa
  28: { regularizadas: [17], aprobadas: [9] },                // Simulación
  29: { regularizadas: [10, 22], aprobadas: [] },             // Tecnologías para la Automatización
  30: { regularizadas: [18, 23], aprobadas: [16] },           // Administración de Sistemas

  // NIVEL 5
  31: { regularizadas: [28], aprobadas: [17, 22] },           // Inteligencia Artificial
  32: { regularizadas: [28], aprobadas: [17, 19] },           // Ciencia de Datos
  33: { regularizadas: [18, 27], aprobadas: [23] },           // Sistemas de Gestión
  34: { regularizadas: [24, 30], aprobadas: [18] },           // Gestión Gerencial
  35: { regularizadas: [26, 30], aprobadas: [20, 21] },       // Seguridad en los Sistemas
  36: { regularizadas: [25, 26, 30], aprobadas: [12, 20, 23] }, // Proyecto Final
};

async function main() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connected\n");

    const materiaRepo = AppDataSource.getRepository(Materia);
    const correlativaRepo = AppDataSource.getRepository(CorrelativaDetalle);

    // ============================================
    // PASO 1: Crear tabla correlativas_detalle si no existe
    // ============================================
    console.log("📦 Verificando tabla correlativas_detalle...");
    try {
      await AppDataSource.query(`
        CREATE TABLE IF NOT EXISTS correlativas_detalle (
          id SERIAL PRIMARY KEY,
          materia_id INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
          correlativa_id INTEGER NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
          tipo VARCHAR(20) NOT NULL DEFAULT 'regularizada',
          UNIQUE(materia_id, correlativa_id, tipo)
        );
      `);
      console.log("   ✅ Tabla verificada/creada\n");
    } catch (e: any) {
      console.log("   ⚠️  Tabla ya existe o error:", e.message, "\n");
    }

    // ============================================
    // PASO 2: Actualizar/Crear materias
    // ============================================
    console.log("📚 Actualizando materias del Plan 2023...");

    const numeroToId = new Map<number, number>();

    for (const materiaData of MATERIAS_PLAN_2023) {
      let materia = await materiaRepo.findOne({
        where: { numero: materiaData.numero }
      });

      if (materia) {
        // Actualizar existente
        materia.nombre = materiaData.nombre;
        materia.nivel = materiaData.nivel;
        materia.duracion = materiaData.duracion;
        await materiaRepo.save(materia);
      } else {
        // Crear nueva
        materia = materiaRepo.create({
          numero: materiaData.numero,
          nombre: materiaData.nombre,
          nivel: materiaData.nivel,
          duracion: materiaData.duracion,
        });
        materia = await materiaRepo.save(materia);
      }

      numeroToId.set(materiaData.numero, materia.id);
      console.log(`   ${materiaData.numero}. ${materiaData.nombre} (ID: ${materia.id})`);
    }
    console.log(`   ✅ ${MATERIAS_PLAN_2023.length} materias procesadas\n`);

    // ============================================
    // PASO 3: Limpiar correlativas existentes
    // ============================================
    console.log("🗑️  Limpiando correlativas existentes...");
    await correlativaRepo.clear();
    console.log("   ✅ Correlativas limpiadas\n");

    // ============================================
    // PASO 4: Insertar correlativas del Plan 2023
    // ============================================
    console.log("🔗 Insertando correlativas del Plan 2023...");

    let totalCorrelativas = 0;

    for (const [numeroMateria, correlativas] of Object.entries(CORRELATIVAS_PLAN_2023)) {
      const materiaId = numeroToId.get(Number(numeroMateria));
      if (!materiaId) {
        console.log(`   ⚠️  Materia ${numeroMateria} no encontrada`);
        continue;
      }

      const materia = MATERIAS_PLAN_2023.find(m => m.numero === Number(numeroMateria));
      const tieneCorrelativas = correlativas.regularizadas.length > 0 || correlativas.aprobadas.length > 0;

      if (tieneCorrelativas) {
        console.log(`   ${numeroMateria}. ${materia?.nombre}`);
      }

      // Insertar correlativas regularizadas
      for (const numCorrelativa of correlativas.regularizadas) {
        const correlativaId = numeroToId.get(numCorrelativa);
        if (!correlativaId) {
          console.log(`      ⚠️  Correlativa ${numCorrelativa} no encontrada`);
          continue;
        }

        await correlativaRepo.save({
          materiaId,
          correlativaId,
          tipo: TipoCorrelativa.Regularizada,
        });
        totalCorrelativas++;

        const nombreCorrelativa = MATERIAS_PLAN_2023.find(m => m.numero === numCorrelativa)?.nombre;
        console.log(`      📝 Regularizada: ${nombreCorrelativa}`);
      }

      // Insertar correlativas aprobadas
      for (const numCorrelativa of correlativas.aprobadas) {
        const correlativaId = numeroToId.get(numCorrelativa);
        if (!correlativaId) {
          console.log(`      ⚠️  Correlativa ${numCorrelativa} no encontrada`);
          continue;
        }

        await correlativaRepo.save({
          materiaId,
          correlativaId,
          tipo: TipoCorrelativa.Aprobada,
        });
        totalCorrelativas++;

        const nombreCorrelativa = MATERIAS_PLAN_2023.find(m => m.numero === numCorrelativa)?.nombre;
        console.log(`      🎓 Aprobada: ${nombreCorrelativa}`);
      }
    }

    console.log(`\n   ✅ ${totalCorrelativas} correlativas insertadas\n`);

    // ============================================
    // PASO 5: Verificación final
    // ============================================
    console.log("🔍 Verificación final...");
    const totalMaterias = await materiaRepo.count();
    const totalCorrelativasDB = await correlativaRepo.count();
    console.log(`   📚 Materias: ${totalMaterias}`);
    console.log(`   🔗 Correlativas: ${totalCorrelativasDB}`);

    console.log("\n🚀 ¡Seed completado exitosamente!");

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    if (error.detail) console.error("   Detalle:", error.detail);
  } finally {
    await AppDataSource.destroy();
  }
}

main();
