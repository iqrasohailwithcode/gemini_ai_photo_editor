import React, { useState, useCallback, ChangeEvent, useRef } from 'react';
import { ImageFile } from './types';
import { editImageWithGemini } from './services/geminiService';
import Spinner from './components/Spinner';
import ImagePlaceholder from './components/ImagePlaceholder';

const PhotoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const WandIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-1.026.977-2.206.977-3.454 0-4.628-3.582-8.372-8-8.372S4 4.92 4 9.546c0 1.248.333 2.428.977 3.454m1.132-3.839L6 11.11m0 0a13.916 13.916 0 01-1.42 2.04m1.42-2.04a4 4 0 115.656 0m-5.656 0L4.83 8.33m6.291 1.78a4 4 0 105.656 0m-5.656 0L11.17 8.33" />
  </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
          setError('Please select a valid image file.');
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage({ file, dataUrl: reader.result as string });
        setEditedImage(null); // Clear previous edit
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const triggerFileSelect = () => fileInputRef.current?.click();

  const handleEditRequest = useCallback(async () => {
    if (!originalImage || !prompt.trim()) {
      setError("Please upload an image and provide an editing prompt.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setEditedImage(null);

    try {
      const resultDataUrl = await editImageWithGemini(prompt, originalImage);
      setEditedImage(resultDataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [originalImage, prompt]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 text-slate-100 flex flex-col font-sans">
      <header className="p-4 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-10">
        <h1 
            className="text-2xl lg:text-3xl font-bold text-center text-sky-400 flex items-center justify-center gap-3"
            style={{textShadow: '0 0 12px rgba(56, 189, 248, 0.4)'}}
        >
            <WandIcon className="w-8 h-8" />
            Gemini AI Photo Editor
        </h1>
      </header>

      <main className="flex-grow grid grid-cols-1 lg:grid-cols-5 gap-8 p-4 md:p-8">
        {/* Control Panel */}
        <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700 rounded-xl shadow-lg p-6 flex flex-col gap-6 h-fit lg:sticky lg:top-24">
          <div className="flex flex-col gap-2">
            <label className="text-lg font-semibold text-slate-300">1. Upload Image</label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
                onClick={triggerFileSelect}
                className="w-full bg-slate-700 hover:bg-slate-600 transition-colors text-slate-200 font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2"
            >
                <PhotoIcon className="w-5 h-5" />
                {originalImage ? "Change Image" : "Select an Image"}
            </button>
            {originalImage && <p className="text-xs text-slate-400 mt-1 truncate" title={originalImage.file.name}>Selected: {originalImage.file.name}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="prompt" className="text-lg font-semibold text-slate-300">2. Describe Your Edit</label>
            <div className="relative">
              <textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g., 'make the sky look like a galaxy' or 'add a cute corgi wearing a party hat'"
                className="w-full bg-slate-700 border border-slate-600 rounded-lg p-3 text-slate-100 placeholder-slate-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-shadow duration-200 resize-y min-h-[120px]"
                rows={4}
                maxLength={1000}
              />
              <p className="text-right text-xs text-slate-400 mt-1 pr-1">{prompt.length} / 1000</p>
            </div>
          </div>
          
          <button
            onClick={handleEditRequest}
            disabled={isLoading || !originalImage || !prompt}
            className="w-full text-lg bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-lg flex items-center justify-center gap-3 transition-all duration-300 transform active:scale-95 shadow-lg hover:shadow-sky-500/30 disabled:shadow-none"
          >
            {isLoading ? <Spinner /> : <WandIcon className="w-6 h-6" />}
            {isLoading ? "Generating..." : "Apply AI Edit"}
          </button>
          
          {error && <p className="text-red-400 bg-red-900/30 p-3 rounded-lg text-sm font-medium">{error}</p>}
        </div>

        {/* Image Display */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
            <div className="flex flex-col items-center gap-4">
                <h2 className="text-xl font-semibold text-slate-400">Original</h2>
                <div className="aspect-square w-full bg-slate-800/40 rounded-xl border border-slate-700 relative group overflow-hidden">
                    {originalImage ? (
                        <>
                            <img src={originalImage.dataUrl} alt="Original upload" className="w-full h-full object-contain" />
                            <a 
                                href={originalImage.dataUrl} 
                                download={`original-${originalImage.file.name}`}
                                className="absolute top-3 right-3 bg-slate-900/70 text-white p-2.5 rounded-full hover:bg-sky-600 transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 outline-none focus:ring-2 focus:ring-sky-500"
                                aria-label="Download original image"
                            >
                                <DownloadIcon className="w-5 h-5" />
                            </a>
                        </>
                    ) : (
                        <ImagePlaceholder title="Your Image" icon={<PhotoIcon className="w-12 h-12" />}>
                           Upload an image to get started.
                        </ImagePlaceholder>
                    )}
                </div>
            </div>
            <div className="flex flex-col items-center gap-4">
                <h2 className="text-xl font-semibold text-slate-400">Edited</h2>
                <div className="aspect-square w-full bg-slate-800/40 rounded-xl border border-slate-700 relative group overflow-hidden">
                    {isLoading && (
                        <div className="absolute inset-0 bg-slate-800/80 rounded-lg flex justify-center items-center z-10">
                            <Spinner />
                        </div>
                    )}
                    {editedImage ? (
                        <>
                            <img src={editedImage} alt="AI Edited result" className="w-full h-full object-contain" />
                            <a 
                                href={editedImage} 
                                download="edited-image.png" 
                                className="absolute top-3 right-3 bg-slate-900/70 text-white p-2.5 rounded-full hover:bg-sky-600 transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100 outline-none focus:ring-2 focus:ring-sky-500"
                                aria-label="Download edited image"
                            >
                                <DownloadIcon className="w-5 h-5" />
                            </a>
                        </>
                    ) : (
                         <ImagePlaceholder title="AI Result" icon={<WandIcon className="w-12 h-12" />}>
                            Your edited image will appear here.
                        </ImagePlaceholder>
                    )}
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};

export default App;
