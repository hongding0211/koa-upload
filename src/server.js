const Koa = require('koa')
const Router = require('koa-router')
const koaStatic = require('koa-static')
const path = require('path')
const shajs = require('sha.js')
const { koaBody } = require('koa-body')
const cors = require('koa-cors')
const { BASE_URL, SECRET } = require('./config')
const images = require('images')
const fs = require('fs')

const app = new Koa()
const router = new Router()

router.post('/', (ctx) => {
  const { compress } = ctx.query
  const { file } = ctx.request.files
  const { filepath } = file
  const basename = path.basename(filepath)
  const compressFileNames = {}
  if (compress && compress === 'true') {
    for (let i = 1; i <= 4; i *= 2) {
      compressFileNames[100 / i] = basename.replace(
        /(.+)\.(\w+$)/,
        `$1_${100 / i}.jpg`
      )
    }
  }
  ctx.body = {
    url: `${BASE_URL}/${basename}`,
    compress: compress === 'true' ? compressFileNames : undefined,
  }
})

app.use((ctx) => {
  if (ctx.request.method !== 'POST') {
    return
  }
  const { token } = ctx.query
  if (token == null) {
    ctx.throw(401, 'Token is required')
    return
  }
  const t1 = shajs('sha256')
    .update(`${Math.floor(Date.now() / 600000)}${SECRET}`)
    .digest('hex')
  const t2 = shajs('sha256')
    .update(`${Math.floor(Date.now() / 600000 - 1)}${SECRET}`)
    .digest('hex')
  if (token !== t1 && token !== t2) {
    ctx.throw(403, 'Invalid token')
    return
  }
})

app.use(koaStatic('.'))

app.use(cors())

app.use(
  koaBody({
    multipart: true,
    formidable: {
      // eslint-disable-next-line
      uploadDir: path.join(__dirname, '../files'),
      keepExtensions: true,
    },
    formLimit: 10 * 1024 * 1024,
  })
)

app.use(async (ctx, next) => {
  const { compress } = ctx.query
  if (compress && compress !== 'true') {
    return
  }
  const { file } = ctx.request.files
  const { filepath } = file

  const data = fs.readFileSync(filepath)
  const img = images(data)
  const { width } = img.size()
  for (let i = 1; i <= 4; i *= 2) {
    const newPath = filepath.replace(/(.+)\.(\w+$)/, `$1_${100 / i}.jpg`)
    img.resize(width / i).save(newPath, {
      quality: 75,
    })
  }

  await next()
})

app.use(router.routes())

app.listen(3000)
