/**
 * Das Modul besteht aus der Controller-Klasse für SChreiben an der REST-Schnittstelle
 * @packageDocumentation
 */

import {
    Body,
    Controller,
    Headers,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Put,
    Req,
    Res,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import {
    ApiBadRequestResponse,
    ApiBearerAuth,
    ApiCreatedResponse,
    ApiForbiddenResponse,
    ApiHeader,
    ApiNoContentResponse,
    ApiOperation,
    ApiPreconditionFailedResponse,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthGuard, Roles } from 'nest-keycloak-connect';
import { paths } from '../../config/paths.js';
import { getLogger } from '../../logger/logger.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { type Haus } from '../entity/haus.entity.js';
import { HausWriteService } from '../service/haus-write.service.js';
import { getBaseUri } from './getBaseUri.js';
import { HausDTO, HausDtoOhneRef } from './hausDTO.entity.js';

const MSG_FORBIDDEN = 'Kein Token mit ausreuchender Berechtigung vorhanden.';

/**
 * Die Controller-Klasse für die Verwaltung von Häusern.
 */
@Controller(paths.rest)
@UseGuards(AuthGuard)
@UseInterceptors(ResponseTimeInterceptor)
@ApiTags('Haus REST-API')
@ApiBearerAuth()
export class HausWriteController {
    readonly #service: HausWriteService;

    readonly #logger = getLogger(HausWriteController.name);

    constructor(service: HausWriteService) {
        this.#service = service;
    }

    /**
     * Ein neues Haus wird asynchron angelegt. Das neu anzulegende Haus ist als
     * JSON-Datensatz im Request-Objekt enthalten. Wenn es keine
     * Verletzungen von Constraints gibt, wird der Statuscode `201` (`Created`)
     * gesetzt und im Response-Header wird `Location` auf die URI so gesetzt,
     * dass damit das neu angelegte Haus abgerufen werden kann.
     *
     * Falls Constraints verletzt sind, wird der Statuscode `400` (`Bad Request`)
     * gesetzt und genauso auch wenn der Titel oder die ISBN-Nummer bereits
     * existieren.
     *
     * @param hausDTO JSON-Daten für ein Haus im Request-Body.
     * @param res Leeres Response-Objekt von Express.
     * @returns Leeres Promise-Objekt.
     */
    @Post()
    @Roles({ roles: ['admin', 'user'] })
    @ApiCreatedResponse({ description: 'Ein neues Haus anlegen' })
    @ApiOperation({ summary: 'ein neues Haus anlegen' })
    @ApiBadRequestResponse({ description: 'Fehlerhafte Haus-Daten' })
    @ApiForbiddenResponse({ description: MSG_FORBIDDEN })
    async post(
        @Body() hausDTO: HausDTO,
        @Req() req: Request,
        @Res() res: Response,
    ): Promise<Response> {
        this.#logger.debug('post: hausDTO: %s', hausDTO);

        const haus = this.#hausDtoToHaus(hausDTO);
        const id = await this.#service.create(haus);

        const location = `${getBaseUri(req)}/${String(id)}`;
        this.#logger.debug('post: location: %s', location);
        return res.location(location).send();
    }

    // eslint-disable-next-line max-params
    @Put(':id')
    @Roles({ roles: ['admin', 'user'] })
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'ein Haus aktualisieren',
        tags: ['Aktualisieren'],
    })
    @ApiHeader({
        name: 'If-Match',
        description: 'Versionsnummer des zu aktualisierenden Objekts',
        required: false,
    })
    @ApiNoContentResponse({ description: 'Erfolgreich aktualisiert' })
    @ApiBadRequestResponse({ description: 'Fehlerhafte Haus-Daten' })
    @ApiPreconditionFailedResponse({
        description: 'Versionsnummer stimmt nicht überein',
    })
    @ApiResponse({
        status: HttpStatus.PRECONDITION_REQUIRED,
        description: 'Header "If-Match" fehlt',
    })
    @ApiForbiddenResponse({ description: MSG_FORBIDDEN })
    async put(
        @Body() hausDTO: HausDtoOhneRef,
        @Param('id') id: number,
        @Headers('If-Match') version: string | undefined,
        @Res() res: Response,
    ): Promise<Response> {
        this.#logger.debug(
            'put: id=%s, hausDTO=%s, version=%s',
            id,
            hausDTO,
            version,
        );

        if (version === undefined) {
            const msg = 'Header "If-Match" fehlt';
            this.#logger.debug('put: %s', msg);
            return res
                .status(HttpStatus.PRECONDITION_REQUIRED)
                .set('Content-Type', 'application/json')
                .send(msg);
        }
        const haus = this.#hausDtoOhneRefToHaus(hausDTO);
        const neueVersion = await this.#service.update({ id, haus, version });
        return res.header('ETag', `"${neueVersion}"`).send();
    }

    #hausDtoOhneRefToHaus(hausDTO: HausDtoOhneRef): Haus {
        return {
            id: undefined,
            version: undefined,
            art: hausDTO.art,
            stockwerk: hausDTO.stockwerk,
            zimmer: hausDTO.zimmer,
            preis: hausDTO.preis,
            groesse: hausDTO.groesse,
            standort: hausDTO.standort,
            schlagwoerter: hausDTO.schlagwoerter,
            ausstattung: undefined,
            bewohner: undefined,
        };
    }

    #hausDtoToHaus(hausDTO: HausDTO): Haus {
        return {
            id: undefined,
            version: undefined,
            standort: hausDTO.standort,
            stockwerk: hausDTO.stockwerk,
            zimmer: hausDTO.zimmer,
            preis: hausDTO.preis,
            groesse: hausDTO.groesse,
            schlagwoerter: hausDTO.schlagwoerter,
            art: hausDTO.art,
            ausstattung: undefined,
            bewohner: undefined,
        };
    }
}
