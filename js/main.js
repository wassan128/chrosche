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

const en_td = (td) => {
	const fn_td = (e) => {
		document.querySelector(".modal").style.display = "block";
	};
	td.addEventListener("click", fn_td, false);
};

const draw_calendar = () => {
	const st_day = moment().startOf("month").day();
	const ed_date = moment().endOf("month").date();
	const tds = document.getElementsByTagName("td");
	let c = 0;
	for (const td of tds) {
		if (c - st_day >= ed_date) break;
		if (c++ < st_day) continue;
		td.innerText = c - st_day;
		en_td(td);
	}
};

document.addEventListener("DOMContentLoaded", () => {
	ld_memo();
	en_btn();
	draw_calendar();
});

