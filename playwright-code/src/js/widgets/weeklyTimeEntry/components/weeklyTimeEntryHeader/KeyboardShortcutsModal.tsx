import React from 'react';
import { useIntl } from '@payroll/quicksand';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
} from '@ids-ts/modal-dialog';
import { B2, B3 } from '@ids-ts/typography';
import styled from 'styled-components';

// Detect operating system for cross-platform keyboard shortcuts
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

const ShortcutsList = styled.div`
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  justify-content: space-between;
  padding: 20px 0;
`;

const ShortcutRow = styled.div`
  display: flex;
  gap: 24px;
  justify-content: space-between !important;
`;

const ShortcutKey = styled(B2)`
  padding: 2px 8px;
  min-width: 120px;
  display: inline-block;
`;

const StyledModalContent = styled(ModalContent)`
  & > span {
    text-align: left !important;
  }
`;

export interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

const shortcuts = [
  { key: 'Tab', descKey: 'weekly.time.entry.keyboard.shortcuts.next' },
  {
    key: 'Shift + Tab',
    descKey: 'weekly.time.entry.keyboard.shortcuts.previous',
  },
  {
    key: 'Directional arrows (↑, →, ←, ↓)',
    descKey: 'weekly.time.entry.keyboard.shortcuts.move.adjacent.cell',
  },
  {
    key: isMac ? 'Cmd + C' : 'Ctrl + C',
    descKey: 'weekly.time.entry.keyboard.shortcuts.copy.cell.entry',
  },
  {
    key: isMac ? 'Cmd + V' : 'Ctrl + V',
    descKey: 'weekly.time.entry.keyboard.shortcuts.paste.cell.entry',
  },
  {
    key: isMac ? 'Opt + N' : 'Alt + N',
    descKey: 'weekly.time.entry.keyboard.shortcuts.add.new.row',
  },
  {
    key: isMac ? 'Opt + Shift + N' : 'Alt + Shift + N',
    descKey: 'weekly.time.entry.keyboard.shortcuts.add.new.row',
  },
  {
    key: isMac ? 'Cmd + S' : 'Ctrl + S',
    descKey: 'weekly.time.entry.keyboard.shortcuts.save.timesheet',
  },
  {
    key: isMac ? 'Cmd + Z' : 'Ctrl + Z',
    descKey: 'weekly.time.entry.keyboard.shortcuts.undo.last.change',
  },
  {
    key: isMac ? 'Cmd + Y' : 'Ctrl + Y',
    descKey: 'weekly.time.entry.keyboard.shortcuts.redo.last.change',
  },
  {
    key: isMac ? 'Opt + C' : 'Alt + C',
    descKey: 'weekly.time.entry.keyboard.shortcuts.clear.all.rows',
  },
  {
    key: isMac ? 'Opt + T' : 'Alt + T',
    descKey: 'weekly.time.entry.keyboard.shortcuts.go.to.today',
  },
  {
    key: isMac ? 'Cmd + →' : 'Ctrl + →',
    descKey: 'weekly.time.entry.keyboard.shortcuts.go.to.next.week',
  },
  {
    key: isMac ? 'Cmd + ←' : 'Ctrl + ←',
    descKey: 'weekly.time.entry.keyboard.shortcuts.go.to.previous.week',
  },
  {
    key: 'Esc',
    descKey: 'weekly.time.entry.keyboard.shortcuts.cancel.current.action',
  },
  {
    key: 'Delete',
    descKey: 'weekly.time.entry.keyboard.shortcuts.clear.cell',
  },
  {
    key: 'Shift + Delete',
    descKey: 'weekly.time.entry.keyboard.shortcuts.delete.row',
  },
  {
    key: isMac ? 'Cmd + Shift + +' : 'Ctrl + Shift + +',
    descKey: 'weekly.time.entry.keyboard.shortcuts.insert.row',
  },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  open,
  onClose,
}) => {
  const intl = useIntl();

  return (
    <Modal open={open} onClose={onClose} size="medium" dismissible restoreFocus>
      <ModalHeader alignment="left">
        <ModalTitle
          title={intl.formatMessage({
            id: 'weekly.time.entry.keyboard.shortcuts.modal.title',
          })}
        />
      </ModalHeader>
      <StyledModalContent>
        <B2>
          {intl.formatMessage({
            id: 'weekly.time.entry.keyboard.shortcuts.modal.description',
          })}
        </B2>
        <ShortcutsList>
          {shortcuts.map(({ key, descKey }) => (
            <ShortcutRow key={key}>
              <ShortcutKey as="span">
                <strong>{key}</strong>
              </ShortcutKey>
              <B3 as="span">{intl.formatMessage({ id: descKey })}</B3>
            </ShortcutRow>
          ))}
        </ShortcutsList>
      </StyledModalContent>
    </Modal>
  );
};
