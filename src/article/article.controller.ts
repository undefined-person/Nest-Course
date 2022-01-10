import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Put, Query,
    UseGuards,
    UsePipes,
    ValidationPipe
} from "@nestjs/common";
import {ArticleService} from "@app/article/article.service";
import {AuthGuard} from "@app/user/guards/auth.guard";
import {User} from "@app/user/decorators/user.decorator";
import {UserEntity} from "@app/user/user.entity";
import {CreateArticleDto} from "@app/article/dto/createArticle.dto";
import {ArticleResponseInterface} from "@app/article/types/articleResponse.interface";
import {ArticlesResponseInterface} from "@app/article/types/articlesResponse.interface";

@Controller('articles')
export class ArticleController {
    constructor(private readonly articleService: ArticleService) {}

    @Get()
    async findAll(@User('id') currentUserId: number, @Query() query: any): Promise<ArticlesResponseInterface> {
        return await this.articleService.findAll(currentUserId, query)
    }

    @Get('/feed')
    @UseGuards(AuthGuard)
    async getFeed(@User('id') currentUserId: number, @Query() query: any): Promise<ArticlesResponseInterface> {
        return await this.articleService.getFeed(currentUserId, query)
    }

    @Post()
    @UseGuards(AuthGuard)
    @UsePipes(new ValidationPipe())
    async create(@User() currentUser: UserEntity, @Body('article') createArticleDto: CreateArticleDto): Promise<ArticleResponseInterface> {
        const article = await this.articleService.createArticle(currentUser, createArticleDto)
        return this.articleService.buildArticleResponse(article)
    }

    @Get(':slug')
    async getArticleBySlug(@Param('slug') slug: string): Promise<ArticleResponseInterface>{
       const article = await this.articleService.getArticleBySlug(slug)
        return this.articleService.buildArticleResponse(article)
    }

    @Delete(':slug')
    @UseGuards(AuthGuard)
    async deleteArticle(@Param('slug') slug: string, @User('id') currentUserId: number) {
        return await this.articleService.deleteArticle(currentUserId, slug)
    }

    @Put(':slug')
    @UseGuards(AuthGuard)
    @UsePipes(new ValidationPipe())
    async updateArticle(@User('id') currentUserId: number, @Param('slug') slug: string, @Body('article') updateArticleDto: CreateArticleDto): Promise<ArticleResponseInterface> {
        const article = await this.articleService.updateArticle(slug, currentUserId, updateArticleDto)
        return this.articleService.buildArticleResponse(article)
    }

    @Post(':slug/favorite')
    @UseGuards(AuthGuard)
    async addArticleToFavorite(@User('id')  currentUserId: number, @Param('slug') slug: string):Promise<ArticleResponseInterface> {
        const article = await this.articleService.addArticleToFavorite(slug, currentUserId)
        return this.articleService.buildArticleResponse(article)
    }

    @Delete(':slug/favorite')
    @UseGuards(AuthGuard)
    async removeArticleFromFavorite(@User('id')  currentUserId: number, @Param('slug') slug: string):Promise<ArticleResponseInterface> {
        const article = await this.articleService.removeArticleFromFavorite(slug, currentUserId)
        return this.articleService.buildArticleResponse(article)
    }
}
