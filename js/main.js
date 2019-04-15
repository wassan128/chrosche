"use strict";

import * as storage from "./libstorage.js";
import * as p_01 from "./p_01.js";

/* constants */
const MEMO_ID_PREFIX = "m_";

/* utils */
Element.prototype.prependChild = function (el) {
    this.insertBefore(el, this.firstChild);
};
const get_ym = () => {
    const year = document.getElementById("cal-year").innerText;
    const month = document.getElementById("cal-month").innerText;
    return [year, month];
};
const get_key = (year, month) => `${year}_${month}`;
const sanitize = (text) => text.replace("<", "&lt;")
    .replace("'", "&quot;")
    .replace(/(#[^\s#]*)/g, "<a href='$1' class='hashtags'>$1</a>");
const get_id = (id_str) => parseInt(id_str.slice(MEMO_ID_PREFIX.length));
const draw_warning_window = (msg) => {
    document.querySelector("#alt-alert-bg").style.top = "0px";
    const win = document.querySelector("#warning-window");
    win.style.top = "65px";
    win.children[1].textContent = msg;
};
const draw_confirm_window = (msg, ok_fn) => {
    document.querySelector("#alt-alert-bg").style.top = "0px";
    const win = document.querySelector("#confirm-window");
    win.style.top = "65px";
    win.children[1].textContent = msg;

    const btn_conf_ok = document.querySelector("#btn-conf-ok");
    const fn_btn_conf_ok = () => {
        ok_fn();
        document.querySelector("#alt-alert-bg").style.top = "-100%";
        document.querySelector("#confirm-window").style.top = "-150px";
        btn_conf_ok.removeEventListener("click", fn_btn_conf_ok);
    };
    btn_conf_ok.addEventListener("click", fn_btn_conf_ok, false);

    const btn_conf_ng = document.querySelector("#btn-conf-ng");
    const fn_btn_conf_ng = () => {
        document.querySelector("#alt-alert-bg").style.top = "-100%";
        document.querySelector("#confirm-window").style.top = "-150px";
        btn_conf_ok.removeEventListener("click", fn_btn_conf_ng);
    };
    btn_conf_ng.addEventListener("click", fn_btn_conf_ng, false);
};

/* functions */
const load_memos = async (d) => {
    const [year, month] = get_ym();
    const ym = get_key(year, month);
    d = String(d).replace(/\s/g, "");

    document.getElementById("cal-date").innerText = d;

    const res = await storage.get_sync_storage(ym);
    const ul = document.querySelector("ul");
    ul.innerHTML = "";
    if (typeof(res[ym]) === "undefined" || typeof(res[ym][d]) === "undefined") {
        return;
    }

    for (const memo of res[ym][d]) {
        const li = gen_memobox(memo);
        ul.prependChild(li);
    }
    onclk_hashtags();
};

const save_memo = async () => {
    const t_box = document.querySelector(".memo-text");
    if (t_box.value === "") {
        draw_warning_window("予定の内容を入力してください");
        return;
    }
    const [year, month] = get_ym();
    const ym = get_key(year, month);

    const ts = moment().unix();
    const body = sanitize(t_box.value);
    const memo = {
        "id": ts,
        body,
        "is_done": false
    };

    const d = document.getElementById("cal-date").innerText.replace(/\s/g, "");
    const res = await storage.get_sync_storage(ym);
    if (typeof(res[ym]) === "undefined") {
        res[ym] = {};
    }
    if (typeof(res[ym][d]) === "undefined") {
        res[ym][d] = [memo];
    } else {
        res[ym][d].push(memo);
    }

    const err = await storage.set_sync_storage(res);
    if (err) {
        draw_warning_window("登録できるメモの上限サイズを超えています。古いメモを削除してください。");
    } else {
        const ul = document.querySelector("ul");
        const li = gen_memobox(memo);
        ul.prependChild(li);

        onclk_hashtags();
        coloring();
        t_box.value = "";
    }
};

const color = [
    "rgba(238, 238, 238, 0.9)",
    "rgba(198, 228, 139, 0.9)",
    "rgba(123, 201, 111, 0.9)",
    "rgba(35, 154, 59, 0.9)",
    "rgba(25, 97, 39, 0.9)"
];
const reset_color = (d) => {
    const td = document.getElementById(`c${d}`);
    td.style.background = color[0];
};
const reset_color_all = () => {
    const tds = document.querySelectorAll(".c-dates");
    for (const td of tds) {
        td.style.background = color[0];
    }
};
const coloring = async () => {
    const [year, month] = get_ym();
    const ym = get_key(year, month);

    const res = await storage.get_sync_storage(ym);
    if (typeof(res[ym]) === "undefined") {
        return;
    }
    for (const d in res[ym]) {
        const len = res[ym][d].length;
        const lv = (len > 4) ? 4 : len;
        if (lv >= 0) {
            document.getElementById(`c${d}`).style.background = color[lv];
            if (lv > 2) {
                document.getElementById(`c${d}`).style.color = "#fff";
            } else {
                document.getElementById(`c${d}`).style.color = "#333";
            }
        }
    }
};

const onclk_td = (e) => {
    const date = e.target.innerText;
    load_memos(date);
    document.querySelector(".modal").style.display = "block";
    document.querySelector(".modal-box").style.display = "block";
    document.querySelector("#tb-normal").style.display = "block";
};

const onclk_done = (done) => {
    const fn_done = async (e) => {
        const li = e.target.parentNode.parentNode;
        const [year, month] = get_ym();
        const ym = get_key(year, month);
        const d = document.getElementById("cal-date").innerText;
        const target = get_id(li.id);

        const res = await storage.get_sync_storage(ym);
        res[ym][d].forEach((memo, idx) => {
            if (memo.id === target) {
                res[ym][d][idx].is_done = !(memo.is_done);
            }
        });

        const err = await storage.set_sync_storage(res);
        if (!err) {
            if (li.getAttribute("class") === "done-memo") {
                li.removeAttribute("class", "done-memo");
            } else {
                li.setAttribute("class", "done-memo");
            }
        }
    };
    done.addEventListener("click", fn_done, false);
};

const onclk_edit = (edit) => {
    const fn_edit = (e) => {
        const li = e.target.parentNode.parentNode;
        const [year, month] = get_ym();
        const ym = get_key(year, month);
        const d = document.getElementById("cal-date").innerText;

        const input = document.createElement("input");
        const target = get_id(li.id);
        input.value = li.innerText;
        input.setAttribute("class", "edit-box");
        li.innerText = "";
        li.appendChild(input);
        input.addEventListener("keyup", async (e) => {
            if (e.keyCode === 13) {
                const after = sanitize(input.value);
                if (after === "") {
                    // TODO: warning dialog
                    return;
                }
                const res = await storage.get_sync_storage(ym);
                res[ym][d].forEach((memo, idx) => {
                    if (memo.id === target) {
                        res[ym][d][idx].body = after;
                    }
                });

                const err = await storage.set_sync_storage(res);
                if (err) {
                    draw_warning_window("登録できるメモの上限サイズを超えています。古いメモを削除してください。");
                } else {
                    li.innerHTML = after;
                    add_acts(li);
                    onclk_hashtags();
                }
            }
        });
    };
    edit.addEventListener("click", fn_edit, false);
};

const onclk_del = (del) => {
    const fn_del = async (e) => {
        const li = e.target.parentNode.parentNode;
        draw_confirm_window(`「${li.innerText}」を削除しますか?`, async () => {
            const [year, month] = get_ym();
            const ym = get_key(year, month);
            const d = document.getElementById("cal-date").innerText;
            const target = get_id(li.id);

            const res = await storage.get_sync_storage(ym);
            res[ym][d] = res[ym][d].filter((x) => x.id !== target);

            if (res[ym][d].length === 0) {
                reset_color(d);
                delete res[ym][d];
            }
            if (Object.keys(res[ym]).length === 0) {
                reset_color_all();
                delete res[ym];
                await storage.remove_sync_storage(ym);
            }

            const err = await storage.set_sync_storage(res);
            if (!err) {
                coloring();
                li.parentNode.removeChild(li);
            }
        });
    };
    del.addEventListener("click", fn_del, false);
};

const onclk_hashtags = () => {
    const btns_hashtag = document.getElementsByClassName("hashtags");
    const fn_btn_hashtag = async (e) => {
        const target = e.target.innerText;
        const ptn = new RegExp(`${target}</a>`);

        const [year, month] = get_ym();
        const ym = get_key(year, month);
        document.getElementById("cal-tag").innerText = `${target} (${month}月)`;
        document.querySelector("#memo-form").style.display = "none";
        document.querySelector("#tb-normal").style.display = "none";
        document.querySelector("#tb-hashtag").style.display = "block";

        const ul = document.querySelector("ul");
        ul.innerHTML = "";
        ul.setAttribute("class", "on-tags");
        let cur = "";

        const res = await storage.get_sync_storage(ym);
        for (const d in res[ym]) {
            for (const memo of res[ym][d]) {
                if (memo.body.match(ptn)) {
                    if (cur !== `${month}${d}`) {
                        cur = `${month}${d}`;

                        const p = document.createElement("p");
                        p.innerText = `${month}/${d}`;
                        p.setAttribute("class", "hash-date");

                        ul.appendChild(p);
                    }
                    const li = gen_memobox(memo, false);
                    ul.appendChild(li);
                }
            }
        }
    };
    for (const btn_hashtag of btns_hashtag) {
        btn_hashtag.onclick = fn_btn_hashtag;
    }
};

const add_acts = (li) => {
    const act = document.createElement("span");
    const a_done = document.createElement("i");
    a_done.setAttribute("title", "済/未");
    a_done.setAttribute("class", "fa fa-check");
    const a_edit = document.createElement("i");
    a_edit.setAttribute("title", "編集");
    a_edit.setAttribute("class", "fa fa-pencil");
    const a_del = document.createElement("i");
    a_del.setAttribute("title", "削除");
    a_del.setAttribute("class", "fa fa-trash-o");

    onclk_done(a_done);
    onclk_edit(a_edit);
    onclk_del(a_del);

    act.append(a_done);
    act.append(a_edit);
    act.append(a_del);
    li.appendChild(act);
};

const gen_memobox = (memo, is_need_acts=true) => {
    const box = document.createElement("li");
    if (memo.is_done) {
        box.setAttribute("class", "done-memo");
    }
    box.innerHTML = memo.body;
    box.setAttribute("id", `${MEMO_ID_PREFIX}${memo.id}`);
    if (is_need_acts) {
        add_acts(box);
    }
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
                td.removeAttribute("class");
                td.innerText = "";
                td.removeEventListener("click", onclk_td, false);
                continue;
            }
            td.innerText = date;
            td.setAttribute("id", `c${date}`);
            td.setAttribute("class", "c-dates");
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

const load_bg = () => {
    chrome.storage.local.get("conf_bg", (res) => {
        const bg = (res["conf_bg"]) ? `url(${res["conf_bg"]})` : "url('image/bg.jpg')";
        document.body.style.backgroundImage = bg;
    });
};
const save_bg = () => {
    const reader = new FileReader();
    const btn_bg = document.querySelector("#btn-bg");
    const fn_btn_bg = (e) => {
        const file = e.target.files[0];
        if (file.type.substr(0, 5) === "image") {
            reader.readAsDataURL(file);
        } else {
            draw_warning_window("画像を指定してください");
        }
    };
    btn_bg.addEventListener("change", fn_btn_bg, false);
    const fn_reader = () => {
        const img = {"conf_bg": reader.result};
        chrome.storage.local.set(img, () => {
            document.body.style.backgroundImage = `url(${img["conf_bg"]})`;
        });
    };
    reader.addEventListener("load", fn_reader, false);
};
const del_bg = () => {
    chrome.storage.local.set({"conf_bg": ""}, () => {
        load_bg();
    });
};

const fire_config = () => {
    load_bg();
    save_bg();
};

document.addEventListener("DOMContentLoaded", async () => {
    await p_01.p_01();

    const cal = new Calendar();
    cal.draw();
    await coloring();

    fire_config();

    const btn_prev_m = document.querySelector(".btn-prev-month");
    const fn_btn_prev_m = () => {
        cal.prev_month();
        cal.draw();
        coloring();
    };
    btn_prev_m.addEventListener("click", fn_btn_prev_m, false);

    const btn_next_m = document.querySelector(".btn-next-month");
    const fn_btn_next_m = () => {
        cal.next_month();
        cal.draw();
        coloring();
    };
    btn_next_m.addEventListener("click", fn_btn_next_m, false);

    const btn_prev_d = document.querySelector(".btn-prev-date");
    const fn_btn_prev_d = () => {
        const date = parseInt(document.getElementById("cal-date").innerText);
        if (document.getElementById(`c${date - 1}`) !== null) {
            load_memos(date - 1);
        }
    };
    btn_prev_d.addEventListener("click", fn_btn_prev_d, false);

    const btn_next_d = document.querySelector(".btn-next-date");
    const fn_btn_next_d = () => {
        const date = parseInt(document.getElementById("cal-date").innerText);
        if (document.getElementById(`c${date + 1}`) !== null) {
            load_memos(date + 1);
        }
    };
    btn_next_d.addEventListener("click", fn_btn_next_d, false);

    const btn_prev_t = document.querySelector(".btn-prev-tag");
    const fn_btn_prev_t = () => {
        const date = parseInt(document.getElementById("cal-date").innerText);
        load_memos(date);
        document.querySelector("#memo-form").style.display = "block";
        document.querySelector("#tb-hashtag").style.display = "none";
        document.querySelector("#tb-normal").style.display = "block";
        document.querySelector("ul").removeAttribute("class", "on-tags");
    };
    btn_prev_t.addEventListener("click", fn_btn_prev_t, false);

    const btns_close = document.querySelectorAll(".modal-close");
    const fn_btn_close = () => {
        document.querySelector(".modal").style.display = "none";
        document.querySelector("#memo-form").style.display = "block";
        document.querySelector("#tb-hashtag").style.display = "none";
    };
    for (const btn_close of btns_close) {
        btn_close.addEventListener("click", fn_btn_close, false);
    }

    const btn_save = document.querySelector(".btn-save");
    const fn_btn_save = () => {
        save_memo();
    };
    btn_save.addEventListener("click", fn_btn_save, false);

    const btn_bg_del = document.querySelector("#btn-bg-del");
    const fn_btn_bg_del = () => {
        draw_confirm_window(`背景画像をデフォルトに戻しますか?`, () => {
            del_bg();
        });
    };
    btn_bg_del.addEventListener("click", fn_btn_bg_del, false);

    const btn_menu_open = document.querySelector("#btn-menu-open");
    const fn_btn_menu_open = () => {
        document.querySelector("#menu").style.right = "0px";
        document.querySelector("#btn-menu-open").style.display = "none";
        document.querySelector("#btn-menu-close").style.display = "block";
    };
    btn_menu_open.addEventListener("click", fn_btn_menu_open, false);

    const btn_menu_close = document.querySelector("#btn-menu-close");
    const fn_btn_menu_close = () => {
        document.querySelector("#menu").style.right = "-300px";
        document.querySelector("#btn-menu-open").style.display = "block";
        document.querySelector("#btn-menu-close").style.display = "none";
    };
    btn_menu_close.addEventListener("click", fn_btn_menu_close, false);

    const btn_warn_ok = document.querySelector("#btn-warn-ok");
    const fn_btn_warn_ok = () => {
        document.querySelector("#alt-alert-bg").style.top = "-100%";
        document.querySelector("#warning-window").style.top = "-150px";
    };
    btn_warn_ok.addEventListener("click", fn_btn_warn_ok, false);

});

