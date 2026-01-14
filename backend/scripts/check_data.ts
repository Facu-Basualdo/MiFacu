
import { AppDataSource } from "../src/config/DataSource";

async function checkData() {
    console.log("🔍 Consultando tabla recordatorios...");
    try {
        await AppDataSource.initialize();

        const result = await AppDataSource.query(`SELECT * FROM recordatorios ORDER BY id DESC LIMIT 5`);
        console.log("📊 Últimos 5 recordatorios encontrados:");
        console.table(result);

    } catch (error) {
        console.error("❌ Error consultando DB:", error);
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
    }
}

checkData();
