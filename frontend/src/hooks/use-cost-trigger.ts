// ============================================
// Caiso - Cost Trigger Hook (alinhado ao costs.store)
// ============================================

import { useCallback } from 'react';
import {
  useCostsStore,
  type CostCriterion,
  type CostEntry,
  type CostTriggerAction,
} from '@/stores/costs.store';

export {
  COST_TRIGGER_ACTIONS,
  STUDENT_TRIGGER_ACTIONS,
  INSTRUCTOR_TRIGGER_ACTIONS,
  getCostTriggerLabel,
} from '@/lib/cost-trigger-actions';

export interface TriggerContext {
  studentId?: string;
  classId?: string;
  courseId?: string;
  companyId?: string;
  studentExtraProductIds?: string[];
  instructorId?: string;
  examNumber?: string;
  examName?: string;
}

export function useCostTrigger() {
  const costCriteria = useCostsStore((s) => s.costCriteria);
  const triggerAutomaticCosts = useCostsStore((s) => s.triggerAutomaticCosts);

  const triggerCosts = useCallback(
    (
      action: CostTriggerAction,
      context: TriggerContext,
      criteria: CostCriterion[] = costCriteria
    ): CostEntry[] => {
      const matchingCriteria = criteria.filter(
        (c) => c.active && (c.triggers ?? []).includes(action)
      );

      if (matchingCriteria.length === 0) {
        return [];
      }

      return triggerAutomaticCosts(action, {
        studentId: context.studentId,
        classId: context.classId,
        courseId: context.courseId,
        companyId: context.companyId,
        studentExtraProductIds: context.studentExtraProductIds,
        instructorId: context.instructorId,
        examNumber: context.examNumber,
        examName: context.examName,
      });
    },
    [costCriteria, triggerAutomaticCosts]
  );

  const wouldTriggerCosts = useCallback(
    (action: CostTriggerAction, criteria: CostCriterion[] = costCriteria) => {
      return criteria.filter((c) => c.active && (c.triggers ?? []).includes(action));
    },
    [costCriteria]
  );

  return {
    triggerCosts,
    wouldTriggerCosts,
    isTriggering: false,
  };
}
