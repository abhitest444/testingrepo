import React, { useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { B1, B2, B3 } from '@ids-ts/typography';
import { Upload, Checks } from '@design-systems/icons';
import { IconControl } from '@ids-ts/icon-control';
import { Link } from '@ids-ts/link';

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void;
  isDisabled?: boolean;
  acceptedFileTypes?: string[];
  maxFileSizeMB?: number;
  maxEntries?: number;
  fileUploaded?: boolean;
  children?: React.ReactNode;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  onFileSelect,
  isDisabled = false,
  acceptedFileTypes = ['CSV', 'XLS', 'PDF', 'IMG'],
  maxFileSizeMB = 10,
  maxEntries = 200,
  fileUploaded = false,
  children,
}) => {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!isDisabled) {
        setIsDragOver(true);
      }
    },
    [isDisabled],
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (isDisabled) return;

      const { files } = e.dataTransfer;
      if (files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [isDisabled, onFileSelect],
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files } = e.target;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect],
  );

  const handleClick = useCallback(() => {
    if (!isDisabled) {
      document.getElementById('file-input')?.click();
    }
  }, [isDisabled]);

  const handleViewSample = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(
      'https://quickbooks.intuit.com/time-tracking/resources/timesheet-templates/',
      '_blank',
      'noopener,noreferrer',
    );
  }, []);

  return (
    <UploadZoneContainer
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      isDragOver={isDragOver}
      isDisabled={isDisabled}
      fileUploaded={fileUploaded}
      role="button"
      tabIndex={0}
      aria-label="Upload file zone"
    >
      <HiddenFileInput
        id="file-input"
        type="file"
        accept=".csv,.xls,.xlsx,.pdf,.jpg,.jpeg,.png,.heic,.heif"
        onChange={handleFileInputChange}
        disabled={isDisabled}
      />

      {children || (
        // Default upload UI
        <>
          <UploadIcon fileUploaded={fileUploaded}>
            <IconControl
              size="large"
              color={fileUploaded ? '#003E31' : '#0077c5'}
            >
              {fileUploaded ? <Checks /> : <Upload />}
            </IconControl>
          </UploadIcon>

          <UploadTitleWrapper>
            <B2 weight="medium">Drag and drop a file to upload</B2>
          </UploadTitleWrapper>

          <UploadSubtext>
            <B3>Support {acceptedFileTypes.join(', ')} files</B3>
          </UploadSubtext>
          <UploadSubtext>
            <B3>{maxEntries} time entries at max</B3>
          </UploadSubtext>
        </>
      )}
    </UploadZoneContainer>
  );
};

const UploadZoneContainer = styled.div<{
  isDragOver: boolean;
  isDisabled: boolean;
  fileUploaded: boolean;
}>`
  border: 1px solid
    ${({ fileUploaded }) => (fileUploaded ? '#003E31' : '#e5e7eb')};
  border-radius: 8px;
  background-color: ${({ fileUploaded }) =>
    fileUploaded ? 'rgba(0, 62, 49, 0.20)' : '#ffffff'};
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: ${({ isDisabled }) => (isDisabled ? 'not-allowed' : 'pointer')};
  transition: all 0.2s ease-in-out;
  opacity: ${({ isDisabled }) => (isDisabled ? 0.6 : 1)};

  &:hover {
    ${({ isDisabled, fileUploaded }) =>
      !isDisabled &&
      !fileUploaded &&
      `
      border-color: #0077c5;
      background-color: #f9fafb;
    `}
  }

  &:focus {
    outline: 2px solid
      ${({ fileUploaded }) => (fileUploaded ? '#003E31' : '#0077c5')};
    outline-offset: 2px;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const UploadIcon = styled.div<{ fileUploaded: boolean }>`
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const UploadTitleWrapper = styled.div`
  color: #111827;
  margin-bottom: 12px;
  text-align: center;
  display: block;
`;

const UploadSubtext = styled.div`
  color: #6b7280;
  text-align: center;
  display: block;
  font-size: 14px;
`;

const ViewSampleLink = styled.div`
  margin-top: 0;
`;

export default FileUploadZone;
