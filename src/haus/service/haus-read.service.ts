/**
 * Das Modul besteht aus der Klasse {@linkcode, hausReadService}
 * @packageDocumentation
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { getLogger } from '../../logger/logger.js';
import { Haus } from '../entity/haus.entity.js';
import { QueryBuilder } from './query-builder.js';
import { Suchkriterien } from './suchkriterien.js';

export type FindByIdParams = {
    //* * ID des gesuchten Hauses */
    readonly id: number;
    /** Sollen die Bewohner des Hauses mitgeliefert werden? */
    readonly withBewohner?: boolean;
};

@Injectable()
export class HausReadService {
    static readonly ID_PATTERN = /^[1-9]\d{0,10}$/u;

    readonly #hausProps: string[];

    readonly #queryBuilder: QueryBuilder;

    readonly #logger = getLogger(HausReadService.name);

    constructor(queryBuilder: QueryBuilder) {
        const hausDummy = new Haus();
        this.#hausProps = Object.getOwnPropertyNames(hausDummy);
        this.#queryBuilder = queryBuilder;
    }

    /**
     * Ein Haus mit der ID suchen.
     * @param params - Die Parameter
     * @returns Ein Haus-Modell oder undefined
     */
    async findById({ id, withBewohner = false }: FindByIdParams) {
        // Log the ID being searched for
        this.#logger.debug('findById: id=%d', id);
        // Attempt to find the house by ID
        const haus = await this.#queryBuilder
            .buildId({ id, withBewohner })
            .getOne();
        this.#logger.debug('findById: haus=%o', haus);
        // If no house is found, throw a NotFoundException
        if (haus === null) {
            throw new NotFoundException(
                `Das Haus mit der ID ${id} wurde nicht gefunden`,
            );
        }

        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug(
                'findById: haus=%s, ausstattung=%o',
                haus.toString(),
                haus.ausstattung,
            );
            if (withBewohner) {
                this.#logger.debug(
                    'findById: haus.bewohner=%o',
                    haus.ausstattung,
                );
            }
        }
        return haus;
    }

    async find(suchkriterien?: Suchkriterien) {
        this.#logger.debug('find: suchkriterien=%o', suchkriterien);

        // Keine suchkriterien?
        if (suchkriterien === undefined) {
            return this.#queryBuilder.build({}).getMany();
        }
        const keys = Object.keys(suchkriterien);
        if (keys.length === 0) {
            return this.#queryBuilder.build(suchkriterien).getMany();
        }

        // Falsche Namen fuer Suchkriterien
        if (!this.#checkKeys(keys)) {
            throw new NotFoundException('Ungueltige Suchkriterien');
        }

        // QueryBuilder
        // Das Resultat ist eine leere Liste, falls nichts gefunden
        // Lesen: keine Transaktion erforderlich
        const hauser = await this.#queryBuilder.build(suchkriterien).getMany();
        if (hauser.length === 0) {
            this.#logger.debug('find: Keine Hauser gefunden');
            throw new NotFoundException(
                `Keine Hauser gefunden: ${JSON.stringify(suchkriterien)}`,
            );
        }
        hauser.forEach((haus) => {
            if (haus.schlagwoerter === null) {
                haus.schlagwoerter = [];
            }
        });
        this.#logger.debug('find: hauser=%o', hauser);
        return hauser;
    }

    #checkKeys(keys: string[]) {
        // Ist jedes Suchkriterium auch eine Property von Haus oder "schlagwoerter"?
        let validKeys = true;
        keys.forEach((key) => {
            if (
                !this.#hausProps.includes(key) &&
                key !== 'sternenhimmel' &&
                key !== 'wasserfall' &&
                key !== 'traumgarten' &&
                key !== 'himmelsleiter'
            ) {
                this.#logger.debug(
                    '#checkKeys: ungueltiges Suchkriterium "%s"',
                    key,
                );
                validKeys = false;
            }
        });

        return validKeys;
    }
}
