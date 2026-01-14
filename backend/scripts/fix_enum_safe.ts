
import { DataSource } from "typeorm";
import dotenv from "dotenv";

dotenv.config();

// Una conexión temporal sin entidades ni sincronización, solo para ejecutar SQL crudo
const TempDataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    synchronize: false,
    logging: true,
    extra: {
        ssl: {
            rejectUnauthorized: false
        }
    }
});

async function forceEnumUpdate() {
    console.log("🛠️ Iniciando reparación de ENUM (Modo Seguro)...");
    try {
        await TempDataSource.initialize();
        console.log("✅ Conectado. Ejecutando ALTER TYPE...");

        // Intentar agregar 'quick_task'
        try {
            await TempDataSource.query(`ALTER TYPE recordatorios_tipo_enum ADD VALUE 'quick_task'`);
            console.log("✅ 'quick_task' agregado exitosamente.");
        } catch (e: any) {
            console.log(`ℹ️ 'quick_task': ${e.message}`);
        }

        // Intentar agregar 'General'
        try {
            await TempDataSource.query(`ALTER TYPE recordatorios_tipo_enum ADD VALUE 'General'`);
            console.log("✅ 'General' agregado exitosamente.");
        } catch (e: any) {
            console.log(`ℹ️ 'General': ${e.message}`);
        }

    } catch (error) {
        console.error("❌ Error crítico:", error);
    } finally {
        if (TempDataSource.isInitialized) {
            await TempDataSource.destroy();
        }
        process.exit(0);
    }
}

forceEnumUpdate();
