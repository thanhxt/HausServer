import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Haus } from './haus.entity.js';

@Entity()
export class Ausstattung {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column('boolean')
    readonly keller!: boolean;

    @Column('boolean')
    readonly garten!: boolean;

    @Column('boolean')
    readonly garage!: boolean;

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
