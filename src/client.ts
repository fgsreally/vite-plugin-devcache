import { resolve } from 'path'
import type { PluginOption, ViteDevServer } from 'vite'
import fse from 'fs-extra'
export function client(): PluginOption {
  let server: ViteDevServer
  let cache: { [key: string]: string } = {}
  const cachePath = resolve(process.cwd(), 'node_modules/.vite/cache', '_cache.json')
  return {
    name: 'client-persist-cache',
    configureServer: async (_server) => {
      server = _server
      server.middlewares.use((req, res, next) => {
        const url = req.url as string
        if (cache[url]) {
          const ifNoneMatch = req.headers['if-none-match']
          if (ifNoneMatch && cache[url] === ifNoneMatch) {
            const { moduleGraph, transformRequest } = server
            if (moduleGraph.urlToModuleMap.size && moduleGraph.urlToModuleMap.get(url) && moduleGraph.urlToModuleMap.get(url)?.transformResult) {
              next()
              return
            }
            else {
              res.statusCode = 304
              setTimeout(() => {
                transformRequest(req.url as string, {
                  html: req.headers.accept?.includes('text/html'),
                })
              }, 3000)
              return res.end()
            }
          }
        }
        next()
      })
    },
    buildStart: async () => {
      if (fse.existsSync(cachePath))
        cache = fse.readJSONSync(cachePath)

      process.once('SIGINT', async () => {
        try {
          await server.close()
        }
        finally {
          process.exit()
        }
      })
    },
    buildEnd: async () => {
      for (const [key, value] of server.moduleGraph.urlToModuleMap) {
        if (value.transformResult && value.transformResult.etag)
          cache[key] = value.transformResult.etag
      }
      fse.outputJSON(cachePath, JSON.stringify(cache), (err) => {
        // eslint-disable-next-line no-console
        err && console.log(err)
      })
    },
  }
}
