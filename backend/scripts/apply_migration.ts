
import { AppDataSource } from "../src/config/DataSource";

async function runMigration() {
    console.log("🔄 Conectando a Supabase para aplicar migración...");
    try {
        await AppDataSource.initialize();
        console.log("✅ Conexión exitosa. Ejecutando cambios de esquema...");

        // Ejecutar las consultas SQL de forma secuencial
        const queries = [
            `ALTER TABLE recordatorios ALTER COLUMN materia_id DROP NOT NULL;`,
            `ALTER TABLE recordatorios ALTER COLUMN fecha DROP NOT NULL;`,
            `ALTER TABLE recordatorios ALTER COLUMN hora DROP NOT NULL;`,
            `ALTER TABLE recordatorios ALTER COLUMN color DROP NOT NULL;`,
            `DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recordatorios' AND column_name='descripcion') THEN
                    ALTER TABLE recordatorios ADD COLUMN descripcion TEXT;
                END IF;
            END
            $$;`
        ];

        for (const query of queries) {
            console.log(`⏳ Ejecutando: ${query.substring(0, 50)}...`);
            await AppDataSource.query(query);
        }

        console.log("✨ ¡Migración aplicada correctamente! Ahora Quick Tasks funcionará en Supabase.");
    } catch (error) {
        console.error("❌ Error durante la migración:", error);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
        process.exit(0);
    }
}

runMigration();
