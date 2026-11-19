import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, FileText, Loader2 } from 'lucide-react';
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { DocumentItem } from '../../types';

interface DocumentPreviewProps {
  file: DocumentItem;
  onPageCountChange: (fileId: string, pageCount: number) => void;
  onPromptPasswordUnlock: (fileId: string) => void;
}

type PreviewStatus = 'loading' | 'ready' | 'error' | 'password' | 'unsupported';

const isPdfFile = (file: DocumentItem) =>
  file.source.type === 'application/pdf' || file.format.toLowerCase() === 'pdf' || /\.pdf$/i.test(file.name);

const isImageFile = (file: DocumentItem) =>
  file.source.type.startsWith('image/') || /\.(png|jpe?g)$/i.test(file.name);

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  file,
  onPageCountChange,
  onPromptPasswordUnlock,
}) => {
  const isPdf = isPdfFile(file);
  const isImage = isImageFile(file);
  const isBw = file.options?.colorMode !== 'color';
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewAreaRef = useRef<HTMLDivElement>(null);
  const [objectUrl, setObjectUrl] = useState<{ source: File; url: string } | null>(null);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(Math.max(1, file.pageCount || 1));
  const [previewWidth, setPreviewWidth] = useState(0);
  const [status, setStatus] = useState<PreviewStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [passwordRequired, setPasswordRequired] = useState(false);
  const fileUrl = objectUrl?.source === file.source ? objectUrl.url : '';

  useEffect(() => {
    const url = URL.createObjectURL(file.source);
    setObjectUrl({ source: file.source, url });
    return () => URL.revokeObjectURL(url);
  }, [file.source]);

  useEffect(() => {
    setPageNumber(1);
    setPageCount(Math.max(1, file.pageCount || 1));
  }, [file.id]);

  useEffect(() => {
    const area = previewAreaRef.current;
    if (!area) return;

    const updateWidth = () => setPreviewWidth(Math.floor(area.clientWidth));
    updateWidth();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }

    const observer = new ResizeObserver(([entry]) => {
      setPreviewWidth(Math.floor(entry.contentRect.width));
    });
    observer.observe(area);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setPdfDocument(null);
    setErrorMessage('');
    setPasswordRequired(false);

    if (!fileUrl) {
      setStatus('loading');
      return;
    }

    if (!isPdf) {
      setStatus(isImage ? 'loading' : 'unsupported');
      return;
    }

    if (file.isPasswordProtected && !file.unlockedPassword) {
      setStatus('password');
      return;
    }

    setStatus('loading');
    let disposed = false;
    let loadingTask: PDFDocumentLoadingTask | undefined;

    const loadPdf = async () => {
      try {
        const pdfjs = await import('pdfjs-dist');
        if (disposed) return;

        pdfjs.GlobalWorkerOptions.workerSrc = pdfWorker;
        loadingTask = pdfjs.getDocument({
          url: fileUrl,
          password: file.unlockedPassword,
          standardFontDataUrl: `${import.meta.env.BASE_URL}pdfjs/standard_fonts/`,
        });
        const document = await loadingTask.promise;
        if (disposed) {
          void document.destroy();
          return;
        }

        setPdfDocument(document);
        setPageCount(document.numPages);
        onPageCountChange(file.id, document.numPages);
      } catch (error: unknown) {
        if (disposed) return;

        const requiresPassword = error instanceof Error && error.name === 'PasswordException';
        setPasswordRequired(requiresPassword);
        setErrorMessage(
          requiresPassword
            ? 'That password did not unlock this PDF. Try again.'
            : 'We could not open this PDF. Try selecting the file again.'
        );
        setStatus('error');
      }
    };

    void loadPdf();

    return () => {
      disposed = true;
      if (loadingTask) void loadingTask.destroy();
    };
  }, [
    file.id,
    file.isPasswordProtected,
    file.source,
    file.unlockedPassword,
    fileUrl,
    isImage,
    isPdf,
  ]);

  useEffect(() => {
    if (!pdfDocument || !canvasRef.current || previewWidth < 1) return;

    let disposed = false;
    let renderTask: RenderTask | undefined;
    setStatus('loading');

    const renderPage = async () => {
      try {
        const page = await pdfDocument.getPage(pageNumber);
        if (disposed) return;

        const baseViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(1.35, (previewWidth - 32) / baseViewport.width);
        const viewport = page.getViewport({ scale });
        const outputScale = Math.min(window.devicePixelRatio || 1, 2);
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.width = Math.ceil(viewport.width * outputScale);
        canvas.height = Math.ceil(viewport.height * outputScale);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas rendering is unavailable.');

        renderTask = page.render({
          canvasContext: context,
          viewport,
          transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0],
        });
        await renderTask.promise;
        if (!disposed) setStatus('ready');
      } catch {
        if (!disposed) {
          setErrorMessage('This page could not be rendered. Try selecting the file again.');
          setStatus('error');
        }
      }
    };

    void renderPage();
    return () => {
      disposed = true;
      renderTask?.cancel();
    };
  }, [pageNumber, pdfDocument, previewWidth]);

  const handleImageError = () => {
    setErrorMessage('This image could not be loaded. Try selecting the file again.');
    setStatus('error');
  };

  return (
    <section className="pb-document-preview" aria-label="Document preview">
      <header className="pb-preview-header">
        <div className="pb-preview-file-icon" aria-hidden="true">
          <FileText size={19} />
        </div>
        <div className="pb-preview-file-meta">
          <h3 title={file.name}>{file.name}</h3>
          <p>
            {file.format} <span aria-hidden="true">·</span> {file.size} <span aria-hidden="true">·</span>{' '}
            {pageCount} {pageCount === 1 ? 'page' : 'pages'}
          </p>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 750,
              padding: '3px 9px',
              borderRadius: '999px',
              background: isBw ? '#f1f5f9' : 'rgba(37, 99, 235, 0.1)',
              color: isBw ? '#475569' : '#2563eb',
              border: isBw ? '1px solid #cbd5e1' : '1px solid rgba(37, 99, 235, 0.25)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {isBw ? '⚫ Black & White' : '🎨 Color'}
          </span>
        </div>
      </header>

      <div className="pb-preview-area" ref={previewAreaRef}>
        {isImage && fileUrl && status !== 'error' && (
          <img
            className="pb-preview-image"
            src={fileUrl}
            alt={`${file.name} preview`}
            style={{
              filter: isBw ? 'grayscale(100%) contrast(108%)' : 'none',
              transition: 'filter 0.25s ease-in-out',
            }}
            onLoad={() => setStatus('ready')}
            onError={handleImageError}
          />
        )}

        {isPdf && fileUrl && status !== 'error' && status !== 'password' && (
          <canvas
            ref={canvasRef}
            className="pb-preview-canvas"
            role="img"
            aria-label={`${file.name}, page ${pageNumber} of ${pageCount}`}
            style={{
              filter: isBw ? 'grayscale(100%) contrast(108%)' : 'none',
              transition: 'filter 0.25s ease-in-out',
            }}
          />
        )}

        {status === 'loading' && (
          <div className="pb-preview-message" role="status" aria-live="polite">
            <Loader2 className="pb-preview-spinner" size={22} />
            <span>Loading preview...</span>
          </div>
        )}

        {status === 'password' && (
          <div className="pb-preview-message">
            <FileText size={30} />
            <p>This PDF needs a password before it can be previewed.</p>
            <button type="button" className="pb-preview-action" onClick={() => onPromptPasswordUnlock(file.id)}>
              Unlock PDF
            </button>
          </div>
        )}

        {status === 'unsupported' && (
          <div className="pb-preview-message">
            <FileText size={30} />
            <p>Preview is unavailable for this file type. You can still configure and print it.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="pb-preview-message" role="alert">
            <AlertCircle size={26} />
            <p>{errorMessage}</p>
            {passwordRequired && (
              <button type="button" className="pb-preview-action" onClick={() => onPromptPasswordUnlock(file.id)}>
                Try password again
              </button>
            )}
          </div>
        )}
      </div>

      {isPdf && (
        <footer className="pb-preview-pagination">
          <button
            type="button"
            aria-label="Previous page"
            disabled={pageNumber <= 1 || status === 'loading' || status === 'error' || status === 'password'}
            onClick={() => setPageNumber((current) => Math.max(1, current - 1))}
          >
            <ChevronLeft size={18} />
          </button>
          <span aria-live="polite">
            Page {pageNumber} of {pageCount}
          </span>
          <button
            type="button"
            aria-label="Next page"
            disabled={pageNumber >= pageCount || status === 'loading' || status === 'error' || status === 'password'}
            onClick={() => setPageNumber((current) => Math.min(pageCount, current + 1))}
          >
            <ChevronRight size={18} />
          </button>
        </footer>
      )}
    </section>
  );
};
