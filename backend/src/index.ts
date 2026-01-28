import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import 'reflect-metadata';
import { AppDataSource } from './config/DataSource';
import { errorHandler } from './middleware/errorHandler.middleware';

dotenv.config();

import recordatoriosRoutes from './routes/recordatorios.routes';
import finalesRoutes from './routes/finales.routes';
import materiasRoutes from './routes/materias.routes';
import usuarioMateriasRoutes from './routes/usuario-materias.routes';
import syncRoutes from './routes/sync.routes';
import linksRoutes from './routes/links.routes';
import correlativasRoutes from './routes/correlativas.routes';
import calificacionesCatedrasRoutes from './routes/calificaciones-catedras.routes';

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json());

// Routes
app.use("/materias", materiasRoutes);
app.use("/recordatorios", recordatoriosRoutes);
app.use("/finales", finalesRoutes);
app.use("/usuario-materias", usuarioMateriasRoutes);
app.use("/sync", syncRoutes);
app.use("/links", linksRoutes);
app.use("/correlativas", correlativasRoutes);
app.use("/calificaciones-catedras", calificacionesCatedrasRoutes);

app.get('/', (req, res) => {
    res.status(200).send('MiFacu Backend is running');
});

// Error handler
app.use(errorHandler);

// Inicializar base de datos y servidor
const startServer = async () => {
    if (!process.env.DATABASE_URL) {
        console.error('\n❌ ERROR: DATABASE_URL no está configurada');
        process.exit(1);
    }

    try {
        await AppDataSource.initialize();
        console.log("✅ Data Source has been initialized!");

        app.listen(port, () => {
            console.log(`✅  Servidor corriendo en: http://localhost:${port}`);
        });
    } catch (error: any) {
        console.error('\n❌ ERROR durante la inicialización:', error.message);
    }
};

startServer();
