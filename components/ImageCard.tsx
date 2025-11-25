import React from 'react';
import { Download, AlertCircle, RefreshCw, ZoomIn } from 'lucide-react';
import { GeneratedImage } from '../types';

interface ImageCardProps {
  image: GeneratedImage;
  onRetry: (id: string) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, onRetry }) => {
  const handleDownload = () => {
    if (image.imageUrl) {
      const link = document.createElement('a');
      link.href = image.imageUrl;
      link.download = `pod-mockup-${image.configId}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="group relative bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-md hover:shadow-xl hover:border-slate-600 transition-all duration-300">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity">
        <h3 className="text-white text-sm font-medium truncate px-1">{image.title}</h3>
      </div>

      {/* Image Area */}
      <div className="aspect-square w-full relative bg-slate-900 flex items-center justify-center overflow-hidden">
        {image.loading ? (
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            <span className="text-indigo-400 text-xs font-medium animate-pulse">Designing...</span>
          </div>
        ) : image.error ? (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
            <p className="text-rose-200 text-sm mb-4">{image.error}</p>
            <button
              onClick={() => onRetry(image.configId)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-white transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Try Again
            </button>
          </div>
        ) : image.imageUrl ? (
          <img
            src={image.imageUrl}
            alt={image.title}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="text-slate-600 flex flex-col items-center">
            <ZoomIn className="w-12 h-12 mb-2 opacity-20" />
            <span className="text-xs uppercase tracking-wider opacity-40">Waiting to Generate</span>
          </div>
        )}
      </div>

      {/* Footer / Actions */}
      <div className="p-4 border-t border-slate-700 bg-slate-800 flex justify-between items-center">
        <span className="text-xs text-slate-400 font-medium truncate max-w-[60%]">
          {image.title}
        </span>
        
        {image.imageUrl && !image.loading && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        )}
      </div>
    </div>
  );
};

export default ImageCard;