import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, ExternalLink, ZoomIn, ZoomOut, X, Download, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DocumentPreviewProps {
  url: string | null;
  title: string;
  documentType?: string;
  className?: string;
  onView?: () => void;
}

// Check if URL is an image
function isImageUrl(url: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  const lowerUrl = url.toLowerCase();
  return imageExtensions.some(ext => lowerUrl.includes(ext)) || 
         lowerUrl.includes('image/') ||
         lowerUrl.includes('/images/');
}

// Check if URL is a PDF
function isPdfUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes('.pdf') || lowerUrl.includes('application/pdf');
}

export function DocumentPreview({
  url,
  title,
  documentType,
  className,
  onView,
}: DocumentPreviewProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  if (!url) {
    return (
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 bg-accent/50 rounded-lg">
            <p className="text-sm text-muted-foreground">No document uploaded</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isImage = isImageUrl(url);
  const isPdf = isPdfUrl(url);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  const handleOpenExternal = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
    onView?.();
  };

  return (
    <>
      <Card className={cn('overflow-hidden', className)}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {isImage ? (
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              ) : (
                <FileText className="h-4 w-4 text-muted-foreground" />
              )}
              {title}
              {documentType && (
                <span className="text-xs text-muted-foreground font-normal">
                  ({documentType})
                </span>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isImage ? (
            <div className="relative group">
              <div 
                className="relative h-48 bg-accent/30 rounded-lg overflow-hidden cursor-pointer"
                onClick={() => setIsZoomed(true)}
              >
                <img
                  src={url}
                  alt={title}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder-document.png';
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setIsZoomed(true)}
                >
                  <ZoomIn className="h-4 w-4 mr-1" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenExternal}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : isPdf ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center h-32 bg-accent/30 rounded-lg">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-destructive/70 mx-auto mb-2" />
                  <p className="text-sm font-medium">PDF Document</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleOpenExternal}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View PDF
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center h-32 bg-accent/30 rounded-lg">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">Document</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleOpenExternal}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Document
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Zoom Dialog for Images */}
      <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] p-0">
          <DialogHeader className="p-4 pb-2 border-b">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 0.5}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetZoom}
                >
                  {Math.round(zoomLevel * 100)}%
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 3}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleOpenExternal}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsZoomed(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
          <div className="overflow-auto max-h-[calc(95vh-80px)] p-4 flex items-center justify-center bg-accent/20">
            <img
              src={url}
              alt={title}
              className="transition-transform duration-200"
              style={{ transform: `scale(${zoomLevel})` }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Inline document preview for tables or compact views
export function InlineDocumentPreview({
  url,
  title,
  onView,
}: {
  url: string | null;
  title?: string;
  onView?: () => void;
}) {
  if (!url) {
    return (
      <span className="text-sm text-muted-foreground">No document</span>
    );
  }

  const isImage = isImageUrl(url);

  const handleClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
    onView?.();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className="h-auto p-1"
    >
      {isImage ? (
        <div className="flex items-center gap-2">
          <img
            src={url}
            alt={title || 'Document'}
            className="h-8 w-8 rounded object-cover"
          />
          <span className="text-xs">View</span>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <FileText className="h-4 w-4" />
          <span className="text-xs">View</span>
        </div>
      )}
    </Button>
  );
}
