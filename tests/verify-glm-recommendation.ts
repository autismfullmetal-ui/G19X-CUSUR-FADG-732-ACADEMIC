import 'dotenv/config';
import { generateAiRecommendation, formatActivityFullText } from '../src/lib/ai';

async function main() {
  console.log('Testing generateAiRecommendation with real GLM Coding Plan...');
  const result = await generateAiRecommendation({
    employee: 'Carlos Mendoza',
    position: 'Desarrollador Junior',
    department: 'Tecnología',
    opportunity: 'Desarrollador FullStack Senior',
    opportunityType: 'PUESTO',
    vacancies: 2,
    openDate: '2026-09-01',
    deadline: '2026-11-30',
    gaps: [
      {
        competency: 'Python',
        description: 'Desarrollo backend y arquitecturas de microservicios',
        type: 'TECNICA',
        currentLevel: 2,
        requiredLevel: 4,
        mandatory: true,
      },
      {
        competency: 'Liderazgo y Gestión de Equipos',
        description: 'Facilitación y dirección de squads técnicos',
        type: 'BLANDA',
        currentLevel: 1,
        requiredLevel: 3,
        mandatory: false,
      }
    ]
  });

  console.log('\n--- RESULTADO DE LA IA ---');
  console.log('Origen:', result.source);
  console.log('Modelo:', result.modelVersion);
  console.log('Recomendación general:\n', result.text);
  console.log('\nActividades desglosadas (' + result.activities.length + '):');
  for (const act of result.activities) {
    console.log(`\n[Actividad #${act.orden}]`);
    console.log('  Fase:        ', act.fase);
    console.log('  Título:      ', act.titulo);
    console.log('  Descripción: ', act.descripcion);
    console.log('  Herramientas:', act.herramientas);
    console.log('  Entregable:  ', act.entregable);
    console.log('  Criterio:    ', act.criterio);
    console.log('  Texto Plano: ', formatActivityFullText(act));
  }
}

main().catch(console.error);
