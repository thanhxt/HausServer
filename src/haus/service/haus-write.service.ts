/**
 * Das Modul besteht aus der Klasse {@link HausWriteService} für die
 * Schreiboperationen im Anwendungskern.
 * @packageDocumentation
 */

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getLogger } from '../../logger/logger.js';
import { MailService } from '../../mail/mail.service.js';
import { Haus } from '../entity/haus.entity.js';
import {
    HausExistsException,
    VersionInvalidException,
    VersionOutdatedException,
} from './exceptions.js';
import { HausReadService } from './haus-read.service.js';
// import { HausReadService } from './haus-read.service';

/** Typdefinitionen zum Aktualisieren eines Hauses mit 'update'. */
export type UpdateParams = {
    /** ID des zu aktualisierenden Hauses, */
    readonly id: number | undefined;
    /** Haus-Objekt mit den aktualisierten Werten. */
    readonly haus: Haus;
    /** Versionsnummer für die aktulisierenden Werte. */
    readonly version: string;
};

/**
 * Die Klasse 'HausWriteService' implementiert den Anwendungskern für das
 * Schreiben von Häusern und greift mit _TypeORM_ auf die Datenbank zu.
 */
@Injectable()
export class HausWriteService {
    private static readonly VERSION_PATTERN = /^"\d{1,3}"/u;

    readonly #repo: Repository<Haus>;

    readonly #readService: HausReadService;

    readonly #mailService: MailService;

    readonly #logger = getLogger(HausWriteService.name);

    constructor(
        @InjectRepository(Haus) repo: Repository<Haus>,
        readService: HausReadService,
        mailService: MailService,
    ) {
        this.#repo = repo;
        this.#readService = readService;
        this.#mailService = mailService;
    }

    /**
     * Legt ein neues Haus an.
     * @param haus - Das Haus-Objekt mit den Daten des neuen Hauses.
     * @returns Die Id des neu angelegten Hauses.
     */
    async create(haus: Haus) {
        this.#logger.debug('create: haus=%o', haus);
        await this.#validateCreate(haus);

        const hausDB = await this.#repo.save(haus);
        this.#logger.debug('create: hausDB=%o', hausDB);

        await this.#sendmail(hausDB);

        return hausDB.id!;
    }

    async update({ id, haus, version }: UpdateParams): Promise<number> {
        this.#logger.debug(
            'update: id=%d, haus=%o, version=%s',
            id,
            haus,
            version,
        );
        if (id === undefined) {
            this.#logger.debug('update: Keine gueltige ID');
            throw new NotFoundException(`Es gibt kein Haus mit der ID ${id}.`);
        }

        const validateResult = await this.#validateUpdate(haus, id, version);
        this.#logger.debug('update: validateResult=%o', validateResult);
        if (!(validateResult instanceof Haus)) {
            return validateResult;
        }

        const hausNeu = validateResult;
        const merged = this.#repo.merge(hausNeu, haus);
        this.#logger.debug('update: merged=%o', merged);
        const updated = await this.#repo.save(merged); // implizite Transaktion
        this.#logger.debug('update: updated=%o', updated);

        return updated.version!;
    }

    async #validateCreate({ standort, art }: Haus) {
        this.#logger.debug(
            'validateCreate: standort=%o, art=%o',
            standort,
            art,
        );
        if (await this.#repo.existsBy({ standort, art })) {
            throw new HausExistsException({ standort, art } as Haus);
        }
    }

    async #sendmail(haus: Haus) {
        const subject = `Neues Haus angelegt ${haus.id}`;
        const { standort, art } = haus;
        const body = `Das Haus mit dem Standort ${standort} und der Art ${art} wurde angelegt.`;
        await this.#mailService.sendmail({ subject, body });
    }

    async #validateUpdate(
        haus: Haus,
        id: number,
        versionStr: string,
    ): Promise<Haus> {
        this.#logger.debug(
            '#validateUpdate: buch=%o, id=%s, versionStr=%s',
            haus,
            id,
            versionStr,
        );
        if (!HausWriteService.VERSION_PATTERN.test(versionStr)) {
            throw new VersionInvalidException(versionStr);
        }

        const version = Number.parseInt(versionStr.slice(1, -1), 10);
        this.#logger.debug(
            '#validateUpdate: haus=%o, version=%d',
            haus,
            version,
        );

        const hausDb = await this.#readService.findById({ id });

        // nullish coalescing
        const versionDb = hausDb.version!;
        if (version < versionDb) {
            this.#logger.debug('#validateUpdate: versionDb=%d', version);
            throw new VersionOutdatedException(version);
        }
        this.#logger.debug('#validateUpdate: hausDb=%o', hausDb);
        return hausDb;
    }
}
