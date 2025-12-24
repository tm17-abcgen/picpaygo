import { useState, useCallback, useRef } from 'react';
import { Upload, X, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface UploadPanelProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  previewUrl: string | null;
  onClear: () => void;
  disabled?: boolean;
}

export function UploadPanel({ onFileSelect, selectedFile, previewUrl, onClear, disabled }: UploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect, disabled]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  if (previewUrl && selectedFile) {
    return (
      <div className="relative w-full aspect-square max-w-sm mx-auto rounded-lg overflow-hidden bg-secondary">
        <img
          src={previewUrl}
          alt="Preview of uploaded photo"
          className="w-full h-full object-cover"
        />
        <button
          onClick={onClear}
          disabled={disabled}
          className="absolute top-3 right-3 p-2 rounded-full bg-background/80 hover:bg-background transition-colors disabled:opacity-50"
          aria-label="Remove image"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="absolute bottom-3 left-3 right-3 text-xs text-background bg-foreground/70 px-3 py-1.5 rounded">
          {selectedFile.name}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-full aspect-square max-w-sm mx-auto rounded-lg border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-4 p-6 ${
        isDragging
          ? 'border-accent bg-accent/5'
          : 'border-border hover:border-accent/50 bg-secondary/50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="Upload photo"
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        className="hidden"
        disabled={disabled}
        aria-hidden="true"
      />
      
      <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center">
        <ImageIcon className="h-8 w-8 text-muted-foreground" />
      </div>
      
      <div className="text-center">
        <p className="font-medium text-foreground">
          Drop your photo here
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          or click to browse
        </p>
      </div>
      
      <Button variant="outline" size="sm" disabled={disabled} className="pointer-events-none">
        <Upload className="h-4 w-4 mr-2" />
        Choose File
      </Button>
    </div>
  );
}
