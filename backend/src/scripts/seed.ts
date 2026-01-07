import { AppDataSource } from "../config/DataSource";
import { Materia } from "../models/materias.model";
import { Recordatorio } from "../models/recordatorios.model";
import { Final } from "../models/finales.model";
import { Duración } from "../types/materias";
import { TipoRecordatorio } from "../types/recordatorios";

async function main() {
    try {
        await AppDataSource.initialize();
        console.log("Database connected for seeding...");

        // 1. Create Materias
        const materiaRepo = AppDataSource.getRepository(Materia);

        // Check if data exists
        const count = await materiaRepo.count();
        if (count > 0) {
            console.log("⚠️  Data already exists, skipping seed.");
            process.exit(0);
        }

        console.log("🌱 Seeding Materias...");

        const m1 = new Materia();
        m1.nombre = "Matemática Discreta";
        m1.nivel = "I";
        m1.duracion = Duración.Cuatrimestral1;
        await materiaRepo.save(m1);

        const m2 = new Materia();
        m2.nombre = "Programación I";
        m2.nivel = "I";
        m2.duracion = Duración.Anual;
        await materiaRepo.save(m2);

        const m3 = new Materia();
        m3.nombre = "Sistemas Operativos";
        m3.nivel = "II";
        m3.duracion = Duración.Cuatrimestral2;
        await materiaRepo.save(m3);

        console.log("✅ Materias inserted");

        // 2. Create Recordatorios
        console.log("🌱 Seeding Recordatorios...");
        const recRepo = AppDataSource.getRepository(Recordatorio);

        const r1 = new Recordatorio();
        r1.nombre = "Parcial 1";
        r1.materiaId = m1.id;
        r1.materia = m1;
        r1.tipo = TipoRecordatorio.Parcial;
        r1.fecha = new Date("2026-05-15");
        r1.hora = "18:00:00"; // Formato time string
        r1.color = "#FF5733";
        r1.notificado = false;
        await recRepo.save(r1);

        const r2 = new Recordatorio();
        r2.nombre = "TP Final";
        r2.materiaId = m2.id;
        r2.materia = m2;
        r2.tipo = TipoRecordatorio.Entrega;
        r2.fecha = new Date("2026-11-20");
        r2.hora = "23:59:00";
        r2.color = "#33FF57";
        r2.notificado = false;
        await recRepo.save(r2);

        console.log("✅ Recordatorios inserted");

        // 3. Create Finales
        console.log("🌱 Seeding Finales...");
        const finalRepo = AppDataSource.getRepository(Final);

        const f1 = new Final();
        f1.materiaId = m1.id;
        f1.materia = m1;
        f1.fecha = new Date("2026-07-10");
        f1.hora = "09:00:00";
        f1.color = "#3357FF";
        f1.notificado = false;
        await finalRepo.save(f1);

        console.log("✅ Finales inserted");
        console.log("🚀 Seed completed successfully!");

    } catch (error: any) {
        console.error("Error seeding data:", error.message);
        if (error.code) console.error("Error Code:", error.code);
    } finally {
        await AppDataSource.destroy();
    }
}

main();
