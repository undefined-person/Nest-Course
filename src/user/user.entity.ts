import {
  BeforeInsert,
  Column,
  Entity, JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { hash } from "bcrypt";
import {ArticleEntity} from "@app/article/article.entity";

@Entity('users')
export class UserEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  email: string;

  @Column({ default: '' })
  bio: string;

  @Column({ default: '' })
  image: string;

  @Column({ select: false })
  password: string;

  @OneToMany(() => ArticleEntity, article => article.author)
  articles: Array<ArticleEntity>

  @ManyToMany( () => ArticleEntity)
  @JoinTable()
  favorites: Array<ArticleEntity>

  @BeforeInsert()
  async hashPassword() {
    this.password = await hash(this.password, 10);
  }
}
