declare global {
  interface Window {
    AndroidBridge?: {
      shareFile: (base64Data: string, fileName: string, mimeType: string) => void;
      downloadFile: (base64Data: string, fileName: string, mimeType: string) => void;
      showToast?: (message: string) => void;
    };
    onAndroidBack?: () => boolean;
  }
}

type BackHandler = () => boolean;
const backHandlers: BackHandler[] = [];

export const registerBackHandler = (handler: BackHandler) => {
  backHandlers.push(handler);
  return () => {
    const index = backHandlers.indexOf(handler);
    if (index > -1) backHandlers.splice(index, 1);
  };
};

window.onAndroidBack = () => {
  for (let i = backHandlers.length - 1; i >= 0; i--) {
    if (backHandlers[i]()) {
      return true;
    }
  }
  return false;
};

export const fileToBase64 = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

export const handleShare = async (file: File, mimeType: string) => {
  if (window.AndroidBridge && window.AndroidBridge.shareFile) {
    try {
      const base64 = await fileToBase64(file);
      window.AndroidBridge.shareFile(base64, file.name, mimeType);
      return;
    } catch (e) {
      console.error("Bridge share failed", e);
    }
  }
  
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: file.name,
      });
      return;
    } catch (error) {
      console.error('Error sharing', error);
    }
  }
  
  handleDownload(file, mimeType);
};

export const handleDownload = async (file: File, mimeType: string) => {
  if (window.AndroidBridge && window.AndroidBridge.downloadFile) {
    try {
      const base64 = await fileToBase64(file);
      window.AndroidBridge.downloadFile(base64, file.name, mimeType);
      return;
    } catch (e) {
      console.error("Bridge download failed", e);
    }
  }
  
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
