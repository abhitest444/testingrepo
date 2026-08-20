import React from 'react';
import { H4 } from '@ids-ts/typography';
import AnimatedBrand from '@genux-ds/animated-brand';

const StepHeader: React.FC = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      textAlign: 'center',
      justifyContent: 'center',
      gap: '12px',
      marginBottom: '24px',
    }}
  >
    <AnimatedBrand animationType="ai4iWorking" loop={0} />
    <H4 weight="demi" style={{ textAlign: 'center' }}>
      Review
    </H4>
  </div>
);

export default StepHeader;
