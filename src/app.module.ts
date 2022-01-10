import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TagModule } from '@app/tag/tag.module';
import { UserModule } from './user/user.module';
import ormConfig from '@app/ormconfig';
import { AuthMiddleware } from '@app/user/middlewares/auth.middleware';
import {ArticleModule} from "@app/article/article.module";
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [TypeOrmModule.forRoot(ormConfig), TagModule, UserModule, ArticleModule, ProfileModule],
  controllers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
