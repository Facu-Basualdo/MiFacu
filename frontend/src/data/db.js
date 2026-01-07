// src/data/db.js

// Estado inicial con horarios precargados para testear
let MATERIAS_DB = [
    // NIVEL 1
    { id: 1, nombre: "Análisis Mat. I", nivel: 1, estado: "aprobada", dia: 'LU', hora: 18, duracion: 4, aula: '301' },
    { id: 2, nombre: "Álgebra y Geom.", nivel: 1, estado: "aprobada", dia: 'MA', hora: 14, duracion: 4, aula: '302' },
    { id: 3, nombre: "Física I", nivel: 1, estado: "aprobada", dia: 'MI', hora: 8, duracion: 4, aula: 'Lab B' },
    
    // NIVEL 2 (Las que estás cursando ahora)
    { id: 9, nombre: "Análisis Mat. II", nivel: 2, estado: "cursando", dia: 'LU', hora: 18, duracion: 3, aula: 'Aula 404' },
    { id: 10, nombre: "Física II", nivel: 2, estado: "cursando", dia: 'MI', hora: 19, duracion: 3, aula: 'Lab Física' },
    { id: 14, nombre: "Análisis Sist.", nivel: 2, estado: "cursando", dia: 'JU', hora: 18, duracion: 4, aula: 'Aula 205' },
    { id: 4, nombre: "Algoritmos y ED", nivel: 1, estado: "regularizada", dia: 'VI', hora: 14, duracion: 4, aula: 'Lab 1' },
  ];
  
  // Función para obtener todas
  export const getMaterias = () => MATERIAS_DB;
  
  // Función para actualizar una materia (Cambiar horario)
  export const updateMateria = (id, nuevosDatos) => {
    const index = MATERIAS_DB.findIndex(m => m.id === Number(id));
    if (index !== -1) {
      MATERIAS_DB[index] = { ...MATERIAS_DB[index], ...nuevosDatos };
      return true;
    }
    return false;
  };
  
  // Función para buscar por ID
  export const getMateriaById = (id) => MATERIAS_DB.find(m => m.id === Number(id));