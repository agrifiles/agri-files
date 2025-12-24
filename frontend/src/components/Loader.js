// Modern, next-gen loader with glassmorphism and smooth animations
export default function Loader({ message = 'Loading...', size = 'md', fullScreen = false }) {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3'
  };

  const spinner = (
    <div className={`${sizeClasses[size]} border-gray-200 border-t-blue-600 rounded-full animate-spin`}></div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/90 z-50">
        {spinner}
        {message && <p className="mt-4 text-sm text-gray-600 font-medium animate-pulse">{message}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {spinner}
      {message && <p className="mt-2 text-xs text-gray-500">{message}</p>}
    </div>
  );
}
