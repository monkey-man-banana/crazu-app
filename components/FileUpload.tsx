import React, { useCallback, useState } from 'react';
import { Upload, AlertCircle, ArrowDown, FileType } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateAndPassFile = (file: File) => {
    const validTypes = ['application/pdf', 'text/plain'];
    if (!validTypes.includes(file.type)) {
      setError("Please upload a PDF or Text (.txt) file");
      return;
    }
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError("File size exceeds 10MB limit");
      return;
    }
    setError(null);
    onFileSelect(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndPassFile(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndPassFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div 
        className={`
          relative flex flex-col items-center justify-center w-full h-80 
          border-4 border-dashed transition-all duration-200
          ${dragActive 
            ? 'border-brand-yellow bg-brand-yellow/10' 
            : 'border-black dark:border-white bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-900'
          }
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          id="file-upload" 
          type="file" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          accept=".pdf,.txt"
          onChange={handleChange}
        />
        
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center pointer-events-none">
          <div className={`p-5 mb-6 transition-transform duration-200 ${dragActive ? 'scale-110 bg-brand-yellow text-black' : 'bg-black dark:bg-white text-white dark:text-black'}`}>
            {dragActive ? <ArrowDown className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
          </div>
          <p className="mb-2 text-xl font-bold text-black dark:text-white uppercase tracking-tight">
            {dragActive ? "DROP FILE NOW" : "Click or Drag PDF / Text File Here"}
          </p>
          <div className="flex items-center gap-4 text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-2">
            <span className="flex items-center gap-1"><FileType className="w-4 h-4" /> PDF & TXT Supported</span>
            <span>•</span>
            <span>MAX 10MB</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-brand-yellow text-black border-2 border-black flex items-center gap-3 text-sm font-bold">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;