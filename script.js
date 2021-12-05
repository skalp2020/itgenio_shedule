chrome.storage.sync.get(['skalp_show_count', 'skalp_show_language', 'skalp_show_subject', 
    'skalp_show_skill', 'skalp_show_cost', 'skalp_show_month', 'skalp_show_smiles', 
    'skalp_currency_id', 'skalp_currency_profile_id', 'skalp_date_pay', 'skalp_color_scheme', 
    'skalp_show_student_city', 'skalp_show_student_time', 'skalp_show_student_lasttime', 'skalp_show_button_back',
    'skalp_show_student_skill', 'skalp_mute_sec'], function(items) {
        let options = {};
        if (items['skalp_show_count'] != null) options['option_show_count'] = items['skalp_show_count'];
    if (items['skalp_show_language'] != null) options['option_show_language'] = items['skalp_show_language'];
    if (items['skalp_show_subject'] != null) options['option_show_subject'] = items['skalp_show_subject'];
    if (items['skalp_show_skill'] != null) options['option_show_skill'] = items['skalp_show_skill'];
    if (items['skalp_show_cost'] != null) options['option_show_cost'] = items['skalp_show_cost'];
    if (items['skalp_show_month'] != null) options['option_show_month'] = items['skalp_show_month'];
    if (items['skalp_date_pay'] != null) options['option_date_pay'] = items['skalp_date_pay'];
    if (items['skalp_mute_sec'] != null) options['option_mute_sec'] = items['skalp_mute_sec'];
    //if (items['skalp_show_smiles'] != null) option_show_smiles = items['skalp_show_smiles'];
    if (items['skalp_currency_id'] != null) {
        options['option_currency_id'] = items['skalp_currency_id'];
        if (options['option_currency_id']!='usd') {
            options['option_currency_mark'] = options['option_currency_id'].toUpperCase();
        }
    }
    if (items['skalp_currency_profile_id'] != null) {
        options['option_currency_profile_id'] = items['skalp_currency_profile_id'];
        if (options['option_currency_profile_id']!='usd') {
            options['option_currency_profile_mark'] = options['option_currency_profile_id'].toUpperCase();
        }
    }
    if (items['skalp_show_student_city'] != null) options['option_show_student_city'] = items['skalp_show_student_city'];
    if (items['skalp_show_student_time'] != null) options['option_show_student_time'] = items['skalp_show_student_time'];
    if (items['skalp_show_student_lasttime'] != null) options['option_show_student_lasttime'] = items['skalp_show_student_lasttime'];
    if (items['skalp_show_button_back'] != null) options['option_show_button_back'] = items['skalp_show_button_back'];
    if (items['skalp_show_student_skill'] != null) options['option_show_student_skill'] = items['skalp_show_student_skill'];
    localStorage.setItem("skalp_options", JSON.stringify(options));
});


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

let script_names = [
    "https://itgenio.div42.ru/scripts/countries.js",
    // "https://itgenio.div42.ru/scripts/moment-with-locales.js",
    "https://itgenio.div42.ru/scripts/itgen_script.js"
];
let version = Math.floor(Math.random() * 1000000)+1;
for (let scr of script_names) {
    let script_temp = document.createElement("script");
    script_temp.src = scr + "?ver=" + version;
    script_temp.defer = 'defer';
    document.head.appendChild(script_temp);
}