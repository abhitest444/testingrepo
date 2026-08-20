import { useEffect, useState } from 'react';

export const breakPoints = {
  md: 1024,
  sm: 768,
  sm2: 576,
  xs: 480,
};

export const getGlobal = () => global;

export const isMobileDevice = (): boolean => {
  const { navigator, window } = getGlobal();

  // Check screen width
  if (window.innerWidth <= breakPoints.xs) {
    return true;
  }

  // Check user agent string
  const userAgent =
    navigator.userAgent || navigator.vendor || (global as any).opera;
  const mobileRegex =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

  return mobileRegex.test(userAgent);
};

export const useIsMobileDevice = (): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(isMobileDevice());

  const handleResize = () => {
    setIsMobile(isMobileDevice());
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return isMobile;
};
