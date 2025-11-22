import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from './User';
import { OrderItem } from './OrderItem';
import { Address } from './Address';
import { PaymentMethod } from './PaymentMethod';

export type OrderStatus = 'Pendiente' | 'En preparación' | 'En camino' | 'Entregado' | 'Cancelado';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, user => user.orders)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @CreateDateColumn()
  date!: Date;

  @Column({ 
    type: 'varchar', 
    length: 50,
    default: 'Pendiente'
  })
  status!: OrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total!: number;

  @Column({ type: 'varchar', length: 255 })
  restaurant!: string;

  @Column({ type: 'uuid' })
  addressId!: string;

  @ManyToOne(() => Address)
  @JoinColumn({ name: 'addressId' })
  address!: Address;

  @Column({ type: 'uuid' })
  paymentMethodId!: string;

  @ManyToOne(() => PaymentMethod)
  @JoinColumn({ name: 'paymentMethodId' })
  paymentMethod!: PaymentMethod;

  @OneToMany(() => OrderItem, orderItem => orderItem.order, { cascade: true })
  items!: OrderItem[];
}



