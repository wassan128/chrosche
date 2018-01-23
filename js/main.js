"use strict";

const get_ym = () => {
	const year = document.getElementById("cal-year").innerText;
	const month = document.getElementById("cal-month").innerText;
	return [year, month];
};

const load_memo = (date) => {
	const [year, month] = get_ym();
	document.getElementById("cal-date").innerText = date;
	chrome.storage.local.get(year, (res) => {
		const ul = document.querySelector("ul");
		ul.innerHTML = "";
		if (typeof(res[year][month]) === "undefined" || typeof(res[year][month][date]) === "undefined") {
			return;
		}

		for (const l of res[year][month][date]) {
			const li = generate_li(l);
			ul.appendChild(li);
		}
	});
};

const coloring = () => {
	const color = ["#eee", "#c6e48b", "#7bc96f", "#239a3b", "#196127"];
	const [year, month] = get_ym();
	chrome.storage.local.get(year, (res) => {
		for (const date in res[year][month]) {
			const len = res[year][month][date].length;
			const lv = (len > 4) ? 4 : len;
			if (lv >= 0) {
				document.getElementById(`c${date}`).style.background = color[lv];
				if (lv > 2) {
					document.getElementById(`c${date}`).style.color = "#fff";
				} else {
					document.getElementById(`c${date}`).style.color = "#666";
				}
			}
		}
	});
};

const onclk_td = (e) => {
	const date = e.target.innerText;
	load_memo(date);
	document.querySelector(".modal").style.display = "block";
}

const onclk_li = (li) => {
	const fn_li = (e) => {
		if (!confirm(`「${e.target.innerText}」を削除しますか?`)) {
			return;
		}
		const [year, month] = get_ym();
		const date = document.getElementById("cal-date").innerText;
		const del = e.target.innerText;
		chrome.storage.local.get(year, (res) => {
			res[year][month][date] = res[year][month][date].filter((m, i, self) => self.indexOf(del) !== i);
			chrome.storage.local.set(res, () => {
				li.parentNode.removeChild(li);
				coloring();
			});
		});
	};
	li.addEventListener("click", fn_li, false);
};

const generate_li = (text) => {
	const li = document.createElement("li");
	li.innerText = text;
	onclk_li(li);
	return li;
};

class Calendar {
	constructor(offset) {
		this.offset = 0;
		this.cal = moment();
		this.year = this.cal.year();
		this.month = this.cal.month() + 1;
	}
	reset() {
		this.cal = moment().add(this.offset, "months");
		this.year = this.cal.year();
		this.month = this.cal.month() + 1;
	}
	draw() {
		document.getElementById("cal-year").innerText = this.year;
		document.getElementById("cal-month").innerText = this.month;

		const st_day = this.cal.startOf("month").day();
		const ed_date = this.cal.endOf("month").date();
		
		const tds = document.getElementsByTagName("td");
		let c = 0;
		for (const td of tds) {
			const date = c - st_day + 1;
			if (c++ < st_day || date > ed_date) {
				td.style.color = "#666";
				td.style.background = "#F9F9F9";
				td.removeAttribute("id");
				td.innerText = "";
				td.removeEventListener("click", onclk_td, false);
				continue;
			}
			td.innerText = date;
			td.setAttribute("id", `c${date}`);
			td.style.color = "#666";
			td.style.background = "#eee";
			td.addEventListener("click", onclk_td, false);
		}
	}
	next_month() {
		this.offset += 1;
		this.reset();
	}
	prev_month() {
		this.offset -= 1;
		this.reset();
	}
}

document.addEventListener("DOMContentLoaded", () => {
	const cal = new Calendar();
	cal.draw();
	coloring();

	const btn_prev_m = document.querySelector(".btn-prev-month");
	const fn_btn_prev_m = (e) => {
		cal.prev_month();
		cal.draw();
		coloring();
	};
	btn_prev_m.addEventListener("click", fn_btn_prev_m, false);
	
	const btn_next_m = document.querySelector(".btn-next-month");
	const fn_btn_next_m = (e) => {
		cal.next_month();
		cal.draw();
		coloring();
	};
	btn_next_m.addEventListener("click", fn_btn_next_m, false);

	const btn_prev_d = document.querySelector(".btn-prev-date");
	const fn_btn_prev_d = (e) => {
		const date = parseInt(document.getElementById("cal-date").innerText);
		if (document.getElementById(`c${date - 1}`) !== null) {
			load_memo(date - 1);
		}
	};
	btn_prev_d.addEventListener("click", fn_btn_prev_d, false);

	const btn_next_d = document.querySelector(".btn-next-date");
	const fn_btn_next_d = (e) => {
		const date = parseInt(document.getElementById("cal-date").innerText);
		if (document.getElementById(`c${date + 1}`) !== null) {
			load_memo(date + 1);
		}
	};
	btn_next_d.addEventListener("click", fn_btn_next_d, false);

	const btn_close = document.querySelector(".modal-close");
	const fn_btn_close = (e) => {
		document.querySelector(".modal").style.display = "none";
	};
	btn_close.addEventListener("click", fn_btn_close, false);

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
			}
			if (typeof(res[year][month]) === "undefined") {
				res[year][month] = {};
			}
			if (typeof(res[year][month][date]) === "undefined") {
				res[year][month][date] = [text.value];
			} else {
				res[year][month][date].push(text.value);
			}
			chrome.storage.local.set(res, () => {
				const ul = document.querySelector("ul");
				const li = generate_li(text.value);
				ul.appendChild(li);
				coloring();
				text.value = "";
			});
		});
	};
	btn_save.addEventListener("click", fn_btn_save, false);
});

