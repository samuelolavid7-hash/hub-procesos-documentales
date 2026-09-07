"use client";

import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Button } from "@/components/shared/button";
import { Icon } from "@/components/shared/icons";

interface FolderPickerProps {
  disabled?: boolean;
  onFilesSelected: (files: File[], folderName: string) => void;
}

interface WebkitFileEntry {
  isFile: true;
  isDirectory: false;
  file: (callback: (file: File) => void, errorCallback?: () => void) => void;
}

interface WebkitDirectoryReader {
  readEntries: (
    callback: (entries: WebkitEntry[]) => void,
    errorCallback?: () => void,
  ) => void;
}

interface WebkitDirectoryEntry {
  isFile: false;
  isDirectory: true;
  name: string;
  createReader: () => WebkitDirectoryReader;
}

type WebkitEntry = WebkitFileEntry | WebkitDirectoryEntry;

export function FolderPicker({ disabled = false, onFilesSelected }: FolderPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    onFilesSelected(files, getFolderName(files));
    event.target.value = "";
  }

  async function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const entries = Array.from(event.dataTransfer.items)
      .map((item) => item.webkitGetAsEntry?.() as WebkitEntry | null)
      .filter((entry): entry is WebkitEntry => Boolean(entry));

    if (entries.length > 0) {
      const files = (await Promise.all(entries.map((entry) => readEntry(entry)))).flat();
      if (files.length > 0) {
        const folderName = entries.length === 1 && entries[0].isDirectory
          ? entries[0].name
          : getFolderName(files);
        onFilesSelected(files, folderName);
        return;
      }
    }

    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) onFilesSelected(files, getFolderName(files));
  }

  return (
    <div
      aria-label="Zona de carga del lote fotográfico"
      className={`grid min-h-64 place-items-center rounded-xl border-2 border-dashed p-6 text-center transition-colors ${isDragging ? "border-teal-600 bg-teal-50" : "border-slate-300 bg-slate-50"}`}
      onDragEnter={() => !disabled && setIsDragging(true)}
      onDragLeave={() => setIsDragging(false)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="max-w-md">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-white text-teal-700 shadow-sm ring-1 ring-slate-200">
          <Icon name="upload" className="h-8 w-8" />
        </span>
        <h4 className="mt-5 text-lg font-bold text-slate-900">Arrastra aquí la carpeta del lote</h4>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Las fotos se procesan localmente en este navegador y nunca se suben a un servidor.
        </p>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept=".jpg,.jpeg,.png,.heic,image/jpeg,image/png,image/heic"
          multiple
          onChange={handleInputChange}
          {...({ webkitdirectory: "" } as Record<string, string>)}
        />
        <Button
          className="mt-5"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <Icon name="folder" className="h-4 w-4" />
          Seleccionar carpeta
        </Button>
        <p className="mt-3 text-xs text-slate-400">Formatos admitidos: JPG, JPEG, PNG y HEIC</p>
      </div>
    </div>
  );
}

function getFolderName(files: File[]): string {
  const firstPath = files.find((file) => file.webkitRelativePath)?.webkitRelativePath;
  return firstPath?.split("/")[0] || "Carpeta seleccionada";
}

async function readEntry(entry: WebkitEntry, parentPath = ""): Promise<File[]> {
  if (entry.isFile) {
    const file = await new Promise<File>((resolve, reject) => entry.file(resolve, reject));
    if (parentPath && !file.webkitRelativePath) {
      Object.defineProperty(file, "webkitRelativePath", {
        configurable: true,
        value: `${parentPath}/${file.name}`,
      });
    }
    return [file];
  }

  const currentPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;
  const reader = entry.createReader();
  const children: WebkitEntry[] = [];

  // Chromium entrega directorios grandes en varios bloques; se lee hasta recibir uno vacío.
  while (true) {
    const block = await new Promise<WebkitEntry[]>((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });
    if (block.length === 0) break;
    children.push(...block);
  }

  return (await Promise.all(children.map((child) => readEntry(child, currentPath)))).flat();
}
