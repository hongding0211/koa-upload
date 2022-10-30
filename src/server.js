const Koa = require('koa')
const Router = require('koa-router')
const { koaBody } = require('koa-body')
const koaStatic = require('koa-static')
const path = require('path')

const app = new Koa()
const router = new Router()

router.post('/upload', ctx => {
    const file = ctx.request.files['file']
    const basename = path.basename(file.filepath)
    ctx.body = { "url": `${ctx.origin}/files/${basename}` }
})

app.use(koaStatic('.'))

app.use(koaBody({
    multipart: true,
    formidable: {
        uploadDir: path.join(__dirname, '../files'),
        keepExtensions: true,
    }
}))

app.use(router.routes())

app.listen(3000)