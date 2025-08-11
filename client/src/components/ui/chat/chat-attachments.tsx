import React from "react";
import { Paperclip, FileText, Download } from "lucide-react";

interface Attachment {
  id: string;
  url: string;
  fileName: string;
  fileType: string;
  size?: number; // in bytes
}

interface ChatAttachmentsProps {
  attachments: Attachment[];
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function ChatAttachments({ attachments }: ChatAttachmentsProps) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-3">
      {attachments.map(({ id, url, fileName, fileType, size }) => {
        if (fileType.startsWith("image/")) {
          return (
            <a
              key={id}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block w-24 h-24 rounded overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-200"
              aria-label={`Open image ${fileName} in new tab`}
            >
              <img
                src={url}
                alt={fileName}
                className="object-cover w-full h-full rounded"
                loading="lazy"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-40 text-white text-xs text-center py-1 truncate px-1">
                {fileName}
              </div>
            </a>
          );
        }

        if (fileType === "application/pdf") {
          return (
            <div
              key={id}
              className="flex items-center gap-3 bg-muted dark:bg-dark-secondary border border-border rounded-md shadow-sm px-3 py-2 max-w-xs"
              title={fileName}
            >
              <FileText className="w-6 h-6 text-muted-foreground dark:text-gray-300" />
              <div className="flex-1 truncate">
                <div className="font-semibold truncate">{fileName}</div>
                {size !== undefined && (
                  <div className="text-xs text-muted-foreground dark:text-gray-400">
                    {formatFileSize(size)}
                  </div>
                )}
              </div>
              <a
                href={url}
                download={fileName}
                className="flex items-center gap-1 text-primary hover:underline"
                aria-label={`Download ${fileName}`}
                onClick={e => e.stopPropagation()}
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">Download</span>
              </a>
            </div>
          );
        }

        // Non-image, non-pdf files (generic)
        return (
          <a
            key={id}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md shadow-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200 text-sm max-w-xs truncate"
            title={fileName}
            aria-label={`Download file ${fileName}`}
          >
            <Paperclip className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            <span className="truncate">{fileName}</span>
          </a>
        );
      })}
    </div>
  );
}
