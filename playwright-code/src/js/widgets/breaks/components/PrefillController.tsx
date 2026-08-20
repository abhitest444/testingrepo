import React, { useEffect } from 'react';
import { Activity } from '@ids-ts/loader';
import styled from 'styled-components';
import {
  Payroll_DurationUnit,
  Payroll_Break,
  Common_DayOfWeek,
  Payroll_BreakPosition,
} from 'src/__generated__/oigql/graphql';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectBreakToEdit,
  selectIsCreateBreakOpen,
  selectIsEditBreakOpen,
} from '../store/uiSlice';
import {
  initializeFormData,
  setTempAssignments,
} from '../store/breakPolicyFormSlice';
import {
  BreakAssignment,
  selectBreakAssignmentsByPolicyId,
  selectBreakAssignmentsLoading,
} from '../store/breakAssignmentsSlice';
import { selectTeamMembers } from '../store/workerSlice';
import useBreakAssignmentsByBreakId from '../hooks/useBreakAssignmentsByBreakId';
import { TeamMember } from '../types';
import {
  BreakDaysOfWeek,
  BREAK_DAYS_TO_COMMON_DAYS_MAP,
  BREAK_LOCATIONS,
  DEFAULT_NOTIFY_DURATION,
} from '../constants';

const CenteredLoader = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100%;
`;

// Helper function to convert shiftThresholdLimit (minutes) to frequency (HH:MM format)
const convertThresholdToFrequency = (
  thresholdMinutes: number | null | undefined,
): string => {
  if (!thresholdMinutes) return '04:00';
  const hours = Math.floor(thresholdMinutes / 60);
  const minutes = thresholdMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}`;
};

// Helper function to map workDays array back to Common_DayOfWeek array
const mapWorkDaysToBreakDays = (
  workDays: Common_DayOfWeek[] | null | undefined,
): Common_DayOfWeek[] => {
  if (!workDays || workDays.length === 0) {
    return [
      Common_DayOfWeek.Monday,
      Common_DayOfWeek.Tuesday,
      Common_DayOfWeek.Wednesday,
      Common_DayOfWeek.Thursday,
      Common_DayOfWeek.Friday,
    ];
  }

  return workDays;
};

const PrefillController = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();
  const isEditBreakOpen = useAppSelector(selectIsEditBreakOpen);
  const breakToEdit = useAppSelector(selectBreakToEdit);
  const isCreateBreakOpen = useAppSelector(selectIsCreateBreakOpen);
  const teamMembers = useAppSelector(selectTeamMembers);
  const { getBreakAssignments } = useBreakAssignmentsByBreakId();

  // Get assignments for the current break rule
  const assignments = useAppSelector((state) =>
    breakToEdit?.id
      ? selectBreakAssignmentsByPolicyId(state, breakToEdit.id)
      : [],
  );

  const assignmentsLoading = useAppSelector(selectBreakAssignmentsLoading);

  useEffect(() => {
    if (isEditBreakOpen && breakToEdit) {
      // Map only essential fields from breakToEdit, use defaults for everything else
      const formDataFromBreak = {
        breakName: breakToEdit.breakName || '',
        breakDuration: breakToEdit.breakDuration,
        durationUnit: breakToEdit.durationUnit,
        breakType: breakToEdit.breakType,
        allowAuto: breakToEdit.allowAuto,
        allowManual: breakToEdit.allowManual,
        noSetDuration: breakToEdit.noSetDuration,
        // Map autoRule fields to form state only if allowAuto is true
        ...(breakToEdit.allowAuto
          ? {
              frequency: convertThresholdToFrequency(
                breakToEdit.autoRule?.shiftThresholdLimit,
              ),
              repeatEvery: breakToEdit.autoRule?.repeatBreak,
              daysOfWeek: mapWorkDaysToBreakDays(
                breakToEdit.autoRule?.workDays,
              ),
              breakLocation: (() => {
                if (
                  breakToEdit.autoRule?.breakPosition ===
                  Payroll_BreakPosition.Start
                )
                  return BREAK_LOCATIONS.START;
                if (
                  breakToEdit.autoRule?.breakPosition ===
                  Payroll_BreakPosition.End
                )
                  return BREAK_LOCATIONS.END;
                if (
                  breakToEdit.autoRule?.breakPosition ===
                  Payroll_BreakPosition.Specific
                )
                  return BREAK_LOCATIONS.SPECIFIC;
                return BREAK_LOCATIONS.MIDDLE;
              })(),
              specificTime: breakToEdit.autoRule?.specificTime,
              autoRule: breakToEdit.autoRule,
            }
          : {}),
        // Map manualRule fields to form state only if allowManual is true
        ...(breakToEdit.allowManual
          ? {
              autoEndBreak: breakToEdit.manualRule?.autoEndBreak,
              cantEndEarly: !breakToEdit.manualRule?.allowEarlyEndBreak,
              notify: breakToEdit.manualRule?.breakEndingReminder,
              notifyDuration:
                breakToEdit.manualRule?.breakEndingReminderTime ||
                DEFAULT_NOTIFY_DURATION,
              manualRule: breakToEdit.manualRule,
            }
          : {}),
      };

      dispatch(initializeFormData(formDataFromBreak));

      // Fetch assignments for the break rule and update tempAssignments
      if (breakToEdit.id) {
        getBreakAssignments(breakToEdit.id);
      }
    }
  }, [isEditBreakOpen, breakToEdit, dispatch, getBreakAssignments]);

  // Effect to update tempAssignments when assignments are loaded
  useEffect(() => {
    if (breakToEdit?.id && !assignmentsLoading) {
      // Create tempAssignments with all team members, setting isActive based on existing assignments
      // const allTeamMembersWithActiveStatus: TeamMember[] = teamMembers.map((member) => {
      //   const existingAssignment = assignments.find(
      //     (assignment) => assignment.assignee.id === member.id,
      //   );
      //   return {
      //     ...member,
      //     isActive: existingAssignment ? existingAssignment.isActive : false,
      //   };
      // });

      const assignmentsMap = new Map<string, BreakAssignment>();
      assignments.forEach((assignment) => {
        assignmentsMap.set(assignment.assignee.id, assignment);
      });

      const allTeamMembersWithActiveStatus: TeamMember[] = teamMembers.map(
        (member) => {
          const existingAssignment = assignmentsMap.get(member.id);

          return {
            ...member,
            // If existingAssignment is found, use its isActive, otherwise default to false
            isActive: existingAssignment?.isActive || false,
          };
        },
      );

      dispatch(setTempAssignments(allTeamMembersWithActiveStatus));
    }
  }, [breakToEdit?.id, teamMembers, assignments, assignmentsLoading, dispatch]);

  useEffect(() => {
    if (isCreateBreakOpen) {
      // Initialize with all team members having isActive: true (all selected by default)
      const allTeamMembersWithActiveStatus: TeamMember[] = teamMembers.map(
        (member) => ({
          ...member,
          isActive: true,
        }),
      );
      dispatch(setTempAssignments(allTeamMembersWithActiveStatus));
    }
  }, [isCreateBreakOpen, dispatch, teamMembers]);

  if (assignmentsLoading) {
    return (
      <CenteredLoader>
        <Activity shape="dots" />
      </CenteredLoader>
    );
  }
  return <>{children}</>;
};

export default PrefillController;
