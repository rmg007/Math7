import { ReactNode } from 'react';

interface RouteErrorFallbackProps {
  title: string;
  message: string;
  buttonText?: string;
  borderColor?: string;
  buttonColor?: string;
  icon?: ReactNode;
}

export const RouteErrorFallback = ({
  title,
  message,
  buttonText = 'Try Again',
  borderColor = 'border-red-100',
  buttonColor = 'bg-red-600 hover:bg-red-700',
  icon,
}: RouteErrorFallbackProps) => (
  <div className="min-h-screen flex items-center justify-center p-4">
    <div
      className={`max-w-md w-full p-8 bg-white rounded-2xl shadow-xl border ${borderColor} text-center`}
    >
      {icon && <div className="mb-4">{icon}</div>}
      <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-6 font-medium">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className={`px-6 py-3 ${buttonColor} text-white rounded-xl transition-all font-bold text-sm uppercase tracking-wide`}
      >
        {buttonText}
      </button>
    </div>
  </div>
);
