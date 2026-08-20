import React, { useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { H4, B2 } from '@ids-ts/typography';
import { Button } from '@ids-ts/button';
import SpotIllustration from '../../../../assets/images/Spot Illustration.svg';
import { resetAllSlices } from '../store/globalActions';
import { resetProgressState } from '../store/progressSlice';
import { selectUploadId } from '../store/selectors';

interface Step6CompleteProps {
  onClose: () => void;
  savedCount: number;
  sandbox: any;
}

const Step6Complete: React.FC<Step6CompleteProps> = ({
  onClose,
  savedCount,
  sandbox,
}) => {
  const dispatch = useDispatch();
  const uploadId = useSelector(selectUploadId);
  const excelDataState = useSelector((state: any) => state.excelData);

  // Log performance metrics when component mounts
  useEffect(() => {
    if (uploadId && excelDataState.uploadStartTime) {
      const processingTime = Date.now() - excelDataState.uploadStartTime;
      // TODO: Add sandbox logger for performance metrics
      // uploadId, processingTime, savedCount, avgTimePerEntry
    }
  }, [uploadId, excelDataState.uploadStartTime, savedCount]);

  const handleViewTimeEntries = useCallback(() => {
    // Close the trowser first, then navigate
    onClose();
    // Navigate to time entries page
    sandbox.navigation.navigate('/app/time');
  }, [sandbox, onClose]);

  const handleApproveTime = useCallback(() => {
    // Close the trowser first, then navigate
    onClose();
    // Navigate to time approval page
    sandbox.navigation.navigate('/app/time/approval');
  }, [sandbox, onClose]);

  const handleUploadFile = useCallback(() => {
    // Reset everything and go back to step 1 - clean and simple!
    dispatch(resetAllSlices());
    // Don't close the trowser, just reset to Step 1
  }, [dispatch]);

  return (
    <Container>
      <Content>
        {/* Illustration */}
        <IllustrationWrapper>
          <img
            src={SpotIllustration}
            alt="Success"
            style={{ width: '312px', height: '229px' }}
          />
        </IllustrationWrapper>

        {/* Title */}
        <H4
          weight="demi"
          style={{
            textAlign: 'center',
            marginTop: '16px',
            marginBottom: '20px',
          }}
        >
          {savedCount} Time entries added!
        </H4>

        {/* Subtitle */}
        <B2
          style={{
            textAlign: 'center',
            color: '#5C6770',
            marginBottom: '24px',
          }}
        >
          Great job keeping track of your team&apos;s time, you can view and
          approve them now.
        </B2>

        {/* What you can do next card */}
        <NextStepsCard>
          <CardTitle>
            <B2 weight="demi">What you can do next...</B2>
          </CardTitle>

          {/* Review imported timesheets */}
          <ActionRow>
            <IconWrapper>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="3" width="7" height="7" fill="#2C3338" />
                <rect x="3" y="13" width="7" height="7" fill="#2C3338" />
                <rect x="13" y="3" width="7" height="7" fill="#2C3338" />
              </svg>
            </IconWrapper>
            <TextColumn>
              <B2 weight="demi">Review imported timesheets</B2>
              <B2 style={{ color: '#5C6770', fontSize: '14px' }}>
                Make sure you complete all the missing fields
              </B2>
            </TextColumn>
            <Button
              priority="secondary"
              purpose="standard"
              theme="gbsgexperimental"
              onClick={handleViewTimeEntries}
            >
              View time entries
            </Button>
          </ActionRow>

          {/* Approve imported timesheets */}
          <ActionRow>
            <IconWrapper>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="#2C3338"
                  strokeWidth="2"
                  fill="none"
                />
                <path
                  d="M8 12L11 15L16 9"
                  stroke="#2C3338"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </IconWrapper>
            <TextColumn>
              <B2 weight="demi">Approve imported timesheets</B2>
              <B2 style={{ color: '#5C6770', fontSize: '14px' }}>
                So your team can get paid accurately and in time when you run
                payroll
              </B2>
            </TextColumn>
            <Button
              priority="secondary"
              purpose="standard"
              theme="gbsgexperimental"
              onClick={handleApproveTime}
            >
              Approve time
            </Button>
          </ActionRow>

          {/* Import more timesheets */}
          <ActionRow>
            <IconWrapper>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 5V19M12 5L7 10M12 5L17 10"
                  stroke="#2C3338"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </IconWrapper>
            <TextColumn>
              <B2 weight="demi">Import more timesheets</B2>
              <B2 style={{ color: '#5C6770', fontSize: '14px' }}>
                Continue importing timesheets from another file
              </B2>
            </TextColumn>
            <Button
              priority="tertiary"
              purpose="standard"
              theme="gbsgexperimental"
              onClick={handleUploadFile}
            >
              Upload file
            </Button>
          </ActionRow>
        </NextStepsCard>
      </Content>
    </Container>
  );
};

export default Step6Complete;

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 80px;
  width: 100%;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 900px;
  width: 100%;
`;

const IllustrationWrapper = styled.div`
  margin-bottom: 32px;
`;

const NextStepsCard = styled.div`
  background: #ffffff;
  border: 1px solid #d2d4d9;
  border-radius: 8px;
  padding: 24px;
  width: 100%;
`;

const CardTitle = styled.div`
  margin-bottom: 24px;
`;

const ActionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid #e9ebed;

  &:last-child {
    border-bottom: none;
  }
`;

const IconWrapper = styled.div`
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TextColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;
