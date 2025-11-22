import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Product } from './Product';

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, user => user.cartItems)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 50 })
  productId!: string;

  @ManyToOne(() => Product, product => product.cartItems)
  @JoinColumn({ name: 'productId' })
  product!: Product;

  @Column({ type: 'int', default: 1 })
  quantity!: number;
}



