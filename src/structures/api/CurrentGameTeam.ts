import type { Client } from '../../client';
import type { CurrentGameBanData, CurrentGameParticipantData } from '../../types';
import type { Champion, RuneTree, SummonerSpell } from '../dragon';
import { CurrentGameParticipant } from './CurrentGameParticipant';
import type { Collection } from '@discordjs/collection';

/**
 * Current game's team's champion ban information.
 */
export interface CurrentGameChampionBan {
  /**
   * The banned champion.
   */
  champion: Champion;
  /**
   * The order of the ban.
   */
  turn: number;
}

/**
 * A representation of a team in a live game.
 */
export class CurrentGameTeam {
  /**
   * The team's ID.
   */
  readonly id: number;
  /**
   * The team's side.
   */
  readonly side: 'red' | 'blue';
  /**
   * The champions banned by this team.
   */
  readonly bans: CurrentGameChampionBan[];
  /**
   * The team's participants.
   */
  readonly participants: CurrentGameParticipant[];

  /**
   * Creates a new Current Game Team instance.
   * @param client - The client requesting the data.
   * @param bans - The raw bans data for this team from the API.
   * @param participants - The raw participants data for this team from the API.
   * @param champions - The champions involved in the game.
   * @param runeTrees - The collection of the runes in the game.
   * @param summonerSpells - The collection of the summoner spells in the game.
   */
  constructor(
    client: Client,
    bans: CurrentGameBanData[],
    participants: CurrentGameParticipantData[],
    champions: Collection<string, Champion>,
    runeTrees: Collection<string, RuneTree>,
    summonerSpells: Collection<string, SummonerSpell>
  ) {
    this.id = participants[0].teamId;
    this.side = this.id === 100 ? 'blue' : 'red';
    this.bans = bans.map((b) => ({
      champion: champions.find((c) => c.key === b.championId)!,
      turn: b.pickTurn
    }));
    this.participants = participants.map(
      (p) =>
        new CurrentGameParticipant(client, p, champions.find((c) => c.key === p.championId)!, runeTrees, summonerSpells)
    );
  }
}
