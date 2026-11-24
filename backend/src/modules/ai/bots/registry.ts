import type { TokenPayload } from '../../../utils/jwt.js';
import { customerBot } from './customer.bot.js';
import { shopBot } from './shop.bot.js';
import { adminBot } from './admin.bot.js';
import { checkBotAccessPolicy, type BotAccessCheckResult } from './accessPolicy.js';
import type { AiBotDefinition, AiBotId } from './types.js';

export const AI_BOT_REGISTRY = new Map<AiBotId, AiBotDefinition<any>>([
  [customerBot.id, customerBot],
  [shopBot.id, shopBot],
  [adminBot.id, adminBot],
]);

export function getAiBot(rawBotId: string): AiBotDefinition<any> | null {
  if (rawBotId === 'customer' || rawBotId === 'shop' || rawBotId === 'admin') {
    return AI_BOT_REGISTRY.get(rawBotId) ?? null;
  }
  return null;
}

export function checkBotAccess(
  bot: AiBotDefinition<any>,
  user: TokenPayload | undefined
): BotAccessCheckResult {
  return checkBotAccessPolicy(bot.access, user);
}
