const { Client } = require('pg');
require('dotenv').config({ path: '../.env' });

async function migrate() {
    console.log("🚀 Iniciando migración de 'Duración'...");

    if (!process.env.DATABASE_URL) {
        console.error("❌ Error: DATABASE_URL no está definida en .env");
        process.exit(1);
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // 0. Add new values to ENUM type
        // Note: 'ALTER TYPE ... ADD VALUE' cannot run inside a transaction block. 
        console.log("🔄 Agregando valor 'Cuatrimestral' al enum...");
        try {
            await client.query(`ALTER TYPE "materias_duración_enum" ADD VALUE IF NOT EXISTS 'Cuatrimestral'`);
            console.log("✅ Agregado valor 'Cuatrimestral'.");
        } catch (e) {
            console.log(`ℹ️ Nota sobre 'Cuatrimestral': ${e.message}`);
        }

        console.log("🔄 Agregando valor 'Trimestral' al enum...");
        try {
            await client.query(`ALTER TYPE "materias_duración_enum" ADD VALUE IF NOT EXISTS 'Trimestral'`);
            console.log("✅ Agregado valor 'Trimestral'.");
        } catch (e) {
            console.log(`ℹ️ Nota sobre 'Trimestral': ${e.message}`);
        }

        // 1. Update 'Primer Cuatrimestre' -> 'Cuatrimestral'
        const res1 = await client.query(`
            UPDATE materias 
            SET duración = 'Cuatrimestral' 
            WHERE duración = 'Primer Cuatrimestre'
        `);
        console.log(`✅ Actualizadas ${res1.rowCount} materias de 'Primer Cuatrimestre' a 'Cuatrimestral'.`);

        // 2. Update 'Segundo Cuatrimestre' -> 'Cuatrimestral'
        const res2 = await client.query(`
            UPDATE materias 
            SET duración = 'Cuatrimestral' 
            WHERE duración = 'Segundo Cuatrimestre'
        `);
        console.log(`✅ Actualizadas ${res2.rowCount} materias de 'Segundo Cuatrimestre' a 'Cuatrimestral'.`);

        console.log("🏁 Migración finalizada exitosamente.");

    } catch (e) {
        console.error("❌ Error en migración:", e);
    } finally {
        await client.end();
        process.exit(0);
    }
}

migrate();
