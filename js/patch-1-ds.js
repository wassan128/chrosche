"use strict";

import * as storage from "./libstorage.js";

/* patch for data structure change */
/* memo[YEAR] -> memo[YEAR_MONTH] */

export const p_01 = async () => {
	const m_old = await storage.get_sync_storage();
	console.log("*** start patch-1-ds ***");
	for (const y in m_old) {
		if (y.length !== 4) {
			console.log("skip:", y);
			continue;
		}
		for (const m in m_old[y]) {
			const m_new = {};
			const ym = `${y}_${m}`;
			m_new[ym] = {};
			for (const d in m_old[y][m]) {
				if (m_old[y][m][d].length !== 0) {
					m_new[ym][d] = m_old[y][m][d];
				}
			}
			if (Object.keys(m_new[ym]).length === 0) {
				console.log("empty:", ym)
			} else {
				await storage.set_sync_storage(m_new);
				console.log("sets:", ym)
			}
		}
	}
	console.log("*** end patch-1-ds ***")
};


