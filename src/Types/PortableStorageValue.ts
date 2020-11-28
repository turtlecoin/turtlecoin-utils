// Copyright (c) 2019-2020, The TurtleCoin Developers
//
// Please see the included LICENSE file for more information.

import { BigInteger, PortableStorage } from '../Types';

/** @ignore */
export type PortableStoreValue =
    BigInteger.BigInteger |
    Buffer |
    PortableStorage |
    PortableStorage[] |
    string |
    string[] |
    boolean;
