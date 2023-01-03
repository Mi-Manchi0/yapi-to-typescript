import { defineConfig } from '../src/helpers'
import { Generator } from '../src/Generator'
export interface Config {
  name: string // 模块名称
  requestFunctionFilePath: string // 请求方法路径
  urls: string[] // api json地址
  outputFilePath?: (interfaceInfo: any) => string // 重写输出路径
}

const createConfig = (name: string, requestName: string, urls: string[]) => {
  return {
    name,
    outputFilePath(interfaceInfo: any) {
      const arr = interfaceInfo.path.split('/')
      let file = ''
      if (arr[1]) {
        file += `${arr[1]}.ts`
      }
      return `./src/services/${name}/${file}`
    },
    requestFunctionFilePath: `./request/${requestName}.ts`,
    urls,
  }
}

export const configs: Config[] = [
  createConfig('bris', 'treatment', [
    'http://192.168.100.21:8000/q/service/scheduleTreatment.Schedule',
  ]),
]

const getRequestFunctionName: any = (
  interfaceInfo: { path: string; _project: { basepath: any }; method: any },
  changeCase: {
    lowerCase: (arg0: any) => any
    upperCaseFirst: (arg0: any) => any
  },
) => {
  // eslint-disable-next-line no-underscore-dangle
  const paths = interfaceInfo.path.replace(interfaceInfo._project.basepath, '')
  const splitPaths = paths.split('/')
  let hasBy = false

  return (
    changeCase.lowerCase(interfaceInfo.method) +
    splitPaths
      .map(name => {
        const rename = name.replace('{', '').replace('}', '')
        if (rename !== name) {
          const res = `${hasBy ? 'And' : 'By'}${changeCase.upperCaseFirst(
            rename,
          )}`
          hasBy = true

          return res
        }
        return changeCase.upperCaseFirst(rename)
      })
      .join('')
  )
}

const createSubConfig = (
  serverUrl: string, // api地址
  requestFunctionFilePath: string, // 请求方法地址
  outputName = '', // 模块名
  outputFilePath?: (interfaceInfo: any) => string, // 重写输出路径回调
): any => ({
  serverUrl,
  typesOnly: false,
  target: 'typescript',
  reactHooks: {
    enabled: false,
  },
  serverType: 'swagger' as const,
  comment: {
    enabled: true,
  },
  prodEnvName: 'production',
  outputFilePath:
    outputFilePath ||
    function (interfaceInfo) {
      const name = interfaceInfo.path.split('/')[1] ?? 'index'
      if (outputName) {
        return `./src/services/${outputName}/${name}.ts`
      }
      return `./src/services/${name}.ts`
    },
  projects: [
    {
      token: '',
      categories: [
        {
          id: 0,
          getRequestFunctionName,
        },
      ],
    },
  ],
})

const create = () => {
  const result: any[] = []
  configs.forEach((config: Config) => {
    config.urls.forEach((url: string) => {
      result.push(
        createSubConfig(
          url,
          config.requestFunctionFilePath,
          config.name,
          config.outputFilePath,
        ),
      )
    })
  })

  return result
}

async function a() {
  const config = defineConfig(create())
  const generator = new Generator(config)
  await generator.prepare()
  const output = await generator.generate()
  await generator.write(output)
}

a()
