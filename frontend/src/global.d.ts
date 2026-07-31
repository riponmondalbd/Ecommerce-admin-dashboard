declare global {
  interface Window {
    toastSuccess?: (msg: string, duration?: number) => void;
    toastError?: (msg: string, duration?: number) => void;
    toastInfo?: (msg: string, duration?: number) => void;
    toastWarning?: (msg: string, duration?: number) => void;
  }
}

export {}
