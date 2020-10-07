"use strict";
// Copyright (c) 2018-2020, Brandon Lehmann, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTPClient = void 0;
const http = require("http");
const https = require("https");
const node_fetch_1 = require("node-fetch");
const util_1 = require("util");
const abort_controller_1 = require("abort-controller/dist/abort-controller");
/** @ignore */
const packageInfo = require('../../package.json');
/** @ignore */
class HTTPClient {
    constructor(host = '127.0.0.1', port = 11898, timeout = 30000, ssl = false, userAgent = util_1.format('%s/%s', packageInfo.name, packageInfo.version), keepAlive = true, apiKey, errorHandler) {
        this.m_host = host;
        this.m_port = port;
        this.m_timeout = timeout;
        this.m_proto = (ssl) ? 'https' : 'http';
        this.m_userAgent = userAgent;
        this.m_keepAlive = keepAlive;
        if (apiKey)
            this.m_key = apiKey;
        if (errorHandler)
            this.m_errorHandler = errorHandler;
        if (this.ssl) {
            this.m_agent = new https.Agent({
                rejectUnauthorized: false,
                keepAlive: this.keepAlive
            });
        }
        else {
            this.m_agent = new http.Agent({
                keepAlive: this.keepAlive
            });
        }
    }
    get host() {
        return this.m_host;
    }
    get keepAlive() {
        return this.m_keepAlive;
    }
    get key() {
        return this.m_key;
    }
    get port() {
        return this.m_port;
    }
    get protocol() {
        return this.m_proto;
    }
    get ssl() {
        return (this.protocol === 'https');
    }
    get userAgent() {
        return this.m_userAgent;
    }
    get agent() {
        return this.m_agent;
    }
    get timeout() {
        return this.m_timeout;
    }
    get headers() {
        const headers = new node_fetch_1.Headers();
        headers.set('Accept', 'application/json');
        headers.set('Content-type', 'application/json');
        headers.set('User-Agent', this.userAgent);
        if (this.key) {
            headers.set('X-API-KEY', this.key);
        }
        return headers;
    }
    delete(endpoint) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.fetch('delete', endpoint);
            if (!response.ok) {
                if (this.m_errorHandler) {
                    const body = yield response.json();
                    throw this.m_errorHandler(response.status, body.error);
                }
                else {
                    throw new Error(response.statusText);
                }
            }
        });
    }
    get(endpoint) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.fetch('get', endpoint);
            const body = yield response.json();
            if (response.ok) {
                return body;
            }
            else {
                if (this.m_errorHandler) {
                    throw this.m_errorHandler(response.status, body.error);
                }
                else {
                    throw new Error(response.statusText);
                }
            }
        });
    }
    post(endpoint, body) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.fetch('post', endpoint, body);
            let responseBody;
            try {
                responseBody = yield response.json();
            }
            catch (e) { }
            if (response.ok) {
                return responseBody;
            }
            else {
                if (this.m_errorHandler) {
                    throw this.m_errorHandler(response.status, responseBody.error);
                }
                else {
                    throw new Error(response.statusText);
                }
            }
        });
    }
    put(endpoint, body) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.fetch('put', endpoint, body);
            let responseBody;
            try {
                responseBody = yield response.json();
            }
            catch (e) { }
            if (response.ok) {
                return responseBody;
            }
            else {
                if (this.m_errorHandler) {
                    throw this.m_errorHandler(response.status, responseBody.error);
                }
                else {
                    throw new Error(response.statusText);
                }
            }
        });
    }
    rpcPost(method, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const body = {
                jsonrpc: '2.0',
                method: method,
                params: params
            };
            const response = yield this.post('json_rpc', body);
            if (response.error) {
                throw new Error(response.error.message);
            }
            return response.result;
        });
    }
    fetch(method, endpoint, body) {
        return __awaiter(this, void 0, void 0, function* () {
            const controller = new abort_controller_1.AbortController();
            const url = util_1.format('%s://%s:%s/%s', this.protocol, this.host, this.port, endpoint);
            const timeout = setTimeout(() => controller.abort(), this.m_timeout);
            const response = yield node_fetch_1.default(url, {
                headers: this.headers,
                agent: this.agent,
                method: method,
                body: (body) ? JSON.stringify(body) : undefined,
                signal: controller.signal
            });
            clearTimeout(timeout);
            return response;
        });
    }
}
exports.HTTPClient = HTTPClient;
