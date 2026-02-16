"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Image as ImageIcon,
  Download,
  X,
  File,
  FileSpreadsheet,
  Eye,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  List,
  Shield,
  Briefcase,
  Landmark,
  Building2,
  FileCheck,
} from "lucide-react";
import { UploadedDocument } from "@/lib/types";
import { cn } from "@/lib/utils";

interface DocumentViewerProps {
  documents: UploadedDocument[];
  applicantName: string;
}

// Maps raw Firestore category values to display groups
const CATEGORY_GROUP_MAP: Record<string, string> = {
  emirates_id_front: "identity",
  emirates_id_back: "identity",
  passport: "identity",
  visa: "identity",
  salary_certificate: "income",
  bank_statements: "bank",
  labour_contract: "income",
  trade_license: "income",
  moa: "income",
  audited_financials: "income",
  property_mou: "property",
  title_deed: "property",
  spa: "property",
  identity: "identity",
  income: "income",
  bank: "bank",
  property: "property",
  other: "other",
};

const CATEGORY_DISPLAY: Record<string, { label: string; icon: typeof Shield; color: string }> = {
  identity: {
    label: "Identity",
    icon: Shield,
    color: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  income: {
    label: "Income",
    icon: Briefcase,
    color: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  bank: {
    label: "Bank",
    icon: Landmark,
    color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  property: {
    label: "Property",
    icon: Building2,
    color: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
  other: {
    label: "Other",
    icon: FileCheck,
    color: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  },
};

function getFileIcon(mimeType: string) {
  if (mimeType?.startsWith("image/")) return ImageIcon;
  if (mimeType?.includes("pdf")) return FileText;
  if (mimeType?.includes("sheet") || mimeType?.includes("excel")) return FileSpreadsheet;
  if (mimeType?.includes("word") || mimeType?.includes("document")) return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

// Infer document group from filename when category is missing/other
function inferGroupFromFilename(fileName: string): string {
  const lower = fileName.toLowerCase();

  if (
    lower.includes("eid") ||
    lower.includes("emirates") ||
    lower.includes("passport") ||
    lower.includes("visa") ||
    lower.includes("id card") ||
    lower.includes("id_front") ||
    lower.includes("id_back")
  ) {
    return "identity";
  }
  if (
    lower.includes("salary") ||
    lower.includes("payslip") ||
    lower.includes("pay slip") ||
    lower.includes("income") ||
    lower.includes("employment") ||
    lower.includes("trade") ||
    lower.includes("license") ||
    lower.includes("labour") ||
    lower.includes("moa") ||
    lower.includes("financial")
  ) {
    return "income";
  }
  if (lower.includes("bank") || lower.includes("statement") || lower.includes("account")) {
    return "bank";
  }
  if (
    lower.includes("property") ||
    lower.includes("title") ||
    lower.includes("deed") ||
    lower.includes("contract") ||
    lower.includes("agreement") ||
    lower.includes("mou") ||
    lower.includes("spa") ||
    lower.includes("sale")
  ) {
    return "property";
  }

  return "other";
}

function resolveGroup(doc: UploadedDocument): string {
  // 1. Try the explicit group map
  const mapped = CATEGORY_GROUP_MAP[doc.category];
  if (mapped && mapped !== "other") return mapped;

  // 2. Infer from filename
  return inferGroupFromFilename(doc.fileName);
}

function getGroupInfo(group: string) {
  return CATEGORY_DISPLAY[group] || CATEGORY_DISPLAY.other;
}

export function DocumentViewer({ documents, applicantName }: DocumentViewerProps) {
  const [selectedImage, setSelectedImage] = useState<UploadedDocument | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [activeGroup, setActiveGroup] = useState<string>("all");

  const images = documents.filter((doc) => doc.mimeType?.startsWith("image/"));

  const documentsByGroup = useMemo(() => {
    const groups: Record<string, UploadedDocument[]> = {};
    for (const doc of documents) {
      const g = resolveGroup(doc);
      if (!groups[g]) groups[g] = [];
      groups[g].push(doc);
    }
    return groups;
  }, [documents]);

  const filteredDocuments = useMemo(() => {
    if (activeGroup === "all") return documents;
    return documentsByGroup[activeGroup] || [];
  }, [activeGroup, documents, documentsByGroup]);

  const handleImageClick = (doc: UploadedDocument, index: number) => {
    setSelectedImage(doc);
    setImageIndex(index);
  };

  const handleDownload = async (doc: UploadedDocument) => {
    if (!doc.downloadURL) return;
    try {
      const response = await fetch(doc.downloadURL);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(doc.downloadURL, "_blank");
    }
  };

  const handleDownloadAll = async () => {
    for (const doc of documents) {
      if (doc.downloadURL) {
        await handleDownload(doc);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  };

  const navigateImage = (direction: "prev" | "next") => {
    const newIndex = direction === "prev" ? imageIndex - 1 : imageIndex + 1;
    if (newIndex >= 0 && newIndex < images.length) {
      setImageIndex(newIndex);
      setSelectedImage(images[newIndex]);
    }
  };

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-20 w-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-5">
          <FileText className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Documents Uploaded</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          This application doesn&apos;t have any documents attached yet.
        </p>
      </div>
    );
  }

  // Build group tabs with counts & icons
  const groupEntries = Object.entries(documentsByGroup).sort(([a], [b]) => {
    const order = ["identity", "income", "bank", "property", "other"];
    return order.indexOf(a) - order.indexOf(b);
  });

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {documents.length} document{documents.length !== 1 ? "s" : ""} uploaded by{" "}
            <span className="text-foreground font-medium">{applicantName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border bg-muted/30 p-0.5">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                viewMode === "list" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "rounded-md p-1.5 transition-colors",
                viewMode === "grid" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={handleDownloadAll}>
            <Download className="h-4 w-4 mr-2" />
            Download All
          </Button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveGroup("all")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
            activeGroup === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-muted/30 text-muted-foreground border-border hover:text-foreground hover:bg-muted/60"
          )}
        >
          All ({documents.length})
        </button>
        {groupEntries.map(([group, docs]) => {
          const info = getGroupInfo(group);
          const Icon = info.icon;
          return (
            <button
              key={group}
              onClick={() => setActiveGroup(group)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
                activeGroup === group
                  ? "bg-primary text-primary-foreground border-primary"
                  : cn("hover:bg-muted/60", info.color)
              )}
            >
              <Icon className="h-3 w-3" />
              {info.label} ({docs.length})
            </button>
          );
        })}
      </div>

      {/* Document List */}
      {viewMode === "list" ? (
        <div className="space-y-1.5">
          {filteredDocuments.map((doc) => {
            const Icon = getFileIcon(doc.mimeType);
            const isImage = doc.mimeType?.startsWith("image/");
            const group = resolveGroup(doc);
            const groupInfo = getGroupInfo(group);

            return (
              <div
                key={doc.id}
                className="group flex items-center gap-4 rounded-xl border bg-card p-3 transition-colors hover:bg-muted/40"
              >
                {/* Thumbnail */}
                <div className="h-12 w-12 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {isImage && doc.downloadURL ? (
                    <img
                      src={doc.downloadURL}
                      alt={doc.fileName}
                      className="h-full w-full object-cover rounded-lg"
                      loading="lazy"
                    />
                  ) : (
                    <Icon className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.fileName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="secondary"
                      className={cn("text-[11px] px-2 py-0 border", groupInfo.color)}
                    >
                      {groupInfo.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(doc.fileSize)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isImage && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        const idx = images.findIndex((img) => img.id === doc.id);
                        handleImageClick(doc, idx);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDownload(doc)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {filteredDocuments.map((doc) => {
            const Icon = getFileIcon(doc.mimeType);
            const isImage = doc.mimeType?.startsWith("image/");
            const imageIndexInAll = images.findIndex((img) => img.id === doc.id);
            const group = resolveGroup(doc);
            const groupInfo = getGroupInfo(group);

            return (
              <div
                key={doc.id}
                className="group relative rounded-xl border bg-card overflow-hidden transition-colors hover:border-primary/50"
              >
                {isImage && doc.downloadURL ? (
                  <div
                    className="aspect-[4/3] cursor-pointer relative"
                    onClick={() => handleImageClick(doc, imageIndexInAll)}
                  >
                    <img
                      src={doc.downloadURL}
                      alt={doc.fileName}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Eye className="h-8 w-8 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[4/3] flex flex-col items-center justify-center p-4 bg-muted/30">
                    <Icon className="h-10 w-10 text-muted-foreground/60 mb-2" />
                    <p className="text-xs text-center text-muted-foreground line-clamp-2 px-2">
                      {doc.fileName}
                    </p>
                  </div>
                )}

                <div className="p-3">
                  <p className="text-sm font-medium truncate">{doc.fileName}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge
                      variant="secondary"
                      className={cn("text-[11px] px-2 py-0 border", groupInfo.color)}
                    >
                      {groupInfo.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(doc.fileSize)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 overflow-hidden">
          <DialogTitle className="sr-only">
            {selectedImage?.fileName || "Image Preview"}
          </DialogTitle>
          <div className="relative h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between p-4 border-b bg-background">
              <div className="flex items-center gap-3">
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{selectedImage?.fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedImage ? formatFileSize(selectedImage.fileSize) : ""}
                    {selectedImage && (
                      <>
                        {" "}
                        &middot; {getGroupInfo(resolveGroup(selectedImage)).label}
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedImage && handleDownload(selectedImage)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setSelectedImage(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Image */}
            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
              {selectedImage?.downloadURL && (
                <img
                  src={selectedImage.downloadURL}
                  alt={selectedImage.fileName}
                  className="max-w-full max-h-full object-contain"
                />
              )}

              {images.length > 1 && (
                <>
                  <button
                    onClick={() => navigateImage("prev")}
                    disabled={imageIndex === 0}
                    className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  >
                    <ChevronLeft className="h-6 w-6 text-white" />
                  </button>
                  <button
                    onClick={() => navigateImage("next")}
                    disabled={imageIndex === images.length - 1}
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                  >
                    <ChevronRight className="h-6 w-6 text-white" />
                  </button>
                </>
              )}

              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/60 text-white text-sm">
                  {imageIndex + 1} / {images.length}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="h-20 border-t bg-background p-2 overflow-x-auto">
                <div className="flex gap-2">
                  {images.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => {
                        setImageIndex(idx);
                        setSelectedImage(img);
                      }}
                      className={cn(
                        "h-14 w-14 rounded overflow-hidden flex-shrink-0 border-2 transition-colors",
                        idx === imageIndex
                          ? "border-primary"
                          : "border-transparent hover:border-muted-foreground"
                      )}
                    >
                      <img
                        src={img.downloadURL}
                        alt={img.fileName}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DocumentViewer;
