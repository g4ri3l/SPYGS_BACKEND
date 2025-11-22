import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Order } from './Order';
import { Product } from './Product';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => Order, order => order.items)
  @JoinColumn({ name: 'orderId' })
  order!: Order;

  @Column({ type: 'varchar', length: 50, nullable: true })
  productId!: string | null;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'productId' })
  product!: Product | null;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;
}



