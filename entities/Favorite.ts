import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from './User';
import { Product } from './Product';

@Entity('favorites')
@Unique(['userId', 'productId'])
export class Favorite {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, user => user.favorites)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 50 })
  productId!: string;

  @ManyToOne(() => Product, product => product.favorites)
  @JoinColumn({ name: 'productId' })
  product!: Product;
}



