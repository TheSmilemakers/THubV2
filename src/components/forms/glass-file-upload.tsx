'use client';

import React, { useState, useId, forwardRef, useRef, useCallback, DragEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  File, 
  Image, 
  Video, 
  Music, 
  FileText, 
  Archive,
  X, 
  Eye, 
  Download,
  AlertCircle, 
  CheckCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdaptiveGlass, usePerformanceTier, useDeviceCapabilities } from '@/lib/hooks';

/**
 * GlassFileUpload Component - Drag-and-drop file upload with glassmorphism styling
 * 
 * Features:
 * - Drag-and-drop with visual feedback
 * - File type validation and filtering
 * - Image/video preview with glassmorphism overlay
 * - Multiple file upload support
 * - Progress tracking for uploads
 * - File size validation
 * - Touch-optimized for mobile devices
 * - Adaptive glassmorphism effects
 * - Validation states with visual feedback
 * - React Hook Form compatible
 * - Upload queue management
 * - Custom file templates
 */

export interface UploadedFile {
  id: string;
  file: File;
  url?: string;
  progress?: number;
  error?: string;
  uploaded?: boolean;
}

export interface GlassFileUploadProps {
  label?: string;
  description?: string;
  value?: UploadedFile[];
  defaultValue?: UploadedFile[];
  onChange?: (files: UploadedFile[]) => void;
  onUpload?: (files: File[]) => Promise<UploadedFile[]>;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  success?: string;
  hint?: string;
  className?: string;
  'data-testid'?: string;
  // File constraints
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in bytes
  minSize?: number; // in bytes
  // Upload behavior
  autoUpload?: boolean;
  uploadOnDrop?: boolean;
  // Display options
  showPreview?: boolean;
  previewSize?: 'small' | 'medium' | 'large';
  layout?: 'grid' | 'list';
  // Customization
  icon?: React.ReactNode;
  uploadText?: string;
  dragText?: string;
  // Templates
  variant?: 'default' | 'avatar' | 'gallery' | 'document';
}

const GlassFileUpload = forwardRef<HTMLInputElement, GlassFileUploadProps>(({
  label,
  description,
  value,
  defaultValue = [],
  onChange,
  onUpload,
  disabled = false,
  required = false,
  error,
  success,
  hint,
  className,
  'data-testid': testId,
  accept,
  multiple = true,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  minSize = 0,
  autoUpload = false,
  uploadOnDrop = false,
  showPreview = true,
  previewSize = 'medium',
  layout = 'grid',
  icon,
  uploadText = 'Click to upload or drag and drop',
  dragText = 'Drop files here',
  variant = 'default',
}, ref) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [internalFiles, setInternalFiles] = useState<UploadedFile[]>(defaultValue);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileUploadId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  
  const adaptiveGlass = useAdaptiveGlass();
  const performanceTier = usePerformanceTier();
  const { touch, screenSize } = useDeviceCapabilities();

  // Use controlled or uncontrolled value
  const currentFiles = value !== undefined ? value : internalFiles;
  
  // Determine upload state
  const uploadState = error ? 'error' : success ? 'success' : isDragOver ? 'drag' : 'default';

  // File type utilities
  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (type.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (type.startsWith('audio/')) return <Music className="w-5 h-5" />;
    if (type.includes('pdf') || type.includes('text')) return <FileText className="w-5 h-5" />;
    if (type.includes('zip') || type.includes('rar')) return <Archive className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const isImageFile = (file: File) => file.type.startsWith('image/');
  const isVideoFile = (file: File) => file.type.startsWith('video/');

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // File validation
  const validateFile = (file: File): string | null => {
    if (file.size > maxSize) {
      return `File size must be less than ${formatFileSize(maxSize)}`;
    }
    if (file.size < minSize) {
      return `File size must be at least ${formatFileSize(minSize)}`;
    }
    if (accept) {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const isAccepted = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        return file.type.match(type.replace('*', '.*'));
      });
      if (!isAccepted) {
        return `File type not accepted. Accepted types: ${accept}`;
      }
    }
    return null;
  };

  // File processing
  const processFiles = useCallback(async (files: FileList) => {
    const newFiles: UploadedFile[] = [];
    
    Array.from(files).forEach((file) => {
      if (!multiple && currentFiles.length >= 1) return;
      if (currentFiles.length + newFiles.length >= maxFiles) return;
      
      const validation = validateFile(file);
      const uploadedFile: UploadedFile = {
        id: `${Date.now()}-${Math.random()}`,
        file,
        error: validation || undefined,
        progress: validation ? undefined : 0,
        uploaded: false
      };
      
      // Create preview URL for images and videos
      if ((isImageFile(file) || isVideoFile(file)) && !validation) {
        uploadedFile.url = URL.createObjectURL(file);
      }
      
      newFiles.push(uploadedFile);
    });
    
    const updatedFiles = multiple ? [...currentFiles, ...newFiles] : newFiles;
    
    if (value === undefined) {
      setInternalFiles(updatedFiles);
    }
    onChange?.(updatedFiles);
    
    // Auto upload if enabled
    if ((autoUpload || uploadOnDrop) && onUpload && newFiles.some(f => !f.error)) {
      await handleUpload(newFiles.filter(f => !f.error));
    }
  }, [currentFiles, multiple, maxFiles, value, onChange, autoUpload, uploadOnDrop, onUpload]);

  // Upload handling
  const handleUpload = async (filesToUpload: UploadedFile[]) => {
    if (!onUpload || isUploading) return;
    
    setIsUploading(true);
    
    try {
      const files = filesToUpload.map(f => f.file);
      const uploadedResults = await onUpload(files);
      
      const updatedFiles = currentFiles.map(file => {
        const uploadResult = uploadedResults.find(result => result.id === file.id);
        if (uploadResult) {
          return { ...file, ...uploadResult, uploaded: true, progress: 100 };
        }
        return file;
      });
      
      if (value === undefined) {
        setInternalFiles(updatedFiles);
      }
      onChange?.(updatedFiles);
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // Event handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = currentFiles.filter(f => f.id !== fileId);
    
    // Revoke object URLs to prevent memory leaks
    const removedFile = currentFiles.find(f => f.id === fileId);
    if (removedFile?.url) {
      URL.revokeObjectURL(removedFile.url);
    }
    
    if (value === undefined) {
      setInternalFiles(updatedFiles);
    }
    onChange?.(updatedFiles);
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Variant configurations
  const getVariantConfig = () => {
    switch (variant) {
      case 'avatar':
        return {
          dropZone: 'w-32 h-32 rounded-full',
          single: true,
          accept: 'image/*',
          preview: true
        };
      case 'gallery':
        return {
          dropZone: 'min-h-40',
          grid: true,
          preview: true
        };
      case 'document':
        return {
          dropZone: 'min-h-32',
          list: true,
          preview: false
        };
      default:
        return {
          dropZone: 'min-h-32',
          preview: showPreview
        };
    }
  };

  const variantConfig = getVariantConfig();

  // Styling
  const containerClasses = cn(
    'relative w-full transition-all duration-300',
    className
  );

  const dropZoneClasses = cn(
    'relative border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer',
    'flex flex-col items-center justify-center p-6',
    variantConfig.dropZone,
    // Glass effect based on state
    uploadState === 'drag' && adaptiveGlass.effects 
      ? 'glass-medium shadow-lg shadow-accent-primary/20'
      : 'glass-light',
    // State colors
    {
      'border-accent-primary bg-accent-primary/10': uploadState === 'drag',
      'border-status-error bg-status-error/5': uploadState === 'error',
      'border-status-success bg-status-success/5': uploadState === 'success',
      'border-glass-border': uploadState === 'default',
    },
    // Hover state
    'hover:border-accent-primary/50 hover:bg-accent-primary/5',
    // Disabled state
    disabled && 'opacity-50 cursor-not-allowed hover:border-glass-border hover:bg-transparent',
    'gpu-accelerated'
  );

  const previewClasses = cn(
    'relative rounded-lg overflow-hidden',
    {
      'w-16 h-16': previewSize === 'small',
      'w-24 h-24': previewSize === 'medium',
      'w-32 h-32': previewSize === 'large',
    }
  );

  return (
    <div className={containerClasses}>
      {/* Label */}
      {label && (
        <label 
          htmlFor={fileUploadId}
          className="block text-sm font-medium text-text-secondary mb-2"
        >
          {label}
          {required && <span className="text-status-error ml-1">*</span>}
        </label>
      )}

      {/* Description */}
      {description && (
        <p className="text-sm text-text-muted mb-4">{description}</p>
      )}

      {/* Hidden file input */}
      <input
        ref={ref || fileInputRef}
        id={fileUploadId}
        type="file"
        accept={accept || variantConfig.accept}
        multiple={multiple && !variantConfig.single}
        onChange={handleFileSelect}
        disabled={disabled}
        className="sr-only"
        data-testid={testId}
      />

      {/* Drop zone */}
      <motion.div
        ref={dropZoneRef}
        className={dropZoneClasses}
        onClick={openFileDialog}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        animate={performanceTier === 'high' ? {
          scale: isDragOver ? 1.02 : 1,
        } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {/* Upload icon */}
        <motion.div
          className="text-accent-primary mb-3"
          animate={isDragOver ? { scale: 1.1 } : { scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {icon || <Upload className="w-8 h-8" />}
        </motion.div>

        {/* Upload text */}
        <div className="text-center">
          <p className="text-white font-medium mb-1">
            {isDragOver ? dragText : uploadText}
          </p>
          <p className="text-sm text-text-muted">
            {accept ? `Supported files: ${accept}` : 'All file types supported'}
          </p>
          {maxSize && (
            <p className="text-xs text-text-muted mt-1">
              Max size: {formatFileSize(maxSize)}
            </p>
          )}
        </div>

        {/* Loading indicator */}
        {isUploading && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 className="w-8 h-8 animate-spin text-accent-primary" />
          </motion.div>
        )}

        {/* Focus glow effect */}
        {adaptiveGlass.effects && performanceTier === 'high' && isDragOver && (
          <motion.div
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, transparent 100%)',
              filter: 'blur(10px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.div>

      {/* File list */}
      {currentFiles.length > 0 && (
        <motion.div
          className={cn(
            'mt-4',
            layout === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 gap-4' : 'space-y-2'
          )}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {currentFiles.map((uploadedFile) => (
            <motion.div
              key={uploadedFile.id}
              className={cn(
                'relative group transition-all duration-200',
                layout === 'grid' ? 'aspect-square' : 'flex items-center gap-3 p-3',
                'glass-light border border-glass-border rounded-lg'
              )}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              {/* Preview or icon */}
              <div className={cn(
                layout === 'grid' ? 'w-full h-full' : previewClasses
              )}>
                {uploadedFile.url && (isImageFile(uploadedFile.file) || isVideoFile(uploadedFile.file)) ? (
                  <div className="relative w-full h-full">
                    {isImageFile(uploadedFile.file) ? (
                      <img
                        src={uploadedFile.url}
                        alt={uploadedFile.file.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <video
                        src={uploadedFile.url}
                        className="w-full h-full object-cover rounded-lg"
                        muted
                      />
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center rounded-lg">
                      <div className="flex gap-2">
                        <motion.button
                          type="button"
                          className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Eye className="w-4 h-4 text-white" />
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(uploadedFile.id);
                          }}
                          className="p-2 bg-status-error/20 backdrop-blur-sm rounded-full hover:bg-status-error/30 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <X className="w-4 h-4 text-white" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-glass-light border border-glass-border rounded-lg">
                    {getFileIcon(uploadedFile.file)}
                  </div>
                )}
              </div>

              {/* File info (for list layout) */}
              {layout === 'list' && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {uploadedFile.file.name}
                  </p>
                  <p className="text-xs text-text-muted">
                    {formatFileSize(uploadedFile.file.size)}
                  </p>
                  {uploadedFile.error && (
                    <p className="text-xs text-status-error mt-1">
                      {uploadedFile.error}
                    </p>
                  )}
                </div>
              )}

              {/* Progress bar */}
              {uploadedFile.progress !== undefined && uploadedFile.progress < 100 && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 rounded-b-lg overflow-hidden">
                  <motion.div
                    className="h-full bg-accent-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${uploadedFile.progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}

              {/* Remove button (for grid layout) */}
              {layout === 'grid' && (
                <motion.button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(uploadedFile.id);
                  }}
                  className="absolute top-2 right-2 p-1 bg-status-error/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-3 h-3 text-white" />
                </motion.button>
              )}

              {/* Status indicators */}
              {uploadedFile.uploaded && (
                <div className="absolute top-2 left-2 p-1 bg-status-success/80 backdrop-blur-sm rounded-full">
                  <CheckCircle className="w-3 h-3 text-white" />
                </div>
              )}
              {uploadedFile.error && (
                <div className="absolute top-2 left-2 p-1 bg-status-error/80 backdrop-blur-sm rounded-full">
                  <AlertCircle className="w-3 h-3 text-white" />
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Helper text */}
      <AnimatePresence mode="wait">
        {(error || success || hint) && (
          <motion.div
            className="mt-2 flex items-start gap-2"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* State icon */}
            {(error || success) && (
              <div className="flex-shrink-0 mt-0.5">
                {error && <AlertCircle className="w-4 h-4 text-status-error" />}
                {success && <CheckCircle className="w-4 h-4 text-status-success" />}
              </div>
            )}
            
            {/* Message text */}
            <p className={cn(
              'text-sm',
              error && 'text-status-error',
              success && 'text-status-success',
              hint && 'text-text-muted'
            )}>
              {error || success || hint}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

GlassFileUpload.displayName = 'GlassFileUpload';

export { GlassFileUpload };

// Convenience components
export const ImageUpload = (props: Omit<GlassFileUploadProps, 'accept' | 'variant'>) => (
  <GlassFileUpload accept="image/*" variant="gallery" {...props} />
);

export const AvatarUpload = (props: Omit<GlassFileUploadProps, 'variant' | 'multiple'>) => (
  <GlassFileUpload variant="avatar" multiple={false} {...props} />
);

export const DocumentUpload = (props: Omit<GlassFileUploadProps, 'variant'>) => (
  <GlassFileUpload 
    variant="document" 
    accept=".pdf,.doc,.docx,.txt,.rtf"
    layout="list"
    {...props} 
  />
);