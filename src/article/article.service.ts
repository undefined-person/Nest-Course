import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {UserEntity} from "@app/user/user.entity";
import {CreateArticleDto} from "@app/article/dto/createArticle.dto";
import {ArticleEntity} from "@app/article/article.entity";
import {InjectRepository} from "@nestjs/typeorm";
import {DeleteResult, getRepository, Repository} from "typeorm";
import {ArticleResponseInterface} from "@app/article/types/articleResponse.interface";
import slugify from "slugify";
import {ArticlesResponseInterface} from "@app/article/types/articlesResponse.interface";
import { FollowEntity } from '@app/profile/follow.entity';

@Injectable()
export class ArticleService {
    constructor(@InjectRepository(ArticleEntity) private readonly articleRepository: Repository<ArticleEntity>,
                @InjectRepository(UserEntity) private readonly userRepository: Repository<UserEntity>,
                @InjectRepository(FollowEntity) private readonly followRepository: Repository<FollowEntity>) {}

    async findAll(currentUserId: number, query: any): Promise<ArticlesResponseInterface> {
        const queryBuilder = getRepository(ArticleEntity)
          .createQueryBuilder('articles')
          .leftJoinAndSelect('articles.author', 'author')

        queryBuilder.orderBy('articles.createdAt', 'DESC')

        const articlesCount = await queryBuilder.getCount()

        if (query.limit) {
            queryBuilder.limit(query.limit)
        }

        if (query.offset) {
            queryBuilder.offset(query.offset)
        }

        if (query.author) {
            const author = await this.userRepository.findOne({
                username: query.author
            })

            queryBuilder.andWhere('articles.authorId = :id', { id: author.id })
        }

        if (query.tag) {
            queryBuilder.andWhere('articles.tagList LIKE :tag', {
                tag: `%${query.tag}%`
            })
        }

        if (query.favorited) {
            const author = await this.userRepository.findOne({ username: query.favorited }, { relations: ['favorites'] })

            const ids = author.favorites.map(article => article.id)

            if (ids.length > 0) {
                queryBuilder.andWhere('articles.id IN (:...ids)', { ids })
            } else queryBuilder.andWhere('1=0')
        }

        let favoritedIds: Array<number> = []

        if (currentUserId) {
            const currentUser = await this.userRepository.findOne(currentUserId, { relations: ['favorites'] })
            favoritedIds = currentUser.favorites.map(article => article.id)
        }

        const articles = await queryBuilder.getMany()
        const articleWithFavorites = articles.map(article => {
            const favorited = favoritedIds.includes(article.id)
            return { ...article, favorited }
        })


        return { articles: articleWithFavorites, articlesCount }
    }

    async getFeed(currentUserId: number, query: any): Promise<ArticlesResponseInterface> {
        const follows = await this.followRepository.find({
            followerId: currentUserId
        })

        if (follows.length === 0) {
            return { articles: [], articlesCount: 0 }
        }

        const followingIds: Array<number> = follows.map(follow => follow.followingId)

        const queryBuilder = getRepository(ArticleEntity).createQueryBuilder('articles')
          .leftJoinAndSelect('articles.author', 'author')
          .where('articles.authorId IN (:...ids)', { ids: followingIds })

        queryBuilder.orderBy('articles.createdAt', 'DESC')

        const articlesCount = await queryBuilder.getCount()

        if (query.limit) {
            queryBuilder.limit(query.limit)
        }

        if (query.offset) {
            queryBuilder.offset(query.offset)
        }

        const articles = await queryBuilder.getMany()

        return {articles, articlesCount}
    }

    async createArticle(currentUser: UserEntity, createArticleDto: CreateArticleDto): Promise<ArticleEntity> {
        const article = new ArticleEntity()
        Object.assign(article, createArticleDto)
        if (!article.tagList) {
            article.tagList = []
        }
        article.slug = ArticleService.generateSlug(article.title)
        article.author = currentUser
        return await this.articleRepository.save(article)
    }

    buildArticleResponse(article: ArticleEntity): ArticleResponseInterface {
        return { article }
    }

    async getArticleBySlug(slug: string): Promise<ArticleEntity> {
        return await this.articleRepository.findOne({ slug })
    }

    private static generateSlug(title: string): string {
        return slugify(title, {
            lower: true,
        }) + '-' + (Math.random() * Math.pow(36, 6) | 0).toString(36)
    }

    async deleteArticle(currentUserId: number, slug: string): Promise<DeleteResult> {
        const article = await this.getArticleBySlug(slug)

        if (!article) {
            throw new HttpException('Article does not exist', HttpStatus.NOT_FOUND)
        }

        if (article.author.id !== currentUserId) {
            throw new HttpException('You are not an author', HttpStatus.FORBIDDEN)
        }

        return await this.articleRepository.delete({ slug })
    }

    async updateArticle(slug: string, currentUserId: number, updateArticleDto: CreateArticleDto): Promise<ArticleEntity> {
        const article = await this.getArticleBySlug(slug)

        if (!article) {
            throw new HttpException('Article does not exist', HttpStatus.NOT_FOUND)
        }

        if (article.author.id !== currentUserId) {
            throw new HttpException('You are not an author', HttpStatus.FORBIDDEN)
        }

        article.slug = ArticleService.generateSlug(article.title)
        Object.assign(article, updateArticleDto)

        return await this.articleRepository.save(article)
    }

    async addArticleToFavorite(slug: string, currentUserId: number): Promise<ArticleEntity> {
        const article = await this.getArticleBySlug(slug)
        const user = await this.userRepository.findOne(currentUserId, {
            relations: ['favorites']
        })

        const isNotFavorited: boolean = user.favorites.findIndex(articleInFavorites => articleInFavorites.id === article.id) === -1

        if (isNotFavorited) {
            user.favorites.push(article)
            article.favoritesCount++
            await this.userRepository.save(user)
            await this.articleRepository.save(article)
        }

        return article
    }

    async removeArticleFromFavorite(slug: string, currentUserId: number): Promise<ArticleEntity> {
        const article = await this.getArticleBySlug(slug)
        const user = await this.userRepository.findOne(currentUserId, {
            relations: ['favorites']
        })

        const articleIdx: number = user.favorites.findIndex(articleInFavorites => articleInFavorites.id === article.id)

        if (articleIdx >= 0) {
            user.favorites = user.favorites.filter((_, index: number) => index !== articleIdx)
            article.favoritesCount--
            await this.userRepository.save(user)
            await this.articleRepository.save(article)
        }

        return article
    }
}
