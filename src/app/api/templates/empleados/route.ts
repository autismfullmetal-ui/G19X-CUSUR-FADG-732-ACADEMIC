import { NextResponse } from "next/server";

export async function GET() {
  const csvContent = [
    "nombre,apellidos,email,departamento,puesto,rol,supervisor_email",
    "Carlos,Mendoza,carlos.mendoza@demo.mx,Sistemas,Desarrollador,EMPLEADO,sergio.ponce@demo.mx",
    "Laura,Gomez,laura.gomez@demo.mx,Recursos Humanos,Analista,RH,",
    "Mateo,Rios,mateo.rios@demo.mx,Finanzas,Contador,EMPLEADO,",
    "Diana,Salazar,diana.salazar@demo.mx,Sistemas,Arquitecto de Software,SUPERVISOR,",
  ].join("\r\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="plantilla_empleados.csv"',
    },
  });
}
