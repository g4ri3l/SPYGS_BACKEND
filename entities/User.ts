import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Order } from './Order';
import { CartItem } from './CartItem';
import { Address } from './Address';
import { PaymentMethod } from './PaymentMethod';
import { Favorite } from './Favorite';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  password!: string | null; // Null para usuarios de Google

  @CreateDateColumn()
  createdAt!: Date;

  @OneToMany(() => Order, order => order.user)
  orders!: Order[];

  @OneToMany(() => CartItem, cartItem => cartItem.user)
  cartItems!: CartItem[];

  @OneToMany(() => Address, address => address.user)
  addresses!: Address[];

  @OneToMany(() => PaymentMethod, paymentMethod => paymentMethod.user)
  paymentMethods!: PaymentMethod[];

  @OneToMany(() => Favorite, favorite => favorite.user)
  favorites!: Favorite[];
}



