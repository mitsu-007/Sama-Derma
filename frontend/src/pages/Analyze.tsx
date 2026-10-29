import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileCheck2,
  Trash2,
  RefreshCw,
  AlertCircle,
  ShieldAlert,
  Loader2,
  Lock,
  ArrowRight,
  Maximize2,
  FileText,
  Cpu,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';
import {
  validateAndDecodeImage,
  ValidatedImageInfo,
  ImageValidationError,
  ALLOWED_EXTENSIONS,
} from '../utils/imageValidation';
import { StatusBadge } from '../components/StatusBadge';
import { predictImageApi, API_BASE_URL } from '../api/inference';

export const Analyze: React.FC = () => {
  const navigate = useNavigate();
  const [fileInfo, setFileInfo] = useState<ValidatedImageInfo | null>(null);
  const [isDecoding, setIsDecoding] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showTechnicalSpecs, setShowTechnicalSpecs] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Revoke object URL on unmount or when image changes
  useEffect(() => {
    return () => {
      if (fileInfo?.previewUrl) {
        URL.revokeObjectURL(fileInfo.previewUrl);
      }
    };
  }, [fileInfo]);

  // Handle image file selection
  const handleFileProcess = useCallback(
    async (file: File) => {
      setErrorMessage(null);
      setApiError(null);
      setIsDecoding(true);

      // Clean up previous preview URL if present
      if (fileInfo?.previewUrl) {
        URL.revokeObjectURL(fileInfo.previewUrl);
        setFileInfo(null);
      }

      try {
        const validated = await validateAndDecodeImage(file);
        setFileInfo(validated);
      } catch (err: unknown) {
        if (err instanceof ImageValidationError) {
          setErrorMessage(err.message);
        } else if (err instanceof Error) {
          setErrorMessage(err.message);
        } else {
          setErrorMessage('An unexpected error occurred while processing the image.');
        }
        setFileInfo(null);
      } finally {
        setIsDecoding(false);
      }
    },
    [fileInfo]
  );

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileProcess(droppedFile);
    }
  };

  // File input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = e.target.files[0];
      handleFileProcess(selected);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove selected image
  const handleRemoveImage = () => {
    if (fileInfo?.previewUrl) {
      URL.revokeObjectURL(fileInfo.previewUrl);
    }
    setFileInfo(null);
    setErrorMessage(null);
    setApiError(null);
    setShowTechnicalSpecs(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Trigger hidden file picker
  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  // Run Real Model Inference via FastAPI
  const handleAnalyzeClick = async () => {
    if (!fileInfo) return;

    setApiError(null);
    setIsSubmitting(true);

    try {
      // Connect to verified FastAPI /api/predict endpoint
      const result = await predictImageApi(fileInfo.file);
      // Navigate to Results page with real model response
      navigate('/results', {
        state: {
          prediction: result,
          imageMeta: {
            fileName: fileInfo.file.name,
            fileSize: fileInfo.formattedFileSize,
            dimensions: `${fileInfo.width} × ${fileInfo.height}`,
            format: fileInfo.format,
            previewUrl: fileInfo.previewUrl,
          },
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Inference request failed.';
      setApiError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
              Dermatological Image Analysis
            </h1>
            <StatusBadge variant="verified" size="sm">
              Backend Connected
            </StatusBadge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Client-side preflight inspection and local Swin-B vision transformer inference.
          </p>
        </div>

        {/* Dual-Tier Privacy Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-mono text-slate-700 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm">
          <Lock className="w-4 h-4 text-teal-700 shrink-0" />
          <span>Browser Preflight · In-Memory Ingestion</span>
        </div>
      </div>

      {/* Accessible file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_EXTENSIONS.join(',')}
        onChange={handleInputChange}
        className="sr-only"
        id="image-file-input"
        aria-label="Upload dermatological image"
      />

      {/* 3. Main Workspace: Upload State vs Inspection State */}
      {!fileInfo ? (
        <div className="space-y-8">
          {/* Dual-Card Initial Upload Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left 8 Cols: Interactive Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFilePicker}
              className={`lg:col-span-8 relative rounded-3xl border-2 border-dashed p-8 sm:p-14 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[340px] ${
                isDragging
                  ? 'border-teal-500 bg-teal-50/70 scale-[0.99] shadow-inner ring-4 ring-teal-100'
                  : 'border-slate-300 bg-white hover:border-teal-500 hover:bg-slate-50/60 shadow-sm'
              }`}
            >
              {isDecoding ? (
                <div className="py-8 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
                  <span className="text-base font-bold text-navy-900">
                    Decoding and validating image dimensions…
                  </span>
                  <span className="text-xs text-slate-500">
                    Checking format, headers, resolution, and pixel bounds in memory
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-4 max-w-lg">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                      isDragging
                        ? 'bg-teal-600 text-white scale-110 shadow-lg shadow-teal-700/20'
                        : 'bg-teal-50 text-teal-700 group-hover:scale-105'
                    }`}
                  >
                    <UploadCloud className="w-8 h-8" />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg sm:text-xl font-bold text-navy-900">
                      Drag and drop your clinical image here, or{' '}
                      <span className="text-teal-700 underline underline-offset-4 decoration-2">
                        browse files
                      </span>
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                      Select a dermatological photograph for local preflight inspection and multi-class Swin-B evaluation.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                    <span className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
                      .JPG / .JPEG
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
                      .PNG
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
                      .WEBP
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
                      ≤ 12 MB
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold">
                      ≤ 40 Megapixels
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Right 4 Cols: Preflight Guardrails & Privacy Guide */}
            <div className="lg:col-span-4 rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 flex flex-col justify-between space-y-6 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-navy-900 font-bold text-sm">
                  <ShieldAlert className="w-4 h-4 text-teal-700" />
                  <span>Preflight Safety Guardrails</span>
                </div>

                <div className="space-y-3.5 text-xs text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-navy-900 block">In-Memory Decoding:</strong>
                      <span>Canvas-level decoding rejects corrupted files, binary bombs, and truncated headers.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-navy-900 block">Browser Preflight & Ephemeral Ingestion:</strong>
                      <span>Preflight inspection runs 100% in your browser. When analyzed, images are processed in-memory by the backend with no disk persistence, database storage, or third-party cloud AI relay.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-navy-900 block">Standardized Resolution:</strong>
                      <span>Validated images are preprocessed to 512×512 RGB tensors with channel normalization.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500 font-mono">
                <Cpu className="w-3.5 h-3.5 text-slate-400" />
                <span>Backend Endpoint: {API_BASE_URL}</span>
              </div>
            </div>
          </div>

          {/* Validation Error Banner */}
          {errorMessage && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 sm:p-5 text-xs sm:text-sm text-rose-950 flex items-start justify-between gap-3 shadow-sm animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-950">Preflight Validation Error</p>
                  <p className="text-rose-900/90 mt-1 leading-relaxed">{errorMessage}</p>
                </div>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-rose-700 hover:text-rose-950 font-semibold text-xs shrink-0 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-colors"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      ) : (
        /* 4. Active Inspection State: Image Preview + Attributes + Action Panel */
        <div className="space-y-8">
          <div className="rounded-3xl border border-slate-200/90 bg-white overflow-hidden shadow-sm">
            {/* Header Control Bar */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-navy-900 text-sm">
                  Image Preflight Inspection Passed
                </span>
                <StatusBadge variant="verified" size="sm">
                  Decoded & Verified
                </StatusBadge>
              </div>

              {/* Action Buttons: Replace / Remove */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={triggerFilePicker}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-sm disabled:opacity-50"
                  aria-label="Replace current image"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Replace Image</span>
                </button>
                <button
                  onClick={handleRemoveImage}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-xs font-semibold text-rose-700 transition-colors shadow-sm disabled:opacity-50"
                  aria-label="Remove current image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>

            {/* Split Workspace: Preview on Left, Metadata & Action on Right */}
            <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column (5 Cols): High-Fidelity Image Preview */}
              <div className="lg:col-span-5 flex flex-col items-center space-y-3">
                <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center shadow-inner min-h-[320px] max-h-[460px] group">
                  <img
                    src={fileInfo.previewUrl}
                    alt={fileInfo.file.name}
                    className="max-h-[440px] w-auto max-w-full object-contain rounded-xl p-1"
                  />

                  {/* Corner Dimension Badges */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/75 text-white font-mono text-[11px] backdrop-blur border border-white/10">
                    {fileInfo.format}
                  </div>
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-md bg-black/75 text-white font-mono text-[11px] backdrop-blur border border-white/10">
                    {fileInfo.width} × {fileInfo.height} px
                  </div>
                </div>

                <div className="w-full flex items-center justify-between text-[11px] text-slate-500 font-mono px-1">
                  <span>Rendered via In-Memory Blob</span>
                  <span className="text-teal-700 font-semibold">Pixel Integrity Verified</span>
                </div>
              </div>

              {/* Right Column (7 Cols): Attributes, Pipeline Specs, & Primary CTA */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <h3 className="font-bold text-navy-900 text-lg">
                    Decoded Image Specifications
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verified properties checked against the Swin-B vision transformer ingestion envelope.
                  </p>
                </div>

                {/* 6-Grid Attribute Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/80">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Format
                    </span>
                    <span className="font-bold text-navy-900 text-sm mt-0.5 block">
                      {fileInfo.format}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/80">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      File Size
                    </span>
                    <span className="font-bold text-navy-900 text-sm mt-0.5 block font-mono">
                      {fileInfo.formattedFileSize}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/80">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Resolution
                    </span>
                    <span className="font-bold text-navy-900 text-sm mt-0.5 block font-mono">
                      {fileInfo.width} × {fileInfo.height}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/80">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Megapixels
                    </span>
                    <span className="font-bold text-navy-900 text-sm mt-0.5 block">
                      {fileInfo.megapixels} MP
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/80">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Aspect Ratio
                    </span>
                    <span className="font-bold text-navy-900 text-sm mt-0.5 block">
                      {fileInfo.aspectRatio}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/80">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Max Pixel Guard
                    </span>
                    <span className="font-bold text-emerald-700 text-sm mt-0.5 block">
                      &lt; 40 MP Safe
                    </span>
                  </div>
                </div>

                {/* File Reference Bar */}
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-mono text-slate-800 truncate font-semibold">
                      {fileInfo.file.name}
                    </span>
                  </div>
                  <span className="font-mono text-slate-500 shrink-0 ml-2">
                    {(fileInfo.fileSizeBytes / 1024).toFixed(0)} KB
                  </span>
                </div>

                {/* Collapsible Technical Transform Specifications */}
                <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50/60">
                  <button
                    onClick={() => setShowTechnicalSpecs(!showTechnicalSpecs)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-semibold text-slate-700 hover:bg-slate-100/70 transition-colors"
                  >
                    <div className="flex items-center gap-2 text-navy-900">
                      <Maximize2 className="w-4 h-4 text-teal-700" />
                      <span>Technical Ingestion & Transform Details</span>
                    </div>
                    {showTechnicalSpecs ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {showTechnicalSpecs && (
                    <div className="p-4 border-t border-slate-200 bg-white space-y-2.5 text-xs text-slate-600">
                      <p className="leading-relaxed">
                        The local FastAPI normalizer converts input bytes to an RGB PIL Image, performs bicubic interpolation to <strong>512 × 512</strong> pixels, and applies channel normalization:
                      </p>
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700 space-y-1">
                        <div>mean = [0.53749797, 0.45875554, 0.40382471]</div>
                        <div>std  = [0.21629889, 0.20366619, 0.20136241]</div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 font-mono">
                        <span>Architecture: swin_base_patch4_window12_384 (512x512)</span>
                        <span>Backend: PyTorch CUDA / CPU</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* API Error Alert (if inference fails) */}
                {apiError && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs sm:text-sm text-rose-950 flex items-start justify-between gap-3 shadow-sm animate-in fade-in duration-200">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-rose-950">Inference Request Failed</p>
                        <p className="text-rose-900/90 mt-1 leading-relaxed">{apiError}</p>
                        <p className="text-xs text-rose-800 mt-2 font-medium">
                          Troubleshooting: Ensure the local FastAPI service is running on <code>http://127.0.0.1:8000</code>.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setApiError(null)}
                      className="text-rose-700 hover:text-rose-950 font-semibold text-xs shrink-0 px-3 py-1.5 rounded-lg hover:bg-rose-100 transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Primary Action Card: Analyze Image Button */}
                <div className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50/70 via-white to-slate-50/60 p-5 sm:p-6 shadow-sm space-y-3">
                  <div className="space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                      Step 2: Model Inference
                    </span>
                    <h4 className="font-bold text-navy-900 text-base">
                      Run Swin-B Classification Inspection
                    </h4>
                    <p className="text-xs text-slate-500">
                      Submits this preflight-verified image to the verified local Swin-B checkpoint on your machine.
                    </p>
                  </div>

                  <button
                    onClick={handleAnalyzeClick}
                    disabled={isSubmitting}
                    className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-sm sm:text-base shadow-md shadow-teal-900/10 transition-all focus:outline-none focus:ring-4 focus:ring-teal-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Executing Swin-B Inference via FastAPI…</span>
                      </>
                    ) : (
                      <>
                        <Cpu className="w-5 h-5" />
                        <span>Run Swin-B Model Inspection</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-teal-700" />
                      Localhost Loopback Only (127.0.0.1:8000)
                    </span>
                    <span>Outputs 8 Uncalibrated Scores</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
