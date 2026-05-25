import {useState, useEffect} from 'react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * Detects the device type using the browser's User Agent string.
 *
 * Unlike viewport-width checks, this reflects the *actual device* being used,
 * so a phone in landscape mode or a tablet with a large screen still gets the
 * correct layout.
 *
 * Returns 'mobile', 'tablet', or 'desktop'.
 */
export function useDeviceType(): DeviceType {
  const getDeviceType = (): DeviceType => {
    const ua = navigator.userAgent;

    if (/android/i.test(ua) && /mobile/i.test(ua)) return 'mobile';
    if (/iphone|ipod/i.test(ua)) return 'mobile';

    if (/ipad/i.test(ua)) return 'tablet';
    if (/android/i.test(ua)) return 'tablet'; // Android without "mobile" = tablet

    // iPads on iOS 13+ report as "Macintosh" — detect via touch support
    if (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1) return 'tablet';

    return 'desktop';
  };

  const [deviceType, setDeviceType] = useState<DeviceType>(getDeviceType);

  useEffect(() => {
    // Re-check on orientation change (rare but possible on some browsers)
    const handleOrientationChange = () => setDeviceType(getDeviceType());
    window.addEventListener('orientationchange', handleOrientationChange);
    return () =>
      window.removeEventListener('orientationchange', handleOrientationChange);
  }, []);

  return deviceType;
}
