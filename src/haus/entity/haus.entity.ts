import {
    Column,
    Entity,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Ausstattung } from './ausstattung.entity';
import { Bewohner } from './bewohner.entity';
@Entity()
export class Haus {
    @PrimaryGeneratedColumn()
    id: number | undefined;

    @Column('varchar')
    art: string | undefined;

    @Column('int')
    stockwerk: number | undefined;

    @Column('int')
    zimmer: number | undefined;

    @Column('decimal', { precision: 10, scale: 2 })
    preis: number | undefined;

    @Column('decimal', { precision: 10, scale: 2 })
    groesse: number | undefined;

    @Column('varchar')
    standort: string | undefined;

    @OneToOne(() => Ausstattung, (ausstattung) => ausstattung.haus, {
        cascade: ['insert', 'remove'],
    })
    readonly ausstattung: Ausstattung | undefined;

    @OneToMany(() => Bewohner, (bewohner) => bewohner.haus, {
        cascade: ['insert', 'remove'],
    })
    readonly bewohner: Bewohner[] | undefined;
}
