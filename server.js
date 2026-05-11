const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs-extra');
const path = require('path');

const app = express();
const PORT = 80;
const CONFIG_PATH = path.join(__dirname, 'config.json');
const BACKUP_DIR = path.join(__dirname, 'backups');
const ICON_UPLOAD_DIR = path.join(__dirname, 'public/icons');
const FONT_UPLOAD_DIR = path.join(__dirname, 'public/fonts');
const BACKGROUND_UPLOAD_DIR = path.join(__dirname, 'public/backgrounds');
const VIDEO_UPLOAD_DIR = path.join(__dirname, 'public/videos');
const LOCAL_SERVICE_DIR = path.join(__dirname, 'public/local-services');

// 中间件配置
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/backups', express.static(BACKUP_DIR));

// 根路径重定向到main.html
app.get('/', (req, res) => {
  res.redirect(301, '/main.html');
});

// 确保上传目录存在，不存在则自动创建
fs.ensureDirSync(ICON_UPLOAD_DIR);
fs.ensureDirSync(FONT_UPLOAD_DIR);
fs.ensureDirSync(BACKGROUND_UPLOAD_DIR);
fs.ensureDirSync(VIDEO_UPLOAD_DIR);
fs.ensureDirSync(BACKUP_DIR);
fs.ensureDirSync(LOCAL_SERVICE_DIR);

// 配置文件读写方法（同步操作，保证数据一致性）
const readConfig = () => {
  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    // 添加默认备份配置
    if (!config.backup) {
      config.backup = {
        maxBackups: 50,
        backupInterval: 60 // 分钟
      };
      writeConfig(config);
    }
    return config;
  } catch (err) {
    console.error('读取配置失败：', err);
    return { 
      adminPassword: 'admin123', 
      theme: {}, 
      services: [], 
      titles: {},
      backup: {
        maxBackups: 50,
        backupInterval: 60 // 分钟
      }
    };
  }
};
const writeConfig = (config) => {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
  } catch (err) {
    console.error('写入配置失败：', err);
  }
};

// 清理旧备份函数
const cleanupOldBackups = (maxBackups) => {
  try {
    // 读取备份目录中的所有文件
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
      .map(file => ({
        name: file,
        path: path.join(BACKUP_DIR, file),
        mtime: fs.statSync(path.join(BACKUP_DIR, file)).mtime
      }))
      .sort((a, b) => a.mtime - b.mtime); // 按修改时间排序，最旧的在前
    
    // 如果备份数量超过上限，删除最旧的
    while (files.length > maxBackups) {
      const oldestFile = files.shift();
      fs.unlinkSync(oldestFile.path);
      console.log(`清理旧备份：${oldestFile.name}`);
    }
  } catch (err) {
    console.error('清理旧备份失败:', err);
  }
};

// 执行定时备份函数
const performBackup = () => {
  try {
    const config = readConfig();
    
    // 生成备份文件名：年-月-日-时-分-秒
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const backupFileName = `backup-${timestamp}.json`;
    const backupFilePath = path.join(BACKUP_DIR, backupFileName);
    
    // 保存备份文件
    fs.writeFileSync(backupFilePath, JSON.stringify(config, null, 2), 'utf8');
    console.log(`定时备份成功：${backupFileName}`);
    
    // 检查并清理旧备份
    cleanupOldBackups(config.backup.maxBackups);
  } catch (err) {
    console.error('定时备份失败:', err);
  }
};

// 设置定时备份任务
let backupInterval;
const startBackupInterval = () => {
  const config = readConfig();
  const interval = config.backup.backupInterval * 60 * 1000; // 转换为毫秒
  
  // 清除现有的定时任务
  if (backupInterval) {
    clearInterval(backupInterval);
  }
  
  // 设置新的定时任务
  backupInterval = setInterval(performBackup, interval);
  console.log(`定时备份任务已启动，间隔：${config.backup.backupInterval}分钟`);
};

// 图标上传配置：限制格式+重命名避免冲突
const iconUpload = multer({
  dest: ICON_UPLOAD_DIR,
  limits: { fileSize: 2 * 1024 * 1024 }, // 限制文件大小2M
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持PNG/JPG/JPEG/SVG格式的图标文件！'), false);
    }
  }
});

// 字体上传配置
const fontUpload = multer({
  dest: FONT_UPLOAD_DIR,
  limits: { fileSize: 30 * 1024 * 1024 }, // 限制文件大小30M
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['font/ttf', 'font/otf', 'application/x-font-ttf', 'application/x-font-otf', 'application/font-woff', 'application/font-woff2'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.match(/\.(ttf|otf|woff|woff2)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持TTF、OTF、WOFF、WOFF2格式的字体文件！'), false);
    }
  }
});

// 接口1：获取配置（隐藏密码，仅返回主题/服务/标题等公开信息）
app.get('/api/config', (req, res) => {
  try {
    const config = readConfig();
    const { adminPassword, ...restConfig } = config; // 剔除密码
    res.json({ code: 200, data: restConfig });
  } catch (err) {
    res.json({ code: 500, msg: '读取配置失败，请检查配置文件' });
  }
});

// 接口2：管理员登录（仅验证密码）
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  const config = readConfig();
  if (password === config.adminPassword) {
    res.json({ code: 200, msg: '登录成功' });
  } else {
    res.json({ code: 401, msg: '密码错误，请重新输入' });
  }
});

// 接口3：修改管理员密码（支持特殊字符，实时生效）
app.post('/api/change-password', (req, res) => {
  const { oldPwd, newPwd } = req.body;
  const config = readConfig();
  if (oldPwd !== config.adminPassword) {
    return res.json({ code: 401, msg: '原密码错误，修改失败' });
  }
  config.adminPassword = newPwd;
  writeConfig(config);
  res.json({ code: 200, msg: '密码修改成功，下次登录请使用新密码' });
});

// 接口4：保存主题配置（修复字体设置问题）
app.post('/api/save-theme', (req, res) => {
  try {
    const { theme } = req.body;
    if (!theme) {
      return res.json({ code: 400, msg: '请传入有效的主题配置' });
    }
    
    const config = readConfig();
    
    // 合并主题配置，确保customFonts不被覆盖
    config.theme = { 
      ...config.theme, 
      ...theme,
      customFonts: theme.customFonts || config.theme.customFonts || []
    };
    
    writeConfig(config);
    res.json({ code: 200, msg: '主题修改成功，已实时同步' });
  } catch (err) {
    console.error('保存主题失败:', err);
    res.json({ code: 500, msg: '主题保存失败' });
  }
});

// 接口5：保存服务配置（修复服务管理问题）
app.post('/api/save-services', (req, res) => {
  try {
    const { services } = req.body;
    if (!Array.isArray(services)) {
      return res.json({ code: 400, msg: '请传入有效的服务列表' });
    }
    
    const config = readConfig();
    config.services = services;
    writeConfig(config);
    
    res.json({ code: 200, msg: '服务配置保存成功，已实时同步' });
  } catch (err) {
    console.error('保存服务失败:', err);
    res.json({ code: 500, msg: '服务保存失败' });
  }
});

// 接口6：保存标题配置（修改主界面和管理界面的标题）
app.post('/api/save-titles', (req, res) => {
  const { titles } = req.body;
  if (!titles) {
    return res.json({ code: 400, msg: '请传入有效的标题配置' });
  }
  const config = readConfig();
  config.titles = { ...config.titles, ...titles }; // 合并新标题配置
  writeConfig(config);
  res.json({ code: 200, msg: '标题修改成功，已实时同步' });
});

// 接口7：上传自定义图标（返回可直接使用的URL）
app.post('/api/upload-icon', iconUpload.single('icon'), (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.json({ code: 400, msg: '请选择要上传的图标文件' });
    }
    // 重命名文件：时间戳+原文件名，避免重名覆盖
    const newFileName = `${Date.now()}-${file.originalname}`;
    const newFilePath = path.join(ICON_UPLOAD_DIR, newFileName);
    fs.renameSync(file.path, newFilePath); // 移动并重命名文件
    const iconUrl = `/icons/${newFileName}`; // 前端可直接使用的相对URL
    res.json({ code: 200, msg: '图标上传成功', data: { iconUrl } });
  } catch (err) {
    res.json({ code: 500, msg: '图标上传失败：' + err.message });
  }
});

// 接口8：上传自定义字体（修复字体上传问题）
app.post('/api/upload-font', fontUpload.single('font'), (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.json({ code: 400, msg: '请选择要上传的字体文件' });
    }
    
    // 获取字体名称（直接使用原始文件名，移除扩展名）
    const fontName = path.parse(file.originalname).name;
    if (!fontName) {
      return res.json({ code: 400, msg: '字体文件名无效' });
    }
    
    const newFileName = `${Date.now()}-${file.originalname}`;
    const newFilePath = path.join(FONT_UPLOAD_DIR, newFileName);
    
    // 移动并重命名文件
    fs.renameSync(file.path, newFilePath);
    
    // 获取字体URL
    const fontUrl = `/fonts/${newFileName}`;
    
    // 读取当前配置
    const config = readConfig();
    if (!config.theme) config.theme = {};
    if (!config.theme.customFonts) config.theme.customFonts = [];
    
    // 检查是否已存在相同字体名称
    const existingFont = config.theme.customFonts.find(f => 
      f.name.toLowerCase() === fontName.toLowerCase()
    );
    
    if (existingFont) {
      // 更新现有字体
      existingFont.url = fontUrl;
    } else {
      // 添加新字体
      config.theme.customFonts.push({
        id: `font-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: fontName,
        url: fontUrl,
        family: `'${fontName}', sans-serif`
      });
    }
    
    writeConfig(config);
    
    res.json({ 
      code: 200, 
      msg: '字体上传成功', 
      data: { 
        fontName, 
        fontUrl,
        fontFamily: `'${fontName}', sans-serif`
      } 
    });
  } catch (err) {
    console.error('字体上传失败:', err);
    res.json({ code: 500, msg: '字体上传失败：' + err.message });
  }
});

// 接口9：获取已上传的字体列表
app.get('/api/fonts', (req, res) => {
  try {
    const config = readConfig();
    res.json({ code: 200, data: config.theme?.customFonts || [] });
  } catch (err) {
    res.json({ code: 500, msg: '获取字体列表失败' });
  }
});

// 接口10：删除字体
app.post('/api/delete-font', (req, res) => {
  try {
    const { fontId } = req.body;
    if (!fontId) {
      return res.json({ code: 400, msg: '请传入字体ID' });
    }
    
    const config = readConfig();
    if (!config.theme || !config.theme.customFonts) {
      return res.json({ code: 400, msg: '没有已上传的字体' });
    }
    
    // 查找字体
    const fontIndex = config.theme.customFonts.findIndex(font => font.id === fontId);
    if (fontIndex === -1) {
      return res.json({ code: 404, msg: '字体不存在' });
    }
    
    // 获取字体信息
    const font = config.theme.customFonts[fontIndex];
    
    // 删除字体文件
    if (font.url) {
      const fontPath = path.join(__dirname, 'public', font.url.replace(/^\//, ''));
      if (fs.existsSync(fontPath)) {
        fs.unlinkSync(fontPath);
      }
    }
    
    // 从配置中删除字体
    config.theme.customFonts.splice(fontIndex, 1);
    writeConfig(config);
    
    res.json({ code: 200, msg: '字体删除成功' });
  } catch (err) {
    console.error('删除字体失败:', err);
    res.json({ code: 500, msg: '删除字体失败：' + err.message });
  }
});

// 接口11：获取本地Font Awesome图标库（基于本地v7版本）
app.get('/api/download-fontawesome', (req, res) => {
  try {
    // 基于本地Font Awesome v7版本的常用图标列表
    const localIcons = [
      'fas fa-cloud', 'fas fa-server', 'fas fa-globe', 'fas fa-link', 'fas fa-home',
      'fas fa-wifi', 'fas fa-database', 'fas fa-code', 'fas fa-terminal', 'fas fa-laptop',
      'fas fa-desktop', 'fas fa-mobile-alt', 'fas fa-tablet-alt', 'fas fa-network-wired', 'fas fa-satellite',
      'fas fa-file', 'fas fa-folder', 'fas fa-save', 'fas fa-upload', 'fas fa-download',
      'fas fa-cog', 'fas fa-sliders-h', 'fas fa-tools', 'fas fa-wrench', 'fas fa-key',
      'fas fa-lock', 'fas fa-unlock', 'fas fa-user', 'fas fa-users', 'fas fa-shield-alt',
      'fas fa-chart-bar', 'fas fa-bell', 'fas fa-envelope', 'fas fa-search', 'fas fa-times',
      'fas fa-check', 'fas fa-plus', 'fas fa-minus', 'fas fa-edit', 'fas fa-trash',
      'fas fa-arrow-up', 'fas fa-arrow-down', 'fas fa-arrow-left', 'fas fa-arrow-right', 'fas fa-refresh',
      'fas fa-undo', 'fas fa-redo', 'fas fa-star', 'fas fa-heart', 'fas fa-clock'
    ];
    
    // 返回本地图标库信息
    res.json({ 
      code: 200, 
      msg: '本地Font Awesome图标库加载成功', 
      data: { 
        icons: localIcons,
        stats: {
          total: localIcons.length,
          success: localIcons.length,
          failed: 0,
          retried: 0,
          errors: []
        },
        source: '本地Font Awesome v7.1.0'
      } 
    });
  } catch (err) {
    console.error('加载本地Font Awesome图标库失败:', err);
    res.json({ code: 500, msg: '加载本地Font Awesome图标库失败：' + err.message });
  }
});

// 接口12：获取Font Awesome图标列表（基于本地图标库）
app.get('/api/fontawesome-icons', (req, res) => {
  try {
    // 返回基于本地Font Awesome v7版本的常用图标列表
    const localIcons = [
      'fas fa-cloud', 'fas fa-server', 'fas fa-globe', 'fas fa-link', 'fas fa-home',
      'fas fa-wifi', 'fas fa-database', 'fas fa-code', 'fas fa-terminal', 'fas fa-laptop',
      'fas fa-desktop', 'fas fa-mobile-alt', 'fas fa-tablet-alt', 'fas fa-network-wired', 'fas fa-satellite',
      'fas fa-file', 'fas fa-folder', 'fas fa-save', 'fas fa-upload', 'fas fa-download',
      'fas fa-cog', 'fas fa-sliders-h', 'fas fa-tools', 'fas fa-wrench', 'fas fa-key',
      'fas fa-lock', 'fas fa-unlock', 'fas fa-user', 'fas fa-users', 'fas fa-shield-alt',
      'fas fa-chart-bar', 'fas fa-bell', 'fas fa-envelope', 'fas fa-search', 'fas fa-times',
      'fas fa-check', 'fas fa-plus', 'fas fa-minus', 'fas fa-edit', 'fas fa-trash',
      'fas fa-arrow-up', 'fas fa-arrow-down', 'fas fa-arrow-left', 'fas fa-arrow-right', 'fas fa-refresh',
      'fas fa-undo', 'fas fa-redo', 'fas fa-star', 'fas fa-heart', 'fas fa-clock'
    ];
    
    res.json({ code: 200, data: localIcons });
  } catch (err) {
    console.error('获取Font Awesome图标列表失败:', err);
    res.json({ code: 500, msg: '获取Font Awesome图标列表失败：' + err.message });
  }
});

// 接口13：上传背景图片和视频
const backgroundUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, BACKGROUND_UPLOAD_DIR);
      } else if (file.mimetype.startsWith('video/')) {
        cb(null, VIDEO_UPLOAD_DIR);
      } else {
        cb(new Error('不支持的文件类型'), null);
      }
    },
    filename: (req, file, cb) => {
      const newFileName = `${Date.now()}-${file.originalname}`;
      cb(null, newFileName);
    }
  }),
  limits: {
    fileSize: 200 * 1024 * 1024 // 限制文件大小200MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('仅支持图片和视频文件！'), false);
    }
  }
});

app.post('/api/upload', backgroundUpload.single('file'), (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.json({ code: 400, msg: '请选择要上传的文件' });
    }
    
    let url = '';
    if (file.mimetype.startsWith('image/')) {
      url = `/backgrounds/${file.filename}`;
    } else if (file.mimetype.startsWith('video/')) {
      url = `/videos/${file.filename}`;
    }
    
    res.json({ code: 200, msg: '文件上传成功', data: { url } });
  } catch (err) {
    console.error('文件上传失败:', err);
    res.json({ code: 500, msg: '文件上传失败：' + err.message });
  }
});

// 接口14：导出备份
app.get('/api/backup/export', (req, res) => {
  try {
    const config = readConfig();
    
    // 生成备份文件名：年-月-日-时-分-秒
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    const backupFileName = `backup-${timestamp}.json`;
    const backupFilePath = path.join(BACKUP_DIR, backupFileName);
    
    // 保存备份文件
    fs.writeFileSync(backupFilePath, JSON.stringify(config, null, 2), 'utf8');
    
    // 检查并清理旧备份
    cleanupOldBackups(config.backup.maxBackups);
    
    // 提供下载
    res.download(backupFilePath, backupFileName, (err) => {
      if (err) {
        console.error('下载备份失败:', err);
        res.json({ code: 500, msg: '下载备份失败：' + err.message });
      }
    });
  } catch (err) {
    console.error('导出备份失败:', err);
    res.json({ code: 500, msg: '导出备份失败：' + err.message });
  }
});

// 备份上传配置
const backupUpload = multer({ 
  dest: BACKUP_DIR,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('仅支持JSON格式的备份文件！'), false);
    }
  }
});

// 接口15：导入备份
app.post('/api/backup/import', backupUpload.single('backup'), (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.json({ code: 400, msg: '请选择要上传的备份文件' });
    }
    
    // 读取备份文件内容
    const backupContent = fs.readFileSync(file.path, 'utf8');
    const backupConfig = JSON.parse(backupContent);
    
    // 验证备份文件格式
    if (!backupConfig || typeof backupConfig !== 'object') {
      fs.unlinkSync(file.path);
      return res.json({ code: 400, msg: '备份文件格式错误' });
    }
    
    // 保存配置
    writeConfig(backupConfig);
    
    // 删除临时上传的备份文件
    fs.unlinkSync(file.path);
    
    res.json({ code: 200, msg: '备份导入成功，配置已恢复' });
  } catch (err) {
    console.error('导入备份失败:', err);
    res.json({ code: 500, msg: '导入备份失败：' + err.message });
  }
});

// 接口16：获取备份列表
app.get('/api/backup/list', (req, res) => {
  try {
    // 读取备份目录中的所有文件
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
      .map(file => {
        const stats = fs.statSync(path.join(BACKUP_DIR, file));
        return {
          name: file,
          size: stats.size,
          created: stats.mtime.toISOString(),
          path: `/backups/${file}`
        };
      })
      .sort((a, b) => new Date(b.created) - new Date(a.created)); // 按创建时间排序，最新的在前
    
    res.json({ code: 200, data: files });
  } catch (err) {
    console.error('获取备份列表失败:', err);
    res.json({ code: 500, msg: '获取备份列表失败：' + err.message });
  }
});

// 接口17：删除备份
app.post('/api/backup/delete', (req, res) => {
  try {
    const { fileName } = req.body;
    if (!fileName) {
      return res.json({ code: 400, msg: '请传入备份文件名' });
    }
    
    // 验证文件名格式
    if (!fileName.startsWith('backup-') || !fileName.endsWith('.json')) {
      return res.json({ code: 400, msg: '无效的备份文件名' });
    }
    
    const backupFilePath = path.join(BACKUP_DIR, fileName);
    
    // 检查文件是否存在
    if (!fs.existsSync(backupFilePath)) {
      return res.json({ code: 404, msg: '备份文件不存在' });
    }
    
    // 删除文件
    fs.unlinkSync(backupFilePath);
    
    res.json({ code: 200, msg: '备份删除成功' });
  } catch (err) {
    console.error('删除备份失败:', err);
    res.json({ code: 500, msg: '删除备份失败：' + err.message });
  }
});

// 接口18：获取备份配置
app.get('/api/backup/config', (req, res) => {
  try {
    const config = readConfig();
    res.json({ code: 200, data: config.backup });
  } catch (err) {
    console.error('获取备份配置失败:', err);
    res.json({ code: 500, msg: '获取备份配置失败：' + err.message });
  }
});

// 接口19：更新备份配置
app.post('/api/backup/config', (req, res) => {
  try {
    const { maxBackups, backupInterval } = req.body;
    
    if (maxBackups === undefined || backupInterval === undefined) {
      return res.json({ code: 400, msg: '请传入完整的备份配置' });
    }
    
    if (maxBackups < 1 || maxBackups > 100) {
      return res.json({ code: 400, msg: '最大备份数量应在1-100之间' });
    }
    
    if (backupInterval < 1 || backupInterval > 1440) {
      return res.json({ code: 400, msg: '备份间隔应在1-1440分钟之间' });
    }
    
    const config = readConfig();
    config.backup = {
      maxBackups: parseInt(maxBackups),
      backupInterval: parseInt(backupInterval)
    };
    
    writeConfig(config);
    
    // 重新启动定时备份任务
    startBackupInterval();
    
    res.json({ code: 200, msg: '备份配置更新成功' });
  } catch (err) {
    console.error('更新备份配置失败:', err);
    res.json({ code: 500, msg: '更新备份配置失败：' + err.message });
  }
});

// 接口20：本地服务静态网页上传（支持批量上传）
const localServiceUpload = multer({
  dest: LOCAL_SERVICE_DIR,
  limits: { fileSize: 10 * 1024 * 1024 }, // 限制单个文件大小10M
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/html', 'text/css', 'text/javascript', 
      'application/javascript', 'image/png', 'image/jpg', 
      'image/jpeg', 'image/gif', 'image/svg+xml',
      'application/json', 'text/plain'
    ];
    if (allowedTypes.includes(file.mimetype) || 
        file.originalname.match(/\.(html|css|js|png|jpg|jpeg|gif|svg|json|txt)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持HTML、CSS、JS、图片、JSON和文本文件！'), false);
    }
  }
});

app.post('/api/upload-local-service', localServiceUpload.array('files', 10), (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.json({ code: 400, msg: '请选择要上传的文件' });
    }
    
    const uploadedFiles = [];
    
    files.forEach(file => {
      // 重命名文件：服务ID + 时间戳 + 原文件名
      const serviceId = req.body.serviceId || 'default';
      const serviceDir = path.join(LOCAL_SERVICE_DIR, serviceId);
      fs.ensureDirSync(serviceDir);
      
      const newFileName = `${Date.now()}-${file.originalname}`;
      const newFilePath = path.join(serviceDir, newFileName);
      fs.renameSync(file.path, newFilePath);
      
      const fileUrl = `/local-services/${serviceId}/${newFileName}`;
      uploadedFiles.push({ 
        name: file.originalname, 
        url: fileUrl 
      });
    });
    
    res.json({ 
      code: 200, 
      msg: `文件上传成功，共上传 ${uploadedFiles.length} 个文件`, 
      data: { files: uploadedFiles } 
    });
  } catch (err) {
    console.error('上传本地服务文件失败:', err);
    res.json({ code: 500, msg: '文件上传失败：' + err.message });
  }
});

// 接口21：保存本地服务内容（在线编辑）
app.post('/api/save-local-service-content', (req, res) => {
  try {
    const { serviceId, content, fileName } = req.body;
    
    if (!serviceId || !content || !fileName) {
      return res.json({ code: 400, msg: '请提供完整的服务信息' });
    }
    
    const serviceDir = path.join(LOCAL_SERVICE_DIR, serviceId);
    fs.ensureDirSync(serviceDir);
    
    const filePath = path.join(serviceDir, fileName);
    fs.writeFileSync(filePath, content, 'utf8');
    
    const fileUrl = `/local-services/${serviceId}/${fileName}`;
    
    res.json({ 
      code: 200, 
      msg: '内容保存成功', 
      data: { url: fileUrl } 
    });
  } catch (err) {
    console.error('保存本地服务内容失败:', err);
    res.json({ code: 500, msg: '内容保存失败：' + err.message });
  }
});

// 接口22：获取本地服务文件列表
app.get('/api/local-service-files/:serviceId', (req, res) => {
  try {
    const { serviceId } = req.params;
    const serviceDir = path.join(LOCAL_SERVICE_DIR, serviceId);
    
    if (!fs.existsSync(serviceDir)) {
      return res.json({ code: 200, data: [] });
    }
    
    const files = fs.readdirSync(serviceDir).map(file => {
      const filePath = path.join(serviceDir, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size,
        mtime: stats.mtime,
        url: `/local-services/${serviceId}/${file}`
      };
    });
    
    res.json({ code: 200, data: files });
  } catch (err) {
    console.error('获取本地服务文件列表失败:', err);
    res.json({ code: 500, msg: '获取文件列表失败：' + err.message });
  }
});

// 接口23：删除本地服务文件
app.post('/api/delete-local-service-file', (req, res) => {
  try {
    const { serviceId, fileName } = req.body;
    
    if (!serviceId || !fileName) {
      return res.json({ code: 400, msg: '请提供完整的文件信息' });
    }
    
    const filePath = path.join(LOCAL_SERVICE_DIR, serviceId, fileName);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ code: 200, msg: '文件删除成功' });
    } else {
      res.json({ code: 404, msg: '文件不存在' });
    }
  } catch (err) {
    console.error('删除本地服务文件失败:', err);
    res.json({ code: 500, msg: '文件删除失败：' + err.message });
  }
});

// 启动服务，监听所有网卡的80端口
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ 导航服务已成功启动，监听端口：${PORT}`);
  console.log(`📌 主展示界面：http://localhost${PORT === 80 ? '' : `:${PORT}`}`);
  console.log(`📌 管理后台界面：http://localhost${PORT === 80 ? '' : `:${PORT}`}/admin.html`);
  
  // 启动定时备份任务
  startBackupInterval();
});