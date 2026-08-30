import { getSupabase } from '../supabase';
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
  const supabase = getSupabase();

  // Check if already stored
  const { count } = await supabase
    .from('fixture_statistics')
    .select('*', { count: 'exact', head: true })
    .eq('fixture_id', fixtureDbId);

  if (count && count > 0) return true;

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

      // Get or create team
      const { data: team } = await supabase
        .from('teams')
        .select('id')
        .eq('api_id', teamStats.team.id)
        .single();

      if (!team) continue;

      await supabase
        .from('fixture_statistics')
        .upsert({
          fixture_id: fixtureDbId,
          team_id: team.id,
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
  const supabase = getSupabase();

  const { count } = await supabase
    .from('lineups')
    .select('*', { count: 'exact', head: true })
    .eq('fixture_id', fixtureDbId);

  if (count && count > 0) return true;

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
      const { data: team } = await supabase
        .from('teams')
        .select('id')
        .eq('api_id', lineup.team.id)
        .single();

      if (!team) continue;

      const { data: lineupRow } = await supabase
        .from('lineups')
        .upsert({
          fixture_id: fixtureDbId,
          team_id: team.id,
          formation: lineup.formation,
          confirmed: true,
          raw_json: lineup,
        }, { onConflict: 'fixture_id,team_id' })
        .select()
        .single();

      if (lineupRow) {
        // Insert lineup players
        const players = lineup.startXI.map((p) => ({
          lineup_id: lineupRow.id,
          player_id: null as number | null,
          starter: true,
          position: p.player.pos,
          grid: p.player.grid,
          shirt_number: p.player.number,
        }));

        // Resolve player IDs
        for (const p of players) {
          const { data: player } = await supabase
            .from('players')
            .select('id')
            .eq('api_id', lineup.startXI[players.indexOf(p)]?.player.id || 0)
            .single();
          if (player) p.player_id = player.id;
        }

        await supabase.from('lineup_players').delete().eq('lineup_id', lineupRow.id);
        if (players.length > 0) {
          await supabase.from('lineup_players').insert(players);
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
  }[];
}

export async function fetchAndStorePlayers(
  fixtureDbId: number,
  fixtureApiId: number,
  apiKey: string,
): Promise<boolean> {
  const supabase = getSupabase();

  const { count } = await supabase
    .from('fixture_players')
    .select('*', { count: 'exact', head: true })
    .eq('fixture_id', fixtureDbId);

  if (count && count > 0) return true;

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
      // Get team
      const { data: team } = await supabase
        .from('teams')
        .select('id')
        .eq('api_id', teamPlayers.team.id)
        .single();
      if (!team) continue;

      for (const p of teamPlayers.players) {
        // Upsert player
        const { data: playerRow } = await supabase
          .from('players')
          .upsert({
            api_id: p.player.id,
            name: p.player.name,
            photo: p.player.photo,
          }, { onConflict: 'api_id' })
          .select()
          .single();

        if (!playerRow) continue;

        const stats = p.player.statistics;
        await supabase
          .from('fixture_players')
          .upsert({
            fixture_id: fixtureDbId,
            team_id: team.id,
            player_id: playerRow.id,
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
