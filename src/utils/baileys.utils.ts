export interface BaileysInternals {
  generateWAMessageFromContent: Function;
  normalizeMessageContent: Function;
  isJidGroup: Function;
  generateMessageIDV2: Function;
  relayMessage: Function;
}

let cachedBaileys: BaileysInternals | null = null;

export function loadBaileysInternals(sock: any): BaileysInternals {
  if (cachedBaileys) {
    return cachedBaileys;
  }

  const packages = ['baileys', '@whiskeysockets/baileys', '@adiwajshing/baileys'];

  for (const pkg of packages) {
    try {
      const mod = require(pkg);
      const internals: BaileysInternals = {
        generateWAMessageFromContent:
          mod.generateWAMessageFromContent || mod.Utils?.generateWAMessageFromContent,
        normalizeMessageContent:
          mod.normalizeMessageContent || mod.Utils?.normalizeMessageContent,
        isJidGroup: mod.isJidGroup || mod.WABinary?.isJidGroup,
        generateMessageIDV2:
          mod.generateMessageIDV2 ||
          mod.Utils?.generateMessageIDV2 ||
          mod.generateMessageID ||
          mod.Utils?.generateMessageID,
        relayMessage: sock.relayMessage
      };

      if (Object.values(internals).every(Boolean)) {
        cachedBaileys = internals;
        return internals;
      }
    } catch {}
  }

  throw new Error(
    'Missing baileys internals. Please install: npm i baileys'
  );
}

export function resetBaileysCache(): void {
  cachedBaileys = null;
}