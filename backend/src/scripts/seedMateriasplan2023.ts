import { AppDataSource } from "../config/DataSource";
import { Materia } from "../models/materias.model";
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

async function main() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Database connected");

    const materiaRepo = AppDataSource.getRepository(Materia);

    console.log("🔄 Actualizando materias del Plan 2023...\n");

    for (const materiaData of MATERIAS_PLAN_2023) {
      // Buscar si existe por numero o por nombre similar
      let materia = await materiaRepo.findOne({
        where: { numero: materiaData.numero }
      });

      if (!materia) {
        // Buscar por nombre similar
        const todas = await materiaRepo.find();
        materia = todas.find(m =>
          m.nombre?.toLowerCase().includes(materiaData.nombre.toLowerCase().split(' ')[0]) ||
          materiaData.nombre.toLowerCase().includes(m.nombre?.toLowerCase().split(' ')[0] || '')
        ) || null;
      }

      if (materia) {
        // Actualizar existente
        materia.numero = materiaData.numero;
        materia.nombre = materiaData.nombre;
        materia.nivel = materiaData.nivel;
        materia.duracion = materiaData.duracion;
        await materiaRepo.save(materia);
        console.log(`📝 Actualizada: ${materiaData.numero}. ${materiaData.nombre}`);
      } else {
        // Crear nueva
        const nueva = materiaRepo.create({
          numero: materiaData.numero,
          nombre: materiaData.nombre,
          nivel: materiaData.nivel,
          duracion: materiaData.duracion,
        });
        await materiaRepo.save(nueva);
        console.log(`✨ Creada: ${materiaData.numero}. ${materiaData.nombre}`);
      }
    }

    console.log("\n✅ Materias actualizadas correctamente!");
    console.log("\n📋 Verificando materias:");

    const todasMaterias = await materiaRepo.find({ order: { numero: 'ASC' } });
    console.log(`   Total: ${todasMaterias.length} materias\n`);

    todasMaterias.forEach(m => {
      console.log(`   ${m.numero || '?'}. ${m.nombre} (Nivel ${m.nivel})`);
    });

  } catch (error: any) {
    console.error("❌ Error:", error.message);
  } finally {
    await AppDataSource.destroy();
  }
}

main();
