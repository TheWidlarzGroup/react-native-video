// Enhanced logging for development
export const logger = {
  log: (...args: any[]) => {
    console.log('[LOG]', ...args);
  },
  
  info: (...args: any[]) => {
    console.info('[INFO]', ...args);
  },
  
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
  },
  
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  },
  
  debug: (...args: any[]) => {
    if (__DEV__) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  // Video player specific logging
  videoEvent: (event: string, data?: any) => {
    console.log(`[VIDEO] ${event}`, data || '');
  },
  
  // DataZoom specific logging
  datazoom: (action: string, data?: any) => {
    console.log(`[DATAZOOM] ${action}`, data || '');
  }
};

export default logger;
