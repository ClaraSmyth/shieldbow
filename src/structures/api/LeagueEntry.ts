import type { DivisionType, FetchOptions, LeagueEntryData, QueueType, TierType } from '../../types';
import type { Client } from '../../client';
import type { Summoner } from './Summoner';

/**
 * The league entry promotion series information.
 */
export interface Promos {
  /**
   * The number of wins the summoner needs to advance to the next tier.
   */
  readonly target: number;
  /**
   * The number of times the summoner won (during this promotion series).
   */
  readonly wins: number;
  /**
   * The number of times the summoner lost (during this promotion series).
   */
  readonly losses: number;
  /**
   * The summoner's promotion progression - eg: `LLWNN`.
   *
   * `L` means a loss.
   *
   * `W` means a win.
   *
   * `N` means no data (the summoner needs to play more games).
   */
  readonly progress: string;
}

/**
 * A representation of a summoner's competitive details.
 */
export class LeagueEntry {
  /**
   * The ID of the summoner this data belongs to.
   */
  readonly summonerId: string;
  /**
   * The name of the summoner this data belongs to.
   */
  readonly summonerName: string;
  /**
   * The league ID.
   */
  readonly league: string;
  /**
   * The type of queue - such as RANKED_SOLO_5x5, RANKED_FLEX_SR or RANKED_FLEX_TT.
   */
  readonly queueType: QueueType;
  /**
   * The tier the summoner belongs to - such as BRONZE, GOLD, etc.
   */
  readonly tier: TierType;
  /**
   * The division under the tier - From 1 to 4 (I - IV).
   */
  readonly division: DivisionType;
  /**
   * The amount of league points (LP) the summoner has.
   */
  readonly lp: number;
  /**
   * The number of wins the summoner has in this queue.
   */
  readonly wins: number;
  /**
   * The number of losses the summoner has in this queue.
   */
  readonly losses: number;
  /**
   * Whether the summoner is on a hot streak.
   */
  readonly hotStreak: boolean;
  /**
   * Whether the summoner is a veteran or a pro player.
   */
  readonly veteran: boolean;
  /**
   * Whether the summoner is new to the game.
   */
  readonly freshBlood: boolean;
  /**
   * Whether the summoner has been inactive.
   */
  readonly inactive: boolean;
  /**
   * This only exists if the summoner is in a promotion series.
   */
  readonly promos?: Promos;
  private readonly client: Client;

  /**
   * Create a new League Entry instance.
   * @param client - The client requesting the data.
   * @param data - The raw league entry data from the API.
   */
  constructor(client: Client, data: LeagueEntryData) {
    this.client = client;
    this.league = data.leagueId;
    this.summonerId = data.summonerId;
    this.summonerName = data.summonerName;
    this.queueType = data.queueType;
    this.tier = data.tier;
    this.division = data.rank;
    this.lp = data.leaguePoints;
    this.wins = data.wins;
    this.losses = data.losses;
    this.hotStreak = data.hotStreak;
    this.veteran = data.veteran;
    this.freshBlood = data.freshBlood;
    this.inactive = data.inactive;
    this.promos = data.miniSeries;
  }

  /**
   * Fetch the summoner this data belongs to.
   *
   * @param options - The basic fetching options.
   */
  fetchSummoner(options?: FetchOptions): Promise<Summoner> {
    return this.client.summoners.fetch(this.summonerId, options);
  }
}
