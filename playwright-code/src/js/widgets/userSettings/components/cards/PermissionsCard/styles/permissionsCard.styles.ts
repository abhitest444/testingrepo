import styled from 'styled-components';
import { HeaderRow } from 'src/js/widgets/userSettings/components/styles/cards.styles';

/** Title row; tightens default header gap to 16px to sit closer to the sub-header (Figma). */
export const PermissionsCardHeaderRow = styled(HeaderRow)`
  margin-bottom: 16px;
`;

/** Subhead just under the card title (e.g. "Workforce access"). */
export const SectionSubHeader = styled.div`
  margin-bottom: 16px;
`;

/** Vertical stack used for the whole edit form. */
export const PermissionsForm = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
`;

/** A labeled section: bold field label on top, controls below. */
export const FormSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

/** Stack of checkboxes in the Timesheets / Company sections. */
export const CheckboxStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

/** Inline label row for a checkbox: text + trailing (?) help icon. */
export const CheckboxLabelRow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

/** Group of "View schedule" / "Manage schedule" rows, each with indented options. */
export const ScheduleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const ScheduleRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

/** Indents schedule radio sub-options to align with the checkbox label, not the checkbox. */
export const ScheduleSubOptions = styled.div`
  padding-left: 28px;
`;

export const EditFooter = styled.div`
  display: grid;
  grid-auto-flow: column;
  justify-content: end;
  gap: 12px;
  margin-top: 24px;
`;

/** View-mode 2-col summary grid (matches SchedulesCardView). */
export const PermissionsFieldsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px 24px;
`;

/** View-mode section: bold sub-header over a 2-column field grid. */
export const ViewSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;

  & + & {
    margin-top: 24px;
  }
`;

export const ViewSectionHeader = styled.div`
  /* Slight pull-down to avoid colliding with the previous section's row spacing. */
  margin-bottom: 0;
`;
