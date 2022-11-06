const Koa = require('koa')
const Router = require('koa-router')
const koaStatic = require('koa-static')
const path = require('path')
const shajs = require('sha.js')
const { koaBody } = require('koa-body')
const { BASE_URL, SECRET } = require('./config')

const app = new Koa()
const router = new Router()

router.post('/', (ctx) => {
  const { file } = ctx.request.files
  const basename = path.basename(file.filepath)
  ctx.body = { url: `${BASE_URL}/${basename}` }
})

app.use(koaStatic('.'))

app.use(async (ctx, next) => {
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
  await next()
})

app.use(
  koaBody({
    multipart: true,
    formidable: {
      // eslint-disable-next-line
      uploadDir: path.join(__dirname, '../files'),
      keepExtensions: true,
    },
  })
)

app.use(router.routes())

app.listen(3000)
