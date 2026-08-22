/**
 * Minimal stubs so vendored Violentmonkey types stay self-contained.
 * Official `@violentmonkey/types` references `@types/chrome` and
 * `user-agent-data-types`; we do not ship those packages.
 */

interface UADataValues {
    brands?: { brand: string; version: string }[];
    mobile?: boolean;
    platform?: string;
    architecture?: string;
    bitness?: string;
    model?: string;
    platformVersion?: string;
    uaFullVersion?: string;
    wow64?: boolean;
    fullVersionList?: { brand: string; version: string }[];
    formFactors?: string[];
}

declare namespace chrome {
    namespace cookies {
        interface CookiePartitionKey {
            topLevelSite?: string;
            hasCrossSiteAncestor?: boolean;
        }

        interface Cookie {
            name: string;
            value: string;
            domain: string;
            hostOnly: boolean;
            path: string;
            secure: boolean;
            httpOnly: boolean;
            sameSite: string;
            session: boolean;
            expirationDate?: number;
            storeId: string;
            partitionKey?: CookiePartitionKey;
        }

        interface CookieDetails {
            name: string;
            url?: string;
            storeId?: string;
            partitionKey?: CookiePartitionKey;
        }

        interface GetAllDetails {
            url?: string;
            name?: string;
            domain?: string;
            path?: string;
            secure?: boolean;
            session?: boolean;
            storeId?: string;
            partitionKey?: CookiePartitionKey;
        }

        interface SetDetails {
            url: string;
            name?: string;
            value?: string;
            domain?: string;
            path?: string;
            secure?: boolean;
            httpOnly?: boolean;
            sameSite?: string;
            expirationDate?: number;
            storeId?: string;
            partitionKey?: CookiePartitionKey;
        }

        function getAll(
            details: GetAllDetails,
            callback?: (cookies: Cookie[]) => void,
        ): void;

        function set(
            details: SetDetails,
            callback?: (cookie?: Cookie | null) => void,
        ): void;
    }
}

declare namespace browser {
    namespace cookies {
        interface PartitionKey {
            topLevelSite?: string;
            hasCrossSiteAncestor?: boolean;
        }

        interface Cookie {
            name: string;
            value: string;
            domain: string;
            hostOnly: boolean;
            path: string;
            secure: boolean;
            httpOnly: boolean;
            sameSite: string;
            session: boolean;
            expirationDate?: number;
            storeId: string;
            firstPartyDomain: string;
            partitionKey?: PartitionKey;
        }

        interface _RemoveDetails {
            url?: string;
            name?: string;
            storeId?: string;
            firstPartyDomain?: string;
            partitionKey?: PartitionKey;
        }

        interface _GetAllDetails {
            url?: string;
            name?: string;
            domain?: string;
            path?: string;
            secure?: boolean;
            session?: boolean;
            storeId?: string;
            firstPartyDomain?: string;
            partitionKey?: PartitionKey;
        }

        interface _SetDetails {
            url?: string;
            name?: string;
            value?: string;
            domain?: string;
            path?: string;
            secure?: boolean;
            httpOnly?: boolean;
            expirationDate?: number;
            storeId?: string;
            firstPartyDomain?: string;
            sameSite?: string;
            partitionKey?: PartitionKey;
        }
    }

    namespace downloads {
        type FilenameConflictAction = "uniquify" | "overwrite" | "prompt";
    }
}
