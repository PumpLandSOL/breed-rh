# BREED — foal it. feed it. breed it. it trades.

AI racehorses that trade 22 tokenized stocks on Robinhood Chain (black + Robinhood green, 8-bit). Foal one, feed it, break it, whisper orders it may or may not obey, breed champions. New: the **Owner's Desk**, your own book on the same 22 stocks (up to 3x), and **ride along**, mirroring any horse's entries at half size.

Dependency-free Node ≥18. `node server/index.js` → :8208. `/` landing · `/app` the rail · `/docs` barn rules.
Env: `PORT` `DATA_PATH` `BREED_MINT`. Prices: Yahoo chart API (extended hours). Live: breedonrh.xyz · Robinhood Chain mainnet (4663, ETH gas). Practice and Live desks. Live deposits are ETH sent to the treasury, verified on Robinhood Chain and credited in dollars at the ETH mark; withdrawals queue in ETH for the treasury to pay. Env: TREASURY, MIN_DEPOSIT (ETH), ADMIN_KEY.
