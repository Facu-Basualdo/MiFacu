const { Client } = require('pg');
require('dotenv').config();

const UNIVERSITY = { nombre: "Universidad Nacional del Nordeste", abreviatura: "UNNE" };
const CAREER = { nombre: "Diseño Gráfico" };

const DURACION = {
    Anual: 'Anual',
    C1: 'Cuatrimestral',
    C2: 'Cuatrimestral',
    Trimestral: 'Trimestral'
};

const MATERIAS = [
    { n: 1, name: "Curso de ingreso", l: "I", d: DURACION.C1 },
    { n: 2, name: "Sistemas de Representación", l: "I", d: DURACION.Anual },
    { n: 3, name: "Morfología I", l: "I", d: DURACION.Anual },
    { n: 4, name: "Tipografía I", l: "I", d: DURACION.Anual },
    { n: 5, name: "Taller de Diseño Gráfico I", l: "I", d: DURACION.Anual },
    { n: 6, name: "Medios de Expresión I", l: "I", d: DURACION.Anual },
    { n: 7, name: "Comunicación I", l: "I", d: DURACION.Anual },
    { n: 8, name: "Introducción al Diseño", l: "I", d: DURACION.Anual },

    { n: 9, name: "Morfología II", l: "II", d: DURACION.Anual },
    { n: 10, name: "Tipografía II", l: "II", d: DURACION.Anual },
    { n: 11, name: "Taller de Diseño Gráfico II", l: "II", d: DURACION.Anual },
    { n: 12, name: "Medios de Expresión II", l: "II", d: DURACION.Anual },
    { n: 13, name: "Tecnología I", l: "II", d: DURACION.Anual },
    { n: 14, name: "Historia del Diseño Gráfico I", l: "II", d: DURACION.Anual },
    { n: 15, name: "Comunicación II", l: "II", d: DURACION.Anual },

    { n: 16, name: "Taller de Diseño Gráfico III", l: "III", d: DURACION.Anual },
    { n: 17, name: "Tecnología II", l: "III", d: DURACION.Anual },
    { n: 18, name: "Marketing y Gestión", l: "III", d: DURACION.Anual },
    { n: 19, name: "Historia del Diseño Gráfico II", l: "III", d: DURACION.Anual },
    { n: 20, name: "Sociología de la Comunicación", l: "III", d: DURACION.Anual },
    { n: 21, name: "Introducción al Diseño Web [Optativa 1A]", l: "III", d: DURACION.C1 },
    { n: 22, name: "Historia del Arte [Optativa 1B]", l: "III", d: DURACION.C1 },
    { n: 23, name: "Introducción a la gestión [Optativa 1B]", l: "III", d: DURACION.C1 },
    { n: 24, name: "Tecnologías aplicadas al arte [Optativa 1B]", l: "III", d: DURACION.C1 },

    { n: 25, name: "Proyecto Final de Carrera", l: "IV", d: DURACION.Anual },
    { n: 26, name: "Práctica Profesional Asistida", l: "IV", d: DURACION.Anual },
    { n: 27, name: "Gestión de Proyectos y Emprendimientos", l: "IV", d: DURACION.Anual },
    { n: 28, name: "Competencias Discursivas", l: "IV", d: DURACION.Anual },
    { n: 29, name: "Metodología de la Ciencia", l: "IV", d: DURACION.Anual },
    { n: 30, name: "Organización y Ejercicio Profesional", l: "IV", d: DURACION.Anual },
    { n: 31, name: "Fotografía [Optativa 2A]", l: "IV", d: DURACION.C1 },
    { n: 32, name: "Sociología de la imagen [Optativa 2B]", l: "IV", d: DURACION.C1 },
    { n: 33, name: "Usina del hábitat [Optativa 2B]", l: "IV", d: DURACION.C1 },
    { n: 34, name: "Realización Audiovisual [Optativa 2A]", l: "IV", d: DURACION.C1 },
    { n: 35, name: "Gestión y edición publicaciones [Optativa 2A]", l: "IV", d: DURACION.C1 },
    { n: 36, name: "Semiótica [Optativa 2B]", l: "IV", d: DURACION.C1 },
    { n: 37, name: "Comunicación y turismo [Optativa 2B]", l: "IV", d: DURACION.C1 },
    { n: 38, name: "Estética [Optativa 2B]", l: "IV", d: DURACION.C1 },
];

// Helper to expand "X Año completo"
const NIVEL_1 = [1, 2, 3, 4, 5, 6, 7, 8];
const NIVEL_2 = [9, 10, 11, 12, 13, 14, 15];

const CORRELATIVAS = [
    // NIVEL 1
    // 5. Taller I -> Ingreso (Cursar)
    { m: 5, r: 1, t: 'regularizada' },

    // NIVEL 2
    // 9. Morfología II -> Sist. Rep e Morf I (Aprobada)
    { m: 9, r: 2, t: 'aprobada' },
    { m: 9, r: 3, t: 'aprobada' },
    // 10. Tipografía II -> Tip I (Aprobada)
    { m: 10, r: 4, t: 'aprobada' },
    // 11. Taller II -> Tip I y Taller I (Aprobada)
    { m: 11, r: 4, t: 'aprobada' },
    { m: 11, r: 5, t: 'aprobada' },
    // 12. Medios II -> Medios I (Reg p/cursar, Aprob p/rendir)
    { m: 12, r: 6, t: 'regularizada' }, // Cursar
    { m: 12, r: 6, t: 'aprobada' },     // Rendir
    // 13. Tecnología I -> Medios I (Regularizada p/rendir)
    { m: 13, r: 6, t: 'regularizada' }, // Rendir (Wait, rule: "Para Rendir: Tener regularizada Medios I")
    // 15. Comunicación II -> Comunicación I (Reg p/cursar, Aprob p/rendir)
    { m: 15, r: 7, t: 'regularizada' },
    { m: 15, r: 7, t: 'aprobada' },

    // NIVEL 3
    // 16. Taller III -> 1º Año completo (aprob) + DG II (aprob), Tip II (aprob), Morf II (aprob) + Com II (reg)
    ...NIVEL_1.map(num => ({ m: 16, r: num, t: 'aprobada' })),
    { m: 16, r: 10, t: 'aprobada' },
    { m: 16, r: 9, t: 'aprobada' },
    { m: 16, r: 11, t: 'aprobada' },
    { m: 16, r: 15, t: 'regularizada' },

    // 17. Tecnología II -> Tec I y Medios II (Reg p/cursar, Aprob p/rendir)
    { m: 17, r: 13, t: 'regularizada' },
    { m: 17, r: 12, t: 'regularizada' },
    { m: 17, r: 13, t: 'aprobada' },
    { m: 17, r: 12, t: 'aprobada' },

    // 18. Marketing -> Com II e Hist I (Reg p/cursar, Aprob p/rendir)
    { m: 18, r: 15, t: 'regularizada' },
    { m: 18, r: 14, t: 'regularizada' },
    { m: 18, r: 15, t: 'aprobada' },
    { m: 18, r: 14, t: 'aprobada' },

    // 19. Historia II -> Hist I (Reg p/cursar, Aprob p/rendir) + Com II (reg p/rendir)
    { m: 19, r: 14, t: 'regularizada' }, // Cursar
    { m: 19, r: 14, t: 'aprobada' },     // Rendir
    { m: 19, r: 15, t: 'regularizada' }, // Rendir

    // 20. Sociología -> Com II e Hist I (Reg p/cursar, Aprob p/rendir)
    { m: 20, r: 15, t: 'regularizada' },
    { m: 20, r: 14, t: 'regularizada' },
    { m: 20, r: 15, t: 'aprobada' },
    { m: 20, r: 14, t: 'aprobada' },

    // 21. Optativa 1A -> 1º Año completo
    ...NIVEL_1.map(num => ({ m: 21, r: num, t: 'aprobada' })),

    // 22. Historia del Arte -> Taller II e Hist I (aprob) + Hist II (reg)
    { m: 22, r: 11, t: 'aprobada' },
    { m: 22, r: 14, t: 'aprobada' },
    { m: 22, r: 19, t: 'regularizada' },

    // 23, 24. Optativas 1B -> 1º Año completo
    ...NIVEL_1.map(num => ({ m: 23, r: num, t: 'aprobada' })),
    ...NIVEL_1.map(num => ({ m: 24, r: num, t: 'aprobada' })),

    // NIVEL 4
    // 25. PFC -> 2º Año completo + Taller III (aprob) + Marketing y Socio Com (Reg p/cursar, Aprob p/rendir)
    ...NIVEL_2.map(num => ({ m: 25, r: num, t: 'aprobada' })),
    { m: 25, r: 16, t: 'aprobada' },
    { m: 25, r: 18, t: 'regularizada' },
    { m: 25, r: 20, t: 'regularizada' },
    { m: 25, r: 18, t: 'aprobada' },
    { m: 25, r: 20, t: 'aprobada' },

    // 26. PPA -> 2º Año completo + Taller III (aprob)
    ...NIVEL_2.map(num => ({ m: 26, r: num, t: 'aprobada' })),
    { m: 26, r: 16, t: 'aprobada' },

    // 27. Gestión -> 1º Año compl + Taller II (aprob) + Com II (Reg p/cursar, Aprob p/rendir)
    ...NIVEL_1.map(num => ({ m: 27, r: num, t: 'aprobada' })),
    { m: 27, r: 11, t: 'aprobada' },
    { m: 27, r: 15, t: 'regularizada' },
    { m: 27, r: 15, t: 'aprobada' },

    // 28. Discursivas -> 2º Año compl + Com II (Reg p/cursar, Aprob p/rendir)
    ...NIVEL_2.map(num => ({ m: 28, r: num, t: 'aprobada' })),
    { m: 28, r: 15, t: 'regularizada' },
    { m: 28, r: 15, t: 'aprobada' },

    // 29. Metodología -> 2º Año compl + Taller III (aprob)
    ...NIVEL_2.map(num => ({ m: 29, r: num, t: 'aprobada' })),
    { m: 29, r: 16, t: 'aprobada' },

    // 30. Org Profesional -> 2º Año compl + Marketing (Reg p/cursar, Aprob p/rendir)
    ...NIVEL_2.map(num => ({ m: 30, r: num, t: 'aprobada' })),
    { m: 30, r: 18, t: 'regularizada' },
    { m: 30, r: 18, t: 'aprobada' },

    // 31. Fotografía -> 1º Año compl + Taller III, Medios II, Morfo II, Com II (aprob) + Tec II (reg)
    ...NIVEL_1.map(num => ({ m: 31, r: num, t: 'aprobada' })),
    { m: 31, r: 16, t: 'aprobada' },
    { m: 31, r: 12, t: 'aprobada' },
    { m: 31, r: 9, t: 'aprobada' },
    { m: 31, r: 15, t: 'aprobada' },
    { m: 31, r: 17, t: 'regularizada' },

    // 32. Sociología Imagen -> Socio Com (Reg)
    { m: 32, r: 20, t: 'regularizada' },

    // 33-38 -> 2º Año completo
    ...NIVEL_2.map(num => ({ m: 33, r: num, t: 'aprobada' })),
    ...NIVEL_2.map(num => ({ m: 34, r: num, t: 'aprobada' })),
    ...NIVEL_2.map(num => ({ m: 35, r: num, t: 'aprobada' })),
    ...NIVEL_2.map(num => ({ m: 36, r: num, t: 'aprobada' })),
    ...NIVEL_2.map(num => ({ m: 37, r: num, t: 'aprobada' })),
    ...NIVEL_2.map(num => ({ m: 38, r: num, t: 'aprobada' })),
];

async function seed() {
    console.log("🌱 Comienzo de Seed (Diseño Gráfico - UNNE)...");
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        // 1. Universidad
        const unneRes = await client.query(
            "INSERT INTO universidades (nombre, abreviatura) VALUES ($1, $2) ON CONFLICT (nombre) DO UPDATE SET abreviatura = EXCLUDED.abreviatura RETURNING id",
            [UNIVERSITY.nombre, UNIVERSITY.abreviatura]
        );
        const univId = unneRes.rows[0].id;

        // 2. Carrera
        const dgRes = await client.query(
            "INSERT INTO carreras (universidad_id, nombre) VALUES ($1, $2) ON CONFLICT (universidad_id, nombre) DO UPDATE SET nombre = EXCLUDED.nombre RETURNING id",
            [univId, CAREER.nombre]
        );
        const dgId = dgRes.rows[0].id;

        console.log(`📍 Universidad: UNNE (ID: ${univId}), Carrera: Diseño Gráfico (ID: ${dgId})`);

        // 3. Materias
        const numToId = {};
        for (const m of MATERIAS) {
            const mRes = await client.query(
                "INSERT INTO materias (carrera_id, numero, nombre, nivel, duración) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (carrera_id, numero) DO UPDATE SET nombre = EXCLUDED.nombre, nivel = EXCLUDED.nivel, duración = EXCLUDED.duración RETURNING id",
                [dgId, m.n, m.name, m.l, m.d]
            );
            numToId[m.n] = mRes.rows[0].id;
        }
        console.log(`✅ ${MATERIAS.length} materias procesadas.`);

        // 4. Correlativas
        let count = 0;
        for (const corr of CORRELATIVAS) {
            const mId = numToId[corr.m];
            const rId = numToId[corr.r];
            if (mId && rId) {
                await client.query(
                    "INSERT INTO correlativas_detalle (materia_id, correlativa_id, tipo) VALUES ($1, $2, $3) ON CONFLICT (materia_id, correlativa_id, tipo) DO NOTHING",
                    [mId, rId, corr.t]
                );
                count++;
            }
        }
        console.log(`✅ ${count} correlativas procesadas.`);

        console.log("🏁 Seed finalizado exitosamente.");
    } catch (e) {
        console.error("❌ Error en seed:", e);
    } finally {
        await client.end();
        process.exit(0);
    }
}

seed();
