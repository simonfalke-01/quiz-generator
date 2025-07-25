export class FileValidator {
  /**
   * Validate file before processing
   */
  static validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "text/markdown",
      ".pdf",
      ".txt",
      ".md",
    ];

    if (file.size > maxSize) {
      return { valid: false, error: "File size exceeds 10MB limit" };
    }

    const fileExtension = file.name.toLowerCase().split(".").pop();
    const isValidType = allowedTypes.some(
      (type) =>
        file.type === type ||
        file.name.toLowerCase().endsWith(type) ||
        fileExtension === type.replace(".", ""),
    );

    if (!isValidType) {
      return {
        valid: false,
        error: "File type not supported. Please upload PDF, TXT, or MD files.",
      };
    }

    return { valid: true };
  }

  /**
   * Get file type from filename or MIME type
   */
  static getFileType(fileName: string, mimeType?: string): string {
    if (mimeType) {
      switch (mimeType) {
        case "application/pdf":
          return "pdf";
        case "text/plain":
          return "txt";
        case "text/markdown":
          return "md";
      }
    }

    const extension = fileName.toLowerCase().split(".").pop();
    switch (extension) {
      case "pdf":
        return "pdf";
      case "txt":
        return "txt";
      case "md":
      case "markdown":
        return "md";
      default:
        return "txt"; // Default to text
    }
  }
}