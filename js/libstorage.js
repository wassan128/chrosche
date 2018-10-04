"use strict";

const is_exceeded = () => {
	if (chrome.runtime.lastError === undefined) {
		return false;
	} else {
		console.log(chrome.runtime.lastError["message"]);
		return true;
	}
};

// chrome.storage.sync
export const get_sync_storage = async (key=null) => {
	return new Promise(resolve => {
		chrome.storage.sync.get(key, res => resolve(res));
	});
};

export const set_sync_storage = async (val) => {
	return new Promise(resolve => {
		chrome.storage.sync.set(val, () => {
			if (is_exceeded()) {
				resolve(true);
			} else {
				resolve(false);
			}
		});
	});
};

export const remove_sync_storage = async (key) => {
	return new Promise(resolve => {
		chrome.storage.sync.remove(key, () => {
			if (key) resolve();
		});
	});
};

// chrome.storage.local
export const get_local_storage = async (key) => {
	return new Promise(resolve => {
		chrome.storage.local.get(key, res => resolve(res));
	});
};

export const set_local_storage = async (val) => {
	return new Promise(resolve => {
		chrome.storage.local.set(val, () => {
			if (is_exceeded()) {
				resolve(true);
			} else {
				resolve(false);
			}
		});
	});
};
