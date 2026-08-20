import React, { useMemo } from 'react';
import { Menu, MenuItem } from '@ids-ts/menu';
import { useIntl } from '@payroll/quicksand';
import { TimeForAssignment } from 'src/js/service/types/assignmentTypes';
import { highlightSearchText } from 'src/js/widgets/quickFind/utils/dropdownHelpers';
import { MentionMeta, MentionStatusRow } from './MentionMenu.styled';

export interface MentionMenuProps {
  open: boolean;
  /** Element the menu positions itself against (the textarea wrapper). */
  anchorElement: React.ReactElement;
  workers: TimeForAssignment[];
  loading: boolean;
  /** The current "@query" text, used to bold matching substrings. */
  query: string;
  /** Index of the keyboard-highlighted worker. */
  highlightIndex: number;
  onSelect: (worker: TimeForAssignment) => void;
  onClose: () => void;
}

// A worker's display label, falling back to fullName then the raw id so a row
// always renders something selectable.
const labelFor = (w: TimeForAssignment): string =>
  w.displayName?.trim() || w.fullName?.trim() || w.timeForContactDAS.id;

/**
 * The @-mention suggestion list. A thin presentation layer over the IDS `Menu`
 * anchored beneath the post textarea: it renders the assigned workers returned
 * by the search, bolds the matched substring, and surfaces loading / empty
 * states. All list state (query, highlight, selection) is owned by the parent
 * composer so the textarea's keyboard handling drives the menu.
 */
const MentionMenu: React.FC<MentionMenuProps> = ({
  open,
  anchorElement,
  workers,
  loading,
  query,
  highlightIndex,
  onSelect,
  onClose,
}) => {
  const intl = useIntl();

  const items = useMemo(
    () =>
      workers.map((w, i) => {
        const label = labelFor(w);
        const type =
          w.timeForType === 'VENDOR'
            ? intl.formatMessage({
                id: 'timeProject.posts.mention.vendor',
                defaultMessage: 'Contractor',
              })
            : undefined;
        return (
          <MenuItem
            // eslint-disable-next-line react/no-array-index-key
            key={`${w.timeForContactDAS.id}-${i}`}
            value={label}
            size="medium"
            highlighted={i === highlightIndex}
            onClick={() => onSelect(w)}
            data-testid="post-mention-item"
          >
            <span>
              {highlightSearchText(label, query)}
              {type && <MentionMeta>{type}</MentionMeta>}
            </span>
          </MenuItem>
        );
      }),
    [workers, highlightIndex, query, onSelect, intl],
  );

  if (!open) return null;

  const hasResults = workers.length > 0;
  // Menu requires at least one child element. When there are no rows to show,
  // render a single disabled status row (loading spinner copy / empty state)
  // so the popover still positions and the user gets feedback.
  const statusRow = loading
    ? intl.formatMessage({
        id: 'timeProject.posts.mention.loading',
        defaultMessage: 'Searching…',
      })
    : intl.formatMessage({
        id: 'timeProject.posts.mention.empty',
        defaultMessage: 'No matching people',
      });

  return (
    <Menu
      open
      anchorElement={anchorElement}
      position="bottom"
      alignment="left"
      menuOffsetDistance={4}
      autoFocus={false}
      disableSearch
      highlightIndex={highlightIndex}
      minWidth={260}
      onClose={onClose}
      onClickAway={onClose}
      aria-label={intl.formatMessage({
        id: 'timeProject.posts.mention.menuLabel',
        defaultMessage: 'Tag a person',
      })}
      data-testid="post-mention-menu"
    >
      {hasResults ? (
        items
      ) : (
        <MenuItem disabled value="__status__" size="medium">
          <MentionStatusRow data-testid="post-mention-status">
            {statusRow}
          </MentionStatusRow>
        </MenuItem>
      )}
    </Menu>
  );
};

export default MentionMenu;
