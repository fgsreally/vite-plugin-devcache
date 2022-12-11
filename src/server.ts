import { resolve } from 'path'
import type { PluginOption, ViteDevServer } from 'vite'
import { normalizePath } from 'vite'
import fse from 'fs-extra'
import micromatch from 'micromatch'
export function server(matchPath: string): PluginOption {
  let server: ViteDevServer
  const root = process.cwd()
  const cacheFilePath = resolve(root, 'node_modules/.vite/cache/', '_persist.json')
  let cacheMap: { [key: string]: string } = {}

  return {
    name: 'server-persist-cache',
    configureServer(_server) {
      server = _server
      server.middlewares.use(async (req, res, next) => {
        if (req.url !== '/') {
          try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const [_id, fileUrl] = await server.moduleGraph.resolveUrl(req.url as string)
            if (fileUrl in cacheMap) {
              res.setHeader('Content-Type', 'application/javascript')
              res.setHeader('Cache-Control', 'max-age=10000000000')
              res.end(cacheMap[fileUrl])
              return
            }
          }
          catch (e) {

          }
        }
        next()
      })
    },
    async  buildStart() {
      if (fse.existsSync(cacheFilePath))
        cacheMap = await fse.readJSON(cacheFilePath)

      process.once('SIGINT', async () => {
        try {
          await server.close()
        }
        finally {
          process.exit()
        }
      })
    },
    buildEnd() {
      fse.outputJsonSync(cacheFilePath, cacheMap)
    },
    transform: {
      order: 'post',
      handler(code, id) {
        if (micromatch.isMatch(id, normalizePath(resolve(root, matchPath))))
          cacheMap[id] = code
      },
    },
  }
}
