import { Client } from '../dist';

describe('Test lol-challenges-v1', () => {
  const client = new Client(process.env.RIOT_API_KEY!);

  beforeAll(async () => {
    await client.initialize({
      region: 'na',
      cache: false
    });
  });

  test('Check fetching challenge data by ID', async () => {
    const challenge = await client.challenges.fetch(0);
    expect(challenge).toBeDefined();
    expect(challenge.name).toBe('CRYSTAL');
    expect(challenge.percentiles).toBeDefined();
    expect(challenge.percentiles.get('NONE')).toBe(1);
  });

  test('Check fetching all challenges data', async () => {
    const challenges = await client.challenges.fetchAll();
    expect(challenges).toBeDefined();
    expect(challenges.size).toBeGreaterThan(0);
    expect(challenges.get(0)).toBeDefined();
    expect(challenges.get(0)?.name).toBe('CRYSTAL');
  });
});