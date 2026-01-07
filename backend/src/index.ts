import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import 'reflect-metadata';
import { AppDataSource } from './config/DataSource';
import { errorHandler } from './middleware/errorHandler.middleware';

import recordatoriosRoutes from './routes/recordatorios.routes';
import finalesRoutes from './routes/finales.routes';
import materiasRoutes from './routes/materias.routes';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/materias", materiasRoutes);
app.use("/recordatorios", recordatoriosRoutes);
app.use("/finales", finalesRoutes);

// Health check - Endpoint raíz con mensaje visual
app.get('/', (req, res) => {
    const htmlResponse = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MiFacu Backend - Estado del Servidor</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 40px;
            max-width: 600px;
            width: 100%;
            text-align: center;
        }
        .status-icon {
            width: 80px;
            height: 80px;
            background: #10b981;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        .status-icon::before {
            content: '✓';
            color: white;
            font-size: 48px;
            font-weight: bold;
        }
        h1 {
            color: #1f2937;
            font-size: 32px;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #6b7280;
            font-size: 18px;
            margin-bottom: 30px;
        }
        .status-badge {
            display: inline-block;
            background: #10b981;
            color: white;
            padding: 8px 20px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 30px;
        }
        .info-section {
            background: #f9fafb;
            border-radius: 12px;
            padding: 20px;
            margin-top: 30px;
            text-align: left;
        }
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #e5e7eb;
        }
        .info-item:last-child {
            border-bottom: none;
        }
        .info-label {
            color: #6b7280;
            font-weight: 500;
        }
        .info-value {
            color: #1f2937;
            font-weight: 600;
        }
        .endpoints {
            margin-top: 30px;
            text-align: left;
        }
        .endpoints h3 {
            color: #1f2937;
            margin-bottom: 15px;
            font-size: 18px;
        }
        .endpoint-item {
            background: #f3f4f6;
            padding: 12px;
            border-radius: 8px;
            margin-bottom: 8px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #374151;
        }
        .footer {
            margin-top: 30px;
            color: #9ca3af;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="status-icon"></div>
        <h1>🚀 MiFacu Backend</h1>
        <p class="subtitle">Servidor corriendo correctamente</p>
        <span class="status-badge">ONLINE</span>
        
        <div class="info-section">
            <div class="info-item">
                <span class="info-label">Estado:</span>
                <span class="info-value" style="color: #10b981;">✓ Operativo</span>
            </div>
            <div class="info-item">
                <span class="info-label">Puerto:</span>
                <span class="info-value">${port}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Entorno:</span>
                <span class="info-value">${process.env.NODE_ENV || 'development'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Base de Datos:</span>
                <span class="info-value">${AppDataSource.isInitialized ? '✓ Conectada' : '⏳ Conectando...'}</span>
            </div>
        </div>

        <div class="endpoints">
            <h3>📡 Endpoints Disponibles:</h3>
            <div class="endpoint-item">GET / - Estado del servidor</div>
            <div class="endpoint-item">GET /materias - Listar materias</div>
            <div class="endpoint-item">GET /recordatorios - Listar recordatorios</div>
            <div class="endpoint-item">POST /recordatorios - Crear recordatorio</div>
            <div class="endpoint-item">GET /finales - Listar finales</div>
            <div class="endpoint-item">POST /finales - Crear final</div>
        </div>

        <div class="footer">
            <p>MiFacu Backend API v1.0.0</p>
            <p style="margin-top: 5px;">Tiempo de actividad: ${process.uptime().toFixed(0)}s</p>
        </div>
    </div>
</body>
</html>
    `;
    
    res.send(htmlResponse);
});

// Error handler (debe ir al final)
app.use(errorHandler);

// Inicializar base de datos y servidor
const startServer = async () => {
    // Verificar que DATABASE_URL esté configurada
    if (!process.env.DATABASE_URL) {
        console.error('\n❌ ERROR: DATABASE_URL no está configurada');
        console.error('Por favor, configura DATABASE_URL en tu archivo .env');
        console.error('Ejemplo: DATABASE_URL=postgresql://user:password@host:port/database\n');
        process.exit(1);
    }

    try {
        await AppDataSource.initialize();
        console.log("✅ Data Source has been initialized!");

        app.listen(port, () => {
            console.log('\n' + '='.repeat(60));
            console.log('🚀  MiFacu Backend - Servidor Iniciado Correctamente');
            console.log('='.repeat(60));
            console.log(`✅  Servidor corriendo en: http://localhost:${port}`);
            console.log(`📊  Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log(`💾  Base de datos: ${AppDataSource.isInitialized ? '✓ Conectada' : '⏳ Conectando...'}`);
            console.log(`📡  Endpoints disponibles:`);
            console.log(`    - GET  http://localhost:${port}/ - Estado del servidor`);
            console.log(`    - GET  http://localhost:${port}/materias - Listar materias`);
            console.log(`    - GET  http://localhost:${port}/recordatorios - Listar recordatorios`);
            console.log(`    - POST http://localhost:${port}/recordatorios - Crear recordatorio`);
            console.log(`    - GET  http://localhost:${port}/finales - Listar finales`);
            console.log(`    - POST http://localhost:${port}/finales - Crear final`);
            console.log('='.repeat(60) + '\n');
        });
    } catch (error: any) {
        console.error('\n❌ ERROR durante la inicialización del Data Source:');
        if (error.code === 'ECONNREFUSED') {
            console.error('   No se pudo conectar a la base de datos.');
            console.error('   Verifica que:');
            console.error('   1. DATABASE_URL esté correctamente configurada en .env');
            console.error('   2. La base de datos esté accesible desde el contenedor');
            console.error('   3. Si usas Supabase, verifica la URL de conexión');
        } else {
            console.error('   Detalles:', error.message);
        }
        console.error('\n');
        // No hacer exit(1) para que el contenedor siga corriendo y puedas ver los logs
        // process.exit(1);
    }
};

startServer();
