<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [shieldbow](./shieldbow.md) &gt; [ChampionMastery](./shieldbow.championmastery.md)

## ChampionMastery class

A representation of a summoner's mastery over a champion.

<b>Signature:</b>

```typescript
export declare class ChampionMastery 
```

## Constructors

|  Constructor | Modifiers | Description |
|  --- | --- | --- |
|  [(constructor)(client, data)](./shieldbow.championmastery._constructor_.md) |  | Constructs a new instance of the <code>ChampionMastery</code> class |

## Properties

|  Property | Modifiers | Type | Description |
|  --- | --- | --- | --- |
|  [champion](./shieldbow.championmastery.champion.md) |  | [Champion](./shieldbow.champion.md) | The champion these details are for. |
|  [chestGranted](./shieldbow.championmastery.chestgranted.md) |  | boolean | Whether the summoner has earned the chest for this champion this season. |
|  [lastPlayedAt](./shieldbow.championmastery.lastplayedat.md) |  | Date | The time this summoner played the champion last time. |
|  [level](./shieldbow.championmastery.level.md) |  | number | The mastery level, can be anywhere between 1 and 7. |
|  [points](./shieldbow.championmastery.points.md) |  | number | The total number of mastery points earned by this summoner on the champion. |
|  [pointsSinceLastLevel](./shieldbow.championmastery.pointssincelastlevel.md) |  | number | The number of mastery points earned by the summoner since they progressed from the previous level. |
|  [pointsToNextLevel](./shieldbow.championmastery.pointstonextlevel.md) |  | number | The number of mastery points required by the summoner to achieve the next level. |
|  [tokens](./shieldbow.championmastery.tokens.md) |  | number | This is only applicable if the mastery level is 5 or 6. The number of tokens achieved for reaching the next mastery level. |
