import { AppDataSource } from "../config/DataSource";
import { Materia } from "../models/materias.model";

async function main() {
  try {
    await AppDataSource.initialize();
    console.log("✅ Conectado a la base de datos\n");

    const repo = AppDataSource.getRepository(Materia);

    // Obtener todas las materias
    const todas = await repo.find({ order: { numero: 'ASC' } });

    // Filtrar las que están fuera del plan (no tienen número del 1-36)
    const fueraDePlan = todas.filter(m => !m.numero || m.numero < 1 || m.numero > 36);

    console.log(`📊 Total materias: ${todas.length}`);
    console.log(`✅ En el Plan 2023: ${todas.length - fueraDePlan.length}`);
    console.log(`❌ Fuera del plan: ${fueraDePlan.length}\n`);

    if (fueraDePlan.length > 0) {
      console.log("Eliminando materias fuera del plan:\n");

      for (const m of fueraDePlan) {
        console.log(`   ❌ ${m.nombre} (ID: ${m.id}, numero: ${m.numero || 'null'})`);

        // Eliminar referencias primero (finales, recordatorios, usuario_materias, correlativas)
        await AppDataSource.query(`DELETE FROM finales WHERE materia_id = $1`, [m.id]);
        await AppDataSource.query(`DELETE FROM recordatorios WHERE materia_id = $1`, [m.id]);
        await AppDataSource.query(`DELETE FROM usuario_materias WHERE materia_id = $1`, [m.id]);
        await AppDataSource.query(`DELETE FROM correlativas WHERE materia_id = $1 OR correlativa_id = $1`, [m.id]);
        await AppDataSource.query(`DELETE FROM correlativas_detalle WHERE materia_id = $1 OR correlativa_id = $1`, [m.id]);

        // Ahora eliminar la materia
        await repo.delete(m.id);
      }

      const restantes = await repo.count();
      console.log(`\n✅ Materias restantes: ${restantes}`);
    } else {
      console.log("✅ No hay materias para eliminar.");
    }

  } catch (error: any) {
    console.error("❌ Error:", error.message);
  } finally {
    await AppDataSource.destroy();
  }
}

main();
