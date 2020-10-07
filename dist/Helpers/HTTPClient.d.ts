/// <reference types="node" />
import * as http from 'http';
import * as https from 'https';
import { Headers } from 'node-fetch';
/** @ignore */
export interface IError {
    code: number;
    message: string;
}
/** @ignore */
export declare class HTTPClient {
    private readonly m_host;
    private readonly m_port;
    private readonly m_proto;
    private readonly m_timeout;
    private readonly m_userAgent;
    private readonly m_keepAlive;
    private readonly m_key?;
    private readonly m_errorHandler?;
    private readonly m_agent;
    constructor(host?: string, port?: number, timeout?: number, ssl?: boolean, userAgent?: string, keepAlive?: boolean, apiKey?: string, errorHandler?: (statusCode: number, error: IError) => Error);
    protected get host(): string;
    protected get keepAlive(): boolean;
    protected get key(): string | undefined;
    protected get port(): number;
    protected get protocol(): string;
    protected get ssl(): boolean;
    protected get userAgent(): string;
    protected get agent(): https.Agent | http.Agent;
    protected get timeout(): number;
    protected get headers(): Headers;
    protected delete(endpoint: string): Promise<void>;
    protected get(endpoint: string): Promise<any>;
    protected post(endpoint: string, body?: any): Promise<any>;
    protected put(endpoint: string, body?: any): Promise<any>;
    protected rpcPost(method: string, params?: any): Promise<any>;
    private fetch;
}
