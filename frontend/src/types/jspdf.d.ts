// Declarações de tipos para módulos sem tipos
declare module 'jspdf' {
  export default class jsPDF {
    constructor(options?: {
      orientation?: 'portrait' | 'landscape' | 'p' | 'l';
      unit?: 'mm' | 'cm' | 'in' | 'px';
      format?: string | number[];
    });
    
    setFontSize(size: number): void;
    setFont(fontName: string, fontStyle?: string): void;
    text(text: string, x: number, y: number, options?: unknown): void;
    save(filename: string): void;
    output(type: 'dataurlstring' | 'blob' | 'arraybuffer' | 'dataurlnewwindow'): unknown;
    addPage(format?: string | number[], orientation?: 'portrait' | 'landscape' | 'p' | 'l'): void;
    getNumberOfPages(): number;
    internal: {
      pageSize: {
        getWidth(): number;
        getHeight(): number;
      };
    };
  }
}

declare module 'jspdf-autotable' {
  import jsPDF from 'jspdf';
  
  interface AutoTableOptions {
    head?: Array<Array<unknown>>;
    body?: Array<Array<unknown>>;
    startY?: number;
    theme?: 'striped' | 'grid' | 'plain';
    headStyles?: {
      fillColor?: number[];
      textColor?: number[];
      fontSize?: number;
      fontStyle?: string;
      halign?: 'left' | 'center' | 'right';
    };
    bodyStyles?: {
      fontSize?: number;
      cellPadding?: number;
    };
    alternateRowStyles?: {
      fillColor?: number[];
    };
    columnStyles?: {
      [key: number]: {
        cellWidth?: number | 'auto' | 'wrap';
        halign?: 'left' | 'center' | 'right';
      };
    };
    margin?: { left?: number; right?: number; top?: number; bottom?: number };
    didDrawPage?: (data: unknown) => void;
  }
  
  function autoTable(doc: jsPDF, options: AutoTableOptions): void;
  export default autoTable;
}
