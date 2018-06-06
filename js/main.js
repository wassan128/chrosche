"use strict";

/* constants */
const MEMO_ID_PREFIX = "m_";

/* utils */
Element.prototype.prependChild = function (el) {
	this.insertBefore(el, this.firstChild);
}
const get_ym = () => {
    const year = document.getElementById("cal-year").innerText;
    const month = document.getElementById("cal-month").innerText;
    return [year, month];
};
const sanitize = (text) => {
	return text.replace("<", "&lt;")
	.replace("'", "&quot;")
	.replace(/(#[^\s#]*)/g, "<a href='$1' class='hashtags'>$1</a>");
};
const get_id = id_str => parseInt(id_str.slice(MEMO_ID_PREFIX.length));

/* functions */
const load_memos = (date) => {
    const [year, month] = get_ym();
    document.getElementById("cal-date").innerText = date;
    chrome.storage.sync.get(year, (res) => {
        const ul = document.querySelector("ul");
        ul.innerHTML = "";
        if (typeof(res[year]) === "undefined" || typeof(res[year][month]) === "undefined" || typeof(res[year][month][date]) === "undefined") {
            return;
        }

        for (const memo of res[year][month][date]) {
            const li = gen_memobox(memo);
            ul.prependChild(li);
        }
		onclk_hashtags();
    });
};

const save_memo = () => {
	const t_box = document.querySelector(".memo-text");
	if (t_box.value === "") {
		alert("予定の内容を入力してください");
		return;
	}

	const ts = moment().unix();
	const body = sanitize(t_box.value);
	const memo = {
		"id": ts,
		"body": body,
		"is_done": false
	};

	const [year, month] = get_ym();
	const date = document.getElementById("cal-date").innerText;
	chrome.storage.sync.get(year, (res) => {
		if (typeof(res[year]) === "undefined") {
			res[year] = {};
		}
		if (typeof(res[year][month]) === "undefined") {
			res[year][month] = {};
		}
		if (typeof(res[year][month][date]) === "undefined") {
			res[year][month][date] = [memo];
		} else {
			res[year][month][date].push(memo);
		}
		chrome.storage.sync.set(res, () => {
			if (chrome.runtime.lastError === undefined) {
				const ul = document.querySelector("ul");
				const li = gen_memobox(memo);
				ul.prependChild(li);

				onclk_hashtags();
				coloring();
				t_box.value = "";
			} else if (chrome.runtime.lastError["message"] === "QUOTA_BYTES quota exceeded") {
				alert("登録できるメモの上限サイズを超えています。古いメモを削除してください。");
			}
		});
	});
};

const coloring = () => {
    const color = [
        "rgba(238, 238, 238, 0.9)",
        "rgba(198, 228, 139, 0.9)",
        "rgba(123, 201, 111, 0.9)",
        "rgba(35, 154, 59, 0.9)",
        "rgba(25, 97, 39, 0.9)"
    ];
    const [year, month] = get_ym();
    chrome.storage.sync.get(year, (res) => {
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
    load_memos(date);
    document.querySelector(".modal").style.display = "block";
    document.querySelector(".modal-box").style.display = "block";
    document.querySelector("#tb-normal").style.display = "block";
};

const onclk_done = (done) => {
    const fn_done = (e) => {
        const li = e.target.parentNode.parentNode;
        const [year, month] = get_ym();
        const date = document.getElementById("cal-date").innerText;
		const target = get_id(li.id);
        chrome.storage.sync.get(year, (res) => {
            res[year][month][date].forEach((memo, idx) => {
                if (memo.id === target) {
					res[year][month][date][idx].is_done = !(memo.is_done);
				}
            });
            chrome.storage.sync.set(res, () => {
                if (li.getAttribute("class") === "done-memo") {
                    li.removeAttribute("class", "done-memo");
                } else {
                    li.setAttribute("class", "done-memo");
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
        const target = get_id(li.id);
        input.value = li.innerText;
        input.setAttribute("class", "edit-box");
        li.innerText = "";
        li.appendChild(input);
        input.addEventListener("keyup", (e) => {
            if (e.keyCode === 13) {
                const after = sanitize(input.value);
                if (after === "") {
					// TODO: warning dialog
                    return;
                }
                chrome.storage.sync.get(year, (res) => {
                    res[year][month][date].forEach((memo, idx) => {
                        if (memo.id === target) {
                            res[year][month][date][idx].body = after;
                        }
                    });
                    chrome.storage.sync.set(res, () => {
						if (chrome.runtime.lastError === undefined) {
							li.innerHTML = after;
							add_acts(li);
							onclk_hashtags();
						} else if (chrome.runtime.lastError["message"] === "QUOTA_BYTES quota exceeded") {
							alert("登録できるメモの上限サイズを超えています。古いメモを削除してください。");
						}
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
        const target = get_id(li.id);
		console.log(target)
        chrome.storage.sync.get(year, (res) => {
			res[year][month][date] = res[year][month][date].filter(x => x.id !== target);
            chrome.storage.sync.set(res, () => {
                li.parentNode.removeChild(li);
                coloring();
            });
        });
    };
    del.addEventListener("click", fn_del, false);
};

const onclk_hashtags = () => {
	const btns_hashtag = document.getElementsByClassName("hashtags");
    const fn_btn_hashtag = (e) => {
		const target = e.target.innerText;
		const ptn = new RegExp(`${target}</a>`);
		
		const [year, month] = get_ym();
		document.getElementById("cal-tag").innerText = `${target} (${month}月)`;
		document.querySelector("#memo-form").style.display = "none";
		document.querySelector("#tb-normal").style.display = "none";
		document.querySelector("#tb-hashtag").style.display = "block";

		const ul = document.querySelector("ul");
		ul.innerHTML = "";
		ul.setAttribute("class", "on-tags");
		let cur = "";
		chrome.storage.sync.get(year, (res) => {
			for (const date in res[year][month]) {
				for (const memo of res[year][month][date]) {
					if (memo.body.match(ptn)) {
						if (cur !== `${year}${month}${date}`) {
							cur = `${year}${month}${date}`;

							const p = document.createElement("p");
							p.innerText = `${year}/${month}/${date}`;
							p.setAttribute("class", "hash-date");

							ul.appendChild(p);
						}
						const li = gen_memobox(memo);
						ul.appendChild(li);
					}
				}
			}
		});
	};
	for (const btn_hashtag of btns_hashtag) {
		btn_hashtag.addEventListener("click", fn_btn_hashtag, false);
	}
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

const gen_memobox = (memo) => {
    const box = document.createElement("li");
	if (memo.is_done) {
        box.setAttribute("class", "done-memo");
	}
	box.innerHTML = memo.body;
	box.setAttribute("id", `${MEMO_ID_PREFIX}${memo.id}`);
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
            td.style.background = "rgba(238, 238, 238, 0.9)";
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
            load_memos(date - 1);
        }
    };
    btn_prev_d.addEventListener("click", fn_btn_prev_d, false);

    const btn_next_d = document.querySelector(".btn-next-date");
    const fn_btn_next_d = (e) => {
        const date = parseInt(document.getElementById("cal-date").innerText);
        if (document.getElementById(`c${date + 1}`) !== null) {
            load_memos(date + 1);
        }
    };
    btn_next_d.addEventListener("click", fn_btn_next_d, false);

	const btn_prev_t = document.querySelector(".btn-prev-tag");
	const fn_btn_prev_t = (e) => {
		const date = parseInt(document.getElementById("cal-date").innerText);
		load_memos(date);
		document.querySelector("#memo-form").style.display = "block";
		document.querySelector("#tb-hashtag").style.display = "none";
		document.querySelector("#tb-normal").style.display = "block";
		document.querySelector("ul").removeAttribute("class", "on-tags");
	};
    btn_prev_t.addEventListener("click", fn_btn_prev_t, false);

    const btns_close = document.querySelectorAll(".modal-close");
    const fn_btn_close = (e) => {
        document.querySelector(".modal").style.display = "none";
		document.querySelector("#memo-form").style.display = "block";
        document.querySelector("#tb-hashtag").style.display = "none";
    };
    for (const btn_close of btns_close) {
        btn_close.addEventListener("click", fn_btn_close, false);
    }

    const btn_save = document.querySelector(".btn-save");
    const fn_btn_save = (e) => {
		save_memo();
    };
    btn_save.addEventListener("click", fn_btn_save, false);
});

