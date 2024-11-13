/**
 * Das Modul besteht aus der Controller-Klasse für Lesen an der Rest-Schnittstelle.
 * @packageDocumentation
 */

// eslint-disable-next-line max-classes-per-file
import {
    Controller,
    Get,
    Headers,
    HttpStatus,
    NotFoundException,
    Param,
    Query,
    Req,
    Res,
    UseInterceptors,
} from '@nestjs/common';
import { ApiProperty, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Public } from 'nest-keycloak-connect';
import { paths } from '../../config/paths.js';
import { getLogger } from '../../logger/logger.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { type Ausstattung } from '../entity/ausstattung.entity.js';
import { type Haus, type HausArt } from '../entity/haus.entity.js';
import { HausReadService } from '../service/haus-read.service.js';
import { type Suchkriterien } from '../service/suchkriterien.js';
import { getBaseUri } from './getBaseUri.js';

/** href-Link für HATEOAS */
export type Link = {
    readonly href: string;
};

export type Links = {
    readonly self: Link;
    readonly list?: Link;
    readonly add?: Link;
    readonly update?: Link;
    readonly remove?: Link;
};

/** Typedefinition für ein Ausstattung-Objekt ohne Rückwärtsverweis zum Haus */
export type AusstattungModel = Omit<Ausstattung, 'id' | 'haus'>;

export type HausModel = Omit<Haus, 'id' | 'version' | 'ausstattung'> & {
    ausstattung: AusstattungModel;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _links: Links;
};

export type HaeuserModel = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    _embedded: {
        haeuser: HausModel[];
    };
};

/**
 * Klasse für `HausGetController`, um Queries in _OpenAPI_ bzw. Swagger zu
 * formulieren. `HausController` hat dieselben Properties wie die Basisklasse
 * `Haus` - allerdings mit dem Unterschied, dass diese Properties beim Ableiten
 * so überschrieben sind, dass sie auch nicht gesetzt bzw. undefined sein
 * dürfen, damit die Queries flexibel formuliert werden können. Deshalb ist auch
 * immer der zusätzliche Typ undefined erforderlich.
 * Außerdem muss noch `string` statt `Date` verwendet werden, weil es in OpenAPI
 * den Typ Date nicht gibt.
 */
export class HausQuery implements Suchkriterien {
    @ApiProperty({ required: false })
    declare readonly art: HausArt;

    @ApiProperty({ required: false })
    declare readonly stockwerk: number;

    @ApiProperty({ required: false })
    declare readonly zimmer: number;

    @ApiProperty({ required: false })
    declare readonly preis: number;

    @ApiProperty({ required: false })
    declare readonly groesse: number;

    @ApiProperty({ required: false })
    declare readonly standort: string;

    @ApiProperty({ required: false })
    declare readonly sternenhimmel: string;

    @ApiProperty({ required: false })
    declare readonly wasserfall: string;

    @ApiProperty({ required: false })
    declare readonly traumgarten: string;

    @ApiProperty({ required: false })
    declare readonly himmelsleiter: string;

    @ApiProperty({ required: false })
    declare readonly ausstattung: string;
}

const APPLICATION_HAL_JSON = 'application/hal+json';

/**
 * Die Controller-Klasse für die Verwaltung von Hauesern
 */
@Controller(paths.rest)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Haus REST-API')
export class HausGetController {
    readonly #service: HausReadService;

    readonly #logger = getLogger(HausGetController.name);

    // Dependency Injection bzw Constructor Injection
    constructor(service: HausReadService) {
        this.#service = service;
    }

    /**
     * GET-Methode für eine Haus-Ressource.
     *
     * Falls es ein solches Haus gibt und 'if-None-Match' im Request-Header
     * auf die aktuelle Version des Hauses gesetztz war, wird der Statuscode
     * '304 Not Modified' zurückgegeben. Falls 'If-None-Match' nicht gesetzt ist
     * oder eine veraltete Version enthält, wird das gefundene Haus im Rumof des
     * Response als JSON-Datensatz mit Atom-Links für HATEOAS und dem Statuscode
     * 200 (OK) zurückgeliefert.
     *
     * @param idStr - Die Haus-ID als String
     * @param req - Die Request-Objekt
     * @param version - Die ETag-Version
     * @param res - Die Response-Objekt
     * @returns Ein Haus-Modell oder undefined
     */
    // eslint-disable-next-line max-params
    @Get(':id')
    @Public()
    async getById(
        @Param('id') idStr: string,
        @Req() req: Request,
        @Headers('If-None-Match') version: string | undefined,
        @Res() res: Response,
    ): Promise<Response<HausModel | undefined>> {
        this.#logger.debug('getById: idStr=%s, version=%s', idStr, version);
        const id = Number(idStr);

        if (!Number.isInteger(id)) {
            this.#logger.debug('getById: not isInteger()');
            throw new NotFoundException(`Die Haus-ID ${idStr} ist ungueltig`);
        }

        if (req.accepts([APPLICATION_HAL_JSON, 'json', 'html']) === false) {
            this.#logger.debug('getById: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        const haus = await this.#service.findById({ id });
        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug('getById: haus=%o', haus.toString());
            this.#logger.debug('getById: ausstattung=%o', haus.ausstattung);
        }

        // ETags
        const versionDb = haus.version;
        if (version === `"${versionDb}"`) {
            this.#logger.debug('getById: NOT MODIFIED');
            return res.sendStatus(HttpStatus.NOT_MODIFIED);
        }
        this.#logger.debug('getById: versionDb=%s', versionDb);
        res.header('ETag', `"${versionDb}"`);

        // HATEOAS mit Atom Links und HAL (= Hypertext Application Language)
        const hausModel = this.#toModel(haus, req);
        this.#logger.debug('getById: hausModel=%o', hausModel);
        return res.contentType(APPLICATION_HAL_JSON).json(hausModel);
    }

    /**
     * Bücher werden mit Query-Parametern asynchron gesucht. Falls es mindestens
     * ein solches Haus gibt, wird der Statuscode `200` (`OK`) gesetzt. Im Rumpf
     * des Response ist das JSON-Array mit den gefundenen Häusern, die jeweils
     * um Atom-Links für HATEOAS ergänzt sind.
     *
     * Falls es kein Haus zu den Suchkriterien gibt, wird der Statuscode `404`
     * (`Not Found`) gesetzt.
     *
     * Falls es keine Query-Parameter gibt, werden alle Häuser ermittelt.
     *
     * @param query Query-Parameter von Express.
     * @param req Request-Objekt von Express.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Get()
    @Public()
    async get(
        @Query() query: HausQuery,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<Response<HaeuserModel | undefined>> {
        this.#logger.debug('get: query=%o', query);

        if (req.accepts([APPLICATION_HAL_JSON, 'json', 'html']) === false) {
            this.#logger.debug('get: accepted=%o', req.accepted);
            return res.sendStatus(HttpStatus.NOT_ACCEPTABLE);
        }

        const haeuser = await this.#service.find(query);
        this.#logger.debug('get: haeuser=%o', haeuser);

        // HATEOAS: Atom Links je Haus
        const haeuserModel = haeuser.map((haus) =>
            this.#toModel(haus, req, false),
        );
        this.#logger.debug('get: haeuserModel=%o', haeuserModel);

        const result: HaeuserModel = { _embedded: { haeuser: haeuserModel } };
        return res.contentType(APPLICATION_HAL_JSON).json(result).send();
    }

    #toModel(haus: Haus, req: Request, all = true) {
        const baseUri = getBaseUri(req);
        this.#logger.debug('#toModel: baseUri=%s', baseUri);
        const { id } = haus;
        const links = all
            ? {
                  self: { href: `${baseUri}/${id}` },
                  list: { href: `${baseUri}` },
                  add: { href: `${baseUri}` },
                  update: { href: `${baseUri}/${id}` },
                  remove: { href: `${baseUri}/${id}` },
              }
            : { self: { href: `${baseUri}/${id}` } };

        this.#logger.debug('#toModel: haus=%o, links=%o', haus, links);
        const ausstattungModel: AusstattungModel = {
            // "Optional Chaining" und "Nullish Coalescing" ab ES2020
            keller: haus.ausstattung?.keller ?? false,
            garten: haus.ausstattung?.garten ?? false,
            garage: haus.ausstattung?.garage ?? false,
        };
        const hausModel: HausModel = {
            art: haus.art,
            stockwerk: haus.stockwerk,
            zimmer: haus.zimmer,
            preis: haus.preis,
            bewohner: haus.bewohner,
            groesse: haus.groesse,
            standort: haus.standort,
            schlagwoerter: haus.schlagwoerter,
            ausstattung: ausstattungModel,
            _links: links,
        };

        return hausModel;
    }
}
