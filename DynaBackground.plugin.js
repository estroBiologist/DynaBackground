/**
 * @name DynaBackground
 * @version 1.1.0
 * @description Simple plugin that lets you set custom backgrounds per server.
 * @author Ash Taylor
 *  
*/

module.exports = class DynaBackground {
	constructor() {
		this.backgrounds = {
			"default": "",
		};
		this.lastBackground = this.backgrounds["default"];
		this.fade = true;
	}

	load() {
		
	}

	start() {
		if (!global.ZeresPluginLibrary) return window.BdApi.alert("Library Missing",`The library plugin needed for ${this.getName()} is missing.<br /><br /> <a href="https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js" target="_blank">Click here to download the library!</a>`);

		this.applySettings(ZLibrary.Utilities.loadSettings("DynaBackground", this.getDefaultSettings()));

		ZLibrary.DiscordModules.SelectedGuildStore._changeCallbacks.add(this.updateBackgrounds.bind(this));
		this.updateBackgrounds();
	}

	stop() {
		ZLibrary.DiscordModules.SelectedGuildStore._changeCallbacks.delete(this.updateBackgrounds.bind(this));
	}

	getDefaultSettings() {
		return { backgrounds: {"default": ""}, fade: true}
	}

	getSettings() {
		return {backgrounds: this.backgrounds, fade: this.fade}
	}

	applySettings(settings) {
		this.fade = settings.fade;
		this.backgrounds = settings.backgrounds;
	}

	updateBackgrounds() {
		let currentGuildId = ZLibrary.DiscordModules.SelectedGuildStore.getGuildId();
		let selectedBackground = this.backgrounds["default"];

		console.log("Switched to guild " + currentGuildId)

		if (currentGuildId in this.backgrounds)
			selectedBackground = this.backgrounds[currentGuildId];	
		
		if (selectedBackground != this.lastBackground) {
			ZLibrary.DOMTools.removeStyle(69);
			ZLibrary.DOMTools.addStyle(69, ":root { --background-image: url('" + (this.fade ? this.lastBackground : selectedBackground) + "') !important; --background: var(--background-image); }" + 
			(this.fade ? "body::before { transition: opacity 2s; opacity: 0.0; }" : "body::before { transition: opacity 0s; opacity 1.0; }"));
			
			console.log("setting background to " + selectedBackground + " with fade " + !!this.fade);
			
			this.lastBackground = selectedBackground;
			if (this.fade) {
				setTimeout(function(){
					ZLibrary.DOMTools.removeStyle(69);
					ZLibrary.DOMTools.addStyle(69, ":root { --background-image: url('" + selectedBackground + "') !important; --background: var(--background-image); }" + 
					(this.fade ? "body::before { transition: opacity 2s; opacity: 1.0; };" : ""));
				}.bind(this), 2000);
			}
				
		}
	}

	createBgCallback(key) {
		return function(text) { 
			if (text)
				this.backgrounds[key] = text; 
			else
				delete this.backgrounds[key];

			console.log("Setting " + key + " to " + text);

			ZLibrary.Utilities.saveSettings("DynaBackground", this.getSettings());
			this.updateBackgrounds();
		}
	}

	getSettingsPanel() {
		let guilds = ZLibrary.DiscordModules.GuildStore.getGuilds();
		let backgroundsPanel = new ZLibrary.Settings.SettingGroup("Server Backgrounds", {shown: true});
		let settingsPanel = new ZLibrary.Settings.SettingPanel();

		let defaultBgCallback = this.createBgCallback("default");

		settingsPanel.append(new ZLibrary.Settings.Textbox("Default Background", "", this.backgrounds["default"], defaultBgCallback.bind(this)));

		settingsPanel.append(new ZLibrary.Settings.Switch("Fade to black when switching backgrounds", "", this.fade, function(val){ 
			this.fade = !!val;
			ZLibrary.Utilities.saveSettings("DynaBackground", this.getSettings());
		}.bind(this)));

		settingsPanel.append(backgroundsPanel);
		
		for (const [guild_id, data] of Object.entries(guilds)) {
			let callback = this.createBgCallback(guild_id);
			backgroundsPanel.append(new ZLibrary.Settings.Textbox(data.name, "", this.backgrounds[guild_id], callback.bind(this)));
		}

		return settingsPanel.getElement();
	}
}
