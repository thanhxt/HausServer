/* eslint-disable @eslint-community/eslint-comments/disable-enable-pair */
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { type HaeuserModel } from '../../src/haus/controller/haus-get.controller.js';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';
import { type ErrorResponse } from './error-response.js';
/* eslint-disable no-underscore-dangle */

// -----------------------------------------------------------------------------
// T e s t d a t e n
// -----------------------------------------------------------------------------
const schlagwortVorhanden1 = 'traumgarten';
const schlagwortVorhanden2 = 'wasserfall';
const schlagwortNichtVorhanden = 'csharp';

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('GET /rest', () => {
    let baseURL: string;
    let client: AxiosInstance;

    beforeAll(async () => {
        await startServer();
        baseURL = `https://${host}:${port}/rest`;
        client = axios.create({
            baseURL,
            httpsAgent,
            validateStatus: () => true,
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    test('Alle Haeuser', async () => {
        // given

        // when
        const { status, headers, data }: AxiosResponse<HaeuserModel> =
            await client.get('/');

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu); // eslint-disable-line sonarjs/no-duplicate-string
        expect(data).toBeDefined();

        const { haeuser } = data._embedded;

        haeuser
            .map((haus) => haus._links.self.href)
            .forEach((selfLink) => {
                // eslint-disable-next-line security/detect-non-literal-regexp, security-node/non-literal-reg-expr
                expect(selfLink).toMatch(new RegExp(`^${baseURL}`, 'iu'));
            });
    });

    test('Haeuser mit Ausstattung garage', async () => {
        // given

        // when
        const { status, headers, data }: AxiosResponse<HaeuserModel> =
            await client.get('/?ausstattung=true');

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        const { haeuser } = data._embedded;

        haeuser
            .map((haus) => haus.ausstattung)
            .forEach((ausstattung) => {
                expect(ausstattung.garage).toBe(true);
            });
    });

    test('Haeuser mit Ausstattung nicht garage', async () => {
        // given

        // when
        const { status, headers, data }: AxiosResponse<HaeuserModel> =
            await client.get('/?ausstattung=false');

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        const { haeuser } = data._embedded;

        haeuser
            .map((haus) => haus.ausstattung)
            .forEach((ausstattung) => {
                expect(ausstattung.garage).toBe(false);
            });
    });

    test('Mind ein Haus mit vorhandenem Schlagwort', async () => {
        // given
        const params = {
            [schlagwortVorhanden1]: 'true',
            [schlagwortVorhanden2]: 'true',
        };

        // when
        const { status, headers, data }: AxiosResponse<HaeuserModel> =
            await client.get('/', { params });

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data).toBeDefined();

        const { haeuser } = data._embedded;

        haeuser
            .map((haus) => haus.schlagwoerter)
            .forEach((schlagwoerter) =>
                expect(
                    schlagwoerter!.map((s) => s.trim().toUpperCase()),
                ).toEqual(
                    expect.arrayContaining([
                        schlagwortVorhanden1.toUpperCase(),
                        schlagwortVorhanden2.toUpperCase(),
                    ]),
                ),
            );
    });

    test('Kein Haus mit nicht vorhandenem Schlagwort', async () => {
        // given
        const params = { [schlagwortNichtVorhanden]: 'true' };

        // when
        const { status, data }: AxiosResponse<ErrorResponse> = await client.get(
            '/',
            { params },
        );

        // then
        expect(status).toBe(HttpStatus.NOT_FOUND);

        const { error, statusCode } = data;

        expect(error).toBe('Not Found');
        expect(statusCode).toBe(HttpStatus.NOT_FOUND);
    });

    test('Keine Haeuser zu einer nicht-vorhandenen Property', async () => {
        // given
        const params = { foo: 'bar' };

        // when
        const { status, data }: AxiosResponse<ErrorResponse> = await client.get(
            '/',
            { params },
        );

        // then
        expect(status).toBe(HttpStatus.NOT_FOUND);

        const { error, statusCode } = data;

        expect(error).toBe('Not Found');
        expect(statusCode).toBe(HttpStatus.NOT_FOUND);
    });
});
/* eslint-enable no-underscore-dangle */
