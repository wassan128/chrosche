"use strict";

const marker_done = "DONE:";
const get_ym = () => {
    const year = document.getElementById("cal-year").innerText;
    const month = document.getElementById("cal-month").innerText;
    return [year, month];
};

const load_task = (date) => {
    const [year, month] = get_ym();
    document.getElementById("cal-date").innerText = date;
    chrome.storage.local.get(year, (res) => {
        const ul = document.querySelector("ul");
        ul.innerHTML = "";
        if (typeof(res[year]) === "undefined" || typeof(res[year][month]) === "undefined" || typeof(res[year][month][date]) === "undefined") {
            return;
        }

        for (const l of res[year][month][date]) {
            const li = gen_taskbox(l);
            ul.appendChild(li);
        }
		enable_hashtags();
    });
};

const coloring = () => {
    const color = [
        "rgba(238, 238, 238, 1.0)",
        "rgba(198, 228, 139, 1.0)",
        "rgba(123, 201, 111, 1.0)",
        "rgba(35, 154, 59, 1.0)",
        "rgba(25, 97, 39, 1.0)"
    ];
    const [year, month] = get_ym();
    chrome.storage.local.get(year, (res) => {
        if (typeof(res[year]) === "undefined" || typeof(res[year][month]) === "undefined") {
            return;
        }
        for (const date in res[year][month]) {
            const len = res[year][month][date].length;
            const lv = (len > 4) ? 4 : len;
            if (lv >= 0) {
                document.getElementById(`c${date}`).style.background = color[lv];
                if (lv > 2) {
                    document.getElementById(`c${date}`).style.color = "#fff";
                } else {
                    document.getElementById(`c${date}`).style.color = "#333";
                }
            }
        }
    });
};

const onclk_td = (e) => {
    const date = e.target.innerText;
    load_task(date);
    document.querySelector(".modal").style.display = "block";
    document.querySelector(".modal-box").style.display = "block";
};

const onclk_done = (done) => {
    const fn_done = (e) => {
        const li = e.target.parentNode.parentNode;
        const [year, month] = get_ym();
        const date = document.getElementById("cal-date").innerText;
        chrome.storage.local.get(year, (res) => {
            let is_done = false;
            res[year][month][date].forEach((e, idx) => {
                if (e === li.innerText) {
                    res[year][month][date][idx] = `${marker_done}${e}`;
                    is_done = true;
                } else if (e === `${marker_done}${li.innerText}`) {
                    res[year][month][date][idx] = e.replace(marker_done, "");
                }
            });
            chrome.storage.local.set(res, () => {
                if (is_done) {
                    li.setAttribute("class", "done-task");
                } else {
                    li.removeAttribute("class", "done-task");
                }
            });
        });
    };
    done.addEventListener("click", fn_done, false);
};

const onclk_edit = (edit) => {
    const fn_edit = (e) => {
        const li = e.target.parentNode.parentNode;
        const [year, month] = get_ym();
        const date = document.getElementById("cal-date").innerText;

        const input = document.createElement("input");
        const before = li.innerText;
        input.value = before;
        input.setAttribute("class", "edit-box");
        li.innerText = "";
        li.appendChild(input);
        input.addEventListener("keyup", (e) => {
            if (e.keyCode === 13) {
                const after = input.value;
                if (after === "") {
					// TODO: warning dialog
                    return;
                }
                chrome.storage.local.get(year, (res) => {
                    res[year][month][date].forEach((e, idx) => {
                        const txt = e.replace(marker_done, "");
                        if (txt === before) {
                            res[year][month][date][idx] = after;
                        }
                    });
                    chrome.storage.local.set(res, () => {
						li.innerHTML = fmt_task(after)[0];
						add_acts(li);
                        li.removeAttribute("class", "done-task");
                    });
                });
            }
        });
    };
    edit.addEventListener("click", fn_edit, false);
};

const onclk_del = (del) => {
    const fn_del = (e) => {
        const li = e.target.parentNode.parentNode;
        if (!confirm(`「${li.innerText}」を削除しますか?`)) {
            return;
        }
        const [year, month] = get_ym();
        const date = document.getElementById("cal-date").innerText;
        const target = li.classList.contains("done-task") ? `${marker_done}${li.innerText}` : li.innerText;
        chrome.storage.local.get(year, (res) => {
            res[year][month][date] = res[year][month][date].filter((m, i, self) => self.indexOf(target) !== i);
            chrome.storage.local.set(res, () => {
                li.parentNode.removeChild(li);
                coloring();
            });
        });
    };
    del.addEventListener("click", fn_del, false);
};

const fmt_task = (text) => {
	let is_done = false;
    if (text.slice(0, 5) === marker_done) {
		is_done = true;
        text = text.replace(marker_done, "");
	}
	const data = text.replace(">", "&gt;")
		.replace("<", "&lt;")
		.replace("'", "&quot;")
		.replace(/(#[^\s#]*)/g, "<a href='$1' class='hashtags'>$1</a>");
	return [data, is_done];
};

const enable_hashtags = () => {
	const btns_hashtag = document.getElementsByClassName("hashtags");
	console.log(btns_hashtag);
    const fn_btn_hashtag = (e) => {
		console.log(e.target.innerText);
	};
	for (const btn_hashtag of btns_hashtag) {
		btn_hashtag.addEventListener("click", fn_btn_hashtag, false);
	}
};

const find_tags = (tag) => {
	const ptn = new RegExp(`${tag}(\\s|$)`);
	const [year, month] = get_ym();
	chrome.storage.local.get(year, (res) => {
		for (const date in res[year][month]) {
			for (const lst of res[year][month][date]) {
				if (lst.match(ptn)) {
					console.log(lst);
				}
			}
		}
	});
};

const add_acts = (li) => {
    const act = document.createElement("span");
    const a_done = document.createElement("i");
    a_done.setAttribute("class", "fa fa-check");
    const a_edit = document.createElement("i");
    a_edit.setAttribute("class", "fa fa-pencil");
    const a_del = document.createElement("i");
    a_del.setAttribute("class", "fa fa-trash-o");
	
    onclk_done(a_done);
    onclk_edit(a_edit);
    onclk_del(a_del);
	
    act.append(a_done);
    act.append(a_edit);
    act.append(a_del);
    li.appendChild(act);
};

const gen_taskbox = (raw_text) => {
    const box = document.createElement("li");
	const [task_text, is_done] = fmt_task(raw_text);
	if (is_done) {
        box.setAttribute("class", "done-task");
	}
	box.innerHTML = task_text;
	add_acts(box);
    return box;
};

class Calendar {
    constructor(offset=0) {
        this.offset = offset;
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
        const fire_mark = document.createElement("i");
        fire_mark.setAttribute("class", "fa fa-fire");

        document.getElementById("cal-year").innerText = this.year;
        document.getElementById("cal-month").innerText = this.month;

        const st_day = this.cal.startOf("month").day();
        const ed_date = this.cal.endOf("month").date();
		
        const tds = document.getElementsByTagName("td");
        let c = 0;
        for (const td of tds) {
            const date = c - st_day + 1;
            if (c++ < st_day || date > ed_date) {
                td.style.color = "#333";
                td.style.background = "rgba(249, 249, 249, 0.2)";
                td.removeAttribute("id");
                td.innerText = "";
                td.removeEventListener("click", onclk_td, false);
                continue;
            }
            td.innerText = date;
            td.setAttribute("id", `c${date}`);
            td.style.color = "#333";
            td.style.background = "rgba(238, 238, 238, 1.0)";
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
            load_task(date - 1);
        }
    };
    btn_prev_d.addEventListener("click", fn_btn_prev_d, false);

    const btn_next_d = document.querySelector(".btn-next-date");
    const fn_btn_next_d = (e) => {
        const date = parseInt(document.getElementById("cal-date").innerText);
        if (document.getElementById(`c${date + 1}`) !== null) {
            load_task(date + 1);
        }
    };
    btn_next_d.addEventListener("click", fn_btn_next_d, false);

    const btns_close = document.querySelectorAll(".modal-close");
    const fn_btn_close = (e) => {
        document.querySelector(".modal").style.display = "none";
    };
    for (const btn_close of btns_close) {
        btn_close.addEventListener("click", fn_btn_close, false);
    }

    const btn_save = document.querySelector(".btn-save");
    const fn_btn_save = (e) => {
        const text = document.querySelector(".memo-text");
        if (text.value === "") {
            alert("予定の内容を入力してください");
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
                const li = gen_taskbox(text.value);
                ul.appendChild(li);

				enable_hashtags();
                coloring();
                text.value = "";
            });
        });
    };
    btn_save.addEventListener("click", fn_btn_save, false);

});

