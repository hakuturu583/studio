// This Source Code Form is subject to the terms of the Mozilla Public
// License, v2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/

type CurrentUser = {
  email: string;
};

type SigninArgs = {
  id_token: string;
  org_slug: string;
};

type Session = {
  bearer_token: string;
};

type Org = {
  id: string;
  slug: string;
  display_name?: string;
};

type DeviceCodeArgs = {
  client_id: string;
};

type DeviceCodeResponse = {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
};

type TokenArgs = {
  device_code: string;
  client_id: string;
};

type TokenResponse = {
  access_token: string;
  id_token: string;
};

export type UserID = string & { __brand: "UserID" };
export type LayoutID = string & { __brand: "LayoutID" };
export type ISO8601Timestamp = string & { __brand: "ISO8601Timestamp" };

type Layout = {
  id: LayoutID;
  name: string;
  path: string[];
  creatorUserId: UserID;
  createdAt: ISO8601Timestamp;
  updatedAt: ISO8601Timestamp;
  permission: "creator_write" | "org_read" | "org_write";
  data?: Record<string, unknown>;
};

class ConsoleApi {
  private _baseUrl: string;
  private _authHeader?: string;

  constructor(baseUrl: string) {
    this._baseUrl = baseUrl;
  }

  setAuthHeader(header: string): void {
    this._authHeader = header;
  }

  async orgs(): Promise<Org[]> {
    return await this.get<Org[]>("/v1/orgs");
  }

  async me(): Promise<CurrentUser> {
    return await this.get<CurrentUser>("/v1/me");
  }

  async signin(args: SigninArgs): Promise<Session> {
    return await this.post<Session>("/v1/signin", args);
  }

  async signout(): Promise<void> {
    return await this.post<void>("/v1/signout");
  }

  async deviceCode(args: DeviceCodeArgs): Promise<DeviceCodeResponse> {
    return await this.post<DeviceCodeResponse>("/v1/auth/device-code", {
      client_id: args.client_id,
    });
  }

  async token(args: TokenArgs): Promise<TokenResponse> {
    return await this.post<TokenResponse>("/v1/auth/token", {
      device_code: args.device_code,
      client_id: args.client_id,
    });
  }

  private async get<T>(apiPath: string, query?: Record<string, string>): Promise<T> {
    return await this.request<T>(
      query == undefined ? apiPath : `${apiPath}?${new URLSearchParams(query).toString()}`,
      { method: "GET" },
    );
  }

  private async post<T>(apiPath: string, body?: unknown): Promise<T> {
    return await this.request<T>(apiPath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  private async put<T>(apiPath: string, body?: unknown): Promise<T> {
    return await this.request<T>(apiPath, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  private async delete<T>(apiPath: string, query?: Record<string, string>): Promise<T> {
    return await this.request<T>(
      query == undefined ? apiPath : `${apiPath}?${new URLSearchParams(query).toString()}`,
      { method: "DELETE" },
    );
  }

  private async request<T>(url: string, config?: RequestInit): Promise<T> {
    const fullUrl = `${this._baseUrl}${url}`;

    const headers: Record<string, string> = {};
    if (this._authHeader != undefined) {
      headers["Authorization"] = this._authHeader;
    }
    const fullConfig = { ...config, headers: { ...headers, ...config?.headers } };

    const res = await fetch(fullUrl, fullConfig);
    if (res.status !== 200) {
      try {
        const json = (await res.json()) as unknown;
        throw new Error((json as { error?: string }).error ?? "Request failed");
      } catch (err) {
        throw new Error(err.message ?? "Request failed");
      }
    }

    try {
      return (await res.json()) as T;
    } catch (err) {
      throw new Error("Request Failed.");
    }
  }

  async getLayouts(options: { includeData: boolean }): Promise<readonly Layout[]> {
    return await this.get<Layout[]>("/v1/layouts", {
      include_data: options.includeData ? "true" : "false",
    });
  }

  async getLayout(id: LayoutID, options: { includeData: boolean }): Promise<Layout | undefined> {
    return await this.get<Layout>(`/v1/layouts/${id}`, {
      include_data: options.includeData ? "true" : "false",
    });
  }

  async createLayout(
    layout: Pick<Layout, "name" | "path" | "permission" | "data">,
  ): Promise<Layout> {
    return await this.post<Layout>("/v1/layouts", layout);
  }

  async updateLayout(
    layout: Pick<Layout, "id"> & Partial<Pick<Layout, "name" | "path" | "permission" | "data">>,
  ): Promise<Layout> {
    return await this.put<Layout>(`/v1/layouts/${layout.id}`, layout);
  }

  async deleteLayout(id: LayoutID): Promise<void> {
    await this.delete<Layout>(`/v1/layouts/${id}`);
  }
}

export type { CurrentUser, Org };
export default ConsoleApi;
