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
        document.getElementById('show_count').addEventListener('click', () => {
            saveOptions();
        });
		document.getElementById('show_language').addEventListener('click', () => {
            saveOptions()
        });
		document.getElementById('show_subject').addEventListener('click', () => {
            saveOptions()
        });
		document.getElementById('show_cost').addEventListener('click', () => {
            saveOptions()
        });
		document.getElementById('show_coef').addEventListener('click', () => {
            saveOptions()
        });
		document.getElementById('show_month').addEventListener('click', () => {
            saveOptions()
        });
		
		
		document.getElementById('currency_id').addEventListener('click', () => {
            saveOptions()
        });
		document.getElementById('currency_profile_id').addEventListener('click', () => {
            saveOptions()
        });
		
		
		
		/*
		// контекстное меню
		document.getElementById('byn').addEventListener('click', () => {
            saveOptions()
        });
		document.getElementById('usd').addEventListener('click', () => {
            saveOptions()
        });
		document.getElementById('eur').addEventListener('click', () => {
            saveOptions()
        });
		document.getElementById('pln').addEventListener('click', () => {
            saveOptions()
        });
		document.getElementById('rub').addEventListener('click', () => {
            saveOptions()
        });
		document.getElementById('uah').addEventListener('click', () => {
            saveOptions()
        });
		
		*/
		
		document.getElementById('form_dare_pay').addEventListener('keyup', () => {
			saveOptions()
        });
		/*
		document.getElementById('btn_save').addEventListener('click', () => {
            saveOptions()
        });
		*/
		//setTimeout(restoreOptions, 150)
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
    var show_coef = document.getElementById("show_coef");
    items_to_save["skalp_show_coef"] = show_coef.checked;
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
        'skalp_show_skill', 'skalp_show_cost', 'skalp_show_coef', 'skalp_show_month', 'skalp_show_smiles', 
        'skalp_currency_id', 'skalp_currency_profile_id', 'skalp_date_pay'], function(items) {
    	show_count = true;
		if (items['skalp_show_count']!= null) show_count = items['skalp_show_count'];
		var countCheckbox = document.getElementById("show_count");
        countCheckbox.checked = show_count;

    	show_language = false;
		if (items['skalp_show_language']!= null) show_language = items['skalp_show_language'];
		var languageCheckbox = document.getElementById("show_language");
        languageCheckbox.checked = show_language;

        show_subject = true;
		if (items['skalp_show_subject']!= null) show_subject = items['skalp_show_subject'];
		var subjectCheckbox = document.getElementById("show_subject");
        subjectCheckbox.checked = show_subject;

        show_skill = true;
		if (items['skalp_show_skill']!= null) show_skill = items['skalp_show_skill'];
		var skillCheckbox = document.getElementById("show_skill");
        skillCheckbox.checked = show_skill;

        show_cost = false;
		if (items['skalp_show_cost']!= null) show_cost = items['skalp_show_cost'];
		var costCheckbox = document.getElementById("show_cost");
        costCheckbox.checked = show_cost;
		
        show_coef = false;
		if (items['skalp_show_coef']!= null) show_coef = items['skalp_show_coef'];
		var costCheckbox = document.getElementById("show_coef");
        costCheckbox.checked = show_coef;


        show_month = false;
		if (items['skalp_show_month']!= null) show_month = items['skalp_show_month'];
		var monthCheckbox = document.getElementById("show_month");
        monthCheckbox.checked = show_month;

        // show_smiles = true;
        // if (items['skalp_show_smiles']!= null) show_smiles = items['skalp_show_smiles'];
        // var smilesCheckbox = document.getElementById("show_smiles");
        // smilesCheckbox.checked = show_smiles;

        currency_id = 'usd';
        if (items['skalp_currency_id']!= null) currency_id = items['skalp_currency_id'];
        var currencyCheckbox = document.getElementById("currency_id");
        currencyCheckbox.value = currency_id;

        currency_profile_id = 'usd';
        if (items['skalp_currency_profile_id']!= null) currency_profile_id = items['skalp_currency_profile_id'];
        var currencyProfileCheckbox = document.getElementById("currency_profile_id");
        currencyProfileCheckbox.value = currency_profile_id;

        date_pay = '5';
        if (items['skalp_date_pay']!= null) date_pay = items['skalp_date_pay'];
        var datePayInput = document.getElementById("date_pay");
        datePayInput.value = date_pay;
    });
}