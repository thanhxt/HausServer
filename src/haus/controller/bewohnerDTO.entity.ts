/* eslint-disable @typescript-eslint/no-magic-numbers */
/**
 * Das Modul besteht aus der Entity-Klasse
 * @packageDocumentation
 */

import { ApiProperty } from '@nestjs/swagger';
import { Max, MaxLength, Min } from 'class-validator';

/**
 * Entity-Klasse für die Bewohner ohne TypeORM
 */
export class BewohnerDTO {
    @MaxLength(30)
    @ApiProperty({ example: 'Max', type: String })
    readonly vorname!: string;

    @MaxLength(30)
    @ApiProperty({ example: 'Mustermann', type: String })
    readonly nachname!: string;

    @Min(18)
    @Max(100)
    @ApiProperty({ example: 42, type: Number })
    readonly alter!: number;

    @MaxLength(30)
    @ApiProperty({ example: 'Programmierer', type: String })
    readonly beruf!: string;
}
/* eslint-enable @typescript-eslint/no-magic-numbers */
