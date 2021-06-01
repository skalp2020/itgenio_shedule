var url = location.href;
var hostname = location.hostname;

var session_id = '';
var login_token = localStorage.getItem('Meteor.loginToken');
var user_id = localStorage.getItem('Meteor.userId');
var user_balanse = 0;
var socket1;
var lessons_list = [];
var lessons_list_temp = [];
var lessons_list_temp_ids = [];
var lessons_list_loading_id = 0;
var lessons_list_pay = [];
var skills_list = {};
var students_list = {};
var operation = '';
var operation_lesson_id = '';
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
var option_mute_sec = 0;
var option_show_student_city = true;
var option_show_student_time = true;
var option_show_button_back = false;
var option_show_student_skill = false;
var skills_data = { "default": "images/default.png" };
var coefs_data = { "default": "1" };
var skills_resource = 'https://itgenio.div42.ru/';
var balanse_history_was = false;
var balanse_history = null;
var counter_global = Math.floor(Math.random()*800)+101;

var lesson_id = '';
var lesson_info = null;
var is_working = false;
var is_working_tick = 0;

var color_scheme = 'default';
var color_scheme_index = 0;

var students_data = {};
var students_list_ids = [];
var students_skypes = {};

var need_mute = localStorage.getItem('need_mute_student');
if (need_mute===undefined) need_mute=0;
var need_autochat = localStorage.getItem('need_autochat_student');
if (need_autochat===undefined) need_autochat=0;
var autochat_user_id = '';

var weeks_data = [];

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
const MONTH_2 = {
    0: 'января',
    1: 'февраля',
    2: 'марта',
    3: 'апреля',
    4: 'мая',
    5: 'июня',
    6: 'июля',
    7: 'августа',
    8: 'сентября',
    9: 'октября',
    10: 'ноября',
    11: 'декабря'
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

function check_state(){
    //Проверяем нужно ли читать расписание
    let els;

    els = document.querySelectorAll('.trainer-schedule .grid-calendar .grid-calendar-item-cell:not(.loaded)');
    if (!is_working && els.length) {
        els = document.querySelectorAll('.trainer-schedule .grid-calendar .grid-calendar-item-cell:not(.loaded)');
        for (let i = 0; i < els.length; i++) {
            els[i].classList.add("loaded");
        }
        els = document.querySelectorAll('.schedule-menu .heading-counts,.schedule-menu .heading-counts-more, .schedule-menu .heading-main-cost,.schedule-menu .heading-main-cost-more');
        for (let i = els.length-1; i>=0; i--) {
            els[i].remove();
        }
        is_working = true;
        startLoadShedule();
    }
    //Нужно ли загружать урок
    els = document.querySelectorAll('div:not(.loaded) > .trainer-lesson-list-item');
    if (!is_working && els.length) {
        for (let i = 0; i < els.length; i++) {
            els[i].parentNode.classList.add("loaded");
        }
        is_working = true;
        startLoadLesson();
    }
    //Для админов
    if (!is_working) {
        loadSheduleAdmin();
    }
    //Проверка платежей
    if (!is_working) {
        is_working = true;
        checkNewPayments();
    }
    if (!is_working) {
        is_working = true;
        checkPaymentsPanel();
    }
    //Нужно ли грузить список любимых учеников
    els = document.querySelectorAll('.row-childrens:not(.loaded)');
    if (!is_working && els.length) {
        for (let i = 0; i < els.length; i++) {
            els[i].classList.add("loaded");
        }
        is_working = true;
        startLoadFavoriteTrainers();
    }
    //Нужно ли добавить кнопку указания, что у ученика скайп
    if (!is_working) {
        checkStudentSkype();
    }
    //Нужно ли начать контроллировать громкости учеников
    if (!is_working) {
        checkStudentMutes();
    }
    //Нужно ли автоматически переключать чат
    if (!is_working) {
        checkStudentAutoChat();
    }

    setImageLoading();
    setColorScheme();
    setTimeStudents();
    setBackButton();
    setAutoChat();

    setTimeout(check_state, 200);
}
check_state();


function getCounter(){
    return ++counter_global;
}

function startLoadShedule() {
    if (socket1) {
        socket1.close();
        socket1 = null;
    }
    socket1 = new WebSocket("wss://" + hostname + "/sockjs/" + getCounter() + "/" + makeid(8) + "/websocket");
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
                    user_id = request.id;
                    if (request.fields.payBase) pay_base = request.fields.payBase;
                    if (request.fields.maxSlots) max_slots = request.fields.maxSlots;
                    tz = moment().tz(request.fields.tz)._offset / 60;
                    //Запрашиваем названия предметов
                    sendRequestSkills();
                } else if (request.collection == 'users' && operation == 'students') {
                    //Получили данные ученика
                    addStudentToList(request.fields, request.id);
                // } else if (request.collection == 'schedule' && operation == 'shedule') {
                //     //Получили содержимое урока
                //     //Добавляем урок в список
                //     addLessonToList(request.fields, request.id);
                } else if (request.collection == 'schedule' && operation == 'lessons_all') {
                    //Получили содержимое урока
                    //Добавляем урок в список
                    // if (request.id == lessons_list_loading_id) {
                        addLessonToList(request.fields, request.id );
                    // }
                }
                
            } else if (request.msg == 'result' && request.id == 5) {
                //Получили предметы
                addSkillsToList(request.result);
                //Запрашиваем расписание
                operation = 'shedule';
                lessons_list = [];
                lessons_list_temp = [];
                lessons_list_temp_ids = [];
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
                is_working = false;
            } if (request.msg == 'result' && request.id == 28 && operation == 'shedule') {
                //Получили содержимое урока
                //Добавляем урок в список
                addLessonsToList(request.result);
                //Запрашиваем список данных уроков
                operation = 'lessons_all';
                sendRequestLessonsAll();
                //Получили список занятий
                //Запрашиваем список учеников
                // operation = 'students';
                // sendRequestStudents();
            } else if (request.msg == 'ready') {
                if (operation == 'shedule') {
                    
                } else if (operation == 'students') {
                    //Получили список учеников
                    //Запрашиваем баланс
                    operation = 'balanse';
                    sendRequestBalanse();
                    
                } else if (operation == 'lessons_all') {
                    //рссписание
                    sendRequestLessonsAll();
                }
            }
        }
    };
}

function startLoadBalanseHistory() {
    if (socket1) {
        socket1.close();
        socket1 = null;
    }
    socket1 = new WebSocket("wss://" + hostname + "/sockjs/" + getCounter() + "/" + makeid(8) + "/websocket");
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
                is_working = false;
            }
        }
    };
}

function startLoadStudentsInfo() {
    if (socket1) {
        socket1.close();
        socket1 = null;
    }
    socket1 = new WebSocket("wss://" + hostname + "/sockjs/" + getCounter() + "/" + makeid(8) + "/websocket");
    socket1.onopen = function(e) {
        //getWeekNumber();
        socket1.send('["{\\"msg\\":\\"connect\\",\\"version\\":\\"1\\",\\"support\\":[\\"1\\",\\"pre2\\",\\"pre1\\"]}"]');
    };
    socket1.onmessage = function(event) {
        if (event.data[0] == 'a') {
            let request = JSON.parse(JSON.parse(event.data.substr(1))[0]);
            if (request.msg == 'added' && operation == 'students_data') {
                students_data[request.id] = request.fields;
                // socket1.close();
                // is_working = false;
            } else if (request.msg == 'result' && request.id == 5) {
                //Получили предметы
                addSkillsToList(request.result);
                //Запрашиваем данные студентов
                sendRequestStudents2();
            } else if (request.msg == 'ready' && operation == 'students_data') {
                operation = 'students_list';
                sendRequestLessons();
                //Отображаем данные про студентов
                // writeStudentsDataLesson();
            } else if (request.msg == 'added' && operation == 'students_list') {
                operation = '';
                getStudentsInfoOnLesson(request.fields);
                //Отображаем данные про студентов
                writeStudentsDataLesson();
            } else if (request.msg == 'connected') {
                //Подключились
                session_id = request.session;
                //Отправляем запрос на обновление данных пользователя
                operation = 'login';
                loginResume();
            } else if (request.msg == 'added') {
                //Получили данные пользователя
                if (request.collection == 'users' && operation == 'login') {
                    user_id = request.id;
                    if (request.fields.payBase) pay_base = request.fields.payBase;
                    if (request.fields.maxSlots) max_slots = request.fields.maxSlots;
                    tz = moment().tz(request.fields.tz)._offset / 60;
                    // operation = 'students_list';
                    // sendRequestLessons();
                    operation = 'students_data';
                    // Запрашиваем названия предметов
                    sendRequestSkills();
                } 
            } 
        }
    };
}


chrome.storage.sync.get(['skalp_show_count', 'skalp_show_language', 'skalp_show_subject', 
    'skalp_show_skill', 'skalp_show_cost', 'skalp_show_month', 'skalp_show_smiles', 
    'skalp_currency_id', 'skalp_currency_profile_id', 'skalp_date_pay', 'skalp_color_scheme', 
    'skalp_show_student_city', 'skalp_show_student_time', 'skalp_show_button_back',
    'skalp_show_student_skill', 'skalp_mute_sec'], function(items) {
    if (items['skalp_show_count'] != null) option_show_count = items['skalp_show_count'];
    if (items['skalp_show_language'] != null) option_show_language = items['skalp_show_language'];
    if (items['skalp_show_subject'] != null) option_show_subject = items['skalp_show_subject'];
    if (items['skalp_show_skill'] != null) option_show_skill = items['skalp_show_skill'];
    if (items['skalp_show_cost'] != null) option_show_cost = items['skalp_show_cost'];
    if (items['skalp_show_month'] != null) option_show_month = items['skalp_show_month'];
    if (items['skalp_date_pay'] != null) option_date_pay = items['skalp_date_pay'];
    if (items['skalp_mute_sec'] != null) option_mute_sec = items['skalp_mute_sec'];
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
    if (items['skalp_show_student_city'] != null) option_show_student_city = items['skalp_show_student_city'];
    if (items['skalp_show_student_time'] != null) option_show_student_time = items['skalp_show_student_time'];
    if (items['skalp_show_button_back'] != null) option_show_button_back = items['skalp_show_button_back'];
    if (items['skalp_show_student_skill'] != null) option_show_student_skill = items['skalp_show_student_skill'];

});

function loginResume() {
    socket1.send('["{\\"msg\\":\\"method\\",\\"method\\":\\"login\\",\\"params\\":[{\\"resume\\":\\"' + login_token + '\\"}],\\"id\\":\\"1\\"}"]');
}

function sendRequestLessons() {
    socket1.send('["{\\"msg\\":\\"sub\\",\\"id\\":\\"' + getCounter() + '\\",\\"name\\":\\"schedule.view\\",\\"params\\":[\\"' + lesson_id +  '\\"]}"]');
}

function sendSheduleRequest() {
    socket1.send('["{\\"msg\\":\\"method\\",\\"method\\":\\"api.schedule.getTrainerLessons\\",\\"params\\":[{\\"trainerId\\":\\"' + getSendId() + '\\"}],\\"id\\":\\"28\\"}"]');
}
function sendRequestLessonsAll() {
    if (lessons_list_temp.length>0) {
        setTimeout(() => {
            let lesson = lessons_list_temp.pop();
            lessons_list_loading_id = lesson.scheduleId;
            operation_lesson_id = lesson.scheduleId
            socket1.send('["{\\"msg\\":\\"sub\\",\\"id\\":\\"' + getCounter() + 
                '\\",\\"name\\":\\"schedule.view\\",\\"params\\":[\\"' + lesson.scheduleId +  '\\"]}"]');                    
        }, 6);
        
    } else {
        operation = 'students';
        sendRequestStudents();
    }
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
    if (!students_id.length) return;
    let query = '["{\\"msg\\":\\"sub\\",\\"id\\":\\"' + getSendId() + '\\",\\"name\\":\\"users.view\\",\\"params\\":[[\\"' + students_id[0] + '\\"';
    for (var i = 1; i < students_id.length; i++) {
        query += ',\\"' + students_id[i] + '\\"';
    }
    query += ']]}"]';
    socket1.send(query);
}

function sendRequestStudents2() {

    let query = '["{\\"msg\\":\\"sub\\",\\"id\\":\\"' + getSendId() + '\\",\\"name\\":\\"users.view\\",\\"params\\":[[\\"' + students_list_ids[0] + '\\"';
    for (var i = 1; i < students_list_ids.length; i++) {
        query += ',\\"' + students_list_ids[i] + '\\"';
    }
    query += ']]}"]';
    socket1.send(query);
}

function addLessonToList(lessons, id) {
    if (lessons_list_temp_ids.indexOf(id)==-1) return;
    // console.log(lessons);

    for (let i = 0; i <= lessons.finishedSlots.length; i++) {
        if (lessons.finishedSlots[i]) {
            if (lessons.finishedSlots[i].st.s >= week_start && lessons.finishedSlots[i].st.s <= week_end) {
                lessons_list.push({
                    lesson: lessons.finishedSlots[i],
                    cost: calcCost(lessons.finishedSlots[i], lessons.lessonFormat),
                    id: id
                });
            }
            for (let nweek = 0; nweek < weeks_data.length; nweek++) {
                if (lessons.finishedSlots[i].st.s>=weeks_data[nweek].dateStart && lessons.finishedSlots[i].st.s<weeks_data[nweek].dateEnd) {
                    weeks_data[nweek].lessons++;
                    let n = 0;
                    for (let t of lessons.finishedSlots[i].c) {
                        if (t.s!="skipped") n++;
                    }
                    weeks_data[nweek].students += n;
                }
            }
        }
    }
    for (let i = 0; i <= lessons.slots.length; i++) {
        if (lessons.slots[i]) {
            if (lessons.slots[i].st.s >= week_start && lessons.slots[i].st.s <= week_end) {
                lessons_list.push({
                    lesson: lessons.slots[i],
                    cost: calcCost(lessons.slots[i], lessons.lessonFormat),
                    id: id
                });
            }
            if (lessons.slots[i].st.e >= week_start && lessons.slots[i].st.e <= week_end_pay) {
                lessons_list_pay.push({
                    lesson: lessons.slots[i],
                    cost: calcCost(lessons.slots[i], lessons.lessonFormat),
                    id: id
                });
            }
            for (let nweek = 0; nweek < weeks_data.length; nweek++) {
                if (lessons.slots[i].st.s>=weeks_data[nweek].dateStart && lessons.slots[i].st.s<weeks_data[nweek].dateEnd) {
                    weeks_data[nweek].lessons++;
                    let n = 0;
                    for (let t of lessons.slots[i].c) {
                        if (t.s!="skipped") n++;
                    }
                    weeks_data[nweek].students += n;
                }
            }
        }
    }

}

function addLessonsToList(lessons) {

    for (lesson of lessons) {
        if (lesson.startTime >= week_start && lesson.startTime <= week_end) {
            lessons_list_temp.push(lesson);
            lessons_list_temp_ids.push(lesson.scheduleId);
        }
    }
}

function addLessonToList2(lesson) {
    if (lesson.fromDate >= week_start && lesson.fromDate <= week_end) {
        lessons_list_temp.push(lesson)
    }
}

function addLessonToListAdmin(lessons, id) {

    for (let i = 0; i <= lessons.slots.length; i++) {
        if (lessons.slots[i]) {
            if (lessons.slots[i].st.s >= week_start && lessons.slots[i].st.s <= week_end) {
                lessons_list.push({
                    lesson: lessons.slots[i],
                    cost: calcCost(lessons.slots[i]),
                    id: id
                });
            }
        }
    }
}

function calcCost(lesson, lessonFormat = 0) {
    let ocenki = [0, 0, 0, 0];
    let ocenki_ru = [0, 0, 0, 0];
    let ocenki_en = [0, 0, 0, 0];
    let coef = 1;
    let coef2 = 1;
    let cost = 0;
    let count = 0;
    if (pay_base > 0) {
        if (lessonFormat==0) {
            for (var i = 0; i < lesson.c.length; i++) {
                if (lesson.c[i].s.indexOf("skipped") == -1) {
                    if (lesson.c[i].type >= 1 && lesson.c[i].type <= 3) {
                        coef = 1;
                        if (coefs_data[lesson.c[i].subject]!=undefined) {
                            coef = parseFloat(coefs_data[lesson.c[i].subject]);
                        }
                        coef2 = 0;
                        if (lesson.c[i].lang != 'ru') {
                            coef2 = 1;
                        }
                        let coef3 = 1;
                        if (lesson.c[i].type==1 || lesson.c[i].type==2) coef3 = 0.7;
                        
                        cost += Math.round((pay_base * coef * coef3 + pay_base * coef2 * coef3)*100)/100;
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
        } else if (lessonFormat==1){
            for (var i = 0; i < lesson.c.length; i++) {
                if (lesson.c[i].s.indexOf("skipped") == -1) {
                    if (lesson.c[i].type >= 1 && lesson.c[i].type <= 3) {
                        coef = 1;
                        if (coefs_data[lesson.c[i].subject]!=undefined) {
                            coef = parseFloat(coefs_data[lesson.c[i].subject]);
                        }
                        coef2 = 1;
                        if (lesson.c[i].lang != 'ru') {
                            coef2 = 2;
                        }
                        let coef3 = 1;
                        if (lesson.c[i].type==1 || lesson.c[i].type==2) coef3 = 0.7;
                        
                        cost += Math.round((pay_base * 2.5 * coef2)*100)/100;
                        count++;
                    }
                }
            }
            if (count>0) {
                let date = new Date(lesson.st.s);
                let fromDate = new Date();
                let hours = date.getHours() + fromDate.getTimezoneOffset() / 60 + tz;
                if (hours >= 22 || hours < 1) cost += pay_base * 1;
                if (hours > 5 && hours <= 8) cost += pay_base * 1;
                if (hours >= 1 && hours <= 5) cost += pay_base * 2;
            } else {
                cost = 0;
            }
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
    var id_day1 = Math.round(lesson.w / 86400000);
    var el = null;
    var els = document.querySelectorAll(".grid-calendar-item-cell a.group-container");
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
            el.className = "group-container gena-non-decorated-link loaded";
            el.classList.add('loaded');
            el.innerHTML = '<div class="list-group-item"><div><span>' + lesson_string + ', <span class="label label-primary">Будет</span></span></div>';
            lesson_container.appendChild(el);
        }
    }
    if (el && !el.classList.contains("loadcomplete")) {
        el.classList.add('loaded');
        el.classList.add('loadcomplete');
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
                div_to_add = el_child[i].parentNode;
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
        //Skype
        if (students_skypes[student.id]==1) {
            text += '<span class="student_skype_in_shedule" title="Звонить на Skype"></span>';
        }
        //Ученик
        text += '<span class="student-name"><a href="/profile/' + student.id + '" class="title-name">' + student.lastName + ' ' + student.firstName + '</a><a onclick="return false" class="popup_clipboard" title="Скопировать в буфер обмена">&#9997;</a></span>';

        //Метки ученика
        // console.log(lesson.c[i]);
        if (lesson.c[i].kind == 'oneTime') {
            text += '<span class="student-schedule-label student-oneTime">разово</span>'
        } 
        if (lesson.c[i].kind == 'workingOff') {
            text += '<span class="student-schedule-label student-workingOff">отработка</span>'
        }
        if (lesson.c[i].kind == 'trial') {
            text += '<span class="student-schedule-label student-trial">пробное</span>'
        }
        if (lesson.c[i].newSubj == true) {
            text += '<span class="student-schedule-label student-newsubj">новое</span>'
        }

        let li = document.createElement("li");
        li.className = 'student student-' + lesson.c[i].s;
        if (lesson.c[i].kind=='oneTime') {
            li.title = "Разово";
        } else
        if (lesson.c[i].kind=='workingOff') {
            li.title = "Отработка";
        }
        
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
    let elemToDelete = document.querySelectorAll(".heading-main-cost");
    if (elemToDelete) {
        for (let elem of elemToDelete) elem.remove();
    }
    elemToDelete = document.querySelectorAll(".heading-main-cost-more");
    if (elemToDelete) {
        for (let elem of elemToDelete) elem.remove();
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


        span = document.createElement("span");
        let count1 = document.querySelectorAll('.grid-calendar-table .group-container').length;
        let count2 = document.querySelectorAll('.students-list .student:not(.student-skipped)').length;
        span.innerHTML = count1 + " занятий (" +  count2 + ' чел/час) <span class="heading-counts-icon"></span>';
        span.className = "heading-counts";
        span.addEventListener('click', function(){
            let active = this.classList.contains("active");
            let elems = document.querySelectorAll('.heading-counts-more,.heading-counts-icon');
            for (let elem of elems) {
                elem.classList.toggle('active');
            }

            this.classList.toggle('active');
        });
        items[i].appendChild(span);

        span_more = document.createElement("div");
        span_more.className = "heading-counts-more";
        let html = '<table class="table-counts-more">';
        html += '<tr><td>Неделя</td><td>Занятий</td><td>Учеников</td></tr>';
        for (let row of weeks_data) {
            if (row.lessons==0) continue;
            let ds = new Date(row.dateStart);
            let de = new Date(row.dateEnd);
            de.setDate(de.getDate()-1);
            let d1 = ds.getDate()<10?'0'+ds.getDate():ds.getDate();
            let m1 = ds.getMonth()<9?'0'+(ds.getMonth()+1):(ds.getMonth()+1);
            let d2 = de.getDate()<10?'0'+de.getDate():de.getDate();
            let m2 = de.getMonth()<9?'0'+(de.getMonth()+1):(de.getMonth()+1);
            html += '<tr>';
            html += '<td>';
            html += d1 + '.' + m1 + ' - ' + d2 + '.' + m2;
            html += '</td>';
            html += '<td>';
            html += row.lessons;
            html += '</td>';
            html += '<td>';
            html += row.students;
            html += '</td>';
            html += '</tr>';
        }
        span_more.innerHTML = html;
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
    if (location.href.indexOf("time=") == -1) {
        currentDate = +new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    } else {
        currentDate = location.href.substr(location.href.indexOf("time=") + 5) * 1;
    }

    weeks_data = [];
    let dt = new Date(currentDate);
    let dt2 = new Date(currentDate);
    let dow = dt.getDay();
    dt.setDate(dt.getDate() - dow + 1 + 28);
    dt2.setDate(dt2.getDate() - dow + 1 + 35)

    for (var i = 0; i < 20; i++) {
        dt.setDate(dt.getDate() - 7)
        dt2.setDate(dt2.getDate() - 7)
        let t = {
            dateStart: +dt,
            dateEnd: +dt2,
            lessons: 0,
            students: 0
        }
        weeks_data.push(t);
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
            item_cell.className = 'grid-calendar-item-cell panel panel-default loaded';
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
    if (last.indexOf("?time=") != -1) {
        last = last.slice(0, last.indexOf("?time="));
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
    students_data = {};
    students_list_ids = [];

    lesson_id = location.href.split("/")[4];
    let lesson_id_date = lesson_id + "_" + location.href.split("/")[5];
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

    var users = document.querySelectorAll(".child-list .trainer-lesson-list-item");
    for (var i = users.length - 1; i >= 0; i--) {
        let user_id = users[i].querySelector('a.title-name').href.split("/").pop();
        students_list_ids.push(user_id);
        let work_id = lesson_id_date + '_' + user_id;
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

        users[i].dataset.user_id = user_id;
        users[i].classList.add('student_'+user_id);
        users[i].appendChild(el);

        // let btn_mute = users[i].querySelector('.videochat-volume .btn-videochat.btn-volume');
        // if (btn_mute) {
        //     btn_mute.addEventListener('click', muteOtherStudents);
        // }
    }

    startLoadStudentsInfo();

    is_working = false;
}

timerStudentTimer();
setInterval(timerStudentTimer, 1000);

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


//ДЛЯ АДМИНОВ
function loadSheduleAdmin() {
    var els = document.querySelectorAll(".group-item > a.link:not(.worked)");
    if (els.length > 0) {
        elementsToSendRequest = [];
        for (var i = 0; i < els.length; i++) {
            let btn_show = document.createElement("div");
            btn_show.className = 'admin_lesson';
            btn_show.innerHTML = 'Список учеников...';
            let elems = els[i].href.split('/');
            btn_show.dataset.lesson = elems[elems.length-2];
            btn_show.dataset.date = elems[elems.length-1];
            btn_show.addEventListener('click', blockStartLoadShedule);
            let lesson_time = els[i].parentElement.parentElement.querySelector(".group-time");
            if (lesson_time) {
                btn_show.dataset.time = lesson_time.innerHTML.replace(':','');
            } else {
                btn_show.dataset.time = '0000';
            }
            els[i].parentElement.after(btn_show);
            els[i].className += " worked";
            
        }
    }

    loadSheduleOne();
}

function blockStartLoadShedule(){
    this.classList.add('needload');
    this.innerHTML = 'Загрузка...';
    this.removeEventListener('click', blockStartLoadShedule);
}

var shedule_one_id = '';
var shedule_one_week = '';

function loadSheduleOne() {
    var els = document.querySelectorAll(".admin_lesson.needload");
    if (!els.length) return;

    var el_main = document.querySelector(".admin_lesson.needload");
    if (!el_main) return;

    el_main.classList.remove('needload');

    shedule_one_id = el_main.dataset.lesson;
    shedule_one_week = el_main.dataset.date;
    shedule_one_class = shedule_one_id + '_' + shedule_one_week + '_' + el_main.dataset.time;
    el_main.classList.add('block_'+shedule_one_class);

    is_working = true;
    startRequestsSheduleAdmin();
}

function sendSheduleAdminRequest() {
    socket1.send('["{\\"msg\\":\\"sub\\",\\"id\\":\\"' + session_id + '\\",\\"name\\":\\"schedule.view\\",\\"params\\":[\\"' + shedule_one_id + '\\"]}"]');
}



function startRequestsSheduleAdmin() {
    if (socket1) {
        socket1.close();
        socket1 = null;
    }
    socket1 = new WebSocket("wss://" + hostname + "/sockjs/" + getCounter() + "/" + makeid(8) + "/websocket");
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
                    week_start = shedule_one_week * 86400000 - 1000;
                    week_end = week_start + 86402000;
                    addLessonToListAdmin(request.fields, request.id);
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
    is_working = false;
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
                let notificationsErrorContainer = document.querySelector(".notifications-error-container");
                if (chatWindow.parentNode.classList.contains('chat-window-fixed')) {
                    chatWindow.style.width = chat_properties.width;
                    chatWindow.style.top = chat_properties.top;
                    chatWindow.style.left = chat_properties.left;
                    chatWindow.style.right = chat_properties.right;
                    chatWindow.style.bottom = chat_properties.bottom;
                    this.innerHTML = '>';
                    let boxRight = document.querySelector(".box.box-right");
                    boxRight.style.marginRight = '0px';
                    if (notificationsErrorContainer) {
                        notificationsErrorContainer.style.right = '10px';
                    }
                } else {
                    chat_properties.width = chatWindow.style.width;
                    chat_properties.top = chatWindow.style.top;
                    chat_properties.left = chatWindow.style.left;
                    chat_properties.right = chatWindow.style.right;
                    chat_properties.bottom = chatWindow.style.bottom;
                    this.innerHTML = '<';
                    if (notificationsErrorContainer) {
                        notificationsErrorContainer.style.right = parseInt(chat_properties.width) + 10 + 'px';
                    }
                }
                chatWindow.parentNode.classList.toggle("chat-window-fixed");
                this.classList.toggle("btn-chat-fixed-active");
            });
        }
    }
    
    let chatWindowFixed = document.querySelector(".chat-window-fixed .chat-window");
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

        var xmlhttp_BYN = new XMLHttpRequest();
        var url_BYN = "https://www.nbrb.by/api/exrates/rates?periodicity=0";

        xmlhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                let myArr = JSON.parse(this.responseText);
                localStorage.setItem('currency.date', new Date());
                for (let cur in myArr) {
                    localStorage.setItem('currency.'+cur, myArr[cur].rate);
                }

                xmlhttp_BYN.open("GET", url_BYN, true);
                xmlhttp_BYN.send();
            } 
        };


        xmlhttp_BYN.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                let myArr = JSON.parse(this.responseText);
                for (let cur in myArr) {
                    if (myArr[cur].Cur_Abbreviation=="USD") {
                        localStorage.setItem('currency.byn', myArr[cur].Cur_OfficialRate);
                    }
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
    
    is_working = false;
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

            is_working = false;
        }
    });
}

//Готовим список недель
function prepareWeeks(){
    weeks_data = [];

    let dt = new Date();
    let dt2 = new Date();
    let dt3 = new Date();
    let dow = dt.getDay();
    dt.setDate(dt.getDate() - dow + 1);
    dt2.setDate(dt2.getDate() - dow + 8);
    dt3.setDate(dt3.getDate() - dow + 7);

    for (var i = 0; i < 1000; i++) {
        let t = {
            dateStart: +dt-86400000,
            dateEnd: +dt2-86400000,
            lessons: 0,
            students: 0,
            title: dt.getDate() + ' ' + MONTH_2[dt.getMonth()] + " - " + dt3.getDate() + ' ' + MONTH_2[dt3.getMonth()] + ' ' + dt3.getFullYear(),
            val:0, 
            count: 0, 
            val2 : 0
        }
        weeks_data.push(t);
        dt.setDate(dt.getDate()-7);
        dt2.setDate(dt2.getDate()-7);
        dt3.setDate(dt3.getDate()-7);
    }
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
            prepareWeeks();
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

                    if (dows[date_dow]==undefined) dows[date_dow] = {title: DOW[date_dow], val:0, count: 0, days: []};
                    dows[date_dow].val += elem.val;
                    if (dows[date_dow].days.indexOf(date_day)==-1) dows[date_dow].days.push(date_day);
                    dows[date_dow].count++;
                }
                else
                    months[date_month].val2 += elem.val;

                for (let nweek = 0; nweek < weeks_data.length; nweek++) {
                    if (d>=weeks_data[nweek].dateStart && d<weeks_data[nweek].dateEnd) {
                        if (type==0) {
                            weeks_data[nweek].val += elem.val;
                            weeks_data[nweek].count++;
                        }
                        else
                            weeks_data[nweek].val2 += elem.val;
                    }
                }
                
            }

            for (var nweek = weeks_data.length-1; nweek >0; nweek--)
                if (weeks_data[nweek].count>0 || weeks_data[nweek].val>0 || weeks_data[nweek].val2>0) break;
            weeks_data.splice(nweek+1);

            let html = '';
            let temp = 0;
            html += '<div class="stat_balanse_history">';

            html += '<div class="stat1">';
            html += '<div class="panel panel-default">';

            html += '<div class="panel-heading">';
            html += '<div class="panel-title">';
            html += '<div class="title_1">Оплата по месяцам</div>';
            html += '</div>';
            html += '</div>';

            html += '<div class="panel-body">';
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

            html += '</div>';
            html += '</div>';



            html += '<div class="stat1">';
            html += '<div class="panel panel-default">';

            html += '<div class="panel-heading">';
            html += '<div class="panel-title">';
            html += '<div class="title_1">Оплата по неделям</div>';
            html += '</div>';
            html += '</div>';

            html += '<div class="panel-body">';
            html += '<table class="table table-hover">';
            html += '<tr>';
            html += '<th>Неделя</th>';
            html += '<th>Занятий</th>';
            html += '<th>В среднем за занятие</th>';
            html += '<th>За проведение занятий</th>';
            html += '<th>Доп. начисления</th>';
            html += '<th>Итого</th>';
            html += '</tr>';
            for (let elem in weeks_data) {
                html += '<tr>';
                html += '<td>' + weeks_data[elem].title + '</td>';
                html += '<td>' + weeks_data[elem].count + '</td>';
                temp = (weeks_data[elem].count>0)? weeks_data[elem].val / weeks_data[elem].count : 0;
                html += '<td>' + temp.toFixed(2) + '$';
                if (option_currency_profile_mark!='$') {
                    html += '<span class="info_additional"> / ' +(temp*option_currency_profile_rate).toFixed(2) + option_currency_profile_mark + '</span>';
                }
                html += '</td>'

                html += '<td>' + weeks_data[elem].val.toFixed(2) + '$';
                if (option_currency_profile_mark!='$') {
                    html += '<span class="info_additional"> / ' +(weeks_data[elem].val*option_currency_profile_rate).toFixed(2) + option_currency_profile_mark + '</span>';
                }
                html += '</td>'

                html += '<td>' + weeks_data[elem].val2.toFixed(2) + '$';
                if (option_currency_profile_mark!='$') {
                    html += '<span class="info_additional"> / ' +(weeks_data[elem].val2*option_currency_profile_rate).toFixed(2) + option_currency_profile_mark + '</span>';
                }
                html += '</td>'

                temp = weeks_data[elem].val + weeks_data[elem].val2;
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
            html += '</div>';



            html += '<div class="stat1">';
            html += '<div class="panel panel-default">';

            html += '<div class="panel-heading">';
            html += '<div class="panel-title">';
            html += '<div class="title_1">Оплата по дням недели</div>';
            html += '</div>';
            html += '</div>';

            html += '<div class="panel-body">';
            html += '<table class="table table-hover">';
            html += '<tr>';
            html += '<th>День недели</th>';
            html += '<th>В среднем за урок</th>';
            html += '<th>В среднем за день</th>';
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

                temp = dows[elem].val / dows[elem].days.length;
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
            html += '</div>';

            html += '</div>';
            el_parent.innerHTML = html;

            var i_to_click = document.querySelectorAll(".stat1 .panel-heading");
            for (let elem of i_to_click) {
                elem.addEventListener('click', function(){
                    this.nextSibling.classList.toggle('active');
                });
            }
        }
    }



    is_working = false;
}

function setImageLoading(){
    if (is_working) {
        is_working_tick++;
        if (is_working_tick>100) {
            is_working = false;
        }
    }
    els = document.querySelectorAll('.top-bar-container .right .image_loading');
    if (els.length && !is_working) {
        for (var el_num = els.length - 1; el_num >= 0; el_num--) {
            els[el_num].remove();
        }       
    }
    if (!els.length && is_working) {
        el = document.createElement("div");
        el.className = 'image_loading lds-dual-ring';
        el_parent = document.querySelector('.top-bar-container .right');
        if (el_parent) {
            el_parent.prepend(el);       
        }
    }
}

function setColorScheme() {
    if (typeof chrome.app.isInstalled!=='undefined') {
        chrome.storage.sync.get(['skalp_color_scheme'], function(items) {
            let t = items['skalp_color_scheme'];
            if (!t || t==color_scheme) return;
            document.getElementsByTagName('body')[0].classList.remove("color_scheme_" + color_scheme);
            document.getElementsByTagName('body')[0].classList.add("color_scheme_" + t);
            color_scheme = t;

            color_scheme_index++;
            let e = document.querySelector("#color_scheme_extension");
            let href = 'https://itgenio.div42.ru/css/' + t + '.css?ver='+color_scheme_index;
            if (!e) {
                e = document.createElement("link");
                e.rel = 'stylesheet';
                e.type = 'text/css';
                e.id = 'color_scheme_extension';
                document.querySelector('head').appendChild(e);    
            }
            e.href = href;
        });
    }
}

function getStudentsInfoOnLesson(fields) {
    let lesson_id = location.href.split("/")[4];
    let lesson_id_date = location.href.split("/")[5] * 86400000;

    for (var i = 0; i < fields.finishedSlots.length; i++) {
        if (fields.finishedSlots[i].w == lesson_id_date) {
            lesson_info = fields.finishedSlots[i];
            break;
        }
    }
    for (var i = 0; i < fields.slots.length; i++) {
        if (fields.slots[i].w == lesson_id_date) {
            lesson_info = fields.slots[i];
            break;
        }
    }
}

function writeStudentsDataLesson() {
    els = document.querySelectorAll('.lesson-body .trainer-lesson-list-item');
    for (let i = 0; i < els.length; i++) {
        let id = els[i].dataset.user_id;
        if (students_data[id]!=undefined) {
            let el_to_add = els[i].querySelector('.about-child');
            let el = null;

            el = els[i].querySelector('.about-child > .student_skype_info');
            if (!el && el_to_add) {
                el = document.createElement("span");
                el.className = 'student_skype_info';
                el.dataset.user_id = id;
                el_to_add.appendChild(el); 
            }

            if (option_show_student_city) {
                el = els[i].querySelector('.about-child > .student_city');
                if (!el && el_to_add) {
                    el = document.createElement("span");
                    el.className = 'student_city';
                    let s = '';
                    if (students_data[id].country) {
                        if (countries[students_data[id].country]) {
                            s += countries[students_data[id].country];
                        } else {
                            s += students_data[id].country;
                        }

                    }
                    if (students_data[id].city) s += ', ' + students_data[id].city;
                    el.innerHTML = s;
                    el_to_add.appendChild(el); 
                }
            }

            if (option_show_student_skill) {
                el = els[i].querySelector('.skill > *:first-child');
                if (el) {
                    let skill_id = 0;
                    for (let key in skills_list) {
                        if (skills_list[key].toLowerCase() == el.innerText.toLowerCase()) {
                            skill_id = key;
                        }
                    }

                    let el_result = els[i].querySelector('.student_skill_level');
                    if (skill_id && !el_result) {
                        let el_to_add2 = els[i].querySelector('.online-status');
                        if (el_to_add2) {
                            let score1 = 'usual';
                            let avg = 4;
                            try {
                                avg = students_data[id].rating[skill_id].avg;
                            }
                            catch (e) {

                            }
                            switch (avg) {
                            case 1:
                                score1 = 'independent';
                                break;
                            case 2:
                                score1 = 'usual';
                                break;
                            case 3:
                                score1 = 'dependent';
                                break;
                            case 4:
                                score1 = 'capricious';
                                break;
                            }
                            el = document.createElement("span");
                            el.className = 'student_skill_level';
                            el.innerHTML = '<img src="/img/' + score1 + '.png" alt="">'
                            el_to_add2.after(el);
                        }
                    }
                }
            }

            if (option_show_student_time) {
                el = els[i].querySelector('.about-child > .student_time');
                if (!el && el_to_add) {
                    el = document.createElement("span");
                    el.className = 'student_time';
                    el.dataset.tz = students_data[id].tz;
                    el_to_add.appendChild(el); 
                }
            }

            el_to_add = els[i].querySelector('.slot-left');
            if (el_to_add) {
                let find = false;
                let student_status = '';
                if (lesson_info && lesson_info.c)
                for (let j = 0; j < lesson_info.c.length; j++) {
                    if (lesson_info.c[j].id == id) {
                        find = true;
                        student_status = lesson_info.c[j].kind;
                        break;
                    }
                }
                if (student_status == 'oneTime') {
                    el = document.createElement('span');
                    el.className = 'label label-onetime';
                    el.innerHTML = 'Разово'
                    el_to_add.appendChild(el);
                }
            }
        }
    }
    updateStudentsSkypesInfo();
}

function loadStudentSkypes(){
    getJSON('https://itgenio.div42.ru/get_student_skypes.php', '',  function(err, data) {
        if (err != null) {
            console.error(err);
        } else {
            students_skypes = data;
            if (!students_skypes) students_skypes = [];
        }
    });

}
loadStudentSkypes();

function checkStudentSkype() {
    let el_user = document.querySelector('.trainer-lesson-list-item.list-group-item.selected');
    if (!el_user) return;
    let user_id = el_user.dataset.user_id;
    let el = document.querySelector('.trainer-lesson-fields.selected-skype');
    if (el.dataset.user_id == user_id) return;
    el.dataset.user_id = user_id;
    let el_to_add = el;
    let el_to_del = el_to_add.querySelector('.student_skype');
    if (el_to_del) {
        el_to_del.remove();
    }
    if (el_to_add) {
        e = document.createElement("span");
        e.dataset.student_id = user_id;
        let value = 0;
        if (students_skypes[user_id]!=undefined) {
            value = students_skypes[user_id];
        }
        e.dataset.value = value;
        e.className = 'student_skype student_skype_'+value;
        e.innerHTML = '';
        e.addEventListener("click", setStudentSkype);
        el_to_add.appendChild(e); 
    }
}

function setStudentSkype(){
    let value = this.dataset.value;
    let id = this.dataset.student_id;
    this.classList.remove('student_skype_'+value);
    if (value==0) {
        value = 1;
    } else {
        value = 0;
    }
    this.dataset.value = value;
    this.classList.add('student_skype_'+value);
    students_skypes[id] = value;

    let params = 'id=' + id + '&value=' + value;
    getJSON('https://itgenio.div42.ru/set_student_skypes.php', params, function(err, data) {});

    updateStudentsSkypesInfo();
}

function updateStudentsSkypesInfo(){
    els = document.querySelectorAll('.lesson-body .trainer-lesson-list-item .about-child > .student_skype_info');
    for (let i = 0; i < els.length; i++) {
        let id = els[i].dataset.user_id;
        if (id && students_skypes[id]==1) {
            els[i].classList.add("active");
        } else {
            els[i].classList.remove("active");
        }
    }
}

//Добавляем возможность мютить
function checkStudentMutes() {
    let button_switch_mute = document.querySelector('.trainer-lesson-actions .label-toggle-mute');
    if (!button_switch_mute) {

        let el_to_add = document.querySelector('.trainer-lesson-actions > div:last-child');
        if (el_to_add) {
            let el;

            el = document.createElement("button");
            el.className = "button-mute-all";
            el.innerHTML = 'Mute all';
            el.addEventListener("click", muteAll);
            el_to_add.prepend(el);    

            el = document.createElement("label");
            el.className = 'label-toggle-mute';
            el.title = 'Автоматически глушить всех учеников кроме активного';
            let s = '';
            s+='<input type="checkbox" ';
            if (need_mute==1) s+= ' checked';
            s+='> <span>AutoMute</span>';
            el.innerHTML = s;
            el.addEventListener("change", switchMute);
            el_to_add.prepend(el);    
        }

    }

    let els = document.querySelectorAll('.trainer-lesson-list-item.list-group-item');
    for (let i = 0; i < els.length; i++) {
        let user_id = els[i].dataset.user_id;
        if (!user_id) continue;
        let el = els[i].querySelector('.btn-videochat.btn-mute:not(.loaded)');
        if (el) {
            el.classList.add("loaded");
            el.dataset.user_id = user_id;
            el.addEventListener("click", muteOtherStudents);
        }

        let el_button = els[i].querySelector('.btn-videochat.btn-volume:not(.loaded)');
        if (el_button) {
            el_button.classList.add("loaded");
            el_button.dataset.user_id = user_id;
        }
    }

    let active_block = document.querySelector('.trainer-lesson-list-item.list-group-item.selected');
    if (active_block) {
        let active_user_id = active_block.dataset.user_id;
        let el_container = document.querySelector('.videochat-window');
        if (el_container) {
            let el_button = el_container.querySelector('.btn-videochat.btn-mute:not(.loaded)');
            if (el_button) {
                el_button.classList.add("loaded");
                el_button.dataset.user_id = active_user_id;
                el_button.addEventListener("click", muteOtherStudents);
            } else {
                el_button = el_container.querySelector('.btn-videochat.btn-mute');
                if (el_button) {
                    el_button.dataset.user_id = active_user_id;
                }
            }
            el_button = el_container.querySelector('.btn-videochat.btn-volume:not(.loaded)');
            if (el_button) {
                el_button.classList.add("loaded");
                el_button.dataset.user_id = active_user_id;
            }
        }
    }
}

//Добавляем возможность автоматически переключать чат на выбранного ученика
function checkStudentAutoChat() {
    let button_switch_autochat = document.querySelector('.trainer-lesson-actions .label-toggle-autochat');
    if (!button_switch_autochat) {

        let el_to_add = document.querySelector('.trainer-lesson-actions > div:last-child');
        if (el_to_add) {
            let el;

            el = document.createElement("label");
            el.className = 'label-toggle-autochat';
            el.title = 'Автоматически переключать чат на выбранного ученика';
            let s = '';
            s+='<input type="checkbox" ';
            if (need_autochat==1) s+= ' checked';
            s+='> <span>AutoChat</span>';
            el.innerHTML = s;
            el.addEventListener("change", switchAutoChat);
            el_to_add.prepend(el);    
        }

    }
}

//Глушить других учеников
function muteOtherStudents(){
    if (need_mute!=1) return;

    let active_user_id = this.dataset.user_id;
    if (!active_user_id) return;

    let active_block = document.querySelector('.trainer-lesson-list-item.list-group-item[data-user_id="' + active_user_id + '"]');
    if (!active_block) return;
    
    let el_active_input = active_block.querySelector('.videochat-volume input[type=hidden]');
    if (!el_active_input) return;
    let active_volume = el_active_input.value;

    let el_active_button = active_block.querySelector('.btn-videochat.btn-mute');
    if (!el_active_button) return;
    let el_active_is_active = !el_active_button.classList.contains('btn-videochat-dark');

    let event = new Event("click", {bubbles : true, cancelable : true})

    let els = document.querySelectorAll('.child-list .videochat-volume');
    for (let i = 0; i < els.length; i++) {
        let el_button = els[i].querySelector('.btn-videochat.btn-volume');
        let el_input = els[i].querySelector('input[type=hidden]');
        let el_user_id = el_button.dataset.user_id;
        if (!el_active_is_active) {
            if (el_user_id!=active_user_id && el_input.value!=0) {
                setTimeout(function(){ el_button.dispatchEvent(event); }, option_mute_sec*1000);
            }
            if (el_user_id==active_user_id && el_input.value==0) {
                el_button.dispatchEvent(event);
            }    
        } else {
            if (el_user_id==active_user_id && el_input.value!=0) {
                setTimeout(function(){ el_button.dispatchEvent(event); }, option_mute_sec*1000);
            } 
        }
        
    }
}

//АвтоЧат
function setAutoChat(){
    if (need_autochat!=1) return;

    let el_active_user = document.querySelector('.trainer-lesson-list-item.list-group-item.selected');
    if (!el_active_user) return;

    let active_user_id = el_active_user.dataset.user_id;
    if (!active_user_id) return;

    if (active_user_id==autochat_user_id) return;

    autochat_user_id = active_user_id;

    let el_btn = el_active_user.querySelector('.chat-button');
    if (!el_btn) return;

    let event = new Event("click", {bubbles : true, cancelable : true});
    el_btn.dispatchEvent(event);
}

function switchMute(){
    let elem = this.querySelector('input[type=checkbox]');
    if (elem) {
        need_mute = (need_mute==1)?0:1;
        if (need_mute==1)
            elem.checked = true;
        else 
            elem.checked = false;
        localStorage.setItem('need_mute_student', need_mute);
        autoChat();
    }
}

function switchAutoChat(){
    let elem = this.querySelector('input[type=checkbox]');
    if (elem) {
        need_autochat = (need_autochat==1)?0:1;
        if (need_autochat==1)
            elem.checked = true;
        else 
            elem.checked = false;
        localStorage.setItem('need_autochat_student', need_autochat);
    }
}

function muteAll() {
    let event = new Event("click", {bubbles : true, cancelable : true})

    let els = document.querySelectorAll('.child-list .videochat-volume');
    for (let i = 0; i < els.length; i++) {
        let el_button = els[i].querySelector('.btn-videochat.btn-volume');
        let el_input = els[i].querySelector('input[type=hidden]');
        let el_user_id = el_button.dataset.user_id;
        if (el_input.value!=0) {
            el_button.dispatchEvent(event);
        }
    }
}

function setTimeStudents() {
    if (!option_show_student_time) return;
    let d = new Date();
    let now = moment(d).format("HH:mm");
    let els = document.querySelectorAll('.about-child > .student_time');
    for (let i = 0; i < els.length; i++) {
        if (els[i].dataset.lasttime != now) {
            let tz = els[i].dataset.tz;
            if (els[i].dataset.tz) {
                els[i].innerHTML = moment(d).tz(tz).format("HH:mm");
                els[i].dataset.lasttime = now;
            }
        }
    }
}

//Добавить кнопку Назад
function setBackButton() {
    if (!option_show_button_back) return;
    let el = document.querySelector('.skalp_button_back');
    if (el) return;
    let el_parent = document.querySelector('.top-bar .left');
    if (!el_parent) return;
    
    el = document.createElement("a");
    el.className = 'skalp_button_back';
    el.innerHTML = '&larr;';
    el_parent.prepend(el);

    el.addEventListener('click', function(){
        history.back();
    });
}