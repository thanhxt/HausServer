import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Haus } from './haus.entity';

@Entity()
export class Ausstattung {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('boolean')
    keller!: boolean;

    @Column('boolean')
    garten!: boolean;

    @Column('boolean')
    garage!: boolean;

    @OneToOne(() => Haus, (haus) => haus.ausstattung)
    @JoinColumn({ name: 'haus_id' })
    haus: Haus | undefined;

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            keller: this.keller,
            garten: this.garten,
            garage: this.garage,
        });
}
