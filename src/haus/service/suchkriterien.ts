/**
 * Das Modul besteht aus der Klasse {@linkcode Suchkriterien}
 * @packageDocumentation
 */

import { type HausArt } from '../entity/haus.entity';

export type Suchkriterien = {
    readonly art?: HausArt;
    readonly stockwerk?: number;
    readonly zimmer?: number;
    readonly preis?: number;
    readonly groesse?: number;
    readonly standort?: string;
    readonly sternenhimmel?: string;
    readonly wasserfall?: string;
    readonly traumgarten?: string;
    readonly himmelsleiter?: string;
    readonly ausstattung?: string;
};
