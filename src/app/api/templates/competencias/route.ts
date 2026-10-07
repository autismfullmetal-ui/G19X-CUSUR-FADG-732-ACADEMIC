import { NextResponse } from "next/server";

export async function GET() {
  const csvContent = [
    "nombre,descripcion,tipo",
    "React,Desarrollo de interfaces web reactivas y componentes frontend,TECNICA",
    "Docker,Contenerización de aplicaciones y despliegue continuo,TECNICA",
    "Negociación,Capacidad para alcanzar acuerdos y gestionar expectativas,BLANDA",
    "Pensamiento Crítico,Análisis objetivo de problemas y toma de decisiones basadas en evidencia,BLANDA",
    "Arquitectura Cloud,Diseño de sistemas escalables y resilientes en la nube,TECNICA",
  ].join("\r\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="plantilla_competencias.csv"',
    },
  });
}
