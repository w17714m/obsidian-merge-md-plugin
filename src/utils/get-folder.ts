import { TFolder } from 'obsidian';

/**
 * Función recursiva para obtener todas las carpetas a partir de una carpeta dada.
 * @param folder Carpeta inicial (por lo general, la raíz del vault).
 * @returns Un arreglo con todas las carpetas encontradas.
 */
export function getAllFolders(folder: TFolder): TFolder[] {
	let folders: TFolder[] = [];

	// Opcional: Si no quieres incluir la carpeta raíz (a veces es una cadena vacía)
	if (folder.name) {
		folders.push(folder);
	}

	// Recorrer los hijos de la carpeta actual
	for (const child of folder.children) {
		if (child instanceof TFolder) {
			folders = folders.concat(getAllFolders(child));
		}
	}

	return folders;
}
