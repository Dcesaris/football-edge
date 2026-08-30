import { supabaseSelect, supabaseUpsert, supabaseInsert, supabaseDelete } from '../supabase';
import { apiFootballFetch } from '../providers/apiFootball';
import { acquireSyncLock, releaseSyncLock } from '../repositories/cacheRepository';
import { TTL } from '../ttls';

// ============================================================
// STATISTICS
// ============================================================

interface ApiStats {
  team: { id: number; name: string; logo: string };
  statistics: Array<{ type: string; value: string | number | null }>;
}

export async function fetchAndStoreStatistics(
  fixtureDbId: number,
  fixtureApiId: number,
  apiKey: string,
): Promise<boolean> {
  // Check if already stored
  const existing = await supabaseSelect('fixture_statistics', {
    select: 'id',
    filters: { fixture_id: fixtureDbId },
    limit: 1,
    count: 'exact',
    head: true,
  });

  if (existing.count && existing.count > 0) return true;

  const lockKey = `fixture:${fixtureApiId}:stats`;
  const gotLock = await acquireSyncLock(lockKey, TTL.SYNC_LOCK);
  if (!gotLock) return false;

  try {
    const { data } = await apiFootballFetch<ApiStats[]>(
      'fixtures/statistics',
      { fixture: fixtureApiId.toString() },
      { apiKey, fixtureId: fixtureApiId },
    );

    for (const teamStats of data.response) {
      const stats = teamStats.statistics;
      const find = (type: string) => {
        const s = stats.find((s) => s.type === type);
        if (!s || s.value == null || s.value === '') return null;
        const num = typeof s.value === 'number' ? s.value : parseInt(String(s.value), 10);
        return isNaN(num) ? null : num;
      };

      // Get team
      const teamResult = await supabaseSelect<{ id: number }>('teams', {
        select: 'id',
        filters: { api_id: teamStats.team.id },
        limit: 1,
      });
      if (!teamResult.data || teamResult.data.length === 0) continue;
      const teamId = teamResult.data[0].id;

      await supabaseUpsert('fixture_statistics', {
        fixture_id: fixtureDbId,
        team_id: teamId,
        possession: find('Ball Possession') ? parseInt(String(find('Ball Possession'))) : null,
        total_shots: find('Total Shots'),
        shots_on_goal: find('Shots on Goal'),
        shots_off_goal: find('Shots off Goal'),
        blocked_shots: find('Blocked Shots'),
        corner_kicks: find('Corner Kicks'),
        fouls: find('Fouls'),
        offsides: find('Offsides'),
        yellow_cards: find('Yellow Cards'),
        red_cards: find('Red Cards'),
        goalkeeper_saves: find('Goalkeeper Saves'),
        expected_goals: find('Expected Goals') ? Number(find('Expected Goals')) : null,
        raw_json: stats,
      }, { onConflict: 'fixture_id,team_id' });
    }

    return true;
  } catch {
    return false;
  } finally {
    await releaseSyncLock(lockKey);
  }
}

// ============================================================
// LINEUPS
// ============================================================

interface ApiLineup {
  team: { id: number; name: string; logo: string };
  formation: string;
  startXI: Array<{
    player: { id: number; name: string; number: number; pos: string; grid: string | null };
  }>;
  substitutes: Array<{
    player: { id: number; name: string; number: number; pos: string };
  }>;
}

export async function fetchAndStoreLineups(
  fixtureDbId: number,
  fixtureApiId: number,
  apiKey: string,
): Promise<boolean> {
  const existing = await supabaseSelect('lineups', {
    select: 'id',
    filters: { fixture_id: fixtureDbId },
    limit: 1,
    count: 'exact',
    head: true,
  });

  if (existing.count && existing.count > 0) return true;

  const lockKey = `fixture:${fixtureApiId}:lineups`;
  const gotLock = await acquireSyncLock(lockKey, TTL.SYNC_LOCK);
  if (!gotLock) return false;

  try {
    const { data } = await apiFootballFetch<ApiLineup[]>(
      'fixtures/lineups',
      { fixture: fixtureApiId.toString() },
      { apiKey, fixtureId: fixtureApiId },
    );

    for (const lineup of data.response) {
      const teamResult = await supabaseSelect<{ id: number }>('teams', {
        select: 'id',
        filters: { api_id: lineup.team.id },
        limit: 1,
      });
      if (!teamResult.data || teamResult.data.length === 0) continue;
      const teamId = teamResult.data[0].id;

      const lineupResult = await supabaseUpsert<{ id: number }>('lineups', {
        fixture_id: fixtureDbId,
        team_id: teamId,
        formation: lineup.formation,
        confirmed: true,
        raw_json: lineup,
      }, { onConflict: 'fixture_id,team_id', select: 'id' });

      if (lineupResult.data && lineupResult.data.length > 0) {
        const lineupId = lineupResult.data[0].id;

        // Delete existing lineup players
        await supabaseDelete('lineup_players', { lineup_id: lineupId });

        // Insert new ones
        const players = lineup.startXI.map((p) => ({
          lineup_id: lineupId,
          player_id: null as number | null,
          starter: true,
          position: p.player.pos,
          grid: p.player.grid,
          shirt_number: p.player.number,
        }));

        // Resolve player IDs
        for (let i = 0; i < players.length; i++) {
          const apiPlayerId = lineup.startXI[i]?.player.id;
          if (apiPlayerId) {
            const playerResult = await supabaseSelect<{ id: number }>('players', {
              select: 'id',
              filters: { api_id: apiPlayerId },
              limit: 1,
            });
            if (playerResult.data && playerResult.data.length > 0) {
              players[i].player_id = playerResult.data[0].id;
            }
          }
        }

        if (players.length > 0) {
          await supabaseInsert('lineup_players', players);
        }
      }
    }

    return true;
  } catch {
    return false;
  } finally {
    await releaseSyncLock(lockKey);
  }
}

// ============================================================
// PLAYERS (per fixture)
// ============================================================

interface ApiPlayer {
  team: { id: number };
  players: Array<{
    player: {
      id: number;
      name: string;
      photo: string;
      position: string;
      rating: number | null;
      captain: boolean;
      substitute: boolean;
      statistics: {
        games: { minutes: number; position: string; rating: number | null; captain: boolean };
        shots: { total: number | null; on: number | null };
        goals: { total: number | null; conceded: number | null; assists: number | null };
        passes: { total: number | null; key: number | null; accuracy: number | null };
        tackles: { total: number | null; blocks: number | null; interceptions: number | null };
        duels: { total: number | null; won: number | null };
        fouls: { drawn: number | null; committed: number | null };
        cards: { yellow: number | null; red: number | null };
        penalty: { won: number | null; scored: number | null; missed: number | null };
      };
    };
  }>;
}

export async function fetchAndStorePlayers(
  fixtureDbId: number,
  fixtureApiId: number,
  apiKey: string,
): Promise<boolean> {
  const existing = await supabaseSelect('fixture_players', {
    select: 'id',
    filters: { fixture_id: fixtureDbId },
    limit: 1,
    count: 'exact',
    head: true,
  });

  if (existing.count && existing.count > 0) return true;

  const lockKey = `fixture:${fixtureApiId}:players`;
  const gotLock = await acquireSyncLock(lockKey, TTL.SYNC_LOCK);
  if (!gotLock) return false;

  try {
    const { data } = await apiFootballFetch<ApiPlayer[]>(
      'fixtures/players',
      { fixture: fixtureApiId.toString() },
      { apiKey, fixtureId: fixtureApiId },
    );

    for (const teamPlayers of data.response) {
      const teamResult = await supabaseSelect<{ id: number }>('teams', {
        select: 'id',
        filters: { api_id: teamPlayers.team.id },
        limit: 1,
      });
      if (!teamResult.data || teamResult.data.length === 0) continue;
      const teamId = teamResult.data[0].id;

      for (const p of teamPlayers.players) {
        // Upsert player
        const playerResult = await supabaseUpsert<{ id: number }>('players', {
          api_id: p.player.id,
          name: p.player.name,
          photo: p.player.photo,
        }, { onConflict: 'api_id', select: 'id' });

        if (!playerResult.data || playerResult.data.length === 0) continue;
        const playerId = playerResult.data[0].id;

        const stats = p.player.statistics;
        await supabaseUpsert('fixture_players', {
          fixture_id: fixtureDbId,
          team_id: teamId,
          player_id: playerId,
          starter: !p.player.substitute,
          substitute: p.player.substitute,
          position: p.player.position,
          minutes: stats.games.minutes,
          rating: stats.games.rating,
          captain: stats.games.captain,
          shots: stats.shots.total,
          shots_on_target: stats.shots.on,
          goals: stats.goals.total,
          assists: stats.goals.assists,
          passes: stats.passes.total,
          tackles: stats.tackles.total,
          fouls_committed: stats.fouls.committed,
          fouls_drawn: stats.fouls.drawn,
          yellow_cards: stats.cards.yellow,
          red_cards: stats.cards.red,
          raw_json: p.player,
        }, { onConflict: 'fixture_id,player_id' });
      }
    }

    return true;
  } catch {
    return false;
  } finally {
    await releaseSyncLock(lockKey);
  }
}
