import { AbilityBuilder, AbilityClass, ExtractSubjectType, PureAbility } from '@casl/ability';

export type Actions = 'manage' | 'read' | 'create' | 'delete' | 'update';
export type Subjects = 'bookings' | 'membership' | 'users' | 'all';

export type AppAbility = PureAbility<[Actions, Subjects]>;

type RolePermissions = {
  [key in Actions]?: Subjects[];
};

type Permissions = {
  [key: string]: RolePermissions;
};

const predefinedPermissions: Permissions = {
  USER: {
    manage: ['bookings'],
    read: ['membership', 'users'],
    create: ['membership]
    update: ['membership'],
  },
  ADMIN: {
    manage: ['membership'],
    delete: ['bookings']
    read: ['users'],
  },
  SUPERADMIN: {
    manage: ['users'],
  },
};

export function defineAbilitiesFor(role: string) {
  const { can, build } = new AbilityBuilder<AppAbility>(PureAbility as AbilityClass<AppAbility>);

  // Get the permissions for the given role
  const permissions = predefinedPermissions[role] || {};

  Object.keys(permissions).forEach((action) => {
    (permissions[action as Actions] as Subjects[]).forEach((subject) => {
      can(action as Actions, subject as ExtractSubjectType<Subjects>);
    });
  });

  return build();
}
