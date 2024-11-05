import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Haus } from './haus.entity';

@Entity()
export class Bewohner {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column('varchar')
    vorname: string | undefined;

    @Column('varchar')
    nachname: string | undefined;

    @Column('int')
    alter: number | undefined;

    @Column('varchar')
    beruf: string | undefined;

    @ManyToOne(() => Haus, (haus) => haus.bewohner)
    @JoinColumn({ name: 'haus_id' })
    haus: Haus | undefined;

    public toString = (): string =>
        JSON.stringify({
            id: this.id,
            vorname: this.vorname,
            nachname: this.nachname,
            alter: this.alter,
            beruf: this.beruf,
            haus: this.haus,
        });
}
