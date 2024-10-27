import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Haus {
    @PrimaryGeneratedColumn()
    id: number | undefined;
}
