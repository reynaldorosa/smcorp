/**
 * Declaração de tipos para o pdfmake (modo servidor, CJS `export =`).
 * O pacote 0.3.x não acompanha tipos TypeScript.
 */
declare module 'pdfmake' {
  interface PdfMakeServer {
    /** Registra descritores de fonte (nome do arquivo virtual). */
    addFonts(fonts: Record<string, Record<string, string>>): void;
    /** Restringe o download de recursos externos (ex.: imagens por URL). */
    setUrlAccessPolicy(callback?: (url: string) => boolean): void;
    /** Restringe o acesso ao sistema de arquivos local. */
    setLocalAccessPolicy(callback?: (path: string) => boolean): void;
    /** Sistema de arquivos virtual — usado para registrar os TTFs das fontes. */
    virtualfs: {
      writeFileSync(filename: string, content: Buffer): void;
    };
    /** Cria o documento PDF e devolve um buffer pronto para stream. */
    createPdf(
      docDefinition: Record<string, unknown>,
      options?: Record<string, unknown>,
    ): {
      getBuffer(): Promise<Buffer>;
    };
  }

  const pdfmake: PdfMakeServer;
  export = pdfmake;
}
