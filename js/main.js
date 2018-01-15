"use strict";

const ld_memo = () => {
	chrome.storage.local.get("memo", (val) => {
		console.log(val);
	});
};

const en_btns = () => {
	const btns = document.getElementsByClassName("btn-save");
	const fn_btns = (e) => {
		const text = document.querySelector("input").value;
		chrome.storage.local.set({"memo": text}, () => {
			console.log("success");
		});
	}; 
	for (const btn of btns) {
		btn.addEventListener("click", fn_btns, false);
	}
};

document.addEventListener("DOMContentLoaded", () => {
	ld_memo();
	en_btns();
});

