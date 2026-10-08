export const normalizeRole = (role) => {
  if (!role) return 'operator';
  const r = role.toLowerCase();
  if (r === 'super_admin' || r === 'superadmin' || r === 'sa') return 'super_admin';
  if (r === 'admin' || r === 'plant_admin') return 'admin';
  if (r === 'manager' || r === 'plant_manager' || r === 'plantmanager') return 'manager';
  if (r === 'operator') return 'operator';
  return r;
};

export const getRolePath = (role) => {
  const norm = normalizeRole(role);
  switch (norm) {
    case 'super_admin':
      return '/super-admin';
    case 'admin':
      return '/admin';
    case 'manager':
      return '/plant-manager';
    case 'operator':
      return '/operator';
    default:
      return '/operator';
  }
};

export const getRoleName = (role) => {
  const norm = normalizeRole(role);
  switch (norm) {
    case 'super_admin':
      return 'Super Admin';
    case 'admin':
      return 'Plant Admin';
    case 'manager':
      return 'Plant Manager';
    case 'operator':
      return 'Operator';
    default:
      return 'User';
  }
};

export const ROLE_CONFIG = {
  super_admin: {
    id: 'super_admin',
    name: 'Super Admin',
    path: '/super-admin',
    loginPath: '/login/super-admin',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    themeColor: 'purple',
    description: 'Full platform-wide authority, multi-plant management, & global RBAC control',
    defaultEmail: 'superadmin@safeops.io',
  },
  admin: {
    id: 'admin',
    name: 'Plant Admin',
    path: '/admin',
    loginPath: '/login/admin',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    themeColor: 'indigo',
    description: 'Single plant facility administration, team invitation, & hazard zone setup',
    defaultEmail: 'marcus.brody@alpha-energy.com',
  },
  manager: {
    id: 'manager',
    name: 'Plant Manager',
    path: '/plant-manager',
    loginPath: '/login/plant-manager',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    themeColor: 'blue',
    description: 'Operational shift monitoring, zone hazard schedules, & team oversight',
    defaultEmail: 'sarah.c@alpha-energy.com',
  },
  operator: {
    id: 'operator',
    name: 'Operator',
    path: '/operator',
    loginPath: '/login/operator',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
    themeColor: 'slate',
    description: 'Real-time AI camera stream monitoring & read-only safety observation',
    defaultEmail: 'dave.b@alpha-energy.com',
  },
};
