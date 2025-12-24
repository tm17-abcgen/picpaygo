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
      <div className="relative w-full aspect-[3/4] max-w-md mx-auto rounded-[28px] overflow-hidden border border-border/70 bg-card/60 shadow-sm">
        <img
          src={previewUrl}
          alt="Preview of uploaded photo"
          className="h-full w-full object-cover"
        />
        <button
          onClick={onClear}
          disabled={disabled}
          className="absolute top-4 right-4 p-2 rounded-full border border-border bg-background/80 hover:bg-background transition-colors disabled:opacity-50"
          aria-label="Remove image"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-4 pb-4 pt-10">
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/90">Ready to generate</p>
          <p className="text-xs text-white/80 mt-1 truncate">{selectedFile.name}</p>
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
      className={`grain-panel w-full aspect-[3/4] max-w-md mx-auto rounded-[28px] border border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-4 p-6 ${
        isDragging
          ? 'border-accent bg-accent/5 ring-1 ring-accent/30'
          : 'border-border/70 hover:border-foreground/50 bg-card/40'
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
      
      <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
        Upload portrait
      </p>

      <div className="w-14 h-14 rounded-full border border-border bg-background/80 flex items-center justify-center">
        <ImageIcon className="h-6 w-6 text-muted-foreground" />
      </div>
      
      <div className="text-center">
        <p className="font-medium text-foreground">
          Drop or click to upload
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          JPG or PNG, up to 10MB
        </p>
      </div>
      
      <Button variant="outline" size="sm" disabled={disabled} className="pointer-events-none">
        <Upload className="h-4 w-4 mr-2" />
        Choose File
      </Button>
    </div>
  );
}
