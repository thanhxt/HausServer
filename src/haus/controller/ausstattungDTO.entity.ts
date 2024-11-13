/**
 * Das Modul besteht aus der Entity-Klasse
 * @packageDocumentation
 */

import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

/**
 * Entity-Klasse für die Ausstattung ohne TypeORM
 */
export class AusstattungDTO {
    @IsBoolean()
    @ApiProperty({ example: true, type: Boolean })
    readonly keller!: boolean;

    @IsBoolean()
    @ApiProperty({ example: true, type: Boolean })
    readonly garten!: boolean;

    @IsBoolean()
    @ApiProperty({ example: true, type: Boolean })
    readonly garage!: boolean;
}
