/**
 * Das Modul besteht aus Controller- und Service-Klassen für die Verwaltung
 * von Häusern.
 * @packageDocumentation
 */

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailModule } from '../mail/mail.module.js';
import { KeycloakModule } from '../security/keycloak/keycloak.module.js';
import { HausGetController } from './controller/haus-get.controller.js';
import { HausWriteController } from './controller/haus-write.controller.js';
import { entities } from './entity/entities.js';
import { HausMutationResolver } from './resolver/haus-mutation-resolver.js';
import { HausQueryResolver } from './resolver/haus-query.resolver.js';
import { HausReadService } from './service/haus-read.service.js';
import { HausWriteService } from './service/haus-write.service.js';
import { QueryBuilder } from './service/query-builder.js';

/**
 * Die dekorierte Modul-Klasse mit Controller- und Service-Klassen sowie der
 * Funktionalität für TypeORM.
 */
@Module({
    imports: [KeycloakModule, MailModule, TypeOrmModule.forFeature(entities)],
    controllers: [HausGetController, HausWriteController],
    providers: [
        HausReadService,
        HausWriteService,
        QueryBuilder,
        HausMutationResolver,
        HausQueryResolver,
    ],
    exports: [HausReadService, HausWriteService],
})
export class HausModule {}
