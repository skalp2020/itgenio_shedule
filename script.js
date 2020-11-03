var url = location.href;
var hostname = location.hostname;

var session_id = '';
var login_token = localStorage.getItem('Meteor.loginToken');
var user_id = localStorage.getItem('Meteor.userId');
var user_balanse = 0;
var socket1;
var lessons_list = [];
var lessons_list_pay = [];
var skills_list = {};
var students_list = {};
var operation = '';
var pay_base = 0;
var max_slots = 0;
var tz = 0;
var week_start = 0;
var week_end = 0;
var week_end_pay = 0;
var cost_additional = 0;
var option_show_count = true;
var option_show_language = false;
var option_show_subject = true;
var option_show_skill = true;
var option_show_cost = false;
var option_show_month = false;
var option_show_smiles = false;
var option_currency_id = true;
var option_currency_mark = '$';
var option_currency_rate = 1;
var option_currency_profile_id = true;
var option_currency_profile_mark = '$';
var option_currency_profile_rate = 1;
var option_date_pay = 5;
var skills_data = { "default": "images/default.png" };
var coefs_data = { "default": "1" };
var skills_resource = 'https://itgenio.div42.ru/';
var balanse_history_was = false;
var balanse_history = null;

var lesson_id = '';

const MONTH = {
    0: 'январь',
    1: 'февраль',
    2: 'март',
    3: 'апрель',
    4: 'май',
    5: 'июнь',
    6: 'июль',
    7: 'август',
    8: 'сентябрь',
    9: 'октябрь',
    10: 'ноябрь',
    11: 'декабрь'
}
const DOW = {
    0: "воскресенье",
    1: "понедельник",
    2: "вторник",
    3: "среда",
    4: "четверг",
    5: "пятница",
    6: "суббота"
}

main_timer = setInterval(function() {
    if (url != location.href) {
        url = location.href;
        hostname = location.hostname;
        if (url.indexOf("portal.itgen.io/schedule") >= 0) {
            waitToLoadShedule();
        }
        if (url.indexOf("portal.itgen.io/lesson") >= 0) {
            waitToLoadLesson();
        }
        if (url.indexOf("portal.itgen.io/createSchedule") >= 0) {
            startLoadSheduleAdmin();
        }
        if (url.indexOf("/favoriteTrainers") >= 0) {
            waitToLoadFavoriteTrainers();
        }
    }
}, 1000);
if (url.indexOf("portal.itgen.io/schedule") >= 0) {
    waitToLoadShedule();
}
if (url.indexOf("portal.itgen.io/lesson") >= 0) {
    waitToLoadLesson();
}
if (url.indexOf("/createSchedule") >= 0) {
    startLoadSheduleAdmin();
}
if (url.indexOf("/favoriteTrainers") >= 0) {
    waitToLoadFavoriteTrainers();
}
var second_timer;
var favorite_timer;

function waitToLoadShedule() {
    if (!second_timer) second_timer = setInterval(function() {
        if (document.querySelectorAll('.trainer-schedule-lesson-container .list-group-item').length) {
            clearInterval(second_timer);
            second_timer = null;
            startLoadShedule();
        }
    }, 1000);
}
/*var emoji_timer = setInterval(function() {
    if (option_show_smiles) addEmojiButton()
}, 100);;*/

function waitToLoadLesson() {
    if (!second_timer) second_timer = setInterval(function() {
        if (document.querySelectorAll('.trainer-lesson-list-item').length) {
            clearInterval(second_timer);
            second_timer = null;
            startLoadLesson();
        }
    }, 100);
}

function startLoadShedule() {
    if (socket1) {
        socket1.close();
        socket1 = null;
    }
    socket1 = new WebSocket("wss://" + hostname + "/sockjs/" + (Math.floor(Math.random() * 800) + 101) + "/" + makeid(8) + "/websocket");
    socket1.onopen = function(e) {
        //getWeekNumber();
        socket1.send('["{\\"msg\\":\\"connect\\",\\"version\\":\\"1\\",\\"support\\":[\\"1\\",\\"pre2\\",\\"pre1\\"]}"]');
    };
    socket1.onmessage = function(event) {
        if (event.data[0] == 'a') {
            let request = JSON.parse(JSON.parse(event.data.substr(1))[0]);
            if (request.msg == 'connected') {
                //Подключились
                session_id = request.session;
                //Отправляем запрос на обновление данных пользователя
                operation = 'login';
                loginResume();
            } else if (request.msg == 'added') {
                //Получили данные пользователя
                if (request.collection == 'users' && operation == 'login') {
                    //console.log(request);
                    user_id = request.id;
                    if (request.fields.payBase) pay_base = request.fields.payBase;
                    if (request.fields.maxSlots) max_slots = request.fields.maxSlots;
                    tz = moment().tz(request.fields.tz)._offset / 60;
                    //Запрашиваем названия предметов
                    sendRequestSkills();
                } else if (request.collection == 'users' && operation == 'students') {
                    //Получили данные ученика
                    addStudentToList(request.fields, request.id);
                } else if (request.collection == 'schedule' && operation == 'shedule') {
                    //Получили содержимое урока
                    //Добавляем урок в список
                    addLessonToList(request.fields, request.id);
                }
            } else if (request.msg == 'result' && request.id == 5) {
                //Получили предметы
                addSkillsToList(request.result);
                //Запрашиваем расписание
                operation = 'shedule';
                lessons_list = [];
                lessons_list_pay = [];
                week_start = getStartTime();
                week_end_pay = getWeekEndPay();
                cost_additional = 0;
                if (option_show_month) {
                    week_end = week_start + 86400000 * 28;
                    prepareMonth();
                } else {
                    week_end = week_start + 86400000 * 7;
                }
                sendSheduleRequest();
            } if (request.msg == 'result' && request.id == 26) {
                //Получили баланс
                //Рисуем расписание
                user_balanse = (+request.result).toFixed(2);
                drawLessons();
                socket1.close();
                socket1 = null;
            } else if (request.msg == 'ready') {
                if (operation == 'shedule') {
                    //Получили список занятий
                    //Запрашиваем список учеников
                    operation = 'students';
                    sendRequestStudents();
                } else if (operation == 'students') {
                    //Получили список учеников
                    //Запрашиваем баланс
                    operation = 'balanse';
                    sendRequestBalanse();
                    
                }
            } else {}
        }
    };
}
var shedule_admin_timer = null;

function startLoadSheduleAdmin() {
    if (!shedule_admin_timer) {
        shedule_admin_timer = setInterval(function() {
            loadSheduleAdmin();
        }, 100);;
    }
}

function startLoadBalanseHistory() {
    if (socket1) {
        socket1.close();
        socket1 = null;
    }
    socket1 = new WebSocket("wss://" + hostname + "/sockjs/" + (Math.floor(Math.random() * 800) + 101) + "/" + makeid(8) + "/websocket");
    socket1.onopen = function(e) {
        //getWeekNumber();
        socket1.send('["{\\"msg\\":\\"connect\\",\\"version\\":\\"1\\",\\"support\\":[\\"1\\",\\"pre2\\",\\"pre1\\"]}"]');
    };
    socket1.onmessage = function(event) {
        if (event.data[0] == 'a') {
            let request = JSON.parse(JSON.parse(event.data.substr(1))[0]);
            if (request.msg == 'connected') {
                //Подключились
                session_id = request.session;
                //Отправляем запрос на обновление данных пользователя
                operation = 'login';
                loginResume();
            } else if (request.msg == 'added') {
                //Получили данные пользователя
                if (request.collection == 'users' && operation == 'login') {
                    //console.log(request);
                    user_id = request.id;
                    if (request.fields.payBase) pay_base = request.fields.payBase;
                    if (request.fields.maxSlots) max_slots = request.fields.maxSlots;
                    tz = moment().tz(request.fields.tz)._offset / 60;
                    //Запрашиваем историю баланса
                    sendRequestBalanseHistory();
                } 
            } else if (request.msg == 'result' && request.id == 27) {
                balanse_history = 1;
                //Получили историю баланса
                //Рисуем расписание

                balanse_history = request.result;
                socket1.close();
            }
        }
    };
}


chrome.storage.sync.get(['skalp_show_count', 'skalp_show_language', 'skalp_show_subject', 
    'skalp_show_skill', 'skalp_show_cost', 'skalp_show_month', 'skalp_show_smiles', 
    'skalp_currency_id', 'skalp_currency_profile_id', 'skalp_date_pay'], function(items) {
    if (items['skalp_show_count'] != null) option_show_count = items['skalp_show_count'];
    if (items['skalp_show_language'] != null) option_show_language = items['skalp_show_language'];
    if (items['skalp_show_subject'] != null) option_show_subject = items['skalp_show_subject'];
    if (items['skalp_show_skill'] != null) option_show_skill = items['skalp_show_skill'];
    if (items['skalp_show_cost'] != null) option_show_cost = items['skalp_show_cost'];
    if (items['skalp_show_month'] != null) option_show_month = items['skalp_show_month'];
    if (items['skalp_date_pay'] != null) option_date_pay = items['skalp_date_pay'];
    //if (items['skalp_show_smiles'] != null) option_show_smiles = items['skalp_show_smiles'];
    if (items['skalp_currency_id'] != null) {
        option_currency_id = items['skalp_currency_id'];
        if (option_currency_id!='usd') {
            option_currency_mark = option_currency_id.toUpperCase();
        }
    }
    if (items['skalp_currency_profile_id'] != null) {
        option_currency_profile_id = items['skalp_currency_profile_id'];
        if (option_currency_profile_id!='usd') {
            option_currency_profile_mark = option_currency_profile_id.toUpperCase();
        }
    }
});

function loginResume() {
    //socket1.send('["{\\"msg\\":\\"method\\",\\"method\\":\\"login\\",\\"params\\":[{\\"resume\\":\\"uoZmtPhQRA57nNTNR6EfhZK2oupoUV56NfGwhUylao9\\"}],\\"id\\":\\"1\\"}"]');
    socket1.send('["{\\"msg\\":\\"method\\",\\"method\\":\\"login\\",\\"params\\":[{\\"resume\\":\\"' + login_token + '\\"}],\\"id\\":\\"1\\"}"]');
}

function sendRequestLessons() {
    socket1.send('["{\\"msg\\":\\"sub\\",\\"id\\":\\"' + session_id + '\\",\\"name\\":\\"schedule.view\\",\\"params\\":[\\"GThywmCjBHf4oeQxN\\"]}"]');
}

function sendSheduleRequest() {
    socket1.send('["{\\"msg\\":\\"sub\\",\\"id\\":\\"' + session_id + '\\",\\"name\\":\\"schedule.trainerSchedule\\",\\"params\\":[\\"' + getSendId() + '\\"]}"]');
}

function sendRequestSkills() {
    socket1.send('["{\\"msg\\":\\"method\\",\\"method\\":\\"api.skills.getSkills\\",\\"params\\":[{}],\\"id\\":\\"5\\"}"]');
}

function sendRequestBalanse() {
    socket1.send('["{\\"msg\\":\\"method\\",\\"method\\":\\"api.payments.getBalanceForEmployee\\",\\"params\\":[{\\"employeeId\\":\\"' + getSendId() + '\\"}],\\"id\\":\\"26\\"}"]');
}

function sendRequestBalanseHistory() {
    socket1.send('["{\\"msg\\":\\"method\\",\\"method\\":\\"api.payments.getEmployeeBalanceHistory\\",\\"params\\":[{\\"employeeId\\":\\"' + getSendId() + '\\"}],\\"id\\":\\"27\\"}"]');
}

function sendRequestStudents() {
    students_list = {};
    students_id = [];
    for (var i = lessons_list.length - 1; i >= 0; i--) {
        for (var j = lessons_list[i].lesson.c.length - 1; j >= 0; j--) {
            if (students_id.indexOf(lessons_list[i].lesson.c[j].id) == -1) 
                students_id.push(lessons_list[i].lesson.c[j].id);
        }
    }
    let query = '["{\\"msg\\":\\"sub\\",\\"id\\":\\"' + getSendId() + '\\",\\"name\\":\\"users.view\\",\\"params\\":[[\\"' + students_id[0] + '\\"';
    for (var i = 1; i < students_id.length; i++) {
        query += ',\\"' + students_id[i] + '\\"';
    }
    query += ']]}"]';
    socket1.send(query);
}

function addLessonToList(lessons, id) {

    for (let i = 0; i <= lessons.finishedSlots.length; i++) {
        if (lessons.finishedSlots[i]) {
            if (lessons.finishedSlots[i].id==user_id && lessons.finishedSlots[i].st.s >= week_start && lessons.finishedSlots[i].st.s <= week_end) {
                lessons_list.push({
                    lesson: lessons.finishedSlots[i],
                    cost: calcCost(lessons.finishedSlots[i]),
                    id: id
                });
            }
        }
    }
    for (let i = 0; i <= lessons.slots.length; i++) {
        if (lessons.slots[i]) {
            if (lessons.slots[i].id==user_id && lessons.slots[i].st.s >= week_start && lessons.slots[i].st.s <= week_end) {
                lessons_list.push({
                    lesson: lessons.slots[i],
                    cost: calcCost(lessons.slots[i]),
                    id: id
                });
            }
            if (lessons.slots[i].id==user_id && lessons.slots[i].st.e >= week_start && lessons.slots[i].st.e <= week_end_pay) {
                lessons_list_pay.push({
                    lesson: lessons.slots[i],
                    cost: calcCost(lessons.slots[i]),
                    id: id
                });
            }
        }
    }
}

function calcCost(lesson) {
    let ocenki = [0, 0, 0, 0];
    let ocenki_ru = [0, 0, 0, 0];
    let ocenki_en = [0, 0, 0, 0];
    let coef = 1;
    let coef2 = 1;
    let cost = 0;
    let count = 0;
    if (pay_base > 0) {
        for (var i = 0; i < lesson.c.length; i++) {
            if (lesson.c[i].s.indexOf("skipped") == -1) {
                if (lesson.c[i].type >= 1 && lesson.c[i].type <= 3) {
                    coef = 1;
                    if (coefs_data[lesson.c[i].subject]!=undefined) {
                        coef = parseFloat(coefs_data[lesson.c[i].subject]);
                    }
                    coef2 = 1;
                    if (lesson.c[i].lang == 'en') {
                        coef2 = 2;
                    }
                    let coef3 = 1;
                    if (lesson.c[i].type==1 || lesson.c[i].type==2) coef3 = 0.7;
                    
                    cost += pay_base * coef * coef2 * coef3;
                    count++;
                }
            }
        }
        if (count>0) {
            let date = new Date(lesson.st.s);
            let fromDate = new Date();
            let hours = date.getHours() + fromDate.getTimezoneOffset() / 60 + tz;
            if (hours >= 22 || hours < 1) cost += pay_base * 2;
            if (hours > 5 && hours <= 8) cost += pay_base * 2;
            if (hours >= 1 && hours <= 5) cost += pay_base * 4;
            if ((max_slots / 2) * pay_base > cost) cost = (max_slots / 2) * pay_base;
        } else {
            cost = 0;
        }
    }
    return cost;
}

function drawLessons() {
    option_currency_rate = localStorage.getItem('currency.'+option_currency_id);;
    if (!option_currency_rate) option_currency_rate = 1;

    lessons_list.sort(function(a, b) {
        return a.lesson.st.s - b.lesson.st.s;
    });
    for (var i = 0; i < lessons_list.length; i++) {
        addLessonToHtml(lessons_list[i].lesson, lessons_list[i].id, '', lessons_list[i].cost);
    }
    if (option_show_cost && pay_base > 0) {
        drawCost();
    }
}

function addLessonToHtml(lesson, id, className = '', cost = 0) {
    if (lesson.id != getSendId()) return;
    //console.log(id, lesson);
    var id_day1 = Math.round(lesson.w / 86400000);
    var el = null;
    var els = document.querySelectorAll("a.trainer-schedule-lesson-container");
    for (var el_num = els.length - 1; el_num >= 0; el_num--) {
        if (els[el_num].href.indexOf(id) >= 0 && els[el_num].href.slice(els[el_num].href.lastIndexOf('/') + 1) == id_day1) {
            el = els[el_num];
            //break;
        }
    }
    //Создаем урок, если его не было
    if (!el) {
        var date_temp = new Date();
        var id_day2 = Math.floor((lesson.st.s - date_temp.getTimezoneOffset() * 60 * 1000 + tz * 60 * 1000) / 86400000);
        var lesson_container = document.getElementById("shedule_" + id_day2);
        if (lesson_container) {
            el = document.createElement("a");
            el.href = "/lesson/" + id + "/" + id_day1;
            let lesson_time = new Date(lesson.st.s);
            var options = {
                hour: 'numeric',
                minute: 'numeric',
            };
            let lesson_string = lesson_time.toLocaleString("ru", options);
            el.className = "trainer-schedule-lesson-container gena-non-decorated-link";
            el.innerHTML = '<div class="list-group-item"><div><span>' + lesson_string + ', <span class="label label-primary">Будет</span></span></div>';
            lesson_container.appendChild(el);
        }
    }
    if (el) {
        //Заменяем статус урока
        var label = el.querySelectorAll(".label");
        for (var i = label.length - 1; i >= 0; i--) {
			if (Object.keys(lesson).length > 4){
				
				let outer_text = '';
				
				if ('finishedAt' in lesson){
					outer_text += '<span class="label label-success">Завершено</span>';
				}
				if ('cancelled' in lesson) {
					outer_text += '<span class="label label-warning"><span class="glyphicon glyphicon-ban-circle"></span> Отменено</span>';
				}
				if ('blocked' in lesson) {
					outer_text += '<span class="label label-danger"><span class="glyphicon glyphicon-lock"></span> Заблокировано</span>';
				}
				/*
				if ('startedAt' in lesson) {
					outer_text += '<span class="label label-info">Идёт</span>';
				}
				*/
				
				// Если статус отличный от Будет/идёт, то заменяем
				if (outer_text != ''){
					label[i].outerHTML = outer_text;
				}
			}
        }
        var el_child = el.childNodes;
        var div_to_add = null;
        var div = null;
        var div_title = null;
        for (var i = el_child.length - 1; i >= 0; i--) {
            if (el_child[i].className == "list-group-item") {
                div_to_add = el_child[i];
            }
        }
        if (div_to_add != null) {
            var divs = div_to_add.childNodes;
            for (var i = divs.length - 1; i >= 0; i--) {
                if (divs[i].className == "trainer-shedule-students-list") {
                    div = divs[i];
                }
            }
            divs = div_to_add.querySelectorAll('.label');
            if (divs.length > 0) {
                div_title = divs[0];
            }
        }
        if (div_to_add) {
            addLessonToHTML2(div_to_add, div_title, lesson, div, cost);
        }
    }
    
}

function addLessonToHTML2(div_to_add, div_title, lesson, div, cost) {
    //console.log(lesson);
    // console.log(cost);
    if (div_title != null) {
        let ocenki = [0, 0, 0, 0];
        let ocenki_ru = [0, 0, 0, 0];
        let ocenki_en = [0, 0, 0, 0];
        for (var i = 0; i < lesson.c.length; i++) {
            if (lesson.c[i].s.indexOf("skipped") == -1) {
                if (lesson.c[i].type >= 1 && lesson.c[i].type <= 3) {
                    ocenki[lesson.c[i].type]++;
                    ocenki[0]++;
                    if (lesson.c[i].lang == 'ru') {
                        ocenki_ru[lesson.c[i].type]++;
                    }
                    if (lesson.c[i].lang == 'en') {
                        ocenki_en[lesson.c[i].type]++;
                    }
                }
            }
        }
        if (option_show_count) {
            let div2 = document.createElement("span");
            div2.innerHTML = '<span title="Количество учеников: общее [2-часовики | часовики на 1 час | часовики на 2 час]">Уч: ' + ocenki[0] + ' <span class="dop">[ ' + ocenki[3] + ' | ' + ocenki[1] + ' | ' + ocenki[2] + ' ]</span></span>';
            div2.className = "students-count-label";
            div_title.parentElement.appendChild(div2)
        }

        if (option_show_cost && pay_base > 0) {
            let div3 = document.createElement("span");
            div3.innerHTML = '<span title="Стоимость занятия" class="item_to_cost" data-cost="' + (cost*option_currency_rate).toFixed(2) + '">' + (cost*option_currency_rate).toFixed(2) + option_currency_mark + '</span>';
            div3.className = "cost1-label";
            div_title.parentElement.appendChild(div3)
        }
    }
    if (div == null) {
        div = document.createElement("div");
        div.className = "trainer-shedule-students-list";
        div_to_add.style.borderBottom = 'none';
        div_to_add.after(div);
    } else {
        div.innerHTML = '';
    }
    let ul = document.createElement("ul");
    ul.className = "students-list";
    div.appendChild(ul);
    lesson.c.sort(function(a, b) {
        let a1 = (+a.type >= 3) ? 1 : +a.type + 1;
        let b1 = (+b.type >= 3) ? 1 : +b.type + 1;
        return a1 - b1;
    })
    for (var i = 0; i < lesson.c.length; i++) {
        let s = lesson.c[i].id;
        if (!students_list[lesson.c[i].id]) continue;
        let student = students_list[lesson.c[i].id];
        //console.log(student);
        let score = 'usual';
        if (lesson.c[i].type == 3) {
            switch (lesson.c[i].score) {
                case 1.2:
                    score = 'independent';
                    break;
                case 1.8:
                    score = 'usual';
                    break;
                case 2.4:
                    score = 'dependent';
                    break;
                case 3:
                    score = 'capricious';
                    break;
            }
        } else {
            switch (lesson.c[i].score) {
                case 0.8:
                    score = 'independent';
                    break;
                case 1.2:
                    score = 'usual';
                    break;
                case 1.8:
                    score = 'dependent';
                    break;
                case 2.4:
                    score = 'capricious';
                    break;
            }
        }
        let text = '';
        //Длительность
        text += '<span class="duration glyphicon glyphicon-time';
        if (lesson.c[i].type == "1") {
            text += ' half first';
        }
        if (lesson.c[i].type == "2") {
            text += ' half';
        }
        text += '"></span>';
        //Иконка
        if (option_show_skill) {
            text += '<img src="/img/' + score + '.png" alt="" class="skill">';
        }
        //Язык
        if (option_show_language) {
            text += '<span class="student-language" title="Язык: ' + lesson.c[i].lang + '">' + lesson.c[i].lang + '</span>';
        }
        //Предмет
        if (option_show_subject) {
            if (skills_list[lesson.c[i].subject]) {
                let skill = skills_list[lesson.c[i].subject];
                let skill_image = skills_data['default'];
                if (skills_data[lesson.c[i].subject]!=undefined) {
                    skill_image = skills_data[lesson.c[i].subject];
                }
                text += '<span class="student-subject student-subject-' + lesson.c[i].subject + '"><img src="' + skills_resource + skill_image + '" title="' + skills_list[lesson.c[i].subject] + '"></span>';
            }
        }
        //Ученик
        text += '<span class="student-name"><a href="/profile/' + student.id + '" class="title-name">' + student.lastName + ' ' + student.firstName + '</a><a onclick="return false" class="popup_clipboard" title="Скопировать в буфер обмена">&#9997;</a></span>';

        let li = document.createElement("li");
        li.className = 'student student-' + lesson.c[i].s;
        li.innerHTML = text;
        ul.appendChild(li);
    }

    var blocks = document.querySelectorAll('.popup_clipboard');
    for (var i = 0; i < blocks.length; i++) {
        blocks[i].addEventListener('click', studentCopyClipboard);
    }
}

function drawCost() {

    var cost_all = 0;
    var els = document.querySelectorAll(".grid-calendar-item-cell");
    for (var el_num = els.length - 1; el_num >= 0; el_num--) {
        let cost = 0;
        var items2 = els[el_num].querySelectorAll(".item_to_cost");
        for (var i = items2.length - 1; i >= 0; i--) {
            cost += +items2[i].dataset.cost;
        }
        var items3 = els[el_num].querySelectorAll(".panel-heading");
        for (var i = items3.length - 1; i >= 0; i--) {
            let span = document.createElement("span");

            span.innerHTML = cost.toFixed(2) + option_currency_mark;
            span.className = "heading-cost";
            items3[i].appendChild(span)
        }
        cost_all += cost;
    }
    var items = document.querySelectorAll(".schedule-menu");
    for (var i = items.length - 1; i >= 0; i--) {
        let span = document.createElement("a");
        let prefix = 'За неделю: ';
        if (option_show_month) {
            prefix = 'За 28 дней: ';
        }
        span.innerHTML = prefix + cost_all.toFixed(2) + option_currency_mark + ' <span class="heading-main-cost-icon"></span>';
        span.className = "heading-main-cost";
        span.href = "javascript:";
        span.addEventListener('click', function(){
            let active = this.classList.contains("active");
            let elems = document.querySelectorAll('.heading-main-cost-more,.heading-main-cost-icon');
            for (let elem of elems) {
                elem.classList.toggle('active');
            }

            this.classList.toggle('active');
        });
        items[i].appendChild(span)


        let sum_lessons = 0;
        for (let lesson of lessons_list_pay) {
            sum_lessons += lesson.cost;
        }
        
        let span_more = document.createElement("div");
        span_more.className = "heading-main-cost-more";
        span_more.innerHTML = '';
        span_more.innerHTML += '<div class="cost-item"><span class="option">Текущий баланс:</span> <span class="value">' + (user_balanse*option_currency_rate).toFixed(2) + option_currency_mark + '</span></div>';
        span_more.innerHTML += '<div class="cost-item"><span class="option">Осталось до зарплаты:</span> ' + lessons_list_pay.length + ' урока(ов) <span class="value">+' + (sum_lessons*option_currency_rate).toFixed(2) + option_currency_mark + '</span></div>';
        span_more.innerHTML += '<div class="cost-item"><span class="option">Предполагаемый размер зарплаты:</span> <span class="value">' + ((parseFloat(user_balanse)+parseFloat(sum_lessons))*option_currency_rate).toFixed(2) + option_currency_mark + '</span><div>';
        items[i].appendChild(span_more)
    }
}

function addSkillsToList(skills) {
    skills_list = {};
    for (let key in skills) {
        skills_list[skills[key].ru.skillId] = skills[key].ru.title;
    }
}

function addStudentToList(student, id) {
    students_list[id] = {
        id: id,
        lastName: student.lastName,
        firstName: student.firstName,
        duration: student.duration,
        all: student
    };
}

function makeid(length) {
    var result = '';
    var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function getStartTime() {
    var dayLength = 24 * 60 * 60 * 1000;
    var fromDate = new Date();
    var currentDate;
    if (location.href.indexOf("t=") == -1) {
        currentDate = +new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    } else {
        currentDate = location.href.substr(location.href.indexOf("t=") + 2) * 1;
    }
    return currentDate;
}

function getWeekEndPay() {
    let xDate = new Date();
    let year = xDate.getFullYear();
    let month = xDate.getMonth();
    if (xDate.getDate()>option_date_pay || (xDate.getDate()==option_date_pay && xDate.getHours()>12)) {
        month++;
    }
    if (month>12) {
        month = 1;
        year++;
    }
    return +new Date(year, month, option_date_pay, 12);
}


function prepareMonth() {
    //Удаляем старое расписание
    var els = document.querySelectorAll(".grid-calendar-month");
    for (var el_num = els.length - 1; el_num >= 0; el_num--) {
        els[el_num].parentNode.removeChild(els[el_num]);
    }
    //Создаем новое расписание
    var calendar_tables = document.querySelectorAll(".grid-calendar-table");
    if (!calendar_tables) return;
    var calendar_table = calendar_tables[0];
    var dayLength = 24 * 60 * 60 * 1000;
    var workDateNum = week_start + dayLength * 7;
    var date_temp = new Date();
    var options = {
        month: 'numeric',
        day: 'numeric'
    };
    var days_of_week = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
    for (var k = 0; k < 3; k++) {
        let grid_calendar = document.createElement("div");
        grid_calendar.className = 'grid-calendar grid-calendar-month';
        calendar_table.appendChild(grid_calendar);
        for (var m = 0; m < 7; m++) {
            let item_cell = document.createElement("div");
            item_cell.className = 'grid-calendar-item-cell panel panel-default';
            grid_calendar.appendChild(item_cell);
            let panel_heading = document.createElement("div");
            panel_heading.className = 'panel-heading';
            workDate = new Date(workDateNum);
            panel_heading.innerHTML = '<span class="panel-title">' + workDate.toLocaleString("ru", options) + " " + days_of_week[workDate.getDay()] + '</span>';
            item_cell.appendChild(panel_heading);
            workDateNum += dayLength;
            let list_group = document.createElement("div");
            list_group.className = 'list-group';
            list_group.id = "shedule_" + (Math.round(workDateNum / 86400000) - 1);
            item_cell.appendChild(list_group);
        }
    }
}

function getSendId() {
    var send_id = user_id;
    let last = location.href.slice(location.href.lastIndexOf('/') + 1);
    if (last.indexOf("?t=") != -1) {
        last = last.slice(0, last.indexOf("?t="));
    }
    if (last.length > 0 && last.indexOf("schedule") == -1 && last.indexOf("profile") == -1) send_id = last;
    return send_id;
}
studentCopyClipboard = function() {
    // Select the email link anchor text  
    var userLink = this.parentElement.querySelectorAll(".title-name");
    for (var i = userLink.length - 1; i >= 0; i--) {
        window.getSelection().removeAllRanges();
        var range = document.createRange();
        range.selectNode(userLink[i]);
        window.getSelection().addRange(range);
        try {
            var successful = document.execCommand('copy');
        } catch (err) {
            console.log('Oops, unable to copy');
        }
        window.getSelection().removeAllRanges();
    }
}
//ДОПОЛНЕНИЕ ДЛЯ УРОКА
function startLoadLesson() {

    lesson_id = location.href.split("/")[4] + "_" + location.href.split("/")[5];
    var userLink = document.querySelectorAll(".trainer-lesson-list-item .name-block");
    for (var i = userLink.length - 1; i >= 0; i--) {
        el = document.createElement("a");
        el.href = "javascript:";
        el.className = "popup_clipboard";
        el.title = "Скопировать в буфер обмена";
        el.innerHTML = '&#9997;';
        userLink[i].appendChild(el);
        el.addEventListener('click', studentCopyClipboard);
    }

    var users = document.querySelectorAll(".child-list > div > div");
    for (var i = users.length - 1; i >= 0; i--) {
        let user_id = users[i].querySelector('a.title-name').href.split("/").pop();
        let work_id = lesson_id + '_' + user_id;
        let d_storage = localStorage.getItem('st_'+work_id);
        if (d_storage===null) {
            d_storage = {
                state: 'disabled',
                date_end: 0,
                time: 0,
                sec_left: 0
            };
        } else {
            d_storage = JSON.parse(d_storage);
        }
        el = document.createElement("div");
        el.className = "student_timer";
        el.dataset.state = d_storage.state;
        el.dataset.date_end = d_storage.date_end;
        el.dataset.time = d_storage.time;
        el.dataset.sec_left = d_storage.sec_left;
        el.id = work_id;
        let h = '';
        h += '<div class="time_label">00:00</div>';
        h += '<div class="time_input" title="Время для таймера в минутах"><input type="number" value="10" /></div>';
        // h += '<div class="time_buttons">';
        // h += '<button>&#10004;</button>';
        // h += '<button>&#9658;</button>';
        // h += '<button>&#10074;&#10074;</button>';
        // h += '<button>&#9724;</button>';
        // h += '<button>&#10006;</button>';
        // h += '</div>';
        el.innerHTML = h;

        let time_buttons = document.createElement("div");
        time_buttons.className = 'time_buttons';
        el.appendChild(time_buttons);

        let btn_play = document.createElement("button");
        btn_play.innerHTML = '&#9658;';
        btn_play.addEventListener('click', function(){
            
            let d = new Date();
            if (this.parentNode.parentNode.dataset.state=='paused') {
                d.setSeconds(d.getSeconds()+parseInt(this.parentNode.parentNode.dataset.sec_left));
            } else {
                let inp = parseInt(this.parentNode.parentNode.querySelector('.time_input input').value);
                if (isNaN(inp) || inp<1) inp=10;
                if (inp>60) inp = 60;
                d.setMinutes(d.getMinutes()+inp);
            }
            
            this.parentNode.parentNode.dataset.time = d;
            this.parentNode.parentNode.dataset.state = 'enabled';
            timerStudentTimer();
        });
        btn_play.className='btn_play';
        time_buttons.appendChild(btn_play);

        let btn_pause = document.createElement("button");
        btn_pause.innerHTML = '&#10074;&#10074;';
        btn_pause.addEventListener('click', function(){
            this.parentNode.parentNode.dataset.state = 'paused';
            let d = new Date();
            let d2 = new Date(this.parentNode.parentNode.dataset.time);
            let r = d2 - d;
            if (r<0) r = 0; else r = r / 1000;
            this.parentNode.parentNode.dataset.sec_left = r;
            timerStudentTimer();
        });
        btn_pause.className='btn_pause';
        time_buttons.appendChild(btn_pause);

        let btn_stop = document.createElement("button");
        btn_stop.innerHTML = '&#9724;';
        btn_stop.addEventListener('click', function(){
            this.parentNode.parentNode.dataset.state = 'disabled';
            timerStudentTimer();
        });
        btn_stop.className='btn_stop';
        time_buttons.appendChild(btn_stop);

        users[i].appendChild(el);
    }

    timerStudentTimer();
    setInterval(timerStudentTimer, 1000);
}

function timerStudentTimer(){
    var timers = document.querySelectorAll(".student_timer");
    for (var i = timers.length - 1; i >= 0; i--) {
        let state = timers[i].dataset.state;
        let time_label = timers[i].querySelector('.time_label');
        let time_input = timers[i].querySelector('.time_input');
        let btn_play = timers[i].querySelector('.btn_play');
        let btn_pause = timers[i].querySelector('.btn_pause');
        let btn_stop = timers[i].querySelector('.btn_stop');
        switch (state) {
            case 'disabled':
                timers[i].classList.remove('active');
                timers[i].parentNode.classList.remove('student_timer_over');
                time_label.classList.remove('active');
                time_input.classList.add('active');
                btn_play.disabled = false;
                btn_pause.disabled = true;
                btn_stop.disabled = true;
                break;
            case 'enabled':
                timers[i].classList.add('active');
                let d = new Date();
                let d2 = new Date(timers[i].dataset.time);
                let diff = Math.round((d2-d)/1000);
                // if (diff<0) {
                //     diff=0;
                // }
                if (diff<=0) {
                    timers[i].parentNode.classList.add('student_timer_over');
                }
                let znak = '';
                if (diff<0) {
                    znak = '-';
                    diff = -diff;
                }
                time_label.innerHTML = znak + Math.floor(diff/60)+':'+((diff%60<10)?"0":"")+(diff%60);
                time_label.classList.add('active');
                time_input.classList.remove('active');
                btn_play.disabled = true;
                btn_pause.disabled = false;
                btn_stop.disabled = false;
                break;
            case 'paused':
                timers[i].classList.add('active');
                let diff_ = parseInt(timers[i].dataset.sec_left);
                if (diff_<0) {
                    diff_=0;
                }
                if (diff_==0) {
                    timers[i].parentNode.classList.add('student_timer_over');
                }
                time_label.innerHTML = Math.floor(diff_/60)+':'+((diff_%60<10)?"0":"")+(diff_%60);
                time_label.classList.add('active');
                time_input.classList.remove('active');
                btn_play.disabled = false;
                btn_pause.disabled = true;
                btn_stop.disabled = false;
                break;
        }
        if (state == 'disabled'){
            localStorage.removeItem('st_'+timers[i].id);
        } else {
            let res = {
                state: state,
                date_end: timers[i].dataset.date_end,
                time: timers[i].dataset.time,
                sec_left: timers[i].dataset.sec_left
            }
            localStorage.setItem('st_'+timers[i].id, JSON.stringify(res));
        }

        let slot_right = timers[i].parentNode.querySelector('.slot-right');
        timers[i].style.right = (slot_right.offsetWidth+17)+'px';
    }
}

function addEmojiButton() {
    var emojyContainer = document.querySelector(".form-inline.chat-message");
    var emojyLink = document.querySelector(".form-inline.chat-message .MuiIconButton-emoji");
    if (emojyContainer && !emojyLink) {
        el = document.createElement("button");
        el.className = "MuiButtonBase-root MuiIconButton-root MuiIconButton-emoji";
        el.type = 'button';
        el.innerHTML = '<span class="MuiIconButton-label">&#9786;</span><span class="MuiTouchRipple-root"></span>';
        emojyContainer.insertBefore(el, emojyContainer.children[1]);
        el.addEventListener('click', emojiShowWindow);
        var emojyPopupContainer = document.querySelector(".popup-emoji");
        if (!emojyPopupContainer) {
            emojyPopupContainer = document.createElement("div");
            emojyPopupContainer.className = "popup-emoji";
            //var text = '';
            var emojiCodes = [];
            for (var i = 128512; i <= 128580; i++) {
                emojiCodes.push("&#" + i + ";");
            }
            for (var i = 129296; i <= 129327; i++) {
                emojiCodes.push("&#" + i + ";");
            }
            emojiCodes.push("&#129488;");
            for (var i = 0; i < emojiCodes.length; i++) {
                let emoji = document.createElement("span");
                emoji.className = 'emoji-button';
                emoji.addEventListener('click', emojiInsertToChat);
                emoji.innerHTML = emojiCodes[i];
                emojyPopupContainer.appendChild(emoji);
            }
            //emojyPopupContainer.innerHTML = text;
            emojyContainer.parentElement.insertBefore(emojyPopupContainer, emojyContainer);
        }
    }
}

function emojiInsertToChat() {
    var emojyContainer = document.querySelector(".MuiInputBase-input.MuiInput-input.MuiInputBase-inputMultiline.MuiInput-inputMultiline.MuiInputBase-inputHiddenLabel");
    emojyContainer.focus();
    document.execCommand("insertHTML", !1, this.innerHTML);
}
var simulateKeyPress = function(type, keyCodeArg, element) {
    var evt = document.createEvent('HTMLEvents');
    evt.initEvent(type, true, false);
    evt.keyCode = keyCodeArg;
    evt.which = keyCodeArg;
    element.dispatchEvent(evt);
}

function emojiShowWindow() {
    var emojyContainer = document.querySelector(".popup-emoji");
    if (emojyContainer) {
        if (emojyContainer.classList.contains('active')) {
            emojyContainer.style.display = 'none';
            emojyContainer.className = 'popup-emoji';
        } else {
            emojyContainer.style.display = 'block';
            emojyContainer.className = 'popup-emoji active';
        }
    }
}
//ДЛЯ АДМИНОВ
function loadSheduleAdmin() {
    var els = document.querySelectorAll(".groups-gr-item:not(.worked)");
    if (els.length > 0) {
        elementsToSendRequest = [];
        for (var i = 0; i < els.length; i++) {
            let btn_show = document.createElement("a");
            btn_show.className = 'btn_show_shedule btn_' + els[i].dataset.scheduleId + "_" +  Math.round(els[i].dataset.week/100000) + "_" +  Math.round(els[i].dataset.start/100000);
            btn_show.addEventListener('click', loadSheduleOne);
            btn_show.href = "javascript:";
            btn_show.innerHTML = '&#9660;';
            btn_show.title = "Показать список учеников";
            btn_show.dataset.id = els[i].dataset.scheduleId;
            btn_show.dataset.week = els[i].dataset.week;
            btn_show.dataset.start = els[i].dataset.start;
            els[i].parentElement.insertBefore(btn_show, els[i].nextSibling);
            els[i].className += " worked";
        }
    }
}
var shedule_one_id = 0;
var shedule_one_week = 0;
var shedule_one_start = 0;
var shedule_one_class = "";

function loadSheduleOne() {
    shedule_one_id = this.dataset.id;
    shedule_one_week = this.dataset.week;
    shedule_one_start = this.dataset.start;
    shedule_one_class = shedule_one_id + "_" + Math.round(shedule_one_week/100000) + "_" + Math.round(shedule_one_start/100000);
    week_start = this.dataset.start;
    week_end = week_start;
    var el = document.querySelector(".block_" + shedule_one_class);
    var el_after = document.querySelector(".btn_" + shedule_one_class);
    if (el_after) {
        if (!el) {
            el = document.createElement("div");
            el.className = "block_"+shedule_one_class;
            el.innerHTML = "грузим...";
            el_after.parentElement.insertBefore(el, el_after.nextSibling);
            startRequestsSheduleAdmin();

            this.innerHTML = '&#9650;';
            this.dataset.collapsed = '0';
        } else {
            if (this.dataset.collapsed=='1') {
                el.style.display = 'block';
                this.innerHTML = '&#9650;'
                this.dataset.collapsed = '0';
            } else {
                el.style.display = 'none';
                this.innerHTML = '&#9660;'
                this.dataset.collapsed = '1';
            }
        }
    }
}

function sendSheduleAdminRequest() {
    socket1.send('["{\\"msg\\":\\"sub\\",\\"id\\":\\"' + session_id + '\\",\\"name\\":\\"schedule.view\\",\\"params\\":[\\"' + shedule_one_id + '\\"]}"]');
}



function startRequestsSheduleAdmin() {
    if (socket1) {
        socket1.close();
        socket1 = null;
    }
    socket1 = new WebSocket("wss://" + hostname + "/sockjs/" + (Math.floor(Math.random() * 800) + 101) + "/" + makeid(8) + "/websocket");
    socket1.onopen = function(e) {
        //getWeekNumber();
        socket1.send('["{\\"msg\\":\\"connect\\",\\"version\\":\\"1\\",\\"support\\":[\\"1\\",\\"pre2\\",\\"pre1\\"]}"]');
    };
    socket1.onmessage = function(event) {
        if (event.data[0] == 'a') {
            let request = JSON.parse(JSON.parse(event.data.substr(1))[0]);
            if (request.msg == 'connected') {
                //Подключились
                session_id = request.session;
                //Отправляем запрос на обновление данных пользователя
                operation = 'login';
                loginResume();
            } else if (request.msg == 'added') {
                //Получили данные пользователя
                if (request.collection == 'users' && operation == 'login') {
                    //console.log(request);
                    user_id = request.id;
                    tz = moment().tz(request.fields.tz)._offset / 60;
                    //Запрашиваем названия предметов
                    sendRequestSkills();
                } else if (request.collection == 'users' && operation == 'students_admin') {
                    //Получили данные ученика
                    addStudentToList(request.fields, request.id);
                } else if (request.collection == 'schedule' && operation == 'shedule_admin') {
                    //Получили содержимое урока
                    //Добавляем урок в список
                    addLessonToList(request.fields, request.id);
                    operation = 'students_admin';
                    sendRequestStudents();
                }
            } else if (request.msg == 'result' && request.id == 5) {
                //Получили предметы
                addSkillsToList(request.result);
                //Запрашиваем расписание
                operation = 'shedule_admin';
                lessons_list = [];
                lessons_list_pay = [];
                sendSheduleAdminRequest();
            } else if (request.msg == 'ready' && request.subs == getSendId()) {
                if (operation == 'shedule_admin') {
                    //sendSheduleAdminRequest();
                } else if (operation == 'students_admin') {
                    //Получили список учеников
                    //Рисуем расписание
                    drawLessonsAdmin();
                    //socket1.close();
                    //socket1 = null;
                }
            } else {}
        }
    };
}

function drawLessonsAdmin() {
    option_currency_rate = localStorage.getItem('currency.'+option_currency_id);;
    if (!option_currency_rate) option_currency_rate = 1;

    for (var i = 0; i < lessons_list.length; i++) {
        var div_to_add = document.querySelector(".block_" + shedule_one_class);
        if (div_to_add) {
            div_to_add.innerHTML = '';
            addLessonToHTML2(div_to_add, null, lessons_list[i].lesson, null);
        }
    }
    lessons_list = [];
}


//ЧАТ
var chat_properties = {
}
char_position_timer = setInterval(function() {
    let chatWindow = document.querySelector(".chat-window");
    if (chatWindow) {
        let chatWindowFixedButton = document.querySelector(".chat-window .chat-btn-fixed");
        let chatWindowTitle = document.querySelector(".chat-window .chat-title");
        if (!chatWindowFixedButton && chatWindowTitle) {
            let chatWindowClose = document.querySelector(".chat-window .close");
            chatWindowFixedButton = document.createElement("button");
            chatWindowFixedButton.className = 'chat-btn-fixed';
            chatWindowFixedButton.innerHTML = '>';
            chatWindowTitle.insertBefore(chatWindowFixedButton,chatWindowClose);
            
            chatWindowFixedButton.addEventListener('click', function(){
                let chatWindow = document.querySelector(".chat-window");
                if (chatWindow.classList.contains('chat-window-fixed')) {
                    chatWindow.style.width = chat_properties.width;
                    chatWindow.style.top = chat_properties.top;
                    chatWindow.style.left = chat_properties.left;
                    chatWindow.style.right = chat_properties.right;
                    chatWindow.style.bottom = chat_properties.bottom;
                    this.innerHTML = '>';
                    let boxRight = document.querySelector(".box.box-right");
                    boxRight.style.marginRight = '0px';
                } else {
                    chat_properties.width = chatWindow.style.width;
                    chat_properties.top = chatWindow.style.top;
                    chat_properties.left = chatWindow.style.left;
                    chat_properties.right = chatWindow.style.right;
                    chat_properties.bottom = chatWindow.style.bottom;
                    this.innerHTML = '<';
                }
                chatWindow.classList.toggle("chat-window-fixed");
                this.classList.toggle("btn-chat-fixed-active");
            });
        }
    }
    
    let chatWindowFixed = document.querySelector(".chat-window-fixed");
    if (chatWindowFixed) {
        chatWindowFixed.style.left = (parseInt(document.body.clientWidth)-parseInt(chatWindow.style.width)) + 'px';
        let boxRight = document.querySelector(".box.box-right");
        boxRight.style.marginRight = (parseInt(chatWindow.style.width)) + 'px';
    }
}, 1000);

function checkCurrencies(){
    let lastUpdate = localStorage.getItem('currency.date');
    let lastDateUpdate = false;
    if (lastUpdate) {
        lastDateUpdate = new Date(lastUpdate);
    }
    let now = new Date();

    if (!lastDateUpdate || now-lastDateUpdate>43200000) {
        var xmlhttp = new XMLHttpRequest();
        var url = "https://www.floatrates.com/daily/usd.json";

        xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                let myArr = JSON.parse(this.responseText);
                localStorage.setItem('currency.date', new Date());
                for (let cur in myArr) {
                    localStorage.setItem('currency.'+cur, myArr[cur].rate);
                }
            } 
        };

        xmlhttp.open("GET", url, true);
        xmlhttp.send();
    }

}
checkCurrencies();

function setOptionCurrencyProfileRate(){
    option_currency_profile_rate = localStorage.getItem('currency.'+option_currency_profile_id);
    if (!option_currency_profile_rate) option_currency_profile_rate = 1;
}


all_timer = setInterval(function() {
    checkNewPayments();
    checkPaymentsPanel();
}, 100);

Date.prototype.daysInMonth = function() {
    return 32 - new Date(this.getFullYear(), this.getMonth(), 32).getDate();
};

function checkNewPayments(){
    let elems = document.querySelectorAll("div.payments-employee-balance .form-control-static, .admin-balance-history tr td:nth-child(4),.admin-balance-history tr td:nth-child(5)");
    for (let elem of elems) {
        if (!elem.classList.contains("done")) {
            let sum = parseFloat(elem.innerText);
            if (!isNaN(sum)) {
                setOptionCurrencyProfileRate();
                if (option_currency_profile_id!=true && option_currency_profile_id!='usd') {
                    let sum2 = (sum * option_currency_profile_rate).toFixed(2);
                    let elem2 = document.createElement('span');
                    elem2.innerHTML = ' / '+sum2+option_currency_profile_mark;
                    elem2.className = 'info_additional';
                    elem.appendChild(elem2);
                }
                elem.classList.add("done");
            }
        }
    }
    
}


var getJSON = function(url, params, callback) {

    var xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.responseType = 'json';
    
    xhr.onload = function() {
        var status = xhr.status;
        
        if (status == 200) {
            callback(null, xhr.response);
        } else {
            callback(status);
        }
    };
    
    xhr.send(params);
};

getJSON('https://itgenio.div42.ru/skills.json', '',  function(err, data) {
    if (err != null) {
        console.error(err);
    } else {
        skills_data = data;
    }
});
getJSON('https://itgenio.div42.ru/coefs.json', '',  function(err, data) {
    if (err != null) {
        console.error(err);
    } else {
        coefs_data = data;
    }
});




function waitToLoadFavoriteTrainers() {
    if (!favorite_timer) favorite_timer = setInterval(function() {
        if (document.querySelectorAll('.row-childrens').length) {
            clearInterval(favorite_timer);
            favorite_timer = null;
            startLoadFavoriteTrainers();
        }
    }, 100);
}

function waitToCollapseFavoriteTrainers() {
    if (!favorite_timer) favorite_timer = setInterval(function() {
        if (document.querySelectorAll('.row-childrens').length==0) {
            clearInterval(favorite_timer);
            favorite_timer = null;
            waitToLoadFavoriteTrainers()
        }
    }, 100);
}

//Получаем и сортируем учеников
function startLoadFavoriteTrainers(){
    let els;
    let now = new Date();
    let now_str = now.getFullYear()+'-';
    if (now.getMonth()<9) now_str += '0';
    now_str += (now.getMonth()+1)+'-';
    if (now.getDate()<10) now_str += '0';
    now_str += now.getDate();

    els = document.querySelectorAll(".row-childrens td:nth-child(2) a");
    let users1 = [];
    let ids1 = [];
    for (var el_num = 0; el_num < els.length; el_num++) {
        users1.push( {
            name: els[el_num].innerText.replace(',', ''),
            href: els[el_num].href,
            date: now_str
        });
        let parts = els[el_num].href.split("/");
        ids1.push(parts[parts.length-1])
    }

    els = document.querySelectorAll(".row-childrens td:nth-child(3) a");
    let users2 = [];
    let ids2 = [];
    for (var el_num = 0; el_num < els.length; el_num++) {
        users2.push( {
            name: els[el_num].innerText.replace(',', ''),
            href: els[el_num].href,
            date: now_str
        });
        let parts = els[el_num].href.split("/");
        ids2.push(parts[parts.length-1])
    }
    let params = 'id=' + user_id + '&fav1=' + ids1.join('-') + '&fav2=' + ids2.join('-');

    getJSON('https://itgenio.div42.ru/get_favorites.php', params,  function(err, data) {
        if (err != null) {
            console.error(err);
        } else {
            //console.log(data);
            for (let key in ids1) {
                if (data.fav1[ids1[key]]!==undefined) {
                    users1[key].date = data.fav1[ids1[key]];
                }
            }
            for (let key in ids2) {
                if (data.fav2[ids2[key]]!==undefined) {
                    users2[key].date = data.fav2[ids2[key]];
                }
            }
            users1.sort(function (a, b) {
                return (a.date > b.date)?1:-1;
            });
            users2.sort(function (a, b) {
                return (a.date > b.date)?1:-1;
            });

            let td;
            let text;
            td = document.querySelector(".row-childrens td:nth-child(2)");
            text = '';
            text += '<ol class="users_favorites">';
            for (var i = 0; i < users1.length; i++) {
                let cl = (users1[i].date==now_str)?'today':'';
                text += '<li class="' + cl + '"><a href="' + users1[i].href + '">' + users1[i].name + ' <span>(' + users1[i].date + ')</span></a>';
            }
            text += '</ol>';
            td.innerHTML = text;

            td = document.querySelector(".row-childrens td:nth-child(3)");
            text = '';
            text += '<ol class="users_favorites">';
            for (var i = 0; i < users2.length; i++) {
                let cl = (users2[i].date==now_str)?'today':'';
                text += '<li class="' + cl + '"><a href="' + users2[i].href + '">' + users2[i].name + ' <span>(' + users2[i].date + ')</span></a>';
            }
            text += '</ol>';
            td.innerHTML = text;

            waitToCollapseFavoriteTrainers();
        }
    });
}


//Если нужно, читаем балансы
function checkPaymentsPanel(){
    let elems = document.querySelectorAll(".payments-employee-payment");
    let elems2 = document.querySelectorAll(".payments-employee-payment-history");
    if (elems.length>0 && elems2.length==0) {
        if (!balanse_history_was) {
            balanse_history_was = true;
            startLoadBalanseHistory();
        }
        if (balanse_history) {
            setOptionCurrencyProfileRate();
            el_parent = document.createElement("div");
            el_parent.className = "payments-employee-payment-history";
            document.querySelector("#home").appendChild(el_parent);

            let months = [];
            let dows = [];
            for (let elem of balanse_history) {
                if (elem.val<0) continue;

                let d = null;
                let type = 0;
                if (elem.w!=undefined) {
                    d = new Date(elem.w);
                    type = 0;
                } else {
                    d = new Date(elem.createdAt['$date']);
                    type = 1;
                }
                let date_day = d.getFullYear() + "_" + d.getMonth() + "_" + d.getDate();
                let date_month = d.getFullYear() + "_" + d.getMonth();
                let date_year = d.getFullYear();
                let date_dow = d.getDay();

                if (months[date_month]==undefined) months[date_month] = {title: MONTH[d.getMonth()] + " " + d.getFullYear(), val:0, count: 0, val2 : 0};
                if (type==0) {
                    months[date_month].val += elem.val;
                    months[date_month].count++;

                    if (dows[date_dow]==undefined) dows[date_dow] = {title: DOW[date_dow], val:0, count: 0};
                    dows[date_dow].val += elem.val;
                    dows[date_dow].count++;
                }
                else
                    months[date_month].val2 += elem.val;
                
            }
            let html = '';
            let temp = 0;
            html += '<div class="stat_balanse_history">';

            html += '<div class="stat1">';
            html += '<div class="title_1">Статистика по месяцам</div>';
            html += '<table class="table table-hover">';
            html += '<tr>';
            html += '<th>Месяц</th>';
            html += '<th>Занятий</th>';
            html += '<th>В среднем за занятие</th>';
            html += '<th>За проведение занятий</th>';
            html += '<th>Доп. начисления</th>';
            html += '<th>Итого</th>';
            html += '</tr>';
            for (let elem in months) {
                html += '<tr>';
                html += '<td>' + months[elem].title + '</td>';
                html += '<td>' + months[elem].count + '</td>';
                temp = months[elem].val / months[elem].count;
                html += '<td>' + temp.toFixed(2) + '$';
                if (option_currency_profile_mark!='$') {
                    html += '<span class="info_additional"> / ' +(temp*option_currency_profile_rate).toFixed(2) + option_currency_profile_mark + '</span>';
                }
                html += '</td>'

                html += '<td>' + months[elem].val.toFixed(2) + '$';
                if (option_currency_profile_mark!='$') {
                    html += '<span class="info_additional"> / ' +(months[elem].val*option_currency_profile_rate).toFixed(2) + option_currency_profile_mark + '</span>';
                }
                html += '</td>'

                html += '<td>' + months[elem].val2.toFixed(2) + '$';
                if (option_currency_profile_mark!='$') {
                    html += '<span class="info_additional"> / ' +(months[elem].val2*option_currency_profile_rate).toFixed(2) + option_currency_profile_mark + '</span>';
                }
                html += '</td>'

                temp = months[elem].val + months[elem].val2;
                html += '<td>' + temp.toFixed(2) + '$';
                if (option_currency_profile_mark!='$') {
                    html += '<span class="info_additional"> / ' +(temp*option_currency_profile_rate).toFixed(2) + option_currency_profile_mark + '</span>';
                }
                html += '</td>'

                html += '</tr>';
            }

            html += '</table>';
            html += '</div>';


            html += '<div class="stat2">';
            html += '<div class="title_1">Статистика по дням недели</div>';
            html += '<table class="table table-hover">';
            html += '<tr>';
            html += '<th>День недели</th>';
            html += '<th>Заработано в среднем</th>';
            html += '</tr>';
            for (let elem in dows) {
                html += '<tr>';
                html += '<td>' + dows[elem].title + '</td>';
                temp = dows[elem].val / dows[elem].count;
                html += '<td>' + temp.toFixed(2) + '$';
                if (option_currency_profile_mark!='$') {
                    html += '<span class="info_additional"> / ' +(temp*option_currency_profile_rate).toFixed(2) + option_currency_profile_mark + '</span>';
                }
                html += '</td>'
                html += '</tr>';
            }

            html += '</table>';
            html += '</div>';

            html += '</div>';
            el_parent.innerHTML = html;
        }
    }
}