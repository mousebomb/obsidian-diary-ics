import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
import * as http from 'http';
import { createEvents, EventAttributes } from 'ics';

interface DiaryIcsSettings {
	port: number;
	headingLevel: string;
	includeContent: boolean;
}

const DEFAULT_DAILY_NOTE_FORMAT = 'YYYY-MM-DD';

const DEFAULT_SETTINGS: DiaryIcsSettings = {
	port: 19347,
	headingLevel: 'h2',
	includeContent: false
}

export default class DiaryIcsPlugin extends Plugin {
	settings: DiaryIcsSettings;
	server: http.Server | null = null;
	dailyNoteFormat: string = DEFAULT_DAILY_NOTE_FORMAT;
	dailyNoteFolder: string = "";

	async onload() {
		await this.loadSettings();
		
		// 读取daily-notes插件设置
		const dailyNoteSettings = this.getDailyNoteSettings();
		this.dailyNoteFormat = dailyNoteSettings.format;
		this.dailyNoteFolder = dailyNoteSettings.folder;

		// 添加图标到左侧边栏
		const ribbonIconEl = this.addRibbonIcon('calendar-with-checkmark', 'Diary ICS', (evt: MouseEvent) => {
			// 点击图标时显示ICS订阅链接
			new Notice(`ICS订阅链接: http://127.0.0.1:${this.settings.port}/feed.ics`);
		});
		
		// 添加状态栏项目
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText(`ICS: http://127.0.0.1:${this.settings.port}/feed.ics`);

		// 添加命令：复制ICS订阅链接
		this.addCommand({
			id: 'copy-ics-url',
			name: '复制ICS订阅链接',
			callback: () => {
				const url = `http://127.0.0.1:${this.settings.port}/feed.ics`;
				navigator.clipboard.writeText(url);
				new Notice('ICS订阅链接已复制到剪贴板');
			}
		});

		// 添加设置选项卡
		this.addSettingTab(new DiaryIcsSettingTab(this.app, this));

		// 启动HTTP服务器
		this.startServer();

		// 监听文件变化，以便更新ICS内容
		this.registerEvent(
			this.app.vault.on('modify', (file) => {
				if (this.isDiaryFile(file)) {
					console.log('日记文件已更新:', file.path);
				}
			})
		);
	}

	onunload() {
		// 关闭HTTP服务器
		if (this.server) {
			this.server.close();
			this.server = null;
			console.log('ICS HTTP服务器已关闭');
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		
		// 重启服务器以应用新设置
		if (this.server) {
			this.server.close();
			this.server = null;
		}
		this.startServer();
	}

	// 启动HTTP服务器提供ICS文件
	startServer() {
		const port = this.settings.port;
		
		this.server = http.createServer(async (req, res) => {
			if (req.url === '/feed.ics') {
				try {
					const icsContent = await this.generateIcsContent();
					
					res.writeHead(200, {
						'Content-Type': 'text/calendar',
						'Content-Disposition': 'attachment; filename="obsidian-diary.ics"'
					});
					res.end(icsContent);
					console.log('已提供ICS文件');
				} catch (error) {
					console.error('生成ICS文件时出错:', error);
					res.writeHead(500);
					res.end('生成ICS文件时出错');
				}
			} else {
				res.writeHead(404);
				res.end('未找到');
			}
		});

		this.server.listen(port, '0.0.0.0', () => {
			console.log(`ICS HTTP服务器已启动: http://127.0.0.1:${port}/feed.ics`);
			new Notice(`ICS服务器已启动: http://127.0.0.1:${port}/feed.ics`);
		});

		this.server.on('error', (error) => {
			console.error('HTTP服务器错误:', error);
			new Notice(`HTTP服务器错误: ${error.message}`);
		});
	}

	// 读取daily-notes插件设置
	getDailyNoteSettings() {
		try {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const { internalPlugins } = window.app as any;
			const { folder, format, template } = internalPlugins.getPluginById("daily-notes")?.instance?.options || {};
			return {
				format: format || DEFAULT_DAILY_NOTE_FORMAT,
				folder: folder?.trim() || "",
				template: template?.trim() || "",
			};
		} catch (err) {
			console.info("无法读取daily-notes插件设置，使用默认设置", err);
			return {
				format: DEFAULT_DAILY_NOTE_FORMAT,
				folder: "",
				template: "",
			};
		}
	}

	// 判断文件是否为日记文件（基于daily-notes插件设置或默认格式）
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
			console.error("无法获取moment库");
			return false;
		}

		// 尝试使用daily-notes插件的格式解析文件名
		const date = moment(file.basename, this.dailyNoteFormat, true);
		return date.isValid();
	}
	

	// 解析日记文件，提取标题和次级标题
	async parseDiaryFile(file: TFile): Promise<{title: string, content: string, subheadings: string[]}[]> {
		const content = await this.app.vault.read(file);
		const entries: {title: string, content: string, subheadings: string[]}[] = [];
		
		// 根据设置选择要提取的标题级别
		const headingLevel = this.settings.headingLevel === 'h1' ? 1 : 2;
		const headingPattern = this.settings.headingLevel === 'h1' 
			? '^# (.+)$' 
			: '^## (.+)$';
		
		// 次级标题的级别
		const subheadingLevel = headingLevel + 1;
		const subheadingPattern = new RegExp(`^${"#".repeat(subheadingLevel)} (.+)$`);
		
		// 使用字符串分割方法而不是正则表达式的exec方法，避免lastIndex问题
		const lines = content.split('\n');
		let currentTitle = '';
		let currentContent = [];
		let currentSubheadings: string[] = [];
		
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const headingMatch = new RegExp(headingPattern).exec(line);
			const subheadingMatch = subheadingPattern.exec(line);
			
			if (headingMatch) {
				// 如果已经有标题，保存之前的条目
				if (currentTitle) {
					entries.push({
						title: currentTitle,
						content: currentContent.join('\n').trim(),
						subheadings: currentSubheadings
					});
					currentContent = [];
					currentSubheadings = [];
				}
				
				currentTitle = headingMatch[1];
			} else if (subheadingMatch) {
				// 提取次级标题
				if (currentTitle) {
					currentSubheadings.push(subheadingMatch[1]);
					currentContent.push(line);
				}
			} else if (currentTitle) {
				currentContent.push(line);
			}
		}
		
		// 添加最后一个条目
		if (currentTitle) {
			entries.push({
				title: currentTitle,
				content: currentContent.join('\n').trim(),
				subheadings: currentSubheadings
			});
		}
		
		return entries;
	}

	// 生成ICS文件内容
	async generateIcsContent(): Promise<string> {
		const events: EventAttributes[] = [];
		const vaultName = this.app.vault.getName();
		console.log (" 生成ICS文件内容: ", vaultName);
		
		// 获取所有日记文件
		const files = this.app.vault.getMarkdownFiles()
			.filter(file => this.isDiaryFile(file));
		
			// console.log (" 生成ICS文件内容: ", files.length, " 个日记文件");
			new Notice (" 生成ICS文件内容: " + files.length + " 个日记文件",1000);
		for (const file of files) {
			// 从文件名解析日期，使用moment库根据daily-notes插件的格式解析
			// @ts-ignore - window.moment 在Obsidian中已经内置
			const moment = window.moment;
			const date = moment(file.basename, this.dailyNoteFormat, true);
			const year = date.year();
			const month = date.month() + 1; // moment月份从0开始，需要+1
			const day = date.date();
			const entries = await this.parseDiaryFile(file);
			console.log (" 解析日记文件: ", file.path, " 解析条目: ", entries.length, " 条");
			for (const entry of entries) {
				// 构建描述内容
				let description = '';
				
				// 添加次级标题
				if (entry.subheadings && entry.subheadings.length > 0) {
					description += "" + entry.subheadings.map(sh => `- ${sh}`).join('\n') + '\n\n';
				}
				
				// 如果设置了包含内容，则添加内容
				if (this.settings.includeContent) {
					description += entry.content + '\n\n';
				}
				
				// 创建事件
				events.push({
					title: entry.title,
					url: `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(file.path)}`,
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

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Diary ICS 设置'});

		new Setting(containerEl)
			.setName('HTTP服务器端口')
			.setDesc('本地HTTP服务器使用的端口号')
			.addText(text => text
				.setPlaceholder('19347')
				.setValue(this.plugin.settings.port.toString())
				.onChange(async (value) => {
					const port = parseInt(value);
					if (!isNaN(port) && port > 0 && port < 65536) {
						this.plugin.settings.port = port;
						await this.plugin.saveSettings();
					}
				}));

		new Setting(containerEl)
			.setName('标题级别')
			.setDesc('从日记中提取哪一级标题作为日历条目')
			.addDropdown(dropdown => dropdown
				.addOption('h1', '一级标题 (#)')
				.addOption('h2', '二级标题 (##)')
				.setValue(this.plugin.settings.headingLevel)
				.onChange(async (value) => {
					this.plugin.settings.headingLevel = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('包含内容')
			.setDesc('在日历事件描述中包含标题下的内容')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.includeContent)
				.onChange(async (value) => {
					this.plugin.settings.includeContent = value;
					await this.plugin.saveSettings();
				}));

		// 显示当前ICS订阅链接
		containerEl.createEl('h3', {text: 'ICS订阅链接'});
		const linkEl = containerEl.createEl('div', {text: `http://127.0.0.1:${this.plugin.settings.port}/feed.ics`});
		linkEl.style.padding = '10px';
		linkEl.style.backgroundColor = '#f5f5f5';
		linkEl.style.borderRadius = '5px';
		linkEl.style.marginBottom = '20px';
		
		// 添加复制按钮
		const copyButton = containerEl.createEl('button', {text: '复制链接'});
		copyButton.style.marginBottom = '20px';
		copyButton.addEventListener('click', () => {
			const url = `http://127.0.0.1:${this.plugin.settings.port}/feed.ics`;
			navigator.clipboard.writeText(url);
			new Notice('ICS订阅链接已复制到剪贴板');
		});
		
		// 添加使用说明
		containerEl.createEl('h3', {text: '使用说明'});
		containerEl.createEl('p', {text: '1. 复制上面的ICS订阅链接'});
		containerEl.createEl('p', {text: '2. 在系统日历应用中添加该订阅链接'});
		containerEl.createEl('p', {text: '3. 确保Obsidian在运行状态，以便HTTP服务器能够提供ICS文件'});
	}
}
