import { useEffect, useRef } from "react";

const useDelayedAction = <T>(
    value: T,
    delay: number,
    action: () => void
  ): void => {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
    useEffect(() => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
  
      timeoutRef.current = setTimeout(() => {
        action();
      }, delay);
  
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, [value, delay, action]);
  };
  
export default useDelayedAction