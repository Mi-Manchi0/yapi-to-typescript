// axios配置  可自行根据项目进行更改，只需更改该文件即可，其他文件可以不动
// The axios configuration can be changed according to the project, just change the file, other files can be left unchanged
import type { AxiosResponse } from 'axios'
import { clone } from 'lodash'
import { getConfig, setConfig } from './config'

import { ContentTypeEnum, RequestEnum } from './enums'

import { deepMerge, normaliseHttpUrl, setObjToUrlParams } from './utils'

import { isFormData, isString } from './is'
import type { RequestOptions, Result } from './requestOption'

import { VAxios } from './Axios'
import type { AxiosTransform, CreateAxiosOptions } from './axiosTransform'
import { checkStatus } from './checkStatus'
import { formatRequestDate, joinTimestamp } from './helper'
import type {
  ErrorMessageMode,
  RetryRequest,
  UploadFileParams,
} from './requestOption'
import { updateServerTime } from './updateServerTime'

export { AxiosCanceler } from './axiosCancel'
export { setConfig, getConfig }
export type {
  ErrorMessageMode,
  RetryRequest,
  UploadFileParams,
  RequestOptions,
  Result,
}

declare global {
  interface Window {
    /** 服务器时间戳 */
    $serverTimeStamp: number
    /** 原始的 Date 对象 */
    $OriginDate: DateConstructor
  }
}

/**
 * @description: 数据处理，方便区分多种处理方式
 */
const transform: AxiosTransform = {
  /**
   * @description: 处理响应数据。如果数据不是预期格式，可直接抛出错误
   */
  transformResponseHook: (
    res: AxiosResponse<Result>,
    options: RequestOptions,
  ) => {
    const CONFIG = getConfig()
    const { isTransformResponse, isReturnNativeResponse } = options
    // 是否返回原生响应头 比如：需要获取响应头时使用该属性
    if (isReturnNativeResponse) {
      return res
    }
    // 不进行任何处理，直接返回
    // 用于页面代码可能需要直接获取code，data，message这些信息时开启
    if (!isTransformResponse) {
      return res.data
    }
    // 错误的时候返回

    const { data } = res
    if (!data) {
      // return '[HTTP] Request has no return value';
      throw new Error('请求出错，请稍后重试')
    }
    //  这里 code，result，message为 后台统一的字段，需要在 types.ts内修改为项目自己的接口返回格式
    const { data: httpData, status, datetime } = data
    const message = (data as any)[options.messageKey!]

    if (datetime) {
      updateServerTime(datetime)
      options.onServerTimeChange?.(datetime)
      CONFIG.onServerTimeChange?.(datetime)
    }

    // 这里逻辑可以根据项目进行修改
    const hasSuccess = data && status === 'success'
    if (hasSuccess) {
      return httpData
    }

    // 在此处根据自己项目的实际情况对不同的code执行不同的操作
    // 如果不希望中断当前请求，请return数据，否则直接抛出异常即可
    let timeoutMsg = ''
    if (message) {
      timeoutMsg = message
    }

    // errorMessageMode=‘modal’的时候会显示modal错误弹窗，而不是消息提示，用于一些比较重要的错误
    // errorMessageMode='none' 一般是调用时明确表示不希望自动弹出错误提示
    if (options.errorMessageMode === 'modal') {
      CONFIG.showModalError({ title: '错误提示', content: timeoutMsg })
    } else if (options.errorMessageMode === 'message') {
      CONFIG.showMessageError(timeoutMsg)
    }

    // 这个一般不会走这个逻辑了，不过说不准有老版本的api还是这个逻辑
    if ('token已过期' === timeoutMsg.trim()) {
      CONFIG.onTokenExpired()
    }

    throw new Error(timeoutMsg || '请求出错，请稍后重试')
  },

  // 请求之前处理config
  beforeRequestHook: (config, options) => {
    const {
      apiUrl,
      joinPrefix,
      joinParamsToUrl,
      formatDate,
      joinTime = true,
      urlPrefix,
    } = options

    if (joinPrefix) {
      config.url = `${urlPrefix}${config.url}`
    }

    // 如果有传入的apiUrl，则使用传入的apiUrl，否则使用配置的apiUrl
    const CONFIG = getConfig()
    const normaliseApiUrl = () => {
      const api = apiUrl || CONFIG.apiUrl
      if (!api) {
        return undefined
      } else if (typeof api === 'function') {
        return api()
      }
      return api
    }
    const baseUrl = normaliseApiUrl()
    config.url = `${baseUrl}${config.url}`
    config.url = normaliseHttpUrl(config.url as string)

    const params = config.params || {}
    const data = config.data || false
    formatDate && data && !isString(data) && formatRequestDate(data)
    if (config.method?.toUpperCase() === RequestEnum.GET) {
      if (!isString(params)) {
        // 给 get 请求加上时间戳参数，避免从缓存中拿数据。
        config.params = Object.assign(
          params || {},
          joinTimestamp(joinTime, false),
        )
      } else {
        // 兼容restful风格
        config.url = `${config.url + params}${joinTimestamp(joinTime, true)}`
        config.params = undefined
      }
    } else {
      if (!isString(params)) {
        formatDate && formatRequestDate(params)
        if (
          Reflect.has(config, 'data') &&
          config.data &&
          (Object.keys(config.data).length > 0 || isFormData(config.data))
        ) {
          config.data = data
          config.params = params
        } else {
          // 非GET请求如果没有提供data，则将params视为data
          config.data = params
          config.params = undefined
        }
        if (joinParamsToUrl) {
          config.url = setObjToUrlParams(
            config.url as string,
            Object.assign({}, config.params, config.data),
          )
        }
      } else {
        // 兼容restful风格
        config.url = config.url + params
        config.params = undefined
      }
    }

    return config
  },
  /**
   * @description: 请求拦截器处理
   */
  requestInterceptors: config => {
    return config
  },

  /**
   * @description: 响应拦截器处理
   */
  responseInterceptors: (res: AxiosResponse<any>) => {
    return res
  },

  /**
   * @description: 响应错误处理
   */
  responseInterceptorsCatch: (_axiosInstance: AxiosResponse, error: any) => {
    const CONFIG = getConfig()
    const { response, code, message, config } = error || {}
    const errorMessageMode = config?.requestOptions?.errorMessageMode || 'none'

    const msg: string =
      (response?.data?.[config?.requestOptions?.messageKey] ||
        response?.data?.error?.message) ??
      ''

    const err: string = error?.toString?.() ?? ''
    let errMessage = ''

    try {
      if (code === 'ECONNABORTED' && message.indexOf('timeout') !== -1) {
        errMessage = '接口请求超时，请刷新页面重试！'
      }
      if (err?.includes('Network Error')) {
        errMessage = '网络异常，请检查您的网络连接是否正常'
      }

      if (errMessage) {
        if (errorMessageMode === 'modal') {
          CONFIG.showModalError({ title: '错误提示', content: errMessage })
        } else if (errorMessageMode === 'message') {
          CONFIG.showMessageError(errMessage)
        }
        return Promise.reject(error)
      }
    } catch (error) {
      throw new Error(error as unknown as string)
    }

    checkStatus(error?.response?.status, msg, errorMessageMode)
    return Promise.reject(error)
  },
}

export function createAxios(opt?: Partial<CreateAxiosOptions>) {
  return new VAxios(
    // 深度合并
    deepMerge(
      {
        // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication#authentication_schemes
        // authentication schemes，e.g: Bearer
        // authenticationScheme: 'Bearer',
        authenticationScheme: '',
        timeout: 10 * 1000,
        // 基础接口地址
        // baseURL: globSetting.apiUrl,

        headers: { 'Content-Type': ContentTypeEnum.JSON },
        // 如果是form-data格式
        // headers: { 'Content-Type': ContentTypeEnum.FORM_URLENCODED },
        // 数据处理方式
        transform: clone(transform),
        // 配置项，下面的选项都可以在独立的接口请求中覆盖
        requestOptions: {
          // 默认将prefix 添加到url
          joinPrefix: true,
          // 是否返回原生响应头 比如：需要获取响应头时使用该属性
          isReturnNativeResponse: false,
          // 需要对返回数据进行处理
          isTransformResponse: true,
          // post请求的时候添加参数到url
          joinParamsToUrl: false,
          // 格式化提交参数时间
          formatDate: true,
          // 消息提示类型
          errorMessageMode: 'message',
          messageKey: 'message',
          // 接口地址
          apiUrl: '',
          // 接口拼接地址
          urlPrefix: '',
          //  是否加入时间戳
          joinTime: true,
          // 忽略重复请求
          ignoreCancelToken: true,
          // 是否携带token
          withToken: true,
          retryRequest: {
            isOpenRetry: false,
            count: 5,
            waitTime: 100,
          },
        },
      },
      opt || {},
    ),
  )
}
