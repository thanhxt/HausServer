import { UseFilters, UseInterceptors } from '@nestjs/common';
import { Args, Query, Resolver } from '@nestjs/graphql';
import { Public } from 'nest-keycloak-connect';
import { getLogger } from '../../logger/logger.js';
import { ResponseTimeInterceptor } from '../../logger/response-time.interceptor.js';
import { HausReadService } from '../service/haus-read.service.js';
import { type Suchkriterien } from '../service/suchkriterien.js';
import { HttpExceptionFilter } from './http-exception.filter.js';

export type IdInput = {
    readonly id: number;
};

export type SuchkriterienInput = {
    readonly suchkriterien: Suchkriterien;
};

@Resolver('Haus')
@UseFilters(HttpExceptionFilter)
@UseInterceptors(ResponseTimeInterceptor)
export class HausQueryResolver {
    readonly #service: HausReadService;

    readonly #logger = getLogger(HausQueryResolver.name);

    constructor(service: HausReadService) {
        this.#service = service;
    }

    // TODO: Ausstattung gibt nicht zurück
    @Query('haus')
    @Public()
    async findById(@Args() { id }: IdInput) {
        this.#logger.debug('findById: id=%d', id);

        const haus = await this.#service.findById({ id });

        if (this.#logger.isLevelEnabled('debug')) {
            this.#logger.debug(
                'findById: haus=%s, ausstattung=%o',
                haus.toString(),
                haus.ausstattung,
            );
        }
        return haus;
    }

    @Query('haeuser')
    @Public()
    async find(@Args() input: SuchkriterienInput | undefined) {
        this.#logger.debug('find: input=%o', input);
        const haeuser = await this.#service.find(input?.suchkriterien);
        this.#logger.debug('find: haeuser=%o', haeuser);
        return haeuser;
    }
}
