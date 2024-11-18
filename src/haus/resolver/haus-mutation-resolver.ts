// eslint-disable-next-line max-classes-per-file
import { UseFilters, UseGuards, UseInterceptors } from '@nestjs/common';
import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { IsInt, IsNumberString, Min } from 'class-validator';
import { AuthGuard, Roles } from 'nest-keycloak-connect';
import { getLogger } from '../../logger/logger.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { HausDTO } from '../controller/hausDTO.entity.js';
import { Ausstattung } from '../entity/ausstattung.entity.js';
import { Bewohner } from '../entity/bewohner.entity.js';
import { Haus } from '../entity/haus.entity.js';
import { HausWriteService } from '../service/haus-write.service.js';
import { HttpExceptionFilter } from './http-exception.filter.js';

// Authentifizierung und Autorisierung durch
//  GraphQL Shield
//      https://www.graphql-shield.com
//      https://github.com/maticzav/graphql-shield
//      https://github.com/nestjs/graphql/issues/92
//      https://github.com/maticzav/graphql-shield/issues/213
//  GraphQL AuthZ
//      https://github.com/AstrumU/graphql-authz
//      https://www.the-guild.dev/blog/graphql-authz

export type CreatePayload = {
    readonly id: number;
};

export type UpdatePayload = {
    readonly version: number;
};

export class HausUpdateDTO extends HausDTO {
    @IsNumberString()
    readonly id!: string;

    @IsInt()
    @Min(0)
    readonly version!: number;
}

@Resolver('Haus')
@UseGuards(AuthGuard)
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ResponseTimeInterceptor)
export class HausMutationResolver {
    readonly #service: HausWriteService;

    readonly #logger = getLogger(HausMutationResolver.name);

    constructor(service: HausWriteService) {
        this.#service = service;
    }

    @Mutation()
    @Roles({ roles: ['admin', 'user'] })
    async create(@Args('input') hausDTO: HausDTO) {
        this.#logger.debug('create: hausDTO=%o', hausDTO);

        const haus = this.#hausDtoToHaus(hausDTO);
        const id = await this.#service.create(haus);
        this.#logger.debug('createHaus: id=%d', id);
        const payload: CreatePayload = { id };
        return payload;
    }

    #hausDtoToHaus(hausDTO: HausDTO): Haus {
        const ausstattungDTO = hausDTO.ausstattung;
        const ausstattung: Ausstattung = {
            id: undefined,
            keller: ausstattungDTO.keller,
            garten: ausstattungDTO.garten,
            garage: ausstattungDTO.garage,
            haus: undefined,
        };
        const bewohner = hausDTO.bewohner?.map((bewohnerDTO) => {
            const bewohnerR: Bewohner = {
                id: undefined,
                vorname: bewohnerDTO.vorname,
                nachname: bewohnerDTO.nachname,
                haus: undefined,
                alter: bewohnerDTO.alter,
                beruf: bewohnerDTO.beruf,
            };
            return bewohnerR;
        });
        const haus: Haus = {
            id: undefined,
            version: undefined,
            standort: hausDTO.standort,
            stockwerk: hausDTO.stockwerk,
            zimmer: hausDTO.zimmer,
            preis: hausDTO.preis,
            groesse: hausDTO.groesse,
            schlagwoerter: hausDTO.schlagwoerter,
            art: hausDTO.art,
            ausstattung,
            bewohner,
        };

        // Rückwärtsverweis
        haus.ausstattung!.haus = haus;
        return haus;
    }
}
