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
import { entities } from './entity/entities.js';
import { HausReadService } from './service/haus-read.service.js';
import { QueryBuilder } from './service/query-builder.js';

/**
 * Die dekorierte Modul-Klasse mit Controller- und Service-Klassen sowie der
 * Funktionalität für TypeORM.
 */
@Module({
    imports: [KeycloakModule, MailModule, TypeOrmModule.forFeature(entities)],
    controllers: [HausGetController],
    providers: [HausReadService, QueryBuilder],
    exports: [HausReadService],
})
export class HausModule {}
