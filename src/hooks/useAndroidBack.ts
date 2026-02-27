import { useEffect } from 'react';
import { registerBackHandler } from '../utils/androidBridge';

export const useAndroidBack = (handler: () => boolean | void, isEnabled: boolean = true) => {
  useEffect(() => {
    if (!isEnabled) return;
    
    const backHandler = () => {
      const result = handler();
      return result !== false;
    };
    
    const unregister = registerBackHandler(backHandler);
    return unregister;
  }, [handler, isEnabled]);
};
