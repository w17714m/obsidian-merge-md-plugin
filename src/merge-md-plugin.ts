import { Notice, Plugin,TFolder  } from 'obsidian';
import SettingsTabs from "./app/tabs/setting/settings-tabs";
import {MergeMdSettings} from "./model/merge-md-settings";
import ListFilesModal from "./app/modal/modal-list-files/list-files";
import {getAllFolders} from "./utils/get-folder";



const DEFAULT_SETTINGS: MergeMdSettings = {
	mySetting: 'default'
}

export default class MergeMdPlugin extends Plugin {
	settings: MergeMdSettings;

	async onload() {
		await this.loadSettings();

		const ribbonIconEl = this.addRibbonIcon('dice', 'Markdown Merge', (evt: MouseEvent) => {
			new Notice('This is a notice!');
		});
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('md merge loaded');

		this.addCommand({
			id: 'open-markdown-merge',
			name: 'Open markdown merge',
			callback: () => {
				const allFolders: TFolder[] = getAllFolders(this.app.vault.getRoot());
				allFolders.push(this.app.vault.getRoot())
				new ListFilesModal(this.app, allFolders, this.manifest).open();
			}
		});

		this.addSettingTab(new SettingsTabs(this.app, this));

		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {
		console.log("unload markdown merge");
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
