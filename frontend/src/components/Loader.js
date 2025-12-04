// Modern, next-gen loader with glassmorphism and smooth animations
export default function Loader({ message = 'Loading...', size = 'md', fullScreen = false }) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-black/40 via-black/20 to-black/40 backdrop-blur-md z-50">
        {/* Animated background orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-br from-cyan-500/30 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-gradient-to-br from-purple-500/30 to-pink-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>

        {/* Glassmorphic card */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-6 px-8 py-12 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
          {/* Rotating spinner */}
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-400 border-r-blue-400 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-purple-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-cyan-400/20 to-purple-400/20"></div>
          </div>

          {message && (
            <div className="text-center">
              <p className="text-white text-lg font-semibold tracking-wide">{message}</p>
              <div className="flex gap-1 justify-center mt-3">
                {[0, 0.1, 0.2].map((delay, i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${delay}s` }}
                  ></div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Inline loader (table/modal)
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      {/* Compact spinner */}
      <div className={`relative ${sizeClasses[size]}`}>
        <div className="absolute inset-0 rounded-full border-3 border-cyan-100 border-t-cyan-600 animate-spin"></div>
        <div className="absolute inset-1 rounded-full border-2 border-transparent border-r-purple-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
      </div>
      {message && (
        <p className="text-gray-600 text-sm font-medium">{message}</p>
      )}
    </div>
  );
}
