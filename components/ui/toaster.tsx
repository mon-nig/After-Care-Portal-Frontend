'use client'

import { useToast } from '@/hooks/use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, message, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className={`grid gap-1 ${props.variant === "destructive" ? "text-white" : ""}`}>
              {title && <ToastTitle className="font-bold">{title}</ToastTitle>}
              {(description || message) && (
                <ToastDescription>{description || message}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
