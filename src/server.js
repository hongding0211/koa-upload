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
  const { token, compress, fixedWidth } = ctx.query

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

  const { file } = ctx.request.files
  const { filepath } = file
  const basename = path.basename(filepath)

  const compressFileNames = {}

  const data = fs.readFileSync(filepath)
  const img = images(data)

  if (compress === 'true' || !Number.isNaN(+fixedWidth)) {
    const { width } = img.size()
    for (let i = 1; i <= 4; i *= 2) {
      const newPath = filepath.replace(/(.+)\.(\w+$)/, `$1_${100 / i}.jpg`)
      img.resize(width / i).save(newPath, {
        quality: 75,
      })
      compressFileNames[100 / i] = `${BASE_URL}/${basename.replace(
        /(.+)\.(\w+$)/,
        `$1_${100 / i}.jpg`
      )}`
      if (!Number.isNaN(+fixedWidth)) {
        break
      }
    }

    if (!Number.isNaN(+fixedWidth)) {
      const w = +fixedWidth
      const newPath = filepath.replace(/(.+)\.(\w+$)/, `$1_fixedWidth_${w}.jpg`)
      img.resize(w).save(newPath, {
        quality: 75,
      })
      console.log(newPath)
      compressFileNames.fixedWidth = `${BASE_URL}/${basename.replace(
        /(.+)\.(\w+$)/,
        `$1_fixedWidth_${w}.jpg`
      )}`
    }

    fs.unlink(filepath, () => {})
  }

  ctx.body = {
    url: `${BASE_URL}/${basename}`,
    compress:
      compress === 'true' || !Number.isNaN(+fixedWidth)
        ? compressFileNames
        : undefined,
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

app.use(router.routes())

app.listen(3000)
