"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

const CustomDialog = DialogPrimitive.Root

const CustomDialogTrigger = DialogPrimitive.Trigger

const CustomDialogPortal = DialogPrimitive.Portal

const CustomDialogClose = DialogPrimitive.Close

const CustomDialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & {
    showContent?: boolean;
  }
>(({ className, showContent = true, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 transition-opacity duration-200 ease-in-out",
      showContent ? "opacity-100" : "opacity-0",
      className
    )}
    {...props}
  />
))
CustomDialogOverlay.displayName = "CustomDialogOverlay"

const CustomDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    showContent?: boolean;
    onCloseClick?: () => void;
  }
>(({ className, children, showContent = true, onCloseClick, ...props }, ref) => (
  <CustomDialogPortal>
    <CustomDialogOverlay showContent={showContent} />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg transition-all duration-200 ease-in-out",
        showContent ? "opacity-100 scale-100" : "opacity-0 scale-95",
        className
      )}
      {...props}
    >
      {children}
      {onCloseClick ? (
        <button 
          onClick={onCloseClick}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      ) : (
        <CustomDialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </CustomDialogClose>
      )}
    </DialogPrimitive.Content>
  </CustomDialogPortal>
))
CustomDialogContent.displayName = "CustomDialogContent"

const CustomDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
CustomDialogHeader.displayName = "CustomDialogHeader"

const CustomDialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
CustomDialogFooter.displayName = "CustomDialogFooter"

const CustomDialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CustomDialogTitle.displayName = "CustomDialogTitle"

const CustomDialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CustomDialogDescription.displayName = "CustomDialogDescription"

export {
  CustomDialog,
  CustomDialogPortal,
  CustomDialogOverlay,
  CustomDialogClose,
  CustomDialogTrigger,
  CustomDialogContent,
  CustomDialogHeader,
  CustomDialogFooter,
  CustomDialogTitle,
  CustomDialogDescription,
} 