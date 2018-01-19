"use strict";

const ld_memo = () => {
	chrome.storage.local.get("memo", (val) => {
		console.log(val);
	});
};

const en_btn = () => {
	const btn_save = document.querySelector(".btn-save");
	const fn_btn_save = (e) => {
		const year = document.getElementById("cal-year").innerText;
		const month = `0${document.getElementById("cal-month").innerText}`.slice(-2);
		const date = `0${document.getElementById("cal-date").innerText}`.slice(-2);

		const text = document.querySelector("input").value;
		const key = `${year}${month}${date}`;
		chrome.storage.local.get(key, (res) => {
			if (typeof(res[key]) === "undefined") {
				res[key] = "";
			}
			res[key] += `${text};`;
			chrome.storage.local.set(res, () => {
			});
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
		const date = e.target.innerText;
		document.getElementById("cal-date").innerText = date;
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
		const date = c - st_day + 1;
		if (date > ed_date) break;
		if (c++ < st_day) continue;
		td.innerText = date;
		td.setAttribute("id", "c" + `0${date}`.slice(-2))
		en_td(td);
	}
};

document.addEventListener("DOMContentLoaded", () => {
	ld_memo();
	en_btn();
	draw_calendar();
});

