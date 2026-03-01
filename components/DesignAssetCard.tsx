import React from 'react';
import { AlertCircle, RefreshCw, ZoomIn, CheckCircle2 } from 'lucide-react';
import { DesignAsset } from '../types';

interface DesignAssetCardProps {
  asset: DesignAsset;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const DesignAssetCard: React.FC<DesignAssetCardProps> = ({ asset, isSelected, onSelect }) => {
  return (
    <div 
      className={`group relative bg-slate-800 rounded-xl overflow-hidden border-2 transition-all duration-300 cursor-pointer 
        ${isSelected ? 'border-indigo-500 shadow-2xl shadow-indigo-500/30' : 'border-slate-700 hover:border-slate-500'}`
      }
      onClick={() => onSelect(asset.id)}
    >
      <div className="aspect-square w-full relative bg-slate-900 flex items-center justify-center overflow-hidden">
        {asset.loading ? (
          <div className="flex flex-col items-center justify-center gap-3 text-center p-2">
            <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            <span className="text-indigo-400 text-xs font-medium animate-pulse">
              {asset.strategy.title || 'Generating Concept...'}
            </span>
          </div>
        ) : asset.error ? (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
            <p className="text-rose-200 text-xs mb-3 break-words">{asset.error}</p>
          </div>
        ) : asset.imageUrl ? (
          <img
            src={asset.imageUrl}
            alt={asset.strategy.title}
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="text-slate-600 flex flex-col items-center">
            <ZoomIn className="w-10 h-10 mb-1 opacity-20" />
            <span className="text-xs uppercase tracking-wider opacity-40">Waiting</span>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-slate-700">
        <div className="flex justify-between items-start gap-2">
          <h4 className="text-sm font-bold text-white truncate flex-1" title={asset.strategy.title}>{asset.strategy.title}</h4>
          {asset.strategy.recommendedMockups && (
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded shadow-sm">
                Print-Ready
              </span>
              <span className="text-[10px] font-bold bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                {asset.strategy.recommendedMockups.length} Mockups
              </span>
            </div>
          )}
        </div>
        <p className="text-xs text-slate-400 truncate" title={asset.strategy.rationale}>{asset.strategy.rationale}</p>
      </div>

      {isSelected && (
        <div className="absolute inset-0 bg-indigo-500/20 pointer-events-none">
          <div className="absolute top-2 right-2 p-1.5 bg-indigo-600 rounded-full text-white">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignAssetCard;