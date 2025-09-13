import React, { useState, useRef } from 'react';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { ProgressBar } from 'primereact/progressbar';
import { Card } from 'primereact/card';
import './FileUploader.css';

interface FileUploaderProps {
  onUpload: (file: File, content: string) => Promise<void>;
  accept?: string;
  maxFileSize?: number;
  category: string;
  disabled?: boolean;
}

export function FileUploader({ onUpload, accept = '.csv,.xlsx,.xls', maxFileSize = 10000000, category, disabled }: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ severity: 'success' | 'info' | 'warn' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = async (file: File) => {
    // Validate file type
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const allowedExtensions = accept.split(',').map(ext => ext.trim().replace('.', ''));
    
    if (!allowedExtensions.includes(fileExtension || '')) {
      setMessage({ 
        severity: 'error', 
        text: `Dateityp nicht unterstützt. Erlaubt: ${allowedExtensions.join(', ')}` 
      });
      return;
    }

    // Validate file size
    if (file.size > maxFileSize) {
      setMessage({ 
        severity: 'error', 
        text: `Datei zu groß. Maximum: ${(maxFileSize / 1000000).toFixed(1)} MB` 
      });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      // Read file content
      const fileContent = await readFileContent(file);
      await onUpload(file, fileContent);
      
      setMessage({ 
        severity: 'success', 
        text: `Datei ${file.name} erfolgreich hochgeladen!` 
      });

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setMessage({ 
        severity: 'error', 
        text: 'Upload-Fehler: ' + (error as Error).message 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="file-uploader">
      <div
        className={`upload-zone ${isDragOver ? 'drag-over' : ''} ${isUploading ? 'uploading' : ''} ${disabled ? 'disabled' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden-file-input"
          disabled={disabled || isUploading}
          title="Datei auswählen"
          aria-label="Datei für Upload auswählen"
        />
        
        {isUploading ? (
          <>
            <i className="pi pi-spin pi-spinner text-3xl mb-3 text-primary" />
            <p className="m-0 text-primary">Datei wird verarbeitet...</p>
            <ProgressBar mode="indeterminate" className="w-full mt-3" />
          </>
        ) : (
          <>
            <i className="pi pi-cloud-upload text-4xl mb-3 text-600" />
            <p className="m-0 text-600 font-medium">
              Datei hier ablegen oder klicken zum Auswählen
            </p>
            <p className="mt-2 text-sm text-500">
              Unterstützte Formate: {accept} • Max. {(maxFileSize / 1000000).toFixed(1)} MB
            </p>
            <Button
              label="Datei auswählen"
              icon="pi pi-folder-open"
              className="mt-3 p-button-outlined"
              onClick={(e) => {
                e.stopPropagation();
                openFileDialog();
              }}
              disabled={disabled}
            />
          </>
        )}
      </div>

      {message && (
        <div className="mt-3">
          <Message severity={message.severity} text={message.text} />
        </div>
      )}
    </Card>
  );
}