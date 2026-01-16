import { DataSource } from "typeorm";
import dotenv from "dotenv";
import { Materia } from "../models/materias.model";
import { Recordatorio } from "../models/recordatorios.model";
import { Final } from "../models/finales.model";
import { UsuarioMateria } from "../models/usuario-materias.model";
import { User } from "../models/user.model";
import { Link } from "../models/links.model";

dotenv.config();

export const AppDataSource = new DataSource({
    type: "postgres",
    url: process.env.DATABASE_URL,
    synchronize: false, // Desactivado para evitar errores de duplicación de Enums y conflictos con migraciones manuales
    // Usa migraciones o el script de seed para actualizar el esquema
    logging: process.env.NODE_ENV === 'development',
    entities: [Materia, Recordatorio, Final, UsuarioMateria, User, Link],
    extra: {
        ssl: {
            rejectUnauthorized: false // Requerido para la conexión con Supabase
        }
    },
    subscribers: [],
    migrations: [],
});
