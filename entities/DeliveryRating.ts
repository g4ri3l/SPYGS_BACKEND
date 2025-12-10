import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Order } from './Order';
import { Delivery } from './Delivery';
import { User } from './User';

@Entity('delivery_ratings')
export class DeliveryRating {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'orderId' })
  order!: Order;

  @Column({ type: 'uuid' })
  deliveryId!: string;

  @ManyToOne(() => Delivery, delivery => delivery.ratings)
  @JoinColumn({ name: 'deliveryId' })
  delivery!: Delivery;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'int' })
  rating!: number; // 1-5

  @Column({ type: 'text', nullable: true })
  comment!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}

