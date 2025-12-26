
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export const formatCPFOrCNPJ = (value) => {
  if (!value) return '';
  
  // Remove non-digits
  const digits = value.replace(/\D/g, '');
  
  if (digits.length <= 11) {
    // CPF
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  } else {
    // CNPJ
    return digits
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  }
};

export const formatPhone = (value) => {
  if (!value) return '';
  
  const digits = value.replace(/\D/g, '');
  
  if (digits.length <= 10) {
    // Landline: (XX) XXXX-XXXX
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  } else {
    // Mobile: (XX) XXXXX-XXXX
    return digits
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  }
};

export const downloadBackup = (data, filename) => {
  try {
    // Convert data to JSON string
    const json = JSON.stringify(data);
    
    // Simple encoding (Base64) to obfuscate the file content acting as "encryption"
    // Using encodeURIComponent to handle special characters/UTF-8 correctly before btoa
    const encoded = btoa(unescape(encodeURIComponent(json)));
    
    const blob = new Blob([encoded], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error("Backup generation failed:", error);
    return false;
  }
};

export const decryptData = (encodedContent) => {
  try {
    // Decode the Base64 content back to JSON string
    const json = decodeURIComponent(escape(atob(encodedContent)));
    return JSON.parse(json);
  } catch (e) {
    console.error("Decryption failed. File might be corrupted or invalid format.", e);
    return null;
  }
};
