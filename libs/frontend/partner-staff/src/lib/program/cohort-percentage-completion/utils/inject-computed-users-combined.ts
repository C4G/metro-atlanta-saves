import { computed, inject, Injector } from '@angular/core';
import { UsersOnProgramsStore } from '@mas/frontend-shared-data-access';
import { RequirementsStore } from '../../requirements/requirements.store';

export const injectComputedUsersCombined = (injector = inject(Injector)) => {
  const usersOnProgramsStore = injector.get(UsersOnProgramsStore);
  const requirementsStore = injector.get(RequirementsStore);

  return computed(() => {
    const users = usersOnProgramsStore.users();
    const requirementsLength = requirementsStore.requirements().length;

    return users.map((user) => {
      const totalRequirements = requirementsLength ?? 0;
      const completedRequirements = user.requirementStatus?.length ?? 0;
      const percentageCompleted =
        totalRequirements > 0 ? Math.round((completedRequirements / totalRequirements) * 100) : 0;
      const percentageOutstanding = 100 - percentageCompleted;
      return {
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        percentageCompleted: percentageCompleted,
        percentageOutstanding: percentageOutstanding,
      };
    });
  });
};
