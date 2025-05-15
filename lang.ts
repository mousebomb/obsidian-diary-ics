// 语言配置文件

interface LanguageStrings {
    // 通用UI文本
    pluginName: string;
    copySuccess: string;
    serverStarted: string;
    serverError: string;
    fileProvided: string;
    fileGenerationError: string;
    notFound: string;
    cannotGetMoment: string;
    cannotGetFileCache: string;
    generatingIcsContent: string;
    generatingIcsFiles: string;

    // 命令相关
    copyIcsUrlCommand: string;

    // 设置页面
    settingsTitle: string;
    portSetting: string;
    portDesc: string;
	applyButton: string;
	portApplied: string;
    contentSettingsTitle: string;
    headingLevelSetting: string;
    headingLevelDesc: string;
    h1Option: string;
    h2Option: string;
    includeSubheadingsSetting: string;
    includeSubheadingsDesc: string;
    diarySettingsTitle: string;
    diaryFormatSetting: string;
    diaryFormatDesc: string;
    diaryFolderSetting: string;
    diaryFolderDesc: string;
    frontmatterSettingsTitle: string;
    includeFrontmatterSetting: string;
    includeFrontmatterDesc: string;
    frontmatterTitleSetting: string;
    frontmatterTitleDesc: string;
    frontmatterTemplateSetting: string;
    frontmatterTemplateDesc: string;
    templateExampleTitle: string;
    templateExample1: string;
    templateExample2: string;
    templateExample3: string;
    templateExample4: string;
    icsLinkTitle: string;
    copyLinkButton: string;
    instructionsTitle: string;
    instruction1: string;
    instruction2: string;
    instruction3: string;
}

const en: LanguageStrings = {
    // 通用UI文本
    pluginName: "Diary ICS",
    copySuccess: "ICS subscription link copied to clipboard",
    serverStarted: "ICS server started: http://{0}:{1}/feed.ics",
    serverError: "HTTP server error: {0}",
    fileProvided: "ICS file provided",
    fileGenerationError: "Error generating ICS file",
    notFound: "Not found",
    cannotGetMoment: "Cannot get moment library",
    cannotGetFileCache: "Cannot get file cache or heading information: {0}",
    generatingIcsContent: "Generating ICS content: {0}",
    generatingIcsFiles: "Generating ICS content: {0} diary files",

    // 命令相关
    copyIcsUrlCommand: "Copy ICS subscription link",

    // 设置页面
    settingsTitle: "Diary ICS Settings",
    portSetting: "HTTP Server Port",
    portDesc: "Port used by the local HTTP server",
	applyButton: "Apply",
	portApplied: "Port applied, server restarted",
    contentSettingsTitle: "Content Settings",
    headingLevelSetting: "Heading Level",
    headingLevelDesc: "Which level of headings to extract from diary as calendar entries",
    h1Option: "Level 1 Heading (#)",
    h2Option: "Level 2 Heading (##)",
    includeSubheadingsSetting: "Include Subheadings",
    includeSubheadingsDesc: "Include subheadings under the heading in the calendar event description",
    diarySettingsTitle: "Diary Settings",
    diaryFormatSetting: "Diary Naming Format",
    diaryFormatDesc: "The naming format of diary files, e.g., YYYY-MM-DD",
    diaryFolderSetting: "Diary Folder",
    diaryFolderDesc: "The folder path where diary files are located, leave empty for root directory",
    frontmatterSettingsTitle: "Frontmatter Settings",
    includeFrontmatterSetting: "Include Frontmatter",
    includeFrontmatterDesc: "Include the frontmatter content of diary files as separate calendar events",
    frontmatterTitleSetting: "Frontmatter Title Template",
    frontmatterTitleDesc: "Customize the title format of frontmatter events, use {{fieldName}} to reference specific fields, or {{filename}} to reference the current filename",
    frontmatterTemplateSetting: "Frontmatter Content Template",
    frontmatterTemplateDesc: "Customize the display format of frontmatter content, use {{fieldName}} to reference specific fields",
    templateExampleTitle: "Template Examples:",
    templateExample1: "1. Using \"Weather:{{weather}} Mood:{{mood}}\" will replace specific fields",
    templateExample2: "2. Using \"{{filename}}'s Diary\" will replace with the current filename (without extension)",
    templateExample3: "3. Leave empty to use the default format (title as filename+[frontmatter], content as one field per line)",
    templateExample4: "4. Properties with null values will be automatically skipped",
    icsLinkTitle: "ICS Subscription Link",
    copyLinkButton: "Copy Link",
    instructionsTitle: "Instructions",
    instruction1: "1. Copy the ICS subscription link above",
    instruction2: "2. Add this subscription link in your system calendar application",
    instruction3: "3. Ensure Obsidian is running to provide the ICS file"
};

const zh: LanguageStrings = {
    // 通用UI文本
    pluginName: "日记日历订阅",
    copySuccess: "ICS订阅链接已复制到剪贴板",
    serverStarted: "ICS服务器已启动: http://{0}:{1}/feed.ics",
    serverError: "HTTP服务器错误: {0}",
    fileProvided: "已提供ICS文件",
    fileGenerationError: "生成ICS文件时出错",
    notFound: "未找到",
    cannotGetMoment: "无法获取moment库",
    cannotGetFileCache: "无法获取文件缓存或标题信息: {0}",
    generatingIcsContent: "生成ICS文件内容: {0}",
    generatingIcsFiles: "生成ICS文件内容: {0} 个日记文件",

    // 命令相关
    copyIcsUrlCommand: "复制ICS订阅链接",

    // 设置页面
    settingsTitle: "日记日历订阅设置",
    portSetting: "HTTP服务器端口",
    portDesc: "本地HTTP服务器使用的端口号",
	applyButton: "应用",
	portApplied: "端口已应用，服务器已重启",
    contentSettingsTitle: "内容设置",
    headingLevelSetting: "标题级别",
    headingLevelDesc: "从日记中提取哪一级标题作为日历条目",
    h1Option: "一级标题 (#)",
    h2Option: "二级标题 (##)",
    includeSubheadingsSetting: "包含子级标题",
    includeSubheadingsDesc: "在日历事件描述中包含标题下的子级标题",
    diarySettingsTitle: "日记设置",
    diaryFormatSetting: "日记命名格式",
    diaryFormatDesc: "日记文件的命名格式，例如YYYY-MM-DD",
    diaryFolderSetting: "日记文件夹",
    diaryFolderDesc: "日记文件所在的文件夹路径，留空表示根目录",
    frontmatterSettingsTitle: "Frontmatter设置",
    includeFrontmatterSetting: "包含Frontmatter",
    includeFrontmatterDesc: "将日记文件的Frontmatter内容作为单独的日历事件",
    frontmatterTitleSetting: "Frontmatter标题模板",
    frontmatterTitleDesc: "自定义Frontmatter日程的标题格式，可使用{{字段名}}引用特定字段，也可使用{{filename}}引用当前文件名",
    frontmatterTemplateSetting: "Frontmatter内容模板",
    frontmatterTemplateDesc: "自定义Frontmatter内容的显示格式，可直接使用{{字段名}}引用特定字段",
    templateExampleTitle: "模板示例：",
    templateExample1: "1. 使用 \"天气:{{weather}} 心情:{{mood}}\" 将替换特定字段",
    templateExample2: "2. 使用 \"{{filename}}的日记\" 将替换为当前文件名（不含扩展名）",
    templateExample3: "3. 留空则使用默认格式（标题为文件名+[frontmatter]，内容为每行一个字段）",
    templateExample4: "4. 值为null的属性将被自动跳过",
    icsLinkTitle: "ICS订阅链接",
    copyLinkButton: "复制链接",
    instructionsTitle: "使用说明",
    instruction1: "1. 复制上面的ICS订阅链接",
    instruction2: "2. 在系统日历应用中添加该订阅链接",
    instruction3: "3. 确保Obsidian在运行状态，以便HTTP服务器能够提供ICS文件"
};

// 格式化字符串，替换{0}, {1}等占位符
function formatString(str: string, ...args: any[]): string {
    return str.replace(/{(\d+)}/g, (match, index) => {
        return typeof args[index] !== 'undefined' ? args[index] : match;
    });
}

// 获取当前语言的字符串
export function getLocalizedStrings(language: string): LanguageStrings {
    return language.startsWith('zh') ? zh : en;
}

// 导出格式化函数
export { formatString };
