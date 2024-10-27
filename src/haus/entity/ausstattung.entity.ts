import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
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
    kueche!: boolean;

    @Column('boolean')
    garten!: boolean;

    @Column('boolean')
    garage!: boolean;

    @ManyToOne(() => Haus, (haus) => haus.ausstattungen)
    @JoinColumn({ name: 'haus_id' })
    haus: Haus | undefined;

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            keller: this.keller,
            kueche: this.kueche,
            garten: this.garten,
            garage: this.garage,
        });
}
