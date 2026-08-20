import React from 'react';
import { B2 } from '@ids-ts/typography';
import { Button } from '@ids-ts/button';
import { Settings } from '@design-systems/icons';
import AnimatedBrand from '@genux-ds/animated-brand';
import {
  CardContainer,
  CardHeader,
  IconCircle,
  InnerCardContainer,
} from '../base.styles';

interface CustomFieldsSectionProps {
  isLoading: boolean;
  onAddCustomFields: () => void;
}

const CustomFieldsSection: React.FC<CustomFieldsSectionProps> = ({
  isLoading,
  onAddCustomFields,
}) => (
  <CardContainer>
    <InnerCardContainer>
      <CardHeader>
        <IconCircle>
          <Settings size="small" color="white" />
        </IconCircle>
        <B2 weight="demi" style={{ color: '#000' }}>
          Custom Fields
        </B2>
      </CardHeader>
      <div
        style={{ padding: '16px 0', display: 'flex', justifyContent: 'center' }}
      >
        {isLoading ? (
          <AnimatedBrand animationType="ai4iWorking" loop={0} />
        ) : (
          <Button
            priority="secondary"
            purpose="standard"
            theme="gbsgexperimental"
            onClick={onAddCustomFields}
          >
            ADD CUSTOM FIELDS
          </Button>
        )}
      </div>
    </InnerCardContainer>
  </CardContainer>
);

export default CustomFieldsSection;
