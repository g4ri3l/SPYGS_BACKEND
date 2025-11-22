import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { CartItem } from './CartItem';
import { OrderItem } from './OrderItem';
import { Favorite } from './Favorite';

@Entity('products')
export class Product {
  @PrimaryColumn({ type: 'varchar', length: 50 })
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', length: 100 })
  category!: string;

  @Column({ type: 'varchar', length: 255 })
  provider!: string;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating!: number;

  @Column({ type: 'varchar', length: 50 })
  deliveryTime!: string;

  @Column({ type: 'varchar', length: 50 })
  distance!: string;

  @Column({ type: 'text' })
  image!: string;

  @OneToMany(() => CartItem, cartItem => cartItem.product)
  cartItems!: CartItem[];

  @OneToMany(() => OrderItem, orderItem => orderItem.product)
  orderItems!: OrderItem[];

  @OneToMany(() => Favorite, favorite => favorite.product)
  favorites!: Favorite[];
}



