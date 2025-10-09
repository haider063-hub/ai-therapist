"use client";

import { X } from "lucide-react";
import { Button } from "ui/button";
import Image from "next/image";

interface ImagePreviewProps {
  imageUrl: string;
  imageName: string;
  onRemove: () => void;
}

export function ImagePreview({
  imageUrl,
  imageName,
  onRemove,
}: ImagePreviewProps) {
  return (
    <div className="relative inline-flex items-center gap-2 p-2 bg-secondary/50 rounded-lg border border-border max-w-[200px]">
      <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
        <Image
          src={imageUrl}
          alt={imageName}
          fill
          className="object-cover"
          sizes="64px"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground truncate font-medium">
          {imageName}
        </p>
        <p className="text-xs text-muted-foreground">Image</p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 rounded-full hover:bg-destructive/20 flex-shrink-0"
        onClick={onRemove}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
