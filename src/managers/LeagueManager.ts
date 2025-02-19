import type {
  BaseManager,
  DivisionType,
  FetchOptions,
  LeagueEntryData,
  LeagueListData,
  QueueType,
  TierType
} from '../types';
import type { Client } from '../client';
import { LeagueEntry, LeagueList } from '../structures';
import { Collection } from '@discordjs/collection';
import { parseFetchOptions } from '../util';

/**
 * A league manager - to fetch and manage all summoner competitive info.
 *
 * Requires API key with access to `league-v4` and `league-exp-v4` API.
 */
export class LeagueManager implements BaseManager<Collection<QueueType, LeagueEntry>> {
  /**
   * The client this league manager belongs to.
   */
  readonly client: Client;

  /**
   * Creates a new League manager.
   * @param client - The client this league manager belongs to.
   */
  constructor(client: Client) {
    this.client = client;
  }

  /**
   * Fetch a summoner's competitive info by the summoner's ID.
   *
   * @param id - The ID of the summoner whose competitive info you want to find.
   * @param options - The basic fetching options.
   */
  async fetch(id: string, options?: FetchOptions) {
    const opts = parseFetchOptions(this.client, 'league', options);
    const { cache, region, ignoreCache, ignoreStorage, store } = opts;
    this.client.logger?.debug(`Fetching league entries for summoner ID: ${id} with options: `, opts);

    try {
      if (!ignoreCache) {
        this.client.logger?.trace(`Checking cache for league entries for summoner ID: ${id}`);
        const exists = await this.client.cache.has(`league:${id}`);
        if (exists) return await this.client.cache.get<Collection<QueueType, LeagueEntry>>(`league:${id}`)!;
      }

      if (!ignoreStorage) {
        this.client.logger?.trace(`Checking storage for league entries for summoner ID: ${id}`);
        const storage = this.client.storage.fetch<LeagueEntryData[]>('league', id);
        const stored = storage instanceof Promise ? await storage.catch(() => undefined) : storage;
        if (stored && stored.length) {
          this.client.logger?.trace(`Found league entries for summoner ID: ${id} in storage.`);
          const result = new Collection<QueueType, LeagueEntry>();
          for (const entry of stored) {
            const { queueType } = entry;
            const newEntry = new LeagueEntry(this.client, entry);
            result.set(queueType, newEntry);
          }
          if (cache) await this.client.cache.set(`league:${id}`, result);
          return result;
        }
      }

      this.client.logger?.trace(`Fetching league entries for summoner ID: ${id} from API.`);
      const response = await this.client.api.request('/lol/league/v4/entries/by-summoner/' + id, {
        region: region!,
        regional: false,
        api: 'LEAGUE',
        method: 'getLeagueEntriesForSummoner',
        params: `Summoner ID: ${id}`
      });
      const data = <LeagueEntryData[]>response.data;
      if (data && data.length) {
        this.client.logger?.trace(`Fetched league entries for summoner ID: ${id}, processing and returning...`);
        const entries = new Collection<QueueType, LeagueEntry>();
        for (const entry of data) entries.set(entry.queueType, new LeagueEntry(this.client, entry));
        if (cache) await this.client.cache.set(`league:${id}`, entries);
        if (store) await this.client.storage.save(data, 'league', id);
        return entries;
      } else return Promise.reject('No league entries found.');
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Fetch a collection of league entries by the queue type, tier and division.
   *
   * @param queue - The type of queue - RANKED_SOLO_5x5, RANKED_FLEX_SR, etc.
   * @param tier - The tier of the entries - IRON to CHALLENGER.
   * @param division - The division of the entries - I, II, III, IV.
   * @param options - The basic fetching options (and page number - defaults to 1).
   */
  async fetchByQueueAndTier(
    queue: QueueType,
    tier: TierType,
    division: DivisionType,
    options?: FetchOptions & { page: number }
  ) {
    const opts = parseFetchOptions(this.client, 'league', options);
    const isApex = tier === 'CHALLENGER' || tier === 'GRANDMASTER' || tier === 'MASTER';
    try {
      if (isApex) {
        this.client.logger?.trace(`Is Apex? ${isApex} - forwarding to apex fetcher.`);
        return await this._fetchApexByQueue(queue, tier, opts);
      } else {
        this.client.logger?.trace(`Is Apex? ${isApex} - forwarding to normal fetcher.`);
        return await this._fetchByQueueAndTier(queue, tier, division, { ...opts, page: options?.page ?? 1 });
      }
    } catch (error) {
      return Promise.reject(error);
    }
  }

  /**
   * Fetch the league entries by a league ID.
   *
   * @param leagueId - The League ID.
   * @param options - The basic fetching options (exception: `force` defaults to true).
   */
  async fetchByLeagueId(leagueId: string, options?: FetchOptions) {
    const opts = parseFetchOptions(this.client, 'league', options);
    const { cache, store, region, ignoreCache, ignoreStorage } = opts;
    this.client.logger?.debug(`Fetching league entries for league ID: ${leagueId} with options: `, opts);

    try {
      if (!ignoreCache) {
        this.client.logger?.trace(`Checking cache for league entries by league ID.`);
        const exists = await this.client.cache.has(`league-list:${leagueId}`);
        if (exists) return this.client.cache.get<LeagueList>(`league-list:${leagueId}`);
      }

      if (!ignoreStorage) {
        this.client.logger?.trace(`Checking storage for league entries by league ID.`);
        const storage = this.client.storage.fetch<LeagueListData>('league-list', leagueId);
        const stored = storage instanceof Promise ? await storage.catch(() => undefined) : storage;
        if (stored) {
          this.client.logger?.trace(`Found league entries for league ID in storage, processing and returning...`);
          const result = new LeagueList(this.client, stored);
          if (cache) await this.client.cache.set(`league-list:${leagueId}`, result);
          return result;
        }
      }

      this.client.logger?.trace(`Fetching league entries from API.`);
      const response = await this.client.api.request(`/lol/league/v4/leagues/${leagueId}`, {
        region: region!,
        regional: false,
        api: 'LEAGUE',
        method: 'getLeagueById',
        params: `League ID: ${leagueId}`
      });
      if (response && response.data) {
        this.client.logger?.trace(`Fetched league entries, processing and returning...`);
        const data = <LeagueListData>response.data;
        const list = new LeagueList(this.client, data);
        if (cache || store) {
          for (const entry of list.entries.values()) {
            const { summonerId, queueType } = entry;
            if (cache) {
              const exists = await this.client.cache.has(`league:${summonerId}`);
              const entries: Collection<QueueType, LeagueEntry> = exists
                ? (await this.client.cache.get(`league:${summonerId}`))!
                : new Collection();
              entries.set(queueType, entry);
              await this.client.cache.set(`league:${summonerId}`, entries);
            }
            if (store) {
              const storage = this.client.storage.fetch<LeagueEntryData[]>('league', summonerId);
              let stored = storage instanceof Promise ? await storage.catch(() => undefined) : storage;
              if (stored && stored.length) stored = stored.filter((e) => e.queueType !== queueType);
              else stored = [];
              stored.push(data.entries.find((e) => e.summonerId === summonerId && e.queueType === queueType)!);
              await this.client.storage.save(stored, 'league', summonerId);
            }
          }
          if (cache) await this.client.cache.set(`league-list:${leagueId}`, list);
          if (store) await this.client.storage.save(data, 'league-list', leagueId);
        }
        return list;
      } else return Promise.reject('No league entries found for the provided parameters.');
    } catch (error) {
      return Promise.reject(error);
    }
  }

  private async _fetchByQueueAndTier(
    queue: QueueType,
    tier: Omit<TierType, 'CHALLENGER' | 'GRANDMASTER' | 'MASTER'>,
    division: DivisionType,
    options: FetchOptions & { page: number }
  ) {
    const { cache, region, store } = options;
    const page = options?.page ?? 1;
    this.client.logger?.debug(
      `Fetching league entries for queue: ${queue}, tier: ${tier}, division: ${division}, page: ${page} with options: `,
      options
    );
    try {
      this.client.logger?.trace('Fetching league entries from API.');
      const response = await this.client.api.request(
        `/lol/league/v4/entries/${queue}/${tier}/${division}?page=${page}`,
        {
          region: region!,
          regional: false,
          api: 'LEAGUE',
          method: 'getLeagueEntries',
          params: `Queue: ${queue}, Tier: ${tier}, Division: ${division}`
        }
      );

      const data = <LeagueEntryData[]>response.data;
      if (data && data.length) {
        this.client.logger?.trace('Fetched league entries, processing and returning...');
        const result = new Collection<string, LeagueEntry>();
        for (const entry of data) {
          const { summonerId, queueType } = entry;
          const exists = await this.client.cache.has(`league:${summonerId}`);
          const entries: Collection<QueueType, LeagueEntry> = exists
            ? (await this.client.cache.get(`league:${summonerId}`))!
            : new Collection();
          const newEntry = new LeagueEntry(this.client, entry);
          entries.set(queueType, newEntry);
          if (cache) await this.client.cache.set(`league:${summonerId}`, entries);
          if (store) {
            const storage = this.client.storage.fetch<LeagueEntryData[]>('league', summonerId);
            let stored = storage instanceof Promise ? await storage.catch(() => undefined) : storage;
            if (stored && stored.length) stored = stored.filter((e) => e.queueType !== queueType);
            else stored = [];
            stored.push(entry);
            await this.client.storage.save(stored, 'league', summonerId);
          }
          result.set(summonerId, newEntry);
        }
        return result;
      } else return Promise.reject('No league entries found for the provided parameters.');
    } catch (error) {
      return Promise.reject(error);
    }
  }

  private async _fetchApexByQueue(
    queue: QueueType,
    tier: 'CHALLENGER' | 'GRANDMASTER' | 'MASTER',
    options: FetchOptions
  ) {
    const { cache, region, store } = options;
    this.client.logger?.debug(`Fetching ${tier} league entries for queue: ${queue} with options: `, options);
    try {
      this.client.logger?.trace(`Fetching ${tier} league entries from API.`);
      const response = await this.client.api.request(`/lol/league/v4/${tier.toLowerCase()}leagues/by-queue/${queue}`, {
        region: region!,
        regional: false,
        api: 'LEAGUE',
        method: `get${tier.charAt(0)}${tier.substring(1).toLowerCase()}League`,
        params: `Queue: ${queue}`
      });

      const data = <LeagueListData>response.data;
      if (data) {
        this.client.logger?.trace(`Fetched ${tier} league entries, processing and returning...`);
        const result = new LeagueList(this.client, data);
        const entries = [...result.entries.values()];
        for (const entry of entries) {
          const { summonerId, queueType } = entry;
          const exists = await this.client.cache.has(`league:${summonerId}`);
          const summEntries: Collection<QueueType, LeagueEntry> = exists
            ? (await this.client.cache.get(`league:${summonerId}`))!
            : new Collection();
          summEntries.set(queueType, entry);
          if (cache) await this.client.cache.set(`league:${summonerId}`, summEntries);
          if (store) {
            const storage = this.client.storage.fetch<LeagueEntryData[]>('league', summonerId);
            let stored = storage instanceof Promise ? await storage.catch(() => undefined) : storage;
            if (stored && stored.length) stored = stored.filter((e) => e.queueType !== queueType);
            else stored = [];
            stored.push({
              leagueId: entry.league,
              hotStreak: entry.hotStreak,
              inactive: entry.inactive,
              leaguePoints: entry.lp,
              rank: entry.division,
              summonerName: entry.summonerName,
              veteran: entry.veteran,
              freshBlood: entry.freshBlood,
              tier: entry.tier,
              queueType: entry.queueType,
              summonerId,
              losses: entry.losses,
              wins: entry.wins,
              miniSeries: entry.promos
            });
            await this.client.storage.save(stored, 'league', summonerId);
          }
        }
        return new Collection(entries.map((e) => [e.summonerId, e]));
      } else return Promise.reject('No league entries found for the provided parameters.');
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
