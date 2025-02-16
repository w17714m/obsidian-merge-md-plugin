import { App, PluginSettingTab, Setting } from 'obsidian';
import MergeMdPlugin from "../../../merge-md-plugin";
export default class SettingsTabs extends PluginSettingTab {
	plugin: MergeMdPlugin;

	constructor(app: App, plugin: MergeMdPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Obsidian Merge Plugin')
			.setDesc('General configuration')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
