type Config = {
  /** 普通情况下报错提醒 */
  showMessageError: (message: string) => void;
  /** 弹窗报错提醒 */
  showModalError: (arg: { title: string; content: string }) => void;
  /** token过期 */
  onTokenExpired: () => void;
  apiUrl?: string | (() => string);
  onServerTimeChange?: (serverTime: number) => void;
};

let config: Config = {} as Config;

const defaultConfig: Config = {
  showMessageError(message) {
    console.log('showMessageError', message);
  },
  showModalError({ title, content }) {
    console.log('showModalError', title, content);
  },
  onTokenExpired() {
    console.log('onTokenExpired');
  },
  apiUrl: undefined,
};

/**
 * 获取当前的默认配置
 */
export const getConfig = (): Config => {
  return config;
};

/**
 * 设置请求的一些配置，会和默认配置合并
 * @param conf
 */
export const setConfig = (conf: Partial<Config>) => {
  config = Object.assign({}, defaultConfig, conf);
};
