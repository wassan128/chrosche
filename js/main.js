"use strict";

const ld_memo = () => {
	chrome.storage.local.get("memo", (val) => {
		console.log(val);
	});
};

const en_btn = () => {
	const btn_save = document.querySelector(".btn-save");
	const fn_btn_save = (e) => {
		const text = document.querySelector("input").value;
		chrome.storage.local.set({"memo": text}, () => {
			console.log("success");
		});
	};
	btn_save.addEventListener("click", fn_btn_save, false);

	const btn_close = document.querySelector(".modal-close");
	const fn_btn_close = (e) => {
		document.querySelector(".modal").style.display = "none";
	};
	btn_close.addEventListener("click", fn_btn_close, false);
};

const en_td = () => {
	const tds = document.getElementsByTagName("td");
	const fn_tds = (e) => {
		const now = moment();
		document.querySelector(".modal").style.display = "block";
	};
	for (const td of tds) {
		td.addEventListener("click", fn_tds, false);
	}
};

const draw_calendar = () => {
};

document.addEventListener("DOMContentLoaded", () => {
	ld_memo();
	en_btn();
	en_td();
});

