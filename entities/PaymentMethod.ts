import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('payment_methods')
export class PaymentMethod {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, user => user.paymentMethods)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 50 })
  type!: string; // 'credit', 'debit', 'paypal', etc.

  @Column({ type: 'varchar', length: 50, nullable: true })
  cardNumber!: string | null; // Enmascarado (null para efectivo)

  @Column({ type: 'varchar', length: 255, nullable: true })
  cardHolder!: string | null; // null para efectivo

  @Column({ type: 'varchar', length: 10, nullable: true })
  expiryDate!: string | null; // null para efectivo

  @Column({ type: 'boolean', default: false })
  isDefault!: boolean;
}



