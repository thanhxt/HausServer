// Copyright (C) 2016 - present Juergen Zimmermann, Hochschule Karlsruhe
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.

/**
 * Das Modul besteht aus der Klasse {@linkcode QueryBuilder}.
 * @packageDocumentation
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { typeOrmModuleOptions } from '../../config/typeormOptions.js';
import { getLogger } from '../../logger/logger.js';
import { Ausstattung } from '../entity/ausstattung.entity.js';
import { Bewohner } from '../entity/bewohner.entity.js';
import { Haus } from '../entity/haus.entity.js';
import { type Suchkriterien } from './suchkriterien.js';

/** Typdefinitionen für die Suche mit der Buch-ID. */
export type BuildIdParams = {
    /** ID des gesuchten Buchs. */
    readonly id: number;
    /** Sollen die Abbildungen mitgeladen werden? */
    readonly withBewohner?: boolean;
};
/**
 * Die Klasse `QueryBuilder` implementiert das Lesen für Bücher und greift
 * mit _TypeORM_ auf eine relationale DB zu.
 */
@Injectable()
export class QueryBuilder {
    readonly #hausAlias = `${Haus.name
        .charAt(0)
        .toLowerCase()}${Haus.name.slice(1)}`;

    readonly #ausstattungAlias = `${Ausstattung.name
        .charAt(0)
        .toLowerCase()}${Ausstattung.name.slice(1)}`;

    readonly #bewohnerAlias = `${Bewohner.name
        .charAt(0)
        .toLowerCase()}${Bewohner.name.slice(1)}`;

    readonly #repo: Repository<Haus>;

    readonly #logger = getLogger(QueryBuilder.name);

    constructor(@InjectRepository(Haus) repo: Repository<Haus>) {
        this.#repo = repo;
    }

    /**
     * Ein Buch mit der ID suchen.
     * @param id ID des gesuchten Buches
     * @returns QueryBuilder
     */
    buildId({ id, withBewohner: withAusstattung = false }: BuildIdParams) {
        // QueryBuilder "haus" fuer Repository<Haus>
        const queryBuilder = this.#repo.createQueryBuilder(this.#hausAlias);

        // Fetch-Join: aus QueryBuilder "haus" die Property "ausstattung" -> Tabelle "ausstattung"
        if (withAusstattung) {
            // Fetch-Join: aus QueryBuilder "haus" die Property "bewohner" -> Tabelle "bewohner"
            queryBuilder.leftJoinAndSelect(
                `${this.#hausAlias}.bewohner`,
                this.#bewohnerAlias,
            );
        }
        queryBuilder.where(`${this.#hausAlias}.id = :id`, { id: id }); // eslint-disable-line object-shorthand
        return queryBuilder;
    }

    /**
     * Bücher asynchron suchen.
     * @param suchkriterien JSON-Objekt mit Suchkriterien
     * @returns QueryBuilder
     */
    // z.B. { titel: 'a', rating: 5, javascript: true }
    // "rest properties" fuer anfaengliche WHERE-Klausel: ab ES 2018 https://github.com/tc39/proposal-object-rest-spread
    // eslint-disable-next-line max-lines-per-function, sonarjs/cognitive-complexity
    build({
        ausstattung,
        sternenhimmel,
        wasserfall,
        traumgarten,
        himmelsleiter,
        ...props
    }: Suchkriterien) {
        this.#logger.debug(
            'build: ausstattung=%s, sternenhimmel=%s, wasserfall=%s, traumgarten=%s, himmelsleiter=%s, props=%o',
            ausstattung,
            sternenhimmel,
            wasserfall,
            traumgarten,
            himmelsleiter,
            props,
        );

        let queryBuilder = this.#repo.createQueryBuilder(this.#hausAlias);
        // queryBuilder.innerJoinAndSelect(
        //     `${this.#hausAlias}.ausstattung`,
        //     'ausstattung',
        // );

        // z.B. { titel: 'a', rating: 5, javascript: true }
        // "rest properties" fuer anfaengliche WHERE-Klausel: ab ES 2018 https://github.com/tc39/proposal-object-rest-spread
        // type-coverage:ignore-next-line
        // const { titel, javascript, typescript, ...props } = suchkriterien;

        let useWhere = true;

        // Titel in der Query: Teilstring des Titels und "case insensitive"
        // CAVEAT: MySQL hat keinen Vergleich mit "case insensitive"
        // type-coverage:ignore-next-line
        if (ausstattung !== undefined && typeof ausstattung === 'string') {
            const ilike =
                typeOrmModuleOptions.type === 'postgres' ? 'ilike' : 'like';
            queryBuilder = queryBuilder.where(
                `${this.#ausstattungAlias}.ausstattung ${ilike} :ausstattung`,
                { ausstattung: `%${ausstattung}%` },
            );
            useWhere = false;
        }

        if (sternenhimmel === 'true') {
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#hausAlias}.schlagwoerter like '%Sternenhimmel%'`,
                  )
                : queryBuilder.andWhere(
                      `${this.#hausAlias}.schlagwoerter like '%Sternenhimmel%'`,
                  );
            useWhere = false;
        }

        if (wasserfall === 'true') {
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#hausAlias}.schlagwoerter like '%Wasserfall%'`,
                  )
                : queryBuilder.andWhere(
                      `${this.#hausAlias}.schlagwoerter like '%Wasserfall%'`,
                  );
            useWhere = false;
        }

        if (traumgarten === 'true') {
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#hausAlias}.schlagwoerter like '%Traumgarten%'`,
                  )
                : queryBuilder.andWhere(
                      `${this.#hausAlias}.schlagwoerter like '%Traumgarten%'`,
                  );
            useWhere = false;
        }

        if (himmelsleiter === 'true') {
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#hausAlias}.schlagwoerter like '%Himmelsleiter%'`,
                  )
                : queryBuilder.andWhere(
                      `${this.#hausAlias}.schlagwoerter like '%Himmelsleiter%'`,
                  );
            useWhere = false;
        }

        // Restliche Properties als Key-Value-Paare: Vergleiche auf Gleichheit
        Object.keys(props).forEach((key) => {
            const param: Record<string, any> = {};
            param[key] = (props as Record<string, any>)[key]; // eslint-disable-line @typescript-eslint/no-unsafe-assignment, security/detect-object-injection
            queryBuilder = useWhere
                ? queryBuilder.where(
                      `${this.#hausAlias}.${key} = :${key}`,
                      param,
                  )
                : queryBuilder.andWhere(
                      `${this.#hausAlias}.${key} = :${key}`,
                      param,
                  );
            useWhere = false;
            this.#logger.debug('build: param=%o', param);
        });

        this.#logger.debug('build: sql=%s', queryBuilder.getSql());
        return queryBuilder;
    }
}
