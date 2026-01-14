
import { AppDataSource } from "../src/config/DataSource";

async function updateEnum() {
    console.log("🔄 Actualizando ENUM en Supabase...");
    try {
        await AppDataSource.initialize();

        // Postgres no permite "IF NOT EXISTS" en ALTER TYPE ADD VALUE directamente en todas las versiones de forma simple en una transacción bloqueante, 
        // pero podemos intentarlo o capturar el error si ya existe.

        try {
            await AppDataSource.query(`ALTER TYPE recordatorios_tipo_enum ADD VALUE 'quick_task'`);
            console.log("✅ Valor 'quick_task' agregado.");
        } catch (e: any) {
            console.log("ℹ️ 'quick_task' ya existe o error:", e.message);
        }

        try {
            await AppDataSource.query(`ALTER TYPE recordatorios_tipo_enum ADD VALUE 'General'`);
            console.log("✅ Valor 'General' agregado.");
        } catch (e: any) {
            console.log("ℹ️ 'General' ya existe o error:", e.message);
        }

        console.log("✨ Enum actualizado.");
    } catch (error) {
        console.error("❌ Error conectando a DB:", error);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
        process.exit(0);
    }
}

updateEnum();
