import {
    Column,
    Entity,
    OneToMany,
    OneToOne,
    PrimaryGeneratedColumn,
    VersionColumn,
} from 'typeorm';
import { Ausstattung } from './ausstattung.entity.js';
import { Bewohner } from './bewohner.entity.js';

/**
 * Alias-Typ für gültige Strings bei der Art eines Hauses
 */
export type HausArt = 'Einfamilienhaus' | 'Mehrfamilienhaus' | 'Wohnung';

@Entity()
export class Haus {
    @PrimaryGeneratedColumn()
    readonly id: number | undefined;

    @VersionColumn()
    readonly version: number | undefined;

    @Column('varchar')
    readonly art: string | undefined;

    @Column('int')
    readonly stockwerk: number | undefined;

    @Column('int')
    readonly zimmer: number | undefined;

    @Column('decimal', { precision: 10, scale: 2 })
    readonly preis: number | undefined;

    @Column('decimal', { precision: 10, scale: 2 })
    readonly groesse: number | undefined;

    @Column('varchar')
    readonly standort: string | undefined;

    // nicht "readonly": null ersetzen durch []
    @Column('simple-array')
    schlagwoerter: string[] | null | undefined;

    @OneToOne(() => Ausstattung, (ausstattung) => ausstattung.haus, {
        cascade: ['insert', 'remove'],
    })
    readonly ausstattung: Ausstattung | undefined;

    @OneToMany(() => Bewohner, (bewohner) => bewohner.haus, {
        cascade: ['insert', 'remove'],
    })
    readonly bewohner: Bewohner[] | undefined;

    public toString(): string {
        return JSON.stringify({
            id: this.id,
            version: this.version,
            art: this.art,
            stockwerk: this.stockwerk,
            zimmer: this.zimmer,
            preis: this.preis,
            groesse: this.groesse,
            standort: this.standort,
            ausstattung: this.ausstattung,
            bewohner: this.bewohner,
        });
    }
}
