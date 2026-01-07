# Docker Setup para MiFacu

Este directorio contiene la configuración de Docker para dockerizar el backend de MiFacu.

## Requisitos Previos

- Docker instalado
- Docker Compose instalado

## Configuración

1. **Crear archivo `.env` en el backend** (si no existe):
   ```bash
   cd ../backend
   # Si no tienes .env, crea uno basado en el ejemplo
   # O copia desde Docker/.env.example
   ```

2. **Configurar variables de entorno** en `../backend/.env`:
   ```env
   # URL de conexión a Supabase (obligatorio)
   DATABASE_URL=postgresql://postgres:password@db.tu-proyecto.supabase.co:5432/postgres
   
   # Credenciales de Supabase (opcional)
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_KEY=tu-supabase-key-aqui
   
   # Puerto del servidor (opcional, por defecto 4000)
   PORT=4000
   
   # Entorno
   NODE_ENV=production
   ```

   **⚠️ IMPORTANTE:** 
   - El archivo `.env` debe estar en `backend/.env`
   - No subas el archivo `.env` a Git (ya está en .gitignore)
   - Si usas Supabase, obtén la `DATABASE_URL` desde el panel de Supabase (Settings > Database > Connection string)

## Uso

### Construir y levantar los servicios

```bash
cd Docker
docker-compose up -d --build
```

### Ver logs

```bash
docker-compose logs -f backend
```

### Detener los servicios

```bash
docker-compose down
```

### Detener y eliminar volúmenes (si usas PostgreSQL local)

```bash
docker-compose down -v
```

### Reconstruir solo el backend

```bash
docker-compose build backend
docker-compose up -d backend
```

## Servicios

### Backend
- **Puerto**: 4000
- **URL**: http://localhost:4000
- **Health Check**: http://localhost:4000/

### PostgreSQL (Opcional)
Si descomentas el servicio de PostgreSQL en `docker-compose.yml`:
- **Puerto**: 5432
- **Usuario por defecto**: mifacu
- **Contraseña por defecto**: mifacu123
- **Base de datos**: mifacu

## Desarrollo

Para desarrollo local sin Docker, usa:

```bash
cd ../backend
npm run dev
```

## Troubleshooting

### El backend no inicia
1. Verifica que las variables de entorno estén correctas
2. Revisa los logs: `docker-compose logs backend`
3. Verifica que el puerto 4000 no esté en uso

### Problemas de conexión a la base de datos
1. Si usas Supabase, verifica que la URL y la key sean correctas
2. Si usas PostgreSQL local, asegúrate de que el servicio esté corriendo
3. Verifica que la variable `DATABASE_URL` tenga el formato correcto

### Reconstruir desde cero
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```
