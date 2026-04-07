import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import * as express from 'express'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false })
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ limit: '10mb', extended: true }))
  app.setGlobalPrefix('api')
  app.enableCors({
    origin: '*',
  })
  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()
