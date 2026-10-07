import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import AdminRhDashboard from "@/components/dashboard/AdminRhDashboard";
import SupervisorDashboard from "@/components/dashboard/SupervisorDashboard";
import EmployeeDashboard from "@/components/dashboard/EmployeeDashboard";

export default async function DashboardPage() {
  const session = await requireSession();
  const role = session.user.role;

  // 1. VISTA ADMINISTRADOR Y RECURSOS HUMANOS (RF-023, RF-024)
  if (role === "ADMIN" || role === "RH") {
    const [
      totalEmployees,
      activeEmployees,
      departmentsCount,
      positionsCount,
      evaluatedEmployees,
      totalGaps,
      superadasGaps,
      totalApplications,
      totalPlans,
      activeOpportunities,
      planStatusCounts,
      topRequirements,
      openGaps,
      recentApplications,
    ] = await Promise.all([
      db.employee.count(),
      db.employee.count({ where: { status: "ACTIVO" } }),
      db.department.count(),
      db.position.count(),
      db.employee.count({
        where: {
          OR: [{ evaluations: { some: {} } }, { competencies: { some: {} } }],
        },
      }),
      db.gap.count(),
      db.gap.count({ where: { status: "SUPERADA" } }),
      db.application.count(),
      db.developmentPlan.count(),
      db.opportunity.count({ where: { status: "PUBLICADA" } }),
      db.developmentPlan.groupBy({
        by: ["status"],
        _count: { id: true },
      }),
      db.opportunityRequirement.groupBy({
        by: ["competencyId"],
        _count: { opportunityId: true },
        _avg: { requiredLevel: true },
        orderBy: { _count: { opportunityId: "desc" } },
        take: 6,
      }),
      db.gap.findMany({
        where: { status: "ABIERTA" },
        include: { requirement: { include: { competency: true } } },
      }),
      db.application.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
          employee: true,
          opportunity: true,
          gaps: true,
          plan: { select: { id: true } },
        },
      }),
    ]);

    // Competencias para nombres de gráfica
    const competencyIds = topRequirements.map((r) => r.competencyId);
    const comps = await db.competency.findMany({
      where: { id: { in: competencyIds } },
      select: { id: true, name: true },
    });
    const compMap = new Map(comps.map((c) => [c.id, c.name]));

    const demandChartData = topRequirements.map((req) => ({
      name: compMap.get(req.competencyId) ?? `Comp. ${req.competencyId}`,
      demanda: req._count.opportunityId,
      nivelPromedio: Number((req._avg.requiredLevel ?? 3).toFixed(1)),
    }));

    // Distribución de planes
    const statusMap = new Map(planStatusCounts.map((p) => [p.status, p._count.id]));
    const planStatusData = [
      { name: "Aprobados", value: statusMap.get("APROBADO") ?? 0, color: "#3b82f6" },
      { name: "En Progreso", value: statusMap.get("EN_PROGRESO") ?? 0, color: "#8b5cf6" },
      { name: "Completados", value: statusMap.get("COMPLETADO") ?? 0, color: "#10b981" },
      { name: "Borrador/Propuesto", value: (statusMap.get("BORRADOR") ?? 0) + (statusMap.get("PROPUESTO") ?? 0), color: "#94a3b8" },
    ];

    // Brechas por competencia
    const gapCountMap = new Map<string, number>();
    for (const g of openGaps) {
      const cName = g.requirement.competency.name;
      gapCountMap.set(cName, (gapCountMap.get(cName) ?? 0) + 1);
    }
    const gapsByCompetencyData = Array.from(gapCountMap.entries())
      .map(([name, brechas]) => ({ name, brechas }))
      .sort((a, b) => b.brechas - a.brechas)
      .slice(0, 5);

    const evalCoveragePercent =
      totalEmployees > 0 ? Math.round((evaluatedEmployees / totalEmployees) * 100) : 0;
    const gapClosureRate =
      totalGaps > 0 ? Math.round((superadasGaps / totalGaps) * 100) : 0;
    const planAdoptionRate =
      totalApplications > 0 ? Math.round((totalPlans / totalApplications) * 100) : 0;

    return (
      <AdminRhDashboard
        userName={session.user.name ?? "Usuario"}
        role={role}
        metrics={{
          totalEmployees,
          activeEmployees,
          departmentsCount,
          positionsCount,
          evalCoveragePercent,
          evaluatedCount: evaluatedEmployees,
          gapClosureRate,
          superadasGapsCount: superadasGaps,
          totalGapsCount: totalGaps,
          planAdoptionRate,
          totalPlansCount: totalPlans,
          totalApplicationsCount: totalApplications,
          activeOpportunitiesCount: activeOpportunities,
        }}
        demandChartData={demandChartData}
        planStatusData={planStatusData}
        gapsByCompetencyData={gapsByCompetencyData}
        recentApplications={recentApplications.map((app) => ({
          id: app.id,
          employeeName: `${app.employee.firstName} ${app.employee.lastName}`,
          opportunityTitle: app.opportunity.title,
          compatibility: app.compatibility,
          gapsCount: app.gaps.length,
          hasPlan: Boolean(app.plan),
          createdAt: app.createdAt.toLocaleDateString("es-MX"),
        }))}
      />
    );
  }

  // 2. VISTA SUPERVISOR (RF-023, RF-024)
  if (role === "SUPERVISOR") {
    const supervisorEmployee = await db.employee.findUnique({
      where: { userId: Number(session.user.id) },
    });

    const teamMembers = supervisorEmployee
      ? await db.employee.findMany({
          where: { supervisorId: supervisorEmployee.id },
          include: {
            department: true,
            position: true,
            competencies: true,
            plans: {
              where: { status: { in: ["APROBADO", "EN_PROGRESO", "COMPLETADO"] } },
              include: { activities: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        })
      : [];

    const teamMemberIds = teamMembers.map((m) => m.id);

    const [pendingDeliverables, teamGaps] = await Promise.all([
      db.planActivity.findMany({
        where: {
          status: "ENTREGADA",
          plan: { employeeId: { in: teamMemberIds } },
        },
        include: {
          plan: {
            include: {
              employee: true,
              application: { include: { opportunity: true } },
            },
          },
        },
        orderBy: { submittedAt: "desc" },
        take: 5,
      }),
      db.gap.findMany({
        where: { application: { employeeId: { in: teamMemberIds } } },
      }),
    ]);

    const teamGapsSuperadas = teamGaps.filter((g) => g.status === "SUPERADA").length;
    const teamGapsAbiertas = teamGaps.filter((g) => g.status !== "SUPERADA").length;

    // Calcular progreso por colaborador
    let totalProgressSum = 0;
    const processedTeamMembers = teamMembers.map((m) => {
      const activePlan = m.plans[0];
      let planProgress = 0;
      if (activePlan && activePlan.activities.length > 0) {
        const completed = activePlan.activities.filter((a) => a.status === "COMPLETADA").length;
        planProgress = Math.round((completed / activePlan.activities.length) * 100);
      }
      totalProgressSum += planProgress;

      return {
        id: m.id,
        name: `${m.firstName} ${m.lastName}`,
        position: m.position.title,
        department: m.department.name,
        activePlanTitle: activePlan ? activePlan.title : null,
        planProgress,
        competenciesCount: m.competencies.length,
      };
    });

    const teamAvgPlanProgress =
      teamMembers.length > 0 ? Math.round(totalProgressSum / teamMembers.length) : 0;

    const gapDistributionData = [
      { name: "Superadas", value: teamGapsSuperadas, color: "#10b981" },
      { name: "En Desarrollo", value: teamGapsAbiertas, color: "#f59e0b" },
    ];

    return (
      <SupervisorDashboard
        userName={session.user.name ?? "Supervisor"}
        teamMetrics={{
          totalTeamMembers: teamMembers.length,
          pendingReviewsCount: pendingDeliverables.length,
          teamAvgPlanProgress,
          teamGapsSuperadas,
          teamGapsAbiertas,
        }}
        teamMembers={processedTeamMembers}
        pendingDeliverables={pendingDeliverables.map((item) => ({
          activityId: item.id,
          activityTitle: item.description,
          employeeName: `${item.plan.employee.firstName} ${item.plan.employee.lastName}`,
          planTitle: item.plan.title,
          deliverable: item.deliverable,
          evidenceUrl: item.evidenceUrl,
          submittedAt: item.submittedAt
            ? item.submittedAt.toLocaleDateString("es-MX")
            : "Reciente",
        }))}
        gapDistributionData={gapDistributionData}
      />
    );
  }

  // 3. VISTA EMPLEADO / COLABORADOR (RF-023)
  const employee = await db.employee.findUnique({
    where: { userId: Number(session.user.id) },
    include: {
      department: true,
      position: true,
      supervisor: true,
    },
  });

  if (!employee) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-zinc-900">Bienvenido, {session.user.name}</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Tu cuenta de usuario no está asociada a una ficha de empleado activa. Comunícate con Recursos Humanos.
        </p>
      </div>
    );
  }

  const [activePlan, employeeCompetencies, gaps, applications, availableOpportunities] =
    await Promise.all([
      db.developmentPlan.findFirst({
        where: {
          employeeId: employee.id,
          status: { in: ["APROBADO", "EN_PROGRESO", "COMPLETADO"] },
        },
        include: {
          activities: { orderBy: { order: "asc" } },
          application: { include: { opportunity: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      db.employeeCompetency.findMany({
        where: { employeeId: employee.id },
        include: { competency: true },
        orderBy: { level: "desc" },
      }),
      db.gap.findMany({
        where: { application: { employeeId: employee.id } },
      }),
      db.application.findMany({
        where: { employeeId: employee.id },
        include: { opportunity: true, gaps: true },
        orderBy: { createdAt: "desc" },
        take: 4,
      }),
      db.opportunity.findMany({
        where: {
          status: "PUBLICADA",
          applications: { none: { employeeId: employee.id } },
        },
        take: 3,
        orderBy: { createdAt: "desc" },
      }),
    ]);

  let planProgress = 0;
  let completedActivities = 0;
  let totalActivities = 0;
  const pendingActivities: {
    id: number;
    order: number;
    description: string;
    deliverable: string | null;
    status: string;
  }[] = [];

  if (activePlan) {
    totalActivities = activePlan.activities.length;
    completedActivities = activePlan.activities.filter((a) => a.status === "COMPLETADA").length;
    planProgress =
      totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

    for (const a of activePlan.activities) {
      if (a.status === "PENDIENTE" || a.status === "EN_PROGRESO") {
        pendingActivities.push({
          id: a.id,
          order: a.order,
          description: a.description,
          deliverable: a.deliverable,
          status: a.status,
        });
      }
    }
  }

  const gapsSuperadas = gaps.filter((g) => g.status === "SUPERADA").length;

  const competenciesChartData = employeeCompetencies.map((ec) => ({
    name: ec.competency.name,
    nivel: ec.level,
  }));

  const avgCompetencyLevel =
    employeeCompetencies.length > 0
      ? employeeCompetencies.reduce((acc, curr) => acc + curr.level, 0) /
        employeeCompetencies.length
      : 0;

  return (
    <EmployeeDashboard
      userName={employee.firstName}
      employeeInfo={{
        position: employee.position.title,
        department: employee.department.name,
        supervisorName: employee.supervisor
          ? `${employee.supervisor.firstName} ${employee.supervisor.lastName}`
          : null,
      }}
      metrics={{
        planTitle: activePlan ? activePlan.title : null,
        planStatus: activePlan ? activePlan.status : null,
        planProgress,
        completedActivities,
        totalActivities,
        gapsSuperadas,
        gapsTotales: gaps.length,
        applicationsCount: applications.length,
        avgCompetencyLevel,
      }}
      competenciesChartData={competenciesChartData}
      pendingActivities={pendingActivities.slice(0, 3)}
      recentApplications={applications.map((app) => ({
        id: app.id,
        opportunityTitle: app.opportunity.title,
        compatibility: app.compatibility,
        status: app.status,
        gapsCount: app.gaps.length,
      }))}
      availableOpportunities={availableOpportunities.map((opp) => ({
        id: opp.id,
        title: opp.title,
        type: opp.type,
        vacancies: opp.vacancies,
        deadline: opp.deadline ? opp.deadline.toLocaleDateString("es-MX") : null,
      }))}
    />
  );
}
