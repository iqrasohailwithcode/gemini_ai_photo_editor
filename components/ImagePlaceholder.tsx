
import React from 'react';

interface ImagePlaceholderProps {
  title: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
}

const ImagePlaceholder: React.FC<ImagePlaceholderProps> = ({ title, icon, children }) => (
  <div className="w-full h-full bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-600 flex flex-col justify-center items-center p-6 text-center">
    <div className="text-slate-400 mb-4">{icon}</div>
    <h3 className="text-lg font-semibold text-slate-300 mb-2">{title}</h3>
    <div className="text-sm text-slate-400">{children}</div>
  </div>
);

export default ImagePlaceholder;
