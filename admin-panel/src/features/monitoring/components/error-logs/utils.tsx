import { Monitor, Smartphone, Globe } from 'lucide-react';

export const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case 'web':
      return <Globe className="w-3.5 h-3.5" />;
    case 'android':
    case 'ios':
      return <Smartphone className="w-3.5 h-3.5" />;
    default:
      return <Monitor className="w-3.5 h-3.5" />;
  }
};
