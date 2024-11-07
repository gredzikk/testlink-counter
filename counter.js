// ==UserScript==
// @name         Custom Action on Button Click with Count
// @namespace    http://tampermonkey.net/
// @version      1.9
// @description  Add custom actions to button clicks on the webpage and keep track of click count, with option to save results to CSV, including "dlms-xxxx" value, and reset counter on next day or manually reset local storage, and extract URL parameters, with confirmation to reset local storage
// @author       You
// @match        https://testlinkmt.apator.com/lib/execute/execSetResults.php*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Function to add custom action
    function addCustomAction(button) {
        button.addEventListener('click', function() {
            const testId = button.name.match(/\d+/)[0];
            const status = button.id.match(/fastExec([pbf])/)[1];
            const dlmsValue = extractDlmsValue();
            const urlParams = extractUrlParams();

            const clickCount = incrementClickCount(status, testId, dlmsValue, urlParams);

            alert(`Testy wykonane dzisiaj (${status}): ${clickCount}`);
        });
    }

    function extractDlmsValue() {
        const dlmsElement = document.querySelector('.exec_tc_title');
        if (dlmsElement) {
            const match = dlmsElement.textContent.match(/dlms-\d+/);
            if (match) {
                return match[0];
            }
        }
        return 'dlms-unknown';
    }

    function extractUrlParams() {
        const params = new URLSearchParams(window.location.search);
        return {
            version_id: params.get('version_id') || 'unknown',
            id: params.get('id') || 'unknown',
            tplan_id: params.get('tplan_id') || 'unknown',
            setting_build: params.get('setting_build') || 'unknown'
        };
    }

    function incrementClickCount(status, testId, dlmsValue, urlParams) {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const datetime = now.toISOString();

        const lastDateKey = 'lastDate';
        const lastDate = localStorage.getItem(lastDateKey);
        if (lastDate !== today) {
            localStorage.setItem(lastDateKey, today);
            localStorage.setItem('totalClickCount', 0);
        }

        let totalClickCount = parseInt(localStorage.getItem('totalClickCount')) || 0;
        totalClickCount++;
        localStorage.setItem('totalClickCount', totalClickCount);

        const clickDetailsKey = `clickDetails_${datetime}_${status}_${testId}`;
        localStorage.setItem(clickDetailsKey, JSON.stringify({
            datetime,
            tests_today: totalClickCount,
            status,
            testId,
            dlmsValue,
            version_id: urlParams.version_id,
            id: urlParams.id,
            tplan_id: urlParams.tplan_id,
            setting_build: urlParams.setting_build
        }));

        console.log(`Testy dnia ${today}: ${totalClickCount}`);
        return totalClickCount;
    }

    function generateCSV() {
        const csvRows = ['datetime;tests_today;status;dlms_value;test_id;version_id;id;tplan_id;setting_build'];
        const today = new Date().toISOString().split('T')[0];
        const clickDetailsArray = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('clickDetails_')) {
                const clickDetails = JSON.parse(localStorage.getItem(key));
                if (clickDetails.datetime.startsWith(today)) {
                    clickDetailsArray.push(clickDetails);
                }
            }
        }

        clickDetailsArray.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

        clickDetailsArray.forEach(clickDetails => {
            csvRows.push(`${clickDetails.datetime};${clickDetails.tests_today};${clickDetails.status};${clickDetails.dlmsValue};${clickDetails.testId};${clickDetails.version_id};${clickDetails.id};${clickDetails.tplan_id};${clickDetails.setting_build}`);
        });

        const csvContent = csvRows.join('\n');
        downloadCSV(csvContent);
    }

    function downloadCSV(csvContent) {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wykonania_testow.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function clearLocalStorage() {
        if (confirm('Na pewno chcesz usunąć pamięć podręczną? Akcja jest nieodwracalna.')) {
            localStorage.clear();
            alert('Pamięć podręczna została wyczyszczona.');
        }
    }

    function addDownloadButton() {
        const button = document.createElement('button');
        button.textContent = 'Pobierz dzisiejsze wykonania';
        button.style.position = 'fixed';
        button.style.bottom = '50px';
        button.style.left = '10px';
        button.style.padding = '10px 20px';
        button.style.backgroundColor = '#4CAF50';
        button.style.color = 'green';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        button.style.cursor = 'pointer';
        button.style.fontSize = '14px';
        button.style.zIndex = '1000';
        button.addEventListener('click', generateCSV);
        document.body.appendChild(button);

        button.addEventListener('mouseover', function() {
            button.style.backgroundColor = '#45a049';
        });
        button.addEventListener('mouseout', function() {
            button.style.backgroundColor = '#4CAF50';
        });
    }

    function addClearButton() {
        const button = document.createElement('button');
        button.textContent = 'Resetuj lokalne dane';
        button.style.position = 'fixed';
        button.style.bottom = '10px';
        button.style.left = '10px';
        button.style.padding = '10px 20px';
        button.style.backgroundColor = '#f44336';
        button.style.color = 'red';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        button.style.cursor = 'pointer';
        button.style.fontSize = '14px';
        button.style.zIndex = '1000';
        button.addEventListener('click', clearLocalStorage);
        document.body.appendChild(button);

        button.addEventListener('mouseover', function() {
            button.style.backgroundColor = '#e53935';
        });
        button.addEventListener('mouseout', function() {
            button.style.backgroundColor = '#f44336';
        });
    }

    const buttons = document.querySelectorAll('img[id^="fastExec"]');
    buttons.forEach(addCustomAction);

    addDownloadButton();
    addClearButton();
})();