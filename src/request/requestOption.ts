export type ErrorMessageMode = 'none' | 'modal' | 'message' | undefined;

export interface RequestOptions {
  // Splicing request parameters to url
  joinParamsToUrl?: boolean;
  // Format request parameter time
  formatDate?: boolean;
  // Whether to process the request result
  isTransformResponse?: boolean;
  // Whether to return native response headers
  // For example: use this attribute when you need to get the response headers
  isReturnNativeResponse?: boolean;
  // Whether to join url
  joinPrefix?: boolean;
  /**
   *  请求的公共前缀, 例如 "/scale", 一般这里是写 import.meta.env.BASE_URL
   */
  apiUrl?: string | (() => string);
  /**
   * 请求前缀，例如: /basis_api
   */
  urlPrefix?: string;
  /**
   * 错误提示的方式
   */
  errorMessageMode?: ErrorMessageMode;
  // Whether to add a timestamp
  joinTime?: boolean;
  ignoreCancelToken?: boolean;
  // Whether to send token in header
  withToken?: boolean;
  // 请求重试机制
  retryRequest?: RetryRequest;
  /** 错误码的字段名 */
  messageKey?: string;
  onServerTimeChange?: (time: number) => void;
}

export interface RetryRequest {
  isOpenRetry: boolean;
  count: number;
  waitTime: number;
}
export type Result<T = any> =
  | {
      status: 'success';
      message: string;
      data: T;
      datetime?: number;
    }
  | {
      status: 'fail';
      message: string;
      data: undefined;
      datetime?: number;
    };

// multipart/form-data: upload file
export interface UploadFileParams {
  // Other parameters
  data?: Record<string, any>;
  // File parameter interface field name
  name?: string;
  // file name
  file: File | Blob;
  // file name
  filename?: string;
  [key: string]: any;
}
