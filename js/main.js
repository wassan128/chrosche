"use strict";

const get_ym = () => {
	const year = document.getElementById("cal-year").innerText;
	const month = document.getElementById("cal-month").innerText;
	return [year, month];
};

const ld_memo = () => {
	const [year, month] = get_ym();
	chrome.storage.local.get(year, (res) => {
		for (const date in res[year][month]) {
			document.getElementById(`c${date}`).style.background = "#c6e48b";
		}
	});
};

const en_btn = () => {
	const btn_save = document.querySelector(".btn-save");
	const fn_btn_save = (e) => {
		const text = document.querySelector("input");
		if (text.value === "") {
			return;
		}

		const [year, month] = get_ym();
		const date = document.getElementById("cal-date").innerText;

		chrome.storage.local.get(year, (res) => {
			if (typeof(res[year]) === "undefined") {
				res[year] = {};
				res[year][month] = {};
			}
			if (typeof(res[year][month][date]) === "undefined") {
				res[year][month][date] = [text.value];
			} else {
				res[year][month][date].push(text.value);
			}
			chrome.storage.local.set(res, () => {
				document.getElementById(`c${date}`).style.background = "#c6e48b";
				text.value = "";
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
		const [year, month] = get_ym();
		const date = e.target.innerText;
		document.getElementById("cal-date").innerText = date;
		chrome.storage.local.get(year, (res) => {
			const ul = document.querySelector("ul");
			ul.innerHTML = "";
			if (typeof(res[year][month][date]) === "undefined") {
				return;
			}

			for (const l of res[year][month][date]) {
				const li = document.createElement("li");
				li.innerText = l;
				ul.appendChild(li);
			}
		});
		document.querySelector(".modal").style.display = "block";
	};
	td.addEventListener("click", fn_td, false);
};

const draw_calendar = (offset) => {
	const now = moment();
	const st_day = now.add(offset, "months").startOf("month").day();
	const ed_date = now.add(offset, "months").endOf("month").date();
	
	const tds = document.getElementsByTagName("td");
	let c = 0;
	for (const td of tds) {
		const date = c - st_day + 1;
		if (date > ed_date) break;
		if (c++ < st_day) continue;
		td.innerText = date;
		td.setAttribute("id", `c${date}`);
		td.style.background = "#EEE";
		en_td(td);
	}
};

document.addEventListener("DOMContentLoaded", () => {
	en_btn();
	draw_calendar(0);
	ld_memo();
});

