import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('addresses')
export class Address {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, user => user.addresses)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 100, nullable: true })
  name!: string | null; // Ej: "Casa", "Oficina"

  @Column({ type: 'varchar', length: 255 })
  street!: string;

  @Column({ type: 'varchar', length: 100 })
  city!: string;

  @Column({ type: 'varchar', length: 100 })
  state!: string;

  @Column({ type: 'varchar', length: 20 })
  zipCode!: string;

  @Column({ type: 'varchar', length: 100 })
  country!: string;

  @Column({ type: 'text', nullable: true })
  reference!: string | null; // Referencias adicionales

  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 8, 
    nullable: true 
  })
  latitude!: number | null; // Para cálculo de distancia

  @Column({ 
    type: 'decimal', 
    precision: 11, 
    scale: 8, 
    nullable: true 
  })
  longitude!: number | null; // Para cálculo de distancia

  @Column({ type: 'boolean', default: false })
  isDefault!: boolean;
}



