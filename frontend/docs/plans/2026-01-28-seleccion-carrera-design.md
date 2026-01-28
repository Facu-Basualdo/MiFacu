# Diseño: Selección de Carrera (Onboarding & Perfil) 🏛️

**Fecha:** 2026-01-28  
**Estado:** Brainstorming 🧠

## Contexto
El usuario desea que al iniciar sesión por primera vez (o al entrar como invitado), se le presente un modal "iOS Premium" para seleccionar su carrera. Esto establece el contexto de la aplicación (materias, horarios, repositorio).

## Objetivos
1. Implementar un flujo de "Selección de Carrera" obligatorio al primer inicio.
2. Diseño Premium (Navy & Gold, estética iOS).
3. Permitir el cambio de carrera desde la pantalla de Perfil.
4. Soporte para múltiples universidades y carreras en el futuro.

## Estructura de Datos
- **Universidades (Mock):** UTN (FRRE - Chaco), + futuras.
- **Carreras (Mock):** Ingeniería en Sistemas de Información, + futuras.

## Flujos
### A. Primer Inicio (Onboarding)
- [ ] Verificar si el usuario tiene una carrera asignada.
- [ ] Mostrar modal si no hay carrera.
- [ ] Guardar selección en Supabase (Auth) o AsyncStorage (Invitado).

### B. Gestión en Perfil
- [ ] Mostrar carrera actual en la pantalla de Perfil.
- [ ] Botón "Cambiar Carrera".
- [ ] Reutilizar el componente de selección.

---

*Iteración 1: Comprendiendo los requisitos técnicos...*
