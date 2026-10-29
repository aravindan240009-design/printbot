import React, { useState, useRef } from 'react';
import { Upload, Camera, FileText, Trash2, ArrowUp, ArrowDown, Lock, CheckCircle2 } from 'lucide-react';
import { DocumentItem } from '../../types';
import { TranslationKeys } from '../../locales';
import { inspectFileMetadata } from '../../utils/pricing';

interface FileUploadZoneProps {
  files: DocumentItem[];
  activeFileId: string;
  onSetActiveFileId: (id: string) => void;
  onFilesAdded: (newFiles: DocumentItem[]) => void;
  onRemoveFile: (id: string) => void;
  onReorderFiles: (fromIndex: number, toIndex: number) => void;
  onClearAll: () => void;
  onPromptPasswordUnlock: (fileId: string) => void;
  t: TranslationKeys;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  files,
  activeFileId,
  onSetActiveFileId,
  onFilesAdded,
  onRemoveFile,
  onReorderFiles,
  onClearAll,
  onPromptPasswordUnlock,
  t,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setIsProcessing(true);

    const accepted: DocumentItem[] = [];
    const validExtensions = /\.(pdf|png|jpe?g|docx|xlsx|pptx)$/i;

    for (const file of Array.from(fileList)) {
      if (!validExtensions.test(file.name) || file.size > 100 * 1024 * 1024 || file.size === 0) {
        continue;
      }

      const { pageCount, isEncrypted } = await inspectFileMetadata(file);

      const newItem: DocumentItem = {
        id: crypto.randomUUID(),
        name: file.name,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        sizeBytes: file.size,
        format: file.name.split('.').pop()!.toUpperCase(),
        options: {
          copies: 1,
          colorMode: 'bw',
          paperSize: 'A4',
          paperGsm: '75',
          duplex: 'simplex',
          pageRange: 'all',
          nup: 1,
          finishing: 'none',
          photoPreset: 'standard',
          orientation: 'portrait',
        },
        source: file,
        assetId: 'asset_' + crypto.randomUUID().slice(0, 8),
        pageCount: pageCount || 1,
        isPasswordProtected: isEncrypted,
      };

      accepted.push(newItem);
    }

    if (accepted.length > 0) {
      onFilesAdded(accepted);
      if (!activeFileId) {
        onSetActiveFileId(accepted[0].id);
      }
    }
    setIsProcessing(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  return (
    <div className="pb-upload-section">
      {/* Drag & Drop Upload Zone */}
      <div
        className={`pb-upload-dropzone ${isDragging ? 'dragover' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.docx,.xlsx,.pptx"
          style={{ display: 'none' }}
          onChange={(e) => {
            processFiles(e.target.files);
            e.target.value = '';
          }}
        />

        <div className="pb-upload-icon-circle">
          <Upload size={32} />
        </div>
        <h3>{t.uploadDropzoneText}</h3>
        <p>{t.uploadFormats}</p>
        {isProcessing && (
          <span style={{ marginTop: '10px', color: 'var(--pb-brand)', fontSize: '0.82rem', fontWeight: 600 }}>
            {t.inspectingFiles}
          </span>
        )}
      </div>

      {/* Camera Capture Option */}
      <div className="pb-camera-btn-wrapper">
        <button
          type="button"
          className="pb-camera-btn"
          onClick={() => cameraInputRef.current?.click()}
        >
          <Camera size={18} color="var(--pb-brand)" />
          <span>{t.cameraCapture}</span>
        </button>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/png,image/jpeg"
          capture="environment"
          style={{ display: 'none' }}
          onChange={(e) => {
            processFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="pb-uploaded-files-container">
          <div className="pb-files-header-bar">
            <h3>
              {t.filesSelected}
              <span className="pb-file-count-badge">{files.length}</span>
            </h3>
            <button
              type="button"
              onClick={onClearAll}
              style={{
                background: 'transparent',
                border: 0,
                color: 'var(--pb-danger)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t.clearAll}
            </button>
          </div>

          <div className="pb-files-list">
            {files.map((file, idx) => {
              const isActive = file.id === activeFileId;
              return (
                <div
                  key={file.id}
                  className={`pb-file-item-card ${isActive ? 'active-selection' : ''}`}
                  onClick={() => onSetActiveFileId(file.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="pb-file-item-info">
                    <div className="pb-file-type-icon">
                      <FileText size={20} />
                    </div>
                    <div className="pb-file-meta-text">
                      <div className="pb-file-name-text">{file.name}</div>
                      <div className="pb-file-sub-details">
                        <span>{file.format}</span>
                        <span>•</span>
                        <span>{file.size}</span>
                        <span>•</span>
                        <span style={{ color: 'var(--pb-success)', fontWeight: 600 }}>
                          {file.pageCount} {file.pageCount === 1 ? 'page' : 'pages'}
                        </span>
                        {file.isPasswordProtected && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPromptPasswordUnlock(file.id);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              border: 0,
                              background: 'var(--pb-warning-soft)',
                              color: 'var(--pb-warning)',
                              fontSize: '0.72rem',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 700,
                            }}
                          >
                            <Lock size={11} /> Password
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pb-file-actions-row" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="pb-icon-btn"
                      disabled={idx === 0}
                      onClick={() => onReorderFiles(idx, idx - 1)}
                      aria-label="Move file up"
                    >
                      <ArrowUp size={15} />
                    </button>
                    <button
                      type="button"
                      className="pb-icon-btn"
                      disabled={idx === files.length - 1}
                      onClick={() => onReorderFiles(idx, idx + 1)}
                      aria-label="Move file down"
                    >
                      <ArrowDown size={15} />
                    </button>
                    <button
                      type="button"
                      className="pb-icon-btn delete"
                      onClick={() => onRemoveFile(file.id)}
                      aria-label={`Remove ${file.name}`}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
