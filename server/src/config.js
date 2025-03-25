// 根据环境变量设置配置类
// 在启动应用程序之前，设置环境变量 NODE_ENV 为 'production' 或 'development'

class Config {
  db = 'mongodb://localhost:27017/weird-factory';
  jwtSecret = 'NL@*&$)@&0UQhauosy*YR*YOHjlabflsb';
  sessionSecret = 'NL@*&$)@&0UQhauosy*YR*YOHjlabflsb';
  emailUser = '';
  emailPass = '';
  emailService = 'gmail';
  host = 'http://localhost:3000';
  sessionMaxAge = '2y';
  env = 'development';
  sendEmail = false;
  gameVersion = '1.0.2';
  port = 3000;
}

class ProductionConfig extends Config {
  emailUser = '';
  emailPass = '';
  emailService = 'gmail';
  host = 'http://43.133.1.198:3000';
  sessionMaxAge = '2y';
  env = 'production';
  sendEmail = false;
  port = 80;
}

const config = process.env.NODE_ENV === 'production' ? new ProductionConfig() : new Config();

export default config;