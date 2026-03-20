/**
 * DEV Mode Error Simulation Utilities
 * 
 * Tools for developers to test error scenarios during development
 * Only active when DEV_MODE is enabled
 */

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Check if dev mode is enabled
const DEV_MODE = import.meta.env.DEV || process.env.REACT_APP_DEV_MODE === 'true';

export interface ErrorSimulationConfig {
  enabled: boolean;
  errorType: string;
  delay: number; // milliseconds before error
  message?: string;
  fields?: string[];
}

/**
 * Available error types for simulation
 */
export const SIMULATED_ERROR_TYPES = {
  NETWORK_ERROR: 'network_error',
  TIMEOUT_ERROR: 'timeout_error',
  VALIDATION_ERROR: 'validation_error',
  AUTH_ERROR: 'auth_error',
  SERVER_ERROR: 'server_error',
  PERMISSION_ERROR: 'permission_error',
  NOT_FOUND_ERROR: 'not_found_error',
  FILE_UPLOAD_ERROR: 'file_upload_error',
  DUPLICATE_ENTRY_ERROR: 'duplicate_entry_error',
  UNKNOWN_ERROR: 'unknown_error',
} as const;

/**
 * Global error simulation state
 */
let errorSimulationConfig: ErrorSimulationConfig | null = null;

/**
 * Enable error simulation for a specific error type
 */
export function enableErrorSimulation(config: Partial<ErrorSimulationConfig>) {
  if (!DEV_MODE) {
    console.warn('Error simulation only works in development mode');
    return;
  }

  errorSimulationConfig = {
    enabled: true,
    errorType: config.errorType || 'unknown_error',
    delay: config.delay || 0,
    message: config.message,
    fields: config.fields || [],
  };

  console.log('%c[DEV MODE] Error simulation enabled:', 'color: orange; font-weight: bold;', errorSimulationConfig);
}

/**
 * Disable error simulation
 */
export function disableErrorSimulation() {
  if (errorSimulationConfig) {
    console.log('%c[DEV MODE] Error simulation disabled', 'color: orange; font-weight: bold;');
    errorSimulationConfig = null;
  }
}

/**
 * Get current error simulation config
 */
export function getErrorSimulationConfig() {
  return DEV_MODE ? errorSimulationConfig : null;
}

/**
 * Check if error should be simulated for given API call
 */
export async function shouldSimulateError(apiName: string): Promise<boolean> {
  const config = getErrorSimulationConfig();
  if (!config || !config.enabled) return false;

  if (config.delay > 0) {
    await new Promise(resolve => setTimeout(resolve, config.delay));
  }

  return true;
}

/**
 * Create simulated error based on configuration
 */
export function createSimulatedError(errorType: string): Error {
  const messages: Record<string, string> = {
    network_error: 'خطای شبکه: اتصال قطع شده است',
    timeout_error: 'خطای timeout: درخواست بیش از حد طول کشید',
    validation_error: 'خطای بررسی: فیلدها نامعتبر هستند',
    auth_error: 'خطای احراز هویت: نام کاربری یا رمز عبور نادرست است',
    server_error: 'خطای سرور: سرور دارای مشکل است',
    permission_error: 'خطای دسترسی: شما اجازه این عمل را ندارید',
    not_found_error: 'خطای یافت نشدن: منبع پیدا نشد',
    file_upload_error: 'خطای بارگذاری: فایل بارگذاری نشد',
    duplicate_entry_error: 'خطای تکراری: این مورد قبلاً وجود دارد',
    unknown_error: 'خطای نامشخص رخ داده است',
  };

  const error = new Error(messages[errorType] || messages.unknown_error);
  (error as any).__simulated__ = true;
  (error as any).__simulated_type__ = errorType;
  return error;
}

/**
 * React hook for error simulation UI
 */
function useErrorSimulation() {
  const [config, setConfig] = React.useState<ErrorSimulationConfig | null>(
    DEV_MODE ? errorSimulationConfig : null
  );
  const [showPanel, setShowPanel] = React.useState(false);

  const toggleErrorSimulation = (newConfig: Partial<ErrorSimulationConfig>) => {
    if (!DEV_MODE) return;

    if (config?.enabled) {
      disableErrorSimulation();
      setConfig(null);
    } else {
      enableErrorSimulation(newConfig);
      const updated = getErrorSimulationConfig();
      setConfig(updated);
    }
  };

  return {
    config,
    showPanel,
    setShowPanel,
    toggleErrorSimulation,
  };
}

/**
 * Error Simulation Panel Component
 * Only shown in development mode
 */
export const ErrorSimulationPanel: React.FC = () => {
  if (!DEV_MODE) return null;

  const [selectedError, setSelectedError] = React.useState<string>('');
  const [delay, setDelay] = React.useState<number>(0);
  const [isActive, setIsActive] = React.useState(false);

  const handleEnable = () => {
    if (!selectedError) return;

    enableErrorSimulation({
      errorType: selectedError,
      delay,
    });
    setIsActive(true);
  };

  const handleDisable = () => {
    disableErrorSimulation();
    setIsActive(false);
  };

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 border-orange-200 dark:border-orange-900 bg-orange-50 dark:bg-orange-950">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <CardTitle className="text-base text-orange-900 dark:text-orange-100">
              شبیه‌سازی خطا
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Remove panel
              const panel = document.querySelector('[data-error-simulation-panel]');
              if (panel) panel.remove();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {isActive && (
          <div className="rounded bg-orange-100 dark:bg-orange-900 p-2 text-sm text-orange-800 dark:text-orange-200">
            ✓ شبیه‌سازی خطا فعال است
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-medium text-orange-900 dark:text-orange-100">
            نوع خطا:
          </label>
          <Select value={selectedError} onValueChange={setSelectedError}>
            <SelectTrigger className="h-8 text-xs bg-white dark:bg-gray-900">
              <SelectValue placeholder="انتخاب کنید..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SIMULATED_ERROR_TYPES).map(([key, value]) => (
                <SelectItem key={value} value={value}>
                  {key.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-orange-900 dark:text-orange-100">
            تأخیر (میلی‌ثانیه):
          </label>
          <input
            type="number"
            min="0"
            max="5000"
            value={delay}
            onChange={e => setDelay(parseInt(e.target.value) || 0)}
            className="w-full h-8 px-2 text-xs border rounded bg-white dark:bg-gray-900 dark:border-gray-700"
          />
        </div>

        <div className="flex gap-2 pt-2">
          {isActive ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisable}
              className="flex-1 h-8 text-xs"
            >
              غیرفعال کردن
            </Button>
          ) : (
            <>
              <Button
                variant="default"
                size="sm"
                onClick={handleEnable}
                disabled={!selectedError}
                className="flex-1 h-8 text-xs bg-orange-600 hover:bg-orange-700"
              >
                فعال کردن
              </Button>
            </>
          )}
        </div>

        <p className="text-xs text-orange-700 dark:text-orange-300 mt-2 pt-2 border-t border-orange-200 dark:border-orange-800">
          این ابزار فقط در حالت توسعه دسترسی دارد.
        </p>
      </CardContent>
    </Card>
  );
};

export default {
  enableErrorSimulation,
  disableErrorSimulation,
  getErrorSimulationConfig,
  shouldSimulateError,
  createSimulatedError,
  useErrorSimulation,
  ErrorSimulationPanel,
  SIMULATED_ERROR_TYPES,
};
