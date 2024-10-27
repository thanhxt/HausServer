// Copyright (C) 2021 - present Juergen Zimmermann, Hochschule Karlsruhe
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program. If not, see <https://www.gnu.org/licenses/>.

/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import { HttpStatus } from '@nestjs/common';
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { type GraphQLQuery } from '../buch/buch-mutation.resolver.test.js';
import { type GraphQLResponseBody } from '../buch/buch-query.resolver.test.js';
import {
    host,
    httpsAgent,
    port,
    shutdownServer,
    startServer,
} from '../testserver.js';

// -----------------------------------------------------------------------------
// T e s t s
// -----------------------------------------------------------------------------
// Test-Suite
// eslint-disable-next-line max-lines-per-function
describe('Token', () => {
    let client: AxiosInstance;
    const graphqlPath = 'graphql';

    // Testserver starten und dabei mit der DB verbinden
    beforeAll(async () => {
        await startServer();
        const baseURL = `https://${host}:${port}`;
        client = axios.create({
            baseURL,
            httpsAgent,
        });
    });

    afterAll(async () => {
        await shutdownServer();
    });

    test('Token', async () => {
        // given
        const username = 'admin';
        const password = 'p'; // NOSONAR
        const body: GraphQLQuery = {
            query: `
                mutation {
                    token(
                        username: "${username}",
                        password: "${password}"
                    ) {
                        access_token
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        // eslint-disable-next-line sonarjs/no-duplicate-string
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).not.toBeNull();
        expect(data.data!.token).not.toBeNull();

        const { token } = data.data!;

        expect(token).toBeDefined();
        expect(token).not.toBeNull();

        const { access_token } = token; // eslint-disable-line camelcase, @typescript-eslint/naming-convention

        expect(access_token).toBeDefined();
        expect(access_token).not.toBeNull();

        const tokenParts = access_token.split('.'); // eslint-disable-line @typescript-eslint/no-unsafe-call, camelcase

        expect(tokenParts).toHaveLength(3); // eslint-disable-line @typescript-eslint/no-magic-numbers
        expect(access_token).toMatch(/^[a-z\d]+\.[a-z\d]+\.[\w-]+$/iu);
    });

    test('Token mit falschem Passwort', async () => {
        // given
        const username = 'admin';
        const password = 'FALSCH'; // NOSONAR
        const body: GraphQLQuery = {
            query: `
                mutation {
                    token(
                        username: "${username}",
                        password: "${password}"
                    ) {
                        access_token
                    }
                }
            `,
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.data!.token).toBeNull();

        const { errors } = data;

        expect(errors).toBeDefined();
        expect(errors!).toHaveLength(1);

        const [error] = errors!;
        const { message, path, extensions } = error;

        expect(message).toBe('Falscher Benutzername oder falsches Passwort');
        expect(path).toBeDefined();
        expect(path![0]).toBe('token');
        expect(extensions).toBeDefined();
        expect(extensions!.code).toBe('BAD_USER_INPUT');
    });

    test('Refresh', async () => {
        // given
        const username = 'admin';
        const password = 'p'; // NOSONAR
        const tokenBody: GraphQLQuery = {
            query: `
                mutation {
                    token(
                        username: "${username}",
                        password: "${password}"
                    ) {
                        refresh_token
                    }
                }
            `,
        };
        const tokenResponse: AxiosResponse<Record<string, any> | null> =
            await client.post(graphqlPath, tokenBody);
        const { refresh_token } = tokenResponse.data!.data!.token; // eslint-disable-line camelcase, @typescript-eslint/naming-convention
        const body: GraphQLQuery = {
            /* eslint-disable camelcase */
            query: `
                mutation {
                    refresh(refresh_token: "${refresh_token}") {
                        access_token
                    }
                }
            `,
            /* eslint-enable camelcase */
        };

        // when
        const { status, headers, data }: AxiosResponse<GraphQLResponseBody> =
            await client.post(graphqlPath, body);

        // then
        expect(status).toBe(HttpStatus.OK);
        expect(headers['content-type']).toMatch(/json/iu);
        expect(data.errors).toBeUndefined();
        expect(data.data).not.toBeNull();
        expect(data.data!.token).not.toBeNull();

        const { refresh } = data.data!;

        expect(refresh).toBeDefined();
        expect(refresh).not.toBeNull();

        const { access_token } = refresh; // eslint-disable-line camelcase, @typescript-eslint/naming-convention

        expect(access_token).toBeDefined();
        expect(access_token).not.toBeNull();

        const tokenParts = access_token.split('.'); // eslint-disable-line @typescript-eslint/no-unsafe-call, camelcase

        expect(tokenParts).toHaveLength(3); // eslint-disable-line @typescript-eslint/no-magic-numbers
        expect(access_token).toMatch(/^[a-z\d]+\.[a-z\d]+\.[\w-]+$/iu);
    });
});
/* eslint-enable @typescript-eslint/no-unsafe-assignment */
