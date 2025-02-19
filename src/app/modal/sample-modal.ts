import { App, Modal } from 'obsidian';

export default class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Modal configuration');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}
