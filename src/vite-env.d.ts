/// <reference types="vite/client" />

declare module 'html2pdf.js' {
  interface Html2PdfInstance {
    set(options: {
      margin?: number | number[];
      filename?: string;
      image?: { type?: string; quality?: number };
      html2canvas?: { scale?: number };
      jsPDF?: { unit?: string; format?: string; orientation?: string };
    }): Html2PdfInstance;
    from(element: HTMLElement): Html2PdfInstance;
    save(): Promise<void>;
  }
  function html2pdf(): Html2PdfInstance;
  export default html2pdf;
}
