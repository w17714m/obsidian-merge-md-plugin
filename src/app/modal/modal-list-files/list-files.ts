import {
	App,
	Modal,
	Notice,
	TFolder,
	TFile,
	Vault,
	FileSystemAdapter
} from 'obsidian';
import * as fs from 'fs/promises';
import deepmerge from 'deepmerge';
import { PDFDocument } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import * as path from 'path';
// @ts-ignore
import templateHtml from "./template.html?raw";

/**
 * Retorna la ruta base del vault (carpeta real en el sistema).
 * Lanza un fallback vacío si no es FileSystemAdapter.
 */
function getVaultBasePath(app: App): string {
	const adapter = app.vault.adapter;
	if (adapter instanceof FileSystemAdapter) {
		return adapter.getBasePath();
	} else {
		// Adaptador desconocido, fallback vacío
		return "";
	}
}

/**
 * Retorna la ruta del plugin en la carpeta .obsidian/plugins/<pluginId>
 */
function getPluginPath(app: App, pluginId: string): string {
	const adapter = app.vault.adapter as any;
	const vaultPath = typeof adapter.getBasePath === "function"
		? adapter.getBasePath()
		: process.cwd();
	return path.join(vaultPath, ".obsidian", "plugins", pluginId);
}

/**
 * Carga los bytes de la fuente desde la carpeta del plugin.
 */
export async function loadFontBytes(app: App, pluginId: string): Promise<Uint8Array> {
	const pluginPath = getPluginPath(app, pluginId);
	const fontPath = path.join(pluginPath, "NotoSans-Regular.ttf");
	console.log("Font path:", fontPath);
	return fs.readFile(fontPath);
}

export default class ListFilesModal extends Modal {
	folders: TFolder[];
	vault: Vault;
	manifest: { id: string };

	constructor(app: App, folders: TFolder[], manifest: { id: string }) {
		super(app);
		this.folders = folders;
		this.vault = app.vault;
		this.manifest = manifest;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.innerHTML = templateHtml;

		const inputEl = contentEl.querySelector<HTMLInputElement>("#folder-input");
		const suggestionsEl = contentEl.querySelector<HTMLDivElement>("#suggestions");
		const confirmBtn = contentEl.querySelector<HTMLButtonElement>("#confirm-btn");

		if (inputEl && suggestionsEl && confirmBtn) {
			suggestionsEl.style.display = "none";

			// Filtra las carpetas conforme escribe el usuario
			inputEl.addEventListener("input", () => {
				const query = inputEl.value.toLowerCase();
				suggestionsEl.innerHTML = "";

				const filteredFolders = this.folders.filter(folder =>
					folder.name.toLowerCase().includes(query)
				);

				if (filteredFolders.length === 0) {
					suggestionsEl.style.display = "none";
				} else {
					suggestionsEl.style.display = "block";
					filteredFolders.forEach(folder => {
						const div = document.createElement("div");
						div.textContent = folder.path;
						div.className = "folder-suggestion";
						div.style.cursor = "pointer";
						div.style.padding = "4px";
						div.addEventListener("click", async () => {
							new Notice(`Carpeta seleccionada: ${folder.path}`);
							await this.mergeMarkdownFiles(folder).catch(error => {
								new Notice("Error al combinar archivos: " + error);
							});
							this.close();
						});
						suggestionsEl.appendChild(div);
					});
				}
			});

			confirmBtn.addEventListener("click", () => {
				new Notice("Confirmado");
				this.close();
			});
		}
	}

	/**
	 * Combina todos los archivos Markdown de la carpeta (y subcarpetas)
	 * en un único archivo .md, y luego llama a exportToPDF para crear el PDF.
	 */
	async mergeMarkdownFiles(folder: TFolder) {
		const markdownFiles: TFile[] = this.getAllMarkdownFiles(folder);
		if (markdownFiles.length === 0) {
			new Notice("No se encontraron archivos Markdown en la carpeta seleccionada.");
			return;
		}

		// Fusiona el contenido
		const mergedContentArray = await Promise.all(
			markdownFiles.map(file => this.vault.read(file))
		);
		const mergedContent = mergedContentArray.join("\n\n");

		// Crea el archivo Markdown fusionado en la carpeta del vault
		const mergedMdPath = `${folder.path}/${folder.name}-merged-files.md`;
		await this.vault.create(mergedMdPath, mergedContent);
		new Notice(`Archivo Markdown creado: ${mergedMdPath}`);

		// Construye la ruta absoluta del vault para el PDF
		const vaultPath = getVaultBasePath(this.app);
		// El PDF se guardará en la misma carpeta, con el nombre <folder.name>-merged-files.pdf
		const pdfRelativePath = `${folder.path}/${folder.name}-merged-files.pdf`;
		const pdfAbsolutePath = path.join(vaultPath, pdfRelativePath);
	}

	/**
	 * Divide el texto en líneas basándose en la anchura máxima permitida.
	 */
	private splitTextToSize(font: any, text: string, fontSize: number, maxWidth: number): string[] {
		const words = text.split(" ");
		const lines: string[] = [];
		let currentLine = "";

		for (const word of words) {
			const testLine = currentLine ? `${currentLine} ${word}` : word;
			const width = font.widthOfTextAtSize(testLine, fontSize);
			if (width <= maxWidth) {
				currentLine = testLine;
			} else {
				if (currentLine) {
					lines.push(currentLine);
				}
				currentLine = word;
			}
		}

		if (currentLine) {
			lines.push(currentLine);
		}
		return lines;
	}

	/**
	 * Recorre recursivamente la carpeta y subcarpetas para obtener todos los archivos .md.
	 */
	getAllMarkdownFiles(folder: TFolder): TFile[] {
		let markdownFiles: TFile[] = [];
		folder.children.forEach(child => {
			if (child instanceof TFolder) {
				markdownFiles = markdownFiles.concat(this.getAllMarkdownFiles(child));
			} else if (child instanceof TFile && child.extension === "md") {
				markdownFiles.push(child);
			}
		});
		return markdownFiles;
	}

	onClose() {
		this.contentEl.empty();
	}
}
