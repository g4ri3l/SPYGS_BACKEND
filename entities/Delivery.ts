import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './User';
import { Order } from './Order';
import { DeliveryRating } from './DeliveryRating';

export type DeliveryStatus = 'Disponible' | 'En camino' | 'Ocupado' | 'Fuera de servicio';

@Entity('deliveries')
export class Delivery {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', unique: true })
  userId!: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ 
    type: 'varchar', 
    length: 50, 
    default: 'Disponible' 
  })
  status!: DeliveryStatus;

  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 8, 
    nullable: true 
  })
  currentLatitude!: number | null;

  @Column({ 
    type: 'decimal', 
    precision: 11, 
    scale: 8, 
    nullable: true 
  })
  currentLongitude!: number | null;

  @Column({ 
    type: 'decimal', 
    precision: 3, 
    scale: 2, 
    default: 0 
  })
  rating!: number;

  @Column({ type: 'int', default: 0 })
  totalDeliveries!: number;

  @Column({ type: 'int', default: 0 })
  activeOrders!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLocationUpdate!: Date | null;

  @OneToMany(() => Order, order => order.delivery)
  orders!: Order[];

  @OneToMany(() => DeliveryRating, rating => rating.delivery)
  ratings!: DeliveryRating[];
}

