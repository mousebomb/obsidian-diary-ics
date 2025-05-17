import {addIcon, App, getLanguage, Notice, Plugin, PluginSettingTab, Setting, TFile} from 'obsidian';
import * as http from 'http';
import { createEvents, EventAttributes } from 'ics';
import { networkInterfaces } from 'os';
import { getLocalizedStrings, formatString } from './lang';

interface DiaryIcsSettings {
	port: number;
	headingLevel: string;
	includeSubheadings: boolean;
	// includeContent: boolean;
	includeFrontmatter: boolean;
	frontmatterTemplate: string;
	frontmatterTitleTemplate: string;
	// 日记设置
	diaryFormat: string;
	diaryFolder: string;
}

const DEFAULT_DAILY_NOTE_FORMAT = 'YYYY-MM-DD';

const DEFAULT_SETTINGS: DiaryIcsSettings = {
	port: 19347,
	headingLevel: 'h2',
	includeSubheadings: true,
	// includeContent: false,
	includeFrontmatter: false,
	frontmatterTemplate: '',
	frontmatterTitleTemplate: '',
	diaryFormat: DEFAULT_DAILY_NOTE_FORMAT,
	diaryFolder: ''
}

export default class DiaryIcsPlugin extends Plugin {
	settings: DiaryIcsSettings;
	server: http.Server | null = null;
	dailyNoteFormat: string = DEFAULT_DAILY_NOTE_FORMAT;
	dailyNoteFolder = "";
	locale: ReturnType<typeof getLocalizedStrings>;

	// 获取本地IP地址
	getLocalIP(): string {
		const interfaces = networkInterfaces();
		for (const name of Object.keys(interfaces)) {
			for (const iface of interfaces[name]!) {
				if (iface.family === 'IPv4' && !iface.internal) {
					return iface.address;
				}
			}
		}
		return '127.0.0.1';
	}

	async onload() {
		await this.loadSettings();

		// 加载语言配置
		this.locale = getLocalizedStrings(getLanguage());

		// 使用插件自身的设置
		this.dailyNoteFormat = this.settings.diaryFormat;
		this.dailyNoteFolder = this.settings.diaryFolder;

		const localIP = this.getLocalIP();

		// 添加图标到左侧边栏
		addIcon("diary-ics",`<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-calendar-sync-icon lucide-calendar-sync"><path d="M11 10v4h4"/><path d="m11 14 1.535-1.605a5 5 0 0 1 8 1.5"/><path d="M16 2v4"/><path d="m21 18-1.535 1.605a5 5 0 0 1-8-1.5"/><path d="M21 22v-4h-4"/><path d="M21 8.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h4.3"/><path d="M3 10h4"/><path d="M8 2v4"/></svg>`);
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const ribbonIconEl = this.addRibbonIcon('diary-ics', this.locale.pluginName, (evt: MouseEvent) => {
			// 点击图标时显示ICS订阅链接
			new Notice(`${this.locale.pluginName}: http://${localIP}:${this.settings.port}/feed.ics`);
		});

		// 添加状态栏项目
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText(`ICS: http://${localIP}:${this.settings.port}/feed.ics`);

		// 添加命令：复制ICS订阅链接
		this.addCommand({
			id: 'copy-ics-url',
			name: this.locale.copyIcsUrlCommand,
			callback: () => {
				const url = `http://${localIP}:${this.settings.port}/feed.ics`;
				navigator.clipboard.writeText(url);
				new Notice(this.locale.copySuccess);
			}
		});

		// 添加设置选项卡
		this.addSettingTab(new DiaryIcsSettingTab(this.app, this));

		// 启动HTTP服务器
		this.startServer();

	}

	onunload() {
		// 关闭HTTP服务器
		if (this.server) {
			this.server.close();
			this.server = null;
			console.log('ICS HTTP server closed');
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(restartServer = false) {
		await this.saveData(this.settings);

		// 只有在需要时才重启服务器
		if (restartServer && this.server) {
			this.server.close();
			this.server = null;
			this.startServer();
		}
	}

	// 启动HTTP服务器提供ICS文件
	startServer() {
		const port = this.settings.port;
		const localIP = this.getLocalIP();

		this.server = http.createServer(async (req, res) => {
			if (req.url === '/feed.ics') {
				try {
					const icsContent = await this.generateIcsContent();

					res.writeHead(200, {
						'Content-Type': 'text/calendar',
						'Content-Disposition': 'attachment; filename="obsidian-diary.ics"'
					});
					res.end(icsContent);
					console.log(this.locale.fileProvided);
				} catch (error) {
					console.error(this.locale.fileGenerationError + ':', error);
					res.writeHead(500);
					res.end(this.locale.fileGenerationError);
				}
			} else {
				res.writeHead(404);
				res.end(this.locale.notFound);
			}
		});

		this.server.listen(port, '0.0.0.0', () => {
			console.log(formatString(this.locale.serverStarted, localIP, port));
			new Notice(formatString(this.locale.serverStarted, localIP, port));
		});

		this.server.on('error', (error) => {
			console.error(this.locale.serverError.replace('{0}', ''), error);
			new Notice(formatString(this.locale.serverError, error.message));
		});
	}

	// 获取日记设置（从插件自身的设置中获取）
	getDailyNoteSettings() {
		return {
			format: this.settings.diaryFormat || DEFAULT_DAILY_NOTE_FORMAT,
			folder: this.settings.diaryFolder?.trim() || "",
			template: "", // 不再使用模板设置
		};
	}

	// 判断文件是否为日记文件（基于插件设置的格式）
	isDiaryFile(file: TFile): boolean {
		// 检查文件扩展名
		if (file.extension !== 'md') return false;

		// 检查文件是否在日记文件夹中
		const matchFolder = this.dailyNoteFolder ==="/" ? "" : this.dailyNoteFolder;
		if (this.dailyNoteFolder && !file.path.startsWith(matchFolder)) return false;

		// 使用moment库验证文件名是否符合日期格式
		// @ts-ignore - window.moment 在Obsidian中已经内置
		const moment = window.moment;
		if (!moment) {
			console.error(this.locale.cannotGetMoment);
			return false;
		}

		// 尝试使用配置的日记格式解析文件名
		const date = moment(file.basename, this.dailyNoteFormat, true);
		return date.isValid();
	}


	// 解析日记文件，提取标题和次级标题
	async parseDiaryFile(file: TFile): Promise<{title: string, content :string }[]> {
		// 使用Obsidian的缓存元数据获取标题信息
		const fileCache = this.app.metadataCache.getFileCache(file);
		const entries: {title: string, content : string }[] = [];

		// 如果没有缓存或没有标题信息，则返回空数组
		if (!fileCache || !fileCache.headings) {
			console.log(formatString(this.locale.cannotGetFileCache, file.path));
			return [];
		}

		// 根据设置选择要提取的标题级别
		const headingLevel = this.settings.headingLevel === 'h1' ? 1 : 2;
		const subheadingLevel = headingLevel + 1;

		// 获取文件内容，用于提取标题下的内容
		// const content = await this.app.vault.read(file);
		// const lines = content.split('\n');

		console.log (" 解析日记文件: ", file.path, " 解析标题: ", fileCache.headings);
		// 筛选出指定级别的标题
		const mainHeadings = fileCache.headings?.filter(h => h.level === headingLevel) || [];

		// 处理每个主标题
		for (let i = 0; i < mainHeadings.length; i++) {
			const heading = mainHeadings[i];
			const nextHeading = mainHeadings[i + 1];
			const title = heading.heading;

			// 计算当前标题的内容范围
			const startLine = heading.position.start.line;

			// 查找子标题
			const subheadings: string[] = [];
			const subheadingsData = fileCache.headings?.filter(h =>
				h.level > headingLevel &&
				h.position.start.line > startLine &&
				(nextHeading ? h.position.start.line < nextHeading.position.start.line : true)
			) || [];

			// 提取子标题文本
			subheadingsData.forEach(sh => {
				// 根据子级别的level 与主级别的level 计算缩进
				const indentLevel = sh.level - subheadingLevel;
				const indent = '  '.repeat(indentLevel);
				subheadings.push( indent + sh.heading);
			});

			// 添加条目
			entries.push({
				title,
				content: subheadings.join('\n')
			});
		}

		return entries;
	}

	// 生成ICS文件内容
	async generateIcsContent(): Promise<string> {
		const events: EventAttributes[] = [];
		const vaultName = this.app.vault.getName();
		console.log(formatString(this.locale.generatingIcsContent, vaultName));

		// 获取所有日记文件
		const files = this.app.vault.getMarkdownFiles()
			.filter(file => this.isDiaryFile(file));

			// console.log (" 生成ICS文件内容: ", files.length, " 个日记文件");
			new Notice(formatString(this.locale.generatingIcsFiles, files.length), 1000);
		for (const file of files) {
			// 从文件名解析日期，使用moment库根据配置的日记格式解析
			// @ts-ignore - window.moment 在Obsidian中已经内置
			const moment = window.moment;
			const date = moment(file.basename, this.dailyNoteFormat, true);
			const year = date.year();
			const month = date.month() + 1; // moment月份从0开始，需要+1
			const day = date.date();
			const entries = await this.parseDiaryFile(file);
			console.log (" 解析日记文件: ", file.path, " 解析条目: ", entries.length, " 条");

			// 处理frontmatter，如果设置了包含frontmatter
			if (this.settings.includeFrontmatter) {
				const fileCache = this.app.metadataCache.getFileCache(file);
				if (fileCache?.frontmatter) {
					// 创建frontmatter事件描述
					let frontmatterDescription = '';
					const frontmatter = fileCache.frontmatter;

					// 使用模板格式化frontmatter内容
					if (this.settings.frontmatterTemplate) {
						// 解析模板中的变量
						const template = this.settings.frontmatterTemplate;
						// 由模板生成的结果
						let lines = template;

						// 检查模板是否包含特定字段的格式
						if (template.includes('{{')) {
							// 模板包含变量，按照模板格式化
							for (const key in frontmatter) {
								if (key === 'position') continue; // 跳过position字段
								if (frontmatter[key] === null || frontmatter[key] === undefined) continue; // 跳过值为null或undefined的属性
								// 替换特定字段，如{{fieldName}}
								lines = lines.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(frontmatter[key]));
							}
						} else {
							// 模板不包含变量，直接使用模板
							lines = template;
						}

						frontmatterDescription += lines;
					} else {
						// 没有模板，使用默认格式（每行一个字段）
						for (const key in frontmatter) {
							if (key === 'position') continue; // 跳过position字段
							if (frontmatter[key] === null || frontmatter[key] === undefined) continue; // 跳过值为null或undefined的属性
							frontmatterDescription += `${key}: ${frontmatter[key]}\n`;
						}
					}

					// 生成自定义标题
					let eventTitle = `${file.basename}[frontmatter]`;
					if (this.settings.frontmatterTitleTemplate) {
						const titleTemplate = this.settings.frontmatterTitleTemplate;
						if (titleTemplate.includes('{{')) {
							// 模板包含变量，按照模板格式化
							let customTitle = titleTemplate;

							// 先处理特殊变量 {{filename}}
							if (customTitle.includes('{{filename}}')) {
								customTitle = customTitle.replace(/\{\{filename\}\}/g, file.basename);
							}

							// 处理frontmatter中的变量
							for (const key in frontmatter) {
								if (key === 'position') continue; // 跳过position字段
								if (frontmatter[key] === null || frontmatter[key] === undefined) continue; // 跳过值为null或undefined的属性
								// 替换特定字段，如{{fieldName}}
								customTitle = customTitle.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(frontmatter[key]));
							}
							eventTitle = customTitle;
						} else {
							// 模板不包含变量，直接使用模板
							eventTitle = titleTemplate;
						}
					}

					// 创建frontmatter事件
					if (frontmatterDescription) {
						events.push({
							title: eventTitle,
							url: `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(file.path)}`,
							description: frontmatterDescription,
							start: [year, month, day],
							duration: {days: 1}, // 默认为全天事件
							status: 'CONFIRMED',
							busyStatus: 'FREE'
						});
					}
				}
			}

			for (const entry of entries) {
				// 构建描述内容
				let description = '';

				// 添加次级标题
				if (this.settings.includeSubheadings && entry.content) {
					description += "" + entry.content + '\n\n';
				}

				// 如果设置了包含内容，则添加内容
				// if (this.settings.includeContent) {
				// 	description += entry.content + '\n\n';
				// }

				// 创建事件
				events.push({
					title: entry.title,
					url: `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(file.path)}${encodeURIComponent(`#${entry.title}`)}`,
					description: description,
					start: [year, month, day],
					duration: {days: 1}, // 默认为全天事件
					status: 'CONFIRMED',
					busyStatus: 'FREE'
				});
			}
		}

		// 使用ics库生成ICS内容
		return new Promise((resolve, reject) => {
			createEvents(events, (error, value) => {
				if (error) {
					reject(error);
				} else {
					resolve(value);
				}
			});
		});
	}
}

class DiaryIcsSettingTab extends PluginSettingTab {
	plugin: DiaryIcsPlugin;

	constructor(app: App, plugin: DiaryIcsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		const locale = this.plugin.locale;

		containerEl.empty();


		containerEl.createEl('h2', {text: locale.settingsTitle});

		new Setting(containerEl)
			.setName(locale.portSetting)
			.setDesc(locale.portDesc)
			.addText(text => text
				.setPlaceholder('19347')
				.setValue(this.plugin.settings.port.toString())
				.onChange(async (value) => {
					const port = parseInt(value);
					if (!isNaN(port) && port > 0 && port < 65536) {
						this.plugin.settings.port = port;
						await this.plugin.saveSettings(false); // 不重启服务器
					}
				}))
			.addButton(button => button
				.setButtonText(locale.applyButton)
				.onClick(async () => {
					await this.plugin.saveSettings(true); // 重启服务器
					new Notice(locale.portApplied);
				}));

		containerEl.createEl('h3', {text: locale.contentSettingsTitle});

		new Setting(containerEl)
			.setName(locale.headingLevelSetting)
			.setDesc(locale.headingLevelDesc)
			.addDropdown(dropdown => dropdown
				.addOption('h1', locale.h1Option)
				.addOption('h2', locale.h2Option)
				.setValue(this.plugin.settings.headingLevel)
				.onChange(async (value) => {
					this.plugin.settings.headingLevel = value;
					await this.plugin.saveSettings(false);
				}));

		new Setting(containerEl)
		.setName(locale.includeSubheadingsSetting)
		.setDesc(locale.includeSubheadingsDesc)
		.addToggle(toggle => toggle
			.setValue(this.plugin.settings.includeSubheadings)
			.onChange(async (value) => {
				this.plugin.settings.includeSubheadings = value;
				await this.plugin.saveSettings(false);
			}));

		// new Setting(containerEl)
		// 	.setName('包含内容')
		// 	.setDesc('在日历事件描述中包含标题下的内容')
		// 	.addToggle(toggle => toggle
		// 		.setValue(this.plugin.settings.includeContent)
		// 		.onChange(async (value) => {
		// 			this.plugin.settings.includeContent = value;
		// 			await this.plugin.saveSettings();
		// 		}));

		containerEl.createEl('h3', {text: locale.diarySettingsTitle});

		new Setting(containerEl)
			.setName(locale.diaryFormatSetting)
			.setDesc(locale.diaryFormatDesc)
			.addText(text => text
				.setPlaceholder('YYYY-MM-DD')
				.setValue(this.plugin.settings.diaryFormat)
				.onChange(async (value) => {
					this.plugin.settings.diaryFormat = value;
					this.plugin.dailyNoteFormat = value; // 立即更新插件实例中的值
					await this.plugin.saveSettings(false);
				}));

		new Setting(containerEl)
			.setName(locale.diaryFolderSetting)
			.setDesc(locale.diaryFolderDesc)
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.diaryFolder)
				.onChange(async (value) => {
					this.plugin.settings.diaryFolder = value;
					this.plugin.dailyNoteFolder = value; // 立即更新插件实例中的值
					await this.plugin.saveSettings(false);
				}));

		containerEl.createEl('h3', {text: locale.frontmatterSettingsTitle});

		new Setting(containerEl)
			.setName(locale.includeFrontmatterSetting)
			.setDesc(locale.includeFrontmatterDesc)
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.includeFrontmatter)
				.onChange(async (value) => {
					this.plugin.settings.includeFrontmatter = value;
					await this.plugin.saveSettings(false);
				}));

		new Setting(containerEl)
			.setName(locale.frontmatterTitleSetting)
			.setDesc(locale.frontmatterTitleDesc)
			.addText(text => text
				.setPlaceholder('{{filename}}[frontmatter]')
				.setValue(this.plugin.settings.frontmatterTitleTemplate)
				.onChange(async (value) => {
					this.plugin.settings.frontmatterTitleTemplate = value;
					await this.plugin.saveSettings(false);
				}));

		new Setting(containerEl)
			.setName(locale.frontmatterTemplateSetting)
			.setDesc(locale.frontmatterTemplateDesc)
			.addText(text => text
				.setPlaceholder('')
				.setValue(this.plugin.settings.frontmatterTemplate)
				.onChange(async (value) => {
					this.plugin.settings.frontmatterTemplate = value;
					await this.plugin.saveSettings(false);
				}));

		const templateExample = containerEl.createEl('div', {text: locale.templateExampleTitle, cls: 'diary-ics-template-example'});
		templateExample.createEl('div', {text: locale.templateExample1});
		templateExample.createEl('div', {text: locale.templateExample2});
		templateExample.createEl('div', {text: locale.templateExample3});
		templateExample.createEl('div', {text: locale.templateExample4});

		// 显示当前ICS订阅链接
		const localIP = this.plugin.getLocalIP();
		containerEl.createEl('h3', {text: locale.icsLinkTitle});
		const linkEl = containerEl.createEl('div', {text: `http://${localIP}:${this.plugin.settings.port}/feed.ics`, cls: 'diary-ics-link-div'});

		// 添加复制按钮
		const copyButton = containerEl.createEl('button', {text: locale.copyLinkButton, cls: 'diary-ics-copy-button'});
		copyButton.addEventListener('click', () => {
			const url = `http://${localIP}:${this.plugin.settings.port}/feed.ics`;
			navigator.clipboard.writeText(url);
			new Notice(locale.copySuccess);
		});

		// 添加使用说明
		containerEl.createEl('h3', {text: locale.instructionsTitle});
		containerEl.createEl('p', {text: locale.instruction1});
		containerEl.createEl('p', {text: locale.instruction2});
		containerEl.createEl('p', {text: locale.instruction3});
	}
}
