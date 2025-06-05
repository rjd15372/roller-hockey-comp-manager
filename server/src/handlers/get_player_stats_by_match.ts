
import { type PlayerStat } from '../schema';

export declare function getPlayerStatsByMatch(matchId: number): Promise<PlayerStat[]>;
