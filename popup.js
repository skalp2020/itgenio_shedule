function getCurrentTabUrl(callback) {
    var queryInfo = {
        active: true,
        currentWindow: true
    };
    chrome.tabs.query(queryInfo, (tabs) => {
        var tab = tabs[0];
        var url = tab.url;
        console.assert(typeof url == 'string', 'tab.url should be a string');
        callback(url);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    getCurrentTabUrl((url) => {
        var btn_save = document.getElementById('btn_save');
        
        btn_save.addEventListener('click', () => {
            saveOptions()
        });

        restoreOptions();
    });
});

// Saves options to localStorage.
function saveOptions() {
	var items_to_save = {};

    var show_count = document.getElementById("show_count");
    items_to_save["skalp_show_count"] = show_count.checked;
    var show_language = document.getElementById("show_language");
    items_to_save["skalp_show_language"] = show_language.checked;
    var show_subject = document.getElementById("show_subject");
    items_to_save["skalp_show_subject"] = show_subject.checked;
    var show_skill = document.getElementById("show_skill");
    items_to_save["skalp_show_skill"] = show_skill.checked;
    var show_cost = document.getElementById("show_cost");
    items_to_save["skalp_show_cost"] = show_cost.checked;
    var show_month = document.getElementById("show_month");
    items_to_save["skalp_show_month"] = show_month.checked;
    // var show_smiles = document.getElementById("show_smiles");
    // items_to_save["skalp_show_smiles"] = show_smiles.checked;
    var currency_id = document.getElementById("currency_id");
    items_to_save["skalp_currency_id"] = currency_id.value;
    var currency_profile_id = document.getElementById("currency_profile_id");
    items_to_save["skalp_currency_profile_id"] = currency_profile_id.value;
    var date_pay = document.getElementById("date_pay");
    items_to_save["skalp_date_pay"] = date_pay.value;
    var mute_sec = document.getElementById("mute_sec");
    items_to_save["skalp_mute_sec"] = mute_sec.value;

    var show_student_city = document.getElementById("show_student_city");
    items_to_save["skalp_show_student_city"] = show_student_city.checked;
    var show_student_time = document.getElementById("show_student_time");
    items_to_save["skalp_show_student_time"] = show_student_time.checked;
    var show_button_back = document.getElementById("show_button_back");
    items_to_save["skalp_show_button_back"] = show_button_back.checked;
    var show_student_skill = document.getElementById("show_student_skill");
    items_to_save["skalp_show_student_skill"] = show_student_skill.checked;

    chrome.storage.sync.set(items_to_save, function() {
    });

    // Update status to let user know options were saved.
    var status = document.getElementById("status");
    status.innerHTML = "Сохранено. Перезагрузите страницу.";
    setTimeout(function() {
        status.innerHTML = "";
    }, 1500);

}
// Restores select box state to saved value from localStorage.
function restoreOptions() {
	var items_loaded = {};

    chrome.storage.sync.get(['skalp_show_count', 'skalp_show_language', 'skalp_show_subject', 
        'skalp_show_skill', 'skalp_show_cost', 'skalp_show_month', 'skalp_show_smiles', 
        'skalp_currency_id', 'skalp_currency_profile_id', 'skalp_date_pay',
        'skalp_color_scheme', 'skalp_show_student_city', 'skalp_show_student_time', 
        'skalp_show_button_back', 'skalp_show_student_skill', 'skalp_mute_sec'], function(items) {
    	let show_count = true;
		if (items['skalp_show_count']!= null) show_count = items['skalp_show_count'];
		var countCheckbox = document.getElementById("show_count");
        countCheckbox.checked = show_count;

    	let show_language = false;
		if (items['skalp_show_language']!= null) show_language = items['skalp_show_language'];
		var languageCheckbox = document.getElementById("show_language");
        languageCheckbox.checked = show_language;

        let show_subject = true;
		if (items['skalp_show_subject']!= null) show_subject = items['skalp_show_subject'];
		var subjectCheckbox = document.getElementById("show_subject");
        subjectCheckbox.checked = show_subject;

        let show_skill = true;
		if (items['skalp_show_skill']!= null) show_skill = items['skalp_show_skill'];
		var skillCheckbox = document.getElementById("show_skill");
        skillCheckbox.checked = show_skill;

        let show_cost = false;
		if (items['skalp_show_cost']!= null) show_cost = items['skalp_show_cost'];
		var costCheckbox = document.getElementById("show_cost");
        costCheckbox.checked = show_cost;

        let show_month = false;
		if (items['skalp_show_month']!= null) show_month = items['skalp_show_month'];
		var monthCheckbox = document.getElementById("show_month");
        monthCheckbox.checked = show_month;

        // show_smiles = true;
        // if (items['skalp_show_smiles']!= null) show_smiles = items['skalp_show_smiles'];
        // var smilesCheckbox = document.getElementById("show_smiles");
        // smilesCheckbox.checked = show_smiles;

        let currency_id = 'usd';
        if (items['skalp_currency_id']!= null) currency_id = items['skalp_currency_id'];
        var currencyCheckbox = document.getElementById("currency_id");
        currencyCheckbox.value = currency_id;

        let currency_profile_id = 'usd';
        if (items['skalp_currency_profile_id']!= null) currency_profile_id = items['skalp_currency_profile_id'];
        var currencyProfileCheckbox = document.getElementById("currency_profile_id");
        currencyProfileCheckbox.value = currency_profile_id;

        let date_pay = '5';
        if (items['skalp_date_pay']!= null) date_pay = items['skalp_date_pay'];
        var datePayInput = document.getElementById("date_pay");
        datePayInput.value = date_pay;

        let mute_sec = '0';
        if (items['skalp_mute_sec']!= null) mute_sec = items['skalp_mute_sec'];
        var muteSecInput = document.getElementById("mute_sec");
        muteSecInput.value = mute_sec;


        let show_student_city = true;
        if (items['skalp_show_student_city']!= null) show_student_city = items['skalp_show_student_city'];
        var studentCityCheckbox = document.getElementById("show_student_city");
        studentCityCheckbox.checked = show_student_city;
        
        let show_student_time = true;
        if (items['skalp_show_student_time']!= null) show_student_time = items['skalp_show_student_time'];
        var studentTimeCheckbox = document.getElementById("show_student_time");
        studentTimeCheckbox.checked = show_student_time;

        let show_button_back = false;
        if (items['skalp_show_button_back']!= null) show_button_back = items['skalp_show_button_back'];
        var studentButtonBackCheckbox = document.getElementById("show_button_back");
        studentButtonBackCheckbox.checked = show_button_back;

        let color_scheme = 'default';
        if (items['skalp_color_scheme']!= null) color_scheme = items['skalp_color_scheme'];
        var colorSchemeInput = document.getElementById("color_scheme_"+color_scheme);
        colorSchemeInput.checked = true;
        var colorSchemeRadios = document.querySelectorAll('input[type=radio][name="color_scheme"]');
        Array.prototype.forEach.call(colorSchemeRadios, function(radio) {
           radio.addEventListener('change', colorSchemeChange);
        });

        let show_student_skill = false;
        if (items['skalp_show_student_skill']!= null) show_student_skill = items['skalp_show_student_skill'];
        var studentSkillCheckbox = document.getElementById("show_student_skill");
        studentSkillCheckbox.checked = show_student_skill;

    });
}

function colorSchemeChange() {
    var items_to_save = {};
    items_to_save["skalp_color_scheme"] = this.value;

    chrome.storage.sync.set(items_to_save, function() {
    });
}