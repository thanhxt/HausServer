/**
 * Das Modul besteht aus der Entity-Klasse
 * @packageDocumentation
 */

/* eslint-disable max-classes-per-file, @typescript-eslint/no-magic-numbers */

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    ArrayUnique,
    IsArray,
    IsNumber,
    IsOptional,
    IsPositive,
    IsString,
    MaxLength,
    ValidateNested,
} from 'class-validator';
import { AusstattungDTO } from './ausstattungDTO.entity.js';
import { BewohnerDTO } from './bewohnerDTO.entity.js';

/**
 * Entity-Klasse für das Haus ohne TypeORM und ohne Referenzen
 */
export class HausDtoOhneRef {
    @MaxLength(30)
    @ApiProperty({ example: 'Einfamilienhaus', type: String })
    readonly art!: string;

    @IsNumber()
    @IsPositive()
    @ApiProperty({ example: 1, type: Number })
    readonly stockwerk!: number;

    @IsNumber()
    @IsPositive()
    @ApiProperty({ example: 1, type: Number })
    readonly zimmer!: number;

    @IsNumber()
    @IsPositive()
    @ApiProperty({ example: 1, type: Number })
    readonly preis!: number;

    @IsNumber()
    @IsPositive()
    @ApiProperty({ example: 1, type: Number })
    readonly groesse!: number;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'Musterhaus', type: String })
    readonly standort!: string;

    @IsOptional()
    @ArrayUnique()
    @ApiProperty({ example: ['JAVASCRIPT', 'TYPESCRIPT', 'JAVA', 'PYTHON'] })
    readonly schlagwoerter: string[] | undefined;
}

export class HausDTO extends HausDtoOhneRef {
    @ValidateNested()
    @Type(() => AusstattungDTO)
    @ApiProperty({ type: AusstattungDTO })
    readonly ausstattung!: AusstattungDTO; // NOSONAR

    @IsOptional()
    @IsArray()
    @ValidateNested()
    @Type(() => BewohnerDTO)
    @ApiProperty({ type: [BewohnerDTO] })
    readonly bewohner: BewohnerDTO[] | undefined;
}

/* eslint-enable max-classes-per-file, @typescript-eslint/no-magic-numbers */
