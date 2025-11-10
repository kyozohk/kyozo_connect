"use client";
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./dialog";

interface CustomDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
  imageSrc?: string; 
}

export const CustomDialog: React.FC<CustomDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footerContent,
  imageSrc,
}) => {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <div className={`grid ${imageSrc ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'} gap-6`}>
          <div className="flex flex-col justify-center p-6">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
              {description && <DialogDescription>{description}</DialogDescription>}
            </DialogHeader>
            {children}
            {footerContent && <DialogFooter>{footerContent}</DialogFooter>}
          </div>
          {imageSrc && (
            <div className="hidden md:flex items-center justify-center">
              <img src={imageSrc} alt="Dialog Image" className="rounded-lg object-cover h-full w-full" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
