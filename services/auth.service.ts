export type DemoRole = "GERENCIA" | "SUPERVISOR" | "TECNICO" | "ADMIN";

export type DemoUser = {
  name: string;
  email: string;
  role: DemoRole;
};

const storageKey = "wu-eam-demo-user";

const demoUsers: Record<DemoRole, DemoUser> = {
  GERENCIA: {
    name: "Gerencia Liguria",
    email: "gerencia@liguria.demo",
    role: "GERENCIA",
  },
  SUPERVISOR: {
    name: "Supervisor Mantenimiento",
    email: "supervisor@liguria.demo",
    role: "SUPERVISOR",
  },
  TECNICO: {
    name: "Técnico de Planta",
    email: "tecnico@liguria.demo",
    role: "TECNICO",
  },
  ADMIN: {
    name: "Administrador Proyecto WU",
    email: "admin@liguria.demo",
    role: "ADMIN",
  },
};

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function getDemoRoles() {
  return Object.keys(demoUsers) as DemoRole[];
}

export function getDefaultDemoUser(): DemoUser {
  return demoUsers.ADMIN;
}

export function getDemoUser(): DemoUser {
  if (!canUseStorage()) {
    return getDefaultDemoUser();
  }

  const stored = window.localStorage.getItem(storageKey);

  if (!stored) {
    return getDefaultDemoUser();
  }

  try {
    const parsed = JSON.parse(stored) as DemoUser;
    return parsed.role in demoUsers ? parsed : getDefaultDemoUser();
  } catch {
    return getDefaultDemoUser();
  }
}

export function loginDemo(role: DemoRole) {
  const user = demoUsers[role];

  if (canUseStorage()) {
    window.localStorage.setItem(storageKey, JSON.stringify(user));
  }

  return user;
}

export function logoutDemo() {
  if (canUseStorage()) {
    window.localStorage.removeItem(storageKey);
  }
}

export function getHomePathForRole(role: DemoRole) {
  if (role === "GERENCIA") return "/gerencia";
  if (role === "SUPERVISOR") return "/supervisor";
  if (role === "TECNICO") return "/tecnico";
  return "/dashboard";
}
