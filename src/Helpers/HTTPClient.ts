// Copyright (c) 2018-2020, Brandon Lehmann, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import * as http from 'http';
import * as https from 'https';
import fetch, { Headers, Response } from 'node-fetch';
import { format } from 'util';
import { AbortController } from 'abort-controller/dist/abort-controller';

/** @ignore */
export interface IError {
    code: number;
    message: string;
}

/** @ignore */
interface IErrorBody {
    error: IError;
}

/** @ignore */
const packageInfo = require('../../package.json');

/** @ignore */
export class HTTPClient {
    private readonly m_host: string;
    private readonly m_port: number;
    private readonly m_proto: string;
    private readonly m_timeout: number;
    private readonly m_userAgent: string;
    private readonly m_keepAlive: boolean;
    private readonly m_key?: string;
    private readonly m_errorHandler?: (statusCode: number, error: IError) => Error;
    private readonly m_agent: https.Agent | http.Agent;

    constructor (
        host = '127.0.0.1',
        port = 11898,
        timeout = 30000,
        ssl = false,
        userAgent: string = format('%s/%s', packageInfo.name, packageInfo.version),
        keepAlive = true,
        apiKey?: string,
        errorHandler?: (statusCode: number, error: IError) => Error
    ) {
        this.m_host = host;
        this.m_port = port;
        this.m_timeout = timeout;
        this.m_proto = (ssl) ? 'https' : 'http';
        this.m_userAgent = userAgent;
        this.m_keepAlive = keepAlive;
        if (apiKey) this.m_key = apiKey;
        if (errorHandler) this.m_errorHandler = errorHandler;

        if (this.ssl) {
            this.m_agent = new https.Agent({
                rejectUnauthorized: false,
                keepAlive: this.keepAlive
            });
        } else {
            this.m_agent = new http.Agent({
                keepAlive: this.keepAlive
            });
        }
    }

    protected get host (): string {
        return this.m_host;
    }

    protected get keepAlive (): boolean {
        return this.m_keepAlive;
    }

    protected get key (): string | undefined {
        return this.m_key;
    }

    protected get port (): number {
        return this.m_port;
    }

    protected get protocol (): string {
        return this.m_proto;
    }

    protected get ssl (): boolean {
        return (this.protocol === 'https');
    }

    protected get userAgent (): string {
        return this.m_userAgent;
    }

    protected get agent (): https.Agent | http.Agent {
        return this.m_agent;
    }

    protected get timeout (): number {
        return this.m_timeout;
    }

    protected get headers (): Headers {
        const headers = new Headers();

        headers.set('Accept', 'application/json');

        headers.set('Content-type', 'application/json');

        headers.set('User-Agent', this.userAgent);

        if (this.key) {
            headers.set('X-API-KEY', this.key);
        }

        return headers;
    }

    protected async delete (endpoint: string): Promise<void> {
        const response = await this.fetch('delete', endpoint);

        if (!response.ok) {
            if (this.m_errorHandler) {
                const body: IErrorBody = await response.json();

                throw this.m_errorHandler(response.status, body.error);
            } else {
                throw new Error(response.statusText);
            }
        }
    }

    protected async get (endpoint: string): Promise<any> {
        const response = await this.fetch('get', endpoint);

        const body = await response.json();

        if (response.ok) {
            return body;
        } else {
            if (this.m_errorHandler) {
                throw this.m_errorHandler(response.status, (body as IErrorBody).error);
            } else {
                throw new Error(response.statusText);
            }
        }
    }

    protected async post (endpoint: string, body?: any): Promise<any> {
        const response = await this.fetch('post', endpoint, body);

        let responseBody;

        try {
            responseBody = await response.json();
        } catch (e) {}

        if (response.ok) {
            return responseBody;
        } else {
            if (this.m_errorHandler) {
                throw this.m_errorHandler(response.status, (responseBody as IErrorBody).error);
            } else {
                throw new Error(response.statusText);
            }
        }
    }

    protected async put (endpoint: string, body?: any): Promise<any> {
        const response = await this.fetch('put', endpoint, body);

        let responseBody;

        try {
            responseBody = await response.json();
        } catch (e) {}

        if (response.ok) {
            return responseBody;
        } else {
            if (this.m_errorHandler) {
                throw this.m_errorHandler(response.status, (responseBody as IErrorBody).error);
            } else {
                throw new Error(response.statusText);
            }
        }
    }

    protected async rpcPost (method: string, params?: any): Promise<any> {
        const body = {
            jsonrpc: '2.0',
            method: method,
            params: params
        };

        const response = await this.post('json_rpc', body);

        if (response.error) {
            throw new Error(response.error.message);
        }

        return response.result;
    }

    private async fetch<T> (method: string, endpoint: string, body?: T): Promise<Response> {
        const controller = new AbortController();

        const url = format('%s://%s:%s/%s', this.protocol, this.host, this.port, endpoint);

        const timeout = setTimeout(() => controller.abort(), this.m_timeout);

        const response = await fetch(url, {
            headers: this.headers,
            agent: this.agent,
            method: method,
            body: (body) ? JSON.stringify(body) : undefined,
            signal: controller.signal
        });

        clearTimeout(timeout);

        return response;
    }
}
